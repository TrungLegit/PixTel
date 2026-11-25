import { fit, cycle, sparkle, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Chroma vortex",
  desc: "A top-down swirling prismatic vortex that draws chroma motes inward along three spinning spiral arms.",
  tags: ["chroma", "vortex", "spiral", "arcane", "aoe", "loop"],
  size: [112, 112],
  origin: [56, 56],
  duration: 1.6,
  loop: true,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#ff3366", "#ffaa33", "#44ee88", "#33ddff", "#aa55ff", "#e8c8ff", "#ffffff"],
    radius: 42,
    seed: 7,
  },
};

const D = meta.duration;

export function draw(p, t, o) {
  const C = fit(o.palette, 7), R = o.radius, ph = t / D, S = o.seed;
  const spin = ph * TAU * 2;

  // Outer dashed containment ring
  for (let i = 0; i < 48; i++) {
    if (i % 4 === 3) continue;
    const a = (i / 48) * TAU - spin * 0.5;
    const rr = R * (0.95 + 0.03 * Math.sin(a * 3 + spin));
    p.dot(Math.cos(a) * rr, Math.sin(a) * rr * 0.85, C[Math.floor((i / 48) * 5)], 0.75);
  }

  // Three spiral arms winding inward
  for (let arm = 0; arm < 3; arm++) {
    const col = C[(arm * 2) % 5];
    const colBright = C[5];
    for (let j = 0; j <= 32; j++) {
      const q = 0.14 + 0.84 * (j / 32);
      const a = spin + (arm * TAU) / 3 - 2.6 * Math.log(q);
      const x = Math.cos(a) * q * R, y = Math.sin(a) * q * R * 0.85;
      p.dot(x, y, q < 0.28 ? WHITE : q < 0.55 ? colBright : col, q > 0.25 ? 1 : q / 0.25);
    }
  }

  // Motes sucked inward seamlessly
  cycle(t, D, 24, S, (r) => r.range(0.45, 0.85), (age, life, r, idx) => {
    const u = age / life;
    const rad = R * (1.05 - u * 0.92);
    const a = r.range(0, TAU) + u * 3.8;
    const x = Math.cos(a) * rad, y = Math.sin(a) * rad * 0.85;
    const c = u > 0.75 ? WHITE : C[idx % 5];
    p.dot(x, y, c, Math.sin(u * Math.PI));
    if (u > 0.3 && u < 0.85 && idx % 3 === 0) p.glow(x, y, 4, c, 0.25);
  });

  // Eye of the vortex
  const pulse = 3.2 + 0.8 * Math.sin(ph * TAU * 4);
  p.circle(0, 0, pulse + 1.2, C[4]);
  p.circle(0, 0, pulse, WHITE);
  sparkle(p, 0, 0, 5 + Math.sin(ph * TAU * 2), WHITE, C[3], 0.5);
  p.glow(0, 0, R * 0.75, C[4], 0.32);
}
