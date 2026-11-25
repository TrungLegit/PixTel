import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ROOT = process.cwd();
const P = require(path.join(ROOT, ".agents", "skills", "codixel", "core", "pixel.js"));

const ASSETS_DIR = path.join(ROOT, "src", "assets");
const SCRATCH_DIR = "C:/Users/ADMIN/.gemini/antigravity/brain/df2ae07d-0719-4c2d-ba07-655ccbdc3295/scratch";
fs.mkdirSync(ASSETS_DIR, { recursive: true });
fs.mkdirSync(SCRATCH_DIR, { recursive: true });

// =========================================================================
// CODIXEL HUE-SHIFTED TIER RAMPS (strictly built with P.hueRamp)
// =========================================================================

const RAMPS = {
  steel: P.hueRamp(6, { hue: 215, shift: 35, sat: 0.24, light: [0.18, 0.86] }),
  wood: P.hueRamp(5, { hue: 28, shift: 32, sat: 0.5, light: [0.16, 0.64] }),
  copper: P.hueRamp(6, { hue: 26, shift: 42, sat: 0.72, light: [0.2, 0.84] }),
  cloth: P.hueRamp(5, { hue: 222, shift: 28, sat: 0.26, light: [0.22, 0.74] }),

  emerald: P.hueRamp(6, { hue: 142, shift: 48, sat: 0.76, light: [0.16, 0.86] }),
  quartz: P.hueRamp(6, { hue: 196, shift: 42, sat: 0.86, light: [0.18, 0.9] }),
  crimson: P.hueRamp(6, { hue: 346, shift: 45, sat: 0.88, light: [0.18, 0.86] }),
  magenta: P.hueRamp(6, { hue: 306, shift: 45, sat: 0.82, light: [0.18, 0.86] }),

  amber: P.hueRamp(6, { hue: 24, shift: 52, sat: 0.9, light: [0.18, 0.88] }),
  obsidian: P.hueRamp(5, { hue: 266, shift: 34, sat: 0.38, light: [0.12, 0.56] }),

  gold: P.hueRamp(6, { hue: 44, shift: 48, sat: 0.9, light: [0.2, 0.92] }),
  royal: P.hueRamp(6, { hue: 274, shift: 46, sat: 0.8, light: [0.18, 0.88] }),
  prism: P.hueRamp(6, { hue: 184, shift: 55, sat: 0.9, light: [0.24, 0.94] }),

  ruby: P.hueRamp(6, { hue: 352, shift: 42, sat: 0.88, light: [0.18, 0.88] }),
  teal: P.hueRamp(6, { hue: 168, shift: 44, sat: 0.84, light: [0.18, 0.88] }),
  glass: P.hueRamp(5, { hue: 204, shift: 24, sat: 0.32, light: [0.34, 0.94] }),
};

const WHITE = P.rgb(255, 255, 255);
const INK = P.rgb(16, 12, 26);

function fillRect(b, x, y, w, h, c) {
  b.rect(x, y, x + w, y + h, c);
}

function clearRect(b, x, y, w, h) {
  const x0 = Math.max(0, Math.round(x));
  const y0 = Math.max(0, Math.round(y));
  const x1 = Math.min(b.w, Math.round(x + w));
  const y1 = Math.min(b.h, Math.round(y + h));
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      b.px[yy * b.w + xx] = 0;
    }
  }
}

function unpackRgb(c) {
  return [c & 255, (c >>> 8) & 255, (c >>> 16) & 255];
}

/** Stamps src onto dst at (ox, oy), skipping transparent pixels. */
function stamp(dst, src, ox = 0, oy = 0) {
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const c = src.px[y * src.w + x];
      if (c >>> 24) dst.pset(ox + x, oy + y, c);
    }
  }
}

/** Applies codixel's rimLight + selout on a 22x22 work canvas -> 24x24 final icon. */
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

/** Shades a boolean mask using directional lighting + codixel P.band (flat bands + edge dither). */
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

