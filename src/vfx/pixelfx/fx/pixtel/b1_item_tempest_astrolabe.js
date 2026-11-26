import { Particles, Lights, P, Rng, fit, clamp, smooth, ease, sparkle, flare, bolt, TAU, WHITE, PAL } from "../../core/index.js";

export const meta = {
  name: "B1 Item Tempest Astrolabe",
  desc: "Rotating teal-gold astrolabe sigil pulls wind spirals inward, then detonates in a volt starburst.",
  tags: ["pixtel", "batch1", "wind", "volt", "one-shot"],
  size: [128, 128],
  origin: [64, 64],
  duration: 0.76,
  loop: false,
  fps: 24,
  bg: "dark",
  options: {
    palette: PAL.water,
    volt: PAL.volt,
    radius: 40,
    seed: 23,
  },
};

const D = meta.duration;
const DET_T = 0.44;

export function create(o) {
  const C = fit(o.palette ?? PAL.water, 8);
  const V = fit(o.volt ?? PAL.volt, 8);
  const R = new Rng(o.seed ?? 23);
  const RAD = clamp(o.radius ?? 40, 24, 44);
  const ps = new Particles({ rng: R, sparks: [WHITE, V[6], C[5], V[4]] });
  const lights = new Lights();

  lights.add(0, 0, RAD * 0.85, C[5], 0.45, DET_T);
  lights.add(0, 0, RAD + 8, V[5], 0.85, 0.28, DET_T);

  // Inward wind motes during gather phase
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU + R.range(-0.15, 0.15);
    const d0 = R.range(RAD * 0.75, RAD * 1.0);
    const sp = d0 / 0.36;
    ps.spawn(
      P.MOTE,
      Math.cos(a) * d0,
      Math.sin(a) * d0,
      -Math.cos(a) * sp,
      -Math.sin(a) * sp,
      R.range(0.24, 0.38),
      i % 2 === 0 ? C[6] : V[5],
      1,
      R.range(0, 0.08)
    );
  }
  // Outward electric sparks on detonation
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TAU + R.range(-0.12, 0.12);
    const sp = R.range(55, 105);
    ps.spawn(P.SPARK, 0, 0, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.16, 0.26), i % 3 === 0 ? WHITE : V[6], 1, DET_T);
  }

  const bolts = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * TAU + R.range(-0.18, 0.18);
    return bolt(new Rng(R.int(1, 9999)), 0, 0, Math.cos(a) * (RAD * 0.92), Math.sin(a) * (RAD * 0.92), {
      jag: 0.24,
      depth: 3,
    });
  });

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

      if (t < DET_T) {
        // Phase 1: Converging wind spiral + rotating gold astrolabe sigil
        const gu = clamp(t / DET_T);
        const sigR = RAD * (0.95 - 0.55 * ease.inQuad(gu));
        const rot = gu * TAU * 1.1;
        p.glowRing(0, 0, sigR, 3, C[5], 0.28);
        for (let i = 0; i < 28; i++) {
          const a = (i / 28) * TAU + rot;
          const col = i % 7 === 0 ? WHITE : i % 2 === 0 ? V[5] : C[5];
          p.dot(Math.cos(a) * sigR, Math.sin(a) * sigR, col, 0.88);
        }
        // 3 swirling wind arms pulling inward
        for (let k = 0; k < 3; k++) {
          const baseA = (k / 3) * TAU - rot * 1.4;
          for (let s = 0; s < 10; s++) {
            const su = s / 10;
            const r = sigR * (1.15 - su * 0.65);
            const a = baseA + su * 1.3;
            p.dot(Math.cos(a) * r, Math.sin(a) * r, su > 0.7 ? WHITE : C[6], 0.85 * (1 - su * 0.3));
          }
        }
      } else {
        // Phase 2: Volt starburst detonation + shock ring
        const bt = t - DET_T;
        const bd = D - DET_T;
        const bu = clamp(bt / 0.24);
        const fade = 1 - smooth(bd * 0.35, bd - 0.03, bt);
        if (fade <= 0.02) return;

        if (bt < 0.08) {
          sparkle(p, 0, 0, 12 * (1 - bt / 0.08), WHITE, V[5], 0.75);
          flare(p, 0, 0, 10, 0.8, V);
        }

        const r = 8 + (RAD - 4) * ease.outCubic(bu);
        p.glowRing(0, 0, r, 4.5, V[5], 0.4 * fade);
        p.ring(0, 0, r, 2.6 * (1 - 0.45 * bu), (v) => (v > 0.65 ? WHITE : V[6]), fade);

        if (bt < 0.22) {
          const bf = 1 - bt / 0.22;
          for (const pts of bolts) {
            p.polyline(pts, bt < 0.07 ? WHITE : V[5], bf);
          }
        }
      }

      ps.draw(p);
      lights.draw(p);
    },
  };
}
