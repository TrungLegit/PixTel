import { GACHA_BANNERS, getGachaBanner, type GachaBannerDef, type GachaPoolEntry } from "../data/gacha";
import { ITEMS } from "../data/items";
import type { GachaSaveState, Rarity } from "../data/types";
import type { InventorySystem } from "./inventorySystem";

export interface GachaRollOutcome {
  bannerId: string;
  itemId: string;
  qty: number;
  rarity: Rarity;
  featured: boolean;
  isDuplicate: boolean;
  bonusShards: number;
  bonusGold: number;
  /** Non-null when the chest animation should fake-out a lower rarity and SHATTER-UPGRADE mid-open! */
  fakeOutFrom: Rarity | null;
  pityEpicAfter: number;
  pityLegendAfter: number;
}

const RARITY_RANK: Record<Rarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
};

/**
 * PIXTEL v3.0 Seasonal Gacha Engine:
 * - Consumes Biome-specific Gacha Keys (`key_season_spring/winter/summer/eclipse`)
 * - Tracks persistent per-banner Soft & Hard Pity (Epic/Featured at 10, Jackpot/Legendary at 25)
 * - Auto-grants bonus Prism Shards + Gold if rolling a duplicate equipment piece
 * - Generates dramatic `fakeOutFrom` upgrade moments ("Lật Kèo Đổi Màu!") for unforgettable chest opens!
 */
export class GachaSystem {
  pityEpic: Record<string, number> = {};
  pityLegend: Record<string, number> = {};
  totalRolls = 0;
  history: { itemId: string; rarity: Rarity; bannerId: string; at: number }[] = [];

  reset() {
    this.pityEpic = {};
    this.pityLegend = {};
    this.totalRolls = 0;
    this.history = [];
  }

  exportState(): GachaSaveState {
    return {
      pityEpic: { ...this.pityEpic },
      pityLegend: { ...this.pityLegend },
      totalRolls: this.totalRolls,
      history: this.history.slice(0, 30),
    };
  }

  importState(data?: GachaSaveState) {
    this.reset();
    if (!data) return;
    this.pityEpic = { ...(data.pityEpic ?? {}) };
    this.pityLegend = { ...(data.pityLegend ?? {}) };
    this.totalRolls = data.totalRolls ?? 0;
    this.history = Array.isArray(data.history) ? data.history.slice(0, 30) : [];
  }

  getPity(bannerId: string): { epic: number; legend: number } {
    return {
      epic: this.pityEpic[bannerId] ?? 0,
      legend: this.pityLegend[bannerId] ?? 0,
    };
  }

  private _pickWeighted(entries: GachaPoolEntry[]): GachaPoolEntry {
    const total = entries.reduce((s, e) => s + Math.max(0.1, e.weight), 0);
    let r = Math.random() * total;
    for (const e of entries) {
      r -= Math.max(0.1, e.weight);
      if (r <= 0) return e;
    }
    return entries[entries.length - 1];
  }

  private _isJackpot(banner: GachaBannerDef, entry: GachaPoolEntry): boolean {
    if (entry.featured) return true;
    const maxRank = Math.max(...banner.pool.map((p) => RARITY_RANK[p.rarity]));
    return RARITY_RANK[entry.rarity] >= maxRank;
  }

