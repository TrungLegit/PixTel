// The character who acts: a real skeleton in 3D, drawn down to pixels the way Dead Cells makes its sprites. Bones have
// fixed lengths and hang from each other, pelvis to spine to chest to shoulders, so the body can twist, bend and turn round,
// and depth decides what's in front. A pose only says where the hands and feet should be and how the body is carrying
// itself; the solver works out every joint, and the renderer shades it into a few flat tones with one clean ink line.
//
// Coordinates: x right, y up, z towards the viewer, in pixels, the feet at the origin. Poses are in screen terms (y negative
// is up), as effects are. The character faces +x with his right side towards the viewer, so the right hand is the near one.
//
// A rendered pose also knows, for each of its pixels, which pixel of the standing character it came from (`src`). That
// is what lets an effect drawn on the standing body (frost, poison, a scan line) follow the body wherever it goes.

import { hex } from "./color.js";
import { DUMMY_PAL } from "./actor.js";

const PAL = Object.fromEntries(Object.entries(DUMMY_PAL).map(([k, v]) => [k, hex(v) >>> 0]));
const INK = PAL.k, SEAM = PAL.J, MARK = PAL.m;
// plates and joints: lit to dark
const SHELL = [PAL.A, PAL.B, PAL.C, PAL.D], CORE = [PAL.E, PAL.F, PAL.G, PAL.G];
const DEG = Math.PI / 180, W0 = 24, H0 = 38;

// ---- vectors and turns
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => mul(a, 1 / (len(a) || 1e-6));
const rotY = (t) => { const c = Math.cos(t), s = Math.sin(t); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
const rotZ = (t) => { const c = Math.cos(t), s = Math.sin(t); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
const mm = (A, B) => { const o = new Array(9); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]; return o; };
const mv = (M, v) => [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]];
const tv = (M, v) => [M[0] * v[0] + M[3] * v[1] + M[6] * v[2], M[1] * v[0] + M[4] * v[1] + M[7] * v[2], M[2] * v[0] + M[5] * v[1] + M[8] * v[2]];
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// ---- the body's measurements, in pixels
const M = {
  pelvis: 19.7, spine1: 2.8, spine2: 4.6, shoulderUp: 2.5, shoulderOut: 5.9, neckUp: 4.0, headUp: 3.1,
  hipDown: 1.1, hipOut: 2.8, thigh: 8.6, shin: 8.3, upper: 7.6, fore: 7.4, turn: 36 * DEG,
};
/** Standing easy, in screen terms: hands and feet are where they should end up, y negative is up. */
export const STAND = { lean: 0, crouch: 0, yaw: 0, fx: -3, fy: -15, bx: 5, by: -15, ffx: -2, ffy: -4, fbx: 3, fby: -4 };

// ---- solving a pose: from where the hands and feet should be, to every joint
function ik(a, target, L1, L2, pole) {
  let to = sub(target, a), d = len(to);
  const reach = L1 + L2 - 0.02;
  if (d > reach) { to = mul(to, reach / d); d = reach; }
  const u = unit(to), along = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - along * along));
  let v = sub(pole, mul(u, dot(pole, u)));
  v = len(v) < 1e-4 ? unit(cross(u, [0, 0, 1])) : unit(v);
  return { joint: add(a, add(mul(u, along), mul(v, h))), end: add(a, to), u, v };
}
function frame(t, R) {
  return { t, R };
}
// a frame along a bone: its local x runs down the bone
function boneFrame(a, b, pole) {
  const x = unit(sub(b, a));
  let y = sub(pole, mul(x, dot(pole, x)));
  y = len(y) < 1e-4 ? unit(cross(x, [0, 0, 1])) : unit(y);
  const z = cross(x, y);
  return frame(a, [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]]);
}
const weaponOf = (name) => WEAPONS[name];

