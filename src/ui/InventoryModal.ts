import { getClassDef } from "../data/classes";
import {
  ITEMS,
  RARITY_INFO,
  SLOT_LABELS,
  getDismantleShardYield,
  getItemEffectiveStats,
  getTierBadge,
} from "../data/items";
import { EQUIP_SLOTS, type EquipSlot } from "../data/types";
import { onCodixelReady } from "../graphics/codixelAtlas";
import { drawEquippedHeroPreview } from "../graphics/itemIcons";
import { uiRarityFx } from "../vfx/uiRarityFx";
import type { PixTelOpenWorldGame } from "../game";
import { sfx } from "../audio/chiptuneSynth";

/**
 * 16-Bit RPG Inventory & Character UI [I / B]:
 * - Left: 4x integer-scaled animated Character Preview wearing actual equipped gear + 5 Equipment Slots + Hero Stats
 * - Right: 32-Slot Bag Grid with procedural 16x16 pixel icons, rarity borders, +N enhance badges
 * - Live Hover & Click Comparison Tooltip (green ▲ / red ▼) + Equip/Unequip + Dismantle to Prism Shards
 */
export class InventoryModalUI {
  private game: PixTelOpenWorldGame;
  private root: HTMLElement;
  private heroCanvas: HTMLCanvasElement;
  private heroCtx: CanvasRenderingContext2D;
  private heroClassEl: HTMLElement;
  private equipEl: HTMLElement;
  private statsEl: HTMLElement;
  private bagEl: HTMLElement;
  private detailEl: HTMLElement;

  private selectedUid: string | null = null;
  private hoveredUid: string | null = null;
  private previewFacing: 1 | -1 = 1;
  private autoRotate = true;
  private animTime = 0;
  private rafId = 0;
  private lastT = 0;

  constructor(game: PixTelOpenWorldGame) {
    this.game = game;
    this.root = document.getElementById("modal-inventory")!;
    this.heroCanvas = document.getElementById("inv-hero-canvas") as HTMLCanvasElement;
    this.heroCtx = this.heroCanvas.getContext("2d")!;
    this.heroCtx.imageSmoothingEnabled = false;
    this.heroClassEl = document.getElementById("inv-hero-class")!;
    this.equipEl = document.getElementById("inv-equip-slots")!;
    this.statsEl = document.getElementById("inv-hero-stats")!;
    this.bagEl = document.getElementById("inv-bag-grid")!;
    this.detailEl = document.getElementById("inv-item-detail")!;

    onCodixelReady(() => {
      if (!this.root.classList.contains("hidden")) {
        this.render();
      }
    });

    document.getElementById("btn-close-inventory")!.addEventListener("click", () => {
      sfx.playUiClick();
      this.game.setModal(null);
    });

    document.getElementById("inv-rot-left")!.addEventListener("click", () => {
      sfx.playUiClick();
      this.autoRotate = false;
      this.previewFacing = -1;
      this._drawPreviewFrame();
    });

    document.getElementById("inv-rot-right")!.addEventListener("click", () => {
      sfx.playUiClick();
      this.autoRotate = false;
      this.previewFacing = 1;
      this._drawPreviewFrame();
    });
  }

  show() {
    this.root.classList.remove("hidden");
    this.hoveredUid = null;
    this.autoRotate = true;
    sfx.playBagOpen();
    this.render();
    this._startLoop();
  }

  hide() {
    this.root.classList.add("hidden");
  }

  private _drawPreviewFrame() {
    const p = this.game.player;
    const walkFrame = Math.floor(this.animTime * 4) % 4;
    const facing: 1 | -1 = this.autoRotate
      ? Math.floor(this.animTime / 2.2) % 2 === 0
        ? 1
        : -1
      : this.previewFacing;
    drawEquippedHeroPreview(
      this.heroCtx,
      p.classId,
      this.game.inv.equipment,
      walkFrame,
      facing,
      this.animTime,
      { aegisActive: p.aegisTime > 0 || p.shieldTime > 0, buffActive: p.atkBuffTime > 0 }
    );
  }

