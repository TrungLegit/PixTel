# PIXTEL — Team Development Log (`DEV_LOG.md`)

> **Quy tắc bắt buộc cho mọi thành viên & AI hỗ trợ (Vibe-Code Rule):**
> 1. **Đọc trước khi code:** Luôn đọc mục **Trạng Thái Hiện Tại** và **3–5 bản ghi mới nhất** bên dưới trước khi sửa bất kỳ file nào, để biết dự án đang ở giai đoạn nào và tránh đụng độ / phá vỡ code của người khác.
> 2. **Ghi ngay sau khi xong:** Sau mỗi lần cập nhật tính năng, sửa bug, hoặc refactor, **bắt buộc** thêm một bản ghi mới vào **đầu** mục `## Nhật Ký Cập Nhật` (mới nhất ở trên cùng) theo đúng **Template Chuẩn** và cập nhật lại `## Trạng Thái Hiện Tại` nếu giai đoạn thay đổi.
> 3. **Commit cùng code:** Luôn stage & commit `DEV_LOG.md` chung với các file code bạn vừa thay đổi. **Không xóa lịch sử log cũ.**

---

## Trạng Thái Hiện Tại (Current Project Stage Snapshot)

- **Giai đoạn / Phiên bản hiện tại:** `PIXTEL v3.0` — Weapon-Driven Skill Architecture (`41` Weapon Skills `[E]` + `1` Fixed Class Skill `[Q]`), `16` Exotic Drop-Only Skill-Altering Gear, Hardcore Grind-to-Boss Rebalance, HD 19-Monster Atlas (`306` frames w/ `:atk` strike frames), 4 Boss-Only Map Chests & Addictive Seasonal Gacha Chest System (`[G]`) with 4 Biome Keys
- **Commit mới nhất trên `main`:** `946eddb` (`2026-11-25`, tác giả: `chu0n6-iot` / `TrungLegit`)
- **Thành viên / AI đóng góp gần đây:** `chu0n6-iot`, `TrungLegit`, `Antigravity`, `Yaros`, `GitHub Copilot`
- **Các hệ thống chính đã hoàn thiện:**
  - **Web / Mobile PWA & Triển khai GitHub Pages:** Tự động test (`npm test`), build & deploy qua GitHub Actions lên `https://trunglegit.github.io/PixTel/`, kèm `manifest.webmanifest`, `sw.js`, `icon.svg`, chế độ màn hình ngang fullscreen, font Pixelify Sans tiếng Việt tự lưu trữ cục bộ (không phụ thuộc CDN).
  - **Giai đoạn 1 — Mobile Twin-Stick & Smart Auto-Aim:** Cần xoay Analog đa điểm (đẩy sát viền tự động Chạy Nhanh + nút khóa Sprint), cụm phím chiến đấu bên phải (`⚔ ĐÁNH / GIỮ TỤ LỰC` phát sáng vàng ở khung Just-Charge, `💨 LƯỚT`, `✦ [E]`, `🔥 [Q]`, `🖐 [F]`), Tự Ngắm Mục Tiêu Thông Minh (ưu tiên Trụ Đấu Trường -> Boss/Quái -> Mỏ quặng) hoặc kéo 360°, chạm xem chi tiết trang bị (Tap-to-Inspect).
  - **Giai đoạn 2 — Multiplayer Co-op 2–4 Người (`[P]` / Mã Phòng 6 Ký Tự):** Kiến trúc mạng kép hỗ trợ cả **Online WebRTC P2P (`PeerJS`)** chạy trực tiếp trên GitHub Pages / 4G điện thoại và **Dedicated WebSocket Room Server (`server/coopServer.ts`, `npm run server`)**; đồng bộ Paper-Doll 5 ô thời gian thực (kiểm tra đúng Class), kích nổ **Phản Ứng Nguyên Tố Kép 9 Hệ** chéo giữa các người chơi, chia sẻ mở khóa Trụ Sắc Màu / Trụ Đấu Trường Eraser, ưu tiên Aggro cho Khiên `Prism Knight`, và **100% XP + Instanced Loot** riêng cho từng thành viên.
  - **PIXTEL v3.0 — Kỹ Năng Theo Vũ Khí, Trang Bị Độc Lạ Rơi Quái/Boss, Cân Bằng Độ Khó & Rương Gacha Mùa `[G]`:**
    - **Hệ Thống Kỹ Năng Theo Vũ Khí (`41` Weapon Skills `[E]`):** Nhân vật giữ **1 Đánh Thường (`LMB` + Tụ Lực)** và **1 Tuyệt Kỹ Cố Định của Class (`[Q]`, mở khóa sẵn không còn khóa theo Phụ kiện)**; mỗi vũ khí mang **1 Kỹ Năng `[E]` riêng biệt** (tự động đổi icon pixel trên HUD, viền màu nguyên tố, hồi chiêu, tooltip, hoạt ảnh & `pixelfx` VFX ngay khi đổi vũ khí!).
    - **16 Trang Bị Độc Lạ Biến Đổi Chiêu Thức (`dropOnly: true`):** Gồm 8 Vũ Khí Độc Lạ + 8 Mũ/Giáp/Giày/Phụ Kiện kích hoạt `12` Biến Thể Chiêu Thức có ICD cân bằng (sét dây chuyền, sóng băng/chấn động khi Lướt, phản nổ dung nham, hố đen khi dùng `[Q]`, thiên thạch chí mạng, phân đôi tia `[E]`...); chỉ rơi từ quái & Boss (tuyệt đối không bán shop / không rèn / không rò rỉ random chest).
    - **Rương Gacha Theo Mùa (`[G]` + Đài `GACHA ALTAR` Thị Trấn) & 4 Chìa Khóa Quần Xã:** Gỡ sạch toàn bộ rương bãi farm & Trụ Sắc Màu, **chỉ giữ lại đúng 4 Rương Chính tại 4 Đấu Trường Boss**; bổ sung 4 Chìa Mùa (*Xuân / Đông / Hạ / Nhật Thực*) rơi tỉ lệ thấp từ quái đúng quần xã hoặc rèn tại Kael + 8 trang bị Độc Quyền Mùa cân bằng theo Tier; sân khấu mở rương 60FPS có hoạt ảnh tra chìa, rung lắc nhịp tim chiptune, hiệu ứng **"★ LẬT KÈO NÂNG PHẨM! ★"** sét xé màn hình đổi màu phẩm chất, mưa sao confetti, Quay ×1/×5, Bảo hiểm Pity 10/25 & tự quy đổi đồ trùng thành Mảnh Lăng Kính + Vàng.
    - **Quái & Boss Sắc Nét HD (`306` frame) & Cân Bằng Hardcore Grind-to-Boss:** Tăng độ phân giải & làm nét toàn bộ 19 model quái/boss kèm frame đánh **`:atk`** 4 hướng, tia cảnh báo đòn (Danger Glint), gọi bầy đàn `"!"` (`125px`), bật lùi trúng đòn, xuất hiện cổng màu; tăng mạnh HP/ATK/DEF/Giáp Trắng của quái & Boss + hồi chiêu Bình Máu `2.5s` để buộc người chơi farm bãi quái, làm nhiệm vụ & cường hóa trang bị trước khi thách đấu Boss.
