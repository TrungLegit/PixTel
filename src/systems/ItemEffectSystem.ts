import { sfx } from "../audio/chiptuneSynth";
import { ITEMS, canClassEquip } from "../data/items";
import { EQUIP_SLOTS, type ClassId, type ElementType, type ItemDef, type RecipeDef } from "../data/types";
import type { EnemyEntity } from "../world/entities";
import type { CombatContext } from "./combat";
import type { InventorySystem } from "./inventorySystem";

export type PassiveDamageFn = (
  target: EnemyEntity,
  damage: number,
  crit: boolean,
  hitPreset: string,
  element?: ElementType,
  kbX?: number,
  kbY?: number,
  poiseMult?: number
) => void;

/**
 * Event-driven Item Passive, Curse, Shield, Stealth, Bleed & Set-Aura Manager.
 * Keeps combat loop clean by encapsulating cooldowns, hit counters, shield stacks, and hidden recipe triggers.
 */
export class ItemEffectSystem {
  cooldowns: Record<string, number> = {};
  hitCounters: Record<string, number> = {};
  standStillTimer = 0;
  lastPlayerX = 0;
  lastPlayerY = 0;
  regenTick = 0;
  forgeAuraTick = 0;

  shieldHp = 0;
  shieldMaxHp = 0;
  shieldTimer = 0;
  bloodShieldStacks = 0;
  stealthTimer = 0;

  activeSetAura: { setId: string; color: string; label: string } | null = null;

  reset() {
    this.cooldowns = {};
    this.hitCounters = {};
    this.standStillTimer = 0;
    this.lastPlayerX = 0;
    this.lastPlayerY = 0;
    this.regenTick = 0;
    this.forgeAuraTick = 0;
    this.shieldHp = 0;
    this.shieldMaxHp = 0;
    this.shieldTimer = 0;
    this.bloodShieldStacks = 0;
    this.stealthTimer = 0;
    this.activeSetAura = null;
  }

  getEquippedPassiveIds(inv: InventorySystem, classId?: ClassId): Set<string> {
    const ids = new Set<string>();
    for (const slot of EQUIP_SLOTS) {
      const eq = inv.equipment[slot];
      if (!eq) continue;
      const def = ITEMS[eq.defId];
      if (!def || (classId && !canClassEquip(def, classId))) continue;
      if (def.passive?.id) ids.add(def.passive.id);
    }
    return ids;
  }

  getCooldown(passiveId: string): number {
    return Math.max(0, this.cooldowns[passiveId] ?? 0);
  }

  addShield(amount: number, durationSec = 10, maxCap?: number) {
    if (amount <= 0) return;
    const cap = maxCap ?? Math.max(this.shieldMaxHp, this.shieldHp + amount);
    this.shieldMaxHp = Math.max(this.shieldMaxHp, cap);
    this.shieldHp = Math.min(this.shieldMaxHp, this.shieldHp + amount);
    this.shieldTimer = Math.max(this.shieldTimer, durationSec);
  }

  /** Evaluates whether a hidden or normal recipe is revealed/craftable. */
  isHiddenRecipeUnlocked(
    recipe: RecipeDef,
    inv: InventorySystem,
    unlockedHiddenItems: Set<string>,
    unlockedHiddenRecipes: Set<string>
  ): boolean {
    if (!recipe.isHidden && !recipe.isHiddenRecipe) return true;
    if (unlockedHiddenRecipes.has(recipe.id) || unlockedHiddenItems.has(recipe.resultDefId)) {
      return true;
    }
    if (recipe.hiddenUnlockRule === "dual_armor_owned") {
      return inv.hasItemAnywhere("ar_bloodstone_plate") && inv.hasItemAnywhere("ar_briar_cloak");
    }
    if (recipe.hiddenUnlockRule === "vanguard_boss2_kill") {
      return false; // Unlocked strictly upon defeating Boss Vùng 2 (Blight Root) with wp_vanguard_chipped
    }
    if (recipe.revealMaterialId && inv.countItem(recipe.revealMaterialId) > 0) {
      return true;
    }
    return false;
  }

