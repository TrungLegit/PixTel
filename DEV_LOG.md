# PIXTEL — Team Development Log (`DEV_LOG.md`)

> **Quy tắc bắt buộc cho mọi thành viên & AI hỗ trợ (Vibe-Code Rule):**
> 1. **Đọc trước khi code:** Luôn đọc mục **Trạng Thái Hiện Tại** và **3–5 bản ghi mới nhất** bên dưới trước khi sửa bất kỳ file nào, để biết dự án đang ở giai đoạn nào và tránh đụng độ / phá vỡ code của người khác.
> 2. **Ghi ngay sau khi xong:** Sau mỗi lần cập nhật tính năng, sửa bug, hoặc refactor, **bắt buộc** thêm một bản ghi mới vào **đầu** mục `## Nhật Ký Cập Nhật` (mới nhất ở trên cùng) theo đúng **Template Chuẩn** và cập nhật lại `## Trạng Thái Hiện Tại` nếu giai đoạn thay đổi.
> 3. **Commit cùng code:** Luôn stage & commit `DEV_LOG.md` chung với các file code bạn vừa thay đổi. **Không xóa lịch sử log cũ.**

---

## Trạng Thái Hiện Tại (Current Project Stage Snapshot)

- **Giai đoạn / Phiên bản hiện tại:** `PIXTEL v3.3` — Hybrid Retro 16-Bit JRPG SFX Engine (`22050 Hz` Mono `-3 dBFS` `.ogg/.mp3` + Web Audio API `0 KB` Procedural Synth, 9-Element & 4-Class Voices, NPC Typewriter Blips, 2D Spatial Co-op Audio & Offline PWA SFX Cache) + trọn bộ `v3.2.6` Zero-Overlap HUD
- **Commit mới nhất trên `main`:** `9b560f4` + `v3.3` Hybrid 16-Bit JRPG SFX Architecture (`2026-11-26`)
- **Thành viên / AI đóng góp gần đây:** `chu0n6-iot`, `TrungLegit`, `Antigravity`, `Yaros`, `GitHub Copilot`
- **Các hệ thống chính đã hoàn thiện:**
  - **PIXTEL v3.3 — Hệ Thống Âm Thanh Hiệu Ứng (SFX) Lai Retro 16-Bit JRPG Tối Ưu Mobile, Co-op & Offline PWA:**
    - **Pipeline chuẩn hóa âm thanh (`scripts/convert_sfx.py`, `npm run sfx`):** Xử lý nguồn `.wav/.ogg/.mp3` từ `raw_sfx/` (kèm `--seed-cc0` tự tổng hợp 16 clip CC0 sạch bản quyền khi thư mục trống) sang `public/sfx/` theo chuẩn Retro 16-bit (`22050 Hz`, `Mono`, chuẩn hóa đỉnh `-3.0 dBFS`), xuất đồng thời `.ogg` (`105.8 KB` cho Chrome/Android) & `.mp3` (`57.6 KB` `64kbps` cho Safari iOS PWA) cùng `public/sfx/manifest.json`.
    - **Bộ máy âm thanh lai (`src/audio/chiptuneSynth.ts`):** Kết hợp tổng hợp Web Audio API độ trễ `0 ms` (đòn đánh/tụ lực/tuyệt kỹ `[Q]` riêng cho 4 Class, 41 kỹ năng vũ khí `[E]`, toàn bộ 9 nguyên tố & 28+1 phản ứng nguyên tố, giọng bíp máy chữ riêng từng NPC/Boss/Class, âm thanh Lò Rèn/Đổi Mệnh/Khảm Sắc/Kiểm tra vật phẩm) với bộ nạp `AudioBuffer` bất đồng bộ (tự động fallback tức thì sang Web Audio API nếu file thiếu/chưa nạp, tự thử chéo `.ogg` ↔ `.mp3`, tự mở khóa `AudioContext` cảm ứng iOS/Android, giới hạn đa âm di động & dùng chung bộ đệm nhiễu LFSR `0 GC`).
    - **Âm thanh không gian 2D Co-op (`playSpatialSfx` + `src/net/coopClient.ts`) & Lưu cấu hình (`localStorage`):** Tự động suy giảm âm lượng, lọc thông thấp theo khoảng cách và đảo kênh trái/phải (`StereoPannerNode`) khi đồng đội tung chiêu, lướt, bước chạy, kích nổ phản ứng, mở trụ hoặc phát tín hiệu tập hợp; thêm thanh trượt âm lượng `0–100%` trong `[ESC]` đồng bộ với nút `SFX`/`MUTE` trên HUD qua `pixtel_audio_settings_v1` và pre-cache toàn bộ `/sfx/*` trong `public/sw.js`.
  - **PIXTEL v3.2.6 — Đại Tu Bố Cục HUD `0 px²` Chồng Chéo, Tương Phản 16-Bit, `[F11]` / `[V]`, Bộ Lọc Tên Sạch & Luồng FTUE:** Tách cột trái `.hud-left-stack` (xếp gọn Hero Panel, Party Box, Tutorial Banner sang mép trái không bao giờ che trung tâm), neo `#toast-stack` mảnh sát mép trên (tối đa `2` toast, tự gộp trùng, `2.5s`), đồng bộ `currentBiome` khi hồi sinh/dịch chuyển dập tắt bắn kép toast, nâng tương phản `.hud-meta-row` / `Bia Ký 0/8` / `✊ TAY KHÔNG` / biển hiệu thế giới có viền sáng + glyph `[` `]`, sửa sạch thanh đáy (`58×56px`, `.key-cap` nền đặc xóa lỗi `LMB...`, `SPACE`, `0 CHÌA`, `CẦN VK`), gom Toolbar 2 hàng chuẩn, thêm `⛶ F11` + Thu gọn HUD chiến đấu `👁 HUD [V]`, bộ lọc `sanitizePlayerName` (`"Lữ Khách"`) tự dọn sạch `localStorage`/Save cũ, và đặt sẵn Vũ Khí Khởi Đầu vào `STARTER STASH [F]` kèm nút **`⚡ LẤY & TRANG BỊ NGAY`**.
  - **Web / Mobile PWA & Triển khai GitHub Pages:** Tự động test (`npm test`), build & deploy qua GitHub Actions lên `https://trunglegit.github.io/PixTel/`, kèm `manifest.webmanifest`, `sw.js`, `icon.svg`, chế độ màn hình ngang fullscreen, font Pixelify Sans tiếng Việt tự lưu trữ cục bộ (không phụ thuộc CDN).
  - **Giai đoạn 1 — Mobile Twin-Stick & Smart Auto-Aim:** Cần xoay Analog đa điểm (đẩy sát viền tự động Chạy Nhanh + nút khóa Sprint), cụm phím chiến đấu bên phải (`⚔ ĐÁNH / GIỮ TỤ LỰC` phát sáng vàng ở khung Just-Charge, `💨 LƯỚT`, `✦ [E]`, `🔥 [Q]`, `🖐 [F]`), Tự Ngắm Mục Tiêu Thông Minh (ưu tiên Trụ Đấu Trường -> Boss/Quái -> Mỏ quặng) hoặc kéo 360°, chạm xem chi tiết trang bị (Tap-to-Inspect).
  - **Giai đoạn 2 — Multiplayer Co-op 2–4 Người (`[P]` / Mã Phòng 6 Ký Tự):** Kiến trúc mạng kép hỗ trợ cả **Online WebRTC P2P (`PeerJS`)** chạy trực tiếp trên GitHub Pages / 4G điện thoại và **Dedicated WebSocket Room Server (`server/coopServer.ts`, `npm run server`)**; đồng bộ Paper-Doll 5 ô thời gian thực (kiểm tra đúng Class), kích nổ **Phản Ứng Nguyên Tố Kép 9 Hệ** chéo giữa các người chơi, chia sẻ mở khóa Trụ Sắc Màu / Trụ Đấu Trường Eraser, ưu tiên Aggro cho Khiên `Prism Knight`, và **100% XP + Instanced Loot** riêng cho từng thành viên.
  - **PIXTEL v3.0–v3.2 — Kỹ Năng Theo Vũ Khí (`41` skills), 16 Trang Bị Độc Lạ (`dropOnly`), 16 Core Items & 3 Set Bonus, Rương Gacha Mùa `[G]` & 16 Cảnh Phim Cốt Truyện:**
    - **Hệ Thống Kỹ Năng Theo Vũ Khí (`41` Weapon Skills `[E]`):** Nhân vật giữ **1 Đánh Thường (`LMB` + Tụ Lực)** và **1 Tuyệt Kỹ Cố Định của Class (`[Q]`, mở khóa sẵn không còn khóa theo Phụ kiện)**; mỗi vũ khí mang **1 Kỹ Năng `[E]` riêng biệt** (tự động đổi icon pixel trên HUD, viền màu nguyên tố, hồi chiêu, tooltip, hoạt ảnh & `pixelfx` VFX ngay khi đổi vũ khí!).
    - **16 Trang Bị Độc Lạ Biến Đổi Chiêu Thức (`dropOnly: true`):** Gồm 8 Vũ Khí Độc Lạ + 8 Mũ/Giáp/Giày/Phụ Kiện kích hoạt `12` Biến Thể Chiêu Thức có ICD cân bằng (sét dây chuyền, sóng băng/chấn động khi Lướt, phản nổ dung nham, hố đen khi dùng `[Q]`, thiên thạch chí mạng, phân đôi tia `[E]`...); chỉ rơi từ quái & Boss (tuyệt đối không bán shop / không rèn / không rò rỉ random chest).
    - **Rương Gacha Theo Mùa (`[G]` + Đài `GACHA ALTAR` Thị Trấn) & 4 Chìa Khóa Quần Xã:** Gỡ sạch toàn bộ rương bãi farm & Trụ Sắc Màu, **chỉ giữ lại đúng 4 Rương Chính tại 4 Đấu Trường Boss**; bổ sung 4 Chìa Mùa (*Xuân / Đông / Hạ / Nhật Thực*) rơi tỉ lệ thấp từ quái đúng quần xã hoặc rèn tại Kael + 8 trang bị Độc Quyền Mùa cân bằng theo Tier; sân khấu mở rương 60FPS có hoạt ảnh tra chìa, rung lắc nhịp tim chiptune, hiệu ứng **"★ LẬT KÈO NÂNG PHẨM! ★"** sét xé màn hình đổi màu phẩm chất, mưa sao confetti, Quay ×1/×5, Bảo hiểm Pity 10/25 & tự quy đổi đồ trùng thành Mảnh Lăng Kính + Vàng.
    - **Quái & Boss Sắc Nét HD (`306` frame) & Cân Bằng Hardcore Grind-to-Boss:** Tăng độ phân giải & làm nét toàn bộ 19 model quái/boss kèm frame đánh **`:atk`** 4 hướng, tia cảnh báo đòn (Danger Glint), gọi bầy đàn `"!"` (`125px`), bật lùi trúng đòn, xuất hiện cổng màu; tăng mạnh HP/ATK/DEF/Giáp Trắng của quái & Boss + hồi chiêu Bình Máu `2.5s` để buộc người chơi farm bãi quái, làm nhiệm vụ & cường hóa trang bị trước khi thách đấu Boss.
