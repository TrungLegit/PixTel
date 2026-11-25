# Project Brain Index
*Generated: 2026-11-25T14:30:29.070118+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt** — Chiến đấu thời gian thực, đánh thức các **Trụ Sắc Màu**, khôi phục bảng màu 16-bit cho vùng đất bị **Nhiễu Trắng** và đánh bại **The Eraser**.

## Main Modules
- **src/** (161 files)
- **.agents/** (38 files)
- **(root)/** (14 files)
- **scripts/** (2 files)
- **.github/** (1 files)

## Central Nodes
- `file:src/game.ts` (file, 67 links): Game controller managing permanent hidden item unlocks, Bleached/Restored shimmer, Energy Siphon magnet, and drop halos.
- `file:src/data/types.ts` (file, 52 links): Extended ItemDef, RecipeDef, EquipPassiveId, and SaveDataV2 with hidden item metadata, craftRecipe, and unlock tracking.
- `file:src/systems/combat.ts` (file, 44 links): 9-element CombatSystem handling exclusive Boss hidden drops with rainbow-burst/waypoint-pillar VFX and hidden passives.
- `file:src/data/items.ts` (file, 33 links): Unified item catalog spreading HIDDEN_ITEMS and guarding pickRandomEquipByRarity against hidden item leakage.
- `file:tests/featureTests.ts` (file, 29 links): Automated 11-suite test runner verifying lore, 9-element matrix, bosses, hardcore RPG, sprites, and Hidden Items.
- `file:src/ui/ItemReviewTooltip.ts` (file, 25 links): Vintage parchment hover tooltip masking un-unlocked hidden items (???) and displaying exclusive source tags when unlocked.
- `file:src/ui/ForgeModal.ts` (file, 22 links): Rune Matrix Forge modal with Hidden Blueprints filter tab, ??? secrecy masking, level checks, and unlock triggers.
- `file:src/systems/inventorySystem.ts` (file, 21 links): 5-slot inventory & recalculatePlayerStats() supporting restored_prism_surge, energy_siphon_magnet, and set_resonance_echo.
- `file:src/world/entities.ts` (file, 20 links): PlayerEntity runtime flags including hasRestoredPrismSurge, hasEnergySiphon, and hasSetResonance.
- `file:src/systems/forgeSystem.ts` (file, 17 links): Rune Matrix Forge system enforcing requiredLevel and rare materials on hidden craft_only blueprints.

## Recent Decisions
- **Hidden Items System (Craft-Only & Boss-Drop Only)** (`decision:20261125143028-hidden-items-system-craftonly`): Added 8 isHidden items (4 craft_only, 4 boss_only) strictly isolated from shops/chests/normal mobs, masked as ??? until discovered, permanently unlocked in localStorage, and integrated with combat passives, VFX, and Paper-Doll shimmer.
- **Mandatory Team Vibe-Code DEV_LOG Rule** (`decision:20261125140711-mandatory-team-vibecode-devlog`): Added DEV_LOG.md seeded from git history and enforced read-before-coding and write-after-coding log rules across AGENTS.md, GEMINI.md, .github/copilot-instructions.md, and CLAUDE.md.
- **Bit Rogue Pure Melee LMB & Charged-Only Shurikens** (`decision:20261125124126-bit-rogue-pure-melee`): Removed proj-shuriken projectiles from bit_rogue performPrimaryAttack (and Phantom Clone normal attacks), boosted pure melee range/cone/multipliers + shadow melee echo, and restricted proj-shuriken fan firing exclusively to performChargedAttack.
- **Multi-Frame Monster Animations & Biome-Matched Pixelfx VFX** (`decision:20261125123742-multiframe-monster-animations`): Upgraded all 16 map monsters and bosses with 122 crisp multi-frame pixel sprites, zero-blur movement, Amber/Ruins transform animations, landing-synced Slime leaps and moss pools, 4 bespoke pixelfx modules (sonic-wave, leaf-storm, rainbow-burst, hex-shield), emerald/fire/void grou
- **4-Direction Monster Atlas & Synchronized Enemy Skill VFX** (`decision:20261125121555-4direction-monster-atlas`): Replaced Meadow & Quartz placeholder matrices with 40 extracted 4-direction sprites from the 10 reference sheets (codixel-enemies.png/json) paired with phase-locked skill animations, dash afterimages, shields, Painter-safe directional melee VFX, and moss_pool hazards.

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
- `file:.agents/skills/spritecook-use-assets-in-godot/SKILL.md` (.agents/skills/spritecook-use-assets-in-godot/SKILL.md)
- `file:.agents/skills/spritecook-use-assets-in-godot/agents/openai.yaml` (.agents/skills/spritecook-use-assets-in-godot/agents/openai.yaml)
- `file:.agents/skills/spritecook-use-dual-grid-tilesets/SKILL.md` (.agents/skills/spritecook-use-dual-grid-tilesets/SKILL.md)
- `file:.agents/skills/spritecook-use-presets/SKILL.md` (.agents/skills/spritecook-use-presets/SKILL.md)
- `file:.agents/skills/spritecook-workflow-essentials/LICENSE` (.agents/skills/spritecook-workflow-essentials/LICENSE)
- `file:.agents/skills/spritecook-workflow-essentials/SKILL.md` (.agents/skills/spritecook-workflow-essentials/SKILL.md)
- `file:.gitignore` (.gitignore)
