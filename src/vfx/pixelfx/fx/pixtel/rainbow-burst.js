import { Particles, Lights, P, Rng, fit, flare, sparkle, clamp, ease, smooth, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Rainbow burst",
  desc: "Blazing 360-degree prismatic starburst rays erupting from chest crystal for Prism Dragon.",
  tags: ["prism", "rainbow", "burst", "dragon", "star", "one-shot"],
  size: [168, 168],
  origin: [84, 84],
  duration: 0.90,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#ff3366", "#ff9922", "#ffee33", "#44ee88", "#33ddff", "#aa55ff", "#ffffff"],
    radius: 68,
    seed: 19,
  },
};

const D = meta.duration;

export function create(o) {
  const C = fit(o.palette, 7);
  const R = new Rng(o.seed);
  const RMAX = Math.min(78, o.radius);
  const ps = new Particles({ rng: R, sparks: [WHITE, C[4], C[2], C[0]] });
  const lights = new Lights();

  lights.add(0, 0, RMAX, WHITE, 0.85, 0.24);
  lights.add(0, 0, RMAX + 10, C[4], 0.65, 0.62);

  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * TAU + R.range(-0.12, 0.12);
    const sp = R.range(75, 165);
    ps.spawn(
      P.STAR,
      Math.cos(a) * 6,
      Math.sin(a) * 6,
      Math.cos(a) * sp,
      Math.sin(a) * sp,
      R.range(0.32, 0.72),
      i % 4 === 0 ? WHITE : C[i % 6],
      R.range(1.2, 2.3),
      R.range(0.04, 0.18)
    );
  }

  let t = 0;

  return {
    update(dt) {
      t += dt;
      ps.update(dt);
      lights.update(dt);
    },
    draw(p) {
      if (t >= D) return;
      const u = clamp(t / D);
      const reach = RMAX * ease.outCubic(clamp(t / 0.26));
      const fade = 1 - smooth(0.46, 0.96, u);
      const rays = 12;
      const rot = t * 0.45;

      if (fade > 0.02 && reach > 3) {
        p.shade(-reach - 1, -reach - 1, reach + 1, reach + 1, (x, y, out) => {
          const d = Math.hypot(x, y);
          if (d > reach) return;
          const rNorm = d / reach;
          let ang = Math.atan2(y, x) - rot;
          ang -= Math.floor(ang / TAU) * TAU;
          const sector = (ang / TAU) * rays;
          const idx = Math.floor(sector);
          const inSec = sector - idx; // 0..1
          const distCenter = Math.abs(inSec - 0.5) * 2; // 0 along spine, 1 between rays
          // Alternating long primary rays (even) & medium secondary rays (odd)
          const lenScale = (idx & 1) === 0 ? 1.0 : 0.68;
          if (rNorm > lenScale) return;
          const maxAngHalf = (1 - (rNorm / lenScale) * 0.78) * 0.62;
          if (distCenter > maxAngHalf) return;

          const q = distCenter / Math.max(0.01, maxAngHalf);
          if (rNorm < 0.22 || q < 0.28) {
            out.c = WHITE;
            out.a = fade;
          } else {
            const colIdx = (idx + Math.floor(rNorm * 3)) % 6;
            out.c = C[colIdx];
            out.a = fade * (1 - q * 0.55) * (1 - rNorm * 0.28);
          }
          out.l = out.c;
          out.k = 0.26 * fade * (1 - q * 0.5);
        });
      }

      if (t < 0.32) {
        flare(p, 0, 0, 14 * (1 - t / 0.32), 0.75, C);
      }
      if (t < 0.22) {
        sparkle(p, 0, 0, 11 * (1 - t / 0.22), WHITE, C[4], 0.85);
      }
      ps.draw(p);
      lights.draw(p);
    },
  };
}
