import { fit, cycle, flare, TAU, WHITE, hex } from "../../core/index.js";

export const meta = {
  name: "Cursed Item Aura",
  desc: "Looping dark crimson cracked-rune slot aura with rising blood embers for cursed relics.",
  tags: ["ui", "cursed", "aura", "loop", "pixtel"],
  size: [48, 48],
  origin: [24, 24],
  duration: 1.4,
  loop: true,
  fps: 20,
  bg: "dark",
  options: {
    palette: ["#1f0510", "#4f0b1e", "#881337", "#be123c", "#f43f5e", "#fb7185", "#fecdd3", "#ffffff"],
    radius: 15,
    seed: 66,
  },
};

const D = meta.duration;
const DARK_INK = hex("#12040b");

export function drawBack(p, t, o) {
  const C = fit(o.palette, 8);
  const R = o.radius ?? 15;
  const ph = (t % D) / D;
  const pulse = 0.5 + 0.5 * Math.sin(ph * TAU * 2);

  // Dark blood core halo behind icon
  p.glow(0, 0, R * 1.32, C[4], 0.22 + 0.1 * pulse);
  p.glowRing(0, 0, R * 0.92, 3.0, C[5], 0.25 + 0.08 * pulse);

  // Counter-rotating jagged rune segments + dark cursed cracks
  const n = 24;
  const rot1 = ph * TAU;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rot1;
    const jag = i % 3 === 0 ? 1.06 : i % 3 === 1 ? 0.92 : 0.84;
    if (i % 6 === 5) continue;
    const col = i % 6 === 0 ? C[6] : i % 2 === 0 ? C[4] : C[2];
    p.dot(Math.cos(a) * R * jag, Math.sin(a) * R * jag, col, 0.88);
  }

  // Dark obsidian cross-cracks pulsing behind relic
  const crackPulse = Math.max(0, Math.sin(ph * TAU * 2 + 0.7));
  for (let k = 0; k < 4; k++) {
    const baseA = (k * TAU) / 4 + Math.PI / 4;
    for (let d = 5; d <= R * 1.08; d += 1) {
      const zig = ((d | 0) % 3 === 0 ? 1 : -1) * 0.8;
      const cx = Math.cos(baseA) * d - Math.sin(baseA) * zig;
      const cy = Math.sin(baseA) * d + Math.cos(baseA) * zig;
      const col = d > R * 0.8 && crackPulse > 0.4 ? C[5] : d % 2 === 0 ? C[3] : DARK_INK;
      p.dot(cx, cy, col, 0.72);
    }
  }
}

export function draw(p, t, o) {
  const C = fit(o.palette, 8);
  const R = o.radius ?? 15;
  const ph = (t % D) / D;
  const seed = o.seed ?? 66;

  // Rising cursed blood embers
  cycle(
    t,
    D,
    10,
    seed,
    (g) => g.range(0.55, 0.9),
    (age, life, r, idx) => {
      const u = age / life;
      const sx = r.range(-R * 0.7, R * 0.7);
      const sy = r.range(R * 0.1, R * 0.65) - u * r.range(R * 0.6, R * 1.15);
      const alpha = Math.min(1, u / 0.2, (1 - u) / 0.3);
      if (alpha <= 0.05) return;
      const col = u < 0.2 ? WHITE : idx % 2 === 0 ? C[5] : C[4];
      p.dot(sx, sy, col, alpha);
      if (idx % 3 === 0 && alpha > 0.45) {
        p.glow(sx, sy, 2.2, C[4], 0.24 * alpha);
      }
    }
  );

  // Twin crimson cursed wisps orbiting diagonally
  for (let k = 0; k < 2; k++) {
    const ang = -ph * TAU + k * Math.PI;
    const ox = Math.cos(ang) * (R * 0.88);
    const oy = Math.sin(ang) * (R * 0.62);
    flare(p, ox, oy, 2.6, 0.68, C);
    p.dot(ox, oy, k === 0 ? WHITE : C[6], 0.92);
  }
}
