import { SET_BONUSES } from "./equipments";
import type { SetBonusDefinition } from "../types/item";

export const CORE_SET_BONUSES: Record<string, SetBonusDefinition> = {
  set_forest: {
    id: "set_forest",
    name: "Bộ Rừng Sương Mù",
    color: "#4ade80",
    maxPieces: 3,
    pieceIds: ["hm_moss_hood", "ar_briar_cloak", "wp_briar_dagger"],
    twoPieceLabel: "(2/3) +10 SPD · +8% Crit",
    threePieceLabel: "(3/3) +15% ASPD · +25 HP · Hào Quang Rừng Cổ",
    twoPiece: { spd: 10, crit: 8 },
    threePiece: { aspdPct: 15, maxHp: 25 },
    threePieceAuraColor: "#4ade80",
    threePieceAuraLabel: "Hào Quang Rừng Cổ",
  },
  set_forge: {
    id: "set_forge",
    name: "Bộ Tâm Lò Tro Tàn",
    color: "#fb923c",
    maxPieces: 3,
    pieceIds: ["hm_ash_visor", "ac_ember_crest", "wp_forge_hammer"],
    twoPieceLabel: "(2/3) +12 ATK · +15% Kháng Lửa",
    threePieceLabel: "(3/3) +15 DEF · +25% Phá Giáp · Hào Quang Lò Nung",
    twoPiece: { atk: 12, fireResPct: 15 },
    threePiece: { def: 15, poiseBreakPct: 25 },
    threePieceAuraColor: "#fb923c",
    threePieceAuraLabel: "Hào Quang Lò Nung",
  },
  set_eclipse: {
    id: "set_eclipse",
    name: "Bộ Nhật Thực Hư Không",
    color: "#c084fc",
    maxPieces: 3,
    pieceIds: ["hm_eclipse_crown", "ar_bloodstone_plate", "wp_eclipse_reaver"],
    twoPieceLabel: "(2/3) +18 ATK · +15 MAG · +5% Hút Máu",
    threePieceLabel: "(3/3) +25% CritDMG · +10% Hút Máu · Hào Quang Nhật Thực",
    twoPiece: { atk: 18, mag: 15, lifestealPct: 5 },
    threePiece: { critDmgPct: 25, lifestealPct: 10 },
    threePieceAuraColor: "#c084fc",
    threePieceAuraLabel: "Hào Quang Nhật Thực",
  },
};

export const ALL_SET_BONUSES: Record<string, SetBonusDefinition> = {
  ...Object.fromEntries(
    Object.entries(SET_BONUSES).map(([id, def]) => [
      id,
      {
        ...def,
        maxPieces: 4 as const,
      },
    ])
  ),
  ...CORE_SET_BONUSES,
};

export function getSetBonusDef(setId?: string): SetBonusDefinition | undefined {
  return setId ? ALL_SET_BONUSES[setId] : undefined;
}
