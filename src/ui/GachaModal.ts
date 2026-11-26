import { getClassDef } from "../data/classes";
import { GACHA_BANNERS, getGachaBanner, type GachaBannerDef } from "../data/gacha";
import { ITEMS, RARITY_INFO, getTierBadge } from "../data/items";
import type { Rarity } from "../data/types";
import { getWeaponSkillForItem } from "../data/weaponSkills";
import { drawCodixelIcon, onCodixelReady } from "../graphics/codixelAtlas";
import { drawItemIcon } from "../graphics/itemIcons";
import type { GachaRollOutcome } from "../systems/gachaSystem";
import { sfx } from "../audio/chiptuneSynth";
import type { PixTelOpenWorldGame } from "../game";

const RARITY_RANK: Record<Rarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  cursed: 4,
  legendary: 5,
};

const RARITY_BEAM_COLORS: Record<Rarity, [string, string, string]> = {
  common: ["#cbd5e1", "#909eb2", "#ffffff"],
  uncommon: ["#4ade80", "#1ea85c", "#d9ffe8"],
  rare: ["#60a5fa", "#1c8ee8", "#dffaff"],
  epic: ["#c084fc", "#8822dd", "#f7dcff"],
  cursed: ["#f43f5e", "#9f1239", "#ffe4e6"],
  legendary: ["#facc15", "#ff66cc", "#ffffff"],
};

const KEY_SPRITE_BY_BANNER: Record<string, string> = {
  banner_spring: "key_spring",
  banner_winter: "key_winter",
  banner_summer: "key_summer",
  banner_eclipse: "key_eclipse",
};

interface StageParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  kind: "confetti" | "star" | "spark" | "ambient";
  spin: number;
}

/**
 * PIXTEL v3.0 Seasonal Gacha Chest Modal ([G] / Đài Rương Gacha Mùa):
 * - 4 Biome-themed Seasonal Banners (Spring, Winter, Summer, Eclipse)
 * - 60FPS theatrical pixel-art opening sequence:
 *   1. Biome Key flies into lock & clicks open
 *   2. Shaking buildup with rising heartbeat chiptune arpeggio & light rays
 *   3. Dramatic "LẬT KÈO NÂNG PHẨM!" lightning shatter upgrade when fakeOutFrom triggers
 *   4. Lid blow-open, towering rarity light pillar, 130+ pixel confetti & flip-in Result Cards!
 */
export class GachaModalUI {
  private game: PixTelOpenWorldGame;
  private root: HTMLElement;
  private tabsEl: HTMLElement;
  private bannerTitleEl: HTMLElement;
  private bannerDescEl: HTMLElement;
  private keyPillEl: HTMLElement;
  private pityEl: HTMLElement;
  private featuredEl: HTMLElement;
  private resultsTrayEl: HTMLElement;
  private subPanelEl: HTMLElement;
  private btnRoll1: HTMLButtonElement;
  private btnRoll5: HTMLButtonElement;
  private btnSkip: HTMLButtonElement;
  private btnCraftKey: HTMLButtonElement;
  private btnRates: HTMLButtonElement;
  private btnHistory: HTMLButtonElement;

  private stageCanvas: HTMLCanvasElement;
  private stageCtx: CanvasRenderingContext2D;
  private readonly W = 380;
  private readonly H = 128;

  private selectedBannerId = GACHA_BANNERS[0].id;
  private activeSubTab: "none" | "rates" | "history" = "none";

  // Animation runtime state
  private rafId = 0;
  private lastNow = 0;
  private idleTime = 0;
  private animPhase: "idle" | "rolling" | "revealed" = "idle";
  private animTime = 0;
  private pendingOutcomes: GachaRollOutcome[] = [];
  private bestOutcome: GachaRollOutcome | null = null;
  private keyTurnPlayed = false;
  private fakeoutPlayed = false;
  private revealPlayed = false;
  private lastTickStep = -1;
  private stageShake = 0;
  private flashAlpha = 0;
  private particles: StageParticle[] = [];

  constructor(game: PixTelOpenWorldGame) {
    this.game = game;
    this.root = document.getElementById("modal-gacha")!;
    this.tabsEl = document.getElementById("gacha-tabs")!;
    this.bannerTitleEl = document.getElementById("gacha-banner-title")!;
    this.bannerDescEl = document.getElementById("gacha-banner-desc")!;
    this.keyPillEl = document.getElementById("gacha-key-pill")!;
    this.pityEl = document.getElementById("gacha-pity-bars")!;
    this.featuredEl = document.getElementById("gacha-featured-row")!;
    this.resultsTrayEl = document.getElementById("gacha-results-tray")!;
    this.subPanelEl = document.getElementById("gacha-sub-panel")!;
    this.btnRoll1 = document.getElementById("btn-gacha-roll1") as HTMLButtonElement;
    this.btnRoll5 = document.getElementById("btn-gacha-roll5") as HTMLButtonElement;
    this.btnSkip = document.getElementById("btn-gacha-skip") as HTMLButtonElement;
    this.btnCraftKey = document.getElementById("btn-gacha-craft-key") as HTMLButtonElement;
    this.btnRates = document.getElementById("btn-gacha-rates") as HTMLButtonElement;
    this.btnHistory = document.getElementById("btn-gacha-history") as HTMLButtonElement;

    this.stageCanvas = document.getElementById("gacha-stage-canvas") as HTMLCanvasElement;
    this.stageCanvas.width = this.W;
    this.stageCanvas.height = this.H;
    this.stageCtx = this.stageCanvas.getContext("2d")!;
    this.stageCtx.imageSmoothingEnabled = false;

    document.getElementById("btn-close-gacha")!.addEventListener("click", () => {
      sfx.playUiClick();
      this.game.setModal(null);
    });

    this.btnRoll1.addEventListener("click", () => this.startRoll(1));
    this.btnRoll5.addEventListener("click", () => this.startRoll(5));
    this.btnSkip.addEventListener("click", () => this.skipAnimation());
    this.btnCraftKey.addEventListener("click", () => {
      sfx.playUiClick();
      this.game.setModal("forge");
      // Switch forge to craft tab immediately if available
      window.setTimeout(() => {
        document.getElementById("forge-tab-craft")?.click();
      }, 20);
    });
    this.btnRates.addEventListener("click", () => {
      sfx.playUiClick();
      this.activeSubTab = this.activeSubTab === "rates" ? "none" : "rates";
      this._renderSubPanel();
    });
    this.btnHistory.addEventListener("click", () => {
      sfx.playUiClick();
      this.activeSubTab = this.activeSubTab === "history" ? "none" : "history";
      this._renderSubPanel();
    });

    onCodixelReady(() => {
      if (!this.root.classList.contains("hidden")) {
        this._renderAll();
      }
    });
  }

