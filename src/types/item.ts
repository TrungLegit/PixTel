import type { EquipSlot, ItemDef, Rarity, RecipeDef, StatBonus } from "../data/types";

export type ItemSlot = EquipSlot | "consumable" | "material";

export type ItemRarity = Rarity;

export type ItemStats = StatBonus;

export type PassiveTrigger =
  | "onHit"
  | "onCrit"
  | "onTakeDamage"
  | "onKill"
  | "onLowHp"
  | "onDash"
  | "onUse"
  | "passive";

export interface ItemPassive {
  id: string;
  name: string;
  trigger: PassiveTrigger;
  description: string;
  cooldownSec?: number;
  isCurse?: boolean;
}

export type ItemDefinition = ItemDef;

export type ForgeRecipe = RecipeDef;

export interface SetBonusDefinition {
  id: string;
  name: string;
  color: string;
  maxPieces: 3 | 4;
  pieceIds?: string[];
  twoPieceLabel: string;
  threePieceLabel?: string;
  fourPieceLabel?: string;
  twoPiece: StatBonus;
  threePiece?: StatBonus;
  fourPiece?: StatBonus;
  threePieceAuraColor?: string;
  threePieceAuraLabel?: string;
}
