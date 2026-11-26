# Project Brain Index
*Generated: 2026-11-26T03:34:09.178276+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt (PC · Mobile PWA · Co-op 2–4 Người)** — Khởi đầu tay không tại **Thị Trấn Khởi Nguyên**, săn trang bị **khóa chặt theo Class**, luyện **Ma Trận Luyện

## Main Modules
- **src/** (180 files)
- **.agents/** (38 files)
- **(root)/** (14 files)
- **preview for devs/** (6 files)
- **public/** (4 files)

## Central Nodes
- `file:src/vfx/vfxManager.ts` (file, 83 links): Registers 5 bespoke pixtel pixelfx effects & Core-16 passive presets.
- `file:src/game.ts` (file, 78 links): Adds non-destructive ?demo=v31 showcase loader & real-time set aura recalc sync.
- `file:src/data/worldConfig.ts` (file, 29 links): Added STORAGE_CHEST_POS ({tx:77, ty:82}) right beside Origin Town Spawn Waypoint.
- `file:src/ui/HUD.ts` (file, 28 links): Updated HUD bag slot to show dynamic bagCapacity, upgraded tiered Backpack codixel icon, and Auto-Sell + Stash info in hover tooltip.
- `file:src/vfx/uiRarityFx.ts` (file, 24 links): Uses pixtel/cursed-aura for cursed rarity slots and removes 24px icon cap.
- `file:src/ui/InventoryModal.ts` (file, 21 links): Ornate 16-bit EQUIP/BAG/INFO UI with 44/64px icons and golden PASSIVE / crimson CURSE plaques.
- `file:src/graphics/pixelfxHeroModels.ts` (file, 21 links): Maps Core-16 3D gear themes and renders dual-buffer pixtel/set-aura on hero.
- `file:src/world/spawner.ts` (file, 17 links): Boss chests guarantee matching Biome Gacha Key drops; respawned mobs animate in with spawnAnimTime.
- `file:src/graphics/codixelAtlas.ts` (file, 15 links): Prioritizes HD 48x48 core16-items.png frames before 24x24 codixel-icons fallback.
- `file:src/world/interactables.ts` (file, 14 links): Added Town Spawn Personal Stash Chest (stash_chest) [F] interactable at STORAGE_CHEST_POS.

## Recent Decisions
- **PIXTEL v3.1.1 HD Sprite & Pixelfx Overhaul** (`decision:20261126033344-pixtel-v311-hd-sprite`): Replaced 22x22 procedural icons with 48x48 sprites extracted from Reference Image 1, authored 5 check.mjs-verified dual-buffer pixelfx effects, upgraded Paper-Doll set auras & ornate 16-bit Inventory UI, and added ?demo=v31 showcase mode.
- **16 Core Items, Event-Driven ItemEffectSystem & 3-Column 16-Bit Inventory UI** (`decision:20261126023154-16-core-items-eventdriven`): Separated 16 core items, 6 materials, and 3-piece sets into src/types/item.ts, src/data/sets.ts, and src/data/items.ts; implemented event-driven combat passives and hidden forge unlock rules in ItemEffectSystem; upgraded InventoryModal to 3-column EQUIP/BAG/INFO 16-bit layout wit
- **Team Rule: Always save, commit & push previews to preview for devs/** (`decision:20261125191722-team-rule-always-save`): Whenever the user requests a visual preview, save GitHub-native Markdown + verified PNGs in preview for devs/ (with ./assets/ relative links and newest-first preview for devs/README.md), update DEV_LOG.md & Project Brain, and automatically commit and push to origin/main so teamma
- **Inventory QoL: Auto-Sell Low-Rarity Guards, 4-Tier Backpack Upgrades & Spawn Stash Chest** (`decision:20261125185843-inventory-qol-autosell-lowrarity`): Auto-Sell converts eligible unenhanced normal equipment straight to Gold on pickup while strictly protecting Hidden, Exotic dropOnly, Seasonal Gacha and +N enhanced gear; 4 purchasable Backpacks expand bagCapacity from 40 to 80; Personal Stash Chest at Origin Town Spawn ({tx:77,t
- **PIXTEL v3.0 Weapon-Driven Skills, Exotic Drop-Only Gear & Seasonal Gacha Architecture** (`decision:20261125183922-pixtel-v30-weapondriven-skills`): Separated character combat into 1 Basic/Charge Attack (LMB), 1 Fixed Class Skill ([Q], always unlocked at 100% Overdrive) and 41 dynamic Weapon-Specific [E] skills; gated 16 skill-altering Exotics strictly to mob/boss drops; removed all 25 farm/waypoint chests leaving only 4 Boss

## Stale Files (Need Re-reading)
- `file:.brain/nodes.jsonl` (.brain/nodes.jsonl)
- `file:DEV_LOG.md` (DEV_LOG.md)
- `file:index.html` (index.html)
- `file:preview for devs/README.md` (preview for devs/README.md)
- `file:src/data/items.ts` (src/data/items.ts)
- `file:src/graphics/itemIcons.ts` (src/graphics/itemIcons.ts)
- `file:src/main.ts` (src/main.ts)
- `file:src/systems/ItemEffectSystem.ts` (src/systems/ItemEffectSystem.ts)
- `file:style.css` (style.css)
- `file:.brain/INDEX.md` (.brain/INDEX.md)
- `file:.brain/edges.jsonl` (.brain/edges.jsonl)
- `file:.agents/skills/codixel/package.json` (.agents/skills/codixel/package.json)
- `file:.agents/skills/pixelfx/SKILL.md` (.agents/skills/pixelfx/SKILL.md)
- `file:.github/workflows/deploy-pages.yml` (.github/workflows/deploy-pages.yml)
- `file:README.md` (README.md)
- `file:docs/ITEM_VISUAL_REPORT.md` (docs/ITEM_VISUAL_REPORT.md)
- `file:preview for devs/2026-11-26-v2.7-all-97-base-items-preview.md` (preview for devs/2026-11-26-v2.7-all-97-base-items-preview.md)
- `file:preview for devs/2026-11-26-v3.0-gameplay-ui-preview.md` (preview for devs/2026-11-26-v3.0-gameplay-ui-preview.md)
- `file:preview for devs/2026-11-26-v3.0-new-items-preview.md` (preview for devs/2026-11-26-v3.0-new-items-preview.md)
- `file:scripts/build_digits_font.py` (scripts/build_digits_font.py)
- `file:scripts/extract_enemy_sprites.py` (scripts/extract_enemy_sprites.py)
- `file:scripts/generate_codixel_assets.mjs` (scripts/generate_codixel_assets.mjs)
- `file:src/assets/codixel-icons.json` (src/assets/codixel-icons.json)
- `file:src/audio/chiptuneSynth.ts` (src/audio/chiptuneSynth.ts)
- `file:src/data/enemies.ts` (src/data/enemies.ts)
- `file:src/data/equipments.ts` (src/data/equipments.ts)
- `file:src/data/exoticItems.ts` (src/data/exoticItems.ts)
- `file:src/data/gacha.ts` (src/data/gacha.ts)
- `file:src/data/hiddenItems.ts` (src/data/hiddenItems.ts)
- `file:src/data/lootTables.ts` (src/data/lootTables.ts)
- `file:src/data/types.ts` (src/data/types.ts)
- `file:src/data/weaponSkills.ts` (src/data/weaponSkills.ts)
- `file:src/graphics/enemyAtlas.ts` (src/graphics/enemyAtlas.ts)
- `file:src/graphics/heroSprites.ts` (src/graphics/heroSprites.ts)
- `file:src/graphics/paperDoll.ts` (src/graphics/paperDoll.ts)
- `file:src/graphics/pixelCraft.ts` (src/graphics/pixelCraft.ts)
- `file:src/graphics/tileRenderer.ts` (src/graphics/tileRenderer.ts)
- `file:src/graphics/worldSprites.ts` (src/graphics/worldSprites.ts)
- `file:src/systems/combat.ts` (src/systems/combat.ts)
- `file:src/systems/forgeSystem.ts` (src/systems/forgeSystem.ts)
- `file:src/systems/gachaSystem.ts` (src/systems/gachaSystem.ts)
- `file:src/systems/inventorySystem.ts` (src/systems/inventorySystem.ts)
- `file:src/ui/ForgeModal.ts` (src/ui/ForgeModal.ts)
- `file:src/ui/GachaModal.ts` (src/ui/GachaModal.ts)
- `file:src/ui/ItemReviewTooltip.ts` (src/ui/ItemReviewTooltip.ts)
- `file:src/ui/StorageChestModal.ts` (src/ui/StorageChestModal.ts)
- `file:src/vfx/pixelfx/fx/pixtel/hex-shield.js` (src/vfx/pixelfx/fx/pixtel/hex-shield.js)
- `file:src/vfx/pixelfx/fx/pixtel/leaf-storm.js` (src/vfx/pixelfx/fx/pixtel/leaf-storm.js)
- `file:src/vfx/pixelfx/fx/pixtel/rainbow-burst.js` (src/vfx/pixelfx/fx/pixtel/rainbow-burst.js)
- `file:src/vfx/pixelfx/fx/pixtel/sonic-wave.js` (src/vfx/pixelfx/fx/pixtel/sonic-wave.js)
- `file:src/world/entities.ts` (src/world/entities.ts)
- `file:tests/featureTests.ts` (tests/featureTests.ts)
- `file:src/assets/codixel-enemies.json` (src/assets/codixel-enemies.json)
- `file:src/assets/codixel-paperdoll.json` (src/assets/codixel-paperdoll.json)
- `file:.agents/skills/codixel/LICENSE` (.agents/skills/codixel/LICENSE)
- `file:.agents/skills/codixel/SKILL.md` (.agents/skills/codixel/SKILL.md)
- `file:.agents/skills/codixel/core/pixel.js` (.agents/skills/codixel/core/pixel.js)
- `file:.agents/skills/pixelfx/LICENSE` (.agents/skills/pixelfx/LICENSE)
- `file:.agents/skills/pixelfx/references/AUTHORING.md` (.agents/skills/pixelfx/references/AUTHORING.md)
