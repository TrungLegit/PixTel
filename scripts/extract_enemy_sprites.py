#!/usr/bin/env python3
"""
Extracts 4-direction pixel art sprites (front, right, left, back) for 10 monsters & bosses
from the uploaded reference sheets, strips the navy pixel grid background cleanly,
downsamples with BOX filter + shared palette quantization, synthesizes 2 crisp pixel-art
animation frames per direction (:1, :2) + special attack poses (null_slime:slam,
ash_hopper:roll), applies a clean 1px dark outline to all 122 frames, and packs
src/assets/codixel-enemies.png + src/assets/codixel-enemies.json.
Also outputs a 3x labeled QA contact sheet for visual verification.
"""
from __future__ import annotations

import json
from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
UPLOAD_DIR = Path(
    r"C:/Users/ADMIN/.gemini/antigravity/brain/df2ae07d-0719-4c2d-ba07-655ccbdc3295/.user_uploaded"
)
SCRATCH_PREVIEW = Path(
    r"C:/Users/ADMIN/.gemini/antigravity/brain/df2ae07d-0719-4c2d-ba07-655ccbdc3295/scratch/enemies_preview_sheet.png"
)
OUT_PNG = ROOT / "src" / "assets" / "codixel-enemies.png"
OUT_JSON = ROOT / "src" / "assets" / "codixel-enemies.json"

MONSTERS = [
    ("null_slime", "media_1795607452236_9604b567.jpg", (24, 22), False),
    ("ash_hopper", "media_1795607461412_b46c4e8e.jpg", (26, 24), False),
    ("thorn_archer", "media_1795607472939_3416cbc1.jpg", (28, 24), False),
    ("root_golem", "media_1795607477778_e06823e4.jpg", (38, 36), False),
    ("boss_xing_warden", "media_1795607483705_180d0116.jpg", (44, 44), False),
    ("bleach_hound", "media_1795607487958_45f6723b.jpg", (28, 24), True),
    ("quartz_stalker", "media_1795607491806_2f451d01.jpg", (28, 24), False),
    ("static_imp", "media_1795607499205_b8832e4c.jpg", (24, 24), True),
    ("quartz_knight", "media_1795607503743_93ba39f1.jpg", (40, 38), False),
    ("boss_blight_root", "media_1795607508580_deb4d615.jpg", (48, 46), True),
]

DIR_BOXES = {
    "front": (23, 114, 245, 269),
    "right": (275, 114, 497, 269),
    "left": (527, 114, 749, 269),
    "back": (779, 114, 1001, 269),
}

INK = (12, 15, 24, 255)


def is_navy_bg(r: int, g: int, b: int) -> bool:
    if r <= 34 and g <= 46 and 20 <= b <= 84 and (b - r) >= 12 and (b - g) >= 8:
        return True
    if r <= 24 and g <= 30 and 18 <= b <= 56 and (b - r) >= 8 and (b - g) >= 5:
        return True
    return False


def is_strict_empty_cell(r: int, g: int, b: int) -> bool:
    return r <= 14 and g <= 18 and 24 <= b <= 50 and (b - g) >= 14


