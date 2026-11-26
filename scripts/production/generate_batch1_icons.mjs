import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ROOT = process.cwd();
const P = require(path.join(ROOT, ".agents", "skills", "codixel", "core", "pixel.js"));

const ASSETS_DIR = path.join(ROOT, "src", "assets");
const CACHE_DIR = path.join(ROOT, "node_modules", ".cache");
fs.mkdirSync(CACHE_DIR, { recursive: true });

const RAMPS = {
  quartz: P.hueRamp(6, { hue: 196, shift: 42, sat: 0.86, light: [0.18, 0.9] }),
  prism: P.hueRamp(6, { hue: 184, shift: 55, sat: 0.9, light: [0.24, 0.94] }),
  magenta: P.hueRamp(6, { hue: 306, shift: 45, sat: 0.82, light: [0.18, 0.86] }),
  teal: P.hueRamp(6, { hue: 168, shift: 44, sat: 0.84, light: [0.18, 0.88] }),
  gold: P.hueRamp(6, { hue: 44, shift: 48, sat: 0.9, light: [0.2, 0.92] }),
  amber: P.hueRamp(6, { hue: 24, shift: 52, sat: 0.9, light: [0.18, 0.88] }),
  cyber: P.hueRamp(6, { hue: 202, shift: 44, sat: 0.88, light: [0.18, 0.9] }),
  obsidian: P.hueRamp(5, { hue: 266, shift: 34, sat: 0.38, light: [0.12, 0.56] }),
  crimson: P.hueRamp(6, { hue: 346, shift: 45, sat: 0.88, light: [0.18, 0.86] }),
  ruby: P.hueRamp(6, { hue: 352, shift: 42, sat: 0.88, light: [0.18, 0.88] }),
  wood: P.hueRamp(5, { hue: 28, shift: 32, sat: 0.5, light: [0.16, 0.64] }),
  steel: P.hueRamp(6, { hue: 215, shift: 35, sat: 0.24, light: [0.18, 0.86] }),
};

const WHITE = P.rgb(255, 255, 255);
const INK = P.rgb(16, 12, 26);

function unpackRgb(c) {
  return [c & 255, (c >>> 8) & 255, (c >>> 16) & 255];
}

function stamp(dst, src, ox = 0, oy = 0) {
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const c = src.px[y * src.w + x];
      if (c >>> 24) dst.pset(ox + x, oy + y, c);
    }
  }
}

function fillRect(b, x, y, w, h, c) {
  b.rect(x, y, x + w, y + h, c);
}

function finishIcon(work22, ramp, opts = {}) {
  const cleaned = opts.smooth === false ? work22 : P.smoothEdge(work22, { fill: false });
  const lit = opts.rim === false ? cleaned : P.rimLight(cleaned, ramp, { dir: [-1, -1], steps: 1 });
  const litCol = opts.litOutline ?? ramp[1];
  const shadeCol = opts.shadeOutline ?? INK;
  const outlined = P.selout(lit, litCol, shadeCol, { dir: [-1, -1] });
  if (outlined.w === 24 && outlined.h === 24) return outlined;
  const out = new P.Buf(24, 24);
  stamp(out, outlined, Math.floor((24 - outlined.w) / 2), Math.floor((24 - outlined.h) / 2));
  return out;
}

function shadeMask(buf, maskFn, ramp, opts = {}) {
  const lx = opts.lx ?? -0.7;
  const ly = opts.ly ?? -0.7;
  const cx = opts.cx ?? buf.w * 0.5;
  const cy = opts.cy ?? buf.h * 0.5;
  const rx = opts.rx ?? buf.w * 0.45;
  const ry = opts.ry ?? buf.h * 0.45;
  for (let y = 0; y < buf.h; y++) {
    for (let x = 0; x < buf.w; x++) {
      if (!maskFn(x, y)) continue;
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      const dot = nx * lx + ny * ly;
      const v = P.clamp(0.54 + dot * 0.52 + (opts.bias ?? 0));
      const idx = P.band(v, ramp.length, x, y, 0.28);
      buf.pset(x, y, ramp[idx]);
    }
  }
}

