import {
  CLASS_ALTAR_POS,
  TILE_SIZE,
  TOWN_BOUNDS,
  TOWN_NPCS,
  WAYPOINTS,
  WORLD_CAMPS,
  WORLD_COLS,
  WORLD_H,
  WORLD_RESOURCES,
  WORLD_ROWS,
  WORLD_W,
  getBiomeAtTile,
} from "../data/worldConfig";
import { LORE_TABLETS } from "../data/lore";
import type { BiomeId } from "../data/types";

export enum TileKind {
  Ground = 0,
  Road = 1,
  Wall = 2,
  Water = 3,
  Lava = 4,
  Bridge = 5,
}

export interface WorldProp {
  id: number;
  kind: "tree" | "rock" | "pillar";
  biome: BiomeId;
  x: number; // world center x
  y: number; // world foot y
  radius: number;
}

export interface WorldBuilding {
  id: string;
  kind: "elderHouse" | "forgeHouse" | "shopHouse" | "classAltar";
  label: string;
  x: number; // world center x
  y: number; // world foot y
  halfW: number;
  halfH: number;
}

function hash2(x: number, y: number, seed = 1337): number {
  let n = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967296;
}

/**
 * Deterministic 160x160 seamless Open-World map with:
 * - Origin Town (walled safe zone, 4 gates, central plaza, 3 buildings + Class Altar)
 * - 4 surrounding biomes (Meadow NW, Quartz NE, Amber SW, Ruins SE)
 * - Roads linking town to all waypoints & boss arenas, rivers/lava with bridges
 * - Chunk-indexed static props for fast O(1) collision & viewport culling
 */
export class WorldMap {
  readonly cols = WORLD_COLS;
  readonly rows = WORLD_ROWS;
  readonly tiles = new Uint8Array(WORLD_COLS * WORLD_ROWS);
  readonly biomes: BiomeId[] = new Array(WORLD_COLS * WORLD_ROWS);
  readonly variants = new Uint8Array(WORLD_COLS * WORLD_ROWS);
  readonly props: WorldProp[] = [];
  readonly buildings: WorldBuilding[] = [];

  private propChunks = new Map<number, WorldProp[]>();
  private readonly chunkTiles = 16;

  constructor() {
    this._generate();
  }

  private _idx(tx: number, ty: number) {
    return ty * this.cols + tx;
  }

  private _setTile(tx: number, ty: number, kind: TileKind) {
    if (tx < 0 || ty < 0 || tx >= this.cols || ty >= this.rows) return;
    this.tiles[this._idx(tx, ty)] = kind;
  }

  private _carveRoad(x0: number, y0: number, x1: number, y1: number, halfWidth = 1) {
    let cx = Math.round(x0);
    let cy = Math.round(y0);
    const tx = Math.round(x1);
    const ty = Math.round(y1);
    const steps = Math.max(Math.abs(tx - cx), Math.abs(ty - cy), 1);
    for (let i = 0; i <= steps; i++) {
      const px = Math.round(cx + ((tx - cx) * i) / steps);
      const py = Math.round(cy + ((ty - cy) * i) / steps);
      for (let dy = -halfWidth; dy <= halfWidth; dy++) {
        for (let dx = -halfWidth; dx <= halfWidth; dx++) {
          const rx = px + dx;
          const ry = py + dy;
          if (rx <= 1 || ry <= 1 || rx >= this.cols - 2 || ry >= this.rows - 2) continue;
          const cur = this.tiles[this._idx(rx, ry)];
          if (cur === TileKind.Water || cur === TileKind.Lava) {
            this._setTile(rx, ry, TileKind.Bridge);
          } else if (cur !== TileKind.Wall) {
            this._setTile(rx, ry, TileKind.Road);
          }
        }
      }
    }
  }

