import { ITEMS, RARITY_INFO, SLOT_LABELS, getItemEffectiveStats } from "../data/items";
import type { EquipSlot, ItemInstance } from "../data/types";
import type { PixTelOpenWorldGame } from "../game";
import { sfx } from "../audio/chiptuneSynth";

/**
 * RPG Inventory & Equipment Modal [I]:
 * - 4 Equipment Slots (Weapon, Armor, Ring, Pix-Chip) + Derived Hero Stats
 * - 32-Slot Bag Grid
 * - Live Stat Comparison Tooltip (green ▲ / red ▼ diff vs currently equipped slot!)
 */
export class InventoryModalUI {
  private game: PixTelOpenWorldGame;
  private root: HTMLElement;
  private equipEl: HTMLElement;
  private statsEl: HTMLElement;
  private bagEl: HTMLElement;
  private detailEl: HTMLElement;
  private selectedUid: string | null = null;

  constructor(game: PixTelOpenWorldGame) {
    this.game = game;
    this.root = document.getElementById("modal-inventory")!;
    this.equipEl = document.getElementById("inv-equip-slots")!;
    this.statsEl = document.getElementById("inv-hero-stats")!;
    this.bagEl = document.getElementById("inv-bag-grid")!;
    this.detailEl = document.getElementById("inv-item-detail")!;

    document.getElementById("btn-close-inventory")!.addEventListener("click", () => {
      sfx.playUiClick();
      this.game.setModal(null);
    });
  }

  show() {
    this.root.classList.remove("hidden");
    this.render();
  }

  hide() {
    this.root.classList.add("hidden");
  }

  render() {
    const p = this.game.player;
    const inv = this.game.inv;

    // 1. Derived Hero Stats
    this.statsEl.innerHTML = `
      <div class="stat-pill"><span>LV</span><b>${p.level}</b></div>
      <div class="stat-pill"><span>HP</span><b style="color:#44ee88">${Math.ceil(p.hp)}/${p.maxHp}</b></div>
      <div class="stat-pill"><span>ATK</span><b style="color:#ff8844">${p.atk}</b></div>
      <div class="stat-pill"><span>DEF</span><b style="color:#5ef2ff">${p.def}</b></div>
      <div class="stat-pill"><span>SPD</span><b style="color:#ffee55">${p.spd}</b></div>
      <div class="stat-pill"><span>CRIT</span><b style="color:#ff66d8">${p.crit}%</b></div>
      <div class="stat-pill"><span>VÀNG</span><b style="color:#ffe066">${inv.gold} G</b></div>
    `;

    // 2. 4 Equipment Slots
    this.equipEl.innerHTML = (["weapon", "armor", "ring", "chip"] as EquipSlot[])
      .map((slot) => {
        const it = inv.equipment[slot];
        if (!it) {
          return `<div class="equip-slot empty"><span class="slot-lbl">${SLOT_LABELS[slot]}</span><span class="slot-none">Trống</span></div>`;
        }
        const def = ITEMS[it.defId];
        const col = RARITY_INFO[def.rarity].color;
        const sel = this.selectedUid === it.uid ? "selected" : "";
        return `
          <div class="equip-slot ${sel}" data-uid="${it.uid}" style="border-color:${col}">
            <div class="slot-top">
              <span class="slot-lbl">${SLOT_LABELS[slot]}</span>
              ${it.enhanceLevel > 0 ? `<span class="enh-tag">+${it.enhanceLevel}</span>` : ""}
            </div>
            <div class="slot-name" style="color:${col}">
              <span class="item-swatch" style="background:${def.iconColor}"></span>
              ${def.name}
            </div>
          </div>
        `;
      })
      .join("");

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
      const sel = this.selectedUid === it.uid ? "selected" : "";
      bagHtml += `
        <div class="bag-cell ${sel}" data-uid="${it.uid}" style="border-color:${col}" title="${def.name}">
          <span class="bag-swatch" style="background:${def.iconColor}"></span>
          <span class="bag-short">${def.name}</span>
          ${it.qty > 1 ? `<span class="bag-qty">x${it.qty}</span>` : ""}
          ${it.enhanceLevel > 0 ? `<span class="bag-enh">+${it.enhanceLevel}</span>` : ""}
        </div>
      `;
    }
    this.bagEl.innerHTML = bagHtml;