- **Trọng tâm tiếp theo (Active / Next Focus Areas):**
  - Commit & push toàn bộ cụm bản cập nhật `PIXTEL v3.0` lên `origin/main` (và làm mới ảnh/video README nếu muốn trưng bày Rương Gacha Mùa & HUD kỹ năng vũ khí mới).
  - Giai đoạn 3 (tùy chọn mở rộng): Authoritative Cloud Server (Colyseus / Fly.io / Railway) chống cheat tuyệt đối, Bảng xếp hạng Time-Attack Boss, hoặc đóng gói Capacitor lên Google Play / App Store.

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

### [2026-11-26 02:19] — Antigravity — Bổ sung đủ bản Preview 97 vật phẩm cơ bản & Cổ Vật Ẩn (5 ảnh) vào `preview for devs/`
- **Commit / Branch:** `main` (tiếp nối `c463689`)
- **Giai đoạn / Version:** `PIXTEL v3.0+` — Complete Team Preview Hub (`3` báo cáo · `14` ảnh PNG)
- **Đã làm (Done):**
  - Chuyển đổi bản preview 97 vật phẩm cơ bản + 11 Cổ Vật Ẩn + Model 3D 4 Class sang chuẩn GitHub Markdown (`preview for devs/2026-11-26-v2.7-all-97-base-items-preview.md`) và copy đủ 5 ảnh PNG (`preview_1..5`) vào `preview for devs/assets/`.
  - Cập nhật mục lục [preview for devs/README.md](preview%20for%20devs/README.md) để toàn bộ 3 bản preview (14 ảnh) đều xem được trực tiếp trên GitHub.
- **File chính đã sửa / thêm:** `preview for devs/2026-11-26-v2.7-all-97-base-items-preview.md`, `preview for devs/assets/preview_1..5*.png`, `preview for devs/README.md`, `DEV_LOG.md`
- **Kiểm tra (Verified):** Đủ `14` ảnh PNG trong `preview for devs/assets/`, Project Brain `lint` & `digest` sạch, commit & push lên `origin/main`.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không có.
- **Gợi ý bước tiếp theo (Next Steps):** Các dev mở `preview for devs/` trên GitHub để xem toàn bộ báo cáo trực quan.

### [2026-11-26 02:16] — Antigravity — Tạo thư mục `preview for devs/` trên GitHub & ghi nhớ quy tắc tự động commit/push mọi bản preview
- **Commit / Branch:** `main` (tiếp nối `8931ded`)
- **Giai đoạn / Version:** `PIXTEL v3.0+` — Team Preview Hub & Persistent Dev Workflow Rule
- **Đã làm (Done):**
  - Tạo thư mục **`preview for devs/`** kèm mục lục [preview for devs/README.md](preview%20for%20devs/README.md) (newest-first) và đăng tải 2 bộ báo cáo trực quan đầu tiên chuẩn GitHub Markdown (ảnh lưu tại `preview for devs/assets/` với đường dẫn tương đối):
    - [2026-11-26-v3.0-gameplay-ui-preview.md](preview%20for%20devs/2026-11-26-v3.0-gameplay-ui-preview.md) (6 ảnh live Chrome: Spawn Stash Chest + Gacha Altar + HUD Weapon Skills, Auto-Bán, Quầy Balo Mira, Rương Cá Nhân 80 ô, Sân khấu Gacha ×5, Quái HD 306 frame & Font số mới).
    - [2026-11-26-v3.0-new-items-preview.md](preview%20for%20devs/2026-11-26-v3.0-new-items-preview.md) (3 bảng ảnh độ phân giải cao giới thiệu toàn bộ 33 vật phẩm/nâng cấp mới của v3.0+).
  - Ghi nhớ vĩnh viễn quy tắc **`PREVIEW_FOR_DEVS_RULE`** vào cả [AGENTS.md](AGENTS.md), [GEMINI.md](GEMINI.md) và Project Brain: từ nay về sau, mỗi khi người dùng yêu cầu tạo bản preview sẽ tự động xuất Markdown + ảnh vào `preview for devs/`, cập nhật mục lục, ghi `DEV_LOG.md`, commit và push lên `origin/main` để các dev khác nắm tình hình ngay trên GitHub.
- **File chính đã sửa / thêm:** `preview for devs/README.md`, `preview for devs/2026-11-26-v3.0-gameplay-ui-preview.md`, `preview for devs/2026-11-26-v3.0-new-items-preview.md`, `preview for devs/assets/*.png` (9 ảnh), `AGENTS.md`, `GEMINI.md`, `DEV_LOG.md`
- **Kiểm tra (Verified):** Kiểm tra đủ 9 ảnh PNG + đường dẫn tương đối chuẩn GitHub, Project Brain `lint` & `digest` sạch, commit & push thẳng lên `origin/main`.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không có thay đổi code runtime.
- **Gợi ý bước tiếp theo (Next Steps):** Các thành viên mở trực tiếp thư mục `preview for devs` trên GitHub để xem tình hình bản `PIXTEL v3.0+`.

### [2026-11-26 02:06] — Antigravity — Sửa font chữ số `5` (và bộ số `0–9`) sắc nét không còn nhầm với số `8`
- **Commit / Branch:** `main` (working tree trên `2297954`)
- **Giai đoạn / Version:** `PIXTEL v3.0+` — Typography & Pixel Digit Readability Fix
- **Đã làm (Done):**
  - Tạo script `scripts/build_digits_font.py` sinh font pixel số tự lưu trữ siêu nhẹ `src/assets/pixtel-digits.woff2` (`540 bytes`, lưới `5×7` khớp đúng baseline & cap-height `Pixelify Sans Variable`), thiết kế lại số **`5`** đầu ngang phẳng và mở rộng khe dưới trái (cùng bộ số `0–9` tách bạch tuyệt đối `5` vs `8` vs `6` vs `3` ở mọi cỡ chữ và cả khi in đậm).
  - Nhúng `@font-face "PixTel Digits"` với `unicode-range: U+0030-0039; font-weight: 100 900` đặt trước `"Pixelify Sans Variable"` trong `style.css` (giữ nguyên 100% tiếng Việt có dấu của `Pixelify Sans`, chỉ thay thế gọn bộ chữ số `0–9` và tự inline vào bundle CSS khi build).
  - Đồng bộ lại nét số `5` trong bitmap canvas font `BIG["5"]` tại `src/vfx/pixelfx/core/font.js`.
- **File chính đã sửa / thêm:** `scripts/build_digits_font.py`, `src/assets/pixtel-digits.woff2`, `style.css`, `src/vfx/pixelfx/core/font.js`, `DEV_LOG.md`
- **Kiểm tra (Verified):** `npm run build` exit `0` (font `540B` inline sạch vào CSS); chụp & kiểm duyệt lại trực tiếp 6 ảnh trên Chrome (`5/80 Ô`, `8/60 Ô`, `T5`, `x25`, `5.8s`, `175G`, `+1.5% Crit`) rõ nét tuyệt đối, `0` lỗi console/page.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không có.
- **Gợi ý bước tiếp theo (Next Steps):** Reload tab `http://127.0.0.1:5173/` để kiểm tra độ rõ chữ số và commit/push toàn bộ `PIXTEL v3.0` khi sẵn sàng.