function solve(pose) {
  const q = { ...STAND, ...pose }, lean = q.lean, W = q.weapon && weaponOf(q.weapon), OW = q.offWeapon && weaponOf(q.offWeapon);
  const sa = q.sa ?? 0, wl = q.wl ?? 1, axisZ = Math.sqrt(Math.max(0, 1 - wl * wl)) * (q.wz ?? 1);
  const axis = [Math.cos(sa) * wl, -Math.sin(sa) * wl, axisZ], side = [-Math.sin(sa), -Math.cos(sa), 0];
  const two = !!(q.two && W), nearZ = q.fz ?? (two ? 3 : 4.5);
  // how the chest is turned follows the hands: a hand driving forward brings its shoulder round; one drawn back opens him up
  const fwd = (q.fx - STAND.fx) / 24, farFwd = two ? 0 : (q.bx - STAND.bx) / 22;
  let turn = M.turn + (fwd >= 0 ? -44 * DEG * Math.min(1, fwd) : 28 * DEG * Math.min(1, -fwd * 1.8));
  turn += (farFwd > 0 ? 34 * DEG * Math.min(1, farFwd) : 0) + (q.twist ?? 0) * 4 * DEG;
  if (q.turn !== undefined) turn = q.turn;
  const hipTurn = M.turn + (turn - M.turn) * 0.45, tilt = Math.atan2(lean, 13);
  const Rp = mm(rotZ(-tilt * 0.25), rotY(-hipTurn)), Rc = mm(rotZ(-tilt), rotY(-turn));
  // feet first: the pelvis sinks if that's what it takes for both legs to reach them
  const ankleN = [q.ffx, -q.ffy - 1.8, q.fzz ?? 2.4], ankleF = [q.fbx, -q.fby - 1.8, q.bzz ?? -2.4];
  let pelvis = [lean * 0.2, M.pelvis - q.crouch, 0];
  const hipAt = (s) => add(pelvis, mv(Rp, [0, -M.hipDown, s * M.hipOut]));
  const maxLeg = (M.thigh + M.shin) * 0.995;
  for (const [s, a] of [[1, ankleN], [-1, ankleF]]) {
    const h = hipAt(s), dx = h[0] - a[0], dz = h[2] - a[2], flat = dx * dx + dz * dz;
    if (flat < maxLeg * maxLeg) {
      const top = a[1] + Math.sqrt(maxLeg * maxLeg - flat);
      if (h[1] > top) pelvis = [pelvis[0], pelvis[1] - (h[1] - top), pelvis[2]];
    }
  }
  const waist = add(pelvis, [Math.sin(tilt * 0.45) * M.spine1, Math.cos(tilt * 0.45) * M.spine1, 0]);
  const chest = add(waist, [Math.sin(tilt) * M.spine2, Math.cos(tilt) * M.spine2, 0]);
  const neck = add(chest, mv(Rc, [0, M.neckUp, 0]));
  // the head keeps looking where he's going: it takes only part of the lean and part of the turn
  const headTurn = M.turn * 0.9 + (turn - M.turn) * 0.35, nod = tilt * 0.35 + (q.hy ?? 0) * 7 * DEG, roll = (q.hx ?? 0) * 7 * DEG;
  const Rh = mm(rotZ(-nod - roll), rotY(-headTurn));
  const head = add(neck, mv(Rh, [0.15, M.headUp, 0]));
  // the arms: shoulders reach a little towards a far hand
  const pick = (s, target) => {
    const base = add(chest, mv(Rc, [0, M.shoulderUp, s * M.shoulderOut])), to = sub(target, base), d = len(to);
    return add(base, mul(unit(to), Math.min(1.8, Math.max(0, d - 11) * 0.35)));
  };
  const nearT = [q.fx, -q.fy, nearZ];
  const farT = two ? [q.fx + axis[0] * W.two, -q.fy + axis[1] * W.two, nearZ + axis[2] * W.two] : [q.bx, -q.by, q.bz ?? (q.armsFront ? 5.5 : -4.5)];
  const sN = pick(1, nearT), sF = pick(-1, farT);
  const pole = (s, T, shoulder, hold) => {
    // elbows hang down and back; overhead they go out and forward
    const up = clamp01((T[1] - shoulder[1] + 2) / 10);
    const base = [-0.55 + up * 1.1, -1 + up * 0.9, s * (0.45 + up * 0.5)];
    if (!hold) return base;
    // holding something, the forearm wants to meet the handle side on: try round the circle, keep the best
    const u = unit(sub(T, shoulder));
    let best = base, score = Infinity;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2, x = unit(cross(u, [0.3, 1, 0.2])), y = cross(u, x), v = add(mul(x, Math.cos(a)), mul(y, Math.sin(a)));
      const A = ik(shoulder, T, M.upper, M.fore, v), f = unit(sub(A.end, A.joint));
      const cost = Math.abs(dot(f, hold)) * 0.7 + (1 - dot(unit(base), v)) * 0.55;
      if (cost < score) { score = cost; best = v; }
    }
    return best;
  };
  const holdN = W ? (W.across ? side : axis) : null, holdF = two ? (W.across ? side : axis) : OW ? [Math.cos(q.sb ?? Math.PI), -Math.sin(q.sb ?? Math.PI), 0] : null;
  const armN = ik(sN, nearT, M.upper, M.fore, pole(1, nearT, sN, holdN)), armF = ik(sF, farT, M.upper, M.fore, pole(-1, farT, sF, holdF));
  // the legs: knees forward, a little out
  const kneePole = (s) => mv(Rp, [1, 0, s * 0.35]);
  const hipN = hipAt(1), hipF = hipAt(-1);
  const legN = ik(hipN, ankleN, M.thigh, M.shin, kneePole(1)), legF = ik(hipF, ankleF, M.thigh, M.shin, kneePole(-1));
  const footDir = (s) => { const t = hipTurn * 0.6 + s * 8 * DEG; return [Math.cos(t), 0, Math.sin(t)]; };
  const B = {
    pelvis: frame(pelvis, Rp), waist: frame(waist, mm(rotZ(-tilt * 0.6), rotY(-(turn + hipTurn) / 2))), chest: frame(chest, Rc), head: frame(head, Rh), neck: frame(neck, Rh),
    upperN: boneFrame(sN, armN.joint, armN.v), foreN: boneFrame(armN.joint, armN.end, armN.v), upperF: boneFrame(sF, armF.joint, armF.v), foreF: boneFrame(armF.joint, armF.end, armF.v),
    thighN: boneFrame(hipN, legN.joint, legN.v), shinN: boneFrame(legN.joint, legN.end, legN.v), thighF: boneFrame(hipF, legF.joint, legF.v), shinF: boneFrame(legF.joint, legF.end, legF.v),
  };
  B.footN = frame(legN.end, mm(rotY(-Math.atan2(footDir(1)[2], footDir(1)[0])), rotZ(q.toeF ? -55 * DEG : 0)));
  B.footF = frame(legF.end, mm(rotY(-Math.atan2(footDir(-1)[2], footDir(-1)[0])), rotZ(q.toeB ? -55 * DEG : 0)));
  return { B, W, OW, q, axis, side, armN, armF, legN, legF, sN, sF, hipN, hipF, turn };
}

// ---- drawing: every part goes through one depth buffer
const BW = 300, BH = 240, OX = 150, OY = 180; // the scratch grid, big enough for a raised scythe; feet at (OX, OY)
const Zb = new Float32Array(BW * BH), Tone = new Float32Array(BW * BH), Part = new Int8Array(BW * BH), Mat = new Int8Array(BW * BH), Fr = new Int8Array(BW * BH), LX = new Float32Array(BW * BH), LY = new Float32Array(BW * BH), Col = new Uint32Array(BW * BH);
const touched = [];
const LIGHT = unit([-0.55, 0.72, 0.5]);
let clipBody = false, clipWeapon = false, curFrameIndex = 0, curDim = 0, onlyPart = 0, renderScale = 1;
const FRAME_IDS = ["pelvis", "waist", "chest", "head", "neck", "upperN", "foreN", "upperF", "foreF", "thighN", "shinN", "thighF", "shinF", "footN", "footF"];
const EMPTY_THEME = {};
let ACTIVE_THEME = EMPTY_THEME;
let COLLECT_GLOWS = null;

function sc3(v) {
  return renderScale === 1 ? v : [v[0] * renderScale, v[1] * renderScale, v[2] * renderScale];
}

function plot(i, z, tone, part, mat, wx, wy, color) {
  if (onlyPart && part !== onlyPart) return;
  if (i < 0 || i >= BW * BH) return;
  if (Part[i] === 0) touched.push(i);
  else if (z <= Zb[i]) return;
  Zb[i] = z;
  Tone[i] = tone;
  Part[i] = part;
  Mat[i] = mat;
  Fr[i] = curFrameIndex;
  LX[i] = wx;
  LY[i] = wy;
  Col[i] = color;
}
function sphere(cRaw, rRaw, part, mat, colOverride = 0) {
  const c = sc3(cRaw), r = Math.max(0.65, rRaw * renderScale);
  const x0 = Math.floor(c[0] - r), x1 = Math.ceil(c[0] + r), y0 = Math.floor(c[1] - r), y1 = Math.ceil(c[1] + r);
  const minCut = 1.5 * renderScale;
  for (let wy = y0; wy <= y1; wy++)
    for (let wx = x0; wx <= x1; wx++) {
      const dx = wx - c[0], dy = wy - c[1], d2 = dx * dx + dy * dy;
      if (d2 > r * r || (clipBody && wy < minCut)) continue;
      const dz = Math.sqrt(r * r - d2), n = [dx / r, dy / r, dz / r], i = (OY - wy) * BW + (OX + wx);
      plot(i, c[2] + dz, dot(n, LIGHT), part, mat, wx, wy, colOverride);
    }
}
function sweep(a, b, ra, rb, part, mat, bulge = 0, colOverride = 0) {
  const stepDist = len(sub(sc3(b), sc3(a)));
  const n = Math.max(2, Math.ceil(stepDist / 0.35));
  for (let k = 0; k <= n; k++) {
    const u = k / n;
    sphere(add(a, mul(sub(b, a), u)), ra + (rb - ra) * u + bulge * Math.sin(u * Math.PI), part, mat, colOverride);
  }
}
// an ellipsoid with radii r along the axes of frame R, seen along z
function ellipsoid(cRaw, R, rRaw, part, mat, colOverride = 0) {
  const c = sc3(cRaw);
  const r = renderScale === 1
    ? rRaw
    : [Math.max(0.7, rRaw[0] * renderScale), Math.max(0.7, rRaw[1] * renderScale), Math.max(0.7, rRaw[2] * renderScale)];
  const big = Math.max(r[0], r[1], r[2]), x0 = Math.floor(c[0] - big), x1 = Math.ceil(c[0] + big), y0 = Math.floor(c[1] - big), y1 = Math.ceil(c[1] + big);
  const Rt = [R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]], D = [1 / (r[0] * r[0]), 1 / (r[1] * r[1]), 1 / (r[2] * r[2])];
  // A = R diag(D) R^T
  const A = new Array(9);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) A[i * 3 + j] = R[i * 3] * D[0] * R[j * 3] + R[i * 3 + 1] * D[1] * R[j * 3 + 1] + R[i * 3 + 2] * D[2] * R[j * 3 + 2];
  void Rt;
  const minCut = 1.5 * renderScale;
  for (let wy = y0; wy <= y1; wy++)
    for (let wx = x0; wx <= x1; wx++) {
      if (clipBody && wy < minCut) continue;
      const dx = wx - c[0], dy = wy - c[1];
      const qa = A[8], qb = 2 * (A[2] * dx + A[5] * dy), qc = A[0] * dx * dx + 2 * A[1] * dx * dy + A[4] * dy * dy - 1, disc = qb * qb - 4 * qa * qc;
      if (disc < 0) continue;
      const dz = (-qb + Math.sqrt(disc)) / (2 * qa);
      const n = unit([A[0] * dx + A[1] * dy + A[2] * dz, A[3] * dx + A[4] * dy + A[5] * dz, A[6] * dx + A[7] * dy + A[8] * dz]);
      plot((OY - wy) * BW + (OX + wx), c[2] + dz, dot(n, LIGHT), part, mat, wx, wy, colOverride);
    }
}
// parts: each has its own number, so edges between them can be seen
const PART = { pelvis: 1, waist: 2, chest: 3, neck: 4, head: 5, face: 6, upperN: 7, elbowN: 8, foreN: 9, handN: 10, upperF: 11, elbowF: 12, foreF: 13, handF: 14, thighN: 15, kneeN: 16, shinN: 17, footN: 18, thighF: 19, kneeF: 20, shinF: 21, footF: 22, weapon: 23, offWeapon: 24, helmet: 25, hair: 26, cloak: 27, pack: 28, shield: 29 };
const useFrame = (name) => { curFrameIndex = FRAME_IDS.indexOf(name); };