function makeCodixelGem(size, ramp, sigma = [0.22, 0.85, 1.35], angle = 0.45) {
  const rgbCols = [unpackRgb(ramp[0]), ...ramp.map(unpackRgb), [255, 255, 255]];
  const hi = new P.Gem({
    size: Math.max(28, size * 3),
    cols: rgbCols,
    sigma,
    ior: 1.65,
    tilt: 24,
    lean: -18,
    exposure: 2.35,
    ss: 2,
  });
  const raw = hi.render(angle);
  const trimmed = P.trim(raw, 0);
  const q = P.quantize(trimmed, 7, { palette: rgbCols, dither: false }).buf;
  const res = P.resize(q, size, size, { mode: true });
  res.pset(Math.max(1, Math.floor(size * 0.28)), Math.max(1, Math.floor(size * 0.28)), WHITE);
  return res;
}

// 1. b1_refract_lance — Crystalline Quartz-Prism Lance
function buildRefractLanceIcon() {
  const b = new P.Buf(22, 22);
  // Diagonal dark indigo-obsidian shaft from (2,19) to (11,10)
  for (let i = 0; i <= 10; i++) {
    const x = 2 + i;
    const y = 19 - i;
    b.pset(x, y, RAMPS.obsidian[i % 2 === 0 ? 2 : 3]);
    b.pset(x + 1, y, RAMPS.obsidian[1]);
  }
  // Pommel cap
  fillRect(b, 1, 18, 2, 2, RAMPS.gold[3]);
  b.pset(1, 18, RAMPS.gold[5]);

  // Twin winged prism collar around (10,11)
  b.line(7, 8, 13, 14, RAMPS.magenta[3]);
  b.line(7, 9, 12, 14, RAMPS.magenta[4]);
  b.pset(7, 8, RAMPS.magenta[5]);
  b.pset(13, 14, RAMPS.magenta[2]);

  // Faceted diamond lance head along diagonal (10,11) -> (20,1)
  for (let y = 1; y <= 12; y++) {
    for (let x = 9; x <= 20; x++) {
      const u = (x - 10 + (11 - y)) / 20; // 0..1 along lance head
      const d = Math.abs(x - 10 - (11 - y)) * 0.707;
      if (u < 0 || u > 1.05) continue;
      const maxW = u < 0.28 ? 1.1 + u * 6.8 : Math.max(0.45, (1.05 - u) * 3.85);
      if (d > maxW) continue;
      const side = x - 10 - (11 - y) <= 0 ? 0.85 : 0.34;
      const v = P.clamp(side * 0.72 + u * 0.3);
      if (d < 0.55) {
        b.pset(x, y, u > 0.72 ? WHITE : RAMPS.prism[5]);
      } else {
        b.pset(x, y, RAMPS.quartz[P.band(v, RAMPS.quartz.length, x, y, 0.25)]);
      }
    }
  }
  // Prism core gem at collar
  fillRect(b, 10, 10, 2, 2, RAMPS.magenta[4]);
  b.pset(10, 10, WHITE);
  b.pset(20, 1, WHITE);
  return finishIcon(b, RAMPS.quartz, { smooth: false });
}

