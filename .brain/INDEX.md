# Project Brain Index
*Generated: 2026-11-26T04:28:47.585671+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt (PC · Mobile PWA · Co-op 2–4 Người)** — Khởi đầu tay không tại **Thị Trấn Khởi Nguyên**, săn trang bị **khóa chặt theo Class**, luyện **Ma Trận Luyện

## Main Modules
- **src/** (178 files)
- **.agents/** (38 files)
- **(root)/** (14 files)
- **preview for devs/** (6 files)
- **public/** (4 files)

## Central Nodes
- `file:src/game.ts` (file, 80 links): Upgraded in-game Bit Rogue Phantom Clone render with cyan-magenta energy tether, +100% ASPD afterimage trail, and automatic opposite-flank pincer blink on every attack.
- `file:src/systems/combat.ts` (file, 52 links): Overhauled Bit Rogue [Q] Phantom Clone cast burst (spawn/poof + sonic-wave + neon spin-slash + haste) and synchronized opposite-flank holographic cyan mirror slashes during cloneTime.
- `file:src/data/items.ts` (file, 40 links): Added 16 core items (CORE_16_ITEMS), 6 materials (CORE_MATERIALS), cursed rarity info, and extended getItemEffectiveStats.
- `file:src/data/worldConfig.ts` (file, 29 links): Added STORAGE_CHEST_POS ({tx:77, ty:82}) right beside Origin Town Spawn Waypoint.
- `file:src/main.ts` (file, 26 links): Wired HomeScreenUI and CutsceneModalUI, booting into home screen and routing Pause title/reset back to Home.
- `file:src/graphics/pixelfxHeroModels.ts` (file, 22 links): Added 8 weapon-family 3D attack poses (overhead_slam, halberd_sweep, iaido_draw, dual_cross_slash, chakram_throw, orb_levitate, staff_whirl, recoil_barrage) and distinct Paladin overhead charge stance for Prism Knight.
- `file:src/ui/ClassSelect.ts` (file, 21 links): Overhauled Bit Rogue SKILL [Q] PREVIEW with shadow-split burst, 3-clone rapid blink-swapping hyper-speed twin slashes (PAL.neon + PAL.cyber), speed lines, and golden crit-hit sparks.
- `file:src/ui/InventoryModal.ts` (file, 20 links): Rebuilt 16-bit 3-column EQUIP/BAG/INFO modal with Paper-doll rails, 2 quick consumables, 4x4 rarity bag, and lore/passive inspector.
- `file:src/data/classes.ts` (file, 18 links): Updated previewFx to fixed [Q] skills and updated skills.skill copy to reflect weapon-specific [E] skills.
- `file:src/world/spawner.ts` (file, 17 links): Boss chests guarantee matching Biome Gacha Key drops; respawned mobs animate in with spawnAnimTime.

## Recent Decisions
- **v3.2 Home Naming Flow, 6 pixelfx Story Cutscenes & Knight Overhead Slam** (`decision:20261126034634-v32-home-naming-flow`): Replaced Knight horizontal thrust charge (too similar to Tinker beam) with two-handed Paladin overhead raise + overhead_slam + PAL.holy/gold heavy-cleave + ground-slam. Boot now starts on Home Screen (Name -> Class Select -> Start -> Intro Cutscene) with 6 replayable Story Cutsce
- **16 Core Items, Event-Driven ItemEffectSystem & 3-Column 16-Bit Inventory UI** (`decision:20261126023154-16-core-items-eventdriven`): Separated 16 core items, 6 materials, and 3-piece sets into src/types/item.ts, src/data/sets.ts, and src/data/items.ts; implemented event-driven combat passives and hidden forge unlock rules in ItemEffectSystem; upgraded InventoryModal to 3-column EQUIP/BAG/INFO 16-bit layout wit
- **Team Rule: Always save, commit & push previews to preview for devs/** (`decision:20261125191722-team-rule-always-save`): Whenever the user requests a visual preview, save GitHub-native Markdown + verified PNGs in preview for devs/ (with ./assets/ relative links and newest-first preview for devs/README.md), update DEV_LOG.md & Project Brain, and automatically commit and push to origin/main so teamma
- **Inventory QoL: Auto-Sell Low-Rarity Guards, 4-Tier Backpack Upgrades & Spawn Stash Chest** (`decision:20261125185843-inventory-qol-autosell-lowrarity`): Auto-Sell converts eligible unenhanced normal equipment straight to Gold on pickup while strictly protecting Hidden, Exotic dropOnly, Seasonal Gacha and +N enhanced gear; 4 purchasable Backpacks expand bagCapacity from 40 to 80; Personal Stash Chest at Origin Town Spawn ({tx:77,t
- **PIXTEL v3.0 Weapon-Driven Skills, Exotic Drop-Only Gear & Seasonal Gacha Architecture** (`decision:20261125183922-pixtel-v30-weapondriven-skills`): Separated character combat into 1 Basic/Charge Attack (LMB), 1 Fixed Class Skill ([Q], always unlocked at 100% Overdrive) and 41 dynamic Weapon-Specific [E] skills; gated 16 skill-altering Exotics strictly to mob/boss drops; removed all 25 farm/waypoint chests leaving only 4 Boss

## Stale Files (Need Re-reading)
- `file:.brain/INDEX.md` (.brain/INDEX.md)
- `file:.brain/edges.jsonl` (.brain/edges.jsonl)
- `file:.brain/nodes.jsonl` (.brain/nodes.jsonl)
- `file:DEV_LOG.md` (DEV_LOG.md)
- `file:src/data/cutscenes.ts` (src/data/cutscenes.ts)
- `file:src/ui/CutsceneModal.ts` (src/ui/CutsceneModal.ts)
- `file:tests/featureTests.ts` (tests/featureTests.ts)
- `file:index.html` (index.html)
- `file:style.css` (style.css)
- `file:src/data/types.ts` (src/data/types.ts)
- `file:src/ui/DialogueModal.ts` (src/ui/DialogueModal.ts)
- `file:src/ui/HUD.ts` (src/ui/HUD.ts)
- `file:src/world/entities.ts` (src/world/entities.ts)
- `file:.agents/skills/codixel/package.json` (.agents/skills/codixel/package.json)
- `file:.agents/skills/pixelfx/SKILL.md` (.agents/skills/pixelfx/SKILL.md)
- `file:.github/workflows/deploy-pages.yml` (.github/workflows/deploy-pages.yml)
- `file:README.md` (README.md)
- `file:docs/ITEM_VISUAL_REPORT.md` (docs/ITEM_VISUAL_REPORT.md)
- `file:preview for devs/2026-11-26-v2.7-all-97-base-items-preview.md` (preview for devs/2026-11-26-v2.7-all-97-base-items-preview.md)
- `file:preview for devs/2026-11-26-v3.0-gameplay-ui-preview.md` (preview for devs/2026-11-26-v3.0-gameplay-ui-preview.md)
- `file:preview for devs/2026-11-26-v3.0-new-items-preview.md` (preview for devs/2026-11-26-v3.0-new-items-preview.md)
- `file:preview for devs/2026-11-26-v3.1-core16-items-inventory-ui-preview.md` (preview for devs/2026-11-26-v3.1-core16-items-inventory-ui-preview.md)
- `file:scripts/build_digits_font.py` (scripts/build_digits_font.py)
- `file:scripts/extract_enemy_sprites.py` (scripts/extract_enemy_sprites.py)
- `file:src/assets/codixel-icons.json` (src/assets/codixel-icons.json)
- `file:src/data/enemies.ts` (src/data/enemies.ts)
- `file:src/data/exoticItems.ts` (src/data/exoticItems.ts)
- `file:src/data/gacha.ts` (src/data/gacha.ts)
- `file:src/data/sets.ts` (src/data/sets.ts)
- `file:src/data/weaponSkills.ts` (src/data/weaponSkills.ts)
- `file:src/graphics/enemyAtlas.ts` (src/graphics/enemyAtlas.ts)
- `file:src/graphics/heroSprites.ts` (src/graphics/heroSprites.ts)
- `file:src/graphics/pixelCraft.ts` (src/graphics/pixelCraft.ts)
- `file:src/graphics/tileRenderer.ts` (src/graphics/tileRenderer.ts)
- `file:src/graphics/worldSprites.ts` (src/graphics/worldSprites.ts)
- `file:src/systems/ItemEffectSystem.ts` (src/systems/ItemEffectSystem.ts)
- `file:src/types/item.ts` (src/types/item.ts)
- `file:src/ui/StorageChestModal.ts` (src/ui/StorageChestModal.ts)
- `file:src/vfx/pixelfx/fx/pixtel/hex-shield.js` (src/vfx/pixelfx/fx/pixtel/hex-shield.js)
- `file:src/vfx/pixelfx/fx/pixtel/leaf-storm.js` (src/vfx/pixelfx/fx/pixtel/leaf-storm.js)
- `file:src/vfx/pixelfx/fx/pixtel/rainbow-burst.js` (src/vfx/pixelfx/fx/pixtel/rainbow-burst.js)
- `file:src/vfx/pixelfx/fx/pixtel/sonic-wave.js` (src/vfx/pixelfx/fx/pixtel/sonic-wave.js)
- `file:scripts/generate_codixel_assets.mjs` (scripts/generate_codixel_assets.mjs)
- `file:src/audio/chiptuneSynth.ts` (src/audio/chiptuneSynth.ts)
- `file:src/data/equipments.ts` (src/data/equipments.ts)
- `file:src/data/hiddenItems.ts` (src/data/hiddenItems.ts)
- `file:src/data/lootTables.ts` (src/data/lootTables.ts)
- `file:src/graphics/itemIcons.ts` (src/graphics/itemIcons.ts)
- `file:src/graphics/paperDoll.ts` (src/graphics/paperDoll.ts)
- `file:src/systems/forgeSystem.ts` (src/systems/forgeSystem.ts)
- `file:src/systems/gachaSystem.ts` (src/systems/gachaSystem.ts)
- `file:src/systems/inventorySystem.ts` (src/systems/inventorySystem.ts)
