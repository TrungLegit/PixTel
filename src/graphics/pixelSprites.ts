import { hex } from "../vfx/pixelfx/core/color.js";
import type { PixelfxActor } from "../vfx/pixelfxTypes";
import { BIOME_CONFIGS } from "../data/worldConfig";
import type { BiomeId, ClassId, HeroVisualLoadout } from "../data/types";
import { buildAllHeroSprites, buildAllNpcSprites, buildDynamicHeroFrames } from "./heroSprites";
import {
  buildRichBuildings,
  buildRichInteractables,
  buildRichTileSet,
  type RichTileSet,
} from "./worldSprites";

export interface CompiledSprite {
  w: number;
  h: number;
  right: HTMLCanvasElement;
  left: HTMLCanvasElement;
  whiteRight: HTMLCanvasElement;
  whiteLeft: HTMLCanvasElement;
  actor: PixelfxActor;
}

export type TileSet = RichTileSet;

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

function compileMatrix(rows: string[], pal: Record<string, string>): CompiledSprite {
  const h = rows.length;
  const w = rows[0].length;
  const { c: right, ctx: rCtx } = makeCanvas(w, h);
  const { c: left, ctx: lCtx } = makeCanvas(w, h);
  const { c: whiteRight, ctx: wrCtx } = makeCanvas(w, h);
  const { c: whiteLeft, ctx: wlCtx } = makeCanvas(w, h);
  const maskData = new Uint8Array(w * h);
  const pixels = new Uint32Array(w * h);

  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === "." || ch === " ") continue;
      const col = pal[ch];
      if (!col) continue;
      const u32 = hex(col);
      rCtx.fillStyle = col;
      rCtx.fillRect(x, y, 1, 1);
      lCtx.fillStyle = col;
      lCtx.fillRect(w - 1 - x, y, 1, 1);
      wrCtx.fillStyle = "#ffffff";
      wrCtx.fillRect(x, y, 1, 1);
      wlCtx.fillStyle = "#ffffff";
      wlCtx.fillRect(w - 1 - x, y, 1, 1);
      maskData[y * w + x] = 1;
      pixels[y * w + x] = u32;
    }
  }

  return {
    w,
    h,
    right,
    left,
    whiteRight,
    whiteLeft,
    actor: {
      mask: { w, h, data: maskData },
      pixels,
      x: -Math.floor(w / 2),
      y: -h,
      w,
      h,
      head: [0, -h],
      chest: [0, -Math.floor(h * 0.6)],
    },
  };
}

// =========================================================================
// ENEMY MATRICES (9 Regular Enemies + Turret/Drone)
// =========================================================================