  show() {
    // Auto-select banner matching player's current biome if applicable
    const biomeBanner = GACHA_BANNERS.find((b) => b.biome === this.game.currentBiome);
    if (biomeBanner && this.animPhase !== "rolling") {
      this.selectedBannerId = biomeBanner.id;
    }
    this.root.classList.remove("hidden");
    this.animPhase = "idle";
    this.pendingOutcomes = [];
    this.bestOutcome = null;
    this.resultsTrayEl.innerHTML = "";
    this.resultsTrayEl.classList.add("hidden");
    this.btnSkip.classList.add("hidden");
    this._seedAmbientParticles();
    this._renderAll();
    this._startLoop();
  }

  hide() {
    this.root.classList.add("hidden");
    this.animPhase = "idle";
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  selectBanner(bannerId: string) {
    if (this.animPhase === "rolling") return;
    sfx.playUiClick();
    this.selectedBannerId = bannerId;
    this.animPhase = "idle";
    this.pendingOutcomes = [];
    this.bestOutcome = null;
    this.resultsTrayEl.innerHTML = "";
    this.resultsTrayEl.classList.add("hidden");
    this._seedAmbientParticles();
    this._renderAll();
  }

  startRoll(count: 1 | 5) {
    if (this.animPhase === "rolling") return;
    const banner = getGachaBanner(this.selectedBannerId);
    const res = this.game.gacha.roll(banner.id, count, this.game.inv);
    if (!res.ok) {
      sfx.playForgeFail();
      this.game.refreshHud();
      const toastMsg = res.reason ?? "Không đủ chìa khóa!";
      // Dispatch visual shake on roll buttons & toast via save/game
      this.bannerDescEl.innerHTML = `<span style="color:#ff6688">⚠ ${toastMsg}</span>`;
      return;
    }

    this.game.saveGame(false);
    this.game.refreshHud();

    this.pendingOutcomes = res.outcomes;
    this.bestOutcome = res.outcomes.reduce((best, cur) => {
      const bRank = RARITY_RANK[best.rarity] + (best.featured ? 0.5 : 0);
      const cRank = RARITY_RANK[cur.rarity] + (cur.featured ? 0.5 : 0);
      return cRank > bRank ? cur : best;
    }, res.outcomes[0]);

    this.animPhase = "rolling";
    this.animTime = 0;
    this.keyTurnPlayed = false;
    this.fakeoutPlayed = false;
    this.revealPlayed = false;
    this.lastTickStep = -1;
    this.stageShake = 0;
    this.flashAlpha = 0;
    this.resultsTrayEl.innerHTML = "";
    this.resultsTrayEl.classList.add("hidden");
    this.btnSkip.classList.remove("hidden");
    this._renderAll();
  }

  skipAnimation() {
    if (this.animPhase !== "rolling" || !this.bestOutcome) return;
    this.animTime = 2.4;
    this._finishReveal();
  }

  private _finishReveal() {
    if (this.animPhase === "revealed" || !this.bestOutcome) return;
    this.animPhase = "revealed";
    this.btnSkip.classList.add("hidden");
    if (!this.revealPlayed) {
      this.revealPlayed = true;
      sfx.playGachaReveal(this.bestOutcome.rarity);
      this.flashAlpha = this.bestOutcome.rarity === "legendary" ? 0.95 : 0.72;
      this.stageShake = this.bestOutcome.rarity === "legendary" ? 7 : 4.5;
      this._spawnCelebrationBurst(this.bestOutcome.rarity);
    }
    this._renderResultCards();
    this._renderAll();
  }

  private _getBanner(): GachaBannerDef {
    return getGachaBanner(this.selectedBannerId);
  }

  private _renderAll() {
    const banner = this._getBanner();
    const keyDef = ITEMS[banner.keyItemId];
    const keyCount = this.game.inv.countItem(banner.keyItemId);
    const pity = this.game.gacha.getPity(banner.id);
    const rolling = this.animPhase === "rolling";

    // Apply seasonal tint border on modal box
    const box = this.root.querySelector(".gacha-modal-box") as HTMLElement | null;
    if (box) {
      box.style.setProperty("--season-accent", banner.accent);
      box.style.setProperty("--season-accent2", banner.secondaryAccent);
      box.style.setProperty("--season-tint", banner.bgTint);
    }

    // 1. Tabs for 4 Seasons
    this.tabsEl.innerHTML = GACHA_BANNERS.map((b) => {
      const cnt = this.game.inv.countItem(b.keyItemId);
      const active = b.id === banner.id;
      return `
        <button class="gacha-tab-btn ${active ? "active" : ""}" data-banner-id="${b.id}" style="--tab-acc:${b.accent}" ${rolling ? "disabled" : ""}>
          <canvas class="gacha-tab-key-cv" data-key-sprite="${KEY_SPRITE_BY_BANNER[b.id] ?? "key_spring"}" width="20" height="20"></canvas>
          <span class="gacha-tab-meta">
            <span class="gacha-tab-name">${b.seasonTag.split("·")[0].trim()}</span>
            <span class="gacha-tab-keys ${cnt > 0 ? "has-keys" : ""}">🗝 x${cnt}</span>
          </span>
        </button>
      `;
    }).join("");

    this.tabsEl.querySelectorAll<HTMLButtonElement>("[data-banner-id]").forEach((btn) => {
      btn.addEventListener("click", () => this.selectBanner(btn.dataset.bannerId!));
    });
    this.tabsEl.querySelectorAll<HTMLCanvasElement>(".gacha-tab-key-cv").forEach((cv) => {
      const ctx = cv.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, cv.width, cv.height);
        drawCodixelIcon(ctx, cv.dataset.keySprite, 0, 0, cv.width);
      }
    });

