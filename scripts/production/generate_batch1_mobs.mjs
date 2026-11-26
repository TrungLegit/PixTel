import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ROOT = process.cwd();
const P = require(path.join(ROOT, ".agents", "skills", "codixel", "core", "pixel.js"));

const ASSETS_DIR = path.join(ROOT, "src", "assets");
const ATLAS_PNG = path.join(ASSETS_DIR, "codixel-enemies.png");
const ATLAS_JSON = path.join(ASSETS_DIR, "codixel-enemies.json");

const INK = P.rgb(26, 22, 37); // #1a1625
const WHITE = P.rgb(255, 255, 255);
const NEW_IDS = new Set(["zephyr_moth", "prism_arachnid", "amber_crucible", "chrono_arbiter"]);

function hexRgb(h) {
  const s = h.replace("#", "");
  const n = parseInt(s, 16);
  return P.rgb((n >> 16) & 255, (n >> 8) & 255, n & 255);
}

// Helper: draw onto a floating-point / integer MaskBuf (1 = filled, 0 = empty) or color Buf
class LayerPainter {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.buf = new P.Buf(w, h);
  }
  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }
  pset(x, y, c) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (this.inBounds(ix, iy)) this.buf.pset(ix, iy, c);
  }
  get(x, y) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    return this.inBounds(ix, iy) ? this.buf.px[iy * this.w + ix] : 0;
  }
  // Fill ellipse using directional top-left ramp shading + narrow band edge dither
  ellipse(cx, cy, rx, ry, ramp, opts = {}) {
    const lx = opts.lx ?? -0.7;
    const ly = opts.ly ?? -0.7;
    const rot = opts.rot ?? 0;
    const cr = Math.cos(rot);
    const sr = Math.sin(rot);
    const x0 = Math.max(0, Math.floor(cx - Math.max(rx, ry) - 2));
    const x1 = Math.min(this.w - 1, Math.ceil(cx + Math.max(rx, ry) + 2));
    const y0 = Math.max(0, Math.floor(cy - Math.max(rx, ry) - 2));
    const y1 = Math.min(this.h - 1, Math.ceil(cy + Math.max(rx, ry) + 2));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const u = (dx * cr + dy * sr) / rx;
        const v = (-dx * sr + dy * cr) / ry;
        if (u * u + v * v <= 1.0) {
          const dot = u * lx + v * ly;
          const val = P.clamp(0.5 + dot * 0.48 + (opts.bias ?? 0));
          const idx = P.band(val, ramp.length, x, y, opts.dither ?? 0.24);
          this.buf.pset(x, y, ramp[idx]);
        }
      }
    }
  }
  // Fill polygon (integer coords) with directional ramp shading
  poly(pts, ramp, opts = {}) {
    let minX = this.w, minY = this.h, maxX = -1, maxY = -1;
    for (const [px, py] of pts) {
      if (px < minX) minX = px;
      if (py < minY) minY = py;
      if (px > maxX) maxX = px;
      if (py > maxY) maxY = py;
    }
    minX = Math.max(0, Math.floor(minX));
    minY = Math.max(0, Math.floor(minY));
    maxX = Math.min(this.w - 1, Math.ceil(maxX));
    maxY = Math.min(this.h - 1, Math.ceil(maxY));
    const cx = opts.cx ?? (minX + maxX) * 0.5;
    const cy = opts.cy ?? (minY + maxY) * 0.5;
    const rx = Math.max(1, opts.rx ?? (maxX - minX) * 0.55);
    const ry = Math.max(1, opts.ry ?? (maxY - minY) * 0.55);
    const lx = opts.lx ?? -0.7;
    const ly = opts.ly ?? -0.7;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (pointInPoly(x + 0.01, y + 0.01, pts)) {
          const nx = (x - cx) / rx;
          const ny = (y - cy) / ry;
          const val = P.clamp(0.5 + (nx * lx + ny * ly) * 0.46 + (opts.bias ?? 0));
          const idx = P.band(val, ramp.length, x, y, opts.dither ?? 0.22);
          this.buf.pset(x, y, ramp[idx]);
        }
      }
    }
  }
  // Thick capsule segment with directional top-left shading
  capsule(x0, y0, x1, y1, r0, r1, ramp, opts = {}) {
    const minX = Math.max(0, Math.floor(Math.min(x0, x1) - Math.max(r0, r1) - 1));
    const maxX = Math.min(this.w - 1, Math.ceil(Math.max(x0, x1) + Math.max(r0, r1) + 1));
    const minY = Math.max(0, Math.floor(Math.min(y0, y1) - Math.max(r0, r1) - 1));
    const maxY = Math.min(this.h - 1, Math.ceil(Math.max(y0, y1) + Math.max(r0, r1) + 1));
    const vx = x1 - x0;
    const vy = y1 - y0;
    const len2 = vx * vx + vy * vy || 1;
    const lx = opts.lx ?? -0.7;
    const ly = opts.ly ?? -0.7;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const t = P.clamp(((x - x0) * vx + (y - y0) * vy) / len2);
        const cx = x0 + vx * t;
        const cy = y0 + vy * t;
        const r = r0 + (r1 - r0) * t;
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r * r) {
          const nx = dx / Math.max(0.8, r);
          const ny = dy / Math.max(0.8, r);
          const val = P.clamp(0.52 + (nx * lx + ny * ly) * 0.46 + (opts.bias ?? 0));
          const idx = P.band(val, ramp.length, x, y, opts.dither ?? 0.2);
          this.buf.pset(x, y, ramp[idx]);
        }
      }
    }
  }
  // 1px pixel-perfect line
  line(x0, y0, x1, y1, col) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    const mask = new Uint8Array(this.w * this.h);
    for (let i = 0; i <= Math.ceil(steps); i++) {
      const t = i / Math.ceil(steps);
      const ix = Math.round(x0 + (x1 - x0) * t);
      const iy = Math.round(y0 + (y1 - y0) * t);
      if (this.inBounds(ix, iy)) mask[iy * this.w + ix] = 1;
    }
    P.pixelPerfect(mask, this.w, this.h);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (mask[y * this.w + x]) this.buf.pset(x, y, col);
      }
    }
  }
  // Arc ring
  ring(cx, cy, rx, ry, thick, ramp, opts = {}) {
    const a0 = opts.a0 ?? 0;
    const a1 = opts.a1 ?? Math.PI * 2;
    const minX = Math.max(0, Math.floor(cx - rx - thick - 1));
    const maxX = Math.min(this.w - 1, Math.ceil(cx + rx + thick + 1));
    const minY = Math.max(0, Math.floor(cy - ry - thick - 1));
    const maxY = Math.min(this.h - 1, Math.ceil(cy + ry + thick + 1));
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        const d = Math.hypot(dx, dy);
        const distPx = Math.abs(d - 1.0) * Math.min(rx, ry);
        if (distPx <= thick * 0.5) {
          let ang = Math.atan2(y - cy, x - cx);
          if (!angleInArc(ang, a0, a1)) continue;
          const val = P.clamp(0.55 + ((x - cx) / rx * -0.7 + (y - cy) / ry * -0.7) * 0.42);
          const idx = P.band(val, ramp.length, x, y, 0.2);
          this.buf.pset(x, y, ramp[idx]);
        }
      }
    }
  }
  // Mirror horizontally and optionally copy into target
  static mirrorX(srcBuf) {
    const out = new P.Buf(srcBuf.w, srcBuf.h);
    for (let y = 0; y < srcBuf.h; y++) {
      for (let x = 0; x < srcBuf.w; x++) {
        const c = srcBuf.px[y * srcBuf.w + x];
        if (c >>> 24) out.pset(srcBuf.w - 1 - x, y, c);
      }
    }
    return out;
  }
}

function pointInPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1];
    const xj = pts[j][0], yj = pts[j][1];
    const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function angleInArc(a, a0, a1) {
  if (a1 - a0 >= Math.PI * 2 - 1e-4) return true;
  const tau = Math.PI * 2;
  const norm = (v) => ((v % tau) + tau) % tau;
  const na = norm(a);
  const n0 = norm(a0);
  const n1 = norm(a1);
  if (n0 <= n1) return na >= n0 && na <= n1;
  return na >= n0 || na <= n1;
}

function flipPtsX(pts, w) {
  return pts.map(([x, y]) => [w - 1 - x, y]);
}

function wrapOutline(innerBuf, w, h) {
  const outlined = P.outline(innerBuf, INK, { corners: false });
  if (outlined.w === w && outlined.h === h) {
    // Enforce binary alpha {0, 255}
    for (let i = 0; i < outlined.px.length; i++) {
      const a = outlined.px[i] >>> 24;
      outlined.px[i] = a > 0 ? (outlined.px[i] | 0xff000000) >>> 0 : 0;
    }
    return outlined;
  }
  const out = new P.Buf(w, h);
  for (let y = 0; y < Math.min(h, outlined.h); y++) {
    for (let x = 0; x < Math.min(w, outlined.w); x++) {
      const c = outlined.px[y * outlined.w + x];
      if (c >>> 24) out.pset(x, y, (c | 0xff000000) >>> 0);
    }
  }
  return out;
}

// =========================================================================
// MOB 1: zephyr_moth (34 x 32, floating: true -> interior 32 x 30)
// =========================================================================
const MOTH_THORAX = [hexRgb("#324b3a"), hexRgb("#4c7958"), hexRgb("#6aa876"), hexRgb("#9bd298"), hexRgb("#c4f2b8")];
const MOTH_WING = [hexRgb("#1b4d3e"), hexRgb("#22755b"), hexRgb("#2ca378"), hexRgb("#48c994"), hexRgb("#64e8aa")];
const MOTH_EYE = [hexRgb("#1ca3b8"), hexRgb("#44d4e6"), hexRgb("#66f7ff"), hexRgb("#b8fbff"), hexRgb("#e8ffff")];

