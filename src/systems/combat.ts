import { getClassDef } from "../data/classes";
import { ENEMIES } from "../data/enemies";
import { ITEMS, RARITY_INFO } from "../data/items";
import { rollEnemyDropTable } from "../data/lootTables";
import { CHROMA_RAINBOW } from "../data/worldConfig";
import type { ElementType, InfusableElement } from "../data/types";
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

const CHROMA_CYCLE: readonly InfusableElement[] = ["fire", "ice", "nature", "volt"];

const ELEMENT_HIT_PRESET: Record<ElementType, string> = {
  fire: "hit-fire",
  ice: "hit-ice",
  poison: "hit-poison",
  nature: "hit-poison",
  volt: "zap-hit",
  prism: "crit-gold",
};

function normalizeElem(el: ElementType): "fire" | "ice" | "nature" | "volt" | "prism" {
  return el === "poison" ? "nature" : el;
}

/**
 * PIXTEL v2.5 Real-Time 60FPS Action Combat Engine:
 * - 4 Classes with 3-step N1->N2->N3 combos, Dash-Offset combo preservation, Quick-Charge & Just-Charge Lv2
 * - Chroma Dodge (Perfect Dash in first 0.14s refunds Stamina, charges Overdrive, empowers Counter)
 * - 5-Element Chroma Reaction Matrix (7 reactions + Chroma Splash world color burst)
 * - Bleach Shield poise breaking -> Vulnerable Boss Stagger, Xing Warden, Blight Root, Gilded Null & 3-Phase Eraser Totems
 * - Equipment passives (Guard Breaker, Reaction Amp, Orbiting Grimoire, Stamina Flow, Undying Totem Charm)
 */
export class CombatSystem {
  private _rollDamage(
    ctx: CombatContext,
    mult = 1,
    extraCrit = 0,
    isElemental = false,
    target?: EnemyEntity
  ): { dmg: number; crit: boolean; counterUsed: boolean } {
    const { player, colorSys } = ctx;
    const buffMult = player.atkBuffTime > 0 ? 1 + (player.atkBuffPct || 0.3) : 1.0;
    const counterUsed = player.chromaCounterTimer > 0;
    const counterMult = counterUsed ? 1.55 : 1.0;
    const coatingBonus = player.coatingTime > 0 ? 20 : 0;
    const bleachPenalty = player.bleachDebuffTime > 0 && isElemental ? -25 : 0;
    const elemMult = isElemental
      ? Math.max(0.65, 1 + ((player.elementBonus || 0) + coatingBonus + bleachPenalty) / 100)
      : 1.0;

    // Chroma-Walker Resonance when >= 8 Waypoints are awakened against World Boss!
    const resonanceMult =
      target?.isWorldBoss && colorSys.unlockedWaypoints.size >= 8 ? 1.2 : 1.0;
    // +10 Weapon bonus vs Bosses
    const wpnLv = ctx.inv.getWeaponEnhanceLevel();
    const bossSlayerMult = target?.isBoss && wpnLv >= 10 ? 1.2 : 1.0;

    const vulnCrit = target && target.vulnTime > 0 ? 15 : 0;
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
      resonanceMult *
      bossSlayerMult *
      (0.94 + Math.random() * 0.12);

    return {
      dmg: Math.max(1, Math.round(crit ? base * player.critMult : base)),
      crit,
      counterUsed,
    };
  }