/** Creates a bright faceted ray-traced codixel Gem buffer with vivid internal bounce. */
function makeCodixelGem(size, ramp, sigma = [0.22, 0.85, 1.35], angle = 0.45) {
  const rgbCols = [
    unpackRgb(ramp[0]),
    ...ramp.map(unpackRgb),
    [255, 255, 255],
  ];
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

// =========================================================================
// 1. ICON BUILDERS (24x24 each, built on 22x22 -> selout -> 24x24)
// =========================================================================

function buildSwordIcon(tier, style = "sword") {
  const b = new P.Buf(22, 22);
  const bladeRamp =
    tier === 1 ? RAMPS.steel :
    tier === 2 ? RAMPS.emerald :
    tier === 3 ? (style === "halberd" ? RAMPS.prism : RAMPS.quartz) :
    tier === 4 ? RAMPS.amber : RAMPS.gold;
  const guardRamp =
    tier === 1 ? RAMPS.steel :
    tier === 2 ? RAMPS.gold :
    tier === 3 ? RAMPS.quartz :
    tier === 4 ? RAMPS.obsidian : RAMPS.royal;

  if (style === "halberd") {
    for (let i = 0; i < 16; i++) {
      b.pset(3 + i, 18 - i, RAMPS.wood[i % 2 === 0 ? 2 : 3]);
      if (i > 1) b.pset(4 + i, 18 - i, RAMPS.wood[1]);
    }
    b.poly([[15, 6], [20, 1], [19, 6], [16, 8]], bladeRamp[4]);
    b.line(16, 5, 20, 1, WHITE);
    shadeMask(b, (x, y) => {
      const dx = x - 14.5, dy = y - 6.5;
      return dx * dx + dy * dy <= 22 && x + y <= 22 && x + y >= 15 && y <= 11;
    }, bladeRamp, { cx: 13, cy: 5, rx: 5, ry: 5 });
    b.pset(15, 6, WHITE);
    return finishIcon(b, bladeRamp, { smooth: false });
  }

  const halfW = tier >= 4 ? 2.15 : tier === 3 ? 1.7 : 1.35;
  for (let y = 1; y < 17; y++) {
    for (let x = 5; x < 21; x++) {
      const u = ((x - 6) + (15 - y)) / 24;
      const d = Math.abs((x - 6) - (15 - y)) * 0.707;
      if (u < 0.04 || u > 1.02) continue;
      let maxD = halfW * (u > 0.8 ? (1.03 - u) / 0.23 : 1);
      if (tier === 2 && u > 0.45 && u < 0.78) maxD += 0.55;
      if (tier === 4 && (Math.floor(u * 10) % 2 === 0) && u > 0.25 && u < 0.8) maxD += 0.48;
      if (tier === 5 && u > 0.15 && u < 0.85) maxD += 0.45;
      if (d > maxD) continue;
      const side = (x - 6) - (15 - y) <= 0 ? 0.85 : 0.34;
      const v = P.clamp(side * 0.75 + u * 0.32);
      if (tier === 4 && d < 0.55 && u > 0.18 && u < 0.78) {
        b.pset(x, y, RAMPS.gold[5]);
        continue;
      }
      if (tier === 5 && d < 0.5 && u > 0.2 && u < 0.82) {
        b.pset(x, y, RAMPS.prism[5]);
        continue;
      }
      const idx = P.band(v, bladeRamp.length, x, y, 0.25);
      b.pset(x, y, bladeRamp[idx]);
    }
  }
  b.pset(19, 2, WHITE);
  if (tier >= 3) b.pset(18, 3, WHITE);

  // Crossguard
  const gLen = tier >= 4 ? 4 : tier >= 2 ? 3 : 2;
  for (let k = -gLen; k <= gLen; k++) {
    const gx = 7 + k, gy = 14 + k;
    b.pset(gx, gy, guardRamp[k < 0 ? 4 : 2]);
    if (tier >= 3) b.pset(gx + 1, gy, guardRamp[3]);
    if (tier === 5 && Math.abs(k) === gLen) {
      b.pset(gx, gy - 1, RAMPS.prism[4]);
      b.pset(gx + 1, gy - 1, WHITE);
    }
  }
  // Grip & Pommel
  for (let i = 1; i <= 4; i++) {
    b.pset(7 - i, 14 + i, RAMPS.wood[i % 2 === 0 ? 2 : 3]);
    b.pset(6 - i, 14 + i, RAMPS.wood[1]);
  }
  fillRect(b, 2, 17, 3, 3, guardRamp[3]);
  b.pset(2, 17, guardRamp[4]);

  if (tier >= 3) {
    const gemCol = tier === 5 ? RAMPS.prism[5] : tier === 4 ? RAMPS.ruby[4] : WHITE;
    fillRect(b, 6, 13, 2, 2, gemCol);
    b.pset(6, 13, WHITE);
  }

  return finishIcon(b, bladeRamp, { smooth: false });
}

function buildStaffIcon(tier) {
  const b = new P.Buf(22, 22);
  const shaftRamp = tier >= 4 ? RAMPS.obsidian : tier === 3 ? RAMPS.royal : RAMPS.wood;
  const orbRamp =
    tier === 1 ? RAMPS.quartz :
    tier === 2 ? RAMPS.emerald :
    tier === 3 ? RAMPS.magenta :
    tier === 4 ? RAMPS.amber : RAMPS.prism;
  const metalRamp = tier >= 4 ? RAMPS.gold : tier === 3 ? RAMPS.quartz : RAMPS.steel;

  for (let i = 0; i < 13; i++) {
    b.pset(3 + i, 18 - i, shaftRamp[3]);
    b.pset(4 + i, 18 - i, shaftRamp[1]);
  }
  fillRect(b, 12, 7, 4, 3, metalRamp[3]);
  if (tier >= 2) {
    b.line(11, 6, 13, 3, metalRamp[4]);
    b.line(16, 10, 19, 8, metalRamp[2]);
  }
  if (tier >= 4) {
    b.line(10, 4, 14, 1, RAMPS.gold[4]);
    b.line(17, 11, 20, 7, RAMPS.gold[3]);
  }
  if (tier === 5) {
    b.ring(16, 5, 5, 1, RAMPS.gold[4]);
    b.pset(16, 0, WHITE);
    b.pset(21, 5, WHITE);
  }

  const orbSz = tier >= 4 ? 7 : tier >= 2 ? 6 : 5;
  const sigma =
    tier === 2 ? [4.2, 0.4, 3.8] :
    tier === 3 ? [1.2, 4.5, 0.7] :
    tier === 4 ? [0.3, 3.6, 5.5] : [3.8, 0.8, 0.3];
  const gem = makeCodixelGem(orbSz, orbRamp, sigma, 0.35 + tier * 0.3);
  stamp(b, gem, Math.round(16 - orbSz / 2), Math.round(5 - orbSz / 2));
  b.pset(15, 4, WHITE);

  return finishIcon(b, orbRamp, { smooth: false });
}

function buildDaggerIcon(tier) {
  const b = new P.Buf(22, 22);
  const ramp =
    tier === 1 ? RAMPS.steel :
    tier === 2 ? RAMPS.emerald :
    tier === 3 ? RAMPS.crimson :
    tier === 4 ? RAMPS.amber : RAMPS.prism;
  const accRamp = tier === 3 ? RAMPS.prism : tier === 5 ? RAMPS.gold : RAMPS.wood;

  const drawSingle = (ox, oy, flip) => {
    for (let i = 0; i < 9; i++) {
      const dx = flip ? -i : i;
      const x = ox + dx, y = oy - i;
      b.pset(x, y, ramp[i > 6 ? 5 : i > 3 ? 4 : 3]);
      b.pset(x + (flip ? 1 : -1), y, ramp[i > 5 ? 3 : 2]);
      if (tier >= 4 && i > 2 && i < 7) b.pset(x, y + 1, ramp[1]);
    }
    b.pset(ox + (flip ? -9 : 9), oy - 9, WHITE);
    fillRect(b, ox - 1, oy, 3, 2, accRamp[3]);
    b.pset(ox + (flip ? 1 : -1), oy + 2, accRamp[2]);
    b.pset(ox + (flip ? 2 : -2), oy + 3, accRamp[1]);
  };

  drawSingle(7, 15, false);
  drawSingle(15, 16, true);
  if (tier === 5) {
    b.pset(11, 10, WHITE);
    b.pset(11, 9, RAMPS.gold[4]);
  }
  return finishIcon(b, ramp, { smooth: false });
}

function buildGunIcon(tier) {
  const b = new P.Buf(22, 22);
  const bodyRamp =
    tier === 1 ? RAMPS.steel :
    tier === 2 ? RAMPS.emerald :
    tier === 3 ? RAMPS.quartz :
    tier === 4 ? RAMPS.amber : RAMPS.royal;
  const glowRamp =
    tier === 1 ? RAMPS.copper :
    tier === 2 ? RAMPS.gold :
    tier === 3 ? RAMPS.prism :
    tier === 4 ? RAMPS.gold : RAMPS.prism;

  const x0 = tier >= 3 ? 2 : 4;
  const barrelLen = tier >= 5 ? 18 : tier >= 3 ? 16 : 13;
  const bodyH = tier >= 4 ? 6 : 5;

  shadeMask(b, (x, y) => x >= x0 && x < x0 + barrelLen && y >= 6 && y < 6 + bodyH, bodyRamp, {
    cx: x0 + barrelLen * 0.4, cy: 6, rx: 10, ry: 5,
  });

  const coilW = tier >= 4 ? 7 : 4;
  fillRect(b, x0 + 4, 8, coilW, 2, glowRamp[4]);
  b.pset(x0 + 5, 8, WHITE);

  if (tier >= 4) {
    fillRect(b, x0 + barrelLen - 4, 5, 4, 2, RAMPS.gold[4]);
    fillRect(b, x0 + barrelLen - 4, 11, 4, 2, RAMPS.gold[3]);
    b.pset(x0 + barrelLen - 1, 8, WHITE);
  }
  if (tier >= 3) {
    fillRect(b, x0 + 4, 4, 6, 2, bodyRamp[2]);
    b.pset(x0 + 9, 4, glowRamp[5]);
  }
  b.poly([[x0 + 2, 11], [x0 + 6, 11], [x0 + 4, 17], [x0 + 1, 17]], RAMPS.wood[2]);
  b.line(x0 + 2, 12, x0 + 1, 16, RAMPS.wood[3]);
  if (tier >= 3) {
    fillRect(b, 1, 9, 3, 4, bodyRamp[1]);
  }

  return finishIcon(b, bodyRamp, { smooth: false });
}

function buildHelmetIcon(tier) {
  const b = new P.Buf(22, 22);
  const ramp =
    tier === 1 ? RAMPS.cloth :
    tier === 2 ? RAMPS.emerald :
    tier === 3 ? RAMPS.quartz :
    tier === 4 ? RAMPS.amber : RAMPS.gold;

  shadeMask(b, (x, y) => {
    const dx = (x - 10.5) / 7.2, dy = (y - 12) / 6.8;
    return dx * dx + dy * dy <= 1 && y <= 16;
  }, ramp, { cx: 8, cy: 8, rx: 8, ry: 8 });

  if (tier === 1) {
    fillRect(b, 7, 11, 8, 5, INK);
    fillRect(b, 8, 12, 6, 4, RAMPS.wood[2]);
    b.line(6, 16, 15, 16, RAMPS.cloth[4]);
  } else if (tier === 2) {
    b.poly([[9, 2], [13, 3], [12, 6], [9, 6]], RAMPS.emerald[5]);
    b.pset(10, 3, WHITE);
    fillRect(b, 6, 12, 10, 3, INK);
    fillRect(b, 7, 13, 8, 1, RAMPS.gold[4]);
  } else if (tier === 3) {
    fillRect(b, 5, 10, 12, 4, INK);
    fillRect(b, 6, 11, 10, 2, RAMPS.prism[5]);
    fillRect(b, 7, 11, 4, 1, WHITE);
    b.poly([[10, 2], [12, 5], [9, 5]], RAMPS.prism[4]);
  } else if (tier === 4) {
    b.poly([[3, 3], [6, 8], [4, 10], [2, 5]], RAMPS.royal[3]);
    b.poly([[18, 3], [15, 8], [17, 10], [19, 5]], RAMPS.royal[2]);
    b.pset(3, 3, RAMPS.gold[5]);
    b.pset(18, 3, RAMPS.gold[5]);
    fillRect(b, 6, 11, 10, 3, INK);
    fillRect(b, 7, 12, 3, 1, RAMPS.gold[5]);
    fillRect(b, 12, 12, 3, 1, RAMPS.gold[5]);
  } else {
    const b2 = new P.Buf(22, 22);
    shadeMask(b2, (x, y) => x >= 5 && x <= 16 && y >= 10 && y <= 17, RAMPS.royal, { cx: 8, cy: 11, rx: 6, ry: 5 });
    fillRect(b2, 7, 13, 8, 2, INK);
    fillRect(b2, 8, 13, 6, 1, RAMPS.prism[5]);
    fillRect(b2, 4, 10, 14, 2, RAMPS.gold[3]);
    b2.poly([[4, 10], [5, 7], [7, 10]], RAMPS.gold[4]);
    b2.poly([[9, 10], [11, 6], [13, 10]], RAMPS.gold[5]);
    b2.poly([[15, 10], [17, 7], [18, 10]], RAMPS.gold[4]);
    b2.pset(11, 6, WHITE);
    fillRect(b2, 10, 9, 2, 2, RAMPS.prism[5]);
    b2.pset(10, 9, WHITE);
    fillRect(b2, 5, 2, 12, 2, RAMPS.prism[4]);
    fillRect(b2, 7, 2, 8, 1, WHITE);
    return finishIcon(b2, RAMPS.prism, { smooth: false, rim: false });
  }

  return finishIcon(b, ramp, { smooth: false });
}

function buildArmorIcon(tier) {
  const b = new P.Buf(22, 22);
  const ramp =
    tier === 1 ? RAMPS.cloth :
    tier === 2 ? RAMPS.emerald :
    tier === 3 ? RAMPS.quartz :
    tier === 4 ? RAMPS.amber : RAMPS.royal;
  const trim = tier >= 4 ? RAMPS.gold : tier === 3 ? RAMPS.prism : RAMPS.wood;

  shadeMask(b, (x, y) => {
    if (y < 5 || y > 18) return false;
    const half = y < 9 ? 7.5 : y < 14 ? 5.2 : 6.2;
    return Math.abs(x - 10.5) <= half;
  }, ramp, { cx: 8, cy: 8, rx: 8, ry: 9 });

  clearRect(b, 8, 4, 6, 3);
  fillRect(b, 9, 6, 4, 1, trim[4]);

  fillRect(b, 5, 14, 12, 2, trim[2]);
  fillRect(b, 9, 14, 4, 2, trim[4]);
  b.pset(10, 14, WHITE);

  if (tier >= 2) {
    fillRect(b, 2, 5, 4, 4, ramp[4]);
    fillRect(b, 16, 5, 4, 4, ramp[2]);
  }
  if (tier >= 3) {
    fillRect(b, 2, 5, 4, 1, trim[4]);
    fillRect(b, 16, 5, 4, 1, trim[3]);
    fillRect(b, 9, 9, 4, 3, RAMPS.prism[5]);
    b.pset(10, 9, WHITE);
  }
  if (tier === 4) {
    fillRect(b, 9, 9, 4, 3, RAMPS.gold[5]);
    b.pset(2, 4, RAMPS.gold[4]);
    b.pset(19, 4, RAMPS.gold[4]);
  }
  if (tier === 5) {
    b.poly([[1, 3], [5, 5], [4, 9], [1, 7]], RAMPS.gold[4]);
    b.poly([[20, 3], [16, 5], [17, 9], [20, 7]], RAMPS.gold[3]);
    b.pset(2, 4, WHITE);
    const gem = makeCodixelGem(5, RAMPS.prism, [3.5, 0.6, 0.3], 0.3);
    stamp(b, gem, 8, 8);
  }

  return finishIcon(b, ramp, { smooth: false });
}

function buildBootsIcon(tier) {
  const b = new P.Buf(22, 22);
  const ramp =
    tier === 1 ? RAMPS.wood :
    tier === 2 ? RAMPS.emerald :
    tier === 3 ? RAMPS.quartz :
    tier === 4 ? RAMPS.amber : RAMPS.royal;
  const trim = tier >= 4 ? RAMPS.gold : tier === 3 ? RAMPS.prism : RAMPS.steel;

  const drawBoot = (ox, oy) => {
    shadeMask(b, (x, y) => {
      const lx = x - ox, ly = y - oy;
      if (lx >= 0 && lx < 5 && ly >= 0 && ly < 11) return true;
      if (lx >= 0 && lx < 8 && ly >= 7 && ly < 11) return true;
      return false;
    }, ramp, { cx: ox + 1, cy: oy + 2, rx: 6, ry: 8 });
    fillRect(b, ox, oy, 5, 2, trim[4]);
    fillRect(b, ox, oy + 10, 8, 1, tier === 5 ? RAMPS.prism[5] : INK);
    if (tier === 2) {
      b.pset(ox - 1, oy + 2, WHITE);
      b.pset(ox - 1, oy + 3, RAMPS.emerald[5]);
    }
    if (tier >= 4) {
      b.pset(ox + 6, oy + 8, RAMPS.gold[5]);
    }
  };

  drawBoot(3, 5);
  drawBoot(12, 7);
  return finishIcon(b, ramp, { smooth: false });
}

function buildRingIcon(tier) {
  const b = new P.Buf(22, 22);
  const bandRamp =
    tier === 1 ? RAMPS.copper :
    tier === 2 ? RAMPS.emerald :
    tier === 3 ? RAMPS.steel : RAMPS.gold;
  const gemRamp =
    tier === 1 ? RAMPS.copper :
    tier === 2 ? RAMPS.emerald :
    tier === 3 ? RAMPS.quartz :
    tier === 4 ? RAMPS.ruby : RAMPS.prism;

  shadeMask(b, (x, y) => {
    const dx = x - 10.5, dy = y - 12.5;
    const r = Math.hypot(dx, dy);
    return r >= 4.2 && r <= 7.2;
  }, bandRamp, { cx: 8, cy: 9, rx: 7, ry: 7 });

  const gSize = tier >= 4 ? 8 : tier >= 2 ? 7 : 6;
  const sigma =
    tier === 1 ? [0.25, 0.9, 1.4] :
    tier === 2 ? [1.3, 0.25, 1.1] :
    tier === 3 ? [1.4, 0.5, 0.2] :
    tier === 4 ? [0.2, 1.4, 1.2] : [1.1, 0.3, 0.15];
  const gem = makeCodixelGem(gSize, gemRamp, sigma, 0.35 + tier * 0.25);
  stamp(b, gem, Math.round(11 - gSize / 2), Math.round(6 - gSize / 2));

  if (tier === 5) {
    b.pset(3, 5, RAMPS.crimson[5]);
    b.pset(18, 5, RAMPS.prism[5]);
    b.pset(11, 1, WHITE);
  }

  return finishIcon(b, bandRamp, { smooth: false });
}

function buildChipIcon(tier) {
  const b = new P.Buf(22, 22);
  const frameRamp = tier >= 4 ? RAMPS.royal : tier === 3 ? RAMPS.quartz : RAMPS.steel;
  const coreRamp =
    tier === 1 ? RAMPS.prism :
    tier === 2 ? RAMPS.emerald :
    tier === 3 ? RAMPS.prism :
    tier === 4 ? RAMPS.emerald : RAMPS.gold;

  const pinCol = tier >= 4 ? RAMPS.gold[4] : RAMPS.steel[4];
  for (const p of [6, 9, 12, 15]) {
    fillRect(b, p, 2, 1, 2, pinCol);
    fillRect(b, p, 18, 1, 2, pinCol);
    fillRect(b, 2, p, 2, 1, pinCol);
    fillRect(b, 18, p, 2, 1, pinCol);
  }
  shadeMask(b, (x, y) => x >= 4 && x <= 17 && y >= 4 && y <= 17, frameRamp, { cx: 7, cy: 7, rx: 10, ry: 10 });
  fillRect(b, 6, 6, 10, 10, INK);
  shadeMask(b, (x, y) => x >= 7 && x <= 14 && y >= 7 && y <= 14, coreRamp, { cx: 9, cy: 9, rx: 5, ry: 5 });
  fillRect(b, 9, 9, 4, 4, coreRamp[5]);
  b.pset(9, 9, WHITE);
  if (tier === 5) {
    b.pset(7, 7, RAMPS.prism[5]);
    b.pset(14, 14, RAMPS.crimson[5]);
  }
  return finishIcon(b, frameRamp, { smooth: false });
}

function buildPotionIcon(kind, tier) {
  const b = new P.Buf(22, 22);
  const liqRamp =
    kind === "hp" ? (tier === 5 ? RAMPS.prism : tier === 4 ? RAMPS.amber : RAMPS.ruby) :
    kind === "stamina" ? (tier >= 4 ? RAMPS.teal : RAMPS.emerald) :
    kind === "power" ? (tier === 5 ? RAMPS.crimson : tier === 3 ? RAMPS.gold : RAMPS.amber) :
    RAMPS.quartz;

  if (tier >= 4) {
    fillRect(b, 9, 2, 4, 3, RAMPS.gold[4]);
    b.pset(10, 2, WHITE);
  } else {
    fillRect(b, 9, 3, 4, 3, RAMPS.wood[3]);
    b.pset(9, 3, RAMPS.wood[4]);
  }
  fillRect(b, 8, 5, 6, 2, RAMPS.glass[4]);
  fillRect(b, 9, 7, 4, 2, RAMPS.glass[3]);

  const maskFn = (x, y) => {
    const dx = x - 10.5, dy = y - 14;
    if (kind === "aegis") {
      if (y < 9 || y > 19) return false;
      const half = y < 14 ? 6.2 : 6.2 * (1 - (y - 14) / 6.2);
      return Math.abs(dx) <= half;
    }
    if (tier === 1) {
      return Math.abs(dx) <= 4.0 && y >= 9 && y <= 19 && (y <= 16 || Math.hypot(dx, y - 16) <= 4.1);
    }
    if (tier === 2) {
      return Math.hypot(dx, dy) <= 5.8;
    }
    if (tier === 3) {
      return Math.abs(dx) + Math.abs(dy) <= 6.8;
    }
    if (tier === 4) {
      return (Math.hypot(dx * 0.85, dy) <= 5.8) || (y >= 9 && y <= 12 && Math.abs(dx) <= 6.2);
    }
    return Math.hypot(dx, dy) <= 6.2 || (Math.abs(dx) <= 7.2 && Math.abs(dy) <= 1.6);
  };

  shadeMask(b, (x, y) => maskFn(x, y) && y <= 11, RAMPS.glass, { cx: 8, cy: 10, rx: 6, ry: 6 });
  shadeMask(b, (x, y) => maskFn(x, y) && y > 11, liqRamp, { cx: 8, cy: 12, rx: 6, ry: 6 });

  for (let x = 5; x <= 16; x++) {
    if (maskFn(x, 12)) b.pset(x, 12, liqRamp[5]);
  }
  fillRect(b, 7, 11, 2, 4, WHITE);
  b.pset(7, 16, liqRamp[5]);

  if (tier >= 4) {
    for (let x = 5; x <= 16; x++) {
      if (maskFn(x, 10)) b.pset(x, 10, RAMPS.gold[4]);
    }
    b.pset(4, 7, RAMPS.gold[5]);
    b.pset(17, 7, RAMPS.gold[5]);
  }
  if (tier === 5) {
    b.pset(10, 1, WHITE);
    b.pset(3, 13, RAMPS.gold[5]);
    b.pset(18, 13, RAMPS.prism[5]);
  }

  return finishIcon(b, liqRamp, { smooth: false });
}

function buildMaterialIcon(kind) {
  const b = new P.Buf(22, 22);
  if (kind === "ore") {
    shadeMask(b, (x, y) => Math.hypot((x - 10.5) / 7.5, (y - 12) / 6.2) <= 1, RAMPS.wood, { cx: 8, cy: 9, rx: 7, ry: 7 });
    b.poly([[7, 8], [13, 7], [14, 11], [9, 12]], RAMPS.steel[4]);
    fillRect(b, 8, 8, 3, 2, WHITE);
    fillRect(b, 12, 13, 3, 2, RAMPS.steel[5]);
    return finishIcon(b, RAMPS.steel, { smooth: false });
  }
  if (kind === "core") {
    shadeMask(b, (x, y) => Math.hypot(x - 10.5, y - 10.5) <= 6.5, RAMPS.magenta, { cx: 8, cy: 8, rx: 6, ry: 6 });
    fillRect(b, 7, 8, 8, 2, RAMPS.prism[5]);
    fillRect(b, 9, 11, 6, 2, WHITE);
    b.pset(5, 6, RAMPS.prism[4]);
    b.pset(16, 15, RAMPS.crimson[5]);
    return finishIcon(b, RAMPS.magenta, { smooth: false });
  }
  const map = {
    prism: { ramp: RAMPS.prism, sigma: [1.3, 0.28, 0.15], angle: 0.35 },
    quartz: { ramp: RAMPS.quartz, sigma: [1.5, 0.45, 0.2], angle: 0.75 },
    amber: { ramp: RAMPS.amber, sigma: [0.18, 0.75, 1.6], angle: 0.15 },
    void: { ramp: RAMPS.royal, sigma: [0.65, 1.6, 0.3], angle: 1.05 },
  };
  const cfg = map[kind];
  const gem = makeCodixelGem(16, cfg.ramp, cfg.sigma, cfg.angle);
  stamp(b, gem, 3, 3);
  fillRect(b, 7, 5, 2, 2, WHITE);
  return finishIcon(b, cfg.ramp, { smooth: false, rim: false });
}

// =========================================================================
// 2. PAPER-DOLL OVERLAYS (24x24; 16x16 Hero sits at x=4..19, y=4..19 -> 3+hx, 3+hy in 22x22!)
// =========================================================================

function finishOverlay(work22, ramp, shadeCol = INK) {
  const lit = P.rimLight(work22, ramp, { dir: [-1, -1], steps: 1 });
  const out = P.selout(lit, ramp[1], shadeCol, { dir: [-1, -1] });
  if (out.w === 24 && out.h === 24) return out;
  const dst = new P.Buf(24, 24);
  stamp(dst, out, Math.floor((24 - out.w) / 2), Math.floor((24 - out.h) / 2));
  return dst;
}

/** Back-layer Capes & Wings drawn behind hero */
function buildPaperDollCape(tier) {
  const b = new P.Buf(22, 22);
  const ramp =
    tier === 1 ? RAMPS.cloth :
    tier === 2 ? RAMPS.emerald :
    tier === 3 ? RAMPS.quartz :
    tier === 4 ? RAMPS.amber : RAMPS.royal;

  if (tier === 1) {
    fillRect(b, 4, 10, 3, 5, ramp[2]);
    b.pset(4, 11, ramp[3]);
    b.pset(4, 14, ramp[1]);
  } else if (tier === 2) {
    shadeMask(b, (x, y) => x >= 3 && x <= 14 && y >= 9 && y <= 17 && (x <= 8 || y >= 13), ramp, { cx: 6, cy: 10, rx: 6, ry: 7 });
  } else if (tier === 3) {
    shadeMask(b, (x, y) => x >= 2 && x <= 15 && y >= 8 && y <= 18, ramp, { cx: 6, cy: 9, rx: 7, ry: 8 });
    b.line(3, 18, 14, 18, RAMPS.prism[4]);
  } else if (tier === 4) {
    shadeMask(b, (x, y) => x >= 2 && x <= 16 && y >= 8 && y <= 18 && !((x % 3 === 0) && y === 18), ramp, { cx: 7, cy: 9, rx: 7, ry: 8 });
    fillRect(b, 3, 16, 12, 2, RAMPS.gold[4]);
  } else {
    shadeMask(b, (x, y) => x >= 3 && x <= 16 && y >= 9 && y <= 18, RAMPS.royal, { cx: 8, cy: 10, rx: 7, ry: 8 });
    fillRect(b, 4, 17, 11, 1, RAMPS.gold[4]);
    b.poly([[1, 5], [5, 8], [4, 13], [1, 11]], RAMPS.prism[4]);
    b.poly([[20, 5], [16, 8], [17, 13], [20, 11]], RAMPS.prism[3]);
    b.line(1, 5, 4, 8, WHITE);
    b.line(20, 5, 17, 8, RAMPS.gold[5]);
  }
  return finishOverlay(b, ramp);
}

/** Helmets aligned precisely to hero head (wy=4..9, wx=6..15 in 22x22) */
function buildPaperDollHelmet(tier) {
  const b = new P.Buf(22, 22);
  const ramp =
    tier === 1 ? RAMPS.cloth :
    tier === 2 ? RAMPS.emerald :
    tier === 3 ? RAMPS.quartz :
    tier === 4 ? RAMPS.amber : RAMPS.gold;

  if (tier === 1) {
    shadeMask(b, (x, y) => x >= 6 && x <= 15 && y >= 3 && y <= 6, ramp, { cx: 8, cy: 3, rx: 5, ry: 4 });
    fillRect(b, 6, 6, 2, 2, ramp[2]);
    fillRect(b, 14, 6, 2, 2, ramp[1]);
  } else if (tier === 2) {
    shadeMask(b, (x, y) => x >= 6 && x <= 15 && y >= 3 && y <= 6, ramp, { cx: 8, cy: 3, rx: 5, ry: 4 });
    b.poly([[8, 1], [13, 1], [12, 3], [9, 3]], RAMPS.emerald[5]);
    b.pset(9, 1, WHITE);
    fillRect(b, 7, 6, 8, 1, RAMPS.gold[4]);
  } else if (tier === 3) {
    shadeMask(b, (x, y) => x >= 6 && x <= 15 && y >= 3 && y <= 7, ramp, { cx: 8, cy: 3, rx: 5, ry: 4 });
    fillRect(b, 7, 5, 8, 2, INK);
    fillRect(b, 8, 5, 7, 1, RAMPS.prism[5]);
    fillRect(b, 9, 5, 3, 1, WHITE);
    fillRect(b, 10, 2, 2, 2, RAMPS.prism[4]);
  } else if (tier === 4) {
    shadeMask(b, (x, y) => x >= 6 && x <= 15 && y >= 3 && y <= 6, ramp, { cx: 8, cy: 3, rx: 5, ry: 4 });
    b.poly([[4, 1], [6, 3], [5, 5], [3, 2]], RAMPS.obsidian[3]);
    b.poly([[17, 1], [15, 3], [16, 5], [18, 2]], RAMPS.obsidian[2]);
    b.pset(4, 1, RAMPS.gold[5]);
    b.pset(17, 1, RAMPS.gold[5]);
    fillRect(b, 7, 5, 8, 1, RAMPS.gold[4]);
  } else {
    fillRect(b, 6, 4, 10, 2, RAMPS.gold[3]);
    b.pset(7, 3, RAMPS.gold[4]);
    fillRect(b, 10, 2, 2, 3, RAMPS.gold[5]);
    b.pset(14, 3, RAMPS.gold[4]);
    fillRect(b, 10, 4, 2, 2, RAMPS.prism[5]);
    b.pset(10, 4, WHITE);
    fillRect(b, 6, 0, 10, 1, RAMPS.prism[4]);
    fillRect(b, 8, 0, 6, 1, WHITE);
    return P.selout(b, RAMPS.prism[3], INK, { dir: [-1, -1] });
  }
  return finishOverlay(b, ramp);
}

/** Chestplates & Pauldrons aligned to hero torso (wx=8..13, wy=10..14 in 22x22) */
function buildPaperDollArmor(tier) {
  const b = new P.Buf(22, 22);
  const ramp =
    tier === 1 ? RAMPS.cloth :
    tier === 2 ? RAMPS.emerald :
    tier === 3 ? RAMPS.quartz :
    tier === 4 ? RAMPS.amber : RAMPS.royal;
  const trim = tier >= 4 ? RAMPS.gold : tier === 3 ? RAMPS.prism : RAMPS.wood;

  shadeMask(b, (x, y) => x >= 8 && x <= 13 && y >= 10 && y <= 14, ramp, { cx: 9, cy: 10, rx: 4, ry: 4 });
  fillRect(b, 8, 14, 6, 1, trim[3]);

  const pW = tier >= 4 ? 4 : tier >= 2 ? 3 : 2;
  fillRect(b, 8 - pW, 10, pW, 3, ramp[4]);
  fillRect(b, 14, 10, pW, 3, ramp[2]);
  if (tier >= 3) {
    fillRect(b, 8 - pW, 9, pW, 1, trim[4]);
    fillRect(b, 14, 9, pW, 1, trim[3]);
    fillRect(b, 10, 11, 2, 2, tier === 4 ? RAMPS.gold[5] : RAMPS.prism[5]);
    b.pset(10, 11, WHITE);
  }
  if (tier === 5) {
    b.pset(4, 8, WHITE);
    b.pset(17, 8, RAMPS.gold[5]);
  }
  return finishOverlay(b, ramp);
}

/** Boots aligned to hero feet (wy=16..18) */
function buildPaperDollBoots(tier, stride = 0) {
  const b = new P.Buf(22, 22);
  const ramp =
    tier === 1 ? RAMPS.wood :
    tier === 2 ? RAMPS.emerald :
    tier === 3 ? RAMPS.quartz :
    tier === 4 ? RAMPS.amber : RAMPS.royal;
  const trim = tier >= 4 ? RAMPS.gold : tier === 3 ? RAMPS.prism : RAMPS.steel;

  const lx = 7 - stride;
  const rx = 12 + stride;
  for (const bx of [lx, rx]) {
    fillRect(b, bx, 16, 3, 2, ramp[3]);
    fillRect(b, bx, 16, 2, 1, ramp[4]);
    if (tier >= 3) fillRect(b, bx, 15, 3, 1, trim[4]);
    if (tier === 5) fillRect(b, bx, 18, 3, 1, RAMPS.prism[5]);
  }
  return finishOverlay(b, ramp);
}

/** Held Weapon overlays (both Idle/Run & Attack Swing poses) */
function buildPaperDollWeapon(family, tier, attack = false) {
  const b = new P.Buf(22, 22);
  const ramp =
    family === "halberd" ? RAMPS.prism :
    family === "staff" ? (tier === 1 ? RAMPS.quartz : tier === 2 ? RAMPS.emerald : tier === 3 ? RAMPS.magenta : tier === 4 ? RAMPS.amber : RAMPS.prism) :
    family === "dagger" ? (tier === 1 ? RAMPS.steel : tier === 2 ? RAMPS.emerald : tier === 3 ? RAMPS.crimson : tier === 4 ? RAMPS.amber : RAMPS.prism) :
    family === "gun" ? (tier === 1 ? RAMPS.steel : tier === 2 ? RAMPS.emerald : tier === 3 ? RAMPS.quartz : tier === 4 ? RAMPS.amber : RAMPS.royal) :
    (tier === 1 ? RAMPS.steel : tier === 2 ? RAMPS.emerald : tier === 3 ? RAMPS.quartz : tier === 4 ? RAMPS.amber : RAMPS.gold);

  const glow = tier === 5 ? RAMPS.prism[5] : tier === 4 ? RAMPS.gold[5] : WHITE;

  if (family === "sword" || family === "halberd") {
    const len = family === "halberd" ? 11 : tier >= 4 ? 10 : tier >= 2 ? 8 : 7;
    const thick = tier >= 4 ? 2 : 1;
    if (!attack) {
      const topY = Math.max(1, 13 - len);
      if (family === "halberd") {
        fillRect(b, 16, topY + 2, 1, 14 - (topY + 2), RAMPS.wood[3]);
        b.poly([[16, topY], [20, topY + 2], [19, topY + 6], [16, topY + 5]], ramp[4]);
        b.pset(18, topY + 1, WHITE);
      } else {
        fillRect(b, 16, topY, thick, len, ramp[3]);
        fillRect(b, 16, topY, 1, Math.min(len, 4), ramp[5]);
        b.pset(16, topY, WHITE);
        if (tier >= 4) fillRect(b, 16, topY + 2, 1, len - 3, glow);
        fillRect(b, 15, 13, thick + 2, 1, tier >= 3 ? RAMPS.gold[4] : RAMPS.steel[3]);
        fillRect(b, 16, 14, 1, 2, RAMPS.wood[2]);
      }
    } else {
      const sx = 12;
      const sy = 11;
      const reach = Math.min(9, len);
      fillRect(b, sx, sy, reach, thick, ramp[4]);
      fillRect(b, sx + reach - 3, sy, 3, 1, WHITE);
      if (family === "halberd") {
        fillRect(b, sx + reach - 4, sy - 2, 3, 2, ramp[5]);
      }
      fillRect(b, sx, sy - 1, 1, thick + 2, RAMPS.gold[4]);
    }
  } else if (family === "staff") {
    const shaft = tier >= 4 ? RAMPS.obsidian[3] : RAMPS.wood[3];
    if (!attack) {
      fillRect(b, 16, 6, 1, 11, shaft);
      fillRect(b, 15, 4, 3, 3, ramp[4]);
      b.pset(16, 4, WHITE);
      if (tier >= 4) {
        b.pset(14, 3, RAMPS.gold[4]);
        b.pset(18, 3, RAMPS.gold[4]);
      }
      if (tier === 5) {
        b.ring(16, 5, 3, 1, RAMPS.gold[4]);
      }
    } else {
      fillRect(b, 12, 11, 7, 1, shaft);
      fillRect(b, 18, 9, 4, 4, ramp[4]);
      fillRect(b, 19, 10, 2, 2, WHITE);
    }
  } else if (family === "dagger") {
    const dLen = tier >= 4 ? 6 : 5;
    if (!attack) {
      fillRect(b, 16, 13 - dLen, 1, dLen, ramp[4]);
      b.pset(16, 13 - dLen, WHITE);
      fillRect(b, 15, 13, 3, 1, RAMPS.gold[3]);
      fillRect(b, 5, 14 - dLen, 1, dLen, ramp[3]);
      b.pset(5, 14 - dLen, glow);
      fillRect(b, 4, 14, 3, 1, RAMPS.gold[3]);
    } else {
      fillRect(b, 14, 10, dLen + 1, 1, ramp[5]);
      b.pset(14 + dLen, 10, WHITE);
      fillRect(b, 13, 12, dLen, 1, glow);
    }
  } else if (family === "gun") {
    const gLen = tier >= 5 ? 8 : tier >= 3 ? 7 : 5;
    const gx = attack ? 14 : 13;
    const gy = 11;
    fillRect(b, gx, gy, gLen, tier >= 4 ? 3 : 2, ramp[3]);
    fillRect(b, gx + 1, gy, gLen - 2, 1, ramp[5]);
    fillRect(b, gx + gLen - 2, gy, 2, 1, glow);
    fillRect(b, gx, gy + 2, 2, 2, RAMPS.wood[2]);
    if (attack) b.pset(Math.min(21, gx + gLen), gy, WHITE);
  }

  return finishOverlay(b, ramp);
}

function buildPaperDollAcc(kind, tier) {
  const b = new P.Buf(8, 8);
  const ramp =
    tier === 1 ? (kind === "chip" ? RAMPS.steel : RAMPS.copper) :
    tier === 2 ? RAMPS.emerald :
    tier === 3 ? RAMPS.quartz :
    tier === 4 ? (kind === "chip" ? RAMPS.royal : RAMPS.amber) : RAMPS.prism;

  if (kind === "chip") {
    fillRect(b, 2, 2, 4, 4, ramp[3]);
    fillRect(b, 3, 3, 2, 2, tier === 5 ? RAMPS.gold[5] : WHITE);
    b.pset(1, 3, RAMPS.gold[4]);
    b.pset(6, 3, RAMPS.gold[4]);
  } else {
    const gem = makeCodixelGem(6, ramp, [0.4, 2.2, 3.8], 0.4 + tier * 0.3);
    stamp(b, gem, 1, 1);
    b.pset(3, 2, WHITE);
  }
  return P.selout(P.rimLight(b, ramp), ramp[1], INK);
}

// =========================================================================
// 2B. HUD BACKPACK, SKILL PIXEL ICONS & BESPOKE SPECIAL EQUIPMENT ICONS
// =========================================================================

function buildUiBackpackIcon() {
  const b = new P.Buf(22, 22);
  // Top handle loop
  fillRect(b, 8, 2, 6, 2, RAMPS.wood[3]);
  clearRect(b, 9, 3, 4, 1);
  // Side pockets
  shadeMask(b, (x, y) => (x >= 2 && x <= 4 || x >= 17 && x <= 19) && y >= 11 && y <= 18, RAMPS.copper, { cx: 8, cy: 11, rx: 10, ry: 6 });
  // Main pack body
  shadeMask(b, (x, y) => x >= 4 && x <= 17 && y >= 5 && y <= 19, RAMPS.wood, { cx: 8, cy: 8, rx: 8, ry: 9 });
  // Rounded top flap
  shadeMask(b, (x, y) => {
    const dx = (x - 10.5) / 7.2, dy = (y - 8) / 4.8;
    return (dx * dx + dy * dy <= 1 && y <= 11) || (x >= 4 && x <= 17 && y >= 7 && y <= 11);
  }, RAMPS.amber, { cx: 8, cy: 6, rx: 8, ry: 6 });
  // Flap bottom crease shadow
  fillRect(b, 4, 11, 14, 1, RAMPS.wood[0]);
  // Twin vertical leather straps
  fillRect(b, 6, 7, 2, 11, RAMPS.copper[1]);
  fillRect(b, 14, 7, 2, 11, RAMPS.copper[1]);
  // Brass buckles
  fillRect(b, 6, 12, 2, 2, RAMPS.gold[4]);
  fillRect(b, 14, 12, 2, 2, RAMPS.gold[4]);
  b.pset(6, 12, WHITE);
  b.pset(14, 12, WHITE);
  // Center emerald-prism clasp gem
  fillRect(b, 9, 10, 4, 4, RAMPS.gold[3]);
  fillRect(b, 10, 11, 2, 2, RAMPS.prism[5]);
  b.pset(10, 11, WHITE);
  // Lower front pouch stitched rim
  fillRect(b, 6, 16, 10, 1, RAMPS.amber[3]);
  return finishIcon(b, RAMPS.amber, { smooth: false });
}

function buildUiLockIcon() {
  const b = new P.Buf(22, 22);
  // Shackle arch
  for (let x = 7; x <= 14; x++) {
    b.pset(x, 4, RAMPS.steel[4]);
    b.pset(x, 5, RAMPS.steel[2]);
  }
  fillRect(b, 6, 5, 2, 5, RAMPS.steel[4]);
  fillRect(b, 14, 5, 2, 5, RAMPS.steel[2]);
  b.pset(7, 4, WHITE);
  // Lock body
  shadeMask(b, (x, y) => x >= 4 && x <= 17 && y >= 10 && y <= 19, RAMPS.crimson, { cx: 8, cy: 12, rx: 8, ry: 6 });
  fillRect(b, 4, 10, 14, 2, RAMPS.gold[4]);
  fillRect(b, 10, 13, 2, 2, RAMPS.gold[5]);
  fillRect(b, 10, 15, 2, 2, INK);
  b.pset(10, 13, WHITE);
  return finishIcon(b, RAMPS.crimson, { smooth: false });
}

function buildSkillUnarmedIcon() {
  const b = new P.Buf(22, 22);
  // Crisp clenched martial-arts fist (no antenna rays!)
  // 4 rounded fingers across top
  const skin = P.hueRamp(5, { hue: 24, shift: 34, sat: 0.62, light: [0.26, 0.88] });
  for (let fi = 0; fi < 4; fi++) {
    const fx = 5 + fi * 3;
    const fy = fi === 0 ? 7 : fi === 3 ? 8 : 6;
    fillRect(b, fx, fy, 3, 5, skin[3]);
    fillRect(b, fx, fy, 2, 2, skin[4]);
    b.pset(fx, fy, WHITE);
    if (fi > 0) fillRect(b, fx, fy + 1, 1, 4, skin[1]);
  }
  // Palm & knuckles body
  shadeMask(b, (x, y) => x >= 5 && x <= 16 && y >= 9 && y <= 15, skin, { cx: 8, cy: 9, rx: 7, ry: 5 });
  // Curled thumb tucking cleanly on front-bottom
  fillRect(b, 5, 11, 7, 3, skin[4]);
  fillRect(b, 5, 13, 7, 1, skin[1]);
  fillRect(b, 6, 11, 4, 1, WHITE);
  // Glowing cyan fighter wrist wrap
  fillRect(b, 6, 15, 9, 4, RAMPS.quartz[3]);
  fillRect(b, 7, 16, 7, 1, RAMPS.prism[5]);
  // Clean curved punch shockwave arc above knuckles
  for (let a = -2.2; a <= -0.9; a += 0.14) {
    const x = Math.round(11 + Math.cos(a) * 8.5);
    const y = Math.round(10 + Math.sin(a) * 8.5);
    b.pset(x, y, a > -1.6 ? WHITE : RAMPS.prism[5]);
  }
  return finishIcon(b, skin, { smooth: false, rim: false });
}

function buildSkillDashIcon() {
  const b = new P.Buf(22, 22);
  // Motion speed streaks on left
  fillRect(b, 1, 6, 6, 1, RAMPS.prism[4]);
  fillRect(b, 2, 9, 5, 2, RAMPS.prism[5]);
  fillRect(b, 1, 13, 7, 1, RAMPS.quartz[4]);
  fillRect(b, 3, 16, 5, 1, RAMPS.prism[3]);
  // Winged swift boot on right
  shadeMask(b, (x, y) => {
    if (x >= 10 && x <= 15 && y >= 5 && y <= 15) return true;
    if (x >= 10 && x <= 19 && y >= 12 && y <= 17) return true;
    return false;
  }, RAMPS.quartz, { cx: 12, cy: 8, rx: 6, ry: 8 });
  // Luminous cyan wing attached to heel
  b.poly([[10, 10], [4, 5], [7, 10], [5, 12], [10, 13]], WHITE);
  b.line(5, 6, 9, 10, RAMPS.prism[5]);
  fillRect(b, 10, 16, 10, 2, RAMPS.prism[5]);
  b.pset(18, 14, WHITE);
  return finishIcon(b, RAMPS.prism, { smooth: false });
}

function buildSkillKnightLmbIcon() {
  const b = new P.Buf(22, 22);
  // Three layered diagonal sword slash arcs (Tam Lien Tram)
  for (let a = -0.9; a <= 0.9; a += 0.06) {
    const x1 = Math.round(11 + Math.cos(a) * 8);
    const y1 = Math.round(11 + Math.sin(a) * 8);
    b.pset(x1, y1, WHITE);
    b.pset(x1 - 1, y1, RAMPS.prism[5]);
    const x2 = Math.round(9 + Math.cos(a + 0.1) * 6);
    const y2 = Math.round(12 + Math.sin(a + 0.1) * 6);
    b.pset(x2, y2, RAMPS.quartz[4]);
  }
  // Diagonal greatsword slicing across center
  for (let i = 0; i < 14; i++) {
    b.pset(4 + i, 17 - i, i > 9 ? WHITE : RAMPS.prism[5]);
    b.pset(5 + i, 17 - i, RAMPS.quartz[3]);
  }
  // Crossguard + gold hilt
  b.line(5, 13, 9, 17, RAMPS.gold[4]);
  fillRect(b, 3, 17, 3, 2, RAMPS.gold[3]);
  b.pset(18, 3, WHITE);
  b.pset(15, 16, RAMPS.gold[5]);
  return finishIcon(b, RAMPS.prism, { smooth: false });
}

function buildSkillKnightEIcon() {
  const b = new P.Buf(22, 22);
  // Radiant prism kite shield
  shadeMask(b, (x, y) => {
    if (y < 3 || y > 19) return false;
    const half = y < 11 ? 6.5 : Math.max(0.8, 6.5 * (1 - (y - 11) / 8.5));
    return Math.abs(x - 9.5) <= half;
  }, RAMPS.quartz, { cx: 7, cy: 6, rx: 7, ry: 9 });
  // Gold shield rim + center cross
  fillRect(b, 8, 4, 3, 13, RAMPS.gold[4]);
  fillRect(b, 4, 8, 11, 2, RAMPS.gold[4]);
  fillRect(b, 9, 8, 2, 2, WHITE);
  // Counter Prism Beam firing right from shield core
  fillRect(b, 12, 8, 9, 3, RAMPS.prism[5]);
  fillRect(b, 12, 9, 9, 1, WHITE);
  b.pset(19, 6, RAMPS.prism[4]);
  b.pset(19, 12, RAMPS.prism[4]);
  return finishIcon(b, RAMPS.prism, { smooth: false });
}

function buildSkillKnightQIcon() {
  const b = new P.Buf(22, 22);
  // Rainbow tornado / storm swirl (Bao Kiem Anh Sang)
  const cols = [RAMPS.crimson[5], RAMPS.gold[5], RAMPS.emerald[5], RAMPS.prism[5], RAMPS.magenta[5]];
  for (let ring = 0; ring < 3; ring++) {
    const r = 8 - ring * 2;
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2 + ring * 0.7;
      const px = Math.round(10.5 + Math.cos(a) * r);
      const py = Math.round(10.5 + Math.sin(a) * r * 0.72);
      if (k % 2 === 0 || ring === 0) b.pset(px, py, cols[(k + ring) % cols.length]);
    }
  }
  // Vertical bright sword pillar through vortex
  fillRect(b, 10, 2, 2, 16, WHITE);
  fillRect(b, 9, 4, 1, 10, RAMPS.prism[5]);
  fillRect(b, 12, 4, 1, 10, RAMPS.gold[5]);
  fillRect(b, 7, 14, 8, 2, RAMPS.gold[4]);
  fillRect(b, 10, 16, 2, 4, RAMPS.royal[3]);
  return finishIcon(b, RAMPS.prism, { smooth: false, rim: false });
}

