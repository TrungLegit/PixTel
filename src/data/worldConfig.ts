import type { BiomeId, CampDef, NpcDef, ResourceNodeDef, WaypointDef } from "./types";

export const WORLD_COLS = 160;
export const WORLD_ROWS = 160;
export const TILE_SIZE = 16;
export const WORLD_W = WORLD_COLS * TILE_SIZE; // 2560px
export const WORLD_H = WORLD_ROWS * TILE_SIZE; // 2560px

export const TOWN_BOUNDS = {
  x0: 68,
  y0: 68,
  x1: 92,
  y1: 92,
  cx: 80,
  cy: 80,
};

export interface BiomePalette {
  groundA: string;
  groundB: string;
  groundC: string;
  road: string;
  roadEdge: string;
  waterA: string;
  waterB: string;
  lavaA: string;
  lavaB: string;
  wallDark: string;
  wallMid: string;
  wallLight: string;
  foliageDark: string;
  foliageMid: string;
  foliageLight: string;
  trunk: string;
  crystalDark: string;
  crystalLight: string;
  flower: string;
  outline: string;
}

export interface BiomeConfig {
  id: BiomeId;
  name: string;
  subtitle: string;
  levelRange: string;
  mapColorRestored: string;
  mapColorBleached: string;
  bleached: BiomePalette;
  restored: BiomePalette;
}

