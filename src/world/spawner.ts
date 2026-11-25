import { ENEMIES } from "../data/enemies";
import { ITEMS, createItemInstance, pickRandomEquipByRarity } from "../data/items";
import { TILE_SIZE, WAYPOINTS, WORLD_CAMPS, WORLD_RESOURCES } from "../data/worldConfig";
import type { ClassId, InfusableElement, Rarity, WaypointDef } from "../data/types";
import type {
  ArenaTotemEntity,
  CampRuntime,
  ChestEntity,
  EnemyEntity,
  GroundLootEntity,
  ResourceEntity,
} from "./entities";
import type { VfxManager } from "../vfx/vfxManager";

let entityUidSeq = 1;
export function nextEntityUid(): number {
  return entityUidSeq++;
}

/**
 * Manages open-world Enemy Camps (patrol/aggro/leash + 30-90s respawn + locked chests),
 * Waypoint Chroma Chests, Arena Chroma Totems, pixel-bounce Ground Loot, and respawning Ore / Crystal mining nodes.
 */
export class WorldSpawner {
  readonly camps: CampRuntime[] = [];
  readonly chests: ChestEntity[] = [];
  readonly resources: ResourceEntity[] = [];
  readonly enemies: EnemyEntity[] = [];
  readonly groundLoot: GroundLootEntity[] = [];
  readonly arenaTotems: ArenaTotemEntity[] = [];

  reset(openedChestIds: string[] = [], unlockedWaypoints: string[] = []) {
    this.camps.length = 0;
    this.chests.length = 0;
    this.resources.length = 0;
    this.enemies.length = 0;
    this.groundLoot.length = 0;
    this.arenaTotems.length = 0;

    const openedSet = new Set(openedChestIds);
    const unlockedSet = new Set(unlockedWaypoints);

    for (const def of WORLD_CAMPS) {
      this.camps.push({
        def,
        respawnTimer: 0,
        waitingRespawn: false,
      });

      if (def.hasLockedChest) {
        this.chests.push({
          campId: def.id,
          x: def.tx * TILE_SIZE + 8,
          y: def.ty * TILE_SIZE - 8,
          rarity: def.chestRarity,
          state: openedSet.has(def.id) ? "opened" : "locked",
        });
      }

      this._spawnCampEnemies(def.id, null);
    }

    // Restore Waypoint Chroma Chests for previously unlocked non-town waypoints
    for (const wp of WAYPOINTS) {
      if (wp.initiallyUnlocked || !unlockedSet.has(wp.id)) continue;
      const cid = `wp_chest_${wp.id}`;
      this.chests.push({
        campId: cid,
        x: (wp.tx + 2) * TILE_SIZE + 8,
        y: wp.ty * TILE_SIZE + 8,
        rarity: this._waypointChestRarity(wp),
        state: openedSet.has(cid) ? "opened" : "unlocked",
      });
    }

    for (const rdef of WORLD_RESOURCES) {
      this.resources.push({
        def: rdef,
        x: rdef.tx * TILE_SIZE + 8,
        y: rdef.ty * TILE_SIZE + 8,
        hp: rdef.maxHp,
        maxHp: rdef.maxHp,
        alive: true,
        respawnTimer: 0,
        hitFlash: 0,
      });
    }
  }

  /**
   * Spawns 4 Resonance Chroma Totems around The Eraser's arena:
   * - Phase 2: 4 Classic Elemental Totems (fire, ice, nature, volt)
   * - Phase 3: 4 Primordial Expanded Totems (void, chroma, wind, quake)
   */
  spawnEraserTotems(centerX: number, centerY: number, vfx: VfxManager | null, phase = 2) {
    this.arenaTotems.length = 0;
    const elems: InfusableElement[] =
      phase >= 3
        ? ["void", "chroma", "wind", "quake"]
        : ["fire", "ice", "nature", "volt"];
    const offsets: [number, number][] = [
      [-68, -56],
      [68, -56],
      [-68, 56],
      [68, 56],
    ];
    for (let i = 0; i < 4; i++) {
      const tx = centerX + offsets[i][0];
      const ty = centerY + offsets[i][1];
      this.arenaTotems.push({
        uid: nextEntityUid(),
        element: elems[i],
        x: tx,
        y: ty,
        lit: false,
        hitFlash: 0,
      });
      if (vfx) {
        vfx.spawnPooled("portal-void", { x: tx, y: ty, layer: "back" });
      }
    }
  }

