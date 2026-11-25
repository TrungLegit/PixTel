import type {
  ConsumableGroup,
  EquipSlot,
  ItemDef,
  ItemInstance,
  ItemTier,
  Rarity,
  StatBonus,
} from "./types";
import { EQUIPMENT_ITEMS, RARITY_ENHANCE_MULT, TIER_INFO } from "./equipments";

export const RARITY_INFO: Record<
  Rarity,
  { label: string; color: string; beamPreset: string; statMult: number; enhanceMult: number; tier: ItemTier }
> = {
  common: {
    label: "Thường",
    color: "#e6ecff",
    beamPreset: "beam-common",
    statMult: 1.0,
    enhanceMult: RARITY_ENHANCE_MULT.common,
    tier: 1,
  },
  uncommon: {
    label: "Hiếm Nhẹ",
    color: "#44ee88",
    beamPreset: "beam-uncommon",
    statMult: 1.25,
    enhanceMult: RARITY_ENHANCE_MULT.uncommon,
    tier: 2,
  },
  rare: {
    label: "Quý Hiếm",
    color: "#38b6ff",
    beamPreset: "beam-rare",
    statMult: 1.55,
    enhanceMult: RARITY_ENHANCE_MULT.rare,
    tier: 3,
  },
  epic: {
    label: "Sử Thi",
    color: "#c266ff",
    beamPreset: "beam-epic",
    statMult: 1.95,
    enhanceMult: RARITY_ENHANCE_MULT.epic,
    tier: 4,
  },
  legendary: {
    label: "Huyền Thoại",
    color: "#ff9922",
    beamPreset: "beam-legendary",
    statMult: 2.5,
    enhanceMult: RARITY_ENHANCE_MULT.legendary,
    tier: 5,
  },
};

export const SLOT_LABELS: Record<EquipSlot, string> = {
  helmet: "Mũ",
  armor: "Áo Giáp",
  weapon: "Vũ Khí",
  boots: "Giày",
  accessory: "Phụ Kiện",
};

/** 4 nhóm bình thuốc thông minh cho phím nhanh [1]..[4] */
export const CONSUMABLE_HOTKEY_GROUPS: readonly ConsumableGroup[] = [
  "hp",
  "stamina",
  "power",
  "aegis",
];

export const CONSUMABLE_GROUP_LABELS: Record<ConsumableGroup, { label: string; color: string }> = {
  hp: { label: "Máu", color: "#ff5577" },
  stamina: { label: "Thể Lực", color: "#44ee88" },
  power: { label: "Cường Công", color: "#ffee44" },
  aegis: { label: "Hộ Thuẫn", color: "#5ef2ff" },
};

export function getItemTier(def: ItemDef | undefined): ItemTier {
  if (!def) return 1;
  return def.tier ?? RARITY_INFO[def.rarity]?.tier ?? 1;
}

export function getTierBadge(def: ItemDef | undefined) {
  return TIER_INFO[getItemTier(def)];
}

