import type { RecipeDef } from "./types";

export const FORGE_RECIPES: RecipeDef[] = [
  // === RARE (LAM) CLASS WEAPONS ===
  {
    id: "rec_knight_quartz",
    resultDefId: "wpn_knight_quartz",
    goldCost: 115,
    materials: [
      { defId: "mat_iron_ore", qty: 5 },
      { defId: "mat_quartz_shard", qty: 4 },
      { defId: "mat_glitch_core", qty: 3 },
    ],
    desc: "Đúc Đại Kiếm Thạch Anh (mở Chấn Địa Khiên) cho Vệ Binh.",
  },
  {
    id: "rec_mage_quartz",
    resultDefId: "wpn_mage_quartz",
    goldCost: 115,
    materials: [
      { defId: "mat_quartz_shard", qty: 5 },
      { defId: "mat_glitch_core", qty: 4 },
    ],
    desc: "Chế tác Quyền Trượng Băng Tinh (mở Bão Tuyết Thạch Anh) cho Pháp Sư.",
  },
  {
    id: "rec_rogue_quartz",
    resultDefId: "wpn_rogue_quartz",
    goldCost: 115,
    materials: [
      { defId: "mat_iron_ore", qty: 4 },
      { defId: "mat_quartz_shard", qty: 4 },
      { defId: "mat_glitch_core", qty: 4 },
    ],
    desc: "Rèn Song Đao Pha Lê Lam (mở Ảnh Sát Đột Kích) cho Sát Thủ.",
  },
  {
    id: "rec_tinker_quartz",
    resultDefId: "wpn_tinker_quartz",
    goldCost: 115,
    materials: [
      { defId: "mat_iron_ore", qty: 5 },
      { defId: "mat_quartz_shard", qty: 4 },
      { defId: "mat_glitch_core", qty: 3 },
    ],
    desc: "Lắp Pháo Điện Từ Thạch Anh (mở Trụ Sấm Thạch Anh) cho Kỹ Sư.",
  },

  // === RARE (LAM) CLASS ARMORS & UNIVERSAL PIX-CHIP ===
  {
    id: "rec_arm_knight_rare",
    resultDefId: "arm_knight_rare",
    goldCost: 110,
    materials: [
      { defId: "mat_iron_ore", qty: 6 },
      { defId: "mat_quartz_shard", qty: 4 },
    ],
    desc: "Đúc Chiến Giáp Thạch Anh (phản đòn) cho Vệ Binh.",
  },
  {
    id: "rec_arm_mage_rare",
    resultDefId: "arm_mage_rare",
    goldCost: 110,
    materials: [
      { defId: "mat_quartz_shard", qty: 5 },
      { defId: "mat_glitch_core", qty: 4 },
    ],
    desc: "Dệt Pháp Bào Thạch Anh (+25% Phản Ứng Nguyên Tố) cho Pháp Sư.",
  },
  {
    id: "rec_arm_rogue_rare",
    resultDefId: "arm_rogue_rare",
    goldCost: 110,
    materials: [
      { defId: "mat_iron_ore", qty: 4 },
      { defId: "mat_quartz_shard", qty: 4 },
      { defId: "mat_glitch_core", qty: 3 },
    ],
    desc: "May Y Phục Thạch Anh (giảm CD Dash) cho Sát Thủ.",
  },
  {
    id: "rec_arm_tinker_rare",
    resultDefId: "arm_tinker_rare",
    goldCost: 110,
    materials: [
      { defId: "mat_iron_ore", qty: 5 },
      { defId: "mat_quartz_shard", qty: 4 },
    ],
    desc: "Chế Giáp Cơ Khí Thạch Anh (+35% HP Trụ) cho Kỹ Sư.",
  },
  {
    id: "rec_prism_chip",
    resultDefId: "chp_prism_core",
    goldCost: 130,
    materials: [
      { defId: "mat_quartz_shard", qty: 4 },
      { defId: "mat_glitch_core", qty: 5 },
    ],
    desc: "Chế tạo Pix-Chip Lõi Quang (+25% uy lực [Q] & hồi 15% HP).",
  },

  // === EPIC (TÍM) CLASS WEAPONS, ARMORS & RING ===
  {
    id: "rec_knight_amber",
    resultDefId: "wpn_knight_amber",
    goldCost: 250,
    materials: [
      { defId: "mat_quartz_shard", qty: 5 },
      { defId: "mat_amber_gem", qty: 5 },
      { defId: "mat_glitch_core", qty: 6 },
    ],
    desc: "Đúc Trọng Kiếm Hổ Phách phẩm Sử Thi cho Vệ Binh.",
  },
  {
    id: "rec_mage_amber",
    resultDefId: "wpn_mage_amber",
    goldCost: 250,
    materials: [
      { defId: "mat_quartz_shard", qty: 5 },
      { defId: "mat_amber_gem", qty: 5 },
      { defId: "mat_glitch_core", qty: 6 },
    ],
    desc: "Chế Pháp Trượng Thiên Hỏa phẩm Sử Thi cho Pháp Sư.",
  },
  {
    id: "rec_rogue_amber",
    resultDefId: "wpn_rogue_amber",
    goldCost: 250,
    materials: [
      { defId: "mat_quartz_shard", qty: 4 },
      { defId: "mat_amber_gem", qty: 5 },
      { defId: "mat_glitch_core", qty: 7 },
    ],
    desc: "Rèn Song Nhận Hổ Phách phẩm Sử Thi cho Sát Thủ.",
  },
  {
    id: "rec_tinker_amber",
    resultDefId: "wpn_tinker_amber",
    goldCost: 250,
    materials: [
      { defId: "mat_iron_ore", qty: 6 },
      { defId: "mat_amber_gem", qty: 5 },
      { defId: "mat_glitch_core", qty: 6 },
    ],
    desc: "Lắp Súng Quang Hổ Phách phẩm Sử Thi cho Kỹ Sư.",
  },
  {
    id: "rec_arm_knight_epic",
    resultDefId: "arm_knight_epic",
    goldCost: 245,
    materials: [
      { defId: "mat_iron_ore", qty: 8 },
      { defId: "mat_amber_gem", qty: 6 },
    ],
    desc: "Đúc Thánh Giáp Hổ Phách chống chịu cực đại cho Vệ Binh.",
  },
  {
    id: "rec_arm_mage_epic",
    resultDefId: "arm_mage_epic",
    goldCost: 245,
    materials: [
      { defId: "mat_quartz_shard", qty: 6 },
      { defId: "mat_amber_gem", qty: 6 },
    ],
    desc: "Dệt Huyền Bào Hổ Phách phẩm Sử Thi cho Pháp Sư.",
  },
  {
    id: "rec_arm_rogue_epic",
    resultDefId: "arm_rogue_epic",
    goldCost: 245,
    materials: [
      { defId: "mat_amber_gem", qty: 5 },
      { defId: "mat_glitch_core", qty: 7 },
    ],
    desc: "May Hắc Giáp Hổ Phách phẩm Sử Thi cho Sát Thủ.",
  },
  {
    id: "rec_arm_tinker_epic",
    resultDefId: "arm_tinker_epic",
    goldCost: 245,
    materials: [
      { defId: "mat_iron_ore", qty: 8 },
      { defId: "mat_amber_gem", qty: 6 },
    ],
    desc: "Chế Giáp Lò Phản Ứng phẩm Sử Thi cho Kỹ Sư.",
  },
  {
    id: "rec_amber_ring",
    resultDefId: "rng_amber_heart",
    goldCost: 220,
    materials: [
      { defId: "mat_amber_gem", qty: 5 },
      { defId: "mat_glitch_core", qty: 6 },
    ],
    desc: "Chế tác Nhẫn Tâm Hổ Phách (Hút máu khi Crit & Nổ khi hạ địch).",
  },

  // === LEGENDARY (CAM) CLASS WEAPONS, ARMORS & CHIP ===
  {
    id: "rec_knight_legend",
    resultDefId: "wpn_knight_legend",
    goldCost: 540,
    materials: [
      { defId: "mat_amber_gem", qty: 6 },
      { defId: "mat_void_prism", qty: 5 },
      { defId: "mat_glitch_core", qty: 10 },
    ],
    desc: "Rèn Thánh Kiếm Thất Sắc (mở Thái Dương Lăng Kính) cho Vệ Binh!",
  },
  {
    id: "rec_mage_legend",
    resultDefId: "wpn_mage_legend",
    goldCost: 540,
    materials: [
      { defId: "mat_amber_gem", qty: 6 },
      { defId: "mat_void_prism", qty: 5 },
      { defId: "mat_glitch_core", qty: 10 },
    ],
    desc: "Đúc Thánh Trượng Tinh Tú (mở Hố Đen Quang Phổ) cho Pháp Sư!",
  },
  {
    id: "rec_rogue_legend",
    resultDefId: "wpn_rogue_legend",
    goldCost: 540,
    materials: [
      { defId: "mat_amber_gem", qty: 6 },
      { defId: "mat_void_prism", qty: 5 },
      { defId: "mat_glitch_core", qty: 10 },
    ],
    desc: "Rèn Song Kiếm Hư Không (mở Liên Ảnh Diệt Sắc) cho Sát Thủ!",
  },
  {
    id: "rec_tinker_legend",
    resultDefId: "wpn_tinker_legend",
    goldCost: 540,
    materials: [
      { defId: "mat_amber_gem", qty: 6 },
      { defId: "mat_void_prism", qty: 5 },
      { defId: "mat_glitch_core", qty: 10 },
    ],
    desc: "Chế Pháo Đài Hạt Alpha (mở Pháo Đài Quang Phổ) cho Kỹ Sư!",
  },
  {
    id: "rec_arm_knight_legend",
    resultDefId: "arm_knight_legend",
    goldCost: 500,
    materials: [
      { defId: "mat_quartz_shard", qty: 8 },
      { defId: "mat_void_prism", qty: 5 },
      { defId: "mat_amber_gem", qty: 5 },
    ],
    desc: "Rèn Thần Giáp Lăng Kính Huyền Thoại cho Vệ Binh.",
  },
  {
    id: "rec_arm_mage_legend",
    resultDefId: "arm_mage_legend",
    goldCost: 500,
    materials: [
      { defId: "mat_quartz_shard", qty: 8 },
      { defId: "mat_void_prism", qty: 5 },
      { defId: "mat_amber_gem", qty: 5 },
    ],
    desc: "Dệt Thánh Bào Tinh Vân Huyền Thoại cho Pháp Sư.",
  },
  {
    id: "rec_arm_rogue_legend",
    resultDefId: "arm_rogue_legend",
    goldCost: 500,
    materials: [
      { defId: "mat_amber_gem", qty: 6 },
      { defId: "mat_void_prism", qty: 5 },
      { defId: "mat_glitch_core", qty: 8 },
    ],
    desc: "May Ảo Giáp Đoạt Mệnh Huyền Thoại cho Sát Thủ.",
  },
  {
    id: "rec_arm_tinker_legend",
    resultDefId: "arm_tinker_legend",
    goldCost: 500,
    materials: [
      { defId: "mat_iron_ore", qty: 10 },
      { defId: "mat_void_prism", qty: 5 },
      { defId: "mat_amber_gem", qty: 5 },
    ],
    desc: "Chế Thần Giáp Kiến Tạo Huyền Thoại cho Kỹ Sư.",
  },
  {
    id: "rec_eraser_chip",
    resultDefId: "chp_eraser_zero",
    goldCost: 480,
    materials: [
      { defId: "mat_void_prism", qty: 5 },
      { defId: "mat_matrix_rune", qty: 2 },
      { defId: "mat_glitch_core", qty: 12 },
    ],
    desc: "Lắp ráp Pix-Chip Alpha-Chroma Huyền Thoại (+65% uy lực [Q]).",
  },
];
