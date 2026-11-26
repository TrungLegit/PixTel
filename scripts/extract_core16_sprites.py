"""
Extract 16 HD 48x48 sprites from Reference Image 1 (4x4 grid) using per-card
boundary detection + BFS edge flood-fill (preserving dark outlines and dark
interiors such as Moss Hood), craft 6 matching 48x48 Core Material sprites, and
pack all 22 into `src/assets/core16-items.png` & `src/assets/core16-items.json`
plus `preview for devs/assets/v31_core16_items_sheet.png`.
"""

from collections import deque
import json
import math
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC_IMG = Path(
    r"C:/Users/trung/.gemini/antigravity/brain/d807442a-3f9c-4b2b-8127-ae8fbbddb004/.user_uploaded/media_1795659248631_1efd0e2f.jpg"
)
OUT_PNG = ROOT / "src" / "assets" / "core16-items.png"
OUT_JSON = ROOT / "src" / "assets" / "core16-items.json"
OUT_PREVIEW = ROOT / "preview for devs" / "assets" / "v31_core16_items_sheet.png"

CELL_SIZE = 48
COLS = 6
ROWS = 4

CORE16_GRID = [
    ("core_wp_vanguard_chipped", "Kiếm Sứt Mẻ Vệ Binh", "common"),
    ("core_wp_briar_dagger", "Dao Găm Gai Rừng", "rare"),
    ("core_wp_spark_staff", "Trượng Lôi Đình Tí Hon", "rare"),
    ("core_wp_eclipse_reaver", "Lưỡi Hái Nhật Thực", "epic"),
    ("core_wp_forge_hammer", "Búa Tạ Lò Nung", "epic"),
    ("core_wp_starfall_blade", "Thánh Kiếm Sao Rơi", "legendary"),
    ("core_ar_briar_cloak", "Áo Choàng Gai Cổ Thụ", "rare"),
    ("core_ar_bloodstone_plate", "Giáp Huyết Thạch", "epic"),
    ("core_hm_moss_hood", "Mũ Trùm Rêu Phong", "uncommon"),
    ("core_hm_ash_visor", "Mũ Sắt Lò Tro", "rare"),
    ("core_hm_eclipse_crown", "Vương Miện Nhật Thực", "legendary"),
    ("core_ar_aegis_mantle", "Chiến Giáp Bất Diệt", "legendary"),
    ("core_ac_ember_crest", "Huy Hiệu Tro Tàn", "rare"),
    ("core_ac_cracked_pact", "Nhẫn Giao Ước Rạn Nứt", "cursed"),
    ("core_cs_mirage_vial", "Lọ Sương Mù Ảo Ảnh", "uncommon"),
    ("core_cs_fate_die", "Xúc Xắc Đổi Mệnh", "epic"),
]

RARITY_COLORS = {
    "common": "#cbd5e1",
    "uncommon": "#4ade80",
    "rare": "#60a5fa",
    "epic": "#c084fc",
    "cursed": "#f43f5e",
    "legendary": "#facc15",
}


def find_card_inner_box(im: Image.Image, row: int, col: int) -> tuple[int, int, int, int]:
    """Detect the exact interior bounding box inside each framed cell."""
    w, h = im.size
    qx0 = int(w * col / 4)
    qx1 = int(w * (col + 1) / 4)
    qy0 = int(h * row / 4)
    qy1 = int(h * (row + 1) / 4)
    px = im.load()

    mid_x = (qx0 + qx1) // 2
    mid_y = (qy0 + qy1) // 2

    def is_border(c: tuple[int, int, int]) -> bool:
        r, g, b = c
        return b > 48 and r > 32 and abs(b - g) > 12

    # Scan along middle bands near expected frame edges (outer ~12-40px of quadrant)
    top = qy0 + 18
    for y in range(qy0 + 6, qy0 + 48):
        hits = sum(1 for x in range(mid_x - 35, mid_x + 36, 5) if is_border(px[x, y]))
        if hits >= 8:
            top = y + 4

    bot = qy1 - 18
    for y in range(qy1 - 6, qy1 - 48, -1):
        hits = sum(1 for x in range(mid_x - 35, mid_x + 36, 5) if is_border(px[x, y]))
        if hits >= 8:
            bot = y - 4

    left = qx0 + 18
    for x in range(qx0 + 6, qx0 + 48):
        hits = sum(1 for y in range(mid_y - 35, mid_y + 36, 5) if is_border(px[x, y]))
        if hits >= 8:
            left = x + 4

    right = qx1 - 18
    for x in range(qx1 - 6, qx1 - 48, -1):
        hits = sum(1 for y in range(mid_y - 35, mid_y + 36, 5) if is_border(px[x, y]))
        if hits >= 8:
            right = x - 4

    # Clamp safely away from rounded corner bevels without clipping wide icons like Fate Die
    return (max(qx0 + 18, left - 2), max(qy0 + 18, top - 2), min(qx1 - 18, right + 2), min(qy1 - 18, bot + 2))


