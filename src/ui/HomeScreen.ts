import { getClassDef } from "../data/classes";
import { drawPixelfxHero, getClassShowcaseEquipment } from "../graphics/pixelfxHeroModels";
import { createFrame, clearFrame, createFx } from "../vfx/pixelfx/core/index.js";
import { PIXELFX_MODS } from "../vfx/vfxManager";
import type { PixelfxFrame, PixelfxInstance } from "../vfx/pixelfxTypes";
import type { PixTelOpenWorldGame } from "../game";
import { sfx } from "../audio/chiptuneSynth";
import { renderPixtelLogo } from "./pixelLogo";

const LAST_NAME_KEY = "pixtel_last_player_name";

const RANDOM_HERO_NAMES = [
  "Aetherion",
  "Kaelen",
  "Quang Khải",
  "Tinh Vân",
  "Lăng Kính Sư",
  "Hỏa Long",
  "Sắc Ảnh",
  "Bạch Vũ",
  "Cầu Vồng",
  "Thiên Phong",
  "Lục Bảo",
  "Vệ Binh Lam",
];

/**
 * Dedicated Home / Title Screen shown on first launch:
 * Step 1: Enter Hero Name -> Step 2: Proceed to Class Select -> Step 3: Start Adventure (+ Opening Cutscene).
 */
export class HomeScreenUI {
  private root: HTMLElement;
  private bgCanvas: HTMLCanvasElement;
  private bgCtx: CanvasRenderingContext2D;
  private logoCanvas: HTMLCanvasElement;
  private logoCtx: CanvasRenderingContext2D;
  private logoBuffer: HTMLCanvasElement;
  private logoBufferCtx: CanvasRenderingContext2D;
  private nameInput: HTMLInputElement;
  private nameHintEl: HTMLElement;
  private continueBtn: HTMLButtonElement;
  private inviteBannerEl: HTMLElement;

  // Live pixelfx two-buffer compositor for floating prism waves on the Home canvas
  private fxFrame: PixelfxFrame;
  private fxColorCv: HTMLCanvasElement;
  private fxColorCtx: CanvasRenderingContext2D;
  private fxColorImg: ImageData;
  private fxColorU32: Uint32Array;
  private fxLightCv: HTMLCanvasElement;
  private fxLightCtx: CanvasRenderingContext2D;
  private fxLightImg: ImageData;
  private fxLightU32: Uint32Array;
  private activeFx: PixelfxInstance[] = [];
  private fxWaveTimer = 0.2;
  private fxBurstTimer = 1.1;

  private pendingRoomCode = "";
  private randomIdx = 0;
  private rafId = 0;
  private lastT = 0;
  private animT = 0;
  private game: PixTelOpenWorldGame;

