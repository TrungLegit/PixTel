import fs from "node:fs";
import path from "node:path";
import { createFrame, clearFrame, createFx, composite, hex, mix, posedStyled, poseAt, READY } from "../../src/vfx/pixelfx/core/index.js";
import { loadEffect, edgeFade } from "../../.agents/skills/pixelfx/scripts/lib/fxlib.mjs";

const ROOT = process.cwd();
const CACHE_DIR = path.join(ROOT, "node_modules", ".cache", "b1_preview_cache");
fs.mkdirSync(CACHE_DIR, { recursive: true });

// -------------------------------------------------------------------------
// 1. Dump 3D Rigged Hero Poses for the 4 Batch 1 Items
// -------------------------------------------------------------------------

function rampFromHex(baseHex, darkHex = "#111322", hiHex = "#ffffff") {
  const b = hex(baseHex) >>> 0;
  const d = hex(darkHex) >>> 0;
  const h = hex(hiHex) >>> 0;
  return [mix(b, h, 0.42) >>> 0, b, mix(b, d, 0.38) >>> 0, mix(b, d, 0.68) >>> 0];
}
function rampList(list) {
  return list.map((c) => hex(c) >>> 0);
}
const SKIN_RAMP = rampList(["#ffe0c4", "#f0b98e", "#c98b63", "#8f5940"]);
const BOOTS_RAMP = rampList(["#9c7352", "#785338", "#573924", "#362214"]);
const INK_DEFAULT = hex("#0e0c18") >>> 0;
const SEAM_DEFAULT = hex("#222436") >>> 0;

function makeWpnColors(baseHex, accentHex, kind) {
  const bU = hex(baseHex) >>> 0;
  const eU = hex(accentHex) >>> 0;
  const wU = hex("#ffffff") >>> 0;
  const wc = {
    hi: mix(eU, wU, 0.55) >>> 0,
    a: mix(bU, wU, 0.25) >>> 0,
    b: bU,
    d: mix(bU, hex("#161524") >>> 0, 0.45) >>> 0,
    gold: eU,
    goldD: mix(eU, hex("#2a1b10") >>> 0, 0.45) >>> 0,
  };
  if (kind === "staff") {
    wc.wood = mix(bU, hex("#5e3c24") >>> 0, 0.4) >>> 0;
    wc.woodD = mix(wc.wood, hex("#180e08") >>> 0, 0.55) >>> 0;
  } else if (kind === "gun") {
    wc.olive = bU;
    wc.oliveA = mix(bU, wU, 0.35) >>> 0;
    wc.oliveD = mix(bU, hex("#101418") >>> 0, 0.5) >>> 0;
  }
  return wc;
}