- **Trọng tâm tiếp theo (Active / Next Focus Areas):**
  - Tiếp tục thu thập phản hồi thực chiến trên `https://trunglegit.github.io/PixTel/` (PC & Mobile Co-op).
  - Giai đoạn 3 (tùy chọn mở rộng): Nhạc nền BGM 16-bit biến thiên động theo Quần xã / Boss Phase, Authoritative Cloud Server (Colyseus / Fly.io / Railway), hoặc đóng gói Capacitor lên Google Play / App Store.

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

### [2026-11-26 16:08 UTC] — chu0n6-iot (Antigravity) — Xây Dựng & Tích Hợp Hệ Thống SFX Lai Retro 16-Bit JRPG (Mobile · Co-op Không Gian 2D · Offline PWA)
- **Commit / Branch:** `main`
- **Giai đoạn / Version:** `PIXTEL v3.3` — Hybrid Retro 16-Bit JRPG SFX Engine & Pipeline
- **Đã làm (Done):**
  - **Giai đoạn 1 — Pipeline xử lý & chuẩn hóa âm thanh (`scripts/convert_sfx.py`, `raw_sfx/README.md`, `public/sfx/*`):**
    - Viết `scripts/convert_sfx.py` hỗ trợ cả `ffmpeg` và `pydub`, chuẩn hóa mọi file `.wav/.ogg/.mp3` trong `raw_sfx/` về đúng chuẩn Retro 16-bit (`22050 Hz`, `Mono`, `-3.00 dBFS`) và xuất đồng thời 2 định dạng `64kbps` `.ogg` (`105.8 KB` cho Chrome/Android) & `.mp3` (`57.6 KB` cho Safari iOS PWA) cùng `public/sfx/manifest.json` (tích hợp `--seed-cc0` tự tổng hợp 16 clip gốc CC0 sạch bản quyền).
  - **Giai đoạn 2 — Nâng cấp bộ máy âm thanh lai (`src/audio/chiptuneSynth.ts`):**
    - **Procedural Chiptune (`0 KB`, độ trễ `0 ms`):** Tổng hợp trực tiếp đòn thường/combo, tụ lực Just-Charge, 41 kỹ năng vũ khí `[E]`, tuyệt kỹ `[Q]` riêng cho 4 Class, đầy đủ 9 nguyên tố (`fire`, `ice`, `nature`, `volt`, `prism`, `void`, `chroma`, `wind`, `quake`) & 28+1 phản ứng nguyên tố, giọng nói máy chữ tần số riêng cho từng NPC (`Elian`, `Kael`, `Mira`) / Boss / Class, cùng hiệu ứng Lò Rèn, Xúc Xắc Đổi Mệnh, Khảm Sắc Tố & kiểm tra túi đồ.
    - **Hybrid `AudioBuffer` Loader & Tối ưu Mobile:** Nạp bất đồng bộ 16 clip `/sfx/*` (bước chân 5 quần xã + lội nước, 4 tiếng gầm Boss, mở rương, thắp trụ, đào/vỡ mỏ, búa đe lò rèn, tín hiệu Co-op), tự động fallback sang Web Audio API nếu file chưa nạp hoặc lỗi mạng, tự thử chéo `.ogg` ↔ `.mp3`, tự mở khóa/resume `AudioContext` trên iOS/Android, giới hạn đa âm (`14` mobile / `24` desktop) và tái sử dụng bộ đệm nhiễu LFSR 15-bit không tạo rác bộ nhớ.
    - **Co-op 2D Spatial Audio & Lưu cấu hình:** Hiện thực `computeSpatialParams` & `playSpatialSfx` (suy giảm âm lượng theo khoảng cách, lọc thông thấp không khí & `StereoPannerNode` trái/phải) và lưu trạng thái tắt tiếng / âm lượng vào `localStorage` (`pixtel_audio_settings_v1`).
  - **Giai đoạn 3 — Tích hợp toàn diện Gameplay, Thế giới mở, UI, Co-op & Offline PWA:**
    - Gắn SFX chiến đấu Class, 9 nguyên tố/phản ứng, tiếng gầm chuyển Phase 1/2/3 theo từng Boss & cảnh báo đòn Boss trong `src/systems/combat.ts`.
    - Gắn tiếng bước chân theo quần xã & mép nước, giải mã Bia Ký, dùng dược phẩm và phát tín hiệu Co-op trong `src/game.ts`.
    - Gắn hiệu ứng chạy chữ kèm tiếng bíp giọng riêng trong `src/ui/DialogueModal.ts` & `src/ui/CutsceneModal.ts`, tiếng búa rèn/đổi mệnh/khảm sắc trong `src/ui/ForgeModal.ts`, tiếng xem trang bị theo độ hiếm trong `src/ui/InventoryModal.ts` & `src/ui/ItemReviewTooltip.ts`, đồng bộ nút `SFX`/`MUTE` trên `src/ui/HUD.ts` và thêm thanh trượt Âm lượng SFX `0–100%` trong menu `[ESC]` (`index.html`, `src/main.ts`, `style.css`).
    - Tự động phát âm thanh không gian 2D khi nhận gói tin đồng đội trong `src/net/coopClient.ts` (`src/net/protocol.ts`) và cập nhật `public/sw.js` (`pixtel-pwa-v3.3-sfx`) để pre-cache & phục vụ offline toàn bộ file `.ogg/.mp3`.
- **File chính đã sửa / thêm:** `scripts/convert_sfx.py`, `raw_sfx/README.md`, `public/sfx/*` (`16 .ogg` + `16 .mp3` + `manifest.json`), `public/sw.js`, `src/audio/chiptuneSynth.ts`, `src/systems/combat.ts`, `src/game.ts`, `src/net/protocol.ts`, `src/net/coopClient.ts`, `src/ui/DialogueModal.ts`, `src/ui/CutsceneModal.ts`, `src/ui/ForgeModal.ts`, `src/ui/InventoryModal.ts`, `src/ui/ItemReviewTooltip.ts`, `src/ui/HUD.ts`, `index.html`, `src/main.ts`, `style.css`, `package.json`, `.gitignore`, `tests/featureTests.ts`, `DEV_LOG.md`
- **Kiểm tra (Verified):** `npm run typecheck` (`0` lỗi), `npm test` (**20/20** feature suites PASS sạch — bổ sung **Suite 20** kiểm thử chuẩn hóa `22050 Hz`/`-3 dBFS`, `ChiptuneSynth` procedural + fallback, tần số giọng NPC, Co-op Spatial Audio qua WebSocket thật & PWA `sw.js`), `npm run build` (`vite build` sạch, xuất đầy đủ `dist/sfx/`).
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không có breaking change; để thêm/thay thế gói âm thanh CC0 tùy chỉnh, chỉ cần chép `.wav/.ogg/.mp3` vào `raw_sfx/` và chạy `npm run sfx` (`python3 scripts/convert_sfx.py`).
- **Gợi ý bước tiếp theo (Next Steps):** Có thể mở rộng thêm nhạc nền BGM Chiptune 16-bit chuyển tiếp mượt theo từng Quần xã & Boss Arena.

