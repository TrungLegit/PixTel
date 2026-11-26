import { getClassDef } from "../data/classes";
import {
  STORY_CUTSCENE_BY_ID,
  interpolateCutsceneText,
  type CutsceneBackdropId,
  type CutsceneBeat,
  type CutsceneSetpieceId,
  type CutsceneWeatherId,
  type StoryCutsceneDef,
  type StoryCutsceneId,
} from "../data/cutscenes";
import { drawCodixelEnemy } from "../graphics/enemyAtlas";
import { drawPixelfxHero, getClassShowcaseEquipment, type HeroAttackKind } from "../graphics/pixelfxHeroModels";
import { createFrame, clearFrame, createFx, PAL } from "../vfx/pixelfx/core/index.js";
import { PIXELFX_MODS } from "../vfx/vfxManager";
import { DEFAULT_HERO_NAME, sanitizePlayerName } from "../utils/playerName";
import type { PixelfxFrame, PixelfxInstance } from "../vfx/pixelfxTypes";
import type { ModalId, PixTelOpenWorldGame } from "../game";
import { sfx } from "../audio/chiptuneSynth";

interface CueRuntime {
  nextAt: number;
  firedOnce: boolean;
}

export interface CutscenePlayPayload {
  sceneId: StoryCutsceneId;
  returnModal?: ModalId;
  onDone?: () => void;
}

function easeOutCubic(u: number): number {
  const t = Math.max(0, Math.min(1, u));
  return 1 - (1 - t) * (1 - t) * (1 - t);
}

/**
 * Widescreen 16-bit Story Cutscene Player (#modal-cutscene):
 * Renders animated biome backdrops, custom 16-bit setpieces, weather particles,
 * real 3D pixelfx Heroes (including multi-class ensemble casts) + HD codixel Boss/Enemy sprites,
 * eased actor choreography, live two-buffer pixelfx VFX (color + additive light),
 * Bleach/Restore sweeps, dramatic JRPG title cards, auto-play mode, and Vietnamese typewriter subtitles.
 */
export class CutsceneModalUI {
  private game: PixTelOpenWorldGame;
  private root: HTMLElement;
  private stageCanvas: HTMLCanvasElement;
  private stageCtx: CanvasRenderingContext2D;
  private chapterEl: HTMLElement;
  private titleEl: HTMLElement;
  private counterEl: HTMLElement;
  private progressFillEl: HTMLElement;
  private pipsEl: HTMLElement;
  private sceneStampEl: HTMLElement;
  private titleCardEl: HTMLElement;
  private speakerEl: HTMLElement;
  private textEl: HTMLElement;
  private prevBtn: HTMLButtonElement;
  private autoBtn: HTMLButtonElement;
  private nextBtn: HTMLButtonElement;
  private skipBtn: HTMLButtonElement;

  // Two-buffer pixelfx compositor (480x200)
  private fxFrame: PixelfxFrame;
  private fxColorCv: HTMLCanvasElement;
  private fxColorCtx: CanvasRenderingContext2D;
  private fxColorImg: ImageData;
  private fxColorU32: Uint32Array;
  private fxLightCv: HTMLCanvasElement;
  private fxLightCtx: CanvasRenderingContext2D;
  private fxLightImg: ImageData;
  private fxLightU32: Uint32Array;

  private activeScene: StoryCutsceneDef | null = null;
  private beatIdx = 0;
  private beatT = 0;
  private fullText = "";
  private typedChars = 0;
  private typeSpeed = 54; // chars per second
  private autoPlay = false;
  private autoWaitT = 0;
  private activeFx: PixelfxInstance[] = [];
  private cueStates: CueRuntime[] = [];
  private flashAlpha = 0;
  private shakeTimer = 0;
  private shakeAmp = 0;

  private returnModal: ModalId = null;
  private onDoneCb?: () => void;
  private rafId = 0;
  private lastT = 0;
  private keyListener: (e: KeyboardEvent) => void;

