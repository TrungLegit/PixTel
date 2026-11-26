import json
import os
import shutil
from PIL import Image, ImageDraw, ImageFont

ROOT = os.getcwd()
CACHE_DIR = os.path.join(ROOT, "node_modules", ".cache", "b1_preview_cache")
ASSETS_OUT = os.path.join(ROOT, "preview for devs", "assets")
os.makedirs(ASSETS_OUT, exist_ok=True)

ICON_ATLAS = Image.open(os.path.join(ROOT, "src", "assets", "codixel-icons.png")).convert("RGBA")
with open(os.path.join(ROOT, "src", "assets", "codixel-icons.json"), "r", encoding="utf-8") as f:
    ICON_META = json.load(f)["frames"]


def load_font(name, size):
    path = os.path.join("C:/Windows/Fonts", name)
    return ImageFont.truetype(path, size)


F_TITLE = load_font("arialbd.ttf", 24)
F_SUB = load_font("arial.ttf", 14)
F_TAG = load_font("consolab.ttf", 13)
F_NAME = load_font("arialbd.ttf", 17)
F_META = load_font("consolab.ttf", 12)
F_BODY = load_font("arial.ttf", 13)
F_SMALL = load_font("consolab.ttf", 11)


def crop_icon(key):
    fr = ICON_META[key]
    return ICON_ATLAS.crop((fr["x"], fr["y"], fr["x"] + fr["w"], fr["y"] + fr["h"]))


def load_rgba(path, w, h):
    with open(path, "rb") as f:
        return Image.frombytes("RGBA", (w, h), f.read())


def wrap_text(draw, text, font, max_w):
    words = text.split(" ")
    lines = []
    cur = ""
    for w in words:
        cand = (cur + " " + w).strip()
        bbox = draw.textbbox((0, 0), cand, font=font)
        if bbox[2] - bbox[0] <= max_w:
            cur = cand
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


# =========================================================================
# 1. Build batch1_items_sheet.png (1280 x 820)
# =========================================================================

W, H = 1280, 820
sheet = Image.new("RGB", (W, H), "#0b0916")
draw = ImageDraw.Draw(sheet)

# Subtle 16x16 background grid
for gx in range(0, W, 16):
    draw.line([(gx, 0), (gx, H)], fill="#141026", width=1)
for gy in range(0, H, 16):
    draw.line([(0, gy), (W, gy)], fill="#141026", width=1)

# Top Header Banner
draw.rectangle([24, 16, W - 24, 92], fill="#131024", outline="#382f66", width=2)
draw.text((42, 26), "PIXTEL — BATCH 1 PRODUCTION ITEMS (4 UNIQUE GEAR)", font=F_TITLE, fill="#ffe066")
draw.text(
    (42, 58),
    "24x24 Codixel Icons (1x & 4x)  ·  Bespoke 3D Rig Poses  ·  Weapon [E] Skills & Cursed Passive",
    font=F_SUB,
    fill="#cbd5e1",
)
# Tag pill top right
draw.rectangle([W - 186, 32, W - 42, 66], fill="#0e1c2b", outline="#5ef2ff", width=2)
draw.text((W - 168, 42), "BATCH 1 · M1", font=F_TAG, fill="#5ef2ff")

