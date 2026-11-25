# Project Brain Index
*Generated: 2026-11-25T14:46:16.224230+00:00*

## Description
> **Thế giới mở 16-Bit Action RPG trên trình duyệt** — Chiến đấu thời gian thực, đánh thức các **Trụ Sắc Màu**, khôi phục bảng màu 16-bit cho vùng đất bị **Nhiễu Trắng** và đánh bại **The Eraser**.

## Main Modules
- **src/** (161 files)
- **.agents/** (38 files)
- **(root)/** (14 files)
- **scripts/** (2 files)
- **.github/** (1 files)

## Central Nodes
- `file:src/game.ts` (file, 67 links): Game controller managing permanent hidden item unlocks, Bleached/Restored shimmer, Energy Siphon magnet, and drop halos.
- `file:src/data/types.ts` (file, 52 links): Extended ItemDef, RecipeDef, EquipPassiveId, and SaveDataV2 with hidden item metadata, craftRecipe, and unlock tracking.
- `file:src/systems/combat.ts` (file, 44 links): 9-element CombatSystem handling exclusive Boss hidden drops with rainbow-burst/waypoint-pillar VFX and hidden passives.
- `file:src/data/items.ts` (file, 33 links): Unified item catalog spreading HIDDEN_ITEMS and guarding pickRandomEquipByRarity against hidden item leakage.
- `file:tests/featureTests.ts` (file, 29 links): Automated 11-suite test runner verifying lore, 9-element matrix, bosses, hardcore RPG, sprites, and Hidden Items.
- `file:src/ui/ItemReviewTooltip.ts` (file, 25 links): Vintage parchment hover tooltip masking un-unlocked hidden items (???) and displaying exclusive source tags when unlocked.
- `file:src/ui/ForgeModal.ts` (file, 22 links): Rune Matrix Forge modal with Hidden Blueprints filter tab, ??? secrecy masking, level checks, and unlock triggers.
- `file:src/systems/inventorySystem.ts` (file, 21 links): 5-slot inventory & recalculatePlayerStats() supporting restored_prism_surge, energy_siphon_magnet, and set_resonance_echo.
- `file:src/world/entities.ts` (file, 20 links): PlayerEntity runtime flags including hasRestoredPrismSurge, hasEnergySiphon, and hasSetResonance.
- `file:src/systems/forgeSystem.ts` (file, 17 links): Rune Matrix Forge system enforcing requiredLevel and rare materials on hidden craft_only blueprints.

## Recent Decisions
- **Resolve current main conflicts without dropping branch history** (`decision:20261125144411-resolve-current-main-conflicts`): Use a merge commit to retain both histories; preserve both DEV_LOG entries and let project-brain tooling compact the graph and regenerate its digest rather than hand-editing graph files.
- **Block-pixel logo lettering** (`decision:20261125143734-blockpixel-logo-lettering`): Broaden the PIXTEL canvas wordmark into a chunky 7x7 bitmap alphabet inspired by the user's Vietnamese Minecraft font reference, while keeping custom glyphs and the current chroma crest.
- **Hidden Items System (Craft-Only & Boss-Drop Only)** (`decision:20261125143028-hidden-items-system-craftonly`): Added 8 isHidden items (4 craft_only, 4 boss_only) strictly isolated from shops/chests/normal mobs, masked as ??? until discovered, permanently unlocked in localStorage, and integrated with combat passives, VFX, and Paper-Doll shimmer.
- **Epic pixel-grid title screen** (`decision:20261125142812-epic-pixelgrid-title-screen`): Use the existing class-select overlay as PIXTEL's startup screen, replacing its plain wordmark with an animated low-resolution chroma crest and adding a crisp pixel-grid backdrop while preserving existing start, continue, and tutorial actions.
- **Mandatory Team Vibe-Code DEV_LOG Rule** (`decision:20261125140711-mandatory-team-vibecode-devlog`): Added DEV_LOG.md seeded from git history and enforced read-before-coding and write-after-coding log rules across AGENTS.md, GEMINI.md, .github/copilot-instructions.md, and CLAUDE.md.

## Stale Files (Need Re-reading)
- `file:package-lock.json` (package-lock.json)
- `file:package.json` (package.json)
- `file:scripts/extract_enemy_sprites.py` (scripts/extract_enemy_sprites.py)
- `file:scripts/generate_codixel_assets.mjs` (scripts/generate_codixel_assets.mjs)
- `file:src/main.ts` (src/main.ts)
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
- `file:src/vfx/pixelfx/core/rig.js` (src/vfx/pixelfx/core/rig.js)
- `file:src/vfx/pixelfx/core/scene.js` (src/vfx/pixelfx/core/scene.js)
- `file:src/vfx/pixelfx/core/shapes.js` (src/vfx/pixelfx/core/shapes.js)
- `file:src/vfx/pixelfx/core/sim.js` (src/vfx/pixelfx/core/sim.js)
- `file:src/vfx/pixelfx/fx/arcane/_lib.js` (src/vfx/pixelfx/fx/arcane/_lib.js)
- `file:src/vfx/pixelfx/fx/arcane/arcane-missiles.js` (src/vfx/pixelfx/fx/arcane/arcane-missiles.js)
- `file:src/vfx/pixelfx/fx/arcane/star-fall.js` (src/vfx/pixelfx/fx/arcane/star-fall.js)
- `file:src/vfx/pixelfx/fx/explosions/_lib.js` (src/vfx/pixelfx/fx/explosions/_lib.js)
- `file:src/vfx/pixelfx/fx/explosions/dirt-explosion.js` (src/vfx/pixelfx/fx/explosions/dirt-explosion.js)
- `file:src/vfx/pixelfx/fx/explosions/plasma-explosion.js` (src/vfx/pixelfx/fx/explosions/plasma-explosion.js)
- `file:src/vfx/pixelfx/fx/explosions/small-explosion.js` (src/vfx/pixelfx/fx/explosions/small-explosion.js)
- `file:src/vfx/pixelfx/fx/fire/_lib.js` (src/vfx/pixelfx/fx/fire/_lib.js)
- `file:src/vfx/pixelfx/fx/fire/fireball.js` (src/vfx/pixelfx/fx/fire/fireball.js)
- `file:src/vfx/pixelfx/fx/holy/_lib.js` (src/vfx/pixelfx/fx/holy/_lib.js)
- `file:src/vfx/pixelfx/fx/holy/heal-aoe.js` (src/vfx/pixelfx/fx/holy/heal-aoe.js)
- `file:src/vfx/pixelfx/fx/holy/heal.js` (src/vfx/pixelfx/fx/holy/heal.js)
- `file:src/vfx/pixelfx/fx/holy/holy-pillar.js` (src/vfx/pixelfx/fx/holy/holy-pillar.js)
- `file:src/vfx/pixelfx/fx/holy/smite.js` (src/vfx/pixelfx/fx/holy/smite.js)
- `file:src/vfx/pixelfx/fx/ice/_lib.js` (src/vfx/pixelfx/fx/ice/_lib.js)
- `file:src/vfx/pixelfx/fx/ice/frost-nova.js` (src/vfx/pixelfx/fx/ice/frost-nova.js)
- `file:src/vfx/pixelfx/fx/ice/ice-lance.js` (src/vfx/pixelfx/fx/ice/ice-lance.js)
- `file:src/vfx/pixelfx/fx/ice/ice-shatter.js` (src/vfx/pixelfx/fx/ice/ice-shatter.js)
- `file:src/vfx/pixelfx/fx/impacts/_lib.js` (src/vfx/pixelfx/fx/impacts/_lib.js)
- `file:src/vfx/pixelfx/fx/impacts/bullet-impact.js` (src/vfx/pixelfx/fx/impacts/bullet-impact.js)
- `file:src/vfx/pixelfx/fx/impacts/crit-hit.js` (src/vfx/pixelfx/fx/impacts/crit-hit.js)
- `file:src/vfx/pixelfx/fx/impacts/ground-slam.js` (src/vfx/pixelfx/fx/impacts/ground-slam.js)
- `file:src/vfx/pixelfx/fx/impacts/hit-spark.js` (src/vfx/pixelfx/fx/impacts/hit-spark.js)
- `file:src/vfx/pixelfx/fx/impacts/parry.js` (src/vfx/pixelfx/fx/impacts/parry.js)
- `file:src/vfx/pixelfx/fx/impacts/shield-block.js` (src/vfx/pixelfx/fx/impacts/shield-block.js)
- `file:src/vfx/pixelfx/fx/lightning/_lib.js` (src/vfx/pixelfx/fx/lightning/_lib.js)
- `file:src/vfx/pixelfx/fx/lightning/zap-hit.js` (src/vfx/pixelfx/fx/lightning/zap-hit.js)
- `file:src/vfx/pixelfx/fx/melee/_lib.js` (src/vfx/pixelfx/fx/melee/_lib.js)
- `file:src/vfx/pixelfx/fx/melee/dagger-flurry.js` (src/vfx/pixelfx/fx/melee/dagger-flurry.js)
- `file:src/vfx/pixelfx/fx/melee/double-slash.js` (src/vfx/pixelfx/fx/melee/double-slash.js)
- `file:src/vfx/pixelfx/fx/melee/heavy-cleave.js` (src/vfx/pixelfx/fx/melee/heavy-cleave.js)
- `file:src/vfx/pixelfx/fx/melee/spin-slash.js` (src/vfx/pixelfx/fx/melee/spin-slash.js)
- `file:src/vfx/pixelfx/fx/melee/sword-slash.js` (src/vfx/pixelfx/fx/melee/sword-slash.js)
