import Peer, { type DataConnection } from "peerjs";
import {
  MAX_COOP_PLAYERS,
  generateRoomCode,
  normalizeRoomCode,
  type CoopTransportMode,
  type NetGamePacket,
  type WsClientToServerMsg,
  type WsServerToClientMsg,
} from "./protocol";

export type CoopConnectionStatus = "offline" | "connecting" | "connected" | "error";

export interface CoopClientCallbacks {
  onStatusChange: (status: CoopConnectionStatus, detail?: string) => void;
  onPacket: (fromId: string, packet: NetGamePacket) => void;
  onPeerJoined: (peerId: string) => void;
  onPeerLeft: (peerId: string) => void;
}

export interface WebSocketLike {
  readyState: number;
  send(data: string): void;
  close(): void;
  onopen: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onclose: ((ev: unknown) => void) | null;
}

export type WebSocketFactory = (url: string) => WebSocketLike;

const PEER_ROOM_PREFIX = "pixtel-coop-v27-";

/**
 * Dual-Transport Co-op Network Manager:
 * 1. `webrtc` (Default on HTTPS / GitHub Pages): Serverless P2P DataChannels via PeerJS Cloud using a 6-char Room Code!
 * 2. `ws` (Dedicated Node Server `server/coopServer.ts`): Ultra-low-latency WebSocket Room Relay (`ws://` or `wss://`).
 */
export class CoopClient {
  mode: CoopTransportMode = "webrtc";
  status: CoopConnectionStatus = "offline";
  statusDetail = "";
  roomCode = "";
  localId = `p_${Math.random().toString(36).slice(2, 9)}`;
  playerName = "Lữ Khách";
  isHost = false;
  hostId = "";
  wsServerUrl = "ws://127.0.0.1:8787";

  private cb: CoopClientCallbacks;
  private wsFactory: WebSocketFactory;

  // WebRTC PeerJS state
  private peer: Peer | null = null;
  private hostConn: DataConnection | null = null;
  private guestConns = new Map<string, DataConnection>();

  // WebSocket state
  private ws: WebSocketLike | null = null;

  constructor(cb: CoopClientCallbacks, customWsFactory?: WebSocketFactory) {
    this.cb = cb;
    this.wsFactory =
      customWsFactory ??
      ((url: string) => new WebSocket(url) as unknown as WebSocketLike);
  }

  get isConnected(): boolean {
    return this.status === "connected";
  }

  private _setStatus(st: CoopConnectionStatus, detail = "") {
    this.status = st;
    this.statusDetail = detail;
    this.cb.onStatusChange(st, detail);
  }

  /** Creates a new Co-op Room (1-4 players) as Room Host and resolves with the 6-char Room Code. */
  async hostRoom(opts?: {
    mode?: CoopTransportMode;
    roomCode?: string;
    playerName?: string;
    wsUrl?: string;
  }): Promise<string> {
    this.disconnect();
    this.mode = opts?.mode ?? this.mode;
    if (opts?.playerName) this.playerName = opts.playerName.trim().slice(0, 16) || "Lữ Khách";
    if (opts?.wsUrl) this.wsServerUrl = opts.wsUrl.trim();

    const desiredCode = normalizeRoomCode(opts?.roomCode || generateRoomCode(6));
    this.roomCode = desiredCode;
    this.isHost = true;
    this._setStatus("connecting", `Đang khởi tạo phòng ${desiredCode}...`);

    if (this.mode === "ws") {
      return this._connectWs("create_room", desiredCode);
    }
    return this._hostWebRtc(desiredCode);
  }

  /** Joins an existing Co-op Room using its 6-char Room Code as a Guest. */
  async joinRoom(
    rawCode: string,
    opts?: {
      mode?: CoopTransportMode;
      playerName?: string;
      wsUrl?: string;
    }
  ): Promise<string> {
    const code = normalizeRoomCode(rawCode);
    if (code.length < 4) {
      this._setStatus("error", "Mã phòng phải từ 4–8 ký tự chữ/số!");
      throw new Error("Invalid room code");
    }
    this.disconnect();
    this.mode = opts?.mode ?? this.mode;
    if (opts?.playerName) this.playerName = opts.playerName.trim().slice(0, 16) || "Đồng Đội";
    if (opts?.wsUrl) this.wsServerUrl = opts.wsUrl.trim();

    this.roomCode = code;
    this.isHost = false;
    this._setStatus("connecting", `Đang kết nối vào phòng ${code}...`);

    if (this.mode === "ws") {
      return this._connectWs("join_room", code);
    }
    return this._joinWebRtc(code);
  }

