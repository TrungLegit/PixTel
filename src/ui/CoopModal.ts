import { getClassDef } from "../data/classes";
import { MAX_COOP_PLAYERS, normalizeRoomCode, type CoopTransportMode } from "../net/protocol";
import { sfx } from "../audio/chiptuneSynth";
import { DEFAULT_HERO_NAME, sanitizePlayerName } from "../utils/playerName";
import type { PixTelOpenWorldGame } from "../game";

const NAME_STORAGE_KEY = "pixtel_coop_nickname_v1";

/**
 * Phase 2 Co-op Multiplayer Modal (`[P]`):
 * - Supports 2–4 Player Online Co-op via 6-character Room Code!
 * - Mode 1 (`webrtc`): Serverless WebRTC Room Code (works right on GitHub Pages & Mobile phones over 4G/Wi-Fi without running any server!).
 * - Mode 2 (`ws`): Dedicated Node.js WebSocket Room Server (`ws://...` via `npm run server`).
 */
export class CoopModalUI {
  private game: PixTelOpenWorldGame;
  private root: HTMLElement;
  private bodyEl: HTMLElement;
  private joinCodeDraft = "";
  private busy = false;

  constructor(game: PixTelOpenWorldGame) {
    this.game = game;
    this.root = document.getElementById("modal-coop")!;
    this.bodyEl = document.getElementById("coop-body")!;

    try {
      const savedName = localStorage.getItem(NAME_STORAGE_KEY);
      if (savedName !== null) {
        const clean = sanitizePlayerName(savedName, DEFAULT_HERO_NAME);
        if (clean !== savedName) {
          localStorage.setItem(NAME_STORAGE_KEY, clean);
        }
        this.game.coop.playerName = clean;
      }
    } catch {
      // ignore storage errors
    }

    document.getElementById("btn-close-coop")!.addEventListener("click", () => {
      sfx.playUiClick();
      this.game.closeCoopModal();
    });
  }

  setDraftCode(code: string) {
    this.joinCodeDraft = normalizeRoomCode(code);
  }

  show(prefillCode?: string) {
    if (prefillCode) this.joinCodeDraft = normalizeRoomCode(prefillCode);
    this.root.classList.remove("hidden");
    this.render();
  }

  hide() {
    this.root.classList.add("hidden");
  }

  render() {
    if (this.root.classList.contains("hidden")) return;
    const coop = this.game.coop;

    if (coop.isConnected) {
      this._renderConnectedRoom();
    } else {
      this._renderLobbySetup();
    }
  }

  private _saveNickname(name: string) {
    const clean = sanitizePlayerName(name, DEFAULT_HERO_NAME);
    this.game.coop.playerName = clean;
    try {
      localStorage.setItem(NAME_STORAGE_KEY, clean);
    } catch {
      // ignore
    }
  }

