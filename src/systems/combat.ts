import { getClassDef } from "../data/classes";
import { ENEMIES } from "../data/enemies";
import { ITEMS, RARITY_INFO, pickRandomEquipByRarity } from "../data/items";
import { BOSS_ARENAS, CHROMA_RAINBOW } from "../data/worldConfig";
import type { ActiveBossLock, ElementType, Rarity } from "../data/types";
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
  getBossLock: () => ActiveBossLock | null;
  onBossLockTrigger: (boss: EnemyEntity) => void;
  stats: { kills: number; mined: number; chestsOpened: number; bossesDefeated: number };
}

const ELEMENTS: ElementType[] = ["fire", "ice", "poison"];
const ELEMENT_HIT_PRESET: Record<ElementType, string> = {
  fire: "hit-fire",
  ice: "hit-ice",
  poison: "hit-poison",
};

function rollRarityUpgrade(minRarity: Rarity): Rarity {
  const order: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];
  let idx = order.indexOf(minRarity);
  if (idx < 0) idx = 0;
  const r = Math.random();
  if (r < 0.04 && idx < 4) idx = Math.min(4, idx + 2);
  else if (r < 0.26 && idx < 4) idx = Math.min(4, idx + 1);
  return order[idx];
}

/**
 * Full Open-World Real-Time Action Combat Engine:
 * - Unarmed bare-handed start -> Weapons unlock class skills & E variants, Pix-Chips unlock Q Ultimates
 * - 4 distinct classes with combos, Hold-LMB charge attacks, E skills, Q ultimates, Armor/Ring passives
 * - Smooth armor mitigation, level-gap difficulty scaling, and Boss Territory Lock-In
 */
export class CombatSystem {
  private lastLifestealTime = 0;
  private lastLevelWarnTime = 0;
  private activeUltMult = 1.0;

  private _rollDamage(player: PlayerEntity, mult = 1, extraCrit = 0): { dmg: number; crit: boolean } {
    const buffMult = player.atkBuffTime > 0 ? 1.3 : 1.0;
    const critChance =
      player.crit +
      extraCrit +
      (player.cloneTime > 0 ? 25 : 0) +
      (player.atkBuffTime > 0 ? 15 : 0);
    const crit = Math.random() * 100 < critChance;
    const base = player.atk * mult * buffMult * (0.93 + Math.random() * 0.14);
    return {
      dmg: Math.max(1, Math.round(crit ? base * player.critMult : base)),
      crit,
    };
  }

