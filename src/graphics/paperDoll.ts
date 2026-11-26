import type {
  ClassId,
  EquipSlot,
  ItemInstance,
} from "../data/types";
import { drawPixelfxHero, type HeroAttackKind } from "./pixelfxHeroModels";

export type { HeroAttackKind };
export type HeroFacingDir = "down" | "up" | "left" | "right";
export type HeroAnimState = "idle" | "run" | "attack" | "charge" | "dash";

export interface PaperDollOptions {
  classId: ClassId;
  equipment: Partial<Record<EquipSlot, ItemInstance>>;
  x: number; // bottom-center X on canvas
  y: number; // bottom-center Y on canvas
  scale?: number; // 1 for 480x270 map, 2+ for UI preview
  walkFrame: number;
  facing: number; // 1 = right, -1 = left
  facingDir?: HeroFacingDir;
  animState?: HeroAnimState;
  attackKind?: HeroAttackKind;
  attackProgress?: number;
  aimAngle?: number;
  shieldGuard?: boolean;
  hitFlash?: boolean;
  bleached?: boolean;
  time?: number;
  chargePct?: number;
  aegisActive?: boolean;
  buffActive?: boolean;
  setAuraColor?: string | null;
}

/** Converts a hex color into cool Bleached grayscale for unrestored world areas. */
export function bleachColor(hexCol: string): string {
  const c = hexCol.replace("#", "");
  if (c.length !== 6) return hexCol;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const lum = Math.round(r * 0.3 + g * 0.59 + b * 0.11);
  const br = Math.min(255, Math.round(lum * 0.92 + 10));
  const bg = Math.min(255, Math.round(lum * 0.95 + 12));
  const bb = Math.min(255, Math.round(lum * 1.03 + 16));
  return `#${br.toString(16).padStart(2, "0")}${bg.toString(16).padStart(2, "0")}${bb.toString(16).padStart(2, "0")}`;
}

/**
 * Computes weapon tip/hand world offset (relative to bottom-center x,y at scale 1)
 * for spawning pixelfx sparks directly at the weapon's position.
 */
export function getWeaponAnchorOffset(
  facing: number,
  facingDir: HeroFacingDir,
  animState: HeroAnimState
): { dx: number; dy: number } {
  const f = facing < 0 ? -1 : 1;
  if (facingDir === "up") {
    return { dx: f * 6, dy: animState === "attack" ? -18 : -14 };
  }
  if (animState === "attack") return { dx: f * 12, dy: -13 };
  if (animState === "charge") return { dx: -f * 6, dy: -13 };
  if (animState === "dash") return { dx: -f * 7, dy: -10 };
  return { dx: f * 8, dy: -13 };
}

/**
 * Unified 3D-Rigged pixelfx Paper-Doll Character Renderer:
 * Renders all 4 Classes (both bare-handed novice & 5-slot equipped gear)
 * via `pixelfx/core/rig.js` + two-buffer additive light shading.
 */
export function drawPaperDollHero(ctx: CanvasRenderingContext2D, opts: PaperDollOptions) {
  const scale = opts.scale ?? 1;
  drawPixelfxHero(ctx, {
    ...opts,
    rigScale: scale >= 2 ? 0.68 : 0.62,
    drawScale: scale >= 2 ? 2 : 1,
  });
}
