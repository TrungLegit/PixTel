import type { ClassId, GearVisualTier, HeroVisualLoadout } from "../data/types";
import type { CompiledSprite } from "./pixelSprites";
import { PixelBuf, hexToU32, hueRamp } from "./pixelCraft";

export type { HeroVisualLoadout };

/**
 * Dynamic Equipment-Driven 24x24 pixel character models for PIXTEL's 4 playable classes
 * (x4 walk frames) plus 3 Origin Town NPCs.
 *
 * Visually reflects every equipped slot:
 * - Unarmored (`armorTier === "none"`): humble novice linen tunic & bare head with class-styled hair/eyes
 * - Armored (`common..legendary`): full class armor/helmet/hat/hood/goggles evolving through 5 rarity palettes
 * - Unarmed (`weaponTier === "none"`): bare fists raised in a martial punch guard
 * - Armed (`common..legendary`): class signature weapon + shield/staff/daggers/carbine with tier & +5/+8 gleam
 * - Ring (`ringTier !== "none"`): luminous hand/cuff accent
 * - Pix-Chip (`chipTier !== "none"`): orbiting floating pixel rune core behind the hero's shoulder
 */

function finalizeCharacter(
  buf: PixelBuf,
  litOutlineHex: string,
  shadeOutlineHex: string,
  rimHighlightHex = "#fff8e8"
): CompiledSprite {
  buf.smoothEdge();
  buf.applyRimLight(hexToU32(rimHighlightHex), 0.28, 0.22);
  buf.applySelout(hexToU32(litOutlineHex), hexToU32(shadeOutlineHex), 0.36);

  const flipped = buf.flipH();
  return {
    w: buf.w,
    h: buf.h,
    right: buf.toCanvas(),
    left: flipped.toCanvas(),
    whiteRight: buf.toWhiteCanvas(),
    whiteLeft: flipped.toWhiteCanvas(),
    actor: buf.toActor(),
  };
}

function tierAccentRamp(tier: GearVisualTier, fallbackHue: number): Uint32Array {
  switch (tier) {
    case "common":
      return hueRamp(4, { hue: 214, sat: 0.28, lightMin: 0.3, lightMax: 0.86, shift: 18 });
    case "uncommon":
      return hueRamp(4, { hue: 146, sat: 0.84, lightMin: 0.3, lightMax: 0.88, shift: 22 });
    case "rare":
      return hueRamp(4, { hue: 192, sat: 0.92, lightMin: 0.32, lightMax: 0.92, shift: 20 });
    case "epic":
      return hueRamp(4, { hue: 282, sat: 0.88, lightMin: 0.3, lightMax: 0.88, shift: 26 });
    case "legendary":
      return hueRamp(4, { hue: 42, sat: 0.96, lightMin: 0.38, lightMax: 0.94, shift: 24 });
    default:
      return hueRamp(4, { hue: fallbackHue, sat: 0.55, lightMin: 0.3, lightMax: 0.85, shift: 18 });
  }
}

function tierMetalRamp(tier: GearVisualTier, defaultHue: number, defaultSat: number): Uint32Array {
  switch (tier) {
    case "common":
      return hueRamp(5, { hue: defaultHue, sat: Math.max(0.18, defaultSat * 0.65), lightMin: 0.22, lightMax: 0.78, shift: 18 });
    case "uncommon":
      return hueRamp(5, { hue: 150, sat: 0.52, lightMin: 0.2, lightMax: 0.78, shift: 22 });
    case "rare":
      return hueRamp(5, { hue: defaultHue, sat: defaultSat, lightMin: 0.24, lightMax: 0.88, shift: 26 });
    case "epic":
      return hueRamp(5, { hue: 278, sat: 0.68, lightMin: 0.2, lightMax: 0.84, shift: 28 });
    case "legendary":
      return hueRamp(5, { hue: 42, sat: 0.84, lightMin: 0.28, lightMax: 0.92, shift: 26 });
    default:
      return hueRamp(5, { hue: defaultHue, sat: defaultSat, lightMin: 0.24, lightMax: 0.86, shift: 24 });
  }
}

function drawFloatingChipMote(b: PixelBuf, tier: GearVisualTier, frame: number, bob: number) {
  if (tier === "none") return;
  const r = tierAccentRamp(tier, 190);
  const my = 4 + bob + (frame === 1 ? -1 : frame === 3 ? 1 : 0);
  const mx = 4;
  b.pset(mx, my, r[3]);
  b.pset(mx + 1, my, hexToU32("#ffffff"));
  b.pset(mx, my + 1, r[2]);
  b.pset(mx + 1, my + 1, r[1]);
  if (tier === "epic" || tier === "legendary") {
    b.pset(mx - 1, my, r[1]);
    b.pset(mx + 1, my - 1, r[3]);
  }
}

function drawRingGlint(b: PixelBuf, tier: GearVisualTier, x: number, y: number) {
  if (tier === "none") return;
  const r = tierAccentRamp(tier, 44);
  b.pset(x, y, r[3]);
  b.pset(x, y - 1, tier === "legendary" || tier === "epic" ? hexToU32("#ffffff") : r[2]);
}

function drawBareFists(
  b: PixelBuf,
  skin: Uint32Array,
  bob: number,
  stride: number,
  ringTier: GearVisualTier
) {
  const fOff = stride;
  // Back/left raised guard fist
  b.rect(5, 13 + bob - fOff, 3, 3, skin[2]);
  b.pset(5, 13 + bob - fOff, skin[3]);
  // Front/right lead punch fist
  b.rect(16, 12 + bob + fOff, 3, 3, skin[2]);
  b.rect(16, 12 + bob + fOff, 2, 1, skin[3]);
  drawRingGlint(b, ringTier, 17, 13 + bob + fOff);
}

