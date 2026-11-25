import { CLASS_DISPLAY_NAMES, ITEMS, RARITY_INFO, SLOT_LABELS, canClassEquip, getItemEffectiveStats } from "../data/items";
import { FORGE_RECIPES } from "../data/recipes";
import { createFrame, clearFrame, createFx, PAL } from "../vfx/pixelfx/core/index.js";
import { PIXELFX_MODS } from "../vfx/vfxManager";
import type { PixelfxFrame, PixelfxInstance } from "../vfx/pixelfxTypes";
import type { PixTelOpenWorldGame } from "../game";
import { sfx } from "../audio/chiptuneSynth";

const CHANNEL_DURATION = 1.25;

/**
 * Blacksmith Rune Matrix Forge Modal ("Ma Trận Luyện Khí"):
 * - Interactive geometric rune array with rotating rings, orbiting crystal nodes, and optional Catalyst slot.
 * - Clicking "Khai Triển Ma Trận" initiates a 1.25s channeling convergence animation before rolling +1 & bonus substats.
 * - Success bursts golden/prismatic shockwaves and awakens/scales random bonus substats.
 * - Failure triggers crimson matrix shatter VFX, keeps gear safe, and builds +8% Pity Resonance.
 * - Tab 2 ("Chế Tạo"): Filterable by player's current class or All Classes with compatibility indicators.
 */
export class ForgeModalUI {
  private game: PixTelOpenWorldGame;
  private root: HTMLElement;
  private contentEl: HTMLElement;
  private legendEl: HTMLElement;
  private tab: "enhance" | "craft" = "enhance";
  private craftFilter: "class" | "all" = "class";
  private selectedUid: string | null = null;
  private useCatalyst = false;
  private resultMsg = "";
  private resultOk = true;
  private lastRolledBonus = "";
  private lastBeforeAfter: { beforeAtk: number; afterAtk: number; beforeDef: number; afterDef: number; beforeHp: number; afterHp: number; beforeCrit: number; afterCrit: number } | null = null;

  // Rune Matrix animation state
  private matrixPhase: "idle" | "channeling" | "success" | "fail" = "idle";
  private matrixTimer = 0;
  private matrixClock = 0;
  private pendingUid: string | null = null;
  private pendingCatalyst = false;

  // Live pixelfx + Canvas Matrix Engine
  private fxCanvas: HTMLCanvasElement;
  private fxCtx: CanvasRenderingContext2D;
  private colorCanvas: HTMLCanvasElement;
  private colorCtx: CanvasRenderingContext2D;
  private colorImg: ImageData;
  private colorU32: Uint32Array;
  private lightCanvas: HTMLCanvasElement;
  private lightCtx: CanvasRenderingContext2D;
  private lightImg: ImageData;
  private lightU32: Uint32Array;
  private frame: PixelfxFrame;
  private activeFx: PixelfxInstance[] = [];
  private rafId = 0;
  private lastT = 0;

  constructor(game: PixTelOpenWorldGame) {
    this.game = game;
    this.root = document.getElementById("modal-forge")!;
    this.contentEl = document.getElementById("forge-content")!;
    this.legendEl = document.getElementById("forge-matrix-legend")!;
    this.fxCanvas = document.getElementById("forge-vfx-canvas") as HTMLCanvasElement;
    this.fxCtx = this.fxCanvas.getContext("2d")!;
    this.fxCtx.imageSmoothingEnabled = false;

    const w = this.fxCanvas.width;
    const h = this.fxCanvas.height;
    this.frame = createFrame(w, h, 0, 0);

    this.colorCanvas = document.createElement("canvas");
    this.colorCanvas.width = w;
    this.colorCanvas.height = h;
    this.colorCtx = this.colorCanvas.getContext("2d")!;
    this.colorImg = this.colorCtx.createImageData(w, h);
    this.colorU32 = new Uint32Array(this.colorImg.data.buffer);

    this.lightCanvas = document.createElement("canvas");
    this.lightCanvas.width = w;
    this.lightCanvas.height = h;
    this.lightCtx = this.lightCanvas.getContext("2d")!;
    this.lightImg = this.lightCtx.createImageData(w, h);
    this.lightU32 = new Uint32Array(this.lightImg.data.buffer);

    document.getElementById("btn-close-forge")!.addEventListener("click", () => {
      sfx.playUiClick();
      this.game.setModal(null);
    });

    document.getElementById("forge-tab-enhance")!.addEventListener("click", () => {
      if (this.matrixPhase === "channeling") return;
      sfx.playUiClick();
      this.tab = "enhance";
      this.render();
    });

    document.getElementById("forge-tab-craft")!.addEventListener("click", () => {
      if (this.matrixPhase === "channeling") return;
      sfx.playUiClick();
      this.tab = "craft";
      this.render();
    });
  }

