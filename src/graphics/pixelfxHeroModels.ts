import { CLASSES } from "../data/classes";
import { ITEMS, RARITY_INFO } from "../data/items";
import { ELEMENT_META, normalizeElement } from "../data/elements";
import type { ClassId, EquipSlot, ItemDef, ItemInstance } from "../data/types";
import {
  clearFrame,
  createFrame,
  hex,
  mix,
  poseAt,
  posedStyled,
  READY,
} from "../vfx/pixelfx/core/index.js";
import type {
  PixelfxActor,
  PixelfxFrame,
  PixelfxPosedSprite,
  PixelfxPosedTheme,
} from "../vfx/pixelfxTypes";

export type PixelfxHeroAnimState = "idle" | "run" | "attack" | "charge" | "dash";

export type HeroAttackKind =
  | "punch_1"
  | "punch_2"
  | "punch_3"
  | "uppercut"
  | "slash_1"
  | "slash_2"
  | "cleave"
  | "thrust"
  | "flurry_1"
  | "flurry_2"
  | "spin"
  | "cast_1"
  | "cast_2"
  | "cast_3"
  | "cast_heavy"
  | "cast_ult"
  | "shoot"
  | "shoot_heavy"
  | "beam"
  | "storm";

export interface PixelfxHeroDrawOptions {
  classId: ClassId;
  equipment: Partial<Record<EquipSlot, ItemInstance>>;
  x: number;
  y: number;
  rigScale?: number;
  drawScale?: number;
  walkFrame: number;
  facing: number;
  facingDir?: "down" | "up" | "left" | "right";
  animState?: PixelfxHeroAnimState;
  attackKind?: HeroAttackKind;
  attackProgress?: number;
  aimAngle?: number;
  shieldGuard?: boolean;
  hitFlash?: boolean;
  bleached?: boolean;
  time?: number;
  chargePct?: number;
  aegisActive?: boolean;
  buffActive?: boolean;
}

export interface BakedPixelfxHero {
  w: number;
  h: number;
  anchorX: number;
  anchorY: number;
  colorCanvas: HTMLCanvasElement;
  lightCanvas: HTMLCanvasElement;
  bleachedCanvas: HTMLCanvasElement;
  whiteCanvas: HTMLCanvasElement;
  actor: PixelfxActor;
}

type PoseRecord = Record<string, number | string | boolean | undefined>;
type PoseKey = [number, PoseRecord] | [number, PoseRecord, "in" | "out" | "line" | "snap"];

const posedFn = posedStyled as unknown as (
  pose: PoseRecord,
  theme?: PixelfxPosedTheme,
  scale?: number
) => PixelfxPosedSprite;

const poseAtFn = poseAt as unknown as (track: PoseKey[], t: number) => PoseRecord;
const READY_POSE = READY as unknown as PoseRecord;

function computeLocalPitch(aimAngle: number | undefined): number {
  if (aimAngle === undefined) return 0;
  const raw = Math.atan2(Math.sin(aimAngle), Math.abs(Math.cos(aimAngle)));
  if (raw < -0.35) return -0.42;
  if (raw > 0.35) return 0.42;
  return 0;
}

const INK_DEFAULT = hex("#0e0c18") >>> 0;
const SEAM_DEFAULT = hex("#222436") >>> 0;
const SKIN_RAMP = ["#ffe0c4", "#f0b98e", "#c98b63", "#8f5940"].map((c) => hex(c) >>> 0);
const NOVICE_BOOTS_RAMP = ["#9c7352", "#785338", "#573924", "#362214"].map((c) => hex(c) >>> 0);

function rampFromHex(baseHex: string, darkHex = "#111322", hiHex = "#ffffff"): number[] {
  const b = hex(baseHex) >>> 0;
  const d = hex(darkHex) >>> 0;
  const h = hex(hiHex) >>> 0;
  return [
    mix(b, h, 0.42) >>> 0,
    b,
    mix(b, d, 0.38) >>> 0,
    mix(b, d, 0.68) >>> 0,
  ];
}

function rampList(list: [string, string, string, string]): number[] {
  return list.map((c) => hex(c) >>> 0);
}

interface ClassVisualPreset {
  headgear: PixelfxPosedTheme["headgear"];
  backAccessory: PixelfxPosedTheme["backAccessory"];
  shieldedByWeapon: boolean;
  hairRamp: number[];
  noviceTunic: number[];
  noviceCore: number[];
  armorRamp: number[];
  armorCore: number[];
  cloakRamp: number[];
  shieldRamp: number[];
  eyeHex: string;
  markHex: string;
  noviceEyeHex: string;
}

const CLASS_VISUAL_PRESETS: Record<ClassId, ClassVisualPreset> = {
  prism_knight: {
    headgear: "plume_helm",
    backAccessory: "cape",
    shieldedByWeapon: true,
    hairRamp: rampList(["#8ceeff", "#48b6e6", "#2a70a6", "#193e66"]),
    noviceTunic: rampList(["#b8c6de", "#7e8fb0", "#51607d", "#333d54"]),
    noviceCore: rampList(["#7d8ca8", "#566480", "#3a4559", "#242c3b"]),
    armorRamp: rampList(["#ffffff", "#b8daf8", "#5b9be0", "#2f579e"]),
    armorCore: rampList(["#637ea6", "#42587a", "#2b3a54", "#1b2538"]),
    cloakRamp: rampList(["#7af4ff", "#30a6e8", "#1c5eb8", "#103275"]),
    shieldRamp: rampList(["#ffffff", "#66eeff", "#268bd6", "#164882"]),
    eyeHex: "#7af8ff",
    markHex: "#5ef2ff",
    noviceEyeHex: "#263147",
  },
  chroma_mage: {
    headgear: "wizard_hat",
    backAccessory: "cape",
    shieldedByWeapon: false,
    hairRamp: rampList(["#fff2ff", "#e8a8ff", "#ab66cf", "#6b388c"]),
    noviceTunic: rampList(["#e6d0fa", "#a882d4", "#6e4e99", "#462f69"]),
    noviceCore: rampList(["#8a6eb5", "#604885", "#433163", "#2b1d42"]),
    armorRamp: rampList(["#ff9ef2", "#d848ba", "#8e248a", "#4e1454"]),
    armorCore: rampList(["#704494", "#4d2b6b", "#331c4a", "#1f0e30"]),
    cloakRamp: rampList(["#ffeb8a", "#e68af0", "#9132bd", "#4e1578"]),
    shieldRamp: rampList(["#ffe066", "#d848ba", "#7c1fa0", "#42105e"]),
    eyeHex: "#ffee66",
    markHex: "#ff7ae2",
    noviceEyeHex: "#552c7a",
  },
  bit_rogue: {
    headgear: "assassin_hood",
    backAccessory: "scarf",
    shieldedByWeapon: false,
    hairRamp: rampList(["#ff92ac", "#e03866", "#8c1b3e", "#4f0c24"]),
    noviceTunic: rampList(["#807994", "#554e69", "#373147", "#211d2e"]),
    noviceCore: rampList(["#605875", "#413a52", "#2b2638", "#1b1724"]),
    armorRamp: rampList(["#6f779c", "#424663", "#27293d", "#161724"]),
    armorCore: rampList(["#ff5986", "#c42152", "#751232", "#42091c"]),
    cloakRamp: rampList(["#ff6b93", "#e62458", "#8f133b", "#4f0821"]),
    shieldRamp: rampList(["#66f7ff", "#21b8cf", "#156d82", "#0c3d4c"]),
    eyeHex: "#ff3366",
    markHex: "#38f2ff",
    noviceEyeHex: "#421526",
  },
  pixel_tinker: {
    headgear: "tinker_goggles",
    backAccessory: "volt_pack",
    shieldedByWeapon: false,
    hairRamp: rampList(["#ffd48a", "#d49144", "#8c531e", "#542e0c"]),
    noviceTunic: rampList(["#9fd4b3", "#5da37a", "#3a6e51", "#224532"]),
    noviceCore: rampList(["#8f7b62", "#665440", "#453728", "#2b2218"]),
    armorRamp: rampList(["#9effc8", "#3fd482", "#208c54", "#114f31"]),
    armorCore: rampList(["#ffd970", "#bd862a", "#785016", "#472d0a"]),
    cloakRamp: rampList(["#ffee7a", "#44ee88", "#20995c", "#115435"]),
    shieldRamp: rampList(["#ffe066", "#44ee88", "#1f8c54", "#0e472b"]),
    eyeHex: "#ffe066",
    markHex: "#44ee88",
    noviceEyeHex: "#214030",
  },
};

