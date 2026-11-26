import { getClassDef } from "../data/classes";
import {
  ITEMS,
  RARITY_INFO,
  SLOT_LABELS,
  canClassEquip,
  getDismantleShardYield,
  getItemEffectiveStats,
  getTierBadge,
} from "../data/items";
import { ALL_SET_BONUSES } from "../data/sets";
import { EQUIP_SLOTS, type AutoSellMode, type EquipSlot, type StatAllocKey } from "../data/types";
import { getWeaponSkillForItem } from "../data/weaponSkills";
import { MAX_EXPANDED_BAG_SLOTS } from "../systems/inventorySystem";

const STAT_ALLOC_ROWS: { key: StatAllocKey; label: string; effect: string }[] = [
  { key: "str", label: "STR", effect: "+3 ATK" },
  { key: "vit", label: "VIT", effect: "+18 HP, +1 DEF" },
  { key: "agi", label: "AGI", effect: "+2.5 SPD" },
  { key: "crt", label: "CRT", effect: "+1.5% Crit" },
];
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
  private equipLeftEl: HTMLElement | null;
  private equipRightEl: HTMLElement | null;
  private quickConsEl: HTMLElement | null;
  private statsEl: HTMLElement;
  private allocEl: HTMLElement | null;
  private bagEl: HTMLElement;
  private detailEl: HTMLElement;
  private quickSellBarEl: HTMLElement | null;
  private autoSellBarEl: HTMLElement | null;
  private bagTitleEl: HTMLElement | null;
  private buyBackpackBtn: HTMLButtonElement | null;

  private selectedUid: string | null = null;
  private hoveredUid: string | null = null;
  private quickSellMode = false;
  private selectedSellUids = new Set<string>();
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
    this.equipLeftEl = document.getElementById("inv-equip-left");
    this.equipRightEl = document.getElementById("inv-equip-right");
    this.quickConsEl = document.getElementById("inv-quick-consumables");
    this.statsEl = document.getElementById("inv-hero-stats")!;
    this.allocEl = document.getElementById("inv-stat-alloc");
    this.bagEl = document.getElementById("inv-bag-grid")!;
    this.detailEl = document.getElementById("inv-item-detail")!;
    this.quickSellBarEl = document.getElementById("inv-quicksell-bar");
    this.autoSellBarEl = document.getElementById("inv-autosell-bar");
    this.bagTitleEl = document.getElementById("inv-bag-title");
    this.buyBackpackBtn = document.getElementById("btn-buy-backpack") as HTMLButtonElement | null;

    this.buyBackpackBtn?.addEventListener("click", () => {
      const res = this.game.inv.buyNextBackpackUpgrade();
      if (!res.ok) {
        sfx.playForgeFail();
        this.game.uiToast(res.reason ?? "Không thể nâng cấp Balo!", "warn");
        return;
      }
      sfx.playHiddenUnlock();
      this.game.saveGame(false);
      this.game.refreshHud();
      this.game.uiToast(
        `🎒 Đã mua ${res.upgrade!.name}! Kho đồ mở rộng lên ${res.upgrade!.totalSlots} ô!`,
        "epic"
      );
      this.render();
    });

    onCodixelReady(() => {
      if (!this.root.classList.contains("hidden")) {
        this.render();
      }
    });

    document.getElementById("btn-close-inventory")!.addEventListener("click", () => {
      sfx.playUiClick();
      this.game.setModal(null);
    });

    document.getElementById("btn-equip-best")?.addEventListener("click", () => {
      const res = this.game.inv.equipBestForClass(this.game.player.classId);
      if (res.equipped.length === 0) {
        sfx.playUiClick();
        this.game.uiToast("Bạn đang mặc trang bị tốt nhất trong túi rồi!", "info");
        return;
      }
      this.game.recalcPlayerStats(true);
      this._playEquipSfx(res.equipped[0].slot);
      this.game.saveGame(false);
      this.game.refreshHud();
      const summary = res.equipped.map((e) => e.itemName).join(", ");
      this.game.uiToast(`⚡ Đã trang bị tối ưu: ${summary}`, "good");
      this.render();
    });

    document.getElementById("btn-toggle-quicksell")?.addEventListener("click", () => {
      sfx.playUiClick();
      if (this.quickSellMode) {
        this.quickSellMode = false;
        this.selectedSellUids.clear();
      } else {
        this._enterQuickSellMode();
      }
      this.render();
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

  private _enterQuickSellMode() {
    this.quickSellMode = true;
    this.selectedSellUids.clear();
    const classId = this.game.player.classId;
    for (const item of this.game.inv.bag) {
      const def = ITEMS[item.defId];
      if (def && def.category === "equipment" && !canClassEquip(def, classId)) {
        this.selectedSellUids.add(item.uid);
      }
    }
  }

  show(opts?: { quickSell?: boolean }) {
    this.root.classList.remove("hidden");
    this.hoveredUid = null;
    this.autoRotate = true;
    if (!this.selectedUid || !this.game.inv.findByUid(this.selectedUid)) {
      const firstBag = this.game.inv.bag[0]?.uid;
      const firstEq =
        this.game.inv.equipment.weapon?.uid ??
        this.game.inv.equipment.armor?.uid ??
        this.game.inv.equipment.helmet?.uid ??
        this.game.inv.equipment.accessory?.uid;
      this.selectedUid = firstBag ?? firstEq ?? null;
    }
    if (opts?.quickSell) {
      this._enterQuickSellMode();
    } else {
      this.quickSellMode = false;
      this.selectedSellUids.clear();
    }
    sfx.playBagOpen();
    this.render();
    this._startLoop();
  }

  hide() {
    this.quickSellMode = false;
    this.selectedSellUids.clear();
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
      {
        aegisActive: p.aegisTime > 0 || p.shieldTime > 0 || (p.shieldHp ?? 0) > 0,
        buffActive: p.atkBuffTime > 0,
        setAuraColor: p.activeSetAuraColor,
      }
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
      <div class="stat-pill"><span>HP</span><b style="color:#4ade80">${Math.ceil(p.hp)}/${p.maxHp}</b></div>
      <div class="stat-pill"><span>ATK</span><b style="color:#fb923c">${p.atk}</b></div>
      <div class="stat-pill"><span>MAG</span><b style="color:#60a5fa">${p.mag ?? 0}</b></div>
      <div class="stat-pill"><span>DEF</span><b style="color:#5ef2ff">${p.def}</b></div>
      <div class="stat-pill"><span>CRIT</span><b style="color:#f472b6">${p.crit}%</b></div>
      <div class="stat-pill"><span>ASPD</span><b style="color:#facc15">+${p.aspdPct ?? 0}%</b></div>
      <div class="stat-pill"><span>SPD</span><b style="color:#fde047">${p.spd}</b></div>
      <div class="stat-pill"><span>VÀNG</span><b style="color:#facc15">${inv.gold}G</b></div>
    `;

    // 1a. Stat Allocation Panel (STR / VIT / AGI / CRT)
    if (this.allocEl) {
      const alloc = p.allocatedStats ?? { str: 0, vit: 0, agi: 0, crt: 0 };
      const totalAlloc = alloc.str + alloc.vit + alloc.agi + alloc.crt;
      const rowsHtml = STAT_ALLOC_ROWS.map((r) => {
        const val = alloc[r.key];
        const dis = p.statPoints <= 0 ? "disabled" : "";
        return `
          <div class="stat-alloc-row">
            <span class="stat-alloc-key">${r.label}</span>
            <span class="stat-alloc-desc"><b>${val}</b> (${r.effect})</span>
            <button class="px-btn sm ${p.statPoints > 0 ? "good" : "disabled"} stat-plus-btn" data-alloc="${r.key}" ${dis}>+</button>
          </div>
        `;
      }).join("");
      this.allocEl.innerHTML = `
        <div class="stat-alloc-hdr">
          <span>ĐIỂM TIỀM NĂNG (+3/cấp)</span>
          <span style="color:${p.statPoints > 0 ? "#ffe066" : "#8b94b8"}">${p.statPoints} ĐIỂM</span>
        </div>
        ${rowsHtml}
        ${
          totalAlloc > 0
            ? `<button class="px-btn sm warn respec-btn" id="btn-respec-stats">↺ Tẩy Điểm (100 G)</button>`
            : ""
        }
      `;
      this.allocEl.querySelectorAll("[data-alloc]").forEach((el) => {
        el.addEventListener("click", () => {
          const key = (el as HTMLElement).dataset.alloc as StatAllocKey;
          if (this.game.allocateStat(key)) {
            this.render();
          }
        });
      });
      this.allocEl.querySelector("#btn-respec-stats")?.addEventListener("click", () => {
        if (this.game.respecStats()) {
          this.render();
        }
      });
    }

    // 1b. Active Set Bonuses
    const setsEl = document.getElementById("inv-set-bonuses");
    if (setsEl) {
      const sets = inv.getActiveSetBonuses(p.classId);
      if (sets.length === 0) {
        setsEl.innerHTML = "";
      } else {
        setsEl.innerHTML = sets
          .map((s) => {
            const topActive = s.def.maxPieces === 3 ? s.threeActive : s.fourActive;
            const topLabel = s.def.maxPieces === 3 ? s.def.threePieceLabel ?? "" : s.def.fourPieceLabel ?? "";
            return `
            <div class="set-pill" style="border-color:${s.def.color}">
              <b style="color:${s.def.color}">★ ${s.def.name} (${s.count}/${s.def.maxPieces})</b>
              <div style="color:${s.twoActive ? "#4ade80" : "#6c738e"}">${s.def.twoPieceLabel}</div>
              ${topLabel ? `<div style="color:${topActive ? "#facc15" : "#6c738e"}">${topLabel}</div>` : ""}
            </div>
          `;
          })
          .join("");
      }
    }

    // 2. Equipment Slots around Paper-Doll (Left: Helmet, Armor, Weapon | Right: Boots, Accessory) + 2 Quick Consumables
    const renderEquipTile = (slot: EquipSlot) => {
      const it = inv.equipment[slot];
      if (!it) {
        return `
          <div class="pd-slot empty" title="${SLOT_LABELS[slot]}">
            <span class="pd-slot-tag">${SLOT_LABELS[slot]}</span>
            <span class="pd-slot-empty">—</span>
          </div>
        `;
      }
      const def = ITEMS[it.defId];
      const col = RARITY_INFO[def.rarity].color;
      const sel = this.selectedUid === it.uid ? "selected" : "";
      return `
        <div class="pd-slot rarity-${def.rarity} ${sel}" data-uid="${it.uid}" data-review-uid="${it.uid}" style="border-color:${col}" title="${def.name}">
          <canvas class="px-item-icon" width="44" height="44" data-icon-def="${def.id}" data-icon-enh="${it.enhanceLevel}"></canvas>
          <span class="pd-slot-tag">${SLOT_LABELS[slot]}</span>
          ${it.enhanceLevel > 0 ? `<span class="bag-enh">+${it.enhanceLevel}</span>` : ""}
        </div>
      `;
    };

    if (this.equipLeftEl && this.equipRightEl) {
      this.equipLeftEl.innerHTML = (["helmet", "armor", "weapon"] as EquipSlot[]).map(renderEquipTile).join("");
      this.equipRightEl.innerHTML = (["boots", "accessory"] as EquipSlot[]).map(renderEquipTile).join("");
    } else {
      this.equipEl.innerHTML = EQUIP_SLOTS.map(renderEquipTile).join("");
    }

    if (this.quickConsEl) {
      const quickItems = inv.bag.filter((b) => ITEMS[b.defId]?.category === "consumable").slice(0, 2);
      let qHtml = "";
      for (let i = 0; i < 2; i++) {
        const qIt = quickItems[i];
        if (!qIt) {
          qHtml += `<div class="pd-slot quick-cons empty" title="Tiêu hao nhanh [${i + 1}]"><span class="pd-slot-tag">Dùng [${i + 1}]</span><span class="pd-slot-empty">—</span></div>`;
        } else {
          const qDef = ITEMS[qIt.defId];
          const col = RARITY_INFO[qDef.rarity].color;
          const sel = this.selectedUid === qIt.uid ? "selected" : "";
          qHtml += `
            <div class="pd-slot quick-cons rarity-${qDef.rarity} ${sel}" data-uid="${qIt.uid}" data-bag="1" data-quick-use="${qDef.id}" data-review-uid="${qIt.uid}" style="border-color:${col}" title="${qDef.name}">
              <canvas class="px-item-icon" width="44" height="44" data-icon-def="${qDef.id}" data-icon-enh="0"></canvas>
              <span class="bag-qty">x${qIt.qty}</span>
              <span class="pd-slot-tag">${qDef.name}</span>
            </div>
          `;
        }
      }
      this.quickConsEl.innerHTML = qHtml;
    }

    // 3. Dynamic Bag Grid (40..80 slots) + Backpack Upgrade + Auto-Sell Low-Rarity Bar + Selective Quick Sell
    if (this.bagTitleEl) {
      this.bagTitleEl.textContent = `TÚI ĐỒ (${inv.bag.length}/${inv.bagCapacity} Ô)`;
    }
    if (this.buyBackpackBtn) {
      const nextBp = inv.getNextBackpackUpgrade();
      if (!nextBp) {
        this.buyBackpackBtn.textContent = `🎒 TỐI ĐA (${MAX_EXPANDED_BAG_SLOTS} Ô)`;
        this.buyBackpackBtn.disabled = true;
        this.buyBackpackBtn.classList.remove("good");
      } else {
        this.buyBackpackBtn.textContent = `🎒 +${nextBp.bonusSlots} Ô (${nextBp.price}G)`;
        this.buyBackpackBtn.disabled = false;
        this.buyBackpackBtn.classList.toggle("good", inv.gold >= nextBp.price);
        this.buyBackpackBtn.title = `${nextBp.name} — ${nextBp.desc}`;
      }
    }
    const toggleBtn = document.getElementById("btn-toggle-quicksell");
    if (toggleBtn) {
      toggleBtn.classList.toggle("active", this.quickSellMode);
      toggleBtn.textContent = this.quickSellMode ? "✕ THOÁT BÁN NHANH" : "💰 BÁN NHANH";
    }

    // Prune stale UIDs from selectedSellUids
    const currentBagUids = new Set(inv.bag.map((b) => b.uid));
    for (const uid of [...this.selectedSellUids]) {
      if (!currentBagUids.has(uid)) this.selectedSellUids.delete(uid);
    }

    let bagHtml = "";
    for (let i = 0; i < inv.bagCapacity; i++) {
      const it = inv.bag[i];
      if (!it) {
        bagHtml += `<div class="bag-cell empty"></div>`;
        continue;
      }
      const def = ITEMS[it.defId];
      const col = RARITY_INFO[def.rarity].color;
      const tInfo = getTierBadge(def);
      const sel = this.selectedUid === it.uid ? "selected" : "";
      const pickedForSell = this.quickSellMode && this.selectedSellUids.has(it.uid);
      const sellClass = pickedForSell ? "sell-picked" : "";
      const classMismatch =
        def.category === "equipment" &&
        def.requiredClass &&
        def.requiredClass !== "all" &&
        def.requiredClass !== p.classId;
      bagHtml += `
        <div class="bag-cell rarity-${def.rarity} ${sel} ${sellClass}" data-uid="${it.uid}" data-bag="1" data-review-uid="${it.uid}" style="border-color:${col}">
          <canvas class="px-item-icon" width="44" height="44" data-icon-def="${def.id}" data-icon-enh="${it.enhanceLevel}"></canvas>
          <span class="bag-tier" style="color:${tInfo.color}">${tInfo.badge}</span>
          ${it.qty > 1 ? `<span class="bag-qty">x${it.qty}</span>` : ""}
          ${it.enhanceLevel > 0 ? `<span class="bag-enh">+${it.enhanceLevel}</span>` : ""}
          ${pickedForSell ? `<span class="bag-sell-check">✓</span>` : classMismatch ? `<span class="bag-lock" title="Khác Class">✕</span>` : ""}
        </div>
      `;
    }
    this.bagEl.innerHTML = bagHtml;
    this._renderAutoSellBar();
    this._renderQuickSellBar();

    // Paint codixel icons & attach live pixelfx high-rarity slot auras
    uiRarityFx.syncContainer(this.root);

    // Bind click selection (supports toggling Quick-Sell multi-select + detail inspection)
    this.root.querySelectorAll("[data-uid]").forEach((el) => {
      const uid = (el as HTMLElement).dataset.uid ?? null;
      const isBag = (el as HTMLElement).dataset.bag === "1";
      el.addEventListener("click", () => {
        sfx.playUiClick();
        if (this.quickSellMode && isBag && uid) {
          if (this.selectedSellUids.has(uid)) {
            this.selectedSellUids.delete(uid);
          } else {
            this.selectedSellUids.add(uid);
          }
          this.selectedUid = uid;
          this.render();
          return;
        }
        this.selectedUid = uid;
        this.render();
      });
      el.addEventListener("mouseenter", () => {
        if (this.hoveredUid !== uid) {
          this.hoveredUid = uid;
          this._renderDetail();
        }
      });
      el.addEventListener("mouseleave", () => {
        if (this.hoveredUid === uid) {
          this.hoveredUid = null;
          this._renderDetail();
        }
      });
      const quickUseId = (el as HTMLElement).dataset.quickUse;
      if (quickUseId) {
        el.addEventListener("dblclick", () => {
          if (this.game.useConsumableById(quickUseId)) {
            this.game.refreshHud();
            this.render();
          }
        });
      }
    });

    this._renderDetail();
  }

  private _renderAutoSellBar() {
    if (!this.autoSellBarEl) return;
    const inv = this.game.inv;
    const mode = inv.autoSell.maxRarity;
    const offCls = Boolean(inv.autoSell.includeOffClass);
    const active = mode !== "off" || offCls;
    const modes: { id: AutoSellMode; label: string; color: string }[] = [
      { id: "off", label: "TẮT", color: "#9da4bf" },
      { id: "common", label: "TRẮNG", color: "#e5e8f0" },
      { id: "uncommon", label: "≤ LỤC", color: "#44ee88" },
      { id: "rare", label: "≤ LAM", color: "#38e8ff" },
    ];
    const sweepable = inv.bag.filter((b) => inv.shouldAutoSell(b, this.game.player.classId)).length;

    this.autoSellBarEl.classList.toggle("active", active);
    this.autoSellBarEl.innerHTML = `
      <div class="as-row">
        <span class="as-lbl">⚙ AUTO-BÁN KHI NHẶT:</span>
        <div class="as-pills">
          ${modes
            .map(
              (m) =>
                `<button class="as-pill ${mode === m.id ? "on" : ""}" data-as-mode="${m.id}" style="--pill-c:${m.color}">${m.label}</button>`
            )
            .join("")}
        </div>
        <label class="as-chk" title="Tự bán luôn trang bị khác Class (trừ Huyền Thoại / Độc Lạ / Ẩn)">
          <input type="checkbox" id="chk-as-offclass" ${offCls ? "checked" : ""} />
          <span>Khác Class</span>
        </label>
        <button id="btn-as-sweep" class="px-btn sm ${sweepable > 0 ? "good" : ""}" ${sweepable === 0 ? "disabled" : ""} title="Quét và bán ngay các trang bị phẩm chất thấp hiện đang nằm trong túi">
          🧹 QUÉT (${sweepable})
        </button>
      </div>
      <div class="as-guard">🛡 Tự động bán đồ phẩm chất thấp ngay khi nhặt · Luôn bảo vệ Đồ Ẩn, Đồ Độc Lạ, Đồ Rương Mùa &amp; Đồ đã +N</div>
    `;

    this.autoSellBarEl.querySelectorAll<HTMLButtonElement>("[data-as-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        sfx.playUiClick();
        const nextMode = btn.dataset.asMode as AutoSellMode;
        inv.setAutoSell(nextMode, inv.autoSell.includeOffClass);
        this.game.saveGame(false);
        this.game.refreshHud();
        this.render();
      });
    });

    this.autoSellBarEl.querySelector<HTMLInputElement>("#chk-as-offclass")?.addEventListener("change", (ev) => {
      sfx.playUiClick();
      const checked = (ev.currentTarget as HTMLInputElement).checked;
      inv.setAutoSell(inv.autoSell.maxRarity, checked);
      this.game.saveGame(false);
      this.game.refreshHud();
      this.render();
    });

    this.autoSellBarEl.querySelector("#btn-as-sweep")?.addEventListener("click", () => {
      const res = inv.sweepAutoSellBag(this.game.player.classId);
      if (res.soldCount > 0) {
        sfx.playBuy();
        if (this.selectedUid && !inv.findByUid(this.selectedUid)) this.selectedUid = null;
        this.game.saveGame(false);
        this.game.refreshHud();
        this.game.uiToast(`🧹 Đã quét Auto-Bán ${res.soldCount} trang bị phẩm thấp → +${res.totalGold} G!`, "good");
        this.render();
      }
    });
  }

  private _renderQuickSellBar() {
    if (!this.quickSellBarEl) return;
    if (!this.quickSellMode) {
      this.quickSellBarEl.classList.add("hidden");
      this.quickSellBarEl.innerHTML = "";
      return;
    }

    const inv = this.game.inv;
    const classId = this.game.player.classId;
    let totalGold = 0;
    let itemCount = 0;
    for (const item of inv.bag) {
      if (!this.selectedSellUids.has(item.uid)) continue;
      totalGold += inv.getItemSellValue(item, true);
      itemCount++;
    }

    this.quickSellBarEl.classList.remove("hidden");
    this.quickSellBarEl.innerHTML = `
      <div class="qs-top">
        <span><b>CHẾ ĐỘ BÁN NHANH:</b> Tự đánh dấu đồ khác Class. Click các ô trong túi để chọn thêm hoặc bỏ chọn, rồi nhấn <b>Xác Nhận Bán</b>!</span>
      </div>
      <div class="qs-controls">
        <div class="qs-filters">
          <button class="px-btn sm" id="qs-pick-offclass">Chỉ Khác Class</button>
          <button class="px-btn sm" id="qs-add-weaker">+ Đồ Yếu Hơn</button>
          <button class="px-btn sm" id="qs-add-common">+ Đồ Trắng (+0)</button>
          <button class="px-btn sm" id="qs-clear">Bỏ Chọn</button>
        </div>
        <div class="qs-confirm-group">
          <span class="qs-summary">Đã chọn: <b style="color:#ffe066">${itemCount}</b> ô · Thu: <b style="color:#44ee88">+${totalGold} G</b></span>
          <button class="px-btn sm ${itemCount > 0 ? "good" : "disabled"}" id="qs-confirm-sell">✔ XÁC NHẬN BÁN (+${totalGold} G)</button>
          <button class="px-btn sm" id="qs-cancel">✕ HỦY</button>
        </div>
      </div>
    `;

    this.quickSellBarEl.querySelector("#qs-pick-offclass")?.addEventListener("click", () => {
      sfx.playUiClick();
      this._enterQuickSellMode();
      this.render();
    });

    this.quickSellBarEl.querySelector("#qs-add-weaker")?.addEventListener("click", () => {
      sfx.playUiClick();
      for (const item of inv.bag) {
        const def = ITEMS[item.defId];
        if (!def || def.category !== "equipment" || !def.slot) continue;
        if (!canClassEquip(def, classId)) continue;
        const eq = inv.equipment[def.slot];
        if (eq && inv.computeEquipScore(item) < inv.computeEquipScore(eq)) {
          this.selectedSellUids.add(item.uid);
        }
      }
      this.render();
    });

    this.quickSellBarEl.querySelector("#qs-add-common")?.addEventListener("click", () => {
      sfx.playUiClick();
      for (const item of inv.bag) {
        const def = ITEMS[item.defId];
        if (def && def.category === "equipment" && def.rarity === "common" && item.enhanceLevel === 0) {
          this.selectedSellUids.add(item.uid);
        }
      }
      this.render();
    });

    this.quickSellBarEl.querySelector("#qs-clear")?.addEventListener("click", () => {
      sfx.playUiClick();
      this.selectedSellUids.clear();
      this.render();
    });

    this.quickSellBarEl.querySelector("#qs-cancel")?.addEventListener("click", () => {
      sfx.playUiClick();
      this.quickSellMode = false;
      this.selectedSellUids.clear();
      this.render();
    });

    this.quickSellBarEl.querySelector("#qs-confirm-sell")?.addEventListener("click", () => {
      if (this.selectedSellUids.size === 0) return;
      const res = inv.sellMultipleFromBag([...this.selectedSellUids]);
      this.selectedSellUids.clear();
      this.quickSellMode = false;
      if (this.selectedUid && !inv.findByUid(this.selectedUid)) {
        this.selectedUid = null;
      }
      if (res.soldCount > 0) {
        sfx.playBuy();
        this.game.saveGame(false);
        this.game.refreshHud();
        this.game.uiToast(`💰 Đã bán ${res.soldCount} vật phẩm, thu về +${res.totalGold} G!`, "good");
      }
      this.render();
    });
  }

  private _paintAllIcons(container: HTMLElement) {
    uiRarityFx.syncContainer(container);
  }

  private _renderDetail() {
    const activeUid = this.hoveredUid ?? this.selectedUid;
    if (!activeUid) {
      this.detailEl.style.borderColor = "#444b70";
      this.detailEl.innerHTML = `<div class="detail-empty">Rê chuột hoặc chọn bất kỳ vật phẩm nào trong <b>EQUIP</b> hoặc <b>BAG</b> để xem chỉ số, so sánh xanh/đỏ, nội tại, Set Bonus &amp; Lore 16-bit.</div>`;
      return;
    }

    const found = this.game.inv.findByUid(activeUid);
    if (!found) {
      if (this.selectedUid === activeUid) this.selectedUid = null;
      if (this.hoveredUid === activeUid) this.hoveredUid = null;
      this.detailEl.style.borderColor = "#444b70";
      this.detailEl.innerHTML = `<div class="detail-empty">Chọn một vật phẩm để xem chi tiết.</div>`;
      return;
    }

    const { item, location } = found;
    const def = ITEMS[item.defId];
    const rInfo = RARITY_INFO[def.rarity];
    const tInfo = getTierBadge(def);
    this.detailEl.style.borderColor = rInfo.color;

    const classReqText =
      def.requiredClass && def.requiredClass !== "all"
        ? `Yêu cầu: ${getClassDef(def.requiredClass).vnName}`
        : "Mọi Class";
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
        ["MAG", st.mag, diff?.mag, ""],
        ["DEF", st.def, diff?.def, ""],
        ["MAX HP", st.maxHp, diff?.maxHp, ""],
        ["ASPD", st.aspdPct, diff?.aspdPct, "%"],
        ["CRIT", st.crit, diff?.crit, "%"],
        ["CRIT DMG", st.critDmgPct, diff?.critDmgPct, "%"],
        ["HÚT MÁU", st.lifestealPct, diff?.lifestealPct, "%"],
        ["KHÁNG LỬA", st.fireResPct, diff?.fireResPct, "%"],
        ["SPD", st.spd, diff?.spd, ""],
        ["MOVE SPD", st.moveSpeedPct, diff?.moveSpeedPct, "%"],
        ["ELEM", st.elementBonus, diff?.elementBonus, "%"],
        ["STAM", st.maxStamina, diff?.maxStamina, ""],
      ];
      statsHtml = `<div class="detail-stats">${rows
        .filter(([, val, d]) => val !== 0 || (d !== undefined && d !== 0))
        .map(([lbl, val, d, unit]) => {
          const valSign = val >= 0 ? `+${val}` : `${val}`;
          const valCls = val < 0 ? "stat-neg" : "stat-pos";
          let diffBadge = "";
          if (d !== undefined && d !== 0) {
            diffBadge =
              d > 0
                ? `<span class="diff-up">(+${d}${unit} ▲)</span>`
                : `<span class="diff-down">(${d}${unit} ▼)</span>`;
          }
          return `<div class="detail-stat-line"><span>${lbl}: <b class="${valCls}">${valSign}${unit}</b></span> ${diffBadge}</div>`;
        })
        .join("")}</div>`;
    }

    let btns = "";
    if (def.category === "equipment") {
      if (location === "bag") {
        const shards = getDismantleShardYield(item);
        btns += `<button class="px-btn ${classMismatch ? "disabled" : "primary"}" id="inv-act-equip">TRANG BỊ</button>`;
        btns += `<button class="px-btn good" id="inv-act-dismantle">PHÂN RÃ (+${shards} LK)</button>`;
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

    const wpnSkill = def.slot === "weapon" ? getWeaponSkillForItem(def.id) : null;
    const wpnSkillLine = wpnSkill
      ? `<div class="info-skill-box" style="border-left-color:${wpnSkill.accent};color:${wpnSkill.accent}">⚔ <b>[E] ${wpnSkill.name}</b> (${wpnSkill.cooldown}s)<div class="info-skill-desc">${wpnSkill.detailDesc}</div></div>`
      : "";

    const passiveObj = def.passive;
    const isCurse = Boolean(passiveObj?.isCurse);
    const passiveTitle = passiveObj
      ? isCurse
        ? `CURSE · ${passiveObj.name}`
        : `PASSIVE · ${passiveObj.name}`
      : def.passiveDesc
        ? "PASSIVE"
        : "";
    const passiveEmblem = isCurse ? "☠" : "✦";
    const passiveCd = passiveObj?.cooldownSec ? `<span class="info-cd-pill">CD ${passiveObj.cooldownSec}s</span>` : "";
    const passiveBody = passiveObj?.description ?? def.passiveDesc ?? "";
    const passiveBox = passiveBody
      ? `<div class="info-passive-box ${isCurse ? "is-curse" : ""}">
           <div class="info-passive-emblem">${passiveEmblem}</div>
           <div class="info-passive-content">
             <div class="info-passive-hdr"><span>${passiveTitle}</span>${passiveCd}</div>
             <div class="info-passive-txt">${passiveBody}</div>
           </div>
           <div class="info-passive-flourish">❖</div>
         </div>`
      : "";

    let setHtml = "";
    if (def.setId && ALL_SET_BONUSES[def.setId]) {
      const sDef = ALL_SET_BONUSES[def.setId];
      let eqCount = 0;
      for (const s of EQUIP_SLOTS) {
        const eq = this.game.inv.equipment[s];
        if (eq && ITEMS[eq.defId]?.setId === def.setId) eqCount++;
      }
      const topLine = sDef.maxPieces === 3 ? sDef.threePieceLabel : sDef.fourPieceLabel;
      const topOn = sDef.maxPieces === 3 ? eqCount >= 3 : eqCount >= 4;
      setHtml = `
        <div class="info-set-box" style="border-color:${sDef.color}">
          <div class="info-set-hdr" style="color:${sDef.color}">SET BONUS: ${sDef.name} (${eqCount}/${sDef.maxPieces})</div>
          <div class="info-set-row ${eqCount >= 2 ? "on" : ""}">${sDef.twoPieceLabel}</div>
          ${topLine ? `<div class="info-set-row ${topOn ? "on" : ""}">${topLine}</div>` : ""}
        </div>
      `;
    }

    const loreText = def.lore ?? def.desc;

    this.detailEl.innerHTML = `
      <div class="info-hero-card">
        <div class="info-icon-frame rarity-${def.rarity}" style="border-color:${rInfo.color}">
          <canvas class="px-item-icon" width="64" height="64" data-icon-def="${def.id}" data-icon-enh="${item.enhanceLevel}"></canvas>
        </div>
        <div class="info-title" style="color:${rInfo.color}">${def.name}${item.enhanceLevel > 0 ? ` +${item.enhanceLevel}` : ""}</div>
        <div class="info-sub">
          <span class="tier-pill" style="color:${tInfo.color};background:${tInfo.bg}">${tInfo.badge}</span>
          <span style="color:${rInfo.color}">[${rInfo.label}]</span>
          ${def.slot ? `· ${SLOT_LABELS[def.slot]}` : ""}
          ${location !== "bag" ? "· ĐANG MẶC" : ""}
        </div>
        <div class="info-class-req" style="color:${classMismatch ? "#f43f5e" : "#94a3b8"}">${classReqText}</div>
      </div>
      ${statsHtml}
      ${passiveBox}
      ${wpnSkillLine}
      ${setHtml}
      <div class="info-pixel-divider"><span>◆</span></div>
      <div class="info-lore">“${loreText}”</div>
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
      this.game.refreshHud();
      this.game.uiToast(`Đã trang bị ${def.name}!`, "good");
      this.render();
    });

    this.detailEl.querySelector("#inv-act-unequip")?.addEventListener("click", () => {
      if (location !== "bag" && this.game.inv.unequipSlot(location)) {
        this.game.recalcPlayerStats(true);
        sfx.playUnequip();
        this.game.saveGame(false);
        this.game.refreshHud();
        this.render();
      } else if (location !== "bag") {
        sfx.playForgeFail();
        this.game.uiToast("Túi đồ đã đầy (40/40)!", "warn");
      }
    });

    this.detailEl.querySelector("#inv-act-dismantle")?.addEventListener("click", () => {
      const res = this.game.inv.dismantleBagItem(item.uid);
      if (res.ok) {
        if (this.selectedUid === item.uid) this.selectedUid = null;
        if (this.hoveredUid === item.uid) this.hoveredUid = null;
        sfx.playDismantle();
        this.game.saveGame(false);
        this.game.refreshHud();
        this.game.uiToast(
          `Đã phân rã ${res.itemName} thành +${res.shards} Mảnh Lăng Kính!`,
          "epic"
        );
        this.render();
      }
    });

    this.detailEl.querySelector("#inv-act-use")?.addEventListener("click", () => {
      if (this.game.useConsumableById(item.defId)) {
        this.game.refreshHud();
        this.render();
      }
    });

    this.detailEl.querySelector("#inv-act-sell")?.addEventListener("click", () => {
      const gained = this.game.inv.sellBagItem(item.uid);
      if (gained > 0) {
        sfx.playBuy();
        this.game.saveGame(false);
        this.game.refreshHud();
        this.game.uiToast(`Đã bán ${def.name}, nhận +${gained} G!`, "good");
        this.render();
      }
    });
  }
}
