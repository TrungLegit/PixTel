# Project Brain Index
*Generated: 2026-11-25T08:05:13.931198+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt** — Chiến đấu thời gian thực, đánh thức các **Trụ Sắc Màu**, khôi phục bảng màu 16-bit cho vùng đất bị **Nhiễu Trắng** và đánh bại **The Eraser**.

## Main Modules
- **src/** (147 files)
- **(root)/** (12 files)
- **.agents/** (4 files)
- **.github/** (1 files)
- **scripts/** (1 files)

## Central Nodes
- `file:src/vfx/pixelfx/core/index.js` (file, 98 links): pixelfx core: everything an effect imports comes from here.
- `file:src/vfx/vfxManager.ts` (file, 71 links): Registered pixtel/rarity-aura, item-aura-rare/epic/legendary, and collect-burst-rare/epic/legendary presets and eager atlas warmup.
- `file:src/game.ts` (file, 51 links): Upgraded Open-World ground loot rendering with 16x16 rarity pedestals, 12x12 codixel floor icons, orbiting pixelfx rarity auras, and rarity-matched pickup bursts.
- `file:src/data/types.ts` (file, 32 links): Added ItemTier (1..5), ConsumableGroup, ConsumableSpec, spriteKey, paperDollKey, and capeKey to ItemDef.
- `file:src/systems/combat.ts` (file, 24 links): Integrated atkBuffPct, atkBuffCrit, defBuffPct, and aegisTime mitigation + cyan barrier hit sparks.
- `file:src/data/items.ts` (file, 20 links): 12 Multi-Tier consumables (T1..T5) across hp/stamina/power/aegis groups, 6 tiered materials, CONSUMABLE_HOTKEY_GROUPS, and expanded Merchant Mira stock.
- `file:src/graphics/itemIcons.ts` (file, 16 links): Renders 24x24 codixel icons for items with matrix fallback and draws 4x equipped Paper-Doll Inventory preview.
- `file:src/main.ts` (file, 15 links): Installed procedural vintage rope CSS frame assets and mounted the global ItemReviewTooltip controller with auto-hide on modal transitions.
- `file:src/ui/ForgeModal.ts` (file, 15 links): Wired 32x32 pixelfx rarity slot canvases and data-review hover bindings on enhance items, craft cards, and crafting materials.
- `file:src/graphics/paperDoll.ts` (file, 15 links): 7-layer codixel Paper-Doll hero renderer (Cape/Wings, Body, Stride Boots, Armor, Helmet, Idle/Swing Weapon, Orbiting Accessory, Aegis Barrier) synced to 4 dirs and Bleached state.

## Recent Decisions
- **Pixelfx high-rarity auras & braided-rope hover review frame** (`decision:20261125080500-pixelfx-highrarity-auras`): Implemented deterministic two-buffer pixelfx rarity-aura VFX across world loot + UI slots and a procedural 96x96 braided hemp rope parchment tooltip with a 72x72 showcase pedestal.
- **5-Tier Item Progression & codixel Paper-Doll Atlas** (`decision:20261125071903-5tier-item-progression`): Built 64 24x24 codixel icons and 77 24x24 Paper-Doll overlays via codixel/core/pixel.js (hueRamp, P.band, rimLight, selout, P.Gem). Added full T1..T5 weapons per class, 2/4-pc Set Bonuses, 12 tiered consumables mapped to smart [1]-[4] hotkeys, and live 7-layer Paper-Doll hero vis
- **Loot Tables, Bounce Pickup, Waypoint Chests & 15 Forge Blueprints** (`decision:20261125060517-loot-tables-bounce-pickup`): Connected 5-slot equipment into gameplay loop via ENEMY_DROP_TABLES, pixel-bounce + magnetic auto-pickup loot, unlocked Chroma Chests at activated Waypoints, and 15 Prism Forge recipes for Helmets/Armors/Weapons/Boots/Accessories.
- **Layered Paper-Doll Pixel Rendering** (`decision:20261125060051-layered-paperdoll-pixel-rendering`): Implemented Base Body -> Boots -> Armor -> Helmet -> Weapon layered sprite rendering driven by ItemDef.visualStyle, synced with 4 directions, idle/run/attack/charge/dash states, Bleached desaturation, and pixelfx aura on Epic/Legendary/+7+ weapons.
- **5-Slot Equipment & 16-Bit Inventory UI** (`decision:20261125055356-5slot-equipment-16bit`): Expanded EquipSlot to 5 slots (helmet, armor, weapon, boots, accessory) with 25+ biome equipments, rarity-weighted +0..+10 scaling, recalculatePlayerStats(), dismantle to Prism Shards, [I/B] 16-bit Inventory UI with 4x gear-aware hero preview, and chiptune gear SFX.

## Stale Files (Need Re-reading)
- `file:.github/copilot-instructions.md` (.github/copilot-instructions.md)
- `file:.gitignore` (.gitignore)
- `file:AGENTS.md` (AGENTS.md)
- `file:GEMINI.md` (GEMINI.md)
- `file:README.md` (README.md)
- `file:package-lock.json` (package-lock.json)
- `file:package.json` (package.json)
- `file:src/data/classes.ts` (src/data/classes.ts)
- `file:src/data/enemies.ts` (src/data/enemies.ts)
- `file:src/data/quests.ts` (src/data/quests.ts)
- `file:src/data/worldConfig.ts` (src/data/worldConfig.ts)
- `file:src/graphics/colorRestoration.ts` (src/graphics/colorRestoration.ts)
- `file:src/graphics/tileRenderer.ts` (src/graphics/tileRenderer.ts)
- `file:src/systems/forgeSystem.ts` (src/systems/forgeSystem.ts)
- `file:src/systems/questSystem.ts` (src/systems/questSystem.ts)
- `file:src/systems/saveSystem.ts` (src/systems/saveSystem.ts)
- `file:src/ui/ClassSelect.ts` (src/ui/ClassSelect.ts)
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
- `file:src/world/interactables.ts` (src/world/interactables.ts)
- `file:src/world/spawner.ts` (src/world/spawner.ts)
- `file:src/world/worldMap.ts` (src/world/worldMap.ts)
- `file:tsconfig.json` (tsconfig.json)
- `file:vite.config.ts` (vite.config.ts)

## Nodes Needing Summary
- `file:README.md` (README.md)
- `file:package-lock.json` (package-lock.json)
- `file:src/data/classes.ts` (src/data/classes.ts)
- `file:src/data/enemies.ts` (src/data/enemies.ts)
- `file:src/data/quests.ts` (src/data/quests.ts)
- `file:src/data/worldConfig.ts` (src/data/worldConfig.ts)
- `file:src/graphics/colorRestoration.ts` (src/graphics/colorRestoration.ts)
- `file:src/graphics/tileRenderer.ts` (src/graphics/tileRenderer.ts)
- `file:src/systems/forgeSystem.ts` (src/systems/forgeSystem.ts)
- `file:src/systems/questSystem.ts` (src/systems/questSystem.ts)
- `file:src/systems/saveSystem.ts` (src/systems/saveSystem.ts)
- `file:src/ui/ClassSelect.ts` (src/ui/ClassSelect.ts)
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