def strip_navy_grid(crop: Image.Image) -> Image.Image:
    im = crop.convert("RGBA")
    w, h = im.size
    px = im.load()

    bg = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    def try_seed(x: int, y: int) -> None:
        if 0 <= x < w and 0 <= y < h and not bg[y][x]:
            r, g, b, _ = px[x, y]
            if is_navy_bg(r, g, b):
                bg[y][x] = True
                q.append((x, y))

    for x in range(w):
        try_seed(x, 0)
        try_seed(x, h - 1)
    for y in range(h):
        try_seed(0, y)
        try_seed(w - 1, y)

    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not bg[ny][nx]:
                r, g, b, _ = px[nx, ny]
                if is_navy_bg(r, g, b):
                    bg[ny][nx] = True
                    q.append((nx, ny))

    # Interior enclosed holes between limbs/wings/weapons
    visited = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            if bg[y][x] or visited[y][x]:
                continue
            r, g, b, _ = px[x, y]
            if not is_strict_empty_cell(r, g, b):
                continue
            comp: list[tuple[int, int]] = []
            cq: deque[tuple[int, int]] = deque([(x, y)])
            visited[y][x] = True
            while cq:
                cx, cy = cq.popleft()
                comp.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not bg[ny][nx] and not visited[ny][nx]:
                        nr, ng, nb, _ = px[nx, ny]
                        if is_strict_empty_cell(nr, ng, nb):
                            visited[ny][nx] = True
                            cq.append((nx, ny))
            if len(comp) >= 14:
                hq: deque[tuple[int, int]] = deque()
                for cx, cy in comp:
                    bg[cy][cx] = True
                    hq.append((cx, cy))
                while hq:
                    cx, cy = hq.popleft()
                    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                        if 0 <= nx < w and 0 <= ny < h and not bg[ny][nx]:
                            nr, ng, nb, _ = px[nx, ny]
                            if is_navy_bg(nr, ng, nb):
                                bg[ny][nx] = True
                                hq.append((nx, ny))

    # 1-pass dark-blue halo cleanup on transparency boundaries
    fringe: list[tuple[int, int]] = []
    for y in range(h):
        for x in range(w):
            if bg[y][x]:
                continue
            if any(
                0 <= nx < w and 0 <= ny < h and bg[ny][nx]
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1))
            ):
                r, g, b, _ = px[x, y]
                if (b - g) >= 11 and r <= 30 and g <= 38:
                    fringe.append((x, y))
    for x, y in fringe:
        bg[y][x] = True

    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    opx = out.load()
    for y in range(h):
        for x in range(w):
            if not bg[y][x]:
                r, g, b, _ = px[x, y]
                opx[x, y] = (r, g, b, 255)
    bbox = out.getbbox()
    return out.crop(bbox) if bbox else out


def harden_and_clean(im: Image.Image) -> Image.Image:
    w, h = im.size
    px = im.load()
    mask = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a >= 115:
                mask[y][x] = True
                px[x, y] = (r, g, b, 255)
            else:
                px[x, y] = (0, 0, 0, 0)

    for y in range(h):
        for x in range(w):
            if not mask[y][x]:
                continue
            neighbors = sum(
                1
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1))
                if 0 <= nx < w and 0 <= ny < h and mask[ny][nx]
            )
            if neighbors == 0:
                px[x, y] = (0, 0, 0, 0)
    return im


def quantize_shared_colors(frames: dict[str, Image.Image], cell_w: int, cell_h: int) -> dict[str, Image.Image]:
    dirs = ["front", "right", "left", "back"]
    strip = Image.new("RGB", (cell_w * 4, cell_h), (255, 0, 255))
    alphas: dict[str, list[list[int]]] = {}
    for idx, d in enumerate(dirs):
        im = frames[d]
        px = im.load()
        a_grid = [[0] * cell_w for _ in range(cell_h)]
        for y in range(cell_h):
            for x in range(cell_w):
                r, g, b, a = px[x, y]
                a_grid[y][x] = a
                if a > 0:
                    strip.putpixel((idx * cell_w + x, y), (r, g, b))
        alphas[d] = a_grid

    q_strip = strip.quantize(colors=30, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    qpx = q_strip.load()

    result: dict[str, Image.Image] = {}
    for idx, d in enumerate(dirs):
        a_grid = alphas[d]
        out = Image.new("RGBA", (cell_w, cell_h), (0, 0, 0, 0))
        opx = out.load()
        for y in range(cell_h):
            for x in range(cell_w):
                if a_grid[y][x] > 0:
                    r, g, b = qpx[idx * cell_w + x, y]
                    if r > 235 and g < 35 and b > 235:
                        r, g, b = frames[d].getpixel((x, y))[:3]
                    opx[x, y] = (r, g, b, 255)
        result[d] = out
    return result


def apply_outline(interior: Image.Image) -> Image.Image:
    w, h = interior.size
    ipx = interior.load()
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    opx = out.load()
    solid = [[ipx[x, y][3] > 0 for x in range(w)] for y in range(h)]
    for y in range(h):
        for x in range(w):
            if solid[y][x]:
                opx[x, y] = ipx[x, y]
            elif any(
                0 <= nx < w and 0 <= ny < h and solid[ny][nx]
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1))
            ):
                opx[x, y] = INK
    return out