function buildSkillMageLmbIcon() {
  const b = new P.Buf(22, 22);
  // Faint arcane circle connecting 5 elemental orbs
  b.ring(11, 11, 6, 1, RAMPS.royal[3]);
  // Central white-prism arcane star
  fillRect(b, 10, 8, 2, 6, WHITE);
  fillRect(b, 8, 10, 6, 2, WHITE);
  fillRect(b, 10, 10, 2, 2, RAMPS.prism[5]);
  // 5 Elemental Orbs (Fire, Ice, Nature, Volt, Chroma)
  const orbs = [
    [11, 3, RAMPS.crimson[5]],
    [18, 8, RAMPS.prism[5]],
    [15, 17, RAMPS.emerald[5]],
    [6, 17, RAMPS.gold[5]],
    [3, 8, RAMPS.magenta[5]],
  ];
  for (const [ox, oy, col] of orbs) {
    fillRect(b, ox - 1, oy - 1, 3, 3, col);
    b.pset(ox - 1, oy - 1, WHITE);
  }
  return finishIcon(b, RAMPS.magenta, { smooth: false, rim: false });
}

function buildSkillMageEIcon() {
  const b = new P.Buf(22, 22);
  // Swirling Void-Chroma Vortex (Xoay Hu Sac)
  for (let arm = 0; arm < 3; arm++) {
    const base = (arm * Math.PI * 2) / 3;
    for (let u = 0.1; u <= 1.0; u += 0.04) {
      const ang = base + u * 4.4;
      const r = u * 9.0;
      const x = Math.round(10.5 + Math.cos(ang) * r);
      const y = Math.round(10.5 + Math.sin(ang) * r);
      const col = u < 0.35 ? WHITE : u < 0.65 ? RAMPS.magenta[5] : RAMPS.royal[4];
      b.pset(x, y, col);
      b.pset(x + 1, y, u < 0.5 ? RAMPS.prism[5] : RAMPS.royal[2]);
    }
  }
  // Singularity dark eye with bright white rim
  fillRect(b, 9, 9, 4, 4, INK);
  b.pset(10, 10, WHITE);
  b.pset(11, 11, RAMPS.magenta[5]);
  return finishIcon(b, RAMPS.royal, { smooth: false, rim: false });
}

