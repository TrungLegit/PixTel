import type { EquipSlot, ItemDef, ItemInstance, Rarity, StatBonus } from "./types";
import { EQUIPMENT_ITEMS, RARITY_ENHANCE_MULT } from "./equipments";

export const RARITY_INFO: Record<
  Rarity,
  { label: string; color: string; beamPreset: string; statMult: number; enhanceMult: number }
> = {
  common: {
    label: "Thường",
    color: "#e6ecff",
    beamPreset: "beam-common",
    statMult: 1.0,
    enhanceMult: RARITY_ENHANCE_MULT.common,
  },
  uncommon: {
    label: "Hiếm Nhẹ",
    color: "#44ee88",
    beamPreset: "beam-uncommon",
    statMult: 1.25,
    enhanceMult: RARITY_ENHANCE_MULT.uncommon,
  },
  rare: {
    label: "Quý Hiếm",
    color: "#38b6ff",
    beamPreset: "beam-rare",
    statMult: 1.55,
    enhanceMult: RARITY_ENHANCE_MULT.rare,
  },
  epic: {
    label: "Sử Thi",
    color: "#c266ff",
    beamPreset: "beam-epic",
    statMult: 1.95,
    enhanceMult: RARITY_ENHANCE_MULT.epic,
  },
  legendary: {
    label: "Huyền Thoại",
    color: "#ff9922",
    beamPreset: "beam-legendary",
    statMult: 2.5,
    enhanceMult: RARITY_ENHANCE_MULT.legendary,
  },
};

export const SLOT_LABELS: Record<EquipSlot, string> = {
  helmet: "Mũ",
  armor: "Áo Giáp",
  weapon: "Vũ Khí",
  boots: "Giày",
  accessory: "Phụ Kiện",
};

export const ITEMS: Record<string, ItemDef> = {
  // === CONSUMABLES (Hotkeys 1-3) ===
  pot_hp: {
    id: "pot_hp",
    name: "Bình Máu Sắc Độ",
    category: "consumable",
    rarity: "common",
    iconColor: "#ff3366",
    iconKind: "potion",
    visualColor: "#ff3366",
    accentColor: "#ffc2d1",
    desc: "Hồi ngay 45% HP tối đa. Phím tắt [1].",
    sellPrice: 12,
    buyPrice: 25,
    consumableKind: "hp_potion",
  },
  pot_stamina: {
    id: "pot_stamina",
    name: "Tinh Chất Thể Lực",
    category: "consumable",
    rarity: "uncommon",
    iconColor: "#44ee88",
    iconKind: "potion",
    visualColor: "#44ee88",
    accentColor: "#c8ffdf",
    desc: "Hồi 100% Thể lực và +28% Tốc chạy trong 8s. Phím tắt [2].",
    sellPrice: 16,
    buyPrice: 35,
    consumableKind: "stamina_elixir",
  },
  pot_tonic: {
    id: "pot_tonic",
    name: "Dược Phẩm Quang Phổ",
    category: "consumable",
    rarity: "rare",
    iconColor: "#ffee44",
    iconKind: "potion",
    visualColor: "#ffee44",
    accentColor: "#ffffff",
    desc: "+30% ATK và +15% Tỉ lệ Crit trong 12s. Phím tắt [3].",
    sellPrice: 25,
    buyPrice: 55,
    consumableKind: "chroma_tonic",
  },

  // === MATERIALS ===
  mat_prism_shard: {
    id: "mat_prism_shard",
    name: "Mảnh Lăng Kính",
    category: "material",
    rarity: "uncommon",
    iconColor: "#5ef2ff",
    iconKind: "shard",
    visualColor: "#2cc8e8",
    accentColor: "#ffffff",
    desc: "Thu được khi phân rã trang bị trong Túi đồ. Dùng cường hóa & chế tạo.",
    sellPrice: 15,
    buyPrice: 38,
  },
  mat_glitch_core: {
    id: "mat_glitch_core",
    name: "Lõi Glitch",
    category: "material",
    rarity: "common",
    iconColor: "#ff55aa",
    iconKind: "core",
    visualColor: "#e63990",
    accentColor: "#ffb8dc",
    desc: "Rơi từ quái Glitchborn. Dùng để cường hóa và chế tạo tại Thợ Rèn.",
    sellPrice: 8,
    buyPrice: 22,
  },
  mat_iron_ore: {
    id: "mat_iron_ore",
    name: "Quặng Sắt Xám",
    category: "material",
    rarity: "common",
    iconColor: "#9aa6ba",
    iconKind: "ore",
    visualColor: "#758299",
    accentColor: "#dce4f2",
    desc: "Khai thác từ mỏ quặng. Nguyên liệu rèn vũ khí và cường hóa.",
    sellPrice: 7,
    buyPrice: 20,
  },
  mat_quartz_shard: {
    id: "mat_quartz_shard",
    name: "Mảnh Thạch Anh",
    category: "material",
    rarity: "uncommon",
    iconColor: "#4be8ff",
    iconKind: "shard",
    visualColor: "#1da3cc",
    accentColor: "#b8fbff",
    desc: "Khai thác tại Rừng Thạch Anh. Dùng chế tạo trang bị Lam & Tím.",
    sellPrice: 14,
    buyPrice: 40,
  },
  mat_amber_gem: {
    id: "mat_amber_gem",
    name: "Mảnh Hổ Phách",
    category: "material",
    rarity: "rare",
    iconColor: "#ffb833",
    iconKind: "shard",
    visualColor: "#d97818",
    accentColor: "#fff099",
    desc: "Tinh thể nóng rực từ Hầm Mỏ Hổ Phách. Dùng cường hóa cấp cao & chế tạo.",
    sellPrice: 24,
  },
  mat_void_prism: {
    id: "mat_void_prism",
    name: "Lăng Kính Hư Vô",
    category: "material",
    rarity: "epic",
    iconColor: "#c866ff",
    iconKind: "shard",
    visualColor: "#8c33d9",
    accentColor: "#f0ccff",
    desc: "Tinh thể hiếm từ Boss & Phế Tích Vô Sắc. Nguyên liệu đúc thần khí Huyền Thoại.",
    sellPrice: 55,
  },

  // === ALL 5-SLOT RPG EQUIPMENT (from equipments.ts) ===
  ...EQUIPMENT_ITEMS,
};