def opaque_coords(im: Image.Image) -> list[tuple[int, int, tuple[int, int, int, int]]]:
    w, h = im.size
    px = im.load()
    pts = []
    for y in range(h):
        for x in range(w):
            c = px[x, y]
            if c[3] > 0:
                pts.append((x, y, c))
    return pts


def write_points(w: int, h: int, pts: list[tuple[int, int, tuple[int, int, int, int]]]) -> Image.Image:
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    opx = out.load()
    for x, y, c in pts:
        # Leave 1px border free inside cell so dark outline never clips
        cx = max(1, min(w - 2, x))
        cy = max(1, min(h - 2, y))
        opx[cx, cy] = c
    return out


def connected_components(im: Image.Image) -> list[list[tuple[int, int, tuple[int, int, int, int]]]]:
    w, h = im.size
    px = im.load()
    seen = [[False] * w for _ in range(h)]
    comps = []
    for y in range(h):
        for x in range(w):
            if seen[y][x] or px[x, y][3] == 0:
                continue
            comp = []
            q = deque([(x, y)])
            seen[y][x] = True
            while q:
                cx, cy = q.popleft()
                comp.append((cx, cy, px[cx, cy]))
                for nx in range(cx - 1, cx + 2):
                    for ny in range(cy - 1, cy + 2):
                        if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and px[nx, ny][3] > 0:
                            seen[ny][nx] = True
                            q.append((nx, ny))
            comps.append(comp)
    comps.sort(key=len, reverse=True)
    return comps


def make_wing_frames(im: Image.Image, direction: str) -> tuple[Image.Image, Image.Image]:
    w, h = im.size
    pts = opaque_coords(im)
    if not pts:
        return im.copy(), im.copy()
    x0 = min(p[0] for p in pts)
    x1 = max(p[0] for p in pts)
    y0 = min(p[1] for p in pts)
    y1 = max(p[1] for p in pts)
    bw = max(1, x1 - x0 + 1)
    bh = max(1, y1 - y0 + 1)
    cx = (x0 + x1) * 0.5
    if direction == "right":
        tx = x0 + bw * 0.64
    elif direction == "left":
        tx = x0 + bw * 0.36
    else:
        tx = cx

    # Frame 1: wing downstroke + torso lift
    # Frame 2: wing upstroke + torso settle
    pts1, pts2 = [], []
    shoulder_r = bw * 0.19
    wing_span = max(1.0, (max(abs(x0 - tx), abs(x1 - tx))) - shoulder_r)
    for x, y, c in pts:
        rel_y = (y - y0) / bh
        arm = max(0.0, abs(x - tx) - shoulder_r) / wing_span
        # Extend wing vertical envelope on boss_blight_root so draped wingtips move smoothly with the wing
        in_wing = arm > 0.0 and (rel_y < 0.86 if direction in ("front", "back") else rel_y < 0.72)
        if in_wing:
            # Graduated sweep down on downstroke and up on upstroke; keep inner shoulder joined
            dy1 = -1 + round(arm * 2.4)
            dy2 = 1 - round(arm * 2.0)
        else:
            dy1 = -1
            dy2 = 1
        pts1.append((x, y + dy1, c))
        pts2.append((x, y + dy2, c))
    return write_points(w, h, pts1), write_points(w, h, pts2)


def make_crystal_frames(im: Image.Image) -> tuple[Image.Image, Image.Image]:
    w, h = im.size
    comps = connected_components(im)
    if not comps:
        return im.copy(), im.copy()
    body = comps[0]
    sparkles = [pt for comp in comps[1:] for pt in comp]
    pts1 = [(x, y - 1, c) for x, y, c in body] + [(x, y + 1, c) for x, y, c in sparkles]
    pts2 = [(x, y + 1, c) for x, y, c in body] + [(x, y - 1, c) for x, y, c in sparkles]
    return write_points(w, h, pts1), write_points(w, h, pts2)