function drawZephyrMoth(dir, pose) {
  const IW = 32, IH = 30;
  const lp = new LayerPainter(IW, IH);
  const bob = pose === ":1" ? -1 : pose === ":2" ? 1 : 0;
  const wLift = pose === ":1" ? -3 : pose === ":2" ? 2 : pose === ":atk" ? -1 : 0;
  const wSpan = pose === ":atk" ? 2 : pose === ":2" ? 1 : 0;

  if (dir === "front" || dir === "back") {
    const cx = 15.5;
    const ty = 14 + bob;

    // Swallowtail lower hindwings
    for (const s of [-1, 1]) {
      const hx = (x) => cx + s * x;
      const tailY = pose === ":1" ? 24 : pose === ":2" ? 26 : 25;
      lp.poly(
        [
          [hx(2), ty + 1],
          [hx(9 + wSpan), ty + 2 + Math.max(0, wLift)],
          [hx(8 + wSpan), ty + 7 + Math.max(0, wLift)],
          [hx(5 + (pose === ":1" ? -1 : 0)), tailY + bob],
          [hx(3), ty + 8],
        ],
        MOTH_WING,
        { bias: dir === "back" ? 0.05 : -0.06 }
      );
      // Tail tip cyan glint
      lp.pset(hx(5 + (pose === ":1" ? -1 : 0)), tailY - 1 + bob, MOTH_EYE[2]);
    }

    // Large notched upper forewings
    for (const s of [-1, 1]) {
      const fx = (x) => cx + s * x;
      const wingTop = ty - 9 + wLift;
      const wingBot = ty + 4 + Math.max(0, wLift);
      lp.poly(
        [
          [fx(2), ty - 3],
          [fx(8 + wSpan), wingTop],
          [fx(13 + wSpan), wingTop + 2],
          [fx(14 + wSpan), ty - 2 + wLift],
          [fx(11 + wSpan), ty + 1 + wLift],
          [fx(12 + wSpan), wingBot],
          [fx(4), ty + 3],
        ],
        MOTH_WING,
        { cx: fx(8), cy: wingTop + 5, rx: 7, ry: 7, bias: dir === "back" ? 0.08 : 0 }
      );
      // Wing vein & bright rim
      lp.line(fx(3), ty - 2, fx(11 + wSpan), wingTop + 3, MOTH_WING[0]);
      lp.line(fx(4), ty + 1, fx(10 + wSpan), ty + 1 + wLift, MOTH_WING[1]);
      // Prominent eyespots on forewings
      const ex = fx(8 + Math.floor(wSpan * 0.5));
      const ey = ty - 3 + wLift;
      lp.ellipse(ex, ey, 2.2, 2.0, MOTH_EYE, { bias: pose === ":atk" ? 0.3 : 0.1 });
      lp.pset(ex, ey, pose === ":atk" ? MOTH_EYE[4] : MOTH_EYE[3]);
      if (pose === ":atk") {
        lp.pset(fx(13 + wSpan), wingTop + 3, MOTH_EYE[3]);
      }
    }

    // Plump fuzzy thorax & abdomen
    lp.ellipse(cx, ty + 1, 3.2, 6.2, MOTH_THORAX, { bias: dir === "back" ? -0.1 : 0.06 });
    if (dir === "back") {
      // Dorsal thorax ridge
      lp.line(cx, ty - 4, cx, ty + 6, MOTH_THORAX[0]);
      lp.pset(cx, ty - 2, MOTH_THORAX[3]);
    } else {
      // Fluffy chest fur highlight & eyes
      lp.ellipse(cx, ty - 4, 2.6, 2.5, MOTH_THORAX, { bias: 0.12 });
      lp.pset(cx - 1.5, ty - 4, MOTH_EYE[4]);
      lp.pset(cx + 1.5, ty - 4, MOTH_EYE[4]);
    }

    // Feathered curved antennae
    const antBack = pose === ":atk" ? -1 : 0;
    for (const s of [-1, 1]) {
      const ax0 = cx + s * 1.5;
      const ay0 = ty - 6;
      const ax1 = cx + s * (5 + (pose === ":atk" ? 2 : 0));
      const ay1 = ty - 11 + antBack;
      lp.line(ax0, ay0, ax1, ay1, MOTH_EYE[2]);
      lp.pset(ax1, ay1, MOTH_EYE[4]);
      lp.pset(ax1 - s, ay1 + 1, MOTH_THORAX[3]);
    }

    // Downstroke spore mote
    if (pose === ":2") {
      lp.pset(cx - 10, ty + 8, MOTH_EYE[3]);
      lp.pset(cx + 10, ty + 8, MOTH_EYE[3]);
    }
  } else {
    // Side profile (right faces +X, left faces -X) — re-lit top-left!
    const isLeft = dir === "left";
    const px = (x) => (isLeft ? IW - 1 - x : x);
    const bx = 17; // thorax X in right-facing space
    const ty = 15 + bob;

    // Far wing hint behind
    lp.poly(
      [
        [px(bx - 1), ty - 2],
        [px(bx - 10), ty - 10 + wLift],
        [px(bx - 13), ty - 6 + wLift],
        [px(bx - 6), ty + 2],
      ],
      MOTH_WING,
      { bias: -0.22 }
    );

    // Swallowtail hindwing trailing back-down
    lp.poly(
      [
        [px(bx - 2), ty + 1],
        [px(bx - 11), ty + 3 + Math.max(0, wLift)],
        [px(bx - 13), ty + 10 + bob],
        [px(bx - 7), ty + 7 + bob],
        [px(bx - 1), ty + 4],
      ],
      MOTH_WING,
      { bias: -0.05 }
    );
    lp.pset(px(bx - 12), ty + 9 + bob, MOTH_EYE[2]);

    // Main swept forewing (sweeps forward on :atk!)
    const fwdShift = pose === ":atk" ? 3 : 0;
    lp.poly(
      [
        [px(bx), ty - 2],
        [px(bx - 7 + fwdShift), ty - 11 + wLift],
        [px(bx - 14 + fwdShift), ty - 9 + wLift],
        [px(bx - 15 + fwdShift), ty - 3 + wLift],
        [px(bx - 8), ty + 2 + wLift],
      ],
      MOTH_WING,
      { cx: px(bx - 8), cy: ty - 6 + wLift, rx: 7, ry: 6, bias: 0.06 }
    );
    lp.line(px(bx - 2), ty - 2, px(bx - 11 + fwdShift), ty - 7 + wLift, MOTH_WING[0]);
    const ex = px(bx - 9 + fwdShift);
    const ey = ty - 6 + wLift;
    lp.ellipse(ex, ey, 2.0, 2.0, MOTH_EYE, { bias: pose === ":atk" ? 0.3 : 0.1 });
    lp.pset(ex, ey, pose === ":atk" ? MOTH_EYE[4] : MOTH_EYE[3]);

    // Fuzzy angled thorax + abdomen
    lp.capsule(px(bx - 5), ty + 4, px(bx + 4), ty - 2, 2.5, 3.3, MOTH_THORAX);
    lp.ellipse(px(bx + 5), ty - 3, 2.6, 2.5, MOTH_THORAX, { bias: 0.1 });
    // Glowing compound eye
    lp.pset(px(bx + 6), ty - 3, MOTH_EYE[4]);
    lp.pset(px(bx + 5), ty - 4, MOTH_EYE[3]);
    // Sweeping feathered antennae
    const antTilt = pose === ":atk" ? -3 : 0;
    lp.line(px(bx + 6), ty - 5, px(bx + 11 + antTilt), ty - 10, MOTH_EYE[2]);
    lp.pset(px(bx + 11 + antTilt), ty - 10, MOTH_EYE[4]);
    lp.pset(px(bx + 9 + antTilt), ty - 9, MOTH_THORAX[3]);

    if (pose === ":2") {
      lp.pset(px(bx - 11), ty + 4, MOTH_EYE[3]);
    }
  }

  return wrapOutline(lp.buf, 34, 32);
}

// =========================================================================
// MOB 2: prism_arachnid (36 x 32, floating: false -> interior 34 x 30)
// =========================================================================
const SPIDER_CHITIN = [hexRgb("#142642"), hexRgb("#1d3e66"), hexRgb("#245b8f"), hexRgb("#3896c7"), hexRgb("#5ef2ff")];
const SPIDER_PRISM = [hexRgb("#2a5082"), hexRgb("#4888b8"), hexRgb("#7cf8ff"), hexRgb("#c8feff"), hexRgb("#ffffff")];
const SPIDER_VOLT = [hexRgb("#b86812"), hexRgb("#e39b22"), hexRgb("#ffd23c"), hexRgb("#ffea88"), hexRgb("#fff6c4")];

