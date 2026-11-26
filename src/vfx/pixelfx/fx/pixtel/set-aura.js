import { fit, cycle, flare, TAU, WHITE, PAL } from "../../core/index.js";

export const meta = {
  name: "Set Bonus Aura",
  desc: "Looping 3-piece RPG set aura with forest, forge, and eclipse themes in dual back/front layers.",
  tags: ["aura", "set", "loop", "pixtel"],
  size: [72, 72],
  origin: [36, 54],
  duration: 1.6,
  loop: true,
  fps: 20,
  bg: "dark",
  options: {
    theme: "forge",
    radius: 22,
    seed: 17,
  },
};

const D = meta.duration;

const THEME_PALS = {
  forest: PAL.heal,
  forge: PAL.fire,
  eclipse: PAL.arcane,
};

const ACCENT_PALS = {
  forest: PAL.poison,
  forge: PAL.gold,
  eclipse: PAL.blood,
};

export function drawBack(p, t, o) {
  const theme = o.theme && THEME_PALS[o.theme] ? o.theme : "forge";
  const C = fit(THEME_PALS[theme], 8);
  const A = fit(ACCENT_PALS[theme], 8);
  const R = o.radius ?? 22;
  const ph = (t % D) / D;
  const pulse = 0.5 + 0.5 * Math.sin(ph * TAU * 2);

  // Warm/mystic ground circle glow + aura backdrop halo
  p.glow(0, -14, R * 1.15, C[4], 0.16 + 0.06 * pulse);
  p.glowRing(0, -1, R * 0.88, 3.0, C[5], 0.28 + 0.08 * pulse);

  // Rotating rune-dots along horizontal ground ellipse
  const steps = 28;
  const rot = ph * TAU * (theme === "eclipse" ? -1 : 1);
  for (let i = 0; i < steps; i++) {
    if (i % 7 === 5 || i % 7 === 6) continue;
    const ang = (i / steps) * TAU + rot;
    const rx = R * 0.92;
    const ry = R * 0.28;
    const gx = Math.cos(ang) * rx;
    const gy = -1 + Math.sin(ang) * ry;
    // Draw back half strongly in drawBack
    if (Math.sin(ang) <= 0.15) {
      const col = i % 7 === 0 ? WHITE : i % 2 === 0 ? C[5] : A[4];
      p.dot(gx, gy, col, 0.88);
    }
  }

  // Theme-specific upper silhouette aura behind character
  if (theme === "eclipse") {
    for (let k = 0; k < 2; k++) {
      const a0 = ph * TAU + k * Math.PI;
      for (let s = 0; s < 10; s++) {
        const u = s / 9;
        const a = a0 + u * 0.95;
        const ox = Math.cos(a) * (R * 0.72);
        const oy = -17 + Math.sin(a) * (R * 0.48);
        if (Math.sin(a) <= 0) {
          p.dot(ox, oy, u > 0.7 ? WHITE : A[5], 1 - u * 0.6);
        }
      }
    }
  } else if (theme === "forge") {
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI + (i / 9) * Math.PI;
      const sway = Math.sin(ph * TAU * 2 + i * 0.9) * 1.6;
      const fx = Math.cos(a) * (R * 0.78) + sway;
      const fy = -8 + Math.sin(a) * (R * 0.55) - pulse * 2;
      p.dot(fx, fy, i % 3 === 0 ? A[5] : C[4], 0.62);
    }
  } else {
    for (let i = 0; i < 8; i++) {
      const a = ph * TAU + (i * TAU) / 8;
      if (Math.sin(a) <= 0) {
        p.dot(Math.cos(a) * (R * 0.82), -15 + Math.sin(a) * 6, i % 2 === 0 ? C[5] : A[5], 0.75);
      }
    }
  }
}

export function draw(p, t, o) {
  const theme = o.theme && THEME_PALS[o.theme] ? o.theme : "forge";
  const C = fit(THEME_PALS[theme], 8);
  const A = fit(ACCENT_PALS[theme], 8);
  const R = o.radius ?? 22;
  const ph = (t % D) / D;
  const seed = o.seed ?? 17;

  // Front half of ground rune ring
  const steps = 28;
  const rot = ph * TAU * (theme === "eclipse" ? -1 : 1);
  for (let i = 0; i < steps; i++) {
    if (i % 7 === 5 || i % 7 === 6) continue;
    const ang = (i / steps) * TAU + rot;
    if (Math.sin(ang) > 0.1) {
      const gx = Math.cos(ang) * (R * 0.92);
      const gy = -1 + Math.sin(ang) * (R * 0.28);
      const col = i % 7 === 0 ? WHITE : i % 2 === 0 ? C[5] : A[4];
      p.dot(gx, gy, col, 0.92);
    }
  }

  // Rising pixel motes / embers / leaf spores / eclipse stars
  cycle(
    t,
    D,
    18,
    seed,
    (g) => g.range(0.65, 1.08),
    (age, life, r, idx) => {
      const u = age / life;
      const sx = r.range(-R * 0.78, R * 0.78);
      const wobble = Math.sin(u * TAU * 1.5 + r.range(0, TAU)) * (theme === "forest" ? 3.5 : 2.0);
      const sy = r.range(-6, 2) - u * r.range(26, 40);
      const alpha = Math.min(1, u / 0.16, (1 - u) / 0.25);
      if (alpha <= 0.05) return;
      const col = u < 0.25 ? WHITE : idx % 3 === 0 ? A[5] : C[5];
      p.dot(sx + wobble, sy, col, alpha);
      if (idx % 3 === 0) {
        p.dot(sx + wobble, sy + 1, C[4], alpha * 0.72);
      }
      if (idx % 4 === 0 && alpha > 0.45) {
        p.glow(sx + wobble, sy, 3.0, col, 0.28 * alpha);
      }
    }
  );

  // Twin orbiting hero flare wisps in foreground
  for (let k = 0; k < 2; k++) {
    const ang = ph * TAU + k * Math.PI;
    if (Math.sin(ang) > -0.1) {
      const ox = Math.cos(ang) * (R * 0.85);
      const oy = -15 + Math.sin(ang) * 5;
      flare(p, ox, oy, 3.4, 0.72, k === 0 ? C : A);
      p.dot(ox, oy, WHITE, 0.95);
    }
  }
}