// 2. b1_tempest_astrolabe — Teal-Gold Astrolabe Catalyst Staff
function buildTempestAstrolabeIcon() {
  const b = new P.Buf(22, 22);
  // Staff shaft from (2,19) to (10,11)
  for (let i = 0; i <= 8; i++) {
    const x = 2 + i;
    const y = 19 - i;
    b.pset(x, y, RAMPS.wood[i % 2 === 0 ? 3 : 2]);
    b.pset(x + 1, y, RAMPS.wood[1]);
  }
  fillRect(b, 2, 18, 2, 2, RAMPS.gold[3]);
  // Gold collar
  b.line(9, 10, 12, 13, RAMPS.gold[4]);
  b.pset(9, 10, RAMPS.gold[5]);

  // Clean gold astrolabe ring centered at (14, 7), radius ~5.2
  const cx = 14, cy = 7;
  for (let y = 1; y <= 13; y++) {
    for (let x = 8; x <= 20; x++) {
      const dist = Math.hypot(x - cx, y - cy);
      if (dist >= 4.2 && dist <= 5.65) {
        const dot = (-(x - cx) - (y - cy)) / 8;
        const v = P.clamp(0.58 + dot * 0.42);
        b.pset(x, y, RAMPS.gold[P.band(v, RAMPS.gold.length, x, y, 0.18)]);
      }
    }
  }
  // Inner dark backing inside ring so tempest orb pops
  shadeMask(b, (x, y) => Math.hypot(x - cx, y - cy) < 4.2, RAMPS.obsidian, { cx: 14, cy: 7, rx: 4, ry: 4 });
  // Vivid glowing teal-cyan tempest core orb
  shadeMask(b, (x, y) => Math.hypot(x - cx, y - cy) <= 2.9, RAMPS.teal, { cx: 13.2, cy: 6.2, rx: 3, ry: 3, bias: 0.18 });
  b.pset(13, 6, WHITE);
  b.pset(14, 6, RAMPS.prism[5]);
  b.pset(13, 7, RAMPS.prism[5]);
  // Top-right gold star finial
  b.pset(18, 2, RAMPS.gold[5]);
  b.pset(19, 2, WHITE);
  return finishIcon(b, RAMPS.gold, { smooth: false });
}

// 3. b1_chrono_disruptor — Twin-Rail Cyber/Amber Quantum Mine Cannon
function buildChronoDisruptorIcon() {
  const b = new P.Buf(22, 22);
  // Heavy stock + angled pistol grip
  shadeMask(b, (x, y) => x >= 2 && x <= 7 && y >= 8 && y <= 14, RAMPS.obsidian, { cx: 4, cy: 10, rx: 4, ry: 4 });
  fillRect(b, 3, 14, 3, 5, RAMPS.obsidian[2]);
  b.line(3, 14, 3, 18, RAMPS.obsidian[3]);

  // Receiver body
  shadeMask(b, (x, y) => x >= 6 && x <= 14 && y >= 6 && y <= 14, RAMPS.cyber, { cx: 10, cy: 9, rx: 5, ry: 5 });

  // Upper & Lower splayed accelerator rails
  shadeMask(b, (x, y) => x >= 11 && x <= 20 && y >= 5 && y <= 7, RAMPS.cyber, { cx: 15, cy: 5, rx: 5, ry: 3 });
  shadeMask(b, (x, y) => x >= 11 && x <= 20 && y >= 13 && y <= 15, RAMPS.cyber, { cx: 15, cy: 13, rx: 5, ry: 3 });
  b.pset(20, 5, WHITE);
  b.pset(20, 14, RAMPS.cyber[4]);

  // Glowing amber chrono core inside open rail channel (y=8..12)
  fillRect(b, 9, 8, 8, 5, RAMPS.obsidian[1]);
  fillRect(b, 10, 9, 7, 3, RAMPS.amber[4]);
  b.line(11, 10, 17, 10, RAMPS.gold[5]);
  b.pset(12, 10, WHITE);
  b.pset(17, 9, RAMPS.prism[5]);
  b.pset(17, 11, RAMPS.prism[5]);
  b.pset(18, 10, WHITE);
  return finishIcon(b, RAMPS.cyber, { smooth: false });
}