const ENEMY_MATRICES: Record<string, { pal: Record<string, string>; frames: string[][] }> = {
  null_slime: {
    pal: { k: "#111218", d: "#5c606e", m: "#9ba0ad", l: "#e4e8f0", e: "#ff3366", w: "#ffffff" },
    frames: [
      [
        "................", "................", ".....kkkkkk.....", "...kkllllllkk...",
        "..kllmmmmmmllk..", ".klmmddddddmmlk.", ".klmdeemmeedmlk.", ".kdmdewmmewdmdk.",
        ".kddddddddddddk.", ".kddddddddddddk.", "..kkkkkkkkkkkk..", "................",
      ],
      [
        "................", "....kkkkkkkk....", "..kkllllllllkk..", ".kllmmmmmmmmllk.",
        ".klmddddddddmlk.", ".klmdeemmeedmlk.", ".kdmdewmmewdmdk.", ".kddddddddddddk.",
        "..kddddddddddk..", "...kkkkkkkkkk...", "................", "................",
      ],
    ],
  },
  ash_hopper: {
    pal: { k: "#101218", d: "#474d59", m: "#80899c", l: "#cad2e0", e: "#ffee44", w: "#ffffff" },
    frames: [
      [
        "................", "....kk....kk....", "...kllkkkkllk...", "..kmmmmmmmmmmk..",
        ".kmmdeemmdeemmk.", ".kmmdwwmmdwwmmk.", "..kddddddddddk..", ".kddk.kddk.kddk.",
        "kddk...kk...kddk", "kkk..........kkk",
      ],
      [
        "....kk....kk....", "...kllkkkkllk...", "..kmmmmmmmmmmk..", ".kmmdeemmdeemmk.",
        ".kmmdwwmmdwwmmk.", "..kddddddddddk..", "..kddk.kk.kddk..", "...kk......kk...",
        "................", "................",
      ],
    ],
  },
  static_imp: {
    pal: { k: "#120c1a", d: "#433e54", m: "#7f7996", l: "#d8d4e8", r: "#ff2e63", w: "#ffffff" },
    frames: [
      [
        "..kk........kk..", ".kllk.kkkk.kllk.", "..kllkmmmmkllk..", "...kmmmmmmmmk...",
        "..kmmdrrmdrrmk..", "..kmmdwwmdwwmk..", "...kddddddddk...", "..kddmmmmmmddk..",
        ".kdd.kddddk.ddk.", ".kk..kddddk..kk.", "....kdd..ddk....", "....kk....kk....",
      ],
      [
        "................", "..kk........kk..", ".kllk.kkkk.kllk.", "..kllkmmmmkllk..",
        "...kmmmmmmmmk...", "..kmmdrrmdrrmk..", "..kmmdwwmdwwmk..", "...kddddddddk...",
        "..kddmmmmmmddk..", ".kdd.kddddk.ddk.", "....kkd..dkk....", ".....k....k.....",
      ],
    ],
  },
  bleach_hound: {
    pal: { k: "#121218", d: "#4d4f5c", m: "#8f94a6", l: "#eceff7", r: "#ff4477", w: "#ffffff" },
    frames: [
      [
        "................", ".........kk.kk..", "........kllkllk.", "..kk...kmmmmmmk.",
        ".kmmkkkkmmmrrmk.", ".kmmmmmmmmmwwmk.", "..kddddddmmmmk..", "..kdd..kdd..kk..",
        ".kddk..kddk.....", ".kkk....kkk.....",
      ],
      [
        "................", ".........kk.kk..", "........kllkllk.", ".kk....kmmmmmmk.",
        "kmmkkkkkmmmrrmk.", ".kmmmmmmmmmwwmk.", "..kddddddmmmmk..", "...kddk..kddk...",
        "....kkk...kkk...", "................",
      ],
    ],
  },
  quartz_stalker: {
    pal: { k: "#0b141a", d: "#274c5e", m: "#458fa8", l: "#9ef6ff", e: "#ffffff", c: "#33ddff" },
    frames: [
      [
        ".....kkkkkk.....", "....kllllllk....", "...kllccccclk...", "..kmmddddddmmk..",
        "..kmdkeekkeedk..", ".kmmddddddddddk.", ".klmddccccddmlk.", "..kddddddddddk..",
        "...kddd..dddk...", "...kddk..kddk...", "...kkk....kkk...",
      ],
      [
        "................", ".....kkkkkk.....", "....kllllllk....", "...kllccccclk...",
        "..kmmddddddmmk..", "..kmdkeekkeedk..", ".kmmddddddddddk.", ".klmddccccddmlk.",
        "..kddddddddddk..", "...kddk..kddk...", "....kk....kk....",
      ],
    ],
  },
  amber_beetle: {
    pal: { k: "#1a0d12", d: "#5e2b1d", m: "#b35822", l: "#ffbe44", e: "#fff4b8", w: "#ffffff" },
    frames: [
      [
        "....kkkkkkkk....", "..kkllllllllkk..", ".kllmmmmmmmmllk.", ".klmddddddddmlk.",
        "kmmdeemmmmeedmmk", "kmmdewmddmwedmmk", ".kddddddddddddk.", ".kddk.kkkk.kddk.",
        "..kk........kk..",
      ],
      [
        "................", "....kkkkkkkk....", "..kkllllllllkk..", ".kllmmmmmmmmllk.",
        ".klmddddddddmlk.", "kmmdeemmmmeedmmk", "kmmdewmddmwedmmk", "..kddddddddddk..",
        "...kk......kk...",
      ],
    ],
  },
  cinder_imp: {
    pal: { k: "#1a0a0c", d: "#591d1d", m: "#b83b24", l: "#ff9b30", r: "#ffee55", w: "#ffffff" },
    frames: [
      [
        "..kk........kk..", ".kllk.kkkk.kllk.", "..kllkmmmmkllk..", "...kmmmmmmmmk...",
        "..kmmdrrmdrrmk..", "..kmmdwwmdwwmk..", "...kddddddddk...", "..kddmmmmmmddk..",
        ".kdd.kddddk.ddk.", "....kdd..ddk....", "....kk....kk....",
      ],
      [
        "................", "..kk........kk..", ".kllk.kkkk.kllk.", "..kllkmmmmkllk..",
        "...kmmmmmmmmk...", "..kmmdrrmdrrmk..", "..kmmdwwmdwwmk..", "...kddddddddk...",
        "..kddmmmmmmddk..", "....kkd..dkk....", ".....k....k.....",
      ],
    ],
  },
  prism_golem: {
    pal: { k: "#10121a", d: "#3b3e4a", m: "#707485", l: "#c6cad8", c: "#ff4f9a", w: "#ffffff" },
    frames: [
      [
        "....kkkkkkkk....", "...kllllllllk...", "..kllmmmmmmllk..", "..klmkkmmkklmk..",
        ".kkmmkckkckmmkk.", ".klmmddddddmmlk.", ".klmdccwwccdmlk.", ".klmmddddddmmlk.",
        ".kkddmmmmmmddkk.", "..kkddddddddkk..", "...kddd..dddk...", "...kkkk..kkkk...",
      ],
      [
        "................", "....kkkkkkkk....", "...kllllllllk...", "..kllmmmmmmllk..",
        "..klmkkmmkklmk..", ".kkmmkckkckmmkk.", ".klmmddddddmmlk.", ".klmdccwwccdmlk.",
        ".klmmddddddmmlk.", ".kkddmmmmmmddkk.", "...kddk..kddk...", "...kkk....kkk...",
      ],
    ],
  },
  void_wraith: {
    pal: { k: "#0c0818", d: "#3b2266", m: "#7e46c9", l: "#e4c2ff", r: "#ff2e88", w: "#ffffff" },
    frames: [
      [
        "....kkkkkkkk....", "...kllllllllk...", "..kllmmmmmmllk..", "..klmdrrmdrrmk..",
        "..klmdwwmdwwmk..", "..kmmddddddmmk..", ".kddmmmmmmmmddk.", ".kdd.kddddk.ddk.",
        "..k..kdkkdk..k..", ".....k....k.....",
      ],
      [
        "................", "....kkkkkkkk....", "...kllllllllk...", "..kllmmmmmmllk..",
        "..klmdrrmdrrmk..", "..klmdwwmdwwmk..", "..kmmddddddmmk..", ".kddmmmmmmmmddk.",
        "..kk.kddddk.kk..", "......k..k......",
      ],
    ],
  },
};

