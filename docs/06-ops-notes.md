# 06 - Ghi chú vận hành (Ops Notes)

Tài liệu ghi chú ngắn gọn phục vụ triển khai và vận hành ở mức học tập. Tập trung vào cấu hình cơ bản, seed dữ liệu, dọn rác, và giám sát đơn giản.

---

## 1) Cấu hình môi trường

- ENV cơ bản:

  - MONGODB_URI: kết nối MongoDB cục bộ hoặc Atlas.
  - PORT: cổng server.
  - TURN (tùy chọn): TURN_URL, TURN_USER, TURN_PASS nếu triển khai xuyên NAT phức tạp.
  - CORS_ORIGIN: origin của client (ví dụ: http://localhost:3000), hoặc "\*" cho học tập.
  - GRACE_PERIOD_MS: thời gian chờ reconnect (mặc định 5000ms).

- ICE servers (client):
  - STUN mặc định: `stun:stun.l.google.com:19302`.
  - TURN chỉ bật khi cần.

---

## 2) Seed dữ liệu (tùy chọn)

- Tạo một vài Room mẫu với `maxParticipants=6`.
- Tạo một vài User mẫu (guest/local) để thử nhanh.
- Không cần seed Message/Event cho sạch môi trường test.

---

## 3) TTL và dọn rác (tùy chọn)

- Nếu cần tiết kiệm dung lượng:

  - Đặt TTL cho Event/Message cũ hơn N ngày.
  - Xóa Session đã có leftAt từ lâu (giữ lịch sử đủ dùng trước khi TTL).

- Dọn phòng trống:
  - Xóa Room có memberCount=0 và không có tin nhắn trong 24h.
  - Chạy tác vụ dọn rác theo lịch (cron) nếu cần.

---

## 4) Sao lưu (không bắt buộc)

- Mức học tập có thể bỏ qua backup.
- Nếu cần: dùng mongodump/mongorestore định kỳ.

---

## 5) Giám sát đơn giản

- Log server: theo dõi join/leave/error.
- Chỉ số quan trọng:
  - Số Session active theo phòng.
  - Tần suất message:new và event:media.
  - Tỉ lệ lỗi room-error (ROOM_FULL/ROOM_LOCKED).

---

## 6) Quy trình sự cố cơ bản

- Không join được phòng: kiểm tra ROOM_FULL/ROOM_LOCKED, server logs.
- Không kết nối media giữa một số client: cân nhắc bật TURN; kiểm tra ICE candidate flow.
- Mất đồng bộ memberCount: kiểm tra logic tăng/giảm khi disconnect; chạy script đồng bộ lại dựa trên Session.active.
- CORS error: kiểm tra CORS_ORIGIN trong env và cấu hình Socket.io cors.

---

## 7) Gợi ý mở rộng sau này

- Thêm cơ chế “grace period” khi disconnect để hỗ trợ reconnect nhanh.
- Thêm thống kê theo ngày (số giờ hội thoại, số tin nhắn).
- Tích hợp xác thực đơn giản (JWT) nếu cần phân quyền host.
