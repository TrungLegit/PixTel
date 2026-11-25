import { WORLD_COLS, WORLD_ROWS, TILE_SIZE, WAYPOINTS } from "../data/worldConfig";

export interface ActiveColorWave {
  wx: number;
  wy: number;
  r: number;
  maxR: number;
  speed: number;
}

/**
 * Tracks per-tile Color Restoration across the 160x160 seamless open world,
 * unlocked Chroma Waypoints, and animated expanding color-restoration waves.
 */
export class ColorRestorationSystem {
  readonly cols = WORLD_COLS;
  readonly rows = WORLD_ROWS;
  readonly restoredGrid = new Uint8Array(WORLD_COLS * WORLD_ROWS);
  readonly unlockedWaypoints = new Set<string>();
  readonly waves: ActiveColorWave[] = [];
  restoredCount = 0;
  dirtyMapPixels = true;

  reset() {
    this.restoredGrid.fill(0);
    this.unlockedWaypoints.clear();
    this.waves.length = 0;
    this.restoredCount = 0;
    this.dirtyMapPixels = true;

    // Origin Town waypoint starts unlocked so the safe town glows with color!
    for (const wp of WAYPOINTS) {
      if (wp.initiallyUnlocked) {
        this.unlockedWaypoints.add(wp.id);
        this.revealInstant(wp.tx * TILE_SIZE + 8, wp.ty * TILE_SIZE + 8, wp.restoreRadiusTiles * TILE_SIZE);
      }
    }
  }

  loadUnlocked(ids: string[]) {
    this.reset();
    for (const id of ids) {
      const wp = WAYPOINTS.find((w) => w.id === id);
      if (wp && !this.unlockedWaypoints.has(wp.id)) {
        this.unlockedWaypoints.add(wp.id);
        this.revealInstant(wp.tx * TILE_SIZE + 8, wp.ty * TILE_SIZE + 8, wp.restoreRadiusTiles * TILE_SIZE);
      }
    }
  }

  isTileRestored(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= this.cols || ty >= this.rows) return false;
    return this.restoredGrid[ty * this.cols + tx] === 1;
  }

  isWorldPosRestored(wx: number, wy: number): boolean {
    return this.isTileRestored(Math.floor(wx / TILE_SIZE), Math.floor(wy / TILE_SIZE));
  }

  triggerWave(wx: number, wy: number, maxRadiusPx: number, speedPxPerSec = 260) {
    this.waves.push({ wx, wy, r: 8, maxR: maxRadiusPx, speed: speedPxPerSec });
  }

  revealInstant(wx: number, wy: number, radiusPx: number): number {
    const ts = TILE_SIZE;
    const tx0 = Math.max(0, Math.floor((wx - radiusPx) / ts));
    const tx1 = Math.min(this.cols - 1, Math.floor((wx + radiusPx) / ts));
    const ty0 = Math.max(0, Math.floor((wy - radiusPx) / ts));
    const ty1 = Math.min(this.rows - 1, Math.floor((wy + radiusPx) / ts));
    const r2 = radiusPx * radiusPx;
    let newly = 0;

    for (let ty = ty0; ty <= ty1; ty++) {
      const row = ty * this.cols;
      for (let tx = tx0; tx <= tx1; tx++) {
        if (this.restoredGrid[row + tx]) continue;
        const dx = tx * ts + ts * 0.5 - wx;
        const dy = ty * ts + ts * 0.5 - wy;
        if (dx * dx + dy * dy <= r2) {
          this.restoredGrid[row + tx] = 1;
          this.restoredCount++;
          newly++;
        }
      }
    }
    if (newly > 0) this.dirtyMapPixels = true;
    return newly;
  }

  update(dt: number) {
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.r += w.speed * dt;
      this.revealInstant(w.wx, w.wy, Math.min(w.r, w.maxR));
      if (w.r >= w.maxR) {
        this.waves.splice(i, 1);
      }
    }
  }

  getProgressPct(): number {
    return Math.min(100, Math.round((this.restoredCount / (this.cols * this.rows)) * 100));
  }
}
