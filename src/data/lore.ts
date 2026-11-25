import type { LoreTabletDef } from "./types";

export interface StoryChapterBanner {
  id: string;
  chapter: string;
  title: string;
  subtitle: string;
}

export const WORLD_PROLOGUE = {
  worldName: "AETHEL-16 · THẾ GIỚI LĂNG KÍNH",
  headline: "BIÊN NIÊN SỬ ĐẠI PHÂN RÃ TRẮNG",
  paragraphs: [
    "Thuở khởi nguyên, thế giới Aethel-16 được dệt nên từ Trái Tim Lăng Kính — nơi ánh sáng nguyên thủy tách thành 16-bit sắc độ nuôi dưỡng cỏ cây, ký ức và linh hồn vạn vật.",
    "Nhưng sau cuộc Chiến Tranh Thất Sắc đẫm máu, Kiến Trúc Sư Cổ Đại Vaelor — trong nỗi tuyệt vọng mất đi người thân — đã viết nên giao thức tối thượng mang tên THE ERASER (Thực Thể Xóa Sắc), với niềm tin lệch lạc rằng: 'Nếu xóa sạch mọi sắc màu và ký ức, thế giới sẽ vĩnh viễn bình yên trong sắc trắng tĩnh lặng.'",
    "Bạn là Chroma-Walker cuối cùng thức tỉnh từ Đài Khởi Nguyên. Mỗi Trụ Sắc Màu bạn đánh thức, mỗi Bia Ký bạn giải mã, và mỗi mảnh vũ khí rèn trong Lò Lăng Kính đều là một nét cọ giành lại sự sống cho thế giới này!",
  ],
};

/**
 * 8 Bia Ký Cổ Xưa (Lore Tablets) đặt dọc theo hành trình từ Thị Trấn Khởi Nguyên tới Phế Tích Vô Sắc.
 * Nhấn [F] để giải mã cốt truyện, nhận XP + Vàng + Bột Sắc Tố và lưu vĩnh viễn vào Sổ Biên Niên Sử [J].
 */