function drawBody(S) {
  const { B, armN, armF, legN, legF, sN, sF, hipN, hipF, turn } = S, F_ = (name) => B[name];
  const bareHands = !!ACTIVE_THEME.bareHands;
  const bareHead = !ACTIVE_THEME.headgear || ACTIVE_THEME.headgear === "hair";
  const bootWidth =
    ACTIVE_THEME.bootsShape === "greaves" ? 2.0 : ACTIVE_THEME.bootsShape === "void_step" ? 1.5 : 1.7;
  const bootHeight =
    ACTIVE_THEME.bootsShape === "greaves" ? 1.5
      : ACTIVE_THEME.bootsShape === "treads" ? 1.55
        : ACTIVE_THEME.bootsShape === "void_step" || ACTIVE_THEME.bootsShape === "strider" ? 1.0
          : 1.25;
  useFrame("pelvis");
  ellipsoid(add(F_("pelvis").t, mv(F_("pelvis").R, [0, -0.2, 0])), F_("pelvis").R, [2.9, 2.6, 4.2], PART.pelvis, 1);
  useFrame("waist");
  sweep(F_("pelvis").t, F_("chest").t, 3, 3.3, PART.waist, 1);
  useFrame("chest");
  ellipsoid(add(F_("chest").t, mv(F_("chest").R, [0.2, 0.9, 0])), F_("chest").R, [3.4, 4.2, 5.5], PART.chest, 0);
  useFrame("neck");
  sweep(F_("neck").t, add(F_("neck").t, mv(F_("head").R, [0, 1.6, 0])), 1.25, 1.15, PART.neck, 4);
  useFrame("head");
  ellipsoid(F_("head").t, F_("head").R, [3, 3.3, 2.8], PART.head, bareHead ? 4 : 3);
  ellipsoid(add(F_("head").t, mv(F_("head").R, [0.85, -0.45, 0])), F_("head").R, [2.4, 2.7, 2.35], PART.face, 4);
  const arm = (far, A, sh, up, el, fo, ha, nameU, nameF) => {
    curDim = far ? 1 : 0;
    useFrame(nameU);
    sphere(sh, 2.5, up, 0);
    sweep(sh, A.joint, 2.1, 1.6, up, 0);
    sphere(A.joint, 1.45, el, 1);
    useFrame(nameF);
    sweep(A.joint, A.end, 1.6, 1.2, fo, 0, 0.15);
    sphere(A.end, 1.9, ha, bareHands ? 4 : 1);
    curDim = 0;
  };
  arm(false, armN, sN, PART.upperN, PART.elbowN, PART.foreN, PART.handN, "upperN", "foreN");
  arm(true, armF, sF, PART.upperF, PART.elbowF, PART.foreF, PART.handF, "upperF", "foreF");
  const leg = (far, L, hip, th, kn, sh, fo, nameT, nameS, nameFt) => {
    useFrame(nameT);
    sweep(hip, L.joint, 3.2, 2.2, th, 1);
    sphere(L.joint, 1.9, kn, 1);
    useFrame(nameS);
    sweep(L.joint, L.end, 2.15, 1.4, sh, 5, 0.4);
    useFrame(nameFt);
    const R = F_(nameFt).R, a = F_(nameFt).t;
    sweep(add(a, mv(R, [-1.5, -0.6, 0])), add(a, mv(R, [4.6, -1.1, 0])), bootWidth, bootHeight, fo, 5);
  };
  leg(false, legN, hipN, PART.thighN, PART.kneeN, PART.shinN, PART.footN, "thighN", "shinN", "footN");
  leg(true, legF, hipF, PART.thighF, PART.kneeF, PART.shinF, PART.footF, "thighF", "shinF", "footF");
  void turn;
}

