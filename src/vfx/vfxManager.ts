import { createFrame, clearFrame, createFx, PAL } from "./pixelfx/core/index.js";
import { rasterText, textWidth } from "./pixelfx/core/font.js";
import { FxAtlas, type BakedAtlas, type BakeOptions } from "./fxAtlas";
import type { PixelfxFrame, PixelfxInstance, PixelfxModule } from "./pixelfxTypes";

// Custom PIXTEL pixelfx effects
import * as colorWaveMod from "./pixelfx/fx/pixtel/color-wave.js";
import * as prismBeamMod from "./pixelfx/fx/pixtel/prism-beam.js";
import * as prismStormMod from "./pixelfx/fx/pixtel/prism-storm.js";
import * as chromaVortexMod from "./pixelfx/fx/pixtel/chroma-vortex.js";
import * as frameSkipMod from "./pixelfx/fx/pixtel/frame-skip.js";
import * as compileTurretMod from "./pixelfx/fx/pixtel/compile-turret.js";
import * as bossTelegraphMod from "./pixelfx/fx/pixtel/boss-telegraph.js";
import * as overdriveAuraMod from "./pixelfx/fx/pixtel/overdrive-aura.js";
import * as rarityAuraMod from "./pixelfx/fx/pixtel/rarity-aura.js";

// Melee & Combat pixelfx
import * as swordSlashMod from "./pixelfx/fx/melee/sword-slash.js";
import * as doubleSlashMod from "./pixelfx/fx/melee/double-slash.js";
import * as heavyCleaveMod from "./pixelfx/fx/melee/heavy-cleave.js";
import * as thrustMod from "./pixelfx/fx/melee/thrust.js";
import * as spinSlashMod from "./pixelfx/fx/melee/spin-slash.js";
import * as daggerFlurryMod from "./pixelfx/fx/melee/dagger-flurry.js";
import * as shieldBlockMod from "./pixelfx/fx/impacts/shield-block.js";
import * as hitSparkMod from "./pixelfx/fx/impacts/hit-spark.js";
import * as critHitMod from "./pixelfx/fx/impacts/crit-hit.js";
import * as parryMod from "./pixelfx/fx/impacts/parry.js";
import * as bulletImpactMod from "./pixelfx/fx/impacts/bullet-impact.js";
import * as groundSlamMod from "./pixelfx/fx/impacts/ground-slam.js";
import * as smallExplosionMod from "./pixelfx/fx/explosions/small-explosion.js";
import * as plasmaExplosionMod from "./pixelfx/fx/explosions/plasma-explosion.js";
import * as dirtExplosionMod from "./pixelfx/fx/explosions/dirt-explosion.js";
import * as frostNovaMod from "./pixelfx/fx/ice/frost-nova.js";
import * as iceShatterMod from "./pixelfx/fx/ice/ice-shatter.js";
import * as iceLanceMod from "./pixelfx/fx/ice/ice-lance.js";
import * as fireballMod from "./pixelfx/fx/fire/fireball.js";
import * as poisonCloudMod from "./pixelfx/fx/nature/poison-cloud.js";
import * as acidSplashMod from "./pixelfx/fx/nature/acid-splash.js";
import * as thornsMod from "./pixelfx/fx/nature/thorns.js";
import * as starFallMod from "./pixelfx/fx/arcane/star-fall.js";
import * as glitchMod from "./pixelfx/fx/scifi/glitch.js";
import * as hologramMod from "./pixelfx/fx/scifi/hologram.js";
import * as teleporterPadMod from "./pixelfx/fx/scifi/teleporter-pad.js";
import * as hasteMod from "./pixelfx/fx/status/haste.js";
import * as plasmaShotMod from "./pixelfx/fx/projectiles/plasma-shot.js";
import * as laserBoltMod from "./pixelfx/fx/projectiles/laser-bolt.js";
import * as bulletTracerMod from "./pixelfx/fx/projectiles/bullet-tracer.js";
import * as energyDiscMod from "./pixelfx/fx/projectiles/energy-disc.js";
import * as muzzlePistolMod from "./pixelfx/fx/projectiles/muzzle-pistol.js";
import * as muzzleSmgMod from "./pixelfx/fx/projectiles/muzzle-smg.js";
import * as spawnPortalMod from "./pixelfx/fx/spawn/spawn-portal.js";
import * as disintegrateMod from "./pixelfx/fx/spawn/disintegrate.js";
import * as poofMod from "./pixelfx/fx/spawn/poof.js";
import * as healAoeMod from "./pixelfx/fx/holy/heal-aoe.js";
import * as healMod from "./pixelfx/fx/holy/heal.js";
import * as holyPillarMod from "./pixelfx/fx/holy/holy-pillar.js";
import * as smiteMod from "./pixelfx/fx/holy/smite.js";
import * as zapHitMod from "./pixelfx/fx/lightning/zap-hit.js";
import * as xpOrbMod from "./pixelfx/fx/pickups/xp-orb.js";
import * as collectBurstMod from "./pixelfx/fx/pickups/collect-burst.js";
import * as lootBeamMod from "./pixelfx/fx/pickups/loot-beam.js";
import * as chestOpenMod from "./pixelfx/fx/pickups/chest-open.js";
import * as coinSpinMod from "./pixelfx/fx/pickups/coin-spin.js";
import * as crystalShardMod from "./pixelfx/fx/pickups/crystal-shard.js";
import * as levelUpMod from "./pixelfx/fx/ui/level-up.js";

