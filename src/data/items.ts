import type { EquipSlot, ItemDef, ItemInstance, Rarity, StatBonus } from "./types";

export const RARITY_INFO: Record<
  Rarity,
  { label: string; color: string; beamPreset: string; statMult: number }
> = {
  common: { label: "Thường", color: "#e6ecff", beamPreset: "beam-common", statMult: 1.0 },
  uncommon: { label: "Hiếm Nhẹ", color: "#44ee88", beamPreset: "beam-uncommon", statMult: 1.25 },
  rare: { label: "Quý Hiếm", color: "#38b6ff", beamPreset: "beam-rare", statMult: 1.55 },
  epic: { label: "Sử Thi", color: "#c266ff", beamPreset: "beam-epic", statMult: 1.95 },
  legendary: { label: "Huyền Thoại", color: "#ff9922", beamPreset: "beam-legendary", statMult: 2.5 },
};

export const SLOT_LABELS: Record<EquipSlot, string> = {
  weapon: "Vũ Khí",
  armor: "Áo Giáp",
  ring: "Nhẫn",
  chip: "Pix-Chip",
};

export const ITEMS: Record<string, ItemDef> = {
  // === CONSUMABLES (Hotkeys 1-3) ===
  pot_hp: {
    id: "pot_hp",
    name: "Bình Máu Sắc Độ",
    category: "consumable",
    rarity: "common",
    iconColor: "#ff3366",
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
    desc: "+30% ATK và +15% Tỉ lệ Crit trong 12s. Phím tắt [3].",
    sellPrice: 25,
    buyPrice: 55,
    consumableKind: "chroma_tonic",
  },

  // === MATERIALS ===
  mat_glitch_core: {
    id: "mat_glitch_core",
    name: "Lõi Glitch",
    category: "material",
    rarity: "common",
    iconColor: "#ff55aa",
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
    desc: "Tinh thể nóng rực từ Hầm Mỏ Hổ Phách. Dùng cường hóa cấp cao & chế tạo.",
    sellPrice: 24,
  },
  mat_void_prism: {
    id: "mat_void_prism",
    name: "Lăng Kính Hư Vô",
    category: "material",
    rarity: "epic",
    iconColor: "#c866ff",
    desc: "Tinh thể hiếm từ Boss & Phế Tích Vô Sắc. Nguyên liệu đúc thần khí Huyền Thoại.",
    sellPrice: 55,
  },

  // === WEAPONS ===
  wpn_starter: {
    id: "wpn_starter",
    name: "Vũ Khí Sơ Khai",
    category: "equipment",
    rarity: "common",
    slot: "weapon",
    iconColor: "#cfd8e6",
    desc: "Trang bị tiêu chuẩn của Chroma-Walker mới nhập môn.",
    sellPrice: 15,
    baseStats: { atk: 6, crit: 2 },
  },
  wpn_meadow_edge: {
    id: "wpn_meadow_edge",
    name: "Lưỡi Quang Thảo Nguyên",
    category: "equipment",
    rarity: "uncommon",
    slot: "weapon",
    iconColor: "#44ee88",
    desc: "Thấm nhuần sinh khí lục bảo của Đồng Cỏ.",
    sellPrice: 35,
    baseStats: { atk: 12, crit: 5 },
  },
  wpn_quartz_reaver: {
    id: "wpn_quartz_reaver",
    name: "Hàn Tinh Thạch Anh",
    category: "equipment",
    rarity: "rare",
    slot: "weapon",
    iconColor: "#38b6ff",
    desc: "Vũ khí rèn từ lõi thạch anh sắc bén, tăng tốc độ phản xạ.",
    sellPrice: 75,
    baseStats: { atk: 20, crit: 8, spd: 6 },
  },
  wpn_amber_fury: {
    id: "wpn_amber_fury",
    name: "Hỏa Phách Nộ Nha",
    category: "equipment",
    rarity: "epic",
    slot: "weapon",
    iconColor: "#c266ff",
    desc: "Rực cháy năng lượng dung nham Hổ Phách.",
    sellPrice: 160,
    baseStats: { atk: 32, crit: 12, maxHp: 20 },
  },
  wpn_chroma_sovereign: {
    id: "wpn_chroma_sovereign",
    name: "Thần Khí Thất Sắc",
    category: "equipment",
    rarity: "legendary",
    slot: "weapon",
    iconColor: "#ff9922",
    desc: "Vũ khí tối thượng khắc chế Nhiễu Trắng, tỏa hào quang cầu vồng.",
    sellPrice: 360,
    baseStats: { atk: 48, crit: 18, spd: 10, maxHp: 35 },
  },

  // === ARMORS ===
  arm_cloth: {
    id: "arm_cloth",
    name: "Áo Choàng Xám",
    category: "equipment",
    rarity: "common",
    slot: "armor",
    iconColor: "#b8c0d4",
    desc: "Áo vải đơn giản chống chịu nhẹ.",
    sellPrice: 15,
    baseStats: { def: 3, maxHp: 20 },
  },
  arm_meadow_mail: {
    id: "arm_meadow_mail",
    name: "Giáp Lá Ngọc",
    category: "equipment",
    rarity: "uncommon",
    slot: "armor",
    iconColor: "#44ee88",
    desc: "Nhẹ và bền bỉ, dệt từ sợi thực vật đã hồi màu.",
    sellPrice: 36,
    baseStats: { def: 6, maxHp: 45, spd: 4 },
  },
  arm_quartz_plate: {
    id: "arm_quartz_plate",
    name: "Giáp Thạch Anh",
    category: "equipment",
    rarity: "rare",
    slot: "armor",
    iconColor: "#38b6ff",
    desc: "Tấm giáp tinh thể khúc xạ sát thương hiệu quả.",
    sellPrice: 78,
    baseStats: { def: 11, maxHp: 80 },
  },
  arm_amber_aegis: {
    id: "arm_amber_aegis",
    name: "Chiến Giáp Hổ Phách",
    category: "equipment",
    rarity: "epic",
    slot: "armor",
    iconColor: "#c266ff",
    desc: "Rèn từ quặng hổ phách tinh khiết, cực kỳ vững chắc.",
    sellPrice: 165,
    baseStats: { def: 17, maxHp: 135, atk: 5 },
  },
  arm_prism_mantle: {
    id: "arm_prism_mantle",
    name: "Thánh Giáp Lăng Kính",
    category: "equipment",
    rarity: "legendary",
    slot: "armor",
    iconColor: "#ff9922",
    desc: "Áo giáp huyền thoại tạo trường sắc độ bảo hộ.",
    sellPrice: 350,
    baseStats: { def: 25, maxHp: 210, spd: 8 },
  },

  // === RINGS ===
  rng_copper: {
    id: "rng_copper",
    name: "Nhẫn Đồng Cũ",
    category: "equipment",
    rarity: "common",
    slot: "ring",
    iconColor: "#d4b08c",
    desc: "Chiếc nhẫn đơn sơ tăng nhẹ sát thương.",
    sellPrice: 14,
    baseStats: { atk: 3, crit: 3 },
  },
  rng_breeze: {
    id: "rng_breeze",
    name: "Nhẫn Gió Xanh",
    category: "equipment",
    rarity: "uncommon",
    slot: "ring",
    iconColor: "#44ee88",
    desc: "Giúp bước chân thanh thoát hơn.",
    sellPrice: 34,
    baseStats: { spd: 9, crit: 6 },
  },
  rng_quartz_eye: {
    id: "rng_quartz_eye",
    name: "Nhẫn Mắt Pha Lê",
    category: "equipment",
    rarity: "rare",
    slot: "ring",
    iconColor: "#38b6ff",
    desc: "Tăng mạnh khả năng đánh chí mạng vào điểm yếu.",
    sellPrice: 74,
    baseStats: { atk: 8, crit: 11, spd: 6 },
  },
  rng_amber_heart: {
    id: "rng_amber_heart",
    name: "Nhẫn Tâm Hổ Phách",
    category: "equipment",
    rarity: "epic",
    slot: "ring",
    iconColor: "#c266ff",
    desc: "Rực sáng năng lượng sinh mệnh và công kích.",
    sellPrice: 155,
    baseStats: { atk: 14, maxHp: 55, crit: 12 },
  },
  rng_spectrum: {
    id: "rng_spectrum",
    name: "Vòng Quang Phổ Vĩnh Hằng",
    category: "equipment",
    rarity: "legendary",
    slot: "ring",
    iconColor: "#ff9922",
    desc: "Nhẫn cổ vật chứa 7 sắc màu nguyên thủy của PIXTEL.",
    sellPrice: 340,
    baseStats: { atk: 22, crit: 18, spd: 12, maxHp: 75 },
  },

  // === PIX-CHIPS ===
  chp_basic: {
    id: "chp_basic",
    name: "Pix-Chip 8-Bit",
    category: "equipment",
    rarity: "common",
    slot: "chip",
    iconColor: "#a8b4cc",
    desc: "Vi mạch điểm ảnh đời đầu tăng nhẹ tốc độ.",
    sellPrice: 16,
    baseStats: { spd: 5, maxHp: 15 },
  },
  chp_overclock: {
    id: "chp_overclock",
    name: "Pix-Chip Ép Xung",
    category: "equipment",
    rarity: "uncommon",
    slot: "chip",
    iconColor: "#44ee88",
    desc: "Cải thiện xung nhịp ra đòn và chí mạng.",
    sellPrice: 38,
    baseStats: { atk: 6, crit: 7, spd: 6 },
  },
  chp_prism_core: {
    id: "chp_prism_core",
    name: "Pix-Chip Lõi Quang",
    category: "equipment",
    rarity: "rare",
    slot: "chip",
    iconColor: "#38b6ff",
    desc: "Tối ưu dòng năng lượng Lăng Kính toàn diện.",
    sellPrice: 80,
    baseStats: { atk: 11, def: 5, maxHp: 40, crit: 8 },
  },
  chp_root_pulse: {
    id: "chp_root_pulse",
    name: "Pix-Chip Cổ Thụ",
    category: "equipment",
    rarity: "epic",
    slot: "chip",
    iconColor: "#c266ff",
    desc: "Kết tinh từ Boss Blight Root, cường hóa sinh lực & sát thương.",
    sellPrice: 170,
    baseStats: { atk: 17, def: 9, maxHp: 85, crit: 10 },
  },
  chp_eraser_zero: {
    id: "chp_eraser_zero",
    name: "Pix-Chip Alpha-Chroma",
    category: "equipment",
    rarity: "legendary",
    slot: "chip",
    iconColor: "#ff9922",
    desc: "Mảnh chip tối thượng kết hợp toàn bộ phổ màu thế giới.",
    sellPrice: 380,
    baseStats: { atk: 26, def: 12, maxHp: 120, crit: 16, spd: 12 },
  },
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

/** Computes effective stats of an equipment instance including +0..+10 enhancement scaling. */
export function getItemEffectiveStats(inst: ItemInstance): Required<StatBonus> {
  const def = ITEMS[inst.defId];
  const b = def?.baseStats ?? {};
  const mult = 1 + inst.enhanceLevel * 0.16;
  return {
    atk: Math.round((b.atk ?? 0) * mult) + (def?.slot === "weapon" ? inst.enhanceLevel * 2 : 0),
    def: Math.round((b.def ?? 0) * mult) + (def?.slot === "armor" ? inst.enhanceLevel * 1 : 0),
    maxHp: Math.round((b.maxHp ?? 0) * mult) + (def?.slot === "armor" ? inst.enhanceLevel * 8 : 0),
    spd: Math.round((b.spd ?? 0) * (1 + inst.enhanceLevel * 0.06)),
    crit: Math.round((b.crit ?? 0) + (inst.enhanceLevel >= 5 ? 3 : 0) + (inst.enhanceLevel >= 8 ? 4 : 0)),
  };
}

export function pickRandomEquipByRarity(rarity: Rarity): string {
  const pool = Object.values(ITEMS).filter(
    (it) => it.category === "equipment" && it.rarity === rarity
  );
  if (pool.length === 0) return "wpn_meadow_edge";
  return pool[Math.floor(Math.random() * pool.length)].id;
}
