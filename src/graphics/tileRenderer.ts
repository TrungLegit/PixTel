import { BIOME_CONFIGS, TILE_SIZE, WORLD_COLS, WORLD_ROWS } from "../data/worldConfig";
import { hex } from "../vfx/pixelfx/core/color.js";
import { DUAL_GRID_FRAME_BY_MASK, dualGridMask } from "./pixelCraft";
import { sprites, type TileSet } from "./pixelSprites";
import type { ColorRestorationSystem } from "./colorRestoration";
import type { WorldMap } from "../world/worldMap";
import { TileKind } from "../world/worldMap";

/**
 * Viewport-culled 16-bit Tilemap Renderer powered by SpriteCook 15-piece Dual-Grid autotiling
 * for smooth organic roads, riverbanks, lava channels, and 3/4 connected stone walls,
 * plus live 160x160 overview bitmap cache for Minimap and World Map.
 */
export class TileRenderer {
  readonly overviewCanvas: HTMLCanvasElement;
  private overviewCtx: CanvasRenderingContext2D;
  private overviewImg: ImageData;
  private overviewU32: Uint32Array;

  constructor() {
    this.overviewCanvas = document.createElement("canvas");
    this.overviewCanvas.width = WORLD_COLS;
    this.overviewCanvas.height = WORLD_ROWS;
    this.overviewCtx = this.overviewCanvas.getContext("2d")!;
    this.overviewCtx.imageSmoothingEnabled = false;
    this.overviewImg = this.overviewCtx.createImageData(WORLD_COLS, WORLD_ROWS);
    this.overviewU32 = new Uint32Array(this.overviewImg.data.buffer);
  }

  private _tileAt(world: WorldMap, tx: number, ty: number): TileKind {
    if (tx < 0 || ty < 0 || tx >= WORLD_COLS || ty >= WORLD_ROWS) return TileKind.Wall;
    return world.tiles[ty * WORLD_COLS + tx];
  }

  private _isWaterCell(world: WorldMap, tx: number, ty: number): boolean {
    const t = this._tileAt(world, tx, ty);
    if (t === TileKind.Water) return true;
    if (t === TileKind.Bridge) {
      // Bridge continues water seamlessly beneath its planks
      return (
        this._tileAt(world, tx - 1, ty) === TileKind.Water ||
        this._tileAt(world, tx + 1, ty) === TileKind.Water ||
        this._tileAt(world, tx, ty - 1) === TileKind.Water ||
        this._tileAt(world, tx, ty + 1) === TileKind.Water
      );
    }
    return false;
  }

  private _isLavaCell(world: WorldMap, tx: number, ty: number): boolean {
    const t = this._tileAt(world, tx, ty);
    if (t === TileKind.Lava) return true;
    if (t === TileKind.Bridge) {
      return (
        this._tileAt(world, tx - 1, ty) === TileKind.Lava ||
        this._tileAt(world, tx + 1, ty) === TileKind.Lava ||
        this._tileAt(world, tx, ty - 1) === TileKind.Lava ||
        this._tileAt(world, tx, ty + 1) === TileKind.Lava
      );
    }
    return false;
  }

  private _isRoadCell(world: WorldMap, tx: number, ty: number): boolean {
    const t = this._tileAt(world, tx, ty);
    return t === TileKind.Road || t === TileKind.Bridge;
  }

  private _pickCornerTileSet(
    world: WorldMap,
    colorSys: ColorRestorationSystem,
    tx: number,
    ty: number,
    tl: boolean,
    tr: boolean,
    bl: boolean,
    br: boolean
  ): TileSet {
    let sx = tx;
    let sy = ty;
    if (br) {
      sx = tx;
      sy = ty;
    } else if (bl) {
      sx = tx - 1;
      sy = ty;
    } else if (tr) {
      sx = tx;
      sy = ty - 1;
    } else if (tl) {
      sx = tx - 1;
      sy = ty - 1;
    }
    sx = Math.max(0, Math.min(WORLD_COLS - 1, sx));
    sy = Math.max(0, Math.min(WORLD_ROWS - 1, sy));
    const idx = sy * WORLD_COLS + sx;
    const biome = world.biomes[idx];
    return colorSys.restoredGrid[idx] === 1 ? sprites.tilesRestored[biome] : sprites.tilesBleached[biome];
  }

