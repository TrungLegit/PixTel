import { getClassDef } from "../data/classes";
import { ENEMIES } from "../data/enemies";
import { CONSUMABLE_GROUP_LABELS, ITEMS, getTierBadge } from "../data/items";
import { BIOME_CONFIGS, TILE_SIZE, TOWN_NPCS, WAYPOINTS, WORLD_CAMPS, WORLD_COLS, WORLD_ROWS } from "../data/worldConfig";
import { onCodixelReady } from "../graphics/codixelAtlas";
import { uiRarityFx } from "../vfx/uiRarityFx";
import type { PixTelOpenWorldGame } from "../game";
import { sfx } from "../audio/chiptuneSynth";

const ELEMENT_LABELS = [
  { name: "LỬA", color: "#ff5533" },
  { name: "BĂNG", color: "#44eeff" },
  { name: "ĐỘC", color: "#55ff66" },
];

/**
 * In-game HUD:
 * - Top-left Hero stats, HP/XP bars, Gold, Biome + Color Restoration progress
 * - Top-center Boss HP bar (when fighting a Boss)
 * - Top-right Live Pixel Minimap + Quest Tracker + Quick menu buttons
 * - Bottom Skill Hotbar (LMB, E, Q, Space, 1-3 Consumables) + [F] Interact Prompt
 * - Crisp Toast notification feed
 */
export class HudUI {
  private game: PixTelOpenWorldGame;
  private hudRoot: HTMLElement;
  private miniCanvas: HTMLCanvasElement;
  private miniCtx: CanvasRenderingContext2D;
  private toastContainer: HTMLElement;
  private cachedHotbarIcons = ["", "", "", ""];