def extract_clean_sprite(im: Image.Image, row: int, col: int, key: str = "") -> Image.Image:
    """Crop inner card and remove outer dark-indigo background via edge BFS flood-fill."""
    box = find_card_inner_box(im, row, col)
    crop = im.crop(box).convert("RGBA")
    cw, ch = crop.size
    px = crop.load()

    # Sample background RGB from inner margin pixels (excluding extreme corner vignette)
    samples = []
    for sx, sy in [(3, 3), (cw - 4, 3), (3, ch - 4), (cw - 4, ch - 4), (cw // 2, 3), (3, ch // 2)]:
        r, g, b, _ = px[sx, sy]
        if 8 <= max(r, g, b) < 50 and b >= r + 3:
            samples.append((r, g, b))
    if samples:
        bg_r = sum(c[0] for c in samples) / len(samples)
        bg_g = sum(c[1] for c in samples) / len(samples)
        bg_b = sum(c[2] for c in samples) / len(samples)
    else:
        bg_r, bg_g, bg_b = 18.0, 14.0, 30.0

    def is_bg_like(x: int, y: int) -> bool:
        r, g, b, _ = px[x, y]
        if max(r, g, b) >= 54:
            return False
        # Strict indigo backdrop match: prevents bleeding across neutral black/charcoal outlines
        dist = math.sqrt((r - bg_r) ** 2 + (g - bg_g) ** 2 + (b - bg_b) ** 2)
        if dist <= 13.5 and (b - g) >= 5:
            return True
        # Outer border corner vignette (strictly near edges of card, away from centered weapon shafts)
        near_border = x < 18 or x >= cw - 18 or y < 18 or y >= ch - 18
        if near_border and max(r, g, b) <= 36 and (b - g) >= 4:
            return True
        if near_border and max(r, g, b) <= 12:
            return True
        return False

    visited = bytearray(cw * ch)
    q = deque()
    for x in range(cw):
        for y in (0, ch - 1):
            if is_bg_like(x, y):
                visited[y * cw + x] = 1
                q.append((x, y))
    for y in range(1, ch - 1):
        for x in (0, cw - 1):
            if is_bg_like(x, y):
                visited[y * cw + x] = 1
                q.append((x, y))

    while q:
        x, y = q.popleft()
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < cw and 0 <= ny < ch:
                idx = ny * cw + nx
                if not visited[idx] and is_bg_like(nx, ny):
                    visited[idx] = 1
                    q.append((nx, ny))

    # Clear enclosed indigo pocket trapped inside Spark Staff lightning loop
    if key == "core_wp_spark_staff":
        for y in range(25, ch - 25):
            for x in range(25, cw - 25):
                r, g, b, a = px[x, y]
                if a == 0:
                    continue
                if max(r, g, b) <= 32 and (b - g) >= 7:
                    px[x, y] = (0, 0, 0, 0)

    # Second gentle pass: clear isolated 1px dark-indigo anti-alias halo touching transparency
    to_clear = []
    for y in range(1, ch - 1):
        for x in range(1, cw - 1):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            adj_trans = sum(
                1 for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)) if px[nx, ny][3] == 0
            )
            if adj_trans >= 3 and max(r, g, b) <= 38 and (b - g) >= 7:
                to_clear.append((x, y))
    for x, y in to_clear:
        px[x, y] = (0, 0, 0, 0)

    # Prune tiny isolated dust islands (< 8 px) outside main bbox
    seen = bytearray(cw * ch)
    components = []
    for y in range(ch):
        for x in range(cw):
            idx = y * cw + x
            if px[x, y][3] == 0 or seen[idx]:
                continue
            comp = []
            dq = deque([(x, y)])
            seen[idx] = 1
            while dq:
                cx, cy = dq.popleft()
                comp.append((cx, cy))
                for nx in range(max(0, cx - 2), min(cw, cx + 3)):
                    for ny in range(max(0, cy - 2), min(ch, cy + 3)):
                        nidx = ny * cw + nx
                        if not seen[nidx] and px[nx, ny][3] > 0:
                            seen[nidx] = 1
                            dq.append((nx, ny))
            components.append(comp)

    if components:
        largest_len = max(len(c) for c in components)
        for comp in components:
            # Keep sparkles near starfall blade / fate die (>= 6 px), drop tiny stray corner specks
            if len(comp) < 5 and len(comp) < largest_len * 0.05:
                for cx, cy in comp:
                    px[cx, cy] = (0, 0, 0, 0)

    bbox = crop.getbbox()
    if not bbox:
        return Image.new("RGBA", (CELL_SIZE, CELL_SIZE), (0, 0, 0, 0))

    trimmed = crop.crop(bbox)
    tw, th = trimmed.size
    max_target = 44
    scale = min(max_target / tw, max_target / th)
    nw = max(1, round(tw * scale))
    nh = max(1, round(th * scale))
    resized = trimmed.resize((nw, nh), Image.Resampling.LANCZOS)

    # Crisp pixel-art alpha threshold so there are zero blurry semi-transparent smudges
    rpx = resized.load()
    for y in range(nh):
        for x in range(nw):
            r, g, b, a = rpx[x, y]
            if a < 90:
                rpx[x, y] = (0, 0, 0, 0)
            else:
                rpx[x, y] = (r, g, b, 255)

    out = Image.new("RGBA", (CELL_SIZE, CELL_SIZE), (0, 0, 0, 0))
    ox = (CELL_SIZE - nw) // 2
    oy = (CELL_SIZE - nh) // 2
    out.paste(resized, (ox, oy), resized)
    return out


