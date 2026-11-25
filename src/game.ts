import { getClassDef } from "./data/classes";
import { ENEMIES } from "./data/enemies";
import { ITEMS, RARITY_INFO } from "./data/items";
import {
  BIOME_CONFIGS,
  CHROMA_RAINBOW,
  CLASS_ALTAR_POS,
  TILE_SIZE,
  TOWN_NPCS,
  WAYPOINTS,
  WORLD_H,
  WORLD_W,
} from "./data/worldConfig";
import type { BiomeId, ClassId, SaveDataV2, WaypointDef } from "./data/types";
import { ColorRestorationSystem } from "./graphics/colorRestoration";
import {
  drawPaperDollHero,
  getWeaponAnchorOffset,
  type HeroAnimState,
} from "./graphics/paperDoll";
import { sprites } from "./graphics/pixelSprites";
import { TileRenderer } from "./graphics/tileRenderer";
import { VfxManager } from "./vfx/vfxManager";
import { rasterText, textWidth } from "./vfx/pixelfx/core/font.js";
import { WorldMap } from "./world/worldMap";
import { WorldSpawner } from "./world/spawner";
import { findNearestInteractable, type InteractableTarget } from "./world/interactables";
import type {
  EnemyEntity,
  HazardEntity,
  PlayerEntity,
  ProjectileEntity,
  TurretEntity,
} from "./world/entities";
import { HOTKEY_CONSUMABLES, InventorySystem, recalculatePlayerStats } from "./systems/inventorySystem";
import { QuestSystem } from "./systems/questSystem";
import { ForgeSystem } from "./systems/forgeSystem";
import { SaveSystem } from "./systems/saveSystem";
import { CombatSystem, type CombatContext } from "./systems/combat";
import { sfx } from "./audio/chiptuneSynth";

export type ModalId =
  | null
  | "class_select"
  | "dialogue"
  | "inventory"
  | "forge"
  | "world_map"
  | "journal"
  | "pause";

export interface GameUiCallbacks {
  onHudUpdate: () => void;
  onModalChange: (modal: ModalId, payload?: unknown) => void;
  onToast: (msg: string, tone: "info" | "good" | "warn" | "epic") => void;
  onBossVictory: (worldBoss: boolean, bossName: string) => void;
}

const VIEW_W = 480;
const VIEW_H = 270;

// 12 crisp pixel positions around a 13x13 pixel stamina ring (no anti-aliased arcs!)
const STAMINA_RING_PTS: readonly [number, number][] = [
  [0, -6], [3, -5], [5, -3], [6, 0],
  [5, 3], [3, 5], [0, 6], [-3, 5],
  [-5, 3], [-6, 0], [-5, -3], [-3, -5],
];

export class PixTelOpenWorldGame {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly world = new WorldMap();
  readonly tileRenderer = new TileRenderer();
  readonly colorSys = new ColorRestorationSystem();
  readonly vfx = new VfxManager(VIEW_W, VIEW_H);
  readonly spawner = new WorldSpawner();
  readonly inv = new InventorySystem();
  readonly quests = new QuestSystem();
  readonly forge = new ForgeSystem();
  readonly saveSys = new SaveSystem();
  readonly combat = new CombatSystem();

  player!: PlayerEntity;
  readonly projectiles: ProjectileEntity[] = [];
  readonly turrets: TurretEntity[] = [];
  readonly hazards: HazardEntity[] = [];

  camX = 0;
  camY = 0;
  time = 0;
  running = false;
  activeModal: ModalId = "class_select";
  currentBiome: BiomeId = "town";
  nearestInteractable: InteractableTarget | null = null;
  stats = { kills: 0, mined: 0, chestsOpened: 0, bossesDefeated: 0 };

  private keys = new Set<string>();
  private mouseScreenX = VIEW_W / 2;
  private mouseScreenY = VIEW_H / 2;
  private mouseDown = false;
  private shake = 0;
  private hitstop = 0;
  private autoSaveTimer = 0;
  private hudSyncTimer = 0;
  private weaponGlowTimer = 0;
  private weaponPixelfxTimer = 0;
  private lastRaf = 0;
  private ui: GameUiCallbacks;

  constructor(canvas: HTMLCanvasElement, ui: GameUiCallbacks) {
    this.canvas = canvas;
    this.canvas.width = VIEW_W;
    this.canvas.height = VIEW_H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.ui = ui;

    sprites.init();
    this.vfx.warmup();
    this._initBlankPlayer("prism_knight");
    this.colorSys.reset();
    this.tileRenderer.syncOverviewMap(this.world, this.colorSys);
    this._bindInputs();
  }

  private _initBlankPlayer(classId: ClassId) {
    const cdef = getClassDef(classId);
    const spawnWp = WAYPOINTS[0];
    this.player = {
      classId,
      x: spawnWp.tx * TILE_SIZE + 8,
      y: (spawnWp.ty - 1) * TILE_SIZE + 8,
      vx: 0,
      vy: 0,
      facing: 1,
      facingDir: "down",
      aimAngle: 0,
      radius: 5.5,
      level: 1,
      xp: 0,
      xpNext: 90,
      hp: cdef.baseStats.hp,
      maxHp: cdef.baseStats.hp,
      atk: cdef.baseStats.atk,
      def: cdef.baseStats.def,
      spd: cdef.baseStats.spd,
      crit: cdef.baseStats.crit,
      critMult: cdef.baseStats.critMult,
      elementBonus: 0,
      stamina: 100,
      maxStamina: 100,
      staminaRegenDelay: 0,
      exhausted: false,
      sprinting: false,
      overdrive: 35,
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
      speedBuffTime: 0,
      atkBuffTime: 0,
      respawnWaypointId: "wp_town",
    };
  }

  /** Recomputes maxHp, atk, def, spd, crit, elementBonus from Class + Level + Equipped Items. */
  recalcPlayerStats(preserveHpRatio = true) {
    recalculatePlayerStats(this.player, this.inv, preserveHpRatio);
  }

  /** Alias matching RPG stats recalculation API. */
  recalculatePlayerStats(preserveHpRatio = true) {
    recalculatePlayerStats(this.player, this.inv, preserveHpRatio);
  }

  startNewGame(classId: ClassId) {
    sfx.unlock();
    this.projectiles.length = 0;
    this.turrets.length = 0;
    this.hazards.length = 0;
    this.vfx.clearAll();

    this.inv.resetStarterKit();
    this.quests.reset();
    this.colorSys.reset();
    this.spawner.reset([]);
    this.stats = { kills: 0, mined: 0, chestsOpened: 0, bossesDefeated: 0 };

    this._initBlankPlayer(classId);
    this.recalcPlayerStats(false);
    this.currentBiome = this.world.getBiomeAtWorld(this.player.x, this.player.y);
    this._snapCamera();
    this.tileRenderer.syncOverviewMap(this.world, this.colorSys);

    this.running = true;
    this.setModal(null);
    this.saveGame(false);
    this.vfx.spawnPooled("waypoint-pillar", { x: this.player.x, y: this.player.y });
    this.ui.onToast(
      `Chào mừng đến PIXTEL! Gặp Trưởng Làng Elian [F] ở quảng trường để nhận nhiệm vụ đầu tiên.`,
      "info"
    );
    this.ui.onHudUpdate();
  }

