import { getClassDef } from "../data/classes";
import { ENEMIES } from "../data/enemies";
import { rollBossHiddenDrops } from "../data/hiddenItems";
import { ITEMS, RARITY_INFO } from "../data/items";
import { rollEnemyDropTable } from "../data/lootTables";
import { CHROMA_RAINBOW } from "../data/worldConfig";
import {
  ELEMENT_META,
  INFUSABLE_ELEMENTS,
  PRISM_PEAK_PARTNER,
  REACTION_BY_KEY,
  makeReactionKey,
  normalizeElement,
} from "../data/elements";
import type { ActiveBossLock, CanonicalElement, ElementType, InfusableElement } from "../data/types";
import type {
  EnemyAnimKind,
  EnemyEntity,
  HazardEntity,
  PlayerEntity,
  ProjectileEntity,
  TurretEntity,
} from "../world/entities";
import type { WorldMap } from "../world/worldMap";
import { WorldSpawner, nextEntityUid } from "../world/spawner";
import type { ColorRestorationSystem } from "../graphics/colorRestoration";
import type { HeroAttackKind } from "../graphics/paperDoll";
import { sprites } from "../graphics/pixelSprites";
import type { VfxManager } from "../vfx/vfxManager";
import { PAL } from "../vfx/pixelfx/core/index.js";
import { sfx } from "../audio/chiptuneSynth";
import type { InventorySystem } from "./inventorySystem";
import type { QuestSystem } from "./questSystem";

export interface CombatContext {
  player: PlayerEntity;
  world: WorldMap;
  spawner: WorldSpawner;
  vfx: VfxManager;
  colorSys: ColorRestorationSystem;
  inv: InventorySystem;
  quests: QuestSystem;
  projectiles: ProjectileEntity[];
  turrets: TurretEntity[];
  hazards: HazardEntity[];
  addShake: (amt: number) => void;
  addHitstop: (sec: number) => void;
  notify: (msg: string, tone?: "info" | "good" | "warn" | "epic") => void;
  onGainXp: (amount: number) => void;
  defeatedBossIds?: Set<string>;
  onHiddenLootDropped?: (defId: string, x: number, y: number) => void;
  getBossLock?: () => ActiveBossLock | null;
  onBossLockTrigger?: (enemy: EnemyEntity) => void;
  onBossDefeated: (enemy: EnemyEntity) => void;
  onPlayerDefeated: () => void;
  isCoopGuest?: boolean;
  coopTargets?: ReadonlyArray<{
    id: string;
    x: number;
    y: number;
    hp: number;
    shieldGuard?: boolean;
  }>;
  onCoopClientHitEnemy?: (hit: {
    enemyUid: number;
    rawDamage: number;
    crit: boolean;
    hitPreset: string;
    element?: ElementType;
    kbX: number;
    kbY: number;
    poiseMult: number;
  }) => void;
  onCoopClientLightTotem?: (totemIdx: number, element?: ElementType) => void;
  onCoopEnemyKilled?: (kill: {
    enemyUid: number;
    defId: string;
    campId: string;
    x: number;
    y: number;
    isBoss: boolean;
    isWorldBoss: boolean;
  }) => void;
  onCoopReactionVfx?: (rx: { x: number; y: number; tag: string; color: string }) => void;
  stats: {
    kills: number;
    mined: number;
    chestsOpened: number;
    bossesDefeated: number;
    reactionsTriggered?: number;
  };
}

const MAGE_ELEMENT_CYCLE: readonly InfusableElement[] = [
  "fire",
  "ice",
  "nature",
  "volt",
  "chroma",
];

const ELEMENT_HIT_PRESET: Record<ElementType, string> = {
  fire: "hit-fire",
  ice: "hit-ice",
  poison: "hit-poison",
  nature: "hit-poison",
  volt: "zap-hit",
  prism: "crit-gold",
  void: "explode-plasma",
  chroma: "crit-gold",
  wind: "hit-cyan",
  quake: "ground-slam",
};

/**
 * PIXTEL v2.6 Real-Time 60FPS 9-Element Action Combat Engine:
 * - 9 Elements: fire, ice, nature, volt, prism, void, chroma, wind, quake
 * - 28 Pairwise Reactions + Universal Prismatic Refraction (3 homing bolts, preserves Primer aura!)
 * - 4 Classes with 3-step N1->N2->N3 combos, Dash-Offset, Chroma Dodge, Quick/Just-Charge & Just-Parry
 * - Bleach Shield poise breaking, 4 Bosses & 3-Phase The Eraser with Phase 2/3 Elemental Totems
 */
export class CombatSystem {
  private lastLevelWarnTime = 0;

  private _rollDamage(
    ctx: CombatContext,
    mult = 1,
    extraCrit = 0,
    isElemental = false,
    target?: EnemyEntity,
    isNormalOrCharge = false
  ): { dmg: number; crit: boolean; counterUsed: boolean } {
    const { player, colorSys } = ctx;
    const buffMult = player.atkBuffTime > 0 ? 1 + (player.atkBuffPct || 0.3) : 1.0;
    const counterUsed = player.chromaCounterTimer > 0;
    const counterMult = counterUsed ? 1.55 : 1.0;
    const coatingBonus = player.coatingTime > 0 ? 20 : 0;
    const bloomBonus = player.chromaBloomBonusTime > 0 ? 15 : 0;
    const restoredPrismActive =
      player.hasRestoredPrismSurge && colorSys.isWorldPosRestored(player.x, player.y);
    const prismSurgeElem = restoredPrismActive ? 22 : 0;
    const prismSurgeAtkMult = restoredPrismActive ? 1.1 : 1.0;
    const bleachPenalty = player.bleachDebuffTime > 0 && isElemental ? -25 : 0;
    const elemMult = isElemental
      ? Math.max(0.65, 1 + ((player.elementBonus || 0) + coatingBonus + bloomBonus + prismSurgeElem + bleachPenalty) / 100)
      : 1.0;

    // Null Frost (+18% Normal/Charge DMG taken)
    const nullFrostMult = isNormalOrCharge && target && target.normalAmpTime > 0 ? 1.18 : 1.0;

    // Chroma-Walker Resonance when >= 8 Waypoints are awakened against World Boss!
    const resonanceMult =
      target?.isWorldBoss && colorSys.unlockedWaypoints.size >= 8 ? 1.2 : 1.0;
    // +10 Weapon bonus vs Bosses
    const wpnLv = ctx.inv.getWeaponEnhanceLevel();
    const bossSlayerMult = target?.isBoss && wpnLv >= 10 ? 1.2 : 1.0;

    const vulnCrit =
      (target && target.vulnTime > 0 ? 15 : 0) +
      (target && target.critVulnTime > 0 ? 15 : 0);
    const critChance =
      player.crit +
      extraCrit +
      vulnCrit +
      (counterUsed ? 25 : 0) +
      (player.cloneTime > 0 ? 25 : 0) +
      (player.atkBuffTime > 0 ? (player.atkBuffCrit || 15) : 0);
    const crit = Math.random() * 100 < critChance;
    const base =
      player.atk *
      mult *
      buffMult *
      counterMult *
      elemMult *
      nullFrostMult *
      resonanceMult *
      bossSlayerMult *
      prismSurgeAtkMult *
      (0.94 + Math.random() * 0.12);

    return {
      dmg: Math.max(1, Math.round(crit ? base * player.critMult : base)),
      crit,
      counterUsed,
    };
  }

  /** Resolves bonus element from Totem Surge, Coating [4], +10 Prism Awakening, +5 8-Element Infusion, or Archetype Passives. */
  private _resolveWeaponElement(
    ctx: CombatContext,
    isHeavyOrFinisher: boolean
  ): ElementType | undefined {
    const { player, inv } = ctx;
    const wpn = inv.equipment.weapon;
    if (player.totemSurgeTimer > 0 && player.totemSurgeElement) {
      return player.totemSurgeElement;
    }
    if (wpn && wpn.enhanceLevel >= 10 && isHeavyOrFinisher) {
      return "prism";
    }
    if (player.coatingTime > 0) {
      const next = INFUSABLE_ELEMENTS[player.elementIdx % INFUSABLE_ELEMENTS.length];
      player.elementIdx = (player.elementIdx + 1) % INFUSABLE_ELEMENTS.length;
      player.coatingElement = next;
      return next;
    }
    if (player.chromaCounterTimer > 0) {
      if (wpn && wpn.enhanceLevel >= 5 && wpn.infusedElement) return wpn.infusedElement;
      return "volt";
    }
    if (isHeavyOrFinisher) {
      if (wpn && wpn.enhanceLevel >= 5 && wpn.infusedElement) return wpn.infusedElement;
      if (player.hasVoidSiphon) return "void";
      if (player.hasQuakeImpact) return "quake";
      if (player.hasChromaBlessing) return "chroma";
    }
    return undefined;
  }

  private _syncFacingFromAngle(player: PlayerEntity, ang: number) {
    const cx = Math.cos(ang);
    const sy = Math.sin(ang);
    player.facing = cx < 0 ? -1 : 1;
    if (Math.abs(cx) >= Math.abs(sy)) {
      player.facingDir = cx < 0 ? "left" : "right";
    } else {
      player.facingDir = sy < 0 ? "up" : "down";
    }
  }

  private _startAttackAnim(
    player: PlayerEntity,
    kind: HeroAttackKind,
    duration: number,
    ang: number
  ) {
    player.attackAnimKind = kind;
    player.attackAnimDuration = duration;
    player.attackAnimTime = duration;
    player.attackAnimAngle = ang;
    this._syncFacingFromAngle(player, ang);
  }

  private _toDirectionalVfx(
    ang: number,
    maxPitch = Math.PI * 0.48
  ): { flip: boolean; angle: number } {
    const cx = Math.cos(ang);
    const sy = Math.sin(ang);
    const flip = cx < 0;
    const raw = flip ? Math.atan2(-sy, -cx) : Math.atan2(sy, cx);
    const angle = Math.max(-maxPitch, Math.min(maxPitch, raw));
    return { flip, angle };
  }

  private _weaponOrigin(
    player: PlayerEntity,
    ang: number,
    reach = 12
  ): { x: number; y: number } {
    return {
      x: player.x + Math.cos(ang) * reach,
      y: player.y - 13 + Math.sin(ang) * reach * 0.72,
    };
  }

  /** Triggered on normal LMB press: 3-step combo rhythm for all 4 Classes! */
  performPrimaryAttack(ctx: CombatContext) {
    const { player, vfx } = ctx;
    if (player.atkCd > 0) return;

    const cdef = getClassDef(player.classId);
    const speedFactor = player.cloneTime > 0 ? 0.5 : 1.0;
    player.atkCd = cdef.baseStats.atkCooldown * speedFactor;

    const step = player.comboStep % 3;
    player.comboStep = (step + 1) % 3;
    player.comboTimer = 0.95;
    if (step === 2) {
      player.quickChargeTimer = 1.3; // Quick-Charge window unlocked after N3!
    }

    const isFinisher = step === 2;
    const bonusElem = this._resolveWeaponElement(ctx, isFinisher);
    const ang = player.aimAngle;

    // Unarmed Bare-Handed Punch Combo when no Weapon is equipped
    if (!ctx.inv.equipment.weapon) {
      const punchMults = [0.72, 0.85, 1.1];
      const punchKinds: HeroAttackKind[] = ["punch_1", "punch_2", "punch_3"];
      this._startAttackAnim(player, punchKinds[step], isFinisher ? 0.28 : 0.22, ang);
      const wpPos = this._weaponOrigin(player, ang, 14);
      sfx.playPunch();
      vfx.spawnPooled(isFinisher ? "crit-gold" : "hit-cyan", {
        x: wpPos.x,
        y: wpPos.y,
        scale: isFinisher ? 0.88 : 0.75,
      });
      for (let i = 0; i < 4; i++) {
        const sp = 42 + i * 16;
        vfx.spawnPixelDot(
          wpPos.x,
          wpPos.y,
          Math.cos(ang) * sp + (Math.random() - 0.5) * 18,
          Math.sin(ang) * sp + (Math.random() - 0.5) * 18,
          isFinisher ? "#ffe066" : "#62c8f4",
          0.16,
          2
        );
      }
      this._meleeArcHit(
        ctx,
        player.x,
        player.y,
        ang,
        30,
        1.25,
        punchMults[step],
        "hit-cyan",
        bonusElem,
        isFinisher ? 1.25 : 0.8,
        isFinisher
      );
      player.chromaCounterTimer = 0;
      return;
    }

    if (player.classId === "prism_knight") {
      const mults = [1.0, 1.18, 1.6];
      const radii = [40, 44, 54];
      const modIds = ["melee/sword-slash", "melee/double-slash", "melee/heavy-cleave"];
      const kinds: HeroAttackKind[] = ["slash_1", "slash_2", "cleave"];
      const durations = [0.28, 0.32, 0.38];
      const pals = [PAL.cyber, PAL.water, PAL.volt];
      const knightElem: ElementType | undefined = isFinisher ? (bonusElem ?? "quake") : bonusElem;

      this._startAttackAnim(player, kinds[step], durations[step], ang);
      const dir = this._toDirectionalVfx(ang, isFinisher ? 0.32 : 0.72);
      const offX = Math.cos(ang) * (isFinisher ? 4 : 5);
      const offY = isFinisher ? 0 : -13 + Math.sin(ang) * 4;

      vfx.spawnLive(modIds[step], {
        x: player.x + offX,
        y: player.y + offY,
        follow: player,
        offsetX: offX,
        offsetY: offY,
        angle: dir.angle,
        flip: dir.flip,
        startTime: isFinisher ? 0.17 : 0,
        durationScale: 1.45,
        maxLife: isFinisher ? 0.52 : step === 1 ? 0.42 : 0.36,
        options: { palette: pals[step], radius: radii[step] },
        priority: 3,
      });
      sfx.playSlash(step);
      this._meleeArcHit(
        ctx,
        player.x,
        player.y,
        ang,
        radii[step],
        1.45,
        mults[step],
        knightElem ? ELEMENT_HIT_PRESET[knightElem] : "hit-cyan",
        knightElem,
        isFinisher ? 1.65 : 1.0,
        isFinisher
      );
      if (isFinisher) ctx.addShake(2.2);
      player.chromaCounterTimer = 0;
      return;
    }

    if (player.classId === "chroma_mage") {
      const castKinds: HeroAttackKind[] = ["cast_1", "cast_2", "cast_3"];
      this._startAttackAnim(player, castKinds[step], isFinisher ? 0.30 : 0.24, ang);
      const wpPos = this._weaponOrigin(player, ang, 14);
      const elem: ElementType =
        ctx.inv.getWeaponEnhanceLevel() >= 10 && isFinisher
          ? "prism"
          : bonusElem ?? MAGE_ELEMENT_CYCLE[player.elementIdx % MAGE_ELEMENT_CYCLE.length];
      player.elementIdx = (player.elementIdx + 1) % MAGE_ELEMENT_CYCLE.length;
      const preset =
        elem === "fire" || elem === "quake"
          ? "proj-fireball"
          : elem === "ice" || elem === "wind"
            ? "proj-icelance"
            : elem === "volt" || elem === "prism" || elem === "chroma"
              ? "proj-amber"
              : elem === "void"
                ? "proj-void"
                : "proj-poison";
      const { dmg, crit } = this._rollDamage(ctx, isFinisher ? 1.32 : 1.05, 0, true, undefined, true);
      sfx.playMagic(step);
      vfx.spawnPooled(ELEMENT_HIT_PRESET[elem], {
        x: wpPos.x,
        y: wpPos.y,
        scale: 0.58,
      });
      this._spawnPlayerProj(ctx, {
        x: wpPos.x,
        y: wpPos.y,
        angle: ang,
        speed: isFinisher ? 245 : 220,
        radius: isFinisher ? 7 : 6,
        damage: dmg,
        crit,
        pierce: isFinisher ? 1 : 0,
        maxLife: 1.05,
        preset,
        element: elem,
        hitPreset: ELEMENT_HIT_PRESET[elem],
        poiseMult: isFinisher ? 1.4 : 1.0,
      });
      player.chromaCounterTimer = 0;
      return;
    }

    if (player.classId === "bit_rogue") {
      sfx.playSlash(step);
      const rogueElem: ElementType | undefined = isFinisher ? (bonusElem ?? "wind") : bonusElem;
      if (isFinisher) {
        this._startAttackAnim(player, "spin", 0.30, ang);
        vfx.spawnLive("melee/spin-slash", {
          x: player.x,
          y: player.y - 11,
          follow: player,
          offsetX: 0,
          offsetY: -11,
          angle: 0,
          flip: Math.cos(ang) < 0,
          durationScale: 1.45,
          maxLife: 0.42,
          options: { palette: PAL.neon },
          priority: 2,
        });
      } else {
        this._startAttackAnim(player, step === 0 ? "flurry_1" : "flurry_2", 0.22, ang);
        const dir = this._toDirectionalVfx(ang, 0.72);
        const offX = Math.cos(ang) * 5;
        const offY = -13 + Math.sin(ang) * 4;
        vfx.spawnLive("melee/dagger-flurry", {
          x: player.x + offX,
          y: player.y + offY,
          follow: player,
          offsetX: offX,
          offsetY: offY,
          angle: dir.angle,
          flip: dir.flip,
          startTime: step === 1 ? 0.11 : 0,
          durationScale: 1.9,
          maxLife: 0.26,
          options: { palette: PAL.neon },
          priority: 2,
        });
      }
      this._meleeArcHit(
        ctx,
        player.x,
        player.y,
        ang,
        isFinisher ? 44 : 36,
        isFinisher ? Math.PI : 1.45,
        isFinisher ? 1.52 : step === 1 ? 1.12 : 1.0,
        rogueElem ? ELEMENT_HIT_PRESET[rogueElem] : "hit-gold",
        rogueElem,
        isFinisher ? 1.35 : 1.0,
        isFinisher
      );

      if (player.cloneTime > 0) {
        const echoPos = this._weaponOrigin(player, ang, 16);
        vfx.spawnPooled("hit-gold", { x: echoPos.x, y: echoPos.y, scale: 0.72 });
        this._meleeArcHit(
          ctx,
          player.x,
          player.y,
          ang,
          isFinisher ? 46 : 38,
          isFinisher ? Math.PI : 1.45,
          0.55,
          "hit-gold",
          rogueElem,
          0.75,
          false
        );
      }
      player.chromaCounterTimer = 0;
      return;
    }

    if (player.classId === "pixel_tinker") {
      this._startAttackAnim(player, isFinisher ? "shoot_heavy" : "shoot", isFinisher ? 0.26 : 0.20, ang);
      const wpPos = this._weaponOrigin(player, ang, 14);
      sfx.playShoot(isFinisher ? 880 : 720);
      vfx.spawnPooled("muzzle-pistol", {
        x: wpPos.x,
        y: wpPos.y,
        angle: ang,
      });
      const tinkerElem: ElementType | undefined = isFinisher ? (bonusElem ?? "volt") : bonusElem;
      const { dmg, crit } = this._rollDamage(ctx, isFinisher ? 1.25 : 0.95, 0, !!tinkerElem, undefined, true);
      this._spawnPlayerProj(ctx, {
        x: wpPos.x,
        y: wpPos.y,
        angle: ang,
        speed: isFinisher ? 295 : 270,
        radius: isFinisher ? 6 : 5,
        damage: dmg,
        crit,
        pierce: isFinisher ? 1 : 0,
        maxLife: 0.9,
        preset: "proj-laser",
        element: tinkerElem,
        hitPreset: "zap-hit",
        canOverclockTurret: true,
        poiseMult: isFinisher ? 1.35 : 1.0,
      });
      player.chromaCounterTimer = 0;
    }
  }