export const PIXELFX_MODS: Record<string, PixelfxModule> = {
  "pixtel/color-wave": colorWaveMod,
  "pixtel/prism-beam": prismBeamMod,
  "pixtel/prism-storm": prismStormMod,
  "pixtel/chroma-vortex": chromaVortexMod,
  "pixtel/frame-skip": frameSkipMod,
  "pixtel/compile-turret": compileTurretMod,
  "pixtel/boss-telegraph": bossTelegraphMod,
  "pixtel/overdrive-aura": overdriveAuraMod,
  "pixtel/rarity-aura": rarityAuraMod,
  "melee/sword-slash": swordSlashMod,
  "melee/double-slash": doubleSlashMod,
  "melee/heavy-cleave": heavyCleaveMod,
  "melee/thrust": thrustMod,
  "melee/spin-slash": spinSlashMod,
  "melee/dagger-flurry": daggerFlurryMod,
  "impacts/shield-block": shieldBlockMod,
  "impacts/hit-spark": hitSparkMod,
  "impacts/crit-hit": critHitMod,
  "impacts/parry": parryMod,
  "impacts/bullet-impact": bulletImpactMod,
  "impacts/ground-slam": groundSlamMod,
  "explosions/small-explosion": smallExplosionMod,
  "explosions/plasma-explosion": plasmaExplosionMod,
  "explosions/dirt-explosion": dirtExplosionMod,
  "ice/frost-nova": frostNovaMod,
  "ice/ice-shatter": iceShatterMod,
  "ice/ice-lance": iceLanceMod,
  "fire/fireball": fireballMod,
  "nature/poison-cloud": poisonCloudMod,
  "nature/acid-splash": acidSplashMod,
  "nature/thorns": thornsMod,
  "arcane/star-fall": starFallMod,
  "scifi/glitch": glitchMod,
  "scifi/hologram": hologramMod,
  "scifi/teleporter-pad": teleporterPadMod,
  "status/haste": hasteMod,
  "projectiles/plasma-shot": plasmaShotMod,
  "projectiles/laser-bolt": laserBoltMod,
  "projectiles/bullet-tracer": bulletTracerMod,
  "projectiles/energy-disc": energyDiscMod,
  "projectiles/muzzle-pistol": muzzlePistolMod,
  "projectiles/muzzle-smg": muzzleSmgMod,
  "spawn/spawn-portal": spawnPortalMod,
  "spawn/disintegrate": disintegrateMod,
  "spawn/poof": poofMod,
  "holy/heal-aoe": healAoeMod,
  "holy/heal": healMod,
  "holy/holy-pillar": holyPillarMod,
  "holy/smite": smiteMod,
  "lightning/zap-hit": zapHitMod,
  "pickups/xp-orb": xpOrbMod,
  "pickups/collect-burst": collectBurstMod,
  "pickups/loot-beam": lootBeamMod,
  "pickups/chest-open": chestOpenMod,
  "pickups/coin-spin": coinSpinMod,
  "pickups/crystal-shard": crystalShardMod,
  "ui/level-up": levelUpMod,
};