  show() {
    this.root.classList.remove("hidden");
    this.resultMsg = "";
    this.lastRolledBonus = "";
    this.lastBeforeAfter = null;
    this.matrixPhase = "idle";
    this.matrixTimer = 0;
    this.pendingUid = null;
    const equips = this.game.inv.getAllEquipmentInstances();
    if (!this.selectedUid && equips.length > 0) {
      this.selectedUid = equips[0].item.uid;
    }
    this.render();
    this._startFxLoop();
  }

  hide() {
    this.matrixPhase = "idle";
    this.matrixTimer = 0;
    this.pendingUid = null;
    this.root.classList.add("hidden");
  }

  private _spawnFxMod(key: string, x: number, y: number, palette: string[]) {
    const mod = PIXELFX_MODS[key];
    if (!mod) return;
    this.activeFx.push(
      createFx(mod, {
        x,
        y,
        palette,
        seed: (Math.random() * 9999) | 0,
      })
    );
  }

  private _burstOutcomeFx(success: boolean) {
    const cx = this.fxCanvas.width / 2;
    const cy = this.fxCanvas.height / 2 + 4;
    if (success) {
      this._spawnFxMod("holy/holy-pillar", cx, cy + 8, PAL.gold);
      this._spawnFxMod("pickups/collect-burst", cx, cy, PAL.cyber);
      this._spawnFxMod("impacts/parry", cx, cy, PAL.gold);
    } else {
      this._spawnFxMod("impacts/hit-spark", cx, cy, PAL.blood);
      this._spawnFxMod("explosions/small-explosion", cx, cy + 2, PAL.blood);
      this._spawnFxMod("lightning/zap-hit", cx, cy, PAL.fire);
    }
  }

  private _resolveChanneling() {
    const uid = this.pendingUid;
    const useCat = this.pendingCatalyst;
    this.pendingUid = null;
    if (!uid) {
      this.matrixPhase = "idle";
      this.render();
      return;
    }

    const res = this.game.forge.enhanceItem(uid, this.game.inv, this.game.quests, useCat);
    this.resultMsg = res.message;
    this.resultOk = res.succeeded;
    this.lastRolledBonus = res.rolledBonusText ?? "";
    if (res.beforeStats && res.afterStats) {
      this.lastBeforeAfter = {
        beforeAtk: res.beforeStats.atk,
        afterAtk: res.afterStats.atk,
        beforeDef: res.beforeStats.def,
        afterDef: res.afterStats.def,
        beforeHp: res.beforeStats.maxHp,
        afterHp: res.afterStats.maxHp,
        beforeCrit: res.beforeStats.crit,
        afterCrit: res.afterStats.crit,
      };
    } else {
      this.lastBeforeAfter = null;
    }

    if (res.ok) {
      this._burstOutcomeFx(res.succeeded);
      if (res.succeeded) {
        this.matrixPhase = "success";
        this.matrixTimer = 1.65;
        sfx.playForgeSuccess();
        this.game.recalcPlayerStats(true);
        this.game.saveGame(false);
        this.game.refreshHud();
      } else {
        this.matrixPhase = "fail";
        this.matrixTimer = 1.55;
        sfx.playMatrixShatter();
        this.game.saveGame(false);
      }
    } else {
      this.matrixPhase = "idle";
      sfx.playForgeFail();
    }
    this.render();
  }