export const MERCHANT_STOCK = [
  "pot_hp",
  "pot_stamina",
  "pot_tonic",
  "mat_iron_ore",
  "mat_glitch_core",
  "mat_quartz_shard",
];

let uidSeq = 1;
export function createItemInstance(defId: string, qty = 1, enhanceLevel = 0): ItemInstance {
  return {
    uid: `it_${Date.now().toString(36)}_${(uidSeq++).toString(36)}`,
    defId,
    qty,
    enhanceLevel,
  };
}

export interface NormalizedEquipStats {
  atk: number;
  def: number;
  maxHp: number;
  spd: number;
  crit: number;
  elementBonus: number;
}

/** Computes effective stats of an equipment instance including rarity-weighted +0..+10 enhancement scaling. */
export function getItemEffectiveStats(inst: ItemInstance): NormalizedEquipStats {
  const def = ITEMS[inst.defId];
  const b: StatBonus = def?.baseStats ?? {};
  const rMult = def ? RARITY_INFO[def.rarity].enhanceMult : 1.0;
  const lv = Math.max(0, inst.enhanceLevel);
  const mult = 1 + lv * 0.14 * rMult;

  const baseCrit = b.critRate ?? b.crit ?? 0;
  const baseSpd = b.moveSpeed ?? b.spd ?? 0;
  const baseElem = b.elementBonus ?? 0;

  return {
    atk: Math.round((b.atk ?? 0) * mult) + (def?.slot === "weapon" ? lv * 2 : 0),
    def:
      Math.round((b.def ?? 0) * mult) +
      (def?.slot === "armor" || def?.slot === "helmet" ? lv * 1 : 0),
    maxHp:
      Math.round((b.maxHp ?? 0) * mult) +
      (def?.slot === "armor" ? lv * 8 : def?.slot === "helmet" ? lv * 5 : 0),
    spd: Math.round(baseSpd * (1 + lv * 0.06)) + (def?.slot === "boots" && lv >= 5 ? 2 : 0),
    crit: Math.round(baseCrit + (lv >= 5 ? 3 : 0) + (lv >= 8 ? 4 : 0)),
    elementBonus: Math.round(baseElem * (1 + lv * 0.08)) + (lv >= 5 && baseElem > 0 ? 2 : 0),
  };
}

/** Returns how many Prism Shards an equipment item yields when dismantled. */
export function getDismantleShardYield(inst: ItemInstance): number {
  const def = ITEMS[inst.defId];
  if (!def || def.category !== "equipment") return 0;
  const base =
    def.dismantleShards ??
    ({ common: 1, uncommon: 2, rare: 4, epic: 8, legendary: 15 }[def.rarity] || 1);
  return base + Math.floor(inst.enhanceLevel * 0.75);
}

export function pickRandomEquipByRarity(rarity: Rarity): string {
  const pool = Object.values(ITEMS).filter(
    (it) => it.category === "equipment" && it.rarity === rarity
  );
  if (pool.length === 0) return "wpn_meadow_edge";
  return pool[Math.floor(Math.random() * pool.length)].id;
}
