import type {
  AllocatedStats,
  BiomeId,
  CampDef,
  ClassId,
  ElementType,
  ExoticSkillModId,
  InfusableElement,
  ItemInstance,
  Rarity,
  ResourceNodeDef,
} from "../data/types";
import type { HeroAttackKind } from "../graphics/paperDoll";

export interface PlayerEntity {
  name?: string;
  classId: ClassId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number; // 1 = right, -1 = left
  facingDir: "down" | "up" | "left" | "right";
  aimAngle: number;
  radius: number;

  // Core RPG stats
  level: number;
  xp: number;
  xpNext: number;
  statPoints: number;
  allocatedStats: AllocatedStats;
  hp: number;
  maxHp: number;
  atk: number;
  mag?: number;
  def: number;
  spd: number;
  aspdPct?: number;
  moveSpeedPct?: number;
  crit: number; // percentage 0..100
  critMult: number;
  critDmgPct?: number;
  lifestealPct?: number;
  fireResPct?: number;
  elementBonus: number; // % bonus elemental & skill damage
  stealthTime?: number;
  shieldHp?: number;
  shieldMaxHp?: number;
  activeSetAuraColor?: string | null;

  // Stamina (Zelda / Genshin wheel)
  stamina: number;
  maxStamina: number;
  staminaRegenDelay: number;
  exhausted: boolean;
  sprinting: boolean;

  // Combat & Skills
  overdrive: number; // 0..100 (Ultimate Q gauge)
  atkCd: number;
  skillCd: number;
  dashCd: number;
  comboStep: number; // 0, 1, 2
  comboTimer: number;
  chargeTime: number; // Hold LMB duration
  charging: boolean;

  // Active combat states
  invuln: number;
  hitFlash: number;
  dashing: number;
  dashVx: number;
  dashVy: number;
  shieldTime: number; // Prism Knight E block
  stormTime: number; // Prism Knight Q spin
  stormTick: number;
  cloneTime: number; // Bit Rogue Q phantom clone
  droneTime: number; // Pixel Tinker Q overload drone
  droneTick: number;
  elementIdx: number; // Chroma Mage 0:fire, 1:ice, 2:poison
  walkTime: number;
  attackAnimTime: number;
  attackAnimDuration: number;
  attackAnimKind: HeroAttackKind;
  attackAnimAngle: number;

  // Derived equipment bonuses & passives
  staminaCostPct: number; // negative = cheaper charge/dash
  poiseBreakPct: number; // % bonus vs Bleach Shield
  skillCdPct: number; // negative = faster [E]
  hasOrbitGrimoire: boolean;
  hasReactionAmp: boolean;
  hasVoidSiphon: boolean;
  hasWindDancer: boolean;
  hasChromaBlessing: boolean;
  hasQuakeImpact: boolean;
  hasRestoredPrismSurge: boolean;
  hasEnergySiphon: boolean;
  hasSetResonance: boolean;
  grimoireTimer: number;
  exoticMods?: Set<ExoticSkillModId>;
  exoticIcds?: Partial<Record<ExoticSkillModId, number>>;
  potCd?: number;

  // Advanced 60FPS Combat Rhythm & 9-Element Reaction Buffs
  perfectDashWindow: number;
  chromaCounterTimer: number;
  dashComboPreserveTimer: number;
  quickChargeTimer: number;
  bleachDebuffTime: number;
  tectonicChargeBonus: boolean;
  chromaGustTime: number;
  chromaBloomBonusTime: number;
  totemSurgeElement: InfusableElement | null;
  totemSurgeTimer: number;

  // Consumable temporary buffs
  speedBuffTime: number;
  speedBuffPct: number;
  atkBuffTime: number;
  atkBuffPct: number;
  atkBuffCrit: number;
  defBuffTime: number;
  defBuffPct: number;
  aegisTime: number;
  coatingTime: number;
  coatingElement: InfusableElement | null;
  respawnWaypointId: string;
}

export type EnemyFacingDir = "down" | "up" | "left" | "right";

export type EnemyAnimKind =
  | "idle"
  | "leap_slam"
  | "spit_moss"
  | "roll_charge"
  | "shell_burst"
  | "thorn_shot"
  | "vine_trap"
  | "quake_slam"
  | "root_whip"
  | "bark_shield"
  | "ground_roots"
  | "emerald_orb"
  | "leaf_storm"
  | "dive_slash"
  | "sonic_wave"
  | "claw_clamp"
  | "quartz_shield"
  | "thin_laser"
  | "refract_split"
  | "halberd_sweep"
  | "crystal_lunge"
  | "shard_rain"
  | "refract_rain"
  | "prism_breath"
  | "rainbow_storm"
  | "amber_roll"
  | "molten_slam"
  | "ember_cast"
  | "ember_volley"
  | "void_slam"
  | "void_blink"
  | "void_barrage"
  | "erase_cast"
  | "gale_crescent"
  | "pollen_vortex"
  | "flutter_scatter"
  | "prism_boomerang"
  | "volt_web_snare"
  | "static_discharge"
  | "slag_pour"
  | "crucible_mortar"
  | "furnace_overpressure"
  | "chrono_shear"
  | "null_guillotine"
  | "stasis_implosion";

