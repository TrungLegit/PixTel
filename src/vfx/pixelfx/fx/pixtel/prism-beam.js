import { Particles, Lights, P, Rng, fit, bolt, flare, sparkle, clamp, smooth, ease, rand, WHITE } from "../../core/index.js";

export const meta = {
  name: "Prism beam",
  desc: "A multi-chromatic prism laser beam with a white-hot core, rainbow fringe, crackling refraction arcs, and pixel shards.",
  tags: ["prism", "laser", "beam", "rainbow", "directional", "one-shot"],
  size: [228, 96],
  origin: [24, 48],
  duration: 0.75,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#ff3b6b", "#ffaa33", "#44ee88", "#33ddff", "#aa66ff", "#d8f8ff", "#ffffff"],
    length: 164,
    seed: 4,
  },
};

const CHARGE = 0.07, HOLD = 0.46, END = 0.72;

export function create(o) {
  const C = fit(o.palette, 7), R = new Rng(o.seed), L = Math.min(180, o.length);
  const ps = new Particles({ rng: R, sparks: [WHITE, C[3], C[1], C[0]] });
  const lights = new Lights();
  let t = 0, fired = false;

  return {
    update(dt) {
      t += dt;
      if (!fired && t >= CHARGE) {
        fired = true;
        lights.add(0, 0, 32, WHITE, 0.85, 0.16);
        lights.add(L * 0.5, 0, 44, C[3], 0.65, 0.35);
        for (let i = 0; i < 14; i++) {
          const px = R.range(12, L - 6), py = R.range(-4, 4);
          const a = R.range(-1.2, 1.2), sp = R.range(55, 140);
          ps.spawn(P.SPARK, px, py, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.16, 0.34), WHITE, 1);
        }
        for (let i = 0; i < 8; i++) {
          const a = R.range(Math.PI * 0.5, Math.PI * 1.5), sp = R.range(30, 85);
          ps.spawn(P.MOTE, L, 0, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.2, 0.4), C[R.int(0, 4)], 0.8);
        }
      }
      if (t > CHARGE && t < HOLD && R.chance(0.45)) {
        const px = R.range(8, L - 4);
        ps.spawn(P.STAR, px, R.range(-6, 6), R.range(10, 40), R.range(-14, 14), R.range(0.15, 0.28), C[R.int(0, 5)], R.range(0.8, 1.5));
      }
      ps.update(dt);
      lights.update(dt);
    },
    draw(p) {
      if (t >= meta.duration) return;
      if (t < CHARGE) {
        const k = t / CHARGE;
        sparkle(p, 0, 0, 3 + 5 * k, WHITE, C[3], 0.6);
        p.ring(0, 0, 12 * (1 - k) + 2, 1.5, C[3], 0.9);
      } else if (t < END) {
        const u = clamp((t - CHARGE) / (HOLD - CHARGE));
        const cool = smooth(HOLD, END, t);
        const w = (t < CHARGE + 0.05 ? 7 : 4.5) * (1 - 0.88 * cool);
        const fr = Math.floor(t * 30);
        const reach = L * ease.outExpo(clamp((t - CHARGE) / 0.06));
        const fade = 1 - smooth(END - 0.1, END, t);
        for (let x = 0; x <= reach; x += 1) {
          const jitter = Math.sin(x * 0.32 - t * 48) * 0.7 * (1 - cool * 0.6) + (rand(x, fr, o.seed) - 0.5) * 0.5;
          const bw = Math.max(0.5, w * (1 + 0.22 * Math.sin(x * 0.25 - t * 30)));
          const bandC = C[(Math.floor(x / 10 - t * 22) % 5 + 5) % 5];
          if (bw >= 1.2) {
            p.dot(x, jitter - bw, bandC, fade * 0.9);
            p.dot(x, jitter + bw, C[(Math.floor(x / 10 - t * 22 + 2) % 5 + 5) % 5], fade * 0.9);
            for (let y = -bw + 1; y <= bw - 1; y += 1) {
              p.dot(x, jitter + y, Math.abs(y) <= bw * 0.4 ? WHITE : C[5], fade);
            }
          } else {
            p.dot(x, jitter, cool < 0.75 ? C[5] : bandC, fade);
          }
        }
        p.glowLine(0, 0, reach, 0, 10 * (1 - cool * 0.6), C[3], 0.45 * fade);
        if (t < HOLD) {
          const r = new Rng(o.seed + fr * 17);
          const path = bolt(r, 4, 0, reach, 0, { jag: 0.08, depth: 3 });
          p.polyline(path, (u2) => (u2 < 0.5 ? WHITE : C[Math.floor(u2 * 5)]), 0.9);
          flare(p, 0, 0, 11 * (1 - 0.3 * u), 0.7, C);
          sparkle(p, reach, 0, 7 * (1 - 0.4 * u), WHITE, C[3], 0.7);
        }
      }
      ps.draw(p);
      lights.draw(p);
    },
  };
}
