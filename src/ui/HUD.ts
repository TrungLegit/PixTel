import { getClassDef } from "../data/classes";
import { ENEMIES } from "../data/enemies";
import { GACHA_BANNERS } from "../data/gacha";
import { CONSUMABLE_GROUP_LABELS, ITEMS, getTierBadge } from "../data/items";
import { LORE_TABLETS } from "../data/lore";
import type { ClassId } from "../data/types";
import { getWeaponSkillForItem } from "../data/weaponSkills";
import {
  BIOME_CONFIGS,
  TILE_SIZE,
  TOWN_NPCS,
  WAYPOINTS,
  WORLD_CAMPS,
  WORLD_COLS,
  WORLD_ROWS,
} from "../data/worldConfig";
import { drawCodixelIcon, onCodixelReady } from "../graphics/codixelAtlas";
import { ELEMENT_META } from "../data/elements";
import { ELEMENT_DISPLAY } from "../systems/forgeSystem";
import { BEGINNER_PRACTICE_STEPS } from "./TutorialModal";
import { uiRarityFx } from "../vfx/uiRarityFx";
import type { PixTelOpenWorldGame } from "../game";
import { sfx } from "../audio/chiptuneSynth";
import { DEFAULT_HERO_NAME, sanitizePlayerName } from "../utils/playerName";

const CLASS_SKILL_ICONS: Record<ClassId, { lmb: string; skill: string; ult: string }> = {
  prism_knight: { lmb: "skill_knight_lmb", skill: "skill_knight_e", ult: "skill_knight_q" },
  chroma_mage: { lmb: "skill_mage_lmb", skill: "skill_mage_e", ult: "skill_mage_q" },
  bit_rogue: { lmb: "skill_rogue_lmb", skill: "skill_rogue_e", ult: "skill_rogue_q" },
  pixel_tinker: { lmb: "skill_tinker_lmb", skill: "skill_tinker_e", ult: "skill_tinker_q" },
};

type HudTipKind = "bag" | "gacha" | "lmb" | "skill" | "ult" | "dash";

const ELEMENT_LABELS = [
  { name: "HỎA", color: "#ff7b54" },
  { name: "BĂNG", color: "#38e8ff" },
  { name: "MỘC", color: "#44ee88" },
  { name: "LÔI", color: "#ffee44" },
  { name: "SẮC ĐỘ", color: "#ff66c4" },
];

/**
 * In-game HUD v2.6:
 * - Top-left Hero stats, HP/XP bars, Gold, Biome + Color Restoration & Lore Codex progress
 * - Top-center Boss HP + Phase + Bleach Shield / Totem Ritual / Vulnerable indicator + Guided Beginner Banner
 * - Top-right Live Pixel Minimap (with Waypoints, Bosses, Chests & Lore Tablets) + Quest Tracker
 * - Bottom Skill Hotbar (Combo step, E, Q, Chroma Dodge, 1-4 Smart Codixel Consumables) + [F] Interact Prompt
 */
export class HudUI {
  private game: PixTelOpenWorldGame;
  private hudRoot: HTMLElement;
  private miniCanvas: HTMLCanvasElement;
  private miniCtx: CanvasRenderingContext2D;
  private toastContainer: HTMLElement;
  private tutorialBannerEl: HTMLElement | null;
  private partyBoxEl: HTMLElement | null;
  private skillTooltipEl: HTMLElement | null;
  private hoveredTipKind: HudTipKind | null = null;
  private hoveredSlotEl: HTMLElement | null = null;
  private lastTipSig = "";
  private lastTutorialStepKey = "";
  private lastPartySig = "";
  private cachedHotbarIcons = ["", "", "", ""];
  private cachedSkillIcons: Record<string, string> = {};
  private toastTimers = new WeakMap<HTMLElement, { fade: number; remove?: number }>();
  onToggleTouch?: () => void;

  constructor(game: PixTelOpenWorldGame) {
    this.game = game;
    this.hudRoot = document.getElementById("hud-layer")!;
    this.miniCanvas = document.getElementById("minimap-canvas") as HTMLCanvasElement;
    this.miniCtx = this.miniCanvas.getContext("2d")!;
    this.miniCtx.imageSmoothingEnabled = false;
    this.toastContainer = document.getElementById("toast-stack")!;
    this.tutorialBannerEl = document.getElementById("hud-tutorial-banner");
    this.partyBoxEl = document.getElementById("hud-party-box");
    this.skillTooltipEl = document.getElementById("hud-skill-tooltip");

    onCodixelReady(() => {
      this.cachedHotbarIcons.fill("");
      this.cachedSkillIcons = {};
      this.lastTipSig = "";
      this.update();
    });

    // Quick toolbar buttons
    document.getElementById("hud-btn-gacha")?.addEventListener("click", () => this.game.toggleModal("gacha"));
    document.getElementById("hud-btn-coop")?.addEventListener("click", () => this.game.toggleModal("coop"));
    document.getElementById("hud-btn-hud")?.addEventListener("click", () => {
      sfx.playUiClick();
      const on = this.game.toggleCompactHud();
      this.toast(
        on ? "👁 Đã thu gọn HUD chiến đấu (Nhấn [V] để hiện đầy đủ)" : "👁 Đã hiện đầy đủ HUD",
        "info"
      );
    });
    document.getElementById("hud-btn-touch")?.addEventListener("click", () => {
      sfx.playUiClick();
      this.onToggleTouch?.();
    });
    document.getElementById("hud-btn-fs")?.addEventListener("click", () => {
      sfx.playUiClick();
      this.game.toggleFullscreen();
    });
    document.addEventListener("fullscreenchange", () => this._syncFullscreenBtn());
    document.getElementById("hud-btn-help")?.addEventListener("click", () => this.game.toggleModal("tutorial"));
    document.getElementById("hud-btn-map")!.addEventListener("click", () => this.game.toggleModal("world_map"));
    document.getElementById("hud-btn-bag")!.addEventListener("click", () => this.game.toggleModal("inventory"));
    document.getElementById("slot-bag")?.addEventListener("click", () => this.game.toggleModal("inventory"));
    document.getElementById("slot-gacha")?.addEventListener("click", () => this.game.toggleModal("gacha"));
    document.getElementById("hud-stat-pts-btn")?.addEventListener("click", () => this.game.toggleModal("inventory"));
    document.getElementById("hud-btn-quest")!.addEventListener("click", () => this.game.toggleModal("journal"));
    this.hudRoot.querySelector(".qt-hdr")?.addEventListener("click", () => this.game.toggleModal("journal"));
    document.getElementById("hud-btn-save")!.addEventListener("click", () => this.game.saveGame(true));
    document.getElementById("hud-btn-mute")!.addEventListener("click", (ev) => {
      const muted = sfx.toggleMute();
      (ev.currentTarget as HTMLElement).textContent = muted ? "MUTE" : "SFX";
    });
    document.getElementById("hud-btn-pause")!.addEventListener("click", () => this.game.toggleModal("pause"));

    this.miniCanvas.addEventListener("click", () => this.game.toggleModal("world_map"));

    // Hover tooltips for Pixel Backpack & Skill Icons (only shows description on hover!)
    const tipSlots = this.hudRoot.querySelectorAll<HTMLElement>("[data-hud-tip]");
    tipSlots.forEach((slotEl) => {
      const kind = slotEl.dataset.hudTip as HudTipKind;
      slotEl.addEventListener("mouseenter", () => {
        this.hoveredTipKind = kind;
        this.hoveredSlotEl = slotEl;
        this.lastTipSig = "";
        this._renderSkillTooltip();
      });
      slotEl.addEventListener("mouseleave", () => {
        if (this.hoveredSlotEl === slotEl) {
          this.hideSkillTooltip();
        }
      });
    });

    // Clickable consumable buttons [1]-[4]
    document.getElementById("slot-c1")!.addEventListener("click", () => this.game.useConsumableSlot(1));
    document.getElementById("slot-c2")!.addEventListener("click", () => this.game.useConsumableSlot(2));
    document.getElementById("slot-c3")!.addEventListener("click", () => this.game.useConsumableSlot(3));
    document.getElementById("slot-c4")!.addEventListener("click", () => this.game.useConsumableSlot(4));

    document.getElementById("interact-prompt")!.addEventListener("click", () => this.game.interactNearest());
  }

