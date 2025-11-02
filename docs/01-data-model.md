# 01 - Mô hình dữ liệu (MongoDB/Mongoose) cho phòng video chat 5–6 người

Mục tiêu: Thiết kế mô hình dữ liệu “phi chuẩn hóa có kiểm soát” (denormalized) dựa trên nguyên lý 3NF, nhằm giữ cấu trúc rõ ràng, hạn chế dư thừa quá mức nhưng vẫn tối ưu trải nghiệm đọc/ghi cho quy mô học tập.

---

## 1) Phạm vi và mục tiêu
- Quy mô: Phòng 5–6 người, số phòng đồng thời thấp.
- Tính năng cốt lõi:
  - Quản lý người dùng (user) đơn giản, cho phép guest.
  - Tạo/join/leave phòng (room) theo roomId.
  - Lưu tin nhắn (message) và sự kiện (event) trong phòng.
  - Theo dõi phiên tham gia (session) để biết ai đang online.
  - Tùy chọn lưu trạng thái media và thông tin thiết bị.

---

## 2) Triết lý thiết kế
- Bám 3NF để tách các thực thể chính: User, Room, Session, Message, Event.
- Cho phép **denormalize nhẹ** vào các bản ghi thường được đọc:
  - Lưu snapshot `userSnapshot` (displayName, avatarUrl) bên trong Message và Event.
  - Cache `memberCount`, `lastMessageAt` trong Room để liệt kê/phân loại nhanh.
- Không làm phức tạp bằng join nhiều collection trong luồng đọc phổ biến.

---

## 3) Thực thể chính và mô tả

### 3.1 User
- Đại diện cho người dùng (đăng nhập hoặc khách).
- Lưu thông tin nhận dạng cơ bản, không chứa lịch sử chat trực tiếp.
- Trường chính (mô tả):
  - provider, email (tùy), displayName, avatarUrl, timestamps.
- Chỉ mục gợi ý: unique cho email (nếu dùng), text cho displayName (tùy chọn).

### 3.2 Room
- Đại diện cho phòng chat video.
- Quản lý sức chứa và thông tin hiển thị cơ bản.
- Trường chính (mô tả):
  - roomId (unique), title (tùy), maxParticipants (mặc định 6), isLocked (tùy), createdBy.
  - memberCount (cache), lastMessageAt (cache), timestamps.
- Chỉ mục gợi ý: unique(roomId), sort(lastMessageAt).

### 3.3 Session
- Mỗi lần người dùng tham gia phòng sẽ tạo một Session.
- Dùng để theo dõi online/offline, vai trò, trạng thái media.
- Trường chính (mô tả):
  - roomRef, userRef, socketId, role, joinedAt, leftAt.
  - userSnapshot { displayName, avatarUrl } (denormalize nhẹ).
  - mediaState { audio, video, screen }, deviceInfo (tùy chọn).
- Chỉ mục gợi ý: roomRef + leftAt (lấy người đang online), userRef + createdAt.

### 3.4 Message
- Tin nhắn văn bản trong phòng.
- Lưu kèm thông tin userSnapshot để hiển thị nhanh.
- Trường chính (mô tả):
  - roomRef, sessionRef, userRef, type (text/system), content, userSnapshot, createdAt.
- Chỉ mục gợi ý: roomRef + createdAt (phân trang theo thời gian), sessionRef.

### 3.5 Event
- Ghi nhận sự kiện liên quan đến phiên: join, leave, mute, unmute, video on/off, screen on/off.
- Dùng cho audit/debug và thống kê đơn giản.
- Trường chính (mô tả):
  - roomRef, sessionRef, userRef, eventType, metadata, userSnapshot, createdAt.
- Chỉ mục gợi ý: roomRef + createdAt, eventType.

### 3.6 PeerState (tùy chọn)
- Lưu trạng thái kết nối WebRTC theo cặp peer để debug học tập.
- Trường chính (mô tả): roomRef, sessionRef, userRef, peerId, rtcState, updatedAt.

---

## 4) Chiến lược denormalization và cập nhật
- Message/Event lưu `userSnapshot` để không cần lookup User khi hiển thị list.
- Room cache `memberCount` và `lastMessageAt` để hiển thị phòng nhanh:
  - memberCount tăng/giảm khi Session join/leave.
  - lastMessageAt cập nhật khi tạo Message mới.
- Không backfill snapshot khi người dùng đổi displayName/avatar sau này (chấp nhận sai khác lịch sử).

---

## 5) Ràng buộc và quy tắc nghiệp vụ
- Giới hạn số người/phòng: kiểm tra số Session có `leftAt == null` < `maxParticipants` khi join.
- Dọn dẹp khi disconnect: set `leftAt` cho Session, giảm `memberCount` (không âm).
- Bảo tồn lịch sử: không xóa Message/Event cũ khi người dùng rời/xóa tài khoản (nếu cần có thể ẩn/ẩn danh sau này).

---

## 6) Chỉ mục và hiệu năng
- Message: index theo (roomRef, createdAt) để phân trang theo thời gian.
- Event: index theo (roomRef, createdAt) để xem timeline, theo eventType để thống kê.
- Session: index (roomRef, leftAt) để query nhanh người đang online.
- Room: unique(roomId), index(lastMessageAt) để sắp xếp phòng hoạt động gần đây.

---

## 7) Dọn rác và TTL (tùy chọn)
- Có thể áp dụng TTL cho Event/Message cũ trong dự án học tập để tiết kiệm dung lượng.
- Không bắt buộc, cân nhắc sau khi tính năng cốt lõi đã ổn định.

---

## 8) Tiêu chí hoàn thành (cho CSDL)
- Mô hình đủ để hỗ trợ phòng 6 người với tin nhắn và sự kiện cơ bản.
- Truy vấn phổ biến không cần join phức tạp nhờ snapshot/cache.
- Có thể mở rộng thêm TURN/SFU hoặc tính năng nâng cao mà không cần thay đổi lớn.
