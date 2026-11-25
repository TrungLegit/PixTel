import { ITEMS, MERCHANT_STOCK, RARITY_INFO } from "../data/items";
import { TOWN_NPCS } from "../data/worldConfig";
import type { PixTelOpenWorldGame } from "../game";
import { sfx } from "../audio/chiptuneSynth";

/**
 * RPG NPC Dialogue Modal:
 * - Elder Elian: Accept / Turn-In Main & Bounty quests
 * - Blacksmith Kael: Launch Prism Forge + Mining Bounty quest
 * - Merchant Mira: Buy Potions & Materials + Quick-sell Common junk
 */
export class DialogueModalUI {
  private game: PixTelOpenWorldGame;
  private root: HTMLElement;
  private bodyEl: HTMLElement;
  private titleEl: HTMLElement;
  private currentNpcId = "npc_elder";

  constructor(game: PixTelOpenWorldGame) {
    this.game = game;
    this.root = document.getElementById("modal-dialogue")!;
    this.titleEl = document.getElementById("dialogue-npc-title")!;
    this.bodyEl = document.getElementById("dialogue-body")!;

    document.getElementById("btn-close-dialogue")!.addEventListener("click", () => {
      sfx.playUiClick();
      this.game.setModal(null);
    });
  }

  show(npcId: string) {
    this.currentNpcId = npcId;
    this.root.classList.remove("hidden");
    this.render();
  }

  hide() {
    this.root.classList.add("hidden");
  }