  private _generate() {
    // 1. Base biomes & ground variants + world border walls
    for (let ty = 0; ty < this.rows; ty++) {
      for (let tx = 0; tx < this.cols; tx++) {
        const i = this._idx(tx, ty);
        this.biomes[i] = getBiomeAtTile(tx, ty);
        const r = hash2(tx, ty, 77);
        this.variants[i] = r < 0.72 ? 0 : r < 0.9 ? 1 : 2;
        if (tx <= 1 || ty <= 1 || tx >= this.cols - 2 || ty >= this.rows - 2) {
          this.tiles[i] = TileKind.Wall;
        } else {
          this.tiles[i] = TileKind.Ground;
        }
      }
    }

    // 2. Scenic rivers (Meadow & Quartz) and lava channels (Amber)
    // Meadow creek winding vertically around tx ~ 34
    for (let ty = 6; ty < 76; ty++) {
      const cx = Math.round(34 + Math.sin(ty * 0.14) * 4);
      for (let dx = -1; dx <= 1; dx++) {
        this._setTile(cx + dx, ty, TileKind.Water);
      }
    }
    // Quartz crystal river winding horizontally around ty ~ 48
    for (let tx = 95; tx < 154; tx++) {
      const cy = Math.round(48 + Math.cos(tx * 0.12) * 3);
      for (let dy = -1; dy <= 1; dy++) {
        this._setTile(tx, cy + dy, TileKind.Water);
      }
    }
    // Amber Mines molten lava river around tx ~ 44 & ty ~ 124
    for (let ty = 95; ty < 154; ty++) {
      const cx = Math.round(44 + Math.sin(ty * 0.13) * 4);
      for (let dx = -1; dx <= 1; dx++) {
        this._setTile(cx + dx, ty, TileKind.Lava);
      }
    }
    // Blank Ruins decorative abyss moats around boss sanctum
    for (let a = 0; a < 360; a += 3) {
      const rad = (a * Math.PI) / 180;
      // Leave wide entrances at W, N, NW
      if ((a > 160 && a < 240) || (a > 255 && a < 290)) continue;
      const rx = Math.round(140 + Math.cos(rad) * 14);
      const ry = Math.round(140 + Math.sin(rad) * 14);
      if (rx > 94 && ry > 94 && rx < 157 && ry < 157) {
        this._setTile(rx, ry, TileKind.Lava);
      }
    }

    // 3. Origin Town perimeter walls (68..92) with 4 wide open gates
    const { x0, y0, x1, y1, cx, cy } = TOWN_BOUNDS;
    for (let tx = x0; tx <= x1; tx++) {
      const isGate = Math.abs(tx - cx) <= 2;
      if (!isGate) {
        this._setTile(tx, y0, TileKind.Wall);
        this._setTile(tx, y1, TileKind.Wall);
      }
    }
    for (let ty = y0; ty <= y1; ty++) {
      const isGate = Math.abs(ty - cy) <= 2;
      if (!isGate) {
        this._setTile(x0, ty, TileKind.Wall);
        this._setTile(x1, ty, TileKind.Wall);
      }
    }
    // Town paved plaza & gate avenues
    for (let ty = 74; ty <= 86; ty++) {
      for (let tx = 73; tx <= 87; tx++) {
        this._setTile(tx, ty, TileKind.Road);
      }
    }
    this._carveRoad(cx, y0 - 2, cx, y1 + 2, 1);
    this._carveRoad(x0 - 2, cy, x1 + 2, cy, 1);

    // 4. Main highways from 4 gates to every biome's waypoints & boss arenas (auto-builds bridges!)
    // West gate -> Meadow camps, waypoints & Xing Warden boss arena
    this._carveRoad(x0 - 2, cy, 56, 76, 1);
    this._carveRoad(56, 76, 52, 56, 1);
    this._carveRoad(52, 56, 22, 28, 1);
    this._carveRoad(22, 28, 16, 18, 1);
    this._carveRoad(cx, y0 - 2, 52, 56, 1);

    // North/East gates -> Quartz Forest & Blight Root boss
    this._carveRoad(cx, y0 - 2, 108, 54, 1);
    this._carveRoad(x1 + 2, cy, 108, 54, 1);
    this._carveRoad(108, 54, 132, 26, 1);
    this._carveRoad(132, 26, 138, 20, 1);

    // West/South gates -> Amber Mines & Gilded Null boss
    this._carveRoad(x0 - 2, cy, 52, 108, 1);
    this._carveRoad(cx, y1 + 2, 52, 108, 1);
    this._carveRoad(52, 108, 24, 134, 1);
    this._carveRoad(24, 134, 20, 140, 1);

    // East/South gates -> Blank Ruins & World Boss The Eraser
    this._carveRoad(x1 + 2, cy, 108, 108, 1);
    this._carveRoad(cx, y1 + 2, 108, 108, 1);
    this._carveRoad(108, 108, 128, 126, 1);
    this._carveRoad(128, 126, 140, 140, 1);

    // Clear stone boss arenas
    const arenas = [
      { tx: 16, ty: 18, r: 8 },
      { tx: 138, ty: 20, r: 9 },
      { tx: 20, ty: 140, r: 9 },
      { tx: 140, ty: 140, r: 11 },
    ];
    for (const ar of arenas) {
      for (let dy = -ar.r; dy <= ar.r; dy++) {
        for (let dx = -ar.r; dx <= ar.r; dx++) {
          if (dx * dx + dy * dy <= ar.r * ar.r) {
            const tx = ar.tx + dx;
            const ty = ar.ty + dy;
            if (tx > 2 && ty > 2 && tx < this.cols - 3 && ty < this.rows - 3) {
              this._setTile(tx, ty, TileKind.Road);
            }
          }
        }
      }
    }

    // Ensure every Waypoint, Camp, Resource, and Lore Tablet sits on solid ground/road (not water/lava/wall)
    const clearPatch = (tx: number, ty: number, rad: number) => {
      for (let dy = -rad; dy <= rad; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
          const rx = tx + dx;
          const ry = ty + dy;
          if (rx <= 2 || ry <= 2 || rx >= this.cols - 3 || ry >= this.rows - 3) continue;
          const cur = this.tiles[this._idx(rx, ry)];
          if (cur === TileKind.Water || cur === TileKind.Lava || cur === TileKind.Wall) {
            this._setTile(rx, ry, TileKind.Ground);
          }
        }
      }
    };
    for (const wp of WAYPOINTS) clearPatch(wp.tx, wp.ty, 3);
    for (const camp of WORLD_CAMPS) clearPatch(camp.tx, camp.ty, 4);
    for (const res of WORLD_RESOURCES) clearPatch(res.tx, res.ty, 2);
    for (const lore of LORE_TABLETS) clearPatch(lore.tx, lore.ty, 2);

