import type { PixelfxActor } from "../vfx/pixelfxTypes";

/**
 * Codixel + SpriteCook inspired procedural pixel-art engine for browser Canvas 2D.
 * Implements:
 * - Hue-shifted color ramps (cool shadows -> saturated midtones -> warm highlights)
 * - Banded shading with Bayer 4x4 dithering ONLY along narrow band seams
 * - Top-left consistent lighting, rimLight() and selective outlines (selout)
 * - Silhouette smoothing (removes 1px nubs / fills 1px pinholes)
 * - Seamless tileable noise, height-field rock/bark surfaces, foliage canopies, faceted crystals
 * - SpriteCook 15-piece Dual-Grid 4-bit autotile mask & 4x4 atlas generator
 */

// 4x4 Bayer threshold matrix (normalized 0..1)
const BAYER4 = new Float32Array(
  [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16)
);

export function bayer(x: number, y: number): number {
  return BAYER4[((y & 3) << 2) | (x & 3)];
}

export function clamp(v: number, lo = 0, hi = 1): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(a: number, b: number, x: number): number {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

// =========================================================================
// COLOR UTILITIES (RGBA little-endian Uint32 matching ImageData)
// =========================================================================

export function rgba(r: number, g: number, b: number, a = 255): number {
  return (((a & 255) << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255)) >>> 0;
}

export function hexToU32(hexStr: string, a = 255): number {
  let h = hexStr.startsWith("#") ? hexStr.slice(1) : hexStr;
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return rgba((n >> 16) & 255, (n >> 8) & 255, n & 255, a);
}

export function u32ToRgb(c: number): [number, number, number] {
  return [c & 255, (c >>> 8) & 255, (c >>> 16) & 255];
}

export function mixU32(c1: number, c2: number, t: number): number {
  const k = clamp(t);
  const r = Math.round((c1 & 255) + ((c2 & 255) - (c1 & 255)) * k);
  const g = Math.round(((c1 >>> 8) & 255) + (((c2 >>> 8) & 255) - ((c1 >>> 8) & 255)) * k);
  const b = Math.round(((c1 >>> 16) & 255) + (((c2 >>> 16) & 255) - ((c1 >>> 16) & 255)) * k);
  const a = Math.round(((c1 >>> 24) & 255) + (((c2 >>> 24) & 255) - ((c1 >>> 24) & 255)) * k);
  return rgba(r, g, b, a);
}

export function hslToU32(hDeg: number, s: number, l: number, a = 255): number {
  const h = (((hDeg % 360) + 360) % 360) / 360;
  const sat = clamp(s);
  const lig = clamp(l);
  if (sat === 0) {
    const v = Math.round(lig * 255);
    return rgba(v, v, v, a);
  }
  const q = lig < 0.5 ? lig * (1 + sat) : lig + sat - lig * sat;
  const p = 2 * lig - q;
  const hue2rgb = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return rgba(
    Math.round(hue2rgb(h + 1 / 3) * 255),
    Math.round(hue2rgb(h) * 255),
    Math.round(hue2rgb(h - 1 / 3) * 255),
    a
  );
}

export function u32ToHsl(c: number): [number, number, number] {
  const r = (c & 255) / 255;
  const g = ((c >>> 8) & 255) / 255;
  const b = ((c >>> 16) & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

/**
 * Codixel Hue-Shifted Ramp:
 * Darker steps shift toward cool violet/blue (~240deg), lighter steps shift toward warm yellow (~55deg),
 * and saturation peaks in the midtones for rich 16-bit pixel art vibrancy.
 */
export function hueRamp(
  n: number,
  opts: {
    hue: number;
    sat?: number;
    satDrop?: number;
    lightMin?: number;
    lightMax?: number;
    shift?: number;
  }
): Uint32Array {
  const sat = opts.sat ?? 0.65;
  const satDrop = opts.satDrop ?? 0.22;
  const l0 = opts.lightMin ?? 0.16;
  const l1 = opts.lightMax ?? 0.82;
  const shift = opts.shift ?? 38;
  const out = new Uint32Array(n);

  const shortestAngle = (from: number, to: number) => {
    let d = ((to - from + 540) % 360) - 180;
    return d;
  };
  const coolDir = Math.sign(shortestAngle(opts.hue, 240)) || 1;
  const warmDir = Math.sign(shortestAngle(opts.hue, 56)) || -1;

  for (let i = 0; i < n; i++) {
    const u = n <= 1 ? 0.5 : i / (n - 1);
    const l = lerp(l0, l1, u);
    const bell = 1 - Math.pow(2 * u - 1, 2); // 0 at ends, 1 at center
    const s = clamp(sat - satDrop * (1 - bell), 0.04, 0.96);
    const hShift = u < 0.5 ? coolDir * (0.5 - u) * 2 * shift : warmDir * (u - 0.5) * 2 * (shift * 0.8);
    out[i] = hslToU32(opts.hue + hShift, s, l);
  }
  return out;
}

/** Builds a hue-shifted ramp anchored on an existing biome hex color. */
export function hueRampFromHex(
  baseHex: string,
  n = 5,
  opts: { span?: number; shift?: number; satBoost?: number } = {}
): Uint32Array {
  const [h, s, l] = u32ToHsl(hexToU32(baseHex));
  const span = opts.span ?? 0.24;
  // Preserve muted/bleached aesthetics when saturation is already very low
  const isBleached = s < 0.16;
  return hueRamp(n, {
    hue: h,
    sat: clamp(s + (isBleached ? 0 : (opts.satBoost ?? 0.06)), 0.03, 0.92),
    satDrop: isBleached ? 0.03 : 0.16,
    lightMin: clamp(l - span * 1.15, 0.08, 0.72),
    lightMax: clamp(l + span * 1.05, 0.22, 0.92),
    shift: isBleached ? 10 : (opts.shift ?? 28),
  });
}

/**
 * Codixel Banded Dithering:
 * Solid flat bands with Bayer 4x4 dither ONLY inside a narrow seam `strip` where two bands meet.
 */
export function band(v: number, n: number, x: number, y: number, strip = 0.22): number {
  const scaled = clamp(v, 0, 0.9999) * (n - 1);
  let k = Math.floor(scaled);
  const f = scaled - k;
  if (strip > 0) {
    const lo = 0.5 - strip * 0.5;
    const hi = 0.5 + strip * 0.5;
    if (f > lo && f < hi) {
      const u = (f - lo) / strip;
      if (u > bayer(x, y)) k++;
    } else if (f >= hi) {
      k++;
    }
  } else if (f >= 0.5) {
    k++;
  }
  return Math.min(n - 1, Math.max(0, k));
}

// =========================================================================
// DETERMINISTIC NOISE & HEIGHT FIELDS
// =========================================================================

export function hash2i(x: number, y: number, seed = 1337): number {
  let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export function tileValueNoise(x: number, y: number, period: number, seed = 1): number {
  const p = Math.max(1, Math.round(period));
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const x0 = ((ix % p) + p) % p;
  const x1 = (x0 + 1) % p;
  const y0 = ((iy % p) + p) % p;
  const y1 = (y0 + 1) % p;
  const a = hash2i(x0, y0, seed);
  const b = hash2i(x1, y0, seed);
  const c = hash2i(x0, y1, seed);
  const d = hash2i(x1, y1, seed);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
}

/** Seamless repeating FBM noise for tiles (zero edge seams). */
export function tileFbm(x: number, y: number, period: number, octaves = 3, seed = 1): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let freq = 1;
  for (let o = 0; o < octaves; o++) {
    sum += tileValueNoise(x * freq, y * freq, period * freq, seed + o * 97) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

export function valueNoise(x: number, y: number, seed = 1): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2i(ix, iy, seed);
  const b = hash2i(ix + 1, iy, seed);
  const c = hash2i(ix, iy + 1, seed);
  const d = hash2i(ix + 1, iy + 1, seed);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
}

export function fbm(x: number, y: number, octaves = 3, seed = 1): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let freq = 1;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise(x * freq, y * freq, seed + o * 131) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/** Codixel-style fractured rock height function (faceted stone blocks with crevices). */
export function rockHeight(x: number, y: number, seed = 17, scale = 0.19): number {
  const nx = x * scale;
  const ny = y * scale;
  const cx = Math.floor(nx);
  const cy = Math.floor(ny);
  let d1 = 99;
  let d2 = 99;
  let cellH = 0.5;
  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      const gx = cx + ox;
      const gy = cy + oy;
      const px = gx + 0.15 + hash2i(gx, gy, seed) * 0.7;
      const py = gy + 0.15 + hash2i(gx, gy, seed + 53) * 0.7;
      const dist = Math.hypot(nx - px, ny - py);
      if (dist < d1) {
        d2 = d1;
        d1 = dist;
        cellH = 0.45 + hash2i(gx, gy, seed + 101) * 0.5;
      } else if (dist < d2) {
        d2 = dist;
      }
    }
  }
  const crack = smoothstep(0.03, 0.2, d2 - d1);
  const detail = fbm(nx * 1.4, ny * 1.4, 2, seed + 211) * 0.25;
  return clamp((cellH * 0.75 + detail) * (0.42 + 0.58 * crack));
}

// =========================================================================
// PIXEL BUFFER (Core drawing, shading, outline & canvas export)
// =========================================================================

export class PixelBuf {
  readonly w: number;
  readonly h: number;
  readonly px: Uint32Array;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.px = new Uint32Array(w * h);
  }

  clone(): PixelBuf {
    const out = new PixelBuf(this.w, this.h);
    out.px.set(this.px);
    return out;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  get(x: number, y: number): number {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= this.w || iy >= this.h) return 0;
    return this.px[iy * this.w + ix];
  }

  pset(x: number, y: number, col: number) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= this.w || iy >= this.h) return;
    const a = (col >>> 24) & 255;
    if (a === 0) return;
    if (a === 255) {
      this.px[iy * this.w + ix] = col;
      return;
    }
    const dst = this.px[iy * this.w + ix];
    const da = (dst >>> 24) & 255;
    if (da === 0) {
      this.px[iy * this.w + ix] = col;
      return;
    }
    const alpha = a / 255;
    const inv = 1 - alpha;
    const r = Math.round((col & 255) * alpha + (dst & 255) * inv);
    const g = Math.round(((col >>> 8) & 255) * alpha + ((dst >>> 8) & 255) * inv);
    const b = Math.round(((col >>> 16) & 255) * alpha + ((dst >>> 16) & 255) * inv);
    const oa = Math.min(255, Math.round(a + da * inv));
    this.px[iy * this.w + ix] = rgba(r, g, b, oa);
  }

  clearPx(x: number, y: number) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix >= 0 && iy >= 0 && ix < this.w && iy < this.h) {
      this.px[iy * this.w + ix] = 0;
    }
  }

  rect(x: number, y: number, w: number, h: number, col: number) {
    const x0 = Math.max(0, Math.round(x));
    const y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(this.w, Math.round(x + w));
    const y1 = Math.min(this.h, Math.round(y + h));
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        this.pset(px, py, col);
      }
    }
  }

  fillEllipse(cx: number, cy: number, rx: number, ry: number, col: number) {
    const x0 = Math.max(0, Math.floor(cx - rx - 1));
    const x1 = Math.min(this.w - 1, Math.ceil(cx + rx + 1));
    const y0 = Math.max(0, Math.floor(cy - ry - 1));
    const y1 = Math.min(this.h - 1, Math.ceil(cy + ry + 1));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.pset(x, y, col);
      }
    }
  }

  /** Directional top-left lit ellipsoid volume using Codixel banded dithering. */
  litEllipse(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    ramp: Uint32Array,
    opts: { strip?: number; lightX?: number; lightY?: number; bias?: number } = {}
  ) {
    const strip = opts.strip ?? 0.2;
    const lx = opts.lightX ?? -0.62;
    const ly = opts.lightY ?? -0.68;
    const lz = 0.4;
    const bias = opts.bias ?? 0.08;
    const x0 = Math.max(0, Math.floor(cx - rx - 1));
    const x1 = Math.min(this.w - 1, Math.ceil(cx + rx + 1));
    const y0 = Math.max(0, Math.floor(cy - ry - 1));
    const y1 = Math.min(this.h - 1, Math.ceil(cy + ry + 1));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        const r2 = nx * nx + ny * ny;
        if (r2 > 1) continue;
        const nz = Math.sqrt(Math.max(0, 1 - r2));
        const ndl = clamp(0.42 + bias + (nx * lx + ny * ly + nz * lz) * 0.58);
        this.pset(x, y, ramp[band(ndl, ramp.length, x, y, strip)]);
      }
    }
  }

  /** Pixel-perfect Bresenham line (with optional L-corner removal). */
  line(x0: number, y0: number, x1: number, y1: number, col: number) {
    let ix0 = Math.round(x0);
    let iy0 = Math.round(y0);
    const ix1 = Math.round(x1);
    const iy1 = Math.round(y1);
    const dx = Math.abs(ix1 - ix0);
    const dy = Math.abs(iy1 - iy0);
    const sx = ix0 < ix1 ? 1 : -1;
    const sy = iy0 < iy1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
      this.pset(ix0, iy0, col);
      if (ix0 === ix1 && iy0 === iy1) break;
      const e2 = err * 2;
      if (e2 > -dy) {
        err -= dy;
        ix0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        iy0 += sy;
      }
    }
  }

  /** Draws a tapered capsule shaded from top-left light (for limbs, trunks, capes, swords). */
  litCapsule(
    ax: number,
    ay: number,
    bx: number,
    by: number,
    ra: number,
    rb: number,
    ramp: Uint32Array,
    strip = 0.18
  ) {
    const minX = Math.max(0, Math.floor(Math.min(ax - ra, bx - rb) - 1));
    const maxX = Math.min(this.w - 1, Math.ceil(Math.max(ax + ra, bx + rb) + 1));
    const minY = Math.max(0, Math.floor(Math.min(ay - ra, by - rb) - 1));
    const maxY = Math.min(this.h - 1, Math.ceil(Math.max(ay + ra, by + rb) + 1));
    const abx = bx - ax;
    const aby = by - ay;
    const abLen2 = abx * abx + aby * aby || 1;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5 - ax;
        const py = y + 0.5 - ay;
        const h = clamp((px * abx + py * aby) / abLen2);
        const r = lerp(ra, rb, h);
        const dx = px - abx * h;
        const dy = py - aby * h;
        const d = Math.hypot(dx, dy);
        if (d > r) continue;
        const nx = dx / (r || 1);
        const ny = dy / (r || 1);
        const nz = Math.sqrt(Math.max(0, 1 - Math.min(1, (d / r) * (d / r))));
        const ndl = clamp(0.46 + (-0.6 * nx - 0.65 * ny + 0.45 * nz) * 0.54);
        this.pset(x, y, ramp[band(ndl, ramp.length, x, y, strip)]);
      }
    }
  }

  /** Blit another PixelBuf on top (alpha-respecting). */
  blit(src: PixelBuf, ox = 0, oy = 0) {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const c = src.px[y * src.w + x];
        if (c >>> 24) this.pset(ox + x, oy + y, c);
      }
    }
  }

  /** Codixel smoothEdge: removes isolated 1px nubs and fills 1px interior pinholes. */
  smoothEdge(): this {
    const src = this.px.slice();
    const { w, h } = this;
    const solid = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < w && y < h && (src[y * w + x] >>> 24) > 128;

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const n =
          (solid(x - 1, y) ? 1 : 0) +
          (solid(x + 1, y) ? 1 : 0) +
          (solid(x, y - 1) ? 1 : 0) +
          (solid(x, y + 1) ? 1 : 0);
        if (solid(x, y)) {
          // Remove lone pixel with 0 cardinal neighbors
          if (n === 0) this.px[i] = 0;
        } else if (n === 4) {
          // Fill 1px interior pinhole using average top-left neighbor
          this.px[i] = src[(y - 1) * w + x];
        }
      }
    }
    return this;
  }

  /**
   * Codixel Rim Light:
   * Brightens solid edge pixels facing top-left light (`[-1, -1]`) by mixing toward warm highlight
   * BEFORE applying selective outline.
   */
  applyRimLight(highlightCol: number, strength = 0.34, minLuma = 0.2): this {
    const src = this.px.slice();
    const { w, h } = this;
    const isSolid = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < w && y < h && (src[y * w + x] >>> 24) > 180;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!isSolid(x, y)) continue;
        // Exposed on top or left edge -> catches top-left rim light
        const exposedTop = !isSolid(x, y - 1);
        const exposedLeft = !isSolid(x - 1, y);
        if (!exposedTop && !exposedLeft) continue;
        // Skip bottom-right undersides
        if (!isSolid(x, y + 1) && !exposedTop) continue;

        const c = src[y * w + x];
        const [, , l] = u32ToHsl(c);
        if (l < minLuma || l > 0.9) continue;
        const boost = exposedTop && exposedLeft ? strength * 1.15 : strength * 0.8;
        this.px[y * w + x] = mixU32(c, highlightCol, boost);
      }
    }
    return this;
  }

  /**
   * Codixel Selective Outline (selout):
   * Draws a 1px outline around solid pixels using colors derived from adjacent pixels
   * (lit side tinted mid-dark, shadow side deep hue-shifted shade — NEVER flat dead black).
   */
  applySelout(litOutline: number, shadeOutline: number, mixNeighbor = 0.38): this {
    const src = this.px.slice();
    const { w, h } = this;
    const isSolid = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < w && y < h && (src[y * w + x] >>> 24) > 180;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (isSolid(x, y)) continue;
        const hasDown = isSolid(x, y + 1);
        const hasRight = isSolid(x + 1, y);
        const hasUp = isSolid(x, y - 1);
        const hasLeft = isSolid(x - 1, y);
        if (!hasDown && !hasRight && !hasUp && !hasLeft) continue;

        // Top-left side of sprite gets slightly brighter colored outline (selout);
        // bottom-right side gets deeper cool shade outline.
        const isLitSide = (hasDown || hasRight) && !(hasUp && hasLeft);
        const base = isLitSide ? litOutline : shadeOutline;

        const sample =
          (hasDown ? src[(y + 1) * w + x] : 0) ||
          (hasRight ? src[y * w + (x + 1)] : 0) ||
          (hasUp ? src[(y - 1) * w + x] : 0) ||
          (hasLeft ? src[y * w + (x - 1)] : 0);

        this.px[y * w + x] = sample ? mixU32(base, sample, isLitSide ? mixNeighbor : mixNeighbor * 0.38) : base;
      }
    }
    return this;
  }

  flipH(): PixelBuf {
    const out = new PixelBuf(this.w, this.h);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        out.px[y * this.w + (this.w - 1 - x)] = this.px[y * this.w + x];
      }
    }
    return out;
  }

  toCanvas(): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = this.w;
    c.height = this.h;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const img = ctx.createImageData(this.w, this.h);
    new Uint32Array(img.data.buffer).set(this.px);
    ctx.putImageData(img, 0, 0);
    return c;
  }

  toWhiteCanvas(): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = this.w;
    c.height = this.h;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const img = ctx.createImageData(this.w, this.h);
    const dst = new Uint32Array(img.data.buffer);
    const white = 0xffffffff;
    for (let i = 0; i < this.px.length; i++) {
      if ((this.px[i] >>> 24) > 128) dst[i] = white;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  toActor(): PixelfxActor {
    const maskData = new Uint8Array(this.w * this.h);
    const pixels = new Uint32Array(this.w * this.h);
    for (let i = 0; i < this.px.length; i++) {
      if ((this.px[i] >>> 24) > 128) {
        maskData[i] = 1;
        pixels[i] = this.px[i];
      }
    }
    return {
      mask: { w: this.w, h: this.h, data: maskData },
      pixels,
      x: -Math.floor(this.w / 2),
      y: -this.h,
      w: this.w,
      h: this.h,
      head: [0, -this.h],
      chest: [0, -Math.floor(this.h * 0.58)],
    };
  }
}

