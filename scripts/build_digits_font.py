"""
Generates `src/assets/pixtel-digits.woff2`: a tiny, 100% self-hosted 5x7 16-bit pixel-art
numeric font (digits 0-9 only, unicode-range: U+0030-0039) calibrated to match
Pixelify Sans Variable's exact baseline, cap-height & advance width, while making
digit '5' (and 0/2/3/6/8/9) razor-sharp and unmistakable at every size & weight.
"""
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from pathlib import Path

OUT_WOFF2 = Path("src/assets/pixtel-digits.woff2")

# 5x7 pixel-art bitmaps matching Pixelify Sans cap height (y: 0..644, cell: 92x92)
# Notice '5' has a razor-sharp flat top bar and 3 wide-open bottom-left rows — NEVER looks like '8'!
GLYPHS = {
    "zero": (
        586,
        [
            ".###.",
            "#...#",
            "#...#",
            "#...#",
            "#...#",
            "#...#",
            ".###.",
        ],
    ),
    "one": (
        460,
        [
            "..#.",
            ".##.",
            "..#.",
            "..#.",
            "..#.",
            "..#.",
            ".###",
        ],
    ),
    "two": (
        586,
        [
            ".###.",
            "#...#",
            "....#",
            "..##.",
            ".#...",
            "#....",
            "#####",
        ],
    ),
    "three": (
        586,
        [
            "####.",
            "....#",
            "....#",
            ".###.",
            "....#",
            "....#",
            "####.",
        ],
    ),
    "four": (
        586,
        [
            "...#.",
            "..##.",
            ".#.#.",
            "#..#.",
            "#####",
            "...#.",
            "...#.",
        ],
    ),
    "five": (
        586,
        [
            "#####",
            "#....",
            "####.",
            "....#",
            "....#",
            "....#",
            "####.",
        ],
    ),
    "six": (
        586,
        [
            ".###.",
            "#....",
            "#....",
            "####.",
            "#...#",
            "#...#",
            ".###.",
        ],
    ),
    "seven": (
        586,
        [
            "#####",
            "....#",
            "...#.",
            "..#..",
            ".#...",
            ".#...",
            ".#...",
        ],
    ),
    "eight": (
        586,
        [
            ".###.",
            "#...#",
            "#...#",
            ".###.",
            "#...#",
            "#...#",
            ".###.",
        ],
    ),
    "nine": (
        586,
        [
            ".###.",
            "#...#",
            "#...#",
            ".####",
            "....#",
            "....#",
            ".###.",
        ],
    ),
}

CELL_W = 92
CELL_H = 92
X_OFF = 62
Y_BASE = 0


def build_bitmap_glyph(rows):
    pen = TTGlyphPen(None)
    h = len(rows)
    for r, line in enumerate(rows):
        y0 = Y_BASE + (h - 1 - r) * CELL_H
        y1 = y0 + CELL_H
        # Merge contiguous horizontal '#' runs into single crisp rectangles
        c = 0
        w = len(line)
        while c < w:
            if line[c] != "#":
                c += 1
                continue
            c0 = c
            while c < w and line[c] == "#":
                c += 1
            x0 = X_OFF + c0 * CELL_W
            x1 = X_OFF + c * CELL_W
            # Clockwise outer contour for TrueType
            pen.moveTo((x0, y0))
            pen.lineTo((x0, y1))
            pen.lineTo((x1, y1))
            pen.lineTo((x1, y0))
            pen.closePath()
    return pen.glyph()


def main():
    glyph_order = [".notdef"] + list(GLYPHS.keys())
    fb = FontBuilder(1000, isTTF=True)
    fb.setupGlyphOrder(glyph_order)

    cmap = {
        ord("0"): "zero",
        ord("1"): "one",
        ord("2"): "two",
        ord("3"): "three",
        ord("4"): "four",
        ord("5"): "five",
        ord("6"): "six",
        ord("7"): "seven",
        ord("8"): "eight",
        ord("9"): "nine",
    }
    fb.setupCharacterMap(cmap)

    glyf_map = {".notdef": TTGlyphPen(None).glyph()}
    metrics = {".notdef": (586, 0)}

    for name, (adv, rows) in GLYPHS.items():
        g = build_bitmap_glyph(rows)
        glyf_map[name] = g
        metrics[name] = (adv, X_OFF)

    fb.setupGlyf(glyf_map)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=920, descent=-280)
    fb.setupNameTable(
        {
            "familyName": "PixTel Digits",
            "styleName": "Regular",
        }
    )
    fb.setupOS2(
        sTypoAscender=920,
        sTypoDescender=-280,
        usWinAscent=920,
        usWinDescent=280,
        sxHeight=450,
        sCapHeight=644,
    )
    fb.setupPost()

    font = fb.font
    font.flavor = "woff2"
    OUT_WOFF2.parent.mkdir(parents=True, exist_ok=True)
    font.save(str(OUT_WOFF2))
    print(f"Saved {OUT_WOFF2} ({OUT_WOFF2.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