export const BIOME_CONFIGS: Record<BiomeId, BiomeConfig> = {
  town: {
    id: "town",
    name: "THỊ TRẤN KHỞI NGUYÊN",
    subtitle: "Khu An Toàn — Thành Trì Sắc Màu",
    levelRange: "SAFE",
    mapColorRestored: "#7c6a56",
    mapColorBleached: "#52555e",
    bleached: {
      groundA: "#585b63",
      groundB: "#4e5159",
      groundC: "#666a73",
      road: "#727680",
      roadEdge: "#3e4047",
      waterA: "#3c434d",
      waterB: "#4d5663",
      lavaA: "#544747",
      lavaB: "#786666",
      wallDark: "#2d2f36",
      wallMid: "#5b5f6b",
      wallLight: "#8b909e",
      foliageDark: "#2d3238",
      foliageMid: "#4d545e",
      foliageLight: "#767e8a",
      trunk: "#3e3c3c",
      crystalDark: "#525866",
      crystalLight: "#b4bccc",
      flower: "#8c92a0",
      outline: "#17181f",
    },
    restored: {
      groundA: "#6e5c4d",
      groundB: "#625143",
      groundC: "#7d6958",
      road: "#99856e",
      roadEdge: "#4e3e33",
      waterA: "#1b6fa8",
      waterB: "#3aa6e8",
      lavaA: "#c93818",
      lavaB: "#ff9b26",
      wallDark: "#32354a",
      wallMid: "#626a8a",
      wallLight: "#9ba8cc",
      foliageDark: "#1c4a32",
      foliageMid: "#368a50",
      foliageLight: "#73d66b",
      trunk: "#694127",
      crystalDark: "#14829c",
      crystalLight: "#5ef2ff",
      flower: "#ff7eb6",
      outline: "#12101c",
    },
  },
  meadow: {
    id: "meadow",
    name: "ĐỒNG CỎ XÁM",
    subtitle: "Ash Meadow — Vùng Thảo Nguyên Khởi Đầu",
    levelRange: "LV 1-5",
    mapColorRestored: "#358f53",
    mapColorBleached: "#494d54",
    bleached: {
      groundA: "#464a52",
      groundB: "#3d4047",
      groundC: "#525660",
      road: "#656973",
      roadEdge: "#31333a",
      waterA: "#38404a",
      waterB: "#4d5763",
      lavaA: "#544545",
      lavaB: "#735f5f",
      wallDark: "#292b30",
      wallMid: "#545861",
      wallLight: "#848996",
      foliageDark: "#2f333a",
      foliageMid: "#4d525c",
      foliageLight: "#747a87",
      trunk: "#3b3c42",
      crystalDark: "#4e525c",
      crystalLight: "#a6acb8",
      flower: "#858a96",
      outline: "#181a1f",
    },
    restored: {
      groundA: "#2c6e46",
      groundB: "#245c3a",
      groundC: "#388554",
      road: "#9c7e58",
      roadEdge: "#634c34",
      waterA: "#1b78b8",
      waterB: "#54c2ff",
      lavaA: "#c93818",
      lavaB: "#ff9b26",
      wallDark: "#2a3142",
      wallMid: "#556482",
      wallLight: "#8fa2c4",
      foliageDark: "#19452c",
      foliageMid: "#369454",
      foliageLight: "#80e66e",
      trunk: "#694127",
      crystalDark: "#18859e",
      crystalLight: "#66f7ff",
      flower: "#ffdd55",
      outline: "#101f17",
    },
  },
  quartz: {
    id: "quartz",
    name: "RỪNG THẠCH ANH",
    subtitle: "Quartz Forest — Rừng Tinh Thể Lục Lam",
    levelRange: "LV 5-10",
    mapColorRestored: "#1e7a7d",
    mapColorBleached: "#3c424a",
    bleached: {
      groundA: "#3a3e47",
      groundB: "#31353d",
      groundC: "#454a54",
      road: "#575c66",
      roadEdge: "#262930",
      waterA: "#2d3540",
      waterB: "#424d5c",
      lavaA: "#4a3e42",
      lavaB: "#6b5960",
      wallDark: "#22252e",
      wallMid: "#494f5c",
      wallLight: "#788091",
      foliageDark: "#232830",
      foliageMid: "#3f4754",
      foliageLight: "#657082",
      trunk: "#31333b",
      crystalDark: "#4b5261",
      crystalLight: "#a7b1c4",
      flower: "#7f8899",
      outline: "#14161c",
    },
    restored: {
      groundA: "#1a4d54",
      groundB: "#143e45",
      groundC: "#22636b",
      road: "#486575",
      roadEdge: "#273b47",
      waterA: "#0e5a8a",
      waterB: "#3de0ff",
      lavaA: "#c93818",
      lavaB: "#ff9b26",
      wallDark: "#1a283d",
      wallMid: "#35557a",
      wallLight: "#6ca0d1",
      foliageDark: "#0e383d",
      foliageMid: "#1b787d",
      foliageLight: "#4ee8d8",
      trunk: "#3e3252",
      crystalDark: "#1c89b8",
      crystalLight: "#8efcff",
      flower: "#c878ff",
      outline: "#0b1a21",
    },
  },
  amber: {
    id: "amber",
    name: "HẦM MỎ HỔ PHÁCH",
    subtitle: "Amber Mines — Hầm Mỏ Nham Thạch & Quặng Vàng",
    levelRange: "LV 10-15",
    mapColorRestored: "#9e4d24",
    mapColorBleached: "#403c45",
    bleached: {
      groundA: "#3d3a42",
      groundB: "#333038",
      groundC: "#4a4650",
      road: "#595561",
      roadEdge: "#28252c",
      waterA: "#383540",
      waterB: "#4e4a59",
      lavaA: "#4d454a",
      lavaB: "#786e75",
      wallDark: "#242129",
      wallMid: "#4f4a57",
      wallLight: "#80798c",
      foliageDark: "#2c2830",
      foliageMid: "#4d4654",
      foliageLight: "#766e80",
      trunk: "#38333b",
      crystalDark: "#544f5c",
      crystalLight: "#b4adc2",
      flower: "#898296",
      outline: "#17141c",
    },
    restored: {
      groundA: "#3b233d",
      groundB: "#2e1a30",
      groundC: "#4d2d4f",
      road: "#6e4249",
      roadEdge: "#402229",
      waterA: "#3d226b",
      waterB: "#6e45b8",
      lavaA: "#d93b14",
      lavaB: "#ffb833",
      wallDark: "#24132b",
      wallMid: "#573261",
      wallLight: "#945fa1",
      foliageDark: "#4a1c14",
      foliageMid: "#a84418",
      foliageLight: "#ff9d2e",
      trunk: "#4f2722",
      crystalDark: "#c95b12",
      crystalLight: "#ffe66b",
      flower: "#ff6633",
      outline: "#170c1c",
    },
  },
  ruins: {
    id: "ruins",
    name: "PHẾ TÍCH VÔ SẮC",
    subtitle: "Blank Ruins — Thánh Địa The Eraser",
    levelRange: "LV 15-20",
    mapColorRestored: "#6936c9",
    mapColorBleached: "#7d818c",
    bleached: {
      groundA: "#7c808a",
      groundB: "#6e727c",
      groundC: "#8d919c",
      road: "#a4a8b3",
      roadEdge: "#4f525c",
      waterA: "#5c606b",
      waterB: "#7d828f",
      lavaA: "#8f94a1",
      lavaB: "#d0d5e0",
      wallDark: "#3f424a",
      wallMid: "#7e828f",
      wallLight: "#d0d4e0",
      foliageDark: "#4c5059",
      foliageMid: "#7d828f",
      foliageLight: "#c2c6d1",
      trunk: "#575b66",
      crystalDark: "#6a6e7a",
      crystalLight: "#edf0f7",
      flower: "#b4b9c4",
      outline: "#252830",
    },
    restored: {
      groundA: "#21194a",
      groundB: "#181138",
      groundC: "#2e2463",
      road: "#49378a",
      roadEdge: "#271c52",
      waterA: "#16357d",
      waterB: "#3df2ff",
      lavaA: "#b81d78",
      lavaB: "#ff6ee6",
      wallDark: "#141033",
      wallMid: "#434294",
      wallLight: "#878cf5",
      foliageDark: "#2b124f",
      foliageMid: "#822ae6",
      foliageLight: "#ff69e8",
      trunk: "#31205e",
      crystalDark: "#1b8fd1",
      crystalLight: "#78f9ff",
      flower: "#ffe066",
      outline: "#0b081f",
    },
  },
};

