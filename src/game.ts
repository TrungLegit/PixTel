import { getClassDef } from "./data/classes";
import { ELEMENT_META, normalizeElement } from "./data/elements";
import { ENEMIES } from "./data/enemies";
import { CONSUMABLE_GROUP_LABELS, ITEMS, RARITY_INFO, createItemInstance } from "./data/items";
import { rollEnemyDropTable } from "./data/lootTables";
import { LORE_TABLETS } from "./data/lore";
import {
  BIOME_CONFIGS,
  BOSS_ARENAS,
  CHROMA_RAINBOW,
  CLASS_ALTAR_POS,
  GACHA_ALTAR_POS,
  STORAGE_CHEST_POS,
  TILE_SIZE,
  TOWN_NPCS,
  WAYPOINTS,
  WORLD_H,
  WORLD_W,
} from "./data/worldConfig";
import {
  EQUIP_SLOTS,
  type ActiveBossLock,
  type BiomeId,
  type ClassId,
  type EquipSlot,
  type ItemInstance,
  type LoreTabletDef,
  type RecipeDef,
  type SaveDataV2,
  type StatAllocKey,
  type WaypointDef,
} from "./data/types";
import { ColorRestorationSystem } from "./graphics/colorRestoration";
import { drawCodixelEnemy, getCodixelEnemySize } from "./graphics/enemyAtlas";
import {
  drawPaperDollHero,
  getWeaponAnchorOffset,
  type HeroAnimState,
  type HeroAttackKind,
} from "./graphics/paperDoll";

export type EquipmentMap = Partial<Record<EquipSlot, ItemInstance>>;
import { sprites } from "./graphics/pixelSprites";
import { drawCodixelIcon } from "./graphics/codixelAtlas";
import { drawItemIcon } from "./graphics/itemIcons";
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
import { InventorySystem, recalculatePlayerStats } from "./systems/inventorySystem";
import { ItemEffectSystem } from "./systems/ItemEffectSystem";
import { QuestSystem } from "./systems/questSystem";
import { ForgeSystem } from "./systems/forgeSystem";
import { GachaSystem } from "./systems/gachaSystem";
import { SaveSystem } from "./systems/saveSystem";
import { CombatSystem, type CombatContext } from "./systems/combat";
import { CoopClient, type WebSocketFactory } from "./net/coopClient";
import type {
  CompactEquipSlot,
  EnemyNetSnapshot,
  NetGamePacket,
  PlayerNetSnapshot,
} from "./net/protocol";
import { BEGINNER_PRACTICE_STEPS } from "./ui/TutorialModal";
import { sfx } from "./audio/chiptuneSynth";

export type ModalId =
  | null
  | "class_select"
  | "dialogue"
  | "inventory"
  | "stash"
  | "forge"
  | "gacha"
  | "world_map"
  | "journal"
  | "tutorial"
  | "coop"
  | "pause";