function buildSkillMageQIcon() {
  const b = new P.Buf(22, 22);
  // 3 streaking Rainbow Meteors (Mua Thien Thach That Sac)
  const drawMeteor = (hx, hy, r, colA, colB) => {
    for (let i = 1; i <= 7; i++) {
      b.pset(hx + i, hy - i, i < 3 ? WHITE : colB);
      b.pset(hx + i - 1, hy - i, colA);
      if (r >= 2 && i < 5) b.pset(hx + i, hy - i + 1, colA);
    }
    fillRect(b, hx - r, hy - r, r * 2 + 1, r * 2 + 1, colA);
    fillRect(b, hx - r + 1, hy - r + 1, Math.max(1, r * 2 - 1), Math.max(1, r * 2 - 1), WHITE);
  };
  drawMeteor(5, 11, 1, RAMPS.prism[5], RAMPS.quartz[4]);
  drawMeteor(13, 17, 1, RAMPS.magenta[5], RAMPS.royal[4]);
  drawMeteor(8, 15, 2, RAMPS.amber[5], RAMPS.gold[5]);
  b.pset(3, 18, RAMPS.gold[5]);
  b.pset(17, 4, WHITE);
  return finishIcon(b, RAMPS.amber, { smooth: false, rim: false });
}

function buildSkillRogueLmbIcon() {
  const b = new P.Buf(22, 22);
  // Swirling emerald-cyan wind crescent
  for (let a = -2.2; a <= 0.7; a += 0.08) {
    const x = Math.round(11 + Math.cos(a) * 8.5);
    const y = Math.round(11 + Math.sin(a) * 8.5);
    b.pset(x, y, a > -0.8 ? WHITE : RAMPS.teal[5]);
  }
  // Crossed crimson & cyan twin daggers
  for (let i = 0; i < 11; i++) {
    b.pset(4 + i, 16 - i, i > 7 ? WHITE : RAMPS.crimson[5]);
    b.pset(5 + i, 16 - i, RAMPS.crimson[3]);
    b.pset(17 - i, 16 - i, i > 7 ? WHITE : RAMPS.prism[5]);
    b.pset(16 - i, 16 - i, RAMPS.quartz[3]);
  }
  fillRect(b, 4, 15, 3, 2, RAMPS.gold[4]);
  fillRect(b, 15, 15, 3, 2, RAMPS.gold[4]);
  return finishIcon(b, RAMPS.crimson, { smooth: false, rim: false });
}

function buildSkillRogueEIcon() {
  const b = new P.Buf(22, 22);
  // Frame-Skip: dynamic dashing hooded rogue leaving cyan & magenta phantom afterimages!
  // Distant cyan trail ghost (left)
  b.poly([[3, 6], [6, 5], [7, 10], [4, 15], [2, 12]], RAMPS.prism[3]);
  fillRect(b, 1, 9, 4, 1, RAMPS.prism[5]);
  fillRect(b, 1, 13, 5, 1, RAMPS.prism[4]);
  // Mid magenta glitch afterimage
  b.poly([[8, 5], [12, 4], [12, 11], [8, 16], [6, 12]], RAMPS.magenta[4]);
  fillRect(b, 6, 8, 5, 1, RAMPS.magenta[5]);
  // Foreground crimson-white blinking assassin lunging right
  b.poly([[13, 3], [18, 5], [17, 10], [19, 17], [14, 17], [12, 11]], RAMPS.crimson[4]);
  fillRect(b, 14, 4, 3, 2, RAMPS.crimson[5]);
  b.pset(17, 6, WHITE);
  b.line(17, 10, 20, 8, WHITE);
  fillRect(b, 9, 11, 8, 1, WHITE);
  return finishIcon(b, RAMPS.magenta, { smooth: false, rim: false });
}

function buildSkillRogueQIcon() {
  const b = new P.Buf(22, 22);
  // Phan Than Ao Anh: twin hooded shadow assassins + crossed crimson & cyan energy blades
  // Left Crimson Assassin Hood
  b.poly([[2, 9], [6, 4], [9, 8], [8, 14], [3, 14]], RAMPS.crimson[3]);
  b.line(3, 8, 6, 4, RAMPS.crimson[5]);
  b.pset(7, 8, WHITE);
  // Right Cyan Mirror Clone Hood
  b.poly([[19, 9], [15, 4], [12, 8], [13, 14], [18, 14]], RAMPS.quartz[3]);
  b.line(18, 8, 15, 4, RAMPS.prism[5]);
  b.pset(14, 8, WHITE);
  // Crossed glowing twin fangs in front
  for (let i = 0; i < 10; i++) {
    b.pset(5 + i, 18 - i, i > 6 ? WHITE : RAMPS.crimson[5]);
    b.pset(16 - i, 18 - i, i > 6 ? WHITE : RAMPS.prism[5]);
  }
  b.pset(11, 13, RAMPS.gold[5]);
  b.pset(10, 12, WHITE);
  return finishIcon(b, RAMPS.crimson, { smooth: false, rim: false });
}

function buildSkillTinkerLmbIcon() {
  const b = new P.Buf(22, 22);
  // Compact emerald barrel on left
  shadeMask(b, (x, y) => x >= 2 && x <= 10 && y >= 8 && y <= 14, RAMPS.emerald, { cx: 4, cy: 9, rx: 5, ry: 4 });
  fillRect(b, 3, 14, 3, 4, RAMPS.wood[2]);
  fillRect(b, 5, 10, 4, 2, RAMPS.gold[5]);
  // Jagged electric volt bolt firing right
  b.line(11, 11, 14, 7, RAMPS.gold[5]);
  b.line(14, 7, 15, 12, WHITE);
  b.line(15, 12, 19, 7, RAMPS.gold[5]);
  b.line(15, 11, 20, 11, RAMPS.prism[5]);
  b.pset(20, 7, WHITE);
  b.pset(19, 14, RAMPS.gold[4]);
  return finishIcon(b, RAMPS.emerald, { smooth: false, rim: false });
}

function buildSkillTinkerEIcon() {
  const b = new P.Buf(22, 22);
  // Tripod legs
  b.line(10, 13, 5, 19, RAMPS.steel[3]);
  b.line(11, 13, 16, 19, RAMPS.steel[2]);
  fillRect(b, 10, 13, 2, 6, RAMPS.steel[4]);
  // Emerald armored turret head
  shadeMask(b, (x, y) => x >= 5 && x <= 16 && y >= 6 && y <= 13, RAMPS.emerald, { cx: 8, cy: 7, rx: 6, ry: 5 });
  // Twin gun barrels right
  fillRect(b, 15, 8, 5, 2, RAMPS.gold[4]);
  fillRect(b, 15, 11, 4, 1, RAMPS.steel[4]);
  // Glowing tesla coil antenna on top
  fillRect(b, 10, 2, 2, 4, RAMPS.gold[5]);
  fillRect(b, 8, 3, 6, 1, RAMPS.prism[5]);
  b.pset(10, 2, WHITE);
  b.pset(19, 8, WHITE);
  return finishIcon(b, RAMPS.emerald, { smooth: false });
}

function buildSkillTinkerQIcon() {
  const b = new P.Buf(22, 22);
  // Hovering chroma-gold Overdrive Drone
  b.poly([[11, 3], [19, 8], [15, 12], [7, 12], [3, 8]], RAMPS.emerald[4]);
  fillRect(b, 7, 5, 8, 5, RAMPS.gold[4]);
  fillRect(b, 9, 6, 4, 3, RAMPS.prism[5]);
  fillRect(b, 10, 7, 2, 1, WHITE);
  // Side thruster wingtips
  fillRect(b, 2, 7, 3, 2, RAMPS.prism[5]);
  fillRect(b, 17, 7, 3, 2, RAMPS.magenta[5]);
  // Twin downward overdrive laser beams
  b.line(8, 12, 4, 19, RAMPS.prism[5]);
  b.line(9, 12, 6, 19, WHITE);
  b.line(13, 12, 17, 19, RAMPS.gold[5]);
  b.line(12, 12, 15, 19, WHITE);
  return finishIcon(b, RAMPS.gold, { smooth: false, rim: false });
}

// --- BESPOKE SPECIAL EQUIPMENT ICONS (17) ---

function buildSpecialPrismBladeIcon() {
  const b = new P.Buf(22, 22);
  // Winged rainbow sovereign blade (Kiem That Sac Nguyen Thuy)
  for (let y = 1; y < 16; y++) {
    for (let x = 6; x < 21; x++) {
      const u = ((x - 6) + (15 - y)) / 24;
      const d = Math.abs((x - 6) - (15 - y)) * 0.707;
      if (u < 0.05 || u > 1.02) continue;
      const maxD = 2.4 * (u > 0.78 ? (1.03 - u) / 0.25 : 1);
      if (d > maxD) continue;
      if (d < 0.65) {
        const rb = [RAMPS.crimson[5], RAMPS.gold[5], RAMPS.emerald[5], RAMPS.prism[5], RAMPS.magenta[5]];
        b.pset(x, y, rb[Math.floor(u * 10) % rb.length]);
      } else {
        b.pset(x, y, (x - 6) - (15 - y) <= 0 ? WHITE : RAMPS.prism[4]);
      }
    }
  }
  // Swept golden angel wings at crossguard
  b.poly([[3, 10], [8, 13], [11, 18], [9, 19], [6, 15], [2, 12]], RAMPS.gold[4]);
  b.pset(3, 10, WHITE);
  b.pset(11, 18, WHITE);
  const gem = makeCodixelGem(5, RAMPS.prism, [0.4, 1.5, 3.2], 0.5);
  stamp(b, gem, 5, 11);
  // Hilt
  b.line(6, 15, 2, 19, RAMPS.royal[4]);
  b.pset(2, 19, RAMPS.gold[5]);
  return finishIcon(b, RAMPS.prism, { smooth: false, rim: false });
}

