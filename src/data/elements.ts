import type { CanonicalElement, ElementType, InfusableElement } from "./types";

export interface ElementMeta {
  id: CanonicalElement;
  name: string;
  shortLabel: string;
  color: string;
  accent: string;
  role: string;
  mechanic: string;
  pigmentId?: string;
  hitPreset: string;
  infuseBonusDesc?: string;
}

/**
 * 9 Canonical Elements of PixTel (8 Infusable + 1 Awakened Prism):
 * - 5 Original: fire, ice, nature, volt, prism
 * - 4 Expanded: void, chroma, wind, quake
 */
export const ALL_ELEMENTS: readonly CanonicalElement[] = [
  "fire",
  "ice",
  "nature",
  "volt",
  "prism",
  "void",
  "chroma",
  "wind",
  "quake",
];

export const INFUSABLE_ELEMENTS: readonly InfusableElement[] = [
  "fire",
  "ice",
  "nature",
  "volt",
  "void",
  "chroma",
  "wind",
  "quake",
];

export const ELEMENT_META: Record<CanonicalElement, ElementMeta> = {
  fire: {
    id: "fire",
    name: "Hỏa",
    shortLabel: "HỎA",
    color: "#ff5533",
    accent: "#ffaa66",
    role: "Sát thương nổ / đốt / phá giáp",
    mechanic: "Gây bỏng theo nhịp; bùng nổ mạnh khi gặp Băng, Mộc, Lôi, Gió, Chấn Động, Hư Không, Sắc Độ.",
    pigmentId: "mat_pigment_red",
    hitPreset: "hit-fire",
    infuseBonusDesc: "+8% ELEM · +4 ATK",
  },
  ice: {
    id: "ice",
    name: "Băng",
    shortLabel: "BĂNG",
    color: "#38e8ff",
    accent: "#c8fbff",
    role: "Làm chậm / khống chế / giảm DEF",
    mechanic: "Giảm tốc độ di chuyển & nhịp ra đòn của địch, tạo nền cho Vỡ Băng hoặc Siêu Dẫn Crit.",
    pigmentId: "mat_pigment_cyan",
    hitPreset: "hit-ice",
    infuseBonusDesc: "+8% ELEM · +4% CRIT",
  },
  nature: {
    id: "nature",
    name: "Mộc / Độc",
    shortLabel: "MỘC",
    color: "#44ee88",
    accent: "#b8ffd8",
    role: "Sát thương duy trì / trói chân / hồi phục",
    mechanic: "Để lại độc/bào tử ăn mòn HP, kiểm soát vùng và tái tạo tài nguyên chiến đấu.",
    pigmentId: "mat_pigment_green",
    hitPreset: "hit-poison",
    infuseBonusDesc: "+8% ELEM · +20 HP",
  },
  volt: {
    id: "volt",
    name: "Lôi",
    shortLabel: "LÔI",
    color: "#ffee44",
    accent: "#ffffff",
    role: "Sát thương lan dây chuyền / giật khựng",
    mechanic: "Nảy điện đa mục tiêu, gây Khựng ngắn (Micro-Stun) và hỗ trợ nạp Stamina / Overdrive.",
    pigmentId: "mat_pigment_gold",
    hitPreset: "zap-hit",
    infuseBonusDesc: "+8% ELEM · -5% Hồi chiêu [E]",
  },
  prism: {
    id: "prism",
    name: "Lăng Kính",
    shortLabel: "LĂNG KÍNH",
    color: "#ff88f2",
    accent: "#78f9ff",
    role: "Khuếch đại & khúc xạ đa hệ",
    mechanic: "Kích hoạt hiệu ứng mạnh nhất của Ấn hiện tại mà KHÔNG xóa Ấn gốc, bắn thêm 3 tia khúc xạ truy kích.",
    hitPreset: "crit-gold",
  },
  void: {
    id: "void",
    name: "Hư Không",
    shortLabel: "HƯ KHÔNG",
    color: "#b266ff",
    accent: "#f0ccff",
    role: "Hút / làm lệch hướng / xóa buff",
    mechanic: "Kéo nhẹ quái tụ lại, xóa lớp buff tăng tốc/giáp của địch và gây Nhiễu Loạn nhịp đánh.",
    pigmentId: "mat_pigment_void",
    hitPreset: "explode-plasma",
    infuseBonusDesc: "+8% ELEM · -6% Hồi chiêu [E]",
  },
  chroma: {
    id: "chroma",
    name: "Sắc Độ",
    shortLabel: "SẮC ĐỘ",
    color: "#ff66c4",
    accent: "#ffe066",
    role: "Khôi phục màu 16-bit & hồi tài nguyên",
    mechanic: "Gắn Dấu Sắc Độ; đánh trúng mục tiêu có dấu hồi ngay Stamina, HP nhẹ, giảm CD [E] & lan sóng màu.",
    pigmentId: "mat_pigment_chroma",
    hitPreset: "crit-gold",
    infuseBonusDesc: "+12% ELEM · Hồi tài nguyên",
  },
  wind: {
    id: "wind",
    name: "Gió",
    shortLabel: "GIÓ",
    color: "#5ef2d6",
    accent: "#e0fff9",
    role: "Khuếch tán / đẩy-kéo / tăng cơ động",
    mechanic: "Cuốn và lan Ấn nguyên tố sang mục tiêu lân cận, mở rộng phạm vi đánh và tăng tốc chạy.",
    pigmentId: "mat_pigment_wind",
    hitPreset: "hit-cyan",
    infuseBonusDesc: "+8% ELEM · +6 SPD · +8 STAM",
  },
  quake: {
    id: "quake",
    name: "Chấn Động",
    shortLabel: "CHẤN ĐỘNG",
    color: "#ff9933",
    accent: "#ffe28a",
    role: "Phá thế (Stagger) / đẩy lùi / dội chấn",
    mechanic: "Đòn nặng dội xung kích đẩy lùi và bào mòn cực nhanh Thanh Giáp Trắng (Bleach Shield) của Boss.",
    pigmentId: "mat_pigment_quake",
    hitPreset: "ground-slam",
    infuseBonusDesc: "+8% ELEM · +15% Phá Giáp",
  },
};

