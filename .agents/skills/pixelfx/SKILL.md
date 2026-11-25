---
name: pixelfx
description: Make pixel art effects and sprite animations in code with the pixelfx library, which has 244 ready-made ones, acted out by a character who winds up, freezes on contact and recovers (fire, explosions, water, ice, lightning, sci-fi, melee, impacts, projectiles, spawn and death, arcane, holy, shadow, status, nature, weather, UI, pickups, transitions, critters) to drop into a game, recolor, export as sprite sheets or remix, plus a draft, render, look, refine loop that makes new ones look hand-animated. Use when someone wants pixel art VFX, sprite animations or sprite sheets, game juice, a specific effect ("a frost nova for my mage", "a coin pickup sparkle"), wants to use or export a pixelfx effect in Godot, Unity, Phaser or a canvas game, or wants their pixel effects to look better.
license: MIT
compatibility: Node 18 or newer. ffmpeg is optional (GIF and MP4 previews).
---

# pixelfx

Pixel art effects as code (upstream: `https://github.com/patch-gg/pixelfx`). Each effect is one ES module file, `src/vfx/pixelfx/fx/<category>/<name>.js`, that draws into two buffers: **color** (pixels: opaque, dithered or truly translucent) and **light** (additive glow). No external images, so an effect can be played live, recolored, mirrored, reseeded and rendered to a sprite sheet or pre-baked into an atlas.

The method is Hugo Duprez's ([How to make (good) pixel art effects with Claude](https://www.spritefusion.com/blog/how-to-make-good-pixel-art-effects-with-claude)): code is clay, trust your eyes, feed your references. One-shot prompts make mediocre effects. Drafts you render, look at and refine make good ones.

## Project Layout & Tools

Run all commands from the project root. `FXTOOLS` = `.agents/skills/pixelfx/scripts`.

- **Core engine:** `src/vfx/pixelfx/core/` (`index.js`, `color.js`, `painter.js`, `sim.js`, `act.js`, `rig.js`, `fx.js`, ...)
- **Project effects:** `src/vfx/pixelfx/fx/<category>/<name>.js` (includes custom PixTel effects under `src/vfx/pixelfx/fx/pixtel/`)
- **Game integration (PixTel):** `src/vfx/fxAtlas.ts` (pre-baked two-buffer atlas) and `src/vfx/vfxManager.ts` (live + pooled VFX slots)
- **Skill references:**
  - [references/AUTHORING.md](./references/AUTHORING.md) — effect contract, Painter API, `Particles`/`Bits`, quality bar, and Acts guide
  - [references/CATALOG.md](./references/CATALOG.md) — complete 244-effect catalog from `patch-gg/pixelfx`

Check the toolchain works:

```bash
node .agents/skills/pixelfx/scripts/render.mjs fire/fireball
```

This writes `records/fire/fireball/contact.png` (git-ignored). Open that PNG with your image-reading tool. That contact sheet is how you see every effect from now on.

## 1. Look for an existing effect first

- Search effects already installed in `src/vfx/pixelfx/fx/`:
  ```bash
  node .agents/skills/pixelfx/scripts/list.mjs <words>
  ```
  Example: `node .agents/skills/pixelfx/scripts/list.mjs slash` or `node .agents/skills/pixelfx/scripts/list.mjs loop`.
- Search all 244 upstream effects in [references/CATALOG.md](./references/CATALOG.md). If an effect exists upstream in `patch-gg/pixelfx` (`src/fx/<category>/<name>.js`) and isn't in `src/vfx/pixelfx/fx/` yet, copy that effect file (and any `_lib.js` in its category folder) into `src/vfx/pixelfx/fx/<category>/` before writing one from scratch.
- Render candidates and look at them before choosing. Most requests are an existing effect with different options:
  - `palette`: the main ramp, dark to bright, as hex strings. Any `PAL` ramp in `src/vfx/pixelfx/core/color.js` (`fire`, `ember`, `lava`, `smoke`, `dust`, `ice`, `water`, `electric`, `volt`, `poison`, `holy`, `heal`, `arcane`, `shadow`, `blood`, `earth`, `stone`, `gold`, `leaf`, `wood`, `metal`, `bone`, `neon`, `cyber`, `matrix`, `candy`, `night`) or your own. A blue fire is `{"palette": PAL.ice}`.
  - `seed` for a different but equivalent take; `flip` to face left; `angle` to rotate; `light` (0..1+) for glow strength; plus each effect's own knobs in its `meta.options` (`size`, `count`, `radius`, `text`, `height`...).
  - Try options without editing code:
    ```bash
    node .agents/skills/pixelfx/scripts/render.mjs pixtel/color-wave --opts '{"palette":["#102","#215","#43a","#8cf","#cff","#fff"]}'
    ```