function buildSpecialEraserEdgeIcon() {
  const b = new P.Buf(22, 22);
  // Fractured Obsidian-Void Eraser Greatsword (Null Sever)
  for (let y = 1; y < 16; y++) {
    for (let x = 6; x < 21; x++) {
      const u = ((x - 6) + (15 - y)) / 24;
      const d = Math.abs((x - 6) - (15 - y)) * 0.707;
      if (u < 0.05 || u > 1.04) continue;
      const saw = Math.floor(u * 12) % 2 === 0 ? 0.5 : 0;
      const maxD = (2.2 + saw) * (u > 0.8 ? (1.05 - u) / 0.25 : 1);
      if (d > maxD) continue;
      if (Math.abs(u - 0.55) < 0.05 && d < 1.2) continue; // Glitch split fracture!
      if (d < 0.7) b.pset(x, y, RAMPS.crimson[5]);
      else if (d > maxD - 0.75) b.pset(x, y, WHITE);
      else b.pset(x, y, RAMPS.obsidian[3]);
    }
  }
  // Floating glitch erasure pixels
  b.pset(11, 3, RAMPS.magenta[5]);
  b.pset(18, 9, RAMPS.crimson[5]);
  b.pset(14, 12, WHITE);
  // Jagged obsidian crossguard + crimson core
  b.line(4, 11, 11, 18, RAMPS.royal[4]);
  fillRect(b, 6, 13, 3, 3, RAMPS.crimson[5]);
  b.pset(7, 14, WHITE);
  b.line(6, 15, 2, 19, RAMPS.obsidian[4]);
  return finishIcon(b, RAMPS.magenta, { smooth: false, rim: false });
}

function buildSpecialVoidScytheIcon() {
  const b = new P.Buf(22, 22);
  // Long obsidian-violet polearm shaft
  for (let i = 0; i < 16; i++) {
    b.pset(4 + Math.floor(i * 0.7), 19 - i, RAMPS.obsidian[3]);
    b.pset(5 + Math.floor(i * 0.7), 19 - i, RAMPS.royal[2]);
  }
  // Curved crescent amethyst-cyan reaper blade sweeping right/down
  for (let a = -1.6; a <= 0.75; a += 0.04) {
    for (let r = 6.5; r <= 10.2; r += 0.6) {
      const x = Math.round(12 + Math.cos(a) * r);
      const y = Math.round(10 + Math.sin(a) * r * 0.72);
      if (x < 2 || x > 20 || y < 1 || y > 18) continue;
      b.pset(x, y, r > 9.4 ? WHITE : r > 8.1 ? RAMPS.prism[5] : RAMPS.royal[4]);
    }
  }
  // Glowing amethyst gem collar
  fillRect(b, 12, 3, 3, 3, RAMPS.magenta[5]);
  b.pset(13, 4, WHITE);
  return finishIcon(b, RAMPS.royal, { smooth: false, rim: false });
}

function buildSpecialQuakeMaulIcon() {
  const b = new P.Buf(22, 22);
  // Thick diagonal iron-wood shaft
  for (let i = 0; i < 14; i++) {
    b.pset(3 + i, 18 - i, RAMPS.wood[3]);
    b.pset(4 + i, 18 - i, RAMPS.steel[2]);
  }
  // Massive magma-cracked hammer head
  shadeMask(b, (x, y) => {
    const rx = (x - 14) * 0.707 + (y - 7) * 0.707;
    const ry = -(x - 14) * 0.707 + (y - 7) * 0.707;
    return Math.abs(rx) <= 6.2 && Math.abs(ry) <= 4.2;
  }, RAMPS.obsidian, { cx: 12, cy: 5, rx: 7, ry: 7 });
  // Molten tectonic amber cracks
  b.line(11, 5, 15, 7, RAMPS.amber[5]);
  b.line(15, 7, 17, 10, RAMPS.gold[5]);
  b.line(14, 4, 15, 7, WHITE);
  fillRect(b, 13, 6, 3, 3, RAMPS.gold[5]);
  b.pset(14, 7, WHITE);
  fillRect(b, 2, 17, 3, 3, RAMPS.gold[4]);
  return finishIcon(b, RAMPS.amber, { smooth: false });
}

function buildSpecialWardenCleaverIcon() {
  const b = new P.Buf(22, 22);
  // Living ancient-wood battleaxe haft (diagonal bottom-left -> top-right)
  for (let i = 0; i < 16; i++) {
    b.pset(3 + i, 18 - i, RAMPS.wood[3]);
    b.pset(4 + i, 18 - i, RAMPS.wood[1]);
  }
  // Sharp flared double-bit battleaxe cheeks (concave waist near shaft)
  b.poly([[11, 5], [7, 2], [4, 6], [8, 10], [12, 8]], RAMPS.emerald[4]);
  b.poly([[14, 10], [18, 14], [15, 18], [10, 14], [12, 11]], RAMPS.emerald[3]);
  // Bright jade cutting edges
  b.line(7, 2, 4, 6, WHITE);
  b.line(4, 6, 8, 10, RAMPS.emerald[5]);
  b.line(18, 14, 15, 18, WHITE);
  b.line(15, 18, 10, 14, RAMPS.emerald[5]);
  // Spear spike tip & glowing amber-gold heartwood collar
  b.poly([[17, 4], [20, 1], [19, 5]], RAMPS.gold[5]);
  b.pset(20, 1, WHITE);
  fillRect(b, 12, 7, 3, 3, RAMPS.gold[4]);
  b.pset(13, 8, WHITE);
  return finishIcon(b, RAMPS.emerald, { smooth: false, rim: false });
}

function buildSpecialAstralScepterIcon() {
  const b = new P.Buf(22, 22);
  // Royal starlit shaft
  for (let i = 0; i < 13; i++) {
    b.pset(3 + i, 18 - i, RAMPS.royal[3]);
    b.pset(4 + i, 18 - i, RAMPS.gold[4]);
  }
  // Golden crescent moon cradle at tip
  for (let a = 0.6; a <= 4.3; a += 0.08) {
    const x = Math.round(15.5 + Math.cos(a) * 5.2);
    const y = Math.round(6.0 + Math.sin(a) * 5.2);
    b.pset(x, y, RAMPS.gold[5]);
    b.pset(x, y + 1, RAMPS.gold[3]);
  }
  const gem = makeCodixelGem(6, RAMPS.magenta, [1.2, 4.2, 0.6], 0.55);
  stamp(b, gem, 13, 3);
  b.pset(15, 5, WHITE);
  b.pset(20, 2, WHITE);
  return finishIcon(b, RAMPS.gold, { smooth: false, rim: false });
}

function buildSpecialQuantumBladesIcon() {
  const b = new P.Buf(22, 22);
  // Twin split-energy cyan & magenta plasma katanas
  for (let i = 0; i < 12; i++) {
    b.pset(4 + i, 15 - i, i > 8 ? WHITE : RAMPS.prism[5]);
    b.pset(5 + i, 15 - i, RAMPS.quartz[4]);
    b.pset(17 - i, 16 - i, i > 8 ? WHITE : RAMPS.magenta[5]);
    b.pset(16 - i, 16 - i, RAMPS.crimson[4]);
  }
  fillRect(b, 3, 15, 3, 3, RAMPS.obsidian[4]);
  fillRect(b, 16, 16, 3, 3, RAMPS.obsidian[4]);
  // Quantum pixel sparks
  b.pset(11, 4, WHITE);
  b.pset(11, 12, RAMPS.prism[5]);
  b.pset(6, 5, RAMPS.magenta[5]);
  return finishIcon(b, RAMPS.prism, { smooth: false, rim: false });
}

function buildSpecialSingularityCannonIcon() {
  const b = new P.Buf(22, 22);
  // Twin-rail heavy sci-fi barrel
  shadeMask(b, (x, y) => x >= 2 && x <= 19 && (y >= 5 && y <= 7 || y >= 11 && y <= 13), RAMPS.royal, { cx: 8, cy: 6, rx: 10, ry: 5 });
  shadeMask(b, (x, y) => x >= 2 && x <= 14 && y >= 7 && y <= 11, RAMPS.obsidian, { cx: 6, cy: 8, rx: 8, ry: 4 });
  // Violet-cyan glowing singularity core orb between rails
  fillRect(b, 9, 8, 5, 3, RAMPS.prism[5]);
  fillRect(b, 10, 9, 3, 1, WHITE);
  b.pset(19, 9, WHITE);
  b.pset(20, 9, RAMPS.magenta[5]);
  // Grip & stock
  fillRect(b, 4, 13, 3, 5, RAMPS.steel[3]);
  fillRect(b, 1, 8, 2, 5, RAMPS.gold[4]);
  return finishIcon(b, RAMPS.royal, { smooth: false });
}

function buildSpecialNebulaStaffIcon() {
  const b = new P.Buf(22, 22);
  // Mythic Chroma Mage Staff — Cosmic Prism Halo Ring + Luminous Magenta-Cyan Nebula Core
  for (let i = 0; i < 12; i++) {
    b.pset(3 + i, 18 - i, RAMPS.obsidian[4]);
    b.pset(4 + i, 18 - i, RAMPS.gold[4]);
  }
  // Ornate golden halo ring & side spire accents
  b.ring(15, 6, 5, 1, RAMPS.gold[5]);
  b.pset(15, 0, WHITE);
  b.pset(21, 6, WHITE);
  // Bright luminous nebula orb core (magenta + prism cyan + white center star)
  shadeMask(b, (x, y) => (x - 15) * (x - 15) + (y - 6) * (y - 6) <= 12, RAMPS.magenta, { cx: 14, cy: 5, rx: 4, ry: 4 });
  fillRect(b, 14, 5, 3, 3, RAMPS.prism[5]);
  b.pset(15, 5, WHITE);
  b.pset(14, 6, WHITE);
  b.pset(16, 7, RAMPS.gold[5]);
  return finishIcon(b, RAMPS.magenta, { smooth: false, rim: false });
}

function buildSpecialEclipseFangsIcon() {
  const b = new P.Buf(22, 22);
  // Mythic Bit Rogue Twin Curved Eclipse Blades (Crossed Obsidian + Gold + Crimson Scimitars)
  for (let i = 0; i < 12; i++) {
    const curve = Math.round(Math.sin((i / 11) * Math.PI) * 2.2);
    // Left-to-right curved crimson-gold fang
    b.pset(4 + i - curve, 16 - i, i > 7 ? RAMPS.gold[5] : RAMPS.crimson[5]);
    b.pset(5 + i - curve, 16 - i, i > 8 ? WHITE : RAMPS.obsidian[3]);
    // Right-to-left curved magenta-obsidian fang
    b.pset(17 - i + curve, 16 - i, i > 7 ? RAMPS.magenta[5] : RAMPS.royal[4]);
    b.pset(16 - i + curve, 16 - i, i > 8 ? WHITE : RAMPS.obsidian[3]);
  }
  // Gold crescent guards + dark grips
  fillRect(b, 3, 15, 4, 2, RAMPS.gold[4]);
  fillRect(b, 15, 15, 4, 2, RAMPS.gold[4]);
  b.pset(3, 18, RAMPS.obsidian[4]);
  b.pset(18, 18, RAMPS.obsidian[4]);
  // Glowing eclipse center glint
  fillRect(b, 10, 9, 2, 2, RAMPS.gold[5]);
  b.pset(10, 9, WHITE);
  return finishIcon(b, RAMPS.crimson, { smooth: false, rim: false });
}

function buildSpecialNovaRailgunIcon() {
  const b = new P.Buf(22, 22);
  // Mythic Pixel Tinker Nova Railgun (Gold + Emerald + Solar Core)
  shadeMask(b, (x, y) => x >= 2 && x <= 20 && (y >= 4 && y <= 6 || y >= 11 && y <= 13), RAMPS.gold, { cx: 8, cy: 5, rx: 10, ry: 5 });
  shadeMask(b, (x, y) => x >= 2 && x <= 15 && y >= 7 && y <= 10, RAMPS.emerald, { cx: 6, cy: 8, rx: 8, ry: 4 });
  // Accelerator coils
  for (const cx of [6, 10, 14, 18]) {
    fillRect(b, cx, 7, 2, 4, cx === 18 ? WHITE : RAMPS.prism[5]);
  }
  fillRect(b, 8, 8, 4, 2, WHITE);
  fillRect(b, 4, 13, 3, 5, RAMPS.obsidian[3]);
  fillRect(b, 1, 7, 2, 5, RAMPS.emerald[5]);
  return finishIcon(b, RAMPS.gold, { smooth: false, rim: false });
}

function buildSpecialAethelCrownIcon() {
  const b = new P.Buf(22, 22);
  // 5-Spire Imperial Crown (Vuong Mien Aethel-16)
  shadeMask(b, (x, y) => x >= 3 && x <= 18 && y >= 12 && y <= 17, RAMPS.gold, { cx: 8, cy: 13, rx: 8, ry: 4 });
  // Royal amethyst velvet cap inside
  shadeMask(b, (x, y) => x >= 5 && x <= 16 && y >= 8 && y <= 13, RAMPS.royal, { cx: 9, cy: 9, rx: 6, ry: 4 });
  // 5 Golden Spires
  b.poly([[3, 13], [4, 7], [6, 13]], RAMPS.gold[4]);
  b.poly([[6, 13], [8, 5], [10, 13]], RAMPS.gold[5]);
  b.poly([[9, 13], [11, 3], [13, 13]], RAMPS.gold[5]);
  b.poly([[12, 13], [14, 5], [16, 13]], RAMPS.gold[4]);
  b.poly([[15, 13], [17, 7], [18, 13]], RAMPS.gold[3]);
  b.pset(11, 3, WHITE);
  b.pset(8, 5, WHITE);
  b.pset(14, 5, WHITE);
  // Ray-traced prism jewel at center
  const gem = makeCodixelGem(5, RAMPS.prism, [0.4, 1.8, 3.6], 0.4);
  stamp(b, gem, 8, 11);
  return finishIcon(b, RAMPS.gold, { smooth: false, rim: false });
}

function buildSpecialDragonVisorIcon() {
  const b = new P.Buf(22, 22);
  // Swept crystalline dragon horns
  b.poly([[2, 2], [7, 7], [5, 10], [1, 5]], RAMPS.prism[5]);
  b.poly([[19, 2], [14, 7], [16, 10], [20, 5]], RAMPS.quartz[4]);
  b.pset(2, 2, WHITE);
  b.pset(19, 2, WHITE);
  // Faceted crystal dragon helm dome
  shadeMask(b, (x, y) => {
    const dx = (x - 10.5) / 6.5, dy = (y - 12.5) / 6.2;
    return dx * dx + dy * dy <= 1 && y <= 18;
  }, RAMPS.quartz, { cx: 8, cy: 9, rx: 7, ry: 7 });
  // Central dragon ridge crest
  fillRect(b, 10, 4, 2, 7, RAMPS.prism[5]);
  b.pset(10, 4, WHITE);
  // Glowing cyan-white dragon eye visor slit
  fillRect(b, 5, 11, 12, 3, INK);
  fillRect(b, 6, 12, 4, 1, WHITE);
  fillRect(b, 12, 12, 4, 1, RAMPS.prism[5]);
  return finishIcon(b, RAMPS.prism, { smooth: false });
}