  private _drawRuneMatrix(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const shake =
      this.matrixPhase === "channeling" && this.matrixTimer < 0.45
        ? Math.round((Math.random() - 0.5) * 3)
        : this.matrixPhase === "fail" && this.matrixTimer > 0.95
          ? Math.round((Math.random() - 0.5) * 5)
          : 0;

    const cx = Math.round(w / 2) + shake;
    const cy = Math.round(h / 2 + 4) + shake;
    const R = 60;
    const rInner = 34;

    // 1. Background & faint pixel rune grid
    ctx.fillStyle = this.matrixPhase === "fail" ? "#190a12" : this.matrixPhase === "success" ? "#16140c" : "#0b0915";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(110, 90, 170, 0.10)";
    for (let gx = 0; gx < w; gx += 16) ctx.fillRect(gx, 0, 1, h);
    for (let gy = 0; gy < h; gy += 16) ctx.fillRect(0, gy, w, 1);

    // Get currently selected item & recipe nodes
    const found = this.selectedUid ? this.game.inv.findByUid(this.selectedUid) : null;
    const selDef = found ? ITEMS[found.item.defId] : null;
    const enhanceInfo =
      this.tab === "enhance" && found ? this.game.forge.getEnhanceInfo(found.item, this.game.inv, this.useCatalyst) : null;

    const spinRate =
      this.matrixPhase === "channeling"
        ? 2.8
        : this.matrixPhase === "success"
          ? 1.4
          : this.matrixPhase === "fail"
            ? 0.25
            : 0.42;

    const angle = this.matrixClock * spinRate;
    const colOuter =
      this.matrixPhase === "success"
        ? "#ffe066"
        : this.matrixPhase === "fail"
          ? "#ff3355"
          : this.matrixPhase === "channeling"
            ? "#7ef7ff"
            : "#6d52b3";
    const colInner =
      this.matrixPhase === "success"
        ? "#44ee88"
        : this.matrixPhase === "fail"
          ? "#ff7744"
          : this.matrixPhase === "channeling"
            ? "#ff77ff"
            : "#4389c9";

    // 2. Outer Matrix Circle & Octagon
    ctx.save();
    ctx.strokeStyle = colOuter;
    ctx.lineWidth = this.matrixPhase === "channeling" ? 2 : 1.5;
    if (this.matrixPhase === "fail") {
      ctx.setLineDash([5, 5]);
    }
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, R - 6, 0, Math.PI * 2);
    ctx.stroke();