CARDS = [
    {
        "id": "b1_wpn_refract_lance",
        "name": "Thương Lăng Kính Khúc Xạ",
        "classLabel": "PRISM KNIGHT · T3 RARE",
        "rarityCol": "#60a5fa",
        "tier": "T3",
        "spriteKey": "b1_refract_lance",
        "skillIconKey": "ws_b1_refract_lance",
        "stats": ["+24 ATK", "+10% CRIT", "+14% ELEM", "+14% POISE", "+35 HP", "+4 DEF"],
        "skillTitle": "[E] Thương Khúc Xạ",
        "skillTag": "5.2s · PRISM",
        "skillCol": "#5ef2ff",
        "skillDesc": "Đâm băng xuyên tuyến 76px (1.55×) rồi tách 3 tia Lăng Kính (0.42×/tia) tự kích Khúc Xạ Cầu Vồng.",
        "source": "Lò Rèn: 135G + 4 Thạch Anh + 4 Mảnh Lăng Kính + 1 Bột Lam",
    },
    {
        "id": "b1_wpn_tempest_astrolabe",
        "name": "Tinh Bàn Bão Tố",
        "classLabel": "CHROMA MAGE · T4 EPIC",
        "rarityCol": "#c084fc",
        "tier": "T4",
        "spriteKey": "b1_tempest_astrolabe",
        "skillIconKey": "ws_b1_tri_cascade",
        "stats": ["+33 ATK", "+14% CRIT", "+25% ELEM", "-6% SKILL CD"],
        "skillTitle": "[E] Thiên Bàn Bão Tố",
        "skillTag": "5.4s · VOLT",
        "skillCol": "#5ef2d6",
        "skillDesc": "Cuộn gió hút gom quái (0.65× Wind), sau 0.45s giáng sét nổ 56px (1.75× Volt, choáng) kích Lốc Sét Cộng Hưởng.",
        "source": "Lò Rèn: 260G + 4 Hổ Phách + 4 Thạch Anh + Bột Phong & Lôi",
    },
    {
        "id": "b1_wpn_chrono_disruptor",
        "name": "Pháo Phá Vỡ Thời Không",
        "classLabel": "PIXEL TINKER · T5 LEGENDARY",
        "rarityCol": "#fbbf24",
        "tier": "T5",
        "spriteKey": "b1_chrono_disruptor",
        "skillIconKey": "ws_b1_chrono_mines",
        "stats": ["+48 ATK", "+20% CRIT", "+30% ELEM", "+20% POISE", "+12 SPD"],
        "skillTitle": "[E] Mạng Lưới Mìn Lượng Tử",
        "skillTag": "5.8s · QUAKE",
        "skillCol": "#66eeff",
        "skillDesc": "Giật lùi 0.24s bất tử, Quá Tải toàn bộ Trụ 5s & rải 3 Mìn Băng/Chấn Động (0.85×/quả) kích Băng Nứt Địa Chấn.",
        "source": "Drop-Only: Boss / Tinh Anh Tàn Tích Hư Vô (Batch 1)",
    },
    {
        "id": "b1_arm_crimson_ward",
        "name": "Huyết Giáp Cuồng Huyết",
        "classLabel": "ALL CLASSES · T4 CURSED ARMOR",
        "rarityCol": "#f43f5e",
        "tier": "T4",
        "spriteKey": "b1_crimson_ward",
        "skillIconKey": "b1_passive_blood_frenzy",
        "stats": ["+16 DEF", "+145 HP", "+16 ATK", "+8% CRIT", "+20% CDMG"],
        "skillTitle": "[CURSE] Khế Ước Cuồng Huyết",
        "skillTag": "ICD 3.5s · VOID",
        "skillCol": "#fb7185",
        "skillDesc": "Nguyền Rủa: Nhận +18% sát thương; khi trúng đòn nổ Sóng Huyết Hư Không 64px (1.35×) & +22% ATK / +10% Crit 4s.",
        "source": "Drop-Only (Nguyền Rủa): Quái/Boss Hổ Phách & Tàn Tích",
    },
]

CARD_W, CARD_H = 604, 336
GAP = 24
START_X, START_Y = 24, 108

