# Project Brain Index
*Generated: 2026-11-25T12:44:58.272636+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt** — Chiến đấu thời gian thực, đánh thức các **Trụ Sắc Màu**, khôi phục bảng màu 16-bit cho vùng đất bị **Nhiễu Trắng** và đánh bại **The Eraser**.

## Main Modules
- **src/** (159 files)
- **.agents/** (38 files)
- **(root)/** (12 files)
- **scripts/** (2 files)
- **.github/** (1 files)

## Central Nodes
- `file:src/vfx/vfxManager.ts` (file, 79 links): Registered 4 new pixelfx modules (sonic-wave, leaf-storm, rainbow-burst, hex-shield) and 10 color-matched enemy presets (ground-slam-nature/fire/void, dirt-puff, parry-cyan/poison, muzzle-poison/fire/void, proj-emerald).
- `file:src/game.ts` (file, 65 links): Passed isMoving/isBoss to drawCodixelEnemy and added animated breathing, jump/slam arcs, cast recoil, hit-shiver, dynamic shadows, and dash afterimages for non-atlas Amber/Ruins monsters.
- `file:src/data/types.ts` (file, 51 links): Added mini_root_golem and mini_quartz_knight AI types to EnemyDef.
- `file:src/systems/combat.ts` (file, 42 links): Updated bit_rogue performPrimaryAttack to pure melee twin-dagger strikes (including Phantom Clone shadow melee echo) with zero projectiles on LMB tap; shuriken fan projectiles now fire exclusively on performChargedAttack.
- `file:tests/featureTests.ts` (file, 28 links): Added assertions in Suite 9 verifying bit_rogue normal attacks (with and without Phantom Clone) spawn 0 projectiles while Charged attacks fire the proj-shuriken fan.
- `file:src/data/worldConfig.ts` (file, 24 links): Updated Meadow & Quartz WORLD_CAMPS to spawn all 10 updated mobs, mini-bosses, and biome bosses.
- `file:src/ui/ForgeModal.ts` (file, 21 links): Unified Rune Matrix Forge modal with 240x176 geometric animation, substat awakening, +5 8-element pigment infusion, catalyst/pity, and class-filtered crafting.
- `file:src/world/entities.ts` (file, 19 links): Added 8 Amber/Ruins EnemyAnimKinds, animImpactDone phase latch, spawnHazardOnHit on ProjectileEntity, and vfxPreset on HazardEntity.
- `file:src/systems/inventorySystem.ts` (file, 19 links): Added computeEquipScore, equipBestForClass, getItemSellValue, and sellMultipleFromBag for Equip Best & batch Quick Sell.
- `file:src/graphics/paperDoll.ts` (file, 17 links): Exported HeroAttackKind and forwarded attackKind, attackProgress, aimAngle, and shieldGuard from drawPaperDollHero to drawPixelfxHero with calibrated weapon anchor heights.

## Recent Decisions
- **Bit Rogue Pure Melee LMB & Charged-Only Shurikens** (`decision:20261125124126-bit-rogue-pure-melee`): Removed proj-shuriken projectiles from bit_rogue performPrimaryAttack (and Phantom Clone normal attacks), boosted pure melee range/cone/multipliers + shadow melee echo, and restricted proj-shuriken fan firing exclusively to performChargedAttack.
- **Multi-Frame Monster Animations & Biome-Matched Pixelfx VFX** (`decision:20261125123742-multiframe-monster-animations`): Upgraded all 16 map monsters and bosses with 122 crisp multi-frame pixel sprites, zero-blur movement, Amber/Ruins transform animations, landing-synced Slime leaps and moss pools, 4 bespoke pixelfx modules (sonic-wave, leaf-storm, rainbow-burst, hex-shield), emerald/fire/void grou
- **4-Direction Monster Atlas & Synchronized Enemy Skill VFX** (`decision:20261125121555-4direction-monster-atlas`): Replaced Meadow & Quartz placeholder matrices with 40 extracted 4-direction sprites from the 10 reference sheets (codixel-enemies.png/json) paired with phase-locked skill animations, dash afterimages, shields, Painter-safe directional melee VFX, and moss_pool hazards.
- **Attack Animation & Pixelfx VFX Synchronization** (`decision:20261125115658-attack-animation-pixelfx`): Synchronized 12fps keyframed pixelfx 3D IK hero attack poses, aim pitch, facing priority, Painter flip orientation, chest/weapon-tip VFX origins, startTime pre-warming, and Class Select card previews across bare-handed combat and all 4 classes.
- **Pixelfx Hero Models, Selective Quick Sell, 25 Quests & Readability** (`decision:20261125113206-pixelfx-hero-models-selective`): Replaced character models with 3D-rigged pixelfx models, added Equip Best and multi-select confirmed Quick Sell, expanded to 25 Main+Side+Bounty quests, rebalanced Lv.1-19 mobs/bosses, and upgraded UI typography to Be Vietnam Pro.

## Stale Files (Need Re-reading)
- `file:.agents/skills/project-brain/SKILL.md` (.agents/skills/project-brain/SKILL.md)
- `file:.agents/skills/project-brain/assets/agent-block.md` (.agents/skills/project-brain/assets/agent-block.md)
- `file:.agents/skills/project-brain/assets/viewer.html` (.agents/skills/project-brain/assets/viewer.html)
- `file:.agents/skills/project-brain/scripts/brain.py` (.agents/skills/project-brain/scripts/brain.py)
- `file:.github/copilot-instructions.md` (.github/copilot-instructions.md)
- `file:.gitignore` (.gitignore)
- `file:AGENTS.md` (AGENTS.md)
- `file:GEMINI.md` (GEMINI.md)
- `file:LICENSE` (LICENSE)
- `file:README.md` (README.md)
- `file:index.html` (index.html)
- `file:package-lock.json` (package-lock.json)
- `file:package.json` (package.json)
- `file:scripts/generate_codixel_assets.mjs` (scripts/generate_codixel_assets.mjs)
- `file:src/assets/codixel-icons.json` (src/assets/codixel-icons.json)
- `file:src/assets/codixel-paperdoll.json` (src/assets/codixel-paperdoll.json)
- `file:src/audio/chiptuneSynth.ts` (src/audio/chiptuneSynth.ts)
- `file:src/data/elements.ts` (src/data/elements.ts)
- `file:src/data/equipments.ts` (src/data/equipments.ts)
- `file:src/data/items.ts` (src/data/items.ts)
- `file:src/data/recipes.ts` (src/data/recipes.ts)
- `file:src/graphics/codixelAtlas.ts` (src/graphics/codixelAtlas.ts)
- `file:src/graphics/colorRestoration.ts` (src/graphics/colorRestoration.ts)
- `file:src/graphics/itemIcons.ts` (src/graphics/itemIcons.ts)
- `file:src/graphics/pixelSprites.ts` (src/graphics/pixelSprites.ts)
- `file:src/graphics/ropeFrame.ts` (src/graphics/ropeFrame.ts)
- `file:src/graphics/tileRenderer.ts` (src/graphics/tileRenderer.ts)
- `file:src/main.ts` (src/main.ts)
- `file:src/systems/forgeSystem.ts` (src/systems/forgeSystem.ts)
- `file:src/systems/questSystem.ts` (src/systems/questSystem.ts)
- `file:src/systems/saveSystem.ts` (src/systems/saveSystem.ts)
- `file:src/ui/DialogueModal.ts` (src/ui/DialogueModal.ts)
- `file:src/ui/HUD.ts` (src/ui/HUD.ts)
- `file:src/ui/ItemReviewTooltip.ts` (src/ui/ItemReviewTooltip.ts)
- `file:src/ui/TutorialModal.ts` (src/ui/TutorialModal.ts)
- `file:src/ui/WorldMapModal.ts` (src/ui/WorldMapModal.ts)
- `file:src/vfx/fxAtlas.ts` (src/vfx/fxAtlas.ts)
- `file:src/vfx/pixelfx/core/act.js` (src/vfx/pixelfx/core/act.js)
- `file:src/vfx/pixelfx/core/actor.js` (src/vfx/pixelfx/core/actor.js)
- `file:src/vfx/pixelfx/core/chain.js` (src/vfx/pixelfx/core/chain.js)
- `file:src/vfx/pixelfx/core/color.js` (src/vfx/pixelfx/core/color.js)
- `file:src/vfx/pixelfx/core/font.js` (src/vfx/pixelfx/core/font.js)
- `file:src/vfx/pixelfx/core/fx.js` (src/vfx/pixelfx/core/fx.js)
- `file:src/vfx/pixelfx/core/index.js` (src/vfx/pixelfx/core/index.js)
- `file:src/vfx/pixelfx/core/math.js` (src/vfx/pixelfx/core/math.js)
- `file:src/vfx/pixelfx/core/painter.js` (src/vfx/pixelfx/core/painter.js)
- `file:src/vfx/pixelfx/core/particles.js` (src/vfx/pixelfx/core/particles.js)
- `file:src/vfx/pixelfx/core/poses.js` (src/vfx/pixelfx/core/poses.js)
- `file:src/vfx/pixelfx/core/scene.js` (src/vfx/pixelfx/core/scene.js)
- `file:src/vfx/pixelfx/core/shapes.js` (src/vfx/pixelfx/core/shapes.js)
- `file:src/vfx/pixelfx/core/sim.js` (src/vfx/pixelfx/core/sim.js)
- `file:src/vfx/pixelfx/fx/arcane/_lib.js` (src/vfx/pixelfx/fx/arcane/_lib.js)
- `file:src/vfx/pixelfx/fx/arcane/arcane-missiles.js` (src/vfx/pixelfx/fx/arcane/arcane-missiles.js)
- `file:src/vfx/pixelfx/fx/arcane/star-fall.js` (src/vfx/pixelfx/fx/arcane/star-fall.js)
- `file:src/vfx/pixelfx/fx/explosions/_lib.js` (src/vfx/pixelfx/fx/explosions/_lib.js)
