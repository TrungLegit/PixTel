import { Lights, Rng, fit, sparkle, clamp, smooth, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Hex shield",
  desc: "Crisp pixel-art hexagonal defensive barrier with pulsing hex seams and orbiting rune glints.",
  tags: ["shield", "hex", "defense", "barrier", "guard", "one-shot"],
  size: [84, 84],
  origin: [42, 42],
  duration: 2.3,
  loop: false,
  fps: 24,
  bg: "dark",
  options: {
    palette: ["#0f3f2c", "#17663e", "#24924e", "#3ec466", "#7ee88a", "#c8ffc4", "#ffffff"],
    radius: 22,
    seed: 5,
  },
};

const D = meta.duration;
const INV_S3 = 0.8660254;

export function create(o) {
  const C = fit(o.palette, 7);
  const R = new Rng(o.seed);
  const RAD = Math.min(34, o.radius);
  const lights = new Lights();

  lights.add(0, 0, RAD + 16, C[4], 0.55, 0.35);

  const verts = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3 - Math.PI / 2;
    return [Math.cos(a) * RAD, Math.sin(a) * RAD];
  });

  let t = 0;

  return {
    update(dt) {
      t += dt;
      lights.update(dt);
    },
    draw(p) {
      if (t >= D) return;
      const env = smooth(0, 0.14, t) * (1 - smooth(D - 0.26, D, t));
      if (env <= 0.02) return;
      const apothem = RAD * INV_S3;
      const scanY = -RAD + ((t * 42) % (RAD * 2));
      const pulse = 0.72 + 0.28 * Math.sin(t * 7.5);

      p.shade(-RAD - 2, -RAD - 2, RAD + 2, RAD + 2, (x, y, out) => {
        const ax = Math.abs(x);
        const ay = Math.abs(y);
        // Pointy-top hexagon signed normalized distance (1.0 right on hex perimeter)
        const hd = Math.max(ax * INV_S3 + ay * 0.5, ay * 0.88) / apothem;
        if (hd > 1.03) return;
        const onRim = hd >= 0.88;
        const onInner = hd >= 0.74 && hd < 0.82 && ((Math.round(x + y) & 1) === 0);
        const gridLine = ((Math.abs(Math.round(x * 0.5) + Math.round(y * 0.86)) % 5) === 0);
        const scanDist = Math.abs(y - scanY);
        const onScan = scanDist < 1.6;

        if (onRim) {
          const highlight = y < -RAD * 0.35 || onScan;
          out.c = highlight ? WHITE : C[5];
          out.a = env * (0.88 + 0.12 * pulse);
          out.l = C[4];
          out.k = 0.32 * env * pulse;
        } else if (onInner) {
          out.c = C[4];
          out.a = env * 0.52;
        } else if (onScan) {
          out.c = C[5];
          out.a = env * 0.42;
        } else if (gridLine) {
          out.c = C[3];
          out.a = env * 0.22;
        } else {
          out.c = C[2];
          out.a = env * 0.12;
        }
      });

      // Crisp corner sparkle glints around the hex vertices
      for (let i = 0; i < 6; i++) {
        const phase = Math.sin(t * 6 + i * 1.1);
        if (phase > 0.35) {
          const [vx, vy] = verts[i];
          sparkle(p, vx, vy, 2.2 * phase * env, WHITE, C[4], 0.45 * env);
        }
      }

      p.glow(0, 0, RAD + 8, C[3], 0.2 * env * pulse);
      lights.draw(p);
    },
  };
}
