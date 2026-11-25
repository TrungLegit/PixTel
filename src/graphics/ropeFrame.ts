/**
 * Procedural 16-bit Pixel-Art Antique Parchment & Braided Hemp Rope Frame Generator:
 * Renders a 48x48 1x sprite sheet (corner=16, edge=16, center=16) and integer-upscales
 * 2x to 96x96 with imageSmoothingEnabled = false for razor-sharp CSS border-image rendering.
 */

const OUTLINE = "#1a1009";
// Hemp rope ramp: deep crease -> shadow -> mid hemp -> sunlit -> crest glint
const ROPE = ["#1a1009", "#3b2412", "#664122", "#946536", "#c49154", "#e8c282"];
// Antique wood & brass backing under the rope
const WOOD = ["#1a1009", "#3d2413", "#6e431f", "#a6742e", "#e8c86a"];
// Warm aged parchment ramp
const PARCH = ["#8a6536", "#b89056", "#d1b279", "#dfc693", "#ead8ae"];

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return [cv, ctx];
}

function pset(ctx: CanvasRenderingContext2D, x: number, y: number, col: string) {
  ctx.fillStyle = col;
  ctx.fillRect(x | 0, y | 0, 1, 1);
}

function upscale2xToDataUrl(src: HTMLCanvasElement): string {
  const [out, octx] = makeCanvas(src.width * 2, src.height * 2);
  octx.imageSmoothingEnabled = false;
  octx.drawImage(src, 0, 0, src.width * 2, src.height * 2);
  return out.toDataURL("image/png");
}

function drawHorizontalRopeStrip(
  ctx: CanvasRenderingContext2D,
  xStart: number,
  xEnd: number,
  yTop: number,
  isTop: boolean
) {
  for (let x = xStart; x <= xEnd; x++) {
    const lx = ((x % 8) + 8) % 8;
    // Subtle scalloped edge notch where braided strands tuck over
    const topNotch = lx === 0;
    const botNotch = lx === 4;

    // Backing wooden rim between rope and parchment
    const rimY0 = isTop ? yTop + 6 : yTop - 2;
    const rimY1 = isTop ? yTop + 7 : yTop - 1;
    pset(ctx, x, rimY0, isTop ? WOOD[2] : WOOD[1]);
    pset(ctx, x, rimY1, isTop ? WOOD[1] : WOOD[2]);

    for (let ry = 0; ry <= 6; ry++) {
      if (ry === 0 && topNotch) continue;
      if (ry === 6 && botNotch) continue;
      const py = yTop + ry;
      const isTopEdge = ry === 0 || (ry === 1 && topNotch);
      const isBotEdge = ry === 6 || (ry === 5 && botNotch);
      if (isTopEdge || isBotEdge) {
        pset(ctx, x, py, OUTLINE);
        continue;
      }

      // Diagonal helical twist across the 8px repeating braid cell
      const p = (lx + Math.floor(ry * 0.85)) % 8;
      let col: string;
      if (p === 0) {
        col = ROPE[1]; // deep diagonal crease between strands
      } else if (p === 7) {
        col = ROPE[2];
      } else if (p === 1) {
        col = ry <= 2 ? ROPE[5] : ry === 3 ? ROPE[4] : ROPE[2];
      } else if (p === 2) {
        col = ry <= 3 ? ROPE[4] : ry === 4 ? ROPE[3] : ROPE[2];
      } else if (p === 3 || p === 4) {
        col = ry <= 2 ? ROPE[4] : ry <= 4 ? ROPE[3] : ROPE[1];
      } else {
        col = ry <= 2 ? ROPE[3] : ROPE[2];
      }
      pset(ctx, x, py, col);
    }
  }
}