/** Shared humble novice unarmored body so equipping armor creates an instant, dramatic upgrade! */
function drawUnarmoredNovice(
  b: PixelBuf,
  classId: ClassId,
  frame: number,
  loadout: HeroVisualLoadout
) {
  const skin = hueRamp(4, { hue: 24, sat: 0.56, satDrop: 0.12, lightMin: 0.42, lightMax: 0.86, shift: 16 });
  const linen = hueRamp(4, { hue: 34, sat: 0.24, satDrop: 0.08, lightMin: 0.28, lightMax: 0.72, shift: 14 });
  const leather = hueRamp(4, { hue: 26, sat: 0.46, satDrop: 0.12, lightMin: 0.18, lightMax: 0.48, shift: 16 });

  const hairHue =
    classId === "prism_knight"
      ? 216
      : classId === "chroma_mage"
        ? 280
        : classId === "bit_rogue"
          ? 344
          : 152;
  const hair = hueRamp(4, { hue: hairHue, sat: 0.62, lightMin: 0.22, lightMax: 0.74, shift: 22 });
  const eyeCol =
    classId === "prism_knight"
      ? hexToU32("#5ef2ff")
      : classId === "chroma_mage"
        ? hexToU32("#ff77ee")
        : classId === "bit_rogue"
          ? hexToU32("#ff4477")
          : hexToU32("#55ff99");

  const bob = frame === 1 || frame === 3 ? -1 : 0;
  const stride = frame === 1 ? 1 : frame === 3 ? -1 : 0;

  // Cloth trousers & simple leather boots
  b.rect(8 - stride, 17 + bob, 3, 3, leather[0]);
  b.rect(8 - stride - 1, 20, 4, 2, leather[0]);
  b.rect(12 + stride, 17 + bob, 3, 3, leather[1]);
  b.rect(12 + stride, 20, 4, 2, leather[1]);

  // Humble sleeveless linen tunic & rope belt
  b.rect(8, 10 + bob, 7, 7, linen[1]);
  b.rect(8, 10 + bob, 4, 6, linen[2]);
  b.rect(9, 11 + bob, 2, 2, linen[3]);
  b.rect(8, 15 + bob, 7, 1, leather[1]);
  // Bare arms
  b.rect(6, 11 + bob, 2, 3, skin[2]);
  b.rect(15, 11 + bob, 2, 3, skin[1]);

  // Bare Head + Distinct Class Hair Style & Eyes
  b.litEllipse(11.5, 6.8 + bob, 3.6, 3.3, skin);
  b.rect(8, 3 + bob, 7, 3, hair[2]);
  b.rect(8, 3 + bob, 4, 2, hair[3]);
  b.pset(8, 6 + bob, hair[1]);
  if (classId === "chroma_mage") {
    b.rect(7, 5 + bob, 2, 4, hair[1]);
  } else if (classId === "bit_rogue") {
    // Swept spiky bangs
    b.pset(14, 4 + bob, hair[3]);
    b.pset(15, 5 + bob, hair[2]);
  } else if (classId === "pixel_tinker") {
    // Messy tuft
    b.pset(11, 2 + bob, hair[3]);
    b.pset(12, 2 + bob, hair[2]);
  }
  b.pset(10, 7 + bob, eyeCol);
  b.pset(13, 7 + bob, eyeCol);

  drawFloatingChipMote(b, loadout.chipTier, frame, bob);
}

// =========================================================================
// 1. PRISM KNIGHT
// =========================================================================

function drawKnightWeaponAndShield(
  b: PixelBuf,
  loadout: HeroVisualLoadout,
  bob: number,
  swordLift: number,
  skin: Uint32Array,
  stride: number
) {
  if (loadout.weaponTier === "none") {
    drawBareFists(b, skin, bob, stride, loadout.ringTier);
    return;
  }

  const blade = tierMetalRamp(loadout.weaponTier, 214, 0.34);
  const wGlow = tierAccentRamp(loadout.weaponTier, 190);
  const gold = hueRamp(4, { hue: 44, sat: 0.9, lightMin: 0.3, lightMax: 0.88, shift: 22 });
  const white = hexToU32("#ffffff");
  const sy = 12 + bob + swordLift;

  // Crossguard & pommel
  b.rect(16, sy + 1, 3, 1, gold[2]);
  b.pset(17, sy + 2, gold[1]);
  b.pset(16, sy + 2, gold[3]);
  drawRingGlint(b, loadout.ringTier, 16, sy + 1);

  // Angled Broadsword (extra radiant edge at Rare+ or +5 enhance!)
  const extraGleam = loadout.weaponEnhance >= 5 || loadout.weaponTier === "legendary";
  for (let i = 0; i < 7; i++) {
    const bx = 18 + Math.floor(i * 0.55);
    const by = sy - i;
    b.pset(bx, by, i > 4 || extraGleam ? white : blade[4]);
    b.pset(bx + 1, by, i % 2 === 0 ? wGlow[2] : wGlow[3]);
    if (i < 5) b.pset(bx + 1, by + 1, blade[2]);
  }

  // Prism Heater Shield on front-left arm
  const shY = 11 + bob - Math.floor(swordLift * 0.5);
  b.rect(4, shY, 5, 6, blade[1]);
  b.rect(5, shY + 6, 3, 1, blade[0]);
  b.rect(4, shY, 5, 1, gold[3]);
  b.rect(4, shY, 1, 5, gold[2]);
  b.rect(8, shY + 1, 1, 5, gold[1]);
  b.rect(5, shY + 1, 3, 4, wGlow[1]);
  b.rect(5, shY + 1, 2, 2, wGlow[3]);
  b.pset(6, shY + 2, white);
}

