import {
  CLASS_DISPLAY_NAMES,
  ITEMS,
  canClassEquip,
  createItemInstance,
  getItemEffectiveStats,
} from "../data/items";
import type {
  ClassId,
  EquipSlot,
  GearVisualTier,
  HeroVisualLoadout,
  ItemDef,
  ItemInstance,
  StatBonus,
} from "../data/types";

export const MAX_BAG_SLOTS = 32;

export const HOTKEY_CONSUMABLES: readonly string[] = [
  "pot_hp",
  "pot_stamina",
  "pot_tonic",
];

/**
 * Manages player gold, 4 equipment slots, 32-slot bag, class-restriction rules,
 * stat calculations, visual hero loadout, and 1-3 quick consumables.
 */
export class InventorySystem {
  gold = 30;
  equipment: Partial<Record<EquipSlot, ItemInstance>> = {};
  bag: ItemInstance[] = [];

  /** Fresh adventurers start bare-handed & unarmored with only 2 HP potions and 30G! */
  resetStarterKit() {
    this.gold = 30;
    this.equipment = {};
    this.bag = [createItemInstance("pot_hp", 2, 0)];
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
        this.equipment[slot] = {
          ...it,
          bonusStats: it.bonusStats ? { ...it.bonusStats } : undefined,
        };
      }
    }
    this.bag = bag
      .filter((b) => ITEMS[b.defId])
      .map((b) => ({
        ...b,
        bonusStats: b.bonusStats ? { ...b.bonusStats } : undefined,
      }));
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
    this.bag.push({
      ...inst,
      bonusStats: inst.bonusStats ? { ...inst.bonusStats } : undefined,
    });
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

  canEquip(item: ItemInstance, classId: ClassId): { ok: boolean; reason?: string } {
    const def = ITEMS[item.defId];
    if (!def || def.category !== "equipment" || !def.slot) {
      return { ok: false, reason: "Vật phẩm này không thể trang bị." };
    }
    if (!canClassEquip(def, classId)) {
      const reqNames = (def.allowedClasses ?? [])
        .map((c) => CLASS_DISPLAY_NAMES[c] ?? c)
        .join(", ");
      return { ok: false, reason: `Chỉ dành cho Class: ${reqNames}!` };
    }
    return { ok: true };
  }

  equipFromBag(uid: string, classId: ClassId): { ok: boolean; reason?: string } {
    const idx = this.bag.findIndex((b) => b.uid === uid);
    if (idx < 0) return { ok: false, reason: "Không tìm thấy vật phẩm trong túi." };
    const item = this.bag[idx];
    const check = this.canEquip(item, classId);
    if (!check.ok) return check;

    const def = ITEMS[item.defId];
    if (!def.slot) return { ok: false, reason: "Không rõ vị trí trang bị." };

    const prev = this.equipment[def.slot];
    this.equipment[def.slot] = item;
    if (prev) {
      this.bag[idx] = prev;
    } else {
      this.bag.splice(idx, 1);
    }
    return { ok: true };
  }

  unequipSlot(slot: EquipSlot): boolean {
    const eq = this.equipment[slot];
    if (!eq) return false;
    if (this.bag.length >= MAX_BAG_SLOTS) return false;
    this.bag.push(eq);
    delete this.equipment[slot];
    return true;
  }

  /** Moves any equipped items incompatible with `classId` safely back into the bag on class switch. */
  unequipIncompatibleForClass(classId: ClassId): string[] {
    const removed: string[] = [];
    for (const slot of ["weapon", "armor", "ring", "chip"] as EquipSlot[]) {
      const eq = this.equipment[slot];
      if (!eq) continue;
      const def = ITEMS[eq.defId];
      if (!def || !canClassEquip(def, classId)) {
        this.bag.push(eq);
        delete this.equipment[slot];
        removed.push(def?.name ?? eq.defId);
      }
    }
    return removed;
  }

  sellBagItem(uid: string): number {
    const idx = this.bag.findIndex((b) => b.uid === uid);
    if (idx < 0) return 0;
    const item = this.bag[idx];
    const def = ITEMS[item.defId];
    if (!def) return 0;
    const unitVal = def.sellPrice + item.enhanceLevel * 14;
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

  getEquippedDef(slot: EquipSlot): ItemDef | null {
    const it = this.equipment[slot];
    return it ? (ITEMS[it.defId] ?? null) : null;
  }

  hasPassive(passiveId: string): boolean {
    for (const slot of ["weapon", "armor", "ring", "chip"] as EquipSlot[]) {
      const def = this.getEquippedDef(slot);
      if (def?.passiveSkill?.id === passiveId) return true;
    }
    return false;
  }

  getVisualLoadout(): HeroVisualLoadout {
    const tierOf = (slot: EquipSlot): GearVisualTier => {
      const def = this.getEquippedDef(slot);
      if (!def) return "none";
      return def.visualTier ?? def.rarity;
    };
    return {
      weaponTier: tierOf("weapon"),
      armorTier: tierOf("armor"),
      ringTier: tierOf("ring"),
      chipTier: tierOf("chip"),
      weaponEnhance: this.getWeaponEnhanceLevel(),
    };
  }
}
