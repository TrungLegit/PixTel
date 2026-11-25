import { CLASSES } from "../data/classes";
import type { ClassId } from "../data/types";
import { drawPixelfxHero, getClassShowcaseEquipment, getPixelfxHeroCompiled, type HeroAttackKind } from "../graphics/pixelfxHeroModels";
import { createFrame, clearFrame, createFx, PAL } from "../vfx/pixelfx/core/index.js";
import { PIXELFX_MODS } from "../vfx/vfxManager";
import type { PixelfxFrame, PixelfxInstance } from "../vfx/pixelfxTypes";
import type { PixTelOpenWorldGame } from "../game";
import { sfx } from "../audio/chiptuneSynth";

const LOGO_GLYPHS: Record<string, string[]> = {
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  X: ["10001", "01010", "00100", "00100", "01010", "10001", "10001"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
};

interface CardPreview {
  classId: ClassId;
  spriteCanvas: HTMLCanvasElement;
  spriteCtx: CanvasRenderingContext2D;
  fxCanvas: HTMLCanvasElement;
  fxCtx: CanvasRenderingContext2D;
  colorCanvas: HTMLCanvasElement;
  colorCtx: CanvasRenderingContext2D;
  colorImg: ImageData;
  colorU32: Uint32Array;
  lightCanvas: HTMLCanvasElement;
  lightCtx: CanvasRenderingContext2D;
  lightImg: ImageData;
  lightU32: Uint32Array;
  frame: PixelfxFrame;
  fx: PixelfxInstance | null;
  modId: string;
  cooldown: number;
}

/**
 * Title / Class Select overlay — also reused when interacting with Origin Town's Class Altar!
 * Renders animated 16x16 class sprites + live pixelfx skill preview canvases.
 */
export class ClassSelectUI {
  private root: HTMLElement;
  private gridEl: HTMLElement;
  private continueBtn: HTMLButtonElement;
  private closeBtn: HTMLButtonElement;
  private titleSubEl: HTMLElement;
  private logoCanvas: HTMLCanvasElement;
  private logoCtx: CanvasRenderingContext2D;
  private logoBuffer: HTMLCanvasElement;
  private logoBufferCtx: CanvasRenderingContext2D;
  private selectedId: ClassId = "prism_knight";
  private switchingMode = false;
  private previews: CardPreview[] = [];
  private rafId = 0;
  private lastT = 0;
  private animT = 0;
  private game: PixTelOpenWorldGame;

  constructor(game: PixTelOpenWorldGame) {
    this.game = game;
    this.root = document.getElementById("screen-class-select")!;
    this.gridEl = document.getElementById("class-grid")!;
    this.continueBtn = document.getElementById("btn-continue-save") as HTMLButtonElement;
    this.closeBtn = document.getElementById("btn-close-class-select") as HTMLButtonElement;
    this.titleSubEl = document.getElementById("class-select-subtitle")!;
    this.logoCanvas = document.getElementById("pixtel-logo") as HTMLCanvasElement;
    this.logoCtx = this.logoCanvas.getContext("2d")!;
    this.logoCtx.imageSmoothingEnabled = false;
    this.logoBuffer = document.createElement("canvas");
    this.logoBuffer.width = 240;
    this.logoBuffer.height = 80;
    this.logoBufferCtx = this.logoBuffer.getContext("2d")!;
    this.logoBufferCtx.imageSmoothingEnabled = false;

    this._buildCards();
    this._drawLogo();

    document.getElementById("btn-start-adventure")!.addEventListener("click", () => {
      sfx.unlock();
      sfx.playUiClick();
      if (this.switchingMode) {
        this.game.switchClassInTown(this.selectedId);
      } else {
        const chk = document.getElementById("chk-newbie-guide") as HTMLInputElement | null;
        const enableGuide = chk ? chk.checked : true;
        this.game.startNewGame(this.selectedId, enableGuide);
      }
    });

    document.getElementById("btn-open-tutorial")?.addEventListener("click", () => {
      sfx.unlock();
      sfx.playUiClick();
      this.game.openTutorialFromTitle();
    });

    this.continueBtn.addEventListener("click", () => {
      sfx.unlock();
      sfx.playUiClick();
      this.game.loadSavedGame();
    });

    this.closeBtn.addEventListener("click", () => {
      sfx.playUiClick();
      this.game.setModal(null);
    });
  }

  private _buildCards() {
    this.gridEl.innerHTML = "";
    this.previews = [];

    for (const cls of CLASSES) {
      const card = document.createElement("div");
      card.className = "class-card";
      card.dataset.classId = cls.id;
      card.style.setProperty("--accent", cls.accent);

      const bars = (label: string, val: number) => {
        let blocks = "";
        for (let i = 0; i < 5; i++) {
          blocks += `<span class="stat-pip ${i < val ? "on" : ""}"></span>`;
        }
        return `<div class="stat-row"><span>${label}</span><div class="stat-pips">${blocks}</div></div>`;
      };

      card.innerHTML = `
        <div class="class-card-head">
          <canvas class="class-sprite-cv" width="84" height="68"></canvas>
          <div class="class-card-meta">
            <div class="class-name" style="color:${cls.accent}">${cls.name}</div>
            <div class="class-vn">${cls.vnName}</div>
            <div class="class-role">${cls.role} · ${cls.weaponType}</div>
          </div>
        </div>
        <div class="class-fx-box">
          <canvas class="class-fx-cv" width="144" height="68"></canvas>
          <span class="fx-tag">PIXELFX PREVIEW</span>
        </div>
        <div class="class-stats">
          ${bars("HP ", cls.uiBars.hp)}
          ${bars("ATK", cls.uiBars.atk)}
          ${bars("SPD", cls.uiBars.spd)}
        </div>
        <div class="class-skills">
          <div><b>LMB:</b> ${cls.skills.lmb.name}</div>
          <div><b>Giữ LMB:</b> ${cls.skills.charge.name}</div>
          <div><b>[E]:</b> ${cls.skills.skill.name}</div>
          <div><b>[Q]:</b> ${cls.skills.ult.name}</div>
        </div>
      `;

      card.addEventListener("click", () => {
        sfx.unlock();
        sfx.playUiClick();
        this.selectClass(cls.id);
      });

      this.gridEl.appendChild(card);

      const spriteCanvas = card.querySelector(".class-sprite-cv") as HTMLCanvasElement;
      const spriteCtx = spriteCanvas.getContext("2d")!;
      spriteCtx.imageSmoothingEnabled = false;

      const fxCanvas = card.querySelector(".class-fx-cv") as HTMLCanvasElement;
      const fxCtx = fxCanvas.getContext("2d")!;
      fxCtx.imageSmoothingEnabled = false;

      const w = fxCanvas.width;
      const h = fxCanvas.height;
      const colorCanvas = document.createElement("canvas");
      colorCanvas.width = w;
      colorCanvas.height = h;
      const colorCtx = colorCanvas.getContext("2d")!;
      const colorImg = colorCtx.createImageData(w, h);

      const lightCanvas = document.createElement("canvas");
      lightCanvas.width = w;
      lightCanvas.height = h;
      const lightCtx = lightCanvas.getContext("2d")!;
      const lightImg = lightCtx.createImageData(w, h);

      this.previews.push({
        classId: cls.id,
        spriteCanvas,
        spriteCtx,
        fxCanvas,
        fxCtx,
        colorCanvas,
        colorCtx,
        colorImg,
        colorU32: new Uint32Array(colorImg.data.buffer),
        lightCanvas,
        lightCtx,
        lightImg,
        lightU32: new Uint32Array(lightImg.data.buffer),
        frame: createFrame(w, h, 0, 0),
        fx: null,
        modId: cls.previewFx,
        cooldown: 0.1,
      });
    }

    this.selectClass("prism_knight");
  }

  selectClass(id: ClassId) {
    this.selectedId = id;
    for (const el of Array.from(this.gridEl.querySelectorAll(".class-card"))) {
      el.classList.toggle("selected", (el as HTMLElement).dataset.classId === id);
    }
  }

  show(switching: boolean) {
    this.switchingMode = switching;
    this.root.classList.remove("hidden");

    const startBtn = document.getElementById("btn-start-adventure")!;
    const guideWrap = document.getElementById("newbie-guide-wrap");
    if (switching) {
      this.selectClass(this.game.player.classId);
      this.titleSubEl.textContent = "ĐÀI ĐỔI CLASS — Chọn nhân vật mới (giữ nguyên cấp độ, trang bị & nhiệm vụ)";
      startBtn.textContent = "ĐỔI SANG CLASS NÀY";
      this.continueBtn.classList.add("hidden");
      this.closeBtn.classList.remove("hidden");
      guideWrap?.classList.add("hidden");
    } else {
      this.titleSubEl.textContent = "THẾ GIỚI MỞ 16-BIT ACTION RPG — Đánh thức Trụ Sắc Màu & tiêu diệt The Eraser";
      startBtn.textContent = "BẮT ĐẦU PHIÊU LƯU MỚI";
      this.continueBtn.classList.toggle("hidden", !this.game.saveSys.hasSave());
      this.closeBtn.classList.add("hidden");
      guideWrap?.classList.remove("hidden");
    }

    if (!this.rafId) {
      this.lastT = performance.now();
      const loop = (now: number) => {
        if (this.root.classList.contains("hidden")) {
          this.rafId = 0;
          return;
        }
        const dt = Math.min(0.05, Math.max(0.001, (now - this.lastT) / 1000));
        this.lastT = now;
        this._tickPreviews(dt);
        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);
    }
  }

  hide() {
    this.root.classList.add("hidden");
  }

  private _spawnPreviewFx(p: CardPreview) {
    const mod = PIXELFX_MODS[p.modId];
    if (!mod) return;
    if (p.classId === "prism_knight") {
      p.fx = createFx(mod, { x: 16, y: 34, angle: 0, length: 112, palette: PAL.cyber, seed: 7 });
    } else if (p.classId === "chroma_mage") {
      p.fx = createFx(mod, { x: 72, y: 36, radius: 24, seed: 11 });
    } else if (p.classId === "bit_rogue") {
      p.fx = createFx(mod, { x: 72, y: 52, actor: getPixelfxHeroCompiled("bit_rogue", 0).actor, seed: 19 });
    } else {
      p.fx = createFx(mod, { x: 72, y: 46, seed: 23 });
    }
  }

  private _tickPreviews(dt: number) {
    this.animT += dt;
    this._drawLogo();
    const frameIdx = Math.floor(this.animT * 5) % 4;
    const previewAttackKind: Record<ClassId, HeroAttackKind> = {
      prism_knight: "beam",
      chroma_mage: "cast_heavy",
      bit_rogue: "spin",
      pixel_tinker: "shoot_heavy",
    };

    for (const p of this.previews) {
      // Live pixelfx two-buffer preview (ticked first so hero anim locks directly to p.fx.t)
      if (!p.fx) {
        p.cooldown -= dt;
        if (p.cooldown <= 0) this._spawnPreviewFx(p);
      } else {
        p.fx.update(dt);
        if (p.fx.done()) {
          p.fx = null;
          p.cooldown = 0.35;
        }
      }

      const fxActive = Boolean(p.fx && p.fx.t < 0.62);
      const animState = fxActive ? "attack" : "run";
      const attackProgress = p.fx ? Math.min(1, p.fx.t / 0.58) : 0;

      // Animated 3D-rigged pixelfx Class Hero showcase synchronized with p.fx!
      p.spriteCtx.clearRect(0, 0, p.spriteCanvas.width, p.spriteCanvas.height);
      p.spriteCtx.fillStyle = "#100e1c";
      p.spriteCtx.fillRect(0, 0, p.spriteCanvas.width, p.spriteCanvas.height);
      p.spriteCtx.fillStyle = "#262242";
      p.spriteCtx.fillRect(18, 56, 48, 5);
      p.spriteCtx.fillStyle = "#3a3561";
      p.spriteCtx.fillRect(22, 54, 40, 3);
      drawPixelfxHero(p.spriteCtx, {
        classId: p.classId,
        equipment: getClassShowcaseEquipment(p.classId),
        x: 42,
        y: 58,
        rigScale: 1.0,
        drawScale: 1,
        walkFrame: frameIdx,
        facing: 1,
        animState,
        attackKind: previewAttackKind[p.classId],
        attackProgress,
        time: this.animT,
      });

      p.fxCtx.fillStyle = "#100e1c";
      p.fxCtx.fillRect(0, 0, p.fxCanvas.width, p.fxCanvas.height);

      if (p.fx) {
        clearFrame(p.frame);
        p.fx.draw(p.frame, "back");
        p.fx.draw(p.frame, "front");
        p.colorU32.set(p.frame.color);
        p.colorCtx.putImageData(p.colorImg, 0, 0);
        p.fxCtx.drawImage(p.colorCanvas, 0, 0);

        p.lightU32.set(p.frame.light);
        p.lightCtx.putImageData(p.lightImg, 0, 0);
        p.fxCtx.save();
        p.fxCtx.globalCompositeOperation = "lighter";
        p.fxCtx.drawImage(p.lightCanvas, 0, 0);
        p.fxCtx.restore();
      }
    }
  }

  private _drawLogo() {
    const ctx = this.logoBufferCtx;
    const width = this.logoBuffer.width;
    const height = this.logoBuffer.height;
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
      const shimmer = Math.sin(this.animT * 2.4 + i * 1.7);
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
      const bob = Math.round(Math.sin(this.animT * 2.2 + index * 0.8));
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
    const scale = 3;
    const glyphWidth = 5 * scale;
    const gap = 5;
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
      const glyphY = startY + Math.round(Math.sin(this.animT * 3 + index * 0.8));
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
    const badgeWidth = badge.length * 5 + (badge.length - 1);
    const badgeX = Math.floor((width - badgeWidth) / 2);
    const badgeY = 64;
    px(badgeX - 5, badgeY - 2, badgeWidth + 10, 11, "#03050a");
    px(badgeX - 4, badgeY - 1, badgeWidth + 8, 9, "#171d2d");
    px(badgeX - 4, badgeY - 1, badgeWidth + 8, 1, "#52def5");
    badge.split("").forEach((letter, index) => {
      const glyph = LOGO_GLYPHS[letter];
      glyph.forEach((row, rowIndex) => {
        for (let col = 0; col < row.length; col++) {
          if (row[col] === "1") {
            px(badgeX + index * 6 + col, badgeY + rowIndex, 1, 1, rowIndex < 3 ? "#ffffff" : "#8cecff");
          }
        }
      });
    });

    this.logoCtx.clearRect(0, 0, this.logoCanvas.width, this.logoCanvas.height);
    this.logoCtx.drawImage(this.logoBuffer, 0, 0, width, height, 0, 0, this.logoCanvas.width, this.logoCanvas.height);
  }
}
