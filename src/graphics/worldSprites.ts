import type { BiomePalette } from "../data/worldConfig";
import type { BiomeId } from "../data/types";
import {
  PixelBuf,
  band,
  buildDualGridAtlas,
  clamp,
  drawCrystalSpire,
  drawFoliageCluster,
  fbm,
  hash2i,
  hexToU32,
  hueRamp,
  hueRampFromHex,
  mixU32,
  rgba,
  rockHeight,
  smoothstep,
  tileFbm,
} from "./pixelCraft";

export interface RichTileSet {
  grounds: HTMLCanvasElement[]; // 4 seamless 16x16 biome variants
  groundDual: HTMLCanvasElement; // 64x64 SpriteCook 15-piece dual-grid organic biome/restoration ground overlay
  roadDual: HTMLCanvasElement; // 64x64 SpriteCook 15-piece dual-grid cobblestone atlas
  waterDual: HTMLCanvasElement[]; // 4 animated 64x64 dual-grid water atlases
  lavaDual: HTMLCanvasElement[]; // 4 animated 64x64 dual-grid lava atlases
  wallTop: HTMLCanvasElement; // 16x16 stone wall top/crenellation
  wallVert: HTMLCanvasElement; // 16x16 vertical N-S stone wall with framed E/W edges
  wallFront: HTMLCanvasElement; // 16x16 3/4 south-facing stone wall facade
  bridgeH: HTMLCanvasElement; // 16x16 horizontal timber bridge
  bridgeV: HTMLCanvasElement; // 16x16 vertical timber bridge
  trees: HTMLCanvasElement[]; // 2 biome-specific tree variants (~36x44)
  rocks: HTMLCanvasElement[]; // 2 height-field rock/crystal variants (~24x22)
  pillars: HTMLCanvasElement[]; // 2 intact/broken ruins pillar variants (~20x34)
  // Legacy compatibility fields
  ground0: HTMLCanvasElement;
  ground1: HTMLCanvasElement;
  ground2: HTMLCanvasElement;
  road: HTMLCanvasElement;
  wall: HTMLCanvasElement;
  water0: HTMLCanvasElement;
  water1: HTMLCanvasElement;
  lava0: HTMLCanvasElement;
  lava1: HTMLCanvasElement;
  bridge: HTMLCanvasElement;
  tree: HTMLCanvasElement;
  rock: HTMLCanvasElement;
  pillar: HTMLCanvasElement;
}

// =========================================================================
// 1. SEAMLESS GROUND TILES (4 Variants per Biome)
// =========================================================================

function buildGroundTile(biome: BiomeId, pal: BiomePalette, variant: number, restored: boolean): HTMLCanvasElement {
  const b = new PixelBuf(16, 16);
  const gA = hexToU32(pal.groundA);
  const gB = hexToU32(pal.groundB);
  const gC = hexToU32(pal.groundC);
  const gDeep = mixU32(gB, hexToU32(pal.outline), 0.25);
  const ramp = new Uint32Array([gDeep, gB, gA, gC]);
  const folDark = hexToU32(pal.foliageDark);
  const folMid = hexToU32(pal.foliageMid);
  const folLight = hexToU32(pal.foliageLight);
  const flower = hexToU32(pal.flower);
  const crys = hexToU32(pal.crystalLight);
  const seed = 41 + variant * 137 + biome.charCodeAt(0) * 19;

  // Base seamless soft-undulating terrain (NO salt-and-pepper grain!)
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const n = tileFbm((x / 16) * 2, (y / 16) * 2, 2, 2, seed);
      let v = clamp(0.32 + (n - 0.5) * 0.85 + (variant === 1 ? -0.1 : 0));

      if (biome === "amber") {
        // Subtle basalt slab fractures
        const h = rockHeight(x + variant * 7, y + variant * 5, seed, 0.22);
        v = clamp(v * 0.55 + h * 0.55);
      } else if (biome === "ruins" || biome === "town") {
        // Subtle ancient courtyard flagstone bevels
        const sx = (x + (y >= 8 ? 4 : 0)) % 8;
        const sy = y % 8;
        if (sx === 0 || sy === 0) v -= 0.2;
        else if (sx === 1 || sy === 1) v += 0.14;
      }

      b.pset(x, y, ramp[band(v, ramp.length, x, y, 0.16)]);
    }
  }

  // Variant micro-flora & biome details (hand-placed readable 16-bit motifs)
  if (variant === 1) {
    if (biome === "meadow" || biome === "town") {
      // Soft two-blade grass tuft
      b.pset(4, 11, folDark);
      b.pset(5, 11, folDark);
      b.pset(3, 10, folMid);
      b.pset(5, 9, folMid);
      b.pset(6, 10, folLight);
      b.pset(12, 5, folDark);
      b.pset(11, 4, folMid);
      b.pset(13, 4, folLight);
    } else if (biome === "quartz") {
      // Mossy crystal fern sprig
      b.line(3, 12, 6, 9, folMid);
      b.pset(4, 10, folLight);
      b.pset(11, 5, folDark);
      b.pset(12, 4, crys);
    } else if (biome === "amber") {
      // Warm cracked ember fissure
      b.line(4, 10, 7, 11, gDeep);
      if (restored) b.pset(6, 11, hexToU32(pal.lavaB));
      b.rect(11, 4, 2, 2, gC);
      b.pset(11, 4, hexToU32(pal.wallLight));
    } else {
      // Ruins hairline crack + subtle rune dot
      b.line(3, 4, 6, 7, gDeep);
      b.pset(11, 11, restored ? crys : gC);
    }
  } else if (variant === 2) {
    if (biome === "meadow") {
      // Grass cluster + vibrant wildflower bloom!
      b.rect(4, 10, 3, 2, folDark);
      b.pset(3, 9, folMid);
      b.pset(5, 8, folLight);
      b.pset(7, 9, folMid);
      b.pset(10, 6, folDark);
      b.pset(11, 6, folMid);
      b.pset(10, 5, flower);
      b.pset(11, 5, flower);
      b.pset(10, 4, hexToU32("#fffbe0"));
      b.pset(12, 5, flower);
    } else if (biome === "quartz") {
      // Mini glowing quartz crystal bud
      b.rect(9, 10, 4, 2, folDark);
      b.rect(10, 7, 2, 4, hexToU32(pal.crystalDark));
      b.rect(10, 7, 1, 3, crys);
      b.pset(10, 6, hexToU32("#ffffff"));
      b.pset(4, 5, folMid);
      b.pset(5, 4, flower);
    } else if (biome === "amber") {
      // Small amber mineral nugget on dark slate
      b.rect(5, 9, 4, 3, hexToU32(pal.crystalDark));
      b.rect(6, 8, 2, 3, crys);
      b.pset(6, 8, hexToU32("#ffffff"));
      b.pset(11, 5, gDeep);
    } else if (biome === "ruins") {
      // Etched arcane floor sigil corner
      b.line(4, 4, 7, 4, restored ? flower : gC);
      b.line(4, 4, 4, 7, restored ? flower : gC);
      b.pset(5, 5, restored ? crys : gDeep);
      b.pset(11, 11, restored ? crys : gC);
    } else {
      // Town tiny decorative cobblestone tuft & petal
      b.pset(3, 12, folMid);
      b.pset(4, 11, folLight);
      b.pset(12, 4, flower);
    }
  } else if (variant === 3) {
    // Subtle pebble / clover / fissure variety so wide areas never repeat mechanically
    b.rect(6, 6, 3, 2, gDeep);
    b.rect(6, 6, 2, 1, gC);
    if (biome === "meadow" || biome === "town") {
      b.pset(12, 12, folMid);
      b.pset(11, 11, folLight);
    } else if (biome === "quartz" && restored) {
      b.pset(12, 11, crys);
    }
  }

  return b.toCanvas();
}