  setVisible(show: boolean) {
    this.hudRoot.classList.toggle("hidden", !show);
    if (!show) this.hideSkillTooltip();
  }

  hideSkillTooltip() {
    this.hoveredTipKind = null;
    this.hoveredSlotEl = null;
    this.lastTipSig = "";
    this.skillTooltipEl?.classList.add("hidden");
  }

  private _paintCodixelCanvas(canvasId: string, iconKey: string) {
    if (this.cachedSkillIcons[canvasId] === iconKey) return;
    const cv = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (drawCodixelIcon(ctx, iconKey, 0, 0, cv.width)) {
      this.cachedSkillIcons[canvasId] = iconKey;
    }
  }

  private _syncFullscreenBtn() {
    const fsBtn = document.getElementById("hud-btn-fs");
    if (!fsBtn) return;
    fsBtn.classList.toggle("active", Boolean(document.fullscreenElement));
  }

  private _clearToastTimer(el: HTMLElement) {
    const prev = this.toastTimers.get(el);
    if (prev) {
      window.clearTimeout(prev.fade);
      if (prev.remove !== undefined) window.clearTimeout(prev.remove);
      this.toastTimers.delete(el);
    }
  }

  private _scheduleToastDismiss(el: HTMLElement) {
    this._clearToastTimer(el);
    el.classList.remove("fade-out");
    const fade = window.setTimeout(() => {
      el.classList.add("fade-out");
      const remove = window.setTimeout(() => {
        this._clearToastTimer(el);
        el.remove();
      }, 220);
      this.toastTimers.set(el, { fade, remove });
    }, 2500);
    this.toastTimers.set(el, { fade });
  }

  toast(msg: string, tone: "info" | "good" | "warn" | "epic" = "info") {
    for (let i = 0; i < this.toastContainer.children.length; i++) {
      const child = this.toastContainer.children[i] as HTMLElement;
      if (child.dataset.toastMsg === msg) {
        child.className = `pixel-toast tone-${tone}`;
        this._scheduleToastDismiss(child);
        return;
      }
    }

    const el = document.createElement("div");
    el.className = `pixel-toast tone-${tone}`;
    el.dataset.toastMsg = msg;
    el.textContent = msg;
    this.toastContainer.appendChild(el);
    while (this.toastContainer.children.length > 2) {
      const oldest = this.toastContainer.firstElementChild as HTMLElement | null;
      if (!oldest) break;
      this._clearToastTimer(oldest);
      oldest.remove();
    }
    this._scheduleToastDismiss(el);
  }

