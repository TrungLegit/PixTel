import { CLASS_DISPLAY_NAMES, ITEMS, RARITY_INFO, SLOT_LABELS, canClassEquip, getItemEffectiveStats } from "../data/items";
import type { EquipSlot, StatAllocKey } from "../data/types";
import { sprites } from "../graphics/pixelSprites";
import type { PixTelOpenWorldGame } from "../game";
import { sfx } from "../audio/chiptuneSynth";

const STAT_ALLOC_ROWS: { key: StatAllocKey; label: string; effect: string }[] = [
  { key: "str", label: "STR", effect: "+3 ATK" },
  { key: "vit", label: "VIT", effect: "+18 HP, +1 DEF" },
  { key: "agi", label: "AGI", effect: "+2.5 SPD" },
  { key: "crt", label: "CRT", effect: "+1.5% Crit" },
];

/**
 * RPG Inventory, Equipment, Paper-Doll & Stat Allocation Modal [I]:
 * - Live 72x72 animated Paper-Doll hero preview reflecting equipped armor/weapon/ring/chip tiers
 * - Level-Up Stat Point allocation (STR / VIT / AGI / CRT) + 100G Respec
 * - 4 Equipment Slots + 32-Slot Bag Grid with Class-Lock indicators
 * - Live Stat Comparison Tooltip + Matrix Bonus Substats + Granted Skill Badges
 */
export class InventoryModalUI {
  private game: PixTelOpenWorldGame;
  private root: HTMLElement;
  private equipEl: HTMLElement;
  private statsEl: HTMLElement;
  private allocEl: HTMLElement;
  private tierEl: HTMLElement;
  private bagEl: HTMLElement;
  private detailEl: HTMLElement;
  private previewCanvas: HTMLCanvasElement;
  private previewCtx: CanvasRenderingContext2D;
  private selectedUid: string | null = null;
  private rafId = 0;
  private lastT = 0;
  private animT = 0;

  constructor(game: PixTelOpenWorldGame) {
    this.game = game;
    this.root = document.getElementById("modal-inventory")!;
    this.equipEl = document.getElementById("inv-equip-slots")!;
    this.statsEl = document.getElementById("inv-hero-stats")!;
    this.allocEl = document.getElementById("inv-stat-alloc")!;
    this.tierEl = document.getElementById("inv-preview-tier")!;
    this.bagEl = document.getElementById("inv-bag-grid")!;
    this.detailEl = document.getElementById("inv-item-detail")!;
    this.previewCanvas = document.getElementById("inv-hero-preview") as HTMLCanvasElement;
    this.previewCtx = this.previewCanvas.getContext("2d")!;
    this.previewCtx.imageSmoothingEnabled = false;

    document.getElementById("btn-close-inventory")!.addEventListener("click", () => {
      sfx.playUiClick();
      this.game.setModal(null);
    });
  }

  show() {
    this.root.classList.remove("hidden");
    this.render();
    this._startPreviewLoop();
  }

  hide() {
    this.root.classList.add("hidden");
  }

