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
      { itemId: "pot_hp_small", chance: 0.25 },
      { itemId: "pot_stamina_minor", chance: 0.14 },
      { itemId: "hlm_meadow_crest", chance: 0.09 },
      { itemId: "bts_meadow_strider", chance: 0.08 },
      { itemId: "wpn_meadow_edge", chance: 0.07 },
      { itemId: "wpn_leaf_daggers", chance: 0.05 },
    ],
  },
  ash_hopper: {
    rolls: [
      { itemId: "mat_glitch_core", chance: 0.72, minQty: 1, maxQty: 2 },
      { itemId: "mat_iron_ore", chance: 0.4, minQty: 1, maxQty: 2 },
      { itemId: "pot_hp", chance: 0.16 },
      { itemId: "pot_might_brew", chance: 0.12 },
      { itemId: "bts_meadow_strider", chance: 0.12 },
      { itemId: "arm_meadow_mail", chance: 0.1 },
      { itemId: "rng_breeze", chance: 0.09 },
      { itemId: "mat_pigment_green", chance: 0.16 },
      { itemId: "wpn_meadow_wand", chance: 0.06 },
      { itemId: "wpn_volt_blaster", chance: 0.06 },
    ],
  },
  thorn_archer: {
    rolls: [
      { itemId: "mat_glitch_core", chance: 0.74, minQty: 1, maxQty: 2 },
      { itemId: "mat_iron_ore", chance: 0.46, minQty: 1, maxQty: 2 },
      { itemId: "mat_pigment_green", chance: 0.2 },
      { itemId: "pot_stamina", chance: 0.18 },
      { itemId: "wpn_leaf_daggers", chance: 0.08 },
      { itemId: "wpn_volt_blaster", chance: 0.08 },
      { itemId: "hlm_meadow_crest", chance: 0.1 },
    ],
  },
  root_golem: {
    rolls: [
      { itemId: "mat_iron_ore", chance: 0.9, minQty: 2, maxQty: 4 },
      { itemId: "mat_prism_shard", chance: 0.6, minQty: 1, maxQty: 2 },
      { itemId: "mat_pigment_green", chance: 0.35 },
      { itemId: "arm_meadow_mail", chance: 0.24 },
      { itemId: "wpn_meadow_edge", chance: 0.2 },
      { itemId: "wpn_meadow_wand", chance: 0.18 },
      { itemId: "acc_wind_feather", chance: 0.14 },
    ],
  },

  // === RỪNG THẠCH ANH (LV 5-10) ===
  static_imp: {
    rolls: [
      { itemId: "mat_glitch_core", chance: 0.75, minQty: 1, maxQty: 2 },
      { itemId: "mat_quartz_shard", chance: 0.5, minQty: 1, maxQty: 2 },
      { itemId: "mat_pigment_gold", chance: 0.18 },
      { itemId: "pot_stamina", chance: 0.2 },
      { itemId: "pot_aegis_flask", chance: 0.1 },
      { itemId: "hlm_quartz_visor", chance: 0.1 },
      { itemId: "rng_quartz_eye", chance: 0.08 },
      { itemId: "wpn_chroma_scepter", chance: 0.05 },
    ],
  },
  bleach_hound: {
    rolls: [
      { itemId: "mat_glitch_core", chance: 0.78, minQty: 1, maxQty: 2 },
      { itemId: "mat_quartz_shard", chance: 0.55, minQty: 1, maxQty: 2 },
      { itemId: "mat_pigment_cyan", chance: 0.2 },
      { itemId: "pot_hp_greater", chance: 0.15 },
      { itemId: "bts_quartz_greaves", chance: 0.12 },
      { itemId: "wpn_glitch_fangs", chance: 0.08 },
      { itemId: "wpn_quartz_reaver", chance: 0.09 },
    ],
  },
  quartz_stalker: {
    rolls: [
      { itemId: "mat_quartz_shard", chance: 0.85, minQty: 1, maxQty: 3 },
      { itemId: "mat_prism_shard", chance: 0.35 },
      { itemId: "mat_pigment_cyan", chance: 0.25 },
      { itemId: "arm_quartz_plate", chance: 0.14 },
      { itemId: "hlm_quartz_visor", chance: 0.12 },
      { itemId: "wpn_prism_halberd", chance: 0.09 },
      { itemId: "wpn_pulse_carbine", chance: 0.09 },
      { itemId: "acc_amulet_wind", chance: 0.08 },
    ],
  },
  quartz_knight: {
    rolls: [
      { itemId: "mat_quartz_shard", chance: 0.95, minQty: 2, maxQty: 4 },
      { itemId: "mat_prism_shard", chance: 0.7, minQty: 1, maxQty: 3 },
      { itemId: "mat_pigment_cyan", chance: 0.38 },
      { itemId: "arm_quartz_plate", chance: 0.24 },
      { itemId: "hlm_quartz_visor", chance: 0.22 },
      { itemId: "wpn_prism_halberd", chance: 0.18 },
      { itemId: "wpn_quartz_reaver", chance: 0.18 },
      { itemId: "rng_quartz_eye", chance: 0.16 },
    ],
  },

  // === HẦM MỎ HỔ PHÁCH (LV 10-15) ===
  amber_beetle: {
    rolls: [
      { itemId: "mat_amber_gem", chance: 0.7, minQty: 1, maxQty: 2 },
      { itemId: "mat_iron_ore", chance: 0.55, minQty: 2, maxQty: 3 },
      { itemId: "mat_pigment_gold", chance: 0.24 },
      { itemId: "pot_hp_supreme", chance: 0.14 },
      { itemId: "arm_amber_aegis", chance: 0.11 },
      { itemId: "bts_amber_treads", chance: 0.12 },
      { itemId: "hlm_amber_crown", chance: 0.1 },
      { itemId: "wpn_thermal_repeater", chance: 0.06 },
    ],
  },
  cinder_imp: {
    rolls: [
      { itemId: "mat_amber_gem", chance: 0.72, minQty: 1, maxQty: 2 },
      { itemId: "mat_glitch_core", chance: 0.8, minQty: 1, maxQty: 3 },
      { itemId: "mat_pigment_red", chance: 0.28 },
      { itemId: "pot_tonic", chance: 0.25 },
      { itemId: "pot_wind_surge", chance: 0.12 },
      { itemId: "rng_amber_heart", chance: 0.12 },
      { itemId: "wpn_amber_fury", chance: 0.09 },
      { itemId: "wpn_amber_staff", chance: 0.07 },
      { itemId: "wpn_magma_fangs", chance: 0.07 },
    ],
  },

  // === PHẾ TÍCH VÔ SẮC (LV 15-20) ===
  prism_golem: {
    rolls: [
      { itemId: "mat_void_prism", chance: 0.65, minQty: 1, maxQty: 2 },
      { itemId: "mat_prism_shard", chance: 0.6, minQty: 1, maxQty: 2 },
      { itemId: "mat_pigment_quake", chance: 0.24 },
      { itemId: "mat_pigment_chroma", chance: 0.18 },
      { itemId: "pot_coating", chance: 0.25 },
      { itemId: "pot_hp_supreme", chance: 0.2 },
      { itemId: "pot_elixir_chroma", chance: 0.06 },
      { itemId: "arm_amber_aegis", chance: 0.16, enhanceLevel: 2 },
      { itemId: "hlm_amber_crown", chance: 0.15, enhanceLevel: 2 },
      { itemId: "arm_prism_mantle", chance: 0.05 },
      { itemId: "bts_void_walkers", chance: 0.06 },
      { itemId: "wpn_singularity_cannon", chance: 0.04 },
    ],
  },
  void_wraith: {
    rolls: [
      { itemId: "mat_void_prism", chance: 0.7, minQty: 1, maxQty: 2 },
      { itemId: "mat_glitch_core", chance: 0.9, minQty: 2, maxQty: 3 },
      { itemId: "mat_pigment_void", chance: 0.26 },
      { itemId: "pot_tonic", chance: 0.28 },
      { itemId: "pot_overdrive_vial", chance: 0.07 },
      { itemId: "wpn_void_scythe", chance: 0.08, enhanceLevel: 2 },
      { itemId: "wpn_amber_fury", chance: 0.16, enhanceLevel: 2 },
      { itemId: "hlm_prism_halo", chance: 0.06 },
      { itemId: "rng_spectrum", chance: 0.05 },
      { itemId: "wpn_astral_scepter", chance: 0.04 },
      { itemId: "wpn_quantum_blades", chance: 0.04 },
    ],
  },

  // === REGIONAL BOSSES & WORLD BOSS THE ERASER ===
  boss_xing_warden: {
    guaranteed: [
      { itemId: "mat_warden_crest", chance: 1, minQty: 1, maxQty: 2 },
      { itemId: "mat_prism_shard", chance: 1, minQty: 2, maxQty: 4 },
      { itemId: "mat_pigment_wind", chance: 1, minQty: 1, maxQty: 2 },
      { itemId: "wpn_warden_cleaver", chance: 1, enhanceLevel: 1 },
    ],
    rolls: [
      { itemId: "acc_wind_feather", chance: 0.55, enhanceLevel: 1 },
      { itemId: "acc_amulet_wind", chance: 0.6, enhanceLevel: 1 },
      { itemId: "arm_meadow_mail", chance: 0.55, enhanceLevel: 1 },
      { itemId: "hlm_meadow_crest", chance: 0.55, enhanceLevel: 1 },
    ],
  },
  boss_blight_root: {
    guaranteed: [
      { itemId: "mat_crystal_heart", chance: 1, minQty: 1, maxQty: 2 },
      { itemId: "mat_quartz_shard", chance: 1, minQty: 3, maxQty: 4 },
      { itemId: "mat_prism_shard", chance: 1, minQty: 3, maxQty: 5 },
      { itemId: "mat_pigment_cyan", chance: 1, minQty: 1, maxQty: 2 },
      { itemId: "chp_root_pulse", chance: 1, enhanceLevel: 2 },
      { itemId: "pot_hp_greater", chance: 1, minQty: 2, maxQty: 3 },
    ],
    rolls: [
      { itemId: "mat_pigment_green", chance: 0.7, minQty: 1, maxQty: 2 },
      { itemId: "acc_grimoire_arcane", chance: 0.55, enhanceLevel: 2 },
      { itemId: "hlm_quartz_visor", chance: 0.55, enhanceLevel: 2 },
      { itemId: "arm_quartz_plate", chance: 0.55, enhanceLevel: 2 },
      { itemId: "wpn_prism_halberd", chance: 0.35, enhanceLevel: 2 },
      { itemId: "wpn_chroma_scepter", chance: 0.35, enhanceLevel: 2 },
    ],
  },
  boss_gilded_null: {
    guaranteed: [
      { itemId: "mat_amber_fang", chance: 1, minQty: 1, maxQty: 2 },
      { itemId: "mat_amber_gem", chance: 1, minQty: 3, maxQty: 5 },
      { itemId: "mat_void_prism", chance: 1, minQty: 2, maxQty: 3 },
      { itemId: "mat_pigment_quake", chance: 1, minQty: 1, maxQty: 2 },
      { itemId: "wpn_amber_fury", chance: 1, enhanceLevel: 3 },
      { itemId: "pot_hp_supreme", chance: 1, minQty: 2, maxQty: 3 },
    ],
    rolls: [
      { itemId: "wpn_quake_maul", chance: 0.55, enhanceLevel: 2 },
      { itemId: "acc_disc_spectrum", chance: 0.6, enhanceLevel: 2 },
      { itemId: "hlm_amber_crown", chance: 0.6, enhanceLevel: 2 },
      { itemId: "arm_amber_aegis", chance: 0.6, enhanceLevel: 2 },
      { itemId: "bts_amber_treads", chance: 0.6, enhanceLevel: 2 },
      { itemId: "rng_amber_heart", chance: 0.5, enhanceLevel: 2 },
      { itemId: "wpn_amber_staff", chance: 0.4, enhanceLevel: 2 },
      { itemId: "wpn_magma_fangs", chance: 0.4, enhanceLevel: 2 },
      { itemId: "wpn_thermal_repeater", chance: 0.4, enhanceLevel: 2 },
    ],
  },
  boss_the_eraser: {
    guaranteed: [
      { itemId: "mat_origin_star", chance: 1, minQty: 1, maxQty: 2 },
      { itemId: "mat_void_prism", chance: 1, minQty: 4, maxQty: 6 },
      { itemId: "mat_prism_shard", chance: 1, minQty: 8, maxQty: 12 },
      { itemId: "mat_pigment_void", chance: 1, minQty: 1, maxQty: 2 },
      { itemId: "mat_pigment_chroma", chance: 1, minQty: 1, maxQty: 2 },
      { itemId: "wpn_chroma_sovereign", chance: 1, enhanceLevel: 4 },
      { itemId: "charm_undying", chance: 1, minQty: 1, maxQty: 1 },
      { itemId: "pot_elixir_chroma", chance: 1, minQty: 2, maxQty: 2 },
      { itemId: "pot_overdrive_vial", chance: 1, minQty: 2, maxQty: 2 },
    ],
    rolls: [
      { itemId: "acc_chroma_heart", chance: 0.65, enhanceLevel: 3 },
      { itemId: "wpn_void_scythe", chance: 0.55, enhanceLevel: 3 },
      { itemId: "hlm_prism_halo", chance: 0.7, enhanceLevel: 3 },
      { itemId: "arm_prism_mantle", chance: 0.7, enhanceLevel: 3 },
      { itemId: "bts_void_walkers", chance: 0.7, enhanceLevel: 3 },
      { itemId: "rng_spectrum", chance: 0.65, enhanceLevel: 3 },
      { itemId: "chp_eraser_zero", chance: 0.6, enhanceLevel: 3 },
      { itemId: "wpn_astral_scepter", chance: 0.45, enhanceLevel: 3 },
      { itemId: "wpn_quantum_blades", chance: 0.45, enhanceLevel: 3 },
      { itemId: "wpn_singularity_cannon", chance: 0.45, enhanceLevel: 3 },
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
