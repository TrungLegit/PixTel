import { fit, sparkle, clamp, smooth, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Boss telegraph",
  desc: "A crisp pixel danger ring on the ground with converging ticks and filling inner pulse before a boss strike.",
  tags: ["boss", "telegraph", "warning", "ground", "one-shot"],
  size: [128, 128],
  origin: [64, 64],
  duration: 1.0,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#24040a", "#660c1c", "#b8182e", "#ff3044", "#ff7766", "#ffd0b8", "#ffffff"],
    radius: 38,
    seed: 1,
  },
};

export function draw(p, t, o) {
  if (t >= meta.duration) return;
  const C = fit(o.palette, 7), R = o.radius, u = clamp(t / 0.85);
  const fade = t < 0.85 ? 1 : 1 - smooth(0.85, 0.98, t);
  if (fade <= 0) return;

  const flash = t >= 0.78 && t < 0.88;
  // Outer pixel ring (dashed rotating ticks)
  const n = Math.max(24, Math.round(R * 1.4));
  for (let i = 0; i < n; i++) {
    if (i % 3 === 2 && !flash) continue;
    const a = (i / n) * TAU + t * 1.6;
    p.dot(Math.cos(a) * R, Math.sin(a) * R * 0.85, flash ? WHITE : C[3], fade);
  }
  // Filling inner ring converging outward to R
  const ri = Math.max(2, R * u);
  p.ring(0, 0, ri, 1.5, flash ? WHITE : C[4], fade * 0.9);
  // Crisp pixel crosshair inside
  if (u > 0.1) {
    const ch = 4 + 4 * u;
    p.line(-ch, 0, ch, 0, flash ? WHITE : C[3], fade * 0.65);
    p.line(0, -ch * 0.85, 0, ch * 0.85, flash ? WHITE : C[3], fade * 0.65);
  }
  if (flash) sparkle(p, 0, 0, 7, WHITE, C[3], 0.6);
  p.glow(0, 0, R * 0.9, C[3], (0.14 + 0.25 * u) * fade);
}
