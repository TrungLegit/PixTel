import { getClassDef } from "../data/classes";
import { SET_BONUSES, STARTER_WEAPON_BY_CLASS, type SetBonusDef } from "../data/equipments";
import {
  CONSUMABLE_HOTKEY_GROUPS,
  ITEMS,
  RARITY_INFO,
  canClassEquip,
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

export const MAX_BAG_SLOTS = 40;

export const HOTKEY_CONSUMABLES: readonly string[] = [
  "pot_hp",
  "pot_stamina",
  "pot_tonic",
  "pot_coating",
];

export interface ActiveSetStatus {
  def: SetBonusDef;
  count: number;
  twoActive: boolean;
  fourActive: boolean;
}

/**
 * Recomputes total player stats (maxHp, atk, def, spd, crit, elementBonus, maxStamina, passives)
 * from base class stats + level progression + equipped gear + enhancement milestones + Set Bonuses.
 */
export function recalculatePlayerStats(
  player: PlayerEntity,
  inv: InventorySystem,
  preserveHpRatio = true
) {
  const prevMax = Math.max(1, player.maxHp);
  const ratio = player.hp / prevMax;
  const cdef = getClassDef(player.classId);
  const eq = inv.getTotalEquipBonuses(player.classId);
  const sets = inv.getActiveSetBonusStats(player.classId);
  const lv = player.level - 1;
  const alloc = player.allocatedStats ?? { str: 0, vit: 0, agi: 0, crt: 0 };

  player.maxHp = cdef.baseStats.hp + lv * 14 + alloc.vit * 18 + eq.maxHp + sets.maxHp;
  player.atk = cdef.baseStats.atk + lv * 2 + alloc.str * 3 + eq.atk + sets.atk;
  player.def = cdef.baseStats.def + lv * 1 + alloc.vit * 1 + eq.def + sets.def;
  player.spd = Math.round(cdef.baseStats.spd + alloc.agi * 2.5 + eq.spd + sets.spd);
  player.crit = Math.min(95, Math.round((cdef.baseStats.crit + alloc.crt * 1.5 + eq.crit + sets.crit) * 10) / 10);
  player.critMult = Number((cdef.baseStats.critMult + alloc.crt * 0.03).toFixed(2));
  player.elementBonus = eq.elementBonus + sets.elementBonus;

  player.maxStamina = Math.max(100, 100 + eq.maxStamina + sets.maxStamina);
  player.stamina = preserveHpRatio
    ? Math.min(player.maxStamina, player.stamina)
    : player.maxStamina;
  player.staminaCostPct = Math.max(-45, eq.staminaCostPct + sets.staminaCostPct);
  player.poiseBreakPct = eq.poiseBreakPct + sets.poiseBreakPct;
  player.skillCdPct = Math.max(-40, eq.skillCdPct + sets.skillCdPct);

  const passives = inv.getActivePassives(player.classId);
  player.hasOrbitGrimoire = passives.has("orbit_grimoire");
  player.hasReactionAmp = passives.has("reaction_amp");
  player.hasVoidSiphon = passives.has("void_siphon");
  player.hasWindDancer = passives.has("wind_dancer");
  player.hasChromaBlessing = passives.has("chroma_blessing");
  player.hasQuakeImpact = passives.has("quake_impact");
  player.hasRestoredPrismSurge = passives.has("restored_prism_surge");
  player.hasEnergySiphon = passives.has("energy_siphon_magnet");
  player.hasSetResonance = passives.has("set_resonance_echo");

  if (player.hasSetResonance) {
    const hasActiveSet = inv.getActiveSetBonuses().length > 0;
    const pct = hasActiveSet ? 0.08 : 0.04;
    player.atk = Math.round(player.atk * (1 + pct));
    player.def = Math.round(player.def * (1 + pct));
    player.elementBonus += hasActiveSet ? 10 : 6;
  }

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
  gold = 30;
  equipment: Partial<Record<EquipSlot, ItemInstance>> = {};
  bag: ItemInstance[] = [];

  resetStarterKit(_classId: ClassId = "prism_knight") {
    this.gold = 30;
    this.equipment = {};
    this.bag = [createItemInstance("pot_hp", 2, 0)];
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

    if (playerClassId && !canClassEquip(def, playerClassId)) {
      const reqName =
        def.requiredClass && def.requiredClass !== "all"
          ? getClassDef(def.requiredClass).vnName
          : "khác";
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

  getEquippedDef(slot: EquipSlot) {
    const eq = this.equipment[slot];
    return eq ? ITEMS[eq.defId] : undefined;
  }

  getValidEquippedWeapon(classId: ClassId): ItemInstance | undefined {
    const wpn = this.equipment.weapon;
    if (!wpn) return undefined;
    const def = ITEMS[wpn.defId];
    if (!def || !canClassEquip(def, classId)) return undefined;
    return wpn;
  }

  hasValidEquippedWeapon(classId: ClassId): boolean {
    return Boolean(this.getValidEquippedWeapon(classId));
  }

  /** Moves any equipped gear incompatible with `classId` safely back into the bag on Class Altar switch or save migration. */
  unequipIncompatibleForClass(classId: ClassId): string[] {
    const removed: string[] = [];
    for (const slot of EQUIP_SLOTS) {
      const eq = this.equipment[slot];
      if (!eq) continue;
      const def = ITEMS[eq.defId];
      if (!def) continue;
      if (!canClassEquip(def, classId)) {
        this.bag.push(eq);
        delete this.equipment[slot];
        removed.push(def.name);
      }
    }
    return removed;
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

  getItemSellValue(item: ItemInstance, fullStack = false): number {
    const def = ITEMS[item.defId];
    if (!def) return 0;
    if (def.category === "equipment") {
      return def.sellPrice + item.enhanceLevel * 12;
    }
    return def.sellPrice * (fullStack ? item.qty : 1);
  }

  sellBagItem(uid: string): number {
    const idx = this.bag.findIndex((b) => b.uid === uid);
    if (idx < 0) return 0;
    const item = this.bag[idx];
    const unitVal = this.getItemSellValue(item, false);
    if (unitVal <= 0) return 0;
    this.gold += unitVal;
    if (item.qty > 1) {
      item.qty -= 1;
    } else {
      this.bag.splice(idx, 1);
    }
    return unitVal;
  }

  /** Sells every selected bag stack at once after user confirmation and returns sold count + gold earned. */
  sellMultipleFromBag(uids: string[]): { soldCount: number; totalGold: number } {
    const picked = new Set(uids);
    let soldCount = 0;
    let totalGold = 0;
    for (let i = this.bag.length - 1; i >= 0; i--) {
      const item = this.bag[i];
      if (!picked.has(item.uid)) continue;
      const val = this.getItemSellValue(item, true);
      totalGold += val;
      soldCount += ITEMS[item.defId]?.category === "equipment" ? 1 : item.qty;
      this.bag.splice(i, 1);
    }
    this.gold += totalGold;
    return { soldCount, totalGold };
  }

  /** Scores an equipment item to identify upgrades for "Equip Best". */
  computeEquipScore(item: ItemInstance): number {
    const def = ITEMS[item.defId];
    if (!def || def.category !== "equipment") return -1;
    const st = getItemEffectiveStats(item);
    const rarityIdx = RARITY_INFO[def.rarity].tier;
    return (
      st.atk * 4.5 +
      st.def * 3.2 +
      st.maxHp * 0.45 +
      st.crit * 3.0 +
      st.spd * 2.0 +
      st.elementBonus * 1.8 +
      st.maxStamina * 0.5 +
      st.poiseBreakPct * 1.1 +
      Math.abs(st.skillCdPct) * 1.6 +
      (def.passiveId ? 18 : 0) +
      rarityIdx * 4
    );
  }

  /** Automatically equips the highest-scoring compatible item from bag for each of the 5 slots. */
  equipBestForClass(classId: ClassId): { equipped: { slot: EquipSlot; itemName: string }[] } {
    const equipped: { slot: EquipSlot; itemName: string }[] = [];
    for (const slot of EQUIP_SLOTS) {
      const cur = this.equipment[slot];
      let bestScore = cur ? this.computeEquipScore(cur) : -1;
      let bestUid: string | null = null;
      for (const bagIt of this.bag) {
        const def = ITEMS[bagIt.defId];
        if (!def || def.category !== "equipment" || def.slot !== slot) continue;
        if (!canClassEquip(def, classId)) continue;
        const sc = this.computeEquipScore(bagIt);
        if (sc > bestScore) {
          bestScore = sc;
          bestUid = bagIt.uid;
        }
      }
      if (bestUid) {
        const res = this.equipFromBag(bestUid, classId);
        if (res.ok && res.slot) {
          const nowEq = this.equipment[res.slot];
          const nm = nowEq ? ITEMS[nowEq.defId]?.name ?? nowEq.defId : bestUid;
          equipped.push({ slot: res.slot, itemName: nm });
        }
      }
    }
    return { equipped };
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

  getActivePassives(classId?: ClassId): Set<string> {
    const set = new Set<string>();
    for (const slot of EQUIP_SLOTS) {
      const eq = this.equipment[slot];
      if (!eq) continue;
      const def = ITEMS[eq.defId];
      if (!def || (classId && !canClassEquip(def, classId))) continue;
      if (def.passiveId) set.add(def.passiveId);
    }
    return set;
  }

  getTotalEquipBonuses(classId?: ClassId): NormalizedEquipStats {
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
      const def = ITEMS[eq.defId];
      if (!def || (classId && !canClassEquip(def, classId))) continue;
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

  /** Returns active Set Bonuses for any equipped setId >= 2 pieces. */
  getActiveSetBonuses(classId?: ClassId): ActiveSetStatus[] {
    const counts: Record<string, number> = {};
    for (const slot of EQUIP_SLOTS) {
      const eq = this.equipment[slot];
      const def = eq ? ITEMS[eq.defId] : undefined;
      if (def && classId && !canClassEquip(def, classId)) continue;
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

  getActiveSetBonusStats(classId?: ClassId): NormalizedEquipStats {
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
    for (const st of this.getActiveSetBonuses(classId)) {
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
