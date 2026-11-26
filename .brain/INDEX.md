# Project Brain Index
*Generated: 2026-11-26T15:26:18.014453+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt (PC · Mobile PWA · Co-op 2–4 Người)** — Khởi đầu tay không tại **Thị Trấn Khởi Nguyên**, săn trang bị **khóa chặt theo Class**, luyện **Ma Trận Luyện

## Main Modules
- **src/** (189 files)
- **.agents/** (38 files)
- **(root)/** (14 files)
- **preview for devs/** (8 files)
- **public/** (4 files)

## Central Nodes
- `file:src/game.ts` (file, 92 links): Seeded class-matched Starter Weapon into inv.stash on startNewGame, synced currentBiome on respawn/teleport to stop duplicate biome toasts, bound F11 & V Compact HUD, and drew bordered Town plaques.
- `file:tests/featureTests.ts` (file, 47 links): Added Suite 19 verifying profanity filtering, Starter Stash weapon seeding & class-switch swap, zero duplicate respawn biome toast, Compact HUD toggle, and [ ] pixel font glyphs (19/19 pass).
- `file:src/main.ts` (file, 29 links): Cleaned default hero name usage and wired HUD compact/fullscreen updates.
- `file:src/graphics/pixelfxHeroModels.ts` (file, 27 links): Renders latest combat attack poses and weapon rigs with shape-driven equipment, named visuals, cached dash afterimage, and set-bonus aura.
- `file:src/ui/HUD.ts` (file, 25 links): Added 2-toast deduplicated cap, 'Bia Ký' & '✊ TAY KHÔNG' high-contrast badges, '0 CHÌA' & 'CẦN VK' hotbar labels, fullscreen/compact-HUD sync, and dynamic bare-handed Step 5/6 FTUE guidance.
- `file:src/ui/ClassSelect.ts` (file, 20 links): Applied sanitizePlayerName('Lữ Khách') and compact single-screen layout fitting 1366x640 without vertical scroll.
- `file:DEV_LOG.md` (file, 17 links): Updated project snapshot to PIXTEL v3.2.6 and prepended Multi-Agent QA <-> Dev HUD/UX/FTUE Overhaul log entry.
- `file:style.css` (file, 15 links): Implemented zero-overlap .hud-left-stack, slim 2-max top toast-stack, high-contrast .hud-meta-row & .quest-tracker, 58x56 hotbar slots with opaque .key-cap, 2-row toolbar, and body.hud-compact mode.
- `file:src/vfx/pixelfxTypes.ts` (file, 15 links): Types Paper-Doll gear shapes and the merged named helmet and back-accessory silhouettes.
- `file:src/ui/DialogueModal.ts` (file, 14 links): Standardized fallback hero greeting name via sanitizePlayerName('Lữ Khách').

## Recent Decisions
- **PIXTEL v3.2.6 Zero-Overlap HUD, 16-Bit Contrast, [F11]/[V] Modes, Clean Name Filter & Starter Stash FTUE** (`decision:20261126152606-pixtel-v326-zerooverlap-hud`): Via QA Playtester <-> UI/UX Dev multi-agent teamwork, docked tutorial banner into .hud-left-stack (0 px^2 center overlap), capped/deduped slim top toast stack & synced currentBiome on respawn/teleport, boosted secondary text contrast & added [ ] glyphs, fixed hotbar LMB.../SPACE/
- **Merge latest main with equipment rendering** (`decision:20261126073152-merge-latest-main-with`): Preserve main's named helmet, back-accessory, and boot visuals alongside shape-driven gear and dash echoes; combine clone reverse aim with the dash-angle render input.
- **Render gear from equipment shapes and add dash echo** (`decision:20261126065126-render-gear-from-equipment`): Keep the existing selected-class rig, weapon mapping, and VFX manager; extend the Paper-Doll theme with equipment-shape mappings for helmet, armor, boots, and accessory silhouettes, and draw a single low-alpha cached-hero dash afterimage without changing combat timing or damage.
- **Self-hosted Vietnamese pixel UI font** (`decision:20261125144603-selfhosted-vietnamese-pixel-ui`): Use the OFL-licensed Pixelify Sans variable font from a local npm package as the primary game-wide UI font, removing Google Fonts runtime requests to keep Vietnamese glyph rendering available offline.
- **Resolve current main conflicts without dropping branch history** (`decision:20261125144411-resolve-current-main-conflicts`): Use a merge commit to retain both histories; preserve both DEV_LOG entries and let project-brain tooling compact the graph and regenerate its digest rather than hand-editing graph files.

## Stale Files (Need Re-reading)
- `file:.brain/nodes.jsonl` (.brain/nodes.jsonl)
- `file:.brain/INDEX.md` (.brain/INDEX.md)
- `file:.brain/edges.jsonl` (.brain/edges.jsonl)
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