function drawPrismArachnid(dir, pose) {
  const IW = 34, IH = 30;
  const lp = new LayerPainter(IW, IH);
  const footY = 29;
  const bodyDy = pose === ":2" ? 1 : pose === ":atk" ? -1 : 0;
  const prismDy = pose === ":1" ? -1 : pose === ":2" ? 1 : pose === ":atk" ? -2 : 0;

  if (dir === "front" || dir === "back") {
    const cx = 16.5;
    const by = 18 + bodyDy;

    // 4 splayed angular crystal-tipped legs
    const flLift = pose === ":1" ? -2 : pose === ":atk" ? -4 : 0;
    const frLift = pose === ":2" ? -2 : pose === ":atk" ? -4 : 0;
    const blLift = pose === ":2" ? -2 : 0;
    const brLift = pose === ":1" ? -2 : 0;

    // Back pair of legs (drawn behind)
    for (const [s, lift] of [[-1, blLift], [1, brLift]]) {
      const kx = cx + s * 10;
      const ky = by - 5 + lift;
      const fx = cx + s * 13;
      const fy = footY - 3 + lift;
      lp.capsule(cx + s * 4, by - 1, kx, ky, 1.3, 1.1, SPIDER_CHITIN, { bias: -0.15 });
      lp.capsule(kx, ky, fx, fy, 1.1, 0.9, SPIDER_CHITIN, { bias: -0.05 });
      lp.pset(fx, fy, SPIDER_CHITIN[4]);
    }

    // Floating octahedral volt-prism abdomen (higher/larger in back view)
    const pCy = (dir === "back" ? 12 : 10) + prismDy;
    const pRx = dir === "back" ? 7.5 : 6.2;
    const pRy = dir === "back" ? 7.5 : 6.0;
    lp.poly(
      [
        [cx, pCy - pRy],
        [cx + pRx, pCy],
        [cx, pCy + pRy],
        [cx - pRx, pCy],
      ],
      SPIDER_PRISM,
      { cx: cx - 1, cy: pCy - 1, rx: pRx, ry: pRy, bias: pose === ":atk" ? 0.25 : 0.08 }
    );
    // Facet inner rib & volt core
    lp.line(cx, pCy - pRy + 1, cx, pCy + pRy - 1, SPIDER_PRISM[1]);
    lp.ellipse(cx, pCy, 2.0, 2.0, SPIDER_VOLT, { bias: pose === ":atk" ? 0.35 : 0.12 });
    if (pose === ":atk") {
      lp.pset(cx, pCy - pRy - 1, SPIDER_VOLT[4]);
      lp.pset(cx - 2, pCy - pRy, SPIDER_VOLT[3]);
      lp.pset(cx + 2, pCy - pRy, SPIDER_VOLT[3]);
    }

    // Dorsal prongs cradling the prism
    for (const s of [-1, 1]) {
      lp.capsule(cx + s * 4, by - 2, cx + s * 7, by - 8, 1.4, 0.9, SPIDER_CHITIN);
    }

    // Compact metallic-blue cephalothorax
    lp.ellipse(cx, by, 6.2, 4.4, SPIDER_CHITIN, { bias: dir === "back" ? -0.12 : 0.06 });

    if (dir === "front") {
      // 3 glowing gold visor eyes + mandibles
      lp.pset(cx - 3, by - 1, SPIDER_VOLT[2]);
      lp.pset(cx, by - 2, SPIDER_VOLT[4]);
      lp.pset(cx + 3, by - 1, SPIDER_VOLT[2]);
      // Mandibles (exposed bright on :atk!)
      const mandCol = pose === ":atk" ? SPIDER_VOLT[3] : SPIDER_CHITIN[3];
      lp.line(cx - 2, by + 2, cx - 3, by + 4, mandCol);
      lp.line(cx + 2, by + 2, cx + 3, by + 4, mandCol);
    }

    // Front pair of angular crystal-tipped legs planted on ground (or reared on :atk!)
    for (const [s, lift] of [[-1, flLift], [1, frLift]]) {
      const kx = cx + s * 9;
      const ky = by - 2 + lift;
      const fx = cx + s * (pose === ":atk" ? 11 : 14);
      const fy = footY + lift;
      lp.capsule(cx + s * 5, by + 1, kx, ky, 1.4, 1.1, SPIDER_CHITIN);
      lp.capsule(kx, ky, fx, fy, 1.2, 0.9, SPIDER_CHITIN, { bias: 0.1 });
      // Sharp cyan crystal leg tips
      lp.pset(fx, fy, SPIDER_CHITIN[4]);
      lp.pset(fx - s, fy - 1, SPIDER_CHITIN[4]);
    }
  } else {
    // Side profile (right faces +X, left faces -X)
    const isLeft = dir === "left";
    const px = (x) => (isLeft ? IW - 1 - x : x);
    const bx = 18;
    const by = 19 + bodyDy;

    // Far legs (staggered)
    const farFL = pose === ":1" ? -2 : pose === ":atk" ? -3 : 0;
    const farBL = pose === ":2" ? -2 : 0;
    lp.capsule(px(bx + 3), by, px(bx + 11), by - 3 + farFL, 1.1, 0.9, SPIDER_CHITIN, { bias: -0.22 });
    lp.capsule(px(bx + 11), by - 3 + farFL, px(bx + 13), footY - 1 + farFL, 0.9, 0.8, SPIDER_CHITIN, { bias: -0.2 });
    lp.capsule(px(bx - 3), by, px(bx - 10), by - 4 + farBL, 1.1, 0.9, SPIDER_CHITIN, { bias: -0.22 });
    lp.capsule(px(bx - 10), by - 4 + farBL, px(bx - 13), footY - 1 + farBL, 0.9, 0.8, SPIDER_CHITIN, { bias: -0.2 });

    // Levitating octahedral volt-prism behind dorsal prongs
    const pCx = px(bx - 8);
    const pCy = 10 + prismDy;
    lp.poly(
      [
        [pCx, pCy - 6.5],
        [pCx + 6.0, pCy],
        [pCx, pCy + 6.5],
        [pCx - 6.0, pCy],
      ],
      SPIDER_PRISM,
      { cx: pCx - 1, cy: pCy - 1, rx: 6, ry: 6.5, bias: pose === ":atk" ? 0.25 : 0.08 }
    );
    lp.ellipse(pCx, pCy, 1.8, 1.8, SPIDER_VOLT, { bias: pose === ":atk" ? 0.35 : 0.1 });
    if (pose === ":atk") lp.pset(pCx, pCy - 7, SPIDER_VOLT[4]);

    // Dorsal prong
    lp.capsule(px(bx - 2), by - 2, px(bx - 5), by - 8, 1.4, 0.9, SPIDER_CHITIN);

    // Cephalothorax
    lp.ellipse(px(bx + 1), by, 6.0, 4.3, SPIDER_CHITIN, { bias: 0.06 });
    // Visor eyes & forward mandible
    lp.pset(px(bx + 5), by - 1, SPIDER_VOLT[4]);
    lp.pset(px(bx + 4), by - 2, SPIDER_VOLT[2]);
    lp.line(px(bx + 6), by + 1, px(bx + 9), by + 3, pose === ":atk" ? SPIDER_VOLT[3] : SPIDER_CHITIN[3]);

    // Near legs
    const nearFL = pose === ":2" ? -2 : pose === ":atk" ? -4 : 0;
    const nearBL = pose === ":1" ? -2 : 0;
    lp.capsule(px(bx + 3), by + 1, px(bx + 10), by - 1 + nearFL, 1.3, 1.0, SPIDER_CHITIN);
    lp.capsule(px(bx + 10), by - 1 + nearFL, px(bx + 12), footY + nearFL, 1.1, 0.9, SPIDER_CHITIN, { bias: 0.1 });
    lp.pset(px(bx + 12), footY + nearFL, SPIDER_CHITIN[4]);

    lp.capsule(px(bx - 3), by + 1, px(bx - 9), by - 2 + nearBL, 1.3, 1.0, SPIDER_CHITIN);
    lp.capsule(px(bx - 9), by - 2 + nearBL, px(bx - 11), footY + nearBL, 1.1, 0.9, SPIDER_CHITIN, { bias: 0.1 });
    lp.pset(px(bx - 11), footY + nearBL, SPIDER_CHITIN[4]);
  }

  return wrapOutline(lp.buf, 36, 32);
}