const TURRET_DEF = {
  pal: { k: "#0a1216", m: "#47596b", M: "#8da6bf", g: "#44ee88", c: "#33ddff", w: "#ffffff" },
  rows: [
    "....kkkkkk....", "...kMMMMMMk...", "..kMmccccmMk..", "..kMmcwwcmMkkk",
    "..kMmggggmMMMk", "...kmmmmmmkkk.", "....kmmmmk....", "...kkmmmmkk...",
    "..kmmk..kmmk..", ".kmmk....kmmk.", ".kkk......kkk.",
  ],
};

const DRONE_DEF = {
  pal: { k: "#0b1716", g: "#3be882", G: "#b6ffd2", c: "#38e8ff", m: "#546b78", w: "#ffffff" },
  rows: [
    ".kk........kk.", "kGGk..kk..kGGk", ".kkkkmMMmkkkk.", "...kmggggmk...",
    "..kmGcwwcGmk..", "...kmmmmmmk...", "....kkcckk....",
  ],
};

function buildBossSprite(kind: "root" | "amber" | "eraser"): CompiledSprite {
  const w = 32, h = 32;
  const grid = Array.from({ length: h }, () => Array(w).fill("."));
  const plot = (x: number, y: number, ch: string) => {
    if (x >= 0 && x < w && y >= 0 && y < h) grid[y][x] = ch;
  };
  const symPlot = (x: number, y: number, ch: string) => {
    plot(x, y, ch);
    plot(w - 1 - x, y, ch);
  };
  const fillEllipse = (cx: number, cy: number, rx: number, ry: number, ch: string) => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) grid[y][x] = ch;
      }
  };
  const outline = (ch = "k") => {
    const copy = grid.map((r) => [...r]);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (copy[y][x] !== ".") continue;
        if (
          (y > 0 && copy[y - 1][x] !== ".") ||
          (y < h - 1 && copy[y + 1][x] !== ".") ||
          (x > 0 && copy[y][x - 1] !== ".") ||
          (x < w - 1 && copy[y][x + 1] !== ".")
        )
          grid[y][x] = ch;
      }
  };

  if (kind === "root") {
    const pal = { k: "#110d14", d: "#29333d", m: "#4a6370", l: "#89bcc7", v: "#5eead4", w: "#ffffff", r: "#ff3366" };
    fillEllipse(16, 15, 9, 10, "m");
    fillEllipse(16, 13, 7, 7, "l");
    fillEllipse(16, 17, 5, 5, "d");
    for (let i = 0; i < 6; i++) {
      symPlot(9 + (i >> 1), 3 + i, "l");
      symPlot(10 + (i >> 1), 3 + i, "m");
      symPlot(5 + i, 9 + (i >> 1), "d");
    }
    for (let y = 22; y < 30; y++) {
      symPlot(10 - ((y - 22) >> 1), y, "d");
      symPlot(11 - ((y - 22) >> 1), y, "m");
      symPlot(14, y, "d");
    }
    for (let y = 12; y < 23; y++) {
      symPlot(4 + (y > 18 ? 1 : 0), y, "d");
      symPlot(5 + (y > 18 ? 1 : 0), y, "m");
      symPlot(6, y, "l");
    }
    symPlot(12, 11, "r");
    symPlot(13, 11, "w");
    fillEllipse(16, 17, 3, 3, "v");
    fillEllipse(16, 17, 1.5, 1.5, "w");
    outline("k");
    return compileMatrix(grid.map((r) => r.join("")), pal);
  }

  if (kind === "amber") {
    const pal = { k: "#140d1c", d: "#3e314a", m: "#746285", l: "#c8bad9", a: "#ffaa22", A: "#ffe875", w: "#ffffff" };
    for (let y = 5; y <= 24; y++) {
      const hw = y < 14 ? 3 + (y - 5) : 12 - (y - 14) * 0.9;
      for (let x = Math.round(16 - hw); x <= Math.round(16 + hw); x++) {
        grid[y][x] = Math.abs(x - 16) < hw * 0.4 ? "l" : "m";
      }
    }
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -2; dx <= 2; dx++)
        if (Math.abs(dx) + Math.abs(dy) <= 3) symPlot(5 + dx, 11 + dy, Math.abs(dx) + Math.abs(dy) <= 1 ? "A" : "a");
    for (let y = 1; y < 6; y++) for (let x = 14; x < 18; x++) plot(x, y, y < 3 ? "A" : "a");
    for (let x = 12; x <= 19; x++) plot(x, 10, "d");
    symPlot(13, 10, "A");
    symPlot(14, 10, "w");
    fillEllipse(16, 17, 3, 3, "a");
    fillEllipse(16, 17, 1.8, 1.8, "w");
    for (let y = 26; y < 30; y++) {
      symPlot(12, y, "a");
      symPlot(13, y, "A");
    }
    outline("k");
    return compileMatrix(grid.map((r) => r.join("")), pal);
  }

  const pal = { k: "#0c0a16", d: "#4c4e61", m: "#9ca1b5", l: "#edf0fa", w: "#ffffff", n: "#ff2e88", c: "#2ef2ff" };
  for (let i = 0; i < 11; i++) {
    symPlot(2 + i, 8 + (i >> 1), "l");
    symPlot(3 + i, 9 + (i >> 1), "m");
    symPlot(3 + i, 11 + (i >> 1), "d");
    symPlot(4 + i, 13 + (i >> 1), i % 2 ? "n" : "c");
  }
  for (let a = 0; a < 16; a++) {
    const ang = (a / 16) * Math.PI * 2;
    plot(Math.round(16 + Math.cos(ang) * 7), Math.round(6 + Math.sin(ang) * 3), a % 2 ? "w" : "c");
  }
  fillEllipse(16, 16, 6, 11, "l");
  fillEllipse(16, 19, 4, 8, "m");
  fillEllipse(16, 11, 3, 3, "k");
  symPlot(14, 11, "n");
  symPlot(17, 11, "c");
  fillEllipse(16, 17, 2.5, 3.5, "n");
  fillEllipse(16, 17, 1.2, 2, "w");
  outline("k");
  return compileMatrix(grid.map((r) => r.join("")), pal);
}