function buildPrismKnightFrame(frame: number, loadout: HeroVisualLoadout): CompiledSprite {
  const b = new PixelBuf(24, 24);
  const skin = hueRamp(4, { hue: 24, sat: 0.56, lightMin: 0.42, lightMax: 0.86, shift: 16 });
  const bob = frame === 1 || frame === 3 ? -1 : 0;
  const stride = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  const swordLift = frame === 1 ? -1 : frame === 3 ? 1 : 0;

  if (loadout.armorTier === "none") {
    drawUnarmoredNovice(b, "prism_knight", frame, loadout);
    drawKnightWeaponAndShield(b, loadout, bob, swordLift, skin, stride);
    return finalizeCharacter(b, "#394d78", "#111629", "#eef8ff");
  }

  const steel = tierMetalRamp(loadout.armorTier, 214, 0.34);
  const cape =
    loadout.armorTier === "legendary"
      ? hueRamp(4, { hue: 344, sat: 0.86, lightMin: 0.24, lightMax: 0.72, shift: 22 })
      : hueRamp(4, { hue: 226, sat: 0.72, satDrop: 0.16, lightMin: 0.18, lightMax: 0.62, shift: 24 });
  const gold = hueRamp(4, { hue: 44, sat: 0.88, satDrop: 0.14, lightMin: 0.28, lightMax: 0.84, shift: 24 });
  const cyan = tierAccentRamp(loadout.armorTier, 190);
  const white = hexToU32("#ffffff");
  const visorDark = hexToU32("#0f1b33");
  const capeWave = frame === 1 ? -1 : frame === 3 ? 1 : 0;

  // Flowing royal cape behind knight (visible from Uncommon+)
  if (loadout.armorTier !== "common") {
    for (let row = 0; row < 9; row++) {
      const cy = 10 + bob + row;
      const flutter = Math.round(Math.sin(row * 0.45 + frame * 1.57) * 0.8) + (row > 5 ? capeWave : 0);
      const x0 = Math.max(2, 6 - Math.floor(row * 0.28) + flutter);
      const w = 4 + Math.floor(row * 0.22);
      for (let dx = 0; dx < w; dx++) {
        b.pset(x0 + dx, cy, dx === 0 ? cape[2] : dx === w - 1 ? cape[0] : cape[1]);
      }
    }
    b.rect(5 + capeWave, 18 + bob, 4, 1, gold[2]);
  }

  // Armored Greaves & Boots
  const leftLegX = 8 - stride;
  const rightLegX = 12 + stride;
  b.rect(leftLegX, 17 + bob, 3, 4 - (stride < 0 ? 1 : 0), steel[0]);
  b.rect(leftLegX, 17 + bob, 1, 3, steel[2]);
  b.rect(leftLegX - 1, 20 + (stride < 0 ? -1 : 0), 4, 2, steel[0]);
  b.rect(leftLegX, 20 + (stride < 0 ? -1 : 0), 2, 1, steel[2]);
  b.rect(rightLegX, 17 + bob, 3, 4 - (stride > 0 ? 1 : 0), steel[1]);
  b.rect(rightLegX, 17 + bob, 2, 2, steel[3]);
  b.rect(rightLegX, 20 + (stride > 0 ? -1 : 0), 4, 2, steel[1]);
  b.rect(rightLegX + 1, 20 + (stride > 0 ? -1 : 0), 2, 1, steel[3]);

  // Armored Cuirass & Tabard
  b.rect(8, 10 + bob, 7, 7, steel[1]);
  b.rect(8, 10 + bob, 4, 5, steel[3]);
  b.rect(9, 11 + bob, 2, 2, steel[4]);
  b.rect(10, 12 + bob, 3, 5, cape[2]);
  b.rect(11, 12 + bob, 1, 4, cape[3]);
  b.rect(8, 15 + bob, 7, 1, gold[2]);
  b.pset(11, 15 + bob, cyan[3]);

  // Shoulder Pauldrons
  b.litEllipse(7.5, 11.5 + bob, 2.6, 2.2, steel);
  b.pset(6, 12 + bob, gold[2]);
  b.litEllipse(15.5, 11.5 + bob, 2.5, 2.1, steel);
  b.pset(16, 12 + bob, gold[2]);

  // Helmet Plume (grows grander at Rare+)
  const plumePts =
    loadout.armorTier === "common"
      ? [[10, 2 + bob], [9, 3 + bob]]
      : [
          [9, 2 + bob], [8, 2 + bob], [7, 3 + bob], [6, 4 + bob],
          [5 + capeWave, 5 + bob], [5 + capeWave, 6 + bob],
        ];
  for (let i = 0; i < plumePts.length; i++) {
    const [px, py] = plumePts[i];
    b.pset(px, py, i < 2 ? cyan[3] : i < 4 ? cyan[2] : cape[3]);
    b.pset(px, py + 1, i < 3 ? cyan[1] : cape[2]);
  }

  // Crested Greathelm
  b.litEllipse(11.5, 6.8 + bob, 4.2, 3.8, steel);
  b.rect(11, 3 + bob, 2, 3, gold[2]);
  b.pset(11, 3 + bob, gold[3]);
  b.rect(9, 6 + bob, 6, 2, visorDark);
  b.rect(10, 6 + bob, 5, 1, cyan[2]);
  b.pset(11, 6 + bob, white);
  b.pset(14, 6 + bob, cyan[3]);
  b.rect(9, 8 + bob, 5, 2, steel[2]);
  b.rect(9, 8 + bob, 2, 1, steel[4]);

  drawFloatingChipMote(b, loadout.chipTier, frame, bob);
  drawKnightWeaponAndShield(b, loadout, bob, swordLift, skin, stride);

  return finalizeCharacter(b, "#394d78", "#111629", "#eef8ff");
}

