# PIXTEL — Team Development Log (`DEV_LOG.md`)

> **Quy tắc bắt buộc cho mọi thành viên & AI hỗ trợ (Vibe-Code Rule):**
> 1. **Đọc trước khi code:** Luôn đọc mục **Trạng Thái Hiện Tại** và **3–5 bản ghi mới nhất** bên dưới trước khi sửa bất kỳ file nào, để biết dự án đang ở giai đoạn nào và tránh đụng độ / phá vỡ code của người khác.
> 2. **Ghi ngay sau khi xong:** Sau mỗi lần cập nhật tính năng, sửa bug, hoặc refactor, **bắt buộc** thêm một bản ghi mới vào **đầu** mục `## Nhật Ký Cập Nhật` (mới nhất ở trên cùng) theo đúng **Template Chuẩn** và cập nhật lại `## Trạng Thái Hiện Tại` nếu giai đoạn thay đổi.
> 3. **Commit cùng code:** Luôn stage & commit `DEV_LOG.md` chung với các file code bạn vừa thay đổi. **Không xóa lịch sử log cũ.**

---

## Trạng Thái Hiện Tại (Current Project Stage Snapshot)

- **Giai đoạn / Phiên bản hiện tại:** `PIXTEL v2.6+` — Hardcore RPG Progression, 9-Element Pairwise Reaction Matrix, Rune Matrix Forge, 122-Frame Monster Atlas & Synced Pixelfx
- **Commit mới nhất trên `main`:** `a9b1410` (`2026-11-25`, tác giả: `chu0n6-iot`)
- **Thành viên / AI đóng góp gần đây:** `TrungLegit`, `Antigravity`, `Yaros`, `chu0n6-iot`
- **Các hệ thống chính đã hoàn thiện:**
  - **Thế giới mở & Đồ họa 16-Bit:** Bản đồ liền mạch `160×160` tile (`480×270` integer-scaled Canvas 2D), Thị Trấn Khởi Nguyên + 4 quần xã, cơ chế Khôi phục sắc màu (Bleached → Restored), 9 Trụ Sắc Màu & Dịch chuyển nhanh `[M]`, Dual-Grid visuals.
  - **Chiến đấu & Lớp nhân vật:** 4 Class (`Prism Knight`, `Chroma Mage`, `Bit Rogue` melee LMB, `Pixel Tinker`), ma trận phản ứng **9 nguyên tố theo cặp**, kỹ năng `[E]`, tuyệt kỹ `[Q]`, đồng bộ VFX `pixelfx`, animation 122-frame monster atlas & boss seals (gồm Phase 2/3 Eraser totems).
  - **Trang bị, Túi đồ & Lò Rèn:** Hệ thống trang bị 5 ô (`helmet`, `armor`, `weapon`, `boots`, `accessory`), giao diện Túi đồ 16-bit `[I/B]`, Paper-Doll pixel rendering trực tiếp trên nhân vật, 5-tier codixel items + vintage rope hover frame, phân bổ chỉ số (stat allocation), Rune Matrix Forge & Prism Forge `+0 → +10` (8-pigment +5 forge & bản vẽ chế tạo), **8 Vật phẩm ẩn (`isHidden: true`: 4 `craft_only` + 4 `boss_only`)** với cơ chế che thông số `???` & lưu mở khóa vĩnh viễn qua `localStorage`, Loot Table nảy/tự hút & Rương Sắc Màu.
  - **Nội dung & Hướng dẫn:** Cốt truyện Aethel-16 & Lore Codex, Quest overhaul, Cẩm nang tân thủ 5 tab, `README.md` kèm video MP4 / GIF / screenshots, và Rule `DEV_LOG.md`.
- **Trọng tâm tiếp theo (Active / Next Focus Areas):**
  - *(Thành viên tiếp theo khi bắt đầu task mới hãy ghi rõ mình đang nhận phần nào tại đây hoặc thêm bản ghi mới bên dưới sau khi hoàn tất.)*

---

## Template Chuẩn (Copy khi thêm bản ghi mới)

```markdown
### [YYYY-MM-DD HH:mm] — <Tên / Author (hoặc AI)> — <Tiêu đề ngắn gọn>
- **Commit / Branch:** `<hash hoặc nhánh>`
- **Giai đoạn / Version:** `<ví dụ: PIXTEL v2.6+ / Combat Polish>`
- **Đã làm (Done):**
  - <Mô tả ngắn gọn từng thay đổi chính>
- **File chính đã sửa / thêm:** `path/to/file1.ts`, `path/to/file2.ts`
- **Kiểm tra (Verified):** `<ví dụ: npm run typecheck, npm run build, test headless / manual>`
- **Lưu ý / Handoff (Breaking changes / Đang dở):** <Nếu không có thì ghi "Không có">
- **Gợi ý bước tiếp theo (Next Steps):** <Việc nên làm tiếp cho người sau>
```

