import type { ClassId, EquipSlot, ItemDef, ItemIconKind, ItemInstance } from "../data/types";
import { drawPaperDollHero } from "./paperDoll";

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
 * Draws a crisp 16x16 pixel-art icon for any item onto the target 2D canvas.
 */
export function drawItemIcon(
  ctx: CanvasRenderingContext2D,
  def: ItemDef,
  targetSize = 32,
  offsetX = 0,
  offsetY = 0
) {
  ctx.imageSmoothingEnabled = false;
  const kind = inferIconKind(def);
  const rows = ICON_MATRICES[kind];
  const scale = Math.max(1, Math.floor(targetSize / 16));
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
      ctx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
    }
  }
}

/**
 * Renders the 4x integer-scaled animated Character Preview in the Inventory UI,
 * delegating directly to the Paper-Doll pixel renderer for 1:1 map fidelity.
 */
export function drawEquippedHeroPreview(
  ctx: CanvasRenderingContext2D,
  classId: ClassId,
  equipment: Partial<Record<EquipSlot, ItemInstance>>,
  walkFrame: number,
  facing: 1 | -1,
  time: number
) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = "#100e1c";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#19162b";
  for (let gx = 0; gx < w; gx += 12) ctx.fillRect(gx, 0, 1, h);
  for (let gy = 0; gy < h; gy += 12) ctx.fillRect(0, gy, w, 1);

  const scale = 4;
  const centerX = Math.round(w / 2);
  const footY = Math.round(h - 10);

  ctx.fillStyle = "#262242";
  ctx.fillRect(centerX - 24, footY, 48, 6);
  ctx.fillStyle = "#3a3561";
  ctx.fillRect(centerX - 20, footY - 2, 40, 4);
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(centerX - 18, footY - 4, 36, 4);

  const wpnInst = equipment.weapon;
  if (wpnInst && wpnInst.enhanceLevel >= 5) {
    const pulse = (Math.floor(time * 8) & 1) === 0;
    ctx.fillStyle = wpnInst.enhanceLevel >= 8 ? "#ff9922" : "#ffe066";
    ctx.fillRect(centerX - 20, footY, 40, 2);
    if (pulse) {
      ctx.fillRect(centerX - 24, footY - 4, 2, 2);
      ctx.fillRect(centerX + 22, footY - 4, 2, 2);
    }
  }

  drawPaperDollHero(ctx, {
    classId,
    equipment,
    x: centerX,
    y: footY,
    scale,
    walkFrame,
    facing,
    facingDir: facing < 0 ? "left" : "right",
    animState: "run",
    hitFlash: false,
    bleached: false,
    time,
  });
}
