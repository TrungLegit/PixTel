import { CLASSES } from "../data/classes";
import type { ClassId } from "../data/types";
import { drawPixelfxHero, getClassShowcaseEquipment, type HeroAttackKind } from "../graphics/pixelfxHeroModels";
import { sprites } from "../graphics/pixelSprites";
import { createFrame, clearFrame, createFx, PAL } from "../vfx/pixelfx/core/index.js";
import { PIXELFX_MODS } from "../vfx/vfxManager";
import type { PixelfxFrame, PixelfxInstance } from "../vfx/pixelfxTypes";
import type { PixTelOpenWorldGame } from "../game";
import { sfx } from "../audio/chiptuneSynth";
import { renderPixtelLogo } from "./pixelLogo";

interface CardPreview {
  classId: ClassId;
  accent: string;
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
  fxList: PixelfxInstance[];
  cycleT: number;
  firedSteps: Set<number>;
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
    this.logoCanvas = document.getElementById("pixtel-logo") as HTMLCanvasElement;
    this.logoCtx = this.logoCanvas.getContext("2d")!;
    this.logoCtx.imageSmoothingEnabled = false;
    this.logoBuffer = document.createElement("canvas");
    this.logoBuffer.width = 240;
    this.logoBuffer.height = 88;
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
        this.game.startNewGame(this.selectedId, enableGuide, this.game.pendingPlayerName, true);
      }
    });

    document.getElementById("btn-back-home")?.addEventListener("click", () => {
      sfx.unlock();
      sfx.playUiClick();
      this.game.setModal("home");
    });

    document.getElementById("btn-open-coop")?.addEventListener("click", () => {
      sfx.unlock();
      sfx.playUiClick();
      this.game.player.classId = this.selectedId;
      this.game.openCoopFromTitle(this.pendingRoomCode || undefined, "class_select");
    });

    document.getElementById("btn-open-tutorial")?.addEventListener("click", () => {
      sfx.unlock();
      sfx.playUiClick();
      this.game.openTutorialFromTitle("class_select");
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

      const chargeName = cls.skills.charge.name.replace(/\s*\(Giữ LMB\)\s*/i, "");
      const ultName = cls.skills.ult.name.replace(/\s*\(Q\)\s*/i, "");

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
          <canvas class="class-fx-cv" width="168" height="80"></canvas>
          <span class="fx-tag" style="color:${cls.accent}">SKILL [Q] PREVIEW</span>
        </div>
        <div class="class-stats">
          ${bars("HP ", cls.uiBars.hp)}
          ${bars("ATK", cls.uiBars.atk)}
          ${bars("SPD", cls.uiBars.spd)}
        </div>
        <div class="class-skills">
          <div><b>Đánh thường (LMB):</b> ${cls.skills.lmb.name}</div>
          <div><b>Giữ (Hold LMB):</b> ${chargeName}</div>
          <div><b>Skill cố định [Q]:</b> ${ultName}</div>
          <div class="class-weapon-e-note">✦ [E]: Kỹ năng riêng theo từng Vũ Khí</div>
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
        accent: cls.accent,
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
        fxList: [],
        cycleT: 0,
        firedSteps: new Set<number>(),
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
    const backHomeBtn = document.getElementById("btn-back-home");
    const playerBanner = document.getElementById("class-player-name-banner");
    const guideWrap = document.getElementById("newbie-guide-wrap");
    const coopBtn = document.getElementById("btn-open-coop");
    if (switching) {
      this.selectClass(this.game.player.classId);
      this.titleSubEl.textContent = "ĐÀI ĐỔI CLASS — Chọn nhân vật mới (giữ nguyên cấp độ, trang bị & nhiệm vụ)";
      startBtn.textContent = "ĐỔI SANG CLASS NÀY";
      this.continueBtn.classList.add("hidden");
      this.closeBtn.classList.remove("hidden");
      backHomeBtn?.classList.add("hidden");
      playerBanner?.classList.add("hidden");
      guideWrap?.classList.add("hidden");
      coopBtn?.classList.add("hidden");
    } else {
      const heroName = this.game.pendingPlayerName || this.game.player.name || "Chroma-Walker";
      this.titleSubEl.textContent = "BƯỚC 2/2: CHỌN CLASS CHIẾN ĐẤU — Sau đó nhấn BẮT ĐẦU để mở màn Biên Niên Sử!";
      startBtn.textContent = `⚔ BẮT ĐẦU PHIÊU LƯU (${heroName})`;
      this.continueBtn.classList.toggle("hidden", !this.game.saveSys.hasSave());
      this.closeBtn.classList.add("hidden");
      backHomeBtn?.classList.remove("hidden");
      if (playerBanner) {
        playerBanner.classList.remove("hidden");
        playerBanner.innerHTML = `✨ CHIẾN BINH: <b style="color:#ffe066">${heroName}</b> <span style="opacity:0.75">· Bước 2/2: Chọn Class khởi đầu</span>`;
      }
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

  private _spawnStageFx(p: CardPreview, modId: string, opts: Record<string, unknown>) {
    const mod = PIXELFX_MODS[modId];
    if (!mod) return;
    p.fxList.push(createFx(mod, opts));
  }

  private _blitPreviewLayer(p: CardPreview, layer: "back" | "front") {
    if (p.fxList.length === 0) return;
    clearFrame(p.frame);
    for (const fx of p.fxList) {
      fx.draw(p.frame, layer);
    }
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

  private _drawCrystalTarget(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, hitPulse: boolean) {
    const bob = Math.round(Math.sin(t * 4) * 2);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x - 7, y + 6, 14, 3);
    const cols = hitPulse ? ["#ffffff", "#ffe066", "#ffffff"] : ["#ff4a7a", "#b866ff", "#4be8ff"];
    for (let dy = -9; dy <= 7; dy += 2) {
      const hw = Math.max(1, Math.round((1 - Math.abs(dy + 1) / 10) * 6));
      const c = cols[Math.abs(dy) % cols.length];
      ctx.fillStyle = "#080a14";
      ctx.fillRect(x - hw - 1, y + dy + bob, hw * 2 + 2, 2);
      ctx.fillStyle = c;
      ctx.fillRect(x - hw, y + dy + bob, hw * 2, 2);
    }
  }

  private _tickPreviews(dt: number) {
    this.animT += dt;
    this._drawLogo();
    const walkFrame = Math.floor(this.animT * 5) % 4;
    const CYCLE_DUR = 2.4;

    for (const p of this.previews) {
      // 1. Top-left crisp standing/running hero showcase portrait
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
        walkFrame,
        facing: 1,
        animState: "run",
        time: this.animT,
      });

      // 2. Live Fixed-Skill [Q] Stage Preview — ACTUAL HERO performing Fixed Class Skill [Q]!
      p.cycleT += dt;
      if (p.cycleT >= CYCLE_DUR) {
        p.cycleT -= CYCLE_DUR;
        p.firedSteps.clear();
      }
      const ct = p.cycleT;
      const fireStep = (step: number, at: number, fn: () => void) => {
        if (ct >= at && !p.firedSteps.has(step)) {
          p.firedSteps.add(step);
          fn();
        }
      };

      // Schedule class-specific Fixed Skill [Q] pixelfx cues continuously
      if (p.classId === "prism_knight") {
        // Bão Kiếm Ánh Sáng [Q]: Hero channels & spins inside prism-storm cyclone!
        fireStep(0, 0.0, () => {
          this._spawnStageFx(p, "pixtel/overdrive-aura", { x: 84, y: 60, seed: 7 });
          this._spawnStageFx(p, "pixtel/prism-storm", { x: 84, y: 52, radius: 38, seed: 11 });
        });
        fireStep(1, 0.75, () => {
          this._spawnStageFx(p, "pixtel/rainbow-burst", { x: 84, y: 48, seed: 19 });
        });
        fireStep(2, 1.3, () => {
          this._spawnStageFx(p, "pixtel/prism-storm", { x: 84, y: 52, radius: 38, seed: 29 });
        });
      } else if (p.classId === "chroma_mage") {
        // Mưa Thiên Thạch Thất Sắc [Q]: Mage levitates & summons cascading rainbow meteors!
        fireStep(0, 0.0, () => {
          this._spawnStageFx(p, "pixtel/overdrive-aura", { x: 42, y: 60, seed: 13 });
          this._spawnStageFx(p, "arcane/star-fall", { x: 108, y: 46, palette: PAL.candy, seed: 17 });
        });
        fireStep(1, 0.52, () => {
          this._spawnStageFx(p, "explosions/plasma-explosion", { x: 108, y: 58, palette: PAL.candy, seed: 23 });
          this._spawnStageFx(p, "arcane/star-fall", { x: 134, y: 44, palette: PAL.fire, seed: 31 });
        });
        fireStep(2, 1.05, () => {
          this._spawnStageFx(p, "pixtel/rainbow-burst", { x: 134, y: 56, seed: 37 });
          this._spawnStageFx(p, "arcane/star-fall", { x: 118, y: 46, palette: PAL.ice, seed: 41 });
        });
        fireStep(3, 1.62, () => {
          this._spawnStageFx(p, "explosions/plasma-explosion", { x: 118, y: 58, palette: PAL.holy, seed: 43 });
        });
      } else if (p.classId === "bit_rogue") {
        // Phân Thân Ảo Ảnh [Q]: Shadow-Split summon -> Blink-Pincer Hyper-Speed Twin Slashes (+100% ASPD & Crit!)
        fireStep(0, 0.0, () => {
          this._spawnStageFx(p, "spawn/poof", { x: 84, y: 58, palette: PAL.neon, stars: PAL.cyber, seed: 51 });
          this._spawnStageFx(p, "pixtel/sonic-wave", { x: 84, y: 52, palette: PAL.cyber, radius: 44, seed: 53 });
          this._spawnStageFx(p, "pixtel/overdrive-aura", { x: 54, y: 60, seed: 55 });
        });
        fireStep(1, 0.42, () => {
          this._spawnStageFx(p, "melee/dagger-flurry", { x: 84, y: 50, palette: PAL.neon, seed: 59 });
          this._spawnStageFx(p, "melee/double-slash", { x: 84, y: 50, palette: PAL.cyber, radius: 36, flip: true, seed: 61 });
          this._spawnStageFx(p, "impacts/crit-hit", { x: 84, y: 50, palette: PAL.gold, seed: 63 });
        });
        fireStep(2, 0.94, () => {
          this._spawnStageFx(p, "melee/double-slash", { x: 84, y: 50, palette: PAL.neon, radius: 40, seed: 65 });
          this._spawnStageFx(p, "melee/dagger-flurry", { x: 84, y: 50, palette: PAL.cyber, flip: true, seed: 67 });
          this._spawnStageFx(p, "impacts/crit-hit", { x: 84, y: 48, palette: PAL.gold, seed: 69 });
        });
        fireStep(3, 1.44, () => {
          this._spawnStageFx(p, "melee/spin-slash", { x: 84, y: 52, palette: PAL.neon, radius: 44, seed: 71 });
          this._spawnStageFx(p, "melee/spin-slash", { x: 84, y: 52, palette: PAL.cyber, radius: 34, flip: true, seed: 73 });
          this._spawnStageFx(p, "impacts/crit-hit", { x: 84, y: 50, palette: PAL.gold, seed: 75 });
        });
        fireStep(4, 1.94, () => {
          this._spawnStageFx(p, "pixtel/sonic-wave", { x: 84, y: 52, palette: PAL.neon, radius: 42, seed: 77 });
          this._spawnStageFx(p, "impacts/crit-hit", { x: 84, y: 50, palette: PAL.gold, seed: 79 });
        });
      } else {
        // Drone Sắc Độ Quá Tải [Q]: Tinker commands orbiting Drone firing Chroma-Volt beams!
        fireStep(0, 0.0, () => {
          this._spawnStageFx(p, "pixtel/overdrive-aura", { x: 42, y: 60, seed: 71 });
          this._spawnStageFx(p, "lightning/zap-hit", { x: 134, y: 52, seed: 73 });
        });
        fireStep(1, 0.65, () => {
          this._spawnStageFx(p, "lightning/zap-hit", { x: 134, y: 52, seed: 79 });
          this._spawnStageFx(p, "pixtel/rainbow-burst", { x: 134, y: 52, seed: 83 });
        });
        fireStep(2, 1.35, () => {
          this._spawnStageFx(p, "lightning/zap-hit", { x: 134, y: 52, seed: 89 });
        });
        fireStep(3, 1.9, () => {
          this._spawnStageFx(p, "pixtel/rainbow-burst", { x: 134, y: 52, seed: 97 });
        });
      }

      for (let i = p.fxList.length - 1; i >= 0; i--) {
        p.fxList[i].update(dt);
        if (p.fxList[i].done()) p.fxList.splice(i, 1);
      }

      // Draw mini arena backdrop
      const ctx = p.fxCtx;
      const w = p.fxCanvas.width;
      const h = p.fxCanvas.height;
      ctx.fillStyle = "#0e0c1a";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#17142b";
      ctx.fillRect(0, 56, w, h - 56);
      ctx.fillStyle = "#2b274c";
      ctx.fillRect(0, 56, w, 2);
      // Subtle floor tiles
      ctx.fillStyle = "#221e3c";
      for (let gx = 8; gx < w; gx += 20) {
        ctx.fillRect(gx, 62, 10, 2);
        ctx.fillRect(gx - 6, 70, 10, 2);
      }

      // Back VFX layer (behind hero)
      this._blitPreviewLayer(p, "back");

      // Render ACTUAL Hero performing their Fixed Skill [Q]!
      const equip = getClassShowcaseEquipment(p.classId);
      if (p.classId === "prism_knight") {
        // Glowing storm seal under Knight
        ctx.fillStyle = "rgba(75, 232, 255, 0.25)";
        ctx.fillRect(54, 62, 60, 5);
        ctx.fillStyle = "rgba(0,0,0,0.48)";
        ctx.fillRect(74, 64, 20, 4);
        const isWindup = ct < 0.35;
        drawPixelfxHero(ctx, {
          classId: "prism_knight",
          equipment: equip,
          x: 84,
          y: 66,
          rigScale: 0.9,
          drawScale: 1,
          walkFrame,
          facing: 1,
          animState: "attack",
          attackKind: isWindup ? "cast_ult" : "storm",
          attackProgress: isWindup ? ct / 0.35 : ((ct - 0.35) * 2.4) % 1,
          time: this.animT,
          buffActive: true,
        });
      } else if (p.classId === "chroma_mage") {
        // Target impact rune pad on right
        ctx.fillStyle = "rgba(255, 102, 216, 0.22)";
        ctx.fillRect(92, 61, 56, 6);
        const lev = Math.round(Math.sin(this.animT * 6) * 2) - 2;
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(34, 64, 16, 4);
        const castKind: HeroAttackKind = ct < 0.45 ? "cast_ult" : "orb_levitate";
        drawPixelfxHero(ctx, {
          classId: "chroma_mage",
          equipment: equip,
          x: 42,
          y: 66 + lev,
          rigScale: 0.9,
          drawScale: 1,
          walkFrame,
          facing: 1,
          animState: "attack",
          attackKind: castKind,
          attackProgress: (ct * 1.15) % 1,
          time: this.animT,
          buffActive: true,
        });
      } else if (p.classId === "bit_rogue") {
        // Phân Thân Ảo Ảnh [Q]: Shadow-Split -> Hyper-speed Blink-Pincer Twin Slashes + Afterimages + Crit!
        const hitPulse = ct > 0.38 && ct < 2.15;
        this._drawCrystalTarget(ctx, 84, 58, this.animT, hitPulse);

        // Determine dynamic blink phase (swaps Real Rogue & Phantom Clone across the crystal at 2x speed!)
        const splitU = Math.min(1, ct / 0.36);
        const swapped = ct >= 0.94 && ct < 1.44;
        const lunge = ct < 0.38 ? 0 : Math.sin(((ct - 0.38) * 3.8) * Math.PI) * 12;
        const leftX = Math.round(84 - 30 * splitU + Math.max(0, lunge));
        const rightX = Math.round(84 + 30 * splitU - Math.max(0, lunge));
        const heroX = swapped ? rightX : leftX;
        const cloneX = swapped ? leftX : rightX;
        const heroFacing: 1 | -1 = swapped ? -1 : 1;
        const cloneFacing: 1 | -1 = swapped ? 1 : -1;

        const atkKind: HeroAttackKind =
          ct < 0.36
            ? "cast_ult"
            : ct < 0.94
              ? "dual_cross_slash"
              : ct < 1.44
                ? "flurry_2"
                : "spin";
        const atkProg = (ct * 2.5) % 1; // +100% rapid attack rhythm!

        // Neon speed-tether & dash streaks linking Real Rogue <-> Phantom Clone across target!
        if (ct >= 0.22) {
          ctx.save();
          ctx.strokeStyle = "#2ef2ff";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(heroX, 50);
          ctx.lineTo(cloneX, 50);
          ctx.stroke();
          ctx.strokeStyle = "#ff2e63";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(heroX, 46);
          ctx.lineTo(84, 38);
          ctx.lineTo(cloneX, 46);
          ctx.stroke();
          // Rapid horizontal speed lines (+100% ASPD)
          for (let s = 0; s < 5; s++) {
            const sy = 36 + s * 6;
            const sx = 22 + ((Math.floor(this.animT * 190) + s * 29) % 116);
            ctx.fillStyle = s % 2 === 0 ? "rgba(46, 242, 255, 0.55)" : "rgba(255, 46, 99, 0.55)";
            ctx.fillRect(sx, sy, 14, 1);
          }
          ctx.restore();
        }

        // 1. Overhead Shadow Echo Clone (3rd phantom striking from above during rapid flurry!)
        if (ct >= 0.42 && ct < 1.98) {
          ctx.save();
          ctx.globalAlpha = 0.42;
          drawPixelfxHero(ctx, {
            classId: "bit_rogue",
            equipment: equip,
            x: 84 + Math.round(Math.sin(this.animT * 18) * 6),
            y: 44 + Math.round(Math.cos(this.animT * 14) * 2),
            rigScale: 0.78,
            drawScale: 1,
            walkFrame,
            facing: heroFacing,
            animState: "attack",
            attackKind: "dual_cross_slash",
            attackProgress: (atkProg + 0.5) % 1,
            time: this.animT,
            aegisActive: true,
          });
          ctx.restore();
        }

        // 2. Blink Afterimage Trails (behind both Real Rogue and Main Clone)
        if (ct >= 0.42) {
          ctx.save();
          ctx.globalAlpha = 0.3;
          drawPixelfxHero(ctx, {
            classId: "bit_rogue",
            equipment: equip,
            x: heroX - heroFacing * 12,
            y: 66,
            rigScale: 0.88,
            drawScale: 1,
            walkFrame,
            facing: heroFacing,
            animState: "attack",
            attackKind: atkKind,
            attackProgress: Math.max(0, atkProg - 0.18),
            time: this.animT,
          });
          ctx.restore();
        }

        // 3. Main Holographic Neon Phantom Clone (pincering opposite side in exact sync!)
        if (ct >= 0.14) {
          ctx.save();
          ctx.fillStyle = "rgba(46, 242, 255, 0.42)";
          ctx.fillRect(cloneX - 11, 63, 22, 4);
          ctx.fillStyle = "rgba(255, 46, 99, 0.35)";
          ctx.fillRect(cloneX - 8, 65, 16, 2);
          ctx.globalAlpha = 0.76;
          drawPixelfxHero(ctx, {
            classId: "bit_rogue",
            equipment: equip,
            x: cloneX,
            y: 66 + Math.round(Math.sin(this.animT * 16) * 1.5),
            rigScale: 0.9,
            drawScale: 1,
            walkFrame,
            facing: cloneFacing,
            animState: "attack",
            attackKind: atkKind,
            attackProgress: atkProg,
            time: this.animT,
            aegisActive: true,
          });
          ctx.restore();
        }

        // 4. Real Bit Rogue
        ctx.fillStyle = "rgba(0,0,0,0.48)";
        ctx.fillRect(heroX - 9, 64, 18, 4);
        drawPixelfxHero(ctx, {
          classId: "bit_rogue",
          equipment: equip,
          x: heroX,
          y: 66,
          rigScale: 0.9,
          drawScale: 1,
          walkFrame,
          facing: heroFacing,
          animState: "attack",
          attackKind: atkKind,
          attackProgress: atkProg,
          time: this.animT,
          buffActive: true,
        });

        // 5. Crisp floating "+100% SPD · CRIT!" pixel sparks above crystal on impact beats
        if (hitPulse && Math.sin(this.animT * 22) > 0) {
          ctx.fillStyle = "#ffe066";
          ctx.fillRect(79, 26, 10, 2);
          ctx.fillRect(83, 22, 2, 10);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(83, 26, 2, 2);
        }
      } else {
        // Pixel Tinker + Orbiting Overload Drone firing live Chroma-Volt laser to target!
        const firing = Math.sin(this.animT * 10) > -0.15;
        this._drawCrystalTarget(ctx, 134, 54, this.animT, firing);

        ctx.fillStyle = "rgba(0,0,0,0.48)";
        ctx.fillRect(34, 64, 18, 4);
        const atkKind: HeroAttackKind = ct < 0.4 ? "cast_ult" : "recoil_barrage";
        drawPixelfxHero(ctx, {
          classId: "pixel_tinker",
          equipment: equip,
          x: 42,
          y: 66,
          rigScale: 0.9,
          drawScale: 1,
          walkFrame,
          facing: 1,
          animState: "attack",
          attackKind: atkKind,
          attackProgress: (ct * 1.35) % 1,
          time: this.animT,
          buffActive: true,
        });

        // Orbiting Overload Drone sprite + firing Chroma-Volt laser beam!
        const droneX = Math.round(68 + Math.cos(this.animT * 4.8) * 14);
        const droneY = Math.round(30 + Math.sin(this.animT * 4.8) * 6);
        if (firing) {
          ctx.save();
          ctx.strokeStyle = "#44ee88";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(droneX + 4, droneY);
          ctx.lineTo(134, 52);
          ctx.stroke();
          ctx.strokeStyle = "#ffe066";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(droneX + 4, droneY);
          ctx.lineTo(134, 52);
          ctx.stroke();
          ctx.restore();
        }
        // Glow halo + actual compiled Overload Drone sprite
        ctx.fillStyle = "rgba(68, 238, 136, 0.35)";
        ctx.fillRect(droneX - 8, droneY - 8, 16, 16);
        if (sprites.summons?.drone?.right) {
          ctx.drawImage(sprites.summons.drone.right, droneX - 7, droneY - 7);
        }
      }

      // Front VFX + Additive Light layer (wraps over hero!)
      this._blitPreviewLayer(p, "front");
    }
  }

  private _drawLogo() {
    renderPixtelLogo(this.logoBuffer, this.logoBufferCtx, this.logoCanvas, this.logoCtx, this.animT);
  }
}
