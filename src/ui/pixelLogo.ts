const LOGO_GLYPHS: Record<string, string[]> = {
  P: ["1111110", "1100011", "1100011", "1111110", "1100000", "1100000", "1100000"],
  I: ["1111111", "0001100", "0001100", "0001100", "0001100", "0001100", "1111111"],
  X: ["1100011", "1100011", "0110110", "0001100", "0110110", "1100011", "1100011"],
  T: ["1111111", "0001100", "0001100", "0001100", "0001100", "0001100", "0001100"],
  E: ["1111111", "1100000", "1100000", "1111110", "1100000", "1100000", "1111111"],
  L: ["1100000", "1100000", "1100000", "1100000", "1100000", "1100000", "1111111"],
  "1": ["0001100", "0011100", "0001100", "0001100", "0001100", "0001100", "0111110"],
  "6": ["0011110", "0110000", "1100000", "1111110", "1100011", "1100011", "0111110"],
  "-": ["0000000", "0000000", "0000000", "1111111", "0000000", "0000000", "0000000"],
  B: ["1111110", "1100011", "1100011", "1111110", "1100011", "1100011", "1111110"],
};

/**
 * Renders the animated 16-bit PIXTEL prism emblem onto an offscreen 240x88 buffer
 * and scales it crisply to the target canvas.
 */
export function renderPixtelLogo(
  buffer: HTMLCanvasElement,
  bufferCtx: CanvasRenderingContext2D,
  outCanvas: HTMLCanvasElement,
  outCtx: CanvasRenderingContext2D,
  animT: number
) {
  const ctx = bufferCtx;
  const width = buffer.width;
  const height = buffer.height;
  const px = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
  };

  px(0, 0, width, height, "#090c16");
  for (let x = 0; x < width; x += 8) {
    px(x, 0, 1, height, x % 32 === 0 ? "#202b42" : "#121a2a");
  }
  for (let y = 0; y < height; y += 8) {
    px(0, y, width, 1, y % 32 === 0 ? "#202b42" : "#121a2a");
  }

  for (let i = 0; i < 28; i++) {
    const x = (i * 67 + 23) % width;
    const y = (i * 43 + 11) % height;
    const shimmer = Math.sin(animT * 2.4 + i * 1.7);
    if (shimmer > -0.15) {
      px(x, y, i % 7 === 0 ? 2 : 1, 1, i % 3 === 0 ? "#ffe066" : "#63eaff");
    }
  }

  const crestRows = [28, 40, 52, 60, 64, 60, 52, 40, 28];
  crestRows.forEach((rowWidth, row) => {
    const y = 3 + row * 3;
    px(120 - rowWidth / 2 + 2, y + 2, rowWidth, 3, "#03050a");
    px(120 - rowWidth / 2, y, rowWidth, 3, row % 2 === 0 ? "#6d5425" : "#b17e25");
  });

  const pillars = [
    { color: "#ff4761", shade: "#a81e40" },
    { color: "#ffd84d", shade: "#bd7417" },
    { color: "#42e6a3", shade: "#157b61" },
    { color: "#49dcff", shade: "#246cb5" },
    { color: "#b277ff", shade: "#6241bd" },
  ];
  pillars.forEach((pillar, index) => {
    const x = 91 + index * 14;
    const bob = Math.round(Math.sin(animT * 2.2 + index * 0.8));
    px(x, 9 + bob, 11, 6, pillar.color);
    px(x, 15 + bob, 11, 9, pillar.shade);
    px(x + 1, 10 + bob, 2, 3, "#fff4d0");
  });

  for (let i = 0; i < 14; i++) {
    const x = 98 + i * 3;
    const y = 30 - Math.round(i * 1.65);
    px(x - 2, y - 2, 6, 6, "#080a12");
    px(x, y, 2, 2, i > 7 ? "#38d9ff" : "#fff8d8");
  }
  px(105, 31, 30, 2, "#f7c74d");

  const letters = "PIXTEL";
  const scale = 4;
  const glyphWidth = 7 * scale;
  const gap = 4;
  const startX = Math.floor((width - (letters.length * glyphWidth + (letters.length - 1) * gap)) / 2);
  const startY = 37;
  const colors = [
    ["#ff6676", "#c72c51"],
    ["#ffe36b", "#d18b26"],
    ["#70f0b4", "#1a9c74"],
    ["#7ceaff", "#287fc4"],
    ["#c18aff", "#754bd1"],
    ["#ff93c4", "#d54485"],
  ];

  letters.split("").forEach((letter, index) => {
    const glyph = LOGO_GLYPHS[letter];
    const glyphX = startX + index * (glyphWidth + gap);
    const glyphY = startY + Math.round(Math.sin(animT * 3 + index * 0.8));
    glyph.forEach((row, rowIndex) => {
      for (let col = 0; col < row.length; col++) {
        if (row[col] !== "1") continue;
        const x = glyphX + col * scale;
        const y = glyphY + rowIndex * scale;
        px(x + 2, y + 2, scale, scale, "#03050a");
        px(x - 1, y, scale + 2, scale, "#080a12");
        px(x, y - 1, scale, scale + 2, "#080a12");
        px(x, y, scale, scale, rowIndex < 3 ? colors[index][0] : colors[index][1]);
        if (rowIndex === 0) px(x, y, scale, 1, "#ffffff");
      }
    });
  });

  const badge = "16-BIT";
  const badgeWidth = badge.length * 7 + (badge.length - 1);
  const badgeX = Math.floor((width - badgeWidth) / 2);
  const badgeY = 74;
  px(badgeX - 5, badgeY - 2, badgeWidth + 10, 11, "#03050a");
  px(badgeX - 4, badgeY - 1, badgeWidth + 8, 9, "#171d2d");
  px(badgeX - 4, badgeY - 1, badgeWidth + 8, 1, "#52def5");
  badge.split("").forEach((letter, index) => {
    const glyph = LOGO_GLYPHS[letter];
    glyph.forEach((row, rowIndex) => {
      for (let col = 0; col < row.length; col++) {
        if (row[col] === "1") {
          px(badgeX + index * 8 + col, badgeY + rowIndex, 1, 1, rowIndex < 3 ? "#ffffff" : "#8cecff");
        }
      }
    });
  });

  outCtx.clearRect(0, 0, outCanvas.width, outCanvas.height);
  outCtx.drawImage(buffer, 0, 0, width, height, 0, 0, outCanvas.width, outCanvas.height);
}