# ---------------------------------------------------------------------------
# Hand-crafted 24x24 -> upscaled 2x crisp 48x48 pixel art for 6 Core Materials
# Matching Reference Image 1's #1a1625 dark outline & multi-stop shading!
# ---------------------------------------------------------------------------
def build_pixel_sprite_24(rows: list[str], pal: dict[str, tuple[int, int, int, int]]) -> Image.Image:
    im24 = Image.new("RGBA", (24, 24), (0, 0, 0, 0))
    px = im24.load()
    for y, row in enumerate(rows[:24]):
        for x, ch in enumerate(row[:24]):
            if ch != "." and ch in pal:
                px[x, y] = pal[ch]
    return im24.resize((48, 48), Image.Resampling.NEAREST)


OUTLINE = (26, 22, 37, 255)  # #1a1625


def make_core_materials() -> list[tuple[str, str, str, Image.Image]]:
    mats = []

    # 1. Nhựa Cổ Thụ Ngàn Năm (Ancient Amber-Emerald Sap Vial / Droplet)
    sap_pal = {
        "k": OUTLINE,
        "w": (122, 82, 52, 255),
        "W": (168, 118, 76, 255),
        "b": (45, 92, 62, 255),
        "g": (74, 222, 128, 255),
        "G": (187, 247, 208, 255),
        "a": (250, 204, 21, 255),
        "h": (255, 255, 255, 255),
        "m": (21, 128, 61, 255),
    }
    sap_rows = [
        "........................",
        ".........kkkkkk.........",
        "........kWWWWWWk........",
        "........kwwwwwwk........",
        ".........kkwwkk.........",
        ".........kbbbbk.........",
        "........kbgGGgbk........",
        ".......kbgGhhGgbk.......",
        "......kbmghhhggmbk......",
        ".....kbmggGaaGggmbk.....",
        "....kbmgggGaagggmmbk....",
        "....kbmgggGGGGggmmbk....",
        "....kbmmggggggggmmbk....",
        "....kbmmmggggggmmmbk....",
        ".....kmmmmmmmmmmmmk.....",
        ".....kbbbbmmmmbbbbk.....",
        "......kkkkkkkkkkkk......",
        ".......k..k..k..k.......",
        "......kG.......Gk.......",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
    ]
    mats.append(("core_mat_ancient_sap", "Nhựa Cổ Thụ Ngàn Năm", "uncommon", build_pixel_sprite_24(sap_rows, sap_pal)))

    # 2. Lõi Rễ Cổ Vùng 2 (Elder Root Glowing Core)
    root_pal = {
        "k": OUTLINE,
        "b": (78, 52, 34, 255),
        "B": (122, 86, 56, 255),
        "d": (46, 30, 22, 255),
        "c": (56, 189, 248, 255),
        "g": (52, 211, 153, 255),
        "G": (167, 243, 208, 255),
        "h": (255, 255, 255, 255),
    }
    root_rows = [
        "........................",
        ".....kk..........kk.....",
        "....kBBk...kk...kBBk....",
        "....kbBbk.kcck.kbBbk....",
        ".....kbbbkggggkbbbk.....",
        "....kBbbkgGGGGgkbBbk....",
        "...kBbbkggGhhGggkbbBk...",
        "...kdbbkggGhhGggkbbdk...",
        "....kdbkgggGGgggkbbk....",
        ".....kdkbcggggcbkdk.....",
        "....kBbkbbccccbbkbBk....",
        "...kBbbkbbbbbbbbkbbBk...",
        "..kBdbk.kbbddbbk.kbdBk..",
        "..kddk..kbdkkdbk..kddk..",
        "...kk...kdk..kdk...kk...",
        "........kk....kk........",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
    ]
    mats.append(("core_mat_elder_core", "Lõi Rễ Cổ Vùng 2", "rare", build_pixel_sprite_24(root_rows, root_pal)))

    # 3. Mảnh Huyết Thạch (Faceted Crimson-Obsidian Blood Shard)
    blood_pal = {
        "k": OUTLINE,
        "d": (110, 14, 42, 255),
        "r": (190, 18, 60, 255),
        "R": (244, 63, 94, 255),
        "p": (254, 205, 211, 255),
        "h": (255, 255, 255, 255),
        "v": (168, 85, 247, 255),
    }
    blood_rows = [
        "........................",
        "...........kk...........",
        "..........kRpk..........",
        ".........kRhhpk.........",
        "........kRRhhRrk........",
        ".......kRRRppRRdk.......",
        "......kRrrRRRRdddk......",
        ".....kRrrRRRRrrdddk.....",
        "....kRprRRRRRrrrdddk....",
        "....kRprRRRRrrrrdddk....",
        ".....krrRRRRrrrdddk.....",
        ".....kdrRRRrrrrddvk.....",
        "......kdrRRrrrddvk......",
        ".......kdrRrdddvkk......",
        "........kdddddvk........",
        ".........kdddvkk........",
        "..........kdvkk.........",
        "...........kk...........",
        "....kR..........Rk......",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
    ]
    mats.append(("core_mat_blood_shard", "Mảnh Huyết Thạch", "epic", build_pixel_sprite_24(blood_rows, blood_pal)))

    # 4. Than Lò Nhật Thực (Smoldering Eclipse Forge Coal)
    coal_pal = {
        "k": OUTLINE,
        "c": (51, 56, 72, 255),
        "C": (86, 94, 118, 255),
        "d": (30, 32, 44, 255),
        "o": (234, 88, 12, 255),
        "O": (251, 146, 60, 255),
        "y": (253, 224, 71, 255),
        "h": (255, 255, 255, 255),
    }
    coal_rows = [
        "........................",
        ".........kkkkkk.........",
        ".......kkCCCCCCkk.......",
        "......kCCCccccCCCk......",
        ".....kCCccoOOoccCCk.....",
        "....kCCccoOyyOoccCCk....",
        "...kCcccoOyhhOyocccCk...",
        "...kCcccoOyyyOOocdcCk...",
        "..kCccdoOOooooOOddccCk..",
        "..kCcddooOyyyyOooddcCk..",
        "..kCcdddoOOooOOddddcCk..",
        "...kdddddccOOccdddddk...",
        "...kddddccccccccddddk...",
        "....kdddddddddddddOk....",
        ".....kkkkkkkkkkkkkk.....",
        "......kO........Ok......",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
    ]
    mats.append(("core_mat_eclipse_coal", "Than Lò Nhật Thực", "rare", build_pixel_sprite_24(coal_rows, coal_pal)))

    # 5. Mảnh Đá Sao Rơi (Celestial Meteorite Shard)
    meteor_pal = {
        "k": OUTLINE,
        "s": (71, 85, 105, 255),
        "S": (148, 163, 184, 255),
        "g": (234, 179, 8, 255),
        "G": (250, 204, 21, 255),
        "y": (254, 240, 138, 255),
        "h": (255, 255, 255, 255),
    }
    meteor_rows = [
        "........................",
        ".....h............h.....",
        "..........kkkk..........",
        "........kkGGGGkk........",
        ".......kGGyyyyGGk.......",
        "......kGyhhhhhhyGk......",
        ".....kGGyhhhGGGgSSk.....",
        "....kGGyyyyGgggSSssk....",
        "...kGGyyyyGgggSSsssk....",
        "...kGGyyyGgggSSsssk.....",
        "....kGGgGgggSSsssk......",
        "....ksGGGGgSSsssk.......",
        ".....ksgggSSsssk........",
        "......ksssssssk.........",
        ".......kkkkkkk..........",
        "....h............y......",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
    ]
    mats.append(("core_mat_meteor_shard", "Mảnh Đá Sao Rơi", "legendary", build_pixel_sprite_24(meteor_rows, meteor_pal)))

    # 6. Trái Tim Nhật Thực (Split Sun-Gold / Void-Violet Eclipse Heart)
    heart_pal = {
        "k": OUTLINE,
        "v": (88, 28, 135, 255),
        "V": (147, 51, 234, 255),
        "m": (192, 132, 252, 255),
        "r": (244, 63, 94, 255),
        "g": (234, 179, 8, 255),
        "G": (250, 204, 21, 255),
        "y": (254, 240, 138, 255),
        "h": (255, 255, 255, 255),
    }
    heart_rows = [
        "........................",
        "..........kkkk..........",
        "......kkkkGGGGkkkk......",
        "....kkVVmmGGGGyyGGkk....",
        "...kVVmmkkGGGGyyhhGGk...",
        "..kVVmmkhhkkGyyhhhGGgk..",
        ".kVVmmkhhmmkrkyyGGGGggk.",
        ".kVVmkhhmVVkrkGGGGggggk.",
        ".kVVmkhmVVVkrkGGGGggggk.",
        ".kVVvmVVVVvkrkGGGgggggk.",
        "..kVVvvvvvkkrkggGGGGgk..",
        "...kVVvvvvkkGGggggggk...",
        "....kkVVVVGGGGggggkk....",
        "......kkkkGGGGkkkk......",
        "...h......kkkk......y...",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
    ]
    mats.append(("core_mat_eclipse_heart", "Trái Tim Nhật Thực", "legendary", build_pixel_sprite_24(heart_rows, heart_pal)))

    return mats


