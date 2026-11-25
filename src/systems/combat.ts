import { getClassDef } from "../data/classes";
import { ENEMIES } from "../data/enemies";
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
  EnemyEntity,
  HazardEntity,
  PlayerEntity,
  ProjectileEntity,
  TurretEntity,
} from "../world/entities";
import type { WorldMap } from "../world/worldMap";
import { WorldSpawner, nextEntityUid } from "../world/spawner";
import type { ColorRestorationSystem } from "../graphics/colorRestoration";
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
  getBossLock?: () => ActiveBossLock | null;
  onBossLockTrigger?: (enemy: EnemyEntity) => void;
  onBossDefeated: (enemy: EnemyEntity) => void;
  onPlayerDefeated: () => void;
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
    const bleachPenalty = player.bleachDebuffTime > 0 && isElemental ? -25 : 0;
    const elemMult = isElemental
      ? Math.max(0.65, 1 + ((player.elementBonus || 0) + coatingBonus + bloomBonus + bleachPenalty) / 100)
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

  /** Triggered on normal LMB press: 3-step combo rhythm for all 4 Classes! */
  performPrimaryAttack(ctx: CombatContext) {
    const { player, vfx } = ctx;
    if (player.atkCd > 0) return;

    const cdef = getClassDef(player.classId);
    const speedFactor = player.cloneTime > 0 ? 0.5 : 1.0;
    player.atkCd = cdef.baseStats.atkCooldown * speedFactor;
    player.attackAnimTime = 0.18;

    const step = player.comboStep % 3;
    player.comboStep = (step + 1) % 3;
    player.comboTimer = 0.95;
    if (step === 2) {
      player.quickChargeTimer = 1.3; // Quick-Charge window unlocked after N3!
    }

    const isFinisher = step === 2;
    const bonusElem = this._resolveWeaponElement(ctx, isFinisher);
    const ang = player.aimAngle;
    this._syncFacingFromAngle(player, ang);

    // Unarmed Bare-Handed Punch Combo when no Weapon is equipped
    if (!ctx.inv.equipment.weapon) {
      const punchMults = [0.72, 0.85, 1.1];
      sfx.playPunch();
      vfx.spawnPooled(isFinisher ? "crit-gold" : "hit-cyan", {
        x: player.x + Math.cos(ang) * 14,
        y: player.y - 4 + Math.sin(ang) * 14,
        scale: 0.72,
      });
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
      const pals = [PAL.cyber, PAL.water, PAL.volt];
      const knightElem: ElementType | undefined = isFinisher ? (bonusElem ?? "quake") : bonusElem;

      vfx.spawnLive(modIds[step], {
        x: player.x + Math.cos(ang) * 8,
        y: player.y + Math.sin(ang) * 8,
        angle: ang,
        flip: false,
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
      this._spawnPlayerProj(ctx, {
        x: player.x + Math.cos(ang) * 10,
        y: player.y - 4 + Math.sin(ang) * 10,
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
      vfx.spawnLive(isFinisher ? "melee/spin-slash" : "melee/dagger-flurry", {
        x: player.x + Math.cos(ang) * 6,
        y: player.y + Math.sin(ang) * 6,
        angle: ang,
        options: { palette: PAL.neon },
        priority: 2,
      });
      this._meleeArcHit(
        ctx,
        player.x,
        player.y,
        ang,
        isFinisher ? 38 : 30,
        1.3,
        isFinisher ? 1.15 : 0.82,
        "hit-gold",
        rogueElem,
        1.1,
        isFinisher
      );

      const fan = isFinisher ? [-0.14, 0, 0.14] : [0];
      for (const off of fan) {
        const { dmg, crit } = this._rollDamage(
          ctx,
          isFinisher ? 0.78 : 0.92,
          isFinisher ? 10 : 0,
          !!rogueElem,
          undefined,
          true
        );
        this._spawnPlayerProj(ctx, {
          x: player.x + Math.cos(ang) * 9,
          y: player.y - 3 + Math.sin(ang) * 9,
          angle: ang + off,
          speed: 285,
          radius: 5,
          damage: dmg,
          crit,
          pierce: 1,
          maxLife: 0.72,
          preset: "proj-shuriken",
          element: rogueElem,
          hitPreset: rogueElem ? ELEMENT_HIT_PRESET[rogueElem] : "hit-cyan",
        });
      }

      if (player.cloneTime > 0) {
        const echo = this._rollDamage(ctx, 0.65);
        this._spawnPlayerProj(ctx, {
          x: player.x - Math.cos(ang) * 8,
          y: player.y - 3 - Math.sin(ang) * 8,
          angle: ang + (Math.random() - 0.5) * 0.14,
          speed: 295,
          radius: 5,
          damage: echo.dmg,
          crit: echo.crit,
          pierce: 1,
          maxLife: 0.72,
          preset: "proj-shuriken",
          element: rogueElem,
          hitPreset: "hit-gold",
        });
      }
      player.chromaCounterTimer = 0;
      return;
    }

    if (player.classId === "pixel_tinker") {
      sfx.playShoot(isFinisher ? 880 : 720);
      vfx.spawnPooled("muzzle-pistol", {
        x: player.x + Math.cos(ang) * 11,
        y: player.y - 4 + Math.sin(ang) * 11,
        angle: ang,
      });
      const tinkerElem: ElementType | undefined = isFinisher ? (bonusElem ?? "volt") : bonusElem;
      const { dmg, crit } = this._rollDamage(ctx, isFinisher ? 1.25 : 0.95, 0, !!tinkerElem, undefined, true);
      this._spawnPlayerProj(ctx, {
        x: player.x + Math.cos(ang) * 11,
        y: player.y - 4 + Math.sin(ang) * 11,
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
    player.attackAnimTime = 0.24;
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
      sfx.playPunch();
      vfx.spawnPooled("crit-gold", {
        x: player.x + Math.cos(ang) * 16,
        y: player.y - 4 + Math.sin(ang) * 16,
      });
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
      player.dashing = 0.18;
      player.invuln = Math.max(player.invuln, 0.26);
      player.dashVx = Math.cos(ang) * 325;
      player.dashVy = Math.sin(ang) * 325;
      vfx.spawnLive("melee/thrust", {
        x: player.x + Math.cos(ang) * 12,
        y: player.y + Math.sin(ang) * 12,
        angle: ang,
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
          x: player.x + Math.cos(ang) * 10,
          y: player.y - 4 + Math.sin(ang) * 10,
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
      for (let i = -2; i <= 2; i++) {
        const { dmg, crit } = this._rollDamage(ctx, 0.96 * justMult, 18, true, undefined, true);
        this._spawnPlayerProj(ctx, {
          x: player.x + Math.cos(ang) * 8,
          y: player.y - 3 + Math.sin(ang) * 8,
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
      player.chromaCounterTimer = 0;
      return;
    }

    if (player.classId === "pixel_tinker") {
      const railElem: ElementType = bonusElem ?? "quake";
      vfx.spawnLive("pixtel/prism-beam", {
        x: player.x + Math.cos(ang) * 10,
        y: player.y - 4 + Math.sin(ang) * 10,
        angle: ang,
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
      sfx.playBlock();
      vfx.spawnLive("impacts/shield-block", {
        x: player.x,
        y: player.y,
        follow: player,
        options: { palette: PAL.cyber },
        priority: 4,
        maxLife: 1.05,
      });
      this.firePrismBeam(ctx, ang, 1.85, bonusElem ?? "prism");
      return;
    }

    if (player.classId === "chroma_mage") {
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
        y: player.y,
        follow: player,
        priority: 5,
        maxLife: 2.8,
      });
      ctx.notify("BÃO KIẾM ÁNH SÁNG!", "epic");
      return;
    }

    if (player.classId === "chroma_mage") {
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
    vfx.spawnLive("pixtel/prism-beam", {
      x: player.x + Math.cos(angle) * 10,
      y: player.y - 4 + Math.sin(angle) * 10,
      angle,
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
  private _lightArenaTotem(
    ctx: CombatContext,
    totem: { element: InfusableElement; x: number; y: number; lit: boolean; hitFlash: number },
    hitElem?: ElementType
  ) {
    if (totem.lit) return;
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
    const gapMult = levelGap > 2 ? Math.max(0.28, 1 - (levelGap - 2) * 0.12) : 1.0;
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

    const edef = ENEMIES[e.defId];
    ctx.stats.kills += 1;

    ctx.vfx.spawnPooled(e.isBoss ? "explode-plasma" : "death-poof", { x: e.x, y: e.y - 6 });
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
      ctx.stats.bossesDefeated += 1;
      ctx.onBossDefeated(e);
    }
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
    appliesBleach = false
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

    const mitigated = Math.max(2, Math.round(rawAmount - player.def * 0.6));
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
      player.stormTime -= dt;
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
          ctx.projectiles.splice(i, 1);
          continue;
        }
        for (const t of ctx.turrets) {
          if (Math.hypot(t.x - p.x, t.y - 4 - p.y) <= 9 + p.radius) {
            t.hp -= p.damage;
            t.hitFlash = 0.12;
            vfx.spawnPooled("hit-fire", { x: t.x, y: t.y - 4 });
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
          else if (h.kind === "boss_slam" || h.kind === "boss_cone") vfx.spawnPooled("ground-slam", { x: h.x, y: h.y });
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

      const distToPlayer = Math.hypot(player.x - e.x, player.y - e.y);
      const distToHome = Math.hypot(e.homeX - e.x, e.homeY - e.y);

      if (distToPlayer > 460 && e.state === "patrol") continue;

      if (e.state === "patrol") {
        if (!playerInTown && distToPlayer <= edef.aggroRadius) {
          e.state = "aggro";
          if (e.isBoss) sfx.playBossRoar();
        }
      } else if (e.state === "aggro") {
        if (playerInTown || distToHome > edef.leashRadius || distToPlayer > edef.leashRadius + 60) {
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
        e.facing = Math.cos(ang) < 0 ? -1 : 1;
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
          e.facing = Math.cos(ang) < 0 ? -1 : 1;
          world.moveWithCollision(e, Math.cos(ang) * moveSpd * 0.42 * dt, Math.sin(ang) * moveSpd * 0.42 * dt, e.radius * 0.7);
          e.walkTime += dt * 0.6;
        }
        continue;
      }

      // === AGGRO COMBAT AI ===
      const toPlayerAng = Math.atan2(player.y - e.x + (e.x - e.x), player.x - e.x);
      const rawAng = Math.atan2(player.y - e.y, player.x - e.x);
      void toPlayerAng;
      e.facing = Math.cos(rawAng) < 0 ? -1 : 1;
      const cdRate = e.disruptTime > 0 ? 0.68 : 1.0; // Disrupt slows enemy attack cadence by ~32%!
      e.aiTimer -= dt * cdRate;
      e.specialTimer -= dt * cdRate;
      e.walkTime += dt;

      if (edef.ai === "ranged") {
        const idealDist = 92;
        if (distToPlayer > idealDist + 15) {
          world.moveWithCollision(e, Math.cos(rawAng) * moveSpd * dt, Math.sin(rawAng) * moveSpd * dt, e.radius * 0.7);
        } else if (distToPlayer < idealDist - 22) {
          world.moveWithCollision(e, -Math.cos(rawAng) * moveSpd * 0.7 * dt, -Math.sin(rawAng) * moveSpd * 0.7 * dt, e.radius * 0.7);
        }
        if (e.aiTimer <= 0) {
          e.aiTimer = 1.65;
          const jitter = e.disruptTime > 0 ? (Math.random() - 0.5) * 0.5 : 0;
          const shotAng = rawAng + jitter;
          const preset = e.biome === "amber" ? "proj-amber" : "proj-void";
          ctx.projectiles.push({
            uid: nextEntityUid(),
            owner: "enemy",
            x: e.x,
            y: e.y - 4,
            vx: Math.cos(shotAng) * 145,
            vy: Math.sin(shotAng) * 145,
            angle: shotAng,
            radius: 4,
            damage: e.atk,
            crit: false,
            pierce: 0,
            life: 0,
            maxLife: 1.8,
            preset,
            hitSet: new Set(),
          });
        }
      } else if (edef.ai === "flanker") {
        const strafe = rawAng + Math.sin(e.walkTime * 3.2) * 0.65;
        world.moveWithCollision(e, Math.cos(strafe) * moveSpd * dt, Math.sin(strafe) * moveSpd * dt, e.radius * 0.7);
      } else if (
        edef.ai === "boss_warden" ||
        edef.ai === "boss_root" ||
        edef.ai === "boss_amber" ||
        edef.ai === "boss_eraser"
      ) {
        this._updateBossAi(ctx, e, edef.ai, rawAng, moveSpd, distToPlayer, dt);
      } else {
        world.moveWithCollision(e, Math.cos(rawAng) * moveSpd * dt, Math.sin(rawAng) * moveSpd * dt, e.radius * 0.7);
      }

      // Contact damage (with Chroma Dodge grace check!)
      const contactDist = player.perfectDashWindow > 0 ? e.radius + player.radius + 5 : e.radius + player.radius;
      if (distToPlayer <= contactDist) {
        this.damagePlayer(ctx, e.atk, e.x, e.y);
      }
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

    // Radial / Crescent Projectile Volley (with Disrupt accuracy jitter if affected by Void Arc!)
    if (b.aiTimer <= 0) {
      b.aiTimer = b.phase === 3 ? 1.9 : enraged ? 2.3 : 3.0;
      const count = ai === "boss_warden" ? (enraged ? 5 : 3) : ai === "boss_eraser" ? (b.phase === 3 ? 12 : 9) : enraged ? 8 : 6;
      const preset = ai === "boss_amber" ? "proj-amber" : ai === "boss_warden" ? "proj-shuriken" : "proj-void";
      const disruptJitter = b.disruptTime > 0 ? (Math.random() - 0.5) * 0.42 : 0;

      for (let i = 0; i < count; i++) {
        const a =
          (ai === "boss_warden"
            ? toPlayerAng + (i - Math.floor(count / 2)) * 0.28
            : toPlayerAng + (i * Math.PI * 2) / count) + disruptJitter;
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

    // Telegraphed Signature Specials
    if (b.specialTimer <= 0) {
      b.specialTimer = b.phase === 3 ? 2.8 : enraged ? 3.3 : 4.3;

      if (ai === "boss_warden") {
        // Xing Warden: Wide War-Axe Cone Cleave + Enraged Leap Slam!
        const aimX = b.x + Math.cos(toPlayerAng) * 26;
        const aimY = b.y + Math.sin(toPlayerAng) * 26;
        vfx.spawnLive("pixtel/boss-telegraph", {
          x: aimX,
          y: aimY,
          options: { radius: 44, shape: "circle", palette: PAL.blood },
          priority: 5,
          maxLife: 0.85,
        });
        ctx.hazards.push({
          uid: nextEntityUid(),
          owner: "enemy",
          kind: "boss_cone",
          x: b.x,
          y: b.y,
          radius: 58,
          angle: toPlayerAng,
          delay: 0.8,
          age: 0,
          maxLife: 1.0,
          tickTimer: 0,
          damage: Math.round(b.atk * 1.3),
          triggered: false,
        });
        if (enraged) {
          vfx.spawnLive("pixtel/boss-telegraph", {
            x: player.x,
            y: player.y,
            options: { radius: 36, shape: "circle", palette: PAL.volt },
            priority: 5,
            maxLife: 0.95,
          });
          ctx.hazards.push({
            uid: nextEntityUid(),
            owner: "enemy",
            kind: "boss_slam",
            x: player.x,
            y: player.y,
            radius: 38,
            delay: 0.9,
            age: 0,
            maxLife: 1.1,
            tickTimer: 0,
            damage: Math.round(b.atk * 1.35),
            triggered: false,
          });
        }
      } else if (ai === "boss_root") {
        // Blight Root: Root Traps + Phase 2 Crystal Skyfall!
        for (let k = 0; k < 3; k++) {
          const tx = player.x + (k === 0 ? 0 : (Math.random() - 0.5) * 68);
          const ty = player.y + (k === 0 ? 0 : (Math.random() - 0.5) * 68);
          vfx.spawnLive("pixtel/boss-telegraph", {
            x: tx,
            y: ty,
            options: { radius: 28, shape: "circle", palette: PAL.blood },
            priority: 5,
            maxLife: 0.95,
          });
          ctx.hazards.push({
            uid: nextEntityUid(),
            owner: "enemy",
            kind: enraged && k > 0 ? "skyfall_crystal" : "boss_thorns",
            x: tx,
            y: ty,
            radius: 30,
            delay: 0.88,
            age: 0,
            maxLife: 1.15,
            tickTimer: 0,
            damage: Math.round(b.atk * 1.28),
            triggered: false,
          });
        }
      } else if (ai === "boss_amber") {
        // Gilded Null (Qiongqi): Ground Slam + Molten Flame Trails!
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