// 4. b1_crimson_ward — Cursed Spiked Crimson-Obsidian Chestplate
function buildCrimsonWardIcon() {
  const b = new P.Buf(22, 22);
  // Spiked pauldrons (top-left & top-right)
  shadeMask(b, (x, y) => {
    const inL = x >= 2 && x <= 7 && y >= 2 && y <= 10 && y >= 5 - (x - 2);
    const inR = x >= 14 && x <= 19 && y >= 2 && y <= 10 && y >= 5 - (19 - x);
    return inL || inR;
  }, RAMPS.crimson, { cx: 9, cy: 5, rx: 8, ry: 5 });
  b.pset(2, 2, WHITE);
  b.pset(3, 3, RAMPS.crimson[5]);
  b.pset(19, 2, RAMPS.crimson[5]);
  b.pset(18, 3, RAMPS.crimson[4]);

  // Central obsidian-crimson ribbed breastplate
  shadeMask(b, (x, y) => {
    if (y < 5 || y > 19) return false;
    const half = y < 11 ? 6 : 6 - Math.floor((y - 11) * 0.32);
    return Math.abs(x - 10.5) <= half;
  }, RAMPS.crimson, { cx: 9, cy: 9, rx: 6, ry: 7 });

  // Obsidian armor ribs & V-collar shadow
  b.line(7, 6, 10, 9, RAMPS.obsidian[2]);
  b.line(14, 6, 11, 9, RAMPS.obsidian[2]);
  b.line(6, 14, 15, 14, RAMPS.obsidian[1]);
  b.line(7, 17, 14, 17, RAMPS.obsidian[1]);

  // Glowing cursed blood-ruby heart gem at chest center (deep ruby + 1px glint)
  fillRect(b, 9, 9, 4, 4, RAMPS.obsidian[0]);
  fillRect(b, 10, 10, 2, 2, RAMPS.ruby[4]);
  b.pset(10, 10, WHITE);
  b.pset(11, 11, RAMPS.ruby[2]);
  return finishIcon(b, RAMPS.crimson, { smooth: false });
}

// 5. ws_b1_refract_lance — Skill [E]: Piercing Ice-Lance + 3 Diverging Prism Rays
function buildWsRefractLanceIcon() {
  const b = new P.Buf(22, 22);
  // Incoming cyan lance beam from (1,11) to prism core (9,11)
  b.line(1, 10, 8, 10, RAMPS.quartz[4]);
  b.line(1, 11, 9, 11, WHITE);
  b.line(1, 12, 8, 12, RAMPS.quartz[3]);

  // Central prism diamond
  b.poly([[9, 7], [13, 11], [9, 15], [5, 11]], RAMPS.magenta[4]);
  b.line(7, 9, 11, 9, RAMPS.prism[5]);
  b.pset(9, 11, WHITE);

  // 3 diverging prism refraction beams fanning right
  b.line(12, 9, 19, 3, RAMPS.magenta[4]);
  b.line(12, 10, 19, 4, RAMPS.magenta[5]);
  b.pset(19, 3, WHITE);

  b.line(13, 10, 20, 10, RAMPS.prism[5]);
  b.line(13, 11, 20, 11, WHITE);
  b.line(13, 12, 20, 12, RAMPS.quartz[3]);

  b.line(12, 12, 19, 18, RAMPS.gold[4]);
  b.line(12, 13, 18, 18, RAMPS.gold[5]);
  b.pset(19, 18, WHITE);

  return finishIcon(b, RAMPS.quartz, { smooth: false });
}

