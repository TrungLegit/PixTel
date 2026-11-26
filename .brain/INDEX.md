# Project Brain Index
*Generated: 2026-11-26T16:10:56.944675+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt (PC · Mobile PWA · Co-op 2–4 Người)** — Khởi đầu tay không tại **Thị Trấn Khởi Nguyên**, săn trang bị **khóa chặt theo Class**, luyện **Ma Trận Luyện

## Main Modules
- **src/** (189 files)
- **.agents/** (38 files)
- **public/** (37 files)
- **(root)/** (14 files)
- **preview for devs/** (8 files)

## Central Nodes
- `file:src/game.ts` (file, 93 links): Added biome/water footsteps on movement, Co-op listener position provider, dash/charge hero_fx spatial metadata, coop_ping, consumable & Lore Tablet SFX.
- `file:src/systems/combat.ts` (file, 49 links): Wired 4-Class combo/charge/Ultimate [Q], 41 Weapon Skills [E], 9-element auras & 28+1 reactions, Boss Phase 1/2/3 hybrid roars, and Boss attack telegraphs to ChiptuneSynth.
- `file:tests/featureTests.ts` (file, 48 links): Added Suite 20 verifying 22050Hz/-3dBFS .ogg/.mp3 bank, ChiptuneSynth procedural + fallback, NPC frequencies, Co-op spatial WebSocket packets, and PWA sw.js (20/20 pass).
- `file:public/sfx/manifest.json` (file, 33 links): Generated metadata manifest for all 16 dual-format (.ogg/.mp3) 22050Hz Mono -3dBFS Retro 16-bit SFX clips.
- `file:src/main.ts` (file, 30 links): Bound Pause modal SFX volume slider and mute button to sfx.setVolume, sfx.toggleMute, and sfx.onChange.
- `file:src/ui/ItemReviewTooltip.ts` (file, 30 links): Triggered subtle rarity-aware item inspection SFX when opening the global item review scroll.
- `file:src/graphics/pixelfxHeroModels.ts` (file, 27 links): Renders latest combat attack poses and weapon rigs with shape-driven equipment, named visuals, cached dash afterimage, and set-bonus aura.
- `file:src/ui/HUD.ts` (file, 26 links): Synchronized #hud-btn-mute visual state and tooltip with persisted localStorage mute/volume settings.
- `file:src/ui/ForgeModal.ts` (file, 23 links): Added rhythmic anvil hammer strikes during Rune Matrix channeling, playFateReroll on Fate Die, and playForgeInfuse on +5 pigment sockets.
- `decision:20261126160929-pixtel-v33-hybrid-retro` (decision, 23 links): Built scripts/convert_sfx.py (22050Hz Mono -3dBFS dual .ogg/.mp3 64kbps + CC0 seed bank), upgraded ChiptuneSynth with 0ms Web Audio procedural 4-Class/9-Element/Reaction/NPC-voice synths + async AudioBuffer loader with zero-lag fallback + mobile auto-unlock/polyphony cap + localS

## Recent Decisions
- **PIXTEL v3.3 Hybrid Retro 16-Bit JRPG SFX Engine, 2D Spatial Co-op Audio & Offline PWA SFX Bank** (`decision:20261126160929-pixtel-v33-hybrid-retro`): Built scripts/convert_sfx.py (22050Hz Mono -3dBFS dual .ogg/.mp3 64kbps + CC0 seed bank), upgraded ChiptuneSynth with 0ms Web Audio procedural 4-Class/9-Element/Reaction/NPC-voice synths + async AudioBuffer loader with zero-lag fallback + mobile auto-unlock/polyphony cap + localS
- **PIXTEL v3.2.6 Zero-Overlap HUD, 16-Bit Contrast, [F11]/[V] Modes, Clean Name Filter & Starter Stash FTUE** (`decision:20261126152606-pixtel-v326-zerooverlap-hud`): Via QA Playtester <-> UI/UX Dev multi-agent teamwork, docked tutorial banner into .hud-left-stack (0 px^2 center overlap), capped/deduped slim top toast stack & synced currentBiome on respawn/teleport, boosted secondary text contrast & added [ ] glyphs, fixed hotbar LMB.../SPACE/
- **Merge latest main with equipment rendering** (`decision:20261126073152-merge-latest-main-with`): Preserve main's named helmet, back-accessory, and boot visuals alongside shape-driven gear and dash echoes; combine clone reverse aim with the dash-angle render input.
- **Render gear from equipment shapes and add dash echo** (`decision:20261126065126-render-gear-from-equipment`): Keep the existing selected-class rig, weapon mapping, and VFX manager; extend the Paper-Doll theme with equipment-shape mappings for helmet, armor, boots, and accessory silhouettes, and draw a single low-alpha cached-hero dash afterimage without changing combat timing or damage.
- **Self-hosted Vietnamese pixel UI font** (`decision:20261125144603-selfhosted-vietnamese-pixel-ui`): Use the OFL-licensed Pixelify Sans variable font from a local npm package as the primary game-wide UI font, removing Google Fonts runtime requests to keep Vietnamese glyph rendering available offline.

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
