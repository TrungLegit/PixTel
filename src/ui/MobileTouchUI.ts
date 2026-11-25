import { sfx } from "../audio/chiptuneSynth";
import type { PixTelOpenWorldGame } from "../game";

/**
 * Phase 1 Mobile Twin-Stick Touch Controls & Landscape UX:
 * - Auto-activates on smartphones/tablets (`pointer: coarse` or `maxTouchPoints > 0`) and can also be toggled via HUD `📱`.
 * - Multi-touch Left Virtual Analog Joystick (pushing >= 82% engages Sprint automatically + optional Sprint Lock pill).
 * - Multi-touch Right Action Cluster:
 *   - `⚔ ĐÁNH / TỤ`: Tap for 3-step Combo with Smart Auto-Aim; Hold for Charged Attack (glows white-gold on Just-Charge!); Drag >14px for manual 360° Twin-Stick Aim!
 *   - `💨 LƯỚT` (Chroma Dodge), `✦ [E]` (Skill), `🔥 [Q]` (Ultimate), `🖐 [F]` (Context Interact).
 */
export class MobileTouchUI {
  private game: PixTelOpenWorldGame;
  private root: HTMLElement;
  private joyZone: HTMLElement;
  private joyBase: HTMLElement;
  private joyKnob: HTMLElement;
  private sprintBtn: HTMLButtonElement;
  private atkBtn: HTMLElement;
  private atkSubEl: HTMLElement;
  private dashBtn: HTMLElement;
  private dashSubEl: HTMLElement;
  private skillBtn: HTMLElement;
  private skillSubEl: HTMLElement;
  private ultBtn: HTMLElement;
  private ultSubEl: HTMLElement;
  private interactBtn: HTMLElement;
  private rotateBanner: HTMLElement;

  private joyTouchId: number | null = null;
  private joyOriginX = 0;
  private joyOriginY = 0;
  private readonly joyMaxR = 44;
  private sprintLocked = false;

  private atkTouchId: number | null = null;
  private atkOriginX = 0;
  private atkOriginY = 0;

  constructor(game: PixTelOpenWorldGame) {
    this.game = game;
    this.root = document.getElementById("mobile-touch-layer")!;
    this.joyZone = document.getElementById("touch-joy-zone")!;
    this.joyBase = document.getElementById("touch-joy-base")!;
    this.joyKnob = document.getElementById("touch-joy-knob")!;
    this.sprintBtn = document.getElementById("touch-btn-sprint") as HTMLButtonElement;
    this.atkBtn = document.getElementById("touch-btn-atk")!;
    this.atkSubEl = document.getElementById("touch-atk-sub")!;
    this.dashBtn = document.getElementById("touch-btn-dash")!;
    this.dashSubEl = document.getElementById("touch-dash-sub")!;
    this.skillBtn = document.getElementById("touch-btn-skill")!;
    this.skillSubEl = document.getElementById("touch-skill-sub")!;
    this.ultBtn = document.getElementById("touch-btn-ult")!;
    this.ultSubEl = document.getElementById("touch-ult-sub")!;
    this.interactBtn = document.getElementById("touch-btn-interact")!;
    this.rotateBanner = document.getElementById("mobile-rotate-banner")!;

    const isTouchCapable =
      (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0) ||
      (typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches);

    if (isTouchCapable) {
      this.game.mobileMode = true;
      document.body.classList.add("is-mobile-touch");
    }

    this._bindTouchEvents();
    this._checkOrientation();
    window.addEventListener("resize", () => this._checkOrientation());
    window.addEventListener("orientationchange", () => this._checkOrientation());
  }

  toggleMobileOverlay() {
    this.game.mobileMode = !this.game.mobileMode;
    document.body.classList.toggle("is-mobile-touch", this.game.mobileMode);
    if (!this.game.mobileMode) {
      this._resetAllTouches();
    }
    this.update();
    this._checkOrientation();
  }

  private _checkOrientation() {
    if (!this.rotateBanner) return;
    const isPortrait = window.innerHeight > window.innerWidth * 1.05;
    this.rotateBanner.classList.toggle("hidden", !(this.game.mobileMode && isPortrait));
  }

  private _resetAllTouches() {
    this.joyTouchId = null;
    this.atkTouchId = null;
    this.game.touchMoveX = 0;
    this.game.touchMoveY = 0;
    this.game.touchSprint = false;
    this.joyKnob.style.transform = `translate(0px, 0px)`;
    this.joyBase.classList.remove("active", "sprinting");
    this.atkBtn.classList.remove("pressing", "just-window");
    this.game.mobileEndAttack();
  }

