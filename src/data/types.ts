export type ClassId = "prism_knight" | "chroma_mage" | "bit_rogue" | "pixel_tinker";

export type BiomeId = "town" | "meadow" | "quartz" | "amber" | "ruins";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type ItemTier = 1 | 2 | 3 | 4 | 5;

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

export type ClassRewardKey = "starter_weapon";

export interface ActiveBossLock {
  bossUid: number;
  bossDefId: string;
  bossName: string;
  cx: number;
  cy: number;
  radius: number;
}

export type ConsumableGroup = "hp" | "stamina" | "power" | "aegis";

export interface ConsumableSpec {
  group: ConsumableGroup;
  hpPct?: number;
  staminaPct?: number;
  speedPct?: number;
  atkPct?: number;
  critBonus?: number;
  defPct?: number;
  shieldSec?: number;
  invulnSec?: number;
  overdriveGain?: number;
  durationSec?: number;
  cleanseSlow?: boolean;
}

export type EquipSlot = "weapon" | "helmet" | "armor" | "boots" | "accessory";

export const EQUIP_SLOTS: readonly EquipSlot[] = [
  "helmet",
  "armor",
  "weapon",
  "boots",
  "accessory",
];

export type ItemType = "equipment" | "material" | "consumable";
export type ItemCategory = ItemType;

export type ItemIconKind =
  | "sword"
  | "axe"
  | "staff"
  | "dagger"
  | "gun"
  | "helmet"
  | "armor"
  | "boots"
  | "accessory"
  | "amulet"
  | "book"
  | "disc"
  | "totem"
  | "pigment"
  | "potion"
  | "ore"
  | "shard"
  | "core";

export type EquipVisualShape =
  | "hood"
  | "visor"
  | "crest"
  | "crown"
  | "halo"
  | "tunic"
  | "mail"
  | "plate"
  | "aegis"
  | "mantle"
  | "leather"
  | "strider"
  | "greaves"
  | "treads"
  | "void_step"
  | "blade"
  | "greatsword"
  | "halberd"
  | "staff"
  | "daggers"
  | "carbine"
  | "sovereign"
  | "ring_orb"
  | "chip_orb"
  | "halo_orb";

export interface EquipVisualStyle {
  outline: string;
  primary: string;
  accent: string;
  shape: EquipVisualShape;
  offsetX?: number;
  offsetY?: number;
}

export type InfusableElement =
  | "fire"
  | "ice"
  | "nature"
  | "volt"
  | "void"
  | "chroma"
  | "wind"
  | "quake";

export type CanonicalElement = InfusableElement | "prism";
export type ElementType = CanonicalElement | "poison";

export type EquipPassiveId =
  | "guard_breaker"
  | "reaction_amp"
  | "orbit_grimoire"
  | "stamina_flow"
  | "void_siphon"
  | "wind_dancer"
  | "chroma_blessing"
  | "quake_impact";

export interface StatBonus {
  atk?: number;
  def?: number;
  maxHp?: number;
  spd?: number;
  crit?: number; // percentage points, e.g. 5 = +5%
  critRate?: number; // alias for crit
  moveSpeed?: number; // alias for spd
  elementBonus?: number; // % bonus elemental & skill damage
  maxStamina?: number; // bonus max stamina capacity
  staminaCostPct?: number; // negative = reduced stamina cost (e.g. -15)
  poiseBreakPct?: number; // % bonus Bleach Shield break damage
  skillCdPct?: number; // negative = faster [E] cooldown
}

export interface ItemDef {
  id: string;
  name: string;
  category: ItemType;
  rarity: Rarity;
  tier?: ItemTier;
  slot?: EquipSlot;
  iconColor: string;
  iconKind?: ItemIconKind;
  spriteKey?: string;
  paperDollKey?: string;
  capeKey?: string;
  visualColor?: string;
  accentColor?: string;
  visualStyle?: EquipVisualStyle;
  requiredClass?: ClassId | "all";
  biomeTheme?: BiomeId;
  setId?: string;
  dismantleShards?: number;
  desc: string;
  lore?: string;
  passiveId?: EquipPassiveId;
  passiveDesc?: string;
  pigmentElement?: InfusableElement;
  sellPrice: number;
  buyPrice?: number;
  baseStats?: StatBonus;
  consumableKind?:
    | "hp_potion"
    | "stamina_elixir"
    | "chroma_tonic"
    | "chroma_coating"
    | "undying_charm";
  consumableSpec?: ConsumableSpec;
}

export interface ItemInstance {
  uid: string;
  defId: string;
  qty: number;
  enhanceLevel: number; // +0 .. +10 for equipment
  pityBonus?: number; // accumulated failstack % bonus (+0..+100)
  infusedElement?: InfusableElement; // unlocked at +5 via Chroma Pigments
  bonusStats?: StatBonus; // awakened substats rolled on Matrix Forge +1 success
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
  | "infuse_item"
  | "activate_waypoint"
  | "open_chest"
  | "read_lore"
  | "trigger_reaction";

export interface QuestObjectiveDef {
  id: string;
  kind: QuestObjectiveKind;
  targetId?: string; // enemyId, biomeId, or loreId
  required: number;
  label: string;
}

export interface QuestDef {
  id: string;
  chapter?: string;
  title: string;
  giverNpcId: string;
  prereqQuestId?: string;
  repeatable?: boolean;
  isMain?: boolean;
  summary: string;
  loreNote?: string;
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

export interface LoreTabletDef {
  id: string;
  chapter: string;
  title: string;
  biome: BiomeId;
  tx: number;
  ty: number;
  author: string;
  accent: string;
  excerpt: string;
  body: string[];
  rewardXp: number;
  rewardGold: number;
  rewardItem?: { defId: string; qty: number };
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
  bleachShield?: number;
  elementAffinity?: CanonicalElement;
  elementWeakness?: CanonicalElement;
  ai:
    | "melee"
    | "ranged"
    | "flanker"
    | "bruiser"
    | "boss_warden"
    | "boss_root"
    | "boss_amber"
    | "boss_eraser";
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
    statPoints?: number;
    allocatedStats?: AllocatedStats;
    respawnWaypointId: string;
  };
  equipment: Partial<Record<EquipSlot, ItemInstance>>;
  bag: ItemInstance[];
  unlockedWaypoints: string[];
  openedChests: string[];
  discoveredLore?: string[];
  tutorialCompleted?: boolean;
  quests: Record<string, QuestProgress>;
  stats: {
    kills: number;
    mined: number;
    chestsOpened: number;
    bossesDefeated: number;
    reactionsTriggered?: number;
  };
}