  constructor(game: PixTelOpenWorldGame) {
    this.game = game;
    this.root = document.getElementById("screen-home")!;
    this.bgCanvas = document.getElementById("home-bg-canvas") as HTMLCanvasElement;
    this.bgCtx = this.bgCanvas.getContext("2d")!;
    this.bgCtx.imageSmoothingEnabled = false;

    this.logoCanvas = document.getElementById("pixtel-home-logo") as HTMLCanvasElement;
    this.logoCtx = this.logoCanvas.getContext("2d")!;
    this.logoCtx.imageSmoothingEnabled = false;
    this.logoBuffer = document.createElement("canvas");
    this.logoBuffer.width = 240;
    this.logoBuffer.height = 88;
    this.logoBufferCtx = this.logoBuffer.getContext("2d")!;
    this.logoBufferCtx.imageSmoothingEnabled = false;

    this.nameInput = document.getElementById("home-name-input") as HTMLInputElement;
    this.nameHintEl = document.getElementById("home-name-hint")!;
    this.continueBtn = document.getElementById("btn-home-continue") as HTMLButtonElement;
    this.inviteBannerEl = document.getElementById("home-room-invite-banner")!;

    const w = this.bgCanvas.width;
    const h = this.bgCanvas.height;
    this.fxFrame = createFrame(w, h, 0, 0);
    this.fxColorCv = document.createElement("canvas");
    this.fxColorCv.width = w;
    this.fxColorCv.height = h;
    this.fxColorCtx = this.fxColorCv.getContext("2d")!;
    this.fxColorImg = this.fxColorCtx.createImageData(w, h);
    this.fxColorU32 = new Uint32Array(this.fxColorImg.data.buffer);

    this.fxLightCv = document.createElement("canvas");
    this.fxLightCv.width = w;
    this.fxLightCv.height = h;
    this.fxLightCtx = this.fxLightCv.getContext("2d")!;
    this.fxLightImg = this.fxLightCtx.createImageData(w, h);
    this.fxLightU32 = new Uint32Array(this.fxLightImg.data.buffer);

    // Restore last entered name if present
    try {
      const savedName = localStorage.getItem(LAST_NAME_KEY);
      if (savedName && savedName.trim()) {
        this.nameInput.value = savedName.trim().slice(0, 16);
        this.game.pendingPlayerName = this.nameInput.value;
      }
    } catch {
      // ignore storage errors
    }

    document.getElementById("btn-home-random-name")?.addEventListener("click", () => {
      sfx.unlock();
      sfx.playUiClick();
      this.randomIdx = (this.randomIdx + 1) % RANDOM_HERO_NAMES.length;
      const pick = RANDOM_HERO_NAMES[this.randomIdx];
      this.nameInput.value = pick;
      this.game.pendingPlayerName = pick;
      this._persistLastName(pick);
      this._setHint(`Đã chọn danh hiệu: ★ ${pick}`, "#5ef2ff");
    });

    this.nameInput.addEventListener("input", () => {
      const val = this.nameInput.value.trim().slice(0, 16);
      if (val) {
        this.game.pendingPlayerName = val;
        this._setHint(`Tên hiển thị trong thế giới & Co-op: ★ ${val}`, "#88e6ff");
      } else {
        this._setHint("Nhập tên nhân vật (1–16 ký tự) hoặc nhấn 🎲 Ngẫu Nhiên!", "#ffe066");
      }
    });

    this.nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this._proceedToClassSelect();
      }
    });

    document.getElementById("btn-home-next-class")?.addEventListener("click", () => {
      this._proceedToClassSelect();
    });

    this.continueBtn.addEventListener("click", () => {
      sfx.unlock();
      sfx.playUiClick();
      this.game.loadSavedGame();
    });

    document.getElementById("btn-home-watch-story")?.addEventListener("click", () => {
      sfx.unlock();
      sfx.playUiClick();
      const chosen = this._resolveValidName(false);
      this.game.pendingPlayerName = chosen;
      this.game.player.name = chosen;
      this.game.playCutscene("scene_intro", "home");
    });

    document.getElementById("btn-home-coop")?.addEventListener("click", () => {
      sfx.unlock();
      sfx.playUiClick();
      const chosen = this._resolveValidName(false);
      this.game.pendingPlayerName = chosen;
      this.game.coop.playerName = chosen;
      this.game.openCoopFromTitle(this.pendingRoomCode || undefined, "home");
    });

    document.getElementById("btn-home-tutorial")?.addEventListener("click", () => {
      sfx.unlock();
      sfx.playUiClick();
      this.game.openTutorialFromTitle("home");
    });
  }

  setPendingRoomInvite(code: string) {
    this.pendingRoomCode = code.trim().toUpperCase();
    this._renderInviteBanner();
  }

  private _persistLastName(name: string) {
    try {
      localStorage.setItem(LAST_NAME_KEY, name);
    } catch {
      // ignore
    }
  }

  private _setHint(text: string, color: string) {
    this.nameHintEl.textContent = text;
    this.nameHintEl.style.color = color;
  }

  private _resolveValidName(strict: boolean): string {
    const raw = this.nameInput.value.trim().slice(0, 16);
    if (!raw && strict) {
      this.nameInput.focus();
      this.nameInput.classList.add("shake-err");
      window.setTimeout(() => this.nameInput.classList.remove("shake-err"), 340);
      this._setHint("⚠ Vui lòng nhập tên nhân vật trước khi chọn Class!", "#ff6677");
      return "";
    }
    return raw || this.game.pendingPlayerName || "Chroma-Walker";
  }

  private _proceedToClassSelect() {
    sfx.unlock();
    const chosen = this._resolveValidName(true);
    if (!chosen) {
      sfx.playForgeFail();
      return;
    }
    sfx.playUiClick();
    this.game.pendingPlayerName = chosen;
    this.game.player.name = chosen;
    this.game.coop.playerName = chosen;
    this._persistLastName(chosen);
    this.game.setModal("class_select", { switching: false });
  }

  private _renderInviteBanner() {
    if (!this.pendingRoomCode) {
      this.inviteBannerEl.classList.add("hidden");
      return;
    }
    this.inviteBannerEl.classList.remove("hidden");
    this.inviteBannerEl.innerHTML = `
      <div class="coop-invite-text">
        🤝 Lời mời Tổ Đội Co-op <b>[${this.pendingRoomCode}]</b> — Đặt tên rồi chọn Class hoặc bấm Co-op để vào phòng!
      </div>
    `;
  }

  show() {
    this.root.classList.remove("hidden");
    const saved = this.game.saveSys.load();
    if (saved) {
      const cls = getClassDef(saved.classId);
      const savedName = saved.player.name || "Chroma-Walker";
      this.continueBtn.classList.remove("hidden");
      this.continueBtn.textContent = `▶ TIẾP TỤC: ${savedName} (${cls.vnName} · LV.${saved.player.level})`;
      if (!this.nameInput.value.trim() && saved.player.name) {
        this.nameInput.value = saved.player.name;
        this.game.pendingPlayerName = saved.player.name;
      }
    } else {
      this.continueBtn.classList.add("hidden");
    }
    this._renderInviteBanner();
    const curVal = this.nameInput.value.trim();
    if (curVal) {
      this._setHint(`Tên nhân vật sẵn sàng: ★ ${curVal} — Nhấn Enter hoặc Chọn Class!`, "#70f0b4");
    } else {
      this._setHint("Nhập tên anh hùng của bạn (1–16 ký tự), rồi chọn Class để bắt đầu!", "#a8d8ff");
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
        this._tick(dt);
        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);
    }
  }

  hide() {
    this.root.classList.add("hidden");
  }

  private _tick(dt: number) {
    this.animT += dt;
    renderPixtelLogo(this.logoBuffer, this.logoBufferCtx, this.logoCanvas, this.logoCtx, this.animT);

    // Spawn periodic pixelfx prism waves & rainbow bursts on the backdrop
    this.fxWaveTimer -= dt;
    if (this.fxWaveTimer <= 0) {
      this.fxWaveTimer = 2.6;
      const mod = PIXELFX_MODS["pixtel/color-wave"];
      if (mod) this.activeFx.push(createFx(mod, { x: 240, y: 126, radius: 135, seed: Math.floor(this.animT * 10) }));
    }
    this.fxBurstTimer -= dt;
    if (this.fxBurstTimer <= 0) {
      this.fxBurstTimer = 2.1;
      const mod = PIXELFX_MODS["pixtel/rainbow-burst"];
      if (mod) {
        this.activeFx.push(
          createFx(mod, {
            x: 240 + Math.round(Math.sin(this.animT) * 18),
            y: 110 + Math.round(Math.cos(this.animT * 1.4) * 8),
            seed: Math.floor(this.animT * 31) + 7,
          })
        );
      }
    }

    for (let i = this.activeFx.length - 1; i >= 0; i--) {
      this.activeFx[i].update(dt);
      if (this.activeFx[i].done()) this.activeFx.splice(i, 1);
    }

    this._renderBackdrop();
  }

  private _renderBackdrop() {
    const ctx = this.bgCtx;
    const w = this.bgCanvas.width;
    const h = this.bgCanvas.height;

    // 1. Night Aethel-16 sky gradient bands (crisp pixel bands)
    const skyBands = ["#060814", "#0a0e22", "#111632", "#191c42", "#221e4a", "#2b204d"];
    const bandH = Math.ceil(162 / skyBands.length);
    for (let i = 0; i < skyBands.length; i++) {
      ctx.fillStyle = skyBands[i];
      ctx.fillRect(0, i * bandH, w, bandH);
    }

    // 2. Twinkling 16-bit stars & floating chroma pixels
    for (let i = 0; i < 48; i++) {
      const sx = (i * 73 + 19) % w;
      const sy = (i * 41 + 9) % 132;
      const tw = Math.sin(this.animT * 2.5 + i * 1.3);
      if (tw > -0.25) {
        const cols = ["#ffe066", "#5ef2ff", "#ff88cc", "#70f0b4", "#ffffff"];
        ctx.fillStyle = cols[i % cols.length];
        ctx.fillRect(sx, sy, i % 6 === 0 ? 2 : 1, i % 6 === 0 ? 2 : 1);
      }
    }

    // 3. Distant 4-Biome silhouette mountain range (Meadow -> Quartz -> Amber -> Void)
    for (let x = 0; x < w; x += 4) {
      const mH = Math.round(
        26 +
          Math.sin(x * 0.018) * 18 +
          Math.cos(x * 0.044 + 1.2) * 10 +
          Math.sin(x * 0.09) * 5
      );
      const biomeCol =
        x < 120 ? "#132c26" : x < 240 ? "#162646" : x < 360 ? "#381e1c" : "#1c1330";
      ctx.fillStyle = biomeCol;
      ctx.fillRect(x, 168 - mH, 4, mH + 14);
      const ridgeCol =
        x < 120 ? "#245440" : x < 240 ? "#28507c" : x < 360 ? "#6a3324" : "#3a2460";
      ctx.fillStyle = ridgeCol;
      ctx.fillRect(x, 168 - mH, 4, 2);
    }

    // 4. Foreground grassy/stone ridge of Origin Town
    ctx.fillStyle = "#0c1220";
    ctx.fillRect(0, 178, w, h - 178);
    ctx.fillStyle = "#1a2840";
    ctx.fillRect(0, 178, w, 4);
    ctx.fillStyle = "#2d4868";
    for (let x = 0; x < w; x += 12) {
      ctx.fillRect(x, 178, 6, 2);
    }

    // 5. Center floating Great Chroma Prism Pillar
    const bob = Math.round(Math.sin(this.animT * 2.4) * 4);
    const cx = 240;
    const cy = 122 + bob;
    // Pedestal
    ctx.fillStyle = "#182238";
    ctx.fillRect(cx - 26, 170, 52, 10);
    ctx.fillStyle = "#2f446c";
    ctx.fillRect(cx - 22, 168, 44, 4);
    ctx.fillStyle = "#5ef2ff";
    ctx.fillRect(cx - 16, 170, 32, 2);

    // Prism Diamond
    const prismColors = ["#ff5577", "#ffe066", "#44ee88", "#4be8ff", "#c478ff"];
    for (let dy = -22; dy <= 22; dy += 2) {
      const halfW = Math.max(2, Math.round((1 - Math.abs(dy) / 24) * 14));
      const band = prismColors[Math.floor(((dy + 22 + this.animT * 18) / 9) % prismColors.length + prismColors.length) % prismColors.length];
      ctx.fillStyle = "#080a14";
      ctx.fillRect(cx - halfW - 1, cy + dy, halfW * 2 + 2, 2);
      ctx.fillStyle = band;
      ctx.fillRect(cx - halfW, cy + dy, halfW * 2, 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(cx - Math.max(1, Math.floor(halfW * 0.45)), cy + dy, 2, 2);
    }

    // 6. All 4 Hero Classes standing guard along the Origin Town ridge (left & right!)
    const walkFrame = Math.floor(this.animT * 4) % 4;
    const heroes: { id: "prism_knight" | "chroma_mage" | "bit_rogue" | "pixel_tinker"; x: number; facing: 1 | -1 }[] = [
      { id: "prism_knight", x: 64, facing: 1 },
      { id: "chroma_mage", x: 118, facing: 1 },
      { id: "bit_rogue", x: 362, facing: -1 },
      { id: "pixel_tinker", x: 416, facing: -1 },
    ];
    for (const hHero of heroes) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(hHero.x - 10, 188, 20, 4);
      drawPixelfxHero(ctx, {
        classId: hHero.id,
        equipment: getClassShowcaseEquipment(hHero.id),
        x: hHero.x,
        y: 190,
        rigScale: 1.0,
        drawScale: 1,
        walkFrame,
        facing: hHero.facing,
        animState: "idle",
        time: this.animT,
      });
    }

    // 7. Composite live pixelfx color + additive light buffers onto backdrop!
    if (this.activeFx.length > 0) {
      clearFrame(this.fxFrame);
      for (const fx of this.activeFx) {
        fx.draw(this.fxFrame, "back");
        fx.draw(this.fxFrame, "front");
      }
      this.fxColorU32.set(this.fxFrame.color);
      this.fxColorCtx.putImageData(this.fxColorImg, 0, 0);
      ctx.drawImage(this.fxColorCv, 0, 0);

      this.fxLightU32.set(this.fxFrame.light);
      this.fxLightCtx.putImageData(this.fxLightImg, 0, 0);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(this.fxLightCv, 0, 0);
      ctx.restore();
    }
  }
}
