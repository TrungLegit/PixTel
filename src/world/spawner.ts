import { ENEMIES } from "../data/enemies";
import { ITEMS, createItemInstance, pickRandomEquipByRarity } from "../data/items";
import { TILE_SIZE, WORLD_CAMPS, WORLD_RESOURCES } from "../data/worldConfig";
import type {
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
 * Manages open-world Enemy Camps (patrol/aggro/leash + 30-90s respawn + locked chests)
 * and respawning Ore / Crystal mining nodes.
 */
export class WorldSpawner {
  readonly camps: CampRuntime[] = [];
  readonly chests: ChestEntity[] = [];
  readonly resources: ResourceEntity[] = [];
  readonly enemies: EnemyEntity[] = [];
  readonly groundLoot: GroundLootEntity[] = [];

  reset(openedChestIds: string[] = []) {
    this.camps.length = 0;
    this.chests.length = 0;
    this.resources.length = 0;
    this.enemies.length = 0;
    this.groundLoot.length = 0;

    const openedSet = new Set(openedChestIds);

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
          element: null,
          elementTime: 0,
          burnTime: 0,
          burnTick: 0,
          slowTime: 0,
          poisonTime: 0,
          poisonTick: 0,
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

  /** Opens an unlocked camp chest and bursts gold + guaranteed rarity equipment + materials. */
  openChest(chest: ChestEntity, vfx: VfxManager) {
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

    // Guaranteed equipment of chest rarity
    const eqId = pickRandomEquipByRarity(chest.rarity);
    this.spawnItemLoot(chest.x + 10, chest.y + 8, eqId, 1);

    // Bonus potion or crafting material
    const bonusId =
      chest.rarity === "legendary"
        ? "mat_void_prism"
        : chest.rarity === "epic"
          ? "mat_amber_gem"
          : chest.rarity === "rare"
            ? "mat_quartz_shard"
            : "pot_hp";
    this.spawnItemLoot(chest.x, chest.y + 13, bonusId, 2);
  }

  spawnGoldLoot(x: number, y: number, gold: number) {
    this.groundLoot.push({
      uid: nextEntityUid(),
      x: x + (Math.random() - 0.5) * 14,
      y: y + (Math.random() - 0.5) * 12,
      kind: "gold",
      gold,
      rarity: "common",
      age: 0,
      bobPhase: Math.random() * Math.PI * 2,
    });
  }

  spawnItemLoot(x: number, y: number, defId: string, qty = 1) {
    const def = ITEMS[defId];
    if (!def) return;
    this.groundLoot.push({
      uid: nextEntityUid(),
      x: x + (Math.random() - 0.5) * 18,
      y: y + (Math.random() - 0.5) * 14,
      kind: "item",
      item: createItemInstance(defId, qty, 0),
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

    // Age ground loot (expire after 180s to prevent infinite pile-up)
    for (let i = this.groundLoot.length - 1; i >= 0; i--) {
      const l = this.groundLoot[i];
      l.age += dt;
      if (l.age > 180) {
        this.groundLoot.splice(i, 1);
      }
    }
  }
}
