import type { SaveDataV2 } from "../data/types";

const SAVE_KEY = "pixtel_openworld_save_v3";

export class SaveSystem {
  hasSave(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as Partial<SaveDataV2>;
      return parsed.version === 3 && !!parsed.classId && !!parsed.player;
    } catch {
      return false;
    }
  }

  load(): SaveDataV2 | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SaveDataV2;
      if (parsed.version !== 3 || !parsed.player) return null;
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