def make_slime_frames(im: Image.Image, direction: str) -> tuple[Image.Image, Image.Image, Image.Image | None]:
    w, h = im.size
    pts = opaque_coords(im)
    if not pts:
        return im.copy(), im.copy(), im.copy() if direction == "front" else None
    x0 = min(p[0] for p in pts)
    x1 = max(p[0] for p in pts)
    y0 = min(p[1] for p in pts)
    y1 = max(p[1] for p in pts)
    bw = max(1, x1 - x0 + 1)
    bh = max(1, y1 - y0 + 1)
    cx = (x0 + x1) * 0.5
    sprout_cut = y0 + bh * 0.28

    # Frame 1: Squashed wide wobble + sprout sway right (keeps feet planted on y1, zero gap)
    pts1_map: dict[tuple[int, int], tuple[int, int, int, int]] = {}
    for x, y, c in pts:
        if y < sprout_cut:
            nx, ny = x + 1, y + 1
        else:
            frac_down = (y - sprout_cut) / max(1.0, (y1 - sprout_cut))
            # Compress crown down +1px into upper body and widen base corners +1px outward
            ny = y + (1 if frac_down < 0.45 else 0)
            nx = x
            if frac_down >= 0.42:
                pts1_map[(max(1, min(w - 2, x + (-1 if x < cx else 1))), max(1, min(h - 2, ny)))] = c
        pts1_map[(max(1, min(w - 2, nx)), max(1, min(h - 2, ny)))] = c
    f1 = write_points(w, h, [(x, y, c) for (x, y), c in pts1_map.items()])

    # Frame 2: Hop stretch up 1px + sprout sway left
    pts2 = []
    for x, y, c in pts:
        if y < sprout_cut:
            pts2.append((x - 1, y - 1, c))
        else:
            pts2.append((x, y - 1, c))
    f2 = write_points(w, h, pts2)

    # Special slam expression for front view: bold `>` and `<` squinted eyes on squashed jelly
    slam_im = None
    if direction == "front":
        slam_im = f1.copy()
        spx = slam_im.load()
        band_y0 = int(round(y0 + bh * 0.45))
        band_y1 = min(h - 3, int(round(y0 + bh * 0.85)))
        icx = int(round(cx))

        def find_eye(xmin: int, xmax: int) -> tuple[int, int] | None:
            best = None
            best_lum = 999
            for yy in range(band_y0, band_y1 + 1):
                for xx in range(max(1, xmin), min(w - 2, xmax) + 1):
                    r, g, b, a = spx[xx, yy]
                    if a == 0:
                        continue
                    lum = r + g + b
                    if lum < best_lum:
                        best_lum = lum
                        best = (xx, yy)
            return best if best_lum < 280 else None

        le = find_eye(x0 + 2, icx - 1)
        re = find_eye(icx, x1 - 2)
        if le and re:
            sample_y = max(band_y0 - 1, 1)
            fill_l = spx[le[0], sample_y] if spx[le[0], sample_y][3] > 0 else (72, 198, 72, 255)
            fill_r = spx[re[0], sample_y] if spx[re[0], sample_y][3] > 0 else (72, 198, 72, 255)
            for ex, ey, fill_c in ((le[0], le[1], fill_l), (re[0], re[1], fill_r)):
                for dy in range(-1, 2):
                    for dx in range(-1, 2):
                        nx, ny = ex + dx, ey + dy
                        if 1 <= nx < w - 1 and 1 <= ny < h - 1 and spx[nx, ny][3] > 0:
                            r, g, b, _ = spx[nx, ny]
                            if r + g + b < 280:
                                spx[nx, ny] = fill_c
            eye_ink = (12, 18, 16, 255)
            lx, ly = le[0], min(h - 4, le[1] - 1)
            rx, ry = re[0], min(h - 4, re[1] - 1)
            for px_x, px_y in ((lx - 1, ly - 1), (lx, ly), (lx - 1, ly + 1)):
                if 1 <= px_x < w - 1 and 1 <= px_y < h - 1 and spx[px_x, px_y][3] > 0:
                    spx[px_x, px_y] = eye_ink
            for px_x, px_y in ((rx + 1, ry - 1), (rx, ry), (rx + 1, ry + 1)):
                if 1 <= px_x < w - 1 and 1 <= px_y < h - 1 and spx[px_x, px_y][3] > 0:
                    spx[px_x, px_y] = eye_ink

    return f1, f2, slam_im