  /**
   * Triggered when player holds LMB >= threshold and releases.
   * Supports `justCharge` (perfect release window -> bonus DMG, Stamina refund & heavy Poise Break!)
   * and `tectonicChargeBonus` (+35% DMG after Tectonic Shatter!).
   */
  performChargedAttack(ctx: CombatContext, justCharge = false) {
    const { player, vfx } = ctx;
    const costFactor = Math.max(0.55, 1 + (player.staminaCostPct || 0) / 100);
    const stamCost = Math.max(10, Math.round(22 * costFactor));

    if (player.stamina < stamCost - 4) {
      this.performPrimaryAttack(ctx);
      return;
    }

    const netCost = justCharge ? Math.max(4, stamCost - 6) : stamCost;
    player.stamina = Math.max(0, player.stamina - netCost);
    player.staminaRegenDelay = 0.7;
    player.atkCd = 0.4;
    player.quickChargeTimer = 0;

    const tectonicMult = player.tectonicChargeBonus ? 1.35 : 1.0;
    player.tectonicChargeBonus = false;

    const justMult = (justCharge ? 1.26 : 1.0) * tectonicMult;
    const poiseMult = justCharge ? 2.5 : 1.85;
    const bonusElem = this._resolveWeaponElement(ctx, true);

    const ang = player.aimAngle;
    this._syncFacingFromAngle(player, ang);
    sfx.playChargeRelease();
    ctx.addShake(justCharge ? 4.4 : 3.2);
    if (justCharge) {
      ctx.addHitstop(0.055);
      vfx.spawnDamageText(player.x, player.y - 18, "JUST CHARGE!", {
        crit: true,
        color: "#ffe066",
      });
    }

    // Unarmed Bare-Handed Charged Uppercut when no Weapon is equipped
    if (!ctx.inv.equipment.weapon) {
      this._startAttackAnim(player, "uppercut", 0.34, ang);
      const wpPos = this._weaponOrigin(player, ang, 14);
      sfx.playPunch();
      vfx.spawnPooled("crit-gold", {
        x: wpPos.x,
        y: wpPos.y,
        scale: 0.95,
      });
      for (let i = 0; i < 6; i++) {
        vfx.spawnPixelDot(
          wpPos.x + (Math.random() - 0.5) * 6,
          wpPos.y,
          Math.cos(ang) * (25 + Math.random() * 25),
          -55 - Math.random() * 35,
          "#ffe066",
          0.26,
          2
        );
      }
      this._meleeArcHit(
        ctx,
        player.x,
        player.y,
        ang,
        36,
        1.45,
        1.55 * justMult,
        "hit-cyan",
        bonusElem,
        poiseMult,
        true
      );
      player.chromaCounterTimer = 0;
      return;
    }

    if (player.classId === "prism_knight") {
      const thrustElem: ElementType = bonusElem ?? "prism";
      this._startAttackAnim(player, "thrust", 0.34, ang);
      player.dashing = 0.18;
      player.invuln = Math.max(player.invuln, 0.26);
      player.dashVx = Math.cos(ang) * 325;
      player.dashVy = Math.sin(ang) * 325;
      const dir = this._toDirectionalVfx(ang, 0.92);
      const offX = Math.cos(ang) * 8;
      const offY = -13 + Math.sin(ang) * 5;
      vfx.spawnLive("melee/thrust", {
        x: player.x + offX,
        y: player.y + offY,
        follow: player,
        offsetX: offX,
        offsetY: offY,
        angle: dir.angle,
        flip: dir.flip,
        durationScale: 1.35,
        maxLife: 0.42,
        options: { palette: justCharge ? PAL.volt : PAL.cyber },
        priority: 4,
      });
      this._linePierceHit(
        ctx,
        player.x,
        player.y,
        ang,
        82,
        19,
        2.25 * justMult,
        ELEMENT_HIT_PRESET[thrustElem],
        thrustElem,
        poiseMult
      );
      player.chromaCounterTimer = 0;
      return;
    }

    if (player.classId === "chroma_mage") {
      this._startAttackAnim(player, "cast_heavy", 0.32, ang);
      const wpPos = this._weaponOrigin(player, ang, 14);
      vfx.spawnPooled("crit-gold", { x: wpPos.x, y: wpPos.y, scale: 0.72 });
      // Tri/Quad-Elemental Volley (fire + ice + wind + prism) -> instant multi-reactions!
      const count = justCharge ? 4 : 3;
      const spread = 0.2;
      const volleyElems: ElementType[] = ["fire", "ice", "wind", "prism"];
      const presets = ["proj-fireball", "proj-icelance", "proj-icelance", "proj-amber"];
      for (let i = 0; i < count; i++) {
        const off = (i - (count - 1) / 2) * spread;
        const elem: ElementType =
          ctx.inv.getWeaponEnhanceLevel() >= 10 && i === 1 ? "prism" : volleyElems[i % volleyElems.length];
        const { dmg, crit } = this._rollDamage(ctx, 1.15 * justMult, justCharge ? 12 : 0, true, undefined, true);
        this._spawnPlayerProj(ctx, {
          x: wpPos.x,
          y: wpPos.y,
          angle: ang + off,
          speed: 240,
          radius: 6,
          damage: dmg,
          crit,
          pierce: 1,
          maxLife: 1.05,
          preset: presets[i % presets.length],
          element: elem,
          hitPreset: ELEMENT_HIT_PRESET[elem],
          poiseMult: 1.5,
        });
      }
      player.chromaCounterTimer = 0;
      return;
    }

    if (player.classId === "bit_rogue") {
      const fanElem: ElementType = bonusElem ?? "wind";
      this._startAttackAnim(player, "spin", 0.28, ang);
      const dir = this._toDirectionalVfx(ang, 0.72);
      const offX = Math.cos(ang) * 5;
      const offY = -13 + Math.sin(ang) * 4;
      vfx.spawnLive("melee/double-slash", {
        x: player.x + offX,
        y: player.y + offY,
        follow: player,
        offsetX: offX,
        offsetY: offY,
        angle: dir.angle,
        flip: dir.flip,
        durationScale: 1.8,
        maxLife: 0.32,
        options: { palette: PAL.neon },
        priority: 3,
      });
      const wpPos = this._weaponOrigin(player, ang, 11);
      for (let i = -2; i <= 2; i++) {
        const { dmg, crit } = this._rollDamage(ctx, 0.96 * justMult, 18, true, undefined, true);
        this._spawnPlayerProj(ctx, {
          x: wpPos.x,
          y: wpPos.y,
          angle: ang + i * 0.15,
          speed: 305,
          radius: 5,
          damage: dmg,
          crit,
          pierce: 1,
          maxLife: 0.74,
          preset: "proj-shuriken",
          element: fanElem,
          hitPreset: "crit-gold",
          poiseMult: 1.4,
        });
      }
      if (player.cloneTime > 0) {
        for (const off of [-0.08, 0.08]) {
          const echo = this._rollDamage(ctx, 0.62 * justMult, 12, true, undefined, true);
          this._spawnPlayerProj(ctx, {
            x: wpPos.x,
            y: wpPos.y,
            angle: ang + off,
            speed: 315,
            radius: 5,
            damage: echo.dmg,
            crit: echo.crit,
            pierce: 1,
            maxLife: 0.74,
            preset: "proj-shuriken",
            element: fanElem,
            hitPreset: "hit-gold",
            poiseMult: 1.1,
          });
        }
      }
      player.chromaCounterTimer = 0;
      return;
    }

    if (player.classId === "pixel_tinker") {
      const railElem: ElementType = bonusElem ?? "quake";
      this._startAttackAnim(player, "beam", 0.36, ang);
      const wpPos = this._weaponOrigin(player, ang, 13);
      const offX = wpPos.x - player.x;
      const offY = wpPos.y - player.y;
      vfx.spawnLive("pixtel/prism-beam", {
        x: wpPos.x,
        y: wpPos.y,
        follow: player,
        offsetX: offX,
        offsetY: offY,
        angle: ang,
        startTime: 0.05,
        maxLife: 0.65,
        options: { length: 158, palette: justCharge ? PAL.volt : PAL.cyber },
        priority: 4,
      });
      this._linePierceHit(
        ctx,
        player.x,
        player.y,
        ang,
        162,
        17,
        2.25 * justMult,
        ELEMENT_HIT_PRESET[railElem],
        railElem,
        poiseMult
      );
      for (const t of ctx.turrets) {
        t.overclockTime = 5.5;
        t.hp = t.maxHp;
      }
      player.chromaCounterTimer = 0;
    }
  }

  /** Class active skill [E] (Unlocked by equipping a Weapon) */
  performSkillE(ctx: CombatContext) {
    const { player, vfx } = ctx;
    if (!ctx.inv.equipment.weapon) {
      sfx.playForgeFail();
      ctx.notify("🔒 Cần trang bị Vũ Khí để mở khóa kỹ năng [E]!", "warn");
      return;
    }
    if (player.skillCd > 0) return;

    const cdef = getClassDef(player.classId);
    const cdMult = Math.max(0.55, 1 + (player.skillCdPct || 0) / 100);
    player.skillCd = cdef.baseStats.skillCooldown * cdMult;
    player.quickChargeTimer = 1.3; // Link E -> Quick Charge!
    const ang = player.aimAngle;
    const bonusElem = this._resolveWeaponElement(ctx, true);

    if (player.classId === "prism_knight") {
      player.shieldTime = 1.05;
      this._startAttackAnim(player, "beam", 0.34, ang);
      sfx.playBlock();
      vfx.spawnLive("impacts/shield-block", {
        x: player.x,
        y: player.y,
        follow: player,
        offsetX: 0,
        offsetY: 0,
        flip: Math.cos(ang) < 0,
        angle: 0,
        options: { palette: PAL.cyber },
        priority: 4,
        maxLife: 1.05,
      });
      this.firePrismBeam(ctx, ang, 1.85, bonusElem ?? "prism");
      return;
    }

    if (player.classId === "chroma_mage") {
      this._startAttackAnim(player, "cast_heavy", 0.34, ang);
      const wpPos = this._weaponOrigin(player, ang, 14);
      vfx.spawnPooled("crit-gold", { x: wpPos.x, y: wpPos.y, scale: 0.72 });
      const tx = player.x + Math.cos(ang) * 64;
      const ty = player.y + Math.sin(ang) * 64;
      sfx.playMagic(1);
      vfx.spawnLive("pixtel/chroma-vortex", {
        x: tx,
        y: ty,
        options: { radius: 44 },
        priority: 4,
        maxLife: 3.1,
      });
      ctx.hazards.push({
        uid: nextEntityUid(),
        owner: "player",
        kind: "vortex",
        x: tx,
        y: ty,
        radius: 56,
        delay: 0,
        age: 0,
        maxLife: 3.1,
        tickTimer: 0,
        damage: Math.round(player.atk * 0.58),
        triggered: true,
      });
      return;
    }

    if (player.classId === "bit_rogue") {
      const ox = player.x;
      const oy = player.y;
      this._syncFacingFromAngle(player, ang);
      sfx.playDash();
      vfx.spawnLive("pixtel/frame-skip", {
        x: ox,
        y: oy,
        options: { actor: sprites.getHero("bit_rogue", 0).actor },
        priority: 4,
        maxLife: 1.25,
      });
      ctx.hazards.push({
        uid: nextEntityUid(),
        owner: "player",
        kind: "afterimage",
        x: ox,
        y: oy,
        radius: 46,
        delay: 0.75,
        age: 0,
        maxLife: 1.0,
        tickTimer: 0,
        damage: Math.round(player.atk * 2.5),
        triggered: false,
      });

      player.dashing = 0.2;
      player.invuln = Math.max(player.invuln, 0.36);
      player.perfectDashWindow = 0.14;
      player.dashVx = Math.cos(ang) * 340;
      player.dashVy = Math.sin(ang) * 340;
      return;
    }

    if (player.classId === "pixel_tinker") {
      this._startAttackAnim(player, "cast_1", 0.28, ang);
      const tx = player.x + Math.cos(ang) * 26;
      const ty = player.y + Math.sin(ang) * 26;
      const safeX = ctx.world.isBlocked(tx, ty, 6) ? player.x : tx;
      const safeY = ctx.world.isBlocked(tx, ty, 6) ? player.y : ty;
      if (ctx.turrets.length >= 2) {
        ctx.turrets.shift();
      }
      ctx.turrets.push({
        uid: nextEntityUid(),
        x: safeX,
        y: safeY,
        hp: 75 + player.level * 9,
        maxHp: 75 + player.level * 9,
        life: 0,
        maxLife: 18,
        fireCd: 0.42,
        overclockTime: 0,
        angle: ang,
        hitFlash: 0,
      });
      sfx.playBlock();
      vfx.spawnLive("pixtel/compile-turret", {
        x: safeX,
        y: safeY,
        priority: 4,
        maxLife: 1.1,
      });
    }
  }

  /** Class Ultimate [Q] (Unlocked by equipping an Accessory + 100% Overdrive) */
  performUltimateQ(ctx: CombatContext) {
    const { player, vfx, colorSys } = ctx;
    if (!ctx.inv.equipment.accessory) {
      sfx.playForgeFail();
      ctx.notify("🔒 Cần trang bị Phụ Kiện để mở khóa Tuyệt Kỹ [Q]!", "warn");
      return;
    }
    if (player.overdrive < 100) {
      ctx.notify(`Chưa đủ năng lượng Tuyệt Kỹ (${Math.floor(player.overdrive)}/100)!`, "warn");
      return;
    }
    player.overdrive = 0;
    player.bleachDebuffTime = 0;
    sfx.playOverdrive();
    ctx.addShake(5);

    // Every Ultimate [Q] unleashes a local Chroma Restoration burst!
    colorSys.triggerWave(player.x, player.y, 110, 240);

    vfx.spawnLive("pixtel/overdrive-aura", {
      x: player.x,
      y: player.y,
      follow: player,
      priority: 5,
      maxLife: 1.2,
    });

    if (player.classId === "prism_knight") {
      player.stormTime = 2.8;
      player.stormTick = 0;
      player.invuln = Math.max(player.invuln, 0.75);
      vfx.spawnLive("pixtel/prism-storm", {
        x: player.x,
        y: player.y - 11,
        follow: player,
        offsetX: 0,
        offsetY: -11,
        priority: 5,
        maxLife: 1.05,
      });
      ctx.notify("BÃO KIẾM ÁNH SÁNG!", "epic");
      return;
    }

    if (player.classId === "chroma_mage") {
      this._startAttackAnim(player, "cast_ult", 0.46, player.aimAngle);
      const baseAngle = player.aimAngle;
      for (let i = 0; i < 6; i++) {
        const spreadA = baseAngle + (i - 2.5) * 0.42;
        const dist = 36 + (i % 3) * 28;
        const mx = player.x + Math.cos(spreadA) * dist;
        const my = player.y + Math.sin(spreadA) * dist;
        const delay = 0.32 + i * 0.15;

        vfx.spawnLive("pixtel/boss-telegraph", {
          x: mx,
          y: my,
          options: { radius: 28, shape: "circle", palette: PAL.candy },
          priority: 4,
          maxLife: delay + 0.1,
        });
        ctx.hazards.push({
          uid: nextEntityUid(),
          owner: "player",
          kind: "meteor",
          x: mx,
          y: my,
          radius: 38,
          delay,
          age: 0,
          maxLife: delay + 0.3,
          tickTimer: 0,
          damage: Math.round(player.atk * 2.55),
          triggered: false,
        });
      }
      ctx.notify("MƯA THIÊN THẠCH CẦU VỒNG!", "epic");
      return;
    }

    if (player.classId === "bit_rogue") {
      this._startAttackAnim(player, "cast_ult", 0.32, player.aimAngle);
      player.cloneTime = 6.5;
      vfx.spawnLive("status/haste", {
        x: player.x,
        y: player.y,
        follow: player,
        options: { palette: PAL.cyber },
        priority: 4,
        maxLife: 1.4,
      });
      ctx.notify("PHÂN THÂN ẢO ẢNH! (+100% Tốc Đánh & +25% Crit)", "epic");
      return;
    }

    if (player.classId === "pixel_tinker") {
      this._startAttackAnim(player, "cast_ult", 0.38, player.aimAngle);
      player.droneTime = 7.0;
      player.droneTick = 0;
      vfx.spawnPooled("heal-aoe", { x: player.x, y: player.y });
      ctx.notify("DRONE QUÁ TẢI! (Xả Laser & Hồi HP)", "epic");
    }
  }

  /** Dash [Space] with Stamina cost, i-frames, Combo-Offset & Chroma Dodge window */
  performDash(ctx: CombatContext, moveX: number, moveY: number) {
    const { player, vfx } = ctx;
    const costFactor = Math.max(0.55, 1 + (player.staminaCostPct || 0) / 100);
    const stamCost = Math.max(12, Math.round(24 * costFactor));

    if (player.dashCd > 0 || player.stamina < stamCost || player.exhausted) return;
    const cdef = getClassDef(player.classId);
    player.dashCd = cdef.baseStats.dashCooldown;
    player.stamina = Math.max(0, player.stamina - stamCost);
    player.staminaRegenDelay = 0.6;
    if (player.stamina <= 0) player.exhausted = true;

    // Dash-Offset: preserve current combo chain across a tactical dodge!
    if (player.comboTimer > 0) {
      player.dashComboPreserveTimer = 0.55;
      player.comboTimer = Math.max(player.comboTimer, 0.8);
    }

    const ang = moveX !== 0 || moveY !== 0 ? Math.atan2(moveY, moveX) : player.aimAngle;
    player.dashing = 0.16;
    player.invuln = Math.max(player.invuln, 0.28);
    player.perfectDashWindow = 0.14; // First ~8.5 frames = Chroma Dodge window!
    player.dashVx = Math.cos(ang) * 295;
    player.dashVy = Math.sin(ang) * 295;
    sfx.playDash();

    vfx.spawnPooled("death-poof", { x: player.x, y: player.y, layer: "back", scale: 0.7 });
    for (let i = 0; i < 6; i++) {
      vfx.spawnPixelDot(
        player.x + (Math.random() - 0.5) * 8,
        player.y + (Math.random() - 0.5) * 8,
        -Math.cos(ang) * (30 + Math.random() * 40),
        -Math.sin(ang) * (30 + Math.random() * 40),
        CHROMA_RAINBOW[i % CHROMA_RAINBOW.length],
        0.24,
        2
      );
    }

    // Wind Dancer passive (Lông Vũ Phong Lưu): Dash unleashes a 44px Wind gust spreading elements!
    if (player.hasWindDancer) {
      vfx.spawnPooled("hit-cyan", { x: player.x, y: player.y - 4 });
      for (const e of [...ctx.spawner.enemies]) {
        if (Math.hypot(e.x - player.x, e.y - player.y) <= 46 + e.radius) {
          this.damageEnemy(ctx, e, Math.max(4, Math.round(player.atk * 0.45)), false, "hit-cyan", "wind", 0, 0, 0.8);
        }
      }
    }
  }

  /** Grants Stamina refund, Overdrive, E cooldown cut, and empowered Chroma Counter on Perfect Dash! */
  triggerChromaDodge(ctx: CombatContext) {
    const { player, vfx } = ctx;
    if (player.perfectDashWindow <= 0) return;
    player.perfectDashWindow = 0;
    player.invuln = Math.max(player.invuln, 0.42);
    player.stamina = Math.min(player.maxStamina, player.stamina + 18);
    player.exhausted = false;
    player.overdrive = Math.min(100, player.overdrive + 12);
    player.skillCd = Math.max(0, player.skillCd - 1.5);
    player.chromaCounterTimer = 2.2;
    player.bleachDebuffTime = 0;

    sfx.playBlock();
    ctx.addHitstop(0.045);
    ctx.addShake(2.2);
    vfx.spawnPooled("crit-gold", { x: player.x, y: player.y - 6 });
    vfx.spawnDamageText(player.x, player.y - 16, "CHROMA DODGE!", {
      crit: true,
      color: "#ffe066",
    });
  }

  firePrismBeam(ctx: CombatContext, angle: number, mult = 2.0, elem?: ElementType) {
    const { player, vfx } = ctx;
    sfx.playLaser();
    ctx.addShake(3.6);
    const wpPos = this._weaponOrigin(player, angle, 12);
    vfx.spawnLive("pixtel/prism-beam", {
      x: wpPos.x,
      y: wpPos.y,
      follow: player,
      offsetX: wpPos.x - player.x,
      offsetY: wpPos.y - player.y,
      angle,
      startTime: 0.04,
      options: { length: 165, palette: PAL.cyber },
      priority: 5,
    });
    this._linePierceHit(ctx, player.x, player.y, angle, 168, 20, mult, "hit-cyan", elem, 2.0);
  }

  private _spawnPlayerProj(
    ctx: CombatContext,
    p: {
      x: number;
      y: number;
      angle: number;
      speed: number;
      radius: number;
      damage: number;
      crit: boolean;
      pierce: number;
      maxLife: number;
      preset: string;
      element?: ElementType;
      hitPreset?: string;
      canOverclockTurret?: boolean;
      poiseMult?: number;
      homing?: boolean;
      ignoreUid?: number;
    }
  ) {
    const hitSet = new Set<number>();
    if (p.ignoreUid !== undefined) hitSet.add(p.ignoreUid);
    ctx.projectiles.push({
      uid: nextEntityUid(),
      owner: "player",
      x: p.x,
      y: p.y,
      vx: Math.cos(p.angle) * p.speed,
      vy: Math.sin(p.angle) * p.speed,
      angle: p.angle,
      radius: p.radius,
      damage: p.damage,
      crit: p.crit,
      pierce: p.pierce,
      life: 0,
      maxLife: p.maxLife,
      preset: p.preset,
      element: p.element,
      hitSet,
      homing: p.homing,
      canOverclockTurret: p.canOverclockTurret,
      hitPreset: p.hitPreset,
      poiseMult: p.poiseMult,
    });
  }