// =========================================================================
// MOB 3: amber_crucible (36 x 38, floating: true -> interior 34 x 36)
// =========================================================================
const POT_BRONZE = [hexRgb("#291624"), hexRgb("#42222d"), hexRgb("#593138"), hexRgb("#7a4643"), hexRgb("#9c604e")];
const POT_MOLTEN = [hexRgb("#b83214"), hexRgb("#e35c1e"), hexRgb("#ff8c2a"), hexRgb("#ffe27a"), hexRgb("#fff8d6")];
const POT_GEM = [hexRgb("#4a2c08"), hexRgb("#9e6214"), hexRgb("#f0b424"), hexRgb("#ffe27a")];

function drawAmberCrucible(dir, pose) {
  const IW = 34, IH = 36;
  const lp = new LayerPainter(IW, IH);
  const cx = 16.5;
  const bob = pose === ":1" ? -1 : pose === ":2" ? 1 : 0;
  const lidLift = pose === ":atk" ? -3 : 0;
  const handleFlare = pose === ":atk" ? 2 : 0;
  const by = 17 + bob;

  // Orbiting amber slag crystals beneath base
  const gemOffsets =
    pose === ":1"
      ? [[-9, -2], [0, 0], [9, 1]]
      : pose === ":2"
        ? [[-9, 1], [0, 0], [9, -2]]
        : pose === ":atk"
          ? [[-11, -7], [0, -2], [11, -7]]
          : [[-9, 0], [0, 1], [9, 0]];
  for (const [gxOff, gyOff] of gemOffsets) {
    const gx = cx + gxOff;
    const gy = by + 13 + gyOff;
    lp.poly(
      [
        [gx, gy - 3],
        [gx + 2.2, gy],
        [gx, gy + 3],
        [gx - 2.2, gy],
      ],
      POT_GEM,
      { cx: gx - 0.5, cy: gy - 0.5, rx: 2.2, ry: 3, bias: 0.15 }
    );
    lp.pset(gx, gy - 1, POT_MOLTEN[3]);
  }
  if (pose === ":2") {
    lp.pset(cx, by + 16, POT_MOLTEN[2]); // falling molten slag drop
  }

  if (dir === "front" || dir === "back") {
    // Curved cauldron handles + hanging slag chains
    for (const s of [-1, 1]) {
      const hx = cx + s * (11 + handleFlare);
      lp.ring(hx, by - 3, 3.2, 4.2, 2.0, POT_BRONZE);
      lp.line(hx + s, by + 1, hx + s, by + 6, POT_GEM[1]);
      lp.pset(hx + s, by + 6, POT_GEM[2]);
    }

    // Inverted bell-pot cauldron body
    lp.poly(
      [
        [cx - 10, by - 7],
        [cx + 10, by - 7],
        [cx + 11, by + 2],
        [cx + 6, by + 9],
        [cx - 6, by + 9],
        [cx - 11, by + 2],
      ],
      POT_BRONZE,
      { cx: cx - 2, cy: by - 2, rx: 11, ry: 9 }
    );

    if (dir === "front") {
      // Jagged glowing furnace grille maw
      const grilleBias = pose === ":1" || pose === ":atk" ? 0.3 : 0.08;
      lp.poly(
        [
          [cx - 6, by - 2],
          [cx + 6, by - 2],
          [cx + 4, by + 5],
          [cx - 4, by + 5],
        ],
        POT_MOLTEN,
        { bias: grilleBias }
      );
      // Obsidian grille bars across the furnace mouth
      for (const gx of [-3, 0, 3]) {
        lp.line(cx + gx, by - 2, cx + gx, by + 5, POT_BRONZE[0]);
      }
      lp.pset(cx, by + 1, pose === ":atk" ? POT_MOLTEN[4] : POT_MOLTEN[3]);
    } else {
      // Riveted backplate with narrow molten vent seam
      lp.line(cx, by - 5, cx, by + 7, POT_MOLTEN[2]);
      lp.pset(cx, by + 1, POT_MOLTEN[3]);
      for (const rx of [-6, 6]) {
        lp.pset(cx + rx, by - 4, POT_BRONZE[4]);
        lp.pset(cx + rx, by + 3, POT_BRONZE[4]);
      }
    }

    // Magma overflow inside rim when lid lifts on :atk
    if (pose === ":atk") {
      lp.ellipse(cx, by - 8, 9, 2.5, POT_MOLTEN, { bias: 0.45 });
      lp.line(cx - 5, by - 8, cx + 5, by - 8, POT_MOLTEN[4]);
    }

    // Flared cauldron lid rim
    lp.poly(
      [
        [cx - 12, by - 9 + lidLift],
        [cx + 12, by - 9 + lidLift],
        [cx + 10, by - 6 + lidLift],
        [cx - 10, by - 6 + lidLift],
      ],
      POT_BRONZE,
      { bias: 0.14 }
    );
    lp.line(cx - 9, by - 9 + lidLift, cx + 9, by - 9 + lidLift, POT_BRONZE[4]);
  } else {
    // Side profile (right faces +X, left faces -X)
    const isLeft = dir === "left";
    const px = (x) => (isLeft ? IW - 1 - x : x);
    const bx = 17;

    // Cauldron body
    lp.poly(
      [
        [px(bx - 9), by - 7],
        [px(bx + 9), by - 7],
        [px(bx + 10), by + 2],
        [px(bx + 5), by + 9],
        [px(bx - 5), by + 9],
        [px(bx - 10), by + 2],
      ],
      POT_BRONZE,
      { cx: px(bx - 2), cy: by - 2, rx: 10, ry: 9 }
    );

    // Side glowing furnace grille slit on front face
    lp.poly(
      [
        [px(bx + 3), by - 2],
        [px(bx + 8), by - 1],
        [px(bx + 7), by + 5],
        [px(bx + 3), by + 4],
      ],
      POT_MOLTEN,
      { bias: pose === ":1" || pose === ":atk" ? 0.3 : 0.08 }
    );
    lp.line(px(bx + 5), by - 2, px(bx + 5), by + 4, POT_BRONZE[0]);

    // Side cauldron handle + chain loop
    const hx = px(bx - 1 - handleFlare);
    lp.ring(hx, by - 2, 3.0, 4.0, 2.0, POT_BRONZE, { bias: 0.1 });
    lp.line(hx, by + 2, hx, by + 6, POT_GEM[2]);

    if (pose === ":atk") {
      lp.ellipse(px(bx), by - 8, 8, 2.2, POT_MOLTEN, { bias: 0.45 });
    }

    // Lid + front pouring spout lip
    lp.poly(
      [
        [px(bx - 11), by - 9 + lidLift],
        [px(bx + 12), by - 9 + lidLift],
        [px(bx + 9), by - 6 + lidLift],
        [px(bx - 9), by - 6 + lidLift],
      ],
      POT_BRONZE,
      { bias: 0.14 }
    );
  }

  return wrapOutline(lp.buf, 36, 38);
}

