# Claude Code Instructions — PIXTEL

Vui lòng đọc và tuân thủ đầy đủ các quy tắc trong [AGENTS.md](AGENTS.md) (bao gồm Project Brain tại `.brain/` và quy tắc cập nhật log).

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
