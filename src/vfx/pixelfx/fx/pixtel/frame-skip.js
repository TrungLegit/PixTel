import { Particles, Bits, Lights, P, B, Rng, fit, flare, clamp, ease, rand, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Frame skip",
  desc: "A glitching chromatic silhouette ticks down with scanline sparks, then detonates in a burst of RGB pixel shards.",
  tags: ["glitch", "rogue", "afterimage", "bomb", "scifi", "one-shot"],
  size: [128, 128],
  origin: [64, 68],
  duration: 1.25,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#180828", "#ff2e63", "#ff7aa8", "#2ef2ff", "#98fbff", "#e8ffff", "#ffffff"],
    seed: 9,
  },
};

const DETONATE = 0.8, D = meta.duration;

export function create(o) {
  const C = fit(o.palette, 7), R = new Rng(o.seed);
  const ps = new Particles({ rng: R, sparks: [WHITE, C[3], C[1], C[2]] });
  const bits = new Bits({ ground: () => 46 }), lights = new Lights();
  let t = 0, blown = false;

  return {
    update(dt) {
      t += dt;
      if (t < DETONATE && R.chance(0.4)) {
        const a = R.range(0, TAU), d = R.range(12, 24);
        ps.spawn(P.STREAK, Math.cos(a) * d, -8 + Math.sin(a) * d, -Math.cos(a) * 45, -Math.sin(a) * 45, 0.18, R.chance(0.5) ? C[1] : C[3]);
      }
      if (!blown && t >= DETONATE) {
        blown = true;
        lights.add(0, -8, 54, C[3], 0.85, 0.35);
        lights.add(0, -8, 28, WHITE, 0.9, 0.1);
        for (let i = 0; i < 20; i++) {
          const a = R.range(0, TAU), sp = R.range(80, 180);
          ps.spawn(P.SPARK, 0, -8, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.15, 0.34), WHITE, 1);
        }
        for (let i = 0; i < 10; i++) {
          const a = R.range(0, TAU), sp = R.range(45, 130);
          bits.add({ kind: B.SHARD, x: 0, y: -8, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.2, drag: 1.8, bounce: 0, life: R.range(0.22, 0.38), a: R.range(0, TAU), va: R.range(-20, 20), s: R.range(2, 4), c: R.pick([C[1], C[3], WHITE]) });
        }
      }
      ps.update(dt);
      bits.update(dt);
      lights.update(dt);
    },
    draw(p) {
      if (t >= D) return;
      if (t < DETONATE) {
        const u = t / DETONATE;
        const fr = Math.floor(t * 30);
        const blink = Math.sin(u * u * 38) > 0;
        const split = 2 + Math.floor(u * 4);
        for (let my = -15; my <= -1; my++) {
          const tear = rand(fr, my, o.seed) < 0.25 + u * 0.35 ? Math.round((rand(fr, my, 2) - 0.5) * 6) : 0;
          const hw = my < -10 ? 3 : my < -4 ? 5 : 4;
          p.line(-hw - split + tear, my, hw - split + tear, my, C[1], 0.65);
          p.line(-hw + split + tear, my, hw + split + tear, my, C[3], 0.65);
          if ((my + fr) % 3 !== 0) p.line(-hw + tear, my, hw + tear, my, blink ? WHITE : C[4], 0.9);
        }
        const aEnd = -Math.PI / 2 + u * TAU;
        p.arc(0, -8, 16, 2, -Math.PI / 2, aEnd, blink ? WHITE : C[3], 0.95);
        p.glow(0, -8, 18, blink ? C[1] : C[3], 0.3 + 0.3 * u);
      } else {
        const bu = (t - DETONATE) / (D - DETONATE);
        if (bu < 0.35) {
          flare(p, 0, -8, 24 * (1 - bu / 0.35), 1 - bu / 0.35, C);
          p.circle(0, -8, 7 * (1 - bu / 0.35), WHITE);
        }
        const rr = 6 + 34 * ease.outCubic(clamp(bu * 1.4));
        if (bu < 0.7) {
          p.ring(0, -8, rr, Math.max(1, 3 * (1 - bu / 0.7)), bu < 0.2 ? WHITE : C[3], 1 - bu / 0.7);
        }
      }
      bits.draw(p);
      ps.draw(p);
      lights.draw(p);
    },
  };
}
