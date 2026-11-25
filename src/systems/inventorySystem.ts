import { getClassDef } from "../data/classes";
import { SET_BONUSES, STARTER_WEAPON_BY_CLASS, type SetBonusDef } from "../data/equipments";
import {
  CONSUMABLE_HOTKEY_GROUPS,
  ITEMS,
  createItemInstance,
  getDismantleShardYield,
  getItemEffectiveStats,
  getItemTier,
  type NormalizedEquipStats,
} from "../data/items";
import {
  EQUIP_SLOTS,
  type ClassId,
  type ConsumableGroup,
  type EquipSlot,
  type ItemInstance,
} from "../data/types";
import type { PlayerEntity } from "../world/entities";

export const MAX_BAG_SLOTS = 32;

export const HOTKEY_CONSUMABLES: readonly string[] = [
  "pot_hp",
  "pot_stamina",
  "pot_tonic",
  "pot_aegis_flask",
];

export interface ActiveSetStatus {
  def: SetBonusDef;
  count: number;
  twoActive: boolean;
  fourActive: boolean;
}

/**
 * Recomputes total player stats (maxHp, atk, def, spd, crit, elementBonus)
 * from base class stats + level progression + equipped gear + enhancement + active Set Bonuses.
 */
export function recalculatePlayerStats(
  player: PlayerEntity,
  inv: InventorySystem,
  preserveHpRatio = true
) {
  const prevMax = Math.max(1, player.maxHp);
  const ratio = player.hp / prevMax;
  const cdef = getClassDef(player.classId);
  const eq = inv.getTotalEquipBonuses();
  const sets = inv.getActiveSetBonusStats();
  const lv = player.level - 1;

  player.maxHp = cdef.baseStats.hp + lv * 16 + eq.maxHp + sets.maxHp;
  player.atk = cdef.baseStats.atk + lv * 3 + eq.atk + sets.atk;
  player.def = cdef.baseStats.def + Math.floor(lv * 1.2) + eq.def + sets.def;
  player.spd = cdef.baseStats.spd + eq.spd + sets.spd;
  player.crit = Math.min(95, cdef.baseStats.crit + eq.crit + sets.crit);
  player.critMult = cdef.baseStats.critMult;
  player.elementBonus = eq.elementBonus + sets.elementBonus;

  if (preserveHpRatio) {
    player.hp = Math.min(player.maxHp, Math.max(1, Math.round(ratio * player.maxHp)));
  } else {
    player.hp = player.maxHp;
  }
}

/**
 * Manages player gold, 5 equipment slots (helmet, armor, weapon, boots, accessory),
 * 32-slot bag, stat comparisons, active set bonuses, dismantling, and smart 1-4 consumables.
 */
export class InventorySystem {
  gold = 120;
  equipment: Partial<Record<EquipSlot, ItemInstance>> = {};
  bag: ItemInstance[] = [];

  resetStarterKit(classId: ClassId = "prism_knight") {
    this.gold = 120;
    const starterWpn = STARTER_WEAPON_BY_CLASS[classId] ?? "wpn_starter";
    this.equipment = {
      helmet: createItemInstance("hlm_starter", 1, 0),
      armor: createItemInstance("arm_cloth", 1, 0),
      weapon: createItemInstance(starterWpn, 1, 0),
      boots: createItemInstance("bts_starter", 1, 0),
      accessory: createItemInstance("rng_copper", 1, 0),
    };
    this.bag = [
      createItemInstance("pot_hp_small", 3, 0),
      createItemInstance("pot_hp", 2, 0),
      createItemInstance("pot_stamina_minor", 2, 0),
      createItemInstance("pot_might_brew", 1, 0),
      createItemInstance("pot_aegis_flask", 1, 0),
      createItemInstance("mat_iron_ore", 3, 0),
      createItemInstance("mat_glitch_core", 2, 0),
    ];
  }

  /**
   * Loads saved gold, equipment, and bag.
   * Automatically migrates legacy v2 saves that used `"ring"` / `"chip"` slots into `"accessory"`.
   */
  loadState(
    gold: number,
    equipment: Record<string, ItemInstance | undefined>,
    bag: ItemInstance[]
  ) {
    this.gold = Math.max(0, Math.floor(gold));
    this.equipment = {};
    this.bag = bag.filter((b) => ITEMS[b.defId]).map((b) => ({ ...b }));

    for (const slot of EQUIP_SLOTS) {
      const it = equipment[slot];
      if (it && ITEMS[it.defId]) {
        this.equipment[slot] = { ...it };
      }
    }

    // Migrate legacy "ring" and "chip" slots safely
    for (const legacySlot of ["ring", "chip"] as const) {
      const legacyItem = equipment[legacySlot];
      if (!legacyItem || !ITEMS[legacyItem.defId]) continue;
      if (!this.equipment.accessory) {
        this.equipment.accessory = { ...legacyItem };
      } else if (this.bag.length < MAX_BAG_SLOTS) {
        this.bag.push({ ...legacyItem });
      }
    }
  }

