import { ITEMS } from "../data/items";
import { FORGE_RECIPES } from "../data/recipes";
import type { InfusableElement, ItemInstance, RecipeDef } from "../data/types";
import type { InventorySystem } from "./inventorySystem";
import type { QuestSystem } from "./questSystem";

export const MAX_ENHANCE_LEVEL = 10;
export const CATALYST_SHARD_COST = 2;
export const CATALYST_BONUS_PCT = 15;
export const INFUSE_GOLD_COST = 40;

export const PIGMENT_IDS: readonly string[] = [
  "mat_pigment_red",
  "mat_pigment_cyan",
  "mat_pigment_green",
  "mat_pigment_gold",
];

export const ELEMENT_DISPLAY: Record<InfusableElement, { label: string; color: string; pigmentId: string }> = {
  fire: { label: "LỬA ĐỎ", color: "#ff5533", pigmentId: "mat_pigment_red" },
  ice: { label: "BĂNG LAM", color: "#38e8ff", pigmentId: "mat_pigment_cyan" },
  nature: { label: "MỘC ĐỘC", color: "#44ee88", pigmentId: "mat_pigment_green" },
  volt: { label: "ĐIỆN QUANG", color: "#ffee44", pigmentId: "mat_pigment_gold" },
};

export interface EnhanceCostInfo {
  canEnhance: boolean;
  nextLevel: number;
  goldCost: number;
  materials: { defId: string; qty: number }[];
  baseRate: number;
  pityBonus: number;
  catalystBonus: number;
  canUseCatalyst: boolean;
  successRate: number; // 0..100
  reason?: string;
}

export interface ForgeActionResult {
  ok: boolean;
  succeeded: boolean;
  message: string;
  item?: ItemInstance;
}

const BASE_RATES: Record<number, number> = {
  1: 100,
  2: 100,
  3: 100,
  4: 90,
  5: 80,
  6: 70,
  7: 60,
  8: 50,
  9: 42,
  10: 35,
};

/**
 * Blacksmith Prism Forge v2.5:
 * - Safe +0 -> +10 enhancement (never breaks or downgrades items)
 * - Prism Resonance Pity (+20% / +25% failstack accumulated per failure up to 100%)
 * - Optional Prism Catalyst (+15% success rate using 2 Prism Shards)
 * - +5 Chroma Pigment Elemental Infusion (fire / ice / nature / volt)
 * - Rare / Epic / Legendary / Boss-Core equipment crafting
 */