def main():
    if not SRC_IMG.exists():
        raise FileNotFoundError(f"Reference image not found: {SRC_IMG}")

    src = Image.open(SRC_IMG).convert("RGB")
    atlas = Image.new("RGBA", (COLS * CELL_SIZE, ROWS * CELL_SIZE), (0, 0, 0, 0))
    frames: dict[str, dict[str, int]] = {}
    cards_for_preview: list[tuple[str, str, str, Image.Image]] = []

    idx = 0
    for r in range(4):
        for c in range(4):
            key, label, rarity = CORE16_GRID[r * 4 + c]
            sprite = extract_clean_sprite(src, r, c, key)
            col_i = idx % COLS
            row_i = idx // COLS
            ax = col_i * CELL_SIZE
            ay = row_i * CELL_SIZE
            atlas.paste(sprite, (ax, ay), sprite)
            frames[key] = {"x": ax, "y": ay, "w": CELL_SIZE, "h": CELL_SIZE}
            cards_for_preview.append((key, label, rarity, sprite))
            idx += 1

    for key, label, rarity, sprite in make_core_materials():
        col_i = idx % COLS
        row_i = idx // COLS
        ax = col_i * CELL_SIZE
        ay = row_i * CELL_SIZE
        atlas.paste(sprite, (ax, ay), sprite)
        frames[key] = {"x": ax, "y": ay, "w": CELL_SIZE, "h": CELL_SIZE}
        cards_for_preview.append((key, label, rarity, sprite))
        idx += 1

    OUT_PNG.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(OUT_PNG, "PNG")
    OUT_JSON.write_text(
        json.dumps(
            {"tileSize": CELL_SIZE, "width": COLS * CELL_SIZE, "height": ROWS * CELL_SIZE, "frames": frames},
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    # Load Unicode Vietnamese font cleanly
    def load_font(size: int, bold = False):
        candidates = (
            [r"C:\Windows\Fonts\tahomabd.ttf", r"C:\Windows\Fonts\arialbd.ttf", r"C:\Windows\Fonts\seguisb.ttf"]
            if bold
            else [r"C:\Windows\Fonts\tahoma.ttf", r"C:\Windows\Fonts\segoeui.ttf", r"C:\Windows\Fonts\arial.ttf"]
        )
        for path in candidates:
            if os.path.exists(path):
                return ImageFont.truetype(path, size=size)
        return ImageFont.load_default()

    font_title = load_font(18, bold=True)
    font_sub = load_font(12, bold=False)
    font_rar = load_font(11, bold=True)
    font_name = load_font(13, bold=True)

    # Render crisp team preview poster (16 Core Items + 6 Core Materials)
    pw, ph = 1160, 810
    poster = Image.new("RGBA", (pw, ph), (16, 13, 28, 255))
    draw = ImageDraw.Draw(poster)
    draw.rectangle([10, 10, pw - 11, ph - 11], outline=(76, 68, 120, 255), width=3)
    draw.text((28, 20), "PIXTEL v3.1.1 — 16 VẬT PHẨM CỐT LÕI (HD 48×48) & 6 NGUYÊN LIỆU BOSS/ZONE", fill=(250, 204, 21, 255), font=font_title)
    draw.text((28, 46), "Trích xuất sắc nét từ Spritesheet 4×4 chuẩn + 6 icon nguyên liệu đồng bộ phong cách viền tối #1a1625", fill=(203, 213, 225, 255), font=font_sub)

    card_w, card_h = 266, 110
    gap_x, gap_y = 14, 12
    start_x, start_y = 28, 76
    for i, (_key, label, rarity, sprite) in enumerate(cards_for_preview):
        if i < 16:
            gx = i % 4
            gy = i // 4
            x = start_x + gx * (card_w + gap_x)
            y = start_y + gy * (card_h + gap_y)
        else:
            mi = i - 16
            gx = mi % 4
            gy = 4 + (mi // 4)
            x = start_x + gx * (card_w + gap_x)
            y = start_y + 18 + gy * (card_h + gap_y)

        rc = RARITY_COLORS[rarity]
        draw.rectangle([x, y, x + card_w, y + card_h], fill=(24, 20, 42, 255), outline=rc, width=2)
        draw.rectangle([x + 10, y + 12, x + 94, y + 96], fill=(16, 13, 28, 255), outline=(66, 60, 98, 255), width=2)
        big = sprite.resize((76, 76), Image.Resampling.NEAREST)
        poster.paste(big, (x + 14, y + 16), big)
        draw.text((x + 104, y + 14), f"[{rarity.upper()}]", fill=rc, font=font_rar)
        # Wrap Vietnamese label neatly
        words = label.split(" ")
        line1, line2 = "", ""
        for w_tok in words:
            if len(line1) + len(w_tok) + 1 <= 17:
                line1 = (line1 + " " + w_tok).strip()
            else:
                line2 = (line2 + " " + w_tok).strip()
        draw.text((x + 104, y + 36), line1, fill=(248, 250, 252, 255), font=font_name)
        if line2:
            draw.text((x + 104, y + 54), line2, fill=(248, 250, 252, 255), font=font_name)
        draw.text((x + 104, y + 80), "Sprite HD 48×48", fill=(148, 163, 184, 255), font=font_sub)

    OUT_PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    poster.save(OUT_PREVIEW, "PNG")
    print(f"Packed {len(frames)} sprites into {OUT_PNG} ({atlas.size}) and {OUT_PREVIEW}")


if __name__ == "__main__":
    main()