### [2026-11-26 15:25 UTC] — chu0n6-iot (Antigravity Multi-Agent: `qa_playtester` + `ui_ux_dev`) — Đại Tu Bố Cục HUD `0 px²` Chồng Chéo, Độ Tương Phản 16-Bit, `[F11]` / `[V]`, Bộ Lọc Tên Sạch & Luồng FTUE Tân Thủ
- **Commit / Branch:** `main`
- **Giai đoạn / Version:** `PIXTEL v3.2.6` — QA Playtester ↔ Dev UI/UX & FTUE Overhaul
- **Đã làm (Done):**
  - **Tách lớp hiển thị HUD & Toast (`0 px²` chồng chéo trung tâm):** Bọc `.hud-top-left`, `#hud-party-box` và `#hud-tutorial-banner` vào cột trái `.hud-left-stack` (`width: 282px`); quy hoạch `#toast-stack` mảnh sát mép trên (`top: 6px`, tối đa `2` toast, tự gộp trùng, tự ẩn `2.5s`); đồng bộ `currentBiome` ngay trong `onPlayerDefeated()`, `fastTravelTo()`, `teleportToCoopPeer()` để dập tắt hoàn toàn lỗi bắn kép toast hồi sinh + toast vùng; thu gọn `#interact-prompt` (`bottom: 86px`) và `.class-select-box` vừa khít màn `1366×640`.
  - **Nâng cấp độ tương phản & nhãn thế giới:** `.hud-meta-row` lên `13px weight 600` có nền tối mờ & bóng pixel `1px` (`15.9:1`); đổi `"Bia 0/8"` dễ nhầm thành **`"Bia Ký 0/8"`**; đóng pill cảnh báo đỏ **`✊ TAY KHÔNG`**; bổ sung glyph `[` `]` vào `pixelfx/core/font.js` và vẽ biển hiệu có viền sáng (`STARTER STASH [F]`, `GACHA ALTAR [F]`, `CLASS ALTAR [F]`).
  - **Thanh phím tắt đáy (`#hud-bottom-bar`):** Mở rộng ô `58×56px` (icon `32×32px`), thêm nền đặc `#0b0a16` cho `.key-cap` xóa sạch lỗi lộ pixel nắm đấm thành `LMB...`; đổi `SPC` → **`SPACE`**, `🗝0` → **`0 CHÌA`**; ô `[E]` khi tay không hiện rõ ổ khóa đỏ + chữ **`CẦN VK`**.
  - **Toàn màn hình (`⛶ F11`), Thu gọn HUD chiến đấu (`👁 HUD [V]`) & Toolbar 2 hàng chuẩn:** Chia `.hud-toolbar` thành đúng **2 hàng phẳng phiu** (6 nút Thao tác chính + 6 nút Hiển thị/Hệ thống, xóa hàng 3 lẻ); bắt phím `F11` đồng bộ `fullscreenchange` và phím `V` bật/tắt `body.hud-compact`.
  - **Bộ lọc tên sạch (`src/utils/playerName.ts`):** Chuẩn hóa tên mặc định **`"Lữ Khách"`**, lọc từ nhạy cảm Anh/Việt & leetspeak, tự động quét dọn `localStorage` (`pixtel_last_player_name`, `pixtel_coop_nickname_v1`) và file Save cũ có tên xấu (như `"nigge"`).
  - **Luồng FTUE Tân Thủ không kẹt Bước 5/6 `[E]`:** Giữ nguyên contract `resetStarterKit()` & 6 bước Tutorial; đặt sẵn Vũ Khí Khởi Đầu đúng Class vào `STARTER STASH [F]` trong `startNewGame()` (tự đổi theo Class nếu đổi ở Đài Đổi Class trước khi rút), thêm nút **`⚡ LẤY & TRANG BỊ NGAY`** trong `StorageChestModal.ts` và hướng dẫn động trên `#hud-tutorial-banner`.
  - Xuất bản báo cáo trực quan Trước/Sau vào `preview for devs/2026-11-26-v3.2.6-hud-ux-ftue-qa-overhaul-preview.md`.
- **File chính đã sửa / thêm:** `src/utils/playerName.ts`, `index.html`, `style.css`, `src/game.ts`, `src/main.ts`, `src/ui/HUD.ts`, `src/ui/HomeScreen.ts`, `src/ui/ClassSelect.ts`, `src/ui/StorageChestModal.ts`, `src/ui/TutorialModal.ts`, `src/ui/CoopModal.ts`, `src/ui/DialogueModal.ts`, `src/ui/CutsceneModal.ts`, `src/net/coopClient.ts`, `src/data/cutscenes.ts`, `src/world/interactables.ts`, `src/vfx/pixelfx/core/font.js`, `tests/featureTests.ts`, `preview for devs/*`, `DEV_LOG.md`
- **Kiểm tra (Verified):** `npm run typecheck` (`0` lỗi), `npm test` (**19/19** feature suites pass, thêm Suite 19), `npm run build` (`vite build` sạch), và kiểm thử nghiệm thu tự động Vòng 2 của `qa_playtester` bằng Playwright trên `1366×640`, `1280×680`, `1280×720` (**`0 px²` overlap, `0` console/page errors**).
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không có breaking change; dữ liệu Save và `localStorage` cũ hoàn toàn tương thích và tự động được làm sạch tên nếu chứa từ ngữ nhạy cảm.
- **Gợi ý bước tiếp theo (Next Steps):** Kiểm thử thực tế Co-op & Mobile trên bản GitHub Pages mới nhất.

### [2026-11-26 07:35 UTC] — GitHub Copilot — Hợp nhất `main` mới nhất và xử lý xung đột
- **Commit / Branch:** Merge `origin/main` vào `feat/vietnamese-pixel-game-font`
- **Giai đoạn / Version:** `PIXTEL v3.2` — Merge & Paper-Doll Visuals
- **Đã làm (Done):**
  - Hợp nhất các cập nhật mới nhất từ `main`, giữ lại lịch sử và các mục nhật ký của cả hai nhánh.
  - Kết hợp animation/weapon/gear mới của `main` với ánh xạ hình dáng trang bị, palette và dư ảnh dash; giữ đúng aim hướng ngược của clone khi tấn công.
- **File chính đã sửa / thêm:** `DEV_LOG.md`, `.brain/`, `src/game.ts`, `src/graphics/pixelfxHeroModels.ts`, `src/vfx/pixelfx/core/rig.js`, `src/vfx/pixelfxTypes.ts`
- **Kiểm tra (Verified):** `npm run build` (pass; cảnh báo bundle JS > 500 kB), `npm run test` (18/18 suites pass).
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không có; không thay đổi cân bằng hoặc schema lưu.
- **Gợi ý bước tiếp theo (Next Steps):** Tiếp tục review PR và kiểm tra trực quan các bộ trang bị trong gameplay.

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
### [2026-11-27 00:20] — Antigravity — Teamwork Wave 1: 4 Trang Bị Exotic + 4 Quái Vật + 8 Module VFX & Preview Tổng Hợp
- **Commit / Branch:** `main` (Teamwork Production Wave 1 Completed)
- **Giai đoạn / Version:** `PIXTEL v3.2` — Teamwork Continuous Production Wave 1
- **Đã làm (Done):**
  - **Hệ thống Teamwork tự động (2 đội song song) hoàn tất Wave 1:**
    - **Team 1 — 4 Trang bị Exotic mới** đã tích hợp hoàn chỉnh vào game:
      - `Thương Lăng Kính Khúc Xạ` (Prism lance, skill [E] phóng thương khúc xạ 3 nhánh)
      - `Tinh Bàn Bão Tố` (Volt staff, skill [E] xoáy hút quái + nổ sét AoE)
      - `Pháo Phá Vỡ Thời Không` (Quake cannon, skill [E] rải mìn lượng tử)
      - `Huyết Giáp Cuồng Huyết` (Cursed armor, passive phản công huyết + tăng ATK khi trúng đòn)
    - **Team 2 — 4 Quái vật mới** đã tích hợp hoàn chỉnh:
      - `Bướm Gió Bào Tử` (zephyr_moth) — mob thường Gió, Thảo Nguyên
      - `Nhện Tinh Thể Tụ Điện` (prism_arachnid) — mob trung bình Lôi, Núi Thạch Anh
      - `Lư Hỏa Hổ Phách` (amber_crucible) — mob nặng Chấn Động, Hỏa Ngục
      - `Phán Quan Thời Không` (chrono_arbiter) — Boss Phụ Hư Vô, Vết Nứt
    - **8 module pixelfx VFX mới** (4 cho items + 4 cho mobs)
    - **4 bảng loot drops** với tỉ lệ cân bằng + rơi trang bị Exotic hiếm
    - **3 Weapon Skills mới** tích hợp vào hệ thống [E] vũ khí
    - **Combat AI** cho cả 4 quái (hành vi, kỹ năng, spawn zones)
  - **Tạo file preview tổng hợp** `2026-11-27-teamwork-wave1-items-mobs-preview.md` với bảng chi tiết toàn bộ sản phẩm.
  - **Wave 2 bị gián đoạn** do hết quota API (429 RESOURCE_EXHAUSTED) — cần đợi reset để tiếp tục.
