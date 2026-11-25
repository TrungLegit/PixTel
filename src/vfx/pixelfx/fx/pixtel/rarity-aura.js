import { fit, clamp, smooth, cycle, sparkle, flare, TAU, WHITE, hex } from "../../core/index.js";

export const meta = {
  name: "Item rarity aura",
  desc: "Layered pixel-art aura for Rare (T3), Epic (T4), and Legendary (T5) items with crystalline rings, orbiting wisps, stardust motes, and hero glints.",
  tags: ["item", "rarity", "aura", "ui", "loot", "loop"],
  size: [48, 48],
  origin: [24, 24],
  duration: 1.6,
  loop: true,
  fps: 24,
  bg: "dark",
  options: {
    palette: ["#24160a", "#5e3a0c", "#a8680f", "#e8a218", "#ffd23c", "#fff08a", "#fffbe6", "#ffffff"],
    tier: 5,
    radius: 14,
    seed: 19,
  },
};

const D = meta.duration;
const CYAN_SPARK = [WHITE, hex("#b4fff0"), hex("#38b6ff"), hex("#1c76bc")];
const MAGENTA_SPARK = [WHITE, hex("#ffd2f6"), hex("#e466ff"), hex("#7330c0")];

/** Rotates local offset (x, y) by tilt angle cs/sn and projects onto elliptical orbit */
function orbitPos(ang, rx, ry, tilt = 0.35) {
  const lx = Math.cos(ang) * rx;
  const ly = Math.sin(ang) * ry;
  const cs = Math.cos(tilt);
  const sn = Math.sin(tilt);
  return [lx * cs - ly * sn, lx * sn + ly * cs];
}

export function drawBack(p, t, o) {
  const C = fit(o.palette, 8);
  const R = o.radius ?? 14;
  const tier = clamp(o.tier ?? 3, 3, 5) | 0;
  const ph = (t % D) / D;
  const pulse = 0.5 + 0.5 * Math.sin(ph * TAU * 2);

  // Soft additive halo behind item icon
  const baseK = tier >= 5 ? 0.28 + 0.1 * pulse : tier === 4 ? 0.22 + 0.08 * pulse : 0.16 + 0.05 * pulse;
  p.glow(0, 0, R * (tier >= 5 ? 1.4 : tier === 4 ? 1.25 : 1.12), C[4], baseK);

  if (tier === 3) {
    // Tier 3 (Rare): Crisp rotating crystalline ring + diagonal shimmer sweep
    const steps = 20;
    const rot = ph * TAU * 0.5;
    for (let i = 0; i < steps; i++) {
      if (i % 5 === 4) continue;
      const a = (i / steps) * TAU + rot;
      const rr = R * (i % 2 === 0 ? 0.96 : 0.88);
      const col = i % 4 === 0 ? C[6] : i % 2 === 0 ? C[5] : C[4];
      p.dot(Math.cos(a) * rr, Math.sin(a) * rr, col, 0.82);
    }

    const g = (ph - 0.12) / 0.34;
    if (g > 0 && g < 1) {
      const sweep = (-1 + 2 * g) * R * 1.1;
      for (let d = -R * 0.72; d <= R * 0.72; d += 1) {
        const sx = sweep * 0.65 + d * 0.65;
        const sy = sweep * 0.65 - d * 0.65;
        if (Math.hypot(sx, sy) < R * 0.85) {
          p.dot(sx, sy, C[6], 0.55 * Math.sin(g * Math.PI));
        }
      }
    }
    return;
  }

  if (tier === 4) {
    // Tier 4 (Epic): Dual counter-rotating stepped rune rings + outer ring glow
    p.glowRing(0, 0, R * 0.92, 3.2, C[5], 0.2 + 0.06 * pulse);

    const outerN = 28;
    const rot1 = ph * TAU;
    for (let i = 0; i < outerN; i++) {
      if ((i % 7) >= 5) continue;
      const a = (i / outerN) * TAU + rot1;
      const bright = i % 7 === 0 || i % 7 === 1;
      p.dot(Math.cos(a) * R, Math.sin(a) * R, bright ? C[6] : C[4], 0.9);
    }

    const innerN = 18;
    const rot2 = -ph * TAU * 2;
    const ri = R * 0.72;
    for (let i = 0; i < innerN; i++) {
      if (i % 3 === 2) continue;
      const a = (i / innerN) * TAU + rot2;
      p.dot(Math.cos(a) * ri, Math.sin(a) * ri, i % 6 === 0 ? WHITE : C[5], 0.72);
    }
    return;
  }

  // Tier 5 (Legendary): Golden corona ring + rotating cardinal star-rays + twin shimmer
  p.glowRing(0, 0, R, 3.8, C[5], 0.28 + 0.08 * pulse);

  const crownN = 32;
  const rotC = ph * TAU;
  for (let i = 0; i < crownN; i++) {
    const a = (i / crownN) * TAU + rotC;
    const mod = i % 8;
    const rr = mod === 0 ? R * 1.04 : R * 0.96;
    const col = mod === 0 ? WHITE : mod === 1 || mod === 7 ? C[6] : mod % 2 === 0 ? C[5] : C[3];
    if (mod !== 4) p.dot(Math.cos(a) * rr, Math.sin(a) * rr, col, mod === 0 ? 1 : 0.88);
  }

  // 4 rotating cardinal solar rays
  const rayMin = R * 0.55;
  const rayMax = R * (1.02 + 0.14 * pulse);
  for (let k = 0; k < 4; k++) {
    const ang = rotC * 0.5 + (k * TAU) / 4;
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    for (let dist = rayMin; dist <= rayMax; dist += 1) {
      const u = (dist - rayMin) / Math.max(1, rayMax - rayMin);
      const col = u < 0.35 ? WHITE : u < 0.7 ? C[6] : C[4];
      p.dot(ca * dist, sa * dist, col, 1 - u * 0.55);
    }
  }

  // Subtle central hero flare pulse twice per cycle
  const f1 = Math.max(0, Math.sin(ph * TAU * 2));
  if (f1 > 0.45) {
    flare(p, 0, 0, R * 0.65 * f1, 0.35 * f1, C);
  }
}

