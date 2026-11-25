import { ITEMS, getItemEffectiveStats } from "../data/items";
import { FORGE_RECIPES } from "../data/recipes";
import type { EquipSlot, ItemInstance, RecipeDef, Rarity, StatBonus } from "../data/types";
import type { InventorySystem } from "./inventorySystem";
import type { QuestSystem } from "./questSystem";

export const MAX_ENHANCE_LEVEL = 10;

const BASE_SUCCESS_RATES = [95, 88, 80, 72, 64, 56, 48, 42, 36, 30];

export interface EnhanceCostInfo {
  canEnhance: boolean;
  nextLevel: number;
  goldCost: number;
  materials: { defId: string; qty: number }[];
  baseRate: number;
  pityBonus: number;
  catalystBoost: number;
  effectiveRate: number;
  successRate: number; // alias of effectiveRate
  hasCatalyst: boolean;
  reason?: string;
}

export interface ForgeActionResult {
  ok: boolean;
  succeeded: boolean;
  message: string;
  item?: ItemInstance;
  beforeStats?: Required<StatBonus>;
  afterStats?: Required<StatBonus>;
  rolledBonusText?: string;
  newPityBonus?: number;
}

const RARITY_SUBSTAT_MULT: Record<Rarity, number> = {
  common: 1.0,
  uncommon: 1.3,
  rare: 1.7,
  epic: 2.2,
  legendary: 3.0,
};

function rollMatrixSubstat(
  slot: EquipSlot | undefined,
  rarity: Rarity,
  target: StatBonus
): string {
  const mult = RARITY_SUBSTAT_MULT[rarity] ?? 1.0;
  const pool: (keyof StatBonus)[] =
    slot === "weapon"
      ? ["atk", "crit", "spd", "atk"]
      : slot === "armor"
        ? ["def", "maxHp", "maxHp", "spd"]
        : slot === "ring"
          ? ["crit", "atk", "spd", "maxHp"]
          : ["atk", "maxHp", "crit", "def", "spd"];

  const pick = pool[Math.floor(Math.random() * pool.length)];
  if (pick === "atk") {
    const add = Math.max(1, Math.round((1 + Math.random() * 1.4) * mult));
    target.atk = (target.atk ?? 0) + add;
    return `+${add} ATK`;
  }
  if (pick === "def") {
    const add = Math.max(1, Math.round((0.8 + Math.random() * 1.0) * mult));
    target.def = (target.def ?? 0) + add;
    return `+${add} DEF`;
  }
  if (pick === "maxHp") {
    const add = Math.max(4, Math.round((5 + Math.random() * 6) * mult));
    target.maxHp = (target.maxHp ?? 0) + add;
    return `+${add} HP`;
  }
  if (pick === "spd") {
    const add = Math.max(1, Math.round((1 + Math.random() * 1.2) * mult));
    target.spd = (target.spd ?? 0) + add;
    return `+${add} SPD`;
  }
  const add = Math.max(1, Math.round((1 + Math.random() * 0.8) * mult));
  target.crit = (target.crit ?? 0) + add;
  return `+${add}% CRIT`;
}

/**
 * Rune Matrix Transmutation Forge (+0 -> +10):
 * - Combines equipment + matrix materials + optional Matrix Rune catalyst (+15% success)
 * - Failure keeps gear safe and builds +8% Matrix Resonance pity (max +40%)
 * - Success upgrades +1 AND infuses bonus Matrix substats into the item!
 */