- **File chính đã sửa / thêm:** `src/data/equipments.ts`, `src/data/weaponSkills.ts`, `src/data/enemies.ts`, `src/data/lootTables.ts`, `src/data/recipes.ts`, `src/data/worldConfig.ts`, `src/data/types.ts`, `src/systems/combat.ts` (+317 lines), `src/systems/ItemEffectSystem.ts`, `src/graphics/pixelfxHeroModels.ts`, `src/vfx/vfxManager.ts`, `src/vfx/pixelfx/core/rig.js`, `src/world/entities.ts`, `src/assets/codixel-enemies.json/png`, `src/assets/codixel-icons.json/png`, 8 module VFX mới tại `src/vfx/pixelfx/fx/pixtel/b1_*`, `tests/batchProductionTests.ts`, `scripts/production/generate_batch1_icons.mjs`, `preview for devs/2026-11-27-teamwork-wave1-items-mobs-preview.md`.
- **Kiểm tra (Verified):** `npm run build` (**0 lỗi TS**), `tests/featureTests.ts` (**18/18 suites PASS**), tổng cộng **+1,573 dòng code / 22 files thay đổi / 10 files mới**.
- **Lưu ý / Handoff:** Teamwork bị gián đoạn ở đầu Wave 2. Wave 1 hoàn chỉnh & sẵn sàng chơi.
- **Gợi ý bước tiếp theo:** Khôi phục Teamwork Wave 2 khi quota reset; playtest 4 quái mới ở 4 vùng; cân bằng loot drop rate.

### [2026-11-26 11:28] — Antigravity — Xuất Bản Preview Tổng Hợp `PIXTEL v3.2` Vào `preview for devs/` & Push Lên GitHub
- **Commit / Branch:** `main` (commit toàn bộ cụm `PIXTEL v3.2` + `preview for devs/`)
- **Giai đoạn / Version:** `PIXTEL v3.2` — Preview Publication & GitHub Push
- **Đã làm (Done):**
  - Tạo báo cáo Preview chuẩn GitHub [2026-11-26-v3.2-home-16scene-story-class-skills-preview.md](preview%20for%20devs/2026-11-26-v3.2-home-16scene-story-class-skills-preview.md) kèm **12 ảnh chụp kiểm duyệt trực tiếp trên Chrome** lưu tại `preview for devs/assets/v3.2-01..12-*.png` (Trang Chủ đặt tên, Chọn Class vừa khít 1 màn hình với 4 sân khấu nhân vật thi triển Skill `[Q]`, cận cảnh Bit Rogue 3-Clone, các cảnh mở đầu 01/06/08/11/16, Tab Phim Cốt Truyện `[J]`, Knight Thánh Kiếm Phá Địa vàng & Bit Rogue `[Q]` thực chiến).
  - Cập nhật bảng mục lục mới nhất lên đầu tại `preview for devs/README.md`.
- **File chính đã sửa / thêm:** `preview for devs/2026-11-26-v3.2-home-16scene-story-class-skills-preview.md`, `preview for devs/README.md`, `preview for devs/assets/v3.2-*.png` (12 ảnh).
- **Kiểm tra (Verified):** `npm run build` (**0 lỗi TS**), `tests/featureTests.ts` (**18/18 suites PASS**), `brain.py lint` (**0 lỗi**), commit & push sạch lên `origin/main`.
- **Lưu ý / Handoff:** Không có.
- **Gợi ý bước tiếp theo:** Toàn bộ thành viên có thể mở trực tiếp thư mục `preview for devs/` trên GitHub để xem toàn bộ thành quả `v3.2` và pull `main` để chơi ngay.

### [2026-11-26 11:19] — Antigravity — Sửa Lỗi Đứng Phim Cốt Truyện Từ Cảnh 8 (`pixtel/prism-beam` `palette: undefined`)
- **Commit / Branch:** `main` (working tree `v3.2`)
- **Giai đoạn / Version:** `PIXTEL v3.2.5` — Cutscene Crash Fix & All-31-Beat Render Verification
- **Đã làm (Done):**
  - **Sửa lỗi treo vòng lặp hoạt ảnh từ Cảnh 08 trở đi (`src/data/cutscenes.ts`, `src/ui/CutsceneModal.ts`):**
    - Nguyên nhân: `pixtel/prism-beam` ở Cảnh 08 (`scene_intro`) và Cảnh 02 (`scene_boss_eraser`) truyền `options: { palette: undefined }`, làm ghi đè `palette` mặc định của module khiến `fit(o.palette)` báo `TypeError` và dừng `requestAnimationFrame` của rạp phim.
    - Khắc phục: thay bằng `palette: "bone"` (tia tẩy trắng ma quái cực nét), lọc sạch mọi key `undefined` khỏi `cue.options` + bọc `try/catch` an toàn quanh `createFx` trong `CutsceneModal.ts`.
  - **Mở rộng Suite 17 (`tests/featureTests.ts`):** Tự động khởi tạo, chạy `update()` và `draw()` cho toàn bộ 31 phân cảnh của cả 6 phim cốt truyện để đảm bảo không còn lỗi runtime ẩn ở bất kỳ cảnh nào.
- **File chính đã sửa / thêm:** `src/data/cutscenes.ts`, `src/ui/CutsceneModal.ts`, `tests/featureTests.ts`.
- **Kiểm tra (Verified):** `npm run build` (**0 lỗi TS**), `tests/featureTests.ts` (**18/18 suites PASS**), chạy tuần tự 01 → 16 trên Chrome thật (**0 console/page errors**), kiểm duyệt ảnh Cảnh 08 & Cảnh 09 hiển thị sắc nét.
- **Lưu ý / Handoff:** Không có breaking change.
- **Gợi ý bước tiếp theo:** F5 trang `http://127.0.0.1:5173/` để xem trọn vẹn từ Cảnh 01 đến 16!

### [2026-11-26 11:15] — Antigravity — Nâng Cấp Toàn Diện Hoạt Ảnh Tuyệt Kỹ `[Q]` Phân Thân Ảo Ảnh Của `Bit Rogue` (In-Game & Preview)
- **Commit / Branch:** `main` (working tree `v3.2`)
- **Giai đoạn / Version:** `PIXTEL v3.2.4` — Bit Rogue `[Q]` Phantom Clone Overhaul (Shadow-Split Burst, Pincer-Blink Mirror Slashes & 3-Clone Class Preview)
- **Đã làm (Done):**
  - **Hiệu ứng kích hoạt `[Q]` & Đòn chém đồng bộ trong trận (`src/systems/combat.ts`):**
    - Khi bấm `[Q]` (*Phân Thân Ảo Ảnh*), Bit Rogue kích nổ bùng khói phân thân `spawn/poof` (`PAL.neon` + `PAL.cyber`), sóng âm `pixtel/sonic-wave`, vòng xoay song đao `melee/spin-slash` (`PAL.neon`), hào quang tốc độ `status/haste`, 0.35s i-frames cùng 14 tia điểm ảnh xanh–hồng nổ tỏa ra.
    - Mỗi đòn đánh thường khi `cloneTime > 0` kích hoạt **vệt chém gương xanh holographic (`melee/double-slash` / `melee/spin-slash` `PAL.cyber`)** đối ứng từ phía bên kia mục tiêu kèm tia chí mạng vàng `crit-gold` và chuỗi hạt liên kết xanh–hồng.
  - **Hiển thị Phân Thân Ảo Ảnh động trên bản đồ (`src/game.ts`):**
    - Thay bóng mờ tĩnh cũ bằng **Phân Thân kẹp sườn thông minh**: nối dây năng lượng xanh–hồng với bản thể, vẽ tàn ảnh tốc độ (`+100% ASPD`) phía sau khi di chuyển/đánh, và **tự động tốc biến sang phía đối diện mục tiêu ngay khi vung đao** để chém đồng bộ 2 hướng (`dual_cross_slash`) cùng tia quỹ đạo xanh–hồng xoay quanh nhân vật.
  - **Làm lại hoàn toàn `SKILL [Q] PREVIEW` của Bit Rogue trên màn Chọn Class (`src/ui/ClassSelect.ts`):**
    - Diễn hoạt 3 pha siêu tốc: nổ khói tách thân → bản thể & phân thân xanh tốc biến đổi vị trí liên tục 2 bên tinh thể kèm tàn ảnh thứ 3 lao từ trên xuống, chém chồng `dagger-flurry` + `double-slash` + `spin-slash` xanh/hồng + nổ sao chí mạng `impacts/crit-hit` vàng rực!