    // 5. Place Origin Town Buildings + Class Altar (all clear of gates, roads, NPCs, waypoints)
    this.buildings.push(
      {
        id: "b_forge",
        kind: "forgeHouse",
        label: "LÒ RÈN LĂNG KÍNH",
        x: 72 * TILE_SIZE + 8,
        y: 74 * TILE_SIZE + 8,
        halfW: 24,
        halfH: 12,
      },
      {
        id: "b_shop",
        kind: "shopHouse",
        label: "TIỆM TẠP HÓA",
        x: 88 * TILE_SIZE + 8,
        y: 74 * TILE_SIZE + 8,
        halfW: 24,
        halfH: 12,
      },
      {
        id: "b_elder",
        kind: "elderHouse",
        label: "NHÀ TRƯỞNG LÀNG",
        x: 72 * TILE_SIZE + 8,
        y: 88 * TILE_SIZE + 8,
        halfW: 24,
        halfH: 12,
      },
      {
        id: "b_altar",
        kind: "classAltar",
        label: "ĐÀI ĐỔI CLASS",
        x: CLASS_ALTAR_POS.tx * TILE_SIZE + 8,
        y: CLASS_ALTAR_POS.ty * TILE_SIZE + 8,
        halfW: 13,
        halfH: 8,
      }
    );