// =========================================================================
// 2. SPRITECOOK DUAL-GRID 15-PIECE ATLASES (Ground Frontier, Roads, Water, Lava)
// =========================================================================

/**
 * Dual-Grid 15-piece organic ground overlay used along Restored-vs-Bleached frontiers
 * so restored grass/moss/stone blooms smoothly with rounded organic edges instead of square stairs.
 */
function buildGroundDualAtlas(biome: BiomeId, pal: BiomePalette): HTMLCanvasElement {
  const gA = hexToU32(pal.groundA);
  const gB = hexToU32(pal.groundB);
  const gC = hexToU32(pal.groundC);
  const gDeep = mixU32(gB, hexToU32(pal.outline), 0.25);
  const folMid = hexToU32(pal.foliageMid);
  const folDark = hexToU32(pal.foliageDark);
  const ramp = new Uint32Array([gDeep, gB, gA, gC]);
  const seed = 41 + biome.charCodeAt(0) * 19;

  return buildDualGridAtlas(
    16,
    (lx, ly, _cov, edgeBand, isTopEdge, isBotEdge) => {
      if (edgeBand) {
        // Organic grassy/tufted transition edge along the restoration boundary
        if (biome === "meadow" || biome === "quartz") {
          if (isBotEdge) return folDark;
          return ((lx + ly) & 1) === 0 ? folMid : gC;
        }
        return isBotEdge ? gB : isTopEdge ? gC : gA;
      }
      const n = tileFbm((lx / 16) * 2, (ly / 16) * 2, 2, 2, seed);
      const v = clamp(0.32 + (n - 0.5) * 0.85);
      return ramp[band(v, ramp.length, lx, ly, 0.16)];
    },
    109
  );
}

/**
 * Calm, noble 16-bit flagstone road & plaza dual-grid atlas:
 * Large 8x8 staggered pavers with soft subtle seams so characters, NPCs, and VFX pop cleanly.
 */
function buildRoadDualAtlas(pal: BiomePalette): HTMLCanvasElement {
  const base = hexToU32(pal.road);
  const edge = hexToU32(pal.roadEdge);
  const hi = mixU32(base, hexToU32("#fff6e0"), 0.16);
  const softTone = mixU32(base, edge, 0.12);
  const softSeam = mixU32(base, edge, 0.28);
  const curbLit = mixU32(base, edge, 0.42);
  const curbShade = mixU32(edge, hexToU32(pal.outline), 0.25);

  return buildDualGridAtlas(
    16,
    (lx, ly, cov, edgeBand, isTopEdge, isBotEdge) => {
      // Crisp beveled curb ONLY at outer road edge
      if (edgeBand) {
        if (isBotEdge) return curbShade;
        if (isTopEdge) return curbLit;
        return edge;
      }

      // Large calm 8x8 staggered flagstones (much cleaner & less busy than 4px brick rows!)
      const row = ly >> 3;
      const sx = (lx + (row & 1) * 4) & 7;
      const sy = ly & 7;
      const cellX = ((lx + (row & 1) * 4) >> 3) & 1;
      const stoneVar = hash2i(cellX + row * 3, row, 509);

      // Hairline low-contrast mortar seam (skips corners for natural worn flagstone look)
      if ((sy === 7 && sx > 0 && sx < 7) || (sx === 7 && sy > 0 && sy < 7)) {
        return softSeam;
      }
      // Subtle top-left bevel highlight on select pavers
      if (sy === 0 && sx >= 1 && sx <= 5 && stoneVar > 0.35) {
        return hi;
      }
      if (cov < 0.74) return softTone;
      return stoneVar < 0.36 ? softTone : base;
    },
    91
  );
}

function buildWaterDualFrames(pal: BiomePalette, restored: boolean): HTMLCanvasElement[] {
  const deep = hexToU32(pal.waterA);
  const shallow = hexToU32(pal.waterB);
  const abyss = mixU32(deep, hexToU32(pal.outline), 0.35);
  const bankShadow = mixU32(hexToU32(pal.groundB), hexToU32(pal.outline), 0.48);
  const foam = restored ? mixU32(shallow, hexToU32("#e8ffff"), 0.65) : mixU32(shallow, hexToU32("#d8dde6"), 0.5);
  const glint = restored ? hexToU32("#eaffff") : hexToU32("#cfd6e0");

  return [0, 1, 2, 3].map((frame) =>
    buildDualGridAtlas(
      16,
      (lx, ly, cov, edgeBand, isTopEdge, isBotEdge) => {
        // Bank shadow & shoreline rim (gives crisp sunken riverbed depth!)
        if (edgeBand) {
          if (isTopEdge) return bankShadow;
          if (isBotEdge) return mixU32(shallow, bankShadow, 0.32);
          return mixU32(deep, bankShadow, 0.45);
        }

        // Shallow turquoise water band near shore with gentle animated foam pixels
        if (cov < 0.84) {
          const wave = ((lx + frame * 2 + ly) & 7) === 0;
          return wave ? foam : shallow;
        }

        // Gentle Codixel-paced water ripples (slow drift, never boiling!)
        const shiftX = (lx + frame * 4) % 16;
        const n = tileFbm((shiftX / 16) * 2, (ly / 16) * 3, 2, 2, 207);
        if (n > 0.73 && (ly & 1) === 0) return glint;
        if (n > 0.58) return shallow;
        if (n < 0.28) return abyss;
        return deep;
      },
      123
    )
  );
}

function buildLavaDualFrames(pal: BiomePalette, restored: boolean): HTMLCanvasElement[] {
  const lavaDark = hexToU32(pal.lavaA);
  const lavaBright = hexToU32(pal.lavaB);
  const crust = mixU32(hexToU32(pal.wallDark), hexToU32(pal.outline), 0.55);
  const rimGlow = mixU32(lavaDark, crust, 0.45);
  const core = restored ? hexToU32("#fff4b3") : mixU32(lavaBright, hexToU32("#ffffff"), 0.35);

  return [0, 1, 2, 3].map((frame) =>
    buildDualGridAtlas(
      16,
      (lx, ly, cov, edgeBand) => {
        if (edgeBand) return crust;
        if (cov < 0.8) return rimGlow;

        // Rolling magma convection veins
        const sx = (lx + frame * 2) % 16;
        const sy = (ly + (frame >> 1) * 2) % 16;
        const n = tileFbm((sx / 16) * 2, (sy / 16) * 2, 2, 2, 331);
        const vein = Math.abs(n - 0.5);
        if (vein < 0.065) return core;
        if (vein < 0.16) return lavaBright;
        if (n > 0.74) return mixU32(lavaDark, crust, 0.55);
        return lavaDark;
      },
      149
    )
  );
}

// =========================================================================
// 3. ARCHITECTURAL WALLS & TIMBER BRIDGES
// =========================================================================