  private _meleeArcHit(
    ctx: CombatContext,
    ox: number,
    oy: number,
    aimAngle: number,
    range: number,
    halfConeRad: number,
    mult: number,
    hitPreset: string,
    element?: ElementType,
    poiseMult = 1.0,
    isFinisher = false
  ) {
    const { spawner, player } = ctx;
    let hitAny = false;
    for (let i = spawner.enemies.length - 1; i >= 0; i--) {
      const e = spawner.enemies[i];
      const dx = e.x - ox;
      const dy = e.y - oy;
      const d = Math.hypot(dx, dy);
      if (d > range + e.radius) continue;
      let diff = Math.atan2(dy, dx) - aimAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) <= halfConeRad || d < 16) {
        const behind = player.classId === "bit_rogue" && dx * e.facing > 0;
        const { dmg, crit } = this._rollDamage(
          ctx,
          mult * (behind ? 1.25 : 1.0),
          behind ? 15 : 0,
          !!element,
          e,
          true
        );
        this.damageEnemy(
          ctx,
          e,
          dmg,
          crit,
          hitPreset,
          element,
          dx / (d || 1),
          dy / (d || 1),
          poiseMult
        );
        hitAny = true;
      }
    }

    if (hitAny) {
      player.stamina = Math.min(player.maxStamina, player.stamina + (isFinisher ? 6 : 3));
    }

    // Light Arena Chroma Totems (The Eraser Boss Phase 2/3)
    this._checkHitArenaTotems(ctx, ox, oy, range + 10, element);

    // Mine Ore & Crystal nodes
    for (const res of spawner.resources) {
      if (!res.alive) continue;
      const d = Math.hypot(res.x - ox, res.y - oy);
      if (d <= range + 10) {
        this.damageResource(ctx, res, Math.round(player.atk * mult));
      }
    }
  }

  private _linePierceHit(
    ctx: CombatContext,
    ox: number,
    oy: number,
    angle: number,
    length: number,
    halfWidth: number,
    mult: number,
    hitPreset: string,
    element?: ElementType,
    poiseMult = 1.8
  ) {
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    for (let i = ctx.spawner.enemies.length - 1; i >= 0; i--) {
      const e = ctx.spawner.enemies[i];
      const rx = e.x - ox;
      const ry = e.y - oy;
      const along = rx * dirX + ry * dirY;
      if (along < -8 || along > length + e.radius) continue;
      const perp = Math.abs(rx * -dirY + ry * dirX);
      if (perp <= halfWidth + e.radius) {
        const { dmg, crit } = this._rollDamage(ctx, mult, 10, !!element, e, true);
        this.damageEnemy(ctx, e, dmg, crit, hitPreset, element, dirX, dirY, poiseMult);
      }
    }

    for (const totem of ctx.spawner.arenaTotems) {
      if (totem.lit) continue;
      const rx = totem.x - ox;
      const ry = totem.y - oy;
      const along = rx * dirX + ry * dirY;
      const perp = Math.abs(rx * -dirY + ry * dirX);
      if (along >= -6 && along <= length + 10 && perp <= halfWidth + 12) {
        this._lightArenaTotem(ctx, totem, element);
      }
    }

    for (const res of ctx.spawner.resources) {
      if (!res.alive) continue;
      const rx = res.x - ox;
      const ry = res.y - oy;
      const along = rx * dirX + ry * dirY;
      if (along < 0 || along > length) continue;
      const perp = Math.abs(rx * -dirY + ry * dirX);
      if (perp <= halfWidth + 10) {
        this.damageResource(ctx, res, Math.round(ctx.player.atk * mult));
      }
    }
  }

  private _checkHitArenaTotems(
    ctx: CombatContext,
    x: number,
    y: number,
    radius: number,
    element?: ElementType
  ) {
    for (const totem of ctx.spawner.arenaTotems) {
      if (totem.lit) continue;
      if (Math.hypot(totem.x - x, totem.y - y) <= radius) {
        this._lightArenaTotem(ctx, totem, element);
      }
    }
  }

  /**
   * 9-Element Arena Totem Resonance:
   * - Lighting a Totem imbues the player with that Totem's element (`totemSurgeElement` for 6s) & refunds +12 Stamina.
   * - Lighting >= 2 Totems triggers converging Prism Break on The Eraser!
   * - If lit using a reacting element (or Phase 3 Primordial Totems), triggers SUPER CONVERGENCE:
   *   12% Max HP True Damage, 5.5s Stagger, and spawns a `chroma_bloom` Sanctuary Field!
   */
  lightArenaTotemByIndex(ctx: CombatContext, totemIdx: number, hitElem?: ElementType) {
    const t = ctx.spawner.arenaTotems[totemIdx];
    if (t && !t.lit) {
      this._lightArenaTotem(ctx, t, hitElem);
    }
  }

  private _lightArenaTotem(
    ctx: CombatContext,
    totem: { element: InfusableElement; x: number; y: number; lit: boolean; hitFlash: number },
    hitElem?: ElementType
  ) {
    if (totem.lit) return;
    if (ctx.isCoopGuest) {
      const idx = ctx.spawner.arenaTotems.indexOf(totem as never);
      totem.hitFlash = 0.25;
      sfx.playWaypoint();
      ctx.vfx.spawnPooled("collect-burst", { x: totem.x, y: totem.y - 6 });
      ctx.player.totemSurgeElement = totem.element;
      ctx.player.totemSurgeTimer = 6.0;
      if (idx >= 0) ctx.onCoopClientLightTotem?.(idx, hitElem);
      return;
    }
    totem.lit = true;
    totem.hitFlash = 0.25;
    const meta = ELEMENT_META[totem.element];
    const reactedOnStrike =
      hitElem !== undefined && normalizeElement(hitElem) !== totem.element;

    ctx.player.totemSurgeElement = totem.element;
    ctx.player.totemSurgeTimer = 6.0;
    ctx.player.stamina = Math.min(ctx.player.maxStamina, ctx.player.stamina + 12);

    sfx.playWaypoint();
    ctx.vfx.spawnPooled("collect-burst", { x: totem.x, y: totem.y - 6 });
    ctx.colorSys.triggerWave(totem.x, totem.y, 76, 220);
    ctx.vfx.spawnDamageText(
      totem.x,
      totem.y - 16,
      `TRỤ ${meta.shortLabel} THỨC TỈNH!`,
      {
        crit: true,
        color: meta.color,
      }
    );

    const litTotems = ctx.spawner.arenaTotems.filter((t) => t.lit);
    if (litTotems.length >= 2) {
      const eraser = ctx.spawner.enemies.find((e) => e.defId === "boss_the_eraser");
      if (eraser) {
        const tA = litTotems[0].element;
        const tB = litTotems[1].element;
        const pairSpec = REACTION_BY_KEY.get(makeReactionKey(tA, tB));
        const isSuperResonance = reactedOnStrike || eraser.phase >= 3;

        for (const t of litTotems) {
          const ang = Math.atan2(eraser.y - t.y, eraser.x - t.x);
          const dist = Math.hypot(eraser.x - t.x, eraser.y - t.y);
          ctx.vfx.spawnLive("pixtel/prism-beam", {
            x: t.x,
            y: t.y - 8,
            angle: ang,
            options: { length: dist, palette: isSuperResonance ? PAL.volt : PAL.cyber },
            priority: 6,
          });
        }
        ctx.spawner.arenaTotems.length = 0;
        eraser.totemChannelTimer = 0;
        eraser.bleachShield = 0;
        eraser.enrageBuffTime = 0;
        eraser.stunTime = isSuperResonance ? 5.2 : 4.5;
        eraser.vulnTime = isSuperResonance ? 7.0 : 6.0;
        const pct = isSuperResonance ? 0.12 : 0.08;
        const trueDmg = Math.round(eraser.maxHp * pct);
        eraser.hp = Math.max(1, eraser.hp - trueDmg);
        ctx.player.stamina = ctx.player.maxStamina;
        ctx.player.overdrive = Math.min(100, ctx.player.overdrive + 50);
        ctx.colorSys.triggerWave(eraser.x, eraser.y, 280, 320);

        if (isSuperResonance) {
          ctx.hazards.push({
            uid: nextEntityUid(),
            owner: "player",
            kind: "chroma_bloom",
            x: ctx.player.x,
            y: ctx.player.y,
            radius: 54,
            delay: 0,
            age: 0,
            maxLife: 4.5,
            tickTimer: 0.5,
            damage: 0,
            triggered: true,
          });
        }

        ctx.addShake(6.5);
        ctx.addHitstop(0.08);
        sfx.playExplosion();
        const tag = pairSpec ? pairSpec.shortTag : "PRISM BREAK";
        ctx.vfx.spawnDamageText(eraser.x, eraser.y - 22, `${tag} -${trueDmg}!`, {
          crit: true,
          color: pairSpec?.color ?? "#ffe066",
        });
        ctx.notify(
          `CỘNG HƯỞNG TRỤ [${ELEMENT_META[tA].shortLabel} + ${ELEMENT_META[tB].shortLabel} → ${pairSpec?.vnName ?? "Phá Khiên"}]! THE ERASER SỤP ĐỔ (${eraser.stunTime.toFixed(1)}s)!`,
          "epic"
        );
      }
    }
  }

  damageResource(
    ctx: CombatContext,
    res: {
      def: { dropItemId: string; dropQty: [number, number]; respawnSec: number };
      x: number;
      y: number;
      hp: number;
      alive: boolean;
      respawnTimer: number;
      hitFlash: number;
    },
    rawDmg: number
  ) {
    if (!res.alive) return;
    res.hp -= Math.max(8, rawDmg);
    res.hitFlash = 0.14;
    ctx.vfx.spawnPooled("mine-hit", { x: res.x, y: res.y - 4 });
    ctx.addShake(1.4);

    if (res.hp <= 0) {
      res.alive = false;
      res.respawnTimer = res.def.respawnSec;
      sfx.playMine(true);
      ctx.vfx.spawnPooled("mine-break", { x: res.x, y: res.y - 2 });
      const [minQ, maxQ] = res.def.dropQty;
      const qty = minQ + Math.floor(Math.random() * (maxQ - minQ + 1));
      ctx.spawner.spawnItemLoot(res.x, res.y, res.def.dropItemId, qty);
      ctx.stats.mined += 1;
      const completed = ctx.quests.recordEvent("mine_resource", res.def.dropItemId, 1);
      for (const q of completed) {
        sfx.playQuestComplete();
        ctx.notify(`Hoàn thành mục tiêu nhiệm vụ: ${q.title}! Quay về gặp NPC.`, "good");
      }
      ctx.vfx.spawnDamageText(res.x, res.y - 10, `+${qty} ORE`, { color: "#ffe066" });
    } else {
      sfx.playMine(false);
    }
  }

  damageEnemy(
    ctx: CombatContext,
    e: EnemyEntity,
    rawDamage: number,
    crit: boolean,
    hitPreset = "hit-cyan",
    element?: ElementType,
    kbX = 0,
    kbY = 0,
    poiseMult = 1.0
  ) {
    const idx = ctx.spawner.enemies.indexOf(e);
    if (idx < 0) return;

    if (ctx.isCoopGuest) {
      e.hitFlash = 0.13;
      sfx.playHit(crit);
      ctx.vfx.spawnPooled(crit ? "crit-gold" : hitPreset, { x: e.x, y: e.y - 6 });
      ctx.vfx.spawnDamageText(e.x, e.y - 10, crit ? `CRIT!` : `HIT`, {
        crit,
        color: crit ? "#ffe25a" : "#ffffff",
      });
      ctx.player.overdrive = Math.min(100, ctx.player.overdrive + (e.isBoss ? 5.0 : 6.0));
      ctx.onCoopClientHitEnemy?.({
        enemyUid: e.uid,
        rawDamage,
        crit,
        hitPreset,
        element,
        kbX,
        kbY,
        poiseMult,
      });
      return;
    }

    // Trigger Boss Territory Lock-In on first hit against any Boss!
    if (e.isBoss && ctx.onBossLockTrigger && !ctx.getBossLock?.()) {
      ctx.onBossLockTrigger(e);
    }

    const edef = ENEMIES[e.defId];
    const normEl = element ? normalizeElement(element) : undefined;

    // Striking an enemy marked with `chroma` (Dấu Sắc Độ) refunds Stamina, HP & [E] CDR!
    if (e.element === "chroma") {
      ctx.player.stamina = Math.min(ctx.player.maxStamina, ctx.player.stamina + 3);
      const microHeal = Math.max(1, Math.round(ctx.player.maxHp * 0.015));
      ctx.player.hp = Math.min(ctx.player.maxHp, ctx.player.hp + microHeal);
      ctx.player.skillCd = Math.max(0, ctx.player.skillCd - 0.15);
    }

    // Blight Decay (`void + nature`): consecutive hits deal bonus Void decay chip!
    const decayChip = e.blightDecayTime > 0 ? Math.max(2, Math.round(ctx.player.atk * 0.22)) : 0;

    // Smooth DEF mitigation + Level-Gap toughness penalty if player is >2 levels below enemy
    const effDef = e.vulnTime > 0 ? e.def * 0.45 : e.enrageBuffTime > 0 ? e.def * 1.25 : e.def;
    const defMult = 100 / (100 + effDef * 2.8);
    const levelGap = e.level - ctx.player.level;
    const gapMult = levelGap > 2 ? Math.max(0.25, 1 - (levelGap - 2) * 0.13) : 1.0;
    let mitigated = Math.max(2, Math.round(rawDamage * defMult * gapMult)) + decayChip;
    if (e.vulnTime > 0) {
      mitigated = Math.round(mitigated * 1.38);
    }

    if (gapMult < 0.7 && Date.now() - this.lastLevelWarnTime > 4500) {
      this.lastLevelWarnTime = Date.now();
      ctx.notify(`Địch LV.${e.level} vượt cấp bạn (LV.${ctx.player.level})! Hãy lên cấp & luyện trang bị.`, "warn");
    }

    // Bleach Shield (White Armor) absorbs 45% HP damage until shattered by Poise / Quake / Reactions!
    if (e.bleachShield > 0) {
      const weaknessBonus =
        normEl && (normEl === edef?.elementWeakness || normEl === "quake" || normEl === "prism")
          ? 1.3
          : 1.0;
      const poiseBreak = Math.round(
        rawDamage * poiseMult * weaknessBonus * (1 + (ctx.player.poiseBreakPct || 0) / 100)
      );
      e.bleachShield = Math.max(0, e.bleachShield - poiseBreak);
      mitigated = Math.max(1, Math.round(mitigated * 0.55));

      if (e.bleachShield <= 0) {
        this._triggerGuardBreak(ctx, e);
      }
    }

    if (e.guardTime > 0) {
      mitigated = Math.max(1, Math.round(mitigated * 0.55));
      ctx.vfx.spawnPooled(e.defId === "root_golem" ? "hit-poison" : "hit-cyan", {
        x: e.x,
        y: e.y - 8,
        scale: 0.72,
      });
    }

    e.hp -= mitigated;
    e.hitFlash = 0.13;
    e.state = "aggro";

    const kb = e.isBoss ? (e.vulnTime > 0 ? 5 : 2) : 7;
    if (kbX !== 0 || kbY !== 0) {
      ctx.world.moveWithCollision(e, kbX * kb, kbY * kb, e.radius * 0.7);
    }

    sfx.playHit(crit);
    ctx.vfx.spawnPooled(crit ? "crit-gold" : hitPreset, { x: e.x, y: e.y - 6 });
    ctx.vfx.spawnDamageText(e.x, e.y - 10, crit ? `CRIT ${mitigated}!` : `${mitigated}`, {
      crit,
      color: e.vulnTime > 0 ? "#ff9944" : crit ? "#ffe25a" : "#ffffff",
    });

    if (crit) {
      ctx.addShake(2.0);
      ctx.addHitstop(0.025);
    }

    const odGain =
      (e.isBoss ? 5.0 : 6.0) *
      (e.isWorldBoss && ctx.colorSys.unlockedWaypoints.size >= 8 ? 1.5 : 1.0);
    ctx.player.overdrive = Math.min(100, ctx.player.overdrive + odGain);

    if (element) {
      this._applyElement(ctx, e, element);
    }

    if (e.hp <= 0) {
      this._killEnemy(ctx, e);
    }
  }

  private _triggerGuardBreak(ctx: CombatContext, e: EnemyEntity) {
    e.bleachShield = 0;
    e.stunTime = Math.max(e.stunTime, e.isBoss ? 2.6 : 1.4);
    e.vulnTime = Math.max(e.vulnTime, 4.5);
    ctx.addShake(4.0);
    ctx.addHitstop(0.055);
    sfx.playExplosion();
    ctx.vfx.spawnPooled("crit-gold", { x: e.x, y: e.y - 8 });
    ctx.vfx.spawnDamageText(e.x, e.y - 20, "GUARD BREAK!", {
      crit: true,
      color: "#5ef2ff",
    });
    if (e.isBoss) {
      ctx.notify("ĐÃ PHÁ VỠ GIÁP NHIỄU TRẮNG! Boss bị choáng & lộ Điểm Yếu (+38% DMG)!", "epic");
    }
  }

  private _damageShieldPct(ctx: CombatContext, e: EnemyEntity, pctOfMax: number, flatMin: number) {
    if (e.bleachShield <= 0) return;
    const refMax = Math.max(e.maxBleachShield, e.bleachShield);
    const shred = Math.max(flatMin, Math.round(refMax * pctOfMax));
    e.bleachShield = Math.max(0, e.bleachShield - shred);
    if (e.bleachShield <= 0) {
      this._triggerGuardBreak(ctx, e);
    }
  }

  private _pullEnemiesAround(ctx: CombatContext, cx: number, cy: number, radius: number, pullPx: number) {
    for (const o of ctx.spawner.enemies) {
      const dx = cx - o.x;
      const dy = cy - o.y;
      const d = Math.hypot(dx, dy);
      if (d > 4 && d <= radius + o.radius) {
        const amt = o.isBoss ? pullPx * 0.35 : pullPx;
        ctx.world.moveWithCollision(o, (dx / d) * amt, (dy / d) * amt, o.radius * 0.7);
      }
    }
  }

  private _knockbackEnemiesAround(ctx: CombatContext, cx: number, cy: number, radius: number, pushPx: number) {
    for (const o of ctx.spawner.enemies) {
      const dx = o.x - cx;
      const dy = o.y - cy;
      const d = Math.hypot(dx, dy) || 1;
      if (d <= radius + o.radius) {
        const amt = o.isBoss ? pushPx * 0.35 : pushPx;
        ctx.world.moveWithCollision(o, (dx / d) * amt, (dy / d) * amt, o.radius * 0.7);
      }
    }
  }

  private _aoeReactionSplash(
    ctx: CombatContext,
    primary: EnemyEntity,
    radius: number,
    splashDmg: number,
    spreadAura?: InfusableElement
  ): number {
    let hitCount = 1;
    for (const other of [...ctx.spawner.enemies]) {
      if (other === primary) continue;
      if (Math.hypot(other.x - primary.x, other.y - primary.y) <= radius + other.radius) {
        hitCount++;
        other.hp -= splashDmg;
        other.hitFlash = 0.13;
        if (spreadAura && !other.element) {
          other.element = spreadAura;
          other.elementTime = 4.5;
          if (spreadAura === "fire") other.burnTime = Math.max(other.burnTime, 2.0);
          if (spreadAura === "ice") other.slowTime = Math.max(other.slowTime, 2.5);
          if (spreadAura === "nature") other.poisonTime = Math.max(other.poisonTime, 2.5);
        }
        if (other.hp <= 0) this._killEnemy(ctx, other);
      }
    }
    return hitCount;
  }

  /**
   * 9-Element Reaction Matrix:
   * - 6 Original Reactions (fire, ice, nature, volt)
   * - 22 Expanded Reactions (void, chroma, wind, quake)
   * - Universal Prismatic Refraction (`prism`): triggers peak reaction WITHOUT removing Primer aura + fires 3 homing bolts!
   */
  private _applyElement(ctx: CombatContext, e: EnemyEntity, rawIncoming: ElementType) {
    const incoming = normalizeElement(rawIncoming);
    const existing = e.element ? normalizeElement(e.element) : null;

    if (existing && existing !== incoming && e.reactionIcd <= 0) {
      e.reactionIcd = 0.52;
      const coatingBonus = ctx.player.coatingTime > 0 ? 20 : 0;
      const bloomBonus = ctx.player.chromaBloomBonusTime > 0 ? 15 : 0;
      const elemScale =
        (1 + ((ctx.player.elementBonus || 0) + coatingBonus + bloomBonus) / 100) *
        (ctx.player.hasReactionAmp ? 1.25 : 1.0);

      // Local Chroma Splash pushes back Bleached fog!
      ctx.colorSys.triggerWave(e.x, e.y, 48, 180);
      ctx.stats.reactionsTriggered = (ctx.stats.reactionsTriggered ?? 0) + 1;

      if (ctx.player.hasReactionAmp) {
        ctx.player.overdrive = Math.min(100, ctx.player.overdrive + 6);
      }
      if (ctx.player.hasChromaBlessing) {
        const blessHeal = Math.max(2, Math.round(ctx.player.maxHp * 0.04));
        ctx.player.hp = Math.min(ctx.player.maxHp, ctx.player.hp + blessHeal);
        ctx.player.stamina = Math.min(ctx.player.maxStamina, ctx.player.stamina + 10);
      }
      if (ctx.inv.getWeaponEnhanceLevel() >= 10) {
        const heal = Math.max(2, Math.round(ctx.player.maxHp * 0.04));
        ctx.player.hp = Math.min(ctx.player.maxHp, ctx.player.hp + heal);
      }

      const doneReacts = ctx.quests.recordEvent("trigger_reaction", undefined, 1);
      for (const q of doneReacts) {
        sfx.playQuestComplete();
        ctx.notify(`Hoàn thành mục tiêu nhiệm vụ: ${q.title}!`, "good");
      }

      // === C. SPECIAL RULE WITH PRISM: PRISMATIC REFRACTION ===
      if (incoming === "prism" || existing === "prism") {
        const baseElem = (incoming === "prism" ? existing : incoming) as InfusableElement;
        const partner = PRISM_PEAK_PARTNER[baseElem] ?? "fire";
        // Preserve underlying aura!
        e.element = baseElem;
        e.elementTime = 5.0;

        // Trigger the strongest reaction of that element + 3 homing refraction bolts!
        this._executePairReaction(ctx, e, baseElem, partner, elemScale, true);

        const others = ctx.spawner.enemies
          .filter((o) => o !== e && o.hp > 0)
          .sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y));
        const boltDmg = Math.max(4, Math.round(ctx.player.atk * 0.72 * elemScale));
        for (let bIdx = 0; bIdx < 3; bIdx++) {
          const tgt = others[bIdx % Math.max(1, others.length)];
          const ang = tgt
            ? Math.atan2(tgt.y - e.y, tgt.x - e.x) + (bIdx - 1) * 0.08
            : (bIdx * Math.PI * 2) / 3;
          this._spawnPlayerProj(ctx, {
            x: e.x,
            y: e.y - 4,
            angle: ang,
            speed: 265,
            radius: 5,
            damage: boltDmg,
            crit: false,
            pierce: 0,
            maxLife: 0.72,
            preset: "proj-amber",
            element: baseElem,
            hitPreset: "crit-gold",
            homing: true,
            ignoreUid: e.uid,
          });
        }
        ctx.vfx.spawnDamageText(e.x, e.y - 26, `KHÚC XẠ CẦU VỒNG!`, {
          crit: true,
          color: "#ff88f2",
        });
        return;
      }

      // Consume primer aura for standard 2-element reactions (some chroma reactions re-apply chroma below!)
      e.element = null;
      e.elementTime = 0;
      this._executePairReaction(
        ctx,
        e,
        existing as InfusableElement,
        incoming as InfusableElement,
        elemScale,
        false
      );
      return;
    }

    // Apply base aura when no reaction triggered
    if (incoming !== "prism") {
      e.element = incoming;
      e.elementTime = 5.0;
      if (incoming === "fire") e.burnTime = Math.max(e.burnTime, 3.2);
      else if (incoming === "ice") e.slowTime = Math.max(e.slowTime, 3.0);
      else if (incoming === "nature") e.poisonTime = Math.max(e.poisonTime, 3.6);
      else if (incoming === "void") {
        e.enrageBuffTime = 0; // Void strips enemy buff!
        const dx = ctx.player.x - e.x;
        const dy = ctx.player.y - e.y;
        const d = Math.hypot(dx, dy) || 1;
        if (!e.isBoss && d > 14) {
          ctx.world.moveWithCollision(e, (dx / d) * 6, (dy / d) * 6, e.radius * 0.7);
        }
      } else if (incoming === "chroma") {
        ctx.colorSys.triggerWave(e.x, e.y, 26, 140);
      } else if (incoming === "quake") {
        this._damageShieldPct(ctx, e, 0.08, 14);
      }
    }
  }

  private _executePairReaction(
    ctx: CombatContext,
    e: EnemyEntity,
    a: InfusableElement,
    b: InfusableElement,
    elemScale: number,
    fromPrism: boolean
  ) {
    const pair = [a, b].sort().join("+");
    const spec = REACTION_BY_KEY.get(pair);
    const mult = spec?.atkMult ?? 1.5;
    const dmg = Math.max(4, Math.round(ctx.player.atk * mult * elemScale));
    const color = spec?.color ?? "#ffe066";
    const label = spec?.shortTag ?? "PHẢN ỨNG";

    e.hp -= dmg;
    ctx.onCoopReactionVfx?.({ x: e.x, y: e.y, tag: `${label}!`, color });

    if (pair === "fire+ice") {
      // Sốc Nhiệt (Thermal Shatter): 1.85x ATK, -25% DEF 4s, 36px ice shard splash
      e.vulnTime = Math.max(e.vulnTime, 4.0);
      this._damageShieldPct(ctx, e, 0.22, 40);
      this._aoeReactionSplash(ctx, e, 36, Math.round(dmg * 0.65));
      ctx.vfx.spawnPooled("explode-fire", { x: e.x, y: e.y - 4 });
      ctx.vfx.spawnPooled("ice-shatter", { x: e.x, y: e.y - 4 });
      sfx.playExplosion();
      ctx.addShake(3.2);
    } else if (pair === "fire+nature") {
      // Bùng Độc Viêm (Toxic Eruption): 56px AoE + 3.5s Acid Pool (0.35x ATK / 0.5s)
      this._aoeReactionSplash(ctx, e, 56, Math.round(dmg * 0.75));
      ctx.vfx.spawnPooled("explode-plasma", { x: e.x, y: e.y - 4 });
      sfx.playExplosion();
      ctx.hazards.push({
        uid: nextEntityUid(),
        owner: "player",
        kind: "acid_pool",
        x: e.x,
        y: e.y,
        radius: 36,
        delay: 0,
        age: 0,
        maxLife: 3.5,
        tickTimer: 0.5,
        damage: Math.max(4, Math.round(ctx.player.atk * 0.35)),
        triggered: true,
      });
    } else if (pair === "ice+nature") {
      // Kết Tinh Bào Tử (Cryo-Root): Root 1.8s (Boss slow 45% 2.5s) + %maxHP corrosion (capped 2.2x ATK)
      const hpCorrosion = Math.min(Math.round(ctx.player.atk * 2.2), Math.round(e.maxHp * 0.06));
      e.hp -= hpCorrosion;
      e.rootTime = e.isBoss ? 0 : Math.max(e.rootTime, 1.8);
      e.slowTime = Math.max(e.slowTime, 2.8);
      e.poisonTime = Math.max(e.poisonTime, 3.5);
      ctx.vfx.spawnPooled("ice-nova", { x: e.x, y: e.y - 4 });
      ctx.vfx.spawnPooled("acid-splash", { x: e.x, y: e.y - 4 });
      sfx.playExplosion();
    } else if (pair === "ice+volt") {
      // Siêu Dẫn Lăng Kính (Superconduct): Chain up to 4 targets in 72px, Micro-Stun 0.4s & +15% Crit taken 5s
      e.critVulnTime = Math.max(e.critVulnTime, 5.0);
      e.vulnTime = Math.max(e.vulnTime, 4.0);
      if (!e.isBoss) e.stunTime = Math.max(e.stunTime, 0.4);
      ctx.vfx.spawnPooled("zap-hit", { x: e.x, y: e.y - 4 });
      sfx.playLaser();
      let chains = 1;
      for (const other of [...ctx.spawner.enemies]) {
        if (other === e || chains >= 4) continue;
        if (Math.hypot(other.x - e.x, other.y - e.y) <= 72 + other.radius) {
          chains++;
          other.hp -= Math.round(dmg * 0.85);
          other.critVulnTime = Math.max(other.critVulnTime, 5.0);
          if (!other.isBoss) other.stunTime = Math.max(other.stunTime, 0.4);
          other.hitFlash = 0.14;
          ctx.vfx.spawnPooled("zap-hit", { x: other.x, y: other.y - 4 });
          if (other.hp <= 0) this._killEnemy(ctx, other);
        }
      }
    } else if (pair === "fire+volt") {
      // Quá Tải Xung Kích (Overload Blast): 1.6x ATK, Knockback 26px, shreds 40% Bleach Shield!
      this._damageShieldPct(ctx, e, 0.4, 95);
      const ang = Math.atan2(e.y - ctx.player.y, e.x - ctx.player.x);
      const kb = e.isBoss ? 10 : 26;
      ctx.world.moveWithCollision(e, Math.cos(ang) * kb, Math.sin(ang) * kb, e.radius * 0.7);
      ctx.vfx.spawnPooled("explode-fire", { x: e.x, y: e.y - 4 });
      ctx.vfx.spawnPooled("zap-hit", { x: e.x, y: e.y - 4 });
      sfx.playExplosion();
      ctx.addShake(3.6);
    } else if (pair === "nature+volt") {
      // Xúc Tác Mạch Sáng (Catalyze): +16 Stamina & +10 Overdrive [Q] + 2 Chroma Motes
      ctx.player.stamina = Math.min(ctx.player.maxStamina, ctx.player.stamina + 16);
      ctx.player.exhausted = false;
      ctx.player.overdrive = Math.min(100, ctx.player.overdrive + 10);
      ctx.vfx.spawnPooled("heal-burst", { x: ctx.player.x, y: ctx.player.y - 6 });
      sfx.playOverdrive();
    } else if (pair === "fire+void") {
      // Phản Vật Chất Hỏa (Void Flare Burst): 52px AoE, pulls nearby enemies inward & strips buffs!
      e.enrageBuffTime = 0;
      this._pullEnemiesAround(ctx, e.x, e.y, 52, 16);
      this._aoeReactionSplash(ctx, e, 52, Math.round(dmg * 0.75));
      this._damageShieldPct(ctx, e, 0.25, 45);
      ctx.vfx.spawnPooled("explode-plasma", { x: e.x, y: e.y - 4 });
      ctx.vfx.spawnPooled("explode-fire", { x: e.x, y: e.y - 4 });
      sfx.playExplosion();
      ctx.addShake(3.2);
    } else if (pair === "ice+void") {
      // Đóng Băng Hư Vô (Null Frost): 48px frost zone 2.5s, 45% slow & +18% Normal/Charge DMG taken!
      e.slowTime = Math.max(e.slowTime, 2.8);
      e.normalAmpTime = Math.max(e.normalAmpTime, 3.5);
      ctx.vfx.spawnPooled("ice-nova", { x: e.x, y: e.y - 4 });
      ctx.hazards.push({
        uid: nextEntityUid(),
        owner: "player",
        kind: "null_frost",
        x: e.x,
        y: e.y,
        radius: 48,
        delay: 0,
        age: 0,
        maxLife: 2.5,
        tickTimer: 0.4,
        damage: Math.max(3, Math.round(ctx.player.atk * 0.25)),
        triggered: true,
      });
      sfx.playExplosion();
    } else if (pair === "void+volt") {
      // Đoản Mạch Hư Không (Void Arc): Chain up to 4 targets (1.35x ATK) & Disrupt 2.2s!
      e.disruptTime = Math.max(e.disruptTime, 2.2);
      e.enrageBuffTime = 0;
      ctx.vfx.spawnPooled("zap-hit", { x: e.x, y: e.y - 4 });
      sfx.playLaser();
      let chains = 1;
      for (const other of [...ctx.spawner.enemies]) {
        if (other === e || chains >= 4) continue;
        if (Math.hypot(other.x - e.x, other.y - e.y) <= 76 + other.radius) {
          chains++;
          other.hp -= Math.round(dmg * 0.82);
          other.disruptTime = Math.max(other.disruptTime, 2.2);
          other.hitFlash = 0.14;
          ctx.vfx.spawnPooled("zap-hit", { x: other.x, y: other.y - 4 });
          if (other.hp <= 0) this._killEnemy(ctx, other);
        }
      }
    } else if (pair === "nature+void") {
      // Thối Rữa Hư Không (Blight Decay): spreads Void decay & amplifies consecutive hits for 3.0s
      e.blightDecayTime = Math.max(e.blightDecayTime, 3.0);
      e.poisonTime = Math.max(e.poisonTime, 3.0);
      for (const other of ctx.spawner.enemies) {
        if (other === e) continue;
        if (Math.hypot(other.x - e.x, other.y - e.y) <= 50) {
          other.blightDecayTime = Math.max(other.blightDecayTime, 3.0);
          other.poisonTime = Math.max(other.poisonTime, 2.5);
        }
      }
      ctx.vfx.spawnPooled("acid-splash", { x: e.x, y: e.y - 4 });
      sfx.playExplosion();
    } else if (pair === "chroma+fire") {
      // Nhật Thực Sắc Lửa (Chroma Ignis): 58px burst (1.65x ATK), heals +10% HP & re-applies Chroma mark!
      const heal = Math.max(4, Math.round(ctx.player.maxHp * 0.1));
      ctx.player.hp = Math.min(ctx.player.maxHp, ctx.player.hp + heal);
      if (!fromPrism) {
        e.element = "chroma";
        e.elementTime = 4.5;
      }
      this._aoeReactionSplash(ctx, e, 58, Math.round(dmg * 0.72), "chroma");
      ctx.colorSys.triggerWave(e.x, e.y, 72, 210);
      ctx.vfx.spawnPooled("explode-fire", { x: e.x, y: e.y - 4 });
      ctx.vfx.spawnPooled("heal-burst", { x: ctx.player.x, y: ctx.player.y - 6 });
      sfx.playExplosion();
    } else if (pair === "chroma+volt") {
      // Cực Quang Xung Điện (Chroma Surge): Chain up to 4 targets, +18 Stamina & -0.8s [E] CD!
      ctx.player.stamina = Math.min(ctx.player.maxStamina, ctx.player.stamina + 18);
      ctx.player.exhausted = false;
      ctx.player.skillCd = Math.max(0, ctx.player.skillCd - 0.8);
      ctx.vfx.spawnPooled("zap-hit", { x: e.x, y: e.y - 4 });
      sfx.playOverdrive();
      let chains = 1;
      for (const other of [...ctx.spawner.enemies]) {
        if (other === e || chains >= 4) continue;
        if (Math.hypot(other.x - e.x, other.y - e.y) <= 74 + other.radius) {
          chains++;
          other.hp -= Math.round(dmg * 0.8);
          other.hitFlash = 0.14;
          ctx.vfx.spawnPooled("zap-hit", { x: other.x, y: other.y - 4 });
          if (other.hp <= 0) this._killEnemy(ctx, other);
        }
      }
    } else if (pair === "chroma+nature") {
      // Nở Rộ Sắc Màu (Chroma Bloom): 54px radiant sanctuary 3.5s (heals & +15% Element Bonus inside)
      ctx.colorSys.triggerWave(e.x, e.y, 76, 210);
      ctx.vfx.spawnPooled("heal-aoe", { x: e.x, y: e.y });
      ctx.hazards.push({
        uid: nextEntityUid(),
        owner: "player",
        kind: "chroma_bloom",
        x: e.x,
        y: e.y,
        radius: 54,
        delay: 0,
        age: 0,
        maxLife: 3.5,
        tickTimer: 0.6,
        damage: 0,
        triggered: true,
      });
      sfx.playOverdrive();
    } else if (pair === "chroma+ice") {
      // Lăng Kính Băng Sắc (Chroma Cryo): 1.55x ATK, slows & marks target to grant extra resources on kill
      e.slowTime = Math.max(e.slowTime, 3.5);
      e.chromaSlowBonusTime = Math.max(e.chromaSlowBonusTime, 5.0);
      this._aoeReactionSplash(ctx, e, 50, Math.round(dmg * 0.68));
      ctx.vfx.spawnPooled("ice-shatter", { x: e.x, y: e.y - 4 });
      sfx.playExplosion();
    } else if (pair === "fire+wind") {
      // Bão Lửa Cuốn (Firestorm Vortex): 54px fire cyclone, pulls, burns 2.0s & spreads Fire aura!
      e.burnTime = Math.max(e.burnTime, 2.2);
      this._pullEnemiesAround(ctx, e.x, e.y, 54, 14);
      this._aoeReactionSplash(ctx, e, 54, Math.round(dmg * 0.78), "fire");
      ctx.vfx.spawnPooled("explode-fire", { x: e.x, y: e.y - 4 });
      sfx.playExplosion();
    } else if (pair === "ice+wind") {
      // Gió Tuyết Cắt (Cryo Gale): 1.6x ATK frost gale, 40% slow 2.5s & light knockback
      e.slowTime = Math.max(e.slowTime, 2.5);
      this._aoeReactionSplash(ctx, e, 52, Math.round(dmg * 0.75), "ice");
      this._knockbackEnemiesAround(ctx, ctx.player.x, ctx.player.y, 56, 12);
      ctx.vfx.spawnPooled("ice-nova", { x: e.x, y: e.y - 4 });
      sfx.playExplosion();
    } else if (pair === "volt+wind") {
      // Lốc Sét Cộng Hưởng (Arc Tempest): bounces shock gale, 0.35s micro-stun & refunds Stamina per target!
      if (!e.isBoss) e.stunTime = Math.max(e.stunTime, 0.35);
      const hits = this._aoeReactionSplash(ctx, e, 68, Math.round(dmg * 0.8), "volt");
      ctx.player.stamina = Math.min(ctx.player.maxStamina, ctx.player.stamina + Math.min(18, hits * 4));
      ctx.vfx.spawnPooled("zap-hit", { x: e.x, y: e.y - 4 });
      sfx.playLaser();
    } else if (pair === "nature+wind") {
      // Lốc Bào Tử Rừng (Spore Cyclone): 56px spore vortex pulls enemies & spreads 2.5s poison!
      e.poisonTime = Math.max(e.poisonTime, 2.5);
      this._pullEnemiesAround(ctx, e.x, e.y, 56, 14);
      this._aoeReactionSplash(ctx, e, 56, Math.round(dmg * 0.75), "nature");
      ctx.vfx.spawnPooled("acid-splash", { x: e.x, y: e.y - 4 });
      sfx.playExplosion();
    } else if (pair === "void+wind") {
      // Xoáy Hư Không (Void Maëlstrom): Strong pull 58px (1.7x ATK) & Disrupts enemy aim 2.0s!
      e.disruptTime = Math.max(e.disruptTime, 2.0);
      e.enrageBuffTime = 0;
      this._pullEnemiesAround(ctx, e.x, e.y, 58, 22);
      this._aoeReactionSplash(ctx, e, 58, Math.round(dmg * 0.8));
      ctx.vfx.spawnPooled("explode-plasma", { x: e.x, y: e.y - 4 });
      sfx.playExplosion();
      ctx.addShake(3.2);
    } else if (pair === "chroma+wind") {
      // Lốc Sắc Cầu Vồng (Chroma Gust): spreads Chroma mark & grants player +18% SPD / Stamina regen 3.0s!
      ctx.player.chromaGustTime = Math.max(ctx.player.chromaGustTime, 3.0);
      ctx.player.stamina = Math.min(ctx.player.maxStamina, ctx.player.stamina + 10);
      if (!fromPrism) {
        e.element = "chroma";
        e.elementTime = 4.5;
      }
      this._aoeReactionSplash(ctx, e, 56, Math.round(dmg * 0.75), "chroma");
      ctx.colorSys.triggerWave(e.x, e.y, 70, 200);
      ctx.vfx.spawnPooled("crit-gold", { x: e.x, y: e.y - 4 });
      sfx.playOverdrive();
    } else if (pair === "fire+quake") {
      // Địa Nhiệt Bùng Nổ (Magma Quake): 60px AoE (1.8x ATK), 24px knockback & 35% Bleach Shield shred!
      this._damageShieldPct(ctx, e, 0.35, 85);
      this._aoeReactionSplash(ctx, e, 60, Math.round(dmg * 0.8));
      this._knockbackEnemiesAround(ctx, e.x, e.y, 60, 24);
      ctx.vfx.spawnPooled("ground-slam", { x: e.x, y: e.y });
      ctx.vfx.spawnPooled("explode-fire", { x: e.x, y: e.y - 4 });
      sfx.playExplosion();
      ctx.addShake(4.0);
    } else if (pair === "quake+volt") {
      // Sét Chấn Động (Thunder Slam): 1.5x ATK shock slam, massive Stagger / Bleach Shield break!
      this._damageShieldPct(ctx, e, 0.42, 100);
      if (!e.isBoss) e.stunTime = Math.max(e.stunTime, 0.85);
      this._aoeReactionSplash(ctx, e, 56, Math.round(dmg * 0.78));
      ctx.vfx.spawnPooled("ground-slam", { x: e.x, y: e.y });
      ctx.vfx.spawnPooled("zap-hit", { x: e.x, y: e.y - 4 });
      sfx.playExplosion();
      ctx.addShake(3.8);
    } else if (pair === "ice+quake") {
      // Băng Nứt Địa Chấn (Tectonic Shatter): 1.75x ATK, shreds DEF & empowers next Charged Attack +35%!
      e.vulnTime = Math.max(e.vulnTime, 4.5);
      ctx.player.tectonicChargeBonus = true;
      ctx.player.quickChargeTimer = Math.max(ctx.player.quickChargeTimer, 2.0);
      this._damageShieldPct(ctx, e, 0.3, 70);
      this._aoeReactionSplash(ctx, e, 54, Math.round(dmg * 0.75));
      ctx.vfx.spawnPooled("ground-slam", { x: e.x, y: e.y });
      ctx.vfx.spawnPooled("ice-shatter", { x: e.x, y: e.y - 4 });
      sfx.playExplosion();
      ctx.addShake(3.6);
    } else if (pair === "nature+quake") {
      // Động Đất Rừng Sâu (Root Tremor): 56px tremor, roots 1.2s (or slows Boss) & stuns small mobs!
      if (e.isBoss) {
        e.slowTime = Math.max(e.slowTime, 2.5);
      } else {
        e.rootTime = Math.max(e.rootTime, 1.2);
        e.stunTime = Math.max(e.stunTime, 0.45);
      }
      this._aoeReactionSplash(ctx, e, 56, Math.round(dmg * 0.75));
      ctx.vfx.spawnPooled("ground-slam", { x: e.x, y: e.y });
      ctx.vfx.spawnPooled("boss-thorns", { x: e.x, y: e.y });
      sfx.playExplosion();
    } else if (pair === "quake+wind") {
      // Chấn Phong Địa Chấn (Quake Gale): 1.75x ATK shockwave gale, strong knockback & heavy Stagger!
      this._damageShieldPct(ctx, e, 0.38, 90);
      this._aoeReactionSplash(ctx, e, 60, Math.round(dmg * 0.8));
      this._knockbackEnemiesAround(ctx, ctx.player.x, ctx.player.y, 64, 24);
      ctx.vfx.spawnPooled("ground-slam", { x: e.x, y: e.y });
      sfx.playExplosion();
      ctx.addShake(3.8);
    } else if (pair === "chroma+void") {
      // Nhật Thực Hư Sắc (Chroma Eclipse)
      e.enrageBuffTime = 0;
      ctx.player.overdrive = Math.min(100, ctx.player.overdrive + 12);
      ctx.colorSys.triggerWave(e.x, e.y, 80, 220);
      this._aoeReactionSplash(ctx, e, 56, Math.round(dmg * 0.78));
      ctx.vfx.spawnPooled("explode-plasma", { x: e.x, y: e.y - 4 });
      sfx.playExplosion();
    } else if (pair === "quake+void") {
      // Sụp Đổ Trọng Trường (Gravity Collapse)
      e.enrageBuffTime = 0;
      this._pullEnemiesAround(ctx, e.x, e.y, 58, 18);
      this._damageShieldPct(ctx, e, 0.35, 85);
      this._aoeReactionSplash(ctx, e, 58, Math.round(dmg * 0.8));
      ctx.vfx.spawnPooled("ground-slam", { x: e.x, y: e.y });
      sfx.playExplosion();
      ctx.addShake(3.8);
    } else {
      // Địa Mạch Thất Sắc (chroma+quake)
      ctx.player.stamina = Math.min(ctx.player.maxStamina, ctx.player.stamina + 14);
      if (!fromPrism) {
        e.element = "chroma";
        e.elementTime = 4.5;
      }
      this._damageShieldPct(ctx, e, 0.32, 75);
      this._aoeReactionSplash(ctx, e, 58, Math.round(dmg * 0.78), "chroma");
      ctx.colorSys.triggerWave(e.x, e.y, 74, 210);
      ctx.vfx.spawnPooled("ground-slam", { x: e.x, y: e.y });
      sfx.playExplosion();
    }

    ctx.vfx.spawnDamageText(e.x, e.y - 18, `${label} ${dmg}!`, {
      crit: true,
      color,
    });
  }

  private _killEnemy(ctx: CombatContext, e: EnemyEntity) {
    const idx = ctx.spawner.enemies.indexOf(e);
    if (idx < 0) return;
    ctx.spawner.enemies.splice(idx, 1);
    if (e.defId === "boss_the_eraser") {
      ctx.spawner.arenaTotems.length = 0;
    }

    // Chroma Cryo bonus when defeating a slowed enemy marked by Chroma Cryo!
    if (e.chromaSlowBonusTime > 0) {
      ctx.player.stamina = Math.min(ctx.player.maxStamina, ctx.player.stamina + 14);
      ctx.player.overdrive = Math.min(100, ctx.player.overdrive + 8);
    }

    if (ctx.player.hasEnergySiphon) {
      ctx.player.stamina = Math.min(ctx.player.maxStamina, ctx.player.stamina + Math.round(ctx.player.maxStamina * 0.08));
      ctx.player.overdrive = Math.min(100, ctx.player.overdrive + 6);
    }

    const edef = ENEMIES[e.defId];
    ctx.stats.kills += 1;

    ctx.vfx.spawnPooled(e.isBoss ? "explode-plasma" : "death-poof", { x: e.x, y: e.y - 6 });
    if (e.biome === "meadow") {
      ctx.vfx.spawnPooled("acid-splash", { x: e.x, y: e.y - 5, scale: e.isBoss ? 1.15 : 0.8 });
      if (e.isBoss) ctx.vfx.spawnPooled("heal-aoe", { x: e.x, y: e.y - 4 });
    } else if (e.biome === "quartz") {
      ctx.vfx.spawnPooled("ice-shatter", { x: e.x, y: e.y - 5, scale: e.isBoss ? 1.15 : 0.85 });
      if (e.isBoss || e.defId === "quartz_knight") {
        ctx.vfx.spawnPooled("ice-nova", { x: e.x, y: e.y - 4, scale: 0.88 });
      }
    } else if (e.biome === "amber") {
      ctx.vfx.spawnPooled("explode-fire", { x: e.x, y: e.y - 6, scale: e.isBoss ? 1.2 : 0.9 });
      if (e.isBoss) ctx.vfx.spawnPooled("ground-slam-fire", { x: e.x, y: e.y });
    } else {
      ctx.vfx.spawnPooled("explode-void", { x: e.x, y: e.y - 6, scale: e.isBoss ? 1.2 : 0.85 });
      ctx.vfx.spawnLive(e.isBoss ? "scifi/glitch" : "spawn/disintegrate", {
        x: e.x,
        y: e.y - 8,
        priority: 3,
        maxLife: 0.65,
      });
    }
    const waveR = e.isWorldBoss ? 480 : e.isBoss ? 260 : 62;
    ctx.colorSys.triggerWave(e.x, e.y, waveR, e.isBoss ? 280 : 180);
    ctx.vfx.spawnLive("pixtel/color-wave", {
      x: e.x,
      y: e.y,
      options: { radius: Math.min(180, waveR) },
      priority: e.isBoss ? 5 : 2,
      maxLife: e.isBoss ? 1.4 : 0.7,
    });

    if (edef) {
      ctx.onGainXp(edef.xp);
      const [gMin, gMax] = edef.gold;
      const gold = gMin + Math.floor(Math.random() * (gMax - gMin + 1));
      ctx.spawner.spawnGoldLoot(e.x, e.y, gold);

      const drops = rollEnemyDropTable(e.defId);
      for (const d of drops) {
        ctx.spawner.spawnItemLoot(e.x, e.y, d.itemId, d.qty, d.enhanceLevel);
        const dropDef = ITEMS[d.itemId];
        if (
          dropDef &&
          dropDef.category === "equipment" &&
          (dropDef.rarity === "rare" || dropDef.rarity === "epic" || dropDef.rarity === "legendary")
        ) {
          ctx.notify(`Rơi trang bị [${RARITY_INFO[dropDef.rarity].label}] ${dropDef.name}!`, "epic");
        }
      }
    }

    const done1 = ctx.quests.recordEvent("kill_enemy", e.defId, 1);
    const done2 = ctx.quests.recordEvent("kill_any", undefined, 1);
    for (const q of [...done1, ...done2]) {
      sfx.playQuestComplete();
      ctx.notify(`Hoàn thành mục tiêu: ${q.title}! Về thị trấn trả nhiệm vụ.`, "good");
    }

    const campRes = ctx.spawner.onEnemyRemoved(e.campId, ctx.vfx);
    if (campRes.chestUnlocked) {
      sfx.playQuestComplete();
      ctx.notify("Trại quái đã sạch bóng! Rương Kho Báu đã mở khóa!", "good");
    }

    if (e.isBoss) {
      const alreadyDefeated = ctx.defeatedBossIds?.has(e.defId) ?? false;
      const hiddenDrops = rollBossHiddenDrops(e.defId, alreadyDefeated);
      for (const hd of hiddenDrops) {
        ctx.spawner.spawnItemLoot(e.x, e.y, hd.itemId, hd.qty, hd.enhanceLevel);
        const hDef = ITEMS[hd.itemId];
        sfx.playHiddenDrop();
        ctx.vfx.spawnLive("pixtel/rainbow-burst", {
          x: e.x,
          y: e.y - 6,
          priority: 6,
          maxLife: 1.4,
        });
        ctx.vfx.spawnPooled("waypoint-pillar", { x: e.x, y: e.y });
        if (hDef) {
          ctx.notify(`✦ RƠI CỔ VẬT ẨN [${RARITY_INFO[hDef.rarity].label}]: ${hDef.name}!`, "epic");
        }
        ctx.onHiddenLootDropped?.(hd.itemId, e.x, e.y);
      }
      ctx.defeatedBossIds?.add(e.defId);

      ctx.stats.bossesDefeated += 1;
      ctx.onBossDefeated(e);
    }

    ctx.onCoopEnemyKilled?.({
      enemyUid: e.uid,
      defId: e.defId,
      campId: e.campId,
      x: e.x,
      y: e.y,
      isBoss: e.isBoss,
      isWorldBoss: e.isWorldBoss,
    });
  }

  /**
   * Applies damage to player, handling:
   * - Chroma Dodge (Perfect Dash in first 0.14s!)
   * - Prism Knight Just-Parry / E Shield counter-laser
   * - Undying Totem Charm auto-save from lethal damage!
   */
  damagePlayer(
    ctx: CombatContext,
    rawAmount: number,
    srcX: number,
    srcY: number,
    appliesBleach = false,
    attackerLevel?: number
  ) {
    const { player, vfx } = ctx;
    if (ctx.world.isInSafeTown(player.x, player.y)) return;

    // 1. Chroma Dodge (Perfect Dash)!
    if (player.perfectDashWindow > 0) {
      this.triggerChromaDodge(ctx);
      return;
    }

    if (player.invuln > 0) return;

    // 2. Prism Knight E Shield Block & Just-Parry (first 0.25s = shieldTime >= 0.80)
    if (player.shieldTime > 0) {
      const isJustParry = player.shieldTime >= 0.8;
      sfx.playBlock();
      const ang = Math.atan2(srcY - player.y, srcX - player.x);
      vfx.spawnDamageText(
        player.x,
        player.y - 16,
        isJustParry ? "JUST PARRY!" : "PARRY!",
        { crit: true, color: isJustParry ? "#ffe066" : "#5ef2ff" }
      );
      if (isJustParry) {
        ctx.addHitstop(0.06);
        player.skillCd = Math.max(0, player.skillCd * 0.5);
        player.stamina = Math.min(player.maxStamina, player.stamina + 15);
      }
      this.firePrismBeam(ctx, ang, isJustParry ? 2.85 : 2.35, "prism");
      player.invuln = 0.38;
      return;
    }

    const gap = attackerLevel !== undefined ? attackerLevel - player.level : 0;
    const threatMult = gap > 2 ? 1 + Math.min(0.85, (gap - 2) * 0.12) : 1.0;
    const defMult = 100 / (100 + Math.max(0, player.def) * 2.2);
    const mitigated = Math.max(2, Math.round(rawAmount * threatMult * defMult));
    const shieldScale = player.defBuffTime > 0 || player.aegisTime > 0 ? 1 - Math.min(0.6, player.defBuffPct || 0.35) : 1;
    const dmg = Math.max(1, Math.round(mitigated * shieldScale));
    player.hp = Math.max(0, player.hp - dmg);
    player.hitFlash = 0.22;
    player.invuln = 0.55;
    if (appliesBleach) {
      player.bleachDebuffTime = 4.5;
    }
    sfx.playPlayerHit();
    ctx.addShake(3.8);
    vfx.spawnPooled(player.aegisTime > 0 ? "hit-cyan" : "hit-fire", { x: player.x, y: player.y - 6 });
    vfx.spawnDamageText(player.x, player.y - 12, `-${dmg}`, { color: player.aegisTime > 0 ? "#5ef2ff" : "#ff4466" });

    if (player.hp <= 0) {
      // Check Undying Totem Charm in bag before defeat!
      if (ctx.inv.consumeItem("charm_undying", 1)) {
        player.hp = Math.max(15, Math.round(player.maxHp * 0.4));
        player.stamina = player.maxStamina;
        player.exhausted = false;
        player.invuln = 1.6;
        sfx.playWaypoint();
        ctx.addShake(4.5);
        vfx.spawnPooled("heal-aoe", { x: player.x, y: player.y });
        vfx.spawnDamageText(player.x, player.y - 18, "UNDYING TOTEM!", {
          crit: true,
          color: "#ffe066",
        });
        ctx.notify("Bùa Hộ Mệnh Bất Diệt đã vỡ thay mạng, hồi 40% HP & 100% Thể lực!", "epic");
        return;
      }
      ctx.onPlayerDefeated();
    }
  }

  /** Updates projectiles, turrets, hazards, passives, status DOTs, active Ultimates, and enemy/boss AI. */
  update(ctx: CombatContext, dt: number) {
    const { player, spawner, vfx, world } = ctx;

    // 1. Active Combat Rhythm & Buff Timers
    if (player.perfectDashWindow > 0) player.perfectDashWindow = Math.max(0, player.perfectDashWindow - dt);
    if (player.chromaCounterTimer > 0) player.chromaCounterTimer = Math.max(0, player.chromaCounterTimer - dt);
    if (player.quickChargeTimer > 0) player.quickChargeTimer = Math.max(0, player.quickChargeTimer - dt);
    if (player.bleachDebuffTime > 0) player.bleachDebuffTime = Math.max(0, player.bleachDebuffTime - dt);
    if (player.coatingTime > 0) player.coatingTime = Math.max(0, player.coatingTime - dt);
    if (player.chromaGustTime > 0) {
      player.chromaGustTime = Math.max(0, player.chromaGustTime - dt);
      player.stamina = Math.min(player.maxStamina, player.stamina + 12 * dt);
    }
    if (player.chromaBloomBonusTime > 0) {
      player.chromaBloomBonusTime = Math.max(0, player.chromaBloomBonusTime - dt);
    }
    if (player.totemSurgeTimer > 0) {
      player.totemSurgeTimer = Math.max(0, player.totemSurgeTimer - dt);
      if (player.totemSurgeTimer <= 0) player.totemSurgeElement = null;
    }

    if (player.dashComboPreserveTimer > 0) {
      player.dashComboPreserveTimer = Math.max(0, player.dashComboPreserveTimer - dt);
    } else if (player.comboTimer > 0) {
      player.comboTimer -= dt;
      if (player.comboTimer <= 0) player.comboStep = 0;
    }

    if (player.shieldTime > 0) player.shieldTime = Math.max(0, player.shieldTime - dt);
    if (player.cloneTime > 0) player.cloneTime = Math.max(0, player.cloneTime - dt);
    if (player.speedBuffTime > 0) {
      player.speedBuffTime = Math.max(0, player.speedBuffTime - dt);
      if (player.speedBuffTime <= 0) player.speedBuffPct = 0;
    }
    if (player.atkBuffTime > 0) {
      player.atkBuffTime = Math.max(0, player.atkBuffTime - dt);
      if (player.atkBuffTime <= 0) {
        player.atkBuffPct = 0;
        player.atkBuffCrit = 0;
      }
    }
    if (player.defBuffTime > 0) {
      player.defBuffTime = Math.max(0, player.defBuffTime - dt);
      if (player.defBuffTime <= 0) player.defBuffPct = 0;
    }
    if (player.aegisTime > 0) player.aegisTime = Math.max(0, player.aegisTime - dt);

    // Orbiting Grimoire / Satellite Passive (cycles all 8 Infusable Elements!)
    if (player.hasOrbitGrimoire) {
      player.grimoireTimer -= dt;
      if (player.grimoireTimer <= 0) {
        const target = this._findNearestEnemy(spawner.enemies, player.x, player.y, 175);
        if (target) {
          player.grimoireTimer = 4.0;
          const ang = Math.atan2(target.y - player.y, target.x - player.x);
          const elem = INFUSABLE_ELEMENTS[player.elementIdx % INFUSABLE_ELEMENTS.length];
          player.elementIdx = (player.elementIdx + 1) % INFUSABLE_ELEMENTS.length;
          const { dmg, crit } = this._rollDamage(ctx, 0.85, 5, true, target);
          sfx.playMagic(0);
          this._spawnPlayerProj(ctx, {
            x: player.x,
            y: player.y - 12,
            angle: ang,
            speed: 255,
            radius: 5,
            damage: dmg,
            crit,
            pierce: 0,
            maxLife: 0.9,
            preset: "proj-amber",
            element: elem,
            hitPreset: ELEMENT_HIT_PRESET[elem],
          });
        } else {
          player.grimoireTimer = 0.5;
        }
      }
    }

    // Prism Knight Q Storm ticks
    if (player.stormTime > 0) {
      const prevStorm = player.stormTime;
      player.stormTime -= dt;
      if (
        Math.floor(prevStorm / 0.95) !== Math.floor(Math.max(0, player.stormTime) / 0.95) &&
        player.stormTime > 0.25
      ) {
        vfx.spawnLive("pixtel/prism-storm", {
          x: player.x,
          y: player.y - 11,
          follow: player,
          offsetX: 0,
          offsetY: -11,
          priority: 5,
          maxLife: 1.05,
        });
      }
      player.stormTick -= dt;
      if (player.stormTick <= 0) {
        player.stormTick = 0.22;
        for (const e of [...spawner.enemies]) {
          const dx = e.x - player.x;
          const dy = e.y - player.y;
          const d = Math.hypot(dx, dy);
          if (d <= 68 + e.radius) {
            const { dmg, crit } = this._rollDamage(ctx, 0.85, 10, true, e);
            this.damageEnemy(
              ctx,
              e,
              dmg,
              crit,
              "hit-cyan",
              "prism",
              dx / (d || 1),
              dy / (d || 1),
              1.4
            );
          }
        }
      }
    }

    // Pixel Tinker Q Overload Drone (fires Chroma & Volt!)
    if (player.droneTime > 0) {
      player.droneTime -= dt;
      player.droneTick -= dt;
      if (player.droneTick <= 0) {
        player.droneTick = 0.28;
        const healAmt = Math.max(3, Math.round(player.maxHp * 0.035));
        player.hp = Math.min(player.maxHp, player.hp + healAmt);
        for (const t of ctx.turrets) t.hp = Math.min(t.maxHp, t.hp + 8);

        const target = this._findNearestEnemy(spawner.enemies, player.x, player.y, 175);
        if (target) {
          const ang = Math.atan2(target.y - player.y, target.x - player.x);
          const { dmg, crit } = this._rollDamage(ctx, 0.72, 0, true, target);
          sfx.playShoot(920);
          ctx.projectiles.push({
            uid: nextEntityUid(),
            owner: "turret",
            x: player.x + Math.cos(performance.now() * 0.006) * 16,
            y: player.y - 12 + Math.sin(performance.now() * 0.006) * 10,
            vx: Math.cos(ang) * 290,
            vy: Math.sin(ang) * 290,
            angle: ang,
            radius: 4,
            damage: dmg,
            crit,
            pierce: 0,
            life: 0,
            maxLife: 0.7,
            preset: "proj-laser",
            element: Math.random() < 0.5 ? "chroma" : "volt",
            hitSet: new Set(),
            hitPreset: "zap-hit",
          });
        }
      }
    }

    // Update Arena Totem hitFlash
    for (const totem of spawner.arenaTotems) {
      if (totem.hitFlash > 0) totem.hitFlash = Math.max(0, totem.hitFlash - dt);
    }

    // 2. Update Compile Turrets
    for (let i = ctx.turrets.length - 1; i >= 0; i--) {
      const t = ctx.turrets[i];
      t.life += dt;
      if (t.hitFlash > 0) t.hitFlash = Math.max(0, t.hitFlash - dt);
      if (t.overclockTime > 0) t.overclockTime = Math.max(0, t.overclockTime - dt);
      if (t.life >= t.maxLife || t.hp <= 0) {
        vfx.spawnPooled("death-poof", { x: t.x, y: t.y - 4 });
        ctx.turrets.splice(i, 1);
        continue;
      }
      t.fireCd -= dt;
      if (t.fireCd <= 0) {
        const target = this._findNearestEnemy(spawner.enemies, t.x, t.y, 160);
        if (target) {
          t.angle = Math.atan2(target.y - t.y, target.x - t.x);
          t.fireCd = t.overclockTime > 0 ? 0.22 : 0.45;
          const { dmg, crit } = this._rollDamage(ctx, t.overclockTime > 0 ? 0.78 : 0.62);
          sfx.playShoot(t.overclockTime > 0 ? 860 : 620);
          vfx.spawnPooled("muzzle-smg", {
            x: t.x + Math.cos(t.angle) * 8,
            y: t.y - 6 + Math.sin(t.angle) * 8,
            angle: t.angle,
          });
          ctx.projectiles.push({
            uid: nextEntityUid(),
            owner: "turret",
            x: t.x + Math.cos(t.angle) * 8,
            y: t.y - 6 + Math.sin(t.angle) * 8,
            vx: Math.cos(t.angle) * 265,
            vy: Math.sin(t.angle) * 265,
            angle: t.angle,
            radius: 4,
            damage: dmg,
            crit,
            pierce: 0,
            life: 0,
            maxLife: 0.75,
            preset: "proj-bullet",
            element: "volt",
            hitSet: new Set(),
            hitPreset: "hit-gold",
          });
        } else {
          t.fireCd = 0.2;
        }
      }
    }

    // 3. Update Projectiles
    for (let i = ctx.projectiles.length - 1; i >= 0; i--) {
      const p = ctx.projectiles[i];
      p.life += dt;
      if (p.homing && p.owner === "player") {
        let bestTgt: EnemyEntity | null = null;
        let bestD = 155;
        for (const cand of spawner.enemies) {
          if (cand.hp <= 0 || p.hitSet.has(cand.uid)) continue;
          const d = Math.hypot(cand.x - p.x, cand.y - 4 - p.y);
          if (d < bestD) {
            bestD = d;
            bestTgt = cand;
          }
        }
        if (bestTgt) {
          const spd = Math.hypot(p.vx, p.vy) || 260;
          const desired = Math.atan2(bestTgt.y - 4 - p.y, bestTgt.x - p.x);
          let diff = desired - p.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const maxTurn = 7.5 * dt;
          p.angle += Math.max(-maxTurn, Math.min(maxTurn, diff));
          p.vx = Math.cos(p.angle) * spd;
          p.vy = Math.sin(p.angle) * spd;
        }
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.life >= p.maxLife || world.getTileAtWorld(p.x, p.y) === 2) {
        if (p.owner === "enemy") this._onEnemyProjectileEnd(ctx, p);
        ctx.projectiles.splice(i, 1);
        continue;
      }

      if (p.owner === "player" || p.owner === "turret") {
        if (p.canOverclockTurret) {
          let overclocked = false;
          for (const t of ctx.turrets) {
            if (Math.hypot(t.x - p.x, t.y - 4 - p.y) <= 13) {
              t.overclockTime = 4.5;
              t.hp = Math.min(t.maxHp, t.hp + 15);
              vfx.spawnPooled("heal-burst", { x: t.x, y: t.y - 6 });
              vfx.spawnDamageText(t.x, t.y - 14, "OVERCLOCK!", { color: "#44ee88" });
              sfx.playBlock();
              overclocked = true;
              break;
            }
          }
          if (overclocked) {
            ctx.projectiles.splice(i, 1);
            continue;
          }
        }

        // Hit Arena Chroma Totems!
        let litTotem = false;
        for (const totem of spawner.arenaTotems) {
          if (totem.lit) continue;
          if (Math.hypot(totem.x - p.x, totem.y - 6 - p.y) <= 12 + p.radius) {
            this._lightArenaTotem(ctx, totem, p.element);
            litTotem = true;
            break;
          }
        }
        if (litTotem && p.pierce <= 0) {
          ctx.projectiles.splice(i, 1);
          continue;
        }

        // Hit enemies
        let consumed = false;
        for (const e of [...spawner.enemies]) {
          if (p.hitSet.has(e.uid)) continue;
          if (Math.hypot(e.x - p.x, e.y - 4 - p.y) <= e.radius + p.radius) {
            p.hitSet.add(e.uid);
            const spd = Math.hypot(p.vx, p.vy) || 1;
            this.damageEnemy(
              ctx,
              e,
              p.damage,
              p.crit,
              p.hitPreset ?? "hit-cyan",
              p.element,
              p.vx / spd,
              p.vy / spd,
              p.poiseMult ?? 1.0
            );
            if (p.pierce > 0) {
              p.pierce--;
            } else {
              consumed = true;
              break;
            }
          }
        }
        if (consumed) {
          ctx.projectiles.splice(i, 1);
          continue;
        }

        // Hit mining resource nodes
        for (const res of spawner.resources) {
          if (!res.alive) continue;
          if (Math.hypot(res.x - p.x, res.y - 4 - p.y) <= 12 + p.radius) {
            this.damageResource(ctx, res, p.damage);
            ctx.projectiles.splice(i, 1);
            consumed = true;
            break;
          }
        }
        if (consumed) continue;
      } else {
        const hitDist = player.perfectDashWindow > 0 ? player.radius + p.radius + 7 : player.radius + p.radius;
        if (Math.hypot(player.x - p.x, player.y - 4 - p.y) <= hitDist) {
          this.damagePlayer(ctx, p.damage, p.x, p.y, p.preset === "proj-void");
          this._onEnemyProjectileEnd(ctx, p);
          ctx.projectiles.splice(i, 1);
          continue;
        }
        for (const t of ctx.turrets) {
          if (Math.hypot(t.x - p.x, t.y - 4 - p.y) <= 9 + p.radius) {
            t.hp -= p.damage;
            t.hitFlash = 0.12;
            vfx.spawnPooled("hit-fire", { x: t.x, y: t.y - 4 });
            this._onEnemyProjectileEnd(ctx, p);
            ctx.projectiles.splice(i, 1);
            break;
          }
        }
      }
    }

    // 4. Update Hazards & Ground Fields (Vortex, Acid Pool, Null Frost, Chroma Bloom, Flame Trail, Bleach Zone, Boss Telegraphs)
    for (let i = ctx.hazards.length - 1; i >= 0; i--) {
      const h = ctx.hazards[i];
      h.age += dt;

      if (h.kind === "vortex") {
        // Chroma Mage [E] Void-Chroma Vortex: pulls enemies, strips buffs & pulses elements!
        h.tickTimer -= dt;
        for (const e of spawner.enemies) {
          const dx = h.x - e.x;
          const dy = h.y - e.y;
          const d = Math.hypot(dx, dy);
          if (d > 4 && d < h.radius + 14) {
            e.enrageBuffTime = 0;
            const pull = (e.isBoss ? 24 : 68) * dt;
            world.moveWithCollision(e, (dx / d) * pull, (dy / d) * pull, e.radius * 0.7);
          }
        }
        if (h.tickTimer <= 0) {
          h.tickTimer = 0.36;
          const vortexPool: InfusableElement[] = ["void", "fire", "ice", "volt", "chroma"];
          for (const e of [...spawner.enemies]) {
            if (Math.hypot(e.x - h.x, e.y - h.y) <= h.radius + e.radius) {
              const el = vortexPool[Math.floor(Math.random() * vortexPool.length)];
              this.damageEnemy(ctx, e, h.damage, false, ELEMENT_HIT_PRESET[el], el);
            }
          }
        }
      } else if (h.kind === "acid_pool") {
        h.tickTimer -= dt;
        if (h.tickTimer <= 0) {
          h.tickTimer = 0.5;
          for (const e of [...spawner.enemies]) {
            if (Math.hypot(e.x - h.x, e.y - h.y) <= h.radius + e.radius) {
              this.damageEnemy(ctx, e, h.damage, false, "hit-poison", "nature", 0, 0, 0.5);
            }
          }
        }
      } else if (h.kind === "moss_pool") {
        h.tickTimer -= dt;
        if (h.tickTimer <= 0) {
          h.tickTimer = 0.6;
          if (Math.hypot(player.x - h.x, player.y - h.y) <= h.radius + player.radius) {
            this.damagePlayer(ctx, h.damage, h.x, h.y);
          }
        }
      } else if (h.kind === "null_frost") {
        h.tickTimer -= dt;
        for (const e of spawner.enemies) {
          if (Math.hypot(e.x - h.x, e.y - h.y) <= h.radius + e.radius) {
            e.slowTime = Math.max(e.slowTime, 0.5);
            e.normalAmpTime = Math.max(e.normalAmpTime, 0.8);
          }
        }
        if (h.tickTimer <= 0) {
          h.tickTimer = 0.5;
          for (const e of [...spawner.enemies]) {
            if (Math.hypot(e.x - h.x, e.y - h.y) <= h.radius + e.radius) {
              this.damageEnemy(ctx, e, h.damage, false, "hit-ice", undefined, 0, 0, 0.4);
            }
          }
        }
      } else if (h.kind === "chroma_bloom") {
        if (Math.hypot(player.x - h.x, player.y - h.y) <= h.radius + player.radius) {
          player.chromaBloomBonusTime = Math.max(player.chromaBloomBonusTime, 0.5);
        }
        h.tickTimer -= dt;
        if (h.tickTimer <= 0) {
          h.tickTimer = 0.65;
          if (Math.hypot(player.x - h.x, player.y - h.y) <= h.radius + player.radius) {
            const heal = Math.max(2, Math.round(player.maxHp * 0.03));
            player.hp = Math.min(player.maxHp, player.hp + heal);
            player.stamina = Math.min(player.maxStamina, player.stamina + 6);
          }
        }
      } else if (h.kind === "flame_trail") {
        h.tickTimer -= dt;
        if (h.tickTimer <= 0) {
          h.tickTimer = 0.45;
          if (Math.hypot(player.x - h.x, player.y - h.y) <= h.radius + player.radius) {
            this.damagePlayer(ctx, h.damage, h.x, h.y);
          }
        }
      } else if (h.kind === "bleach_zone") {
        if (Math.hypot(player.x - h.x, player.y - h.y) <= h.radius + player.radius) {
          player.stamina = Math.max(0, player.stamina - 10 * dt);
          player.bleachDebuffTime = Math.max(player.bleachDebuffTime, 1.0);
        }
      } else if (!h.triggered && h.age >= h.delay) {
        h.triggered = true;
        if (h.kind === "meteor") {
          sfx.playExplosion();
          ctx.addShake(3.0);
          vfx.spawnPooled("boss-starfall", { x: h.x, y: h.y });
          vfx.spawnPooled("explode-fire", { x: h.x, y: h.y });
          const metElems: ElementType[] = ["fire", "chroma", "prism"];
          const mEl = metElems[h.uid % metElems.length];
          for (const e of [...spawner.enemies]) {
            if (Math.hypot(e.x - h.x, e.y - h.y) <= h.radius + e.radius) {
              this.damageEnemy(ctx, e, h.damage, Math.random() < 0.35, "hit-fire", mEl, 0, 0, 1.5);
            }
          }
        } else if (h.kind === "afterimage") {
          // Bit Rogue [E] Frame-Skip Afterimage: Void pull + buff-strip explosion!
          sfx.playExplosion();
          ctx.addShake(3.2);
          vfx.spawnPooled("explode-plasma", { x: h.x, y: h.y - 4 });
          this._pullEnemiesAround(ctx, h.x, h.y, h.radius + 10, 14);
          for (const e of [...spawner.enemies]) {
            if (Math.hypot(e.x - h.x, e.y - h.y) <= h.radius + e.radius) {
              this.damageEnemy(ctx, e, h.damage, true, "explode-plasma", "void", 0, 0, 1.6);
            }
          }
        } else if (h.owner === "enemy") {
          sfx.playExplosion();
          ctx.addShake(3.2);
          if (h.kind === "boss_thorns") vfx.spawnPooled("boss-thorns", { x: h.x, y: h.y });
          else if (h.kind === "skyfall_crystal") vfx.spawnPooled("ice-shatter", { x: h.x, y: h.y });
          else if (h.kind === "boss_slam" || h.kind === "boss_cone") {
            vfx.spawnPooled(h.vfxPreset ?? "ground-slam", { x: h.x, y: h.y });
            if (h.vfxPreset === "ground-slam-nature") {
              vfx.spawnPooled("dirt-puff", { x: h.x, y: h.y - 2, scale: 0.65 });
            }
          }
          else if (h.kind === "boss_erase") {
            vfx.spawnPooled("boss-smite", { x: h.x, y: h.y });
            ctx.hazards.push({
              uid: nextEntityUid(),
              owner: "enemy",
              kind: "bleach_zone",
              x: h.x,
              y: h.y,
              radius: 26,
              delay: 0,
              age: 0,
              maxLife: 3.2,
              tickTimer: 0,
              damage: 0,
              triggered: true,
            });
          } else if (h.kind === "boss_cross" || h.kind === "boss_rot_cross") {
            const baseA = h.kind === "boss_rot_cross" ? Math.PI / 4 : 0;
            for (const a of [baseA, baseA + Math.PI / 2]) {
              vfx.spawnLive("pixtel/prism-beam", {
                x: h.x - Math.cos(a) * 90,
                y: h.y - Math.sin(a) * 90,
                angle: a,
                options: { length: 180, palette: PAL.neon },
                priority: 4,
              });
            }
          }

          if (h.kind === "boss_cross") {
            const onH = Math.abs(player.y - h.y) <= 18 && Math.abs(player.x - h.x) <= 95;
            const onV = Math.abs(player.x - h.x) <= 18 && Math.abs(player.y - h.y) <= 95;
            if (onH || onV) this.damagePlayer(ctx, h.damage, h.x, h.y, true);
          } else if (h.kind === "boss_rot_cross") {
            const rx = player.x - h.x;
            const ry = player.y - h.y;
            const d1 = Math.abs(rx * 0.7071 - ry * 0.7071);
            const d2 = Math.abs(rx * 0.7071 + ry * 0.7071);
            if ((d1 <= 18 || d2 <= 18) && Math.hypot(rx, ry) <= 98) {
              this.damagePlayer(ctx, h.damage, h.x, h.y, true);
            }
          } else if (h.kind === "boss_cone") {
            const dx = player.x - h.x;
            const dy = player.y - h.y;
            const d = Math.hypot(dx, dy);
            let diff = Math.atan2(dy, dx) - (h.angle ?? 0);
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            if (d <= h.radius + player.radius && Math.abs(diff) <= 0.85) {
              this.damagePlayer(ctx, h.damage, h.x, h.y);
            }
          } else if (Math.hypot(player.x - h.x, player.y - h.y) <= h.radius + player.radius) {
            this.damagePlayer(ctx, h.damage, h.x, h.y, h.kind === "boss_erase");
          }
        }
      }

      if (h.age >= h.maxLife) {
        ctx.hazards.splice(i, 1);
      }
    }

    // 5. Update Enemies & Bosses
    const playerInTown = world.isInSafeTown(player.x, player.y);
    for (let i = spawner.enemies.length - 1; i >= 0; i--) {
      const e = spawner.enemies[i];
      if (!e) continue;
      if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);
      if (e.reactionIcd > 0) e.reactionIcd = Math.max(0, e.reactionIcd - dt);
      if (e.rootTime > 0) e.rootTime = Math.max(0, e.rootTime - dt);
      if (e.stunTime > 0) e.stunTime = Math.max(0, e.stunTime - dt);
      if (e.vulnTime > 0) e.vulnTime = Math.max(0, e.vulnTime - dt);
      if (e.critVulnTime > 0) e.critVulnTime = Math.max(0, e.critVulnTime - dt);
      if (e.normalAmpTime > 0) e.normalAmpTime = Math.max(0, e.normalAmpTime - dt);
      if (e.disruptTime > 0) e.disruptTime = Math.max(0, e.disruptTime - dt);
      if (e.blightDecayTime > 0) e.blightDecayTime = Math.max(0, e.blightDecayTime - dt);
      if (e.chromaSlowBonusTime > 0) e.chromaSlowBonusTime = Math.max(0, e.chromaSlowBonusTime - dt);
      if (e.enrageBuffTime > 0) e.enrageBuffTime = Math.max(0, e.enrageBuffTime - dt);
      if (e.guardTime > 0) e.guardTime = Math.max(0, e.guardTime - dt);
      if (e.dashTime > 0) e.dashTime = Math.max(0, e.dashTime - dt);
      if (e.animTime > 0) {
        e.animTime = Math.max(0, e.animTime - dt);
        const animProgress = Math.min(1, Math.max(0, 1 - e.animTime / Math.max(0.05, e.animDuration)));
        if (e.animKind === "leap_slam" && !e.animImpactDone && animProgress >= 0.74) {
          e.animImpactDone = true;
          vfx.spawnPooled("acid-splash", { x: e.x, y: e.y - 3, scale: 0.92 });
          for (let d = 0; d < 8; d++) {
            const da = (d / 8) * Math.PI * 2;
            vfx.spawnPixelDot(
              e.x + Math.cos(da) * 5,
              e.y - 2 + Math.sin(da) * 4,
              Math.cos(da) * 42,
              Math.sin(da) * 30 - 18,
              d % 2 === 0 ? "#66ff77" : "#b8ff77",
              0.26,
              2
            );
          }
          sfx.playHit();
          this._enemyConeHitPlayer(ctx, e, e.animAngle, 34, Math.PI, 1.08);
        }
        if (e.animKind === "roll_charge" && !e.animImpactDone && animProgress >= 0.42) {
          e.animImpactDone = true;
          vfx.spawnPooled("dirt-puff", { x: e.x, y: e.y - 2, scale: 0.42 });
        }
        if (e.animTime === 0) e.animKind = "idle";
      }

      if (e.elementTime > 0) {
        e.elementTime -= dt;
        if (e.elementTime <= 0) e.element = null;
      }
      if (e.slowTime > 0) e.slowTime = Math.max(0, e.slowTime - dt);
      if (e.burnTime > 0) {
        e.burnTime -= dt;
        e.burnTick -= dt;
        if (e.burnTick <= 0) {
          e.burnTick = 0.6;
          this.damageEnemy(ctx, e, Math.max(4, Math.round(player.atk * 0.3)), false, "hit-fire", undefined, 0, 0, 0.25);
          if (e.hp <= 0) continue;
        }
      }
      if (e.poisonTime > 0) {
        e.poisonTime -= dt;
        e.poisonTick -= dt;
        if (e.poisonTick <= 0) {
          e.poisonTick = 0.7;
          this.damageEnemy(ctx, e, Math.max(4, Math.round(player.atk * 0.28)), false, "hit-poison", undefined, 0, 0, 0.25);
          if (e.hp <= 0) continue;
        }
      }

      const edef = ENEMIES[e.defId];
      if (!edef) continue;

      if (ctx.isCoopGuest) {
        // Authoritative enemy movement & AI runs on Room Host; Guest still checks local contact damage!
        const localContact = Math.hypot(player.x - e.x, player.y - e.y);
        const contactDist =
          player.perfectDashWindow > 0 ? e.radius + player.radius + 5 : e.radius + player.radius;
        if (e.state === "aggro" && e.stunTime <= 0 && localContact <= contactDist) {
          this.damagePlayer(ctx, e.atk, e.x, e.y, false, e.level);
        }
        continue;
      }

      // Multi-player target selection (Host + up to 3 Co-op Guests, with Prism Knight shield threat pull!)
      let tgtX = player.x;
      let tgtY = player.y;
      let tgtInTown = playerInTown;
      let distToPlayer = Math.hypot(player.x - e.x, player.y - e.y);
      let bestThreatScore = playerInTown ? 99999 : distToPlayer - (player.shieldTime > 0 ? 40 : 0);

      if (ctx.coopTargets && ctx.coopTargets.length > 0) {
        for (const ct of ctx.coopTargets) {
          if (ct.hp <= 0) continue;
          const inTown = world.isInSafeTown(ct.x, ct.y);
          if (inTown) continue;
          const d = Math.hypot(ct.x - e.x, ct.y - e.y);
          const score = d - (ct.shieldGuard ? 40 : 0);
          if (score < bestThreatScore) {
            bestThreatScore = score;
            tgtX = ct.x;
            tgtY = ct.y;
            tgtInTown = false;
            distToPlayer = d;
          }
        }
      }

      const distToHome = Math.hypot(e.homeX - e.x, e.homeY - e.y);

      if (distToPlayer > 460 && e.state === "patrol") continue;

      if (distToPlayer < 260 && Math.random() < dt * 2.2) {
        const ambCol =
          e.biome === "meadow"
            ? "#78ff8a"
            : e.biome === "quartz"
              ? "#9befff"
              : e.biome === "amber"
                ? "#ffaa3b"
                : "#c97aff";
        vfx.spawnPixelDot(
          e.x + (Math.random() - 0.5) * 18,
          e.y - 8 - Math.random() * 14,
          (Math.random() - 0.5) * 10,
          -10 - Math.random() * 12,
          ambCol,
          0.45,
          Math.random() < 0.4 ? 2 : 1
        );
      }

      if (e.state === "patrol") {
        if (!tgtInTown && distToPlayer <= edef.aggroRadius) {
          e.state = "aggro";
          if (e.isBoss) sfx.playBossRoar();
        }
      } else if (e.state === "aggro") {
        if (tgtInTown || distToHome > edef.leashRadius || distToPlayer > edef.leashRadius + 60) {
          e.state = "leash";
          if (e.defId === "boss_the_eraser") spawner.arenaTotems.length = 0;
        }
      } else if (e.state === "leash") {
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.22 * dt);
        if (distToHome < 14) {
          e.state = "patrol";
          e.phase = 1;
          e.bleachShield = e.isBoss ? Math.round(e.maxBleachShield * 0.4) : e.maxBleachShield;
        }
      }

      // Stunned / Shield-broken enemies skip movement & attacks!
      if (e.stunTime > 0) continue;

      const enrageSpd = e.enrageBuffTime > 0 ? 1.18 : 1.0;
      const moveSpd =
        e.rootTime > 0 ? 0 : e.spd * enrageSpd * (e.slowTime > 0 ? 0.55 : 1.0);

      if (e.state === "leash") {
        const ang = Math.atan2(e.homeY - e.y, e.homeX - e.x);
        this._setEnemyDirFromAngle(e, ang);
        world.moveWithCollision(e, Math.cos(ang) * e.spd * 1.35 * dt, Math.sin(ang) * e.spd * 1.35 * dt, e.radius * 0.7);
        e.walkTime += dt * 1.3;
        continue;
      }

      if (e.state === "patrol") {
        e.patrolWait -= dt;
        const dPat = Math.hypot(e.patrolTargetX - e.x, e.patrolTargetY - e.y);
        if (dPat < 6 || e.patrolWait <= 0) {
          const ang = Math.random() * Math.PI * 2;
          const r = 14 + Math.random() * 26;
          e.patrolTargetX = e.homeX + Math.cos(ang) * r;
          e.patrolTargetY = e.homeY + Math.sin(ang) * r;
          e.patrolWait = 2.0 + Math.random() * 2.4;
        } else {
          const ang = Math.atan2(e.patrolTargetY - e.y, e.patrolTargetX - e.x);
          this._setEnemyDirFromAngle(e, ang);
          world.moveWithCollision(e, Math.cos(ang) * moveSpd * 0.42 * dt, Math.sin(ang) * moveSpd * 0.42 * dt, e.radius * 0.7);
          e.walkTime += dt * 0.6;
        }
        continue;
      }

      // === AGGRO COMBAT AI ===
      const rawAng = Math.atan2(tgtY - e.y, tgtX - e.x);
      if (e.animTime <= 0) {
        this._setEnemyDirFromAngle(e, rawAng);
      }
      const cdRate = e.disruptTime > 0 ? 0.68 : 1.0; // Disrupt slows enemy attack cadence by ~32%!
      e.aiTimer -= dt * cdRate;
      e.specialTimer -= dt * cdRate;
      e.walkTime += dt;

      if (e.dashTime > 0 && e.rootTime <= 0) {
        const dashProgress =
          e.animTime > 0 ? 1 - e.animTime / Math.max(0.05, e.animDuration) : 0.5;
        const dashActiveNow =
          e.animKind !== "leap_slam" || (dashProgress >= 0.2 && dashProgress <= 0.74);
        if (dashActiveNow) {
          world.moveWithCollision(e, e.dashVx * dt, e.dashVy * dt, e.radius * 0.7);
          if (e.animKind !== "leap_slam" && Math.random() < 0.7) {
            const dotCol =
              e.biome === "meadow"
                ? Math.random() < 0.4
                  ? "#bfa77a"
                  : "#66ff88"
                : e.biome === "amber"
                  ? "#ffaa33"
                  : e.biome === "ruins"
                    ? "#cc66ff"
                    : "#66f7ff";
            vfx.spawnPixelDot(
              e.x + (Math.random() - 0.5) * 8,
              e.y - 4 + (Math.random() - 0.5) * 6,
              -e.dashVx * 0.16,
              -e.dashVy * 0.16 - 12,
              dotCol,
              0.22,
              2
            );
          }
        }
      } else if (edef.ai === "ranged") {
        const idealDist = 92;
        if (distToPlayer > idealDist + 15) {
          world.moveWithCollision(e, Math.cos(rawAng) * moveSpd * dt, Math.sin(rawAng) * moveSpd * dt, e.radius * 0.7);
        } else if (distToPlayer < idealDist - 22) {
          world.moveWithCollision(e, -Math.cos(rawAng) * moveSpd * 0.7 * dt, -Math.sin(rawAng) * moveSpd * 0.7 * dt, e.radius * 0.7);
        }
        if (e.aiTimer <= 0) {
          this._triggerEnemySkill(ctx, e, edef.ai, rawAng, distToPlayer);
        }
      } else if (edef.ai === "flanker") {
        const strafe = rawAng + Math.sin(e.walkTime * 3.2) * 0.65;
        world.moveWithCollision(e, Math.cos(strafe) * moveSpd * dt, Math.sin(strafe) * moveSpd * dt, e.radius * 0.7);
        if (e.aiTimer <= 0 && distToPlayer <= 125) {
          this._triggerEnemySkill(ctx, e, edef.ai, rawAng, distToPlayer);
        }
      } else if (
        edef.ai === "boss_warden" ||
        edef.ai === "boss_root" ||
        edef.ai === "boss_amber" ||
        edef.ai === "boss_eraser"
      ) {
        this._updateBossAi(ctx, e, edef.ai, rawAng, moveSpd, distToPlayer, dt);
      } else {
        if (distToPlayer > e.radius + player.radius + 2) {
          world.moveWithCollision(e, Math.cos(rawAng) * moveSpd * dt, Math.sin(rawAng) * moveSpd * dt, e.radius * 0.7);
        }
        if (
          e.aiTimer <= 0 &&
          distToPlayer <= (edef.ai === "mini_root_golem" || edef.ai === "mini_quartz_knight" ? 115 : 95)
        ) {
          this._triggerEnemySkill(ctx, e, edef.ai, rawAng, distToPlayer);
        }
      }

      // Contact damage (with Chroma Dodge grace check!)
      const contactDist = player.perfectDashWindow > 0 ? e.radius + player.radius + 5 : e.radius + player.radius;
      if (distToPlayer <= contactDist) {
        this.damagePlayer(ctx, e.atk, e.x, e.y, false, e.level);
      }
    }
  }

  private _setEnemyDirFromAngle(e: EnemyEntity, ang: number) {
    const cx = Math.cos(ang);
    const sy = Math.sin(ang);
    e.facing = cx < 0 ? -1 : 1;
    if (Math.abs(cx) >= Math.abs(sy)) {
      e.facingDir = cx < 0 ? "left" : "right";
    } else {
      e.facingDir = sy < 0 ? "up" : "down";
    }
  }

  private _onEnemyProjectileEnd(ctx: CombatContext, p: ProjectileEntity) {
    if (p.spawnHazardOnHit === "moss_pool") {
      ctx.vfx.spawnPooled("acid-splash", { x: p.x, y: p.y - 2, scale: 0.65 });
      ctx.hazards.push({
        uid: nextEntityUid(),
        owner: "enemy",
        kind: "moss_pool",
        x: p.x,
        y: p.y,
        radius: 20,
        delay: 0,
        age: 0,
        maxLife: 3.0,
        tickTimer: 0.35,
        damage: p.hazardDamage ?? Math.max(3, Math.round(p.damage * 0.45)),
        triggered: true,
      });
    }
  }

  private _startEnemyAnim(
    e: EnemyEntity,
    kind: EnemyAnimKind,
    duration: number,
    ang: number,
    lockFront = false
  ) {
    e.animKind = kind;
    e.animDuration = duration;
    e.animTime = duration;
    e.animAngle = ang;
    e.animImpactDone = false;
    this._setEnemyDirFromAngle(e, ang);
    if (lockFront) e.facingDir = "down";
  }

  private _enemyConeHitPlayer(
    ctx: CombatContext,
    e: EnemyEntity,
    aimAngle: number,
    range: number,
    halfCone: number,
    mult: number
  ) {
    const { player } = ctx;
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const d = Math.hypot(dx, dy);
    if (d > range + player.radius) return;
    let diff = Math.atan2(dy, dx) - aimAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) <= halfCone || d <= 16) {
      this.damagePlayer(ctx, Math.round(e.atk * mult), e.x, e.y, false, e.level);
    }
  }

  private _enemyLineHitPlayer(
    ctx: CombatContext,
    e: EnemyEntity,
    aimAngle: number,
    length: number,
    halfWidth: number,
    mult: number
  ) {
    const { player } = ctx;
    const rx = player.x - e.x;
    const ry = player.y - e.y;
    const dirX = Math.cos(aimAngle);
    const dirY = Math.sin(aimAngle);
    const along = rx * dirX + ry * dirY;
    const perp = Math.abs(rx * -dirY + ry * dirX);
    if (along >= 0 && along <= length && perp <= halfWidth + player.radius) {
      this.damagePlayer(ctx, Math.round(e.atk * mult), e.x, e.y, false, e.level);
    }
  }

  private _triggerEnemySkill(
    ctx: CombatContext,
    e: EnemyEntity,
    ai: string,
    rawAng: number,
    distToPlayer: number
  ) {
    const { player, vfx } = ctx;
    const jitter = e.disruptTime > 0 ? (Math.random() - 0.5) * 0.48 : 0;
    const ang = rawAng + jitter;
    const step = e.skillCycle++;

    // 1. SLIME RÊU (null_slime): Nhảy Đập (trì hoãn nổ lúc chạm đất) / Phun Dịch Rêu (nổ vũng rêu khi trúng/rơi)
    if (e.defId === "null_slime") {
      if ((step & 1) === 0) {
        this._startEnemyAnim(e, "leap_slam", 0.68, ang);
        e.aiTimer = 2.05;
        e.dashTime = 0.52;
        e.dashVx = Math.cos(ang) * 148;
        e.dashVy = Math.sin(ang) * 148;
      } else {
        this._startEnemyAnim(e, "spit_moss", 0.48, ang);
        e.aiTimer = 2.0;
        const sx = e.x + Math.cos(ang) * 8;
        const sy = e.y - 8 + Math.sin(ang) * 6;
        vfx.spawnPooled("muzzle-poison", { x: sx, y: sy, angle: ang, scale: 0.72 });
        ctx.projectiles.push({
          uid: nextEntityUid(),
          owner: "enemy",
          x: sx,
          y: sy,
          vx: Math.cos(ang) * 145,
          vy: Math.sin(ang) * 145,
          angle: ang,
          radius: 5,
          damage: e.atk,
          crit: false,
          pierce: 0,
          life: 0,
          maxLife: 0.85,
          preset: "proj-poison",
          hitSet: new Set(),
          spawnHazardOnHit: "moss_pool",
          hazardDamage: Math.max(3, Math.round(e.atk * 0.45)),
        });
      }
      return;
    }

    // 2. BỌ DIỆP LỤC (ash_hopper): Cuộn Tròn Húc (bụi + haste) / Bung Gai Vỏ
    if (e.defId === "ash_hopper") {
      if ((step & 1) === 0) {
        this._startEnemyAnim(e, "roll_charge", 0.62, ang);
        e.aiTimer = 2.2;
        e.dashTime = 0.42;
        e.dashVx = Math.cos(ang) * 190;
        e.dashVy = Math.sin(ang) * 190;
        vfx.spawnPooled("dirt-puff", {
          x: e.x - Math.cos(ang) * 8,
          y: e.y - 2,
          scale: 0.48,
        });
        vfx.spawnLive("status/haste", {
          x: e.x,
          y: e.y - 6,
          follow: e,
          offsetY: -6,
          options: { palette: PAL.poison },
          priority: 2,
          maxLife: 0.45,
        });
      } else {
        this._startEnemyAnim(e, "shell_burst", 0.48, ang);
        e.aiTimer = 2.1;
        vfx.spawnPooled("parry-poison", { x: e.x, y: e.y, scale: 0.72 });
        vfx.spawnPooled("acid-splash", { x: e.x, y: e.y - 6, scale: 0.88 });
        for (let k = 0; k < 8; k++) {
          const sa = (k / 8) * Math.PI * 2;
          ctx.projectiles.push({
            uid: nextEntityUid(),
            owner: "enemy",
            x: e.x + Math.cos(sa) * 6,
            y: e.y - 8 + Math.sin(sa) * 6,
            vx: Math.cos(sa) * 130,
            vy: Math.sin(sa) * 130,
            angle: sa,
            radius: 4,
            damage: Math.round(e.atk * 0.85),
            crit: false,
            pierce: 0,
            life: 0,
            maxLife: 0.9,
            preset: "proj-poison",
            hitSet: new Set(),
          });
        }
      }
      return;
    }

    // 3. XẠ THỦ GAI (thorn_archer): Bắn Phi Tiêu Gai / Rải Bẫy Dây Leo
    if (e.defId === "thorn_archer") {
      if (step % 3 === 2) {
        this._startEnemyAnim(e, "vine_trap", 0.52, ang);
        e.aiTimer = 2.1;
        vfx.spawnPooled("hit-poison", { x: e.x + Math.cos(ang) * 8, y: e.y - 10, scale: 0.7 });
        vfx.spawnLive("pixtel/boss-telegraph", {
          x: player.x,
          y: player.y,
          options: { radius: 22, shape: "circle", palette: PAL.poison },
          priority: 3,
          maxLife: 0.72,
        });
        ctx.hazards.push({
          uid: nextEntityUid(),
          owner: "enemy",
          kind: "boss_thorns",
          x: player.x,
          y: player.y,
          radius: 24,
          delay: 0.68,
          age: 0,
          maxLife: 0.95,
          tickTimer: 0,
          damage: Math.round(e.atk * 1.1),
          triggered: false,
        });
      } else {
        this._startEnemyAnim(e, "thorn_shot", 0.4, ang);
        e.aiTimer = 1.6;
        const sx = e.x + Math.cos(ang) * 10;
        const sy = e.y - 10 + Math.sin(ang) * 7;
        vfx.spawnPooled("muzzle-poison", { x: sx, y: sy, angle: ang, scale: 0.68 });
        ctx.projectiles.push({
          uid: nextEntityUid(),
          owner: "enemy",
          x: sx,
          y: sy,
          vx: Math.cos(ang) * 175,
          vy: Math.sin(ang) * 175,
          angle: ang,
          radius: 4,
          damage: e.atk,
          crit: false,
          pierce: 0,
          life: 0,
          maxLife: 1.5,
          preset: "proj-poison",
          hitSet: new Set(),
        });
      }
      return;
    }

    // 4. GOLEM RỄ CÂY — BOSS PHỤ (root_golem): Đập Đất Lục Bảo / Quét Rễ / Giáp Lục Giác Cổ Thụ
    if (e.defId === "root_golem") {
      const m = step % 3;
      if (m === 0) {
        this._startEnemyAnim(e, "root_whip", 0.5, ang);
        e.aiTimer = 1.9;
        const dir = this._toDirectionalVfx(ang, 0.65);
        const offX = Math.cos(ang) * 6;
        const offY = -16 + Math.sin(ang) * 4;
        vfx.spawnLive("melee/sword-slash", {
          x: e.x + offX,
          y: e.y + offY,
          follow: e,
          offsetX: offX,
          offsetY: offY,
          angle: dir.angle,
          flip: dir.flip,
          durationScale: 1.35,
          maxLife: 0.42,
          options: { palette: PAL.poison, radius: 46 },
          priority: 3,
        });
        this._enemyConeHitPlayer(ctx, e, ang, 46, 1.35, 1.15);
      } else if (m === 1) {
        this._startEnemyAnim(e, "quake_slam", 0.7, ang);
        e.aiTimer = 2.2;
        vfx.spawnLive("pixtel/boss-telegraph", {
          x: e.x,
          y: e.y,
          options: { radius: 42, shape: "circle", palette: PAL.poison },
          priority: 4,
          maxLife: 0.72,
        });
        ctx.hazards.push({
          uid: nextEntityUid(),
          owner: "enemy",
          kind: "boss_slam",
          x: e.x,
          y: e.y,
          radius: 44,
          delay: 0.68,
          age: 0,
          maxLife: 0.95,
          tickTimer: 0,
          damage: Math.round(e.atk * 1.25),
          vfxPreset: "ground-slam-nature",
          triggered: false,
        });
      } else {
        this._startEnemyAnim(e, "bark_shield", 0.55, ang);
        e.aiTimer = 2.1;
        e.guardTime = 2.6;
        vfx.spawnLive("impacts/shield-block", {
          x: e.x,
          y: e.y,
          follow: e,
          offsetX: 0,
          offsetY: 0,
          flip: Math.cos(ang) < 0,
          angle: 0,
          options: { palette: PAL.poison },
          priority: 3,
          maxLife: 0.45,
        });
        vfx.spawnLive("pixtel/hex-shield", {
          x: e.x,
          y: e.y - 18,
          follow: e,
          offsetX: 0,
          offsetY: -18,
          options: { palette: PAL.heal, radius: 23 },
          priority: 4,
          maxLife: 2.5,
        });
      }
      return;
    }

    // 6. DƠI PHA LÊ (bleach_hound): Lao Cắt Chéo / Sóng Âm Pha Lê (Sonic Rings!)
    if (e.defId === "bleach_hound") {
      if ((step & 1) === 0) {
        this._startEnemyAnim(e, "dive_slash", 0.52, ang);
        e.aiTimer = 2.0;
        e.dashTime = 0.3;
        e.dashVx = Math.cos(ang) * 210;
        e.dashVy = Math.sin(ang) * 210;
        const dir = this._toDirectionalVfx(ang, 0.85);
        const offX = Math.cos(ang) * 8;
        const offY = -13 + Math.sin(ang) * 5;
        vfx.spawnLive("melee/thrust", {
          x: e.x + offX,
          y: e.y + offY,
          follow: e,
          offsetX: offX,
          offsetY: offY,
          angle: dir.angle,
          flip: dir.flip,
          durationScale: 1.45,
          maxLife: 0.4,
          options: { palette: PAL.ice },
          priority: 3,
        });
      } else {
        this._startEnemyAnim(e, "sonic_wave", 0.5, ang);
        e.aiTimer = 1.9;
        const offX = Math.cos(ang) * 8;
        const offY = -12 + Math.sin(ang) * 5;
        vfx.spawnLive("pixtel/sonic-wave", {
          x: e.x + offX,
          y: e.y + offY,
          follow: e,
          offsetX: offX,
          offsetY: offY,
          angle: ang,
          flip: false,
          options: { palette: PAL.ice, range: 102 },
          priority: 3,
          maxLife: 0.62,
        });
        for (const off of [-0.18, 0, 0.18]) {
          const sa = ang + off;
          ctx.projectiles.push({
            uid: nextEntityUid(),
            owner: "enemy",
            x: e.x + Math.cos(sa) * 8,
            y: e.y - 11 + Math.sin(sa) * 6,
            vx: Math.cos(sa) * 160,
            vy: Math.sin(sa) * 160,
            angle: sa,
            radius: 4,
            damage: Math.round(e.atk * 0.8),
            crit: false,
            pierce: 0,
            life: 0,
            maxLife: 1.1,
            preset: "proj-icelance",
            hitSet: new Set(),
          });
        }
      }
      return;
    }

    // 7. CUA THẠCH ANH (quartz_stalker): Kẹp Càng Pha Lê (Parry 4-Point Cross-Star) / Khiên Lục Giác Thạch Anh
    if (e.defId === "quartz_stalker") {
      if (step % 3 === 2) {
        this._startEnemyAnim(e, "quartz_shield", 0.52, ang);
        e.aiTimer = 2.0;
        e.guardTime = 2.4;
        vfx.spawnLive("impacts/shield-block", {
          x: e.x,
          y: e.y,
          follow: e,
          offsetX: 0,
          offsetY: 0,
          flip: Math.cos(ang) < 0,
          angle: 0,
          options: { palette: PAL.ice },
          priority: 3,
          maxLife: 0.45,
        });
        vfx.spawnLive("pixtel/hex-shield", {
          x: e.x,
          y: e.y - 12,
          follow: e,
          offsetX: 0,
          offsetY: -12,
          options: { palette: PAL.ice, radius: 18 },
          priority: 4,
          maxLife: 2.3,
        });
      } else {
        this._startEnemyAnim(e, "claw_clamp", 0.46, ang);
        e.aiTimer = 1.75;
        const dir = this._toDirectionalVfx(ang, 0.65);
        const offX = Math.cos(ang) * 7;
        const offY = -12 + Math.sin(ang) * 4;
        vfx.spawnLive("melee/double-slash", {
          x: e.x + offX,
          y: e.y + offY,
          follow: e,
          offsetX: offX,
          offsetY: offY,
          angle: dir.angle,
          flip: dir.flip,
          durationScale: 1.5,
          maxLife: 0.38,
          options: { palette: PAL.ice },
          priority: 3,
        });
        vfx.spawnPooled("parry-cyan", {
          x: e.x + Math.cos(ang) * 14,
          y: e.y - 2 + Math.sin(ang) * 6,
          scale: 0.85,
        });
        this._enemyConeHitPlayer(ctx, e, ang, 38, 1.25, 1.1);
      }
      return;
    }

    // 8. LĂNG KÍNH TRÔI (static_imp): Tia Laser Mảnh / Tách Ảnh Khúc Xạ
    if (e.defId === "static_imp") {
      if ((step & 1) === 0) {
        this._startEnemyAnim(e, "thin_laser", 0.58, ang);
        e.aiTimer = 1.85;
        const offX = Math.cos(ang) * 8;
        const offY = -13 + Math.sin(ang) * 5;
        vfx.spawnPooled("parry-cyan", { x: e.x + offX, y: e.y + offY + 6, scale: 0.52 });
        vfx.spawnLive("pixtel/prism-beam", {
          x: e.x + offX,
          y: e.y + offY,
          follow: e,
          offsetX: offX,
          offsetY: offY,
          angle: ang,
          startTime: 0.03,
          maxLife: 0.55,
          options: { length: 120, palette: PAL.ice },
          priority: 3,
        });
        this._enemyLineHitPlayer(ctx, e, ang, 122, 10, 1.05);
      } else {
        this._startEnemyAnim(e, "refract_split", 0.48, ang);
        e.aiTimer = 1.75;
        vfx.spawnPooled("parry-cyan", {
          x: e.x + Math.cos(ang) * 8,
          y: e.y - 6 + Math.sin(ang) * 4,
          scale: 0.65,
        });
        const presets = ["proj-icelance", "proj-laser", "proj-amber"];
        for (let k = -1; k <= 1; k++) {
          const sa = ang + k * 0.24;
          ctx.projectiles.push({
            uid: nextEntityUid(),
            owner: "enemy",
            x: e.x + Math.cos(sa) * 7,
            y: e.y - 12 + Math.sin(sa) * 5,
            vx: Math.cos(sa) * 155,
            vy: Math.sin(sa) * 155,
            angle: sa,
            radius: 4,
            damage: Math.round(e.atk * 0.85),
            crit: false,
            pierce: 0,
            life: 0,
            maxLife: 1.5,
            preset: presets[k + 1],
            hitSet: new Set(),
          });
        }
      }
      return;
    }

    // 9. KỴ SĨ THẠCH ANH — BOSS PHỤ (quartz_knight): Quét Kích / Lướt Đâm / Mưa Mảnh
    if (e.defId === "quartz_knight") {
      const m = step % 3;
      if (m === 0) {
        this._startEnemyAnim(e, "halberd_sweep", 0.52, ang);
        e.aiTimer = 1.85;
        const dir = this._toDirectionalVfx(ang, 0.65);
        const offX = Math.cos(ang) * 7;
        const offY = -17 + Math.sin(ang) * 5;
        vfx.spawnLive("melee/sword-slash", {
          x: e.x + offX,
          y: e.y + offY,
          follow: e,
          offsetX: offX,
          offsetY: offY,
          angle: dir.angle,
          flip: dir.flip,
          durationScale: 1.35,
          maxLife: 0.42,
          options: { palette: PAL.ice, radius: 48 },
          priority: 3,
        });
        this._enemyConeHitPlayer(ctx, e, ang, 48, 1.4, 1.15);
      } else if (m === 1) {
        this._startEnemyAnim(e, "crystal_lunge", 0.55, ang);
        e.aiTimer = 2.0;
        e.dashTime = 0.32;
        e.dashVx = Math.cos(ang) * 220;
        e.dashVy = Math.sin(ang) * 220;
        const dir = this._toDirectionalVfx(ang, 0.85);
        const offX = Math.cos(ang) * 9;
        const offY = -17 + Math.sin(ang) * 6;
        vfx.spawnLive("melee/thrust", {
          x: e.x + offX,
          y: e.y + offY,
          follow: e,
          offsetX: offX,
          offsetY: offY,
          angle: dir.angle,
          flip: dir.flip,
          durationScale: 1.35,
          maxLife: 0.45,
          options: { palette: PAL.ice },
          priority: 4,
        });
      } else {
        this._startEnemyAnim(e, "shard_rain", 0.65, ang);
        e.aiTimer = 2.1;
        vfx.spawnPooled("ice-nova", { x: e.x, y: e.y - 4, scale: 0.68 });
        for (let k = 0; k < 3; k++) {
          const tx = player.x + (k === 0 ? 0 : k === 1 ? -26 : 26);
          const ty = player.y + (k === 0 ? 0 : 12);
          vfx.spawnLive("pixtel/boss-telegraph", {
            x: tx,
            y: ty,
            options: { radius: 24, shape: "circle", palette: PAL.ice },
            priority: 4,
            maxLife: 0.78,
          });
          ctx.hazards.push({
            uid: nextEntityUid(),
            owner: "enemy",
            kind: "skyfall_crystal",
            x: tx,
            y: ty,
            radius: 26,
            delay: 0.74,
            age: 0,
            maxLife: 1.0,
            tickTimer: 0,
            damage: Math.round(e.atk * 1.15),
            triggered: false,
          });
        }
      }
      return;
    }

    // 11. AMBER BEETLE (amber_beetle): Húc Lửa Hổ Phách / Đập Nham Thạch
    if (e.defId === "amber_beetle") {
      if ((step & 1) === 0) {
        this._startEnemyAnim(e, "amber_roll", 0.56, ang);
        e.aiTimer = 2.05;
        e.dashTime = 0.34;
        e.dashVx = Math.cos(ang) * 195;
        e.dashVy = Math.sin(ang) * 195;
        vfx.spawnPooled("explode-fire", { x: e.x, y: e.y - 4, scale: 0.55 });
      } else {
        this._startEnemyAnim(e, "molten_slam", 0.68, ang);
        e.aiTimer = 2.2;
        vfx.spawnLive("pixtel/boss-telegraph", {
          x: e.x,
          y: e.y,
          options: { radius: 34, shape: "circle", palette: PAL.fire },
          priority: 3,
          maxLife: 0.68,
        });
        ctx.hazards.push({
          uid: nextEntityUid(),
          owner: "enemy",
          kind: "boss_slam",
          x: e.x,
          y: e.y,
          radius: 36,
          delay: 0.64,
          age: 0,
          maxLife: 0.9,
          tickTimer: 0,
          damage: Math.round(e.atk * 1.2),
          vfxPreset: "ground-slam-fire",
          triggered: false,
        });
      }
      return;
    }

    // 12. CINDER IMP (cinder_imp): Bắn Cầu Than Rực
    if (e.defId === "cinder_imp") {
      this._startEnemyAnim(e, "ember_cast", 0.42, ang);
      e.aiTimer = 1.6;
      const sx = e.x + Math.cos(ang) * 8;
      const sy = e.y - 8 + Math.sin(ang) * 5;
      vfx.spawnPooled("muzzle-fire", { x: sx, y: sy, angle: ang, scale: 0.72 });
      ctx.projectiles.push({
        uid: nextEntityUid(),
        owner: "enemy",
        x: sx,
        y: sy,
        vx: Math.cos(ang) * 155,
        vy: Math.sin(ang) * 155,
        angle: ang,
        radius: 4,
        damage: e.atk,
        crit: false,
        pierce: 0,
        life: 0,
        maxLife: 1.7,
        preset: "proj-fireball",
        hitSet: new Set(),
      });
      return;
    }

    // 13. PRISM GOLEM (prism_golem): Chấn Động Hư Không / Pháo Đài Tàn Tích
    if (e.defId === "prism_golem") {
      if ((step & 1) === 0) {
        this._startEnemyAnim(e, "void_slam", 0.68, ang);
        e.aiTimer = 2.1;
        vfx.spawnLive("pixtel/boss-telegraph", {
          x: e.x,
          y: e.y,
          options: { radius: 38, shape: "circle", palette: PAL.shadow },
          priority: 3,
          maxLife: 0.68,
        });
        ctx.hazards.push({
          uid: nextEntityUid(),
          owner: "enemy",
          kind: "boss_slam",
          x: e.x,
          y: e.y,
          radius: 40,
          delay: 0.64,
          age: 0,
          maxLife: 0.9,
          tickTimer: 0,
          damage: Math.round(e.atk * 1.25),
          vfxPreset: "ground-slam-void",
          triggered: false,
        });
      } else {
        this._startEnemyAnim(e, "void_barrage", 0.5, ang);
        e.aiTimer = 1.95;
        vfx.spawnPooled("explode-void", { x: e.x, y: e.y - 8, scale: 0.78 });
        for (let k = 0; k < 6; k++) {
          const sa = ang + (k / 6) * Math.PI * 2;
          ctx.projectiles.push({
            uid: nextEntityUid(),
            owner: "enemy",
            x: e.x + Math.cos(sa) * 7,
            y: e.y - 8 + Math.sin(sa) * 5,
            vx: Math.cos(sa) * 135,
            vy: Math.sin(sa) * 135,
            angle: sa,
            radius: 4,
            damage: Math.round(e.atk * 0.9),
            crit: false,
            pierce: 0,
            life: 0,
            maxLife: 1.35,
            preset: "proj-void",
            hitSet: new Set(),
          });
        }
      }
      return;
    }

    // 14. VOID WRAITH (void_wraith): Lướt Nhiễu / Liên Hoàn Đạn Hư Không
    if (e.defId === "void_wraith") {
      if ((step & 1) === 0) {
        const dashAng = ang + (Math.random() < 0.5 ? 1.1 : -1.1);
        this._startEnemyAnim(e, "void_blink", 0.4, dashAng);
        e.aiTimer = 1.55;
        e.dashTime = 0.24;
        e.dashVx = Math.cos(dashAng) * 200;
        e.dashVy = Math.sin(dashAng) * 200;
        vfx.spawnLive("scifi/glitch", { x: e.x, y: e.y - 8, follow: e, offsetY: -8, priority: 3, maxLife: 0.42 });
      } else {
        this._startEnemyAnim(e, "void_barrage", 0.44, ang);
        e.aiTimer = 1.65;
        vfx.spawnPooled("muzzle-void", { x: e.x + Math.cos(ang) * 8, y: e.y - 9, angle: ang, scale: 0.75 });
        for (const off of [-0.14, 0.14]) {
          const sa = ang + off;
          ctx.projectiles.push({
            uid: nextEntityUid(),
            owner: "enemy",
            x: e.x + Math.cos(sa) * 7,
            y: e.y - 8 + Math.sin(sa) * 5,
            vx: Math.cos(sa) * 160,
            vy: Math.sin(sa) * 160,
            angle: sa,
            radius: 4,
            damage: Math.round(e.atk * 0.85),
            crit: false,
            pierce: 0,
            life: 0,
            maxLife: 1.6,
            preset: "proj-void",
            hitSet: new Set(),
          });
        }
      }
      return;
    }

    // Generic fallback
    if (ai === "ranged") {
      this._startEnemyAnim(e, "ember_cast", 0.4, ang);
      e.aiTimer = 1.65;
      const preset = e.biome === "amber" ? "proj-fireball" : "proj-void";
      ctx.projectiles.push({
        uid: nextEntityUid(),
        owner: "enemy",
        x: e.x,
        y: e.y - 4,
        vx: Math.cos(ang) * 145,
        vy: Math.sin(ang) * 145,
        angle: ang,
        radius: 4,
        damage: e.atk,
        crit: false,
        pierce: 0,
        life: 0,
        maxLife: 1.8,
        preset,
        hitSet: new Set(),
      });
    } else if (distToPlayer <= 42) {
      e.aiTimer = 1.8;
    }
  }

  private _updateBossAi(
    ctx: CombatContext,
    b: EnemyEntity,
    ai: "boss_warden" | "boss_root" | "boss_amber" | "boss_eraser",
    toPlayerAng: number,
    moveSpd: number,
    distToPlayer: number,
    dt: number
  ) {
    const { player, vfx, world, spawner, colorSys } = ctx;

    // Meadow Waypoint Synergy: if wp_meadow_west is unlocked, player gets soothing Wind Stamina regen!
    if (ai === "boss_warden" && colorSys.unlockedWaypoints.has("wp_meadow_west")) {
      player.stamina = Math.min(player.maxStamina, player.stamina + 9 * dt);
    }

    // Phase Transitions & Bleach Shield Refill!
    if (ai === "boss_eraser") {
      // 3-Phase World Boss:
      // - Phase 2 (65% HP): 4 Classic Elemental Totems (fire, ice, nature, volt)
      // - Phase 3 (30% HP): 4 Primordial Expanded Totems (void, chroma, wind, quake)
      if (b.hp <= b.maxHp * 0.65 && b.phase === 1) {
        b.phase = 2;
        b.bleachShield = b.maxBleachShield;
        b.enrageBuffTime = 8.0;
        b.totemChannelTimer = 12.0;
        spawner.spawnEraserTotems(b.homeX, b.homeY, vfx, 2);
        sfx.playBossRoar();
        ctx.notify(
          "THE ERASER vào PHASE 2! Đánh thắp sáng >= 2/4 Trụ Cơ Bản (Hỏa/Băng/Mộc/Lôi) trong 12s để bắn vỡ Khiên Vô Sắc!",
          "warn"
        );
      } else if (b.hp <= b.maxHp * 0.3 && b.phase === 2) {
        b.phase = 3;
        b.bleachShield = Math.round(b.maxBleachShield * 1.15);
        b.enrageBuffTime = 10.0;
        b.totemChannelTimer = 12.0;
        spawner.spawnEraserTotems(b.homeX, b.homeY, vfx, 3);
        sfx.playBossRoar();
        ctx.notify(
          "THE ERASER vào PHASE 3 NGUYÊN SINH! Thắp sáng >= 2 Trụ Nguyên Sinh (Hư Không/Sắc Độ/Gió/Chấn Động) để kích Đại Cộng Hưởng!",
          "epic"
        );
      }

      if (b.totemChannelTimer > 0) {
        b.totemChannelTimer -= dt;
        if (b.totemChannelTimer <= 0 && spawner.arenaTotems.length > 0) {
          spawner.arenaTotems.length = 0;
          sfx.playExplosion();
          ctx.addShake(6.0);
          vfx.spawnLive("pixtel/boss-telegraph", {
            x: b.x,
            y: b.y,
            options: { radius: 85, shape: "circle", palette: PAL.neon },
            priority: 6,
            maxLife: 0.9,
          });
          ctx.hazards.push({
            uid: nextEntityUid(),
            owner: "enemy",
            kind: "boss_erase",
            x: player.x,
            y: player.y,
            radius: 62,
            delay: 0.85,
            age: 0,
            maxLife: 1.1,
            tickTimer: 0,
            damage: Math.round(b.atk * 1.75),
            triggered: false,
          });
          ctx.notify("Chu kỳ rút sắc hoàn tất! Lướt Dash né Xung Kích Tẩy Trắng!", "warn");
        }
      }
    } else if (b.hp <= b.maxHp * 0.55 && b.phase === 1) {
      b.phase = 2;
      b.bleachShield = b.maxBleachShield;
      b.enrageBuffTime = 9.0; // Stripped by Void / Void Flare Burst!
      sfx.playBossRoar();
      ctx.notify(
        `${ENEMIES[b.defId]?.name ?? "BOSS"} vào GIAI ĐOẠN 2 (Cuồng Nộ & Giáp Trắng)! Dùng Chấn Động / Quá Tải phá giáp hoặc Hư Không xóa buff!`,
        "warn"
      );
    }

    const enraged = b.phase >= 2;
    const speedBoost = b.phase === 3 ? 1.32 : enraged ? 1.18 : 1.0;

    if (distToPlayer > 46) {
      world.moveWithCollision(
        b,
        Math.cos(toPlayerAng) * moveSpd * speedBoost * dt,
        Math.sin(toPlayerAng) * moveSpd * speedBoost * dt,
        b.radius * 0.7
      );
    }

    // Radial / Crescent Projectile Volley & Boss Signature Attacks (with Disrupt accuracy jitter)
    if (b.aiTimer <= 0) {
      b.aiTimer = b.phase === 3 ? 1.9 : enraged ? 2.3 : 3.0;
      const disruptJitter = b.disruptTime > 0 ? (Math.random() - 0.5) * 0.42 : 0;

      if (ai === "boss_warden") {
        // Hộ Vệ Cổ Thụ: Cầu Lục Bảo fired from chest heart!
        this._startEnemyAnim(b, "emerald_orb", 0.54, toPlayerAng);
        const count = enraged ? 5 : 3;
        const mid = Math.floor(count / 2);
        const hx = b.x + Math.cos(toPlayerAng) * 10;
        const hy = b.y - 20 + Math.sin(toPlayerAng) * 4;
        vfx.spawnPooled("heal-burst", { x: hx, y: hy, scale: 0.95 });
        for (let k = 0; k < 8; k++) {
          const sa = toPlayerAng + (Math.random() - 0.5) * 0.9;
          vfx.spawnPixelDot(hx, hy, Math.cos(sa) * 75, Math.sin(sa) * 58, "#88ffaa", 0.28, 2);
        }
        for (let i = 0; i < count; i++) {
          const a = toPlayerAng + (i - mid) * 0.25 + disruptJitter;
          ctx.projectiles.push({
            uid: nextEntityUid(),
            owner: "enemy",
            x: b.x + Math.cos(a) * 10,
            y: b.y - 20 + Math.sin(a) * 6,
            vx: Math.cos(a) * (i === mid ? 165 : 152),
            vy: Math.sin(a) * (i === mid ? 165 : 152),
            angle: a,
            radius: i === mid ? 6 : 5,
            damage: Math.round(b.atk * (i === mid ? 0.95 : 0.82)),
            crit: false,
            pierce: 0,
            life: 0,
            maxLife: 2.0,
            preset: i === mid ? "proj-emerald" : "proj-poison",
            hitSet: new Set(),
          });
        }
      } else if (ai === "boss_root") {
        // Rồng Lăng Kính: Hơi Thở Lăng Kính (Prism Breath Beam + crackling lightning + crystal spread)!
        this._startEnemyAnim(b, "prism_breath", 0.78, toPlayerAng);
        const offX = Math.cos(toPlayerAng) * 14;
        const offY = -22 + Math.sin(toPlayerAng) * 8;
        const beamAng = toPlayerAng + disruptJitter;
        vfx.spawnLive("pixtel/prism-beam", {
          x: b.x + offX,
          y: b.y + offY,
          follow: b,
          offsetX: offX,
          offsetY: offY,
          angle: beamAng,
          startTime: 0.04,
          maxLife: 0.74,
          options: { length: 160 },
          priority: 5,
        });
        for (const frac of [0.42, 0.78]) {
          vfx.spawnPooled("zap-hit", {
            x: b.x + offX + Math.cos(beamAng) * 145 * frac,
            y: b.y + offY + Math.sin(beamAng) * 145 * frac,
            scale: 0.72,
          });
        }
        this._enemyLineHitPlayer(ctx, b, beamAng, 158, 14, 1.05);
        for (let i = -1; i <= 1; i++) {
          const a = toPlayerAng + i * 0.22 + disruptJitter;
          ctx.projectiles.push({
            uid: nextEntityUid(),
            owner: "enemy",
            x: b.x + offX,
            y: b.y + offY,
            vx: Math.cos(a) * 165,
            vy: Math.sin(a) * 165,
            angle: a,
            radius: 5,
            damage: Math.round(b.atk * 0.75),
            crit: false,
            pierce: 0,
            life: 0,
            maxLife: 1.8,
            preset: i === 0 ? "proj-laser" : "proj-icelance",
            hitSet: new Set(),
          });
        }
      } else {
        if (ai === "boss_amber") {
          this._startEnemyAnim(b, "ember_volley", 0.5, toPlayerAng);
          vfx.spawnPooled("explode-fire", { x: b.x, y: b.y - 10, scale: 0.85 });
        } else {
          this._startEnemyAnim(b, "void_barrage", 0.52, toPlayerAng);
          vfx.spawnLive("scifi/glitch", { x: b.x, y: b.y - 10, follow: b, offsetY: -10, priority: 3, maxLife: 0.45 });
        }
        const count = ai === "boss_eraser" ? (b.phase === 3 ? 12 : 9) : enraged ? 8 : 6;
        const preset = ai === "boss_amber" ? "proj-fireball" : "proj-void";
        for (let i = 0; i < count; i++) {
          const a = toPlayerAng + (i * Math.PI * 2) / count + disruptJitter;
          ctx.projectiles.push({
            uid: nextEntityUid(),
            owner: "enemy",
            x: b.x,
            y: b.y - 6,
            vx: Math.cos(a) * 140,
            vy: Math.sin(a) * 140,
            angle: a,
            radius: 5,
            damage: Math.round(b.atk * 0.85),
            crit: false,
            pierce: 0,
            life: 0,
            maxLife: 2.0,
            preset,
            hitSet: new Set(),
          });
        }
      }
    }

    // Telegraphed Signature Specials
    if (b.specialTimer <= 0) {
      b.specialTimer = b.phase === 3 ? 2.8 : enraged ? 3.3 : 4.3;

      if (ai === "boss_warden") {
        // Hộ Vệ Cổ Thụ: Rễ Trồi Mặt Đất / Bão Lá Cổ Thụ!
        const alt = (b.skillCycle++) & 1;
        if (alt === 0) {
          this._startEnemyAnim(b, "ground_roots", 0.68, toPlayerAng);
          for (let k = 0; k < (enraged ? 4 : 3); k++) {
            const tx = b.x + Math.cos(toPlayerAng) * (32 + k * 28);
            const ty = b.y + Math.sin(toPlayerAng) * (32 + k * 28);
            vfx.spawnLive("pixtel/boss-telegraph", {
              x: tx,
              y: ty,
              options: { radius: 26, shape: "circle", palette: PAL.poison },
              priority: 5,
              maxLife: 0.82,
            });
            ctx.hazards.push({
              uid: nextEntityUid(),
              owner: "enemy",
              kind: "boss_thorns",
              x: tx,
              y: ty,
              radius: 28,
              delay: 0.74,
              age: 0,
              maxLife: 1.0,
              tickTimer: 0,
              damage: Math.round(b.atk * 1.25),
              triggered: false,
            });
          }
        } else {
          this._startEnemyAnim(b, "leaf_storm", 0.85, toPlayerAng, true);
          vfx.spawnLive("pixtel/leaf-storm", {
            x: b.x,
            y: b.y - 20,
            follow: b,
            offsetX: 0,
            offsetY: -20,
            maxLife: 0.92,
            priority: 5,
          });
          this._enemyConeHitPlayer(ctx, b, toPlayerAng, 58, Math.PI, 1.32);
        }
      } else if (ai === "boss_root") {
        // Rồng Lăng Kính: Mưa Mảnh Khúc Xạ / Bão Cầu Vồng Tinh Thể!
        const alt = (b.skillCycle++) & 1;
        if (alt === 0) {
          this._startEnemyAnim(b, "refract_rain", 0.72, toPlayerAng);
          vfx.spawnPooled("ice-nova", { x: b.x, y: b.y - 4, scale: 0.85 });
          for (let k = 0; k < (enraged ? 4 : 3); k++) {
            const tx = player.x + (k === 0 ? 0 : (Math.random() - 0.5) * 72);
            const ty = player.y + (k === 0 ? 0 : (Math.random() - 0.5) * 72);
            vfx.spawnLive("pixtel/boss-telegraph", {
              x: tx,
              y: ty,
              options: { radius: 28, shape: "circle", palette: PAL.ice },
              priority: 5,
              maxLife: 0.9,
            });
            ctx.hazards.push({
              uid: nextEntityUid(),
              owner: "enemy",
              kind: "skyfall_crystal",
              x: tx,
              y: ty,
              radius: 30,
              delay: 0.85,
              age: 0,
              maxLife: 1.15,
              tickTimer: 0,
              damage: Math.round(b.atk * 1.28),
              triggered: false,
            });
          }
        } else {
          this._startEnemyAnim(b, "rainbow_storm", 0.9, toPlayerAng, true);
          vfx.spawnLive("pixtel/rainbow-burst", {
            x: b.x,
            y: b.y - 22,
            follow: b,
            offsetX: 0,
            offsetY: -22,
            maxLife: 0.9,
            priority: 5,
          });
          vfx.spawnLive("pixtel/prism-storm", {
            x: b.x,
            y: b.y - 20,
            follow: b,
            offsetX: 0,
            offsetY: -20,
            maxLife: 1.05,
            priority: 4,
          });
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2;
            ctx.projectiles.push({
              uid: nextEntityUid(),
              owner: "enemy",
              x: b.x,
              y: b.y - 20,
              vx: Math.cos(a) * 145,
              vy: Math.sin(a) * 145,
              angle: a,
              radius: 5,
              damage: Math.round(b.atk * 0.9),
              crit: false,
              pierce: 0,
              life: 0,
              maxLife: 1.8,
              preset: k % 2 === 0 ? "proj-amber" : "proj-icelance",
              hitSet: new Set(),
            });
          }
        }
      } else if (ai === "boss_amber") {
        // Gilded Null (Qiongqi): Molten Slam + Flame Trails!
        this._startEnemyAnim(b, "molten_slam", 0.82, toPlayerAng);
        vfx.spawnLive("pixtel/boss-telegraph", {
          x: b.x,
          y: b.y,
          options: { radius: 52, shape: "circle", palette: PAL.fire },
          priority: 5,
          maxLife: 0.9,
        });
        ctx.hazards.push({
          uid: nextEntityUid(),
          owner: "enemy",
          kind: "boss_slam",
          x: b.x,
          y: b.y,
          radius: 56,
          delay: 0.85,
          age: 0,
          maxLife: 1.1,
          tickTimer: 0,
          damage: Math.round(b.atk * 1.35),
          vfxPreset: "ground-slam-fire",
          triggered: false,
        });
        if (enraged) {
          ctx.hazards.push({
            uid: nextEntityUid(),
            owner: "enemy",
            kind: "flame_trail",
            x: b.x,
            y: b.y,
            radius: 30,
            delay: 0,
            age: 0,
            maxLife: 3.5,
            tickTimer: 0.3,
            damage: Math.round(b.atk * 0.55),
            triggered: true,
          });
        }
      } else {
        // World Boss THE ERASER: Floor Erase Zones + Cross / Diagonal Lasers!
        this._startEnemyAnim(b, "erase_cast", 0.85, toPlayerAng);
        for (let k = 0; k < (b.phase === 3 ? 4 : 3); k++) {
          const tx = player.x + (k === 0 ? 0 : (Math.random() - 0.5) * 92);
          const ty = player.y + (k === 0 ? 0 : (Math.random() - 0.5) * 92);
          vfx.spawnLive("pixtel/boss-telegraph", {
            x: tx,
            y: ty,
            options: { radius: 32, shape: "circle", palette: PAL.neon },
            priority: 5,
            maxLife: 1.0,
          });
          ctx.hazards.push({
            uid: nextEntityUid(),
            owner: "enemy",
            kind: "boss_erase",
            x: tx,
            y: ty,
            radius: 34,
            delay: 0.92,
            age: 0,
            maxLife: 1.2,
            tickTimer: 0,
            damage: Math.round(b.atk * 1.45),
            triggered: false,
          });
        }

        if (enraged) {
          const isDiag = b.phase === 3 && Math.random() < 0.5;
          vfx.spawnLive("pixtel/boss-telegraph", {
            x: b.x,
            y: b.y,
            options: { radius: 38, shape: "cross", palette: PAL.neon },
            priority: 5,
            maxLife: 1.05,
          });
          ctx.hazards.push({
            uid: nextEntityUid(),
            owner: "enemy",
            kind: isDiag ? "boss_rot_cross" : "boss_cross",
            x: b.x,
            y: b.y,
            radius: 95,
            delay: 0.98,
            age: 0,
            maxLife: 1.25,
            tickTimer: 0,
            damage: Math.round(b.atk * 1.5),
            triggered: false,
          });
        }
      }
    }
  }

  private _findNearestEnemy(
    enemies: EnemyEntity[],
    x: number,
    y: number,
    maxRange: number
  ): EnemyEntity | null {
    let best: EnemyEntity | null = null;
    let bestD = maxRange;
    for (const e of enemies) {
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }
}
