import enemiesUrl from "../assets/codixel-enemies.png";
import enemiesMeta from "../assets/codixel-enemies.json";
import type { EnemyAnimKind, EnemyFacingDir } from "../world/entities";

interface AtlasFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  anchorY: number;
}

interface MonsterMeta {
  w: number;
  h: number;
  floating: boolean;
}

const FRAMES = enemiesMeta.frames as Record<string, AtlasFrame>;
const MONSTERS = enemiesMeta.monsters as Record<string, MonsterMeta>;
const WALK_CYCLE = [0, 1, 0, 2] as const;

let atlasImg: HTMLImageElement | null = null;
let whiteCanvas: HTMLCanvasElement | null = null;
let atlasReady = false;

function buildWhiteOffscreen(img: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  const id = ctx.getImageData(0, 0, c.width, c.height);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    d[i] = 255;
    d[i + 1] = 255;
    d[i + 2] = 255;
  }
  ctx.putImageData(id, 0, 0);
  return c;
}

function ensureInit() {
  if (typeof Image === "undefined" || atlasImg) return;
  atlasImg = new Image();
  atlasImg.onload = () => {
    whiteCanvas = buildWhiteOffscreen(atlasImg!);
    atlasReady = true;
  };
  atlasImg.src = enemiesUrl;
}

ensureInit();

export function hasCodixelEnemy(defId: string): boolean {
  return Boolean(MONSTERS[defId]);
}

export function getCodixelEnemySize(defId: string): { w: number; h: number } | null {
  const m = MONSTERS[defId];
  return m ? { w: m.w, h: m.h } : null;
}

export interface CodixelEnemyDrawOpts {
  defId: string;
  uid: number;
  x: number;
  y: number;
  facingDir: EnemyFacingDir;
  animKind: EnemyAnimKind;
  animProgress: number; // 0..1 during active attack skill
  animAngle: number;
  walkTime: number;
  isMoving: boolean;
  isBoss: boolean;
  hitFlash: boolean;
  guardTime: number;
  dashTime: number;
  dashVx: number;
  dashVy: number;
  time: number;
}

function dirToAtlasKey(dir: EnemyFacingDir): "front" | "back" | "left" | "right" {
  if (dir === "up") return "back";
  if (dir === "left") return "left";
  if (dir === "right") return "right";
  return "front";
}

function selectMonsterFrame(
  opts: CodixelEnemyDrawOpts,
  dirKey: "front" | "back" | "left" | "right",
  meta: MonsterMeta
): { frame: AtlasFrame; isRollBall: boolean } {
  const { defId, animKind, animProgress: u, walkTime, time, isMoving, uid } = opts;

  // Special attack silhouette frames
  if (defId === "null_slime" && animKind === "leap_slam" && u >= 0.72 && FRAMES["null_slime:slam"]) {
    return { frame: FRAMES["null_slime:slam"], isRollBall: false };
  }
  if (
    defId === "ash_hopper" &&
    animKind === "roll_charge" &&
    u >= 0.16 &&
    u <= 0.88 &&
    FRAMES["ash_hopper:roll"]
  ) {
    return { frame: FRAMES["ash_hopper:roll"], isRollBall: true };
  }

  let frameIdx = 0;
  if (defId === "bleach_hound" || defId === "boss_blight_root") {
    const flapSpd = animKind !== "idle" ? 11.5 : isMoving ? 8.5 : 6.8;
    frameIdx = WALK_CYCLE[Math.floor(time * flapSpd + uid * 0.7) & 3];
  } else if (meta.floating) {
    frameIdx = WALK_CYCLE[Math.floor(time * 4.8 + uid * 0.7) & 3];
  } else if (defId === "null_slime") {
    if (animKind === "leap_slam") {
      frameIdx = u < 0.22 ? 1 : 2;
    } else if (animKind === "spit_moss") {
      frameIdx = u < 0.3 ? 1 : 2;
    } else if (isMoving) {
      frameIdx = WALK_CYCLE[Math.floor(walkTime * 6.5) & 3];
    } else {
      frameIdx = (Math.floor(time * 2.4 + uid) & 1) === 1 ? 1 : 0;
    }
  } else if (
    isMoving ||
    animKind === "dive_slash" ||
    animKind === "crystal_lunge" ||
    animKind === "root_whip" ||
    animKind === "halberd_sweep" ||
    animKind === "claw_clamp"
  ) {
    frameIdx = WALK_CYCLE[Math.floor(walkTime * 7.5) & 3];
  }

  const key = frameIdx === 0 ? `${defId}:${dirKey}` : `${defId}:${dirKey}:${frameIdx}`;
  const frame = FRAMES[key] ?? FRAMES[`${defId}:${dirKey}`] ?? FRAMES[`${defId}:front`];
  return { frame, isRollBall: false };
}