  constructor(game: PixTelOpenWorldGame) {
    this.game = game;
    this.hudRoot = document.getElementById("hud-layer")!;
    this.miniCanvas = document.getElementById("minimap-canvas") as HTMLCanvasElement;
    this.miniCtx = this.miniCanvas.getContext("2d")!;
    this.miniCtx.imageSmoothingEnabled = false;
    this.toastContainer = document.getElementById("toast-stack")!;

    onCodixelReady(() => {
      this.cachedHotbarIcons.fill("");
      this.update();
    });

    // Quick toolbar buttons
    document.getElementById("hud-btn-map")!.addEventListener("click", () => this.game.toggleModal("world_map"));
    document.getElementById("hud-btn-bag")!.addEventListener("click", () => this.game.toggleModal("inventory"));
    document.getElementById("hud-btn-quest")!.addEventListener("click", () => this.game.toggleModal("journal"));
    document.getElementById("hud-btn-save")!.addEventListener("click", () => this.game.saveGame(true));
    document.getElementById("hud-btn-mute")!.addEventListener("click", (ev) => {
      const muted = sfx.toggleMute();
      (ev.currentTarget as HTMLElement).textContent = muted ? "MUTE" : "SFX";
    });
    document.getElementById("hud-btn-pause")!.addEventListener("click", () => this.game.toggleModal("pause"));

    // Clickable minimap opens World Map [M]
    this.miniCanvas.addEventListener("click", () => this.game.toggleModal("world_map"));

    // Clickable consumable buttons [1]-[4]
    document.getElementById("slot-c1")!.addEventListener("click", () => this.game.useConsumableSlot(1));
    document.getElementById("slot-c2")!.addEventListener("click", () => this.game.useConsumableSlot(2));
    document.getElementById("slot-c3")!.addEventListener("click", () => this.game.useConsumableSlot(3));
    document.getElementById("slot-c4")!.addEventListener("click", () => this.game.useConsumableSlot(4));

    // Clickable [F] prompt
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

    // Hero Identity & Bars
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
    document.getElementById("hud-restore")!.textContent = `Màu: ${this.game.colorSys.getProgressPct()}% · Trụ ${this.game.colorSys.unlockedWaypoints.size}/${WAYPOINTS.length}`;

    // Active buffs / Class indicator
    const extraBits: string[] = [];
    if (p.classId === "chroma_mage") {
      const el = ELEMENT_LABELS[p.elementIdx % 3];
      extraBits.push(`<span style="color:${el.color}">Hệ kế: ${el.name}</span>`);
    } else if (p.classId === "pixel_tinker") {
      extraBits.push(`<span style="color:#44ee88">Trụ: ${this.game.turrets.length}/2</span>`);
    }
    const wpnLv = this.game.inv.getWeaponEnhanceLevel();
    if (wpnLv > 0) extraBits.push(`<span style="color:#ffe066">Vũ khí +${wpnLv}</span>`);
    if (p.atkBuffTime > 0) extraBits.push(`<span style="color:#ffee44">ATK+${Math.round((p.atkBuffPct || 0.3) * 100)}% (${Math.ceil(p.atkBuffTime)}s)</span>`);
    if (p.speedBuffTime > 0) extraBits.push(`<span style="color:#44ee88">SPD+${Math.round((p.speedBuffPct || 0.28) * 100)}% (${Math.ceil(p.speedBuffTime)}s)</span>`);
    if (p.aegisTime > 0) extraBits.push(`<span style="color:#5ef2ff">AEGIS -${Math.round((p.defBuffPct || 0.35) * 100)}% (${Math.ceil(p.aegisTime)}s)</span>`);
    document.getElementById("hud-status-line")!.innerHTML = extraBits.join(" · ");

    // Boss HP Bar
    const boss = this.game.getActiveBoss();
    const bossBox = document.getElementById("hud-boss-bar")!;
    if (boss) {
      bossBox.classList.remove("hidden");
      const bdef = ENEMIES[boss.defId];
      document.getElementById("hud-boss-name")!.textContent = `${bdef?.name ?? "BOSS"} (LV.${boss.level})`;
      const bpct = Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100));
      document.getElementById("hud-boss-fill")!.style.width = `${bpct}%`;
      document.getElementById("hud-boss-hp")!.textContent = `${Math.max(0, Math.ceil(boss.hp))} / ${boss.maxHp}`;
    } else {
      bossBox.classList.add("hidden");
    }

    // Quest Tracker (Right Panel)
    const tracker = document.getElementById("hud-quest-list")!;
    const tracked = this.game.quests.getTrackedQuests();
    if (tracked.length === 0) {
      tracker.innerHTML = `<div class="qt-empty">Gặp Trưởng Làng Elian ở Thị Trấn [F] để nhận nhiệm vụ mới!</div>`;
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

    // Skill Hotbar & Cooldowns
    document.getElementById("skill-e-name")!.textContent = cdef.skills.skill.name.replace(/\s*\(E\)/, "");
    document.getElementById("skill-e-cd")!.textContent = p.skillCd > 0 ? `${p.skillCd.toFixed(1)}s` : "READY";
    document.getElementById("slot-skill-e")!.classList.toggle("on-cd", p.skillCd > 0);

    const ultPct = Math.floor(p.overdrive);
    document.getElementById("skill-q-name")!.textContent = cdef.skills.ult.name.replace(/\s*\(Q\)/, "");
    document.getElementById("skill-q-cd")!.textContent = ultPct >= 100 ? "SẴN SÀNG!" : `${ultPct}%`;
    document.getElementById("slot-skill-q")!.classList.toggle("ult-ready", ultPct >= 100);

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

    // Render Live Zoomed Pixel Minimap
    this._drawMinimap();
  }

  private _drawMinimap() {
    const ctx = this.miniCtx;
    const w = this.miniCanvas.width;
    const h = this.miniCanvas.height;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#0e0c18";
    ctx.fillRect(0, 0, w, h);

    // Crop 54x54 tiles centered on player -> draw 2x crisp pixels into 108x108 minimap
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

    // Waypoints
    for (const wp of WAYPOINTS) {
      const on = this.game.colorSys.unlockedWaypoints.has(wp.id);
      plot(wp.tx, wp.ty, on ? "#38f2ff" : "#b4bcc9", 4);
    }
    // Town NPCs
    for (const npc of TOWN_NPCS) {
      const m = this.game.quests.getNpcMarker(npc.id);
      plot(npc.tx, npc.ty, m === "?" ? "#44ee88" : m === "!" ? "#ffe066" : "#ffaa44", 3);
    }
    // Unopened Chests & Boss Camps
    for (const camp of WORLD_CAMPS) {
      const isBoss = camp.id.includes("boss");
      if (isBoss) plot(camp.tx, camp.ty, "#ff3355", 5);
    }
    for (const ch of this.game.spawner.chests) {
      if (ch.state !== "opened") {
        plot(ch.x / TILE_SIZE, ch.y / TILE_SIZE, ch.state === "unlocked" ? "#ffe066" : "#ff6688", 3);
      }
    }

    // Blinking Player Dot
    const blink = (Math.floor(this.game.time * 4) & 1) === 0;
    plot(ptx, pty, blink ? "#ffffff" : "#5ef2ff", 4);
  }
}