    // Spinning Hexagram (2 triangles)
    ctx.setLineDash([]);
    ctx.strokeStyle = colInner;
    ctx.lineWidth = 1;
    for (let tri = 0; tri < 2; tri++) {
      ctx.beginPath();
      for (let i = 0; i <= 3; i++) {
        const a = (tri === 0 ? angle : -angle) + (i * Math.PI * 2) / 3 + tri * (Math.PI / 3);
        const px = cx + Math.cos(a) * (R - 11);
        const py = cy + Math.sin(a) * (R - 11);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Inner rune ring
    ctx.strokeStyle = colOuter;
    ctx.beginPath();
    ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 3. Channeling convergence beam progression
    const chProgress = this.matrixPhase === "channeling" ? Math.min(1, 1 - this.matrixTimer / CHANNEL_DURATION) : 0;

    // Material satellite nodes + optional top Catalyst apex node
    const mats = enhanceInfo?.materials ?? [];
    const nodeAngles = [-Math.PI * 0.78, -Math.PI * 0.22, Math.PI * 0.22, Math.PI * 0.78];
    for (let i = 0; i < Math.min(mats.length, nodeAngles.length); i++) {
      const m = mats[i];
      const have = this.game.inv.countItem(m.defId);
      const ok = have >= m.qty;
      const na = nodeAngles[i] + (this.matrixPhase === "channeling" ? this.matrixClock * 1.4 : Math.sin(this.matrixClock * 1.1) * 0.04);
      const nx = Math.round(cx + Math.cos(na) * R);
      const ny = Math.round(cy + Math.sin(na) * R);

      if (this.matrixPhase === "channeling" && ok) {
        ctx.strokeStyle = i % 2 === 0 ? "#4be8ff" : "#ffe066";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(cx, cy);
        ctx.stroke();
        const bx = Math.round(nx + (cx - nx) * chProgress);
        const by = Math.round(ny + (cy - ny) * chProgress);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(bx - 2, by - 2, 4, 4);
      }

      ctx.fillStyle = "#100c1c";
      ctx.fillRect(nx - 6, ny - 6, 12, 12);
      ctx.fillStyle = ok ? ITEMS[m.defId]?.iconColor ?? "#44ee88" : "#40384f";
      ctx.fillRect(nx - 4, ny - 4, 8, 8);
      ctx.strokeStyle = ok ? "#44ee88" : "#ff4466";
      ctx.strokeRect(nx - 6, ny - 6, 12, 12);
    }

    // Top Apex Catalyst Node (Bùa Ma Trận)
    if (this.tab === "enhance") {
      const catX = cx;
      const catY = cy - R - 4;
      const catActive = this.useCatalyst && (enhanceInfo?.hasCatalyst ?? false);
      if (catActive && this.matrixPhase === "channeling") {
        ctx.strokeStyle = "#e066ff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(catX, catY);
        ctx.lineTo(cx, cy);
        ctx.stroke();
      }
      ctx.fillStyle = "#140b24";
      ctx.fillRect(catX - 6, catY - 6, 12, 12);
      ctx.fillStyle = catActive ? "#e066ff" : "#2f2640";
      ctx.fillRect(catX - 4, catY - 4, 8, 8);
      ctx.strokeStyle = catActive ? "#ffbbff" : "#665285";
      ctx.strokeRect(catX - 6, catY - 6, 12, 12);
    }

    // 4. Center Core Item Glyph
    const corePulse = Math.round(Math.sin(this.matrixClock * (this.matrixPhase === "channeling" ? 14 : 4)) * 2);
    const coreR = 16 + (this.matrixPhase === "channeling" ? Math.round(chProgress * 4) : 0) + corePulse;
    ctx.fillStyle =
      this.matrixPhase === "success"
        ? "rgba(255, 224, 102, 0.25)"
        : this.matrixPhase === "fail"
          ? "rgba(255, 51, 85, 0.25)"
          : "rgba(75, 232, 255, 0.14)";
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(8, coreR), 0, Math.PI * 2);
    ctx.fill();

    // Draw center pixel equipment icon
    const itemCol = selDef?.iconColor ?? "#8b98b8";
    ctx.fillStyle = "#0e0c18";
    ctx.fillRect(cx - 10, cy - 10, 20, 20);
    ctx.fillStyle = RARITY_INFO[selDef?.rarity ?? "common"].color;
    ctx.fillRect(cx - 9, cy - 9, 18, 18);
    ctx.fillStyle = "#141224";
    ctx.fillRect(cx - 7, cy - 7, 14, 14);
    ctx.fillStyle = itemCol;
    if (selDef?.slot === "weapon") {
      // Sword / Wand / Dagger silhouette
      ctx.fillRect(cx - 1, cy - 6, 2, 10);
      ctx.fillRect(cx - 4, cy + 1, 8, 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(cx - 1, cy - 6, 1, 8);
    } else if (selDef?.slot === "armor") {
      ctx.fillRect(cx - 5, cy - 4, 10, 8);
      ctx.fillRect(cx - 3, cy - 5, 6, 2);
    } else if (selDef?.slot === "ring") {
      ctx.fillRect(cx - 4, cy - 4, 8, 8);
      ctx.fillStyle = "#141224";
      ctx.fillRect(cx - 2, cy - 2, 4, 4);
      ctx.fillStyle = "#ffe066";
      ctx.fillRect(cx - 1, cy - 5, 2, 2);
    } else {
      // Chip or fallback prism
      ctx.fillRect(cx - 4, cy - 4, 8, 8);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(cx - 2, cy - 2, 4, 4);
    }

    // Matrix Fracture lightning cracks on failure
    if (this.matrixPhase === "fail") {
      ctx.strokeStyle = "#ff4466";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        const fa = i * 1.05 + 0.3;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(fa) * 8, cy + Math.sin(fa) * 8);
        ctx.lineTo(cx + Math.cos(fa + 0.14) * 32, cy + Math.sin(fa + 0.14) * 32);
        ctx.lineTo(cx + Math.cos(fa - 0.12) * 56, cy + Math.sin(fa - 0.12) * 56);
        ctx.stroke();
      }
    }

