# PIXTEL — Preview For Devs

Thư mục lưu trữ toàn bộ **bản Preview trực quan** (ảnh chụp thực tế trong game, bảng tổng hợp vật phẩm/sprite, giao diện UI/UX mới) để các thành viên trong team dễ dàng theo dõi tình hình phát triển trực tiếp trên GitHub mà không cần pull code và tự chạy máy.

> **Quy ước cho Team & AI (`PREVIEW_FOR_DEVS_RULE`):**
> - Mọi bản preview mới đều được đặt tại `preview for devs/YYYY-MM-DD-<slug>.md`, ảnh đặt tại `preview for devs/assets/` dùng đường dẫn tương đối `./assets/...` để GitHub hiển thị trực tiếp.
> - Luôn thêm dòng mới lên **đầu bảng** bên dưới (mới nhất ở trên cùng), cập nhật `DEV_LOG.md` và tự động **commit + push** lên `origin/main`.

## Danh Sách Bản Preview (Newest First)

| Ngày | Phiên bản | Bản Preview | Nội dung chính |
|---|---|---|---|
| `2026-11-26` | `PIXTEL v3.2.6` | [Đại Tu HUD `0 px²` Chồng Chéo, Tương Phản 16-Bit, `[F11]`/`[V]`, Lọc Tên & FTUE](2026-11-26-v3.2.6-hud-ux-ftue-qa-overhaul-preview.md) | QA Playtester ↔ Dev Teamwork: tách cột trái `.hud-left-stack` + toast mảnh tối đa 2 dòng (`0 px²` che trung tâm), nâng tương phản `Bia Ký 0/8` & `✊ TAY KHÔNG`, sửa sạch `LMB...`/`SPACE`/`0 CHÌA`/`CẦN VK`, gom Toolbar 2 hàng chuẩn, thêm `⛶ F11` + `👁 HUD [V]`, lọc sạch tên xấu (`"Lữ Khách"`), và đặt Vũ Khí Khởi Đầu vào `STARTER STASH [F]` |
| `2026-11-26` | `PIXTEL v3.2` | [Màn Hình Trang Chủ, 16 Cảnh Cốt Truyện, Preview Skill `[Q]` & Hoạt Ảnh Vũ Khí Mới](2026-11-26-v3.2-home-16scene-story-class-skills-preview.md) | Trang Chủ đặt tên → Chọn Class → Bắt Đầu; chuẩn hóa thẻ Class (chỉ Đánh thường / Giữ / Skill `[Q]`) có nhân vật 3D diễn hoạt `[Q]` 60FPS; 6 phim cốt truyện (16 cảnh mở đầu sử thi + rạp chiếu `[J]`); sửa Hold Charge vàng Paladin cho Knight, nâng cấp `[Q]` Phân Thân Ảo Ảnh Bit Rogue, 8 hoạt ảnh vũ khí mới & sửa hình nhân giả trên The Eraser |
| `2026-11-26` | `PIXTEL v3.1.1` | [Trùng Tu Đồ Họa HD 48×48, Dual-Buffer `pixelfx` VFX & UI 16-Bit Chuẩn Mockup](2026-11-26-v3.1.1-pixelfx-hd-graphics-overhaul.md) | 22 sprite HD 48×48 trích xuất sắc nét, 5 hiệu ứng `pixelfx` dual-buffer mới (`set-aura`, `cursed-aura`, `eclipse-reap`, `ember-nova`, `bleed-slash`), UI Túi đồ 3 cột chuẩn Mockup (ruy-băng đuôi én + biển hiệu `✦ PASSIVE` / `☠ CURSE`), & chế độ `?demo=v31` |
| `2026-11-26` | `PIXTEL v3.1` | [16 Vật Phẩm Cốt Lõi, Passive, 3 Set Bonus `(x/3)`, Lò Rèn Ẩn & UI 3 Cột 16-Bit](2026-11-26-v3.1-core16-items-inventory-ui-preview.md) | 16 vật phẩm cốt lõi (`cursed` + 6 nguyên liệu), `ItemEffectSystem` event-driven, 3 Set 3 món kèm hào quang Z-order, 2 công thức Lò rèn Ẩn, Xúc Xắc Đổi Mệnh & UI Túi đồ `EQUIP` · `BAG` · `INFO` |
| `2026-11-26` | `PIXTEL v3.0+` | [Bảng 33 Vật Phẩm & Nâng Cấp Mới](2026-11-26-v3.0-new-items-preview.md) | 8 Vũ Khí Độc Lạ (`[E]` riêng), 8 Mũ/Giáp/Giày/Phụ Kiện Độc Lạ (Drop-Only), 8 Đồ Mùa Gacha, 4 Chìa Biome, 4 Cấp Balo (`40 → 80` ô) & Rương Cá Nhân (`80` ô) |
| `2026-11-26` | `PIXTEL v3.0+` | [Preview Gameplay, UI/UX, Gacha, Auto-Bán, Balo & Rương Spawn](2026-11-26-v3.0-gameplay-ui-preview.md) | Quảng trường Spawn (`STASH CHEST` + `GACHA ALTAR`), Thanh kỹ năng vũ khí động `[E]`, Auto-Bán phẩm thấp, Quầy Balo Mira, Rương Cá Nhân 80 ô, Sân khấu Gacha ×5, Quái HD 306 frame & Font số `PixTel Digits` sắc nét |
| `2026-11-26` | `PIXTEL v2.7+` | [Thư Viện 97 Vật Phẩm Cơ Bản, 11 Cổ Vật Ẩn & Model 3D](2026-11-26-v2.7-all-97-base-items-preview.md) | Toàn bộ 11 Cổ Vật Ẩn, 24 Vũ Khí khóa Class, 30 Giáp/Phụ Kiện, 32 Dược Phẩm/Sắc Tố/Nguyên Liệu & 4 bộ Model 3D `pixelfx` |