  private _waypointChestRarity(wp: WaypointDef): Rarity {
    if (wp.biome === "ruins") return "legendary";
    if (wp.biome === "amber") return "epic";
    if (wp.biome === "quartz") return "rare";
    return "uncommon";
  }

  /** Spawns an unlocked Chroma Chest right beside a newly awakened Chroma Waypoint. */
  spawnWaypointChromaChest(wp: WaypointDef, vfx: VfxManager): ChestEntity | null {
    if (wp.initiallyUnlocked) return null;
    const cid = `wp_chest_${wp.id}`;
    const existing = this.chests.find((c) => c.campId === cid);
    if (existing) return existing;

    const chest: ChestEntity = {
      campId: cid,
      x: (wp.tx + 2) * TILE_SIZE + 8,
      y: wp.ty * TILE_SIZE + 8,
      rarity: this._waypointChestRarity(wp),
      state: "unlocked",
    };
    this.chests.push(chest);
    vfx.spawnPooled("collect-burst", { x: chest.x, y: chest.y - 4 });
    vfx.spawnDamageText(chest.x, chest.y - 12, "CHROMA CHEST!", { color: "#5ef2ff", crit: true });
    return chest;
  }

  getOpenedChestIds(): string[] {
    return this.chests.filter((c) => c.state === "opened").map((c) => c.campId);
  }

  private _spawnCampEnemies(campId: string, vfx: VfxManager | null) {
    const camp = this.camps.find((c) => c.def.id === campId);
    if (!camp) return;
    const cx = camp.def.tx * TILE_SIZE + 8;
    const cy = camp.def.ty * TILE_SIZE + 8;

    let slot = 0;
    for (const entry of camp.def.enemies) {
      const edef = ENEMIES[entry.typeId];
      if (!edef) continue;
      for (let i = 0; i < entry.count; i++) {
        const ang = (slot * 2.1) + 0.4;
        const dist = edef.isBoss ? 0 : 18 + (slot % 3) * 14;
        const ex = cx + Math.cos(ang) * dist;
        const ey = cy + Math.sin(ang) * dist;
        slot++;

        // Non-boss bruisers get their bleachShield right away; Bosses activate bleachShield on Phase transitions (and start with 40% initial armor)
        const maxShield = edef.bleachShield ?? 0;
        const initShield = edef.isBoss ? Math.round(maxShield * 0.4) : maxShield;

        this.enemies.push({
          uid: nextEntityUid(),
          defId: edef.id,
          campId,
          biome: camp.def.biome,
          x: ex,
          y: ey,
          homeX: ex,
          homeY: ey,
          vx: 0,
          vy: 0,
          facing: 1,
          facingDir: "down",
          radius: edef.radius,
          hp: edef.maxHp,
          maxHp: edef.maxHp,
          atk: edef.atk,
          def: edef.def,
          spd: edef.spd,
          level: edef.level,
          isBoss: !!edef.isBoss,
          isWorldBoss: !!edef.isWorldBoss,
          state: "patrol",
          patrolTargetX: ex,
          patrolTargetY: ey,
          patrolWait: 0.6 + Math.random() * 1.6,
          aiTimer: 0.9 + Math.random() * 0.9,
          specialTimer: 3.0 + Math.random() * 1.5,
          phase: 1,
          hitFlash: 0,
          walkTime: Math.random() * 5,
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
          spawnAnimTime: vfx ? 0.52 : 0,
          alertTimer: 0,
          hurtTilt: 0,
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
          bleachShield: initShield,
          maxBleachShield: maxShield,
          totemChannelTimer: 0,
        });

        if (vfx) {
          vfx.spawnPooled("portal-void", { x: ex, y: ey, layer: "back" });
        }
      }
    }
  }

