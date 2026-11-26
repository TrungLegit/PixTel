import assert from "node:assert/strict";
import { CLASSES } from "../src/data/classes";
import { STORY_CUTSCENES, getBossCutsceneId, interpolateCutsceneText } from "../src/data/cutscenes";
import { PIXELFX_MODS } from "../src/vfx/vfxManager";
import {
  ALL_ELEMENTS,
  ELEMENT_META,
  INFUSABLE_ELEMENTS,
  REACTION_BY_KEY,
  REACTION_SPECS,
  makeReactionKey,
} from "../src/data/elements";
import { ENEMIES } from "../src/data/enemies";
import { EXOTIC_ITEMS } from "../src/data/exoticItems";
import { GACHA_BANNERS, GACHA_KEY_ITEMS, GACHA_KEY_RECIPES, SEASONAL_ITEMS } from "../src/data/gacha";
import { HIDDEN_CRAFT_RECIPES, HIDDEN_ITEMS, rollBossHiddenDrops } from "../src/data/hiddenItems";
import { ENEMY_DROP_TABLES } from "../src/data/lootTables";
import { WEAPON_SKILLS, getWeaponSkillForItem } from "../src/data/weaponSkills";
import codixelEnemiesMeta from "../src/assets/codixel-enemies.json";
import codixelIconsMeta from "../src/assets/codixel-icons.json";
import { PAL, clearFrame, createFrame, createFx, posedStyled } from "../src/vfx/pixelfx/core/index.js";
import { GACHA_ALTAR_POS, STORAGE_CHEST_POS, TOWN_BOUNDS } from "../src/data/worldConfig";
import { STARTER_WEAPON_BY_CLASS } from "../src/data/equipments";
import {
  CORE_16_ITEMS,
  CORE_MATERIALS,
  ITEMS,
  MERCHANT_STOCK,
  canClassEquip,
  createItemInstance,
  getItemEffectiveStats,
  pickRandomEquipByRarity,
  resolveClassReward,
} from "../src/data/items";
import { CORE_SET_BONUSES } from "../src/data/sets";
import { ItemEffectSystem } from "../src/systems/ItemEffectSystem";
import { BOSS_CODEX, LORE_TABLETS, WORLD_PROLOGUE } from "../src/data/lore";
import { QUESTS } from "../src/data/quests";
import { FORGE_RECIPES } from "../src/data/recipes";
import { BOSS_ARENAS, TILE_SIZE, WAYPOINTS, WORLD_CAMPS, WORLD_RESOURCES } from "../src/data/worldConfig";
import type { ActiveBossLock, ClassId } from "../src/data/types";
import { ColorRestorationSystem } from "../src/graphics/colorRestoration";
import {
  getClassShowcaseEquipment,
  getOrBakePixelfxHero,
  getPixelfxHeroCompiled,
} from "../src/graphics/pixelfxHeroModels";
import { CombatSystem, type CombatContext } from "../src/systems/combat";
import { ELEMENT_DISPLAY, ForgeSystem } from "../src/systems/forgeSystem";
import { GachaSystem } from "../src/systems/gachaSystem";
import { BACKPACK_UPGRADES, InventorySystem, MAX_STASH_SLOTS, recalculatePlayerStats } from "../src/systems/inventorySystem";
import { QuestSystem } from "../src/systems/questSystem";
import { SaveSystem } from "../src/systems/saveSystem";
import { BEGINNER_PRACTICE_STEPS } from "../src/ui/TutorialModal";
import type { EnemyEntity, HazardEntity, PlayerEntity, ProjectileEntity, TurretEntity } from "../src/world/entities";
import { findNearestInteractable } from "../src/world/interactables";
import { WorldSpawner } from "../src/world/spawner";
import { WorldMap } from "../src/world/worldMap";
import { ATLAS_PRESETS, PIXELFX_MODS } from "../src/vfx/vfxManager";
import { createFrame, createFx } from "../src/vfx/pixelfx/core/index.js";
import WebSocket from "ws";
import { PixTelOpenWorldGame } from "../src/game";
import { startCoopServer } from "../server/coopServer";
import type { WebSocketLike } from "../src/net/coopClient";

// Lightweight headless mocks for browser globals so all systems run at pure logic speed in Node
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

interface MockVfxCall {
  modId: string;
  opts: Record<string, unknown>;
}

function createMockVfx(record?: { live: MockVfxCall[]; pooled: MockVfxCall[] }) {
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

function makeTestPlayer(classId: ClassId = "prism_knight"): PlayerEntity {
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
    level: 10,
    xp: 0,
    xpNext: 500,
    statPoints: 0,
    allocatedStats: { str: 0, vit: 0, agi: 0, crt: 0 },
    hp: cdef.baseStats.hp,
    maxHp: cdef.baseStats.hp,
    atk: 40,
    def: 8,
    spd: cdef.baseStats.spd,
    crit: 20,
    critMult: 1.9,
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

function makeTestHarness(classId: ClassId = "prism_knight") {
  const world = new WorldMap();
  const spawner = new WorldSpawner();
  spawner.reset();
  const colorSys = new ColorRestorationSystem();
  colorSys.reset();
  const inv = new InventorySystem();
  inv.resetStarterKit();
  // Arm test harness with class starter gear + accessory + Chroma Coating for v2.6 armed feature suites
  const starterWpnId = STARTER_WEAPON_BY_CLASS[classId];
  inv.addItem(starterWpnId, 1);
  const wpnInst = inv.bag.find((b) => b.defId === starterWpnId);
  if (wpnInst) inv.equipFromBag(wpnInst.uid, classId);
  inv.addItem("rng_copper", 1);
  const accInst = inv.bag.find((b) => b.defId === "rng_copper");
  if (accInst) inv.equipFromBag(accInst.uid, classId);
  inv.addItem("pot_coating", 1);

  const quests = new QuestSystem();
  quests.reset();
  const combat = new CombatSystem();
  const player = makeTestPlayer(classId);
  recalculatePlayerStats(player, inv, false);

  const projectiles: ProjectileEntity[] = [];
  const turrets: TurretEntity[] = [];
  const hazards: HazardEntity[] = [];
  let defeatedCount = 0;
  let bossesDefeatedEvents = 0;
  let hitstopTotal = 0;
  let bossLock: ActiveBossLock | null = null;

  const ctx: CombatContext = {
    player,
    world,
    spawner,
    vfx: createMockVfx(),
    colorSys,
    inv,
    quests,
    projectiles,
    turrets,
    hazards,
    addShake: () => {},
    addHitstop: (s) => {
      hitstopTotal += s;
    },
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
        arenaLabel: arena.label,
        cx: arena.cx,
        cy: arena.cy,
        radius: arena.radius,
      };
    },
    onBossDefeated: () => {
      bossesDefeatedEvents += 1;
      bossLock = null;
    },
    onPlayerDefeated: () => {
      defeatedCount += 1;
      if (bossLock) {
        spawner.resetBossOnPlayerDeath(bossLock.bossUid);
        bossLock = null;
      }
    },
    stats: { kills: 0, mined: 0, chestsOpened: 0, bossesDefeated: 0, reactionsTriggered: 0 },
  };

  return {
    ctx,
    combat,
    world,
    spawner,
    colorSys,
    inv,
    quests,
    player,
    projectiles,
    turrets,
    hazards,
    getDefeatedCount: () => defeatedCount,
    getBossesDefeatedEvents: () => bossesDefeatedEvents,
    getHitstopTotal: () => hitstopTotal,
    getBossLock: () => bossLock,
  };
}