  /** Resolves bonus element from Chroma Coating [4], +5 Infused Weapon, +10 Prismatic Awakening, or Chroma Counter. */
  private _resolveWeaponElement(
    ctx: CombatContext,
    isHeavyOrFinisher: boolean
  ): ElementType | undefined {
    const { player, inv } = ctx;
    const wpn = inv.equipment.weapon;
    if (wpn && wpn.enhanceLevel >= 10 && isHeavyOrFinisher) {
      return "prism";
    }
    if (player.coatingTime > 0) {
      const next = CHROMA_CYCLE[player.elementIdx % CHROMA_CYCLE.length];
      player.elementIdx = (player.elementIdx + 1) % CHROMA_CYCLE.length;
      player.coatingElement = next;
      return next;
    }
    if (player.chromaCounterTimer > 0) {
      if (wpn && wpn.enhanceLevel >= 5 && wpn.infusedElement) return wpn.infusedElement;
      return "volt";
    }
    if (isHeavyOrFinisher && wpn && wpn.enhanceLevel >= 5 && wpn.infusedElement) {
      return wpn.infusedElement;
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

    if (player.classId === "prism_knight") {
      const mults = [1.0, 1.18, 1.6];
      const radii = [40, 44, 54];
      const modIds = ["melee/sword-slash", "melee/double-slash", "melee/heavy-cleave"];
      const pals = [PAL.cyber, PAL.water, PAL.volt];

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
        bonusElem ? ELEMENT_HIT_PRESET[bonusElem] : "hit-cyan",
        bonusElem,
        isFinisher ? 1.55 : 1.0,
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
          : CHROMA_CYCLE[player.elementIdx % CHROMA_CYCLE.length];
      player.elementIdx = (player.elementIdx + 1) % CHROMA_CYCLE.length;
      const preset =
        elem === "fire"
          ? "proj-fireball"
          : elem === "ice"
            ? "proj-icelance"
            : elem === "volt" || elem === "prism"
              ? "proj-amber"
              : "proj-poison";
      const { dmg, crit } = this._rollDamage(ctx, isFinisher ? 1.32 : 1.05, 0, true);
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
        isFinisher ? 36 : 30,
        1.3,
        isFinisher ? 1.15 : 0.82,
        "hit-gold",
        bonusElem,
        1.1,
        isFinisher
      );

      // N3 throws 3-fan shurikens; N1/N2 throws 1 fast piercing shuriken
      const fan = isFinisher ? [-0.14, 0, 0.14] : [0];
      for (const off of fan) {
        const { dmg, crit } = this._rollDamage(ctx, isFinisher ? 0.78 : 0.92, isFinisher ? 10 : 0, !!bonusElem);
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
          element: bonusElem,
          hitPreset: bonusElem ? ELEMENT_HIT_PRESET[bonusElem] : "hit-cyan",
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
          element: bonusElem,
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
      const tinkerElem: ElementType | undefined = isFinisher ? bonusElem ?? "volt" : bonusElem;
      const { dmg, crit } = this._rollDamage(ctx, isFinisher ? 1.25 : 0.95, 0, !!tinkerElem);
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
   * Supports `justCharge` (perfect release window -> bonus DMG, Stamina refund & heavy Poise Break!).
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

    const justMult = justCharge ? 1.26 : 1.0;
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

    if (player.classId === "prism_knight") {
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
        bonusElem ? ELEMENT_HIT_PRESET[bonusElem] : "hit-cyan",
        bonusElem,
        poiseMult
      );
      player.chromaCounterTimer = 0;
      return;
    }

    if (player.classId === "chroma_mage") {
      // Quad/Tri-Elemental Volley -> triggers reactions immediately!
      const count = justCharge ? 4 : 3;
      const spread = 0.2;
      const presets = ["proj-fireball", "proj-icelance", "proj-poison", "proj-amber"];
      for (let i = 0; i < count; i++) {
        const off = (i - (count - 1) / 2) * spread;
        const elem: ElementType =
          ctx.inv.getWeaponEnhanceLevel() >= 10 && i === 1 ? "prism" : CHROMA_CYCLE[i % 4];
        const { dmg, crit } = this._rollDamage(ctx, 1.15 * justMult, justCharge ? 12 : 0, true);
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
      for (let i = -2; i <= 2; i++) {
        const { dmg, crit } = this._rollDamage(ctx, 0.96 * justMult, 18, !!bonusElem);
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
          element: bonusElem,
          hitPreset: "crit-gold",
          poiseMult: 1.4,
        });
      }
      player.chromaCounterTimer = 0;
      return;
    }

    if (player.classId === "pixel_tinker") {
      const railElem: ElementType = bonusElem ?? "volt";
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
        "zap-hit",
        railElem,
        poiseMult
      );
      // Also Overclock any turrets along the rail line!
      for (const t of ctx.turrets) {
        t.overclockTime = 5.5;
        t.hp = t.maxHp;
      }
      player.chromaCounterTimer = 0;
    }
  }

  /** Class active skill [E] */
  performSkillE(ctx: CombatContext) {
    const { player, vfx } = ctx;
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

  /** Class Ultimate [Q] (requires 100% Overdrive) */
  performUltimateQ(ctx: CombatContext) {
    const { player, vfx, colorSys } = ctx;
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
    }
  ) {
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
      hitSet: new Set(),
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
        // Bit Rogue Backstab bonus when striking from behind!
        const behind = player.classId === "bit_rogue" && dx * e.facing > 0;
        const { dmg, crit } = this._rollDamage(
          ctx,
          mult * (behind ? 1.25 : 1.0),
          behind ? 15 : 0,
          !!element,
          e
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
    this._checkHitArenaTotems(ctx, ox, oy, range + 10);

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
        const { dmg, crit } = this._rollDamage(ctx, mult, 10, !!element, e);
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
        this._lightArenaTotem(ctx, totem);
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

  private _checkHitArenaTotems(ctx: CombatContext, x: number, y: number, radius: number) {
    for (const totem of ctx.spawner.arenaTotems) {
      if (totem.lit) continue;
      if (Math.hypot(totem.x - x, totem.y - y) <= radius) {
        this._lightArenaTotem(ctx, totem);
      }
    }
  }

  private _lightArenaTotem(
    ctx: CombatContext,
    totem: { element: InfusableElement; x: number; y: number; lit: boolean; hitFlash: number }
  ) {
    if (totem.lit) return;
    totem.lit = true;
    totem.hitFlash = 0.25;
    sfx.playWaypoint();
    ctx.vfx.spawnPooled("collect-burst", { x: totem.x, y: totem.y - 6 });
    ctx.colorSys.triggerWave(totem.x, totem.y, 72, 220);
    ctx.vfx.spawnDamageText(totem.x, totem.y - 16, "TOTEM LIT!", {
      crit: true,
      color: "#5ef2ff",
    });

    // Check if >= 2 Totems are lit -> Shatter The Eraser's Void Shield!
    const litCount = ctx.spawner.arenaTotems.filter((t) => t.lit).length;
    if (litCount >= 2) {
      const eraser = ctx.spawner.enemies.find((e) => e.defId === "boss_the_eraser");
      if (eraser) {
        for (const t of ctx.spawner.arenaTotems) {
          if (!t.lit) continue;
          const ang = Math.atan2(eraser.y - t.y, eraser.x - t.x);
          const dist = Math.hypot(eraser.x - t.x, eraser.y - t.y);
          ctx.vfx.spawnLive("pixtel/prism-beam", {
            x: t.x,
            y: t.y - 8,
            angle: ang,
            options: { length: dist, palette: PAL.cyber },
            priority: 6,
          });
        }
        ctx.spawner.arenaTotems.length = 0;
        eraser.totemChannelTimer = 0;
        eraser.bleachShield = 0;
        eraser.stunTime = 4.5;
        eraser.vulnTime = 6.0;
        const trueDmg = Math.round(eraser.maxHp * 0.08);
        eraser.hp = Math.max(1, eraser.hp - trueDmg);
        ctx.player.stamina = ctx.player.maxStamina;
        ctx.player.overdrive = Math.min(100, ctx.player.overdrive + 50);
        ctx.colorSys.triggerWave(eraser.x, eraser.y, 260, 320);
        ctx.addShake(6.5);
        ctx.addHitstop(0.08);
        sfx.playExplosion();
        ctx.vfx.spawnDamageText(eraser.x, eraser.y - 22, `PRISM BREAK -${trueDmg}!`, {
          crit: true,
          color: "#ffe066",
        });
        ctx.notify(
          "CỘNG HƯỞNG TRỤ SẮC MÀU! Đã bắn vỡ Khiên Vô Sắc — THE ERASER SỤP ĐỔ (4.5s)!",
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

    const effDef = e.vulnTime > 0 ? e.def * 0.4 : e.def;
    let mitigated = Math.max(2, Math.round(rawDamage - effDef * 0.55));
    if (e.vulnTime > 0) {
      mitigated = Math.round(mitigated * 1.38);
    }

    // Bleach Shield (White Armor) absorbs 45% HP damage until shattered by Poise / Charge / Reactions!
    if (e.bleachShield > 0) {
      const poiseBreak = Math.round(
        rawDamage * poiseMult * (1 + (ctx.player.poiseBreakPct || 0) / 100)
      );
      e.bleachShield = Math.max(0, e.bleachShield - poiseBreak);
      mitigated = Math.max(1, Math.round(mitigated * 0.55));

      if (e.bleachShield <= 0) {
        e.stunTime = e.isBoss ? 2.6 : 1.4;
        e.vulnTime = 4.5;
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

  /**
   * 5-Element Chroma Reaction Matrix (7 Distinct Reactions + Chroma Splash World Color Wave)
   */
  private _applyElement(ctx: CombatContext, e: EnemyEntity, rawIncoming: ElementType) {
    const incoming = normalizeElem(rawIncoming);
    const existing = e.element ? normalizeElem(e.element) : null;

    if (existing && existing !== incoming && e.reactionIcd <= 0) {
      e.reactionIcd = 0.55; // 33 frames @ 60 FPS ICD
      const coatingBonus = ctx.player.coatingTime > 0 ? 20 : 0;
      const elemMult =
        (1 + ((ctx.player.elementBonus || 0) + coatingBonus) / 100) *
        (ctx.player.hasReactionAmp ? 1.25 : 1.0);
      const baseBonus = Math.round(ctx.player.atk * 1.5 * elemMult);

      // Local Chroma Splash pushes back Bleached fog!
      ctx.colorSys.triggerWave(e.x, e.y, 46, 175);
      ctx.stats.reactionsTriggered = (ctx.stats.reactionsTriggered ?? 0) + 1;
      if (ctx.player.hasReactionAmp) {
        ctx.player.overdrive = Math.min(100, ctx.player.overdrive + 6);
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

      // Special Reaction 7: PRISMATIC REFRACTION (preserves existing aura!)
      if (incoming === "prism" || existing === "prism") {
        const prismDmg = Math.round(baseBonus * 1.3);
        e.hp -= prismDmg;
        if (e.bleachShield > 0) e.bleachShield = Math.max(0, e.bleachShield - 65);
        ctx.vfx.spawnPooled("explode-plasma", { x: e.x, y: e.y - 4 });
        ctx.vfx.spawnDamageText(e.x, e.y - 18, `KHÚC XẠ ${prismDmg}!`, {
          crit: true,
          color: "#ff88f2",
        });
        sfx.playExplosion();
        ctx.addShake(3.0);

        const bounceTarget = this._findNearestEnemy(
          ctx.spawner.enemies.filter((o) => o !== e),
          e.x,
          e.y,
          84
        );
        if (bounceTarget) {
          bounceTarget.hp -= Math.round(prismDmg * 0.75);
          bounceTarget.hitFlash = 0.14;
          if (bounceTarget.hp <= 0) this._killEnemy(ctx, bounceTarget);
        }
        return;
      }

      // Consume primer aura for standard 2-element reactions
      e.element = null;
      e.elementTime = 0;
      const pair = [existing, incoming].sort().join("+");

      if (pair === "fire+ice") {
        // 1. THERMAL SHATTER: high burst + DEF shred (vulnTime)
        const dmg = Math.round(baseBonus * 1.25);
        e.hp -= dmg;
        e.vulnTime = Math.max(e.vulnTime, 4.5);
        if (e.bleachShield > 0) e.bleachShield = Math.max(0, e.bleachShield - 45);
        ctx.vfx.spawnPooled("explode-fire", { x: e.x, y: e.y - 4 });
        ctx.vfx.spawnPooled("ice-shatter", { x: e.x, y: e.y - 4 });
        ctx.vfx.spawnDamageText(e.x, e.y - 18, `SỐC NHIỆT ${dmg}!`, {
          crit: true,
          color: "#ff9944",
        });
        sfx.playExplosion();
        ctx.addShake(3.2);
      } else if (pair === "fire+nature") {
        // 2. TOXIC ERUPTION: AoE blast + spawns lingering Acid Pool field!
        const dmg = Math.round(baseBonus * 1.05);
        e.hp -= dmg;
        ctx.vfx.spawnPooled("explode-plasma", { x: e.x, y: e.y - 4 });
        ctx.vfx.spawnDamageText(e.x, e.y - 18, `BÙNG ĐỘC ${dmg}!`, {
          crit: true,
          color: "#66ff66",
        });
        sfx.playExplosion();
        for (const other of [...ctx.spawner.enemies]) {
          if (other === e) continue;
          if (Math.hypot(other.x - e.x, other.y - e.y) <= 56) {
            other.hp -= Math.round(dmg * 0.75);
            other.hitFlash = 0.12;
            if (other.hp <= 0) this._killEnemy(ctx, other);
          }
        }
        ctx.hazards.push({
          uid: nextEntityUid(),
          owner: "player",
          kind: "acid_pool",
          x: e.x,
          y: e.y,
          radius: 34,
          delay: 0,
          age: 0,
          maxLife: 3.5,
          tickTimer: 0.4,
          damage: Math.max(4, Math.round(ctx.player.atk * 0.35)),
          triggered: true,
        });
      } else if (pair === "ice+nature") {
        // 3. CRYO-ROOT: roots normal enemies & deeply slows bosses
        const dmg = Math.round(baseBonus * 1.1);
        e.hp -= dmg;
        e.rootTime = e.isBoss ? 0 : Math.max(e.rootTime, 1.8);
        e.slowTime = Math.max(e.slowTime, 4.0);
        e.poisonTime = Math.max(e.poisonTime, 4.0);
        ctx.vfx.spawnPooled("ice-nova", { x: e.x, y: e.y - 4 });
        ctx.vfx.spawnPooled("acid-splash", { x: e.x, y: e.y - 4 });
        ctx.vfx.spawnDamageText(e.x, e.y - 18, `KẾT TINH ${dmg}!`, {
          crit: true,
          color: "#55f2ff",
        });
        sfx.playExplosion();
      } else if (pair === "ice+volt") {
        // 4. SUPERCONDUCT: chain lightning up to 3 nearby targets + vulnTime + micro-stun
        const dmg = Math.round(baseBonus * 0.95);
        e.hp -= dmg;
        e.vulnTime = Math.max(e.vulnTime, 4.5);
        if (!e.isBoss) e.stunTime = Math.max(e.stunTime, 0.45);
        ctx.vfx.spawnPooled("zap-hit", { x: e.x, y: e.y - 4 });
        ctx.vfx.spawnDamageText(e.x, e.y - 18, `SIÊU DẪN ${dmg}!`, {
          crit: true,
          color: "#78f9ff",
        });
        sfx.playLaser();
        let chains = 0;
        for (const other of [...ctx.spawner.enemies]) {
          if (other === e || chains >= 3) continue;
          if (Math.hypot(other.x - e.x, other.y - e.y) <= 78) {
            chains++;
            other.hp -= Math.round(dmg * 0.8);
            other.hitFlash = 0.14;
            ctx.vfx.spawnPooled("zap-hit", { x: other.x, y: other.y - 4 });
            if (other.hp <= 0) this._killEnemy(ctx, other);
          }
        }
      } else if (pair === "fire+volt") {
        // 5. OVERLOAD BLAST: massive Bleach Shield break + heavy knockback
        const dmg = Math.round(baseBonus * 1.15);
        e.hp -= dmg;
        if (e.bleachShield > 0) {
          e.bleachShield = Math.max(0, e.bleachShield - 95);
        }
        const ang = Math.atan2(e.y - ctx.player.y, e.x - ctx.player.x);
        ctx.world.moveWithCollision(
          e,
          Math.cos(ang) * (e.isBoss ? 8 : 22),
          Math.sin(ang) * (e.isBoss ? 8 : 22),
          e.radius * 0.7
        );
        ctx.vfx.spawnPooled("explode-fire", { x: e.x, y: e.y - 4 });
        ctx.vfx.spawnPooled("zap-hit", { x: e.x, y: e.y - 4 });
        ctx.vfx.spawnDamageText(e.x, e.y - 18, `QUÁ TẢI ${dmg}!`, {
          crit: true,
          color: "#ffee44",
        });
        sfx.playExplosion();
        ctx.addShake(3.6);
      } else {
        // 6. CATALYZE (nature+volt): restores +16 Stamina & +10 Overdrive!
        const dmg = Math.round(baseBonus * 1.0);
        e.hp -= dmg;
        ctx.player.stamina = Math.min(ctx.player.maxStamina, ctx.player.stamina + 16);
        ctx.player.exhausted = false;
        ctx.player.overdrive = Math.min(100, ctx.player.overdrive + 10);
        ctx.vfx.spawnPooled("heal-burst", { x: ctx.player.x, y: ctx.player.y - 6 });
        ctx.vfx.spawnDamageText(e.x, e.y - 18, `XÚC TÁC +STAM!`, {
          crit: true,
          color: "#44ee88",
        });
        sfx.playOverdrive();
      }
      return;
    }

    if (incoming !== "prism") {
      e.element = incoming;
      e.elementTime = 5.0;
      if (incoming === "fire") e.burnTime = 3.2;
      if (incoming === "ice") e.slowTime = 3.0;
      if (incoming === "nature") e.poisonTime = 3.6;
    }
  }

  private _killEnemy(ctx: CombatContext, e: EnemyEntity) {
    const idx = ctx.spawner.enemies.indexOf(e);
    if (idx < 0) return;
    ctx.spawner.enemies.splice(idx, 1);
    if (e.defId === "boss_the_eraser") {
      ctx.spawner.arenaTotems.length = 0;
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

    // Orbiting Grimoire / Satellite Passive (image_8 / image_15)
    if (player.hasOrbitGrimoire) {
      player.grimoireTimer -= dt;
      if (player.grimoireTimer <= 0) {
        const target = this._findNearestEnemy(spawner.enemies, player.x, player.y, 175);
        if (target) {
          player.grimoireTimer = 4.0;
          const ang = Math.atan2(target.y - player.y, target.x - player.x);
          const elem = CHROMA_CYCLE[player.elementIdx % CHROMA_CYCLE.length];
          player.elementIdx = (player.elementIdx + 1) % CHROMA_CYCLE.length;
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

    // Pixel Tinker Q Overload Drone
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
            element: "volt",
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
            element: t.overclockTime > 0 ? "volt" : undefined,
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
            this._lightArenaTotem(ctx, totem);
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
        // Enemy projectile hits player (or triggers Chroma Dodge if dashing close!)
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

    // 4. Update Hazards & Ground Fields (Vortex, Acid Pool, Flame Trail, Bleach Zone, Skyfalls, Boss Telegraphs)
    for (let i = ctx.hazards.length - 1; i >= 0; i--) {
      const h = ctx.hazards[i];
      h.age += dt;

      if (h.kind === "vortex") {
        h.tickTimer -= dt;
        for (const e of spawner.enemies) {
          const dx = h.x - e.x;
          const dy = h.y - e.y;
          const d = Math.hypot(dx, dy);
          if (d > 4 && d < h.radius + 14) {
            const pull = (e.isBoss ? 24 : 68) * dt;
            world.moveWithCollision(e, (dx / d) * pull, (dy / d) * pull, e.radius * 0.7);
          }
        }
        if (h.tickTimer <= 0) {
          h.tickTimer = 0.36;
          for (const e of [...spawner.enemies]) {
            if (Math.hypot(e.x - h.x, e.y - h.y) <= h.radius + e.radius) {
              const el = CHROMA_CYCLE[Math.floor(Math.random() * CHROMA_CYCLE.length)];
              this.damageEnemy(ctx, e, h.damage, false, "hit-ice", el);
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
          for (const e of [...spawner.enemies]) {
            if (Math.hypot(e.x - h.x, e.y - h.y) <= h.radius + e.radius) {
              this.damageEnemy(ctx, e, h.damage, Math.random() < 0.35, "hit-fire", "fire", 0, 0, 1.5);
            }
          }
        } else if (h.kind === "afterimage") {
          sfx.playExplosion();
          ctx.addShake(3.2);
          vfx.spawnPooled("explode-plasma", { x: h.x, y: h.y - 4 });
          for (const e of [...spawner.enemies]) {
            if (Math.hypot(e.x - h.x, e.y - h.y) <= h.radius + e.radius) {
              this.damageEnemy(ctx, e, h.damage, true, "crit-gold", "volt", 0, 0, 1.6);
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
            // Leave a brief Bleach Zone tile hazard!
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

      const moveSpd =
        e.rootTime > 0 ? 0 : e.spd * (e.slowTime > 0 ? 0.5 : 1.0);

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
      const toPlayerAng = Math.atan2(player.y - e.y, player.x - e.x);
      e.facing = Math.cos(toPlayerAng) < 0 ? -1 : 1;
      e.aiTimer -= dt;
      e.specialTimer -= dt;
      e.walkTime += dt;

      if (edef.ai === "ranged") {
        const idealDist = 92;
        if (distToPlayer > idealDist + 15) {
          world.moveWithCollision(e, Math.cos(toPlayerAng) * moveSpd * dt, Math.sin(toPlayerAng) * moveSpd * dt, e.radius * 0.7);
        } else if (distToPlayer < idealDist - 22) {
          world.moveWithCollision(e, -Math.cos(toPlayerAng) * moveSpd * 0.7 * dt, -Math.sin(toPlayerAng) * moveSpd * 0.7 * dt, e.radius * 0.7);
        }
        if (e.aiTimer <= 0) {
          e.aiTimer = 1.65;
          const preset = e.biome === "amber" ? "proj-amber" : "proj-void";
          ctx.projectiles.push({
            uid: nextEntityUid(),
            owner: "enemy",
            x: e.x,
            y: e.y - 4,
            vx: Math.cos(toPlayerAng) * 145,
            vy: Math.sin(toPlayerAng) * 145,
            angle: toPlayerAng,
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
        const strafe = toPlayerAng + Math.sin(e.walkTime * 3.2) * 0.65;
        world.moveWithCollision(e, Math.cos(strafe) * moveSpd * dt, Math.sin(strafe) * moveSpd * dt, e.radius * 0.7);
      } else if (
        edef.ai === "boss_warden" ||
        edef.ai === "boss_root" ||
        edef.ai === "boss_amber" ||
        edef.ai === "boss_eraser"
      ) {
        this._updateBossAi(ctx, e, edef.ai, toPlayerAng, moveSpd, distToPlayer, dt);
      } else {
        world.moveWithCollision(e, Math.cos(toPlayerAng) * moveSpd * dt, Math.sin(toPlayerAng) * moveSpd * dt, e.radius * 0.7);
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
      // 3-Phase World Boss (65% -> Phase 2, 30% -> Phase 3)
      if (b.hp <= b.maxHp * 0.65 && b.phase === 1) {
        b.phase = 2;
        b.bleachShield = b.maxBleachShield;
        b.totemChannelTimer = 12.0;
        spawner.spawnEraserTotems(b.homeX, b.homeY, vfx);
        sfx.playBossRoar();
        ctx.notify(
          "THE ERASER vào PHASE 2! Hãy đánh thắp sáng >= 2/4 Trụ Sắc Màu quanh sân trong 12s để bắn vỡ Khiên Vô Sắc!",
          "warn"
        );
      } else if (b.hp <= b.maxHp * 0.3 && b.phase === 2) {
        b.phase = 3;
        b.bleachShield = Math.round(b.maxBleachShield * 1.15);
        b.totemChannelTimer = 12.0;
        spawner.spawnEraserTotems(b.homeX, b.homeY, vfx);
        sfx.playBossRoar();
        ctx.notify(
          "THE ERASER vào PHASE 3 CUỐI CÙNG! Thắp sáng 2 Trụ Sắc Màu để kết liễu nó!",
          "epic"
        );
      }

      if (b.totemChannelTimer > 0) {
        b.totemChannelTimer -= dt;
        if (b.totemChannelTimer <= 0 && spawner.arenaTotems.length > 0) {
          // Player failed to light 2 totems in 12s -> Eraser unleashes Monochrome Pulse!
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
      sfx.playBossRoar();
      ctx.notify(
        `${ENEMIES[b.defId]?.name ?? "BOSS"} vào GIAI ĐOẠN 2 & dựng Giáp Nhiễu Trắng! Dùng Tụ Lực / Phản Ứng để phá!`,
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

    // Radial / Crescent Projectile Volley
    if (b.aiTimer <= 0) {
      b.aiTimer = b.phase === 3 ? 1.9 : enraged ? 2.3 : 3.0;
      const count = ai === "boss_warden" ? (enraged ? 5 : 3) : ai === "boss_eraser" ? (b.phase === 3 ? 12 : 9) : enraged ? 8 : 6;
      const preset = ai === "boss_amber" ? "proj-amber" : ai === "boss_warden" ? "proj-shuriken" : "proj-void";

      for (let i = 0; i < count; i++) {
        const a =
          ai === "boss_warden"
            ? toPlayerAng + (i - Math.floor(count / 2)) * 0.28
            : toPlayerAng + (i * Math.PI * 2) / count;
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