function renderRigTile(pose, theme, outPath, boxW = 108, boxH = 108) {
  let rigScale = 2;
  let out = posedStyled(pose, theme, rigScale);
  let sprW = out.x1 - out.x0 + 1;
  let sprH = out.y1 - out.y0 + 1;
  if (sprW > boxW - 6 || sprH > boxH - 6) {
    const fitRatio = Math.min((boxW - 8) / sprW, (boxH - 8) / sprH);
    rigScale = Math.max(0.9, Math.floor(rigScale * fitRatio * 20) / 20);
    out = posedStyled(pose, theme, rigScale);
    sprW = out.x1 - out.x0 + 1;
    sprH = out.y1 - out.y0 + 1;
    while ((sprW > boxW - 6 || sprH > boxH - 6) && rigScale > 0.75) {
      rigScale = Number((rigScale - 0.05).toFixed(2));
      out = posedStyled(pose, theme, rigScale);
      sprW = out.x1 - out.x0 + 1;
      sprH = out.y1 - out.y0 + 1;
    }
  }
  const rgba = new Uint8Array(boxW * boxH * 4);
  // Fill dark pedestal bg #0c0918
  for (let i = 0; i < boxW * boxH; i++) {
    rgba[i * 4 + 0] = 12;
    rgba[i * 4 + 1] = 9;
    rgba[i * 4 + 2] = 24;
    rgba[i * 4 + 3] = 255;
  }
  // Center bounding box cleanly inside tile (100% unclipped)
  const offX = Math.floor((boxW - sprW) / 2) - out.x0;
  const offY = Math.floor((boxH - sprH) / 2) - out.y0;

  for (let i = 0; i < out.n; i++) {
    const px = out.xs[i] + offX;
    const py = out.ys[i] + offY;
    if (px < 0 || px >= boxW || py < 0 || py >= boxH) continue;
    const col = out.color[i];
    const r = col & 255;
    const g = (col >>> 8) & 255;
    const b = (col >>> 16) & 255;
    const a = (col >>> 24) & 255;
    if (a === 0) continue;
    const idx = (py * boxW + px) * 4;
    rgba[idx + 0] = r;
    rgba[idx + 1] = g;
    rgba[idx + 2] = b;
    rgba[idx + 3] = 255;
  }
  // Additive soft glow halos
  for (const gw of out.glows ?? []) {
    const gx = Math.round(gw.x) + offX;
    const gy = Math.round(gw.y) + offY;
    const rad = Math.max(2, Math.round(gw.radius));
    const gr = gw.color & 255;
    const gg = (gw.color >>> 8) & 255;
    const gb = (gw.color >>> 16) & 255;
    for (let dy = -rad; dy <= rad; dy++) {
      for (let dx = -rad; dx <= rad; dx++) {
        const px = gx + dx;
        const py = gy + dy;
        if (px < 0 || px >= boxW || py < 0 || py >= boxH) continue;
        const d = Math.hypot(dx, dy);
        if (d > rad) continue;
        const k = (1 - d / rad) * 0.28;
        const idx = (py * boxW + px) * 4;
        rgba[idx + 0] = Math.min(255, Math.round(rgba[idx + 0] + gr * k));
        rgba[idx + 1] = Math.min(255, Math.round(rgba[idx + 1] + gg * k));
        rgba[idx + 2] = Math.min(255, Math.round(rgba[idx + 2] + gb * k));
      }
    }
  }
  fs.writeFileSync(outPath, Buffer.from(rgba));
}