- **File chính đã sửa / thêm:** `src/systems/combat.ts`, `src/game.ts`, `src/ui/ClassSelect.ts`.
- **Kiểm tra (Verified):** `npm run build` (**0 lỗi TS**), `tests/featureTests.ts` (**18/18 suites PASS**), kiểm duyệt ảnh chụp trực tiếp trên Chrome cả thẻ `Bit Rogue` ở Chọn Class lẫn bấm `[Q]` & đánh đồng bộ trong game (**0 console/page errors**).
- **Lưu ý / Handoff:** Không có breaking change.
- **Gợi ý bước tiếp theo:** Làm mới tab `http://127.0.0.1:5173/` để xem trực tiếp hoặc yêu cầu xuất preview / commit & push lên GitHub.

### [2026-11-26 11:10] — Antigravity — Bỏ Bùng Nổ Cầu Vồng Ở Thánh Kiếm Phá Địa & Nâng Cấp Đoạn Mở Đầu Lên 16 Cảnh Sử Thi Điện Ảnh
- **Commit / Branch:** `main` (working tree `v3.2`)
- **Giai đoạn / Version:** `PIXTEL v3.2.3` — Golden Paladin Hold Slam & 16-Scene Cinematic Aethel-16 Opening Prologue
- **Đã làm (Done):**
  - **Tinh chỉnh hiệu ứng `Thánh Kiếm Phá Địa` của `Prism Knight` (`src/systems/combat.ts`, `tests/featureTests.ts`):**
    - Gỡ bỏ `pixtel/rainbow-burst` khỏi đòn Hold Charge Just-Charge; thay bằng luồng thánh quang vàng thuần khiết **`holy/smite` (`PAL.gold`)** kết hợp chém bổ **`melee/heavy-cleave` (`PAL.gold`/`PAL.holy`)** và sóng chấn địa **`ground-slam`** (`scale: 1.25`).
  - **Nâng cấp Động Cơ Phim Cốt Truyện 16-bit (`src/ui/CutsceneModal.ts`, `index.html`, `style.css`):**
    - Bổ sung chuyển động nhân vật mượt (`moveFromX`/`moveFromY` ease-out cubic), hỗ trợ diễn xuất đồng thời cả 4 Class (`classIdOverride`), 8 bối cảnh tiền cảnh pixel-art thủ công (`origin_town`, `four_pillars`, `ancient_canopy`, `ice_spires`, `magma_fissure`, `sky_rift`, `shattered_prism`, `horizon_biomes`), 5 hiệu ứng thời tiết (`petals`, `ash`, `snow`, `glitch_rain`, `prism_sparks`), trượt camera (`camPanX`), bảng tiêu đề chương JRPG (`titleCard`), nhãn số cảnh, thanh tiến độ `01/16`, 16 chấm chọn cảnh trực tiếp, nút **◀ Cảnh Trước** và chế độ **⏯ Tự Phát**.
  - **Mở rộng Đoạn Mở Đầu (`scene_intro`) từ 4 lên 16 Phân Cảnh Sử Thi (`src/data/cutscenes.ts`):**
    - Kể trọn mạch truyện Aethel-16: Kỷ Nguyên 9 Trụ Sắc Màu (C01) → Thị Trấn Khởi Nguyên & Tứ Đại Tiền Bối (C02) → Thảo Nguyên Cổ Thụ (C03) → Đỉnh Thạch Anh & Lò Rèn Nam (C04) → Bầu Trời Nứt Toác (C05) → The Eraser Giáng Lâm từ vết nứt (C06) → Quân Đoàn Hư Vô (C07) → Tia Tẩy Trắng quét ngang vương quốc (C08) → Xing Warden & Blight Prism sa ngã (C09) → Hỏa Ngục Hổ Phách nổi loạn (C10) → Tứ Đại Chiến Binh Quyết Tử hợp kích (C11) → Đại Lăng Kính vỡ thành 8 Bia Ký (C12) → Ngọn Đèn Cuối Cùng tại Quảng Trường (C13) → Lời Hiệu Triệu gửi `{PLAYER_NAME}` (C14) → `{PLAYER_NAME}` chém toạc màn sương Tẩy Trắng (C15) → Bình Minh 4 Quần Xã & Khởi Hành Hồi I (C16).
- **File chính đã sửa / thêm:** `src/systems/combat.ts`, `src/data/cutscenes.ts`, `src/ui/CutsceneModal.ts`, `index.html`, `style.css`, `tests/featureTests.ts`.
- **Kiểm tra (Verified):** `npm run build` (**0 lỗi TS**), `tests/featureTests.ts` (**18/18 suites PASS**, xác nhận `scene_intro >= 16` cảnh & `Thánh Kiếm Phá Địa` không còn `rainbow-burst`), kiểm duyệt ảnh chụp Chrome trực tiếp các cảnh C01, C02, C06, C11, C16 & đòn Hold Slam vàng của Knight (**0 console/page errors**).
- **Lưu ý / Handoff:** Không có breaking change.
- **Gợi ý bước tiếp theo:** Làm mới tab `http://127.0.0.1:5173/` để thưởng thức 16 cảnh mở đầu (có thể bật **⏯ Tự Phát** xem như phim JRPG); yêu cầu tạo preview / commit & push khi sẵn sàng.

### [2026-11-26 11:01] — Antigravity — Gỡ Bỏ Hình Nhân Giả (`stockActor`) Trên `The Eraser` & Hiệu Ứng `scifi/glitch` / `spawn/disintegrate`
- **Commit / Branch:** `main` (working tree `v3.2`)
- **Giai đoạn / Version:** `PIXTEL v3.2.2` — VFX Bugfix (`scifi/glitch` & `spawn/disintegrate` stock dummy removal + The Eraser front-facing cutscene framing)
- **Đã làm (Done):**
  - **Sửa triệt để lỗi xuất hiện hình nhân giả trên model Boss `The Eraser` và quái vật (`src/vfx/pixelfx/fx/scifi/glitch.js`, `src/vfx/pixelfx/fx/spawn/disintegrate.js`):**
    - Nguyên nhân: hai module gốc của `pixelfx` tự động vẽ hình nhân mặc định `stockActor()` đè lên vị trí hiệu ứng mỗi khi kích hoạt `scifi/glitch` hoặc `spawn/disintegrate` (ảnh hưởng cả trong Phim Cốt Truyện lẫn giao tranh Boss/quái trực tiếp).
    - Khắc phục: thêm tùy chọn `drawActor: false` làm mặc định — `scifi/glitch` chỉ vẽ dải nhiễu RGB, vết xé ngang và dead-pixel thuần túy; `spawn/disintegrate` chỉ vẽ luồng sáng tan rã, vòng nền và hạt pixel bay theo gió, tuyệt đối không vẽ hình nhân mặc định.
  - **Căn chỉnh hiển thị `The Eraser` trong Phim Cốt Truyện (`src/data/cutscenes.ts`):** Chuyển `boss_the_eraser` sang góc chính diện (xòe đều đôi cánh tinh thể trắng–tím và con mắt hư vô) và căn giữa vòng khiên lục giác `pixtel/hex-shield` đúng lõi pha lê.
- **File chính đã sửa / thêm:** `src/vfx/pixelfx/fx/scifi/glitch.js`, `src/vfx/pixelfx/fx/spawn/disintegrate.js`, `src/data/cutscenes.ts`.
- **Kiểm tra (Verified):** `npm run build` (**0 lỗi TS**), `tests/featureTests.ts` (**18/18 suites PASS**), kiểm duyệt ảnh chụp Chrome trực tiếp các cảnh `scene_intro`, `scene_boss_eraser`, `scene_ending` (**0 console/page errors**).
- **Lưu ý / Handoff:** Không có breaking change.
- **Gợi ý bước tiếp theo:** Làm mới trang `http://127.0.0.1:5173/` để kiểm chứng trực tiếp; commit/push khi người dùng yêu cầu.