class PixelSpriteAtlas {
  private ready = false;
  private dynamicHeroCache = new Map<string, CompiledSprite[]>();
  heroes!: Record<ClassId, CompiledSprite[]>;
  npcs!: Record<string, CompiledSprite>;
  enemies!: Record<string, CompiledSprite[]>;
  bosses!: Record<string, CompiledSprite>;
  summons!: { turret: CompiledSprite; drone: CompiledSprite };
  tilesBleached!: Record<BiomeId, TileSet>;
  tilesRestored!: Record<BiomeId, TileSet>;
  buildings!: ReturnType<typeof buildRichBuildings>;
  interactables!: ReturnType<typeof buildRichInteractables>;

  init() {
    if (this.ready) return;
    this.ready = true;

    this.heroes = buildAllHeroSprites();
    this.npcs = buildAllNpcSprites();

    this.enemies = {};
    for (const [id, def] of Object.entries(ENEMY_MATRICES)) {
      this.enemies[id] = def.frames.map((f) => compileMatrix(f, def.pal));
    }

    this.bosses = {
      boss_blight_root: buildBossSprite("root"),
      boss_gilded_null: buildBossSprite("amber"),
      boss_the_eraser: buildBossSprite("eraser"),
    };

    this.summons = {
      turret: compileMatrix(TURRET_DEF.rows, TURRET_DEF.pal),
      drone: compileMatrix(DRONE_DEF.rows, DRONE_DEF.pal),
    };

    this.tilesBleached = {} as Record<BiomeId, TileSet>;
    this.tilesRestored = {} as Record<BiomeId, TileSet>;
    for (const biome of Object.values(BIOME_CONFIGS)) {
      this.tilesBleached[biome.id] = buildRichTileSet(biome.id, biome.bleached, false);
      this.tilesRestored[biome.id] = buildRichTileSet(biome.id, biome.restored, true);
    }

    this.buildings = buildRichBuildings();
    this.interactables = buildRichInteractables();
  }

  getHero(id: ClassId, frame = 0): CompiledSprite {
    this.init();
    const list = this.heroes[id];
    const idx = ((Math.floor(frame) % list.length) + list.length) % list.length;
    return list[idx];
  }

  getHeroDynamic(id: ClassId, loadout: HeroVisualLoadout, frame = 0): CompiledSprite {
    this.init();
    const enhTag = loadout.weaponEnhance >= 5 ? 1 : 0;
    const key = `${id}|${loadout.weaponTier}|${loadout.armorTier}|${loadout.ringTier}|${loadout.chipTier}|${enhTag}`;
    let list = this.dynamicHeroCache.get(key);
    if (!list) {
      list = buildDynamicHeroFrames(id, loadout);
      this.dynamicHeroCache.set(key, list);
    }
    const idx = ((Math.floor(frame) % list.length) + list.length) % list.length;
    return list[idx];
  }

  getEnemy(typeId: string, frame = 0): CompiledSprite {
    this.init();
    if (this.bosses[typeId]) return this.bosses[typeId];
    const list = this.enemies[typeId] ?? this.enemies.null_slime;
    const idx = ((Math.floor(frame) % list.length) + list.length) % list.length;
    return list[idx];
  }
}

export const sprites = new PixelSpriteAtlas();
