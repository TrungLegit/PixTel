import type { RecipeDef } from "./types";

export const FORGE_RECIPES: RecipeDef[] = [
  {
    id: "rec_quartz_reaver",
    resultDefId: "wpn_quartz_reaver",
    goldCost: 110,
    materials: [
      { defId: "mat_iron_ore", qty: 5 },
      { defId: "mat_quartz_shard", qty: 4 },
      { defId: "mat_glitch_core", qty: 3 },
    ],
    desc: "Đúc vũ khí phẩm Lam từ Quặng Sắt và Mảnh Thạch Anh.",
  },
  {
    id: "rec_quartz_plate",
    resultDefId: "arm_quartz_plate",
    goldCost: 110,
    materials: [
      { defId: "mat_iron_ore", qty: 6 },
      { defId: "mat_quartz_shard", qty: 4 },
    ],
    desc: "Đúc Áo Giáp Thạch Anh phẩm Lam tăng mạnh DEF & HP.",
  },
  {
    id: "rec_prism_chip",
    resultDefId: "chp_prism_core",
    goldCost: 120,
    materials: [
      { defId: "mat_quartz_shard", qty: 4 },
      { defId: "mat_glitch_core", qty: 5 },
    ],
    desc: "Chế tạo Pix-Chip Lõi Quang phẩm Lam.",
  },
  {
    id: "rec_amber_fury",
    resultDefId: "wpn_amber_fury",
    goldCost: 240,
    materials: [
      { defId: "mat_quartz_shard", qty: 5 },
      { defId: "mat_amber_gem", qty: 5 },
      { defId: "mat_glitch_core", qty: 6 },
    ],
    desc: "Đúc vũ khí Sử Thi (Tím) Hỏa Phách Nộ Nha.",
  },
  {
    id: "rec_amber_aegis",
    resultDefId: "arm_amber_aegis",
    goldCost: 240,
    materials: [
      { defId: "mat_iron_ore", qty: 8 },
      { defId: "mat_amber_gem", qty: 6 },
    ],
    desc: "Đúc Chiến Giáp Hổ Phách phẩm Tím chống chịu cực cao.",
  },
  {
    id: "rec_amber_ring",
    resultDefId: "rng_amber_heart",
    goldCost: 220,
    materials: [
      { defId: "mat_amber_gem", qty: 5 },
      { defId: "mat_glitch_core", qty: 6 },
    ],
    desc: "Chế tác Nhẫn Tâm Hổ Phách phẩm Tím.",
  },
  {
    id: "rec_chroma_sovereign",
    resultDefId: "wpn_chroma_sovereign",
    goldCost: 520,
    materials: [
      { defId: "mat_amber_gem", qty: 6 },
      { defId: "mat_void_prism", qty: 5 },
      { defId: "mat_glitch_core", qty: 10 },
    ],
    desc: "Rèn Thần Khí Thất Sắc phẩm Huyền Thoại (Cam) tối thượng!",
  },
  {
    id: "rec_prism_mantle",
    resultDefId: "arm_prism_mantle",
    goldCost: 500,
    materials: [
      { defId: "mat_quartz_shard", qty: 8 },
      { defId: "mat_void_prism", qty: 5 },
      { defId: "mat_amber_gem", qty: 5 },
    ],
    desc: "Rèn Thánh Giáp Lăng Kính phẩm Huyền Thoại (Cam).",
  },
  {
    id: "rec_eraser_chip",
    resultDefId: "chp_eraser_zero",
    goldCost: 480,
    materials: [
      { defId: "mat_void_prism", qty: 4 },
      { defId: "mat_glitch_core", qty: 12 },
    ],
    desc: "Lắp ráp Pix-Chip Alpha-Chroma phẩm Huyền Thoại (Cam).",
  },
];
