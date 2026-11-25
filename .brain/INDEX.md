# Project Brain Index
*Generated: 2026-11-25T06:05:17.701643+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt** — Chiến đấu thời gian thực, đánh thức các **Trụ Sắc Màu**, khôi phục bảng màu 16-bit cho vùng đất bị **Nhiễu Trắng** và đánh bại **The Eraser**.

## Main Modules
- **src/** (139 files)
- **(root)/** (12 files)
- **.agents/** (4 files)
- **.github/** (1 files)

## Central Nodes
- `file:src/vfx/pixelfx/core/index.js` (file, 98 links): pixelfx core: everything an effect imports comes from here.
- `file:src/game.ts` (file, 44 links): Central 480x270 game loop with Paper-Doll hero, magnetic auto-pickup loot, Waypoint Chroma Chests, and pixelfx weapon aura.
- `file:src/data/types.ts` (file, 28 links): Expanded EquipSlot, StatBonus, ItemIconKind, and EquipVisualStyle/EquipVisualShape definitions.
- `file:src/systems/combat.ts` (file, 23 links): Combat engine using rollEnemyDropTable on kills, 4-dir facingDir, attackAnimTime, and elementBonus scaling.
- `file:src/data/items.ts` (file, 16 links): Unified item catalog combining consumables, mat_prism_shard, materials, and EQUIPMENT_ITEMS with rarity-weighted +0..+10 scaling and dismantle yield.
- `file:src/graphics/pixelSprites.ts` (file, 14 links): Procedural 16-bit sprite atlas with pre-compiled bleachedRight/bleachedLeft canvases for unrestored world zones.
- `file:src/vfx/pixelfx/core/color.js` (file, 13 links): Colors are 32-bit integers laid out like ImageData bytes (R, G, B, A in memory),
- `file:src/world/entities.ts` (file, 11 links): Runtime entities including GroundLootEntity bounce kinematics (vx, vy, z, vz) and PlayerEntity facingDir/attackAnimTime/elementBonus.
- `file:src/ui/ForgeModal.ts` (file, 11 links): Prism Forge modal with 16x16 pixel item icons, SPD/ELEM stat previews, +0..+10 enhance, and 15 craft blueprints.
- `file:src/world/spawner.ts` (file, 11 links): World spawner with pixel-bounce GroundLoot physics, Waypoint Chroma Chest spawning/persistence, and camp chest rewards.

## Recent Decisions
- **Loot Tables, Bounce Pickup, Waypoint Chests & 15 Forge Blueprints** (`decision:20261125060517-loot-tables-bounce-pickup`): Connected 5-slot equipment into gameplay loop via ENEMY_DROP_TABLES, pixel-bounce + magnetic auto-pickup loot, unlocked Chroma Chests at activated Waypoints, and 15 Prism Forge recipes for Helmets/Armors/Weapons/Boots/Accessories.
- **Layered Paper-Doll Pixel Rendering** (`decision:20261125060051-layered-paperdoll-pixel-rendering`): Implemented Base Body -> Boots -> Armor -> Helmet -> Weapon layered sprite rendering driven by ItemDef.visualStyle, synced with 4 directions, idle/run/attack/charge/dash states, Bleached desaturation, and pixelfx aura on Epic/Legendary/+7+ weapons.
- **5-Slot Equipment & 16-Bit Inventory UI** (`decision:20261125055356-5slot-equipment-16bit`): Expanded EquipSlot to 5 slots (helmet, armor, weapon, boots, accessory) with 25+ biome equipments, rarity-weighted +0..+10 scaling, recalculatePlayerStats(), dismantle to Prism Shards, [I/B] 16-bit Inventory UI with 4x gear-aware hero preview, and chiptune gear SFX.
- **PIXTEL v2 Open-World Vite + TypeScript Architecture** (`decision:20261125042128-pixtel-v2-openworld-vite`): Upgraded PIXTEL from v1 single-arena JS into a modular Vite + TypeScript 160x160 seamless open-world RPG with Origin Town, 4 Biomes, 9 Chroma Waypoints with Fast Travel, camps/chests/mining, 4 classes with hold-charge & Stamina wheel, 5-rarity loot beams, +0..+10 Forge, 10 quests
- **Hybrid pixelfx rendering + Pixelify Sans UI** (`decision:20261125032449-hybrid-pixelfx-rendering`): Combines live two-buffer pixelfx (dynamic beams, slashes, color waves) with pre-baked pixelfx atlas pooling (60FPS); uses Pixelify Sans for crisp Vietnamese pixel UI.

## Stale Files (Need Re-reading)
- `file:.github/copilot-instructions.md` (.github/copilot-instructions.md)
- `file:AGENTS.md` (AGENTS.md)
- `file:GEMINI.md` (GEMINI.md)
- `file:package-lock.json` (package-lock.json)
- `file:package.json` (package.json)
- `file:src/data/classes.ts` (src/data/classes.ts)
- `file:src/data/enemies.ts` (src/data/enemies.ts)
- `file:src/data/quests.ts` (src/data/quests.ts)
- `file:src/data/worldConfig.ts` (src/data/worldConfig.ts)
- `file:src/graphics/colorRestoration.ts` (src/graphics/colorRestoration.ts)
- `file:src/graphics/tileRenderer.ts` (src/graphics/tileRenderer.ts)
- `file:src/main.ts` (src/main.ts)
- `file:src/systems/forgeSystem.ts` (src/systems/forgeSystem.ts)
- `file:src/systems/questSystem.ts` (src/systems/questSystem.ts)
- `file:src/systems/saveSystem.ts` (src/systems/saveSystem.ts)
- `file:src/ui/ClassSelect.ts` (src/ui/ClassSelect.ts)
- `file:src/ui/DialogueModal.ts` (src/ui/DialogueModal.ts)
- `file:src/ui/HUD.ts` (src/ui/HUD.ts)
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
- `file:src/world/interactables.ts` (src/world/interactables.ts)
- `file:src/world/worldMap.ts` (src/world/worldMap.ts)
- `file:tsconfig.json` (tsconfig.json)
- `file:vite.config.ts` (vite.config.ts)

## Nodes Needing Summary
- `file:package-lock.json` (package-lock.json)
- `file:src/data/classes.ts` (src/data/classes.ts)
- `file:src/data/enemies.ts` (src/data/enemies.ts)
- `file:src/data/quests.ts` (src/data/quests.ts)
- `file:src/data/worldConfig.ts` (src/data/worldConfig.ts)
- `file:src/graphics/colorRestoration.ts` (src/graphics/colorRestoration.ts)
- `file:src/graphics/tileRenderer.ts` (src/graphics/tileRenderer.ts)
- `file:src/main.ts` (src/main.ts)
- `file:src/systems/forgeSystem.ts` (src/systems/forgeSystem.ts)
- `file:src/systems/questSystem.ts` (src/systems/questSystem.ts)
- `file:src/systems/saveSystem.ts` (src/systems/saveSystem.ts)
- `file:src/ui/ClassSelect.ts` (src/ui/ClassSelect.ts)
- `file:src/ui/DialogueModal.ts` (src/ui/DialogueModal.ts)
- `file:src/ui/HUD.ts` (src/ui/HUD.ts)
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
- `file:src/vfx/pixelfx/fx/pickups/crystal-shard.js` (src/vfx/pixelfx/fx/pickups/crystal-shard.js)