function buildSpecialWardenMantleIcon() {
  const b = new P.Buf(22, 22);
  // Living Ancient Bark & Leaf Pauldron Breastplate (Ao Giap Co Thu Bat Diet)
  shadeMask(b, (x, y) => y >= 5 && y <= 18 && Math.abs(x - 10.5) <= (y < 10 ? 7.2 : 5.6), RAMPS.wood, { cx: 8, cy: 8, rx: 7, ry: 8 });
  // Emerald leafy shoulder pauldrons
  b.poly([[1, 4], [6, 5], [5, 10], [1, 8]], RAMPS.emerald[4]);
  b.poly([[20, 4], [15, 5], [16, 10], [20, 8]], RAMPS.emerald[3]);
  b.pset(2, 5, RAMPS.emerald[5]);
  b.pset(19, 5, RAMPS.emerald[5]);
  // Intertwining emerald vines + glowing heartwood core
  b.line(6, 7, 15, 15, RAMPS.emerald[4]);
  b.line(15, 7, 6, 15, RAMPS.emerald[3]);
  const gem = makeCodixelGem(5, RAMPS.emerald, [3.8, 0.3, 3.2], 0.45);
  stamp(b, gem, 8, 9);
  b.pset(10, 10, WHITE);
  return finishIcon(b, RAMPS.emerald, { smooth: false });
}

function buildSpecialChromaAegisIcon() {
  const b = new P.Buf(22, 22);
  // Winged Cerulean-Gold Holy Paladin Armor (Thanh Giap Hoi Sac)
  // Radiant golden-prism back wings peeking out
  b.poly([[1, 2], [6, 6], [4, 12], [1, 8]], RAMPS.prism[5]);
  b.poly([[20, 2], [15, 6], [17, 12], [20, 8]], RAMPS.gold[5]);
  b.pset(2, 3, WHITE);
  b.pset(19, 3, WHITE);
  // Cerulean plate breastplate
  shadeMask(b, (x, y) => y >= 5 && y <= 18 && Math.abs(x - 10.5) <= (y < 10 ? 6.5 : 5.4), RAMPS.quartz, { cx: 8, cy: 8, rx: 7, ry: 8 });
  // Gold collar & belt trim
  fillRect(b, 6, 6, 10, 2, RAMPS.gold[4]);
  fillRect(b, 6, 15, 10, 2, RAMPS.gold[4]);
  // Central rainbow prism crest
  const gem = makeCodixelGem(5, RAMPS.prism, [0.4, 1.6, 2.8], 0.35);
  stamp(b, gem, 8, 9);
  b.pset(10, 10, WHITE);
  return finishIcon(b, RAMPS.gold, { smooth: false, rim: false });
}

function buildSpecialNullTreadsIcon() {
  const b = new P.Buf(22, 22);
  // Winged Molten-Amber Greaves with Cyan Thruster Flames (Hai Ho Phach Vo Anh)
  const drawBoot = (ox, oy) => {
    shadeMask(b, (x, y) => {
      const lx = x - ox, ly = y - oy;
      return (lx >= 0 && lx < 5 && ly >= 0 && ly < 10) || (lx >= 0 && lx < 8 && ly >= 6 && ly < 10);
    }, RAMPS.amber, { cx: ox + 1, cy: oy + 2, rx: 5, ry: 7 });
    fillRect(b, ox, oy, 5, 2, RAMPS.gold[5]);
    fillRect(b, ox, oy + 9, 8, 2, RAMPS.prism[5]);
    b.pset(ox - 1, oy + 3, WHITE);
    b.pset(ox - 2, oy + 2, RAMPS.prism[5]);
  };
  drawBoot(3, 5);
  drawBoot(12, 7);
  return finishIcon(b, RAMPS.amber, { smooth: false, rim: false });
}

function buildSpecialSiphonSigilIcon() {
  const b = new P.Buf(22, 22);
  // Floating Cyan-Violet Magnetic Prism Sigil Ring (An Hut Mach Lang Kinh)
  b.ring(11, 11, 8, 1, RAMPS.royal[4]);
  b.ring(11, 11, 6, 1, RAMPS.prism[4]);
  // 4 Cardinal Rune Prongs
  fillRect(b, 10, 1, 2, 3, RAMPS.prism[5]);
  fillRect(b, 10, 18, 2, 3, RAMPS.prism[5]);
  fillRect(b, 1, 10, 3, 2, RAMPS.magenta[5]);
  fillRect(b, 18, 10, 3, 2, RAMPS.magenta[5]);
  // Central glowing prism gem
  const gem = makeCodixelGem(6, RAMPS.prism, [1.8, 0.5, 0.3], 0.5);
  stamp(b, gem, 8, 8);
  b.pset(10, 9, WHITE);
  return finishIcon(b, RAMPS.prism, { smooth: false, rim: false });
}

// =========================================================================
// 2C. V3.0 GACHA CHEST, 4 BIOME KEYS, 16 EXOTIC ITEMS, 8 SEASONAL & 12 WEAPON SKILL ICONS
// =========================================================================

if (!P.Buf.prototype.disc) {
  P.Buf.prototype.disc = function (cx, cy, r, col) {
    const rr = r * r + 0.35;
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy <= rr) this.pset(x, y, col);
      }
    }
  };
}

function buildUiGachaChestIcon() {
  const b = new P.Buf(22, 22);
  shadeMask(b, (x, y) => x >= 3 && x <= 18 && y >= 5 && y <= 11, RAMPS.royal, { cx: 8, cy: 6, rx: 9, ry: 5 });
  shadeMask(b, (x, y) => x >= 3 && x <= 18 && y >= 11 && y <= 18, RAMPS.wood, { cx: 9, cy: 13, rx: 9, ry: 5 });
  fillRect(b, 3, 10, 16, 2, RAMPS.gold[4]);
  fillRect(b, 4, 5, 2, 13, RAMPS.gold[3]);
  fillRect(b, 16, 5, 2, 13, RAMPS.gold[3]);
  fillRect(b, 4, 5, 14, 1, RAMPS.gold[5]);
  fillRect(b, 9, 9, 4, 5, RAMPS.gold[5]);
  fillRect(b, 10, 10, 2, 3, RAMPS.prism[5]);
  b.pset(10, 10, WHITE);
  b.pset(6, 2, RAMPS.gold[5]);
  b.pset(11, 1, WHITE);
  b.pset(16, 2, RAMPS.prism[5]);
  return finishIcon(b, RAMPS.gold, { smooth: false });
}

function buildUiStashChestIcon() {
  const b = new P.Buf(22, 22);
  // Warm oak & sapphire-trimmed Personal Storage Chest right at Town Spawn!
  shadeMask(b, (x, y) => x >= 2 && x <= 19 && y >= 5 && y <= 11, RAMPS.amber, { cx: 7, cy: 6, rx: 10, ry: 5 });
  shadeMask(b, (x, y) => x >= 2 && x <= 19 && y >= 11 && y <= 18, RAMPS.wood, { cx: 8, cy: 13, rx: 10, ry: 5 });
  // Iron/sapphire corner straps
  fillRect(b, 3, 5, 2, 14, RAMPS.quartz[3]);
  fillRect(b, 17, 5, 2, 14, RAMPS.quartz[3]);
  fillRect(b, 2, 10, 18, 2, RAMPS.gold[4]);
  fillRect(b, 3, 5, 16, 1, RAMPS.gold[5]);
  // Heavy padlock clasp
  fillRect(b, 9, 9, 4, 5, RAMPS.gold[5]);
  fillRect(b, 10, 10, 2, 3, RAMPS.quartz[5]);
  b.pset(10, 10, WHITE);
  // Corner brass rivets
  b.pset(3, 6, RAMPS.gold[5]);
  b.pset(18, 6, RAMPS.gold[5]);
  b.pset(3, 17, RAMPS.gold[5]);
  b.pset(18, 17, RAMPS.gold[5]);
  return finishIcon(b, RAMPS.quartz, { smooth: false });
}

function buildTierBackpackIcon(tier) {
  const b = new P.Buf(22, 22);
  const bodyRamp =
    tier === 1 ? RAMPS.emerald :
    tier === 2 ? RAMPS.quartz :
    tier === 3 ? RAMPS.amber : RAMPS.royal;
  const trimRamp =
    tier === 1 ? RAMPS.wood :
    tier === 2 ? RAMPS.prism :
    tier === 3 ? RAMPS.gold : RAMPS.magenta;
  // Top handle loop
  fillRect(b, 8, 2, 6, 2, trimRamp[4]);
  fillRect(b, 9, 3, 4, 1, INK);
  // Main pack silhouette
  shadeMask(b, (x, y) => x >= 4 && x <= 17 && y >= 4 && y <= 18, bodyRamp, { cx: 8, cy: 8, rx: 8, ry: 8 });
  // Side pouches
  fillRect(b, 2, 10, 2, 6, bodyRamp[2]);
  fillRect(b, 18, 10, 2, 6, bodyRamp[2]);
  b.pset(2, 10, bodyRamp[4]);
  b.pset(19, 10, bodyRamp[4]);
  // Top flap + twin leather/metal straps
  fillRect(b, 4, 9, 14, 2, trimRamp[3]);
  fillRect(b, 6, 5, 2, 13, trimRamp[4]);
  fillRect(b, 14, 5, 2, 13, trimRamp[4]);
  // Buckles + Center Tier Gem
  fillRect(b, 6, 10, 2, 2, RAMPS.gold[5]);
  fillRect(b, 14, 10, 2, 2, RAMPS.gold[5]);
  fillRect(b, 9, 12, 4, 4, tier === 4 ? RAMPS.prism[5] : trimRamp[trimRamp.length - 1]);
  b.pset(10, 13, WHITE);
  if (tier >= 3) {
    b.pset(11, 6, RAMPS.gold[5]);
    b.pset(10, 6, WHITE);
  }
  return finishIcon(b, bodyRamp, { smooth: false });
}

function buildBiomeKeyIcon(season) {
  const b = new P.Buf(22, 22);
  const bowRamp =
    season === "spring" ? RAMPS.emerald :
    season === "winter" ? RAMPS.quartz :
    season === "summer" ? RAMPS.amber : RAMPS.royal;
  const gemCol =
    season === "spring" ? RAMPS.magenta[4] :
    season === "winter" ? RAMPS.prism[5] :
    season === "summer" ? RAMPS.gold[5] : RAMPS.magenta[5];
  b.ring(7, 7, 4, 2, RAMPS.gold[4]);
  b.ring(7, 7, 3, 1, bowRamp[4]);
  fillRect(b, 6, 6, 3, 3, gemCol);
  b.pset(6, 6, WHITE);
  for (let i = 0; i <= 8; i++) {
    const x = 10 + i, y = 10 + i;
    b.pset(x, y, RAMPS.gold[4]);
    b.pset(x + 1, y, RAMPS.gold[2]);
    b.pset(x, y - 1, bowRamp[4]);
  }
  fillRect(b, 15, 17, 2, 3, RAMPS.gold[4]);
  fillRect(b, 18, 15, 2, 3, bowRamp[5]);
  b.pset(18, 15, WHITE);
  return finishIcon(b, bowRamp, { smooth: false });
}

function buildExoBloodGreatswordIcon() {
  const b = new P.Buf(22, 22);
  for (let i = 0; i < 12; i++) {
    const x = 18 - i, y = 3 + i;
    fillRect(b, x - 2, y, 3, 2, RAMPS.crimson[3]);
    b.pset(x - 1, y, RAMPS.crimson[5]);
    if (i % 3 === 0) b.pset(x + 1, y + 1, RAMPS.obsidian[4]);
  }
  b.pset(18, 3, WHITE);
  fillRect(b, 4, 13, 8, 2, RAMPS.obsidian[3]);
  fillRect(b, 7, 13, 2, 2, RAMPS.crimson[5]);
  b.pset(7, 13, WHITE);
  fillRect(b, 4, 16, 3, 3, RAMPS.obsidian[2]);
  b.pset(3, 18, RAMPS.crimson[4]);
  return finishIcon(b, RAMPS.crimson, { smooth: false });
}

function buildExoThunderHalberdIcon() {
  const b = new P.Buf(22, 22);
  for (let i = 0; i < 15; i++) {
    b.pset(4 + i, 18 - i, RAMPS.obsidian[3]);
    b.pset(4 + i, 17 - i, RAMPS.gold[3]);
  }
  b.poly([[13, 3], [19, 2], [18, 8], [13, 7]], RAMPS.quartz[4]);
  b.poly([[14, 4], [18, 3], [17, 6]], RAMPS.gold[5]);
  b.pset(18, 2, WHITE);
  b.line(11, 3, 13, 5, RAMPS.gold[5]);
  b.line(17, 9, 19, 12, RAMPS.prism[5]);
  b.pset(19, 12, WHITE);
  return finishIcon(b, RAMPS.gold, { smooth: false });
}

function buildExoBlackholeOrbIcon() {
  const b = new P.Buf(22, 22);
  for (let i = 0; i < 10; i++) {
    b.pset(4 + i, 18 - i, RAMPS.obsidian[3]);
    b.pset(5 + i, 18 - i, RAMPS.royal[2]);
  }
  b.ring(14, 7, 5, 1, RAMPS.magenta[4]);
  b.ring(14, 7, 4, 1, RAMPS.royal[4]);
  b.disc(14, 7, 2, INK);
  b.pset(12, 5, WHITE);
  b.pset(17, 9, RAMPS.prism[5]);
  return finishIcon(b, RAMPS.magenta, { smooth: false });
}

function buildExoPhoenixRodIcon() {
  const b = new P.Buf(22, 22);
  for (let i = 0; i < 11; i++) {
    b.pset(4 + i, 18 - i, RAMPS.gold[3]);
    b.pset(5 + i, 18 - i, RAMPS.amber[2]);
  }
  b.poly([[8, 6], [13, 2], [15, 6], [11, 9]], RAMPS.amber[4]);
  b.poly([[15, 7], [20, 4], [19, 10], [15, 11]], RAMPS.crimson[4]);
  b.disc(14, 7, 2, RAMPS.gold[5]);
  b.pset(14, 6, WHITE);
  return finishIcon(b, RAMPS.amber, { smooth: false });
}

function buildExoChakramIcon() {
  const b = new P.Buf(22, 22);
  b.ring(11, 11, 7, 2, RAMPS.royal[4]);
  b.ring(11, 11, 6, 1, RAMPS.prism[5]);
  b.poly([[11, 1], [13, 4], [9, 4]], WHITE);
  b.poly([[20, 11], [17, 9], [17, 13]], RAMPS.prism[5]);
  b.poly([[11, 20], [13, 17], [9, 17]], RAMPS.magenta[4]);
  b.poly([[1, 11], [4, 9], [4, 13]], RAMPS.prism[5]);
  return finishIcon(b, RAMPS.prism, { smooth: false });
}

function buildExoVenomClawsIcon() {
  const b = new P.Buf(22, 22);
  fillRect(b, 3, 13, 6, 5, RAMPS.obsidian[3]);
  fillRect(b, 4, 14, 4, 2, RAMPS.emerald[2]);
  for (let c = 0; c < 3; c++) {
    const ox = c * 3, oy = c * 2;
    b.line(6 + ox, 12 + oy, 13 + ox, 4 + oy, RAMPS.emerald[4]);
    b.line(7 + ox, 12 + oy, 14 + ox, 5 + oy, RAMPS.emerald[5]);
    b.pset(13 + ox, 4 + oy, WHITE);
  }
  b.pset(17, 14, RAMPS.emerald[5]);
  b.pset(14, 18, RAMPS.emerald[4]);
  return finishIcon(b, RAMPS.emerald, { smooth: false });
}

function buildExoTeslaGunIcon() {
  const b = new P.Buf(22, 22);
  fillRect(b, 3, 9, 14, 5, RAMPS.steel[3]);
  fillRect(b, 4, 8, 12, 2, RAMPS.quartz[4]);
  fillRect(b, 11, 7, 2, 7, RAMPS.gold[4]);
  fillRect(b, 15, 7, 2, 7, RAMPS.gold[5]);
  fillRect(b, 17, 9, 3, 3, RAMPS.prism[5]);
  b.pset(19, 10, WHITE);
  fillRect(b, 4, 14, 3, 5, RAMPS.obsidian[3]);
  b.pset(18, 5, WHITE);
  b.pset(16, 4, RAMPS.prism[5]);
  return finishIcon(b, RAMPS.quartz, { smooth: false });
}

function buildExoRocketLauncherIcon() {
  const b = new P.Buf(22, 22);
  fillRect(b, 3, 7, 15, 7, RAMPS.obsidian[3]);
  fillRect(b, 4, 8, 13, 2, RAMPS.amber[4]);
  fillRect(b, 4, 11, 13, 2, RAMPS.crimson[3]);
  fillRect(b, 17, 7, 3, 3, RAMPS.crimson[5]);
  fillRect(b, 17, 11, 3, 3, RAMPS.gold[5]);
  b.pset(19, 8, WHITE);
  fillRect(b, 5, 14, 3, 4, RAMPS.steel[3]);
  fillRect(b, 2, 9, 2, 5, RAMPS.gold[3]);
  return finishIcon(b, RAMPS.amber, { smooth: false });
}