### [2026-11-26 01:58] — Antigravity — Auto-Bán phẩm chất thấp, 4 cấp Balo mở rộng kho đồ (`40 → 80` ô) & Rương Cá Nhân (`80` ô) ngay tại Spawn
- **Commit / Branch:** `main` (working tree trên `2297954`)
- **Giai đoạn / Version:** `PIXTEL v3.0+` — Inventory QoL (Auto-Sell, Backpack Expansions & Spawn Personal Stash)
- **Đã làm (Done):**
  - **Cơ chế Auto-Bán Vật Phẩm Phẩm Chất Thấp (`AutoSellSettings`):**
    - Bổ sung bộ lọc `autoSell` (`TẮT` / `TRẮNG` / `≤ LỤC` / `≤ LAM` + tùy chọn `Khác Class`) trong `src/systems/inventorySystem.ts` và thanh điều khiển ngay trên Túi Đồ `[I]` (`src/ui/InventoryModal.ts`) kèm nút `🧹 QUÉT` dọn đồ hiện có.
    - Tích hợp vào vòng lặp hút & nhặt đồ rơi (`src/game.ts`): khi đi ngang đồ đủ điều kiện sẽ tự chuyển thẳng thành Vàng (`AUTO +XG`) kể cả khi túi đang đầy; **bảo vệ tuyệt đối** không bao giờ tự bán Cổ Vật Ẩn (`isHidden`), Đồ Độc Lạ (`dropOnly`), Đồ Rương Mùa (`seasonalBannerId`) và trang bị đã cường hóa (`+1` trở lên).
  - **Mua Thêm Balo Mở Rộng Kho Đồ (`40 → 50 → 60 → 70 → 80` ô):**
    - Thay thế giới hạn cứng `MAX_BAG_SLOTS` bằng `inv.bagCapacity` linh hoạt kèm 4 cấp `BACKPACK_UPGRADES` (*Balo Du Mục 250G*, *Thạch Anh 650G*, *Hổ Phách 1400G*, *Không Gian Lăng Kính 2800G*) bán tại Thương Nhân Mira (`src/ui/DialogueModal.ts`) và nút nâng cấp nhanh trên góc Túi Đồ (`src/ui/InventoryModal.ts`).
    - Vẽ 4 icon pixel `codixel` riêng biệt (`ui_backpack_t1..t4`) trong `scripts/generate_codixel_assets.mjs` (143 icon) và tự đổi biểu tượng Balo trên thanh HUD `[I]` (`src/ui/HUD.ts`) theo cấp Balo đang dùng.
  - **Rương Cá Nhân (`STASH CHEST`, 80 ô) đặt ngay cạnh Spawn (`tx: 77, ty: 82`):**
    - Bổ sung `STORAGE_CHEST_POS` (`src/data/worldConfig.ts`), icon `ui_stash_chest`, dựng Rương gỗ viền ngọc lam kèm nhãn `STASH CHEST` ngay cạnh Trụ Khởi Nguyên (`src/game.ts`) và tương tác `[F]` (`src/world/interactables.ts`).
    - Tạo mới màn hình `src/ui/StorageChestModal.ts` (`#modal-stash`, nối vào `src/main.ts`, `index.html`, `style.css`) 2 cột Túi ↔ Rương (click 1 chạm cất/lấy, nút `📦 CẤT NHANH NGUYÊN LIỆU` giữ lại Chìa Mùa, hỗ trợ đầy đủ `ItemReviewTooltip` khi rê chuột vào đồ trong Rương, lưu bền trong `SaveDataV2`).
- **File chính đã sửa / thêm:** `src/data/types.ts`, `src/data/worldConfig.ts`, `src/systems/inventorySystem.ts`, `src/world/interactables.ts`, `src/game.ts`, `src/main.ts`, `src/ui/StorageChestModal.ts`, `src/ui/InventoryModal.ts`, `src/ui/DialogueModal.ts`, `src/ui/HUD.ts`, `src/ui/ItemReviewTooltip.ts`, `scripts/generate_codixel_assets.mjs`, `src/assets/codixel-icons.png`, `src/assets/codixel-icons.json`, `index.html`, `style.css`, `tests/featureTests.ts`, `DEV_LOG.md`
- **Kiểm tra (Verified):** `npm run build` (`tsc --noEmit && vite build`) exit `0`; **16/16** feature suites (`tests/featureTests.ts`, thêm Suite 16 kiểm thử Auto-Bán + bảo vệ đồ quý, 4 cấp Balo `40 → 80` ô & Rương Cá Nhân + Save persistence) PASS; kiểm duyệt trực quan toàn bộ 6 ảnh chụp live Chrome (`v3_preview_1..6`, `0` lỗi console/page) và xuất bản artifact preview `pixtel_v3_preview.md`.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Hoàn toàn tương thích ngược với file Save cũ (`bagCapacity`, `backpackTier`, `stash`, `autoSell` đều tùy chọn với giá trị mặc định sạch).
- **Gợi ý bước tiếp theo (Next Steps):** Xem bản preview `pixtel_v3_preview.md`, chơi thử tại `http://127.0.0.1:5173/` và commit/push toàn bộ cụm `PIXTEL v3.0` lên `origin/main` khi người dùng xác nhận.

