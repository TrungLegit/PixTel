import { Particles, Lights, P, Rng, fit, sparkle, clamp, ease, smooth, WHITE } from "../../core/index.js";

export const meta = {
  name: "Compile turret",
  desc: "A cyan-emerald holographic grid base snaps open and a scan bar materializes pixel brackets with electric sparks.",
  tags: ["tinker", "compile", "hologram", "scifi", "summon", "one-shot"],
  size: [80, 80],
  origin: [40, 48],
  duration: 0.85,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#041818", "#0a423a", "#148066", "#22cc88", "#44eecc", "#b8fff0", "#ffffff"],
    seed: 11,
  },
};

const D = meta.duration;

export function create(o) {
  const C = fit(o.palette, 7), R = new Rng(o.seed);
  const ps = new Particles({ rng: R, sparks: [WHITE, C[4], C[3], C[2]] });
  const lights = new Lights();
  let t = 0, flashed = false;

  lights.add(0, -6, 26, C[4], 0.65, 0.55);

  return {
    update(dt) {
      t += dt;
      if (t < 0.55 && R.chance(0.45)) {
        ps.spawn(P.MOTE, R.range(-10, 10), 2, 0, -R.range(45, 95), R.range(0.18, 0.32), R.chance(0.5) ? WHITE : C[4], 0.7);
      }
      if (!flashed && t >= 0.45) {
        flashed = true;
        lights.add(0, -8, 32, WHITE, 0.75, 0.14);
        for (let i = 0; i < 12; i++) {
          const a = R.range(0, Math.PI * 2), sp = R.range(40, 130);
          ps.spawn(P.SPARK, 0, -8, Math.cos(a) * sp, Math.sin(a) * sp - 20, R.range(0.16, 0.34), WHITE, 1);
        }
      }
      ps.update(dt);
      lights.update(dt);
    },
    draw(p) {
      if (t >= D) return;
      const fade = 1 - smooth(0.58, D - 0.03, t);
      if (fade > 0) {
        const w = 13 * ease.outBack(clamp(t / 0.18));
        // Isometric diamond hologram footprint
        const pts = [[0, -w * 0.45], [w, 0], [0, w * 0.45], [-w, 0]];
        for (let i = 0; i < 4; i++) {
          const a = pts[i], b = pts[(i + 1) % 4];
          p.line(a[0], a[1], b[0], b[1], t < 0.15 ? WHITE : C[4], fade);
        }
        // Rising vertical brackets and scan bar
        const scan = clamp(t / 0.48);
        const sy = 4 - 22 * scan;
        if (t < 0.55) {
          p.line(-w * 0.75, sy, w * 0.75, sy, WHITE, fade);
          p.glowLine(-w * 0.75, sy, w * 0.75, sy, 5, C[4], 0.45 * fade);
          for (const sx of [-10, 10]) {
            p.line(sx, 0, sx, sy, C[3], fade * 0.7);
          }
        }
        if (t >= 0.43 && t < 0.65) {
          sparkle(p, 0, -8, 8 * (1 - (t - 0.43) / 0.22), WHITE, C[4], 0.6);
        }
      }
      ps.draw(p);
      lights.draw(p);
    },
  };
}