const PIVOT_OFFSETS: Record<string, [number, number]> = {
  "melee/sword-slash": [0, -26],
  "melee/double-slash": [0, -24],
  "melee/heavy-cleave": [0, -24],
  "melee/thrust": [0, -22],
  "melee/dagger-flurry": [16, -26],
  "impacts/shield-block": [4, -22],
  "melee/spin-slash": [0, -17],
  "ui/level-up": [0, -16],
  "scifi/glitch": [0, -8],
  "spawn/disintegrate": [0, -8],
  "status/haste": [0, -8],
};

export const ATLAS_PRESETS: Record<string, { mod: PixelfxModule; opts: BakeOptions }> = {
  // Combat impacts & explosions
  "hit-fire": { mod: hitSparkMod, opts: { options: { palette: PAL.fire, height: 6 }, fps: 22, downscale: 0.65 } },
  "hit-ice": { mod: hitSparkMod, opts: { options: { palette: PAL.ice, height: 6 }, fps: 22, downscale: 0.65 } },
  "hit-poison": { mod: hitSparkMod, opts: { options: { palette: PAL.poison, height: 6 }, fps: 22, downscale: 0.65 } },
  "hit-cyan": { mod: hitSparkMod, opts: { options: { palette: PAL.cyber, height: 6 }, fps: 22, downscale: 0.65 } },
  "hit-gold": { mod: hitSparkMod, opts: { options: { palette: PAL.gold, height: 6 }, fps: 22, downscale: 0.65 } },
  "crit-gold": { mod: critHitMod, opts: { options: { palette: PAL.volt, height: 8 }, fps: 22, downscale: 0.52 } },
  "mine-hit": { mod: bulletImpactMod, opts: { options: { palette: PAL.gold }, fps: 20, maxDuration: 0.7, downscale: 0.55 } },
  "mine-break": { mod: dirtExplosionMod, opts: { options: { palette: PAL.stone }, fps: 18, maxDuration: 1.0, downscale: 0.45 } },
  "explode-fire": { mod: smallExplosionMod, opts: { options: { palette: PAL.fire, size: 0.55 }, fps: 16, maxDuration: 1.2, downscale: 0.6 } },
  "explode-plasma": { mod: plasmaExplosionMod, opts: { options: { palette: PAL.cyber, accent: PAL.arcane }, fps: 18, maxDuration: 1.0, downscale: 0.5 } },
  "explode-void": { mod: plasmaExplosionMod, opts: { options: { palette: PAL.shadow, accent: PAL.neon }, fps: 18, maxDuration: 1.0, downscale: 0.5 } },
  "ice-nova": { mod: frostNovaMod, opts: { options: { palette: PAL.ice, reach: 50 }, fps: 16, maxDuration: 1.4, downscale: 0.5 } },
  "ice-shatter": { mod: iceShatterMod, opts: { options: { palette: PAL.ice }, fps: 18, maxDuration: 1.1, downscale: 0.5 } },
  "acid-splash": { mod: acidSplashMod, opts: { options: { palette: PAL.poison }, fps: 18, maxDuration: 1.1, downscale: 0.52 } },
  "poison-cloud": { mod: poisonCloudMod, opts: { options: { palette: PAL.poison, spread: 36 }, fps: 14, maxDuration: 1.4, downscale: 0.5 } },
  "portal-void": { mod: spawnPortalMod, opts: { options: { palette: PAL.arcane, width: 15 }, fps: 16, maxDuration: 1.5, downscale: 0.6 } },
  "death-poof": { mod: poofMod, opts: { options: { palette: PAL.smoke, stars: PAL.cyber }, fps: 18, maxDuration: 0.85, downscale: 0.5 } },
  "collect-burst": { mod: collectBurstMod, opts: { options: { palette: PAL.cyber }, fps: 20, maxDuration: 0.65, downscale: 0.48 } },
  "collect-burst-rare": { mod: collectBurstMod, opts: { options: { palette: PAL.water }, fps: 20, maxDuration: 0.72, downscale: 0.56 } },
  "collect-burst-epic": { mod: collectBurstMod, opts: { options: { palette: PAL.arcane }, fps: 20, maxDuration: 0.78, downscale: 0.62 } },
  "collect-burst-legendary": { mod: collectBurstMod, opts: { options: { palette: PAL.volt }, fps: 22, maxDuration: 0.88, downscale: 0.72 } },
  "zap-hit": { mod: zapHitMod, opts: { options: { palette: PAL.cyber }, fps: 22, maxDuration: 0.6, downscale: 0.52 } },
  "heal-burst": { mod: healMod, opts: { options: { palette: PAL.heal }, fps: 18, maxDuration: 0.9, downscale: 0.55 } },
  "heal-aoe": { mod: healAoeMod, opts: { options: { palette: PAL.heal, reach: 44 }, fps: 16, maxDuration: 1.2, downscale: 0.52 } },
  "ground-slam": { mod: groundSlamMod, opts: { options: { palette: PAL.blood, reach: 56 }, fps: 16, maxDuration: 1.2, downscale: 0.52 } },
  "boss-thorns": { mod: thornsMod, opts: { options: { palette: PAL.poison, glow: PAL.neon, count: 5 }, fps: 16, maxDuration: 1.2, downscale: 0.52 } },
  "boss-starfall": { mod: starFallMod, opts: { options: { palette: PAL.candy }, fps: 16, maxDuration: 1.4, downscale: 0.6 } },
  "boss-smite": { mod: smiteMod, opts: { options: { palette: PAL.neon }, fps: 16, maxDuration: 1.1, downscale: 0.52 } },
  "waypoint-pillar": { mod: holyPillarMod, opts: { options: { palette: PAL.cyber }, fps: 16, maxDuration: 1.4, downscale: 0.55 } },
  "waypoint-pad": { mod: teleporterPadMod, opts: { options: { palette: PAL.cyber }, fps: 14, downscale: 0.5 } },
  "chest-open": { mod: chestOpenMod, opts: { options: { palette: PAL.gold }, fps: 16, maxDuration: 1.6, downscale: 0.55 } },
  "forge-sparks": { mod: parryMod, opts: { options: { palette: PAL.gold }, fps: 22, downscale: 0.55 } },

  // Rarity Loot Beams & High-Rarity Auras (pixelfx pickups/loot-beam & pixtel/rarity-aura!)
  "beam-common": { mod: lootBeamMod, opts: { options: { palette: PAL.metal }, fps: 14, downscale: 0.36 } },
  "beam-uncommon": { mod: lootBeamMod, opts: { options: { palette: PAL.heal }, fps: 14, downscale: 0.42 } },
  "beam-rare": { mod: lootBeamMod, opts: { options: { palette: PAL.water }, fps: 14, downscale: 0.48 } },
  "beam-epic": { mod: lootBeamMod, opts: { options: { palette: PAL.arcane }, fps: 14, downscale: 0.54 } },
  "beam-legendary": { mod: lootBeamMod, opts: { options: { palette: PAL.volt }, fps: 16, downscale: 0.62 } },
  "item-aura-rare": { mod: rarityAuraMod, opts: { options: { palette: PAL.water, tier: 3, radius: 13, seed: 31 }, fps: 16, downscale: 0.72 } },
  "item-aura-epic": { mod: rarityAuraMod, opts: { options: { palette: PAL.arcane, tier: 4, radius: 14, seed: 47 }, fps: 18, downscale: 0.78 } },
  "item-aura-legendary": { mod: rarityAuraMod, opts: { options: { palette: PAL.volt, tier: 5, radius: 15, seed: 73 }, fps: 20, downscale: 0.85 } },

  // Looping projectiles & pickups
  "proj-fireball": { mod: fireballMod, opts: { options: { palette: PAL.fire, radius: 5 }, fps: 18, downscale: 0.52 } },
  "proj-icelance": { mod: iceLanceMod, opts: { options: { palette: PAL.ice, length: 24 }, fps: 18, downscale: 0.52 } },
  "proj-poison": { mod: plasmaShotMod, opts: { options: { palette: PAL.poison, size: 4 }, fps: 18, downscale: 0.52 } },
  "proj-void": { mod: plasmaShotMod, opts: { options: { palette: PAL.neon, size: 4 }, fps: 18, downscale: 0.48 } },
  "proj-amber": { mod: plasmaShotMod, opts: { options: { palette: PAL.volt, size: 4 }, fps: 18, downscale: 0.48 } },
  "proj-laser": { mod: laserBoltMod, opts: { options: { palette: PAL.cyber, length: 26 }, fps: 20, downscale: 0.52 } },
  "proj-bullet": { mod: bulletTracerMod, opts: { options: { palette: PAL.gold, length: 24 }, fps: 20, downscale: 0.48 } },
  "proj-shuriken": { mod: energyDiscMod, opts: { options: { palette: PAL.cyber, size: 5, teeth: 4 }, fps: 20, downscale: 0.52 } },
  "coin-spin": { mod: coinSpinMod, opts: { options: { palette: PAL.gold }, fps: 14, downscale: 0.35 } },
  "crystal-shard": { mod: crystalShardMod, opts: { options: { palette: PAL.cyber }, fps: 14, downscale: 0.38 } },
  "xp-orb": { mod: xpOrbMod, opts: { options: { palette: PAL.cyber }, fps: 14, downscale: 0.4 } },
  "muzzle-pistol": { mod: muzzlePistolMod, opts: { options: { palette: PAL.cyber, height: 6 }, fps: 22, maxDuration: 0.32, downscale: 0.52 } },
  "muzzle-smg": { mod: muzzleSmgMod, opts: { options: { palette: PAL.heal, height: 6 }, fps: 22, maxDuration: 0.36, downscale: 0.52 } },
};