---

## Nhật Ký Cập Nhật (Newest First)

### [2026-11-26 06:54 UTC] — GitHub Copilot — Đồng bộ hình dáng trang bị & dư ảnh Dash
- **Commit / Branch:** `feat/vietnamese-pixel-game-font`
- **Giai đoạn / Version:** `PIXTEL v2.6+` — Paper-Doll & Combat VFX Polish
- **Đã làm (Done):**
  - Ánh xạ `visualStyle.shape` của mũ, giáp, giày và phụ kiện vào rig/palette nhân vật; thêm các hình mũ, vai giáp, giày và icon phụ kiện pixel có viền rõ. Renderer tiếp tục dùng class và loadout hiện tại của người chơi.
  - Thêm một bóng dư ảnh nhân vật theo hướng Dash bằng sprite đã cache, giữ Canvas pixel-sharp; tái sử dụng VFX manager và hook combat hiện có, không đổi damage/cooldown/drop/AI.
- **File chính đã sửa / thêm:** `src/graphics/pixelfxHeroModels.ts`, `src/graphics/paperDoll.ts`, `src/vfx/pixelfx/core/rig.js`, `src/vfx/pixelfxTypes.ts`, `src/game.ts`, `tests/featureTests.ts`
- **Kiểm tra (Verified):** `npm run build`, `npm run test` (11/11 feature suites after syncing the latest main changes), `git diff --check`.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không có thay đổi schema trang bị hoặc cân bằng. VFX combo/[E]/[Q]/hitstop tiếp tục dùng pipeline hiện có.
- **Gợi ý bước tiếp theo (Next Steps):** Push nhánh đã đồng bộ và mở draft PR cho phần render/VFX.

### [2026-11-25 15:02] — GitHub Copilot — Đồng bộ nhánh font với main
- **Commit / Branch:** `feat/vietnamese-pixel-game-font` (merge `origin/main`)
- **Giai đoạn / Version:** `PIXTEL v2.6+` — Merge & Hidden Relics
- **Đã làm (Done):**
  - Tích hợp các cập nhật mới từ `main`, bao gồm hệ thống Vật phẩm ẩn và 11 bộ kiểm thử tính năng.
  - Hợp nhất đồ thị Project Brain từ hai nhánh, compact các node trùng và tạo lại index.
- **File chính đã sửa / thêm:** `.brain/INDEX.md`, `.brain/nodes.jsonl`, `.brain/edges.jsonl`, `DEV_LOG.md`
- **Kiểm tra (Verified):** `npm ci`, `npm run build`, `npm run test` (11/11 suites), `brain.py lint`; build còn cảnh báo bundle JS lớn hơn 500 kB.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không có xung đột mã nguồn; font Pixelify cục bộ và hệ thống Vật phẩm ẩn cùng tồn tại.
- **Gợi ý bước tiếp theo (Next Steps):** Tiếp tục kiểm thử gameplay cho Vật phẩm ẩn đã được tích hợp.

### [2026-11-25 14:50] — GitHub Copilot — Tự lưu trữ font Pixelify hỗ trợ tiếng Việt
- **Commit / Branch:** `feat/vietnamese-pixel-game-font`
- **Giai đoạn / Version:** `PIXTEL v2.6+` — Font & Typography
- **Đã làm (Done):**
  - Chuyển toàn bộ giao diện và nhãn canvas Bản Đồ sang Pixelify Sans Variable theo phong cách pixel/Minecraft, hỗ trợ dấu tiếng Việt qua Latin Extended.
  - Đóng gói font từ npm theo SIL OFL 1.1, bỏ phụ thuộc Google Fonts bên ngoài và thêm bản quyền/giấy phép vào tài nguyên public.
- **File chính đã sửa / thêm:** `package.json`, `package-lock.json`, `index.html`, `src/main.ts`, `style.css`, `src/ui/WorldMapModal.ts`, `public/licenses/Pixelify-Sans-OFL.txt`
- **Kiểm tra (Verified):** `npm ci`, `npm run build`, `npm run test` (10/10 suites), `git diff --check`; Playwright xác nhận font Vietnamese Latin Extended tải từ local và giao diện hiển thị trên desktop/mobile.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không còn yêu cầu mạng Google Fonts để hiển thị chữ.
- **Gợi ý bước tiếp theo (Next Steps):** Mở draft PR riêng cho phần font; PR màn hình khởi đầu đã được merge.