function buildWallTiles(pal: BiomePalette): {
  wallTop: HTMLCanvasElement;
  wallVert: HTMLCanvasElement;
  wallFront: HTMLCanvasElement;
} {
  const out = hexToU32(pal.outline);
  const wDark = hexToU32(pal.wallDark);
  const wMid = hexToU32(pal.wallMid);
  const wLight = hexToU32(pal.wallLight);
  const hi = mixU32(wLight, hexToU32("#ffffff"), 0.2);

  // Interior / thick parapet capstone (connected on multiple sides)
  const top = new PixelBuf(16, 16);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const bx = x & 7;
      const by = y & 7;
      if (by === 7 || bx === 7) top.pset(x, y, mixU32(wDark, wMid, 0.35));
      else if (by === 0 && bx > 0 && bx < 7) top.pset(x, y, hi);
      else top.pset(x, y, hash2i(x >> 3, y >> 3, 61) > 0.5 ? wLight : wMid);
    }
  }

  // Vertical N-S fortified perimeter wall (clean framed left/right stone parapet + battlements!)
  const vert = new PixelBuf(16, 16);
  vert.rect(0, 0, 16, 16, wMid);
  // Crisp outer dark border on East & West edges
  vert.rect(0, 0, 1, 16, out);
  vert.rect(15, 0, 1, 16, out);
  // Lit left bevel & shaded right bevel
  vert.rect(1, 0, 2, 16, wLight);
  vert.rect(1, 0, 1, 16, hi);
  vert.rect(12, 0, 3, 16, wDark);
  // Center walkway stone blocks with subtle joints & embrasure notches
  for (let y = 0; y < 16; y++) {
    if (y === 7 || y === 15) {
      vert.rect(2, y, 12, 1, mixU32(wDark, wMid, 0.35));
    } else if (y === 0 || y === 8) {
      vert.rect(3, y, 9, 1, wLight);
    }
    // Subtle crenel notch indentation on outer edge
    if (y >= 3 && y <= 5) {
      vert.pset(13, y, wMid);
      vert.pset(2, y, wMid);
    }
  }

  // 3/4 South-facing stone wall facade (beveled capstone + stacked masonry + base trim!)
  const front = new PixelBuf(16, 16);
  front.rect(0, 0, 16, 1, out);
  front.rect(0, 1, 16, 4, wLight);
  front.rect(0, 1, 16, 1, hi);
  front.rect(7, 1, 1, 4, wMid);
  front.rect(15, 1, 1, 4, wMid);
  front.rect(0, 5, 16, 1, wDark);
  for (let y = 6; y < 15; y++) {
    const row = Math.floor((y - 6) / 3);
    const offset = (row & 1) * 4;
    for (let x = 0; x < 16; x++) {
      const bx = (x + offset) % 8;
      const by = (y - 6) % 3;
      if (by === 2 || bx === 7) front.pset(x, y, wDark);
      else if (by === 0 && y < 12) front.pset(x, y, wMid);
      else front.pset(x, y, mixU32(wDark, wMid, y < 12 ? 0.65 : 0.35));
    }
  }
  front.rect(0, 15, 16, 1, out);

  return { wallTop: top.toCanvas(), wallVert: vert.toCanvas(), wallFront: front.toCanvas() };
}

function buildBridgeTiles(pal: BiomePalette): { bridgeH: HTMLCanvasElement; bridgeV: HTMLCanvasElement } {
  const wood = hueRamp(4, { hue: 28, sat: 0.56, satDrop: 0.12, lightMin: 0.18, lightMax: 0.62, shift: 18 });
  const out = hexToU32(pal.outline);
  const nail = hexToU32("#c8d4e0");

  // Horizontal crossing bridge (planks run vertically, railings along top & bottom)
  const bh = new PixelBuf(16, 16);
  bh.rect(0, 0, 16, 16, out);
  // Top & bottom timber side rails with posts
  bh.rect(0, 0, 16, 3, wood[0]);
  bh.rect(0, 1, 16, 1, wood[3]);
  bh.rect(0, 13, 16, 3, wood[0]);
  bh.rect(0, 14, 16, 1, wood[2]);
  for (let x = 0; x < 16; x += 4) {
    const shade = (x >> 2) & 1 ? wood[2] : wood[1];
    bh.rect(x, 3, 3, 10, shade);
    bh.rect(x, 3, 1, 10, wood[3]);
    bh.rect(x + 3, 3, 1, 10, wood[0]);
    bh.pset(x + 1, 4, nail);
    bh.pset(x + 1, 11, nail);
  }
  // Rail posts
  for (const px of [1, 13]) {
    bh.rect(px, 0, 2, 3, wood[3]);
    bh.rect(px, 13, 2, 3, wood[2]);
  }

  // Vertical crossing bridge (planks run horizontally, railings along left & right)
  const bv = new PixelBuf(16, 16);
  bv.rect(0, 0, 16, 16, out);
  bv.rect(0, 0, 3, 16, wood[0]);
  bv.rect(1, 0, 1, 16, wood[3]);
  bv.rect(13, 0, 3, 16, wood[0]);
  bv.rect(14, 0, 1, 16, wood[2]);
  for (let y = 0; y < 16; y += 4) {
    const shade = (y >> 2) & 1 ? wood[2] : wood[1];
    bv.rect(3, y, 10, 3, shade);
    bv.rect(3, y, 10, 1, wood[3]);
    bv.rect(3, y + 3, 10, 1, wood[0]);
    bv.pset(4, y + 1, nail);
    bv.pset(11, y + 1, nail);
  }
  for (const py of [1, 13]) {
    bv.rect(0, py, 3, 2, wood[3]);
    bv.rect(13, py, 3, 2, wood[2]);
  }

  return { bridgeH: bh.toCanvas(), bridgeV: bv.toCanvas() };
}

// =========================================================================
// 4. CODIXEL BIOME-SPECIFIC TREES, ROCKS & RUIN PILLARS (2 Variants Each)
// =========================================================================

