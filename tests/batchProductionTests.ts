import assert from "node:assert/strict";
import codixelEnemiesMeta from "../src/assets/codixel-enemies.json";
import codixelIconsMeta from "../src/assets/codixel-icons.json";
import { CLASSES } from "../src/data/classes";
import { ENEMIES } from "../src/data/enemies";
import { ITEMS, MERCHANT_STOCK, pickRandomEquipByRarity, resolveClassReward } from "../src/data/items";
import { ENEMY_DROP_TABLES, rollEnemyDropTable, type EnemyDropTable } from "../src/data/lootTables";
import { FORGE_RECIPES } from "../src/data/recipes";
import type { ActiveBossLock, BiomeId, ClassId, EnemyDef, EquipSlot, ItemDef, Rarity, RecipeDef, WeaponSkillId } from "../src/data/types";
import { WEAPON_SKILLS, getWeaponSkillForItem, getWeaponSkillId, type WeaponSkillDef } from "../src/data/weaponSkills";
import { BOSS_ARENAS, TILE_SIZE, TOWN_BOUNDS, WORLD_CAMPS, getBiomeAtTile } from "../src/data/worldConfig";
import { ColorRestorationSystem } from "../src/graphics/colorRestoration";
import { CombatSystem, type CombatContext } from "../src/systems/combat";
import { InventorySystem, recalculatePlayerStats } from "../src/systems/inventorySystem";
import { ItemEffectSystem } from "../src/systems/ItemEffectSystem";
import { QuestSystem } from "../src/systems/questSystem";
import type { EnemyAnimKind, EnemyEntity, HazardEntity, PlayerEntity, ProjectileEntity, TurretEntity } from "../src/world/entities";
import { WorldSpawner } from "../src/world/spawner";
import { WorldMap } from "../src/world/worldMap";
import { ATLAS_PRESETS, PIXELFX_MODS } from "../src/vfx/vfxManager";

// ============================================================================
// 1. IDEMPOTENT HEADLESS NODE SHIMS & RECORDING VFX STUB
// ============================================================================
(globalThis as unknown as { performance?: { now: () => number } }).performance ??= {
  now: () => Date.now(),
};

const memStore = new Map<string, string>();
(globalThis as unknown as { localStorage?: unknown }).localStorage ??= {
  getItem: (k: string) => memStore.get(k) ?? null,
  setItem: (k: string, v: string) => {
    memStore.set(k, v);
  },
  removeItem: (k: string) => {
    memStore.delete(k);
  },
};

function makeMockCanvas() {
  return {
    width: 480,
    height: 270,
    addEventListener: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 480, height: 270 }),
    getContext: () => ({
      fillStyle: "",
      strokeStyle: "",
      globalAlpha: 1,
      globalCompositeOperation: "source-over",
      imageSmoothingEnabled: false,
      fillRect: () => {},
      clearRect: () => {},
      strokeRect: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      drawImage: () => {},
      lineWidth: 1,
      font: "",
      fillText: () => {},
      createImageData: (w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4),
      }),
      getImageData: (_x: number, _y: number, w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4),
      }),
      putImageData: () => {},
    }),
  };
}

(globalThis as unknown as { window?: unknown }).window ??= {
  innerWidth: 960,
  innerHeight: 540,
  location: {
    href: "https://trunglegit.github.io/PixTel/",
    origin: "https://trunglegit.github.io",
    pathname: "/PixTel/",
    protocol: "https:",
    search: "",
  },
  addEventListener: () => {},
  setTimeout: globalThis.setTimeout.bind(globalThis),
  clearTimeout: globalThis.clearTimeout.bind(globalThis),
};

(globalThis as unknown as { document?: unknown }).document ??= {
  activeElement: null,
  fullscreenElement: null,
  createElement: () => makeMockCanvas(),
};

export interface RecordedVfxCall {
  modId: string;
  opts: Record<string, unknown>;
}

export interface VfxRecordingLog {
  live: RecordedVfxCall[];
  pooled: RecordedVfxCall[];
}

export function makeRecordingVfx(record?: VfxRecordingLog): CombatContext["vfx"] {
  return {
    spawnLive: (modId: string, opts: Record<string, unknown> = {}) => {
      record?.live.push({ modId, opts });
      return null;
    },
    spawnPooled: (presetKey: string, opts: Record<string, unknown> = {}) => {
      record?.pooled.push({ modId: presetKey, opts });
      return null;
    },
    spawnDamageText: () => {},
    spawnPixelDot: () => {},
    clearAll: () => {},
    update: () => {},
  } as unknown as CombatContext["vfx"];
}

// ============================================================================
// 2. PUBLIC INTERFACES
// ============================================================================
export interface BatchItemSpec {
  id: string;
  slot?: EquipSlot;
  weaponSkillId?: WeaponSkillId | string;
  passiveId?: string;
  vfxIds?: string[];
  spriteKey?: string;
  allowNegativeTradeoff?: boolean;
  maxBurstMult?: number;
}

export interface BatchMobSpec {
  id: string;
  animKinds: (EnemyAnimKind | string)[];
  skillCount?: number;
  vfxIds?: string[];
  droppedBatchItemIds?: string[];
}

export interface BatchProductionSpec {
  batchName?: string;
  items?: BatchItemSpec[];
  mobs?: BatchMobSpec[];
  strictBaseline?: boolean;
  verbose?: boolean;
}

export interface BatchVerificationReport {
  passed: boolean;
  checksRun: number;
  summary: string[];
  warnings: string[];
}

// ============================================================================
// 3. CONSTANTS & BIOME CALIBRATION
// ============================================================================
const CORE_NON_NEGATIVE_STAT_KEYS = [
  "atk",
  "mag",
  "maxHp",
  "spd",
  "moveSpeed",
  "crit",
  "critRate",
  "critDmgPct",
  "lifestealPct",
  "fireResPct",
  "elementBonus",
  "maxStamina",
  "poiseBreakPct",
  "aspdPct",
] as const;

const BIOME_LEVEL_BOUNDS: Record<"meadow" | "quartz" | "amber" | "ruins", readonly [number, number]> = {
  meadow: [1, 6],
  quartz: [6, 10],
  amber: [11, 15],
  ruins: [16, 20],
};

const BASELINE_NEGATIVE_DEF_ALLOWLIST = new Set<string>(["wp_eclipse_reaver"]);
const BASELINE_NEGATIVE_MOVESPD_ALLOWLIST = new Set<string>(["wp_forge_hammer"]);
const BASELINE_COOLDOWN_OUTLIERS = new Set<string>(["ws_blackhole_singularity"]);
const CONTINUOUS_POOL_HAZARD_KINDS = new Set<string>(["flame_trail", "moss_pool", "acid_pool"]);
const NON_ICD_EXOTIC_MODS = new Set<string>(["mod_ult_void_rift", "mod_summer_solar_burn"]);
const ICD_TRIGGER_PASSIVES = new Set<string>(["onHit", "onCrit", "onTakeDamage", "onLowHp", "onKill", "onDash"]);

const iconFrames = codixelIconsMeta.frames as Record<string, { x: number; y: number; w: number; h: number }>;
const enemyFrames = codixelEnemiesMeta.frames as Record<string, { x: number; y: number; w: number; h: number; anchorY: number }>;
const enemyMonsters = codixelEnemiesMeta.monsters as Record<string, { w: number; h: number; floating: boolean }>;

// ============================================================================
// 4. HEADLESS HARNESS & BIOME LOADOUT HELPERS
// ============================================================================
function makeTestPlayer(classId: ClassId = "prism_knight", level = 10): PlayerEntity {
  const cdef = CLASSES.find((c) => c.id === classId)!;
  return {
    classId,
    x: 50 * TILE_SIZE + 8,
    y: 50 * TILE_SIZE + 8,
    vx: 0,
    vy: 0,
    facing: 1,
    facingDir: "right",
    aimAngle: 0,
    radius: 5.5,
    level,
    xp: 0,
    xpNext: 500,
    statPoints: 0,
    allocatedStats: { str: 0, vit: 0, agi: 0, crt: 0 },
    hp: cdef.baseStats.hp,
    maxHp: cdef.baseStats.hp,
    atk: cdef.baseStats.atk,
    def: cdef.baseStats.def,
    spd: cdef.baseStats.spd,
    crit: cdef.baseStats.crit,
    critMult: cdef.baseStats.critMult,
    elementBonus: 15,
    stamina: 100,
    maxStamina: 100,
    staminaRegenDelay: 0,
    exhausted: false,
    sprinting: false,
    overdrive: 40,
    atkCd: 0,
    skillCd: 0,
    dashCd: 0,
    comboStep: 0,
    comboTimer: 0,
    chargeTime: 0,
    charging: false,
    invuln: 0,
    hitFlash: 0,
    dashing: 0,
    dashVx: 0,
    dashVy: 0,
    shieldTime: 0,
    stormTime: 0,
    stormTick: 0,
    cloneTime: 0,
    droneTime: 0,
    droneTick: 0,
    elementIdx: 0,
    walkTime: 0,
    attackAnimTime: 0,
    attackAnimDuration: 0.24,
    attackAnimKind: "slash_1",
    attackAnimAngle: 0,
    staminaCostPct: 0,
    poiseBreakPct: 0,
    skillCdPct: 0,
    hasOrbitGrimoire: false,
    hasReactionAmp: false,
    hasVoidSiphon: false,
    hasWindDancer: false,
    hasChromaBlessing: false,
    hasQuakeImpact: false,
    hasRestoredPrismSurge: false,
    hasEnergySiphon: false,
    hasSetResonance: false,
    grimoireTimer: 0.1,
    perfectDashWindow: 0,
    chromaCounterTimer: 0,
    dashComboPreserveTimer: 0,
    quickChargeTimer: 0,
    tectonicChargeBonus: false,
    chromaGustTime: 0,
    chromaBloomBonusTime: 0,
    totemSurgeElement: null,
    totemSurgeTimer: 0,
    bleachDebuffTime: 0,
    speedBuffTime: 0,
    speedBuffPct: 0,
    atkBuffTime: 0,
    atkBuffPct: 0,
    atkBuffCrit: 0,
    defBuffTime: 0,
    defBuffPct: 0,
    aegisTime: 0,
    coatingTime: 0,
    coatingElement: null,
    respawnWaypointId: "wp_town",
  };
}

