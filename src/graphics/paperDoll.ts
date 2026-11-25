import { ITEMS } from "../data/items";
import type {
  ClassId,
  EquipSlot,
  EquipVisualStyle,
  ItemDef,
  ItemInstance,
} from "../data/types";
import { drawCodixelOverlay } from "./codixelAtlas";
import { sprites } from "./pixelSprites";

export type HeroFacingDir = "down" | "up" | "left" | "right";
export type HeroAnimState = "idle" | "run" | "attack" | "charge" | "dash";

export interface PaperDollOptions {
  classId: ClassId;
  equipment: Partial<Record<EquipSlot, ItemInstance>>;
  x: number; // bottom-center X on canvas
  y: number; // bottom-center Y on canvas
  scale?: number; // 1 for 480x270 map, 4 for UI preview
  walkFrame: number;
  facing: number; // 1 = right, -1 = left
  facingDir?: HeroFacingDir;
  animState?: HeroAnimState;
  hitFlash?: boolean;
  bleached?: boolean;
  time?: number;
  chargePct?: number;
  aegisActive?: boolean;
  buffActive?: boolean;
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
  if (animState === "attack") return { dx: f * 9, dy: -8 };
  if (animState === "charge") return { dx: -f * 4, dy: -10 };
  if (animState === "dash") return { dx: -f * 6, dy: -7 };
  return { dx: f * 7, dy: -10 };
}

