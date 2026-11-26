import { Particles, Lights, P, Rng, fit, clamp, smooth, ease, sparkle, TAU, WHITE, PAL } from "../../core/index.js";

export const meta = {
  name: "B1 Item Crimson Ward",
  desc: "Cursed crimson-violet blood shockwave erupts with jagged ruby spikes and void sparks.",
  tags: ["pixtel", "batch1", "cursed", "blood", "void", "one-shot"],
  size: [128, 128],
  origin: [64, 64],
  duration: 0.72,
  loop: false,
  fps: 24,
  bg: "dark",
  options: {
    palette: PAL.blood,
    voidPal: PAL.shadow,
    radius: 44,
    seed: 53,
  },
};

const D = meta.duration;

export function create(o) {
  const C = fit(o.palette ?? PAL.blood, 8);
  const V = fit(o.voidPal ?? PAL.shadow, 8);
  const R = new Rng(o.seed ?? 53);
  const RAD = clamp(o.radius ?? 44, 24, 46);
  const ps = new Particles({ rng: R, sparks: [WHITE, C[6], C[5], V[4]] });
  const lights = new Lights();

  lights.add(0, 0, RAD + 8, C[5], 0.85, 0.32);
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * TAU + R.range(-0.14, 0.14);
    const sp = R.range(48, 96);
    ps.spawn(
      i % 3 === 0 ? P.EMBER : P.SPARK,
      0,
      0,
      Math.cos(a) * sp,
      Math.sin(a) * sp,
      R.range(0.24, 0.44),
      i % 4 === 0 ? V[5] : C[6],
      1
    );
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
      const u = clamp(t / 0.38);
      const fade = 1 - smooth(0.32, D - 0.04, t);
      if (fade <= 0.02) return;

      // 2-frame hero flash
      if (t < 0.08) {
        sparkle(p, 0, 0, 12 * (1 - t / 0.08), WHITE, C[6], 0.75);
      }

      // Inner dark cursed sigil diamond
      if (t < 0.42) {
        const sf = 1 - smooth(0.18, 0.42, t);
        const sr = 6 + 10 * ease.outCubic(clamp(t / 0.18));
        for (let i = 0; i < 4; i++) {
          const a0 = (i / 4) * TAU;
          const a1 = ((i + 1) / 4) * TAU;
          p.line(Math.cos(a0) * sr, Math.sin(a0) * sr, Math.cos(a1) * sr, Math.sin(a1) * sr, V[5], sf);
        }
      }

      // Expanding two-tone crimson-void shockwave ring
      const r = 8 + (RAD - 8) * ease.outCubic(u);
      p.glowRing(0, 0, r, 5, C[5], 0.36 * fade);
      p.ring(0, 0, r, 3.0 * (1 - 0.45 * u), (v) => (v > 0.65 ? WHITE : v > 0.3 ? C[5] : V[4]), fade);

      // 8 jagged blood-ruby spikes piercing outward
      const spikeLen = 10 + (RAD - 6) * ease.outCubic(clamp(t / 0.32));
      const spikeTail = 6 + (RAD - 14) * smooth(0.14, 0.56, t);
      if (spikeLen > spikeTail + 1) {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU + (i % 2 === 0 ? 0.08 : -0.08);
          const ca = Math.cos(a);
          const sa = Math.sin(a);
          const col = i % 2 === 0 ? C[6] : V[5];
          p.line(ca * spikeTail, sa * spikeTail, ca * spikeLen, sa * spikeLen, (s) => (s > 0.72 ? WHITE : col), fade);
        }
      }

      ps.draw(p);
      lights.draw(p);
    },
  };
}
