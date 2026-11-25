import { Particles, P, Rng, fit, sparkle, clamp, ease, smooth, rand, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Color wave",
  desc: "An expanding prismatic pixel shockwave that sweeps across the ground, leaving Bayer-dithered color trails and sparkling motes.",
  tags: ["chroma", "wave", "ring", "rainbow", "restoration", "one-shot"],
  size: [192, 192],
  origin: [96, 96],
  duration: 0.9,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#ff3366", "#ff9933", "#ffee44", "#44ee88", "#33ddff", "#cc55ff", "#ffffff"],
    radius: 78,
    seed: 1,
  },
};

export function create(o) {
  const C = fit(o.palette, 7), R = new Rng(o.seed), RMAX = o.radius;
  const ps = new Particles({ rng: R, sparks: [WHITE, C[4], C[2], C[0]] });
  const D = meta.duration;
  let t = 0, lastRing = 0;

  return {
    update(dt) {
      t += dt;
      const u = clamp(t / (D * 0.85));
      const curR = 6 + (RMAX - 6) * ease.outCubic(u);
      if (t < D * 0.72 && curR - lastRing >= 8) {
        lastRing = curR;
        const count = 6;
        for (let i = 0; i < count; i++) {
          const a = R.range(0, TAU), sp = R.range(12, 36);
          const col = C[R.int(0, 5)];
          ps.spawn(P.STAR, Math.cos(a) * curR, Math.sin(a) * curR, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.22, 0.42), col, R.range(0.8, 1.8));
        }
      }
      ps.update(dt);
    },
    draw(p) {
      if (t >= D) return;
      const u = clamp(t / (D * 0.85));
      const fade = 1 - smooth(D * 0.65, D - 0.04, t);
      if (fade <= 0) {
        ps.draw(p);
        return;
      }
      const r = 6 + (RMAX - 6) * ease.outCubic(u);
      const w = Math.max(2, 11 * (1 - u * 0.65));
      const rIn = Math.max(0, r - w);
      p.shade(-r - 2, -r - 2, r + 2, r + 2, (x, y, out) => {
        const d = Math.hypot(x, y);
        if (d > r || d < rIn) return;
        const q = (r - d) / w;
        const ang = Math.atan2(y, x);
        const hueShift = ((ang / TAU + 1 + u * 0.5) % 1) * 5.99;
        const bandIdx = Math.floor(q * 5 + hueShift * 0.35) % 6;
        if (q < 0.16 && u < 0.75) {
          out.c = WHITE;
          out.a = fade;
        } else {
          out.c = C[bandIdx];
          out.a = fade * (1 - q * 0.75);
        }
      });
      if (u < 0.85) {
        p.glowRing(0, 0, r - 1, 6, C[Math.floor(u * 5) % 6], 0.45 * fade);
      }
      if (t < 0.14) {
        sparkle(p, 0, 0, 7 * (1 - t / 0.14), WHITE, C[4], 0.5);
      }
      ps.draw(p);
    },
  };
}