export function draw(p, t, o) {
  const C = fit(o.palette, 8);
  const R = o.radius ?? 14;
  const tier = clamp(o.tier ?? 3, 3, 5) | 0;
  const ph = (t % D) / D;

  // 1. Rising pixel stardust motes around the item silhouette
  const moteCount = tier >= 5 ? 12 : tier === 4 ? 8 : 5;
  cycle(
    t,
    D,
    moteCount,
    o.seed ?? 19,
    (g) => g.range(0.55, 0.95),
    (age, life, r, idx) => {
      const u = age / life;
      const spreadX = r.range(-R * 0.72, R * 0.72);
      const sway = Math.sin(u * TAU + r.range(0, TAU)) * 1.4;
      const startY = r.range(R * 0.05, R * 0.58);
      const rise = r.range(R * 0.55, R * 1.05);
      const x = spreadX + sway;
      const y = startY - u * rise;
      const alpha = Math.min(1, u / 0.2, (1 - u) / 0.3);
      if (alpha <= 0.05) return;

      let col = u < 0.25 ? WHITE : u < 0.6 ? C[6] : C[4];
      if (tier >= 5 && idx % 4 === 1) col = CYAN_SPARK[1];
      else if (tier >= 5 && idx % 4 === 3) col = MAGENTA_SPARK[1];

      p.dot(x, y, col, alpha);
      if (tier >= 4 && idx % 3 === 0 && alpha > 0.5) {
        p.glow(x, y, 2.5, col, 0.22 * alpha);
      }
    }
  );

  // 2. Orbiting trails for Tier 4 & Tier 5
  if (tier === 4) {
    for (let k = 0; k < 2; k++) {
      const headAng = ph * TAU * 1.5 + k * Math.PI;
      for (let s = 3; s >= 0; s--) {
        const [ox, oy] = orbitPos(headAng - s * 0.22, R * 0.85, R * 0.52, -0.42);
        const col = s === 0 ? WHITE : s === 1 ? C[6] : s === 2 ? C[5] : C[3];
        p.dot(ox, oy, col, s === 0 ? 1 : 1 - s * 0.24);
        if (s === 0) p.glow(ox, oy, 3.8, C[5], 0.28);
      }
    }
  } else if (tier >= 5) {
    const trails = [
      { ramp: [WHITE, C[6], C[5], C[3]], tilt: -0.45, spd: 1 },
      { ramp: CYAN_SPARK, tilt: 0.45, spd: -1 },
      { ramp: MAGENTA_SPARK, tilt: 0.05, spd: 1 },
    ];
    for (let k = 0; k < trails.length; k++) {
      const tr = trails[k];
      const headAng = ph * TAU * tr.spd + (k * TAU) / 3;
      for (let s = 4; s >= 0; s--) {
        const [ox, oy] = orbitPos(headAng - tr.spd * s * 0.2, R * 0.9, R * 0.56, tr.tilt);
        const col = s === 0 ? tr.ramp[0] : s <= 2 ? tr.ramp[1] : tr.ramp[2];
        p.dot(ox, oy, col, s === 0 ? 1 : clamp(1 - s * 0.2, 0.2, 1));
        if (s === 0) p.glow(ox, oy, 4.2, tr.ramp[2], 0.34);
      }
    }
  }

  // 3. Sharp alternating 4-point hero sparkles at rim corners
  const glintA = Math.sin(clamp((ph - 0.08) / 0.36, 0, 1) * Math.PI);
  if (glintA > 0.2) {
    sparkle(p, R * 0.62, -R * 0.6, (tier >= 5 ? 3.2 : 2.3) * glintA, C[6], C[4], 0.45 * glintA);
  }
  const glintB = Math.sin(clamp((ph - 0.56) / 0.36, 0, 1) * Math.PI);
  if (glintB > 0.2) {
    const gCol = tier >= 5 ? CYAN_SPARK[1] : C[6];
    const gTip = tier >= 5 ? CYAN_SPARK[2] : C[4];
    sparkle(p, -R * 0.64, R * 0.54, (tier >= 5 ? 2.9 : 2.1) * glintB, gCol, gTip, 0.4 * glintB);
  }
  if (tier >= 4) {
    const glintC = Math.sin(clamp((ph - 0.32) / 0.3, 0, 1) * Math.PI);
    if (glintC > 0.25) {
      sparkle(p, -R * 0.56, -R * 0.66, (tier >= 5 ? 2.5 : 1.8) * glintC, C[6], C[4], 0.35 * glintC);
    }
  }
}