  loadSavedGame(): boolean {
    const data = this.saveSys.load();
    if (!data) return false;
    sfx.unlock();
    this.projectiles.length = 0;
    this.turrets.length = 0;
    this.hazards.length = 0;
    this.vfx.clearAll();

    this.inv.loadState(data.player.gold, data.equipment, data.bag);
    this.quests.loadState(data.quests);
    this.colorSys.loadUnlocked(data.unlockedWaypoints);
    this.spawner.reset(data.openedChests, data.unlockedWaypoints);
    this.stats = { ...data.stats };

    this._initBlankPlayer(data.classId);
    this.player.x = data.player.x;
    this.player.y = data.player.y;
    this.player.level = data.player.level;
    this.player.xp = data.player.xp;
    this.player.xpNext = data.player.xpNext;
    this.player.overdrive = data.player.overdrive;
    this.player.respawnWaypointId = data.player.respawnWaypointId || "wp_town";
    this.recalcPlayerStats(false);
    this.player.hp = Math.min(this.player.maxHp, Math.max(10, data.player.hp));

    this.currentBiome = this.world.getBiomeAtWorld(this.player.x, this.player.y);
    this._snapCamera();
    this.tileRenderer.syncOverviewMap(this.world, this.colorSys);

    this.running = true;
    this.setModal(null);
    this.vfx.spawnPooled("waypoint-pillar", { x: this.player.x, y: this.player.y });
    this.ui.onToast("Đã tải tiến trình phiêu lưu thành công!", "good");
    this.ui.onHudUpdate();
    return true;
  }

  switchClassInTown(classId: ClassId) {
    if (this.player.classId === classId) {
      this.setModal(null);
      return;
    }
    this.player.classId = classId;
    this.turrets.length = 0;
    this.player.stormTime = 0;
    this.player.cloneTime = 0;
    this.player.droneTime = 0;
    this.recalcPlayerStats(true);
    this.setModal(null);
    sfx.playWaypoint();
    this.vfx.spawnPooled("waypoint-pillar", { x: this.player.x, y: this.player.y });
    this.ui.onToast(`Đã chuyển đổi Class thành ${getClassDef(classId).vnName}!`, "epic");
    this.saveGame(false);
    this.ui.onHudUpdate();
  }

  saveGame(showToast = true): boolean {
    if (!this.running) return false;
    const data: SaveDataV2 = {
      version: 2,
      savedAt: Date.now(),
      classId: this.player.classId,
      player: {
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        hp: Math.round(this.player.hp),
        level: this.player.level,
        xp: this.player.xp,
        xpNext: this.player.xpNext,
        gold: this.inv.gold,
        overdrive: Math.round(this.player.overdrive),
        respawnWaypointId: this.player.respawnWaypointId,
      },
      equipment: this.inv.equipment,
      bag: this.inv.bag,
      unlockedWaypoints: Array.from(this.colorSys.unlockedWaypoints),
      openedChests: this.spawner.getOpenedChestIds(),
      quests: this.quests.exportState(),
      stats: { ...this.stats },
    };
    const ok = this.saveSys.save(data);
    if (ok && showToast) {
      sfx.playUiClick();
      this.ui.onToast("Đã lưu tiến trình vào trình duyệt!", "good");
    }
    return ok;
  }

  setModal(modal: ModalId, payload?: unknown) {
    this.activeModal = modal;
    if (modal !== null) {
      this.keys.clear();
      this.mouseDown = false;
      this.player.charging = false;
      this.player.chargeTime = 0;
    }
    this.ui.onModalChange(modal, payload);
    this.ui.onHudUpdate();
  }

  uiToast(msg: string, tone: "info" | "good" | "warn" | "epic" = "info") {
    this.ui.onToast(msg, tone);
  }

  toggleModal(modal: Exclude<ModalId, null>) {
    if (!this.running) return;
    if (this.activeModal === modal) {
      this.setModal(null);
    } else {
      sfx.playUiClick();
      this.setModal(modal);
    }
  }

  /** Fast Travel from World Map [M] to any unlocked Chroma Waypoint. */
  fastTravelTo(wpId: string) {
    if (!this.colorSys.unlockedWaypoints.has(wpId)) return;
    const wp = WAYPOINTS.find((w) => w.id === wpId);
    if (!wp) return;

    this.player.x = wp.tx * TILE_SIZE + 8;
    this.player.y = (wp.ty + 1) * TILE_SIZE + 8;
    this.player.hp = this.player.maxHp;
    this.player.stamina = this.player.maxStamina;
    this.player.respawnWaypointId = wp.id;
    this.projectiles.length = 0;
    this._snapCamera();
    this.setModal(null);

    sfx.playWaypoint();
    this.vfx.spawnPooled("waypoint-pillar", { x: this.player.x, y: this.player.y });
    this.vfx.spawnPooled("waypoint-pad", { x: this.player.x, y: this.player.y, layer: "back" });
    this.ui.onToast(`Dịch chuyển tới ${wp.name} — Đã hồi đầy HP & Thể Lực!`, "good");
    this.saveGame(false);
    this.ui.onHudUpdate();
  }

  /** Uses quick consumable hotkey 1, 2, or 3. */
  useConsumableSlot(slot1Based: 1 | 2 | 3) {
    if (!this.running || this.activeModal !== null) return;
    const defId = HOTKEY_CONSUMABLES[slot1Based - 1];
    this.useConsumableById(defId);
  }

  useConsumableById(defId: string): boolean {
    const def = ITEMS[defId];
    if (!def || def.category !== "consumable") return false;
    if (!this.inv.consumeItem(defId, 1)) {
      this.ui.onToast(`Đã hết ${def.name}! Mua thêm tại Thương Nhân Mira.`, "warn");
      return false;
    }

    if (def.consumableKind === "hp_potion") {
      const heal = Math.round(this.player.maxHp * 0.45);
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
      this.vfx.spawnPooled("heal-burst", { x: this.player.x, y: this.player.y - 6 });
      this.vfx.spawnDamageText(this.player.x, this.player.y - 12, `+${heal} HP`, { color: "#44ee88", crit: true });
      sfx.playLootPickup(true);
    } else if (def.consumableKind === "stamina_elixir") {
      this.player.stamina = this.player.maxStamina;
      this.player.exhausted = false;
      this.player.speedBuffTime = 8.0;
      this.vfx.spawnLive("status/haste", { x: this.player.x, y: this.player.y, follow: this.player, maxLife: 1.2 });
      this.vfx.spawnDamageText(this.player.x, this.player.y - 12, `HASTE +28%`, { color: "#44ee88" });
      sfx.playLootPickup(true);
    } else if (def.consumableKind === "chroma_tonic") {
      this.player.atkBuffTime = 12.0;
      this.vfx.spawnLive("pixtel/overdrive-aura", { x: this.player.x, y: this.player.y, follow: this.player, maxLife: 1.2 });
      this.vfx.spawnDamageText(this.player.x, this.player.y - 12, `ATK +30%!`, { color: "#ffe066", crit: true });
      sfx.playOverdrive();
    }

    this.ui.onHudUpdate();
    return true;
  }

