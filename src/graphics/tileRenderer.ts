import { BIOME_CONFIGS, TILE_SIZE, WORLD_COLS, WORLD_ROWS } from "../data/worldConfig";
import { hex } from "../vfx/pixelfx/core/color.js";
import { sprites } from "./pixelSprites";
import type { ColorRestorationSystem } from "./colorRestoration";
import type { WorldMap } from "../world/worldMap";
import { TileKind } from "../world/worldMap";

/**
 * Viewport-culled 16-bit Tilemap Renderer + live 160x160 overview pixel map cache
 * for zero-cost Minimap and World Map rendering.
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
    const tx0 = Math.max(0, Math.floor(ox / ts));
    const tx1 = Math.min(WORLD_COLS - 1, Math.floor((ox + viewW) / ts) + 1);
    const ty0 = Math.max(0, Math.floor(oy / ts));
    const ty1 = Math.min(WORLD_ROWS - 1, Math.floor((oy + viewH) / ts) + 1);
    const animFrame = Math.floor(time * 2.5) & 1;

    for (let ty = ty0; ty <= ty1; ty++) {
      const py = ty * ts - oy;
      for (let tx = tx0; tx <= tx1; tx++) {
        const px = tx * ts - ox;
        const idx = ty * WORLD_COLS + tx;
        const tile = world.tiles[idx];
        const biome = world.biomes[idx];
        const restored = colorSys.restoredGrid[idx] === 1;
        const set = restored ? sprites.tilesRestored[biome] : sprites.tilesBleached[biome];

        let img: HTMLCanvasElement;
        if (tile === TileKind.Road) img = set.road;
        else if (tile === TileKind.Wall) img = set.wall;
        else if (tile === TileKind.Water) img = animFrame ? set.water1 : set.water0;
        else if (tile === TileKind.Lava) img = animFrame ? set.lava1 : set.lava0;
        else if (tile === TileKind.Bridge) img = set.bridge;
        else {
          const variant = world.variants[idx];
          img = variant === 2 ? set.ground2 : variant === 1 ? set.ground1 : set.ground0;
        }
        ctx.drawImage(img, px, py);
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
