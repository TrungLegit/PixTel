# Project Brain Index
*Generated: 2026-11-26T07:35:49.890767+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt (PC · Mobile PWA · Co-op 2–4 Người)** — Khởi đầu tay không tại **Thị Trấn Khởi Nguyên**, săn trang bị **khóa chặt theo Class**, luyện **Ma Trận Luyện

## Main Modules
- **src/** (188 files)
- **.agents/** (38 files)
- **(root)/** (14 files)
- **preview for devs/** (7 files)
- **public/** (4 files)

## Central Nodes
- `file:src/game.ts` (file, 86 links): Supplies current dash direction to player and clone Paper-Doll render calls and uses reverse clone aim during attacks.
- `file:src/graphics/pixelfxHeroModels.ts` (file, 27 links): Renders latest combat attack poses and weapon rigs with shape-driven equipment, named visuals, cached dash afterimage, and set-bonus aura.
- `file:DEV_LOG.md` (file, 15 links): Newest-first development log records latest main merge while preserving the gear-rendering entry and prior history.
- `file:src/vfx/pixelfxTypes.ts` (file, 15 links): Types Paper-Doll gear shapes and the merged named helmet and back-accessory silhouettes.
- `file:src/ui/GachaModal.ts` (file, 11 links): const RARITY_RANK: Record<Rarity, number> = {
- `file:src/ui/CutsceneModal.ts` (file, 10 links): STORY_CUTSCENE_BY_ID,
- `file:src/systems/ItemEffectSystem.ts` (file, 9 links): export type PassiveDamageFn = (
- `file:src/ui/HomeScreen.ts` (file, 9 links): const LAST_NAME_KEY = "pixtel_last_player_name";
- `decision:20261125144603-selfhosted-vietnamese-pixel-ui` (decision, 9 links): Use the OFL-licensed Pixelify Sans variable font from a local npm package as the primary game-wide UI font, removing Google Fonts runtime requests to keep Vietnamese glyph rendering available offline.
- `file:src/data/weaponSkills.ts` (file, 8 links): export interface WeaponSkillDef {

## Recent Decisions
- **Merge latest main with equipment rendering** (`decision:20261126073152-merge-latest-main-with`): Preserve main's named helmet, back-accessory, and boot visuals alongside shape-driven gear and dash echoes; combine clone reverse aim with the dash-angle render input.
- **Render gear from equipment shapes and add dash echo** (`decision:20261126065126-render-gear-from-equipment`): Keep the existing selected-class rig, weapon mapping, and VFX manager; extend the Paper-Doll theme with equipment-shape mappings for helmet, armor, boots, and accessory silhouettes, and draw a single low-alpha cached-hero dash afterimage without changing combat timing or damage.
- **Self-hosted Vietnamese pixel UI font** (`decision:20261125144603-selfhosted-vietnamese-pixel-ui`): Use the OFL-licensed Pixelify Sans variable font from a local npm package as the primary game-wide UI font, removing Google Fonts runtime requests to keep Vietnamese glyph rendering available offline.
- **Resolve current main conflicts without dropping branch history** (`decision:20261125144411-resolve-current-main-conflicts`): Use a merge commit to retain both histories; preserve both DEV_LOG entries and let project-brain tooling compact the graph and regenerate its digest rather than hand-editing graph files.
- **Block-pixel logo lettering** (`decision:20261125143734-blockpixel-logo-lettering`): Broaden the PIXTEL canvas wordmark into a chunky 7x7 bitmap alphabet inspired by the user's Vietnamese Minecraft font reference, while keeping custom glyphs and the current chroma crest.

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
- `file:README.md` (README.md)
- `file:index.html` (index.html)
- `file:package-lock.json` (package-lock.json)
- `file:package.json` (package.json)
- `file:scripts/extract_enemy_sprites.py` (scripts/extract_enemy_sprites.py)