const RIG_CASES = [
  {
    id: "b1_wpn_refract_lance",
    pose: poseAt(
      [
        [0, { ...READY, two: true, crouch: 5.5, lean: -4, yaw: 0.35, fx: -4, fy: -21, sa: -0.22 }],
        [0.2, { ...READY, two: true, crouch: 4.5, lean: 6, yaw: -0.18, fx: 19, fy: -22, sa: 0, toeB: true }],
        [1, { ...READY, two: true, crouch: 2.5, lean: 1, fx: 12, fy: -21, sa: -0.35 }],
      ],
      0.22
    ),
    poseExtra: { weapon: "b1_refract_lance", two: true, face: 1 },
    theme: {
      bareHands: false,
      headgear: "plume_helm",
      backAccessory: "cape",
      shielded: true,
      shell: rampList(["#ffffff", "#b8daf8", "#5b9be0", "#2f579e"]),
      core: rampList(["#637ea6", "#42587a", "#2b3a54", "#1b2538"]),
      head: rampList(["#8ceeff", "#48b6e6", "#2a70a6", "#193e66"]),
      face: SKIN_RAMP,
      boots: BOOTS_RAMP,
      cloak: rampList(["#7af4ff", "#30a6e8", "#1c5eb8", "#103275"]),
      hair: rampList(["#8ceeff", "#48b6e6", "#2a70a6", "#193e66"]),
      shield: rampList(["#ffffff", "#66eeff", "#268bd6", "#164882"]),
      ink: INK_DEFAULT,
      seam: SEAM_DEFAULT,
      mark: hex("#5ef2ff") >>> 0,
      eye: hex("#7af8ff") >>> 0,
      weaponColors: makeWpnColors("#2cc8f5", "#ff99ee", "polearm"),
    },
  },
  {
    id: "b1_wpn_tempest_astrolabe",
    pose: poseAt(
      [
        [0, { ...READY, two: true, crouch: 4, y: 0, lean: -1, fx: 7, fy: -22, sa: -1.45 }],
        [0.24, { ...READY, two: true, crouch: -2, y: -5, lean: -3, fx: 9, fy: -40, sa: -1.62, toeF: true }],
        [0.6, { ...READY, two: true, crouch: 1, y: -3.5, lean: 5, fx: 20, fy: -29, sa: -0.18 }],
        [1, { ...READY, two: true, crouch: 2, y: 0, lean: 1, fx: 10, fy: -19, sa: -1.1 }],
      ],
      0.55
    ),
    poseExtra: { weapon: "b1_tempest_astrolabe", two: true, face: 1 },
    theme: {
      bareHands: false,
      headgear: "wizard_hat",
      backAccessory: "cape",
      shielded: false,
      shell: rampList(["#ff9ef2", "#d848ba", "#8e248a", "#4e1454"]),
      core: rampList(["#704494", "#4d2b6b", "#331c4a", "#1f0e30"]),
      head: rampList(["#fff2ff", "#e8a8ff", "#ab66cf", "#6b388c"]),
      face: SKIN_RAMP,
      boots: BOOTS_RAMP,
      cloak: rampList(["#ffeb8a", "#e68af0", "#9132bd", "#4e1578"]),
      hair: rampList(["#fff2ff", "#e8a8ff", "#ab66cf", "#6b388c"]),
      ink: INK_DEFAULT,
      seam: SEAM_DEFAULT,
      mark: hex("#ff7ae2") >>> 0,
      eye: hex("#ffee66") >>> 0,
      weaponColors: makeWpnColors("#24b89e", "#ffe844", "staff"),
    },
  },
  {
    id: "b1_wpn_chrono_disruptor",
    pose: poseAt(
      [
        [0, { ...READY, two: true, crouch: 5, lean: 4, fx: 17, fy: -24, bx: 8, by: -22, sa: 0 }],
        [0.18, { ...READY, two: true, crouch: 2, y: -3, lean: -6, fx: 4, fy: -29, bx: 1, by: -25, sa: -0.58, toeF: true }],
        [1, { ...READY, two: true, crouch: 3, y: 0, lean: 1, fx: 13, fy: -22, bx: 6, by: -21, sa: 0 }],
      ],
      0.2
    ),
    poseExtra: { weapon: "b1_chrono_disruptor", two: true, face: 1 },
    theme: {
      bareHands: false,
      headgear: "tinker_goggles",
      backAccessory: "volt_pack",
      shielded: false,
      shell: rampList(["#9effc8", "#3fd482", "#208c54", "#114f31"]),
      core: rampList(["#ffd970", "#bd862a", "#785016", "#472d0a"]),
      head: rampList(["#ffd48a", "#d49144", "#8c531e", "#542e0c"]),
      face: SKIN_RAMP,
      boots: BOOTS_RAMP,
      cloak: rampList(["#ffee7a", "#44ee88", "#20995c", "#115435"]),
      hair: rampList(["#ffd48a", "#d49144", "#8c531e", "#542e0c"]),
      ink: INK_DEFAULT,
      seam: SEAM_DEFAULT,
      mark: hex("#44ee88") >>> 0,
      eye: hex("#ffe066") >>> 0,
      weaponColors: makeWpnColors("#28b8e6", "#ffaa33", "gun"),
    },
  },
  {
    id: "b1_arm_crimson_ward",
    pose: { ...READY, face: 1, yaw: -0.65, crouch: 2, lean: 2, fx: 13, fy: -21, sa: -0.55 },
    poseExtra: { weapon: "sword", face: 1 },
    theme: {
      bareHands: false,
      headgear: "plume_helm",
      backAccessory: "b1_crimson_ward",
      shielded: false,
      shell: rampFromHex("#9f1239"),
      core: rampList(["#637ea6", "#42587a", "#2b3a54", "#1b2538"]),
      head: rampFromHex("#9f1239"),
      face: SKIN_RAMP,
      boots: BOOTS_RAMP,
      cloak: rampFromHex("#fb7185", "#0e0a1a", "#ffffff"),
      hair: rampList(["#8ceeff", "#48b6e6", "#2a70a6", "#193e66"]),
      ink: INK_DEFAULT,
      seam: SEAM_DEFAULT,
      mark: hex("#f43f5e") >>> 0,
      eye: hex("#fb7185") >>> 0,
      weaponColors: makeWpnColors("#9f1239", "#fb7185", "sword"),
    },
  },
];