    // Idle ambient floating sparks
    if (Math.random() < (this.matrixPhase === "channeling" ? 0.55 : 0.15)) {
      ctx.fillStyle = this.matrixPhase === "fail" ? "#ff3355" : this.matrixPhase === "success" ? "#ffe066" : "#5ef2ff";
      const rx = cx + Math.round((Math.random() - 0.5) * 90);
      const ry = cy + Math.round((Math.random() - 0.5) * 90);
      ctx.fillRect(rx, ry, 2, 2);
    }
  }

  private _startFxLoop() {
    if (this.rafId) return;
    this.lastT = performance.now();
    const tick = (now: number) => {
      if (this.root.classList.contains("hidden")) {
        this.rafId = 0;
        return;
      }
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastT) / 1000));
      this.lastT = now;
      this.matrixClock += dt;

      if (this.matrixPhase === "channeling") {
        this.matrixTimer -= dt;
        if (this.matrixTimer <= 0) {
          this._resolveChanneling();
        }
      } else if (this.matrixPhase === "success" || this.matrixPhase === "fail") {
        this.matrixTimer -= dt;
        if (this.matrixTimer <= 0) {
          this.matrixPhase = "idle";
        }
      }

      const ctx = this.fxCtx;
      const w = this.fxCanvas.width;
      const h = this.fxCanvas.height;
      this._drawRuneMatrix(ctx, w, h);

      if (this.activeFx.length > 0) {
        clearFrame(this.frame);
        for (let i = this.activeFx.length - 1; i >= 0; i--) {
          const fx = this.activeFx[i];
          fx.update(dt);
          fx.draw(this.frame, "back");
          fx.draw(this.frame, "front");
          if (fx.done()) this.activeFx.splice(i, 1);
        }
        this.colorU32.set(this.frame.color);
        this.colorCtx.putImageData(this.colorImg, 0, 0);
        ctx.drawImage(this.colorCanvas, 0, 0);

        this.lightU32.set(this.frame.light);
        this.lightCtx.putImageData(this.lightImg, 0, 0);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.drawImage(this.lightCanvas, 0, 0);
        ctx.restore();
      }

      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  render() {
    document.getElementById("forge-gold-val")!.textContent = `${this.game.inv.gold} G`;
    document.getElementById("forge-tab-enhance")!.classList.toggle("active", this.tab === "enhance");
    document.getElementById("forge-tab-craft")!.classList.toggle("active", this.tab === "craft");

    const banner = this.resultMsg
      ? `<div class="forge-msg ${this.resultOk ? "ok" : "fail"}">${this.resultMsg}${
          this.lastRolledBonus ? `<div style="margin-top:3px;color:#ffe066">✨ Thức tỉnh dòng phụ: ${this.lastRolledBonus}</div>` : ""
        }${
          this.lastBeforeAfter
            ? `<div style="margin-top:2px;font-size:11px;color:#d6f5e3">Biến đổi: ATK ${this.lastBeforeAfter.beforeAtk}→${this.lastBeforeAfter.afterAtk} · DEF ${this.lastBeforeAfter.beforeDef}→${this.lastBeforeAfter.afterDef} · HP ${this.lastBeforeAfter.beforeHp}→${this.lastBeforeAfter.afterHp}${this.lastBeforeAfter.afterCrit !== this.lastBeforeAfter.beforeCrit ? ` · CRIT ${this.lastBeforeAfter.beforeCrit}%→${this.lastBeforeAfter.afterCrit}%` : ""}</div>`
            : ""
        }</div>`
      : "";

    if (this.tab === "enhance") {
      this._renderEnhance(banner);
    } else {
      this._renderCraft(banner);
    }
    this._updateMatrixLegend();
  }

  private _updateMatrixLegend() {
    if (this.matrixPhase === "channeling") {
      this.legendEl.innerHTML = `<b style="color:#5ef2ff">⏳ ĐANG TỤ LINH MA TRẬN...</b><span>Các nút nguyên liệu đang hội tụ năng lượng vào lõi!</span>`;
      return;
    }
    if (this.tab === "craft") {
      this.legendEl.innerHTML = `<b style="color:#ffe066">⚒ TRẬN PHÁP ĐÚC ĐỒ</b><span>Chọn bản thiết kế bên phải để hợp thành trang bị Lam / Tím / Cam.</span>`;
      return;
    }
    const found = this.selectedUid ? this.game.inv.findByUid(this.selectedUid) : null;
    if (!found) {
      this.legendEl.innerHTML = `<span style="color:#9da8cc">Chưa có trang bị đặt vào tâm Ma Trận. Hãy nhận trang bị từ Nhiệm Vụ hoặc Quái Vật!</span>`;
      return;
    }
    const item = found.item;
    const def = ITEMS[item.defId];
    const pity = item.pityBonus ?? 0;
    const bonusEntries: string[] = [];
    if (item.bonusStats?.atk) bonusEntries.push(`+${item.bonusStats.atk} ATK`);
    if (item.bonusStats?.def) bonusEntries.push(`+${item.bonusStats.def} DEF`);
    if (item.bonusStats?.maxHp) bonusEntries.push(`+${item.bonusStats.maxHp} HP`);
    if (item.bonusStats?.spd) bonusEntries.push(`+${item.bonusStats.spd} SPD`);
    if (item.bonusStats?.crit) bonusEntries.push(`+${item.bonusStats.crit}% CRIT`);

    this.legendEl.innerHTML = `
      <b style="color:${RARITY_INFO[def.rarity].color}">${def.name} ${item.enhanceLevel > 0 ? `+${item.enhanceLevel}` : ""}</b>
      <div>Đỉnh Trận: <span style="color:${this.useCatalyst ? "#e066ff" : "#8b94b8"}">${this.useCatalyst ? "Bùa Ma Trận (+15%)" : "Trống"}</span></div>
      <div>Cộng Hưởng Thất Bại: <b style="color:#5ef2ff">+${pity}%</b> (tối đa +40%)</div>
      ${bonusEntries.length > 0 ? `<div style="color:#ffd76a">Dòng Phụ: ${bonusEntries.join(" · ")}</div>` : `<div style="color:#7e87a6">Thành công sẽ cuộn thêm dòng phụ ngẫu nhiên!</div>`}
    `;
  }

  private _renderEnhance(banner: string) {
    const equips = this.game.inv.getAllEquipmentInstances();
    if (!equips.some((e) => e.item.uid === this.selectedUid)) {
      this.selectedUid = equips[0]?.item.uid ?? null;
    }

    const listHtml =
      equips.length === 0
        ? `<div class="detail-empty">Chưa có trang bị nào. Hãy làm nhiệm vụ hoặc săn quái rớt đồ!</div>`
        : equips
            .map(({ item, equipped }) => {
              const def = ITEMS[item.defId];
              const col = RARITY_INFO[def.rarity].color;
              const sel = item.uid === this.selectedUid ? "selected" : "";
              const pityTag = (item.pityBonus ?? 0) > 0 ? `<span style="color:#5ef2ff;font-size:10px">+${item.pityBonus}%</span>` : "";
              return `
                <div class="forge-list-item ${sel}" data-pick="${item.uid}" style="border-color:${col}">
                  <span class="item-swatch" style="background:${def.iconColor}"></span>
                  <span style="color:${col};flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${def.name} ${item.enhanceLevel > 0 ? `+${item.enhanceLevel}` : ""}</span>
                  ${pityTag}
                  ${equipped ? `<span class="eq-badge">ĐANG MẶC</span>` : ""}
                </div>
              `;
            })
            .join("");

    let rightHtml = `<div class="detail-empty">Chọn một món trang bị đặt vào tâm Ma Trận Luyện Khí.</div>`;
    if (this.selectedUid) {
      const found = this.game.inv.findByUid(this.selectedUid);
      if (found) {
        const item = found.item;
        const def = ITEMS[item.defId];
        const curSt = getItemEffectiveStats(item);
        const nextSt = getItemEffectiveStats({ ...item, enhanceLevel: Math.min(10, item.enhanceLevel + 1) });
        const info = this.game.forge.getEnhanceInfo(item, this.game.inv, this.useCatalyst);
        const catCount = this.game.inv.countItem("mat_matrix_rune");
        if (!info.hasCatalyst && this.useCatalyst) {
          this.useCatalyst = false;
        }

        const matHtml = info.materials
          .map((m) => {
            const have = this.game.inv.countItem(m.defId);
            const ok = have >= m.qty;
            return `<div class="mat-row ${ok ? "ok" : "miss"}">${ITEMS[m.defId]?.name}: ${have}/${m.qty}</div>`;
          })
          .join("");

        const isBusy = this.matrixPhase === "channeling";

        rightHtml = `
          <div class="forge-detail">
            <div style="color:${RARITY_INFO[def.rarity].color};font-size:14px;font-weight:700">
              ${def.name} (+${item.enhanceLevel} → +${info.nextLevel})
            </div>
            <div class="forge-sub">
              ${def.slot ? SLOT_LABELS[def.slot] : ""} · Tỉ lệ gốc ${info.baseRate}%
              ${info.pityBonus > 0 ? `+ <span style="color:#5ef2ff">${info.pityBonus}% Cộng Hưởng</span>` : ""}
              ${info.catalystBoost > 0 ? `+ <span style="color:#e066ff">${info.catalystBoost}% Bùa</span>` : ""}
              = <b style="color:#44ee88">${info.effectiveRate}%</b>
            </div>
            <div class="forge-stat-preview">
              ${curSt.atk || nextSt.atk ? `<div>ATK: ${curSt.atk} → <b style="color:#44ee88">${nextSt.atk}</b> (+ngẫu nhiên dòng phụ!)</div>` : ""}
              ${curSt.def || nextSt.def ? `<div>DEF: ${curSt.def} → <b style="color:#44ee88">${nextSt.def}</b></div>` : ""}
              ${curSt.maxHp || nextSt.maxHp ? `<div>HP: ${curSt.maxHp} → <b style="color:#44ee88">${nextSt.maxHp}</b></div>` : ""}
              ${curSt.spd || nextSt.spd ? `<div>SPD: ${curSt.spd} → <b style="color:#44ee88">${nextSt.spd}</b></div>` : ""}
              ${curSt.crit || nextSt.crit ? `<div>CRIT: ${curSt.crit}% → <b style="color:#44ee88">${nextSt.crit}%</b></div>` : ""}
            </div>
            <div class="forge-mats">
              <div class="mat-row ${this.game.inv.gold >= info.goldCost ? "ok" : "miss"}">Vàng: ${this.game.inv.gold}/${info.goldCost} G</div>
              ${matHtml}
            </div>
            <label class="matrix-catalyst-toggle ${catCount <= 0 || isBusy ? "disabled" : ""}">
              <input type="checkbox" id="chk-matrix-catalyst" ${this.useCatalyst && catCount > 0 ? "checked" : ""} ${catCount <= 0 || isBusy ? "disabled" : ""} />
              <span>Khảm <b>Bùa Ma Trận</b> (+15% tỉ lệ) — Đang có: <b>${catCount}</b> (Mua tại Thương Nhân Mira)</span>
            </label>
            <div class="matrix-pity-bar">
              Cộng Hưởng An Toàn: Nếu thất bại, trang bị KHÔNG bị mất — +8% tỉ lệ vĩnh viễn cho lần luyện sau!
            </div>
            <button class="px-btn ${info.canEnhance && !isBusy ? "primary" : "disabled"}" id="btn-do-enhance" ${isBusy ? "disabled" : ""}>
              ${isBusy ? "⏳ ĐANG TỤ LINH MA TRẬN..." : `✡ KHAI TRIỂN MA TRẬN (+${info.nextLevel})`}
            </button>
            ${info.reason ? `<div class="forge-reason">${info.reason}</div>` : ""}
          </div>
        `;
      }
    }

    this.contentEl.innerHTML = `
      ${banner}
      <div class="forge-split">
        <div class="forge-list">${listHtml}</div>
        <div class="forge-panel">${rightHtml}</div>
      </div>
    `;

    this.contentEl.querySelectorAll("[data-pick]").forEach((el) => {
      el.addEventListener("click", () => {
        if (this.matrixPhase === "channeling") return;
        sfx.playUiClick();
        this.selectedUid = (el as HTMLElement).dataset.pick ?? null;
        this.resultMsg = "";
        this.lastRolledBonus = "";
        this.lastBeforeAfter = null;
        this.render();
      });
    });

    this.contentEl.querySelector("#chk-matrix-catalyst")?.addEventListener("change", (ev) => {
      if (this.matrixPhase === "channeling") return;
      sfx.playUiClick();
      this.useCatalyst = (ev.target as HTMLInputElement).checked;
      this.render();
    });

    this.contentEl.querySelector("#btn-do-enhance")?.addEventListener("click", () => {
      if (this.matrixPhase === "channeling" || !this.selectedUid) return;
      const found = this.game.inv.findByUid(this.selectedUid);
      if (!found) return;
      const info = this.game.forge.getEnhanceInfo(found.item, this.game.inv, this.useCatalyst);
      if (!info.canEnhance) {
        sfx.playForgeFail();
        this.resultMsg = info.reason ?? "Chưa đủ nguyên liệu hoặc vàng!";
        this.resultOk = false;
        this.render();
        return;
      }
      // Begin Rune Matrix Channeling animation!
      this.pendingUid = this.selectedUid;
      this.pendingCatalyst = this.useCatalyst && info.hasCatalyst;
      this.matrixPhase = "channeling";
      this.matrixTimer = CHANNEL_DURATION;
      this.resultMsg = "";
      this.lastRolledBonus = "";
      this.lastBeforeAfter = null;
      sfx.playMatrixChannel();
      this.render();
    });
  }

  private _renderCraft(banner: string) {
    const classId = this.game.player.classId;
    const filtered = FORGE_RECIPES.filter((rec) => {
      if (this.craftFilter === "all") return true;
      const def = ITEMS[rec.resultDefId];
      return !def.allowedClasses || def.allowedClasses.includes(classId);
    });

    const cards = filtered
      .map((rec) => {
        const def = ITEMS[rec.resultDefId];
        const rInfo = RARITY_INFO[def.rarity];
        const check = this.game.forge.canCraft(rec, this.game.inv);
        const usable = canClassEquip(def, classId);
        const classTag = def.allowedClasses?.length
          ? usable
            ? `<span class="class-req-ok">✓ Khớp Class</span>`
            : `<span class="class-req-bad">✗ Chỉ: ${def.allowedClasses.map((c) => CLASS_DISPLAY_NAMES[c]).join(", ")}</span>`
          : `<span class="class-req-ok">Mọi Class</span>`;
        const skillNote = def.grantsSkillE
          ? `<div style="color:#5ef2ff;font-size:10px">✦ Mở [E]: ${def.grantsSkillE.name}</div>`
          : def.grantsSkillQ
            ? `<div style="color:#ffe066;font-size:10px">✦ Tiến hóa [Q]: ${def.grantsSkillQ.name}</div>`
            : def.passiveSkill
              ? `<div style="color:#b8e4ff;font-size:10px">✦ Nội tại: ${def.passiveSkill.name}</div>`
              : "";
        const mats = rec.materials
          .map((m) => {
            const have = this.game.inv.countItem(m.defId);
            return `<span class="craft-mat ${have >= m.qty ? "ok" : "miss"}">${ITEMS[m.defId]?.name} ${have}/${m.qty}</span>`;
          })
          .join("");

        return `
          <div class="craft-card" style="border-color:${rInfo.color}">
            <div class="craft-head">
              <span class="item-swatch" style="background:${def.iconColor}"></span>
              <b style="color:${rInfo.color};font-size:12px">${def.name}</b>
              <span class="craft-rarity" style="color:${rInfo.color}">[${rInfo.label}]</span>
            </div>
            <div>${classTag}</div>
            ${skillNote}
            <div class="craft-desc">${rec.desc}</div>
            <div class="craft-mats">
              <span class="craft-mat ${this.game.inv.gold >= rec.goldCost ? "ok" : "miss"}">${rec.goldCost}G</span>
              ${mats}
            </div>
            <button class="px-btn ${check.ok ? "good" : "disabled"}" data-craft="${rec.id}">
              ⚒ HỢP THÀNH
            </button>
          </div>
        `;
      })
      .join("");

    this.contentEl.innerHTML = `
      ${banner}
      <div class="craft-filter-bar">
        <button class="px-btn sm ${this.craftFilter === "class" ? "active" : ""}" id="craft-filt-class">
          Lọc: ${CLASS_DISPLAY_NAMES[classId]}
        </button>
        <button class="px-btn sm ${this.craftFilter === "all" ? "active" : ""}" id="craft-filt-all">
          Tất cả (${FORGE_RECIPES.length})
        </button>
      </div>
      <div class="craft-grid">${cards}</div>
    `;

    this.contentEl.querySelector("#craft-filt-class")?.addEventListener("click", () => {
      sfx.playUiClick();
      this.craftFilter = "class";
      this.render();
    });
    this.contentEl.querySelector("#craft-filt-all")?.addEventListener("click", () => {
      sfx.playUiClick();
      this.craftFilter = "all";
      this.render();
    });

    this.contentEl.querySelectorAll("[data-craft]").forEach((el) => {
      el.addEventListener("click", () => {
        const recId = (el as HTMLElement).dataset.craft!;
        const res = this.game.forge.craftRecipe(recId, this.game.inv);
        this.resultMsg = res.message;
        this.resultOk = res.succeeded;
        this.lastRolledBonus = "";
        this.lastBeforeAfter = null;
        if (res.succeeded) {
          this._burstOutcomeFx(true);
          sfx.playForgeSuccess();
          this.game.saveGame(false);
        } else {
          sfx.playForgeFail();
        }
        this.render();
      });
    });
  }
}
