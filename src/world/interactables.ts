import { CLASS_ALTAR_POS, TILE_SIZE, TOWN_NPCS, WAYPOINTS } from "../data/worldConfig";
import { ITEMS } from "../data/items";
import { LORE_TABLETS } from "../data/lore";
import type { LoreTabletDef, NpcDef, WaypointDef } from "../data/types";
import type { ChestEntity, GroundLootEntity } from "./entities";
import type { ColorRestorationSystem } from "../graphics/colorRestoration";

export type InteractableTarget =
  | { kind: "npc"; npc: NpcDef; x: number; y: number; prompt: string; dist: number }
  | { kind: "altar"; x: number; y: number; prompt: string; dist: number }
  | { kind: "waypoint"; wp: WaypointDef; unlocked: boolean; x: number; y: number; prompt: string; dist: number }
  | { kind: "lore"; lore: LoreTabletDef; read: boolean; x: number; y: number; prompt: string; dist: number }
  | { kind: "chest"; chest: ChestEntity; x: number; y: number; prompt: string; dist: number }
  | { kind: "loot"; loot: GroundLootEntity; x: number; y: number; prompt: string; dist: number };

const INTERACT_RANGE = 32;

/**
 * Finds the highest-priority nearby [F] interactable around the player.
 */
export function findNearestInteractable(
  px: number,
  py: number,
  colorSys: ColorRestorationSystem,
  chests: ChestEntity[],
  groundLoot: GroundLootEntity[],
  discoveredLore?: ReadonlySet<string>
): InteractableTarget | null {
  let best: InteractableTarget | null = null;
  let bestScore = Infinity;

  const consider = (cand: InteractableTarget, priorityBias: number) => {
    const score = cand.dist + priorityBias;
    if (cand.dist <= INTERACT_RANGE && score < bestScore) {
      bestScore = score;
      best = cand;
    }
  };

  // 1. Town NPCs
  for (const npc of TOWN_NPCS) {
    const x = npc.tx * TILE_SIZE + 8;
    const y = npc.ty * TILE_SIZE + 8;
    const dist = Math.hypot(px - x, py - y);
    consider(
      { kind: "npc", npc, x, y, prompt: `[F] Nói chuyện: ${npc.name}`, dist },
      0
    );
  }

  // 2. Class Altar
  {
    const x = CLASS_ALTAR_POS.tx * TILE_SIZE + 8;
    const y = CLASS_ALTAR_POS.ty * TILE_SIZE + 8;
    const dist = Math.hypot(px - x, py - y);
    consider(
      { kind: "altar", x, y, prompt: `[F] Đài Đổi Class`, dist },
      2
    );
  }

  // 3. Chroma Waypoints
  for (const wp of WAYPOINTS) {
    const x = wp.tx * TILE_SIZE + 8;
    const y = wp.ty * TILE_SIZE + 8;
    const dist = Math.hypot(px - x, py - y);
    const unlocked = colorSys.unlockedWaypoints.has(wp.id);
    consider(
      {
        kind: "waypoint",
        wp,
        unlocked,
        x,
        y,
        prompt: unlocked ? `[F] Hồi phục & Bản đồ (${wp.name})` : `[F] KÍCH HOẠT ${wp.name}`,
        dist,
      },
      unlocked ? 5 : -4
    );
  }

  // 3b. Ancient Lore Tablets (Bia Ký Lăng Kính)
  for (const lore of LORE_TABLETS) {
    const x = lore.tx * TILE_SIZE + 8;
    const y = lore.ty * TILE_SIZE + 8;
    const dist = Math.hypot(px - x, py - y);
    const read = discoveredLore ? discoveredLore.has(lore.id) : false;
    consider(
      {
        kind: "lore",
        lore,
        read,
        x,
        y,
        prompt: read ? `[F] Đọc lại Bia Ký: ${lore.title}` : `[F] ★ GIẢI MÃ BIA KÝ: ${lore.title}`,
        dist,
      },
      read ? 4 : -5
    );
  }

  // 4. Unlocked or Locked Chests
  for (const chest of chests) {
    if (chest.state === "opened") continue;
    const dist = Math.hypot(px - chest.x, py - chest.y);
    consider(
      {
        kind: "chest",
        chest,
        x: chest.x,
        y: chest.y,
        prompt:
          chest.state === "unlocked"
            ? `[F] Mở Rương Kho Báu`
            : `Rương đang bị khóa (Diệt hết quái trong trại!)`,
        dist,
      },
      chest.state === "unlocked" ? -3 : 8
    );
  }

  // 5. Ground Equipment Loot
  for (const loot of groundLoot) {
    if (loot.kind !== "item" || !loot.item) continue;
    const def = ITEMS[loot.item.defId];
    if (!def || def.category !== "equipment") continue;
    const dist = Math.hypot(px - loot.x, py - loot.y);
    consider(
      {
        kind: "loot",
        loot,
        x: loot.x,
        y: loot.y,
        prompt: `[F] Nhặt ${def.name}`,
        dist,
      },
      3
    );
  }

  return best;
}