function buildBiomeTree(biome: BiomeId, pal: BiomePalette, variant: number, restored: boolean): HTMLCanvasElement {
  const b = new PixelBuf(36, 44);
  const trunkRamp = hueRampFromHex(pal.trunk, 4, { span: 0.16, shift: 16 });
  const folDeep = mixU32(hexToU32(pal.foliageDark), hexToU32(pal.outline), 0.35);
  const folDark = hexToU32(pal.foliageDark);
  const folMid = hexToU32(pal.foliageMid);
  const folLight = hexToU32(pal.foliageLight);
  const folPeak = mixU32(folLight, hexToU32("#fffbe0"), restored ? 0.32 : 0.16);
  const folRamp = new Uint32Array([folDeep, folDark, folMid, folLight, folPeak]);
  const flower = hexToU32(pal.flower);
  const crysRamp = new Uint32Array([
    hexToU32(pal.crystalDark),
    mixU32(hexToU32(pal.crystalDark), hexToU32(pal.crystalLight), 0.5),
    hexToU32(pal.crystalLight),
    hexToU32("#ffffff"),
  ]);
  const outDark = hexToU32(pal.outline);
  const outLit = mixU32(folDark, outDark, 0.55);
  const seed = 100 + variant * 73 + biome.charCodeAt(0) * 11;

  if (biome === "quartz") {
    // Tall Crystalline Conifer / Quartz Pine with layered pine boughs & crystal spires!
    b.litCapsule(18, 40, 18, 20, 3.2, 1.8, trunkRamp);
    // Flared roots
    b.litCapsule(18, 39, 13, 41, 1.8, 1.0, trunkRamp);
    b.litCapsule(18, 39, 23, 41, 1.8, 1.0, trunkRamp);
    // Tiered pine canopy (bottom widest -> crisp pointed tip)
    const tiers = variant === 0
      ? [
          { y: 30, rx: 13.5, ry: 5.5 },
          { y: 23, rx: 11, ry: 5.2 },
          { y: 16, rx: 8.2, ry: 4.8 },
          { y: 10, rx: 5.2, ry: 4.2 },
          { y: 6, rx: 2.8, ry: 3.0 },
        ]
      : [
          { y: 29, rx: 12.5, ry: 6.2 },
          { y: 21, rx: 10.5, ry: 5.5 },
          { y: 13, rx: 7.2, ry: 5.0 },
          { y: 7, rx: 4.0, ry: 3.6 },
        ];
    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];
      drawFoliageCluster(b, 18 + (i % 2 === 0 ? -0.5 : 0.5), t.y, t.rx, t.ry, folRamp, seed + i * 31);
    }
    // Protruding faceted quartz crystals growing from the trunk & boughs!
    drawCrystalSpire(b, 12, 34, 8, 26, 2.2, crysRamp, hexToU32("#ffffff"));
    drawCrystalSpire(b, 24, 30, 29, 22, 2.0, crysRamp, hexToU32("#ffffff"));
    if (variant === 1) {
      drawCrystalSpire(b, 18, 10, 18, 2, 2.2, crysRamp, hexToU32("#ffffff"));
    }
  } else if (biome === "amber") {
    // Gnarled Volcanic Ember Tree (twisted forked branches + glowing amber flame-canopy)
    b.litCapsule(18, 40, 17, 25, 3.8, 2.5, trunkRamp);
    b.litCapsule(17, 27, 10, 19, 2.2, 1.3, trunkRamp);
    b.litCapsule(18, 26, 25, 18, 2.1, 1.3, trunkRamp);
    b.litCapsule(18, 39, 12, 41, 2.0, 1.0, trunkRamp);
    b.litCapsule(18, 39, 24, 41, 2.0, 1.0, trunkRamp);

    const clumps = variant === 0
      ? [
          [11, 18, 8.2, 6.2],
          [24, 17, 7.8, 6.0],
          [18, 12, 9.2, 6.8],
          [15, 9, 5.5, 4.5],
        ]
      : [
          [12, 20, 7.5, 5.8],
          [24, 19, 7.5, 5.8],
          [18, 14, 9.5, 7.0],
        ];
    for (let i = 0; i < clumps.length; i++) {
      const [cx, cy, rx, ry] = clumps[i];
      drawFoliageCluster(b, cx, cy, rx, ry, folRamp, seed + i * 29, restored ? hexToU32("#fff08a") : undefined);
    }
    if (variant === 1) {
      drawCrystalSpire(b, 18, 10, 21, 3, 2.0, crysRamp, hexToU32("#ffffff"));
    }
  } else if (biome === "ruins") {
    // Ethereal Arcane Crystal-Weeping Tree
    b.litCapsule(18, 40, 18, 22, 3.4, 2.0, trunkRamp);
    b.litCapsule(18, 26, 11, 17, 2.0, 1.2, trunkRamp);
    b.litCapsule(18, 25, 25, 17, 2.0, 1.2, trunkRamp);
    // Glowing arcane core vein up trunk
    b.line(17, 36, 17, 25, crysRamp[2]);
    // Sweeping canopy + hanging luminous willow tendrils
    drawFoliageCluster(b, 18, 14, 12.5, 7.5, folRamp, seed, restored ? flower : undefined);
    drawFoliageCluster(b, 11, 18, 7.0, 5.8, folRamp, seed + 17);
    drawFoliageCluster(b, 25, 18, 7.0, 5.8, folRamp, seed + 41);
    drawFoliageCluster(b, 18, 9, 7.5, 5.0, folRamp, seed + 67);
    // Hanging willow strands
    for (const sx of [8, 12, 23, 27]) {
      const len = 5 + ((sx + variant * 3) % 4);
      for (let dy = 0; dy < len; dy++) {
        b.pset(sx, 22 + dy, dy > len - 3 ? folLight : folMid);
      }
    }
  } else {
    // Town & Meadow: Classic lush Codixel Broadleaf Oak (gnarled roots, branching trunk, overlapping boughs!)
    const lean = variant === 0 ? -0.8 : 0.8;
    b.litCapsule(18, 40, 18 + lean, 23, 4.0, 2.6, trunkRamp);
    b.litCapsule(18, 39, 12, 41, 2.1, 1.1, trunkRamp);
    b.litCapsule(18, 39, 24, 41, 2.1, 1.1, trunkRamp);
    b.litCapsule(18 + lean, 26, 12, 19, 2.2, 1.4, trunkRamp);
    b.litCapsule(18 + lean, 26, 24, 20, 2.2, 1.4, trunkRamp);
    // Deep shadow underside boughs first, then bright sunlit crown lobes on top!
    const boughs = variant === 0
      ? [
          [11, 20, 8.2, 6.4],
          [25, 20, 8.0, 6.2],
          [18, 19, 10.2, 7.2],
          [14, 13, 8.4, 6.4],
          [22, 14, 7.8, 6.0],
          [17, 9, 7.4, 5.2],
        ]
      : [
          [12, 22, 7.6, 6.0],
          [24, 21, 7.8, 6.0],
          [18, 17, 10.6, 7.5],
          [15, 11, 7.6, 5.8],
          [21, 10, 7.0, 5.4],
          [18, 6, 5.8, 4.4],
        ];
    for (let i = 0; i < boughs.length; i++) {
      const [cx, cy, rx, ry] = boughs[i];
      drawFoliageCluster(b, cx, cy, rx, ry, folRamp, seed + i * 37, restored && i >= 2 ? flower : undefined);
    }
    // Small grounded grass tufts around trunk roots so trees feel planted in the earth
    b.pset(11, 41, folDark);
    b.pset(12, 40, folMid);
    b.pset(13, 41, folLight);
    b.pset(22, 41, folDark);
    b.pset(23, 40, folMid);
    b.pset(24, 41, folDark);
  }

  b.smoothEdge();
  b.applyRimLight(folPeak, 0.25, 0.2);
  b.applySelout(outLit, outDark, 0.34);
  return b.toCanvas();
}