  constructor(game: PixTelOpenWorldGame) {
    this.game = game;
    this.root = document.getElementById("modal-cutscene")!;
    this.stageCanvas = document.getElementById("cutscene-canvas") as HTMLCanvasElement;
    this.stageCtx = this.stageCanvas.getContext("2d")!;
    this.stageCtx.imageSmoothingEnabled = false;
    this.chapterEl = document.getElementById("cutscene-chapter")!;
    this.titleEl = document.getElementById("cutscene-title")!;
    this.counterEl = document.getElementById("cutscene-counter")!;
    this.progressFillEl = document.getElementById("cutscene-progress-fill")!;
    this.pipsEl = document.getElementById("cutscene-pips")!;
    this.sceneStampEl = document.getElementById("cutscene-scene-stamp")!;
    this.titleCardEl = document.getElementById("cutscene-title-card")!;
    this.speakerEl = document.getElementById("cutscene-speaker")!;
    this.textEl = document.getElementById("cutscene-text")!;
    this.prevBtn = document.getElementById("btn-cutscene-prev") as HTMLButtonElement;
    this.autoBtn = document.getElementById("btn-cutscene-auto") as HTMLButtonElement;
    this.nextBtn = document.getElementById("btn-cutscene-next") as HTMLButtonElement;
    this.skipBtn = document.getElementById("btn-cutscene-skip") as HTMLButtonElement;

    const w = this.stageCanvas.width;
    const h = this.stageCanvas.height;
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

    this.prevBtn.addEventListener("click", () => this.goPrev());
    this.autoBtn.addEventListener("click", () => this.toggleAutoPlay());
    this.nextBtn.addEventListener("click", () => this.advance());
    this.skipBtn.addEventListener("click", () => this.finish());
    this.stageCanvas.addEventListener("click", () => this.advance());

    this.keyListener = (e: KeyboardEvent) => {
      if (this.root.classList.contains("hidden")) return;
      if (e.code === "Space" || e.code === "Enter" || e.code === "ArrowRight") {
        e.preventDefault();
        this.advance();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        this.goPrev();
      } else if (e.code === "Escape") {
        e.preventDefault();
        this.finish();
      }
    };
    window.addEventListener("keydown", this.keyListener);
  }

  show(payload?: CutscenePlayPayload) {
    const id: StoryCutsceneId = payload?.sceneId ?? "scene_intro";
    const def = STORY_CUTSCENE_BY_ID[id] ?? STORY_CUTSCENE_BY_ID.scene_intro;
    this.activeScene = def;
    this.returnModal = payload?.returnModal ?? null;
    this.onDoneCb = payload?.onDone;
    this.beatIdx = 0;
    this.autoWaitT = 0;

    this.chapterEl.textContent = def.chapter;
    this.chapterEl.style.color = def.accent;
    this.titleEl.textContent = def.title;
    this._syncAutoBtn();

    this.root.classList.remove("hidden");
    this._enterBeat(0);

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
    this.activeFx.length = 0;
  }

  toggleAutoPlay() {
    sfx.unlock();
    sfx.playUiClick();
    this.autoPlay = !this.autoPlay;
    this.autoWaitT = 0;
    this._syncAutoBtn();
  }

  private _syncAutoBtn() {
    this.autoBtn.textContent = this.autoPlay ? "⏯ TỰ PHÁT: BẬT" : "⏯ TỰ PHÁT: TẮT";
    this.autoBtn.classList.toggle("active", this.autoPlay);
  }

  goPrev() {
    if (!this.activeScene || this.beatIdx <= 0) return;
    sfx.unlock();
    sfx.playUiClick();
    this._enterBeat(this.beatIdx - 1);
  }

  advance() {
    if (!this.activeScene) return;
    sfx.unlock();
    if (this.typedChars < this.fullText.length) {
      this.typedChars = this.fullText.length;
      this.textEl.textContent = this.fullText;
      this._updateNextBtnLabel();
      return;
    }
    sfx.playUiClick();
    if (this.beatIdx + 1 < this.activeScene.beats.length) {
      this._enterBeat(this.beatIdx + 1);
    } else {
      this.finish();
    }
  }

  finish() {
    sfx.playUiClick();
    const cb = this.onDoneCb;
    const ret = this.returnModal;
    this.onDoneCb = undefined;
    this.activeScene = null;
    this.hide();
    if (ret === "journal") {
      this.game.setModal("journal", { tab: "cutscenes" });
    } else if (ret === "class_select") {
      this.game.setModal("class_select", { switching: false });
    } else {
      this.game.setModal(ret);
    }
    if (cb) cb();
  }

