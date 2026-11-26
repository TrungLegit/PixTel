import type { ClassId, EquipSlot, ItemDef, ItemIconKind, ItemInstance } from "../data/types";
import { drawCodixelIcon } from "./codixelAtlas";
import { drawPixelfxHero } from "./pixelfxHeroModels";

// 16x16 pixel silhouettes for crisp procedural 16-bit icons
// Legend: k=#100c18 (dark outline), m=primary color, a=accent highlight, w=#ffffff, t=wood/leather
const ICON_MATRICES: Record<ItemIconKind, string[]> = {
  sword: [
    "................",
    ".............kk.",
    "............kawk",
    "...........kammk",
    "..........kammk.",
    ".........kammk..",
    "........kammk...",
    ".......kammk....",
    "......kammk.....",
    "....kkammk......",
    "...kaamkk.......",
    "..kkatk.........",
    ".kttkk..........",
    ".kakk...........",
    "..kk............",
    "................",
  ],
  axe: [
    "................",
    ".......kkkkk....",
    ".....kkmaaaak...",
    "....kmmawwwwak..",
    "....kmmmaaaamk..",
    ".....kmmtkmmmk..",
    "......kkttkmmk..",
    "......kttk.kk...",
    ".....kttk.......",
    "....kttk........",
    "...kttk.........",
    "..kttk..........",
    ".kakk...........",
    "..kk............",
    "................",
    "................",
  ],
  staff: [
    "................",
    "..........kkkk..",
    ".........kwwwwk.",
    "........kwaaaawk",
    "........kwammamk",
    ".........kammmk.",
    "........kkakkk..",
    ".......kttk.....",
    "......kttk......",
    ".....kttk.......",
    "....kttk........",
    "...kttk.........",
    "..kttk..........",
    "..kkk...........",
    "................",
    "................",
  ],
  dagger: [
    "................",
    "................",
    "...........kkk..",
    "..........kawk..",
    ".........kammk..",
    "........kammk...",
    "......kkamk.....",
    ".....kattk......",
    "....kttkk.......",
    "....kkk.........",
    "..kkk......kkk..",
    ".kawk.....kmmk..",
    "kammk....kawk...",
    ".kkttkkkkmmk....",
    "...kk..kkk......",
    "................",
  ],
  gun: [
    "................",
    "................",
    "................",
    "..kkkkkkkkkkkk..",
    ".kmmmmmmmmmaawk.",
    ".kmmmmmmmmmmmmk.",
    ".kttkkkaakkkkk..",
    "..kttk.kk.......",
    "..kttk..........",
    "..kttk..........",
    "...kkk..........",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],
  helmet: [
    "................",
    ".....kkkkkk.....",
    "...kkmaaaamkk...",
    "..kmmmaaaammmk..",
    ".kmmmmmmmmmmmmk.",
    ".kmmkkkkkkkkmmk.",
    ".kmmkwwwwwwkmmk.",
    ".kmmkwaaaawkmmk.",
    ".kmmkkkkkkkkmmk.",
    ".kmmmmk..kmmmmk.",
    "..kmmk....kmmk..",
    "...kk......kk...",
    "................",
    "................",
    "................",
    "................",
  ],
  armor: [
    "................",
    "...kkk....kkk...",
    "..kmmmk..kmmmk..",
    ".kmmmmkkkkmmmmk.",
    ".kmmmmaaaammmmk.",
    ".kmmkmmmmmmkmmk.",
    "..kk.kmaamk.kk..",
    ".....kmaamk.....",
    ".....kmmmmk.....",
    ".....kmmmmk.....",
    "....kmaaaamk....",
    "....kmmmmmmk....",
    "....kmmmmmmk....",
    "....kkkkkkkk....",
    "................",
    "................",
  ],
  boots: [
    "................",
    "................",
    "..kkkk..kkkk....",
    ".kmmmk..kmmmk...",
    ".kammk..kammk...",
    ".kmmmk..kmmmk...",
    ".kmmmk..kmmmk...",
    ".kmmmmkkmmmmkk..",
    ".kmmmmmakmmmmmk.",
    ".ktttttkktttttk.",
    "..kkkkk..kkkkk..",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],
  accessory: [
    "................",
    "......kkkk......",
    ".....kwwwwk.....",
    "....kwaaaawk....",
    ".....kmaamk.....",
    "....kkmmmmkk....",
    "...kmmkkkkmmk...",
    "..kmmk....kmmk..",
    "..kmk......kmk..",
    "..kmk......kmk..",
    "..kmmk....kmmk..",
    "...kmmkkkkmmk...",
    "....kkmmmmkk....",
    "......kkkk......",
    "................",
    "................",
  ],
  amulet: [
    "................",
    "....kkk..kkk....",
    "...kttk..kttk...",
    "....kttk.kttk...",
    ".....ktttttk....",
    "......kkkkk.....",
    ".....kmmaamk....",
    "....kmawwwwmk...",
    "....kmmaaaamk...",
    "....kmmmmmmmk...",
    ".....kmmmmmk....",
    "......kmmmk.....",
    ".......kkk......",
    "................",
    "................",
    "................",
  ],
  book: [
    "................",
    "...kkkkkkkkkk...",
    "..kmmmmmmmmwak..",
    "..kmmaaaammwwk..",
    "..kmmawwammwak..",
    "..kmmaaaammwwk..",
    "..kmmmmmmmmwak..",
    "..kmmmmmmmmwwk..",
    "..kmmmmmmmmwak..",
    "..kttttttttwwk..",
    "..kwwwwwwwwwwk..",
    "...kkkkkkkkkk...",
    "................",
    "................",
    "................",
    "................",
  ],
  disc: [
    "................",
    ".....kkkkkk.....",
    "...kkmmmmmmkk...",
    "..kmmmaaaammmk..",
    ".kmmmawwwwammmk.",
    ".kmmawkkkkwammmk",
    ".kmmawkmmkwammmk",
    ".kmmawkmmkwammmk",
    ".kmmawkkkkwammmk",
    ".kmmmmwaaawmmmmk",
    "..kmmmmmmmmmmk..",
    "...kkmmmmmmkk...",
    ".....kkkkkk.....",
    "................",
    "................",
    "................",
  ],
  totem: [
    "................",
    ".....kkkkkk.....",
    "....kmaaaamk....",
    "...kmmkwwkmmk...",
    "..kkmmmmmmmmkk..",
    ".kaammmwwmmmaak.",
    ".kmmmmmmmmmmmmk.",
    "..kkkmaaaamkkk..",
    "....kmmmmmmk....",
    "....kmmwwmmk....",
    ".....kmmmmk.....",
    ".....kttttk.....",
    "......kkkk......",
    "................",
    "................",
    "................",
  ],
  pigment: [
    "................",
    ".......kk.......",
    "......kwwk......",
    ".....kwaawk.....",
    "....kmaaaamk....",
    "...kmmmaaaamk...",
    "..kmmmmmmmmmmk..",
    "..kttttttttttk..",
    ".kttttmmmmttttk.",
    ".kttttttttttttk.",
    "..kkkkkkkkkkkk..",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],
  potion: [
    "................",
    "......kkkk......",
    "......kttk......",
    ".....kwwwwk.....",
    "......kmmk......",
    ".....kmaamk.....",
    "....kmmaammk....",
    "...kmmmaaammk...",
    "...kmmmmmmmmk...",
    "...kmmmmmmmmk...",
    "...kmmmmmmmmk...",
    "....kmmmmmmk....",
    ".....kkkkkk.....",
    "................",
    "................",
    "................",
  ],
  ore: [
    "................",
    ".....kkkkk......",
    "...kkmmmmmk.....",
    "..kmmmaaaammk...",
    ".kmmmawwwwammk..",
    ".kmmmmmaaammmk..",
    ".kttttmmmmmttk..",
    "..kttttttmtttk..",
    "...kttttttttk...",
    "....kkkkkkkk....",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],
  shard: [
    "................",
    ".......kk.......",
    "......kwwk......",
    ".....kwaawk.....",
    "....kwaaaawk....",
    "...kwaammmawk...",
    "...kmmmaaaamk...",
    "....kmmmmmmk....",
    "....kmmmmmmk....",
    ".....kmmmmk.....",
    "......kmmk......",
    ".......kk.......",
    "................",
    "................",
    "................",
    "................",
  ],
  core: [
    "................",
    "....kkkkkkkk....",
    "...kttttttttk...",
    "..ktkmmmmaaktk..",
    "..ktkmwwwwmktk..",
    "..ktkmwaaamktk..",
    "..ktkmmaammktk..",
    "..ktkmmmmmmktk..",
    "...kttttttttk...",
    "....kkkkkkkk....",
    ".....kk..kk.....",
    "....kwwkkwwk....",
    ".....kk..kk.....",
    "................",
    "................",
    "................",
  ],
};