  /** Checks boss kill unlock triggers (e.g. carrying wp_vanguard_chipped while defeating Boss Vùng 2). */
  checkBossKillHiddenUnlocks(bossDefId: string, inv: InventorySystem): string[] {
    const unlocked: string[] = [];
    if (
      bossDefId === "boss_blight_root" &&
      (inv.countItem("wp_vanguard_chipped") > 0 || inv.equipment.weapon?.defId === "wp_vanguard_chipped")
    ) {
      unlocked.push("rec_wp_starfall_blade");
    }
    return unlocked;
  }

  getAggroMultiplier(inv: InventorySystem, classId?: ClassId): number {
    if (this.stealthTimer > 0) return 0;
    const passives = this.getEquippedPassiveIds(inv, classId);
    return passives.has("stealth_range") ? 0.75 : 1.0;
  }

  update(ctx: CombatContext, dt: number, dealPassiveDamage?: PassiveDamageFn) {
    const { player, inv, spawner, vfx } = ctx;

    for (const k of Object.keys(this.cooldowns)) {
      if (this.cooldowns[k] > 0) {
        this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt);
      }
    }

    if (this.stealthTimer > 0) {
      this.stealthTimer = Math.max(0, this.stealthTimer - dt);
    }
    player.stealthTime = this.stealthTimer;

    if (this.shieldTimer > 0) {
      this.shieldTimer = Math.max(0, this.shieldTimer - dt);
      if (this.shieldTimer <= 0) {
        this.shieldHp = 0;
        this.shieldMaxHp = 0;
        this.bloodShieldStacks = 0;
      }
    }
    player.shieldHp = this.shieldHp;
    player.shieldMaxHp = this.shieldMaxHp;

    const passives = this.getEquippedPassiveIds(inv, player.classId);
    const activeSets = inv.getActiveSetBonuses(player.classId);
    const auraSet = activeSets.find((s) => s.threeActive && s.def.threePieceAuraColor);
    this.activeSetAura = auraSet
      ? {
          setId: auraSet.def.id,
          color: auraSet.def.threePieceAuraColor!,
          label: auraSet.def.threePieceAuraLabel ?? auraSet.def.name,
        }
      : null;
    player.activeSetAuraColor = this.activeSetAura?.color ?? null;

    // Track stand-still duration for Áo Choàng Gai Cổ Thụ (3s -> 2% HP/s, +1% if set_forest 3/3)
    const moved = Math.hypot(player.x - this.lastPlayerX, player.y - this.lastPlayerY);
    this.lastPlayerX = player.x;
    this.lastPlayerY = player.y;
    if (moved < 0.8 && player.dashing <= 0 && !player.charging) {
      this.standStillTimer += dt;
    } else {
      this.standStillTimer = 0;
      this.regenTick = 0;
    }

    if ((passives.has("thorns_regen") || auraSet?.def.id === "set_forest") && this.standStillTimer >= 3.0) {
      this.regenTick += dt;
      if (this.regenTick >= 1.0 && player.hp < player.maxHp) {
        this.regenTick -= 1.0;
        const pct = (passives.has("thorns_regen") ? 0.02 : 0) + (auraSet?.def.id === "set_forest" ? 0.01 : 0);
        const heal = Math.max(1, Math.round(player.maxHp * pct));
        player.hp = Math.min(player.maxHp, player.hp + heal);
        vfx.spawnDamageText(player.x, player.y - 14, `+${heal} HP`, { color: "#4ade80" });
      }
    }

    // Set Tâm Lò 3/3 aura: scorches nearby enemies every 1.2s
    if (auraSet?.def.id === "set_forge" && dealPassiveDamage) {
      this.forgeAuraTick += dt;
      if (this.forgeAuraTick >= 1.2) {
        this.forgeAuraTick = 0;
        for (const en of [...spawner.enemies]) {
          if (Math.hypot(en.x - player.x, en.y - player.y) <= 44 + en.radius) {
            en.burnTime = Math.max(en.burnTime, 2.0);
            dealPassiveDamage(en, Math.max(3, Math.round(player.atk * 0.25)), false, "hit-fire", "fire", 0, 0, 0.3);
          }
        }
      }
    }