export const CHROMA_RAINBOW = [
  "#ff3366",
  "#ff9933",
  "#ffee44",
  "#44ee88",
  "#33ddff",
  "#bb55ff",
];

// 3 Fixed NPCs in Origin Town + Class Altar coordinate
export const CLASS_ALTAR_POS = { tx: 80, ty: 74 };

export const TOWN_NPCS: NpcDef[] = [
  {
    id: "npc_elder",
    name: "Trưởng Làng Elian",
    role: "Nhiệm Vụ Chính & Phụ",
    kind: "elder",
    tx: 80,
    ty: 78,
    accent: "#ffe066",
    greeting: "Chào Chroma-Walker! Thế giới đang bị Nhiễu Trắng nuốt chửng. Hãy kích hoạt các Trụ Sắc Màu và đánh bại The Eraser!",
  },
  {
    id: "npc_blacksmith",
    name: "Thợ Rèn Lăng Kính Kael",
    role: "Cường Hóa & Chế Tạo",
    kind: "blacksmith",
    tx: 74,
    ty: 78,
    accent: "#ff8844",
    greeting: "Mang Quặng và Lõi Glitch tới đây! Lò Lăng Kính có thể cường hóa trang bị lên +10 hoặc đúc thần khí Huyền Thoại!",
  },
  {
    id: "npc_merchant",
    name: "Thương Nhân Mira",
    role: "Cửa Hàng Vật Phẩm",
    kind: "merchant",
    tx: 86,
    ty: 78,
    accent: "#44ee88",
    greeting: "Đừng quên dự trữ Bình Máu [1], Tinh Chất Thể Lực [2] và Dược Phẩm Quang Phổ [3] trước khi khám phá vùng đất mới nhé!",
  },
];

