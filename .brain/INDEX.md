# Project Brain Index
*Generated: 2026-11-25T13:30:13.149463+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt** — Chiến đấu thời gian thực, đánh thức các **Trụ Sắc Màu**, khôi phục bảng màu 16-bit cho vùng đất bị **Nhiễu Trắng** và đánh bại **The Eraser**.

## Main Modules
- **src/** (160 files)
- **.agents/** (38 files)
- **(root)/** (12 files)
- **scripts/** (2 files)
- **.github/** (1 files)

## Central Nodes
- `file:src/ui/ForgeModal.ts` (file, 21 links): Unified Rune Matrix Forge modal with 240x176 geometric animation, substat awakening, +5 8-element pigment infusion, catalyst/pity, and class-filtered crafting.
- `file:src/graphics/pixelfxHeroModels.ts` (file, 16 links): Replaced static attack pose with multi-phase 12fps keyframed poseAt tracks (slash_1/2, cleave, thrust, flurry_1/2, spin, storm, punch_1/2/3, uppercut, cast_1/2/3/heavy/ult, shoot/heavy, beam), quantized aim pitch, charge buckets, shieldGuard stance, and larger bake bounds.
- `file:src/graphics/enemyAtlas.ts` (file, 8 links): Replaced static frame + blurry walk rotation with crisp 4-beat multi-frame cycling, slime slam squinted eyes, 90-deg spinning carapace roll, hit-recoil squash, dynamic shadows, and pixel hex/crystal guard overlays.
- `decision:20261125121555-4direction-monster-atlas` (decision, 4 links): Replaced Meadow & Quartz placeholder matrices with 40 extracted 4-direction sprites from the 10 reference sheets (codixel-enemies.png/json) paired with phase-locked skill animations, dash afterimages, shields, Painter-safe directional melee VFX, and moss_pool hazards.
- `decision:20261125113206-pixelfx-hero-models-selective` (decision, 4 links): Replaced character models with 3D-rigged pixelfx models, added Equip Best and multi-select confirmed Quick Sell, expanded to 25 Main+Side+Bounty quests, rebalanced Lv.1-19 mobs/bosses, and upgraded UI typography to Be Vietnam Pro.
- `file:src/graphics/heroSprites.ts` (file, 4 links): Added bleachedRight and bleachedLeft outputs to finalizeCharacter for CompiledSprite compatibility.
- `file:src/graphics/pixelCraft.ts` (file, 4 links): Added PixelBuf.toBleachedCanvas() for v2.6 Bleach debuff sprite parity.
- `file:src/graphics/worldSprites.ts` (file, 4 links): PixelBuf,
- `decision:20261125101557-pixtel-v26-9element-pairwise` (decision, 4 links): Implemented all 9 canonical elements (fire, ice, nature, volt, prism, void, chroma, wind, quake) with 28 pairwise Primer+Detonator reactions and non-consuming 3-bolt homing Prismatic Refraction; upgraded Boss elemental weaknesses and The Eraser's Phase 2 Classic / Phase 3 Primord
- `decision:20261125080500-pixelfx-highrarity-auras` (decision, 4 links): Implemented deterministic two-buffer pixelfx rarity-aura VFX across world loot + UI slots and a procedural 96x96 braided hemp rope parchment tooltip with a 72x72 showcase pedestal.

## Recent Decisions
- **Bit Rogue Pure Melee LMB & Charged-Only Shurikens** (`decision:20261125124126-bit-rogue-pure-melee`): Removed proj-shuriken projectiles from bit_rogue performPrimaryAttack (and Phantom Clone normal attacks), boosted pure melee range/cone/multipliers + shadow melee echo, and restricted proj-shuriken fan firing exclusively to performChargedAttack.
- **Multi-Frame Monster Animations & Biome-Matched Pixelfx VFX** (`decision:20261125123742-multiframe-monster-animations`): Upgraded all 16 map monsters and bosses with 122 crisp multi-frame pixel sprites, zero-blur movement, Amber/Ruins transform animations, landing-synced Slime leaps and moss pools, 4 bespoke pixelfx modules (sonic-wave, leaf-storm, rainbow-burst, hex-shield), emerald/fire/void grou
- **4-Direction Monster Atlas & Synchronized Enemy Skill VFX** (`decision:20261125121555-4direction-monster-atlas`): Replaced Meadow & Quartz placeholder matrices with 40 extracted 4-direction sprites from the 10 reference sheets (codixel-enemies.png/json) paired with phase-locked skill animations, dash afterimages, shields, Painter-safe directional melee VFX, and moss_pool hazards.
- **Attack Animation & Pixelfx VFX Synchronization** (`decision:20261125115658-attack-animation-pixelfx`): Synchronized 12fps keyframed pixelfx 3D IK hero attack poses, aim pitch, facing priority, Painter flip orientation, chest/weapon-tip VFX origins, startTime pre-warming, and Class Select card previews across bare-handed combat and all 4 classes.
- **Pixelfx Hero Models, Selective Quick Sell, 25 Quests & Readability** (`decision:20261125113206-pixelfx-hero-models-selective`): Replaced character models with 3D-rigged pixelfx models, added Equip Best and multi-select confirmed Quick Sell, expanded to 25 Main+Side+Bounty quests, rebalanced Lv.1-19 mobs/bosses, and upgraded UI typography to Be Vietnam Pro.

## Stale Files (Need Re-reading)
- `file:.agents/skills/codixel/LICENSE` (.agents/skills/codixel/LICENSE)
- `file:.agents/skills/codixel/SKILL.md` (.agents/skills/codixel/SKILL.md)
- `file:.agents/skills/codixel/core/pixel.js` (.agents/skills/codixel/core/pixel.js)
- `file:.agents/skills/pixelfx/LICENSE` (.agents/skills/pixelfx/LICENSE)
- `file:.agents/skills/pixelfx/references/AUTHORING.md` (.agents/skills/pixelfx/references/AUTHORING.md)
- `file:.agents/skills/pixelfx/references/CATALOG.md` (.agents/skills/pixelfx/references/CATALOG.md)
- `file:.agents/skills/pixelfx/scripts/act.mjs` (.agents/skills/pixelfx/scripts/act.mjs)
- `file:.agents/skills/pixelfx/scripts/check.mjs` (.agents/skills/pixelfx/scripts/check.mjs)
- `file:.agents/skills/pixelfx/scripts/compare.mjs` (.agents/skills/pixelfx/scripts/compare.mjs)
- `file:.agents/skills/pixelfx/scripts/lib/fxlib.mjs` (.agents/skills/pixelfx/scripts/lib/fxlib.mjs)
- `file:.agents/skills/pixelfx/scripts/lib/png.mjs` (.agents/skills/pixelfx/scripts/lib/png.mjs)
- `file:.agents/skills/pixelfx/scripts/list.mjs` (.agents/skills/pixelfx/scripts/list.mjs)
- `file:.agents/skills/pixelfx/scripts/new.mjs` (.agents/skills/pixelfx/scripts/new.mjs)
- `file:.agents/skills/pixelfx/scripts/render.mjs` (.agents/skills/pixelfx/scripts/render.mjs)
- `file:.agents/skills/pixelfx/scripts/sheets.mjs` (.agents/skills/pixelfx/scripts/sheets.mjs)
- `file:.agents/skills/project-brain/SKILL.md` (.agents/skills/project-brain/SKILL.md)
- `file:.agents/skills/project-brain/assets/agent-block.md` (.agents/skills/project-brain/assets/agent-block.md)
- `file:.agents/skills/project-brain/assets/viewer.html` (.agents/skills/project-brain/assets/viewer.html)
- `file:.agents/skills/project-brain/scripts/brain.py` (.agents/skills/project-brain/scripts/brain.py)
- `file:.agents/skills/spritecook-animate-assets/SKILL.md` (.agents/skills/spritecook-animate-assets/SKILL.md)
- `file:.agents/skills/spritecook-build-ui-kits/SKILL.md` (.agents/skills/spritecook-build-ui-kits/SKILL.md)
- `file:.agents/skills/spritecook-build-ui-kits/agents/openai.yaml` (.agents/skills/spritecook-build-ui-kits/agents/openai.yaml)
- `file:.agents/skills/spritecook-generate-sprites/SKILL.md` (.agents/skills/spritecook-generate-sprites/SKILL.md)
- `file:.agents/skills/spritecook-generate-sprites/references/character-workflows.md` (.agents/skills/spritecook-generate-sprites/references/character-workflows.md)
- `file:.agents/skills/spritecook-generate-tilesets/SKILL.md` (.agents/skills/spritecook-generate-tilesets/SKILL.md)
- `file:.agents/skills/spritecook-polish-sprites/.gitignore` (.agents/skills/spritecook-polish-sprites/.gitignore)
- `file:.agents/skills/spritecook-polish-sprites/SKILL.md` (.agents/skills/spritecook-polish-sprites/SKILL.md)
- `file:.agents/skills/spritecook-polish-sprites/scripts/compare_alpha.py` (.agents/skills/spritecook-polish-sprites/scripts/compare_alpha.py)
- `file:.agents/skills/spritecook-polish-sprites/scripts/test_compare_alpha.py` (.agents/skills/spritecook-polish-sprites/scripts/test_compare_alpha.py)
- `file:.agents/skills/spritecook-upload-assets/SKILL.md` (.agents/skills/spritecook-upload-assets/SKILL.md)