  private _renderLobbySetup() {
    const coop = this.game.coop;
    const statusHtml =
      coop.status === "connecting"
        ? `<div class="coop-status-banner connecting">⏳ ${coop.statusDetail || "Đang kết nối..."}</div>`
        : coop.status === "error"
          ? `<div class="coop-status-banner error">⚠ ${coop.statusDetail}</div>`
          : "";

    this.bodyEl.innerHTML = `
      ${statusHtml}
      <div class="tut-hero-callout">
        <div>
          <div class="tut-callout-title">🤝 TỔ ĐỘI CO-OP THẾ GIỚI MỞ (TỐI ĐA ${MAX_COOP_PLAYERS} NGƯỜI CHƠI)</div>
          <div class="tut-callout-sub">
            Cùng bạn bè trên <b>Điện Thoại & Máy Tính</b> khám phá Aethel-16, phối hợp <b>9 Nguyên Tố (Primer + Detonator)</b>, thắp sáng <b>Trụ Sắc Màu</b> và đánh bại <b>The Eraser</b>! Vật phẩm rơi & XP được chia <b>riêng cho từng người (Instanced Loot)</b>.
          </div>
        </div>
      </div>

      <div class="coop-form-row">
        <div class="coop-field">
          <label>Biệt danh hiển thị trên đầu nhân vật:</label>
          <input id="coop-inp-name" class="px-input" type="text" maxlength="16" value="${coop.playerName}" placeholder="Nhập tên của bạn..." />
        </div>
        <div class="coop-field">
          <label>Phương thức kết nối mạng:</label>
          <div class="coop-mode-tabs">
            <button class="px-btn sm ${coop.mode === "webrtc" ? "active primary" : ""}" data-coop-mode="webrtc">
              🌐 Online Trực Tiếp (Web / Mobile P2P)
            </button>
            <button class="px-btn sm ${coop.mode === "ws" ? "active primary" : ""}" data-coop-mode="ws">
              🖥 Dedicated Server (WebSocket)
            </button>
          </div>
        </div>
      </div>

      ${
        coop.mode === "ws"
          ? `
          <div class="coop-field">
            <label>Địa chỉ WebSocket Server (Chạy <code>npm run server</code> hoặc URL Cloud Server):</label>
            <input id="coop-inp-ws" class="px-input" type="text" value="${coop.wsServerUrl}" placeholder="ws://127.0.0.1:8787 hoặc wss://..." />
          </div>
        `
          : `
          <div class="tut-note-strip">
            💡 <b>Chế độ Online Trực Tiếp (WebRTC):</b> Hoạt động ngay trên link web chính thức không cần cài đặt Server! Tạo phòng lấy <b>Mã 6 Ký Tự</b> (hoặc gửi Link Mời) cho bạn bè trên điện thoại/PC vào chung ngay.
          </div>
        `
      }

      <div class="coop-split-cards">
        <div class="coop-action-card" style="border-color:#44ee88">
          <div class="coop-card-title" style="color:#44ee88">🌟 TẠO PHÒNG CO-OP MỚI (HOST)</div>
          <p>Mở phòng Co-op trên thế giới hiện tại của bạn (giữ nguyên tiến độ Trụ Sắc Màu & Boss). Bạn bè dùng Mã Phòng để tham gia ngay!</p>
          <button id="btn-coop-host" class="px-btn good big" ${this.busy ? "disabled" : ""}>
            ${this.busy ? "⏳ ĐANG KHỞI TẠO..." : "➕ TẠO PHÒNG & LẤY MÃ"}
          </button>
        </div>

        <div class="coop-action-card" style="border-color:#5ef2ff">
          <div class="coop-card-title" style="color:#5ef2ff">🚀 THAM GIA PHÒNG BẠN BÈ (GUEST)</div>
          <p>Nhập <b>Mã Phòng 6 ký tự</b> do Chủ phòng gửi để đồng bộ vào thế giới của đội:</p>
          <div class="coop-join-row">
            <input id="coop-inp-code" class="px-input code-input" type="text" maxlength="8" value="${this.joinCodeDraft}" placeholder="VD: PX84K9" />
            <button id="btn-coop-join" class="px-btn primary big" ${this.busy ? "disabled" : ""}>
              VÀO PHÒNG
            </button>
          </div>
        </div>
      </div>
    `;

    const nameInp = this.bodyEl.querySelector("#coop-inp-name") as HTMLInputElement | null;
    const wsInp = this.bodyEl.querySelector("#coop-inp-ws") as HTMLInputElement | null;
    const codeInp = this.bodyEl.querySelector("#coop-inp-code") as HTMLInputElement | null;

    this.bodyEl.querySelectorAll("[data-coop-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        sfx.playUiClick();
        if (nameInp) this._saveNickname(nameInp.value);
        if (codeInp) this.joinCodeDraft = normalizeRoomCode(codeInp.value);
        this.game.coop.mode = (btn as HTMLElement).dataset.coopMode as CoopTransportMode;
        this.render();
      });
    });

    this.bodyEl.querySelector("#btn-coop-host")?.addEventListener("click", async () => {
      if (this.busy) return;
      sfx.playUiClick();
      if (nameInp) this._saveNickname(nameInp.value);
      if (wsInp) this.game.coop.wsServerUrl = wsInp.value.trim();
      const wasAtTitle = !this.game.running;
      this.busy = true;
      this.render();
      try {
        if (wasAtTitle) {
          this.game.startNewGame(this.game.player.classId, false);
          this.game.coopReturnModal = null;
          this.game.setModal("coop");
        }
        await this.game.hostCoopSession();
      } catch {
        if (wasAtTitle) this.game.setModal("coop");
      } finally {
        this.busy = false;
        this.render();
      }
    });

    this.bodyEl.querySelector("#btn-coop-join")?.addEventListener("click", async () => {
      if (this.busy) return;
      sfx.playUiClick();
      if (nameInp) this._saveNickname(nameInp.value);
      if (wsInp) this.game.coop.wsServerUrl = wsInp.value.trim();
      const rawCode = codeInp?.value ?? this.joinCodeDraft;
      this.joinCodeDraft = normalizeRoomCode(rawCode);
      const wasAtTitle = !this.game.running;
      this.busy = true;
      this.render();
      try {
        if (wasAtTitle) {
          this.game.startNewGame(this.game.player.classId, false);
          this.game.coopReturnModal = null;
          this.game.setModal("coop");
        }
        await this.game.joinCoopSession(this.joinCodeDraft);
        if (wasAtTitle) {
          this.game.setModal(null);
        }
      } catch {
        if (wasAtTitle) this.game.setModal("coop");
      } finally {
        this.busy = false;
        this.render();
      }
    });
  }

  private _renderConnectedRoom() {
    const coop = this.game.coop;
    const p = this.game.player;
    const myCls = getClassDef(p.classId);
    const remotes = Array.from(this.game.remotePlayers.values());
    const totalCount = 1 + remotes.length;
    const inviteUrl = coop.getInviteUrl();

    const memberRows = [
      `
        <div class="coop-member-card me">
          <div class="coop-member-left">
            <span class="coop-role-pill ${coop.isHost ? "host" : "guest"}">${coop.isHost ? "👑 CHỦ PHÒNG" : "★ BẠN"}</span>
            <b style="color:${myCls.accent}">${coop.playerName}</b>
            <span style="color:#9ba7c7;font-size:11px">${myCls.vnName} · LV.${p.level}</span>
          </div>
          <div style="font-size:11px;color:#44ee88">HP ${Math.ceil(p.hp)}/${p.maxHp}</div>
        </div>
      `,
      ...remotes.map((rp) => {
        const rCls = getClassDef(rp.snap.classId);
        return `
          <div class="coop-member-card">
            <div class="coop-member-left">
              <span class="coop-role-pill ${rp.snap.isHost ? "host" : "guest"}">${rp.snap.isHost ? "👑 HOST" : "ĐỒNG ĐỘI"}</span>
              <b style="color:${rCls.accent}">${rp.snap.name}</b>
              <span style="color:#9ba7c7;font-size:11px">${rCls.vnName} · LV.${rp.snap.level}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:11px;color:#44ee88">HP ${Math.ceil(rp.snap.hp)}/${rp.snap.maxHp}</span>
              <button class="px-btn sm primary" data-tp-peer="${rp.snap.id}">⚡ DỊCH CHUYỂN TỚI</button>
            </div>
          </div>
        `;
      }),
    ].join("");

    this.bodyEl.innerHTML = `
      <div class="coop-room-banner">
        <div>
          <div style="font-size:11px;color:#98a6cc">MÃ PHÒNG ĐANG HOẠT ĐỘNG (${coop.mode === "webrtc" ? "ONLINE WEBRTC P2P" : "DEDICATED WS"})</div>
          <div class="coop-room-code-big">${coop.roomCode}</div>
        </div>
        <div class="coop-share-btns">
          <button id="btn-copy-code" class="px-btn sm good">📋 COPY MÃ PHÒNG</button>
          <button id="btn-share-link" class="px-btn sm primary">🔗 CHIA SẺ LINK MỜI (MOBILE/WEB)</button>
          <button id="btn-coop-ping" class="px-btn sm" style="border-color:#ffe066;color:#ffe066">📍 PHÁT TÍN HIỆU TẬP HỢP</button>
          <button id="btn-coop-leave" class="px-btn sm warn">🚪 RỜI PHÒNG</button>
        </div>
      </div>

      <div class="coop-invite-url-box">
        <span>Link vào nhanh cho điện thoại/PC:</span>
        <code>${inviteUrl}</code>
      </div>

      <div class="section-hdr">👥 THÀNH VIÊN TRONG TỔ ĐỘI (${totalCount}/${MAX_COOP_PLAYERS})</div>
      <div class="coop-member-list">${memberRows}</div>

      <div class="tut-note-strip">
        ⚔ <b>Mẹo Phối Hợp Co-op:</b> Một người gắn Ấn <b>Hư Không / Băng / Sắc Độ</b>, đồng đội tung đòn <b>Hỏa / Chấn Động / Lăng Kính</b> sẽ kích nổ <b>Phản Ứng Nguyên Tố Kép</b> ngay lập tức! Khi đánh <b>The Eraser</b>, hãy chia nhau đứng thắp 2 Trụ Sắc Màu cùng lúc để phá Khiên Trắng siêu tốc!
      </div>
    `;

    this.bodyEl.querySelector("#btn-copy-code")?.addEventListener("click", async () => {
      sfx.playUiClick();
      try {
        await navigator.clipboard.writeText(coop.roomCode);
        this.game.uiToast(`Đã sao chép Mã Phòng: ${coop.roomCode}!`, "good");
      } catch {
        this.game.uiToast(`Mã phòng của bạn là: ${coop.roomCode}`, "info");
      }
    });

    this.bodyEl.querySelector("#btn-share-link")?.addEventListener("click", async () => {
      sfx.playUiClick();
      const shareData = {
        title: `Tổ đội PIXTEL Co-op — Phòng ${coop.roomCode}`,
        text: `Vào tổ đội Co-op PIXTEL 16-bit cùng mình! Mã phòng: ${coop.roomCode}`,
        url: inviteUrl,
      };
      try {
        if (navigator.share) {
          await navigator.share(shareData);
          return;
        }
      } catch {
        // Fallback to clipboard
      }
      try {
        await navigator.clipboard.writeText(inviteUrl);
        this.game.uiToast("Đã sao chép Link Mời Co-op! Gửi qua Zalo/Messenger/Discord cho bạn bè nhé!", "epic");
      } catch {
        this.game.uiToast(`Link mời: ${inviteUrl}`, "info");
      }
    });

    this.bodyEl.querySelector("#btn-coop-ping")?.addEventListener("click", () => {
      sfx.playWaypoint();
      this.game.sendCoopPing("Tập hợp tại vị trí của tôi!");
      this.game.closeCoopModal();
    });

    this.bodyEl.querySelector("#btn-coop-leave")?.addEventListener("click", () => {
      sfx.playUiClick();
      this.game.leaveCoopSession();
      this.render();
    });

    this.bodyEl.querySelectorAll("[data-tp-peer]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const peerId = (btn as HTMLElement).dataset.tpPeer!;
        this.game.teleportToCoopPeer(peerId);
        this.game.closeCoopModal();
      });
    });
  }
}