### [2026-11-26 10:53] — Antigravity — Chuẩn Hóa Bộ Kỹ Năng Thẻ Class & Sân Khấu Preview Nhân Vật Dùng Skill Cố Định `[Q]`
- **Commit / Branch:** `main` (working tree `v3.2`)
- **Giai đoạn / Version:** `PIXTEL v3.2.1` — Class Select & Handbook Skill Kit Sync + Live Hero `[Q]` Stage Preview
- **Đã làm (Done):**
  - **Đồng bộ đúng bộ chiêu hiện hành của 4 Class (`src/data/classes.ts`, `src/ui/ClassSelect.ts`, `src/ui/TutorialModal.ts`):**
    - Gỡ bỏ các chiêu `[E]` cố định cũ (*Khiên Phản Đòn, Xoáy Hư Sắc, Frame-Skip, Trụ Lôi Quang*) khỏi 4 thẻ Chọn Class và Cẩm Nang Tân Thủ `[H]`.
    - Mỗi thẻ Class hiển thị chuẩn 3 kỹ năng cố định của nhân vật: **Đánh thường (`LMB`)**, **Giữ (`Hold LMB`)**, **Skill cố định (`[Q]`)**, kèm ghi chú gọn `✦ [E]: Kỹ năng riêng theo từng Vũ Khí`.
  - **Nâng cấp ô `SKILL [Q] PREVIEW` (`168×80`) có nhân vật 3D trực tiếp thi triển Skill cố định (`src/ui/ClassSelect.ts`, `style.css`):**
    - **Prism Knight:** Nhân vật đứng giữa đấu trường xoay **Bão Kiếm Ánh Sáng (`[Q]`)** (`cast_ult` → `storm`) giữa lốc `pixtel/prism-storm` & `pixtel/rainbow-burst`.
    - **Chroma Mage:** Pháp sư lơ lửng giơ trượng (`cast_ult` → `orb_levitate`) triệu hồi **Mưa Thiên Thạch Thất Sắc (`[Q]`)** (`arcane/star-fall` + `explosions/plasma-explosion` `PAL.candy` + `pixtel/rainbow-burst`).
    - **Bit Rogue:** Sát thủ thật bên trái + **Phân Thân Ảo Ảnh (`[Q]`)** bán trong suốt bên phải cùng lao vào chém song đao đồng bộ (`dual_cross_slash` / `spin`) với `melee/spin-slash` (`PAL.neon`/`PAL.cyber`) quanh mục tiêu tinh thể.
    - **Pixel Tinker:** Kỹ sư giương súng (`cast_ult` → `recoil_barrage`) điều khiển **Drone Sắc Độ Quá Tải (`[Q]`)** bay xoay trên vai bắn chùm tia laser Lôi-Sắc Độ kèm `lightning/zap-hit` & `pixtel/rainbow-burst`.
    - Khắc phục hoàn toàn tình trạng khung preview trống đen ở giữa chu kỳ — luôn chạy mượt 60FPS liên tục trên cả 4 thẻ.
- **File chính đã sửa / thêm:** `src/ui/ClassSelect.ts`, `src/data/classes.ts`, `src/ui/TutorialModal.ts`, `style.css`.
- **Kiểm tra (Verified):** `npm run build` (**0 lỗi TS**), `tests/featureTests.ts` (**18/18 suites PASS**), kiểm duyệt ảnh chụp Chrome trực tiếp (`1280×720`, **0 console/page errors**).
- **Lưu ý / Handoff:** Không có breaking change.
- **Gợi ý bước tiếp theo:** Xem trực tiếp trên `http://127.0.0.1:5173/` hoặc yêu cầu tạo preview & commit/push lên GitHub.

### [2026-11-26 10:45] — Antigravity — Màn Hình Trang Chủ Đặt Tên, 6 Phim Cốt Truyện (`pixelfx`+`codixel`), Sửa Hold Charge Knight & 8 Hoạt Ảnh Vũ Khí Mới
- **Commit / Branch:** `main` (chưa commit — sẵn sàng commit/push khi yêu cầu)
- **Giai đoạn / Version:** `PIXTEL v3.2` — Home Screen Naming Flow, 6 Story Cutscenes, Knight Paladin Overhead Slam & 8 Weapon-Family Animations
- **Đã làm (Done):**
  - **Màn Hình Trang Chủ & Quy trình Đặt Tên → Chọn Class → Bắt Đầu (`src/ui/HomeScreen.ts`, `src/ui/pixelLogo.ts`, `src/ui/ClassSelect.ts`, `src/ui/HUD.ts`, `src/ui/DialogueModal.ts`, `index.html`, `style.css`):**
    - Thêm màn hình trang chủ `#screen-home` chạy nền 16-bit sống động 60FPS (bầu trời sao Aethel-16, dãy núi 4 Quần Xã, Trụ Lăng Kính phát xung `pixtel/color-wave` & `pixtel/rainbow-burst`, 4 Class đứng gác hai bên).
    - Người chơi nhập tên nhân vật (1–16 ký tự tiếng Việt, có nút `🎲 NGẪU NHIÊN`, nhớ tên gần nhất qua `localStorage`, đồng bộ vào HUD, Lời thoại NPC, Phim cốt truyện, Bảng chiến thắng, Co-op & `SaveDataV2.player.name`), sau đó chuyển sang Bước 2 `#screen-class-select` (hiển thị banner tên + nút `← ĐỔI TÊN / TRANG CHỦ`) rồi mới bấm **BẮT ĐẦU PHIÊU LƯU**.
  - **6 Phân Cảnh Phim Cốt Truyện 16-bit Tận Dụng `pixelfx` & `codixel` (`src/data/cutscenes.ts`, `src/ui/CutsceneModal.ts`, `src/ui/QuestJournalModal.ts`, `src/game.ts`, `src/main.ts`):**
    - Tạo 6 phim cốt truyện nhiều hồi với sân khấu màn ảnh rộng `480×200`, hiệu ứng `pixelfx` hai bộ đệm (`color` + ánh sáng cộng `light`), quái/Boss HD từ `codixel-enemies.png`, nhân vật 3D `pixelfx`, hiệu ứng quét Tẩy Trắng / Hồi Phục Sắc Màu, rung máy, âm thanh chiptune và chữ đánh máy gọi trực tiếp `{PLAYER_NAME}` & `{CLASS_NAME}`:
      1. `scene_intro` (*Hồi I — Thảm Họa Tẩy Trắng Aethel-16*, 4 cảnh — tự phát khi Bắt đầu mới & xem được ngay từ Trang Chủ)
      2. `scene_boss_warden` (*Hồi II — Hộ Vệ Cổ Thụ Xing Warden*, 3 cảnh)
      3. `scene_boss_blight` (*Hồi III — Rồng Lăng Kính Blight Prism*, 3 cảnh)
      4. `scene_boss_gilded` (*Hồi IV — Chúa Tể Hổ Phách Gilded Null*, 3 cảnh)
      5. `scene_boss_eraser` (*Hồi V — Đối Mặt The Eraser*, 3 cảnh)
      6. `scene_ending` (*Hồi Kết — Bình Minh Trở Lại Aethel-16*, 3 cảnh)
    - Tự động kích hoạt khi lần đầu chạm trán từng Boss / hạ Boss cuối, lưu tiến độ `seenCutscenes` vào Save, và mở thêm Tab thứ 3 **`🎬 PHIM CỐT TRUYỆN`** trong Sổ Nhiệm Vụ `[J]` để xem lại bất kỳ lúc nào.
  - **Thiết Kế Lại Hoàn Toàn Hoạt Ảnh Hold Charge cho `Prism Knight` (`src/graphics/pixelfxHeroModels.ts`, `src/systems/combat.ts`, `src/data/classes.ts`, `src/game.ts`, `src/ui/ClassSelect.ts`):**
    - Sửa triệt để lỗi Hold Charge của Knight giống tia ngang của `Pixel Tinker`: khi giữ LMB (`charge`), Knight giơ kiếm bằng hai tay thẳng lên đỉnh đầu cùng vương miện ánh sáng vàng; khi thả ra, nhảy bổ dọc **Thánh Kiếm Phá Địa (`overhead_slam`)** kèm vệt chém vàng `melee/heavy-cleave` (`PAL.holy`/`PAL.gold`) + sóng chấn địa `impacts/ground-slam` + bùng nổ cầu vồng `pixtel/rainbow-burst` khi Just-Charge!
    - Cập nhật luôn khung xem trước của Knight ở màn Chọn Class sang `overhead_slam` + `melee/heavy-cleave` (`PAL.holy`).
  - **Bổ Sung 8 Hoạt Ảnh Đánh Theo Dòng Vũ Khí (`src/graphics/pixelfxHeroModels.ts`, `src/systems/combat.ts`):**
    - Thêm 8 dáng vung vũ khí 3D mới: `overhead_slam` (Đại kiếm/Búa), `halberd_sweep` (Kích/Lưỡi hái), `iaido_draw` (Katana rút kiếm tốc độ), `dual_cross_slash` (Song đao/Vuốt chữ X), `chakram_throw` (Phi luân boomerang), `orb_levitate` (Cầu Hư Không/Tinh Vân lơ lửng), `staff_whirl` (Xoay trượng phượng hoàng), và `recoil_barrage` (Giật nòng pháo hạng nặng) — nối đồng bộ vào đòn đánh thường vũ khí đặc biệt và chiêu `[E]` riêng từng vũ khí.
