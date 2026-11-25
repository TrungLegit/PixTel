import { ITEMS, createItemInstance, getItemEffectiveStats } from "../data/items";
import type { EquipSlot, ItemInstance, StatBonus } from "../data/types";

export const MAX_BAG_SLOTS = 32;

export const HOTKEY_CONSUMABLES: readonly string[] = [
  "pot_hp",
  "pot_stamina",
  "pot_tonic",
];

/**
 * Manages player gold, 4 equipment slots, 32-slot bag, stat calculations,
 * stat comparison diffs, and 1-3 quick consumables.
 */
export class InventorySystem {
  gold = 120;
  equipment: Partial<Record<EquipSlot, ItemInstance>> = {};
  bag: ItemInstance[] = [];

  resetStarterKit() {
    this.gold = 120;
    this.equipment = {
      weapon: createItemInstance("wpn_starter", 1, 0),
      armor: createItemInstance("arm_cloth", 1, 0),
      ring: createItemInstance("rng_copper", 1, 0),
      chip: createItemInstance("chp_basic", 1, 0),
    };
    this.bag = [
      createItemInstance("pot_hp", 4, 0),
      createItemInstance("pot_stamina", 2, 0),
      createItemInstance("pot_tonic", 1, 0),
      createItemInstance("mat_iron_ore", 3, 0),
      createItemInstance("mat_glitch_core", 2, 0),
    ];
  }

  loadState(
    gold: number,
    equipment: Partial<Record<EquipSlot, ItemInstance>>,
    bag: ItemInstance[]
  ) {
    this.gold = Math.max(0, Math.floor(gold));
    this.equipment = {};
    for (const slot of ["weapon", "armor", "ring", "chip"] as EquipSlot[]) {
      const it = equipment[slot];
      if (it && ITEMS[it.defId]) {
        this.equipment[slot] = { ...it };
      }
    }
    this.bag = bag.filter((b) => ITEMS[b.defId]).map((b) => ({ ...b }));
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
    for (const slot of ["weapon", "armor", "ring", "chip"] as EquipSlot[]) {
      const eq = this.equipment[slot];
      if (eq && eq.uid === uid) return { location: slot, item: eq };
    }
    const bagIt = this.bag.find((b) => b.uid === uid);
    if (bagIt) return { location: "bag", item: bagIt };
    return null;
  }

  equipFromBag(uid: string): boolean {
    const idx = this.bag.findIndex((b) => b.uid === uid);
    if (idx < 0) return false;
    const item = this.bag[idx];
    const def = ITEMS[item.defId];
    if (!def || def.category !== "equipment" || !def.slot) return false;

    const prev = this.equipment[def.slot];
    this.equipment[def.slot] = item;
    if (prev) {
      this.bag[idx] = prev;
    } else {
      this.bag.splice(idx, 1);
    }
    return true;
  }

  unequipSlot(slot: EquipSlot): boolean {
    const eq = this.equipment[slot];
    if (!eq) return false;
    if (this.bag.length >= MAX_BAG_SLOTS) return false;
    this.bag.push(eq);
    delete this.equipment[slot];
    return true;
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
    for (const slot of ["weapon", "armor", "ring", "chip"] as EquipSlot[]) {
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

  getTotalEquipBonuses(): Required<StatBonus> {
    const sum: Required<StatBonus> = { atk: 0, def: 0, maxHp: 0, spd: 0, crit: 0 };
    for (const slot of ["weapon", "armor", "ring", "chip"] as EquipSlot[]) {
      const eq = this.equipment[slot];
      if (!eq) continue;
      const st = getItemEffectiveStats(eq);
      sum.atk += st.atk;
      sum.def += st.def;
      sum.maxHp += st.maxHp;
      sum.spd += st.spd;
      sum.crit += st.crit;
    }
    return sum;
  }

  /** Returns stat delta if `candidate` were equipped in place of current slot item. */
  compareWithEquipped(candidate: ItemInstance): Required<StatBonus> | null {
    const def = ITEMS[candidate.defId];
    if (!def || def.category !== "equipment" || !def.slot) return null;
    const candStats = getItemEffectiveStats(candidate);
    const cur = this.equipment[def.slot];
    if (!cur) return candStats;
    if (cur.uid === candidate.uid) {
      return { atk: 0, def: 0, maxHp: 0, spd: 0, crit: 0 };
    }
    const curStats = getItemEffectiveStats(cur);
    return {
      atk: candStats.atk - curStats.atk,
      def: candStats.def - curStats.def,
      maxHp: candStats.maxHp - curStats.maxHp,
      spd: candStats.spd - curStats.spd,
      crit: candStats.crit - curStats.crit,
    };
  }

  getWeaponEnhanceLevel(): number {
    return this.equipment.weapon?.enhanceLevel ?? 0;
  }
}
