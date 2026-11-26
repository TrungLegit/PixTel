import { Particles, Lights, P, Rng, fit, clamp, smooth, ease, sparkle, TAU, WHITE, PAL } from "../../core/index.js";

export const meta = {
  name: "B1 Item Refract Lance",
  desc: "Piercing ice-cyan lance thrust hits a diamond prism core and splits into three diverging prism rays.",
  tags: ["pixtel", "batch1", "prism", "ice", "one-shot"],
  size: [128, 96],
  origin: [28, 48],
  duration: 0.62,
  loop: false,
  fps: 24,
  bg: "dark",
  options: {
    palette: PAL.ice,
    prism: PAL.candy,
    reach: 54,
    seed: 17,
  },
};

const D = meta.duration;

export function create(o) {
  const C = fit(o.palette ?? PAL.ice, 8);
  const M = fit(o.prism ?? PAL.candy, 8);
  const R = new Rng(o.seed ?? 17);
  const REACH = clamp(o.reach ?? 54, 28, 58);
  const ps = new Particles({ rng: R, sparks: [WHITE, C[6], M[5], C[3]] });
  const lights = new Lights();

  lights.add(0, 0, 24, WHITE, 0.75, 0.22);
  const rayAngles = [-0.52, 0, 0.52];
  for (let rIdx = 0; rIdx < 3; rIdx++) {
    const baseA = rayAngles[rIdx];
    const col = rIdx === 0 ? M[5] : rIdx === 1 ? WHITE : C[6];
    for (let i = 0; i < 6; i++) {
      const a = baseA + R.range(-0.08, 0.08);
      const sp = R.range(55, 105);
      ps.spawn(P.SPARK, 2, 0, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.18, 0.34), col, 1, 0.04);
    }
  }

  let t = 0;
  return {
    update(dt) {
      t += dt;
      ps.update(dt);
      lights.update(dt);
    },
    done() {
      return t >= D;
    },
    draw(p) {
      if (t >= D - 1e-4) return;
      const u = clamp(t / 0.34);
      const fade = 1 - smooth(0.32, D - 0.04, t);
      if (fade <= 0.02) return;

      // Incoming lance thrust shaft from (-22, 0) to prism focal point (0, 0)
      if (t < 0.28) {
        const thrustFade = 1 - smooth(0.12, 0.28, t);
        const x0 = -20 + 6 * ease.outCubic(clamp(t / 0.14));
        p.glowLine(x0, 0, 4, 0, 5, C[5], 0.42 * thrustFade);
        p.beam(x0, 0, 2, 0, 3.2, (px, py) => (Math.abs(py) < 0.9 ? WHITE : C[6]), thrustFade);
      }

      // Hero flash & diamond prism focal crystal at (0, 0)
      if (t < 0.08) {
        sparkle(p, 0, 0, 11 * (1 - t / 0.08), WHITE, C[5], 0.72);
      }
      if (t < 0.46) {
        const pFade = 1 - smooth(0.22, 0.46, t);
        const pr = 5 + 3 * Math.sin(clamp(t / 0.2) * Math.PI);
        p.poly(
          [
            [pr, 0],
            [0, -pr * 0.75],
            [-pr * 0.7, 0],
            [0, pr * 0.75],
          ],
          (px, py) => (Math.abs(px) + Math.abs(py) < pr * 0.45 ? WHITE : M[5]),
          pFade * 0.9
        );
      }

      // 3 diverging prism refraction beams fanning forward
      const beamLen = 6 + (REACH - 6) * ease.outCubic(u);
      const tailLen = Math.max(0, (REACH - 10) * smooth(0.16, 0.52, t));
      if (beamLen > tailLen + 2) {
        for (let i = 0; i < 3; i++) {
          const a = rayAngles[i];
          const ca = Math.cos(a);
          const sa = Math.sin(a);
          const x1 = ca * tailLen;
          const y1 = sa * tailLen;
          const x2 = ca * beamLen;
          const y2 = sa * beamLen;
          const beamCol = i === 0 ? M[5] : i === 1 ? C[6] : C[5];
          p.glowLine(x1, y1, x2, y2, 4, beamCol, 0.3 * fade);
          p.line(x1, y1, x2, y2, (s) => (s > 0.65 ? WHITE : beamCol), fade);
          p.dot(x2, y2, WHITE, fade);
        }
      }

      ps.draw(p);
      lights.draw(p);
    },
  };
}
