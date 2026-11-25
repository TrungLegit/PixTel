import assert from "node:assert/strict";
import { CLASSES } from "../src/data/classes";
import { ENEMIES } from "../src/data/enemies";
import { ITEMS, createItemInstance, getItemEffectiveStats } from "../src/data/items";
import { BOSS_CODEX, LORE_TABLETS, WORLD_PROLOGUE } from "../src/data/lore";
import { QUESTS } from "../src/data/quests";
import { FORGE_RECIPES } from "../src/data/recipes";
import { TILE_SIZE, WAYPOINTS, WORLD_CAMPS, WORLD_RESOURCES } from "../src/data/worldConfig";
import type { ClassId } from "../src/data/types";
import { ColorRestorationSystem } from "../src/graphics/colorRestoration";
import { CombatSystem, type CombatContext } from "../src/systems/combat";
import { ForgeSystem } from "../src/systems/forgeSystem";
import { InventorySystem, recalculatePlayerStats } from "../src/systems/inventorySystem";
import { QuestSystem } from "../src/systems/questSystem";
import { SaveSystem } from "../src/systems/saveSystem";
import type { EnemyEntity, HazardEntity, PlayerEntity, ProjectileEntity, TurretEntity } from "../src/world/entities";
import { findNearestInteractable } from "../src/world/interactables";
import { WorldSpawner } from "../src/world/spawner";
import { WorldMap } from "../src/world/worldMap";

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

(globalThis as unknown as { document?: unknown }).document ??= {
  createElement: () => ({
    width: 32,
    height: 32,
    getContext: () => ({
      fillStyle: "",
      strokeStyle: "",
      globalAlpha: 1,
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
      getImageData: (_x: number, _y: number, w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4),
      }),
      putImageData: () => {},
    }),
  }),
};

