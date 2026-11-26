import { CLASSES } from "../data/classes";
import {
  ALL_ELEMENTS,
  ELEMENT_META,
  REACTION_SPECS,
} from "../data/elements";
import { ENEMIES } from "../data/enemies";
import { SET_BONUSES } from "../data/equipments";
import type { CanonicalElement } from "../data/types";
import type { PixTelOpenWorldGame } from "../game";
import { sfx } from "../audio/chiptuneSynth";

export type TutorialTabId =
  | "tan_thu"
  | "combo"
  | "chieu_thuc"
  | "nguyen_to"
  | "trang_bi";

export interface BeginnerStepDef {
  id: string;
  title: string;
  keyBadge: string;
  desc: string;
}

export const BEGINNER_PRACTICE_STEPS: readonly BeginnerStepDef[] = [
  {
    id: "move",
    title: "Di chuyển & Chạy bứt tốc",
    keyBadge: "WASD / Shift",
    desc: "Dùng W/A/S/D để di chuyển quanh Thị Trấn (giữ thêm Shift để chạy nhanh tiêu hao Vòng Thể Lực).",
  },
  {
    id: "combo3",
    title: "Chuỗi Đánh Thường 3 Nhịp",
    keyBadge: "LMB ×3",
    desc: "Nhấp Chuột Trái 3 nhịp liên tiếp (N1 → N2 → N3) để kích hoạt trạng thái Tụ Lực Tức Thời!",
  },
  {
    id: "charge",
    title: "Đòn Tụ Lực & Just-Charge",
    keyBadge: "Giữ LMB",
    desc: "Giữ Chuột Trái đến khi thanh lực dưới chân đầy sáng vàng/trắng rồi thả ra để tung đòn Tụ Lực!",
  },
  {
    id: "dash",
    title: "Lướt Vô Địch (Chroma Dodge)",
    keyBadge: "Space",
    desc: "Nhấn Space để lướt nhanh có i-frame (né đòn trong 0.14s đầu kích hoạt Phản Kích Sắc Độ!).",
  },
  {
    id: "skill_e",
    title: "Kỹ Năng Vũ Khí [E]",
    keyBadge: "E / Chuột Phải",
    desc: "Mở Rương Tân Thủ [F] cạnh Quảng Trường để lấy & mặc Vũ Khí, rồi nhấn [E] (hoặc Chuột Phải) tung Kỹ Năng Vũ Khí!",
  },
  {
    id: "world_ui",
    title: "Túi Đồ [I] hoặc Tương Tác [F]",
    keyBadge: "I hoặc F",
    desc: "Nhấn [I] kiểm tra 5 ô trang bị, hoặc lại gần Trưởng Làng Elian / Bia Ký và nhấn [F] để hoàn tất!",
  },
];

const CLASS_BUILD_TIPS: Record<string, { elements: string; comboTip: string; pigmentTip: string }> = {
  prism_knight: {
    elements: "Chấn Động (Quake) · Lôi (Volt) · Lăng Kính (Prism)",
    comboTip:
      "Đỡ đòn bằng [E] Khiên Phản Quang đúng 0.25s đầu (Just-Parry) làm choáng quái -> Nối ngay Giữ LMB Xung Kích Chấn Động để đập vỡ Giáp Trắng Boss cực nhanh!",
    pigmentTip:
      "Khảm +5 Hỏa (nổ Quá Tải + Nham Chấn) hoặc Băng (kích Siêu Dẫn +15% Crit & Địa Chấn Băng +35% sát thương Tụ Lực).",
  },
  chroma_mage: {
    elements: "Xoay vòng 5 hệ: Hỏa · Băng · Mộc · Lôi · Sắc Độ + Gió / Lăng Kính",
    comboTip:
      "Bắn LMB gắn Ấn hệ hiện tại -> bấm [E] Vòng Xoáy Đổi Hệ để kích nổ Phản Ứng ngay lập tức và chuyển sang hệ tiếp theo, hoặc Giữ LMB bắn Tia Khúc Xạ Cầu Vồng (Prism) không xóa Ấn!",
    pigmentTip:
      "Khảm +5 Hư Không (gom quái & xóa buff) hoặc Sắc Độ (+12% ELEM & hồi năng lượng liên hoàn).",
  },
  bit_rogue: {
    elements: "Mộc/Độc (Nature) · Hư Không (Void) · Gió (Wind)",
    comboTip:
      "Đánh LMB tẩm độc -> [E] Đột Kích Hư Không xuyên lưng kích nổ Thối Rữa Hư Không (Blight Decay), khiến chuỗi chém tốc độ cao rút thêm sát thương mỗi đòn!",
    pigmentTip:
      "Khảm +5 Lôi (kích Xúc Tác hồi +15 Thể lực & +10 Nộ [Q]) hoặc Hỏa (nổ Bùng Độc Viêm AoE).",
  },
  pixel_tinker: {
    elements: "Lôi (Volt) · Hỏa (Fire) · Chấn Động (Quake) · Lăng Kính",
    comboTip:
      "Đặt tối đa 2 Ụ Súng bằng [E] bắn đạn Lôi tự động -> ném Giữ LMB Lựu Đạn Napalm Hỏa để ụ súng liên tục kích nổ Quá Tải Xung Kích phá 40% Giáp Trắng!",
    pigmentTip:
      "Khảm +5 Băng (ụ súng + đạn chính liên tục nổ Siêu Dẫn +15% Crit) hoặc Gió (Lôi Phong Xung lan điện 5 mục tiêu).",
  },
};