for (const rc of RIG_CASES) {
  const fullPose = { ...rc.pose, ...rc.poseExtra };
  renderRigTile(fullPose, rc.theme, path.join(CACHE_DIR, `rig_${rc.id}.rgba`), 108, 108);
  console.log(`[export] Rendered 3D rig pose for ${rc.id}`);
}

// -------------------------------------------------------------------------
// 2. Dump VFX Animation Frames (Checkerboard Sheet + Solid GIF Frames)
// -------------------------------------------------------------------------

const VFX_ITEMS = [
  { itemId: "b1_wpn_refract_lance", fxId: "pixtel/b1_item_refract_lance" },
  { itemId: "b1_wpn_tempest_astrolabe", fxId: "pixtel/b1_item_tempest_astrolabe" },
  { itemId: "b1_wpn_chrono_disruptor", fxId: "pixtel/b1_item_chrono_disruptor" },
  { itemId: "b1_arm_crimson_ward", fxId: "pixtel/b1_item_crimson_ward" },
];

const bgDark = hex("#181a26");
const bgLight = hex("#1e2132");

const vfxManifest = [];
for (const entry of VFX_ITEMS) {
  const fx = await loadEffect(entry.fxId);
  const { meta, mod } = fx;
  const [W, H] = meta.size;
  const [OX, OY] = meta.origin;
  const fps = meta.fps ?? 24;
  const D = meta.duration ?? 0.8;
  const n = Math.round(D * fps) + (meta.loop ? 0 : 1);
  const dt = 1 / fps;

  const fxDir = path.join(CACHE_DIR, entry.itemId);
  fs.mkdirSync(fxDir, { recursive: true });

  const bgChecker = new Uint32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const alt = ((x >> 3) ^ (y >> 3)) & 1;
      bgChecker[y * W + x] = alt ? bgLight : bgDark;
    }
  }

  const bare = createFrame(W, H, 0, 0);
  const sheetBuf = new Uint8ClampedArray(W * H * 4);
  const gifBuf = new Uint8ClampedArray(W * H * 4);
  const inst = createFx(mod, { x: OX, y: OY, seed: meta.options?.seed ?? 11 });

  const timestamps = [];
  for (let i = 0; i < n; i++) {
    const t = i * dt;
    timestamps.push(Number(t.toFixed(3)));
    clearFrame(bare);
    inst.draw(bare);
    edgeFade(bare);

    composite(bare, sheetBuf, bgChecker);
    composite(bare, gifBuf, bgDark);

    const pad = String(i).padStart(3, "0");
    fs.writeFileSync(path.join(fxDir, `sheet_f${pad}.rgba`), Buffer.from(sheetBuf));
    fs.writeFileSync(path.join(fxDir, `gif_f${pad}.rgba`), Buffer.from(gifBuf));
    if (i < n - 1) inst.update(dt);
  }

  vfxManifest.push({
    itemId: entry.itemId,
    fxId: entry.fxId,
    name: meta.name,
    desc: meta.desc,
    w: W,
    h: H,
    fps,
    duration: D,
    loop: Boolean(meta.loop),
    n,
    timestamps,
  });
  console.log(`[export] Dumped ${n} frames (${W}x${H} @ ${fps}fps) for ${entry.fxId}`);
}

fs.writeFileSync(path.join(CACHE_DIR, "manifest.json"), JSON.stringify(vfxManifest, null, 2));
