import { PAL } from "./pixelfx/core/index.js";
import { FxAtlas, type BakedAtlas } from "./fxAtlas";
import * as rarityAuraMod from "./pixelfx/fx/pixtel/rarity-aura.js";
import * as cursedAuraMod from "./pixelfx/fx/pixtel/cursed-aura.js";
import { ITEMS } from "../data/items";
import type { Rarity } from "../data/types";
import { onCodixelReady } from "../graphics/codixelAtlas";
import { drawItemIcon } from "../graphics/itemIcons";
import type { PixelfxModule } from "./pixelfxTypes";

export type UiAuraKind = "rare" | "epic" | "cursed" | "legendary";

export const RARITY_PAL_BY_AURA: Record<UiAuraKind, string[]> = {
  rare: PAL.water,
  epic: PAL.arcane,
  cursed: PAL.blood,
  legendary: PAL.volt,
};

export const RARITY_TIER_BY_AURA: Record<UiAuraKind, number> = {
  rare: 3,
  epic: 4,
  cursed: 4,
  legendary: 5,
};

export function resolveUiAuraKind(rarity: Rarity, enhanceLevel = 0): UiAuraKind | null {
  if (rarity === "legendary" || enhanceLevel >= 8) return "legendary";
  if (rarity === "cursed") return "cursed";
  if (rarity === "epic") return "epic";
  if (rarity === "rare" || enhanceLevel >= 5) return "rare";
  return null;
}

interface TrackedSlotCanvas {
  defId: string;
  enh: number;
  aura: UiAuraKind;
  phase: number;
}

/**
 * Shared ~20 FPS pixelfx UI slot animator:
 * Bakes back + front layers of `pixtel/rarity-aura` once via FxAtlas and composites
 * them cleanly behind & in front of 24x24 codixel item icons across visible UI slots.
 */
class UiRarityFxController {
  private atlas = new FxAtlas();
  private tracked = new Map<HTMLCanvasElement, TrackedSlotCanvas>();
  private rafId = 0;
  private animTime = 0;
  private lastNow = 0;
  private accum = 0;
  private seq = 1;

  constructor() {
    onCodixelReady(() => {
      this._pruneDisconnected();
      for (const cv of this.tracked.keys()) {
        this.paintIconCanvas(cv);
      }
    });
  }

  private _getLayerAtlases(aura: UiAuraKind): { back: BakedAtlas; front: BakedAtlas } {
    const palette = RARITY_PAL_BY_AURA[aura];
    const tier = RARITY_TIER_BY_AURA[aura];
    const radius = aura === "legendary" ? 15 : aura === "cursed" ? 15 : aura === "epic" ? 14 : 13;
    const seed = aura === "legendary" ? 73 : aura === "cursed" ? 66 : aura === "epic" ? 47 : 31;
    const fps = aura === "legendary" ? 20 : aura === "cursed" ? 20 : aura === "epic" ? 18 : 16;
    const mod = (aura === "cursed" ? cursedAuraMod : rarityAuraMod) as PixelfxModule;

    const back = this.atlas.get(`ui-aura-${aura}-back`, mod, {
      options: { palette, tier, radius, seed },
      fps,
      downscale: 1,
      layer: "back",
    });
    const front = this.atlas.get(`ui-aura-${aura}-front`, mod, {
      options: { palette, tier, radius, seed },
      fps,
      downscale: 1,
      layer: "front",
    });
    return { back, front };
  }