function mapWeaponToRig(
  def: ItemDef | undefined,
  inst: ItemInstance | undefined,
  classId: ClassId
): {
  weapon?: string;
  offWeapon?: string;
  weaponColors?: Record<string, number>;
  glowColor: number;
} {
  if (!def) {
    return { glowColor: hex(CLASSES.find((c) => c.id === classId)?.accent ?? "#ffffff") >>> 0 };
  }

  const shape = def.visualStyle?.shape;
  const kind = def.iconKind;
  const tier = def.tier ?? 1;

  let weapon = "sword";
  let offWeapon: string | undefined;

  if (kind === "dagger" || shape === "daggers") {
    weapon = "dagger";
    offWeapon = "dagger";
  } else if (kind === "staff" || shape === "staff") {
    weapon = "staff";
  } else if (kind === "gun" || shape === "carbine") {
    weapon = tier >= 4 ? "launcher" : "pistol";
  } else if (shape === "halberd") {
    weapon = "spear";
  } else if (kind === "axe") {
    weapon = def.id === "wpn_quake_maul" ? "hammer" : "greatsword";
  } else if (def.id === "wpn_void_scythe") {
    weapon = "scythe";
  } else if (shape === "greatsword" || shape === "sovereign" || tier >= 3) {
    weapon = "greatsword";
  }

  const elemHex =
    inst && inst.enhanceLevel >= 5 && inst.infusedElement
      ? ELEMENT_META[normalizeElement(inst.infusedElement)].color
      : def.accentColor ?? RARITY_INFO[def.rarity].color;

  const baseHex = def.visualStyle?.primary ?? def.visualColor ?? RARITY_INFO[def.rarity].color;
  const bU = hex(baseHex) >>> 0;
  const eU = hex(elemHex) >>> 0;
  const wU = hex("#ffffff") >>> 0;

  const weaponColors: Record<string, number> = {
    hi: mix(eU, wU, 0.55) >>> 0,
    a: mix(bU, wU, 0.25) >>> 0,
    b: bU,
    d: mix(bU, hex("#161524") >>> 0, 0.45) >>> 0,
    gold: eU,
    goldD: mix(eU, hex("#2a1b10") >>> 0, 0.45) >>> 0,
  };

  if (weapon === "staff") {
    weaponColors.wood = mix(bU, hex("#5e3c24") >>> 0, 0.4) >>> 0;
    weaponColors.woodD = mix(weaponColors.wood, hex("#180e08") >>> 0, 0.55) >>> 0;
  } else if (weapon === "launcher") {
    weaponColors.olive = bU;
    weaponColors.oliveA = mix(bU, wU, 0.35) >>> 0;
    weaponColors.oliveD = mix(bU, hex("#101418") >>> 0, 0.5) >>> 0;
  }

  return { weapon, offWeapon, weaponColors, glowColor: eU };
}

