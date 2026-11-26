import { Particles, Lights, P, Rng, fit, clamp, smooth, ease, sparkle, flare, bolt, ngon, TAU, WHITE, PAL } from "../../core/index.js";

export const meta = {
  name: "B1 Mob Prism Arachnid",
  desc: "Hexagonal cyan prism web snaps taut while golden volt lightning bolts crackle across the spokes.",
  tags: ["pixtel", "batch1", "mob", "volt", "prism", "one-shot"],
  size: [116, 116],
  origin: [58, 58],
  duration: 0.62,
  loop: false,
  fps: 26,
  bg: "dark",
  options: {
    palette: PAL.cyber,
    volt: PAL.volt,
    mode: "web",
    radius: 32,
    seed: 202,
  },
};

const D = meta.duration;

export function create(o) {
  const C = fit(o.palette ?? PAL.cyber, 8);
  const V = fit(o.volt ?? PAL.volt, 8);
  const R = new Rng(o.seed ?? 202);
  const RAD = clamp(o.radius ?? 32, 18, 38);
  const mode = o.mode ?? "web";
  const ps = new Particles({ rng: R, sparks: [WHITE, V[6], C[5], V[4]] });
  const lights = new Lights();

  const spokePts = Array.from({ length: 6 }, (_, k) => {
    const a = (k / 6) * TAU + Math.PI / 6;
    return [Math.cos(a) * RAD * 0.94, Math.sin(a) * RAD * 0.94];
  });

  const webBolts = Array.from({ length: 4 }, (_, k) => {
    const p0 = spokePts[k % 6];
    const p1 = spokePts[(k + 2) % 6];
    return bolt(new Rng(R.int(1, 9999)), p0[0] * 0.55, p0[1] * 0.55, p1[0] * 0.88, p1[1] * 0.88, {
      jag: 0.22,
      depth: 3,
    });
  });

  const pulseBolts = Array.from({ length: 6 }, (_, k) => {
    const a = (k / 6) * TAU + R.range(-0.14, 0.14);
    return bolt(new Rng(R.int(1, 9999)), 0, 0, Math.cos(a) * RAD * 0.95, Math.sin(a) * RAD * 0.95, {
      jag: 0.25,
      depth: 3,
    });
  });

  if (mode === "web") {
    lights.add(0, 0, RAD + 6, C[5], 0.72, 0.3);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU + R.range(-0.15, 0.15);
      const sp = R.range(36, 68);
      ps.spawn(P.SPARK, 0, 0, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.16, 0.28), i % 2 === 0 ? V[5] : C[6], 1, 0.04);
    }
  } else if (mode === "pulse") {
    lights.add(0, 0, RAD + 8, V[5], 0.82, 0.28);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU + R.range(-0.12, 0.12);
      const sp = R.range(44, 78);
      ps.spawn(P.SPARK, 0, 0, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.16, 0.32), i % 3 === 0 ? WHITE : V[6], 1, 0.02);
    }
  } else {
    lights.add(12, 0, 24, C[5], 0.68, 0.24);
    for (let i = 0; i < 8; i++) {
      const a = (i % 2 === 0 ? -0.38 : 0.38) + R.range(-0.08, 0.08);
      const sp = R.range(42, 76);
      ps.spawn(P.SPARK, 4, 0, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.16, 0.28), i % 2 === 0 ? V[5] : C[6], 1, 0.02);
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
      const fade = 1 - smooth(0.28, D - 0.04, t);
      if (fade <= 0.02) return;

      if (mode === "web") {
        const grow = ease.outCubic(clamp(t / 0.16));
        if (t < 0.1) {
          sparkle(p, 0, 0, 10 * (1 - t / 0.1), WHITE, V[5], 0.72);
        }
        for (const [sx, sy] of spokePts) {
          p.glowLine(0, 0, sx * grow, sy * grow, 3, C[5], 0.24 * fade);
          p.line(0, 0, sx * grow, sy * grow, (s) => (s > 0.75 ? WHITE : C[5]), fade);
        }
        for (const frac of [0.5, 0.92]) {
          const hexPts = ngon(0, 0, RAD * frac * grow, 6, Math.PI / 6);
          hexPts.push(hexPts[0]);
          p.polyline(hexPts, frac > 0.7 ? C[6] : C[5], fade * 0.9);
        }
        if (t < 0.34) {
          const bf = (1 - smooth(0.14, 0.34, t)) * fade;
          for (const pts of webBolts) {
            p.polyline(pts, t < 0.09 ? WHITE : V[5], bf);
          }
        }
      } else if (mode === "pulse") {
        const u = clamp(t / 0.28);
        if (t < 0.09) {
          flare(p, 0, 0, 10, 0.75 * (1 - t / 0.09), V);
        }
        const hr = 6 + (RAD * 1.05 - 6) * ease.outCubic(u);
        const hexPts = ngon(0, 0, hr, 6, Math.PI / 6);
        hexPts.push(hexPts[0]);
        p.glowRing(0, 0, hr, 4, V[5], 0.34 * fade);
        p.polyline(hexPts, (s) => (s > 0.5 ? WHITE : C[6]), fade);
        if (t < 0.28) {
          const bf = 1 - t / 0.28;
          for (const pts of pulseBolts) {
            p.polyline(pts, t < 0.08 ? WHITE : V[5], bf);
          }
        }
      } else {
        const u = clamp(t / 0.24);
        if (t < 0.09) {
          sparkle(p, 2, 0, 9 * (1 - t / 0.09), WHITE, C[5], 0.7);
        }
        for (const ang of [-0.38, 0.38]) {
          const ex = Math.cos(ang) * (10 + 18 * u);
          const ey = Math.sin(ang) * (10 + 18 * u);
          p.glowLine(2, 0, ex, ey, 3.5, C[5], 0.3 * fade);
          p.line(2, 0, ex, ey, (s) => (s > 0.7 ? WHITE : V[5]), fade);
          const mx = Math.cos(ang) * (12 + 8 * u);
          const my = Math.sin(ang) * (12 + 8 * u);
          const spin = u * 2.4;
          for (let k = 0; k < 2; k++) {
            const sa = spin + k * (Math.PI / 2);
            p.line(mx - Math.cos(sa) * 4, my - Math.sin(sa) * 4, mx + Math.cos(sa) * 4, my + Math.sin(sa) * 4, C[6], fade);
          }
        }
      }

      ps.draw(p);
      lights.draw(p);
    },
  };
}
