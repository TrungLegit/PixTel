import type { QuestDef } from "./types";

export const QUESTS: QuestDef[] = [
  {
    id: "q_intro_slime",
    title: "Khởi Đầu Thanh Tẩy",
    giverNpcId: "npc_elder",
    isMain: true,
    summary: "Ra khỏi cổng Tây Thị Trấn tới Đồng Cỏ Xám và tiêu diệt 5 Slime Nhiễu.",
    dialogueStart:
      "Chroma-Walker! Đám Slime Nhiễu đang tụ tập ngay ngoài cổng Tây ở Đồng Cỏ Xám. Hãy ra đó tiêu diệt 5 con và mang về Lõi Glitch đầu tiên!",
    dialogueActive: "Cứ đi qua cổng Tây Thị Trấn, đám Slime Nhiễu đang chờ ngoài đó. Nhớ dùng E và Space để né đòn nhé!",
    dialogueComplete: "Xuất sắc! Đây là thù lao cùng thanh vũ khí Thảo Nguyên để hỗ trợ ngươi trên chặng đường sắp tới.",
    objectives: [
      { id: "slimes", kind: "kill_enemy", targetId: "null_slime", required: 5, label: "Hạ Slime Nhiễu" },
    ],
    rewards: {
      gold: 85,
      xp: 90,
      items: [
        { defId: "wpn_meadow_edge", qty: 1 },
        { defId: "pot_hp", qty: 2 },
      ],
    },
  },
  {
    id: "q_mine_crystal",
    title: "Khai Thác Tinh Thể",
    giverNpcId: "npc_elder",
    prereqQuestId: "q_intro_slime",
    isMain: true,
    summary: "Đánh vỡ 3 mỏ Quặng Sắt hoặc Cụm Tinh Thể rải rác ngoài thị trấn.",
    dialogueStart:
      "Để rèn vũ khí mạnh hơn, Thợ Rèn Kael cần nguyên liệu. Hãy ra ngoài thị trấn, đánh vào các mỏ Quặng Sắt hoặc cụm Thạch Anh để khai thác 3 mỏ!",
    dialogueActive: "Dùng đòn đánh thường lên các mỏ quặng lấp lánh ngay ngoài cổng Tây/Bắc để thu thập khoáng sản.",
    dialogueComplete: "Tuyệt lắm! Đống quặng này đủ để Kael bắt đầu rèn giũa cho ngươi rồi đấy.",
    objectives: [
      { id: "mine", kind: "mine_resource", required: 3, label: "Khai thác mỏ quặng/tinh thể" },
    ],
    rewards: {
      gold: 95,
      xp: 100,
      items: [
        { defId: "mat_iron_ore", qty: 4 },
        { defId: "mat_glitch_core", qty: 3 },
      ],
    },
  },
  {
    id: "q_forge_enhance",
    title: "Lò Rèn Lăng Kính",
    giverNpcId: "npc_elder",
    prereqQuestId: "q_mine_crystal",
    isMain: true,
    summary: "Gặp Thợ Rèn Kael (phía Tây quảng trường) và cường hóa bất kỳ trang bị nào lên +1.",
    dialogueStart:
      "Hãy sang nói chuyện với Thợ Rèn Lăng Kính Kael ở bên trái quảng trường và thử cường hóa một món trang bị lên +1 nhé!",
    dialogueActive: "Thợ Rèn Kael đứng ngay phía Tây quảng trường (bấm F khi lại gần).",
    dialogueComplete: "Cảm nhận được sức mạnh ánh sáng mới chưa? Khi vũ khí đạt +5 còn phát hào quang riêng đấy!",
    objectives: [
      { id: "enh", kind: "enhance_item", required: 1, label: "Cường hóa trang bị (+1)" },
    ],
    rewards: {
      gold: 110,
      xp: 120,
      items: [{ defId: "arm_meadow_mail", qty: 1 }],
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
      "Thế giới đang mất hết sắc màu vì các Trụ Sắc Màu bị tắt. Hãy mở Bản đồ [M], tìm Trụ ở Đồng Cỏ Xám và bấm [F] đánh thức nó!",
    dialogueActive: "Mở Bản đồ [M] để xem vị trí các Trụ Sắc Màu đang tắt ở phía Tây Bắc.",
    dialogueComplete: "Kỳ diệu thay! Cả một vùng thảo nguyên đã rực rỡ trở lại, và ngươi có thể Dịch chuyển nhanh [M] bất cứ lúc nào!",
    objectives: [
      { id: "wp", kind: "activate_waypoint", required: 1, label: "Kích hoạt Trụ Sắc Màu" },
    ],
    rewards: {
      gold: 140,
      xp: 150,
      items: [{ defId: "rng_quartz_eye", qty: 1 }],
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
      "Các Trại Quái đang khóa chặt nhiều Rương Kho Báu cổ xưa. Hãy tiêu diệt sạch quái canh gác một trại rồi mở Rương bên trong!",
    dialogueActive: "Rương chỉ mở được khi toàn bộ quái trong trại bị thanh tẩy. Chú ý dấu ổ khóa đỏ trên rương nhé!",
    dialogueComplete: "Đỉnh lắm! Những trang bị từ Rương sẽ giúp ngươi sẵn sàng tiến vào Rừng Thạch Anh.",
    objectives: [
      { id: "chest", kind: "open_chest", required: 1, label: "Mở Rương Kho Báu bị khóa" },
    ],
    rewards: {
      gold: 165,
      xp: 190,
      items: [
        { defId: "mat_quartz_shard", qty: 4 },
        { defId: "pot_tonic", qty: 2 },
      ],
    },
  },
  {
    id: "q_quartz_boss",
    title: "Cổ Thụ Thạch Anh",
    giverNpcId: "npc_elder",
    prereqQuestId: "q_clear_camp",
    isMain: true,
    summary: "Tiến vào Rừng Thạch Anh (Đông Bắc) và đánh bại Boss vùng Blight Root.",
    dialogueStart:
      "Ở tận góc Đông Bắc Rừng Thạch Anh, Boss Blight Root đang phát tán bào tử xám. Hãy chuẩn bị kỹ trang bị Lam rồi tiêu diệt nó!",
    dialogueActive: "Blight Root ẩn náu tại đấu trường Đông Bắc Rừng Thạch Anh. Hãy né các vòng đỏ cảnh báo rễ cây trồi!",
    dialogueComplete: "Rừng Thạch Anh đã được giải cứu! Nhận lấy Pix-Chip Cổ Thụ cùng Mảnh Hổ Phách cho thử thách kế tiếp.",
    objectives: [
      { id: "boss_root", kind: "kill_enemy", targetId: "boss_blight_root", required: 1, label: "Hạ Boss Blight Root" },
    ],
    rewards: {
      gold: 300,
      xp: 360,
      items: [
        { defId: "chp_root_pulse", qty: 1 },
        { defId: "mat_amber_gem", qty: 4 },
      ],
    },
  },
  {
    id: "q_amber_boss",
    title: "Hổ Phách Hư Vô",
    giverNpcId: "npc_elder",
    prereqQuestId: "q_quartz_boss",
    isMain: true,
    summary: "Tiến xuống Hầm Mỏ Hổ Phách (Tây Nam) và tiêu diệt Boss vùng Gilded Null.",
    dialogueStart:
      "Tại góc Tây Nam của Hầm Mỏ Hổ Phách, thực thể Gilded Null đang kiểm soát dòng dung nham. Hãy thanh tẩy nó để thu thập Lăng Kính Hư Vô!",
    dialogueActive: "Cẩn thận dòng nham thạch ở Tây Nam và các đợt mưa thiên thạch của Gilded Null!",
    dialogueComplete: "Tuyệt đỉnh! Ngươi đã sở hữu vũ khí Sử Thi và Lăng Kính Hư Vô. Chỉ còn một trận chiến cuối cùng nữa thôi!",
    objectives: [
      { id: "boss_amber", kind: "kill_enemy", targetId: "boss_gilded_null", required: 1, label: "Hạ Boss Gilded Null" },
    ],
    rewards: {
      gold: 460,
      xp: 520,
      items: [
        { defId: "wpn_amber_fury", qty: 1 },
        { defId: "mat_void_prism", qty: 3 },
      ],
    },
  },
  {
    id: "q_final_eraser",
    title: "Xóa Sổ Nhiễu Trắng",
    giverNpcId: "npc_elder",
    prereqQuestId: "q_amber_boss",
    isMain: true,
    summary: "Tiến vào Phế Tích Vô Sắc (Đông Nam) và đánh bại World Boss The Eraser!",
    dialogueStart:
      "Giờ phút quyết định đã điểm! Thực thể The Eraser đang ngự trị tại Đấu Trường Vô Sắc góc Đông Nam. Hãy chế tạo trang bị tối thượng và chấm dứt đại dịch Nhiễu Trắng!",
    dialogueActive: "The Eraser có khả năng xóa mảng sàn và phóng laser chữ thập. Hãy luôn giữ Thể lực để Dash né chiêu!",
    dialogueComplete:
      "HUYỀN THOẠI ĐÃ RA ĐỜI! The Eraser đã tan biến, toàn bộ thế giới PIXTEL đã lấy lại 16-bit sắc màu rực rỡ! Ngươi vẫn có thể tiếp tục khám phá, rèn đồ +10 và mở khóa toàn bộ Trụ Sắc Màu!",
    objectives: [
      { id: "eraser", kind: "kill_enemy", targetId: "boss_the_eraser", required: 1, label: "Hạ World Boss The Eraser" },
    ],
    rewards: {
      gold: 1200,
      xp: 1000,
      items: [{ defId: "wpn_chroma_sovereign", qty: 1 }],
    },
  },
  // === 2 REPEATABLE BOUNTY QUESTS ===
  {
    id: "q_bounty_hunt",
    title: "[Truy Nã] Diệt Glitchborn",
    giverNpcId: "npc_elder",
    repeatable: true,
    summary: "(Nhiệm vụ phụ lặp lại) Thanh tẩy 8 quái Glitchborn bất kỳ để kiếm Vàng & Lõi Glitch.",
    dialogueStart: "Bảng truy nã luôn cần người dọn dẹp quái tuần tra quanh các vùng đất. Hạ 8 Glitchborn bất kỳ sẽ có thưởng lớn!",
    dialogueActive: "Hạ bất kỳ quái Glitchborn nào ngoài thị trấn đều được tính vào bảng truy nã.",
    dialogueComplete: "Làm tốt lắm! Đây là tiền thưởng truy nã của ngươi. Có thể nhận lại bất cứ lúc nào!",
    objectives: [
      { id: "any_mobs", kind: "kill_any", required: 8, label: "Hạ Glitchborn bất kỳ" },
    ],
    rewards: {
      gold: 120,
      xp: 110,
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
    summary: "(Nhiệm vụ phụ lặp lại) Khai thác 5 mỏ khoáng sản/tinh thể để đổi Vàng & nguyên liệu rèn.",
    dialogueStart: "Lò rèn của ta lúc nào cũng thiếu quặng! Khai thác giúp ta 5 mỏ khoáng sản ngoài kia, ta sẽ trả công hậu hĩnh!",
    dialogueActive: "Các mỏ quặng tự hồi sinh sau ~30 giây, cứ đi quanh Đồng Cỏ hoặc Rừng Thạch Anh là có ngay.",
    dialogueComplete: "Quặng chất lượng tuyệt hảo! Cầm lấy Vàng và Mảnh Hổ Phách thưởng thêm này!",
    objectives: [
      { id: "ores", kind: "mine_resource", required: 5, label: "Khai thác mỏ khoáng sản" },
    ],
    rewards: {
      gold: 135,
      xp: 95,
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
