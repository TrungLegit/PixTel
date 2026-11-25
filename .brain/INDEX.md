# Project Brain Index
*Generated: 2026-11-25T10:36:18.591281+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt** — Chiến đấu thời gian thực, đánh thức các **Trụ Sắc Màu**, khôi phục bảng màu 16-bit cho vùng đất bị **Nhiễu Trắng** và đánh bại **The Eraser**.

## Main Modules
- **src/** (138 files)
- **.agents/** (38 files)
- **(root)/** (12 files)
- **.github/** (1 files)

## Central Nodes
- `file:src/vfx/pixelfx/core/index.js` (file, 101 links): pixelfx core: everything an effect imports comes from here.
- `file:src/game.ts` (file, 49 links): Wired level-up +3 stat points, allocateStat/respecStats, Class Altar unequip, fast travel boss lock block, Boss Arena perimeter barrier enforcement & rendering, enemy LV tags, and dynamic equipped hero sprites.
- `file:src/data/types.ts` (file, 26 links): Added StatAllocKey, AllocatedStats, GearVisualTier, HeroVisualLoadout, WeaponSkillVariant, ChipUltVariant, ClassRewardKey, ActiveBossLock, ItemDef class locks/skill grants, and SaveData v3 fields.
- `file:src/systems/combat.ts` (file, 23 links): Added bare-handed punch/uppercut attacks, weapon-gated [E] variants, chip-gated [Q] scaling, armor/ring passives, smooth DEF + level-gap penalty, boss lock-in trigger, and harder boss AI phases.
- `file:src/graphics/pixelSprites.ts` (file, 18 links): Added cached getHeroDynamic(classId, loadout, frame) sprite compiler for live paper-doll and world rendering.
- `file:src/data/worldConfig.ts` (file, 18 links): Defined BOSS_ARENAS circular territory seal bounds and radii for Blight Root, Gilded Null, and The Eraser.
- `file:src/data/items.ts` (file, 15 links): Replaced generic gear with 20 class-locked Weapons, 20 class-locked Armors, skill-granting Rings/Pix-Chips, Matrix Rune catalyst mat_matrix_rune, resolveClassReward, canClassEquip, bonus substats, and class-biased drops.
- `file:src/ui/ForgeModal.ts` (file, 13 links): Rebuilt Blacksmith UI into animated Ma Tran Luyen Khi rune array canvas with channeling convergence, catalyst toggle, pity tracker, before/after + bonus substat readout, and class-filtered Craft tab.
- `file:src/vfx/pixelfx/core/color.js` (file, 13 links): Colors are 32-bit integers laid out like ImageData bytes (R, G, B, A in memory),
- `file:src/systems/forgeSystem.ts` (file, 12 links): Implemented Matrix Forge catalyst boost (+15%), failure pity resonance (+8%, max +40% with gear preserved), and random bonus substat awakening on +1 success.

## Recent Decisions
- **Hardcore RPG Progression, Rune Matrix Forge, Class Gear Lock & Boss Territory Seal** (`decision:20261125103549-hardcore-rpg-progression-rune`): Overhauled PIXTEL with unarmed start, class-exclusive equipment that visually updates 24x24 sprites and unlocks [E]/[Q] skills + passives, animated Matrix Transmutation Forge with catalyst + pity + substats, +3 Stat Points per level with 100G respec, level-gap damage scaling, and
- **Upgraded hero class models, Dual-Grid map, and props using Codixel and SpriteCook skills** (`decision:20261125055839-upgraded-hero-class-models`): Introduced pixelCraft.ts, heroSprites.ts, and worldSprites.ts applying Codixel hue-shifted ramps, rimLight, selective outlines, height-field rock/foliage/crystal builders, and SpriteCook 15-piece Dual-Grid autotiling for restoration frontiers, calm 8x8 flagstones, animated water/
- **Installed codixel and SpriteCook workspace skills in .agents/skills** (`decision:20261125053102-installed-codixel-and-spritecook`): Installed mankidev/codixel (SKILL.md + core/pixel.js with local CommonJS package.json interop, excluding 20MB README showcase media) and all 10 modular skills from SpriteCook/skills into .agents/skills/.
- **Installed patch-gg/pixelfx workspace skill in .agents/skills/pixelfx** (`decision:20261125052710-installed-patchggpixelfx-workspace-skill`): Installed the pixelfx skill (SKILL.md, AUTHORING.md, CATALOG.md, and zero-dependency Node CLI tools) under .agents/skills/pixelfx/, wired directly to src/vfx/pixelfx/core and src/vfx/pixelfx/fx, and git-ignored generated records/ and sheets/ outputs.
- **PIXTEL v2 Open-World Vite + TypeScript Architecture** (`decision:20261125042128-pixtel-v2-openworld-vite`): Upgraded PIXTEL from v1 single-arena JS into a modular Vite + TypeScript 160x160 seamless open-world RPG with Origin Town, 4 Biomes, 9 Chroma Waypoints with Fast Travel, camps/chests/mining, 4 classes with hold-charge & Stamina wheel, 5-rarity loot beams, +0..+10 Forge, 10 quests

## Stale Files (Need Re-reading)
- `file:.github/copilot-instructions.md` (.github/copilot-instructions.md)
- `file:AGENTS.md` (AGENTS.md)
- `file:GEMINI.md` (GEMINI.md)
- `file:package-lock.json` (package-lock.json)
- `file:package.json` (package.json)
- `file:src/graphics/colorRestoration.ts` (src/graphics/colorRestoration.ts)
- `file:src/main.ts` (src/main.ts)
- `file:src/vfx/fxAtlas.ts` (src/vfx/fxAtlas.ts)
- `file:src/vfx/pixelfx/fx/pixtel/boss-telegraph.js` (src/vfx/pixelfx/fx/pixtel/boss-telegraph.js)
- `file:src/vfx/pixelfx/fx/pixtel/chroma-vortex.js` (src/vfx/pixelfx/fx/pixtel/chroma-vortex.js)
- `file:src/vfx/pixelfx/fx/pixtel/color-wave.js` (src/vfx/pixelfx/fx/pixtel/color-wave.js)
- `file:src/vfx/pixelfx/fx/pixtel/compile-turret.js` (src/vfx/pixelfx/fx/pixtel/compile-turret.js)
- `file:src/vfx/pixelfx/fx/pixtel/frame-skip.js` (src/vfx/pixelfx/fx/pixtel/frame-skip.js)
- `file:src/vfx/pixelfx/fx/pixtel/overdrive-aura.js` (src/vfx/pixelfx/fx/pixtel/overdrive-aura.js)
- `file:src/vfx/pixelfx/fx/pixtel/prism-beam.js` (src/vfx/pixelfx/fx/pixtel/prism-beam.js)
- `file:src/vfx/pixelfx/fx/pixtel/prism-storm.js` (src/vfx/pixelfx/fx/pixtel/prism-storm.js)
- `file:src/vfx/pixelfxTypes.ts` (src/vfx/pixelfxTypes.ts)
- `file:src/vfx/vfxManager.ts` (src/vfx/vfxManager.ts)
- `file:src/world/interactables.ts` (src/world/interactables.ts)
- `file:tsconfig.json` (tsconfig.json)
- `file:vite.config.ts` (vite.config.ts)

## Nodes Needing Summary
- `file:package-lock.json` (package-lock.json)
- `file:src/graphics/colorRestoration.ts` (src/graphics/colorRestoration.ts)
- `file:src/main.ts` (src/main.ts)
- `file:src/vfx/fxAtlas.ts` (src/vfx/fxAtlas.ts)
- `file:src/vfx/pixelfx/fx/explosions/dirt-explosion.js` (src/vfx/pixelfx/fx/explosions/dirt-explosion.js)
- `file:src/vfx/pixelfx/fx/holy/holy-pillar.js` (src/vfx/pixelfx/fx/holy/holy-pillar.js)
- `file:src/vfx/pixelfx/fx/impacts/bullet-impact.js` (src/vfx/pixelfx/fx/impacts/bullet-impact.js)
- `file:src/vfx/pixelfx/fx/impacts/parry.js` (src/vfx/pixelfx/fx/impacts/parry.js)
- `file:src/vfx/pixelfx/fx/melee/double-slash.js` (src/vfx/pixelfx/fx/melee/double-slash.js)
- `file:src/vfx/pixelfx/fx/melee/heavy-cleave.js` (src/vfx/pixelfx/fx/melee/heavy-cleave.js)
- `file:src/vfx/pixelfx/fx/melee/thrust.js` (src/vfx/pixelfx/fx/melee/thrust.js)
- `file:src/vfx/pixelfx/fx/pickups/chest-open.js` (src/vfx/pixelfx/fx/pickups/chest-open.js)
- `file:src/vfx/pixelfx/fx/pickups/coin-spin.js` (src/vfx/pixelfx/fx/pickups/coin-spin.js)
- `file:src/vfx/pixelfx/fx/pickups/crystal-shard.js` (src/vfx/pixelfx/fx/pickups/crystal-shard.js)
- `file:src/vfx/pixelfx/fx/pickups/gem-spin.js` (src/vfx/pixelfx/fx/pickups/gem-spin.js)
- `file:src/vfx/pixelfx/fx/pickups/heart-pickup.js` (src/vfx/pixelfx/fx/pickups/heart-pickup.js)
- `file:src/vfx/pixelfx/fx/pickups/loot-beam.js` (src/vfx/pixelfx/fx/pickups/loot-beam.js)
- `file:src/vfx/pixelfx/fx/pickups/potion.js` (src/vfx/pixelfx/fx/pickups/potion.js)
- `file:src/vfx/pixelfx/fx/scifi/teleporter-pad.js` (src/vfx/pixelfx/fx/scifi/teleporter-pad.js)
- `file:src/vfx/pixelfxTypes.ts` (src/vfx/pixelfxTypes.ts)
- `file:src/vfx/vfxManager.ts` (src/vfx/vfxManager.ts)
- `file:src/world/interactables.ts` (src/world/interactables.ts)
- `file:tsconfig.json` (tsconfig.json)
- `file:vite.config.ts` (vite.config.ts)
- `file:.github/copilot-instructions.md` (.github/copilot-instructions.md)
- `file:AGENTS.md` (AGENTS.md)
- `file:GEMINI.md` (GEMINI.md)
- `file:package.json` (package.json)