  private _enterBeat(idx: number) {
    if (!this.activeScene) return;
    this.beatIdx = idx;
    this.beatT = 0;
    this.autoWaitT = 0;
    this.activeFx.length = 0;
    const beat = this.activeScene.beats[idx];
    this.cueStates = beat.fxCues.map((c) => ({ nextAt: c.delay, firedOnce: false }));

    const playerName = sanitizePlayerName(this.game.player?.name || this.game.pendingPlayerName, DEFAULT_HERO_NAME);
    const className = getClassDef(this.game.player?.classId ?? "prism_knight").vnName;
    this.speakerEl.textContent = interpolateCutsceneText(beat.speaker, playerName, className);
    this.speakerEl.style.color = beat.speakerColor;
    this.fullText = interpolateCutsceneText(beat.text, playerName, className);
    this.typedChars = 0;
    this.textEl.textContent = "";

    // Scene stamp & cinematic title card overlay
    if (beat.sceneLabel) {
      this.sceneStampEl.textContent = interpolateCutsceneText(beat.sceneLabel, playerName, className);
      this.sceneStampEl.classList.remove("hidden");
    } else {
      this.sceneStampEl.classList.add("hidden");
    }

    if (beat.titleCard) {
      const main = interpolateCutsceneText(beat.titleCard.main, playerName, className);
      const sub = interpolateCutsceneText(beat.titleCard.sub, playerName, className);
      const col = beat.titleCard.color ?? "#ffe066";
      this.titleCardEl.innerHTML = `<div class="cs-tc-main" style="color:${col}">${main}</div><div class="cs-tc-sub">${sub}</div>`;
      this.titleCardEl.classList.remove("hidden");
    } else {
      this.titleCardEl.classList.add("hidden");
    }

    this.flashAlpha = beat.flashColor ? 1 : 0;
    this.shakeAmp = beat.cameraShake ?? 0;
    this.shakeTimer = beat.cameraShake ? 0.48 : 0;

    // Trigger beat SFX
    if (beat.sfx === "waypoint") sfx.playWaypoint();
    else if (beat.sfx === "explosion") sfx.playExplosion();
    else if (beat.sfx === "slash") sfx.playSlash(2);
    else if (beat.sfx === "magic") sfx.playMagic(1);
    else if (beat.sfx === "boss") sfx.playExplosion();
    else if (beat.sfx === "quest") sfx.playQuestComplete();

    // Update counter, progress bar & clickable beat pips
    const total = this.activeScene.beats.length;
    const pad = (n: number) => String(n).padStart(2, "0");
    this.counterEl.textContent = `${pad(idx + 1)} / ${pad(total)}`;
    this.progressFillEl.style.width = `${Math.round(((idx + 1) / total) * 100)}%`;
    this.prevBtn.disabled = idx === 0;

    this.pipsEl.innerHTML = this.activeScene.beats
      .map(
        (_b, i) =>
          `<button type="button" class="cs-pip ${i === idx ? "active" : i < idx ? "done" : ""}" data-cs-jump="${i}" title="Cảnh ${i + 1}/${total}"></button>`
      )
      .join("");
    this.pipsEl.querySelectorAll("[data-cs-jump]").forEach((el) => {
      el.addEventListener("click", () => {
        const target = Number((el as HTMLElement).dataset.csJump);
        if (Number.isFinite(target)) {
          sfx.playUiClick();
          this._enterBeat(target);
        }
      });
    });

    this._updateNextBtnLabel();
  }

  private _updateNextBtnLabel() {
    if (!this.activeScene) return;
    const isLast = this.beatIdx + 1 >= this.activeScene.beats.length;
    if (this.typedChars < this.fullText.length) {
      this.nextBtn.textContent = "▶ HIỆN HẾT LỜI [SPACE]";
    } else if (isLast) {
      this.nextBtn.textContent = "★ TIẾP TỤC HÀNH TRÌNH [SPACE]";
    } else {
      this.nextBtn.textContent = `▶ CẢNH TIẾP (${this.beatIdx + 2}/${this.activeScene.beats.length}) [SPACE]`;
    }
  }

  private _tick(dt: number) {
    if (!this.activeScene) return;
    const beat = this.activeScene.beats[this.beatIdx];
    this.beatT += dt;

    // Typewriter progression
    if (this.typedChars < this.fullText.length) {
      this.typedChars = Math.min(this.fullText.length, this.typedChars + dt * this.typeSpeed);
      this.textEl.textContent = this.fullText.slice(0, Math.floor(this.typedChars));
      if (this.typedChars >= this.fullText.length) {
        this._updateNextBtnLabel();
      }
    } else if (this.autoPlay) {
      this.autoWaitT += dt;
      if (this.autoWaitT >= 2.6) {
        this.advance();
        return;
      }
    }

    // Flash & camera shake decay
    if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.1);
    if (this.shakeTimer > 0) this.shakeTimer = Math.max(0, this.shakeTimer - dt);

    // Spawn scheduled pixelfx cues
    for (let i = 0; i < beat.fxCues.length; i++) {
      const cue = beat.fxCues[i];
      const st = this.cueStates[i];
      if (!st) continue;
      if (this.beatT >= st.nextAt) {
        const mod = PIXELFX_MODS[cue.modId];
        if (mod) {
          const pal = cue.palette ? (PAL as Record<string, string[]>)[cue.palette] : undefined;
          const opts: Record<string, unknown> = {
            x: cue.x,
            y: cue.y,
            seed: Math.floor(this.beatT * 41) + i * 17 + this.beatIdx * 53,
          };
          if (cue.options) {
            for (const [k, v] of Object.entries(cue.options)) {
              if (v !== undefined) opts[k] = v;
            }
          }
          if (pal) opts.palette = pal;
          try {
            this.activeFx.push(createFx(mod, opts));
          } catch {
            // Keep cinema running cleanly if an effect option fails
          }
        }
        st.firedOnce = true;
        st.nextAt = cue.repeatEvery ? this.beatT + cue.repeatEvery : 99999;
      }
    }

    for (let i = this.activeFx.length - 1; i >= 0; i--) {
      this.activeFx[i].update(dt);
      if (this.activeFx[i].done()) this.activeFx.splice(i, 1);
    }