  addItem(defId: string, qty = 1, enhanceLevel = 0): boolean {
    const def = ITEMS[defId];
    if (!def || qty <= 0) return false;

    if (def.category !== "equipment") {
      const existing = this.bag.find((b) => b.defId === defId);
      if (existing) {
        existing.qty += qty;
        return true;
      }
      if (this.bag.length >= MAX_BAG_SLOTS) return false;
      this.bag.push(createItemInstance(defId, qty, 0));
      return true;
    }

    for (let i = 0; i < qty; i++) {
      if (this.bag.length >= MAX_BAG_SLOTS) return false;
      this.bag.push(createItemInstance(defId, 1, enhanceLevel));
    }
    return true;
  }

  addExistingInstance(inst: ItemInstance): boolean {
    const def = ITEMS[inst.defId];
    if (!def) return false;
    if (def.category !== "equipment") {
      return this.addItem(inst.defId, inst.qty, 0);
    }
    if (this.bag.length >= MAX_BAG_SLOTS) return false;
    this.bag.push({ ...inst });
    return true;
  }

  countItem(defId: string): number {
    let total = 0;
    for (const b of this.bag) {
      if (b.defId === defId) total += b.qty;
    }
    return total;
  }

  consumeItem(defId: string, qty = 1): boolean {
    if (this.countItem(defId) < qty) return false;
    let remaining = qty;
    for (let i = this.bag.length - 1; i >= 0 && remaining > 0; i--) {
      if (this.bag[i].defId !== defId) continue;
      const take = Math.min(remaining, this.bag[i].qty);
      this.bag[i].qty -= take;
      remaining -= take;
      if (this.bag[i].qty <= 0) this.bag.splice(i, 1);
    }
    return true;
  }

  findByUid(uid: string): { location: "bag" | EquipSlot; item: ItemInstance } | null {
    for (const slot of EQUIP_SLOTS) {
      const eq = this.equipment[slot];
      if (eq && eq.uid === uid) return { location: slot, item: eq };
    }
    const bagIt = this.bag.find((b) => b.uid === uid);
    if (bagIt) return { location: "bag", item: bagIt };
    return null;
  }

  equipFromBag(
    uid: string,
    playerClassId?: ClassId
  ): { ok: boolean; slot?: EquipSlot; reason?: string } {
    const idx = this.bag.findIndex((b) => b.uid === uid);
    if (idx < 0) return { ok: false, reason: "Không tìm thấy vật phẩm trong túi." };
    const item = this.bag[idx];
    const def = ITEMS[item.defId];
    if (!def || def.category !== "equipment" || !def.slot) {
      return { ok: false, reason: "Vật phẩm này không thể trang bị." };
    }

    if (
      playerClassId &&
      def.requiredClass &&
      def.requiredClass !== "all" &&
      def.requiredClass !== playerClassId
    ) {
      const reqName = getClassDef(def.requiredClass).vnName;
      return { ok: false, reason: `Chỉ dành cho Class ${reqName}!` };
    }

    const prev = this.equipment[def.slot];
    this.equipment[def.slot] = item;
    if (prev) {
      this.bag[idx] = prev;
    } else {
      this.bag.splice(idx, 1);
    }
    return { ok: true, slot: def.slot };
  }

  unequipSlot(slot: EquipSlot): boolean {
    const eq = this.equipment[slot];
    if (!eq) return false;
    if (this.bag.length >= MAX_BAG_SLOTS) return false;
    this.bag.push(eq);
    delete this.equipment[slot];
    return true;
  }

  dismantleBagItem(uid: string): { ok: boolean; shards: number; itemName: string; reason?: string } {
    const idx = this.bag.findIndex((b) => b.uid === uid);
    if (idx < 0) return { ok: false, shards: 0, itemName: "", reason: "Không tìm thấy vật phẩm." };
    const item = this.bag[idx];
    const def = ITEMS[item.defId];
    if (!def || def.category !== "equipment") {
      return { ok: false, shards: 0, itemName: def?.name ?? "", reason: "Chỉ có thể phân rã trang bị." };
    }
    const shards = getDismantleShardYield(item);
    this.bag.splice(idx, 1);
    this.addItem("mat_prism_shard", shards, 0);
    return { ok: true, shards, itemName: def.name };
  }

  sellBagItem(uid: string): number {
    const idx = this.bag.findIndex((b) => b.uid === uid);
    if (idx < 0) return 0;
    const item = this.bag[idx];
    const def = ITEMS[item.defId];
    if (!def) return 0;
    const unitVal = def.sellPrice + item.enhanceLevel * 12;
    this.gold += unitVal;
    if (item.qty > 1) {
      item.qty -= 1;
    } else {
      this.bag.splice(idx, 1);
    }
    return unitVal;
  }

