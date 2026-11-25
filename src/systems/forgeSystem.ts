import { ITEMS } from "../data/items";
import { FORGE_RECIPES } from "../data/recipes";
import type { ItemInstance, RecipeDef } from "../data/types";
import type { InventorySystem } from "./inventorySystem";
import type { QuestSystem } from "./questSystem";

export const MAX_ENHANCE_LEVEL = 10;

export interface EnhanceCostInfo {
  canEnhance: boolean;
  nextLevel: number;
  goldCost: number;
  materials: { defId: string; qty: number }[];
  successRate: number; // 0..100
  reason?: string;
}

export interface ForgeActionResult {
  ok: boolean;
  succeeded: boolean;
  message: string;
  item?: ItemInstance;
}

/**
 * Blacksmith Prism Forge: +0 -> +10 enhancement (never breaks items on failure)
 * and Rare / Epic / Legendary equipment crafting.
 */
export class ForgeSystem {
  getEnhanceInfo(item: ItemInstance, inv: InventorySystem): EnhanceCostInfo {
    const def = ITEMS[item.defId];
    if (!def || def.category !== "equipment") {
      return {
        canEnhance: false,
        nextLevel: item.enhanceLevel,
        goldCost: 0,
        materials: [],
        successRate: 0,
        reason: "Vật phẩm này không thể cường hóa.",
      };
    }

    if (item.enhanceLevel >= MAX_ENHANCE_LEVEL) {
      return {
        canEnhance: false,
        nextLevel: MAX_ENHANCE_LEVEL,
        goldCost: 0,
        materials: [],
        successRate: 0,
        reason: "Đã đạt cấp cường hóa tối đa (+10)!",
      };
    }

    const nextLevel = item.enhanceLevel + 1;
    const goldCost = 30 + nextLevel * 28;
    const materials: { defId: string; qty: number }[] = [
      { defId: "mat_iron_ore", qty: 1 + Math.floor(nextLevel / 2) },
      { defId: "mat_glitch_core", qty: 1 + Math.floor(nextLevel / 3) },
    ];
    if (nextLevel >= 5) {
      materials.push({ defId: "mat_quartz_shard", qty: nextLevel - 4 });
    }
    if (nextLevel >= 7) {
      materials.push({ defId: "mat_amber_gem", qty: nextLevel - 6 });
    }
    if (nextLevel >= 9) {
      materials.push({ defId: "mat_void_prism", qty: nextLevel - 8 });
    }

    const successRate = nextLevel <= 4 ? 100 : Math.max(50, 95 - (nextLevel - 4) * 8);

    let canEnhance = inv.gold >= goldCost;
    let reason: string | undefined;
    if (!canEnhance) reason = "Không đủ Vàng.";
    for (const m of materials) {
      if (inv.countItem(m.defId) < m.qty) {
        canEnhance = false;
        reason = `Thiếu ${ITEMS[m.defId]?.name ?? m.defId}.`;
        break;
      }
    }

    return { canEnhance, nextLevel, goldCost, materials, successRate, reason };
  }

  enhanceItem(
    uid: string,
    inv: InventorySystem,
    quests: QuestSystem
  ): ForgeActionResult {
    const found = inv.findByUid(uid);
    if (!found) return { ok: false, succeeded: false, message: "Không tìm thấy trang bị." };
    const info = this.getEnhanceInfo(found.item, inv);
    if (!info.canEnhance) {
      return { ok: false, succeeded: false, message: info.reason ?? "Không đủ điều kiện." };
    }

    inv.gold -= info.goldCost;
    for (const m of info.materials) inv.consumeItem(m.defId, m.qty);

    const roll = Math.random() * 100;
    if (roll <= info.successRate) {
      found.item.enhanceLevel = info.nextLevel;
      quests.recordEvent("enhance_item", undefined, 1);
      const def = ITEMS[found.item.defId];
      const glowNote =
        found.item.enhanceLevel === 5 && def?.slot === "weapon"
          ? " Vũ khí đã phát hào quang +5!"
          : "";
      return {
        ok: true,
        succeeded: true,
        item: found.item,
        message: `Cường hóa thành công! ${def?.name ?? ""} đạt +${found.item.enhanceLevel}!${glowNote}`,
      };
    }

    return {
      ok: true,
      succeeded: false,
      item: found.item,
      message: `Cường hóa thất bại (tỉ lệ ${info.successRate}%). Trang bị vẫn giữ nguyên cấp +${found.item.enhanceLevel}!`,
    };
  }

  canCraft(recipe: RecipeDef, inv: InventorySystem): { ok: boolean; reason?: string } {
    if (inv.bag.length >= 32) return { ok: false, reason: "Túi đồ đã đầy (32/32)." };
    if (inv.gold < recipe.goldCost) return { ok: false, reason: "Không đủ Vàng." };
    for (const m of recipe.materials) {
      if (inv.countItem(m.defId) < m.qty) {
        return { ok: false, reason: `Thiếu ${ITEMS[m.defId]?.name ?? m.defId}.` };
      }
    }
    return { ok: true };
  }

  craftRecipe(recipeId: string, inv: InventorySystem): ForgeActionResult {
    const recipe = FORGE_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return { ok: false, succeeded: false, message: "Công thức không tồn tại." };
    const check = this.canCraft(recipe, inv);
    if (!check.ok) return { ok: false, succeeded: false, message: check.reason ?? "Không đủ nguyên liệu." };

    inv.gold -= recipe.goldCost;
    for (const m of recipe.materials) inv.consumeItem(m.defId, m.qty);
    inv.addItem(recipe.resultDefId, 1, 0);
    const def = ITEMS[recipe.resultDefId];
    return {
      ok: true,
      succeeded: true,
      message: `Chế tạo thành công [${def?.name ?? recipe.resultDefId}]! Đã thêm vào Túi đồ.`,
    };
  }
}
