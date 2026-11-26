import { Particles, Lights, P, Rng, fit, clamp, smooth, ease, sparkle, flare, TAU, WHITE, PAL } from "../../core/index.js";

export const meta = {
  name: "B1 Mob Amber Crucible",
  desc: "Obsidian furnace ring erupts with molten amber slag waves, ballistic sparks, and a white-gold core.",
  tags: ["pixtel", "batch1", "mob", "fire", "lava", "quake", "one-shot"],
  size: [124, 124],
  origin: [62, 62],
  duration: 0.68,
  loop: false,
  fps: 26,
  bg: "dark",
  options: {
    palette: PAL.lava,
    gold: PAL.gold,
    mode: "overpressure",
    radius: 40,
    seed: 303,
  },
};

const D = meta.duration;

export function create(o) {
  const C = fit(o.palette ?? PAL.lava, 8);
  const G = fit(o.gold ?? PAL.gold, 8);
  const R = new Rng(o.seed ?? 303);
  const RAD = clamp(o.radius ?? 40, 22, 44);
  const mode = o.mode ?? "overpressure";
  const ps = new Particles({ rng: R, ground: () => 44, sparks: [WHITE, G[5], C[5], C[3]] });
  const lights = new Lights();

  if (mode === "overpressure") {
    lights.add(0, 0, RAD + 8, G[5], 0.85, 0.34);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU + R.range(-0.15, 0.15);
      const sp = R.range(48, 84);
      ps.spawn(
        P.SPARK,
        0,
        0,
        Math.cos(a) * sp,
        Math.sin(a) * sp - 20,
        R.range(0.22, 0.38),
        i % 3 === 0 ? WHITE : G[5],
        1,
        0.02
      );
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + R.range(-0.2, 0.2);
      const sp = R.range(18, 36);
      ps.spawn(
        P.SMOKE,
        Math.cos(a) * 6,
        Math.sin(a) * 6,
        Math.cos(a) * sp,
        Math.sin(a) * sp - 14,
        R.range(0.32, 0.5),
        0,
        1,
        0.04
      );
    }
  } else {
    lights.add(18, 0, RAD * 0.9, C[5], 0.78, 0.32);
    for (let i = 0; i < 14; i++) {
      const a = R.range(-0.75, 0.75);
      const sp = R.range(46, 84);
      ps.spawn(
        P.SPARK,
        4,
        0,
        Math.cos(a) * sp,
        Math.sin(a) * sp - 12,
        R.range(0.2, 0.36),
        i % 2 === 0 ? G[5] : C[5],
        1,
        0.02
      );
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
      const fade = 1 - smooth(0.34, D - 0.04, t);
      if (fade <= 0.02) return;

      if (mode === "overpressure") {
        const u = clamp(t / 0.34);
        if (t < 0.1) {
          sparkle(p, 0, 0, 12 * (1 - t / 0.1), WHITE, G[5], 0.8);
          flare(p, 0, 0, 10, 0.7 * (1 - t / 0.1), C);
        }
        const r = 6 + (RAD - 6) * ease.outCubic(u);
        p.glowRing(0, 0, r, 4.5, C[5], 0.36 * fade);
        p.ring(0, 0, r, 3.2 * (1 - 0.45 * u), (v) => (v > 0.72 ? WHITE : v > 0.32 ? C[5] : C[1]), fade);

        const f0 = Math.max(4, r - 6);
        const f1 = Math.min(RAD + 2, r + 4);
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * TAU + 0.18;
          p.line(Math.cos(a) * f0, Math.sin(a) * f0, Math.cos(a) * f1, Math.sin(a) * f1, k % 2 === 0 ? C[1] : G[5], fade * 0.85);
        }
      } else {
        const u = clamp(t / 0.32);
        const r = 8 + (RAD * 1.02 - 8) * ease.outCubic(u);
        if (t < 0.09) {
          sparkle(p, 4, 0, 9 * (1 - t / 0.09), WHITE, G[5], 0.75);
        }
        p.disc(20, 0, 14 * (0.4 + 0.6 * u), C[3], 0.22 * fade);
        p.arc(0, 0, r, 4.2 * (1 - 0.4 * u), -0.82, 0.82, (v) => (v > 0.6 ? G[6] : v > 0.25 ? C[5] : C[1]), fade);
        p.arc(0, 0, r * 0.62, 2.4 * (1 - 0.4 * u), -0.7, 0.7, WHITE, fade * 0.75);

        for (const sa of [-0.8, 0.8]) {
          const sx = Math.cos(sa) * 34;
          const sy = Math.sin(sa) * 34;
          const sr = 4 + 6 * ease.outCubic(u);
          p.glowRing(sx, sy, sr, 2.5, C[5], 0.28 * fade);
          p.ring(sx, sy, sr, 1.8, G[5], fade * 0.85);
        }
      }

      ps.draw(p);
      lights.draw(p);
    },
  };
}
