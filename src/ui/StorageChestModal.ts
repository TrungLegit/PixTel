import { ITEMS, RARITY_INFO, getTierBadge } from "../data/items";
import { onCodixelReady } from "../graphics/codixelAtlas";
import { MAX_STASH_SLOTS } from "../systems/inventorySystem";
import { uiRarityFx } from "../vfx/uiRarityFx";
import { sfx } from "../audio/chiptuneSynth";
import type { PixTelOpenWorldGame } from "../game";

/**
 * PIXTEL v3.0 Personal Storage Chest Modal (Rương Cá Nhân tại Quảng Trường Spawn):
 * - Left: Hero Bag (click any item to deposit straight into Stash; 1-click Deposit Materials)
 * - Right: Personal Stash Chest (80 persistent slots, click any item to withdraw back into Bag)
 * - Hovering any item in either grid opens the full braided-rope ItemReviewTooltip!
 */
export class StorageChestModalUI {
  private game: PixTelOpenWorldGame;
  private root: HTMLElement;
  private bagTitleEl: HTMLElement;
  private stashTitleEl: HTMLElement;
  private bagGridEl: HTMLElement;
  private stashGridEl: HTMLElement;
  private statusEl: HTMLElement;

  constructor(game: PixTelOpenWorldGame) {
    this.game = game;
    this.root = document.getElementById("modal-stash")!;
    this.bagTitleEl = document.getElementById("stash-bag-title")!;
    this.stashTitleEl = document.getElementById("stash-chest-title")!;
    this.bagGridEl = document.getElementById("stash-bag-grid")!;
    this.stashGridEl = document.getElementById("stash-chest-grid")!;
    this.statusEl = document.getElementById("stash-status-msg")!;

    document.getElementById("btn-close-stash")!.addEventListener("click", () => {
      sfx.playUiClick();
      this.game.setModal(null);
    });

    document.getElementById("btn-stash-deposit-mats")?.addEventListener("click", () => {
      const moved = this.game.inv.depositAllMaterialsToStash();
      if (moved > 0) {
        sfx.playChestOpen();
        this.game.saveGame(false);
        this.game.refreshHud();
        this.statusEl.innerHTML = `<span style="color:#44ee88">✓ Đã cất nhanh ${moved} nhóm Nguyên Liệu vào Rương Cá Nhân!</span>`;
      } else {
        sfx.playUiClick();
        this.statusEl.innerHTML = `<span style="color:#b8b0d4">Không có nguyên liệu thường nào trong túi để cất (Chìa Gacha luôn được giữ lại).</span>`;
      }
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
    this.statusEl.textContent = "Nhấn vào vật phẩm bên Túi để CẤT vào Rương, hoặc nhấn bên Rương để LẤY về Túi.";
    this.render();
  }

  hide() {
    this.root.classList.add("hidden");
  }

  render() {
    const inv = this.game.inv;
    this.bagTitleEl.textContent = `TÚI ĐỒ HÀNH TRANG (${inv.bag.length}/${inv.bagCapacity} Ô) — Click để CẤT →`;
    this.stashTitleEl.textContent = `📦 RƯƠNG CÁ NHÂN (${inv.stash.length}/${MAX_STASH_SLOTS} Ô) — Click để LẤY ←`;

    // Render Bag Grid
    const bagHtml: string[] = [];
    for (let i = 0; i < inv.bagCapacity; i++) {
      const item = inv.bag[i];
      if (!item) {
        bagHtml.push(`<div class="bag-slot empty"></div>`);
        continue;
      }
      const def = ITEMS[item.defId];
      if (!def) continue;
      const rCol = RARITY_INFO[def.rarity].color;
      const tInfo = getTierBadge(def);
      const badge =
        def.category === "equipment"
          ? item.enhanceLevel > 0
            ? `+${item.enhanceLevel}`
            : ""
          : `x${item.qty}`;
      bagHtml.push(`
        <button class="bag-slot stash-slot rarity-${def.rarity}" data-deposit-uid="${item.uid}" data-review-uid="${item.uid}" style="border-color:${rCol}" title="Click để cất vào Rương Cá Nhân">
          <canvas class="px-item-icon" width="32" height="32" data-icon-def="${def.id}" data-icon-enh="${item.enhanceLevel}"></canvas>
          <span class="slot-tier" style="color:${tInfo.color};background:${tInfo.bg}">${tInfo.badge}</span>
          ${badge ? `<span class="bag-badge">${badge}</span>` : ""}
        </button>
      `);
    }
    this.bagGridEl.innerHTML = bagHtml.join("");

    // Render Stash Chest Grid
    const stashHtml: string[] = [];
    for (let i = 0; i < MAX_STASH_SLOTS; i++) {
      const item = inv.stash[i];
      if (!item) {
        stashHtml.push(`<div class="bag-slot empty stash-empty"></div>`);
        continue;
      }
      const def = ITEMS[item.defId];
      if (!def) continue;
      const rCol = RARITY_INFO[def.rarity].color;
      const tInfo = getTierBadge(def);
      const badge =
        def.category === "equipment"
          ? item.enhanceLevel > 0
            ? `+${item.enhanceLevel}`
            : ""
          : `x${item.qty}`;
      stashHtml.push(`
        <button class="bag-slot stash-slot rarity-${def.rarity}" data-withdraw-uid="${item.uid}" data-review-uid="${item.uid}" style="border-color:${rCol}" title="Click để lấy về Túi Đồ">
          <canvas class="px-item-icon" width="32" height="32" data-icon-def="${def.id}" data-icon-enh="${item.enhanceLevel}"></canvas>
          <span class="slot-tier" style="color:${tInfo.color};background:${tInfo.bg}">${tInfo.badge}</span>
          ${badge ? `<span class="bag-badge">${badge}</span>` : ""}
        </button>
      `);
    }
    this.stashGridEl.innerHTML = stashHtml.join("");

    uiRarityFx.syncContainer(this.bagGridEl);
    uiRarityFx.syncContainer(this.stashGridEl);

    this.bagGridEl.querySelectorAll<HTMLButtonElement>("[data-deposit-uid]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const res = inv.depositToStash(btn.dataset.depositUid!);
        if (res.ok) {
          sfx.playUiClick();
          this.game.saveGame(false);
          this.game.refreshHud();
          this.statusEl.innerHTML = `<span style="color:#5ef2ff">→ Đã cất <b>${res.itemName}</b> vào Rương Cá Nhân.</span>`;
          this.render();
        } else {
          sfx.playForgeFail();
          this.statusEl.innerHTML = `<span style="color:#ff6688">⚠ ${res.reason}</span>`;
        }
      });
    });

    this.stashGridEl.querySelectorAll<HTMLButtonElement>("[data-withdraw-uid]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const res = inv.withdrawFromStash(btn.dataset.withdrawUid!);
        if (res.ok) {
          sfx.playBagOpen();
          this.game.saveGame(false);
          this.game.refreshHud();
          this.statusEl.innerHTML = `<span style="color:#44ee88">← Đã lấy <b>${res.itemName}</b> về Túi Đồ.</span>`;
          this.render();
        } else {
          sfx.playForgeFail();
          this.statusEl.innerHTML = `<span style="color:#ff6688">⚠ ${res.reason}</span>`;
        }
      });
    });
  }
}
