import { QUESTS, getQuestDef } from "../data/quests";
import type { QuestDef, QuestObjectiveKind, QuestProgress } from "../data/types";

export interface QuestRewardPayload {
  quest: QuestDef;
  gold: number;
  xp: number;
  items: { defId: string; qty: number }[];
}

/**
 * Manages the 8 sequential Story Quests and 2 repeatable Bounties,
 * NPC overhead markers (! / ?), and live Quest Tracker summaries.
 */
export class QuestSystem {
  progress: Record<string, QuestProgress> = {};

  reset() {
    this.progress = {};
    for (const q of QUESTS) {
      this.progress[q.id] = {
        questId: q.id,
        state: q.prereqQuestId ? "completed" : "available",
        counts: {},
        completions: 0,
      };
      if (q.prereqQuestId) {
        // Locked until prereq completes — track via helper instead of marking completed
        this.progress[q.id].state = "available";
      }
    }
  }

  loadState(saved: Record<string, QuestProgress>) {
    this.reset();
    for (const [id, p] of Object.entries(saved)) {
      if (this.progress[id]) {
        this.progress[id] = {
          questId: id,
          state: p.state,
          counts: { ...(p.counts ?? {}) },
          completions: p.completions ?? 0,
        };
      }
    }
  }

  exportState(): Record<string, QuestProgress> {
    const out: Record<string, QuestProgress> = {};
    for (const [id, p] of Object.entries(this.progress)) {
      out[id] = {
        questId: id,
        state: p.state,
        counts: { ...p.counts },
        completions: p.completions,
      };
    }
    return out;
  }

  isUnlocked(questId: string): boolean {
    const def = getQuestDef(questId);
    if (!def) return false;
    if (!def.prereqQuestId) return true;
    const pre = this.progress[def.prereqQuestId];
    return !!pre && (pre.state === "completed" || pre.completions > 0);
  }

  getState(questId: string): "locked" | "available" | "active" | "completable" | "completed" {
    if (!this.isUnlocked(questId)) return "locked";
    return this.progress[questId]?.state ?? "available";
  }

  getQuestsForNpc(npcId: string): { def: QuestDef; state: "available" | "active" | "completable" }[] {
    const list: { def: QuestDef; state: "available" | "active" | "completable" }[] = [];
    for (const q of QUESTS) {
      if (q.giverNpcId !== npcId) continue;
      const st = this.getState(q.id);
      if (st === "completable" || st === "available" || st === "active") {
        list.push({ def: q, state: st });
      }
    }
    // Sort completable first, then main quests, then available, then active
    const rank = { completable: 0, available: 1, active: 2 };
    list.sort((a, b) => rank[a.state] - rank[b.state] || Number(!!b.def.isMain) - Number(!!a.def.isMain));
    return list;
  }

  /** Returns "?" if NPC has a ready turn-in, "!" if NPC has a new quest, or null. */
  getNpcMarker(npcId: string): "?" | "!" | null {
    const list = this.getQuestsForNpc(npcId);
    if (list.some((q) => q.state === "completable")) return "?";
    if (list.some((q) => q.state === "available")) return "!";
    return null;
  }

  acceptQuest(questId: string): boolean {
    const def = getQuestDef(questId);
    if (!def || this.getState(questId) !== "available") return false;
    const p = this.progress[questId];
    p.state = "active";
    p.counts = {};
    for (const obj of def.objectives) {
      p.counts[obj.id] = 0;
    }
    return true;
  }

  turnInQuest(questId: string): QuestRewardPayload | null {
    const def = getQuestDef(questId);
    if (!def || this.getState(questId) !== "completable") return null;
    const p = this.progress[questId];
    p.completions += 1;
    p.counts = {};
    p.state = def.repeatable ? "available" : "completed";
    return {
      quest: def,
      gold: def.rewards.gold,
      xp: def.rewards.xp,
      items: def.rewards.items ? def.rewards.items.map((x) => ({ ...x })) : [],
    };
  }

  /** Records a world/combat event and returns titles of any quests that just became completable. */
  recordEvent(kind: QuestObjectiveKind, targetId?: string, amount = 1): QuestDef[] {
    const justCompleted: QuestDef[] = [];
    for (const def of QUESTS) {
      const p = this.progress[def.id];
      if (!p || p.state !== "active") continue;

      let touched = false;
      for (const obj of def.objectives) {
        if (obj.kind !== kind) continue;
        if (obj.targetId && obj.targetId !== targetId) continue;
        const cur = p.counts[obj.id] ?? 0;
        if (cur < obj.required) {
          p.counts[obj.id] = Math.min(obj.required, cur + amount);
          touched = true;
        }
      }

      if (touched) {
        const allDone = def.objectives.every((o) => (p.counts[o.id] ?? 0) >= o.required);
        if (allDone) {
          p.state = "completable";
          justCompleted.push(def);
        }
      }
    }
    return justCompleted;
  }

  getTrackedQuests(): { def: QuestDef; progress: QuestProgress }[] {
    const out: { def: QuestDef; progress: QuestProgress }[] = [];
    for (const def of QUESTS) {
      const p = this.progress[def.id];
      if (p && (p.state === "active" || p.state === "completable")) {
        out.push({ def, progress: p });
      }
    }
    out.sort((a, b) => Number(b.progress.state === "completable") - Number(a.progress.state === "completable"));
    return out;
  }
}