def make_crawler_frames(
    im: Image.Image, def_id: str, direction: str
) -> tuple[Image.Image, Image.Image, Image.Image | None]:
    w, h = im.size
    pts = opaque_coords(im)
    if not pts:
        return im.copy(), im.copy(), None
    x0 = min(p[0] for p in pts)
    x1 = max(p[0] for p in pts)
    y0 = min(p[1] for p in pts)
    y1 = max(p[1] for p in pts)
    bh = max(1, y1 - y0 + 1)
    foot_cut = y1 - max(2, int(round(bh * 0.24)))

    # Cluster bottom foot columns left-to-right so adjacent leg tips never split mid-leg
    foot_xs = sorted({x for x, y, _ in pts if y >= foot_cut})
    col_group: dict[int, int] = {}
    grp = 0
    prev_x = None
    for fx in foot_xs:
        if prev_x is not None and fx - prev_x > 1:
            grp += 1
        col_group[fx] = grp & 1
        prev_x = fx

    pts1, pts2 = [], []
    for x, y, c in pts:
        if y >= foot_cut:
            g = col_group.get(x, 0)
            # Only lift alternating foot tips up into the carapace (overlap = zero gaps!)
            pts1.append((x, y - (1 if g == 0 else 0), c))
            pts2.append((x, y - (1 if g == 1 else 0), c))
        else:
            # Frame 1 sits steady; Frame 2 compresses body +1px into legs on stride!
            pts1.append((x, y, c))
            pts2.append((x, min(h - 2, y + 1), c))
    f1 = write_points(w, h, pts1)
    f2 = write_points(w, h, pts2)

    # Special tucked emerald rolling shell pose for ash_hopper (front carapace centered)
    roll_im = None
    if def_id == "ash_hopper" and direction == "front":
        shell_cut = y0 + int(round(bh * 0.72))
        shell_pts = [(x, y, c) for x, y, c in pts if y <= shell_cut]
        if shell_pts:
            sx0 = min(p[0] for p in shell_pts)
            sx1 = max(p[0] for p in shell_pts)
            sy0 = min(p[1] for p in shell_pts)
            sy1 = max(p[1] for p in shell_pts)
            scx = (sx0 + sx1) * 0.5
            scy = (sy0 + sy1) * 0.5
            srx = max(1.0, (sx1 - sx0) * 0.52)
            sry = max(1.0, (sy1 - sy0) * 0.54)
            dx_off = int(round((w * 0.5) - scx))
            dy_off = int(round((h * 0.54) - scy))
            tucked = []
            for x, y, c in shell_pts:
                nd = ((x - scx) / srx) ** 2 + ((y - scy) / sry) ** 2
                if y <= sy0 + (sy1 - sy0) * 0.68 or nd <= 1.05:
                    tucked.append((x + dx_off, y + dy_off, c))
            roll_im = write_points(w, h, tucked)

    return f1, f2, roll_im


