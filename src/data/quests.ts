import type { QuestDef } from "./types";

export const QUESTS: QuestDef[] = [
  {
    id: "q_intro_slime",
    chapter: "HỒI I · NGỌN ĐÈN CUỐI CÙNG",
    category: "main",
    chainName: "Cốt Truyện Chính (1/10)",
    recommendedLevel: 1,
    title: "Khởi Đầu Tay Không",
    giverNpcId: "npc_elder",
    isMain: true,
    summary: "Dùng nắm đấm ra cổng Tây Thị Trấn tới Đồng Cỏ Xám và thanh tẩy 5 Slime Nhiễu.",
    loreNote: "Đám Slime Nhiễu là những giọt sương mai bị giao thức The Eraser rút cạn sắc xanh, tụ lại gần tường thành để hút hơi ấm còn sót lại.",
    dialogueStart:
      "Chroma-Walker! Ngươi mới thức tỉnh nên hoàn toàn tay không. Hãy dùng nắm đấm ra cổng Tây Đồng Cỏ Xám thanh tẩy 5 Slime Rêu — quay về ta sẽ trao vũ khí sơ khai khớp Class cho ngươi!",
    dialogueActive:
      "Đi qua cổng Tây Thị Trấn là tới Đồng Cỏ Xám. Dùng LMB đấm tay không & né bằng Space (Chroma Dodge) nhé!",
    dialogueComplete:
      "Quả cảm lắm! Cầm lấy vũ khí sơ khai dành riêng cho Class của ngươi — trang bị vào [I] để mở khóa đòn đánh đặc trưng và kỹ năng [E]!",
    objectives: [
      { id: "slimes", kind: "kill_enemy", targetId: "null_slime", required: 5, label: "Hạ Slime Rêu (tay không)" },
    ],
    rewards: {
      gold: 90,
      xp: 95,
      items: [{ defId: "pot_hp", qty: 2 }],
      classRewards: ["starter_weapon"],
    },
  },
  {
    id: "q_lore_echo",
    chapter: "HỒI I · NGỌN ĐÈN CUỐI CÙNG",
    title: "Tiếng Vọng Từ Bia Đá Cổ",
    giverNpcId: "npc_elder",
    prereqQuestId: "q_intro_slime",
    isMain: true,
    summary: "Tìm và nhấn [F] giải mã 1 Bia Ký Cổ Xưa ngay trong Thị Trấn Khởi Nguyên hoặc ngoài cánh đồng.",
    loreNote: "Trước khi bị xóa nhòa, những người sống sót đã khắc lịch sử Đại Phân Rã Trắng và điểm yếu của các Thủ Lĩnh lên 8 Bia Ký Lăng Kính.",
    dialogueStart:
      "Muốn đánh bại The Eraser, ngươi phải hiểu vì sao Kiến Trúc Sư Vaelor lại tạo ra nó. Ngay phía Đông Nam quảng trường thị trấn (gần Trụ Khởi Nguyên) và cạnh lò rèn của Kael có dựng những Bia Ký Lăng Kính cổ. Hãy lại gần bấm [F] để giải mã một tấm!",
    dialogueActive:
      "Các Bia Ký phát ánh sáng ngọc lam nhấp nháy ngay tại quảng trường Thị Trấn (84, 83) hoặc cạnh nhà Thợ Rèn Kael (75, 82). Nhấn [F] để đọc và lưu vào Biên Niên Sử [J]!",
    dialogueComplete:
      "Vậy là ngươi đã nghe được khúc ca thuở đầu... Mỗi Bia Ký giải mã đều ban cho ngươi Bột Sắc Tố quý giá và mở rộng Biên Niên Sử trong Sổ [J].",
    objectives: [
      { id: "lore1", kind: "read_lore", required: 1, label: "Giải mã Bia Ký Cổ Xưa [F]" },
    ],
    rewards: {
      gold: 80,
      xp: 90,
      items: [
        { defId: "pot_coating", qty: 2 },
        { defId: "mat_prism_shard", qty: 2 },
      ],
    },
  },
  {
    id: "q_mine_crystal",
    chapter: "HỒI I · NGỌN ĐÈN CUỐI CÙNG",
    title: "Khai Thác Tinh Thể Sống",
    giverNpcId: "npc_elder",
    prereqQuestId: "q_lore_echo",
    isMain: true,
    summary: "Đánh vỡ 3 mỏ Quặng Sắt hoặc Cụm Tinh Thể rải rác ngoài cổng Tây/Bắc thị trấn.",
    dialogueStart:
      "Lò Rèn Lăng Kính của Kael cần khoáng sản tươi để thức tỉnh phôi thép. Hãy ra ngoài cổng thị trấn, dùng đòn đánh hoặc Tụ Lực khai thác 3 mỏ Quặng Sắt hoặc Thạch Anh!",
    dialogueActive:
      "Các mỏ quặng nằm ngay dọc lối ra cổng Tây và cổng Bắc. Cứ vung vũ khí đánh vỡ chúng để thu hoạch!",
    dialogueComplete:
      "Đống quặng này vẫn còn ngân vang mạch sáng ngầm dưới lòng đất! Mang chúng tới gặp Thợ Rèn Kael ngay thôi.",
    objectives: [
      { id: "mine", kind: "mine_resource", required: 3, label: "Khai thác mỏ quặng/tinh thể" },
    ],
    rewards: {
      gold: 100,
      xp: 105,
      items: [
        { defId: "mat_iron_ore", qty: 4 },
        { defId: "mat_glitch_core", qty: 3 },
      ],
    },
  },
  {
    id: "q_forge_enhance",
    chapter: "HỒI I · NGỌN ĐÈN CUỐI CÙNG",
    title: "Đôi Mắt Của Thợ Rèn Kael",
    giverNpcId: "npc_elder",
    prereqQuestId: "q_mine_crystal",
    isMain: true,
    summary: "Gặp Thợ Rèn Kael (phía Tây quảng trường) và cường hóa bất kỳ trang bị nào lên +1.",
    loreNote: "Kael đã hiến dâng sắc màu trong đôi mắt mình để chiếc Đe Lăng Kính không bao giờ làm vỡ đồ và luôn tích lũy Bảo Hiểm Pity.",
    dialogueStart:
      "Hãy sang gặp Thợ Rèn Kael bên trái quảng trường và cường hóa một món trang bị lên +1. Nhớ rằng ở mốc +3, +5, +7, +10 trang bị sẽ thức tỉnh hiệu ứng đột phá và mở Khe Nhuộm Sắc Tố đấy!",
    dialogueActive: "Thợ Rèn Kael đứng ở phía Tây quảng trường (74, 78). Nhấn [F] rồi mở Lò Rèn Lăng Kính nhé!",
    dialogueComplete:
      "Lưỡi thép đã bắt đầu ngân tiếng hát ánh sáng! Hãy tiến sâu vào Đồng Cỏ Xám để khôi phục Trụ Sắc Màu đầu tiên.",
    objectives: [
      { id: "enh", kind: "enhance_item", required: 1, label: "Cường hóa trang bị (+1)" },
    ],
    rewards: {
      gold: 115,
      xp: 125,
      items: [{ defId: "arm_meadow_mail", qty: 1 }],
    },
  },
  {
    id: "q_waypoint_meadow",
    chapter: "HỒI II · LỜI THỀ ĐỒNG CỎ XÁM",
    title: "Đánh Thức Sắc Màu Thảo Nguyên",
    giverNpcId: "npc_elder",
    prereqQuestId: "q_forge_enhance",
    isMain: true,
    summary: "Tìm và bấm [F] kích hoạt 1 Trụ Sắc Màu ở Đồng Cỏ Xám (Tây Bắc).",
    dialogueStart:
      "Cánh đồng Tây Bắc đang chìm trong màu tro lạnh. Hãy mở Bản đồ [M], tìm Trụ Cửa Ngõ Đồng Cỏ hoặc Trụ Đồi Gió Xám và nhấn [F] truyền năng lượng đánh thức nó!",
    dialogueActive: "Mở Bản đồ [M] để định vị biểu tượng Trụ Sắc Màu đang tắt ở hướng Tây Bắc.",
    dialogueComplete:
      "Thảm cỏ lục bảo và hoa vàng đã bừng nở trở lại! Đặc biệt, khi Trụ Đồi Gió Xám sáng đèn, nó sẽ tiếp thêm Thể Lực cho ngươi khi đối đầu Thủ Lĩnh vùng đấy!",
    objectives: [
      { id: "wp", kind: "activate_waypoint", required: 1, label: "Kích hoạt Trụ Sắc Màu" },
    ],
    rewards: {
      gold: 145,
      xp: 155,
      items: [{ defId: "rng_quartz_eye", qty: 1 }],
    },
  },
  {
    id: "q_clear_camp",
    chapter: "HỒI II · LỜI THỀ ĐỒNG CỎ XÁM",
    title: "Quét Sạch Trại Nhiễu",
    giverNpcId: "npc_elder",
    prereqQuestId: "q_waypoint_meadow",
    isMain: true,
    summary: "Diệt hết quái tại một Trại Quái để giải phong ấn và bấm [F] mở 1 Rương Kho Báu.",
    dialogueStart:
      "Các Trại Quái đang phong ấn nhiều Rương Kho Báu của quân đoàn cũ. Hãy quét sạch quái canh gác một trại bất kỳ rồi mở Rương thu thập trang bị trước khi gặp Thủ Lĩnh!",
    dialogueActive: "Tiêu diệt toàn bộ quái trong một trại để ổ khóa đỏ trên Rương chuyển sang vàng, sau đó bấm [F] mở rương.",
    dialogueComplete:
      "Trang bị đã vững vàng! Giờ hãy lắng nghe câu chuyện bi thương nơi tận cùng Tây Bắc Đồng Cỏ...",
    objectives: [
      { id: "chest", kind: "open_chest", required: 1, label: "Mở Rương Kho Báu bị khóa" },
    ],
    rewards: {
      gold: 165,
      xp: 185,
      items: [
        { defId: "mat_quartz_shard", qty: 4 },
        { defId: "pot_tonic", qty: 2 },
      ],
    },
  },
  {
    id: "q_meadow_boss",
    chapter: "HỒI II · LỜI THỀ ĐỒNG CỎ XÁM",
    title: "Giải Thoát Hình Thiên Vệ Thạch",
    giverNpcId: "npc_elder",
    prereqQuestId: "q_clear_camp",
    isMain: true,
    summary: "Tiến tới Đấu Trường Tây Bắc Đồng Cỏ (16, 18) và giải thoát Boss Hộ Vệ Cổ Thụ — Xing Warden.",
    loreNote: "Linh hồn Hộ Vệ Cổ Thụ mang trái tim Lục Bảo gác đền, canh giữ thánh địa Đồng Cỏ trước làn sóng Xóa Sắc suốt trăm năm.",
    dialogueStart:
      "Ở góc Tây Bắc xa nhất của Đồng Cỏ Xám (gần Trụ Đồi Gió), HỘ VỆ CỔ THỤ — XING WARDEN đang bảo vệ nghiêm ngặt thánh địa. Hãy dùng Tụ Lực (Giữ LMB) hoặc Phản Ứng Nguyên Tố đập vỡ Giáp Nhiễu Trắng trên người ngài ấy!",
    dialogueActive:
      "Hộ Vệ Cổ Thụ ngự tại (16, 18) phía Tây Bắc Trụ Đồi Gió. Hãy né Rễ Trồi Mặt Đất & Bão Lá Cổ Thụ, rồi dùng Tụ Lực phá Giáp Trắng!",
    dialogueComplete:
      "Trái tim Lục Bảo đã bình yên trở lại! Hãy giữ lấy Dây Chuyền Hơi Thở Gió này làm kỷ vật và tiến sang Rừng Thạch Anh!",
    objectives: [
      { id: "boss_warden", kind: "kill_enemy", targetId: "boss_xing_warden", required: 1, label: "Hạ Boss Hộ Vệ Cổ Thụ" },
    ],
    rewards: {
      gold: 240,
      xp: 280,
      items: [
        { defId: "acc_amulet_wind", qty: 1 },
        { defId: "mat_pigment_green", qty: 1 },
      ],
    },
  },
  {
    id: "q_quartz_boss",
    chapter: "HỒI III · GIỌT LỆ RỪNG PHA LÊ",
    title: "Hơi Thở Của Rồng Lăng Kính",
    giverNpcId: "npc_elder",
    prereqQuestId: "q_meadow_boss",
    isMain: true,
    summary: "Tiến vào Rừng Thạch Anh (Đông Bắc) và thanh tẩy Boss Rồng Lăng Kính — Blight Prism.",
    loreNote: "Rồng Lăng Kính hấp thụ tinh thể Thạch Anh qua hàng thế kỷ, điều khiển Mưa Mảnh Khúc Xạ và Hơi Thở Lăng Kính chói lòa.",
    dialogueStart:
      "Tại góc Đông Bắc Rừng Thạch Anh (138, 20), RỒNG LĂNG KÍNH (Blight Prism) đang giam giữ trái tim pha lê của khu rừng bằng Mưa Mảnh Khúc Xạ và Bão Cầu Vồng. Hãy mang ngọn lửa ấm áp tới thanh tẩy nó!",
    dialogueActive:
      "Rồng Lăng Kính ngự tại đấu trường Đông Bắc Rừng Thạch Anh (138, 20). Cẩn thận Hơi Thở Lăng Kính và né vòng sáng Mưa Mảnh Khúc Xạ!",
    dialogueComplete:
      "Đôi cánh pha lê đã dịu ánh sáng trở lại! Trái Tim Pha Lê và Pix-Chip này sẽ dẫn lối ngươi xuống Hầm Mỏ Hổ Phách.",
    objectives: [
      { id: "boss_root", kind: "kill_enemy", targetId: "boss_blight_root", required: 1, label: "Hạ Boss Rồng Lăng Kính" },
    ],
    rewards: {
      gold: 340,
      xp: 400,
      items: [
        { defId: "chp_root_pulse", qty: 1 },
        { defId: "mat_amber_gem", qty: 4 },
      ],
    },
  },
  {
    id: "q_amber_boss",
    chapter: "HỒI IV · KHẾ ƯỚC DUNG NHAM",
    title: "Cơn Thịnh Nộ Của Cùng Kỳ Hổ Phách",
    giverNpcId: "npc_elder",
    prereqQuestId: "q_quartz_boss",
    isMain: true,
    summary: "Tiến xuống Hầm Mỏ Hổ Phách (Tây Nam) và khuất phục Boss Gilded Null.",
    loreNote: "Linh thú hộ mỏ Cùng Kỳ đã nuốt trọn lõi phản ứng Hổ Phách để ngăn lòng đất hóa tro trắng, nhưng ngọn lửa quá tải đã nuốt chửng lý trí của nó.",
    dialogueStart:
      "Dưới đáy Tây Nam Hầm Mỏ Hổ Phách (20, 140), thần thú GILDED NULL đang gầm thét giữa bão lửa và sấm sét. Hãy cường hóa vũ khí lên +5 tại lò của Kael, nhuộm Bột Sắc Tố và dập tắt cơn cuồng nộ của nó!",
    dialogueActive:
      "Gilded Null ở góc Tây Nam (20, 140) có thể để lại vệt nham thạch cháy và gọi sét giáng liên hoàn. Tận dụng Chroma Dodge để lướt phản kích!",
    dialogueComplete:
      "Lò phản ứng Hổ Phách đã ổn định, hơi ấm lan tỏa khắp đại lục! Ngươi đã sẵn sàng bước vào Phế Tích Vô Sắc — nơi Vaelor để lại cỗ máy cuối cùng.",
    objectives: [
      { id: "boss_amber", kind: "kill_enemy", targetId: "boss_gilded_null", required: 1, label: "Hạ Boss Gilded Null" },
    ],
    rewards: {
      gold: 500,
      xp: 560,
      items: [{ defId: "charm_undying", qty: 1 }],
      classRewards: ["amber_weapon"],
    },
  },
  {
    id: "q_final_eraser",
    chapter: "HỒI V · BẢN GIAO HƯỞNG THẤT SẮC",
    title: "Chấm Dứt Đại Phân Rã Trắng",
    giverNpcId: "npc_elder",
    prereqQuestId: "q_amber_boss",
    isMain: true,
    summary: "Tiến vào Đấu Trường Vô Sắc (140, 140) ở Đông Nam và đánh bại World Boss THE ERASER!",
    loreNote: "Lời trăn trối của Kiến Trúc Sư Vaelor: Khi The Eraser dựng Khiên Vô Sắc ở 65% và 30% HP, hãy đánh thắp sáng các Trụ Totem Sắc Màu quanh đấu trường để bắn vỡ khiên của nó!",
    dialogueStart:
      "Thời khắc định mệnh của Aethel-16 đã điểm! THE ERASER đang chờ tại Thánh Địa Đông Nam (140, 140). Hãy nhớ lời dặn trong Bia Ký của Vaelor: khi nó dựng Khiên Vô Sắc rút cạn màu sắc đấu trường, hãy lập tức đánh thắp sáng các Trụ Sắc Màu Cộng Hưởng ở 4 góc để xuyên thủng trái tim nó!",
    dialogueActive:
      "Đấu trường The Eraser nằm tại (140, 140) góc Đông Nam. Mở càng nhiều Trụ Sắc Màu trên bản đồ, ngươi càng nhận được Cộng Hưởng Chroma-Walker mạnh mẽ trong trận chiến cuối!",
    dialogueComplete:
      "BẦU TRỜI 16-BIT ĐÃ SỐNG LẠI! Khi đôi cánh trắng của The Eraser tan thành muôn vàn cánh hoa bảy sắc, ngay cả ký ức về nụ cười của bé Iris năm xưa cũng đã được trả về với gió. Cảm ơn ngươi, Huyền Thoại Chroma-Walker!",
    objectives: [
      { id: "eraser", kind: "kill_enemy", targetId: "boss_the_eraser", required: 1, label: "Thanh tẩy World Boss The Eraser" },
    ],
    rewards: {
      gold: 1500,
      xp: 1200,
      items: [{ defId: "mat_origin_star", qty: 1 }],
      classRewards: ["ruins_weapon"],
    },
  },

  // === 12 CHAINED SIDE QUESTS (4 CHUỖI NHIỆM VỤ PHỤ × 3 BƯỚC) ===
  // Chuỗi 1: Ký Ức Đôi Mắt Của Kael (Blacksmith)
  {
    id: "sq_kael_1",
    chapter: "PHỤ TUYẾN · LÒ RÈN LĂNG KÍNH",
    category: "side",
    chainName: "Ký Ức Đôi Mắt Kael (1/3)",
    recommendedLevel: 1,
    title: "Than Hồng Đầu Ngày",
    giverNpcId: "npc_blacksmith",
    summary: "Khai thác 2 mỏ quặng bất kỳ bên ngoài cổng Thị Trấn giúp Thợ Rèn Kael nhen lửa bệ Ma Trận.",
    dialogueStart:
      "Này tân binh! Đừng vội ra đấu trường tay trắng. Hãy đập giúp ta 2 mỏ quặng gần cổng Tây, ta sẽ tặng đôi Giày Tân Binh và phôi sắt mở đường!",
    dialogueActive: "Mỏ quặng sắt lấp lánh ngay ngoài cổng Tây & Bắc Thị Trấn. Đánh vỡ 2 mỏ là đủ.",
    dialogueComplete: "Tốt lắm! Đôi giày da này giúp ngươi lướt né nhẹ chân hơn hẳn ngoài cánh đồng đấy.",
    objectives: [
      { id: "k_ores", kind: "mine_resource", required: 2, label: "Khai thác 2 mỏ khoáng sản" },
    ],
    rewards: {
      gold: 80,
      xp: 90,
      items: [
        { defId: "bts_starter", qty: 1 },
        { defId: "mat_iron_ore", qty: 3 },
      ],
    },
  },
  {
    id: "sq_kael_2",
    chapter: "PHỤ TUYẾN · LÒ RÈN LĂNG KÍNH",
    category: "side",
    chainName: "Ký Ức Đôi Mắt Kael (2/3)",
    recommendedLevel: 4,
    prereqQuestId: "sq_kael_1",
    title: "Phấn Cánh Bọ Xám",
    giverNpcId: "npc_blacksmith",
    summary: "Rèn/cường hóa bất kỳ trang bị nào 1 lần tại Ma Trận & hạ 4 Bọ Xám Phóng ở Đồng Cỏ Xám.",
    dialogueStart:
      "Vỏ cánh của Bọ Diệp Lục chứa bụi tĩnh điện giúp giữ nhiệt cho Ma Trận Luyện Khí. Hãy thử luyện +1 một món đồ rồi đi săn 4 Bọ Diệp Lục về cho ta!",
    dialogueActive: "Thử vận linh Ma Trận 1 lần rồi săn 4 Bọ Diệp Lục ở Đồng Cỏ Xám.",
    dialogueComplete: "Hoàn hảo! Nhúm Mảnh Lăng Kính & Thạch Anh này đủ để ngươi đúc xúc tác vượt ngưỡng +4.",
    objectives: [
      { id: "k_enh", kind: "enhance_item", required: 1, label: "Luyện đồ trong Ma Trận 1 lần" },
      { id: "k_hop", kind: "kill_enemy", targetId: "ash_hopper", required: 4, label: "Hạ Bọ Diệp Lục" },
    ],
    rewards: {
      gold: 140,
      xp: 160,
      items: [
        { defId: "mat_prism_shard", qty: 4 },
        { defId: "mat_quartz_shard", qty: 3 },
      ],
    },
  },
  {
    id: "sq_kael_3",
    chapter: "PHỤ TUYẾN · LÒ RÈN LĂNG KÍNH",
    category: "side",
    chainName: "Ký Ức Đôi Mắt Kael (3/3)",
    recommendedLevel: 9,
    prereqQuestId: "sq_kael_2",
    title: "Búa Thép & Khảm Sắc",
    giverNpcId: "npc_blacksmith",
    summary: "Nhuộm Sắc Tố nguyên tố (+5) cho 1 trang bị & hạ 5 Cua Thạch Anh.",
    dialogueStart:
      "Đỉnh cao của rèn đúc là Khảm Sắc tại cấp +5! Hãy nhuộm Bột Sắc Tố vào một món trang bị và đập tan lớp Giáp Trắng của 5 Cua Thạch Anh!",
    dialogueActive: "Đưa một trang bị lên +5 rồi khảm Sắc Tố tại tab Luyện Ma Trận, sau đó hạ 5 Cua Thạch Anh.",
    dialogueComplete: "Thần binh thực thụ đã thành hình! Nhận lấy Mũ Thạch Anh Quang Tuyến — báu vật cuối cùng ta rèn bằng đôi mắt sáng!",
    objectives: [
      { id: "k_inf", kind: "infuse_item", required: 1, label: "Khảm Sắc Tố nguyên tố (+5)" },
      { id: "k_stk", kind: "kill_enemy", targetId: "quartz_stalker", required: 5, label: "Hạ Cua Thạch Anh" },
    ],
    rewards: {
      gold: 280,
      xp: 320,
      items: [
        { defId: "hlm_quartz_visor", qty: 1 },
        { defId: "mat_pigment_gold", qty: 1 },
      ],
    },
  },

  // Chuỗi 2: Thương Lộ Sắc Màu (Merchant Mira)
  {
    id: "sq_mira_1",
    chapter: "PHỤ TUYẾN · THƯƠNG HỘI MIRA",
    category: "side",
    chainName: "Thương Lộ Sắc Màu (1/3)",
    recommendedLevel: 1,
    title: "Mở Đường Giao Thương",
    giverNpcId: "npc_merchant",
    summary: "Thanh tẩy 4 Slime Rêu và 2 Bọ Diệp Lục quanh tuyến đường cổng Tây cho đoàn buôn của Mira.",
    dialogueStart:
      "Chào Chroma-Walker! Các đoàn xe chở dược phẩm của ta đang bị lũ quái Đồng Cỏ Xám chặn ngay cửa ngõ. Dọn giúp ta 4 Slime Rêu & 2 Bọ Diệp Lục, ta tặng ngay Nhẫn Đồng Mở Khóa Tuyệt Kỹ [Q]!",
    dialogueActive: "Chỉ cần dẹp 4 Slime Rêu và 2 Bọ Diệp Lục ở Đồng Cỏ Xám phía Tây Thị Trấn.",
    dialogueComplete: "Đường đã thông thoáng rồi! Hãy đeo Nhẫn Đồng này vào để mở khóa Tuyệt Kỹ [Q] và cầm theo Dầu Phủ Quang Phổ!",
    objectives: [
      { id: "m_slm", kind: "kill_enemy", targetId: "null_slime", required: 4, label: "Hạ Slime Rêu" },
      { id: "m_hop", kind: "kill_enemy", targetId: "ash_hopper", required: 2, label: "Hạ Bọ Diệp Lục" },
    ],
    rewards: {
      gold: 95,
      xp: 105,
      items: [
        { defId: "rng_copper", qty: 1 },
        { defId: "pot_coating", qty: 2 },
      ],
    },
  },
  {
    id: "sq_mira_2",
    chapter: "PHỤ TUYẾN · THƯƠNG HỘI MIRA",
    category: "side",
    chainName: "Thương Lộ Sắc Màu (2/3)",
    recommendedLevel: 6,
    prereqQuestId: "sq_mira_1",
    title: "Thí Nghiệm Phản Ứng Kép",
    giverNpcId: "npc_merchant",
    summary: "Kích nổ 6 Phản Ứng Nguyên Tố & hạ 4 Lăng Kính Trôi ở Rừng Thạch Anh.",
    dialogueStart:
      "Thương hội cần dữ liệu phản ứng thực chiến từ Rừng Thạch Anh! Hãy kích hoạt 6 Phản Ứng Nguyên Tố và dẹp 4 Lăng Kính Trôi nhé.",
    dialogueActive: "Đánh 2 nguyên tố khác nhau liên tiếp để nổ phản ứng (xem sổ [H]) và săn 4 Lăng Kính Trôi.",
    dialogueComplete: "Tuyệt đỉnh quang phổ! Đây là 3 Thuốc Cường Lực & Bột Sắc Tố Băng dành riêng cho ngươi.",
    objectives: [
      { id: "m_rea", kind: "trigger_reaction", required: 6, label: "Kích nổ 6 Phản Ứng Nguyên Tố" },
      { id: "m_imp", kind: "kill_enemy", targetId: "static_imp", required: 4, label: "Hạ Lăng Kính Trôi" },
    ],
    rewards: {
      gold: 180,
      xp: 210,
      items: [
        { defId: "pot_tonic", qty: 3 },
        { defId: "mat_pigment_cyan", qty: 1 },
      ],
    },
  },
  {
    id: "sq_mira_3",
    chapter: "PHỤ TUYẾN · THƯƠNG HỘI MIRA",
    category: "side",
    chainName: "Thương Lộ Sắc Màu (3/3)",
    recommendedLevel: 12,
    prereqQuestId: "sq_mira_2",
    title: "Kho Báu Mỏ Hổ Phách",
    giverNpcId: "npc_merchant",
    summary: "Mở 1 Rương Kho Báu và tiêu diệt 5 Bọ Giáp Hổ Phách dưới Hầm Mỏ Tây Nam.",
    dialogueStart:
      "Đoàn thám hiểm của ta đánh rơi một lô báu vật dưới Hầm Mỏ Hổ Phách. Hãy hạ 5 Bọ Giáp Hổ Phách và mở 1 Rương Kho Báu để thu hồi hàng hóa!",
    dialogueActive: "Xuống Hầm Mỏ Hổ Phách (Tây Nam) hạ 5 Bọ Giáp Hổ Phách & giải phong ấn 1 Rương Kho Báu.",
    dialogueComplete: "Gia tài thương hội đã được cứu! Đôi Giày Bước Hổ Phách & Bột Thất Sắc này xứng đáng thuộc về ngươi!",
    objectives: [
      { id: "m_btl", kind: "kill_enemy", targetId: "amber_beetle", required: 5, label: "Hạ Bọ Giáp Hổ Phách" },
      { id: "m_chs", kind: "open_chest", required: 1, label: "Mở 1 Rương Kho Báu" },
    ],
    rewards: {
      gold: 340,
      xp: 390,
      items: [
        { defId: "bts_amber_treads", qty: 1 },
        { defId: "mat_pigment_chroma", qty: 1 },
      ],
    },
  },

  // Chuỗi 3: Cổ Ngữ Aethel-16 (Elder Elian)
  {
    id: "sq_elian_1",
    chapter: "PHỤ TUYẾN · BIÊN NIÊN SỬ",
    category: "side",
    chainName: "Cổ Ngữ Aethel-16 (1/3)",
    recommendedLevel: 2,
    title: "Dấu Tích Tiền Nhân",
    giverNpcId: "npc_elder",
    summary: "Giải mã 2 Bia Ký Lăng Kính cổ xưa (có 2 tấm ngay trong Thị Trấn Khởi Nguyên!).",
    dialogueStart:
      "Trước khi bước xa khỏi thành lũy, hãy đọc lại ký ức khắc trên 2 Bia Ký Cổ Xưa quanh quảng trường. Phần thưởng là chiếc Mũ Sơ Khai giúp ngươi cứng cáp hơn nhiều!",
    dialogueActive: "Tìm các bia đá có viên ngọc tím phát sáng trong Thị Trấn hoặc ngoài cánh đồng và nhấn [F].",
    dialogueComplete: "Tri thức cổ đại sẽ soi sáng bước chân ngươi! Nhận lấy Mũ Tân Binh Sơ Khai này.",
    objectives: [
      { id: "e_lor2", kind: "read_lore", required: 2, label: "Giải mã 2 Bia Ký Cổ Xưa" },
    ],
    rewards: {
      gold: 110,
      xp: 120,
      items: [
        { defId: "hlm_starter", qty: 1 },
        { defId: "mat_prism_shard", qty: 2 },
      ],
    },
  },
  {
    id: "sq_elian_2",
    chapter: "PHỤ TUYẾN · BIÊN NIÊN SỬ",
    category: "side",
    chainName: "Cổ Ngữ Aethel-16 (2/3)",
    recommendedLevel: 7,
    prereqQuestId: "sq_elian_1",
    title: "Thắp Sáng Mạng Trụ",
    giverNpcId: "npc_elder",
    summary: "Kích hoạt thêm 2 Trụ Sắc Màu ở các vùng đất ngoài Thị Trấn để mở mạng Dịch Chuyển [M].",
    dialogueStart:
      "Mạng lưới Trụ Sắc Màu không chỉ giúp Dịch Chuyển Nhanh mà còn tăng sức mạnh Cộng Hưởng trước The Eraser. Hãy thắp sáng 2 Trụ mới!",
    dialogueActive: "Mở Bản Đồ [M] tìm các Trụ Sắc Màu còn xám (tắt) và bấm [F] đánh thức.",
    dialogueComplete: "Ánh sáng đang lan tỏa trở lại! Tặng ngươi Mảnh Pix-Chip Cơ Bản đeo vào ô Phụ Kiện.",
    objectives: [
      { id: "e_wp2", kind: "activate_waypoint", required: 2, label: "Kích hoạt 2 Trụ Sắc Màu" },
    ],
    rewards: {
      gold: 200,
      xp: 230,
      items: [
        { defId: "chp_basic", qty: 1 },
        { defId: "mat_quartz_shard", qty: 4 },
      ],
    },
  },
  {
    id: "sq_elian_3",
    chapter: "PHỤ TUYẾN · BIÊN NIÊN SỬ",
    category: "side",
    chainName: "Cổ Ngữ Aethel-16 (3/3)",
    recommendedLevel: 13,
    prereqQuestId: "sq_elian_2",
    title: "Bức Thư Cuối Của Vaelor",
    giverNpcId: "npc_elder",
    summary: "Thu thập ký ức từ 5 Bia Ký Cổ Xưa trên khắp Aethel-16 để nhận Bùa Hồi Sinh Bất Diệt.",
    dialogueStart:
      "Kiến Trúc Sư Vaelor đã giấu bí mật chống lại Đại Phân Rã Trắng trong 8 Bia Ký. Giải mã 5 tấm, ta sẽ trao Bùa Hộ Mệnh Bất Diệt cứu mạng trước đòn chí tử!",
    dialogueActive: "Theo dõi dấu chấm tím trên Bản Đồ [M] & Minimap để tìm đủ 5 Bia Ký.",
    dialogueComplete: "Toàn bộ sự thật về bé Iris và Aethel-16 đã sáng tỏ. Hãy giữ chặt Bùa Bất Diệt này!",
    objectives: [
      { id: "e_lor5", kind: "read_lore", required: 5, label: "Giải mã tổng cộng 5 Bia Ký" },
    ],
    rewards: {
      gold: 380,
      xp: 420,
      items: [
        { defId: "charm_undying", qty: 1 },
        { defId: "mat_pigment_void", qty: 1 },
      ],
    },
  },

  // Chuỗi 4: Thợ Săn Tinh Anh (Đảm bảo vũ khí khớp Class mọi giai đoạn!)
  {
    id: "sq_hunt_1",
    chapter: "PHỤ TUYẾN · THỢ SĂN TINH ANH",
    category: "side",
    chainName: "Thợ Săn Tinh Anh (1/3)",
    recommendedLevel: 4,
    prereqQuestId: "q_intro_slime",
    title: "Thử Thách Đồng Cỏ Xám",
    giverNpcId: "npc_elder",
    summary: "Hạ 6 Bọ Diệp Lục & mở 1 Rương Kho Báu để nhận Vũ Khí Thảo Nguyên chuẩn Class.",
    dialogueStart:
      "Sau khi quen tay với vũ khí sơ khai, hãy thử thách bản thân trước bầy Bọ Diệp Lục & mở Rương Trại Quái — phần thưởng là Vũ Khí Thảo Nguyên (Lam/Lục) đúng hệ của ngươi!",
    dialogueActive: "Hạ 6 Bọ Diệp Lục và mở 1 Rương Kho Báu ngoài Đồng Cỏ Xám.",
    dialogueComplete: "Sắc bén tuyệt vời! Nhận lấy Vũ Khí Thảo Nguyên được rèn khớp hệ chiến đấu của ngươi!",
    objectives: [
      { id: "h_hop", kind: "kill_enemy", targetId: "ash_hopper", required: 6, label: "Hạ Bọ Diệp Lục" },
      { id: "h_chs", kind: "open_chest", required: 1, label: "Mở 1 Rương Kho Báu" },
    ],
    rewards: {
      gold: 150,
      xp: 180,
      classRewards: ["meadow_weapon"],
    },
  },
  {
    id: "sq_hunt_2",
    chapter: "PHỤ TUYẾN · THỢ SĂN TINH ANH",
    category: "side",
    chainName: "Thợ Săn Tinh Anh (2/3)",
    recommendedLevel: 9,
    prereqQuestId: "sq_hunt_1",
    title: "Thợ Săn Rừng Pha Lê",
    giverNpcId: "npc_blacksmith",
    summary: "Tiêu diệt 5 Dơi Pha Lê & 4 Cua Thạch Anh để nhận Thần Khí Thạch Anh khớp Class!",
    dialogueStart:
      "Rừng Thạch Anh là vùng đất đầy bầy Dơi Pha Lê tốc độ cao và Cua Thạch Anh có khiên tinh thể. Quét sạch chúng, ta sẽ xuất xưởng Vũ Khí Quý Hiếm chuẩn Class cho ngươi!",
    dialogueActive: "Săn 5 Dơi Pha Lê và 4 Cua Thạch Anh tại Rừng Thạch Anh (Đông Bắc).",
    dialogueComplete: "Khí thế ngút trời! Cầm lấy Vũ Khí Rừng Thạch Anh cùng Bột Sắc Tố Gió này!",
    objectives: [
      { id: "h_hnd", kind: "kill_enemy", targetId: "bleach_hound", required: 5, label: "Hạ Dơi Pha Lê" },
      { id: "h_stk", kind: "kill_enemy", targetId: "quartz_stalker", required: 4, label: "Hạ Cua Thạch Anh" },
    ],
    rewards: {
      gold: 290,
      xp: 340,
      items: [{ defId: "mat_pigment_wind", qty: 1 }],
      classRewards: ["quartz_weapon"],
    },
  },
  {
    id: "sq_hunt_3",
    chapter: "PHỤ TUYẾN · THỢ SĂN TINH ANH",
    category: "side",
    chainName: "Thợ Săn Tinh Anh (3/3)",
    recommendedLevel: 15,
    prereqQuestId: "sq_hunt_2",
    title: "Khảo Nghiệm Dũng Sĩ Hổ Phách",
    giverNpcId: "npc_elder",
    summary: "Thanh tẩy 5 Quỷ Than Nham & 3 Khổng Lồ Lăng Kính để rước Vũ Khí Sử Thi Hổ Phách chuẩn Class!",
    dialogueStart:
      "Trước ngưỡng cửa đối đầu The Eraser, hãy chứng minh thực lực qua việc hạ gục 5 Quỷ Than Nham ở Mỏ Hổ Phách & 3 Khổng Lồ Lăng Kính tại Phế Tích Vô Sắc!",
    dialogueActive: "Săn 5 Quỷ Than Nham (Tây Nam) & 3 Khổng Lồ Lăng Kính (Đông Nam).",
    dialogueComplete: "Huyền thoại đã thành hình! Vũ Khí Hổ Phách đỉnh cao cùng Lăng Kính Hư Không nay thuộc về ngươi!",
    objectives: [
      { id: "h_cnd", kind: "kill_enemy", targetId: "cinder_imp", required: 5, label: "Hạ Quỷ Than Nham" },
      { id: "h_glm", kind: "kill_enemy", targetId: "prism_golem", required: 3, label: "Hạ Khổng Lồ Lăng Kính" },
    ],
    rewards: {
      gold: 480,
      xp: 560,
      items: [
        { defId: "mat_void_prism", qty: 3 },
        { defId: "mat_pigment_quake", qty: 1 },
      ],
      classRewards: ["amber_weapon"],
    },
  },

  // === 3 REPEATABLE BOUNTY QUESTS ===
  {
    id: "q_bounty_hunt",
    chapter: "BẢNG TRUY NÃ",
    category: "bounty",
    recommendedLevel: 2,
    title: "[Truy Nã] Tuần Tiễu Glitchborn",
    giverNpcId: "npc_elder",
    repeatable: true,
    summary: "(Lặp lại) Thanh tẩy 8 quái Glitchborn bất kỳ để kiếm Vàng & Lõi Glitch.",
    dialogueStart:
      "Đội tuần tra thị trấn luôn cần người dọn dẹp quái nhiễm nhiễu quanh các tuyến đường. Hạ 8 Glitchborn bất kỳ để lĩnh thưởng!",
    dialogueActive: "Hạ bất kỳ quái Glitchborn nào ngoài thị trấn đều được tính vào bảng truy nã.",
    dialogueComplete: "Làm tốt lắm! Đây là tiền thưởng tuần tiễu của ngươi.",
    objectives: [
      { id: "any_mobs", kind: "kill_any", required: 8, label: "Hạ Glitchborn bất kỳ" },
    ],
    rewards: {
      gold: 125,
      xp: 115,
      items: [
        { defId: "mat_glitch_core", qty: 3 },
        { defId: "pot_hp", qty: 1 },
      ],
    },
  },
  {
    id: "q_bounty_ore",
    chapter: "BẢNG TRUY NÃ",
    category: "bounty",
    recommendedLevel: 1,
    title: "[Truy Nã] Tiếp Lửa Lò Rèn",
    giverNpcId: "npc_blacksmith",
    repeatable: true,
    summary: "(Lặp lại) Khai thác 5 mỏ khoáng sản/tinh thể để đổi Vàng, Mảnh Lăng Kính & Hổ Phách.",
    dialogueStart:
      "Lò Lăng Kính của ta cháy ngày đêm không nghỉ! Đập giúp ta 5 mỏ khoáng sản ngoài kia, ta thưởng cả Mảnh Lăng Kính lẫn Hổ Phách!",
    dialogueActive: "Các mỏ quặng tự hồi sinh sau ~30 giây khắp các vùng đất.",
    dialogueComplete: "Quặng chuẩn sắc độ lắm! Cầm lấy phần thưởng của thợ rèn này!",
    objectives: [
      { id: "ores", kind: "mine_resource", required: 5, label: "Khai thác mỏ khoáng sản" },
    ],
    rewards: {
      gold: 140,
      xp: 100,
      items: [
        { defId: "mat_prism_shard", qty: 2 },
        { defId: "mat_amber_gem", qty: 1 },
      ],
    },
  },
  {
    id: "q_bounty_reaction",
    chapter: "NGHIÊN CỨU SẮC ĐỘ",
    category: "bounty",
    recommendedLevel: 3,
    title: "[Thử Nghiệm] Cộng Hưởng Nguyên Tố",
    giverNpcId: "npc_merchant",
    repeatable: true,
    summary: "(Lặp lại) Kích hoạt 4 lần Phản Ứng Nguyên Tố lên quái (dùng Chroma Mage, Dầu Phủ [4] hoặc Vũ khí +5 nhuộm sắc).",
    dialogueStart:
      "Ta đang thu thập dữ liệu phổ màu thực chiến! Hãy dùng kỹ năng nguyên tố, Dầu Phủ Quang Phổ [4] hoặc Vũ khí +5 đã nhuộm bột màu để kích nổ 4 lần Phản Ứng Nguyên Tố nhé!",
    dialogueActive:
      "Đánh 2 nguyên tố khác nhau liên tiếp lên cùng 1 mục tiêu để kích nổ Phản Ứng (Sốc Nhiệt, Bùng Độc, Siêu Dẫn, Quá Tải...).",
    dialogueComplete:
      "Số liệu quang phổ đẹp mê hồn! Tặng ngươi Dầu Phủ Quang Phổ và Bột Sắc Tố để tha hồ phối chiêu!",
    objectives: [
      { id: "reacts", kind: "trigger_reaction", required: 4, label: "Kích nổ Phản Ứng Nguyên Tố" },
    ],
    rewards: {
      gold: 150,
      xp: 130,
      items: [
        { defId: "pot_coating", qty: 2 },
        { defId: "mat_pigment_red", qty: 1 },
      ],
    },
  },
];

export function getQuestDef(id: string): QuestDef | undefined {
  return QUESTS.find((q) => q.id === id);
}