// ---- what they hold: drawn along the handle from the fist, through the same depth buffer
function along(H, axis, side, part) {
  const n = cross(axis, side);
  const T = (i, k, c, lift = 0) => {
    const x = (H[0] + axis[0] * i + side[0] * k + n[0] * lift) * renderScale;
    const y = (H[1] + axis[1] * i + side[1] * k + n[1] * lift) * renderScale;
    const z = (H[2] + axis[2] * i + side[2] * k + n[2] * lift) * renderScale;
    const wx = Math.round(x), wy = Math.round(y);
    if (clipWeapon && wy < 0) return;
    const idx = (OY - wy) * BW + (OX + wx);
    if (idx < 0 || idx >= BW * BH) return;
    curFrameIndex = -1;
    plot(idx, z + 0.05, 2, part, 2, wx, wy, c);
  };
  T.at = (i, k) => [H[0] + axis[0] * i + side[0] * k, H[1] + axis[1] * i + side[1] * k, H[2] + axis[2] * i + side[2] * k];
  return T;
}
const STEEL = Object.fromEntries(Object.entries({ hi: "#ffffff", a: "#e8edf6", b: "#a4afc6", d: "#68748f", gold: "#ffd84a", goldD: "#b8862a", grip: "#7a3a2a", gripD: "#4a2018", wood: "#8a5a32", woodD: "#5a3820", dark: "#3a3448", darkD: "#262033", olive: "#58663f", oliveA: "#7d8c58", oliveD: "#3a4529" }).map(([k, v]) => [k, hex(v) >>> 0]));
let WCOL = STEEL;
function blade(T, from, length, w) {
  for (let i = from; i <= from + length + 0.01; i += 0.35) {
    const r = i - from, wd = r > length - 5 ? Math.max(0, ((length - r) / 5) * w) : w;
    for (let k = -wd; k <= wd + 0.01; k += 0.35) T(i, k, k < -w * 0.4 ? WCOL.hi : k > w * 0.4 ? WCOL.d : WCOL.a);
  }
}
const haft = (T, from, to, a, d, r = 0.8) => {
  for (let i = from; i <= to; i += 0.35) for (let k = -r; k <= r + 0.01; k += 0.35) T(i, k, k > 0.1 ? d : a);
};
export const WEAPONS = {
  // the fist is at i = 0; `two` is where the other hand goes; `across`: the handle lies across the weapon's length
  sword: { two: -4.4, draw(T, q) {
    const end = q.two ? -6.5 : -2.6;
    haft(T, end, 2.2, WCOL.grip, WCOL.gripD);
    for (let k = -1.4; k <= 1.4; k += 0.35) T(end - 0.4, k, WCOL.gold);
    for (let k = -4.6; k <= 4.6; k += 0.35) (T(2.6, k, Math.abs(k) > 3.8 ? WCOL.goldD : WCOL.gold), T(3, k, WCOL.goldD));
    blade(T, 3.2, 25, 2.2);
  } },
  greatsword: { two: -4.8, draw(T) {
    haft(T, -7.2, 2.2, WCOL.grip, WCOL.gripD);
    for (let k = -1.8; k <= 1.8; k += 0.35) T(-7.6, k, WCOL.gold);
    for (let k = -6.6; k <= 6.6; k += 0.35) (T(2.6, k, Math.abs(k) > 5.6 ? WCOL.goldD : WCOL.gold), T(3, k, WCOL.goldD));
    blade(T, 3.2, 31, 3);
    for (let i = 4; i <= 28; i += 0.35) T(i, 0, WCOL.b);
  } },
  staff: { two: -7.5, draw(T) {
    haft(T, -12, 22, WCOL.wood, WCOL.woodD, 0.72);
    for (let k = -2.8; k <= 2.8; k += 0.35) T(22.2, k, WCOL.gold);
    for (let i = 22.8; i <= 29; i += 0.35) {
      const spread = (i - 22.5) * 0.48;
      T(i, -spread, WCOL.gold);
      T(i, spread, WCOL.goldD);
    }
    const orbCenter = T.at(26.2, 0);
    sphere(orbCenter, 2.7, PART.weapon, 2, WCOL.a);
    sphere([orbCenter[0] - 0.6, orbCenter[1] + 0.6, orbCenter[2] + 0.5], 1.2, PART.weapon, 2, WCOL.hi);
    if (COLLECT_GLOWS) {
      COLLECT_GLOWS.push({ x: orbCenter[0] * renderScale, y: -orbCenter[1] * renderScale, color: WCOL.a, radius: 7 * renderScale });
    }
  } },
  dagger: { draw(T) {
    haft(T, -2.4, 1.8, WCOL.grip, WCOL.gripD);
    for (let k = -2.6; k <= 2.6; k += 0.35) T(2.2, k, WCOL.goldD);
    blade(T, 2.6, 10, 1.3);
  } },
  spear: { two: -12, draw(T) {
    haft(T, -18, 36, WCOL.wood, WCOL.woodD, 0.5);
    blade(T, 36, 11, 2);
    for (let k = -2.4; k <= 2.4; k += 0.35) T(36, k, WCOL.goldD);
  } },
  hammer: { two: -7, draw(T) {
    for (const lift of [-0.8, 0, 0.8]) for (let i = -10; i <= 18; i += 0.35) for (let k = -0.8; k <= 0.81; k += 0.35) T(i, k, k > 0.1 ? WCOL.woodD : WCOL.wood, lift);
    // the head is a block: its two faces, and the steel between them
    for (let i = 18; i <= 28; i += 0.35) for (let k = -9; k <= 9; k += 0.35) {
      const face = Math.abs(k) > 7.4 ? (k < 0 ? WCOL.a : WCOL.d) : i < 20 ? WCOL.hi : i > 26.4 ? WCOL.d : Math.abs(k) < 2 ? WCOL.gold : WCOL.b;
      T(i, k, face, 4.5);
      T(i, k, face, -4.5);
      if (i < 18.4 || i > 27.6 || Math.abs(k) > 8.6) for (let l = -4; l <= 4; l += 0.35) T(i, k, k < 0 ? WCOL.a : i > 27.6 ? WCOL.d : WCOL.b, l);
    }
  } },
  scythe: { two: -11, draw(T) {
    haft(T, -16, 31, WCOL.dark, WCOL.darkD, 0.5);
    for (let j = 0; j <= 28; j += 0.35) {
      const u = j / 28, w = 3.2 * (1 - u) + 0.3, b = 31.5 - u * u * 12;
      for (let k = -w; k <= w; k += 0.35) T(b + k, j + 0.8, k > w * 0.3 ? WCOL.hi : k < -w * 0.4 ? WCOL.d : WCOL.b);
    }
  } },
  claw: { draw(T) {
    for (const q0 of [-2.4, 0, 2.4])
      for (let i = 2; i <= 9.5; i += 0.35) {
        const u = (i - 2) / 7.5, k = q0 + u * u * 1.8;
        T(i, k, u > 0.55 ? WCOL.hi : WCOL.a);
        if (u < 0.6) T(i, k + 0.8, WCOL.d);
      }
  } },
  bow: { across: true, draw(T, q, off) {
    for (let u = -1; u <= 1.001; u += 0.025) {
      const k = u * 17, i = 6 * (1 - u * u) - 1;
      T(i, k, Math.abs(u) > 0.85 ? WCOL.goldD : WCOL.wood);
      T(i + 0.8, k, WCOL.woodD);
    }
    const tipA = T.at(-1, -17), tipB = T.at(-1, 17), mid = q.pull ? off : T.at(-1, 0);
    const line = (A, B, c) => {
      const n = Math.max(2, Math.ceil(len(sub(B, A)) / 0.35)), Z = WCOL.a;
      for (let k = 0; k <= n; k++) {
        const P = add(A, mul(sub(B, A), k / n)), wx = Math.round(P[0] * renderScale), wy = Math.round(P[1] * renderScale), idx = (OY - wy) * BW + (OX + wx);
        curFrameIndex = -1;
        plot(idx, P[2] * renderScale + 0.05, 2, PART.weapon, 2, wx, wy, c ?? Z);
      }
    };
    line(tipA, mid);
    line(tipB, mid);
    if (q.nocked) {
      const nock = mid, tip = T.at(13, 0);
      line(nock, tip, WCOL.wood);
      for (let i = 9; i <= 13; i += 0.35) for (let k = -(13 - i) * 0.45; k <= (13 - i) * 0.45; k += 0.35) T(i, k, WCOL.hi);
    }
  } },
  pistol: { across: true, draw(T) {
    for (let i = -1; i <= 10.5; i += 0.35) for (let k = -4.2; k <= -2.1; k += 0.35) T(i, k, k < -3.5 ? WCOL.a : k > -2.7 ? WCOL.d : WCOL.b);
    for (let i = -1.2; i <= 1.4; i += 0.35) for (let k = -2.4; k <= 2.4; k += 0.35) T(i, k, WCOL.gripD);
    T(10, -4.6, WCOL.hi);
    if (COLLECT_GLOWS) {
      const tip = T.at(10.5, -3.2);
      COLLECT_GLOWS.push({ x: tip[0] * renderScale, y: -tip[1] * renderScale, color: WCOL.hi, radius: 5 * renderScale });
    }
  } },
  launcher: { two: -9, draw(T) {
    for (let i = -14; i <= 22; i += 0.35) for (let k = -6; k <= -1; k += 0.35) T(i, k, k < -4.8 ? WCOL.oliveA : k > -2.2 ? WCOL.oliveD : Math.abs(i - 3) < 1.4 ? WCOL.gold : WCOL.olive);
    for (let k = -6.8; k <= -0.2; k += 0.35) (T(22.4, k, WCOL.b), T(-14.4, k, WCOL.d));
    if (COLLECT_GLOWS) {
      const tip = T.at(22.4, -3.5);
      COLLECT_GLOWS.push({ x: tip[0] * renderScale, y: -tip[1] * renderScale, color: WCOL.gold, radius: 6 * renderScale });
    }
  } },
  handle: { draw(T) {
    haft(T, -2.6, 6, WCOL.grip, WCOL.gripD);
    for (let k = -1.6; k <= 1.6; k += 0.35) (T(-3, k, WCOL.gold), T(6.4, k, WCOL.gold));
  } },
};