### [2026-11-26 01:38] — Antigravity — PIXTEL v3.0: Kỹ năng riêng theo từng vũ khí (`41` Weapon Skills), `16` Trang Bị Độc Lạ rơi quái/Boss, Cân bằng độ khó Hardcore, Quái HD (`306` frame) & Rương Gacha Mùa `[G]`
- **Commit / Branch:** `main` (working tree trên `2297954`)
- **Giai đoạn / Version:** `PIXTEL v3.0` — Weapon-Driven Skills, Exotic Drop-Only Gear, Hardcore Balance, HD Monster Animations & Seasonal Gacha System
- **Đã làm (Done):**
  - **Kiến trúc Kỹ Năng Theo Vũ Khí (`41` Weapon Skills `[E]` + `1` Đánh Thường + `1` Tuyệt Kỹ Cố Định Class `[Q]`):**
    - Tạo mới `src/data/weaponSkills.ts` ánh xạ toàn bộ vũ khí (41 bộ kỹ năng `[E]` riêng biệt với icon `codixel`, nguyên tố, hồi chiêu & mô tả chi tiết).
    - Viết lại `performSkillE()` trong `src/systems/combat.ts` để thi triển chiêu theo đúng vũ khí đang cầm; mở khóa cố định `performUltimateQ()` cho nhân vật (chỉ cần 100% Nộ, không còn khóa sau ô Phụ Kiện).
    - Nâng cấp `src/ui/HUD.ts`, `src/ui/ItemReviewTooltip.ts` và `src/ui/InventoryModal.ts`: đổi vũ khí sẽ lập tức đổi icon pixel ô `[E]`, màu viền nguyên tố, thanh hồi chiêu & tooltip chi tiết kỹ năng vũ khí.
  - **16 Trang Bị Độc Lạ Biến Đổi Chiêu Thức (Chỉ rơi từ Quái & Boss — `dropOnly: true`):**
    - Tạo mới `src/data/exoticItems.ts` (8 Vũ Khí Độc Lạ cho 4 Class + 8 Mũ/Giáp/Giày/Phụ Kiện kích hoạt 12 biến thể chiêu thức cân bằng có ICD trong `src/systems/combat.ts` & `src/systems/inventorySystem.ts`), ánh xạ đầy đủ vào model 3D `pixelfx` (`src/graphics/pixelfxHeroModels.ts`), bảng rơi đồ quái/boss (`src/data/lootTables.ts`) và khóa hoàn toàn không rò rỉ vào Shop, Lò Rèn hay Rương ngẫu nhiên.
  - **Cân Bằng Độ Khó Hardcore & Vòng Lặp Farm Quái -> Nâng Cấp -> Đánh Boss:**
    - Nâng chỉ số toàn bộ 19 quái & Boss (`src/data/enemies.ts`, HP ~1.7–2.0×, ATK ~1.45×, DEF & Giáp Trắng dày hơn, +20% XP); thêm cơ chế gọi bầy đàn trong trại (`_alertCampPack` bán kính 125px kèm biểu tượng `"!"`), rút ngắn `invuln = 0.38s`, siết phạt chênh cấp (`gap > 1`), tăng nhịp đòn quái (`cdRate = 1.18`) và thêm hồi chiêu `2.5s` cho Bình Máu `[1]` (`potCd`) chống spam hồi máu.
  - **Làm Nét 19 Model Quái & Nâng Cấp Hoạt Ảnh Chiến Đấu (`306` frame):**
    - Nâng cấp `scripts/extract_enemy_sprites.py`: tăng độ phân giải toàn bộ 19 model quái/boss +22%, lọc `LANCZOS` + tăng độ sắc nét/tương phản 38 màu, tổng hợp thêm frame đánh **`:atk`** cho cả 4 hướng -> `src/assets/codixel-enemies.png` (`994×790`, `306` frame).
    - Nâng cấp `src/graphics/enemyAtlas.ts` & `src/game.ts`: tự động bật sprite `:atk` ở pha tung đòn, tia chớp cảnh báo 4 cánh (Danger Glint) ở pha tụ đòn, chấm than `"!"` gọi bầy, độ nghiêng giật lùi trúng đòn (`hurtTilt`) và hoạt ảnh xuất hiện cổng màu (`spawnAnimTime`).
    - Nâng cấp `scripts/generate_codixel_assets.mjs`: thêm `41` icon pixel `24×24` mới (`ui_gacha_chest`, 4 chìa mùa, 16 đồ Độc Lạ, 8 đồ Mùa, 12 icon skill vũ khí -> `138` icon trong `src/assets/codixel-icons.png`).
  - **Rương Gacha Theo Mùa (`[G]` + Đài `GACHA ALTAR`), 4 Chìa Khóa Biome & Dọn Sạch Rương Bản Đồ:**
    - Xóa toàn bộ 25 rương trại farm & rương tự sinh cạnh Trụ Sắc Màu (`src/data/worldConfig.ts`, `src/game.ts`) — chỉ giữ lại **duy nhất 4 Rương Chính tại 4 Đấu Trường Boss** (kèm rơi chắc chắn Chìa Mùa tương ứng).
    - Tạo mới `src/data/gacha.ts` (4 Chìa Mùa `key_season_spring/winter/summer/eclipse`, 8 trang bị Độc Quyền Mùa cân bằng theo Tier, 4 Banner, 4 công thức rèn chìa gắn vào `src/data/recipes.ts`) và `src/systems/gachaSystem.ts` (Pity mềm từ lần 7, Pity cứng 10/25, tự chuyển đồ trùng thành Mảnh Lăng Kính + Vàng, kích hoạt `fakeOutFrom` Lật Kèo Đổi Màu, lưu vào `SaveDataV2.gachaState`).
    - Tạo mới `src/ui/GachaModal.ts` + âm thanh `playGachaKeyTurn/Tick/FakeoutCrack/Reveal` (`src/audio/chiptuneSynth.ts`) + nút Rương Mùa `[G]` trên HUD & Đài `GACHA ALTAR` tại Thị Trấn (`src/world/interactables.ts`, `index.html`, `style.css`, `src/main.ts`) với sân khấu Canvas 60FPS tra chìa, rung lắc, sét lật kèo đổi màu, mưa sao confetti, Quay ×1/×5 & nút Mặc Ngay.
- **File chính đã sửa / thêm:** `scripts/extract_enemy_sprites.py`, `scripts/generate_codixel_assets.mjs`, `src/assets/codixel-enemies.png`, `src/assets/codixel-enemies.json`, `src/assets/codixel-icons.png`, `src/assets/codixel-icons.json`, `src/data/types.ts`, `src/data/weaponSkills.ts`, `src/data/exoticItems.ts`, `src/data/gacha.ts`, `src/data/items.ts`, `src/data/recipes.ts`, `src/data/enemies.ts`, `src/data/lootTables.ts`, `src/data/worldConfig.ts`, `src/world/entities.ts`, `src/world/spawner.ts`, `src/world/interactables.ts`, `src/systems/gachaSystem.ts`, `src/systems/inventorySystem.ts`, `src/systems/combat.ts`, `src/graphics/enemyAtlas.ts`, `src/graphics/pixelfxHeroModels.ts`, `src/audio/chiptuneSynth.ts`, `src/game.ts`, `src/main.ts`, `src/ui/HUD.ts`, `src/ui/GachaModal.ts`, `src/ui/ItemReviewTooltip.ts`, `src/ui/InventoryModal.ts`, `index.html`, `style.css`, `tests/featureTests.ts`, `DEV_LOG.md`
- **Kiểm tra (Verified):** `npm run build` (`tsc --noEmit && vite build`) exit `0`; **15/15** feature suites (`tests/featureTests.ts`, thêm Suite 15 kiểm thử đầy đủ kỹ năng vũ khí động, 16 đồ Độc Lạ chỉ rơi quái/boss, 4 Rương Boss duy nhất, 4 Chìa Mùa rơi & rèn, Pity 10/25 & đổi đồ trùng Gacha) PASS; kiểm thử trực quan live trên Chrome Playwright (`qa_1_town_hud_swap.png`, `qa_2_gacha_anim.png`, `qa_3_gacha_5x_reveal.png`, `qa_4_hd_mobs_combat.png`) đạt `0` lỗi console/pageerror.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không có breaking change đối với file Save cũ (`gachaState` tùy chọn, tự khởi tạo sạch nếu tải save v2/v3 cũ). Các thay đổi đang ở working tree chưa commit/push theo nguyên tắc đợi xác nhận từ người dùng.
- **Gợi ý bước tiếp theo (Next Steps):** Trải nghiệm thử vòng lặp farm quái -> nhặt đồ Độc Lạ -> mở Rương Gacha Mùa `[G]` tại `http://127.0.0.1:5173/`, sau đó yêu cầu commit & push toàn bộ cụm bản nâng cấp `PIXTEL v3.0` lên `origin/main`.