    // 2. Banner Header & Key Counter
    this.bannerTitleEl.innerHTML = `
      <span class="gacha-season-pill" style="border-color:${banner.accent};color:${banner.accent}">${banner.seasonTag}</span>
      <span>${banner.name}</span>
    `;
    this.bannerDescEl.textContent = banner.desc;

    this.keyPillEl.innerHTML = `
      <canvas id="gacha-cur-key-cv" width="24" height="24"></canvas>
      <span>${keyDef?.name ?? "Chìa Khóa"}: <b style="color:${keyCount > 0 ? "#ffe066" : "#ff6688"}">x${keyCount}</b></span>
    `;
    const curKeyCv = this.keyPillEl.querySelector("#gacha-cur-key-cv") as HTMLCanvasElement | null;
    if (curKeyCv) {
      const kctx = curKeyCv.getContext("2d");
      if (kctx) drawCodixelIcon(kctx, KEY_SPRITE_BY_BANNER[banner.id] ?? "key_spring", 0, 0, 24);
    }

    // 3. Pity Progress Bars
    const epicPct = Math.min(100, Math.round((pity.epic / banner.pityEpicAt) * 100));
    const legPct = Math.min(100, Math.round((pity.legend / banner.pityLegendAt) * 100));
    const softHot = pity.epic >= 7 || pity.legend >= 18;
    this.pityEl.innerHTML = `
      <div class="gacha-pity-item">
        <div class="gacha-pity-lbl">
          <span>★ Bảo Hiểm Tím / Nổi Bật</span>
          <b style="color:${pity.epic >= 7 ? "#ffe066" : "#d266ff"}">${pity.epic}/${banner.pityEpicAt}${pity.epic >= 7 ? " (TĂNG TỈ LỆ!)" : ""}</b>
        </div>
        <div class="gacha-pity-track"><div class="gacha-pity-fill epic" style="width:${epicPct}%"></div></div>
      </div>
      <div class="gacha-pity-item">
        <div class="gacha-pity-lbl">
          <span>👑 Bảo Hiểm Jackpot Mùa</span>
          <b style="color:${softHot ? "#ffe066" : "#5ef2ff"}">${pity.legend}/${banner.pityLegendAt}</b>
        </div>
        <div class="gacha-pity-track"><div class="gacha-pity-fill legend" style="width:${legPct}%"></div></div>
      </div>
    `;

    // 4. Featured Seasonal Items Showcase
    this.featuredEl.innerHTML = banner.featuredIds
      .map((id) => {
        const def = ITEMS[id];
        if (!def) return "";
        const rInfo = RARITY_INFO[def.rarity];
        const ws = def.slot === "weapon" ? getWeaponSkillForItem(def.id) : null;
        const reqCls =
          def.requiredClass && def.requiredClass !== "all" ? getClassDef(def.requiredClass).vnName : "Mọi Class";
        return `
          <div class="gacha-feat-card rarity-${def.rarity}" data-review-def="${def.id}">
            <canvas class="gacha-feat-cv" data-item-id="${def.id}" width="38" height="38"></canvas>
            <div class="gacha-feat-info">
              <div class="gacha-feat-name" style="color:${rInfo.color}">★ ${def.name}</div>
              <div class="gacha-feat-sub">${reqCls} · ${ws ? `Skill [E]: ${ws.name}` : def.passiveDesc ?? def.desc}</div>
            </div>
          </div>
        `;
      })
      .join("");

    this.featuredEl.querySelectorAll<HTMLCanvasElement>(".gacha-feat-cv").forEach((cv) => {
      const def = ITEMS[cv.dataset.itemId!];
      const ctx = cv.getContext("2d");
      if (def && ctx) {
        ctx.clearRect(0, 0, cv.width, cv.height);
        drawItemIcon(ctx, def, 34, 2, 2);
      }
    });

