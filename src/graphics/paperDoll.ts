import { ITEMS } from "../data/items";
import type {
  ClassId,
  EquipSlot,
  EquipVisualStyle,
  ItemDef,
  ItemInstance,
} from "../data/types";
import { sprites } from "./pixelSprites";

export type HeroFacingDir = "down" | "up" | "left" | "right";
export type HeroAnimState = "idle" | "run" | "attack" | "charge" | "dash";

export interface PaperDollOptions {
  classId: ClassId;
  equipment: Partial<Record<EquipSlot, ItemInstance>>;
  x: number; // bottom-center X on canvas
  y: number; // bottom-center Y on canvas
  scale?: number; // 1 for 480x270 map, 4 for 96x96 UI preview
  walkFrame: number;
  facing: number; // 1 = right, -1 = left
  facingDir?: HeroFacingDir;
  animState?: HeroAnimState;
  hitFlash?: boolean;
  bleached?: boolean;
  time?: number;
  chargePct?: number; // 0..1 when charging
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

function resolveStyle(def: ItemDef | undefined): EquipVisualStyle | null {
  if (!def) return null;
  if (def.visualStyle) return def.visualStyle;
  return {
    outline: "#100c18",
    primary: def.visualColor ?? def.iconColor,
    accent: def.accentColor ?? "#ffffff",
    shape:
      def.slot === "helmet"
        ? "hood"
        : def.slot === "armor"
          ? "tunic"
          : def.slot === "boots"
            ? "leather"
            : def.slot === "accessory"
              ? "ring_orb"
              : "blade",
  };
}

function getPalette(style: EquipVisualStyle, bleached: boolean) {
  if (!bleached) return style;
  return {
    ...style,
    outline: bleachColor(style.outline),
    primary: bleachColor(style.primary),
    accent: bleachColor(style.accent),
  };
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
    return { dx: f * 5, dy: animState === "attack" ? -14 : -11 };
  }
  if (animState === "attack") return { dx: f * 8, dy: -8 };
  if (animState === "charge") return { dx: -f * 4, dy: -10 };
  if (animState === "dash") return { dx: -f * 6, dy: -7 };
  return { dx: f * 6, dy: -9 };
}

/**
 * Layered Paper-Doll Pixel Renderer:
 * Draw order: Base Body -> Boots -> Armor -> Helmet -> Weapon -> Accessory Orb.
 * Synced with 4-direction facing, horizontal flip, animation state, Bleached state, and hitFlash.
 */