def make_biped_frames(im: Image.Image) -> tuple[Image.Image, Image.Image]:
    w, h = im.size
    pts = opaque_coords(im)
    if not pts:
        return im.copy(), im.copy()
    x0 = min(p[0] for p in pts)
    x1 = max(p[0] for p in pts)
    y0 = min(p[1] for p in pts)
    y1 = max(p[1] for p in pts)
    bw = max(1, x1 - x0 + 1)
    bh = max(1, y1 - y0 + 1)
    cx = (x0 + x1) * 0.5
    leg_cut = y1 - max(2, int(round(bh * 0.24)))
    top_cut = y0 + bh * 0.45

    pts1, pts2 = [], []
    for x, y, c in pts:
        if y >= leg_cut:
            # Left leg lifts up into hip (-1px) on Frame 1; right leg lifts up on Frame 2 (zero seams!)
            pts1.append((x, y - (1 if x < cx else 0), c))
            pts2.append((x, y - (1 if x >= cx else 0), c))
        elif y < top_cut and abs(x - cx) > bw * 0.24:
            # Arm/weapon shifts down +1px into torso on Frame 1, neutral on Frame 2
            pts1.append((x, min(h - 2, y + 1), c))
            pts2.append((x, y, c))
        else:
            # Torso stays level on Frame 1 and dips +1px into hips on Frame 2
            pts1.append((x, y, c))
            pts2.append((x, min(h - 2, y + 1), c))
    return write_points(w, h, pts1), write_points(w, h, pts2)


def build_anim_frames(
    def_id: str, interior_dirs: dict[str, Image.Image]
) -> dict[str, Image.Image]:
    out: dict[str, Image.Image] = {}
    wing_ids = {"bleach_hound", "boss_blight_root"}
    crawler_ids = {"ash_hopper", "quartz_stalker"}

    for d, base_int in interior_dirs.items():
        if def_id in wing_ids:
            f1_int, f2_int = make_wing_frames(base_int, d)
            sp_name, sp_int = None, None
        elif def_id == "static_imp":
            f1_int, f2_int = make_crystal_frames(base_int)
            sp_name, sp_int = None, None
        elif def_id == "null_slime":
            f1_int, f2_int, sp_int = make_slime_frames(base_int, d)
            sp_name = "slam" if sp_int is not None else None
        elif def_id in crawler_ids:
            f1_int, f2_int, sp_int = make_crawler_frames(base_int, def_id, d)
            sp_name = "roll" if sp_int is not None else None
        else:
            f1_int, f2_int = make_biped_frames(base_int)
            sp_name, sp_int = None, None

        out[d] = apply_outline(base_int)
        out[f"{d}:1"] = apply_outline(f1_int)
        out[f"{d}:2"] = apply_outline(f2_int)
        if sp_name and sp_int is not None:
            out[sp_name] = apply_outline(sp_int)
    return out


def process_monster(def_id: str, filename: str, target_size: tuple[int, int]) -> dict[str, Image.Image]:
    src = Image.open(UPLOAD_DIR / filename).convert("RGBA")
    raw_dirs: dict[str, Image.Image] = {}
    for d, box in DIR_BOXES.items():
        raw_dirs[d] = strip_navy_grid(src.crop(box))

    max_w = max(im.width for im in raw_dirs.values())
    max_h = max(im.height for im in raw_dirs.values())
    tw, th = target_size
    # Reserve 4px cushion horizontally & vertically for 1px outline + 1px multi-frame motion
    inner_w = max(4, tw - 4)
    inner_h = max(4, th - 4)
    scale = min(inner_w / max_w, inner_h / max_h)

    scaled_dirs: dict[str, Image.Image] = {}
    for d, im in raw_dirs.items():
        sw = max(2, int(round(im.width * scale)))
        sh = max(2, int(round(im.height * scale)))
        down = im.resize((sw, sh), resample=Image.Resampling.BOX)
        down = harden_and_clean(down)

        cell = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
        ox = (tw - sw) // 2
        oy = max(2, th - 2 - sh)
        cell.paste(down, (ox, oy), down)
        scaled_dirs[d] = cell

    interior_dirs = quantize_shared_colors(scaled_dirs, tw, th)
    return build_anim_frames(def_id, interior_dirs)


