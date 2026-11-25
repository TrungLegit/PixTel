import type { RecipeDef } from "./types";

/**
 * Bản vẽ Chế Tạo tại Lò Rèn Lăng Kính:
 * Cho phép dùng khoáng sản khai thác trên bản đồ + Mảnh Lăng Kính (phân rã)
 * để đúc trực tiếp Mũ, Giáp, Vũ Khí, Giày và Phụ Kiện phẩm Lam / Tím / Huyền Thoại.
 */
export const FORGE_RECIPES: RecipeDef[] = [
  // === BỘ TINH THỂ THẠCH ANH (RARE / LAM) ===
  {
    id: "rec_quartz_visor",
    resultDefId: "hlm_quartz_visor",
    goldCost: 95,
    materials: [
      { defId: "mat_iron_ore", qty: 4 },
      { defId: "mat_quartz_shard", qty: 3 },
      { defId: "mat_prism_shard", qty: 2 },
    ],
    desc: "Đúc Mũ Kính Thạch Anh (Lam) từ Quặng Sắt và Mảnh Thạch Anh.",
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
    id: "rec_quartz_greaves",
    resultDefId: "bts_quartz_greaves",
    goldCost: 95,
    materials: [
      { defId: "mat_iron_ore", qty: 4 },
      { defId: "mat_quartz_shard", qty: 3 },
    ],
    desc: "Chế tạo Ủng Pha Lê Khúc Xạ (Lam) tăng tốc chạy & chí mạng.",
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

  // === BỘ DUNG NHAM HỔ PHÁCH (EPIC / TÍM) ===
  {
    id: "rec_amber_crown",
    resultDefId: "hlm_amber_crown",
    goldCost: 220,
    materials: [
      { defId: "mat_quartz_shard", qty: 4 },
      { defId: "mat_amber_gem", qty: 5 },
      { defId: "mat_prism_shard", qty: 4 },
    ],
    desc: "Đúc Mũ Giáp Nham Thạch phẩm Sử Thi (Tím).",
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
    id: "rec_amber_treads",
    resultDefId: "bts_amber_treads",
    goldCost: 210,
    materials: [
      { defId: "mat_iron_ore", qty: 6 },
      { defId: "mat_amber_gem", qty: 4 },
      { defId: "mat_prism_shard", qty: 4 },
    ],
    desc: "Chế tạo Giày Chiến Hổ Phách phẩm Sử Thi (Tím).",
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

  // === BỘ QUANG PHỔ VÔ SẮC (LEGENDARY / CAM) ===
  {
    id: "rec_prism_halo",
    resultDefId: "hlm_prism_halo",
    goldCost: 480,
    materials: [
      { defId: "mat_amber_gem", qty: 5 },
      { defId: "mat_void_prism", qty: 4 },
      { defId: "mat_prism_shard", qty: 8 },
    ],
    desc: "Rèn Vương Miện Quang Phổ phẩm Huyền Thoại (Cam)!",
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
    id: "rec_void_walkers",
    resultDefId: "bts_void_walkers",
    goldCost: 460,
    materials: [
      { defId: "mat_void_prism", qty: 4 },
      { defId: "mat_amber_gem", qty: 4 },
      { defId: "mat_prism_shard", qty: 8 },
    ],
    desc: "Rèn Hài Đạp Hư Vô phẩm Huyền Thoại (Cam) tăng tối đa tốc độ!",
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
