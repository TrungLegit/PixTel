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
      hp: 115,
      atk: 11,
      def: 3,
      spd: 92,
      crit: 10,
      critMult: 1.85,
      atkCooldown: 0.34,
      skillCooldown: 5.5,
      dashCooldown: 1.4,
    },
    uiBars: { hp: 5, atk: 4, spd: 3 },
    skills: {
      lmb: {
        name: "Tam Liên Trảm",
        desc: "Combo 3 nhịp (Chém đơn → Chém chéo → Bổ Chấn Động [Quake] phá Giáp Trắng rộng).",
      },
      charge: {
        name: "Thánh Kiếm Phá Địa (Giữ LMB)",
        desc: "Giơ kiếm trên cao tụ quang rồi bật nhảy bổ mạnh xuống đất tạo sóng chấn động Lăng Kính [Prism] phá Giáp Trắng diện rộng!",
      },
      skill: {
        name: "Kỹ Năng Vũ Khí (E / RMB)",
        desc: "Thay đổi linh hoạt theo từng Vũ Khí đang trang bị (41 chiêu riêng biệt).",
      },
      ult: {
        name: "Bão Kiếm Ánh Sáng (Q)",
        desc: "Xoay kiếm giải phóng bão cầu vồng [Prism + Quake] diện rộng, đẩy lùi & phá giáp cực mạnh.",
      },
    },
    previewFx: "pixtel/prism-storm",
  },
  {
    id: "chroma_mage",
    name: "CHROMA MAGE",
    vnName: "Pháp Sư Sắc Độ",
    role: "Pháp Sư / 9 Nguyên Tố",
    weaponType: "Trượng Phép",
    accent: "#ff66d8",
    secondary: "#ffee55",
    baseStats: {
      hp: 90,
      atk: 12,
      def: 1,
      spd: 96,
      crit: 12,
      critMult: 1.85,
      atkCooldown: 0.34,
      skillCooldown: 6.2,
      dashCooldown: 1.5,
    },
    uiBars: { hp: 3, atk: 5, spd: 3 },
    skills: {
      lmb: {
        name: "Ngũ Sắc Luân Chuyển",
        desc: "Xoay vòng Hỏa → Băng → Mộc → Lôi → Sắc Độ [Chroma], liên tục kích nổ chuỗi Phản Ứng!",
      },
      charge: {
        name: "Tam Nguyên Bộc Phát (Giữ LMB)",
        desc: "Tụ lực bắn chùm 3 cầu phép Hỏa - Băng - Gió [Wind] kích hoạt phản ứng kép tức thì.",
      },
      skill: {
        name: "Kỹ Năng Vũ Khí (E / RMB)",
        desc: "Thay đổi linh hoạt theo từng Trượng / Cầu Phép đang trang bị.",
      },
      ult: {
        name: "Mưa Thiên Thạch Thất Sắc (Q)",
        desc: "Giáng mưa thiên thạch Hỏa - Sắc Độ - Lăng Kính tạo chuỗi nổ cầu vồng khôi phục màu.",
      },
    },
    previewFx: "arcane/star-fall",
  },
  {
    id: "bit_rogue",
    name: "BIT ROGUE",
    vnName: "Sát Thủ Điểm Ảnh",
    role: "Cơ Động / Gió & Hư Không",
    weaponType: "Song Đao",
    accent: "#ff2e63",
    secondary: "#2ef2ff",
    baseStats: {
      hp: 88,
      atk: 10,
      def: 2,
      spd: 112,
      crit: 22,
      critMult: 2.1,
      atkCooldown: 0.22,
      skillCooldown: 4.8,
      dashCooldown: 1.15,
    },
    uiBars: { hp: 2, atk: 4, spd: 5 },
    skills: {
      lmb: {
        name: "Song Đao Phong Ảnh",
        desc: "Combo 3 nhịp chém song đao cận chiến cực nhanh; đòn kết N3 xoay lốc Gió [Wind] 360° khuếch tán Ấn!",
      },
      charge: {
        name: "Quạt Phi Tiêu Gió (Giữ LMB)",
        desc: "Tụ lực phóng 5 phi tiêu điểm ảnh hệ Gió [Wind] tỏa quạt, chí mạng cao khi đánh sau lưng.",
      },
      skill: {
        name: "Kỹ Năng Vũ Khí (E / RMB)",
        desc: "Thay đổi linh hoạt theo từng Song Đao / Phi Luân / Vuốt đang trang bị.",
      },
      ult: {
        name: "Phân Thân Ảo Ảnh (Q)",
        desc: "Triệu hồi phân thân đồng bộ đòn đánh, +100% tốc đánh & +25% Crit trong 6s.",
      },
    },
    previewFx: "melee/spin-slash",
  },
  {
    id: "pixel_tinker",
    name: "PIXEL TINKER",
    vnName: "Kỹ Sư Mạch Sáng",
    role: "Triệu Hồi / Lôi & Địa Chấn",
    weaponType: "Súng Hạt",
    accent: "#44ee88",
    secondary: "#ffe066",
    baseStats: {
      hp: 98,
      atk: 10,
      def: 2,
      spd: 98,
      crit: 11,
      critMult: 1.8,
      atkCooldown: 0.25,
      skillCooldown: 5.5,
      dashCooldown: 1.45,
    },
    uiBars: { hp: 4, atk: 3, spd: 4 },
    skills: {
      lmb: {
        name: "Súng Mạch Hạt",
        desc: "Bắn đạn Lôi [Volt] tầm xa; bắn vào Trụ của mình để hồi máu & kích Quá Tải tốc bắn cho trụ!",
      },
      charge: {
        name: "Pháo Địa Chấn Từ Trường (Giữ LMB)",
        desc: "Tụ lực bắn tia xuyên giáp hệ Chấn Động [Quake], phá mạnh Bleach Shield & Overclock mọi trụ.",
      },
      skill: {
        name: "Kỹ Năng Vũ Khí (E / RMB)",
        desc: "Thay đổi linh hoạt theo từng Súng / Pháo / Bệ Tên Lửa đang trang bị.",
      },
      ult: {
        name: "Drone Sắc Độ Quá Tải (Q)",
        desc: "Triệu hồi Drone xả tia Sắc Độ [Chroma] & Lôi, hồi HP/Stamina liên tục cho bản thân và trụ.",
      },
    },
    previewFx: "lightning/zap-hit",
  },
];

export function getClassDef(id: ClassId): ClassDef {
  return CLASSES.find((c) => c.id === id) ?? CLASSES[0];
}
