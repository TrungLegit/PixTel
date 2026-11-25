import type { ClassId } from "./types";

export interface ClassDef {
  id: ClassId;
  name: string;
  vnName: string;
  role: string;
  weaponType: string;
  accent: string;
  secondary: string;
  baseStats: {
    hp: number;
    atk: number;
    def: number;
    spd: number;
    crit: number; // 0..100
    critMult: number;
    atkCooldown: number;
    skillCooldown: number;
    dashCooldown: number;
  };
  uiBars: { hp: number; atk: number; spd: number };
  skills: {
    lmb: { name: string; desc: string };
    charge: { name: string; desc: string };
    skill: { name: string; desc: string };
    ult: { name: string; desc: string };
  };
  previewFx: string;
}

export const CLASSES: ClassDef[] = [
  {
    id: "prism_knight",
    name: "PRISM KNIGHT",
    vnName: "Vệ Binh Lăng Kính",
    role: "Tank / Phản Đòn",
    weaponType: "Kiếm & Khiên",
    accent: "#4be8ff",
    secondary: "#ffffff",
    baseStats: {
      hp: 155,
      atk: 20,
      def: 8,
      spd: 94,
      crit: 12,
      critMult: 1.85,
      atkCooldown: 0.34,
      skillCooldown: 5.5,
      dashCooldown: 1.4,
    },
    uiBars: { hp: 5, atk: 4, spd: 3 },
    skills: {
      lmb: {
        name: "Tam Liên Trảm",
        desc: "Combo 3 đòn vòng cung (Chém đơn → Chém chéo → Bổ Lăng Kính rộng).",
      },
      charge: {
        name: "Đâm Lướt Tụ Lực (Giữ LMB)",
        desc: "Tụ lực tiêu hao Thể lực rồi lao đâm xuyên thấu địch kèm tia sáng bùng nổ.",
      },
      skill: {
        name: "Khiên Phản Đòn (E)",
        desc: "Giơ khiên Lăng Kính 1.0s chặn sát thương và bắn ngược tia laser đa sắc.",
      },
      ult: {
        name: "Bão Kiếm Ánh Sáng (Q)",
        desc: "Xoay kiếm giải phóng bão cầu vồng diện rộng, đẩy lùi và gây sát thương cực lớn.",
      },
    },
    previewFx: "pixtel/prism-beam",
  },
  {
    id: "chroma_mage",
    name: "CHROMA MAGE",
    vnName: "Pháp Sư Sắc Độ",
    role: "Pháp Sư / Nguyên Tố",
    weaponType: "Trượng Phép",
    accent: "#ff66d8",
    secondary: "#ffee55",
    baseStats: {
      hp: 110,
      atk: 22,
      def: 4,
      spd: 98,
      crit: 15,
      critMult: 1.85,
      atkCooldown: 0.34,
      skillCooldown: 6.2,
      dashCooldown: 1.5,
    },
    uiBars: { hp: 3, atk: 5, spd: 3 },
    skills: {
      lmb: {
        name: "Tam Sắc Nguyên Tố",
        desc: "Xoay vòng Đỏ (Lửa), Lam (Băng), Lục (Độc). Trúng hệ cũ kích nổ Phản Ứng Nguyên Tố!",
      },
      charge: {
        name: "Tam Nguyên Bộc Phát (Giữ LMB)",
        desc: "Tụ lực bắn cùng lúc 3 cầu phép Lửa-Băng-Độc kích hoạt chuỗi phản ứng ngay lập tức.",
      },
      skill: {
        name: "Vòng Xoáy Sắc Màu (E)",
        desc: "Tạo xoáy năng lượng hút quái vào tâm, gây sát thương liên tục & gắn ấn nguyên tố.",
      },
      ult: {
        name: "Mưa Thiên Thạch (Q)",
        desc: "Triệu hồi mưa thiên thạch cầu vồng giáng xuống tạo chuỗi vụ nổ pixel rực rỡ.",
      },
    },
    previewFx: "pixtel/chroma-vortex",
  },
  {
    id: "bit_rogue",
    name: "BIT ROGUE",
    vnName: "Sát Thủ Điểm Ảnh",
    role: "Cơ Động / Chí Mạng",
    weaponType: "Song Đao",
    accent: "#ff2e63",
    secondary: "#2ef2ff",
    baseStats: {
      hp: 105,
      atk: 17,
      def: 5,
      spd: 118,
      crit: 30,
      critMult: 2.15,
      atkCooldown: 0.21,
      skillCooldown: 4.8,
      dashCooldown: 1.15,
    },
    uiBars: { hp: 2, atk: 4, spd: 5 },
    skills: {
      lmb: {
        name: "Song Đao & Phi Tiêu",
        desc: "Chém nhanh cận chiến kèm phóng phi tiêu điểm ảnh xuyên mục tiêu, tỷ lệ Crit cao.",
      },
      charge: {
        name: "Quạt Phi Tiêu (Giữ LMB)",
        desc: "Tụ lực phóng 5 phi tiêu điểm ảnh tỏa hình quạt có khả năng chí mạng cao.",
      },
      skill: {
        name: "Frame-Skip (E)",
        desc: "Lướt xuyên quái bất tử ngắn, để lại tàn ảnh nhiễu glitch phát nổ sau 0.8s.",
      },
      ult: {
        name: "Phân Thân Ảo Ảnh (Q)",
        desc: "Tạo phân thân điện tử đồng bộ đòn đánh, +100% tốc đánh & +25% Crit trong 6s.",
      },
    },
    previewFx: "pixtel/frame-skip",
  },
  {
    id: "pixel_tinker",
    name: "PIXEL TINKER",
    vnName: "Kỹ Sư Mạch Sáng",
    role: "Triệu Hồi / Kiểm Soát",
    weaponType: "Súng Hạt",
    accent: "#44ee88",
    secondary: "#ffe066",
    baseStats: {
      hp: 120,
      atk: 16,
      def: 6,
      spd: 102,
      crit: 14,
      critMult: 1.8,
      atkCooldown: 0.24,
      skillCooldown: 5.5,
      dashCooldown: 1.45,
    },
    uiBars: { hp: 4, atk: 3, spd: 4 },
    skills: {
      lmb: {
        name: "Súng Mạch Hạt",
        desc: "Bắn đạn năng lượng tầm xa. Bắn vào Trụ của mình để hồi máu & tăng tốc bắn cho trụ!",
      },
      charge: {
        name: "Pháo Điện Từ (Giữ LMB)",
        desc: "Tụ lực bắn tia xuyên giáp tầm xa gây sát thương cao và đẩy lùi quái.",
      },
      skill: {
        name: "Compile — Trụ Pixel (E)",
        desc: "Biên dịch Trụ Bắn tự động ngắm quái (tối đa 2 trụ) bằng lưới hologram.",
      },
      ult: {
        name: "Drone Quá Tải (Q)",
        desc: "Triệu hồi Drone bay quanh xả laser liên thanh và hồi HP liên tục cho bản thân & trụ.",
      },
    },
    previewFx: "pixtel/compile-turret",
  },
];

export function getClassDef(id: ClassId): ClassDef {
  return CLASSES.find((c) => c.id === id) ?? CLASSES[0];
}
