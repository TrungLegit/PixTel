# Project Brain Index
*Generated: 2026-11-25T05:02:38.032250+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt** — Chiến đấu thời gian thực, đánh thức các **Trụ Sắc Màu**, khôi phục bảng màu 16-bit cho vùng đất bị **Nhiễu Trắng** và đánh bại **The Eraser**.

## Main Modules
- **src/** (135 files)
- **(root)/** (12 files)
- **.agents/** (4 files)
- **.github/** (1 files)

## Central Nodes
- `file:src/vfx/pixelfx/core/index.js` (file, 98 links): pixelfx core: everything an effect imports comes from here.
- `file:src/vfx/pixelfx/core/color.js` (file, 13 links): Colors are 32-bit integers laid out like ImageData bytes (R, G, B, A in memory),
- `file:src/vfx/pixelfx/core/math.js` (file, 10 links): Numbers, easing, randomness and noise. Everything here is pure and deterministic,
- `file:src/vfx/pixelfx/fx/pickups/_lib.js` (file, 10 links): Helpers for the pickups: a scratch layer to build outlined sprites in, floor shadows, twinkles and bobs.
- `file:src/vfx/pixelfx/core/fx.js` (file, 7 links): Frames and live effect instances.
- `file:src/vfx/pixelfx/fx/projectiles/_lib.js` (file, 7 links): Shared by the projectile effects: a steady emitter for loops, motion in a projectile's own frame, soft smoke
- `file:src/vfx/pixelfx/core/act.js` (file, 6 links): An act: an effect performed. The character winds up, lets go and recovers, a target takes the hit, and everything
- `file:src/vfx/pixelfx/fx/impacts/_lib.js` (file, 6 links): Shared by the impacts: the hit star, a ring that breaks into flying arcs, floor cracks that glow and cool,
- `file:src/vfx/pixelfx/core/actor.js` (file, 5 links): A stock character to try effects on: status effects wrap its silhouette, hits land on it, auras sit
- `file:src/vfx/pixelfx/core/font.js` (file, 5 links): Two pixel fonts: "mini" (3x5) for small numbers and tags, "big" (5x7) for words like LEVEL UP.

## Recent Decisions
- **PIXTEL v2 Open-World Vite + TypeScript Architecture** (`decision:20261125042128-pixtel-v2-openworld-vite`): Upgraded PIXTEL from v1 single-arena JS into a modular Vite + TypeScript 160x160 seamless open-world RPG with Origin Town, 4 Biomes, 9 Chroma Waypoints with Fast Travel, camps/chests/mining, 4 classes with hold-charge & Stamina wheel, 5-rarity loot beams, +0..+10 Forge, 10 quests
- **Hybrid pixelfx rendering + Pixelify Sans UI** (`decision:20261125032449-hybrid-pixelfx-rendering`): Combines live two-buffer pixelfx (dynamic beams, slashes, color waves) with pre-baked pixelfx atlas pooling (60FPS); uses Pixelify Sans for crisp Vietnamese pixel UI.

## Stale Files (Need Re-reading)
- `file:.github/copilot-instructions.md` (.github/copilot-instructions.md)
- `file:AGENTS.md` (AGENTS.md)
- `file:GEMINI.md` (GEMINI.md)
- `file:index.html` (index.html)
- `file:package-lock.json` (package-lock.json)
- `file:package.json` (package.json)
- `file:src/audio/chiptuneSynth.ts` (src/audio/chiptuneSynth.ts)
- `file:src/data/classes.ts` (src/data/classes.ts)
- `file:src/data/enemies.ts` (src/data/enemies.ts)
- `file:src/data/items.ts` (src/data/items.ts)
- `file:src/data/quests.ts` (src/data/quests.ts)
- `file:src/data/recipes.ts` (src/data/recipes.ts)
- `file:src/data/types.ts` (src/data/types.ts)
- `file:src/data/worldConfig.ts` (src/data/worldConfig.ts)
- `file:src/game.ts` (src/game.ts)
- `file:src/graphics/colorRestoration.ts` (src/graphics/colorRestoration.ts)
- `file:src/graphics/pixelSprites.ts` (src/graphics/pixelSprites.ts)
- `file:src/graphics/tileRenderer.ts` (src/graphics/tileRenderer.ts)
- `file:src/main.ts` (src/main.ts)
- `file:src/systems/combat.ts` (src/systems/combat.ts)
- `file:src/systems/forgeSystem.ts` (src/systems/forgeSystem.ts)
- `file:src/systems/inventorySystem.ts` (src/systems/inventorySystem.ts)
- `file:src/systems/questSystem.ts` (src/systems/questSystem.ts)
- `file:src/systems/saveSystem.ts` (src/systems/saveSystem.ts)
- `file:src/ui/ClassSelect.ts` (src/ui/ClassSelect.ts)
- `file:src/ui/DialogueModal.ts` (src/ui/DialogueModal.ts)
- `file:src/ui/ForgeModal.ts` (src/ui/ForgeModal.ts)
- `file:src/ui/HUD.ts` (src/ui/HUD.ts)
- `file:src/ui/InventoryModal.ts` (src/ui/InventoryModal.ts)
- `file:src/ui/QuestJournalModal.ts` (src/ui/QuestJournalModal.ts)
- `file:src/ui/WorldMapModal.ts` (src/ui/WorldMapModal.ts)
- `file:src/vfx/fxAtlas.ts` (src/vfx/fxAtlas.ts)
- `file:src/vfx/pixelfx/fx/pixtel/boss-telegraph.js` (src/vfx/pixelfx/fx/pixtel/boss-telegraph.js)
- `file:src/vfx/pixelfx/fx/pixtel/chroma-vortex.js` (src/vfx/pixelfx/fx/pixtel/chroma-vortex.js)
- `file:src/vfx/pixelfx/fx/pixtel/color-wave.js` (src/vfx/pixelfx/fx/pixtel/color-wave.js)
- `file:src/vfx/pixelfx/fx/pixtel/compile-turret.js` (src/vfx/pixelfx/fx/pixtel/compile-turret.js)
- `file:src/vfx/pixelfx/fx/pixtel/frame-skip.js` (src/vfx/pixelfx/fx/pixtel/frame-skip.js)
- `file:src/vfx/pixelfx/fx/pixtel/overdrive-aura.js` (src/vfx/pixelfx/fx/pixtel/overdrive-aura.js)
- `file:src/vfx/pixelfx/fx/pixtel/prism-beam.js` (src/vfx/pixelfx/fx/pixtel/prism-beam.js)
- `file:src/vfx/pixelfx/fx/pixtel/prism-storm.js` (src/vfx/pixelfx/fx/pixtel/prism-storm.js)
- `file:src/vfx/pixelfxTypes.ts` (src/vfx/pixelfxTypes.ts)
- `file:src/vfx/vfxManager.ts` (src/vfx/vfxManager.ts)
- `file:src/world/entities.ts` (src/world/entities.ts)
- `file:src/world/interactables.ts` (src/world/interactables.ts)
- `file:src/world/spawner.ts` (src/world/spawner.ts)
- `file:src/world/worldMap.ts` (src/world/worldMap.ts)
- `file:style.css` (style.css)
- `file:tsconfig.json` (tsconfig.json)
- `file:vite.config.ts` (vite.config.ts)

## Nodes Needing Summary
- `file:package-lock.json` (package-lock.json)
- `file:src/audio/chiptuneSynth.ts` (src/audio/chiptuneSynth.ts)
- `file:src/data/classes.ts` (src/data/classes.ts)
- `file:src/data/enemies.ts` (src/data/enemies.ts)
- `file:src/data/items.ts` (src/data/items.ts)
- `file:src/data/quests.ts` (src/data/quests.ts)
- `file:src/data/recipes.ts` (src/data/recipes.ts)
- `file:src/data/types.ts` (src/data/types.ts)
- `file:src/data/worldConfig.ts` (src/data/worldConfig.ts)
- `file:src/game.ts` (src/game.ts)
- `file:src/graphics/colorRestoration.ts` (src/graphics/colorRestoration.ts)
- `file:src/graphics/pixelSprites.ts` (src/graphics/pixelSprites.ts)
- `file:src/graphics/tileRenderer.ts` (src/graphics/tileRenderer.ts)
- `file:src/main.ts` (src/main.ts)
- `file:src/systems/combat.ts` (src/systems/combat.ts)
- `file:src/systems/forgeSystem.ts` (src/systems/forgeSystem.ts)
- `file:src/systems/inventorySystem.ts` (src/systems/inventorySystem.ts)
- `file:src/systems/questSystem.ts` (src/systems/questSystem.ts)
- `file:src/systems/saveSystem.ts` (src/systems/saveSystem.ts)
- `file:src/ui/ClassSelect.ts` (src/ui/ClassSelect.ts)
- `file:src/ui/DialogueModal.ts` (src/ui/DialogueModal.ts)
- `file:src/ui/ForgeModal.ts` (src/ui/ForgeModal.ts)
- `file:src/ui/HUD.ts` (src/ui/HUD.ts)
- `file:src/ui/InventoryModal.ts` (src/ui/InventoryModal.ts)
- `file:src/ui/QuestJournalModal.ts` (src/ui/QuestJournalModal.ts)
- `file:src/ui/WorldMapModal.ts` (src/ui/WorldMapModal.ts)
- `file:src/vfx/fxAtlas.ts` (src/vfx/fxAtlas.ts)
- `file:src/vfx/pixelfx/fx/explosions/dirt-explosion.js` (src/vfx/pixelfx/fx/explosions/dirt-explosion.js)
- `file:src/vfx/pixelfx/fx/holy/holy-pillar.js` (src/vfx/pixelfx/fx/holy/holy-pillar.js)
- `file:src/vfx/pixelfx/fx/impacts/bullet-impact.js` (src/vfx/pixelfx/fx/impacts/bullet-impact.js)
- `file:src/vfx/pixelfx/fx/impacts/parry.js` (src/vfx/pixelfx/fx/impacts/parry.js)
- `file:src/vfx/pixelfx/fx/melee/double-slash.js` (src/vfx/pixelfx/fx/melee/double-slash.js)
- `file:src/vfx/pixelfx/fx/melee/heavy-cleave.js` (src/vfx/pixelfx/fx/melee/heavy-cleave.js)
- `file:src/vfx/pixelfx/fx/melee/thrust.js` (src/vfx/pixelfx/fx/melee/thrust.js)
- `file:src/vfx/pixelfx/fx/pickups/chest-open.js` (src/vfx/pixelfx/fx/pickups/chest-open.js)
- `file:src/vfx/pixelfx/fx/pickups/coin-spin.js` (src/vfx/pixelfx/fx/pickups/coin-spin.js)