    // Tick Bleed DOT stacks on enemies (4% ATK/s per stack, up to 3 stacks, 3s)
    if (dealPassiveDamage) {
      for (const en of [...spawner.enemies]) {
        if ((en.bleedTime ?? 0) > 0 && (en.bleedStacks ?? 0) > 0) {
          en.bleedTime = Math.max(0, (en.bleedTime ?? 0) - dt);
          en.bleedTick = (en.bleedTick ?? 0) - dt;
          if (en.bleedTick <= 0) {
            en.bleedTick = 1.0;
            const bleedDmg = Math.max(2, Math.round(player.atk * 0.04 * (en.bleedStacks ?? 1)));
            dealPassiveDamage(en, bleedDmg, false, "hit-fire", undefined, 0, 0, 0.15);
          }
          if (en.bleedTime <= 0) {
            en.bleedStacks = 0;
          }
        }
      }
    }
  }

  onHit(
    ctx: CombatContext,
    target: EnemyEntity,
    damageDealt: number,
    isCrit: boolean,
    opts?: { fromPassive?: boolean; dealPassiveDamage?: PassiveDamageFn }
  ) {
    if (opts?.fromPassive) return;
    const { player, inv, spawner, vfx } = ctx;
    const passives = this.getEquippedPassiveIds(inv, player.classId);

    // Lifesteal (stats + Lưỡi Hái Nhật Thực 8%)
    const lsPct = player.lifestealPct ?? 0;
    if (lsPct > 0 && damageDealt > 0 && player.hp < player.maxHp) {
      const heal = Math.max(1, Math.round((damageDealt * lsPct) / 100));
      player.hp = Math.min(player.maxHp, player.hp + heal);
    }

    // Trượng Lôi Đình Tí Hon: Mỗi đòn thứ 3 phóng sét nảy 2 mục tiêu gần nhất (50% DMG)
    if (passives.has("chain_lightning") && opts?.dealPassiveDamage) {
      this.hitCounters.chain_lightning = (this.hitCounters.chain_lightning ?? 0) + 1;
      if (this.hitCounters.chain_lightning % 3 === 0) {
        const nearby = spawner.enemies
          .filter((en) => en !== target && en.hp > 0 && Math.hypot(en.x - target.x, en.y - target.y) <= 140)
          .sort((a, b) => Math.hypot(a.x - target.x, a.y - target.y) - Math.hypot(b.x - target.x, b.y - target.y))
          .slice(0, 2);
        const arcDmg = Math.max(3, Math.round(damageDealt * 0.5));
        for (const arcTgt of nearby) {
          vfx.spawnPooled("zap-hit", { x: arcTgt.x, y: arcTgt.y - 6, scale: 0.85 });
          opts.dealPassiveDamage(arcTgt, arcDmg, false, "zap-hit", "volt", 0, 0, 0.5);
        }
        if (nearby.length > 0) {
          sfx.playShoot(960);
          vfx.spawnDamageText(target.x, target.y - 16, "⚡ CHAIN!", { color: "#60a5fa" });
        }
      }
    }

    // Lưỡi Hái Nhật Thực: Mỗi đòn thứ 4 chém lan hình bán nguyệt
    if (passives.has("eclipse_lifesteal") && opts?.dealPassiveDamage) {
      this.hitCounters.eclipse_cleave = (this.hitCounters.eclipse_cleave ?? 0) + 1;
      if (this.hitCounters.eclipse_cleave % 4 === 0) {
        const ang = player.aimAngle;
        vfx.spawnPooled("eclipse-reap", {
          x: player.x + Math.cos(ang) * 18,
          y: player.y + Math.sin(ang) * 18,
          angle: ang,
          scale: 1.0,
        });
        const cleaveDmg = Math.max(4, Math.round(player.atk * 0.75));
        for (const en of [...spawner.enemies]) {
          if (en === target || en.hp <= 0) continue;
          const d = Math.hypot(en.x - player.x, en.y - player.y);
          if (d <= 62 + en.radius) {
            const diff = Math.abs(Math.atan2(Math.sin(Math.atan2(en.y - player.y, en.x - player.x) - ang), Math.cos(Math.atan2(en.y - player.y, en.x - player.x) - ang)));
            if (diff <= Math.PI * 0.55) {
              opts.dealPassiveDamage(en, cleaveDmg, false, "explode-plasma", "void", Math.cos(ang) * 0.5, Math.sin(ang) * 0.5, 0.9);
            }
          }
        }
      }
    }

    // Búa Tạ Lò Nung: Đòn thứ 4 đập đất làm choáng 1s bán kính 48px
    if (passives.has("quake_stun")) {
      this.hitCounters.quake_stun = (this.hitCounters.quake_stun ?? 0) + 1;
      if (this.hitCounters.quake_stun % 4 === 0) {
        const cx = target.x;
        const cy = target.y;
        vfx.spawnPooled("ground-slam", { x: cx, y: cy, scale: 1.0 });
        vfx.spawnDamageText(cx, cy - 16, "★ QUAKE STUN!", { color: "#fb923c", crit: true });
        sfx.playExplosion();
        for (const en of [...spawner.enemies]) {
          if (Math.hypot(en.x - cx, en.y - cy) <= 48 + en.radius) {
            en.stunTime = Math.max(en.stunTime, 1.0);
          }
        }
      }
    }

    if (isCrit) {
      this.onCrit(ctx, target, damageDealt, opts);
    }
  }

  onCrit(
    ctx: CombatContext,
    target: EnemyEntity,
    _damageDealt: number,
    opts?: { dealPassiveDamage?: PassiveDamageFn }
  ) {
    const { player, inv, spawner, vfx } = ctx;
    const passives = this.getEquippedPassiveIds(inv, player.classId);

    // Dao Găm Gai Rừng: Đòn chí mạng gây chảy máu 4% ATK/s trong 3s (tối đa 3 cộng dồn)
    if (passives.has("bleed_crit")) {
      target.bleedStacks = Math.min(3, (target.bleedStacks ?? 0) + 1);
      target.bleedTime = 3.0;
      target.bleedTick = target.bleedTick && target.bleedTick > 0 ? target.bleedTick : 0.6;
      vfx.spawnPooled("bleed-slash", { x: target.x, y: target.y - 6, scale: 0.9 });
      vfx.spawnDamageText(target.x, target.y - 18, `BLEED x${target.bleedStacks}`, { color: "#f43f5e" });
    }

    // Thánh Kiếm Sao Rơi: Chí mạng gọi sao rơi gây 140% ATK AoE (CD 6s)
    if (passives.has("starfall_crit") && this.getCooldown("starfall_crit") <= 0 && opts?.dealPassiveDamage) {
      this.cooldowns.starfall_crit = 6.0;
      const sx = target.x;
      const sy = target.y;
      const starDmg = Math.max(8, Math.round(player.atk * 1.4));
      vfx.spawnPooled("starfall-aoe", { x: sx, y: sy, scale: 1.05 });
      vfx.spawnDamageText(sx, sy - 22, "★ STARFALL!", { color: "#facc15", crit: true });
      sfx.playExplosion();
      for (const en of [...spawner.enemies]) {
        if (Math.hypot(en.x - sx, en.y - sy) <= 56 + en.radius) {
          opts.dealPassiveDamage(en, starDmg, true, "crit-gold", "prism", 0, 0, 1.4);
        }
      }
    }
  }

  onTakeDamage(
    ctx: CombatContext,
    incomingDmg: number,
    srcX: number,
    srcY: number,
    isFire = false,
    dealPassiveDamage?: PassiveDamageFn
  ): number {
    const { player, inv, spawner, vfx } = ctx;
    const passives = this.getEquippedPassiveIds(inv, player.classId);

    let dmg = incomingDmg;
    if (isFire) {
      if (passives.has("burn_immune")) return 0;
      const fireRes = Math.min(85, player.fireResPct ?? 0);
      if (fireRes > 0) {
        dmg = Math.max(1, Math.round(dmg * (1 - fireRes / 100)));
      }
    }

    // Áo Choàng Gai Cổ Thụ: Phản 20% sát thương cận chiến
    if (passives.has("thorns_regen") && dealPassiveDamage) {
      const attacker = spawner.enemies
        .filter((en) => en.hp > 0 && Math.hypot(en.x - srcX, en.y - srcY) <= 40)
        .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0];
      if (attacker && Math.hypot(attacker.x - player.x, attacker.y - player.y) <= 70 + attacker.radius) {
        const reflectDmg = Math.max(2, Math.round(dmg * 0.2));
        vfx.spawnPooled("thorns-burst", { x: attacker.x, y: attacker.y, scale: 0.85 });
        vfx.spawnDamageText(attacker.x, attacker.y - 12, `THORNS ${reflectDmg}`, { color: "#4ade80" });
        dealPassiveDamage(attacker, reflectDmg, false, "hit-poison", "nature", 0, 0, 0.2);
      }
    }

    // Khiên hấp thụ sát thương (Giáp Huyết Thạch / Huy Hiệu Tro Tàn)
    if (this.shieldHp > 0) {
      const absorbed = Math.min(this.shieldHp, dmg);
      this.shieldHp -= absorbed;
      dmg -= absorbed;
      player.shieldHp = this.shieldHp;
      if (absorbed > 0) {
        vfx.spawnDamageText(player.x, player.y - 16, `SHIELD -${absorbed}`, { color: "#60a5fa" });
      }
      if (this.shieldHp <= 0) {
        this.shieldTimer = 0;
        this.bloodShieldStacks = 0;
      }
    }

    return Math.max(0, dmg);
  }

  onPostTakeDamage(ctx: CombatContext, dealPassiveDamage?: PassiveDamageFn) {
    const { player, inv, spawner, vfx } = ctx;
    if (player.hp <= 0) return;
    const passives = this.getEquippedPassiveIds(inv, player.classId);
    const hpRatio = player.hp / Math.max(1, player.maxHp);

    // Vương Miện Nhật Thực Vỡ: Khi HP < 35%, làm chậm quái xung quanh 40% trong 4s (CD 25s)
    if (passives.has("eclipse_slow") && hpRatio < 0.35 && this.getCooldown("eclipse_slow") <= 0) {
      this.cooldowns.eclipse_slow = 25.0;
      vfx.spawnPooled("eclipse-slow", { x: player.x, y: player.y, scale: 1.1 });
      vfx.spawnDamageText(player.x, player.y - 18, "★ ECLIPSE SLOW!", { color: "#c084fc", crit: true });
      for (const en of spawner.enemies) {
        if (Math.hypot(en.x - player.x, en.y - player.y) <= 120 + en.radius) {
          en.slowTime = Math.max(en.slowTime, 4.0);
        }
      }
    }

    // Huy Hiệu Tro Tàn: Khi HP < 30%, nổ lửa đẩy lùi quái + tạo khiên 20% MaxHP (CD 30s)
    if (passives.has("ember_nova") && hpRatio < 0.3 && this.getCooldown("ember_nova") <= 0) {
      this.cooldowns.ember_nova = 30.0;
      const shieldAmt = Math.max(10, Math.round(player.maxHp * 0.2));
      this.addShield(shieldAmt, 8, Math.max(shieldAmt, Math.round(player.maxHp * 0.25)));
      player.shieldHp = this.shieldHp;
      player.shieldMaxHp = this.shieldMaxHp;
      vfx.spawnPooled("ember-nova", { x: player.x, y: player.y, scale: 1.15 });
      vfx.spawnDamageText(player.x, player.y - 20, `🔥 EMBER NOVA +${shieldAmt} SHIELD`, {
        color: "#fb923c",
        crit: true,
      });
      sfx.playExplosion();
      for (const en of [...spawner.enemies]) {
        const dx = en.x - player.x;
        const dy = en.y - player.y;
        const d = Math.hypot(dx, dy);
        if (d <= 78 + en.radius) {
          const nx = d > 0 ? dx / d : 1;
          const ny = d > 0 ? dy / d : 0;
          ctx.world.moveWithCollision(en, nx * 24, ny * 24, en.radius * 0.7);
          en.burnTime = Math.max(en.burnTime, 3.0);
          if (dealPassiveDamage) {
            dealPassiveDamage(en, Math.max(6, Math.round(player.atk * 0.85)), false, "hit-fire", "fire", nx, ny, 0.8);
          }
        }
      }
    }
  }

  /** Chiến Giáp Vệ Binh Bất Diệt: 1 lần/45s, chặn đòn tử vong giữ lại 1 HP và bất tử 2s. */
  onFatalDamage(ctx: CombatContext): boolean {
    const { player, inv, vfx } = ctx;
    const passives = this.getEquippedPassiveIds(inv, player.classId);
    if (!passives.has("undying_wall") || this.getCooldown("undying_wall") > 0) {
      return false;
    }
    this.cooldowns.undying_wall = 45.0;
    player.hp = 1;
    player.invuln = Math.max(player.invuln, 2.0);
    sfx.playWaypoint();
    vfx.spawnPooled("undying-aegis", { x: player.x, y: player.y, scale: 1.1 });
    vfx.spawnDamageText(player.x, player.y - 20, "★ BẤT DIỆT (1 HP · 2s)", {
      color: "#facc15",
      crit: true,
    });
    ctx.notify("🛡 Chiến Giáp Vệ Binh Bất Diệt chặn đòn tử vong (1 HP + 2s bất tử)!", "epic");
    return true;
  }

  onKill(ctx: CombatContext, _enemy: EnemyEntity) {
    const { player, inv, vfx } = ctx;
    const passives = this.getEquippedPassiveIds(inv, player.classId);

    // Giáp Huyết Thạch: Hạ quái nhận khiên 5% MaxHP (tối đa 3 lớp, 10s)
    if (passives.has("blood_shield")) {
      this.bloodShieldStacks = Math.min(3, this.bloodShieldStacks + 1);
      const layerHp = Math.max(4, Math.round(player.maxHp * 0.05));
      const maxShield = layerHp * 3;
      this.shieldMaxHp = Math.max(this.shieldMaxHp, maxShield);
      this.shieldHp = Math.min(maxShield, this.shieldHp + layerHp);
      this.shieldTimer = 10.0;
      player.shieldHp = this.shieldHp;
      player.shieldMaxHp = this.shieldMaxHp;
      vfx.spawnPooled("blood-shield", { x: player.x, y: player.y - 6, scale: 0.95 });
      vfx.spawnDamageText(player.x, player.y - 16, `🛡 HUYẾT KHIÊN (${this.bloodShieldStacks}/3)`, {
        color: "#c084fc",
      });
    }

    // Nhẫn Giao Ước Rạn Nứt (Curse): Mỗi khi hạ quái mất 3% HP hiện tại (không gây chết)
    if (passives.has("pact_drain") && player.hp > 1) {
      const drain = Math.max(1, Math.floor(player.hp * 0.03));
      player.hp = Math.max(1, player.hp - drain);
      vfx.spawnDamageText(player.x, player.y - 12, `-${drain} (KHẾ ƯỚC)`, { color: "#f43f5e" });
    }
  }

  onDash(_ctx: CombatContext) {
    this.standStillTimer = 0;
  }

  onUseConsumable(ctx: CombatContext, def: ItemDef): boolean {
    if (def.consumableKind !== "mirage_vial") return false;
    const { player, spawner, vfx } = ctx;
    const dur = def.consumableSpec?.stealthSec ?? 2.5;
    const spdPct = def.consumableSpec?.speedPct ?? 0.4;
    this.stealthTimer = Math.max(this.stealthTimer, dur);
    player.stealthTime = this.stealthTimer;
    player.speedBuffTime = Math.max(player.speedBuffTime, dur);
    player.speedBuffPct = Math.max(player.speedBuffPct, spdPct);

    for (const en of spawner.enemies) {
      if (en.state === "aggro") {
        en.state = "patrol";
        en.aiTimer = 1.2;
      }
    }
    sfx.playDash();
    vfx.spawnPooled("mirage-smoke", { x: player.x, y: player.y - 4, scale: 1.05 });
    vfx.spawnDamageText(player.x, player.y - 16, `🌫 TÀNG HÌNH ${dur}s!`, {
      color: "#c084fc",
      crit: true,
    });
    return true;
  }
}
