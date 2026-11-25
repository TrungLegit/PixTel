# Project Brain Index
*Generated: 2026-11-25T14:07:11.932476+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt** — Chiến đấu thời gian thực, đánh thức các **Trụ Sắc Màu**, khôi phục bảng màu 16-bit cho vùng đất bị **Nhiễu Trắng** và đánh bại **The Eraser**.

## Main Modules
- **src/** (160 files)
- **.agents/** (38 files)
- **(root)/** (14 files)
- **scripts/** (2 files)
- **.github/** (1 files)

## Central Nodes
- `file:DEV_LOG.md` (file, 6 links): Shared newest-first team development log with current stage snapshot, handoff template, and full git milestone history for PIXTEL.
- `decision:20261125121555-4direction-monster-atlas` (decision, 4 links): Replaced Meadow & Quartz placeholder matrices with 40 extracted 4-direction sprites from the 10 reference sheets (codixel-enemies.png/json) paired with phase-locked skill animations, dash afterimages, shields, Painter-safe directional melee VFX, and moss_pool hazards.
- `decision:20261125113206-pixelfx-hero-models-selective` (decision, 4 links): Replaced character models with 3D-rigged pixelfx models, added Equip Best and multi-select confirmed Quick Sell, expanded to 25 Main+Side+Bounty quests, rebalanced Lv.1-19 mobs/bosses, and upgraded UI typography to Be Vietnam Pro.
- `decision:20261125101557-pixtel-v26-9element-pairwise` (decision, 4 links): Implemented all 9 canonical elements (fire, ice, nature, volt, prism, void, chroma, wind, quake) with 28 pairwise Primer+Detonator reactions and non-consuming 3-bolt homing Prismatic Refraction; upgraded Boss elemental weaknesses and The Eraser's Phase 2 Classic / Phase 3 Primord
- `decision:20261125080500-pixelfx-highrarity-auras` (decision, 4 links): Implemented deterministic two-buffer pixelfx rarity-aura VFX across world loot + UI slots and a procedural 96x96 braided hemp rope parchment tooltip with a 72x72 showcase pedestal.
- `decision:20261125115658-attack-animation-pixelfx` (decision, 3 links): Synchronized 12fps keyframed pixelfx 3D IK hero attack poses, aim pitch, facing priority, Painter flip orientation, chest/weapon-tip VFX origins, startTime pre-warming, and Class Select card previews across bare-handed combat and all 4 classes.
- `file:AGENTS.md` (file, 2 links): Workspace agent rules combining Project Brain graph memory instructions with mandatory Team Vibe-Code DEV_LOG.md read/write rule.
- `decision:20261125110519-unified-pixtel-v26-with` (decision, 2 links): Merged origin/main v2.6 (9 elements, 5-slot codixel paperdoll, Aethel-16 Lore, 3-phase Eraser, Beginner Tutorial) with bare-handed start, class-locked gear, stat allocation, animated Rune Matrix Forge, Dual-Grid world tilesets, and 4-boss territory seals.
- `decision:20261125071903-5tier-item-progression` (decision, 2 links): Built 64 24x24 codixel icons and 77 24x24 Paper-Doll overlays via codixel/core/pixel.js (hueRamp, P.band, rimLight, selout, P.Gem). Added full T1..T5 weapons per class, 2/4-pc Set Bonuses, 12 tiered consumables mapped to smart [1]-[4] hotkeys, and live 7-layer Paper-Doll hero vis
- `bug:20261125042129-classselect-firstframe-negative-dt` (bug, 2 links): requestAnimationFrame timestamp can be slightly earlier than performance.now() on first frame, producing negative dt and negative sprite index (-1). Fixed by clamping dt >= 0.001 in ClassSelect.ts and ForgeModal.ts plus positive modulo indexing in pixelSprites.ts.

## Recent Decisions
- **Mandatory Team Vibe-Code DEV_LOG Rule** (`decision:20261125140711-mandatory-team-vibecode-devlog`): Added DEV_LOG.md seeded from git history and enforced read-before-coding and write-after-coding log rules across AGENTS.md, GEMINI.md, .github/copilot-instructions.md, and CLAUDE.md.
- **Bit Rogue Pure Melee LMB & Charged-Only Shurikens** (`decision:20261125124126-bit-rogue-pure-melee`): Removed proj-shuriken projectiles from bit_rogue performPrimaryAttack (and Phantom Clone normal attacks), boosted pure melee range/cone/multipliers + shadow melee echo, and restricted proj-shuriken fan firing exclusively to performChargedAttack.
- **Multi-Frame Monster Animations & Biome-Matched Pixelfx VFX** (`decision:20261125123742-multiframe-monster-animations`): Upgraded all 16 map monsters and bosses with 122 crisp multi-frame pixel sprites, zero-blur movement, Amber/Ruins transform animations, landing-synced Slime leaps and moss pools, 4 bespoke pixelfx modules (sonic-wave, leaf-storm, rainbow-burst, hex-shield), emerald/fire/void grou
- **4-Direction Monster Atlas & Synchronized Enemy Skill VFX** (`decision:20261125121555-4direction-monster-atlas`): Replaced Meadow & Quartz placeholder matrices with 40 extracted 4-direction sprites from the 10 reference sheets (codixel-enemies.png/json) paired with phase-locked skill animations, dash afterimages, shields, Painter-safe directional melee VFX, and moss_pool hazards.
- **Attack Animation & Pixelfx VFX Synchronization** (`decision:20261125115658-attack-animation-pixelfx`): Synchronized 12fps keyframed pixelfx 3D IK hero attack poses, aim pitch, facing priority, Painter flip orientation, chest/weapon-tip VFX origins, startTime pre-warming, and Class Select card previews across bare-handed combat and all 4 classes.

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