### [2026-11-26 00:24] — Antigravity — Hoàn thiện trọn bộ 19 model quái & boss 4 hướng (+9 model Mỏ Hổ Phách & Phế Tích Vô Sắc + 3 quái mới & bộ chiêu `pixelfx`)
- **Commit / Branch:** `main` (working tree trên `2297954`)
- **Giai đoạn / Version:** `PIXTEL v2.7+` — Complete 4-Biome 19-Monster Sprite Atlas & Synchronized Combat Skills
- **Đã làm (Done):**
  - **Trích xuất 9 Sheet Model Quái & Boss Mới (Phủ 100% cả 4 quần xã — 19 quái/boss, 230 frame):**
    - Cập nhật `scripts/extract_enemy_sprites.py` với hộp crop chuẩn từng pixel (`CUSTOM_DIR_BOXES`), xóa sạch chữ `FRONT/RIGHT/LEFT/BACK` nằm trong khung (`cinder_imp`, `amber_beetle`, `boss_gilded_null`, `null_knight`), tăng độ bảo vệ sắc tím đậm trong `is_navy_bg` để giữ nguyên viền tối của các thực thể Hư Vô, và bổ sung `make_flame_frames()` (chuyển động ngọn lửa & bóng nhiễu mượt không rách đường cắt ngang).
    - Đóng gói trọn bộ **19 quái & boss** (`230` frame 4 hướng + 2 tư thế đặc biệt) vào `src/assets/codixel-enemies.png` (`626×658`) & `.json`:
      - **Mỏ Hổ Phách (4):** `Hỏa Hồn Nhựa Cây` (`cinder_imp`), `Thằn Lằn Dung Nham` (`amber_beetle`), **MỚI** `Chiến Binh Hổ Phách (Boss Phụ)` (`amber_warrior`), `CHÚA TỂ HỔ PHÁCH — GILDED NULL` (`boss_gilded_null`).
      - **Phế Tích Vô Sắc (5):** `Bóng Nhiễu` (`void_wraith`), `Khối Lỗi Cổ Đại` (`prism_golem`), **MỚI** `Hiệp Sĩ Vô Sắc` (`null_knight`), **MỚI** `Kẻ Gác Cổng Hư Vô (Boss Phụ)` (`void_gatekeeper`), `THE ERASER — THỰC THỂ XÓA SẮC` (`boss_the_eraser`).
  - **Đăng ký 3 Quái Mới, Bảng Rơi Đồ & 29 Bãi Spawn Đúng Quần Xã:**
    - Thêm kiểu AI `"mini_amber_warrior"` & `"mini_void_gatekeeper"` vào `src/data/types.ts`; đăng ký 3 quái mới + cập nhật tên tiếng Việt chuẩn trong `src/data/enemies.ts`; thêm drop table riêng cho cả 3 trong `src/data/lootTables.ts` (đảm bảo không rò rỉ Cổ Vật Ẩn); thay thế quái mượn ở `WORLD_CAMPS` (`src/data/worldConfig.ts`) để cả 19 loài quái & boss đều xuất hiện tự nhiên đúng quần xã (mỗi vùng có đủ 3 Boss Phụ + 1 Boss chính).
  - **Hoạt Ảnh 4 Hướng & Bộ Kỹ Năng `pixelfx` Đồng Bộ Chuẩn Theo Bản Vẽ:**
    - Nâng cấp `src/graphics/enemyAtlas.ts`: thêm nhịp vỗ cánh cho `boss_the_eraser`, đồng bộ pose keyframe & charge flare cho `amber_roll`, `molten_slam`, `ember_cast`, `ember_volley`, `void_slam`, `void_blink`, `void_barrage`, `erase_cast`, cùng viền lục giác *Khiên Nhiễu Trắng* tím trắng cho `void_gatekeeper` và hào quang lửa cho `amber_warrior`.
    - Nâng cấp `src/systems/combat.ts` triển khai đầy đủ chiêu thức theo đúng 9 bản thiết kế: *Lao Nổ Nhựa Lửa / Vụ Nổ Tự Hủy* (`cinder_imp`), *Phun Vệt Dung Nham / Quật Đuôi Gai Lửa* (`amber_beetle`), *Đập Búa Chấn Động / Sóng Nham Thạch / Cuồng Nộ Hổ Phách* (`amber_warrior`), *Kẹp Càng Dung Nham / Mưa Mảnh Hổ Phách / Vùng Trói Nhựa Sôi* (`boss_gilded_null`), *Dịch Chuyển Glitch / Cào Nhiễu Trắng* (`void_wraith`), *Bắn Đạn Dấu Cộng 8 hướng / Xung Điện Lỗi* (`prism_golem`), *Liên Trảm Vô Sắc / Lướt Chém Nhiễu* (`null_knight`), *Vòng Cổ Ngữ Đa Hướng / Khiên Nhiễu Trắng / Tia Hư Vô* (`void_gatekeeper`), *Quét Xóa Sắc Màu / Tia Tẩy Trắng / Bão Nhiễu Toàn Sàn* (`boss_the_eraser`).
- **File chính đã sửa / thêm:** `scripts/extract_enemy_sprites.py`, `src/assets/codixel-enemies.png`, `src/assets/codixel-enemies.json`, `src/data/types.ts`, `src/data/enemies.ts`, `src/data/lootTables.ts`, `src/data/worldConfig.ts`, `src/graphics/enemyAtlas.ts`, `src/systems/combat.ts`, `tests/featureTests.ts`, `DEV_LOG.md`
- **Kiểm tra (Verified):** `npm run build` (`tsc --noEmit && vite build`) exit 0; **14/14** feature suites (`tests/featureTests.ts`, mở rộng Suite 10 kiểm tra đủ `19` loài / `230` frame / `WORLD_CAMPS` / toàn bộ chu kỳ chiêu) PASS; kiểm duyệt trực quan cả contact sheet `enemies_new9_preview.png` và 4 ảnh live trên Chrome (`amber4_lineup`, `amber4_combat_vfx`, `ruins5_lineup`, `ruins5_combat_vfx`) với `0` lỗi console/pageerror.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không có breaking change; giữ nguyên toàn bộ ID quái cũ nên 25 nhiệm vụ, Boss Hidden Drops và file Save v2 tương thích 100%.
- **Gợi ý bước tiếp theo (Next Steps):** Chơi thử tại `http://127.0.0.1:5173/` và commit/push toàn bộ cụm nâng cấp (UI balo/skill icon + 29 khu farm + model trang bị 3D + 19 model quái/boss) lên `origin/main` khi người dùng yêu cầu.