export function normalizeElement(el: ElementType): CanonicalElement {
  return el === "poison" ? "nature" : el;
}

export function makeReactionKey(a: CanonicalElement, b: CanonicalElement): string {
  if (a === "prism" || b === "prism") return "any+prism";
  return [a, b].sort().join("+");
}

export interface ReactionSpec {
  key: string;
  elements: [CanonicalElement, CanonicalElement] | ["prism", CanonicalElement];
  group: "original" | "expanded" | "prism";
  vnName: string;
  enName: string;
  shortTag: string;
  color: string;
  atkMult: number;
  radiusPx: number;
  summary: string;
}

/**
 * Complete Pairwise Reaction Matrix for all 9 Elements:
 * - 6 Original Pairs (fire, ice, nature, volt)
 * - 22 Expanded Pairs (void, chroma, wind, quake + cross-pairs)
 * - 1 Universal Prism Rule (any + prism -> Prismatic Refraction without consuming Primer!)
 */
export const REACTION_SPECS: readonly ReactionSpec[] = [
  // === A. NHÓM PHẢN ỨNG GỐC (6) ===
  {
    key: "fire+ice",
    elements: ["fire", "ice"],
    group: "original",
    vnName: "Sốc Nhiệt",
    enName: "Thermal Shatter",
    shortTag: "SỐC NHIỆT",
    color: "#ff9944",
    atkMult: 1.85,
    radiusPx: 36,
    summary: "Nổ tức thời 1.85× ATK, giảm 25% DEF mục tiêu trong 4s và văng mảnh băng lan 36px.",
  },
  {
    key: "fire+nature",
    elements: ["fire", "nature"],
    group: "original",
    vnName: "Bùng Độc Viêm",
    enName: "Toxic Eruption",
    shortTag: "BÙNG ĐỘC VIÊM",
    color: "#66ff66",
    atkMult: 1.35,
    radiusPx: 56,
    summary: "Nổ AoE 56px (1.35× ATK) và để lại Đầm Độc Cháy 3.5s (mỗi 0.5s nhảy 0.35× ATK).",
  },
  {
    key: "ice+nature",
    elements: ["ice", "nature"],
    group: "original",
    vnName: "Kết Tinh Bào Tử",
    enName: "Cryo-Root",
    shortTag: "KẾT TINH BÀO TỬ",
    color: "#55f2ff",
    atkMult: 1.45,
    radiusPx: 42,
    summary: "Trói chân quái thường 1.8s (Boss chậm 45% trong 2.5s) + ăn mòn theo %HP tối đa (tối đa 2.2× ATK).",
  },
  {
    key: "ice+volt",
    elements: ["volt", "ice"],
    group: "original",
    vnName: "Siêu Dẫn Lăng Kính",
    enName: "Superconduct",
    shortTag: "SIÊU DẪN",
    color: "#78f9ff",
    atkMult: 1.2,
    radiusPx: 72,
    summary: "Giật dây chuyền tối đa 4 mục tiêu trong 72px (1.2× ATK), Khựng 0.4s & +15% Tỉ lệ Crit nhận vào 5s.",
  },
  {
    key: "fire+volt",
    elements: ["volt", "fire"],
    group: "original",
    vnName: "Quá Tải Xung Kích",
    enName: "Overload Blast",
    shortTag: "QUÁ TẢI",
    color: "#ffee44",
    atkMult: 1.6,
    radiusPx: 48,
    summary: "Nổ xung kích 1.6× ATK, đẩy lùi 26px và phá ngay 40% Thanh Giáp Trắng (Bleach Shield) của Tinh Anh/Boss.",
  },
  {
    key: "nature+volt",
    elements: ["volt", "nature"],
    group: "original",
    vnName: "Xúc Tác Mạch Sáng",
    enName: "Catalyze",
    shortTag: "XÚC TÁC",
    color: "#44ee88",
    atkMult: 1.15,
    radiusPx: 40,
    summary: "Tạo 2 Hạt Sắc Độ bay về người chơi, hồi ngay +15 Stamina và +10 Overdrive [Q].",
  },

  // === B. NHÓM PHẢN ỨNG MỞ RỘNG: VOID, CHROMA, WIND, QUAKE ===
  {
    key: "fire+void",
    elements: ["void", "fire"],
    group: "expanded",
    vnName: "Phản Vật Chất Hỏa",
    enName: "Void Flare Burst",
    shortTag: "PHẢN VẬT CHẤT",
    color: "#d466ff",
    atkMult: 1.75,
    radiusPx: 52,
    summary: "Nổ vùng 52px (1.75× ATK), kéo nhẹ quái quanh tâm vào giữa và xóa lớp buff tăng tốc/giáp của địch.",
  },
  {
    key: "ice+void",
    elements: ["void", "ice"],
    group: "expanded",
    vnName: "Đóng Băng Hư Vô",
    enName: "Null Frost",
    shortTag: "HÀN KHÍ HƯ VÔ",
    color: "#88c8ff",
    atkMult: 1.4,
    radiusPx: 48,
    summary: "Tạo vùng hàn khí 48px trong 2.5s, làm chậm 45% tốc độ & tăng +18% sát thương Đánh thường/Tụ lực trúng đích.",
  },
  {
    key: "void+volt",
    elements: ["void", "volt"],
    group: "expanded",
    vnName: "Đoản Mạch Hư Không",
    enName: "Void Arc",
    shortTag: "ĐOẢN MẠCH",
    color: "#c288ff",
    atkMult: 1.35,
    radiusPx: 76,
    summary: "Giật sét qua tối đa 4 mục tiêu (1.35× ATK), gây Nhiễu Loạn (Disrupt) giảm tốc độ/chính xác đòn địch 2.2s.",
  },
  {
    key: "nature+void",
    elements: ["void", "nature"],
    group: "expanded",
    vnName: "Thối Rữa Hư Không",
    enName: "Blight Decay",
    shortTag: "THỐI RỮA",
    color: "#8ce673",
    atkMult: 1.25,
    radiusPx: 50,
    summary: "Lan độc hư không (1.25× ATK), mục tiêu nhận thêm sát thương cộng dồn khi bị đánh liên tiếp trong 3.0s.",
  },
  {
    key: "chroma+fire",
    elements: ["chroma", "fire"],
    group: "expanded",
    vnName: "Nhật Thực Sắc Lửa",
    enName: "Chroma Ignis",
    shortTag: "NHẬT THỰC LỬA",
    color: "#ff7799",
    atkMult: 1.65,
    radiusPx: 58,
    summary: "Bùng nổ sóng lửa-sắc màu 58px (1.65× ATK), hồi +10% HP cho người chơi và bôi lại Ấn Sắc Độ.",
  },
  {
    key: "chroma+volt",
    elements: ["chroma", "volt"],
    group: "expanded",
    vnName: "Cực Quang Xung Điện",
    enName: "Chroma Surge",
    shortTag: "CỰC QUANG ĐIỆN",
    color: "#ffe875",
    atkMult: 1.25,
    radiusPx: 74,
    summary: "Tia điện sắc màu nảy tối đa 4 mục tiêu (1.25× ATK), hồi +18 Stamina và giảm hồi chiêu [E] (-0.8s).",
  },
  {
    key: "chroma+nature",
    elements: ["chroma", "nature"],
    group: "expanded",
    vnName: "Nở Rộ Sắc Màu",
    enName: "Chroma Bloom",
    shortTag: "NỞ RỘ SẮC MÀU",
    color: "#78ffae",
    atkMult: 1.3,
    radiusPx: 54,
    summary: "Tạo vùng sáng 54px trong 3.5s, hồi HP nhẹ theo nhịp và tăng +15% sát thương nguyên tố khi đứng trong vùng.",
  },
  {
    key: "chroma+ice",
    elements: ["chroma", "ice"],
    group: "expanded",
    vnName: "Lăng Kính Băng Sắc",
    enName: "Chroma Cryo",
    shortTag: "BĂNG SẮC",
    color: "#78f9ff",
    atkMult: 1.55,
    radiusPx: 50,
    summary: "Nổ băng-sắc màu 1.55× ATK, làm chậm mục tiêu & thưởng thêm Stamina/Overdrive khi hạ gục mục tiêu bị làm chậm.",
  },
  {
    key: "fire+wind",
    elements: ["fire", "wind"],
    group: "expanded",
    vnName: "Bão Lửa Cuốn",
    enName: "Firestorm Vortex",
    shortTag: "BÃO LỬA CUỐN",
    color: "#ff7744",
    atkMult: 1.65,
    radiusPx: 54,
    summary: "Luồng gió lửa cuốn quái trong 54px (1.65× ATK), thiêu đốt 2.0s và khuếch tán Ấn Hỏa sang mục tiêu lân cận.",
  },
  {
    key: "ice+wind",
    elements: ["ice", "wind"],
    group: "expanded",
    vnName: "Gió Tuyết Cắt",
    enName: "Cryo Gale",
    shortTag: "GIÓ TUYẾT CẮT",
    color: "#66f2ff",
    atkMult: 1.6,
    radiusPx: 52,
    summary: "Quét luồng băng gió 1.6× ATK, làm chậm 40% tốc độ di chuyển/ra đòn trong 2.5s và đẩy lùi nhẹ.",
  },
  {
    key: "volt+wind",
    elements: ["volt", "wind"],
    group: "expanded",
    vnName: "Lốc Sét Cộng Hưởng",
    enName: "Arc Tempest",
    shortTag: "LỐC SÉT",
    color: "#99ffdd",
    atkMult: 1.4,
    radiusPx: 68,
    summary: "Gió sét nảy điện giữa các mục tiêu gần (1.4× ATK), gây Khựng 0.35s và hồi Stamina theo số mục tiêu trúng.",
  },
  {
    key: "nature+wind",
    elements: ["nature", "wind"],
    group: "expanded",
    vnName: "Lốc Bào Tử Rừng",
    enName: "Spore Cyclone",
    shortTag: "LỐC BÀO TỬ",
    color: "#5ef2a8",
    atkMult: 1.35,
    radiusPx: 56,
    summary: "Cuốn lan độc/bào tử bán kính 56px (1.35× ATK), gom nhẹ quái về tâm và duy trì độc 2.5s.",
  },
  {
    key: "void+wind",
    elements: ["void", "wind"],
    group: "expanded",
    vnName: "Xoáy Hư Không",
    enName: "Void Maëlstrom",
    shortTag: "XOÁY HƯ KHÔNG",
    color: "#b58cff",
    atkMult: 1.7,
    radiusPx: 58,
    summary: "Hút mạnh quái tụ về tâm 58px gây 1.7× ATK hệ Hư Không, làm lệch hướng đòn đánh của địch trong 2.0s.",
  },
  {
    key: "chroma+wind",
    elements: ["chroma", "wind"],
    group: "expanded",
    vnName: "Lốc Sắc Cầu Vồng",
    enName: "Chroma Gust",
    shortTag: "LỐC CẦU VỒNG",
    color: "#88ffea",
    atkMult: 1.55,
    radiusPx: 56,
    summary: "Quét sóng gió sắc màu 1.55× ATK, bôi Ấn Sắc Độ lên địch trúng đòn & tăng tốc chạy/hồi Stamina 3.0s.",
  },
  {
    key: "fire+quake",
    elements: ["quake", "fire"],
    group: "expanded",
    vnName: "Địa Nhiệt Bùng Nổ",
    enName: "Magma Quake",
    shortTag: "ĐỊA NHIỆT",
    color: "#ff8822",
    atkMult: 1.8,
    radiusPx: 60,
    summary: "Sóng chấn động + lửa 60px (1.8× ATK), đẩy lùi mạnh 24px và phá ngay 35% Bleach Shield.",
  },
  {
    key: "quake+volt",
    elements: ["quake", "volt"],
    group: "expanded",
    vnName: "Sét Chấn Động",
    enName: "Thunder Slam",
    shortTag: "SÉT CHẤN ĐỘNG",
    color: "#ffd944",
    atkMult: 1.5,
    radiusPx: 56,
    summary: "Dội xung kích điện-chấn động (1.5× ATK), làm đầy nhanh thanh Stagger / Phá Thế của Tinh Anh & Boss.",
  },
  {
    key: "ice+quake",
    elements: ["quake", "ice"],
    group: "expanded",
    vnName: "Băng Nứt Địa Chấn",
    enName: "Tectonic Shatter",
    shortTag: "BĂNG ĐỊA CHẤN",
    color: "#78e8ff",
    atkMult: 1.75,
    radiusPx: 54,
    summary: "Làm nứt mặt đất (1.75× ATK), giảm giáp mục tiêu và cường hóa +35% đòn Tụ Lực tiếp theo!",
  },
  {
    key: "nature+quake",
    elements: ["quake", "nature"],
    group: "expanded",
    vnName: "Động Đất Rừng Sâu",
    enName: "Root Tremor",
    shortTag: "ĐỘNG ĐẤT RỪNG",
    color: "#7ee868",
    atkMult: 1.4,
    radiusPx: 56,
    summary: "Chấn động vùng 56px (1.4× ATK), trói chân 1.2s (hoặc làm chậm Boss) và hất khựng quái nhỏ.",
  },
  {
    key: "quake+wind",
    elements: ["quake", "wind"],
    group: "expanded",
    vnName: "Chấn Phong Địa Chấn",
    enName: "Quake Gale",
    shortTag: "CHẤN PHONG",
    color: "#ffd078",
    atkMult: 1.75,
    radiusPx: 60,
    summary: "Kết hợp chấn động và gió dội (1.75× ATK), đẩy lùi mạnh và bào nhanh thanh Stagger / Bleach Shield Boss.",
  },
  // 3 Cross-Expanded Pairs so ALL 28 pairs of the 8 elements trigger a rich reaction:
  {
    key: "chroma+void",
    elements: ["void", "chroma"],
    group: "expanded",
    vnName: "Nhật Thực Hư Sắc",
    enName: "Chroma Eclipse",
    shortTag: "HƯ SẮC",
    color: "#f288ff",
    atkMult: 1.65,
    radiusPx: 56,
    summary: "Đối cực Hư Không & Sắc Độ nổ 1.65× ATK, xóa buff địch, hồi +12 Overdrive [Q] và khôi phục vùng màu lớn.",
  },
  {
    key: "quake+void",
    elements: ["void", "quake"],
    group: "expanded",
    vnName: "Sụp Đổ Trọng Trường",
    enName: "Gravity Collapse",
    shortTag: "SỤP ĐỔ TRỌNG LỰC",
    color: "#c888ff",
    atkMult: 1.8,
    radiusPx: 58,
    summary: "Nén trọng trường Hư Không rồi dội chấn (1.8× ATK), hút gom quái và phá 35% Bleach Shield.",
  },
  {
    key: "chroma+quake",
    elements: ["chroma", "quake"],
    group: "expanded",
    vnName: "Địa Mạch Thất Sắc",
    enName: "Prismatic Tremor",
    shortTag: "ĐỊA MẠCH SẮC",
    color: "#ffbb55",
    atkMult: 1.65,
    radiusPx: 58,
    summary: "Dội sóng địa chấn cầu vồng 1.65× ATK, phá giáp mạnh, hồi +14 Stamina và bôi lại Ấn Sắc Độ.",
  },

  // === C. QUY TẮC ĐẶC BIỆT VỚI PRISM ===
  {
    key: "any+prism",
    elements: ["prism", "fire"],
    group: "prism",
    vnName: "Khúc Xạ Cầu Vồng",
    enName: "Prismatic Refraction",
    shortTag: "KHÚC XẠ CẦU VỒNG",
    color: "#ff88f2",
    atkMult: 1.9,
    radiusPx: 88,
    summary: "Kích hoạt phản ứng mạnh nhất của hệ đang bám mà KHÔNG xóa Ấn gốc, đồng thời bắn thêm 3 tia khúc xạ tự tìm quái lân cận!",
  },
];

export const REACTION_BY_KEY: ReadonlyMap<string, ReactionSpec> = new Map(
  REACTION_SPECS.map((r) => [r.key, r])
);

/** Peak partner element used when `prism` refracts an existing aura! */
export const PRISM_PEAK_PARTNER: Record<InfusableElement, InfusableElement> = {
  fire: "ice", // Thermal Shatter
  ice: "fire", // Thermal Shatter
  nature: "fire", // Toxic Eruption
  volt: "fire", // Overload Blast
  void: "wind", // Void Maelstrom
  chroma: "fire", // Chroma Ignis
  wind: "quake", // Quake Gale
  quake: "fire", // Magma Quake
};