  /** Handles pressing [F] to interact with nearest NPC, Class Altar, Waypoint, Chest, or Equipment Loot. */
  interactNearest() {
    if (!this.running || this.activeModal !== null) return;
    const t = this.nearestInteractable;
    if (!t) return;

    if (t.kind === "npc") {
      sfx.playUiClick();
      this.setModal("dialogue", { npcId: t.npc.id });
      return;
    }

    if (t.kind === "altar") {
      sfx.playUiClick();
      this.setModal("class_select", { switching: true });
      return;
    }

    if (t.kind === "waypoint") {
      this._activateWaypoint(t.wp);
      return;
    }

    if (t.kind === "chest") {
      if (t.chest.state === "locked") {
        sfx.playForgeFail();
        this.ui.onToast("Rương bị khóa! Hãy tiêu diệt hết quái vật trong trại trước.", "warn");
        return;
      }
      if (t.chest.state === "unlocked") {
        this.spawner.openChest(t.chest, this.vfx);
        sfx.playChestOpen();
        this.stats.chestsOpened += 1;
        const done = this.quests.recordEvent("open_chest", undefined, 1);
        for (const q of done) {
          sfx.playQuestComplete();
          this.ui.onToast(`Hoàn thành mục tiêu nhiệm vụ: ${q.title}!`, "good");
        }
        this.saveGame(false);
        this.ui.onHudUpdate();
      }
      return;
    }

    if (t.kind === "loot") {
      this._pickupGroundLoot(t.loot);
    }
  }

  private _activateWaypoint(wp: WaypointDef) {
    const wx = wp.tx * TILE_SIZE + 8;
    const wy = wp.ty * TILE_SIZE + 8;
    const isNew = !this.colorSys.unlockedWaypoints.has(wp.id);

    this.player.hp = this.player.maxHp;
    this.player.stamina = this.player.maxStamina;
    this.player.exhausted = false;
    this.player.respawnWaypointId = wp.id;
    sfx.playWaypoint();
    this.vfx.spawnPooled("waypoint-pillar", { x: wx, y: wy });

    if (isNew) {
      this.colorSys.unlockedWaypoints.add(wp.id);
      const maxR = wp.restoreRadiusTiles * TILE_SIZE;
      this.colorSys.triggerWave(wx, wy, maxR, 340);
      this.vfx.spawnLive("pixtel/color-wave", {
        x: wx,
        y: wy,
        options: { radius: 220 },
        priority: 6,
        maxLife: 1.6,
      });
      this.shake = Math.max(this.shake, 5.5);

      const done = this.quests.recordEvent("activate_waypoint", wp.id, 1);
      for (const q of done) {
        sfx.playQuestComplete();
        this.ui.onToast(`Hoàn thành mục tiêu nhiệm vụ: ${q.title}!`, "good");
      }
      const spawnedChest = this.spawner.spawnWaypointChromaChest(wp, this.vfx);
      this.ui.onToast(
        spawnedChest
          ? `ĐÃ KÍCH HOẠT ${wp.name.toUpperCase()}! Rương Sắc Màu đã mở khóa ngay bên cạnh!`
          : `ĐÃ KÍCH HOẠT ${wp.name.toUpperCase()}! Khôi phục sắc màu & mở Dịch Chuyển Nhanh [M]!`,
        "epic"
      );
      this.saveGame(false);
    } else {
      this.vfx.spawnPooled("heal-aoe", { x: this.player.x, y: this.player.y });
      this.ui.onToast(`Đã hồi đầy HP/Thể lực tại ${wp.name}. Mở Bản đồ [M] để Dịch Chuyển Nhanh!`, "good");
    }
    this.ui.onHudUpdate();
  }

  private _pickupGroundLoot(loot: (typeof this.spawner.groundLoot)[number]) {
    const idx = this.spawner.groundLoot.indexOf(loot);
    if (idx < 0) return;

    if (loot.kind === "gold" && loot.gold) {
      this.inv.gold += loot.gold;
      this.spawner.groundLoot.splice(idx, 1);
      sfx.playLootPickup(false);
      this.vfx.spawnPooled("collect-burst", { x: loot.x, y: loot.y });
      this.vfx.spawnDamageText(loot.x, loot.y - 6, `+${loot.gold}G`, { color: "#ffe066" });
      return;
    }

    if (loot.kind === "item" && loot.item) {
      const def = ITEMS[loot.item.defId];
      if (!def) {
        this.spawner.groundLoot.splice(idx, 1);
        return;
      }
      if (!this.inv.addExistingInstance(loot.item)) {
        this.ui.onToast("Túi đồ đã đầy (32/32)! Bán bớt trang bị tại [I] hoặc Thương Nhân.", "warn");
        return;
      }
      this.spawner.groundLoot.splice(idx, 1);
      const isRare = def.rarity === "rare" || def.rarity === "epic" || def.rarity === "legendary";
      sfx.playLootPickup(isRare);
      this.vfx.spawnPooled("collect-burst", { x: loot.x, y: loot.y });
      this.vfx.spawnDamageText(
        loot.x,
        loot.y - 8,
        loot.item.qty > 1 ? `+${loot.item.qty} ITEM` : `LOOT!`,
        { color: RARITY_INFO[def.rarity].color, crit: isRare }
      );
      if (def.category === "equipment") {
        this.ui.onToast(`Đã nhặt [${RARITY_INFO[def.rarity].label}] ${def.name}! Nhấn [I / B] để xem.`, isRare ? "epic" : "good");
      }
      this.ui.onHudUpdate();
    }
  }

  gainXp(amount: number) {
    this.player.xp += amount;
    let leveled = false;
    while (this.player.xp >= this.player.xpNext) {
      this.player.xp -= this.player.xpNext;
      this.player.level += 1;
      this.player.xpNext = Math.round(this.player.xpNext * 1.32 + 35);
      this.recalcPlayerStats(false);
      this.player.stamina = this.player.maxStamina;
      leveled = true;
    }
    if (leveled) {
      sfx.playLevelUp();
      this.vfx.spawnLive("ui/level-up", {
        x: this.player.x,
        y: this.player.y,
        follow: this.player,
        priority: 5,
      });
      this.vfx.spawnDamageText(this.player.x, this.player.y - 18, `LEVEL ${this.player.level}!`, {
        crit: true,
        color: "#ffe066",
      });
      this.ui.onToast(`THĂNG CẤP LV.${this.player.level}! HP, ATK, DEF tăng mạnh & hồi đầy máu!`, "epic");
      this.saveGame(false);
    }
    this.ui.onHudUpdate();
  }

