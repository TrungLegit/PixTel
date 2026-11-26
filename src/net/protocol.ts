import type {
  ActiveBossLock,
  BiomeId,
  ClassId,
  ElementType,
  EquipSlot,
  InfusableElement,
} from "../data/types";
import type { HeroAnimState, HeroAttackKind } from "../graphics/paperDoll";
import type { EnemyAnimKind } from "../world/entities";

export type FacingDir = "down" | "up" | "left" | "right";

export type CoopTransportMode = "webrtc" | "ws";

export const MAX_COOP_PLAYERS = 4;

const ROOM_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(len = 6): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)];
  }
  return out;
}

export function normalizeRoomCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

export interface CompactEquipSlot {
  defId: string;
  enh: number;
  inf?: InfusableElement;
}

export interface PlayerNetSnapshot {
  id: string;
  name: string;
  isHost: boolean;
  classId: ClassId;
  level: number;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  facing: 1 | -1;
  facingDir: FacingDir;
  aimAngle: number;
  animState: HeroAnimState;
  attackKind: HeroAttackKind;
  attackProgress: number;
  shieldGuard: boolean;
  aegisActive: boolean;
  buffActive: boolean;
  chargePct: number;
  walkTime: number;
  equip: Record<EquipSlot, CompactEquipSlot | null>;
}

export interface EnemyNetSnapshot {
  uid: number;
  defId: string;
  campId: string;
  biome: BiomeId;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  bleachShield: number;
  maxBleachShield: number;
  facing: 1 | -1;
  facingDir: FacingDir;
  state: "patrol" | "aggro" | "leash";
  phase: number;
  element: ElementType | null;
  stunTime: number;
  vulnTime: number;
  rootTime: number;
  disruptTime: number;
  enrageBuffTime: number;
  totemChannelTimer: number;
  animKind: EnemyAnimKind;
  animTime: number;
  animDuration: number;
  animAngle: number;
  dashTime: number;
  dashVx: number;
  dashVy: number;
  guardTime: number;
  walkTime: number;
}

export interface TotemNetSnapshot {
  uid: number;
  element: InfusableElement;
  x: number;
  y: number;
  lit: boolean;
}

export type NetGamePacket =
  | {
      type: "hello";
      player: PlayerNetSnapshot;
    }
  | {
      type: "welcome";
      hostId: string;
      roomCode: string;
      waypoints: string[];
      openedChests: string[];
      players: PlayerNetSnapshot[];
      enemies: EnemyNetSnapshot[];
      totems: TotemNetSnapshot[];
      bossLock: ActiveBossLock | null;
    }
  | {
      type: "player_state";
      player: PlayerNetSnapshot;
    }
  | {
      type: "party_roster";
      players: PlayerNetSnapshot[];
    }
  | {
      type: "world_state";
      enemies: EnemyNetSnapshot[];
      totems: TotemNetSnapshot[];
      bossLock: ActiveBossLock | null;
    }
  | {
      type: "hit_enemy";
      attackerId: string;
      attackerLevel: number;
      enemyUid: number;
      rawDamage: number;
      crit: boolean;
      hitPreset: string;
      element?: ElementType;
      kbX: number;
      kbY: number;
      poiseMult: number;
    }
  | {
      type: "light_totem";
      attackerId: string;
      totemIdx: number;
      element?: ElementType;
    }
  | {
      type: "enemy_killed";
      enemyUid: number;
      defId: string;
      campId: string;
      x: number;
      y: number;
      isBoss: boolean;
      isWorldBoss: boolean;
    }
  | {
      type: "reaction_vfx";
      x: number;
      y: number;
      tag: string;
      color: string;
    }
  | {
      type: "waypoint_unlocked";
      wpId: string;
      wx: number;
      wy: number;
      radiusPx: number;
    }
  | {
      type: "hero_fx";
      playerId: string;
      preset: string;
      x: number;
      y: number;
      angle?: number;
    }
  | {
      type: "ping_beacon";
      playerId: string;
      name: string;
      x: number;
      y: number;
      text: string;
    }
  | {
      type: "peer_left";
      playerId: string;
    };

/** Wire envelope for Dedicated WebSocket Room Server (`server/coopServer.ts`). */
export type WsClientToServerMsg =
  | { op: "create_room"; roomCode?: string; name: string }
  | { op: "join_room"; roomCode: string; name: string }
  | { op: "leave_room" }
  | { op: "relay"; targetId?: string; packet: NetGamePacket };

export type WsServerToClientMsg =
  | { op: "room_ready"; roomCode: string; clientId: string; isHost: boolean; hostId: string; memberCount: number }
  | { op: "peer_joined"; clientId: string; name: string; memberCount: number }
  | { op: "peer_left"; clientId: string; newHostId: string; memberCount: number }
  | { op: "relay"; fromId: string; packet: NetGamePacket }
  | { op: "error"; message: string };