    // 6. Scatter environmental props (trees, crystal rocks, ruins pillars)
    const keepClearPts: { x: number; y: number; r: number }[] = [];
    for (const wp of WAYPOINTS) keepClearPts.push({ x: wp.tx, y: wp.ty, r: 5 });
    for (const camp of WORLD_CAMPS) keepClearPts.push({ x: camp.tx, y: camp.ty, r: 7 });
    for (const res of WORLD_RESOURCES) keepClearPts.push({ x: res.tx, y: res.ty, r: 3 });
    for (const lore of LORE_TABLETS) keepClearPts.push({ x: lore.tx, y: lore.ty, r: 3 });
    for (const npc of TOWN_NPCS) keepClearPts.push({ x: npc.tx, y: npc.ty, r: 4 });
    keepClearPts.push({ x: CLASS_ALTAR_POS.tx, y: CLASS_ALTAR_POS.ty, r: 4 });

    let nextPropId = 1;
    for (let ty = 4; ty < this.rows - 4; ty += 2) {
      for (let tx = 4; tx < this.cols - 4; tx += 2) {
        const i = this._idx(tx, ty);
        if (this.tiles[i] !== TileKind.Ground) continue;
        const biome = this.biomes[i];

        // Keep town clean except a few decorative trees in SE corner
        if (biome === "town") {
          if (!(tx >= 85 && tx <= 90 && ty >= 85 && ty <= 90)) continue;
        }

        // Keep clear of POIs & adjacent roads
        let blocked = false;
        for (const p of keepClearPts) {
          const dx = tx - p.x;
          const dy = ty - p.y;
          if (dx * dx + dy * dy < p.r * p.r) {
            blocked = true;
            break;
          }
        }
        if (blocked) continue;
        if (
          this.tiles[this._idx(tx + 1, ty)] === TileKind.Road ||
          this.tiles[this._idx(tx - 1, ty)] === TileKind.Road ||
          this.tiles[this._idx(tx, ty + 1)] === TileKind.Road ||
          this.tiles[this._idx(tx, ty - 1)] === TileKind.Road
        ) {
          continue;
        }

        const r = hash2(tx, ty, 901);
        const density =
          biome === "town" ? 0.35 : biome === "quartz" ? 0.22 : biome === "meadow" ? 0.16 : 0.15;
        if (r > density) continue;

        const rKind = hash2(tx, ty, 404);
        let kind: WorldProp["kind"] = "tree";
        if (biome === "amber") {
          kind = rKind < 0.65 ? "rock" : rKind < 0.85 ? "pillar" : "tree";
        } else if (biome === "ruins") {
          kind = rKind < 0.6 ? "pillar" : rKind < 0.85 ? "rock" : "tree";
        } else if (biome === "quartz") {
          kind = rKind < 0.62 ? "tree" : rKind < 0.9 ? "rock" : "pillar";
        } else {
          kind = rKind < 0.72 ? "tree" : rKind < 0.94 ? "rock" : "pillar";
        }

        const prop: WorldProp = {
          id: nextPropId++,
          kind,
          biome,
          x: tx * TILE_SIZE + 8,
          y: ty * TILE_SIZE + 12,
          radius: kind === "tree" ? 6 : 6,
        };
        this.props.push(prop);
        const key = this._chunkKey(Math.floor(tx / this.chunkTiles), Math.floor(ty / this.chunkTiles));
        let bucket = this.propChunks.get(key);
        if (!bucket) {
          bucket = [];
          this.propChunks.set(key, bucket);
        }
        bucket.push(prop);
      }
    }
  }

  private _chunkKey(cx: number, cy: number) {
    return cy * 32 + cx;
  }

  getTileAtWorld(wx: number, wy: number): TileKind {
    const tx = Math.floor(wx / TILE_SIZE);
    const ty = Math.floor(wy / TILE_SIZE);
    if (tx < 0 || ty < 0 || tx >= this.cols || ty >= this.rows) return TileKind.Wall;
    return this.tiles[this._idx(tx, ty)] as TileKind;
  }

  getBiomeAtWorld(wx: number, wy: number): BiomeId {
    const tx = Math.max(0, Math.min(this.cols - 1, Math.floor(wx / TILE_SIZE)));
    const ty = Math.max(0, Math.min(this.rows - 1, Math.floor(wy / TILE_SIZE)));
    return this.biomes[this._idx(tx, ty)];
  }

  isInSafeTown(wx: number, wy: number): boolean {
    return this.getBiomeAtWorld(wx, wy) === "town";
  }

  /** Checks tile walkability, building footprints, and nearby chunk props. */
  isBlocked(wx: number, wy: number, radius = 5): boolean {
    if (wx < 24 || wy < 24 || wx > WORLD_W - 24 || wy > WORLD_H - 24) return true;

    // Tile bounds check (4 sample corners around entity circle)
    const tx0 = Math.floor((wx - radius) / TILE_SIZE);
    const tx1 = Math.floor((wx + radius) / TILE_SIZE);
    const ty0 = Math.floor((wy - radius) / TILE_SIZE);
    const ty1 = Math.floor((wy + radius) / TILE_SIZE);
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        if (tx < 0 || ty < 0 || tx >= this.cols || ty >= this.rows) return true;
        const t = this.tiles[this._idx(tx, ty)];
        if (t === TileKind.Wall || t === TileKind.Water || t === TileKind.Lava) return true;
      }
    }

    // Town buildings collision
    for (const b of this.buildings) {
      if (
        wx + radius > b.x - b.halfW &&
        wx - radius < b.x + b.halfW &&
        wy + radius > b.y - b.halfH &&
        wy - radius < b.y + 4
      ) {
        return true;
      }
    }

    // Static props collision (only nearby chunks)
    const cx0 = Math.floor((wx - radius - 16) / (TILE_SIZE * this.chunkTiles));
    const cx1 = Math.floor((wx + radius + 16) / (TILE_SIZE * this.chunkTiles));
    const cy0 = Math.floor((wy - radius - 16) / (TILE_SIZE * this.chunkTiles));
    const cy1 = Math.floor((wy + radius + 16) / (TILE_SIZE * this.chunkTiles));
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const bucket = this.propChunks.get(this._chunkKey(cx, cy));
        if (!bucket) continue;
        for (const p of bucket) {
          const dx = wx - p.x;
          const dy = wy - p.y;
          const rr = radius + p.radius;
          if (dx * dx + dy * dy < rr * rr) return true;
        }
      }
    }
    return false;
  }

  /** Resolves smooth sliding movement along X/Y axes independently. */
  moveWithCollision(
    entity: { x: number; y: number },
    dx: number,
    dy: number,
    radius = 5
  ): { movedX: boolean; movedY: boolean } {
    let movedX = false;
    let movedY = false;
    if (dx !== 0 && !this.isBlocked(entity.x + dx, entity.y, radius)) {
      entity.x += dx;
      movedX = true;
    }
    if (dy !== 0 && !this.isBlocked(entity.x, entity.y + dy, radius)) {
      entity.y += dy;
      movedY = true;
    }
    return { movedX, movedY };
  }

  /** Returns strictly props visible inside camera bounds (Viewport Culling). */
  getVisibleProps(camX: number, camY: number, viewW: number, viewH: number, margin = 36): WorldProp[] {
    const out: WorldProp[] = [];
    const x0 = camX - margin;
    const x1 = camX + viewW + margin;
    const y0 = camY - margin;
    const y1 = camY + viewH + margin;

    const cx0 = Math.max(0, Math.floor(x0 / (TILE_SIZE * this.chunkTiles)));
    const cx1 = Math.floor(x1 / (TILE_SIZE * this.chunkTiles));
    const cy0 = Math.max(0, Math.floor(y0 / (TILE_SIZE * this.chunkTiles)));
    const cy1 = Math.floor(y1 / (TILE_SIZE * this.chunkTiles));

    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const bucket = this.propChunks.get(this._chunkKey(cx, cy));
        if (!bucket) continue;
        for (const p of bucket) {
          if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1) {
            out.push(p);
          }
        }
      }
    }
    return out;
  }
}