function createMockVfx() {
  return {
    spawnLive: () => {},
    spawnPooled: () => {},
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
    staminaCostPct: 0,
    poiseBreakPct: 0,
    skillCdPct: 0,
    hasOrbitGrimoire: false,
    hasReactionAmp: false,
    grimoireTimer: 0.1,
    perfectDashWindow: 0,
    chromaCounterTimer: 0,
    dashComboPreserveTimer: 0,
    quickChargeTimer: 0,
    bleachDebuffTime: 0,
    speedBuffTime: 0,
    atkBuffTime: 0,
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
    onBossDefeated: () => {
      bossesDefeatedEvents += 1;
    },
    onPlayerDefeated: () => {
      defeatedCount += 1;
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
// 3. 5-ELEMENT CHROMA REACTION MATRIX (ALL 7 REACTIONS + CHROMA COATING)
// ============================================================================
runTest("5-Element Chroma Reaction Matrix (All 7 Reactions)", () => {
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

  // 4. ice + volt -> Superconduct (chains lightning to nearby e2!)
  e1.reactionIcd = 0;
  const e2HpBefore = e2.hp;
  h.combat.damageEnemy(h.ctx, e1, 20, false, "hit-ice", "ice");
  h.combat.damageEnemy(h.ctx, e1, 20, false, "zap-hit", "volt");
  assert.ok(e2.hp < e2HpBefore, "Superconduct chains lightning to nearby enemy");

  // 5. fire + volt -> Overload Blast (heavy Bleach Shield break)
  e1.reactionIcd = 0;
  e1.bleachShield = 120;
  h.combat.damageEnemy(h.ctx, e1, 20, false, "hit-fire", "fire");
  h.combat.damageEnemy(h.ctx, e1, 20, false, "zap-hit", "volt");
  assert.ok(e1.bleachShield < 25, "Overload Blast heavily damages Bleach Shield");

  // 6. nature + volt -> Catalyze (+16 Stamina & +10 Overdrive)
  e1.reactionIcd = 0;
  h.player.stamina = 40;
  h.player.overdrive = 20;
  h.combat.damageEnemy(h.ctx, e1, 20, false, "hit-poison", "nature");
  h.combat.damageEnemy(h.ctx, e1, 20, false, "zap-hit", "volt");
  assert.ok(h.player.stamina >= 56, "Catalyze restores +16 Stamina");
  assert.ok(h.player.overdrive >= 30, "Catalyze grants +10 Overdrive");

  // 7. fire + prism -> Prismatic Refraction (preserves fire aura & bounces!)
  e1.reactionIcd = 0;
  h.combat.damageEnemy(h.ctx, e1, 20, false, "hit-fire", "fire");
  h.combat.damageEnemy(h.ctx, e1, 20, false, "crit-gold", "prism");
  assert.equal(e1.element, "fire", "Prismatic Refraction preserves underlying elemental aura");
  assert.equal(h.ctx.stats.reactionsTriggered, 7, "All 7 reactions counted in stats");
});

// ============================================================================
// 4. BOSS SYSTEM: XING WARDEN, BLEACH SHIELD BREAK & 3-PHASE ERASER TOTEMS
// ============================================================================
runTest("Boss System: Xing Warden, Bleach Shield Break & 3-Phase Eraser Totems", () => {
  const h = makeTestHarness("prism_knight");
  const warden = h.spawner.enemies.find((e) => e.defId === "boss_xing_warden");
  const eraser = h.spawner.enemies.find((e) => e.defId === "boss_the_eraser");
  assert.ok(warden, "Meadow Boss Xing Warden must spawn in open world");
  assert.ok(eraser, "World Boss The Eraser must spawn in open world");
  assert.ok(warden.bleachShield > 0, "Bosses start with initial Bleach Shield");

  // Break Xing Warden's Bleach Shield -> Stun + Vulnerability
  h.combat.damageEnemy(h.ctx, warden, 180, true, "hit-cyan", undefined, 1, 0, 2.5);
  assert.equal(warden.bleachShield, 0, "Heavy poise hit shatters Xing Warden's Bleach Shield");
  assert.ok(warden.stunTime >= 2.0 && warden.vulnTime >= 4.0, "Guard Break stuns Boss and opens Vulnerable window");

  // Test The Eraser 3-Phase & Arena Chroma Totem Resonance mechanic
  eraser.state = "aggro";
  h.player.x = eraser.x + 40;
  h.player.y = eraser.y;
  eraser.hp = Math.floor(eraser.maxHp * 0.62); // Drop below 65% threshold
  h.combat.update(h.ctx, 0.016);

  assert.equal(eraser.phase, 2, "The Eraser transitions to Phase 2 at <= 65% HP");
  assert.equal(h.spawner.arenaTotems.length, 4, "Phase 2 spawns 4 Resonance Chroma Totems");
  assert.ok(eraser.bleachShield > 0, "Phase 2 refills Void Bleach Shield");

  // Player strikes 2 Totems -> shatters Eraser's shield & staggers for 4.5s!
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

  assert.equal(h.spawner.arenaTotems.length, 0, "Lighting 2 Totems triggers converging Prism Break");
  assert.equal(eraser.bleachShield, 0, "Prism Break shatters The Eraser's Void Shield completely");
  assert.equal(eraser.stunTime, 4.5, "The Eraser collapses for 4.5s");
  assert.ok(eraser.vulnTime >= 5.5, "The Eraser becomes Vulnerable");

  // Phase 3 transition at <= 30% HP
  eraser.stunTime = 0;
  eraser.hp = Math.floor(eraser.maxHp * 0.28);
  h.combat.update(h.ctx, 0.016);
  assert.equal(eraser.phase, 3, "The Eraser transitions to Phase 3 at <= 30% HP");
  assert.equal(h.spawner.arenaTotems.length, 4, "Phase 3 summons final Totem ritual");
});

// ============================================================================
// 5. ITEMS, PASSIVES, UNDYING CHARM & PRISM FORGE (+0->+10 PITY & +5 INFUSION)
// ============================================================================
runTest("Items, Passives, Undying Charm & Prism Forge (+0->+10 Pity & +5 Infusion)", () => {
  const h = makeTestHarness("bit_rogue");
  const forge = new ForgeSystem();

  // Craft new Boss-Core & Archetype items
  h.inv.gold = 99999;
  h.inv.addItem("mat_warden_crest", 5);
  h.inv.addItem("mat_crystal_heart", 5);
  h.inv.addItem("mat_amber_fang", 5);
  h.inv.addItem("mat_iron_ore", 250);
  h.inv.addItem("mat_quartz_shard", 250);
  h.inv.addItem("mat_amber_gem", 250);
  h.inv.addItem("mat_void_prism", 250);
  h.inv.addItem("mat_glitch_core", 250);
  h.inv.addItem("mat_prism_shard", 250);
  h.inv.addItem("mat_pigment_red", 5);

  for (const recId of [
    "rec_warden_cleaver",
    "rec_amulet_wind",
    "rec_grimoire_arcane",
    "rec_disc_spectrum",
    "rec_charm_undying",
  ]) {
    assert.ok(FORGE_RECIPES.some((r) => r.id === recId), `Recipe ${recId} exists`);
    const res = forge.craftRecipe(recId, h.inv);
    assert.equal(res.succeeded, true, `Crafting ${recId} succeeds`);
  }

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
  h.player.x = 50 * TILE_SIZE + 8; // Outside safe town!
  h.player.y = 50 * TILE_SIZE + 8;
  h.player.invuln = 0;
  h.player.perfectDashWindow = 0;
  h.combat.damagePlayer(h.ctx, 9999, h.player.x + 5, h.player.y);
  assert.equal(h.getDefeatedCount(), 0, "Undying Charm prevents death");
  assert.ok(h.player.hp >= Math.floor(h.player.maxHp * 0.38), "Undying Charm heals 40% maxHp");
  assert.equal(h.inv.countItem("charm_undying"), 0, "Undying Charm is consumed upon saving player");

  // Prism Forge +0 -> +10 Safe Pity + Catalyst + +5 Chroma Pigment Infusion
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
      const inf = forge.infuseElement(wpn.uid, "fire", h.inv, h.quests);
      assert.equal(inf.succeeded, true, "+5 weapon unlocks Chroma Pigment Infusion");
      assert.equal(wpn.infusedElement, "fire");
    }
    attempts++;
  }
  assert.equal(wpn.enhanceLevel, 10, `Weapon reaches +10 safely with Pity protection (took ${attempts} rolls)`);

  const st10 = getItemEffectiveStats(wpn);
  const st0 = getItemEffectiveStats(createItemInstance(wpn.defId, 1, 0));
  assert.ok(st10.atk > st0.atk + 20, "+10 weapon gains massive ATK");
  assert.ok(st10.poiseBreakPct >= st0.poiseBreakPct + 30, "+10 weapon gains +3/+10 Poise Break milestones");
  assert.ok(st10.staminaCostPct <= -15, "+7 weapon milestone reduces Charge Stamina cost by 15%");
  assert.ok(st10.elementBonus >= 18, "+5 infusion & +10 awakening grant +18% Element Bonus");
});

// ============================================================================
// 6. 4-CLASS [E] SKILLS, [Q] ULTIMATES, CHROMA COATING & SAVEDATAV2 ROUNDTRIP
// ============================================================================
runTest("4-Class [E] Skills, [Q] Ultimates, Chroma Coating & SaveDataV2 Persistence", () => {
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

  // Starter kit includes pot_coating [4] & SaveDataV2 preserves lore + infused + pity fields
  const h = makeTestHarness("prism_knight");
  assert.equal(ITEMS["pot_coating"]?.consumableKind, "chroma_coating");
  assert.ok(h.inv.countItem("pot_coating") >= 1, "Starter kit includes Dầu Quang Phổ [4]");

  h.inv.equipment.weapon!.enhanceLevel = 6;
  h.inv.equipment.weapon!.pityBonus = 40;
  h.inv.equipment.weapon!.infusedElement = "volt";

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
      hp: h.player.hp,
      stamina: h.player.stamina,
      overdrive: h.player.overdrive,
      respawnWaypointId: h.player.respawnWaypointId,
    },
    gold: h.inv.gold,
    equipment: h.inv.equipment,
    bag: h.inv.bag,
    activatedWaypoints: ["wp_town", "wp_meadow_n"],
    openedChests: ["chest_meadow_1"],
    discoveredLore: ["lore_town_origin", "lore_meadow_warden"],
    quests: h.quests.exportState(),
    stats: { kills: 12, mined: 5, chestsOpened: 1, bossesDefeated: 1, reactionsTriggered: 7 },
  });
  assert.equal(savedOk, true);
  assert.equal(saveSys.hasSave(), true);

  const loaded = saveSys.load()!;
  assert.deepEqual(loaded.discoveredLore, ["lore_town_origin", "lore_meadow_warden"]);
  assert.equal(loaded.stats.reactionsTriggered, 7);
  assert.equal(loaded.equipment.weapon?.infusedElement, "volt");
  assert.equal(loaded.equipment.weapon?.pityBonus, 40);
});

console.log("\n========================================================");
console.log("  PIXTEL v2.5 AUTOMATED FEATURE TEST SUITE");
console.log("========================================================");
for (const line of results) {
  console.log("  ✓", line);
}
console.log(`========================================================`);
console.log(`  ALL ${results.length}/${results.length} FEATURE SUITES PASSED CLEANLY!\n`);
