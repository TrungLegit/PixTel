# Project Brain Index
*Generated: 2026-11-25T14:38:34.905253+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt** — Chiến đấu thời gian thực, đánh thức các **Trụ Sắc Màu**, khôi phục bảng màu 16-bit cho vùng đất bị **Nhiễu Trắng** và đánh bại **The Eraser**.

## Main Modules
- **src/** (160 files)
- **.agents/** (38 files)
- **(root)/** (14 files)
- **scripts/** (2 files)
- **.github/** (1 files)

## Central Nodes
- `file:src/ui/ClassSelect.ts` (file, 18 links): Expanded the pixel-art logo buffer and lowered the 16-BIT badge to prevent overlap with the larger block-pixel wordmark.
- `file:index.html` (file, 10 links): Expanded the logo canvas to provide clear separation between the larger block-pixel PIXTEL lettering and its 16-BIT badge.
- `file:DEV_LOG.md` (file, 8 links): Added a follow-up log entry for the chunky Minecraft-inspired bitmap wordmark refinement and its validation.
- `file:style.css` (file, 7 links): Added a narrow-screen one-column class selector so class names and details remain readable on mobile.
- `decision:20261125143734-blockpixel-logo-lettering` (decision, 4 links): Broaden the PIXTEL canvas wordmark into a chunky 7x7 bitmap alphabet inspired by the user's Vietnamese Minecraft font reference, while keeping custom glyphs and the current chroma crest.
- `decision:20261125142812-epic-pixelgrid-title-screen` (decision, 4 links): Use the existing class-select overlay as PIXTEL's startup screen, replacing its plain wordmark with an animated low-resolution chroma crest and adding a crisp pixel-grid backdrop while preserving existing start, continue, and tutorial actions.
- `decision:20261125121555-4direction-monster-atlas` (decision, 4 links): Replaced Meadow & Quartz placeholder matrices with 40 extracted 4-direction sprites from the 10 reference sheets (codixel-enemies.png/json) paired with phase-locked skill animations, dash afterimages, shields, Painter-safe directional melee VFX, and moss_pool hazards.
- `decision:20261125113206-pixelfx-hero-models-selective` (decision, 4 links): Replaced character models with 3D-rigged pixelfx models, added Equip Best and multi-select confirmed Quick Sell, expanded to 25 Main+Side+Bounty quests, rebalanced Lv.1-19 mobs/bosses, and upgraded UI typography to Be Vietnam Pro.
- `decision:20261125101557-pixtel-v26-9element-pairwise` (decision, 4 links): Implemented all 9 canonical elements (fire, ice, nature, volt, prism, void, chroma, wind, quake) with 28 pairwise Primer+Detonator reactions and non-consuming 3-bolt homing Prismatic Refraction; upgraded Boss elemental weaknesses and The Eraser's Phase 2 Classic / Phase 3 Primord
- `decision:20261125080500-pixelfx-highrarity-auras` (decision, 4 links): Implemented deterministic two-buffer pixelfx rarity-aura VFX across world loot + UI slots and a procedural 96x96 braided hemp rope parchment tooltip with a 72x72 showcase pedestal.

## Recent Decisions
- **Block-pixel logo lettering** (`decision:20261125143734-blockpixel-logo-lettering`): Broaden the PIXTEL canvas wordmark into a chunky 7x7 bitmap alphabet inspired by the user's Vietnamese Minecraft font reference, while keeping custom glyphs and the current chroma crest.
- **Epic pixel-grid title screen** (`decision:20261125142812-epic-pixelgrid-title-screen`): Use the existing class-select overlay as PIXTEL's startup screen, replacing its plain wordmark with an animated low-resolution chroma crest and adding a crisp pixel-grid backdrop while preserving existing start, continue, and tutorial actions.
- **Mandatory Team Vibe-Code DEV_LOG Rule** (`decision:20261125140711-mandatory-team-vibecode-devlog`): Added DEV_LOG.md seeded from git history and enforced read-before-coding and write-after-coding log rules across AGENTS.md, GEMINI.md, .github/copilot-instructions.md, and CLAUDE.md.
- **Bit Rogue Pure Melee LMB & Charged-Only Shurikens** (`decision:20261125124126-bit-rogue-pure-melee`): Removed proj-shuriken projectiles from bit_rogue performPrimaryAttack (and Phantom Clone normal attacks), boosted pure melee range/cone/multipliers + shadow melee echo, and restricted proj-shuriken fan firing exclusively to performChargedAttack.
- **Multi-Frame Monster Animations & Biome-Matched Pixelfx VFX** (`decision:20261125123742-multiframe-monster-animations`): Upgraded all 16 map monsters and bosses with 122 crisp multi-frame pixel sprites, zero-blur movement, Amber/Ruins transform animations, landing-synced Slime leaps and moss pools, 4 bespoke pixelfx modules (sonic-wave, leaf-storm, rainbow-burst, hex-shield), emerald/fire/void grou

## Stale Files (Need Re-reading)
- `file:.agents/skills/codixel/LICENSE` (.agents/skills/codixel/LICENSE)
- `file:.agents/skills/codixel/SKILL.md` (.agents/skills/codixel/SKILL.md)
- `file:.agents/skills/codixel/core/pixel.js` (.agents/skills/codixel/core/pixel.js)
- `file:.agents/skills/codixel/package.json` (.agents/skills/codixel/package.json)
- `file:.agents/skills/pixelfx/LICENSE` (.agents/skills/pixelfx/LICENSE)
- `file:.agents/skills/pixelfx/SKILL.md` (.agents/skills/pixelfx/SKILL.md)
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
