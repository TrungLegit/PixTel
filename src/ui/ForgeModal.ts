import { ITEMS, RARITY_INFO, SLOT_LABELS, getItemEffectiveStats, getTierBadge } from "../data/items";
import { FORGE_RECIPES } from "../data/recipes";
import { onCodixelReady } from "../graphics/codixelAtlas";
import { uiRarityFx } from "../vfx/uiRarityFx";
import { createFrame, clearFrame, createFx, PAL } from "../vfx/pixelfx/core/index.js";
import { PIXELFX_MODS } from "../vfx/vfxManager";
import type { PixelfxFrame, PixelfxInstance } from "../vfx/pixelfxTypes";
import type { PixTelOpenWorldGame } from "../game";
import { sfx } from "../audio/chiptuneSynth";

/**
 * Blacksmith Prism Forge Modal:
 * - Tab 1: Enhance equipped/bag equipment (+0 -> +10, safe fail)
 * - Tab 2: Craft Rare / Epic / Legendary equipment
 * - Live pixelfx Forge Sparks canvas bursting real pixel sparks on every forge!
 */
export class ForgeModalUI {
  private game: PixTelOpenWorldGame;
  private root: HTMLElement;
  private contentEl: HTMLElement;
  private tab: "enhance" | "craft" = "enhance";
  private selectedUid: string | null = null;
  private resultMsg = "";
  private resultOk = true;

