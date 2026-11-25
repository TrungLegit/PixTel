# Project Brain Index
*Generated: 2026-11-25T14:50:07.400637+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt** — Chiến đấu thời gian thực, đánh thức các **Trụ Sắc Màu**, khôi phục bảng màu 16-bit cho vùng đất bị **Nhiễu Trắng** và đánh bại **The Eraser**.

## Main Modules
- **src/** (160 files)
- **.agents/** (38 files)
- **(root)/** (14 files)
- **scripts/** (2 files)
- **.github/** (1 files)

## Central Nodes
- `file:src/main.ts` (file, 20 links): Imported the local Pixelify Sans variable font before bootstrapping the game UI.
- `file:src/ui/ClassSelect.ts` (file, 18 links): Expanded the pixel-art logo buffer and lowered the 16-BIT badge to prevent overlap with the larger block-pixel wordmark.
- `file:style.css` (file, 14 links): Applied the exact locally bundled Pixelify Sans Variable family across game UI typography.
- `file:index.html` (file, 11 links): Removed remote Google Fonts links so startup no longer depends on third-party font loading.
- `file:DEV_LOG.md` (file, 9 links): Updated font rollout handoff to the new standalone branch because the original title-screen PR has already merged.
- `file:src/ui/WorldMapModal.ts` (file, 6 links): Updated map-label canvas typography to use the exact bundled Pixelify Sans Variable family name.
- `decision:20261125144603-selfhosted-vietnamese-pixel-ui` (decision, 6 links): Use the OFL-licensed Pixelify Sans variable font from a local npm package as the primary game-wide UI font, removing Google Fonts runtime requests to keep Vietnamese glyph rendering available offline.
- `decision:20261125143734-blockpixel-logo-lettering` (decision, 5 links): Broaden the PIXTEL canvas wordmark into a chunky 7x7 bitmap alphabet inspired by the user's Vietnamese Minecraft font reference, while keeping custom glyphs and the current chroma crest.
- `file:package.json` (file, 4 links): Added the self-hosted OFL Pixelify Sans variable font package for game-wide Vietnamese pixel typography.
- `decision:20261125142812-epic-pixelgrid-title-screen` (decision, 4 links): Use the existing class-select overlay as PIXTEL's startup screen, replacing its plain wordmark with an animated low-resolution chroma crest and adding a crisp pixel-grid backdrop while preserving existing start, continue, and tutorial actions.

## Recent Decisions
- **Self-hosted Vietnamese pixel UI font** (`decision:20261125144603-selfhosted-vietnamese-pixel-ui`): Use the OFL-licensed Pixelify Sans variable font from a local npm package as the primary game-wide UI font, removing Google Fonts runtime requests to keep Vietnamese glyph rendering available offline.
- **Block-pixel logo lettering** (`decision:20261125143734-blockpixel-logo-lettering`): Broaden the PIXTEL canvas wordmark into a chunky 7x7 bitmap alphabet inspired by the user's Vietnamese Minecraft font reference, while keeping custom glyphs and the current chroma crest.
- **Epic pixel-grid title screen** (`decision:20261125142812-epic-pixelgrid-title-screen`): Use the existing class-select overlay as PIXTEL's startup screen, replacing its plain wordmark with an animated low-resolution chroma crest and adding a crisp pixel-grid backdrop while preserving existing start, continue, and tutorial actions.
- **Mandatory Team Vibe-Code DEV_LOG Rule** (`decision:20261125140711-mandatory-team-vibecode-devlog`): Added DEV_LOG.md seeded from git history and enforced read-before-coding and write-after-coding log rules across AGENTS.md, GEMINI.md, .github/copilot-instructions.md, and CLAUDE.md.
- **Bit Rogue Pure Melee LMB & Charged-Only Shurikens** (`decision:20261125124126-bit-rogue-pure-melee`): Removed proj-shuriken projectiles from bit_rogue performPrimaryAttack (and Phantom Clone normal attacks), boosted pure melee range/cone/multipliers + shadow melee echo, and restricted proj-shuriken fan firing exclusively to performChargedAttack.

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