### [2026-11-25 14:38] — GitHub Copilot — Tinh chỉnh chữ PIXTEL theo font pixel khối
- **Commit / Branch:** `feat/epic-pixel-grid-title-screen`
- **Giai đoạn / Version:** `PIXTEL v2.6+` — Title Screen Polish
- **Đã làm (Done):**
  - Dựa trên mẫu font Minecraft Việt hóa được cung cấp, chuyển chữ PIXTEL và huy hiệu `16-BIT` sang bitmap khối 7×7 tự dựng, nét dày và rõ hơn.
  - Tăng chiều cao canvas để tách wordmark khỏi huy hiệu, giữ nguyên huy hiệu lăng kính và hiệu ứng pixel-grid.
- **File chính đã sửa / thêm:** `src/ui/ClassSelect.ts`, `index.html`
- **Kiểm tra (Verified):** `npm run build`, `npm run test` (10/10 suites), `git diff --check`; kiểm tra trực quan màn hình mobile bằng Playwright.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Dùng glyph bitmap tự dựng theo phong cách khối, không thêm font hoặc tài nguyên bên ngoài.
- **Gợi ý bước tiếp theo (Next Steps):** Cập nhật draft PR hiện có bằng commit mới.

### [2026-11-25 14:30] — GitHub Copilot — Huy hiệu PIXTEL & màn hình khởi đầu pixel-grid
- **Commit / Branch:** `feat/epic-pixel-grid-title-screen`
- **Giai đoạn / Version:** `PIXTEL v2.6+` — Title Screen Polish
- **Đã làm (Done):**
  - Thay wordmark chữ bằng canvas logo PIXTEL 16-bit: huy hiệu lăng kính nhiều sắc độ, bitmap lettering, lưới pixel và spark chuyển động.
  - Đồng bộ màn chọn Class thành màn mở đầu sử thi với nền pixel-grid, khung màu vàng/cyan và bố cục một cột dễ đọc trên điện thoại; giữ nguyên Continue, Start và Hướng dẫn.
- **File chính đã sửa / thêm:** `index.html`, `src/ui/ClassSelect.ts`, `style.css`
- **Kiểm tra (Verified):** `npm run build`, `npm run test` (10/10 suites), `git diff --check`; kiểm tra trực quan màn hình desktop và mobile bằng Playwright.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không thay đổi gameplay hoặc luồng lưu game.
- **Gợi ý bước tiếp theo (Next Steps):** Review và merge draft PR.

### [2026-11-25 21:30] — TrungLegit (AI) — Hệ thống Vật phẩm ẩn (`Craft-Only` & `Boss-Drop Only`)
- **Commit / Branch:** `main`
- **Giai đoạn / Version:** `PIXTEL v2.6+` — Hidden Relics System
- **Đã làm (Done):**
  - Tạo [src/data/hiddenItems.ts](src/data/hiddenItems.ts) gồm **8 Vật phẩm ẩn** (`isHidden: true`, Epic/Legendary trải đều 5 ô): 4 món `craft_only` (*Kiếm Thất Sắc Nguyên Thủy*, *Vương Miện Aethel-16*, *Thánh Giáp Hồi Sắc*, *Ấn Hút Mạch Lăng Kính*) và 4 món `boss_only` (*Áo Giáp Cổ Thụ Bất Diệt*, *Mũ Nhãn Rồng Lăng Kính*, *Hài Hổ Phách Vô Ảnh*, *Thần Kiếm Xóa Sắc — Null Sever*).
  - Bổ sung 3 nội tại mới (`restored_prism_surge`, `energy_siphon_magnet`, `set_resonance_echo`) tích hợp vào `recalculatePlayerStats()`, `CombatSystem`, tầm hút loot (`+60px`) và hồi phục sau hạ quái.
  - Bảo đảm tuyệt đối không rò rỉ vào Shop thường, `pickRandomEquipByRarity()` (rương/rơi ngẫu nhiên) hay bảng drop quái thường; lần đầu hạ mỗi Boss đảm bảo rơi cổ vật ẩn kèm `pixtel/rainbow-burst` + `waypoint-pillar` + `playHiddenDrop()`.
  - Ẩn danh tính & chỉ số (`??? — Bản Thiết Kế Bí Ẩn` / `??? — Cổ Vật Chưa Mở Khóa`) trên tab `✦ Bản Vẽ Ẩn` của `ForgeModal` và `ItemReviewTooltip` trước khi mở khóa; lưu mở khóa vĩnh viễn trong `localStorage` (`pixtel_hidden_unlocks_v1` + `SaveDataV2.unlockedHiddenItems`).
  - Thêm bộ test thứ 11 vào `tests/featureTests.ts` kiểm tra toàn bộ điều kiện ẩn, `craft_only`, `boss_only`, save/load và chỉ số.
