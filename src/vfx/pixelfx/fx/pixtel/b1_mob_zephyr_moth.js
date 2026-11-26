import { Particles, Lights, P, Rng, fit, clamp, smooth, ease, sparkle, flare, TAU, WHITE, PAL } from "../../core/index.js";

export const meta = {
  name: "B1 Mob Zephyr Moth",
  desc: "Jade-cyan gale moth vortex pulls emerald wind ribbons inward and bursts with bioluminescent spores.",
  tags: ["pixtel", "batch1", "mob", "wind", "nature", "one-shot"],
  size: [120, 120],
  origin: [60, 60],
  duration: 0.65,
  loop: false,
  fps: 26,
  bg: "dark",
  options: {
    palette: PAL.heal,
    accent: PAL.cyber,
    mode: "vortex",
    reach: 36,
    seed: 101,
  },
};

const D = meta.duration;
const DET_T = 0.36;

export function create(o) {
  const C = fit(o.palette ?? PAL.heal, 8);
  const A = fit(o.accent ?? PAL.cyber, 8);
  const R = new Rng(o.seed ?? 101);
  const REACH = clamp(o.reach ?? 36, 20, 44);
  const mode = o.mode ?? "vortex";
  const ps = new Particles({ rng: R, sparks: [WHITE, A[5], C[6], C[4]] });
  const lights = new Lights();

  if (mode === "vortex") {
    lights.add(0, 0, REACH * 0.9, C[5], 0.42, DET_T);
    lights.add(0, 0, REACH + 8, A[5], 0.78, 0.25, DET_T);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU + R.range(-0.14, 0.14);
      const d0 = R.range(REACH * 0.72, REACH * 0.96);
      const sp = d0 / 0.32;
      ps.spawn(
        P.MOTE,
        Math.cos(a) * d0,
        Math.sin(a) * d0,
        -Math.cos(a) * sp,
        -Math.sin(a) * sp,
        R.range(0.22, 0.34),
        i % 2 === 0 ? C[6] : A[5],
        1,
        R.range(0, 0.06)
      );
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + R.range(-0.15, 0.15);
      const sp = R.range(38, 72);
      ps.spawn(
        i % 3 === 0 ? P.STAR : P.MOTE,
        0,
        0,
        Math.cos(a) * sp,
        Math.sin(a) * sp,
        R.range(0.16, 0.24),
        i % 2 === 0 ? A[5] : C[6],
        1,
        DET_T
      );
    }
  } else if (mode === "crescent") {
    lights.add(14, 0, 26, A[5], 0.65, 0.28);
    for (let i = 0; i < 12; i++) {
      const a = R.range(-0.45, 0.45);
      const sp = R.range(42, 78);
      ps.spawn(
        P.MOTE,
        4,
        R.range(-8, 8),
        Math.cos(a) * sp,
        Math.sin(a) * sp,
        R.range(0.2, 0.36),
        i % 2 === 0 ? C[6] : A[5],
        1,
        R.range(0, 0.06)
      );
    }
  } else {
    lights.add(12, 0, 22, C[5], 0.58, 0.26);
    for (let i = 0; i < 10; i++) {
      const lane = (i % 3) - 1;
      const a = lane * 0.16 + R.range(-0.04, 0.04);
      const sp = R.range(46, 86);
      ps.spawn(
        i % 2 === 0 ? P.STAR : P.MOTE,
        4,
        lane * 3,
        Math.cos(a) * sp,
        Math.sin(a) * sp,
        R.range(0.18, 0.32),
        i % 3 === 0 ? WHITE : C[6],
        1,
        R.range(0, 0.05)
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

      if (mode === "vortex") {
        if (t < DET_T) {
          const u = clamp(t / DET_T);
          const rot = u * TAU * 1.25;
          p.disc(0, 0, 10 * u + 2, C[2], 0.24 * u);
          for (let arm = 0; arm < 3; arm++) {
            const baseA = (arm / 3) * TAU - rot;
            for (let s = 0; s < 11; s++) {
              const su = s / 11;
              const r = clamp(REACH * (0.95 - su * 0.78) * (1 - u * 0.42), 3, 42);
              const a = baseA + su * 1.65;
              const px = Math.cos(a) * r;
              const py = Math.sin(a) * r;
              const col = su > 0.75 ? A[5] : su > 0.35 ? C[6] : C[4];
              p.dot(px, py, col, 0.9 * (1 - su * 0.22));
              if (s % 4 === 2) p.glow(px, py, 3, col, 0.22);
            }
          }
          p.glowRing(0, 0, REACH * (0.85 - 0.55 * ease.inQuad(u)), 3, C[5], 0.26);
        } else {
          const bt = t - DET_T;
          const bd = D - DET_T;
          const bu = clamp(bt / 0.22);
          const fade = 1 - smooth(bd * 0.38, bd - 0.03, bt);
          if (fade > 0.02) {
            if (bt < 0.12) {
              sparkle(p, 0, 0, 11 * (1 - bt / 0.12), WHITE, A[5], 0.7);
              flare(p, 0, 0, 9, 0.68 * (1 - bt / 0.12), C);
            }
            const r = 6 + (REACH * 0.88 - 6) * ease.outCubic(bu);
            p.glowRing(0, 0, r, 4, A[5], 0.36 * fade);
            p.ring(0, 0, r, 2.5 * (1 - 0.45 * bu), (v) => (v > 0.65 ? WHITE : C[6]), fade);
          }
        }
      } else if (mode === "crescent") {
        const fade = 1 - smooth(0.28, D - 0.04, t);
        if (fade > 0.02) {
          const u = clamp(t / 0.26);
          const r1 = 18 + 16 * ease.outCubic(u);
          const r2 = 12 + 12 * ease.outCubic(u);
          p.glowLine(2, -10, 26, -4, 4, A[5], 0.26 * fade);
          p.glowLine(2, 10, 26, 4, 4, A[5], 0.26 * fade);
          p.arc(6, 0, r1, (v) => 3.4 * Math.sin(v * Math.PI), -0.82, -0.08, (v) => (v > 0.5 ? WHITE : C[6]), fade);
          p.arc(6, 0, r1, (v) => 3.4 * Math.sin(v * Math.PI), 0.08, 0.82, (v) => (v > 0.5 ? WHITE : C[6]), fade);
          p.arc(4, 0, r2, (v) => 2.2 * Math.sin(v * Math.PI), -0.62, 0.62, A[5], fade * 0.75);
        }
      } else {
        const fade = 1 - smooth(0.26, D - 0.04, t);
        if (fade > 0.02) {
          const u = clamp(t / 0.22);
          const len = 10 + (REACH - 8) * ease.outCubic(u);
          const tail = 14 * smooth(0.14, 0.48, t);
          p.disc(14, 0, 9 * (0.6 + 0.4 * u), C[3], 0.22 * fade);
          p.disc(22, 0, 7 * (0.5 + 0.5 * u), A[4], 0.18 * fade);
          for (const a of [-0.16, 0, 0.16]) {
            const ca = Math.cos(a);
            const sa = Math.sin(a);
            p.glowLine(ca * tail, sa * tail, ca * len, sa * len, 3, C[5], 0.3 * fade);
            p.line(ca * tail, sa * tail, ca * len, sa * len, (s) => (s > 0.65 ? WHITE : A[5]), fade);
          }
        }
      }

      ps.draw(p);
      lights.draw(p);
    },
  };
}
