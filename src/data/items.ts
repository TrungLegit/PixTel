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
  def: number;
  maxHp: number;
  spd: number;
  crit: number;
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
  const mDef = bonus.def ?? 0;
  const mHp = bonus.maxHp ?? 0;
  const mSpd = bonus.spd ?? bonus.moveSpeed ?? 0;
  const mCrit = bonus.crit ?? bonus.critRate ?? 0;

  return {
    atk:
      Math.round((b.atk ?? 0) * mult) +
      infAtk +
      mAtk +
      (def?.slot === "weapon" ? lv * 2 + (lv >= 10 ? 8 : 0) : 0),
    def:
      Math.round((b.def ?? 0) * mult) +
      mDef +
      (def?.slot === "armor" || def?.slot === "helmet" ? lv * 1 + (lv >= 3 ? 2 : 0) : 0),
    maxHp:
      Math.round((b.maxHp ?? 0) * mult) +
      infHp +
      mHp +
      (def?.slot === "armor" ? lv * 8 : def?.slot === "helmet" ? lv * 5 : 0) +
      (lv >= 3 && (def?.slot === "armor" || def?.slot === "helmet") ? 15 : 0),
    spd: Math.round(baseSpd * (1 + lv * 0.06)) + infSpd + mSpd + (def?.slot === "boots" && lv >= 5 ? 3 : 0),
    crit: Math.round(baseCrit + infCrit + mCrit + (lv >= 5 ? 3 : 0) + (lv >= 8 ? 4 : 0) + (lv >= 10 ? 3 : 0)),
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
    ({ common: 1, uncommon: 2, rare: 4, epic: 8, legendary: 15 }[def.rarity] || 1);
  return base + Math.floor(inst.enhanceLevel * 0.85);
}

export function pickRandomEquipByRarity(rarity: Rarity, preferredClassId?: ClassId): string {
  const pool = Object.values(ITEMS).filter(
    (it) =>
      it.category === "equipment" &&
      it.rarity === rarity &&
      !it.isHidden &&
      !it.dropOnly &&
      !it.seasonalBannerId
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