  update() {
    if (!this.game.running) return;
    const p = this.game.player;
    const cdef = getClassDef(p.classId);
    const biomeCfg = BIOME_CONFIGS[this.game.currentBiome];

    const hudBtn = document.getElementById("hud-btn-hud");
    if (hudBtn) {
      hudBtn.classList.toggle("active", this.game.compactHud);
      hudBtn.textContent = this.game.compactHud ? "👁 HIỆN HUD [V]" : "👁 HUD [V]";
    }
    this._syncFullscreenBtn();

    const badge = document.getElementById("hud-class-badge")!;
    const heroName = sanitizePlayerName(p.name || this.game.pendingPlayerName, DEFAULT_HERO_NAME);
    badge.textContent = `${heroName} · ${cdef.vnName} · LV.${p.level}`;
    badge.style.color = cdef.accent;

    const hpPct = Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100));
    document.getElementById("hud-hp-fill")!.style.width = `${hpPct}%`;
    document.getElementById("hud-hp-text")!.textContent = `HP ${Math.ceil(p.hp)}/${p.maxHp}`;

    const xpPct = Math.max(0, Math.min(100, (p.xp / p.xpNext) * 100));
    document.getElementById("hud-xp-fill")!.style.width = `${xpPct}%`;
    document.getElementById("hud-xp-text")!.textContent = `XP ${p.xp}/${p.xpNext}`;

    document.getElementById("hud-gold")!.textContent = `${this.game.inv.gold} G`;
    document.getElementById("hud-biome")!.textContent = `${biomeCfg.name} (${biomeCfg.levelRange})`;
    document.getElementById("hud-restore")!.textContent = `Màu: ${this.game.colorSys.getProgressPct()}% · Trụ ${this.game.colorSys.unlockedWaypoints.size}/${WAYPOINTS.length} · Bia Ký ${this.game.discoveredLore.size}/${LORE_TABLETS.length}`;

    // Stat Points pulsing button + Active buffs / Class / Weapon Infusion / Counter status
    const statPtsBtn = document.getElementById("hud-stat-pts-btn");
    if (statPtsBtn) {
      statPtsBtn.classList.toggle("hidden", p.statPoints <= 0);
      if (p.statPoints > 0) {
        statPtsBtn.textContent = `✨ +${p.statPoints} ĐIỂM TIỀM NĂNG [I]`;
      }
    }

    const wpn = this.game.inv.getValidEquippedWeapon(p.classId);
    const extraBits: string[] = [];
    if (!wpn) {
      extraBits.push(`<span class="hud-unarmed-pill">✊ TAY KHÔNG</span>`);
    }
    if (p.classId === "chroma_mage") {
      const el = ELEMENT_LABELS[p.elementIdx % ELEMENT_LABELS.length];
      extraBits.push(`<span style="color:${el.color}">Hệ: ${el.name}</span>`);
    } else if (p.classId === "pixel_tinker") {
      extraBits.push(`<span style="color:#44ee88">Trụ: ${this.game.turrets.length}/2</span>`);
    }

    if (wpn && wpn.enhanceLevel > 0) {
      const inf = wpn.enhanceLevel >= 5 && wpn.infusedElement ? ` [${ELEMENT_DISPLAY[wpn.infusedElement].label}]` : "";
      extraBits.push(`<span style="color:#ffe066">VK +${wpn.enhanceLevel}${inf}</span>`);
    }
    if (p.chromaCounterTimer > 0) {
      extraBits.push(`<span style="color:#ffe066">★ PHẢN KÍCH!</span>`);
    }
    if (p.totemSurgeElement && p.totemSurgeTimer > 0) {
      const tm = ELEMENT_META[p.totemSurgeElement];
      extraBits.push(`<span style="color:${tm.color}">⚡ TRỤ ${tm.shortLabel} (${Math.ceil(p.totemSurgeTimer)}s)</span>`);
    }
    if (p.tectonicChargeBonus) {
      extraBits.push(`<span style="color:#ff9933">★ ĐỊA CHẤN TỤ +35%</span>`);
    }
    if (p.chromaBloomBonusTime > 0) {
      extraBits.push(`<span style="color:#ff66c4">NỞ RỘ +15% ELEM</span>`);
    }
    if (p.chromaGustTime > 0) {
      extraBits.push(`<span style="color:#5ef2d6">GIÓ +18% (${Math.ceil(p.chromaGustTime)}s)</span>`);
    }
    if (p.coatingTime > 0) {
      const coatLbl = p.coatingElement ? ELEMENT_META[p.coatingElement].shortLabel : "QUANG PHỔ";
      extraBits.push(`<span style="color:#ff66d8">PHỦ ${coatLbl} (${Math.ceil(p.coatingTime)}s)</span>`);
    }
    if (p.atkBuffTime > 0) {
      extraBits.push(`<span style="color:#ffee44">ATK+${Math.round((p.atkBuffPct || 0.3) * 100)}% (${Math.ceil(p.atkBuffTime)}s)</span>`);
    }
    if (p.speedBuffTime > 0) {
      extraBits.push(`<span style="color:#44ee88">SPD+${Math.round((p.speedBuffPct || 0.28) * 100)}% (${Math.ceil(p.speedBuffTime)}s)</span>`);
    }
    if (p.aegisTime > 0) {
      extraBits.push(`<span style="color:#5ef2ff">AEGIS -${Math.round((p.defBuffPct || 0.35) * 100)}% (${Math.ceil(p.aegisTime)}s)</span>`);
    }
    if (p.bleachDebuffTime > 0) {
      extraBits.push(`<span style="color:#b8c2d6">PHAI SẮC (${Math.ceil(p.bleachDebuffTime)}s)</span>`);
    }
    document.getElementById("hud-status-line")!.innerHTML = extraBits.join(`<span style="color:#6d78a0">·</span>`);

    // Live 6-Step Beginner Practice Banner (stacked cleanly in left column, never blocks center view!)
    if (this.tutorialBannerEl) {
      const bossActive = Boolean(this.game.getActiveBoss());
      const stepDef = BEGINNER_PRACTICE_STEPS[this.game.tutorialStep];
      if (this.game.tutorialActive && stepDef && !bossActive) {
        this.tutorialBannerEl.classList.remove("hidden");
        const needsWeaponForE = stepDef.id === "skill_e" && !wpn;
        this.tutorialBannerEl.classList.toggle("warn-step", needsWeaponForE);
        const stepKey = `${this.game.tutorialStep}:${this.game.tutorialComboHits}:${Boolean(wpn)}`;
        if (this.lastTutorialStepKey !== stepKey) {
          this.lastTutorialStepKey = stepKey;
          const extraCombo =
            stepDef.id === "combo3" ? ` (${Math.min(3, this.game.tutorialComboHits)}/3 nhịp)` : "";
          const descHtml =
            stepDef.id === "skill_e" && !wpn
              ? `<span style="color:#ffe066;font-weight:700">📦 Mở Rương Tân Thủ [F] ngay cạnh Quảng Trường để nhận Vũ Khí, sau đó nhấn [E] (hoặc Chuột Phải) tung Kỹ Năng Vũ Khí!</span>`
              : stepDef.id === "skill_e" && wpn
                ? `<span style="color:#6effa8;font-weight:700">⚔ Đã trang bị Vũ Khí! Nhấn phím [E] (hoặc Chuột Phải) ngay bây giờ để tung Kỹ Năng Vũ Khí!</span>`
                : stepDef.desc;
          this.tutorialBannerEl.innerHTML = `
            <div class="tut-banner-head">
              <span class="tut-banner-step">🌱 TÂN THỦ · BƯỚC ${this.game.tutorialStep + 1}/${BEGINNER_PRACTICE_STEPS.length}</span>
              <div class="tut-banner-btns">
                <button id="hud-tut-open-book" class="hud-mini-btn" title="Mở Cẩm Nang [H]">CẨM NANG [H]</button>
                <button id="hud-tut-skip" class="hud-mini-btn" title="Bỏ qua hướng dẫn">BỎ QUA ✕</button>
              </div>
            </div>
            <div class="tut-banner-main">
              <span class="tut-key-pill">${stepDef.keyBadge}</span>
              <b>${stepDef.title}${extraCombo}</b>
            </div>
            <div class="tut-banner-desc">${descHtml}</div>
          `;
          this.tutorialBannerEl.querySelector("#hud-tut-open-book")?.addEventListener("click", () => {
            this.game.toggleModal("tutorial");
          });
          this.tutorialBannerEl.querySelector("#hud-tut-skip")?.addEventListener("click", () => {
            sfx.playUiClick();
            this.game.skipGuidedTutorial();
          });
        }
      } else {
        this.tutorialBannerEl.classList.add("hidden");
        this.tutorialBannerEl.classList.remove("warn-step");
        this.lastTutorialStepKey = "";
      }
    }

    // Boss HP Bar + Phase + Bleach Shield + Territory Lock Tag
    const boss = this.game.getActiveBoss();
    const bossBox = document.getElementById("hud-boss-bar")!;
    const shieldWrap = document.getElementById("hud-boss-shield-wrap");
    const lockTag = document.getElementById("hud-boss-lock-tag");
    this.toastContainer.classList.toggle("boss-up", Boolean(boss));
    if (boss) {
      bossBox.classList.remove("hidden");
      const bdef = ENEMIES[boss.defId];
      const phaseTag = `[PHASE ${boss.phase}]`;
      document.getElementById("hud-boss-name")!.textContent = `${bdef?.name ?? "BOSS"} · LV.${boss.level} · ${phaseTag}`;
      const bpct = Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100));
      document.getElementById("hud-boss-fill")!.style.width = `${bpct}%`;
      document.getElementById("hud-boss-hp")!.textContent = `${Math.max(0, Math.ceil(boss.hp))} / ${boss.maxHp}`;

      const lock = this.game.activeBossLock;
      if (lockTag) {
        lockTag.classList.toggle("hidden", !lock);
        if (lock) {
          lockTag.textContent = `🔒 LÃNH ĐỊA ${lock.bossName} PHONG ẤN — KHÔNG THỂ THOÁT`;
        }
      }

      if (shieldWrap) {
        const shieldFill = document.getElementById("hud-boss-shield-fill")!;
        const shieldLbl = document.getElementById("hud-boss-shield-lbl")!;
        if (boss.totemChannelTimer > 0 && this.game.spawner.arenaTotems.length > 0) {
          const lit = this.game.spawner.arenaTotems.filter((t) => t.lit).length;
          shieldWrap.classList.remove("hidden");
          shieldFill.style.width = `${Math.min(100, (boss.totemChannelTimer / 12) * 100)}%`;
          shieldFill.style.background = "#c266ff";
          shieldLbl.textContent = `⚡ THẮP 2 TRỤ CỘNG HƯỞNG NGUYÊN TỐ: ${lit}/2 (${boss.totemChannelTimer.toFixed(1)}s)`;
        } else if (boss.bleachShield > 0 && boss.maxBleachShield > 0) {
          shieldWrap.classList.remove("hidden");
          const spct = Math.max(0, Math.min(100, (boss.bleachShield / boss.maxBleachShield) * 100));
          shieldFill.style.width = `${spct}%`;
          shieldFill.style.background = "#9fb6d6";
          shieldLbl.textContent = `GIÁP NHIỄU TRẮNG ${Math.ceil(boss.bleachShield)}/${boss.maxBleachShield}`;
        } else if (boss.vulnTime > 0) {
          shieldWrap.classList.remove("hidden");
          shieldFill.style.width = "100%";
          shieldFill.style.background = "#ffe066";
          shieldLbl.textContent = `★ VỠ GIÁP — ĐIỂM YẾU (+38% DMG · ${boss.vulnTime.toFixed(1)}s)`;
        } else {
          shieldWrap.classList.add("hidden");
        }
      }
    } else {
      bossBox.classList.add("hidden");
      lockTag?.classList.add("hidden");
    }

    // Quest Tracker (Right Panel)
    const tracker = document.getElementById("hud-quest-list")!;
    const tracked = this.game.quests.getTrackedQuests();
    if (tracked.length === 0) {
      tracker.innerHTML = `<div class="qt-empty">Gặp <b style="color:#ffe066">Trưởng Làng Elian [F]</b> để nhận nhiệm vụ hoặc bấm <b style="color:#5ef2ff">[J]</b> đọc Biên Niên Sử!</div>`;
    } else {
      tracker.innerHTML = tracked
        .slice(0, 3)
        .map(({ def, progress }) => {
          const ready = progress.state === "completable";
          const objs = def.objectives
            .map((o) => {
              const cur = progress.counts[o.id] ?? 0;
              return `<div class="qt-obj ${cur >= o.required ? "done" : ""}">• ${o.label}: ${cur}/${o.required}</div>`;
            })
            .join("");
          return `
            <div class="qt-item ${ready ? "ready" : ""}">
              <div class="qt-title">${ready ? "★ " : ""}${def.title}</div>
              ${ready ? `<div class="qt-ready-note">Sẵn sàng trả nhiệm vụ cho NPC!</div>` : objs}
            </div>
          `;
        })
        .join("");
    }

    // Pixel Backpack & Seasonal Gacha Chest Buttons (front of bottom bar)
    const bpTier = this.game.inv.backpackTier;
    const bagIconKey = bpTier > 0 ? `ui_backpack_t${Math.min(4, bpTier)}` : "ui_backpack";
    this._paintCodixelCanvas("bag-slot-icon", bagIconKey);
    const bagCountEl = document.getElementById("bag-slot-count");
    if (bagCountEl) {
      bagCountEl.textContent = `${this.game.inv.bag.length}/${this.game.inv.bagCapacity}`;
    }
    const bagPtsEl = document.getElementById("bag-slot-pts");
    if (bagPtsEl) {
      bagPtsEl.classList.toggle("hidden", p.statPoints <= 0);
      if (p.statPoints > 0) bagPtsEl.textContent = `+${p.statPoints}`;
    }

    this._paintCodixelCanvas("gacha-slot-icon", "ui_gacha_chest");
    const totalGachaKeys = GACHA_BANNERS.reduce((sum, b) => sum + this.game.inv.countItem(b.keyItemId), 0);
    const gachaCntEl = document.getElementById("gacha-slot-count");
    if (gachaCntEl) {
      gachaCntEl.textContent = `${totalGachaKeys} CHÌA`;
    }
    document.getElementById("slot-gacha")?.classList.toggle("has-keys", totalGachaKeys > 0);
    document.getElementById("hud-btn-gacha")?.classList.toggle("has-keys", totalGachaKeys > 0);

    // Weapon-Driven Pixel Skill Icon Bar:
    // LMB (Fixed Class Basic + Charge), [E] (Dynamic Weapon Skill per equipped weapon!), [Q] (Fixed Class Signature Skill!), [SPACE] (Dash)
    const eqWeapon = this.game.inv.getValidEquippedWeapon(p.classId);
    const weaponSkill = eqWeapon ? getWeaponSkillForItem(eqWeapon.defId) : null;
    const skillSet = CLASS_SKILL_ICONS[p.classId] ?? CLASS_SKILL_ICONS.prism_knight;

    this._paintCodixelCanvas("skill-lmb-icon", eqWeapon ? skillSet.lmb : "skill_unarmed");
    this._paintCodixelCanvas("skill-e-icon", weaponSkill ? weaponSkill.iconKey : skillSet.skill);
    this._paintCodixelCanvas("skill-q-icon", skillSet.ult);
    this._paintCodixelCanvas("skill-dash-icon", "skill_dash");

    const lmbSub = document.getElementById("skill-lmb-sub");
    if (lmbSub) {
      let badgeTxt = "";
      if (eqWeapon && p.quickChargeTimer > 0) {
        badgeTxt = "⚡";
      } else if (p.comboTimer > 0) {
        badgeTxt = `${p.comboStep === 0 ? 3 : p.comboStep}/3`;
      }
      lmbSub.textContent = badgeTxt;
      lmbSub.classList.toggle("hidden", badgeTxt.length === 0);
    }

    const slotE = document.getElementById("slot-skill-e")!;
    const eLock = document.getElementById("skill-e-lock");
    const eCdEl = document.getElementById("skill-e-cd")!;
    const eVeil = document.getElementById("skill-e-veil");
    if (!eqWeapon || !weaponSkill) {
      slotE.classList.add("locked");
      slotE.classList.remove("on-cd");
      slotE.style.removeProperty("--ws-accent");
      eLock?.classList.remove("hidden");
      this._paintCodixelCanvas("skill-e-lock", "ui_lock");
      eCdEl.textContent = "CẦN VK";
      eCdEl.style.color = "#ff8899";
      eCdEl.classList.remove("hidden");
      if (eVeil) eVeil.style.height = "0%";
    } else {
      slotE.classList.remove("locked");
      slotE.style.setProperty("--ws-accent", weaponSkill.accent);
      eLock?.classList.add("hidden");
      eCdEl.style.removeProperty("color");
      const onCd = p.skillCd > 0;
      slotE.classList.toggle("on-cd", onCd);
      eCdEl.textContent = onCd ? `${p.skillCd.toFixed(1)}s` : "";
      eCdEl.classList.toggle("hidden", !onCd);
      if (eVeil) {
        const effMaxCd = Math.max(0.5, weaponSkill.cooldown * Math.max(0.45, 1 + p.skillCdPct));
        const pct = onCd ? Math.min(100, (p.skillCd / effMaxCd) * 100) : 0;
        eVeil.style.height = `${pct}%`;
      }
    }

    // [Q] Fixed Class Signature Skill (always unlocked, requires 100% Overdrive!)
    const ultPct = Math.floor(p.overdrive);
    const slotQ = document.getElementById("slot-skill-q")!;
    const qLock = document.getElementById("skill-q-lock");
    const qCdEl = document.getElementById("skill-q-cd")!;
    const qGauge = document.getElementById("skill-q-gauge");
    slotQ.classList.remove("locked");
    qLock?.classList.add("hidden");
    qCdEl.classList.remove("hidden");
    qCdEl.textContent = ultPct >= 100 ? "★" : `${ultPct}%`;
    slotQ.classList.toggle("ult-ready", ultPct >= 100);
    if (qGauge) qGauge.style.height = `${Math.min(100, ultPct)}%`;

    const dashOnCd = p.dashCd > 0;
    const dashCdEl = document.getElementById("skill-dash-cd")!;
    const dashVeil = document.getElementById("skill-dash-veil");
    dashCdEl.textContent = dashOnCd ? `${p.dashCd.toFixed(1)}s` : "";
    dashCdEl.classList.toggle("hidden", !dashOnCd);
    document.getElementById("slot-dash")!.classList.toggle("on-cd", dashOnCd);
    if (dashVeil) {
      const pct = dashOnCd ? Math.min(100, (p.dashCd / Math.max(0.4, cdef.baseStats.dashCooldown)) * 100) : 0;
      dashVeil.style.height = `${pct}%`;
    }

    if (this.game.activeModal !== null) {
      this.hideSkillTooltip();
    } else if (this.hoveredTipKind) {
      this._renderSkillTooltip();
    }

    // Quick Smart Consumables [1] [2] [3] [4] with codixel icons & Tier badges
    const fallbackDefIds = ["pot_hp_small", "pot_stamina_minor", "pot_might_brew", "pot_aegis_flask"];
    for (let i = 0; i < 4; i++) {
      const slotNum = (i + 1) as 1 | 2 | 3 | 4;
      const group = this.game.inv.getHotkeyGroupForSlot(slotNum);
      const bestId = this.game.inv.findBestConsumableForGroup(group);
      const totalCnt = this.game.inv.countConsumableGroup(group);
      const activeId = bestId ?? fallbackDefIds[i];
      const def = ITEMS[activeId];
      const tInfo = getTierBadge(def);
      const grpInfo = CONSUMABLE_GROUP_LABELS[group];

      const btnEl = document.getElementById(`slot-c${slotNum}`)!;
      btnEl.classList.toggle("empty", totalCnt <= 0);
      btnEl.classList.toggle("rarity-rare", def?.rarity === "rare");
      btnEl.classList.toggle("rarity-epic", def?.rarity === "epic");
      btnEl.classList.toggle("rarity-legendary", def?.rarity === "legendary");
      btnEl.dataset.reviewDef = activeId;
      btnEl.dataset.reviewSource = "hud";
      if (def) {
        btnEl.removeAttribute("title");
      } else {
        btnEl.title = `[${slotNum}] ${grpInfo.label}`;
      }

      const isHpPotCd = slotNum === 1 && (p.potCd ?? 0) > 0;
      btnEl.classList.toggle("on-cd", isHpPotCd);
      document.getElementById(`c${slotNum}-qty`)!.textContent = isHpPotCd
        ? `${(p.potCd ?? 0).toFixed(1)}s`
        : `x${totalCnt}`;
      const tierEl = document.getElementById(`c${slotNum}-tier`)!;
      tierEl.textContent = tInfo.badge;
      tierEl.style.color = tInfo.color;
      tierEl.style.borderColor = tInfo.color;

      if (this.cachedHotbarIcons[i] !== activeId && def) {
        this.cachedHotbarIcons[i] = activeId;
        const cv = document.getElementById(`c${slotNum}-icon`) as HTMLCanvasElement | null;
        if (cv) {
          cv.dataset.iconDef = activeId;
          cv.dataset.iconEnh = "0";
          uiRarityFx.paintIconCanvas(cv);
        }
      }
    }

    // [F] Interact Prompt
    const promptEl = document.getElementById("interact-prompt")!;
    if (this.game.nearestInteractable && this.game.activeModal === null) {
      promptEl.textContent = this.game.nearestInteractable.prompt;
      promptEl.classList.remove("hidden");
    } else {
      promptEl.classList.add("hidden");
    }

    // Co-op Party Roster Box (Top-Left below Hero Panel)
    if (this.partyBoxEl) {
      const coop = this.game.coop;
      if (coop.isConnected) {
        this.partyBoxEl.classList.remove("hidden");
        const remotes = Array.from(this.game.remotePlayers.values());
        const sig = `${coop.roomCode}|${coop.isHost ? 1 : 0}|${remotes
          .map((r) => `${r.snap.id}:${r.snap.name}:${r.snap.classId}:${r.snap.level}:${Math.ceil(r.snap.hp)}/${r.snap.maxHp}`)
          .join(",")}`;
        if (sig !== this.lastPartySig) {
          this.lastPartySig = sig;
          const rows =
            remotes.length === 0
              ? `<div class="hud-party-empty">Đang chờ bạn bè vào phòng... Bấm [P] để gửi mã!</div>`
              : remotes
                  .map((rp) => {
                    const rc = getClassDef(rp.snap.classId);
                    const safePeerName = sanitizePlayerName(rp.snap.name, DEFAULT_HERO_NAME);
                    const pct = Math.max(0, Math.min(100, (rp.snap.hp / Math.max(1, rp.snap.maxHp)) * 100));
                    return `
                      <div class="hud-party-row">
                        <div class="hud-party-info">
                          <div class="hud-party-name">
                            <span style="color:${rc.accent}">● ${safePeerName}</span>
                            <span class="hud-party-lv">LV.${rp.snap.level}</span>
                          </div>
                          <div class="hud-party-hp"><div style="width:${pct}%"></div></div>
                        </div>
                        <button class="hud-mini-btn hud-tp-btn" data-hud-tp="${rp.snap.id}" title="Dịch chuyển tới đồng đội">⚡</button>
                      </div>
                    `;
                  })
                  .join("");
          this.partyBoxEl.innerHTML = `
            <div class="hud-party-hdr" id="hud-party-open">
              <span>🤝 PHÒNG <b>${coop.roomCode}</b></span>
              <span>${1 + remotes.length}/4 · [P]</span>
            </div>
            ${rows}
          `;
          this.partyBoxEl.querySelector("#hud-party-open")?.addEventListener("click", () => {
            this.game.toggleModal("coop");
          });
          this.partyBoxEl.querySelectorAll("[data-hud-tp]").forEach((btn) => {
            btn.addEventListener("click", (ev) => {
              ev.stopPropagation();
              const peerId = (btn as HTMLElement).dataset.hudTp!;
              this.game.teleportToCoopPeer(peerId);
            });
          });
        }
      } else {
        this.partyBoxEl.classList.add("hidden");
        this.lastPartySig = "";
      }
    }

    this._drawMinimap();
  }

  private _drawMinimap() {
    const ctx = this.miniCtx;
    const w = this.miniCanvas.width;
    const h = this.miniCanvas.height;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#0e0c18";
    ctx.fillRect(0, 0, w, h);

    const span = 54;
    const ptx = this.game.player.x / TILE_SIZE;
    const pty = this.game.player.y / TILE_SIZE;
    const sx0 = Math.max(0, Math.min(WORLD_COLS - span, Math.round(ptx - span / 2)));
    const sy0 = Math.max(0, Math.min(WORLD_ROWS - span, Math.round(pty - span / 2)));
    const scale = w / span;

    ctx.drawImage(this.game.tileRenderer.overviewCanvas, sx0, sy0, span, span, 0, 0, w, h);

    const plot = (tx: number, ty: number, color: string, size = 3) => {
      const x = Math.round((tx - sx0) * scale);
      const y = Math.round((ty - sy0) * scale);
      if (x < -4 || y < -4 || x > w + 4 || y > h + 4) return;
      ctx.fillStyle = "#0e0c18";
      ctx.fillRect(x - 1, y - 1, size + 2, size + 2);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, size, size);
    };

    for (const wp of WAYPOINTS) {
      const on = this.game.colorSys.unlockedWaypoints.has(wp.id);
      plot(wp.tx, wp.ty, on ? "#38f2ff" : "#b4bcc9", 4);
    }
    for (const lore of LORE_TABLETS) {
      if (!this.game.discoveredLore.has(lore.id)) {
        plot(lore.tx, lore.ty, "#c266ff", 3);
      }
    }
    for (const npc of TOWN_NPCS) {
      const m = this.game.quests.getNpcMarker(npc.id);
      plot(npc.tx, npc.ty, m === "?" ? "#44ee88" : m === "!" ? "#ffe066" : "#ffaa44", 3);
    }
    for (const camp of WORLD_CAMPS) {
      const isBoss = camp.id.includes("boss");
      if (isBoss) {
        plot(camp.tx, camp.ty, "#ff3355", 5);
      } else {
        plot(camp.tx, camp.ty, "#ff9944", 2);
      }
    }
    for (const ch of this.game.spawner.chests) {
      if (ch.state !== "opened") {
        plot(ch.x / TILE_SIZE, ch.y / TILE_SIZE, ch.state === "unlocked" ? "#ffe066" : "#ff6688", 3);
      }
    }

    // Co-op teammates (green dots)
    for (const rp of this.game.remotePlayers.values()) {
      plot(rp.renderX / TILE_SIZE, rp.renderY / TILE_SIZE, "#44ee88", 4);
    }

    const blink = (Math.floor(this.game.time * 4) & 1) === 0;
    plot(ptx, pty, blink ? "#ffffff" : "#5ef2ff", 4);
  }

  private _renderSkillTooltip() {
    const tipEl = this.skillTooltipEl;
    const kind = this.hoveredTipKind;
    const slotEl = this.hoveredSlotEl;
    if (!tipEl || !kind || !slotEl || !this.game.running || this.game.activeModal !== null) {
      tipEl?.classList.add("hidden");
      return;
    }

    const p = this.game.player;
    const cdef = getClassDef(p.classId);
    const skillSet = CLASS_SKILL_ICONS[p.classId] ?? CLASS_SKILL_ICONS.prism_knight;
    const eqWeapon = this.game.inv.getValidEquippedWeapon(p.classId);
    const eqWpnDef = eqWeapon ? ITEMS[eqWeapon.defId] : undefined;
    const weaponSkill = eqWeapon ? getWeaponSkillForItem(eqWeapon.defId) : null;

    let iconKey = "ui_backpack";
    let name = "";
    let keyTag = "";
    let statusCls: "ok" | "cd" | "warn" | "gold" = "ok";
    let statusTxt = "";
    let desc = "";
    let extraBlock = "";
    let footLeft = "";
    let footRight = "";

    if (kind === "bag") {
      const bpTier = this.game.inv.backpackTier;
      iconKey = bpTier > 0 ? `ui_backpack_t${Math.min(4, bpTier)}` : "ui_backpack";
      name = "Túi Đồ & Trang Bị";
      keyTag = "I / B";
      const asMode = this.game.inv.autoSell.maxRarity;
      const asLbl =
        asMode === "common" ? "Trắng" : asMode === "uncommon" ? "≤ Lục" : asMode === "rare" ? "≤ Lam" : "Tắt";
      statusCls = p.statPoints > 0 ? "gold" : "ok";
      statusTxt =
        p.statPoints > 0
          ? `✨ Có +${p.statPoints} Điểm Tiềm Năng chưa cộng!`
          : `Kho đồ ${this.game.inv.bag.length}/${this.game.inv.bagCapacity} ô · Auto-Bán: ${asLbl}`;
      desc =
        "Mở hành trang mở rộng tới 80 ô, bật Auto-Bán đồ phẩm thấp, mua nâng cấp Balo, cộng Điểm Tiềm Năng & quản lý 5 ô trang bị.";
      extraBlock = `<b>Rương Cá Nhân tại Spawn:</b> Đang cất ${this.game.inv.stash.length}/80 ô · Lại gần nhấn [F] để cất/lấy đồ.`;
      footLeft = `💰 Vàng: ${this.game.inv.gold} G`;
      footRight = "Nhấn chuột để mở";
    } else if (kind === "gacha") {
      iconKey = "ui_gacha_chest";
      name = "Đài Rương Gacha Theo Mùa";
      keyTag = "G";
      const keyParts = GACHA_BANNERS.map(
        (b) => `${b.seasonTag.split("·")[0].trim()}: <b>x${this.game.inv.countItem(b.keyItemId)}</b>`
      );
      const totalKeys = GACHA_BANNERS.reduce((s, b) => s + this.game.inv.countItem(b.keyItemId), 0);
      statusCls = totalKeys > 0 ? "gold" : "cd";
      statusTxt = totalKeys > 0 ? `🗝 Đang sở hữu ${totalKeys} Chìa Rương Mùa!` : "Săn quái từng vùng hoặc rèn tại Kael để kiếm Chìa!";
      desc =
        "Mở 4 Rương Mùa (Xuân / Đông / Hạ / Nhật Thực) bằng Chìa Khóa riêng từng quần xã. Bảo hiểm Pity 10/25 minh bạch & cơ chế Lật Kèo Đổi Màu siêu hồi hộp!";
      extraBlock = `<b>Chìa hiện có:</b> ${keyParts.join(" · ")}`;
      footLeft = `Tổng lượt mở: ${this.game.gacha.totalRolls}`;
      footRight = "Nhấn [G] để mở";
    } else if (kind === "lmb") {
      iconKey = eqWeapon ? skillSet.lmb : "skill_unarmed";
      keyTag = "LMB / GIỮ";
      if (!eqWeapon) {
        name = "Đấm Tay Không";
        statusCls = "warn";
        statusTxt = `✊ Chưa cầm vũ khí (${cdef.weaponType})`;
        desc =
          "Combo 3 cú đấm cận chiến cơ bản & Đấm Móc Tụ Lực (Giữ LMB). Hãy nhặt hoặc mua vũ khí đúng Class để mở khóa bộ chiêu thức đặc trưng!";
        extraBlock = `<b>Chiêu khi có vũ khí:</b> ${cdef.skills.lmb.name} — ${cdef.skills.lmb.desc}`;
      } else {
        name = cdef.skills.lmb.name;
        statusCls = p.quickChargeTimer > 0 ? "gold" : "ok";
        statusTxt =
          p.quickChargeTimer > 0
            ? "⚡ TỤ NHANH SẴN SÀNG (Just-Charge)"
            : `⚔ ${eqWpnDef?.name ?? cdef.weaponType}${eqWeapon.enhanceLevel > 0 ? ` +${eqWeapon.enhanceLevel}` : ""}`;
        desc = cdef.skills.lmb.desc;
        extraBlock = `<b>${cdef.skills.charge.name}:</b> ${cdef.skills.charge.desc}`;
      }
      footLeft = `Class: ${cdef.vnName}`;
      footRight = `Tốc đánh: ${cdef.baseStats.atkCooldown}s`;
    } else if (kind === "skill") {
      iconKey = weaponSkill ? weaponSkill.iconKey : skillSet.skill;
      name = weaponSkill ? weaponSkill.name : "Kỹ Năng Vũ Khí";
      keyTag = "E / RMB";
      if (!eqWeapon || !weaponSkill) {
        statusCls = "warn";
        statusTxt = `🔒 KHÓA — Cần cầm ${cdef.weaponType} đúng Class`;
        desc = "Mỗi vũ khí mang 1 Kỹ Năng [E] hoàn toàn riêng biệt. Đổi vũ khí sẽ đổi ngay biểu tượng, chiêu thức & hiệu ứng chiến đấu!";
        footLeft = "Gắn vào Vũ Khí đang cầm";
        footRight = cdef.vnName;
      } else {
        const effCd = Math.max(0.5, weaponSkill.cooldown * Math.max(0.45, 1 + p.skillCdPct));
        const elMeta = ELEMENT_META[weaponSkill.element];
        if (p.skillCd > 0) {
          statusCls = "cd";
          statusTxt = `⏳ Đang hồi chiêu (${p.skillCd.toFixed(1)}s) · ${eqWpnDef?.name ?? ""}`;
        } else {
          statusCls = "gold";
          statusTxt = `✦ SKILL VŨ KHÍ · ${eqWpnDef?.name ?? cdef.weaponType}`;
        }
        desc = weaponSkill.detailDesc;
        const modCnt = p.exoticMods?.size ?? 0;
        extraBlock = `<b>Hệ nguyên tố:</b> <span style="color:${elMeta.color}">${elMeta.name}</span> · Đổi vũ khí khác để đổi chiêu [E]!${
          modCnt > 0 ? ` · <span style="color:#ffe066">★ ${modCnt} Biến Thể Độc Lạ đang kích hoạt</span>` : ""
        }`;
        footLeft = `Hồi chiêu: ${effCd.toFixed(1)}s`;
        footRight = `Vũ khí ${cdef.vnName}`;
      }
    } else if (kind === "ult") {
      iconKey = skillSet.ult;
      name = cdef.skills.ult.name.replace(/\s*\(Q\)/, "");
      keyTag = "Q · CỐ ĐỊNH";
      const ultPct = Math.floor(p.overdrive);
      if (ultPct >= 100) {
        statusCls = "gold";
        statusTxt = "★ NỘ 100% — SẴN SÀNG KÍCH NỔ TUYỆT KỸ CLASS!";
      } else {
        statusCls = "cd";
        statusTxt = `⚡ Kỹ Năng Cố Định Class · Nộ ${ultPct}% / 100%`;
      }
      desc = cdef.skills.ult.desc;
      footLeft = "Tích Nộ qua đòn đánh & Phản Ứng";
      footRight = cdef.vnName;
    } else {
      iconKey = "skill_dash";
      name = "Chroma Dash & Né Hoàn Hảo";
      keyTag = "SPACE";
      if (p.dashCd > 0) {
        statusCls = "cd";
        statusTxt = `⏳ Đang hồi chiêu (${p.dashCd.toFixed(1)}s)`;
      } else {
        statusCls = "ok";
        statusTxt = "💨 SẴN SÀNG LƯỚT NÉ";
      }
      desc =
        "Lướt nhanh bất tử thoáng qua theo hướng di chuyển (tiêu hao Thể Lực). Lướt đúng khoảnh khắc đòn đánh địch chạm tới sẽ kích hoạt CHROMA DODGE — làm chậm thời gian & cường hóa đòn Phản Kích!";
      footLeft = `Hồi chiêu: ${cdef.baseStats.dashCooldown}s`;
      footRight = `Thể Lực: ${Math.floor(p.stamina)}/${p.maxStamina}`;
    }

    const sig = `${kind}|${p.classId}|${iconKey}|${statusTxt}|${footLeft}|${footRight}`;
    if (sig !== this.lastTipSig) {
      this.lastTipSig = sig;
      tipEl.innerHTML = `
        <div class="hst-head">
          <div class="hst-icon-wrap">
            <canvas id="hst-icon-cv" class="hst-icon" width="34" height="34"></canvas>
          </div>
          <div class="hst-title-col">
            <div class="hst-name-row">
              <span class="hst-name">${name}</span>
              <span class="hst-key">${keyTag}</span>
            </div>
            <div class="hst-status ${statusCls}">${statusTxt}</div>
          </div>
        </div>
        <div class="hst-desc">${desc}</div>
        ${extraBlock ? `<div class="hst-sub-block">${extraBlock}</div>` : ""}
        <div class="hst-foot">
          <span>${footLeft}</span>
          <span>${footRight}</span>
        </div>
      `;
      const iconCv = tipEl.querySelector("#hst-icon-cv") as HTMLCanvasElement | null;
      if (iconCv) {
        const ictx = iconCv.getContext("2d");
        if (ictx) {
          ictx.imageSmoothingEnabled = false;
          drawCodixelIcon(ictx, iconKey, 0, 0, iconCv.width);
        }
      }
    }

    tipEl.classList.remove("hidden");
    const rect = slotEl.getBoundingClientRect();
    const tw = tipEl.offsetWidth || 286;
    const th = tipEl.offsetHeight || 130;
    const left = Math.max(10, Math.min(window.innerWidth - tw - 10, rect.left + rect.width / 2 - tw / 2));
    const top = Math.max(10, rect.top - th - 10);
    tipEl.style.left = `${Math.round(left)}px`;
    tipEl.style.top = `${Math.round(top)}px`;
  }
}