// =========================================================================
// 2. CHROMA MAGE
// =========================================================================

function drawMageStaff(
  b: PixelBuf,
  loadout: HeroVisualLoadout,
  bob: number,
  orbBob: number,
  skin: Uint32Array,
  stride: number
) {
  if (loadout.weaponTier === "none") {
    drawBareFists(b, skin, bob, stride, loadout.ringTier);
    return;
  }
  const wood = hueRamp(4, { hue: 28, sat: 0.52, lightMin: 0.2, lightMax: 0.56, shift: 18 });
  const gold = hueRamp(4, { hue: 45, sat: 0.9, lightMin: 0.32, lightMax: 0.86, shift: 22 });
  const orb = tierAccentRamp(loadout.weaponTier, 192);
  const white = hexToU32("#ffffff");

  const sx = 18;
  for (let y = 8 + bob; y <= 21; y++) {
    b.pset(sx, y, y % 3 === 0 ? wood[3] : wood[2]);
    b.pset(sx + 1, y, wood[0]);
  }
  drawRingGlint(b, loadout.ringTier, 17, 13 + bob);

  // Golden staff cradle + levitating crystal orb
  b.pset(sx - 1, 7 + bob, gold[2]);
  b.pset(sx, 8 + bob, gold[3]);
  b.pset(sx + 1, 8 + bob, gold[1]);
  b.pset(sx + 2, 7 + bob, gold[2]);
  const oy = 4 + bob + orbBob;
  b.litEllipse(sx + 0.5, oy + 0.5, 2.3, 2.3, orb);
  b.pset(sx, oy, white);
  if (loadout.weaponEnhance >= 5 || loadout.weaponTier === "legendary") {
    b.pset(sx + 1, oy - 1, white);
  }
}

function buildChromaMageFrame(frame: number, loadout: HeroVisualLoadout): CompiledSprite {
  const b = new PixelBuf(24, 24);
  const skin = hueRamp(4, { hue: 24, sat: 0.58, lightMin: 0.42, lightMax: 0.86, shift: 18 });
  const bob = frame === 1 || frame === 3 ? -1 : 0;
  const stride = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  const tipSway = frame === 1 ? -1 : frame === 3 ? 1 : 0;
  const orbBob = frame === 1 ? -1 : frame === 3 ? 1 : 0;

  if (loadout.armorTier === "none") {
    drawUnarmoredNovice(b, "chroma_mage", frame, loadout);
    drawMageStaff(b, loadout, bob, orbBob, skin, stride);
    return finalizeCharacter(b, "#5c348f", "#140a24", "#ffe8ff");
  }

  const robeHue =
    loadout.armorTier === "uncommon"
      ? 156
      : loadout.armorTier === "rare"
        ? 222
        : loadout.armorTier === "legendary"
          ? 290
          : 268;
  const robe = hueRamp(5, { hue: robeHue, sat: 0.68, satDrop: 0.16, lightMin: 0.16, lightMax: 0.78, shift: 30 });
  const trim = tierAccentRamp(loadout.armorTier, 325);
  const gold = hueRamp(4, { hue: 45, sat: 0.9, satDrop: 0.12, lightMin: 0.32, lightMax: 0.86, shift: 22 });
  const orb = tierAccentRamp(loadout.armorTier, 190);
  const white = hexToU32("#ffffff");

  // Boots peeking under robe
  b.rect(8 - stride, 20, 3, 2, robe[0]);
  b.rect(12 + stride, 20, 3, 2, robe[1]);
  b.pset(12 + stride, 20, gold[2]);

  // Pleated Arcane Robe
  for (let row = 0; row < 10; row++) {
    const ry = 11 + bob + row;
    const half = 3.2 + row * 0.24;
    const sway = row > 5 ? stride * 0.5 : 0;
    const x0 = Math.round(10.5 - half + sway);
    const x1 = Math.round(11.5 + half + sway);
    for (let x = x0; x <= x1; x++) {
      const u = (x - x0) / Math.max(1, x1 - x0);
      const fold = Math.sin(u * Math.PI * 3) * 0.14;
      const shade = 0.72 - u * 0.55 - row * 0.03 + fold;
      const idx = shade > 0.62 ? 3 : shade > 0.4 ? 2 : shade > 0.22 ? 1 : 0;
      b.pset(x, ry, robe[idx]);
    }
  }
  b.rect(9, 11 + bob, 4, 9, trim[1]);
  b.rect(9, 11 + bob, 2, 8, trim[2]);
  b.rect(10, 12 + bob, 1, 6, trim[3]);
  b.rect(7, 19 + bob, 8, 1, gold[2]);
  b.rect(8, 15 + bob, 6, 1, gold[2]);
  b.pset(10, 15 + bob, orb[3]);

  // Layered Shoulder Mantle
  b.litEllipse(10.5, 11.8 + bob, 5.2, 2.2, trim);
  b.rect(7, 13 + bob, 7, 1, gold[2]);

  // Face under hat brim with bright glowing arcane eyes
  b.rect(8, 8 + bob, 6, 3, skin[2]);
  b.rect(8, 8 + bob, 3, 2, skin[3]);
  b.rect(8, 8 + bob, 6, 1, robe[0]);
  b.rect(10, 9 + bob, 2, 1, orb[3]);
  b.pset(10, 9 + bob, white);
  b.pset(13, 9 + bob, white);
  b.pset(12, 9 + bob, orb[2]);

  // Wide-Brimmed Wizard Hat
  b.litEllipse(10.5, 7.6 + bob, 6.8, 1.8, robe);
  b.rect(6, 7 + bob, 9, 1, robe[3]);
  b.rect(7, 6 + bob, 7, 1, gold[2]);
  b.rect(11, 6 + bob, 2, 1, gold[3]);
  b.pset(11, 6 + bob, trim[3]);
  for (let row = 0; row < 5; row++) {
    const cy = 5 + bob - row;
    const hw = Math.max(1, 3.2 - row * 0.62);
    const cx = 10.5 - row * 0.8 + (row >= 3 ? tipSway * 0.7 : 0);
    for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) {
      b.pset(x, cy, x < cx ? (row > 2 ? robe[4] : robe[3]) : robe[1]);
    }
  }
  b.pset(Math.round(7 + tipSway), 1 + bob, gold[3]);

  drawFloatingChipMote(b, loadout.chipTier, frame, bob);
  drawMageStaff(b, loadout, bob, orbBob, skin, stride);

  return finalizeCharacter(b, "#5c348f", "#140a24", "#ffe8ff");
}

