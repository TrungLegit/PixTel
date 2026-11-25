import { ITEMS, resolveClassReward } from "../data/items";
import { BOSS_CODEX, LORE_TABLETS, WORLD_PROLOGUE } from "../data/lore";
import { QUESTS } from "../data/quests";
import { BIOME_CONFIGS, TOWN_NPCS } from "../data/worldConfig";
import type { PixTelOpenWorldGame } from "../game";
import { sfx } from "../audio/chiptuneSynth";

/**
 * RPG Quest Journal & Lore Codex Modal [J]:
 * - Tab 1: Active, Available & Completed Story Quests (with Act chapters & lore quotes)
 * - Tab 2: Biên Niên Sử Aethel-16 (World Prologue, 8 Ancient Lore Tablets & 4 Boss Codex Profiles)
 */
export class QuestJournalModalUI {
  private game: PixTelOpenWorldGame;
  private root: HTMLElement;
  private bodyEl: HTMLElement;
  private tab: "quests" | "lore" = "quests";
  private focusedLoreId: string | null = null;

  constructor(game: PixTelOpenWorldGame) {
    this.game = game;
    this.root = document.getElementById("modal-journal")!;
    this.bodyEl = document.getElementById("journal-body")!;

    document.getElementById("btn-close-journal")!.addEventListener("click", () => {
      sfx.playUiClick();
      this.game.setModal(null);
    });
  }

  show(payload?: { tab?: "quests" | "lore"; loreId?: string }) {
    if (payload?.tab) this.tab = payload.tab;
    this.focusedLoreId = payload?.loreId ?? null;
    this.root.classList.remove("hidden");
    this.render();
  }

  hide() {
    this.root.classList.add("hidden");
  }

  render() {
    const loreCount = this.game.discoveredLore.size;
    const navHtml = `
      <div style="display:flex;gap:8px;margin-bottom:10px;border-bottom:2px solid #353954;padding-bottom:8px">
        <button class="px-btn ${this.tab === "quests" ? "active" : ""}" id="j-tab-quests">
          📜 NHIỆM VỤ & HỒI TRUYỆN
        </button>
        <button class="px-btn ${this.tab === "lore" ? "active" : ""}" id="j-tab-lore">
          📖 BIÊN NIÊN SỬ & THỦ LĨNH (${loreCount}/${LORE_TABLETS.length} BIA KÝ)
        </button>
      </div>
    `;

    const contentHtml = this.tab === "quests" ? this._buildQuestsHtml() : this._buildLoreHtml();
    this.bodyEl.innerHTML = navHtml + contentHtml;

    this.bodyEl.querySelector("#j-tab-quests")?.addEventListener("click", () => {
      sfx.playUiClick();
      this.tab = "quests";
      this.focusedLoreId = null;
      this.render();
    });
    this.bodyEl.querySelector("#j-tab-lore")?.addEventListener("click", () => {
      sfx.playUiClick();
      this.tab = "lore";
      this.render();
    });

    if (this.focusedLoreId) {
      const targetEl = this.bodyEl.querySelector(`[data-lore-card="${this.focusedLoreId}"]`);
      targetEl?.scrollIntoView({ behavior: "instant", block: "center" });
    }
  }

  private _buildQuestsHtml(): string {
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
      const allRewards = [
        ...(q.rewards.items ?? []),
        ...(q.rewards.classRewards ?? []).map((key) => ({
          defId: resolveClassReward(this.game.player.classId, key),
          qty: 1,
        })),
      ];
      const rewards = allRewards
        .map((r) => `${ITEMS[r.defId]?.name ?? r.defId} x${r.qty}`)
        .join(", ");

      const objs = q.objectives
        .map((o) => {
          const cur = p?.counts[o.id] ?? 0;
          const done = st === "completed" || cur >= o.required;
          return `<div class="j-obj ${done ? "done" : ""}">• ${o.label}: ${st === "completed" ? o.required : cur}/${o.required}</div>`;
        })
        .join("");

      const chapterBadge = q.chapter
        ? `<div style="font-size:10px;color:#5ef2ff;font-weight:700;margin-bottom:2px">${q.chapter}</div>`
        : "";
      const loreQuote = q.loreNote
        ? `<div style="font-size:11px;color:#b8c2e0;font-style:italic;margin:4px 0;padding-left:6px;border-left:2px solid #4be8ff">"${q.loreNote}"</div>`
        : "";

      const card = `
        <div class="quest-card state-${st}">
          ${chapterBadge}
          <div class="quest-card-top">
            <div>
              <span class="quest-tag ${q.isMain ? "main" : "side"}">${q.isMain ? "CHÍNH TUYẾN" : "TRUY NÃ"}</span>
              <b>${q.title}</b>
            </div>
            <span class="j-giver">${giver}</span>
          </div>
          <div class="j-summary">${q.summary}</div>
          ${loreQuote}
          ${st === "active" || st === "completable" ? objs : ""}
          <div class="quest-reward">Thưởng: <b style="color:#ffe066">${q.rewards.gold}G</b> · <b style="color:#5ef2ff">${q.rewards.xp} XP</b>${rewards ? ` · <b style="color:#44ee88">${rewards}</b>` : ""}</div>
        </div>
      `;

      if (st === "active" || st === "completable") sections.active.push(card);
      else if (st === "available") sections.available.push(card);
      else sections.completed.push(card);
    }