    this._renderStage(beat);
  }

  private _renderStage(beat: CutsceneBeat) {
    const ctx = this.stageCtx;
    const w = this.stageCanvas.width;
    const h = this.stageCanvas.height;

    const sx =
      this.shakeTimer > 0
        ? Math.round((Math.random() - 0.5) * 2 * this.shakeAmp * (this.shakeTimer / 0.48))
        : 0;
    const sy =
      this.shakeTimer > 0
        ? Math.round((Math.random() - 0.5) * 2 * this.shakeAmp * (this.shakeTimer / 0.48))
        : 0;
    const panX = beat.camPanX ? Math.round(easeOutCubic(Math.min(1, this.beatT / 4.5)) * beat.camPanX) : 0;

    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.translate(sx, sy);

    // 1. Pixel-art Biome Backdrop + Custom Cinema Setpiece
    this._drawBackdrop(ctx, w, h, beat.backdrop, panX);
    if (beat.setpiece) {
      this._drawSetpiece(ctx, w, h, beat.setpiece, panX);
    }

    // 2. Back-layer pixelfx effects
    if (this.activeFx.length > 0) {
      clearFrame(this.fxFrame);
      for (const fx of this.activeFx) fx.draw(this.fxFrame, "back");
      this._blitFrame(ctx);
    }

    // 3. Stage Actors (Heroes + HD codixel Enemies/Bosses + Elder Elian + Chroma Crystal)
    const defaultHeroClass = this.game.player?.classId ?? "prism_knight";
    const walkFrame = Math.floor(this.beatT * 5) % 4;

    for (let i = 0; i < beat.actors.length; i++) {
      const a = beat.actors[i];
      const enterDelay = a.enterDelay ?? 0;
      if (this.beatT < enterDelay) continue;
      const localT = this.beatT - enterDelay;
      const moveDur = a.moveDuration ?? 0.9;
      const moveU = easeOutCubic(localT / Math.max(0.1, moveDur));

      const curX = a.moveFromX !== undefined ? a.moveFromX + (a.x - a.moveFromX) * moveU : a.x;
      const curY = a.moveFromY !== undefined ? a.moveFromY + (a.y - a.moveFromY) * moveU : a.y;
      const bob = a.floatAmp ? Math.round(Math.sin(this.beatT * 3.1 + i * 1.4) * a.floatAmp) : 0;
      const ax = Math.round(curX);
      const ay = Math.round(curY + bob);
      const scale = a.scale ?? 1.4;

      // Ground shadow & aura pad
      ctx.fillStyle = "rgba(0,0,0,0.46)";
      ctx.fillRect(ax - Math.round(11 * scale), Math.round(Math.max(curY, 146)) - 2, Math.round(22 * scale), 4);
      if (a.auraColor) {
        const pulse = Math.round(Math.sin(this.beatT * 5 + i) * 2);
        ctx.fillStyle = a.auraColor;
        ctx.globalAlpha = 0.28;
        ctx.fillRect(ax - Math.round(14 * scale) - pulse, Math.round(curY) - 4, Math.round(28 * scale) + pulse * 2, 5);
        ctx.globalAlpha = 1;
      }

      if (a.kind === "hero") {
        const heroClass = a.classIdOverride ?? defaultHeroClass;
        const heroEquip =
          !a.classIdOverride && this.game.running && this.game.inv.hasValidEquippedWeapon(heroClass)
            ? this.game.inv.equipment
            : getClassShowcaseEquipment(heroClass);
        const atkKind: HeroAttackKind =
          a.attackKind ??
          (heroClass === "prism_knight"
            ? "overhead_slam"
            : heroClass === "chroma_mage"
              ? "orb_levitate"
              : heroClass === "bit_rogue"
                ? "dual_cross_slash"
                : "recoil_barrage");
        const isMovingIn = a.moveFromX !== undefined && moveU < 0.92;
        const animState = isMovingIn ? "run" : a.anim ?? "idle";
        const atkProg = animState === "attack" ? (this.beatT * 1.15) % 1 : 0;
        drawPixelfxHero(ctx, {
          classId: heroClass,
          equipment: heroEquip,
          x: ax,
          y: ay,
          rigScale: 1.0,
          drawScale: scale,
          walkFrame,
          facing: a.facing ?? 1,
          animState,
          attackKind: atkKind,
          attackProgress: atkProg,
          chargePct: animState === "charge" ? Math.min(1, 0.45 + Math.sin(this.beatT * 3.5) * 0.45) : 0,
          bleached: Boolean(a.bleached),
          time: this.beatT,
        });
      } else if (a.kind === "enemy" && a.enemyId) {
        const isBoss = a.enemyId.startsWith("boss_");
        ctx.save();
        ctx.translate(ax, ay);
        ctx.scale(scale, scale);
        drawCodixelEnemy(ctx, {
          defId: a.enemyId,
          uid: 900 + i,
          x: 0,
          y: 0,
          facingDir: a.facing === 1 ? "right" : a.facing === -1 ? "left" : "down",
          animKind: a.enemyAttack ? "quake_slam" : "idle",
          animProgress: a.enemyAttack ? (this.beatT * 0.85) % 1 : 0,
          animAngle: a.facing === 1 ? 0 : Math.PI,
          walkTime: this.beatT * 4,
          isMoving: !a.enemyAttack,
          isBoss,
          hitFlash: false,
          guardTime: 0,
          dashTime: 0,
          dashVx: 0,
          dashVy: 0,
          time: this.beatT,
        });
        ctx.restore();
      } else if (a.kind === "elder") {
        this._drawElderElian(ctx, ax, ay, scale, a.facing ?? 1);
      } else if (a.kind === "crystal") {
        this._drawChromaCrystal(ctx, ax, ay, scale);
      }
    }

    // 4. Front-layer pixelfx + additive light
    if (this.activeFx.length > 0) {
      clearFrame(this.fxFrame);
      for (const fx of this.activeFx) fx.draw(this.fxFrame, "front");
      this._blitFrame(ctx);
    }

    // 5. Ambient drifting weather particles
    if (beat.weather) {
      this._drawWeather(ctx, w, h, beat.weather);
    }

    // 6. Animated Bleach Invasion Sweep OR Color Restoration Wave!
    if (beat.bleachSweep && beat.bleachSweep > 0) {
      const progress = Math.min(1, this.beatT / 1.45) * beat.bleachSweep;
      const sweepW = Math.round(w * progress);
      ctx.save();
      ctx.globalCompositeOperation = "saturation";
      ctx.fillStyle = "rgba(180, 185, 200, 0.92)";
      ctx.fillRect(w - sweepW, 0, sweepW, h);
      ctx.restore();
      if (progress < beat.bleachSweep) {
        const edgeX = w - sweepW;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(edgeX, 0, 2, h);
        ctx.fillStyle = "#d688ff";
        ctx.fillRect(edgeX + 2, 0, 2, h);
      }
    } else if (beat.restoreSweep) {
      const progress = Math.min(1, this.beatT / 1.4);
      const remainW = Math.round(w * (1 - progress));
      if (remainW > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "saturation";
        ctx.fillStyle = "rgba(170, 175, 190, 0.9)";
        ctx.fillRect(w - remainW, 0, remainW, h);
        ctx.restore();
        const edgeX = w - remainW;
        const cols = ["#ff5577", "#ffe066", "#44ee88", "#4be8ff", "#c478ff"];
        for (let k = 0; k < cols.length; k++) {
          ctx.fillStyle = cols[k];
          ctx.fillRect(edgeX - k * 2, 0, 2, h);
        }
      }
    }

    // 7. Cinematic flash & smooth entry fade-in
    if (this.flashAlpha > 0 && beat.flashColor) {
      ctx.save();
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillStyle = beat.flashColor;
      ctx.fillRect(-10, -10, w + 20, h + 20);
      ctx.restore();
    }
    if (this.beatT < 0.22) {
      ctx.save();
      ctx.globalAlpha = 1 - this.beatT / 0.22;
      ctx.fillStyle = "#06070f";
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // 8. Crisp 16-bit cinema letterbox bars top/bottom
    ctx.fillStyle = "#06070f";
    ctx.fillRect(0, 0, w, 10);
    ctx.fillRect(0, h - 10, w, 10);
    ctx.fillStyle = "#293356";
    ctx.fillRect(0, 10, w, 1);
    ctx.fillRect(0, h - 11, w, 1);

    ctx.restore();
  }

  private _blitFrame(ctx: CanvasRenderingContext2D) {
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

  private _drawBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number, theme: CutsceneBackdropId, panX: number) {
    const palettes: Record<CutsceneBackdropId, { sky: string[]; hill: string; ridge: string; ground: string; tile: string; star: string }> = {
      town_golden: {
        sky: ["#0b1330", "#14224b", "#1f3568", "#2d4e82"],
        hill: "#1e3a52",
        ridge: "#3b6e88",
        ground: "#243046",
        tile: "#3b4c6c",
        star: "#ffe066",
      },
      bleach_invasion: {
        sky: ["#0b0912", "#181326", "#291d3a", "#3a2548"],
        hill: "#262332",
        ridge: "#544c68",
        ground: "#1d1b26",
        tile: "#363345",
        star: "#d8a8ff",
      },
      meadow_ancient: {
        sky: ["#0a1d24", "#12323a", "#1c4a48", "#2b6852"],
        hill: "#163b2a",
        ridge: "#2e6b42",
        ground: "#183324",
        tile: "#2c5b3a",
        star: "#a8ff98",
      },
      quartz_cavern: {
        sky: ["#071226", "#0d2244", "#163664", "#225086"],
        hill: "#142c54",
        ridge: "#3c7eb8",
        ground: "#122440",
        tile: "#2c5484",
        star: "#7ceaff",
      },
      amber_forge: {
        sky: ["#1a0808", "#32100e", "#521a12", "#782b16"],
        hill: "#3c1610",
        ridge: "#8a3618",
        ground: "#28110c",
        tile: "#5a2414",
        star: "#ffae35",
      },
      void_sanctum: {
        sky: ["#07040e", "#110924", "#1d0f3c", "#2c1756"],
        hill: "#180d32",
        ridge: "#4b2688",
        ground: "#120a24",
        tile: "#311a5c",
        star: "#c888ff",
      },
      rainbow_dawn: {
        sky: ["#141a46", "#24306e", "#3d4c96", "#666ab4"],
        hill: "#1f4c46",
        ridge: "#44aa88",
        ground: "#1e3a38",
        tile: "#3c7468",
        star: "#ffe680",
      },
    };
    const pal = palettes[theme];
    const bandH = Math.ceil(132 / pal.sky.length);
    for (let i = 0; i < pal.sky.length; i++) {
      ctx.fillStyle = pal.sky[i];
      ctx.fillRect(0, i * bandH, w, bandH);
    }

    if (theme === "rainbow_dawn") {
      const arcs = ["#ff5577", "#ffaa33", "#ffe066", "#44ee88", "#4be8ff", "#c478ff"];
      for (let i = 0; i < arcs.length; i++) {
        ctx.fillStyle = arcs[i];
        ctx.globalAlpha = 0.25;
        ctx.fillRect(0, 62 + i * 7, w, 6);
      }
      ctx.globalAlpha = 1;
    }

    for (let i = 0; i < 42; i++) {
      const sx = ((i * 79 + Math.floor(this.beatT * (theme === "amber_forge" ? 12 : 3)) - Math.round(panX * 0.2)) % w + w) % w;
      const sy = (i * 37 + 14) % 108;
      if (Math.sin(this.beatT * 3 + i) > -0.2) {
        ctx.fillStyle = pal.star;
        ctx.fillRect(sx, sy, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
      }
    }

    for (let x = 0; x < w; x += 6) {
      const wx = x + panX;
      const mH = Math.round(22 + Math.sin(wx * 0.025) * 16 + Math.cos(wx * 0.06 + 0.7) * 8);
      ctx.fillStyle = pal.hill;
      ctx.fillRect(x, 136 - mH, 6, mH + 14);
      ctx.fillStyle = pal.ridge;
      ctx.fillRect(x, 136 - mH, 6, 2);
    }

    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, 140, w, h - 140);
    ctx.fillStyle = pal.ridge;
    ctx.fillRect(0, 140, w, 3);
    ctx.fillStyle = pal.tile;
    for (let y = 148; y < h; y += 10) {
      for (let x = (y % 20 === 0 ? 0 : 12); x < w; x += 24) {
        ctx.fillRect(x, y, 10, 2);
      }
    }
  }

  private _drawSetpiece(ctx: CanvasRenderingContext2D, w: number, _h: number, sp: CutsceneSetpieceId, panX: number) {
    const px = -Math.round(panX * 0.5);
    if (sp === "origin_town") {
      // Cozy 16-bit Origin Town houses, pitched roofs & glowing warm lanterns on left & right
      const houses = [
        { x: 18 + px, w: 58, h: 42, roof: "#2c5499" },
        { x: 86 + px, w: 46, h: 34, roof: "#8c324a" },
        { x: 348 + px, w: 48, h: 36, roof: "#2c785c" },
        { x: 404 + px, w: 60, h: 44, roof: "#3a4b96" },
      ];
      for (const hs of houses) {
        const baseY = 140;
        ctx.fillStyle = "#141c2e";
        ctx.fillRect(hs.x, baseY - hs.h, hs.w, hs.h);
        ctx.fillStyle = "#22304c";
        ctx.fillRect(hs.x + 2, baseY - hs.h + 2, hs.w - 4, hs.h - 2);
        // Pitched pixel roof
        ctx.fillStyle = hs.roof;
        ctx.fillRect(hs.x - 4, baseY - hs.h - 8, hs.w + 8, 10);
        ctx.fillRect(hs.x + 2, baseY - hs.h - 14, hs.w - 4, 6);
        // Warm glowing windows
        ctx.fillStyle = "#ffe066";
        ctx.fillRect(hs.x + 8, baseY - hs.h + 10, 9, 9);
        ctx.fillRect(hs.x + hs.w - 17, baseY - hs.h + 10, 9, 9);
        ctx.fillStyle = "#ffae35";
        ctx.fillRect(hs.x + 12, baseY - hs.h + 10, 1, 9);
        ctx.fillRect(hs.x + hs.w - 13, baseY - hs.h + 10, 1, 9);
      }
      // Glowing Town Lantern Posts
      for (const lx of [146 + px, 334 + px]) {
        ctx.fillStyle = "#1c2438";
        ctx.fillRect(lx, 108, 3, 32);
        ctx.fillStyle = "#ffe066";
        ctx.fillRect(lx - 2, 102, 7, 7);
        ctx.fillStyle = "rgba(255, 224, 102, 0.22)";
        ctx.fillRect(lx - 7, 97, 17, 17);
      }
    } else if (sp === "four_pillars") {
      // 9 distant Chroma Pillars beaming vertical pastel light columns to heaven
      const cols = ["#ff5577", "#ffaa33", "#ffe066", "#44ee88", "#4be8ff", "#7a8cff", "#c478ff", "#ff88cc", "#5ef2ff"];
      for (let i = 0; i < 9; i++) {
        const bx = 36 + i * 51 + px;
        const pulse = 0.2 + 0.14 * Math.sin(this.beatT * 3 + i * 0.9);
        ctx.fillStyle = cols[i];
        ctx.globalAlpha = pulse;
        ctx.fillRect(bx - 3, 12, 8, 128);
        ctx.globalAlpha = 0.9;
        ctx.fillRect(bx - 1, 114, 4, 26);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(bx, 110, 2, 6);
      }
      ctx.globalAlpha = 1;
    } else if (sp === "ancient_canopy") {
      // Towering Emerald Forest trunks & canopies framing edges
      for (const tx of [14 + px, 424 + px]) {
        ctx.fillStyle = "#1c120c";
        ctx.fillRect(tx + 8, 62, 18, 78);
        ctx.fillStyle = "#362216";
        ctx.fillRect(tx + 12, 66, 8, 74);
        ctx.fillStyle = "#164428";
        ctx.fillRect(tx - 16, 18, 66, 48);
        ctx.fillStyle = "#287640";
        ctx.fillRect(tx - 10, 24, 54, 34);
        ctx.fillStyle = "#48b058";
        ctx.fillRect(tx - 2, 28, 36, 16);
      }
    } else if (sp === "ice_spires") {
      // Crystalline sapphire spires rising on both sides
      const spires = [
        { x: 24 + px, h: 78, w: 20 },
        { x: 54 + px, h: 52, w: 14 },
        { x: 412 + px, h: 64, w: 16 },
        { x: 438 + px, h: 86, w: 22 },
      ];
      for (const s of spires) {
        for (let dy = 0; dy < s.h; dy += 2) {
          const hw = Math.max(1, Math.round((dy / s.h) * (s.w * 0.5)));
          ctx.fillStyle = "#1b4e86";
          ctx.fillRect(s.x - hw, 140 - s.h + dy, hw * 2, 2);
          ctx.fillStyle = "#7ceaff";
          ctx.fillRect(s.x - Math.max(1, Math.floor(hw * 0.6)), 140 - s.h + dy, Math.max(1, Math.floor(hw * 0.6)), 2);
        }
      }
    } else if (sp === "magma_fissure") {
      // Glowing molten amber cracks on floor + lava plumes
      const glow = 0.65 + 0.35 * Math.sin(this.beatT * 6);
      ctx.fillStyle = "#ff5518";
      ctx.globalAlpha = glow;
      ctx.fillRect(40, 152, 92, 3);
      ctx.fillRect(348, 154, 96, 3);
      ctx.fillRect(184, 166, 112, 4);
      ctx.fillStyle = "#ffe066";
      ctx.fillRect(62, 153, 46, 1);
      ctx.fillRect(366, 155, 52, 1);
      ctx.fillRect(204, 167, 72, 2);
      ctx.globalAlpha = 1;
    } else if (sp === "sky_rift") {
      // Jagged crackling purple-white dimensional sky tear!
      const jit = Math.round(Math.sin(this.beatT * 24) * 1.5);
      for (let i = 0; i < 24; i++) {
        const rx = 90 + i * 13;
        const ry = 36 + Math.round(Math.sin(i * 0.85) * 14) + (i % 2 === 0 ? jit : -jit);
        const rh = 6 + Math.round(Math.sin((i / 23) * Math.PI) * 20);
        ctx.fillStyle = "#5b249e";
        ctx.fillRect(rx - 2, ry - rh / 2 - 2, 16, rh + 4);
        ctx.fillStyle = "#d688ff";
        ctx.fillRect(rx, ry - rh / 2, 13, rh);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(rx + 2, ry - Math.max(2, rh / 4), 10, Math.max(2, rh / 2));
      }
    } else if (sp === "shattered_prism") {
      // 8 Lore Shards exploding & orbiting outward from center!
      const shardCols = ["#ff5577", "#ffaa33", "#ffe066", "#44ee88", "#4be8ff", "#7a8cff", "#c478ff", "#ff88cc"];
      const spread = 24 + easeOutCubic(Math.min(1, this.beatT / 1.8)) * 130;
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 + this.beatT * 0.55;
        const sx = Math.round(240 + Math.cos(ang) * spread);
        const sy = Math.round(98 + Math.sin(ang) * (spread * 0.42));
        ctx.fillStyle = "#080a14";
        ctx.fillRect(sx - 5, sy - 6, 10, 12);
        ctx.fillStyle = shardCols[i];
        ctx.fillRect(sx - 4, sy - 5, 8, 10);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(sx - 2, sy - 3, 3, 4);
      }
    } else if (sp === "horizon_biomes") {
      // Panoramic 4-biome glowing skyline silhouettes
      const zones = [
        { x: 0, w: 120, col: "#245c38", top: "#48d078" },
        { x: 120, w: 120, col: "#1d4278", top: "#5ef2ff" },
        { x: 240, w: 120, col: "#6e2618", top: "#ffaa33" },
        { x: 360, w: 120, col: "#361c66", top: "#d688ff" },
      ];
      for (const z of zones) {
        ctx.fillStyle = z.col;
        ctx.fillRect(z.x, 120, z.w, 22);
        ctx.fillStyle = z.top;
        ctx.fillRect(z.x, 120, z.w, 2);
      }
      // Subtle horizon sun
      ctx.fillStyle = "#ffe066";
      ctx.fillRect(216, 86, 48, 34);
      ctx.fillStyle = "#fff8d6";
      ctx.fillRect(224, 92, 32, 22);
    }
    void w;
  }

  private _drawWeather(ctx: CanvasRenderingContext2D, w: number, h: number, weather: CutsceneWeatherId) {
    const count = weather === "glitch_rain" ? 28 : 24;
    for (let i = 0; i < count; i++) {
      if (weather === "petals") {
        const px = ((i * 53 + this.beatT * (26 + (i % 4) * 6)) % w + w) % w;
        const py = ((i * 31 + this.beatT * (18 + (i % 3) * 5) + Math.sin(this.beatT * 3 + i) * 6) % (h - 24)) + 12;
        ctx.fillStyle = i % 3 === 0 ? "#ff99cc" : "#70f0b4";
        ctx.fillRect(Math.round(px), Math.round(py), 3, 2);
      } else if (weather === "ash") {
        const px = ((i * 61 + Math.sin(this.beatT * 2 + i) * 14) % w + w) % w;
        const py = h - 14 - (((i * 29 + this.beatT * (24 + (i % 4) * 7)) % (h - 28)));
        ctx.fillStyle = i % 2 === 0 ? "#ffae35" : "#ff5522";
        ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
      } else if (weather === "snow") {
        const px = ((i * 47 - this.beatT * 14 + Math.sin(this.beatT * 2 + i) * 8) % w + w) % w;
        const py = ((i * 27 + this.beatT * (22 + (i % 3) * 8)) % (h - 24)) + 12;
        ctx.fillStyle = i % 3 === 0 ? "#ffffff" : "#9bdcff";
        ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
      } else if (weather === "glitch_rain") {
        const px = (i * 37 + Math.floor(this.beatT * 60) * ((i % 3) - 1)) % w;
        const py = ((i * 23 + this.beatT * 110) % (h - 24)) + 12;
        ctx.fillStyle = i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#d688ff" : "#5ef2ff";
        ctx.fillRect((px + w) % w, Math.round(py), 1, 7);
      } else if (weather === "prism_sparks") {
        const cols = ["#ff5577", "#ffe066", "#44ee88", "#4be8ff", "#c478ff"];
        const px = ((i * 59 + Math.sin(this.beatT * 1.8 + i) * 12) % w + w) % w;
        const py = h - 16 - (((i * 33 + this.beatT * (16 + (i % 4) * 5)) % (h - 30)));
        ctx.fillStyle = cols[i % cols.length];
        ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
      }
    }
  }

  private _drawElderElian(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, facing: 1 | -1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale * facing, scale);
    ctx.fillStyle = "#080a14";
    ctx.fillRect(-6, -24, 12, 24);
    ctx.fillStyle = "#20508c";
    ctx.fillRect(-5, -15, 10, 14);
    ctx.fillStyle = "#3684d4";
    ctx.fillRect(-4, -14, 6, 12);
    ctx.fillStyle = "#ffe066";
    ctx.fillRect(-1, -14, 2, 12);
    ctx.fillStyle = "#f2c6a0";
    ctx.fillRect(-3, -22, 6, 6);
    ctx.fillStyle = "#eef6ff";
    ctx.fillRect(-3, -17, 6, 4);
    ctx.fillStyle = "#193a6b";
    ctx.fillRect(-5, -24, 10, 4);
    ctx.fillStyle = "#0b0d14";
    ctx.fillRect(1, -20, 1, 1);
    ctx.fillStyle = "#8a5a2c";
    ctx.fillRect(6, -25, 2, 24);
    ctx.fillStyle = "#5ef2ff";
    ctx.fillRect(5, -28, 4, 4);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(6, -27, 2, 2);
    ctx.restore();
  }

  private _drawChromaCrystal(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const cols = ["#ff5577", "#ffe066", "#44ee88", "#4be8ff", "#c478ff"];
    for (let dy = -20; dy <= 20; dy += 2) {
      const hw = Math.max(2, Math.round((1 - Math.abs(dy) / 22) * 12));
      const c = cols[Math.floor(((dy + 20 + this.beatT * 20) / 8) % cols.length + cols.length) % cols.length];
      ctx.fillStyle = "#080a14";
      ctx.fillRect(-hw - 1, dy - 18, hw * 2 + 2, 2);
      ctx.fillStyle = c;
      ctx.fillRect(-hw, dy - 18, hw * 2, 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-Math.max(1, Math.floor(hw * 0.45)), dy - 18, 2, 2);
    }
    ctx.restore();
  }
}