function equipDefId(inv: InventorySystem, defId: string, enhanceLevel: number, classId: ClassId) {
  const def = ITEMS[defId];
  assert.ok(def, `equipDefId: unknown item '${defId}'`);
  assert.ok(def.slot, `equipDefId: item '${defId}' has no equip slot`);
  const added = inv.addItem(defId, 1, enhanceLevel);
  assert.equal(added, true, `equipDefId: failed to add '${defId}' to bag`);
  const inst = inv.bag.find((b) => b.defId === defId && b.enhanceLevel === enhanceLevel);
  assert.ok(inst, `equipDefId: could not locate '${defId}' in bag`);
  const res = inv.equipFromBag(inst.uid, classId);
  assert.equal(res.ok, true, `equipDefId: failed to equip '${defId}' for '${classId}': ${res.reason ?? "unknown"}`);
  assert.equal(
    inv.equipment[def.slot]?.defId,
    def.id,
    `equipDefId: equipment['${def.slot}'] expected '${def.id}', got '${inv.equipment[def.slot]?.defId}'`
  );
}

function makeBiomeCalibratedHarness(
  classId: ClassId,
  biome: BiomeId,
  level: number,
  isBossTarget = false,
  vfxRecord?: VfxRecordingLog
) {
  const world = new WorldMap();
  const spawner = new WorldSpawner();
  spawner.reset();
  const colorSys = new ColorRestorationSystem();
  colorSys.reset();
  const inv = new InventorySystem();
  inv.resetStarterKit(classId);
  const quests = new QuestSystem();
  quests.reset();
  const combat = new CombatSystem();
  const itemEffects = new ItemEffectSystem();
  const player = makeTestPlayer(classId, level);

  if (biome === "meadow") {
    const enh = isBossTarget ? 1 : 0;
    const wpnKey = level <= 2 && !isBossTarget ? "starter_weapon" : "meadow_weapon";
    equipDefId(inv, resolveClassReward(classId, wpnKey), enh, classId);
    if (level >= 2 || isBossTarget) {
      equipDefId(inv, "hlm_meadow_crest", enh, classId);
      equipDefId(inv, "arm_meadow_mail", enh, classId);
      equipDefId(inv, "bts_meadow_strider", enh, classId);
      equipDefId(inv, "rng_breeze", enh, classId);
    } else {
      equipDefId(inv, "rng_copper", 0, classId);
    }
  } else if (biome === "quartz") {
    equipDefId(inv, resolveClassReward(classId, "quartz_weapon"), 1, classId);
    equipDefId(inv, "hlm_quartz_visor", 1, classId);
    equipDefId(inv, "arm_quartz_plate", 1, classId);
    equipDefId(inv, "bts_quartz_greaves", 1, classId);
    equipDefId(inv, "rng_quartz_eye", 1, classId);
  } else if (biome === "amber") {
    equipDefId(inv, resolveClassReward(classId, "amber_weapon"), 2, classId);
    equipDefId(inv, "hlm_amber_crown", 2, classId);
    equipDefId(inv, "arm_amber_aegis", 2, classId);
    equipDefId(inv, "bts_amber_treads", 2, classId);
    equipDefId(inv, "rng_amber_heart", 2, classId);
  } else {
    equipDefId(inv, resolveClassReward(classId, "ruins_weapon"), 2, classId);
    equipDefId(inv, "hlm_prism_halo", 2, classId);
    equipDefId(inv, "arm_prism_mantle", 2, classId);
    equipDefId(inv, "bts_void_walkers", 2, classId);
    equipDefId(inv, "rng_spectrum", 2, classId);
  }

  recalculatePlayerStats(player, inv, false);

  const projectiles: ProjectileEntity[] = [];
  const turrets: TurretEntity[] = [];
  const hazards: HazardEntity[] = [];
  let bossLock: ActiveBossLock | null = null;
  let defeatedCount = 0;

  const ctx: CombatContext = {
    player,
    world,
    spawner,
    vfx: makeRecordingVfx(vfxRecord),
    colorSys,
    inv,
    quests,
    itemEffects,
    projectiles,
    turrets,
    hazards,
    addShake: () => {},
    addHitstop: () => {},
    notify: () => {},
    onGainXp: (amt) => {
      player.xp += amt;
    },
    getBossLock: () => bossLock,
    onBossLockTrigger: (boss) => {
      const arena = BOSS_ARENAS[boss.defId];
      if (!arena) return;
      bossLock = {
        bossUid: boss.uid,
        bossDefId: boss.defId,
        bossName: ENEMIES[boss.defId]?.name ?? boss.defId,
        cx: arena.cx,
        cy: arena.cy,
        radius: arena.radius,
      };
    },
    onBossDefeated: () => {
      bossLock = null;
    },
    onPlayerDefeated: () => {
      defeatedCount += 1;
      bossLock = null;
    },
    stats: { kills: 0, mined: 0, chestsOpened: 0, bossesDefeated: 0, reactionsTriggered: 0 },
  };

  return { ctx, combat, world, spawner, inv, player, itemEffects, getDefeatedCount: () => defeatedCount };
}

function spawnSimulatedEnemy(spawner: WorldSpawner, x: number, y: number, defId: string, useRealHp = true): EnemyEntity {
  const edef = ENEMIES[defId];
  assert.ok(edef, `Unknown EnemyDef '${defId}'`);
  const hp = useRealHp ? edef.maxHp : 5000;
  const e: EnemyEntity = {
    uid: Math.floor(Math.random() * 1e9),
    defId,
    campId: "test_camp",
    biome: edef.biome,
    x,
    y,
    homeX: x,
    homeY: y,
    vx: 0,
    vy: 0,
    facing: 1,
    facingDir: "left",
    radius: edef.radius,
    hp,
    maxHp: hp,
    atk: edef.atk,
    def: edef.def,
    spd: edef.spd,
    level: edef.level,
    isBoss: !!edef.isBoss,
    isWorldBoss: !!edef.isWorldBoss,
    state: "aggro",
    patrolTargetX: x,
    patrolTargetY: y,
    patrolWait: 1,
    aiTimer: 10,
    specialTimer: 10,
    phase: 1,
    hitFlash: 0,
    walkTime: 0,
    animKind: "idle",
    animTime: 0,
    animDuration: 0.4,
    animAngle: 0,
    animImpactDone: false,
    dashVx: 0,
    dashVy: 0,
    dashTime: 0,
    guardTime: 0,
    skillCycle: 0,
    element: null,
    elementTime: 0,
    reactionIcd: 0,
    burnTime: 0,
    burnTick: 0,
    slowTime: 0,
    poisonTime: 0,
    poisonTick: 0,
    rootTime: 0,
    stunTime: 0,
    vulnTime: 0,
    critVulnTime: 0,
    normalAmpTime: 0,
    disruptTime: 0,
    blightDecayTime: 0,
    chromaSlowBonusTime: 0,
    enrageBuffTime: 0,
    bleachShield: edef.bleachShield ?? 0,
    maxBleachShield: edef.bleachShield ?? 0,
    totemChannelTimer: 0,
  };
  spawner.enemies.push(e);
  return e;
}

// ============================================================================
// 5. COMPOSABLE RECORD & BATCH VALIDATORS (SHARED BY POSITIVE + NEGATIVE TESTS)
// ============================================================================
function assertValidVfxKey(key: string, label: string) {
  assert.ok(
    Boolean(PIXELFX_MODS[key] || ATLAS_PRESETS[key]),
    `${label} references valid PIXELFX_MODS or ATLAS_PRESETS key (got '${key}')`
  );
}

