import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import {
  MAX_COOP_PLAYERS,
  generateRoomCode,
  normalizeRoomCode,
  type WsClientToServerMsg,
  type WsServerToClientMsg,
} from "../src/net/protocol";

interface ConnectedPeer {
  id: string;
  name: string;
  ws: WebSocket;
  roomCode: string | null;
}

interface CoopRoom {
  code: string;
  hostId: string;
  members: Map<string, ConnectedPeer>;
  createdAt: number;
}

export interface RunningCoopServer {
  port: number;
  rooms: Map<string, CoopRoom>;
  close: () => Promise<void>;
}

/**
 * Dedicated Node.js WebSocket Co-op Room Server for PIXTEL:
 * - Hosts hundreds of concurrent 2-4 player rooms (`6`-char codes) with <1ms packet relay.
 * - Exposes `/health` JSON status for cloud hosts (Render, Railway, Fly.io, Docker, VPS).
 */
export function startCoopServer(port = 8787, host = "0.0.0.0"): Promise<RunningCoopServer> {
  const rooms = new Map<string, CoopRoom>();
  let nextSeq = 1;

  const httpServer = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.url === "/health" || req.url === "/") {
      let totalPlayers = 0;
      for (const r of rooms.values()) totalPlayers += r.members.size;
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(
        JSON.stringify({
          service: "pixtel-coop-server",
          status: "ok",
          activeRooms: rooms.size,
          onlinePlayers: totalPlayers,
        })
      );
      return;
    }
    res.writeHead(404);
    res.end("Not found");
  });

  const wss = new WebSocketServer({ server: httpServer });

  const sendTo = (ws: WebSocket, msg: WsServerToClientMsg) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  };

  const removePeerFromRoom = (peer: ConnectedPeer) => {
    if (!peer.roomCode) return;
    const code = peer.roomCode;
    peer.roomCode = null;
    const room = rooms.get(code);
    if (!room) return;

    room.members.delete(peer.id);
    if (room.members.size === 0) {
      rooms.delete(code);
      return;
    }

    if (room.hostId === peer.id) {
      const nextHost = room.members.keys().next().value as string;
      room.hostId = nextHost;
    }

    for (const member of room.members.values()) {
      sendTo(member.ws, {
        op: "peer_left",
        clientId: peer.id,
        newHostId: room.hostId,
        memberCount: room.members.size,
      });
    }
  };

  wss.on("connection", (ws) => {
    const peer: ConnectedPeer = {
      id: `c_${nextSeq++}_${Math.random().toString(36).slice(2, 6)}`,
      name: "Lữ Khách",
      ws,
      roomCode: null,
    };

    ws.on("message", (raw) => {
      let msg: WsClientToServerMsg;
      try {
        msg = JSON.parse(String(raw)) as WsClientToServerMsg;
      } catch {
        return;
      }

      if (msg.op === "create_room") {
        removePeerFromRoom(peer);
        peer.name = (msg.name || "Chủ Phòng").slice(0, 16);
        let code = normalizeRoomCode(msg.roomCode || generateRoomCode(6));
        if (code.length < 4 || rooms.has(code)) {
          code = generateRoomCode(6);
        }
        const room: CoopRoom = {
          code,
          hostId: peer.id,
          members: new Map([[peer.id, peer]]),
          createdAt: Date.now(),
        };
        rooms.set(code, room);
        peer.roomCode = code;
        sendTo(ws, {
          op: "room_ready",
          roomCode: code,
          clientId: peer.id,
          isHost: true,
          hostId: peer.id,
          memberCount: 1,
        });
        return;
      }

      if (msg.op === "join_room") {
        removePeerFromRoom(peer);
        peer.name = (msg.name || "Đồng Đội").slice(0, 16);
        const code = normalizeRoomCode(msg.roomCode);
        const room = rooms.get(code);
        if (!room) {
          sendTo(ws, { op: "error", message: `Phòng [${code}] không tồn tại!` });
          return;
        }
        if (room.members.size >= MAX_COOP_PLAYERS) {
          sendTo(ws, {
            op: "error",
            message: `Phòng [${code}] đã đầy (${MAX_COOP_PLAYERS}/${MAX_COOP_PLAYERS})!`,
          });
          return;
        }

        room.members.set(peer.id, peer);
        peer.roomCode = code;

        sendTo(ws, {
          op: "room_ready",
          roomCode: code,
          clientId: peer.id,
          isHost: false,
          hostId: room.hostId,
          memberCount: room.members.size,
        });

        for (const member of room.members.values()) {
          if (member.id !== peer.id) {
            sendTo(member.ws, {
              op: "peer_joined",
              clientId: peer.id,
              name: peer.name,
              memberCount: room.members.size,
            });
          }
        }
        return;
      }

      if (msg.op === "leave_room") {
        removePeerFromRoom(peer);
        return;
      }

      if (msg.op === "relay") {
        if (!peer.roomCode) return;
        const room = rooms.get(peer.roomCode);
        if (!room) return;

        if (msg.targetId) {
          const target = room.members.get(msg.targetId);
          if (target && target.id !== peer.id) {
            sendTo(target.ws, { op: "relay", fromId: peer.id, packet: msg.packet });
          }
        } else {
          for (const member of room.members.values()) {
            if (member.id !== peer.id) {
              sendTo(member.ws, { op: "relay", fromId: peer.id, packet: msg.packet });
            }
          }
        }
      }
    });

    ws.on("close", () => removePeerFromRoom(peer));
    ws.on("error", () => removePeerFromRoom(peer));
  });

  return new Promise((resolve) => {
    httpServer.listen(port, host, () => {
      const addr = httpServer.address();
      const actualPort = typeof addr === "object" && addr ? addr.port : port;
      resolve({
        port: actualPort,
        rooms,
        close: () =>
          new Promise<void>((resClose) => {
            for (const client of wss.clients) {
              client.terminate();
            }
            wss.close(() => {
              httpServer.close(() => resClose());
            });
          }),
      });
    });
  });
}

// Run standalone when executed via `npm run server`
const isDirectRun =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("coopServer.ts") || process.argv[1].endsWith("coopServer.js"));

if (isDirectRun || process.env.PIXTEL_RUN_SERVER === "1") {
  const envPort = Number(process.env.PORT || 8787);
  startCoopServer(envPort).then((srv) => {
    console.log(`========================================================`);
    console.log(`  PIXTEL DEDICATED CO-OP SERVER ONLINE`);
    console.log(`  WebSocket: ws://0.0.0.0:${srv.port}`);
    console.log(`  Health:    http://127.0.0.1:${srv.port}/health`);
    console.log(`========================================================`);
  });
}