- **File chính đã sửa / thêm:** `src/data/cutscenes.ts` (mới), `src/ui/HomeScreen.ts` (mới), `src/ui/CutsceneModal.ts` (mới), `src/ui/pixelLogo.ts` (mới), `src/graphics/pixelfxHeroModels.ts`, `src/systems/combat.ts`, `src/data/classes.ts`, `src/data/types.ts`, `src/world/entities.ts`, `src/game.ts`, `src/main.ts`, `src/ui/ClassSelect.ts`, `src/ui/HUD.ts`, `src/ui/DialogueModal.ts`, `src/ui/QuestJournalModal.ts`, `index.html`, `style.css`, `tests/featureTests.ts`.
- **Kiểm tra (Verified):**
  - `npm run build` (`tsc --noEmit && vite build`): **0 lỗi TS**, build thành công trong `3.67s`.
  - Bộ test tự động (`tests/featureTests.ts`): **18/18 suites PASS** (thêm Suite 17 kiểm tra Home Screen Naming, Save v3, 6 Story Cutscenes + `PIXELFX_MODS`, Knight `overhead_slam`, và cả 8 hoạt ảnh vũ khí mới).
  - Kiểm thử trực quan trên Chrome thật (Playwright `1280×720`): chụp & kiểm duyệt ảnh màn Home Screen, Class Select (vừa khít 1 màn hình không cuộn), Phim Cốt Truyện mở đầu & Boss Gilded Null, Tab Phim Cốt Truyện `[J]`, HUD `Quang Khải` & đòn Hold Slam vàng rực của Prism Knight — **0 console/page errors**.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không có breaking change với Save cũ (Save không có `player.name` hoặc `seenCutscenes` tự động fallback về `"Chroma-Walker"` & `["scene_intro"]`).
- **Gợi ý bước tiếp theo (Next Steps):** Nếu muốn tạo bản Preview kèm ảnh chụp vào `preview for devs/` và commit/push toàn bộ cụm `v3.1 + v3.2` lên GitHub `origin/main`, chỉ cần yêu cầu AI xuất preview & push.

### [2026-11-26 10:40] — Antigravity — Gộp toàn bộ Popup Info vào cột `INFO` cố định bên phải trong Túi đồ
- **Commit / Branch:** `main` (tiếp nối `5228950`)
- **Giai đoạn / Version:** `PIXTEL v3.1.1+` — Fixed Right-Column `INFO` Panel Consolidation
- **Đã làm (Done):**
  - Tắt popup nổi `#item-review-tooltip` khi hover/touch các ô bên trong `#modal-inventory` (`src/ui/ItemReviewTooltip.ts`) để không còn che lưới túi đồ `BAG`, trong khi vẫn giữ nguyên tooltip nổi cho Shop, Lò Rèn, Rương Cá Nhân, Nhiệm Vụ và thanh Hotbar HUD (đồng bộ thêm `pixtel/cursed-aura` cho tooltip đồ `cursed`).
  - Gộp đầy đủ toàn bộ dữ liệu từ `ItemReviewTooltip` sang cột `INFO` cố định bên phải trong `src/ui/InventoryModal.ts` & `style.css`:
    - Dòng phụ đầy đủ `Tier · Biome · Loại`, khóa bảo vệ Cổ Vật Ẩn chưa mở khóa.
    - Bảng chỉ số 1 cột căn thẳng hàng giá trị & chênh lệch `(+X ▲)` / `(-X ▼)` (thêm `PHÁ GIÁP`, `GIẢM CD [E]`).
    - Nhóm tag & pill hiệu lực chi tiết cho Tiêu Thụ (`Phím nhanh`, `Trong túi`, `✦ Hồi HP / Tàng hình / Tốc chạy...`) và Nguyên Liệu / Chìa Gacha `[G]`.
    - Ghi chú `+5` Khảm Sắc Tố, `+10` Thức Tỉnh Prism, Nguồn Độc Lạ/Gacha/Ẩn, mô tả Paper-Doll và thanh chân `Phân rã +LK / Đang giữ · Mua / Bán Gold`.
- **File chính đã sửa / thêm:** `src/ui/ItemReviewTooltip.ts`, `src/ui/InventoryModal.ts`, `style.css`, `preview for devs/2026-11-26-v3.1.1-pixelfx-hd-graphics-overhaul.md`, `preview for devs/assets/v311_inventory_ornate.png`, `preview for devs/assets/v311_inventory_info_merged.png`, `DEV_LOG.md`
- **Kiểm tra (Verified):** `npm.cmd run build` exit `0`, `tests/featureTests.ts` **17/17** PASS, kiểm duyệt hover trực tiếp trong Chrome (`1280×800`, 0 console errors): `#item-review-tooltip` ẩn hoàn toàn khi rê qua `Lọ Sương Mù Ảo Ảnh` và `Thánh Kiếm Sao Rơi +7`, toàn bộ dữ liệu hiển thị gọn trong cột `INFO`.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không có.
- **Gợi ý bước tiếp theo (Next Steps):** Pull `origin/main` và mở Túi đồ `[I]` để trải nghiệm bảng `INFO` hợp nhất.

### [2026-11-26 10:33] — Antigravity — Trùng tu đồ họa HD 48×48, 5 hiệu ứng `pixelfx` dual-buffer mới & UI Túi đồ 16-bit chuẩn Mockup
- **Commit / Branch:** `main` (tiếp nối `50f6d4f`)
- **Giai đoạn / Version:** `PIXTEL v3.1.1` — Graphics Overhaul (`core16-items` HD + `pixelfx` VFX + Ornate 16-Bit UI + `?demo=v31` Showcase)
- **Đã làm (Done):**
  - **Trích xuất Sprite HD `48×48` (`scripts/extract_core16_sprites.py`, `src/assets/core16-items.png` & `.json`, `src/graphics/codixelAtlas.ts`):**
    - Trích xuất trực tiếp 16 Vật phẩm Cốt lõi từ Spritesheet 4×4 gốc bằng BFS flood-fill tách nền indigo có chọn lọc (bảo toàn 100% viền `#1a1625`, cán búa và hốc tối `hm_moss_hood`) kèm 6 icon nguyên liệu `48×48` đồng bộ (tổng 22 frames `288×192`), ưu tiên render HD trong `drawCodixelIcon`.
    - Sửa script xuất poster `preview for devs/assets/v31_core16_items_sheet.png` dùng font hệ thống `Tahoma` để hiển thị trọn vẹn tiếng Việt có dấu.
  - **5 Hiệu ứng `pixelfx` Dual-Buffer Mới (từ skill `patch-gg/pixelfx` tại `.agents/skills/pixelfx/`):**
    - Sáng tác, render contact sheet & kiểm duyệt: `pixtel/set-aura.js` (3 chủ đề `forest` / `forge` / `eclipse`), `pixtel/cursed-aura.js`, `pixtel/eclipse-reap.js`, `pixtel/ember-nova.js`, `pixtel/bleed-slash.js` (`check.mjs` **5/5 PASS, 0 lỗi, 0 cảnh báo**).
    - Nối vào `src/vfx/vfxManager.ts`, `src/vfx/uiRarityFx.ts` (bỏ giới hạn 24px để render nét `44px`/`64px` kèm `cursed-aura`), `src/systems/ItemEffectSystem.ts`, `src/graphics/itemIcons.ts` & `src/graphics/pixelfxHeroModels.ts` (thay hình vuông phẳng bằng Set Aura dual-buffer thật + map model 3D riêng cho từng món Core-16).
  - **Đại tu UI Túi đồ 3 Cột 16-Bit (`index.html`, `src/ui/InventoryModal.ts`, `style.css`):**
    - Nâng cấp ruy-băng đuôi én `EQUIP / BAG / INFO`, khung viền đôi bo góc chạm khắc `❖`, sân khấu Paper-Doll `144×168` có spotlight & bệ đá, ô túi đồ `60×60` với icon HD `44×44` + hào quang `pixelfx`, khung `INFO` `72×72` cùng **biển hiệu vàng `✦ PASSIVE`** và **biển hiệu huyết dụ `☠ CURSE`**.
  - **Chế độ Showcase không ghi đè Save (`src/game.ts`, `src/main.ts`):**
    - Thêm `?demo=v31&open=inventory|forge` (`startV31DemoShowcase`, `demoMode = true`) giúp thành viên & QA kiểm tra nhanh đủ 16 vật phẩm, 3/3 Set Aura và Lò rèn Ẩn chỉ bằng 1 đường link.