export interface RemotePlayerRuntime {
  snap: PlayerNetSnapshot;
  renderX: number;
  renderY: number;
  cachedEquip: EquipmentMap;
  equipSig: string;
  lastSeen: number;
}

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
  readonly gacha = new GachaSystem();
  readonly saveSys = new SaveSystem();
  readonly combat = new CombatSystem();
  readonly itemEffects = new ItemEffectSystem();
  readonly coop: CoopClient;
  readonly remotePlayers = new Map<string, RemotePlayerRuntime>();

  player!: PlayerEntity;
  readonly projectiles: ProjectileEntity[] = [];
  readonly turrets: TurretEntity[] = [];
  readonly hazards: HazardEntity[] = [];
  discoveredLore = new Set<string>();
  unlockedHiddenItems = new Set<string>();
  unlockedHiddenRecipes = new Set<string>();
  defeatedBossIds = new Set<string>();

  camX = 0;
  camY = 0;
  time = 0;
  running = false;
  activeModal: ModalId = "class_select";
  currentBiome: BiomeId = "town";
  nearestInteractable: InteractableTarget | null = null;
  tutorialActive = false;
  tutorialStep = 0;
  tutorialComboHits = 0;
  tutorialCompleted = false;
  private tutorialMoveDist = 0;
  private tutorialReturnModal: ModalId = null;
  coopReturnModal: ModalId = null;

  // Phase 1 Mobile Twin-Stick & Smart Auto-Aim state
  mobileMode = false;
  touchMoveX = 0;
  touchMoveY = 0;
  touchSprint = false;
  autoAimTargetUid: number | null = null;

  // Phase 2 Co-op sync timers
  private netPlayerTimer = 0;
  private netWorldTimer = 0;

  stats: {
    kills: number;
    mined: number;
    chestsOpened: number;
    bossesDefeated: number;
    reactionsTriggered?: number;
  } = { kills: 0, mined: 0, chestsOpened: 0, bossesDefeated: 0, reactionsTriggered: 0 };

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
  private lastBarrierWarn = 0;
  private lastRaf = 0;
  private ui: GameUiCallbacks;

  activeBossLock: ActiveBossLock | null = null;

  constructor(canvas: HTMLCanvasElement, ui: GameUiCallbacks, customWsFactory?: WebSocketFactory) {
    this.canvas = canvas;
    this.canvas.width = VIEW_W;
    this.canvas.height = VIEW_H;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.ui = ui;

    this.coop = new CoopClient(
      {
        onStatusChange: (_st, detail) => {
          if (detail && this.running) {
            this.ui.onHudUpdate();
          }
        },
        onPacket: (fromId, pkt) => this._handleNetPacket(fromId, pkt),
        onPeerJoined: () => {
          if (this.coop.isHost) {
            this._sendWelcomeSnapshot();
          }
          this.ui.onHudUpdate();
        },
        onPeerLeft: (peerId) => {
          const gone = this.remotePlayers.get(peerId);
          this.remotePlayers.delete(peerId);
          if (gone) {
            this.ui.onToast(`👋 ${gone.snap.name} đã rời tổ đội.`, "warn");
          }
          this.ui.onHudUpdate();
        },
      },
      customWsFactory
    );

    sprites.init();
    this.vfx.warmup();
    this.unlockedHiddenItems = new Set(this.saveSys.loadHiddenUnlocks());
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
      overdrive: 0,
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
      grimoireTimer: 1.5,
      exoticMods: new Set(),
      exoticIcds: {},
      potCd: 0,
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
      statPoints: 0,
      allocatedStats: { str: 0, vit: 0, agi: 0, crt: 0 },
      respawnWaypointId: "wp_town",
    };
  }

  /** Allocates 1 Level-Up Stat Point to STR / VIT / AGI / CRT. */
  allocateStat(key: StatAllocKey): boolean {
    if (this.player.statPoints <= 0) return false;
    this.player.statPoints -= 1;
    this.player.allocatedStats[key] += 1;
    this.recalcPlayerStats(true);
    sfx.playUiClick();
    this.saveGame(false);
    this.ui.onHudUpdate();
    return true;
  }

  /** Resets all allocated Stat Points for 100G. */
  respecStats(): boolean {
    const alloc = this.player.allocatedStats;
    const total = alloc.str + alloc.vit + alloc.agi + alloc.crt;
    if (total <= 0) {
      this.ui.onToast("Chưa có điểm tiềm năng nào được cộng để tẩy!", "info");
      return false;
    }
    const cost = 100;
    if (this.inv.gold < cost) {
      sfx.playForgeFail();
      this.ui.onToast(`Cần ${cost} G để tẩy điểm tiềm năng!`, "warn");
      return false;
    }
    this.inv.gold -= cost;
    this.player.statPoints += total;
    this.player.allocatedStats = { str: 0, vit: 0, agi: 0, crt: 0 };
    this.recalcPlayerStats(true);
    sfx.playForgeSuccess();
    this.ui.onToast(`Đã tẩy ${total} điểm! Bạn có ${this.player.statPoints} điểm để cộng lại.`, "good");
    this.saveGame(false);
    this.ui.onHudUpdate();
    return true;
  }

  refreshHud() {
    this.ui.onHudUpdate();
  }

  /** Recomputes maxHp, atk, def, spd, crit, elementBonus from Class + Level + Equipped Items. */
  recalcPlayerStats(preserveHpRatio = true) {
    recalculatePlayerStats(this.player, this.inv, preserveHpRatio);
  }

  /** Alias matching RPG stats recalculation API. */
  recalculatePlayerStats(preserveHpRatio = true) {
    recalculatePlayerStats(this.player, this.inv, preserveHpRatio);
  }

  startNewGame(classId: ClassId, enableTutorial = true) {
    sfx.unlock();
    this.projectiles.length = 0;
    this.turrets.length = 0;
    this.hazards.length = 0;
    this.activeBossLock = null;
    this.lastBarrierWarn = 0;
    this.vfx.clearAll();

    this.inv.resetStarterKit(classId);
    this.quests.reset();
    this.gacha.reset();
    this.itemEffects.reset();
    this.colorSys.reset();
    this.discoveredLore.clear();
    this.unlockedHiddenRecipes.clear();
    this.defeatedBossIds.clear();
    this.spawner.reset([]);
    this.stats = { kills: 0, mined: 0, chestsOpened: 0, bossesDefeated: 0, reactionsTriggered: 0 };

    this._initBlankPlayer(classId);
    this.recalcPlayerStats(false);
    this.currentBiome = this.world.getBiomeAtWorld(this.player.x, this.player.y);
    this._snapCamera();
    this.tileRenderer.syncOverviewMap(this.world, this.colorSys);

    this.tutorialCompleted = false;
    this.tutorialStep = 0;
    this.tutorialComboHits = 0;
    this.tutorialMoveDist = 0;
    this.tutorialActive = enableTutorial;
    this.tutorialReturnModal = null;

    this.running = true;
    this.setModal(null);
    this.saveGame(false);
    this.vfx.spawnPooled("waypoint-pillar", { x: this.player.x, y: this.player.y });
    this.ui.onToast(
      enableTutorial
        ? `HỒI I: NGỌN ĐÈN CUỐI CÙNG — Làm theo Hướng Dẫn Tân Thủ ở giữa màn hình hoặc bấm [H] mở Cẩm Nang!`
        : `HỒI I: NGỌN ĐÈN CUỐI CÙNG — Gặp Trưởng Làng Elian [F] hoặc giải mã Bia Ký tại Quảng Trường!`,
      "epic"
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
    this.activeBossLock = null;
    this.lastBarrierWarn = 0;
    this.vfx.clearAll();

    this.inv.loadState(data.player.gold, data.equipment, data.bag, {
      bagCapacity: data.bagCapacity,
      backpackTier: data.backpackTier,
      stash: data.stash,
      autoSell: data.autoSell,
    });
    const unequipped = this.inv.unequipIncompatibleForClass(data.classId);
    this.quests.loadState(data.quests);
    this.gacha.importState(data.gachaState);
    this.colorSys.loadUnlocked(data.unlockedWaypoints);
    this.discoveredLore = new Set(data.discoveredLore ?? []);
    this.unlockedHiddenRecipes = new Set(data.unlockedHiddenRecipes ?? []);
    this.defeatedBossIds = new Set(data.defeatedBossIds ?? []);
    this.itemEffects.reset();
    for (const hid of this.saveSys.loadHiddenUnlocks()) this.unlockedHiddenItems.add(hid);
    for (const hid of data.unlockedHiddenItems ?? []) this.unlockedHiddenItems.add(hid);
    for (const slot of EQUIP_SLOTS) {
      const eq = this.inv.equipment[slot];
      if (eq && ITEMS[eq.defId]?.isHidden) this.unlockedHiddenItems.add(eq.defId);
    }
    for (const b of this.inv.bag) {
      if (ITEMS[b.defId]?.isHidden) this.unlockedHiddenItems.add(b.defId);
    }
    this.saveSys.saveHiddenUnlocks(this.unlockedHiddenItems);
    this.spawner.reset(data.openedChests, data.unlockedWaypoints);
    this.stats = { reactionsTriggered: 0, ...data.stats };
    this.tutorialCompleted = Boolean(data.tutorialCompleted);
    this.tutorialActive = false;
    this.tutorialStep = 0;
    this.tutorialComboHits = 0;
    this.tutorialReturnModal = null;

    this._initBlankPlayer(data.classId);
    this.player.x = data.player.x;
    this.player.y = data.player.y;
    this.player.level = data.player.level;
    this.player.xp = data.player.xp;
    this.player.xpNext = data.player.xpNext;
    this.player.overdrive = data.player.overdrive;
    this.player.statPoints = data.player.statPoints ?? 0;
    this.player.allocatedStats = {
      str: data.player.allocatedStats?.str ?? 0,
      vit: data.player.allocatedStats?.vit ?? 0,
      agi: data.player.allocatedStats?.agi ?? 0,
      crt: data.player.allocatedStats?.crt ?? 0,
    };
    this.player.respawnWaypointId = data.player.respawnWaypointId || "wp_town";
    this.recalcPlayerStats(false);
    this.player.hp = Math.min(this.player.maxHp, Math.max(10, data.player.hp));

    this.currentBiome = this.world.getBiomeAtWorld(this.player.x, this.player.y);
    this._snapCamera();
    this.tileRenderer.syncOverviewMap(this.world, this.colorSys);

    this.running = true;
    this.setModal(null);
    this.vfx.spawnPooled("waypoint-pillar", { x: this.player.x, y: this.player.y });
    if (unequipped.length > 0) {
      this.ui.onToast(
        `Đã tự động tháo ${unequipped.join(", ")} (không đúng Class) về túi đồ!`,
        "warn"
      );
    } else {
      this.ui.onToast("Đã tải tiến trình Biên Niên Sử thành công! (Bấm [H] để xem Cẩm Nang)", "good");
    }
    this.ui.onHudUpdate();
    return true;
  }

  switchClassInTown(classId: ClassId) {
    if (this.player.classId === classId) {
      this.setModal(null);
      return;
    }
    this.player.classId = classId;
    const unequipped = this.inv.unequipIncompatibleForClass(classId);
    this.turrets.length = 0;
    this.player.stormTime = 0;
    this.player.cloneTime = 0;
    this.player.droneTime = 0;
    this.recalcPlayerStats(true);
    this.setModal(null);
    sfx.playWaypoint();
    this.vfx.spawnPooled("waypoint-pillar", { x: this.player.x, y: this.player.y });
    this.ui.onToast(`Đã chuyển đổi Class thành ${getClassDef(classId).vnName}!`, "epic");
    if (unequipped.length > 0) {
      this.ui.onToast(`Đã cất ${unequipped.length} trang bị khác Class về túi đồ: ${unequipped.join(", ")}`, "warn");
    }
    this.saveGame(false);
    this.ui.onHudUpdate();
  }

  saveGame(showToast = true): boolean {
    if (!this.running) return false;
    const data: SaveDataV2 = {
      version: 3,
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
        statPoints: this.player.statPoints,
        allocatedStats: { ...this.player.allocatedStats },
        respawnWaypointId: this.player.respawnWaypointId,
      },
      equipment: this.inv.equipment,
      bag: this.inv.bag,
      bagCapacity: this.inv.bagCapacity,
      backpackTier: this.inv.backpackTier,
      stash: this.inv.stash,
      autoSell: { ...this.inv.autoSell },
      unlockedWaypoints: Array.from(this.colorSys.unlockedWaypoints),
      openedChests: this.spawner.getOpenedChestIds(),
      discoveredLore: Array.from(this.discoveredLore),
      unlockedHiddenItems: Array.from(this.unlockedHiddenItems),
      unlockedHiddenRecipes: Array.from(this.unlockedHiddenRecipes),
      defeatedBossIds: Array.from(this.defeatedBossIds),
      tutorialCompleted: this.tutorialCompleted,
      quests: this.quests.exportState(),
      gachaState: this.gacha.exportState(),
      stats: { ...this.stats },
    };
    const ok = this.saveSys.save(data);
    if (ok && showToast) {
      sfx.playUiClick();
      this.ui.onToast("Đã lưu tiến trình vào trình duyệt!", "good");
    }
    return ok;
  }

  openTutorialFromTitle() {
    this.tutorialReturnModal = "class_select";
    this.setModal("tutorial");
  }

  closeTutorialModal() {
    if (!this.running || this.tutorialReturnModal === "class_select") {
      this.tutorialReturnModal = null;
      this.setModal("class_select", { switching: false });
      return;
    }
    const ret = this.tutorialReturnModal;
    this.tutorialReturnModal = null;
    this.setModal(ret);
  }

  startGuidedTutorial() {
    this.tutorialActive = true;
    this.tutorialStep = 0;
    this.tutorialComboHits = 0;
    this.tutorialMoveDist = 0;
    this.ui.onToast("Đã bật Hướng Dẫn Thực Hành Tân Thủ (6 bước)!", "good");
    this.ui.onHudUpdate();
  }

  skipGuidedTutorial() {
    this.tutorialActive = false;
    this.ui.onToast("Đã ẩn hướng dẫn thực hành. Bạn có thể bấm [H] bất kỳ lúc nào để mở Cẩm Nang!", "info");
    this.ui.onHudUpdate();
  }

  private _advanceTutorial(stepId: string) {
    if (!this.tutorialActive) return;
    const cur = BEGINNER_PRACTICE_STEPS[this.tutorialStep];
    if (!cur || cur.id !== stepId) return;

    this.tutorialStep += 1;
    if (this.tutorialStep >= BEGINNER_PRACTICE_STEPS.length) {
      this.tutorialActive = false;
      const firstReward = !this.tutorialCompleted;
      this.tutorialCompleted = true;
      sfx.playQuestComplete();
      this.vfx.spawnPooled("collect-burst-legendary", { x: this.player.x, y: this.player.y - 6 });
      if (firstReward) {
        this.inv.gold += 50;
        this.inv.addItem("pot_coating", 1, 0);
        this.vfx.spawnDamageText(this.player.x, this.player.y - 16, `HOÀN TẤT TÂN THỦ! +50G`, {
          color: "#ffe066",
          crit: true,
        });
        this.ui.onToast(
          "★ HOÀN TẤT HƯỚNG DẪN TÂN THỦ! Nhận thưởng +50 Vàng & +1 Dầu Phủ Quang Phổ! (Mở Cẩm Nang bằng [H])",
          "epic"
        );
      } else {
        this.ui.onToast("★ Đã hoàn thành lại chuỗi thực hành 6 bước!", "good");
      }
      this.saveGame(false);
    } else {
      sfx.playLootPickup(false);
      const next = BEGINNER_PRACTICE_STEPS[this.tutorialStep];
      this.vfx.spawnDamageText(this.player.x, this.player.y - 14, `✓ BƯỚC ${this.tutorialStep}/6`, {
        color: "#44ee88",
      });
      if (next) {
        this.ui.onToast(`Tiếp theo (${this.tutorialStep + 1}/6): ${next.title} [${next.keyBadge}]`, "info");
      }
    }
    this.ui.onHudUpdate();
  }

  setModal(modal: ModalId, payload?: unknown) {
    if (modal === "inventory") {
      this._advanceTutorial("world_ui");
    }
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

  toggleModal(modal: Exclude<ModalId, null>, payload?: unknown) {
    if (modal === "tutorial") {
      if (this.activeModal === "tutorial") {
        sfx.playUiClick();
        this.closeTutorialModal();
      } else {
        sfx.playUiClick();
        this.tutorialReturnModal =
          this.activeModal === "pause" || this.activeModal === "class_select"
            ? this.activeModal
            : null;
        this.setModal("tutorial", payload);
      }
      return;
    }
    if (modal === "coop") {
      if (this.activeModal === "coop") {
        sfx.playUiClick();
        this.closeCoopModal();
      } else {
        sfx.playUiClick();
        this.coopReturnModal =
          this.activeModal === "pause" || this.activeModal === "class_select"
            ? this.activeModal
            : null;
        this.setModal("coop", payload);
      }
      return;
    }
    if (!this.running) return;
    if (this.activeModal === modal) {
      this.setModal(null);
    } else {
      sfx.playUiClick();
      this.setModal(modal, payload);
    }
  }

  openCoopFromTitle(prefillCode?: string) {
    this.coopReturnModal = "class_select";
    this.setModal("coop", { code: prefillCode });
  }

  closeCoopModal() {
    if (!this.running || this.coopReturnModal === "class_select") {
      this.coopReturnModal = null;
      this.setModal("class_select", { switching: false });
      return;
    }
    const ret = this.coopReturnModal;
    this.coopReturnModal = null;
    this.setModal(ret);
  }

  // =========================================================================
  // PHASE 1: MOBILE SMART AUTO-AIM, TOUCH ACTIONS & FULLSCREEN LANDSCAPE
  // =========================================================================

  /** Finds best target angle within `maxRange` (Arena Totem -> Boss/Enemy -> Ore Node). */
  computeAutoAimAngle(maxRange = 172): number | null {
    const p = this.player;
    this.autoAimTargetUid = null;

    // 1. Unlit Arena Chroma Totems within strike range
    let bestTotemD = 115;
    let bestTotemAng: number | null = null;
    for (const t of this.spawner.arenaTotems) {
      if (t.lit) continue;
      const d = Math.hypot(t.x - p.x, t.y - p.y);
      if (d < bestTotemD) {
        bestTotemD = d;
        bestTotemAng = Math.atan2(t.y - p.y, t.x - p.x);
      }
    }
    if (bestTotemAng !== null) return bestTotemAng;

    // 2. Nearest living Enemy / Boss within maxRange
    let bestEnemy: EnemyEntity | null = null;
    let bestEnemyScore = maxRange;
    for (const e of this.spawner.enemies) {
      if (e.hp <= 0) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d > maxRange) continue;
      const score = d - (e.isBoss ? 18 : 0);
      if (score < bestEnemyScore) {
        bestEnemyScore = score;
        bestEnemy = e;
      }
    }
    if (bestEnemy) {
      this.autoAimTargetUid = bestEnemy.uid;
      return Math.atan2(bestEnemy.y - p.y, bestEnemy.x - p.x);
    }

    // 3. Nearby Ore / Crystal node for effortless mobile mining
    let bestResD = 56;
    let bestResAng: number | null = null;
    for (const res of this.spawner.resources) {
      if (!res.alive) continue;
      const d = Math.hypot(res.x - p.x, res.y - p.y);
      if (d < bestResD) {
        bestResD = d;
        bestResAng = Math.atan2(res.y - p.y, res.x - p.x);
      }
    }
    return bestResAng;
  }

  private _applySmartAim(manualAngle?: number) {
    const p = this.player;
    const chosen =
      manualAngle ??
      this.computeAutoAimAngle() ??
      (Math.hypot(this.touchMoveX, this.touchMoveY) > 0.15
        ? Math.atan2(this.touchMoveY, this.touchMoveX)
        : p.aimAngle);
    p.aimAngle = chosen;
    const cx = Math.cos(chosen);
    const sy = Math.sin(chosen);
    p.facing = cx < 0 ? -1 : 1;
    if (Math.abs(cx) >= Math.abs(sy)) {
      p.facingDir = cx < 0 ? "left" : "right";
    } else {
      p.facingDir = sy < 0 ? "up" : "down";
    }
  }

  mobileStartAttack(manualAngle?: number) {
    if (!this.running || this.activeModal !== null) return;
    this._applySmartAim(manualAngle);
    this.mouseDown = true;
    this.player.chargeTime = 0;
    this.player.charging = true;
    const prevAtkCd = this.player.atkCd;
    this.combat.performPrimaryAttack(this._makeCombatContext());
    if (this.player.atkCd > prevAtkCd) {
      this._broadcastHeroFx("slash");
      if (this.tutorialActive && BEGINNER_PRACTICE_STEPS[this.tutorialStep]?.id === "combo3") {
        this.tutorialComboHits += 1;
        if (this.tutorialComboHits >= 3 || this.player.quickChargeTimer > 0) {
          this._advanceTutorial("combo3");
        } else {
          this.ui.onHudUpdate();
        }
      }
    }
  }

  mobileUpdateAttackAim(angle: number) {
    this.player.aimAngle = angle;
    this.player.facing = Math.cos(angle) < 0 ? -1 : 1;
  }

  mobileEndAttack() {
    this.mouseDown = false;
  }

  mobileDash() {
    if (!this.running || this.activeModal !== null) return;
    const dx = Math.abs(this.touchMoveX) > 0.1 ? this.touchMoveX : Math.cos(this.player.aimAngle);
    const dy = Math.abs(this.touchMoveY) > 0.1 ? this.touchMoveY : Math.sin(this.player.aimAngle);
    const prevDash = this.player.dashing;
    this.combat.performDash(this._makeCombatContext(), dx, dy);
    if (this.player.dashing > prevDash) {
      this._advanceTutorial("dash");
    }
  }

  mobileSkillE(manualAngle?: number) {
    if (!this.running || this.activeModal !== null) return;
    this._applySmartAim(manualAngle);
    const prevCd = this.player.skillCd;
    this.combat.performSkillE(this._makeCombatContext());
    if (this.player.skillCd > prevCd) {
      this._broadcastHeroFx("skill");
      this._advanceTutorial("skill_e");
    }
  }

  mobileUltQ(manualAngle?: number) {
    if (!this.running || this.activeModal !== null) return;
    this._applySmartAim(manualAngle);
    const prevOd = this.player.overdrive;
    this.combat.performUltimateQ(this._makeCombatContext());
    if (this.player.overdrive < prevOd) {
      this._broadcastHeroFx("ult");
    }
  }

  async toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
        const scr = screen as unknown as { orientation?: { lock?: (o: string) => Promise<void> } };
        await scr.orientation?.lock?.("landscape").catch(() => {});
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      this.ui.onToast("Trên iPhone/iPad: bấm Chia sẻ ➔ Thêm vào MH chính để chơi Toàn màn hình!", "info");
    }
  }

  // =========================================================================
  // PHASE 2: 2-4 PLAYER CO-OP MULTIPLAYER SESSION & STATE SYNCHRONIZATION
  // =========================================================================

  async hostCoopSession(opts?: { mode?: "webrtc" | "ws"; roomCode?: string; wsUrl?: string }): Promise<string> {
    this.remotePlayers.clear();
    const code = await this.coop.hostRoom(opts);
    this.ui.onToast(`🌟 Đã mở phòng Co-op [${code}]! Gửi mã cho bạn bè vào chung nhé!`, "epic");
    this.ui.onHudUpdate();
    return code;
  }

  async joinCoopSession(code: string, opts?: { mode?: "webrtc" | "ws"; wsUrl?: string }): Promise<string> {
    this.remotePlayers.clear();
    const joined = await this.coop.joinRoom(code, opts);
    this.coop.send({
      type: "hello",
      player: this._buildLocalPlayerSnapshot(),
    });
    this.ui.onToast(`🚀 Đã kết nối vào phòng Co-op [${joined}]!`, "epic");
    this.ui.onHudUpdate();
    return joined;
  }

  leaveCoopSession() {
    this.coop.disconnect();
    this.remotePlayers.clear();
    this.ui.onToast("Đã rời phòng Co-op và quay về chế độ Đơn.", "info");
    this.ui.onHudUpdate();
  }

  teleportToCoopPeer(peerId: string) {
    if (this.activeBossLock) {
      this.ui.onToast("🔒 Không thể dịch chuyển khi đang trong Lãnh Địa Phong Ấn Boss!", "warn");
      return;
    }
    const target = this.remotePlayers.get(peerId);
    if (!target) return;
    this.player.x = target.snap.x + 14;
    this.player.y = target.snap.y + 6;
    this._snapCamera();
    sfx.playWaypoint();
    this.vfx.spawnPooled("waypoint-pillar", { x: this.player.x, y: this.player.y });
    this.ui.onToast(`⚡ Đã dịch chuyển tới cạnh ${target.snap.name}!`, "good");
  }

  sendCoopPing(text = "Tập hợp tại đây!") {
    if (!this.coop.isConnected) return;
    sfx.playWaypoint();
    this.vfx.spawnPooled("waypoint-pillar", { x: this.player.x, y: this.player.y });
    this.coop.send({
      type: "ping_beacon",
      playerId: this.coop.localId,
      name: this.coop.playerName,
      x: Math.round(this.player.x),
      y: Math.round(this.player.y),
      text,
    });
    this.ui.onToast(`📍 Đã phát tín hiệu tập hợp cho tổ đội!`, "info");
  }

  private _broadcastHeroFx(kind: "slash" | "charge" | "skill" | "ult") {
    if (!this.coop.isConnected) return;
    const preset =
      kind === "ult"
        ? "collect-burst-legendary"
        : kind === "charge"
          ? "crit-gold"
          : kind === "skill"
            ? "zap-hit"
            : "hit-cyan";
    this.coop.send({
      type: "hero_fx",
      playerId: this.coop.localId,
      preset,
      x: Math.round(this.player.x + Math.cos(this.player.aimAngle) * 14),
      y: Math.round(this.player.y - 6 + Math.sin(this.player.aimAngle) * 14),
      angle: this.player.aimAngle,
    });
  }

  private _buildLocalPlayerSnapshot(): PlayerNetSnapshot {
    const p = this.player;
    const isMoving =
      Math.hypot(this.touchMoveX, this.touchMoveY) > 0.1 ||
      this.keys.has("KeyW") ||
      this.keys.has("KeyS") ||
      this.keys.has("KeyA") ||
      this.keys.has("KeyD") ||
      this.keys.has("ArrowUp") ||
      this.keys.has("ArrowDown") ||
      this.keys.has("ArrowLeft") ||
      this.keys.has("ArrowRight");
    const animState: HeroAnimState =
      p.stormTime > 0 || p.attackAnimTime > 0
        ? "attack"
        : p.dashing > 0
          ? "dash"
          : p.charging && p.chargeTime > 0.12
            ? "charge"
            : isMoving
              ? "run"
              : "idle";
    const reqCharge = p.quickChargeTimer > 0 ? 0.26 : 0.38;
    const equip = {} as Record<EquipSlot, CompactEquipSlot | null>;
    for (const slot of EQUIP_SLOTS) {
      const it =
        slot === "weapon"
          ? this.inv.getValidEquippedWeapon(p.classId)
          : this.inv.equipment[slot];
      equip[slot] = it
        ? { defId: it.defId, enh: it.enhanceLevel, inf: it.infusedElement }
        : null;
    }

    return {
      id: this.coop.localId,
      name: this.coop.playerName,
      isHost: this.coop.isHost,
      classId: p.classId,
      level: p.level,
      hp: Math.round(p.hp),
      maxHp: p.maxHp,
      x: Math.round(p.x * 10) / 10,
      y: Math.round(p.y * 10) / 10,
      facing: p.facing < 0 ? -1 : 1,
      facingDir: p.facingDir,
      aimAngle: Math.round(p.aimAngle * 100) / 100,
      animState,
      attackKind: p.stormTime > 0 ? "storm" : p.attackAnimKind,
      attackProgress:
        p.stormTime > 0
          ? (this.time * 2.2) % 1
          : Math.min(1, Math.max(0, 1 - p.attackAnimTime / Math.max(0.05, p.attackAnimDuration))),
      shieldGuard: p.shieldTime > 0,
      aegisActive: p.aegisTime > 0 || p.shieldTime > 0,
      buffActive: p.atkBuffTime > 0,
      chargePct: p.charging ? Math.min(1, p.chargeTime / reqCharge) : 0,
      walkTime: Math.round(p.walkTime * 100) / 100,
      equip,
    };
  }

  private _buildEnemySnapshots(): EnemyNetSnapshot[] {
    const out: EnemyNetSnapshot[] = [];
    for (const e of this.spawner.enemies) {
      if (e.hp <= 0) continue;
      // Always sync Bosses, aggro/leashing mobs, or mobs within 420px of any party member!
      let relevant = e.isBoss || e.state !== "patrol" || e.hp < e.maxHp || e.element !== null;
      if (!relevant) {
        if (Math.hypot(e.x - this.player.x, e.y - this.player.y) <= 420) {
          relevant = true;
        } else {
          for (const rp of this.remotePlayers.values()) {
            if (Math.hypot(e.x - rp.snap.x, e.y - rp.snap.y) <= 420) {
              relevant = true;
              break;
            }
          }
        }
      }
      if (!relevant) continue;

      out.push({
        uid: e.uid,
        defId: e.defId,
        campId: e.campId,
        biome: e.biome,
        x: Math.round(e.x * 10) / 10,
        y: Math.round(e.y * 10) / 10,
        hp: Math.ceil(e.hp),
        maxHp: e.maxHp,
        bleachShield: Math.ceil(e.bleachShield),
        maxBleachShield: e.maxBleachShield,
        facing: e.facing < 0 ? -1 : 1,
        facingDir: e.facingDir,
        state: e.state,
        phase: e.phase,
        element: e.element,
        stunTime: Math.round(e.stunTime * 10) / 10,
        vulnTime: Math.round(e.vulnTime * 10) / 10,
        rootTime: Math.round(e.rootTime * 10) / 10,
        disruptTime: Math.round(e.disruptTime * 10) / 10,
        enrageBuffTime: Math.round(e.enrageBuffTime * 10) / 10,
        totemChannelTimer: Math.round(e.totemChannelTimer * 10) / 10,
        animKind: e.animKind,
        animTime: Math.round(e.animTime * 100) / 100,
        animDuration: e.animDuration,
        animAngle: Math.round(e.animAngle * 100) / 100,
        dashTime: Math.round(e.dashTime * 100) / 100,
        dashVx: Math.round(e.dashVx),
        dashVy: Math.round(e.dashVy),
        guardTime: Math.round(e.guardTime * 10) / 10,
        walkTime: Math.round(e.walkTime * 10) / 10,
      });
    }
    return out;
  }

  private _sendWelcomeSnapshot(targetId?: string) {
    if (!this.coop.isHost) return;
    const allPlayers: PlayerNetSnapshot[] = [
      this._buildLocalPlayerSnapshot(),
      ...Array.from(this.remotePlayers.values()).map((r) => r.snap),
    ];
    this.coop.send(
      {
        type: "welcome",
        hostId: this.coop.localId,
        roomCode: this.coop.roomCode,
        waypoints: Array.from(this.colorSys.unlockedWaypoints),
        openedChests: this.spawner.getOpenedChestIds(),
        players: allPlayers,
        enemies: this._buildEnemySnapshots(),
        totems: this.spawner.arenaTotems.map((t) => ({
          uid: t.uid,
          element: t.element,
          x: t.x,
          y: t.y,
          lit: t.lit,
        })),
        bossLock: this.activeBossLock,
      },
      targetId
    );
  }

  private _upsertRemotePlayer(snap: PlayerNetSnapshot) {
    if (snap.id === this.coop.localId) return;
    const sig = EQUIP_SLOTS.map((s) => {
      const it = snap.equip[s];
      return it ? `${it.defId}:${it.enh}:${it.inf ?? ""}` : "-";
    }).join("|");

    const existing = this.remotePlayers.get(snap.id);
    if (existing) {
      const jumped = Math.hypot(snap.x - existing.renderX, snap.y - existing.renderY) > 96;
      existing.snap = snap;
      if (jumped) {
        existing.renderX = snap.x;
        existing.renderY = snap.y;
      }
      existing.lastSeen = this.time;
      if (existing.equipSig !== sig) {
        existing.equipSig = sig;
        existing.cachedEquip = this._reconstructEquipMap(snap.equip);
      }
    } else {
      this.remotePlayers.set(snap.id, {
        snap,
        renderX: snap.x,
        renderY: snap.y,
        cachedEquip: this._reconstructEquipMap(snap.equip),
        equipSig: sig,
        lastSeen: this.time,
      });
    }
  }

  private _reconstructEquipMap(compact: Record<EquipSlot, CompactEquipSlot | null>): EquipmentMap {
    const map: EquipmentMap = {};
    for (const s of EQUIP_SLOTS) {
      const c = compact[s];
      if (c && ITEMS[c.defId]) {
        const inst = createItemInstance(c.defId, 1, c.enh);
        if (c.inf) inst.infusedElement = c.inf;
        map[s] = inst;
      }
    }
    return map;
  }

  private _applyWorldStateFromHost(
    enemies: EnemyNetSnapshot[],
    totems: { uid: number; element: EnemyNetSnapshot["element"] & string; x: number; y: number; lit: boolean }[],
    bossLock: ActiveBossLock | null
  ) {
    this.activeBossLock = bossLock;
    const byUid = new Map<number, EnemyEntity>();
    for (const e of this.spawner.enemies) byUid.set(e.uid, e);

    for (const es of enemies) {
      const cur = byUid.get(es.uid);
      if (cur) {
        cur.x += (es.x - cur.x) * 0.55;
        cur.y += (es.y - cur.y) * 0.55;
        if (Math.hypot(es.x - cur.x, es.y - cur.y) > 48) {
          cur.x = es.x;
          cur.y = es.y;
        }
        cur.hp = es.hp;
        cur.maxHp = es.maxHp;
        cur.bleachShield = es.bleachShield;
        cur.maxBleachShield = es.maxBleachShield;
        cur.facing = es.facing;
        cur.facingDir = es.facingDir;
        cur.state = es.state;
        cur.phase = es.phase;
        cur.element = es.element;
        cur.stunTime = es.stunTime;
        cur.vulnTime = es.vulnTime;
        cur.rootTime = es.rootTime;
        cur.disruptTime = es.disruptTime;
        cur.enrageBuffTime = es.enrageBuffTime;
        cur.totemChannelTimer = es.totemChannelTimer;
        cur.animKind = es.animKind;
        cur.animTime = es.animTime;
        cur.animDuration = es.animDuration;
        cur.animAngle = es.animAngle;
        cur.dashTime = es.dashTime;
        cur.dashVx = es.dashVx;
        cur.dashVy = es.dashVy;
        cur.guardTime = es.guardTime;
        cur.walkTime = es.walkTime;
      } else {
        const edef = ENEMIES[es.defId];
        if (!edef) continue;
        this.spawner.enemies.push({
          uid: es.uid,
          defId: es.defId,
          campId: es.campId,
          biome: es.biome,
          x: es.x,
          y: es.y,
          homeX: es.x,
          homeY: es.y,
          vx: 0,
          vy: 0,
          facing: es.facing,
          facingDir: es.facingDir,
          radius: edef.radius,
          hp: es.hp,
          maxHp: es.maxHp,
          atk: edef.atk,
          def: edef.def,
          spd: edef.spd,
          level: edef.level,
          isBoss: !!edef.isBoss,
          isWorldBoss: !!edef.isWorldBoss,
          state: es.state,
          patrolTargetX: es.x,
          patrolTargetY: es.y,
          patrolWait: 1,
          aiTimer: 2,
          specialTimer: 4,
          skillCycle: 0,
          phase: es.phase,
          hitFlash: 0,
          walkTime: es.walkTime,
          animKind: es.animKind,
          animTime: es.animTime,
          animDuration: es.animDuration,
          animAngle: es.animAngle,
          animImpactDone: false,
          dashTime: es.dashTime,
          dashVx: es.dashVx,
          dashVy: es.dashVy,
          guardTime: es.guardTime,
          element: es.element,
          elementTime: es.element ? 3.5 : 0,
          reactionIcd: 0,
          burnTime: 0,
          burnTick: 0,
          slowTime: 0,
          poisonTime: 0,
          poisonTick: 0,
          rootTime: es.rootTime,
          stunTime: es.stunTime,
          vulnTime: es.vulnTime,
          critVulnTime: 0,
          normalAmpTime: 0,
          disruptTime: es.disruptTime,
          blightDecayTime: 0,
          chromaSlowBonusTime: 0,
          enrageBuffTime: es.enrageBuffTime,
          bleachShield: es.bleachShield,
          maxBleachShield: es.maxBleachShield,
          totemChannelTimer: es.totemChannelTimer,
        });
      }
    }

    this.spawner.arenaTotems.length = 0;
    for (const t of totems) {
      this.spawner.arenaTotems.push({
        uid: t.uid,
        element: t.element as never,
        x: t.x,
        y: t.y,
        lit: t.lit,
        hitFlash: 0,
      });
    }
  }

  private _handleNetPacket(fromId: string, pkt: NetGamePacket) {
    if (pkt.type === "hello") {
      this._upsertRemotePlayer(pkt.player);
      if (this.coop.isHost) {
        this._sendWelcomeSnapshot(fromId);
        this.coop.send({
          type: "party_roster",
          players: [
            this._buildLocalPlayerSnapshot(),
            ...Array.from(this.remotePlayers.values()).map((r) => r.snap),
          ],
        });
        this.ui.onToast(`🤝 ${pkt.player.name} đã gia nhập Tổ Đội Co-op!`, "epic");
      }
      this.ui.onHudUpdate();
      return;
    }

    if (pkt.type === "welcome") {
      this.colorSys.loadUnlocked(pkt.waypoints);
      this.tileRenderer.syncOverviewMap(this.world, this.colorSys);
      // Replace local enemy table cleanly on initial Guest join so UIDs match Host 1:1!
      this.spawner.enemies.length = 0;
      for (const pl of pkt.players) {
        this._upsertRemotePlayer(pl);
      }
      this._applyWorldStateFromHost(pkt.enemies, pkt.totems as never, pkt.bossLock);
      const hostSnap = pkt.players.find((pl) => pl.isHost);
      if (hostSnap && this.world.isInSafeTown(this.player.x, this.player.y)) {
        this.player.x = hostSnap.x + 16;
        this.player.y = hostSnap.y + 4;
        this._snapCamera();
      }
      this.ui.onHudUpdate();
      return;
    }

    if (pkt.type === "player_state") {
      this._upsertRemotePlayer(pkt.player);
      return;
    }

    if (pkt.type === "party_roster") {
      for (const pl of pkt.players) {
        this._upsertRemotePlayer(pl);
      }
      this.ui.onHudUpdate();
      return;
    }

    if (pkt.type === "world_state") {
      if (!this.coop.isHost) {
        this._applyWorldStateFromHost(pkt.enemies, pkt.totems as never, pkt.bossLock);
      }
      return;
    }

    if (pkt.type === "hit_enemy") {
      if (!this.coop.isHost) return;
      const target = this.spawner.enemies.find((e) => e.uid === pkt.enemyUid);
      if (!target || target.hp <= 0) return;
      const savedLv = this.player.level;
      this.player.level = Math.max(savedLv, pkt.attackerLevel);
      this.combat.damageEnemy(
        this._makeCombatContext(),
        target,
        pkt.rawDamage,
        pkt.crit,
        pkt.hitPreset,
        pkt.element,
        pkt.kbX,
        pkt.kbY,
        pkt.poiseMult
      );
      this.player.level = savedLv;
      return;
    }

    if (pkt.type === "light_totem") {
      if (!this.coop.isHost) return;
      this.combat.lightArenaTotemByIndex(this._makeCombatContext(), pkt.totemIdx, pkt.element);
      return;
    }

    if (pkt.type === "enemy_killed") {
      if (this.coop.isHost) return;
      const idx = this.spawner.enemies.findIndex((e) => e.uid === pkt.enemyUid);
      if (idx >= 0) this.spawner.enemies.splice(idx, 1);
      if (pkt.defId === "boss_the_eraser") this.spawner.arenaTotems.length = 0;

      // Grant Instanced Kill Loot + 100% XP + Quest credit to Co-op Guest!
      const edef = ENEMIES[pkt.defId];
      this.stats.kills += 1;
      this.vfx.spawnPooled(pkt.isBoss ? "explode-plasma" : "death-poof", { x: pkt.x, y: pkt.y - 6 });
      const waveR = pkt.isWorldBoss ? 480 : pkt.isBoss ? 260 : 62;
      this.colorSys.triggerWave(pkt.x, pkt.y, waveR, pkt.isBoss ? 280 : 180);

      if (edef) {
        this.gainXp(edef.xp);
        const [gMin, gMax] = edef.gold;
        const gold = gMin + Math.floor(Math.random() * (gMax - gMin + 1));
        this.spawner.spawnGoldLoot(pkt.x, pkt.y, gold);
        const drops = rollEnemyDropTable(pkt.defId);
        for (const d of drops) {
          this.spawner.spawnItemLoot(pkt.x, pkt.y, d.itemId, d.qty, d.enhanceLevel);
        }
      }
      this.quests.recordEvent("kill_enemy", pkt.defId, 1);
      this.quests.recordEvent("kill_any", undefined, 1);
      this.spawner.onEnemyRemoved(pkt.campId, this.vfx);

      if (pkt.isBoss) {
        this.stats.bossesDefeated += 1;
        if (this.activeBossLock?.bossUid === pkt.enemyUid) {
          this.activeBossLock = null;
        }
        const bName = edef?.name ?? "BOSS";
        this.ui.onBossVictory(pkt.isWorldBoss, bName);
      }
      this.ui.onHudUpdate();
      return;
    }

    if (pkt.type === "reaction_vfx") {
      if (!this.coop.isHost) {
        this.stats.reactionsTriggered = (this.stats.reactionsTriggered ?? 0) + 1;
        this.quests.recordEvent("trigger_reaction", undefined, 1);
        this.vfx.spawnPooled("explode-plasma", { x: pkt.x, y: pkt.y - 6 });
        this.vfx.spawnDamageText(pkt.x, pkt.y - 18, pkt.tag, { crit: true, color: pkt.color });
      }
      return;
    }

    if (pkt.type === "waypoint_unlocked") {
      if (!this.colorSys.unlockedWaypoints.has(pkt.wpId)) {
        this.colorSys.unlockedWaypoints.add(pkt.wpId);
        this.colorSys.triggerWave(pkt.wx, pkt.wy, pkt.radiusPx, 340);
        this.vfx.spawnPooled("waypoint-pillar", { x: pkt.wx, y: pkt.wy });
        this.quests.recordEvent("activate_waypoint", pkt.wpId, 1);
        const wp = WAYPOINTS.find((w) => w.id === pkt.wpId);
        if (wp) {
          this.ui.onToast(`🌈 Đồng đội đã thắp sáng ${wp.name}! Đã mở Dịch Chuyển Nhanh [M]!`, "epic");
        }
        this.tileRenderer.syncOverviewMap(this.world, this.colorSys);
        this.ui.onHudUpdate();
      }
      return;
    }

    if (pkt.type === "hero_fx") {
      if (pkt.playerId !== this.coop.localId) {
        this.vfx.spawnPooled(pkt.preset, { x: pkt.x, y: pkt.y, angle: pkt.angle });
      }
      return;
    }

    if (pkt.type === "ping_beacon") {
      sfx.playWaypoint();
      this.vfx.spawnPooled("waypoint-pillar", { x: pkt.x, y: pkt.y });
      this.ui.onToast(`📍 [${pkt.name}]: ${pkt.text}`, "epic");
      return;
    }

    if (pkt.type === "peer_left") {
      this.remotePlayers.delete(pkt.playerId);
      this.ui.onHudUpdate();
    }
  }

  /** Advances Co-op network state sync (20Hz player, 16Hz Host world) & 60FPS remote interpolation. */
  tickNetwork(dt: number) {
    if (!this.coop.isConnected || !this.running) return;

    for (const rp of this.remotePlayers.values()) {
      const alpha = Math.min(1, dt * 14);
      rp.renderX += (rp.snap.x - rp.renderX) * alpha;
      rp.renderY += (rp.snap.y - rp.renderY) * alpha;
    }

    this.netPlayerTimer += dt;
    if (this.netPlayerTimer >= 0.05) {
      this.netPlayerTimer = 0;
      this.coop.send({
        type: "player_state",
        player: this._buildLocalPlayerSnapshot(),
      });
    }

    if (this.coop.isHost) {
      this.netWorldTimer += dt;
      if (this.netWorldTimer >= 0.062) {
        this.netWorldTimer = 0;
        this.coop.send({
          type: "world_state",
          enemies: this._buildEnemySnapshots(),
          totems: this.spawner.arenaTotems.map((t) => ({
            uid: t.uid,
            element: t.element,
            x: t.x,
            y: t.y,
            lit: t.lit,
          })),
          bossLock: this.activeBossLock,
        });
      }
    }
  }

  /** Fast Travel from World Map [M] to any unlocked Chroma Waypoint. */
  fastTravelTo(wpId: string) {
    if (this.activeBossLock) {
      sfx.playForgeFail();
      this.ui.onToast(`🔒 Không thể Dịch Chuyển khi đang bị phong ấn trong lãnh địa ${this.activeBossLock.bossName}!`, "warn");
      return;
    }
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

  /** Uses quick consumable hotkey 1, 2, 3, or 4 (automatically picks highest-tier item in that group). */
  useConsumableSlot(slot1Based: 1 | 2 | 3 | 4) {
    if (!this.running || this.activeModal !== null) return;
    const group = this.inv.getHotkeyGroupForSlot(slot1Based);
    const bestId = this.inv.findBestConsumableForGroup(group);
    if (!bestId) {
      const grpInfo = CONSUMABLE_GROUP_LABELS[group];
      this.ui.onToast(`Đã hết vật phẩm nhóm ${grpInfo.label}! Mua thêm tại Thương Nhân Mira.`, "warn");
      return;
    }
    this.useConsumableById(bestId);
  }

  useConsumableById(defId: string): boolean {
    const def = ITEMS[defId];
    if (!def || def.category !== "consumable") return false;
    if (def.consumableKind === "fate_die") {
      this.ui.onToast(
        "🎲 Hãy mang Xúc Xắc Đổi Mệnh tới Lò Rèn (Thợ Rèn Kael) để reroll chỉ số phụ trang bị!",
        "info"
      );
      return false;
    }
    if (def.consumableKind === "mirage_vial") {
      if (!this.inv.consumeItem(defId, 1)) {
        this.ui.onToast(`Đã hết ${def.name}!`, "warn");
        return false;
      }
      this.itemEffects.onUseConsumable(this._makeCombatContext(), def);
      this.ui.onToast(`🌫 Đã uống ${def.name}: Tàng hình 2.5s (mất aggro) & +40% tốc chạy!`, "good");
      this.ui.onHudUpdate();
      return true;
    }
    if (def.consumableKind === "undying_charm") {
      this.ui.onToast(
        "Bùa Hộ Mệnh Bất Diệt tự động kích hoạt khi HP về 0! (Hãy giữ sẵn trong Túi đồ)",
        "info"
      );
      return false;
    }
    const isHpPot = def.consumableKind === "hp_potion" || def.consumableSpec?.group === "hp";
    if (isHpPot && (this.player.potCd ?? 0) > 0) {
      sfx.playUiClick();
      this.ui.onToast(`Bình máu đang hồi (${(this.player.potCd ?? 0).toFixed(1)}s)!`, "warn");
      return false;
    }
    if (!this.inv.consumeItem(defId, 1)) {
      this.ui.onToast(`Đã hết ${def.name}! Mua thêm tại Thương Nhân Mira.`, "warn");
      return false;
    }
    if (isHpPot) {
      this.player.potCd = 2.5;
    }

    if (def.consumableKind === "chroma_coating") {
      this.player.coatingTime = def.consumableSpec?.durationSec ?? 25.0;
      this.player.bleachDebuffTime = 0;
      this.vfx.spawnLive("pixtel/overdrive-aura", { x: this.player.x, y: this.player.y, follow: this.player, maxLife: 1.2 });
      this.vfx.spawnDamageText(this.player.x, this.player.y - 12, `CHROMA COATING!`, { color: "#ff66d8", crit: true });
      sfx.playOverdrive();
      this.ui.onToast(`Đã phủ ${def.name} (+20% ELEM & xoay vòng nguyên tố)!`, "good");
      this.ui.onHudUpdate();
      return true;
    }

    const spec = def.consumableSpec;
    if (spec) {
      if (spec.hpPct && spec.hpPct > 0) {
        const heal = Math.round(this.player.maxHp * spec.hpPct);
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
        this.vfx.spawnPooled(spec.hpPct >= 0.9 ? "heal-aoe" : "heal-burst", { x: this.player.x, y: this.player.y - 6 });
        this.vfx.spawnDamageText(this.player.x, this.player.y - 12, `+${heal} HP`, {
          color: "#44ee88",
          crit: spec.hpPct >= 0.65,
        });
      }
      if (spec.staminaPct && spec.staminaPct > 0) {
        this.player.stamina = Math.min(
          this.player.maxStamina,
          this.player.stamina + Math.round(this.player.maxStamina * spec.staminaPct)
        );
        this.player.exhausted = false;
      }
      if (spec.speedPct && spec.durationSec) {
        this.player.speedBuffTime = Math.max(this.player.speedBuffTime, spec.durationSec);
        this.player.speedBuffPct = Math.max(this.player.speedBuffPct, spec.speedPct);
        this.vfx.spawnLive("status/haste", { x: this.player.x, y: this.player.y, follow: this.player, maxLife: 1.2 });
        this.vfx.spawnDamageText(this.player.x, this.player.y - 12, `HASTE +${Math.round(spec.speedPct * 100)}%`, {
          color: "#44ee88",
        });
      }
      if ((spec.atkPct || spec.critBonus) && spec.durationSec) {
        this.player.atkBuffTime = Math.max(this.player.atkBuffTime, spec.durationSec);
        this.player.atkBuffPct = Math.max(this.player.atkBuffPct, spec.atkPct ?? 0);
        this.player.atkBuffCrit = Math.max(this.player.atkBuffCrit, spec.critBonus ?? 0);
        this.vfx.spawnLive("pixtel/overdrive-aura", { x: this.player.x, y: this.player.y, follow: this.player, maxLife: 1.2 });
        this.vfx.spawnDamageText(this.player.x, this.player.y - 14, `ATK +${Math.round((spec.atkPct ?? 0) * 100)}%!`, {
          color: "#ffe066",
          crit: true,
        });
      }
      if ((spec.defPct || spec.shieldSec) && (spec.durationSec || spec.shieldSec)) {
        const dur = spec.shieldSec ?? spec.durationSec ?? 6;
        this.player.defBuffTime = Math.max(this.player.defBuffTime, spec.durationSec ?? dur);
        this.player.defBuffPct = Math.max(this.player.defBuffPct, spec.defPct ?? 0.35);
        this.player.aegisTime = Math.max(this.player.aegisTime, dur);
        this.vfx.spawnLive("impacts/shield-block", { x: this.player.x, y: this.player.y, follow: this.player, maxLife: 1.1 });
        this.vfx.spawnDamageText(this.player.x, this.player.y - 14, `AEGIS SHIELD!`, {
          color: "#5ef2ff",
          crit: true,
        });
      }
      if (spec.invulnSec && spec.invulnSec > 0) {
        this.player.invuln = Math.max(this.player.invuln, spec.invulnSec);
        this.vfx.spawnPooled("waypoint-pillar", { x: this.player.x, y: this.player.y });
      }
      if (spec.overdriveGain && spec.overdriveGain > 0) {
        this.player.overdrive = Math.min(100, this.player.overdrive + spec.overdriveGain);
        this.vfx.spawnDamageText(this.player.x, this.player.y - 20, `+${spec.overdriveGain}% [Q]!`, {
          color: "#ff66d8",
          crit: true,
        });
      }

      if (spec.group === "power" || (spec.overdriveGain ?? 0) > 0) sfx.playOverdrive();
      else if (spec.group === "aegis") sfx.playBlock();
      else sfx.playLootPickup(true);
      this.ui.onToast(`Đã dùng ${def.name}!`, "good");
    } else if (def.consumableKind === "hp_potion") {
      const heal = Math.round(this.player.maxHp * 0.45);
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
      this.vfx.spawnPooled("heal-burst", { x: this.player.x, y: this.player.y - 6 });
      this.vfx.spawnDamageText(this.player.x, this.player.y - 12, `+${heal} HP`, { color: "#44ee88", crit: true });
      sfx.playLootPickup(true);
    }

    this.ui.onHudUpdate();
    return true;
  }

  /** Handles pressing [F] to interact with nearest NPC, Class Altar, Waypoint, Lore Tablet, Chest, or Equipment Loot. */
  interactNearest() {
    if (!this.running || this.activeModal !== null) return;
    const t = this.nearestInteractable;
    if (!t) return;
    this._advanceTutorial("world_ui");

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

    if (t.kind === "gacha_altar") {
      sfx.playBagOpen();
      this.setModal("gacha");
      return;
    }

    if (t.kind === "stash_chest") {
      sfx.playChestOpen();
      this.setModal("stash");
      return;
    }

    if (t.kind === "waypoint") {
      this._activateWaypoint(t.wp);
      return;
    }

    if (t.kind === "lore") {
      this._inspectLoreTablet(t.lore);
      return;
    }

    if (t.kind === "chest") {
      if (t.chest.state === "locked") {
        sfx.playForgeFail();
        this.ui.onToast("Rương bị khóa! Hãy tiêu diệt hết quái vật trong trại trước.", "warn");
        return;
      }
      if (t.chest.state === "unlocked") {
        this.spawner.openChest(t.chest, this.vfx, this.player.classId);
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

  private _inspectLoreTablet(lore: LoreTabletDef) {
    const wx = lore.tx * TILE_SIZE + 8;
    const wy = lore.ty * TILE_SIZE + 8;
    const firstTime = !this.discoveredLore.has(lore.id);

    sfx.playWaypoint();
    if (firstTime) {
      this.discoveredLore.add(lore.id);
      this.colorSys.triggerWave(wx, wy, 92, 210);
      this.vfx.spawnPooled("collect-burst", { x: wx, y: wy - 6 });
      this.inv.gold += lore.rewardGold;
      if (lore.rewardItem) {
        this.inv.addItem(lore.rewardItem.defId, lore.rewardItem.qty, 0);
      }
      this.gainXp(lore.rewardXp);
      const done = this.quests.recordEvent("read_lore", lore.id, 1);
      for (const q of done) {
        sfx.playQuestComplete();
        this.ui.onToast(`Hoàn thành mục tiêu nhiệm vụ: ${q.title}!`, "good");
      }
      const itemText = lore.rewardItem
        ? ` & ${ITEMS[lore.rewardItem.defId]?.name ?? ""} x${lore.rewardItem.qty}`
        : "";
      this.ui.onToast(
        `Đã giải mã Bia Ký "${lore.title}"! (+${lore.rewardXp} XP, +${lore.rewardGold}G${itemText})`,
        "epic"
      );
      this.saveGame(false);
    }
    this.setModal("journal", { tab: "lore", loreId: lore.id });
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
      this.inv.gold += 30;
      if (this.coop.isConnected) {
        this.coop.send({
          type: "waypoint_unlocked",
          wpId: wp.id,
          wx,
          wy,
          radiusPx: maxR,
        });
      }
      this.ui.onToast(
        `ĐÃ KÍCH HOẠT ${wp.name.toUpperCase()}! Khôi phục sắc màu, +30G & mở Dịch Chuyển Nhanh [M]!`,
        "epic"
      );
      this.saveGame(false);
    } else {
      this.vfx.spawnPooled("heal-aoe", { x: this.player.x, y: this.player.y });
      this.ui.onToast(`Đã hồi đầy HP/Thể lực tại ${wp.name}. Mở Bản đồ [M] để Dịch Chuyển Nhanh!`, "good");
    }
    this.ui.onHudUpdate();
  }

  isHiddenItemUnlocked(defId: string): boolean {
    if (this.unlockedHiddenItems.has(defId)) return true;
    for (const slot of EQUIP_SLOTS) {
      if (this.inv.equipment[slot]?.defId === defId) return true;
    }
    return this.inv.bag.some((b) => b.defId === defId);
  }

  canRevealHiddenRecipe(recipe: RecipeDef): boolean {
    return this.itemEffects.isHiddenRecipeUnlocked(
      recipe,
      this.inv,
      this.unlockedHiddenItems,
      this.unlockedHiddenRecipes
    );
  }

  unlockHiddenItem(defId: string): boolean {
    const def = ITEMS[defId];
    if (!def?.isHidden) return false;
    const isFirst = !this.unlockedHiddenItems.has(defId);
    this.unlockedHiddenItems.add(defId);
    this.saveSys.saveHiddenUnlocks(this.unlockedHiddenItems);
    if (isFirst) {
      sfx.playHiddenUnlock();
      this.ui.onToast(`✦ MỞ KHÓA CỔ VẬT ẨN: ${def.name}! (Lưu vĩnh viễn)`, "epic");
    }
    return isFirst;
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
      // Auto-Sell Low-Rarity Equipment on pickup (never sells Exotic / Hidden / Seasonal / +N!)
      const autoRes = this.inv.tryAutoSellInstance(loot.item, this.player.classId);
      if (autoRes.sold) {
        this.spawner.groundLoot.splice(idx, 1);
        sfx.playBuy();
        this.vfx.spawnPooled("collect-burst", { x: loot.x, y: loot.y });
        this.vfx.spawnDamageText(loot.x, loot.y - 8, `AUTO +${autoRes.gold}G`, { color: "#ffe066" });
        this.ui.onToast(`💰 Auto-Bán [${RARITY_INFO[def.rarity].label}] ${autoRes.itemName} → +${autoRes.gold} G`, "info");
        this.ui.onHudUpdate();
        return;
      }

      if (!this.inv.addExistingInstance(loot.item)) {
        this.ui.onToast(
          `Túi đồ đã đầy (${this.inv.bag.length}/${this.inv.bagCapacity})! Bật Auto-Bán [I], mua Balo mới hoặc cất vào Rương Cá Nhân!`,
          "warn"
        );
        return;
      }
      this.spawner.groundLoot.splice(idx, 1);
      const isRare = def.rarity === "rare" || def.rarity === "epic" || def.rarity === "legendary";
      sfx.playLootPickup(isRare);
      const burstPreset =
        def.rarity === "legendary"
          ? "collect-burst-legendary"
          : def.rarity === "epic"
            ? "collect-burst-epic"
            : def.rarity === "rare"
              ? "collect-burst-rare"
              : "collect-burst";
      this.vfx.spawnPooled(burstPreset, { x: loot.x, y: loot.y });
      if (def.rarity === "legendary") {
        this.vfx.spawnPooled("crit-gold", { x: loot.x, y: loot.y - 6, scale: 0.9 });
      }
      this.vfx.spawnDamageText(
        loot.x,
        loot.y - 8,
        loot.item.qty > 1 ? `+${loot.item.qty} ITEM` : `LOOT!`,
        { color: RARITY_INFO[def.rarity].color, crit: isRare }
      );
      if (def.isHidden) {
        this.unlockHiddenItem(def.id);
        this.vfx.spawnLive("pixtel/rainbow-burst", { x: loot.x, y: loot.y - 6, priority: 6, maxLife: 1.1 });
        this.saveGame(false);
      }
      if (
        (def.id === "ar_bloodstone_plate" || def.id === "ar_briar_cloak") &&
        this.inv.hasItemAnywhere("ar_bloodstone_plate") &&
        this.inv.hasItemAnywhere("ar_briar_cloak") &&
        !this.unlockedHiddenRecipes.has("rec_ar_aegis_mantle")
      ) {
        this.unlockedHiddenRecipes.add("rec_ar_aegis_mantle");
        sfx.playHiddenUnlock();
        this.ui.onToast("✦ LÒ RÈN ẨN: Đã mở khóa công thức [Chiến Giáp Vệ Binh Bất Diệt]!", "epic");
        this.saveGame(false);
      }
      if (def.category === "equipment") {
        this.ui.onToast(`Đã nhặt [${RARITY_INFO[def.rarity].label}] ${def.name}! Nhấn [I / B] để xem.`, isRare ? "epic" : "good");
      }
      this.ui.onHudUpdate();
    }
  }

  gainXp(amount: number) {
    this.player.xp += amount;
    let leveled = false;
    let gainedPts = 0;
    while (this.player.xp >= this.player.xpNext) {
      this.player.xp -= this.player.xpNext;
      this.player.level += 1;
      this.player.statPoints += 3;
      gainedPts += 3;
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
      this.vfx.spawnDamageText(this.player.x, this.player.y - 18, `LEVEL ${this.player.level}! +${gainedPts} PT`, {
        crit: true,
        color: "#ffe066",
      });
      this.ui.onToast(`THĂNG CẤP LV.${this.player.level}! +${gainedPts} Điểm Tiềm Năng (Nhấn [I] để cộng)!`, "epic");
      this.saveGame(false);
    }
    this.ui.onHudUpdate();
  }

  triggerBossLock(boss: EnemyEntity) {
    const arena = BOSS_ARENAS[boss.defId];
    if (!arena) return;
    if (this.activeBossLock?.bossUid === boss.uid) return;
    const bossName = ENEMIES[boss.defId]?.name ?? "BOSS";
    this.activeBossLock = {
      bossUid: boss.uid,
      bossDefId: boss.defId,
      bossName,
      cx: arena.cx,
      cy: arena.cy,
      radius: arena.radius,
    };
    const p = this.player;
    const dx = p.x - arena.cx;
    const dy = p.y - arena.cy;
    const dist = Math.hypot(dx, dy);
    const safeR = arena.radius - p.radius - 10;
    if (dist > safeR && dist > 0.01) {
      p.x = arena.cx + (dx / dist) * safeR;
      p.y = arena.cy + (dy / dist) * safeR;
      this.vfx.spawnPooled("waypoint-pillar", { x: p.x, y: p.y });
    }
    for (let i = 0; i < 24; i++) {
      const a = (Math.PI * 2 * i) / 24;
      this.vfx.spawnPixelDot(
        arena.cx + Math.cos(a) * arena.radius,
        arena.cy + Math.sin(a) * arena.radius,
        0,
        -12,
        i % 2 === 0 ? "#ff3355" : "#ff8822",
        0.55,
        2
      );
    }
    sfx.playWaypoint();
    this.shake = Math.max(this.shake, 5.5);
    this.ui.onToast(`⚔ PHONG ẤN LÃNH ĐỊA [${bossName}]! Không thể thoát ra cho tới khi hạ Boss hoặc tử trận!`, "warn");
    this.ui.onHudUpdate();
  }

  /** Gets nearest aggro Boss (or locked Arena Boss) for Boss HP Bar display. */
  getActiveBoss(): EnemyEntity | null {
    if (this.activeBossLock) {
      const locked = this.spawner.enemies.find((e) => e.uid === this.activeBossLock!.bossUid && e.hp > 0);
      if (locked) return locked;
    }
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

  /** Steps simulation deterministically by `dt` seconds (used by automated headless tests). */
  step(dt: number) {
    this._update(dt);
  }

  private _makeCombatContext(): CombatContext {
    const isGuest = this.coop.isConnected && !this.coop.isHost;
    const coopTargets =
      this.coop.isConnected && this.coop.isHost
        ? Array.from(this.remotePlayers.values()).map((rp) => ({
            id: rp.snap.id,
            x: rp.snap.x,
            y: rp.snap.y,
            hp: rp.snap.hp,
            shieldGuard: rp.snap.shieldGuard,
          }))
        : undefined;

    return {
      player: this.player,
      world: this.world,
      spawner: this.spawner,
      vfx: this.vfx,
      colorSys: this.colorSys,
      inv: this.inv,
      quests: this.quests,
      itemEffects: this.itemEffects,
      projectiles: this.projectiles,
      turrets: this.turrets,
      hazards: this.hazards,
      isCoopGuest: isGuest,
      coopTargets,
      onCoopClientHitEnemy: (hit) => {
        this.coop.send({
          type: "hit_enemy",
          attackerId: this.coop.localId,
          attackerLevel: this.player.level,
          ...hit,
        });
      },
      onCoopClientLightTotem: (totemIdx, element) => {
        this.coop.send({
          type: "light_totem",
          attackerId: this.coop.localId,
          totemIdx,
          element,
        });
      },
      onCoopEnemyKilled: (kill) => {
        if (this.coop.isConnected && this.coop.isHost) {
          this.coop.send({
            type: "enemy_killed",
            ...kill,
          });
        }
      },
      onCoopReactionVfx: (rx) => {
        if (this.coop.isConnected && this.coop.isHost) {
          this.coop.send({
            type: "reaction_vfx",
            ...rx,
          });
        }
      },
      addShake: (a) => {
        this.shake = Math.max(this.shake, a);
      },
      addHitstop: (s) => {
        if (!this.coop.isConnected) {
          this.hitstop = Math.max(this.hitstop, s);
        }
      },
      notify: (msg, tone = "info") => this.ui.onToast(msg, tone),
      onGainXp: (amt) => this.gainXp(amt),
      defeatedBossIds: this.defeatedBossIds,
      getBossLock: () => this.activeBossLock,
      onBossLockTrigger: (boss) => this.triggerBossLock(boss),
      onBossDefeated: (enemy) => {
        const name = ENEMIES[enemy.defId]?.name ?? "BOSS";
        if (this.activeBossLock?.bossUid === enemy.uid) {
          this.activeBossLock = null;
          this.ui.onToast(`🔓 Phong ấn Lãnh Địa [${name}] đã được giải trừ!`, "good");
        }
        sfx.playWaypoint();
        this.shake = 7;
        if (enemy.isWorldBoss) {
          // Restore the entire world color in celebration!
          this.colorSys.triggerWave(enemy.x, enemy.y, 1800, 480);
          this.ui.onBossVictory(true, name);
        } else {
          this.ui.onBossVictory(false, name);
        }
        const newlyUnlocked = this.itemEffects.checkBossKillHiddenUnlocks(enemy.defId, this.inv);
        for (const recId of newlyUnlocked) {
          if (!this.unlockedHiddenRecipes.has(recId)) {
            this.unlockedHiddenRecipes.add(recId);
            sfx.playHiddenUnlock();
            this.ui.onToast("✦ BÍ MẬT LÒ RÈN: Kiếm Sứt Mẻ cộng hưởng Lõi Vùng 2 — Mở khóa [Thánh Kiếm Sao Rơi]!", "epic");
          }
        }
        this.saveGame(false);
        this.ui.onHudUpdate();
      },
      onPlayerDefeated: () => {
        // Release Boss Lock & Reset Boss on Player defeat (if Solo or no living teammates in arena)!
        if (this.activeBossLock && !this.coop.isConnected) {
          this.spawner.resetBossOnPlayerDeath(this.activeBossLock.bossUid);
          this.activeBossLock = null;
        }
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
    this.tickNetwork(dt);

    if (!this.running || this.activeModal !== null) {
      this.vfx.update(dt * 0.5);
      return;
    }

    if (this.hitstop > 0 && !this.coop.isConnected) {
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

    // Aim angle: Mouse cursor on PC, Smart Auto-Aim / Twin-Stick on Mobile!
    if (!this.mobileMode) {
      const worldMouseX = this.camX + this.mouseScreenX;
      const worldMouseY = this.camY + this.mouseScreenY;
      p.aimAngle = Math.atan2(worldMouseY - p.y, worldMouseX - p.x);
      this.autoAimTargetUid = null;
    } else if (!p.charging) {
      const autoAng = this.computeAutoAimAngle();
      if (autoAng !== null) {
        p.aimAngle = autoAng;
      }
    }

    // WASD + Mobile Analog Virtual Joystick Movement + Sprint + Stamina wheel
    let mx = this.touchMoveX;
    let my = this.touchMoveY;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) my -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) my += 1;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) mx -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) mx += 1;

    const rawMag = Math.hypot(mx, my);
    const moving = rawMag > 0.08;
    let moveScale = 1.0;
    if (moving) {
      moveScale = Math.min(1, rawMag);
      mx /= rawMag;
      my /= rawMag;
      if (this.mobileMode && this.autoAimTargetUid === null && !p.charging) {
        p.aimAngle = Math.atan2(my, mx);
      }
      if (p.attackAnimTime <= 0 && !p.charging) {
        if (Math.abs(mx) > 0.1) p.facing = mx < 0 ? -1 : 1;
        if (Math.abs(mx) >= Math.abs(my)) {
          p.facingDir = mx < 0 ? "left" : "right";
        } else {
          p.facingDir = my < 0 ? "up" : "down";
        }
      }
    }

    const wantSprint =
      (this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") || this.touchSprint) &&
      moving &&
      !p.exhausted &&
      p.dashing <= 0;
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
      const buffMult = p.speedBuffTime > 0 ? 1 + (p.speedBuffPct || 0.28) : 1.0;
      const gustMult = p.chromaGustTime > 0 ? 1.18 : 1.0;
      const exhaustSlow = p.exhausted ? 0.84 : 1.0;
      const chargeSlow = p.charging && p.chargeTime > 0.18 ? 0.65 : 1.0;
      const spd = p.spd * moveScale * sprintMult * buffMult * gustMult * exhaustSlow * chargeSlow;
      this.world.moveWithCollision(p, mx * spd * dt, my * spd * dt, p.radius);
      p.walkTime += dt * (p.sprinting ? 11 : 7.5);
      if (this.tutorialActive && BEGINNER_PRACTICE_STEPS[this.tutorialStep]?.id === "move") {
        this.tutorialMoveDist += spd * dt;
        if (this.tutorialMoveDist >= 26) {
          this._advanceTutorial("move");
        }
      }
    }

    // Enforce Boss Arena Territory Lock perimeter barrier
    if (this.activeBossLock) {
      const lock = this.activeBossLock;
      const bossAlive = this.spawner.enemies.some((e) => e.uid === lock.bossUid && e.hp > 0);
      if (!bossAlive) {
        this.activeBossLock = null;
        this.ui.onHudUpdate();
      } else {
        const dx = p.x - lock.cx;
        const dy = p.y - lock.cy;
        const d = Math.hypot(dx, dy);
        const maxR = lock.radius - p.radius - 2;
        if (d > maxR && d > 0.01) {
          p.x = lock.cx + (dx / d) * maxR;
          p.y = lock.cy + (dy / d) * maxR;
          p.dashing = 0;
          const bAng = Math.atan2(dy, dx);
          this.vfx.spawnPixelDot(
            lock.cx + Math.cos(bAng) * lock.radius,
            lock.cy + Math.sin(bAng) * lock.radius,
            -Math.cos(bAng) * 24,
            -Math.sin(bAng) * 24 - 10,
            "#ff3355",
            0.24,
            2
          );
          if (this.time - this.lastBarrierWarn > 2.0) {
            this.lastBarrierWarn = this.time;
            sfx.playForgeFail();
            this.ui.onToast(`🔒 Lãnh Địa ${lock.bossName}: Không thể rút lui khỏi phong ấn!`, "warn");
          }
        }
      }
    }

    // Hold LMB Charge Attack logic (supports Quick-Charge after N3/[E] & Golden Just-Charge Lv2 window!)
    const reqCharge = p.quickChargeTimer > 0 ? 0.26 : 0.38;
    const isJustWindow =
      p.chargeTime >= reqCharge + 0.12 && p.chargeTime <= reqCharge + 0.34;
    if (this.mouseDown) {
      p.charging = true;
      p.chargeTime += dt;
      if (p.chargeTime > 0.12 && p.attackAnimTime <= 0) {
        p.facing = Math.cos(p.aimAngle) < 0 ? -1 : 1;
      }
      if (p.chargeTime > reqCharge * 0.85 && Math.random() < 0.45) {
        const ang = Math.random() * Math.PI * 2;
        this.vfx.spawnPixelDot(
          p.x + Math.cos(ang) * 14,
          p.y - 13 + Math.sin(ang) * 14,
          -Math.cos(ang) * 35,
          -Math.sin(ang) * 35,
          isJustWindow ? "#ffffff" : p.chargeTime >= reqCharge ? "#ffe066" : "#4be8ff",
          0.18,
          2
        );
      }
    } else if (p.charging) {
      if (p.chargeTime >= reqCharge) {
        this.combat.performChargedAttack(combatCtx, isJustWindow);
        this._advanceTutorial("charge");
      }
      p.charging = false;
      p.chargeTime = 0;
    }

    // High-tier (Epic / Legendary) or +5/+7+ Weapon Glow & Infused Element Particles!
    const wpnInst = this.inv.getValidEquippedWeapon(p.classId);
    const wpnDef = wpnInst ? ITEMS[wpnInst.defId] : undefined;
    const wpnLv = wpnInst?.enhanceLevel ?? 0;
    const isHighTierWeapon =
      wpnDef?.rarity === "epic" || wpnDef?.rarity === "legendary" || wpnLv >= 7;
    if (isHighTierWeapon || wpnLv >= 5) {
      const bleachedHere = !this.colorSys.isWorldPosRestored(p.x, p.y);
      const animState: HeroAnimState =
        p.stormTime > 0 || p.attackAnimTime > 0
          ? "attack"
          : p.dashing > 0
            ? "dash"
            : p.charging && p.chargeTime > 0.12
              ? "charge"
              : moving
                ? "run"
                : "idle";
      const anchor = getWeaponAnchorOffset(p.facing, p.facingDir, animState);
      const wx = p.x + anchor.dx;
      const wy = p.y + anchor.dy;

      const infCol = wpnInst?.infusedElement
        ? ELEMENT_META[wpnInst.infusedElement].color
        : null;

      this.weaponGlowTimer -= dt;
      if (this.weaponGlowTimer <= 0) {
        this.weaponGlowTimer = wpnLv >= 8 || wpnDef?.rarity === "legendary" ? 0.08 : 0.13;
        const a = this.time * 4.5 + Math.random() * 1.4;
        const col = bleachedHere
          ? "#c2c9d6"
          : wpnLv >= 10 || wpnDef?.rarity === "legendary"
            ? CHROMA_RAINBOW[Math.floor(this.time * 8) % CHROMA_RAINBOW.length]
            : infCol ?? (wpnDef?.rarity === "epic" ? "#c266ff" : "#ffe066");
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

    // Hidden Gear Shimmer Particles (respects Bleached vs Restored state!)
    let hasHiddenEquipped = false;
    for (const slot of EQUIP_SLOTS) {
      const eq = this.inv.equipment[slot];
      if (eq && ITEMS[eq.defId]?.isHidden) {
        hasHiddenEquipped = true;
        break;
      }
    }
    if (hasHiddenEquipped && Math.random() < 0.28) {
      const bleachedHere = !this.colorSys.isWorldPosRestored(p.x, p.y);
      const col = bleachedHere
        ? "#cfd6e3"
        : CHROMA_RAINBOW[Math.floor(this.time * 10 + Math.random() * 6) % CHROMA_RAINBOW.length];
      this.vfx.spawnPixelDot(
        p.x + (Math.random() - 0.5) * 14,
        p.y - 4 - Math.random() * 12,
        (Math.random() - 0.5) * 10,
        -12,
        col,
        0.36,
        1
      );
    }

    // Combat, Enemies, Spawners, VFX
    this.combat.update(combatCtx, dt);
    this.spawner.update(dt, p.x, p.y, this.vfx);
    this.vfx.update(dt);

    // Magnetic Pull + Auto-pickup when walking near Ground Loot (boosted +60px by Energy Siphon!)
    const magnetBonus = p.hasEnergySiphon ? 60 : 0;
    for (let i = this.spawner.groundLoot.length - 1; i >= 0; i--) {
      const l = this.spawner.groundLoot[i];
      if (l.age < 0.28) continue;
      const dx = p.x - l.x;
      const dy = p.y - l.y;
      const d = Math.hypot(dx, dy);
      const isEquip = l.kind === "item" && l.item && ITEMS[l.item.defId]?.category === "equipment";
      const magnetRadius = (isEquip ? 44 : 58) + magnetBonus;
      if (d < magnetRadius && d > 1) {
        const willAutoSell = Boolean(l.item && this.inv.shouldAutoSell(l.item, this.player.classId));
        if (!isEquip || willAutoSell || this.inv.bag.length < this.inv.bagCapacity) {
          const pull = (isEquip ? 145 + magnetBonus * 0.6 : 190 + magnetBonus * 0.8) * dt;
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

    // Nearest [F] Interactable (includes Ancient Lore Tablets!)
    this.nearestInteractable = findNearestInteractable(
      p.x,
      p.y,
      this.colorSys,
      this.spawner.chests,
      this.spawner.groundLoot,
      this.discoveredLore
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

    // 1b. Persistent Ground Fields (Acid Pool, Moss Pool, Flame Trail, Bleach Zone, Null Frost, Chroma Bloom!)
    for (const h of this.hazards) {
      if (
        h.kind !== "acid_pool" &&
        h.kind !== "moss_pool" &&
        h.kind !== "flame_trail" &&
        h.kind !== "bleach_zone" &&
        h.kind !== "null_frost" &&
        h.kind !== "chroma_bloom"
      ) {
        continue;
      }
      const sx = Math.round(h.x - camX);
      const sy = Math.round(h.y - camY);
      if (sx < -48 || sy < -48 || sx > VIEW_W + 48 || sy > VIEW_H + 48) continue;
      const r = Math.round(h.radius * 0.65);
      ctx.fillStyle =
        h.kind === "acid_pool" || h.kind === "moss_pool"
          ? "rgba(46, 204, 102, 0.35)"
          : h.kind === "flame_trail"
            ? "rgba(255, 110, 34, 0.38)"
            : h.kind === "null_frost"
              ? "rgba(110, 175, 255, 0.34)"
              : h.kind === "chroma_bloom"
                ? "rgba(255, 102, 196, 0.30)"
                : "rgba(220, 228, 242, 0.36)";
      ctx.fillRect(sx - r, sy - Math.round(r * 0.55), r * 2, Math.round(r * 1.1));
      ctx.fillStyle =
        h.kind === "acid_pool" || h.kind === "moss_pool"
          ? "#66ff88"
          : h.kind === "flame_trail"
            ? "#ffee55"
            : h.kind === "null_frost"
              ? "#b266ff"
              : h.kind === "chroma_bloom"
                ? "#44ee88"
                : "#ffffff";
      const bub = Math.floor(this.time * 6 + h.uid) % 5;
      ctx.fillRect(sx - r + bub * 5, sy - 2, 2, 2);
      ctx.fillRect(sx + r - bub * 4 - 2, sy + 2, 2, 2);
    }

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

      ctx.fillStyle = "rgba(0,0,0,0.38)";
      ctx.fillRect(sx - 3, sy + 1, 6, 2);

      if (l.kind === "gold") {
        this.vfx.drawAtlasInstance(ctx, coinAtlas, sx, vy, this.time + l.bobPhase);
      } else if (l.item) {
        const def = ITEMS[l.item.defId];
        const isHighRarity =
          l.rarity === "rare" || l.rarity === "epic" || l.rarity === "legendary";
        if (def && (def.category === "equipment" || isHighRarity)) {
          const beam = this.vfx.getAtlas(RARITY_INFO[l.rarity].beamPreset);
          this.vfx.drawAtlasInstance(ctx, beam, sx, sy - 6, this.time + l.bobPhase, 0, false, 1, 0.95);

          // Crisp 16x16 pixel drop pedestal + 12x12 codixel item icon
          ctx.fillStyle = "#0b0914";
          ctx.fillRect(sx - 8, vy - 8, 16, 16);
          ctx.fillStyle = RARITY_INFO[l.rarity].color;
          ctx.fillRect(sx - 7, vy - 7, 14, 14);
          ctx.fillStyle = "#141022";
          ctx.fillRect(sx - 6, vy - 6, 12, 12);
          drawItemIcon(ctx, def, 12, sx - 6, vy - 6);

          // Hidden Relic exclusive rainbow ground pulse + legendary aura!
          if (def.isHidden) {
            const pulseCol = CHROMA_RAINBOW[Math.floor(this.time * 8) % CHROMA_RAINBOW.length];
            ctx.fillStyle = pulseCol;
            ctx.fillRect(sx - 9, vy - 9, 18, 1);
            ctx.fillRect(sx - 9, vy + 8, 18, 1);
            ctx.fillRect(sx - 9, vy - 9, 1, 18);
            ctx.fillRect(sx + 8, vy - 9, 1, 18);
          }

          // High-rarity pixelfx orbiting aura + glints (Rare / Epic / Legendary / Hidden)
          if (isHighRarity || def.isHidden) {
            const auraAtlas = this.vfx.getAtlas(`item-aura-${def.isHidden ? "legendary" : l.rarity}`);
            const auraScale = def.isHidden || l.rarity === "legendary" ? 1.0 : l.rarity === "epic" ? 0.88 : 0.8;
            this.vfx.drawAtlasInstance(
              ctx,
              auraAtlas,
              sx,
              vy,
              this.time + l.bobPhase,
              0,
              false,
              auraScale,
              1
            );
          }
        } else {
          this.vfx.drawAtlasInstance(ctx, shardAtlas, sx, vy, this.time + l.bobPhase);
        }
      }
    }

    // 4.5 Boss Arena Territory Seal Perimeter
    if (this.activeBossLock) {
      const lock = this.activeBossLock;
      const bcx = Math.round(lock.cx - camX);
      const bcy = Math.round(lock.cy - camY);
      const r = lock.radius;
      ctx.save();
      ctx.strokeStyle = "rgba(255, 51, 85, 0.35)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(bcx, bcy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = (Math.floor(this.time * 8) & 1) === 0 ? "#ff3355" : "#ff8822";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -this.time * 24;
      ctx.beginPath();
      ctx.arc(bcx, bcy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      for (let i = 0; i < 16; i++) {
        const a = (Math.PI * 2 * i) / 16 + this.time * 0.45;
        const px = Math.round(bcx + Math.cos(a) * r);
        const py = Math.round(bcy + Math.sin(a) * r);
        if (px < -10 || py < -10 || px > VIEW_W + 10 || py > VIEW_H + 10) continue;
        ctx.fillStyle = "#140814";
        ctx.fillRect(px - 2, py - 3, 4, 5);
        ctx.fillStyle = i % 2 === 0 ? "#ff3355" : "#ffbb44";
        ctx.fillRect(px - 1, py - 2, 2, 3);
      }
    }

    // 5. Y-Sorted World Drawables
    const drawList: { y: number; draw: () => void }[] = [];

    // Town Buildings
    for (const b of this.world.buildings) {
      const sx = Math.round(b.x - camX);
      const sy = Math.round(b.y - camY);
      if (sx < -72 || sy < -72 || sx > VIEW_W + 72 || sy > VIEW_H + 72) continue;
      drawList.push({
        y: b.y,
        draw: () => {
          const img = sprites.buildings[b.kind];
          if (b.kind === "classAltar") {
            ctx.fillStyle = "rgba(8, 10, 20, 0.34)";
            ctx.fillRect(sx - 16, sy - 2, 32, 6);
            ctx.drawImage(img, Math.round(sx - img.width / 2), Math.round(sy - img.height + 7));
            const crys = sprites.buildings.classAltarCrystal;
            const bob = Math.round(Math.sin(this.time * 3.2) * 2);
            ctx.drawImage(crys, Math.round(sx - crys.width / 2), Math.round(sy - 33 + bob));
            const tw = textWidth("CLASS ALTAR", "mini");
            const lx = Math.round(sx - tw / 2);
            const ly = Math.round(sy - 41);
            ctx.fillStyle = "#100c1c";
            ctx.fillRect(lx - 2, ly - 1, tw + 4, 8);
            ctx.fillStyle = "#4be8ff";
            rasterText("CLASS ALTAR", "mini", (gx: number, gy: number) => ctx.fillRect(lx + gx, ly + gy, 1, 1));
          } else {
            ctx.fillStyle = "rgba(8, 10, 20, 0.3)";
            ctx.fillRect(sx - 27, sy - 1, 54, 7);
            ctx.drawImage(img, Math.round(sx - img.width / 2), Math.round(sy - img.height + 6));
          }
        },
      });
    }

    // Personal Storage Chest right beside Spawn (Rương Cá Nhân)
    {
      const cx = STORAGE_CHEST_POS.tx * TILE_SIZE + 8;
      const cy = STORAGE_CHEST_POS.ty * TILE_SIZE + 10;
      const sx = Math.round(cx - camX);
      const sy = Math.round(cy - camY);
      if (sx > -44 && sy > -48 && sx < VIEW_W + 44 && sy < VIEW_H + 44) {
        drawList.push({
          y: cy,
          draw: () => {
            // Cozy timber/stone pad right next to Spawn Waypoint
            ctx.fillStyle = "rgba(8, 10, 20, 0.36)";
            ctx.fillRect(sx - 13, sy - 2, 26, 6);
            ctx.fillStyle = "#181d2e";
            ctx.fillRect(sx - 11, sy - 6, 22, 7);
            ctx.fillStyle = "#31486b";
            ctx.fillRect(sx - 10, sy - 5, 20, 5);
            ctx.fillStyle = "#5ef2ff";
            ctx.fillRect(sx - 9, sy - 5, 18, 1);
            // Crisp codixel Personal Stash Chest icon
            const glow = 0.45 + 0.55 * Math.sin(this.time * 3.0);
            if (glow > 0.5) {
              ctx.fillStyle = "rgba(94, 242, 255, 0.16)";
              ctx.fillRect(sx - 10, sy - 23, 20, 19);
            }
            if (!drawCodixelIcon(ctx, "ui_stash_chest", sx - 10, sy - 23, 20)) {
              ctx.fillStyle = "#c8863c";
              ctx.fillRect(sx - 8, sy - 18, 16, 12);
            }
            // Crisp pixel label
            const label = "STASH CHEST";
            const tw = textWidth(label, "mini");
            const lx = Math.round(sx - tw / 2);
            const ly = Math.round(sy - 31);
            ctx.fillStyle = "#100c1c";
            ctx.fillRect(lx - 2, ly - 1, tw + 4, 8);
            ctx.fillStyle = "#5ef2ff";
            rasterText(label, "mini", (rx: number, ry: number) => ctx.fillRect(lx + rx, ly + ry, 1, 1));
          },
        });
      }
    }

    // Seasonal Gacha Altar (Đài Rương Gacha Mùa in Origin Town)
    {
      const gx = GACHA_ALTAR_POS.tx * TILE_SIZE + 8;
      const gy = GACHA_ALTAR_POS.ty * TILE_SIZE + 10;
      const sx = Math.round(gx - camX);
      const sy = Math.round(gy - camY);
      if (sx > -48 && sy > -54 && sx < VIEW_W + 48 && sy < VIEW_H + 48) {
        drawList.push({
          y: gy,
          draw: () => {
            const pulse = 0.5 + 0.5 * Math.sin(this.time * 4.5);
            const rainbow = CHROMA_RAINBOW[Math.floor(this.time * 4) % CHROMA_RAINBOW.length];
            // Ground shadow & golden rune circle
            ctx.fillStyle = "rgba(8, 10, 20, 0.38)";
            ctx.fillRect(sx - 16, sy - 3, 32, 7);
            ctx.fillStyle = "#1c132d";
            ctx.fillRect(sx - 14, sy - 7, 28, 8);
            ctx.fillStyle = "#3a275c";
            ctx.fillRect(sx - 13, sy - 6, 26, 6);
            ctx.fillStyle = "#ffd95e";
            ctx.fillRect(sx - 12, sy - 6, 24, 1);
            ctx.fillRect(sx - 12, sy - 1, 24, 1);
            // Rainbow rune glow strips
            ctx.fillStyle = rainbow;
            ctx.fillRect(sx - 8, sy - 4, 4, 2);
            ctx.fillRect(sx + 4, sy - 4, 4, 2);
            // Floating Seasonal Gacha Chest (crisp codixel icon)
            const bob = Math.round(Math.sin(this.time * 3.6) * 2.2);
            if (pulse > 0.35) {
              ctx.fillStyle = "rgba(255, 224, 102, 0.22)";
              ctx.fillRect(sx - 11, sy - 27 + bob, 22, 22);
            }
            if (!drawCodixelIcon(ctx, "ui_gacha_chest", sx - 10, sy - 26 + bob, 20)) {
              ctx.fillStyle = "#ffe066";
              ctx.fillRect(sx - 7, sy - 21 + bob, 14, 11);
            }
            // Orbiting starlight sparkles
            for (let i = 0; i < 3; i++) {
              const a = this.time * 2.6 + (i * Math.PI * 2) / 3;
              const px = Math.round(sx + Math.cos(a) * 12);
              const py = Math.round(sy - 16 + bob + Math.sin(a) * 5);
              ctx.fillStyle = i === 0 ? "#ffffff" : rainbow;
              ctx.fillRect(px, py, 2, 2);
            }
            // Crisp pixel label
            const label = "GACHA ALTAR";
            const tw = textWidth(label, "mini");
            const lx = Math.round(sx - tw / 2);
            const ly = Math.round(sy - 36);
            ctx.fillStyle = "#100c1c";
            ctx.fillRect(lx - 2, ly - 1, tw + 4, 8);
            ctx.fillStyle = "#ffe066";
            rasterText(label, "mini", (rx: number, ry: number) => ctx.fillRect(lx + rx, ly + ry, 1, 1));
          },
        });
      }
    }

    // Viewport-culled Props (Codixel multi-variant trees, rocks & ruins pillars)
    const visProps = this.world.getVisibleProps(camX, camY, VIEW_W, VIEW_H);
    for (const pr of visProps) {
      const sx = Math.round(pr.x - camX);
      const sy = Math.round(pr.y - camY);
      const restored = this.colorSys.isWorldPosRestored(pr.x, pr.y);
      const tset = restored ? sprites.tilesRestored[pr.biome] : sprites.tilesBleached[pr.biome];
      const variant = pr.id & 1;
      const img =
        pr.kind === "tree"
          ? tset.trees[variant]
          : pr.kind === "rock"
            ? tset.rocks[variant]
            : tset.pillars[variant];
      drawList.push({
        y: pr.y,
        draw: () => {
          const shW = pr.kind === "tree" ? 24 : pr.kind === "rock" ? 18 : 14;
          ctx.fillStyle = "rgba(8, 10, 20, 0.32)";
          ctx.fillRect(Math.round(sx - shW / 2), sy - 2, shW, 4);
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

    // Ancient Lore Tablets (8 Bia Ký Lăng Kính)
    for (const lore of LORE_TABLETS) {
      const wx = lore.tx * TILE_SIZE + 8;
      const wy = lore.ty * TILE_SIZE + 10;
      const sx = Math.round(wx - camX);
      const sy = Math.round(wy - camY);
      if (sx < -28 || sy < -32 || sx > VIEW_W + 28 || sy > VIEW_H + 32) continue;
      const isRead = this.discoveredLore.has(lore.id);
      drawList.push({
        y: wy,
        draw: () => {
          const img = isRead ? sprites.interactables.loreRead : sprites.interactables.loreUnread;
          ctx.drawImage(img, sx - 8, sy - 18);
          if (!isRead) {
            const by = sy - 25 + Math.round(Math.sin(this.time * 5 + lore.tx) * 2);
            ctx.fillStyle = "#100c18";
            ctx.fillRect(sx - 4, by - 1, 8, 7);
            ctx.fillStyle = "#c266ff";
            ctx.fillRect(sx - 3, by, 6, 5);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(sx - 1, by + 1, 2, 3);
          }
        },
      });
    }

    // Arena Chroma Totems (spawned during World Boss The Eraser Phase 2 Classic & Phase 3 Primordial!)
    for (const totem of this.spawner.arenaTotems) {
      const sx = Math.round(totem.x - camX);
      const sy = Math.round(totem.y - camY);
      if (sx < -28 || sy < -32 || sx > VIEW_W + 28 || sy > VIEW_H + 32) continue;
      drawList.push({
        y: totem.y,
        draw: () => {
          const img = totem.lit
            ? sprites.interactables[`totem_${totem.element}`]
            : sprites.interactables.totemOff;
          ctx.drawImage(img, sx - 8, sy - 20);
          const tCol = ELEMENT_META[totem.element].color;
          if (!totem.lit) {
            const tw = textWidth("HIT!", "mini");
            const lx = Math.round(sx - tw / 2);
            const ly = sy - 28 + Math.round(Math.sin(this.time * 8) * 1);
            ctx.fillStyle = "#100c18";
            ctx.fillRect(lx - 1, ly - 1, tw + 2, 7);
            ctx.fillStyle = tCol;
            rasterText("HIT!", "mini", (gx: number, gy: number) => ctx.fillRect(lx + gx, ly + gy, 1, 1));
            // Colored crystal core preview so player knows which of the 8 elements this Totem grants!
            ctx.fillRect(sx - 2, sy - 14, 4, 4);
          }
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
          ctx.fillStyle = "rgba(8, 10, 20, 0.34)";
          ctx.fillRect(sx - 8, sy - 1, 16, 4);
          const img =
            ch.state === "opened"
              ? sprites.interactables.chestOpened
              : ch.state === "unlocked"
                ? sprites.interactables.chestUnlocked
                : sprites.interactables.chestLocked;
          ctx.drawImage(img, Math.round(sx - img.width / 2), Math.round(sy - img.height + 3));
        },
      });
    }

    // Resource Nodes (Ores & Crystals)
    for (const res of this.spawner.resources) {
      if (!res.alive) continue;
      const sx = Math.round(res.x - camX);
      const sy = Math.round(res.y - camY);
      if (sx < -28 || sy < -28 || sx > VIEW_W + 28 || sy > VIEW_H + 28) continue;
      drawList.push({
        y: res.y,
        draw: () => {
          ctx.fillStyle = "rgba(8, 10, 20, 0.32)";
          ctx.fillRect(sx - 9, sy - 1, 18, 4);
          const img = sprites.interactables[res.def.kind];
          const jx = res.hitFlash > 0 ? Math.round((Math.random() - 0.5) * 2) : 0;
          ctx.drawImage(img, Math.round(sx - img.width / 2 + jx), Math.round(sy - img.height + 4));
          if (res.hp < res.maxHp) {
            ctx.fillStyle = "#100c18";
            ctx.fillRect(sx - 8, sy - img.height + 1, 16, 3);
            ctx.fillStyle = "#ffe066";
            ctx.fillRect(sx - 7, sy - img.height + 2, Math.max(1, Math.round((res.hp / res.maxHp) * 14)), 1);
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
          ctx.fillRect(sx - 6, sy - 1, 12, 3);
          const sp = sprites.npcs[npc.kind];
          const bob = Math.floor(this.time * 2) & 1;
          ctx.drawImage(sp.right, Math.round(sx - sp.w / 2), Math.round(sy - sp.h + 2 + bob));

          if (marker) {
            const by = sy - sp.h - 6 + Math.round(Math.sin(this.time * 6) * 2);
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
          ctx.fillStyle = "#100c18";
          ctx.fillRect(sx - 7, sy - 18, 14, 3);
          ctx.fillStyle = t.overclockTime > 0 ? "#ffe066" : "#44ee88";
          ctx.fillRect(sx - 6, sy - 17, Math.max(1, Math.round((t.hp / t.maxHp) * 12)), 1);
        },
      });
    }

    // Viewport-culled Enemies & Bosses (with Root vines, Stun stars, Vulnerable sword & Bleach Shield!)
    for (const e of this.spawner.enemies) {
      const sx = Math.round(e.x - camX);
      const sy = Math.round(e.y - camY);
      if (sx < -56 || sy < -56 || sx > VIEW_W + 56 || sy > VIEW_H + 56) continue;
      drawList.push({
        y: e.y,
        draw: () => {
          const frame = Math.floor(e.walkTime * 5) & 1;
          const sp = sprites.getEnemy(e.defId, frame);
          const atlasSz = getCodixelEnemySize(e.defId);
          const isMoving =
            e.dashTime > 0 ||
            (e.stunTime <= 0 &&
              e.rootTime <= 0 &&
              (e.state === "leash" ||
                (e.state === "patrol" && Math.hypot(e.patrolTargetX - e.x, e.patrolTargetY - e.y) >= 6) ||
                (e.state === "aggro" && Math.hypot(this.player.x - e.x, this.player.y - e.y) > e.radius + this.player.radius + 3)));

          const animProgress =
            e.animTime > 0
              ? Math.min(1, Math.max(0, 1 - e.animTime / Math.max(0.05, e.animDuration)))
              : 0;
          const animKind = e.animTime > 0 ? e.animKind : "idle";
          const drewAtlas = drawCodixelEnemy(ctx, {
            defId: e.defId,
            uid: e.uid,
            x: sx,
            y: sy,
            facingDir: e.facingDir,
            animKind,
            animProgress,
            animAngle: e.animAngle,
            walkTime: e.walkTime,
            isMoving,
            isBoss: e.isBoss,
            hitFlash: e.hitFlash > 0,
            guardTime: e.guardTime,
            dashTime: e.dashTime,
            dashVx: e.dashVx,
            dashVy: e.dashVy,
            spawnAnimTime: e.spawnAnimTime,
            alertTimer: e.alertTimer,
            hurtTilt: e.hurtTilt,
            time: this.time,
          });
          if (!drewAtlas) {
            const img =
              e.hitFlash > 0
                ? e.facing < 0
                  ? sp.whiteLeft
                  : sp.whiteRight
                : e.facing < 0
                  ? sp.left
                  : sp.right;
            const cs = Math.cos(e.animAngle);
            const sn = Math.sin(e.animAngle);
            const isFloater =
              e.defId === "cinder_imp" || e.defId === "void_wraith" || e.defId === "boss_the_eraser";
            let ox = 0;
            let oy = isFloater ? Math.round(Math.sin(this.time * 4.5 + e.uid) * 2.5) : 0;
            let sX = 1;
            let sY = 1;
            if (!isFloater && !isMoving && animKind === "idle") {
              const b = Math.sin(this.time * 3.5 + e.uid);
              sX = 1 - b * 0.03;
              sY = 1 + b * 0.035;
            }
            if (animKind === "molten_slam" || animKind === "void_slam") {
              if (animProgress < 0.32) {
                const k = animProgress / 0.32;
                sX = 1 + 0.16 * k;
                sY = 1 - 0.14 * k;
              } else if (animProgress < 0.72) {
                const arc = Math.sin(((animProgress - 0.32) / 0.4) * Math.PI);
                oy -= Math.round(arc * 14);
                sX = 0.92;
                sY = 1.12;
              } else {
                const k = 1 - (animProgress - 0.72) / 0.28;
                sX = 1 + 0.25 * k;
                sY = 1 - 0.22 * k;
              }
            } else if (
              animKind === "ember_cast" ||
              animKind === "ember_volley" ||
              animKind === "void_barrage" ||
              animKind === "erase_cast"
            ) {
              if (animProgress < 0.34) {
                ox += ((Math.floor(this.time * 45) & 1) ? 1 : -1);
                sX = 0.94;
                sY = 1.08;
              } else {
                const k = 1 - (animProgress - 0.34) / 0.66;
                ox += Math.round(cs * 3 * k);
                oy += Math.round(sn * 2 * k);
                sX = 1 + 0.1 * k;
                sY = 0.94;
              }
            } else if (animKind === "amber_roll" || animKind === "void_blink") {
              sX = 1.12;
              sY = 0.9;
            }
            if (e.hitFlash > 0) {
              sX *= 1.14;
              sY *= 0.88;
              ox += ((Math.floor(this.time * 55) + e.uid) & 1) ? 1 : -1;
            }
            const lift = Math.max(0, -oy) + (isFloater ? 3 : 0);
            const sw = Math.max(6, Math.round((e.isBoss ? 24 : 12) * Math.max(0.45, 1 - lift * 0.024)));
            ctx.fillStyle = `rgba(0,0,0,${Math.max(0.16, 0.38 - lift * 0.008).toFixed(2)})`;
            ctx.fillRect(Math.round(sx + ox * 0.3 - sw / 2), sy - 1, sw, 3);

            if (e.dashTime > 0 && e.hitFlash <= 0) {
              const baseImg = e.facing < 0 ? sp.left : sp.right;
              const dLen = Math.hypot(e.dashVx, e.dashVy) || 1;
              for (let g = 2; g >= 1; g--) {
                ctx.save();
                ctx.globalAlpha = g === 1 ? 0.35 : 0.18;
                ctx.imageSmoothingEnabled = false;
                ctx.translate(
                  Math.round(sx + ox - (e.dashVx / dLen) * g * 5),
                  Math.round(sy + oy - (e.dashVy / dLen) * g * 4)
                );
                ctx.scale(sX, sY);
                ctx.drawImage(baseImg, -sp.w / 2, -sp.h);
                ctx.restore();
              }
            }

            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.translate(Math.round(sx + ox), Math.round(sy + oy));
            ctx.scale(sX, sY);
            ctx.drawImage(img, -sp.w / 2, -sp.h);
            ctx.restore();
          }

          // Cryo-Root vines at enemy feet (image_3 / image_4)
          if (e.rootTime > 0) {
            ctx.fillStyle = "#22a855";
            ctx.fillRect(sx - 6, sy - 3, 12, 2);
            ctx.fillStyle = "#78ffae";
            ctx.fillRect(sx - 4, sy - 5, 2, 3);
            ctx.fillRect(sx + 2, sy - 5, 2, 3);
          }

          // Elemental status pip above enemy (supports all 9 elements!)
          const spriteH = drewAtlas && atlasSz ? atlasSz.h : sp.h;
          const topY = sy - spriteH;
          if (e.element) {
            ctx.fillStyle = "#100c18";
            ctx.fillRect(sx - 3, topY - 11, 6, 5);
            ctx.fillStyle = ELEMENT_META[normalizeElement(e.element)].color;
            ctx.fillRect(sx - 2, topY - 10, 4, 3);
          }
          if (e.disruptTime > 0) {
            const dx = Math.round(Math.sin(this.time * 18 + e.uid) * 4);
            ctx.fillStyle = "#b266ff";
            ctx.fillRect(sx + dx, topY - 8, 2, 2);
          }
          if (e.enrageBuffTime > 0) {
            ctx.fillStyle = "#ff5533";
            ctx.fillRect(sx - 6, sy - 2, 2, 2);
            ctx.fillRect(sx + 4, sy - 2, 2, 2);
          }

          // Stun orbiting yellow stars (image_3 row 1 col 5)
          if (e.stunTime > 0) {
            const ox = Math.round(Math.cos(this.time * 10) * 6);
            ctx.fillStyle = "#ffe066";
            ctx.fillRect(sx + ox - 1, topY - 13, 3, 2);
            ctx.fillRect(sx - ox - 1, topY - 11, 2, 2);
          } else if (e.vulnTime > 0) {
            // Overhead Vulnerable Sword mark (image_3 row 2 col 2)
            ctx.fillStyle = "#100c18";
            ctx.fillRect(sx - 2, topY - 16, 4, 7);
            ctx.fillStyle = "#5ef2ff";
            ctx.fillRect(sx - 1, topY - 15, 2, 5);
            ctx.fillStyle = "#ffe066";
            ctx.fillRect(sx - 2, topY - 14, 4, 1);
          }

          // Compact pixel HP + Bleach Shield bars (non-bosses) + Level danger tag
          if (!e.isBoss && (e.hp < e.maxHp || e.bleachShield > 0)) {
            ctx.fillStyle = "#100c18";
            ctx.fillRect(sx - 8, topY - 4, 16, 3);
            ctx.fillStyle = "#ff3355";
            ctx.fillRect(sx - 7, topY - 3, Math.max(1, Math.round((e.hp / e.maxHp) * 14)), 1);
            if (e.bleachShield > 0 && e.maxBleachShield > 0) {
              ctx.fillStyle = "#100c18";
              ctx.fillRect(sx - 8, topY - 7, 16, 2);
              ctx.fillStyle = "#b8d0eb";
              ctx.fillRect(
                sx - 7,
                topY - 7,
                Math.max(1, Math.round((e.bleachShield / e.maxBleachShield) * 14)),
                1
              );
            }
          }
          const lvDiff = e.level - this.player.level;
          const lvTag = `LV.${e.level}`;
          const lw = textWidth(lvTag, "mini");
          const lx = Math.round(sx - lw / 2);
          const barOff = e.element ? 18 : !e.isBoss && (e.hp < e.maxHp || e.bleachShield > 0) ? 13 : 9;
          const ly = topY - barOff;
          ctx.fillStyle = "rgba(10, 8, 18, 0.72)";
          ctx.fillRect(lx - 1, ly - 1, lw + 2, 6);
          ctx.fillStyle = lvDiff >= 5 ? "#ff4466" : lvDiff >= 2 ? "#ffaa33" : "#b8f2a6";
          rasterText(lvTag, "mini", (gx: number, gy: number) => ctx.fillRect(lx + gx, ly + gy, 1, 1));
        },
      });
    }

    // Player Hero (Layered Paper-Doll + Clone + Drone + Orbiting Grimoire + Exhausted Smoke)
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
        p.stormTime > 0 || p.attackAnimTime > 0
          ? "attack"
          : p.dashing > 0
            ? "dash"
            : p.charging && p.chargeTime > 0.12
              ? "charge"
              : isMovingNow
                ? "run"
                : "idle";
      const activeAttackKind: HeroAttackKind =
        p.stormTime > 0 ? "storm" : p.attackAnimKind;
      const activeAttackProgress =
        p.stormTime > 0
          ? (this.time * 2.2) % 1
          : Math.min(
              1,
              Math.max(0, 1 - p.attackAnimTime / Math.max(0.05, p.attackAnimDuration))
            );
      const activeAimAngle = p.attackAnimTime > 0 ? p.attackAnimAngle : p.aimAngle;
      const reqCharge = p.quickChargeTimer > 0 ? 0.26 : 0.38;
      const chargePct = p.charging ? Math.min(1, p.chargeTime / reqCharge) : 0;
      const inJustWindow =
        p.charging && p.chargeTime >= reqCharge + 0.12 && p.chargeTime <= reqCharge + 0.34;

      drawList.push({
        y: p.y,
        draw: () => {
          const frame = Math.floor(p.walkTime) % 4;

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
              attackKind: activeAttackKind,
              attackProgress: activeAttackProgress,
              aimAngle: activeAimAngle,
              shieldGuard: p.shieldTime > 0,
              bleached: heroBleached,
              time: this.time,
            });
            ctx.restore();
          }

          const wpnInst = this.inv.getValidEquippedWeapon(p.classId);
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
            ctx.save();
            if ((p.stealthTime ?? 0) > 0) {
              ctx.globalAlpha = 0.45;
            }
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
              attackKind: activeAttackKind,
              attackProgress: activeAttackProgress,
              aimAngle: activeAimAngle,
              shieldGuard: p.shieldTime > 0,
              hitFlash: p.hitFlash > 0,
              bleached: heroBleached,
              time: this.time,
              chargePct,
              aegisActive: p.aegisTime > 0 || p.shieldTime > 0 || (p.shieldHp ?? 0) > 0,
              buffActive: p.atkBuffTime > 0,
              setAuraColor: p.activeSetAuraColor,
            });
            ctx.restore();
          }

          // Exhausted grey smoke puffs around chest (image_3 row 1 col 3)
          if (p.exhausted) {
            const ox = Math.round(Math.sin(this.time * 9) * 4);
            ctx.fillStyle = "rgba(190, 198, 214, 0.78)";
            ctx.fillRect(sx - 4 + ox, sy - 9, 5, 4);
            ctx.fillRect(sx - ox, sy - 12, 4, 3);
          }

          // Orbiting Grimoire / Satellite Tome (image_8)
          if (p.hasOrbitGrimoire) {
            const gx = sx + Math.round(Math.cos(this.time * 3.4) * 13);
            const gy = sy - 11 + Math.round(Math.sin(this.time * 3.4) * 5);
            ctx.fillStyle = "#100c18";
            ctx.fillRect(gx - 3, gy - 3, 6, 5);
            ctx.fillStyle = "#a855ff";
            ctx.fillRect(gx - 2, gy - 2, 4, 3);
            ctx.fillStyle = "#ffee66";
            ctx.fillRect(gx, gy - 2, 2, 2);
          }

          // Charge indicator bar underneath hero (flashes bright white-gold during Just-Charge window!)
          if (p.charging && p.chargeTime > 0.1) {
            ctx.fillStyle = "#100c18";
            ctx.fillRect(sx - 8, sy + 3, 16, 3);
            ctx.fillStyle = inJustWindow
              ? "#ffffff"
              : chargePct >= 1
                ? "#ffe066"
                : "#4be8ff";
            ctx.fillRect(sx - 7, sy + 4, Math.round(chargePct * 14), 1);
          }

          if (p.droneTime > 0) {
            const dx = sx + Math.round(Math.cos(this.time * 5.5) * 16);
            const dy = sy - 14 + Math.round(Math.sin(this.time * 5.5) * 7);
            ctx.drawImage(sprites.summons.drone.right, dx - 6, dy - 6);
          }
        },
      });
    }

    // Remote Co-op Party Heroes (2-4 Players, Y-sorted with full 5-slot Paper-Doll + Nameplate!)
    for (const rp of this.remotePlayers.values()) {
      const rs = rp.snap;
      const sx = Math.round(rp.renderX - camX);
      const sy = Math.round(rp.renderY - camY);
      if (sx < -36 || sy < -44 || sx > VIEW_W + 36 || sy > VIEW_H + 44) continue;
      const rBleached = !this.colorSys.isWorldPosRestored(rp.renderX, rp.renderY);

      drawList.push({
        y: rp.renderY,
        draw: () => {
          const frame = Math.floor(rs.walkTime) % 4;
          ctx.fillStyle = "rgba(0,0,0,0.4)";
          ctx.fillRect(sx - 5, sy - 1, 10, 3);

          drawPaperDollHero(ctx, {
            classId: rs.classId,
            equipment: rp.cachedEquip,
            x: sx,
            y: sy,
            scale: 1,
            walkFrame: frame,
            facing: rs.facing,
            facingDir: rs.facingDir,
            animState: rs.animState,
            attackKind: rs.attackKind,
            attackProgress: rs.attackProgress,
            aimAngle: rs.aimAngle,
            shieldGuard: rs.shieldGuard,
            bleached: rBleached,
            time: this.time,
            chargePct: rs.chargePct,
            aegisActive: rs.aegisActive,
            buffActive: rs.buffActive,
          });

          // Overhead Party HP Bar + Nameplate
          const topY = sy - 24;
          ctx.fillStyle = "#100c18";
          ctx.fillRect(sx - 9, topY, 18, 3);
          ctx.fillStyle = "#44ee88";
          const hpW = Math.max(1, Math.round((Math.max(0, rs.hp) / Math.max(1, rs.maxHp)) * 16));
          ctx.fillRect(sx - 8, topY + 1, hpW, 1);

          const tag = `${rs.name.toUpperCase().slice(0, 8)} LV.${rs.level}`;
          const tw = textWidth(tag, "mini");
          const lx = Math.round(sx - tw / 2);
          const ly = topY - 7;
          ctx.fillStyle = "rgba(10, 8, 18, 0.78)";
          ctx.fillRect(lx - 1, ly - 1, tw + 2, 6);
          ctx.fillStyle = getClassDef(rs.classId).accent;
          rasterText(tag, "mini", (gx: number, gy: number) => ctx.fillRect(lx + gx, ly + gy, 1, 1));
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

    // 7. Front pixelfx Layer
    this.vfx.drawLayer(ctx, camX, camY, "front");

    // 8. Crisp World-Space Pixel Stamina Wheel
    this._drawStaminaWheel(ctx, Math.round(this.player.x - camX) + 14, Math.round(this.player.y - camY) - 10);

    // 9. Crisp Pixel Crosshair (PC) OR Smart Auto-Aim Target Lock Bracket (Mobile!)
    if (this.running && this.activeModal === null) {
      if (this.mobileMode) {
        if (this.autoAimTargetUid !== null) {
          const tgt = this.spawner.enemies.find((e) => e.uid === this.autoAimTargetUid && e.hp > 0);
          if (tgt) {
            const tx = Math.round(tgt.x - camX);
            const ty = Math.round(tgt.y - 6 - camY);
            const r = Math.max(8, Math.round(tgt.radius + 3));
            ctx.fillStyle = "#ffe066";
            ctx.fillRect(tx - r, ty - r, 3, 1);
            ctx.fillRect(tx - r, ty - r, 1, 3);
            ctx.fillRect(tx + r - 2, ty - r, 3, 1);
            ctx.fillRect(tx + r, ty - r, 1, 3);
            ctx.fillRect(tx - r, ty + r, 3, 1);
            ctx.fillRect(tx - r, ty + r - 2, 1, 3);
            ctx.fillRect(tx + r - 2, ty + r, 3, 1);
            ctx.fillRect(tx + r, ty + r - 2, 1, 3);
          }
        }
      } else {
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
      const activeTag = (document.activeElement as HTMLElement | null)?.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA") {
        if (e.code === "Escape") {
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }

      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "F1"].includes(e.code)) {
        if (this.activeModal === null || e.code === "F1") e.preventDefault();
      }

      if (e.code === "KeyH" || e.code === "F1") {
        this.toggleModal("tutorial");
        return;
      }
      if (e.code === "KeyP") {
        this.toggleModal("coop");
        return;
      }

      if (e.code === "Escape") {
        if (this.activeModal === "tutorial") {
          this.closeTutorialModal();
          return;
        }
        if (this.activeModal === "coop") {
          this.closeCoopModal();
          return;
        }
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
      if (e.code === "KeyG") {
        this.toggleModal("gacha");
        return;
      }

      if (!this.running || this.activeModal !== null) return;
      sfx.unlock();
      this.keys.add(e.code);

      if (e.code === "KeyF") {
        this.interactNearest();
      } else if (e.code === "KeyE") {
        const prevCd = this.player.skillCd;
        this.combat.performSkillE(this._makeCombatContext());
        if (this.player.skillCd > prevCd) {
          this._broadcastHeroFx("skill");
          this._advanceTutorial("skill_e");
        }
      } else if (e.code === "KeyQ") {
        const prevOd = this.player.overdrive;
        this.combat.performUltimateQ(this._makeCombatContext());
        if (this.player.overdrive < prevOd) {
          this._broadcastHeroFx("ult");
        }
      } else if (e.code === "Space") {
        let mx = 0, my = 0;
        if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) my -= 1;
        if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) my += 1;
        if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) mx -= 1;
        if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) mx += 1;
        const prevDash = this.player.dashing;
        this.combat.performDash(this._makeCombatContext(), mx, my);
        if (this.player.dashing > prevDash) {
          this._advanceTutorial("dash");
        }
      } else if (e.code === "Digit1") {
        this.useConsumableSlot(1);
      } else if (e.code === "Digit2") {
        this.useConsumableSlot(2);
      } else if (e.code === "Digit3") {
        this.useConsumableSlot(3);
      } else if (e.code === "Digit4") {
        this.useConsumableSlot(4);
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
        const prevAtkCd = this.player.atkCd;
        // Immediate crisp primary attack on click (and holding >= 0.38s releases Charged Attack!)
        this.combat.performPrimaryAttack(this._makeCombatContext());
        if (this.player.atkCd > prevAtkCd) {
          this._broadcastHeroFx("slash");
          if (this.tutorialActive && BEGINNER_PRACTICE_STEPS[this.tutorialStep]?.id === "combo3") {
            this.tutorialComboHits += 1;
            if (this.tutorialComboHits >= 3 || this.player.quickChargeTimer > 0) {
              this._advanceTutorial("combo3");
            } else {
              this.ui.onHudUpdate();
            }
          }
        }
      } else if (ev.button === 2) {
        const prevCd = this.player.skillCd;
        this.combat.performSkillE(this._makeCombatContext());
        if (this.player.skillCd > prevCd) {
          this._broadcastHeroFx("skill");
          this._advanceTutorial("skill_e");
        }
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
