import { Particles, Lights, P, Rng, fit, band, sparkle, clamp, ease, smooth, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Prism storm",
  desc: "A fast-spinning rainbow blade vortex with four prismatic crescents and an expanding light shockwave.",
  tags: ["prism", "storm", "spin", "rainbow", "aoe", "one-shot"],
  size: [152, 152],
  origin: [76, 76],
  duration: 1.05,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#ff3366", "#ffaa22", "#ffee33", "#33ee88", "#33ddff", "#bb55ff", "#ffffff"],
    radius: 46,
    seed: 3,
  },
};

const SPIN_T = 0.68, D = meta.duration;

export function create(o) {
  const C = fit(o.palette, 7), R = new Rng(o.seed), RMAX = o.radius;
  const ps = new Particles({ rng: R, sparks: [WHITE, C[4], C[2], C[0]] });
  const lights = new Lights();
  let t = 0, bursted = false;

  lights.add(0, 0, 48, C[4], 0.7, 0.6);

  return {
    update(dt) {
      t += dt;
      if (t < SPIN_T && R.chance(0.75)) {
        const a = t * 18 + R.range(0, TAU), r = RMAX * R.range(0.55, 0.95);
        ps.spawn(P.MOTE, Math.cos(a) * r, Math.sin(a) * r * 0.85, -Math.sin(a) * 80, Math.cos(a) * 68, R.range(0.18, 0.35), C[R.int(0, 5)], 0.75);
      }
      if (!bursted && t >= SPIN_T * 0.85) {
        bursted = true;
        lights.add(0, 0, 64, WHITE, 0.8, 0.14);
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * TAU + R.range(-0.15, 0.15), sp = R.range(90, 185);
          ps.spawn(P.SPARK, Math.cos(a) * 14, Math.sin(a) * 12, Math.cos(a) * sp, Math.sin(a) * sp * 0.85, R.range(0.18, 0.4), WHITE, 1);
        }
      }
      ps.update(dt);
      lights.update(dt);
    },
    draw(p) {
      if (t >= D) return;
      const spinFade = 1 - smooth(SPIN_T - 0.1, SPIN_T + 0.12, t);
      if (spinFade > 0) {
        const rot = t * 14;
        const r = RMAX * (0.55 + 0.35 * ease.outCubic(clamp(t / 0.25)));
        const maxW = 8 * spinFade;
        const rIn = r - maxW - 1;
        const stepShift = Math.floor(t * 10);
        // Single shade pass for all 4 spinning rainbow crescents
        p.shade(-r - 1, -r - 1, r + 1, r + 1, (x, y, out) => {
          const d = Math.hypot(x, y);
          if (d > r || d < rIn) return;
          let ang = Math.atan2(y, x) - rot;
          ang -= Math.floor(ang / TAU) * TAU;
          const qIdx = Math.floor(ang / (TAU / 4));
          const localA = ang - qIdx * (TAU / 4);
          if (localA > 1.25) return;
          const u = localA / 1.25;
          const w = maxW * Math.sin(u * Math.PI);
          if (w < 0.4 || d < r - w) return;
          const v = (d - (r - w)) / w;
          out.c = v > 0.72 ? WHITE : C[(qIdx + stepShift) % 6];
          out.a = spinFade * Math.min(1, u * 2.2);
        });
        p.glowRing(0, 0, r - 3, 6, C[4], 0.3 * spinFade);
      }
      const w = (t - 0.2) / (D - 0.22);
      if (w > 0 && w < 1) {
        const wr = 10 + (RMAX + 12) * ease.outCubic(w);
        band(p, 0, 0, wr, 0.85, Math.max(1.5, 4 * (1 - w)), (1 - w) * 1.1, C, () => true, w < 0.2);
      }
      if (t < 0.18) sparkle(p, 0, 0, 9 * (1 - t / 0.18), WHITE, C[4], 0.6);
      ps.draw(p);
      lights.draw(p);
    },
  };
}