// =========================================================================
// 3. BIT ROGUE
// =========================================================================

function drawRogueDaggers(
  b: PixelBuf,
  loadout: HeroVisualLoadout,
  bob: number,
  wave: number,
  skin: Uint32Array,
  stride: number
) {
  if (loadout.weaponTier === "none") {
    drawBareFists(b, skin, bob, stride, loadout.ringTier);
    return;
  }

  const cloth = hueRamp(4, { hue: 245, sat: 0.38, lightMin: 0.16, lightMax: 0.66 });
  const mainBlade = tierAccentRamp(loadout.weaponTier, 186);
  const offBlade =
    loadout.weaponTier === "legendary"
      ? hueRamp(4, { hue: 42, sat: 0.96, lightMin: 0.36, lightMax: 0.94 })
      : hueRamp(4, { hue: 328, sat: 0.92, lightMin: 0.3, lightMax: 0.88 });
  const white = hexToU32("#ffffff");

  // Off-hand dagger
  const offY = 14 + bob - wave;
  b.pset(6, offY, cloth[3]);
  b.line(5, offY + 1, 2, offY + 4, offBlade[2]);
  b.line(5, offY, 2, offY + 3, offBlade[3]);
  b.pset(2, offY + 3, white);

  // Main-hand dagger
  const mainY = 13 + bob + wave;
  b.rect(15, mainY, 2, 2, cloth[2]);
  drawRingGlint(b, loadout.ringTier, 15, mainY);
  b.line(17, mainY, 21, mainY - 3, mainBlade[2]);
  b.line(17, mainY - 1, 21, mainY - 4, mainBlade[3]);
  b.pset(21, mainY - 4, white);
  if (loadout.weaponEnhance >= 5 || loadout.weaponTier === "legendary") {
    b.pset(20, mainY - 3, white);
  }
}