interface LiveFxEntry {
  modId: string;
  fx: PixelfxInstance;
  x: number;
  y: number;
  angle: number;
  flip: boolean;
  pivot: [number, number];
  priority: number;
  follow: { x: number; y: number } | null;
  offsetX: number;
  offsetY: number;
  durationScale: number;
  age: number;
  maxLife: number | null;
}

interface PooledFxSlot {
  active: boolean;
  atlas: BakedAtlas | null;
  x: number;
  y: number;
  angle: number;
  flip: boolean;
  t: number;
  speed: number;
  alpha: number;
  layer: "back" | "front";
  follow: { x: number; y: number } | null;
  offsetX: number;
  offsetY: number;
  scale: number;
}

interface FloatingTextSlot {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  text: string;
  color: string;
  outline: string;
  crit: boolean;
  life: number;
  maxLife: number;
}

interface PixelDotSlot {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

const MAX_LIVE_FX = 26;
const MAX_POOLED_FX = 200;
const MAX_TEXTS = 64;
const MAX_DOTS = 180;
const CULL_MARGIN = 96;

/**
 * Viewport-culled, object-pooled pixelfx VFX Manager for Open-World 60 FPS gameplay.
 */
export class VfxManager {
  readonly w: number;
  readonly h: number;
  readonly atlas = new FxAtlas();
  private frameBack: PixelfxFrame;
  private frameFront: PixelfxFrame;

