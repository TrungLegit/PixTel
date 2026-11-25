import { getClassDef } from "../data/classes";
import {
  ITEMS,
  createItemInstance,
  getDismantleShardYield,
  getItemEffectiveStats,
  type NormalizedEquipStats,
} from "../data/items";
import { EQUIP_SLOTS, type ClassId, type EquipSlot, type ItemInstance } from "../data/types";
import type { PlayerEntity } from "../world/entities";

export const MAX_BAG_SLOTS = 32;

export const HOTKEY_CONSUMABLES: readonly string[] = [
  "pot_hp",
  "pot_stamina",
  "pot_tonic",
  "pot_coating",
];

/**
 * Recomputes total player stats (maxHp, atk, def, spd, crit, elementBonus, maxStamina, passives)
 * from base class stats + level progression + equipped gear & enhancement milestones.
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
  const lv = player.level - 1;

  player.maxHp = cdef.baseStats.hp + lv * 16 + eq.maxHp;
  player.atk = cdef.baseStats.atk + lv * 3 + eq.atk;
  player.def = cdef.baseStats.def + Math.floor(lv * 1.2) + eq.def;
  player.spd = cdef.baseStats.spd + eq.spd;
  player.crit = Math.min(92, cdef.baseStats.crit + eq.crit);
  player.critMult = cdef.baseStats.critMult;
  player.elementBonus = eq.elementBonus;

  player.maxStamina = Math.max(100, 100 + eq.maxStamina);
  player.stamina = preserveHpRatio
    ? Math.min(player.maxStamina, player.stamina)
    : player.maxStamina;
  player.staminaCostPct = Math.max(-45, eq.staminaCostPct);
  player.poiseBreakPct = eq.poiseBreakPct;
  player.skillCdPct = Math.max(-40, eq.skillCdPct);

  const passives = inv.getActivePassives();
  player.hasOrbitGrimoire = passives.has("orbit_grimoire");
  player.hasReactionAmp = passives.has("reaction_amp");

  if (preserveHpRatio) {
    player.hp = Math.min(player.maxHp, Math.max(1, Math.round(ratio * player.maxHp)));
  } else {
    player.hp = player.maxHp;
  }
}

/**
 * Manages player gold, 5 equipment slots (helmet, armor, weapon, boots, accessory),
 * 32-slot bag, stat comparisons, dismantling, and 1-4 quick consumables.
 */
export class InventorySystem {
  gold = 120;
  equipment: Partial<Record<EquipSlot, ItemInstance>> = {};
  bag: ItemInstance[] = [];

  resetStarterKit() {
    this.gold = 120;
    this.equipment = {
      helmet: createItemInstance("hlm_starter", 1, 0),
      armor: createItemInstance("arm_cloth", 1, 0),
      weapon: createItemInstance("wpn_starter", 1, 0),
      boots: createItemInstance("bts_starter", 1, 0),
      accessory: createItemInstance("rng_copper", 1, 0),
    };
    this.bag = [
      createItemInstance("pot_hp", 4, 0),
      createItemInstance("pot_stamina", 2, 0),
      createItemInstance("pot_tonic", 1, 0),
      createItemInstance("pot_coating", 1, 0),
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

  getActivePassives(): Set<string> {
    const set = new Set<string>();
    for (const slot of EQUIP_SLOTS) {
      const eq = this.equipment[slot];
      if (!eq) continue;
      const def = ITEMS[eq.defId];
      if (def?.passiveId) set.add(def.passiveId);
    }
    return set;
  }

  getTotalEquipBonuses(): NormalizedEquipStats {
    const sum: NormalizedEquipStats = {
      atk: 0,
      def: 0,
      maxHp: 0,
      spd: 0,
      crit: 0,
      elementBonus: 0,
      maxStamina: 0,
      staminaCostPct: 0,
      poiseBreakPct: 0,
      skillCdPct: 0,
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
      sum.maxStamina += st.maxStamina;
      sum.staminaCostPct += st.staminaCostPct;
      sum.poiseBreakPct += st.poiseBreakPct;
      sum.skillCdPct += st.skillCdPct;
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
      return {
        atk: 0,
        def: 0,
        maxHp: 0,
        spd: 0,
        crit: 0,
        elementBonus: 0,
        maxStamina: 0,
        staminaCostPct: 0,
        poiseBreakPct: 0,
        skillCdPct: 0,
      };
    }
    const curStats = getItemEffectiveStats(cur);
    return {
      atk: candStats.atk - curStats.atk,
      def: candStats.def - curStats.def,
      maxHp: candStats.maxHp - curStats.maxHp,
      spd: candStats.spd - curStats.spd,
      crit: candStats.crit - curStats.crit,
      elementBonus: candStats.elementBonus - curStats.elementBonus,
      maxStamina: candStats.maxStamina - curStats.maxStamina,
      staminaCostPct: candStats.staminaCostPct - curStats.staminaCostPct,
      poiseBreakPct: candStats.poiseBreakPct - curStats.poiseBreakPct,
      skillCdPct: candStats.skillCdPct - curStats.skillCdPct,
    };
  }

  getWeaponEnhanceLevel(): number {
    return this.equipment.weapon?.enhanceLevel ?? 0;
  }
}
