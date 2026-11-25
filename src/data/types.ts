export type ClassId = "prism_knight" | "chroma_mage" | "bit_rogue" | "pixel_tinker";

export type BiomeId = "town" | "meadow" | "quartz" | "amber" | "ruins";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type EquipSlot = "weapon" | "armor" | "ring" | "chip";

export type ItemCategory = "equipment" | "material" | "consumable";

export type ElementType = "fire" | "ice" | "poison";

export type StatAllocKey = "str" | "vit" | "agi" | "crt";

export type AllocatedStats = Record<StatAllocKey, number>;

export type GearVisualTier = "none" | "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface HeroVisualLoadout {
  weaponTier: GearVisualTier;
  armorTier: GearVisualTier;
  ringTier: GearVisualTier;
  chipTier: GearVisualTier;
  weaponEnhance: number;
}

export type WeaponSkillVariant =
  | "knight_shield_beam"
  | "knight_quake_aegis"
  | "knight_solar_prism"
  | "mage_chroma_vortex"
  | "mage_frost_nova"
  | "mage_astral_collapse"
  | "rogue_frame_skip"
  | "rogue_shadow_ambush"
  | "rogue_phantom_blitz"
  | "tinker_compile_turret"
  | "tinker_shock_mortar"
  | "tinker_prism_cannon";

export type ChipUltVariant = "ult_standard" | "ult_overclock" | "ult_cataclysm" | "ult_sovereign";

export type ClassRewardKey =
  | "starter_weapon"
  | "uncommon_weapon"
  | "uncommon_armor"
  | "rare_weapon"
  | "epic_weapon"
  | "legendary_weapon";

export interface ActiveBossLock {
  bossUid: number;
  bossDefId: string;
  bossName: string;
  cx: number;
  cy: number;
  radius: number;
}

export interface StatBonus {
  atk?: number;
  def?: number;
  maxHp?: number;
  spd?: number;
  crit?: number; // percentage points, e.g. 5 = +5%
}

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  rarity: Rarity;
  slot?: EquipSlot;
  iconColor: string;
  desc: string;
  sellPrice: number;
  buyPrice?: number;
  baseStats?: StatBonus;
  consumableKind?: "hp_potion" | "stamina_elixir" | "chroma_tonic";
  allowedClasses?: ClassId[];
  visualTier?: GearVisualTier;
  grantsSkillE?: { variant: WeaponSkillVariant; name: string; desc: string };
  grantsSkillQ?: { variant: ChipUltVariant; name: string; desc: string };
  passiveSkill?: { id: string; name: string; desc: string };
}

export interface ItemInstance {
  uid: string;
  defId: string;
  qty: number;
  enhanceLevel: number; // +0 .. +10 for equipment
  pityBonus?: number;
  bonusStats?: StatBonus;
}

export interface RecipeDef {
  id: string;
  resultDefId: string;
  goldCost: number;
  materials: { defId: string; qty: number }[];
  desc: string;
}

export type QuestObjectiveKind =
  | "kill_enemy"
  | "kill_any"
  | "mine_resource"
  | "enhance_item"
  | "activate_waypoint"
  | "open_chest";

export interface QuestObjectiveDef {
  id: string;
  kind: QuestObjectiveKind;
  targetId?: string; // enemyId or biomeId
  required: number;
  label: string;
}

export interface QuestDef {
  id: string;
  title: string;
  giverNpcId: string;
  prereqQuestId?: string;
  repeatable?: boolean;
  isMain?: boolean;
  summary: string;
  dialogueStart: string;
  dialogueActive: string;
  dialogueComplete: string;
  objectives: QuestObjectiveDef[];
  rewards: {
    gold: number;
    xp: number;
    items?: { defId: string; qty: number }[];
    classRewards?: ClassRewardKey[];
  };
}

export type QuestState = "available" | "active" | "completable" | "completed";

export interface QuestProgress {
  questId: string;
  state: QuestState;
  counts: Record<string, number>;
  completions: number;
}

export interface WaypointDef {
  id: string;
  name: string;
  biome: BiomeId;
  tx: number;
  ty: number;
  restoreRadiusTiles: number;
  initiallyUnlocked?: boolean;
}

export interface NpcDef {
  id: string;
  name: string;
  role: string;
  kind: "elder" | "blacksmith" | "merchant";
  tx: number;
  ty: number;
  accent: string;
  greeting: string;
}

export interface CampDef {
  id: string;
  biome: BiomeId;
  tx: number;
  ty: number;
  enemies: { typeId: string; count: number }[];
  hasLockedChest: boolean;
  chestRarity: Rarity;
  respawnSec: number;
}

export interface ResourceNodeDef {
  id: string;
  kind: "iron_vein" | "quartz_cluster" | "amber_crystal" | "void_crystal";
  biome: BiomeId;
  tx: number;
  ty: number;
  dropItemId: string;
  dropQty: [number, number];
  maxHp: number;
  respawnSec: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  biome: BiomeId;
  level: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  radius: number;
  aggroRadius: number;
  leashRadius: number;
  xp: number;
  gold: [number, number];
  isBoss?: boolean;
  isWorldBoss?: boolean;
  ai: "melee" | "ranged" | "flanker" | "bruiser" | "boss_root" | "boss_amber" | "boss_eraser";
  lootMaterials: { defId: string; chance: number }[];
  equipDropChance: number;
  minRarity: Rarity;
}

export interface SaveDataV2 {
  version: number;
  savedAt: number;
  classId: ClassId;
  player: {
    x: number;
    y: number;
    hp: number;
    level: number;
    xp: number;
    xpNext: number;
    gold: number;
    overdrive: number;
    respawnWaypointId: string;
    statPoints: number;
    allocatedStats: AllocatedStats;
  };
  equipment: Partial<Record<EquipSlot, ItemInstance>>;
  bag: ItemInstance[];
  unlockedWaypoints: string[];
  openedChests: string[];
  quests: Record<string, QuestProgress>;
  stats: {
    kills: number;
    mined: number;
    chestsOpened: number;
    bossesDefeated: number;
  };
}
