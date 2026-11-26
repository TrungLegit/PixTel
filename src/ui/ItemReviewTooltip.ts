import { getClassDef } from "../data/classes";
import { ELEMENT_META } from "../data/elements";
import { ENEMIES } from "../data/enemies";
import { ALL_SET_BONUSES } from "../data/sets";
import {
  CONSUMABLE_GROUP_LABELS,
  ITEMS,
  RARITY_INFO,
  SLOT_LABELS,
  getDismantleShardYield,
  getItemEffectiveStats,
  getTierBadge,
} from "../data/items";
import { EQUIP_SLOTS, type EquipSlot, type ItemDef, type ItemInstance } from "../data/types";
import { getWeaponSkillForItem } from "../data/weaponSkills";
import { drawItemIcon } from "../graphics/itemIcons";
import { clearFrame, createFrame, createFx } from "../vfx/pixelfx/core/index.js";
import * as rarityAuraMod from "../vfx/pixelfx/fx/pixtel/rarity-aura.js";
import * as cursedAuraMod from "../vfx/pixelfx/fx/pixtel/cursed-aura.js";
import type { PixelfxFrame, PixelfxInstance, PixelfxModule } from "../vfx/pixelfxTypes";
import {
  RARITY_PAL_BY_AURA,
  RARITY_TIER_BY_AURA,
  resolveUiAuraKind,
  type UiAuraKind,
} from "../vfx/uiRarityFx";
import type { PixTelOpenWorldGame } from "../game";

const CAPE_LABELS: Record<string, string> = {
  cape_t1: "Khăn Choàng Du Mục",
  cape_t2: "Áo Choàng Thảo Nguyên",
  cape_t3: "Áo Choàng Khúc Xạ",
  cape_t4: "Áo Choàng Dung Nham",
  cape_t5: "Cánh Quang Phổ",
};

/** High-contrast ink colors for item names inside the dark walnut plaque */
const PLAQUE_NAME_COLORS: Record<string, string> = {
  common: "#f0ede4",
  uncommon: "#4ade80",
  rare: "#60a5fa",
  epic: "#c084fc",
  cursed: "#fb7185",
  legendary: "#facc15",
};

interface ResolvedReviewItem {
  def: ItemDef;
  inst: ItemInstance;
  isEquipped: boolean;
  equippedSlot: EquipSlot | null;
  sourceKind: string;
}

/**
 * Global Hover Item Review Frame:
 * Renders a 16-bit vintage parchment scroll framed with braided hemp rope
 * whenever hovering any item across Inventory, Equipment, Shop, Forge, Quests, or HUD Hotbar.
 * Features a live 72x72 pixelfx showcase pedestal for Rare/Epic/Legendary/+5 items.
 */
export class ItemReviewTooltip {
  private game: PixTelOpenWorldGame;
  private root: HTMLElement;
  private activeTargetEl: HTMLElement | null = null;
  private currentDef: ItemDef | null = null;
  private currentAura: UiAuraKind | null = null;

  // Live 72x72 two-buffer pixelfx showcase pedestal
  private readonly fxSize = 72;
  private fxFrame: PixelfxFrame;
  private colorCanvas: HTMLCanvasElement;
  private colorCtx: CanvasRenderingContext2D;
  private colorImg: ImageData;
  private colorU32: Uint32Array;
  private lightCanvas: HTMLCanvasElement;
  private lightCtx: CanvasRenderingContext2D;
  private lightImg: ImageData;
  private lightU32: Uint32Array;
  private liveFx: PixelfxInstance | null = null;
  private pedestalCanvas: HTMLCanvasElement | null = null;
  private pedestalCtx: CanvasRenderingContext2D | null = null;

  private rafId = 0;
  private lastT = 0;
  private lastMouseX = 0;
  private lastMouseY = 0;