  render() {
    const npc = TOWN_NPCS.find((n) => n.id === this.currentNpcId) ?? TOWN_NPCS[0];
    this.titleEl.innerHTML = `<span style="color:${npc.accent}">${npc.name}</span> <small>— ${npc.role}</small>`;

    let html = `<div class="npc-speech">"${npc.greeting}"</div>`;

    // Blacksmith Forge launch button
    if (npc.kind === "blacksmith") {
      html += `
        <div class="npc-action-row">
          <button class="px-btn primary" data-action="open-forge">⚒ MỞ LÒ RÈN LĂNG KÍNH (Cường Hóa & Chế Tạo)</button>
        </div>
      `;
    }

    // Merchant Shop
    if (npc.kind === "merchant") {
      html += `<div class="section-hdr">CỬA HÀNG VẬT PHẨM (Vàng hiện có: <b style="color:#ffe066">${this.game.inv.gold} G</b>)</div>`;
      html += `<div class="shop-grid">`;
      for (const id of MERCHANT_STOCK) {
        const def = ITEMS[id];
        if (!def || !def.buyPrice) continue;
        const owned = this.game.inv.countItem(id);
        const canAfford = this.game.inv.gold >= def.buyPrice;
        html += `
          <div class="shop-item">
            <div class="shop-item-top">
              <span class="item-swatch" style="background:${def.iconColor}"></span>
              <div>
                <div style="color:${RARITY_INFO[def.rarity].color};font-weight:700">${def.name}</div>
                <div class="shop-desc">${def.desc}</div>
              </div>
            </div>
            <div class="shop-item-foot">
              <span class="shop-owned">Đang có: ${owned}</span>
              <button class="px-btn ${canAfford ? "good" : "disabled"}" data-buy="${def.id}">Mua · ${def.buyPrice}G</button>
            </div>
          </div>
        `;
      }
      html += `</div>`;
      html += `
        <div class="npc-action-row">
          <button class="px-btn warn" data-action="sell-common">Bán Nhanh Toàn Bộ Trang Bị Thường (Trắng) Trong Túi</button>
        </div>
      `;
    }

    // Quests offered by this NPC
    const quests = this.game.quests.getQuestsForNpc(npc.id);
    if (quests.length > 0) {
      html += `<div class="section-hdr">NHIỆM VỤ TỪ ${npc.name.toUpperCase()}</div>`;
      for (const { def, state } of quests) {
        const rewardItems = (def.rewards.items ?? [])
          .map((ri) => `${ITEMS[ri.defId]?.name ?? ri.defId} x${ri.qty}`)
          .join(", ");
        const speech =
          state === "completable"
            ? def.dialogueComplete
            : state === "active"
              ? def.dialogueActive
              : def.dialogueStart;

        const btnHtml =
          state === "completable"
            ? `<button class="px-btn good" data-turnin="${def.id}">★ TRẢ NHIỆM VỤ & NHẬN THƯỞNG</button>`
            : state === "available"
              ? `<button class="px-btn primary" data-accept="${def.id}">! NHẬN NHIỆM VỤ</button>`
              : `<span class="badge-active">ĐANG THỰC HIỆN</span>`;

        html += `
          <div class="quest-card state-${state}">
            <div class="quest-card-top">
              <div>
                <span class="quest-tag ${def.isMain ? "main" : "side"}">${def.isMain ? "CHÍNH TUYẾN" : "TRUY NÃ"}</span>
                <b>${def.title}</b>
              </div>
              ${btnHtml}
            </div>
            <div class="quest-speech">"${speech}"</div>
            <div class="quest-reward">Thưởng: <b style="color:#ffe066">${def.rewards.gold}G</b> · <b style="color:#5ef2ff">${def.rewards.xp} XP</b>${rewardItems ? ` · <b style="color:#44ee88">${rewardItems}</b>` : ""}</div>
          </div>
        `;
      }
    } else if (npc.kind === "elder") {
      html += `<div class="quest-done-note">Tất cả nhiệm vụ cốt truyện đã hoàn tất! Bạn đã trở thành Huyền Thoại của PIXTEL!</div>`;
    }

    this.bodyEl.innerHTML = html;

    // Bind dynamic buttons
    this.bodyEl.querySelectorAll("[data-action='open-forge']").forEach((el) => {
      el.addEventListener("click", () => {
        sfx.playUiClick();
        this.game.setModal("forge");
      });
    });

    this.bodyEl.querySelectorAll("[data-buy]").forEach((el) => {
      el.addEventListener("click", () => {
        const defId = (el as HTMLElement).dataset.buy!;
        const def = ITEMS[defId];
        if (!def || !def.buyPrice) return;
        if (this.game.inv.gold < def.buyPrice) {
          sfx.playForgeFail();
          this.game.uiToast("Không đủ Vàng!", "warn");
          return;
        }
        if (!this.game.inv.addItem(defId, 1, 0)) {
          this.game.uiToast("Túi đồ đã đầy (32/32)!", "warn");
          return;
        }
        this.game.inv.gold -= def.buyPrice;
        sfx.playBuy();
        this.game.uiToast(`Đã mua ${def.name}!`, "good");
        this.render();
      });
    });

    this.bodyEl.querySelectorAll("[data-action='sell-common']").forEach((el) => {
      el.addEventListener("click", () => {
        let earned = 0;
        let sold = 0;
        const commons = this.game.inv.bag.filter((b) => {
          const d = ITEMS[b.defId];
          return d && d.category === "equipment" && d.rarity === "common" && b.enhanceLevel === 0;
        });
        for (const it of commons) {
          earned += this.game.inv.sellBagItem(it.uid);
          sold++;
        }
        if (sold > 0) {
          sfx.playBuy();
          this.game.uiToast(`Đã bán ${sold} trang bị Thường, thu về +${earned} G!`, "good");
          this.render();
        } else {
          this.game.uiToast("Không có trang bị Thường (+0) nào trong túi để bán.", "info");
        }
      });
    });

    this.bodyEl.querySelectorAll("[data-accept]").forEach((el) => {
      el.addEventListener("click", () => {
        const qid = (el as HTMLElement).dataset.accept!;
        if (this.game.quests.acceptQuest(qid)) {
          sfx.playQuestComplete();
          this.game.uiToast("Đã nhận nhiệm vụ mới! Xem tiến độ ở góc phải hoặc nhấn [J].", "good");
          this.game.saveGame(false);
          this.render();
        }
      });
    });

    this.bodyEl.querySelectorAll("[data-turnin]").forEach((el) => {
      el.addEventListener("click", () => {
        const qid = (el as HTMLElement).dataset.turnin!;
        const reward = this.game.quests.turnInQuest(qid);
        if (!reward) return;
        this.game.inv.gold += reward.gold;
        for (const ri of reward.items) {
          this.game.inv.addItem(ri.defId, ri.qty, 0);
        }
        this.game.gainXp(reward.xp);
        sfx.playLevelUp();
        this.game.uiToast(`Hoàn thành "${reward.quest.title}"! +${reward.gold}G, +${reward.xp} XP!`, "epic");
        this.game.saveGame(false);
        this.render();
      });
    });
  }
}