function buildBitRogueFrame(frame: number, loadout: HeroVisualLoadout): CompiledSprite {
  const b = new PixelBuf(24, 24);
  const skin = hueRamp(4, { hue: 24, sat: 0.56, lightMin: 0.42, lightMax: 0.86, shift: 16 });
  const bob = frame === 1 || frame === 3 ? -1 : 0;
  const stride = frame === 1 ? 2 : frame === 3 ? -2 : 0;
  const wave = frame === 1 ? -1 : frame === 3 ? 1 : 0;

  if (loadout.armorTier === "none") {
    drawUnarmoredNovice(b, "bit_rogue", frame, loadout);
    drawRogueDaggers(b, loadout, bob, wave, skin, stride);
    return finalizeCharacter(b, "#4a3869", "#0f0b1c", "#d8f8ff");
  }

  const cloth = tierMetalRamp(loadout.armorTier, 245, 0.42);
  const scarf =
    loadout.armorTier === "uncommon"
      ? hueRamp(4, { hue: 146, sat: 0.88, lightMin: 0.24, lightMax: 0.78 })
      : loadout.armorTier === "rare"
        ? hueRamp(4, { hue: 192, sat: 0.92, lightMin: 0.26, lightMax: 0.84 })
        : loadout.armorTier === "legendary"
          ? hueRamp(4, { hue: 42, sat: 0.96, lightMin: 0.34, lightMax: 0.92 })
          : hueRamp(4, { hue: 344, sat: 0.9, satDrop: 0.12, lightMin: 0.24, lightMax: 0.78, shift: 20 });
  const cyan = tierAccentRamp(loadout.armorTier, 186);
  const white = hexToU32("#ffffff");
  const darkMask = hexToU32("#0f0d1c");

  // Streaming Glitch Scarf behind Rogue
  for (let i = 0; i < 7; i++) {
    const sx = 8 - i;
    const sy1 = 10 + bob + Math.round(Math.sin(i * 0.75 + frame * 1.6) * 1.3);
    const sy2 = 12 + bob + Math.round(Math.cos(i * 0.7 + frame * 1.6) * 1.1);
    b.pset(sx, sy1, i < 3 ? scarf[3] : scarf[2]);
    b.pset(sx, sy1 + 1, scarf[1]);
    if (i < 5) {
      b.pset(sx + 1, sy2, scarf[1]);
      if (i % 2 === 0) b.pset(sx, sy2 + 1, scarf[0]);
    }
  }

  // Agile Ninja Legs
  const backX = 9 - stride;
  const frontX = 13 + stride;
  b.litCapsule(10, 16 + bob, backX, 20, 1.5, 1.2, cloth);
  b.rect(backX - 1, 20, 3, 2, cloth[0]);
  b.litCapsule(12, 16 + bob, frontX, 20, 1.6, 1.3, cloth);
  b.rect(frontX - 1, 20, 4, 2, cloth[1]);
  b.pset(frontX, 20, scarf[2]);

  // Stealth Tunic & Harness
  b.litEllipse(11.5, 13.5 + bob, 3.6, 3.6, cloth);
  b.line(9, 11 + bob, 14, 15 + bob, cloth[4]);
  b.pset(12, 13 + bob, cyan[2]);
  b.rect(9, 15 + bob, 6, 1, scarf[1]);

  // High Scarf Collar
  b.rect(8, 9 + bob, 7, 2, scarf[2]);
  b.rect(8, 9 + bob, 4, 1, scarf[3]);
  b.rect(12, 10 + bob, 3, 1, scarf[1]);

  // Assassin Hood & Piercing Eyes
  b.litEllipse(11.5, 6.5 + bob, 3.8, 3.4, cloth);
  b.pset(7, 5 + bob, cloth[2]);
  b.pset(6, 6 + bob, cloth[1]);
  b.rect(10, 6 + bob, 5, 3, darkMask);
  b.rect(11, 7 + bob, 2, 1, white);
  b.pset(11, 6 + bob, cyan[2]);
  b.pset(14, 7 + bob, white);
  b.pset(14, 6 + bob, cyan[3]);

  drawFloatingChipMote(b, loadout.chipTier, frame, bob);
  drawRogueDaggers(b, loadout, bob, wave, skin, stride);

  return finalizeCharacter(b, "#4a3869", "#0f0b1c", "#d8f8ff");
}

// =========================================================================
// 4. PIXEL TINKER
// =========================================================================

function drawTinkerCarbine(
  b: PixelBuf,
  loadout: HeroVisualLoadout,
  bob: number,
  skin: Uint32Array,
  stride: number
) {
  if (loadout.weaponTier === "none") {
    drawBareFists(b, skin, bob, stride, loadout.ringTier);
    return;
  }

  const steel = tierMetalRamp(loadout.weaponTier, 208, 0.28);
  const em = tierAccentRamp(loadout.weaponTier, 146);
  const brass = hueRamp(4, { hue: 36, sat: 0.74, lightMin: 0.24, lightMax: 0.84 });
  const white = hexToU32("#ffffff");

  const gy = 13 + bob;
  b.rect(12, gy, 9, 3, steel[1]);
  b.rect(12, gy, 8, 1, steel[3]);
  b.rect(11, gy + 1, 2, 2, brass[2]);
  drawRingGlint(b, loadout.ringTier, 11, gy + 1);
  b.rect(15, gy + 1, 4, 1, em[2]);
  b.pset(16, gy + 1, em[3]);
  b.pset(18, gy + 1, white);
  b.rect(20, gy - 1, 2, 5, brass[2]);
  b.rect(20, gy - 1, 1, 3, brass[3]);
  b.pset(21, gy + 1, em[3]);
  b.pset(22, gy + 1, white);
}

