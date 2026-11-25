import { Particles, Lights, P, Rng, fit, sparkle, clamp, ease, smooth, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Leaf storm",
  desc: "Twin spiraling emerald wind ribbons with whirling razor leaves for Ancient Warden.",
  tags: ["nature", "wind", "leaf", "storm", "whirlwind", "one-shot"],
  size: [148, 148],
  origin: [74, 74],
  duration: 0.92,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#0d3d22", "#1c7a44", "#32c466", "#66ff88", "#b8ffca", "#ffffff"],
    radius: 52,
    seed: 11,
  },
};

const D = meta.duration;

export function create(o) {
  const C = fit(o.palette, 6);
  const R = new Rng(o.seed);
  const RMAX = Math.min(64, o.radius);
  const ps = new Particles({ rng: R, sparks: [WHITE, C[4], C[3], C[2]] });
  const lights = new Lights();

  const leaves = Array.from({ length: 18 }, (_, i) => ({
    a0: (i / 18) * TAU + R.range(-0.12, 0.12),
    r0: R.range(14, RMAX * 0.92),
    spd: R.range(8.5, 13.5),
    yScale: R.range(0.68, 0.88),
    tone: i % 3 === 0 ? C[4] : i % 3 === 1 ? C[3] : C[2],
  }));

  lights.add(0, 0, RMAX + 12, C[3], 0.65, 0.55);

  let t = 0;

  return {
    update(dt) {
      t += dt;
      if (t < D * 0.78 && R.chance(0.7)) {
        const a = R.range(0, TAU);
        const r = R.range(12, RMAX * 0.9);
        ps.spawn(
          P.MOTE,
          Math.cos(a) * r,
          Math.sin(a) * r * 0.78,
          -Math.sin(a) * 65,
          Math.cos(a) * 52,
          R.range(0.18, 0.36),
          R.chance(0.35) ? C[4] : C[3],
          0.75
        );
      }
      ps.update(dt);
      lights.update(dt);
    },
    draw(p) {
      if (t >= D) return;
      const u = clamp(t / D);
      const env = smooth(0, 0.12, u) * (1 - smooth(0.68, 1.0, u));
      const rCur = RMAX * (0.48 + 0.52 * ease.outCubic(clamp(t / 0.36)));
      const rot = t * 10.5;

      // Twin swirling emerald gale ribbons
      if (env > 0.02) {
        const ry = rCur * 0.78;
        p.shade(-rCur - 2, -ry - 2, rCur + 2, ry + 2, (x, y, out) => {
          const d = Math.hypot(x, y / 0.78);
          if (d < 10 || d > rCur) return;
          const rNorm = d / rCur;
          const baseAng = Math.atan2(y / 0.78, x);
          // 2 spiraling arms winding outward
          let rel = (baseAng - rot + rNorm * 3.1) % (Math.PI);
          if (rel < 0) rel += Math.PI;
          const bandDist = Math.abs(rel - 1.15);
          const halfW = 0.52 * (1 - 0.35 * rNorm);
          if (bandDist > halfW) return;
          const edge = bandDist / halfW;
          out.c = edge < 0.25 && u < 0.6 ? WHITE : edge < 0.58 ? C[4] : C[3];
          out.a = env * (1 - edge * 0.65);
          out.l = C[3];
          out.k = 0.16 * env * (1 - edge);
        });
        p.glowRing(0, 0, rCur * 0.78, 8, C[3], 0.24 * env);
      }

      // Orbiting pixel razor leaves tilted tangentially along rotation
      for (const lf of leaves) {
        const a = lf.a0 + t * lf.spd;
        const r = lf.r0 * (0.55 + 0.45 * ease.outCubic(u));
        const lx = Math.cos(a) * r;
        const ly = Math.sin(a) * r * lf.yScale;
        const tx = -Math.sin(a) * 2.6;
        const ty = Math.cos(a) * 2.1;
        p.line(lx - tx, ly - ty, lx + tx, ly + ty, lf.tone, env);
        p.dot(lx + tx * 0.7, ly + ty * 0.7, WHITE, env * 0.75);
      }

      if (t < 0.2) {
        sparkle(p, 0, 0, 8 * (1 - t / 0.2), WHITE, C[4], 0.6);
      }
      ps.draw(p);
      lights.draw(p);
    },
  };
}
