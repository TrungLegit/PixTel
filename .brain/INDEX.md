# Project Brain Index
*Generated: 2026-11-25T19:17:23.576445+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt (PC · Mobile PWA · Co-op 2–4 Người)** — Khởi đầu tay không tại **Thị Trấn Khởi Nguyên**, săn trang bị **khóa chặt theo Class**, luyện **Ma Trận Luyện

## Main Modules
- **src/** (171 files)
- **.agents/** (38 files)
- **(root)/** (14 files)
- **public/** (4 files)
- **.brain/** (3 files)

## Central Nodes
- `file:src/game.ts` (file, 78 links): Rendered Town STASH CHEST beside Spawn, wired [F] stash modal, integrated live ground-loot Auto-Sell and dynamic bagCapacity magnet + SaveDataV2 persistence.
- `file:src/data/types.ts` (file, 56 links): Added AutoSellMode, AutoSellSettings and optional bagCapacity/backpackTier/stash/autoSell fields to SaveDataV2.
- `file:src/systems/combat.ts` (file, 48 links): Implemented 41 weapon-driven [E] skills, unlocked [Q] as fixed Class skill, wired 12 Exotic/Seasonal combat mods with ICDs, pack aggro alerts and hardcore threat scaling.
- `file:src/data/items.ts` (file, 39 links): Merged EXOTIC_ITEMS, GACHA_KEY_ITEMS and SEASONAL_ITEMS into ITEMS while isolating dropOnly and seasonal items from pickRandomEquipByRarity.
- `file:src/systems/inventorySystem.ts` (file, 34 links): Added Auto-Sell low-rarity equipment (with Exotic/Hidden/Seasonal/+N guards), 4-tier Backpack upgrades (40->80 slots), and 80-slot Personal Stash chest with save persistence.
- `file:tests/featureTests.ts` (file, 33 links): Added Suite 16 covering Auto-Sell low-rarity guards, 4-tier Backpack upgrades (40->80) and Spawn Personal Stash Chest persistence.
- `file:src/data/worldConfig.ts` (file, 29 links): Added STORAGE_CHEST_POS ({tx:77, ty:82}) right beside Origin Town Spawn Waypoint.
- `file:src/ui/HUD.ts` (file, 28 links): Updated HUD bag slot to show dynamic bagCapacity, upgraded tiered Backpack codixel icon, and Auto-Sell + Stash info in hover tooltip.
- `file:src/ui/ItemReviewTooltip.ts` (file, 27 links): Resolved stashed item UIDs via inv.findInStash so hovering items inside Personal Storage Chest shows full braided-rope inspection cards.
- `file:src/main.ts` (file, 25 links): Instantiated and wired StorageChestModalUI into onModalChange for modal === 'stash'.

## Recent Decisions
- **Team Rule: Always save, commit & push previews to preview for devs/** (`decision:20261125191722-team-rule-always-save`): Whenever the user requests a visual preview, save GitHub-native Markdown + verified PNGs in preview for devs/ (with ./assets/ relative links and newest-first preview for devs/README.md), update DEV_LOG.md & Project Brain, and automatically commit and push to origin/main so teamma
- **Inventory QoL: Auto-Sell Low-Rarity Guards, 4-Tier Backpack Upgrades & Spawn Stash Chest** (`decision:20261125185843-inventory-qol-autosell-lowrarity`): Auto-Sell converts eligible unenhanced normal equipment straight to Gold on pickup while strictly protecting Hidden, Exotic dropOnly, Seasonal Gacha and +N enhanced gear; 4 purchasable Backpacks expand bagCapacity from 40 to 80; Personal Stash Chest at Origin Town Spawn ({tx:77,t
- **PIXTEL v3.0 Weapon-Driven Skills, Exotic Drop-Only Gear & Seasonal Gacha Architecture** (`decision:20261125183922-pixtel-v30-weapondriven-skills`): Separated character combat into 1 Basic/Charge Attack (LMB), 1 Fixed Class Skill ([Q], always unlocked at 100% Overdrive) and 41 dynamic Weapon-Specific [E] skills; gated 16 skill-altering Exotics strictly to mob/boss drops; removed all 25 farm/waypoint chests leaving only 4 Boss
- **Complete 19-Monster 4-Biome Sprite Atlas (+9 Amber/Ruins Models)** (`decision:20261125172509-complete-19monster-4biome-sprite`): Completed codixel-enemies.png/json to 19 monsters/bosses (230 frames) by extracting 9 new Amber Mines & Blank Ruins reference sheets, preserving existing IDs for Save/Quest compatibility while adding amber_warrior, null_knight, and void_gatekeeper with biome-native WORLD_CAMPS an
- **Pixel Backpack & Skill Icon Hotbar + 29 Farm Zones + Bespoke 3D Gear** (`decision:20261125170423-pixel-backpack-skill`): Moved Inventory access to a pixel Backpack button at front of bottom bar, converted LMB/E/Q/SPC to codixel pixel icons with hover-only tooltips, added 16 fast-respawn farm camps (29 total), and designed bespoke codixel + 3D pixelfx special equipment models.

## Stale Files (Need Re-reading)
- `file:.brain/INDEX.md` (.brain/INDEX.md)
- `file:.brain/edges.jsonl` (.brain/edges.jsonl)
- `file:.brain/nodes.jsonl` (.brain/nodes.jsonl)
- `file:src/assets/codixel-icons.json` (src/assets/codixel-icons.json)
- `file:src/assets/codixel-enemies.json` (src/assets/codixel-enemies.json)
- `file:src/assets/codixel-paperdoll.json` (src/assets/codixel-paperdoll.json)
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
