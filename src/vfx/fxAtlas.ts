import { createFrame, clearFrame, createFx } from "./pixelfx/core/index.js";
import type { PixelfxModule } from "./pixelfxTypes";

export interface BakedAtlas {
  colorCanvas: HTMLCanvasElement;
  lightCanvas: HTMLCanvasElement;
  fw: number;
  fh: number;
  cols: number;
  count: number;
  fps: number;
  duration: number;
  loop: boolean;
  pivotX: number;
  pivotY: number;
}

export interface BakeOptions {
  options?: Record<string, unknown>;
  fps?: number;
  maxDuration?: number | null;
  downscale?: number;
  layer?: "back" | "front" | null;
}

/**
 * Bakes genuine pixelfx modules on-demand into tightly cropped two-buffer (color + additive light)
 * 2D sprite atlases for 60 FPS object-pooled open-world rendering.
 */
export class FxAtlas {
  private cache = new Map<string, BakedAtlas>();

  get(key: string, mod: PixelfxModule, opts: BakeOptions = {}): BakedAtlas {
    const existing = this.cache.get(key);
    if (existing) return existing;
    const atlas = this._bake(mod, opts);
    this.cache.set(key, atlas);
    return atlas;
  }

  private _bake(
    mod: PixelfxModule,
    { options = {}, fps = 18, maxDuration = null, downscale = 1, layer = null }: BakeOptions
  ): BakedAtlas {
    const meta = mod.meta ?? {};
    const [rawW, rawH] = meta.size ?? [128, 128];
    const [rawOX, rawOY] = meta.origin ?? [rawW >> 1, rawH >> 1];
    const dur = maxDuration ? Math.min(meta.duration ?? 1, maxDuration) : (meta.duration ?? 1);
    const loop = !!meta.loop;
    const count = Math.max(2, Math.min(36, Math.round(dur * fps)));
    const dt = dur / count;

    const frame = createFrame(rawW, rawH, 0, 0);
    const inst = createFx(mod, { x: rawOX, y: rawOY, ...options });

    const snapshots: { color: Uint32Array; light: Uint32Array }[] = [];
    let minX = rawW, minY = rawH, maxX = -1, maxY = -1;

    for (let i = 0; i < count; i++) {
      if (i > 0) inst.update(dt);
      clearFrame(frame);
      inst.draw(frame, layer ?? undefined);

      const C = frame.color, L = frame.light;
      let hasPixels = false;
      for (let y = 0; y < rawH; y++) {
        const row = y * rawW;
        for (let x = 0; x < rawW; x++) {
          const idx = row + x;
          const ca = C[idx] >>> 24;
          const l = L[idx] & 0xffffff;
          const lMax = Math.max(l & 255, (l >>> 8) & 255, (l >>> 16) & 255);
          if (ca > 0 || lMax > 10) {
            hasPixels = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (!hasPixels && !loop && i > 2 && snapshots.length > 0) break;
      snapshots.push({ color: frame.color.slice(), light: frame.light.slice() });
    }

    if (maxX < minX || maxY < minY) {
      minX = 0; minY = 0; maxX = Math.min(15, rawW - 1); maxY = Math.min(15, rawH - 1);
    }

    minX = Math.max(0, minX - 1);
    minY = Math.max(0, minY - 1);
    maxX = Math.min(rawW - 1, maxX + 1);
    maxY = Math.min(rawH - 1, maxY + 1);

    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;
    const fw = Math.max(2, Math.round(cropW * downscale));
    const fh = Math.max(2, Math.round(cropH * downscale));
    const n = snapshots.length;
    const cols = Math.min(n, Math.max(1, Math.ceil(Math.sqrt(n))));
    const rows = Math.ceil(n / cols);

    const colorCanvas = document.createElement("canvas");
    colorCanvas.width = cols * fw;
    colorCanvas.height = rows * fh;
    const cCtx = colorCanvas.getContext("2d")!;
    cCtx.imageSmoothingEnabled = false;

    const lightCanvas = document.createElement("canvas");
    lightCanvas.width = cols * fw;
    lightCanvas.height = rows * fh;
    const lCtx = lightCanvas.getContext("2d")!;
    lCtx.imageSmoothingEnabled = false;

    const tmpC = document.createElement("canvas");
    tmpC.width = cropW;
    tmpC.height = cropH;
    const tmpCCtx = tmpC.getContext("2d")!;
    const cImg = tmpCCtx.createImageData(cropW, cropH);
    const cU32 = new Uint32Array(cImg.data.buffer);

    const tmpL = document.createElement("canvas");
    tmpL.width = cropW;
    tmpL.height = cropH;
    const tmpLCtx = tmpL.getContext("2d")!;
    const lImg = tmpLCtx.createImageData(cropW, cropH);
    const lU32 = new Uint32Array(lImg.data.buffer);

    for (let i = 0; i < n; i++) {
      const snap = snapshots[i];
      for (let y = 0; y < cropH; y++) {
        const sRow = (minY + y) * rawW + minX;
        const dRow = y * cropW;
        for (let x = 0; x < cropW; x++) {
          cU32[dRow + x] = snap.color[sRow + x];
          lU32[dRow + x] = snap.light[sRow + x];
        }
      }
      tmpCCtx.putImageData(cImg, 0, 0);
      tmpLCtx.putImageData(lImg, 0, 0);
      const gx = (i % cols) * fw;
      const gy = Math.floor(i / cols) * fh;
      cCtx.drawImage(tmpC, 0, 0, cropW, cropH, gx, gy, fw, fh);
      lCtx.drawImage(tmpL, 0, 0, cropW, cropH, gx, gy, fw, fh);
    }

    return {
      colorCanvas,
      lightCanvas,
      fw,
      fh,
      cols,
      count: n,
      fps,
      duration: n * dt,
      loop,
      pivotX: Math.round((rawOX - minX) * downscale),
      pivotY: Math.round((rawOY - minY) * downscale),
    };
  }
}