// 6. ws_b1_tri_cascade — Skill [E]: Wind Vortex Ring + Bold Lightning Strike
function buildWsTriCascadeIcon() {
  const b = new P.Buf(22, 22);
  const cx = 10.5, cy = 11.5;
  // Two crisp swirling teal wind arcs (top-left & bottom-right)
  for (let y = 2; y <= 20; y++) {
    for (let x = 2; x <= 20; x++) {
      const dist = Math.hypot(x - cx, y - cy);
      if (dist >= 5.6 && dist <= 7.8) {
        const ang = Math.atan2(y - cy, x - cx);
        if ((ang > -2.7 && ang < -0.7) || (ang > 0.4 && ang < 2.4)) {
          b.pset(x, y, dist < 6.7 ? RAMPS.teal[5] : RAMPS.teal[3]);
        }
      }
    }
  }
  // Bold golden-white jagged lightning bolt cutting diagonally down-left
  const segs = [
    [17, 2, 12, 7],
    [12, 7, 15, 9],
    [15, 9, 9, 15],
    [9, 15, 6, 19],
  ];
  for (const [x0, y0, x1, y1] of segs) {
    b.line(x0, y0, x1, y1, RAMPS.gold[5]);
    b.line(x0 - 1, y0, x1 - 1, y1, WHITE);
    b.line(x0 + 1, y0, x1 + 1, y1, RAMPS.gold[3]);
  }
  b.pset(10, 11, WHITE);
  return finishIcon(b, RAMPS.teal, { smooth: false });
}

// 7. ws_b1_chrono_mines — Skill [E]: 3 Linked Ice/Quake Quantum Mines
function buildWsChronoMinesIcon() {
  const b = new P.Buf(22, 22);
  const mines = [
    { x: 11, y: 6, ramp: RAMPS.amber },
    { x: 6, y: 15, ramp: RAMPS.cyber },
    { x: 16, y: 15, ramp: RAMPS.cyber },
  ];
  // Connecting quantum tether lines
  b.line(11, 8, 7, 13, RAMPS.prism[4]);
  b.line(11, 8, 15, 13, RAMPS.prism[4]);
  b.line(8, 15, 14, 15, RAMPS.prism[4]);

  for (const m of mines) {
    fillRect(b, m.x - 3, m.y - 2, 7, 5, RAMPS.obsidian[2]);
    fillRect(b, m.x - 2, m.y - 3, 5, 7, RAMPS.obsidian[2]);
    b.line(m.x - 2, m.y - 3, m.x + 2, m.y - 3, RAMPS.steel[3]);
    b.line(m.x - 3, m.y - 2, m.x - 3, m.y + 2, RAMPS.steel[3]);
    fillRect(b, m.x - 1, m.y - 1, 3, 3, m.ramp[4]);
    b.pset(m.x, m.y, WHITE);
  }
  return finishIcon(b, RAMPS.cyber, { smooth: false });
}

// 8. b1_passive_blood_frenzy — Cursed Cracked Blood-Shock Crest Badge
function buildPassiveBloodFrenzyIcon() {
  const b = new P.Buf(22, 22);
  const cx = 10.5, cy = 10.5;
  // Jagged obsidian-crimson 4-corner star aura behind ruby heart
  for (let y = 2; y <= 19; y++) {
    for (let x = 2; x <= 19; x++) {
      const dx = Math.abs(x - cx), dy = Math.abs(y - cy);
      if (dx + dy <= 8.5 && (dx <= 2.5 || dy <= 2.5 || dx + dy <= 6.2)) {
        b.pset(x, y, dx + dy <= 5.5 ? RAMPS.crimson[3] : RAMPS.crimson[2]);
      }
    }
  }
  shadeMask(b, (x, y) => Math.hypot(x - cx, y - cy) <= 5.2, RAMPS.ruby, { cx: 9, cy: 9, rx: 5, ry: 5 });
  // Dark cursed crack across the ruby core
  b.line(7, 7, 10, 10, RAMPS.obsidian[0]);
  b.line(10, 10, 13, 14, RAMPS.obsidian[0]);
  b.pset(9, 8, WHITE);
  b.pset(12, 9, RAMPS.crimson[5]);
  return finishIcon(b, RAMPS.crimson, { smooth: false });
}

