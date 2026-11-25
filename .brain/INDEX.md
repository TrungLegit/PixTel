# Project Brain Index
*Generated: 2026-11-25T09:06:05.798407+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt** — Chiến đấu thời gian thực, đánh thức các **Trụ Sắc Màu**, khôi phục bảng màu 16-bit cho vùng đất bị **Nhiễu Trắng** và đánh bại **The Eraser**.

## Main Modules
- **src/** (140 files)
- **(root)/** (12 files)
- **.agents/** (4 files)
- **.github/** (1 files)
- **tests/** (1 files)

## Central Nodes
- `file:src/game.ts` (file, 47 links): Main 60FPS game loop wiring [F] Lore Tablet decoding, [1]-[4] hotkeys, Ground Fields, Overhead Statuses, Orbiting Grimoire, and SaveDataV2.
- `file:src/data/types.ts` (file, 36 links): Core TypeScript schemas for PIXTEL v2.5: 5-element Chroma types, LoreTabletDef, BleachShield, Pity/Infusion ItemInstance, Archetype passives, and SaveDataV2.
- `file:src/systems/combat.ts` (file, 28 links): 60FPS Combat Engine: 4-Class 3-step combos, Dash-Offset, Chroma Dodge, Just-Charge/Parry, 7 Chroma Reactions, Bleach Shield break, 4 Boss AIs & Eraser Totems.
- `file:src/data/items.ts` (file, 22 links): Unified catalog of consumables ([1]-[4] incl. Chroma Coating & Undying Charm), 4 Chroma Pigments, 4 Boss Cores, materials, and +3/+5/+7/+10 milestone stat scaling.
- `file:src/data/worldConfig.ts` (file, 20 links): 160x160 world layout with Origin Town NPCs/dialogues, 9 Chroma Waypoints, camps (incl. Meadow Boss Arena), mining nodes, and chests.
- `file:src/graphics/pixelSprites.ts` (file, 15 links): Procedural 16-bit sprites for heroes, mobs, 4 Bosses (incl. 32x32 Xing Warden), Lore Tablets (unread/read), and Arena Chroma Totems.
- `file:src/main.ts` (file, 14 links): Browser entry point mounting integer-scaled 480x270 Canvas, Title Screen lore prologue subtitle, Class Select, and OpenWorldGame.
- `file:src/systems/forgeSystem.ts` (file, 14 links): Prism Forge +0..+10 safe enhancement with +20%/+25% Pity failstack, +15% Prism Catalyst, +5 Chroma Pigment Elemental Infusion, and 20 recipes.
- `file:src/world/entities.ts` (file, 14 links): Runtime entities for Player (Chroma Dodge/Combo/Quick-Charge/Passives), Enemies (Bleach Shield/Stagger/ICD/Root), ArenaTotemEntity, and Elemental Ground Hazards.
- `file:src/world/spawner.ts` (file, 13 links): Spawns enemies, Bosses with Bleach Shields, Arena Chroma Totems for The Eraser, mining nodes, Waypoint chests, and bouncing GroundLoot.

## Recent Decisions
- **PIXTEL v2.5 Aethel-16 Lore Codex, 7 Chroma Reactions, 4 Bosses & Prism Forge Pity/Infusion** (`decision:20261125090604-pixtel-v25-aethel16-lore`): Implemented Aethel-16 storyline (8 Lore Tablets, 5-Act 10-Quest campaign), Chroma Dodge/Dash-Offset/Just-Charge, 5-Element 7-Reaction matrix, Xing Warden + Bleach Shield + 3-Phase Eraser Totems, safe +0..+10 Forge Pity/+5 Pigment Infusion, and 6-suite featureTests.
- **Loot Tables, Bounce Pickup, Waypoint Chests & 15 Forge Blueprints** (`decision:20261125060517-loot-tables-bounce-pickup`): Connected 5-slot equipment into gameplay loop via ENEMY_DROP_TABLES, pixel-bounce + magnetic auto-pickup loot, unlocked Chroma Chests at activated Waypoints, and 15 Prism Forge recipes for Helmets/Armors/Weapons/Boots/Accessories.
- **Layered Paper-Doll Pixel Rendering** (`decision:20261125060051-layered-paperdoll-pixel-rendering`): Implemented Base Body -> Boots -> Armor -> Helmet -> Weapon layered sprite rendering driven by ItemDef.visualStyle, synced with 4 directions, idle/run/attack/charge/dash states, Bleached desaturation, and pixelfx aura on Epic/Legendary/+7+ weapons.
- **5-Slot Equipment & 16-Bit Inventory UI** (`decision:20261125055356-5slot-equipment-16bit`): Expanded EquipSlot to 5 slots (helmet, armor, weapon, boots, accessory) with 25+ biome equipments, rarity-weighted +0..+10 scaling, recalculatePlayerStats(), dismantle to Prism Shards, [I/B] 16-bit Inventory UI with 4x gear-aware hero preview, and chiptune gear SFX.
- **PIXTEL v2 Open-World Vite + TypeScript Architecture** (`decision:20261125042128-pixtel-v2-openworld-vite`): Upgraded PIXTEL from v1 single-arena JS into a modular Vite + TypeScript 160x160 seamless open-world RPG with Origin Town, 4 Biomes, 9 Chroma Waypoints with Fast Travel, camps/chests/mining, 4 classes with hold-charge & Stamina wheel, 5-rarity loot beams, +0..+10 Forge, 10 quests

## Stale Files (Need Re-reading)
- `file:.agents/skills/project-brain/SKILL.md` (.agents/skills/project-brain/SKILL.md)
- `file:.agents/skills/project-brain/assets/agent-block.md` (.agents/skills/project-brain/assets/agent-block.md)
- `file:.agents/skills/project-brain/assets/viewer.html` (.agents/skills/project-brain/assets/viewer.html)
- `file:.agents/skills/project-brain/scripts/brain.py` (.agents/skills/project-brain/scripts/brain.py)
- `file:.github/copilot-instructions.md` (.github/copilot-instructions.md)
- `file:.gitignore` (.gitignore)
- `file:AGENTS.md` (AGENTS.md)
- `file:GEMINI.md` (GEMINI.md)
- `file:LICENSE` (LICENSE)
- `file:package-lock.json` (package-lock.json)
- `file:src/audio/chiptuneSynth.ts` (src/audio/chiptuneSynth.ts)
- `file:src/data/classes.ts` (src/data/classes.ts)
- `file:src/graphics/colorRestoration.ts` (src/graphics/colorRestoration.ts)
- `file:src/graphics/tileRenderer.ts` (src/graphics/tileRenderer.ts)
- `file:src/systems/questSystem.ts` (src/systems/questSystem.ts)
- `file:src/systems/saveSystem.ts` (src/systems/saveSystem.ts)
- `file:src/ui/ClassSelect.ts` (src/ui/ClassSelect.ts)
- `file:src/ui/DialogueModal.ts` (src/ui/DialogueModal.ts)
- `file:src/ui/WorldMapModal.ts` (src/ui/WorldMapModal.ts)
- `file:src/vfx/fxAtlas.ts` (src/vfx/fxAtlas.ts)
- `file:src/vfx/pixelfx/core/act.js` (src/vfx/pixelfx/core/act.js)
- `file:src/vfx/pixelfx/core/actor.js` (src/vfx/pixelfx/core/actor.js)
- `file:src/vfx/pixelfx/core/chain.js` (src/vfx/pixelfx/core/chain.js)
- `file:src/vfx/pixelfx/core/color.js` (src/vfx/pixelfx/core/color.js)
- `file:src/vfx/pixelfx/core/font.js` (src/vfx/pixelfx/core/font.js)
- `file:src/vfx/pixelfx/core/fx.js` (src/vfx/pixelfx/core/fx.js)
- `file:src/vfx/pixelfx/core/index.js` (src/vfx/pixelfx/core/index.js)
- `file:src/vfx/pixelfx/core/math.js` (src/vfx/pixelfx/core/math.js)
- `file:src/vfx/pixelfx/core/painter.js` (src/vfx/pixelfx/core/painter.js)
- `file:src/vfx/pixelfx/core/particles.js` (src/vfx/pixelfx/core/particles.js)
- `file:src/vfx/pixelfx/core/poses.js` (src/vfx/pixelfx/core/poses.js)
- `file:src/vfx/pixelfx/core/rig.js` (src/vfx/pixelfx/core/rig.js)
- `file:src/vfx/pixelfx/core/scene.js` (src/vfx/pixelfx/core/scene.js)
- `file:src/vfx/pixelfx/core/shapes.js` (src/vfx/pixelfx/core/shapes.js)
- `file:src/vfx/pixelfx/core/sim.js` (src/vfx/pixelfx/core/sim.js)
- `file:src/vfx/pixelfx/fx/arcane/_lib.js` (src/vfx/pixelfx/fx/arcane/_lib.js)
- `file:src/vfx/pixelfx/fx/arcane/arcane-missiles.js` (src/vfx/pixelfx/fx/arcane/arcane-missiles.js)
- `file:src/vfx/pixelfx/fx/arcane/star-fall.js` (src/vfx/pixelfx/fx/arcane/star-fall.js)
- `file:src/vfx/pixelfx/fx/explosions/_lib.js` (src/vfx/pixelfx/fx/explosions/_lib.js)
- `file:src/vfx/pixelfx/fx/explosions/dirt-explosion.js` (src/vfx/pixelfx/fx/explosions/dirt-explosion.js)
- `file:src/vfx/pixelfx/fx/explosions/plasma-explosion.js` (src/vfx/pixelfx/fx/explosions/plasma-explosion.js)
- `file:src/vfx/pixelfx/fx/explosions/small-explosion.js` (src/vfx/pixelfx/fx/explosions/small-explosion.js)
- `file:src/vfx/pixelfx/fx/fire/_lib.js` (src/vfx/pixelfx/fx/fire/_lib.js)
- `file:src/vfx/pixelfx/fx/fire/fireball.js` (src/vfx/pixelfx/fx/fire/fireball.js)
- `file:src/vfx/pixelfx/fx/holy/_lib.js` (src/vfx/pixelfx/fx/holy/_lib.js)
- `file:src/vfx/pixelfx/fx/holy/heal-aoe.js` (src/vfx/pixelfx/fx/holy/heal-aoe.js)
- `file:src/vfx/pixelfx/fx/holy/heal.js` (src/vfx/pixelfx/fx/holy/heal.js)
- `file:src/vfx/pixelfx/fx/holy/holy-pillar.js` (src/vfx/pixelfx/fx/holy/holy-pillar.js)
- `file:src/vfx/pixelfx/fx/holy/smite.js` (src/vfx/pixelfx/fx/holy/smite.js)
- `file:src/vfx/pixelfx/fx/ice/_lib.js` (src/vfx/pixelfx/fx/ice/_lib.js)