/**
 * Interactive 5-Tab Beginner Guide & 9-Element Combat Handbook Modal ([H] / [F1]):
 * Accessible anytime from the Title/Class Select screen, In-game HUD, or Pause menu.
 */
export class TutorialModalUI {
  private game: PixTelOpenWorldGame;
  private root: HTMLElement;
  private tabsEl: HTMLElement;
  private bodyEl: HTMLElement;
  private activeTab: TutorialTabId = "tan_thu";
  private elemFilter: "all" | CanonicalElement = "all";

  constructor(game: PixTelOpenWorldGame) {
    this.game = game;
    this.root = document.getElementById("modal-tutorial")!;
    this.tabsEl = document.getElementById("tutorial-tabs")!;
    this.bodyEl = document.getElementById("tutorial-body")!;

    document.getElementById("btn-close-tutorial")!.addEventListener("click", () => {
      sfx.playUiClick();
      this.game.closeTutorialModal();
    });
  }

  show(initialTab?: TutorialTabId) {
    if (initialTab) this.activeTab = initialTab;
    this.root.classList.remove("hidden");
    this.render();
  }

  hide() {
    this.root.classList.add("hidden");
  }

  render() {
    const tabs: { id: TutorialTabId; label: string }[] = [
      { id: "tan_thu", label: "🌱 Tân Thủ & Lộ Trình" },
      { id: "combo", label: "⌨ Combo Phím Cần Biết" },
      { id: "chieu_thuc", label: "⚔ Chiêu Thức 4 Class" },
      { id: "nguyen_to", label: "✦ 9 Nguyên Tố & Phản Ứng" },
      { id: "trang_bi", label: "🛡 Trang Bị, Lò Rèn & Boss" },
    ];

    this.tabsEl.innerHTML = tabs
      .map(
        (t) =>
          `<button class="px-btn sm ${this.activeTab === t.id ? "active primary" : ""}" data-tut-tab="${t.id}">${t.label}</button>`
      )
      .join("");

    this.tabsEl.querySelectorAll("[data-tut-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        sfx.playUiClick();
        this.activeTab = (btn as HTMLElement).dataset.tutTab as TutorialTabId;
        this.render();
      });
    });

    if (this.activeTab === "tan_thu") {
      this._renderBeginnerTab();
    } else if (this.activeTab === "combo") {
      this._renderComboTab();
    } else if (this.activeTab === "chieu_thuc") {
      this._renderClassSkillsTab();
    } else if (this.activeTab === "nguyen_to") {
      this._renderElementsTab();
    } else {
      this._renderGearAndForgeTab();
    }
  }

  private _renderBeginnerTab() {
    const isInWorld = this.game.running;
    const practiceState = isInWorld
      ? this.game.tutorialActive
        ? `Đang bật (Bước ${this.game.tutorialStep + 1}/${BEGINNER_PRACTICE_STEPS.length})`
        : this.game.tutorialCompleted
          ? "Đã hoàn thành (Có thể bật thực hành lại bất cứ lúc nào)"
          : "Đang tắt"
      : "Tự động kích hoạt khi bắt đầu phiêu lưu mới";

    const stepsHtml = BEGINNER_PRACTICE_STEPS.map((st, idx) => {
      const done = isInWorld && (this.game.tutorialCompleted || idx < this.game.tutorialStep);
      const current = isInWorld && this.game.tutorialActive && idx === this.game.tutorialStep;
      return `
        <div class="tut-step-card ${done ? "done" : ""} ${current ? "current" : ""}">
          <div class="tut-step-top">
            <span class="tut-step-num">${done ? "✓" : `BƯỚC ${idx + 1}`}</span>
            <b>${st.title}</b>
            <span class="tut-key-pill">${st.keyBadge}</span>
          </div>
          <div class="tut-step-desc">${st.desc}</div>
        </div>
      `;
    }).join("");

    this.bodyEl.innerHTML = `
      <div class="tut-hero-callout">
        <div>
          <div class="tut-callout-title">🌟 CHÀO MỪNG ĐẾN VỚI AETHEL-16 (PIXTEL 16-BIT ACTION RPG)</div>
          <div class="tut-callout-sub">
            Thế giới đang bị <b>Nhiễu Trắng (Bleach)</b> rút cạn màu sắc. Sứ mệnh của bạn là đánh thức <b>9 Trụ Sắc Màu</b>, giải mã <b>8 Bia Ký Cổ</b>, làm chủ <b>9 Nguyên Tố</b> và thanh tẩy <b>The Eraser</b>!
          </div>
          <div style="font-size:11px;color:#ffe066;margin-top:4px">
            Trạng thái Hướng dẫn thực hành trực tiếp: <b>${practiceState}</b>
          </div>
        </div>
        ${
          isInWorld
            ? `<div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0">
                <button id="btn-tut-start-live" class="px-btn good sm">▶ ${this.game.tutorialActive ? "LÀM LẠI TỪ BƯỚC 1" : "BẬT THỰC HÀNH 6 BƯỚC"}</button>
                ${
                  this.game.tutorialActive
                    ? `<button id="btn-tut-skip-live" class="px-btn sm">✕ TẮT BANNER HƯỚNG DẪN</button>`
                    : ""
                }
              </div>`
            : ""
        }
      </div>

      <div class="section-hdr">🎯 6 BƯỚC THỰC HÀNH CƠ BẢN CHO TÂN THỦ (HOÀN THÀNH NHẬN +50G & DẦU PHỦ QUANG PHỔ)</div>
      <div class="tut-grid-2">${stepsHtml}</div>

      <div class="section-hdr">🗺 LỘ TRÌNH PHÁT TRIỂN CHUẨN TRONG THẾ GIỚI MỞ</div>
      <div class="tut-grid-3">
        <div class="tut-info-box">
          <b style="color:#44ee88">1. Khởi đầu tại Thị Trấn (Safe Zone)</b>
          <p>Đứng trong Thị Trấn giúp tự hồi máu. Hãy gặp <b>Trưởng Làng Elian [F]</b> nhận nhiệm vụ chính tuyến Hồi I và đọc <b>Bia Ký số I</b> ngay cạnh Quảng Trường để lấy Vàng + XP đầu tay.</p>
        </div>
        <div class="tut-info-box">
          <b style="color:#5ef2ff">2. Vùng Nhiễu Trắng vs Vùng Đã Có Màu</b>
          <p>Vùng đất xám <b>Nhiễu Trắng</b> làm giảm hiệu ứng nguyên tố. Hãy tìm và thắp sáng <b>Trụ Sắc Màu [F]</b> ở mỗi quần xã để khôi phục màu 16-bit, mở <b>Dịch Chuyển Nhanh [M]</b> và nhận <b>Rương Sắc Màu</b>!</p>
        </div>
        <div class="tut-info-box">
          <b style="color:#ffe066">3. Vòng Thể Lực (Stamina Wheel)</b>
          <p>Chạy nhanh <code>Shift</code>, Lướt <code>Space</code> và Tụ Lực tiêu hao Vòng Thể Lực cạnh nhân vật. Đừng để cạn sạch gây <b>Kiệt Sức (Exhausted)</b>! Dùng <b>Chroma Dodge</b> hoặc phản ứng <b>Sắc Độ / Xúc Tác</b> để hồi ngay Thể Lực.</p>
        </div>
        <div class="tut-info-box">
          <b style="color:#ff9944">4. Khai Khoáng & Mở Rương Trại Quái</b>
          <p>Dùng đòn đánh thường đập vỡ <b>Mỏ Sắt / Tinh Thể</b> dọc đường để lấy Đá Rèn. Quét sạch quái quanh Rương Khóa để mở khóa chiến lợi phẩm.</p>
        </div>
        <div class="tut-info-box">
          <b style="color:#dfa3ff">5. Nâng Cấp +5 & Khảm 8 Bột Sắc Tố</b>
          <p>Gặp <b>Thợ Rèn Kael</b> cường hóa vũ khí an toàn không mất đồ. Đạt mốc <b>+5</b> sẽ mở khe khảm 1 trong <b>8 Bột Sắc Tố</b> giúp mỗi đòn đánh tự gán Ấn Nguyên Tố!</p>
        </div>
        <div class="tut-info-box">
          <b style="color:#ff5577">6. Đổi Class Tự Do & Săn Boss</b>
          <p>Muốn thử lối chơi khác? Lại gần <b>Đài Đổi Class [F]</b> ở Thị Trấn để chuyển đổi giữa 4 Class mà vẫn giữ nguyên Cấp độ, Túi đồ và Tiến trình nhiệm vụ!</p>
        </div>
      </div>
    `;

    this.bodyEl.querySelector("#btn-tut-start-live")?.addEventListener("click", () => {
      sfx.playUiClick();
      this.game.startGuidedTutorial();
      this.game.closeTutorialModal();
    });

    this.bodyEl.querySelector("#btn-tut-skip-live")?.addEventListener("click", () => {
      sfx.playUiClick();
      this.game.skipGuidedTutorial();
      this.render();
    });
  }

  private _renderComboTab() {
    const combos = [
      {
        name: "1. Liên Hoàn Tam Kích → Tụ Lực Tức Thời (Quick-Charge Link)",
        keys: ["LMB", "LMB", "LMB", "Giữ LMB (0.26s)"],
        tag: "DỒN SÁT THƯƠNG CỐT LÕI",
        tagColor: "#ffe066",
        desc: "Đánh đủ 3 nhịp thường (N1 → N2 → N3) sẽ bật trạng thái TỤ NHANH trong 0.8s, rút ngắn thời gian giữ LMB từ 0.38s xuống chỉ còn 0.26s để tung đòn Tụ Lực cực gắt!",
      },
      {
        name: "2. Canh Nhịp Ánh Kim (Golden Just-Charge Lv2)",
        keys: ["Giữ LMB", "Chờ thanh lực nháy Trắng-Vàng", "Thả LMB"],
        tag: "+35% DMG & HOÀN THỂ LỰC",
        tagColor: "#ff9933",
        desc: "Thả chuột đúng khoảnh khắc thanh tụ lực dưới chân nhân vật lóe sáng Trắng-Vàng (0.12s–0.34s sau khi đầy) để tăng 1.35× sát thương, đập vỡ mạnh Giáp Trắng và hồi lại +8 Thể Lực!",
      },
      {
        name: "3. Lướt Giữ Nhịp Không Đứt Chuỗi (Dash-Offset)",
        keys: ["LMB (N1)", "LMB (N2)", "Space (Né đòn)", "LMB (N3)"],
        tag: "CƠ ĐỘNG CAO",
        tagColor: "#5ef2d6",
        desc: "Đang đánh dở nhịp 1 hoặc 2 mà Boss vung đòn? Cứ nhấn Space lướt qua lưng Boss — nhịp Combo được bảo toàn suốt 1.1s để bạn tung ngay đòn kết liễu N3 ngay sau cú lướt!",
      },
      {
        name: "4. Né Hoàn Hảo — Phản Kích Sắc Độ (Chroma Dodge)",
        keys: ["Đòn địch sắp chạm", "Space (0.14s đầu)", "LMB / Giữ LMB"],
        tag: "KỸ NĂNG CAO THỦ",
        tagColor: "#ff66c4",
        desc: "Lướt đúng 0.14s đầu khi đòn đánh hoặc đạn quái quét qua người: Hồi tức thì +22 Thể Lực, +12% Nộ [Q], làm chậm địch quanh mình và cường hóa đòn đánh kế tiếp 1.65× ATK nổ sóng màu!",
      },
      {
        name: "5. Chuỗi Kích Nổ Phản Ứng Kép (Primer → Detonator)",
        keys: ["[4] Dầu Phủ / VK +5 (Gắn Ấn 1)", "[E] hoặc Giữ LMB (Hệ 2)", "[Q] Tuyệt Kỹ"],
        tag: "PHÁ GIÁP & KHỐNG CHẾ",
        tagColor: "#b266ff",
        desc: "Gắn Ấn nguyên tố thứ nhất lên mục tiêu (hiện chấm màu trên đầu quái), sau đó đánh bồi nguyên tố thứ hai khác hệ để kích hoạt 1 trong 29 Phản Ứng Nguyên Tố!",
      },
      {
        name: "6. Phản Đòn Ánh Sáng (Dành riêng Vệ Binh Lăng Kính)",
        keys: ["Canh đòn Boss", "[E] Khiên Phản Quang (0.25s đầu)", "Giữ LMB"],
        tag: "CHOÁNG TỨC THÌ",
        tagColor: "#38e8ff",
        desc: "Bật [E] đúng khoảnh khắc đòn đánh chạm khiên sẽ kích hoạt JUST-PARRY: Miễn thương, nổ xung kích làm Choáng kẻ địch và nối thẳng sang Tụ Lực Nhanh!",
      },
      {
        name: "7. Hóa Giải Nghi Thức 4 Trụ Sắc Màu (World Boss The Eraser)",
        keys: ["Boss dựng Khiên Nghi Thức", "Space áp sát Trụ", "LMB thắp 2–4 Trụ", "Dồn [Q] khi Boss Choáng"],
        tag: "CƠ CHẾ BOSS CUỐI",
        tagColor: "#ff5555",
        desc: "Ở Pha 2 (4 Trụ Cổ Điển) & Pha 3 (4 Trụ Nguyên Thủy), đánh thắp sáng 2 Trụ để phá Khiên và nhận Cộng Hưởng Nguyên Tố 8s — hoặc thắp đủ cả 4 Trụ để kích nổ SIÊU HỘI TỤ trừ thẳng 12% HP tối đa của Boss!",
      },
    ];

    const comboHtml = combos
      .map(
        (c) => `
        <div class="tut-combo-card">
          <div class="tut-combo-head">
            <b>${c.name}</b>
            <span class="tut-badge" style="color:${c.tagColor};border-color:${c.tagColor}">${c.tag}</span>
          </div>
          <div class="tut-key-chain">
            ${c.keys.map((k) => `<span class="tut-key-cap">${k}</span>`).join(`<span class="tut-arrow">➜</span>`)}
          </div>
          <div class="tut-combo-desc">${c.desc}</div>
        </div>
      `
      )
      .join("");

    this.bodyEl.innerHTML = `
      <div class="section-hdr">🎮 BẢNG PHÍM ĐIỀU KHIỂN NHANH</div>
      <div class="tut-controls-strip">
        <div><kbd>W A S D</kbd> Di chuyển</div>
        <div><kbd>Shift</kbd> Chạy nhanh</div>
        <div><kbd>Space</kbd> Lướt / Chroma Dodge</div>
        <div><kbd>LMB</kbd> Combo 3 nhịp</div>
        <div><kbd>Giữ LMB</kbd> Tụ Lực / Just-Charge</div>
        <div><kbd>E / RMB</kbd> Kỹ Năng Vũ Khí</div>
        <div><kbd>Q</kbd> Tuyệt kỹ Class (100% Nộ)</div>
        <div><kbd>1 2 3 4</kbd> Dược phẩm thông minh</div>
        <div><kbd>F</kbd> Tương tác / Nhặt / Mở rương</div>
        <div><kbd>I / B</kbd> Túi đồ & Trang bị</div>
        <div><kbd>J</kbd> Nhiệm vụ & Biên Niên Sử</div>
        <div><kbd>M</kbd> Bản đồ & Dịch chuyển</div>
        <div><kbd>V</kbd> Thu gọn HUD chiến đấu</div>
        <div><kbd>F11</kbd> Toàn màn hình</div>
        <div><kbd>H / F1</kbd> Cẩm nang Tân thủ</div>
      </div>

      <div class="section-hdr">⚡ 7 CHUỖI COMBO PHÍM THỰC CHIẾN CẦN BIẾT</div>
      <div class="tut-combo-list">${comboHtml}</div>
    `;
  }

  private _renderClassSkillsTab() {
    const curClass = this.game.player?.classId;
    const cardsHtml = CLASSES.map((cls) => {
      const tip = CLASS_BUILD_TIPS[cls.id];
      const isCurrent = this.game.running && curClass === cls.id;
      return `
        <div class="tut-class-card" style="border-color:${cls.accent}">
          <div class="tut-class-head">
            <div>
              <span style="color:${cls.accent};font-size:15px;font-weight:700">${cls.vnName}</span>
              <span style="color:#9aa4c2;font-size:12px"> (${cls.name}) · ${cls.role}</span>
            </div>
            ${isCurrent ? `<span class="tut-badge" style="color:#44ee88;border-color:#44ee88">★ CLASS ĐANG DÙNG</span>` : `<span class="tut-badge" style="color:${cls.accent};border-color:${cls.accent}">${cls.weaponType}</span>`}
          </div>
          <div class="tut-class-stats">
            <span>HP: <b>${cls.baseStats.hp}</b></span>
            <span>ATK: <b>${cls.baseStats.atk}</b></span>
            <span>DEF: <b>${cls.baseStats.def}</b></span>
            <span>SPD: <b>${cls.baseStats.spd}</b></span>
            <span>CRIT: <b>${cls.baseStats.crit}%</b></span>
            <span style="color:#ffe066">Hệ tự nhiên: <b>${tip.elements}</b></span>
          </div>
          <div class="tut-skill-grid">
            <div class="tut-skill-item">
              <span class="tut-skill-key">LMB</span>
              <div><b>Đánh thường · ${cls.skills.lmb.name}</b><p>${cls.skills.lmb.desc}</p></div>
            </div>
            <div class="tut-skill-item">
              <span class="tut-skill-key">Giữ LMB</span>
              <div><b>Tụ lực · ${cls.skills.charge.name}</b><p>${cls.skills.charge.desc}</p></div>
            </div>
            <div class="tut-skill-item">
              <span class="tut-skill-key">Skill [Q]</span>
              <div><b>Kỹ năng cố định · ${cls.skills.ult.name}</b><p>${cls.skills.ult.desc}</p></div>
            </div>
            <div class="tut-skill-item">
              <span class="tut-skill-key">[E] Vũ Khí</span>
              <div><b>${cls.skills.skill.name}</b><p>${cls.skills.skill.desc}</p></div>
            </div>
          </div>
          <div class="tut-class-tip">
            <div><b style="color:#5ef2ff">💡 Combo Tối Ưu:</b> ${tip.comboTip}</div>
            <div><b style="color:#ff9944">⚒ Gợi Ý Khảm Sắc Tố [+5]:</b> ${tip.pigmentTip}</div>
          </div>
        </div>
      `;
    }).join("");

    this.bodyEl.innerHTML = `
      <div class="tut-note-strip">
        💡 <b>Mẹo linh hoạt:</b> Bạn không bị khóa cứng vào 1 Class! Hãy đến <b>Đài Đổi Class [F]</b> giữa Thị Trấn Khởi Nguyên để đổi qua lại giữa cả 4 Class bất kỳ lúc nào mà vẫn giữ nguyên Level và Trang bị.
      </div>
      <div class="tut-combo-list">${cardsHtml}</div>
    `;
  }

  private _renderElementsTab() {
    const elemCards = ALL_ELEMENTS.map((el) => {
      const m = ELEMENT_META[el];
      const active = this.elemFilter === el ? "selected" : "";
      return `
        <div class="tut-elem-card ${active}" data-elem-pick="${el}" style="border-color:${m.color}">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:4px">
            <b style="color:${m.color}">${m.name} (${m.shortLabel})</b>
            ${m.infuseBonusDesc ? `<span style="font-size:10px;color:#ffe066">[+5: ${m.infuseBonusDesc}]</span>` : `<span style="font-size:10px;color:#ff88f2">[Thức tỉnh +10]</span>`}
          </div>
          <div style="font-size:11px;color:#d9e2ff;font-weight:600">${m.role}</div>
          <div style="font-size:11px;color:#98a2c0">${m.mechanic}</div>
        </div>
      `;
    }).join("");

    const filterBtns = [
      `<button class="px-btn sm ${this.elemFilter === "all" ? "active primary" : ""}" data-elem-filter="all">TẤT CẢ (${REACTION_SPECS.length})</button>`,
      ...ALL_ELEMENTS.map((el) => {
        const m = ELEMENT_META[el];
        const on = this.elemFilter === el;
        return `<button class="px-btn sm ${on ? "active" : ""}" data-elem-filter="${el}" style="border-color:${m.color};color:${on ? "#ffffff" : m.color}">${m.shortLabel}</button>`;
      }),
    ].join("");

    const filteredReactions = REACTION_SPECS.filter((r) => {
      if (this.elemFilter === "all") return true;
      if (this.elemFilter === "prism") return r.group === "prism";
      return r.elements[0] === this.elemFilter || r.elements[1] === this.elemFilter || r.group === "prism";
    });

    const reactionHtml = filteredReactions
      .map((r) => {
        const [e1, e2] = r.elements;
        const m1 = ELEMENT_META[e1];
        const m2 = ELEMENT_META[e2];
        const pairLabel =
          r.group === "prism"
            ? `<span style="color:#ffe066">ẤN BẤT KỲ</span> + <span style="color:${m1.color}">${m1.shortLabel}</span>`
            : `<span style="color:${m1.color}">${m1.shortLabel}</span> + <span style="color:${m2.color}">${m2.shortLabel}</span>`;
        const grpTag =
          r.group === "original"
            ? "GỐC"
            : r.group === "prism"
              ? "KHÚC XẠ ĐẶC BIỆT"
              : "MỞ RỘNG";
        return `
          <div class="reaction-card" style="border-left:3px solid ${r.color}">
            <div class="reaction-top">
              <div class="reaction-pair">${pairLabel}</div>
              <span class="reaction-grp">${grpTag}</span>
            </div>
            <div class="reaction-name" style="color:${r.color}">
              ${r.vnName} <span style="color:#8b95b5;font-weight:400;font-size:11px">(${r.enName})</span>
            </div>
            <div class="reaction-desc">${r.summary}</div>
          </div>
        `;
      })
      .join("");

    this.bodyEl.innerHTML = `
      <div class="section-hdr">🌈 9 NGUYÊN TỐ CỦA PIXTEL (CLICK VÀO HỆ ĐỂ LỌC CÔNG THỨC PHẢN ỨNG)</div>
      <div class="tut-grid-3">${elemCards}</div>

      <div class="section-hdr">⚗ BẢNG TRA CỨU PHẢN ỨNG CẶP ĐÔI (PRIMER + DETONATOR — HIỂN THỊ ${filteredReactions.length}/${REACTION_SPECS.length})</div>
      <div class="elem-filter-bar">${filterBtns}</div>
      <div class="tut-grid-2">${reactionHtml}</div>
    `;

    const bindFilter = (elVal: "all" | CanonicalElement) => {
      sfx.playUiClick();
      this.elemFilter = this.elemFilter === elVal && elVal !== "all" ? "all" : elVal;
      this.render();
    };

    this.bodyEl.querySelectorAll("[data-elem-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        bindFilter((btn as HTMLElement).dataset.elemFilter as "all" | CanonicalElement);
      });
    });

    this.bodyEl.querySelectorAll("[data-elem-pick]").forEach((card) => {
      card.addEventListener("click", () => {
        bindFilter((card as HTMLElement).dataset.elemPick as CanonicalElement);
      });
    });
  }

  private _renderGearAndForgeTab() {
    const setsHtml = Object.values(SET_BONUSES)
      .map(
        (s) => `
        <div class="tut-info-box">
          <b style="color:#5ef2ff">✦ ${s.name}</b>
          <p style="margin:2px 0;color:#c8d4f0">${s.twoPieceLabel}</p>
          <p style="margin:0;color:#ffe066">${s.fourPieceLabel}</p>
        </div>
      `
      )
      .join("");

    const bossIds = ["boss_xing_warden", "boss_blight_root", "boss_gilded_null", "boss_the_eraser"];
    const bossHtml = bossIds
      .map((id) => {
        const b = ENEMIES[id];
        if (!b) return "";
        const aff = b.elementAffinity ? ELEMENT_META[b.elementAffinity] : null;
        const weak = b.elementWeakness
          ? `<b style="color:${ELEMENT_META[b.elementWeakness].color}">Hệ ${ELEMENT_META[b.elementWeakness].name} (${ELEMENT_META[b.elementWeakness].shortLabel})</b>`
          : "Mọi Phản Ứng Nguyên Tố";
        return `
          <div class="tut-info-box" style="border-color:${b.isWorldBoss ? "#ff5577" : "#42496e"}">
            <div style="display:flex;justify-content:space-between;gap:6px">
              <b style="color:${b.isWorldBoss ? "#ff6688" : "#ffe066"}">${b.name}</b>
              ${aff ? `<span style="font-size:11px;color:${aff.color}">Hệ chủ đạo: ${aff.name}</span>` : ""}
            </div>
            <p style="margin:3px 0;font-size:11px;color:#d6def5">
              Điểm yếu Phá Giáp (+35% sát thương lên Giáp Trắng): ${weak}
            </p>
            ${
              b.isWorldBoss
                ? `<p style="margin:0;font-size:11px;color:#ff99cc">★ Pha 2 triệu hồi 4 Trụ Cổ Điển (Hỏa/Băng/Mộc/Lôi) · Pha 3 triệu hồi 4 Trụ Nguyên Thủy (Hư Không/Sắc Độ/Gió/Chấn Động). Thắp 2 Trụ khác hệ sẽ nhận Cộng Hưởng Nguyên Tố & bắn Tia Hội Tụ phá Khiên, gây 12% sát thương chuẩn!</p>`
                : ""
            }
          </div>
        `;
      })
      .join("");

    this.bodyEl.innerHTML = `
      <div class="section-hdr">🛡 HỆ THỐNG 5 Ô TRANG BỊ PAPER-DOLL & DƯỢC PHẨM THÔNG MINH [1–4]</div>
      <div class="tut-grid-3">
        <div class="tut-info-box">
          <b style="color:#ffe066">5 Ô Trang Bị & 5 Bậc T1–T5</b>
          <p>Gồm <b>Vũ Khí, Mũ, Giáp, Giày, Phụ Kiện</b> hiển thị trực tiếp lên nhân vật. Rê chuột vào bất kỳ món đồ nào để mở <b>Khung Cuộn Dây Thừng</b> tự động so sánh chỉ số tăng/giảm (▲/▼) so với món đang mặc!</p>
        </div>
        <div class="tut-info-box">
          <b style="color:#6effa8">Phân Rã Trang Bị Dư Thừa</b>
          <p>Nhặt được đồ cấp thấp không dùng? Bấm vào món đồ trong Túi <b>[I]</b> chọn <b>Phân Rã</b> để thu hồi ngay <b>Mảnh Lăng Kính</b> phục vụ chế tạo và kích Xúc Tác cường hóa!</p>
        </div>
        <div class="tut-info-box">
          <b style="color:#ff88f2">Phím Tắt Dược Phẩm Thông Minh [1–4]</b>
          <p><b>[1]</b> Hồi Máu · <b>[2]</b> Thể Lực & Tốc Chạy · <b>[3]</b> Cuồng Nộ & Dầu Phủ Nguyên Tố · <b>[4]</b> Khiên Aegis & Hộ Mệnh. Hệ thống tự động ưu tiên dùng bình phẩm chất cao nhất đang có!</p>
        </div>
      </div>

      <div class="section-hdr">⚒ LÒ RÈN LĂNG KÍNH (+0 → +10 AN TOÀN TUYỆT ĐỐI & CỔ VẬT 9 NGUYÊN TỐ)</div>
      <div class="tut-grid-2">
        <div class="tut-info-box">
          <b style="color:#44ee88">Cơ Chế Bảo Hiểm Pity — Không Bao Giờ Mất Đồ</b>
          <p>Cường hóa thất bại ở cấp cao <b>KHÔNG làm vỡ hay tụt cấp trang bị</b>, mà tích lũy ngay <b>+12% Tỉ lệ Bảo Hiểm Pity</b> cho lần đập kế tiếp (cộng dồn tới +60%). Từ +3 trở lên có thể bật thêm <b>Xúc Tác Mảnh Lăng Kính (+15%)</b>.</p>
        </div>
        <div class="tut-info-box">
          <b style="color:#ff9944">4 Mốc Đột Phá Sức Mạnh Vũ Khí & Giáp</b>
          <p>• <b>+3 (Tinh Luyện):</b> Tăng thêm +12% toàn bộ chỉ số cơ bản.<br/>
             • <b>+5 (Khe Nhuộm 8 Sắc Tố):</b> Khảm 1 trong 8 Bột Sắc Tố để đòn đánh mang nguyên tố đó + cộng chỉ số phụ đặc trưng!<br/>
             • <b>+7 (Cộng Hưởng):</b> Bùng phát hạt sáng nguyên tố quanh vũ khí.<br/>
             • <b>+10 (Thức Tỉnh Lăng Kính):</b> Vũ khí tự động thức tỉnh thêm <b>Hệ Lăng Kính (Prism)</b> bắn 3 tia khúc xạ truy kích!</p>
        </div>
      </div>

      <div class="section-hdr">✦ HIỆU ỨNG BỘ TRANG BỊ (SET BONUS 2 & 4 MÓN)</div>
      <div class="tut-grid-3">${setsHtml}</div>

      <div class="section-hdr">👑 CHIẾN THUẬT PHÁ GIÁP TRẮNG & KHẮC CHẾ 4 BOSS</div>
      <div class="tut-grid-2">${bossHtml}</div>
    `;
  }
}