function buildAttackPose(
  base: PoseRecord,
  attackKind: HeroAttackKind,
  phase: number,
  pitch: number,
  hasWeapon: boolean,
  weaponName: string | undefined
): PoseRecord {
  const u = (phase + 0.5) / 6;

  if (attackKind === "storm") {
    return {
      ...base,
      crouch: 5,
      lean: 4,
      yaw: -(phase / 6) * Math.PI * 2,
      fx: 21,
      fy: -21,
      sa: 0.05,
      bx: -9,
      by: -23,
      ffx: 11,
      fbx: -11,
      two: hasWeapon && (weaponName === "greatsword" || weaponName === "spear"),
    };
  }

  let track: PoseKey[];
  let forceTwo = false;

  switch (attackKind) {
    case "punch_1":
      track = [
        [0, { ...READY_POSE, crouch: 3, lean: 1, fx: 2, fy: -18, bx: 9, by: -20, armsFront: true, ffx: 8, fbx: -7 }],
        [0.22, { ...READY_POSE, crouch: 3, lean: 5, fx: 21, fy: -23 + pitch * 7, bx: 2, by: -19, twist: 2, armsFront: true, ffx: 10, fbx: -8 }],
        [0.55, { ...READY_POSE, crouch: 3, lean: 4, fx: 20, fy: -23 + pitch * 7, bx: 3, by: -19, twist: 2, armsFront: true, ffx: 10, fbx: -8 }],
        [1.0, { ...READY_POSE, crouch: 2, lean: 1, fx: 7, fy: -18, bx: 10, by: -19, armsFront: true, ffx: 7, fbx: -7 }],
      ];
      break;
    case "punch_2":
      track = [
        [0, { ...READY_POSE, crouch: 4, lean: 2, fx: 6, fy: -19, bx: -1, by: -20, armsFront: true, ffx: 8, fbx: -7 }],
        [0.22, { ...READY_POSE, crouch: 4, lean: 6, fx: -3, fy: -20, bx: 22, by: -22 + pitch * 7, twist: 4, armsFront: true, ffx: 11, fbx: -9 }],
        [0.55, { ...READY_POSE, crouch: 4, lean: 5, fx: -2, fy: -20, bx: 21, by: -22 + pitch * 7, twist: 4, armsFront: true, ffx: 11, fbx: -9 }],
        [1.0, { ...READY_POSE, crouch: 2, lean: 1, fx: 7, fy: -18, bx: 10, by: -19, armsFront: true, ffx: 7, fbx: -7 }],
      ];
      break;
    case "punch_3":
      track = [
        [0, { ...READY_POSE, crouch: 6, lean: -2, fx: -4, fy: -18, bx: 6, by: -19, armsFront: true, ffx: 8, fbx: -8 }],
        [0.26, { ...READY_POSE, crouch: 5, lean: 8, fx: 23, fy: -24 + pitch * 6, bx: -9, by: -22, twist: 5, armsFront: true, ffx: 13, fbx: -10, toeB: true }],
        [0.62, { ...READY_POSE, crouch: 5, lean: 7, fx: 22, fy: -24 + pitch * 6, bx: -8, by: -22, twist: 4, armsFront: true, ffx: 13, fbx: -10, toeB: true }],
        [1.0, { ...READY_POSE, crouch: 2, lean: 2, fx: 8, fy: -18, bx: 10, by: -19, armsFront: true, ffx: 7, fbx: -7 }],
      ];
      break;
    case "uppercut":
      track = [
        [0, { ...READY_POSE, crouch: 7, lean: 3, fx: 8, fy: -15, bx: 4, by: -17, armsFront: true, ffx: 9, fbx: -8 }],
        [0.26, { ...READY_POSE, crouch: -2, y: -3, lean: 4, fx: 16, fy: -38, bx: -7, by: -19, armsFront: true, ffx: 8, fbx: -6, toeF: true }],
        [0.62, { ...READY_POSE, crouch: -1, y: -2, lean: 3, fx: 16, fy: -37, bx: -6, by: -19, armsFront: true, ffx: 8, fbx: -6 }],
        [1.0, { ...READY_POSE, crouch: 3, y: 0, lean: 1, fx: 8, fy: -18, bx: 10, by: -19, armsFront: true, ffx: 7, fbx: -7 }],
      ];
      break;
    case "slash_1":
      track = [
        [0, { ...READY_POSE, x: 0, crouch: 2, lean: 3, fx: 15, fy: -36, sa: -1.45 + pitch * 0.4, bx: -7, by: -24, ffx: 11, fbx: -10 }],
        [0.18, { ...READY_POSE, x: 2, crouch: 5, lean: 5, fx: 20, fy: -21, sa: 0.62 + pitch * 0.5, bx: -9, by: -24, ffx: 13, fbx: -10, toeB: true }],
        [0.58, { ...READY_POSE, x: 2, crouch: 6, lean: 5, fx: 20, fy: -20, sa: 0.66 + pitch * 0.5, bx: -9, by: -24, ffx: 13, fbx: -10, toeB: true }],
        [1.0, { ...READY_POSE, crouch: 2, lean: 1, fx: 13, fy: -21, sa: -0.35 + pitch * 0.4, bx: -4, by: -20, ffx: 8, fbx: -7 }],
      ];
      break;
    case "slash_2":
      track = [
        [0, { ...READY_POSE, crouch: 2, lean: 3, fx: 16, fy: -36, sa: -1.45, bx: -7, by: -24, ffx: 11, fbx: -9 }],
        [0.18, { ...READY_POSE, crouch: 6, lean: 6, fx: 21, fy: -19, sa: 0.72, bx: -8, by: -24, ffx: 13, fbx: -10, toeB: true }],
        [0.42, { ...READY_POSE, crouch: 3, lean: 5, fx: 22, fy: -29 + pitch * 4, sa: 0.05 + pitch * 0.5, bx: -6, by: -20, ffx: 13, fbx: -10, toeB: true }],
        [0.64, { ...READY_POSE, crouch: 1, lean: 6, fx: 19, fy: -37 + pitch * 4, sa: -1.05 + pitch * 0.4, bx: -7, by: -19, ffx: 13, fbx: -8 }],
        [1.0, { ...READY_POSE, crouch: 2, lean: 2, fx: 14, fy: -22, sa: -0.65, bx: 5, by: -20, ffx: 8, fbx: -7 }],
      ];
      break;
    case "cleave":
      forceTwo = hasWeapon;
      track = [
        [0, { ...READY_POSE, two: forceTwo, crouch: 2, lean: -2, fx: 1, fy: -40, sa: -2.42, ffx: 8, fbx: -7 }],
        [0.18, { ...READY_POSE, two: forceTwo, crouch: 0, lean: 2, fx: 11, fy: -40, sa: -1.42, ffx: 10, fbx: -8 }],
        [0.30, { ...READY_POSE, two: forceTwo, crouch: 4, lean: 5, fx: 18, fy: -31, sa: -0.35, ffx: 12, fbx: -9 }],
        [0.42, { ...READY_POSE, two: forceTwo, crouch: 7, lean: 6, fx: 17, fy: -20, sa: 0.72, ffx: 12, fbx: -10, toeB: true }],
        [0.74, { ...READY_POSE, two: forceTwo, crouch: 6, lean: 5, fx: 17, fy: -20, sa: 0.74, ffx: 12, fbx: -10, toeB: true }],
        [1.0, { ...READY_POSE, two: forceTwo, crouch: 3, lean: 1, fx: 12, fy: -22, sa: -0.5, ffx: 8, fbx: -7 }],
      ];
      break;
    case "thrust":
      track = [
        [0, { ...READY_POSE, crouch: 5, lean: -3, fx: -2, fy: -19, sa: -0.05 + pitch * 0.5, bx: 8, by: -28, armsFront: true, ffx: 10, fbx: -8 }],
        [0.18, { ...READY_POSE, crouch: 6, lean: 7, fx: 23, fy: -20 + pitch * 6, sa: pitch, bx: -8, by: -24, ffx: 15, fbx: -11, toeB: true }],
        [0.68, { ...READY_POSE, crouch: 5, lean: 6, fx: 22, fy: -20 + pitch * 6, sa: pitch, bx: -8, by: -24, ffx: 15, fbx: -11, toeB: true }],
        [1.0, { ...READY_POSE, crouch: 3, lean: 1, fx: 12, fy: -21, sa: -0.3, bx: 6, by: -20, ffx: 7, fbx: -7 }],
      ];
      break;
    case "flurry_1":
      track = [
        [0, { ...READY_POSE, crouch: 5, lean: 3, fx: 21, fy: -29 + pitch * 5, sa: -0.45 + pitch, bx: 4, by: -23, sb: -1.1, ffx: 11, fbx: -9, armsFront: true }],
        [0.25, { ...READY_POSE, crouch: 4, lean: 4, fx: 2, fy: -23, sa: -1.0, bx: 22, by: -23 + pitch * 5, sb: 0.35 + pitch, ffx: 12, fbx: -9, armsFront: true }],
        [0.52, { ...READY_POSE, crouch: 5, lean: 5, fx: 20, fy: -21 + pitch * 5, sa: 0.15 + pitch, bx: 3, by: -24, sb: -1.2, ffx: 12, fbx: -10, armsFront: true }],
        [1.0, { ...READY_POSE, crouch: 3, lean: 2, fx: 10, fy: -19, sa: -0.8, bx: 8, by: -21, sb: -0.4, ffx: 9, fbx: -7 }],
      ];
      break;
    case "flurry_2":
      track = [
        [0, { ...READY_POSE, crouch: 5, lean: 4, fx: 2, fy: -23, sa: -1.0, bx: 22, by: -24 + pitch * 5, sb: 0.35 + pitch, ffx: 11, fbx: -9, armsFront: true }],
        [0.25, { ...READY_POSE, crouch: 4, lean: 5, fx: 21, fy: -31 + pitch * 5, sa: -0.6 + pitch, bx: -6, by: -23, sb: -2.2, ffx: 12, fbx: -9, armsFront: true }],
        [0.55, { ...READY_POSE, crouch: 6, lean: 6, fx: 22, fy: -22 + pitch * 5, sa: 0.2 + pitch, bx: -9, by: -24, sb: -2.6, ffx: 13, fbx: -10, toeB: true }],
        [1.0, { ...READY_POSE, crouch: 3, lean: 2, fx: 10, fy: -19, sa: -0.8, bx: 8, by: -21, sb: -0.4, ffx: 9, fbx: -7 }],
      ];
      break;
    case "spin": {
      const wide: PoseRecord = {
        ...READY_POSE,
        crouch: 5,
        lean: 3,
        fx: 21,
        fy: -21,
        sa: 0.05,
        sb: 0.1,
        bx: -9,
        by: -23,
        ffx: 11,
        fbx: -11,
      };
      track = [
        [0, { ...wide, yaw: 0 }],
        [0.18, { ...wide, yaw: -1.57 }],
        [0.36, { ...wide, yaw: -3.14 }],
        [0.54, { ...wide, yaw: -4.71 }],
        [0.72, { ...wide, yaw: -Math.PI * 2 }],
        [1.0, { ...READY_POSE, yaw: -Math.PI * 2, crouch: 3, lean: 1, fx: 12, fy: -21, sa: -0.5, ffx: 8, fbx: -7 }],
      ];
      break;
    }
    case "cast_1":
      track = [
        [0, { ...READY_POSE, crouch: 2, lean: -1, fx: 4, fy: -24, sa: -1.25, bx: -2, by: -17, ffx: 7, fbx: -7 }],
        [0.28, { ...READY_POSE, crouch: 2, lean: 4, fx: 17, fy: -24 + pitch * 6, sa: -0.15 + pitch * 0.7, bx: -3, by: -17, ffx: 9, fbx: -7 }],
        [1.0, { ...READY_POSE, crouch: 1, lean: 1, fx: 9, fy: -18, sa: -1.05, bx: -3, by: -16, ffx: 7, fbx: -7 }],
      ];
      break;
    case "cast_2":
      track = [
        [0, { ...READY_POSE, crouch: 4, lean: 1, fx: 8, fy: -17, sa: 0.45, bx: 4, by: -18, ffx: 8, fbx: -7 }],
        [0.30, { ...READY_POSE, crouch: 2, lean: 5, fx: 18, fy: -30 + pitch * 5, sa: -0.65 + pitch * 0.6, bx: 12, by: -26, armsFront: true, ffx: 9, fbx: -7 }],
        [1.0, { ...READY_POSE, crouch: 1, lean: 1, fx: 9, fy: -18, sa: -1.05, bx: -3, by: -16, ffx: 7, fbx: -7 }],
      ];
      break;
    case "cast_3":
    case "cast_heavy":
      forceTwo = weaponName === "staff";
      track = [
        [0, { ...READY_POSE, two: forceTwo, crouch: 2, lean: -2, fx: 8, fy: -34, sa: -1.4, ffx: 8, fbx: -7 }],
        [0.28, { ...READY_POSE, two: forceTwo, crouch: 4, lean: 6, fx: 19, fy: -23 + pitch * 6, sa: -0.08 + pitch * 0.7, bx: 10, by: -22, ffx: 11, fbx: -9 }],
        [0.65, { ...READY_POSE, two: forceTwo, crouch: 3, lean: 5, fx: 18, fy: -23 + pitch * 6, sa: -0.12 + pitch * 0.7, bx: 9, by: -21, ffx: 11, fbx: -9 }],
        [1.0, { ...READY_POSE, two: forceTwo, crouch: 2, lean: 1, fx: 10, fy: -19, sa: -0.95, ffx: 7, fbx: -7 }],
      ];
      break;
    case "cast_ult":
      track = [
        [0, { ...READY_POSE, crouch: 4, lean: 0, fx: 8, fy: -20, bx: 6, by: -20, sa: -0.9, ffx: 8, fbx: -7 }],
        [0.28, { ...READY_POSE, crouch: 2, lean: -2, fx: 10, fy: -36, bx: 12, by: -34, sa: -1.55, armsFront: true, ffx: 8, fbx: -8 }],
        [0.70, { ...READY_POSE, crouch: 1, lean: -2, fx: 10, fy: -37, bx: 13, by: -35, sa: -1.58, armsFront: true, ffx: 8, fbx: -8 }],
        [1.0, { ...READY_POSE, crouch: 3, lean: 1, fx: 10, fy: -21, bx: 8, by: -20, sa: -0.75, ffx: 7, fbx: -7 }],
      ];
      break;
    case "shoot":
      track = [
        [0, { ...READY_POSE, crouch: 2, lean: 1, fx: 15, fy: -23 + pitch * 6, bx: 7, by: -21, sa: pitch, ffx: 7, fbx: -6 }],
        [0.22, { ...READY_POSE, crouch: 3, lean: -2, fx: 9, fy: -25 + pitch * 5, bx: 4, by: -22, sa: pitch - 0.34, ffx: 7, fbx: -7 }],
        [0.65, { ...READY_POSE, crouch: 2, lean: 0, fx: 13, fy: -23 + pitch * 6, bx: 6, by: -21, sa: pitch - 0.08, ffx: 7, fbx: -6 }],
        [1.0, { ...READY_POSE, crouch: 2, lean: 1, fx: 14, fy: -22 + pitch * 6, bx: 6, by: -20, sa: pitch, ffx: 7, fbx: -6 }],
      ];
      break;
    case "shoot_heavy":
    case "beam":
      forceTwo = weaponName === "launcher";
      track = [
        [0, { ...READY_POSE, two: forceTwo, crouch: 4.5, lean: 2, fx: 16, fy: -23 + pitch * 6, bx: 8, by: -21, sa: pitch, ffx: 10, fbx: -8 }],
        [0.24, { ...READY_POSE, two: forceTwo, crouch: 5.5, lean: -3, fx: 8, fy: -25 + pitch * 4, bx: 4, by: -22, sa: pitch - 0.42, ffx: 10, fbx: -9 }],
        [0.70, { ...READY_POSE, two: forceTwo, crouch: 4.5, lean: -1, fx: 12, fy: -23 + pitch * 5, bx: 6, by: -21, sa: pitch - 0.14, ffx: 10, fbx: -8 }],
        [1.0, { ...READY_POSE, two: forceTwo, crouch: 3, lean: 1, fx: 14, fy: -21 + pitch * 5, bx: 7, by: -20, sa: pitch, ffx: 8, fbx: -7 }],
      ];
      break;
  }

  const sampled = poseAtFn(track, u);
  const out: PoseRecord = {
    ...base,
    ...sampled,
    face: base.face,
  };
  if (weaponName) {
    out.weapon = weaponName;
    if (forceTwo || base.two) out.two = true;
    else delete out.two;
  } else {
    delete out.weapon;
    delete out.two;
  }
  if (base.offWeapon) out.offWeapon = base.offWeapon;
  return out;
}