  // Live pixelfx Forge Sparks Canvas
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
      sfx.playUiClick();
      this.tab = "enhance";
      this.render();
    });

    document.getElementById("forge-tab-craft")!.addEventListener("click", () => {
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
    const equips = this.game.inv.getAllEquipmentInstances();
    if (!this.selectedUid && equips.length > 0) {
      this.selectedUid = equips[0].item.uid;
    }
    this.render();
    this._startFxLoop();
  }

  hide() {
    this.root.classList.add("hidden");
  }

  private _burstSparks(success: boolean) {
    const mod = PIXELFX_MODS[success ? "impacts/parry" : "impacts/hit-spark"];
    if (mod) {
      this.activeFx.push(
        createFx(mod, {
          x: this.fxCanvas.width / 2,
          y: this.fxCanvas.height / 2 + 8,
          palette: success ? PAL.gold : PAL.blood,
          seed: (Math.random() * 9999) | 0,
        })
      );
    }
    if (success && PIXELFX_MODS["pickups/collect-burst"]) {
      this.activeFx.push(
        createFx(PIXELFX_MODS["pickups/collect-burst"], {
          x: this.fxCanvas.width / 2,
          y: this.fxCanvas.height / 2 + 4,
          palette: PAL.cyber,
          seed: (Math.random() * 9999) | 0,
        })
      );
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

      const ctx = this.fxCtx;
      const w = this.fxCanvas.width;
      const h = this.fxCanvas.height;
      ctx.fillStyle = "#120f1e";
      ctx.fillRect(0, 0, w, h);

      // Pixel Anvil silhouette at center
      ctx.fillStyle = "#2b3042";
      ctx.fillRect(w / 2 - 26, h - 18, 52, 8);
      ctx.fillStyle = "#5b6582";
      ctx.fillRect(w / 2 - 18, h - 24, 36, 7);
      ctx.fillStyle = "#95a5cc";
      ctx.fillRect(w / 2 - 16, h - 24, 32, 2);

      // Idle glowing embers
      if (Math.random() < 0.14) {
        ctx.fillStyle = "#ff9933";
        ctx.fillRect(Math.round(w / 2 + (Math.random() - 0.5) * 32), h - 26 - Math.round(Math.random() * 10), 2, 2);
      }

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
      ? `<div class="forge-msg ${this.resultOk ? "ok" : "fail"}">${this.resultMsg}</div>`
      : "";

    if (this.tab === "enhance") {
      this._renderEnhance(banner);
    } else {
      this._renderCraft(banner);
    }
  }

  private _renderEnhance(banner: string) {
    const equips = this.game.inv.getAllEquipmentInstances();
    if (!equips.some((e) => e.item.uid === this.selectedUid)) {
      this.selectedUid = equips[0]?.item.uid ?? null;
    }

    const listHtml = equips
      .map(({ item, equipped }) => {
        const def = ITEMS[item.defId];
        const col = RARITY_INFO[def.rarity].color;
        const tInfo = getTierBadge(def);
        const sel = item.uid === this.selectedUid ? "selected" : "";
        return `
          <div class="forge-list-item rarity-${def.rarity} ${sel}" data-pick="${item.uid}" data-review-uid="${item.uid}" style="border-color:${col}">
            <canvas class="px-item-icon" width="32" height="32" data-icon-def="${def.id}" data-icon-enh="${item.enhanceLevel}"></canvas>
            <span class="tier-pill" style="color:${tInfo.color};background:${tInfo.bg}">${tInfo.badge}</span>
            <span style="color:${col};flex:1">${def.name} ${item.enhanceLevel > 0 ? `+${item.enhanceLevel}` : ""}</span>
            ${equipped ? `<span class="eq-badge">ĐANG MẶC</span>` : ""}
          </div>
        `;
      })
      .join("");

    let rightHtml = `<div class="detail-empty">Chọn một món trang bị để cường hóa.</div>`;
    if (this.selectedUid) {
      const found = this.game.inv.findByUid(this.selectedUid);
      if (found) {
        const item = found.item;
        const def = ITEMS[item.defId];
        const curSt = getItemEffectiveStats(item);
        const nextSt = getItemEffectiveStats({ ...item, enhanceLevel: Math.min(10, item.enhanceLevel + 1) });
        const info = this.game.forge.getEnhanceInfo(item, this.game.inv);

        const matHtml = info.materials
          .map((m) => {
            const have = this.game.inv.countItem(m.defId);
            const ok = have >= m.qty;
            return `<div class="mat-row ${ok ? "ok" : "miss"}" data-review-def="${m.defId}">${ITEMS[m.defId]?.name}: ${have}/${m.qty}</div>`;
          })
          .join("");

        rightHtml = `
          <div class="forge-detail">
            <div style="color:${RARITY_INFO[def.rarity].color};font-size:15px;font-weight:700">
              ${def.name} (+${item.enhanceLevel} → +${info.nextLevel})
            </div>
            <div class="forge-sub">${def.slot ? SLOT_LABELS[def.slot] : ""} · Tỉ lệ thành công: <b style="color:#44ee88">${info.successRate}%</b> (Thất bại không mất đồ!)</div>
            <div class="forge-stat-preview">
              ${curSt.atk || nextSt.atk ? `<div>ATK: ${curSt.atk} → <b style="color:#44ee88">${nextSt.atk}</b></div>` : ""}
              ${curSt.def || nextSt.def ? `<div>DEF: ${curSt.def} → <b style="color:#44ee88">${nextSt.def}</b></div>` : ""}
              ${curSt.maxHp || nextSt.maxHp ? `<div>HP: ${curSt.maxHp} → <b style="color:#44ee88">${nextSt.maxHp}</b></div>` : ""}
              ${curSt.crit || nextSt.crit ? `<div>CRIT: ${curSt.crit}% → <b style="color:#44ee88">${nextSt.crit}%</b></div>` : ""}
              ${curSt.spd || nextSt.spd ? `<div>SPD: ${curSt.spd} → <b style="color:#44ee88">${nextSt.spd}</b></div>` : ""}
              ${curSt.elementBonus || nextSt.elementBonus ? `<div>ELEM: ${curSt.elementBonus}% → <b style="color:#44ee88">${nextSt.elementBonus}%</b></div>` : ""}
            </div>
            <div class="forge-mats">
              <div class="mat-row ${this.game.inv.gold >= info.goldCost ? "ok" : "miss"}">Vàng: ${this.game.inv.gold}/${info.goldCost} G</div>
              ${matHtml}
            </div>
            <button class="px-btn ${info.canEnhance ? "primary" : "disabled"}" id="btn-do-enhance">
              ⚒ CƯỜNG HÓA LÊN +${info.nextLevel}
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
    this._paintIcons();

    this.contentEl.querySelectorAll("[data-pick]").forEach((el) => {
      el.addEventListener("click", () => {
        sfx.playUiClick();
        this.selectedUid = (el as HTMLElement).dataset.pick ?? null;
        this.resultMsg = "";
        this.render();
      });
    });

    this.contentEl.querySelector("#btn-do-enhance")?.addEventListener("click", () => {
      if (!this.selectedUid) return;
      const res = this.game.forge.enhanceItem(this.selectedUid, this.game.inv, this.game.quests);
      this.resultMsg = res.message;
      this.resultOk = res.succeeded;
      if (res.ok) {
        this._burstSparks(res.succeeded);
        if (res.succeeded) {
          sfx.playForgeSuccess();
          this.game.recalcPlayerStats(true);
          this.game.saveGame(false);
        } else {
          sfx.playForgeFail();
        }
      } else {
        sfx.playForgeFail();
      }
      this.render();
    });
  }

  private _renderCraft(banner: string) {
    const cards = FORGE_RECIPES.map((rec) => {
      const def = ITEMS[rec.resultDefId];
      const rInfo = RARITY_INFO[def.rarity];
      const tInfo = getTierBadge(def);
      const check = this.game.forge.canCraft(rec, this.game.inv);
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
            <b style="color:${rInfo.color}">${def.name}</b>
            <span class="craft-rarity" style="color:${rInfo.color}">[${rInfo.label}]</span>
          </div>
          <div class="craft-desc">${rec.desc}</div>
          <div class="craft-mats">
            <span class="craft-mat ${this.game.inv.gold >= rec.goldCost ? "ok" : "miss"}">${rec.goldCost}G</span>
            ${mats}
          </div>
          <button class="px-btn ${check.ok ? "good" : "disabled"}" data-craft="${rec.id}">
            ⚒ CHẾ TẠO
          </button>
        </div>
      `;
    }).join("");

    this.contentEl.innerHTML = `${banner}<div class="craft-grid">${cards}</div>`;
    this._paintIcons();

    this.contentEl.querySelectorAll("[data-craft]").forEach((el) => {
      el.addEventListener("click", () => {
        const recId = (el as HTMLElement).dataset.craft!;
        const res = this.game.forge.craftRecipe(recId, this.game.inv);
        this.resultMsg = res.message;
        this.resultOk = res.succeeded;
        if (res.succeeded) {
          this._burstSparks(true);
          sfx.playForgeSuccess();
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
