# 03 - Định nghĩa schemas (mức khái niệm, không chèn mã)

Tài liệu mô tả các schema ở mức khái niệm cho MongoDB/Mongoose, tập trung vào tên trường, ý nghĩa và chỉ mục cần thiết. Không bao gồm mã nguồn.

---

## 1) User

- Mục đích: Đại diện cho người dùng đăng nhập hoặc khách (guest).
- Trường:
  - provider: 'local' | 'guest' | 'oauth'
  - email: unique, optional (guest có thể không có)
  - passwordHash: nếu dùng đăng nhập local
  - displayName: tên hiển thị
  - avatarUrl: ảnh đại diện
  - timestamps: createdAt, updatedAt
- Chỉ mục:
  - unique(email) (sparse nếu optional)
  - text(displayName) (tùy chọn)

---

## 2) Room

- Mục đích: Đại diện phòng chat video.
- Trường:
  - roomId: unique, dùng để join
  - title: tiêu đề phòng (tùy chọn)
  - maxParticipants: mặc định 6
  - isLocked: khóa phòng (tùy chọn)
  - createdBy: ref User
  - memberCount: cache, đếm số Session active
  - lastMessageAt: cache thời điểm tin nhắn gần nhất
  - timestamps
- Chỉ mục:
  - unique(roomId)
  - index(lastMessageAt)

---

## 3) Session

- Mục đích: Ghi lại mỗi lần user tham gia phòng (join/leave).
- Trường:
  - roomRef: ref Room
  - userRef: ref User (nullable cho guest không lưu DB)
  - socketId: để ánh xạ với Socket.io
  - role: 'host' | 'member'
  - joinedAt: thời điểm tham gia
  - leftAt: null nếu đang online
  - disconnectedAt: đánh dấu khi disconnect, dùng cho grace period
  - userSnapshot: { displayName, avatarUrl }
  - mediaState: { audio, video, screen }
  - deviceInfo: { userAgent, platform } (tùy chọn)
  - timestamps
- Chỉ mục:
  - index(roomRef, leftAt) để tìm online users
  - index(roomRef, disconnectedAt) để xử lý grace period
  - index(userRef, createdAt)

---

## 4) Message

- Mục đích: Lưu tin nhắn văn bản.
- Trường:
  - roomRef: ref Room
  - sessionRef: ref Session
  - userRef: ref User
  - type: 'text' | 'system'
  - content: nội dung
  - userSnapshot: { displayName, avatarUrl }
  - createdAt (không cần updatedAt)
- Chỉ mục:
  - index(roomRef, createdAt)
  - index(sessionRef)

---

## 5) Event

- Mục đích: Lưu sự kiện hành vi trong phòng (join/leave/mute/unmute...).
- Trường:
  - roomRef: ref Room
  - sessionRef: ref Session
  - userRef: ref User
  - eventType: 'join' | 'leave' | 'mute' | 'unmute' | 'video-off' | 'video-on' | 'screen-on' | 'screen-off'
  - metadata: JSON tuỳ biến theo loại sự kiện
  - userSnapshot: { displayName, avatarUrl }
  - createdAt
- Chỉ mục:
  - index(roomRef, createdAt)
  - index(eventType)

---

## 6) PeerState (tùy chọn)

- Mục đích: Debug trạng thái WebRTC theo cặp peer.
- Trường:
  - roomRef, sessionRef, userRef
  - peerId: phiên/peer đối tác
  - rtcState: { iceConnectionState, connectionState }
  - updatedAt
- Chỉ mục:
  - index(roomRef, sessionRef, peerId)

---

## 7) Quy tắc cập nhật và tính nhất quán

- Khi join: tạo Session, Event('join'), tăng Room.memberCount.
- Khi leave/disconnect: set leftAt, Event('leave'), giảm Room.memberCount (không âm).
- Khi message: tạo Message kèm userSnapshot, cập nhật Room.lastMessageAt.
- Không backfill snapshot khi user đổi tên/ảnh sau này.

---

## 8) Bảo tồn dữ liệu và TTL (tùy chọn)

- Không xóa Message/Event/Session mặc định (giữ lịch sử học tập).
- Có thể thêm TTL cho Event/Message cũ nếu cần tiết kiệm.