// =========================================================================
// MOB 4: chrono_arbiter (48 x 46, floating: true -> interior 46 x 44)
// =========================================================================
const ARB_MASK = [hexRgb("#565b78"), hexRgb("#7982a3"), hexRgb("#9aa3c2"), hexRgb("#c8d0eb"), hexRgb("#eef2ff")];
const ARB_CLOAK = [hexRgb("#1c1033"), hexRgb("#321660"), hexRgb("#481c88"), hexRgb("#6f2ebd"), hexRgb("#9a48ec")];
const ARB_CORE = [hexRgb("#b0228f"), hexRgb("#d62db4"), hexRgb("#f53cd1"), hexRgb("#ff96ea"), hexRgb("#ffd2f6"), WHITE];

function drawChronoArbiter(dir, pose) {
  const IW = 46, IH = 44;
  const lp = new LayerPainter(IW, IH);
  const cx = 22.5;
  const bob = pose === ":1" ? -2 : pose === ":2" ? 1 : 0;
  const tailDx = pose === ":1" ? -1 : pose === ":2" ? 1 : 0;
  const hy = 11 + bob; // head / halo center

  if (dir === "front" || dir === "back") {
    // 1. Ringed crescent-moon void halo with 12 o'clock / 3 / 9 ticks behind head
    lp.ring(cx, hy, 12.5, 11.5, 2.2, ARB_MASK, { bias: 0.05 });
    const tickRot = pose === ":1" ? 0.18 : pose === ":2" ? -0.18 : 0;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + tickRot;
      const tx = cx + Math.cos(a) * 12.5;
      const ty = hy + Math.sin(a) * 11.5;
      lp.pset(tx, ty, k % 2 === 0 ? ARB_CORE[4] : ARB_MASK[4]);
    }

    // 2. Tapered legless rune-ribbon tail
    lp.poly(
      [
        [cx - 6, 25 + bob],
        [cx + 6, 25 + bob],
        [cx + 3 + tailDx, 35 + bob],
        [cx + tailDx, 41 + bob],
        [cx - 3 + tailDx, 35 + bob],
      ],
      ARB_CLOAK,
      { bias: -0.08 }
    );
    lp.line(cx, 26 + bob, cx + tailDx, 39 + bob, ARB_CORE[2]);

    // 3. Astral cloak torso & floating shoulder pauldrons
    lp.poly(
      [
        [cx - 8, 17 + bob],
        [cx + 8, 17 + bob],
        [cx + 6, 27 + bob],
        [cx - 6, 27 + bob],
      ],
      ARB_CLOAK,
      { bias: 0.06 }
    );
    for (const s of [-1, 1]) {
      const sx = cx + s * (10 + (pose === ":atk" ? 1 : 0));
      const sy = 17 + bob;
      lp.poly(
        [
          [sx - s * 3, sy - 2],
          [sx + s * 3, sy],
          [sx + s * 2, sy + 4],
          [sx - s * 2, sy + 3],
        ],
        ARB_CLOAK,
        { bias: 0.16 }
      );
      lp.pset(sx, sy, ARB_MASK[3]);
    }

    // 4. Hourglass core (front) or dorsal astral rune spine (back)
    if (dir === "front") {
      const coreFlare = pose === ":atk" ? 1.5 : 0;
      lp.poly(
        [
          [cx - 3.5 - coreFlare, 18 + bob],
          [cx + 3.5 + coreFlare, 18 + bob],
          [cx, 21.5 + bob],
          [cx + 3.5 + coreFlare, 25 + bob],
          [cx - 3.5 - coreFlare, 25 + bob],
          [cx, 21.5 + bob],
        ],
        ARB_CORE,
        { bias: pose === ":atk" ? 0.38 : 0.12 }
      );
      lp.pset(cx, 21 + bob, WHITE);
      if (pose === ":atk") {
        lp.line(cx - 5, 21 + bob, cx + 5, 21 + bob, ARB_CORE[4]);
        lp.line(cx, 16 + bob, cx, 26 + bob, WHITE);
      }
    } else {
      lp.line(cx, 16 + bob, cx, 27 + bob, ARB_CORE[2]);
      lp.pset(cx, 20 + bob, ARB_CORE[4]);
    }

    // 5. Blank porcelain 3-faced mask head
    lp.poly(
      [
        [cx - 4.5, hy - 5],
        [cx + 4.5, hy - 5],
        [cx + 5.5, hy + 1],
        [cx, hy + 6],
        [cx - 5.5, hy + 1],
      ],
      ARB_MASK,
      { bias: dir === "back" ? -0.1 : pose === ":atk" ? 0.35 : 0.14 }
    );
    if (dir === "front") {
      // Twin dark eye slits + split seam on :atk
      lp.pset(cx - 2, hy, ARB_CLOAK[0]);
      lp.pset(cx + 2, hy, ARB_CLOAK[0]);
      if (pose === ":atk") {
        lp.line(cx, hy - 4, cx, hy + 4, WHITE);
      } else {
        lp.line(cx, hy - 4, cx, hy + 3, ARB_MASK[1]);
      }
    } else {
      lp.pset(cx, hy - 1, ARB_CORE[3]);
    }

    // 6. Twin detached floating crescent clock-blades flanking left and right
    const lDy = pose === ":1" ? -2 : pose === ":2" ? 2 : pose === ":atk" ? -3 : 0;
    const rDy = pose === ":1" ? 2 : pose === ":2" ? -2 : pose === ":atk" ? -3 : 0;
    const bSpread = pose === ":atk" ? 2 : 0;
    for (const [s, dy] of [[-1, lDy], [1, rDy]]) {
      const bx = cx + s * (17 + bSpread);
      const by = 22 + bob + dy;
      const a0 = s < 0 ? 1.15 : -1.98;
      const a1 = s < 0 ? 5.13 : 1.98;
      lp.ring(bx, by, 4.5, 9.5, 2.6, ARB_CORE, { a0, a1, bias: pose === ":atk" ? 0.25 : 0.05 });
      // Razor white crescent tip
      lp.pset(bx + s * 1, by - 9, WHITE);
      lp.pset(bx + s * 1, by + 9, WHITE);
    }
  } else {
    // Side profile (right faces +X, left faces -X)
    const isLeft = dir === "left";
    const px = (x) => (isLeft ? IW - 1 - x : x);
    const bx = 22;

    // Background crescent blade
    const bgDy = pose === ":1" ? 2 : pose === ":2" ? -2 : pose === ":atk" ? -2 : 0;
    lp.ring(px(bx - 10), 21 + bob + bgDy, 4.0, 9.0, 2.4, ARB_CORE, { a0: -Math.PI, a1: Math.PI, bias: -0.2 });

    // Angled astral halo ring behind head
    lp.ring(px(bx - 3), hy, 10.5, 11.5, 2.2, ARB_MASK, { bias: 0.05 });

    // Sweeping legless rune-ribbon tail
    lp.poly(
      [
        [px(bx - 5), 25 + bob],
        [px(bx + 5), 25 + bob],
        [px(bx - 2 + tailDx), 36 + bob],
        [px(bx - 7 + tailDx), 41 + bob],
        [px(bx - 6 + tailDx), 33 + bob],
      ],
      ARB_CLOAK,
      { bias: -0.06 }
    );
    lp.line(px(bx - 1), 27 + bob, px(bx - 6 + tailDx), 39 + bob, ARB_CORE[2]);

    // Torso & chest hourglass peek
    lp.poly(
      [
        [px(bx - 6), 17 + bob],
        [px(bx + 6), 17 + bob],
        [px(bx + 5), 27 + bob],
        [px(bx - 5), 27 + bob],
      ],
      ARB_CLOAK,
      { bias: 0.08 }
    );
    lp.line(px(bx + 4), 19 + bob, px(bx + 4), 24 + bob, pose === ":atk" ? WHITE : ARB_CORE[3]);

    // Shoulder pauldron
    lp.ellipse(px(bx - 1), 18 + bob, 4.5, 2.8, ARB_CLOAK, { bias: 0.16 });

    // Porcelain side mask
    lp.poly(
      [
        [px(bx - 4), hy - 5],
        [px(bx + 5), hy - 4],
        [px(bx + 6), hy + 1],
        [px(bx + 1), hy + 6],
        [px(bx - 4), hy + 2],
      ],
      ARB_MASK,
      { bias: pose === ":atk" ? 0.3 : 0.14 }
    );
    lp.pset(px(bx + 4), hy, ARB_CLOAK[0]);

    // Foreground crescent clock-blade snapping forward on :atk!
    const fgDy = pose === ":1" ? -2 : pose === ":2" ? 2 : pose === ":atk" ? -3 : 0;
    const fgDx = pose === ":atk" ? 6 : 0;
    lp.ring(px(bx + 11 + fgDx), 22 + bob + fgDy, 4.5, 9.5, 2.6, ARB_CORE, {
      a0: isLeft ? 1.15 : -1.98,
      a1: isLeft ? 5.13 : 1.98,
      bias: pose === ":atk" ? 0.25 : 0.08,
    });
    lp.pset(px(bx + 11 + fgDx), 13 + bob + fgDy, WHITE);
    lp.pset(px(bx + 11 + fgDx), 31 + bob + fgDy, WHITE);
  }

  return wrapOutline(lp.buf, 48, 46);
}