function drawExtras(S) {
  const th = ACTIVE_THEME;
  if (!th || th === EMPTY_THEME) return;
  const { B } = S;
  const H = B.head.t, HR = B.head.R, C = B.chest.t, CR = B.chest.R, P = B.pelvis.t;
  const atH = (v) => add(H, mv(HR, v));
  const atC = (v) => add(C, mv(CR, v));
  const addGlow = (worldPt, color, radius) => {
    if (COLLECT_GLOWS && color) {
      COLLECT_GLOWS.push({ x: worldPt[0] * renderScale, y: -worldPt[1] * renderScale, color, radius: radius * renderScale });
    }
  };

  // Back accessory (Cape / Scarf / Volt Pack) behind torso
  if (th.backAccessory === "cape") {
    const topL = atC([-2.6, 2.8, -2.5]), topR = atC([-2.4, 2.6, 2.2]);
    const botL = add(P, [-5.6, -4.8, -3.2]), botR = add(P, [-5.2, -5.0, 2.8]);
    for (let u = 0; u <= 1.001; u += 0.25) {
      const a = add(mul(topL, 1 - u), mul(topR, u));
      const b = add(mul(botL, 1 - u), mul(botR, u));
      sweep(a, b, 1.35, 2.0, PART.cloak, 6);
    }
  } else if (th.backAccessory === "scarf") {
    const neckBack = add(B.neck.t, mv(HR, [-2.2, 0.2, 0]));
    const tipA = add(neckBack, [-4.8, 1.2, -1.8]);
    const tipB = add(tipA, [-4.6, -2.1, -1.0]);
    sweep(neckBack, tipA, 1.7, 1.3, PART.cloak, 6);
    sweep(tipA, tipB, 1.3, 0.8, PART.cloak, 6);
  } else if (th.backAccessory === "volt_pack") {
    const pkTop = atC([-3.8, 3.0, -0.4]), pkBot = atC([-4.1, -2.2, -0.4]);
    sweep(pkTop, pkBot, 2.4, 2.5, PART.pack, 5);
    const coilTop = atC([-4.2, 6.2, -0.8]);
    sweep(pkTop, coilTop, 0.75, 0.65, PART.pack, 2, 0, th.eye || WCOL.gold);
    addGlow(coilTop, th.eye || WCOL.gold, 5);
  } else if (th.backAccessory === "prism_wings") {
    for (const sgn of [-1, 1]) {
      const root = atC([-2.6, 2.4, sgn * 2.0]);
      const mid = atC([-8.2, 6.8, sgn * 5.6]);
      const tip1 = atC([-12.5, 9.2, sgn * 7.2]);
      const tip2 = atC([-11.2, 2.6, sgn * 6.0]);
      const tip3 = atC([-9.0, -2.6, sgn * 4.4]);
      sweep(root, mid, 1.35, 1.1, PART.cloak, 6);
      sweep(mid, tip1, 1.15, 0.55, PART.cloak, 2, 0, th.mark || WCOL.hi);
      sweep(mid, tip2, 1.2, 0.6, PART.cloak, 6);
      sweep(root, tip3, 1.1, 0.55, PART.cloak, 6);
      addGlow(tip1, th.mark || WCOL.hi, 6);
    }
  } else if (th.backAccessory === "warden_roots") {
    for (const sgn of [-1, 1]) {
      const sh = atC([0.2, 3.2, sgn * 5.6]);
      ellipsoid(sh, CR, [2.4, 2.2, 2.2], PART.cloak, 6);
      const vineMid = atC([-3.2, 5.4, sgn * 4.5]);
      const vineTip = atC([-4.8, 8.6, sgn * 2.2]);
      sweep(sh, vineMid, 1.25, 0.9, PART.cloak, 6);
      sweep(vineMid, vineTip, 0.95, 0.55, PART.cloak, 2, 0, th.eye || WCOL.gold);
      addGlow(vineTip, th.eye || WCOL.gold, 4.5);
    }
    const heart = atC([-3.8, 1.8, 0]);
    sphere(heart, 2.0, PART.pack, 2, th.mark || WCOL.gold);
  } else if (th.backAccessory === "amber_thrusters") {
    const topL = atC([-2.5, 2.6, -2.4]), topR = atC([-2.4, 2.5, 2.2]);
    const botL = add(P, [-5.4, -4.4, -3.0]), botR = add(P, [-5.0, -4.6, 2.6]);
    for (let u = 0; u <= 1.001; u += 0.33) {
      sweep(add(mul(topL, 1 - u), mul(topR, u)), add(mul(botL, 1 - u), mul(botR, u)), 1.3, 1.8, PART.cloak, 6);
    }
    for (const sgn of [-1, 1]) {
      const vent = atC([-3.8, 3.8, sgn * 4.0]);
      const flame = atC([-6.4, 5.6, sgn * 4.6]);
      sweep(atC([-2.2, 2.4, sgn * 3.4]), vent, 1.5, 1.2, PART.pack, 5);
      sweep(vent, flame, 0.9, 0.45, PART.pack, 2, 0, WCOL.gold);
      addGlow(flame, WCOL.gold, 5);
    }
  }

  // Armor silhouettes build on the selected class rig without replacing its pose.
  if (th.armorShape === "plate" || th.armorShape === "aegis") {
    for (const side of [-1, 1]) {
      const shoulder = atC([0.1, 3.8, side * 3.0]);
      ellipsoid(shoulder, CR, [2.4, 1.55, 2.0], PART.chest, 0);
      if (th.armorShape === "aegis") {
        const rivet = atC([2.35, 4.0, side * 3.0]);
        sphere(rivet, 0.65, PART.chest, 2, th.armorAccent || th.mark || WCOL.gold);
      }
    }
    if (th.armorShape === "aegis") {
      const crest = atC([3.25, 1.6, 0]);
      ellipsoid(crest, CR, [0.55, 1.3, 1.05], PART.chest, 2, th.armorAccent || th.mark);
      addGlow(crest, th.armorAccent || th.mark || WCOL.gold, 3.5);
    }
  }

  // Headgear / Bare Hair + Class Face Accent
  const hg = th.headgear || "hair";
  if (hg === "hair") {
    ellipsoid(atH([-0.7, 1.4, -0.3]), HR, [2.9, 2.2, 2.9], PART.hair, 7);
    sphere(atH([1.6, 2.2, 0.8]), 1.3, PART.hair, 7);
    sphere(atH([-2.2, 0.4, -0.4]), 1.5, PART.hair, 7);
  } else if (hg === "plume_helm") {
    ellipsoid(atH([-0.2, 0.8, 0]), HR, [3.35, 3.3, 3.1], PART.helmet, 3);
    // Cheek guards & T-crest
    ellipsoid(atH([0.6, 3.1, 0]), HR, [2.2, 1.1, 0.9], PART.helmet, 6);
    sweep(atH([-0.5, 4.1, 0]), atH([-4.4, 2.8, -0.4]), 1.4, 0.8, PART.helmet, 6);
  } else if (hg === "wizard_hat") {
    ellipsoid(atH([-0.1, 2.0, 0]), HR, [5.1, 0.9, 5.1], PART.helmet, 3);
    sweep(atH([0, 2.2, 0]), atH([-2.6, 8.2, -0.4]), 3.0, 0.6, PART.helmet, 3);
    ellipsoid(atH([-0.2, 2.8, 0]), HR, [2.7, 0.75, 2.7], PART.helmet, 6);
  } else if (hg === "assassin_hood") {
    ellipsoid(atH([-0.4, 0.7, 0]), HR, [3.4, 3.5, 3.1], PART.helmet, 3);
    sweep(atH([-2.0, 2.0, 0]), atH([-4.8, 0.8, 0]), 1.6, 0.6, PART.helmet, 3);
    // Lower face scarf mask
    ellipsoid(atH([1.2, -1.6, 0]), HR, [2.2, 1.5, 2.2], PART.helmet, 6);
  } else if (hg === "tinker_goggles") {
    ellipsoid(atH([-0.6, 1.3, -0.2]), HR, [3.0, 2.3, 2.9], PART.hair, 7);
    ellipsoid(atH([0.2, 1.4, 0]), HR, [3.2, 0.95, 3.0], PART.helmet, 3);
    const gL = atH([2.5, 1.3, 1.1]), gR = atH([2.5, 1.3, -1.0]);
    sphere(gL, 1.05, PART.helmet, 2, th.eye || WCOL.gold);
    sphere(gR, 1.05, PART.helmet, 2, th.eye || WCOL.gold);
    sweep(atH([-1.4, 2.4, -2.0]), atH([-2.2, 5.4, -2.2]), 0.45, 0.45, PART.helmet, 6);
    addGlow(gL, th.eye || WCOL.gold, 4);
  } else if (hg === "halo_crown") {
    ellipsoid(atH([-0.5, 1.2, 0]), HR, [3.1, 2.4, 2.9], PART.hair, 7);
    const haloPos = atH([-0.4, 5.2, 0]);
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      const pt = [haloPos[0] + Math.cos(a) * 3.0, haloPos[1], haloPos[2] + Math.sin(a) * 2.4];
      sphere(pt, 0.75, PART.helmet, 2, th.mark || WCOL.gold);
    }
    addGlow(haloPos, th.mark || WCOL.gold, 7);
  } else if (hg === "gear_hood") {
    ellipsoid(atH([-0.2, 0.8, 0]), HR, [3.7, 3.5, 3.3], PART.helmet, 3);
    sweep(atH([-1.8, 2.0, -2.0]), atH([-2.7, -1.5, -2.2]), 1.15, 0.9, PART.helmet, 3);
    sweep(atH([-1.8, 2.0, 2.0]), atH([-2.7, -1.5, 2.2]), 1.15, 0.9, PART.helmet, 3);
    ellipsoid(atH([1.8, -1.2, 0]), HR, [1.5, 0.55, 2.1], PART.helmet, 6);
  } else if (hg === "gear_visor") {
    ellipsoid(atH([-0.3, 0.8, 0]), HR, [3.45, 2.6, 3.2], PART.helmet, 3);
    const v1 = atH([2.8, 0.35, -1.9]), v2 = atH([2.8, 0.35, 1.9]);
    sweep(v1, v2, 0.65, 0.65, PART.helmet, 2, 0, th.helmetAccent || WCOL.gold);
    addGlow(atH([2.9, 0.35, 0]), th.helmetAccent || WCOL.gold, 3.5);
  } else if (hg === "gear_crest") {
    ellipsoid(atH([-0.2, 0.8, 0]), HR, [3.4, 3.0, 3.1], PART.helmet, 3);
    ellipsoid(atH([0.9, 2.8, 0]), HR, [1.9, 1.0, 1.15], PART.helmet, 6);
    sweep(atH([-0.1, 3.2, 0]), atH([-3.5, 6.2, 0]), 1.25, 0.45, PART.helmet, 6, 0, th.helmetAccent);
  } else if (hg === "gear_crown") {
    ellipsoid(atH([-0.5, 1.0, 0]), HR, [3.0, 2.4, 2.9], PART.hair, 7);
    sweep(atH([-0.1, 3.1, -2.2]), atH([-0.1, 3.1, 2.2]), 0.65, 0.65, PART.helmet, 2, 0, th.helmetAccent);
    for (const z of [-1.6, 0, 1.6]) {
      sweep(atH([-0.1, 3.2, z]), atH([-0.1, z === 0 ? 5.2 : 4.5, z]), 0.65, 0.45, PART.helmet, 2, 0, th.helmetAccent);
    }
  } else if (hg === "gear_halo") {
    ellipsoid(atH([-0.5, 1.0, 0]), HR, [3.0, 2.4, 2.9], PART.hair, 7);
    const haloPos = atH([-0.4, 5.0, 0]);
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      const pt = [haloPos[0] + Math.cos(a) * 3.1, haloPos[1], haloPos[2] + Math.sin(a) * 2.4];
      sphere(pt, 0.75, PART.helmet, 2, th.helmetAccent || WCOL.gold);
    }
    addGlow(haloPos, th.helmetAccent || WCOL.gold, 6);
  } else if (hg === "dragon_helm") {
    ellipsoid(atH([-0.2, 0.8, 0]), HR, [3.4, 3.35, 3.15], PART.helmet, 3);
    ellipsoid(atH([0.7, 3.3, 0]), HR, [2.4, 1.15, 0.85], PART.helmet, 6);
    for (const sgn of [-1, 1]) {
      const hBase = atH([0.3, 2.1, sgn * 2.2]);
      const hMid = atH([-2.2, 4.6, sgn * 3.5]);
      const hTip = atH([-5.0, 6.2, sgn * 4.0]);
      sweep(hBase, hMid, 1.25, 0.85, PART.helmet, 6);
      sweep(hMid, hTip, 0.85, 0.45, PART.helmet, 2, 0, th.eye || WCOL.hi);
    }
    addGlow(atH([2.4, 0.4, 0]), th.eye || WCOL.hi, 5);
  } else if (hg === "royal_crown") {
    ellipsoid(atH([-0.6, 1.2, 0]), HR, [3.0, 2.3, 2.9], PART.hair, 7);
    ellipsoid(atH([0.0, 2.6, 0]), HR, [3.2, 1.0, 3.1], PART.helmet, 3);
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      const base = atH([Math.cos(a) * 2.6, 3.0, Math.sin(a) * 2.5]);
      const tip = atH([Math.cos(a) * 2.9, k === 0 ? 5.8 : 4.8, Math.sin(a) * 2.7]);
      sweep(base, tip, 0.85, 0.4, PART.helmet, k === 0 ? 2 : 3, 0, k === 0 ? (th.mark || WCOL.gold) : 0);
    }
    const jewel = atH([2.8, 3.2, 0]);
    sphere(jewel, 0.95, PART.helmet, 2, th.mark || WCOL.hi);
    addGlow(jewel, th.mark || WCOL.hi, 5.5);
  } else if (hg === "antler_crest") {
    ellipsoid(atH([-0.4, 0.9, 0]), HR, [3.2, 3.0, 3.0], PART.helmet, 3);
    for (const sgn of [-1, 1]) {
      const a0 = atH([0.2, 2.8, sgn * 1.6]);
      const a1 = atH([-0.8, 5.2, sgn * 3.0]);
      const a2 = atH([-1.8, 6.8, sgn * 3.8]);
      const tine = atH([0.8, 6.2, sgn * 2.8]);
      sweep(a0, a1, 0.85, 0.65, PART.helmet, 6);
      sweep(a1, a2, 0.65, 0.4, PART.helmet, 6);
      sweep(a1, tine, 0.6, 0.4, PART.helmet, 2, 0, th.mark || WCOL.gold);
    }
  }

  // Eyes / Glowing Visor slit on face front
  if (mv(HR, [1, 0, 0])[2] > -0.25 && th.eye) {
    const e1 = atH([2.6, 0.0, 1.0]);
    const e2 = atH([2.7, 0.0, -0.7]);
    if (hg === "plume_helm" || hg === "gear_visor" || hg === "dragon_helm") {
      sweep(e1, e2, 0.7, 0.7, PART.helmet, 2, 0, th.eye);
    } else if (hg !== "tinker_goggles") {
      sphere(e1, 0.75, PART.face, 2, th.eye);
      sphere(e2, 0.75, PART.face, 2, th.eye);
    }
    addGlow(e1, th.eye, 3.5);
  }

  // Offhand Kite Shield (Prism Knight when armed)
  if (th.shielded) {
    const shPos = B.foreF.t;
    const shR = B.chest.R;
    ellipsoid(add(shPos, [1.2, 0.2, -1.2]), shR, [1.3, 4.3, 3.6], PART.shield, 8);
    sphere(add(shPos, [2.0, 0.3, -0.4]), 1.2, PART.shield, 2, th.mark || WCOL.hi);
  }
}