function inferIconKind(def: ItemDef): ItemIconKind {
  if (def.iconKind) return def.iconKind;
  if (def.category === "consumable") return "potion";
  if (def.category === "material") return "shard";
  if (def.slot === "helmet") return "helmet";
  if (def.slot === "armor") return "armor";
  if (def.slot === "boots") return "boots";
  if (def.slot === "accessory") return "accessory";
  return "sword";
}

/**
 * Draws a crisp pixel-art icon for any item:
 * uses the high-craft 24x24 codixel atlas first, falling back to 16x16 matrices only while decoding.
 */
export function drawItemIcon(
  ctx: CanvasRenderingContext2D,
  def: ItemDef,
  targetSize = 32,
  offsetX = 0,
  offsetY = 0
) {
  ctx.imageSmoothingEnabled = false;
  if (def.spriteKey && drawCodixelIcon(ctx, def.spriteKey, offsetX, offsetY, targetSize)) {
    return;
  }

  const kind = inferIconKind(def);
  const rows = ICON_MATRICES[kind];
  const scale = Math.max(1, Math.floor(targetSize / 16));
  const pad = Math.floor((targetSize - 16 * scale) / 2);
  const pal: Record<string, string> = {
    k: def.visualStyle?.outline ?? "#100c18",
    m: def.visualStyle?.primary ?? def.visualColor ?? def.iconColor,
    a: def.visualStyle?.accent ?? def.accentColor ?? "#ffffff",
    w: "#ffffff",
    t: "#7c583c",
  };

  for (let y = 0; y < 16; y++) {
    const row = rows[y];
    for (let x = 0; x < 16; x++) {
      const ch = row[x];
      if (ch === ".") continue;
      const col = pal[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(offsetX + pad + x * scale, offsetY + pad + y * scale, scale, scale);
    }
  }
}

/**
 * Renders the 4x integer-scaled animated Character Preview in the Inventory UI,
 * delegating directly to the codixel-powered Paper-Doll renderer for 1:1 map fidelity.
 */
export function drawEquippedHeroPreview(
  ctx: CanvasRenderingContext2D,
  classId: ClassId,
  equipment: Partial<Record<EquipSlot, ItemInstance>>,
  walkFrame: number,
  facing: 1 | -1,
  time: number,
  extra?: { aegisActive?: boolean; buffActive?: boolean; setAuraColor?: string | null }
) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.imageSmoothingEnabled = false;

  // Ornate dark obsidian chamber backdrop with radial arcane spotlight
  ctx.fillStyle = "#0e0b19";
  ctx.fillRect(0, 0, w, h);

  const centerX = Math.round(w / 2);
  const auraGlow = extra?.setAuraColor ?? "#5b4ca8";
  const grad = ctx.createRadialGradient(centerX, Math.round(h * 0.48), 8, centerX, Math.round(h * 0.48), Math.round(h * 0.56));
  grad.addColorStop(0, `${auraGlow}38`);
  grad.addColorStop(0.55, "#19152e");
  grad.addColorStop(1, "#0b0916");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle 16-bit architectural floor/wall lines
  ctx.fillStyle = "rgba(95, 86, 145, 0.14)";
  for (let gx = 0; gx < w; gx += 16) ctx.fillRect(gx, 0, 1, h);
  for (let gy = 0; gy < h; gy += 16) ctx.fillRect(0, gy, w, 1);

  const footY = Math.round(h - 14);

  // Stepped 16-bit stone pedestal
  ctx.fillStyle = "#171429";
  ctx.fillRect(centerX - 34, footY + 4, 68, 6);
  ctx.fillStyle = "#2d284d";
  ctx.fillRect(centerX - 30, footY, 60, 5);
  ctx.fillStyle = "#484073";
  ctx.fillRect(centerX - 28, footY, 56, 2);
  ctx.fillStyle = "rgba(0,0,0,0.58)";
  ctx.fillRect(centerX - 22, footY - 3, 44, 4);

  const wpnInst = equipment.weapon;
  if (wpnInst && wpnInst.enhanceLevel >= 5) {
    const pulse = (Math.floor(time * 8) & 1) === 0;
    ctx.fillStyle = wpnInst.enhanceLevel >= 8 ? "#ff9922" : "#ffe066";
    ctx.fillRect(centerX - 24, footY, 48, 2);
    if (pulse) {
      ctx.fillRect(centerX - 28, footY - 4, 2, 2);
      ctx.fillRect(centerX + 26, footY - 4, 2, 2);
    }
  }

  drawPixelfxHero(ctx, {
    classId,
    equipment,
    x: centerX,
    y: footY,
    rigScale: 0.78,
    drawScale: 2,
    walkFrame,
    facing,
    facingDir: facing < 0 ? "left" : "right",
    animState: "run",
    hitFlash: false,
    bleached: false,
    time,
    aegisActive: extra?.aegisActive,
    buffActive: extra?.buffActive,
    setAuraColor: extra?.setAuraColor,
  });
}
