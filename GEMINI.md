<!-- BRAIN:START — managed by project-brain, do not edit this block -->
## Project Brain — Graph Memory

**All commands:** `python .agents/skills/project-brain/scripts/brain.py <command>`

1. **At the start of every session:** run `sync`, then read `.brain/INDEX.md` once and only files listed as stale/new. This is automatic because Project Brain is initialized for the project; do not ask the user to invoke the skill again.
2. **Find task context:** run `query "<keywords>" --depth 0 --budget 2000` before opening files. `--depth 0` adapts graph depth; `--budget 2000` caps estimated context.
3. **After every file create/edit/delete:** run `touch <path> --summary "<1-2 sentences>" --link <node_id>[:edge_type]`.
4. **After every design decision, bug, or change of direction:** run `note --type decision|bug|thought|task --title "..." --summary "..." --link <node_id>[:edge_type]`. A decision replacing an older one must include `--link <old_decision_id>:supersedes`.
5. **End of session:** run `lint`, fix reported issues, then `digest`.
6. **Never** hand-edit `.brain/nodes.jsonl` or `.brain/edges.jsonl`.
<!-- BRAIN:END -->

<!-- DEV_LOG_RULE:START -->
## Team Vibe-Code Rule — Bắt buộc đọc & ghi `DEV_LOG.md`

Quy tắc bắt buộc cho tất cả thành viên và mọi AI coding assistant làm việc trên repository **PixTel**:

1. **Đọc log trước khi bắt đầu code:**
   - Trước khi chỉnh sửa code hoặc lập kế hoạch tính năng mới, **bắt buộc** đọc [DEV_LOG.md](DEV_LOG.md) (mục **Trạng Thái Hiện Tại** và ít nhất **3–5 bản ghi mới nhất** trong **Nhật Ký Cập Nhật**).
   - Mục đích: nắm chính xác dự án đang ở giai đoạn nào, hệ thống nào vừa được người khác thay đổi, có lưu ý/breaking change nào cần tránh trùng lặp hoặc xung đột.
2. **Ghi log ngay sau khi hoàn thành cập nhật:**
   - Sau **mỗi lần** thêm tính năng, sửa bug, refactor, hoặc cập nhật tài liệu/cấu hình đáng kể, **bắt buộc** tự động thêm **1 bản ghi mới** lên **đầu** mục `## Nhật Ký Cập Nhật` trong `DEV_LOG.md` theo đúng **Template Chuẩn** có sẵn trong file đó (không đợi người dùng nhắc).
   - Mỗi bản ghi phải nêu rõ: thời gian, tên người làm / AI, Commit/Branch, Giai đoạn/Version, những gì **Đã làm**, **File chính đã sửa/thêm**, kết quả **Kiểm tra**, **Lưu ý / Handoff** (nếu có phần đang dở hoặc ảnh hưởng module khác), và **Gợi ý bước tiếp theo**.
   - Nếu thay đổi làm chuyển giai đoạn hoặc bổ sung hệ thống lớn, cập nhật luôn mục `## Trạng Thái Hiện Tại` ở đầu `DEV_LOG.md`.
3. **Bảo toàn lịch sử & Commit cùng code:**
   - **Không xóa hoặc ghi đè** các bản ghi log cũ (chỉ chèn bản ghi mới lên trên cùng — newest-first).
   - Khi commit/push thay đổi lên git, luôn commit kèm `DEV_LOG.md`.
<!-- DEV_LOG_RULE:END -->

<!-- PREVIEW_FOR_DEVS_RULE:START -->
## Team Preview Rule — Tự động lưu, commit & push mọi bản Preview vào `preview for devs/`

Quy tắc bắt buộc được ghi nhớ lâu dài cho mọi AI coding assistant làm việc trên repository **PixTel**:

1. **Mỗi khi người dùng yêu cầu tạo bản preview** (giao diện UI/UX, vật phẩm, quái/boss, tính năng mới, visual report...):
   - Ngoài artifact xem nhanh (nếu có), **bắt buộc** lưu bản preview dạng Markdown chuẩn GitHub vào thư mục **`preview for devs/`** theo tên `YYYY-MM-DD-<ten-preview>.md`.
   - Lưu toàn bộ ảnh PNG/GIF đã kiểm duyệt trực quan vào **`preview for devs/assets/`** và nhúng bằng **đường dẫn tương đối** (`./assets/<file>.png`) để hiển thị trực tiếp đẹp mắt trên GitHub web (tránh cú pháp riêng không được GitHub hỗ trợ như `carousel`).
   - Cập nhật bảng mục lục **newest-first** trong **`preview for devs/README.md`**.
2. **Tự động Commit & Push lên GitHub:**
   - Ngay sau khi tạo/cập nhật bản preview trong `preview for devs/`, **tự động** cập nhật `DEV_LOG.md` + đồng bộ Project Brain, sau đó **`git add`, `git commit`, và `git push origin main`** thư mục `preview for devs/` (cùng `DEV_LOG.md` & `.brain/`) lên GitHub (không cần đợi người dùng nhắc lại) để các dev khác nắm được tình hình trực tiếp trên repo.
<!-- PREVIEW_FOR_DEVS_RULE:END -->