    // Bind click selection
    this.root.querySelectorAll("[data-uid]").forEach((el) => {
      el.addEventListener("click", () => {
        sfx.playUiClick();
        this.selectedUid = (el as HTMLElement).dataset.uid ?? null;
        this.render();
      });
    });

    this._renderDetail();
  }

  private _renderDetail() {
    if (!this.selectedUid) {
      this.detailEl.innerHTML = `<div class="detail-empty">Chọn một vật phẩm trong Túi hoặc Ô Trang Bị để xem thông số & so sánh chỉ số.</div>`;
      return;
    }

    const found = this.game.inv.findByUid(this.selectedUid);
    if (!found) {
      this.selectedUid = null;
      this.detailEl.innerHTML = `<div class="detail-empty">Chọn một vật phẩm để xem chi tiết.</div>`;
      return;
    }

    const { item, location } = found;
    const def = ITEMS[item.defId];
    const rInfo = RARITY_INFO[def.rarity];

    let statsHtml = "";
    if (def.category === "equipment") {
      const st = getItemEffectiveStats(item);
      const diff = location === "bag" ? this.game.inv.compareWithEquipped(item) : null;
      const rows: [string, number, number | undefined][] = [
        ["ATK", st.atk, diff?.atk],
        ["DEF", st.def, diff?.def],
        ["MAX HP", st.maxHp, diff?.maxHp],
        ["SPD", st.spd, diff?.spd],
        ["CRIT%", st.crit, diff?.crit],
      ];
      statsHtml = `<div class="detail-stats">${rows
        .filter(([, val, d]) => val !== 0 || (d !== undefined && d !== 0))
        .map(([lbl, val, d]) => {
          let diffBadge = "";
          if (d !== undefined && d !== 0) {
            diffBadge =
              d > 0
                ? `<span class="diff-up">(+${d} ▲)</span>`
                : `<span class="diff-down">(${d} ▼)</span>`;
          }
          return `<div class="detail-stat-line"><span>${lbl}: <b>+${val}</b></span> ${diffBadge}</div>`;
        })
        .join("")}</div>`;
    }

    let btns = "";
    if (def.category === "equipment") {
      if (location === "bag") {
        btns += `<button class="px-btn primary" id="inv-act-equip">TRANG BỊ</button>`;
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
        <span class="item-swatch" style="background:${def.iconColor}"></span>
        ${def.name} ${item.enhanceLevel > 0 ? `+${item.enhanceLevel}` : ""}
      </div>
      <div class="detail-sub">[${rInfo.label}] ${def.slot ? `· ${SLOT_LABELS[def.slot]}` : ""} ${location !== "bag" ? "· ĐANG MẶC" : ""}</div>
      <div class="detail-desc">${def.desc}</div>
      ${statsHtml}
      <div class="detail-actions">${btns}</div>
    `;

    this.detailEl.querySelector("#inv-act-equip")?.addEventListener("click", () => {
      if (this.game.inv.equipFromBag(item.uid)) {
        this.game.recalcPlayerStats(true);
        sfx.playLootPickup(true);
        this.game.saveGame(false);
        this.render();
      }
    });

    this.detailEl.querySelector("#inv-act-unequip")?.addEventListener("click", () => {
      if (location !== "bag" && this.game.inv.unequipSlot(location)) {
        this.game.recalcPlayerStats(true);
        sfx.playUiClick();
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
        this.game.uiToast(`Đã bán ${def.name}, nhận +${gained} G!`, "good");
        this.render();
      }
    });
  }
}