function buildBiomeRock(biome: BiomeId, pal: BiomePalette, variant: number, restored: boolean): HTMLCanvasElement {
  const b = new PixelBuf(24, 22);
  const rockRamp = new Uint32Array([
    mixU32(hexToU32(pal.wallDark), hexToU32(pal.outline), 0.3),
    hexToU32(pal.wallDark),
    hexToU32(pal.wallMid),
    hexToU32(pal.wallLight),
    mixU32(hexToU32(pal.wallLight), hexToU32("#ffffff"), 0.28),
  ]);
  const moss = hexToU32(pal.foliageMid);
  const mossHi = hexToU32(pal.foliageLight);
  const crysRamp = new Uint32Array([
    hexToU32(pal.crystalDark),
    mixU32(hexToU32(pal.crystalDark), hexToU32(pal.crystalLight), 0.5),
    hexToU32(pal.crystalLight),
    hexToU32("#ffffff"),
  ]);
  const seed = 307 + variant * 97 + biome.charCodeAt(0) * 13;

  // Sculpted boulder using Codixel height-field surface lighting + crevices!
  const cx = 12;
  const cy = 14;
  const rx = variant === 0 ? 9.2 : 8.4;
  const ry = variant === 0 ? 6.4 : 7.0;

  for (let y = 5; y <= 20; y++) {
    for (let x = 2; x <= 21; x++) {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      // Flat grounded bottom & organic craggy crown
      const crag = (fbm(x * 0.25, y * 0.25, 2, seed) - 0.5) * 0.32;
      const d = Math.hypot(nx, ny > 0 ? ny * 1.18 : ny) + crag;
      if (d > 1.0) continue;

      const h0 = rockHeight(x, y, seed, 0.24);
      const hx = rockHeight(x + 1, y, seed, 0.24);
      const hy = rockHeight(x, y + 1, seed, 0.24);
      const slopeLight = clamp(0.5 + (h0 - hx) * 1.8 + (h0 - hy) * 1.8 - nx * 0.28 - ny * 0.36);
      const val = clamp(slopeLight * 0.72 + h0 * 0.35 - Math.max(0, d - 0.7) * 0.45);
      b.pset(x, y, rockRamp[band(val, rockRamp.length, x, y, 0.18)]);

      // Upward-facing biome moss on Meadow / Quartz / Town boulders
      if ((biome === "meadow" || biome === "quartz" || biome === "town") && ny < -0.25 && h0 > 0.52 && d < 0.88) {
        b.pset(x, y, nx < 0 ? mossHi : moss);
      }
    }
  }

  // Faceted crystal cluster emerging from rock (iconic PixTel chroma-stone!)
  if (variant === 0) {
    drawCrystalSpire(b, 15, 11, 18, 2, 2.5, crysRamp, hexToU32("#ffffff"));
    drawCrystalSpire(b, 12, 12, 10, 5, 1.9, crysRamp, hexToU32("#ffffff"));
  } else {
    drawCrystalSpire(b, 9, 10, 6, 3, 2.1, crysRamp, hexToU32("#ffffff"));
    if (restored) {
      drawCrystalSpire(b, 16, 12, 19, 6, 1.8, crysRamp, hexToU32("#ffffff"));
    }
  }

  b.smoothEdge();
  b.applyRimLight(rockRamp[4], 0.25, 0.25);
  b.applySelout(mixU32(rockRamp[1], hexToU32(pal.outline), 0.45), hexToU32(pal.outline), 0.32);
  return b.toCanvas();
}

function buildBiomePillar(biome: BiomeId, pal: BiomePalette, variant: number, restored: boolean): HTMLCanvasElement {
  const b = new PixelBuf(20, 34);
  const stone = new Uint32Array([
    mixU32(hexToU32(pal.wallDark), hexToU32(pal.outline), 0.3),
    hexToU32(pal.wallDark),
    hexToU32(pal.wallMid),
    hexToU32(pal.wallLight),
    mixU32(hexToU32(pal.wallLight), hexToU32("#ffffff"), 0.28),
  ]);
  const crys = new Uint32Array([
    hexToU32(pal.crystalDark),
    mixU32(hexToU32(pal.crystalDark), hexToU32(pal.crystalLight), 0.5),
    hexToU32(pal.crystalLight),
    hexToU32("#ffffff"),
  ]);
  const moss = hexToU32(pal.foliageMid);

  // Stepped carved plinth at bottom
  b.rect(3, 27, 14, 5, stone[1]);
  b.rect(3, 27, 14, 2, stone[3]);
  b.rect(3, 27, 7, 1, stone[4]);
  b.rect(5, 24, 10, 3, stone[2]);
  b.rect(5, 24, 5, 2, stone[3]);

  const topY = variant === 0 ? 8 : 14;
  // Fluted stone column shaft with directional lighting & cracks
  for (let y = topY; y < 25; y++) {
    for (let x = 6; x <= 13; x++) {
      // Jagged fracture on variant 1 (broken ruin column!)
      if (variant === 1 && y < topY + 3 && x > 8 + (y - topY) * 2) continue;
      const flute = x === 8 || x === 11 ? -1 : 0;
      const baseIdx = x < 9 ? 3 : x < 12 ? 2 : 1;
      b.pset(x, y, stone[clamp(baseIdx + flute, 0, 4)]);
    }
  }
  // Hairline crack
  b.line(9, 17, 12, 20, stone[0]);

  if (variant === 0) {
    // Ornate carved capital & floating chroma crystal finial
    b.rect(4, 7, 12, 3, stone[2]);
    b.rect(4, 7, 12, 1, stone[4]);
    b.rect(5, 9, 10, 1, stone[1]);
    // Glowing rune band etched down the column face
    for (let y = 12; y <= 21; y += 2) {
      b.pset(9, y, restored ? crys[2] : stone[1]);
      b.pset(10, y, restored ? crys[3] : stone[0]);
    }
    drawCrystalSpire(b, 10, 6, 10, 1, 2.6, crys, hexToU32("#ffffff"));
  } else {
    // Broken ruin column with climbing moss & fallen rubble stone
    if (biome === "meadow" || biome === "quartz") {
      b.rect(6, 18, 3, 4, moss);
      b.pset(7, 17, hexToU32(pal.foliageLight));
    }
    b.litEllipse(15.5, 29.5, 2.5, 2.0, stone);
  }

  b.smoothEdge();
  b.applyRimLight(stone[4], 0.24, 0.25);
  b.applySelout(mixU32(stone[1], hexToU32(pal.outline), 0.45), hexToU32(pal.outline), 0.32);
  return b.toCanvas();
}

// =========================================================================
// 5. FULL TILESET BUILDER (per Biome, Bleached & Restored)
// =========================================================================

export function buildRichTileSet(biome: BiomeId, pal: BiomePalette, restored: boolean): RichTileSet {
  const grounds = [0, 1, 2, 3].map((v) => buildGroundTile(biome, pal, v, restored));
  const groundDual = buildGroundDualAtlas(biome, pal);
  const roadDual = buildRoadDualAtlas(pal);
  const waterDual = buildWaterDualFrames(pal, restored);
  const lavaDual = buildLavaDualFrames(pal, restored);
  const { wallTop, wallVert, wallFront } = buildWallTiles(pal);
  const { bridgeH, bridgeV } = buildBridgeTiles(pal);
  const trees = [0, 1].map((v) => buildBiomeTree(biome, pal, v, restored));
  const rocks = [0, 1].map((v) => buildBiomeRock(biome, pal, v, restored));
  const pillars = [0, 1].map((v) => buildBiomePillar(biome, pal, v, restored));

  return {
    grounds,
    groundDual,
    roadDual,
    waterDual,
    lavaDual,
    wallTop,
    wallVert,
    wallFront,
    bridgeH,
    bridgeV,
    trees,
    rocks,
    pillars,
    // Legacy compatibility aliases
    ground0: grounds[0],
    ground1: grounds[1],
    ground2: grounds[2],
    road: grounds[0],
    wall: wallFront,
    water0: waterDual[0],
    water1: waterDual[1],
    lava0: lavaDual[0],
    lava1: lavaDual[1],
    bridge: bridgeH,
    tree: trees[0],
    rock: rocks[0],
    pillar: pillars[0],
  };
}