  private _startLoop() {
    if (this.rafId) return;
    this.lastT = performance.now();
    const tick = (now: number) => {
      if (this.root.classList.contains("hidden")) {
        this.rafId = 0;
        return;
      }
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastT) / 1000));
      this.lastT = now;
      this.animTime += dt;
      this._drawPreviewFrame();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private _playEquipSfx(slot: EquipSlot) {
    if (slot === "weapon") sfx.playEquipWeapon();
    else if (slot === "accessory") sfx.playEquipAccessory();
    else sfx.playEquipArmor();
  }

  render() {
    const p = this.game.player;
    const inv = this.game.inv;
    const cdef = getClassDef(p.classId);
    const shardsCount = inv.countItem("mat_prism_shard");

    this.heroClassEl.textContent = `LV.${p.level} · ${cdef.vnName}`;
    this._drawPreviewFrame();

    // 1. Derived Hero Stats (compact 4-col grid)
    this.statsEl.innerHTML = `
      <div class="stat-pill"><span>HP</span><b style="color:#44ee88">${Math.ceil(p.hp)}/${p.maxHp}</b></div>
      <div class="stat-pill"><span>ATK</span><b style="color:#ff8844">${p.atk}</b></div>
      <div class="stat-pill"><span>DEF</span><b style="color:#5ef2ff">${p.def}</b></div>
      <div class="stat-pill"><span>CRIT</span><b style="color:#ff66d8">${p.crit}%</b></div>
      <div class="stat-pill"><span>SPD</span><b style="color:#ffee55">${p.spd}</b></div>
      <div class="stat-pill"><span>ELEM</span><b style="color:#c266ff">+${p.elementBonus}%</b></div>
      <div class="stat-pill"><span>VÀNG</span><b style="color:#ffe066">${inv.gold}G</b></div>
      <div class="stat-pill"><span>MẢNH LK</span><b style="color:#5ef2ff">${shardsCount}</b></div>
    `;

    // 1b. Active Set Bonuses
    const setsEl = document.getElementById("inv-set-bonuses");
    if (setsEl) {
      const sets = inv.getActiveSetBonuses();
      if (sets.length === 0) {
        setsEl.innerHTML = "";
      } else {
        setsEl.innerHTML = sets
          .map(
            (s) => `
            <div class="set-pill" style="border-color:${s.def.color}">
              <b style="color:${s.def.color}">★ ${s.def.name} (${s.count}/4)</b>
              <div style="color:${s.twoActive ? "#44ee88" : "#6c738e"}">${s.def.twoPieceLabel}</div>
              <div style="color:${s.fourActive ? "#ffe066" : "#6c738e"}">${s.def.fourPieceLabel}</div>
            </div>
          `
          )
          .join("");
      }
    }

    // 2. 5 Equipment Slots (Helmet, Armor, Weapon, Boots, Accessory)
    this.equipEl.innerHTML = EQUIP_SLOTS.map((slot) => {
      const it = inv.equipment[slot];
      if (!it) {
        return `
          <div class="equip-slot empty">
            <div class="equip-slot-info">
              <div class="slot-top"><span class="slot-lbl">${SLOT_LABELS[slot]}</span></div>
              <div class="slot-none">Trống</div>
            </div>
          </div>
        `;
      }
      const def = ITEMS[it.defId];
      const col = RARITY_INFO[def.rarity].color;
      const tInfo = getTierBadge(def);
      const sel = this.selectedUid === it.uid ? "selected" : "";
      return `
        <div class="equip-slot rarity-${def.rarity} ${sel}" data-uid="${it.uid}" data-review-uid="${it.uid}" style="border-color:${col}">
          <canvas class="px-item-icon" width="32" height="32" data-icon-def="${def.id}" data-icon-enh="${it.enhanceLevel}"></canvas>
          <div class="equip-slot-info">
            <div class="slot-top">
              <span class="slot-lbl">${SLOT_LABELS[slot]}</span>
              <span class="tier-pill" style="color:${tInfo.color};background:${tInfo.bg}">${tInfo.badge}</span>
              ${it.enhanceLevel > 0 ? `<span class="enh-tag">+${it.enhanceLevel}</span>` : ""}
            </div>
            <div class="slot-name" style="color:${col}">${def.name}</div>
          </div>
        </div>
      `;
    }).join("");

    // 3. 32-Slot Bag Grid
    let bagHtml = "";
    for (let i = 0; i < 32; i++) {
      const it = inv.bag[i];
      if (!it) {
        bagHtml += `<div class="bag-cell empty"></div>`;
        continue;
      }
      const def = ITEMS[it.defId];
      const col = RARITY_INFO[def.rarity].color;
      const tInfo = getTierBadge(def);
      const sel = this.selectedUid === it.uid ? "selected" : "";
      const classMismatch =
        def.requiredClass && def.requiredClass !== "all" && def.requiredClass !== p.classId;
      bagHtml += `
        <div class="bag-cell rarity-${def.rarity} ${sel}" data-uid="${it.uid}" data-review-uid="${it.uid}" style="border-color:${col}">
          <canvas class="px-item-icon" width="32" height="32" data-icon-def="${def.id}" data-icon-enh="${it.enhanceLevel}"></canvas>
          <span class="bag-tier" style="color:${tInfo.color}">${tInfo.badge}</span>
          ${it.qty > 1 ? `<span class="bag-qty">x${it.qty}</span>` : ""}
          ${it.enhanceLevel > 0 ? `<span class="bag-enh">+${it.enhanceLevel}</span>` : ""}
          ${classMismatch ? `<span class="bag-lock" title="Khác Class">✕</span>` : ""}
        </div>
      `;
    }
    this.bagEl.innerHTML = bagHtml;

    // Paint codixel icons & attach live pixelfx high-rarity slot auras
    uiRarityFx.syncContainer(this.root);

    // Bind click selection (hover review is handled globally by vintage rope ItemReviewTooltip)
    this.root.querySelectorAll("[data-uid]").forEach((el) => {
      const uid = (el as HTMLElement).dataset.uid ?? null;
      el.addEventListener("click", () => {
        sfx.playUiClick();
        this.selectedUid = uid;
        this.render();
      });
      el.addEventListener("mouseenter", () => {
        if (!this.selectedUid && this.hoveredUid !== uid) {
          this.hoveredUid = uid;
          this._renderDetail();
        }
      });
      el.addEventListener("mouseleave", () => {
        if (this.hoveredUid === uid) {
          this.hoveredUid = null;
          if (!this.selectedUid) this._renderDetail();
        }
      });
    });

    this._renderDetail();
  }

  private _paintAllIcons(container: HTMLElement) {
    uiRarityFx.syncContainer(container);
  }

  private _renderDetail() {
    const activeUid = this.selectedUid ?? this.hoveredUid;
    if (!activeUid) {
      this.detailEl.innerHTML = `<div class="detail-empty">Di chuột hoặc chọn một vật phẩm trong Túi / Ô Trang Bị để xem chỉ số so sánh, Trang bị hoặc Phân rã thành Mảnh Lăng Kính.</div>`;
      return;
    }

    const found = this.game.inv.findByUid(activeUid);
    if (!found) {
      if (this.selectedUid === activeUid) this.selectedUid = null;
      if (this.hoveredUid === activeUid) this.hoveredUid = null;
      this.detailEl.innerHTML = `<div class="detail-empty">Chọn một vật phẩm để xem chi tiết.</div>`;
      return;
    }

    const { item, location } = found;
    const def = ITEMS[item.defId];
    const rInfo = RARITY_INFO[def.rarity];
    const tInfo = getTierBadge(def);

    const classReqText =
      def.requiredClass && def.requiredClass !== "all"
        ? ` · Yêu cầu: ${getClassDef(def.requiredClass).vnName}`
        : "";
    const classMismatch =
      def.requiredClass &&
      def.requiredClass !== "all" &&
      def.requiredClass !== this.game.player.classId;

    let statsHtml = "";
    if (def.category === "equipment") {
      const st = getItemEffectiveStats(item);
      const diff = location === "bag" ? this.game.inv.compareWithEquipped(item) : null;
      const rows: [string, number, number | undefined, string][] = [
        ["ATK", st.atk, diff?.atk, ""],
        ["DEF", st.def, diff?.def, ""],
        ["MAX HP", st.maxHp, diff?.maxHp, ""],
        ["CRIT", st.crit, diff?.crit, "%"],
        ["SPD", st.spd, diff?.spd, ""],
        ["ELEM", st.elementBonus, diff?.elementBonus, "%"],
      ];
      statsHtml = `<div class="detail-stats">${rows
        .filter(([, val, d]) => val !== 0 || (d !== undefined && d !== 0))
        .map(([lbl, val, d, unit]) => {
          let diffBadge = "";
          if (d !== undefined && d !== 0) {
            diffBadge =
              d > 0
                ? `<span class="diff-up">(+${d}${unit} ▲)</span>`
                : `<span class="diff-down">(${d}${unit} ▼)</span>`;
          }
          return `<div class="detail-stat-line"><span>${lbl}: <b>+${val}${unit}</b></span> ${diffBadge}</div>`;
        })
        .join("")}</div>`;
    }

    let btns = "";
    if (def.category === "equipment") {
      if (location === "bag") {
        const shards = getDismantleShardYield(item);
        btns += `<button class="px-btn ${classMismatch ? "disabled" : "primary"}" id="inv-act-equip">TRANG BỊ</button>`;
        btns += `<button class="px-btn good" id="inv-act-dismantle">PHÂN RÃ (+${shards} Mảnh LK)</button>`;
        btns += `<button class="px-btn warn" id="inv-act-sell">BÁN (+${def.sellPrice + item.enhanceLevel * 12}G)</button>`;
      } else {
        btns += `<button class="px-btn" id="inv-act-unequip">THÁO XUỐNG TÚI</button>`;
      }
    } else if (def.category === "consumable") {
      btns += `<button class="px-btn good" id="inv-act-use">SỬ DỤNG NGAY</button>`;
      btns += `<button class="px-btn warn" id="inv-act-sell">BÁN 1 (+${def.sellPrice}G)</button>`;
    } else {
      btns += `<button class="px-btn warn" id="inv-act-sell">BÁN 1 (+${def.sellPrice}G)</button>`;
    }

    this.detailEl.innerHTML = `
      <div class="detail-head" style="color:${rInfo.color}">
        <canvas class="px-item-icon" width="32" height="32" data-icon-def="${def.id}" data-icon-enh="${item.enhanceLevel}"></canvas>
        <span class="tier-pill" style="color:${tInfo.color};background:${tInfo.bg}">${tInfo.badge}</span>
        <span>${def.name} ${item.enhanceLevel > 0 ? `+${item.enhanceLevel}` : ""}</span>
      </div>
      <div class="detail-sub">
        ${tInfo.label} · [${rInfo.label}] ${def.slot ? `· ${SLOT_LABELS[def.slot]}` : ""}
        ${location !== "bag" ? "· ĐANG MẶC" : ""}
        <span style="color:${classMismatch ? "#ff4466" : "#99a3c4"}">${classReqText}</span>
      </div>
      <div class="detail-desc">${def.desc}</div>
      ${statsHtml}
      <div class="detail-actions">${btns}</div>
    `;
    this._paintAllIcons(this.detailEl);

    this.detailEl.querySelector("#inv-act-equip")?.addEventListener("click", () => {
      const res = this.game.inv.equipFromBag(item.uid, this.game.player.classId);
      if (!res.ok) {
        sfx.playForgeFail();
        this.game.uiToast(res.reason ?? "Không thể trang bị vật phẩm này.", "warn");
        return;
      }
      this.game.recalcPlayerStats(true);
      if (res.slot) this._playEquipSfx(res.slot);
      this.game.saveGame(false);
      this.game.uiToast(`Đã trang bị ${def.name}!`, "good");
      this.render();
    });

    this.detailEl.querySelector("#inv-act-unequip")?.addEventListener("click", () => {
      if (location !== "bag" && this.game.inv.unequipSlot(location)) {
        this.game.recalcPlayerStats(true);
        sfx.playUnequip();
        this.game.saveGame(false);
        this.render();
      } else if (location !== "bag") {
        sfx.playForgeFail();
        this.game.uiToast("Túi đồ đã đầy (32/32)!", "warn");
      }
    });

    this.detailEl.querySelector("#inv-act-dismantle")?.addEventListener("click", () => {
      const res = this.game.inv.dismantleBagItem(item.uid);
      if (res.ok) {
        if (this.selectedUid === item.uid) this.selectedUid = null;
        if (this.hoveredUid === item.uid) this.hoveredUid = null;
        sfx.playDismantle();
        this.game.saveGame(false);
        this.game.uiToast(
          `Đã phân rã ${res.itemName} thành +${res.shards} Mảnh Lăng Kính!`,
          "epic"
        );
        this.render();
      }
    });

    this.detailEl.querySelector("#inv-act-use")?.addEventListener("click", () => {
      if (this.game.useConsumableById(item.defId)) {
        this.render();
      }
    });

    this.detailEl.querySelector("#inv-act-sell")?.addEventListener("click", () => {
      const gained = this.game.inv.sellBagItem(item.uid);
      if (gained > 0) {
        sfx.playBuy();
        this.game.saveGame(false);
        this.game.uiToast(`Đã bán ${def.name}, nhận +${gained} G!`, "good");
        this.render();
      }
    });
  }
}
