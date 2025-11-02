# 02 - API Contracts và Socket Events

Tài liệu mô tả giao tiếp giữa client và server cho ứng dụng phòng video chat 5–6 người. Tập trung vào các sự kiện Socket.io (signaling, thông báo phòng) và một số REST endpoint tối thiểu, không bao gồm chi tiết mã nguồn.

---

## 1) Nguyên tắc chung

- Giao tiếp thời gian thực dùng **Socket.io**.
- Dựa trên **roomId** để điều phối các phiên trong cùng phòng.
- Payload gọn, rõ ràng; bao gồm đủ thông tin để client cập nhật UI mà không cần query thêm nếu không cần thiết.

---

## 2) REST Endpoints (tối thiểu)

1. POST /api/rooms

- Mục đích: Tạo phòng mới.
- Body: { title?, maxParticipants?, createdBy: { displayName, avatarUrl? } }
- Trả về: { roomId, title, maxParticipants, createdBy, createdAt }

2. GET /api/rooms

- Mục đích: Lấy danh sách phòng đang hoạt động (có người hoặc có tin nhắn gần đây).
- Query: ?limit=20&sortBy=lastMessageAt
- Trả về: [{ roomId, title, memberCount, lastMessageAt, createdAt }]

3. GET /api/rooms/:roomId

- Mục đích: Lấy thông tin phòng (để hiển thị trước khi join).
- Trả về: { roomId, title, maxParticipants, memberCount, isLocked }

4. GET /api/rooms/:roomId/messages?before|after&limit

- Mục đích: Phân trang tin nhắn cũ của phòng.
- Query: ?before=timestamp&limit=50 hoặc ?after=timestamp&limit=50
- Trả về: { messages: [{ id, content, userSnapshot, createdAt }], hasMore: boolean }

(REST có thể lược bớt nếu toàn bộ giao tiếp qua Socket cho dự án học tập.)

---

## 3) Socket Events – Kết nối và phòng

- Client -> Server: `join-room`

  - Payload: { roomId, displayName, avatarUrl? }
  - Mục đích: Tham gia phòng, tạo Session, trả về danh sách peers hiện có.
  - Server trả: `room-joined` { self: { sessionId, socketId }, peers: [{ socketId, sessionId, userSnapshot }], room: { roomId, title, maxParticipants, memberCount } }
  - Broadcast tới người khác: `user-joined` { socketId, sessionId, userSnapshot }

- Client -> Server: `leave-room`

  - Payload: { roomId }
  - Mục đích: Rời phòng có chủ đích (khác với disconnect đột ngột).
  - Server trả: `room-left` { success: true }
  - Broadcast: `user-left` { socketId, sessionId }

- Server -> Client: `room-error`
  - Payload: { code, message }
  - Dùng khi join thất bại (đã đủ 6 người, phòng khóa, ...)

---

## 4) Socket Events – Signaling WebRTC

- Client -> Server: `offer`

  - Payload: { to, sdp }
  - Mục đích: Chuyển SDP offer cho peer đích.
  - Server chuyển tiếp tới đích: `offer` { from, sdp }

- Client -> Server: `answer`

  - Payload: { to, sdp }
  - Mục đích: Chuyển SDP answer cho peer đích.
  - Server chuyển tiếp: `answer` { from, sdp }

- Client -> Server: `ice-candidate`
  - Payload: { to, candidate }
  - Mục đích: Chuyển ICE candidate.
  - Server chuyển tiếp: `ice-candidate` { from, candidate }

Quy ước giảm race condition: **người mới join** sẽ là bên tạo **offer** tới các peer đã có trong phòng.

---

## 5) Socket Events – Tin nhắn và sự kiện

- Client -> Server: `message:new`

  - Payload: { roomId, content }
  - Server lưu Message (kèm userSnapshot) và broadcast: `message:created` { id, content, userSnapshot, createdAt }

- Client -> Server: `event:media`
  - Payload: { roomId, type: 'mute'|'unmute'|'video-off'|'video-on'|'screen-on'|'screen-off', metadata? }
  - Server lưu Event và broadcast: `event:created` { eventType, userSnapshot, createdAt, metadata }

---

## 6) Xử lý disconnect và reconnect

- Server phát hiện `disconnect`:
  - Đợi grace period 5 giây trước khi đánh dấu rời phòng hoàn toàn.
  - Nếu không reconnect: cập nhật Session.leftAt, giảm Room.memberCount, broadcast `user-left`.
- Reconnect trong grace period:
  - Client gửi lại `join-room` với cùng roomId và displayName.
  - Server tìm Session cũ chưa có leftAt, tái sử dụng và cập nhật socketId mới.
  - Broadcast `user-reconnected` { socketId, sessionId } thay vì `user-joined`.
- Reconnect sau grace period:
  - Xử lý như join mới, tạo Session mới.

---

## 7) Quy tắc kiểm soát và lỗi phổ biến

- Join khi phòng đủ người: trả `room-error` (code: ROOM_FULL, message: "Phòng đã đủ người").
- Phòng bị khóa: `room-error` (code: ROOM_LOCKED, message: "Phòng đã bị khóa").
- Phòng không tồn tại: `room-error` (code: ROOM_NOT_FOUND, message: "Không tìm thấy phòng").
- Gửi offer/answer/candidate tới peer không tồn tại: `room-error` (code: PEER_NOT_FOUND, message: "Peer không còn trong phòng").
- Signaling timeout (30s không nhận answer): client tự xử lý retry hoặc thông báo lỗi kết nối.

---

## 8) CORS và cấu hình

- Server cần bật CORS cho phép client từ origin khác (ví dụ: frontend chạy localhost:3000, backend localhost:5000).
- Socket.io cũng cần cấu hình CORS tương ứng:
  - cors: { origin: "http://localhost:3000", credentials: true }
- Cho môi trường học tập có thể dùng origin: "\*" nhưng nên cụ thể hơn.

---

## 9) Tiêu chí hoàn thành (cho API/Socket)

- Quy trình join/leave rõ ràng với đủ broadcast để UI đồng bộ.
- Signaling hoạt động với 3–6 người, không deadlock do race condition.
- Tin nhắn và sự kiện được lưu, có broadcast theo thời gian thực.
- CORS được cấu hình đúng để client kết nối được.