/**
 * Layered codixel Paper-Doll Pixel Renderer:
 * Draw order: Back Cape/Wings -> Base Body -> Boots -> Armor -> Helmet -> Weapon -> Orbiting Accessory -> Active Aegis.
 * Renders ALL 5 slots + tiers visibly on both the Open-World map and Inventory preview!
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
    aegisActive = false,
    buffActive = false,
  } = opts;

  ctx.imageSmoothingEnabled = false;
  const wf = ((Math.floor(walkFrame) % 4) + 4) % 4;
  const f: 1 | -1 = facing < 0 ? -1 : 1;

  // Frame-synced vertical bob & horizontal lean
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
  // 24x24 codixel overlay wraps centered around the 16x16 hero with 4px margins on all 4 sides
  const pdX = ox - 4 * scale;
  const pdY = oy - 4 * scale;
  const pdSize = 24 * scale;

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
  // LAYER 0: BACK CAPE / WINGS (Drawn behind body!)
  // =========================================================================
  const aDef = equipment.armor ? ITEMS[equipment.armor.defId] : undefined;
  const bDef = equipment.boots ? ITEMS[equipment.boots.defId] : undefined;
  const hDef = equipment.helmet ? ITEMS[equipment.helmet.defId] : undefined;
  const wInst = equipment.weapon;
  const wDef = wInst ? ITEMS[wInst.defId] : undefined;
  const accDef = equipment.accessory ? ITEMS[equipment.accessory.defId] : undefined;

  if (!hitFlash && aDef) {
    const capeKey = aDef.capeKey ?? `cape_t${aDef.tier ?? 1}`;
    const swayY = animState === "run" ? ((wf & 1) ? -1 * scale : 0) : 0;
    if (facingDir !== "up") {
      drawCodixelOverlay(ctx, capeKey, pdX, pdY + swayY, pdSize, pdSize, f < 0, bleached);
    }
  }

  // =========================================================================
  // LAYER 1: BASE BODY (Unarmed Bare-Handed Dynamic Model OR Equipped Base Body)
  // =========================================================================
  const hasAnyGear = Boolean(aDef || bDef || hDef || wDef || accDef);
  if (!hasAnyGear && !bleached) {
    const dynSp = sprites.getHeroDynamic(
      classId,
      { weaponTier: "none", armorTier: "none", ringTier: "none", chipTier: "none", weaponEnhance: 0 },
      wf
    );
    const dynImg = hitFlash
      ? f < 0
        ? dynSp.whiteLeft
        : dynSp.whiteRight
      : f < 0
        ? dynSp.left
        : dynSp.right;
    ctx.drawImage(dynImg, pdX, pdY, pdSize, pdSize);
    if (facingDir === "up" && !hitFlash) {
      px(6, 4, 4, 2, "#222536");
    }
    return;
  }

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
  if (hitFlash) return;

  // Active ATK/Buff Aura Halo under/behind character torso
  if (buffActive && !bleached) {
    const pulse = (Math.floor(time * 10) & 1) === 0;
    px(3, 14, 10, 1, pulse ? "#ffe066" : "#ff8844");
  }

  // Back-view subtle shading when moving North
  if (facingDir === "up") {
    px(6, 4, 4, 2, bleached ? "#606675" : "#222536");
  }

  // =========================================================================
  // LAYER 2: BOOTS (Synced with walk stride!)
  // =========================================================================
  if (bDef) {
    const strideIdx = animState === "run" && wf % 2 === 1 ? 1 : 0;
    const bootsBase = bDef.paperDollKey ?? `boots_t${bDef.tier ?? 1}`;
    const drew = drawCodixelOverlay(
      ctx,
      `${bootsBase}_${strideIdx}`,
      pdX,
      pdY,
      pdSize,
      pdSize,
      f < 0,
      bleached
    );
    if (!drew) {
      const bStyle = resolveStyle(bDef);
      if (bStyle) {
        const b = getPalette(bStyle, bleached);
        const shift = strideIdx;
        px(4 - shift, 13, 3, 2, b.primary);
        px(9 + shift, 13, 3, 2, b.primary);
      }
    }
  }

  // =========================================================================
  // LAYER 3: ARMOR (Chestplate & Pauldrons + North Backplate)
  // =========================================================================
  if (aDef) {
    const armorKey = aDef.paperDollKey ?? `armor_t${aDef.tier ?? 1}`;
    const drew = drawCodixelOverlay(ctx, armorKey, pdX, pdY, pdSize, pdSize, f < 0, bleached);
    if (!drew) {
      const aStyle = resolveStyle(aDef);
      if (aStyle) {
        const a = getPalette(aStyle, bleached);
        px(6, 7, 4, 3, a.primary);
        px(4, 7, 2, 2, a.primary);
        px(10, 7, 2, 2, a.primary);
      }
    }
    // When moving up (North view), draw back cape OVER the back torso so it drapes cleanly
    if (facingDir === "up") {
      const capeKey = aDef.capeKey ?? `cape_t${aDef.tier ?? 1}`;
      drawCodixelOverlay(ctx, capeKey, pdX, pdY, pdSize, pdSize, f < 0, bleached);
    }
  }

  // =========================================================================
  // LAYER 4: HELMET (Hoods, Plumes, Visors, Horns, Floating Halo!)
  // =========================================================================
  if (hDef) {
    const helmetKey = hDef.paperDollKey ?? `helmet_t${hDef.tier ?? 1}`;
    const drew = drawCodixelOverlay(ctx, helmetKey, pdX, pdY, pdSize, pdSize, f < 0, bleached);
    if (!drew) {
      const hStyle = resolveStyle(hDef);
      if (hStyle) {
        const h = getPalette(hStyle, bleached);
        px(4, 1, 8, 2, h.primary);
        px(5, 2, 6, 1, h.accent);
      }
    }
  }

  // =========================================================================
  // LAYER 5: WEAPON (Idle, Run, Attack Swing, Charge Pullback & Spark)
  // =========================================================================
  if (wDef) {
    const isAtk = animState === "attack";
    const poseSuffix = isAtk ? "_atk" : "_idle";
    const wBase = wDef.paperDollKey ?? `wpn_sword_t${wDef.tier ?? 1}`;
    let swingShiftX = 0;
    let swingShiftY = 0;
    if (animState === "charge") {
      swingShiftX = -f * 2 * scale;
      swingShiftY = -1 * scale;
    } else if (animState === "dash") {
      swingShiftX = -f * 2 * scale;
      swingShiftY = 1 * scale;
    } else if (animState === "run") {
      swingShiftY = wf % 2 === 1 ? -1 * scale : 0;
    }

    const drew = drawCodixelOverlay(
      ctx,
      `${wBase}${poseSuffix}`,
      pdX + swingShiftX,
      pdY + swingShiftY,
      pdSize,
      pdSize,
      f < 0,
      bleached
    );

    if (!drew) {
      const wStyle = resolveStyle(wDef);
      if (wStyle) {
        const w = getPalette(wStyle, bleached);
        px(12, 5, 1, 6, w.primary);
      }
    }

    // Charge glint on weapon when holding LMB
    if (animState === "charge" && chargePct > 0.22 && !bleached) {
      const sparkCol = chargePct >= 1 ? "#ffe066" : "#5ef2ff";
      px(11, 2, 2, 2, sparkCol);
    }
  }

  // =========================================================================
  // LAYER 6: ORBITING ACCESSORY (Ring Gem or Pix-Chip visible on Map & UI!)
  // =========================================================================
  if (accDef) {
    const accKey =
      accDef.paperDollKey ??
      (accDef.iconKind === "core" ? `acc_chip_t${accDef.tier ?? 1}` : `acc_ring_t${accDef.tier ?? 1}`);
    const orbR = scale >= 2 ? 12 * scale : 10;
    const orbX = Math.round(x + Math.cos(time * 2.8) * orbR - 12 * (scale >= 2 ? 1 : 0.45));
    const orbY = Math.round(y - 9 * scale + Math.sin(time * 2.8) * (scale >= 2 ? 3 * scale : 3) - 12 * (scale >= 2 ? 1 : 0.45));
    const orbDrawSize = scale >= 2 ? 24 : 11;
    const drew = drawCodixelOverlay(ctx, accKey, orbX, orbY, orbDrawSize, orbDrawSize, false, bleached);
    if (!drew) {
      const accStyle = resolveStyle(accDef);
      if (accStyle) {
        const acc = getPalette(accStyle, bleached);
        px(1, 5 + Math.round(Math.sin(time * 3.5) * 1.5), 2, 2, acc.primary);
      }
    }
  }

  // =========================================================================
  // LAYER 7: ACTIVE CRYSTAL AEGIS FLASK BARRIER (Hộ Thuẫn Pha Lê)
  // =========================================================================
  if (aegisActive && !bleached) {
    const phase = Math.floor(time * 6) & 1;
    const c1 = phase ? "#5ef2ff" : "#38b6ff";
    const c2 = phase ? "#ffffff" : "#5ef2ff";
    px(0, 2, 1, 10, c1);
    px(15, 2, 1, 10, c1);
    px(2, 0, 12, 1, c2);
    px(2, 14, 12, 1, c1);
  }
}
