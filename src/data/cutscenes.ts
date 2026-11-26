import type { ClassId } from "./types";
import type { HeroAttackKind } from "../graphics/pixelfxHeroModels";

export type StoryCutsceneId =
  | "scene_intro"
  | "scene_boss_warden"
  | "scene_boss_blight"
  | "scene_boss_gilded"
  | "scene_boss_eraser"
  | "scene_ending";

export type CutsceneBackdropId =
  | "town_golden"
  | "bleach_invasion"
  | "meadow_ancient"
  | "quartz_cavern"
  | "amber_forge"
  | "void_sanctum"
  | "rainbow_dawn";

export type CutsceneSetpieceId =
  | "origin_town"
  | "four_pillars"
  | "ancient_canopy"
  | "magma_fissure"
  | "ice_spires"
  | "sky_rift"
  | "shattered_prism"
  | "horizon_biomes";

export type CutsceneWeatherId =
  | "petals"
  | "ash"
  | "snow"
  | "glitch_rain"
  | "prism_sparks";

export interface CutsceneActorSpec {
  kind: "hero" | "enemy" | "elder" | "crystal";
  classIdOverride?: ClassId;
  enemyId?: string;
  x: number; // 0..480 stage coordinates
  y: number; // 0..200 stage coordinates (baseline)
  moveFromX?: number;
  moveFromY?: number;
  moveDuration?: number;
  enterDelay?: number;
  scale?: number;
  facing?: 1 | -1;
  anim?: "idle" | "run" | "charge" | "attack";
  attackKind?: HeroAttackKind;
  enemyAttack?: boolean;
  floatAmp?: number;
  bleached?: boolean;
  auraColor?: string;
}

export interface CutsceneFxCue {
  modId: string;
  x: number;
  y: number;
  delay: number;
  repeatEvery?: number;
  palette?: string;
  options?: Record<string, unknown>;
}

export interface CutsceneBeat {
  sceneLabel?: string;
  titleCard?: { main: string; sub: string; color?: string };
  backdrop: CutsceneBackdropId;
  setpiece?: CutsceneSetpieceId;
  weather?: CutsceneWeatherId;
  camPanX?: number;
  /** 0 = full color, 0..1 = animated monochrome bleach wipe ratio */
  bleachSweep?: number;
  /** When true, sweeps from bleached grayscale BACK into vibrant 16-bit color */
  restoreSweep?: boolean;
  speaker: string;
  speakerColor: string;
  text: string;
  actors: CutsceneActorSpec[];
  fxCues: CutsceneFxCue[];
  cameraShake?: number;
  flashColor?: string;
  sfx?: "waypoint" | "explosion" | "slash" | "magic" | "boss" | "quest";
}

export interface StoryCutsceneDef {
  id: StoryCutsceneId;
  chapter: string;
  title: string;
  subtitle: string;
  accent: string;
  unlockHint: string;
  alwaysUnlocked?: boolean;
  beats: CutsceneBeat[];
}

