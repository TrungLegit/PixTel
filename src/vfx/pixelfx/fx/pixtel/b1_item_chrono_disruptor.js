import { Particles, Lights, P, Rng, fit, clamp, smooth, ease, sparkle, TAU, WHITE, PAL } from "../../core/index.js";

export const meta = {
  name: "B1 Item Chrono Disruptor",
  desc: "Pulsing cyan-amber quantum mine hovers with rotating lock brackets, then erupts in an icy-quake ring.",
  tags: ["pixtel", "batch1", "quantum", "ice", "quake", "one-shot"],
  size: [112, 112],
  origin: [56, 56],
  duration: 1.5,
  loop: false,
  fps: 20,
  bg: "dark",
  options: {
    palette: PAL.cyber,
    amber: PAL.volt,
    radius: 34,
    seed: 31,
  },
};

const D = meta.duration;
const DET_T = 1.25;

export function create(o) {
  const C = fit(o.palette ?? PAL.cyber, 8);
  const A = fit(o.amber ?? PAL.volt, 8);
  const R = new Rng(o.seed ?? 31);
  const RAD = clamp(o.radius ?? 34, 20, 38);
  const ps = new Particles({ rng: R, sparks: [WHITE, C[6], A[5], C[3]] });
  const lights = new Lights();

  lights.add(0, 0, 16, C[5], 0.35, DET_T);
  lights.add(0, 0, RAD + 6, A[5], 0.8, 0.26, DET_T);

  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU + R.range(-0.1, 0.1);
    const sp = R.range(50, 95);
    ps.spawn(P.SPARK, 0, 0, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.16, 0.24), i % 2 === 0 ? C[6] : A[5], 1, DET_T);
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

      if (t < DET_T) {
        // Active pulsing quantum mine
        const armU = clamp(t / 0.25);
        const bob = Math.sin(t * 6) * 1.4;
        const pulseSpeed = 4 + (t / DET_T) * 14;
        const pulse = 0.5 + 0.5 * Math.sin(t * pulseSpeed);
        const br = 12 + (1 - armU) * 8;

        // Rotating 4-corner chrono lock brackets
        const rot = t * 2.2;
        for (let k = 0; k < 4; k++) {
          const a = rot + (k / 4) * TAU;
          const bx = Math.cos(a) * br;
          const by = Math.sin(a) * br + bob;
          p.dot(bx, by, pulse > 0.65 ? A[5] : C[5], 0.88);
          p.dot(Math.cos(a + 0.14) * br, Math.sin(a + 0.14) * br + bob, C[4], 0.72);
        }

        // Octagonal mine body
        p.circle(0, bob, 5, C[1], 0.95);
        p.ring(0, bob, 5.5, 1.4, (v) => (v > 0.5 ? C[5] : C[3]), 0.9);
        const coreCol = pulse > 0.72 ? WHITE : pulse > 0.35 ? A[5] : C[6];
        p.circle(0, bob, 2.4, coreCol, 0.95);
        p.glow(0, bob, 9 + pulse * 4, pulse > 0.5 ? A[5] : C[5], 0.28 + pulse * 0.2);

        // Subtle warning perimeter dotted ring
        if (t > 0.25) {
          const perim = RAD * 0.78;
          for (let i = 0; i < 16; i++) {
            const a = (i / 16) * TAU - t * 0.8;
            p.dot(Math.cos(a) * perim, Math.sin(a) * perim, i % 2 === 0 ? C[4] : A[4], 0.38 + 0.25 * pulse);
          }
        }
      } else {
        // Detonation shockwave burst
        const bt = t - DET_T;
        const bd = D - DET_T;
        const bu = clamp(bt / 0.2);
        const fade = 1 - smooth(bd * 0.35, bd - 0.03, bt);
        if (fade <= 0.02) return;

        if (bt < 0.08) {
          sparkle(p, 0, 0, 12 * (1 - bt / 0.08), WHITE, A[5], 0.75);
        }
        const r = 6 + (RAD - 4) * ease.outCubic(bu);
        p.glowRing(0, 0, r, 4.5, C[5], 0.38 * fade);
        // Octagonal shock ring
        for (let i = 0; i < 8; i++) {
          const a0 = (i / 8) * TAU;
          const a1 = ((i + 1) / 8) * TAU;
          const col = i % 2 === 0 ? C[6] : A[5];
          p.line(Math.cos(a0) * r, Math.sin(a0) * r, Math.cos(a1) * r, Math.sin(a1) * r, bt < 0.08 ? WHITE : col, fade);
        }
      }

      ps.draw(p);
      lights.draw(p);
    },
  };
}