export const LORE_TABLETS: LoreTabletDef[] = [
  {
    id: "lore_town_prism",
    chapter: "HỒI I · NGỌN ĐÈN CUỐI CÙNG",
    title: "Khúc Ca Của Lăng Kính Đầu Tiên",
    biome: "town",
    tx: 84,
    ty: 83,
    author: "Trưởng Làng Elian",
    accent: "#ffe066",
    excerpt: "Ngày bầu trời rụng hết sắc lam, chỉ còn Trụ Khởi Nguyên giữ lại nhịp đập cho thị trấn nhỏ này...",
    body: [
      "Khi cơn bão Nhiễu Trắng đầu tiên tràn qua chân trời, nó không phát ra tiếng sấm — nó nuốt chửng cả âm thanh lẫn màu sắc. Lá cây hóa tro xám khi vẫn còn trên cành, còn những người nhìn quá lâu vào màn sương trắng đều quên mất tên của chính mình.",
      "Chính tại quảng trường này, bảy Pháp Sư Sắc Độ đời đầu đã hóa thân vào Trụ Khởi Nguyên để dựng lên bức tường thành bất khả xâm phạm. Nhờ họ, chúng ta còn nhớ được màu đỏ của lửa ấm và màu vàng của lúa chín.",
      "Hỡi Chroma-Walker vừa thức tỉnh, bạn không chỉ mang vũ khí — bạn mang theo con ngươi có thể nhìn thấy sắc màu ẩn dưới lớp bụi xám. Đừng để ngọn đèn cuối cùng này lụi tàn.",
    ],
    rewardXp: 45,
    rewardGold: 40,
    rewardItem: { defId: "mat_pigment_red", qty: 1 },
  },
  {
    id: "lore_town_forge",
    chapter: "HỒI I · NGỌN ĐÈN CUỐI CÙNG",
    title: "Đôi Mắt Của Thợ Rèn Kael",
    biome: "town",
    tx: 75,
    ty: 82,
    author: "Thợ Rèn Lăng Kính Kael",
    accent: "#ff9933",
    excerpt: "Ta đã đánh đổi sắc màu trong đôi mắt mình để chiếc Đe Lăng Kính này không bao giờ làm vỡ gươm của các ngươi.",
    body: [
      "Nhiều người hỏi vì sao Lò Rèn Lăng Kính của ta dù thất bại ở cấp cao cũng chưa từng làm gãy nát một thanh kiếm nào. Họ không biết cái giá phải trả trong Đêm Rèn Thứ Chín.",
      "Để khóa chặt dòng nhiệt hỗn mang của Lõi Glitch, ta đã rót toàn bộ sắc tố trong đôi mắt mình vào tâm chiếc đe. Từ ngày đó, thế giới trước mắt ta chỉ còn hai màu đen trắng — nhưng mỗi nhát búa đập xuống đều tích tụ Cộng Hưởng Lăng Kính cho lần rèn kế tiếp.",
      "Khi vũ khí của ngươi chạm mốc +5, hãy đem Bột Sắc Tố tới cho ta. Dù mắt ta mù màu, đôi tay ta vẫn nghe được tiếng hát của Lửa Đỏ, Băng Lam, Rừng Lục và Chớp Vàng trên lưỡi thép!",
    ],
    rewardXp: 50,
    rewardGold: 45,
    rewardItem: { defId: "mat_prism_shard", qty: 2 },
  },
  {
    id: "lore_meadow_oath",
    chapter: "HỒI II · LỜI THỀ ĐỒNG CỎ XÁM",
    title: "Bi Kịch Hình Thiên Vệ Thạch",
    biome: "meadow",
    tx: 48,
    ty: 58,
    author: "Khắc trên tấm khiên gãy",
    accent: "#44ee88",
    excerpt: "Vị tướng giữ cửa thảo nguyên đã tự phong ấn đầu mình để không nghe lời ru ngủ của Nhiễu Trắng...",
    body: [
      "Tướng quân Hình Thiên từng là Vệ Binh Lăng Kính kiêu hãnh nhất bảo vệ cánh đồng hoa hướng dương phía Tây Bắc. Khi sương trắng tràn về, hàng vạn giọng nói êm ái vang lên trong tâm trí ông, dụ dỗ ông hạ khiên xuống để được 'nghỉ ngơi mãi mãi'.",
      "Không chịu khuất phục, vị tướng đã dùng chính lưỡi rìu của mình chém đứt mũ trụ lẫn giác quan, khắc đôi mắt chiến thần lên giáp ngực để tiếp tục vung khiên canh giữ Trụ Đồi Gió Xám.",
      "Trăm năm trôi qua, lớp đá xám đã phủ kín thân thể ông thành HÌNH THIÊN VỆ THẠCH. Nếu gặp ông ấy nơi cuối thảo nguyên, hãy dùng đòn Tụ Lực phá vỡ chiếc khiên xám và giải thoát linh hồn người lính già.",
    ],
    rewardXp: 70,
    rewardGold: 60,
    rewardItem: { defId: "mat_pigment_green", qty: 1 },
  },
  {
    id: "lore_meadow_wind",
    chapter: "HỒI II · LỜI THỀ ĐỒNG CỎ XÁM",
    title: "Bí Truyền Khoảnh Khắc Lệch Nhịp",
    biome: "meadow",
    tx: 25,
    ty: 30,
    author: "Sư Phụ Điểm Ảnh Zero",
    accent: "#5ef2ff",
    excerpt: "Giữa hai khung hình của thực tại luôn có một khe hở dài đúng sáu nhịp tim...",
    body: [
      "The Eraser xóa thế giới theo từng nhịp quét cứng nhắc. Đám đệ tử Sát Thủ Điểm Ảnh của ta đã phát hiện ra: nếu ngươi tung người lướt (Dash) ngay khoảnh khắc đòn tấn công vừa chạm tới tà áo, cơ thể ngươi sẽ trượt vào khe hở giữa hai khung hình!",
      "Chúng ta gọi đó là CHROMA DODGE (Né Hoàn Hảo). Không chỉ toàn mạng, cú trượt lệch nhịp ấy còn hút ngược động năng của kẻ địch thành Thể Lực và thắp sáng lưỡi đao cho đòn Phản Kích kế tiếp.",
      "Hãy nhớ: đừng lướt hoảng loạn đến cạn sạch Vòng Thể Lực. Kẻ làm chủ nhịp thở mới là kẻ làm chủ chiến trường.",
    ],
    rewardXp: 85,
    rewardGold: 70,
    rewardItem: { defId: "pot_stamina", qty: 2 },
  },
  {
    id: "lore_quartz_tears",
    chapter: "HỒI III · GIỌT LỆ RỪNG PHA LÊ",
    title: "Lời Cầu Nguyện Của Cổ Thụ Băng Tinh",
    biome: "quartz",
    tx: 106,
    ty: 57,
    author: "Hiền Giả Lyra",
    accent: "#38b6ff",
    excerpt: "Rừng Thạch Anh không chết vì giá lạnh — khu rừng đã tự đóng băng chính mình để cầm tù dịch bệnh.",
    body: [
      "Trước Đại Phân Rã, khu rừng Đông Bắc này mềm mại như lụa ngọc bích. Khi đàn Sói Trắng mang bào tử hư vô xâm nhập mạch nước ngầm, Cây Mẹ Ngàn Năm đã đưa ra lựa chọn đau đớn nhất.",
      "Nó rút toàn bộ hơi ấm khỏi đất rừng, kết tinh nhựa sống thành hàng vạn trụ Thạch Anh lạnh giá để giam cầm mầm bệnh trong bộ rễ của chính mình. Nhưng sự hy sinh ấy dần biến Cây Mẹ thành quái vật nửa thực vật nửa nhiễu loạn — BLIGHT ROOT.",
      "Khi giao chiến với Cổ Thụ Nhiễu, hãy coi chừng những mũi pha lê rơi từ vòm trời. Chỉ có sự cộng hưởng giữa Lửa, Băng và Điện mới có thể làm tan chảy lớp vỏ xám đang bóp nghẹt trái tim khu rừng.",
    ],
    rewardXp: 120,
    rewardGold: 95,
    rewardItem: { defId: "mat_pigment_cyan", qty: 1 },
  },
  {
    id: "lore_amber_pact",
    chapter: "HỒI IV · KHẾ ƯỚC DUNG NHAM",
    title: "Cùng Kỳ & Trái Tim Lò Hổ Phách",
    biome: "amber",
    tx: 50,
    ty: 111,
    author: "Đốc Công Hầm Mỏ Doran",
    accent: "#ffaa33",
    excerpt: "Dưới đáy mỏ sâu, thần thú có cánh đã nuốt trọn lõi phản ứng vàng rực để giữ cho mặt đất không hóa bụi...",
    body: [
      "Hầm Mỏ Hổ Phách là nơi cung cấp nguồn nhiệt nuôi sống cả lục địa. Khi The Eraser đánh sập tầng hầm thứ bảy, dòng dung nham đỏ rực bắt đầu nguội đi thành tro trắng lạnh lẽo.",
      "Linh thú hộ mỏ — Dực Hổ Cùng Kỳ — đã lao thẳng vào tâm lò phản ứng, nuốt viên Hổ Phách Nguyên Sinh vào lồng ngực. Ngọn lửa quá tải thiêu đốt lý trí nó, biến bộ lông vằn vàng thành lớp giáp Hư Vô Nóng Chảy mang tên GILDED NULL.",
      "Nó vẫn gầm thét dưới góc Tây Nam, gọi mưa lửa và sấm sét giáng xuống bất kỳ ai bước vào lãnh địa. Hãy mang theo Dầu Phủ Quang Phổ và rèn giáp thật vững trước khi đối mặt cơn thịnh nộ của nó!",
    ],
    rewardXp: 165,
    rewardGold: 135,
    rewardItem: { defId: "mat_pigment_gold", qty: 1 },
  },
  {
    id: "lore_ruins_vaelor",
    chapter: "HỒI V · BẢN CÁO TRẠNG VÔ SẮC",
    title: "Nhật Ký Cuối Cùng Của Kiến Trúc Sư Vaelor",
    biome: "ruins",
    tx: 111,
    ty: 111,
    author: "Kiến Trúc Sư Vaelor",
    accent: "#c266ff",
    excerpt: "Con gái ta từng yêu màu tím của hoa dạ thảo, và chính ngọn lửa chiến tranh giành giật mỏ sắc tố đã cướp con bé đi...",
    body: [
      "Ngày thứ 402 kể từ khi Iris nhắm mắt. Các vương quốc vẫn chém giết nhau chỉ để tranh giành từng mảnh tinh thể màu. Đỏ hận Lam, Lục ghen ghét Vàng — sắc màu càng rực rỡ, lòng tham và nỗi đau càng sâu hoắm.",
      "Đêm nay ta hoàn tất mã nguồn của THE ERASER. Một thiên thần sáu cánh không biết giận dữ, không biết thiên vị. Nó sẽ nhẹ nhàng tẩy sạch toàn bộ bảng màu của thế giới, đưa tất cả trở về bản phác thảo trắng tinh khôi trước khi bi kịch bắt đầu.",
      "...Nhưng sao khi nhìn cánh tay mình dần phai thành tro trắng, ta lại sợ hãi đến thế này? Nếu mọi sắc màu đều biến mất, ta làm sao còn nhớ được màu mắt của Iris? Xin ai đó... nếu đọc được những dòng này... hãy dừng cỗ máy của ta lại!",
    ],
    rewardXp: 220,
    rewardGold: 180,
    rewardItem: { defId: "mat_void_prism", qty: 1 },
  },
  {
    id: "lore_ruins_sanctum",
    chapter: "HỒI V · BẢN CÁO TRẠNG VÔ SẮC",
    title: "Giao Thức Phá Giải Khiên Vô Sắc",
    biome: "ruins",
    tx: 130,
    ty: 129,
    author: "Bản Vẽ Mật Của Vaelor",
    accent: "#ff66d8",
    excerpt: "Điểm yếu duy nhất của The Eraser nằm ngay ở 4 Cột Thu Sắc quanh Đấu Trường Trung Tâm!",
    body: [
      "CẢNH BÁO TỐI MẬT: Khi sinh lực của THE ERASER giảm xuống ngưỡng 65% và 30%, nó sẽ kích hoạt Giao Thức Xóa Sổ Toàn Cục — dựng lớp Khiên Vô Sắc dày đặc và hút cạn năng lượng từ 4 Trụ Totem Cộng Hưởng ở bốn góc thánh địa.",
      "Đừng cố chém tay không vào lớp khiên đó! Hãy lập tức di chuyển quanh đấu trường và tấn công thắp sáng ít nhất 2 trong 4 Trụ Totem Sắc Màu trước khi chu kỳ hút 12 giây hoàn tất!",
      "Khi các Trụ Totem được nạp đầy sắc độ, chúng sẽ bắn ngược chùm Tia Khúc Xạ Hội Tụ xuyên thủng trái tim The Eraser, khiến nó sụp đổ và lộ toàn bộ điểm yếu. Hãy trả lại bầu trời 16-bit cho Aethel!",
    ],
    rewardXp: 260,
    rewardGold: 220,
    rewardItem: { defId: "pot_coating", qty: 2 },
  },
];

