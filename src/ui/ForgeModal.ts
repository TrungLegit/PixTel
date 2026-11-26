import {
  CLASS_DISPLAY_NAMES,
  ITEMS,
  RARITY_INFO,
  SLOT_LABELS,
  canClassEquip,
  getItemEffectiveStats,
  getItemMilestoneSummary,
  getTierBadge,
  type NormalizedEquipStats,
} from "../data/items";
import { FORGE_RECIPES } from "../data/recipes";
import { INFUSABLE_ELEMENTS } from "../data/elements";
import type { InfusableElement } from "../data/types";
import { onCodixelReady } from "../graphics/codixelAtlas";
import {
  CATALYST_BONUS_PCT,
  CATALYST_SHARD_COST,
  ELEMENT_DISPLAY,
  INFUSE_GOLD_COST,
} from "../systems/forgeSystem";
import { uiRarityFx } from "../vfx/uiRarityFx";
import { createFrame, clearFrame, createFx, PAL } from "../vfx/pixelfx/core/index.js";
import { PIXELFX_MODS } from "../vfx/vfxManager";
import type { PixelfxFrame, PixelfxInstance } from "../vfx/pixelfxTypes";
import type { PixTelOpenWorldGame } from "../game";
import { sfx } from "../audio/chiptuneSynth";

const CHANNEL_DURATION = 1.25;

interface MatrixFlashSummary {
  ok: boolean;
  label: string;
  deltaText: string;
  bonusText?: string;
}

/**
 * Blacksmith Ma Trận Luyện Khí (Prism Rune Forge Modal):
 * - Animated 240x176 geometric Rune Matrix Array with channeling convergence,
 *   random substat awakening (+ATK/DEF/HP/SPD/CRIT) on +1, & shatter failure VFX
 * - Safe +0 -> +10 Enhancement with Pity Bar, Prism Catalyst (+15%), Milestone Previews,
 *   and +5 Chroma Pigment 8-Element Infusion Socket
 * - Craft Tab with Archetype / Boss-Core Recipes & Class Compatibility Filter
 */
export class ForgeModalUI {
  private game: PixTelOpenWorldGame;
  private root: HTMLElement;
  private contentEl: HTMLElement;
  private legendEl: HTMLElement;
  private tab: "enhance" | "craft" = "enhance";
  private craftFilter: "class" | "all" | "hidden" = "class";
  private selectedUid: string | null = null;
  private useCatalyst = false;
  private resultMsg = "";
  private resultOk = true;
  private lastFlash: MatrixFlashSummary | null = null;

  private matrixPhase: "idle" | "channeling" | "success" | "fail" = "idle";
  private matrixProgress = 0;
  private matrixTimer = 0;
  private matrixRot = 0;
  private matrixTargetUid: string | null = null;
  private matrixUseCatalyst = false;

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

