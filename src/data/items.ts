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
  pot_coating: {
    id: "pot_coating",
    name: "Dầu Phủ Quang Phổ",
    category: "consumable",
    rarity: "rare",
    iconColor: "#ff66d8",
    iconKind: "potion",
    visualColor: "#e639b8",
    accentColor: "#78f9ff",
    desc: "Phủ nguyên tố xoay vòng lên mọi đòn đánh & +20% Sát thương Nguyên Tố trong 25s. Phím tắt [4].",
    sellPrice: 28,
    buyPrice: 60,
    consumableKind: "chroma_coating",
  },
  charm_undying: {
    id: "charm_undying",
    name: "Bùa Hộ Mệnh Bất Diệt",
    category: "consumable",
    rarity: "epic",
    iconColor: "#ffe066",
    iconKind: "totem",
    visualColor: "#f0b429",
    accentColor: "#44ee88",
    desc: "Để trong Túi sẽ tự vỡ khi chịu đòn chí tử: chặn cái chết, hồi ngay 40% HP, 100% Thể lực & bất tử 1.5s!",
    sellPrice: 65,
    buyPrice: 160,
    consumableKind: "undying_charm",
  },

  // === MATERIALS, PIGMENTS & BOSS CORES ===
  mat_prism_shard: {
    id: "mat_prism_shard",
    name: "Mảnh Lăng Kính",
    category: "material",
    rarity: "uncommon",
    iconColor: "#5ef2ff",
    iconKind: "shard",
    visualColor: "#2cc8e8",
    accentColor: "#ffffff",
    desc: "Thu được khi phân rã trang bị. Dùng chế tạo & làm Xúc Tác (+15% tỉ lệ) tại Lò Rèn.",
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
    iconColor: "#ffee44",
    iconKind: "pigment",
    visualColor: "#e6b81c",
    accentColor: "#ffffff",
    pigmentElement: "volt",
    desc: "Sắc tố Vàng tinh luyện. Dùng tại Lò Rèn để nhuộm hệ ĐIỆN/QUANG cho trang bị từ +5 trở lên.",
    sellPrice: 22,
    buyPrice: 65,
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
};

export const MERCHANT_STOCK = [
  "pot_hp",
  "pot_stamina",
  "pot_tonic",
  "pot_coating",
  "charm_undying",
  "mat_pigment_red",
  "mat_pigment_cyan",
  "mat_pigment_green",
  "mat_pigment_gold",
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
 * AND breakthrough milestones (+3 Tempered, +5 Chroma Socket, +7 Enchanted Aura, +10 Prismatic Awakening).
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
  // +5 Breakthrough: Chroma Socket Resonance
  const infusedBonusElem = lv >= 5 && inst.infusedElement ? 8 : 0;
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

  return {
    atk:
      Math.round((b.atk ?? 0) * mult) +
      (def?.slot === "weapon" ? lv * 2 + (lv >= 10 ? 8 : 0) : 0),
    def:
      Math.round((b.def ?? 0) * mult) +
      (def?.slot === "armor" || def?.slot === "helmet" ? lv * 1 + (lv >= 3 ? 2 : 0) : 0),
    maxHp:
      Math.round((b.maxHp ?? 0) * mult) +
      (def?.slot === "armor" ? lv * 8 : def?.slot === "helmet" ? lv * 5 : 0) +
      (lv >= 3 && (def?.slot === "armor" || def?.slot === "helmet") ? 15 : 0),
    spd: Math.round(baseSpd * (1 + lv * 0.06)) + (def?.slot === "boots" && lv >= 5 ? 3 : 0),
    crit: Math.round(baseCrit + (lv >= 5 ? 3 : 0) + (lv >= 8 ? 4 : 0) + (lv >= 10 ? 3 : 0)),
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
    `${lv >= 5 ? "★" : "○"} [+5 Khe Sắc Tố]: Mở khóa Nhuộm Nguyên Tố (+8% ELEM & gắn Ấn)`
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
    `${lv >= 10 ? "★" : "○"} [+10 Thức Tỉnh]: Cộng hưởng Lăng Kính (+10% ELEM, +3% Crit${
      def.slot === "weapon" ? ", đòn N3/Tụ Lực kích Khúc Xạ Cầu Vồng" : ""
    })`
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

export function pickRandomEquipByRarity(rarity: Rarity): string {
  const pool = Object.values(ITEMS).filter(
    (it) => it.category === "equipment" && it.rarity === rarity
  );
  if (pool.length === 0) return "wpn_meadow_edge";
  return pool[Math.floor(Math.random() * pool.length)].id;
}