    // 5. Roll Buttons state
    this.btnRoll1.disabled = rolling || keyCount < 1;
    this.btnRoll5.disabled = rolling || keyCount < 5;
    this.btnRoll1.classList.toggle("ready-glow", !rolling && keyCount >= 1);
    this.btnRoll5.classList.toggle("ready-glow", !rolling && keyCount >= 5);
    this.btnRoll1.innerHTML = `🗝 MỞ ×1 <span class="gacha-btn-cost">(1 Chìa)</span>`;
    this.btnRoll5.innerHTML = `★ MỞ ×5 <span class="gacha-btn-cost">(5 Chìa · Hồi Hộp!)</span>`;

    this._renderSubPanel();
  }

  private _renderResultCards() {
    const outcomes = this.pendingOutcomes;
    if (outcomes.length === 0) {
      this.resultsTrayEl.classList.add("hidden");
      return;
    }

    this.resultsTrayEl.classList.remove("hidden");
    this.resultsTrayEl.classList.toggle("multi-5", outcomes.length > 1);
    this.resultsTrayEl.innerHTML = outcomes
      .map((o, idx) => {
        const def = ITEMS[o.itemId];
        if (!def) return "";
        const rInfo = RARITY_INFO[o.rarity];
        const tInfo = getTierBadge(def);
        const ws = def.slot === "weapon" ? getWeaponSkillForItem(def.id) : null;
        const canQuickEquip =
          !o.isDuplicate &&
          def.category === "equipment" &&
          (!def.requiredClass || def.requiredClass === "all" || def.requiredClass === this.game.player.classId);

        const badge = o.featured
          ? `<span class="grc-pill featured">★ ĐỘC QUYỀN MÙA</span>`
          : o.fakeOutFrom
            ? `<span class="grc-pill fakeout">⚡ LẬT KÈO!</span>`
            : `<span class="grc-pill" style="color:${tInfo.color};border-color:${tInfo.color}">${tInfo.badge}</span>`;

        const dupLine = o.isDuplicate
          ? `<div class="grc-dup">Trùng → +${o.bonusShards} Mảnh LK · +${o.bonusGold}G</div>`
          : ws
            ? `<div class="grc-skill">✦ [E] ${ws.name}</div>`
            : def.exoticModId
              ? `<div class="grc-skill">★ Hiệu Ứng Mùa Đặc Biệt</div>`
              : o.qty > 1
                ? `<div class="grc-qty">Số lượng: x${o.qty}</div>`
                : "";

        return `
          <div class="gacha-res-card rarity-${o.rarity} ${o.featured ? "is-featured" : ""}" style="--card-delay:${idx * 85}ms" data-review-def="${def.id}">
            <div class="grc-top">${badge}</div>
            <div class="grc-icon-wrap">
              <canvas class="grc-icon-cv" data-item-id="${def.id}" width="44" height="44"></canvas>
            </div>
            <div class="grc-name" style="color:${rInfo.color}">${def.name}</div>
            <div class="grc-rarity" style="color:${rInfo.color}">[${rInfo.label}]</div>
            ${dupLine}
            ${canQuickEquip ? `<button class="px-btn sm good grc-equip-btn" data-equip-def="${def.id}">⚡ MẶC NGAY</button>` : ""}
          </div>
        `;
      })
      .join("");

    this.resultsTrayEl.querySelectorAll<HTMLCanvasElement>(".grc-icon-cv").forEach((cv) => {
      const def = ITEMS[cv.dataset.itemId!];
      const ctx = cv.getContext("2d");
      if (def && ctx) {
        ctx.clearRect(0, 0, cv.width, cv.height);
        drawItemIcon(ctx, def, 38, 3, 3);
      }
    });

    this.resultsTrayEl.querySelectorAll<HTMLButtonElement>("[data-equip-def]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const defId = btn.dataset.equipDef!;
        const inst = this.game.inv.bag.find((b) => b.defId === defId);
        if (!inst) {
          btn.textContent = "ĐÃ MẶC";
          btn.disabled = true;
          return;
        }
        const res = this.game.inv.equipFromBag(inst.uid, this.game.player.classId);
        if (res.ok) {
          const def = ITEMS[defId];
          if (def?.slot === "weapon") sfx.playEquipWeapon();
          else if (def?.slot === "accessory") sfx.playEquipAccessory();
          else sfx.playEquipArmor();
          this.game.recalcPlayerStats(true);
          this.game.saveGame(false);
          this.game.refreshHud();
          btn.textContent = "✓ ĐÃ MẶC";
          btn.disabled = true;
        }
      });
    });
  }

  private _renderSubPanel() {
    this.btnRates.classList.toggle("active", this.activeSubTab === "rates");
    this.btnHistory.classList.toggle("active", this.activeSubTab === "history");
    if (this.activeSubTab === "none") {
      this.subPanelEl.classList.add("hidden");
      return;
    }

    this.subPanelEl.classList.remove("hidden");
    const banner = this._getBanner();
    if (this.activeSubTab === "rates") {
      const totalW = banner.pool.reduce((s, e) => s + e.weight, 0);
      const rows = banner.pool
        .map((e) => {
          const def = ITEMS[e.itemId];
          if (!def) return "";
          const pct = ((e.weight / totalW) * 100).toFixed(1);
          const col = RARITY_INFO[e.rarity].color;
          return `
            <div class="gacha-rate-row" data-review-def="${def.id}">
              <span style="color:${col}">${e.featured ? "★ " : ""}${def.name}${e.qty && e.qty > 1 ? ` x${e.qty}` : ""}</span>
              <span style="color:${col}">${pct}%</span>
            </div>
          `;
        })
        .join("");
      this.subPanelEl.innerHTML = `
        <div class="gacha-sub-hdr">TỈ LỆ RƠI MINH BẠCH — ${banner.name} (Bảo hiểm Tím 10 · Jackpot 25 · Trùng → Mảnh LK + Vàng)</div>
        <div class="gacha-rates-grid">${rows}</div>
      `;
      return;
    }

    // History tab
    const hist = this.game.gacha.history;
    if (hist.length === 0) {
      this.subPanelEl.innerHTML = `<div class="gacha-sub-hdr">LỊCH SỬ MỞ RƯƠNG (0 lần)</div><div class="empty-note">Chưa mở rương nào. Hãy săn quái nhặt Chìa Mùa hoặc rèn tại Kael rồi thử vận may!</div>`;
      return;
    }
    this.subPanelEl.innerHTML = `
      <div class="gacha-sub-hdr">LỊCH SỬ MỞ RƯƠNG GẦN ĐÂY (Tổng: ${this.game.gacha.totalRolls} lần)</div>
      <div class="gacha-hist-list">
        ${hist
          .slice(0, 15)
          .map((h) => {
            const def = ITEMS[h.itemId];
            const b = getGachaBanner(h.bannerId);
            const col = RARITY_INFO[h.rarity].color;
            return `<div class="gacha-hist-row" data-review-def="${h.itemId}">
              <span style="color:${col}">[${RARITY_INFO[h.rarity].label}] ${def?.name ?? h.itemId}</span>
              <span class="gacha-hist-b">${b.seasonTag.split("·")[0].trim()}</span>
            </div>`;
          })
          .join("")}
      </div>
    `;
  }

  private _seedAmbientParticles() {
    this.particles = [];
    const b = this._getBanner();
    for (let i = 0; i < 24; i++) {
      this.particles.push({
        x: Math.random() * this.W,
        y: Math.random() * this.H,
        vx: b.id === "banner_winter" ? -8 + Math.random() * 16 : -6 + Math.random() * 12,
        vy: b.id === "banner_summer" ? -14 - Math.random() * 18 : 8 + Math.random() * 14,
        size: Math.random() < 0.35 ? 2 : 1,
        color: i % 2 === 0 ? b.accent : b.secondaryAccent,
        life: Math.random() * 3,
        maxLife: 3.5,
        kind: "ambient",
        spin: Math.random() * 6.28,
      });
    }
  }

  private _spawnSparks(cx: number, cy: number, count: number, colors: string[], speed = 95) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = speed * (0.35 + Math.random() * 0.85);
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 16,
        size: Math.random() < 0.45 ? 2 : 1,
        color: colors[i % colors.length],
        life: 0,
        maxLife: 0.45 + Math.random() * 0.45,
        kind: "spark",
        spin: Math.random() * 6.28,
      });
    }
  }

  private _spawnCelebrationBurst(rarity: Rarity) {
    const cx = this.W / 2;
    const cy = 66;
    const cols =
      rarity === "legendary"
        ? ["#ffe066", "#ff66cc", "#5ef2ff", "#55ee99", "#ff9933", "#ffffff"]
        : rarity === "epic"
          ? ["#d266ff", "#ff88f2", "#ffe066", "#ffffff"]
          : rarity === "rare"
            ? ["#38e8ff", "#78f4ff", "#ffe066", "#ffffff"]
            : ["#55ee99", "#aaffcc", "#ffffff"];
    const total = rarity === "legendary" ? 135 : rarity === "epic" ? 95 : 65;
    for (let i = 0; i < total; i++) {
      const a = -Math.PI * 0.92 + Math.random() * Math.PI * 0.84;
      const spd = 45 + Math.random() * 145;
      this.particles.push({
        x: cx + (Math.random() - 0.5) * 20,
        y: cy + (Math.random() - 0.5) * 8,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 24,
        size: i % 5 === 0 ? 3 : 2,
        color: cols[i % cols.length],
        life: 0,
        maxLife: 1.2 + Math.random() * 1.1,
        kind: i % 4 === 0 ? "star" : "confetti",
        spin: Math.random() * 6.28,
      });
    }
  }

  private _startLoop() {
    if (this.rafId) return;
    this.lastNow = performance.now();
    const loop = (now: number) => {
      if (this.root.classList.contains("hidden")) {
        this.rafId = 0;
        return;
      }
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastNow) / 1000));
      this.lastNow = now;
      this._updateStage(dt);
      this._drawStage();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private _updateStage(dt: number) {
    this.idleTime += dt;
    this.stageShake = Math.max(0, this.stageShake - dt * 12);
    this.flashAlpha = Math.max(0, this.flashAlpha - dt * 1.65);

    const b = this._getBanner();

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      if (pt.kind === "ambient") {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        if (pt.x < -4) pt.x = this.W + 3;
        if (pt.x > this.W + 4) pt.x = -3;
        if (pt.y > this.H + 4) pt.y = -3;
        if (pt.y < -4) pt.y = this.H + 3;
        continue;
      }
      pt.life += dt;
      if (pt.life >= pt.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += (pt.kind === "confetti" ? 135 : 90) * dt;
      pt.vx *= 0.985;
      pt.spin += dt * 9;
    }

    if (this.animPhase !== "rolling" || !this.bestOutcome) return;

    this.animTime += dt;
    const t = this.animTime;
    const cx = this.W / 2;
    const cy = 74;

    // 0.44s: Biome Key locks in & turns!
    if (t >= 0.44 && !this.keyTurnPlayed) {
      this.keyTurnPlayed = true;
      sfx.playGachaKeyTurn();
      this.stageShake = 2.5;
      this._spawnSparks(cx, cy + 4, 24, ["#ffe066", b.accent, "#ffffff"], 80);
    }

    // 0.56s - 1.50s: Accelerating anticipation ticks & sparks!
    if (t >= 0.56 && t < 1.52) {
      const norm = (t - 0.56) / 0.96;
      const step = Math.floor(Math.pow(norm, 1.45) * 11);
      if (step > this.lastTickStep) {
        this.lastTickStep = step;
        sfx.playGachaTick(step);
        this.stageShake = Math.max(this.stageShake, 1.2 + norm * 3.8);
        const curRarity = this.bestOutcome.fakeOutFrom && t < 1.22 ? this.bestOutcome.fakeOutFrom : this.bestOutcome.rarity;
        const pal = RARITY_BEAM_COLORS[curRarity];
        this._spawnSparks(cx, cy - 2, 7 + Math.floor(norm * 8), pal, 60 + norm * 55);
      }
    }

    // 1.22s: DRAMATIC FAKE-OUT LIGHTNING UPGRADE ("Lật Kèo Đổi Màu!")
    if (this.bestOutcome.fakeOutFrom && t >= 1.22 && !this.fakeoutPlayed) {
      this.fakeoutPlayed = true;
      sfx.playGachaFakeoutCrack();
      this.stageShake = 6.5;
      this.flashAlpha = 0.82;
      const pal = RARITY_BEAM_COLORS[this.bestOutcome.rarity];
      this._spawnSparks(cx, cy - 6, 48, [...pal, "#ffe066", "#ffffff"], 135);
    }

    // 1.58s: Blow open the lid & reveal!
    if (t >= 1.58) {
      this._finishReveal();
    }
  }

  private _drawPixelChest(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    banner: GachaBannerDef,
    lidOpenPx: number,
    glowColor: string,
    glowStrength: number
  ) {
    const x = Math.round(cx - 22);
    const y = Math.round(cy - 14);
    const w = 44;
    const h = 28;

    // Ground shadow
    ctx.fillStyle = "rgba(4, 3, 12, 0.55)";
    ctx.fillRect(x - 4, y + h - 1, w + 8, 6);

    // Outer glow aura behind chest
    if (glowStrength > 0.05) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.65, glowStrength * 0.65);
      ctx.fillStyle = glowColor;
      ctx.fillRect(x - 6, y - 8 - lidOpenPx, w + 12, h + 12 + lidOpenPx);
      ctx.restore();
    }

    // Chest Body (bottom half)
    ctx.fillStyle = "#100a1c";
    ctx.fillRect(x - 1, y + 9, w + 2, 20);
    ctx.fillStyle = "#2b1c3d";
    ctx.fillRect(x, y + 10, w, 18);
    // Horizontal planks
    ctx.fillStyle = "#1e132c";
    ctx.fillRect(x + 2, y + 16, w - 4, 2);
    ctx.fillRect(x + 2, y + 22, w - 4, 2);
    // Gold/seasonal vertical metal bands
    ctx.fillStyle = banner.accent;
    ctx.fillRect(x + 4, y + 10, 4, 18);
    ctx.fillRect(x + w - 8, y + 10, 4, 18);
    ctx.fillStyle = "#ffe066";
    ctx.fillRect(x + 5, y + 11, 2, 16);
    ctx.fillRect(x + w - 7, y + 11, 2, 16);
    // Rim highlight
    ctx.fillStyle = "#f2d16b";
    ctx.fillRect(x, y + 10, w, 2);

    // Inner bright radiance crack when opening
    if (lidOpenPx > 0 || glowStrength > 0.2) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x + 2, y + 8 - Math.min(4, lidOpenPx), w - 4, 3 + Math.min(4, lidOpenPx));
      ctx.fillStyle = glowColor;
      ctx.fillRect(x + 1, y + 7 - Math.min(6, lidOpenPx), w - 2, 2 + Math.min(3, lidOpenPx));
    }

    // Chest Lid (raises up when opened!)
    const ly = y - lidOpenPx;
    ctx.fillStyle = "#100a1c";
    ctx.fillRect(x - 2, ly - 1, w + 4, 13);
    ctx.fillStyle = "#3e2658";
    ctx.fillRect(x - 1, ly, w + 2, 11);
    ctx.fillStyle = "#59387d";
    ctx.fillRect(x + 1, ly + 1, w - 2, 4);
    // Seasonal accents on lid
    ctx.fillStyle = banner.accent;
    ctx.fillRect(x + 4, ly, 4, 11);
    ctx.fillRect(x + w - 8, ly, 4, 11);
    ctx.fillStyle = banner.secondaryAccent;
    ctx.fillRect(x + 12, ly + 3, w - 24, 3);
    ctx.fillStyle = "#ffe066";
    ctx.fillRect(x - 1, ly + 9, w + 2, 2);

    // Center Keyhole Clasp
    ctx.fillStyle = "#100a1c";
    ctx.fillRect(cx - 5, y + 7 - Math.round(lidOpenPx * 0.3), 10, 10);
    ctx.fillStyle = "#ffe066";
    ctx.fillRect(cx - 4, y + 8 - Math.round(lidOpenPx * 0.3), 8, 8);
    ctx.fillStyle = glowStrength > 0.35 ? glowColor : "#150e22";
    ctx.fillRect(cx - 1, y + 10 - Math.round(lidOpenPx * 0.3), 2, 4);
  }

  private _drawStage() {
    const ctx = this.stageCtx;
    const W = this.W;
    const H = this.H;
    const banner = this._getBanner();

    ctx.imageSmoothingEnabled = false;
    ctx.save();

    // Stage screen shake
    if (this.stageShake > 0.1) {
      const sx = Math.round((Math.random() - 0.5) * this.stageShake * 2);
      const sy = Math.round((Math.random() - 0.5) * this.stageShake * 2);
      ctx.translate(sx, sy);
    }

    // 1. Starry Seasonal Sky Background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#090616");
    grad.addColorStop(0.65, banner.bgTint);
    grad.addColorStop(1, "#120c22");
    ctx.fillStyle = grad;
    ctx.fillRect(-10, -10, W + 20, H + 20);

    // Twinkling pixel stars
    for (let i = 0; i < 28; i++) {
      const sx = (i * 47 + 19) % W;
      const sy = (i * 29 + 7) % (H - 36);
      const tw = Math.sin(this.idleTime * 3.2 + i * 1.7);
      ctx.fillStyle = tw > 0.4 ? "#ffffff" : tw > -0.2 ? banner.accent : "#493e66";
      ctx.fillRect(sx, sy, tw > 0.7 ? 2 : 1, tw > 0.7 ? 2 : 1);
    }

    const cx = Math.round(W / 2);
    const pedestalY = 94;

    // Determine active rarity color for rays & glow
    let activeRarity: Rarity = "rare";
    if (this.bestOutcome) {
      if (this.animPhase === "rolling" && this.bestOutcome.fakeOutFrom && this.animTime < 1.22) {
        activeRarity = this.bestOutcome.fakeOutFrom;
      } else {
        activeRarity = this.bestOutcome.rarity;
      }
    }
    const beamPal = RARITY_BEAM_COLORS[activeRarity];
    const isRainbow = activeRarity === "legendary";
    const dynBeamColor = isRainbow
      ? ["#ffe066", "#ff66cc", "#5ef2ff", "#55ee99"][Math.floor(this.idleTime * 10) % 4]
      : beamPal[0];

    // 2. Rotating God-Rays behind Chest
    const rayIntensity =
      this.animPhase === "revealed"
        ? 0.55
        : this.animPhase === "rolling"
          ? Math.min(0.85, Math.max(0.15, (this.animTime - 0.45) * 0.75))
          : 0.14;
    ctx.save();
    ctx.translate(cx, pedestalY - 22);
    ctx.globalAlpha = rayIntensity;
    const rayCount = this.animPhase === "revealed" && activeRarity === "legendary" ? 12 : 8;
    for (let i = 0; i < rayCount; i++) {
      const a = this.idleTime * (this.animPhase === "rolling" ? 2.4 : 0.65) + (i * Math.PI * 2) / rayCount;
      ctx.fillStyle = i % 2 === 0 ? dynBeamColor : beamPal[1];
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a - 0.09) * 170, Math.sin(a - 0.09) * 170);
      ctx.lineTo(Math.cos(a + 0.09) * 170, Math.sin(a + 0.09) * 170);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 3. Towering Vertical Loot Beam (Rolling crescendo + Revealed!)
    if (this.animPhase === "revealed" || (this.animPhase === "rolling" && this.animTime > 0.72)) {
      const bw =
        this.animPhase === "revealed"
          ? activeRarity === "legendary"
            ? 54
            : activeRarity === "epic"
              ? 40
              : 28
          : Math.round(((this.animTime - 0.72) / 0.86) * 32);
      ctx.save();
      ctx.globalAlpha = this.animPhase === "revealed" ? 0.34 : 0.48;
      ctx.fillStyle = dynBeamColor;
      ctx.fillRect(cx - Math.round(bw / 2), 0, bw, pedestalY - 4);
      ctx.globalAlpha = 0.72;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(cx - Math.round(bw / 5), 0, Math.max(4, Math.round(bw / 2.5)), pedestalY - 4);
      ctx.restore();
    }

    // 4. Pixel Runic Pedestal Floor
    ctx.fillStyle = "#18102b";
    ctx.fillRect(cx - 56, pedestalY, 112, 14);
    ctx.fillStyle = "#2b1d4a";
    ctx.fillRect(cx - 52, pedestalY + 1, 104, 10);
    ctx.fillStyle = banner.accent;
    ctx.fillRect(cx - 48, pedestalY + 1, 96, 2);
    ctx.fillStyle = banner.secondaryAccent;
    for (let rx = -36; rx <= 36; rx += 12) {
      ctx.fillRect(cx + rx - 2, pedestalY + 5, 4, 2);
    }

    // 5. Pixel Treasure Chest (Idle / Rolling Shake / Open!)
    let chestX = cx;
    let chestY = pedestalY - 12;
    let lidOpen = 0;
    let glowStr = 0.16 + 0.08 * Math.sin(this.idleTime * 4);
    let glowCol = banner.accent;

    if (this.animPhase === "idle") {
      chestY += Math.round(Math.sin(this.idleTime * 3.2) * 2.5);
    } else if (this.animPhase === "rolling") {
      glowCol = dynBeamColor;
      if (this.animTime > 0.5) {
        const amp = Math.min(5.5, (this.animTime - 0.5) * 5.2);
        chestX += Math.round(Math.sin(this.animTime * 54) * amp);
        chestY += Math.round(Math.cos(this.animTime * 42) * Math.min(2.5, amp * 0.45));
        glowStr = Math.min(1, 0.25 + (this.animTime - 0.5) * 0.75);
        lidOpen = Math.round(Math.max(0, (this.animTime - 0.95) * 8));
      }
    } else if (this.animPhase === "revealed") {
      chestY += 6;
      lidOpen = 11;
      glowStr = 0.85;
      glowCol = dynBeamColor;
    }

    this._drawPixelChest(ctx, chestX, chestY, banner, lidOpen, glowCol, glowStr);

    // 6. Flying Biome Key Animation (0.00 -> 0.52s)
    if (this.animPhase === "rolling" && this.animTime < 0.56) {
      const p = Math.min(1, this.animTime / 0.44);
      const ease = 1 - Math.pow(1 - p, 3);
      const kx = Math.round(40 + (cx - 40) * ease);
      const ky = Math.round(108 + (chestY - 4 - 108) * ease - Math.sin(p * Math.PI) * 34);
      ctx.save();
      ctx.translate(kx, ky);
      if (this.animTime > 0.42) {
        const rot = ((this.animTime - 0.42) / 0.14) * (Math.PI * 0.5);
        ctx.rotate(rot);
      }
      drawCodixelIcon(ctx, KEY_SPRITE_BY_BANNER[banner.id] ?? "key_spring", -11, -11, 22);
      ctx.restore();
    }

    // 7. FAKE-OUT LIGHTNING CRACK & BANNER (1.22 -> 1.58s)
    if (this.animPhase === "rolling" && this.bestOutcome?.fakeOutFrom && this.animTime >= 1.22) {
      ctx.save();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 70, 6);
      ctx.lineTo(cx - 18, 34);
      ctx.lineTo(cx + 8, 52);
      ctx.lineTo(cx - 6, 72);
      ctx.lineTo(cx + 42, 114);
      ctx.stroke();

      // Dramatic pixel banner
      ctx.fillStyle = "rgba(18, 8, 36, 0.9)";
      ctx.fillRect(cx - 88, 10, 176, 18);
      ctx.strokeStyle = "#ffe066";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 88.5, 10.5, 177, 17);
      ctx.fillStyle = "#ffe066";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("★ LẬT KÈO NÂNG PHẨM! ★", cx, 23);
      ctx.restore();
    }

    // 8. Revealed Hero Best Item Floating Over Opened Chest!
    if (this.animPhase === "revealed" && this.bestOutcome) {
      const bestDef = ITEMS[this.bestOutcome.itemId];
      if (bestDef) {
        const bob = Math.round(Math.sin(this.idleTime * 4.5) * 2.5);
        const ix = cx - 20;
        const iy = 28 + bob;
        // Halo ring
        ctx.fillStyle = dynBeamColor;
        ctx.globalAlpha = 0.28;
        ctx.fillRect(ix - 5, iy - 5, 50, 50);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#120c22";
        ctx.fillRect(ix - 2, iy - 2, 44, 44);
        ctx.strokeStyle = dynBeamColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(ix - 2, iy - 2, 44, 44);
        drawItemIcon(ctx, bestDef, 38, ix + 1, iy + 1);

        // Top rarity banner (crisp, never clipped!)
        const rInfo = RARITY_INFO[this.bestOutcome.rarity];
        ctx.fillStyle = "rgba(12, 8, 24, 0.9)";
        ctx.fillRect(cx - 122, 6, 244, 15);
        ctx.strokeStyle = dynBeamColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - 122.5, 6.5, 245, 14);
        ctx.fillStyle = rInfo.color;
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        const tag = this.bestOutcome.featured
          ? `★ JACKPOT MÙA: ${bestDef.name.toUpperCase()} ★`
          : `✦ ${rInfo.label.toUpperCase()}: ${bestDef.name.toUpperCase()}`;
        ctx.fillText(tag.slice(0, 40), cx, 17);
      }
    } else if (this.animPhase === "idle") {
      ctx.fillStyle = "rgba(12, 8, 24, 0.72)";
      ctx.fillRect(cx - 88, 6, 176, 14);
      ctx.fillStyle = "#ffe066";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("CHỌN MÙA · TRA CHÌA · MỞ RƯƠNG KHO BÁU!", cx, 16);
    }

    // 9. Particles (Ambient + Sparks + Confetti + Stars)
    for (const pt of this.particles) {
      const px = Math.round(pt.x);
      const py = Math.round(pt.y);
      ctx.fillStyle = pt.color;
      if (pt.kind === "star") {
        ctx.fillRect(px - 1, py, 3, 1);
        ctx.fillRect(px, py - 1, 1, 3);
      } else {
        ctx.fillRect(px, py, pt.size, pt.size);
      }
    }

    // 10. Blinding Flash Overlay on Fakeout / Open!
    if (this.flashAlpha > 0.01) {
      ctx.fillStyle = `rgba(255, 250, 232, ${this.flashAlpha.toFixed(2)})`;
      ctx.fillRect(-10, -10, W + 20, H + 20);
    }

    ctx.restore();
  }
}