export function validateItemRecord(
  item: ItemDef,
  opts: {
    strictBaseline?: boolean;
    allowNegativeTradeoff?: boolean;
    requireSpriteKey?: boolean;
    frames?: Record<string, unknown>;
    skillsMap?: Record<string, WeaponSkillDef>;
  } = {}
) {
  const frames = opts.frames ?? iconFrames;
  const skillsMap = opts.skillsMap ?? WEAPON_SKILLS;
  const strict = Boolean(opts.strictBaseline);

  assert.ok(item.id && item.id.trim().length > 0, "Item id must be non-empty");
  assert.ok(
    Number.isFinite(item.sellPrice) && item.sellPrice >= 0,
    `Item '${item.id}' sellPrice must be finite >= 0 (got ${item.sellPrice})`
  );
  if (item.buyPrice !== undefined) {
    assert.ok(
      Number.isFinite(item.buyPrice) && item.buyPrice >= item.sellPrice,
      `Item '${item.id}' buyPrice (${item.buyPrice}) must be finite >= sellPrice (${item.sellPrice})`
    );
  }
  if (item.hiddenDropChance !== undefined) {
    assert.ok(
      Number.isFinite(item.hiddenDropChance) && item.hiddenDropChance >= 0 && item.hiddenDropChance <= 1,
      `Item '${item.id}' hiddenDropChance must be in [0, 1]`
    );
  }
  if (item.passive?.cooldownSec !== undefined) {
    assert.ok(
      Number.isFinite(item.passive.cooldownSec) && item.passive.cooldownSec > 0,
      `Item '${item.id}' passive.cooldownSec must be finite > 0 (got ${item.passive.cooldownSec})`
    );
  }

  if (opts.requireSpriteKey) {
    assert.ok(item.spriteKey && item.spriteKey.trim().length > 0, `Batch item '${item.id}' must define spriteKey`);
  }
  if (item.spriteKey && !item.spritesheetCell) {
    assert.ok(frames[item.spriteKey], `Item '${item.id}' spriteKey '${item.spriteKey}' must exist in codixel-icons.json`);
  }

  if (item.baseStats) {
    for (const [k, raw] of Object.entries(item.baseStats)) {
      if (raw === undefined) continue;
      assert.ok(Number.isFinite(raw), `Item '${item.id}' baseStats.${k} must be finite (got ${raw})`);
    }
    for (const k of CORE_NON_NEGATIVE_STAT_KEYS) {
      const val: number | undefined = item.baseStats[k];
      if (val !== undefined) {
        assert.ok(val >= 0, `Item '${item.id}' baseStats.${k} must be >= 0 (got ${val})`);
      }
    }
    if (item.baseStats.skillCdPct !== undefined) {
      assert.ok(
        item.baseStats.skillCdPct >= -40 && item.baseStats.skillCdPct <= 0,
        `Item '${item.id}' skillCdPct must be in [-40, 0] (got ${item.baseStats.skillCdPct})`
      );
    }
    if (item.baseStats.staminaCostPct !== undefined) {
      assert.ok(
        item.baseStats.staminaCostPct >= -45 && item.baseStats.staminaCostPct <= 0,
        `Item '${item.id}' staminaCostPct must be in [-45, 0] (got ${item.baseStats.staminaCostPct})`
      );
    }
    if (item.baseStats.def !== undefined && item.baseStats.def < 0) {
      const allowedBaseline = !strict && (BASELINE_NEGATIVE_DEF_ALLOWLIST.has(item.id) || item.rarity === "cursed");
      assert.ok(
        opts.allowNegativeTradeoff || allowedBaseline,
        `Item '${item.id}' has negative def (${item.baseStats.def}) without allowNegativeTradeoff`
      );
    }
    if (item.baseStats.moveSpeedPct !== undefined && item.baseStats.moveSpeedPct < 0) {
      const allowedBaseline = !strict && BASELINE_NEGATIVE_MOVESPD_ALLOWLIST.has(item.id);
      assert.ok(
        opts.allowNegativeTradeoff || allowedBaseline,
        `Item '${item.id}' has negative moveSpeedPct (${item.baseStats.moveSpeedPct}) without allowNegativeTradeoff`
      );
    }
  }

  if (item.category === "equipment" && item.slot === "weapon") {
    assert.ok(
      item.requiredClass && item.requiredClass !== "all",
      `Weapon '${item.id}' must specify a single requiredClass (got '${item.requiredClass}')`
    );
    const resolvedSkillId = item.weaponSkillId ?? getWeaponSkillId(item.id);
    assert.ok(
      resolvedSkillId && skillsMap[resolvedSkillId],
      `Weapon '${item.id}' must resolve to a registered WeaponSkillDef (got '${resolvedSkillId}')`
    );
  }
}

export function validateWeaponSkillRecord(
  ws: WeaponSkillDef,
  opts: { strictBaseline?: boolean; frames?: Record<string, unknown>; batchStrict?: boolean } = {}
) {
  const frames = opts.frames ?? iconFrames;
  const maxCd = !opts.batchStrict && !opts.strictBaseline && BASELINE_COOLDOWN_OUTLIERS.has(ws.id) ? 6.6 : 6.5;
  assert.ok(
    Number.isFinite(ws.cooldown) && ws.cooldown >= 4.2 && ws.cooldown <= maxCd,
    `WeaponSkill '${ws.id}' cooldown must be in [4.2, ${maxCd}] (got ${ws.cooldown})`
  );
  if (ws.staminaCost !== undefined) {
    assert.ok(Number.isFinite(ws.staminaCost) && ws.staminaCost >= 0, `WeaponSkill '${ws.id}' staminaCost must be finite >= 0`);
  }
  assert.ok(
    ws.iconKey && frames[ws.iconKey],
    `WeaponSkill '${ws.id}' iconKey '${ws.iconKey}' must exist in codixel-icons.json`
  );
}

export function validateEnemyRecord(
  edef: EnemyDef,
  opts: {
    dropTables?: Record<string, EnemyDropTable>;
    camps?: typeof WORLD_CAMPS;
    monstersMeta?: Record<string, { w: number; h: number; floating: boolean }>;
    framesMeta?: Record<string, { x: number; y: number; w: number; h: number; anchorY: number }>;
  } = {}
) {
  const dropTables = opts.dropTables ?? ENEMY_DROP_TABLES;
  const camps = opts.camps ?? WORLD_CAMPS;
  const monstersMeta = opts.monstersMeta ?? enemyMonsters;
  const framesMeta = opts.framesMeta ?? enemyFrames;

  assert.ok(edef.biome !== "town", `Enemy '${edef.id}' cannot belong to town biome`);
  const bounds = BIOME_LEVEL_BOUNDS[edef.biome as keyof typeof BIOME_LEVEL_BOUNDS];
  assert.ok(bounds, `Enemy '${edef.id}' has unknown biome '${edef.biome}'`);
  assert.ok(
    Number.isFinite(edef.level) && edef.level >= bounds[0] && edef.level <= bounds[1],
    `Enemy '${edef.id}' level ${edef.level} out of bounds [${bounds[0]}, ${bounds[1]}] for biome '${edef.biome}'`
  );
  assert.ok(Number.isFinite(edef.maxHp) && edef.maxHp > 0, `Enemy '${edef.id}' maxHp must be > 0`);
  assert.ok(Number.isFinite(edef.atk) && edef.atk > 0, `Enemy '${edef.id}' atk must be > 0`);
  assert.ok(Number.isFinite(edef.def) && edef.def >= 0 && edef.def <= 50, `Enemy '${edef.id}' def ${edef.def} must be in [0, 50]`);
  assert.ok(Number.isFinite(edef.spd) && edef.spd >= 40 && edef.spd <= 92, `Enemy '${edef.id}' spd ${edef.spd} must be in [40, 92]`);
  assert.ok(Number.isFinite(edef.radius) && edef.radius > 0, `Enemy '${edef.id}' radius must be > 0`);
  assert.ok(Number.isFinite(edef.aggroRadius) && edef.aggroRadius > 0, `Enemy '${edef.id}' aggroRadius must be > 0`);
  assert.ok(
    Number.isFinite(edef.leashRadius) && edef.leashRadius >= edef.aggroRadius + 80,
    `Enemy '${edef.id}' leashRadius (${edef.leashRadius}) must be >= aggroRadius + 80 (${edef.aggroRadius + 80})`
  );
  assert.ok(Number.isFinite(edef.xp) && edef.xp > 0, `Enemy '${edef.id}' xp must be > 0`);
  assert.ok(
    Number.isFinite(edef.gold[0]) && Number.isFinite(edef.gold[1]) && edef.gold[0] >= 0 && edef.gold[1] >= edef.gold[0],
    `Enemy '${edef.id}' gold range [${edef.gold[0]}, ${edef.gold[1]}] invalid`
  );
  assert.ok(
    Number.isFinite(edef.equipDropChance) && edef.equipDropChance >= 0 && edef.equipDropChance <= 1,
    `Enemy '${edef.id}' equipDropChance must be in [0, 1]`
  );

  // Anti-invulnerability check (base & enraged)
  const baseDefMult = 100 / (100 + edef.def * 2.8);
  const enragedDefMult = 100 / (100 + edef.def * 1.25 * 2.8);
  assert.ok(baseDefMult >= 0.25 && enragedDefMult >= 0.25, `Enemy '${edef.id}' defMult violates >= 0.25 floor`);

  // Drop table & camp presence
  const tbl = dropTables[edef.id];
  assert.ok(tbl, `Enemy '${edef.id}' missing ENEMY_DROP_TABLES entry`);
  validateDropTableRecord(edef.id, tbl, ITEMS);
  assert.ok(
    camps.some((c) => c.enemies.some((en) => en.typeId === edef.id && en.count >= 1)),
    `Enemy '${edef.id}' must spawn in at least one WORLD_CAMPS entry`
  );

  // 16-frame directional atlas completeness
  const mon = monstersMeta[edef.id];
  assert.ok(mon && mon.w > 0 && mon.h > 0, `Enemy '${edef.id}' missing monsters entry in codixel-enemies.json`);
  for (const dir of ["front", "back", "left", "right"] as const) {
    for (const suffix of ["", ":1", ":2", ":atk"] as const) {
      const fKey = `${edef.id}:${dir}${suffix}`;
      const f = framesMeta[fKey];
      assert.ok(
        f && f.w === mon.w && f.h === mon.h && f.anchorY === f.h,
        `Enemy '${edef.id}' frame '${fKey}' missing or invalid dimensions/anchorY`
      );
    }
  }
}