/**
 * Renders 4-direction multi-frame monster & boss sprites from `codixel-enemies.png`
 * with crisp pixel-locked walk/flap/hop frames, dynamic shadow scaling, hit recoil,
 * and phase-synced skill keyframes. Returns false if fallback sprite should be used.
 */
export function drawCodixelEnemy(
  ctx: CanvasRenderingContext2D,
  opts: CodixelEnemyDrawOpts
): boolean {
  ensureInit();
  if (!atlasReady || !atlasImg || !MONSTERS[opts.defId]) return false;

  const meta = MONSTERS[opts.defId];
  const dirKey = opts.animKind === "rainbow_storm" ? "front" : dirToAtlasKey(opts.facingDir);
  const { frame: f, isRollBall } = selectMonsterFrame(opts, dirKey, meta);
  if (!f) return false;

  const { animKind, animProgress: u, animAngle, walkTime, time } = opts;
  const src: CanvasImageSource = opts.hitFlash && whiteCanvas ? whiteCanvas : atlasImg;

  let ox = 0;
  let oy = 0;
  let scaleX = 1;
  let scaleY = 1;
  let rot = 0;

  const cs = Math.cos(animAngle);
  const sn = Math.sin(animAngle);

  // Crisp 0-blur baseline motion (no sub-pixel rotation wobble on walk)
  if (meta.floating) {
    oy += Math.round(Math.sin(time * 4.8 + opts.uid) * 2.5);
  } else if (opts.defId === "null_slime") {
    if (opts.isMoving) {
      const hop = Math.abs(Math.sin(walkTime * 5.6));
      oy -= Math.round(hop * 2.5);
    } else {
      const b = Math.sin(time * 3.2 + opts.uid);
      scaleX = 1 - b * 0.035;
      scaleY = 1 + b * 0.035;
    }
  } else if (!opts.isMoving && animKind === "idle") {
    const b = Math.sin(time * 3.4 + opts.uid);
    scaleY = 1 + b * 0.032;
    scaleX = 1 - b * 0.022;
  }

  // Synchronized skill animations
  if (animKind === "leap_slam") {
    if (u < 0.22) {
      const k = u / 0.22;
      scaleX = 1 + 0.26 * k;
      scaleY = 1 - 0.24 * k;
      oy = 0;
    } else if (u < 0.74) {
      const arc = Math.sin(((u - 0.22) / 0.52) * Math.PI);
      oy = -Math.round(arc * 19);
      scaleX = 0.88;
      scaleY = 1.16;
    } else {
      const k = 1 - (u - 0.74) / 0.26;
      scaleX = 1 + 0.34 * k;
      scaleY = 1 - 0.32 * k;
      oy = 0;
    }
  } else if (
    animKind === "spit_moss" ||
    animKind === "thorn_shot" ||
    animKind === "sonic_wave" ||
    animKind === "refract_split"
  ) {
    if (u < 0.3) {
      const k = u / 0.3;
      ox -= Math.round(cs * 2.5 * k);
      oy -= Math.round(sn * 1.5 * k);
      scaleX = 1 + 0.16 * k;
      scaleY = 1 - 0.1 * k;
    } else if (u < 0.66) {
      const k = 1 - (u - 0.3) / 0.36;
      ox += Math.round(cs * 3.5 * k);
      oy += Math.round(sn * 2.0 * k);
      scaleX = 1 - 0.08 * k;
      scaleY = 1 + 0.12 * k;
    }
  } else if (
    animKind === "roll_charge" ||
    animKind === "dive_slash" ||
    animKind === "crystal_lunge"
  ) {
    if (u < 0.18) {
      const k = u / 0.18;
      ox -= Math.round(cs * 3 * k);
      scaleX = 1.15;
      scaleY = 0.85;
    } else if (u < 0.88) {
      if (isRollBall) {
        // Cardinal 90-degree crisp spin for Ash Hopper rolling shell ball
        rot = (Math.floor(time * 22) & 3) * (Math.PI / 2);
        oy -= 2;
      } else {
        ox += Math.round(cs * 2);
        scaleX = 1.14;
        scaleY = 0.88;
        rot = (cs >= 0 ? 1 : -1) * 0.12;
      }
    }
  } else if (
    animKind === "shell_burst" ||
    animKind === "quake_slam" ||
    animKind === "shard_rain" ||
    animKind === "refract_rain" ||
    animKind === "ground_roots" ||
    animKind === "vine_trap"
  ) {
    if (u < 0.35) {
      const k = u / 0.35;
      oy -= Math.round(4 * k);
      scaleX = 1 - 0.08 * k;
      scaleY = 1 + 0.14 * k;
    } else if (u < 0.72) {
      const k = 1 - (u - 0.35) / 0.37;
      oy += Math.round(1.5 * k);
      ox += Math.round(Math.sin(time * 65) * 1.3 * k);
      scaleX = 1 + 0.22 * k;
      scaleY = 1 - 0.2 * k;
    }
  } else if (
    animKind === "root_whip" ||
    animKind === "claw_clamp" ||
    animKind === "halberd_sweep"
  ) {
    if (u < 0.25) {
      const k = u / 0.25;
      ox -= Math.round(cs * 3.5 * k);
      rot = (cs >= 0 ? -1 : 1) * 0.1 * k;
    } else if (u < 0.68) {
      const k = 1 - (u - 0.25) / 0.43;
      ox += Math.round(cs * 5.5 * k);
      oy += Math.round(sn * 3 * k);
      rot = (cs >= 0 ? 1 : -1) * 0.14 * k;
      scaleX = 1 + 0.12 * k;
    }
  } else if (animKind === "bark_shield" || animKind === "quartz_shield") {
    scaleX = 1.07;
    scaleY = 0.93;
  } else if (
    animKind === "thin_laser" ||
    animKind === "emerald_orb" ||
    animKind === "prism_breath"
  ) {
    if (u < 0.34) {
      ox += ((Math.floor(time * 48) & 1) ? 1 : -1);
      scaleX = 0.94;
      scaleY = 1.08;
    } else if (u < 0.85) {
      ox += Math.round(cs * 2.5);
      oy += Math.round(sn * 1.4);
      scaleX = 1.07;
      scaleY = 0.95;
    }
  } else if (animKind === "leaf_storm" || animKind === "rainbow_storm") {
    oy -= 3;
    const p = 1 + Math.sin(u * Math.PI * 6) * 0.08;
    scaleX = p;
    scaleY = p;
  }

  // Hit-flash micro-squash + recoil shiver
  if (opts.hitFlash) {
    scaleX *= 1.13;
    scaleY *= 0.88;
    ox += ((Math.floor(time * 55) + opts.uid) & 1) ? 1 : -1;
  }

  // Dynamic altitude-aware ground shadow
  const lift = Math.max(0, -oy) + (meta.floating ? 4 : 0);
  const shScale = Math.max(0.42, 1 - lift * 0.024);
  const baseW = opts.isBoss ? 26 : f.w >= 34 ? 19 : 12;
  const sw = Math.max(5, Math.round(baseW * shScale));
  const shAlpha = Math.max(0.16, 0.38 - lift * 0.008);
  ctx.fillStyle = `rgba(0,0,0,${shAlpha.toFixed(2)})`;
  ctx.fillRect(Math.round(opts.x + ox * 0.3 - sw / 2), Math.round(opts.y - 1), sw, 3);

  const drawFrameAt = (imgSrc: CanvasImageSource) => {
    if (isRollBall) {
      ctx.translate(Math.round(opts.x + ox), Math.round(opts.y + oy - f.h * 0.5));
      ctx.rotate(rot);
      ctx.scale(scaleX, scaleY);
      ctx.drawImage(imgSrc, f.x, f.y, f.w, f.h, -f.w / 2, -f.h / 2, f.w, f.h);
    } else {
      ctx.translate(Math.round(opts.x + ox), Math.round(opts.y + oy));
      if (rot !== 0) ctx.rotate(rot);
      ctx.scale(scaleX, scaleY);
      ctx.drawImage(imgSrc, f.x, f.y, f.w, f.h, -f.w / 2, -f.anchorY, f.w, f.h);
    }
  };

  // Dash afterimages trailing behind roll_charge / dive_slash / crystal_lunge
  if (opts.dashTime > 0 && animKind !== "leap_slam" && !opts.hitFlash) {
    const dLen = Math.hypot(opts.dashVx, opts.dashVy) || 1;
    const ux = opts.dashVx / dLen;
    const uy = opts.dashVy / dLen;
    for (let g = 2; g >= 1; g--) {
      ctx.save();
      ctx.globalAlpha = g === 1 ? 0.38 : 0.2;
      ctx.imageSmoothingEnabled = false;
      ctx.translate(Math.round(-ux * g * 6), Math.round(-uy * g * 5));
      drawFrameAt(atlasImg);
      ctx.restore();
    }
  }

  // Main pixel sprite draw
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  drawFrameAt(src);
  ctx.restore();

  // Synchronized beam/orb core charge flare on caster face/chest
  if (
    !opts.hitFlash &&
    (animKind === "thin_laser" ||
      animKind === "emerald_orb" ||
      animKind === "prism_breath" ||
      animKind === "leaf_storm" ||
      animKind === "rainbow_storm")
  ) {
    const pulseR = Math.round(3 + Math.sin(time * 24) * 1.5);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle =
      animKind === "emerald_orb" || animKind === "leaf_storm"
        ? "rgba(88, 255, 138, 0.78)"
        : "rgba(120, 245, 255, 0.82)";
    ctx.fillRect(
      Math.round(opts.x + ox - pulseR),
      Math.round(opts.y + oy - f.h * 0.55 - pulseR),
      pulseR * 2,
      pulseR * 2
    );
    ctx.restore();
  }

  // Crisp pixel chamfered hex-barrier / diamond-crystal shield accent when guardTime > 0
  if (opts.guardTime > 0 && !opts.hitFlash) {
    const isBark = opts.defId === "root_golem";
    const pulse = 0.55 + Math.sin(time * 9) * 0.16;
    ctx.save();
    ctx.globalAlpha = pulse;
    if (isBark) {
      const rx = Math.round(f.w * 0.52);
      const cy = Math.round(opts.y + oy - f.h * 0.5);
      const ry = Math.round(f.h * 0.52);
      const ch = 6;
      const cx = Math.round(opts.x + ox);
      ctx.strokeStyle = "#7effa8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - rx + ch, cy - ry);
      ctx.lineTo(cx + rx - ch, cy - ry);
      ctx.lineTo(cx + rx, cy - ry + ch);
      ctx.lineTo(cx + rx, cy + ry - ch);
      ctx.lineTo(cx + rx - ch, cy + ry);
      ctx.lineTo(cx - rx + ch, cy + ry);
      ctx.lineTo(cx - rx, cy + ry - ch);
      ctx.lineTo(cx - rx, cy - ry + ch);
      ctx.closePath();
      ctx.stroke();
    } else {
      const gx = Math.round(opts.x + ox + (opts.facingDir === "left" ? -11 : opts.facingDir === "right" ? 11 : 0));
      const gy = Math.round(opts.y + oy - f.h * 0.48);
      ctx.fillStyle = "rgba(142, 252, 255, 0.78)";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx, gy - 8);
      ctx.lineTo(gx + 6, gy);
      ctx.lineTo(gx, gy + 8);
      ctx.lineTo(gx - 6, gy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  return true;
}