function buildExoStormCrownIcon() {
  const b = new P.Buf(22, 22);
  fillRect(b, 4, 13, 14, 5, RAMPS.gold[4]);
  fillRect(b, 4, 15, 14, 2, RAMPS.quartz[3]);
  b.poly([[5, 13], [4, 5], [8, 11]], RAMPS.gold[5]);
  b.poly([[9, 13], [11, 2], [13, 13]], RAMPS.prism[5]);
  b.poly([[14, 11], [18, 5], [17, 13]], RAMPS.gold[5]);
  b.pset(11, 3, WHITE);
  fillRect(b, 10, 14, 2, 2, WHITE);
  return finishIcon(b, RAMPS.gold, { smooth: false });
}

function buildExoFrostGazeIcon() {
  const b = new P.Buf(22, 22);
  shadeMask(b, (x, y) => {
    const dx = (x - 10.5) / 7, dy = (y - 11) / 7;
    return dx * dx + dy * dy <= 1 && y <= 17;
  }, RAMPS.quartz, { cx: 8, cy: 7, rx: 7, ry: 7 });
  b.poly([[7, 5], [11, 1], [15, 5]], RAMPS.prism[5]);
  b.pset(11, 2, WHITE);
  fillRect(b, 5, 10, 12, 4, INK);
  fillRect(b, 6, 11, 3, 2, WHITE);
  fillRect(b, 13, 11, 3, 2, WHITE);
  return finishIcon(b, RAMPS.prism, { smooth: false });
}

function buildExoMagmaArmorIcon() {
  const b = new P.Buf(22, 22);
  shadeMask(b, (x, y) => x >= 5 && x <= 16 && y >= 6 && y <= 18, RAMPS.obsidian, { cx: 9, cy: 9, rx: 7, ry: 7 });
  fillRect(b, 2, 6, 4, 5, RAMPS.amber[4]);
  fillRect(b, 16, 6, 4, 5, RAMPS.amber[4]);
  b.pset(3, 6, RAMPS.gold[5]);
  b.pset(17, 6, RAMPS.gold[5]);
  b.disc(11, 11, 3, RAMPS.amber[4]);
  b.disc(11, 11, 2, RAMPS.gold[5]);
  b.pset(11, 10, WHITE);
  return finishIcon(b, RAMPS.amber, { smooth: false });
}

function buildExoVoidShroudIcon() {
  const b = new P.Buf(22, 22);
  b.poly([[6, 5], [16, 5], [19, 18], [3, 18]], RAMPS.royal[2]);
  b.poly([[8, 4], [14, 4], [16, 17], [6, 17]], RAMPS.royal[3]);
  fillRect(b, 9, 7, 4, 10, INK);
  fillRect(b, 10, 9, 2, 2, RAMPS.magenta[5]);
  fillRect(b, 10, 13, 2, 2, RAMPS.prism[5]);
  b.pset(10, 9, WHITE);
  return finishIcon(b, RAMPS.magenta, { smooth: false });
}

function buildExoBlinkBootsIcon() {
  const b = new P.Buf(22, 22);
  fillRect(b, 4, 6, 5, 11, RAMPS.royal[3]);
  fillRect(b, 4, 14, 8, 4, RAMPS.royal[4]);
  fillRect(b, 12, 6, 5, 11, RAMPS.royal[3]);
  fillRect(b, 12, 14, 8, 4, RAMPS.royal[4]);
  fillRect(b, 5, 7, 3, 2, RAMPS.prism[5]);
  fillRect(b, 13, 7, 3, 2, RAMPS.prism[5]);
  fillRect(b, 1, 9, 3, 1, RAMPS.magenta[5]);
  fillRect(b, 2, 12, 2, 1, WHITE);
  return finishIcon(b, RAMPS.magenta, { smooth: false });
}

function buildExoQuakeBootsIcon() {
  const b = new P.Buf(22, 22);
  fillRect(b, 3, 6, 6, 11, RAMPS.obsidian[3]);
  fillRect(b, 3, 14, 8, 4, RAMPS.amber[4]);
  fillRect(b, 12, 6, 6, 11, RAMPS.obsidian[3]);
  fillRect(b, 12, 14, 8, 4, RAMPS.amber[4]);
  fillRect(b, 3, 17, 8, 1, RAMPS.gold[5]);
  fillRect(b, 12, 17, 8, 1, RAMPS.gold[5]);
  b.pset(5, 8, RAMPS.gold[5]);
  b.pset(14, 8, RAMPS.gold[5]);
  return finishIcon(b, RAMPS.amber, { smooth: false });
}

function buildExoMeteorRingIcon() {
  const b = new P.Buf(22, 22);
  b.ring(11, 13, 6, 2, RAMPS.gold[4]);
  b.disc(11, 6, 3, RAMPS.crimson[4]);
  b.disc(11, 6, 2, RAMPS.amber[5]);
  b.pset(11, 5, WHITE);
  b.line(14, 3, 18, 2, RAMPS.gold[5]);
  b.line(15, 5, 19, 4, RAMPS.amber[4]);
  return finishIcon(b, RAMPS.amber, { smooth: false });
}

function buildExoTwinPrismIcon() {
  const b = new P.Buf(22, 22);
  b.poly([[8, 4], [13, 10], [8, 16], [3, 10]], RAMPS.prism[4]);
  b.poly([[14, 6], [19, 12], [14, 18], [9, 12]], RAMPS.magenta[4]);
  b.poly([[8, 7], [10, 10], [8, 13], [6, 10]], WHITE);
  b.poly([[14, 9], [16, 12], [14, 15], [12, 12]], RAMPS.gold[5]);
  return finishIcon(b, RAMPS.prism, { smooth: false });
}

function buildSeaSpringKatanaIcon() {
  const b = new P.Buf(22, 22);
  for (let i = 0; i < 14; i++) {
    b.pset(18 - i, 3 + i, RAMPS.steel[5]);
    b.pset(17 - i, 3 + i, RAMPS.magenta[5]);
  }
  b.pset(18, 3, WHITE);
  fillRect(b, 5, 14, 5, 2, RAMPS.gold[4]);
  fillRect(b, 3, 16, 3, 3, RAMPS.emerald[3]);
  b.pset(6, 5, RAMPS.magenta[5]);
  b.pset(16, 13, RAMPS.magenta[4]);
  b.pset(11, 4, WHITE);
  return finishIcon(b, RAMPS.magenta, { smooth: false });
}

function buildSeaWinterStaffIcon() {
  const b = new P.Buf(22, 22);
  for (let i = 0; i < 11; i++) {
    b.pset(4 + i, 18 - i, RAMPS.quartz[3]);
  }
  b.line(14, 2, 14, 12, RAMPS.prism[5]);
  b.line(9, 7, 19, 7, RAMPS.prism[5]);
  b.line(10, 3, 18, 11, RAMPS.quartz[4]);
  b.line(18, 3, 10, 11, RAMPS.quartz[4]);
  b.disc(14, 7, 2, WHITE);
  return finishIcon(b, RAMPS.prism, { smooth: false });
}

function buildSeaSummerBladesIcon() {
  const b = new P.Buf(22, 22);
  for (let i = 0; i < 12; i++) {
    b.pset(4 + i, 4 + i, RAMPS.amber[4]);
    b.pset(5 + i, 4 + i, RAMPS.gold[5]);
    b.pset(17 - i, 4 + i, RAMPS.crimson[4]);
    b.pset(16 - i, 4 + i, RAMPS.gold[5]);
  }
  b.disc(11, 10, 2, WHITE);
  fillRect(b, 3, 15, 4, 2, RAMPS.gold[4]);
  fillRect(b, 15, 15, 4, 2, RAMPS.gold[4]);
  return finishIcon(b, RAMPS.gold, { smooth: false });
}

function buildSeaEclipseCannonIcon() {
  const b = new P.Buf(22, 22);
  fillRect(b, 3, 8, 14, 6, RAMPS.obsidian[3]);
  fillRect(b, 4, 9, 12, 2, RAMPS.royal[4]);
  fillRect(b, 15, 7, 5, 8, RAMPS.magenta[4]);
  b.disc(18, 11, 2, INK);
  b.pset(17, 9, WHITE);
  fillRect(b, 4, 14, 3, 4, RAMPS.gold[3]);
  return finishIcon(b, RAMPS.magenta, { smooth: false });
}

function buildSeaSpringCrownIcon() {
  const b = new P.Buf(22, 22);
  b.ring(11, 12, 7, 2, RAMPS.emerald[4]);
  for (const [fx, fy] of [[6, 8], [11, 5], [16, 8]]) {
    b.disc(fx, fy, 2, RAMPS.magenta[5]);
    b.pset(fx, fy, WHITE);
  }
  return finishIcon(b, RAMPS.emerald, { smooth: false });
}

function buildSeaWinterCloakIcon() {
  const b = new P.Buf(22, 22);
  b.poly([[6, 5], [16, 5], [19, 18], [3, 18]], RAMPS.quartz[3]);
  fillRect(b, 5, 5, 12, 3, WHITE);
  b.line(11, 9, 11, 16, RAMPS.prism[5]);
  b.line(8, 12, 14, 12, RAMPS.prism[5]);
  return finishIcon(b, RAMPS.quartz, { smooth: false });
}

function buildSeaSummerCharmIcon() {
  const b = new P.Buf(22, 22);
  b.disc(11, 11, 5, RAMPS.amber[4]);
  b.disc(11, 11, 3, RAMPS.gold[5]);
  b.pset(10, 10, WHITE);
  for (const [rx, ry] of [[11, 2], [11, 19], [2, 11], [19, 11], [4, 4], [18, 4], [4, 18], [18, 18]]) {
    b.pset(rx, ry, RAMPS.gold[5]);
  }
  return finishIcon(b, RAMPS.gold, { smooth: false });
}

function buildSeaEclipseHaloIcon() {
  const b = new P.Buf(22, 22);
  b.ring(11, 11, 7, 2, RAMPS.gold[5]);
  b.ring(11, 11, 6, 1, RAMPS.magenta[5]);
  b.disc(11, 11, 4, INK);
  b.pset(7, 7, WHITE);
  b.pset(16, 15, RAMPS.prism[5]);
  return finishIcon(b, RAMPS.magenta, { smooth: false });
}

function buildWsGaleArcIcon() {
  const b = new P.Buf(22, 22);
  b.ring(10, 11, 7, 2, RAMPS.emerald[4]);
  clearRect(b, 1, 2, 9, 18);
  b.ring(11, 11, 5, 1, WHITE);
  clearRect(b, 1, 2, 10, 18);
  b.line(3, 8, 9, 8, RAMPS.emerald[5]);
  b.line(4, 13, 10, 13, RAMPS.emerald[3]);
  return finishIcon(b, RAMPS.emerald, { smooth: false });
}

function buildWsFrostWaveIcon() {
  const b = new P.Buf(22, 22);
  b.poly([[11, 2], [15, 10], [11, 19], [7, 10]], RAMPS.quartz[4]);
  b.poly([[3, 11], [11, 7], [19, 11], [11, 15]], RAMPS.prism[5]);
  b.disc(11, 11, 2, WHITE);
  return finishIcon(b, RAMPS.prism, { smooth: false });
}

function buildWsQuakeSlamIcon() {
  const b = new P.Buf(22, 22);
  fillRect(b, 7, 3, 8, 6, RAMPS.amber[4]);
  fillRect(b, 10, 9, 2, 5, RAMPS.wood[3]);
  b.line(2, 16, 8, 14, RAMPS.gold[5]);
  b.line(8, 14, 11, 18, RAMPS.amber[5]);
  b.line(11, 18, 14, 14, RAMPS.gold[5]);
  b.line(14, 14, 20, 16, RAMPS.amber[4]);
  b.pset(11, 14, WHITE);
  return finishIcon(b, RAMPS.amber, { smooth: false });
}

function buildWsBloodWaveIcon() {
  const b = new P.Buf(22, 22);
  b.ring(10, 11, 7, 2, RAMPS.crimson[4]);
  clearRect(b, 0, 0, 10, 22);
  b.ring(11, 11, 5, 1, RAMPS.crimson[5]);
  clearRect(b, 0, 0, 11, 22);
  b.pset(16, 6, WHITE);
  b.disc(6, 11, 2, RAMPS.crimson[5]);
  return finishIcon(b, RAMPS.crimson, { smooth: false });
}

function buildWsThunderBoltIcon() {
  const b = new P.Buf(22, 22);
  b.poly([[13, 2], [6, 11], [11, 11], [8, 19], [16, 9], [11, 9]], RAMPS.gold[5]);
  b.line(12, 4, 8, 10, WHITE);
  b.line(13, 10, 10, 16, WHITE);
  return finishIcon(b, RAMPS.gold, { smooth: false });
}

function buildWsBlackholeIcon() {
  const b = new P.Buf(22, 22);
  b.ring(11, 11, 8, 1, RAMPS.royal[4]);
  b.ring(11, 11, 6, 2, RAMPS.magenta[4]);
  b.disc(11, 11, 4, INK);
  b.pset(7, 6, WHITE);
  b.pset(15, 16, RAMPS.prism[5]);
  return finishIcon(b, RAMPS.magenta, { smooth: false });
}

function buildWsPhoenixFlameIcon() {
  const b = new P.Buf(22, 22);
  b.poly([[2, 9], [9, 6], [11, 12], [5, 15]], RAMPS.amber[4]);
  b.poly([[20, 9], [13, 6], [11, 12], [17, 15]], RAMPS.amber[4]);
  b.poly([[11, 2], [14, 10], [11, 19], [8, 10]], RAMPS.crimson[4]);
  b.poly([[11, 5], [13, 10], [11, 15], [9, 10]], RAMPS.gold[5]);
  b.pset(11, 7, WHITE);
  return finishIcon(b, RAMPS.amber, { smooth: false });
}

function buildWsStarfallIcon() {
  const b = new P.Buf(22, 22);
  for (const [sx, sy, c] of [[7, 15, RAMPS.prism[5]], [14, 13, RAMPS.magenta[5]], [11, 7, RAMPS.gold[5]]]) {
    b.line(sx - 4, sy - 4, sx, sy, c);
    b.disc(sx, sy, 2, c);
    b.pset(sx, sy, WHITE);
  }
  return finishIcon(b, RAMPS.prism, { smooth: false });
}

function buildWsChakramIcon() {
  const b = new P.Buf(22, 22);
  b.ring(11, 11, 6, 2, RAMPS.prism[5]);
  b.line(3, 5, 19, 17, RAMPS.magenta[5]);
  b.line(19, 5, 3, 17, WHITE);
  b.disc(11, 11, 2, INK);
  return finishIcon(b, RAMPS.prism, { smooth: false });
}

function buildWsVenomFlurryIcon() {
  const b = new P.Buf(22, 22);
  b.line(4, 16, 16, 4, RAMPS.emerald[5]);
  b.line(4, 11, 13, 3, RAMPS.emerald[4]);
  b.line(9, 18, 18, 9, RAMPS.emerald[5]);
  b.disc(15, 15, 2, RAMPS.emerald[4]);
  b.pset(16, 4, WHITE);
  return finishIcon(b, RAMPS.emerald, { smooth: false });
}

function buildWsTeslaPylonIcon() {
  const b = new P.Buf(22, 22);
  fillRect(b, 9, 9, 4, 10, RAMPS.steel[3]);
  fillRect(b, 6, 17, 10, 2, RAMPS.obsidian[3]);
  b.disc(11, 7, 3, RAMPS.prism[5]);
  b.pset(11, 6, WHITE);
  b.line(3, 5, 8, 7, RAMPS.gold[5]);
  b.line(14, 7, 19, 5, RAMPS.gold[5]);
  b.line(4, 11, 8, 9, RAMPS.prism[5]);
  b.line(14, 9, 18, 11, RAMPS.prism[5]);
  return finishIcon(b, RAMPS.prism, { smooth: false });
}

function buildWsRocketSalvoIcon() {
  const b = new P.Buf(22, 22);
  for (const [rx, ry] of [[8, 6], [15, 9], [11, 14]]) {
    b.line(rx - 4, ry + 4, rx, ry, RAMPS.amber[4]);
    fillRect(b, rx - 1, ry - 1, 3, 3, RAMPS.crimson[5]);
    b.pset(rx + 1, ry - 1, WHITE);
  }
  return finishIcon(b, RAMPS.amber, { smooth: false });
}