// 9 Chroma Waypoints across Town + 4 Biomes
export const WAYPOINTS: WaypointDef[] = [
  { id: "wp_town", name: "Quảng Trường Khởi Nguyên", biome: "town", tx: 80, ty: 82, restoreRadiusTiles: 22, initiallyUnlocked: true },
  // Meadow (NW)
  { id: "wp_meadow_east", name: "Trụ Cửa Ngõ Đồng Cỏ", biome: "meadow", tx: 52, ty: 56, restoreRadiusTiles: 36 },
  { id: "wp_meadow_west", name: "Trụ Đồi Gió Xám", biome: "meadow", tx: 22, ty: 28, restoreRadiusTiles: 42 },
  // Quartz Forest (NE)
  { id: "wp_quartz_south", name: "Trụ Rừng Pha Lê", biome: "quartz", tx: 108, ty: 54, restoreRadiusTiles: 36 },
  { id: "wp_quartz_north", name: "Trụ Cổ Thụ Thạch Anh", biome: "quartz", tx: 132, ty: 26, restoreRadiusTiles: 42 },
  // Amber Mines (SW)
  { id: "wp_amber_north", name: "Trụ Cổng Mỏ Hổ Phách", biome: "amber", tx: 52, ty: 108, restoreRadiusTiles: 36 },
  { id: "wp_amber_deep", name: "Trụ Lò Dung Nham", biome: "amber", tx: 24, ty: 134, restoreRadiusTiles: 42 },
  // Blank Ruins (SE)
  { id: "wp_ruins_gate", name: "Trụ Cổng Phế Tích", biome: "ruins", tx: 108, ty: 108, restoreRadiusTiles: 36 },
  { id: "wp_ruins_sanctum", name: "Trụ Đấu Trường Vô Sắc", biome: "ruins", tx: 128, ty: 126, restoreRadiusTiles: 46 },
];

// Enemy Camps & Boss Arenas (patrol + aggro + leash + respawn + locked chests)
export const WORLD_CAMPS: CampDef[] = [
  // Meadow (Lv 1-5) — starter camps close to west/north gate!
  {
    id: "camp_meadow_1",
    biome: "meadow",
    tx: 56,
    ty: 76,
    enemies: [{ typeId: "null_slime", count: 4 }],
    hasLockedChest: true,
    chestRarity: "uncommon",
    respawnSec: 32,
  },
  {
    id: "camp_meadow_2",
    biome: "meadow",
    tx: 42,
    ty: 54,
    enemies: [{ typeId: "null_slime", count: 3 }, { typeId: "ash_hopper", count: 2 }],
    hasLockedChest: true,
    chestRarity: "uncommon",
    respawnSec: 35,
  },
  {
    id: "camp_meadow_3",
    biome: "meadow",
    tx: 26,
    ty: 38,
    enemies: [{ typeId: "ash_hopper", count: 3 }, { typeId: "static_imp", count: 2 }],
    hasLockedChest: true,
    chestRarity: "rare",
    respawnSec: 38,
  },
  // Quartz Forest (Lv 5-10)
  {
    id: "camp_quartz_1",
    biome: "quartz",
    tx: 104,
    ty: 62,
    enemies: [{ typeId: "bleach_hound", count: 3 }, { typeId: "static_imp", count: 2 }],
    hasLockedChest: true,
    chestRarity: "rare",
    respawnSec: 36,
  },
  {
    id: "camp_quartz_2",
    biome: "quartz",
    tx: 118,
    ty: 42,
    enemies: [{ typeId: "bleach_hound", count: 3 }, { typeId: "quartz_stalker", count: 2 }],
    hasLockedChest: true,
    chestRarity: "rare",
    respawnSec: 38,
  },
  {
    id: "camp_quartz_boss",
    biome: "quartz",
    tx: 138,
    ty: 20,
    enemies: [{ typeId: "boss_blight_root", count: 1 }, { typeId: "quartz_stalker", count: 2 }],
    hasLockedChest: true,
    chestRarity: "epic",
    respawnSec: 65,
  },
  // Amber Mines (Lv 10-15)
  {
    id: "camp_amber_1",
    biome: "amber",
    tx: 56,
    ty: 100,
    enemies: [{ typeId: "amber_beetle", count: 3 }, { typeId: "cinder_imp", count: 2 }],
    hasLockedChest: true,
    chestRarity: "rare",
    respawnSec: 38,
  },
  {
    id: "camp_amber_2",
    biome: "amber",
    tx: 38,
    ty: 118,
    enemies: [{ typeId: "amber_beetle", count: 2 }, { typeId: "prism_golem", count: 2 }],
    hasLockedChest: true,
    chestRarity: "epic",
    respawnSec: 40,
  },
  {
    id: "camp_amber_boss",
    biome: "amber",
    tx: 20,
    ty: 140,
    enemies: [{ typeId: "boss_gilded_null", count: 1 }, { typeId: "cinder_imp", count: 2 }],
    hasLockedChest: true,
    chestRarity: "epic",
    respawnSec: 65,
  },
  // Blank Ruins (Lv 15-20)
  {
    id: "camp_ruins_1",
    biome: "ruins",
    tx: 102,
    ty: 102,
    enemies: [{ typeId: "prism_golem", count: 2 }, { typeId: "void_wraith", count: 3 }],
    hasLockedChest: true,
    chestRarity: "epic",
    respawnSec: 42,
  },
  {
    id: "camp_ruins_2",
    biome: "ruins",
    tx: 120,
    ty: 114,
    enemies: [{ typeId: "void_wraith", count: 3 }, { typeId: "bleach_hound", count: 2 }],
    hasLockedChest: true,
    chestRarity: "epic",
    respawnSec: 42,
  },
  {
    id: "camp_world_boss",
    biome: "ruins",
    tx: 140,
    ty: 140,
    enemies: [{ typeId: "boss_the_eraser", count: 1 }],
    hasLockedChest: true,
    chestRarity: "legendary",
    respawnSec: 90,
  },
];