- **File chính đã sửa / thêm:** `src/data/hiddenItems.ts`, `src/data/types.ts`, `src/data/items.ts`, `src/data/recipes.ts`, `src/world/entities.ts`, `src/systems/saveSystem.ts`, `src/systems/inventorySystem.ts`, `src/systems/forgeSystem.ts`, `src/systems/combat.ts`, `src/audio/chiptuneSynth.ts`, `src/game.ts`, `src/ui/ForgeModal.ts`, `src/ui/ItemReviewTooltip.ts`, `tests/featureTests.ts`
- **Kiểm tra (Verified):** `npm run typecheck`, `npm run build`, `11/11` feature test suites pass, và kiểm thử headless Chrome UI (`✦ Bản Vẽ Ẩn` masked `???` -> giải mã -> chế tạo -> lưu `localStorage`).
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không có breaking change; các save cũ v2/v3 tự tương thích và tự đồng bộ mở khóa khi nhặt/chế tạo đồ ẩn.
- **Gợi ý bước tiếp theo (Next Steps):** Commit & push lên `main`; có thể thêm mục tra cứu Bộ Sưu Tập Cổ Vật Ẩn vào Cẩm Nang `[H]` nếu muốn.

### [2026-11-25 20:48] — TrungLegit (AI) — Thiết lập Team Vibe-Code Rule & `DEV_LOG.md`
- **Commit / Branch:** `main`
- **Giai đoạn / Version:** `PIXTEL v2.6+` — Quy trình cộng tác & Handoff AI
- **Đã làm (Done):**
  - Tạo [DEV_LOG.md](DEV_LOG.md) tổng hợp trạng thái hiện tại, template chuẩn và lịch sử phát triển từ các commit thực tế trên `main`.
  - Thêm mục **Team Vibe-Code Rule** bắt buộc đọc `DEV_LOG.md` trước khi code và ghi log sau khi xong vào [AGENTS.md](AGENTS.md), [GEMINI.md](GEMINI.md), [.github/copilot-instructions.md](.github/copilot-instructions.md) và tạo [CLAUDE.md](CLAUDE.md).
