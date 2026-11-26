import type { RecipeDef } from "./types";
import { GACHA_KEY_RECIPES } from "./gacha";
import { HIDDEN_CRAFT_RECIPES } from "./hiddenItems";

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
  // === VŨ KHÍ CHUYÊN BIỆT CLASS TIER 4 & TIER 5 ===
  {
    id: "rec_amber_staff",
    resultDefId: "wpn_amber_staff",
    goldCost: 240,
    materials: [
      { defId: "mat_amber_gem", qty: 5 },
      { defId: "mat_quartz_shard", qty: 4 },
      { defId: "mat_prism_shard", qty: 4 },
    ],
    desc: "Chế tác Trượng Hỏa Tinh Hổ Phách (T4) cho Pháp Sư Sắc Độ.",
  },
  {
    id: "rec_magma_fangs",
    resultDefId: "wpn_magma_fangs",
    goldCost: 240,
    materials: [
      { defId: "mat_amber_gem", qty: 5 },
      { defId: "mat_iron_ore", qty: 6 },
      { defId: "mat_glitch_core", qty: 6 },
    ],
    desc: "Rèn Song Nha Nham Thạch (T4) cho Sát Thủ Điểm Ảnh.",
  },
  {
    id: "rec_thermal_repeater",
    resultDefId: "wpn_thermal_repeater",
    goldCost: 240,
    materials: [
      { defId: "mat_amber_gem", qty: 5 },
      { defId: "mat_iron_ore", qty: 6 },
      { defId: "mat_prism_shard", qty: 4 },
    ],
    desc: "Lắp ráp Pháo Hổ Phách Nóng Chảy (T4) cho Kỹ Sư Mạch Sáng.",
  },
  {
    id: "rec_astral_scepter",
    resultDefId: "wpn_astral_scepter",
    goldCost: 520,
    materials: [
      { defId: "mat_void_prism", qty: 5 },
      { defId: "mat_amber_gem", qty: 5 },
      { defId: "mat_prism_shard", qty: 8 },
    ],
    desc: "Đúc Tinh Cầu Vương Trượng (T5) tối thượng cho Pháp Sư Sắc Độ!",
  },
  {
    id: "rec_quantum_blades",
    resultDefId: "wpn_quantum_blades",
    goldCost: 520,
    materials: [
      { defId: "mat_void_prism", qty: 5 },
      { defId: "mat_glitch_core", qty: 12 },
      { defId: "mat_prism_shard", qty: 8 },
    ],
    desc: "Đúc Song Đao Lượng Tử (T5) tối thượng cho Sát Thủ Điểm Ảnh!",
  },
  {
    id: "rec_singularity_cannon",
    resultDefId: "wpn_singularity_cannon",
    goldCost: 520,
    materials: [
      { defId: "mat_void_prism", qty: 5 },
      { defId: "mat_quartz_shard", qty: 8 },
      { defId: "mat_prism_shard", qty: 8 },
    ],
    desc: "Lắp ráp Pháo Hạt Kỳ Dị (T5) tối thượng cho Kỹ Sư Mạch Sáng!",
  },
  // === GIẢ KIM DƯỢC PHẨM CAO CẤP (TIER 3-5) ===
  {
    id: "rec_aegis_flask",
    resultDefId: "pot_aegis_flask",
    goldCost: 35,
    materials: [
      { defId: "mat_quartz_shard", qty: 2 },
      { defId: "mat_prism_shard", qty: 1 },
    ],
    desc: "Điều chế Bình Hộ Thuẫn Pha Lê (T3) — Khiên giảm 35% sát thương.",
  },
  {
    id: "rec_elixir_chroma",
    resultDefId: "pot_elixir_chroma",
    goldCost: 75,
    materials: [
      { defId: "mat_amber_gem", qty: 2 },
      { defId: "mat_void_prism", qty: 1 },
      { defId: "mat_prism_shard", qty: 2 },
    ],
    desc: "Luyện Thánh Dược Quang Phổ (T5) — Hồi 100% HP/Thể lực & 1.5s Bất tử.",
  },
  {
    id: "rec_overdrive_vial",
    resultDefId: "pot_overdrive_vial",
    goldCost: 75,
    materials: [
      { defId: "mat_amber_gem", qty: 2 },
      { defId: "mat_glitch_core", qty: 5 },
      { defId: "mat_prism_shard", qty: 2 },
    ],
    desc: "Luyện Tinh Chất Quá Tải [Q] (T5) — Nạp +60% Nộ & +45% ATK!",
  },
  // === BẢN VẼ CỔ VẬT & LÕI THỦ LĨNH (ARCHETYPE & TACTICAL) ===
  {
    id: "rec_warden_cleaver",
    resultDefId: "wpn_warden_cleaver",
    goldCost: 115,
    materials: [
      { defId: "mat_warden_crest", qty: 1 },
      { defId: "mat_iron_ore", qty: 5 },
      { defId: "mat_prism_shard", qty: 2 },
    ],
    desc: "Rèn Đại Phủ Hình Thiên (+35% Phá Giáp Nhiễu Trắng Boss) từ Ấn Chiến Thần Vệ Thạch.",
  },
  {
    id: "rec_amulet_wind",
    resultDefId: "acc_amulet_wind",
    goldCost: 105,
    materials: [
      { defId: "mat_iron_ore", qty: 3 },
      { defId: "mat_quartz_shard", qty: 3 },
      { defId: "mat_prism_shard", qty: 2 },
    ],
    desc: "Chế tác Dây Chuyền Hơi Thở Gió (+22 Thể Lực & -15% tiêu hao Dash/Tụ Lực).",
  },
  {
    id: "rec_grimoire_arcane",
    resultDefId: "acc_grimoire_arcane",
    goldCost: 240,
    materials: [
      { defId: "mat_crystal_heart", qty: 1 },
      { defId: "mat_quartz_shard", qty: 4 },
      { defId: "mat_prism_shard", qty: 4 },
    ],
    desc: "Đóng quyển Cổ Thư Tinh Tú Khúc Xạ (Tự động phóng cầu phép nguyên tố mỗi 4.2s).",
  },
  {
    id: "rec_disc_spectrum",
    resultDefId: "acc_disc_spectrum",
    goldCost: 260,
    materials: [
      { defId: "mat_amber_fang", qty: 1 },
      { defId: "mat_amber_gem", qty: 4 },
      { defId: "mat_prism_shard", qty: 4 },
    ],
    desc: "Đúc Đĩa Quang Phổ Cổ Đại (+25% Sát thương nổ Phản Ứng Nguyên Tố & hồi Overdrive).",
  },
  {
    id: "rec_charm_undying",
    resultDefId: "charm_undying",
    goldCost: 130,
    materials: [
      { defId: "mat_prism_shard", qty: 3 },
      { defId: "mat_glitch_core", qty: 4 },
    ],
    desc: "Chế tác Bùa Hộ Mệnh Bất Diệt (Tự động chặn 1 đòn chí tử & hồi 40% HP).",
  },
  // === CỔ VẬT MỞ RỘNG 9 NGUYÊN TỐ (GIÓ / CHẤN ĐỘNG / HƯ KHÔNG / SẮC ĐỘ) ===
  {
    id: "rec_wind_feather",
    resultDefId: "acc_wind_feather",
    goldCost: 120,
    materials: [
      { defId: "mat_warden_crest", qty: 1 },
      { defId: "mat_pigment_wind", qty: 1 },
      { defId: "mat_prism_shard", qty: 3 },
    ],
    desc: "Chế tác Lông Vũ Phong Lưu (+14 SPD, +20 Thể lực & lướt Dash tỏa xung Gió khuếch tán).",
  },
  {
    id: "rec_quake_maul",
    resultDefId: "wpn_quake_maul",
    goldCost: 275,
    materials: [
      { defId: "mat_amber_fang", qty: 1 },
      { defId: "mat_pigment_quake", qty: 1 },
      { defId: "mat_amber_gem", qty: 4 },
      { defId: "mat_prism_shard", qty: 4 },
    ],
    desc: "Rèn Cự Chùy Địa Chấn (+40% Phá Giáp Trắng & đòn N3/Tụ Lực gắn Ấn Chấn Động).",
  },
  {
    id: "rec_void_scythe",
    resultDefId: "wpn_void_scythe",
    goldCost: 290,
    materials: [
      { defId: "mat_void_prism", qty: 2 },
      { defId: "mat_pigment_void", qty: 1 },
      { defId: "mat_glitch_core", qty: 8 },
      { defId: "mat_prism_shard", qty: 5 },
    ],
    desc: "Rèn Lưỡi Hái Hư Không (Đòn N3/Tụ Lực tự gắn Ấn Hư Không kéo quái & xóa buff địch).",
  },
  {
    id: "rec_chroma_heart",
    resultDefId: "acc_chroma_heart",
    goldCost: 540,
    materials: [
      { defId: "mat_origin_star", qty: 1 },
      { defId: "mat_pigment_chroma", qty: 2 },
      { defId: "mat_void_prism", qty: 3 },
      { defId: "mat_prism_shard", qty: 8 },
    ],
    desc: "Kết tinh Trái Tim Thất Sắc Iris (Mọi Phản Ứng hồi +4% HP, +10 Stamina & N3 gắn Ấn Sắc Độ)!",
  },
  // === CHẾ TẠO 16 VẬT PHẨM CỐT LÕI & CÔNG THỨC LÒ RÈN ẨN ===
  {
    id: "rec_hm_moss_hood",
    resultDefId: "hm_moss_hood",
    goldCost: 65,
    materials: [
      { defId: "mat_ancient_sap", qty: 2 },
      { defId: "mat_iron_ore", qty: 2 },
    ],
    desc: "Khâu Mũ Trùm Rêu Phong (Set Rừng Sương Mù) giảm 25% tầm phát hiện của quái.",
  },
  {
    id: "rec_ar_briar_cloak",
    resultDefId: "ar_briar_cloak",
    goldCost: 135,
    materials: [
      { defId: "mat_ancient_sap", qty: 3 },
      { defId: "mat_prism_shard", qty: 2 },
    ],
    desc: "Dệt Áo Choàng Gai Cổ Thụ (Set Rừng Sương Mù) phản 20% sát thương & hồi máu khi đứng yên.",
  },
  {
    id: "rec_wp_briar_dagger",
    resultDefId: "wp_briar_dagger",
    goldCost: 145,
    materials: [
      { defId: "mat_ancient_sap", qty: 3 },
      { defId: "mat_iron_ore", qty: 4 },
      { defId: "mat_prism_shard", qty: 2 },
    ],
    desc: "Vót Dao Găm Gai Rừng (Set Rừng Sương Mù) gây Chảy Máu cộng dồn khi chí mạng.",
  },
  {
    id: "rec_wp_spark_staff",
    resultDefId: "wp_spark_staff",
    goldCost: 155,
    materials: [
      { defId: "mat_quartz_shard", qty: 4 },
      { defId: "mat_elder_core", qty: 1 },
      { defId: "mat_prism_shard", qty: 2 },
    ],
    desc: "Chạm khắc Trượng Lôi Đình Tí Hon phóng Sét Dây Chuyền mỗi đòn thứ 3.",
  },
  {
    id: "rec_hm_ash_visor",
    resultDefId: "hm_ash_visor",
    goldCost: 135,
    materials: [
      { defId: "mat_eclipse_coal", qty: 2 },
      { defId: "mat_iron_ore", qty: 4 },
    ],
    desc: "Rèn Mũ Sắt Lò Tro (Set Tâm Lò) miễn nhiễm Thiêu Đốt.",
  },
  {
    id: "rec_ac_ember_crest",
    resultDefId: "ac_ember_crest",
    goldCost: 145,
    materials: [
      { defId: "mat_eclipse_coal", qty: 2 },
      { defId: "mat_amber_gem", qty: 2 },
      { defId: "mat_prism_shard", qty: 2 },
    ],
    desc: "Đúc Huy Hiệu Tro Tàn (Set Tâm Lò) bùng nổ lửa tạo khiên khi HP < 30%.",
  },
  {
    id: "rec_wp_forge_hammer",
    resultDefId: "wp_forge_hammer",
    goldCost: 270,
    materials: [
      { defId: "mat_eclipse_coal", qty: 3 },
      { defId: "mat_amber_gem", qty: 4 },
      { defId: "mat_iron_ore", qty: 6 },
    ],
    desc: "Rèn Búa Tạ Lò Nung (Set Tâm Lò) — đòn thứ 4 đập đất làm choáng 1s.",
  },
  {
    id: "rec_ar_bloodstone_plate",
    resultDefId: "ar_bloodstone_plate",
    goldCost: 280,
    materials: [
      { defId: "mat_blood_shard", qty: 3 },
      { defId: "mat_amber_gem", qty: 4 },
      { defId: "mat_prism_shard", qty: 4 },
    ],
    desc: "Đúc Giáp Huyết Thạch (Set Nhật Thực) tạo khiên 5% MaxHP mỗi mạng hạ gục.",
  },
  {
    id: "rec_wp_eclipse_reaver",
    resultDefId: "wp_eclipse_reaver",
    goldCost: 310,
    materials: [
      { defId: "mat_blood_shard", qty: 3 },
      { defId: "mat_void_prism", qty: 2 },
      { defId: "mat_prism_shard", qty: 4 },
    ],
    desc: "Rèn Lưỡi Hái Nhật Thực (Set Nhật Thực) hút 8% máu & chém lan đòn thứ 4.",
  },
  {
    id: "rec_cs_mirage_vial",
    resultDefId: "cs_mirage_vial",
    goldCost: 35,
    materials: [
      { defId: "mat_ancient_sap", qty: 1 },
      { defId: "mat_glitch_core", qty: 2 },
    ],
    desc: "Chưng cất Lọ Sương Mù Ảo Ảnh — Tàng hình 2.5s cắt aggro & +40% tốc chạy.",
  },
  {
    id: "rec_cs_fate_die",
    resultDefId: "cs_fate_die",
    goldCost: 140,
    materials: [
      { defId: "mat_prism_shard", qty: 3 },
      { defId: "mat_blood_shard", qty: 1 },
    ],
    desc: "Chế tác Xúc Xắc Đổi Mệnh — Dùng tại Lò Rèn để reroll chỉ số phụ trang bị.",
  },
  // === 2 CÔNG THỨC LÒ RÈN ẨN (isHidden: true — ẨN HOÀN TOÀN ĐẾN KHI ĐỦ ĐIỀU KIỆN) ===
  {
    id: "rec_wp_starfall_blade",
    resultDefId: "wp_starfall_blade",
    goldCost: 520,
    materials: [
      { defId: "wp_vanguard_chipped", qty: 1 },
      { defId: "mat_meteor_shard", qty: 2 },
      { defId: "mat_elder_core", qty: 1 },
      { defId: "mat_prism_shard", qty: 6 },
    ],
    isHidden: true,
    isHiddenRecipe: true,
    hiddenUnlockRule: "vanguard_boss2_kill",
    unlockHint: "Mang Kiếm Sứt Mẻ Vệ Binh trong túi khi hạ Boss Vùng 2 (Blight Root).",
    desc: "Đúc lại Thánh Kiếm Sao Rơi từ Kiếm Sứt Mẻ Vệ Binh và Mảnh Đá Sao Rơi.",
  },
  {
    id: "rec_ar_aegis_mantle",
    resultDefId: "ar_aegis_mantle",
    goldCost: 560,
    materials: [
      { defId: "ar_bloodstone_plate", qty: 1 },
      { defId: "ar_briar_cloak", qty: 1 },
      { defId: "mat_eclipse_heart", qty: 1 },
      { defId: "mat_blood_shard", qty: 3 },
    ],
    isHidden: true,
    isHiddenRecipe: true,
    hiddenUnlockRule: "dual_armor_owned",
    unlockHint: "Sở hữu đồng thời Giáp Huyết Thạch và Áo Choàng Gai Cổ Thụ.",
    desc: "Hợp nhất Giáp Huyết Thạch & Áo Choàng Gai thành Chiến Giáp Vệ Binh Bất Diệt.",
  },

  // === BATCH 1 PRODUCTION RECIPES (M1) ===
  {
    id: "rec_b1_refract_lance",
    resultDefId: "b1_wpn_refract_lance",
    goldCost: 135,
    materials: [
      { defId: "mat_quartz_shard", qty: 4 },
      { defId: "mat_prism_shard", qty: 4 },
      { defId: "mat_pigment_cyan", qty: 1 },
    ],
    desc: "Rèn Thương Lăng Kính Khúc Xạ (Lam T3) từ Thạch Anh và Bột Lam Băng Tinh.",
  },
  {
    id: "rec_b1_tempest_astrolabe",
    resultDefId: "b1_wpn_tempest_astrolabe",
    goldCost: 260,
    materials: [
      { defId: "mat_amber_gem", qty: 4 },
      { defId: "mat_quartz_shard", qty: 4 },
      { defId: "mat_pigment_wind", qty: 1 },
      { defId: "mat_pigment_gold", qty: 1 },
    ],
    desc: "Đúc Tinh Bàn Bão Tố (Sử Thi T4) cho Pháp Sư Sắc Độ từ Hổ Phách, Thạch Anh & Bột Phong–Lôi.",
  },

  // === CHẾ TẠO 4 CHÌA KHÓA RƯƠNG GACHA THEO MÙA (BIOME KEYS) ===
  ...GACHA_KEY_RECIPES,
  // === BẢN VẼ CỔ VẬT ẨN (CRAFT-ONLY) ===
  ...HIDDEN_CRAFT_RECIPES,
];