  private colorCanvas: HTMLCanvasElement;
  private colorCtx: CanvasRenderingContext2D;
  private colorImg: ImageData;
  private colorU32: Uint32Array;

  private lightCanvas: HTMLCanvasElement;
  private lightCtx: CanvasRenderingContext2D;
  private lightImg: ImageData;
  private lightU32: Uint32Array;

  private livePool: LiveFxEntry[] = [];
  private pooledFx: PooledFxSlot[];
  private textPool: FloatingTextSlot[];
  private dotPool: PixelDotSlot[];

  constructor(width = 480, height = 270) {
    this.w = width;
    this.h = height;
    this.frameBack = createFrame(width, height, 0, 0);
    this.frameFront = createFrame(width, height, 0, 0);

    this.colorCanvas = document.createElement("canvas");
    this.colorCanvas.width = width;
    this.colorCanvas.height = height;
    this.colorCtx = this.colorCanvas.getContext("2d")!;
    this.colorCtx.imageSmoothingEnabled = false;
    this.colorImg = this.colorCtx.createImageData(width, height);
    this.colorU32 = new Uint32Array(this.colorImg.data.buffer);

    this.lightCanvas = document.createElement("canvas");
    this.lightCanvas.width = width;
    this.lightCanvas.height = height;
    this.lightCtx = this.lightCanvas.getContext("2d")!;
    this.lightCtx.imageSmoothingEnabled = false;
    this.lightImg = this.lightCtx.createImageData(width, height);
    this.lightU32 = new Uint32Array(this.lightImg.data.buffer);

    this.pooledFx = Array.from({ length: MAX_POOLED_FX }, () => ({
      active: false,
      atlas: null,
      x: 0,
      y: 0,
      angle: 0,
      flip: false,
      t: 0,
      speed: 1,
      alpha: 1,
      layer: "front",
      follow: null,
      offsetX: 0,
      offsetY: 0,
      scale: 1,
    }));

    this.textPool = Array.from({ length: MAX_TEXTS }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      text: "",
      color: "#ffffff",
      outline: "#100c18",
      crit: false,
      life: 0,
      maxLife: 0.7,
    }));