  private _startPreviewLoop() {
    if (this.rafId) return;
    this.lastT = performance.now();
    const tick = (now: number) => {
      if (this.root.classList.contains("hidden")) {
        this.rafId = 0;
        return;
      }
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastT) / 1000));
      this.lastT = now;
      this.animT += dt;

      const ctx = this.previewCtx;
      const w = this.previewCanvas.width;
      const h = this.previewCanvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = false;

      // Ground shadow under Paper-Doll
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(18, 62, 36, 5);

      const p = this.game.player;
      const loadout = this.game.inv.getVisualLoadout();
      const frame = Math.floor(this.animT * 5) % 4;
      const sp = sprites.getHeroDynamic(p.classId, loadout, frame);
      // Center 24x24 -> 72x72 (exact 3x nearest-neighbor pixel scaling)
      ctx.drawImage(sp.right, 0, 0, sp.w, sp.h, 0, 0, w, h);

      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  render() {
    const p = this.game.player;
    const inv = this.game.inv;
    const loadout = inv.getVisualLoadout();

    // Update Paper-Doll Tier Label
    if (loadout.weaponTier === "none" && loadout.armorTier === "none") {
      this.tierEl.textContent = "✊ Tay Không · Áo Vải";
      this.tierEl.style.color = "#ff99aa";
    } else {
      const parts: string[] = [];
      if (loadout.weaponTier !== "none") parts.push(`VK ${RARITY_INFO[loadout.weaponTier].label}`);
      if (loadout.armorTier !== "none") parts.push(`Giáp ${RARITY_INFO[loadout.armorTier].label}`);
      this.tierEl.textContent = parts.join(" · ");
      this.tierEl.style.color = "#5ef2ff";
    }

    // 1. Derived Hero Stats
    this.statsEl.innerHTML = `
      <div class="stat-pill"><span>LV</span><b>${p.level}</b></div>
      <div class="stat-pill"><span>HP</span><b style="color:#44ee88">${Math.ceil(p.hp)}/${p.maxHp}</b></div>
      <div class="stat-pill"><span>ATK</span><b style="color:#ff8844">${p.atk}</b></div>
      <div class="stat-pill"><span>DEF</span><b style="color:#5ef2ff">${p.def}</b></div>
      <div class="stat-pill"><span>SPD</span><b style="color:#ffee55">${p.spd}</b></div>
      <div class="stat-pill"><span>CRIT</span><b style="color:#ff66d8">${p.crit}%</b></div>
      <div class="stat-pill"><span>VÀNG</span><b style="color:#ffe066">${inv.gold} G</b></div>
    `;

    // 1.5 Stat Allocation Panel
    const alloc = p.allocatedStats;
    const totalAlloc = alloc.str + alloc.vit + alloc.agi + alloc.crt;
    const rowsHtml = STAT_ALLOC_ROWS.map((r) => {
      const val = alloc[r.key];
      const dis = p.statPoints <= 0 ? "disabled" : "";
      return `
        <div class="stat-alloc-row">
          <span class="stat-alloc-key">${r.label}</span>
          <span class="stat-alloc-desc"><b>${val}</b> (${r.effect})</span>
          <button class="px-btn sm ${p.statPoints > 0 ? "good" : "disabled"} stat-plus-btn" data-alloc="${r.key}" ${dis}>+</button>
        </div>
      `;
    }).join("");

    this.allocEl.innerHTML = `
      <div class="stat-alloc-hdr">
        <span>TIỀM NĂNG</span>
        <span style="color:${p.statPoints > 0 ? "#ffe066" : "#8b94b8"}">${p.statPoints} ĐIỂM</span>
      </div>
      ${rowsHtml}
      ${
        totalAlloc > 0
          ? `<button class="px-btn sm warn respec-btn" id="btn-respec-stats">↺ Tẩy Điểm (100 G)</button>`
          : `<div style="font-size:10px;color:#7e87a6">Lên cấp nhận +3 Điểm Tiềm Năng</div>`
      }
    `;

    this.allocEl.querySelectorAll("[data-alloc]").forEach((el) => {
      el.addEventListener("click", () => {
        const key = (el as HTMLElement).dataset.alloc as StatAllocKey;
        if (this.game.allocateStat(key)) {
          this.render();
        }
      });
    });

    this.allocEl.querySelector("#btn-respec-stats")?.addEventListener("click", () => {
      if (this.game.respecStats()) {
        this.render();
      }
    });

    // 2. 4 Equipment Slots
    this.equipEl.innerHTML = (["weapon", "armor", "ring", "chip"] as EquipSlot[])
      .map((slot) => {
        const it = inv.equipment[slot];
        if (!it) {
          return `<div class="equip-slot empty"><span class="slot-lbl">${SLOT_LABELS[slot]}</span><span class="slot-none">Trống</span></div>`;
        }
        const def = ITEMS[it.defId];
        const col = RARITY_INFO[def.rarity].color;
        const sel = this.selectedUid === it.uid ? "selected" : "";
        return `
          <div class="equip-slot ${sel}" data-uid="${it.uid}" style="border-color:${col}">
            <div class="slot-top">
              <span class="slot-lbl">${SLOT_LABELS[slot]}</span>
              ${it.enhanceLevel > 0 ? `<span class="enh-tag">+${it.enhanceLevel}</span>` : ""}
            </div>
            <div class="slot-name" style="color:${col}">
              <span class="item-swatch" style="background:${def.iconColor}"></span>
              ${def.name}
            </div>
          </div>
        `;
      })
      .join("");

    // 3. 32-Slot Bag Grid
    let bagHtml = "";
    for (let i = 0; i < 32; i++) {
      const it = inv.bag[i];
      if (!it) {
        bagHtml += `<div class="bag-cell empty"></div>`;
        continue;
      }
      const def = ITEMS[it.defId];
      const col = RARITY_INFO[def.rarity].color;
      const sel = this.selectedUid === it.uid ? "selected" : "";
      const lockedClass = def.category === "equipment" && !canClassEquip(def, p.classId);
      bagHtml += `
        <div class="bag-cell ${sel}" data-uid="${it.uid}" style="border-color:${col}${lockedClass ? ";opacity:0.65" : ""}" title="${def.name}${lockedClass ? " (Khác Class)" : ""}">
          <span class="bag-swatch" style="background:${def.iconColor}"></span>
          <span class="bag-short">${def.name}</span>
          ${it.qty > 1 ? `<span class="bag-qty">x${it.qty}</span>` : ""}
          ${it.enhanceLevel > 0 ? `<span class="bag-enh">+${it.enhanceLevel}</span>` : ""}
          ${lockedClass ? `<span class="bag-qty" style="right:auto;left:2px;color:#ff6688">🔒</span>` : ""}
        </div>
      `;
    }
    this.bagEl.innerHTML = bagHtml;

    // Bind click selection
    this.root.querySelectorAll("[data-uid]").forEach((el) => {
      el.addEventListener("click", () => {
        sfx.playUiClick();
        this.selectedUid = (el as HTMLElement).dataset.uid ?? null;
        this.render();
      });
    });

    this._renderDetail();
  }

  private _renderDetail() {
    if (!this.selectedUid) {
      this.detailEl.innerHTML = `<div class="detail-empty">Chọn một vật phẩm trong Túi hoặc Ô Trang Bị để xem thông số & kỹ năng mở khóa.</div>`;
      return;
    }

    const found = this.game.inv.findByUid(this.selectedUid);
    if (!found) {
      this.selectedUid = null;
      this.detailEl.innerHTML = `<div class="detail-empty">Chọn một vật phẩm để xem chi tiết.</div>`;
      return;
    }

    const { item, location } = found;
    const def = ITEMS[item.defId];
    const rInfo = RARITY_INFO[def.rarity];
    const playerClass = this.game.player.classId;
    const classOk = def.category !== "equipment" || canClassEquip(def, playerClass);

    let classBadge = "";
    if (def.category === "equipment") {
      if (def.allowedClasses?.length) {
        const names = def.allowedClasses.map((c) => CLASS_DISPLAY_NAMES[c] ?? c).join(", ");
        classBadge = classOk
          ? `<span class="class-req-ok">✓ Dành cho: ${names}</span>`
          : `<span class="class-req-bad">🔒 Chỉ Class: ${names}</span>`;
      } else {
        classBadge = `<span class="class-req-ok">Mọi Class</span>`;
      }
    }

    let statsHtml = "";
    if (def.category === "equipment") {
      const st = getItemEffectiveStats(item);
      const diff = location === "bag" ? this.game.inv.compareWithEquipped(item) : null;
      const rows: [string, number, number | undefined][] = [
        ["ATK", st.atk, diff?.atk],
        ["DEF", st.def, diff?.def],
        ["MAX HP", st.maxHp, diff?.maxHp],
        ["SPD", st.spd, diff?.spd],
        ["CRIT%", st.crit, diff?.crit],
      ];
      statsHtml = `<div class="detail-stats">${rows
        .filter(([, val, d]) => val !== 0 || (d !== undefined && d !== 0))
        .map(([lbl, val, d]) => {
          let diffBadge = "";
          if (d !== undefined && d !== 0) {
            diffBadge = d > 0 ? `<span class="diff-up">(+${d} ▲)</span>` : `<span class="diff-down">(${d} ▼)</span>`;
          }
          return `<div class="detail-stat-line"><span>${lbl}: <b>+${val}</b></span> ${diffBadge}</div>`;
        })
        .join("")}</div>`;
    }

    // Bonus Matrix Substats
    let bonusHtml = "";
    if (item.bonusStats) {
      const b = item.bonusStats;
      const bits: string[] = [];
      if (b.atk) bits.push(`+${b.atk} ATK`);
      if (b.def) bits.push(`+${b.def} DEF`);
      if (b.maxHp) bits.push(`+${b.maxHp} HP`);
      if (b.spd) bits.push(`+${b.spd} SPD`);
      if (b.crit) bits.push(`+${b.crit}% CRIT`);
      if (bits.length > 0) {
        bonusHtml = `<div class="bonus-sub-box">✡ Dòng Phụ Ma Trận: <b>${bits.join(" · ")}</b></div>`;
      }
    }

    // Skill / Passive Unlock box
    const unlockLines: string[] = [];
    if (def.grantsSkillE) {
      unlockLines.push(`✦ <b>Mở khóa [E] — ${def.grantsSkillE.name}:</b> ${def.grantsSkillE.desc}`);
    }
    if (def.grantsSkillQ) {
      unlockLines.push(`✦ <b>Mở khóa [Q] — ${def.grantsSkillQ.name}:</b> ${def.grantsSkillQ.desc}`);
    }
    if (def.passiveSkill) {
      unlockLines.push(`✦ <b>Nội tại — ${def.passiveSkill.name}:</b> ${def.passiveSkill.desc}`);
    }
    const unlockHtml = unlockLines.length > 0 ? `<div class="skill-unlock-box">${unlockLines.join("<br>")}</div>` : "";

    let btns = "";
    if (def.category === "equipment") {
      if (location === "bag") {
        if (classOk) {
          btns += `<button class="px-btn primary" id="inv-act-equip">TRANG BỊ</button>`;
        } else {
          btns += `<button class="px-btn disabled" id="inv-act-equip-locked">🔒 KHÁC CLASS</button>`;
        }
        btns += `<button class="px-btn warn" id="inv-act-sell">BÁN (+${def.sellPrice + item.enhanceLevel * 12}G)</button>`;
      } else {
        btns += `<button class="px-btn" id="inv-act-unequip">THÁO XUỐNG TÚI</button>`;
      }
    } else if (def.category === "consumable") {
      btns += `<button class="px-btn good" id="inv-act-use">SỬ DỤNG NGAY</button>`;
      btns += `<button class="px-btn warn" id="inv-act-sell">BÁN 1 (+${def.sellPrice}G)</button>`;
    } else {
      btns += `<button class="px-btn warn" id="inv-act-sell">BÁN 1 (+${def.sellPrice}G)</button>`;
    }

    this.detailEl.innerHTML = `
      <div class="detail-head" style="color:${rInfo.color}">
        <span class="item-swatch" style="background:${def.iconColor}"></span>
        ${def.name} ${item.enhanceLevel > 0 ? `+${item.enhanceLevel}` : ""}
      </div>
      <div class="detail-sub">[${rInfo.label}] ${def.slot ? `· ${SLOT_LABELS[def.slot]}` : ""} ${location !== "bag" ? "· ĐANG MẶC" : ""} ${classBadge}</div>
      <div class="detail-desc">${def.desc}</div>
      ${statsHtml}
      ${bonusHtml}
      ${unlockHtml}
      <div class="detail-actions">${btns}</div>
    `;

    this.detailEl.querySelector("#inv-act-equip")?.addEventListener("click", () => {
      const res = this.game.inv.equipFromBag(item.uid, this.game.player.classId);
      if (res.ok) {
        this.game.recalcPlayerStats(true);
        sfx.playLootPickup(true);
        this.game.saveGame(false);
        this.game.refreshHud();
        this.render();
      } else {
        sfx.playForgeFail();
        this.game.uiToast(res.reason ?? "Không thể trang bị vật phẩm này!", "warn");
      }
    });

    this.detailEl.querySelector("#inv-act-equip-locked")?.addEventListener("click", () => {
      sfx.playForgeFail();
      const check = this.game.inv.canEquip(item, this.game.player.classId);
      this.game.uiToast(check.reason ?? "Class hiện tại không thể dùng trang bị này!", "warn");
    });

    this.detailEl.querySelector("#inv-act-unequip")?.addEventListener("click", () => {
      if (location !== "bag" && this.game.inv.unequipSlot(location)) {
        this.game.recalcPlayerStats(true);
        sfx.playUiClick();
        this.game.saveGame(false);
        this.game.refreshHud();
        this.render();
      }
    });

    this.detailEl.querySelector("#inv-act-use")?.addEventListener("click", () => {
      if (this.game.useConsumableById(item.defId)) {
        this.game.refreshHud();
        this.render();
      }
    });

    this.detailEl.querySelector("#inv-act-sell")?.addEventListener("click", () => {
      const gained = this.game.inv.sellBagItem(item.uid);
      if (gained > 0) {
        sfx.playBuy();
        this.game.uiToast(`Đã bán ${def.name}, nhận +${gained} G!`, "good");
        this.game.refreshHud();
        this.render();
      }
    });
  }
}