  /** Gets nearest aggro Boss for Boss HP Bar display. */
  getActiveBoss(): EnemyEntity | null {
    let best: EnemyEntity | null = null;
    let bestD = 260;
    for (const e of this.spawner.enemies) {
      if (!e.isBoss || e.state !== "aggro") continue;
      const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  startLoop() {
    this.lastRaf = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastRaf) / 1000));
      this.lastRaf = now;
      this._update(dt);
      this._render();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  private _makeCombatContext(): CombatContext {
    return {
      player: this.player,
      world: this.world,
      spawner: this.spawner,
      vfx: this.vfx,
      colorSys: this.colorSys,
      inv: this.inv,
      quests: this.quests,
      projectiles: this.projectiles,
      turrets: this.turrets,
      hazards: this.hazards,
      addShake: (a) => {
        this.shake = Math.max(this.shake, a);
      },
      addHitstop: (s) => {
        this.hitstop = Math.max(this.hitstop, s);
      },
      notify: (msg, tone = "info") => this.ui.onToast(msg, tone),
      onGainXp: (amt) => this.gainXp(amt),
      onBossDefeated: (enemy) => {
        const name = ENEMIES[enemy.defId]?.name ?? "BOSS";
        sfx.playWaypoint();
        this.shake = 7;
        if (enemy.isWorldBoss) {
          // Restore the entire world color in celebration!
          this.colorSys.triggerWave(enemy.x, enemy.y, 1800, 480);
          this.ui.onBossVictory(true, name);
        } else {
          this.ui.onBossVictory(false, name);
        }
        this.saveGame(false);
      },
      onPlayerDefeated: () => {
        // Respawn cleanly at last activated Chroma Waypoint with full HP (zero item loss!)
        const wp = WAYPOINTS.find((w) => w.id === this.player.respawnWaypointId) ?? WAYPOINTS[0];
        this.player.x = wp.tx * TILE_SIZE + 8;
        this.player.y = (wp.ty + 1) * TILE_SIZE + 8;
        this.player.hp = this.player.maxHp;
        this.player.stamina = this.player.maxStamina;
        this.player.invuln = 1.5;
        this.projectiles.length = 0;
        this._snapCamera();
        this.vfx.spawnPooled("waypoint-pillar", { x: this.player.x, y: this.player.y });
        this.ui.onToast(`Bạn đã gục ngã và hồi sinh tại ${wp.name}! Hãy cường hóa trang bị nhé!`, "warn");
        this.ui.onHudUpdate();
      },
      stats: this.stats,
    };
  }

  private _update(dt: number) {
    this.time += dt;
    this.colorSys.update(dt);
    this.tileRenderer.syncOverviewMap(this.world, this.colorSys);

    if (!this.running || this.activeModal !== null) {
      this.vfx.update(dt * 0.5);
      return;
    }

    if (this.hitstop > 0) {
      this.hitstop -= dt;
      return;
    }

    if (this.shake > 0) this.shake = Math.max(0, this.shake - 18 * dt);

    const p = this.player;
    const combatCtx = this._makeCombatContext();

    // Cooldowns
    if (p.atkCd > 0) p.atkCd = Math.max(0, p.atkCd - dt);
    if (p.skillCd > 0) p.skillCd = Math.max(0, p.skillCd - dt);
    if (p.dashCd > 0) p.dashCd = Math.max(0, p.dashCd - dt);
    if (p.invuln > 0) p.invuln = Math.max(0, p.invuln - dt);
    if (p.hitFlash > 0) p.hitFlash = Math.max(0, p.hitFlash - dt);
    if (p.attackAnimTime > 0) p.attackAnimTime = Math.max(0, p.attackAnimTime - dt);

    // Passive HP regen inside Origin Town Safe Zone
    if (this.world.isInSafeTown(p.x, p.y) && p.hp < p.maxHp) {
      p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.12 * dt);
    }

    // Aim angle toward world mouse cursor
    const worldMouseX = this.camX + this.mouseScreenX;
    const worldMouseY = this.camY + this.mouseScreenY;
    p.aimAngle = Math.atan2(worldMouseY - p.y, worldMouseX - p.x);

