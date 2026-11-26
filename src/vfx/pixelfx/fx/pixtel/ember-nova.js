import { fit, clamp, smooth, ease, Rng, TAU, WHITE, PAL } from "../../core/index.js";

export const meta = {
  name: "Ember Nova",
  desc: "Expanding furnace shockwave ring with radial embers and golden shield sparks.",
  tags: ["fire", "nova", "shield", "pixtel", "one-shot"],
  size: [112, 112],
  origin: [56, 56],
  duration: 0.65,
  loop: false,
  fps: 22,
  bg: "dark",
  options: {
    palette: PAL.fire,
    gold: PAL.gold,
    reach: 38,
    seed: 29,
  },
};

const D = meta.duration;

export function create(o) {
  const C = fit(o.palette, 8);
  const G = fit(o.gold ?? PAL.gold, 8);
  const REACH = o.reach ?? 38;
  const rng = new Rng(o.seed ?? 29);

  const rays = Array.from({ length: 18 }, (_, i) => ({
    a: (i / 18) * TAU + rng.range(-0.1, 0.1),
    speed: rng.range(REACH * 0.85, REACH * 1.25),
    life: rng.range(0.32, 0.56),
    gold: i % 3 === 0,
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
      const u = clamp(t / 0.48);
      const r = 6 + (REACH - 6) * ease.outCubic(u);
      const ringAlpha = 1 - smooth(0.28, 0.54, t);

      // Brief inner golden shield flash
      const shieldU = clamp(t / 0.3);
      if (shieldU < 1) {
        const sr = 10 + 6 * Math.sin(shieldU * Math.PI);
        p.glow(0, 0, sr, G[5], 0.45 * (1 - shieldU));
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU - Math.PI / 6;
          const aNext = ((i + 1) / 6) * TAU - Math.PI / 6;
          for (let k = 0; k < 5; k++) {
            const s = k / 5;
            const hx = (Math.cos(a) * (1 - s) + Math.cos(aNext) * s) * 12;
            const hy = (Math.sin(a) * (1 - s) + Math.sin(aNext) * s) * 12;
            p.dot(hx, hy, k === 0 ? WHITE : G[5], (1 - shieldU) * 0.85);
          }
        }
      }

      // Expanding fire ring
      if (ringAlpha > 0.03) {
        p.glowRing(0, 0, r, 4.5, C[5], 0.34 * ringAlpha);
        const steps = 40;
        for (let i = 0; i < steps; i++) {
          const a = (i / steps) * TAU;
          const thick = 3 * (1 - u * 0.5);
          for (let dr = -thick; dr <= 1; dr += 1) {
            const rr = r + dr;
            if (rr < 1) continue;
            const col = dr > 0 ? WHITE : dr > -1.2 ? G[5] : C[4];
            p.dot(Math.cos(a) * rr, Math.sin(a) * rr, col, ringAlpha);
          }
        }
      }

      // Radial molten embers
      for (const ray of rays) {
        if (t >= ray.life) continue;
        const ru = t / ray.life;
        const dist = 5 + ease.outCubic(ru) * ray.speed;
        const ex = Math.cos(ray.a) * dist;
        const ey = Math.sin(ray.a) * dist;
        const ea = 1 - smooth(0.45, 1, ru);
        const col = ru < 0.2 ? WHITE : ray.gold ? G[5] : C[5];
        p.dot(ex, ey, col, ea);
        p.dot(ex - Math.cos(ray.a) * 1.5, ey - Math.sin(ray.a) * 1.5, C[3], ea * 0.7);
      }
    },
  };
}