export interface EnemyEntity {
  uid: number;
  defId: string;
  campId: string;
  biome: BiomeId;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  facing: number;
  facingDir: EnemyFacingDir;
  radius: number;

  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  level: number;
  isBoss: boolean;
  isWorldBoss: boolean;
  bossSummonedAdds?: boolean;
  isSummonedMinion?: boolean;

  state: "patrol" | "aggro" | "leash";
  patrolTargetX: number;
  patrolTargetY: number;
  patrolWait: number;

  aiTimer: number;
  specialTimer: number;
  phase: number;
  hitFlash: number;
  walkTime: number;

  // Synchronized 4-dir skill animations, dash momentum & shield guard
  animKind: EnemyAnimKind;
  animTime: number;
  animDuration: number;
  animAngle: number;
  animImpactDone?: boolean;
  dashVx: number;
  dashVy: number;
  dashTime: number;
  guardTime: number;
  skillCycle: number;
  spawnAnimTime?: number;
  alertTimer?: number;
  hurtTilt?: number;

  // 9-Element reaction & Boss Bleach Shield / Stagger states
  element: ElementType | null;
  elementTime: number;
  reactionIcd: number;
  burnTime: number;
  burnTick: number;
  slowTime: number;
  poisonTime: number;
  poisonTick: number;
  rootTime: number;
  stunTime: number;
  vulnTime: number; // Def-down / Boss shield-break stagger vulnerability
  critVulnTime: number; // +15% Crit taken (Superconduct)
  normalAmpTime: number; // +18% Normal/Charge DMG taken (Null Frost)
  disruptTime: number; // Disrupt: reduced enemy attack rate & accuracy (Void Arc / Maelstrom)
  blightDecayTime: number; // Bonus Void decay chip on consecutive hits (Blight Decay)
  chromaSlowBonusTime: number; // Bonus resource yield if killed while slowed (Chroma Cryo)
  enrageBuffTime: number; // Enemy speed/def buff stripped by Void!
  bleachShield: number;
  maxBleachShield: number;
  totemChannelTimer: number;
  bleedStacks?: number;
  bleedTime?: number;
  bleedTick?: number;
}

export interface ArenaTotemEntity {
  uid: number;
  element: InfusableElement;
  x: number;
  y: number;
  lit: boolean;
  hitFlash: number;
}

export interface ProjectileEntity {
  uid: number;
  owner: "player" | "enemy" | "turret";
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  radius: number;
  damage: number;
  crit: boolean;
  pierce: number;
  life: number;
  maxLife: number;
  preset: string; // pixelfx atlas preset
  element?: ElementType;
  hitSet: Set<number>;
  homing?: boolean;
  canOverclockTurret?: boolean;
  hitPreset?: string;
  poiseMult?: number;
  turnRate?: number;
  boomerangTime?: number;
  spawnHazardOnHit?: "moss_pool" | "volt_snare";
  hazardDamage?: number;
}

export interface TurretEntity {
  uid: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  life: number;
  maxLife: number;
  fireCd: number;
  overclockTime: number;
  angle: number;
  hitFlash: number;
}

export interface HazardEntity {
  uid: number;
  owner: "player" | "enemy";
  kind:
    | "vortex"
    | "meteor"
    | "afterimage"
    | "acid_pool"
    | "moss_pool"
    | "null_frost"
    | "chroma_bloom"
    | "flame_trail"
    | "bleach_zone"
    | "skyfall_crystal"
    | "boss_cone"
    | "boss_slam"
    | "boss_thorns"
    | "boss_erase"
    | "boss_cross"
    | "boss_rot_cross"
    | "tempest_sigil"
    | "quantum_mine"
    | "pollen_vortex"
    | "volt_snare"
    | "parallel_beam"
    | "chrono_ring"
    | "stasis_implosion";
  x: number;
  y: number;
  radius: number;
  delay: number; // telegraph countdown before detonation (0 if active DOT)
  age: number;
  maxLife: number;
  tickTimer: number;
  damage: number;
  angle?: number;
  vfxPreset?: string;
  liveVfx?: { modId: string; mode?: string; offsetY?: number; startTime?: number };
  knockback?: number;
  triggered: boolean;
}

export interface GroundLootEntity {
  uid: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  z: number;
  vz: number;
  kind: "gold" | "item";
  gold?: number;
  item?: ItemInstance;
  rarity: Rarity;
  age: number;
  bobPhase: number;
}

export interface ResourceEntity {
  def: ResourceNodeDef;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  respawnTimer: number;
  hitFlash: number;
}

export interface ChestEntity {
  campId: string;
  x: number;
  y: number;
  rarity: Rarity;
  state: "locked" | "unlocked" | "opened";
}

export interface CampRuntime {
  def: CampDef;
  respawnTimer: number;
  waitingRespawn: boolean;
}