  getAllEquipmentInstances(): { slotLabel: string; equipped: boolean; item: ItemInstance }[] {
    const out: { slotLabel: string; equipped: boolean; item: ItemInstance }[] = [];
    for (const slot of EQUIP_SLOTS) {
      const eq = this.equipment[slot];
      if (eq) out.push({ slotLabel: slot, equipped: true, item: eq });
    }
    for (const b of this.bag) {
      const def = ITEMS[b.defId];
      if (def?.category === "equipment") {
        out.push({ slotLabel: def.slot ?? "weapon", equipped: false, item: b });
      }
    }
    return out;
  }

  getTotalEquipBonuses(): NormalizedEquipStats {
    const sum: NormalizedEquipStats = {
      atk: 0,
      def: 0,
      maxHp: 0,
      spd: 0,
      crit: 0,
      elementBonus: 0,
    };
    for (const slot of EQUIP_SLOTS) {
      const eq = this.equipment[slot];
      if (!eq) continue;
      const st = getItemEffectiveStats(eq);
      sum.atk += st.atk;
      sum.def += st.def;
      sum.maxHp += st.maxHp;
      sum.spd += st.spd;
      sum.crit += st.crit;
      sum.elementBonus += st.elementBonus;
    }
    return sum;
  }

  /** Returns stat delta if `candidate` were equipped in place of current slot item. */
  compareWithEquipped(candidate: ItemInstance): NormalizedEquipStats | null {
    const def = ITEMS[candidate.defId];
    if (!def || def.category !== "equipment" || !def.slot) return null;
    const candStats = getItemEffectiveStats(candidate);
    const cur = this.equipment[def.slot];
    if (!cur) return candStats;
    if (cur.uid === candidate.uid) {
      return { atk: 0, def: 0, maxHp: 0, spd: 0, crit: 0, elementBonus: 0 };
    }
    const curStats = getItemEffectiveStats(cur);
    return {
      atk: candStats.atk - curStats.atk,
      def: candStats.def - curStats.def,
      maxHp: candStats.maxHp - curStats.maxHp,
      spd: candStats.spd - curStats.spd,
      crit: candStats.crit - curStats.crit,
      elementBonus: candStats.elementBonus - curStats.elementBonus,
    };
  }

  getWeaponEnhanceLevel(): number {
    return this.equipment.weapon?.enhanceLevel ?? 0;
  }

  /** Returns active Set Bonuses for any equipped setId >= 2 pieces. */
  getActiveSetBonuses(): ActiveSetStatus[] {
    const counts: Record<string, number> = {};
    for (const slot of EQUIP_SLOTS) {
      const eq = this.equipment[slot];
      const def = eq ? ITEMS[eq.defId] : undefined;
      if (def?.setId && SET_BONUSES[def.setId]) {
        counts[def.setId] = (counts[def.setId] ?? 0) + 1;
      }
    }
    const out: ActiveSetStatus[] = [];
    for (const [setId, count] of Object.entries(counts)) {
      const def = SET_BONUSES[setId];
      if (!def || count < 2) continue;
      out.push({
        def,
        count,
        twoActive: count >= 2,
        fourActive: count >= 4,
      });
    }
    return out;
  }

  getActiveSetBonusStats(): NormalizedEquipStats {
    const sum: NormalizedEquipStats = {
      atk: 0,
      def: 0,
      maxHp: 0,
      spd: 0,
      crit: 0,
      elementBonus: 0,
    };
    for (const st of this.getActiveSetBonuses()) {
      const apply = (b: { atk?: number; def?: number; maxHp?: number; spd?: number; crit?: number; elementBonus?: number }) => {
        sum.atk += b.atk ?? 0;
        sum.def += b.def ?? 0;
        sum.maxHp += b.maxHp ?? 0;
        sum.spd += b.spd ?? 0;
        sum.crit += b.crit ?? 0;
        sum.elementBonus += b.elementBonus ?? 0;
      };
      if (st.twoActive) apply(st.def.twoPiece);
      if (st.fourActive) apply(st.def.fourPiece);
    }
    return sum;
  }

  /** Finds the highest-tier consumable available in bag matching a hotkey group (hp/stamina/power/aegis). */
  findBestConsumableForGroup(group: ConsumableGroup): string | null {
    let bestId: string | null = null;
    let bestTier = -1;
    for (const b of this.bag) {
      if (b.qty <= 0) continue;
      const def = ITEMS[b.defId];
      if (!def || def.category !== "consumable") continue;
      const g = def.consumableSpec?.group;
      if (g !== group) continue;
      const t = getItemTier(def);
      if (t > bestTier) {
        bestTier = t;
        bestId = def.id;
      }
    }
    return bestId;
  }

  countConsumableGroup(group: ConsumableGroup): number {
    let total = 0;
    for (const b of this.bag) {
      const def = ITEMS[b.defId];
      if (def?.category === "consumable" && def.consumableSpec?.group === group) {
        total += b.qty;
      }
    }
    return total;
  }

  getHotkeyGroupForSlot(slot1Based: 1 | 2 | 3 | 4): ConsumableGroup {
    return CONSUMABLE_HOTKEY_GROUPS[slot1Based - 1] ?? "hp";
  }
}