function buildPoseForState(
  classId: ClassId,
  animState: PixelfxHeroAnimState,
  frameIdx: number,
  hasWeapon: boolean,
  hasOffDagger: boolean,
  weaponName: string | undefined,
  facing: number,
  facingDir: string | undefined,
  attackKind: HeroAttackKind,
  attackPhase: number,
  pitch: number,
  chargeBucket: number,
  shieldGuard: boolean
): PoseRecord {
  const isBare = !hasWeapon;
  const wf = ((frameIdx % 4) + 4) % 4;
  const base: PoseRecord = {
    face: facing < 0 ? -1 : 1,
    sa: -0.38,
  };

  if (weaponName) {
    base.weapon = weaponName;
    if (weaponName === "greatsword" || weaponName === "hammer" || weaponName === "scythe") {
      base.two = true;
      base.sa = 0.28;
    } else if (weaponName === "staff") {
      base.sa = -1.15;
    } else if (weaponName === "pistol" || weaponName === "launcher") {
      base.sa = 0.0;
      if (weaponName === "launcher") base.two = true;
    }
  }
  if (hasOffDagger && weaponName === "dagger") {
    base.offWeapon = "dagger";
    base.sb = -0.3;
  }

  // Slight back-angle yaw hint when running strictly North
  if (facingDir === "up" && animState !== "attack") {
    base.yaw = facing < 0 ? 0.35 : -0.35;
  }

  if (animState === "idle") {
    const breath = wf % 2 === 1 ? 0.8 : 0;
    const gCrouch = shieldGuard ? 2 : 0;
    const bx = shieldGuard ? 11 : undefined;
    const by = shieldGuard ? -23 : undefined;
    if (isBare) {
      return {
        ...base,
        crouch: breath + gCrouch,
        fx: 7,
        fy: -17 + breath,
        bx: bx ?? 11,
        by: by ?? -18 + breath,
        ffx: -2,
        ffy: -3,
        fbx: 3,
        fby: -3,
        armsFront: true,
      };
    }
    if (classId === "chroma_mage") {
      return { ...base, crouch: breath + gCrouch, fx: 8, fy: -16, bx: bx ?? -4, by: by ?? -16, sa: -1.35 };
    }
    if (classId === "pixel_tinker") {
      return { ...base, crouch: breath + gCrouch, fx: 9, fy: -18, bx: bx ?? 4, by: by ?? -17, sa: -0.05 };
    }
    if (classId === "bit_rogue") {
      return { ...base, crouch: 2 + breath + gCrouch, lean: 2, fx: -5, fy: -14, bx: bx ?? 8, by: by ?? -16, sa: -2.4, sb: 0.25 };
    }
    return { ...base, crouch: breath + gCrouch, fx: 2, fy: -15, bx: bx ?? 9, by: by ?? -17, sa: -0.55 };
  }

  if (animState === "run") {
    // 4-phase stride cycle matching 16-bit action cadence
    const strides = [
      { crouch: 1.0, lean: 2.5, ffx: 5, ffy: -3.5, fbx: -5, fby: -3, armShift: 3 },
      { crouch: 2.2, lean: 3.0, ffx: 1, ffy: -4.8, fbx: 1, fby: -2.5, armShift: 0 },
      { crouch: 1.0, lean: 2.5, ffx: -5, ffy: -3, fbx: 5, fby: -3.5, armShift: -3 },
      { crouch: 2.2, lean: 3.0, ffx: -1, ffy: -2.5, fbx: -1, fby: -4.8, armShift: 0 },
    ][wf];
    return {
      ...base,
      crouch: strides.crouch + (shieldGuard ? 1.5 : 0),
      lean: strides.lean,
      ffx: strides.ffx,
      ffy: strides.ffy,
      fbx: strides.fbx,
      fby: strides.fby,
      fx: (isBare ? 7 : 3) + strides.armShift,
      fy: -16 + (wf & 1),
      bx: shieldGuard ? 11 : (isBare ? 10 : 7) - strides.armShift,
      by: shieldGuard ? -23 : -16,
      armsFront: isBare || classId === "pixel_tinker",
    };
  }

  if (animState === "attack") {
    return buildAttackPose(base, attackKind, attackPhase, pitch, hasWeapon, weaponName);
  }

  if (animState === "charge") {
    const deep = chargeBucket === 1;
    const aimedRanged = weaponName === "pistol" || weaponName === "launcher";
    return {
      ...base,
      crouch: deep ? 5.5 : 4,
      lean: deep ? -4.5 : -3.5,
      fx: isBare ? (deep ? -8 : -7) : aimedRanged ? 11 : deep ? -9 : -8,
      fy: aimedRanged ? -21 + pitch * 5 : deep ? -21 : -20,
      bx: deep ? 5 : 6,
      by: -18,
      sa: aimedRanged ? pitch : weaponName === "staff" ? -1.6 + pitch * 0.5 : deep ? -2.45 : -2.2,
      ffx: deep ? 6 : 5,
      fbx: deep ? -5 : -4,
      armsFront: isBare,
    };
  }

  // Dash aerodynamic lunge
  return {
    ...base,
    crouch: 5.5,
    lean: 9,
    fx: -8,
    fy: -14,
    bx: 9,
    by: -15,
    sa: -2.7,
    ffx: 8,
    ffy: -4,
    fbx: -8,
    fby: -4,
  };
}