function buildPixelTinkerFrame(frame: number, loadout: HeroVisualLoadout): CompiledSprite {
  const b = new PixelBuf(24, 24);
  const skin = hueRamp(4, { hue: 24, sat: 0.54, satDrop: 0.12, lightMin: 0.42, lightMax: 0.84, shift: 16 });
  const bob = frame === 1 || frame === 3 ? -1 : 0;
  const stride = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  const antSway = frame === 1 ? -1 : frame === 3 ? 1 : 0;

  if (loadout.armorTier === "none") {
    drawUnarmoredNovice(b, "pixel_tinker", frame, loadout);
    drawTinkerCarbine(b, loadout, bob, skin, stride);
    return finalizeCharacter(b, "#2e544c", "#0c1718", "#e8fff5");
  }

  const brass = tierMetalRamp(loadout.armorTier, 36, 0.72);
  const coat =
    loadout.armorTier === "rare"
      ? hueRamp(5, { hue: 196, sat: 0.62, lightMin: 0.18, lightMax: 0.72, shift: 22 })
      : loadout.armorTier === "epic"
        ? hueRamp(5, { hue: 274, sat: 0.6, lightMin: 0.16, lightMax: 0.7, shift: 24 })
        : loadout.armorTier === "legendary"
          ? hueRamp(5, { hue: 40, sat: 0.75, lightMin: 0.22, lightMax: 0.82, shift: 20 })
          : hueRamp(5, { hue: 168, sat: 0.56, satDrop: 0.14, lightMin: 0.16, lightMax: 0.68, shift: 24 });
  const em = tierAccentRamp(loadout.armorTier, 146);
  const steel = hueRamp(4, { hue: 208, sat: 0.26, satDrop: 0.1, lightMin: 0.24, lightMax: 0.86, shift: 20 });
  const white = hexToU32("#ffffff");

  // Power-Cell Backpack
  b.rect(4, 10 + bob, 4, 7, brass[1]);
  b.rect(4, 10 + bob, 2, 5, brass[3]);
  b.rect(5, 11 + bob, 2, 4, em[2]);
  b.pset(5, 11 + bob + (frame & 1), em[3]);
  b.pset(5, 12 + bob, white);

  // Work Boots & Legs
  const leftX = 8 - stride;
  const rightX = 12 + stride;
  b.rect(leftX, 17 + bob, 3, 3, brass[0]);
  b.rect(leftX - 1, 20, 4, 2, brass[1]);
  b.rect(rightX, 17 + bob, 3, 3, brass[1]);
  b.rect(rightX, 20, 4, 2, brass[2]);
  b.pset(rightX + 1, 20, brass[3]);

  // Tech Coat & Belt
  b.rect(7, 10 + bob, 8, 7, coat[1]);
  b.rect(7, 10 + bob, 4, 6, coat[3]);
  b.rect(8, 11 + bob, 2, 2, coat[4]);
  b.rect(10, 11 + bob, 3, 2, em[2]);
  b.pset(11, 11 + bob, white);
  b.rect(7, 15 + bob, 8, 2, brass[1]);
  b.rect(10, 15 + bob, 3, 2, brass[3]);

  // Bobbing Radio Antenna
  const ax = 8 + antSway;
  b.line(9, 4 + bob, ax, 1 + bob, steel[2]);
  b.pset(ax, 1 + bob, frame % 2 === 0 ? em[3] : white);

  // Aviator Helmet & Glowing Goggles
  b.rect(8, 8 + bob, 6, 2, skin[2]);
  b.rect(8, 8 + bob, 2, 2, skin[3]);
  b.litEllipse(11, 6 + bob, 4.2, 3.2, brass);
  b.rect(7, 6 + bob, 8, 2, steel[0]);
  b.rect(9, 5 + bob, 3, 3, steel[2]);
  b.rect(13, 5 + bob, 3, 3, steel[2]);
  b.rect(10, 6 + bob, 2, 2, em[2]);
  b.pset(10, 6 + bob, white);
  b.rect(13, 6 + bob, 2, 2, em[3]);
  b.pset(13, 6 + bob, white);

  drawFloatingChipMote(b, loadout.chipTier, frame, bob);
  drawTinkerCarbine(b, loadout, bob, skin, stride);

  return finalizeCharacter(b, "#2e544c", "#0c1718", "#e8fff5");
}

// =========================================================================
// 5. ORIGIN TOWN NPCs (24x24 High-Craft)
// =========================================================================

function buildElderNpc(): CompiledSprite {
  const b = new PixelBuf(24, 24);
  const robe = hueRamp(5, { hue: 224, sat: 0.62, satDrop: 0.14, lightMin: 0.2, lightMax: 0.72, shift: 24 });
  const gold = hueRamp(4, { hue: 46, sat: 0.88, satDrop: 0.12, lightMin: 0.34, lightMax: 0.88, shift: 20 });
  const hair = hueRamp(4, { hue: 220, sat: 0.16, satDrop: 0.08, lightMin: 0.56, lightMax: 0.96, shift: 14 });
  const skin = hueRamp(4, { hue: 24, sat: 0.5, satDrop: 0.12, lightMin: 0.44, lightMax: 0.84, shift: 16 });
  const wood = hueRamp(4, { hue: 28, sat: 0.52, satDrop: 0.12, lightMin: 0.22, lightMax: 0.56, shift: 16 });

  for (let row = 0; row < 10; row++) {
    const hw = 3.5 + row * 0.22;
    for (let x = Math.round(11 - hw); x <= Math.round(11 + hw); x++) {
      b.pset(x, 11 + row, x < 11 ? robe[3] : x < 13 ? robe[2] : robe[1]);
    }
  }
  b.rect(10, 12, 2, 8, gold[2]);
  b.rect(7, 20, 9, 1, gold[2]);
  b.litEllipse(11, 12, 5.2, 2.2, robe);
  b.rect(7, 13, 8, 1, gold[3]);

  b.litEllipse(11, 6.5, 3.6, 3.2, hair);
  b.rect(9, 6, 5, 3, skin[2]);
  b.pset(10, 7, hexToU32("#1b2640"));
  b.pset(13, 7, hexToU32("#1b2640"));
  b.rect(9, 9, 5, 3, hair[2]);
  b.rect(10, 12, 3, 2, hair[3]);
  b.pset(11, 14, hair[3]);
  b.rect(8, 4, 7, 1, gold[2]);
  b.rect(10, 3, 3, 2, gold[3]);

  b.rect(18, 8, 2, 13, wood[1]);
  b.rect(18, 8, 1, 13, wood[3]);
  b.litEllipse(18.5, 6, 2.2, 2.2, gold);
  b.pset(18, 5, hexToU32("#ffffff"));

  return finalizeCharacter(b, "#394d80", "#111021", "#fff6d8");
}