const BATCH1_SPECS = [
  ["b1_refract_lance", buildRefractLanceIcon],
  ["b1_tempest_astrolabe", buildTempestAstrolabeIcon],
  ["b1_chrono_disruptor", buildChronoDisruptorIcon],
  ["b1_crimson_ward", buildCrimsonWardIcon],
  ["ws_b1_refract_lance", buildWsRefractLanceIcon],
  ["ws_b1_tri_cascade", buildWsTriCascadeIcon],
  ["ws_b1_chrono_mines", buildWsChronoMinesIcon],
  ["b1_passive_blood_frenzy", buildPassiveBloodFrenzyIcon],
];

const BATCH1_IDS = new Set(BATCH1_SPECS.map(([id]) => id));

// Load existing atlas & preserve indices 0..164 strictly untouched!
const existingPngPath = path.join(ASSETS_DIR, "codixel-icons.png");
const existingJsonPath = path.join(ASSETS_DIR, "codixel-icons.json");
const existingPng = P.load(existingPngPath);
const existingJson = JSON.parse(fs.readFileSync(existingJsonPath, "utf8"));

const baseEntries = [];
for (const [id, frame] of Object.entries(existingJson.frames)) {
  if (BATCH1_IDS.has(id)) continue;
  baseEntries.push({
    id,
    frame,
    buf: P.crop(existingPng, frame.x, frame.y, frame.w, frame.h),
  });
}

if (baseEntries.length !== 165) {
  throw new Error(`Expected 165 base icons (0..164), found ${baseEntries.length}`);
}

// Verify base indices match exact sequential 8-column packing
baseEntries.forEach((e, i) => {
  const ex = (i % 8) * 24;
  const ey = Math.floor(i / 8) * 24;
  if (e.frame.x !== ex || e.frame.y !== ey || e.frame.w !== 24 || e.frame.h !== 24) {
    throw new Error(`Base icon ${e.id} at index ${i} had non-standard frame ${JSON.stringify(e.frame)}`);
  }
});

// Build and validate all 8 Batch 1 icons
const newEntries = BATCH1_SPECS.map(([id, fn]) => {
  const buf = fn();
  if (buf.w !== 24 || buf.h !== 24) {
    throw new Error(`Icon ${id} size ${buf.w}x${buf.h} !== 24x24`);
  }
  const edge = P.edgeCheck(buf);
  const colors = P.colorCount(buf);
  const solid = colors.reduce((s, c) => s + (c.n ?? c.count ?? 0), 0);
  const topPct = colors[0] ? Math.round(((colors[0].n ?? colors[0].count ?? 0) / Math.max(1, solid)) * 100) : 0;
  console.log(
    `[codixel] ${id}: 24x24 solid=${solid}px colors=${colors.length} topColor=${topPct}% nubs=${edge.nubs.length} strips=${edge.strips.length} holes=${edge.holes.length}`
  );
  if (solid < 40) throw new Error(`Icon ${id} has too few solid pixels (${solid})`);
  return { id, buf };
});

const allEntries = [...baseEntries.map((e) => ({ id: e.id, buf: e.buf })), ...newEntries];
const ICON_COLS = 8;
const packed = P.pack(allEntries.map((e) => e.buf), { cols: ICON_COLS, pad: 0 });
P.save(packed, existingPngPath);

const newMap = {};
allEntries.forEach((e, i) => {
  newMap[e.id] = { x: (i % ICON_COLS) * 24, y: Math.floor(i / ICON_COLS) * 24, w: 24, h: 24 };
});
fs.writeFileSync(existingJsonPath, JSON.stringify({ tileSize: 24, frames: newMap }, null, 2));

const previewSheet = P.sheet(
  newEntries.map((e) => ({ buf: e.buf, label: e.id.toUpperCase().replace(/_/g, " "), scale: 4 })),
  { cols: 4, gap: 10, labelScale: 1 }
);
P.save(previewSheet, path.join(CACHE_DIR, "b1_icons_check.png"));

console.log(
  `[codixel] Packed ${allEntries.length} icons into ${packed.w}x${packed.h} (${existingPngPath}). Preserved 0..164.`
);