  private _bindTouchEvents() {
    // Auto-enable touch mode & unlock WebAudio on first real touch anywhere!
    window.addEventListener(
      "touchstart",
      () => {
        sfx.unlock();
        if (!this.game.mobileMode) {
          this.game.mobileMode = true;
          document.body.classList.add("is-mobile-touch");
          this._checkOrientation();
          this.update();
        }
      },
      { passive: true }
    );

    document.getElementById("btn-rotate-fullscreen")?.addEventListener("click", () => {
      sfx.unlock();
      sfx.playUiClick();
      this.game.toggleFullscreen();
    });

    // Sprint Lock Toggle
    this.sprintBtn.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      sfx.unlock();
      sfx.playUiClick();
      this.sprintLocked = !this.sprintLocked;
      this.sprintBtn.classList.toggle("on", this.sprintLocked);
      this.game.touchSprint = this.sprintLocked;
    });

    // === LEFT ANALOG VIRTUAL JOYSTICK ===
    this.joyZone.addEventListener(
      "touchstart",
      (ev) => {
        if (!this.game.running || this.game.activeModal !== null) return;
        ev.preventDefault();
        sfx.unlock();
        if (this.joyTouchId !== null) return;
        const t = ev.changedTouches[0];
        if (!t) return;
        this.joyTouchId = t.identifier;

        const rect = this.joyZone.getBoundingClientRect();
        this.joyOriginX = Math.max(rect.left + 52, Math.min(rect.right - 52, t.clientX));
        this.joyOriginY = Math.max(rect.top + 52, Math.min(rect.bottom - 52, t.clientY));

        this.joyBase.style.left = `${Math.round(this.joyOriginX - rect.left - 48)}px`;
        this.joyBase.style.top = `${Math.round(this.joyOriginY - rect.top - 48)}px`;
        this.joyBase.classList.add("active");
        this._updateJoystick(t.clientX, t.clientY);
      },
      { passive: false }
    );

    this.joyZone.addEventListener(
      "touchmove",
      (ev) => {
        if (this.joyTouchId === null) return;
        ev.preventDefault();
        for (let i = 0; i < ev.changedTouches.length; i++) {
          const t = ev.changedTouches[i];
          if (t.identifier === this.joyTouchId) {
            this._updateJoystick(t.clientX, t.clientY);
            break;
          }
        }
      },
      { passive: false }
    );

    const endJoy = (ev: TouchEvent) => {
      if (this.joyTouchId === null) return;
      for (let i = 0; i < ev.changedTouches.length; i++) {
        if (ev.changedTouches[i].identifier === this.joyTouchId) {
          this.joyTouchId = null;
          this.game.touchMoveX = 0;
          this.game.touchMoveY = 0;
          this.game.touchSprint = this.sprintLocked;
          this.joyKnob.style.transform = `translate(0px, 0px)`;
          this.joyBase.classList.remove("active", "sprinting");
          break;
        }
      }
    };
    this.joyZone.addEventListener("touchend", endJoy);
    this.joyZone.addEventListener("touchcancel", endJoy);

    // === RIGHT PRIMARY ATTACK + HOLD CHARGE + DRAG AIM ===
    this.atkBtn.addEventListener(
      "touchstart",
      (ev) => {
        if (!this.game.running || this.game.activeModal !== null) return;
        ev.preventDefault();
        sfx.unlock();
        if (this.atkTouchId !== null) return;
        const t = ev.changedTouches[0];
        if (!t) return;
        this.atkTouchId = t.identifier;
        const rect = this.atkBtn.getBoundingClientRect();
        this.atkOriginX = rect.left + rect.width / 2;
        this.atkOriginY = rect.top + rect.height / 2;
        this.atkBtn.classList.add("pressing");
        this.game.mobileStartAttack();
      },
      { passive: false }
    );

    this.atkBtn.addEventListener(
      "touchmove",
      (ev) => {
        if (this.atkTouchId === null) return;
        ev.preventDefault();
        for (let i = 0; i < ev.changedTouches.length; i++) {
          const t = ev.changedTouches[i];
          if (t.identifier === this.atkTouchId) {
            const dx = t.clientX - this.atkOriginX;
            const dy = t.clientY - this.atkOriginY;
            if (Math.hypot(dx, dy) > 14) {
              this.game.mobileUpdateAttackAim(Math.atan2(dy, dx));
            }
            break;
          }
        }
      },
      { passive: false }
    );

    const endAtk = (ev: TouchEvent) => {
      if (this.atkTouchId === null) return;
      for (let i = 0; i < ev.changedTouches.length; i++) {
        if (ev.changedTouches[i].identifier === this.atkTouchId) {
          this.atkTouchId = null;
          this.atkBtn.classList.remove("pressing", "just-window");
          this.game.mobileEndAttack();
          break;
        }
      }
    };
    this.atkBtn.addEventListener("touchend", endAtk);
    this.atkBtn.addEventListener("touchcancel", endAtk);

    // Also support desktop pointer testing when `📱` is toggled on PC!
    this.atkBtn.addEventListener("mousedown", (ev) => {
      if (ev.button !== 0 || this.atkTouchId !== null) return;
      ev.preventDefault();
      sfx.unlock();
      this.atkBtn.classList.add("pressing");
      this.game.mobileStartAttack();
    });
    window.addEventListener("mouseup", () => {
      if (this.atkTouchId === null && this.atkBtn.classList.contains("pressing")) {
        this.atkBtn.classList.remove("pressing", "just-window");
        this.game.mobileEndAttack();
      }
    });

    // === DASH / SKILL [E] / ULT [Q] / INTERACT [F] ===
    const bindInstantBtn = (el: HTMLElement, fn: () => void) => {
      el.addEventListener(
        "touchstart",
        (ev) => {
          ev.preventDefault();
          sfx.unlock();
          fn();
        },
        { passive: false }
      );
      el.addEventListener("click", (ev) => {
        ev.preventDefault();
        sfx.unlock();
        fn();
      });
    };

    bindInstantBtn(this.dashBtn, () => this.game.mobileDash());
    bindInstantBtn(this.skillBtn, () => this.game.mobileSkillE());
    bindInstantBtn(this.ultBtn, () => this.game.mobileUltQ());
    bindInstantBtn(this.interactBtn, () => this.game.interactNearest());
  }

  private _updateJoystick(clientX: number, clientY: number) {
    const dx = clientX - this.joyOriginX;
    const dy = clientY - this.joyOriginY;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(this.joyMaxR, dist);
    const ang = Math.atan2(dy, dx);
    const kx = dist > 3 ? Math.cos(ang) * clamped : 0;
    const ky = dist > 3 ? Math.sin(ang) * clamped : 0;

    this.joyKnob.style.transform = `translate(${Math.round(kx)}px, ${Math.round(ky)}px)`;

    if (dist > 6) {
      const mag = Math.min(1, dist / this.joyMaxR);
      this.game.touchMoveX = Math.cos(ang) * mag;
      this.game.touchMoveY = Math.sin(ang) * mag;
      const autoSprint = this.sprintLocked || dist >= this.joyMaxR * 0.84;
      this.game.touchSprint = autoSprint;
      this.joyBase.classList.toggle("sprinting", autoSprint);
    } else {
      this.game.touchMoveX = 0;
      this.game.touchMoveY = 0;
      this.game.touchSprint = this.sprintLocked;
      this.joyBase.classList.remove("sprinting");
    }
  }

  update() {
    const show =
      this.game.mobileMode && this.game.running && this.game.activeModal === null;
    this.root.classList.toggle("hidden", !show);
    if (!show) return;

    const p = this.game.player;
    const reqCharge = p.quickChargeTimer > 0 ? 0.26 : 0.38;
    const inJust =
      p.charging && p.chargeTime >= reqCharge + 0.12 && p.chargeTime <= reqCharge + 0.34;
    this.atkBtn.classList.toggle("just-window", inJust);
    this.atkSubEl.textContent = inJust
      ? "NHẢ NGAY!"
      : p.charging && p.chargeTime >= reqCharge
        ? "ĐẦY LỰC!"
        : p.quickChargeTimer > 0
          ? "TỤ NHANH!"
          : `NHỊP ${p.comboTimer > 0 ? (p.comboStep === 0 ? 3 : p.comboStep) : 1}/3`;

    this.dashSubEl.textContent = p.dashCd > 0 ? `${p.dashCd.toFixed(1)}s` : "SẴN SÀNG";
    this.dashBtn.classList.toggle("on-cd", p.dashCd > 0);

    this.skillSubEl.textContent = p.skillCd > 0 ? `${p.skillCd.toFixed(1)}s` : "SẴN SÀNG";
    this.skillBtn.classList.toggle("on-cd", p.skillCd > 0);

    const ultPct = Math.floor(p.overdrive);
    this.ultSubEl.textContent = ultPct >= 100 ? "BÙNG NỔ!" : `${ultPct}%`;
    this.ultBtn.classList.toggle("ult-ready", ultPct >= 100);

    const hasInteract = Boolean(this.game.nearestInteractable);
    this.interactBtn.classList.toggle("active-target", hasInteract);
  }
}
