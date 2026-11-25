# Project Brain Index
*Generated: 2026-11-25T15:42:55.048014+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt** — Chiến đấu thời gian thực, đánh thức các **Trụ Sắc Màu**, khôi phục bảng màu 16-bit cho vùng đất bị **Nhiễu Trắng** và đánh bại **The Eraser**.

## Main Modules
- **src/** (165 files)
- **.agents/** (38 files)
- **(root)/** (14 files)
- **public/** (4 files)
- **.brain/** (3 files)

## Central Nodes
- `file:src/game.ts` (file, 72 links): Merged Hidden Relics support with Phase 1 Mobile Smart Auto-Aim & touch actions plus Phase 2 2-4P Co-op state/world/reaction/waypoint/loot sync.
- `file:src/systems/combat.ts` (file, 44 links): Merged Hidden Boss Relics drops with Co-op Guest hit/totem forwarding, Multi-Player Enemy/Boss Aggro, and reaction/kill broadcasts.
- `file:tests/featureTests.ts` (file, 30 links): Expanded automated test runner to 13 suites covering Hidden Relics, Phase 1 Mobile Twin-Stick + Smart Auto-Aim, and Phase 2 Dedicated WebSocket Co-op Server.
- `file:src/ui/ItemReviewTooltip.ts` (file, 25 links): Merged masked Hidden Relic tooltip state with touchscreen Tap-to-Inspect support on mobile devices.
- `file:src/main.ts` (file, 23 links): Wired local Pixelify Sans font, MobileTouchUI, CoopModalUI, ?room=CODE / ?ws=... URL invite parameters, and PWA Service Worker registration.
- `file:src/ui/HUD.ts` (file, 20 links): Added P·COOP / Mobile Touch / Fullscreen toolbar buttons, live Co-op Party Box with 1-tap Teleport, and green teammate dots on Minimap.
- `file:src/ui/ClassSelect.ts` (file, 18 links): Merged epic 16-bit pixel-grid title screen with Title Co-op button and 1-tap ?room=CODE Co-op Invite Banner.
- `file:style.css` (file, 14 links): Added 16-bit styling for Mobile Twin-Stick Joystick & Action Cluster, Portrait Rotate Banner, HUD Party Box, Co-op Lobby Modal, and responsive phone landscape layouts.
- `file:DEV_LOG.md` (file, 13 links): Updated current project snapshot to PIXTEL v2.7 and prepended Phase 1 Mobile PWA + Phase 2 Co-op + GitHub Pages development log entry.
- `file:index.html` (file, 13 links): Added PWA manifest/icon tags, safe-area landscape viewport meta, Mobile Twin-Stick touch overlay, HUD Party Box, and Co-op Lobby modal (#modal-coop).

## Recent Decisions
- **Phase 1 Mobile PWA + Twin-Stick & Phase 2 Dual-Transport 2-4P Co-op + GitHub Pages** (`decision:20261125154018-phase-1-mobile-pwa`): Shipped public GitHub Pages CI/CD + fullscreen landscape PWA, Phase 1 Mobile Twin-Stick controls with Smart Auto-Aim and Tap-to-Inspect tooltips, and Phase 2 2-4 Player Co-op (PeerJS WebRTC P2P + Dedicated Node.js WebSocket Room Server) with cross-player 9-element reactions, shar
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
