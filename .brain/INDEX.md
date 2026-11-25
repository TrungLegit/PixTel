# Project Brain Index
*Generated: 2026-11-25T09:24:53.389546+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt** — Chiến đấu thời gian thực, đánh thức các **Trụ Sắc Màu**, khôi phục bảng màu 16-bit cho vùng đất bị **Nhiễu Trắng** và đánh bại **The Eraser**.

## Main Modules
- **src/** (148 files)
- **(root)/** (12 files)
- **.agents/** (4 files)
- **.github/** (1 files)
- **scripts/** (1 files)

## Central Nodes
- `file:src/vfx/vfxManager.ts` (file, 71 links): Registered pixtel/rarity-aura, item-aura-rare/epic/legendary, and collect-burst-rare/epic/legendary presets and eager atlas warmup.
- `file:src/game.ts` (file, 54 links): Main 60FPS game loop wiring [F] Lore Tablet decoding, smart [1]-[4] hotkeys, Ground Fields, Rarity Auras, Overhead Statuses, Orbiting Grimoire, and SaveDataV2.
- `file:src/data/types.ts` (file, 39 links): Core TypeScript schemas for PIXTEL v2.5: 5-element Chroma types, LoreTabletDef, BleachShield, Pity/Infusion ItemInstance, Archetype passives, ConsumableSpec, and SaveDataV2.
- `file:src/systems/combat.ts` (file, 28 links): 60FPS Combat Engine: 4-Class 3-step combos, Dash-Offset, Chroma Dodge, Just-Charge/Parry, 7 Chroma Reactions, Bleach Shield break, 4 Boss AIs & Eraser Totems.
- `file:src/data/items.ts` (file, 26 links): Unified catalog of T1-T5 smart consumables (incl. Chroma Coating & Undying Charm), 4 Chroma Pigments, 4 Boss Cores, materials, and +3/+5/+7/+10 milestone scaling.
- `file:src/data/worldConfig.ts` (file, 20 links): 160x160 world layout with Origin Town NPCs/dialogues, 9 Chroma Waypoints, camps (incl. Meadow Boss Arena), mining nodes, and chests.
- `file:src/systems/inventorySystem.ts` (file, 17 links): 5-slot equipment & 32-slot bag manager with smart 1-4 consumable groups, Set Bonuses, passive extraction, dismantle, and stat recalculation.
- `file:src/graphics/itemIcons.ts` (file, 17 links): Codixel atlas + procedural 16x16 fallback pixel icons (incl. axe, amulet, book, disc, totem, pigment) and 4x Paper-Doll hero preview.
- `file:src/main.ts` (file, 16 links): Browser entry point mounting integer-scaled 480x270 Canvas, Title Screen lore prologue subtitle, ItemReviewTooltip, Class Select, and OpenWorldGame.
- `file:src/ui/ForgeModal.ts` (file, 16 links): Prism Forge UI displaying 32x32 codixel rarity icons, +0..+10 Pity bar, Prism Catalyst toggle, +3/+5/+7/+10 milestones, +5 Pigment Infusion, and 29 recipes.

## Recent Decisions
- **PIXTEL v2.5 Aethel-16 Lore Codex, 7 Chroma Reactions, 4 Bosses & Prism Forge Pity/Infusion** (`decision:20261125092451-pixtel-v25-aethel16-lore`): Implemented Aethel-16 storyline (8 Lore Tablets, 5-Act 10-Quest campaign), Chroma Dodge/Dash-Offset/Just-Charge, 5-Element 7-Reaction matrix, Xing Warden + Bleach Shield + 3-Phase Eraser Totems, safe +0..+10 Forge Pity/+5 Pigment Infusion, and 6-suite featureTests.
- **Pixelfx high-rarity auras & braided-rope hover review frame** (`decision:20261125080500-pixelfx-highrarity-auras`): Implemented deterministic two-buffer pixelfx rarity-aura VFX across world loot + UI slots and a procedural 96x96 braided hemp rope parchment tooltip with a 72x72 showcase pedestal.
- **5-Tier Item Progression & codixel Paper-Doll Atlas** (`decision:20261125071903-5tier-item-progression`): Built 64 24x24 codixel icons and 77 24x24 Paper-Doll overlays via codixel/core/pixel.js (hueRamp, P.band, rimLight, selout, P.Gem). Added full T1..T5 weapons per class, 2/4-pc Set Bonuses, 12 tiered consumables mapped to smart [1]-[4] hotkeys, and live 7-layer Paper-Doll hero vis
- **Loot Tables, Bounce Pickup, Waypoint Chests & 15 Forge Blueprints** (`decision:20261125060517-loot-tables-bounce-pickup`): Connected 5-slot equipment into gameplay loop via ENEMY_DROP_TABLES, pixel-bounce + magnetic auto-pickup loot, unlocked Chroma Chests at activated Waypoints, and 15 Prism Forge recipes for Helmets/Armors/Weapons/Boots/Accessories.
- **Layered Paper-Doll Pixel Rendering** (`decision:20261125060051-layered-paperdoll-pixel-rendering`): Implemented Base Body -> Boots -> Armor -> Helmet -> Weapon layered sprite rendering driven by ItemDef.visualStyle, synced with 4 directions, idle/run/attack/charge/dash states, Bleached desaturation, and pixelfx aura on Epic/Legendary/+7+ weapons.

## Stale Files (Need Re-reading)
- `file:.agents/skills/project-brain/SKILL.md` (.agents/skills/project-brain/SKILL.md)
- `file:.agents/skills/project-brain/assets/agent-block.md` (.agents/skills/project-brain/assets/agent-block.md)
- `file:.agents/skills/project-brain/assets/viewer.html` (.agents/skills/project-brain/assets/viewer.html)
- `file:.agents/skills/project-brain/scripts/brain.py` (.agents/skills/project-brain/scripts/brain.py)
- `file:LICENSE` (LICENSE)
- `file:README.md` (README.md)
- `file:src/audio/chiptuneSynth.ts` (src/audio/chiptuneSynth.ts)
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
- `file:src/vfx/pixelfx/fx/ice/frost-nova.js` (src/vfx/pixelfx/fx/ice/frost-nova.js)
- `file:src/vfx/pixelfx/fx/ice/ice-lance.js` (src/vfx/pixelfx/fx/ice/ice-lance.js)
- `file:src/vfx/pixelfx/fx/ice/ice-shatter.js` (src/vfx/pixelfx/fx/ice/ice-shatter.js)
- `file:src/vfx/pixelfx/fx/impacts/_lib.js` (src/vfx/pixelfx/fx/impacts/_lib.js)
- `file:src/vfx/pixelfx/fx/impacts/bullet-impact.js` (src/vfx/pixelfx/fx/impacts/bullet-impact.js)
- `file:src/vfx/pixelfx/fx/impacts/crit-hit.js` (src/vfx/pixelfx/fx/impacts/crit-hit.js)
- `file:src/vfx/pixelfx/fx/impacts/ground-slam.js` (src/vfx/pixelfx/fx/impacts/ground-slam.js)
- `file:src/vfx/pixelfx/fx/impacts/hit-spark.js` (src/vfx/pixelfx/fx/impacts/hit-spark.js)
- `file:src/vfx/pixelfx/fx/impacts/parry.js` (src/vfx/pixelfx/fx/impacts/parry.js)