export class ForgeSystem {
  getEnhanceInfo(
    item: ItemInstance,
    inv: InventorySystem,
    useCatalyst = false
  ): EnhanceCostInfo {
    const def = ITEMS[item.defId];
    const hasCatalyst = inv.countItem("mat_matrix_rune") > 0;
    const pityBonus = Math.min(40, item.pityBonus ?? 0);

    if (!def || def.category !== "equipment") {
      return {
        canEnhance: false,
        nextLevel: item.enhanceLevel,
        goldCost: 0,
        materials: [],
        baseRate: 0,
        pityBonus: 0,
        catalystBoost: 0,
        effectiveRate: 0,
        successRate: 0,
        hasCatalyst,
        reason: "Vật phẩm này không thể đưa vào Ma Trận.",
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
        catalystBoost: 0,
        effectiveRate: 0,
        successRate: 0,
        hasCatalyst,
        reason: "Ma Trận đã bão hòa (+10 tối đa)!",
      };
    }

    const nextLevel = item.enhanceLevel + 1;
    const goldCost = 35 + nextLevel * 30;
    const materials: { defId: string; qty: number }[] = [
      { defId: "mat_iron_ore", qty: 1 + Math.floor(nextLevel / 2) },
      { defId: "mat_glitch_core", qty: 1 + Math.floor(nextLevel / 3) },
    ];
    if (nextLevel >= 4) {
      materials.push({ defId: "mat_quartz_shard", qty: nextLevel - 3 });
    }
    if (nextLevel >= 7) {
      materials.push({ defId: "mat_amber_gem", qty: nextLevel - 6 });
    }
    if (nextLevel >= 9) {
      materials.push({ defId: "mat_void_prism", qty: nextLevel - 8 });
    }

    const baseRate = BASE_SUCCESS_RATES[nextLevel - 1] ?? 30;
    const catalystBoost = useCatalyst && hasCatalyst ? 15 : 0;
    const effectiveRate = Math.min(100, baseRate + pityBonus + catalystBoost);

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
    if (useCatalyst && !hasCatalyst) {
      canEnhance = false;
      reason = "Thiếu Bùa Ma Trận để kích hoạt Xúc Tác.";
    }

    return {
      canEnhance,
      nextLevel,
      goldCost,
      materials,
      baseRate,
      pityBonus,
      catalystBoost,
      effectiveRate,
      successRate: effectiveRate,
      hasCatalyst,
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

    const beforeStats = getItemEffectiveStats(found.item);

    inv.gold -= info.goldCost;
    for (const m of info.materials) inv.consumeItem(m.defId, m.qty);
    if (useCatalyst && info.catalystBoost > 0) {
      inv.consumeItem("mat_matrix_rune", 1);
    }

    const roll = Math.random() * 100;
    const def = ITEMS[found.item.defId];
    if (roll <= info.effectiveRate) {
      found.item.enhanceLevel = info.nextLevel;
      found.item.pityBonus = 0;
      if (!found.item.bonusStats) found.item.bonusStats = {};
      const rolledBonusText = rollMatrixSubstat(def?.slot, def?.rarity ?? "common", found.item.bonusStats);
      const afterStats = getItemEffectiveStats(found.item);
      quests.recordEvent("enhance_item", undefined, 1);

      const glowNote =
        found.item.enhanceLevel === 5 && def?.slot === "weapon"
          ? " Vũ khí phát hào quang +5!"
          : found.item.enhanceLevel === 8 && def?.slot === "weapon"
            ? " Vũ khí khai mở hào quang Thất Sắc +8!"
            : "";

      return {
        ok: true,
        succeeded: true,
        item: found.item,
        beforeStats,
        afterStats,
        rolledBonusText,
        newPityBonus: 0,
        message: `MA TRẬN THÀNH CÔNG! ${def?.name ?? ""} đạt +${found.item.enhanceLevel} (Tụ thêm ${rolledBonusText})!${glowNote}`,
      };
    }

    found.item.pityBonus = Math.min(40, (found.item.pityBonus ?? 0) + 8);
    return {
      ok: true,
      succeeded: false,
      item: found.item,
      beforeStats,
      afterStats: beforeStats,
      newPityBonus: found.item.pityBonus,
      message: `MA TRẬN QUÁ TẢI (${info.effectiveRate}%). Trang bị vẫn giữ +${found.item.enhanceLevel}, tích tụ +${found.item.pityBonus}% Cộng Hưởng cho lần sau!`,
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
      message: `Hợp Thành Ma Trận thành công [${def?.name ?? recipe.resultDefId}]! Đã thêm vào Túi đồ.`,
    };
  }
}