// ---- flat tones, seams, and one clean ink line
function finish(S, restFrames) {
  const th = ACTIVE_THEME || EMPTY_THEME;
  const inkCol = th.ink ?? INK;
  const seamCol = th.seam ?? SEAM;
  const markCol = th.mark ?? MARK;
  const mats = [
    th.shell || SHELL,
    th.core || CORE,
    null,
    th.head || th.shell || SHELL,
    th.face || th.head || SHELL,
    th.boots || th.shell || SHELL,
    th.cloak || th.core || CORE,
    th.hair || th.core || CORE,
    th.shield || th.head || SHELL,
  ];
  const dim = (part) => part >= PART.upperF && part <= PART.handF ? 1 : part >= PART.thighF && part <= PART.footF ? 1 : 0;
  const toneOf = (v, part) => {
    let t = v > 0.8 ? 0 : v > 0.42 ? 1 : v > 0.08 ? 2 : 3;
    t = Math.min(3, t + dim(part));
    return t;
  };
  const tones = new Map();
  for (const i of touched) tones.set(i, toneOf(Tone[i], Part[i]));
  // a lone pixel of a tone, with no neighbour like it on the same part, takes its neighbours' tone
  for (const i of touched) {
    if (Mat[i] === 2) continue;
    const t = tones.get(i), votes = [0, 0, 0, 0];
    let same = false;
    for (const d of [-1, 1, -BW, BW]) {
      const j = i + d;
      if (Part[j] !== Part[i] || !tones.has(j)) continue;
      const u = tones.get(j);
      votes[u]++;
      if (u === t) same = true;
    }
    if (!same && votes.some((v) => v > 0)) tones.set(i, votes.indexOf(Math.max(...votes)));
  }
  for (const i of touched) {
    if (Mat[i] === 2) continue;
    const rampArr = mats[Mat[i]] || mats[0];
    Col[i] = rampArr[tones.get(i)];
  }
  // where two parts meet: a soft seam if they touch, ink if one stands in front of the other
  const marks = new Map();
  for (const i of touched) {
    for (const d of [1, BW]) {
      const j = i + d;
      if (Part[j] === 0 || Part[j] === Part[i]) continue;
      const far = Zb[i] < Zb[j] ? i : j, dz = Math.abs(Zb[i] - Zb[j]), steel = Mat[i] === 2 || Mat[j] === 2;
      if (Mat[far] === 2 && dz < 1) continue;
      const ink = steel || dz > 2.0 * renderScale;
      if (ink) marks.set(far, inkCol);
      else if (!marks.has(far)) marks.set(far, seamCol);
    }
  }
  for (const [i, c] of marks) Col[i] = c;
  // the mark on his chest, when it's facing us
  const { B } = S, chestAt = sc3(add(B.chest.t, mv(B.chest.R, [3, 1.6, -1.8])));
  if (mv(B.chest.R, [1, 0, 0])[2] > 0.15) {
    const ci = (OY - Math.round(chestAt[1])) * BW + (OX + Math.round(chestAt[0]));
    if (Part[ci] === PART.chest) {
      Col[ci] = markCol;
      if (COLLECT_GLOWS) COLLECT_GLOWS.push({ x: chestAt[0], y: -chestAt[1], color: markCol, radius: 4 * renderScale });
    }
  }
  // the outline, and everything into a small list of pixels
  const list = touched.slice(), ring = new Map();
  for (const i of list) for (const d of [-1, 1, -BW, BW]) { const j = i + d; if (Part[j] === 0 && !ring.has(j)) ring.set(j, i); }
  const n = list.length + ring.size, out = { n, xs: new Int16Array(n), ys: new Int16Array(n), color: new Uint32Array(n), src: new Int16Array(n), ink: new Uint8Array(n), x0: 0, y0: 0, x1: 0, y1: 0, glows: COLLECT_GLOWS || [] };
  const invScale = renderScale === 1 ? 1 : 1 / renderScale;
  const srcFor = (i) => {
    const f = Fr[i];
    if (f < 0 || !restFrames) return -1;
    const name = FRAME_IDS[f], A = B[name], R0 = restFrames[name], wx = ((i % BW) - OX) * invScale, wy = (OY - ((i / BW) | 0)) * invScale, P = [wx, wy, Zb[i] * invScale];
    const lp = tv(A.R, sub(P, A.t)), rp = add(R0.t, mv(R0.R, lp)), c = Math.round(rp[0]) + 12, r = 38 - Math.round(rp[1]);
    return c < 0 || r < 0 || c >= W0 || r >= H0 ? -1 : r * W0 + c;
  };
  let k = 0, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  const push = (i, c, s, isInk) => {
    const x = (i % BW) - OX, y = ((i / BW) | 0) - OY;
    out.xs[k] = x; out.ys[k] = y; out.color[k] = c; out.src[k] = s; out.ink[k] = isInk ? 1 : 0;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    k++;
  };
  for (const i of list) push(i, Col[i], srcFor(i), Col[i] === inkCol);
  for (const [j, i] of ring) push(j, inkCol, srcFor(i), true);
  let zs = 0;
  for (const i of list) zs += Zb[i];
  Object.assign(out, { x0, y0, x1, y1, z: list.length ? zs / list.length : 0 });
  for (const i of list) Part[i] = 0;
  touched.length = 0;
  return out;
}