  /** Renders strictly tiles inside [camX..camX+viewW, camY..camY+viewH] (Viewport Culling). */
  drawVisibleGround(
    ctx: CanvasRenderingContext2D,
    world: WorldMap,
    colorSys: ColorRestorationSystem,
    camX: number,
    camY: number,
    viewW: number,
    viewH: number,
    time: number
  ) {
    const ox = Math.round(camX);
    const oy = Math.round(camY);
    const ts = TILE_SIZE;
    const half = ts >> 1;
    const tx0 = Math.max(0, Math.floor(ox / ts));
    const tx1 = Math.min(WORLD_COLS - 1, Math.floor((ox + viewW) / ts) + 1);
    const ty0 = Math.max(0, Math.floor(oy / ts));
    const ty1 = Math.min(WORLD_ROWS - 1, Math.floor((oy + viewH) / ts) + 1);
    const waterFrame = Math.floor(time * 2.2) & 3;
    const lavaFrame = Math.floor(time * 1.8) & 3;

    const isRestoredCell = (tx: number, ty: number) => {
      if (tx < 0 || ty < 0 || tx >= WORLD_COLS || ty >= WORLD_ROWS) return false;
      return colorSys.restoredGrid[ty * WORLD_COLS + tx] === 1;
    };
    const isFullyRestored = (tx: number, ty: number) =>
      isRestoredCell(tx, ty) &&
      isRestoredCell(tx - 1, ty) &&
      isRestoredCell(tx + 1, ty) &&
      isRestoredCell(tx, ty - 1) &&
      isRestoredCell(tx, ty + 1) &&
      isRestoredCell(tx - 1, ty - 1) &&
      isRestoredCell(tx + 1, ty - 1) &&
      isRestoredCell(tx - 1, ty + 1) &&
      isRestoredCell(tx + 1, ty + 1);

    // PASS 1: Base seamless 4-variant ground.
    // Along the Restored-vs-Bleached frontier, draw Bleached base first so Pass 2a can paint
    // a smooth SpriteCook Dual-Grid 15-piece Restored terrain overlay cleanly over it!
    for (let ty = ty0; ty <= ty1; ty++) {
      const py = ty * ts - oy;
      for (let tx = tx0; tx <= tx1; tx++) {
        const px = tx * ts - ox;
        const idx = ty * WORLD_COLS + tx;
        const biome = world.biomes[idx];
        const set = isFullyRestored(tx, ty) ? sprites.tilesRestored[biome] : sprites.tilesBleached[biome];
        const baseVar = world.variants[idx];
        const vIdx = baseVar === 0 && ((tx * 7 + ty * 13) & 3) === 0 ? 3 : baseVar;
        ctx.drawImage(set.grounds[vIdx] ?? set.grounds[0], px, py);
      }
    }

    // PASS 2: SpriteCook 15-piece Dual-Grid overlays (shifted by -8,-8 around tile corners)
    const dgX0 = Math.max(0, tx0);
    const dgX1 = Math.min(WORLD_COLS, tx1 + 1);
    const dgY0 = Math.max(0, ty0);
    const dgY1 = Math.min(WORLD_ROWS, ty1 + 1);

    for (let ty = dgY0; ty <= dgY1; ty++) {
      const py = ty * ts - half - oy;
      for (let tx = dgX0; tx <= dgX1; tx++) {
        const px = tx * ts - half - ox;

        // 2a. Smooth Restored-over-Bleached Ground Frontier (zero square stair-stepping!)
        const cTL = isRestoredCell(tx - 1, ty - 1);
        const cTR = isRestoredCell(tx, ty - 1);
        const cBL = isRestoredCell(tx - 1, ty);
        const cBR = isRestoredCell(tx, ty);
        const cMask = dualGridMask(cTL, cTR, cBL, cBR);
        if (cMask > 0 && cMask < 15) {
          const frame = DUAL_GRID_FRAME_BY_MASK[cMask];
          const set = this._pickCornerTileSet(world, colorSys, tx, ty, cTL, cTR, cBL, cBR);
          ctx.drawImage(set.groundDual, (frame & 3) * ts, (frame >> 2) * ts, ts, ts, px, py, ts, ts);
        } else if (
          cMask === 15 &&
          (!isFullyRestored(tx - 1, ty - 1) ||
            !isFullyRestored(tx, ty - 1) ||
            !isFullyRestored(tx - 1, ty) ||
            !isFullyRestored(tx, ty))
        ) {
          const frame = DUAL_GRID_FRAME_BY_MASK[15];
          const set = this._pickCornerTileSet(world, colorSys, tx, ty, true, true, true, true);
          ctx.drawImage(set.groundDual, (frame & 3) * ts, (frame >> 2) * ts, ts, ts, px, py, ts, ts);
        }

        // 2b. Calm Flagstone Roads (smooth organic rounded curbs, zero grid seams!)
        const rTL = this._isRoadCell(world, tx - 1, ty - 1);
        const rTR = this._isRoadCell(world, tx, ty - 1);
        const rBL = this._isRoadCell(world, tx - 1, ty);
        const rBR = this._isRoadCell(world, tx, ty);
        const rMask = dualGridMask(rTL, rTR, rBL, rBR);
        if (rMask > 0) {
          const frame = DUAL_GRID_FRAME_BY_MASK[rMask];
          const set = this._pickCornerTileSet(world, colorSys, tx, ty, rTL, rTR, rBL, rBR);
          ctx.drawImage(set.roadDual, (frame & 3) * ts, (frame >> 2) * ts, ts, ts, px, py, ts, ts);
        }

        // 2b. Animated Water Rivers & Banks (4-frame gentle drift)
        const wTL = this._isWaterCell(world, tx - 1, ty - 1);
        const wTR = this._isWaterCell(world, tx, ty - 1);
        const wBL = this._isWaterCell(world, tx - 1, ty);
        const wBR = this._isWaterCell(world, tx, ty);
        const wMask = dualGridMask(wTL, wTR, wBL, wBR);
        if (wMask > 0) {
          const frame = DUAL_GRID_FRAME_BY_MASK[wMask];
          const set = this._pickCornerTileSet(world, colorSys, tx, ty, wTL, wTR, wBL, wBR);
          ctx.drawImage(set.waterDual[waterFrame], (frame & 3) * ts, (frame >> 2) * ts, ts, ts, px, py, ts, ts);
        }

        // 2c. Animated Molten Lava Channels & Obsidian Banks
        const lTL = this._isLavaCell(world, tx - 1, ty - 1);
        const lTR = this._isLavaCell(world, tx, ty - 1);
        const lBL = this._isLavaCell(world, tx - 1, ty);
        const lBR = this._isLavaCell(world, tx, ty);
        const lMask = dualGridMask(lTL, lTR, lBL, lBR);
        if (lMask > 0) {
          const frame = DUAL_GRID_FRAME_BY_MASK[lMask];
          const set = this._pickCornerTileSet(world, colorSys, tx, ty, lTL, lTR, lBL, lBR);
          ctx.drawImage(set.lavaDual[lavaFrame], (frame & 3) * ts, (frame >> 2) * ts, ts, ts, px, py, ts, ts);
        }
      }
    }

    // PASS 3: Architectural Bridges (spanning cleanly over water/lava) & 3/4 Connected Stone Walls + Cast Shadows
    for (let ty = ty0; ty <= ty1; ty++) {
      const py = ty * ts - oy;
      for (let tx = tx0; tx <= tx1; tx++) {
        const px = tx * ts - ox;
        const idx = ty * WORLD_COLS + tx;
        const tile = world.tiles[idx];
        if (tile !== TileKind.Bridge && tile !== TileKind.Wall) continue;

        const biome = world.biomes[idx];
        const restored = colorSys.restoredGrid[idx] === 1;
        const set = restored ? sprites.tilesRestored[biome] : sprites.tilesBleached[biome];

        if (tile === TileKind.Bridge) {
          const verticalLiquid =
            this._tileAt(world, tx, ty - 1) === TileKind.Water ||
            this._tileAt(world, tx, ty + 1) === TileKind.Water ||
            this._tileAt(world, tx, ty - 1) === TileKind.Lava ||
            this._tileAt(world, tx, ty + 1) === TileKind.Lava;
          ctx.drawImage(verticalLiquid ? set.bridgeH : set.bridgeV, px, py);
        } else if (tile === TileKind.Wall) {
          const wallSouth = this._tileAt(world, tx, ty + 1) === TileKind.Wall;
          const wallEast = this._tileAt(world, tx + 1, ty) === TileKind.Wall;
          const wallWest = this._tileAt(world, tx - 1, ty) === TileKind.Wall;
          if (!wallSouth) {
            // Soft cast shadow on ground immediately south of the wall
            ctx.fillStyle = "rgba(8, 10, 20, 0.28)";
            ctx.fillRect(px, py + ts, ts, 4);
            ctx.drawImage(set.wallFront, px, py);
          } else if (!wallEast && !wallWest) {
            // Framed vertical N-S perimeter wall with crisp E/W outer stone trim
            ctx.drawImage(set.wallVert, px, py);
          } else {
            ctx.drawImage(set.wallTop, px, py);
          }
        }
      }
    }
  }

  /** Rebuilds the 160x160 overview bitmap whenever color restoration updates. */
  syncOverviewMap(world: WorldMap, colorSys: ColorRestorationSystem) {
    if (!colorSys.dirtyMapPixels) return;
    colorSys.dirtyMapPixels = false;

    const u32 = this.overviewU32;
    for (let i = 0; i < WORLD_COLS * WORLD_ROWS; i++) {
      const biome = world.biomes[i];
      const tile = world.tiles[i];
      const restored = colorSys.restoredGrid[i] === 1;
      const cfg = BIOME_CONFIGS[biome];
      const pal = restored ? cfg.restored : cfg.bleached;

      let colorHex = restored ? cfg.mapColorRestored : cfg.mapColorBleached;
      if (tile === TileKind.Road || tile === TileKind.Bridge) colorHex = pal.road;
      else if (tile === TileKind.Wall) colorHex = pal.wallDark;
      else if (tile === TileKind.Water) colorHex = pal.waterB;
      else if (tile === TileKind.Lava) colorHex = pal.lavaB;
      u32[i] = hex(colorHex);
    }

    this.overviewCtx.putImageData(this.overviewImg, 0, 0);
  }
}