// Respawning Resource Nodes across all 4 Biomes
export const WORLD_RESOURCES: ResourceNodeDef[] = [
  // Starter Iron & Quartz right outside town gates for early mining quest!
  { id: "res_m1", kind: "iron_vein", biome: "meadow", tx: 63, ty: 74, dropItemId: "mat_iron_ore", dropQty: [2, 3], maxHp: 45, respawnSec: 26 },
  { id: "res_m2", kind: "iron_vein", biome: "meadow", tx: 61, ty: 84, dropItemId: "mat_iron_ore", dropQty: [2, 3], maxHp: 45, respawnSec: 26 },
  { id: "res_m3", kind: "iron_vein", biome: "meadow", tx: 50, ty: 65, dropItemId: "mat_iron_ore", dropQty: [2, 4], maxHp: 45, respawnSec: 28 },
  { id: "res_m4", kind: "iron_vein", biome: "meadow", tx: 36, ty: 44, dropItemId: "mat_iron_ore", dropQty: [2, 4], maxHp: 50, respawnSec: 28 },
  { id: "res_m5", kind: "quartz_cluster", biome: "meadow", tx: 72, ty: 62, dropItemId: "mat_quartz_shard", dropQty: [1, 2], maxHp: 55, respawnSec: 28 },
  { id: "res_m6", kind: "iron_vein", biome: "meadow", tx: 30, ty: 62, dropItemId: "mat_iron_ore", dropQty: [2, 4], maxHp: 50, respawnSec: 28 },
  // Quartz Forest
  { id: "res_q1", kind: "quartz_cluster", biome: "quartz", tx: 96, ty: 72, dropItemId: "mat_quartz_shard", dropQty: [2, 3], maxHp: 70, respawnSec: 30 },
  { id: "res_q2", kind: "quartz_cluster", biome: "quartz", tx: 102, ty: 50, dropItemId: "mat_quartz_shard", dropQty: [2, 3], maxHp: 70, respawnSec: 30 },
  { id: "res_q3", kind: "quartz_cluster", biome: "quartz", tx: 122, ty: 58, dropItemId: "mat_quartz_shard", dropQty: [2, 4], maxHp: 75, respawnSec: 30 },
  { id: "res_q4", kind: "quartz_cluster", biome: "quartz", tx: 130, ty: 38, dropItemId: "mat_quartz_shard", dropQty: [2, 4], maxHp: 75, respawnSec: 30 },
  { id: "res_q5", kind: "iron_vein", biome: "quartz", tx: 112, ty: 30, dropItemId: "mat_iron_ore", dropQty: [3, 5], maxHp: 65, respawnSec: 30 },
  // Amber Mines
  { id: "res_a1", kind: "amber_crystal", biome: "amber", tx: 64, ty: 96, dropItemId: "mat_amber_gem", dropQty: [2, 3], maxHp: 95, respawnSec: 32 },
  { id: "res_a2", kind: "amber_crystal", biome: "amber", tx: 46, ty: 114, dropItemId: "mat_amber_gem", dropQty: [2, 3], maxHp: 95, respawnSec: 32 },
  { id: "res_a3", kind: "amber_crystal", biome: "amber", tx: 30, ty: 126, dropItemId: "mat_amber_gem", dropQty: [2, 4], maxHp: 100, respawnSec: 32 },
  { id: "res_a4", kind: "iron_vein", biome: "amber", tx: 66, ty: 124, dropItemId: "mat_iron_ore", dropQty: [3, 5], maxHp: 80, respawnSec: 30 },
  { id: "res_a5", kind: "amber_crystal", biome: "amber", tx: 42, ty: 142, dropItemId: "mat_amber_gem", dropQty: [3, 4], maxHp: 100, respawnSec: 34 },
  // Blank Ruins
  { id: "res_r1", kind: "void_crystal", biome: "ruins", tx: 96, ty: 96, dropItemId: "mat_void_prism", dropQty: [1, 2], maxHp: 120, respawnSec: 36 },
  { id: "res_r2", kind: "void_crystal", biome: "ruins", tx: 116, ty: 100, dropItemId: "mat_void_prism", dropQty: [1, 3], maxHp: 120, respawnSec: 36 },
  { id: "res_r3", kind: "void_crystal", biome: "ruins", tx: 132, ty: 116, dropItemId: "mat_void_prism", dropQty: [2, 3], maxHp: 130, respawnSec: 38 },
  { id: "res_r4", kind: "amber_crystal", biome: "ruins", tx: 104, ty: 132, dropItemId: "mat_amber_gem", dropQty: [3, 4], maxHp: 110, respawnSec: 34 },
];

