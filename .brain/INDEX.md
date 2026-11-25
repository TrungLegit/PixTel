# Project Brain Index
*Generated: 2026-11-25T16:10:59.945122+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt (PC · Mobile PWA · Co-op 2–4 Người)** — Khởi đầu tay không tại **Thị Trấn Khởi Nguyên**, săn trang bị **khóa chặt theo Class**, luyện **Ma Trận Luyện

## Main Modules
- **src/** (165 files)
- **.agents/** (38 files)
- **(root)/** (14 files)
- **public/** (4 files)
- **.brain/** (3 files)

## Central Nodes
- `file:src/game.ts` (file, 74 links): Merged v2.7 Mobile Auto-Aim + Co-op sync with loadSavedGame auto-unequip, getValidEquippedWeapon aura checks, and _buildLocalCoopSnapshot weapon validation.
- `file:src/data/types.ts` (file, 53 links): Added ruins_weapon variant to ClassRewardKey union.
- `file:src/systems/combat.ts` (file, 45 links): Gated weapon element resolution, LMB primary/charged attacks, and [E] skills with hasValidEquippedWeapon while preserving v2.7 Co-op hooks.
- `file:src/data/items.ts` (file, 37 links): Hardened canClassEquip for weapon slot, added ruins_weapon ClassRewardKey, and locked fallback starter weapon to prism_knight.
- `file:tests/featureTests.ts` (file, 30 links): Merged 13/13 v2.7 test suites (Hidden Relics, Mobile Twin-Stick, Co-op WS Server) with strict class-locked weapon and ruins_weapon tests.
- `file:src/systems/inventorySystem.ts` (file, 24 links): Added getValidEquippedWeapon/hasValidEquippedWeapon guards across bonuses, passives, set effects, stats, and auto-unequip.
- `file:src/ui/HUD.ts` (file, 21 links): Merged v2.7 Co-op party roster & toolbar with getValidEquippedWeapon bare-handed/skill-lock display.
- `file:src/graphics/pixelfxHeroModels.ts` (file, 17 links): Prioritized wpn_void_scythe renderer branch ahead of halberd check for Bit Rogue scythe visuals.
- `file:src/data/equipments.ts` (file, 17 links): Locked all 8 former universal weapons strictly to prism_knight (7 swords/axes/mauls) or bit_rogue (wpn_void_scythe).
- `file:DEV_LOG.md` (file, 14 links): Logged new PIXTEL v2.7 gameplay-demo.gif/mp4 recording and README media refresh.

## Recent Decisions
- **Phase 1 Mobile PWA + Twin-Stick & Phase 2 Dual-Transport 2-4P Co-op + GitHub Pages** (`decision:20261125154018-phase-1-mobile-pwa`): Shipped public GitHub Pages CI/CD + fullscreen landscape PWA, Phase 1 Mobile Twin-Stick controls with Smart Auto-Aim and Tap-to-Inspect tooltips, and Phase 2 2-4 Player Co-op (PeerJS WebRTC P2P + Dedicated Node.js WebSocket Room Server) with cross-player 9-element reactions, shar
- **Self-hosted Vietnamese pixel UI font** (`decision:20261125144603-selfhosted-vietnamese-pixel-ui`): Use the OFL-licensed Pixelify Sans variable font from a local npm package as the primary game-wide UI font, removing Google Fonts runtime requests to keep Vietnamese glyph rendering available offline.
- **Resolve current main conflicts without dropping branch history** (`decision:20261125144411-resolve-current-main-conflicts`): Use a merge commit to retain both histories; preserve both DEV_LOG entries and let project-brain tooling compact the graph and regenerate its digest rather than hand-editing graph files.
- **Block-pixel logo lettering** (`decision:20261125143734-blockpixel-logo-lettering`): Broaden the PIXTEL canvas wordmark into a chunky 7x7 bitmap alphabet inspired by the user's Vietnamese Minecraft font reference, while keeping custom glyphs and the current chroma crest.
- **Hidden Items System (Craft-Only & Boss-Drop Only)** (`decision:20261125143028-hidden-items-system-craftonly`): Added 8 isHidden items (4 craft_only, 4 boss_only) strictly isolated from shops/chests/normal mobs, masked as ??? until discovered, permanently unlocked in localStorage, and integrated with combat passives, VFX, and Paper-Doll shimmer.

## Stale Files (Need Re-reading)
- `file:.brain/INDEX.md` (.brain/INDEX.md)
- `file:.brain/edges.jsonl` (.brain/edges.jsonl)
- `file:.brain/nodes.jsonl` (.brain/nodes.jsonl)
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
- `file:.agents/skills/spritecook-use-assets-in-godot/SKILL.md` (.agents/skills/spritecook-use-assets-in-godot/SKILL.md)
- `file:.agents/skills/spritecook-use-assets-in-godot/agents/openai.yaml` (.agents/skills/spritecook-use-assets-in-godot/agents/openai.yaml)
- `file:.agents/skills/spritecook-use-dual-grid-tilesets/SKILL.md` (.agents/skills/spritecook-use-dual-grid-tilesets/SKILL.md)
- `file:.agents/skills/spritecook-use-presets/SKILL.md` (.agents/skills/spritecook-use-presets/SKILL.md)
- `file:.agents/skills/spritecook-workflow-essentials/LICENSE` (.agents/skills/spritecook-workflow-essentials/LICENSE)
- `file:.agents/skills/spritecook-workflow-essentials/SKILL.md` (.agents/skills/spritecook-workflow-essentials/SKILL.md)
- `file:.github/copilot-instructions.md` (.github/copilot-instructions.md)
- `file:.github/workflows/deploy-pages.yml` (.github/workflows/deploy-pages.yml)
- `file:.gitignore` (.gitignore)
