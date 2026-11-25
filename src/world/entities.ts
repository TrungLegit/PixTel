import type {
  BiomeId,
  CampDef,
  ClassId,
  ElementType,
  InfusableElement,
  ItemInstance,
  Rarity,
  ResourceNodeDef,
} from "../data/types";

export interface PlayerEntity {
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
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  crit: number; // percentage 0..100
  critMult: number;
  elementBonus: number; // % bonus elemental & skill damage

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

  // Derived equipment bonuses & passives
  staminaCostPct: number; // negative = cheaper charge/dash
  poiseBreakPct: number; // % bonus vs Bleach Shield
  skillCdPct: number; // negative = faster [E]
  hasOrbitGrimoire: boolean;
  hasReactionAmp: boolean;
  grimoireTimer: number;

  // Advanced 60FPS Combat Rhythm (Perfect Dash, Dash-Offset, Quick/Just-Charge)
  perfectDashWindow: number;
  chromaCounterTimer: number;
  dashComboPreserveTimer: number;
  quickChargeTimer: number;
  bleachDebuffTime: number;

  // Consumable temporary buffs
  speedBuffTime: number;
  atkBuffTime: number;
  coatingTime: number;
  coatingElement: InfusableElement | null;
  respawnWaypointId: string;
}

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
  radius: number;

  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  level: number;
  isBoss: boolean;
  isWorldBoss: boolean;

  state: "patrol" | "aggro" | "leash";
  patrolTargetX: number;
  patrolTargetY: number;
  patrolWait: number;

  aiTimer: number;
  specialTimer: number;
  phase: number;
  hitFlash: number;
  walkTime: number;

  // Elemental reaction & Boss Bleach Shield / Stagger states
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
  bleachShield: number;
  maxBleachShield: number;
  totemChannelTimer: number;
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
  canOverclockTurret?: boolean;
  hitPreset?: string;
  poiseMult?: number;
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
    | "flame_trail"
    | "bleach_zone"
    | "skyfall_crystal"
    | "boss_cone"
    | "boss_slam"
    | "boss_thorns"
    | "boss_erase"
    | "boss_cross"
    | "boss_rot_cross";
  x: number;
  y: number;
  radius: number;
  delay: number; // telegraph countdown before detonation (0 if active DOT)
  age: number;
  maxLife: number;
  tickTimer: number;
  damage: number;
  angle?: number;
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
