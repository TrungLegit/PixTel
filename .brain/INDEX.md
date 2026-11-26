# Project Brain Index
*Generated: 2026-11-26T06:56:47.945273+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt** — Chiến đấu thời gian thực, đánh thức các **Trụ Sắc Màu**, khôi phục bảng màu 16-bit cho vùng đất bị **Nhiễu Trắng** và đánh bại **The Eraser**.

## Main Modules
- **src/** (161 files)
- **.agents/** (38 files)
- **(root)/** (14 files)
- **.brain/** (3 files)
- **scripts/** (2 files)

## Central Nodes
- `file:src/game.ts` (file, 70 links): Supplies current dash direction to both player and clone Paper-Doll render calls.
- `file:src/data/types.ts` (file, 52 links): Extended ItemDef, RecipeDef, EquipPassiveId, and SaveDataV2 with hidden item metadata, craftRecipe, and unlock tracking.
- `file:src/systems/combat.ts` (file, 44 links): 9-element CombatSystem handling exclusive Boss hidden drops with rainbow-burst/waypoint-pillar VFX and hidden passives.
- `file:src/data/items.ts` (file, 33 links): Unified item catalog spreading HIDDEN_ITEMS and guarding pickRandomEquipByRarity against hidden item leakage.
- `file:tests/featureTests.ts` (file, 30 links): Asserts helmet, boots, and accessory shape metadata map from real equipment definitions and reject cross-slot shapes.
- `file:src/ui/ItemReviewTooltip.ts` (file, 25 links): Vintage parchment hover tooltip masking un-unlocked hidden items (???) and displaying exclusive source tags when unlocked.
- `file:src/ui/ForgeModal.ts` (file, 22 links): Rune Matrix Forge modal with Hidden Blueprints filter tab, ??? secrecy masking, level checks, and unlock triggers.
- `file:src/graphics/pixelfxHeroModels.ts` (file, 21 links): Maps equipment metadata to rig shapes, gear palettes, distinct accessory pixel motifs, and a cached-sprite dash echo.
- `file:src/systems/inventorySystem.ts` (file, 21 links): 5-slot inventory & recalculatePlayerStats() supporting restored_prism_surge, energy_siphon_magnet, and set_resonance_echo.
- `file:src/main.ts` (file, 20 links): Imported the local Pixelify Sans variable font before bootstrapping the game UI.

## Recent Decisions
- **Render gear from equipment shapes and add dash echo** (`decision:20261126065126-render-gear-from-equipment`): Keep the existing selected-class rig, weapon mapping, and VFX manager; extend the Paper-Doll theme with equipment-shape mappings for helmet, armor, boots, and accessory silhouettes, and draw a single low-alpha cached-hero dash afterimage without changing combat timing or damage.
- **Self-hosted Vietnamese pixel UI font** (`decision:20261125144603-selfhosted-vietnamese-pixel-ui`): Use the OFL-licensed Pixelify Sans variable font from a local npm package as the primary game-wide UI font, removing Google Fonts runtime requests to keep Vietnamese glyph rendering available offline.
- **Resolve current main conflicts without dropping branch history** (`decision:20261125144411-resolve-current-main-conflicts`): Use a merge commit to retain both histories; preserve both DEV_LOG entries and let project-brain tooling compact the graph and regenerate its digest rather than hand-editing graph files.
- **Block-pixel logo lettering** (`decision:20261125143734-blockpixel-logo-lettering`): Broaden the PIXTEL canvas wordmark into a chunky 7x7 bitmap alphabet inspired by the user's Vietnamese Minecraft font reference, while keeping custom glyphs and the current chroma crest.
- **Hidden Items System (Craft-Only & Boss-Drop Only)** (`decision:20261125143028-hidden-items-system-craftonly`): Added 8 isHidden items (4 craft_only, 4 boss_only) strictly isolated from shops/chests/normal mobs, masked as ??? until discovered, permanently unlocked in localStorage, and integrated with combat passives, VFX, and Paper-Doll shimmer.

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
- `file:.github/copilot-instructions.md` (.github/copilot-instructions.md)
- `file:.gitignore` (.gitignore)
- `file:AGENTS.md` (AGENTS.md)
- `file:CLAUDE.md` (CLAUDE.md)
- `file:GEMINI.md` (GEMINI.md)
- `file:LICENSE` (LICENSE)