- **File chính đã sửa / thêm:** `scripts/extract_core16_sprites.py`, `src/assets/core16-items.png`, `src/assets/core16-items.json`, `src/graphics/codixelAtlas.ts`, `src/vfx/pixelfx/fx/pixtel/set-aura.js`, `src/vfx/pixelfx/fx/pixtel/cursed-aura.js`, `src/vfx/pixelfx/fx/pixtel/eclipse-reap.js`, `src/vfx/pixelfx/fx/pixtel/ember-nova.js`, `src/vfx/pixelfx/fx/pixtel/bleed-slash.js`, `src/vfx/vfxManager.ts`, `src/vfx/uiRarityFx.ts`, `src/systems/ItemEffectSystem.ts`, `src/data/items.ts`, `src/graphics/pixelfxHeroModels.ts`, `src/graphics/itemIcons.ts`, `src/ui/InventoryModal.ts`, `index.html`, `style.css`, `src/game.ts`, `src/main.ts`, `preview for devs/2026-11-26-v3.1.1-pixelfx-hd-graphics-overhaul.md`, `preview for devs/assets/*`, `preview for devs/README.md`, `DEV_LOG.md`
- **Kiểm tra (Verified):** `check.mjs` (`5/5` PASS, `0` warnings), `npm.cmd run build` exit `0`, `tests/featureTests.ts` (**17/17** suites PASS), kiểm duyệt trực quan 6 ảnh PNG (`v31_core16_items_sheet`, `v31_pixelfx_showcase`, `v311_inventory_ornate`, `v311_inventory_cursed`, `v311_forge_fate_die`, `v311_forge_hidden`) qua Chrome & `read_file` (`0` console errors).
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Không có (tương thích 100% Save cũ).
- **Gợi ý bước tiếp theo (Next Steps):** Mở [preview for devs/2026-11-26-v3.1.1-pixelfx-hd-graphics-overhaul.md](preview%20for%20devs/2026-11-26-v3.1.1-pixelfx-hd-graphics-overhaul.md) trên GitHub hoặc chạy `npm run dev` và truy cập `/?demo=v31` để trải nghiệm ngay.

### [2026-11-26 09:32] — Antigravity — Hệ thống 16 Vật phẩm cốt lõi, Nội tại (`ItemEffectSystem`), 3 Set Bonus `(x/3)`, Lò rèn Ẩn & UI Túi đồ 3 cột 16-bit
- **Commit / Branch:** `main` (tiếp nối `6a12963`)
- **Giai đoạn / Version:** `PIXTEL v3.1` — Core 16 Items, Event-Driven Passives, 3-Piece Set Auras, Hidden Forge, 3-Column 16-Bit Inventory UI & `preview for devs` Report
- **Đã làm (Done):**
  - **Tách biệt Data & Type (`src/types/item.ts`, `src/data/types.ts`, `src/data/sets.ts`, `src/data/items.ts`):**
    - Tạo `src/types/item.ts` định nghĩa `ItemSlot`, `ItemRarity` (thêm phẩm chất `cursed: #f43f5e`), `ItemStats` (`mag`, `aspdPct`, `moveSpeedPct`, `critDmgPct`, `lifestealPct`, `fireResPct`), `ItemPassive` (`onHit`, `onCrit`, `onTakeDamage`, `onKill`, `onLowHp`, `onDash`, `onUse`, `passive`), `ForgeRecipe`, `SetBonusDefinition`.
    - Bổ sung đủ **16 vật phẩm cốt lõi** (`CORE_16_ITEMS`: 6 Vũ khí, 6 Mũ/Giáp, 2 Trang sức, 2 Tiêu hao kèm lore tiếng Việt) + **6 nguyên liệu Boss/Zone** (`CORE_MATERIALS`: `mat_ancient_sap`, `mat_elder_core`, `mat_blood_shard`, `mat_eclipse_coal`, `mat_meteor_shard`, `mat_eclipse_heart`).
    - Vẽ bổ sung **22 icon pixel 24×24** viền tối `#1a1625` theo đúng lưới 4×4 Ảnh 1 vào `scripts/generate_codixel_assets.mjs` -> `src/assets/codixel-icons.png` & `.json` (`165` icon).
    - Tạo `src/data/sets.ts` với **3 Bộ Trang Bị 3 món** (`set_forest`, `set_forge`, `set_eclipse`) có mốc kích hoạt `(2/3)` & `(3/3)` kèm hào quang Layer 0 (`Aura -> Cloak -> Body -> Armor -> Helmet -> Weapon`).
  - **Lò Rèn Ẩn, Đổi Mệnh & Tỉ lệ Boss (`src/data/recipes.ts`, `src/data/hiddenItems.ts`, `src/data/lootTables.ts`, `src/systems/forgeSystem.ts`):**
    - Thêm 2 công thức ẩn (`isHidden: true`) hoàn toàn không lộ trước khi mở khóa: `rec_wp_starfall_blade` (*Thánh Kiếm Sao Rơi*, mở khi mang `wp_vanguard_chipped` hạ Boss Vùng 2 `boss_blight_root`) và `rec_ar_aegis_mantle` (*Chiến Giáp Vệ Binh Bất Diệt*, mở khi sở hữu đồng thời `ar_bloodstone_plate` và `ar_briar_cloak`).
    - Thêm cơ chế `rerollSubstatsWithFateDie()` cho `cs_fate_die` tại Lò Rèn và drop `hm_eclipse_crown` tỉ lệ 5% từ World Boss `boss_the_eraser`.
  - **Hệ thống Nội tại Event-Driven (`src/systems/ItemEffectSystem.ts`, `src/systems/combat.ts`, `src/systems/inventorySystem.ts`, `src/game.ts`):**
    - Quản lý cooldown, stack chảy máu `bleed_crit`, sét nảy `chain_lightning`, chém bán nguyệt + hút máu `eclipse_lifesteal`, đập choáng `quake_stun`, sao rơi `starfall_crit` (CD 6s), phản sát thương & đứng yên hồi máu `thorns_regen`, khiên cộng dồn `blood_shield`, giảm tầm aggro `stealth_range`, miễn nhiễm thiêu đốt `burn_immune`, làm chậm HP thấp `eclipse_slow` (CD 25s), nổ khiên `ember_nova` (CD 30s), chặn đòn tử vong `undying_wall` (CD 45s), lời nguyền `pact_drain`, tàng hình cắt aggro `cs_mirage_vial` và bảo vệ đồ `cursed` khỏi Auto-Sell.
  - **UI Túi đồ 3 Cột 16-bit (`index.html`, `src/ui/InventoryModal.ts`, `src/ui/ItemReviewTooltip.ts`, `src/ui/ForgeModal.ts`, `style.css`):**
    - Cột trái `EQUIP` (Paper-doll Z-order đủ lớp + 5 ô trang bị + 2 ô tiêu hao nhanh), Cột giữa `BAG` (lưới 4×4 viền màu theo 6 độ hiếm kèm `cursed` nhấp nháy `#f43f5e`), Cột phải `INFO` (Icon + tên theo màu độ hiếm, so sánh chỉ số xanh/đỏ, khối Passive vàng cam kèm CD, Set Bonus `(x/3)`, vạch pixel và Lore chữ nghiêng `#cbd5e1`).
- **File chính đã sửa / thêm:** `src/types/item.ts`, `src/data/sets.ts`, `src/systems/ItemEffectSystem.ts`, `src/data/types.ts`, `src/data/items.ts`, `src/data/equipments.ts`, `src/data/recipes.ts`, `src/data/hiddenItems.ts`, `src/data/lootTables.ts`, `src/world/entities.ts`, `src/systems/inventorySystem.ts`, `src/systems/forgeSystem.ts`, `src/systems/combat.ts`, `src/game.ts`, `src/graphics/pixelfxHeroModels.ts`, `src/graphics/paperDoll.ts`, `src/graphics/itemIcons.ts`, `src/vfx/uiRarityFx.ts`, `src/audio/chiptuneSynth.ts`, `src/ui/InventoryModal.ts`, `src/ui/ItemReviewTooltip.ts`, `src/ui/ForgeModal.ts`, `src/ui/GachaModal.ts`, `scripts/generate_codixel_assets.mjs`, `src/assets/codixel-icons.png`, `src/assets/codixel-icons.json`, `index.html`, `style.css`, `tests/featureTests.ts`, `preview for devs/2026-11-26-v3.1-core16-items-inventory-ui-preview.md`, `preview for devs/assets/v31_*.png`, `preview for devs/README.md`, `DEV_LOG.md`
- **Kiểm tra (Verified):** `node scripts/generate_codixel_assets.mjs` (`165` icons), `npm.cmd run build` (`tsc --noEmit && vite build`) exit `0`, toàn bộ **17/17** feature test suites (`tests/featureTests.ts`) PASS; kiểm duyệt trực quan 3 ảnh PNG (`v31_core16_items_sheet.png`, `v31_inventory_3col_ui.png`, `v31_forge_fate_hidden.png`) & xuất bản vào `preview for devs/`.
- **Lưu ý / Handoff (Breaking changes / Đang dở):** Tương thích ngược hoàn toàn với Save cũ (`unlockedHiddenRecipes` tùy chọn).
- **Gợi ý bước tiếp theo (Next Steps):** Các thành viên xem báo cáo trực quan trong [preview for devs/](preview%20for%20devs/README.md) trên GitHub và pull `origin/main` để tiếp tục phát triển.

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