def main() -> None:
    OUT_PNG.parent.mkdir(parents=True, exist_ok=True)
    SCRATCH_PREVIEW.parent.mkdir(parents=True, exist_ok=True)

    all_sprites: dict[str, dict[str, Image.Image]] = {}
    monster_meta: dict[str, dict[str, object]] = {}
    frame_order: dict[str, list[str]] = {}
    for def_id, filename, target_size, floating in MONSTERS:
        sprites = process_monster(def_id, filename, target_size)
        all_sprites[def_id] = sprites
        monster_meta[def_id] = {"w": target_size[0], "h": target_size[1], "floating": floating}
        keys = []
        for d in ("front", "right", "left", "back"):
            keys.extend([d, f"{d}:1", f"{d}:2"])
        for extra in ("slam", "roll"):
            if extra in sprites:
                keys.append(extra)
        frame_order[def_id] = keys

    # Pack cleanly into sprite atlas
    pad = 2
    atlas_w = max(len(frame_order[def_id]) * (size[0] + pad) + pad for def_id, _, size, _ in MONSTERS)
    atlas_h = sum(size[1] + pad for _, _, size, _ in MONSTERS) + pad
    atlas = Image.new("RGBA", (atlas_w, atlas_h), (0, 0, 0, 0))

    frames_meta: dict[str, dict[str, int]] = {}
    cur_y = pad
    for def_id, _, (cw, ch), _ in MONSTERS:
        cur_x = pad
        for key in frame_order[def_id]:
            spr = all_sprites[def_id][key]
            atlas.paste(spr, (cur_x, cur_y), spr)
            frames_meta[f"{def_id}:{key}"] = {
                "x": cur_x,
                "y": cur_y,
                "w": cw,
                "h": ch,
                "anchorY": ch,
            }
            cur_x += cw + pad
        cur_y += ch + pad

    atlas.save(OUT_PNG, "PNG")
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump({"frames": frames_meta, "monsters": monster_meta}, f, indent=2)

    # Generate 3x QA contact sheet showing idle/walk front :0/:1/:2, right:1, left:1, + slam/roll poses
    scale = 3
    row_h = max(ch * scale + 24 for _, _, (_, ch), _ in MONSTERS)
    max_cw = max(cw for _, _, (cw, _), _ in MONSTERS)
    cols = [
        ("front", "FRONT:0"),
        ("front:1", "FRONT:1"),
        ("front:2", "FRONT:2"),
        ("right:1", "RIGHT:1"),
        ("left:1", "LEFT:1"),
        ("special", "POSE"),
    ]
    sheet_w = 180 + len(cols) * (max_cw * scale + 12) + 16
    sheet_h = 20 + len(MONSTERS) * row_h
    sheet = Image.new("RGBA", (sheet_w, sheet_h), (24, 26, 38, 255))
    draw = ImageDraw.Draw(sheet)

    for r_idx, (def_id, _, (cw, ch), _) in enumerate(MONSTERS):
        ry = 14 + r_idx * row_h
        draw.text((12, ry + 6), f"{def_id}\n({cw}x{ch})", fill=(180, 240, 200, 255))
        sprites = all_sprites[def_id]
        for c_idx, (key, label) in enumerate(cols):
            rx = 180 + c_idx * (max_cw * scale + 12)
            bw, bh = cw * scale, ch * scale
            if key == "special":
                actual_key = "slam" if "slam" in sprites else "roll" if "roll" in sprites else "back:1"
                actual_label = actual_key.upper()
            else:
                actual_key = key
                actual_label = label
            for cy in range(0, bh, 8):
                for cx in range(0, bw, 8):
                    chk = (52, 56, 72, 255) if ((cx // 8 + cy // 8) & 1) == 0 else (40, 44, 58, 255)
                    draw.rectangle(
                        [rx + cx, ry + cy, min(rx + bw - 1, rx + cx + 7), min(ry + bh - 1, ry + cy + 7)],
                        fill=chk,
                    )
            spr_big = sprites[actual_key].resize((bw, bh), resample=Image.Resampling.NEAREST)
            sheet.paste(spr_big, (rx, ry), spr_big)
            draw.text((rx, ry + bh + 3), actual_label, fill=(160, 175, 200, 255))

    sheet.save(SCRATCH_PREVIEW, "PNG")
    print(
        f"Saved atlas {OUT_PNG} ({atlas_w}x{atlas_h}, {len(frames_meta)} frames), "
        f"metadata {OUT_JSON}, and QA sheet {SCRATCH_PREVIEW}"
    )


if __name__ == "__main__":
    main()