  /** Sends a game packet to Host (if Guest) or broadcasts to all Guests (if Host), or to a specific `targetId`. */
  send(packet: NetGamePacket, targetId?: string) {
    if (this.status !== "connected") return;

    if (this.mode === "ws") {
      if (!this.ws || this.ws.readyState !== 1) return;
      const env: WsClientToServerMsg = {
        op: "relay",
        targetId: targetId ?? (this.isHost ? undefined : this.hostId),
        packet,
      };
      this.ws.send(JSON.stringify(env));
      return;
    }

    // WebRTC PeerJS mode
    if (this.isHost) {
      if (targetId) {
        const c = this.guestConns.get(targetId);
        if (c?.open) c.send(packet);
      } else {
        for (const c of this.guestConns.values()) {
          if (c.open) c.send(packet);
        }
      }
    } else if (this.hostConn?.open) {
      this.hostConn.send(packet);
    }
  }

  disconnect() {
    if (this.ws) {
      try {
        if (this.ws.readyState === 1) {
          const msg: WsClientToServerMsg = { op: "leave_room" };
          this.ws.send(JSON.stringify(msg));
        }
        this.ws.close();
      } catch {
        // ignore close errors
      }
      this.ws = null;
    }

    for (const c of this.guestConns.values()) {
      try {
        c.close();
      } catch {
        // ignore
      }
    }
    this.guestConns.clear();

    if (this.hostConn) {
      try {
        this.hostConn.close();
      } catch {
        // ignore
      }
      this.hostConn = null;
    }

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
        // ignore
      }
      this.peer = null;
    }

    const wasConnected = this.status !== "offline";
    this.isHost = false;
    this.hostId = "";
    this.roomCode = "";
    if (wasConnected) {
      this._setStatus("offline", "Đã rời phòng Co-op.");
    }
  }

  /** Builds a shareable invite link (`?room=XXXXXX`) for the current web URL! */
  getInviteUrl(): string {
    if (typeof window === "undefined" || !this.roomCode) return this.roomCode;
    const u = new URL(window.location.href);
    u.searchParams.set("room", this.roomCode);
    if (this.mode === "ws") {
      u.searchParams.set("ws", this.wsServerUrl);
    } else {
      u.searchParams.delete("ws");
    }
    return u.toString();
  }

  private _connectWs(op: "create_room" | "join_room", code: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let settled = false;
      let sock: WebSocketLike;
      try {
        sock = this.wsFactory(this.wsServerUrl);
      } catch (err) {
        this._setStatus("error", `Không thể mở kết nối tới ${this.wsServerUrl}`);
        reject(err);
        return;
      }
      this.ws = sock;

      sock.onopen = () => {
        const hello: WsClientToServerMsg =
          op === "create_room"
            ? { op: "create_room", roomCode: code, name: this.playerName }
            : { op: "join_room", roomCode: code, name: this.playerName };
        sock.send(JSON.stringify(hello));
      };

      sock.onmessage = (ev) => {
        let msg: WsServerToClientMsg;
        try {
          msg = JSON.parse(String(ev.data)) as WsServerToClientMsg;
        } catch {
          return;
        }

        if (msg.op === "room_ready") {
          this.roomCode = msg.roomCode;
          this.localId = msg.clientId;
          this.isHost = msg.isHost;
          this.hostId = msg.hostId;
          settled = true;
          this._setStatus(
            "connected",
            `Phòng ${msg.roomCode} (${msg.isHost ? "Chủ phòng" : "Thành viên"} · ${msg.memberCount}/${MAX_COOP_PLAYERS})`
          );
          resolve(msg.roomCode);
        } else if (msg.op === "peer_joined") {
          this.cb.onPeerJoined(msg.clientId);
        } else if (msg.op === "peer_left") {
          this.hostId = msg.newHostId;
          if (msg.newHostId === this.localId) {
            this.isHost = true;
          }
          this.cb.onPeerLeft(msg.clientId);
        } else if (msg.op === "relay") {
          this.cb.onPacket(msg.fromId, msg.packet);
        } else if (msg.op === "error") {
          this._setStatus("error", msg.message);
          if (!settled) {
            settled = true;
            reject(new Error(msg.message));
          }
        }
      };

      sock.onerror = () => {
        const errMsg = `Không kết nối được Dedicated Server (${this.wsServerUrl}). Hãy dùng chế độ Online WebRTC hoặc chạy npm run server!`;
        this._setStatus("error", errMsg);
        if (!settled) {
          settled = true;
          reject(new Error(errMsg));
        }
      };

      sock.onclose = () => {
        if (this.ws === sock) {
          this.ws = null;
          if (this.status === "connected") {
            this._setStatus("offline", "Mất kết nối tới máy chủ phòng.");
          }
        }
      };
    });
  }

  private _hostWebRtc(code: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const hostPeerId = `${PEER_ROOM_PREFIX}${code}`;
      const peer = new Peer(hostPeerId, {
        debug: 0,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        },
      });
      this.peer = peer;

      peer.on("open", () => {
        this.localId = hostPeerId;
        this.hostId = hostPeerId;
        settled = true;
        this._setStatus("connected", `Đang mở phòng Online [${code}] (1/${MAX_COOP_PLAYERS})`);
        resolve(code);
      });

      peer.on("connection", (conn) => {
        if (this.guestConns.size + 1 >= MAX_COOP_PLAYERS) {
          conn.on("open", () => conn.close());
          return;
        }
        conn.on("open", () => {
          this.guestConns.set(conn.peer, conn);
          this._setStatus(
            "connected",
            `Phòng [${this.roomCode}] (${this.guestConns.size + 1}/${MAX_COOP_PLAYERS} người)`
          );
          this.cb.onPeerJoined(conn.peer);
        });
        conn.on("data", (raw) => {
          const pkt = raw as NetGamePacket;
          if (!pkt || typeof pkt !== "object" || !("type" in pkt)) return;
          this.cb.onPacket(conn.peer, pkt);
          // Relay common broadcast events from one Guest to other Guests!
          if (
            pkt.type === "player_state" ||
            pkt.type === "hero_fx" ||
            pkt.type === "waypoint_unlocked" ||
            pkt.type === "ping_beacon"
          ) {
            for (const [otherId, otherConn] of this.guestConns) {
              if (otherId !== conn.peer && otherConn.open) {
                otherConn.send(pkt);
              }
            }
          }
        });
        const cleanup = () => {
          if (this.guestConns.delete(conn.peer)) {
            this.cb.onPeerLeft(conn.peer);
            for (const c of this.guestConns.values()) {
              if (c.open) c.send({ type: "peer_left", playerId: conn.peer } satisfies NetGamePacket);
            }
          }
        };
        conn.on("close", cleanup);
        conn.on("error", cleanup);
      });

      peer.on("error", (err) => {
        const msg =
          err.type === "unavailable-id"
            ? `Mã phòng ${code} đang có người dùng, hãy bấm Tạo Phòng lại!`
            : `Lỗi kết nối WebRTC (${err.type}).`;
        this._setStatus("error", msg);
        if (!settled) {
          settled = true;
          reject(err);
        }
      });
    });
  }

  private _joinWebRtc(code: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const guestPeerId = `${PEER_ROOM_PREFIX}g-${Math.random().toString(36).slice(2, 9)}`;
      const hostPeerId = `${PEER_ROOM_PREFIX}${code}`;

      const peer = new Peer(guestPeerId, {
        debug: 0,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        },
      });
      this.peer = peer;

      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          this.disconnect();
          const m = `Không tìm thấy phòng [${code}] hoặc mạng chặn kết nối P2P!`;
          this._setStatus("error", m);
          reject(new Error(m));
        }
      }, 12000);

      peer.on("open", (id) => {
        this.localId = id;
        this.hostId = hostPeerId;
        const conn = peer.connect(hostPeerId, { reliable: true });
        this.hostConn = conn;

        conn.on("open", () => {
          clearTimeout(timeout);
          settled = true;
          this._setStatus("connected", `Đã vào phòng [${code}]!`);
          resolve(code);
        });

        conn.on("data", (raw) => {
          const pkt = raw as NetGamePacket;
          if (!pkt || typeof pkt !== "object" || !("type" in pkt)) return;
          this.cb.onPacket(hostPeerId, pkt);
        });

        conn.on("close", () => {
          clearTimeout(timeout);
          if (this.status === "connected") {
            this.disconnect();
            this._setStatus("offline", "Chủ phòng đã đóng phòng Co-op.");
          }
        });

        conn.on("error", (err) => {
          clearTimeout(timeout);
          this._setStatus("error", `Lỗi đường truyền tới phòng [${code}].`);
          if (!settled) {
            settled = true;
            reject(err);
          }
        });
      });

      peer.on("error", (err) => {
        clearTimeout(timeout);
        const m =
          err.type === "peer-unavailable"
            ? `Phòng [${code}] không tồn tại hoặc đã đóng!`
            : `Lỗi kết nối (${err.type}).`;
        this._setStatus("error", m);
        if (!settled) {
          settled = true;
          reject(err);
        }
      });
    });
  }
}
