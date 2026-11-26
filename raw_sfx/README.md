# `raw_sfx/` — Thư Mục Nguồn Âm Thanh Thô (Retro 16-Bit JRPG SFX)

Đặt các file âm thanh nguồn (`.wav`, `.ogg`, `.mp3`) miễn phí bản quyền (**CC0 / Public Domain**) vào thư mục này, sau đó chạy:

```bash
python3 scripts/convert_sfx.py
```

Script sẽ tự động:
1. Chuẩn hóa âm lượng đỉnh về **`-3.0 dBFS`**, hạ tần số lấy mẫu về **`22050 Hz`**, gộp kênh **`Mono` (`1 ch`)** chuẩn chất âm 16-bit SNES/Genesis và sẵn sàng cho định vị không gian 2D (`StereoPannerNode`).
2. Xuất song song 2 định dạng nhẹ **`64 kbps`** sang `public/sfx/`:
   - `public/sfx/<id>.ogg` (tối ưu cho Chrome, Android, Edge, Firefox)
   - `public/sfx/<id>.mp3` (tối ưu cho Safari, iOS / iPadOS PWA)
3. Cập nhật `public/sfx/manifest.json` để bộ nạp Hybrid (`src/audio/chiptuneSynth.ts`) và Service Worker (`public/sw.js`) cache offline.

> **Lưu ý:** Nếu thư mục `raw_sfx/` trống hoặc thiếu clip cốt lõi, bạn có thể chạy `python3 scripts/convert_sfx.py --seed-cc0` để tự động tổng hợp 16 file `.wav` PCM 16-bit gốc hoàn toàn sạch bản quyền (CC0).

## Danh Sách Mã Clip Hybrid Mặc Định (`16` clips)

| Mã Clip (`slug`) | Ngữ Cảnh Sử Dụng Trong Game |
| --- | --- |
| `step_town` | Bước chân trên đường gạch / Thị Trấn Khởi Nguyên |
| `step_meadow` | Bước chân trên cỏ & lá tại Đồng Cỏ Xám |
| `step_quartz` | Bước chân giẫm tinh thể tại Rừng Thạch Anh |
| `step_amber` | Bước chân sỏi đá hầm lò tại Hầm Mỏ Hổ Phách |
| `step_ruins` | Bước chân vang đá cổ tại Phế Tích Vô Sắc |
| `step_water` | Bước chân lội suối / mép nước nông |
| `boss_roar_warden` | Tiếng gầm khai chiến / chuyển Phase của **Xing Warden** |
| `boss_roar_blight` | Tiếng gầm khai chiến / chuyển Phase của **Blight Prism** |
| `boss_roar_gilded` | Tiếng gầm khai chiến / chuyển Phase của **Gilded Null** |
| `boss_roar_eraser` | Tiếng gầm nhiễu sóng chuyển Phase 2/3 của **The Eraser** |
| `chest_open` | Mở Rương Boss & Rương Cá Nhân (`[F]`) |
| `waypoint_chime` | Thắp sáng & cộng hưởng Trụ Sắc Màu (`Chroma Waypoint`) |
| `mine_hit` | Đập mỏ tinh thể / quặng nguyên liệu |
| `mine_break` | Vỡ mỏ khoáng sản văng nguyên liệu |
| `forge_anvil` | Tiếng búa đập Đe Lăng Kính tại lò rèn Kael |
| `coop_ping` | Tín hiệu tập hợp đồng đội Co-op (`Ping Beacon`) |

## Nguồn Tải SFX 16-Bit Miễn Phí Tham Khảo (CC0 / Free)
- **Chiến đấu, Phép & UI 16-bit**: *NSFRL's Retro Magic, Combat, and Menu SFX* hoặc *JDWasabi 8-bit/16-bit Sound Effects Pack* (`https://itch.io/game-assets/free/genre-rpg/tag-sound-effects`)
- **Giọng nói & Hội thoại NPC**: *Dialogue SFX - Scribble Scrabble* hoặc *RPG Voice Pack - N0sSyndrome* (itch.io)
- **Bước chân & Môi trường**: *50 RPG Sound Effects - Kenney (CC0)* (`https://opengameart.org/content/50-rpg-sound-effects`) hoặc *Cozy Footsteps* (`https://itch.io/game-assets/tag-footsteps/tag-sound-effects`)