- **File chính đã sửa / thêm:** `DEV_LOG.md`, `AGENTS.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `CLAUDE.md`
- **Kiểm tra (Verified):** Đồng bộ Project Brain (`sync`, `lint`, `digest`) và đối chiếu nội dung rule đồng nhất giữa các file cấu hình AI.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không thay đổi code gameplay; chỉ bổ sung quy ước làm việc cho cả team và các AI agent.
- **Gợi ý bước tiếp theo (Next Steps):** Commit `DEV_LOG.md` và các file rule lên `main` để toàn bộ team áp dụng từ phiên vibe-code tiếp theo.

### [2026-11-25] — chu0n6-iot — Compact and clean Project Brain graph after v2.6 merge
- **Commit / Branch:** `a9b1410` (`main`)
- **Giai đoạn / Version:** `PIXTEL v2.6+` (Project Brain Maintenance)
- **Đã làm (Done):**
  - Dọn dẹp, compact và đồng bộ lại đồ thị Project Brain (`.brain/`) sau đợt merge v2.6.
- **File chính đã sửa / thêm:** `.brain/INDEX.md`, `.brain/edges.jsonl`, `.brain/nodes.jsonl`
- **Kiểm tra (Verified):** Đã commit lên `main`.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không có.
- **Gợi ý bước tiếp theo (Next Steps):** Chạy `brain.py sync` đầu mỗi phiên trước khi code.

### [2026-11-25] — Yaros — Upgrade pixelfx animations, 122-frame monster atlas & UI/quest overhaul
- **Commit / Branch:** `4df9348` (`main`)
- **Giai đoạn / Version:** `PIXTEL v2.6+`
- **Đã làm (Done):**
  - Nâng cấp animation hero/quái bằng `pixelfx`, tích hợp atlas quái 122 frame.
  - Đồng bộ hiệu ứng kỹ năng VFX, làm mới UI/Quest và điều chỉnh `Bit Rogue` đánh cận chiến LMB.
- **File chính đã sửa / thêm:** Các module animation/VFX, UI, quest và combat của `Bit Rogue` (theo commit `4df9348`).
- **Kiểm tra (Verified):** Đã merge/commit lên `main`.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Đọc kỹ code combat & UI mới nhất trước khi chỉnh sửa `Bit Rogue` hoặc modal Quest/UI.
- **Gợi ý bước tiếp theo (Next Steps):** Kiểm thử cân bằng gameplay thực chiến với atlas mới và phản hồi UI.

### [2026-11-25] — Yaros — Hardcore RPG progression, Rune Matrix Forge, stat allocation & boss seals
- **Commit / Branch:** `4c4bcd2`, `44b721f` (`main`)
- **Giai đoạn / Version:** `PIXTEL v2.6+`
- **Đã làm (Done):**
  - Tích hợp tiến trình RPG hardcore với hệ thống phân bổ điểm chỉ số (stat allocation).
  - Bổ sung **Rune Matrix Forge**, trang bị khóa Class, phong ấn Boss (boss seals) và nâng cấp hiển thị **Dual-Grid visuals**.
- **File chính đã sửa / thêm:** Các hệ thống progression, forge, boss seals và tile/grid rendering (theo commit `44b721f`, `4c4bcd2`).
- **Kiểm tra (Verified):** Đã merge hoàn chỉnh với nhánh `PIXTEL v2.6` trên `main`.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Lưu ý tương thích save/công thức giữa Rune Matrix Forge và Prism Forge khi thêm trang bị mới.
- **Gợi ý bước tiếp theo (Next Steps):** Tinh chỉnh cân bằng kinh tế/nguyên liệu giữa các mốc Boss.

### [2026-11-25] — Antigravity — PIXTEL v2.6: 9-element reaction matrix, Eraser totems & 5-tab handbook
- **Commit / Branch:** `1ffc570` (`main`)
- **Giai đoạn / Version:** `PIXTEL v2.6`
- **Đã làm (Done):**
  - Xây dựng ma trận phản ứng **9 nguyên tố theo cặp** (pairwise reaction matrix).
  - Thêm cơ chế trụ (totems) Phase 2/3 cho Boss **The Eraser**, lò rèn 8-pigment `+5` và **Cẩm nang tân thủ 5 tab** (5-tab beginner handbook).
- **File chính đã sửa / thêm:** Hệ thống nguyên tố/combat, Boss Eraser AI, Forge và UI Handbook (theo commit `1ffc570`).
- **Kiểm tra (Verified):** Đã commit lên `main`.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không có.
- **Gợi ý bước tiếp theo (Next Steps):** Tích hợp thêm hướng dẫn cho các tính năng v2.6+ vào cẩm nang nếu mở rộng thêm.

### [2026-11-25] — Antigravity — PIXTEL v2.5: Aethel-16 storyline, lore codex, 7 chroma reactions & 4 bosses
- **Commit / Branch:** `beb2d5a`, `dd4b3d6` (`main`)
- **Giai đoạn / Version:** `PIXTEL v2.5`
- **Đã làm (Done):**
  - Thêm cốt truyện **Aethel-16** & **Lore Codex**, 7 phản ứng sắc độ, 4 Boss và tích hợp Prism Forge `+5/+10` với 5-tier codixel UI/VFX.
- **File chính đã sửa / thêm:** Dữ liệu lore/codex, phản ứng sắc độ, boss và UI/VFX codixel (theo commit `dd4b3d6`, `beb2d5a`).
- **Kiểm tra (Verified):** Đã merge vào `main`.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không có.
- **Gợi ý bước tiếp theo (Next Steps):** Liên kết các mốc cốt truyện Aethel-16 với hệ thống quest & codex.

### [2026-11-25] — TrungLegit — 5-tier codixel items, pixelfx rarity auras & vintage rope hover frame
- **Commit / Branch:** `94a4dad` (`main`)
- **Giai đoạn / Version:** `PIXTEL v2.1`
- **Đã làm (Done):**
  - Nâng cấp item 5 bậc phong cách `codixel`, thêm hào quang phẩm chất `pixelfx` và khung xem chi tiết vật phẩm kiểu vintage rope hover.
- **File chính đã sửa / thêm:** Hệ thống item, VFX hào quang phẩm chất và UI tooltip/hover frame (theo commit `94a4dad`).
- **Kiểm tra (Verified):** Đã commit lên `main`.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không có.
- **Gợi ý bước tiếp theo (Next Steps):** Đồng bộ visual giữa khung item mới và màn hình Lò Rèn / Shop.

### [2026-11-25] — TrungLegit — 5-slot equipment, 16-bit Inventory `[I/B]`, Paper-Doll & Loot/Forge loop
- **Commit / Branch:** `2789940` (`main`)
- **Giai đoạn / Version:** `PIXTEL v2.0 (RPG Core)`
- **Đã làm (Done):**
  - Mở rộng trang bị thành 5 ô (`helmet`, `armor`, `weapon`, `boots`, `accessory`) với 25+ món theo 4 quần xã, `recalculatePlayerStats()`, phân rã ra Mảnh Lăng Kính và migrate save cũ.
  - Xây dựng giao diện Túi đồ 16-bit `[I/B]` có nhân vật 4× mặc đồ động, Paper-Doll pixel rendering trực tiếp trên bản đồ (hỗ trợ Bleached + hào quang vũ khí `+7`/Epic/Legendary), Loot Table nảy/tự hút, Rương Sắc Màu tại Trụ Sắc Màu và 15 bản vẽ Lò Rèn.
- **File chính đã sửa / thêm:** `src/data/types.ts`, `src/data/equipments.ts`, `src/data/items.ts`, `src/data/lootTables.ts`, `src/data/recipes.ts`, `src/graphics/itemIcons.ts`, `src/graphics/paperDoll.ts`, `src/graphics/pixelSprites.ts`, `src/systems/inventorySystem.ts`, `src/systems/combat.ts`, `src/ui/InventoryModal.ts`, `src/ui/ForgeModal.ts`, `src/world/spawner.ts`, `src/world/entities.ts`, `src/game.ts`, `src/audio/chiptuneSynth.ts`, `index.html`, `style.css`
- **Kiểm tra (Verified):** `npm run typecheck`, `npm run build` và kiểm thử headless Chrome (`[B]`, Paper-Doll restored/bleached, Boss loot magnet, Waypoint chest, Forge craft).
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Đã có cơ chế migrate save cũ (`ring`/`chip` → `accessory`).
- **Gợi ý bước tiếp theo (Next Steps):** Tiếp tục mở rộng nội dung trang bị/công thức theo hệ thống mới.

### [2026-11-25] — TrungLegit — README tiếng Việt kèm video MP4, GIF & screenshots
- **Commit / Branch:** `a9d0cfb` (`main`)
- **Giai đoạn / Version:** `PIXTEL v2.0 (Docs)`
- **Đã làm (Done):**
  - Viết `README.md` chi tiết (4 Class, 4 quần xã, Boss, trang bị, điều khiển, cấu trúc `src/`) và ghi gameplay demo thực tế (`gameplay-demo.mp4`, `gameplay-demo.gif`, 4 ảnh PNG).
- **File chính đã sửa / thêm:** `README.md`, `docs/media/*`
- **Kiểm tra (Verified):** `npm run build` pass và kiểm tra trực quan toàn bộ ảnh/video.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Cần cập nhật lại `README.md` nếu đổi phím tắt hoặc thêm cơ chế lớn ở v2.6+.
- **Gợi ý bước tiếp theo (Next Steps):** Làm mới screenshots/GIF khi chốt milestone lớn tiếp theo.

### [2026-11-25] — TrungLegit — Khởi tạo PIXTEL v2 Open-World Action RPG
- **Commit / Branch:** `aae8e1a` (`main`)
- **Giai đoạn / Version:** `PIXTEL v2.0`
- **Đã làm (Done):**
  - Kiến trúc Vite + TypeScript + `pixelfx`, thế giới mở `160×160` tile, 4 Class, 9 Trụ Sắc Màu, 12 Trại Quái, 20 Mỏ khoáng sản, 10 Nhiệm vụ, Web Audio Chiptune và Project Brain (`.brain/`).
- **File chính đã sửa / thêm:** Toàn bộ khung dự án `src/`, `index.html`, `style.css`, `package.json`, `.brain/`
- **Kiểm tra (Verified):** Build Vite + TypeScript thành công.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không có.
- **Gợi ý bước tiếp theo (Next Steps):** Mở rộng hệ thống trang bị RPG và vòng lặp gameplay.