// =========================================================================
// MAIN: Preserve 994x790 base 100%, expand to 994x946, append 64 frames
// =========================================================================

const existingJson = JSON.parse(fs.readFileSync(ATLAS_JSON, "utf8"));
const existingPng = P.load(ATLAS_PNG);

// Snapshot base (0..993, 0..789)
const BASE_W = 994;
const BASE_H = 790;
if (existingPng.w !== BASE_W || existingPng.h < BASE_H) {
  throw new Error(`Unexpected existing codixel-enemies.png dimensions: ${existingPng.w}x${existingPng.h}`);
}

const baseSnap = new Uint32Array(BASE_W * BASE_H);
for (let y = 0; y < BASE_H; y++) {
  for (let x = 0; x < BASE_W; x++) {
    baseSnap[y * BASE_W + x] = existingPng.px[y * existingPng.w + x];
  }
}

// Filter out only NEW_IDS so script is 100% idempotent
const baseFrames = {};
let maxBaseX = 0;
let maxBaseY = 0;
for (const [k, v] of Object.entries(existingJson.frames)) {
  const prefix = k.split(":")[0];
  if (NEW_IDS.has(prefix)) continue;
  baseFrames[k] = v;
  if (v.x + v.w > maxBaseX) maxBaseX = v.x + v.w;
  if (v.y + v.h > maxBaseY) maxBaseY = v.y + v.h;
}

