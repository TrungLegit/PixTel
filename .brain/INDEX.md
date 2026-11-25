# Project Brain Index
*Generated: 2026-11-25T15:33:38.268825+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt** — Chiến đấu thời gian thực, đánh thức các **Trụ Sắc Màu**, khôi phục bảng màu 16-bit cho vùng đất bị **Nhiễu Trắng** và đánh bại **The Eraser**.

## Main Modules
- **src/** (164 files)
- **.agents/** (38 files)
- **(root)/** (12 files)
- **public/** (3 files)
- **.github/** (2 files)

## Central Nodes
- `file:src/game.ts` (file, 71 links): Added Phase 1 Mobile Smart Auto-Aim & touch actions plus Phase 2 2-4P Co-op state/world/reaction/waypoint/totem/loot synchronization and Y-sorted Remote Paper-Doll rendering.
- `file:src/systems/combat.ts` (file, 43 links): Added Co-op Guest hit/totem forwarding with 0ms local hit-sparks, Multi-Player Enemy/Boss Aggro with Prism Knight Shield threat priority, and reaction/kill broadcasts.
- `file:tests/featureTests.ts` (file, 31 links): Expanded automated test runner to 12 suites covering Phase 1 Mobile Twin-Stick + Smart Auto-Aim and Phase 2 Dedicated WebSocket Co-op Server + Cross-Player 9-Element Reactions + Instanced Loot.
- `file:src/ui/ItemReviewTooltip.ts` (file, 25 links): Added touchscreen Tap-to-Inspect support so mobile players can inspect equipment, materials, and shop items cleanly.
- `file:src/main.ts` (file, 23 links): Wired MobileTouchUI, CoopModalUI, ?room=CODE / ?ws=... URL invite parameters, and PWA Service Worker registration.
- `decision:20261125153029-phase-1-mobile-pwa` (decision, 23 links): Shipped public GitHub Pages CI/CD + fullscreen landscape PWA, Phase 1 Mobile Twin-Stick controls with Smart Auto-Aim and Tap-to-Inspect tooltips, and Phase 2 2-4 Player Co-op (PeerJS WebRTC P2P + Dedicated Node.js WebSocket Room Server) with cross-player 9-element reactions, shar
- `file:src/ui/HUD.ts` (file, 21 links): Added P·COOP / Mobile Touch / Fullscreen toolbar buttons, live Co-op Party Box with 1-tap Teleport, and green teammate dots on Minimap.
- `file:src/ui/ForgeModal.ts` (file, 21 links): Unified Rune Matrix Forge modal with 240x176 geometric animation, substat awakening, +5 8-element pigment infusion, catalyst/pity, and class-filtered crafting.
- `file:src/graphics/pixelfxHeroModels.ts` (file, 16 links): Replaced static attack pose with multi-phase 12fps keyframed poseAt tracks (slash_1/2, cleave, thrust, flurry_1/2, spin, storm, punch_1/2/3, uppercut, cast_1/2/3/heavy/ult, shoot/heavy, beam), quantized aim pitch, charge buckets, shieldGuard stance, and larger bake bounds.
- `file:src/ui/ClassSelect.ts` (file, 13 links): Added Title Screen Co-op button and 1-tap ?room=CODE Co-op Invite Banner supporting both New Character and Save File quick-join.

## Recent Decisions
- **Phase 1 Mobile PWA + Twin-Stick & Phase 2 Dual-Transport 2-4P Co-op + GitHub Pages** (`decision:20261125153029-phase-1-mobile-pwa`): Shipped public GitHub Pages CI/CD + fullscreen landscape PWA, Phase 1 Mobile Twin-Stick controls with Smart Auto-Aim and Tap-to-Inspect tooltips, and Phase 2 2-4 Player Co-op (PeerJS WebRTC P2P + Dedicated Node.js WebSocket Room Server) with cross-player 9-element reactions, shar
- **Bit Rogue Pure Melee LMB & Charged-Only Shurikens** (`decision:20261125124126-bit-rogue-pure-melee`): Removed proj-shuriken projectiles from bit_rogue performPrimaryAttack (and Phantom Clone normal attacks), boosted pure melee range/cone/multipliers + shadow melee echo, and restricted proj-shuriken fan firing exclusively to performChargedAttack.
- **Multi-Frame Monster Animations & Biome-Matched Pixelfx VFX** (`decision:20261125123742-multiframe-monster-animations`): Upgraded all 16 map monsters and bosses with 122 crisp multi-frame pixel sprites, zero-blur movement, Amber/Ruins transform animations, landing-synced Slime leaps and moss pools, 4 bespoke pixelfx modules (sonic-wave, leaf-storm, rainbow-burst, hex-shield), emerald/fire/void grou
- **4-Direction Monster Atlas & Synchronized Enemy Skill VFX** (`decision:20261125121555-4direction-monster-atlas`): Replaced Meadow & Quartz placeholder matrices with 40 extracted 4-direction sprites from the 10 reference sheets (codixel-enemies.png/json) paired with phase-locked skill animations, dash afterimages, shields, Painter-safe directional melee VFX, and moss_pool hazards.
- **Attack Animation & Pixelfx VFX Synchronization** (`decision:20261125115658-attack-animation-pixelfx`): Synchronized 12fps keyframed pixelfx 3D IK hero attack poses, aim pitch, facing priority, Painter flip orientation, chest/weapon-tip VFX origins, startTime pre-warming, and Class Select card previews across bare-handed combat and all 4 classes.

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
- `file:.agents/skills/spritecook-use-assets-in-godot/SKILL.md` (.agents/skills/spritecook-use-assets-in-godot/SKILL.md)