export function getBiomeAtTile(tx: number, ty: number): BiomeId {
  if (tx >= TOWN_BOUNDS.x0 && tx <= TOWN_BOUNDS.x1 && ty >= TOWN_BOUNDS.y0 && ty <= TOWN_BOUNDS.y1) {
    return "town";
  }
  if (tx < 80 && ty < 80) return "meadow";
  if (tx >= 80 && ty < 80) return "quartz";
  if (tx < 80 && ty >= 80) return "amber";
  return "ruins";
}

export const BOSS_ARENAS: Record<string, { cx: number; cy: number; radius: number; label: string }> = {
  boss_blight_root: {
    cx: 138 * TILE_SIZE + 8,
    cy: 20 * TILE_SIZE + 8,
    radius: 9.5 * TILE_SIZE,
    label: "LÃNH ĐỊA BLIGHT ROOT",
  },
  boss_gilded_null: {
    cx: 20 * TILE_SIZE + 8,
    cy: 140 * TILE_SIZE + 8,
    radius: 9.5 * TILE_SIZE,
    label: "LÃNH ĐỊA GILDED NULL",
  },
  boss_the_eraser: {
    cx: 140 * TILE_SIZE + 8,
    cy: 140 * TILE_SIZE + 8,
    radius: 11.5 * TILE_SIZE,
    label: "THÁNH ĐỊA THE ERASER",
  },
};