  private _drawAtlasCentered(
    ctx: CanvasRenderingContext2D,
    atlas: BakedAtlas,
    cx: number,
    cy: number,
    t: number,
    scale: number
  ) {
    const rawIdx = Math.floor(t * atlas.fps);
    const idx = ((rawIdx % atlas.count) + atlas.count) % atlas.count;
    const gx = (idx % atlas.cols) * atlas.fw;
    const gy = Math.floor(idx / atlas.cols) * atlas.fh;
    const dw = Math.max(1, Math.round(atlas.fw * scale));
    const dh = Math.max(1, Math.round(atlas.fh * scale));
    const px = Math.round(atlas.pivotX * scale);
    const py = Math.round(atlas.pivotY * scale);
    const dx = Math.round(cx - px);
    const dy = Math.round(cy - py);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(atlas.colorCanvas, gx, gy, atlas.fw, atlas.fh, dx, dy, dw, dh);
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(atlas.lightCanvas, gx, gy, atlas.fw, atlas.fh, dx, dy, dw, dh);
    ctx.restore();
  }

  private _renderSlotCanvas(cv: HTMLCanvasElement, defId: string, aura: UiAuraKind | null, t: number) {
    const def = ITEMS[defId];
    const ctx = cv.getContext("2d");
    if (!def || !ctx) return;

    const w = cv.width;
    const h = cv.height;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);

    const iconSize = Math.max(24, Math.round(Math.min(w, h) * 0.84));
    const ox = Math.floor((w - iconSize) / 2);
    const oy = Math.floor((h - iconSize) / 2);

    if (!aura) {
      drawItemIcon(ctx, def, iconSize, ox, oy);
      return;
    }

    const { back, front } = this._getLayerAtlases(aura);
    const fxScale = Math.min(w, h) / (aura === "cursed" ? 40 : 35);
    const cx = Math.floor(w / 2);
    const cy = Math.floor(h / 2);

    this._drawAtlasCentered(ctx, back, cx, cy, t, fxScale);
    drawItemIcon(ctx, def, iconSize, ox, oy);
    this._drawAtlasCentered(ctx, front, cx, cy, t, fxScale);
  }

  paintIconCanvas(cv: HTMLCanvasElement) {
    const defId = cv.dataset.iconDef;
    if (!defId || !ITEMS[defId]) return;
    const enh = Number(cv.dataset.iconEnh || 0) || 0;
    const aura = resolveUiAuraKind(ITEMS[defId].rarity, enh);

    if (!aura) {
      this.tracked.delete(cv);
      this._renderSlotCanvas(cv, defId, null, 0);
      return;
    }

    let entry = this.tracked.get(cv);
    if (!entry) {
      entry = { defId, enh, aura, phase: ((this.seq++ * 0.29) % 1.6) };
      this.tracked.set(cv, entry);
    } else {
      entry.defId = defId;
      entry.enh = enh;
      entry.aura = aura;
    }

    this._renderSlotCanvas(cv, defId, aura, this.animTime + entry.phase);
    this._ensureLoop();
  }

  syncContainer(container: HTMLElement) {
    this._pruneDisconnected();
    container.querySelectorAll<HTMLCanvasElement>("canvas[data-icon-def]").forEach((cv) => {
      this.paintIconCanvas(cv);
    });
  }

  private _pruneDisconnected() {
    for (const cv of this.tracked.keys()) {
      if (!cv.isConnected) this.tracked.delete(cv);
    }
  }

  private _ensureLoop() {
    if (this.rafId || this.tracked.size === 0) return;
    this.lastNow = performance.now();
    this.accum = 0;

    const tick = (now: number) => {
      this._pruneDisconnected();
      if (this.tracked.size === 0) {
        this.rafId = 0;
        return;
      }

      const dt = Math.min(0.1, Math.max(0.001, (now - this.lastNow) / 1000));
      this.lastNow = now;
      this.accum += dt;

      // Throttle UI slot animations to crisp ~20 FPS (50ms step)
      if (this.accum >= 0.05) {
        this.animTime += this.accum;
        this.accum = 0;
        for (const [cv, entry] of this.tracked) {
          if (cv.offsetParent === null) continue; // skip hidden modals/elements
          this._renderSlotCanvas(cv, entry.defId, entry.aura, this.animTime + entry.phase);
        }
      }

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }
}

export const uiRarityFx = new UiRarityFxController();