for idx, c in enumerate(CARDS):
    col_i = idx % 2
    row_i = idx // 2
    cx = START_X + col_i * (CARD_W + GAP)
    cy = START_Y + row_i * (CARD_H + GAP)
    rcol = c["rarityCol"]

    # Outer card & subtle top accent bar
    draw.rectangle([cx, cy, cx + CARD_W, cy + CARD_H], fill="#131024", outline=rcol, width=2)
    draw.rectangle([cx + 2, cy + 2, cx + CARD_W - 2, cy + 8], fill=rcol)

    # Left Showcase Column
    # 1) 4x Primary Icon Pedestal (108 x 108)
    px4, py4 = cx + 16, cy + 20
    draw.rectangle([px4, py4, px4 + 108, py4 + 108], fill="#0c0918", outline=rcol, width=2)
    icon_raw = crop_icon(c["spriteKey"])
    icon_4x = icon_raw.resize((96, 96), Image.Resampling.NEAREST)
    sheet.paste(icon_4x, (px4 + 6, py4 + 6), icon_4x)
    # Tier tag pill
    draw.rectangle([px4 + 4, py4 + 4, px4 + 28, py4 + 20], fill="#191332", outline=rcol, width=1)
    draw.text((px4 + 8, py4 + 6), c["tier"], font=F_SMALL, fill=rcol)

    # 2) 1x Native Icon Box (36 x 36) + label below 4x box
    px1, py1 = cx + 16, cy + 138
    draw.rectangle([px1, py1, px1 + 36, py1 + 36], fill="#0c0918", outline="#2b244d", width=1)
    sheet.paste(icon_raw, (px1 + 6, py1 + 6), icon_raw)
    draw.text((px1 + 8, py1 + 40), "1x", font=F_SMALL, fill="#94a3b8")

    # 3) 3D Rigged Hero Pose Box (108 x 108) right next to 1x box (overlapping nicely or stacked)
    # Wait: let's put 3D Rig Pose (108x108) right below at (cx+60, cy+138) & 1x above/beside it!
    rx, ry = cx + 60, cy + 138
    draw.rectangle([rx, ry, rx + 108, ry + 108], fill="#0c0918", outline="#383061", width=1)
    rig_img = load_rgba(os.path.join(CACHE_DIR, f"rig_{c['id']}.rgba"), 108, 108)
    sheet.paste(rig_img, (rx, ry))
    draw.text((rx + 4, ry + 112), "3D HERO RIG POSE", font=F_SMALL, fill="#94a3b8")

    # 4) Right Column: Title, Class/Rarity Pill, Stats, Skill Box, Source Footer
    tx = cx + 184
    tw = CARD_W - 200
    draw.text((tx, cy + 18), c["name"], font=F_NAME, fill=rcol)
    draw.rectangle([tx, cy + 42, tx + tw, cy + 62], fill="#0e0b1b", outline="#2b244d", width=1)
    draw.text((tx + 8, cy + 45), c["classLabel"], font=F_SMALL, fill="#e2e8f0")

    # Stat pills (wrap neatly across 2 rows)
    sx, sy = tx, cy + 72
    for st in c["stats"]:
        sb = draw.textbbox((0, 0), st, font=F_SMALL)
        pw = (sb[2] - sb[0]) + 14
        if sx + pw > tx + tw:
            sx = tx
            sy += 24
        draw.rectangle([sx, sy, sx + pw, sy + 20], fill="#0e0b1b", outline="#342b5c", width=1)
        st_col = "#fb7185" if "DEF" in st or "HP" in st else "#ffe066" if "CRIT" in st or "CDMG" in st else "#5ef2ff"
        draw.text((sx + 7, sy + 4), st, font=F_SMALL, fill=st_col)
        sx += pw + 6

    # Skill / Passive Showcase Box
    sk_y = cy + 128
    sk_h = 136
    draw.rectangle([tx, sk_y, tx + tw, sk_y + sk_h], fill="#0e0b1b", outline="#2f2754", width=1)
    # 2x Skill Icon (48x48 inside 56x56 frame)
    draw.rectangle([tx + 10, sk_y + 12, tx + 66, sk_y + 68], fill="#090714", outline=c["skillCol"], width=1)
    sk_raw = crop_icon(c["skillIconKey"])
    sk_2x = sk_raw.resize((48, 48), Image.Resampling.NEAREST)
    sheet.paste(sk_2x, (tx + 14, sk_y + 16), sk_2x)
    draw.text((tx + 30, sk_y + 72), "2x", font=F_SMALL, fill="#94a3b8")

    draw.text((tx + 78, sk_y + 12), c["skillTitle"], font=F_NAME, fill="#ffe066")
    draw.text((tx + 78, sk_y + 34), c["skillTag"], font=F_META, fill=c["skillCol"])
    lines = wrap_text(draw, c["skillDesc"], F_BODY, tw - 88)
    for li, line in enumerate(lines[:4]):
        draw.text((tx + 78, sk_y + 54 + li * 18), line, font=F_BODY, fill="#cbd5e1")

    # Footer Source Line
    draw.rectangle([tx, cy + 276, tx + tw, cy + 314], fill="#0b0817", outline="#282148", width=1)
    src_lines = wrap_text(draw, c["source"], F_SMALL, tw - 16)
    for li, sl in enumerate(src_lines[:2]):
        draw.text((tx + 8, cy + 281 + li * 14), sl, font=F_SMALL, fill="#94a3b8")

out_items_sheet = os.path.join(ASSETS_OUT, "batch1_items_sheet.png")
sheet.save(out_items_sheet, format="PNG")
print(f"[python] Saved {out_items_sheet} ({sheet.size})")

# =========================================================================
# 2. Export 4 Animated GIFs & Contact Sheet (batch1_items_vfx_sheet.png)
# =========================================================================

with open(os.path.join(CACHE_DIR, "manifest.json"), "r", encoding="utf-8") as f:
    manifest = json.load(f)

SAMPLE_COLS = 8
CELL_SCALE = 2
ROW_PAD = 18
HDR_H = 82

# Compute contact sheet dimensions dynamically from frame widths
row_heights = []
max_row_w = 0
for m in manifest:
    fw, fh = m["w"] * CELL_SCALE, m["h"] * CELL_SCALE
    rw = SAMPLE_COLS * (fw + 10) - 10 + 48
    max_row_w = max(max_row_w, rw)
    row_heights.append(36 + fh + 26)

