import type {
  AllocatedStats,
  BiomeId,
  CampDef,
  ClassId,
  ElementType,
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
  def: number;
  spd: number;
  crit: number; // percentage 0..100
  critMult: number;

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

  // Consumable temporary buffs
  speedBuffTime: number;
  atkBuffTime: number;
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

  // Elemental reaction states (Chroma Mage)
  element: ElementType | null;
  elementTime: number;
  burnTime: number;
  burnTick: number;
  slowTime: number;
  poisonTime: number;
  poisonTick: number;
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
    | "boss_slam"
    | "boss_thorns"
    | "boss_erase"
    | "boss_cross";
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
