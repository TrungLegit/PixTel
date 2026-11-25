import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const P = require("C:/Users/trung/.gemini/config/skills/codixel/core/pixel.js");

const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, "src", "assets");
const SCRATCH_DIR = "C:/Users/trung/.gemini/antigravity/brain/42787f9e-d026-43db-9398-91af03fb592b/scratch";
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