  /** Called right after an enemy dies so camp chests unlock and respawn timers arm. */
  onEnemyRemoved(campId: string, vfx: VfxManager): { chestUnlocked: boolean } {
    const aliveInCamp = this.enemies.some((e) => e.campId === campId);
    if (aliveInCamp) return { chestUnlocked: false };

    const camp = this.camps.find((c) => c.def.id === campId);
    if (camp && !camp.waitingRespawn) {
      camp.waitingRespawn = true;
      camp.respawnTimer = camp.def.respawnSec;
    }

    const chest = this.chests.find((c) => c.campId === campId);
    if (chest && chest.state === "locked") {
      chest.state = "unlocked";
      vfx.spawnPooled("collect-burst", { x: chest.x, y: chest.y - 4 });
      vfx.spawnDamageText(chest.x, chest.y - 12, "CHEST UNLOCKED!", { color: "#ffe066", crit: true });
      return { chestUnlocked: true };
    }
    return { chestUnlocked: false };
  }

  /** Resets an aggro Boss back to full HP/Phase 1 if the player falls in its sealed arena. */
  resetBossOnPlayerDeath(bossUid: number) {
    const boss = this.enemies.find((e) => e.uid === bossUid && e.isBoss);
    if (boss) {
      const edef = ENEMIES[boss.defId];
      boss.hp = boss.maxHp;
      boss.phase = 1;
      boss.state = "patrol";
      boss.x = boss.homeX;
      boss.y = boss.homeY;
      boss.vx = 0;
      boss.vy = 0;
      boss.facingDir = "down";
      boss.animKind = "idle";
      boss.animTime = 0;
      boss.animImpactDone = false;
      boss.dashTime = 0;
      boss.guardTime = 0;
      boss.skillCycle = 0;
      boss.bleachShield = edef?.bleachShield ? Math.round(edef.bleachShield * 0.4) : 0;
      boss.bossSummonedAdds = false;
      boss.element = null;
      boss.elementTime = 0;
      boss.vulnTime = 0;
      boss.stunTime = 0;
      boss.rootTime = 0;
      boss.totemChannelTimer = 0;
      if (boss.defId === "boss_the_eraser") {
        this.arenaTotems.length = 0;
      }
    }
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (this.enemies[i].isSummonedMinion) {
        this.enemies.splice(i, 1);
      }
    }
  }

  /** Opens an unlocked camp/waypoint Chroma Chest and bursts gold + equipment + Prism Shards. */
  openChest(chest: ChestEntity, vfx: VfxManager, preferredClassId?: ClassId) {
    if (chest.state !== "unlocked") return;
    chest.state = "opened";
    vfx.spawnPooled("chest-open", { x: chest.x, y: chest.y - 4, scale: 1.1 });

    // Gold burst
    const goldBase =
      chest.rarity === "legendary"
        ? 260
        : chest.rarity === "epic"
          ? 140
          : chest.rarity === "rare"
            ? 80
            : 45;
    this.spawnGoldLoot(chest.x - 10, chest.y + 8, goldBase + Math.floor(Math.random() * 35));

    // Guaranteed equipment of chest rarity (biased toward active class + slight +1/+2 pre-enhance chance)
    const eqId = pickRandomEquipByRarity(chest.rarity, preferredClassId);
    const enh = chest.rarity === "legendary" ? 2 : chest.rarity === "epic" ? 1 : 0;
    this.spawnItemLoot(chest.x + 10, chest.y + 8, eqId, 1, enh);

    // Prism Shards + crafting material
    const shardQty = chest.rarity === "legendary" ? 6 : chest.rarity === "epic" ? 4 : 2;
    this.spawnItemLoot(chest.x - 4, chest.y + 12, "mat_prism_shard", shardQty);

    const bonusId =
      chest.rarity === "legendary"
        ? "mat_void_prism"
        : chest.rarity === "epic"
          ? "mat_amber_gem"
          : chest.rarity === "rare"
            ? "mat_quartz_shard"
            : "pot_hp";
    this.spawnItemLoot(chest.x + 4, chest.y + 13, bonusId, 2);

    // Boss Main Chests always award a matching Biome Seasonal Gacha Key!
    const bossKeyMap: Record<string, string> = {
      camp_meadow_boss: "key_season_spring",
      camp_quartz_boss: "key_season_winter",
      camp_amber_boss: "key_season_summer",
      camp_world_boss: "key_season_eclipse",
    };
    const keyId = bossKeyMap[chest.campId];
    if (keyId) {
      this.spawnItemLoot(chest.x, chest.y + 15, keyId, 1);
    }
  }

  spawnGoldLoot(x: number, y: number, gold: number) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 28 + Math.random() * 34;
    this.groundLoot.push({
      uid: nextEntityUid(),
      x,
      y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      z: 2,
      vz: 85 + Math.random() * 35,
      kind: "gold",
      gold,
      rarity: "common",
      age: 0,
      bobPhase: Math.random() * Math.PI * 2,
    });
  }

  spawnItemLoot(x: number, y: number, defId: string, qty = 1, enhanceLevel = 0) {
    const def = ITEMS[defId];
    if (!def) return;
    const ang = Math.random() * Math.PI * 2;
    const spd = 30 + Math.random() * 40;
    this.groundLoot.push({
      uid: nextEntityUid(),
      x,
      y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      z: 3,
      vz: 95 + Math.random() * 40,
      kind: "item",
      item: createItemInstance(defId, qty, enhanceLevel),
      rarity: def.rarity,
      age: 0,
      bobPhase: Math.random() * Math.PI * 2,
    });
  }

  update(dt: number, playerX: number, playerY: number, vfx: VfxManager) {
    // Respawn cleared camps when timer expires and player isn't standing directly on top
    for (const camp of this.camps) {
      if (!camp.waitingRespawn) continue;
      camp.respawnTimer -= dt;
      if (camp.respawnTimer <= 0) {
        const cx = camp.def.tx * TILE_SIZE + 8;
        const cy = camp.def.ty * TILE_SIZE + 8;
        const dist = Math.hypot(playerX - cx, playerY - cy);
        if (dist > 64) {
          camp.waitingRespawn = false;
          this._spawnCampEnemies(camp.def.id, vfx);
        } else {
          camp.respawnTimer = 4; // defer slightly while player stands right inside camp
        }
      }
    }

    // Respawn mined resources
    for (const res of this.resources) {
      if (res.hitFlash > 0) res.hitFlash = Math.max(0, res.hitFlash - dt);
      if (res.alive) continue;
      res.respawnTimer -= dt;
      if (res.respawnTimer <= 0) {
        res.alive = true;
        res.hp = res.maxHp;
        vfx.spawnPooled("collect-burst", { x: res.x, y: res.y });
      }
    }

    // Pixel-bounce physics + age ground loot (expire after 180s)
    for (let i = this.groundLoot.length - 1; i >= 0; i--) {
      const l = this.groundLoot[i];
      l.age += dt;
      if (l.z > 0 || l.vz !== 0 || Math.abs(l.vx) > 0.5 || Math.abs(l.vy) > 0.5) {
        l.x += l.vx * dt;
        l.y += l.vy * dt;
        l.vz -= 340 * dt;
        l.z += l.vz * dt;
        if (l.z <= 0) {
          l.z = 0;
          if (Math.abs(l.vz) > 36) {
            l.vz = -l.vz * 0.42;
            l.vx *= 0.55;
            l.vy *= 0.55;
          } else {
            l.vz = 0;
            l.vx = 0;
            l.vy = 0;
          }
        }
      }
      if (l.age > 180) {
        this.groundLoot.splice(i, 1);
      }
    }
  }
}