// =========================================================================
// 3. PACK ATLASES & SAVE VISUAL INSPECTION CONTACT SHEETS
// =========================================================================

const iconSpecs = [
  ["sword_t1", () => buildSwordIcon(1)],
  ["sword_t2", () => buildSwordIcon(2)],
  ["sword_t3", () => buildSwordIcon(3)],
  ["halberd_t3", () => buildSwordIcon(3, "halberd")],
  ["sword_t4", () => buildSwordIcon(4)],
  ["sword_t5", () => buildSwordIcon(5)],

  ["staff_t1", () => buildStaffIcon(1)],
  ["staff_t2", () => buildStaffIcon(2)],
  ["staff_t3", () => buildStaffIcon(3)],
  ["staff_t4", () => buildStaffIcon(4)],
  ["staff_t5", () => buildStaffIcon(5)],

  ["dagger_t1", () => buildDaggerIcon(1)],
  ["dagger_t2", () => buildDaggerIcon(2)],
  ["dagger_t3", () => buildDaggerIcon(3)],
  ["dagger_t4", () => buildDaggerIcon(4)],
  ["dagger_t5", () => buildDaggerIcon(5)],

  ["gun_t1", () => buildGunIcon(1)],
  ["gun_t2", () => buildGunIcon(2)],
  ["gun_t3", () => buildGunIcon(3)],
  ["gun_t4", () => buildGunIcon(4)],
  ["gun_t5", () => buildGunIcon(5)],

  ["helmet_t1", () => buildHelmetIcon(1)],
  ["helmet_t2", () => buildHelmetIcon(2)],
  ["helmet_t3", () => buildHelmetIcon(3)],
  ["helmet_t4", () => buildHelmetIcon(4)],
  ["helmet_t5", () => buildHelmetIcon(5)],

  ["armor_t1", () => buildArmorIcon(1)],
  ["armor_t2", () => buildArmorIcon(2)],
  ["armor_t3", () => buildArmorIcon(3)],
  ["armor_t4", () => buildArmorIcon(4)],
  ["armor_t5", () => buildArmorIcon(5)],

  ["boots_t1", () => buildBootsIcon(1)],
  ["boots_t2", () => buildBootsIcon(2)],
  ["boots_t3", () => buildBootsIcon(3)],
  ["boots_t4", () => buildBootsIcon(4)],
  ["boots_t5", () => buildBootsIcon(5)],

  ["ring_t1", () => buildRingIcon(1)],
  ["ring_t2", () => buildRingIcon(2)],
  ["ring_t3", () => buildRingIcon(3)],
  ["ring_t4", () => buildRingIcon(4)],
  ["ring_t5", () => buildRingIcon(5)],

  ["chip_t1", () => buildChipIcon(1)],
  ["chip_t2", () => buildChipIcon(2)],
  ["chip_t3", () => buildChipIcon(3)],
  ["chip_t4", () => buildChipIcon(4)],
  ["chip_t5", () => buildChipIcon(5)],

  ["pot_hp_t1", () => buildPotionIcon("hp", 1)],
  ["pot_hp_t2", () => buildPotionIcon("hp", 2)],
  ["pot_hp_t3", () => buildPotionIcon("hp", 3)],
  ["pot_hp_t4", () => buildPotionIcon("hp", 4)],
  ["pot_hp_t5", () => buildPotionIcon("hp", 5)],
  ["pot_sta_t1", () => buildPotionIcon("stamina", 1)],
  ["pot_sta_t2", () => buildPotionIcon("stamina", 2)],
  ["pot_sta_t4", () => buildPotionIcon("stamina", 4)],
  ["pot_atk_t2", () => buildPotionIcon("power", 2)],
  ["pot_atk_t3", () => buildPotionIcon("power", 3)],
  ["pot_atk_t5", () => buildPotionIcon("power", 5)],
  ["pot_def_t3", () => buildPotionIcon("aegis", 3)],

  ["mat_iron_ore", () => buildMaterialIcon("ore")],
  ["mat_glitch_core", () => buildMaterialIcon("core")],
  ["mat_prism_shard", () => buildMaterialIcon("prism")],
  ["mat_quartz_shard", () => buildMaterialIcon("quartz")],
  ["mat_amber_gem", () => buildMaterialIcon("amber")],
  ["mat_void_prism", () => buildMaterialIcon("void")],

  // === UI & HUD SKILL PIXEL ICONS (16) ===
  ["ui_backpack", () => buildUiBackpackIcon()],
  ["ui_lock", () => buildUiLockIcon()],
  ["skill_unarmed", () => buildSkillUnarmedIcon()],
  ["skill_dash", () => buildSkillDashIcon()],
  ["skill_knight_lmb", () => buildSkillKnightLmbIcon()],
  ["skill_knight_e", () => buildSkillKnightEIcon()],
  ["skill_knight_q", () => buildSkillKnightQIcon()],
  ["skill_mage_lmb", () => buildSkillMageLmbIcon()],
  ["skill_mage_e", () => buildSkillMageEIcon()],
  ["skill_mage_q", () => buildSkillMageQIcon()],
  ["skill_rogue_lmb", () => buildSkillRogueLmbIcon()],
  ["skill_rogue_e", () => buildSkillRogueEIcon()],
  ["skill_rogue_q", () => buildSkillRogueQIcon()],
  ["skill_tinker_lmb", () => buildSkillTinkerLmbIcon()],
  ["skill_tinker_e", () => buildSkillTinkerEIcon()],
  ["skill_tinker_q", () => buildSkillTinkerQIcon()],

  // === BESPOKE SPECIAL / BOSS / MYTHIC EQUIPMENT ICONS (17) ===
  ["wpn_prism_blade", () => buildSpecialPrismBladeIcon()],
  ["wpn_eraser_edge", () => buildSpecialEraserEdgeIcon()],
  ["wpn_void_scythe", () => buildSpecialVoidScytheIcon()],
  ["wpn_quake_maul", () => buildSpecialQuakeMaulIcon()],
  ["wpn_warden_cleaver", () => buildSpecialWardenCleaverIcon()],
  ["wpn_astral_scepter", () => buildSpecialAstralScepterIcon()],
  ["wpn_quantum_blades", () => buildSpecialQuantumBladesIcon()],
  ["wpn_singularity_cannon", () => buildSpecialSingularityCannonIcon()],
  ["wpn_nebula_staff", () => buildSpecialNebulaStaffIcon()],
  ["wpn_eclipse_fangs", () => buildSpecialEclipseFangsIcon()],
  ["wpn_nova_railgun", () => buildSpecialNovaRailgunIcon()],
  ["helm_aethel_crown", () => buildSpecialAethelCrownIcon()],
  ["helm_dragon_visor", () => buildSpecialDragonVisorIcon()],
  ["armor_warden_mantle", () => buildSpecialWardenMantleIcon()],
  ["armor_chroma_aegis", () => buildSpecialChromaAegisIcon()],
  ["boots_null_treads", () => buildSpecialNullTreadsIcon()],
  ["acc_siphon_sigil", () => buildSpecialSiphonSigilIcon()],
  // === V3.0 GACHA UI, 4 BIOME KEYS, 16 EXOTIC ITEMS, 8 SEASONAL ITEMS & 12 WEAPON SKILL ICONS (41) ===
  ["ui_gacha_chest", () => buildUiGachaChestIcon()],
  ["key_spring", () => buildBiomeKeyIcon("spring")],
  ["key_winter", () => buildBiomeKeyIcon("winter")],
  ["key_summer", () => buildBiomeKeyIcon("summer")],
  ["key_eclipse", () => buildBiomeKeyIcon("eclipse")],

  ["exo_blood_gs", () => buildExoBloodGreatswordIcon()],
  ["exo_thunder_halb", () => buildExoThunderHalberdIcon()],
  ["exo_blackhole_orb", () => buildExoBlackholeOrbIcon()],
  ["exo_phoenix_rod", () => buildExoPhoenixRodIcon()],
  ["exo_boomerang_chakram", () => buildExoChakramIcon()],
  ["exo_venom_claws", () => buildExoVenomClawsIcon()],
  ["exo_tesla_gun", () => buildExoTeslaGunIcon()],
  ["exo_rocket_barrage", () => buildExoRocketLauncherIcon()],

  ["exo_storm_crown", () => buildExoStormCrownIcon()],
  ["exo_frost_gaze", () => buildExoFrostGazeIcon()],
  ["exo_magma_armor", () => buildExoMagmaArmorIcon()],
  ["exo_void_shroud", () => buildExoVoidShroudIcon()],
  ["exo_blink_boots", () => buildExoBlinkBootsIcon()],
  ["exo_quake_boots", () => buildExoQuakeBootsIcon()],
  ["exo_meteor_ring", () => buildExoMeteorRingIcon()],
  ["exo_twin_prism", () => buildExoTwinPrismIcon()],

  ["sea_spring_katana", () => buildSeaSpringKatanaIcon()],
  ["sea_winter_staff", () => buildSeaWinterStaffIcon()],
  ["sea_summer_blades", () => buildSeaSummerBladesIcon()],
  ["sea_eclipse_cannon", () => buildSeaEclipseCannonIcon()],
  ["sea_spring_crown", () => buildSeaSpringCrownIcon()],
  ["sea_winter_cloak", () => buildSeaWinterCloakIcon()],
  ["sea_summer_charm", () => buildSeaSummerCharmIcon()],
  ["sea_eclipse_halo", () => buildSeaEclipseHaloIcon()],

  ["ws_gale_arc", () => buildWsGaleArcIcon()],
  ["ws_frost_wave", () => buildWsFrostWaveIcon()],
  ["ws_quake_slam", () => buildWsQuakeSlamIcon()],
  ["ws_blood_wave", () => buildWsBloodWaveIcon()],
  ["ws_thunder_bolt", () => buildWsThunderBoltIcon()],
  ["ws_blackhole", () => buildWsBlackholeIcon()],
  ["ws_phoenix_flame", () => buildWsPhoenixFlameIcon()],
  ["ws_starfall", () => buildWsStarfallIcon()],
  ["ws_chakram", () => buildWsChakramIcon()],
  ["ws_venom_flurry", () => buildWsVenomFlurryIcon()],
  ["ws_tesla_pylon", () => buildWsTeslaPylonIcon()],
  ["ws_rocket_salvo", () => buildWsRocketSalvoIcon()],
  ["ui_stash_chest", () => buildUiStashChestIcon()],
  ["ui_backpack_t1", () => buildTierBackpackIcon(1)],
  ["ui_backpack_t2", () => buildTierBackpackIcon(2)],
  ["ui_backpack_t3", () => buildTierBackpackIcon(3)],
  ["ui_backpack_t4", () => buildTierBackpackIcon(4)],
];

const iconEntries = iconSpecs.map(([id, fn]) => ({ id, buf: fn() }));
const ICON_COLS = 8;
const iconAtlas = P.pack(iconEntries.map((e) => e.buf), { cols: ICON_COLS, pad: 0 });
P.save(iconAtlas, path.join(ASSETS_DIR, "codixel-icons.png"));

const iconMap = {};
iconEntries.forEach((e, i) => {
  iconMap[e.id] = { x: (i % ICON_COLS) * 24, y: Math.floor(i / ICON_COLS) * 24, w: 24, h: 24 };
});
fs.writeFileSync(path.join(ASSETS_DIR, "codixel-icons.json"), JSON.stringify({ tileSize: 24, frames: iconMap }, null, 2));

const iconSheet = P.sheet(
  iconEntries.map((e) => ({ buf: e.buf, label: e.id.toUpperCase().replace(/_/g, " "), scale: 3 })),
  { cols: 8, gap: 6, labelScale: 1 }
);
P.save(iconSheet, path.join(SCRATCH_DIR, "codixel_icons_sheet.png"));

const v3Sheet = P.sheet(
  iconEntries.slice(97).map((e) => ({ buf: e.buf, label: e.id.toUpperCase().replace(/_/g, " "), scale: 4 })),
  { cols: 7, gap: 8, labelScale: 1 }
);
P.save(v3Sheet, path.join(SCRATCH_DIR, "v3_icons_preview.png"));

// Paper-Doll overlays
const pdSpecs = [];
for (let t = 1; t <= 5; t++) {
  pdSpecs.push([`cape_t${t}`, () => buildPaperDollCape(t)]);
  pdSpecs.push([`helmet_t${t}`, () => buildPaperDollHelmet(t)]);
  pdSpecs.push([`armor_t${t}`, () => buildPaperDollArmor(t)]);
  pdSpecs.push([`boots_t${t}_0`, () => buildPaperDollBoots(t, 0)]);
  pdSpecs.push([`boots_t${t}_1`, () => buildPaperDollBoots(t, 1)]);
  for (const fam of ["sword", "staff", "dagger", "gun"]) {
    pdSpecs.push([`wpn_${fam}_t${t}_idle`, () => buildPaperDollWeapon(fam, t, false)]);
    pdSpecs.push([`wpn_${fam}_t${t}_atk`, () => buildPaperDollWeapon(fam, t, true)]);
  }
  pdSpecs.push([`acc_ring_t${t}`, () => {
    const out = new P.Buf(24, 24);
    stamp(out, buildPaperDollAcc("ring", t), 7, 7);
    return out;
  }]);
  pdSpecs.push([`acc_chip_t${t}`, () => {
    const out = new P.Buf(24, 24);
    stamp(out, buildPaperDollAcc("chip", t), 7, 7);
    return out;
  }]);
}
pdSpecs.push(["wpn_halberd_t3_idle", () => buildPaperDollWeapon("halberd", 3, false)]);
pdSpecs.push(["wpn_halberd_t3_atk", () => buildPaperDollWeapon("halberd", 3, true)]);

const pdEntries = pdSpecs.map(([id, fn]) => ({ id, buf: fn() }));
const PD_COLS = 10;
const pdAtlas = P.pack(pdEntries.map((e) => e.buf), { cols: PD_COLS, pad: 0 });
P.save(pdAtlas, path.join(ASSETS_DIR, "codixel-paperdoll.png"));

const pdMap = {};
pdEntries.forEach((e, i) => {
  pdMap[e.id] = { x: (i % PD_COLS) * 24, y: Math.floor(i / PD_COLS) * 24, w: 24, h: 24 };
});
fs.writeFileSync(path.join(ASSETS_DIR, "codixel-paperdoll.json"), JSON.stringify({ tileSize: 24, frames: pdMap }, null, 2));

const heroShowcase = [];
for (let t = 1; t <= 5; t++) {
  for (const fam of ["sword", "staff", "dagger", "gun"]) {
    const comp = new P.Buf(24, 24);
    stamp(comp, pdEntries.find((e) => e.id === `cape_t${t}`).buf, 0, 0);
    // Hero body silhouette matching real 16x16 hero placed at (4,4) inside 24x24
    fillRect(comp, 8, 6, 8, 5, P.rgb(220, 200, 185));
    comp.pset(10, 8, INK);
    comp.pset(14, 8, INK);
    fillRect(comp, 8, 11, 8, 5, P.rgb(90, 105, 130));
    fillRect(comp, 8, 16, 3, 3, P.rgb(65, 72, 90));
    fillRect(comp, 13, 16, 3, 3, P.rgb(65, 72, 90));
    stamp(comp, pdEntries.find((e) => e.id === `boots_t${t}_0`).buf, 0, 0);
    stamp(comp, pdEntries.find((e) => e.id === `armor_t${t}`).buf, 0, 0);
    stamp(comp, pdEntries.find((e) => e.id === `helmet_t${t}`).buf, 0, 0);
    stamp(comp, pdEntries.find((e) => e.id === `wpn_${fam}_t${t}_idle`).buf, 0, 0);
    heroShowcase.push({ buf: comp, label: `T${t} ${fam.toUpperCase()}`, scale: 4 });
  }
}
const pdSheet = P.sheet(heroShowcase, { cols: 4, gap: 6, labelScale: 1 });
P.save(pdSheet, path.join(SCRATCH_DIR, "codixel_paperdoll_sheet.png"));

console.log(`Generated ${iconEntries.length} icons (${iconAtlas.w}x${iconAtlas.h}) and ${pdEntries.length} paper-doll overlays (${pdAtlas.w}x${pdAtlas.h}).`);