    onCodixelReady(() => {
      if (!this.root.classList.contains("hidden")) {
        this.render();
      }
    });
  }

  show() {
    this.root.classList.remove("hidden");
    this.resultMsg = "";
    this.lastFlash = null;
    this.matrixPhase = "idle";
    this.matrixProgress = 0;
    this.matrixTimer = 0;
    const equips = this.game.inv.getAllEquipmentInstances();
    if (!this.selectedUid && equips.length > 0) {
      this.selectedUid = equips[0].item.uid;
    }
    this.render();
    this._startFxLoop();
  }

  hide() {
    this.matrixPhase = "idle";
    this.matrixProgress = 0;
    this.matrixTargetUid = null;
    this.root.classList.add("hidden");
  }

  private _burstSparks(success: boolean) {
    const cx = this.fxCanvas.width / 2;
    const cy = this.fxCanvas.height / 2 + 4;
    const primaryMod = PIXELFX_MODS[success ? "impacts/parry" : "impacts/hit-spark"];
    if (primaryMod) {
      this.activeFx.push(
        createFx(primaryMod, {
          x: cx,
          y: cy,
          palette: success ? PAL.gold : PAL.blood,
          seed: (Math.random() * 9999) | 0,
        })
      );
    }
    if (success && PIXELFX_MODS["pickups/collect-burst"]) {
      this.activeFx.push(
        createFx(PIXELFX_MODS["pickups/collect-burst"], {
          x: cx,
          y: cy,
          palette: PAL.cyber,
          seed: (Math.random() * 9999) | 0,
        })
      );
    }
    if (success && PIXELFX_MODS["holy/holy-pillar"]) {
      this.activeFx.push(
        createFx(PIXELFX_MODS["holy/holy-pillar"], {
          x: cx,
          y: cy + 16,
          palette: PAL.gold,
          seed: (Math.random() * 9999) | 0,
        })
      );
    }
    if (!success && PIXELFX_MODS["explosions/small-explosion"]) {
      this.activeFx.push(
        createFx(PIXELFX_MODS["explosions/small-explosion"], {
          x: cx,
          y: cy,
          palette: PAL.blood,
          seed: (Math.random() * 9999) | 0,
        })
      );
    }
  }

  private _formatStatDelta(before?: NormalizedEquipStats, after?: NormalizedEquipStats): string {
    if (!before || !after) return "";
    const parts: string[] = [];
    if (after.atk !== before.atk) parts.push(`ATK ${before.atk}→${after.atk}`);
    if (after.def !== before.def) parts.push(`DEF ${before.def}→${after.def}`);
    if (after.maxHp !== before.maxHp) parts.push(`HP ${before.maxHp}→${after.maxHp}`);
    if (after.crit !== before.crit) parts.push(`CRIT ${before.crit}%→${after.crit}%`);
    if (after.spd !== before.spd) parts.push(`SPD ${before.spd}→${after.spd}`);
    if (after.elementBonus !== before.elementBonus) {
      parts.push(`ELEM ${before.elementBonus}%→${after.elementBonus}%`);
    }
    return parts.join(" · ");
  }

  private _resolveChanneling() {
    const uid = this.matrixTargetUid;
    this.matrixTargetUid = null;
    if (!uid) {
      this.matrixPhase = "idle";
      this.render();
      return;
    }

    const res = this.game.forge.enhanceItem(
      uid,
      this.game.inv,
      this.game.quests,
      this.matrixUseCatalyst
    );
    this.resultMsg = res.message;
    this.resultOk = res.succeeded;

    if (res.ok) {
      const def = res.item ? ITEMS[res.item.defId] : undefined;
      this.lastFlash = {
        ok: res.succeeded,
        label: def
          ? `${def.name} ${res.item!.enhanceLevel > 0 ? `+${res.item!.enhanceLevel}` : ""}`
          : "Trang bị",
        deltaText: this._formatStatDelta(res.beforeStats, res.afterStats),
        bonusText: res.rolledBonusText,
      };
      this.matrixPhase = res.succeeded ? "success" : "fail";
      this.matrixTimer = 1.65;
      this._burstSparks(res.succeeded);
      if (res.succeeded) {
        sfx.playForgeSuccess();
        this.game.recalcPlayerStats(true);
        this.game.refreshHud();
        this.game.saveGame(false);
      } else {
        sfx.playMatrixShatter();
        this.game.refreshHud();
      }
    } else {
      this.matrixPhase = "idle";
      sfx.playForgeFail();
    }
    this.render();
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

      if (this.matrixPhase === "channeling") {
        this.matrixRot += dt * 3.4;
        this.matrixProgress = Math.min(1, this.matrixProgress + dt / CHANNEL_DURATION);
        if (Math.random() < 0.45 && PIXELFX_MODS["lightning/zap-hit"]) {
          const ang = Math.random() * Math.PI * 2;
          const r = (1 - this.matrixProgress) * 58 + 10;
          this.activeFx.push(
            createFx(PIXELFX_MODS["lightning/zap-hit"], {
              x: this.fxCanvas.width / 2 + Math.cos(ang) * r,
              y: this.fxCanvas.height / 2 + Math.sin(ang) * r,
              palette: PAL.cyber,
              seed: (Math.random() * 9999) | 0,
            })
          );
        }
        this._updateMatrixLegend();
        if (this.matrixProgress >= 1) {
          this._resolveChanneling();
        }
      } else {
        this.matrixRot += dt * 0.72;
        if (this.matrixTimer > 0) {
          this.matrixTimer = Math.max(0, this.matrixTimer - dt);
          if (this.matrixTimer <= 0 && this.matrixPhase !== "idle") {
            this.matrixPhase = "idle";
            this._updateMatrixLegend();
          }
        }
      }

      this._drawMatrixCanvas(dt);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private _drawMatrixCanvas(dt: number) {
    const ctx = this.fxCtx;
    const w = this.fxCanvas.width;
    const h = this.fxCanvas.height;
    const cx = Math.floor(w / 2);
    const cy = Math.floor(h / 2) + 4;

    ctx.fillStyle = "#0e0b19";
    ctx.fillRect(0, 0, w, h);

    // Subtle anvil pedestal beneath matrix core
    ctx.fillStyle = "#22263a";
    ctx.fillRect(cx - 26, h - 16, 52, 7);
    ctx.fillStyle = "#485275";
    ctx.fillRect(cx - 18, h - 22, 36, 7);
    ctx.fillStyle = "#7a8bb8";
    ctx.fillRect(cx - 15, h - 22, 30, 2);

    const sel = this.selectedUid ? this.game.inv.findByUid(this.selectedUid)?.item : undefined;
    const selDef = sel ? ITEMS[sel.defId] : undefined;
    const tierCol = selDef ? RARITY_INFO[selDef.rarity].color : "#5ef2ff";

    let primaryCol = "#6b56c9";
    let glowCol = "#5ef2ff";
    if (this.matrixPhase === "channeling") {
      primaryCol = "#5ef2ff";
      glowCol = "#ffe066";
    } else if (this.matrixPhase === "success") {
      primaryCol = "#ffe066";
      glowCol = "#44ee88";
    } else if (this.matrixPhase === "fail") {
      primaryCol = "#ff4466";
      glowCol = "#ff8855";
    }

    // Outer rune circle
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = primaryCol;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = this.matrixPhase === "channeling" ? 0.92 : 0.52;
    ctx.beginPath();
    ctx.arc(0, 0, 56, 0, Math.PI * 2);
    ctx.stroke();

    // Inner counter-rotating ring + hexagram rune triangles
    ctx.rotate(this.matrixRot);
    ctx.strokeStyle = glowCol;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 39, 0, Math.PI * 2);
    ctx.stroke();

    for (let tri = 0; tri < 2; tri++) {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3 + tri * Math.PI;
        const px = Math.cos(a) * 52;
        const py = Math.sin(a) * 52;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Channeling shockwave ring
    if (this.matrixPhase === "channeling") {
      const pulseR = 54 * (1 - this.matrixProgress);
      ctx.strokeStyle = "#ffe066";
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(4, pulseR), 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.matrixPhase === "success" || this.matrixPhase === "fail") {
      const waveT = 1 - Math.max(0, this.matrixTimer / 1.65);
      ctx.strokeStyle = this.matrixPhase === "success" ? "#ffe066" : "#ff4466";
      ctx.globalAlpha = Math.max(0, 1 - waveT);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 12 + waveT * 64, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 4 Satellite Material Nodes + Apex Catalyst Prism Node
    const satNodes = [
      { x: cx - 64, y: cy - 36 },
      { x: cx + 64, y: cy - 36 },
      { x: cx - 64, y: cy + 36 },
      { x: cx + 64, y: cy + 36 },
    ];
    for (const node of satNodes) {
      if (this.matrixPhase === "channeling") {
        ctx.strokeStyle = "#5ef2ff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(
          node.x + (cx - node.x) * this.matrixProgress,
          node.y + (cy - node.y) * this.matrixProgress
        );
        ctx.stroke();
      }
      ctx.fillStyle = this.matrixPhase === "fail" ? "#5c2030" : "#1c2848";
      ctx.fillRect(node.x - 6, node.y - 6, 12, 12);
      ctx.strokeStyle = sel ? glowCol : "#4a5378";
      ctx.strokeRect(node.x - 6, node.y - 6, 12, 12);
    }

    // Apex Catalyst Prism Node
    const catX = cx;
    const catY = cy - 66;
    if (this.useCatalyst && this.matrixPhase === "channeling") {
      ctx.strokeStyle = "#ffe066";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(catX, catY);
      ctx.lineTo(catX, catY + (cy - catY) * this.matrixProgress);
      ctx.stroke();
    }
    ctx.fillStyle = this.useCatalyst ? "#244f66" : "#181a2c";
    ctx.fillRect(catX - 7, catY - 7, 14, 14);
    ctx.strokeStyle = this.useCatalyst ? "#5ef2ff" : "#444c6e";
    ctx.strokeRect(catX - 7, catY - 7, 14, 14);

    // Center Altar Core Orb (colored by selected gear rarity & enhance glow)
    const corePulse =
      this.matrixPhase === "channeling" ? 12 + this.matrixProgress * 5 : 10 + Math.sin(this.matrixRot * 2) * 1.2;
    ctx.fillStyle = tierCol;
    ctx.globalAlpha = this.matrixPhase === "fail" ? 0.35 : 0.85;
    ctx.beginPath();
    ctx.arc(cx, cy, corePulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 8, cy - 8, 16, 16);

    // Idle embers
    if (Math.random() < (this.matrixPhase === "channeling" ? 0.65 : 0.16)) {
      ctx.fillStyle = this.matrixPhase === "fail" ? "#ff4466" : "#ff9933";
      ctx.fillRect(
        Math.round(cx + (Math.random() - 0.5) * 38),
        h - 24 - Math.round(Math.random() * 14),
        2,
        2
      );
    }

    // Composite pixelfx particle layer
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
  }

  private _updateMatrixLegend() {
    const sel = this.selectedUid ? this.game.inv.findByUid(this.selectedUid)?.item : undefined;
    const def = sel ? ITEMS[sel.defId] : undefined;
    const pity = sel?.pityBonus ?? 0;

    let stateLine = `<span style="color:#9ba4bf">Trạng thái: <b>Tĩnh lặng — Chọn vật phẩm để tụ linh</b></span>`;
    if (this.matrixPhase === "channeling") {
      const pct = Math.round(this.matrixProgress * 100);
      stateLine = `<span style="color:#5ef2ff">⏳ Đang tụ linh trận pháp... <b>${pct}%</b></span>`;
    } else if (this.lastFlash) {
      stateLine = this.lastFlash.ok
        ? `<span style="color:#44ee88">✦ THÀNH CÔNG: ${this.lastFlash.label}</span>`
        : `<span style="color:#ff7788">✖ PHẢN PHỆ: Bảo toàn trang bị!</span>`;
    }

    const deltaLine =
      this.lastFlash && this.lastFlash.deltaText
        ? `<div style="color:#ffe066;font-size:10px">${this.lastFlash.deltaText}</div>`
        : "";
    const bonusLine =
      this.lastFlash && this.lastFlash.bonusText
        ? `<div style="color:#5ef2ff;font-size:10px">${this.lastFlash.bonusText}</div>`
        : "";

    this.legendEl.innerHTML = `
      <div>${stateLine}</div>
      ${def ? `<div style="color:${RARITY_INFO[def.rarity].color}">Lõi Trận: <b>${def.name} +${sel!.enhanceLevel}</b></div>` : ""}
      <div style="color:#ffe066">Bảo Hiểm Pity: <b>+${pity}%</b> · Xúc Tác: ${this.useCatalyst ? `<b style="color:#5ef2ff">BẬT (+${CATALYST_BONUS_PCT}%)</b>` : "Tắt"}</div>
      ${deltaLine}
      ${bonusLine}
    `;
  }

  render() {
    document.getElementById("forge-gold-val")!.textContent = `${this.game.inv.gold} G`;
    document.getElementById("forge-tab-enhance")!.classList.toggle("active", this.tab === "enhance");
    document.getElementById("forge-tab-craft")!.classList.toggle("active", this.tab === "craft");

    const banner = this.resultMsg
      ? `<div class="forge-msg ${this.resultOk ? "ok" : "fail"}">${this.resultMsg}</div>`
      : "";

    if (this.tab === "enhance") {
      this._renderEnhance(banner);
    } else {
      this._renderCraft(banner);
    }
    this._updateMatrixLegend();
  }

  private _renderEnhance(banner: string) {
    const classId = this.game.player.classId;
    const equips = this.game.inv.getAllEquipmentInstances();
    if (!equips.some((e) => e.item.uid === this.selectedUid)) {
      this.selectedUid = equips[0]?.item.uid ?? null;
    }
    const busy = this.matrixPhase === "channeling";

    const listHtml = equips.length
      ? equips
          .map(({ item, equipped }) => {
            const def = ITEMS[item.defId];
            const col = RARITY_INFO[def.rarity].color;
            const tInfo = getTierBadge(def);
            const sel = item.uid === this.selectedUid ? "selected" : "";
            const infBadge =
              item.enhanceLevel >= 5 && item.infusedElement
                ? `<span style="color:${ELEMENT_DISPLAY[item.infusedElement].color};font-size:10px">[${ELEMENT_DISPLAY[item.infusedElement].label}]</span>`
                : "";
            const classWarn = !canClassEquip(def, classId)
              ? `<span class="class-req-bad">Khác Hệ</span>`
              : "";
            return `
              <div class="forge-list-item rarity-${def.rarity} ${sel}" data-pick="${item.uid}" data-review-uid="${item.uid}" style="border-color:${col}">
                <canvas class="px-item-icon" width="32" height="32" data-icon-def="${def.id}" data-icon-enh="${item.enhanceLevel}"></canvas>
                <span class="tier-pill" style="color:${tInfo.color};background:${tInfo.bg}">${tInfo.badge}</span>
                <span style="color:${col};flex:1">${def.name} ${item.enhanceLevel > 0 ? `+${item.enhanceLevel}` : ""} ${infBadge} ${classWarn}</span>
                ${equipped ? `<span class="eq-badge">ĐANG MẶC</span>` : ""}
              </div>
            `;
          })
          .join("")
      : `<div class="detail-empty">Chưa có trang bị để luyện! Nhặt từ Quái/Rương hoặc sang tab Chế Tạo.</div>`;

    let rightHtml = `<div class="detail-empty">Chọn một món trang bị để đưa vào Ma Trận Luyện Khí.</div>`;
    if (this.selectedUid) {
      const found = this.game.inv.findByUid(this.selectedUid);
      if (found) {
        const item = found.item;
        const def = ITEMS[item.defId];
        const curSt = getItemEffectiveStats(item);
        const nextSt = getItemEffectiveStats({
          ...item,
          enhanceLevel: Math.min(10, item.enhanceLevel + 1),
        });
        const info = this.game.forge.getEnhanceInfo(item, this.game.inv, this.useCatalyst);
        const milestones = getItemMilestoneSummary(item)
          .map((m) => `<div style="font-size:11px;color:${m.startsWith("★") ? "#ffe066" : "#8b95b5"}">${m}</div>`)
          .join("");

        const matHtml = info.materials
          .map((m) => {
            const have = this.game.inv.countItem(m.defId);
            const ok = have >= m.qty;
            return `<div class="mat-row ${ok ? "ok" : "miss"}" data-review-def="${m.defId}">${ITEMS[m.defId]?.name}: ${have}/${m.qty}</div>`;
          })
          .join("");

        const shardHave = this.game.inv.countItem("mat_prism_shard");
        const catalystRow =
          item.enhanceLevel >= 3 && item.enhanceLevel < 10
            ? `
              <label style="display:flex;align-items:center;gap:6px;margin:6px 0;font-size:12px;color:#5ef2ff;cursor:pointer">
                <input type="checkbox" id="chk-forge-catalyst" ${this.useCatalyst ? "checked" : ""} ${(shardHave < CATALYST_SHARD_COST && !this.useCatalyst) || busy ? "disabled" : ""} />
                <span>Dùng Xúc Tác ${CATALYST_SHARD_COST} Mảnh Lăng Kính (+${CATALYST_BONUS_PCT}% tỉ lệ · Đang có: ${shardHave})</span>
              </label>
            `
            : "";

        const bs = item.bonusStats;
        const bsParts: string[] = [];
        if (bs?.atk) bsParts.push(`+${bs.atk} ATK`);
        if (bs?.mag) bsParts.push(`+${bs.mag} MAG`);
        if (bs?.def) bsParts.push(`+${bs.def} DEF`);
        if (bs?.maxHp) bsParts.push(`+${bs.maxHp} HP`);
        if (bs?.spd) bsParts.push(`+${bs.spd} SPD`);
        if (bs?.crit) bsParts.push(`+${bs.crit}% CRIT`);
        if (bs?.aspdPct) bsParts.push(`+${bs.aspdPct}% ASPD`);
        if (bs?.critDmgPct) bsParts.push(`+${bs.critDmgPct}% CRIT DMG`);
        const fateDieCount = this.game.inv.countItem("cs_fate_die");
        const fateRow = `
          <div style="margin-top:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <button class="px-btn sm ${fateDieCount > 0 && !busy ? "primary" : "disabled"}" id="btn-fate-reroll" ${fateDieCount <= 0 || busy ? "disabled" : ""} data-review-def="cs_fate_die">
              🎲 ĐỔI MỆNH (Xúc Xắc: ${fateDieCount})
            </button>
            <span style="font-size:11px;color:#cbd5e1">Tung Xúc Xắc Đổi Mệnh để reroll chỉ số phụ!</span>
          </div>
        `;
        const bonusBox = bsParts.length
          ? `<div class="bonus-sub-box">✦ Dòng phụ Ma Trận đã thức tỉnh: <b>${bsParts.join(" · ")}</b>${fateRow}</div>`
          : `<div class="bonus-sub-box" style="color:#9ba4bf;border-color:#353954;background:#100f1e">✧ Luyện +1 thành công sẽ ngẫu nhiên thức tỉnh 1 dòng phụ (hoặc dùng Xúc Xắc Đổi Mệnh)!${fateRow}</div>`;

        let infuseHtml = "";
        if (item.enhanceLevel >= 5) {
          const curInf = item.infusedElement
            ? `<b style="color:${ELEMENT_DISPLAY[item.infusedElement].color}">${ELEMENT_DISPLAY[item.infusedElement].label} (${ELEMENT_DISPLAY[item.infusedElement].bonusHint})</b>`
            : `<span style="color:#9ba4bf">Chưa khảm</span>`;
          const btns = INFUSABLE_ELEMENTS.map((el) => {
            const meta = ELEMENT_DISPLAY[el];
            const havePigment = this.game.inv.countItem(meta.pigmentId);
            const canInf = havePigment >= 1 && this.game.inv.gold >= INFUSE_GOLD_COST && !busy;
            return `
              <button class="px-btn sm ${canInf ? "" : "disabled"}" data-infuse="${el}" data-review-def="${meta.pigmentId}" title="${meta.bonusHint}" style="border-color:${meta.color};color:${meta.color}">
                ${meta.label} (${havePigment}/1)
              </button>
            `;
          }).join("");
          infuseHtml = `
            <div style="margin-top:8px;padding:7px;background:#100e1c;border:1px solid #4a5275">
              <div style="font-size:12px;font-weight:700;color:#5ef2ff;margin-bottom:3px">
                ★ KHE NHUỘM 8 SẮC TỐ [+5] · Hiện tại: ${curInf}
              </div>
              <div style="font-size:10px;color:#9ba4bf;margin-bottom:5px">
                Phí khảm/đổi hệ: ${INFUSE_GOLD_COST}G + 1 Bột Sắc Tố (Đạt +10 tự thức tỉnh thêm Hệ Lăng Kính!)
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:5px">${btns}</div>
            </div>
          `;
        } else {
          infuseHtml = `
            <div style="margin-top:8px;padding:6px;background:#100e1c;border:1px dashed #353954;font-size:11px;color:#8b95b5">
              🔒 Đạt cấp <b>+5</b> để mở khóa <b>Khe Nhuộm 8 Bột Sắc Tố Nguyên Tố</b>!
            </div>
          `;
        }

        const classReqLine =
          def.requiredClass && def.requiredClass !== "all"
            ? `<span class="${canClassEquip(def, classId) ? "class-req-ok" : "class-req-bad"}">Hệ: ${CLASS_DISPLAY_NAMES[def.requiredClass]}</span>`
            : `<span class="class-req-ok">Đa hệ</span>`;

        rightHtml = `
          <div class="forge-detail">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span style="color:${RARITY_INFO[def.rarity].color};font-size:15px;font-weight:700">
                ${def.name} (+${item.enhanceLevel} → +${info.nextLevel})
              </span>
              ${classReqLine}
            </div>
            <div class="forge-sub">
              ${def.slot ? SLOT_LABELS[def.slot] : ""} · Tỉ lệ: <b style="color:#44ee88">${info.successRate}%</b>
              ${info.pityBonus > 0 ? `<span style="color:#ffe066">(+Pity ${info.pityBonus}%)</span>` : ""}
              · An toàn không mất đồ!
            </div>
            ${def.passiveDesc ? `<div style="font-size:11px;color:#ff9922;margin:3px 0">${def.passiveDesc}</div>` : ""}
            ${bonusBox}
            <div class="forge-stat-preview">
              ${curSt.atk || nextSt.atk ? `<div>ATK: ${curSt.atk} → <b style="color:#44ee88">${nextSt.atk}</b></div>` : ""}
              ${curSt.def || nextSt.def ? `<div>DEF: ${curSt.def} → <b style="color:#44ee88">${nextSt.def}</b></div>` : ""}
              ${curSt.maxHp || nextSt.maxHp ? `<div>HP: ${curSt.maxHp} → <b style="color:#44ee88">${nextSt.maxHp}</b></div>` : ""}
              ${curSt.crit || nextSt.crit ? `<div>CRIT: ${curSt.crit}% → <b style="color:#44ee88">${nextSt.crit}%</b></div>` : ""}
              ${curSt.spd || nextSt.spd ? `<div>SPD: ${curSt.spd} → <b style="color:#44ee88">${nextSt.spd}</b></div>` : ""}
              ${curSt.elementBonus || nextSt.elementBonus ? `<div>ELEM: ${curSt.elementBonus}% → <b style="color:#44ee88">${nextSt.elementBonus}%</b></div>` : ""}
              ${curSt.maxStamina || nextSt.maxStamina ? `<div>STAM: +${curSt.maxStamina} → <b style="color:#44ee88">+${nextSt.maxStamina}</b></div>` : ""}
              ${curSt.poiseBreakPct || nextSt.poiseBreakPct ? `<div>PHÁ GIÁP: +${curSt.poiseBreakPct}% → <b style="color:#44ee88">+${nextSt.poiseBreakPct}%</b></div>` : ""}
              ${curSt.skillCdPct || nextSt.skillCdPct ? `<div>CD [E]: -${curSt.skillCdPct}% → <b style="color:#44ee88">-${nextSt.skillCdPct}%</b></div>` : ""}
            </div>
            <div style="margin:5px 0;padding:5px 7px;background:#100e1c;border:1px solid #2d324d">
              ${milestones}
            </div>
            <div class="forge-mats">
              <div class="mat-row ${this.game.inv.gold >= info.goldCost ? "ok" : "miss"}">Vàng: ${this.game.inv.gold}/${info.goldCost} G</div>
              ${matHtml}
            </div>
            ${catalystRow}
            <button class="px-btn ${info.canEnhance && !busy ? "primary" : "disabled"}" id="btn-do-enhance">
              ${busy ? "⏳ ĐANG VẬN CHUYỂN LINH TRẬN..." : `✡ KÍCH HOẠT MA TRẬN LUYỆN (+${info.nextLevel})`}
            </button>
            ${info.reason ? `<div class="forge-reason">${info.reason}</div>` : ""}
            ${infuseHtml}
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
    this._paintIcons();

    this.contentEl.querySelectorAll("[data-pick]").forEach((el) => {
      el.addEventListener("click", () => {
        if (this.matrixPhase === "channeling") return;
        sfx.playUiClick();
        this.selectedUid = (el as HTMLElement).dataset.pick ?? null;
        this.resultMsg = "";
        this.lastFlash = null;
        this.render();
      });
    });

    this.contentEl.querySelector("#chk-forge-catalyst")?.addEventListener("change", (ev) => {
      if (this.matrixPhase === "channeling") return;
      sfx.playUiClick();
      this.useCatalyst = (ev.currentTarget as HTMLInputElement).checked;
      this.render();
    });

    this.contentEl.querySelector("#btn-do-enhance")?.addEventListener("click", () => {
      if (!this.selectedUid || this.matrixPhase === "channeling") return;
      const found = this.game.inv.findByUid(this.selectedUid);
      if (!found) return;
      const info = this.game.forge.getEnhanceInfo(found.item, this.game.inv, this.useCatalyst);
      if (!info.canEnhance) {
        this.resultMsg = info.reason ?? "Không đủ nguyên liệu hoặc vàng để kích hoạt trận pháp.";
        this.resultOk = false;
        sfx.playForgeFail();
        this.render();
        return;
      }

      this.resultMsg = "";
      this.matrixTargetUid = this.selectedUid;
      this.matrixUseCatalyst = this.useCatalyst;
      this.matrixProgress = 0;
      this.matrixPhase = "channeling";
      sfx.playMatrixChannel();
      this.render();
    });

    this.contentEl.querySelector("#btn-fate-reroll")?.addEventListener("click", () => {
      if (!this.selectedUid || this.matrixPhase === "channeling") return;
      const res = this.game.forge.rerollSubstatsWithFateDie(this.selectedUid, this.game.inv);
      this.resultMsg = res.message;
      this.resultOk = res.succeeded;
      if (res.succeeded) {
        this.matrixPhase = "success";
        this.matrixTimer = 1.4;
        this._burstSparks(true);
        sfx.playForgeSuccess();
        this.game.recalcPlayerStats(true);
        this.game.refreshHud();
        this.game.saveGame(false);
      } else {
        sfx.playForgeFail();
      }
      this.render();
    });

    this.contentEl.querySelectorAll("[data-infuse]").forEach((el) => {
      el.addEventListener("click", () => {
        if (!this.selectedUid || this.matrixPhase === "channeling") return;
        const elem = (el as HTMLElement).dataset.infuse as InfusableElement;
        const res = this.game.forge.infuseElement(
          this.selectedUid,
          elem,
          this.game.inv,
          this.game.quests
        );
        this.resultMsg = res.message;
        this.resultOk = res.succeeded;
        if (res.succeeded) {
          this.matrixPhase = "success";
          this.matrixTimer = 1.4;
          this._burstSparks(true);
          sfx.playForgeSuccess();
          this.game.recalcPlayerStats(true);
          this.game.refreshHud();
          this.game.saveGame(false);
        } else {
          sfx.playForgeFail();
        }
        this.render();
      });
    });
  }

  private _renderCraft(banner: string) {
    const classId = this.game.player.classId;
    const hiddenRecipes = FORGE_RECIPES.filter((r) => r.isHiddenRecipe || r.isHidden);
    const visibleHiddenRecipes = hiddenRecipes.filter(
      (r) => !r.isHidden || this.game.canRevealHiddenRecipe(r)
    );
    const unlockedHiddenCount = hiddenRecipes.filter((r) =>
      this.game.canRevealHiddenRecipe(r) || this.game.isHiddenItemUnlocked(r.resultDefId)
    ).length;

    const visibleAllRecipes = FORGE_RECIPES.filter(
      (r) => !r.isHidden || this.game.canRevealHiddenRecipe(r)
    );

    const filtered =
      this.craftFilter === "hidden"
        ? visibleHiddenRecipes
        : this.craftFilter === "class"
          ? visibleAllRecipes.filter((r) => canClassEquip(ITEMS[r.resultDefId], classId))
          : visibleAllRecipes;

    const filterBar = `
      <div class="craft-filter-bar">
        <button id="btn-craft-class" class="px-btn sm ${this.craftFilter === "class" ? "primary" : ""}">
          Lọc: ${CLASS_DISPLAY_NAMES[classId]}
        </button>
        <button id="btn-craft-all" class="px-btn sm ${this.craftFilter === "all" ? "primary" : ""}">
          Tất cả (${visibleAllRecipes.length})
        </button>
        <button id="btn-craft-hidden" class="px-btn sm ${this.craftFilter === "hidden" ? "primary" : ""}" style="border-color:#ff9922;color:#ffe066">
          ✦ Bản Vẽ Ẩn (${unlockedHiddenCount}/${hiddenRecipes.length})
        </button>
      </div>
    `;

    const cards = filtered
      .map((rec) => {
        const def = ITEMS[rec.resultDefId];
        if (!def) return "";

        // Strict secrecy for `isHidden: true`: never shown before unlock
        if (rec.isHidden && !this.game.canRevealHiddenRecipe(rec)) {
          return "";
        }

        // Mask unrevealed legacy secret blueprints so names, stats & materials stay hidden!
        if (rec.isHiddenRecipe && !this.game.canRevealHiddenRecipe(rec)) {
          const reqLv = rec.requiredLevel ?? 1;
          const lvOk = this.game.player.level >= reqLv;
          return `
            <div class="craft-card" style="border-color:#5a4d78;background:#120f1e">
              <div class="craft-head">
                <div style="width:32px;height:32px;border:2px dashed #7a65a8;display:flex;align-items:center;justify-content:center;color:#ffe066;font-weight:700;font-size:15px">?</div>
                <span class="tier-pill" style="color:#ff9922;background:#301b3d">BÍ MẬT</span>
                <b style="color:#c2a8ff">??? — Bản Thiết Kế Bí Ẩn</b>
              </div>
              <div class="craft-desc" style="color:#b8b0cc">${rec.unlockHint ?? "Thu thập nguyên liệu cổ từ Boss để giải mã bản vẽ."}</div>
              <div class="craft-mats">
                <span class="craft-mat ${lvOk ? "ok" : "miss"}">Yêu cầu LV.${reqLv}</span>
                <span class="craft-mat miss">Nguyên liệu: ???</span>
              </div>
              <button class="px-btn disabled" disabled>🔒 CHƯA GIẢI MÃ</button>
            </div>
          `;
        }

        const rInfo = RARITY_INFO[def.rarity];
        const tInfo = getTierBadge(def);
        const isUnlocked = this.game.canRevealHiddenRecipe(rec);
        const check = this.game.forge.canCraft(rec, this.game.inv, this.game.player.level, isUnlocked);
        const usable = canClassEquip(def, classId);
        const clsTag =
          def.requiredClass && def.requiredClass !== "all"
            ? `<span class="${usable ? "class-req-ok" : "class-req-bad"}">${CLASS_DISPLAY_NAMES[def.requiredClass]}</span>`
            : `<span class="class-req-ok">Mọi Hệ</span>`;
        const hiddenTag = rec.isHiddenRecipe
          ? `<span class="tier-pill" style="color:#ffe066;background:#402454">✦ ẨN</span>`
          : "";
        const lvTag = rec.requiredLevel
          ? `<span class="craft-mat ${this.game.player.level >= rec.requiredLevel ? "ok" : "miss"}">LV.${rec.requiredLevel}</span>`
          : "";

        const mats = rec.materials
          .map((m) => {
            const have = this.game.inv.countItem(m.defId);
            return `<span class="craft-mat ${have >= m.qty ? "ok" : "miss"}" data-review-def="${m.defId}">${ITEMS[m.defId]?.name} ${have}/${m.qty}</span>`;
          })
          .join("");

        return `
          <div class="craft-card rarity-${def.rarity}" data-review-def="${def.id}" style="border-color:${rInfo.color}">
            <div class="craft-head">
              <canvas class="px-item-icon" width="32" height="32" data-icon-def="${def.id}" data-icon-enh="0"></canvas>
              <span class="tier-pill" style="color:${tInfo.color};background:${tInfo.bg}">${tInfo.badge}</span>
              ${hiddenTag}
              <b style="color:${rInfo.color}">${def.name}</b>
              <span class="craft-rarity" style="color:${rInfo.color}">[${rInfo.label}]</span>
              ${clsTag}
            </div>
            <div class="craft-desc">${rec.desc}</div>
            ${def.passiveDesc ? `<div style="font-size:11px;color:#ff9922;margin-bottom:4px">${def.passiveDesc}</div>` : ""}
            <div class="craft-mats">
              ${lvTag}
              <span class="craft-mat ${this.game.inv.gold >= rec.goldCost ? "ok" : "miss"}">${rec.goldCost}G</span>
              ${mats}
            </div>
            <button class="px-btn ${check.ok ? "good" : "disabled"}" data-craft="${rec.id}">
              ⚒ CHẾ TẠO
            </button>
          </div>
        `;
      })
      .join("");

    this.contentEl.innerHTML = `${banner}${filterBar}<div class="craft-grid">${cards}</div>`;
    this._paintIcons();

    this.contentEl.querySelector("#btn-craft-class")?.addEventListener("click", () => {
      sfx.playUiClick();
      this.craftFilter = "class";
      this.render();
    });

    this.contentEl.querySelector("#btn-craft-all")?.addEventListener("click", () => {
      sfx.playUiClick();
      this.craftFilter = "all";
      this.render();
    });

    this.contentEl.querySelector("#btn-craft-hidden")?.addEventListener("click", () => {
      sfx.playUiClick();
      this.craftFilter = "hidden";
      this.render();
    });

    this.contentEl.querySelectorAll("[data-craft]").forEach((el) => {
      el.addEventListener("click", () => {
        const recId = (el as HTMLElement).dataset.craft!;
        const targetRec = FORGE_RECIPES.find((r) => r.id === recId);
        const isUnlocked = targetRec ? this.game.canRevealHiddenRecipe(targetRec) : false;
        const res = this.game.forge.craftRecipe(recId, this.game.inv, this.game.player.level, isUnlocked);
        this.resultMsg = res.message;
        this.resultOk = res.succeeded;
        if (res.succeeded) {
          const rec = FORGE_RECIPES.find((r) => r.id === recId);
          if (rec && ITEMS[rec.resultDefId]?.isHidden) {
            this.game.unlockHiddenItem(rec.resultDefId);
          }
          this.matrixPhase = "success";
          this.matrixTimer = 1.4;
          this._burstSparks(true);
          sfx.playForgeSuccess();
          this.game.refreshHud();
          this.game.saveGame(false);
        } else {
          sfx.playForgeFail();
        }
        this.render();
      });
    });
  }

  private _paintIcons() {
    uiRarityFx.syncContainer(this.contentEl);
  }
}