const baseMonsters = {};
for (const [k, v] of Object.entries(existingJson.monsters)) {
  if (NEW_IDS.has(k)) continue;
  baseMonsters[k] = v;
}

if (Object.keys(baseMonsters).length !== 19 || Object.keys(baseFrames).length !== 306) {
  throw new Error(
    `Base preservation mismatch: monsters=${Object.keys(baseMonsters).length}, frames=${Object.keys(baseFrames).length}`
  );
}
if (maxBaseX !== 992 || maxBaseY !== 788) {
  throw new Error(`Unexpected base bounds: maxX=${maxBaseX}, maxY=${maxBaseY}`);
}

const OUT_H = 946;
const outBuf = new P.Buf(BASE_W, OUT_H);
// Blit base 994x790 verbatim
for (let y = 0; y < BASE_H; y++) {
  for (let x = 0; x < BASE_W; x++) {
    outBuf.px[y * BASE_W + x] = baseSnap[y * BASE_W + x];
  }
}

const DIRS = ["front", "right", "left", "back"];
const POSES = ["", ":1", ":2", ":atk"];

const MOBS = [
  { id: "zephyr_moth", w: 34, h: 32, floating: true, y: 790, draw: drawZephyrMoth },
  { id: "prism_arachnid", w: 36, h: 32, floating: false, y: 824, draw: drawPrismArachnid },
  { id: "amber_crucible", w: 36, h: 38, floating: true, y: 858, draw: drawAmberCrucible },
  { id: "chrono_arbiter", w: 48, h: 46, floating: true, y: 898, draw: drawChronoArbiter },
];

const newFrames = {};
const newMonsters = {};

for (const mob of MOBS) {
  newMonsters[mob.id] = { w: mob.w, h: mob.h, floating: mob.floating };
  let col = 0;
  for (const dir of DIRS) {
    for (const pose of POSES) {
      const key = `${mob.id}:${dir}${pose}`;
      const frameBuf = mob.draw(dir, pose);
      if (frameBuf.w !== mob.w || frameBuf.h !== mob.h) {
        throw new Error(`Frame ${key} size mismatch: ${frameBuf.w}x${frameBuf.h} vs ${mob.w}x${mob.h}`);
      }
      // Binary alpha & non-empty check
      let solidCount = 0;
      for (let i = 0; i < frameBuf.px.length; i++) {
        const a = frameBuf.px[i] >>> 24;
        if (a !== 0 && a !== 255) throw new Error(`Non-binary alpha ${a} in ${key}`);
        if (a === 255) solidCount++;
      }
      if (solidCount < 60) throw new Error(`Frame ${key} too empty: solid=${solidCount}`);

      const fx = 2 + col * (mob.w + 2);
      const fy = mob.y;
      for (let py = 0; py < mob.h; py++) {
        for (let px = 0; px < mob.w; px++) {
          const c = frameBuf.px[py * mob.w + px];
          if (c >>> 24) outBuf.pset(fx + px, fy + py, c);
        }
      }
      newFrames[key] = { x: fx, y: fy, w: mob.w, h: mob.h, anchorY: mob.h };
      col++;
    }
  }
}

// Verify 100% pixel equality in base region (0..993, 0..789)
for (let y = 0; y < BASE_H; y++) {
  for (let x = 0; x < BASE_W; x++) {
    if (outBuf.px[y * BASE_W + x] !== baseSnap[y * BASE_W + x]) {
      throw new Error(`Base pixel corruption detected at (${x}, ${y})`);
    }
  }
}

P.save(outBuf, ATLAS_PNG);

const outJson = {
  frames: { ...baseFrames, ...newFrames },
  monsters: { ...baseMonsters, ...newMonsters },
};
fs.writeFileSync(ATLAS_JSON, JSON.stringify(outJson, null, 2));

console.log(
  `[generate_batch1_mobs] Saved ${ATLAS_PNG} (${BASE_W}x${OUT_H}) and ${ATLAS_JSON} (${Object.keys(outJson.frames).length} frames, ${Object.keys(outJson.monsters).length} monsters). Base 994x790 100% preserved.`
);