export function validateDropTableRecord(enemyId: string, tbl: EnemyDropTable, itemsMap: Record<string, ItemDef>) {
  const allEntries = [...(tbl.guaranteed ?? []), ...tbl.rolls];
  assert.ok(allEntries.length > 0, `Drop table for '${enemyId}' must not be empty`);
  for (const entry of allEntries) {
    const itemDef = itemsMap[entry.itemId];
    assert.ok(itemDef, `Drop table '${enemyId}' references missing item '${entry.itemId}'`);
    assert.ok(!itemDef.isHidden && !itemDef.seasonalBannerId, `Drop table '${enemyId}' leaks hidden/seasonal item '${entry.itemId}'`);
    assert.ok(
      Number.isFinite(entry.chance) && entry.chance >= 0 && entry.chance <= 1,
      `Drop table '${enemyId}' entry '${entry.itemId}' chance (${entry.chance}) must be in [0, 1]`
    );
    const minQ = entry.minQty ?? 1;
    const maxQ = entry.maxQty ?? minQ;
    assert.ok(Number.isFinite(minQ) && Number.isFinite(maxQ) && minQ >= 1 && maxQ >= minQ, `Drop table '${enemyId}' entry '${entry.itemId}' invalid qty range [${minQ}, ${maxQ}]`);
  }
}

export function validateEnemyHazardDelay(hz: Pick<HazardEntity, "owner" | "kind" | "delay" | "damage">) {
  assert.ok(Number.isFinite(hz.damage) && hz.damage >= 0, `Hazard '${hz.kind}' damage must be finite >= 0`);
  if (hz.owner === "enemy" && !CONTINUOUS_POOL_HAZARD_KINDS.has(hz.kind)) {
    assert.ok(
      Number.isFinite(hz.delay) && hz.delay >= 0.5,
      `Telegraphed enemy hazard '${hz.kind}' delay (${hz.delay}) must be >= 0.50s`
    );
  }
}

export interface EvalPlayerBuild {
  classId: ClassId;
  level: number;
  maxHp: number;
  def: number;
}

export function validateRuntimeEnemyHitDamage(
  edef: EnemyDef,
  rawHitDamage: number,
  playerBuilds: readonly EvalPlayerBuild[],
  label = edef.id
) {
  assert.ok(
    Number.isFinite(rawHitDamage) && rawHitDamage >= 0,
    `Enemy '${label}' runtime hit damage must be finite >= 0 (got ${rawHitDamage})`
  );
  const maxMult = edef.id === "boss_the_eraser" ? 1.75 : 1.35;
  const maxAllowedRaw = Math.round(edef.atk * maxMult);
  assert.ok(
    rawHitDamage <= maxAllowedRaw,
    `Enemy '${label}' runtime raw hit (${rawHitDamage}) exceeds ${maxMult}x atk (${maxAllowedRaw})`
  );
  for (const pb of playerBuilds) {
    const gap = edef.level - pb.level;
    const threatMult = gap > 1 ? 1 + Math.min(1.1, (gap - 1) * 0.14) : 1.0;
    const pDefMult = 100 / (100 + Math.max(0, pb.def) * 2.0);
    const mitigated = rawHitDamage <= 0 ? 0 : Math.max(2, Math.round(rawHitDamage * threatMult * pDefMult));
    assert.ok(
      mitigated < pb.maxHp * 0.65,
      `1-shot risk (runtime): ${label} mitigated hit (${mitigated} from raw ${rawHitDamage}) >= 65% of ${pb.classId} Lv.${pb.level} maxHp (${pb.maxHp})`
    );
  }
}

export function validateForgeRecipes(
  recipes: readonly RecipeDef[],
  itemsMap: Record<string, ItemDef> = ITEMS
) {
  for (const rec of recipes) {
    const def = itemsMap[rec.resultDefId];
    assert.ok(def, `FORGE_RECIPES '${rec.id}' references missing resultDefId '${rec.resultDefId}'`);
    assert.ok(
      !def.dropOnly && !def.seasonalBannerId,
      `FORGE_RECIPES '${rec.id}' leaks restricted item '${rec.resultDefId}' (dropOnly=${Boolean(def.dropOnly)}, seasonalBannerId=${def.seasonalBannerId ?? "none"})`
    );
  }
}

export function validateBatchItemsSpec(
  batchItems: BatchItemSpec[],
  itemsMap: Record<string, ItemDef> = ITEMS,
  skillsMap: Record<string, WeaponSkillDef> = WEAPON_SKILLS,
  frames: Record<string, unknown> = iconFrames
) {
  const seenIds = new Set<string>();
  const seenSprites = new Set<string>();
  const seenWeaponSkills = new Set<string>();
  const seenPassives = new Set<string>();
  const seenVfx = new Set<string>();

  for (const spec of batchItems) {
    assert.ok(!seenIds.has(spec.id), `Duplicate batch item id '${spec.id}'`);
    seenIds.add(spec.id);

    const def = itemsMap[spec.id];
    assert.ok(def, `Batch item '${spec.id}' missing in ITEMS`);

    if (spec.spriteKey && def.spriteKey) {
      assert.equal(
        spec.spriteKey,
        def.spriteKey,
        `Batch item '${spec.id}' spec.spriteKey ('${spec.spriteKey}') mismatches ITEMS.spriteKey ('${def.spriteKey}')`
      );
    }
    const resolvedSprite = def.spriteKey ?? spec.spriteKey;
    assert.ok(resolvedSprite && resolvedSprite.trim().length > 0, `Batch item '${spec.id}' must define a non-empty spriteKey`);
    assert.ok(frames[resolvedSprite], `Batch item '${spec.id}' spriteKey '${resolvedSprite}' missing in codixel-icons.json`);
    assert.ok(!seenSprites.has(resolvedSprite), `Duplicate batch item spriteKey '${resolvedSprite}' on '${spec.id}'`);
    seenSprites.add(resolvedSprite);

    validateItemRecord(
      { ...def, spriteKey: resolvedSprite },
      {
        strictBaseline: true,
        allowNegativeTradeoff: spec.allowNegativeTradeoff,
        requireSpriteKey: true,
        frames,
        skillsMap,
      }
    );

    const isWeapon = (spec.slot ?? def.slot) === "weapon" || def.slot === "weapon";
    if (isWeapon) {
      const runtimeWsId = (def.weaponSkillId ?? getWeaponSkillId(def.id)) as string | null;
      if (spec.weaponSkillId && runtimeWsId) {
        assert.equal(
          spec.weaponSkillId,
          runtimeWsId,
          `Batch weapon '${spec.id}' spec.weaponSkillId ('${spec.weaponSkillId}') mismatches ITEMS/WEAPON_TO_SKILL_MAP ('${runtimeWsId}')`
        );
      }
      const wsId = (runtimeWsId ?? spec.weaponSkillId) as string | null;
      assert.ok(wsId && skillsMap[wsId], `Batch weapon '${spec.id}' missing valid weaponSkillId '${wsId}'`);
      assert.ok(!seenWeaponSkills.has(wsId), `Duplicate batch weaponSkillId '${wsId}' on '${spec.id}'`);
      seenWeaponSkills.add(wsId);
      validateWeaponSkillRecord(skillsMap[wsId], { batchStrict: true, frames });
    }

    const runtimePassiveIds = Array.from(
      new Set([def.passiveId, def.passive?.id, def.exoticModId].filter((v): v is string => Boolean(v && v.trim())))
    );
    if (spec.passiveId && runtimePassiveIds.length > 0) {
      assert.ok(
        runtimePassiveIds.includes(spec.passiveId),
        `Batch item '${spec.id}' spec.passiveId ('${spec.passiveId}') mismatches item passive/mod ids [${runtimePassiveIds.join(", ")}]`
      );
    }
    const allPassiveIds = new Set<string>(runtimePassiveIds);
    if (spec.passiveId && runtimePassiveIds.length === 0) {
      allPassiveIds.add(spec.passiveId);
    }
    for (const pid of allPassiveIds) {
      assert.ok(!seenPassives.has(pid), `Duplicate batch passive/mod id '${pid}' on '${spec.id}'`);
      seenPassives.add(pid);
    }

    for (const vfxId of spec.vfxIds ?? []) {
      assertValidVfxKey(vfxId, `Batch item '${spec.id}'`);
      assert.ok(!seenVfx.has(vfxId), `Duplicate batch item vfxId '${vfxId}' on '${spec.id}'`);
      seenVfx.add(vfxId);
    }
  }
}

