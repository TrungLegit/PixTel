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
        desc: "Combo 3 nhịp (Chém đơn → Chém chéo → Bổ Chấn Động [Quake] phá Giáp Trắng rộng).",
      },
      charge: {
        name: "Đâm Lướt Lăng Kính (Giữ LMB)",
        desc: "Tụ lực lao đâm xuyên thấu địch kèm tia Lăng Kính [Prism] kích nổ Khúc Xạ Cầu Vồng.",
      },
      skill: {
        name: "Khiên Phản Đòn (E / RMB)",
        desc: "Giơ khiên 1.0s (chặn chuẩn 0.25s đầu giảm 50% CD) và bắn tia Lăng Kính [Prism].",
      },
      ult: {
        name: "Bão Kiếm Ánh Sáng (Q)",
        desc: "Xoay kiếm giải phóng bão cầu vồng [Prism + Quake] diện rộng, đẩy lùi & phá giáp cực mạnh.",
      },
    },
    previewFx: "pixtel/prism-beam",
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
        name: "Ngũ Sắc Luân Chuyển",
        desc: "Xoay vòng Hỏa → Băng → Mộc → Lôi → Sắc Độ [Chroma], liên tục kích nổ chuỗi Phản Ứng!",
      },
      charge: {
        name: "Tam Nguyên Bộc Phát (Giữ LMB)",
        desc: "Tụ lực bắn chùm 3 cầu phép Hỏa - Băng - Gió [Wind] kích hoạt phản ứng kép tức thì.",
      },
      skill: {
        name: "Xoáy Hư Sắc (E / RMB)",
        desc: "Tạo xoáy Hư Không [Void] gom quái về tâm, xóa buff địch & liên tục nhảy ấn đa nguyên tố.",
      },
      ult: {
        name: "Mưa Thiên Thạch Thất Sắc (Q)",
        desc: "Giáng mưa thiên thạch Hỏa - Sắc Độ - Lăng Kính tạo chuỗi nổ cầu vồng khôi phục màu.",
      },
    },
    previewFx: "pixtel/chroma-vortex",
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
        name: "Song Đao Phong Ảnh",
        desc: "Chém cực nhanh + phóng phi tiêu xuyên thấu; đòn kết N3 quét lốc Gió [Wind] khuếch tán Ấn!",
      },
      charge: {
        name: "Quạt Phi Tiêu Gió (Giữ LMB)",
        desc: "Tụ lực phóng 5 phi tiêu điểm ảnh hệ Gió [Wind] tỏa quạt, chí mạng cao khi đánh sau lưng.",
      },
      skill: {
        name: "Frame-Skip Hư Không (E / RMB)",
        desc: "Lướt xuyên quái bất tử, để lại tàn ảnh Hư Không [Void] hút nhẹ và phát nổ xóa buff sau 0.75s.",
      },
      ult: {
        name: "Phân Thân Ảo Ảnh (Q)",
        desc: "Triệu hồi phân thân đồng bộ đòn đánh, +100% tốc đánh & +25% Crit trong 6s.",
      },
    },
    previewFx: "pixtel/frame-skip",
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
        desc: "Bắn đạn Lôi [Volt] tầm xa; bắn vào Trụ của mình để hồi máu & kích Quá Tải tốc bắn cho trụ!",
      },
      charge: {
        name: "Pháo Địa Chấn Từ Trường (Giữ LMB)",
        desc: "Tụ lực bắn tia xuyên giáp hệ Chấn Động [Quake], phá mạnh Bleach Shield & Overclock mọi trụ.",
      },
      skill: {
        name: "Compile — Trụ Lôi Quang (E / RMB)",
        desc: "Biên dịch tối đa 2 Trụ Bắn tự động gắn Ấn Lôi [Volt] để phối hợp phản ứng nguyên tố.",
      },
      ult: {
        name: "Drone Sắc Độ Quá Tải (Q)",
        desc: "Triệu hồi Drone xả tia Sắc Độ [Chroma] & Lôi, hồi HP/Stamina liên tục cho bản thân và trụ.",
      },
    },
    previewFx: "pixtel/compile-turret",
  },
];

export function getClassDef(id: ClassId): ClassDef {
  return CLASSES.find((c) => c.id === id) ?? CLASSES[0];
}
