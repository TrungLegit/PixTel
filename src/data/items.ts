import type {
  ClassId,
  ClassRewardKey,
  ConsumableGroup,
  EquipSlot,
  ItemDef,
  ItemInstance,
  ItemTier,
  Rarity,
  StatBonus,
} from "./types";
import { EQUIPMENT_ITEMS, RARITY_ENHANCE_MULT, STARTER_WEAPON_BY_CLASS, TIER_INFO } from "./equipments";
import { EXOTIC_ITEMS } from "./exoticItems";
import { GACHA_KEY_ITEMS, SEASONAL_ITEMS } from "./gacha";
import { HIDDEN_ITEMS } from "./hiddenItems";

export const CLASS_DISPLAY_NAMES: Record<ClassId, string> = {
  prism_knight: "Vệ Binh Lăng Kính",
  chroma_mage: "Pháp Sư Sắc Độ",
  bit_rogue: "Sát Thủ Điểm Ảnh",
  pixel_tinker: "Kỹ Sư Mạch Sáng",
};

export function resolveClassReward(classId: ClassId, key: ClassRewardKey): string {
  switch (key) {
    case "starter_weapon":
      return STARTER_WEAPON_BY_CLASS[classId] ?? "wpn_starter";
    case "meadow_weapon":
      return classId === "chroma_mage"
        ? "wpn_meadow_wand"
        : classId === "bit_rogue"
          ? "wpn_leaf_daggers"
          : classId === "pixel_tinker"
            ? "wpn_volt_blaster"
            : "wpn_meadow_edge";
    case "quartz_weapon":
      return classId === "chroma_mage"
        ? "wpn_chroma_scepter"
        : classId === "bit_rogue"
          ? "wpn_glitch_fangs"
          : classId === "pixel_tinker"
            ? "wpn_pulse_carbine"
            : "wpn_prism_halberd";
    case "amber_weapon":
      return classId === "chroma_mage"
        ? "wpn_amber_staff"
        : classId === "bit_rogue"
          ? "wpn_magma_fangs"
          : classId === "pixel_tinker"
            ? "wpn_thermal_repeater"
            : "wpn_amber_fury";
    case "ruins_weapon":
      return classId === "chroma_mage"
        ? "wpn_astral_scepter"
        : classId === "bit_rogue"
          ? "wpn_quantum_blades"
          : classId === "pixel_tinker"
            ? "wpn_singularity_cannon"
            : "wpn_chroma_sovereign";
  }
}

export function canClassEquip(def: ItemDef, classId: ClassId): boolean {
  if (def.category !== "equipment") return false;
  if (def.slot === "weapon") {
    if (def.requiredClass && def.requiredClass !== "all") {
      return def.requiredClass === classId;
    }
    // Defense-in-depth: weapons NEVER bypass class lock even if requiredClass is omitted or "all"
    if (def.iconKind === "staff") return classId === "chroma_mage";
    if (def.iconKind === "dagger") return classId === "bit_rogue";
    if (def.iconKind === "gun") return classId === "pixel_tinker";
    return classId === "prism_knight";
  }
  if (!def.requiredClass || def.requiredClass === "all") return true;
  return def.requiredClass === classId;
}

export const RARITY_INFO: Record<
  Rarity,
  { label: string; color: string; beamPreset: string; statMult: number; enhanceMult: number; tier: ItemTier }
