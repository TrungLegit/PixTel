import { ITEMS, MERCHANT_STOCK, RARITY_INFO, getTierBadge, resolveClassReward } from "../data/items";
import { TOWN_NPCS } from "../data/worldConfig";
import { onCodixelReady } from "../graphics/codixelAtlas";
import { uiRarityFx } from "../vfx/uiRarityFx";
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

    onCodixelReady(() => {
      if (!this.root.classList.contains("hidden")) {
        this.render();
      }
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
          <button class="px-btn primary" data-action="open-forge">✡ MỞ MA TRẬN LUYỆN KHÍ (Luyện Trận, Khảm Sắc & Chế Tạo)</button>
        </div>
      `;
    }

    // Merchant Shop
    if (npc.kind === "merchant") {
      html += `<div class="section-hdr">CỬA HÀNG VẬT PHẨM (Vàng hiện có: <b style="color:#ffe066">${this.game.inv.gold} G</b>)</div>`;
      const groups: { title: string; ids: string[] }[] = [
        {
          title: "Dược Phẩm Tiêu Thụ (Đa Tier)",
          ids: MERCHANT_STOCK.filter((id) => ITEMS[id]?.category === "consumable"),
        },
        {
          title: "Vũ Khí & Trang Bị",
          ids: MERCHANT_STOCK.filter((id) => ITEMS[id]?.category === "equipment"),
        },
        {
          title: "Nguyên Liệu Rèn",
          ids: MERCHANT_STOCK.filter((id) => ITEMS[id]?.category === "material"),
        },
      ];

      for (const g of groups) {
        if (g.ids.length === 0) continue;
        html += `<div class="shop-cat-hdr">${g.title}</div><div class="shop-grid">`;
        for (const id of g.ids) {
          const def = ITEMS[id];
          if (!def || !def.buyPrice) continue;
          const owned = this.game.inv.countItem(id);
          const canAfford = this.game.inv.gold >= def.buyPrice;
          const tInfo = getTierBadge(def);
          html += `
            <div class="shop-item rarity-${def.rarity}" data-review-def="${def.id}" style="border-color:${RARITY_INFO[def.rarity].color}">
              <div class="shop-item-top">
                <canvas class="px-item-icon" width="32" height="32" data-icon-def="${def.id}" data-icon-enh="0"></canvas>
                <div>
                  <div style="color:${RARITY_INFO[def.rarity].color};font-weight:700">
                    <span class="tier-pill" style="color:${tInfo.color};background:${tInfo.bg}">${tInfo.badge}</span>
                    ${def.name}
                  </div>
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
      }
      html += `
        <div class="npc-action-row">
          <button class="px-btn warn" data-action="open-quicksell">💰 MỞ BÁN NHANH (CHỌN ĐỒ KHÁC CLASS &amp; ĐỒ DƯ)</button>
        </div>
      `;
    }

    // Quests offered by this NPC
    const quests = this.game.quests.getQuestsForNpc(npc.id);
    if (quests.length > 0) {
      html += `<div class="section-hdr">NHIỆM VỤ TỪ ${npc.name.toUpperCase()}</div>`;
      for (const { def, state } of quests) {
        const allRewards = [
          ...(def.rewards.items ?? []),
          ...(def.rewards.classRewards ?? []).map((key) => ({
            defId: resolveClassReward(this.game.player.classId, key),
            qty: 1,
          })),
        ];
        const rewardItems = allRewards
          .map(
            (ri) =>
              `<span class="reward-item-pill" data-review-def="${ri.defId}">${ITEMS[ri.defId]?.name ?? ri.defId} x${ri.qty}</span>`
          )
          .join(", ");
        const speech =
          state === "completable"
            ? def.dialogueComplete
            : state === "active"
              ? def.dialogueActive
              : def.dialogueStart;

        const qCat = def.category ?? (def.isMain ? "main" : "bounty");
        const qTagClass = qCat === "main" ? "main" : qCat === "side" ? "side-chain" : "side";
        const qTagLabel = qCat === "main" ? "CHÍNH TUYẾN" : qCat === "side" ? "NHIỆM VỤ PHỤ" : "TRUY NÃ";
        const metaHint = [
          def.chainName,
          def.recommendedLevel ? `LV.${def.recommendedLevel}` : "",
        ]
          .filter(Boolean)
          .join(" · ");

        const btnHtml =
          state === "completable"
            ? `<button class="px-btn good" data-turnin="${def.id}">★ TRẢ NHIỆM VỤ & NHẬN THƯỞNG</button>`
            : state === "available"
              ? `<button class="px-btn primary" data-accept="${def.id}">! NHẬN NHIỆM VỤ</button>`
              : `<span class="badge-active">ĐANG THỰC HIỆN</span>`;

        html += `
          <div class="quest-card state-${state}">
            ${metaHint ? `<div class="quest-chain-hint">${metaHint}</div>` : ""}
            <div class="quest-card-top">
              <div>
                <span class="quest-tag ${qTagClass}">${qTagLabel}</span>
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

    // Paint codixel icons & attach live pixelfx high-rarity slot auras
    uiRarityFx.syncContainer(this.bodyEl);

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
        this.game.refreshHud();
        this.render();
      });
    });

    this.bodyEl.querySelectorAll("[data-action='open-quicksell']").forEach((el) => {
      el.addEventListener("click", () => {
        sfx.playUiClick();
        this.game.setModal("inventory", { quickSell: true });
      });
    });

    this.bodyEl.querySelectorAll("[data-accept]").forEach((el) => {
      el.addEventListener("click", () => {
        const qid = (el as HTMLElement).dataset.accept!;
        if (this.game.quests.acceptQuest(qid)) {
          sfx.playQuestComplete();
          this.game.uiToast("Đã nhận nhiệm vụ mới! Xem tiến độ ở góc phải hoặc nhấn [J].", "good");
          this.game.saveGame(false);
          this.game.refreshHud();
          this.render();
        }
      });
    });

    this.bodyEl.querySelectorAll("[data-turnin]").forEach((el) => {
      el.addEventListener("click", () => {
        const qid = (el as HTMLElement).dataset.turnin!;
        const reward = this.game.quests.turnInQuest(qid, this.game.player.classId);
        if (!reward) return;
        this.game.inv.gold += reward.gold;
        for (const ri of reward.items) {
          this.game.inv.addItem(ri.defId, ri.qty, 0);
        }
        this.game.gainXp(reward.xp);
        sfx.playLevelUp();
        this.game.uiToast(`Hoàn thành "${reward.quest.title}"! +${reward.gold}G, +${reward.xp} XP!`, "epic");
        this.game.saveGame(false);
        this.game.refreshHud();
        this.render();
      });
    });
  }
}
