import type { QuestDef } from "./types";

export const QUESTS: QuestDef[] = [
  {
    id: "q_intro_slime",
    title: "Khởi Đầu Tay Không",
    giverNpcId: "npc_elder",
    isMain: true,
    summary: "Dùng nắm đấm ra cổng Tây đánh bại 4 Slime Nhiễu để chứng minh bản thân và nhận vũ khí đầu tiên.",
    dialogueStart:
      "Chroma-Walker! Ngươi mới thức tỉnh nên chưa có trang bị nào trên người. Hãy dùng nắm đấm ra cổng Tây hạ 4 Slime Nhiễu ở Đồng Cỏ Xám — quay về ta sẽ trao vũ khí sơ khai của Class cho ngươi!",
    dialogueActive: "Slime Nhiễu ở ngay ngoài cổng Tây. Hãy né đòn bằng Space và dồn từng con một bằng tay không!",
    dialogueComplete: "Quả cảm lắm! Đây là vũ khí chuẩn mực của Class ngươi — trang bị vào [I] để mở khóa đòn đánh đặc trưng và kỹ năng [E]!",
    objectives: [
      { id: "slimes", kind: "kill_enemy", targetId: "null_slime", required: 4, label: "Hạ Slime Nhiễu (tay không)" },
    ],
    rewards: {
      gold: 75,
      xp: 100,
      items: [{ defId: "pot_hp", qty: 2 }],
      classRewards: ["starter_weapon"],
    },
  },
  {
    id: "q_mine_crystal",
    title: "Khai Thác Tinh Thể",
    giverNpcId: "npc_elder",
    prereqQuestId: "q_intro_slime",
    isMain: true,
    summary: "Đánh vỡ 3 mỏ Quặng Sắt hoặc Cụm Tinh Thể ngoài thị trấn để rèn bộ giáp đầu tiên.",
    dialogueStart:
      "Giờ đã có vũ khí và lên cấp, hãy mở Túi [I] cộng điểm tiềm năng! Sau đó ra ngoài thị trấn khai thác 3 mỏ quặng mang về làm nguyên liệu đúc Giáp & Bùa Ma Trận.",
    dialogueActive: "Dùng vũ khí mới đánh vào các mỏ quặng lấp lánh ngay ngoài cổng Tây hoặc cổng Bắc!",
    dialogueComplete: "Tuyệt lắm! Đám quặng này đủ cho Kael gia công Giáp chiến cho riêng Class của ngươi rồi.",
    objectives: [
      { id: "mine", kind: "mine_resource", required: 3, label: "Khai thác mỏ quặng/tinh thể" },
    ],
    rewards: {
      gold: 105,
      xp: 120,
      items: [
        { defId: "mat_iron_ore", qty: 4 },
        { defId: "mat_glitch_core", qty: 3 },
        { defId: "mat_matrix_rune", qty: 1 },
      ],
      classRewards: ["uncommon_armor"],
    },
  },
  {
    id: "q_forge_enhance",
    title: "Ma Trận Luyện Khí",
    giverNpcId: "npc_elder",
    prereqQuestId: "q_mine_crystal",
    isMain: true,
    summary: "Gặp Thợ Rèn Kael ở phía Tây quảng trường, ghép trang bị vào Ma Trận và luyện thành công +1.",
    dialogueStart:
      "Hãy sang nói chuyện với Thợ Rèn Kael ở bên trái quảng trường! Ông ấy sẽ dẫn ngươi dùng Ma Trận Luyện Khí ghép nguyên liệu luyện trang bị lên +1 và khai mở dòng chỉ số ẩn.",
    dialogueActive: "Thợ Rèn Kael đứng ngay phía Tây quảng trường (bấm [F]). Hãy thử đặt trang bị vào tâm Ma Trận!",
    dialogueComplete: "Tuyệt vời! Nhận lấy Nhẫn Đồng & Pix-Chip 8-Bit này — trang bị Pix-Chip để mở khóa Tuyệt Kỹ [Q]!",
    objectives: [
      { id: "enh", kind: "enhance_item", required: 1, label: "Luyện Ma Trận thành công (+1)" },
    ],
    rewards: {
      gold: 125,
      xp: 140,
      items: [
        { defId: "chp_basic", qty: 1 },
        { defId: "rng_copper", qty: 1 },
      ],
    },
  },
  {
    id: "q_waypoint_meadow",
    title: "Đánh Thức Sắc Màu",
    giverNpcId: "npc_elder",
    prereqQuestId: "q_forge_enhance",
    isMain: true,
    summary: "Tìm và bấm [F] kích hoạt 1 Trụ Sắc Màu ở Đồng Cỏ Xám (Tây Bắc).",
    dialogueStart:
      "Thế giới đang mất sắc màu vì các Trụ Sắc Màu đã tắt. Hãy mở Bản đồ [M], tìm một Trụ Sắc Màu ở Đồng Cỏ Xám và bấm [F] đánh thức nó!",
    dialogueActive: "Mở Bản đồ [M] để xem vị trí các Trụ Sắc Màu đang tắt ở hướng Tây Bắc.",
    dialogueComplete: "Kỳ diệu thay! Thảo nguyên đã bừng sáng trở lại. Nhận vũ khí Hiếm Nhẹ này để chuẩn bị thanh tẩy Trại Quái!",
    objectives: [
      { id: "wp", kind: "activate_waypoint", required: 1, label: "Kích hoạt Trụ Sắc Màu" },
    ],
    rewards: {
      gold: 160,
      xp: 180,
      items: [{ defId: "rng_quartz_eye", qty: 1 }],
      classRewards: ["uncommon_weapon"],
    },
  },
  {
    id: "q_clear_camp",
    title: "Quét Sạch Trại Nhiễu",
    giverNpcId: "npc_elder",
    prereqQuestId: "q_waypoint_meadow",
    isMain: true,
    summary: "Diệt hết quái tại một Trại Quái để giải phong ấn và bấm [F] mở 1 Rương Kho Báu.",
    dialogueStart:
      "Các Trại Quái đang khóa chặt nhiều Rương Kho Báu. Hãy tiêu diệt sạch quái canh gác một trại rồi mở Rương bên trong!",
    dialogueActive: "Rương chỉ mở được khi toàn bộ quái trong trại bị thanh tẩy. Chú ý quái cấp cao khá nguy hiểm!",
    dialogueComplete: "Đỉnh lắm! Thanh vũ khí Quý Hiếm (Lam) này còn mở khóa biến thể kỹ năng [E] mới cực mạnh cho Class của ngươi!",
    objectives: [
      { id: "chest", kind: "open_chest", required: 1, label: "Mở Rương Kho Báu bị khóa" },
    ],
    rewards: {
      gold: 200,
      xp: 240,
      items: [
        { defId: "mat_quartz_shard", qty: 4 },
        { defId: "mat_matrix_rune", qty: 1 },
        { defId: "pot_tonic", qty: 2 },
      ],
      classRewards: ["rare_weapon"],
    },
  },
  {
    id: "q_quartz_boss",
    title: "Cổ Thụ Thạch Anh",
    giverNpcId: "npc_elder",
    prereqQuestId: "q_clear_camp",
    isMain: true,
    summary: "Đạt cấp độ & trang bị vững vàng, tiến vào Rừng Thạch Anh (Đông Bắc) hạ Boss Blight Root.",
    dialogueStart:
      "Ở góc Đông Bắc Rừng Thạch Anh, Boss Blight Root (LV.10) canh giữ lãnh địa phong ấn. Một khi đánh trúng nó, lãnh địa sẽ khóa chặt không thể rút lui — hãy chuẩn bị kỹ!",
    dialogueActive: "Blight Root rất mạnh và biết gọi vệ binh khi dưới 50% HP. Hãy luyện đồ +4..+6 và mang đủ Bình Máu!",
    dialogueComplete: "Rừng Thạch Anh đã được giải cứu! Nhận lấy Pix-Chip Cổ Thụ cùng Mảnh Hổ Phách & Bùa Ma Trận!",
    objectives: [
      { id: "boss_root", kind: "kill_enemy", targetId: "boss_blight_root", required: 1, label: "Hạ Boss Blight Root" },
    ],
    rewards: {
      gold: 360,
      xp: 440,
      items: [
        { defId: "chp_root_pulse", qty: 1 },
        { defId: "mat_amber_gem", qty: 4 },
        { defId: "mat_matrix_rune", qty: 2 },
      ],
    },
  },
  {
    id: "q_amber_boss",
    title: "Hổ Phách Hư Vô",
    giverNpcId: "npc_elder",
    prereqQuestId: "q_quartz_boss",
    isMain: true,
    summary: "Tiến xuống Hầm Mỏ Hổ Phách (Tây Nam) và đánh bại Boss Gilded Null (LV.15).",
    dialogueStart:
      "Tại góc Tây Nam Hầm Mỏ Hổ Phách, Gilded Null kiểm soát dòng dung nham với lớp giáp dày đặc. Hãy cộng điểm chỉ số & luyện Ma Trận thật kỹ trước khi khai chiến!",
    dialogueActive: "Tránh xa các đòn dậm nổ diện rộng của Gilded Null bên trong lãnh địa phong ấn!",
    dialogueComplete: "Tuyệt đỉnh! Ngươi đã sở hữu Vũ Khí Sử Thi (Tím) riêng cho Class cùng Lăng Kính Hư Vô!",
    objectives: [
      { id: "boss_amber", kind: "kill_enemy", targetId: "boss_gilded_null", required: 1, label: "Hạ Boss Gilded Null" },
    ],
    rewards: {
      gold: 540,
      xp: 640,
      items: [
        { defId: "mat_void_prism", qty: 3 },
        { defId: "mat_matrix_rune", qty: 2 },
      ],
      classRewards: ["epic_weapon"],
    },
  },
  {
    id: "q_final_eraser",
    title: "Xóa Sổ Nhiễu Trắng",
    giverNpcId: "npc_elder",
    prereqQuestId: "q_amber_boss",
    isMain: true,
    summary: "Tiến vào Thánh Địa Phế Tích Vô Sắc (Đông Nam) và tiêu diệt World Boss The Eraser (LV.20)!",
    dialogueStart:
      "Giờ phút quyết định đã điểm! World Boss The Eraser ngự trị tại Thánh Địa Đông Nam. Một khi bước vào giao chiến, kết giới sẽ khóa kín đến khi một bên gục ngã!",
    dialogueActive: "The Eraser có 3 giai đoạn cuồng nộ và laser chữ thập. Hãy trang bị đủ đồ Tím/Cam và luyện Ma Trận lên mức tối đa!",
    dialogueComplete:
      "HUYỀN THOẠI ĐÃ RA ĐỜI! The Eraser đã tan biến, toàn bộ thế giới PIXTEL lấy lại 16-bit sắc màu rực rỡ! Nhận lấy Thần Khí Huyền Thoại tối thượng của Class!",
    objectives: [
      { id: "eraser", kind: "kill_enemy", targetId: "boss_the_eraser", required: 1, label: "Hạ World Boss The Eraser" },
    ],
    rewards: {
      gold: 1500,
      xp: 1200,
      classRewards: ["legendary_weapon"],
    },
  },
  // === 2 REPEATABLE BOUNTY QUESTS ===
  {
    id: "q_bounty_hunt",
    title: "[Truy Nã] Diệt Glitchborn",
    giverNpcId: "npc_elder",
    repeatable: true,
    summary: "(Nhiệm vụ phụ lặp lại) Thanh tẩy 8 quái Glitchborn bất kỳ để cày XP, Vàng & Lõi Glitch.",
    dialogueStart: "Bảng truy nã luôn cần người dọn dẹp quái tuần tra quanh các vùng đất. Hạ 8 Glitchborn bất kỳ sẽ có thưởng lớn!",
    dialogueActive: "Hạ bất kỳ quái Glitchborn nào ngoài thị trấn đều được tính vào bảng truy nã.",
    dialogueComplete: "Làm tốt lắm! Đây là tiền thưởng truy nã của ngươi. Có thể nhận lại bất cứ lúc nào!",
    objectives: [
      { id: "any_mobs", kind: "kill_any", required: 8, label: "Hạ Glitchborn bất kỳ" },
    ],
    rewards: {
      gold: 140,
      xp: 140,
      items: [
        { defId: "mat_glitch_core", qty: 3 },
        { defId: "pot_hp", qty: 1 },
      ],
    },
  },
  {
    id: "q_bounty_ore",
    title: "[Truy Nã] Thợ Mỏ Tinh Thể",
    giverNpcId: "npc_blacksmith",
    repeatable: true,
    summary: "(Nhiệm vụ phụ lặp lại) Khai thác 5 mỏ khoáng sản/tinh thể để đổi Vàng & nguyên liệu Ma Trận.",
    dialogueStart: "Ma Trận Luyện Khí của ta lúc nào cũng cần tinh thể! Khai thác giúp ta 5 mỏ khoáng sản ngoài kia, ta sẽ trả công hậu hĩnh!",
    dialogueActive: "Các mỏ quặng tự hồi sinh sau ~30 giây, cứ đi quanh Đồng Cỏ hoặc Rừng Thạch Anh là có ngay.",
    dialogueComplete: "Quặng chất lượng tuyệt hảo! Cầm lấy Vàng và nguyên liệu thưởng thêm này!",
    objectives: [
      { id: "ores", kind: "mine_resource", required: 5, label: "Khai thác mỏ khoáng sản" },
    ],
    rewards: {
      gold: 155,
      xp: 115,
      items: [
        { defId: "mat_iron_ore", qty: 3 },
        { defId: "mat_amber_gem", qty: 1 },
      ],
    },
  },
];

export function getQuestDef(id: string): QuestDef | undefined {
  return QUESTS.find((q) => q.id === id);
}