function drawVerticalRopeStrip(
  ctx: CanvasRenderingContext2D,
  yStart: number,
  yEnd: number,
  xLeft: number,
  isLeft: boolean
) {
  for (let y = yStart; y <= yEnd; y++) {
    const ly = ((y % 8) + 8) % 8;
    const leftNotch = ly === 0;
    const rightNotch = ly === 4;

    const rimX0 = isLeft ? xLeft + 6 : xLeft - 2;
    const rimX1 = isLeft ? xLeft + 7 : xLeft - 1;
    pset(ctx, rimX0, y, isLeft ? WOOD[2] : WOOD[1]);
    pset(ctx, rimX1, y, isLeft ? WOOD[1] : WOOD[2]);

    for (let rx = 0; rx <= 6; rx++) {
      if (rx === 0 && leftNotch) continue;
      if (rx === 6 && rightNotch) continue;
      const px = xLeft + rx;
      const isLeftEdge = rx === 0 || (rx === 1 && leftNotch);
      const isRightEdge = rx === 6 || (rx === 5 && rightNotch);
      if (isLeftEdge || isRightEdge) {
        pset(ctx, px, y, OUTLINE);
        continue;
      }

      const p = (ly + Math.floor(rx * 0.85)) % 8;
      let col: string;
      if (p === 0) {
        col = ROPE[1];
      } else if (p === 7) {
        col = ROPE[2];
      } else if (p === 1) {
        col = rx <= 2 ? ROPE[5] : rx === 3 ? ROPE[4] : ROPE[2];
      } else if (p === 2) {
        col = rx <= 3 ? ROPE[4] : rx === 4 ? ROPE[3] : ROPE[2];
      } else if (p === 3 || p === 4) {
        col = rx <= 2 ? ROPE[4] : rx <= 4 ? ROPE[3] : ROPE[1];
      } else {
        col = rx <= 2 ? ROPE[3] : ROPE[2];
      }
      pset(ctx, px, y, col);
    }
  }
}

/**
 * Draws an antique knotted hemp rope coil + brass corner rivet + frayed tassel ends.
 * Mask uses 11x11 relative coordinates around each corner center (cx, cy).
 */
function drawCornerRopeKnot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  inwardX: 1 | -1,
  inwardY: 1 | -1
) {
  // 1. Small brass-trimmed wood backing plate tucked behind the corner knot
  for (let dy = -4; dy <= 5; dy++) {
    for (let dx = -4; dx <= 5; dx++) {
      if (Math.abs(dx) === 5 && Math.abs(dy) === 5) continue;
      const px = cx + dx * inwardX;
      const py = cy + dy * inwardY;
      if (dx === -4 || dy === -4 || dx === 5 || dy === 5) {
        pset(ctx, px, py, OUTLINE);
      } else if (dx >= 2 && dy >= 2) {
        pset(ctx, px, py, WOOD[3]);
      } else {
        pset(ctx, px, py, WOOD[1]);
      }
    }
  }

  // 2. Thick crossed Turk's-head rope knot coiled over the corner
  // 11x11 pattern around (cx, cy): '.' empty, 'k' outline, 'd' crease, 's' shadow, 'm' mid, 'h' hi, 'g' crest, 'b' brass
  const KNOT_PATTERN = [
    "...kkkkk...",
    "..khhmmsk..",
    ".kghmmssdk.",
    "kghdmmddmsk",
    "khmddbbddsk",
    "kmmdbbbbdmk",
    "ksddbggddsk",
    "kmdmddsmhsk",
    ".kdsssmmsk.",
    "..kssddsk..",
    "...kkkkk...",
  ];
  const PAL_MAP: Record<string, string> = {
    k: OUTLINE,
    d: ROPE[1],
    s: ROPE[2],
    m: ROPE[3],
    h: ROPE[4],
    g: ROPE[5],
    b: WOOD[4],
  };

  for (let row = 0; row < 11; row++) {
    for (let col = 0; col < 11; col++) {
      const ch = KNOT_PATTERN[row][col];
      if (ch === ".") continue;
      const dx = (col - 5) * inwardX;
      const dy = (row - 5) * inwardY;
      // Preserve top-left directional highlight even on mirrored corners
      let resolved = PAL_MAP[ch] ?? ROPE[3];
      if ((inwardX < 0 || inwardY < 0) && ch === "g") resolved = ROPE[4];
      if (inwardX > 0 && inwardY > 0 && ch === "b" && row === 4 && col === 4) resolved = "#ffffff";
      pset(ctx, cx + dx, cy + dy, resolved);
    }
  }

  // 3. Cute 3px frayed rope tassels tucked neatly inward inside the scroll frame
  const tx = cx + 5 * inwardX;
  const ty = cy + 5 * inwardY;
  pset(ctx, tx, ty, OUTLINE);
  pset(ctx, tx + inwardX, ty, ROPE[4]);
  pset(ctx, tx, ty + inwardY, ROPE[3]);
  pset(ctx, tx + inwardX * 2, ty, ROPE[2]);
  pset(ctx, tx + inwardX, ty + inwardY, ROPE[2]);
  pset(ctx, tx + inwardX * 3, ty, OUTLINE);
  pset(ctx, tx, ty + inwardY * 2, ROPE[1]);
  pset(ctx, tx, ty + inwardY * 3, OUTLINE);
}