// =========================================================================
// CODIXEL-INSPIRED PROCEDURAL PROP GENERATORS
// =========================================================================

/**
 * Draws a faceted crystal spire (Codixel Gem-style alternating bright/dark facets + crisp specular edge).
 */
export function drawCrystalSpire(
  buf: PixelBuf,
  baseX: number,
  baseY: number,
  tipX: number,
  tipY: number,
  halfWidth: number,
  ramp: Uint32Array,
  specular: number
) {
  const vx = tipX - baseX;
  const vy = tipY - baseY;
  const len = Math.hypot(vx, vy) || 1;
  const ux = vx / len;
  const uy = vy / len;
  const px = -uy;
  const py = ux;

  const minX = Math.max(1, Math.floor(Math.min(baseX, tipX) - halfWidth - 2));
  const maxX = Math.min(buf.w - 2, Math.ceil(Math.max(baseX, tipX) + halfWidth + 2));
  const minY = Math.max(1, Math.floor(Math.min(baseY, tipY) - halfWidth - 2));
  const maxY = Math.min(buf.h - 2, Math.ceil(Math.max(baseY, tipY) + halfWidth + 2));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x + 0.5 - baseX;
      const dy = y + 0.5 - baseY;
      const along = (dx * ux + dy * uy) / len;
      if (along < 0 || along > 1) continue;
      // Taper sharply toward tip, slight bevel near base
      const profile = along < 0.72 ? 1 - along * 0.25 : (1 - along) / 0.28 * 0.82;
      const hw = halfWidth * profile;
      const side = dx * px + dy * py;
      if (Math.abs(side) > hw) continue;

      // Left facet faces top-left light -> bright; right facet -> deep rich color
      const normSide = side / (hw || 1);
      let idx: number;
      if (along > 0.76) {
        idx = normSide < 0.15 ? ramp.length - 1 : ramp.length - 2;
      } else if (normSide < -0.25) {
        idx = Math.min(ramp.length - 1, Math.floor(lerp(ramp.length - 2, ramp.length - 1, along)));
      } else if (normSide < 0.25) {
        idx = Math.min(ramp.length - 1, Math.max(1, Math.floor(lerp(1, ramp.length - 1, along * 0.85 + 0.1))));
      } else {
        idx = Math.max(0, Math.floor(lerp(0, Math.max(1, ramp.length - 3), along)));
      }
      buf.pset(x, y, ramp[idx]);
      // Crisp 1px white specular ridge along lit crystal edge
      if (along > 0.25 && along < 0.85 && Math.abs(normSide + 0.35) < 0.24 && (y & 1) === 0) {
        buf.pset(x, y, specular);
      }
    }
  }
}