// =========================================================================
// 6. ORIGIN TOWN BUILDINGS (64x58 High-Craft) & CLASS ALTAR (36x40)
// =========================================================================

function buildTownHouse(opts: {
  roofHue: number;
  roofSat: number;
  wallHex: string;
  trimHex: string;
  glowHex: string;
  kind: "elder" | "forge" | "shop";
}): HTMLCanvasElement {
  const b = new PixelBuf(64, 58);
  const roof = hueRamp(5, { hue: opts.roofHue, sat: opts.roofSat, satDrop: 0.14, lightMin: 0.18, lightMax: 0.72, shift: 26 });
  const wall = hueRampFromHex(opts.wallHex, 4, { span: 0.16, shift: 16 });
  const timber = hueRampFromHex(opts.trimHex, 4, { span: 0.16, shift: 16 });
  const stone = hueRamp(4, { hue: 222, sat: 0.18, satDrop: 0.08, lightMin: 0.24, lightMax: 0.76, shift: 16 });
  const glow = hexToU32(opts.glowHex);
  const glowHot = mixU32(glow, hexToU32("#ffffff"), 0.55);
  const out = hexToU32("#120f1c");
  const gold = hexToU32("#ffe066");

  // 1. Stone foundation & timber-framed front wall (x=9..54, y=28..54)
  for (let y = 28; y <= 53; y++) {
    for (let x = 9; x <= 54; x++) {
      // Lower stone plinth foundation
      if (y >= 49) {
        const brick = ((x + ((y & 2) ? 3 : 0)) % 6 === 0) || y === 49;
        b.pset(x, y, brick ? stone[0] : x < 30 ? stone[2] : stone[1]);
      } else {
        // Warm plaster or stonework wall shaded gently left-to-right + eaves cast shadow at top!
        const eavesShadow = y < 32 ? -1 : 0;
        const baseIdx = x < 28 ? 3 : x < 44 ? 2 : 1;
        b.pset(x, y, wall[clamp(baseIdx + eavesShadow, 0, 3)]);
      }
    }
  }
  // Half-timber vertical & cross beams
  for (const bx of [9, 10, 23, 40, 53, 54]) {
    b.rect(bx, 28, 1, 22, bx % 2 === 0 ? timber[1] : timber[2]);
  }
  b.rect(9, 28, 46, 2, timber[0]);
  b.rect(9, 48, 46, 2, timber[1]);
  b.rect(9, 48, 46, 1, timber[3]);

  // 2. Arched Oak Entrance Door (center x=26..37, y=36..53)
  b.rect(25, 35, 14, 19, stone[1]);
  b.rect(26, 36, 12, 18, timber[0]);
  for (let y = 37; y <= 53; y++) {
    for (let x = 27; x <= 36; x++) {
      // Rounded arch corners
      if (y === 37 && (x === 27 || x === 36)) continue;
      const plank = (x - 27) % 3 === 0 ? timber[0] : x < 32 ? timber[2] : timber[1];
      b.pset(x, y, plank);
    }
  }
  b.rect(27, 42, 10, 1, stone[2]); // Iron strap hinge
  b.rect(27, 49, 10, 1, stone[1]);
  b.rect(34, 45, 2, 2, gold); // Brass doorknob

  // 3. Glowing Leaded-Glass Windows (left & right)
  for (const wx of [13, 43]) {
    b.rect(wx - 1, 35, 10, 10, timber[0]);
    b.rect(wx, 36, 8, 8, glow);
    b.rect(wx, 36, 5, 4, glowHot);
    b.pset(wx + 1, 37, hexToU32("#ffffff"));
    // Window cross-mullions & sill
    b.rect(wx + 3, 36, 2, 8, timber[1]);
    b.rect(wx, 39, 8, 2, timber[1]);
    b.rect(wx - 2, 44, 12, 2, timber[3]);
  }

  // 4. Shingled Pitched Gable Roof (y=6..30, x=3..60)
  for (let y = 6; y <= 29; y++) {
    const u = (y - 6) / 23;
    const halfW = Math.round(14 + u * 16);
    const x0 = 32 - halfW;
    const x1 = 31 + halfW;
    const shingleRow = Math.floor((y - 6) / 3);
    for (let x = x0; x <= x1; x++) {
      const sideLight = x < 32 ? 1 : 0;
      const shingleEdge = (y - 6) % 3 === 2;
      const tileSplit = (x + (shingleRow & 1) * 3) % 6 === 0;
      let idx = 2 + sideLight - (u > 0.72 ? 1 : 0);
      if (shingleEdge) idx -= 1;
      else if (tileSplit) idx -= 1;
      if (y <= 8) idx = Math.min(4, idx + 1);
      b.pset(x, y, roof[clamp(idx, 0, 4)]);
    }
  }
  // Ornate roof ridge beam & eaves trim
  b.rect(17, 5, 30, 3, timber[2]);
  b.rect(17, 5, 30, 1, timber[3]);
  b.rect(3, 28, 58, 2, timber[1]);
  b.rect(3, 28, 58, 1, timber[3]);

  // 5. Building-Specific Iconic Architectural Details!
  if (opts.kind === "forge") {
    // Stone Forge Chimney on left slope + glowing hearth glow!
    b.rect(10, 2, 9, 18, stone[1]);
    b.rect(10, 2, 4, 17, stone[2]);
    b.rect(9, 2, 11, 3, stone[3]);
    b.rect(11, 3, 7, 1, out); // Chimney flue opening
    b.rect(12, 4, 5, 1, glow); // Subtle ember glow inside flue
    // Mini Anvil beside doorway
    b.rect(44, 51, 9, 2, stone[0]);
    b.rect(46, 49, 5, 2, stone[1]);
    b.rect(43, 47, 11, 2, stone[3]);
    b.rect(43, 47, 6, 1, hexToU32("#dce8f5"));
    b.rect(47, 46, 3, 1, glowHot); // Hot glowing ingot on anvil!
    // Hanging orange forge banner above door
    b.rect(28, 29, 8, 5, roof[3]);
    b.rect(30, 30, 4, 3, glowHot);
  } else if (opts.kind === "shop") {
    // Striped market awning over shopfront windows!
    for (let x = 11; x <= 52; x++) {
      if (x >= 24 && x <= 39) continue; // Keep door clear
      const stripe = ((x >> 2) & 1) === 0 ? hexToU32("#d93848") : hexToU32("#fff1d6");
      b.rect(x, 31, 1, 5, stripe);
      b.pset(x, 36, mixU32(stripe, out, 0.35));
    }
    // Wooden supply barrel & emerald potion sign
    b.rect(13, 48, 7, 6, timber[1]);
    b.rect(14, 48, 3, 6, timber[3]);
    b.rect(13, 50, 7, 1, stone[2]);
    b.rect(13, 52, 7, 1, stone[1]);
    // Hanging emerald potion emblem above door
    b.rect(29, 29, 6, 5, timber[0]);
    b.rect(30, 30, 4, 3, glow);
    b.pset(31, 30, hexToU32("#ffffff"));
  } else {
    // Elder House: Golden crest spire, dormer skylight & royal twin banners!
    b.rect(29, 1, 6, 5, gold);
    b.rect(31, 0, 2, 3, hexToU32("#fff8cc"));
    // Dormer window in roof center
    b.rect(27, 14, 10, 9, timber[1]);
    b.rect(28, 15, 8, 7, glow);
    b.rect(28, 15, 4, 3, glowHot);
    b.rect(31, 15, 2, 7, timber[0]);
    // Royal blue-and-gold banners flanking door
    for (const bx of [22, 39]) {
      b.rect(bx, 34, 3, 12, roof[2]);
      b.rect(bx + 1, 35, 1, 9, gold);
    }
  }

  b.smoothEdge();
  b.applyRimLight(hexToU32("#fff5dc"), 0.18, 0.28);
  b.applySelout(mixU32(stone[0], out, 0.45), out, 0.25);
  return b.toCanvas();
}

