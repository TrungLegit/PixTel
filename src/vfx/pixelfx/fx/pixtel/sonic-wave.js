import { Particles, Lights, P, Rng, fit, sparkle, clamp, ease, smooth, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Sonic wave",
  desc: "Expanding concentric crystal sonic rings + diamond glints blasting forward in a cone.",
  tags: ["ice", "crystal", "sonic", "wave", "directional", "one-shot"],
  size: [144, 88],
  origin: [16, 44],
  duration: 0.62,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#0c1430", "#1f4f94", "#2f7fcc", "#58b4ec", "#9bdcff", "#d8f4ff", "#ffffff"],
    range: 106,
    seed: 7,
  },
};

const D = meta.duration;

export function create(o) {
  const C = fit(o.palette, 7);
  const R = new Rng(o.seed);
  const RNG = Math.min(118, o.range);
  const ps = new Particles({ rng: R, sparks: [WHITE, C[5], C[4], C[3]] });
  const lights = new Lights();

  lights.add(10, 0, 32, C[4], 0.7, 0.22);
  for (let i = 0; i < 12; i++) {
    const a = R.range(-0.42, 0.42);
    const sp = R.range(70, 165);
    ps.spawn(
      P.STAR,
      6,
      R.range(-4, 4),
      Math.cos(a) * sp,
      Math.sin(a) * sp,
      R.range(0.28, 0.56),
      i % 3 === 0 ? WHITE : C[5],
      R.range(1.1, 2.1),
      R.range(0, 0.14)
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
      // 4 staggered vertical-oval cyan sonic rings rushing along +X
      for (let i = 0; i < 4; i++) {
        const delay = i * 0.08;
        const u = (t - delay) / (D - 0.18);
        if (u <= 0 || u >= 1) continue;
        const k = ease.outCubic(u);
        const cx = 6 + (RNG - 6) * k;
        const rx = 2.4 + 6.8 * k;
        const ry = 5.5 + 18.5 * k;
        const fade = (1 - smooth(0.58, 1.0, u)) * (i === 3 ? 1 : 0.92);
        const thick = 0.22 - 0.08 * u;

        p.shade(cx - rx - 1, -ry - 1, cx + rx + 1, ry + 1, (x, y, out) => {
          const d = Math.hypot((x - cx) / rx, y / ry);
          if (d < 1 - thick || d > 1 + 0.12) return;
          const v = Math.abs(d - (1 - thick * 0.45)) / (thick * 0.65);
          out.c = v < 0.35 && u < 0.65 ? WHITE : d > 0.96 ? C[5] : C[4];
          out.a = fade * (1 - v * 0.45);
          out.l = C[4];
          out.k = 0.22 * fade * (1 - v * 0.5);
        });

        p.glow(cx, 0, Math.max(8, ry * 0.85), C[3], 0.28 * fade);
      }

      if (t < 0.16) {
        sparkle(p, 8, 0, 7 * (1 - t / 0.16), WHITE, C[4], 0.65);
      }
      ps.draw(p);
      lights.draw(p);
    },
  };
}
