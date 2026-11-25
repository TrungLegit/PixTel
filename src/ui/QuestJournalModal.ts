import { ITEMS, resolveClassReward } from "../data/items";
import { QUESTS } from "../data/quests";
import { TOWN_NPCS } from "../data/worldConfig";
import type { PixTelOpenWorldGame } from "../game";
import { sfx } from "../audio/chiptuneSynth";

/**
 * RPG Quest Journal Modal [J]: lists Active, Ready-to-Turn-In, Available, and Completed quests.
 */
export class QuestJournalModalUI {
  private game: PixTelOpenWorldGame;
  private root: HTMLElement;
  private bodyEl: HTMLElement;

  constructor(game: PixTelOpenWorldGame) {
    this.game = game;
    this.root = document.getElementById("modal-journal")!;
    this.bodyEl = document.getElementById("journal-body")!;

    document.getElementById("btn-close-journal")!.addEventListener("click", () => {
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
    const sections = {
      active: [] as string[],
      available: [] as string[],
      completed: [] as string[],
    };

    for (const q of QUESTS) {
      const st = this.game.quests.getState(q.id);
      if (st === "locked") continue;
      const p = this.game.quests.progress[q.id];
      const giver = TOWN_NPCS.find((n) => n.id === q.giverNpcId)?.name ?? "NPC";
      const allRewardEntries = [
        ...(q.rewards.items ?? []),
        ...(q.rewards.classRewards ?? []).map((key) => ({
          defId: resolveClassReward(this.game.player.classId, key),
          qty: 1,
        })),
      ];
      const rewards = allRewardEntries
        .map((r) => `${ITEMS[r.defId]?.name ?? r.defId} x${r.qty}`)
        .join(", ");

      const objs = q.objectives
        .map((o) => {
          const cur = p?.counts[o.id] ?? 0;
          const done = st === "completed" || cur >= o.required;
          return `<div class="j-obj ${done ? "done" : ""}">• ${o.label}: ${st === "completed" ? o.required : cur}/${o.required}</div>`;
        })
        .join("");

      const card = `
        <div class="quest-card state-${st}">
          <div class="quest-card-top">
            <div>
              <span class="quest-tag ${q.isMain ? "main" : "side"}">${q.isMain ? "CHÍNH TUYẾN" : "TRUY NÃ"}</span>
              <b>${q.title}</b>
            </div>
            <span class="j-giver">${giver}</span>
          </div>
          <div class="j-summary">${q.summary}</div>
          ${st === "active" || st === "completable" ? objs : ""}
          <div class="quest-reward">Thưởng: <b style="color:#ffe066">${q.rewards.gold}G</b> · <b style="color:#5ef2ff">${q.rewards.xp} XP</b>${rewards ? ` · <b style="color:#44ee88">${rewards}</b>` : ""}</div>
        </div>
      `;

      if (st === "active" || st === "completable") sections.active.push(card);
      else if (st === "available") sections.available.push(card);
      else sections.completed.push(card);
    }

    this.bodyEl.innerHTML = `
      <div class="section-hdr">ĐANG THỰC HIỆN (${sections.active.length})</div>
      ${sections.active.join("") || `<div class="detail-empty">Chưa có nhiệm vụ đang làm. Gặp Trưởng Làng Elian hoặc Thợ Rèn Kael ở Thị Trấn!</div>`}
      <div class="section-hdr">CÓ THỂ NHẬN (${sections.available.length})</div>
      ${sections.available.join("") || `<div class="detail-empty">Không có nhiệm vụ mới khả dụng lúc này.</div>`}
      <div class="section-hdr">ĐÃ HOÀN THÀNH (${sections.completed.length})</div>
      ${sections.completed.join("") || `<div class="detail-empty">Chưa hoàn thành nhiệm vụ cốt truyện nào.</div>`}
    `;
  }
}