function buildLoadoutKey(
  classId: ClassId,
  equipment: Partial<Record<EquipSlot, ItemInstance>>,
  animState: PixelfxHeroAnimState,
  frameIdx: number,
  facing: number,
  facingDir: string | undefined,
  rigScale: number,
  extra?: {
    attackKind?: HeroAttackKind;
    attackProgress?: number;
    aimAngle?: number;
    chargePct?: number;
    shieldGuard?: boolean;
  }
): { key: string; theme: PixelfxPosedTheme; pose: PoseRecord; wGlow: number } {
  const preset = CLASS_VISUAL_PRESETS[classId];
  const hDef = equipment.helmet ? ITEMS[equipment.helmet.defId] : undefined;
  const aDef = equipment.armor ? ITEMS[equipment.armor.defId] : undefined;
  const bDef = equipment.boots ? ITEMS[equipment.boots.defId] : undefined;
  const wInst = equipment.weapon;
  const wDef = wInst ? ITEMS[wInst.defId] : undefined;

  const isBareHanded = !wDef;
  const isUnarmored = !aDef;
  const wRig = mapWeaponToRig(wDef, wInst, classId);

  const shellRamp = aDef
    ? rampFromHex(aDef.visualStyle?.primary ?? aDef.visualColor ?? RARITY_INFO[aDef.rarity].color)
    : preset.noviceTunic;
  const coreRamp = aDef ? preset.armorCore : preset.noviceCore;

  let headgear: PixelfxPosedTheme["headgear"] = "hair";
  let headRamp = preset.hairRamp;
  if (hDef) {
    if (hDef.id === "hlm_prism_halo" || hDef.rarity === "legendary") {
      headgear = "halo_crown";
      headRamp = preset.hairRamp;
    } else {
      headgear = preset.headgear;
      headRamp = rampFromHex(hDef.visualStyle?.primary ?? hDef.visualColor ?? RARITY_INFO[hDef.rarity].color);
    }
  }

  const backAccessory: PixelfxPosedTheme["backAccessory"] = aDef
    ? preset.backAccessory
    : "none";
  const cloakRamp = aDef
    ? rampFromHex(aDef.accentColor ?? aDef.visualColor ?? RARITY_INFO[aDef.rarity].color, "#0e0a1a", "#ffffff")
    : preset.cloakRamp;

  const bootsRamp = bDef
    ? rampFromHex(bDef.visualStyle?.primary ?? bDef.visualColor ?? RARITY_INFO[bDef.rarity].color)
    : NOVICE_BOOTS_RAMP;

  const markCol =
    wInst && wInst.enhanceLevel >= 5 && wInst.infusedElement
      ? hex(ELEMENT_META[normalizeElement(wInst.infusedElement)].color) >>> 0
      : hex(preset.markHex) >>> 0;

  const eyeCol =
    hDef || aDef || wDef
      ? hex(preset.eyeHex) >>> 0
      : hex(preset.noviceEyeHex) >>> 0;

  const shielded = Boolean(wDef && preset.shieldedByWeapon);

  const theme: PixelfxPosedTheme = {
    bareHands: isBareHanded,
    headgear,
    backAccessory,
    shielded,
    shell: shellRamp,
    core: coreRamp,
    head: headRamp,
    face: SKIN_RAMP,
    boots: bootsRamp,
    cloak: cloakRamp,
    hair: preset.hairRamp,
    shield: preset.shieldRamp,
    ink: INK_DEFAULT,
    seam: SEAM_DEFAULT,
    mark: markCol,
    eye: eyeCol,
    weaponColors: wRig.weaponColors,
  };

  const defaultAttackKind: HeroAttackKind = isBareHanded
    ? "punch_1"
    : wRig.weapon === "staff"
      ? "cast_1"
      : wRig.weapon === "pistol" || wRig.weapon === "launcher"
        ? "shoot"
        : wRig.weapon === "dagger"
          ? "flurry_1"
          : "slash_1";
  const attackKind = extra?.attackKind ?? defaultAttackKind;
  const clampedProg = Math.min(0.999, Math.max(0, extra?.attackProgress ?? (frameIdx % 4) * 0.25));
  const phase = Math.min(5, Math.max(0, Math.floor(clampedProg * 6)));
  const pitch = computeLocalPitch(extra?.aimAngle);
  const pitchBucket = pitch < -0.1 ? -1 : pitch > 0.1 ? 1 : 0;
  const chargeBucket = (extra?.chargePct ?? 0) >= 0.65 ? 1 : 0;
  const shieldGuard = Boolean(extra?.shieldGuard);

  const pose = buildPoseForState(
    classId,
    animState,
    frameIdx,
    !isBareHanded,
    Boolean(wRig.offWeapon),
    wRig.weapon,
    facing,
    facingDir,
    attackKind,
    phase,
    pitch,
    chargeBucket,
    shieldGuard
  );

  const elemTag = wInst?.infusedElement && (wInst.enhanceLevel ?? 0) >= 5 ? wInst.infusedElement : "";
  const enhTag = (wInst?.enhanceLevel ?? 0) >= 5 ? "glow" : "";
  const dirTag = facingDir === "up" ? "U" : "F";
  const fSign = facing < 0 ? -1 : 1;
  const stateTag =
    animState === "attack"
      ? `${attackKind}:${phase}:${pitchBucket}`
      : animState === "charge"
        ? `chg:${chargeBucket}:${pitchBucket}`
        : `${frameIdx}:${shieldGuard ? 1 : 0}`;

  const key = [
    classId,
    hDef?.id ?? "nh",
    aDef?.id ?? "na",
    bDef?.id ?? "nb",
    wDef?.id ?? "nw",
    elemTag,
    enhTag,
    isUnarmored ? "u" : "g",
    animState,
    stateTag,
    fSign,
    dirTag,
    rigScale.toFixed(2),
  ].join("|");

  return { key, theme, pose, wGlow: wRig.glowColor };
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

function toBleachedColor(col: number): number {
  const a = col >>> 24;
  if (a === 0) return 0;
  const r = col & 0xff;
  const g = (col >>> 8) & 0xff;
  const b = (col >>> 16) & 0xff;
  const lum = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
  const br = Math.min(255, Math.round(lum * 0.92 + 10));
  const bg = Math.min(255, Math.round(lum * 0.95 + 12));
  const bb = Math.min(255, Math.round(lum * 1.03 + 16));
  return ((a << 24) | (bb << 16) | (bg << 8) | br) >>> 0;
}

function bakeFrame(
  pose: PoseRecord,
  theme: PixelfxPosedTheme,
  rigScale: number,
  wGlow: number,
  hasGlowBoost: boolean
): BakedPixelfxHero {
  const out = posedFn(pose, theme, rigScale);
  const fullScale = rigScale >= 0.9;
  const w = fullScale ? 92 : 72;
  const h = fullScale ? 76 : 56;
  const anchorX = Math.floor(w / 2);
  const anchorY = fullScale ? 64 : 46;

  const frame: PixelfxFrame = createFrame(w, h, 0, 0);
  clearFrame(frame);

  const maskData = new Uint8Array(w * h);
  const pixels = new Uint32Array(w * h);

  for (let i = 0; i < out.n; i++) {
    const px = anchorX + out.xs[i];
    const py = anchorY + out.ys[i];
    if (px < 0 || py < 0 || px >= w || py >= h) continue;
    const idx = py * w + px;
    const c = out.color[i];
    frame.color[idx] = c;
    maskData[idx] = 1;
    pixels[idx] = c;
  }

  // Stamp additive pixelfx light glow spots (visor, orb, coil, weapon gem) into frame.light
  const glows = out.glows ?? [];
  for (const g of glows) {
    const gx = anchorX + g.x;
    const gy = anchorY + g.y;
    const rad = Math.max(2, Math.ceil(g.radius * (hasGlowBoost ? 1.35 : 1)));
    const cr = g.color & 0xff;
    const cg = (g.color >>> 8) & 0xff;
    const cb = (g.color >>> 16) & 0xff;
    for (let dy = -rad; dy <= rad; dy++) {
      for (let dx = -rad; dx <= rad; dx++) {
        const px = Math.round(gx + dx);
        const py = Math.round(gy + dy);
        if (px < 0 || py < 0 || px >= w || py >= h) continue;
        const dist = Math.hypot(dx, dy) / rad;
        if (dist > 1) continue;
        const k = (1 - dist) * (1 - dist) * (hasGlowBoost ? 0.85 : 0.58);
        const idx = py * w + px;
        const cur = frame.light[idx];
        const nr = Math.min(255, (cur & 255) + Math.round(cr * k));
        const ng = Math.min(255, ((cur >>> 8) & 255) + Math.round(cg * k));
        const nb = Math.min(255, ((cur >>> 16) & 255) + Math.round(cb * k));
        frame.light[idx] = ((255 << 24) | (nb << 16) | (ng << 8) | nr) >>> 0;
      }
    }
  }

  // Extra subtle aura rim on +5+ weapons / legendary gear
  if (hasGlowBoost && glows.length === 0) {
    const cr = wGlow & 0xff;
    const cg = (wGlow >>> 8) & 0xff;
    const cb = (wGlow >>> 16) & 0xff;
    const cy = Math.round(anchorY - 14 * rigScale);
    const rad = Math.round(11 * rigScale);
    for (let dy = -rad; dy <= rad; dy++) {
      for (let dx = -rad; dx <= rad; dx++) {
        const px = anchorX + dx;
        const py = cy + dy;
        if (px < 0 || py < 0 || px >= w || py >= h) continue;
        const dist = Math.hypot(dx, dy) / Math.max(1, rad);
        if (dist > 1) continue;
        const k = (1 - dist) * 0.28;
        const idx = py * w + px;
        frame.light[idx] = ((255 << 24) | (Math.round(cb * k) << 16) | (Math.round(cg * k) << 8) | Math.round(cr * k)) >>> 0;
      }
    }
  }

  const [colorCanvas, cCtx] = makeCanvas(w, h);
  const cImg = cCtx.createImageData(w, h);
  new Uint32Array(cImg.data.buffer).set(frame.color);
  cCtx.putImageData(cImg, 0, 0);

  const [lightCanvas, lCtx] = makeCanvas(w, h);
  const lImg = lCtx.createImageData(w, h);
  new Uint32Array(lImg.data.buffer).set(frame.light);
  lCtx.putImageData(lImg, 0, 0);

  const [whiteCanvas, wCtx] = makeCanvas(w, h);
  const wImg = wCtx.createImageData(w, h);
  const wBuf = new Uint32Array(wImg.data.buffer);
  const [bleachedCanvas, bCtx] = makeCanvas(w, h);
  const bImg = bCtx.createImageData(w, h);
  const bBuf = new Uint32Array(bImg.data.buffer);

  for (let i = 0; i < frame.color.length; i++) {
    const col = frame.color[i];
    if ((col >>> 24) > 128) {
      wBuf[i] = 0xffffffff;
      bBuf[i] = toBleachedColor(col);
    }
  }
  wCtx.putImageData(wImg, 0, 0);
  bCtx.putImageData(bImg, 0, 0);

  return {
    w,
    h,
    anchorX,
    anchorY,
    colorCanvas,
    lightCanvas,
    bleachedCanvas,
    whiteCanvas,
    actor: {
      mask: { w, h, data: maskData },
      pixels,
      x: -anchorX,
      y: -anchorY,
      w,
      h,
      head: [0, -Math.round(30 * rigScale)],
      chest: [0, -Math.round(21 * rigScale)],
    },
  };
}

const FRAME_CACHE = new Map<string, BakedPixelfxHero>();
const MAX_CACHE_SIZE = 600;

export function getOrBakePixelfxHero(
  classId: ClassId,
  equipment: Partial<Record<EquipSlot, ItemInstance>>,
  animState: PixelfxHeroAnimState,
  frameIdx: number,
  facing: number,
  facingDir: string | undefined,
  rigScale: number,
  extra?: {
    attackKind?: HeroAttackKind;
    attackProgress?: number;
    aimAngle?: number;
    chargePct?: number;
    shieldGuard?: boolean;
  }
): BakedPixelfxHero {
  const built = buildLoadoutKey(classId, equipment, animState, frameIdx, facing, facingDir, rigScale, extra);
  let baked = FRAME_CACHE.get(built.key);
  if (!baked) {
    if (FRAME_CACHE.size >= MAX_CACHE_SIZE) {
      FRAME_CACHE.clear();
    }
    const wInst = equipment.weapon;
    const wDef = wInst ? ITEMS[wInst.defId] : undefined;
    const hasGlowBoost = Boolean(
      (wInst && wInst.enhanceLevel >= 5) ||
        wDef?.rarity === "epic" ||
        wDef?.rarity === "legendary"
    );
    baked = bakeFrame(built.pose, built.theme, rigScale, built.wGlow, hasGlowBoost);
    FRAME_CACHE.set(built.key, baked);
  }
  return baked;
}

/**
 * Renders the full 3D-rigged & shaded `pixelfx` character model (with dynamic 5-slot gear,
 * additive light glow buffer, orbiting accessory rune, and Aegis/ATK buffs) onto any 2D canvas.
 */
export function drawPixelfxHero(ctx: CanvasRenderingContext2D, opts: PixelfxHeroDrawOptions) {
  const {
    classId,
    equipment,
    x,
    y,
    rigScale = 0.62,
    drawScale = 1,
    walkFrame,
    facing,
    facingDir = facing < 0 ? "left" : "right",
    animState = "idle",
    attackKind,
    attackProgress,
    aimAngle,
    chargePct,
    shieldGuard,
    hitFlash = false,
    bleached = false,
    time = 0,
    aegisActive = false,
    buffActive = false,
  } = opts;

  ctx.imageSmoothingEnabled = false;
  const wf = ((Math.floor(walkFrame) % 4) + 4) % 4;
  const baked = getOrBakePixelfxHero(classId, equipment, animState, wf, facing, facingDir, rigScale, {
    attackKind,
    attackProgress,
    aimAngle,
    chargePct,
    shieldGuard,
  });

  const bobY = animState === "idle" && Math.sin(time * 4.2) > 0.65 ? -0.5 * drawScale : 0;
  const dx = Math.round(x - baked.anchorX * drawScale);
  const dy = Math.round(y - baked.anchorY * drawScale + bobY);
  const dw = Math.round(baked.w * drawScale);
  const dh = Math.round(baked.h * drawScale);

  const baseImg = hitFlash
    ? baked.whiteCanvas
    : bleached
      ? baked.bleachedCanvas
      : baked.colorCanvas;

  ctx.drawImage(baseImg, 0, 0, baked.w, baked.h, dx, dy, dw, dh);

  if (!hitFlash && !bleached) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(baked.lightCanvas, 0, 0, baked.w, baked.h, dx, dy, dw, dh);
    ctx.restore();
  }

  // Orbiting Accessory Pixel Rune (Ring / Amulet / Grimoire / Pix-Chip)
  const accInst = equipment.accessory;
  const accDef = accInst ? ITEMS[accInst.defId] : undefined;
  if (accDef && !hitFlash) {
    const orbitR = 11 * rigScale * drawScale;
    const ox = Math.round(x + Math.cos(time * 3.4) * orbitR);
    const oy = Math.round(y - 18 * rigScale * drawScale + Math.sin(time * 5.2) * (2.5 * drawScale));
    const col = bleached ? "#b8c0d0" : accDef.accentColor ?? RARITY_INFO[accDef.rarity].color;
    const sz = Math.max(2, Math.round(3 * drawScale));
    ctx.fillStyle = "#100c18";
    ctx.fillRect(ox - 1, oy - 1, sz + 2, sz + 2);
    ctx.fillStyle = col;
    ctx.fillRect(ox, oy, sz, sz);
  }

  // Active Buff / Aegis Energy Halo
  if ((aegisActive || buffActive) && !hitFlash && !bleached) {
    ctx.fillStyle = aegisActive ? "#5ef2ff" : "#ffe066";
    const pulse = (Math.floor(time * 10) & 1) === 0 ? 1 : 0.55;
    ctx.save();
    ctx.globalAlpha = pulse;
    const hw = Math.round(8 * rigScale * drawScale);
    ctx.fillRect(Math.round(x - hw), Math.round(y - 2 * drawScale), hw * 2, Math.max(1, Math.round(drawScale)));
    ctx.restore();
  }
}