CS_W = max(1120, max_row_w)
CS_H = HDR_H + sum(row_heights) + len(manifest) * ROW_PAD + 24

cs = Image.new("RGB", (CS_W, CS_H), "#0f0d1a")
cs_draw = ImageDraw.Draw(cs)
cs_draw.rectangle([2, 2, CS_W - 3, CS_H - 3], outline="#4c4478", width=2)
cs_draw.text((24, 18), "PIXTEL BATCH 1 — 4 ITEM PIXELFX VFX CONTACT SHEET", font=F_TITLE, fill="#facc15")
cs_draw.text(
    (24, 50),
    "Dual-Buffer (Color + Additive Light) · 8 Key Animation Frames per Effect · 2x Nearest-Neighbor",
    font=F_SUB,
    fill="#cbd5e1",
)

cur_y = HDR_H
for m in manifest:
    item_id = m["itemId"]
    w, h = m["w"], m["h"]
    fps, dur, n = m["fps"], m["duration"], m["n"]
    fx_dir = os.path.join(CACHE_DIR, item_id)

    # A) Build animated GIF from solid #181a26 frames
    gif_scale = max(2, min(3, 288 // max(w, h)))
    quant_frames = []
    for i in range(n):
        pad = f"{i:03d}"
        im = load_rgba(os.path.join(fx_dir, f"gif_f{pad}.rgba"), w, h)
        up = im.resize((w * gif_scale, h * gif_scale), Image.Resampling.NEAREST).convert("RGB")
        q = up.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
        quant_frames.append(q)

    # Hold clean final frame briefly on one-shots (~150ms)
    if not m["loop"]:
        for _ in range(3):
            quant_frames.append(quant_frames[-1])

    out_gif = os.path.join(ASSETS_OUT, f"batch1_item_{item_id}_fx.gif")
    frame_ms = max(20, round(1000 / fps / 10) * 10)
    quant_frames[0].save(
        out_gif,
        format="GIF",
        save_all=True,
        append_images=quant_frames[1:],
        duration=frame_ms,
        loop=0,
        disposal=2,
        optimize=False,
    )
    print(f"[python] Saved {out_gif} ({len(quant_frames)} frames, {w*gif_scale}x{h*gif_scale}, {frame_ms}ms)")

    # B) Populate Contact Sheet row (8 key frames including peak + active + clean final)
    cs_draw.text(
        (24, cur_y),
        f"{m['fxId']}  ({item_id})  —  {w}x{h} · {fps} FPS · {dur:.2f}s · {'LOOP' if m['loop'] else 'ONE-SHOT'}",
        font=F_NAME,
        fill="#5ef2ff",
    )
    cs_draw.text((24, cur_y + 20), m["desc"], font=F_SMALL, fill="#94a3b8")

    # Choose 8 evenly-spaced key indices ensuring index 0, ~peak, and n-1
    if n <= SAMPLE_COLS:
        indices = list(range(n))
    else:
        indices = [round(i * (n - 1) / (SAMPLE_COLS - 1)) for i in range(SAMPLE_COLS)]

    fw, fh = w * CELL_SCALE, h * CELL_SCALE
    fy = cur_y + 42
    for j, fi in enumerate(indices):
        fx = 24 + j * (fw + 10)
        pad = f"{fi:03d}"
        im = load_rgba(os.path.join(fx_dir, f"sheet_f{pad}.rgba"), w, h).convert("RGB")
        up = im.resize((fw, fh), Image.Resampling.NEAREST)
        cs.paste(up, (fx, fy))
        cs_draw.rectangle([fx - 1, fy - 1, fx + fw, fy + fh], outline="#3a3656", width=1)
        ts = m["timestamps"][fi]
        cs_draw.text((fx + 4, fy + fh + 4), f"F{fi} {ts:.2f}s", font=F_SMALL, fill="#cbd5e1")

    cur_y += 42 + fh + 28 + ROW_PAD

out_vfx_sheet = os.path.join(ASSETS_OUT, "batch1_items_vfx_sheet.png")
cs.save(out_vfx_sheet, format="PNG")
print(f"[python] Saved {out_vfx_sheet} ({cs.size})")

# Clean up temporary cache directories
shutil.rmtree(CACHE_DIR, ignore_errors=True)
icons_check = os.path.join(ROOT, "node_modules", ".cache", "b1_icons_check.png")
if os.path.exists(icons_check):
    os.remove(icons_check)
print("[python] Cleaned up temporary cache artifacts.")