export function validateBatchMobsSpec(
  batchMobs: BatchMobSpec[],
  enemiesMap: Record<string, EnemyDef> = ENEMIES,
  dropTablesMap: Record<string, EnemyDropTable> = ENEMY_DROP_TABLES,
  campsList: typeof WORLD_CAMPS = WORLD_CAMPS,
  enemiesMeta: { monsters: typeof enemyMonsters; frames: typeof enemyFrames } = {
    monsters: enemyMonsters,
    frames: enemyFrames,
  }
) {
  const seenIds = new Set<string>();
  const seenAnimSignatures = new Set<string>();
  const seenVfx = new Set<string>();

  for (const spec of batchMobs) {
    assert.ok(!seenIds.has(spec.id), `Duplicate batch mob id '${spec.id}'`);
    seenIds.add(spec.id);

    const edef = enemiesMap[spec.id];
    assert.ok(edef, `Batch mob '${spec.id}' missing in ENEMIES`);
    validateEnemyRecord(edef, {
      dropTables: dropTablesMap,
      camps: campsList,
      monstersMeta: enemiesMeta.monsters,
      framesMeta: enemiesMeta.frames,
    });

    const distinctAnims = Array.from(new Set(spec.animKinds.filter((a) => a && a !== "idle"))).sort();
    assert.ok(
      distinctAnims.length >= 2,
      `Batch mob '${spec.id}' must declare >= 2 distinct non-idle animKinds (got ${distinctAnims.length})`
    );
    if (spec.skillCount !== undefined) {
      assert.ok(spec.skillCount >= 2, `Batch mob '${spec.id}' skillCount must be >= 2 (got ${spec.skillCount})`);
    }

    const sig = distinctAnims.join("|");
    assert.ok(
      !seenAnimSignatures.has(sig),
      `Duplicate batch mob animKinds signature '${sig}' on '${spec.id}'`
    );
    seenAnimSignatures.add(sig);

    for (const vfxId of spec.vfxIds ?? []) {
      assertValidVfxKey(vfxId, `Batch mob '${spec.id}'`);
      assert.ok(!seenVfx.has(vfxId), `Duplicate batch mob vfxId '${vfxId}' on '${spec.id}'`);
      seenVfx.add(vfxId);
    }
  }
}

