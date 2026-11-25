export interface DropTableEntry {
  itemId: string;
  chance: number; // 0..1
  minQty?: number;
  maxQty?: number;
  enhanceLevel?: number;
}

export interface EnemyDropTable {
  guaranteed?: DropTableEntry[];
  rolls: DropTableEntry[];
}

/**
 * Bảng tỷ lệ rơi đồ (Drop Table) cho quái thường, tinh anh các quần xã
 * và 3 Boss (Blight Root, Gilded Null, World Boss The Eraser).
 */
export const ENEMY_DROP_TABLES: Record<string, EnemyDropTable> = {
  // === ĐỒNG CỎ XÁM (LV 1-5) ===
  null_slime: {
    rolls: [
      { itemId: "mat_glitch_core", chance: 0.7, minQty: 1, maxQty: 2 },
      { itemId: "pot_hp", chance: 0.22 },
      { itemId: "hlm_meadow_crest", chance: 0.09 },
      { itemId: "bts_meadow_strider", chance: 0.08 },
      { itemId: "wpn_meadow_edge", chance: 0.07 },
    ],
  },
  ash_hopper: {
    rolls: [
      { itemId: "mat_glitch_core", chance: 0.72, minQty: 1, maxQty: 2 },
      { itemId: "mat_iron_ore", chance: 0.4, minQty: 1, maxQty: 2 },
      { itemId: "bts_meadow_strider", chance: 0.12 },
      { itemId: "arm_meadow_mail", chance: 0.1 },
      { itemId: "rng_breeze", chance: 0.09 },
    ],
  },

  // === RỪNG THẠCH ANH (LV 5-10) ===
  static_imp: {
    rolls: [
      { itemId: "mat_glitch_core", chance: 0.75, minQty: 1, maxQty: 2 },
      { itemId: "mat_quartz_shard", chance: 0.5, minQty: 1, maxQty: 2 },
      { itemId: "pot_stamina", chance: 0.2 },
      { itemId: "hlm_quartz_visor", chance: 0.1 },
      { itemId: "rng_quartz_eye", chance: 0.08 },
      { itemId: "wpn_chroma_scepter", chance: 0.05 },
    ],
  },
  bleach_hound: {
    rolls: [
      { itemId: "mat_glitch_core", chance: 0.78, minQty: 1, maxQty: 2 },
      { itemId: "mat_quartz_shard", chance: 0.55, minQty: 1, maxQty: 2 },
      { itemId: "bts_quartz_greaves", chance: 0.12 },
      { itemId: "wpn_glitch_fangs", chance: 0.08 },
      { itemId: "wpn_quartz_reaver", chance: 0.09 },
    ],
  },
  quartz_stalker: {
    rolls: [
      { itemId: "mat_quartz_shard", chance: 0.85, minQty: 1, maxQty: 3 },
      { itemId: "mat_prism_shard", chance: 0.35 },
      { itemId: "arm_quartz_plate", chance: 0.14 },
      { itemId: "hlm_quartz_visor", chance: 0.12 },
      { itemId: "wpn_prism_halberd", chance: 0.09 },
      { itemId: "wpn_pulse_carbine", chance: 0.09 },
    ],
  },

  // === HẦM MỎ HỔ PHÁCH (LV 10-15) ===
  amber_beetle: {
    rolls: [
      { itemId: "mat_amber_gem", chance: 0.7, minQty: 1, maxQty: 2 },
      { itemId: "mat_iron_ore", chance: 0.55, minQty: 2, maxQty: 3 },
      { itemId: "arm_amber_aegis", chance: 0.11 },
      { itemId: "bts_amber_treads", chance: 0.12 },
      { itemId: "hlm_amber_crown", chance: 0.1 },
    ],
  },
  cinder_imp: {
    rolls: [
      { itemId: "mat_amber_gem", chance: 0.72, minQty: 1, maxQty: 2 },
      { itemId: "mat_glitch_core", chance: 0.8, minQty: 1, maxQty: 3 },
      { itemId: "pot_tonic", chance: 0.25 },
      { itemId: "rng_amber_heart", chance: 0.12 },
      { itemId: "wpn_amber_fury", chance: 0.1 },
    ],
  },

  // === PHẾ TÍCH VÔ SẮC (LV 15-20) ===
  prism_golem: {
    rolls: [
      { itemId: "mat_void_prism", chance: 0.65, minQty: 1, maxQty: 2 },
      { itemId: "mat_prism_shard", chance: 0.6, minQty: 1, maxQty: 2 },
      { itemId: "arm_amber_aegis", chance: 0.16, enhanceLevel: 2 },
      { itemId: "hlm_amber_crown", chance: 0.15, enhanceLevel: 2 },
      { itemId: "arm_prism_mantle", chance: 0.05 },
      { itemId: "bts_void_walkers", chance: 0.06 },
    ],
  },
  void_wraith: {
    rolls: [
      { itemId: "mat_void_prism", chance: 0.7, minQty: 1, maxQty: 2 },
      { itemId: "mat_glitch_core", chance: 0.9, minQty: 2, maxQty: 3 },
      { itemId: "pot_tonic", chance: 0.3 },
      { itemId: "wpn_amber_fury", chance: 0.16, enhanceLevel: 2 },
      { itemId: "hlm_prism_halo", chance: 0.06 },
      { itemId: "rng_spectrum", chance: 0.05 },
    ],
  },

  // === REGIONAL BOSSES & WORLD BOSS THE ERASER ===
  boss_blight_root: {
    guaranteed: [
      { itemId: "mat_quartz_shard", chance: 1, minQty: 3, maxQty: 4 },
      { itemId: "mat_amber_gem", chance: 1, minQty: 2, maxQty: 3 },
      { itemId: "mat_prism_shard", chance: 1, minQty: 3, maxQty: 5 },
      { itemId: "chp_root_pulse", chance: 1, enhanceLevel: 2 },
    ],
    rolls: [
      { itemId: "hlm_quartz_visor", chance: 0.55, enhanceLevel: 2 },
      { itemId: "arm_quartz_plate", chance: 0.55, enhanceLevel: 2 },
      { itemId: "bts_quartz_greaves", chance: 0.55, enhanceLevel: 2 },
      { itemId: "wpn_prism_halberd", chance: 0.35, enhanceLevel: 2 },
      { itemId: "wpn_chroma_scepter", chance: 0.35, enhanceLevel: 2 },
    ],
  },
  boss_gilded_null: {
    guaranteed: [
      { itemId: "mat_amber_gem", chance: 1, minQty: 3, maxQty: 5 },
      { itemId: "mat_void_prism", chance: 1, minQty: 2, maxQty: 3 },
      { itemId: "mat_prism_shard", chance: 1, minQty: 5, maxQty: 7 },
      { itemId: "wpn_amber_fury", chance: 1, enhanceLevel: 3 },
    ],
    rolls: [
      { itemId: "hlm_amber_crown", chance: 0.6, enhanceLevel: 2 },
      { itemId: "arm_amber_aegis", chance: 0.6, enhanceLevel: 2 },
      { itemId: "bts_amber_treads", chance: 0.6, enhanceLevel: 2 },
      { itemId: "rng_amber_heart", chance: 0.5, enhanceLevel: 2 },
    ],
  },
  boss_the_eraser: {
    guaranteed: [
      { itemId: "mat_void_prism", chance: 1, minQty: 4, maxQty: 6 },
      { itemId: "mat_prism_shard", chance: 1, minQty: 8, maxQty: 12 },
      { itemId: "wpn_chroma_sovereign", chance: 1, enhanceLevel: 4 },
    ],
    rolls: [
      { itemId: "hlm_prism_halo", chance: 0.7, enhanceLevel: 3 },
      { itemId: "arm_prism_mantle", chance: 0.7, enhanceLevel: 3 },
      { itemId: "bts_void_walkers", chance: 0.7, enhanceLevel: 3 },
      { itemId: "rng_spectrum", chance: 0.65, enhanceLevel: 3 },
      { itemId: "chp_eraser_zero", chance: 0.55, enhanceLevel: 3 },
    ],
  },
};

export interface RolledDrop {
  itemId: string;
  qty: number;
  enhanceLevel: number;
}

/** Rolls guaranteed + chance-based drops from `ENEMY_DROP_TABLES`. */
export function rollEnemyDropTable(enemyId: string): RolledDrop[] {
  const table = ENEMY_DROP_TABLES[enemyId];
  if (!table) return [];
  const out: RolledDrop[] = [];

  const processList = (list: DropTableEntry[], alwaysDrop: boolean) => {
    for (const entry of list) {
      if (!alwaysDrop && Math.random() > entry.chance) continue;
      const minQ = entry.minQty ?? 1;
      const maxQ = entry.maxQty ?? minQ;
      const qty = minQ + Math.floor(Math.random() * (maxQ - minQ + 1));
      out.push({
        itemId: entry.itemId,
        qty,
        enhanceLevel: entry.enhanceLevel ?? 0,
      });
    }
  };

  if (table.guaranteed) processList(table.guaranteed, true);
  processList(table.rolls, false);
  return out;
}
