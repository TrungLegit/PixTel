import type { SaveDataV2 } from "../data/types";

const SAVE_KEY = "pixtel_openworld_save_v3";
const HIDDEN_UNLOCKS_KEY = "pixtel_hidden_unlocks_v1";

export class SaveSystem {
  loadHiddenUnlocks(): string[] {
    try {
      const raw = localStorage.getItem(HIDDEN_UNLOCKS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
    } catch {
      return [];
    }
  }

  saveHiddenUnlocks(ids: Iterable<string>): boolean {
    try {
      const unique = Array.from(new Set(ids));
      localStorage.setItem(HIDDEN_UNLOCKS_KEY, JSON.stringify(unique));
      return true;
    } catch {
      return false;
    }
  }

  clearHiddenUnlocks() {
    try {
      localStorage.removeItem(HIDDEN_UNLOCKS_KEY);
    } catch {
      // ignore storage failure
    }
  }
  hasSave(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as Partial<SaveDataV2>;
      return (parsed.version === 2 || parsed.version === 3) && !!parsed.classId && !!parsed.player;
    } catch {
      return false;
    }
  }

  load(): SaveDataV2 | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SaveDataV2;
      if ((parsed.version !== 2 && parsed.version !== 3) || !parsed.player) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  save(data: SaveDataV2): boolean {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  clear() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // ignore storage failure
    }
  }
}