export class ForgeSystem {
  getEnhanceInfo(
    item: ItemInstance,
    inv: InventorySystem,
    useCatalyst = false
  ): EnhanceCostInfo {
    const def = ITEMS[item.defId];
    if (!def || def.category !== "equipment") {
      return {
        canEnhance: false,
        nextLevel: item.enhanceLevel,
        goldCost: 0,
        materials: [],
        baseRate: 0,
        pityBonus: 0,
        catalystBonus: 0,
        canUseCatalyst: false,
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
        baseRate: 0,
        pityBonus: 0,
        catalystBonus: 0,
        canUseCatalyst: false,
        successRate: 0,
        reason: "Đã đạt cấp cường hóa tối đa (+10 Thức Tỉnh)!",
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

    const baseRate = BASE_RATES[nextLevel] ?? 50;
    const pityBonus = item.pityBonus ?? 0;
    const canUseCatalyst =
      nextLevel >= 4 &&
      baseRate + pityBonus < 100 &&
      inv.countItem("mat_prism_shard") >= CATALYST_SHARD_COST;
    const catalystBonus = useCatalyst && canUseCatalyst ? CATALYST_BONUS_PCT : 0;

    if (catalystBonus > 0) {
      materials.push({ defId: "mat_prism_shard", qty: CATALYST_SHARD_COST });
    }

    const successRate = Math.min(100, baseRate + pityBonus + catalystBonus);

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

    return {
      canEnhance,
      nextLevel,
      goldCost,
      materials,
      baseRate,
      pityBonus,
      catalystBonus,
      canUseCatalyst,
      successRate,
      reason,
    };
  }

  enhanceItem(
    uid: string,
    inv: InventorySystem,
    quests: QuestSystem,
    useCatalyst = false
  ): ForgeActionResult {
    const found = inv.findByUid(uid);
    if (!found) return { ok: false, succeeded: false, message: "Không tìm thấy trang bị." };
    const info = this.getEnhanceInfo(found.item, inv, useCatalyst);
    if (!info.canEnhance) {
      return { ok: false, succeeded: false, message: info.reason ?? "Không đủ điều kiện." };
    }

    inv.gold -= info.goldCost;
    for (const m of info.materials) inv.consumeItem(m.defId, m.qty);

    const roll = Math.random() * 100;
    const def = ITEMS[found.item.defId];
    if (info.successRate >= 100 || roll <= info.successRate) {
      found.item.enhanceLevel = info.nextLevel;
      found.item.pityBonus = 0;
      quests.recordEvent("enhance_item", undefined, 1);

      let milestoneNote = "";
      if (found.item.enhanceLevel === 3) {
        milestoneNote = " ★ Đột phá [+3 Tôi Luyện] đã kích hoạt!";
      } else if (found.item.enhanceLevel === 5) {
        milestoneNote = " ★ Đột phá [+5]: Đã mở KHE NHUỘM BỘT SẮC TỐ NGUYÊN TỐ!";
      } else if (found.item.enhanceLevel === 7) {
        milestoneNote = " ★ Đột phá [+7 Hào Quang]: Mở khóa hào quang & giảm tiêu hao chiến đấu!";
      } else if (found.item.enhanceLevel === 10) {
        milestoneNote = " ★★★ THỨC TỈNH THẦN KHÍ [+10]: Cộng hưởng Lăng Kính tối thượng!";
      }

      return {
        ok: true,
        succeeded: true,
        item: found.item,
        message: `Cường hóa thành công! ${def?.name ?? ""} đạt +${found.item.enhanceLevel}!${milestoneNote}`,
      };
    }

    const gainPity = info.nextLevel === 10 ? 25 : 20;
    found.item.pityBonus = Math.min(100, (found.item.pityBonus ?? 0) + gainPity);

    return {
      ok: true,
      succeeded: false,
      item: found.item,
      message: `Chưa hội tụ đủ nhiệt (tỉ lệ ${info.successRate}%). Trang bị an toàn ở +${found.item.enhanceLevel} & tích lũy Bảo Hiểm Pity +${found.item.pityBonus}% cho lần đập kế!`,
    };
  }

  /** Infuses a +5..+10 equipment item with a Chroma Pigment element (fire/ice/nature/volt). */
  infuseElement(
    uid: string,
    element: InfusableElement,
    inv: InventorySystem,
    quests: QuestSystem
  ): ForgeActionResult {
    const found = inv.findByUid(uid);
    if (!found) return { ok: false, succeeded: false, message: "Không tìm thấy trang bị." };
    const item = found.item;
    const def = ITEMS[item.defId];
    if (!def || def.category !== "equipment") {
      return { ok: false, succeeded: false, message: "Vật phẩm không hỗ trợ khảm sắc tố." };
    }
    if (item.enhanceLevel < 5) {
      return {
        ok: false,
        succeeded: false,
        message: "Cần cường hóa trang bị đạt tối thiểu +5 để mở Khe Nhuộm Sắc Tố!",
      };
    }
    const elInfo = ELEMENT_DISPLAY[element];
    if (inv.gold < INFUSE_GOLD_COST) {
      return { ok: false, succeeded: false, message: `Cần ${INFUSE_GOLD_COST} Vàng để nhuộm sắc tố.` };
    }
    if (inv.countItem(elInfo.pigmentId) < 1) {
      return {
        ok: false,
        succeeded: false,
        message: `Thiếu ${ITEMS[elInfo.pigmentId]?.name ?? elInfo.pigmentId}! Tìm tại Bia Ký, Boss hoặc Tiệm Mira.`,
      };
    }

    inv.gold -= INFUSE_GOLD_COST;
    inv.consumeItem(elInfo.pigmentId, 1);
    item.infusedElement = element;
    quests.recordEvent("infuse_item", element, 1);

    return {
      ok: true,
      succeeded: true,
      item,
      message: `Đã khảm sắc tố [${elInfo.label}] vào ${def.name} +${item.enhanceLevel}! (+8% ELEM & đòn đánh cộng hưởng nguyên tố)`,
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
