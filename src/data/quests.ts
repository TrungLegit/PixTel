import type { QuestDef } from "./types";

export const QUESTS: QuestDef[] = [
  {
    id: "q_intro_slime",
    chapter: "HỒI I · NGỌN ĐÈN CUỐI CÙNG",
    title: "Khởi Đầu Thanh Tẩy",
    giverNpcId: "npc_elder",
    isMain: true,
    summary: "Ra khỏi cổng Tây Thị Trấn tới Đồng Cỏ Xám và thanh tẩy 5 Slime Nhiễu.",
    loreNote: "Đám Slime Nhiễu là những giọt sương mai bị giao thức The Eraser rút cạn sắc xanh, tụ lại gần tường thành để hút hơi ấm còn sót lại.",
    dialogueStart:
      "Chroma-Walker! Màn sương Nhiễu Trắng đang áp sát cổng Tây. Hãy ra Đồng Cỏ Xám thanh tẩy 5 Slime Nhiễu — thử kết hợp chuỗi Combo 3 nhịp và lướt đúng khoảnh khắc (Chroma Dodge) để làm chủ nhịp chiến đấu!",
    dialogueActive:
      "Đi qua cổng Tây Thị Trấn là tới Đồng Cỏ Xám. Nhớ chú ý Vòng Thể Lực và lướt Space đúng lúc đòn đánh chạm tới để kích hoạt Chroma Dodge nhé!",
    dialogueComplete:
      "Ánh sáng trong con ngươi của ngươi thật sự có thể đẩy lùi sương trắng! Cầm lấy thanh Lưỡi Quang Thảo Nguyên này — hành trình khôi phục Aethel-16 vừa mới bắt đầu.",
    objectives: [
      { id: "slimes", kind: "kill_enemy", targetId: "null_slime", required: 5, label: "Hạ Slime Nhiễu" },
    ],
    rewards: {
      gold: 90,
      xp: 95,
      items: [
        { defId: "wpn_meadow_edge", qty: 1 },
        { defId: "pot_hp", qty: 2 },
      ],
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
    summary: "Tiến tới Đấu Trường Tây Bắc Đồng Cỏ (16, 18) và giải thoát Boss Hình Thiên Vệ Thạch.",
    loreNote: "Tướng quân Hình Thiên đã tự phong ấn đầu mình để không bị Nhiễu Trắng thôi miên, nhưng tấm khiên và thân xác ông đã hóa đá xám canh giữ thảo nguyên suốt trăm năm.",
    dialogueStart:
      "Ở góc Tây Bắc xa nhất của Đồng Cỏ Xám (gần Trụ Đồi Gió), linh hồn Tướng quân Hình Thiên vẫn bị giam trong lớp vỏ đá XING WARDEN. Hãy dùng Tụ Lực (Giữ LMB) hoặc Phản Ứng Nguyên Tố đập vỡ Giáp Nhiễu Trắng trên người ông ấy và ban cho người lính già sự giải thoát!",
    dialogueActive:
      "Hình Thiên Vệ Thạch ngự tại (16, 18) phía Tây Bắc Trụ Đồi Gió. Hãy né đòn quạt rìu hình nón và dùng Tụ Lực phá vỡ Giáp Trắng của ông ấy!",
    dialogueComplete:
      "Khi lớp đá xám vỡ tan, ông ấy đã mỉm cười cúi chào ngươi trước khi hóa thành làn gió xanh... Hãy giữ lấy Dây Chuyền Hơi Thở Gió này làm kỷ vật và tiến sang Rừng Thạch Anh!",
    objectives: [
      { id: "boss_warden", kind: "kill_enemy", targetId: "boss_xing_warden", required: 1, label: "Hạ Boss Hình Thiên Vệ Thạch" },
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
    title: "Trái Tim Đóng Băng Của Cây Mẹ",
    giverNpcId: "npc_elder",
    prereqQuestId: "q_meadow_boss",
    isMain: true,
    summary: "Tiến vào Rừng Thạch Anh (Đông Bắc) và thanh tẩy Boss Cổ Thụ Blight Root.",
    loreNote: "Cây Mẹ của khu rừng đã tự đóng băng nhựa sống thành Thạch Anh để giam cầm bào tử hư vô, biến dạng thành Blight Root.",
    dialogueStart:
      "Tại góc Đông Bắc Rừng Thạch Anh (138, 20), Cây Mẹ năm xưa nay đã hóa thành BLIGHT ROOT — liên tục giáng Mưa Pha Lê và rễ độc. Hãy mang theo lửa ấm và sắc màu thanh tẩy nỗi đau của khu rừng!",
    dialogueActive:
      "Blight Root ẩn náu tại đấu trường Đông Bắc Rừng Thạch Anh. Cẩn thận các bóng tròn Mưa Thạch Anh rơi từ vòm trời và hố rễ giữ chân!",
    dialogueComplete:
      "Những nhành cây pha lê đã nở hoa tím trở lại! Trái Tim Pha Lê và Pix-Chip Cổ Thụ này sẽ dẫn lối ngươi xuống Hầm Mỏ Hổ Phách.",
    objectives: [
      { id: "boss_root", kind: "kill_enemy", targetId: "boss_blight_root", required: 1, label: "Hạ Boss Blight Root" },
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
      items: [
        { defId: "wpn_amber_fury", qty: 1 },
        { defId: "charm_undying", qty: 1 },
      ],
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
      items: [
        { defId: "wpn_chroma_sovereign", qty: 1 },
        { defId: "mat_origin_star", qty: 1 },
      ],
    },
  },

  // === 3 REPEATABLE BOUNTY QUESTS ===
  {
    id: "q_bounty_hunt",
    chapter: "BẢNG TRUY NÃ",
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