### [2026-11-26 00:02] — Antigravity — Thanh kỹ năng & Balo pixel có tooltip rê chuột, 25 khu farm quái & model trang bị đặc biệt 3D `pixelfx`/`codixel`
- **Commit / Branch:** `main` (working tree trên `2297954`)
- **Giai đoạn / Version:** `PIXTEL v2.7+` — UI/UX Icon Hotbar, Open-World Farming Expansion & Special 3D Gear Models
- **Đã làm (Done):**
  - **UI/UX Thanh Dưới Cùng Dạng Icon Pixel + Tooltip Rê Chuột:**
    - Dùng skill **`codixel`** (`scripts/generate_codixel_assets.mjs`) dựng 16 icon pixel `24×24` mới (`ui_backpack`, `ui_lock`, `skill_unarmed`, `skill_dash` và trọn bộ `12` icon chiêu `LMB`/`E`/`Q` riêng biệt cho cả 4 Class) đóng gói vào `src/assets/codixel-icons.png` & `.json`.
    - Thêm nút **Balo Pixel (`#slot-bag`, `[I]`)** vào vị trí đầu tiên phía trước các skill trên `.hud-bottom-bar` (hiển thị số ô `bag/40`, huy hiệu `+Điểm Tiềm Năng` và bấm mở Túi đồ nhanh; giữ hiển thị cả trên Mobile).
    - Chuyển toàn bộ 4 ô kỹ năng (`LMB`, `E`, `Q`, `SPC`) sang dạng **icon pixel gọn gàng** (bỏ tên chữ dài trong ô, thêm màn che hồi chiêu, thanh nạp Nộ `[Q]`, biểu tượng khóa pixel khi thiếu vũ khí/phụ kiện), và bổ sung **Tooltip 16-bit (`#hud-skill-tooltip`)** chỉ hiển thị chi tiết chiêu thức, đòn Tụ Lực, trạng thái & hướng dẫn khi rê chuột vào từng ô.
  - **Mở rộng 16 Khu Spawn Quái Farm Cấp & Trang Bị (`29` trại tổng cộng):**
    - Bổ sung 16 bãi quái farm (4 bãi mới mỗi quần xã *Đồng Cỏ*, *Thạch Anh*, *Hổ Phách*, *Phế Tích* — nâng từ 13 lên **29 trại**: 25 khu farm quái hồi sinh nhanh `18–26s` gồm cả Tinh Anh/Mini-Boss + Rương + 4 Đấu trường Boss), hiển thị marker cam trên Bản Đồ Thế Giới `[M]` (kèm chú thích `Khu Farm Quái`) và Minimap.
  - **Model Trang Bị Đặc Biệt Hơn Bằng `codixel` + `pixelfx` 3D:**
    - Thiết kế 17 icon trang bị đặc biệt mới trong `codixel-icons.png` (`wpn_prism_blade`, `wpn_eraser_edge`, `wpn_void_scythe`, `wpn_quake_maul`, `wpn_warden_cleaver`, `wpn_astral_scepter`, `wpn_quantum_blades`, `wpn_singularity_cannon`, `wpn_nebula_staff`, `wpn_eclipse_fangs`, `wpn_nova_railgun`, `helm_aethel_crown`, `helm_dragon_visor`, `armor_warden_mantle`, `armor_chroma_aegis`, `boots_null_treads`, `acc_siphon_sigil`), đồng thời sửa lỗi khóa `helm_t4` cũ trên đồ ẩn.
    - Bổ sung **3 vũ khí Cổ Vật Ẩn Huyền Thoại mới** (`hid_craft_nebula_staff` cho Pháp Sư, `hid_craft_eclipse_fangs` cho Sát Thủ, `hid_craft_nova_railgun` cho Kỹ Sư — khóa chặt từng Class, nâng tổng đồ ẩn lên **11 món**).
    - Nâng cấp khung xương 3D `pixelfx` ([src/vfx/pixelfx/core/rig.js](src/vfx/pixelfx/core/rig.js) & [src/graphics/pixelfxHeroModels.ts](src/graphics/pixelfxHeroModels.ts)) với **6 mẫu vũ khí 3D mới** (`prism_blade`, `null_sever`, `greataxe`, `astral_staff`, `twin_quantum`, `rail_cannon`), **3 mũ 3D mới** (`dragon_helm`, `royal_crown`, `antler_crest`), **3 phụ kiện lưng 3D mới** (`prism_wings`, `warden_roots`, `amber_thrusters`), vệ tinh phụ kiện tùy biến (Sách phép / Ấn lăng kính đôi) và tia lửa gót giày Huyền Thoại.
- **File chính đã sửa / thêm:** `scripts/generate_codixel_assets.mjs`, `src/assets/codixel-icons.png`, `src/assets/codixel-icons.json`, `src/assets/codixel-paperdoll.png`, `src/assets/codixel-paperdoll.json`, `src/vfx/pixelfx/core/rig.js`, `src/vfx/pixelfxTypes.ts`, `src/graphics/pixelfxHeroModels.ts`, `src/data/hiddenItems.ts`, `src/data/equipments.ts`, `src/data/worldConfig.ts`, `src/ui/HUD.ts`, `src/ui/WorldMapModal.ts`, `index.html`, `style.css`, `tests/featureTests.ts`, `DEV_LOG.md`
- **Kiểm tra (Verified):** `npm run build` (`tsc --noEmit && vite build`) exit 0; **14/14** feature suites (`tests/featureTests.ts`) PASS; kiểm tra trực quan contact sheet `codixel` & 4 ảnh chụp trực tiếp trên Chrome (`#slot-bag` + hover tooltip, `#slot-skill-e` hover tooltip, 3D Hero Preview `prism_wings` + `dragon_helm` + `prism_blade`, World Map 25 khu farm); Project Brain `lint` & `digest` sạch.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không có breaking change; toàn bộ save cũ giữ tương thích 100%, đồng thời vũ khí mới đều khóa chặt theo Class.
- **Gợi ý bước tiếp theo (Next Steps):** Chơi thử nghiệm thực tế tại `http://127.0.0.1:5173/` và commit/push lên `main` khi hài lòng (nhớ làm mới ảnh `README.md` nếu muốn trưng bày thanh hotbar icon pixel mới).

### [2026-11-25 23:41] — TrungLegit (AI) — Tạo Báo Cáo Hình Ảnh Item & Model Sprite (`docs/ITEM_VISUAL_REPORT.md`)
- **Commit / Branch:** `main`
- **Giai đoạn / Version:** `PIXTEL v2.7` — Item Visual Reference & Model Handoff
- **Đã làm (Done):**
  - Xuất 3 bảng ảnh đối chiếu sprite `24×24 → 4× Nearest` trong `docs/media/items/`: [sheet-icons-atlas.png](docs/media/items/sheet-icons-atlas.png) (64 icon), [sheet-paperdoll-atlas.png](docs/media/items/sheet-paperdoll-atlas.png) (77 frame Paper-Doll), và [sheet-items-todo-models.png](docs/media/items/sheet-items-todo-models.png) (30 item ưu tiên vẽ/sửa model gồm 8 Cổ vật ẩn, 8 trang bị Archetype & 14 tiêu thụ/nguyên liệu).
  - Tạo báo cáo [docs/ITEM_VISUAL_REPORT.md](docs/ITEM_VISUAL_REPORT.md) kèm bảng tổng hợp 94 item, danh sách file code/atlas và prompt mẫu để gửi cho Artist/AI chỉnh model.
