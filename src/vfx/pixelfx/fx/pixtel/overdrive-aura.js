import { fit, cycle, sparkle, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Overdrive aura",
  desc: "Cycling rainbow pixel flames and rising diamond motes for Chroma Overdrive.",
  tags: ["overdrive", "aura", "rainbow", "buff", "loop"],
  size: [64, 64],
  origin: [32, 38],
  duration: 1.2,
  loop: true,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#ff3366", "#ffaa22", "#ffee33", "#44ee88", "#33ddff", "#bb55ff", "#ffffff"],
    radius: 13,
    seed: 5,
  },
};

const D = meta.duration;

export function draw(p, t, o) {
  const C = fit(o.palette, 7), R = o.radius, ph = t / D;

  // Pulsing prismatic base ring
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * TAU + ph * TAU;
    const x = Math.cos(a) * R, y = Math.sin(a) * R * 0.65;
    const col = C[(i + Math.floor(ph * 12)) % 6];
    p.dot(x, y, col, 0.85);
  }

  // Rising pixel motes around hero
  cycle(t, D, 14, o.seed, (r) => r.range(0.35, 0.65), (age, life, r, idx) => {
    const u = age / life;
    const a = r.range(0, TAU) + u * 2.2;
    const rx = R * (0.7 + 0.4 * Math.sin(u * Math.PI));
    const x = Math.cos(a) * rx, y = Math.sin(a) * rx * 0.55 - u * 20;
    const c = u < 0.2 ? WHITE : C[idx % 6];
    p.dot(x, y, c, 1 - u);
    if (idx % 4 === 0 && u > 0.2 && u < 0.7) sparkle(p, x, y, 2, WHITE, c, 0.35 * (1 - u));
  });

  p.glow(0, -6, R * 1.4, C[Math.floor(ph * 6) % 6], 0.25);
}