> = {
  common: {
    label: "Thường",
    color: "#cbd5e1",
    beamPreset: "beam-common",
    statMult: 1.0,
    enhanceMult: RARITY_ENHANCE_MULT.common,
    tier: 1,
  },
  uncommon: {
    label: "Hiếm Nhẹ",
    color: "#4ade80",
    beamPreset: "beam-uncommon",
    statMult: 1.25,
    enhanceMult: RARITY_ENHANCE_MULT.uncommon,
    tier: 2,
  },
  rare: {
    label: "Quý Hiếm",
    color: "#60a5fa",
    beamPreset: "beam-rare",
    statMult: 1.55,
    enhanceMult: RARITY_ENHANCE_MULT.rare,
    tier: 3,
  },
  epic: {
    label: "Sử Thi",
    color: "#c084fc",
    beamPreset: "beam-epic",
    statMult: 1.95,
    enhanceMult: RARITY_ENHANCE_MULT.epic,
    tier: 4,
  },
  cursed: {
    label: "Nguyền Rủa",
    color: "#f43f5e",
    beamPreset: "beam-cursed",
    statMult: 2.1,
    enhanceMult: RARITY_ENHANCE_MULT.cursed,
    tier: 4,
  },
  legendary: {
    label: "Huyền Thoại",
    color: "#facc15",
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
  pot_coating: {
    id: "pot_coating",
    name: "Dầu Phủ Quang Phổ",
    category: "consumable",
    rarity: "rare",
    tier: 4,
    iconColor: "#ff66d8",
    iconKind: "potion",
    visualColor: "#e639b8",
    accentColor: "#78f9ff",
    desc: "[T4] Phủ nguyên tố xoay vòng lên mọi đòn đánh & +20% Sát thương Nguyên Tố trong 25s. Phím tắt [4].",
    sellPrice: 28,
    buyPrice: 60,
    consumableKind: "chroma_coating",
    consumableSpec: { group: "aegis", durationSec: 25 },
  },
  charm_undying: {
    id: "charm_undying",
    name: "Bùa Hộ Mệnh Bất Diệt",
    category: "consumable",
    rarity: "epic",
    tier: 4,
    iconColor: "#ffe066",
    iconKind: "totem",
    visualColor: "#f0b429",
    accentColor: "#44ee88",
    desc: "Để trong Túi sẽ tự vỡ khi chịu đòn chí tử: chặn cái chết, hồi ngay 40% HP, 100% Thể lực & bất tử 1.5s!",
    sellPrice: 65,
    buyPrice: 160,
    consumableKind: "undying_charm",
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

  // --- 4 Chroma Pigments (for +5 Elemental Infusion at Prism Forge) ---
  mat_pigment_red: {
    id: "mat_pigment_red",
    name: "Bột Chu Sa Lửa",
    category: "material",
    rarity: "rare",
    iconColor: "#ff4433",
    iconKind: "pigment",
    visualColor: "#e63222",
    accentColor: "#ffaa66",
    pigmentElement: "fire",
    desc: "Sắc tố Đỏ tinh luyện. Dùng tại Lò Rèn để nhuộm hệ LỬA cho trang bị từ +5 trở lên.",
    sellPrice: 22,
    buyPrice: 65,
  },
  mat_pigment_cyan: {
    id: "mat_pigment_cyan",
    name: "Bột Lam Băng Tinh",
    category: "material",
    rarity: "rare",
    iconColor: "#38e8ff",
    iconKind: "pigment",
    visualColor: "#1cb8e0",
    accentColor: "#c8fbff",
    pigmentElement: "ice",
    desc: "Sắc tố Lam tinh luyện. Dùng tại Lò Rèn để nhuộm hệ BĂNG cho trang bị từ +5 trở lên.",
    sellPrice: 22,
    buyPrice: 65,
  },
  mat_pigment_green: {
    id: "mat_pigment_green",
    name: "Bột Lục Bào Tử",
    category: "material",
    rarity: "rare",
    iconColor: "#44ee88",
    iconKind: "pigment",
    visualColor: "#24b862",
    accentColor: "#b8ffd8",
    pigmentElement: "nature",
    desc: "Sắc tố Lục tinh luyện. Dùng tại Lò Rèn để nhuộm hệ MỘC/ĐỘC cho trang bị từ +5 trở lên.",
    sellPrice: 22,
    buyPrice: 65,
  },
  mat_pigment_gold: {
    id: "mat_pigment_gold",
    name: "Bột Hoàng Quang Điện",
    category: "material",
    rarity: "rare",
    tier: 3,
    iconColor: "#ffee44",
    iconKind: "pigment",
    visualColor: "#e6b81c",
    accentColor: "#ffffff",
    pigmentElement: "volt",
    desc: "Sắc tố Lôi tinh luyện. Dùng tại Lò Rèn để nhuộm hệ LÔI cho trang bị +5 (+8% ELEM, -5% CD [E]).",
    sellPrice: 22,
    buyPrice: 65,
  },
  mat_pigment_void: {
    id: "mat_pigment_void",
    name: "Bột Hắc Tinh Hư Không",
    category: "material",
    rarity: "epic",
    tier: 4,
    iconColor: "#b266ff",
    iconKind: "pigment",
    visualColor: "#7a2ce0",
    accentColor: "#f0ccff",
    pigmentElement: "void",
    desc: "Sắc tố Hư Không cô đặc. Dùng tại Lò Rèn để nhuộm hệ HƯ KHÔNG cho trang bị +5 (+8% ELEM, -6% CD [E], hút/xóa buff).",
    sellPrice: 28,
    buyPrice: 80,
  },
  mat_pigment_chroma: {
    id: "mat_pigment_chroma",
    name: "Bột Tinh Quang Sắc Độ",
    category: "material",
    rarity: "epic",
    tier: 4,
    iconColor: "#ff66c4",
    iconKind: "pigment",
    visualColor: "#e0389e",
    accentColor: "#ffe066",
    pigmentElement: "chroma",
    desc: "Sắc tố Thất Sắc tinh khiết. Nhuộm hệ SẮC ĐỘ cho trang bị +5 (+12% ELEM & đánh trúng hồi Stamina/HP).",
    sellPrice: 30,
    buyPrice: 85,
  },
  mat_pigment_wind: {
    id: "mat_pigment_wind",
    name: "Bột Phong Linh Ngọc",
    category: "material",
    rarity: "rare",
    tier: 3,
    iconColor: "#5ef2d6",
    iconKind: "pigment",
    visualColor: "#24b89e",
    accentColor: "#e0fff9",
    pigmentElement: "wind",
    desc: "Sắc tố Phong Linh. Nhuộm hệ GIÓ cho trang bị +5 (+8% ELEM, +6 SPD, +8 Thể lực & khuếch tán nguyên tố).",
    sellPrice: 24,
    buyPrice: 70,
  },
  mat_pigment_quake: {
    id: "mat_pigment_quake",
    name: "Bột Địa Chấn Nham",
    category: "material",
    rarity: "rare",
    tier: 3,
    iconColor: "#ff9933",
    iconKind: "pigment",
    visualColor: "#cc6614",
    accentColor: "#ffe28a",
    pigmentElement: "quake",
    desc: "Sắc tố Địa Mạch. Nhuộm hệ CHẤN ĐỘNG cho trang bị +5 (+8% ELEM, +15% lực phá Bleach Shield Boss).",
    sellPrice: 25,
    buyPrice: 72,
  },

  // --- 4 Boss Cores ---
  mat_warden_crest: {
    id: "mat_warden_crest",
    name: "Ấn Chiến Thần Vệ Thạch",
    category: "material",
    rarity: "rare",
    iconColor: "#66ccff",
    iconKind: "core",
    visualColor: "#3b78ad",
    accentColor: "#ffe066",
    desc: "Chiến ấn rơi từ Boss Hình Thiên Vệ Thạch (Đồng Cỏ Xám). Dùng rèn Đại Phủ & Dây Chuyền.",
    sellPrice: 45,
  },
  mat_crystal_heart: {
    id: "mat_crystal_heart",
    name: "Trái Tim Pha Lê Lạnh",
    category: "material",
    rarity: "epic",
    iconColor: "#4be8ff",
    iconKind: "shard",
    visualColor: "#1a9cd6",
    accentColor: "#ffffff",
    desc: "Kết tinh tinh khiết từ Boss Cổ Thụ Blight Root. Dùng chế tạo Cổ Thư & trang bị Tím.",
    sellPrice: 70,
  },
  mat_amber_fang: {
    id: "mat_amber_fang",
    name: "Nanh Cùng Kỳ Hổ Phách",
    category: "material",
    rarity: "epic",
    iconColor: "#ff9922",
    iconKind: "shard",
    visualColor: "#d95b16",
    accentColor: "#ffee66",
    desc: "Chiếc nanh nóng rực của Boss Gilded Null. Dùng đúc Đĩa Quang Phổ & trang bị Huyền Thoại.",
    sellPrice: 90,
  },
  mat_origin_star: {
    id: "mat_origin_star",
    name: "Ngôi Sao Khởi Nguyên",
    category: "material",
    rarity: "legendary",
    iconColor: "#ff9922",
    iconKind: "shard",
    visualColor: "#ffe066",
    accentColor: "#78f9ff",
    desc: "Mảnh lõi Thất Sắc giải phóng sau khi thanh tẩy World Boss The Eraser!",
    sellPrice: 220,
  },

  // === ALL 5-SLOT RPG EQUIPMENT (from equipments.ts) ===
  ...EQUIPMENT_ITEMS,

  // === EXCLUSIVE HIDDEN ITEMS (craft_only & boss_only) ===
  ...HIDDEN_ITEMS,

  // === V3.0 EXOTIC SKILL-ALTERING GEAR (MOB/BOSS DROP ONLY) ===
  ...EXOTIC_ITEMS,

  // === V3.0 BIOME GACHA KEYS & SEASONAL GACHA EXCLUSIVES ===
  ...GACHA_KEY_ITEMS,
  ...SEASONAL_ITEMS,
};

// =========================================================================
// 6 NGUYÊN LIỆU RƠI TỪ BOSS / ZONE & 16 VẬT PHẨM CỐT LÕI (SPRITESHEET 4x4)
// =========================================================================
export const CORE_MATERIALS: Record<string, ItemDef> = {
  mat_ancient_sap: {
    id: "mat_ancient_sap",
    name: "Nhựa Cổ Thụ Ngàn Năm",
    category: "material",
    rarity: "uncommon",
    tier: 2,
    iconColor: "#4ade80",
    iconKind: "pigment",
    spriteKey: "core_mat_ancient_sap",
    visualColor: "#22c55e",
    accentColor: "#bbf7d0",
    desc: "Nhựa sống kết tinh từ rễ cây Đồng Cỏ Xám. Dùng rèn trang bị Bộ Rừng Sương Mù.",
    sellPrice: 18,
  },
  mat_elder_core: {
    id: "mat_elder_core",
    name: "Lõi Rễ Cổ Vùng 2",
    category: "material",
    rarity: "rare",
    tier: 3,
    iconColor: "#60a5fa",
    iconKind: "core",
    spriteKey: "core_mat_elder_core",
    visualColor: "#3b82f6",
    accentColor: "#a7f3d0",
    desc: "Lõi năng lượng rơi từ Boss Vùng 2 Rừng Thạch Anh (Blight Root). Dùng giải mã Thánh Kiếm Sao Rơi.",
    sellPrice: 65,
  },
  mat_blood_shard: {
    id: "mat_blood_shard",
    name: "Mảnh Huyết Thạch",
    category: "material",
    rarity: "epic",
    tier: 4,
    iconColor: "#c084fc",
    iconKind: "shard",
    spriteKey: "core_mat_blood_shard",
    visualColor: "#e11d48",
    accentColor: "#fecdd3",
    desc: "Tinh thể đỏ thẫm rỉ ra từ mạch máu cổ trong Hầm Mỏ & Phế Tích.",
    sellPrice: 48,
  },
  mat_eclipse_coal: {
    id: "mat_eclipse_coal",
    name: "Than Lò Nhật Thực",
    category: "material",
    rarity: "rare",
    tier: 3,
    iconColor: "#fb923c",
    iconKind: "ore",
    spriteKey: "core_mat_eclipse_coal",
    visualColor: "#ea580c",
    accentColor: "#fde047",
    desc: "Viên than nóng bỏng không bao giờ tàn từ Tâm Lò Hổ Phách.",
    sellPrice: 36,
  },
  mat_meteor_shard: {
    id: "mat_meteor_shard",
    name: "Mảnh Đá Sao Rơi",
    category: "material",
    rarity: "legendary",
    tier: 5,
    iconColor: "#facc15",
    iconKind: "shard",
    spriteKey: "core_mat_meteor_shard",
    visualColor: "#eab308",
    accentColor: "#fef08a",
    desc: "Thiên thạch rơi ngoài bầu trời. Nguyên liệu cốt lõi đúc lại Thánh Kiếm Sao Rơi.",
    sellPrice: 140,
  },
  mat_eclipse_heart: {
    id: "mat_eclipse_heart",
    name: "Trái Tim Nhật Thực",
    category: "material",
    rarity: "legendary",
    tier: 5,
    iconColor: "#c084fc",
    iconKind: "core",
    spriteKey: "core_mat_eclipse_heart",
    visualColor: "#9333ea",
    accentColor: "#f43f5e",
    desc: "Lõi nhịp đập Nhật Thực từ World Boss The Eraser. Dùng rèn Chiến Giáp Vệ Binh Bất Diệt.",
    sellPrice: 180,
  },
};

export const CORE_16_ITEMS: Record<string, ItemDef> = {
  // === HÀNG 1 & 2: 6 VŨ KHÍ CỐT LÕI ===
  wp_vanguard_chipped: {
    id: "wp_vanguard_chipped",
    name: "Kiếm Sứt Mẻ Vệ Binh",
    category: "equipment",
    rarity: "common",
    tier: 1,
    slot: "weapon",
    iconKind: "sword",
    spriteKey: "core_wp_vanguard_chipped",
    spritesheetCell: [1, 1],
    paperDollKey: "wpn_sword_t1",
    iconColor: "#cbd5e1",
    visualColor: "#94a3b8",
    accentColor: "#e2e8f0",
    visualStyle: { outline: "#1a1625", primary: "#94a3b8", accent: "#e2e8f0", shape: "blade" },
    requiredClass: "prism_knight",
    weaponSkillId: "ws_shield_bash",
    biomeTheme: "town",
    dismantleShards: 1,
    desc: "Thanh kiếm thép sứt ba vết lớn — vật mồi mở khóa công thức ẩn khi hạ Boss Vùng 2.",
    lore: "Lưỡi thép mẻ ba vết lớn nhưng phần chuôi vẫn ấm hơi lửa cũ.",
    sellPrice: 20,
    buyPrice: 45,
    baseStats: { atk: 7 },
  },
  wp_briar_dagger: {
    id: "wp_briar_dagger",
    name: "Dao Găm Gai Rừng",
    category: "equipment",
    rarity: "rare",
    tier: 3,
    slot: "weapon",
    iconKind: "dagger",
    spriteKey: "core_wp_briar_dagger",
    spritesheetCell: [1, 2],
    paperDollKey: "wpn_dagger_t3",
    iconColor: "#60a5fa",
    visualColor: "#4ade80",
    accentColor: "#c084fc",
    visualStyle: { outline: "#1a1625", primary: "#4ade80", accent: "#c084fc", shape: "daggers" },
    requiredClass: "bit_rogue",
    weaponSkillId: "ws_venom_flurry",
    biomeTheme: "meadow",
    setId: "set_forest",
    dismantleShards: 5,
    passive: {
      id: "bleed_crit",
      name: "Gai Độc Chảy Máu",
      trigger: "onCrit",
      description: "Đòn chí mạng gây chảy máu 4% ATK/s trong 3s (tối đa 3 cộng dồn).",
    },
    passiveDesc: "Gai Độc Chảy Máu: Đòn chí mạng gây chảy máu 4% ATK/s trong 3s (tối đa 3 cộng dồn).",
    desc: "Dao găm tẩm gai tầm gửi rừng sâu, tích tầng chảy máu cực nhanh khi chí mạng.",
    lore: "Thợ săn Rừng Sương Mù từng vót gai tầm gửi cổ để săn lũ sói bóng đêm.",
    sellPrice: 95,
    baseStats: { atk: 12, aspdPct: 12 },
  },
  wp_spark_staff: {
    id: "wp_spark_staff",
    name: "Trượng Lôi Đình Tí Hon",
    category: "equipment",
    rarity: "rare",
    tier: 3,
    slot: "weapon",
    iconKind: "staff",
    spriteKey: "core_wp_spark_staff",
    spritesheetCell: [1, 3],
    paperDollKey: "wpn_staff_t3",
    iconColor: "#60a5fa",
    visualColor: "#38bdf8",
    accentColor: "#fde047",
    visualStyle: { outline: "#1a1625", primary: "#38bdf8", accent: "#fde047", shape: "staff" },
    requiredClass: "chroma_mage",
    weaponSkillId: "ws_thunder_smite",
    biomeTheme: "quartz",
    dismantleShards: 5,
    passive: {
      id: "chain_lightning",
      name: "Sét Dây Chuyền",
      trigger: "onHit",
      description: "Mỗi đòn thứ 3 phóng sét nảy 2 mục tiêu gần nhất (50% DMG).",
    },
    passiveDesc: "Sét Dây Chuyền: Mỗi đòn thứ 3 phóng sét nảy 2 mục tiêu gần nhất (50% DMG).",
    desc: "Quyền trượng sồi tí hon phóng tia sét nảy giữa nhiều kẻ địch.",
    lore: "Tiện từ cành sồi bị sét đánh ba lần mà chẳng cháy. Đầu trượng luôn kêu lách tách.",
    sellPrice: 105,
    baseStats: { mag: 16, aspdPct: 10 },
  },
  wp_eclipse_reaver: {
    id: "wp_eclipse_reaver",
    name: "Lưỡi Hái Nhật Thực",
    category: "equipment",
    rarity: "epic",
    tier: 4,
    slot: "weapon",
    iconKind: "dagger",
    spriteKey: "core_wp_eclipse_reaver",
    spritesheetCell: [1, 4],
    paperDollKey: "wpn_dagger_t4",
    iconColor: "#c084fc",
    visualColor: "#e11d48",
    accentColor: "#c084fc",
    visualStyle: { outline: "#1a1625", primary: "#e11d48", accent: "#c084fc", shape: "daggers" },
    requiredClass: "bit_rogue",
    weaponSkillId: "ws_reaper_hook",
    biomeTheme: "ruins",
    setId: "set_eclipse",
    dismantleShards: 10,
    passive: {
      id: "eclipse_lifesteal",
      name: "Huyết Thực Nhật Thực",
      trigger: "onHit",
      description: "Hút 8% máu; mỗi đòn thứ 4 chém lan hình bán nguyệt.",
    },
    passiveDesc: "Huyết Thực Nhật Thực: Hút 8% máu; mỗi đòn thứ 4 chém lan hình bán nguyệt.",
    desc: "Lưỡi hái cong hút sinh lực đối thủ và quét bán nguyệt ở đòn thứ 4.",
    lore: "Vũ khí giữ mạng cho chủ nhân, nhưng bắt họ phải liên tục tắm trong giao tranh.",
    sellPrice: 210,
    baseStats: { atk: 30, def: -5, lifestealPct: 8 },
  },
  wp_forge_hammer: {
    id: "wp_forge_hammer",
    name: "Búa Tạ Lò Nung",
    category: "equipment",
    rarity: "epic",
    tier: 4,
    slot: "weapon",
    iconKind: "axe",
    spriteKey: "core_wp_forge_hammer",
    spritesheetCell: [2, 1],
    paperDollKey: "wpn_sword_t4",
    iconColor: "#c084fc",
    visualColor: "#ea580c",
    accentColor: "#facc15",
    visualStyle: { outline: "#1a1625", primary: "#ea580c", accent: "#facc15", shape: "greatsword" },
    requiredClass: "prism_knight",
    weaponSkillId: "ws_tectonic_slam",
    biomeTheme: "amber",
    setId: "set_forge",
    dismantleShards: 10,
    passive: {
      id: "quake_stun",
      name: "Nện Lò Chấn Động",
      trigger: "onHit",
      description: "Đòn thứ 4 đập đất làm choáng 1s bán kính 48px.",
    },
    passiveDesc: "Nện Lò Chấn Động: Đòn thứ 4 đập đất làm choáng 1s bán kính 48px.",
    desc: "Búa tạ nặng nề nhưng cú đập thứ tư nghiền nát và làm choáng toàn bộ vùng xung quanh.",
    lore: "Trước khi hóa điên, Thợ Rèn từng dùng nó đúc giáp cho cả đội cận vệ.",
    sellPrice: 205,
    baseStats: { atk: 26, moveSpeedPct: -8 },
  },
  wp_starfall_blade: {
    id: "wp_starfall_blade",
    name: "Thánh Kiếm Sao Rơi",
    category: "equipment",
    rarity: "legendary",
    tier: 5,
    slot: "weapon",
    iconKind: "sword",
    spriteKey: "core_wp_starfall_blade",
    spritesheetCell: [2, 2],
    paperDollKey: "wpn_sword_t5",
    iconColor: "#facc15",
    visualColor: "#facc15",
    accentColor: "#fef08a",
    visualStyle: { outline: "#1a1625", primary: "#facc15", accent: "#fef08a", shape: "sovereign" },
    requiredClass: "prism_knight",
    weaponSkillId: "ws_seven_prism_arc",
    biomeTheme: "ruins",
    dismantleShards: 18,
    isHidden: true,
    hiddenSource: "craft_only",
    hiddenHint: "Mang Kiếm Sứt Mẻ Vệ Binh trong túi khi hạ Boss Vùng 2 (Blight Root) để mở khóa bản vẽ ẩn.",
    passive: {
      id: "starfall_crit",
      name: "Sao Rơi Phán Quyết",
      trigger: "onCrit",
      cooldownSec: 6,
      description: "Chí mạng gọi sao rơi gây 140% ATK AoE (CD 6s).",
    },
    passiveDesc: "Sao Rơi Phán Quyết: Chí mạng gọi sao rơi gây 140% ATK AoE (CD 6s).",
    desc: "[Công Thức Ẩn] Thánh kiếm được rèn lại từ Kiếm Sứt Mẻ Vệ Binh và thiên thạch bầu trời.",
    lore: "Đúc lại từ thanh kiếm vỡ của Vệ Binh và đá ngoài bầu trời. Lời thề cũ nay đã trọn vẹn.",
    sellPrice: 460,
    baseStats: { atk: 46, critRate: 15 },
  },

  // === HÀNG 2 & 3: 6 MŨ & GIÁP CỐT LÕI ===
  ar_briar_cloak: {
    id: "ar_briar_cloak",
    name: "Áo Choàng Gai Cổ Thụ",
    category: "equipment",
    rarity: "rare",
    tier: 3,
    slot: "armor",
    iconKind: "armor",
    spriteKey: "core_ar_briar_cloak",
    spritesheetCell: [2, 3],
    paperDollKey: "armor_t2",
    capeKey: "cape_t2",
    iconColor: "#60a5fa",
    visualColor: "#22c55e",
    accentColor: "#a3e635",
    visualStyle: { outline: "#1a1625", primary: "#22c55e", accent: "#a3e635", shape: "mantle" },
    requiredClass: "all",
    biomeTheme: "meadow",
    setId: "set_forest",
    dismantleShards: 5,
    passive: {
      id: "thorns_regen",
      name: "Gai Phản & Hồi Sinh",
      trigger: "onTakeDamage",
      description: "Phản 20% sát thương cận chiến; đứng yên 3s hồi 2% HP/s.",
    },
    passiveDesc: "Gai Phản & Hồi Sinh: Phản 20% sát thương cận chiến; đứng yên 3s hồi 2% HP/s.",
    desc: "Áo choàng dệt từ rễ sống phản sát thương cận chiến và tự hồi phục khi đứng yên.",
    lore: "Rễ cây vẫn sống trong thớ vải, bảo vệ kẻ mặc như bảo vệ hạt mầm cuối cùng.",
    sellPrice: 110,
    baseStats: { def: 14, maxHp: 35 },
  },
  ar_bloodstone_plate: {
    id: "ar_bloodstone_plate",
    name: "Giáp Huyết Thạch",
    category: "equipment",
    rarity: "epic",
    tier: 4,
    slot: "armor",
    iconKind: "armor",
    spriteKey: "core_ar_bloodstone_plate",
    spritesheetCell: [2, 4],
    paperDollKey: "armor_t4",
    iconColor: "#c084fc",
    visualColor: "#be123c",
    accentColor: "#fb7185",
    visualStyle: { outline: "#1a1625", primary: "#be123c", accent: "#fb7185", shape: "plate" },
    requiredClass: "all",
    biomeTheme: "amber",
    setId: "set_eclipse",
    dismantleShards: 10,
    passive: {
      id: "blood_shield",
      name: "Khiên Huyết Thạch",
      trigger: "onKill",
      description: "Hạ quái nhận khiên 5% MaxHP (tối đa 3 lớp, 10s).",
    },
    passiveDesc: "Khiên Huyết Thạch: Hạ quái nhận khiên 5% MaxHP (tối đa 3 lớp, 10s).",
    desc: "Giáp nặng kết tinh từ huyết thạch sống, tích lũy lớp giáp máu sau mỗi mạng hạ gục.",
    lore: "Mỏ đá từng giàu có nhất vương quốc, cho đến khi nó bắt đầu biết 'thở'.",
    sellPrice: 220,
    baseStats: { def: 24, maxHp: 65 },
  },
  hm_moss_hood: {
    id: "hm_moss_hood",
    name: "Mũ Trùm Rêu Phong",
    category: "equipment",
    rarity: "uncommon",
    tier: 2,
    slot: "helmet",
    iconKind: "helmet",
    spriteKey: "core_hm_moss_hood",
    spritesheetCell: [3, 1],
    paperDollKey: "helmet_t2",
    iconColor: "#4ade80",
    visualColor: "#16a34a",
    accentColor: "#86efac",
    visualStyle: { outline: "#1a1625", primary: "#16a34a", accent: "#86efac", shape: "hood" },
    requiredClass: "all",
    biomeTheme: "meadow",
    setId: "set_forest",
    dismantleShards: 2,
    passive: {
      id: "stealth_range",
      name: "Ẩn Thân Rêu Xanh",
      trigger: "passive",
      description: "Giảm 25% tầm phát hiện của quái.",
    },
    passiveDesc: "Ẩn Thân Rêu Xanh: Giảm 25% tầm phát hiện của quái.",
    desc: "Mũ trùm phủ rêu giúp ngụy trang tự nhiên và giảm tầm phát hiện của quái vật.",
    lore: "Đủ ẩm để giữ mát, đủ tối để ẩn mình khỏi ánh mắt của Rễ Cổ.",
    sellPrice: 48,
    baseStats: { def: 5, maxHp: 15 },
  },
  hm_ash_visor: {
    id: "hm_ash_visor",
    name: "Mũ Sắt Lò Tro",
    category: "equipment",
    rarity: "rare",
    tier: 3,
    slot: "helmet",
    iconKind: "helmet",
    spriteKey: "core_hm_ash_visor",
    spritesheetCell: [3, 2],
    paperDollKey: "helmet_t3",
    iconColor: "#60a5fa",
    visualColor: "#475569",
    accentColor: "#fb923c",
    visualStyle: { outline: "#1a1625", primary: "#475569", accent: "#fb923c", shape: "visor" },
    requiredClass: "all",
    biomeTheme: "amber",
    setId: "set_forge",
    dismantleShards: 5,
    passive: {
      id: "burn_immune",
      name: "Miễn Nhiễm Tro Lửa",
      trigger: "passive",
      description: "Miễn nhiễm Thiêu Đốt.",
    },
    passiveDesc: "Miễn nhiễm Tro Lửa: Miễn nhiễm Thiêu Đốt.",
    desc: "Mũ sắt ám muội từ tâm lò rèn, miễn nhiễm hoàn toàn hiệu ứng thiêu đốt.",
    lore: "Tấm che mặt ám muội đen đặc — dấu ấn của những kẻ từng bước vào tâm lò.",
    sellPrice: 92,
    baseStats: { def: 12, fireResPct: 15 },
  },
  hm_eclipse_crown: {
    id: "hm_eclipse_crown",
    name: "Vương Miện Nhật Thực Vỡ",
    category: "equipment",
    rarity: "legendary",
    tier: 5,
    slot: "helmet",
    iconKind: "helmet",
    spriteKey: "core_hm_eclipse_crown",
    spritesheetCell: [3, 3],
    paperDollKey: "helmet_t5",
    iconColor: "#facc15",
    visualColor: "#9333ea",
    accentColor: "#facc15",
    visualStyle: { outline: "#1a1625", primary: "#9333ea", accent: "#facc15", shape: "crown" },
    requiredClass: "all",
    biomeTheme: "ruins",
    setId: "set_eclipse",
    dismantleShards: 18,
    isHidden: true,
    hiddenSource: "boss_only",
    sourceBossId: "boss_the_eraser",
    hiddenDropChance: 0.05,
    hiddenHint: "Rơi tỉ lệ hiếm 5% khi đánh bại World Boss The Eraser tại Phế Tích Vô Sắc.",
    passive: {
      id: "eclipse_slow",
      name: "Hàn Ánh Nhật Thực",
      trigger: "onLowHp",
      cooldownSec: 25,
      description: "Khi HP < 35%, làm chậm quái xung quanh 40% trong 4s (CD 25s).",
    },
    passiveDesc: "Hàn Ánh Nhật Thực: Khi HP < 35%, làm chậm quái xung quanh 40% trong 4s (CD 25s).",
    desc: "[Boss Only 5%] Vương miện gãy đôi tỏa khí lạnh đóng băng bước tiến quân địch khi nguy kịch.",
    lore: "Một nửa bị cháy xém bởi ánh mặt trời, nửa còn lại lạnh buốt như hư không.",
    sellPrice: 440,
    baseStats: { def: 18, mag: 20, lifestealPct: 10 },
  },
  ar_aegis_mantle: {
    id: "ar_aegis_mantle",
    name: "Chiến Giáp Vệ Binh Bất Diệt",
    category: "equipment",
    rarity: "legendary",
    tier: 5,
    slot: "armor",
    iconKind: "armor",
    spriteKey: "core_ar_aegis_mantle",
    spritesheetCell: [3, 4],
    paperDollKey: "armor_t5",
    capeKey: "cape_t5",
    iconColor: "#facc15",
    visualColor: "#e2e8f0",
    accentColor: "#facc15",
    visualStyle: { outline: "#1a1625", primary: "#e2e8f0", accent: "#facc15", shape: "aegis" },
    requiredClass: "all",
    biomeTheme: "ruins",
    dismantleShards: 18,
    isHidden: true,
    hiddenSource: "craft_only",
    hiddenHint: "Sở hữu đồng thời Giáp Huyết Thạch và Áo Choàng Gai Cổ Thụ để mở khóa công thức ẩn.",
    passive: {
      id: "undying_wall",
      name: "Thành Lũy Bất Diệt",
      trigger: "onTakeDamage",
      cooldownSec: 45,
      description: "1 lần/45s, chặn đòn tử vong giữ lại 1 HP và bất tử 2s.",
    },
    passiveDesc: "Thành Lũy Bất Diệt: 1 lần/45s, chặn đòn tử vong giữ lại 1 HP và bất tử 2s.",
    desc: "[Công Thức Ẩn] Bạch kim chiến giáp tối thượng chặn đứng đòn tử vong cho người bảo vệ cổng thành.",
    lore: "Kẻ gác cổng không bao giờ ngã xuống khi cánh cửa phía sau vẫn còn mở.",
    sellPrice: 470,
    baseStats: { def: 36, maxHp: 110 },
  },

  // === HÀNG 4: 4 TRANG SỨC & TIÊU HAO CỐT LÕI ===
  ac_ember_crest: {
    id: "ac_ember_crest",
    name: "Huy Hiệu Tro Tàn",
    category: "equipment",
    rarity: "rare",
    tier: 3,
    slot: "accessory",
    iconKind: "amulet",
    spriteKey: "core_ac_ember_crest",
    spritesheetCell: [4, 1],
    paperDollKey: "acc_ring_t3",
    iconColor: "#60a5fa",
    visualColor: "#f97316",
    accentColor: "#fde047",
    visualStyle: { outline: "#1a1625", primary: "#f97316", accent: "#fde047", shape: "ring_orb" },
    requiredClass: "all",
    biomeTheme: "amber",
    setId: "set_forge",
    dismantleShards: 5,
    passive: {
      id: "ember_nova",
      name: "Bùng Nổ Tro Tàn",
      trigger: "onLowHp",
      cooldownSec: 30,
      description: "Khi HP < 30%, nổ lửa đẩy lùi quái + tạo khiên 20% MaxHP (CD 30s).",
    },
    passiveDesc: "Bùng Nổ Tro Tàn: Khi HP < 30%, nổ lửa đẩy lùi quái + tạo khiên 20% MaxHP (CD 30s).",
    desc: "Mặt dây chuyền giữ than hồng thế kỷ, tự kích nổ bảo hộ chủ nhân khi máu xuống thấp.",
    lore: "Lớp tro bên trong chưa bao giờ nguội suốt ba thế kỷ, chỉ chờ cơn nguy kịch để bùng lên.",
    sellPrice: 100,
    baseStats: { atk: 8, fireResPct: 10 },
  },
  ac_cracked_pact: {
    id: "ac_cracked_pact",
    name: "Nhẫn Giao Ước Rạn Nứt",
    category: "equipment",
    rarity: "cursed",
    tier: 4,
    slot: "accessory",
    iconKind: "accessory",
    spriteKey: "core_ac_cracked_pact",
    spritesheetCell: [4, 2],
    paperDollKey: "acc_ring_t4",
    iconColor: "#f43f5e",
    visualColor: "#f43f5e",
    accentColor: "#fda4af",
    visualStyle: { outline: "#1a1625", primary: "#f43f5e", accent: "#fda4af", shape: "ring_orb" },
    requiredClass: "all",
    biomeTheme: "ruins",
    dismantleShards: 10,
    passive: {
      id: "pact_drain",
      name: "Lời Nguyền Khế Ước",
      trigger: "onKill",
      isCurse: true,
      description: "Mỗi khi hạ quái mất 3% HP hiện tại (không gây chết).",
    },
    passiveDesc: "Lời Nguyền Khế Ước: Mỗi khi hạ quái mất 3% HP hiện tại (không gây chết).",
    desc: "[Nguyền Rủa] Nhẫn hắc huyết khuếch đại chí mạng cực lớn nhưng rút sinh lực mỗi khi hạ địch.",
    lore: "Nứt đôi vào khoảnh khắc chủ nhân cũ bội ước. Sức mạnh còn nguyên, cái giá cũng vậy.",
    sellPrice: 185,
    baseStats: { critDmgPct: 35, critRate: 12 },
  },
  cs_mirage_vial: {
    id: "cs_mirage_vial",
    name: "Lọ Sương Mù Ảo Ảnh",
    category: "consumable",
    rarity: "uncommon",
    tier: 2,
    iconKind: "potion",
    spriteKey: "core_cs_mirage_vial",
    spritesheetCell: [4, 3],
    iconColor: "#4ade80",
    visualColor: "#a855f7",
    accentColor: "#e9d5ff",
    passive: {
      id: "mirage_stealth",
      name: "Ẩn Thân Sương Mù",
      trigger: "onUse",
      description: "Tàng hình 2.5s (quái mất aggro) + tăng 40% tốc chạy.",
    },
    passiveDesc: "Kích hoạt: Tàng hình 2.5s (quái mất aggro) + tăng 40% tốc chạy.",
    desc: "Bình sương tím giúp cắt đuôi truy đuổi và rút lui tức thì.",
    lore: "Chưng cất từ sương sớm và cánh bướm đêm. Kẻ khôn ngoan biết khi nào nên rút lui.",
    sellPrice: 25,
    buyPrice: 60,
    consumableKind: "mirage_vial",
    consumableSpec: { group: "stamina", stealthSec: 2.5, speedPct: 0.4, durationSec: 2.5 },
  },
  cs_fate_die: {
    id: "cs_fate_die",
    name: "Xúc Xắc Đổi Mệnh",
    category: "consumable",
    rarity: "epic",
    tier: 4,
    iconKind: "core",
    spriteKey: "core_cs_fate_die",
    spritesheetCell: [4, 4],
    iconColor: "#c084fc",
    visualColor: "#9333ea",
    accentColor: "#facc15",
    passive: {
      id: "fate_reroll",
      name: "Tung Xúc Xắc Vận Mệnh",
      trigger: "onUse",
      description: "Dùng ở Lò Rèn để reroll chỉ số phụ của 1 trang bị.",
    },
    passiveDesc: "Kích hoạt tại Lò Rèn: Reroll toàn bộ chỉ số phụ Ma Trận của 1 trang bị.",
    desc: "Khối xúc xắc huyền bí dùng tại Lò Rèn Kael để tung lại dòng phụ của trang bị.",
    lore: "Mặt thứ bảy không tồn tại, nhưng những tay thợ rèn già thề rằng họ từng tung ra nó.",
    sellPrice: 95,
    consumableKind: "fate_die",
  },
};

Object.assign(ITEMS, CORE_MATERIALS, CORE_16_ITEMS);

/** Kho hàng của Thương Nhân Mira (gồm tiêu thụ T1-T4, vũ khí T1-T2 các class & 8 loại Bột Sắc Tố) */
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
  "pot_coating",
  "charm_undying",
  "wpn_meadow_edge",
  "wpn_meadow_wand",
  "wpn_leaf_daggers",
  "wpn_volt_blaster",
  "mat_pigment_red",
  "mat_pigment_cyan",
  "mat_pigment_green",
  "mat_pigment_gold",
  "mat_pigment_wind",
  "mat_pigment_quake",
  "mat_pigment_void",
  "mat_pigment_chroma",
  "mat_iron_ore",
  "mat_glitch_core",
  "mat_quartz_shard",
  "wp_vanguard_chipped",
  "cs_mirage_vial",
];

let uidSeq = 1;
export function createItemInstance(defId: string, qty = 1, enhanceLevel = 0): ItemInstance {
  return {
    uid: `it_${Date.now().toString(36)}_${(uidSeq++).toString(36)}`,
    defId,
    qty,
    enhanceLevel,
    pityBonus: 0,
  };
}

export interface NormalizedEquipStats {
  atk: number;
  mag: number;
  def: number;
  maxHp: number;
  spd: number;
  aspdPct: number;
  moveSpeedPct: number;
  crit: number;
  critDmgPct: number;
  lifestealPct: number;
  fireResPct: number;
  elementBonus: number;
  maxStamina: number;
  staminaCostPct: number;
  poiseBreakPct: number;
  skillCdPct: number;
}

/**
 * Computes effective stats of an equipment instance including rarity-weighted +0..+10 scaling
 * AND breakthrough milestones (+3 Tempered, +5 8-Element Socket Resonance, +7 Enchanted Aura, +10 Prismatic Awakening).
 */
export function getItemEffectiveStats(inst: ItemInstance): NormalizedEquipStats {
  const def = ITEMS[inst.defId];
  const b: StatBonus = def?.baseStats ?? {};
  const rMult = def ? RARITY_INFO[def.rarity].enhanceMult : 1.0;
  const lv = Math.max(0, inst.enhanceLevel);
  const mult = 1 + lv * 0.14 * rMult;

  const scalePositive = (val: number | undefined) => {
    const v = val ?? 0;
    return v > 0 ? Math.round(v * mult) : v;
  };

  const baseCrit = b.critRate ?? b.crit ?? 0;
  const baseSpd = b.moveSpeed ?? b.spd ?? 0;
  const baseElem = b.elementBonus ?? 0;

  let maxStamina = b.maxStamina ?? 0;
  let staminaCostPct = b.staminaCostPct ?? 0;
  let poiseBreakPct = b.poiseBreakPct ?? 0;
  let skillCdPct = b.skillCdPct ?? 0;

  // +3 Breakthrough: Tempered Edge / Stride
  if (lv >= 3) {
    if (def?.slot === "weapon") poiseBreakPct += 10;
    if (def?.slot === "boots") maxStamina += 6;
  }

  // +5 Breakthrough: 8-Element Chroma Socket Resonance!
  let infusedBonusElem = 0;
  let infAtk = 0;
  let infHp = 0;
  let infSpd = 0;
  let infCrit = 0;
  if (lv >= 5 && inst.infusedElement) {
    infusedBonusElem = inst.infusedElement === "chroma" ? 12 : 8;
    if (inst.infusedElement === "fire") infAtk += 4;
    else if (inst.infusedElement === "ice") infCrit += 4;
    else if (inst.infusedElement === "nature") infHp += 20;
    else if (inst.infusedElement === "volt") skillCdPct -= 5;
    else if (inst.infusedElement === "void") skillCdPct -= 6;
    else if (inst.infusedElement === "wind") {
      infSpd += 6;
      maxStamina += 8;
    } else if (inst.infusedElement === "quake") {
      poiseBreakPct += 15;
    }
  }

  // +7 Breakthrough: Enchanted Aura
  if (lv >= 7) {
    if (def?.slot === "weapon") staminaCostPct -= 15;
    if (def?.slot === "boots") maxStamina += 15;
    if (def?.slot === "accessory") skillCdPct -= 10;
  }
  // +10 Breakthrough: Prismatic Awakening
  if (lv >= 10) {
    if (def?.slot === "weapon") poiseBreakPct += 20;
    maxStamina += 5;
  }

  const bonus = inst.bonusStats ?? {};
  const mAtk = bonus.atk ?? 0;
  const mMag = bonus.mag ?? 0;
  const mDef = bonus.def ?? 0;
  const mHp = bonus.maxHp ?? 0;
  const mSpd = bonus.spd ?? bonus.moveSpeed ?? 0;
  const mCrit = bonus.crit ?? bonus.critRate ?? 0;
  const mAspd = bonus.aspdPct ?? 0;
  const mCritDmg = bonus.critDmgPct ?? 0;

  return {
    atk:
      scalePositive(b.atk) +
      infAtk +
      mAtk +
      (def?.slot === "weapon" ? lv * 2 + (lv >= 10 ? 8 : 0) : 0),
    mag: scalePositive(b.mag) + mMag,
    def:
      scalePositive(b.def) +
      mDef +
      (def?.slot === "armor" || def?.slot === "helmet" ? lv * 1 + (lv >= 3 ? 2 : 0) : 0),
    maxHp:
      scalePositive(b.maxHp) +
      infHp +
      mHp +
      (def?.slot === "armor" ? lv * 8 : def?.slot === "helmet" ? lv * 5 : 0) +
      (lv >= 3 && (def?.slot === "armor" || def?.slot === "helmet") ? 15 : 0),
    spd:
      (baseSpd > 0 ? Math.round(baseSpd * (1 + lv * 0.06)) : baseSpd) +
      infSpd +
      mSpd +
      (def?.slot === "boots" && lv >= 5 ? 3 : 0),
    aspdPct: (b.aspdPct ?? 0) + mAspd,
    moveSpeedPct: b.moveSpeedPct ?? 0,
    crit: Math.round(baseCrit + infCrit + mCrit + (lv >= 5 ? 3 : 0) + (lv >= 8 ? 4 : 0) + (lv >= 10 ? 3 : 0)),
    critDmgPct: (b.critDmgPct ?? 0) + mCritDmg,
    lifestealPct: b.lifestealPct ?? 0,
    fireResPct: b.fireResPct ?? 0,
    elementBonus:
      Math.round(baseElem * (1 + lv * 0.08)) +
      (lv >= 5 && baseElem > 0 ? 3 : 0) +
      infusedBonusElem +
      (lv >= 10 ? 10 : 0),
    maxStamina,
    staminaCostPct,
    poiseBreakPct,
    skillCdPct,
  };
}

/** Returns human-readable breakthrough milestone description for an item at +3/+5/+7/+10. */
export function getItemMilestoneSummary(inst: ItemInstance): string[] {
  const def = ITEMS[inst.defId];
  if (!def || def.category !== "equipment") return [];
  const lv = inst.enhanceLevel;
  const notes: string[] = [];
  notes.push(
    `${lv >= 3 ? "★" : "○"} [+3 Tôi Luyện]: ${
      def.slot === "weapon"
        ? "+10% Phá Giáp Trắng Boss"
        : def.slot === "boots"
          ? "+6 Thể Lực Tối Đa"
          : "+15 HP & +2 DEF"
    }`
  );
  notes.push(
    `${lv >= 5 ? "★" : "○"} [+5 Khe 8 Sắc Tố]: Nhuộm 1 trong 8 Hệ (Hỏa/Băng/Mộc/Lôi/Hư Không/Sắc Độ/Gió/Chấn Động)`
  );
  notes.push(
    `${lv >= 7 ? "★" : "○"} [+7 Hào Quang]: ${
      def.slot === "weapon"
        ? "-15% Thể lực Tụ Lực & Hào quang"
        : def.slot === "boots"
          ? "+15 Thể Lực Tối Đa"
          : def.slot === "accessory"
            ? "-10% Hồi chiêu Kỹ năng [E]"
            : "Tăng cường kháng chấn"
    }`
  );
  notes.push(
    `${lv >= 10 ? "★" : "○"} [+10 Thức Tỉnh Lăng Kính]: +10% ELEM, +3% Crit${
      def.slot === "weapon" ? ", N3/Tụ Lực kích Khúc Xạ Cầu Vồng (Prism)" : ""
    }`
  );
  return notes;
}

/** Returns how many Prism Shards an equipment item yields when dismantled. */
export function getDismantleShardYield(inst: ItemInstance): number {
  const def = ITEMS[inst.defId];
  if (!def || def.category !== "equipment") return 0;
  const base =
    def.dismantleShards ??
    ({ common: 1, uncommon: 2, rare: 4, epic: 8, cursed: 10, legendary: 15 }[def.rarity] || 1);
  return base + Math.floor(inst.enhanceLevel * 0.85);
}

export function pickRandomEquipByRarity(rarity: Rarity, preferredClassId?: ClassId): string {
  const pool = Object.values(ITEMS).filter(
    (it) =>
      it.category === "equipment" &&
      it.rarity === rarity &&
      !it.isHidden &&
      !it.dropOnly &&
      !it.seasonalBannerId &&
      (rarity === "cursed" || it.rarity !== "cursed")
  );
  if (pool.length === 0) return resolveClassReward(preferredClassId ?? "prism_knight", "meadow_weapon");
  if (preferredClassId && Math.random() < 0.6) {
    const matching = pool.filter((it) => canClassEquip(it, preferredClassId));
    if (matching.length > 0) {
      return matching[Math.floor(Math.random() * matching.length)].id;
    }
  }
  return pool[Math.floor(Math.random() * pool.length)].id;
}
