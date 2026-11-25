import { BIOME_CONFIGS, TILE_SIZE, WAYPOINTS, WORLD_CAMPS, WORLD_COLS, WORLD_ROWS } from "../data/worldConfig";
import type { PixTelOpenWorldGame } from "../game";
import { sfx } from "../audio/chiptuneSynth";

/**
 * Interactive Open-World Map Modal [M]:
 * - Live Bleached / Restored 160x160 world canvas
 * - Biome & Boss arena markers + live Player position
 * - Clickable unlocked Chroma Waypoints for instant Fast Travel!
 */
export class WorldMapModalUI {
  private game: PixTelOpenWorldGame;
  private root: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private listEl: HTMLElement;
  private statsEl: HTMLElement;

  constructor(game: PixTelOpenWorldGame) {
    this.game = game;
    this.root = document.getElementById("modal-world-map")!;
    this.canvas = document.getElementById("world-map-canvas") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.listEl = document.getElementById("waypoint-fast-list")!;
    this.statsEl = document.getElementById("world-map-stats")!;

    document.getElementById("btn-close-map")!.addEventListener("click", () => {
      sfx.playUiClick();
      this.game.setModal(null);
    });

    // Click directly on map canvas to Fast Travel to nearest unlocked waypoint
    this.canvas.addEventListener("click", (ev) => {
      const rect = this.canvas.getBoundingClientRect();
      const tx = ((ev.clientX - rect.left) / rect.width) * WORLD_COLS;
      const ty = ((ev.clientY - rect.top) / rect.height) * WORLD_ROWS;
      for (const wp of WAYPOINTS) {
        if (!this.game.colorSys.unlockedWaypoints.has(wp.id)) continue;
        if (Math.hypot(tx - wp.tx, ty - wp.ty) <= 10) {
          this.game.fastTravelTo(wp.id);
          return;
        }
      }
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
    this.game.tileRenderer.syncOverviewMap(this.game.world, this.game.colorSys);

    const ctx = this.ctx;
    const w = this.canvas.width; // 320
    const h = this.canvas.height; // 320
    const scale = w / WORLD_COLS; // 2x crisp pixel zoom

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.game.tileRenderer.overviewCanvas, 0, 0, w, h);

    // Biome labels
    ctx.font = "bold 10px 'Pixelify Sans Variable', monospace";
    ctx.textAlign = "center";
    const drawLbl = (text: string, tx: number, ty: number, col: string) => {
      const x = Math.round(tx * scale);
      const y = Math.round(ty * scale);
      ctx.fillStyle = "#0e0c18";
      ctx.fillRect(x - 46, y - 9, 92, 13);
      ctx.fillStyle = col;
      ctx.fillText(text, x, y + 1);
    };
    drawLbl("ĐỒNG CỎ (LV1-5)", 34, 16, "#7ef098");
    drawLbl("THẠCH ANH (LV5-10)", 126, 12, "#66f2ff");
    drawLbl("THỊ TRẤN", 80, 72, "#ffe066");
    drawLbl("HỔ PHÁCH (LV10-15)", 34, 152, "#ffaa44");
    drawLbl("PHẾ TÍCH (LV15-20)", 124, 152, "#e088ff");

    // Combat Farming Zones (orange diamonds) & Boss Arenas (red skulls)
    for (const camp of WORLD_CAMPS) {
      const x = Math.round(camp.tx * scale);
      const y = Math.round(camp.ty * scale);
      if (camp.id.includes("boss")) {
        ctx.fillStyle = "#100c18";
        ctx.fillRect(x - 5, y - 5, 10, 10);
        ctx.fillStyle = "#ff2e55";
        ctx.fillRect(x - 4, y - 4, 8, 8);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x - 2, y - 2, 1, 1);
        ctx.fillRect(x + 1, y - 2, 1, 1);
        ctx.fillRect(x - 2, y + 1, 4, 1);
      } else {
        ctx.fillStyle = "#100c18";
        ctx.fillRect(x - 3, y - 3, 6, 6);
        ctx.fillStyle = camp.hasLockedChest ? "#ffaa33" : "#ff7744";
        ctx.fillRect(x - 2, y - 2, 4, 4);
        ctx.fillStyle = "#fff4cc";
        ctx.fillRect(x - 1, y - 1, 1, 1);
      }
    }

    // Chroma Waypoints
    for (const wp of WAYPOINTS) {
      const x = Math.round(wp.tx * scale);
      const y = Math.round(wp.ty * scale);
      const on = this.game.colorSys.unlockedWaypoints.has(wp.id);
      ctx.fillStyle = "#0e0c18";
      ctx.fillRect(x - 5, y - 5, 10, 10);
      ctx.fillStyle = on ? "#38f2ff" : "#7c8291";
      ctx.fillRect(x - 4, y - 4, 8, 8);
      ctx.fillStyle = on ? "#ffffff" : "#3a3d45";
      ctx.fillRect(x - 2, y - 2, 4, 4);
    }

    // Player Marker
    const px = Math.round((this.game.player.x / TILE_SIZE) * scale);
    const py = Math.round((this.game.player.y / TILE_SIZE) * scale);
    ctx.fillStyle = "#100c18";
    ctx.fillRect(px - 4, py - 4, 9, 9);
    ctx.fillStyle = "#ffe066";
    ctx.fillRect(px - 3, py - 3, 7, 7);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(px - 1, py - 1, 3, 3);

    // Stats & Fast Travel Waypoint List
    const farmZoneCount = WORLD_CAMPS.filter((c) => !c.id.includes("boss")).length;
    const lock = this.game.activeBossLock;
    if (lock) {
      this.statsEl.innerHTML = `<span style="color:#ff5577">🔒 ĐANG PHONG ẤN TRONG LÃNH ĐỊA ${lock.bossName} — KHÔNG THỂ DỊCH CHUYỂN!</span> · Màu: ${this.game.colorSys.getProgressPct()}%`;
    } else {
      this.statsEl.textContent = `Khôi phục màu: ${this.game.colorSys.getProgressPct()}% · Trụ: ${this.game.colorSys.unlockedWaypoints.size}/${WAYPOINTS.length} · Khu Farm Quái: ${farmZoneCount}`;
    }

    this.listEl.innerHTML = WAYPOINTS.map((wp) => {
      const on = this.game.colorSys.unlockedWaypoints.has(wp.id);
      const bCfg = BIOME_CONFIGS[wp.biome];
      const canTp = on && !lock;
      const btnText = lock ? "🔒 BỊ KHÓA" : on ? "DỊCH CHUYỂN" : "CHƯA MỞ";
      return `
        <div class="wp-row ${on ? "on" : "off"}">
          <div>
            <div class="wp-name">${on ? "◆ " : "◇ "}${wp.name}</div>
            <div class="wp-biome">${bCfg.name} (${bCfg.levelRange})</div>
          </div>
          <button class="px-btn ${canTp ? "primary" : "disabled"}" data-tp="${wp.id}" ${lock ? "disabled" : ""}>
            ${btnText}
          </button>
        </div>
      `;
    }).join("");

    this.listEl.querySelectorAll("[data-tp]").forEach((el) => {
      el.addEventListener("click", () => {
        const id = (el as HTMLElement).dataset.tp!;
        if (this.game.colorSys.unlockedWaypoints.has(id)) {
          this.game.fastTravelTo(id);
        } else {
          sfx.playForgeFail();
        }
      });
    });
  }
}
