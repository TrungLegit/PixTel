import { getClassDef } from "../data/classes";
import { ENEMIES } from "../data/enemies";
import { CONSUMABLE_GROUP_LABELS, ITEMS, getTierBadge } from "../data/items";
import { LORE_TABLETS } from "../data/lore";
import {
  BIOME_CONFIGS,
  TILE_SIZE,
  TOWN_NPCS,
  WAYPOINTS,
  WORLD_CAMPS,
  WORLD_COLS,
  WORLD_ROWS,
} from "../data/worldConfig";
import { onCodixelReady } from "../graphics/codixelAtlas";
import { ELEMENT_META } from "../data/elements";
import { ELEMENT_DISPLAY } from "../systems/forgeSystem";
import { BEGINNER_PRACTICE_STEPS } from "./TutorialModal";
import { uiRarityFx } from "../vfx/uiRarityFx";
import type { PixTelOpenWorldGame } from "../game";
import { sfx } from "../audio/chiptuneSynth";

const ELEMENT_LABELS = [
  { name: "HỎA", color: "#ff5533" },
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
  private lastTutorialStepKey = "";
  private cachedHotbarIcons = ["", "", "", ""];

  constructor(game: PixTelOpenWorldGame) {
    this.game = game;
    this.hudRoot = document.getElementById("hud-layer")!;
    this.miniCanvas = document.getElementById("minimap-canvas") as HTMLCanvasElement;
    this.miniCtx = this.miniCanvas.getContext("2d")!;
    this.miniCtx.imageSmoothingEnabled = false;
    this.toastContainer = document.getElementById("toast-stack")!;
    this.tutorialBannerEl = document.getElementById("hud-tutorial-banner");

    onCodixelReady(() => {
      this.cachedHotbarIcons.fill("");
      this.update();
    });

    // Quick toolbar buttons
    document.getElementById("hud-btn-help")?.addEventListener("click", () => this.game.toggleModal("tutorial"));
    document.getElementById("hud-btn-map")!.addEventListener("click", () => this.game.toggleModal("world_map"));
    document.getElementById("hud-btn-bag")!.addEventListener("click", () => this.game.toggleModal("inventory"));
    document.getElementById("hud-stat-pts-btn")?.addEventListener("click", () => this.game.toggleModal("inventory"));
    document.getElementById("hud-btn-quest")!.addEventListener("click", () => this.game.toggleModal("journal"));
    document.getElementById("hud-btn-save")!.addEventListener("click", () => this.game.saveGame(true));
    document.getElementById("hud-btn-mute")!.addEventListener("click", (ev) => {
      const muted = sfx.toggleMute();
      (ev.currentTarget as HTMLElement).textContent = muted ? "MUTE" : "SFX";
    });
    document.getElementById("hud-btn-pause")!.addEventListener("click", () => this.game.toggleModal("pause"));

    this.miniCanvas.addEventListener("click", () => this.game.toggleModal("world_map"));

    // Clickable consumable buttons [1]-[4]
    document.getElementById("slot-c1")!.addEventListener("click", () => this.game.useConsumableSlot(1));
    document.getElementById("slot-c2")!.addEventListener("click", () => this.game.useConsumableSlot(2));
    document.getElementById("slot-c3")!.addEventListener("click", () => this.game.useConsumableSlot(3));
    document.getElementById("slot-c4")!.addEventListener("click", () => this.game.useConsumableSlot(4));

    document.getElementById("interact-prompt")!.addEventListener("click", () => this.game.interactNearest());
  }

  setVisible(show: boolean) {
    this.hudRoot.classList.toggle("hidden", !show);
  }

  toast(msg: string, tone: "info" | "good" | "warn" | "epic" = "info") {
    const el = document.createElement("div");
    el.className = `pixel-toast tone-${tone}`;
    el.textContent = msg;
    this.toastContainer.appendChild(el);
    while (this.toastContainer.children.length > 4) {
      this.toastContainer.removeChild(this.toastContainer.firstChild!);
    }
    window.setTimeout(() => {
      el.classList.add("fade-out");
      window.setTimeout(() => el.remove(), 260);
    }, 3600);
  }

  update() {
    if (!this.game.running) return;
    const p = this.game.player;
    const cdef = getClassDef(p.classId);
    const biomeCfg = BIOME_CONFIGS[this.game.currentBiome];

    const badge = document.getElementById("hud-class-badge")!;
    badge.textContent = `${cdef.vnName} · LV.${p.level}`;
    badge.style.color = cdef.accent;

    const hpPct = Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100));
    document.getElementById("hud-hp-fill")!.style.width = `${hpPct}%`;
    document.getElementById("hud-hp-text")!.textContent = `HP ${Math.ceil(p.hp)}/${p.maxHp}`;

    const xpPct = Math.max(0, Math.min(100, (p.xp / p.xpNext) * 100));
    document.getElementById("hud-xp-fill")!.style.width = `${xpPct}%`;
    document.getElementById("hud-xp-text")!.textContent = `XP ${p.xp}/${p.xpNext}`;

    document.getElementById("hud-gold")!.textContent = `${this.game.inv.gold} G`;
    document.getElementById("hud-biome")!.textContent = `${biomeCfg.name} (${biomeCfg.levelRange})`;
    document.getElementById("hud-restore")!.textContent = `Màu: ${this.game.colorSys.getProgressPct()}% · Trụ ${this.game.colorSys.unlockedWaypoints.size}/${WAYPOINTS.length} · Bia ${this.game.discoveredLore.size}/${LORE_TABLETS.length}`;

    // Stat Points pulsing button + Active buffs / Class / Weapon Infusion / Counter status
    const statPtsBtn = document.getElementById("hud-stat-pts-btn");
    if (statPtsBtn) {
      statPtsBtn.classList.toggle("hidden", p.statPoints <= 0);
      if (p.statPoints > 0) {
        statPtsBtn.textContent = `✨ +${p.statPoints} ĐIỂM TIỀM NĂNG [I]`;
      }
    }

    const extraBits: string[] = [];
    if (!this.game.inv.equipment.weapon) {
      extraBits.push(`<span style="color:#ff99aa">✊ Tay Không</span>`);
    }
    if (p.classId === "chroma_mage") {
      const el = ELEMENT_LABELS[p.elementIdx % ELEMENT_LABELS.length];
      extraBits.push(`<span style="color:${el.color}">Hệ: ${el.name}</span>`);
    } else if (p.classId === "pixel_tinker") {
      extraBits.push(`<span style="color:#44ee88">Trụ: ${this.game.turrets.length}/2</span>`);
    }

    const wpn = this.game.inv.equipment.weapon;
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
    document.getElementById("hud-status-line")!.innerHTML = extraBits.join(" · ");

    // Live 6-Step Beginner Practice Banner (hidden automatically when inactive or when Boss bar is up)
    if (this.tutorialBannerEl) {
      const bossActive = Boolean(this.game.getActiveBoss());
      const stepDef = BEGINNER_PRACTICE_STEPS[this.game.tutorialStep];
      if (this.game.tutorialActive && stepDef && !bossActive) {
        this.tutorialBannerEl.classList.remove("hidden");
        const stepKey = `${this.game.tutorialStep}:${this.game.tutorialComboHits}`;
        if (this.lastTutorialStepKey !== stepKey) {
          this.lastTutorialStepKey = stepKey;
          const extraCombo =
            stepDef.id === "combo3" ? ` (${Math.min(3, this.game.tutorialComboHits)}/3 nhịp)` : "";
          this.tutorialBannerEl.innerHTML = `
            <div class="tut-banner-head">
              <span class="tut-banner-step">🌱 HƯỚNG DẪN TÂN THỦ · BƯỚC ${this.game.tutorialStep + 1}/${BEGINNER_PRACTICE_STEPS.length}</span>
              <div class="tut-banner-btns">
                <button id="hud-tut-open-book" class="hud-mini-btn" title="Mở Cẩm Nang [H]">CẨM NANG [H]</button>
                <button id="hud-tut-skip" class="hud-mini-btn" title="Bỏ qua hướng dẫn">BỎ QUA ✕</button>
              </div>
            </div>
            <div class="tut-banner-main">
              <span class="tut-key-pill">${stepDef.keyBadge}</span>
              <b>${stepDef.title}${extraCombo}</b>
            </div>
            <div class="tut-banner-desc">${stepDef.desc}</div>
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
        this.lastTutorialStepKey = "";
      }
    }

    // Boss HP Bar + Phase + Bleach Shield + Territory Lock Tag
    const boss = this.game.getActiveBoss();
    const bossBox = document.getElementById("hud-boss-bar")!;
    const shieldWrap = document.getElementById("hud-boss-shield-wrap");
    const lockTag = document.getElementById("hud-boss-lock-tag");
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
      tracker.innerHTML = `<div class="qt-empty">Gặp Trưởng Làng Elian [F] để nhận nhiệm vụ hoặc bấm [J] đọc Biên Niên Sử!</div>`;
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

    // Equipment-gated LMB / [E] / [Q] Skill Bar
    const eqWeapon = this.game.inv.equipment.weapon;
    const eqAccessory = this.game.inv.equipment.accessory;
    const lmbNameEl = document.getElementById("skill-lmb-name");
    const lmbSub = document.getElementById("skill-lmb-sub");
    if (!eqWeapon) {
      if (lmbNameEl) lmbNameEl.textContent = "Đấm Tay Không";
      if (lmbSub) {
        lmbSub.textContent = p.comboTimer > 0 ? `ĐẤM ${p.comboStep === 0 ? 3 : p.comboStep}/3` : "TAY KHÔNG";
      }
    } else {
      if (lmbNameEl) lmbNameEl.textContent = cdef.skills.lmb.name;
      if (lmbSub) {
        lmbSub.textContent =
          p.quickChargeTimer > 0
            ? "TỤ NHANH!"
            : p.comboTimer > 0
              ? `NHỊP ${p.comboStep === 0 ? 3 : p.comboStep}/3`
              : "COMBO";
      }
    }

    const slotE = document.getElementById("slot-skill-e")!;
    if (!eqWeapon) {
      slotE.classList.add("locked");
      slotE.classList.remove("on-cd");
      document.getElementById("skill-e-name")!.textContent = "🔒 Cần Vũ Khí";
      document.getElementById("skill-e-cd")!.textContent = "KHÓA";
    } else {
      slotE.classList.remove("locked");
      document.getElementById("skill-e-name")!.textContent = cdef.skills.skill.name.replace(/\s*\(E\)/, "");
      document.getElementById("skill-e-cd")!.textContent = p.skillCd > 0 ? `${p.skillCd.toFixed(1)}s` : "READY";
      slotE.classList.toggle("on-cd", p.skillCd > 0);
    }

    const ultPct = Math.floor(p.overdrive);
    const slotQ = document.getElementById("slot-skill-q")!;
    if (!eqAccessory) {
      slotQ.classList.add("locked");
      slotQ.classList.remove("ult-ready");
      document.getElementById("skill-q-name")!.textContent = "🔒 Cần Phụ Kiện";
      document.getElementById("skill-q-cd")!.textContent = "KHÓA";
    } else {
      slotQ.classList.remove("locked");
      document.getElementById("skill-q-name")!.textContent = cdef.skills.ult.name.replace(/\s*\(Q\)/, "");
      document.getElementById("skill-q-cd")!.textContent = ultPct >= 100 ? "SẴN SÀNG!" : `${ultPct}%`;
      slotQ.classList.toggle("ult-ready", ultPct >= 100);
    }

    document.getElementById("skill-dash-cd")!.textContent = p.dashCd > 0 ? `${p.dashCd.toFixed(1)}s` : "READY";
    document.getElementById("slot-dash")!.classList.toggle("on-cd", p.dashCd > 0);

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

      document.getElementById(`c${slotNum}-qty`)!.textContent = `x${totalCnt}`;
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
      if (isBoss) plot(camp.tx, camp.ty, "#ff3355", 5);
    }
    for (const ch of this.game.spawner.chests) {
      if (ch.state !== "opened") {
        plot(ch.x / TILE_SIZE, ch.y / TILE_SIZE, ch.state === "unlocked" ? "#ffe066" : "#ff6688", 3);
      }
    }

    const blink = (Math.floor(this.game.time * 4) & 1) === 0;
    plot(ptx, pty, blink ? "#ffffff" : "#5ef2ff", 4);
  }
}