export function generateRopeFrameDataUrl(): string {
  const S = 48;
  const [cv, ctx] = makeCanvas(S, S);

  // 1. Aged parchment fill inside x=9..38, y=9..38
  for (let y = 9; y <= 38; y++) {
    for (let x = 9; x <= 38; x++) {
      const edgeDist = Math.min(x - 9, 38 - x, y - 9, 38 - y);
      let col = PARCH[4];
      if (edgeDist === 0) {
        col = PARCH[0];
      } else if (edgeDist === 1) {
        col = PARCH[1];
      } else if (edgeDist === 2) {
        col = PARCH[2];
      } else if (edgeDist === 4 && ((x + y) & 2) === 0) {
        // Antique stitched inner hem
        col = PARCH[1];
      } else {
        // Repeating 16x16 organic paper grain (matches across x=16..31 & y=16..31 slice seam!)
        const rx = x & 15;
        const ry = y & 15;
        const h = (rx * 73 + ry * 139 + rx * ry * 17) % 29;
        if (h === 0) col = PARCH[2];
        else if (h <= 4) col = PARCH[3];
      }
      pset(ctx, x, y, col);
    }
  }

  // 2. Straight braided hemp ropes along all 4 sides (overlapping seamlessly into corners)
  drawHorizontalRopeStrip(ctx, 8, 39, 2, true);
  drawHorizontalRopeStrip(ctx, 8, 39, 39, false);
  drawVerticalRopeStrip(ctx, 8, 39, 2, true);
  drawVerticalRopeStrip(ctx, 8, 39, 39, false);

  // 3. Four heavy knotted corner coils + brass clasps
  drawCornerRopeKnot(ctx, 5, 5, 1, 1);
  drawCornerRopeKnot(ctx, 42, 5, -1, 1);
  drawCornerRopeKnot(ctx, 5, 42, 1, -1);
  drawCornerRopeKnot(ctx, 42, 42, -1, -1);

  return upscale2xToDataUrl(cv);
}

export function generateRopeDividerDataUrl(): string {
  const W = 24;
  const H = 8;
  const [cv, ctx] = makeCanvas(W, H);

  // Thin twisted hemp cord across 24px (4 clean 6px twists, zero repeat seam)
  for (let x = 0; x < W; x++) {
    const p = x % 6;
    pset(ctx, x, 2, OUTLINE);
    pset(ctx, x, 5, OUTLINE);
    pset(ctx, x, 3, p === 0 ? ROPE[1] : p <= 2 ? ROPE[5] : ROPE[4]);
    pset(ctx, x, 4, p === 5 ? ROPE[1] : p <= 3 ? ROPE[3] : ROPE[2]);
  }

  // Knot & brass bead clasp every repeat segment (x = 9..14)
  for (let y = 1; y <= 6; y++) {
    for (let x = 9; x <= 14; x++) {
      if ((y === 1 || y === 6) && (x === 9 || x === 14)) continue;
      if (y === 1 || y === 6 || x === 9 || x === 14) {
        pset(ctx, x, y, OUTLINE);
      } else if (x >= 11 && x <= 12 && y >= 3 && y <= 4) {
        pset(ctx, x, y, WOOD[4]);
      } else {
        pset(ctx, x, y, y <= 3 ? ROPE[4] : ROPE[2]);
      }
    }
  }

  return upscale2xToDataUrl(cv);
}

let installed = false;
export function installRopeFrameAssets() {
  if (installed) return;
  installed = true;
  const frameUrl = generateRopeFrameDataUrl();
  const dividerUrl = generateRopeDividerDataUrl();
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty("--rope-frame-url", `url("${frameUrl}")`);
  rootStyle.setProperty("--rope-divider-url", `url("${dividerUrl}")`);
}
