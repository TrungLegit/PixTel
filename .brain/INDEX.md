# Project Brain Index
*Generated: 2026-11-25T11:05:19.622223+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt** — Chiến đấu thời gian thực, đánh thức các **Trụ Sắc Màu**, khôi phục bảng màu 16-bit cho vùng đất bị **Nhiễu Trắng** và đánh bại **The Eraser**.

## Main Modules
- **src/** (153 files)
- **.agents/** (38 files)
- **(root)/** (12 files)
- **.github/** (1 files)
- **scripts/** (1 files)

## Central Nodes
- `file:tests/featureTests.ts` (file, 26 links): Expanded automated test suite to 7 suites covering both v2.6 9-element mechanics and hardcore RPG bare-hand/class-lock/matrix-forge/stat-alloc/boss-seal mechanics.
- `file:src/ui/ForgeModal.ts` (file, 21 links): Unified Rune Matrix Forge modal with 240x176 geometric animation, substat awakening, +5 8-element pigment infusion, catalyst/pity, and class-filtered crafting.
- `file:src/graphics/heroSprites.ts` (file, 4 links): Added bleachedRight and bleachedLeft outputs to finalizeCharacter for CompiledSprite compatibility.
- `file:src/graphics/pixelCraft.ts` (file, 4 links): Added PixelBuf.toBleachedCanvas() for v2.6 Bleach debuff sprite parity.
- `file:src/graphics/worldSprites.ts` (file, 4 links): PixelBuf,
- `decision:20261125101557-pixtel-v26-9element-pairwise` (decision, 4 links): Implemented all 9 canonical elements (fire, ice, nature, volt, prism, void, chroma, wind, quake) with 28 pairwise Primer+Detonator reactions and non-consuming 3-bolt homing Prismatic Refraction; upgraded Boss elemental weaknesses and The Eraser's Phase 2 Classic / Phase 3 Primord
- `decision:20261125080500-pixelfx-highrarity-auras` (decision, 4 links): Implemented deterministic two-buffer pixelfx rarity-aura VFX across world loot + UI slots and a procedural 96x96 braided hemp rope parchment tooltip with a 72x72 showcase pedestal.
- `decision:20261125110519-unified-pixtel-v26-with` (decision, 2 links): Merged origin/main v2.6 (9 elements, 5-slot codixel paperdoll, Aethel-16 Lore, 3-phase Eraser, Beginner Tutorial) with bare-handed start, class-locked gear, stat allocation, animated Rune Matrix Forge, Dual-Grid world tilesets, and 4-boss territory seals.
- `decision:20261125071903-5tier-item-progression` (decision, 2 links): Built 64 24x24 codixel icons and 77 24x24 Paper-Doll overlays via codixel/core/pixel.js (hueRamp, P.band, rimLight, selout, P.Gem). Added full T1..T5 weapons per class, 2/4-pc Set Bonuses, 12 tiered consumables mapped to smart [1]-[4] hotkeys, and live 7-layer Paper-Doll hero vis
- `bug:20261125042129-classselect-firstframe-negative-dt` (bug, 2 links): requestAnimationFrame timestamp can be slightly earlier than performance.now() on first frame, producing negative dt and negative sprite index (-1). Fixed by clamping dt >= 0.001 in ClassSelect.ts and ForgeModal.ts plus positive modulo indexing in pixelSprites.ts.

## Recent Decisions
- **Unified PIXTEL v2.6 with Hardcore RPG Overhaul** (`decision:20261125110519-unified-pixtel-v26-with`): Merged origin/main v2.6 (9 elements, 5-slot codixel paperdoll, Aethel-16 Lore, 3-phase Eraser, Beginner Tutorial) with bare-handed start, class-locked gear, stat allocation, animated Rune Matrix Forge, Dual-Grid world tilesets, and 4-boss territory seals.
- **PIXTEL v2.6: 9-Element Pairwise Matrix, Phase 2/3 Eraser Totems, 8-Pigment Forge & 5-Tab Beginner Handbook** (`decision:20261125101557-pixtel-v26-9element-pairwise`): Implemented all 9 canonical elements (fire, ice, nature, volt, prism, void, chroma, wind, quake) with 28 pairwise Primer+Detonator reactions and non-consuming 3-bolt homing Prismatic Refraction; upgraded Boss elemental weaknesses and The Eraser's Phase 2 Classic / Phase 3 Primord
- **PIXTEL v2.5 Aethel-16 Lore Codex, 7 Chroma Reactions, 4 Bosses & Prism Forge Pity/Infusion** (`decision:20261125092451-pixtel-v25-aethel16-lore`): Implemented Aethel-16 storyline (8 Lore Tablets, 5-Act 10-Quest campaign), Chroma Dodge/Dash-Offset/Just-Charge, 5-Element 7-Reaction matrix, Xing Warden + Bleach Shield + 3-Phase Eraser Totems, safe +0..+10 Forge Pity/+5 Pigment Infusion, and 6-suite featureTests.
- **Pixelfx high-rarity auras & braided-rope hover review frame** (`decision:20261125080500-pixelfx-highrarity-auras`): Implemented deterministic two-buffer pixelfx rarity-aura VFX across world loot + UI slots and a procedural 96x96 braided hemp rope parchment tooltip with a 72x72 showcase pedestal.
- **5-Tier Item Progression & codixel Paper-Doll Atlas** (`decision:20261125071903-5tier-item-progression`): Built 64 24x24 codixel icons and 77 24x24 Paper-Doll overlays via codixel/core/pixel.js (hueRamp, P.band, rimLight, selout, P.Gem). Added full T1..T5 weapons per class, 2/4-pc Set Bonuses, 12 tiered consumables mapped to smart [1]-[4] hotkeys, and live 7-layer Paper-Doll hero vis

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
- `file:README.md` (README.md)
- `file:index.html` (index.html)
- `file:package-lock.json` (package-lock.json)
- `file:package.json` (package.json)
- `file:scripts/generate_codixel_assets.mjs` (scripts/generate_codixel_assets.mjs)
- `file:src/assets/codixel-icons.json` (src/assets/codixel-icons.json)
- `file:src/assets/codixel-paperdoll.json` (src/assets/codixel-paperdoll.json)
- `file:src/audio/chiptuneSynth.ts` (src/audio/chiptuneSynth.ts)
- `file:src/data/classes.ts` (src/data/classes.ts)
- `file:src/data/elements.ts` (src/data/elements.ts)
- `file:src/data/enemies.ts` (src/data/enemies.ts)
- `file:src/data/equipments.ts` (src/data/equipments.ts)
- `file:src/data/items.ts` (src/data/items.ts)
- `file:src/data/lootTables.ts` (src/data/lootTables.ts)
- `file:src/data/lore.ts` (src/data/lore.ts)
- `file:src/data/quests.ts` (src/data/quests.ts)
- `file:src/data/recipes.ts` (src/data/recipes.ts)
- `file:src/data/types.ts` (src/data/types.ts)
- `file:src/data/worldConfig.ts` (src/data/worldConfig.ts)
- `file:src/game.ts` (src/game.ts)
- `file:src/graphics/codixelAtlas.ts` (src/graphics/codixelAtlas.ts)
- `file:src/graphics/colorRestoration.ts` (src/graphics/colorRestoration.ts)
- `file:src/graphics/itemIcons.ts` (src/graphics/itemIcons.ts)
- `file:src/graphics/paperDoll.ts` (src/graphics/paperDoll.ts)
- `file:src/graphics/pixelSprites.ts` (src/graphics/pixelSprites.ts)
- `file:src/graphics/ropeFrame.ts` (src/graphics/ropeFrame.ts)
- `file:src/graphics/tileRenderer.ts` (src/graphics/tileRenderer.ts)
- `file:src/main.ts` (src/main.ts)
- `file:src/systems/combat.ts` (src/systems/combat.ts)
- `file:src/systems/forgeSystem.ts` (src/systems/forgeSystem.ts)
- `file:src/systems/inventorySystem.ts` (src/systems/inventorySystem.ts)
- `file:src/systems/questSystem.ts` (src/systems/questSystem.ts)
- `file:src/systems/saveSystem.ts` (src/systems/saveSystem.ts)
- `file:src/ui/ClassSelect.ts` (src/ui/ClassSelect.ts)
- `file:src/ui/DialogueModal.ts` (src/ui/DialogueModal.ts)
- `file:src/ui/HUD.ts` (src/ui/HUD.ts)
- `file:src/ui/InventoryModal.ts` (src/ui/InventoryModal.ts)
- `file:src/ui/ItemReviewTooltip.ts` (src/ui/ItemReviewTooltip.ts)
- `file:src/ui/QuestJournalModal.ts` (src/ui/QuestJournalModal.ts)
- `file:src/ui/TutorialModal.ts` (src/ui/TutorialModal.ts)
- `file:src/ui/WorldMapModal.ts` (src/ui/WorldMapModal.ts)
- `file:src/vfx/fxAtlas.ts` (src/vfx/fxAtlas.ts)
- `file:src/vfx/pixelfx/core/act.js` (src/vfx/pixelfx/core/act.js)
- `file:src/vfx/pixelfx/core/actor.js` (src/vfx/pixelfx/core/actor.js)
