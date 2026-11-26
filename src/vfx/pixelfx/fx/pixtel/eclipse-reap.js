import { fit, clamp, smooth, ease, Rng, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Eclipse Reap",
  desc: "Sweeping crimson-violet crescent scythe cleave with void trails and eclipse sparks.",
  tags: ["melee", "cleave", "eclipse", "scythe", "pixtel", "one-shot"],
  size: [96, 96],
  origin: [48, 48],
  duration: 0.55,
  loop: false,
  fps: 24,
  bg: "dark",
  options: {
    palette: ["#1e081c", "#581c87", "#9f1239", "#e11d48", "#c084fc", "#fda4af", "#fff1f2", "#ffffff"],
    radius: 34,
    seed: 42,
  },
};

const D = meta.duration;

export function create(o) {
  const C = fit(o.palette, 8);
  const R = o.radius ?? 34;
  const rng = new Rng(o.seed ?? 42);
  const sparks = Array.from({ length: 16 }, () => ({
    a: rng.range(-Math.PI * 0.62, Math.PI * 0.62),
    r0: rng.range(R * 0.55, R * 0.95),
    sp: rng.range(18, 44),
    t0: rng.range(0.06, 0.22),
    life: rng.range(0.18, 0.34),
    col: rng.chance(0.45) ? C[4] : C[5],
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
      const headU = ease.outCubic(clamp(t / 0.24));
      const tailU = smooth(0.12, 0.52, t);
      const fade = 1 - smooth(0.32, D, t);
      if (fade <= 0.02 || tailU >= headU) return;

      const aStart = -Math.PI * 0.62 + tailU * Math.PI * 1.24;
      const aEnd = -Math.PI * 0.62 + headU * Math.PI * 1.24;
      const span = Math.max(0.01, aEnd - aStart);

      // Sweeping crescent blade arc
      const steps = 42;
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const a = aStart + u * span;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        const thickness = (3 + 7 * Math.sin(Math.PI * Math.pow(u, 1.4))) * (1 - 0.35 * tailU);
        for (let r = R - thickness; r <= R; r += 1) {
          const q = (R - r) / Math.max(1, thickness);
          const col =
            q < 0.2 && u > 0.72
              ? WHITE
              : q < 0.38
                ? C[5]
                : q < 0.68
                  ? C[3]
                  : C[1];
          const alpha = fade * Math.min(1, u / 0.25);
          p.dot(ca * r, sa * r, col, alpha);
        }
        if (i % 3 === 0 && u > 0.35) {
          p.glow(ca * (R - 2), sa * (R - 2), 4.5, u > 0.8 ? C[5] : C[4], 0.32 * fade * u);
        }
      }

      // Trailing crimson/violet scythe sparks
      for (const s of sparks) {
        const age = t - s.t0;
        if (age < 0 || age >= s.life) continue;
        const u = age / s.life;
        const dist = s.r0 + u * s.sp * 0.45;
        const px = Math.cos(s.a) * dist;
        const py = Math.sin(s.a) * dist;
        p.dot(px, py, u < 0.25 ? WHITE : s.col, (1 - u) * fade);
      }
    },
  };
}
