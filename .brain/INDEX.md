# Project Brain Index
*Generated: 2026-11-25T10:17:27.285805+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt** — Chiến đấu thời gian thực, đánh thức các **Trụ Sắc Màu**, khôi phục bảng màu 16-bit cho vùng đất bị **Nhiễu Trắng** và đánh bại **The Eraser**.

## Main Modules
- **src/** (150 files)
- **(root)/** (12 files)
- **.agents/** (4 files)
- **.github/** (1 files)
- **scripts/** (1 files)

## Central Nodes
- `file:src/vfx/vfxManager.ts` (file, 71 links): Registered pixtel/rarity-aura, item-aura-rare/epic/legendary, and collect-burst-rare/epic/legendary presets and eager atlas warmup.
- `file:src/game.ts` (file, 55 links): Wired 6-step live Guided Beginner Practice tracker (+50G & Coating reward), [H]/[F1] Tutorial modal, 9-element enemy pips/totem cores, and Null Frost / Chroma Bloom ground fields.
- `file:src/data/types.ts` (file, 41 links): Expanded CanonicalElement to 9 elements (8 InfusableElement + prism), added 4 new EquipPassiveId values, Boss elementAffinity/elementWeakness, and tutorialCompleted in SaveDataV2.
- `file:src/systems/combat.ts` (file, 31 links): Implemented complete 9-Element Reaction Engine (28 pairwise reactions + Prismatic Refraction preserving Primer aura & firing 3 homing bolts), Boss elemental weaknesses, and Phase 2/3 Eraser Totem Super Convergence.
- `file:src/data/items.ts` (file, 26 links): Added 4 new Chroma Pigments (void, chroma, wind, quake), added all 8 pigments to MERCHANT_STOCK, and added element-specific secondary stat resonances at +5 infusion.
- `file:src/data/worldConfig.ts` (file, 20 links): 160x160 world layout with Origin Town NPCs/dialogues, 9 Chroma Waypoints, camps (incl. Meadow Boss Arena), mining nodes, and chests.
- `file:src/main.ts` (file, 17 links): Mounted TutorialModalUI and wired Pause Menu Help button alongside HUD and Class Select.
- `file:src/ui/ForgeModal.ts` (file, 17 links): Rendered all 8 Chroma Pigment +5 infusion buttons with Rope Tooltip hooks and added Poise Break / Skill CD stat previews.
- `file:src/systems/inventorySystem.ts` (file, 17 links): Expanded MAX_BAG_SLOTS to 40 (5x8) and wired hasVoidSiphon, hasWindDancer, hasChromaBlessing, and hasQuakeImpact passives in recalculatePlayerStats.
- `file:src/graphics/itemIcons.ts` (file, 17 links): Codixel atlas + procedural 16x16 fallback pixel icons (incl. axe, amulet, book, disc, totem, pigment) and 4x Paper-Doll hero preview.

## Recent Decisions
- **PIXTEL v2.6: 9-Element Pairwise Matrix, Phase 2/3 Eraser Totems, 8-Pigment Forge & 5-Tab Beginner Handbook** (`decision:20261125101557-pixtel-v26-9element-pairwise`): Implemented all 9 canonical elements (fire, ice, nature, volt, prism, void, chroma, wind, quake) with 28 pairwise Primer+Detonator reactions and non-consuming 3-bolt homing Prismatic Refraction; upgraded Boss elemental weaknesses and The Eraser's Phase 2 Classic / Phase 3 Primord
- **PIXTEL v2.5 Aethel-16 Lore Codex, 7 Chroma Reactions, 4 Bosses & Prism Forge Pity/Infusion** (`decision:20261125092451-pixtel-v25-aethel16-lore`): Implemented Aethel-16 storyline (8 Lore Tablets, 5-Act 10-Quest campaign), Chroma Dodge/Dash-Offset/Just-Charge, 5-Element 7-Reaction matrix, Xing Warden + Bleach Shield + 3-Phase Eraser Totems, safe +0..+10 Forge Pity/+5 Pigment Infusion, and 6-suite featureTests.
- **Pixelfx high-rarity auras & braided-rope hover review frame** (`decision:20261125080500-pixelfx-highrarity-auras`): Implemented deterministic two-buffer pixelfx rarity-aura VFX across world loot + UI slots and a procedural 96x96 braided hemp rope parchment tooltip with a 72x72 showcase pedestal.
- **5-Tier Item Progression & codixel Paper-Doll Atlas** (`decision:20261125071903-5tier-item-progression`): Built 64 24x24 codixel icons and 77 24x24 Paper-Doll overlays via codixel/core/pixel.js (hueRamp, P.band, rimLight, selout, P.Gem). Added full T1..T5 weapons per class, 2/4-pc Set Bonuses, 12 tiered consumables mapped to smart [1]-[4] hotkeys, and live 7-layer Paper-Doll hero vis
- **Loot Tables, Bounce Pickup, Waypoint Chests & 15 Forge Blueprints** (`decision:20261125060517-loot-tables-bounce-pickup`): Connected 5-slot equipment into gameplay loop via ENEMY_DROP_TABLES, pixel-bounce + magnetic auto-pickup loot, unlocked Chroma Chests at activated Waypoints, and 15 Prism Forge recipes for Helmets/Armors/Weapons/Boots/Accessories.

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