function buildClassAltarSprites(): { base: HTMLCanvasElement; crystal: HTMLCanvasElement } {
  // Tiered octagonal carved stone dais with etched glowing rainbow chroma ring
  const base = new PixelBuf(36, 32);
  const stone = hueRamp(5, { hue: 226, sat: 0.24, satDrop: 0.1, lightMin: 0.2, lightMax: 0.82, shift: 18 });
  const cyan = hexToU32("#4be8ff");
  const mag = hexToU32("#ff66d8");
  const gold = hexToU32("#ffe066");
  const out = hexToU32("#100e1c");

  // Outer stepped stone ring
  base.litEllipse(18, 21, 15.5, 8.5, stone);
  // Recessed dark rune groove
  base.fillEllipse(18, 19.5, 12.2, 6.2, stone[0]);
  // Inner carved platform
  base.litEllipse(18, 19, 10.6, 5.2, stone);
  // Glowing chroma rune circle inlaid around dais
  for (let a = 0; a < 24; a++) {
    const ang = (a / 24) * Math.PI * 2;
    const rx = Math.round(18 + Math.cos(ang) * 11.4);
    const ry = Math.round(19.5 + Math.sin(ang) * 5.7);
    base.pset(rx, ry, a % 3 === 0 ? cyan : a % 3 === 1 ? mag : gold);
  }
  // Central brass cradle pedestal
  base.litEllipse(18, 18.5, 4.5, 2.5, hueRamp(4, { hue: 44, sat: 0.85, lightMin: 0.3, lightMax: 0.84 }));
  base.smoothEdge();
  base.applySelout(stone[1], out, 0.3);

  // Separate floating multi-faceted Prismatic Gem (bobs smoothly above altar in game.ts!)
  const crys = new PixelBuf(18, 22);
  const cyanR = hueRamp(4, { hue: 188, sat: 0.94, lightMin: 0.32, lightMax: 0.92 });
  const magR = hueRamp(4, { hue: 320, sat: 0.9, lightMin: 0.32, lightMax: 0.88 });
  // Faceted diamond crystal: left facets cyan, right facets magenta, top-left white specular!
  for (let y = 2; y <= 19; y++) {
    const dy = Math.abs(y - 10.5) / 8.5;
    const hw = Math.max(0.5, (1 - dy) * 6.5);
    for (let x = Math.round(9 - hw); x <= Math.round(9 + hw); x++) {
      const isLeft = x < 9;
      const isUpper = y < 10;
      const ramp = isLeft ? cyanR : magR;
      const idx = isUpper ? (isLeft ? 3 : 2) : isLeft ? 2 : 1;
      crys.pset(x, y, ramp[idx]);
    }
  }
  // Crisp diamond specular core
  crys.line(7, 5, 7, 12, hexToU32("#ffffff"));
  crys.pset(8, 6, hexToU32("#ffffff"));
  crys.pset(9, 10, gold);
  crys.smoothEdge();
  crys.applySelout(hexToU32("#2a4066"), out, 0.35);

  return { base: base.toCanvas(), crystal: crys.toCanvas() };
}

export function buildRichBuildings() {
  const altar = buildClassAltarSprites();
  return {
    elderHouse: buildTownHouse({
      roofHue: 224,
      roofSat: 0.68,
      wallHex: "#b0a28f",
      trimHex: "#5c4330",
      glowHex: "#ffe066",
      kind: "elder",
    }),
    forgeHouse: buildTownHouse({
      roofHue: 10,
      roofSat: 0.72,
      wallHex: "#767185",
      trimHex: "#3e374a",
      glowHex: "#ff9933",
      kind: "forge",
    }),
    shopHouse: buildTownHouse({
      roofHue: 148,
      roofSat: 0.66,
      wallHex: "#b8a991",
      trimHex: "#61442c",
      glowHex: "#44ee88",
      kind: "shop",
    }),
    classAltar: altar.base,
    classAltarCrystal: altar.crystal,
  };
}

// =========================================================================
// 7. HIGH-CRAFT INTERACTABLES (Waypoints, Chests & Faceted Ore/Crystal Nodes)
// =========================================================================

function buildWaypointSprite(active: boolean): HTMLCanvasElement {
  const b = new PixelBuf(28, 44);
  const stone = active
    ? hueRamp(5, { hue: 224, sat: 0.34, lightMin: 0.2, lightMax: 0.8, shift: 20 })
    : hueRamp(5, { hue: 220, sat: 0.08, lightMin: 0.2, lightMax: 0.68, shift: 10 });
  const cyanR = hueRamp(4, { hue: 188, sat: 0.94, lightMin: 0.32, lightMax: 0.92 });
  const magR = hueRamp(4, { hue: 320, sat: 0.9, lightMin: 0.32, lightMax: 0.88 });
  const gold = hexToU32("#ffe066");
  const white = hexToU32("#ffffff");
  const out = hexToU32("#0e0c18");

  // Ornate stepped stone pedestal
  b.litEllipse(14, 37, 11, 4.5, stone);
  b.rect(5, 31, 18, 6, stone[1]);
  b.rect(5, 31, 9, 5, stone[3]);
  b.rect(7, 29, 14, 3, stone[2]);
  b.rect(7, 29, 7, 2, stone[4]);
  // Pedestal etched runes
  for (let x = 8; x <= 19; x += 3) {
    b.rect(x, 33, 2, 2, active ? (x % 2 === 0 ? cyanR[3] : gold) : stone[0]);
  }

  // Sculpted Tapered Obelisk Spire
  for (let y = 5; y <= 29; y++) {
    const u = (y - 5) / 24;
    const hw = y < 10 ? 0.8 + (y - 5) * 0.72 : 4.4 - (u - 0.2) * 0.8;
    for (let x = Math.round(14 - hw); x <= Math.round(14 + hw); x++) {
      if (active) {
        const isLeft = x < 14;
        const ramp = isLeft ? cyanR : magR;
        const bandIdx = y < 12 ? 3 : y < 20 ? 2 : 1;
        b.pset(x, y, ramp[bandIdx]);
      } else {
        const idx = x < 13 ? 3 : x < 16 ? 2 : 1;
        b.pset(x, y, stone[idx]);
      }
    }
  }
  // Vertical specular ridge & pulsing chroma band
  if (active) {
    b.line(12, 7, 12, 27, white);
    b.line(13, 6, 13, 26, cyanR[3]);
    b.rect(11, 15, 6, 2, gold);
    b.rect(12, 15, 2, 2, white);
    // Floating prism shards flanking active obelisk!
    b.rect(5, 14, 2, 4, cyanR[3]);
    b.pset(5, 14, white);
    b.rect(21, 16, 2, 4, magR[3]);
    b.pset(21, 16, white);
  } else {
    // Cracked dormant seams
    b.line(11, 14, 15, 17, stone[0]);
    b.line(15, 21, 12, 24, stone[0]);
  }

  b.smoothEdge();
  b.applyRimLight(active ? white : stone[4], 0.22, 0.22);
  b.applySelout(active ? hexToU32("#2c4270") : stone[0], out, 0.34);
  return b.toCanvas();
}

