import iconsUrl from "../assets/codixel-icons.png";
import iconsMeta from "../assets/codixel-icons.json";
import core16Url from "../assets/core16-items.png";
import core16Meta from "../assets/core16-items.json";
import pdUrl from "../assets/codixel-paperdoll.png";
import pdMeta from "../assets/codixel-paperdoll.json";

export interface AtlasFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

const ICON_FRAMES = iconsMeta.frames as Record<string, AtlasFrame>;
const CORE16_FRAMES = core16Meta.frames as Record<string, AtlasFrame>;
const PD_FRAMES = pdMeta.frames as Record<string, AtlasFrame>;

let iconsImg: HTMLImageElement | null = null;
let core16Img: HTMLImageElement | null = null;
let pdImg: HTMLImageElement | null = null;
let pdBleachedCanvas: HTMLCanvasElement | null = null;
let iconsReady = false;
let core16Ready = false;
let pdReady = false;
const readyListeners = new Set<() => void>();

function notifyReady() {
  if (iconsReady && core16Ready && pdReady) {
    for (const cb of readyListeners) cb();
  }
}

function buildBleachedOffscreen(img: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  const id = ctx.getImageData(0, 0, c.width, c.height);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const lum = Math.round(d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11);
    d[i] = Math.min(255, Math.round(lum * 0.9 + 10));
    d[i + 1] = Math.min(255, Math.round(lum * 0.94 + 12));
    d[i + 2] = Math.min(255, Math.round(lum * 1.04 + 18));
  }
  ctx.putImageData(id, 0, 0);
  return c;
}

function ensureInit() {
  if (typeof Image === "undefined" || iconsImg) return;

  iconsImg = new Image();
  iconsImg.onload = () => {
    iconsReady = true;
    notifyReady();
  };
  iconsImg.src = iconsUrl;

  core16Img = new Image();
  core16Img.onload = () => {
    core16Ready = true;
    notifyReady();
  };
  core16Img.src = core16Url;

  pdImg = new Image();
  pdImg.onload = () => {
    pdBleachedCanvas = buildBleachedOffscreen(pdImg!);
    pdReady = true;
    notifyReady();
  };
  pdImg.src = pdUrl;
}

ensureInit();

export function isCodixelReady(): boolean {
  ensureInit();
  return iconsReady && core16Ready && pdReady;
}

export function onCodixelReady(cb: () => void): () => void {
  ensureInit();
  if (iconsReady && core16Ready && pdReady) {
    cb();
  }
  readyListeners.add(cb);
  return () => readyListeners.delete(cb);
}

export function hasCodixelIcon(key: string | undefined): boolean {
  if (!key) return false;
  return Boolean(CORE16_FRAMES[key] || ICON_FRAMES[key]);
}

/**
 * Draws a crisp HD 48x48 core-16 sprite or 24x24 codixel item icon fitted into (dx, dy, targetSize).
 */
export function drawCodixelIcon(
  ctx: CanvasRenderingContext2D,
  key: string | undefined,
  dx: number,
  dy: number,
  targetSize: number
): boolean {
  ensureInit();
  if (!key) return false;
  const hd = CORE16_FRAMES[key];
  if (hd && core16Ready && core16Img) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      core16Img,
      hd.x,
      hd.y,
      hd.w,
      hd.h,
      Math.round(dx),
      Math.round(dy),
      Math.round(targetSize),
      Math.round(targetSize)
    );
    ctx.restore();
    return true;
  }
  if (!iconsReady || !iconsImg) return false;
  const f = ICON_FRAMES[key];
  if (!f) return false;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(iconsImg, f.x, f.y, f.w, f.h, Math.round(dx), Math.round(dy), Math.round(targetSize), Math.round(targetSize));
  ctx.restore();
  return true;
}

/**
 * Draws a 24x24 codixel Paper-Doll overlay sprite onto target context with horizontal flip & Bleached support.
 */
export function drawCodixelOverlay(
  ctx: CanvasRenderingContext2D,
  key: string | undefined,
  dx: number,
  dy: number,
  drawW: number,
  drawH: number,
  flip = false,
  bleached = false
): boolean {
  ensureInit();
  if (!pdReady || !pdImg || !key) return false;
  const f = PD_FRAMES[key];
  if (!f) return false;
  const src: CanvasImageSource = bleached && pdBleachedCanvas ? pdBleachedCanvas : pdImg;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (flip) {
    ctx.translate(Math.round(dx + drawW), Math.round(dy));
    ctx.scale(-1, 1);
    ctx.drawImage(src, f.x, f.y, f.w, f.h, 0, 0, Math.round(drawW), Math.round(drawH));
  } else {
    ctx.drawImage(src, f.x, f.y, f.w, f.h, Math.round(dx), Math.round(dy), Math.round(drawW), Math.round(drawH));
  }
  ctx.restore();
  return true;
}