export function drawPaperDollHero(ctx: CanvasRenderingContext2D, opts: PaperDollOptions) {
  const {
    classId,
    equipment,
    x,
    y,
    scale = 1,
    walkFrame,
    facing,
    facingDir = facing < 0 ? "left" : "right",
    animState = "idle",
    hitFlash = false,
    bleached = false,
    time = 0,
    chargePct = 0,
  } = opts;

  ctx.imageSmoothingEnabled = false;
  const wf = ((walkFrame % 4) + 4) % 4;
  const f: 1 | -1 = facing < 0 ? -1 : 1;

  // Animation vertical bob & horizontal lean
  let bobY = 0;
  let leanX = 0;
  if (animState === "idle") {
    bobY = Math.sin(time * 4.2) > 0.65 ? -0.5 : 0;
  } else if (animState === "run") {
    bobY = wf % 2 === 1 ? -1 : 0;
  } else if (animState === "attack") {
    leanX = f * 1;
    bobY = 0;
  } else if (animState === "charge") {
    leanX = -f * 1;
    bobY = Math.sin(time * 24) > 0 ? 0.5 : 0;
  } else if (animState === "dash") {
    leanX = f * 2;
    bobY = -1;
  }

  const ox = Math.round(x - 8 * scale + leanX * scale);
  const oy = Math.round(y - 16 * scale + bobY * scale);

  // Pixel plot helper respecting horizontal flip around 16px local width
  const px = (gx: number, gy: number, pw: number, ph: number, col: string) => {
    const rx = f < 0 ? 16 - gx - pw : gx;
    ctx.fillStyle = col;
    ctx.fillRect(
      Math.round(ox + rx * scale),
      Math.round(oy + gy * scale),
      Math.max(1, Math.round(pw * scale)),
      Math.max(1, Math.round(ph * scale))
    );
  };

  // =========================================================================
  // LAYER 1: BASE BODY (Thân nhân vật)
  // =========================================================================
  const sp = sprites.getHero(classId, wf);
  const baseImg = hitFlash
    ? f < 0
      ? sp.whiteLeft
      : sp.whiteRight
    : bleached
      ? f < 0
        ? sp.bleachedLeft
        : sp.bleachedRight
      : f < 0
        ? sp.left
        : sp.right;

  ctx.drawImage(baseImg, ox, oy, 16 * scale, 16 * scale);

  // During hitFlash, keep crisp solid white flash silhouette
  if (hitFlash) return;

  // Back-view subtle head/hood shading when moving North (facingDir === "up")
  if (facingDir === "up") {
    px(6, 4, 4, 2, bleached ? "#606675" : "#222536");
  }

  // =========================================================================
  // LAYER 2: BOOTS (Giày — khớp bước chạy)
  // =========================================================================
  const bDef = equipment.boots ? ITEMS[equipment.boots.defId] : undefined;
  const bStyle = resolveStyle(bDef);
  if (bStyle && bDef?.id !== "bts_starter") {
    const b = getPalette(bStyle, bleached);
    const strideShift = animState === "run" && wf === 1 ? 1 : animState === "run" && wf === 3 ? -1 : 0;
    const lx = 4 - strideShift;
    const rx = 9 + strideShift;
    px(lx, 13, 3, 2, b.primary);
    px(rx, 13, 3, 2, b.primary);
    px(lx, 13, 2, 1, b.accent);
    px(rx, 13, 2, 1, b.accent);
    if (b.shape === "greaves" || b.shape === "treads" || b.shape === "void_step") {
      px(lx, 12, 3, 1, b.outline);
      px(rx, 12, 3, 1, b.outline);
    }
    if (b.shape === "void_step") {
      px(lx, 15, 3, 1, b.accent);
      px(rx, 15, 3, 1, b.accent);
    }
  }

  // =========================================================================
  // LAYER 3: ARMOR (Áo giáp / Giáp vai / Áo choàng)
  // =========================================================================
  const aDef = equipment.armor ? ITEMS[equipment.armor.defId] : undefined;
  const aStyle = resolveStyle(aDef);
  if (aStyle && aDef?.id !== "arm_cloth") {
    const a = getPalette(aStyle, bleached);
    if (facingDir === "up") {
      // Back view: armored backplate or flowing mantle cape
      px(5, 7, 6, 5, a.primary);
      px(6, 8, 4, 3, a.accent);
      if (a.shape === "mantle" || a.shape === "aegis") {
        px(4, 7, 1, 6, a.outline);
        px(11, 7, 1, 6, a.outline);
        px(5, 11, 6, 2, a.outline);
      }
    } else {
      // Front / side chestplate + pauldrons
      px(6, 7, 4, 3, a.primary);
      px(7, 7, 2, 2, a.accent);
      if (a.shape === "plate" || a.shape === "aegis" || a.shape === "mantle") {
        px(3, 7, 3, 2, a.primary);
        px(10, 7, 3, 2, a.primary);
        px(4, 6, 2, 1, a.accent);
        px(10, 6, 2, 1, a.accent);
      } else {
        px(4, 7, 2, 2, a.primary);
        px(10, 7, 2, 2, a.primary);
      }
      if (a.shape === "mantle") {
        px(5, 10, 6, 1, a.accent);
      }
    }
  }

  // =========================================================================
  // LAYER 4: HELMET (Mũ / Kính / Vương miện)
  // =========================================================================
  const hDef = equipment.helmet ? ITEMS[equipment.helmet.defId] : undefined;
  const hStyle = resolveStyle(hDef);
  if (hStyle && hDef?.id !== "hlm_starter") {
    const h = getPalette(hStyle, bleached);
    const hx = h.offsetX ?? 0;
    const hy = h.offsetY ?? 0;

    if (h.shape === "halo") {
      // Floating Prism Halo + Royal Diadem
      px(5 + hx, 0 + hy, 6, 1, h.accent);
      px(4 + hx, 1 + hy, 8, 1, h.primary);
      px(6 + hx, 1 + hy, 4, 1, "#ffffff");
      px(5 + hx, 2 + hy, 6, 1, h.outline);
    } else if (h.shape === "crown") {
      px(4 + hx, 1 + hy, 1, 2, h.accent);
      px(7 + hx, 0 + hy, 2, 3, h.accent);
      px(11 + hx, 1 + hy, 1, 2, h.accent);
      px(4 + hx, 2 + hy, 8, 2, h.primary);
      px(5 + hx, 3 + hy, 6, 1, h.outline);
    } else if (h.shape === "visor") {
      px(4 + hx, 1 + hy, 8, 2, h.primary);
      px(5 + hx, 1 + hy, 6, 1, h.outline);
      if (facingDir !== "up") {
        px(5 + hx, 3 + hy, 6, 1, h.accent);
      }
    } else {
      // Crest / Hood
      px(6 + hx, 0 + hy, 4, 1, h.accent);
      px(4 + hx, 1 + hy, 8, 2, h.primary);
      px(5 + hx, 2 + hy, 6, 1, h.accent);
    }
  }

  // =========================================================================
  // LAYER 5: WEAPON (Vũ khí khớp 4 hướng & 5 trạng thái animation)
  // =========================================================================
  const wInst = equipment.weapon;
  const wDef = wInst ? ITEMS[wInst.defId] : undefined;
  const wStyle = resolveStyle(wDef);
  if (wStyle) {
    const w = getPalette(wStyle, bleached);
    const wxOff = w.offsetX ?? 0;
    const wyOff = w.offsetY ?? 0;

    // Determine pose offset by animState
    let swingX = 0;
    let swingY = 0;
    let horizontalAttack = false;
    if (animState === "run") {
      swingY = wf % 2 === 1 ? -1 : 0;
    } else if (animState === "attack") {
      horizontalAttack = true;
      swingX = 2;
      swingY = 1;
    } else if (animState === "charge") {
      swingX = -2;
      swingY = -1;
    } else if (animState === "dash") {
      swingX = -2;
      swingY = 1;
    }

    const hx = 12 + wxOff + swingX;
    const hy = (facingDir === "up" ? 4 : 5) + wyOff + swingY;

    if (w.shape === "staff") {
      if (horizontalAttack) {
        px(11, 7, 5, 1, "#7c583c");
        px(15, 6, 3, 3, w.primary);
        px(16, 7, 1, 1, w.accent);
      } else {
        px(hx, hy + 2, 1, 8, "#7c583c");
        px(hx - 1, hy - 1, 3, 3, w.outline);
        px(hx, hy, 2, 2, w.primary);
        px(hx, hy, 1, 1, w.accent);
      }
    } else if (w.shape === "carbine") {
      const gy = 8 + wyOff + (animState === "attack" ? 0 : swingY);
      const gx = 11 + wxOff + (animState === "attack" ? 1 : 0);
      px(gx, gy - 1, 5, 3, w.outline);
      px(gx, gy, 5, 2, w.primary);
      px(gx + 3, gy, 2, 1, w.accent);
      px(gx, gy + 2, 1, 2, "#4a3a30");
    } else if (w.shape === "daggers") {
      if (horizontalAttack) {
        px(12, 7, 4, 1, w.primary);
        px(15, 7, 2, 1, w.accent);
        px(1, 8, 3, 1, w.primary);
      } else {
        px(hx, hy + 1, 1, 4, w.primary);
        px(hx, hy, 1, 1, w.accent);
        px(2, hy + 2, 1, 4, w.primary);
        px(2, hy + 1, 1, 1, w.accent);
      }
    } else {
      // Sword / Greatsword / Halberd / Sovereign
      const isHeavy = w.shape === "greatsword" || w.shape === "halberd" || w.shape === "sovereign";
      if (horizontalAttack) {
        const len = isHeavy ? 7 : 5;
        px(11, 7, len, 2, w.outline);
        px(12, 7, len - 1, 1, w.primary);
        px(12 + len - 3, 7, 2, 1, w.accent);
        px(11, 6, 1, 3, "#ffe066");
      } else {
        const bladeH = isHeavy ? 7 : 5;
        const topY = hy - (isHeavy ? 3 : 1);
        px(hx - 1, topY - 1, 3, bladeH + 2, w.outline);
        px(hx, topY, 1, bladeH, w.primary);
        px(hx, topY, 1, 2, w.accent);
        if (w.shape === "sovereign" || w.shape === "halberd") {
          px(hx - 1, topY + 2, 1, 2, w.accent);
        }
        px(hx - 1, topY + bladeH, 3, 1, bleached ? "#a0a6b3" : "#ffe066");
        px(hx, topY + bladeH + 1, 1, 2, "#694127");
      }
    }

    // Charge glint at weapon tip when holding LMB
    if (animState === "charge" && chargePct > 0.25 && !bleached) {
      const sparkCol = chargePct >= 1 ? "#ffe066" : "#5ef2ff";
      px(hx, Math.max(0, hy - 2), 2, 2, sparkCol);
    }
  }

  // =========================================================================
  // LAYER 6: ACCESSORY ORB (Phụ kiện phát sáng nhỏ xoay cạnh nhân vật)
  // =========================================================================
  const accDef = equipment.accessory ? ITEMS[equipment.accessory.defId] : undefined;
  const accStyle = resolveStyle(accDef);
  if (accStyle) {
    const acc = getPalette(accStyle, bleached);
    if (scale >= 2) {
      // Full orbiting jewel in Inventory 4x stage
      const w = ctx.canvas.width;
      const h = ctx.canvas.height;
      const ax = Math.round(w / 2 + Math.cos(time * 2.8) * 32);
      const ay = Math.round(h / 2 - 8 + Math.sin(time * 2.8) * 9);
      ctx.fillStyle = acc.outline;
      ctx.fillRect(ax - 4, ay - 4, 8, 8);
      ctx.fillStyle = acc.primary;
      ctx.fillRect(ax - 3, ay - 3, 6, 6);
      ctx.fillStyle = acc.accent;
      ctx.fillRect(ax - 2, ay - 2, 2, 2);
    } else if (accDef && accDef.id !== "rng_copper") {
      // Compact 2x2 pixel spark orbiting gently in world view
      const bob = Math.round(Math.sin(time * 3.5) * 1.5);
      px(1, 5 + bob, 2, 2, acc.primary);
      px(1, 5 + bob, 1, 1, acc.accent);
    }
  }
}
