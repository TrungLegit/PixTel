# Project Brain Index
*Generated: 2026-11-25T04:21:46.699618+00:00*

## Description
"description": "PIXTEL — Open-World 16-Bit Top-Down Pixel Action RPG powered by Vite, TypeScript & pixelfx",

## Main Modules
- **src/** (135 files)
- **(root)/** (11 files)
- **.agents/** (4 files)
- **.github/** (1 files)

## Central Nodes
- `file:src/vfx/pixelfx/core/index.js` (file, 98 links): pixelfx core: everything an effect imports comes from here.
- `file:src/vfx/vfxManager.ts` (file, 67 links): Viewport-culled, object-pooled pixelfx VFX manager (26 live slots, 200 atlas slots, 64 rasterText popups, 180 pixel dots) covering combat, loot beams, chests, mining, waypoints, and forge sparks.
- `file:src/game.ts` (file, 40 links): Central 480x270 60FPS open-world game controller: camera culling, Y-sorted rendering, pixel Stamina wheel, loot beams, waypoint activation, Fast Travel, auto-save, and input routing.
- `file:src/data/types.ts` (file, 25 links): Core TypeScript interfaces for classes, biomes, items, recipes, quests, waypoints, camps, resources, enemies, and SaveDataV2.
- `file:src/systems/combat.ts` (file, 19 links): Real-time action combat system for 4 classes (combos, Hold-LMB charges, E/Q skills, elemental reactions, shield reflect, turrets/drone), resource mining, enemy patrol/aggro/leash AI, and 3 Boss fights.
- `file:src/data/worldConfig.ts` (file, 17 links): 160x160 seamless open-world config: Origin Town + 4 biomes (Bleached/Restored palettes), 3 NPCs, Class Altar, 9 Waypoints, 12 camps, and 20 resource nodes.
- `file:src/data/items.ts` (file, 14 links): 5-rarity equipment catalog (20 items across 4 slots), 5 materials, 3 hotkey consumables, merchant stock, and +0..+10 stat scaling helpers.
- `file:src/vfx/pixelfx/core/color.js` (file, 13 links): Colors are 32-bit integers laid out like ImageData bytes (R, G, B, A in memory),
- `file:src/main.ts` (file, 12 links): Application bootstrap wiring PixTelOpenWorldGame to all 7 pixel UI controllers, Pause, and World Boss Victory modals.
- `file:src/ui/ClassSelect.ts` (file, 11 links): Title, Continue Save, and Town Class Altar modal with animated 16x16 hero previews and live two-buffer pixelfx skill preview canvases.

## Recent Decisions
- **PIXTEL v2 Open-World Vite + TypeScript Architecture** (`decision:20261125042128-pixtel-v2-openworld-vite`): Upgraded PIXTEL from v1 single-arena JS into a modular Vite + TypeScript 160x160 seamless open-world RPG with Origin Town, 4 Biomes, 9 Chroma Waypoints with Fast Travel, camps/chests/mining, 4 classes with hold-charge & Stamina wheel, 5-rarity loot beams, +0..+10 Forge, 10 quests
- **Hybrid pixelfx rendering + Pixelify Sans UI** (`decision:20261125032449-hybrid-pixelfx-rendering`): Combines live two-buffer pixelfx (dynamic beams, slashes, color waves) with pre-baked pixelfx atlas pooling (60FPS); uses Pixelify Sans for crisp Vietnamese pixel UI.

## Stale Files (Need Re-reading)
- `file:.gitignore` (.gitignore)

## Nodes Needing Summary
- `file:package-lock.json` (package-lock.json)
- `file:src/vfx/pixelfx/fx/explosions/dirt-explosion.js` (src/vfx/pixelfx/fx/explosions/dirt-explosion.js)
- `file:src/vfx/pixelfx/fx/holy/holy-pillar.js` (src/vfx/pixelfx/fx/holy/holy-pillar.js)
- `file:src/vfx/pixelfx/fx/impacts/bullet-impact.js` (src/vfx/pixelfx/fx/impacts/bullet-impact.js)
- `file:src/vfx/pixelfx/fx/impacts/parry.js` (src/vfx/pixelfx/fx/impacts/parry.js)
- `file:src/vfx/pixelfx/fx/melee/double-slash.js` (src/vfx/pixelfx/fx/melee/double-slash.js)
- `file:src/vfx/pixelfx/fx/melee/heavy-cleave.js` (src/vfx/pixelfx/fx/melee/heavy-cleave.js)
- `file:src/vfx/pixelfx/fx/melee/thrust.js` (src/vfx/pixelfx/fx/melee/thrust.js)
- `file:src/vfx/pixelfx/fx/pickups/chest-open.js` (src/vfx/pixelfx/fx/pickups/chest-open.js)
- `file:src/vfx/pixelfx/fx/pickups/coin-spin.js` (src/vfx/pixelfx/fx/pickups/coin-spin.js)
- `file:src/vfx/pixelfx/fx/pickups/crystal-shard.js` (src/vfx/pixelfx/fx/pickups/crystal-shard.js)
- `file:src/vfx/pixelfx/fx/pickups/gem-spin.js` (src/vfx/pixelfx/fx/pickups/gem-spin.js)
- `file:src/vfx/pixelfx/fx/pickups/heart-pickup.js` (src/vfx/pixelfx/fx/pickups/heart-pickup.js)
- `file:src/vfx/pixelfx/fx/pickups/loot-beam.js` (src/vfx/pixelfx/fx/pickups/loot-beam.js)
- `file:src/vfx/pixelfx/fx/pickups/potion.js` (src/vfx/pixelfx/fx/pickups/potion.js)
- `file:src/vfx/pixelfx/fx/scifi/teleporter-pad.js` (src/vfx/pixelfx/fx/scifi/teleporter-pad.js)
- `file:.gitignore` (.gitignore)

## Open Tasks
- None.