/**
 * Draws an organic Codixel-style leaf cluster with deep interior underside shadow,
 * clustered leaf lumps, and top-left warm highlights.
 */
export function drawFoliageCluster(
  buf: PixelBuf,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  ramp: Uint32Array,
  seed: number,
  accentHex?: number
) {
  const x0 = Math.max(1, Math.floor(cx - rx - 2));
  const x1 = Math.min(buf.w - 2, Math.ceil(cx + rx + 2));
  const y0 = Math.max(1, Math.floor(cy - ry - 2));
  const y1 = Math.min(buf.h - 2, Math.ceil(cy + ry + 2));

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      const dist = Math.hypot(nx, ny);
      const lump = fbm(x * 0.38, y * 0.38, 2, seed) - 0.5;
      // Organic ruffled edge (not a rigid ellipse!)
      if (dist + lump * 0.32 > 1.02) continue;
      // Occasional tiny sky/edge notch at outer fringe
      if (dist > 0.86 && hash2i(x, y, seed + 19) < 0.16) continue;

      const light = clamp(
        0.52 - nx * 0.32 - ny * 0.44 + lump * 0.35 - Math.max(0, dist - 0.65) * 0.35
      );
      const idx = band(light, ramp.length, x, y, 0.2);
      buf.pset(x, y, ramp[idx]);

      if (accentHex && light > 0.58 && dist < 0.78 && hash2i(x, y, seed + 409) < 0.055) {
        buf.pset(x, y, accentHex);
      }
    }
  }
}

