import { getClassDef } from "../data/classes";
import { ENEMIES } from "../data/enemies";
import { ITEMS, RARITY_INFO, pickRandomEquipByRarity } from "../data/items";
import { CHROMA_RAINBOW } from "../data/worldConfig";
import type { ElementType, Rarity } from "../data/types";
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
  if (r < 0.08 && idx < 4) idx = Math.min(4, idx + 2);
  else if (r < 0.3 && idx < 4) idx = Math.min(4, idx + 1);
  return order[idx];
}

/**
 * Full Open-World Real-Time Action Combat Engine:
 * - 4 distinct classes with combos, Hold-LMB charge attacks, E skills, Q ultimates
 * - Elemental reactions, Prism Shield laser reflection, Frame-Skip glitch bombs, Compile Turrets + Overload Drone
 * - Mining resource nodes, Enemy patrol/aggro/leash AI, and 3 Regional/World Bosses with telegraphs
 */
export class CombatSystem {
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
    const speedFactor = player.cloneTime > 0 ? 0.5 : 1.0;
    player.atkCd = cdef.baseStats.atkCooldown * speedFactor;

    const ang = player.aimAngle;
    const flip = Math.cos(ang) < 0;
    player.facing = flip ? -1 : 1;

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

  /** Triggered when player holds LMB >= 0.4s and releases (costs 22 Stamina). */
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
      // Pierce enemies along thrust line
      this._linePierceHit(ctx, player.x, player.y, ang, 78, 18, 2.25, "hit-cyan");
      return;
    }

    if (player.classId === "chroma_mage") {
      // Tri-Elemental Volley (Fire + Ice + Poison simultaneously -> instant reaction!)
      const offsets = [-0.22, 0, 0.22];
      const presets = ["proj-fireball", "proj-icelance", "proj-poison"];
      for (let i = 0; i < 3; i++) {
        const { dmg, crit } = this._rollDamage(player, 1.15);
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
        const { dmg, crit } = this._rollDamage(player, 0.95, 18);
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
      this._linePierceHit(ctx, player.x, player.y, ang, 155, 16, 2.2, "zap-hit");
    }
  }

  /** Class active skill [E] */
  performSkillE(ctx: CombatContext) {
    const { player, vfx } = ctx;
    if (player.skillCd > 0) return;

    const cdef = getClassDef(player.classId);
    player.skillCd = cdef.baseStats.skillCooldown;
    const ang = player.aimAngle;

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
      // Fire immediate counter-prism beam along aim direction too so E feels punchy even proactively!
      this.firePrismBeam(ctx, ang, 1.85);
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
        damage: Math.round(player.atk * 0.55),
        triggered: true,
      });
      return;
    }

    if (player.classId === "bit_rogue") {
      // Frame-Skip: leave explosive glitch afterimage, dash invulnerably forward!
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
        radius: 44,
        delay: 0.78,
        age: 0,
        maxLife: 1.0,
        tickTimer: 0,
        damage: Math.round(player.atk * 2.4),
        triggered: false,
      });

      player.dashing = 0.2;
      player.invuln = Math.max(player.invuln, 0.35);
      player.dashVx = Math.cos(ang) * 340;
      player.dashVy = Math.sin(ang) * 340;
      return;
    }

    if (player.classId === "pixel_tinker") {
      // Compile Pixel Turret (max 2)
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
        hp: 70 + player.level * 8,
        maxHp: 70 + player.level * 8,
        life: 0,
        maxLife: 18,
        fireCd: 0.45,
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
    const { player, vfx } = ctx;
    if (player.overdrive < 100) {
      ctx.notify(`Chưa đủ năng lượng Tuyệt Kỹ (${Math.floor(player.overdrive)}/100)!`, "warn");
      return;
    }
    player.overdrive = 0;
    sfx.playOverdrive();
    ctx.addShake(5);

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
      // Rainbow Meteor Rain: 6 staggered meteors around aim/enemies
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
          damage: Math.round(player.atk * 2.5),
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
    player.dashCd = cdef.baseStats.dashCooldown;
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

    const mitigated = Math.max(2, Math.round(rawDamage - e.def * 0.55));
    e.hp -= mitigated;
    e.hitFlash = 0.13;
    e.state = "aggro";

    // Knockback (smaller for bosses)
    const kb = e.isBoss ? 2 : 7;
    if (kbX !== 0 || kbY !== 0) {
      ctx.world.moveWithCollision(e, kbX * kb, kbY * kb, e.radius * 0.7);
    }

    sfx.playHit(crit);
    ctx.vfx.spawnPooled(crit ? "crit-gold" : hitPreset, { x: e.x, y: e.y - 6 });
    ctx.vfx.spawnDamageText(e.x, e.y - 10, crit ? `CRIT ${mitigated}!` : `${mitigated}`, {
      crit,
      color: crit ? "#ffe25a" : "#ffffff",
    });

    if (crit) {
      ctx.addShake(2.0);
      ctx.addHitstop(0.025);
    }

    // Charge Ultimate Q gauge
    ctx.player.overdrive = Math.min(100, ctx.player.overdrive + (e.isBoss ? 4.5 : 6));

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
      const bonus = Math.round(ctx.player.atk * 1.45);
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

      // Equipment drop with pixelfx Loot Beam!
      if (Math.random() <= edef.equipDropChance) {
        const rarity = rollRarityUpgrade(edef.minRarity);
        const eqId = pickRandomEquipByRarity(rarity);
        ctx.spawner.spawnItemLoot(e.x, e.y, eqId, 1);
        const eqDef = ITEMS[eqId];
        if (eqDef && (rarity === "rare" || rarity === "epic" || rarity === "legendary")) {
          ctx.notify(`Rơi trang bị [${RARITY_INFO[rarity].label}] ${eqDef.name}!`, "epic");
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

  /** Applies damage to player, handling i-frames and Prism Knight E Shield counter-laser. */
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

    const dmg = Math.max(2, Math.round(rawAmount - player.def * 0.6));
    player.hp = Math.max(0, player.hp - dmg);
    player.hitFlash = 0.22;
    player.invuln = 0.55;
    sfx.playPlayerHit();
    ctx.addShake(3.8);
    vfx.spawnPooled("hit-fire", { x: player.x, y: player.y - 6 });
    vfx.spawnDamageText(player.x, player.y - 12, `-${dmg}`, { color: "#ff4466" });

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
            const { dmg, crit } = this._rollDamage(player, 0.85, 10);
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
          const { dmg, crit } = this._rollDamage(player, 0.72);
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

      // State transitions: Patrol <-> Aggro <-> Leash
      if (e.state === "patrol") {
        if (!playerInTown && distToPlayer <= edef.aggroRadius) {
          e.state = "aggro";
          if (e.isBoss) sfx.playBossRoar();
        }
      } else if (e.state === "aggro") {
        if (playerInTown || distToHome > edef.leashRadius || distToPlayer > edef.leashRadius + 60) {
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
    const enraged = b.hp < b.maxHp * 0.5;
    if (enraged && b.phase === 1) {
      b.phase = 2;
      sfx.playBossRoar();
      ctx.notify(`${ENEMIES[b.defId]?.name ?? "BOSS"} vào GIAI ĐOẠN 2!`, "warn");
    }

    if (distToPlayer > 48) {
      world.moveWithCollision(
        b,
        Math.cos(toPlayerAng) * moveSpd * (enraged ? 1.2 : 1.0) * dt,
        Math.sin(toPlayerAng) * moveSpd * (enraged ? 1.2 : 1.0) * dt,
        b.radius * 0.7
      );
    }

    // Radial bullet burst
    if (b.aiTimer <= 0) {
      b.aiTimer = enraged ? 2.2 : 3.0;
      const count = ai === "boss_eraser" ? 10 : enraged ? 8 : 6;
      const preset = ai === "boss_amber" ? "proj-amber" : "proj-void";
      for (let i = 0; i < count; i++) {
        const a = toPlayerAng + (i * Math.PI * 2) / count;
        ctx.projectiles.push({
          uid: nextEntityUid(),
          owner: "enemy",
          x: b.x,
          y: b.y - 6,
          vx: Math.cos(a) * 135,
          vy: Math.sin(a) * 135,
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
      b.specialTimer = enraged ? 3.2 : 4.4;
      if (ai === "boss_root") {
        // 3 Root Thorn telegraphs around player
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
            kind: "boss_thorns",
            x: tx,
            y: ty,
            radius: 30,
            delay: 0.9,
            age: 0,
            maxLife: 1.15,
            tickTimer: 0,
            damage: Math.round(b.atk * 1.25),
            triggered: false,
          });
        }
      } else if (ai === "boss_amber") {
        // Ground Slam + Lava Meteor telegraphs
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
      } else {
        // World Boss THE ERASER: Floor Erase Zones + Cross Laser Beam!
        for (let k = 0; k < (enraged ? 4 : 3); k++) {
          const tx = player.x + (k === 0 ? 0 : (Math.random() - 0.5) * 90);
          const ty = player.y + (k === 0 ? 0 : (Math.random() - 0.5) * 90);
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
            delay: 0.95,
            age: 0,
            maxLife: 1.2,
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
            maxLife: 1.05,
          });
          ctx.hazards.push({
            uid: nextEntityUid(),
            owner: "enemy",
            kind: "boss_cross",
            x: b.x,
            y: b.y,
            radius: 95,
            delay: 1.0,
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
