import { Particles, Lights, P, Rng, fit, clamp, smooth, ease, sparkle, flare, bolt, TAU, WHITE, PAL } from "../../core/index.js";

export const meta = {
  name: "B1 Mob Chrono Arbiter",
  desc: "Counter-rotating void astrolabe clock dial with 12 ticks and magenta-violet temporal shear blades.",
  tags: ["pixtel", "batch1", "mob", "void", "arcane", "chrono", "one-shot"],
  size: [144, 144],
  origin: [72, 72],
  duration: 0.72,
  loop: false,
  fps: 28,
  bg: "dark",
  options: {
    palette: PAL.arcane,
    neon: PAL.neon,
    mode: "shear",
    radius: 46,
    seed: 404,
  },
};

const D = meta.duration;
const IMP_T = 0.36;

export function create(o) {
  const C = fit(o.palette ?? PAL.arcane, 8);
  const N = fit(o.neon ?? PAL.neon, 8);
  const R = new Rng(o.seed ?? 404);
  const RAD = clamp(o.radius ?? 46, 26, 52);
  const mode = o.mode ?? "shear";
  const ps = new Particles({ rng: R, sparks: [WHITE, N[6], C[5], N[4]] });
  const lights = new Lights();

  const railBolts = [-24, 24].map((ry) =>
    bolt(new Rng(R.int(1, 9999)), -42, ry, 42, ry, { jag: 0.14, depth: 3 })
  );

  if (mode === "shear") {
    lights.add(0, 0, RAD + 8, N[5], 0.78, 0.34);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU + R.range(-0.14, 0.14);
      const sp = R.range(44, 88);
      ps.spawn(
        i % 2 === 0 ? P.STAR : P.SPARK,
        0,
        0,
        Math.cos(a) * sp,
        Math.sin(a) * sp,
        R.range(0.22, 0.38),
        i % 3 === 0 ? WHITE : N[6],
        1,
        0.02
      );
    }
  } else if (mode === "guillotine") {
    lights.add(0, -24, 34, N[5], 0.72, 0.3);
    lights.add(0, 24, 34, N[5], 0.72, 0.3);
    for (let i = 0; i < 12; i++) {
      const ry = i % 2 === 0 ? -24 : 24;
      const sx = R.range(-34, 34);
      const sp = R.range(36, 72);
      const a = R.range(-0.5, 0.5);
      ps.spawn(P.SPARK, sx, ry, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.18, 0.34), i % 3 === 0 ? WHITE : N[5], 1, 0.02);
    }
  } else {
    lights.add(0, 0, RAD * 0.8, C[5], 0.48, IMP_T);
    lights.add(0, 0, RAD + 8, WHITE, 0.85, 0.26, IMP_T);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      const d0 = R.range(RAD * 0.75, RAD);
      const sp = d0 / 0.3;
      ps.spawn(P.MOTE, Math.cos(a) * d0, Math.sin(a) * d0, -Math.cos(a) * sp, -Math.sin(a) * sp, 0.28, N[5], 1, 0.02);
    }
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU + R.range(-0.12, 0.12);
      const sp = R.range(48, 90);
      ps.spawn(P.STAR, 0, 0, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.18, 0.3), i % 2 === 0 ? WHITE : N[6], 1, IMP_T);
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

      if (mode === "shear") {
        const u = clamp(t / 0.38);
        const fade = 1 - smooth(0.36, D - 0.04, t);
        if (fade > 0.02) {
          if (t < 0.12) {
            sparkle(p, 0, 0, 13 * (1 - t / 0.12), WHITE, N[5], 0.8);
          }
          const rOuter = RAD * (0.45 + 0.55 * ease.outCubic(u));
          const rInner = rOuter * 0.66;
          const rot = u * TAU * 0.55;
          p.glowRing(0, 0, rOuter, 4, N[5], 0.34 * fade);
          p.ring(0, 0, rOuter, 2.2, C[5], fade);
          p.ring(0, 0, rInner, 1.8, N[5], fade * 0.85);
          for (let k = 0; k < 12; k++) {
            const a = (k / 12) * TAU + rot;
            const col = k % 3 === 0 ? WHITE : N[6];
            p.line(Math.cos(a) * rInner, Math.sin(a) * rInner, Math.cos(a) * rOuter, Math.sin(a) * rOuter, col, fade);
          }
          p.arc(0, 0, rOuter + 2, (v) => 4.2 * Math.sin(v * Math.PI), rot, rot + 1.15, (v) => (v > 0.65 ? WHITE : N[6]), fade);
          p.arc(0, 0, rOuter + 2, (v) => 4.2 * Math.sin(v * Math.PI), rot + Math.PI, rot + Math.PI + 1.15, (v) => (v > 0.65 ? WHITE : N[6]), fade);
        }
      } else if (mode === "guillotine") {
        const u = clamp(t / 0.28);
        const fade = 1 - smooth(0.32, D - 0.04, t);
        if (fade > 0.02) {
          for (let i = 0; i < 2; i++) {
            const sy = i === 0 ? -24 : 24;
            p.glowLine(-42, sy, 42, sy, 5, N[5], 0.36 * fade);
            p.beam(-42, sy, 42, sy, 2.8 * (1 - 0.45 * u), (px, py) => (Math.abs(py - sy) < 0.8 ? WHITE : N[6]), fade);
            if (t < 0.36) p.polyline(railBolts[i], C[6], fade * 0.9);
            for (const gx of [-24, 0, 24]) {
              p.line(gx, sy - 6, gx, sy + 6, WHITE, fade * 0.8);
            }
          }
        }
      } else {
        if (t < IMP_T) {
          const gu = clamp(t / IMP_T);
          for (let k = 0; k < 4; k++) {
            const r = clamp(RAD * (1 - gu * 0.82 - k * 0.14), 3, RAD);
            p.ring(0, 0, r, 1.8, k % 2 === 0 ? N[5] : C[5], 0.78 * (1 - k * 0.14));
          }
          const nd = RAD * (1 - gu * 0.9);
          for (let k = 0; k < 4; k++) {
            const a = (k / 4) * TAU;
            p.line(Math.cos(a) * nd, Math.sin(a) * nd, Math.cos(a) * (nd + 7), Math.sin(a) * (nd + 7), WHITE, 0.92);
          }
        } else {
          const bt = t - IMP_T;
          const bd = D - IMP_T;
          const fade = 1 - smooth(bd * 0.35, bd - 0.03, bt);
          if (fade > 0.02) {
            if (bt < 0.11) {
              sparkle(p, 0, 0, 14 * (1 - bt / 0.11), WHITE, N[5], 0.82);
              flare(p, 0, 0, 12, 0.78 * (1 - bt / 0.11), N);
            }
            p.glow(0, 0, 26, WHITE, 0.62 * fade);
            const r = 6 + (RAD * 0.9 - 6) * ease.outCubic(clamp(bt / 0.22));
            p.glowRing(0, 0, r, 4, N[5], 0.35 * fade);
            p.ring(0, 0, r, 2.4, WHITE, fade);
          }
        }
      }

      ps.draw(p);
      lights.draw(p);
    },
  };
}