// =========================================================================
// SPRITECOOK DUAL-GRID 15-PIECE AUTOTILE ENGINE
// =========================================================================

/**
 * Exact SpriteCook dual-grid lookup: maps 4-bit corner mask (1=TL, 2=TR, 4=BL, 8=BR)
 * to cell index (0..15) in a 4x4 15-piece tileset atlas. Mask 0 -> -1 (empty / counter-surface).
 */
export const DUAL_GRID_FRAME_BY_MASK = [
  -1, 15, 8, 9, 0, 11, 14, 7, 13, 4, 1, 10, 3, 2, 5, 6,
] as const;

export function dualGridMask(tl: boolean, tr: boolean, bl: boolean, br: boolean): number {
  let mask = 0;
  if (tl) mask |= 1;
  if (tr) mask |= 2;
  if (bl) mask |= 4;
  if (br) mask |= 8;
  return mask;
}

/**
 * Evaluates a smooth rounded organic coverage field in [0..1] for a dual-grid cell
 * given its 4 corner occupancy flags (tl, tr, bl, br) at local pixel u,v in [0..1].
 * Produces natural rounded corners, concave inner bends, and seamless straight edges.
 */
export function dualGridCoverage(
  u: number,
  v: number,
  tl: boolean,
  tr: boolean,
  bl: boolean,
  br: boolean,
  wobble = 0
): number {
  // Bilinear corner weight with circular rounding at single-corner & 3-corner tiles
  const count = (tl ? 1 : 0) + (tr ? 1 : 0) + (bl ? 1 : 0) + (br ? 1 : 0);
  if (count === 0) return 0;
  if (count === 4) return 1;

  // Single corner filled -> rounded quarter-circle lobe
  if (count === 1) {
    const cx = tl || bl ? 0 : 1;
    const cy = tl || tr ? 0 : 1;
    const d = Math.hypot(u - cx, v - cy);
    return clamp((0.68 + wobble - d) / 0.14);
  }
  // Three corners filled -> smooth concave inner quarter-circle cutout at the missing corner
  if (count === 3) {
    const cx = !tl || !bl ? 0 : 1;
    const cy = !tl || !tr ? 0 : 1;
    const d = Math.hypot(u - cx, v - cy);
    return clamp((d - (0.34 - wobble)) / 0.14);
  }
  // Opposite diagonal corners -> soft saddle bridge
  if ((tl && br) || (tr && bl)) {
    const d1 = tl ? Math.hypot(u, v) : Math.hypot(1 - u, v);
    const d2 = br ? Math.hypot(1 - u, 1 - v) : Math.hypot(u, 1 - v);
    const d = Math.min(d1, d2);
    return clamp((0.64 + wobble - d) / 0.14);
  }
  // Two adjacent corners -> straight edge along X or Y
  const val =
    (tl ? (1 - u) * (1 - v) : 0) +
    (tr ? u * (1 - v) : 0) +
    (bl ? (1 - u) * v : 0) +
    (br ? u * v : 0);
  return clamp((val - (0.47 - wobble * 0.5)) / 0.12);
}