export interface BossCodexEntry {
  enemyId: string;
  chapter: string;
  name: string;
  title: string;
  biomeLabel: string;
  lore: string;
  weaknessHint: string;
}

export const BOSS_CODEX: BossCodexEntry[] = [
  {
    enemyId: "boss_xing_warden",
    chapter: "THỦ LĨNH HỒI II",
    name: "HỘ VỆ CỔ THỤ — XING WARDEN",
    title: "Linh Hồn Cổ Thụ Gác Thánh Địa Thảo Nguyên",
    biomeLabel: "Đồng Cỏ Xám (Tây Bắc · LV.6)",
    lore: "Hộ Vệ Cổ Thụ mang gạc sừng phát quang và Trái Tim Lục Bảo giữa lồng ngực. Ngài triệu hồi rễ cây xuyên đất và Bão Lá Cổ Thụ để bảo vệ mảnh đất xanh khỏi sự xâm lăng.",
    weaknessHint: "Mang căn nguyên Gió (Wind) — khắc hệ Chấn Động (Quake). Né Rễ Trồi Mặt Đất & Bão Lá Cổ Thụ; dùng Tụ Lực, Địa Nhiệt hoặc Sét Chấn Động đập tan Giáp Nhiễu Trắng, dùng Hư Không xóa cuồng nộ Phase 2.",
  },
  {
    enemyId: "boss_blight_root",
    chapter: "THỦ LĨNH HỒI III",
    name: "RỒNG LĂNG KÍNH — BLIGHT PRISM",
    title: "Cự Long Tinh Thể Của Rừng Thạch Anh",
    biomeLabel: "Rừng Thạch Anh (Đông Bắc · LV.10)",
    lore: "Rồng Lăng Kính kết tinh từ vạn mảnh thạch anh phát quang, mang lõi cầu vồng giữa ngực và vương miện pha lê bay trên đầu, liên tục trút Mưa Mảnh Khúc Xạ và Hơi Thở Lăng Kính.",
    weaknessHint: "Mang căn nguyên Băng/Lăng Kính — khắc hệ Hỏa (Fire). Né vòng sáng Mưa Mảnh Khúc Xạ và tia Hơi Thở Lăng Kính; dùng Sốc Nhiệt (Hỏa+Băng) hoặc Bão Lửa Cuốn (Hỏa+Gió) để xuyên giáp cực nhanh.",
  },
  {
    enemyId: "boss_gilded_null",
    chapter: "THỦ LĨNH HỒI IV",
    name: "GILDED NULL — CÙNG KỲ HỔ PHÁCH",
    title: "Dực Hổ Nuốt Lò Phản Ứng Nham Thạch",
    biomeLabel: "Hầm Mỏ Hổ Phách (Tây Nam · LV.15)",
    lore: "Thần thú có cánh canh giữ đáy mỏ đã nuốt trọn viên Hổ Phách Nguyên Sinh để ngăn lòng đất nguội thành tro trắng, biến thành cơn bão dung nham và sấm sét điên cuồng.",
    weaknessHint: "Mang căn nguyên Hỏa/Chấn Động — khắc hệ Hư Không (Void) & Băng. Dùng Phản Vật Chất Hỏa (Void+Fire) xóa giáp nộ dung nham và tận dụng Chroma Dodge phản kích!",
  },
  {
    enemyId: "boss_the_eraser",
    chapter: "ĐẠI TRÙM CUỐI · HỒI V",
    name: "THE ERASER — THỰC THỂ XÓA SẮC",
    title: "Thiên Thần Sáu Cánh Của Kiến Trúc Sư Vaelor",
    biomeLabel: "Phế Tích Vô Sắc (Đông Nam · LV.20)",
    lore: "Cỗ máy phán quyết tối thượng được tạo ra từ nỗi đau mất con của Vaelor, mang sứ mệnh xóa sạch mọi màu sắc và ký ức để đưa thế giới về tờ giấy trắng vĩnh hằng.",
    weaknessHint: "Mang căn nguyên Hư Không — khắc hệ Sắc Độ (Chroma) & Lăng Kính (Prism). Phase 2 triệu hồi 4 Trụ Cơ Bản (Hỏa/Băng/Mộc/Lôi), Phase 3 triệu hồi 4 Trụ Nguyên Sinh (Hư Không/Sắc Độ/Gió/Chấn Động): đánh thắp >= 2 Trụ trong 12s để kích Cộng Hưởng Phá Khiên (thắp bằng hệ phản ứng gây nổ siêu cấp 12% Máu Chuẩn + Vùng Nở Rộ Sắc Màu)!",
  },
];

export function getLoreTabletById(id: string): LoreTabletDef | undefined {
  return LORE_TABLETS.find((t) => t.id === id);
}
