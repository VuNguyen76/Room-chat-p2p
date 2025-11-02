# 05 - Kế hoạch kiểm thử (Test Plan)

Mục tiêu: Đảm bảo các luồng chính (join/leave, signaling, messaging, event media) hoạt động ổn định cho phòng 5–6 người. Tập trung vào kiểm thử chức năng và hành vi, không bao gồm tự động hóa phức tạp.

---

## 1) Phạm vi kiểm thử

- Chức năng tạo phòng, tham gia/rời phòng.
- Signaling WebRTC qua Socket.io (offer/answer/ice-candidate) – phạm vi ở mức luồng event, không kiểm thử chất lượng media.
- Gửi/nhận tin nhắn, cập nhật trạng thái media.
- Dữ liệu trong DB (Room, Session, Message, Event) được cập nhật đúng.

---

## 2) Chuẩn bị

- Môi trường dev với MongoDB và server Socket.io chạy cục bộ.
- Trình duyệt: Chrome (ưu tiên), Edge/Firefox kiểm tra bổ sung.
- Công cụ quan sát DB (MongoDB Compass) để kiểm tra ghi nhận dữ liệu.

---

## 3) Test cases chính

### 3.1 Tạo phòng

- B1: Gọi API tạo phòng.
- Kỳ vọng: Trả về roomId unique; Room trong DB có memberCount=0, lastMessageAt=null.

### 3.2 Join phòng (1–6 người)

- B1: Nhiều tab/trình duyệt join cùng roomId.
- Kỳ vọng: Mỗi join tạo Session mới (leftAt=null), memberCount tăng đúng; nhận broadcast user-joined trên các client khác.

### 3.3 Vượt quá giới hạn phòng

- B1: Thử join người thứ 7.
- Kỳ vọng: Nhận room-error (ROOM_FULL); không tạo Session mới; memberCount không đổi.

### 3.4 Rời phòng (leave chủ động)

- B1: Client gửi leave-room.
- Kỳ vọng: Session cập nhật leftAt; memberCount giảm; broadcast user-left.

### 3.5 Disconnect đột ngột

- B1: Đóng tab hoặc tắt mạng tạm thời.
- Kỳ vọng: Server xử lý như leave; cập nhật Session.leftAt, memberCount, Event('leave').

### 3.6 Gửi tin nhắn

- B1: Client gửi message:new.
- Kỳ vọng: DB thêm Message có userSnapshot; Room.lastMessageAt cập nhật; client trong phòng nhận message:created.

### 3.7 Event media (mute/unmute/video/screen)

- B1: Client gửi event:media.
- Kỳ vọng: Session.mediaState cập nhật đúng; DB thêm Event; client khác nhận event:created và UI đồng bộ.

### 3.8 Reconnect trong grace period

- B1: Client disconnect (đóng tab hoặc mất mạng tạm thời).
- B2: Trong vòng 5s, client reconnect với cùng roomId và displayName.
- Kỳ vọng: Session cũ được tái sử dụng, socketId cập nhật; broadcast user-reconnected; memberCount không đổi.

### 3.9 Reconnect sau grace period

- B1: Client disconnect.
- B2: Đợi hơn 5s rồi mới reconnect.
- Kỳ vọng: Session cũ đã có leftAt; tạo Session mới; broadcast user-joined như bình thường.

### 3.10 Phòng trống

- B1: Tất cả người rời phòng.
- Kỳ vọng: Room.memberCount = 0; Room vẫn tồn tại với lịch sử tin nhắn.

### 3.11 Danh sách phòng

- B1: Gọi GET /api/rooms.
- Kỳ vọng: Trả về danh sách phòng có memberCount > 0 hoặc lastMessageAt gần đây, sắp xếp theo lastMessageAt giảm dần.

---

## 4) Kiểm thử cơ sở dữ liệu

- Xác minh chỉ mục tồn tại theo thiết kế (roomRef+createdAt cho Message/Event; roomRef+leftAt cho Session).
- Kiểm tra tính toàn vẹn: không âm memberCount; Session active không trùng lặp cho cùng socket.

---

## 5) Hiệu năng tối thiểu

- 6 client cùng phòng:
  - Broadcast join/leave/message/event không bị trễ đáng kể.
  - DB ghi nhận chính xác; CPU server ổn định.

---

## 6) Tiêu chí chấp nhận

- Tất cả test case chính đạt kỳ vọng.
- Không lỗi nghiêm trọng (crash server, mất đồng bộ DB).
- Hành vi nhất quán trong 10 phút gọi nhóm 6 người (gia lập nếu cần).