function spawnDummyEnemy(spawner: WorldSpawner, x: number, y: number, defId = "quartz_stalker"): EnemyEntity {
  const edef = ENEMIES[defId];
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
    facingDir: "down",
    radius: edef.radius,
    hp: 5000,
    maxHp: 5000,
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

const results: string[] = [];
function runTest(name: string, fn: () => void) {
  fn();
  results.push(`PASS · ${name}`);
}

// ============================================================================
// 1. STORYLINE, LORE TABLETS, WALKABILITY & 5-ACT QUEST CAMPAIGN
// ============================================================================
runTest("Storyline, 8 Lore Tablets, Map Walkability & 5-Act Quests", () => {
  assert.equal(LORE_TABLETS.length, 8, "Should have 8 Ancient Lore Tablets");
  assert.equal(BOSS_CODEX.length, 4, "Should have 4 Boss Codex profiles");
  assert.ok(WORLD_PROLOGUE.paragraphs.length >= 3, "World prologue should have rich narrative paragraphs");

  const world = new WorldMap();
  const colorSys = new ColorRestorationSystem();
  colorSys.reset();

  for (const wp of WAYPOINTS) {
    assert.equal(
      world.isBlocked(wp.tx * TILE_SIZE + 8, wp.ty * TILE_SIZE + 8, 4),
      false,
      `Waypoint ${wp.id} must be walkable`
    );
  }
  for (const camp of WORLD_CAMPS) {
    assert.equal(
      world.isBlocked(camp.tx * TILE_SIZE + 8, camp.ty * TILE_SIZE + 8, 4),
      false,
      `Camp/Arena ${camp.id} must be walkable`
    );
  }
  for (const res of WORLD_RESOURCES) {
    assert.equal(
      world.isBlocked(res.tx * TILE_SIZE + 8, res.ty * TILE_SIZE + 8, 3),
      false,
      `Resource ${res.id} must be on valid ground`
    );
  }
  for (const lore of LORE_TABLETS) {
    const lx = lore.tx * TILE_SIZE + 8;
    const ly = lore.ty * TILE_SIZE + 8;
    assert.equal(world.isBlocked(lx, ly, 4), false, `Lore Tablet ${lore.id} must be walkable`);

    const discovered = new Set<string>();
    const nearUnread = findNearestInteractable(lx, ly + 6, colorSys, [], [], discovered);
    assert.ok(nearUnread && nearUnread.kind === "lore" && nearUnread.read === false);
    discovered.add(lore.id);
    const nearRead = findNearestInteractable(lx, ly + 6, colorSys, [], [], discovered);
    assert.ok(nearRead && nearRead.kind === "lore" && nearRead.read === true);
  }

  // Verify full 10-main-quest progression including q_lore_echo & q_meadow_boss!
  const qs = new QuestSystem();
  qs.reset();
  const mainQuests = QUESTS.filter((q) => q.isMain);
  assert.equal(mainQuests.length, 10, "Should have 10 sequential Main Story quests across 5 Acts");

  for (const mq of mainQuests) {
    assert.equal(qs.getState(mq.id), "available", `Main quest ${mq.id} should unlock sequentially`);
    assert.equal(qs.acceptQuest(mq.id), true);
    for (const obj of mq.objectives) {
      qs.recordEvent(obj.kind, obj.targetId, obj.required);
    }
    assert.equal(qs.getState(mq.id), "completable", `Main quest ${mq.id} should become completable`);
    const reward = qs.turnInQuest(mq.id);
    assert.ok(reward && reward.gold > 0 && reward.xp > 0);
    assert.equal(qs.getState(mq.id), "completed");
  }
});

// ============================================================================
// 2. COMBAT RHYTHM: 4-CLASS 3-STEP COMBO, DASH-OFFSET, CHROMA DODGE & JUST-CHARGE
// ============================================================================
runTest("Combat Rhythm: 3-Step Combos, Dash-Offset, Chroma Dodge & Just-Charge", () => {
  for (const c of CLASSES) {
    const h = makeTestHarness(c.id);
    h.spawner.enemies.length = 0;
    const dummy = spawnDummyEnemy(h.spawner, h.player.x + 24, h.player.y);

    // Step N1 -> N2 -> N3
    h.player.atkCd = 0;
    h.combat.performPrimaryAttack(h.ctx);
    assert.equal(h.player.comboStep, 1, `${c.id} N1 advances comboStep to 1`);

    h.player.atkCd = 0;
    h.combat.performPrimaryAttack(h.ctx);
    assert.equal(h.player.comboStep, 2, `${c.id} N2 advances comboStep to 2`);

    h.player.atkCd = 0;
    h.combat.performPrimaryAttack(h.ctx);
    assert.equal(h.player.comboStep, 0, `${c.id} N3 wraps comboStep to 0`);
    assert.ok(h.player.quickChargeTimer > 1.0, `${c.id} N3 unlocks Quick-Charge window`);
    assert.ok(dummy.hp < 5000 || h.projectiles.length > 0, `${c.id} attacks deal damage or spawn projectiles`);
  }

  // Dash-Offset Combo preservation
  const h = makeTestHarness("prism_knight");
  h.combat.performPrimaryAttack(h.ctx);
  assert.equal(h.player.comboStep, 1);
  h.combat.performDash(h.ctx, 1, 0);
  assert.ok(h.player.perfectDashWindow > 0, "Dash opens Chroma Dodge window");
  assert.ok(h.player.dashComboPreserveTimer > 0, "Dash preserves combo timer");

  // Chroma Dodge (Perfect Dash) when enemy attacks during perfectDashWindow!
  h.player.skillCd = 4.0;
  const stamBefore = h.player.stamina;
  const odBefore = h.player.overdrive;
  const hpBefore = h.player.hp;
  h.combat.damagePlayer(h.ctx, 45, h.player.x + 10, h.player.y);
  assert.equal(h.player.hp, hpBefore, "Chroma Dodge takes ZERO damage");
  assert.ok(h.player.stamina >= stamBefore + 18, "Chroma Dodge refunds +18 Stamina");
  assert.ok(h.player.overdrive >= odBefore + 12, "Chroma Dodge grants +12 Overdrive");
  assert.ok(h.player.skillCd <= 2.55, "Chroma Dodge cuts [E] cooldown by 1.5s");
  assert.ok(h.player.chromaCounterTimer > 0, "Chroma Dodge activates Chroma Counter buff");

  // Combo continues to N2 after Dash!
  h.player.atkCd = 0;
  h.combat.performPrimaryAttack(h.ctx);
  assert.equal(h.player.comboStep, 2, "Dash-Offset preserves combo step from N1 -> N2");

  // Just-Charge Lv2 stamina refund & hitstop
  h.player.stamina = 80;
  const hsBefore = h.getHitstopTotal();
  h.combat.performChargedAttack(h.ctx, true);
  assert.equal(h.player.stamina, 80 - 16, "Just-Charge costs 16 net Stamina (22 - 6 refund)");
  assert.ok(h.getHitstopTotal() > hsBefore, "Just-Charge triggers crisp hitstop");

  // Prism Knight Just-Parry
  h.player.skillCd = 0;
  h.combat.performSkillE(h.ctx);
  const fullCd = h.player.skillCd;
  h.player.invuln = 0;
  h.combat.damagePlayer(h.ctx, 50, h.player.x + 20, h.player.y);
  assert.equal(h.player.hp, hpBefore, "Just-Parry blocks all damage");
  assert.ok(h.player.skillCd <= fullCd * 0.51, "Just-Parry halves [E] cooldown");
});

// ============================================================================
// 3. 9-ELEMENT MATRIX (ALL 28 PAIRWISE + PRISM REFRACTION 3 HOMING BOLTS)
// ============================================================================
runTest("9-Element Chroma Reaction Matrix (All 28 Pairwise + Prism 3-Bolt Refraction)", () => {
  assert.equal(ALL_ELEMENTS.length, 9, "Must define exactly 9 canonical elements");
  assert.equal(INFUSABLE_ELEMENTS.length, 8, "Must define 8 infusable elements");
  assert.equal(REACTION_SPECS.length, 29, "Must define 6 Original + 22 Expanded + 1 Prism = 29 reactions");

  // Verify complete C(8,2) = 28 pairwise coverage!
  for (let i = 0; i < INFUSABLE_ELEMENTS.length; i++) {
    for (let j = i + 1; j < INFUSABLE_ELEMENTS.length; j++) {
      const key = makeReactionKey(INFUSABLE_ELEMENTS[i], INFUSABLE_ELEMENTS[j]);
      assert.ok(
        REACTION_BY_KEY.get(key),
        `Missing pairwise reaction spec for ${INFUSABLE_ELEMENTS[i]} + ${INFUSABLE_ELEMENTS[j]}`
      );
    }
  }

  const h = makeTestHarness("chroma_mage");
  h.spawner.enemies.length = 0;
  const e1 = spawnDummyEnemy(h.spawner, 52 * TILE_SIZE, 50 * TILE_SIZE);
  const e2 = spawnDummyEnemy(h.spawner, 52 * TILE_SIZE + 28, 50 * TILE_SIZE);

  // 1. fire + ice -> Thermal Shatter (vulnTime)
  h.combat.damageEnemy(h.ctx, e1, 20, false, "hit-fire", "fire");
  assert.equal(e1.element, "fire");
  h.combat.damageEnemy(h.ctx, e1, 20, false, "hit-ice", "ice");
  assert.equal(e1.element, null);
  assert.ok(e1.vulnTime >= 4.0, "Thermal Shatter shreds DEF (vulnTime)");

  // 2. fire + nature -> Toxic Eruption (spawns acid_pool hazard)
  e1.reactionIcd = 0;
  h.combat.damageEnemy(h.ctx, e1, 20, false, "hit-fire", "fire");
  h.combat.damageEnemy(h.ctx, e1, 20, false, "hit-poison", "nature");
  assert.ok(h.hazards.some((hz) => hz.kind === "acid_pool"), "Toxic Eruption spawns Acid Pool ground field");

  // 3. ice + nature -> Cryo-Root (roots non-boss enemy)
  e1.reactionIcd = 0;
  h.combat.damageEnemy(h.ctx, e1, 20, false, "hit-ice", "ice");
  h.combat.damageEnemy(h.ctx, e1, 20, false, "hit-poison", "nature");
  assert.ok(e1.rootTime >= 1.5, "Cryo-Root immobilizes enemy");

  // 4. ice + volt -> Superconduct (chains lightning + +15% Crit vulnerability)
  e1.reactionIcd = 0;
  const e2HpBefore = e2.hp;
  h.combat.damageEnemy(h.ctx, e1, 20, false, "hit-ice", "ice");
  h.combat.damageEnemy(h.ctx, e1, 20, false, "zap-hit", "volt");
  assert.ok(e2.hp < e2HpBefore, "Superconduct chains lightning to nearby enemy");
  assert.ok(e1.critVulnTime >= 4.5, "Superconduct applies +15% Crit vulnerability");

  // 5. fire + volt -> Overload Blast (breaks >= 40% Bleach Shield)
  e1.reactionIcd = 0;
  e1.bleachShield = 120;
  e1.maxBleachShield = 120;
  h.combat.damageEnemy(h.ctx, e1, 20, false, "hit-fire", "fire");
  h.combat.damageEnemy(h.ctx, e1, 20, false, "zap-hit", "volt");
  assert.ok(e1.bleachShield < 40, "Overload Blast heavily damages Bleach Shield");

  // 6. nature + volt -> Catalyze (+15 Stamina & +10 Overdrive)
  e1.reactionIcd = 0;
  h.player.stamina = 40;
  h.player.overdrive = 20;
  h.combat.damageEnemy(h.ctx, e1, 20, false, "hit-poison", "nature");
  h.combat.damageEnemy(h.ctx, e1, 20, false, "zap-hit", "volt");
  assert.ok(h.player.stamina >= 55, "Catalyze restores Stamina");
  assert.ok(h.player.overdrive >= 30, "Catalyze grants +10 Overdrive");

  // 7. Expanded: void + fire -> Void Flare Burst (strips enrageBuffTime & pulls nearby e2)
  e1.reactionIcd = 0;
  e1.enrageBuffTime = 6.0;
  const distBefore = Math.hypot(e2.x - e1.x, e2.y - e1.y);
  h.combat.damageEnemy(h.ctx, e1, 20, false, "explode-plasma", "void");
  h.combat.damageEnemy(h.ctx, e1, 20, false, "hit-fire", "fire");
  assert.equal(e1.enrageBuffTime, 0, "Void Flare Burst strips enemy speed/armor buff");
  assert.ok(Math.hypot(e2.x - e1.x, e2.y - e1.y) < distBefore, "Void Flare Burst pulls nearby enemies inward");

  // 8. Expanded: void + ice -> Null Frost (spawns null_frost field + normalAmpTime)
  e1.reactionIcd = 0;
  h.combat.damageEnemy(h.ctx, e1, 20, false, "explode-plasma", "void");
  h.combat.damageEnemy(h.ctx, e1, 20, false, "hit-ice", "ice");
  assert.ok(h.hazards.some((hz) => hz.kind === "null_frost"), "Null Frost spawns chill field");
  assert.ok(e1.normalAmpTime >= 2.0, "Null Frost amplifies Normal/Charge damage");

  // 9. Expanded: void + volt -> Void Arc (applies Disrupt)
  e1.reactionIcd = 0;
  h.combat.damageEnemy(h.ctx, e1, 20, false, "explode-plasma", "void");
  h.combat.damageEnemy(h.ctx, e1, 20, false, "zap-hit", "volt");
  assert.ok(e1.disruptTime >= 2.0, "Void Arc applies Disrupt debuff");

  // 10. Expanded: chroma + fire -> Chroma Ignis (heals +10% HP & re-applies chroma mark!)
  e1.reactionIcd = 0;
  h.player.hp = Math.floor(h.player.maxHp * 0.5);
  const hpBeforeIgnis = h.player.hp;
  h.combat.damageEnemy(h.ctx, e1, 20, false, "crit-gold", "chroma");
  h.combat.damageEnemy(h.ctx, e1, 20, false, "hit-fire", "fire");
  assert.ok(h.player.hp > hpBeforeIgnis, "Chroma Ignis heals player +10% HP");
  assert.equal(e1.element, "chroma", "Chroma Ignis re-applies Chroma mark");

  // 11. Expanded: fire + wind -> Firestorm Vortex (spreads fire to adjacent e2!)
  e1.element = null;
  e1.reactionIcd = 0;
  e2.element = null;
  e2.x = e1.x + 24;
  e2.y = e1.y;
  h.combat.damageEnemy(h.ctx, e1, 20, false, "hit-fire", "fire");
  h.combat.damageEnemy(h.ctx, e1, 20, false, "hit-cyan", "wind");
  assert.equal(e2.element, "fire", "Firestorm Vortex spreads Fire aura to nearby enemy");

  // 12. Expanded: quake + ice -> Tectonic Shatter (grants +35% next Charge Attack!)
  e1.reactionIcd = 0;
  h.player.tectonicChargeBonus = false;
  h.combat.damageEnemy(h.ctx, e1, 20, false, "ground-slam", "quake");
  h.combat.damageEnemy(h.ctx, e1, 20, false, "hit-ice", "ice");
  assert.equal(h.player.tectonicChargeBonus, true, "Tectonic Shatter empowers next Charge Attack by +35%");

  // 13. Universal Rule: fire + prism -> Prismatic Refraction (preserves fire aura & fires 3 homing bolts!)
  e1.reactionIcd = 0;
  h.projectiles.length = 0;
  h.combat.damageEnemy(h.ctx, e1, 20, false, "hit-fire", "fire");
  h.combat.damageEnemy(h.ctx, e1, 20, false, "crit-gold", "prism");
  assert.equal(e1.element, "fire", "Prismatic Refraction preserves underlying Primer aura");
  assert.equal(h.projectiles.filter((p) => p.homing).length, 3, "Prismatic Refraction spawns 3 homing refraction bolts");
});

// ============================================================================
// 4. BOSS SYSTEM: ELEMENTAL WEAKNESS, PHASE 2 CLASSIC & PHASE 3 PRIMORDIAL TOTEMS
// ============================================================================
runTest("Boss System: Elemental Weakness, Phase 2 Classic & Phase 3 Primordial Totems", () => {
  const h = makeTestHarness("prism_knight");
  const warden = h.spawner.enemies.find((e) => e.defId === "boss_xing_warden");
  const eraser = h.spawner.enemies.find((e) => e.defId === "boss_the_eraser");
  assert.ok(warden, "Meadow Boss Xing Warden must spawn in open world");
  assert.ok(eraser, "World Boss The Eraser must spawn in open world");
  assert.equal(ENEMIES["boss_xing_warden"].elementWeakness, "quake", "Xing Warden has Quake weakness");
  assert.equal(ENEMIES["boss_blight_root"].elementWeakness, "fire", "Blight Root has Fire weakness");
  assert.equal(ENEMIES["boss_gilded_null"].elementWeakness, "void", "Gilded Null has Void weakness");
  assert.equal(ENEMIES["boss_the_eraser"].elementWeakness, "chroma", "The Eraser has Chroma weakness");

  // Break Xing Warden's Bleach Shield -> Stun + Vulnerability
  h.combat.damageEnemy(h.ctx, warden, 180, true, "ground-slam", "quake", 1, 0, 2.5);
  assert.equal(warden.bleachShield, 0, "Elemental weakness heavy hit shatters Xing Warden's Bleach Shield");
  assert.ok(warden.stunTime >= 2.0 && warden.vulnTime >= 4.0, "Guard Break stuns Boss and opens Vulnerable window");

  // Test The Eraser Phase 2 Classic Totems (fire, ice, nature, volt)
  eraser.state = "aggro";
  h.player.x = eraser.x + 40;
  h.player.y = eraser.y;
  eraser.hp = Math.floor(eraser.maxHp * 0.62);
  h.combat.update(h.ctx, 0.016);

  assert.equal(eraser.phase, 2, "The Eraser transitions to Phase 2 at <= 65% HP");
  assert.equal(h.spawner.arenaTotems.length, 4, "Phase 2 spawns 4 Classic Chroma Totems");
  assert.deepEqual(
    h.spawner.arenaTotems.map((t) => t.element),
    ["fire", "ice", "nature", "volt"],
    "Phase 2 Totems use the 4 Classic Elements"
  );

  // Player strikes 2 Totems -> shatters Eraser's shield & grants Totem Elemental Surge!
  const t0 = h.spawner.arenaTotems[0];
  const t1 = h.spawner.arenaTotems[1];
  h.player.x = t0.x - 10;
  h.player.y = t0.y;
  h.player.aimAngle = 0;
  h.player.atkCd = 0;
  h.combat.performPrimaryAttack(h.ctx);
  assert.equal(t0.lit, true, "Striking first Arena Totem lights it");

  h.player.x = t1.x - 10;
  h.player.y = t1.y;
  h.player.atkCd = 0;
  h.combat.performPrimaryAttack(h.ctx);

  assert.equal(eraser.bleachShield, 0, "Lighting 2 Totems shatters The Eraser's Void Shield");
  assert.ok(eraser.stunTime >= 4.5, "The Eraser collapses for >= 4.5s");
  assert.ok(h.player.totemSurgeElement !== null && h.player.totemSurgeTimer >= 5.5, "Player gains Totem Elemental Surge");

  // Phase 3 transition at <= 30% HP -> Primordial Totems (void, chroma, wind, quake) + Super Convergence!
  eraser.stunTime = 0;
  eraser.hp = Math.floor(eraser.maxHp * 0.28);
  h.combat.update(h.ctx, 0.016);
  assert.equal(eraser.phase, 3, "The Eraser transitions to Phase 3 at <= 30% HP");
  assert.deepEqual(
    h.spawner.arenaTotems.map((t) => t.element),
    ["void", "chroma", "wind", "quake"],
    "Phase 3 Totems use the 4 Primordial Expanded Elements"
  );

  const hpBeforeSuper = eraser.hp;
  const p3Totems = h.spawner.arenaTotems.slice(0, 2);
  for (const tot of p3Totems) {
    h.player.x = tot.x - 10;
    h.player.y = tot.y;
    h.player.aimAngle = 0;
    h.player.atkCd = 0;
    h.combat.performPrimaryAttack(h.ctx);
  }
  assert.equal(h.spawner.arenaTotems.length, 0, "Lighting 2 Primordial Totems completes Super Convergence");
  assert.ok(eraser.hp <= hpBeforeSuper - Math.round(eraser.maxHp * 0.11), "Super Convergence deals 12% Max HP True Damage");
  assert.ok(eraser.stunTime >= 5.0, "Super Convergence stuns The Eraser for 5.2s");
  assert.ok(h.hazards.some((hz) => hz.kind === "chroma_bloom"), "Super Convergence creates Chroma Bloom sanctuary");
});

// ============================================================================
// 5. ITEMS, 8-PIGMENT +5 INFUSION, 4 NEW ARCHETYPES & PRISM FORGE (+0->+10)
// ============================================================================
runTest("Items, 8-Pigment +5 Infusions, 4 New 9-Element Archetypes & Prism Forge (+0->+10)", () => {
  const h = makeTestHarness("bit_rogue");
  const forge = new ForgeSystem();

  h.inv.gold = 999999;
  h.inv.addItem("mat_warden_crest", 10);
  h.inv.addItem("mat_crystal_heart", 10);
  h.inv.addItem("mat_amber_fang", 10);
  h.inv.addItem("mat_origin_star", 5);
  h.inv.addItem("mat_iron_ore", 400);
  h.inv.addItem("mat_quartz_shard", 400);
  h.inv.addItem("mat_amber_gem", 400);
  h.inv.addItem("mat_void_prism", 400);
  h.inv.addItem("mat_glitch_core", 400);
  h.inv.addItem("mat_prism_shard", 400);
  for (const el of INFUSABLE_ELEMENTS) {
    h.inv.addItem(ELEMENT_DISPLAY[el].pigmentId, 5);
  }

  for (const recId of [
    "rec_warden_cleaver",
    "rec_amulet_wind",
    "rec_grimoire_arcane",
    "rec_disc_spectrum",
    "rec_charm_undying",
    "rec_wind_feather",
    "rec_quake_maul",
    "rec_void_scythe",
    "rec_chroma_heart",
  ]) {
    assert.ok(FORGE_RECIPES.some((r) => r.id === recId), `Recipe ${recId} exists`);
    const res = forge.craftRecipe(recId, h.inv);
    assert.equal(res.succeeded, true, `Crafting ${recId} succeeds`);
  }

  // Verify Wind Feather & Chroma Heart passives wire cleanly
  const feather = h.inv.bag.find((b) => b.defId === "acc_wind_feather")!;
  assert.equal(h.inv.equipFromBag(feather.uid, h.player.classId).ok, true);
  recalculatePlayerStats(h.player, h.inv, false);
  assert.equal(h.player.hasWindDancer, true, "Wind Feather enables hasWindDancer");

  // Equip Arcane Grimoire -> verify Orbiting Grimoire passive auto-fires!
  const grim = h.inv.bag.find((b) => b.defId === "acc_grimoire_arcane")!;
  assert.equal(h.inv.equipFromBag(grim.uid, h.player.classId).ok, true);
  recalculatePlayerStats(h.player, h.inv, false);
  assert.equal(h.player.hasOrbitGrimoire, true, "Arcane Grimoire enables hasOrbitGrimoire");

  h.spawner.enemies.length = 0;
  spawnDummyEnemy(h.spawner, h.player.x + 50, h.player.y);
  h.projectiles.length = 0;
  h.player.grimoireTimer = 0.01;
  h.combat.update(h.ctx, 0.05);
  assert.ok(h.projectiles.length >= 1, "Orbiting Grimoire auto-fires elemental star bolt at nearby enemy");

  // Undying Totem Charm auto-revive on lethal hit!
  assert.ok(h.inv.countItem("charm_undying") >= 1);
  h.player.x = 50 * TILE_SIZE + 8;
  h.player.y = 50 * TILE_SIZE + 8;
  h.player.invuln = 0;
  h.player.perfectDashWindow = 0;
  h.combat.damagePlayer(h.ctx, 9999, h.player.x + 5, h.player.y);
  assert.equal(h.getDefeatedCount(), 0, "Undying Charm prevents death");
  assert.ok(h.player.hp >= Math.floor(h.player.maxHp * 0.38), "Undying Charm heals 40% maxHp");
  assert.equal(h.inv.countItem("charm_undying"), 0, "Undying Charm is consumed upon saving player");

  // Prism Forge +0 -> +10 Safe Pity + test ALL 8 Pigment Infusions at +5!
  const wpn = h.inv.equipment.weapon!;
  let attempts = 0;
  while (wpn.enhanceLevel < 10 && attempts < 60) {
    const prevLv = wpn.enhanceLevel;
    const prevPity = wpn.pityBonus ?? 0;
    const r = forge.enhanceItem(wpn.uid, h.inv, h.quests, true);
    assert.equal(r.ok, true);
    assert.ok(wpn.enhanceLevel >= prevLv, "Enhancement NEVER downgrades or breaks equipment");
    if (!r.succeeded) {
      assert.ok((wpn.pityBonus ?? 0) > prevPity, "Failed enhance strictly increases Pity bonus");
    } else {
      assert.equal(wpn.pityBonus ?? 0, 0, "Successful enhance resets Pity bonus");
    }
    if (wpn.enhanceLevel === 5 && !wpn.infusedElement) {
      for (const el of INFUSABLE_ELEMENTS) {
        const inf = forge.infuseElement(wpn.uid, el, h.inv, h.quests);
        assert.equal(inf.succeeded, true, `+5 weapon accepts ${el} pigment infusion`);
        assert.equal(wpn.infusedElement, el);
      }
    }
    attempts++;
  }
  assert.equal(wpn.enhanceLevel, 10, `Weapon reaches +10 safely with Pity protection (took ${attempts} rolls)`);

  const st10 = getItemEffectiveStats(wpn);
  const st0 = getItemEffectiveStats(createItemInstance(wpn.defId, 1, 0));
  assert.ok(st10.atk > st0.atk + 20, "+10 weapon gains massive ATK");
  assert.ok(st10.poiseBreakPct >= st0.poiseBreakPct + 45, "+10 weapon with Quake infusion gains +45% Poise Break");
  assert.ok(st10.staminaCostPct <= -15, "+7 weapon milestone reduces Charge Stamina cost by 15%");
  assert.ok(st10.elementBonus >= 18, "+5 infusion & +10 awakening grant +18% Element Bonus");
});

// ============================================================================
// 6. 4-CLASS KITS, BEGINNER TUTORIAL STEPS & SAVEDATAV2 PERSISTENCE
// ============================================================================
runTest("4-Class Kits, Beginner Tutorial Handbook & SaveDataV2 Persistence", () => {
  assert.equal(BEGINNER_PRACTICE_STEPS.length, 6, "Guided Beginner Tutorial must define 6 structured steps");
  for (const el of ALL_ELEMENTS) {
    assert.ok(ELEMENT_META[el].role.length > 5 && ELEMENT_META[el].mechanic.length > 10);
  }

  for (const c of CLASSES) {
    const h = makeTestHarness(c.id);
    h.spawner.enemies.length = 0;
    spawnDummyEnemy(h.spawner, h.player.x + 36, h.player.y);

    // [E] Skill execution & Quick-Charge link
    h.player.skillCd = 0;
    h.player.quickChargeTimer = 0;
    h.combat.performSkillE(h.ctx);
    assert.ok(h.player.skillCd > 0, `${c.id} [E] enters skill cooldown`);
    assert.ok(h.player.quickChargeTimer > 1.0, `${c.id} [E] links into Quick-Charge window`);

    // [Q] Ultimate execution & local Chroma Restoration burst
    h.player.overdrive = 100;
    h.player.bleachDebuffTime = 3.0;
    h.combat.performUltimateQ(h.ctx);
    assert.equal(h.player.overdrive, 0, `${c.id} [Q] consumes 100 Overdrive`);
    assert.equal(h.player.bleachDebuffTime, 0, `${c.id} [Q] cleanses Bleach debuff`);
  }

  const h = makeTestHarness("prism_knight");
  assert.equal(ITEMS["pot_coating"]?.consumableKind, "chroma_coating");
  assert.ok(h.inv.countItem("pot_coating") >= 1, "Starter kit includes Dầu Quang Phổ");

  h.inv.equipment.weapon!.enhanceLevel = 6;
  h.inv.equipment.weapon!.pityBonus = 40;
  h.inv.equipment.weapon!.infusedElement = "void";

  const saveSys = new SaveSystem();
  const savedOk = saveSys.save({
    version: 2,
    savedAt: Date.now(),
    classId: h.player.classId,
    player: {
      x: h.player.x,
      y: h.player.y,
      level: h.player.level,
      xp: h.player.xp,
      xpNext: h.player.xpNext,
      gold: h.inv.gold,
      hp: h.player.hp,
      overdrive: h.player.overdrive,
      respawnWaypointId: h.player.respawnWaypointId,
    },
    equipment: h.inv.equipment,
    bag: h.inv.bag,
    unlockedWaypoints: ["wp_town", "wp_meadow_n"],
    openedChests: ["chest_meadow_1"],
    discoveredLore: ["lore_town_origin", "lore_meadow_warden"],
    tutorialCompleted: true,
    quests: h.quests.exportState(),
    stats: { kills: 12, mined: 5, chestsOpened: 1, bossesDefeated: 1, reactionsTriggered: 13 },
  });
  assert.equal(savedOk, true);
  assert.equal(saveSys.hasSave(), true);

  const loaded = saveSys.load()!;
  assert.deepEqual(loaded.discoveredLore, ["lore_town_origin", "lore_meadow_warden"]);
  assert.equal(loaded.tutorialCompleted, true);
  assert.equal(loaded.stats.reactionsTriggered, 13);
  assert.equal(loaded.equipment.weapon?.infusedElement, "void");
  assert.equal(loaded.equipment.weapon?.pityBonus, 40);
});

// ============================================================================
// 7. HARDCORE RPG PROGRESSION: BARE-HANDS, CLASS LOCKS, MATRIX FORGE & SEALS
// ============================================================================
runTest("Hardcore RPG: Bare-Handed Start, Skill Gating, Class Locks, Matrix Forge, Stats & Boss Seals", () => {
  // 1. Bare-handed starter kit verification
  const rawInv = new InventorySystem();
  rawInv.resetStarterKit();
  assert.equal(rawInv.gold, 30, "Starter gold starts tight at 30G");
  assert.equal(Object.keys(rawInv.equipment).length, 0, "Starts completely bare-handed with 0 equipped gear");
  assert.equal(rawInv.countItem("pot_hp"), 2, "Starter bag includes 2 HP potions only");

  // 2. Unarmed punch combat + [E]/[Q] gating without weapon/accessory
  const bare = makeTestHarness("prism_knight");
  bare.inv.resetStarterKit();
  recalculatePlayerStats(bare.player, bare.inv, false);
  bare.spawner.enemies.length = 0;
  const slime = spawnDummyEnemy(bare.spawner, bare.player.x + 20, bare.player.y, "null_slime");
  const slimeStartHp = slime.hp;
  bare.player.atkCd = 0;
  bare.combat.performPrimaryAttack(bare.ctx);
  assert.ok(slime.hp < slimeStartHp, "Bare-handed punch deals melee damage when unarmed");

  bare.player.skillCd = 0;
  bare.combat.performSkillE(bare.ctx);
  assert.equal(bare.player.skillCd, 0, "[E] Weapon Skill stays locked while no weapon is equipped");

  bare.player.overdrive = 100;
  bare.combat.performUltimateQ(bare.ctx);
  assert.equal(bare.player.overdrive, 0, "[Q] Fixed Class Signature Skill unleashes at 100% Overdrive without needing an accessory");

  // 3. Strict Class Equipment Locks (zero universal weapons!) & Safe Class Switch + Combat Bypass Prevention
  for (const itemDef of Object.values(ITEMS)) {
    if (itemDef.category === "equipment" && itemDef.slot === "weapon") {
      assert.ok(
        itemDef.requiredClass && itemDef.requiredClass !== "all",
        `Weapon ${itemDef.id} must be locked to a specific Class (found ${itemDef.requiredClass})`
      );
    }
  }
  const swordIds = [
    "wpn_starter",
    "wpn_meadow_edge",
    "wpn_quartz_reaver",
    "wpn_amber_fury",
    "wpn_chroma_sovereign",
    "hid_craft_prism_blade",
    "hid_boss_eraser_edge",
  ] as const;
  for (const swordId of swordIds) {
    assert.equal(canClassEquip(ITEMS[swordId], "chroma_mage"), false, `Mage cannot equip sword ${swordId}`);
    const mageInv = new InventorySystem();
    mageInv.resetStarterKit("chroma_mage");
    mageInv.addItem(swordId, 1, 5);
    const swordUid = mageInv.bag.find((b) => b.defId === swordId)!.uid;
    assert.equal(mageInv.equipFromBag(swordUid, "chroma_mage").ok, false, `equipFromBag rejects ${swordId} for Mage`);
    const best = mageInv.equipBestForClass("chroma_mage");
    assert.equal(best.equipped.some((e) => e.slot === "weapon"), false, `equipBestForClass skips sword ${swordId} for Mage`);
  }

  // Defense-in-depth: even if legacy save stuffed a sword into Mage's weapon slot, combat & skills refuse to fire with it
  {
    const legacyMage = makeTestHarness("chroma_mage");
    legacyMage.inv.equipment.weapon = createItemInstance("wpn_chroma_sovereign", 1, 5);
    assert.equal(legacyMage.inv.hasValidEquippedWeapon("chroma_mage"), false, "Sword is invalid weapon for Mage");
    legacyMage.player.skillCd = 0;
    legacyMage.combat.performSkillE(legacyMage.ctx);
    assert.equal(legacyMage.player.skillCd, 0, "Mage cannot cast [E] skill while holding Knight sword");
    legacyMage.player.atkCd = 0;
    legacyMage.combat.performPrimaryAttack(legacyMage.ctx);
    assert.equal(legacyMage.player.attackAnimKind, "punch_1", "Mage falls back to bare-handed punch instead of casting with sword");
    const migrated = legacyMage.inv.unequipIncompatibleForClass("chroma_mage");
    assert.equal(migrated.length, 1, "unequipIncompatibleForClass safely moves off-class sword to bag");
    assert.equal(legacyMage.inv.equipment.weapon, undefined);
  }

  bare.inv.addItem("wpn_apprentice_staff", 1);
  const staffUid = bare.inv.bag.find((b) => b.defId === "wpn_apprentice_staff")!.uid;
  assert.equal(bare.inv.equipFromBag(staffUid, "prism_knight").ok, false, "Knight cannot equip Mage staff");
  assert.equal(bare.inv.equipFromBag(staffUid, "chroma_mage").ok, true, "Mage equips Mage staff cleanly");
  const removedOnSwitch = bare.inv.unequipIncompatibleForClass("bit_rogue");
  assert.equal(removedOnSwitch.length, 1, "Switching to Rogue unequips incompatible Mage staff safely");
  assert.equal(bare.inv.equipment.weapon, undefined);

  // 4. Class-matched quest rewards & class-biased drops
  const qs = new QuestSystem();
  qs.reset();
  assert.equal(qs.acceptQuest("q_intro_slime"), true);
  qs.recordEvent("kill_enemy", "null_slime", 5);
  const rogueTurnIn = qs.turnInQuest("q_intro_slime", "bit_rogue");
  assert.ok(rogueTurnIn && rogueTurnIn.items.some((it) => it.defId === "wpn_rust_daggers"), "Intro quest awards class-matched starter weapon");
  const dropped = pickRandomEquipByRarity("rare", "chroma_mage");
  assert.ok(ITEMS[dropped]?.category === "equipment", "Random equip drop resolves valid equipment definition");

  // 5. Stat Point Allocation math
  recalculatePlayerStats(bare.player, bare.inv, false);
  const baseAtk = bare.player.atk;
  const baseMaxHp = bare.player.maxHp;
  const baseDef = bare.player.def;
  const baseSpd = bare.player.spd;
  const baseCrit = bare.player.crit;
  bare.player.allocatedStats = { str: 2, vit: 1, agi: 2, crt: 1 };
  recalculatePlayerStats(bare.player, bare.inv, false);
  assert.equal(bare.player.atk, baseAtk + 6, "2 STR grants +6 ATK");
  assert.equal(bare.player.maxHp, baseMaxHp + 18, "1 VIT grants +18 MaxHP");
  assert.equal(bare.player.def, baseDef + 1, "1 VIT grants +1 DEF");
  assert.equal(bare.player.spd, baseSpd + 5, "2 AGI grants +5 SPD");
  assert.ok(Math.abs(bare.player.crit - (baseCrit + 1.5)) < 0.01, "1 CRT grants +1.5% CRIT");

  // 6. Matrix Forge +1 Bonus Substat Awakening
  const forge = new ForgeSystem();
  bare.inv.gold = 99999;
  bare.inv.addItem("mat_iron_ore", 50);
  bare.inv.addItem("mat_glitch_core", 50);
  bare.inv.addItem("mat_prism_shard", 50);
  const fRes = forge.enhanceItem(staffUid, bare.inv, bare.quests, false);
  assert.equal(fRes.ok && fRes.succeeded, true, "First +0 -> +1 enhance succeeds");
  assert.ok(fRes.rolledBonusText && fRes.item?.bonusStats, "Enhance +1 awakens random Matrix bonusStats");
  const stBonus = getItemEffectiveStats(fRes.item!);
  const stPlain = getItemEffectiveStats(createItemInstance("wpn_apprentice_staff", 1, 1));
  const anyHigher =
    stBonus.atk > stPlain.atk ||
    stBonus.def > stPlain.def ||
    stBonus.maxHp > stPlain.maxHp ||
    stBonus.spd > stPlain.spd ||
    stBonus.crit > stPlain.crit;
  assert.equal(anyHigher, true, "Awakened bonusStats adds directly into getItemEffectiveStats");

  // 7. Level-Gap Toughness Scaling & 4-Boss Territory Lock-In
  const eqH = makeTestHarness("prism_knight");
  const lowH = makeTestHarness("prism_knight");
  lowH.player.level = 1;
  eqH.player.level = 12;
  lowH.player.atk = 60;
  eqH.player.atk = 60;
  const hiMobA = spawnDummyEnemy(lowH.spawner, lowH.player.x + 20, lowH.player.y, "boss_xing_warden");
  const hiMobB = spawnDummyEnemy(eqH.spawner, eqH.player.x + 20, eqH.player.y, "boss_xing_warden");
  const lowBefore = hiMobA.hp;
  const eqBefore = hiMobB.hp;
  lowH.combat.damageEnemy(lowH.ctx, hiMobA, 60, false, "hit-white");
  eqH.combat.damageEnemy(eqH.ctx, hiMobB, 60, false, "hit-white");
  assert.ok(lowBefore - hiMobA.hp < eqBefore - hiMobB.hp, "Level-gap toughness reduces damage dealt by under-leveled heroes");

  assert.equal(Object.keys(BOSS_ARENAS).length, 4, "All 4 bosses define enclosed arena coordinates");
  const warden = lowH.spawner.enemies.find((e) => e.defId === "boss_xing_warden")!;
  lowH.combat.damageEnemy(lowH.ctx, warden, 50, false, "hit-white");
  assert.equal(lowH.getBossLock()?.bossDefId, "boss_xing_warden", "First hit on Boss triggers arena territory seal");
  assert.ok(warden.hp < warden.maxHp);
  lowH.spawner.resetBossOnPlayerDeath(warden.uid);
  assert.equal(warden.hp, warden.maxHp, "Boss resets to full HP when challenger falls inside arena");
});

// ============================================================================
// 8. PIXELFX HERO MODELS, EQUIP BEST, SELECTIVE QUICK SELL, 25 QUESTS & BALANCE
// ============================================================================
runTest("Pixelfx Hero Models, Equip Best, Selective Quick Sell, 25 Main+Side Quests & Rebalanced Combat", () => {
  // 1. All 4 pixelfx 3D-rigged class models render crisp non-empty silhouettes & gear diffs
  for (const c of CLASSES) {
    const compiled = getPixelfxHeroCompiled(c.id, 0);
    let maskPixels = 0;
    for (let i = 0; i < compiled.actor.mask.data.length; i++) {
      if (compiled.actor.mask.data[i]) maskPixels++;
    }
    assert.ok(maskPixels > 40, `${c.id} pixelfx hero model has non-empty 3D silhouette (${maskPixels}px)`);

    const bareBaked = getOrBakePixelfxHero(c.id, {}, "idle", 0, 1, "right", 1.0);
    const gearBaked = getOrBakePixelfxHero(c.id, getClassShowcaseEquipment(c.id), "idle", 0, 1, "right", 1.0);
    let diffCount = 0;
    for (let i = 0; i < bareBaked.actor.pixels.length; i++) {
      if (bareBaked.actor.pixels[i] !== gearBaked.actor.pixels[i]) diffCount++;
    }
    assert.ok(diffCount > 25, `${c.id} equipped loadout visibly transforms pixelfx model (${diffCount}px changed)`);
  }

  // 2. Equip Best selects highest-scoring compatible gear across 5 slots and skips off-class items
  const inv = new InventorySystem();
  inv.resetStarterKit();
  inv.addItem("wpn_apprentice_staff", 1, 8); // strong +8 but Mage-only!
  inv.addItem("wpn_starter", 1, 0);
  inv.addItem("wpn_prism_halberd", 1, 2); // Knight-compatible strong weapon
  inv.addItem("arm_amber_aegis", 1, 0);
  inv.addItem("hlm_quartz_visor", 1, 0);
  inv.addItem("bts_amber_treads", 1, 0);
  inv.addItem("acc_wind_feather", 1, 0);
  const optBest = inv.equipBestForClass("prism_knight");
  assert.equal(optBest.equipped.length, 5, "Equip Best fills all 5 compatible slots");
  assert.equal(inv.equipment.weapon?.defId, "wpn_prism_halberd", "Equip Best chooses best Knight weapon, never off-class +8 staff");
  assert.equal(inv.equipment.armor?.defId, "arm_amber_aegis");
  assert.equal(inv.equipment.accessory?.defId, "acc_wind_feather");

  // 3. Selective Quick Sell removes off-class + user-chosen items cleanly after confirmation
  inv.addItem("wpn_glitch_fangs", 1, 0); // Rogue off-class
  const spareIdx = inv.bag.filter((b) => {
    const d = ITEMS[b.defId];
    return d && d.category === "equipment" && !canClassEquip(d, "prism_knight");
  });
  assert.equal(spareIdx.length, 2, "Identifies 2 off-class equipment items in bag");
  const extraPot = inv.bag.find((b) => b.defId === "pot_hp")!;
  const sellUids = [...spareIdx.map((s) => s.uid), extraPot.uid];
  const expectedGold = sellUids.reduce((acc, u) => {
    const it = inv.bag.find((b) => b.uid === u)!;
    return acc + inv.getItemSellValue(it, true);
  }, 0);
  const goldBefore = inv.gold;
  const sellRes = inv.sellMultipleFromBag(sellUids);
  assert.equal(sellRes.totalGold, expectedGold, "Confirmed batch sell pays exact computed gold total");
  assert.equal(inv.gold, goldBefore + expectedGold);
  assert.equal(inv.bag.some((b) => sellUids.includes(b.uid)), false, "All confirmed items removed cleanly from bag");

  // 4. 25 Main + Chained Side + Bounty quests integrity & 4-tier class rewards
  assert.equal(QUESTS.length, 25, "QUESTS defines 10 Main + 12 Chained Side + 3 Bounties (25 total)");
  const mainCount = QUESTS.filter((q) => q.isMain).length;
  const sideCount = QUESTS.filter((q) => q.category === "side").length;
  const bountyCount = QUESTS.filter((q) => q.category === "bounty").length;
  assert.equal(mainCount, 10);
  assert.equal(sideCount, 12);
  assert.equal(bountyCount, 3);

  const qIds = new Set(QUESTS.map((q) => q.id));
  for (const q of QUESTS) {
    if (q.prereqQuestId) {
      assert.ok(qIds.has(q.prereqQuestId), `Prereq ${q.prereqQuestId} exists for ${q.id}`);
    }
    for (const ri of q.rewards.items ?? []) {
      assert.ok(ITEMS[ri.defId], `Reward item ${ri.defId} exists for ${q.id}`);
    }
  }
  for (const c of CLASSES) {
    for (const key of ["starter_weapon", "meadow_weapon", "quartz_weapon", "amber_weapon", "ruins_weapon"] as const) {
      const rw = resolveClassReward(c.id, key);
      assert.ok(ITEMS[rw] && canClassEquip(ITEMS[rw], c.id), `${c.id} reward ${key} -> ${rw} is valid & equippable`);
    }
  }

  // Walk one full 3-step NPC side chain (Kael)
  const qs = new QuestSystem();
  qs.reset();
  assert.equal(qs.getState("sq_kael_1"), "available", "Side chain step 1 unlocks immediately");
  assert.equal(qs.getState("sq_kael_2"), "locked", "Side chain step 2 starts locked behind step 1");
  qs.acceptQuest("sq_kael_1");
  qs.recordEvent("mine_resource", undefined, 2);
  const k1 = qs.turnInQuest("sq_kael_1", "prism_knight");
  assert.ok(k1 && qs.getState("sq_kael_2") === "available", "Completing step 1 unlocks Kael step 2");

  // 5. Hardcore Rebalanced Mob/Boss curve & Threat/DEF combat formulas
  assert.equal(ENEMIES["null_slime"].level, 1);
  assert.ok(ENEMIES["null_slime"].maxHp >= 70, `null_slime rebalanced tougher (HP=${ENEMIES["null_slime"].maxHp})`);
  assert.ok(
    ENEMIES["boss_the_eraser"].maxHp >= 12000 && ENEMIES["boss_xing_warden"].maxHp >= 2200,
    "Regional & World Bosses scaled for grind-to-boss progression"
  );

  const defLow = makeTestHarness("prism_knight");
  const defHi = makeTestHarness("prism_knight");
  defLow.player.x = 50 * TILE_SIZE + 8;
  defLow.player.y = 50 * TILE_SIZE + 8;
  defHi.player.x = 50 * TILE_SIZE + 8;
  defHi.player.y = 50 * TILE_SIZE + 8;
  defLow.player.def = 2;
  defHi.player.def = 55;
  defLow.player.hp = 500;
  defLow.player.maxHp = 500;
  defHi.player.hp = 500;
  defHi.player.maxHp = 500;
  defLow.combat.damagePlayer(defLow.ctx, 80, defLow.player.x + 5, defLow.player.y, false, 1);
  defHi.combat.damagePlayer(defHi.ctx, 80, defHi.player.x + 5, defHi.player.y, false, 1);
  assert.ok(500 - defHi.player.hp < 500 - defLow.player.hp, "Smooth asymptotic DEF mitigates incoming damage");

  const lowLv = makeTestHarness("prism_knight");
  lowLv.player.x = 50 * TILE_SIZE + 8;
  lowLv.player.y = 50 * TILE_SIZE + 8;
  lowLv.player.level = 1;
  lowLv.player.hp = 1000;
  lowLv.player.maxHp = 1000;
  lowLv.combat.damagePlayer(lowLv.ctx, 50, lowLv.player.x + 5, lowLv.player.y, false, 19);
  const dmgFromBoss = 1000 - lowLv.player.hp;
  lowLv.player.hp = 1000;
  lowLv.player.invuln = 0;
  lowLv.combat.damagePlayer(lowLv.ctx, 50, lowLv.player.x + 5, lowLv.player.y, false, 1);
  const dmgFromEqual = 1000 - lowLv.player.hp;
  assert.ok(dmgFromBoss > dmgFromEqual, `Under-leveled hero takes extra threat damage vs Lv.19 boss (${dmgFromBoss} > ${dmgFromEqual})`);
});

// ============================================================================
// 9. ATTACK ANIMATION & PIXELFX VFX SYNCHRONIZATION
// ============================================================================
runTest("Attack Animation & Pixelfx VFX Synchronization Across All Classes & Modes", () => {
  // 1. Bare-handed combo N1/N2/N3 + Charged Uppercut assign exact attack kinds & weapon-height VFX
  const bare = makeTestHarness("prism_knight");
  const bareRec = { live: [] as MockVfxCall[], pooled: [] as MockVfxCall[] };
  bare.ctx.vfx = createMockVfx(bareRec);
  delete bare.inv.equipment.weapon;
  recalculatePlayerStats(bare.player, bare.inv, true);

  bare.player.aimAngle = 0;
  bare.combat.performPrimaryAttack(bare.ctx);
  assert.equal(bare.player.attackAnimKind, "punch_1");
  assert.ok(bare.player.attackAnimDuration >= 0.2);

  bare.player.atkCd = 0;
  bare.combat.performPrimaryAttack(bare.ctx);
  assert.equal(bare.player.attackAnimKind, "punch_2");

  bare.player.atkCd = 0;
  bare.combat.performPrimaryAttack(bare.ctx);
  assert.equal(bare.player.attackAnimKind, "punch_3");

  bare.combat.performChargedAttack(bare.ctx, true);
  assert.equal(bare.player.attackAnimKind, "uppercut");
  assert.equal(bareRec.pooled.length, 4, "Bare-handed punches emit muzzle sparks at fist height");

  // 2. Equipped 4 Classes: N1/N2/N3, Charged, [E], [Q], plus left-facing melee VFX orientation
  const expectedN: Record<ClassId, string[]> = {
    prism_knight: ["slash_1", "slash_2", "cleave"],
    chroma_mage: ["cast_1", "cast_2", "cast_3"],
    bit_rogue: ["flurry_1", "flurry_2", "spin"],
    pixel_tinker: ["shoot", "shoot", "shoot_heavy"],
  };
  const expectedCharge: Record<ClassId, string> = {
    prism_knight: "overhead_slam",
    chroma_mage: "cast_heavy",
    bit_rogue: "spin",
    pixel_tinker: "beam",
  };

  for (const cls of CLASSES) {
    const h = makeTestHarness(cls.id);
    const rec = { live: [] as MockVfxCall[], pooled: [] as MockVfxCall[] };
    h.ctx.vfx = createMockVfx(rec);
    h.player.aimAngle = Math.PI; // Aim directly LEFT!

    for (let s = 0; s < 3; s++) {
      h.player.atkCd = 0;
      h.combat.performPrimaryAttack(h.ctx);
      assert.equal(h.player.attackAnimKind, expectedN[cls.id][s], `${cls.id} N${s + 1} sets synchronized attack kind`);
      assert.ok(h.player.attackAnimDuration >= 0.2 && h.player.attackAnimTime === h.player.attackAnimDuration);
      assert.equal(h.player.facing, -1, `${cls.id} N${s + 1} facing snaps left when aiming PI`);
    }

    // Left-facing melee slash checks (never upside-down!)
    if (cls.id === "prism_knight") {
      assert.equal(rec.live.length, 3);
      for (const call of rec.live) {
        assert.equal(call.opts.flip, true, "Left-aimed prism_knight melee VFX flips horizontally");
        assert.ok(
          Math.abs((call.opts.angle as number) ?? 0) < Math.PI / 2,
          "Left-aimed prism_knight melee VFX stays right-side-up (|angle| < PI/2)"
        );
        assert.equal(call.opts.follow, h.player, "Prism Knight melee VFX follows hero position");
      }
      assert.ok((rec.live[2].opts.startTime as number) > 0, "Heavy cleave skips pre-swing dead frames via startTime");
    }
    if (cls.id === "bit_rogue") {
      assert.equal(rec.live.length, 3);
      for (const call of rec.live) {
        assert.equal(call.opts.flip, true, "Left-aimed bit_rogue melee VFX flips horizontally");
        assert.equal(call.opts.follow, h.player, "Bit Rogue melee VFX follows hero position");
      }
      assert.equal(h.ctx.projectiles.length, 0, "bit_rogue normal attacks are pure melee and spawn 0 projectiles");
      h.player.cloneTime = 3.0;
      h.player.atkCd = 0;
      h.combat.performPrimaryAttack(h.ctx);
      assert.equal(h.ctx.projectiles.length, 0, "bit_rogue Phantom Clone normal attacks do not fire projectiles");
      h.player.cloneTime = 0;
    }

    // Diagonal up-left aiming (-3*PI/4) keeps upward local pitch for Painter (toY(1, 0) = -sin(angle) < 0 when flip=true)
    h.player.atkCd = 0;
    h.player.comboStep = 0;
    h.player.aimAngle = -Math.PI * 0.75;
    rec.live.length = 0;
    h.combat.performPrimaryAttack(h.ctx);
    if (cls.id === "prism_knight" || cls.id === "bit_rogue") {
      const angOut = (rec.live[0].opts.angle as number) ?? 0;
      assert.equal(rec.live[0].opts.flip, true);
      assert.ok(angOut > 0 && Math.abs(angOut) < Math.PI / 2, "Up-left diagonal mirrors Painter upward (-sin(angOut) < 0)");
    }

    h.ctx.projectiles.length = 0;
    h.player.stamina = 100;
    h.player.aimAngle = Math.PI;
    h.combat.performChargedAttack(h.ctx, false);
    assert.equal(h.player.attackAnimKind, expectedCharge[cls.id], `${cls.id} Charged uses synchronized pose`);
    if (cls.id === "bit_rogue") {
      assert.ok(h.ctx.projectiles.length >= 5, "bit_rogue Charged attack fires 5 shuriken fan projectiles");
      assert.ok(
        h.ctx.projectiles.every((p) => p.preset === "proj-shuriken"),
        "bit_rogue Charged fan projectiles all use proj-shuriken"
      );
    }

    h.player.skillCd = 0;
    h.combat.performSkillE(h.ctx);
    if (cls.id !== "bit_rogue") {
      assert.ok(h.player.attackAnimTime > 0, `${cls.id} [E] triggers active cast/beam pose`);
    } else {
      assert.ok(h.player.dashing > 0, "bit_rogue [E] triggers dash lunge");
    }

    h.player.overdrive = 100;
    h.combat.performUltimateQ(h.ctx);
    if (cls.id === "prism_knight") {
      assert.ok(h.player.stormTime > 2.5, "prism_knight [Q] activates whirlwind storm pose");
    } else {
      assert.equal(h.player.attackAnimKind, "cast_ult", `${cls.id} [Q] triggers synchronized ultimate pose`);
    }
  }

  // 3. Multi-phase keyframes produce visibly distinct pixelfx baked skeletons across swing progress
  const eqK = getClassShowcaseEquipment("prism_knight");
  const p0 = getOrBakePixelfxHero("prism_knight", eqK, "attack", 0, 1, "right", 0.62, {
    attackKind: "cleave",
    attackProgress: 0.05,
  });
  const p1 = getOrBakePixelfxHero("prism_knight", eqK, "attack", 0, 1, "right", 0.62, {
    attackKind: "cleave",
    attackProgress: 0.45,
  });
  const p2 = getOrBakePixelfxHero("prism_knight", eqK, "attack", 0, 1, "right", 0.62, {
    attackKind: "cleave",
    attackProgress: 0.92,
  });
  let diff01 = 0;
  let diff12 = 0;
  for (let i = 0; i < p0.actor.pixels.length; i++) {
    if (p0.actor.pixels[i] !== p1.actor.pixels[i]) diff01++;
    if (p1.actor.pixels[i] !== p2.actor.pixels[i]) diff12++;
  }
  assert.ok(diff01 > 20 && diff12 > 20, `Cleave keyframes animate sharply (${diff01}px, ${diff12}px changed)`);
});

// ============================================================================
// 10. 10 REFERENCE MONSTER MODELS, 4-DIRECTION ATLAS & SYNCHRONIZED SKILL VFX
// ============================================================================
runTest("19 Reference Monster Models, 4-Direction Atlas & Synchronized Enemy Skill VFX", () => {
  const refMonsterIds = [
    "null_slime",
    "ash_hopper",
    "thorn_archer",
    "root_golem",
    "boss_xing_warden",
    "bleach_hound",
    "quartz_stalker",
    "static_imp",
    "quartz_knight",
    "boss_blight_root",
    "cinder_imp",
    "amber_beetle",
    "amber_warrior",
    "boss_gilded_null",
    "void_wraith",
    "prism_golem",
    "null_knight",
    "void_gatekeeper",
    "boss_the_eraser",
  ] as const;

  const frames = codixelEnemiesMeta.frames as Record<string, { x: number; y: number; w: number; h: number; anchorY: number }>;
  const monsters = codixelEnemiesMeta.monsters as Record<string, { w: number; h: number; floating: boolean }>;

  assert.equal(
    Object.keys(frames).length,
    306,
    "Enemy sprite atlas contains 306 HD multi-frame sprites (19x4x4 with :atk strike frames + 2 special poses)"
  );
  assert.equal(Object.keys(ENEMIES).length, 19, "All 19 enemies & bosses across all 4 biomes are registered");
  for (const id of refMonsterIds) {
    assert.ok(monsters[id] && monsters[id].w >= 28 && monsters[id].h >= 26, `${id} registered in sharpened HD codixel-enemies metadata`);
    for (const dir of ["front", "right", "left", "back"] as const) {
      const f = frames[`${id}:${dir}`];
      const f1 = frames[`${id}:${dir}:1`];
      const f2 = frames[`${id}:${dir}:2`];
      const fAtk = frames[`${id}:${dir}:atk`];
      assert.ok(f && f.w > 0 && f.h > 0 && f.anchorY === f.h, `${id}:${dir} has valid grounded frame rect`);
      assert.ok(f1 && f1.w === f.w && f1.h === f.h, `${id}:${dir}:1 animation frame present`);
      assert.ok(f2 && f2.w === f.w && f2.h === f.h, `${id}:${dir}:2 animation frame present`);
      assert.ok(fAtk && fAtk.w === f.w && fAtk.h === f.h, `${id}:${dir}:atk strike animation frame present`);
    }
    assert.ok(ENEMIES[id], `${id} exists in ENEMIES`);
    assert.ok(ENEMY_DROP_TABLES[id], `${id} exists in ENEMY_DROP_TABLES`);
    assert.ok(
      WORLD_CAMPS.some((c) => c.enemies.some((en) => en.typeId === id)),
      `${id} spawns inside WORLD_CAMPS`
    );
  }
  assert.ok(frames["null_slime:slam"] && frames["ash_hopper:roll"], "Special attack pose frames (slam, roll) baked cleanly");

  // Verify 4 new bespoke pixelfx modules & color-accurate presets execute without errors
  for (const modId of ["pixtel/sonic-wave", "pixtel/leaf-storm", "pixtel/rainbow-burst", "pixtel/hex-shield"] as const) {
    const mod = PIXELFX_MODS[modId];
    assert.ok(mod, `${modId} registered in PIXELFX_MODS`);
    const ox = mod.meta.origin?.[0] ?? 0;
    const oy = mod.meta.origin?.[1] ?? 0;
    const fr = createFrame(mod.meta.size[0], mod.meta.size[1], -ox, -oy);
    const fx = createFx(mod, { x: 0, y: 0 });
    fx.update(0.22);
    fx.draw(fr);
    let nonZero = 0;
    for (let i = 0; i < fr.color.length; i++) {
      if (fr.color[i] !== 0) nonZero++;
    }
    assert.ok(nonZero > 40, `${modId} renders crisp pixels (${nonZero}px drawn)`);
  }
  for (const preset of [
    "ground-slam-nature",
    "ground-slam-fire",
    "ground-slam-void",
    "dirt-puff",
    "parry-cyan",
    "parry-poison",
    "muzzle-poison",
    "muzzle-fire",
    "muzzle-void",
    "proj-emerald",
  ] as const) {
    assert.ok(ATLAS_PRESETS[preset], `ATLAS_PRESETS[${preset}] exists`);
  }

  // Test synchronized combat skills, left-facing VFX orientation & animKinds across all 10 monsters
  const expectedSkills: Record<string, { first: string; second: string; hasLeftMeleeVfx?: boolean }> = {
    null_slime: { first: "leap_slam", second: "spit_moss" },
    ash_hopper: { first: "roll_charge", second: "shell_burst" },
    thorn_archer: { first: "thorn_shot", second: "thorn_shot" },
    root_golem: { first: "root_whip", second: "quake_slam", hasLeftMeleeVfx: true },
    bleach_hound: { first: "dive_slash", second: "sonic_wave", hasLeftMeleeVfx: true },
    quartz_stalker: { first: "claw_clamp", second: "claw_clamp", hasLeftMeleeVfx: true },
    static_imp: { first: "thin_laser", second: "refract_split" },
    quartz_knight: { first: "halberd_sweep", second: "crystal_lunge", hasLeftMeleeVfx: true },
  };

  for (const [id, spec] of Object.entries(expectedSkills)) {
    const h = makeTestHarness("prism_knight");
    const rec = { live: [] as MockVfxCall[], pooled: [] as MockVfxCall[] };
    h.ctx.vfx = createMockVfx(rec);
    const e = spawnDummyEnemy(h.spawner, h.player.x + 48, h.player.y, id); // Player is strictly LEFT of enemy!
    e.aiTimer = 0;
    h.combat.update(h.ctx, 0.016);
    assert.equal(e.facingDir, "left", `${id} locks facingDir=left when attacking player to its left`);
    assert.equal(e.animKind, spec.first, `${id} triggers first synchronized skill (${spec.first})`);
    assert.ok(e.animTime > 0.25, `${id} keeps active attack animation timer`);

    if (spec.hasLeftMeleeVfx) {
      assert.ok(rec.live.length >= 1, `${id} spawns pixelfx melee overlay on strike`);
      assert.equal(rec.live[0].opts.flip, true, `${id} left-facing melee VFX mirrors horizontally`);
      assert.ok(Math.abs((rec.live[0].opts.angle as number) ?? 0) < Math.PI / 2, `${id} melee VFX stays upright`);
      assert.equal(rec.live[0].opts.follow, e, `${id} melee VFX follows enemy`);
    }

    // Trigger second skill in cycle
    e.animTime = 0;
    e.dashTime = 0;
    e.aiTimer = 0;
    h.combat.update(h.ctx, 0.016);
    assert.equal(e.animKind, spec.second, `${id} cycles cleanly to second skill (${spec.second})`);
  }

  // Test null_slime phase-locked leap_slam landing & spit_moss projectile-synced moss_pool
  {
    const h = makeTestHarness("prism_knight");
    const rec = { live: [] as MockVfxCall[], pooled: [] as MockVfxCall[] };
    h.ctx.vfx = createMockVfx(rec);
    const slime = spawnDummyEnemy(h.spawner, h.player.x + 48, h.player.y, "null_slime");
    slime.aiTimer = 0;
    h.combat.update(h.ctx, 0.016);
    assert.equal(slime.animKind, "leap_slam");
    assert.equal(
      rec.pooled.some((c) => c.modId === "acid-splash"),
      false,
      "null_slime leap_slam does NOT trigger landing acid-splash prematurely at windup t=0"
    );
    for (let step = 0; step < 36; step++) {
      h.combat.update(h.ctx, 0.02);
    }
    assert.equal(
      rec.pooled.some((c) => c.modId === "acid-splash"),
      true,
      "null_slime leap_slam triggers landing acid-splash cleanly upon touching down"
    );

    // Next skill: spit_moss fires projectile without prematurely spawning moss_pool at player position
    rec.pooled.length = 0;
    slime.animTime = 0;
    slime.dashTime = 0;
    slime.aiTimer = 0;
    const hazardsBefore = h.ctx.hazards.length;
    h.combat.update(h.ctx, 0.016);
    assert.equal(slime.animKind, "spit_moss");
    assert.equal(h.ctx.hazards.length, hazardsBefore, "spit_moss waits until projectile lands/expires before creating moss_pool");
    assert.ok(rec.pooled.some((c) => c.modId === "muzzle-poison"), "spit_moss emits muzzle-poison effect");
    for (let step = 0; step < 50; step++) {
      h.combat.update(h.ctx, 0.02);
    }
    assert.ok(
      h.ctx.hazards.some((hz) => hz.kind === "moss_pool"),
      "spit_moss projectile spawns moss_pool on landing/expiry"
    );
  }

  // Test signature custom VFX + nature ground slam + hex-shield + parry-cyan
  {
    const h = makeTestHarness("prism_knight");
    const rec = { live: [] as MockVfxCall[], pooled: [] as MockVfxCall[] };
    h.ctx.vfx = createMockVfx(rec);
    const golem = spawnDummyEnemy(h.spawner, h.player.x + 48, h.player.y, "root_golem");
    golem.skillCycle = 1;
    golem.aiTimer = 0;
    h.combat.update(h.ctx, 0.016);
    const natureSlam = h.ctx.hazards.find((hz) => hz.kind === "boss_slam");
    assert.equal(natureSlam?.vfxPreset, "ground-slam-nature", "root_golem quake_slam uses emerald nature shockwave");

    const bat = spawnDummyEnemy(h.spawner, h.player.x + 52, h.player.y, "bleach_hound");
    bat.skillCycle = 1;
    bat.aiTimer = 0;
    h.combat.update(h.ctx, 0.016);
    assert.ok(rec.live.some((c) => c.modId === "pixtel/sonic-wave"), "bleach_hound emits pixtel/sonic-wave rings");

    const crab = spawnDummyEnemy(h.spawner, h.player.x + 36, h.player.y, "quartz_stalker");
    crab.skillCycle = 0;
    crab.aiTimer = 0;
    h.combat.update(h.ctx, 0.016);
    assert.ok(rec.pooled.some((c) => c.modId === "parry-cyan"), "quartz_stalker claw_clamp bursts blazing parry-cyan cross-star");
  }

  // Test shield guard mitigation & hex-shield live dome (Root Golem Bark Shield & Quartz Crab Shield)
  for (const shieldId of ["root_golem", "quartz_stalker"] as const) {
    const h = makeTestHarness("prism_knight");
    const rec = { live: [] as MockVfxCall[], pooled: [] as MockVfxCall[] };
    h.ctx.vfx = createMockVfx(rec);
    const e = spawnDummyEnemy(h.spawner, h.player.x + 36, h.player.y, shieldId);
    e.bleachShield = 0;
    e.skillCycle = 2; // Jumps directly to bark_shield / quartz_shield
    e.aiTimer = 0;
    h.combat.update(h.ctx, 0.016);
    assert.ok(e.guardTime > 2.0, `${shieldId} activates synchronized defensive guardTime`);
    assert.ok(rec.live.some((c) => c.modId === "impacts/shield-block"), `${shieldId} spawns shield-block VFX`);
    assert.ok(rec.live.some((c) => c.modId === "pixtel/hex-shield"), `${shieldId} spawns pixtel/hex-shield barrier`);

    const hpBeforeGuard = e.hp;
    h.combat.damageEnemy(h.ctx, e, 100, false, "hit-cyan");
    const dmgGuarded = hpBeforeGuard - e.hp;

    e.guardTime = 0;
    e.hp = hpBeforeGuard;
    h.combat.damageEnemy(h.ctx, e, 100, false, "hit-cyan");
    const dmgUnguarded = hpBeforeGuard - e.hp;
    assert.ok(dmgGuarded < dmgUnguarded, `${shieldId} active shield mitigates damage (${dmgGuarded} < ${dmgUnguarded})`);
  }

  // Test Biome Main Bosses signature animations & custom storm VFX (Hộ Vệ Cổ Thụ & Rồng Lăng Kính)
  for (const bossId of ["boss_xing_warden", "boss_blight_root"] as const) {
    const h = makeTestHarness("prism_knight");
    const rec = { live: [] as MockVfxCall[], pooled: [] as MockVfxCall[] };
    h.ctx.vfx = createMockVfx(rec);
    const b = spawnDummyEnemy(h.spawner, h.player.x + 56, h.player.y, bossId);
    b.aiTimer = 0;
    b.specialTimer = 5;
    h.combat.update(h.ctx, 0.016);
    assert.equal(
      b.animKind,
      bossId === "boss_xing_warden" ? "emerald_orb" : "prism_breath",
      `${bossId} primary attack triggers synced signature pose`
    );

    b.animTime = 0;
    b.aiTimer = 5;
    b.specialTimer = 0;
    b.skillCycle = 1; // Trigger Leaf Storm / Rainbow Storm (center-locked front view)
    h.combat.update(h.ctx, 0.016);
    assert.equal(
      b.animKind,
      bossId === "boss_xing_warden" ? "leaf_storm" : "rainbow_storm",
      `${bossId} storm special triggers synced storm pose`
    );
    assert.equal(b.facingDir, "down", `${bossId} storm locks front-facing ring symmetry`);
    assert.ok(
      rec.live.some((c) => c.modId === (bossId === "boss_xing_warden" ? "pixtel/leaf-storm" : "pixtel/rainbow-burst")),
      `${bossId} spawns custom signature storm pixelfx`
    );
  }

  // Test Amber & Ruins monsters (including 3 new Amber/Ruins Mini-Bosses & Elites) + biome-specific enemy deaths
  {
    const expectedOther = [
      ["amber_beetle", "ember_cast", "claw_clamp", "explode-fire"],
      ["cinder_imp", "amber_roll", "ember_volley", "explode-fire"],
      ["amber_warrior", "molten_slam", "ember_cast", "explode-fire"],
      ["prism_golem", "void_barrage", "void_slam", "explode-void"],
      ["void_wraith", "void_blink", "dive_slash", "explode-void"],
      ["null_knight", "halberd_sweep", "crystal_lunge", "explode-void"],
      ["void_gatekeeper", "void_barrage", "quartz_shield", "explode-void"],
    ] as const;
    for (const [id, firstAnim, secondAnim, expectedDeath] of expectedOther) {
      const h = makeTestHarness("prism_knight");
      const rec = { live: [] as MockVfxCall[], pooled: [] as MockVfxCall[] };
      h.ctx.vfx = createMockVfx(rec);
      const e = spawnDummyEnemy(h.spawner, h.player.x + 50, h.player.y, id);
      e.aiTimer = 0;
      h.combat.update(h.ctx, 0.016);
      assert.equal(e.animKind, firstAnim, `${id} runs synchronized first skill pose (${firstAnim})`);

      e.animTime = 0;
      e.dashTime = 0;
      e.aiTimer = 0;
      h.combat.update(h.ctx, 0.016);
      assert.equal(e.animKind, secondAnim, `${id} cycles cleanly to second skill pose (${secondAnim})`);

      if (id === "void_gatekeeper") {
        assert.ok(e.guardTime > 2.0, "void_gatekeeper Khiên Nhiễu Trắng activates guardTime");
        assert.ok(rec.live.some((c) => c.modId === "pixtel/hex-shield"), "void_gatekeeper spawns hex-shield VFX");
        e.animTime = 0;
        e.aiTimer = 0;
        h.combat.update(h.ctx, 0.016);
        assert.equal(e.animKind, "thin_laser", "void_gatekeeper cycles to Tia Hư Vô beam");
      }

      if (id === "amber_warrior") {
        e.animTime = 0;
        e.aiTimer = 0;
        h.combat.update(h.ctx, 0.016);
        assert.equal(e.animKind, "ember_volley", "amber_warrior cycles to Cuồng Nộ Hổ Phách");
        assert.ok(e.enrageBuffTime > 4.0, "amber_warrior Cuồng Nộ Hổ Phách grants enrageBuffTime");
      }

      rec.pooled.length = 0;
      rec.live.length = 0;
      h.combat.damageEnemy(h.ctx, e, 999999, false, "hit-cyan");
      assert.ok(rec.pooled.some((c) => c.modId === expectedDeath), `${id} death emits biome-specific ${expectedDeath}`);
    }

    // Verify Amber Boss (Chúa Tể Hổ Phách) & Ruins Boss (The Eraser) signature moves
    for (const [bossId, firstAnim, secondAnim] of [
      ["boss_gilded_null", "claw_clamp", "ember_volley"],
      ["boss_the_eraser", "void_barrage", "thin_laser"],
    ] as const) {
      const h = makeTestHarness("prism_knight");
      const rec = { live: [] as MockVfxCall[], pooled: [] as MockVfxCall[] };
      h.ctx.vfx = createMockVfx(rec);
      const b = spawnDummyEnemy(h.spawner, h.player.x + 54, h.player.y, bossId);
      b.aiTimer = 0;
      b.specialTimer = 5;
      h.combat.update(h.ctx, 0.016);
      assert.equal(b.animKind, firstAnim, `${bossId} triggers first signature boss attack (${firstAnim})`);
      b.animTime = 0;
      b.dashTime = 0;
      b.aiTimer = 0;
      h.combat.update(h.ctx, 0.016);
      assert.equal(b.animKind, secondAnim, `${bossId} alternates to second signature boss attack (${secondAnim})`);
    }
  }
});

// =========================================================================
// 11. HIDDEN ITEMS (CRAFT-ONLY & BOSS-DROP ONLY)
// =========================================================================
runTest("Hidden Items: exclusivity, Craft-Only, Boss-Only, unlocks & stats", () => {
  const allHidden = Object.values(HIDDEN_ITEMS);
  assert.ok(allHidden.length >= 6, `At least 6 hidden items exist (${allHidden.length})`);
  assert.ok(
    allHidden.every((it) => it.isHidden && (it.rarity === "epic" || it.rarity === "legendary")),
    "All hidden items are Epic or Legendary with isHidden: true"
  );

  const craftOnly = allHidden.filter((it) => it.hiddenSource === "craft_only");
  const bossOnly = allHidden.filter((it) => it.hiddenSource === "boss_only");
  assert.ok(craftOnly.length >= 3 && bossOnly.length >= 3, "Both craft_only and boss_only sources exist");

  // 1. Zero leakage into shop, random chest/equip rolls, or normal mob loot tables
  for (const id of MERCHANT_STOCK) {
    assert.ok(!ITEMS[id]?.isHidden, `Merchant stock item ${id} must not be hidden`);
  }
  for (const r of ["common", "uncommon", "rare", "epic", "legendary"] as const) {
    for (let i = 0; i < 40; i++) {
      const rolledId = pickRandomEquipByRarity(r);
      assert.ok(!ITEMS[rolledId]?.isHidden, `pickRandomEquipByRarity(${r}) never returns hidden item (${rolledId})`);
    }
  }
  for (const [mobId, table] of Object.entries(ENEMY_DROP_TABLES)) {
    const entries = [...(table.guaranteed ?? []), ...table.rolls];
    for (const entry of entries) {
      assert.ok(!ITEMS[entry.itemId]?.isHidden, `Mob ${mobId} loot table never leaks hidden item ${entry.itemId}`);
    }
  }

  // 2. Craft-Only level & material enforcement via ForgeSystem
  const forge = new ForgeSystem();
  const inv = new InventorySystem();
  inv.resetStarterKit();
  inv.gold = 5000;
  for (const rec of HIDDEN_CRAFT_RECIPES) {
    for (const m of rec.materials) inv.addItem(m.defId, m.qty);
  }
  const crownRec = HIDDEN_CRAFT_RECIPES.find((r) => r.resultDefId === "hid_craft_aethel_crown")!;
  assert.ok(crownRec && (crownRec.requiredLevel ?? 0) > 1, "Hidden craft recipe has requiredLevel");
  const lowLvCheck = forge.canCraft(crownRec, inv, 1);
  assert.equal(lowLvCheck.ok, false, "Forge rejects hidden craft when player level is below requiredLevel");
  const craftRes = forge.craftRecipe(crownRec.id, inv, 15);
  assert.equal(craftRes.ok, true, "Forge crafts hidden item when level & materials are satisfied");
  assert.ok(inv.bag.some((b) => b.defId === "hid_craft_aethel_crown"), "Crafted hidden item is added to bag");

  // 3. Boss-Only guaranteed first-kill drop & special rainbow-burst + waypoint-pillar VFX
  const firstEraserDrops = rollBossHiddenDrops("boss_the_eraser", false);
  assert.ok(
    firstEraserDrops.some((d) => d.itemId === "hid_boss_eraser_edge"),
    "First kill of The Eraser guarantees hid_boss_eraser_edge"
  );

  const h = makeTestHarness("prism_knight");
  const rec = { live: [] as MockVfxCall[], pooled: [] as MockVfxCall[] };
  h.ctx.vfx = createMockVfx(rec);
  const defeatedBossIds = new Set<string>();
  h.ctx.defeatedBossIds = defeatedBossIds;
  const warden = spawnDummyEnemy(h.spawner, h.player.x + 40, h.player.y, "boss_xing_warden");
  h.combat.damageEnemy(h.ctx, warden, 999999, false, "hit-cyan");
  assert.ok(
    h.spawner.groundLoot.some((l) => l.item?.defId === "hid_boss_warden_mantle"),
    "Defeating boss_xing_warden spawns its exclusive boss_only hidden armor"
  );
  assert.ok(
    rec.live.some((c) => c.modId === "pixtel/rainbow-burst") &&
      rec.pooled.some((c) => c.modId === "waypoint-pillar"),
    "Boss hidden drop triggers rainbow-burst & waypoint-pillar VFX"
  );
  assert.ok(defeatedBossIds.has("boss_xing_warden"), "Boss defeat is tracked for first-kill guarantee");

  // 4. Permanent localStorage unlock persistence via SaveSystem
  const saveSys = new SaveSystem();
  saveSys.clearHiddenUnlocks();
  saveSys.saveHiddenUnlocks(["hid_craft_aethel_crown", "hid_boss_warden_mantle"]);
  const loadedUnlocks = saveSys.loadHiddenUnlocks();
  assert.ok(
    loadedUnlocks.includes("hid_craft_aethel_crown") && loadedUnlocks.includes("hid_boss_warden_mantle"),
    "Hidden item unlocks persist cleanly in localStorage"
  );

  // 5. Equipping hidden items updates recalculatePlayerStats() & passive flags
  const h2 = makeTestHarness("prism_knight");
  const baseAtk = h2.player.atk;
  h2.inv.addItem("hid_boss_eraser_edge", 1, 0);
  h2.inv.addItem("hid_craft_aethel_crown", 1, 0);
  h2.inv.addItem("hid_craft_siphon_sigil", 1, 0);
  for (const id of ["hid_boss_eraser_edge", "hid_craft_aethel_crown", "hid_craft_siphon_sigil"]) {
    const inst = h2.inv.bag.find((b) => b.defId === id)!;
    h2.inv.equipFromBag(inst.uid, h2.player.classId);
  }
  recalculatePlayerStats(h2.player, h2.inv, false);
  assert.ok(h2.player.atk > baseAtk + 50, "Equipping hidden items significantly raises total ATK");
  assert.equal(h2.player.hasRestoredPrismSurge, true, "hid_boss_eraser_edge enables hasRestoredPrismSurge");
  assert.equal(h2.player.hasSetResonance, true, "hid_craft_aethel_crown enables hasSetResonance");
  assert.equal(h2.player.hasEnergySiphon, true, "hid_craft_siphon_sigil enables hasEnergySiphon");
});

// ============================================================================
// 12. PHASE 1: MOBILE TWIN-STICK TOUCH, OUTER-RING SPRINT & SMART AUTO-AIM
// ============================================================================
runTest("Phase 1 Mobile Twin-Stick Touch, Outer-Ring Sprint, Smart Auto-Aim & Hold Just-Charge", () => {
  const uiStub = {
    onHudUpdate: () => {},
    onModalChange: () => {},
    onToast: () => {},
    onBossVictory: () => {},
  };
  const g = new PixTelOpenWorldGame(makeMockCanvas() as unknown as HTMLCanvasElement, uiStub);
  g.startNewGame("prism_knight", false);
  g.inv.addItem("wpn_starter", 1, 0);
  g.inv.addItem("acc_wind_feather", 1, 0);
  g.inv.equipBestForClass("prism_knight");
  g.recalcPlayerStats(false);
  g.mobileMode = true;

  // 1. Virtual Analog Joystick + Outer-Ring Auto-Sprint
  const startX = g.player.x;
  const startStam = g.player.stamina;
  g.touchMoveX = 0.92;
  g.touchMoveY = 0;
  g.touchSprint = true;
  g.step(0.08);
  assert.ok(g.player.x > startX + 3, "Mobile analog joystick moves hero smoothly along X");
  assert.equal(g.player.sprinting, true, "Outer-ring joystick tilt activates Sprint");
  assert.ok(g.player.stamina < startStam, "Mobile sprint consumes Stamina wheel");
  g.touchMoveX = 0;
  g.touchSprint = false;

  // 2. Smart Auto-Aim Priority: Unlit Arena Totem > Boss/Enemy > Ore Node
  g.spawner.enemies.length = 0;
  g.spawner.arenaTotems.length = 0;
  const mob = spawnDummyEnemy(g.spawner, g.player.x + 60, g.player.y + 60, "null_slime");
  g.spawner.arenaTotems.push({
    uid: 901,
    element: "fire",
    x: g.player.x,
    y: g.player.y - 64,
    lit: false,
    hitFlash: 0,
  });

  const totemAim = g.computeAutoAimAngle();
  assert.ok(totemAim !== null && Math.abs(totemAim - -Math.PI / 2) < 0.05, "Smart Auto-Aim prioritizes unlit Arena Totem");

  g.spawner.arenaTotems[0].lit = true;
  const mobAim = g.computeAutoAimAngle();
  assert.ok(mobAim !== null && Math.abs(mobAim - Math.PI / 4) < 0.05, "Smart Auto-Aim locks onto nearest enemy when totems are lit");
  assert.equal(g.autoAimTargetUid, mob.uid, "Smart Auto-Aim records target enemy UID for HUD reticle");

  // 3. Mobile Tap Combo -> Hold & Release Golden Just-Charge -> Dash / [E] / [Q]
  mob.x = g.player.x + 24;
  mob.y = g.player.y;
  const mobStartHp = mob.hp;
  g.player.atkCd = 0;
  g.mobileStartAttack();
  g.mobileEndAttack();
  assert.ok(mob.hp < mobStartHp, "Mobile tap attack auto-aims and deals combo damage");

  g.player.atkCd = 0;
  g.player.quickChargeTimer = 0;
  g.player.stamina = 100;
  g.mobileStartAttack();
  // Step 0.56s into Golden Just-Charge Lv2 window ([0.50s .. 0.72s]) then release!
  for (let i = 0; i < 14; i++) g.step(0.04);
  g.mobileEndAttack();
  g.step(0.02);
  assert.equal(
    g.player.attackAnimKind,
    "overhead_slam",
    "Releasing mobile hold attack inside Just-Charge window fires Paladin Overhead Slam (distinct from Tinker beam!)"
  );

  g.player.dashCd = 0;
  g.player.stamina = 100;
  g.mobileDash();
  assert.ok(g.player.dashing > 0, "Mobile Dash button triggers Chroma Dodge i-frames");

  g.player.skillCd = 0;
  g.mobileSkillE();
  assert.ok(g.player.skillCd > 0, "Mobile [E] button casts Class Skill with Smart Auto-Aim");

  g.player.overdrive = 100;
  g.mobileUltQ();
  assert.equal(g.player.overdrive, 0, "Mobile [Q] button unleashes Class Ultimate");
});

// ============================================================================
// 14. PIXEL HUD BACKPACK & SKILL ICONS, 29 FARM ZONES & 3D SPECIAL GEAR MODELS
// ============================================================================
runTest("Pixel Backpack & Skill Icons, 29 Farm Spawn Zones & Bespoke 3D Special Gear Models", () => {
  const frames = codixelIconsMeta.frames as Record<string, { x: number; y: number; w: number; h: number }>;

  // 1. Verify all 16 HUD backpack & class skill pixel icons exist in codixel-icons.json
  const requiredHudIcons = [
    "ui_backpack",
    "ui_lock",
    "skill_unarmed",
    "skill_dash",
    "skill_knight_lmb",
    "skill_knight_e",
    "skill_knight_q",
    "skill_mage_lmb",
    "skill_mage_e",
    "skill_mage_q",
    "skill_rogue_lmb",
    "skill_rogue_e",
    "skill_rogue_q",
    "skill_tinker_lmb",
    "skill_tinker_e",
    "skill_tinker_q",
  ];
  for (const key of requiredHudIcons) {
    assert.ok(frames[key], `HUD/Skill pixel icon '${key}' must exist in codixel-icons.json`);
  }

  // 2. Verify EVERY item with a spriteKey resolves to a real frame in codixel-icons.json
  for (const item of Object.values(ITEMS)) {
    if (item.spriteKey) {
      assert.ok(
        frames[item.spriteKey],
        `Item '${item.id}' spriteKey '${item.spriteKey}' must exist in codixel-icons.json`
      );
    }
  }

  // 3. Verify all 4 classes now have Legendary Hidden Craft Weapons & strictly class-locked
  const mythicByClass: Record<ClassId, string> = {
    prism_knight: "hid_craft_prism_blade",
    chroma_mage: "hid_craft_nebula_staff",
    bit_rogue: "hid_craft_eclipse_fangs",
    pixel_tinker: "hid_craft_nova_railgun",
  };
  for (const [cid, itemId] of Object.entries(mythicByClass) as [ClassId, string][]) {
    const def = ITEMS[itemId];
    assert.ok(def && def.isHidden && def.rarity === "legendary", `Mythic hidden weapon ${itemId} exists`);
    assert.equal(def.requiredClass, cid, `${itemId} is strictly locked to ${cid}`);
    assert.equal(canClassEquip(def, cid), true, `${cid} can equip ${itemId}`);
    for (const other of ["prism_knight", "chroma_mage", "bit_rogue", "pixel_tinker"] as ClassId[]) {
      if (other !== cid) {
        assert.equal(canClassEquip(def, other), false, `${other} cannot equip ${itemId}`);
      }
    }
  }

  // 4. Verify expanded 29 WORLD_CAMPS (all 4 biomes >= 6 camps, none inside Origin Town, all walkable)
  assert.ok(WORLD_CAMPS.length >= 28, `WORLD_CAMPS expanded for combat farming (got ${WORLD_CAMPS.length})`);
  const world = new WorldMap();
  const byBiome: Record<string, number> = { meadow: 0, quartz: 0, amber: 0, ruins: 0 };
  for (const camp of WORLD_CAMPS) {
    byBiome[camp.biome] = (byBiome[camp.biome] ?? 0) + 1;
    const inTown =
      camp.tx >= TOWN_BOUNDS.x0 &&
      camp.tx <= TOWN_BOUNDS.x1 &&
      camp.ty >= TOWN_BOUNDS.y0 &&
      camp.ty <= TOWN_BOUNDS.y1;
    assert.equal(inTown, false, `Farm camp ${camp.id} must not spawn inside Origin Town`);
    assert.equal(
      world.isBlocked(camp.tx * TILE_SIZE + 8, camp.ty * TILE_SIZE + 8, 4),
      false,
      `Farm camp ${camp.id} must sit on walkable terrain`
    );
  }
  for (const b of ["meadow", "quartz", "amber", "ruins"]) {
    assert.ok(byBiome[b] >= 6, `Biome ${b} has at least 6 spawn zones (got ${byBiome[b]})`);
  }

  // 5. Verify bespoke 3D pixelfx weapon, headgear & backAccessory models render cleanly
  const newWeapons = ["prism_blade", "null_sever", "greataxe", "astral_staff", "twin_quantum", "rail_cannon"];
  const newHeadgears = ["dragon_helm", "royal_crown", "antler_crest"] as const;
  const newBacks = ["prism_wings", "warden_roots", "amber_thrusters"] as const;
  for (const wpn of newWeapons) {
    const out = (posedStyled as (p: Record<string, unknown>, t: Record<string, unknown>, s: number) => { n: number })(
      { weapon: wpn, offWeapon: wpn === "twin_quantum" ? wpn : undefined, fx: 8, fy: -18 },
      { headgear: "dragon_helm", backAccessory: "prism_wings" },
      0.62
    );
    assert.ok(out.n > 80, `3D weapon model '${wpn}' renders cleanly (pixels=${out.n})`);
  }
  for (const hg of newHeadgears) {
    for (const bk of newBacks) {
      const out = (posedStyled as (p: Record<string, unknown>, t: Record<string, unknown>, s: number) => { n: number })(
        { weapon: "prism_blade", fx: 6, fy: -16 },
        { headgear: hg, backAccessory: bk },
        0.62
      );
      assert.ok(out.n > 80, `3D gear combo '${hg}' + '${bk}' renders cleanly (pixels=${out.n})`);
    }
  }
});

// ============================================================================
// 15. PIXTEL v3.0: WEAPON-SPECIFIC SKILLS, 16 EXOTIC DROPS, 4 BOSS CHESTS & GACHA
// ============================================================================
runTest("PIXTEL v3.0: Weapon-Specific [E] Skills, 16 Exotic Drop-Only Gear, 4 Boss Chests & Seasonal Gacha", () => {
  const iconFrames = codixelIconsMeta.frames as Record<string, { x: number; y: number; w: number; h: number }>;

  // 1. Every weapon resolves to a valid Weapon Skill with a real codixel iconKey
  let weaponCount = 0;
  for (const def of Object.values(ITEMS)) {
    if (def.category === "equipment" && def.slot === "weapon") {
      weaponCount++;
      const ws = getWeaponSkillForItem(def.id);
      assert.ok(ws && WEAPON_SKILLS[ws.id], `Weapon ${def.id} resolves to registered WeaponSkill`);
      assert.ok(iconFrames[ws.iconKey], `WeaponSkill ${ws.id} iconKey '${ws.iconKey}' exists in codixel-icons.json`);
    }
  }
  assert.ok(weaponCount >= 40, `All ${weaponCount} weapons mapped to Weapon Skills`);

  // Swapping weapons within the same Class dynamically changes [E] Skill, Icon & Execution!
  const kH = makeTestHarness("prism_knight");
  kH.spawner.enemies.length = 0;
  spawnDummyEnemy(kH.spawner, kH.player.x + 42, kH.player.y, "root_golem");

  const wsStarter = getWeaponSkillForItem(kH.inv.equipment.weapon?.defId);
  kH.inv.addItem("exo_wpn_blood_greatsword", 1, 0);
  const bloodUid = kH.inv.bag.find((b) => b.defId === "exo_wpn_blood_greatsword")!.uid;
  assert.equal(kH.inv.equipFromBag(bloodUid, "prism_knight").ok, true);
  const wsBlood = getWeaponSkillForItem(kH.inv.equipment.weapon?.defId);
  assert.notEqual(wsStarter.id, wsBlood.id, "Swapping weapon changes [E] Weapon Skill ID");
  assert.notEqual(wsStarter.iconKey, wsBlood.iconKey, "Swapping weapon changes [E] HUD pixel icon");

  kH.player.skillCd = 0;
  kH.player.hp = Math.floor(kH.player.maxHp * 0.5);
  const hpBeforeBlood = kH.player.hp;
  const golemBeforeBlood = kH.spawner.enemies[0]!.hp;
  kH.combat.performSkillE(kH.ctx);
  assert.ok(kH.player.skillCd > 0, "Exotic weapon skill enters weapon-specific cooldown");
  assert.ok(kH.spawner.enemies[0]!.hp < golemBeforeBlood, "Blood Greatsword [E] Crimson Reap cleaves target");
  assert.ok(kH.player.hp > hpBeforeBlood, "Blood Greatsword [E] Crimson Reap lifesteals +8% maxHp on hit");

  // 2. All 16 Exotic Skill-Altering Gear items are strictly Drop-Only (zero shop/craft/random leak!)
  const exoticList = Object.values(EXOTIC_ITEMS);
  assert.equal(exoticList.length, 16, "Exactly 16 Exotic Skill-Altering gear pieces registered");
  const allDropItemIds = new Set<string>();
  for (const tbl of Object.values(ENEMY_DROP_TABLES)) {
    for (const g of tbl.guaranteed ?? []) allDropItemIds.add(g.itemId);
    for (const r of tbl.rolls) allDropItemIds.add(r.itemId);
  }
  for (const ex of exoticList) {
    assert.equal(ex.dropOnly, true, `Exotic ${ex.id} must be dropOnly: true`);
    assert.equal(MERCHANT_STOCK.includes(ex.id), false, `Exotic ${ex.id} never appears in Merchant Shop`);
    assert.equal(
      FORGE_RECIPES.some((r) => r.resultDefId === ex.id),
      false,
      `Exotic ${ex.id} never appears in Forge Recipes`
    );
    assert.equal(allDropItemIds.has(ex.id), true, `Exotic ${ex.id} drops from monsters or bosses in ENEMY_DROP_TABLES`);
  }
  for (const r of ["common", "uncommon", "rare", "epic", "legendary"] as const) {
    for (let i = 0; i < 40; i++) {
      const rolled = pickRandomEquipByRarity(r);
      assert.ok(!ITEMS[rolled]?.dropOnly && !ITEMS[rolled]?.seasonalBannerId, `Random equip never leaks exotic/seasonal (${rolled})`);
    }
  }

  // Equip Exotic Armor/Helm/Boots -> verify exoticMods activate & mutate Dash / Combat!
  kH.inv.addItem("exo_helm_frost_gaze", 1, 0);
  kH.inv.addItem("exo_boots_quake_stompers", 1, 0);
  kH.inv.equipFromBag(kH.inv.bag.find((b) => b.defId === "exo_helm_frost_gaze")!.uid, "prism_knight");
  kH.inv.equipFromBag(kH.inv.bag.find((b) => b.defId === "exo_boots_quake_stompers")!.uid, "prism_knight");
  recalculatePlayerStats(kH.player, kH.inv, false);
  assert.equal(kH.player.exoticMods?.has("mod_dash_frost_nova"), true, "Frost Gaze helm activates mod_dash_frost_nova");
  assert.equal(kH.player.exoticMods?.has("mod_dash_quake_stomp"), true, "Quake Stompers boots activate mod_dash_quake_stomp");

  const golem = kH.spawner.enemies[0]!;
  golem.x = kH.player.x + 28;
  golem.y = kH.player.y;
  const golemHpBefore = golem.hp;
  kH.player.dashCd = 0;
  kH.player.stamina = 100;
  kH.combat.performDash(kH.ctx, 1, 0);
  assert.ok(golem.hp < golemHpBefore, "Exotic Dash mods deal Frost Nova & Quake Stomp damage on Dash");
  assert.ok((kH.player.exoticIcds?.mod_dash_frost_nova ?? 0) > 0, "Exotic mod enters balanced ICD after triggering");

  // 3. Map Chest Cleanup: ONLY 4 Boss Arena Main Chests remain on the open world map!
  const chestCamps = WORLD_CAMPS.filter((c) => c.hasLockedChest);
  assert.equal(chestCamps.length, 4, "Exactly 4 camps hold chests on the world map (Boss Arenas only)");
  assert.deepEqual(
    chestCamps.map((c) => c.id).sort(),
    ["camp_amber_boss", "camp_meadow_boss", "camp_quartz_boss", "camp_world_boss"],
    "Only the 4 regional & world Boss Arenas keep their main Boss Chest"
  );
  const freshSpawner = new WorldSpawner();
  freshSpawner.reset([]);
  assert.equal(freshSpawner.chests.length, 4, "WorldSpawner creates strictly 4 Boss Chests");

  // 4. 4 Biome Seasonal Keys drop from biome mobs, craft at Forge, & Gacha Altar is interactable
  const keyIds = Object.keys(GACHA_KEY_ITEMS);
  assert.equal(keyIds.length, 4, "4 Biome Gacha Keys registered");
  assert.equal(Object.keys(SEASONAL_ITEMS).length, 8, "8 Seasonal Gacha exclusive items registered");
  for (const kid of keyIds) {
    assert.equal(allDropItemIds.has(kid), true, `Biome key ${kid} drops from mobs/bosses`);
    assert.ok(GACHA_KEY_RECIPES.some((r) => r.resultDefId === kid), `Biome key ${kid} has a Forge crafting recipe`);
  }
  const nearAltar = findNearestInteractable(
    GACHA_ALTAR_POS.tx * TILE_SIZE + 8,
    GACHA_ALTAR_POS.ty * TILE_SIZE + 14,
    kH.colorSys,
    [],
    []
  );
  assert.equal(nearAltar?.kind, "gacha_altar", "Town Seasonal Gacha Altar is interactable via [F]");

  // 5. GachaSystem: Key gating, 1x & 5x rolls, Hard Pity 10/25, Duplicate Shard+Gold protection & Save persistence
  const gacha = new GachaSystem();
  const gInv = new InventorySystem();
  gInv.resetStarterKit("chroma_mage");

  const failRoll = gacha.roll("banner_winter", 1, gInv);
  assert.equal(failRoll.ok, false, "Gacha refuses roll without matching Biome Key");

  gInv.addItem("key_season_winter", 30);
  const roll5 = gacha.roll("banner_winter", 5, gInv);
  assert.equal(roll5.ok, true, "Gacha 5x Multi-Roll succeeds when holding 5+ Biome Keys");
  assert.equal(roll5.outcomes.length, 5);
  assert.equal(gInv.countItem("key_season_winter"), 25, "5x Roll consumes exactly 5 Biome Keys");

  // Roll remaining 25 keys -> guarantees at least 1 Featured Seasonal Jackpot via Hard Pity 25!
  let sawFeatured = roll5.outcomes.some((o) => o.featured);
  let sawDupConversion = roll5.outcomes.some((o) => o.isDuplicate && o.bonusShards > 0 && o.bonusGold > 0);
  for (let i = 0; i < 5; i++) {
    const r = gacha.roll("banner_winter", 5, gInv);
    assert.equal(r.ok, true);
    if (r.outcomes.some((o) => o.featured)) sawFeatured = true;
    if (r.outcomes.some((o) => o.isDuplicate && o.bonusShards > 0 && o.bonusGold > 0)) sawDupConversion = true;
  }
  assert.equal(sawFeatured, true, "Hard Pity 25 guarantees Featured Seasonal Jackpot within 30 rolls");
  assert.equal(sawDupConversion, true, "Duplicate equipment rolls auto-convert into Prism Shards + Gold");
  assert.equal(gacha.totalRolls, 30);
  assert.equal(GACHA_BANNERS.length, 4);

  // Verify Gacha state export/import round-trip
  const exported = gacha.exportState();
  const gacha2 = new GachaSystem();
  gacha2.importState(exported);
  assert.equal(gacha2.totalRolls, 30, "Gacha totalRolls persists across export/import");
  assert.equal(gacha2.history.length, 30, "Gacha roll history persists across export/import");
});

// ============================================================================
// 16. AUTO-SELL LOW-RARITY GEAR, BACKPACK EXPANSIONS (40->80) & SPAWN STASH CHEST
// ============================================================================
runTest("Auto-Sell Low-Rarity Gear, 4-Tier Backpack Upgrades (40->80 Slots) & Personal Spawn Stash Chest", () => {
  const iconFrames = codixelIconsMeta.frames as Record<string, { x: number; y: number; w: number; h: number }>;
  for (const key of ["ui_stash_chest", "ui_backpack_t1", "ui_backpack_t2", "ui_backpack_t3", "ui_backpack_t4"]) {
    assert.ok(iconFrames[key], `Codixel icon '${key}' exists in codixel-icons.json`);
  }

  // 1. Auto-Sell Low-Rarity Equipment with strict safety guards for Exotic / Hidden / Seasonal / Enhanced!
  const inv = new InventorySystem();
  inv.resetStarterKit("prism_knight");
  inv.setAutoSell("uncommon", false);

  const commonSwd = createItemInstance("wpn_starter", 1, 0);
  const uncommonSwd = createItemInstance("wpn_meadow_edge", 1, 0);
  const enhancedCommon = createItemInstance("wpn_starter", 1, 2); // +2 enhanced -> PROTECTED!
  const exoticWpn = createItemInstance("exo_wpn_blood_greatsword", 1, 0); // Exotic -> PROTECTED!
  const seasonalWpn = createItemInstance("sea_wpn_spring_katana", 1, 0); // Seasonal -> PROTECTED!
  const hiddenArm = createItemInstance("hid_boss_warden_mantle", 1, 0); // Hidden -> PROTECTED!

  assert.equal(inv.shouldAutoSell(commonSwd, "prism_knight"), true, "Auto-Sell <= Uncommon sells Common gear");
  assert.equal(inv.shouldAutoSell(uncommonSwd, "prism_knight"), true, "Auto-Sell <= Uncommon sells Uncommon gear");
  assert.equal(inv.shouldAutoSell(enhancedCommon, "prism_knight"), false, "Auto-Sell NEVER sells enhanced (+N) gear");
  assert.equal(inv.shouldAutoSell(exoticWpn, "prism_knight"), false, "Auto-Sell NEVER sells Exotic dropOnly gear");
  assert.equal(inv.shouldAutoSell(seasonalWpn, "prism_knight"), false, "Auto-Sell NEVER sells Seasonal Gacha gear");
  assert.equal(inv.shouldAutoSell(hiddenArm, "prism_knight"), false, "Auto-Sell NEVER sells Hidden Relics");

  const goldBeforeAuto = inv.gold;
  const soldRes = inv.tryAutoSellInstance(uncommonSwd, "prism_knight");
  assert.equal(soldRes.sold, true);
  assert.ok(soldRes.gold > 0 && inv.gold === goldBeforeAuto + soldRes.gold, "tryAutoSellInstance credits exact Gold");

  // Sweep existing bag items cleanly
  inv.addExistingInstance(commonSwd);
  inv.addExistingInstance(exoticWpn);
  const sweep = inv.sweepAutoSellBag("prism_knight");
  assert.equal(sweep.soldCount, 1, "sweepAutoSellBag sells only eligible low-rarity item");
  assert.equal(inv.bag.some((b) => b.defId === "exo_wpn_blood_greatsword"), true, "sweepAutoSellBag protects Exotic gear");

  // 2. 4-Tier Backpack Upgrades expanding Bag Capacity from 40 -> 80 slots!
  assert.equal(BACKPACK_UPGRADES.length, 4);
  assert.equal(inv.bagCapacity, 40);
  inv.gold = 100;
  assert.equal(inv.buyNextBackpackUpgrade().ok, false, "Cannot buy Backpack Tier 1 without 250G");

  inv.gold = 10000;
  for (let t = 1; t <= 4; t++) {
    const up = inv.buyNextBackpackUpgrade();
    assert.equal(up.ok, true, `Buying Backpack Tier ${t} succeeds`);
    assert.equal(inv.bagCapacity, 40 + t * 10, `Bag capacity expands to ${40 + t * 10}`);
  }
  assert.equal(inv.bagCapacity, 80);
  assert.equal(inv.getNextBackpackUpgrade(), null, "Maxed backpack returns null next upgrade");

  // Confirm bag actually accepts > 40 items (fill to 55!)
  for (let i = 0; i < 55; i++) {
    assert.equal(inv.addItem("wpn_starter", 1, 0), true, `Expanded bag accepts item #${i + 1}`);
  }
  assert.ok(inv.bag.length >= 55);

  // 3. Personal Storage Chest at Spawn (walkable, [F] interactable, deposit/withdraw/depositAllMaterials & persistence)
  const world = new WorldMap();
  const sx = STORAGE_CHEST_POS.tx * TILE_SIZE + 8;
  const sy = STORAGE_CHEST_POS.ty * TILE_SIZE + 8;
  assert.equal(world.isBlocked(sx, sy, 4), false, "Spawn Personal Stash Chest sits on walkable ground");
  const colorSys = new ColorRestorationSystem();
  colorSys.reset();
  const nearStash = findNearestInteractable(sx + 4, sy + 4, colorSys, [], []);
  assert.equal(nearStash?.kind, "stash_chest", "Personal Stash Chest at Spawn is interactable via [F]");

  const exoticUid = inv.bag.find((b) => b.defId === "exo_wpn_blood_greatsword")!.uid;
  assert.equal(inv.depositToStash(exoticUid).ok, true, "Depositing Exotic weapon into Personal Stash succeeds");
  assert.equal(inv.bag.some((b) => b.uid === exoticUid), false);
  assert.ok(inv.findInStash(exoticUid), "Deposited item is stored safely in stash");

  inv.addItem("mat_iron_ore", 12);
  inv.addItem("key_season_spring", 3);
  const movedMats = inv.depositAllMaterialsToStash();
  assert.equal(movedMats, 1, "Quick-deposit moves regular materials while keeping Seasonal Gacha Keys in bag");
  assert.equal(inv.countItem("key_season_spring"), 3, "Gacha keys stay in bag during quick material deposit");

  assert.equal(inv.withdrawFromStash(exoticUid).ok, true, "Withdrawing item from Stash returns it to bag");
  assert.equal(inv.bag.some((b) => b.uid === exoticUid), true);

  // Save/load state round-trip
  const inv2 = new InventorySystem();
  inv2.loadState(inv.gold, inv.equipment, inv.bag, {
    bagCapacity: inv.bagCapacity,
    backpackTier: inv.backpackTier,
    stash: inv.stash,
    autoSell: inv.autoSell,
  });
  assert.equal(inv2.bagCapacity, 80, "Expanded bagCapacity persists via loadState");
  assert.equal(inv2.backpackTier, 4, "backpackTier persists via loadState");
  assert.equal(inv2.autoSell.maxRarity, "uncommon", "autoSell setting persists via loadState");
  assert.equal(inv2.stash.length, inv.stash.length, "Personal Stash items persist via loadState");
  assert.equal(MAX_STASH_SLOTS, 80);
});

// =========================================================================
// 17. 16 CORE ITEMS, PASSIVES, 3-PIECE SET BONUSES, CURSED & HIDDEN FORGE
// =========================================================================
runTest("16 Core Items, Passives, 3-Piece Set Bonuses, Hidden Forge Recipes & Cursed Guards", () => {
  const iconFrames = codixelIconsMeta.frames as Record<string, unknown>;
  const core16List = Object.values(CORE_16_ITEMS);
  const coreMatsList = Object.values(CORE_MATERIALS);
  assert.equal(core16List.length, 16, "Exactly 16 core items registered");
  assert.equal(coreMatsList.length, 6, "Exactly 6 core Boss/Zone materials registered");

  // 1. Validate sprites, Vietnamese lore, class locks & weapon skills for all 16 items + 6 materials
  for (const def of [...core16List, ...coreMatsList]) {
    assert.ok(ITEMS[def.id], `${def.id} merged into ITEMS`);
    assert.ok(def.spriteKey && iconFrames[def.spriteKey], `${def.id} has valid codixel icon (${def.spriteKey})`);
  }
  for (const def of core16List) {
    assert.ok(def.lore && def.lore.trim().length > 10, `${def.id} has rich Vietnamese lore`);
    if (def.slot === "weapon") {
      assert.ok(def.requiredClass && def.requiredClass !== "all", `Weapon ${def.id} is class-locked`);
      assert.ok(getWeaponSkillForItem(def.id), `Weapon ${def.id} maps to a valid [E] skill`);
    }
  }

  // 2. Cursed item guard: ac_cracked_pact is never auto-sold
  const guardInv = new InventorySystem();
  guardInv.resetStarterKit("prism_knight");
  guardInv.setAutoSell("rare", true);
  const pactInst = createItemInstance("ac_cracked_pact", 1, 0);
  assert.equal(guardInv.shouldAutoSell(pactInst, "prism_knight"), false, "Cursed item is never auto-sold");

  // 3. Equip/unequip updates player stats & activates 2/3 and 3/3 Set Bonuses + Set Aura
  const h = makeTestHarness("bit_rogue");
  const fx = new ItemEffectSystem();
  h.ctx.itemEffects = fx;
  const baseAtk = h.player.atk;
  const baseHp = h.player.maxHp;

  h.inv.addItem("hm_moss_hood", 1, 0);
  h.inv.addItem("ar_briar_cloak", 1, 0);
  h.inv.addItem("wp_briar_dagger", 1, 0);
  const hoodUid = h.inv.bag.find((b) => b.defId === "hm_moss_hood")!.uid;
  const cloakUid = h.inv.bag.find((b) => b.defId === "ar_briar_cloak")!.uid;
  const dagUid = h.inv.bag.find((b) => b.defId === "wp_briar_dagger")!.uid;

  assert.equal(h.inv.equipFromBag(hoodUid, "bit_rogue").ok, true);
  assert.equal(h.inv.equipFromBag(cloakUid, "bit_rogue").ok, true);
  recalculatePlayerStats(h.player, h.inv, false);
  const twoPc = h.inv.getActiveSetBonuses("bit_rogue").find((s) => s.def.id === "set_forest");
  assert.ok(twoPc && twoPc.twoActive && !twoPc.threeActive, "Forest set activates (2/3) with 2 pieces");
  assert.equal(h.player.activeSetAuraColor, null, "No 3-piece aura at (2/3)");

  assert.equal(h.inv.equipFromBag(dagUid, "bit_rogue").ok, true);
  recalculatePlayerStats(h.player, h.inv, false);
  const threePc = h.inv.getActiveSetBonuses("bit_rogue").find((s) => s.def.id === "set_forest");
  assert.ok(threePc && threePc.threeActive, "Forest set activates (3/3) with 3 pieces");
  assert.equal(h.player.activeSetAuraColor, CORE_SET_BONUSES.set_forest.threePieceAuraColor, "3-piece aura color active");
  assert.ok(h.player.atk > baseAtk && h.player.maxHp > baseHp, "Equipping gear + set increases player stats");
  assert.equal(h.player.aspdPct, 27, "Dao Găm (+12% ASPD) + Set Rừng 3/3 (+15% ASPD) = +27% ASPD");

  assert.equal(h.inv.unequipSlot("weapon"), true);
  recalculatePlayerStats(h.player, h.inv, false);
  assert.equal(h.player.activeSetAuraColor, null, "Unequipping piece disables 3-piece aura");

  // 4. Combat passives & consumables verification
  // 4a. Bleed on Crit (wp_briar_dagger)
  h.inv.equipFromBag(dagUid, "bit_rogue");
  recalculatePlayerStats(h.player, h.inv, false);
  const targetA = spawnDummyEnemy(h.spawner, h.player.x + 24, h.player.y, "null_slime");
  targetA.maxHp = 9999;
  targetA.hp = 9999;
  fx.onHit(h.ctx, targetA, 40, true);
  fx.onHit(h.ctx, targetA, 40, true);
  assert.equal(targetA.bleedStacks, 2, "Crit with wp_briar_dagger stacks bleed");
  fx.update(h.ctx, 0.7, (t, d) => {
    t.hp -= d;
  });
  assert.ok(targetA.hp < 9999, "Bleed DOT ticks enemy HP down");

  // 4b. Chain Lightning every 3rd hit (wp_spark_staff)
  const mh = makeTestHarness("chroma_mage");
  const mfx = new ItemEffectSystem();
  mh.ctx.itemEffects = mfx;
  mh.inv.addItem("wp_spark_staff", 1, 0);
  mh.inv.equipFromBag(mh.inv.bag.find((b) => b.defId === "wp_spark_staff")!.uid, "chroma_mage");
  recalculatePlayerStats(mh.player, mh.inv, false);
  assert.equal(mh.player.mag, 16, "wp_spark_staff grants +16 MAG");
  const m1 = spawnDummyEnemy(mh.spawner, mh.player.x + 25, mh.player.y, "null_slime");
  const m2 = spawnDummyEnemy(mh.spawner, mh.player.x + 55, mh.player.y, "null_slime");
  const m3 = spawnDummyEnemy(mh.spawner, mh.player.x + 75, mh.player.y, "null_slime");
  m1.hp = m1.maxHp = 500;
  m2.hp = m2.maxHp = 500;
  m3.hp = m3.maxHp = 500;
  const chainFn = (tgt: typeof m1, d: number) => {
    tgt.hp -= d;
  };
  mfx.onHit(mh.ctx, m1, 40, false, { dealPassiveDamage: chainFn });
  mfx.onHit(mh.ctx, m1, 40, false, { dealPassiveDamage: chainFn });
  assert.equal(m2.hp, 500, "No chain lightning before 3rd hit");
  mfx.onHit(mh.ctx, m1, 40, false, { dealPassiveDamage: chainFn });
  assert.equal(m2.hp, 480, "3rd hit arcs 50% DMG to 1st nearby target");
  assert.equal(m3.hp, 480, "3rd hit arcs 50% DMG to 2nd nearby target");

  // 4c. Blood Shield + Cracked Pact + Undying Wall + Starfall Crit
  const kh = makeTestHarness("prism_knight");
  const kfx = new ItemEffectSystem();
  kh.ctx.itemEffects = kfx;
  kh.inv.addItem("ar_bloodstone_plate", 1, 0);
  kh.inv.addItem("ac_cracked_pact", 1, 0);
  kh.inv.addItem("wp_starfall_blade", 1, 0);
  kh.inv.equipFromBag(kh.inv.bag.find((b) => b.defId === "ar_bloodstone_plate")!.uid, "prism_knight");
  kh.inv.equipFromBag(kh.inv.bag.find((b) => b.defId === "ac_cracked_pact")!.uid, "prism_knight");
  kh.inv.equipFromBag(kh.inv.bag.find((b) => b.defId === "wp_starfall_blade")!.uid, "prism_knight");
  recalculatePlayerStats(kh.player, kh.inv, false);
  assert.ok(kh.player.critDmgPct === 35, "Nhẫn Giao Ước Rạn Nứt grants +35% CritDMG");

  const victim = spawnDummyEnemy(kh.spawner, kh.player.x + 24, kh.player.y, "null_slime");
  victim.hp = victim.maxHp = 1000;
  kfx.onHit(kh.ctx, victim, 50, true, {
    dealPassiveDamage: (t, d) => {
      t.hp -= d;
    },
  });
  assert.ok(victim.hp < 1000, "Thánh Kiếm Sao Rơi crit triggers Starfall AoE");
  assert.ok(kfx.getCooldown("starfall_crit") > 5.5, "Starfall crit enters 6s cooldown");

  kh.player.hp = 2; // Test pact_drain never kills
  kfx.onKill(kh.ctx, victim);
  assert.ok(kfx.shieldHp > 0 && kfx.bloodShieldStacks === 1, "Giáp Huyết Thạch grants shield on kill");
  assert.ok(kh.player.hp >= 1, "Nhẫn Giao Ước Rạn Nứt never kills player on kill drain");
  const rem = kfx.onTakeDamage(kh.ctx, 5, kh.player.x + 10, kh.player.y);
  assert.equal(rem, 0, "Blood Shield absorbs incoming damage");

  // Swap to Chiến Giáp Vệ Binh Bất Diệt and verify fatal interception
  kh.inv.addItem("ar_aegis_mantle", 1, 0);
  kh.inv.equipFromBag(kh.inv.bag.find((b) => b.defId === "ar_aegis_mantle")!.uid, "prism_knight");
  recalculatePlayerStats(kh.player, kh.inv, false);
  kh.player.hp = 0;
  assert.equal(kfx.onFatalDamage(kh.ctx), true, "Chiến Giáp Vệ Binh Bất Diệt blocks lethal hit");
  assert.equal(kh.player.hp, 1, "Player survives at 1 HP");
  assert.ok(kh.player.invuln >= 2.0, "Player gains 2s invulnerability");
  assert.equal(kfx.onFatalDamage(kh.ctx), false, "Undying wall respects 45s cooldown");

  // 4d. Mirage Vial stealth & aggro drop
  const aggroMob = spawnDummyEnemy(kh.spawner, kh.player.x + 30, kh.player.y, "null_slime");
  aggroMob.state = "aggro";
  assert.equal(kfx.onUseConsumable(kh.ctx, ITEMS.cs_mirage_vial), true);
  assert.ok((kh.player.stealthTime ?? 0) >= 2.4, "Mirage vial grants 2.5s stealth");
  assert.equal(aggroMob.state, "patrol", "Mirage vial drops enemy aggro");

  // 4e. Fate Die reroll at Forge
  const forge = new ForgeSystem();
  kh.inv.addItem("cs_fate_die", 1, 0);
  const bladeUid = kh.inv.equipment.weapon!.uid;
  const rerollRes = forge.rerollSubstatsWithFateDie(bladeUid, kh.inv);
  assert.equal(rerollRes.ok, true, "Fate Die rerolls equipment substats at Forge");
  assert.equal(kh.inv.countItem("cs_fate_die"), 0, "Fate Die is consumed on reroll");
  assert.ok(Object.keys(kh.inv.equipment.weapon!.bonusStats ?? {}).length >= 2, "Reroll populates fresh bonusStats");

  // 5. Hidden Forge Recipes secrecy & unlock conditions
  const starRec = FORGE_RECIPES.find((r) => r.id === "rec_wp_starfall_blade")!;
  const aegisRec = FORGE_RECIPES.find((r) => r.id === "rec_ar_aegis_mantle")!;
  assert.ok(starRec?.isHidden && aegisRec?.isHidden, "Both Starfall Blade and Aegis Mantle recipes are isHidden");

  const secretInv = new InventorySystem();
  secretInv.resetStarterKit("prism_knight");
  secretInv.gold = 9999;
  const unlockedItems = new Set<string>();
  const unlockedRecipes = new Set<string>();
  const sfxCheck = new ItemEffectSystem();

  assert.equal(
    sfxCheck.isHiddenRecipeUnlocked(starRec, secretInv, unlockedItems, unlockedRecipes),
    false,
    "Starfall recipe stays hidden before Boss 2 kill with Vanguard sword"
  );
  assert.equal(
    forge.canCraft(starRec, secretInv, 20, false).ok,
    false,
    "Forge blocks crafting hidden Starfall recipe when locked"
  );
  assert.deepEqual(
    sfxCheck.checkBossKillHiddenUnlocks("boss_blight_root", secretInv),
    [],
    "Killing Boss 2 WITHOUT Kiếm Sứt Mẻ Vệ Binh does NOT unlock Starfall recipe"
  );
  secretInv.addItem("wp_vanguard_chipped", 1, 0);
  const unlockedByBoss2 = sfxCheck.checkBossKillHiddenUnlocks("boss_blight_root", secretInv);
  assert.deepEqual(
    unlockedByBoss2,
    ["rec_wp_starfall_blade"],
    "Killing Boss 2 WITH Kiếm Sứt Mẻ Vệ Binh unlocks Starfall recipe"
  );
  unlockedByBoss2.forEach((id) => unlockedRecipes.add(id));
  assert.equal(
    sfxCheck.isHiddenRecipeUnlocked(starRec, secretInv, unlockedItems, unlockedRecipes),
    true,
    "Starfall recipe is revealed after unlock"
  );

  // Aegis Mantle recipe stays hidden until owning BOTH ar_bloodstone_plate and ar_briar_cloak
  secretInv.addItem("ar_bloodstone_plate", 1, 0);
  assert.equal(
    sfxCheck.isHiddenRecipeUnlocked(aegisRec, secretInv, unlockedItems, unlockedRecipes),
    false,
    "Aegis Mantle recipe stays hidden with only 1 of 2 required armors"
  );
  secretInv.addItem("ar_briar_cloak", 1, 0);
  assert.equal(
    sfxCheck.isHiddenRecipeUnlocked(aegisRec, secretInv, unlockedItems, unlockedRecipes),
    true,
    "Aegis Mantle recipe unlocks once owning both Giáp Huyết Thạch & Áo Choàng Gai"
  );
});

// ============================================================================
// 18. PHASE 2: DEDICATED CO-OP SERVER, 6-CHAR ROOMS, CROSS-PLAYER REACTIONS & LOOT
// ============================================================================
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitUntil(cond: () => boolean, timeoutMs = 1500) {
  const deadline = Date.now() + timeoutMs;
  while (!cond() && Date.now() < deadline) {
    await sleep(10);
  }
}

async function runAsyncSuitesAndPrint() {
  const srv = await startCoopServer(0, "127.0.0.1");
  const wsUrl = `ws://127.0.0.1:${srv.port}`;
  try {
    // 1. Verify /health endpoint on Dedicated Co-op WebSocket Server
    const healthRes = await fetch(`http://127.0.0.1:${srv.port}/health`);
    assert.equal(healthRes.status, 200, "Co-op server /health returns HTTP 200");
    const healthJson = (await healthRes.json()) as { status: string; activeRooms: number; onlinePlayers: number };
    assert.equal(healthJson.status, "ok", "Co-op server /health reports status=ok");

    const uiStub = {
      onHudUpdate: () => {},
      onModalChange: () => {},
      onToast: () => {},
      onBossVictory: () => {},
    };
    const wsFactory = (url: string) => new WebSocket(url) as unknown as WebSocketLike;

    const hostGame = new PixTelOpenWorldGame(makeMockCanvas() as unknown as HTMLCanvasElement, uiStub, wsFactory);
    const guestGame = new PixTelOpenWorldGame(makeMockCanvas() as unknown as HTMLCanvasElement, uiStub, wsFactory);

    hostGame.coop.playerName = "HostMage";
    guestGame.coop.playerName = "GuestKnight";

    hostGame.startNewGame("chroma_mage", false);
    guestGame.startNewGame("prism_knight", false);

    // Equip a +5 Void-infused weapon on Guest Knight to verify live Paper-Doll network sync
    guestGame.inv.addItem("wpn_prism_halberd", 1, 5);
    const guestWpn = guestGame.inv.bag.find((b) => b.defId === "wpn_prism_halberd")!;
    guestWpn.infusedElement = "void";
    guestGame.inv.equipFromBag(guestWpn.uid, "prism_knight");
    guestGame.recalcPlayerStats(false);

    // 2. Host creates 6-char Room & Guest joins via Room Code
    const roomCode = await hostGame.hostCoopSession({ mode: "ws", wsUrl });
    assert.equal(roomCode.length, 6, "Generated Room Code is 6 characters");
    assert.ok(hostGame.coop.getInviteUrl().includes(`room=${roomCode}`), "Shareable Invite URL embeds ?room=CODE");

    const joinedCode = await guestGame.joinCoopSession(roomCode, { mode: "ws", wsUrl });
    assert.equal(joinedCode, roomCode, "Guest joins exact 6-char Room Code");

    await waitUntil(() => hostGame.remotePlayers.size === 1 && guestGame.remotePlayers.size === 1);
    hostGame.tickNetwork(0.1);
    guestGame.tickNetwork(0.1);
    await sleep(20);

    assert.equal(hostGame.remotePlayers.size, 1, "Host sees Guest in remotePlayers");
    assert.equal(guestGame.remotePlayers.size, 1, "Guest sees Host in remotePlayers");

    const hostSeesGuest = hostGame.remotePlayers.get(guestGame.coop.localId)!;
    assert.equal(hostSeesGuest.snap.name, "GuestKnight");
    assert.equal(hostSeesGuest.snap.classId, "prism_knight");
    assert.equal(
      hostSeesGuest.cachedEquip.weapon?.infusedElement,
      "void",
      "Host reconstructs Guest's +5 Void-infused weapon on 5-slot Paper-Doll"
    );

    // 3. Multi-Player Enemy Aggro Priority (Prism Knight Shield Guard draws aggro!)
    hostGame.spawner.enemies.length = 0;
    guestGame.spawner.enemies.length = 0;
    hostGame.player.x = 50 * TILE_SIZE;
    hostGame.player.y = 50 * TILE_SIZE;
    guestGame.player.x = 50 * TILE_SIZE;
    guestGame.player.y = 50 * TILE_SIZE + 120;
    guestGame.player.shieldTime = 3.0; // Active Prism Shield Guard (-40px threat bonus!)

    guestGame.tickNetwork(0.1);
    await waitUntil(() => Boolean(hostGame.remotePlayers.get(guestGame.coop.localId)?.snap.shieldGuard));

    // Spawn shared enemy equidistant (60px) between Host (y=800) and Guest (y=920) -> at y=860
    const sharedMob = spawnDummyEnemy(hostGame.spawner, 50 * TILE_SIZE, 50 * TILE_SIZE + 60, "ash_hopper");
    sharedMob.hp = 1200;
    sharedMob.maxHp = 1200;
    sharedMob.aiTimer = 99;
    const mobStartY = sharedMob.y;
    hostGame.step(0.1);
    assert.ok(sharedMob.y > mobStartY, "Enemy chases toward Shield-Guarding Prism Knight teammate due to tank threat priority");

    // 4. Cross-Player 9-Element Pairwise Reaction (Host applies `void` Primer -> Guest detonates with `fire`!)
    sharedMob.element = null;
    sharedMob.reactionIcd = 0;
    hostGame.stats.reactionsTriggered = 0;
    guestGame.stats.reactionsTriggered = 0;

    // Host applies Void Primer
    hostGame.combat.damageEnemy(
      (hostGame as unknown as { _makeCombatContext: () => CombatContext })._makeCombatContext(),
      sharedMob,
      25,
      false,
      "explode-plasma",
      "void"
    );
    assert.equal(sharedMob.element, "void", "Host applies Void Primer to shared enemy");

    // Sync enemy state from Host -> Guest
    hostGame.tickNetwork(0.1);
    await waitUntil(() => guestGame.spawner.enemies.find((e) => e.uid === sharedMob.uid)?.element === "void");
    const guestMob = guestGame.spawner.enemies.find((e) => e.uid === sharedMob.uid)!;
    assert.ok(guestMob, "Guest receives synced shared enemy from Host");
    assert.equal(guestMob.element, "void", "Guest sees synced Void Primer aura on enemy");

    // Guest strikes enemy with Fire Detonator -> forwards hit_enemy -> Host triggers Void Flare Burst & broadcasts reaction_vfx!
    guestGame.combat.damageEnemy(
      (guestGame as unknown as { _makeCombatContext: () => CombatContext })._makeCombatContext(),
      guestMob,
      35,
      false,
      "hit-fire",
      "fire"
    );
    await waitUntil(() => hostGame.stats.reactionsTriggered === 1 && guestGame.stats.reactionsTriggered === 1);

    assert.equal(hostGame.stats.reactionsTriggered, 1, "Cross-player Void + Fire triggers Void Flare Burst on Host");
    assert.equal(guestGame.stats.reactionsTriggered, 1, "Guest receives synchronized reaction_vfx & quest credit");

    // 5. Shared Chroma Waypoint Activation (Guest lights WAYPOINTS[1] -> Host unlocks it automatically!)
    const wpTarget = WAYPOINTS[1]!;
    assert.equal(hostGame.colorSys.unlockedWaypoints.has(wpTarget.id), false);
    guestGame.player.x = wpTarget.tx * TILE_SIZE + 8;
    guestGame.player.y = wpTarget.ty * TILE_SIZE + 8;
    guestGame.step(0.02); // refreshes nearestInteractable
    guestGame.interactNearest();
    await waitUntil(() => hostGame.colorSys.unlockedWaypoints.has(wpTarget.id));
    assert.equal(
      hostGame.colorSys.unlockedWaypoints.has(wpTarget.id),
      true,
      "Unlocking Chroma Waypoint on Guest broadcasts and lights it on Host"
    );

    // 6. Instanced Kill Loot & 100% Shared XP when Host finishes off shared enemy
    const guestKillsBefore = guestGame.stats.kills;
    const guestXpBefore = guestGame.player.xp + guestGame.player.level * 1000;
    const guestLootBefore = guestGame.spawner.groundLoot.length;

    hostGame.combat.damageEnemy(
      (hostGame as unknown as { _makeCombatContext: () => CombatContext })._makeCombatContext(),
      sharedMob,
      99999,
      true,
      "crit-gold",
      "chroma"
    );
    await waitUntil(() => guestGame.stats.kills === guestKillsBefore + 1);

    const guestXpAfter = guestGame.player.xp + guestGame.player.level * 1000;
    assert.equal(guestGame.stats.kills, guestKillsBefore + 1, "Guest receives shared kill credit");
    assert.ok(guestXpAfter > guestXpBefore, "Guest receives 100% shared XP from Co-op kill");
    assert.ok(guestGame.spawner.groundLoot.length > guestLootBefore, "Guest receives personal instanced ground loot");

    guestGame.leaveCoopSession();
    hostGame.leaveCoopSession();
    results.push(
      "PASS · Phase 2 Dedicated WebSocket Co-op Server, 6-Char Room Join, Cross-Player 9-Element Reactions & Instanced Loot"
    );
  } finally {
    await srv.close();
  }

  // =========================================================================
  // SUITE 17: HOME SCREEN NAMING, 6 STORY CUTSCENES, KNIGHT SLAM & 8 WEAPON ANIMS
  // =========================================================================
  {
    // 1. All 6 Story Cutscenes have rich beats (Intro has 16 cinematic scenes!), valid pixelfx modules that instantiate & render cleanly, and dynamic {PLAYER_NAME}/{CLASS_NAME} interpolation
    assert.equal(STORY_CUTSCENES.length, 6, "6 cinematic Story Cutscenes exist (Intro + 4 Bosses + Ending)");
    assert.ok(STORY_CUTSCENES[0].beats.length >= 16, "Opening Story Cutscene has 16 epic scenes (>= 15)");
    const csTestFrame = createFrame(480, 200, 0, 0);
    for (const sc of STORY_CUTSCENES) {
      assert.ok(sc.beats.length >= 3, `${sc.id} has at least 3 cinematic beats`);
      for (let bi = 0; bi < sc.beats.length; bi++) {
        const beat = sc.beats[bi];
        assert.ok(beat.actors.length >= 1, `${sc.id} beat ${bi + 1} has stage actors`);
        assert.ok(beat.fxCues.length >= 1, `${sc.id} beat ${bi + 1} has pixelfx VFX cues`);
        for (const cue of beat.fxCues) {
          const mod = PIXELFX_MODS[cue.modId];
          assert.ok(mod, `${sc.id} beat ${bi + 1} references valid PIXELFX_MODS effect: ${cue.modId}`);
          const pal = cue.palette ? (PAL as Record<string, string[]>)[cue.palette] : undefined;
          const fxOpts: Record<string, unknown> = { x: cue.x, y: cue.y, seed: 7, ...(cue.options ?? {}) };
          if (pal) fxOpts.palette = pal;
          const inst = createFx(mod, fxOpts);
          inst.update(0.12);
          clearFrame(csTestFrame);
          inst.draw(csTestFrame, "back");
          inst.draw(csTestFrame, "front");
        }
        for (const act of beat.actors) {
          if (act.kind === "enemy" && act.enemyId) {
            assert.ok(ENEMIES[act.enemyId], `${sc.id} references valid enemyId: ${act.enemyId}`);
          }
        }
      }
    }
    assert.equal(getBossCutsceneId("boss_xing_warden"), "scene_boss_warden");
    assert.equal(getBossCutsceneId("boss_blight_root"), "scene_boss_blight");
    assert.equal(getBossCutsceneId("boss_gilded_null"), "scene_boss_gilded");
    assert.equal(getBossCutsceneId("boss_the_eraser"), "scene_boss_eraser");
    assert.equal(
      interpolateCutsceneText("Xin chào {PLAYER_NAME} ({CLASS_NAME})!", "Aetherion", "Vệ Binh Lăng Kính"),
      "Xin chào Aetherion (Vệ Binh Lăng Kính)!"
    );

    // 2. Knight Hold Charge uses Paladin Overhead Slam (NOT thrust/beam and NO rainbow-burst) + golden heavy-cleave + ground-slam + golden holy/smite!
    const kh = makeTestHarness("prism_knight");
    const kRec = { live: [] as MockVfxCall[], pooled: [] as MockVfxCall[] };
    kh.ctx.vfx = createMockVfx(kRec);
    kh.player.stamina = 100;
    kh.combat.performChargedAttack(kh.ctx, true);
    assert.equal(kh.player.attackAnimKind, "overhead_slam", "Knight Hold Charge uses Paladin overhead_slam");
    assert.ok(
      kRec.live.some((c) => c.modId === "melee/heavy-cleave"),
      "Knight Hold Charge spawns golden melee/heavy-cleave VFX"
    );
    assert.ok(
      kRec.live.some((c) => c.modId === "holy/smite"),
      "Knight Just-Charge triggers golden Paladin holy/smite shockwave"
    );
    assert.ok(
      !kRec.live.some((c) => c.modId === "pixtel/rainbow-burst"),
      "Knight Thánh Kiếm Phá Địa no longer spawns rainbow-burst"
    );
    assert.ok(
      kRec.pooled.some((c) => c.modId === "ground-slam"),
      "Knight Hold Charge spawns ground-slam impact shockwave"
    );

    // 3. All 8 new weapon-family animations wire into combat AND bake non-empty 3D pixelfx frames!
    const weaponAnimCases: { classId: ClassId; weaponId: string; step: number; expected: string }[] = [
      { classId: "prism_knight", weaponId: "sea_wpn_spring_katana", step: 2, expected: "iaido_draw" },
      { classId: "prism_knight", weaponId: "exo_wpn_thunder_halberd", step: 1, expected: "halberd_sweep" },
      { classId: "prism_knight", weaponId: "exo_wpn_blood_greatsword", step: 2, expected: "overhead_slam" },
      { classId: "chroma_mage", weaponId: "exo_wpn_blackhole_orb", step: 2, expected: "orb_levitate" },
      { classId: "chroma_mage", weaponId: "exo_wpn_phoenix_rod", step: 1, expected: "staff_whirl" },
      { classId: "bit_rogue", weaponId: "exo_wpn_venom_claws", step: 1, expected: "dual_cross_slash" },
      { classId: "bit_rogue", weaponId: "exo_wpn_phantom_boomerang", step: 0, expected: "chakram_throw" },
      { classId: "pixel_tinker", weaponId: "exo_wpn_rocket_barrage", step: 2, expected: "recoil_barrage" },
    ];
    for (const tc of weaponAnimCases) {
      const wh = makeTestHarness(tc.classId);
      const inst = createItemInstance(tc.weaponId);
      wh.inv.equipment.weapon = inst;
      wh.player.comboStep = tc.step;
      wh.player.atkCd = 0;
      wh.combat.performPrimaryAttack(wh.ctx);
      assert.equal(
        wh.player.attackAnimKind,
        tc.expected,
        `${tc.weaponId} step ${tc.step + 1} triggers bespoke ${tc.expected} animation`
      );
      const baked = getOrBakePixelfxHero(
        tc.classId,
        wh.inv.equipment,
        "attack",
        0,
        1,
        "right",
        1,
        {
          attackKind: tc.expected as import("../src/graphics/pixelfxHeroModels").HeroAttackKind,
          attackProgress: 0.52,
          aimAngle: 0,
        }
      );
      assert.ok(baked.w > 0 && baked.h > 0, `${tc.expected} bakes crisp non-empty 3D hero bitmap`);
    }

    // 4. Home Screen -> Custom Player Name -> SaveData v3 persistence & Co-op name sync
    const homeGame = new PixTelOpenWorldGame(makeMockCanvas() as unknown as HTMLCanvasElement, {
      onHudUpdate: () => {},
      onModalChange: () => {},
      onToast: () => {},
      onBossVictory: () => {},
    });
    assert.equal(homeGame.activeModal, "home", "New game boots into dedicated Home Screen before Class Select");
    homeGame.startNewGame("chroma_mage", false, "Quang Khải", false);
    assert.equal(homeGame.player.name, "Quang Khải", "Custom player name applies to PlayerEntity");
    assert.equal(homeGame.coop.playerName, "Quang Khải", "Custom player name syncs automatically to Co-op client");
    homeGame.playCutscene("scene_boss_warden", null);
    assert.ok(homeGame.seenCutscenes.has("scene_boss_warden"), "playCutscene records unlocked cutscene");
    assert.ok(homeGame.saveGame(false), "Save persists player name and seenCutscenes");

    const reloaded = new PixTelOpenWorldGame(makeMockCanvas() as unknown as HTMLCanvasElement, {
      onHudUpdate: () => {},
      onModalChange: () => {},
      onToast: () => {},
      onBossVictory: () => {},
    });
    assert.ok(reloaded.loadSavedGame(), "Saved game loads cleanly");
    assert.equal(reloaded.player.name, "Quang Khải", "Saved custom player name restores cleanly");
    assert.ok(reloaded.seenCutscenes.has("scene_boss_warden"), "Unlocked story cutscenes restore cleanly");

    results.push(
      "PASS · Home Screen Naming, 6 pixelfx+codixel Story Cutscenes, Knight Overhead Slam & 8 Weapon Animations"
    );
  }

  console.log("\n========================================================");
  console.log("  PIXTEL AUTOMATED TEST SUITE (MOBILE + CO-OP + 9 ELEM)");
  console.log("========================================================");
  for (const line of results) {
    console.log("  ✓", line);
  }
  console.log(`========================================================`);
  console.log(`  ALL ${results.length}/${results.length} FEATURE SUITES PASSED CLEANLY!\n`);
}

runAsyncSuitesAndPrint().catch((err) => {
  console.error("ASYNC TEST FAILURE:", err);
  process.exit(1);
});