/**
 * Generates a 4x4 (64x64 for 16px tiles) SpriteCook Dual-Grid 15-piece atlas canvas.
 * `paintPixel(mask, lx, ly, cov, edgeDist, tl, tr, bl, br)` returns a Uint32 RGBA pixel (or 0 for transparent).
 */
export function buildDualGridAtlas(
  tileSize: number,
  paintPixel: (
    lx: number,
    ly: number,
    cov: number,
    edgeBand: boolean,
    isTopEdge: boolean,
    isBotEdge: boolean,
    mask: number
  ) => number,
  wobbleSeed = 31
): HTMLCanvasElement {
  const atlas = new PixelBuf(tileSize * 4, tileSize * 4);

  for (let mask = 1; mask <= 15; mask++) {
    const frame = DUAL_GRID_FRAME_BY_MASK[mask];
    if (frame < 0) continue;
    const col = frame % 4;
    const row = Math.floor(frame / 4);
    const ox = col * tileSize;
    const oy = row * tileSize;

    const tl = (mask & 1) !== 0;
    const tr = (mask & 2) !== 0;
    const bl = (mask & 4) !== 0;
    const br = (mask & 8) !== 0;

    // Precompute coverage grid to detect crisp 1-2px shoreline/curb bevel edges
    const covs = new Float32Array(tileSize * tileSize);
    for (let y = 0; y < tileSize; y++) {
      for (let x = 0; x < tileSize; x++) {
        const u = (x + 0.5) / tileSize;
        const v = (y + 0.5) / tileSize;
        // Seamless subtle edge wobble (zero at tile boundaries so adjacent dual-grid cells ALWAYS stitch cleanly!)
        const edgeFade = Math.sin(u * Math.PI) * Math.sin(v * Math.PI);
        const w = (tileFbm(u * 3, v * 3, 3, 2, wobbleSeed) - 0.5) * 0.14 * edgeFade;
        covs[y * tileSize + x] = dualGridCoverage(u, v, tl, tr, bl, br, w);
      }
    }

    const inside = (x: number, y: number) => {
      if (x < 0) return y < tileSize * 0.5 ? tl : bl;
      if (x >= tileSize) return y < tileSize * 0.5 ? tr : br;
      if (y < 0) return x < tileSize * 0.5 ? tl : tr;
      if (y >= tileSize) return x < tileSize * 0.5 ? bl : br;
      return covs[y * tileSize + x] >= 0.5;
    };

    for (let y = 0; y < tileSize; y++) {
      for (let x = 0; x < tileSize; x++) {
        const cov = covs[y * tileSize + x];
        if (cov < 0.5) continue;
        const openTop = !inside(x, y - 1) || !inside(x, y - 2);
        const openBot = !inside(x, y + 1);
        const openSide = !inside(x - 1, y) || !inside(x + 1, y);
        const edgeBand = openTop || openBot || openSide;
        const color = paintPixel(x, y, cov, edgeBand, openTop, openBot, mask);
        if (color >>> 24) {
          atlas.pset(ox + x, oy + y, color);
        }
      }
    }
  }

  return atlas.toCanvas();
}
