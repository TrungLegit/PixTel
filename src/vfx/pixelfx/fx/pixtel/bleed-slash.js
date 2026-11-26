import { fit, clamp, smooth, Rng, WHITE } from "../../core/index.js";

export const meta = {
  name: "Bleed Slash",
  desc: "Razor crimson X-slash with dripping blood droplets for critical bleed procs.",
  tags: ["bleed", "crit", "slash", "pixtel", "one-shot"],
  size: [64, 64],
  origin: [32, 32],
  duration: 0.45,
  loop: false,
  fps: 24,
  bg: "dark",
  options: {
    palette: ["#260610", "#6e0d24", "#be123c", "#f43f5e", "#fb7185", "#fecdd3", "#fff1f2", "#ffffff"],
    seed: 13,
  },
};

const D = meta.duration;

export function create(o) {
  const C = fit(o.palette, 8);
  const rng = new Rng(o.seed ?? 13);
  const drops = Array.from({ length: 10 }, () => ({
    x0: rng.range(-10, 10),
    y0: rng.range(-8, 6),
    vx: rng.range(-16, 16),
    vy: rng.range(-22, 6),
    t0: rng.range(0.05, 0.16),
    life: rng.range(0.2, 0.28),
  }));

  let t = 0;
  return {
    update(dt) {
      t += dt;
    },
    done() {
      return t >= D;
    },
    draw(p) {
      if (t >= D) return;

      const drawCut = (x0, y0, x1, y1, startT) => {
        const u = clamp((t - startT) / 0.14);
        const fade = 1 - smooth(startT + 0.14, D - 0.03, t);
        if (u <= 0 || fade <= 0.03) return;
        const steps = 20;
        const maxI = Math.floor(steps * u);
        for (let i = 0; i <= maxI; i++) {
          const s = i / steps;
          const px = x0 + (x1 - x0) * s;
          const py = y0 + (y1 - y0) * s;
          const thick = Math.sin(s * Math.PI) * 1.4;
          const col = s > u - 0.18 && u < 0.95 ? WHITE : s > 0.3 && s < 0.7 ? C[5] : C[3];
          p.dot(px, py, col, fade);
          if (thick > 0.8) {
            p.dot(px, py + 1, C[2], fade * 0.85);
            p.dot(px, py - 1, C[4], fade * 0.7);
          }
        }
        p.glow((x0 + x1) * 0.5, (y0 + y1) * 0.5, 9, C[4], 0.28 * fade);
      };

      drawCut(-16, -14, 16, 14, 0.0);
      drawCut(15, -13, -15, 13, 0.08);

      // Dripping crimson droplets with gravity
      for (const d of drops) {
        const age = t - d.t0;
        if (age < 0 || age >= d.life) continue;
        const u = age / d.life;
        const x = d.x0 + d.vx * age;
        const y = d.y0 + d.vy * age + 90 * age * age;
        const da = 1 - smooth(0.55, 1, u);
        p.dot(x, y, u < 0.25 ? C[5] : C[3], da);
        p.dot(x, y + 1, C[2], da * 0.85);
      }
    },
  };
}