function buildChestSprite(state: "locked" | "unlocked" | "opened"): HTMLCanvasElement {
  const b = new PixelBuf(20, 18);
  const wood = hueRamp(4, { hue: 26, sat: 0.68, lightMin: 0.2, lightMax: 0.64, shift: 20 });
  const trim =
    state === "locked"
      ? hueRamp(4, { hue: 348, sat: 0.9, lightMin: 0.28, lightMax: 0.78, shift: 18 })
      : hueRamp(4, { hue: 44, sat: 0.92, lightMin: 0.32, lightMax: 0.86, shift: 20 });
  const out = hexToU32("#120d16");
  const white = hexToU32("#ffffff");

  if (state === "opened") {
    // Open curved lid raised behind chest
    b.rect(3, 2, 14, 5, wood[1]);
    b.rect(4, 2, 12, 2, wood[3]);
    b.rect(3, 6, 14, 2, wood[0]);
    // Open chest interior overflowing with gleaming gold coins & gems!
    b.rect(3, 8, 14, 8, wood[1]);
    b.rect(3, 8, 6, 7, wood[2]);
    b.rect(4, 7, 12, 3, hexToU32("#24120c"));
    // Glittering coins & cyan/magenta jewels inside
    for (let x = 5; x <= 14; x++) {
      b.pset(x, 8, x % 3 === 0 ? white : trim[3]);
      b.pset(x, 9, trim[2]);
    }
    b.pset(8, 7, hexToU32("#4be8ff"));
    b.pset(12, 7, hexToU32("#ff66d8"));
    // Side iron/gold bands
    b.rect(4, 9, 2, 7, trim[2]);
    b.rect(14, 9, 2, 7, trim[1]);
  } else {
    // Domed wooden treasure chest body
    b.rect(3, 4, 14, 5, wood[2]);
    b.rect(4, 3, 12, 2, wood[3]);
    b.rect(3, 9, 14, 7, wood[1]);
    b.rect(3, 9, 7, 6, wood[2]);
    // Plank shading lines
    b.rect(3, 6, 14, 1, wood[1]);
    b.rect(3, 12, 14, 1, wood[0]);
    // Riveted vertical metallic straps
    b.rect(4, 3, 2, 13, trim[2]);
    b.rect(4, 3, 1, 7, trim[3]);
    b.rect(14, 3, 2, 13, trim[1]);
    b.rect(14, 3, 1, 7, trim[2]);
    // Horizontal center lip & ornate clasp lock
    b.rect(3, 8, 14, 2, trim[2]);
    b.rect(3, 8, 9, 1, trim[3]);
    b.rect(8, 7, 4, 5, trim[2]);
    b.rect(9, 8, 2, 3, state === "locked" ? hexToU32("#ff2e55") : white);
    if (state === "locked") {
      // Glowing magical lock chains across front
      b.line(3, 10, 8, 12, trim[3]);
      b.line(16, 10, 11, 12, trim[3]);
    } else {
      b.pset(5, 4, white); // Gleam on unlocked chest lid
    }
  }

  b.smoothEdge();
  b.applySelout(wood[0], out, 0.34);
  return b.toCanvas();
}

function buildResourceNodeSprite(kind: "iron" | "quartz" | "amber" | "void"): HTMLCanvasElement {
  const b = new PixelBuf(24, 24);
  const stone =
    kind === "void"
      ? hueRamp(4, { hue: 265, sat: 0.24, lightMin: 0.14, lightMax: 0.46 })
      : kind === "amber"
        ? hueRamp(4, { hue: 20, sat: 0.22, lightMin: 0.16, lightMax: 0.48 })
        : hueRamp(4, { hue: 218, sat: 0.16, lightMin: 0.2, lightMax: 0.56 });

  const oreRamp =
    kind === "iron"
      ? hueRamp(5, { hue: 212, sat: 0.36, lightMin: 0.28, lightMax: 0.92, shift: 22 })
      : kind === "quartz"
        ? hueRamp(5, { hue: 188, sat: 0.9, lightMin: 0.28, lightMax: 0.94, shift: 18 })
        : kind === "amber"
          ? hueRamp(5, { hue: 34, sat: 0.94, lightMin: 0.3, lightMax: 0.9, shift: 24 })
          : hueRamp(5, { hue: 294, sat: 0.9, lightMin: 0.24, lightMax: 0.9, shift: 28 });

  const white = hexToU32("#ffffff");
  const out = hexToU32("#100d18");
  const seed = kind.charCodeAt(0) * 31 + 17;

  // Rugged rock mound base using height-field lighting
  for (let y = 11; y <= 21; y++) {
    for (let x = 3; x <= 20; x++) {
      const nx = (x + 0.5 - 12) / 8.2;
      const ny = (y + 0.5 - 16.5) / 4.8;
      const d = Math.hypot(nx, ny) + (fbm(x * 0.28, y * 0.28, 2, seed) - 0.5) * 0.25;
      if (d > 1.0) continue;
      const h = rockHeight(x, y, seed, 0.26);
      const val = clamp(0.45 - nx * 0.26 - ny * 0.32 + (h - 0.5) * 0.5);
      b.pset(x, y, stone[band(val, stone.length, x, y, 0.16)]);
    }
  }

  // Multi-spire faceted crystal / metallic ore cluster erupting from the rock!
  if (kind === "iron") {
    // Chunky faceted metallic steel ore outcrops
    b.litEllipse(9, 13, 4.2, 3.8, oreRamp);
    b.litEllipse(15, 12, 4.0, 4.5, oreRamp);
    b.litEllipse(12, 9.5, 3.6, 3.4, oreRamp);
    b.pset(10, 8, white);
    b.pset(14, 9, white);
    b.pset(8, 12, white);
  } else {
    // Sharp faceted hexagonal crystal spires (Codixel Gem-style alternating light/dark planes)
    drawCrystalSpire(b, 8, 17, 4, 7, 2.4, oreRamp, white);
    drawCrystalSpire(b, 16, 17, 20, 8, 2.4, oreRamp, white);
    drawCrystalSpire(b, 12, 16, 12, 2, 3.4, oreRamp, white);
    drawCrystalSpire(b, 15, 18, 17, 12, 2.0, oreRamp, white);
  }

  b.smoothEdge();
  b.applyRimLight(oreRamp[oreRamp.length - 1], 0.22, 0.24);
  b.applySelout(mixU32(oreRamp[0], out, 0.45), out, 0.32);
  return b.toCanvas();
}

export function buildRichInteractables() {
  return {
    waypointOff: buildWaypointSprite(false),
    waypointOn: buildWaypointSprite(true),
    chestLocked: buildChestSprite("locked"),
    chestUnlocked: buildChestSprite("unlocked"),
    chestOpened: buildChestSprite("opened"),
    iron_vein: buildResourceNodeSprite("iron"),
    quartz_cluster: buildResourceNodeSprite("quartz"),
    amber_crystal: buildResourceNodeSprite("amber"),
    void_crystal: buildResourceNodeSprite("void"),
  };
}