  constructor(game: PixTelOpenWorldGame) {
    this.game = game;
    this.root = document.getElementById("item-review-tooltip")!;

    const s = this.fxSize;
    this.fxFrame = createFrame(s, s, 0, 0);

    this.colorCanvas = document.createElement("canvas");
    this.colorCanvas.width = s;
    this.colorCanvas.height = s;
    this.colorCtx = this.colorCanvas.getContext("2d")!;
    this.colorImg = this.colorCtx.createImageData(s, s);
    this.colorU32 = new Uint32Array(this.colorImg.data.buffer);

    this.lightCanvas = document.createElement("canvas");
    this.lightCanvas.width = s;
    this.lightCanvas.height = s;
    this.lightCtx = this.lightCanvas.getContext("2d")!;
    this.lightImg = this.lightCtx.createImageData(s, s);
    this.lightU32 = new Uint32Array(this.lightImg.data.buffer);

    this._bindGlobalEvents();
  }

  private _bindGlobalEvents() {
    document.addEventListener("mouseover", (ev) => {
      const target = (ev.target as HTMLElement | null)?.closest(
        "[data-review-uid], [data-review-def]"
      ) as HTMLElement | null;

      if (!target) return;
      if (target.closest("#modal-inventory")) {
        if (this.activeTargetEl) this.hide();
        return;
      }
      this.lastMouseX = ev.clientX;
      this.lastMouseY = ev.clientY;
      if (target !== this.activeTargetEl) {
        this.activeTargetEl = target;
        this._showForTarget(target, ev.clientX, ev.clientY);
      } else {
        this._position(ev.clientX, ev.clientY);
      }
    });

    document.addEventListener("mousemove", (ev) => {
      this.lastMouseX = ev.clientX;
      this.lastMouseY = ev.clientY;
      if (!this.activeTargetEl) return;
      if (!this.activeTargetEl.isConnected) {
        this.hide();
        return;
      }
      this._position(ev.clientX, ev.clientY);
    });

    document.addEventListener("mouseout", (ev) => {
      if (!this.activeTargetEl) return;
      const related = ev.relatedTarget as HTMLElement | null;
      if (!related || !this.activeTargetEl.contains(related)) {
        const nextTarget = related?.closest("[data-review-uid], [data-review-def]") as HTMLElement | null;
        if (!nextTarget) {
          this.hide();
        }
      }
    });

    document.addEventListener(
      "touchstart",
      (ev) => {
        const raw = ev.target as HTMLElement | null;
        if (raw && this.root.contains(raw)) return;
        const target = raw?.closest("[data-review-uid], [data-review-def]") as HTMLElement | null;
        if (!target || target.dataset.reviewSource === "hud" || target.closest("#modal-inventory")) {
          if (this.activeTargetEl) this.hide();
          return;
        }
        const t = ev.changedTouches[0];
        if (!t) return;
        this.lastMouseX = t.clientX;
        this.lastMouseY = t.clientY;
        this.activeTargetEl = target;
        this._showForTarget(target, t.clientX, t.clientY);
      },
      { passive: true }
    );

    document.addEventListener("scroll", () => this.hide(), true);
    window.addEventListener("blur", () => this.hide());
    window.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") this.hide();
    });
  }

  hide() {
    this.activeTargetEl = null;
    this.currentDef = null;
    this.currentAura = null;
    this.liveFx = null;
    this.pedestalCanvas = null;
    this.pedestalCtx = null;
    this.root.classList.add("hidden");
    this.root.setAttribute("aria-hidden", "true");
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private _resolveTarget(target: HTMLElement): ResolvedReviewItem | null {
    const uid = target.dataset.reviewUid;
    const sourceKind = target.dataset.reviewSource ?? "";
    if (uid) {
      const found = this.game.inv.findByUid(uid);
      if (found) {
        const def = ITEMS[found.item.defId];
        if (!def) return null;
        return {
          def,
          inst: found.item,
          isEquipped: found.location !== "bag",
          equippedSlot: found.location === "bag" ? null : found.location,
          sourceKind,
        };
      }
      const inStash = this.game.inv.findInStash(uid);
      if (inStash) {
        const def = ITEMS[inStash.defId];
        if (!def) return null;
        return {
          def,
          inst: inStash,
          isEquipped: false,
          equippedSlot: null,
          sourceKind: "stash",
        };
      }
    }

    const defId = target.dataset.reviewDef;
    if (!defId) return null;
    const def = ITEMS[defId];
    if (!def) return null;
    const enh = Number(target.dataset.reviewEnh || 0) || 0;
    const owned = Math.max(0, this.game.inv.countItem(defId));

    return {
      def,
      inst: { uid: "", defId, qty: Math.max(1, owned), enhanceLevel: enh },
      isEquipped: false,
      equippedSlot: null,
      sourceKind,
    };
  }

  private _showForTarget(target: HTMLElement, mx: number, my: number) {
    const resolved = this._resolveTarget(target);
    if (!resolved) {
      this.hide();
      return;
    }

    const { def, inst, isEquipped, sourceKind } = resolved;

    // Mask un-unlocked hidden items completely to avoid leaking secrets
    if (def.isHidden && !this.game.isHiddenItemUnlocked(def.id)) {
      this.root.innerHTML = `
        <div class="review-head-plaque">
          <div style="width:72px;height:72px;border:2px dashed #9b7ce0;background:#120e1a;display:flex;align-items:center;justify-content:center;color:#ffe066;font-size:24px;font-weight:700">?</div>
          <div class="review-head-meta">
            <div class="review-badges-row">
              <span class="review-wax-seal" style="color:#ffe066;border-color:#ff9922;background:#301b3d">✦ ẨN</span>
              <span class="review-rarity-txt" style="color:#c266ff">[Cổ Vật Bí Ẩn]</span>
            </div>
            <div class="review-item-name" style="color:#ffe066">??? — Cổ Vật Chưa Mở Khóa</div>
            <div class="review-sub-line">Thông số & danh tính bị phong ấn</div>
          </div>
        </div>
        <div class="rope-divider"></div>
        <div class="review-lore">“${def.hiddenHint ?? "Khám phá Lò Rèn Lăng Kính hoặc đánh bại Boss để giải phong ấn cổ vật này."}”</div>
      `;
      this.pedestalCanvas = null;
      this.pedestalCtx = null;
      this.currentDef = null;
      this.liveFx = null;
      this.root.classList.remove("hidden");
      this.root.setAttribute("aria-hidden", "false");
      this._position(mx, my);
      return;
    }

    const rInfo = RARITY_INFO[def.rarity];
    const tInfo = getTierBadge(def);
    const aura = resolveUiAuraKind(def.rarity, inst.enhanceLevel);

    const classReqName =
      def.requiredClass && def.requiredClass !== "all"
        ? getClassDef(def.requiredClass).vnName
        : "Tất cả Class";
    const classMismatch =
      def.requiredClass &&
      def.requiredClass !== "all" &&
      def.requiredClass !== this.game.player.classId;

    const slotLabel = def.slot
      ? SLOT_LABELS[def.slot]
      : def.category === "consumable"
        ? "Tiêu Thụ"
        : "Nguyên Liệu";

    // Body sections
    let bodyHtml = "";
    let footerLeft = "";

    if (def.category === "equipment") {
      const st = getItemEffectiveStats(inst);
      const diff = !isEquipped ? this.game.inv.compareWithEquipped(inst) : null;
      const rows: [string, number, number | undefined, string][] = [
        ["CÔNG (ATK)", st.atk, diff?.atk, ""],
        ["PHÉP (MAG)", st.mag, diff?.mag, ""],
        ["THỦ (DEF)", st.def, diff?.def, ""],
        ["MÁU (HP)", st.maxHp, diff?.maxHp, ""],
        ["TỐC ĐÁNH", st.aspdPct, diff?.aspdPct, "%"],
        ["CHÍ MẠNG", st.crit, diff?.crit, "%"],
        ["ST CHÍ MẠNG", st.critDmgPct, diff?.critDmgPct, "%"],
        ["HÚT MÁU", st.lifestealPct, diff?.lifestealPct, "%"],
        ["KHÁNG LỬA", st.fireResPct, diff?.fireResPct, "%"],
        ["TỐC CHẠY", st.spd, diff?.spd, ""],
        ["TỐC CHẠY %", st.moveSpeedPct, diff?.moveSpeedPct, "%"],
        ["NGUYÊN TỐ", st.elementBonus, diff?.elementBonus, "%"],
        ["THỂ LỰC", st.maxStamina, diff?.maxStamina, ""],
        ["PHÁ GIÁP", st.poiseBreakPct, diff?.poiseBreakPct, "%"],
        ["GIẢM CD [E]", st.skillCdPct, diff?.skillCdPct, "%"],
      ];

      const statLines = rows
        .filter(([, val, d]) => val !== 0 || (d !== undefined && d !== 0))
        .map(([lbl, val, d, unit]) => {
          const valSign = val >= 0 ? `+${val}` : `${val}`;
          let diffHtml = "";
          if (d !== undefined && d !== 0) {
            diffHtml =
              d > 0
                ? `<span class="review-diff-up">▲ +${d}${unit}</span>`
                : `<span class="review-diff-down">▼ ${d}${unit}</span>`;
          }
          return `<div class="review-stat-row"><span>${lbl}</span><b>${valSign}${unit}</b>${diffHtml}</div>`;
        })
        .join("");

      const dollFeatures: string[] = [];
      if (def.capeKey && CAPE_LABELS[def.capeKey]) {
        dollFeatures.push(`Kèm ${CAPE_LABELS[def.capeKey]}`);
      } else if (def.slot === "weapon") {
        dollFeatures.push(inst.enhanceLevel >= 5 ? "Vũ khí cầm tay (+5 phát sáng)" : "Hiển thị vũ khí cầm tay");
      } else if (def.slot === "helmet") {
        dollFeatures.push("Thay đổi Mũ nhân vật");
      } else if (def.slot === "armor") {
        dollFeatures.push("Thay đổi Giáp thân");
      } else if (def.slot === "boots") {
        dollFeatures.push("Giày bước chạy 2-frame");
      } else if (def.slot === "accessory") {
        dollFeatures.push("Vật thể quỹ đạo bay quanh");
      }

      let infuseNote = "";
      if (inst.enhanceLevel >= 5 && inst.infusedElement) {
        const em = ELEMENT_META[inst.infusedElement];
        infuseNote = `<div class="review-doll-note" style="border-left-color:${em.color}">★ Khảm Sắc Tố [+5]: <b>Hệ ${em.name}</b> (${em.infuseBonusDesc ?? "+8% ELEM"})</div>`;
      }
      if (inst.enhanceLevel >= 10 && def.slot === "weapon") {
        infuseNote += `<div class="review-doll-note" style="border-left-color:#ff88f2">★ Thức Tỉnh [+10]: <b>Khúc Xạ Lăng Kính (Prism)</b></div>`;
      }

      const weaponSkill = def.slot === "weapon" ? getWeaponSkillForItem(def.id) : null;
      const weaponSkillHtml = weaponSkill
        ? `<div class="review-doll-note" style="border-left-color:${weaponSkill.accent};background:#efe4c6;color:#2e170a">⚔ <b>Kỹ Năng Vũ Khí [E]: ${weaponSkill.name}</b> (${weaponSkill.cooldown}s · ${ELEMENT_META[weaponSkill.element].name})<br/>${weaponSkill.detailDesc}</div>`
        : "";
      const exoticSourceHtml = def.dropOnly
        ? `<div class="review-doll-note" style="border-left-color:#e03c68;color:#6b0c27">★ TRANG BỊ ĐỘC LẠ · Chỉ rơi khi hạ Quái & Boss (Không bán/không rèn)</div>`
        : def.seasonalBannerId
          ? `<div class="review-doll-note" style="border-left-color:#9b3fe0;color:#41126b">✦ ĐỘC QUYỀN RƯƠNG GACHA MÙA [G]</div>`
          : "";
      const passiveHtml = def.passive
        ? `<div class="review-doll-note" style="border-left-color:${def.passive.isCurse ? "#f43f5e" : "#f59e0b"};color:${def.passive.isCurse ? "#881337" : "#4a2308"}">✦ <b>${def.passive.name}</b>${def.passive.cooldownSec ? ` (CD ${def.passive.cooldownSec}s)` : ""}: ${def.passive.description}</div>`
        : def.passiveDesc
          ? `<div class="review-doll-note" style="border-left-color:#b85a14;color:#4a2308">✦ ${def.passiveDesc}</div>`
          : "";
      const hiddenSourceNote = def.isHidden
        ? `<div class="review-doll-note" style="border-left-color:#ff9922;color:#5c2106">✦ CỔ VẬT ẨN · ${
            def.hiddenSource === "craft_only"
              ? "Nguồn: Chỉ Chế Tạo tại Lò Rèn Lăng Kính"
              : `Nguồn: Độc quyền Boss ${def.sourceBossId ? ENEMIES[def.sourceBossId]?.name ?? def.sourceBossId : ""}`
          }</div>`
        : "";

      // Set bonus block
      let setHtml = "";
      if (def.setId && ALL_SET_BONUSES[def.setId]) {
        const setDef = ALL_SET_BONUSES[def.setId];
        let equippedPieces = 0;
        for (const s of EQUIP_SLOTS) {
          const eq = this.game.inv.equipment[s];
          if (eq && ITEMS[eq.defId]?.setId === def.setId) equippedPieces++;
        }
        const topLine = setDef.maxPieces === 3 ? setDef.threePieceLabel : setDef.fourPieceLabel;
        const topActive = setDef.maxPieces === 3 ? equippedPieces >= 3 : equippedPieces >= 4;
        setHtml = `
          <div class="review-set-box">
            <div class="review-set-title">✦ BỘ: ${setDef.name} (${equippedPieces}/${setDef.maxPieces})</div>
            <div class="review-set-line ${equippedPieces >= 2 ? "on" : ""}">${setDef.twoPieceLabel}</div>
            ${topLine ? `<div class="review-set-line ${topActive ? "on" : ""}">${topLine}</div>` : ""}
          </div>
        `;
      }

      const shards = getDismantleShardYield(inst);
      footerLeft = `Phân rã: <b>+${shards} Mảnh LK</b>`;

      bodyHtml = `
        <div class="review-stats-grid">${statLines}</div>
        ${weaponSkillHtml}
        ${exoticSourceHtml}
        ${infuseNote}
        ${hiddenSourceNote}
        ${passiveHtml}
        ${dollFeatures.length ? `<div class="review-doll-note">✦ Paper-Doll: ${dollFeatures.join(" · ")}</div>` : ""}
        ${setHtml}
      `;
    } else if (def.category === "consumable") {
      const spec = def.consumableSpec;
      const owned = this.game.inv.countItem(def.id);
      const grp = spec?.group ? CONSUMABLE_GROUP_LABELS[spec.group] : null;
      const effects: string[] = [];
      if (spec?.hpPct) effects.push(`Hồi +${Math.round(spec.hpPct * 100)}% HP`);
      if (spec?.staminaPct) effects.push(`Hồi +${Math.round(spec.staminaPct * 100)}% Thể lực`);
      if (spec?.speedPct) effects.push(`+${Math.round(spec.speedPct * 100)}% Tốc chạy`);
      if (spec?.atkPct) effects.push(`+${Math.round(spec.atkPct * 100)}% ATK`);
      if (spec?.critBonus) effects.push(`+${spec.critBonus}% CRIT`);
      if (spec?.defPct) effects.push(`Giảm ${Math.round(spec.defPct * 100)}% ST nhận (+12 DEF)`);
      if (spec?.overdriveGain) effects.push(`+${spec.overdriveGain}% Nộ [Q]`);
      if (spec?.invulnSec) effects.push(`${spec.invulnSec}s Bất tử`);
      if (spec?.cleanseSlow) effects.push("Giải làm chậm");
      const dur = spec?.shieldSec ?? spec?.durationSec;
      if (dur) effects.push(`Hiệu lực ${dur}s`);

      const hotkeyIndex =
        spec?.group === "hp" ? 1 : spec?.group === "stamina" ? 2 : spec?.group === "power" ? 3 : 4;
      bodyHtml = `
        <div class="review-tags-row">
          <span class="review-tag-chip">Phím nhanh [${hotkeyIndex}] ${grp ? `· ${grp.label}` : ""}</span>
          <span class="review-tag-chip">Trong túi: <b>x${owned}</b></span>
        </div>
        <div class="review-effects-box">${effects.map((e) => `<span class="review-effect-pill">✦ ${e}</span>`).join("")}</div>
      `;
      footerLeft = sourceKind === "hud" ? "Click phím để dùng ngay" : `Đang giữ: <b>x${owned}</b>`;
    } else {
      const owned = this.game.inv.countItem(def.id);
      const isGachaKey = Boolean(def.gachaKeyBiome);
      bodyHtml = `
        <div class="review-tags-row">
          <span class="review-tag-chip">${isGachaKey ? "🗝 Chìa Rương Gacha Mùa [G]" : "Khoáng sản & Chế tác"}</span>
          <span class="review-tag-chip">Trong túi: <b>x${owned}</b></span>
        </div>
        ${isGachaKey ? `<div class="review-doll-note" style="border-left-color:#d266ff;color:#41126b">★ Nhấn phím [G] hoặc lại Đài Gacha Thị Trấn để mở Rương Mùa!</div>` : ""}
      `;
      footerLeft = `Trong túi: <b>x${owned}</b>`;
    }

    const buyText = def.buyPrice ? `Mua <b>${def.buyPrice}G</b> · ` : "";
    const sellVal =
      def.category === "equipment" ? def.sellPrice + inst.enhanceLevel * 12 : def.sellPrice;
    const footerRight = `${buyText}Bán <b>${sellVal}G</b>`;

    const enhBadge =
      inst.enhanceLevel > 0 ? ` <span class="review-enh-badge">+${inst.enhanceLevel}</span>` : "";

    this.root.innerHTML = `
      <div class="review-head-plaque">
        <canvas id="review-pedestal-cv" class="review-pedestal" width="72" height="72"></canvas>
        <div class="review-head-meta">
          <div class="review-badges-row">
            <span class="review-wax-seal" style="color:${tInfo.color};border-color:${tInfo.color};background:${tInfo.bg}">${tInfo.badge}</span>
            <span class="review-rarity-txt" style="color:${rInfo.color}">[${rInfo.label}]</span>
            ${isEquipped ? `<span class="review-equipped-tag">★ ĐANG MẶC</span>` : ""}
          </div>
          <div class="review-item-name" style="color:${PLAQUE_NAME_COLORS[def.rarity] ?? rInfo.color}">
            ${def.name}${enhBadge}
          </div>
          <div class="review-sub-line">
            ${tInfo.label} · ${slotLabel}
          </div>
          ${
            def.category === "equipment"
              ? `<div class="review-class-line ${classMismatch ? "mismatch" : ""}">Yêu cầu: ${classReqName}</div>`
              : ""
          }
        </div>
      </div>
      <div class="rope-divider"></div>
      ${bodyHtml}
      <div class="review-lore">“${def.lore ?? def.desc}”</div>
      <div class="rope-divider"></div>
      <div class="review-foot">
        <span>${footerLeft}</span>
        <span>${footerRight}</span>
      </div>
    `;

    this.pedestalCanvas = this.root.querySelector("#review-pedestal-cv") as HTMLCanvasElement | null;
    this.pedestalCtx = this.pedestalCanvas?.getContext("2d") ?? null;
    this.currentDef = def;
    this.currentAura = aura;

    if (aura) {
      const mod = (aura === "cursed" ? cursedAuraMod : rarityAuraMod) as PixelfxModule;
      this.liveFx = createFx(mod, {
        x: this.fxSize / 2,
        y: this.fxSize / 2,
        palette: RARITY_PAL_BY_AURA[aura],
        tier: RARITY_TIER_BY_AURA[aura],
        radius: 23,
        seed: aura === "legendary" ? 73 : aura === "cursed" ? 66 : aura === "epic" ? 47 : 31,
      });
    } else {
      this.liveFx = null;
    }

    this._renderPedestalFrame();

    this.root.classList.remove("hidden");
    this.root.setAttribute("aria-hidden", "false");
    this._position(mx, my);

    if (this.liveFx) {
      this._startLoop();
    } else if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private _renderPedestalFrame() {
    const ctx = this.pedestalCtx;
    const def = this.currentDef;
    if (!ctx || !def) return;

    const s = this.fxSize;
    ctx.imageSmoothingEnabled = false;

    // Dark recessed obsidian showcase well with antique brass pins
    ctx.fillStyle = "#16101c";
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = "#2b1d12";
    ctx.fillRect(2, 2, s - 4, s - 4);
    ctx.fillStyle = "#120e1a";
    ctx.fillRect(4, 4, s - 8, s - 8);

    // Subtle pixel floor pedestal line
    ctx.fillStyle = "#261f33";
    ctx.fillRect(14, s - 14, s - 28, 3);
    ctx.fillStyle = "#3a2e4d";
    ctx.fillRect(18, s - 15, s - 36, 1);

    // Brass rivets on pedestal corners
    ctx.fillStyle = "#e8c86a";
    ctx.fillRect(4, 4, 2, 2);
    ctx.fillRect(s - 6, 4, 2, 2);
    ctx.fillRect(4, s - 6, 2, 2);
    ctx.fillRect(s - 6, s - 6, 2, 2);

    if (this.liveFx) {
      clearFrame(this.fxFrame);
      this.liveFx.draw(this.fxFrame, "back");
      this._blitFrame(ctx);
    }

    // Crisp 2x codixel icon (48x48) centered on the 72x72 pedestal
    drawItemIcon(ctx, def, 48, 12, 12);

    if (this.liveFx) {
      clearFrame(this.fxFrame);
      this.liveFx.draw(this.fxFrame, "front");
      this._blitFrame(ctx);
    }
  }

  private _blitFrame(ctx: CanvasRenderingContext2D) {
    this.colorU32.set(this.fxFrame.color);
    this.colorCtx.putImageData(this.colorImg, 0, 0);
    ctx.drawImage(this.colorCanvas, 0, 0);

    this.lightU32.set(this.fxFrame.light);
    this.lightCtx.putImageData(this.lightImg, 0, 0);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(this.lightCanvas, 0, 0);
    ctx.restore();
  }

  private _startLoop() {
    if (this.rafId) return;
    this.lastT = performance.now();
    const tick = (now: number) => {
      if (!this.activeTargetEl || !this.activeTargetEl.isConnected || this.root.classList.contains("hidden")) {
        this.hide();
        return;
      }
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastT) / 1000));
      this.lastT = now;

      if (this.liveFx) {
        this.liveFx.update(dt);
        this._renderPedestalFrame();
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private _position(mx: number, my: number) {
    const rect = this.root.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 10;

    let left = mx + 18;
    let top = my + 14;

    if (left + rect.width > vw - pad) {
      left = mx - rect.width - 18;
    }
    if (top + rect.height > vh - pad) {
      top = vh - rect.height - pad;
    }
    left = Math.max(pad, Math.min(vw - rect.width - pad, left));
    top = Math.max(pad, Math.min(vh - rect.height - pad, top));

    this.root.style.left = `${Math.round(left)}px`;
    this.root.style.top = `${Math.round(top)}px`;
  }
}
