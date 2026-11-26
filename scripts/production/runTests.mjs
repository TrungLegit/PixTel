#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const CACHE_DIR = path.join(ROOT_DIR, "node_modules", ".cache");

const VALID_SUITES = new Set(["feature", "batch", "all"]);

function printHelp() {
  console.log(`PixTel Cross-Platform Test Runner

Usage:
  node scripts/production/runTests.mjs [--suite=<feature|batch|all>] [--help]

Options:
  --suite=feature   Bundle and run tests/featureTests.ts
  --suite=batch     Bundle and run tests/batchProductionTests.ts (PIXTEL_BATCH_STANDALONE=1)
  --suite=all       Run feature then batch suites (default)
  -h, --help        Show this help message and exit 0
`);
}

function parseArgs(argv) {
  let suite = "all";
  let showHelp = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      showHelp = true;
      continue;
    }
    if (arg.startsWith("--suite=")) {
      suite = arg.slice("--suite=".length);
      continue;
    }
    if (arg === "--suite") {
      if (i + 1 >= argv.length) {
        console.error("[runTests] Missing value for --suite");
        process.exit(2);
      }
      suite = argv[++i];
      continue;
    }
    console.error(`[runTests] Unknown argument: ${arg}`);
    process.exit(2);
  }

  if (showHelp) {
    printHelp();
    process.exit(0);
  }

  if (!VALID_SUITES.has(suite)) {
    console.error(`[runTests] Invalid suite "${suite}". Expected one of: feature, batch, all.`);
    process.exit(2);
  }

  return { suite };
}

async function runBundle({ name, entryRel, outfileName, env = {} }) {
  const entryPath = path.join(ROOT_DIR, entryRel);
  if (!fs.existsSync(entryPath)) {
    console.error(`[runTests] Missing entry file for ${name}: ${entryPath}`);
    return 1;
  }

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const outPath = path.join(CACHE_DIR, outfileName);

  console.log(`[runTests] Bundling ${entryRel} -> ${path.relative(ROOT_DIR, outPath)}`);
  try {
    await esbuild.build({
      entryPoints: [entryPath],
      bundle: true,
      platform: "node",
      format: "esm",
      external: ["ws", "peerjs"],
      loader: { ".png": "dataurl" },
      outfile: outPath,
      logLevel: "warning",
    });
  } catch (err) {
    console.error(`[runTests] esbuild failed for ${name}:`, err);
    return 1;
  }

  console.log(`[runTests] Running ${name}...`);
  const res = spawnSync(process.execPath, [outPath], {
    cwd: ROOT_DIR,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });

  if (res.error) {
    console.error(`[runTests] Failed spawning Node for ${name}:`, res.error);
    return 1;
  }
  if (res.signal) {
    console.error(`[runTests] ${name} terminated by signal: ${res.signal}`);
    return 1;
  }
  return res.status ?? 1;
}

async function main() {
  const { suite } = parseArgs(process.argv.slice(2));
  const tasks = [];

  if (suite === "feature" || suite === "all") {
    tasks.push({
      name: "feature",
      entryRel: path.join("tests", "featureTests.ts"),
      outfileName: "featureTests.mjs",
      env: { PIXTEL_BATCH_STANDALONE: "0" },
    });
  }

  if (suite === "batch" || suite === "all") {
    tasks.push({
      name: "batch",
      entryRel: path.join("tests", "batchProductionTests.ts"),
      outfileName: "batchProductionTests.mjs",
      env: { PIXTEL_BATCH_STANDALONE: "1" },
    });
  }

  for (const task of tasks) {
    const code = await runBundle(task);
    if (code !== 0) {
      console.error(`[runTests] Suite "${task.name}" failed with exit code ${code}`);
      process.exit(code);
    }
  }

  console.log(`[runTests] All requested suites (${suite}) passed cleanly.`);
}

main().catch((err) => {
  console.error("[runTests] Unexpected runner error:", err);
  process.exit(1);
});