  /** Triggered on normal LMB press or release (<0.38s hold). */
  performPrimaryAttack(ctx: CombatContext) {
    const { player, vfx } = ctx;
    if (player.atkCd > 0) return;

    const cdef = getClassDef(player.classId);
    const agiFactor = 1 / (1 + (player.allocatedStats?.agi ?? 0) * 0.015);
    const speedFactor = (player.cloneTime > 0 ? 0.5 : 1.0) * agiFactor;
    const ang = player.aimAngle;
    const flip = Math.cos(ang) < 0;
    player.facing = flip ? -1 : 1;

    // Unarmed bare-handed fighting until the player earns & equips their first Weapon!
    if (!ctx.inv.equipment.weapon) {
      player.atkCd = 0.36 * speedFactor;
      sfx.playPunch();
      ctx.world.moveWithCollision(player, Math.cos(ang) * 3, Math.sin(ang) * 3, player.radius);
      vfx.spawnPooled("hit-gold", {
        x: player.x + Math.cos(ang) * 14,
        y: player.y - 4 + Math.sin(ang) * 14,
        scale: 0.85,
      });
      this._meleeArcHit(ctx, player.x, player.y, ang, 24, 1.35, 0.72, "hit-gold");
      return;
    }

    player.atkCd = cdef.baseStats.atkCooldown * speedFactor;

    if (player.classId === "prism_knight") {
      const step = player.comboStep;
      player.comboStep = (player.comboStep + 1) % 3;
      player.comboTimer = 0.85;

      const mults = [1.0, 1.15, 1.55];
      const radii = [40, 44, 52];
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
      this._meleeArcHit(ctx, player.x, player.y, ang, radii[step], 1.45, mults[step], "hit-cyan");
      if (step === 2) ctx.addShake(2.2);
      return;
    }

    if (player.classId === "chroma_mage") {
      const elem = ELEMENTS[player.elementIdx % 3];
      player.elementIdx = (player.elementIdx + 1) % 3;
      const preset = elem === "fire" ? "proj-fireball" : elem === "ice" ? "proj-icelance" : "proj-poison";
      const { dmg, crit } = this._rollDamage(player, 1.05);
      sfx.playMagic(ELEMENTS.indexOf(elem));
      this._spawnPlayerProj(ctx, {
        x: player.x + Math.cos(ang) * 10,
        y: player.y - 4 + Math.sin(ang) * 10,
        angle: ang,
        speed: 220,
        radius: 6,
        damage: dmg,
        crit,
        pierce: 0,
        maxLife: 1.05,
        preset,
        element: elem,
        hitPreset: ELEMENT_HIT_PRESET[elem],
      });
      return;
    }

    if (player.classId === "bit_rogue") {
      sfx.playSlash(1);
      // Fast melee dagger flurry + pixel shuriken projectile
      vfx.spawnLive("melee/dagger-flurry", {
        x: player.x + Math.cos(ang) * 6,
        y: player.y + Math.sin(ang) * 6,
        angle: ang,
        options: { palette: PAL.neon },
        priority: 2,
      });
      this._meleeArcHit(ctx, player.x, player.y, ang, 30, 1.2, 0.8, "hit-gold");

      const { dmg, crit } = this._rollDamage(player, 0.92);
      this._spawnPlayerProj(ctx, {
        x: player.x + Math.cos(ang) * 9,
        y: player.y - 3 + Math.sin(ang) * 9,
        angle: ang,
        speed: 280,
        radius: 5,
        damage: dmg,
        crit,
        pierce: 1,
        maxLife: 0.72,
        preset: "proj-shuriken",
        hitPreset: "hit-cyan",
      });

      // Phantom Clone fires a mirrored echo shuriken!
      if (player.cloneTime > 0) {
        const echo = this._rollDamage(player, 0.65);
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
          hitPreset: "hit-gold",
        });
      }
      return;
    }

    if (player.classId === "pixel_tinker") {
      sfx.playShoot(720);
      vfx.spawnPooled("muzzle-pistol", {
        x: player.x + Math.cos(ang) * 11,
        y: player.y - 4 + Math.sin(ang) * 11,
        angle: ang,
      });
      const { dmg, crit } = this._rollDamage(player, 0.95);
      this._spawnPlayerProj(ctx, {
        x: player.x + Math.cos(ang) * 11,
        y: player.y - 4 + Math.sin(ang) * 11,
        angle: ang,
        speed: 270,
        radius: 5,
        damage: dmg,
        crit,
        pierce: 0,
        maxLife: 0.88,
        preset: "proj-laser",
        hitPreset: "zap-hit",
        canOverclockTurret: true,
      });
    }
  }

  /** Triggered when player holds LMB >= 0.4s and releases (costs 18-22 Stamina). */
  performChargedAttack(ctx: CombatContext) {
    const { player, vfx } = ctx;
    if (player.stamina < 18) {
      this.performPrimaryAttack(ctx);
      return;
    }
    player.stamina = Math.max(0, player.stamina - 22);
    player.staminaRegenDelay = 0.75;
    player.atkCd = 0.42;

    const ang = player.aimAngle;
    player.facing = Math.cos(ang) < 0 ? -1 : 1;
    const strMult = 1 + (player.allocatedStats?.str ?? 0) * 0.015;

    // Unarmed Heavy Uppercut!
    if (!ctx.inv.equipment.weapon) {
      sfx.playPunch();
      ctx.addShake(2.4);
      ctx.world.moveWithCollision(player, Math.cos(ang) * 8, Math.sin(ang) * 8, player.radius);
      vfx.spawnPooled("crit-gold", {
        x: player.x + Math.cos(ang) * 18,
        y: player.y - 4 + Math.sin(ang) * 18,
      });
      this._meleeArcHit(ctx, player.x, player.y, ang, 30, 1.45, 1.25 * strMult, "crit-gold");
      return;
    }

    sfx.playChargeRelease();
    ctx.addShake(3.2);

    if (player.classId === "prism_knight") {
      // Piercing Charged Dash-Thrust!
      player.dashing = 0.18;
      player.invuln = Math.max(player.invuln, 0.24);
      player.dashVx = Math.cos(ang) * 320;
      player.dashVy = Math.sin(ang) * 320;
      vfx.spawnLive("melee/thrust", {
        x: player.x + Math.cos(ang) * 12,
        y: player.y + Math.sin(ang) * 12,
        angle: ang,
        options: { palette: PAL.cyber },
        priority: 4,
      });
      this._linePierceHit(ctx, player.x, player.y, ang, 78, 18, 2.25 * strMult, "hit-cyan");
      return;
    }

    if (player.classId === "chroma_mage") {
      // Tri-Elemental Volley (Fire + Ice + Poison simultaneously -> instant reaction!)
      const offsets = [-0.22, 0, 0.22];
      const presets = ["proj-fireball", "proj-icelance", "proj-poison"];
      for (let i = 0; i < 3; i++) {
        const { dmg, crit } = this._rollDamage(player, 1.15 * strMult);
        this._spawnPlayerProj(ctx, {
          x: player.x + Math.cos(ang) * 10,
          y: player.y - 4 + Math.sin(ang) * 10,
          angle: ang + offsets[i],
          speed: 235,
          radius: 6,
          damage: dmg,
          crit,
          pierce: 1,
          maxLife: 1.05,
          preset: presets[i],
          element: ELEMENTS[i],
          hitPreset: ELEMENT_HIT_PRESET[ELEMENTS[i]],
        });
      }
      return;
    }

    if (player.classId === "bit_rogue") {
      // 5-Shuriken Fan Burst
      for (let i = -2; i <= 2; i++) {
        const { dmg, crit } = this._rollDamage(player, 0.95 * strMult, 18);
        this._spawnPlayerProj(ctx, {
          x: player.x + Math.cos(ang) * 8,
          y: player.y - 3 + Math.sin(ang) * 8,
          angle: ang + i * 0.16,
          speed: 300,
          radius: 5,
          damage: dmg,
          crit,
          pierce: 1,
          maxLife: 0.72,
          preset: "proj-shuriken",
          hitPreset: "crit-gold",
        });
      }
      return;
    }

    if (player.classId === "pixel_tinker") {
      // Piercing Electromagnetic Rail-Shot
      vfx.spawnLive("pixtel/prism-beam", {
        x: player.x + Math.cos(ang) * 10,
        y: player.y - 4 + Math.sin(ang) * 10,
        angle: ang,
        options: { length: 150, palette: PAL.cyber },
        priority: 4,
      });
      this._linePierceHit(ctx, player.x, player.y, ang, 155, 16, 2.2 * strMult, "zap-hit");
    }
  }

  /** Class active skill [E] — unlocked & specialized by the equipped Weapon! */
  performSkillE(ctx: CombatContext) {
    const { player, vfx } = ctx;
    const weaponDef = ctx.inv.getEquippedDef("weapon");
    if (!weaponDef || !weaponDef.grantsSkillE) {
      ctx.notify("Kỹ năng [E] đang KHÓA! Trang bị Vũ Khí để mở khóa.", "warn");
      sfx.playForgeFail();
      return;
    }
    if (player.skillCd > 0) return;

    const cdef = getClassDef(player.classId);
    player.skillCd = cdef.baseStats.skillCooldown;
    const ang = player.aimAngle;
    const variant = weaponDef.grantsSkillE.variant;

    // --- PRISM KNIGHT VARIANTS ---
    if (variant === "knight_shield_beam" || variant === "knight_quake_aegis" || variant === "knight_solar_prism") {
      player.shieldTime = variant === "knight_solar_prism" ? 1.25 : 1.05;
      sfx.playBlock();
      vfx.spawnLive("impacts/shield-block", {
        x: player.x,
        y: player.y,
        follow: player,
        options: { palette: variant === "knight_solar_prism" ? PAL.gold : PAL.cyber },
        priority: 4,
        maxLife: player.shieldTime,
      });

      if (variant === "knight_solar_prism") {
        for (const off of [-0.24, 0, 0.24]) {
          this.firePrismBeam(ctx, ang + off, 1.75);
        }
      } else if (variant === "knight_quake_aegis") {
        vfx.spawnPooled("ground-slam", { x: player.x, y: player.y });
        ctx.addShake(4.2);
        for (const e of [...ctx.spawner.enemies]) {
          const dx = e.x - player.x;
          const dy = e.y - player.y;
          const d = Math.hypot(dx, dy);
          if (d <= 58 + e.radius) {
            const { dmg, crit } = this._rollDamage(player, 1.9);
            this.damageEnemy(ctx, e, dmg, crit, "hit-gold", undefined, (dx / (d || 1)) * 2.2, (dy / (d || 1)) * 2.2);
          }
        }
        this.firePrismBeam(ctx, ang, 1.5);
      } else {
        this.firePrismBeam(ctx, ang, 1.85);
      }
      return;
    }

    // --- CHROMA MAGE VARIANTS ---
    if (variant === "mage_chroma_vortex" || variant === "mage_frost_nova" || variant === "mage_astral_collapse") {
      const tx = player.x + Math.cos(ang) * 64;
      const ty = player.y + Math.sin(ang) * 64;

      if (variant === "mage_frost_nova") {
        sfx.playExplosion();
        ctx.addShake(3.0);
        vfx.spawnLive("ice/frost-nova", {
          x: player.x,
          y: player.y,
          options: { palette: PAL.ice },
          priority: 5,
          maxLife: 1.5,
        });
        for (const e of [...ctx.spawner.enemies]) {
          const d = Math.hypot(e.x - player.x, e.y - player.y);
          if (d <= 64 + e.radius) {
            const { dmg, crit } = this._rollDamage(player, 2.05);
            this.damageEnemy(ctx, e, dmg, crit, "hit-ice", "ice");
            e.slowTime = Math.max(e.slowTime, 4.0);
          }
        }
      }

      sfx.playMagic(1);
      const isAstral = variant === "mage_astral_collapse";
      vfx.spawnLive("pixtel/chroma-vortex", {
        x: tx,
        y: ty,
        options: { radius: isAstral ? 56 : 44 },
        priority: 4,
        maxLife: 3.1,
      });
      ctx.hazards.push({
        uid: nextEntityUid(),
        owner: "player",
        kind: "vortex",
        x: tx,
        y: ty,
        radius: isAstral ? 68 : 56,
        delay: 0,
        age: 0,
        maxLife: 3.1,
        tickTimer: 0,
        damage: Math.round(player.atk * (isAstral ? 0.78 : 0.55)),
        triggered: true,
      });

      if (isAstral) {
        for (let i = 0; i < 3; i++) {
          const mx = tx + Math.cos((i * Math.PI * 2) / 3) * 28;
          const my = ty + Math.sin((i * Math.PI * 2) / 3) * 28;
          ctx.hazards.push({
            uid: nextEntityUid(),
            owner: "player",
            kind: "meteor",
            x: mx,
            y: my,
            radius: 36,
            delay: 0.25 + i * 0.14,
            age: 0,
            maxLife: 0.65 + i * 0.14,
            tickTimer: 0,
            damage: Math.round(player.atk * 2.1),
            triggered: false,
          });
        }
      }
      return;
    }

    // --- BIT ROGUE VARIANTS ---
    if (variant === "rogue_frame_skip" || variant === "rogue_shadow_ambush" || variant === "rogue_phantom_blitz") {
      const ox = player.x;
      const oy = player.y;
      const isBlitz = variant === "rogue_phantom_blitz";
      sfx.playDash();
      vfx.spawnLive("pixtel/frame-skip", {
        x: ox,
        y: oy,
        options: { actor: sprites.getHero(player.classId, 0).actor },
        priority: 4,
        maxLife: 1.25,
      });
      ctx.hazards.push({
        uid: nextEntityUid(),
        owner: "player",
        kind: "afterimage",
        x: ox,
        y: oy,
        radius: isBlitz ? 56 : 44,
        delay: 0.75,
        age: 0,
        maxLife: 1.0,
        tickTimer: 0,
        damage: Math.round(player.atk * (isBlitz ? 3.1 : 2.4)),
        triggered: false,
      });

      if (variant === "rogue_shadow_ambush" || isBlitz) {
        const fan = isBlitz ? [-2, -1, 0, 1, 2] : [-1, 0, 1];
        for (const i of fan) {
          const { dmg, crit } = this._rollDamage(player, isBlitz ? 1.05 : 0.9, 15);
          this._spawnPlayerProj(ctx, {
            x: ox,
            y: oy - 3,
            angle: ang + i * 0.16,
            speed: 310,
            radius: 5,
            damage: dmg,
            crit,
            pierce: 1,
            maxLife: 0.72,
            preset: "proj-shuriken",
            hitPreset: "crit-gold",
          });
        }
      }

      player.dashing = 0.2;
      player.invuln = Math.max(player.invuln, 0.35);
      player.dashVx = Math.cos(ang) * 340;
      player.dashVy = Math.sin(ang) * 340;
      return;
    }

    // --- PIXEL TINKER VARIANTS ---
    const tx = player.x + Math.cos(ang) * 26;
    const ty = player.y + Math.sin(ang) * 26;
    const safeX = ctx.world.isBlocked(tx, ty, 6) ? player.x : tx;
    const safeY = ctx.world.isBlocked(tx, ty, 6) ? player.y : ty;
    if (ctx.turrets.length >= 2) {
      ctx.turrets.shift();
    }
    const baseTurretHp = 70 + player.level * 10;
    const turretHp = ctx.inv.hasPassive("nano_repair") ? Math.round(baseTurretHp * 1.35) : baseTurretHp;
    const startOverclock = variant === "tinker_shock_mortar" ? 5.0 : variant === "tinker_prism_cannon" ? 6.5 : 0;

    ctx.turrets.push({
      uid: nextEntityUid(),
      x: safeX,
      y: safeY,
      hp: turretHp,
      maxHp: turretHp,
      life: 0,
      maxLife: 18,
      fireCd: 0.35,
      overclockTime: startOverclock,
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

    if (variant === "tinker_shock_mortar") {
      vfx.spawnPooled("ice-nova", { x: safeX, y: safeY });
      for (const e of [...ctx.spawner.enemies]) {
        if (Math.hypot(e.x - safeX, e.y - safeY) <= 58 + e.radius) {
          const { dmg, crit } = this._rollDamage(player, 1.65);
          this.damageEnemy(ctx, e, dmg, crit, "zap-hit");
        }
      }
    } else if (variant === "tinker_prism_cannon") {
      this.firePrismBeam(ctx, ang, 2.1);
    }
  }

  /** Class Ultimate [Q] — unlocked & powered up by equipped Pix-Chip! */
  performUltimateQ(ctx: CombatContext) {
    const { player, vfx } = ctx;
    const chipDef = ctx.inv.getEquippedDef("chip");
    if (!chipDef || !chipDef.grantsSkillQ) {
      ctx.notify("Tuyệt Kỹ [Q] đang KHÓA! Trang bị Pix-Chip để mở khóa.", "warn");
      sfx.playForgeFail();
      return;
    }
    if (player.overdrive < 100) {
      ctx.notify(`Chưa đủ năng lượng Tuyệt Kỹ (${Math.floor(player.overdrive)}/100)!`, "warn");
      return;
    }
    player.overdrive = 0;
    sfx.playOverdrive();
    ctx.addShake(5);

    const ultVariant = chipDef.grantsSkillQ.variant;
    this.activeUltMult =
      ultVariant === "ult_sovereign"
        ? 1.65
        : ultVariant === "ult_cataclysm"
          ? 1.35
          : ultVariant === "ult_overclock"
            ? 1.1
            : 1.0;

    if (ultVariant === "ult_cataclysm" || ultVariant === "ult_sovereign") {
      const healPct = ultVariant === "ult_sovereign" ? 0.25 : 0.16;
      const heal = Math.round(player.maxHp * healPct);
      player.hp = Math.min(player.maxHp, player.hp + heal);
      vfx.spawnPooled("heal-burst", { x: player.x, y: player.y - 6 });
      vfx.spawnDamageText(player.x, player.y - 16, `+${heal} HP`, { color: "#44ee88", crit: true });
    }

    if (ultVariant === "ult_sovereign") {
      vfx.spawnLive("pixtel/color-wave", {
        x: player.x,
        y: player.y,
        options: { radius: 95 },
        priority: 5,
        maxLife: 0.9,
      });
      for (const e of [...ctx.spawner.enemies]) {
        if (Math.hypot(e.x - player.x, e.y - player.y) <= 95 + e.radius) {
          const { dmg, crit } = this._rollDamage(player, 2.5);
          this.damageEnemy(ctx, e, dmg, crit, "crit-gold");
        }
      }
    }

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
      player.invuln = Math.max(player.invuln, 0.7);
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
        const spreadA = baseAngle + ((i - 2.5) * 0.42);
        const dist = 36 + (i % 3) * 28;
        const mx = player.x + Math.cos(spreadA) * dist;
        const my = player.y + Math.sin(spreadA) * dist;
        const delay = 0.35 + i * 0.16;

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
          radius: 36,
          delay,
          age: 0,
          maxLife: delay + 0.3,
          tickTimer: 0,
          damage: Math.round(player.atk * 2.5 * this.activeUltMult),
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

  /** Dash [Space] with Stamina cost & i-frames */
  performDash(ctx: CombatContext, moveX: number, moveY: number) {
    const { player, vfx } = ctx;
    if (player.dashCd > 0 || player.stamina < 24 || player.exhausted) return;
    const cdef = getClassDef(player.classId);
    const dashMult = ctx.inv.hasPassive("shadow_step") ? 0.78 : 1.0;
    player.dashCd = cdef.baseStats.dashCooldown * dashMult;
    player.stamina = Math.max(0, player.stamina - 24);
    player.staminaRegenDelay = 0.65;
    if (player.stamina <= 0) player.exhausted = true;

    const ang = moveX !== 0 || moveY !== 0 ? Math.atan2(moveY, moveX) : player.aimAngle;
    player.dashing = 0.16;
    player.invuln = Math.max(player.invuln, 0.28);
    player.dashVx = Math.cos(ang) * 290;
    player.dashVy = Math.sin(ang) * 290;
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

  firePrismBeam(ctx: CombatContext, angle: number, mult = 2.0) {
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
    this._linePierceHit(ctx, player.x, player.y, angle, 168, 20, mult, "hit-cyan");
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
    hitPreset: string
  ) {
    const { spawner } = ctx;
    // Hit enemies
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
        const { dmg, crit } = this._rollDamage(ctx.player, mult);
        this.damageEnemy(ctx, e, dmg, crit, hitPreset, undefined, dx / (d || 1), dy / (d || 1));
      }
    }

    // Also allow melee swings to mine Ore & Crystal nodes!
    for (const res of spawner.resources) {
      if (!res.alive) continue;
      const dx = res.x - ox;
      const dy = res.y - oy;
      const d = Math.hypot(dx, dy);
      if (d <= range + 10) {
        this.damageResource(ctx, res, Math.round(ctx.player.atk * mult));
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
    hitPreset: string
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
        const { dmg, crit } = this._rollDamage(ctx.player, mult, 10);
        this.damageEnemy(ctx, e, dmg, crit, hitPreset, undefined, dirX, dirY);
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

  damageResource(ctx: CombatContext, res: { def: { dropItemId: string; dropQty: [number, number]; respawnSec: number }; x: number; y: number; hp: number; alive: boolean; respawnTimer: number; hitFlash: number }, rawDmg: number) {
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
    kbY = 0
  ) {
    const idx = ctx.spawner.enemies.indexOf(e);
    if (idx < 0) return;

    // Trigger Boss Arena Territory Lock on the very first hit!
    if (e.isBoss && !ctx.getBossLock()) {
      ctx.onBossLockTrigger(e);
    }

    // Smooth armor mitigation + level-gap toughness penalty for underleveled heroes
    const defMult = 100 / (100 + e.def * 3.2);
    const levelGap = e.level - ctx.player.level;
    const gapMult = levelGap > 2 ? Math.max(0.28, 1 - (levelGap - 2) * 0.12) : 1.0;
    const mitigated = Math.max(2, Math.round(rawDamage * defMult * gapMult));

    e.hp -= mitigated;
    e.hitFlash = 0.13;
    e.state = "aggro";

    if (gapMult < 0.7 && performance.now() - this.lastLevelWarnTime > 4500) {
      this.lastLevelWarnTime = performance.now();
      ctx.notify(`Địch LV.${e.level} quá mạnh so với bạn (LV.${ctx.player.level})! Hãy lên cấp & luyện trang bị.`, "warn");
    }

    // Knockback (smaller for bosses)
    const kb = e.isBoss ? 2 : 7;
    if (kbX !== 0 || kbY !== 0) {
      ctx.world.moveWithCollision(e, kbX * kb, kbY * kb, e.radius * 0.7);
    }

    sfx.playHit(crit);
    ctx.vfx.spawnPooled(crit ? "crit-gold" : hitPreset, { x: e.x, y: e.y - 6 });
    const label = crit ? `CRIT ${mitigated}!` : gapMult < 0.7 ? `${mitigated} (CỨNG)` : `${mitigated}`;
    ctx.vfx.spawnDamageText(e.x, e.y - 10, label, {
      crit,
      color: crit ? "#ffe25a" : gapMult < 0.7 ? "#ff99aa" : "#ffffff",
    });

    if (crit) {
      ctx.addShake(2.0);
      ctx.addHitstop(0.025);
      // Ring Crit-Lifesteal passive
      if (
        (ctx.inv.hasPassive("ring_lifesteal") || ctx.inv.hasPassive("ring_nova_kill")) &&
        performance.now() - this.lastLifestealTime >= 400
      ) {
        this.lastLifestealTime = performance.now();
        const heal = Math.max(2, Math.round(ctx.player.maxHp * 0.04));
        ctx.player.hp = Math.min(ctx.player.maxHp, ctx.player.hp + heal);
        ctx.vfx.spawnDamageText(ctx.player.x, ctx.player.y - 16, `+${heal}`, { color: "#44ee88" });
      }
    }

    // Charge Ultimate Q gauge (requires Pix-Chip or boosts with Arcane Surge / Overclock Chip)
    const chipDef = ctx.inv.getEquippedDef("chip");
    const odMult =
      (ctx.inv.hasPassive("arcane_surge") ? 1.25 : 1.0) *
      (chipDef?.grantsSkillQ?.variant === "ult_overclock" ? 1.25 : 1.0);
    ctx.player.overdrive = Math.min(100, ctx.player.overdrive + (e.isBoss ? 4.5 : 6) * odMult);

    // Elemental Reactions (Chroma Mage)
    if (element) {
      this._applyElement(ctx, e, element);
    }

    if (e.hp <= 0) {
      this._killEnemy(ctx, e);
    }
  }

  private _applyElement(ctx: CombatContext, e: EnemyEntity, incoming: ElementType) {
    if (e.element && e.element !== incoming) {
      const pair = [e.element, incoming].sort().join("+");
      e.element = null;
      e.elementTime = 0;
      const surgeMult = ctx.inv.hasPassive("arcane_surge") ? 1.25 : 1.0;
      const bonus = Math.round(ctx.player.atk * 1.45 * surgeMult);
      e.hp -= bonus;

      if (pair === "fire+ice") {
        // THERMAL SHATTER
        ctx.vfx.spawnPooled("explode-fire", { x: e.x, y: e.y - 4 });
        ctx.vfx.spawnPooled("ice-shatter", { x: e.x, y: e.y - 4 });
        ctx.vfx.spawnDamageText(e.x, e.y - 18, `THERMAL ${bonus}!`, { crit: true, color: "#ff9944" });
        sfx.playExplosion();
        ctx.addShake(3.2);
      } else if (pair === "fire+poison") {
        // TOXIC BLAST AoE
        ctx.vfx.spawnPooled("explode-plasma", { x: e.x, y: e.y - 4 });
        ctx.vfx.spawnDamageText(e.x, e.y - 18, `TOXIC BLAST ${bonus}!`, { crit: true, color: "#66ff66" });
        sfx.playExplosion();
        for (const other of [...ctx.spawner.enemies]) {
          if (other === e) continue;
          if (Math.hypot(other.x - e.x, other.y - e.y) <= 52) {
            other.hp -= Math.round(bonus * 0.7);
            other.hitFlash = 0.12;
            if (other.hp <= 0) this._killEnemy(ctx, other);
          }
        }
      } else {
        // CRYO-VENOM (ice+poison)
        e.slowTime = Math.max(e.slowTime, 4.0);
        e.poisonTime = Math.max(e.poisonTime, 4.0);
        ctx.vfx.spawnPooled("ice-nova", { x: e.x, y: e.y - 4 });
        ctx.vfx.spawnPooled("acid-splash", { x: e.x, y: e.y - 4 });
        ctx.vfx.spawnDamageText(e.x, e.y - 18, `CRYO VENOM ${bonus}!`, { crit: true, color: "#55f2ff" });
        sfx.playExplosion();
      }
      return;
    }

    e.element = incoming;
    e.elementTime = 4.5;
    if (incoming === "fire") e.burnTime = 3.2;
    if (incoming === "ice") e.slowTime = 3.0;
    if (incoming === "poison") e.poisonTime = 3.6;
  }

  private _killEnemy(ctx: CombatContext, e: EnemyEntity) {
    const idx = ctx.spawner.enemies.indexOf(e);
    if (idx < 0) return;
    ctx.spawner.enemies.splice(idx, 1);

    const edef = ENEMIES[e.defId];
    ctx.stats.kills += 1;

    // Death pixelfx & local color restoration wave!
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
      // XP
      ctx.onGainXp(edef.xp);
      // Gold drop
      const [gMin, gMax] = edef.gold;
      const gold = gMin + Math.floor(Math.random() * (gMax - gMin + 1));
      ctx.spawner.spawnGoldLoot(e.x, e.y, gold);

      // Material drops
      for (const m of edef.lootMaterials) {
        if (Math.random() <= m.chance) {
          ctx.spawner.spawnItemLoot(e.x, e.y, m.defId, e.isBoss ? 2 : 1);
        }
      }

      // Equipment drop with pixelfx Loot Beam! (class-biased + exciting rarity upgrades)
      if (Math.random() <= edef.equipDropChance) {
        const rarity = rollRarityUpgrade(edef.minRarity);
        const eqId = pickRandomEquipByRarity(rarity, ctx.player.classId);
        ctx.spawner.spawnItemLoot(e.x, e.y, eqId, 1);
        const eqDef = ITEMS[eqId];
        if (eqDef && (rarity === "rare" || rarity === "epic" || rarity === "legendary")) {
          ctx.notify(`Rơi trang bị [${RARITY_INFO[rarity].label}] ${eqDef.name}!`, "epic");
        }
      }
    }

    // Ring On-Kill Nova Explosion passive
    if (ctx.inv.hasPassive("ring_nova_kill")) {
      const novaDmg = Math.round(ctx.player.atk * 1.35);
      ctx.vfx.spawnPooled("explode-fire", { x: e.x, y: e.y - 4 });
      for (const other of [...ctx.spawner.enemies]) {
        if (Math.hypot(other.x - e.x, other.y - e.y) <= 54) {
          other.hp -= novaDmg;
          other.hitFlash = 0.12;
          ctx.vfx.spawnDamageText(other.x, other.y - 10, `${novaDmg}`, { color: "#ff9933" });
          if (other.hp <= 0) this._killEnemy(ctx, other);
        }
      }
    }

    // Quest progress
    const done1 = ctx.quests.recordEvent("kill_enemy", e.defId, 1);
    const done2 = ctx.quests.recordEvent("kill_any", undefined, 1);
    for (const q of [...done1, ...done2]) {
      sfx.playQuestComplete();
      ctx.notify(`Hoàn thành mục tiêu: ${q.title}! Về thị trấn trả nhiệm vụ.`, "good");
    }

    // Camp chest unlock check
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

  /** Applies damage to player, handling i-frames, smooth armor mitigation, Thorns & Prism Shield parry. */
  damagePlayer(ctx: CombatContext, rawAmount: number, srcX: number, srcY: number) {
    const { player, vfx } = ctx;
    if (player.invuln > 0 || ctx.world.isInSafeTown(player.x, player.y)) return;

    if (player.shieldTime > 0) {
      // Blocked! Reflect a devastating Prism Laser back at attacker!
      sfx.playBlock();
      const ang = Math.atan2(srcY - player.y, srcX - player.x);
      vfx.spawnDamageText(player.x, player.y - 16, "PARRY!", { crit: true, color: "#5ef2ff" });
      this.firePrismBeam(ctx, ang, 2.4);
      player.invuln = 0.35;
      return;
    }

    const dmg = Math.max(2, Math.round(rawAmount * (100 / (100 + player.def * 2.8))));
    player.hp = Math.max(0, player.hp - dmg);
    player.hitFlash = 0.22;
    player.invuln = 0.55;
    sfx.playPlayerHit();
    ctx.addShake(3.8);
    vfx.spawnPooled("hit-fire", { x: player.x, y: player.y - 6 });
    vfx.spawnDamageText(player.x, player.y - 12, `-${dmg}`, { color: "#ff4466" });

    // Knight Armor Thorns Reflection passive
    if (ctx.inv.hasPassive("thorns_reflect")) {
      const attacker = this._findNearestEnemy(ctx.spawner.enemies, srcX, srcY, 26);
      if (attacker && Math.hypot(attacker.x - player.x, attacker.y - player.y) <= 44) {
        const thorns = Math.max(2, Math.round(rawAmount * 0.25));
        attacker.hp -= thorns;
        attacker.hitFlash = 0.1;
        vfx.spawnDamageText(attacker.x, attacker.y - 12, `THORNS ${thorns}`, { color: "#5ef2ff" });
        if (attacker.hp <= 0) this._killEnemy(ctx, attacker);
      }
    }

    if (player.hp <= 0) {
      ctx.onPlayerDefeated();
    }
  }

  /** Updates projectiles, turrets, hazards, status DOTs, active Ultimates, and enemy AI. */
  update(ctx: CombatContext, dt: number) {
    const { player, spawner, vfx, world } = ctx;

    // 1. Active Class Ultimates / Timers
    if (player.comboTimer > 0) {
      player.comboTimer -= dt;
      if (player.comboTimer <= 0) player.comboStep = 0;
    }
    if (player.shieldTime > 0) player.shieldTime = Math.max(0, player.shieldTime - dt);
    if (player.cloneTime > 0) player.cloneTime = Math.max(0, player.cloneTime - dt);
    if (player.speedBuffTime > 0) player.speedBuffTime = Math.max(0, player.speedBuffTime - dt);
    if (player.atkBuffTime > 0) player.atkBuffTime = Math.max(0, player.atkBuffTime - dt);

    // Pixel Tinker Nano-Repair armor passive HP regen
    if (ctx.inv.hasPassive("nano_repair") && player.hitFlash <= 0 && player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.015 * dt);
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
            const { dmg, crit } = this._rollDamage(player, 0.85 * this.activeUltMult, 10);
            this.damageEnemy(ctx, e, dmg, crit, "hit-cyan", undefined, dx / (d || 1), dy / (d || 1));
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
        // Continuous heal
        const healAmt = Math.max(3, Math.round(player.maxHp * 0.035));
        player.hp = Math.min(player.maxHp, player.hp + healAmt);
        for (const t of ctx.turrets) t.hp = Math.min(t.maxHp, t.hp + 8);

        // Shoot nearest aggro/close enemy
        const target = this._findNearestEnemy(spawner.enemies, player.x, player.y, 175);
        if (target) {
          const ang = Math.atan2(target.y - player.y, target.x - player.x);
          const { dmg, crit } = this._rollDamage(player, 0.72 * this.activeUltMult);
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
            hitSet: new Set(),
            hitPreset: "zap-hit",
          });
        }
      }
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
          const { dmg, crit } = this._rollDamage(player, t.overclockTime > 0 ? 0.78 : 0.62);
          sfx.playShoot(t.overclockTime > 0 ? 860 : 620);
          vfx.spawnPooled("muzzle-smg", { x: t.x + Math.cos(t.angle) * 8, y: t.y - 6 + Math.sin(t.angle) * 8, angle: t.angle });
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
        // Pixel Tinker synergy: shooting own turret heals & overclocks it!
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
              p.vy / spd
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

        // Hit mining resource nodes!
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
        // Enemy projectile hits player or turret
        if (Math.hypot(player.x - p.x, player.y - 4 - p.y) <= player.radius + p.radius) {
          this.damagePlayer(ctx, p.damage, p.x, p.y);
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

    // 4. Update Hazards (Vortex, Meteors, Frame-Skip bombs, Boss telegraphs)
    for (let i = ctx.hazards.length - 1; i >= 0; i--) {
      const h = ctx.hazards[i];
      h.age += dt;

      if (h.kind === "vortex") {
        // Pull enemies smoothly toward center & tick damage
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
              this.damageEnemy(ctx, e, h.damage, false, "hit-ice", ELEMENTS[Math.floor(Math.random() * 3)]);
            }
          }
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
              this.damageEnemy(ctx, e, h.damage, Math.random() < 0.35, "hit-fire", "fire");
            }
          }
        } else if (h.kind === "afterimage") {
          sfx.playExplosion();
          ctx.addShake(3.2);
          vfx.spawnPooled("explode-plasma", { x: h.x, y: h.y - 4 });
          for (const e of [...spawner.enemies]) {
            if (Math.hypot(e.x - h.x, e.y - h.y) <= h.radius + e.radius) {
              this.damageEnemy(ctx, e, h.damage, true, "crit-gold");
            }
          }
        } else if (h.owner === "enemy") {
          sfx.playExplosion();
          ctx.addShake(3.2);
          if (h.kind === "boss_thorns") vfx.spawnPooled("boss-thorns", { x: h.x, y: h.y });
          else if (h.kind === "boss_slam") vfx.spawnPooled("ground-slam", { x: h.x, y: h.y });
          else if (h.kind === "boss_erase") vfx.spawnPooled("boss-smite", { x: h.x, y: h.y });
          else if (h.kind === "boss_cross") {
            vfx.spawnLive("pixtel/prism-beam", {
              x: h.x - 90,
              y: h.y,
              angle: 0,
              options: { length: 180, palette: PAL.neon },
              priority: 4,
            });
            vfx.spawnLive("pixtel/prism-beam", {
              x: h.x,
              y: h.y - 90,
              angle: Math.PI / 2,
              options: { length: 180, palette: PAL.neon },
              priority: 4,
            });
          }

          if (h.kind === "boss_cross") {
            const onH = Math.abs(player.y - h.y) <= 18 && Math.abs(player.x - h.x) <= 95;
            const onV = Math.abs(player.x - h.x) <= 18 && Math.abs(player.y - h.y) <= 95;
            if (onH || onV) this.damagePlayer(ctx, h.damage, h.x, h.y);
          } else if (Math.hypot(player.x - h.x, player.y - h.y) <= h.radius + player.radius) {
            this.damagePlayer(ctx, h.damage, h.x, h.y);
          }
        }
      }

      if (h.age >= h.maxLife) {
        ctx.hazards.splice(i, 1);
      }
    }

    // 5. Update Enemies (Patrol / Aggro / Leash + Status DOTs + Boss AI)
    const playerInTown = world.isInSafeTown(player.x, player.y);
    for (let i = spawner.enemies.length - 1; i >= 0; i--) {
      const e = spawner.enemies[i];
      if (!e) continue;
      if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);

      // Elemental status timers & DOTs
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
          this.damageEnemy(ctx, e, Math.max(4, Math.round(player.atk * 0.3)), false, "hit-fire");
          if (e.hp <= 0) continue;
        }
      }
      if (e.poisonTime > 0) {
        e.poisonTime -= dt;
        e.poisonTick -= dt;
        if (e.poisonTick <= 0) {
          e.poisonTick = 0.7;
          this.damageEnemy(ctx, e, Math.max(4, Math.round(player.atk * 0.28)), false, "hit-poison");
          if (e.hp <= 0) continue;
        }
      }

      const edef = ENEMIES[e.defId];
      if (!edef) continue;

      const distToPlayer = Math.hypot(player.x - e.x, player.y - e.y);
      const distToHome = Math.hypot(e.homeX - e.x, e.homeY - e.y);

      // Skip far-away off-screen enemies beyond 460px for crisp 60 FPS!
      if (distToPlayer > 460 && e.state === "patrol") continue;

      // State transitions: Patrol <-> Aggro <-> Leash (Boss never leashes while territory is locked!)
      const lockedBoss = ctx.getBossLock()?.bossUid === e.uid;
      if (e.state === "patrol") {
        if (!playerInTown && distToPlayer <= edef.aggroRadius) {
          e.state = "aggro";
          if (e.isBoss) sfx.playBossRoar();
        }
      } else if (e.state === "aggro") {
        if (!lockedBoss && (playerInTown || distToHome > edef.leashRadius || distToPlayer > edef.leashRadius + 60)) {
          e.state = "leash";
        }
      } else if (e.state === "leash") {
        // Regenerate HP while walking home
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.22 * dt);
        if (distToHome < 14) {
          e.state = "patrol";
        }
      }

      const moveSpd = e.spd * (e.slowTime > 0 ? 0.52 : 1.0);

      if (e.state === "leash") {
        const ang = Math.atan2(e.homeY - e.y, e.homeX - e.x);
        e.facing = Math.cos(ang) < 0 ? -1 : 1;
        world.moveWithCollision(e, Math.cos(ang) * moveSpd * 1.35 * dt, Math.sin(ang) * moveSpd * 1.35 * dt, e.radius * 0.7);
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
      } else if (edef.ai === "boss_root" || edef.ai === "boss_amber" || edef.ai === "boss_eraser") {
        this._updateBossAi(ctx, e, edef.ai, toPlayerAng, moveSpd, distToPlayer, dt);
      } else {
        // melee / bruiser
        world.moveWithCollision(e, Math.cos(toPlayerAng) * moveSpd * dt, Math.sin(toPlayerAng) * moveSpd * dt, e.radius * 0.7);
      }

      // Contact damage
      if (distToPlayer <= e.radius + player.radius) {
        this.damagePlayer(ctx, e.atk, e.x, e.y);
      }
    }
  }

  private _updateBossAi(
    ctx: CombatContext,
    b: EnemyEntity,
    ai: "boss_root" | "boss_amber" | "boss_eraser",
    toPlayerAng: number,
    moveSpd: number,
    distToPlayer: number,
    dt: number
  ) {
    const { player, vfx, world } = ctx;
    const hpRatio = b.hp / b.maxHp;
    const enraged = hpRatio < 0.5;
    const desperate = ai === "boss_eraser" && hpRatio < 0.25;

    if (enraged && b.phase === 1) {
      b.phase = 2;
      sfx.playBossRoar();
      ctx.notify(`${ENEMIES[b.defId]?.name ?? "BOSS"} vào GIAI ĐOẠN 2!`, "warn");
      if (ai === "boss_root" && !b.bossSummonedAdds) {
        b.bossSummonedAdds = true;
        ctx.spawner.spawnBossMinion("quartz_stalker", b.x - 28, b.y + 18, b.campId, b.biome, vfx);
        ctx.spawner.spawnBossMinion("quartz_stalker", b.x + 28, b.y + 18, b.campId, b.biome, vfx);
        ctx.notify("Blight Root triệu hồi Vệ Binh Thạch Anh!", "warn");
      }
    }
    if (desperate && b.phase < 3) {
      b.phase = 3;
      sfx.playBossRoar();
      ctx.notify("THE ERASER CUỒNG NỘ GIAI ĐOẠN CUỐI!", "warn");
    }

    if (distToPlayer > 44) {
      world.moveWithCollision(
        b,
        Math.cos(toPlayerAng) * moveSpd * (desperate ? 1.35 : enraged ? 1.22 : 1.0) * dt,
        Math.sin(toPlayerAng) * moveSpd * (desperate ? 1.35 : enraged ? 1.22 : 1.0) * dt,
        b.radius * 0.7
      );
    }

    // Clamp locked boss cleanly inside its territory arena
    const arena = BOSS_ARENAS[b.defId];
    if (arena) {
      const dx = b.x - arena.cx;
      const dy = b.y - arena.cy;
      const d = Math.hypot(dx, dy);
      const maxD = arena.radius - b.radius - 4;
      if (d > maxD && d > 0) {
        b.x = arena.cx + (dx / d) * maxD;
        b.y = arena.cy + (dy / d) * maxD;
      }
    }

    // Radial bullet burst
    if (b.aiTimer <= 0) {
      b.aiTimer = desperate ? 1.65 : enraged ? 2.0 : 2.7;
      const count = ai === "boss_eraser" ? (desperate ? 14 : enraged ? 12 : 9) : enraged ? 10 : 7;
      const preset = ai === "boss_amber" ? "proj-amber" : "proj-void";
      for (let i = 0; i < count; i++) {
        const a = toPlayerAng + (i * Math.PI * 2) / count;
        ctx.projectiles.push({
          uid: nextEntityUid(),
          owner: "enemy",
          x: b.x,
          y: b.y - 6,
          vx: Math.cos(a) * (enraged ? 155 : 138),
          vy: Math.sin(a) * (enraged ? 155 : 138),
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

    // Telegraphed Signature Special
    if (b.specialTimer <= 0) {
      b.specialTimer = desperate ? 2.4 : enraged ? 3.0 : 4.0;
      if (ai === "boss_root") {
        const thorns = enraged ? 4 : 3;
        for (let k = 0; k < thorns; k++) {
          const tx = player.x + (k === 0 ? 0 : (Math.random() - 0.5) * 72);
          const ty = player.y + (k === 0 ? 0 : (Math.random() - 0.5) * 72);
          vfx.spawnLive("pixtel/boss-telegraph", {
            x: tx,
            y: ty,
            options: { radius: 28, shape: "circle", palette: PAL.blood },
            priority: 5,
            maxLife: 0.9,
          });
          ctx.hazards.push({
            uid: nextEntityUid(),
            owner: "enemy",
            kind: "boss_thorns",
            x: tx,
            y: ty,
            radius: 30,
            delay: 0.85,
            age: 0,
            maxLife: 1.15,
            tickTimer: 0,
            damage: Math.round(b.atk * 1.25),
            triggered: false,
          });
        }
      } else if (ai === "boss_amber") {
        // Ground Slam + extra player-targeted molten meteor when enraged
        vfx.spawnLive("pixtel/boss-telegraph", {
          x: b.x,
          y: b.y,
          options: { radius: 54, shape: "circle", palette: PAL.fire },
          priority: 5,
          maxLife: 0.85,
        });
        ctx.hazards.push({
          uid: nextEntityUid(),
          owner: "enemy",
          kind: "boss_slam",
          x: b.x,
          y: b.y,
          radius: 58,
          delay: 0.8,
          age: 0,
          maxLife: 1.1,
          tickTimer: 0,
          damage: Math.round(b.atk * 1.35),
          triggered: false,
        });
        if (enraged) {
          vfx.spawnLive("pixtel/boss-telegraph", {
            x: player.x,
            y: player.y,
            options: { radius: 34, shape: "circle", palette: PAL.lava },
            priority: 5,
            maxLife: 0.85,
          });
          ctx.hazards.push({
            uid: nextEntityUid(),
            owner: "enemy",
            kind: "boss_slam",
            x: player.x,
            y: player.y,
            radius: 36,
            delay: 0.8,
            age: 0,
            maxLife: 1.05,
            tickTimer: 0,
            damage: Math.round(b.atk * 1.2),
            triggered: false,
          });
        }
      } else {
        // World Boss THE ERASER: Floor Erase Zones + Cross Laser Beam!
        const zones = desperate ? 5 : enraged ? 4 : 3;
        for (let k = 0; k < zones; k++) {
          const tx = player.x + (k === 0 ? 0 : (Math.random() - 0.5) * 95);
          const ty = player.y + (k === 0 ? 0 : (Math.random() - 0.5) * 95);
          vfx.spawnLive("pixtel/boss-telegraph", {
            x: tx,
            y: ty,
            options: { radius: 32, shape: "circle", palette: PAL.neon },
            priority: 5,
            maxLife: 0.95,
          });
          ctx.hazards.push({
            uid: nextEntityUid(),
            owner: "enemy",
            kind: "boss_erase",
            x: tx,
            y: ty,
            radius: 34,
            delay: 0.9,
            age: 0,
            maxLife: 1.15,
            tickTimer: 0,
            damage: Math.round(b.atk * 1.45),
            triggered: false,
          });
        }

        if (enraged) {
          vfx.spawnLive("pixtel/boss-telegraph", {
            x: b.x,
            y: b.y,
            options: { radius: 38, shape: "cross", palette: PAL.neon },
            priority: 5,
            maxLife: 0.95,
          });
          ctx.hazards.push({
            uid: nextEntityUid(),
            owner: "enemy",
            kind: "boss_cross",
            x: b.x,
            y: b.y,
            radius: 105,
            delay: 0.9,
            age: 0,
            maxLife: 1.15,
            tickTimer: 0,
            damage: Math.round(b.atk * 1.5),
            triggered: false,
          });
        }
      }
    }
  }

  private _findNearestEnemy(enemies: EnemyEntity[], x: number, y: number, maxRange: number): EnemyEntity | null {
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