- **File chính đã sửa / thêm:** `docs/ITEM_VISUAL_REPORT.md`, `docs/media/items/sheet-icons-atlas.png`, `docs/media/items/sheet-paperdoll-atlas.png`, `docs/media/items/sheet-items-todo-models.png`, `DEV_LOG.md`
- **Kiểm tra (Verified):** Kiểm tra trực quan cả 3 file PNG đã xuất (`read_file`) đảm bảo sắc nét, không đè chữ, khớp 100% metadata atlas.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không thay đổi code runtime.
- **Gợi ý bước tiếp theo (Next Steps):** Gửi `docs/ITEM_VISUAL_REPORT.md` cho bạn/AI để vẽ model riêng cho 8 Cổ vật ẩn & các item chưa có frame atlas.

### [2026-11-25 23:31] — TrungLegit (AI) — Sửa lỗi deploy GitHub Pages (`Found 0 artifact(s)`)
- **Commit / Branch:** `main`
- **Giai đoạn / Version:** `PIXTEL v2.7` — CI/CD GitHub Pages Fix
- **Đã làm (Done):**
  - Tách workflow [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) thành 2 job riêng (`build` và `deploy` với `needs: build`) và đặt `cancel-in-progress: false` để tránh race condition khi tra cứu artifact ngay sau khi upload trong cùng 1 job.
  - Nâng cấp bộ Pages Actions lên bản mới tương thích Node 24 (`actions/configure-pages@v6`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`) để khắc phục lỗi `No artifacts named "github-pages" were found`.
- **File chính đã sửa / thêm:** `.github/workflows/deploy-pages.yml`, `DEV_LOG.md`
- **Kiểm tra (Verified):** Chuẩn bị chạy CI `npm test` + `npm run build` + `deploy-pages@v5` và kiểm tra trực tiếp `https://trunglegit.github.io/PixTel/`.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không có.
- **Gợi ý bước tiếp theo (Next Steps):** Xác nhận job `Deploy PIXTEL to GitHub Pages` xanh hoàn toàn và mở `https://trunglegit.github.io/PixTel/`.

### [2026-11-25 23:10] — Antigravity — Quay lại Video/GIF demo `PIXTEL v2.7` & làm mới ảnh bìa README
- **Commit / Branch:** `main` (tiếp nối `bc4923c`)
- **Giai đoạn / Version:** `PIXTEL v2.7` — Video/GIF Demo & Media Refresh
- **Đã làm (Done):**
  - Quay mới toàn bộ chuỗi gameplay demo (`docs/media/gameplay-demo.gif` `640×360` `4.04 MB`, `docs/media/gameplay-demo.mp4` `960×540` `17.4s` `1.56 MB` @ 12fps) từ bản chạy thực tế `PIXTEL v2.7`: mở đầu bằng màn chọn Class `PIXTEL 16-BIT` pixel-grid mới + `pixelfx`, chuyển sang chiến đấu thời gian thực + Tuyệt Kỹ `[Q] Bão Kiếm Ánh Sáng`, thắp sáng Trụ Sắc Màu & sóng khôi phục màu, Túi đồ 5 ô / khóa Class (`✕`), Ma Trận Luyện Khí, Tổ Đội Co-op `[P]` và Bản đồ thế giới `[M]`.
  - Làm mới thêm `docs/media/class-select.png` & `docs/media/combat-color-wave.png` phản ánh đầy đủ nút Co-op `[P]` / Mobile `📱` / `⛶` và cập nhật thời lượng `17.4s` trong [README.md](README.md).
- **File chính đã sửa / thêm:** `docs/media/gameplay-demo.gif`, `docs/media/gameplay-demo.mp4`, `docs/media/class-select.png`, `docs/media/combat-color-wave.png`, `README.md`, `DEV_LOG.md`
- **Kiểm tra (Verified):** Kiểm tra trực quan từng phân cảnh keyframe, file size GIF/MP4 (`4.04 MB` / `1.56 MB`), `git diff --check` và Project Brain `lint`/`digest`.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không có thay đổi code runtime; GitHub Actions không cần chạy lại build code nhưng push sẽ cập nhật trang Pages & README.
- **Gợi ý bước tiếp theo (Next Steps):** Kiểm tra hiển thị ảnh GIF động trực tiếp trên GitHub repository `https://github.com/TrungLegit/PixTel`.

### [2026-11-25 23:00] — Antigravity — Cập nhật `README.md` theo giao diện `PIXTEL v2.7`, 6 ảnh mới & link chơi GitHub Pages
- **Commit / Branch:** `main` (hợp nhất sạch trên `946eddb`)
- **Giai đoạn / Version:** `PIXTEL v2.7` — Documentation & Live Web Polish
- **Đã làm (Done):**
  - Chụp mới 6 ảnh giao diện `1280×720` trực tiếp từ bản chạy hiện tại (`docs/media/class-select.png`, `combat-color-wave.png`, `inventory.png`, `prism-forge.png`, `world-map.png`, `quest-journal.png`) phản ánh đúng Pixelify Sans offline, Logo `PIXTEL 16-BIT`, Ma Trận Luyện Khí, Túi đồ 40 ô / 5 ô trang bị & khóa Class (`✕`).
  - Viết lại [README.md](README.md) đồng bộ đầy đủ tính năng `PIXTEL v2.7`: **Mobile Twin-Stick + Smart Auto-Aim + PWA Fullscreen**, **Co-op Online 2–4 Người (`[P]` / WebRTC P2P / `npm run server`)**, **khóa vũ khí chặt theo Class**, `Bit Rogue` cận chiến LMB, 9 Nguyên Tố (29 phản ứng), 8 Cổ Vật Ẩn, 25 Nhiệm Vụ, 122-frame quái, bảng điều khiển PC + Mobile, cây thư mục đầy đủ và gắn link chơi trực tuyến **`https://trunglegit.github.io/PixTel/`**.
  - Hợp nhất sạch với workflow GitHub Pages CI/CD của `origin/main` ([.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)) và lọc `getValidEquippedWeapon` trong `_buildLocalCoopSnapshot()` (`src/game.ts`) để đồng bộ Co-op cũng tuân thủ khóa Class.
- **File chính đã sửa / thêm:** `README.md`, `src/game.ts`, `docs/media/class-select.png`, `docs/media/combat-color-wave.png`, `docs/media/inventory.png`, `docs/media/prism-forge.png`, `docs/media/world-map.png`, `docs/media/quest-journal.png`, `DEV_LOG.md`
- **Kiểm tra (Verified):** Kiểm tra trực quan cả 6 file PNG, chạy `npm run build` (`tsc --noEmit && vite build`), **13/13** feature suites (`tests/featureTests.ts`), `git diff --check` và Project Brain `lint`/`digest`.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Trong repo Settings trên GitHub, cần đảm bảo `Pages -> Source` đang chọn `GitHub Actions` để workflow `deploy-pages.yml` tự xuất bản `https://trunglegit.github.io/PixTel/`.
- **Gợi ý bước tiếp theo (Next Steps):** Kiểm tra GitHub Actions & truy cập trực tiếp `https://trunglegit.github.io/PixTel/` trên cả PC lẫn điện thoại sau khi push.

### [2026-11-25 22:30] — Antigravity — Khóa chặt vũ khí theo từng Class & chặn Pháp Sư cầm kiếm thi triển kỹ năng
- **Commit / Branch:** `main` (local → hợp nhất cùng `PIXTEL v2.7`)
- **Giai đoạn / Version:** `PIXTEL v2.6+` — Class Equipment Locks & Combat Defense-in-Depth
- **Đã làm (Done):**
  - Chuyển toàn bộ 10 vũ khí từng đặt `requiredClass: "all"` sang đúng Class: `wpn_starter`, `wpn_meadow_edge`, `wpn_quartz_reaver`, `wpn_amber_fury`, `wpn_chroma_sovereign`, `wpn_warden_cleaver`, `wpn_quake_maul`, `hid_craft_prism_blade`, `hid_boss_eraser_edge` → `prism_knight`; `wpn_void_scythe` → `bit_rogue` (bảo đảm 0 vũ khí nào còn dùng chung `"all"`).
  - Bổ sung fallback khóa cứng theo `slot === "weapon"` trong `canClassEquip()` và thêm phần thưởng `ruins_weapon` cho các nhiệm vụ boss (`q_amber_boss`, `q_final_eraser`) trong `quests.ts` & `items.ts`.
  - Bổ sung kiểm tra `getValidEquippedWeapon()` / `hasValidEquippedWeapon()` trong `InventorySystem`, `recalculatePlayerStats()`, `CombatSystem`, `HUD.ts`, `game.ts` (`loadSavedGame()` tự tháo đồ sai Class về túi an toàn), cùng nhãn hệ Class trong shop Mira (`DialogueModal.ts`).
  - Mở rộng Suite 7 & 8 trong `tests/featureTests.ts` kiểm tra khóa kiếm với `chroma_mage`, chặn cast `[E]`/đòn đánh khi ép vũ khí sai Class trong save cũ và thưởng `ruins_weapon` đủ 4 Class.
- **File chính đã sửa / thêm:** `src/data/equipments.ts`, `src/data/hiddenItems.ts`, `src/data/items.ts`, `src/data/types.ts`, `src/data/quests.ts`, `src/systems/inventorySystem.ts`, `src/systems/combat.ts`, `src/game.ts`, `src/ui/HUD.ts`, `src/ui/DialogueModal.ts`, `src/graphics/pixelfxHeroModels.ts`, `tests/featureTests.ts`, `DEV_LOG.md`
- **Kiểm tra (Verified):** `npm run build` (`tsc --noEmit && vite build`) exit 0; toàn bộ feature test suites trong `tests/featureTests.ts` PASS.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Các bản lưu cũ mà Pháp Sư/Sát Thủ/Kỹ Sư từng mang kiếm sẽ tự động được tháo về túi đồ khi tải game (`loadSavedGame`) kèm thông báo toast; cần trang bị Trượng/Song Đao/Súng đúng Class để thi triển kỹ năng `[E]`.
- **Gợi ý bước tiếp theo (Next Steps):** Kiểm thử đa người chơi kết hợp kiểm tra đồng bộ hiển thị Paper-Doll theo Class khi đổi Class tại thị trấn.

### [2026-11-25 22:35] — chu0n6-iot (Antigravity) — Triển khai Web/Mobile PWA (GitHub Pages), Giai đoạn 1 Mobile Twin-Stick & Giai đoạn 2 Co-op 2–4 Người
- **Commit / Branch:** `main` (merge `origin/main` `ebca8f8` + Phase 1 & 2)
- **Giai đoạn / Version:** `PIXTEL v2.7` — Web/Mobile PWA & Online Co-op (Phase 1 + Phase 2)
- **Đã làm (Done):**
  - **Web & Mobile PWA không cần `npm run dev`:** Thêm GitHub Actions workflow `.github/workflows/deploy-pages.yml` tự động test, build và phát hành lên GitHub Pages (`https://trunglegit.github.io/PixTel/`); thêm `public/manifest.webmanifest`, `public/icon.svg`, `public/sw.js` hỗ trợ cài ra Màn hình chính điện thoại (fullscreen ngang).
  - **Giai đoạn 1 — Mobile Twin-Stick Touch & Smart Auto-Aim:** Tạo `src/ui/MobileTouchUI.ts` (Analog Joystick trái tự chạy nhanh khi đẩy `>= 84%` + cụm nút đa điểm phải hỗ trợ Tap Combo, Giữ Just-Charge, Kéo ngắm 360°), `computeAutoAimAngle()` trong `src/game.ts`, nhắc xoay ngang màn hình, nút `📱` / `⛶` trên HUD và Tap-to-Inspect trong `src/ui/ItemReviewTooltip.ts`.
  - **Giai đoạn 2 — Multiplayer Co-op 2–4 Người (`[P]`):** Tạo `src/net/protocol.ts`, `src/net/coopClient.ts` (hỗ trợ kép **WebRTC P2P qua PeerJS** dùng ngay trên web/điện thoại và **Dedicated WebSocket Server** `server/coopServer.ts` chạy qua `npm run server`), giao diện phòng đội `src/ui/CoopModal.ts`, khung đội hình `#hud-party-box` kèm Dịch chuyển nhanh tới đồng đội, link mời 1 chạm `?room=CODE` trên màn chọn Class, kích nổ phản ứng 9 nguyên tố chéo giữa các người chơi, đồng bộ Trụ Sắc Màu và rơi đồ riêng (Instanced Loot).
  - Hợp nhất sạch với 2 PR mới trên `origin/main` (màn hình khởi đầu pixel-grid, font Pixelify Sans Việt hóa cục bộ và hệ thống 8 Vật phẩm ẩn), nâng tổng số bộ test tự động lên **13/13 suites**.
- **File chính đã sửa / thêm:** `.github/workflows/deploy-pages.yml`, `public/manifest.webmanifest`, `public/icon.svg`, `public/sw.js`, `src/net/protocol.ts`, `src/net/coopClient.ts`, `server/coopServer.ts`, `src/ui/MobileTouchUI.ts`, `src/ui/CoopModal.ts`, `src/game.ts`, `src/systems/combat.ts`, `src/ui/HUD.ts`, `src/ui/ClassSelect.ts`, `src/ui/ItemReviewTooltip.ts`, `src/main.ts`, `index.html`, `style.css`, `tests/featureTests.ts`, `README.md`, `DEV_LOG.md`
- **Kiểm tra (Verified):** `npm test` (**13/13** feature suites pass, bao gồm Hidden Relics + Mobile Twin-Stick + Dedicated WebSocket Co-op Server end-to-end), `npm run build` (`tsc --noEmit && vite build`), `git diff --check`, `brain.py lint` & `digest`.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không có breaking change; chế độ Solo hoạt động y hệt cũ, chế độ Co-op mặc định dùng `webrtc` (chơi ngay trên GitHub Pages/4G không cần backend) và có thể chuyển sang `ws` khi chạy `npm run server`.
- **Gợi ý bước tiếp theo (Next Steps):** Trải nghiệm thực tế Co-op 2–4 máy trên điện thoại qua link GitHub Pages; có thể bổ sung hiển thị biểu tượng Cổ vật ẩn trên nhân vật đồng đội nếu thêm hiệu ứng đặc biệt mới.

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