// ============================================================================
// 6. MAIN VERIFICATION RUNNER
// ============================================================================
export function runBatchProductionVerification(batchSpec?: BatchProductionSpec): BatchVerificationReport {
  const summary: string[] = [];
  const warnings: string[] = [];
  let checksRun = 0;

  const log = (msg: string) => {
    summary.push(msg);
    if (batchSpec?.verbose) {
      console.log(`[batchVerify] ${msg}`);
    }
  };

  // --------------------------------------------------------------------------
  // SUITE A: Global Item, WeaponSkill, Shop & Random Pool Invariants
  // --------------------------------------------------------------------------
  const allItems = Object.values(ITEMS);
  for (const item of allItems) {
    validateItemRecord(item, { strictBaseline: batchSpec?.strictBaseline });
    checksRun++;
  }

  const allSkills = Object.values(WEAPON_SKILLS);
  for (const ws of allSkills) {
    validateWeaponSkillRecord(ws, { strictBaseline: batchSpec?.strictBaseline });
    checksRun++;
  }

  for (const stockId of MERCHANT_STOCK) {
    const def = ITEMS[stockId];
    assert.ok(def, `MERCHANT_STOCK item '${stockId}' missing in ITEMS`);
    assert.ok(
      !def.isHidden && !def.dropOnly && !def.seasonalBannerId && def.rarity !== "cursed",
      `MERCHANT_STOCK leaks restricted item '${stockId}'`
    );
    checksRun++;
  }

  const nonCursedRarities: readonly Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];
  const testClasses: readonly (ClassId | undefined)[] = [undefined, "prism_knight", "chroma_mage", "bit_rogue", "pixel_tinker"];
  for (const r of nonCursedRarities) {
    for (let i = 0; i < 250; i++) {
      const pickedId = pickRandomEquipByRarity(r, testClasses[i % testClasses.length]);
      const picked = ITEMS[pickedId];
      assert.ok(picked, `pickRandomEquipByRarity('${r}') returned unknown item '${pickedId}'`);
      assert.ok(
        !picked.isHidden && !picked.dropOnly && !picked.seasonalBannerId && picked.rarity !== "cursed",
        `pickRandomEquipByRarity('${r}') leaked restricted item '${pickedId}'`
      );
      checksRun++;
    }
  }
  validateForgeRecipes(FORGE_RECIPES, ITEMS);
  checksRun += FORGE_RECIPES.length;
  log(`Suite A PASS: ${allItems.length} ITEMS, ${allSkills.length} WEAPON_SKILLS, ${MERCHANT_STOCK.length} MERCHANT_STOCK, ${FORGE_RECIPES.length} FORGE_RECIPES, 1250 random equip rolls.`);

  // --------------------------------------------------------------------------
  // SUITE B: Global Enemy, Drop Table, World Camps & 16-Frame Atlas Invariants
  // --------------------------------------------------------------------------
  const allEnemies = Object.values(ENEMIES);
  for (const edef of allEnemies) {
    validateEnemyRecord(edef);
    checksRun++;
  }

  const world = new WorldMap();
  for (const camp of WORLD_CAMPS) {
    assert.ok(camp.enemies.length > 0, `Camp '${camp.id}' has no enemies`);
    assert.ok(camp.respawnSec > 0 && Number.isFinite(camp.respawnSec), `Camp '${camp.id}' invalid respawnSec`);
    assert.equal(getBiomeAtTile(camp.tx, camp.ty), camp.biome, `Camp '${camp.id}' biome mismatch at (${camp.tx},${camp.ty})`);
    const inTown =
      camp.tx >= TOWN_BOUNDS.x0 && camp.tx <= TOWN_BOUNDS.x1 && camp.ty >= TOWN_BOUNDS.y0 && camp.ty <= TOWN_BOUNDS.y1;
    assert.equal(inTown, false, `Camp '${camp.id}' cannot spawn inside TOWN_BOUNDS`);
    assert.equal(
      world.isBlocked(camp.tx * TILE_SIZE + 8, camp.ty * TILE_SIZE + 8, 4),
      false,
      `Camp '${camp.id}' must sit on walkable tile`
    );
    for (const ce of camp.enemies) {
      assert.ok(ENEMIES[ce.typeId], `Camp '${camp.id}' references unknown enemy '${ce.typeId}'`);
      assert.ok(ce.count >= 1, `Camp '${camp.id}' enemy '${ce.typeId}' count must be >= 1`);
    }
    checksRun++;
  }
  log(`Suite B PASS: ${allEnemies.length} ENEMIES (16-frame atlases & drop tables), ${WORLD_CAMPS.length} walkable WORLD_CAMPS.`);

  // --------------------------------------------------------------------------
  // SUITE C: Simulated TTK, Survivability & Headless Mob AI Execution
  // --------------------------------------------------------------------------
  const evalClasses: readonly ClassId[] = ["prism_knight", "bit_rogue"];
  for (const edef of allEnemies) {
    const testLv = edef.isBoss ? Math.max(5, edef.level) : edef.level;
    const evalPlayerBuilds: EvalPlayerBuild[] = [];

    // 1. Survivability across tankiest & squishiest calibrated classes
    for (const cid of evalClasses) {
      const h = makeBiomeCalibratedHarness(cid, edef.biome, testLv, Boolean(edef.isBoss));
      evalPlayerBuilds.push({
        classId: cid,
        level: h.player.level,
        maxHp: h.player.maxHp,
        def: h.player.def,
      });
      const pDefMult = 100 / (100 + Math.max(0, h.player.def) * 2.0);
      assert.ok(
        pDefMult >= 0.25,
        `Calibrated ${cid} in ${edef.biome} Lv.${testLv} has playerDefMult=${pDefMult.toFixed(3)} < 0.25 (invulnerability risk)`
      );

      const gap = edef.level - h.player.level;
      const threatMult = gap > 1 ? 1 + Math.min(1.1, (gap - 1) * 0.14) : 1.0;
      const worstRawHit = Math.round(edef.atk * (edef.id === "boss_the_eraser" ? 1.75 : 1.35));
      const worstMitigated = Math.max(2, Math.round(worstRawHit * threatMult * pDefMult));
      assert.ok(
        worstMitigated < h.player.maxHp * 0.65,
        `1-shot risk: ${edef.id} worst hit (${worstMitigated}) >= 65% of ${cid} Lv.${testLv} maxHp (${h.player.maxHp})`
      );

      // Verify actual CombatSystem.damagePlayer produces finite integer HP
      const hpBefore = h.player.hp;
      h.player.invuln = 0;
      h.combat.damagePlayer(h.ctx, edef.atk, h.player.x + 20, h.player.y, false, edef.level);
      assert.ok(Number.isFinite(h.player.hp) && h.player.hp < hpBefore, `damagePlayer failed or produced NaN for ${edef.id}`);
      checksRun++;
    }

    // 2. Headless CombatSystem LMB TTK verification
    {
      const h = makeBiomeCalibratedHarness("prism_knight", edef.biome, testLv, Boolean(edef.isBoss));
      const biomeCamp = WORLD_CAMPS.find((c) => c.biome === edef.biome);
      if (biomeCamp) {
        h.player.x = biomeCamp.tx * TILE_SIZE + 8;
        h.player.y = biomeCamp.ty * TILE_SIZE + 8;
      }
      h.spawner.enemies.length = 0;
      const target = spawnSimulatedEnemy(h.spawner, h.player.x + 22, h.player.y, edef.id, true);
      h.player.aimAngle = 0;
      h.player.facing = 1;
      h.player.facingDir = "right";

      const dt = 0.05;
      let elapsed = 0;
      while (target.hp > 0 && elapsed < 90) {
        h.player.hp = h.player.maxHp; // Isolate offensive TTK from healing/death loop
        target.aiTimer = 999;
        target.specialTimer = 999;
        target.homeX = target.x;
        target.homeY = target.y;
        const dx = target.x - h.player.x;
        const dy = target.y - h.player.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.01) {
          h.player.aimAngle = Math.atan2(dy, dx);
          h.player.facing = dx >= 0 ? 1 : -1;
          h.player.facingDir = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "right" : "left") : dy >= 0 ? "down" : "up";
          if (dist > 26) {
            h.world.moveWithCollision(
              h.player,
              (dx / dist) * h.player.spd * dt,
              (dy / dist) * h.player.spd * dt,
              h.player.radius
            );
          }
        }
        if (h.player.atkCd <= 0) {
          h.combat.performPrimaryAttack(h.ctx);
        }
        h.combat.update(h.ctx, dt);
        h.player.atkCd = Math.max(0, h.player.atkCd - dt);
        h.player.skillCd = Math.max(0, h.player.skillCd - dt);
        h.player.invuln = Math.max(0, h.player.invuln - dt);
        elapsed += dt;
        assert.ok(Number.isFinite(target.hp) && Number.isFinite(h.player.hp), `NaN HP during TTK simulation vs ${edef.id}`);
      }

      assert.ok(target.hp <= 0, `TTK simulation timed out (>90s) against ${edef.id} (remaining HP ${target.hp}/${target.maxHp})`);
      const isMiniBoss = edef.ai.startsWith("mini_");
      const [minTtk, maxTtk] = edef.isBoss ? [4.0, 75.0] : isMiniBoss ? [0.8, 30.0] : [0.2, 15.0];
      assert.ok(
        elapsed >= minTtk && elapsed <= maxTtk,
        `${edef.id} LMB TTK (${elapsed.toFixed(2)}s) outside bracket [${minTtk}s, ${maxTtk}s]`
      );
      checksRun++;
    }

    // 3. Headless Mob AI & Skill Cycle Execution (3 cycles + boss specials + runtime damage checks)
    {
      const vfxRec: VfxRecordingLog = { live: [], pooled: [] };
      const h = makeBiomeCalibratedHarness("prism_knight", edef.biome, testLv, Boolean(edef.isBoss), vfxRec);
      h.spawner.enemies.length = 0;
      const spawnDist = Math.max(30, edef.radius + h.player.radius + 8);
      const e = spawnSimulatedEnemy(h.spawner, h.player.x + spawnDist, h.player.y, edef.id, false);
      const knightBuild = evalPlayerBuilds.find((pb) => pb.classId === "prism_knight")!;
      const knightGap = edef.level - knightBuild.level;
      const knightThreatMult = knightGap > 1 ? 1 + Math.min(1.1, (knightGap - 1) * 0.14) : 1.0;
      const knightDefMult = 100 / (100 + Math.max(0, knightBuild.def) * 2.0);
      const maxMult = edef.id === "boss_the_eraser" ? 1.75 : 1.35;
      const maxKnightMitigated = Math.max(2, Math.round(Math.round(edef.atk * maxMult) * knightThreatMult * knightDefMult));

      const cyclesToRun = edef.isBoss ? 4 : 3;
      for (let c = 0; c < cyclesToRun; c++) {
        h.ctx.projectiles.length = 0;
        h.ctx.hazards.length = 0;
        e.x = h.player.x + spawnDist;
        e.y = h.player.y;
        e.homeX = e.x;
        e.homeY = e.y;
        e.animTime = 0;
        e.dashTime = 0;
        e.stunTime = 0;
        e.rootTime = 0;
        e.aiTimer = 0.01;
        e.specialTimer = edef.isBoss && c >= 2 ? 0.01 : 5.0;
        if (edef.isBoss && c >= 2) {
          e.aiTimer = 5.0;
        }
        h.player.hp = h.player.maxHp;
        h.player.invuln = 0;

        h.combat.update(h.ctx, 0.05);

        const hpLost = h.player.maxHp - h.player.hp;
        assert.ok(
          hpLost < h.player.maxHp * 0.65,
          `1-shot risk (runtime direct hit): ${edef.id} cycle ${c} dealt ${hpLost} >= 65% of player maxHp (${h.player.maxHp})`
        );
        if (hpLost > 0) {
          assert.ok(
            hpLost <= maxKnightMitigated,
            `Runtime direct hit on prism_knight: ${edef.id} cycle ${c} dealt ${hpLost} > max expected ${maxKnightMitigated}`
          );
          if (hpLost > 2) {
            const inferredRaw = Math.floor(hpLost / Math.max(0.01, knightThreatMult * knightDefMult));
            validateRuntimeEnemyHitDamage(
              edef,
              inferredRaw,
              evalPlayerBuilds,
              `${edef.id} runtime direct hit (cycle ${c})`
            );
          }
        }

        h.player.hp = h.player.maxHp;
        h.player.invuln = 0;

        assert.notEqual(e.animKind, "idle", `${edef.id} cycle ${c} failed to enter an active EnemyAnimKind`);
        if (!edef.isBoss) {
          assert.ok(
            e.aiTimer >= 1.4 && e.aiTimer <= 3.2,
            `${edef.id} cycle ${c} aiTimer (${e.aiTimer}) outside [1.4, 3.2]`
          );
        }
        for (const p of h.ctx.projectiles) {
          if (p.owner === "enemy") {
            assert.ok(ATLAS_PRESETS[p.preset], `${edef.id} projectile preset '${p.preset}' missing in ATLAS_PRESETS`);
            validateRuntimeEnemyHitDamage(edef, p.damage, evalPlayerBuilds, `${edef.id} projectile '${p.preset}'`);
          }
        }
        for (const hz of h.ctx.hazards) {
          validateEnemyHazardDelay(hz);
          if (hz.owner === "enemy") {
            validateRuntimeEnemyHitDamage(edef, hz.damage, evalPlayerBuilds, `${edef.id} hazard '${hz.kind}'`);
          }
        }
      }

      for (const call of vfxRec.live) {
        assert.ok(PIXELFX_MODS[call.modId], `${edef.id} live VFX '${call.modId}' missing in PIXELFX_MODS`);
      }
      for (const call of vfxRec.pooled) {
        assert.ok(ATLAS_PRESETS[call.modId], `${edef.id} pooled VFX '${call.modId}' missing in ATLAS_PRESETS`);
      }
      checksRun++;
    }
  }
  log(`Suite C PASS: ${allEnemies.length} ENEMIES verified for survivability, runtime anti-1-shot, TTK, AI cycles, hazard telegraphs & VFX presets.`);

  // --------------------------------------------------------------------------
  // SUITE D: Batch Uniqueness & Functional Integration (if batchSpec provided)
  // --------------------------------------------------------------------------
  const batchItems = batchSpec?.items ?? [];
  const batchMobs = batchSpec?.mobs ?? [];

  if (batchItems.length > 0) {
    validateBatchItemsSpec(batchItems, ITEMS, WEAPON_SKILLS, iconFrames);
    checksRun += batchItems.length;

    // Functional execution of every batch item
    for (const spec of batchItems) {
      const def = ITEMS[spec.id];
      const compatClass: ClassId =
        def.requiredClass && def.requiredClass !== "all" ? def.requiredClass : "prism_knight";
      const biome = def.biomeTheme && def.biomeTheme !== "town" ? def.biomeTheme : "meadow";
      const level = biome === "ruins" ? 18 : biome === "amber" ? 13 : biome === "quartz" ? 8 : 4;
      const vfxRec: VfxRecordingLog = { live: [], pooled: [] };
      const h = makeBiomeCalibratedHarness(compatClass, biome, level, false, vfxRec);

      if (def.category === "equipment") {
        equipDefId(h.inv, def.id, 0, compatClass);
        recalculatePlayerStats(h.player, h.inv, false);
        assert.ok(
          Number.isFinite(h.player.atk) &&
            Number.isFinite(h.player.maxHp) &&
            Number.isFinite(h.player.def) &&
            Number.isFinite(h.player.spd),
          `Batch item '${def.id}' caused non-finite stats after recalculatePlayerStats`
        );
      }

      if (def.slot === "weapon") {
        h.spawner.enemies.length = 0;
        const dummy = spawnSimulatedEnemy(h.spawner, h.player.x + 38, h.player.y, "quartz_stalker", false);
        const ws = getWeaponSkillForItem(def.id)!;
        const cdMult = Math.max(0.55, 1 + (h.player.skillCdPct || 0) / 100);
        const expectedCd = ws.cooldown * cdMult;
        const hpBefore = dummy.hp;
        const projBefore = h.ctx.projectiles.length;
        const hazBefore = h.ctx.hazards.length;
        const turBefore = h.ctx.turrets.length;

        h.player.skillCd = 0;
        h.player.aimAngle = 0;
        h.combat.performSkillE(h.ctx);
        assert.ok(
          h.player.skillCd > 0 && Math.abs(h.player.skillCd - expectedCd) < 0.05,
          `Batch weapon '${def.id}' [E] skillCd (${h.player.skillCd}) mismatch vs expected (${expectedCd.toFixed(2)})`
        );

        for (let tick = 0; tick < 35; tick++) {
          h.combat.update(h.ctx, 0.05);
        }

        const dmgDealt = hpBefore - dummy.hp;
        const spawnedAnything =
          h.ctx.projectiles.length > projBefore ||
          h.ctx.hazards.length > hazBefore ||
          h.ctx.turrets.length > turBefore ||
          h.player.shieldTime > 0;
        assert.ok(
          dmgDealt > 0 || spawnedAnything,
          `Batch weapon '${def.id}' [E] had zero observable combat effect`
        );

        const elemScale = 1 + Math.max(0, h.player.elementBonus || 0) / 100;
        const reactionAllowance = Math.round(h.player.atk * elemScale * 1.35);
        const maxAllowedBurst =
          Math.round(h.player.atk * elemScale * (spec.maxBurstMult ?? 3.2) * h.player.critMult) +
          reactionAllowance +
          45;
        assert.ok(
          dmgDealt <= maxAllowedBurst,
          `Batch weapon '${def.id}' [E] burst (${dmgDealt}) exceeded guardrail (${maxAllowedBurst})`
        );
      }

      // Exercise ItemEffectSystem / passive / exotic hooks cleanly + verify ICD engagement
      if (def.passive?.id || def.passiveId || def.exoticModId) {
        h.spawner.enemies.length = 0;
        const dummy = spawnSimulatedEnemy(h.spawner, h.player.x + 30, h.player.y, "quartz_stalker", false);
        if (def.slot !== "weapon" && def.exoticModId) {
          h.player.skillCd = 0;
          h.player.aimAngle = 0;
          h.combat.performSkillE(h.ctx);
        }
        h.combat.performPrimaryAttack(h.ctx);
        h.combat.damageEnemy(h.ctx, dummy, Math.max(10, h.player.atk), true, "hit-cyan", "prism");
        if (def.exoticModId === "mod_spring_bloom_heal") {
          h.combat.damageEnemy(h.ctx, dummy, Math.max(10, h.player.atk), false, "hit-fire", "fire");
          h.combat.damageEnemy(h.ctx, dummy, Math.max(10, h.player.atk), false, "hit-ice", "ice");
        }
        if (def.passive?.trigger === "onKill") {
          const killTarget = spawnSimulatedEnemy(h.spawner, h.player.x + 28, h.player.y, "null_slime", true);
          killTarget.hp = 1;
          h.combat.damageEnemy(h.ctx, killTarget, 999, true, "hit-cyan", "prism");
        }
        h.player.dashCd = 0;
        h.player.stamina = h.player.maxStamina;
        h.combat.performDash(h.ctx, 1, 0);
        h.player.invuln = 0;
        h.player.perfectDashWindow = 0;
        h.player.shieldTime = 0;
        h.player.dashing = 0;
        if (def.passive?.trigger === "onLowHp") {
          h.player.hp = Math.max(2, Math.floor(h.player.maxHp * 0.2));
        }
        h.combat.damagePlayer(h.ctx, 12, dummy.x, dummy.y, false, dummy.level);
        h.combat.update(h.ctx, 0.05);
        assert.ok(Number.isFinite(h.player.hp) && Number.isFinite(dummy.hp), `Passive/mod on '${def.id}' produced NaN`);

        if (def.passive?.cooldownSec !== undefined && def.passive.cooldownSec > 0.1 && ICD_TRIGGER_PASSIVES.has(def.passive.trigger)) {
          const activePassiveCd = h.itemEffects.getCooldown(def.passive.id);
          assert.ok(
            activePassiveCd > 0,
            `Batch item '${def.id}' passive '${def.passive.id}' declares cooldownSec=${def.passive.cooldownSec} (${def.passive.trigger}) but ICD remained 0 after trigger`
          );
        }
        if (def.exoticModId && !NON_ICD_EXOTIC_MODS.has(def.exoticModId)) {
          const activeExoticCd = h.player.exoticIcds?.[def.exoticModId] ?? 0;
          assert.ok(
            activeExoticCd > 0,
            `Batch item '${def.id}' exoticModId '${def.exoticModId}' failed to engage player.exoticIcds on trigger`
          );
        }
      }

      for (const call of vfxRec.live) {
        assert.ok(PIXELFX_MODS[call.modId], `Batch item '${def.id}' emitted unknown live VFX '${call.modId}'`);
      }
      for (const call of vfxRec.pooled) {
        assert.ok(ATLAS_PRESETS[call.modId], `Batch item '${def.id}' emitted unknown pooled VFX '${call.modId}'`);
      }
      if (spec.vfxIds && spec.vfxIds.length > 0) {
        const emittedVfx = new Set([...vfxRec.live.map((c) => c.modId), ...vfxRec.pooled.map((c) => c.modId)]);
        for (const expectedVfx of spec.vfxIds) {
          assert.ok(
            emittedVfx.has(expectedVfx),
            `Batch item '${def.id}' declared vfxId '${expectedVfx}' was not emitted during combat simulation (emitted: [${Array.from(emittedVfx).join(", ")}])`
          );
        }
      }
      checksRun++;
    }
    log(`Suite D (Items) PASS: ${batchItems.length} batch items validated for uniqueness & functional combat execution.`);
  }

  if (batchMobs.length > 0) {
    validateBatchMobsSpec(batchMobs, ENEMIES, ENEMY_DROP_TABLES, WORLD_CAMPS, {
      monsters: enemyMonsters,
      frames: enemyFrames,
    });
    checksRun += batchMobs.length;

    const seenRuntimeAnimSignatures = new Set<string>();
    for (const spec of batchMobs) {
      const edef = ENEMIES[spec.id];
      const vfxRec: VfxRecordingLog = { live: [], pooled: [] };
      const h = makeBiomeCalibratedHarness("prism_knight", edef.biome, edef.level, Boolean(edef.isBoss), vfxRec);
      h.spawner.enemies.length = 0;
      const spawnDist = Math.max(36, edef.radius + h.player.radius + 8);
      const e = spawnSimulatedEnemy(h.spawner, h.player.x + spawnDist, h.player.y, spec.id, false);
      const executedAnims = new Set<string>();
      const cycles = Math.max(6, spec.animKinds.length * 3);
      for (let c = 0; c < cycles; c++) {
        e.x = h.player.x + spawnDist;
        e.y = h.player.y;
        e.homeX = e.x;
        e.homeY = e.y;
        e.animTime = 0;
        e.dashTime = 0;
        e.stunTime = 0;
        e.rootTime = 0;
        e.aiTimer = 0.01;
        e.specialTimer = edef.isBoss && (c & 1) === 1 ? 0.01 : 5.0;
        if (edef.isBoss && (c & 1) === 1) e.aiTimer = 5.0;
        h.player.hp = h.player.maxHp;
        h.player.invuln = 0;
        h.combat.update(h.ctx, 0.05);
        if (e.animKind !== "idle") executedAnims.add(e.animKind);

        for (let t = 0; t < 20; t++) {
          e.aiTimer = 10;
          e.specialTimer = 10;
          h.player.hp = h.player.maxHp;
          h.player.invuln = 0;
          h.combat.update(h.ctx, 0.05);
        }
      }
      assert.ok(
        executedAnims.size >= 2,
        `Batch mob '${spec.id}' executed only ${executedAnims.size} distinct animKinds (${Array.from(executedAnims).join(", ")}); expected >= 2`
      );
      const declaredNonIdle = Array.from(new Set(spec.animKinds.filter((a) => a && a !== "idle"))).sort();
      for (const expectedAnim of declaredNonIdle) {
        assert.ok(
          executedAnims.has(expectedAnim),
          `Batch mob '${spec.id}' declared animKind '${expectedAnim}' was never executed (executed: [${Array.from(executedAnims).join(", ")}])`
        );
      }
      const runtimeSig = Array.from(executedAnims).sort().join("|");
      assert.ok(
        !seenRuntimeAnimSignatures.has(runtimeSig),
        `Duplicate runtime executedAnims signature '${runtimeSig}' on batch mob '${spec.id}'`
      );
      seenRuntimeAnimSignatures.add(runtimeSig);

      assert.ok(
        vfxRec.live.length + vfxRec.pooled.length > 0,
        `Batch mob '${spec.id}' emitted zero VFX across ${cycles} simulated AI cycles`
      );
      for (const call of vfxRec.live) {
        assert.ok(PIXELFX_MODS[call.modId], `Batch mob '${spec.id}' emitted unknown live VFX '${call.modId}'`);
      }
      for (const call of vfxRec.pooled) {
        assert.ok(ATLAS_PRESETS[call.modId], `Batch mob '${spec.id}' emitted unknown pooled VFX '${call.modId}'`);
      }
      if (spec.vfxIds && spec.vfxIds.length > 0) {
        const emittedMobVfx = new Set([...vfxRec.live.map((c) => c.modId), ...vfxRec.pooled.map((c) => c.modId)]);
        for (const expectedVfx of spec.vfxIds) {
          assert.ok(
            emittedMobVfx.has(expectedVfx),
            `Batch mob '${spec.id}' declared vfxId '${expectedVfx}' was not emitted during AI cycles (emitted: [${Array.from(emittedMobVfx).join(", ")}])`
          );
        }
      }

      // Loot attribution & empirical drop trials (scaled for ultra-rare drop chances)
      if (spec.droppedBatchItemIds && spec.droppedBatchItemIds.length > 0) {
        const tbl = ENEMY_DROP_TABLES[spec.id];
        const tableEntries = [...(tbl.guaranteed ?? []), ...tbl.rolls];
        let trialCount = 2500;
        for (const expectedId of spec.droppedBatchItemIds) {
          const entry = tableEntries.find((en) => en.itemId === expectedId);
          assert.ok(entry, `Batch mob '${spec.id}' drop table missing expected batch item '${expectedId}'`);
          if (entry.chance > 0) {
            trialCount = Math.max(
              trialCount,
              Math.min(25000, Math.ceil(12 / Math.max(entry.chance, 0.0005)))
            );
          }
        }
        const observedDrops = new Set<string>();
        for (let trial = 0; trial < trialCount; trial++) {
          for (const d of rollEnemyDropTable(spec.id)) {
            assert.ok(ITEMS[d.itemId], `rollEnemyDropTable('${spec.id}') yielded unknown item '${d.itemId}'`);
            observedDrops.add(d.itemId);
          }
        }
        for (const expectedId of spec.droppedBatchItemIds) {
          const entry = tableEntries.find((en) => en.itemId === expectedId)!;
          if (entry.chance > 0) {
            assert.ok(
              observedDrops.has(expectedId),
              `Batch mob '${spec.id}' did not drop '${expectedId}' across ${trialCount} rollEnemyDropTable trials (chance=${entry.chance})`
            );
          }
        }
      }
      checksRun++;
    }
    log(`Suite D (Mobs) PASS: ${batchMobs.length} batch mobs validated for uniqueness, AI diversity, VFX & loot attribution.`);
  }

  return {
    passed: true,
    checksRun,
    summary,
    warnings,
  };
}

