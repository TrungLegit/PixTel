export type ClassId = "prism_knight" | "chroma_mage" | "bit_rogue" | "pixel_tinker";

export type BiomeId = "town" | "meadow" | "quartz" | "amber" | "ruins";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

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
  | "staff"
  | "dagger"
  | "gun"
  | "helmet"
  | "armor"
  | "boots"
  | "accessory"
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

export type ElementType = "fire" | "ice" | "poison";

export interface StatBonus {
  atk?: number;
  def?: number;
  maxHp?: number;
  spd?: number;
  crit?: number; // percentage points, e.g. 5 = +5%
  critRate?: number; // alias for crit
  moveSpeed?: number; // alias for spd
  elementBonus?: number; // % bonus elemental & skill damage
}

export interface ItemDef {
  id: string;
  name: string;
  category: ItemType;
  rarity: Rarity;
  slot?: EquipSlot;
  iconColor: string;
  iconKind?: ItemIconKind;
  visualColor?: string;
  accentColor?: string;
  visualStyle?: EquipVisualStyle;
  requiredClass?: ClassId | "all";
  biomeTheme?: BiomeId;
  setId?: string;
  dismantleShards?: number;
  desc: string;
  sellPrice: number;
  buyPrice?: number;
  baseStats?: StatBonus;
  consumableKind?: "hp_potion" | "stamina_elixir" | "chroma_tonic";
}

export interface ItemInstance {
  uid: string;
  defId: string;
  qty: number;
  enhanceLevel: number; // +0 .. +10 for equipment
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