    this.dotPool = Array.from({ length: MAX_DOTS }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      color: "#ffffff",
      size: 1,
      life: 0,
      maxLife: 0.3,
    }));
  }

  warmup() {
    const eager = [
      "hit-cyan", "hit-fire", "hit-ice", "hit-poison", "hit-gold", "crit-gold",
      "mine-hit", "death-poof", "collect-burst", "collect-burst-rare", "collect-burst-epic", "collect-burst-legendary",
      "proj-fireball", "proj-icelance",
      "proj-poison", "proj-laser", "proj-shuriken", "waypoint-pad",
      "beam-uncommon", "beam-rare", "beam-epic", "beam-legendary",
      "item-aura-rare", "item-aura-epic", "item-aura-legendary",
    ];
    for (const k of eager) {
      const p = ATLAS_PRESETS[k];
      if (p) this.atlas.get(k, p.mod, p.opts);
    }
  }

  clearAll() {
    this.livePool.length = 0;
    for (const f of this.pooledFx) f.active = false;
    for (const t of this.textPool) t.active = false;
    for (const d of this.dotPool) d.active = false;
  }

  getAtlas(presetKey: string): BakedAtlas | null {
    const p = ATLAS_PRESETS[presetKey];
    if (!p) return null;
    return this.atlas.get(presetKey, p.mod, p.opts);
  }

  spawnLive(
    modId: string,
    opts: {
      x?: number;
      y?: number;
      angle?: number;
      flip?: boolean;
      options?: Record<string, unknown>;
      priority?: number;
      follow?: { x: number; y: number } | null;
      offsetX?: number;
      offsetY?: number;
      pivot?: [number, number] | null;
      durationScale?: number;
      maxLife?: number | null;
    } = {}
  ): LiveFxEntry | null {
    const mod = PIXELFX_MODS[modId];
    if (!mod) return null;

    if (this.livePool.length >= MAX_LIVE_FX) {
      let victim = 0;
      for (let i = 1; i < this.livePool.length; i++) {
        if (this.livePool[i].priority < this.livePool[victim].priority) victim = i;
      }
      this.livePool.splice(victim, 1);
    }

    const x = opts.x ?? 0;
    const y = opts.y ?? 0;
    const angle = opts.angle ?? 0;
    const flip = !!opts.flip;
    const pivot = opts.pivot ?? PIVOT_OFFSETS[modId] ?? [0, 0];
    const placed = this._applyPivot(x, y, pivot[0], pivot[1], flip, angle);

    const fx = createFx(mod, {
      x: placed.x,
      y: placed.y,
      flip,
      angle,
      seed: ((Math.random() * 9999) | 0) + 1,
      ...(opts.options ?? {}),
    });

    const entry: LiveFxEntry = {
      modId,
      fx,
      x,
      y,
      angle,
      flip,
      pivot,
      priority: opts.priority ?? 1,
      follow: opts.follow ?? null,
      offsetX: opts.offsetX ?? 0,
      offsetY: opts.offsetY ?? 0,
      durationScale: opts.durationScale ?? 1,
      age: 0,
      maxLife: opts.maxLife ?? null,
    };
    this.livePool.push(entry);
    return entry;
  }

  private _applyPivot(tx: number, ty: number, lx: number, ly: number, flip: boolean, angle: number) {
    if (lx === 0 && ly === 0) return { x: tx, y: ty };
    const fx = flip ? -1 : 1;
    const cs = Math.cos(angle), sn = Math.sin(angle);
    return {
      x: tx - (lx * fx * cs - ly * sn),
      y: ty - (lx * fx * sn + ly * cs),
    };
  }

  spawnPooled(
    presetKey: string,
    opts: {
      x?: number;
      y?: number;
      angle?: number;
      flip?: boolean;
      speed?: number;
      alpha?: number;
      layer?: "back" | "front";
      follow?: { x: number; y: number } | null;
      offsetX?: number;
      offsetY?: number;
      scale?: number;
    } = {}
  ) {
    const atlas = this.getAtlas(presetKey);
    if (!atlas) return null;

    let slot: PooledFxSlot | null = null;
    for (const s of this.pooledFx) {
      if (!s.active) {
        slot = s;
        break;
      }
    }
    if (!slot) {
      slot = this.pooledFx.reduce((a, b) => (b.t > a.t ? b : a), this.pooledFx[0]);
    }

    slot.active = true;
    slot.atlas = atlas;
    slot.x = opts.x ?? 0;
    slot.y = opts.y ?? 0;
    slot.angle = opts.angle ?? 0;
    slot.flip = !!opts.flip;
    slot.t = 0;
    slot.speed = opts.speed ?? 1;
    slot.alpha = opts.alpha ?? 1;
    slot.layer = opts.layer ?? "front";
    slot.follow = opts.follow ?? null;
    slot.offsetX = opts.offsetX ?? 0;
    slot.offsetY = opts.offsetY ?? 0;
    slot.scale = opts.scale ?? 1;
    return slot;
  }

  spawnDamageText(
    x: number,
    y: number,
    text: string,
    opts: { crit?: boolean; color?: string; outline?: string } = {}
  ) {
    let slot = this.textPool.find((s) => !s.active) ?? this.textPool[0];
    slot.active = true;
    slot.x = x + (Math.random() - 0.5) * 6;
    slot.y = y - 8;
    slot.vx = (Math.random() - 0.5) * 14;
    slot.vy = opts.crit ? -46 : -34;
    slot.text = text;
    slot.color = opts.crit ? "#ffe25a" : (opts.color ?? "#ffffff");
    slot.outline = opts.outline ?? "#100c18";
    slot.crit = !!opts.crit;
    slot.life = 0;
    slot.maxLife = opts.crit ? 0.85 : 0.65;
  }

  spawnPixelDot(x: number, y: number, vx: number, vy: number, color: string, life = 0.25, size = 1) {
    const slot = this.dotPool.find((d) => !d.active);
    if (!slot) return;
    slot.active = true;
    slot.x = x;
    slot.y = y;
    slot.vx = vx;
    slot.vy = vy;
    slot.color = color;
    slot.size = size;
    slot.life = 0;
    slot.maxLife = life;
  }

  update(dt: number) {
    for (let i = this.livePool.length - 1; i >= 0; i--) {
      const e = this.livePool[i];
      e.age += dt;
      if (e.follow) {
        e.x = e.follow.x + e.offsetX;
        e.y = e.follow.y + e.offsetY;
        const placed = this._applyPivot(e.x, e.y, e.pivot[0], e.pivot[1], e.flip, e.angle);
        e.fx.options.x = placed.x;
        e.fx.options.y = placed.y;
        e.fx.options.flip = e.flip;
        e.fx.options.angle = e.angle;
      }
      e.fx.update(dt * e.durationScale);
      if (e.fx.done() || (e.maxLife !== null && e.age >= e.maxLife)) {
        this.livePool.splice(i, 1);
      }
    }

    for (const f of this.pooledFx) {
      if (!f.active || !f.atlas) continue;
      f.t += dt * f.speed;
      if (f.follow) {
        f.x = f.follow.x + f.offsetX;
        f.y = f.follow.y + f.offsetY;
      }
      if (!f.atlas.loop && f.t >= f.atlas.duration) f.active = false;
    }

    for (const t of this.textPool) {
      if (!t.active) continue;
      t.life += dt;
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.vy += 65 * dt;
      if (t.life >= t.maxLife) t.active = false;
    }

    for (const d of this.dotPool) {
      if (!d.active) continue;
      d.life += dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vx *= 1 - Math.min(1, 4 * dt);
      d.vy *= 1 - Math.min(1, 4 * dt);
      if (d.life >= d.maxLife) d.active = false;
    }
  }

  drawLayer(ctx: CanvasRenderingContext2D, camX: number, camY: number, layer: "back" | "front") {
    const ox = Math.round(camX);
    const oy = Math.round(camY);

    // 1. Pooled baked pixelfx (strictly viewport-culled)
    for (const f of this.pooledFx) {
      if (!f.active || !f.atlas || f.layer !== layer) continue;
      const sx = f.x - ox, sy = f.y - oy;
      if (sx < -CULL_MARGIN || sy < -CULL_MARGIN || sx > this.w + CULL_MARGIN || sy > this.h + CULL_MARGIN) continue;
      this.drawAtlasInstance(ctx, f.atlas, sx, sy, f.t, f.angle, f.flip, f.scale, f.alpha);
    }

    // 2. Live pixelfx (only draw those overlapping viewport)
    let anyLive = false;
    const frame = layer === "back" ? this.frameBack : this.frameFront;
    for (const e of this.livePool) {
      const sx = e.x - ox, sy = e.y - oy;
      if (sx < -200 || sy < -200 || sx > this.w + 200 || sy > this.h + 200) continue;
      if (!anyLive) {
        clearFrame(frame);
        frame.ox = ox;
        frame.oy = oy;
        anyLive = true;
      }
      e.fx.draw(frame, layer);
    }
    if (anyLive) this._blitFrame(ctx, frame);

    if (layer === "front") {
      this._drawDotsAndTexts(ctx, ox, oy);
    }
  }

  drawAtlasInstance(
    ctx: CanvasRenderingContext2D,
    atlas: BakedAtlas | null,
    sx: number,
    sy: number,
    t: number,
    angle = 0,
    flip = false,
    scale = 1,
    alpha = 1
  ) {
    if (!atlas) return;
    if (sx < -CULL_MARGIN || sy < -CULL_MARGIN || sx > this.w + CULL_MARGIN || sy > this.h + CULL_MARGIN) return;
    const rawIdx = Math.floor(t * atlas.fps);
    const idx = atlas.loop
      ? ((rawIdx % atlas.count) + atlas.count) % atlas.count
      : Math.min(atlas.count - 1, Math.max(0, rawIdx));
    const gx = (idx % atlas.cols) * atlas.fw;
    const gy = Math.floor(idx / atlas.cols) * atlas.fh;
    const dw = Math.round(atlas.fw * scale);
    const dh = Math.round(atlas.fh * scale);
    const px = Math.round(atlas.pivotX * scale);
    const py = Math.round(atlas.pivotY * scale);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(sx), Math.round(sy));
    if (angle !== 0) ctx.rotate(angle);
    if (flip) ctx.scale(-1, 1);
    if (alpha < 1) ctx.globalAlpha = alpha;
    ctx.drawImage(atlas.colorCanvas, gx, gy, atlas.fw, atlas.fh, -px, -py, dw, dh);
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(atlas.lightCanvas, gx, gy, atlas.fw, atlas.fh, -px, -py, dw, dh);
    ctx.restore();
  }

  private _blitFrame(ctx: CanvasRenderingContext2D, frame: PixelfxFrame) {
    this.colorU32.set(frame.color);
    this.colorCtx.putImageData(this.colorImg, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.colorCanvas, 0, 0);
    this.lightU32.set(frame.light);
    this.lightCtx.putImageData(this.lightImg, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(this.lightCanvas, 0, 0);
    ctx.restore();
  }

  private _drawDotsAndTexts(ctx: CanvasRenderingContext2D, ox: number, oy: number) {
    for (let i = 0; i < this.dotPool.length; i++) {
      const d = this.dotPool[i];
      if (!d.active) continue;
      const sx = Math.round(d.x - ox), sy = Math.round(d.y - oy);
      if (sx < -4 || sy < -4 || sx > this.w + 4 || sy > this.h + 4) continue;
      if (1 - d.life / d.maxLife < 0.25 && ((Math.floor(d.life * 30) + i) & 1)) continue;
      ctx.fillStyle = d.color;
      ctx.fillRect(sx, sy, d.size, d.size);
    }

    for (let i = 0; i < this.textPool.length; i++) {
      const t = this.textPool[i];
      if (!t.active) continue;
      const font = t.crit ? "big" : "mini";
      const tw = textWidth(t.text, font);
      const jitterX = t.crit && t.life < 0.2 ? Math.round((Math.random() - 0.5) * 2) : 0;
      const px = Math.round(t.x - ox - tw * 0.5) + jitterX;
      const py = Math.round(t.y - oy);
      if (px + tw < -8 || py < -12 || px > this.w + 8 || py > this.h + 12) continue;
      if (1 - t.life / t.maxLife < 0.2 && ((Math.floor(t.life * 24) + i) & 1)) continue;

      ctx.fillStyle = t.outline;
      rasterText(t.text, font, (gx: number, gy: number) => {
        ctx.fillRect(px + gx - 1, py + gy, 3, 1);
        ctx.fillRect(px + gx, py + gy - 1, 1, 3);
      });
      ctx.fillStyle = t.life < 0.06 ? "#ffffff" : t.color;
      rasterText(t.text, font, (gx: number, gy: number) => {
        ctx.fillRect(px + gx, py + gy, 1, 1);
      });
    }
  }
}