function buildBlacksmithNpc(): CompiledSprite {
  const b = new PixelBuf(24, 24);
  const skin = hueRamp(4, { hue: 22, sat: 0.54, satDrop: 0.12, lightMin: 0.36, lightMax: 0.8, shift: 18 });
  const apron = hueRamp(4, { hue: 20, sat: 0.48, satDrop: 0.12, lightMin: 0.18, lightMax: 0.54, shift: 18 });
  const band = hueRamp(4, { hue: 14, sat: 0.88, satDrop: 0.12, lightMin: 0.32, lightMax: 0.78, shift: 22 });
  const steel = hueRamp(4, { hue: 212, sat: 0.24, satDrop: 0.1, lightMin: 0.26, lightMax: 0.88, shift: 18 });
  const ember = hueRamp(4, { hue: 28, sat: 0.95, satDrop: 0.1, lightMin: 0.42, lightMax: 0.9, shift: 20 });

  b.rect(7, 19, 4, 3, apron[0]);
  b.rect(12, 19, 4, 3, apron[1]);

  b.rect(6, 10, 11, 9, apron[1]);
  b.rect(6, 10, 5, 8, apron[2]);
  b.rect(8, 11, 7, 8, apron[1]);
  b.rect(8, 11, 3, 7, apron[3]);
  b.rect(7, 15, 9, 1, steel[2]);
  b.pset(11, 15, ember[3]);
  b.litEllipse(6, 12.5, 2, 2.8, skin);
  b.litEllipse(16.5, 12.5, 2, 2.8, skin);

  b.litEllipse(11, 6.8, 3.8, 3.2, skin);
  b.rect(7, 4, 9, 2, band[2]);
  b.rect(8, 4, 5, 1, band[3]);
  b.pset(6, 5, band[1]);
  b.pset(10, 7, hexToU32("#181010"));
  b.pset(13, 7, hexToU32("#181010"));
  b.rect(8, 8, 6, 3, apron[0]);
  b.rect(9, 9, 4, 2, apron[1]);

  b.rect(18, 9, 2, 10, apron[2]);
  b.rect(16, 6, 6, 4, steel[2]);
  b.rect(16, 6, 4, 2, steel[3]);
  b.rect(20, 6, 2, 4, ember[2]);
  b.pset(21, 7, ember[3]);

  return finalizeCharacter(b, "#5c3424", "#170c0b", "#ffe5cc");
}

function buildMerchantNpc(): CompiledSprite {
  const b = new PixelBuf(24, 24);
  const cloak = hueRamp(5, { hue: 148, sat: 0.64, satDrop: 0.14, lightMin: 0.18, lightMax: 0.74, shift: 24 });
  const pack = hueRamp(4, { hue: 26, sat: 0.56, satDrop: 0.12, lightMin: 0.22, lightMax: 0.58, shift: 18 });
  const gold = hueRamp(4, { hue: 46, sat: 0.9, satDrop: 0.1, lightMin: 0.36, lightMax: 0.88, shift: 20 });
  const skin = hueRamp(4, { hue: 24, sat: 0.54, satDrop: 0.12, lightMin: 0.44, lightMax: 0.86, shift: 16 });

  b.rect(4, 10, 4, 7, pack[1]);
  b.rect(4, 10, 2, 4, pack[3]);
  b.rect(4, 12, 4, 1, gold[2]);

  b.rect(8, 19, 3, 3, pack[0]);
  b.rect(12, 19, 3, 3, pack[1]);
  for (let row = 0; row < 9; row++) {
    const hw = 3.4 + row * 0.22;
    for (let x = Math.round(11 - hw); x <= Math.round(11 + hw); x++) {
      b.pset(x, 11 + row, x < 11 ? cloak[3] : x < 14 ? cloak[2] : cloak[1]);
    }
  }
  b.rect(8, 15, 7, 1, pack[2]);
  b.litEllipse(15.5, 16, 2, 2, gold);
  b.pset(15, 15, hexToU32("#ffffff"));

  b.litEllipse(11, 7.5, 3.2, 2.8, skin);
  b.pset(10, 8, hexToU32("#10241a"));
  b.pset(13, 8, hexToU32("#10241a"));
  b.litEllipse(10.5, 4.8, 5, 2.2, cloak);
  b.rect(8, 5, 6, 1, gold[2]);
  b.line(14, 4, 17, 2, gold[3]);
  b.pset(16, 3, gold[2]);

  return finalizeCharacter(b, "#266143", "#0b1a12", "#e8ffef");
}

// =========================================================================
// PUBLIC BUILDER EXPORTS
// =========================================================================

const PREVIEW_LOADOUT: HeroVisualLoadout = {
  weaponTier: "rare",
  armorTier: "rare",
  ringTier: "rare",
  chipTier: "rare",
  weaponEnhance: 5,
};

export function buildDynamicHeroFrames(
  classId: ClassId,
  loadout: HeroVisualLoadout
): CompiledSprite[] {
  const frames = [0, 1, 2, 3];
  if (classId === "prism_knight") return frames.map((f) => buildPrismKnightFrame(f, loadout));
  if (classId === "chroma_mage") return frames.map((f) => buildChromaMageFrame(f, loadout));
  if (classId === "bit_rogue") return frames.map((f) => buildBitRogueFrame(f, loadout));
  return frames.map((f) => buildPixelTinkerFrame(f, loadout));
}

export function buildAllHeroSprites(): Record<ClassId, CompiledSprite[]> {
  return {
    prism_knight: buildDynamicHeroFrames("prism_knight", PREVIEW_LOADOUT),
    chroma_mage: buildDynamicHeroFrames("chroma_mage", PREVIEW_LOADOUT),
    bit_rogue: buildDynamicHeroFrames("bit_rogue", PREVIEW_LOADOUT),
    pixel_tinker: buildDynamicHeroFrames("pixel_tinker", PREVIEW_LOADOUT),
  };
}

export function buildAllNpcSprites(): Record<string, CompiledSprite> {
  return {
    elder: buildElderNpc(),
    blacksmith: buildBlacksmithNpc(),
    merchant: buildMerchantNpc(),
  };
}
