# 04 - Luồng dữ liệu và trình tự nghiệp vụ

Tài liệu mô tả các luồng chính trong ứng dụng: tạo phòng, tham gia/rời phòng, gửi tin nhắn, cập nhật trạng thái media, và xử lý disconnect. Nhấn mạnh dữ liệu được đọc/ghi vào collection nào và cập nhật cache ra sao.

---

## 1) Tạo phòng (Create Room)

1. Người dùng gửi yêu cầu tạo phòng (REST hoặc giao diện UI tương đương).
2. Server tạo bản ghi Room:
   - roomId (unique), title, maxParticipants (mặc định 6), createdBy.
   - memberCount = 0, lastMessageAt = null.
3. Trả về thông tin phòng cho client.

Kết quả dữ liệu:

- Room: +1 bản ghi mới.

---

## 2) Tham gia phòng (Join Room)

1. Client yêu cầu join-room với roomId và thông tin hiển thị (displayName, avatarUrl?).
2. Server kiểm tra:
   - Phòng có tồn tại không?
   - Phòng có bị khóa không?
   - Số người đang online (Session với leftAt == null) < maxParticipants?
3. Nếu OK:
   - Tạo Session mới cho user: set joinedAt, leftAt=null, lưu userSnapshot.
   - Tăng Room.memberCount += 1.
   - Ghi Event('join') kèm userSnapshot.
   - Trả về danh sách peers hiện tại trong phòng và thông tin Room.
4. Broadcast tới các thành viên khác: user-joined.

Kết quả dữ liệu:

- Session: +1 (active)
- Room.memberCount: +1
- Event: +1 ('join')

---

## 3) Gửi tin nhắn (Send Message)

1. Client gửi message:new với roomId và content.
2. Server kiểm tra Session hợp lệ (đang ở trong phòng).
3. Server tạo Message:
   - roomRef, sessionRef, userRef, content, type='text', userSnapshot, createdAt.
4. Update Room.lastMessageAt = now.
5. Broadcast message:created tới các client trong phòng.

Kết quả dữ liệu:

- Message: +1
- Room.lastMessageAt: cập nhật

---

## 4) Cập nhật trạng thái media (Mute/Unmute/Video/Screen)

1. Client gửi event:media với type ('mute'|'unmute'|'video-off'|'video-on'|'screen-on'|'screen-off').
2. Server kiểm tra Session hợp lệ.
3. Cập nhật Session.mediaState tương ứng.
4. Ghi Event(eventType) kèm metadata nếu có.
5. Broadcast event:created tới phòng để UI đồng bộ.

Kết quả dữ liệu:

- Session: cập nhật mediaState
- Event: +1 (theo loại)

---

## 5) Rời phòng (Leave Room)

1. Client chủ động gửi leave-room hoặc disconnect.
2. Server xử lý:
   - Tìm Session active (leftAt == null) và set leftAt = now.
   - Giảm Room.memberCount (không âm).
   - Ghi Event('leave').
   - Broadcast user-left tới phòng.

Kết quả dữ liệu:

- Session: cập nhật leftAt
- Room.memberCount: -1
- Event: +1 ('leave')

---

## 6) Xử lý disconnect đột ngột

- Khi Socket.io phát hiện disconnect:
  - Đánh dấu Session với flag `disconnectedAt = now`.
  - Bắt đầu grace period timer 5 giây.
  - Nếu client reconnect trong 5s:
    - Tìm Session có disconnectedAt gần đây, xóa flag, cập nhật socketId mới.
    - Broadcast `user-reconnected` thay vì `user-left`.
  - Nếu hết 5s không reconnect:
    - Set Session.leftAt = disconnectedAt.
    - Giảm Room.memberCount.
    - Ghi Event('leave').
    - Broadcast `user-left`.

Lợi ích: Tránh flicker UI khi mạng giật lag tạm thời.

---

## 7) Phân trang dữ liệu

- Messages:
  - Phân trang theo createdAt (trước/sau mốc thời gian).
  - Không cần join User nhờ userSnapshot.
- Events:
  - Phân trang theo createdAt, lọc theo eventType khi cần thống kê.

---

## 8) Lưu ý đồng bộ trạng thái UI

- Khi nhận broadcast user-joined/user-left: cập nhật danh sách người trong phòng.
- Khi nhận message:created: push vào list tin nhắn, scroll nếu cần.
- Khi nhận event:created: cập nhật trạng thái UI (mute icon, video off, screen share badge...).

---

## 9) Xử lý phòng trống

- Khi người cuối cùng rời phòng (memberCount = 0):
  - Không xóa Room ngay lập tức (giữ lịch sử tin nhắn).
  - Có thể đánh dấu Room.isEmpty = true, Room.emptyAt = now.
  - Tùy chọn: Chạy job dọn dẹp sau 24h xóa phòng trống không có hoạt động.

---

## 10) Tiêu chí hoàn thành cho luồng dữ liệu

- Mọi thao tác phổ biến (join/leave/message/event) cập nhật đúng các collection.
- Room.memberCount và Room.lastMessageAt luôn phản ánh đúng trạng thái hiện tại.
- UI có thể dựng toàn bộ dữ liệu hiển thị từ payload broadcast mà không cần truy vấn bổ sung.
- Grace period reconnect hoạt động mượt mà.