    // WASD Movement + Shift Sprint + Stamina wheel
    let mx = 0;
    let my = 0;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) my -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) my += 1;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) mx -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) mx += 1;

    const moving = mx !== 0 || my !== 0;
    if (moving) {
      const len = Math.hypot(mx, my);
      mx /= len;
      my /= len;
      if (Math.abs(mx) > 0.1) p.facing = mx < 0 ? -1 : 1;
      if (p.attackAnimTime <= 0 && !p.charging) {
        if (Math.abs(mx) >= Math.abs(my)) {
          p.facingDir = mx < 0 ? "left" : "right";
        } else {
          p.facingDir = my < 0 ? "up" : "down";
        }
      }
    }

    const wantSprint = (this.keys.has("ShiftLeft") || this.keys.has("ShiftRight")) && moving && !p.exhausted && p.dashing <= 0;
    p.sprinting = wantSprint && p.stamina > 0;

    if (p.sprinting) {
      p.stamina = Math.max(0, p.stamina - 28 * dt);
      p.staminaRegenDelay = 0.55;
      if (p.stamina <= 0) {
        p.exhausted = true;
        p.sprinting = false;
      }
    } else if (p.charging) {
      p.staminaRegenDelay = 0.4;
    } else {
      if (p.staminaRegenDelay > 0) {
        p.staminaRegenDelay -= dt;
      } else if (p.stamina < p.maxStamina) {
        p.stamina = Math.min(p.maxStamina, p.stamina + 34 * dt);
        if (p.exhausted && p.stamina >= 35) p.exhausted = false;
      }
    }

    if (p.dashing > 0) {
      p.dashing -= dt;
      this.world.moveWithCollision(p, p.dashVx * dt, p.dashVy * dt, p.radius);
    } else if (moving) {
      const sprintMult = p.sprinting ? 1.48 : 1.0;
      const buffMult = p.speedBuffTime > 0 ? 1.28 : 1.0;
      const chargeSlow = p.charging && p.chargeTime > 0.18 ? 0.65 : 1.0;
      const spd = p.spd * sprintMult * buffMult * chargeSlow;
      this.world.moveWithCollision(p, mx * spd * dt, my * spd * dt, p.radius);
      p.walkTime += dt * (p.sprinting ? 11 : 7.5);
    }

    // Hold LMB Charge Attack logic (quick tap or continuous hold)
    if (this.mouseDown) {
      p.charging = true;
      p.chargeTime += dt;
      if (p.chargeTime > 0.35 && Math.random() < 0.4) {
        const ang = Math.random() * Math.PI * 2;
        this.vfx.spawnPixelDot(
          p.x + Math.cos(ang) * 14,
          p.y - 4 + Math.sin(ang) * 14,
          -Math.cos(ang) * 35,
          -Math.sin(ang) * 35,
          p.chargeTime >= 0.42 ? "#ffe066" : "#4be8ff",
          0.18,
          2
        );
      }
    } else if (p.charging) {
      if (p.chargeTime >= 0.4) {
        this.combat.performChargedAttack(combatCtx);
      }
      p.charging = false;
      p.chargeTime = 0;
    }

    // High-tier (Epic / Legendary) or +5/+7+ Weapon Glow & pixelfx Particles!
    const wpnInst = this.inv.equipment.weapon;
    const wpnDef = wpnInst ? ITEMS[wpnInst.defId] : undefined;
    const wpnLv = wpnInst?.enhanceLevel ?? 0;
    const isHighTierWeapon =
      wpnDef?.rarity === "epic" || wpnDef?.rarity === "legendary" || wpnLv >= 7;
    if (isHighTierWeapon || wpnLv >= 5) {
      const bleachedHere = !this.colorSys.isWorldPosRestored(p.x, p.y);
      const animState: HeroAnimState =
        p.dashing > 0
          ? "dash"
          : p.attackAnimTime > 0
            ? "attack"
            : p.charging && p.chargeTime > 0.12
              ? "charge"
              : moving
                ? "run"
                : "idle";
      const anchor = getWeaponAnchorOffset(p.facing, p.facingDir, animState);
      const wx = p.x + anchor.dx;
      const wy = p.y + anchor.dy;

      this.weaponGlowTimer -= dt;
      if (this.weaponGlowTimer <= 0) {
        this.weaponGlowTimer = wpnLv >= 8 || wpnDef?.rarity === "legendary" ? 0.08 : 0.13;
        const a = this.time * 4.5 + Math.random() * 1.4;
        const col = bleachedHere
          ? "#c2c9d6"
          : wpnDef?.rarity === "legendary" || wpnLv >= 8
            ? CHROMA_RAINBOW[Math.floor(this.time * 8) % CHROMA_RAINBOW.length]
            : wpnDef?.rarity === "epic"
              ? "#c266ff"
              : "#ffe066";
        this.vfx.spawnPixelDot(
          wx + Math.cos(a) * 4,
          wy + Math.sin(a) * 4,
          (Math.random() - 0.5) * 8,
          -14,
          col,
          0.32,
          1
        );
      }

      if (isHighTierWeapon && !bleachedHere) {
        this.weaponPixelfxTimer -= dt;
        if (this.weaponPixelfxTimer <= 0) {
          this.weaponPixelfxTimer =
            wpnDef?.rarity === "legendary" || wpnLv >= 9 ? 0.55 : 0.85;
          const preset =
            wpnDef?.rarity === "legendary" || wpnLv >= 8
              ? "crit-gold"
              : wpnDef?.rarity === "epic"
                ? "hit-poison"
                : "hit-cyan";
          this.vfx.spawnPooled(preset, { x: wx, y: wy, scale: 0.65 });
        }
      }
    }

    // Combat, Enemies, Spawners, VFX
    this.combat.update(combatCtx, dt);
    this.spawner.update(dt, p.x, p.y, this.vfx);
    this.vfx.update(dt);

    // Magnetic Pull + Auto-pickup when walking near Ground Loot
    for (let i = this.spawner.groundLoot.length - 1; i >= 0; i--) {
      const l = this.spawner.groundLoot[i];
      if (l.age < 0.28) continue;
      const dx = p.x - l.x;
      const dy = p.y - l.y;
      const d = Math.hypot(dx, dy);
      const isEquip = l.kind === "item" && l.item && ITEMS[l.item.defId]?.category === "equipment";
      const magnetRadius = isEquip ? 44 : 58;
      if (d < magnetRadius && d > 1) {
        if (!isEquip || this.inv.bag.length < 32) {
          const pull = (isEquip ? 140 : 185) * dt;
          l.x += (dx / d) * Math.min(d, pull);
          l.y += (dy / d) * Math.min(d, pull);
        }
      }
      if (d < 17) {
        this._pickupGroundLoot(l);
      }
    }

    // Detect biome transitions (shows nice biome banner toast!)
    const biome = this.world.getBiomeAtWorld(p.x, p.y);
    if (biome !== this.currentBiome) {
      this.currentBiome = biome;
      const cfg = BIOME_CONFIGS[biome];
      this.ui.onToast(`Tiến vào ${cfg.name} (${cfg.levelRange})`, "info");
    }

    // Nearest [F] Interactable
    this.nearestInteractable = findNearestInteractable(
      p.x,
      p.y,
      this.colorSys,
      this.spawner.chests,
      this.spawner.groundLoot
    );

    // Smooth camera follow clamped to world bounds
    const targetCamX = Math.max(0, Math.min(WORLD_W - VIEW_W, p.x - VIEW_W / 2));
    const targetCamY = Math.max(0, Math.min(WORLD_H - VIEW_H, p.y - VIEW_H / 2));
    this.camX += (targetCamX - this.camX) * Math.min(1, dt * 10);
    this.camY += (targetCamY - this.camY) * Math.min(1, dt * 10);

    // Auto-save every 18s & HUD throttled sync (~12 Hz)
    this.autoSaveTimer += dt;
    if (this.autoSaveTimer >= 18) {
      this.autoSaveTimer = 0;
      this.saveGame(false);
    }

    this.hudSyncTimer += dt;
    if (this.hudSyncTimer >= 0.08) {
      this.hudSyncTimer = 0;
      this.ui.onHudUpdate();
    }
  }

  private _snapCamera() {
    this.camX = Math.max(0, Math.min(WORLD_W - VIEW_W, this.player.x - VIEW_W / 2));
    this.camY = Math.max(0, Math.min(WORLD_H - VIEW_H, this.player.y - VIEW_H / 2));
  }

  private _render() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;

    const shakeX = this.shake > 0.2 ? Math.round((Math.random() - 0.5) * this.shake * 2) : 0;
    const shakeY = this.shake > 0.2 ? Math.round((Math.random() - 0.5) * this.shake * 2) : 0;
    const camX = Math.round(this.camX) + shakeX;
    const camY = Math.round(this.camY) + shakeY;

    // 1. Viewport-culled 16-bit Tilemap Ground
    this.tileRenderer.drawVisibleGround(ctx, this.world, this.colorSys, camX, camY, VIEW_W, VIEW_H, this.time);

    // 2. Back pixelfx Layer (teleporter pads, spawn portals, ground waves)
    this.vfx.drawLayer(ctx, camX, camY, "back");

    // 3. Active Waypoint pad glow (looping pixelfx atlas!)
    const padAtlas = this.vfx.getAtlas("waypoint-pad");
    for (const wp of WAYPOINTS) {
      if (!this.colorSys.unlockedWaypoints.has(wp.id)) continue;
      const sx = wp.tx * TILE_SIZE + 8 - camX;
      const sy = wp.ty * TILE_SIZE + 12 - camY;
      if (sx < -32 || sy < -32 || sx > VIEW_W + 32 || sy > VIEW_H + 32) continue;
      this.vfx.drawAtlasInstance(ctx, padAtlas, sx, sy, this.time, 0, false, 0.85, 0.9);
    }

    // 4. Ground Loot + Bounce Shadow + pixelfx Rarity Loot Beams!
    const coinAtlas = this.vfx.getAtlas("coin-spin");
    const shardAtlas = this.vfx.getAtlas("crystal-shard");
    for (const l of this.spawner.groundLoot) {
      const sx = Math.round(l.x - camX);
      const sy = Math.round(l.y - camY);
      if (sx < -32 || sy < -32 || sx > VIEW_W + 32 || sy > VIEW_H + 32) continue;
      const bounceY = Math.round(l.z);
      const bob = l.z <= 0.5 ? Math.round(Math.sin(this.time * 5 + l.bobPhase) * 2) : 0;
      const vy = sy - bounceY + bob;

      // Crisp ground shadow under bouncing loot
      ctx.fillStyle = "rgba(0,0,0,0.38)";
      ctx.fillRect(sx - 3, sy + 1, 6, 2);

      if (l.kind === "gold") {
        this.vfx.drawAtlasInstance(ctx, coinAtlas, sx, vy, this.time + l.bobPhase);
      } else if (l.item) {
        const def = ITEMS[l.item.defId];
        if (def?.category === "equipment") {
          const beam = this.vfx.getAtlas(RARITY_INFO[l.rarity].beamPreset);
          this.vfx.drawAtlasInstance(ctx, beam, sx, sy - 6, this.time + l.bobPhase, 0, false, 1, 0.95);
          // Crisp 8x8 pixel equipment crystal/chest icon on floor
          ctx.fillStyle = "#100c18";
          ctx.fillRect(sx - 4, vy - 4, 8, 8);
          ctx.fillStyle = RARITY_INFO[l.rarity].color;
          ctx.fillRect(sx - 3, vy - 3, 6, 6);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(sx - 2, vy - 2, 2, 2);
        } else {
          this.vfx.drawAtlasInstance(ctx, shardAtlas, sx, vy, this.time + l.bobPhase);
        }
      }
    }

    // 5. Y-Sorted World Drawables (Buildings, Props, Waypoints, Chests, Ores, NPCs, Turrets, Enemies, Player)
    const drawList: { y: number; draw: () => void }[] = [];

    // Town Buildings
    for (const b of this.world.buildings) {
      const sx = Math.round(b.x - camX);
      const sy = Math.round(b.y - camY);
      if (sx < -64 || sy < -64 || sx > VIEW_W + 64 || sy > VIEW_H + 64) continue;
      drawList.push({
        y: b.y,
        draw: () => {
          const img = sprites.buildings[b.kind];
          ctx.drawImage(img, Math.round(sx - img.width / 2), Math.round(sy - img.height + 6));
          if (b.kind === "classAltar") {
            const tw = textWidth("CLASS ALTAR", "mini");
            const lx = Math.round(sx - tw / 2);
            const ly = Math.round(sy - 30);
            ctx.fillStyle = "#100c1c";
            ctx.fillRect(lx - 2, ly - 1, tw + 4, 8);
            ctx.fillStyle = "#4be8ff";
            rasterText("CLASS ALTAR", "mini", (gx: number, gy: number) => ctx.fillRect(lx + gx, ly + gy, 1, 1));
          }
        },
      });
    }

    // Viewport-culled Props (trees, rocks, pillars)
    const visProps = this.world.getVisibleProps(camX, camY, VIEW_W, VIEW_H);
    for (const pr of visProps) {
      const sx = Math.round(pr.x - camX);
      const sy = Math.round(pr.y - camY);
      const restored = this.colorSys.isWorldPosRestored(pr.x, pr.y);
      const tset = restored ? sprites.tilesRestored[pr.biome] : sprites.tilesBleached[pr.biome];
      const img = pr.kind === "tree" ? tset.tree : pr.kind === "rock" ? tset.rock : tset.pillar;
      drawList.push({
        y: pr.y,
        draw: () => {
          ctx.drawImage(img, Math.round(sx - img.width / 2), Math.round(sy - img.height + 4));
        },
      });
    }

    // Chroma Waypoints
    for (const wp of WAYPOINTS) {
      const wx = wp.tx * TILE_SIZE + 8;
      const wy = wp.ty * TILE_SIZE + 10;
      const sx = Math.round(wx - camX);
      const sy = Math.round(wy - camY);
      if (sx < -32 || sy < -40 || sx > VIEW_W + 32 || sy > VIEW_H + 40) continue;
      const unlocked = this.colorSys.unlockedWaypoints.has(wp.id);
      drawList.push({
        y: wy,
        draw: () => {
          const img = unlocked ? sprites.interactables.waypointOn : sprites.interactables.waypointOff;
          ctx.drawImage(img, Math.round(sx - img.width / 2), Math.round(sy - img.height + 4));
        },
      });
    }

    // Camp Treasure Chests
    for (const ch of this.spawner.chests) {
      const sx = Math.round(ch.x - camX);
      const sy = Math.round(ch.y - camY);
      if (sx < -24 || sy < -24 || sx > VIEW_W + 24 || sy > VIEW_H + 24) continue;
      drawList.push({
        y: ch.y,
        draw: () => {
          const img =
            ch.state === "opened"
              ? sprites.interactables.chestOpened
              : ch.state === "unlocked"
                ? sprites.interactables.chestUnlocked
                : sprites.interactables.chestLocked;
          ctx.drawImage(img, sx - 8, sy - 12);
        },
      });
    }

    // Resource Nodes (Ores & Crystals)
    for (const res of this.spawner.resources) {
      if (!res.alive) continue;
      const sx = Math.round(res.x - camX);
      const sy = Math.round(res.y - camY);
      if (sx < -24 || sy < -24 || sx > VIEW_W + 24 || sy > VIEW_H + 24) continue;
      drawList.push({
        y: res.y,
        draw: () => {
          const img = sprites.interactables[res.def.kind];
          const jx = res.hitFlash > 0 ? Math.round((Math.random() - 0.5) * 2) : 0;
          ctx.drawImage(img, sx - 9 + jx, sy - 14);
          if (res.hp < res.maxHp) {
            ctx.fillStyle = "#100c18";
            ctx.fillRect(sx - 8, sy - 17, 16, 3);
            ctx.fillStyle = "#ffe066";
            ctx.fillRect(sx - 7, sy - 16, Math.max(1, Math.round((res.hp / res.maxHp) * 14)), 1);
          }
        },
      });
    }

    // Town NPCs with overhead ! / ? Quest Badges
    for (const npc of TOWN_NPCS) {
      const nx = npc.tx * TILE_SIZE + 8;
      const ny = npc.ty * TILE_SIZE + 8;
      const sx = Math.round(nx - camX);
      const sy = Math.round(ny - camY);
      if (sx < -24 || sy < -24 || sx > VIEW_W + 24 || sy > VIEW_H + 24) continue;
      const marker = this.quests.getNpcMarker(npc.id);
      drawList.push({
        y: ny,
        draw: () => {
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.fillRect(sx - 5, sy - 1, 10, 3);
          const sp = sprites.npcs[npc.kind];
          const bob = Math.floor(this.time * 2) & 1;
          ctx.drawImage(sp.right, sx - 8, sy - 16 + bob);

          if (marker) {
            const by = sy - 26 + Math.round(Math.sin(this.time * 6) * 2);
            ctx.fillStyle = "#100c18";
            ctx.fillRect(sx - 5, by - 1, 10, 10);
            ctx.fillStyle = marker === "?" ? "#44ee88" : "#ffe066";
            ctx.fillRect(sx - 4, by, 8, 8);
            ctx.fillStyle = "#100c18";
            rasterText(marker, "mini", (gx: number, gy: number) => ctx.fillRect(sx - 2 + gx, by + 1 + gy, 1, 1));
          }
        },
      });
    }

    // Compile Turrets
    for (const t of this.turrets) {
      const sx = Math.round(t.x - camX);
      const sy = Math.round(t.y - camY);
      if (sx < -24 || sy < -24 || sx > VIEW_W + 24 || sy > VIEW_H + 24) continue;
      drawList.push({
        y: t.y,
        draw: () => {
          const sp = sprites.summons.turret;
          ctx.drawImage(t.hitFlash > 0 ? sp.whiteRight : sp.right, sx - 8, sy - 15);
          // HP & Overclock bar
          ctx.fillStyle = "#100c18";
          ctx.fillRect(sx - 7, sy - 18, 14, 3);
          ctx.fillStyle = t.overclockTime > 0 ? "#ffe066" : "#44ee88";
          ctx.fillRect(sx - 6, sy - 17, Math.max(1, Math.round((t.hp / t.maxHp) * 12)), 1);
        },
      });
    }

    // Viewport-culled Enemies & Bosses
    for (const e of this.spawner.enemies) {
      const sx = Math.round(e.x - camX);
      const sy = Math.round(e.y - camY);
      if (sx < -36 || sy < -40 || sx > VIEW_W + 36 || sy > VIEW_H + 40) continue;
      drawList.push({
        y: e.y,
        draw: () => {
          const frame = Math.floor(e.walkTime * 5) & 1;
          const sp = sprites.getEnemy(e.defId, frame);
          ctx.fillStyle = "rgba(0,0,0,0.38)";
          const sw = e.isBoss ? 22 : 10;
          ctx.fillRect(Math.round(sx - sw / 2), sy - 1, sw, 3);

          const img =
            e.hitFlash > 0
              ? e.facing < 0
                ? sp.whiteLeft
                : sp.whiteRight
              : e.facing < 0
                ? sp.left
                : sp.right;
          ctx.drawImage(img, Math.round(sx - sp.w / 2), Math.round(sy - sp.h));

          // Elemental status pip above enemy
          if (e.element) {
            ctx.fillStyle = e.element === "fire" ? "#ff5533" : e.element === "ice" ? "#55eeff" : "#55ff66";
            ctx.fillRect(sx - 2, sy - sp.h - 7, 4, 3);
          }

          // Compact pixel HP bar (non-bosses when damaged)
          if (!e.isBoss && e.hp < e.maxHp) {
            ctx.fillStyle = "#100c18";
            ctx.fillRect(sx - 8, sy - sp.h - 4, 16, 3);
            ctx.fillStyle = "#ff3355";
            ctx.fillRect(sx - 7, sy - sp.h - 3, Math.max(1, Math.round((e.hp / e.maxHp) * 14)), 1);
          }
        },
      });
    }

    // Player Hero (Layered Paper-Doll Pixel Rendering + Bit Rogue Phantom Clone + Pixel Tinker Drone)
    {
      const p = this.player;
      const sx = Math.round(p.x - camX);
      const sy = Math.round(p.y - camY);
      const heroBleached = !this.colorSys.isWorldPosRestored(p.x, p.y);
      const isMovingNow =
        this.keys.has("KeyW") ||
        this.keys.has("KeyS") ||
        this.keys.has("KeyA") ||
        this.keys.has("KeyD") ||
        this.keys.has("ArrowUp") ||
        this.keys.has("ArrowDown") ||
        this.keys.has("ArrowLeft") ||
        this.keys.has("ArrowRight");
      const heroAnim: HeroAnimState =
        p.dashing > 0
          ? "dash"
          : p.attackAnimTime > 0
            ? "attack"
            : p.charging && p.chargeTime > 0.12
              ? "charge"
              : isMovingNow
                ? "run"
                : "idle";
      const chargePct = p.charging ? Math.min(1, p.chargeTime / 0.42) : 0;

      drawList.push({
        y: p.y,
        draw: () => {
          const frame = Math.floor(p.walkTime) % 4;

          // Phantom Clone ghost beside Bit Rogue
          if (p.cloneTime > 0) {
            ctx.save();
            ctx.globalAlpha = 0.6;
            const cx = sx - p.facing * 12;
            const cy = sy - 2 + Math.round(Math.sin(this.time * 12) * 2);
            drawPaperDollHero(ctx, {
              classId: p.classId,
              equipment: this.inv.equipment,
              x: cx,
              y: cy,
              scale: 1,
              walkFrame: frame,
              facing: p.facing,
              facingDir: p.facingDir,
              animState: heroAnim,
              bleached: heroBleached,
              time: this.time,
            });
            ctx.restore();
          }

          // Weapon +5+ / Epic / Legendary subtle pixel aura ring at feet
          const wpnInst = this.inv.equipment.weapon;
          const wpnDef = wpnInst ? ITEMS[wpnInst.defId] : undefined;
          const wpnLv = wpnInst?.enhanceLevel ?? 0;
          if (wpnLv >= 5 || wpnDef?.rarity === "epic" || wpnDef?.rarity === "legendary") {
            ctx.fillStyle = heroBleached
              ? "#adb4c2"
              : wpnDef?.rarity === "legendary" || wpnLv >= 8
                ? "#ff9922"
                : wpnDef?.rarity === "epic"
                  ? "#c266ff"
                  : "#ffe066";
            ctx.fillRect(sx - 6, sy, 12, 1);
            ctx.fillRect(sx - 4, sy + 1, 8, 1);
          }

          ctx.fillStyle = "rgba(0,0,0,0.4)";
          ctx.fillRect(sx - 5, sy - 1, 10, 3);

          const blink = p.invuln > 0 && ((Math.floor(this.time * 24) & 1) === 1);
          if (!blink) {
            drawPaperDollHero(ctx, {
              classId: p.classId,
              equipment: this.inv.equipment,
              x: sx,
              y: sy,
              scale: 1,
              walkFrame: frame,
              facing: p.facing,
              facingDir: p.facingDir,
              animState: heroAnim,
              hitFlash: p.hitFlash > 0,
              bleached: heroBleached,
              time: this.time,
              chargePct,
            });
          }

          // Charge indicator bar underneath hero when holding LMB
          if (p.charging && p.chargeTime > 0.12) {
            const pct = Math.min(1, p.chargeTime / 0.42);
            ctx.fillStyle = "#100c18";
            ctx.fillRect(sx - 8, sy + 3, 16, 3);
            ctx.fillStyle = pct >= 1 ? "#ffe066" : "#4be8ff";
            ctx.fillRect(sx - 7, sy + 4, Math.round(pct * 14), 1);
          }

          // Pixel Tinker Q Overload Drone orbiting hero
          if (p.droneTime > 0) {
            const dx = sx + Math.round(Math.cos(this.time * 5.5) * 16);
            const dy = sy - 14 + Math.round(Math.sin(this.time * 5.5) * 7);
            ctx.drawImage(sprites.summons.drone.right, dx - 6, dy - 6);
          }
        },
      });
    }

    drawList.sort((a, b) => a.y - b.y);
    for (const item of drawList) item.draw();

    // 6. Projectiles (baked pixelfx atlases, viewport-culled)
    for (const pr of this.projectiles) {
      const sx = pr.x - camX;
      const sy = pr.y - camY;
      if (sx < -24 || sy < -24 || sx > VIEW_W + 24 || sy > VIEW_H + 24) continue;
      const atlas = this.vfx.getAtlas(pr.preset);
      this.vfx.drawAtlasInstance(ctx, atlas, sx, sy, pr.life, pr.angle, false, 1, 1);
    }

    // 7. Front pixelfx Layer (slashes, beams, impacts, explosions, dots, damage numbers)
    this.vfx.drawLayer(ctx, camX, camY, "front");

    // 8. Crisp World-Space Pixel Stamina Wheel (Genshin/Zelda style: appears when draining, hides when full!)
    this._drawStaminaWheel(ctx, Math.round(this.player.x - camX) + 14, Math.round(this.player.y - camY) - 10);

    // 9. Crisp Pixel Crosshair (only while playing)
    if (this.running && this.activeModal === null) {
      const mx = Math.round(this.mouseScreenX);
      const my = Math.round(this.mouseScreenY);
      ctx.fillStyle = "#100c18";
      ctx.fillRect(mx - 4, my - 1, 9, 3);
      ctx.fillRect(mx - 1, my - 4, 3, 9);
      ctx.fillStyle = "#5ef2ff";
      ctx.fillRect(mx - 3, my, 2, 1);
      ctx.fillRect(mx + 2, my, 2, 1);
      ctx.fillRect(mx, my - 3, 1, 2);
      ctx.fillRect(mx, my + 2, 1, 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(mx, my, 1, 1);
    }
  }

  private _drawStaminaWheel(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    const p = this.player;
    if (p.stamina >= p.maxStamina - 0.5 && !p.exhausted) return;

    const filled = Math.ceil((p.stamina / p.maxStamina) * STAMINA_RING_PTS.length);
    const col = p.exhausted
      ? (Math.floor(this.time * 12) & 1) ? "#ff3355" : "#ff8866"
      : p.stamina < 30
        ? "#ffaa22"
        : "#44ee88";

    for (let i = 0; i < STAMINA_RING_PTS.length; i++) {
      const [ox, oy] = STAMINA_RING_PTS[i];
      ctx.fillStyle = "#0e0c18";
      ctx.fillRect(cx + ox - 1, cy + oy - 1, 4, 4);
      ctx.fillStyle = i < filled ? col : "#2d3240";
      ctx.fillRect(cx + ox, cy + oy, 2, 2);
    }
  }

  private _bindInputs() {
    window.addEventListener("keydown", (e) => {
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        if (this.activeModal === null) e.preventDefault();
      }

      // Modal hotkeys work even while a modal is open
      if (e.code === "Escape") {
        if (!this.running) return;
        if (this.activeModal !== null) this.setModal(null);
        else this.setModal("pause");
        return;
      }
      if (e.code === "KeyI" || e.code === "KeyB") {
        this.toggleModal("inventory");
        return;
      }
      if (e.code === "KeyJ") {
        this.toggleModal("journal");
        return;
      }
      if (e.code === "KeyM") {
        this.toggleModal("world_map");
        return;
      }

      if (!this.running || this.activeModal !== null) return;
      sfx.unlock();
      this.keys.add(e.code);

      if (e.code === "KeyF") {
        this.interactNearest();
      } else if (e.code === "KeyE") {
        this.combat.performSkillE(this._makeCombatContext());
      } else if (e.code === "KeyQ") {
        this.combat.performUltimateQ(this._makeCombatContext());
      } else if (e.code === "Space") {
        let mx = 0, my = 0;
        if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) my -= 1;
        if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) my += 1;
        if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) mx -= 1;
        if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) mx += 1;
        this.combat.performDash(this._makeCombatContext(), mx, my);
      } else if (e.code === "Digit1") {
        this.useConsumableSlot(1);
      } else if (e.code === "Digit2") {
        this.useConsumableSlot(2);
      } else if (e.code === "Digit3") {
        this.useConsumableSlot(3);
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.code);
    });

    window.addEventListener("blur", () => {
      this.keys.clear();
      this.mouseDown = false;
    });

    const updateMouse = (ev: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      this.mouseScreenX = ((ev.clientX - rect.left) / rect.width) * VIEW_W;
      this.mouseScreenY = ((ev.clientY - rect.top) / rect.height) * VIEW_H;
    };

    this.canvas.addEventListener("mousemove", updateMouse);
    this.canvas.addEventListener("mousedown", (ev) => {
      if (!this.running || this.activeModal !== null) return;
      sfx.unlock();
      updateMouse(ev);
      if (ev.button === 0) {
        this.mouseDown = true;
        this.player.chargeTime = 0;
        this.player.charging = true;
        // Immediate crisp primary attack on click (and holding >= 0.4s releases Charged Attack!)
        this.combat.performPrimaryAttack(this._makeCombatContext());
      } else if (ev.button === 2) {
        this.combat.performSkillE(this._makeCombatContext());
      }
    });

    window.addEventListener("mouseup", (ev) => {
      if (ev.button === 0) {
        this.mouseDown = false;
      }
    });

    this.canvas.addEventListener("contextmenu", (ev) => ev.preventDefault());
  }
}