export const STORY_CUTSCENES: StoryCutsceneDef[] = [
  {
    id: "scene_intro",
    chapter: "HỒI MỞ ĐẦU · BIÊN NIÊN SỬ AETHEL-16",
    title: "ĐÊM TẨY TRẮNG & NGỌN ĐÈN CUỐI CÙNG",
    subtitle: "16 phân cảnh sử thi từ Kỷ Nguyên Sắc Màu, Đại Thảm Họa The Eraser đến khoảnh khắc {PLAYER_NAME} thức tỉnh",
    accent: "#5ef2ff",
    unlockHint: "Mở sẵn khi bắt đầu hành trình",
    alwaysUnlocked: true,
    beats: [
      // CẢNH 01: KHÚC DẠO ĐẦU BÌNH MINH — 9 TRỤ SẮC MÀU
      {
        sceneLabel: "CẢNH 01 · KỶ NGUYÊN SẮC MÀU",
        titleCard: {
          main: "AETHEL-16",
          sub: "THUỞ KHAI NGUYÊN CỦA CHÍN TRỤ SẮC MÀU",
          color: "#ffe066",
        },
        backdrop: "rainbow_dawn",
        setpiece: "four_pillars",
        weather: "prism_sparks",
        camPanX: 10,
        speaker: "BIÊN NIÊN SỬ AETHEL-16",
        speakerColor: "#ffe066",
        text: "Từ thuở bình minh của thế giới 16-bit, vương quốc Aethel-16 được dệt nên từ ánh sáng của Đại Lăng Kính — nơi 9 Trụ Sắc Màu tỏa rạng nuôi dưỡng từng nhành cỏ, từng dải tinh thể và từng trái tim sống động.",
        actors: [
          { kind: "crystal", x: 240, y: 120, moveFromY: 136, moveDuration: 1.4, scale: 1.35, floatAmp: 4, auraColor: "#5ef2ff" },
        ],
        fxCues: [
          { modId: "pixtel/color-wave", x: 240, y: 112, delay: 0.1, repeatEvery: 2.1, options: { radius: 135 } },
          { modId: "pixtel/rainbow-burst", x: 240, y: 92, delay: 0.55, repeatEvery: 2.4 },
        ],
        sfx: "waypoint",
      },

      // CẢNH 02: THỊ TRẤN KHỞI NGUYÊN HƯNG THỊNH & TỨ ĐẠI TIỀN BỐI
      {
        sceneLabel: "CẢNH 02 · THỊ TRẤN KHỞI NGUYÊN",
        backdrop: "town_golden",
        setpiece: "origin_town",
        weather: "prism_sparks",
        camPanX: -8,
        speaker: "TRƯỞNG LÀNG ELIAN (KÝ ỨC XƯA)",
        speakerColor: "#5ef2ff",
        text: "Giữa trái tim vương quốc là Thị Trấn Khởi Nguyên ấm ánh đèn lồng. Dưới sự bảo hộ của Tứ Đại Chiến Binh — Vệ Binh, Pháp Sư, Sát Thủ và Kỹ Sư — suốt ngàn năm chẳng hề có bóng tối nào bén mảng.",
        actors: [
          { kind: "hero", classIdOverride: "prism_knight", x: 86, y: 156, moveFromX: 48, moveDuration: 1.1, facing: 1, scale: 1.3, anim: "run" },
          { kind: "hero", classIdOverride: "chroma_mage", x: 146, y: 156, moveFromX: 116, moveDuration: 1.1, facing: 1, scale: 1.3, anim: "idle" },
          { kind: "elder", x: 240, y: 154, facing: 1, scale: 1.45 },
          { kind: "hero", classIdOverride: "bit_rogue", x: 334, y: 156, moveFromX: 364, moveDuration: 1.1, facing: -1, scale: 1.3, anim: "idle" },
          { kind: "hero", classIdOverride: "pixel_tinker", x: 394, y: 156, moveFromX: 432, moveDuration: 1.1, facing: -1, scale: 1.3, anim: "run" },
        ],
        fxCues: [
          { modId: "holy/heal-aoe", x: 240, y: 154, delay: 0.2, repeatEvery: 2.4 },
          { modId: "pixtel/color-wave", x: 240, y: 136, delay: 0.7, repeatEvery: 2.6, options: { radius: 96 } },
        ],
        sfx: "magic",
      },

      // CẢNH 03: THẢO NGUYÊN LỤC BẢO & THẦN RỪNG CỔ THỤ
      {
        sceneLabel: "CẢNH 03 · THẢO NGUYÊN LỤC BẢO",
        backdrop: "meadow_ancient",
        setpiece: "ancient_canopy",
        weather: "petals",
        camPanX: 8,
        speaker: "BIÊN NIÊN SỬ — MIỀN ĐÔNG",
        speakerColor: "#58e878",
        text: "Ở phía Đông, Hộ Vệ Cổ Thụ Xing Warden cùng những Golem Rễ Cây gìn giữ nhịp thở xanh ngát của Thảo Nguyên — từng cơn gió lá ngọc mang sự trù phú lan tỏa khắp đất trời.",
        actors: [
          { kind: "enemy", enemyId: "null_slime", x: 116, y: 156, scale: 1.35, facing: 1 },
          { kind: "enemy", enemyId: "boss_xing_warden", x: 242, y: 156, moveFromY: 170, moveDuration: 1.0, scale: 1.75, auraColor: "#44ee88" },
          { kind: "enemy", enemyId: "root_golem", x: 366, y: 156, scale: 1.35, facing: -1 },
        ],
        fxCues: [
          { modId: "pixtel/leaf-storm", x: 242, y: 118, delay: 0.12, repeatEvery: 2.1 },
          { modId: "holy/heal-aoe", x: 242, y: 154, delay: 0.5, repeatEvery: 2.3 },
        ],
        sfx: "magic",
      },

      // CẢNH 04: ĐỈNH THẠCH ANH & HỎA NGỤC HỔ PHÁCH HÒA HỢP
      {
        sceneLabel: "CẢNH 04 · PHƯƠNG BẮC BĂNG GIÁ & LÒ RÈN NAM",
        backdrop: "quartz_cavern",
        setpiece: "ice_spires",
        weather: "snow",
        camPanX: -10,
        speaker: "BIÊN NIÊN SỬ — CÂN BẰNG 9 NGUYÊN TỐ",
        speakerColor: "#66ecff",
        text: "Rồng Lăng Kính Blight Prism phản chiếu ánh cực quang trên Đỉnh Thạch Anh, đối ứng cùng ngọn lửa bất diệt của Chúa Tể Hổ Phách Gilded Null phía Nam — giữ cho 9 Nguyên Tố vận hành hoàn mỹ.",
        actors: [
          { kind: "enemy", enemyId: "boss_blight_root", x: 154, y: 132, moveFromX: 110, moveDuration: 1.1, scale: 1.65, facing: 1, floatAmp: 5, auraColor: "#4be8ff" },
          { kind: "crystal", x: 242, y: 122, scale: 1.0, floatAmp: 3, auraColor: "#ffe066" },
          { kind: "enemy", enemyId: "boss_gilded_null", x: 332, y: 156, moveFromX: 372, moveDuration: 1.1, scale: 1.65, facing: -1, auraColor: "#ff9933" },
        ],
        fxCues: [
          { modId: "ice/frost-nova", x: 154, y: 122, delay: 0.15, repeatEvery: 2.0 },
          { modId: "fire/fireball", x: 332, y: 122, delay: 0.35, repeatEvery: 1.9 },
          { modId: "pixtel/color-wave", x: 242, y: 116, delay: 0.65, repeatEvery: 2.3, options: { radius: 92 } },
        ],
        sfx: "waypoint",
      },

      // CẢNH 05: KẼ NỨT BẦU TRỜI — DẤU HIỆU CỦA KIẾN TRÚC SƯ VAELOR
      {
        sceneLabel: "CẢNH 05 · BẦU TRỜI NỨT TOÁC",
        titleCard: {
          main: "GIAO THỨC XÓA SẮC",
          sub: "CẢNH BÁO HỆ THỐNG · KẼ NỨT HƯ VÔ ĐÃ MỞ",
          color: "#d688ff",
        },
        backdrop: "void_sanctum",
        setpiece: "sky_rift",
        weather: "glitch_rain",
        speaker: "GIỌNG NÓI TỪ HƯ KHÔNG (KIẾN TRÚC SƯ VAELOR)",
        speakerColor: "#c888ff",
        text: "Cho đến một đêm không trăng... bầu trời phía Bắc bỗng xé toạc bởi hàng trăm tia sét tím trắng! Một giọng nói lạnh băng vang vọng khắp từng dòng mã nguồn của Aethel-16: \"THẾ GIỚI NÀY QUÁ HỖN LOẠN... BẮT ĐẦU THANH TẨY!\"",
        actors: [
          { kind: "crystal", x: 240, y: 136, scale: 1.1, floatAmp: 2, auraColor: "#d688ff" },
        ],
        fxCues: [
          { modId: "lightning/zap-hit", x: 240, y: 66, delay: 0.08, repeatEvery: 1.1 },
          { modId: "scifi/glitch", x: 240, y: 88, delay: 0.2, repeatEvery: 1.2 },
          { modId: "pixtel/sonic-wave", x: 240, y: 78, delay: 0.45, repeatEvery: 1.9, palette: "shadow" },
        ],
        cameraShake: 6,
        flashColor: "rgba(215, 165, 255, 0.42)",
        sfx: "explosion",
      },

      // CẢNH 06: THE ERASER GIÁNG LÂM TỪ TRÊN TRỜI
      {
        sceneLabel: "CẢNH 06 · THE ERASER GIÁNG LÂM",
        backdrop: "bleach_invasion",
        setpiece: "sky_rift",
        weather: "glitch_rain",
        bleachSweep: 0.45,
        speaker: "THE ERASER — THỰC THỂ XÓA SẮC",
        speakerColor: "#ffffff",
        text: "Từ tâm vết nứt, thực thể mang đôi cánh pha lê trắng–tím giáng xuống như cơn ác mộng không thể chống cự — THE ERASER! Mỗi nhịp vỗ cánh của hắn hút cạn ánh sáng khỏi cả vùng trời.",
        actors: [
          { kind: "enemy", enemyId: "boss_the_eraser", x: 240, y: 124, moveFromY: 42, moveDuration: 1.35, scale: 2.05, enemyAttack: true, floatAmp: 5, auraColor: "#c888ff" },
        ],
        fxCues: [
          { modId: "pixtel/hex-shield", x: 240, y: 82, delay: 0.35, repeatEvery: 2.1, options: { radius: 52 } },
          { modId: "scifi/glitch", x: 240, y: 88, delay: 0.15, repeatEvery: 1.4 },
          { modId: "pixtel/sonic-wave", x: 240, y: 84, delay: 0.55, repeatEvery: 2.0, palette: "shadow" },
        ],
        cameraShake: 5.5,
        flashColor: "rgba(255, 255, 255, 0.32)",
        sfx: "boss",
      },

      // CẢNH 07: ĐẠO QUÂN VÔ SẮC TRÀN XUỐNG
      {
        sceneLabel: "CẢNH 07 · QUÂN ĐOÀN HƯ VÔ",
        backdrop: "bleach_invasion",
        setpiece: "sky_rift",
        weather: "glitch_rain",
        bleachSweep: 0.7,
        speaker: "THE ERASER",
        speakerColor: "#d8b4ff",
        text: "\"TIẾN LÊN, HỠI CÁC CHIẾN BINH VÔ SẮC! XÓA SẠCH MỌI KÝ ỨC, PHONG ẤN MỌI TRỤ MÀU VÀ ĐƯA AETHEL-16 VỀ TRANG GIẤY TRẮNG TUYỆT ĐỐI!\"",
        actors: [
          { kind: "enemy", enemyId: "void_gatekeeper", x: 78, y: 152, moveFromX: 24, moveDuration: 1.0, scale: 1.4, facing: 1, floatAmp: 3 },
          { kind: "enemy", enemyId: "null_knight", x: 152, y: 156, moveFromX: 102, moveDuration: 1.1, scale: 1.45, facing: 1, bleached: true },
          { kind: "enemy", enemyId: "boss_the_eraser", x: 244, y: 124, scale: 1.85, floatAmp: 4, auraColor: "#b866ff" },
          { kind: "enemy", enemyId: "void_wraith", x: 334, y: 146, moveFromX: 382, moveDuration: 1.1, scale: 1.45, facing: -1, floatAmp: 4 },
          { kind: "enemy", enemyId: "prism_golem", x: 404, y: 150, moveFromX: 452, moveDuration: 1.0, scale: 1.4, facing: -1, floatAmp: 3 },
        ],
        fxCues: [
          { modId: "pixtel/hex-shield", x: 244, y: 84, delay: 0.15, repeatEvery: 2.2, options: { radius: 46 } },
          { modId: "pixtel/chroma-vortex", x: 244, y: 96, delay: 0.45, repeatEvery: 2.4, options: { radius: 66 } },
          { modId: "scifi/glitch", x: 152, y: 124, delay: 0.25, repeatEvery: 1.5 },
          { modId: "scifi/glitch", x: 334, y: 122, delay: 0.5, repeatEvery: 1.5 },
        ],
        cameraShake: 4.5,
        sfx: "boss",
      },

      // CẢNH 08: TIA TẨY TRẮNG QUÉT NGANG VƯƠNG QUỐC
      {
        sceneLabel: "CẢNH 08 · LÀN SÓNG TẨY TRẮNG",
        backdrop: "town_golden",
        setpiece: "origin_town",
        weather: "glitch_rain",
        bleachSweep: 0.96,
        speaker: "BIÊN NIÊN SỬ — NGÀY ĐẠI HỌA",
        speakerColor: "#e2e8f0",
        text: "Một luồng TIA TẨY TRẮNG chói lòa xé ngang chân trời! Cơn sóng xám lạnh tràn qua những mái nhà, rừng cây và dòng suối — rút sạch sắc màu của cả vương quốc chỉ trong vài nhịp tim!",
        actors: [
          { kind: "elder", x: 112, y: 156, facing: 1, scale: 1.45 },
          { kind: "enemy", enemyId: "boss_the_eraser", x: 342, y: 124, scale: 1.9, facing: -1, enemyAttack: true, floatAmp: 4, auraColor: "#ffffff" },
        ],
        fxCues: [
          { modId: "pixtel/prism-beam", x: 320, y: 92, delay: 0.1, repeatEvery: 1.8, palette: "bone", options: { angle: Math.PI, length: 240 } },
          { modId: "scifi/glitch", x: 170, y: 110, delay: 0.25, repeatEvery: 1.2 },
          { modId: "pixtel/sonic-wave", x: 240, y: 108, delay: 0.45, repeatEvery: 1.9, palette: "stone" },
        ],
        cameraShake: 7,
        flashColor: "rgba(255, 255, 255, 0.5)",
        sfx: "explosion",
      },

      // CẢNH 09: HỘ VỆ RỪNG & RỒNG THẠCH ANH BỊ HẮC HÓA
      {
        sceneLabel: "CẢNH 09 · HAI HỘ VỆ SA NGÃ",
        backdrop: "meadow_ancient",
        setpiece: "ancient_canopy",
        weather: "glitch_rain",
        bleachSweep: 0.85,
        speaker: "XING WARDEN & BLIGHT PRISM",
        speakerColor: "#a8ff98",
        text: "Những xiềng xích Giáp Trắng siết chặt lấy các vị thần cổ xưa! Xing Warden gào thét giữa rừng cây héo úa, còn Blight Prism phát cuồng phóng ra hàng vạn lưỡi dao pha lê đóng băng phương Bắc!",
        actors: [
          { kind: "enemy", enemyId: "boss_xing_warden", x: 146, y: 156, scale: 1.75, facing: 1, enemyAttack: true, auraColor: "#88ffaa" },
          { kind: "enemy", enemyId: "boss_blight_root", x: 332, y: 132, scale: 1.7, facing: -1, enemyAttack: true, floatAmp: 5, auraColor: "#66ecff" },
        ],
        fxCues: [
          { modId: "pixtel/leaf-storm", x: 146, y: 122, delay: 0.1, repeatEvery: 2.0 },
          { modId: "ice/frost-nova", x: 332, y: 124, delay: 0.25, repeatEvery: 1.9 },
          { modId: "scifi/glitch", x: 240, y: 112, delay: 0.4, repeatEvery: 1.3 },
        ],
        cameraShake: 5,
        sfx: "boss",
      },

      // CẢNH 10: HỎA NGỤC HỔ PHÁCH NỔI LOẠN
      {
        sceneLabel: "CẢNH 10 · NGỌN LỬA CUỒNG NỘ",
        backdrop: "amber_forge",
        setpiece: "magma_fissure",
        weather: "ash",
        bleachSweep: 0.55,
        speaker: "CHÚA TỂ HỔ PHÁCH — GILDED NULL",
        speakerColor: "#ffb84d",
        text: "Ở cực Nam, Lò Rèn Cổ Đại rung chuyển dữ dội! Chúa Tể Hổ Phách bị tà khí ăn mòn, giáng càng dung nham thiêu đốt mọi kẻ tiến gần, biến cả vùng đất thành biển lửa bất khả xâm phạm!",
        actors: [
          { kind: "enemy", enemyId: "amber_warrior", x: 108, y: 156, scale: 1.4, facing: 1 },
          { kind: "enemy", enemyId: "boss_gilded_null", x: 246, y: 156, scale: 1.9, enemyAttack: true, auraColor: "#ff6622" },
          { kind: "enemy", enemyId: "cinder_imp", x: 374, y: 148, scale: 1.4, facing: -1, floatAmp: 3 },
        ],
        fxCues: [
          { modId: "impacts/ground-slam", x: 246, y: 156, delay: 0.12, repeatEvery: 1.7, palette: "fire" },
          { modId: "explosions/plasma-explosion", x: 184, y: 134, delay: 0.35, repeatEvery: 1.9, palette: "fire" },
          { modId: "explosions/plasma-explosion", x: 312, y: 134, delay: 0.6, repeatEvery: 1.9, palette: "fire" },
        ],
        cameraShake: 6,
        flashColor: "rgba(255, 130, 40, 0.34)",
        sfx: "explosion",
      },

      // CẢNH 11: TRẬN CHIẾN CUỐI CỦA TỨ ĐẠI TIỀN BỐI
      {
        sceneLabel: "CẢNH 11 · TỨ ĐẠI CHIẾN BINH QUYẾT TỬ",
        backdrop: "void_sanctum",
        setpiece: "shattered_prism",
        weather: "prism_sparks",
        speaker: "TỨ ĐẠI CHIẾN BINH KHỞI NGUYÊN",
        speakerColor: "#ffe066",
        text: "Trước bờ vực diệt vong, bốn chiến binh huyền thoại đã dồn toàn bộ sinh mệnh tung đòn hợp kích cuối cùng vào The Eraser! Kiếm thánh, thiên thạch, song đao và pháo lôi đồng loạt gầm vang!",
        actors: [
          { kind: "hero", classIdOverride: "prism_knight", x: 136, y: 156, moveFromX: 90, moveDuration: 0.8, facing: 1, scale: 1.4, anim: "attack", attackKind: "overhead_slam", auraColor: "#4be8ff" },
          { kind: "hero", classIdOverride: "chroma_mage", x: 74, y: 154, facing: 1, scale: 1.35, anim: "attack", attackKind: "orb_levitate", auraColor: "#ff66d8" },
          { kind: "hero", classIdOverride: "bit_rogue", x: 194, y: 156, moveFromX: 140, moveDuration: 0.7, facing: 1, scale: 1.35, anim: "attack", attackKind: "dual_cross_slash", auraColor: "#ff2e63" },
          { kind: "hero", classIdOverride: "pixel_tinker", x: 38, y: 156, facing: 1, scale: 1.3, anim: "attack", attackKind: "recoil_barrage", auraColor: "#44ee88" },
          { kind: "enemy", enemyId: "boss_the_eraser", x: 348, y: 124, scale: 1.95, facing: -1, enemyAttack: true, floatAmp: 4, auraColor: "#ffffff" },
        ],
        fxCues: [
          { modId: "melee/heavy-cleave", x: 224, y: 132, delay: 0.1, repeatEvery: 1.5, palette: "gold", options: { radius: 56 } },
          { modId: "lightning/zap-hit", x: 318, y: 102, delay: 0.28, repeatEvery: 1.3 },
          { modId: "arcane/star-fall", x: 342, y: 92, delay: 0.45, repeatEvery: 1.7, palette: "candy" },
          { modId: "pixtel/hex-shield", x: 348, y: 86, delay: 0.15, repeatEvery: 1.9, options: { radius: 46 } },
        ],
        cameraShake: 6.5,
        flashColor: "rgba(255, 235, 160, 0.36)",
        sfx: "slash",
      },

      // CẢNH 12: ĐẠI LĂNG KÍNH VỠ THÀNH 8 BIA KÝ CỔ XƯA
      {
        sceneLabel: "CẢNH 12 · LĂNG KÍNH VỠ VỤN",
        backdrop: "void_sanctum",
        setpiece: "shattered_prism",
        weather: "prism_sparks",
        bleachSweep: 0.75,
        speaker: "BIÊN NIÊN SỬ — KHOẢNH KHẮC ĐỊNH MỆNH",
        speakerColor: "#7ceaff",
        text: "Vụ va chạm kinh thiên động địa khiến Đại Lăng Kính vỡ tan thành 8 mảnh Bia Ký văng khắp bốn phương! Cú phản chấn buộc The Eraser phải rút về Tháp Hư Vô... nhưng cả thế giới đã chìm vào giấc ngủ đơn sắc.",
        actors: [
          { kind: "crystal", x: 240, y: 120, scale: 1.3, floatAmp: 6, auraColor: "#ffffff" },
        ],
        fxCues: [
          { modId: "explosions/plasma-explosion", x: 240, y: 98, delay: 0.08, repeatEvery: 1.8, palette: "candy" },
          { modId: "holy/smite", x: 240, y: 112, delay: 0.28, repeatEvery: 2.0, palette: "holy" },
          { modId: "spawn/disintegrate", x: 240, y: 108, delay: 0.42, repeatEvery: 2.2 },
          { modId: "pixtel/sonic-wave", x: 240, y: 100, delay: 0.65, repeatEvery: 2.1, palette: "cyber" },
        ],
        cameraShake: 7,
        flashColor: "rgba(255, 255, 255, 0.55)",
        sfx: "explosion",
      },

      // CẢNH 13: NGỌN ĐÈN CUỐI CÙNG TẠI QUẢNG TRƯỜNG KHỞI NGUYÊN
      {
        sceneLabel: "CẢNH 13 · NGỌN ĐÈN CUỐI CÙNG",
        backdrop: "town_golden",
        setpiece: "origin_town",
        weather: "ash",
        bleachSweep: 0.46,
        camPanX: 6,
        speaker: "TRƯỞNG LÀNG ELIAN",
        speakerColor: "#5ef2ff",
        text: "Mười năm trôi qua... Thị Trấn Khởi Nguyên trở thành ốc đảo sắc màu cuối cùng còn chống cự được bóng tối. Đêm nào Trưởng Làng Elian cũng đứng bên mảnh tinh thể yếu ớt, chờ đợi người kế thừa được ánh sáng chọn mặt gửi vàng.",
        actors: [
          { kind: "elder", x: 176, y: 156, moveFromX: 138, moveDuration: 1.2, facing: 1, scale: 1.55 },
          { kind: "crystal", x: 266, y: 132, scale: 0.92, floatAmp: 3, auraColor: "#ffe066" },
        ],
        fxCues: [
          { modId: "holy/heal", x: 266, y: 126, delay: 0.2, repeatEvery: 2.3 },
          { modId: "pixtel/color-wave", x: 266, y: 130, delay: 0.7, repeatEvery: 2.8, options: { radius: 68 } },
        ],
        sfx: "magic",
      },

      // CẢNH 14: LỜI HIỆU TRIỆU DÀNH RIÊNG CHO {PLAYER_NAME}
      {
        sceneLabel: "CẢNH 14 · SỰ THỨC TỈNH CỦA {PLAYER_NAME}",
        backdrop: "town_golden",
        setpiece: "origin_town",
        weather: "prism_sparks",
        speaker: "TRƯỞNG LÀNG ELIAN",
        speakerColor: "#ffe066",
        text: "\"Mảnh Lăng Kính đang rung lên rực rỡ chưa từng thấy! Chính là bạn — {PLAYER_NAME}! Với tư chất của một {CLASS_NAME}, xin hãy nhận lấy tia hy vọng cuối cùng này và thắp sáng lại cả Aethel-16!\"",
        actors: [
          { kind: "elder", x: 136, y: 156, facing: 1, scale: 1.55 },
          { kind: "crystal", x: 236, y: 124, scale: 1.05, floatAmp: 4, auraColor: "#ffe066" },
          { kind: "hero", x: 326, y: 156, moveFromX: 416, moveDuration: 1.25, facing: -1, scale: 1.5, anim: "charge", auraColor: "#ffe066" },
        ],
        fxCues: [
          { modId: "holy/holy-pillar", x: 326, y: 152, delay: 0.25, repeatEvery: 2.2, palette: "holy" },
          { modId: "pixtel/overdrive-aura", x: 326, y: 146, delay: 0.45, repeatEvery: 2.1 },
          { modId: "ui/level-up", x: 326, y: 148, delay: 0.85, repeatEvery: 2.6 },
        ],
        flashColor: "rgba(255, 232, 130, 0.3)",
        sfx: "waypoint",
      },

      // CẢNH 15: CHÉM TOẠC MÀN SƯƠNG TẨY TRẮNG
      {
        sceneLabel: "CẢNH 15 · ÁNH SÁNG XÉ TAN VÔ SẮC",
        backdrop: "meadow_ancient",
        setpiece: "ancient_canopy",
        weather: "petals",
        restoreSweep: true,
        speaker: "{PLAYER_NAME} · {CLASS_NAME}",
        speakerColor: "#70f0b4",
        text: "Sức mạnh nguyên tố chảy tràn trong huyết quản {PLAYER_NAME}! Một đòn đánh mang khí phách của người hùng xé toạc màn sương Tẩy Trắng, đánh thức sắc xanh đầu tiên trở lại với mặt đất!",
        actors: [
          { kind: "hero", x: 186, y: 156, moveFromX: 120, moveDuration: 0.75, facing: 1, scale: 1.6, anim: "attack", auraColor: "#ffe066" },
          { kind: "crystal", x: 332, y: 130, scale: 1.1, floatAmp: 4, auraColor: "#70f0b4" },
        ],
        fxCues: [
          { modId: "melee/heavy-cleave", x: 224, y: 134, delay: 0.15, repeatEvery: 1.8, palette: "gold", options: { radius: 58 } },
          { modId: "impacts/ground-slam", x: 248, y: 154, delay: 0.3, repeatEvery: 1.8, palette: "holy" },
          { modId: "pixtel/color-wave", x: 240, y: 138, delay: 0.55, repeatEvery: 2.3, options: { radius: 130 } },
        ],
        cameraShake: 4.5,
        flashColor: "rgba(255, 234, 138, 0.32)",
        sfx: "slash",
      },

      // CẢNH 16: KHỞI HÀNH VIẾT TIẾP BIÊN NIÊN SỬ
      {
        sceneLabel: "CẢNH 16 · HÀNH TRÌNH BẮT ĐẦU",
        titleCard: {
          main: "HỒI I: NGỌN ĐÈN CUỐI CÙNG",
          sub: "CHIẾN BINH {PLAYER_NAME} · {CLASS_NAME}",
          color: "#5ef2ff",
        },
        backdrop: "rainbow_dawn",
        setpiece: "horizon_biomes",
        weather: "prism_sparks",
        camPanX: 12,
        speaker: "BIÊN NIÊN SỬ AETHEL-16",
        speakerColor: "#ffe066",
        text: "Phía trước là 4 Quần Xã rộng lớn, 8 Bia Ký thất lạc, hàng chục vũ khí tuyệt kỹ, Rương Kho Báu Theo Mùa và 4 Đại Thủ Lĩnh đang chờ bị đánh bại! Tiến lên nào {PLAYER_NAME} — số phận của Aethel-16 nằm trong tay bạn!",
        actors: [
          { kind: "elder", x: 132, y: 156, facing: 1, scale: 1.45 },
          { kind: "hero", x: 238, y: 156, moveFromX: 204, moveDuration: 1.0, facing: 1, scale: 1.65, anim: "idle", auraColor: "#5ef2ff" },
          { kind: "crystal", x: 344, y: 126, scale: 1.15, floatAmp: 4, auraColor: "#ffe066" },
        ],
        fxCues: [
          { modId: "pixtel/color-wave", x: 238, y: 136, delay: 0.15, repeatEvery: 2.2, options: { radius: 125 } },
          { modId: "holy/holy-pillar", x: 238, y: 152, delay: 0.45, repeatEvery: 2.4, palette: "holy" },
          { modId: "pixtel/rainbow-burst", x: 344, y: 108, delay: 0.75, repeatEvery: 2.3 },
        ],
        sfx: "quest",
      },
    ],
  },

  {
    id: "scene_boss_warden",
    chapter: "HỒI II · THẢO NGUYÊN LỤC BẢO",
    title: "HỘ VỆ CỔ THỤ — XING WARDEN",
    subtitle: "Vị thần rừng bị dây leo Tẩy Trắng điều khiển thức giấc",
    accent: "#44ee88",
    unlockHint: "Chạm trán Boss Hộ Vệ Cổ Thụ ở Thảo Nguyên",
    beats: [
      {
        backdrop: "meadow_ancient",
        setpiece: "ancient_canopy",
        weather: "petals",
        bleachSweep: 0.55,
        speaker: "HỘ VỆ CỔ THỤ — XING WARDEN",
        speakerColor: "#58e878",
        text: "Mặt đất Thảo Nguyên rung chuyển! Những rễ cổ thụ trắng bệch trỗi dậy vây kín khu rừng — vị Hộ Vệ ngàn năm đã bị lời nguyền Vô Sắc xâm chiếm tâm trí.",
        actors: [
          { kind: "enemy", enemyId: "root_golem", x: 118, y: 156, scale: 1.35, facing: 1 },
          { kind: "enemy", enemyId: "boss_xing_warden", x: 254, y: 156, moveFromY: 174, moveDuration: 0.9, scale: 1.75, auraColor: "#44ee88" },
          { kind: "enemy", enemyId: "thorn_archer", x: 376, y: 156, scale: 1.35, facing: -1 },
        ],
        fxCues: [
          { modId: "pixtel/leaf-storm", x: 254, y: 122, delay: 0.1, repeatEvery: 2.1 },
          { modId: "nature/thorns", x: 184, y: 152, delay: 0.4, repeatEvery: 2.0 },
          { modId: "nature/thorns", x: 320, y: 152, delay: 0.6, repeatEvery: 2.0 },
        ],
        cameraShake: 4,
        sfx: "boss",
      },
      {
        backdrop: "meadow_ancient",
        setpiece: "ancient_canopy",
        weather: "petals",
        bleachSweep: 0.45,
        speaker: "XING WARDEN",
        speakerColor: "#a8ff78",
        text: "\"KẺ XÂM NHẬP... TẤT CẢ SẮC XANH ĐỀU ĐÃ HÉO TÀN! ĐỪNG HÒNG CHẠM VÀO TRỤ SẮC MÀU CỦA KHU RỪNG NÀY!\"",
        actors: [
          { kind: "enemy", enemyId: "boss_xing_warden", x: 292, y: 154, scale: 1.9, facing: -1, enemyAttack: true, auraColor: "#66ff88" },
          { kind: "hero", x: 136, y: 156, facing: 1, scale: 1.45, anim: "charge" },
        ],
        fxCues: [
          { modId: "impacts/ground-slam", x: 256, y: 156, delay: 0.15, repeatEvery: 1.8, palette: "leaf" },
          { modId: "pixtel/sonic-wave", x: 268, y: 124, delay: 0.35, repeatEvery: 1.9, palette: "poison" },
        ],
        cameraShake: 5.5,
        sfx: "explosion",
      },
      {
        backdrop: "meadow_ancient",
        setpiece: "ancient_canopy",
        weather: "petals",
        speaker: "{PLAYER_NAME}",
        speakerColor: "#ffe066",
        text: "\"Tôi không đến để phá hủy khu rừng — tôi đến để giải thoát ông khỏi Giáp Trắng! {PLAYER_NAME}, xuất chiến!\"",
        actors: [
          { kind: "hero", x: 162, y: 156, moveFromX: 118, moveDuration: 0.6, facing: 1, scale: 1.55, anim: "attack", auraColor: "#ffe066" },
          { kind: "enemy", enemyId: "boss_xing_warden", x: 322, y: 154, scale: 1.75, facing: -1 },
        ],
        fxCues: [
          { modId: "pixtel/overdrive-aura", x: 162, y: 142, delay: 0.08, repeatEvery: 2.0 },
          { modId: "melee/heavy-cleave", x: 204, y: 134, delay: 0.25, repeatEvery: 1.8, palette: "holy", options: { radius: 52 } },
        ],
        sfx: "slash",
      },
    ],
  },

  {
    id: "scene_boss_blight",
    chapter: "HỒI III · ĐỈNH THẠCH ANH",
    title: "RỒNG LĂNG KÍNH — BLIGHT PRISM",
    subtitle: "Cơn bão pha lê phản chiếu hàng vạn tia sáng chết chóc",
    accent: "#4be8ff",
    unlockHint: "Chạm trán Boss Rồng Lăng Kính ở Đỉnh Thạch Anh",
    beats: [
      {
        backdrop: "quartz_cavern",
        setpiece: "ice_spires",
        weather: "snow",
        bleachSweep: 0.5,
        speaker: "RỒNG LĂNG KÍNH — BLIGHT PRISM",
        speakerColor: "#66ecff",
        text: "Giữa đại sảnh thạch anh đóng băng, đôi cánh pha lê khổng lồ xé toạc bầu không khí lạnh giá! Blight Prism — kẻ giữ mạch quang phổ của miền Bắc — đã thức tỉnh.",
        actors: [
          { kind: "enemy", enemyId: "quartz_knight", x: 118, y: 156, scale: 1.4, facing: 1 },
          { kind: "enemy", enemyId: "boss_blight_root", x: 256, y: 132, moveFromY: 64, moveDuration: 1.0, scale: 1.75, facing: -1, floatAmp: 5, auraColor: "#4be8ff" },
          { kind: "enemy", enemyId: "bleach_hound", x: 374, y: 138, scale: 1.4, facing: -1, floatAmp: 4 },
        ],
        fxCues: [
          { modId: "ice/frost-nova", x: 256, y: 128, delay: 0.15, repeatEvery: 2.0 },
          { modId: "pixtel/chroma-vortex", x: 256, y: 132, delay: 0.45, repeatEvery: 2.5, options: { radius: 48 } },
        ],
        cameraShake: 4,
        sfx: "boss",
      },
      {
        backdrop: "quartz_cavern",
        setpiece: "ice_spires",
        weather: "snow",
        speaker: "BLIGHT PRISM",
        speakerColor: "#a8f4ff",
        text: "Tiếng gầm cộng hưởng làm hàng trăm mũi tinh thể đồng loạt phóng ra! Chỉ cần một khoảnh khắc sơ sẩy, mọi tia sáng sẽ bị bẻ gãy thành cát bụi.",
        actors: [
          { kind: "enemy", enemyId: "boss_blight_root", x: 298, y: 130, scale: 1.85, facing: -1, enemyAttack: true, floatAmp: 4 },
          { kind: "hero", x: 136, y: 156, facing: 1, scale: 1.45, anim: "charge" },
        ],
        fxCues: [
          { modId: "lightning/zap-hit", x: 215, y: 134, delay: 0.12, repeatEvery: 1.3 },
          { modId: "pixtel/sonic-wave", x: 266, y: 120, delay: 0.3, repeatEvery: 1.8, palette: "ice" },
        ],
        cameraShake: 5,
        flashColor: "rgba(120, 235, 255, 0.3)",
        sfx: "magic",
      },
      {
        backdrop: "quartz_cavern",
        setpiece: "ice_spires",
        weather: "snow",
        speaker: "{PLAYER_NAME}",
        speakerColor: "#5ef2ff",
        text: "\"Phản ứng nguyên tố sẽ phá tan lớp Giáp Pha Lê này! Đến lúc trả lại bầu trời trong xanh cho Đỉnh Thạch Anh!\"",
        actors: [
          { kind: "hero", x: 156, y: 156, moveFromX: 112, moveDuration: 0.6, facing: 1, scale: 1.55, anim: "attack", auraColor: "#4be8ff" },
          { kind: "enemy", enemyId: "boss_blight_root", x: 326, y: 134, scale: 1.7, facing: -1, floatAmp: 4 },
        ],
        fxCues: [
          { modId: "holy/smite", x: 210, y: 132, delay: 0.18, repeatEvery: 2.0, palette: "ice" },
          { modId: "pixtel/color-wave", x: 186, y: 142, delay: 0.45, repeatEvery: 2.4, options: { radius: 90 } },
        ],
        sfx: "waypoint",
      },
    ],
  },

  {
    id: "scene_boss_gilded",
    chapter: "HỒI IV · HỎA NGỤC HỔ PHÁCH",
    title: "CHÚA TỂ HỔ PHÁCH — GILDED NULL",
    subtitle: "Vị vua dung nham cầm quyền trượng lửa nơi lò rèn cổ đại",
    accent: "#ff9933",
    unlockHint: "Chạm trán Boss Chúa Tể Hổ Phách tại Vùng Dung Nham",
    beats: [
      {
        backdrop: "amber_forge",
        setpiece: "magma_fissure",
        weather: "ash",
        bleachSweep: 0.32,
        speaker: "CHÚA TỂ HỔ PHÁCH — GILDED NULL",
        speakerColor: "#ffb84d",
        text: "Nhựa hổ phách sôi sục dâng cao như sóng thần! Từ ngai vàng dung nham, Chúa Tể Hổ Phách Gilded Null bước ra cùng đội cận vệ rực lửa.",
        actors: [
          { kind: "enemy", enemyId: "amber_warrior", x: 118, y: 156, scale: 1.45, facing: 1 },
          { kind: "enemy", enemyId: "boss_gilded_null", x: 256, y: 154, moveFromY: 174, moveDuration: 0.9, scale: 1.85, auraColor: "#ff8822" },
          { kind: "enemy", enemyId: "cinder_imp", x: 374, y: 150, scale: 1.45, facing: -1, floatAmp: 3 },
        ],
        fxCues: [
          { modId: "fire/fireball", x: 256, y: 120, delay: 0.12, repeatEvery: 1.8 },
          { modId: "explosions/small-explosion", x: 188, y: 146, delay: 0.4, repeatEvery: 1.9 },
          { modId: "explosions/small-explosion", x: 326, y: 146, delay: 0.65, repeatEvery: 1.9 },
        ],
        cameraShake: 5,
        sfx: "boss",
      },
      {
        backdrop: "amber_forge",
        setpiece: "magma_fissure",
        weather: "ash",
        speaker: "GILDED NULL",
        speakerColor: "#ffe066",
        text: "\"MỘT KẺ PHÀM TRẦN DÁM BƯỚC VÀO LÒ RÈN CỦA TA SAO? CÀNG DUNG NHAM NÀY SẼ NUNG CHẢY CẢ VŨ KHÍ LẪN SẮC MÀU CỦA NGƯƠI!\"",
        actors: [
          { kind: "enemy", enemyId: "boss_gilded_null", x: 294, y: 154, scale: 1.95, facing: -1, enemyAttack: true, auraColor: "#ff5522" },
          { kind: "hero", x: 136, y: 156, facing: 1, scale: 1.45, anim: "charge" },
        ],
        fxCues: [
          { modId: "impacts/ground-slam", x: 244, y: 156, delay: 0.1, repeatEvery: 1.7, palette: "fire" },
          { modId: "explosions/plasma-explosion", x: 230, y: 132, delay: 0.35, repeatEvery: 2.0, palette: "fire" },
        ],
        cameraShake: 6,
        flashColor: "rgba(255, 145, 45, 0.34)",
        sfx: "explosion",
      },
      {
        backdrop: "amber_forge",
        setpiece: "magma_fissure",
        weather: "ash",
        speaker: "{PLAYER_NAME}",
        speakerColor: "#ffe066",
        text: "\"Ngọn lửa thật sự là để rèn nên hy vọng, không phải để thiêu rụi thế giới! Hãy xem sức mạnh của {CLASS_NAME}!\"",
        actors: [
          { kind: "hero", x: 158, y: 156, moveFromX: 114, moveDuration: 0.6, facing: 1, scale: 1.55, anim: "attack", auraColor: "#ffaa33" },
          { kind: "enemy", enemyId: "boss_gilded_null", x: 326, y: 154, scale: 1.8, facing: -1 },
        ],
        fxCues: [
          { modId: "holy/smite", x: 270, y: 136, delay: 0.15, repeatEvery: 1.9, palette: "gold" },
          { modId: "pixtel/overdrive-aura", x: 158, y: 142, delay: 0.25, repeatEvery: 2.0 },
        ],
        sfx: "slash",
      },
    ],
  },

  {
    id: "scene_boss_eraser",
    chapter: "HỒI V · THÁP HƯ VÔ",
    title: "ĐỐI MẶT THE ERASER",
    subtitle: "Trận chiến định mệnh quyết định vận mệnh toàn cõi Aethel-16",
    accent: "#d678ff",
    unlockHint: "Tiến vào Lãnh Địa Boss Cuối The Eraser tại Tháp Hư Vô",
    beats: [
      {
        backdrop: "void_sanctum",
        setpiece: "sky_rift",
        weather: "glitch_rain",
        bleachSweep: 0.72,
        speaker: "THE ERASER — KIẾN TRÚC SƯ VAELOR",
        speakerColor: "#d688ff",
        text: "Tại đỉnh Tháp Hư Vô nơi thời gian ngừng trôi, thực thể cánh pha lê trắng tỏa ra áp lực nghẹt thở. Hai hộ vệ hư không giương khiên nhiễu bảo vệ chủ nhân.",
        actors: [
          { kind: "enemy", enemyId: "void_gatekeeper", x: 116, y: 152, scale: 1.45, facing: 1, floatAmp: 3 },
          { kind: "enemy", enemyId: "boss_the_eraser", x: 248, y: 124, moveFromY: 60, moveDuration: 1.1, scale: 2.0, floatAmp: 5, auraColor: "#c866ff" },
          { kind: "enemy", enemyId: "prism_golem", x: 374, y: 148, scale: 1.45, facing: -1, floatAmp: 3 },
        ],
        fxCues: [
          { modId: "pixtel/hex-shield", x: 248, y: 82, delay: 0.1, repeatEvery: 2.0, options: { radius: 52 } },
          { modId: "scifi/glitch", x: 248, y: 86, delay: 0.35, repeatEvery: 1.5 },
          { modId: "pixtel/chroma-vortex", x: 248, y: 90, delay: 0.6, repeatEvery: 2.5, options: { radius: 58 } },
        ],
        cameraShake: 5,
        sfx: "boss",
      },
      {
        backdrop: "void_sanctum",
        setpiece: "sky_rift",
        weather: "glitch_rain",
        bleachSweep: 0.85,
        speaker: "THE ERASER",
        speakerColor: "#ffffff",
        text: "\"THẾ GIỚI NÀY ĐẦY RẪY LỖI LẦM VÀ HỖN LOẠN... CHỈ CÓ TRANG GIẤY TRẮNG TUYỆT ĐỐI MỚI LÀ HOÀN HẢO! {PLAYER_NAME}, NGƯƠI CŨNG SẼ BỊ XÓA KHỎI BỘ NHỚ!\"",
        actors: [
          { kind: "enemy", enemyId: "boss_the_eraser", x: 306, y: 122, scale: 2.05, facing: -1, enemyAttack: true, floatAmp: 4, auraColor: "#ffffff" },
          { kind: "hero", x: 132, y: 156, facing: 1, scale: 1.45, anim: "charge" },
        ],
        fxCues: [
          { modId: "pixtel/prism-beam", x: 290, y: 96, delay: 0.15, repeatEvery: 1.9, palette: "bone", options: { angle: Math.PI, length: 155 } },
          { modId: "scifi/glitch", x: 185, y: 120, delay: 0.35, repeatEvery: 1.4 },
        ],
        cameraShake: 6.5,
        flashColor: "rgba(255, 255, 255, 0.38)",
        sfx: "explosion",
      },
      {
        backdrop: "void_sanctum",
        setpiece: "four_pillars",
        weather: "prism_sparks",
        restoreSweep: true,
        speaker: "{PLAYER_NAME} · CHIẾN BINH THẤT SẮC",
        speakerColor: "#ffe066",
        text: "\"Không! Chính những sắc màu không hoàn hảo mới khiến Aethel-16 đáng sống! Toàn bộ ánh sáng của 3 miền đất — HÃY CỘNG HƯỞNG CÙNG TA!\"",
        actors: [
          { kind: "hero", x: 156, y: 156, moveFromX: 110, moveDuration: 0.65, facing: 1, scale: 1.6, anim: "attack", auraColor: "#ffe066" },
          { kind: "crystal", x: 224, y: 118, scale: 0.9, floatAmp: 4, auraColor: "#5ef2ff" },
          { kind: "enemy", enemyId: "boss_the_eraser", x: 334, y: 124, scale: 1.85, floatAmp: 4 },
        ],
        fxCues: [
          { modId: "holy/holy-pillar", x: 156, y: 150, delay: 0.08, repeatEvery: 2.1, palette: "holy" },
          { modId: "pixtel/rainbow-burst", x: 224, y: 108, delay: 0.25, repeatEvery: 1.9 },
          { modId: "pixtel/color-wave", x: 196, y: 138, delay: 0.5, repeatEvery: 2.4, options: { radius: 115 } },
        ],
        flashColor: "rgba(255, 230, 120, 0.35)",
        sfx: "waypoint",
      },
    ],
  },

  {
    id: "scene_ending",
    chapter: "HỒI KẾT · BẢN GIAO HƯỞNG THẤT SẮC",
    title: "BÌNH MINH TRỞ LẠI AETHEL-16",
    subtitle: "Giao thức Tẩy Trắng tan biến, vương quốc 16-bit hồi sinh rực rỡ",
    accent: "#ffe066",
    unlockHint: "Đánh bại Boss Cuối The Eraser để mở khóa Hồi Kết",
    beats: [
      {
        backdrop: "void_sanctum",
        setpiece: "shattered_prism",
        weather: "prism_sparks",
        restoreSweep: true,
        speaker: "THE ERASER — KIẾN TRÚC SƯ VAELOR",
        speakerColor: "#b8ecff",
        text: "Đôi cánh pha lê nứt vỡ thành ngàn mảnh cầu vồng dịu êm... \"Có lẽ... ngươi đã đúng, {PLAYER_NAME}. Một thế giới rực rỡ sắc màu đẹp hơn trang giấy trắng rất nhiều...\"",
        actors: [
          { kind: "hero", x: 146, y: 156, facing: 1, scale: 1.55, anim: "idle", auraColor: "#ffe066" },
          { kind: "enemy", enemyId: "boss_the_eraser", x: 300, y: 128, scale: 1.85, floatAmp: 6, auraColor: "#ffffff" },
        ],
        fxCues: [
          { modId: "spawn/disintegrate", x: 300, y: 106, delay: 0.12, repeatEvery: 2.1 },
          { modId: "pixtel/rainbow-burst", x: 300, y: 92, delay: 0.35, repeatEvery: 1.8 },
          { modId: "explosions/plasma-explosion", x: 300, y: 96, delay: 0.65, repeatEvery: 2.3, palette: "candy" },
        ],
        cameraShake: 4.5,
        flashColor: "rgba(255, 250, 210, 0.45)",
        sfx: "waypoint",
      },
      {
        backdrop: "rainbow_dawn",
        setpiece: "horizon_biomes",
        weather: "prism_sparks",
        restoreSweep: true,
        speaker: "BIÊN NIÊN SỬ AETHEL-16",
        speakerColor: "#5ef2ff",
        text: "Một làn sóng cầu vồng khổng lồ lan tỏa từ Tháp Hư Vô qua từng ngọn núi, cánh rừng và đại dương pixel! Mọi mảnh đất từng bị Tẩy Trắng bừng tỉnh trong ánh bình minh 16-bit!",
        actors: [
          { kind: "crystal", x: 240, y: 116, scale: 1.35, floatAmp: 5, auraColor: "#ffe066" },
        ],
        fxCues: [
          { modId: "pixtel/color-wave", x: 240, y: 120, delay: 0.08, repeatEvery: 1.9, options: { radius: 135 } },
          { modId: "pixtel/rainbow-burst", x: 150, y: 118, delay: 0.35, repeatEvery: 2.1 },
          { modId: "pixtel/rainbow-burst", x: 330, y: 118, delay: 0.65, repeatEvery: 2.1 },
        ],
        sfx: "quest",
      },
      {
        backdrop: "rainbow_dawn",
        setpiece: "origin_town",
        weather: "prism_sparks",
        speaker: "TRƯỞNG LÀNG ELIAN",
        speakerColor: "#ffe066",
        text: "\"Cảm ơn người hùng {PLAYER_NAME} — {CLASS_NAME} huyền thoại của Aethel-16! Tên của bạn sẽ mãi được khắc trên Quảng Trường Khởi Nguyên. Hành trình chinh phục thần khí +10 và Rương Mùa vẫn còn ở phía trước!\"",
        actors: [
          { kind: "elder", x: 162, y: 154, facing: 1, scale: 1.55 },
          { kind: "hero", x: 244, y: 156, facing: 1, scale: 1.6, anim: "idle", auraColor: "#ffe066" },
          { kind: "crystal", x: 326, y: 128, scale: 1.1, floatAmp: 4, auraColor: "#70f0b4" },
        ],
        fxCues: [
          { modId: "ui/level-up", x: 244, y: 146, delay: 0.1, repeatEvery: 2.2 },
          { modId: "holy/heal-aoe", x: 244, y: 154, delay: 0.4, repeatEvery: 2.5 },
          { modId: "pixtel/rainbow-burst", x: 244, y: 102, delay: 0.6, repeatEvery: 2.0 },
        ],
        sfx: "quest",
      },
    ],
  },
];

export const STORY_CUTSCENE_BY_ID: Record<StoryCutsceneId, StoryCutsceneDef> = Object.fromEntries(
  STORY_CUTSCENES.map((s) => [s.id, s])
) as Record<StoryCutsceneId, StoryCutsceneDef>;

export function getBossCutsceneId(bossDefId: string): StoryCutsceneId | null {
  switch (bossDefId) {
    case "boss_xing_warden":
      return "scene_boss_warden";
    case "boss_blight_root":
      return "scene_boss_blight";
    case "boss_gilded_null":
      return "scene_boss_gilded";
    case "boss_the_eraser":
      return "scene_boss_eraser";
    default:
      return null;
  }
}

export function interpolateCutsceneText(text: string, playerName: string, className: string): string {
  const safeName = playerName.trim() || "Chroma-Walker";
  const safeClass = className.trim() || "Chiến Binh Lăng Kính";
  return text.replace(/\{PLAYER_NAME\}/g, safeName).replace(/\{CLASS_NAME\}/g, safeClass);
}
