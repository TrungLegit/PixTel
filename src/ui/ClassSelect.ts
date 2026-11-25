import { CLASSES } from "../data/classes";
import type { ClassId } from "../data/types";
import { drawPixelfxHero, getClassShowcaseEquipment, getPixelfxHeroCompiled, type HeroAttackKind } from "../graphics/pixelfxHeroModels";
import { createFrame, clearFrame, createFx, PAL } from "../vfx/pixelfx/core/index.js";
import { PIXELFX_MODS } from "../vfx/vfxManager";
import type { PixelfxFrame, PixelfxInstance } from "../vfx/pixelfxTypes";
import type { PixTelOpenWorldGame } from "../game";
import { sfx } from "../audio/chiptuneSynth";

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
  private selectedId: ClassId = "prism_knight";
  private switchingMode = false;
  private pendingRoomCode = "";
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

    this._buildCards();

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

    document.getElementById("btn-open-coop")?.addEventListener("click", () => {
      sfx.unlock();
      sfx.playUiClick();
      this.game.player.classId = this.selectedId;
      this.game.openCoopFromTitle(this.pendingRoomCode || undefined);
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

  setPendingRoomInvite(code: string) {
    this.pendingRoomCode = code.trim().toUpperCase();
    this._renderInviteBanner();
  }

  private _renderInviteBanner() {
    const banner = document.getElementById("title-room-invite-banner");
    if (!banner) return;
    if (!this.pendingRoomCode || this.switchingMode) {
      banner.classList.add("hidden");
      return;
    }
    banner.classList.remove("hidden");
    const hasSave = this.game.saveSys.hasSave();
    banner.innerHTML = `
      <div class="coop-invite-text">
        🤝 Bạn được mời vào Tổ Đội Co-op <b>[${this.pendingRoomCode}]</b> — Chọn Class phía trên rồi bấm vào phòng ngay!
      </div>
      <div class="coop-invite-btns">
        <button id="btn-quick-join-new" class="px-btn sm good">🚀 VÀO NGAY PHÒNG [${this.pendingRoomCode}]</button>
        ${hasSave ? `<button id="btn-quick-join-save" class="px-btn sm primary">▶ VÀO BẰNG FILE SAVE</button>` : ""}
      </div>
    `;
    banner.querySelector("#btn-quick-join-new")?.addEventListener("click", async () => {
      sfx.unlock();
      sfx.playUiClick();
      const code = this.pendingRoomCode;
      this.game.startNewGame(this.selectedId, false);
      try {
        await this.game.joinCoopSession(code);
      } catch {
        this.game.setModal("coop", { code });
      }
    });
    banner.querySelector("#btn-quick-join-save")?.addEventListener("click", async () => {
      sfx.unlock();
      sfx.playUiClick();
      const code = this.pendingRoomCode;
      if (!this.game.loadSavedGame()) {
        this.game.startNewGame(this.selectedId, false);
      }
      try {
        await this.game.joinCoopSession(code);
      } catch {
        this.game.setModal("coop", { code });
      }
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
    if (!this.switchingMode && !this.game.running && this.game.player) {
      this.game.player.classId = id;
    }
    for (const el of Array.from(this.gridEl.querySelectorAll(".class-card"))) {
      el.classList.toggle("selected", (el as HTMLElement).dataset.classId === id);
    }
  }

  show(switching: boolean) {
    this.switchingMode = switching;
    this.root.classList.remove("hidden");

    const startBtn = document.getElementById("btn-start-adventure")!;
    const guideWrap = document.getElementById("newbie-guide-wrap");
    const coopBtn = document.getElementById("btn-open-coop");
    if (switching) {
      this.selectClass(this.game.player.classId);
      this.titleSubEl.textContent = "ĐÀI ĐỔI CLASS — Chọn nhân vật mới (giữ nguyên cấp độ, trang bị & nhiệm vụ)";
      startBtn.textContent = "ĐỔI SANG CLASS NÀY";
      this.continueBtn.classList.add("hidden");
      this.closeBtn.classList.remove("hidden");
      guideWrap?.classList.add("hidden");
      coopBtn?.classList.add("hidden");
    } else {
      this.titleSubEl.textContent = "THẾ GIỚI MỞ 16-BIT ACTION RPG — Đánh thức Trụ Sắc Màu & tiêu diệt The Eraser";
      startBtn.textContent = "BẮT ĐẦU PHIÊU LƯU MỚI";
      this.continueBtn.classList.toggle("hidden", !this.game.saveSys.hasSave());
      this.closeBtn.classList.add("hidden");
      guideWrap?.classList.remove("hidden");
      coopBtn?.classList.remove("hidden");
    }
    this._renderInviteBanner();

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
}