const turnAll = (S, a) => {
  // the whole figure turned about the vertical through the feet
  const R = rotY(-a), P = (v) => mv(R, v);
  for (const f of Object.values(S.B)) { f.t = P(f.t); f.R = mm(R, f.R); }
  for (const A of [S.armN, S.armF, S.legN, S.legF]) { A.joint = P(A.joint); A.end = P(A.end); }
  S.sN = P(S.sN); S.sF = P(S.sF); S.hipN = P(S.hipN); S.hipF = P(S.hipF);
  S.axis = P(S.axis); S.side = P(S.side);
};
let REST_FRAMES = null;
function render(pose, theme = EMPTY_THEME, scale = 1) {
  ACTIVE_THEME = theme || EMPTY_THEME;
  WCOL = ACTIVE_THEME.weaponColors ? { ...STEEL, ...ACTIVE_THEME.weaponColors } : STEEL;
  renderScale = scale || 1;
  COLLECT_GLOWS = theme && theme !== EMPTY_THEME ? [] : null;
  try {
    const S = solve(pose), q = S.q, whole = (q.yaw ?? 0) + (q.face === -1 ? Math.PI : 0);
    if (whole) turnAll(S, whole);
    const air = (q.y ?? 0) < -0.5;
    clipBody = !air;
    clipWeapon = !air;
    drawBody(S);
    if (ACTIVE_THEME !== EMPTY_THEME) drawExtras(S);
    clipBody = false;
    if (S.W) S.W.draw(along(S.armN.end, S.axis, S.side, PART.weapon), q, S.armF.end);
    if (S.OW) {
      const sb = q.sb ?? Math.PI;
      let ax = [Math.cos(sb), -Math.sin(sb), 0], sd = [-Math.sin(sb), -Math.cos(sb), 0];
      if (whole) { const R = rotY(-whole); ax = mv(R, ax); sd = mv(R, sd); }
      S.OW.draw(along(S.armF.end, ax, sd, PART.offWeapon), q, S.armF.end);
    }
    clipWeapon = false;
    return finish(S, REST_FRAMES);
  } finally {
    ACTIVE_THEME = EMPTY_THEME;
    WCOL = STEEL;
    renderScale = 1;
    COLLECT_GLOWS = null;
  }
}
REST_FRAMES = solve({}).B;