// ============================================================================
// 7. NEGATIVE VALIDATOR SELF-CHECKS (POISONED SPECS MUST BE REJECTED!)
// ============================================================================
function assertThrowsValidator(label: string, fn: () => void) {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  assert.equal(threw, true, `Negative self-check FAILED (expected rejection): ${label}`);
}

export function runNegativeSelfChecks(): void {
  const sampleItemA: ItemDef = {
    ...ITEMS["wpn_meadow_edge"],
    id: "mock_batch_wpn_a",
    spriteKey: "sword_t2",
    weaponSkillId: "ws_gale_slash",
    passiveId: "void_siphon",
    baseStats: { atk: 24 },
  };
  const sampleItemB: ItemDef = {
    ...ITEMS["wpn_meadow_wand"],
    id: "mock_batch_wpn_b",
    spriteKey: "staff_t2",
    weaponSkillId: "ws_thorn_bloom",
    passiveId: "reaction_amp",
    baseStats: { mag: 24 },
  };
  const mockItemsMap: Record<string, ItemDef> = {
    ...ITEMS,
    [sampleItemA.id]: sampleItemA,
    [sampleItemB.id]: sampleItemB,
  };

  // 1. Duplicate weaponSkillId in batch
  assertThrowsValidator("duplicate weaponSkillId", () => {
    validateBatchItemsSpec(
      [
        { id: sampleItemA.id, weaponSkillId: "ws_gale_slash", spriteKey: "sword_t2" },
        { id: sampleItemB.id, weaponSkillId: "ws_gale_slash", spriteKey: "staff_t2" },
      ],
      mockItemsMap
    );
  });

  // 2. Duplicate passiveId in batch
  assertThrowsValidator("duplicate passiveId", () => {
    validateBatchItemsSpec(
      [
        { id: sampleItemA.id, weaponSkillId: "ws_gale_slash", passiveId: "shared_mod", spriteKey: "sword_t2" },
        { id: sampleItemB.id, weaponSkillId: "ws_thorn_bloom", passiveId: "shared_mod", spriteKey: "staff_t2" },
      ],
      mockItemsMap
    );
  });

  // 3. Duplicate mob animKinds signature in batch
  assertThrowsValidator("duplicate mob animKinds", () => {
    validateBatchMobsSpec([
      { id: "null_slime", animKinds: ["leap_slam", "spit_moss"], skillCount: 2 },
      { id: "ash_hopper", animKinds: ["spit_moss", "leap_slam"], skillCount: 2 },
    ]);
  });

  // 4. Missing spriteKey on batch item
  assertThrowsValidator("missing spriteKey on batch item", () => {
    const noSpriteItem: ItemDef = { ...sampleItemA, id: "mock_no_sprite", spriteKey: undefined };
    validateBatchItemsSpec(
      [{ id: noSpriteItem.id, weaponSkillId: "ws_gale_slash" }],
      { ...mockItemsMap, [noSpriteItem.id]: noSpriteItem }
    );
  });

  // 5. Out-of-bounds WeaponSkill cooldown (both > 6.5 and < 4.2)
  assertThrowsValidator("weaponSkill cooldown > 6.5", () => {
    validateWeaponSkillRecord({ ...WEAPON_SKILLS["ws_gale_slash"], cooldown: 7.5 }, { batchStrict: true });
  });
  assertThrowsValidator("weaponSkill cooldown < 4.2", () => {
    validateWeaponSkillRecord({ ...WEAPON_SKILLS["ws_gale_slash"], cooldown: 3.1 }, { batchStrict: true });
  });

  // 6. NaN stat and unflagged negative def
  assertThrowsValidator("NaN stat in ItemDef", () => {
    validateItemRecord({ ...sampleItemA, baseStats: { atk: Number.NaN } });
  });
  assertThrowsValidator("unflagged negative def in ItemDef", () => {
    validateItemRecord({ ...sampleItemA, baseStats: { atk: 20, def: -5 } }, { allowNegativeTradeoff: false });
  });

  // 7. Out-of-bounds EnemyDef (wrong biome level, excessive def, unkiteable spd, short leash)
  assertThrowsValidator("enemy level out of biome bounds", () => {
    validateEnemyRecord({ ...ENEMIES["null_slime"], biome: "meadow", level: 10 });
  });
  assertThrowsValidator("enemy def > 50", () => {
    validateEnemyRecord({ ...ENEMIES["null_slime"], def: 55 });
  });
  assertThrowsValidator("enemy spd > 92", () => {
    validateEnemyRecord({ ...ENEMIES["null_slime"], spd: 110 });
  });
  assertThrowsValidator("enemy leashRadius < aggroRadius + 80", () => {
    validateEnemyRecord({ ...ENEMIES["null_slime"], aggroRadius: 140, leashRadius: 190 });
  });

  // 8. Telegraphed enemy hazard delay < 0.50s
  assertThrowsValidator("enemy hazard delay < 0.50s", () => {
    validateEnemyHazardDelay({ owner: "enemy", kind: "boss_slam", delay: 0.25, damage: 25 });
  });

  // 9. Spec-vs-ITEMS alignment mismatches must be rejected (no silent shadowing)
  assertThrowsValidator("spec.weaponSkillId mismatches ITEMS.weaponSkillId", () => {
    validateBatchItemsSpec(
      [{ id: sampleItemA.id, weaponSkillId: "ws_thorn_bloom", spriteKey: "sword_t2" }],
      mockItemsMap
    );
  });
  assertThrowsValidator("spec.spriteKey mismatches ITEMS.spriteKey", () => {
    validateBatchItemsSpec(
      [{ id: sampleItemA.id, weaponSkillId: "ws_gale_slash", spriteKey: "staff_t2" }],
      mockItemsMap
    );
  });
  assertThrowsValidator("spec.passiveId mismatches ITEMS.passiveId", () => {
    validateBatchItemsSpec(
      [{ id: sampleItemA.id, weaponSkillId: "ws_gale_slash", passiveId: "reaction_amp", spriteKey: "sword_t2" }],
      mockItemsMap
    );
  });

  // 10. Runtime enemy hit damage helper rejects >= 65% HP hit and > 1.35x normal mob multiplier
  assertThrowsValidator("validateRuntimeEnemyHitDamage >= 65% HP hit", () => {
    const highAtkSlime: EnemyDef = { ...ENEMIES["null_slime"], atk: 120 };
    validateRuntimeEnemyHitDamage(highAtkSlime, 120, [
      { classId: "bit_rogue", level: 1, maxHp: 90, def: 4 },
    ]);
  });
  assertThrowsValidator("validateRuntimeEnemyHitDamage > 1.35x normal mob multiplier", () => {
    validateRuntimeEnemyHitDamage(ENEMIES["null_slime"], Math.round(ENEMIES["null_slime"].atk * 1.6), [
      { classId: "prism_knight", level: 1, maxHp: 500, def: 10 },
    ]);
  });

  // 11. FORGE_RECIPES leakage validator rejects dropOnly and seasonalBannerId recipes
  assertThrowsValidator("validateForgeRecipes rejects dropOnly resultDefId", () => {
    const dropOnlyItem: ItemDef = { ...sampleItemA, id: "mock_droponly_item", dropOnly: true };
    validateForgeRecipes(
      [{ id: "rec_bad_droponly", resultDefId: dropOnlyItem.id, goldCost: 100, materials: [], desc: "bad" }],
      { ...mockItemsMap, [dropOnlyItem.id]: dropOnlyItem }
    );
  });
  assertThrowsValidator("validateForgeRecipes rejects seasonalBannerId resultDefId", () => {
    const seasonalItem: ItemDef = { ...sampleItemA, id: "mock_seasonal_item", seasonalBannerId: "banner_spring" };
    validateForgeRecipes(
      [{ id: "rec_bad_seasonal", resultDefId: seasonalItem.id, goldCost: 100, materials: [], desc: "bad" }],
      { ...mockItemsMap, [seasonalItem.id]: seasonalItem }
    );
  });
}

// ============================================================================
// 8. STANDALONE EXECUTION GUARD (NEVER RUNS ON IMPORT!)
// ============================================================================
if (typeof process !== "undefined" && process.env?.PIXTEL_BATCH_STANDALONE === "1") {
  try {
    const report = runBatchProductionVerification({ verbose: true });
    runNegativeSelfChecks();
    console.log(`[batchVerify] Negative validator self-checks PASS (all poisoned specs rejected).`);
    console.log(
      `BATCH PRODUCTION VERIFICATION PASSED CLEANLY (${report.checksRun} checks, ${report.summary.length} suites).`
    );
  } catch (err) {
    console.error("BATCH PRODUCTION VERIFICATION FAILED:", err);
    process.exit(1);
  }
}