## 2. Put it in the game

**In PixTel (hybrid live + atlas pipeline):**
- **Pre-baked pooled VFX** (frequent hits, explosions, projectiles, pickups, loot beams): register the effect module in `src/vfx/fxAtlas.ts` and spawn it via `src/vfx/vfxManager.ts` atlas slots.
- **Live two-buffer VFX** (dynamic angle/beam/color-wave/UI previews): drive with `createFx` / `createAct` via `src/vfx/vfxManager.ts` live slots (or directly in modal canvases like `src/ui/ClassSelect.ts` and `src/ui/ForgeModal.ts`).

**Standalone Canvas or WebGL usage:**

```js
import { createFrame, clearFrame, createFx, composite } from "./vfx/pixelfx/core/index.js";
import * as frostNova from "./vfx/pixelfx/fx/ice/frost-nova.js";

const frame = createFrame(320, 180);            // pixel resolution; ox, oy scroll with camera
const img = new ImageData(320, 180);
const fx = createFx(frostNova, { x: hero.x, y: hero.y, flip: hero.facing < 0 });

// every tick
fx.update(dt);
clearFrame(frame);
fx.draw(frame, "back");    // behind characters
drawCharacters();          // game sprites
fx.draw(frame, "front");
composite(frame, img.data, background);   // color over background plus additive light; null for transparent
ctx.putImageData(img, 0, 0);              // scale up with image-rendering: pixelated
if (fx.done()) removeIt();               // one-shots end on their own; fx.stop() fades a loop out
```

**Sprite sheet export (for external engines or static baking):**
```bash
node .agents/skills/pixelfx/scripts/render.mjs ice/frost-nova --sheet
node .agents/skills/pixelfx/scripts/sheets.mjs <category>
```
Writes a transparent PNG grid and Aseprite-style JSON (`meta.pixelfx` holds `fps`, `loop`, `frameSize`, `columns`, `pivot`, and `act` timing).

**A hit needs a body behind it.** Effects with a character carry an `act` (wind-up, release pose, hit-stop freeze, target reaction, recovery):
- With the stock character: `createAct(slash, { x, y })`, call `act.update(dt)` / `act.draw(frame)`, apply `act.shake`, or export via `node .agents/skills/pixelfx/scripts/act.mjs <id> --sheet`.
- With PixTel's own characters: read `slash.act` timing (`windup`, `recovery`, `hits` with `t` and `freeze`), play wind-up ahead of the effect, and apply host-side hit-stop freeze at each hit.

## 3. Make a new one

Read [references/AUTHORING.md](./references/AUTHORING.md) first: it defines the contract (`meta`, `draw(p, t, o)` for pure effects or `create(o)` for simulated ones, local coordinates, seamless loops, ending empty), the toolkit, the painter API, and the quality bar. Then follow the draft → render → look → refine loop:

1. **Say it in one line** with art direction: what it is, how it moves, its palette, its timing. *"A frost nova: crystals erupt in a ring from the feet outward, a white flash at the center, shards spin off, the floor stays frosted and fades."*
2. **Find references** in the library: `node .agents/skills/pixelfx/scripts/list.mjs <words>`, then read 2–3 closest effect files and borrow their techniques (`Particles` and `Bits` in `src/vfx/pixelfx/core/sim.js` for sparks, smoke and debris, `p.disc` for translucent volumes, `cycle` for seamless particles, `tileFbm` scrolls for flames and water).
3. **Draft.** Scaffold a working file:
   ```bash
   node .agents/skills/pixelfx/scripts/new.mjs <category>/<name>        # one-shot (e.g. pixtel/my-skill)
   node .agents/skills/pixelfx/scripts/new.mjs <category>/<name> --loop # seamless loop
   ```
   When direction is open, write 3–5 genuinely different drafts (`<name>-a.js` .. `-e.js`), render them all, compare side by side (`node .agents/skills/pixelfx/scripts/compare.mjs "<category>/<name>-*"`), and look at every contact sheet before choosing. Use `--gif` to share animated previews.
4. **Look, judge, fix.** Render (`node .agents/skills/pixelfx/scripts/render.mjs <id>`), open `records/<id>/contact.png`, and judge like a picky pixel artist. Fix the worst thing, render again. Three rounds minimum; a showpiece takes more. `--all` shows every frame; `--mp4` shows motion at full speed.
5. **Act it out** if a character is involved: add `export const act` (see "Acts" in [references/AUTHORING.md](./references/AUTHORING.md)), then render consecutive 12 fps steps with `node .agents/skills/pixelfx/scripts/act.mjs <id>` (or `--mp4`).
6. **Check.** Validate cleanly before keeping:
   ```bash
   node .agents/skills/pixelfx/scripts/check.mjs <id>
   ```
   Catches drawing outside canvas bounds, one-shots that don't end empty, loop seams, 4-step palette holes, unseeded randomness (`Math.random`), slow frames, and invalid `act` keys. Fix until it passes clean, delete unused drafts, and delete temporary preview renders in `records/` when done.

### Visual Critique & Usual Fixes

| What you see | Fix |
|---|---|
| Reads as mush at 1x | Fewer colors, a clear silhouette, one focal point, bigger shapes |
| Speckle: lone noise pixels inside shapes | Threshold noise less, quantize with `at()`, no noise on small shapes |
| Floaty, no punch | Fast in, slow out (`ease.outQuart`/`outExpo`), 1–2 frame white hero frame, shorter total time |
| Stiff or mechanical | Vary every particle (size, speed, delay, life), add secondary motion (sparks, smoke, debris) |
| Washed out | Less glow (`k` 0.2–0.5), darker edge steps, keep white for the hottest core only |
| Flat | Light from one side: brighter top-left, darker bottom-right step; darker ramp step at the base |
| Smooth gradients, vector look | Hard ramp steps in color; softness only in `light` and in translucent smoke |
| Checkerboard where smoke should be | `SMOKE`, `VAPOUR` or `DUST` particles, or `p.disc`: truly translucent, lit on top |
| Seam when a loop wraps | `cycle`, `loopNoise(phase)`, whole-cell `tileNoise` scrolls, `sin(phase * TAU * n)` |
| One-shot that pops off | Let it shrink, dither out or fall away before `t = duration` |
| Great effect on a dead character | Give it an `act`: wind-up, release pose, freeze on contact, target reaction, recovery |
| Act feels weightless | Wind-up opposite the blow, longer freeze (up to 0.2 s), bigger silhouette change, shake |
| Hit lands out of sync | Move the hit key to the effect's own constant, not an eyeballed time |
| Bad weapon grip | Bend in elbow, shafts in front of chest; blade lags hand on swing; arms reach ~15 px so step body in |
| Crossed arms / flat pose | Three-quarter view: near hand left (`fx < 0`), far hand right, `turn: 1`; `yaw` turns the body |

Directional effects face right, ground effects stand on `y = 0`, actor effects wrap `o.actor` (a 24×38 stock character's mask and pixels), and nothing uses `Math.random`. Generic motifs are fine; never recreate a specific game's sprites, characters, or logos.

## 4. Native code instead of JS

If targeting a non-JS engine where sprite sheets aren't enough (moving targets or runtime per-instance colors), port the effect while preserving the two-buffer (`color` + `light`) model, 4×4 Bayer dithered alpha, palette ramp lookups, and `src/vfx/pixelfx/core/sim.js` particle stepping. Render the JS original and port side by side to verify parity.