export function posedStyled(pose, theme = {}, scale = 1) {
  return render(pose, theme, scale);
}

const CACHE = new Map();
const keyOf = (p) => {
  let s = (p.y ?? 0) < -0.5 ? "air," : "";
  for (const k of Object.keys(p).sort()) {
    const v = p[k];
    if (v === undefined || k === "x" || k === "y" || k === "ghost") continue;
    s += k + (typeof v === "number" ? (k === "sa" || k === "sb" || k === "wl" || k === "yaw" || k === "turn" ? Math.round(v * 20) : Math.round(v)) : v) + ",";
  }
  return s;
};
/** How far short of where the pose wants them the hands fall, in px: arms don't stretch. */
export function shortfall(pose) {
  const S = solve(pose), q = S.q, near = len(sub(S.armN.end, [q.fx, -q.fy, S.armN.end[2]])), far = q.two ? 0 : len(sub(S.armF.end, [q.bx, -q.by, S.armF.end[2]]));
  return Math.max(near, far);
}
/** The pixels of a pose: { n, xs, ys, color, src, ink, x0, y0, x1, y1 }, in local space with the feet at (0, 0). */
export function posed(pose) {
  const key = keyOf(pose);
  let r = CACHE.get(key);
  if (!r) {
    if (CACHE.size > 6000) CACHE.clear();
    CACHE.set(key, (r = render(pose)));
  }
  return r;
}

/**
 * The skeleton of a pose, in the same local space as posed(): x right, y down, feet at (0, 0), z toward the viewer, whole
 * figure turned by its yaw. { joints: { name: [x, y, z] }, bones: [[from, to], ...], handles: [name, ...] }: the handles
 * are what a pose moves (hands and feet); everything else is solved from them.
 */
export function skeleton(pose) {
  const S = solve(pose), q = S.q, whole = (q.yaw ?? 0) + (q.face === -1 ? Math.PI : 0);
  if (whole) turnAll(S, whole);
  const { B, armN, armF, legN, legF, sN, sF, hipN, hipF } = S, at = (f, v) => add(f.t, mv(f.R, v));
  const J = {
    pelvis: B.pelvis.t, waist: B.waist.t, chest: B.chest.t, neck: B.neck.t, head: B.head.t, crown: at(B.head, [0, 3.3, 0]),
    shoulderN: sN, elbowN: armN.joint, handN: armN.end, shoulderF: sF, elbowF: armF.joint, handF: armF.end,
    hipN, kneeN: legN.joint, ankleN: legN.end, toeN: at(B.footN, [4.6, -1.1, 0]), hipF, kneeF: legF.joint, ankleF: legF.end, toeF: at(B.footF, [4.6, -1.1, 0]),
  };
  const joints = Object.fromEntries(Object.entries(J).map(([k, v]) => [k, [v[0], -v[1], v[2]]]));
  const bones = [["pelvis", "waist"], ["waist", "chest"], ["chest", "neck"], ["neck", "head"], ["head", "crown"], ["chest", "shoulderN"], ["shoulderN", "elbowN"], ["elbowN", "handN"], ["chest", "shoulderF"], ["shoulderF", "elbowF"], ["elbowF", "handF"], ["pelvis", "hipN"], ["hipN", "kneeN"], ["kneeN", "ankleN"], ["ankleN", "toeN"], ["pelvis", "hipF"], ["hipF", "kneeF"], ["kneeF", "ankleF"], ["ankleF", "toeF"]];
  return { joints, bones, handles: ["handN", "handF", "ankleN", "ankleF"] };
}
/** The figure taken apart: each part drawn alone, with its own outline, and where its middle is. For exploded views. */
export function posedParts(pose) {
  const out = [];
  for (const [name, part] of Object.entries(PART)) {
    onlyPart = part;
    const r = render(pose);
    onlyPart = 0;
    if (!r.n) continue;
    let cx = 0, cy = 0;
    for (let i = 0; i < r.n; i++) { cx += r.xs[i]; cy += r.ys[i]; }
    out.push({ name, part, n: r.n, xs: r.xs, ys: r.ys, color: r.color, cx: cx / r.n, cy: cy / r.n, z: r.z });
  }
  return out;
}