export const ITEMS: Record<string, ItemDef> = {
  // =========================================================================
  // 12 VẬT PHẨM TIÊU THỤ ĐA TIER (T1 -> T5)
  // =========================================================================
  pot_hp_small: {
    id: "pot_hp_small",
    name: "Ống Máu Sơ Khai",
    category: "consumable",
    rarity: "common",
    tier: 1,
    iconColor: "#ff5577",
    iconKind: "potion",
    spriteKey: "pot_hp_t1",
    visualColor: "#e6395a",
    accentColor: "#ffc2d1",
    desc: "[T1] Hồi ngay 25% HP tối đa. Phím tắt [1].",
    sellPrice: 6,
    buyPrice: 14,
    consumableKind: "hp_potion",
    consumableSpec: { group: "hp", hpPct: 0.25 },
  },
  pot_hp: {
    id: "pot_hp",
    name: "Bình Máu Sắc Độ",
    category: "consumable",
    rarity: "uncommon",
    tier: 2,
    iconColor: "#ff3366",
    iconKind: "potion",
    spriteKey: "pot_hp_t2",
    visualColor: "#ff3366",
    accentColor: "#ffc2d1",
    desc: "[T2] Hồi ngay 45% HP tối đa. Phím tắt [1].",
    sellPrice: 12,
    buyPrice: 28,
    consumableKind: "hp_potion",
    consumableSpec: { group: "hp", hpPct: 0.45 },
  },
  pot_hp_greater: {
    id: "pot_hp_greater",
    name: "Lọ Máu Tinh Khiết",
    category: "consumable",
    rarity: "rare",
    tier: 3,
    iconColor: "#ff3870",
    iconKind: "potion",
    spriteKey: "pot_hp_t3",
    visualColor: "#ff3870",
    accentColor: "#ffffff",
    desc: "[T3] Hồi ngay 70% HP tối đa & +15% Thể lực. Phím tắt [1].",
    sellPrice: 24,
    buyPrice: 54,
    consumableKind: "hp_potion",
    consumableSpec: { group: "hp", hpPct: 0.7, staminaPct: 0.15 },
  },
  pot_hp_supreme: {
    id: "pot_hp_supreme",
    name: "Bình Sinh Mệnh Hổ Phách",
    category: "consumable",
    rarity: "epic",
    tier: 4,
    iconColor: "#ff8833",
    iconKind: "potion",
    spriteKey: "pot_hp_t4",
    visualColor: "#ff6622",
    accentColor: "#ffe699",
    desc: "[T4] Hồi đầy 100% HP & +50% Thể lực. Phím tắt [1].",
    sellPrice: 44,
    buyPrice: 98,
    consumableKind: "hp_potion",
    consumableSpec: { group: "hp", hpPct: 1.0, staminaPct: 0.5 },
  },
  pot_elixir_chroma: {
    id: "pot_elixir_chroma",
    name: "Thánh Dược Quang Phổ",
    category: "consumable",
    rarity: "legendary",
    tier: 5,
    iconColor: "#5ef2ff",
    iconKind: "potion",
    spriteKey: "pot_hp_t5",
    visualColor: "#38b6ff",
    accentColor: "#ffe066",
    desc: "[T5] Hồi 100% HP/Thể lực, giải làm chậm, +25% Nộ [Q] & 1.5s Bất tử!",
    sellPrice: 88,
    consumableKind: "hp_potion",
    consumableSpec: {
      group: "hp",
      hpPct: 1.0,
      staminaPct: 1.0,
      invulnSec: 1.5,
      overdriveGain: 25,
      cleanseSlow: true,
    },
  },

  pot_stamina_minor: {
    id: "pot_stamina_minor",
    name: "Nước Khoáng Bạc Hà",
    category: "consumable",
    rarity: "common",
    tier: 1,
    iconColor: "#44ee88",
    iconKind: "potion",
    spriteKey: "pot_sta_t1",
    visualColor: "#28b866",
    accentColor: "#c8ffdf",
    desc: "[T1] Hồi 60% Thể lực và +18% Tốc chạy trong 6s. Phím tắt [2].",
    sellPrice: 8,
    buyPrice: 18,
    consumableKind: "stamina_elixir",
    consumableSpec: { group: "stamina", staminaPct: 0.6, speedPct: 0.18, durationSec: 6 },
  },
  pot_stamina: {
    id: "pot_stamina",
    name: "Tinh Chất Thể Lực",
    category: "consumable",
    rarity: "uncommon",
    tier: 2,
    iconColor: "#44ee88",
    iconKind: "potion",
    spriteKey: "pot_sta_t2",
    visualColor: "#44ee88",
    accentColor: "#c8ffdf",
    desc: "[T2] Hồi 100% Thể lực và +28% Tốc chạy trong 8s. Phím tắt [2].",
    sellPrice: 16,
    buyPrice: 35,
    consumableKind: "stamina_elixir",
    consumableSpec: { group: "stamina", staminaPct: 1.0, speedPct: 0.28, durationSec: 8 },
  },
  pot_wind_surge: {
    id: "pot_wind_surge",
    name: "Linh Dược Thần Tốc",
    category: "consumable",
    rarity: "epic",
    tier: 4,
    iconColor: "#38f2ff",
    iconKind: "potion",
    spriteKey: "pot_sta_t4",
    visualColor: "#28c8d9",
    accentColor: "#ffffff",
    desc: "[T4] Hồi 100% Thể lực, +42% Tốc chạy 12s & +20% Nộ Tuyệt Kỹ [Q]!",
    sellPrice: 40,
    buyPrice: 88,
    consumableKind: "stamina_elixir",
    consumableSpec: {
      group: "stamina",
      staminaPct: 1.0,
      speedPct: 0.42,
      durationSec: 12,
      overdriveGain: 20,
      cleanseSlow: true,
    },
  },

  pot_might_brew: {
    id: "pot_might_brew",
    name: "Thuốc Cường Lực",
    category: "consumable",
    rarity: "uncommon",
    tier: 2,
    iconColor: "#ff9933",
    iconKind: "potion",
    spriteKey: "pot_atk_t2",
    visualColor: "#e67220",
    accentColor: "#ffe088",
    desc: "[T2] +20% ATK và +8% Tỉ lệ Crit trong 10s. Phím tắt [3].",
    sellPrice: 16,
    buyPrice: 36,
    consumableKind: "chroma_tonic",
    consumableSpec: { group: "power", atkPct: 0.2, critBonus: 8, durationSec: 10 },
  },
  pot_tonic: {
    id: "pot_tonic",
    name: "Dược Phẩm Quang Phổ",
    category: "consumable",
    rarity: "rare",
    tier: 3,
    iconColor: "#ffee44",
    iconKind: "potion",
    spriteKey: "pot_atk_t3",
    visualColor: "#ffee44",
    accentColor: "#ffffff",
    desc: "[T3] +30% ATK và +15% Tỉ lệ Crit trong 12s. Phím tắt [3].",
    sellPrice: 25,
    buyPrice: 55,
    consumableKind: "chroma_tonic",
    consumableSpec: { group: "power", atkPct: 0.3, critBonus: 15, durationSec: 12 },
  },
  pot_overdrive_vial: {
    id: "pot_overdrive_vial",
    name: "Tinh Chất Quá Tải [Q]",
    category: "consumable",
    rarity: "legendary",
    tier: 5,
    iconColor: "#ff3388",
    iconKind: "potion",
    spriteKey: "pot_atk_t5",
    visualColor: "#e6196b",
    accentColor: "#ffe066",
    desc: "[T5] Nạp +60% Nộ Tuyệt Kỹ [Q], +45% ATK & +22% Crit trong 14s!",
    sellPrice: 72,
    consumableKind: "chroma_tonic",
    consumableSpec: { group: "power", atkPct: 0.45, critBonus: 22, overdriveGain: 60, durationSec: 14 },
  },

  pot_aegis_flask: {
    id: "pot_aegis_flask",
    name: "Bình Hộ Thuẫn Pha Lê",
    category: "consumable",
    rarity: "rare",
    tier: 3,
    iconColor: "#5ef2ff",
    iconKind: "potion",
    spriteKey: "pot_def_t3",
    visualColor: "#2299e6",
    accentColor: "#c8fbff",
    desc: "[T3] Kích hoạt Khiên Lăng Kính 6s (-35% sát thương nhận & +12 DEF). Phím tắt [4].",
    sellPrice: 28,
    buyPrice: 62,
    consumableSpec: { group: "aegis", defPct: 0.35, shieldSec: 6, durationSec: 8 },
  },

  // =========================================================================
  // NGUYÊN LIỆU RÈN & CHẾ TẠO (T1 -> T5)
  // =========================================================================
  mat_iron_ore: {
    id: "mat_iron_ore",
    name: "Quặng Sắt Xám",
    category: "material",
    rarity: "common",
    tier: 1,
    iconColor: "#9aa6ba",
    iconKind: "ore",
    spriteKey: "mat_iron_ore",
    visualColor: "#758299",
    accentColor: "#dce4f2",
    desc: "Khai thác từ mỏ quặng. Nguyên liệu rèn vũ khí và cường hóa.",
    sellPrice: 7,
    buyPrice: 20,
  },
  mat_glitch_core: {
    id: "mat_glitch_core",
    name: "Lõi Glitch",
    category: "material",
    rarity: "common",
    tier: 1,
    iconColor: "#ff55aa",
    iconKind: "core",
    spriteKey: "mat_glitch_core",
    visualColor: "#e63990",
    accentColor: "#ffb8dc",
    desc: "Rơi từ quái Glitchborn. Dùng để cường hóa và chế tạo tại Thợ Rèn.",
    sellPrice: 8,
    buyPrice: 22,
  },
  mat_prism_shard: {
    id: "mat_prism_shard",
    name: "Mảnh Lăng Kính",
    category: "material",
    rarity: "uncommon",
    tier: 2,
    iconColor: "#5ef2ff",
    iconKind: "shard",
    spriteKey: "mat_prism_shard",
    visualColor: "#2cc8e8",
    accentColor: "#ffffff",
    desc: "Thu được khi phân rã trang bị trong Túi đồ. Dùng cường hóa & chế tạo.",
    sellPrice: 15,
    buyPrice: 38,
  },
  mat_quartz_shard: {
    id: "mat_quartz_shard",
    name: "Mảnh Thạch Anh",
    category: "material",
    rarity: "rare",
    tier: 3,
    iconColor: "#4be8ff",
    iconKind: "shard",
    spriteKey: "mat_quartz_shard",
    visualColor: "#1da3cc",
    accentColor: "#b8fbff",
    desc: "Khai thác tại Rừng Thạch Anh. Dùng chế tạo trang bị T3 & T4.",
    sellPrice: 14,
    buyPrice: 40,
  },
  mat_amber_gem: {
    id: "mat_amber_gem",
    name: "Mảnh Hổ Phách",
    category: "material",
    rarity: "epic",
    tier: 4,
    iconColor: "#ffb833",
    iconKind: "shard",
    spriteKey: "mat_amber_gem",
    visualColor: "#d97818",
    accentColor: "#fff099",
    desc: "Tinh thể nóng rực từ Hầm Mỏ Hổ Phách. Dùng cường hóa & rèn đồ T4–T5.",
    sellPrice: 24,
  },
  mat_void_prism: {
    id: "mat_void_prism",
    name: "Lăng Kính Hư Vô",
    category: "material",
    rarity: "legendary",
    tier: 5,
    iconColor: "#c866ff",
    iconKind: "shard",
    spriteKey: "mat_void_prism",
    visualColor: "#8c33d9",
    accentColor: "#f0ccff",
    desc: "Tinh thể cực hiếm từ Boss & Phế Tích Vô Sắc. Đúc Thần Khí Tier 5.",
    sellPrice: 55,
  },

  // === ALL 5-SLOT RPG EQUIPMENT (from equipments.ts) ===
  ...EQUIPMENT_ITEMS,
};

/** Kho hàng của Thương Nhân Mira (gồm tiêu thụ T1-T4, vũ khí T1-T2 các class & nguyên liệu) */
export const MERCHANT_STOCK = [
  "pot_hp_small",
  "pot_hp",
  "pot_hp_greater",
  "pot_hp_supreme",
  "pot_stamina_minor",
  "pot_stamina",
  "pot_wind_surge",
  "pot_might_brew",
  "pot_tonic",
  "pot_aegis_flask",
  "wpn_meadow_edge",
  "wpn_meadow_wand",
  "wpn_leaf_daggers",
  "wpn_volt_blaster",
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