  private _rollOneInternal(banner: GachaBannerDef, inv: InventorySystem): GachaRollOutcome {
    const curEpic = (this.pityEpic[banner.id] ?? 0) + 1;
    const curLeg = (this.pityLegend[banner.id] ?? 0) + 1;

    const featuredPool = banner.pool.filter((e) => e.featured);
    const maxRank = Math.max(...banner.pool.map((p) => RARITY_RANK[p.rarity]));
    const highPool = banner.pool.filter((e) => e.featured || RARITY_RANK[e.rarity] >= Math.min(4, maxRank));

    let chosen: GachaPoolEntry;
    // Hard Pity 25 -> Guaranteed Featured Seasonal Jackpot!
    if (curLeg >= banner.pityLegendAt && featuredPool.length > 0) {
      chosen = this._pickWeighted(featuredPool);
    } else if (curEpic >= banner.pityEpicAt && highPool.length > 0) {
      // Hard Pity 10 -> Guaranteed High-Tier / Featured!
      chosen = this._pickWeighted(highPool);
    } else {
      // Soft Pity ramp from roll 7+ boosts Featured weights smoothly
      const softBoost = curLeg >= 18 ? 2.6 : curEpic >= 7 ? 1.7 : 1.0;
      const adjusted = banner.pool.map((e) => ({
        ...e,
        weight: e.featured ? e.weight * softBoost : e.weight,
      }));
      chosen = this._pickWeighted(adjusted);
    }

    // Update pity counters
    if (this._isJackpot(banner, chosen)) {
      this.pityLegend[banner.id] = 0;
      this.pityEpic[banner.id] = 0;
    } else if (RARITY_RANK[chosen.rarity] >= Math.min(4, maxRank)) {
      this.pityEpic[banner.id] = 0;
      this.pityLegend[banner.id] = curLeg;
    } else {
      this.pityEpic[banner.id] = curEpic;
      this.pityLegend[banner.id] = curLeg;
    }

    const def = ITEMS[chosen.itemId];
    const qty = chosen.qty ?? 1;

    // Check duplicate equipment ownership (bag or equipped) -> keep item OR grant generous bonus Shards + Gold!
    const ownsEquip =
      def?.category === "equipment" &&
      (inv.bag.some((b) => b.defId === chosen.itemId) ||
        Object.values(inv.equipment).some((eq) => eq?.defId === chosen.itemId));

    let bonusShards = 0;
    let bonusGold = 0;
    if (ownsEquip) {
      // Duplicate protection: convert duplicate into Prism Shards + Gold so bag never clogs & rolls always feel rewarding!
      bonusShards = chosen.rarity === "legendary" ? 14 : chosen.rarity === "epic" ? 8 : chosen.rarity === "rare" ? 4 : 2;
      bonusGold = chosen.rarity === "legendary" ? 260 : chosen.rarity === "epic" ? 140 : chosen.rarity === "rare" ? 75 : 35;
      inv.addItem("mat_prism_shard", bonusShards);
      inv.gold += bonusGold;
    } else {
      inv.addItem(chosen.itemId, qty, 0);
    }

    // Dramatic Fake-Out Upgrade ("Lật Kèo Đổi Màu!") on Epic/Legendary/Featured rolls!
    let fakeOutFrom: Rarity | null = null;
    if (chosen.rarity === "legendary" && Math.random() < 0.55) {
      fakeOutFrom = Math.random() < 0.5 ? "epic" : "rare";
    } else if ((chosen.rarity === "epic" || chosen.featured) && Math.random() < 0.35) {
      fakeOutFrom = "rare";
    }

    this.totalRolls += 1;
    this.history.unshift({
      itemId: chosen.itemId,
      rarity: chosen.rarity,
      bannerId: banner.id,
      at: Date.now(),
    });
    if (this.history.length > 30) this.history.length = 30;

    return {
      bannerId: banner.id,
      itemId: chosen.itemId,
      qty,
      rarity: chosen.rarity,
      featured: !!chosen.featured,
      isDuplicate: ownsEquip,
      bonusShards,
      bonusGold,
      fakeOutFrom,
      pityEpicAfter: this.pityEpic[banner.id] ?? 0,
      pityLegendAfter: this.pityLegend[banner.id] ?? 0,
    };
  }

  /** Spends `count` biome keys (1 or 5) and performs seasonal gacha rolls. */
  roll(
    bannerId: string,
    count: 1 | 5,
    inv: InventorySystem
  ): { ok: boolean; reason?: string; outcomes: GachaRollOutcome[] } {
    const banner = getGachaBanner(bannerId);
    const keyCount = inv.countItem(banner.keyItemId);
    if (keyCount < count) {
      const keyName = ITEMS[banner.keyItemId]?.name ?? "Chìa Khóa";
      return {
        ok: false,
        reason: `Thiếu ${keyName} (cần ${count}, hiện có ${keyCount}). Đánh quái đúng vùng hoặc rèn tại Kael!`,
        outcomes: [],
      };
    }

    inv.consumeItem(banner.keyItemId, count);
    const outcomes: GachaRollOutcome[] = [];
    for (let i = 0; i < count; i++) {
      outcomes.push(this._rollOneInternal(banner, inv));
    }
    return { ok: true, outcomes };
  }

  getAllBanners(): GachaBannerDef[] {
    return GACHA_BANNERS;
  }
}