    return `
      <div class="section-hdr">ĐANG THỰC HIỆN (${sections.active.length})</div>
      ${sections.active.join("") || `<div class="detail-empty">Chưa có nhiệm vụ đang làm. Gặp Trưởng Làng Elian, Thợ Rèn Kael hoặc Thương Nhân Mira ở Thị Trấn!</div>`}
      <div class="section-hdr">CÓ THỂ NHẬN (${sections.available.length})</div>
      ${sections.available.join("") || `<div class="detail-empty">Không có nhiệm vụ mới khả dụng lúc này.</div>`}
      <div class="section-hdr">ĐÃ HOÀN THÀNH (${sections.completed.length})</div>
      ${sections.completed.join("") || `<div class="detail-empty">Chưa hoàn thành nhiệm vụ cốt truyện nào.</div>`}
    `;
  }

  private _buildLoreHtml(): string {
    const prologueHtml = `
      <div class="quest-card" style="border-color:#ffe066;background:#161429">
        <div style="color:#ffe066;font-weight:700;font-size:14px;margin-bottom:4px">
          ✦ ${WORLD_PROLOGUE.worldName} — ${WORLD_PROLOGUE.headline}
        </div>
        ${WORLD_PROLOGUE.paragraphs
          .map((p) => `<p style="margin:5px 0;font-size:12px;color:#dce4ff;line-height:1.45">${p}</p>`)
          .join("")}
      </div>
    `;

    const tabletsHtml = LORE_TABLETS.map((t, idx) => {
      const unlocked = this.game.discoveredLore.has(t.id);
      const isFocused = this.focusedLoreId === t.id;
      const biomeName = BIOME_CONFIGS[t.biome].name;
      if (!unlocked) {
        return `
          <div class="quest-card" style="border-color:#353954;opacity:0.8">
            <div style="display:flex;justify-content:space-between;font-size:12px">
              <b style="color:#8b95b5">🔒 Bia Ký #${idx + 1}: ??? (${t.chapter})</b>
              <span style="color:#5ef2ff;font-size:11px">Vị trí: ${biomeName} (${t.tx}, ${t.ty})</span>
            </div>
            <div style="font-size:11px;color:#777c91;margin-top:3px">
              Hãy tìm Bia Đá Cổ phát sáng trên bản đồ (chấm tím trên Minimap) và nhấn [F] để giải mã ký ức này!
            </div>
          </div>
        `;
      }
      return `
        <div class="quest-card" data-lore-card="${t.id}" style="border-color:${isFocused ? "#ffe066" : t.accent};background:${isFocused ? "#1f1b38" : "#151424"}">
          <div style="font-size:10px;color:${t.accent};font-weight:700">${t.chapter} · ${biomeName}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0 5px">
            <b style="font-size:14px;color:#ffffff">★ Bia Ký #${idx + 1}: ${t.title}</b>
            <span style="font-size:11px;color:#ffe066">— ${t.author}</span>
          </div>
          ${t.body
            .map((para) => `<p style="margin:5px 0;font-size:12px;color:#e4ebff;line-height:1.45">${para}</p>`)
            .join("")}
        </div>
      `;
    }).join("");

    const bossesHtml = BOSS_CODEX.map((b) => {
      return `
        <div class="quest-card" style="border-color:#ff3b5c">
          <div style="font-size:10px;color:#ff8899;font-weight:700">${b.chapter} · ${b.biomeLabel}</div>
          <div style="font-size:13px;font-weight:700;color:#ffe066;margin:2px 0">${b.name}</div>
          <div style="font-size:11px;color:#9ba4bf;margin-bottom:4px"><i>${b.title}</i></div>
          <div style="font-size:12px;color:#edf2ff;margin-bottom:5px">${b.lore}</div>
          <div style="font-size:11px;color:#44ee88"><b>💡 Chiến thuật khắc chế:</b> ${b.weaknessHint}</div>
        </div>
      `;
    }).join("");

    return `
      ${prologueHtml}
      <div class="section-hdr">8 BIA KÝ LĂNG KÍNH CỔ XƯA (${this.game.discoveredLore.size}/${LORE_TABLETS.length})</div>
      ${tabletsHtml}
      <div class="section-hdr">HỒ SƠ 4 THỦ LĨNH & THE ERASER</div>
      ${bossesHtml}
    `;
  }
}