/** Iconic full-geared loadout per Class for Title / Class Select / Class Altar showcase! */
const SHOWCASE_EQUIP: Record<ClassId, Partial<Record<EquipSlot, ItemInstance>>> = {
  prism_knight: {
    helmet: { uid: "sc_k_h", defId: "hlm_quartz_visor", qty: 1, enhanceLevel: 5 },
    armor: { uid: "sc_k_a", defId: "arm_quartz_plate", qty: 1, enhanceLevel: 5 },
    boots: { uid: "sc_k_b", defId: "bts_quartz_greaves", qty: 1, enhanceLevel: 5 },
    weapon: { uid: "sc_k_w", defId: "wpn_prism_halberd", qty: 1, enhanceLevel: 6 },
    accessory: { uid: "sc_k_c", defId: "rng_quartz_eye", qty: 1, enhanceLevel: 5 },
  },
  chroma_mage: {
    helmet: { uid: "sc_m_h", defId: "hlm_meadow_crest", qty: 1, enhanceLevel: 5 },
    armor: { uid: "sc_m_a", defId: "arm_amber_aegis", qty: 1, enhanceLevel: 5 },
    boots: { uid: "sc_m_b", defId: "bts_meadow_strider", qty: 1, enhanceLevel: 5 },
    weapon: { uid: "sc_m_w", defId: "wpn_chroma_scepter", qty: 1, enhanceLevel: 6 },
    accessory: { uid: "sc_m_c", defId: "acc_grimoire_arcane", qty: 1, enhanceLevel: 5 },
  },
  bit_rogue: {
    helmet: { uid: "sc_r_h", defId: "hlm_amber_crown", qty: 1, enhanceLevel: 5 },
    armor: { uid: "sc_r_a", defId: "arm_prism_mantle", qty: 1, enhanceLevel: 5 },
    boots: { uid: "sc_r_b", defId: "bts_void_walkers", qty: 1, enhanceLevel: 5 },
    weapon: { uid: "sc_r_w", defId: "wpn_glitch_fangs", qty: 1, enhanceLevel: 6 },
    accessory: { uid: "sc_r_c", defId: "acc_wind_feather", qty: 1, enhanceLevel: 5 },
  },
  pixel_tinker: {
    helmet: { uid: "sc_t_h", defId: "hlm_meadow_crest", qty: 1, enhanceLevel: 5 },
    armor: { uid: "sc_t_a", defId: "arm_meadow_mail", qty: 1, enhanceLevel: 5 },
    boots: { uid: "sc_t_b", defId: "bts_amber_treads", qty: 1, enhanceLevel: 5 },
    weapon: { uid: "sc_t_w", defId: "wpn_pulse_carbine", qty: 1, enhanceLevel: 6 },
    accessory: { uid: "sc_t_c", defId: "chp_overclock", qty: 1, enhanceLevel: 5 },
  },
};

export function getClassShowcaseEquipment(classId: ClassId): Partial<Record<EquipSlot, ItemInstance>> {
  return SHOWCASE_EQUIP[classId] ?? SHOWCASE_EQUIP.prism_knight;
}

/** Returns a CompiledSprite-compatible wrapper powered by pixelfx `posedStyled` for VFX actor masks & fallbacks. */
export function getPixelfxHeroCompiled(classId: ClassId, frameIdx: number) {
  const wf = ((Math.floor(frameIdx) % 4) + 4) % 4;
  const equip = getClassShowcaseEquipment(classId);
  const right = getOrBakePixelfxHero(classId, equip, "run", wf, 1, "right", 0.62);
  const left = getOrBakePixelfxHero(classId, equip, "run", wf, -1, "left", 0.62);
  return {
    w: right.w,
    h: right.h,
    right: right.colorCanvas,
    left: left.colorCanvas,
    whiteRight: right.whiteCanvas,
    whiteLeft: left.whiteCanvas,
    bleachedRight: right.bleachedCanvas,
    bleachedLeft: left.bleachedCanvas,
    actor: right.actor,
  };
}
