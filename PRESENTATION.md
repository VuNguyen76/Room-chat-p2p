# 🎥 Video Chat Room - Bài Thuyết Trình

---

## SLIDE 1: Tổng Quan Kiến Trúc (Architecture Overview)

### 🎤 Script thuyết trình:

> "Xin chào mọi người, hôm nay tôi sẽ trình bày về hệ thống Video Chat Room mà nhóm đã xây dựng.
>
> Đầu tiên, hãy nhìn vào kiến trúc tổng quan của hệ thống. Chúng ta có **3 tầng chính**:
>
> **1. Client Layer (Trình duyệt)**
>
> - Đây là nơi người dùng tương tác trực tiếp
> - Được xây dựng bằng React với TypeScript
> - Bao gồm các components như VideoGrid hiển thị video, ChatPanel cho tin nhắn, và các Controls điều khiển
> - Sử dụng các custom hooks để quản lý logic: useWebRTC cho kết nối P2P, useSignaling cho giao tiếp với server
>
> **2. WebRTC Peer Connections**
>
> - Đây là điểm đặc biệt của hệ thống - chúng ta sử dụng **Mesh Topology**
> - Nghĩa là mỗi người dùng kết nối trực tiếp với tất cả người dùng khác
> - Video và Audio được truyền **trực tiếp giữa các trình duyệt**, không qua server
> - Điều này giúp giảm tải server và giảm độ trễ
>
> **3. Server Layer (Node.js)**
>
> - Server **không xử lý media**, chỉ làm nhiệm vụ **Signaling**
> - Signaling là quá trình giúp các peer tìm thấy nhau và trao đổi thông tin kết nối
> - Sử dụng Express cho REST API và Socket.io cho real-time communication
> - MongoDB lưu trữ thông tin phòng, session, tin nhắn và events
>
> Tóm lại, kiến trúc này cho phép **scale tốt** vì server chỉ xử lý signaling nhẹ, còn media nặng được xử lý P2P."

### 📝 Key Points:

- Mesh Topology cho WebRTC
- Server chỉ làm Signaling, không xử lý media
- 3 tầng: Client → WebRTC P2P → Server (Signaling + DB)

---

## SLIDE 2: Luồng Kết Nối WebRTC (WebRTC Connection Flow)

### 🎤 Script thuyết trình:

> "Bây giờ tôi sẽ giải thích chi tiết **luồng kết nối WebRTC** - đây là phần core của hệ thống.
>
> Giả sử User A muốn join vào phòng đã có User B:
>
> **Bước 1-2: Join Room**
>
> - User A gửi request `join-room` lên server
> - Server trả về danh sách peers hiện có trong phòng, ở đây là User B
>
> **Bước 3: Thông báo**
>
> - Server broadcast sự kiện `user-joined` cho User B biết có người mới vào
>
> **Bước 4-5: Tạo Offer**
>
> - User A tạo RTCPeerConnection, thêm local media tracks (camera, mic)
> - Tạo SDP Offer - đây là mô tả về khả năng media của User A
> - Gửi Offer qua server đến User B
>
> **Bước 6-8: Tạo Answer**
>
> - User B nhận Offer, tạo PeerConnection của mình
> - Set Remote Description từ Offer
> - Tạo SDP Answer và gửi ngược lại cho User A
>
> **Bước 9: Hoàn tất SDP Exchange**
>
> - User A nhận Answer và set Remote Description
> - Lúc này cả 2 đã biết khả năng media của nhau
>
> **Bước 10: ICE Candidates**
>
> - Đây là quá trình **NAT Traversal** - tìm đường kết nối tốt nhất
> - Mỗi bên gửi các ICE candidates (địa chỉ IP, port) cho nhau
> - Sử dụng STUN server của Google để tìm public IP
>
> **Kết quả cuối cùng:**
>
> - Kết nối P2P được thiết lập
> - Video/Audio stream trực tiếp giữa 2 trình duyệt, **không qua server**"

### 📝 Key Points:

- SDP Exchange: Offer → Answer
- ICE Candidates cho NAT Traversal
- Server chỉ forward signaling messages
- Kết quả: Direct P2P media stream

---

## SLIDE 3: Data Models (MongoDB Schema)

### 🎤 Script thuyết trình:

> "Tiếp theo là cấu trúc dữ liệu trong MongoDB. Chúng ta có **4 collections chính**:
>
> **1. Room Collection**
>
> - Lưu thông tin phòng họp
> - `roomId`: ID unique để share cho người khác join
> - `maxParticipants`: Giới hạn 2-10 người, mặc định 6
> - `memberCount`: Số người đang trong phòng, real-time update
> - `isLocked`: Có thể khóa phòng không cho người mới vào
>
> **2. Session Collection**
>
> - Mỗi lần user join phòng tạo 1 session mới
> - `socketId`: ID của socket connection hiện tại
> - `role`: host (người tạo phòng) hoặc member
> - `userSnapshot`: Lưu displayName, avatar tại thời điểm join
> - `mediaState`: Trạng thái audio/video/screen sharing
> - `disconnectedAt`: Quan trọng cho **Grace Period** - khi user mất kết nối tạm thời
>
> **3. Message Collection**
>
> - Lưu tin nhắn chat trong phòng
> - Reference đến Room và Session
> - `userSnapshot`: Snapshot để hiển thị đúng tên ngay cả khi user đã rời
>
> **4. Event Collection**
>
> - Activity log của phòng
> - Các event types: join, leave, mute, unmute, video-on/off, screen-on/off
> - Hữu ích cho audit trail và debugging
>
> **Điểm đặc biệt:**
>
> - Sử dụng `userSnapshot` thay vì reference để tránh JOIN query
> - Indexes được tối ưu cho các query phổ biến
> - Không có User collection riêng - hệ thống guest-based, không cần đăng ký"

### 📝 Key Points:

- 4 Collections: Room, Session, Message, Event
- userSnapshot pattern để tối ưu query
- Grace Period tracking qua disconnectedAt
- Guest-based system, không cần authentication

---

## SLIDE 4: Frontend Component Structure

### 🎤 Script thuyết trình:

> "Đây là cấu trúc UI của ứng dụng khi đang trong phòng họp.
>
> **MainLayout** - Component wrapper chính, chia làm 4 phần:
>
> **1. Header (Trên cùng)**
>
> - Hiển thị Room ID với nút Copy để share
> - Nút Settings cho cài đặt
>
> **2. VideoGridNew (Khu vực chính - bên trái)**
>
> - Hiển thị video của tất cả participants
> - Mỗi người là 1 VideoTile component
> - VideoTile hiển thị: video stream, tên, trạng thái mic/camera
> - Grid layout tự động điều chỉnh theo số người:
>   - 1 người: full screen
>   - 2 người: 2 cột
>   - 3-4 người: 2x2 grid
>   - 5-6 người: 3x2 grid
>   - Và tiếp tục scale lên
>
> **3. ChatPanel (Bên phải - toggle được)**
>
> - Danh sách tin nhắn real-time
> - Input để gửi tin nhắn mới
> - Có thể ẩn/hiện bằng nút Chat ở controls
>
> **4. BottomControls (Dưới cùng)**
>
> - **Mic**: Toggle mute/unmute
> - **Video**: Toggle camera on/off
> - **Screen**: Bắt đầu/dừng screen sharing
> - **Chat**: Ẩn/hiện chat panel
> - **Leave**: Rời phòng (có confirmation dialog)
>
> **Responsive Design:**
>
> - Chat panel là sidebar, không stack dưới video
> - Video grid tự động resize theo không gian còn lại"

### 📝 Key Points:

- 4 sections: Header, VideoGrid, ChatPanel, Controls
- Adaptive grid layout based on participant count
- Toggle-able chat sidebar
- All controls accessible from bottom bar

---

## SLIDE 5: Screen Share Layout

### 🎤 Script thuyết trình:

> "Khi có người share màn hình, layout sẽ **tự động chuyển đổi** để focus vào nội dung được share.
>
> **Layout thay đổi như sau:**
>
> **1. Main Screen Share Area (Khu vực chính)**
>
> - Chiếm phần lớn màn hình (flex-1)
> - Hiển thị nội dung screen share với `object-contain`
> - Giữ nguyên tỷ lệ khung hình, không bị méo
> - Background đen để nội dung nổi bật
>
> **2. Horizontal Thumbnail Strip (Dải thumbnail ngang)**
>
> - Nằm ở dưới, chiều cao cố định 128px
> - Hiển thị video của các participants khác
> - Mỗi thumbnail width 160px
> - Có thể scroll ngang nếu nhiều người
> - Người đang share không xuất hiện ở đây (đã ở main area)
>
> **Logic xử lý:**
>
> - Khi bắt đầu share: Camera tự động tắt để tiết kiệm bandwidth
> - Track video được replace bằng screen track
> - Khi dừng share: Camera tự động bật lại (nếu trước đó đang bật)
> - Broadcast event `screen-on/screen-off` cho các participants khác
>
> **Tại sao layout này?**
>
> - Focus vào nội dung quan trọng (screen share)
> - Vẫn thấy được reactions của người khác qua thumbnails
> - Tương tự như Zoom, Google Meet khi có người share"

### 📝 Key Points:

- Auto-switch layout when screen sharing starts
- Main area for shared content, thumbnails for others
- Camera auto-disable during screen share
- Horizontal scrollable thumbnail strip

---

## SLIDE 6: Socket Events Flow

### 🎤 Script thuyết trình:

> "Đây là tổng hợp tất cả Socket events trong hệ thống. Chia làm 4 nhóm:
>
> **1. Room Management**
>
> - `join-room`: Client gửi khi muốn vào phòng
> - `leave-room`: Client gửi khi rời phòng
> - Server broadcast: `user-joined`, `user-left`, `user-reconnected`
> - `room-error`: Khi có lỗi (phòng đầy, phòng khóa, etc.)
>
> **2. WebRTC Signaling**
>
> - `offer`: Gửi SDP offer đến peer cụ thể
> - `answer`: Gửi SDP answer response
> - `ice-candidate`: Gửi ICE candidates cho NAT traversal
> - Server chỉ **forward** các messages này, không xử lý nội dung
>
> **3. Media Events**
>
> - `event:media`: Client gửi khi thay đổi trạng thái media
>   - Types: mute, unmute, video-on, video-off, screen-on, screen-off
> - `event:created`: Server broadcast cho tất cả trong phòng
> - Giúp sync UI trạng thái mic/camera của mọi người
>
> **4. Chat Messages**
>
> - `message:new`: Client gửi tin nhắn mới
> - `message:created`: Server broadcast tin nhắn cho cả phòng
> - Bao gồm cả sender để hiển thị đúng
>
> **Đặc điểm:**
>
> - Tất cả events đều có callback để confirm success/error
> - Validation ở server trước khi broadcast
> - Room-scoped: Chỉ broadcast trong phòng liên quan"

### 📝 Key Points:

- 4 event groups: Room, Signaling, Media, Chat
- Server forwards signaling, doesn't process content
- All events have acknowledgment callbacks
- Room-scoped broadcasting

---

## SLIDE 7: Hooks Architecture

### 🎤 Script thuyết trình:

> "Frontend sử dụng **Custom Hooks pattern** để tách biệt logic. Đây là các hooks chính:
>
> **Core Hooks (Hàng trên):**
>
> **useSignaling**
>
> - Quản lý Socket.io connection
> - Cung cấp methods: joinRoom, leaveRoom, sendOffer, sendAnswer, sendIceCandidate
> - Handle tất cả socket events và callbacks
>
> **useWebRTC**
>
> - Quản lý RTCPeerConnection cho mỗi peer
> - Methods: createPeerConnection, createOffer, createAnswer
> - Handle ICE candidates và remote streams
> - Cleanup connections khi peer disconnect
>
> **useMediaStream**
>
> - Quản lý local media (camera, microphone)
> - getUserMedia với device selection
> - Toggle audio/video
> - Stop stream khi leave room
>
> **Supporting Hooks (Hàng dưới):**
>
> **useScreenShare + useScreenShareWebRTC**
>
> - getDisplayMedia cho screen capture
> - Replace video track trong existing peer connections
> - Restore camera track khi stop sharing
>
> **useAdaptiveBitrate**
>
> - Tự động điều chỉnh video quality
> - Dựa trên số lượng participants
> - Nhiều người → giảm bitrate để tránh lag
>
> **useReconnection**
>
> - Auto retry khi mất kết nối
> - Exponential backoff (1s → 2s → 4s...)
> - Grace period 5 giây trước khi coi là disconnected
>
> **useMediaDevices**
>
> - Enumerate available cameras/microphones
> - Allow user to select specific device
>
> **Tại sao dùng Hooks?**
>
> - Separation of concerns
> - Reusable logic
> - Easy to test
> - Clean component code"

### 📝 Key Points:

- 3 core hooks: Signaling, WebRTC, MediaStream
- Supporting hooks for specific features
- Hooks communicate via callbacks
- Clean separation of concerns

---

## SLIDE 8: Technology Stack

### 🎤 Script thuyết trình:

> "Cuối cùng là tổng hợp công nghệ sử dụng trong dự án:
>
> **Frontend:**
>
> - **React 18**: UI library với hooks
> - **TypeScript**: Type safety, better DX
> - **Vite**: Build tool nhanh, HMR tốt
> - **Tailwind CSS**: Utility-first CSS
> - **shadcn/ui**: Pre-built accessible components
> - **Zustand**: Lightweight state management
> - **Socket.io-client**: WebSocket với fallback
>
> **Backend:**
>
> - **Node.js**: JavaScript runtime
> - **Express.js**: Web framework
> - **Socket.io**: Real-time bidirectional communication
> - **Mongoose**: MongoDB ODM
> - **MongoDB**: NoSQL database
>
> **Protocols:**
>
> - **WebRTC**: Peer-to-peer media streaming
> - **WebSocket**: Real-time signaling
> - **STUN**: NAT traversal (Google's public servers)
>
> **Key Features đã implement:**
>
> - Video/Audio call cho 2-10 người
> - Screen sharing với auto camera toggle
> - Real-time chat
> - Adaptive bitrate based on participant count
> - Reconnection với 5s grace period
> - Rate limiting để prevent abuse
>
> **Tại sao chọn stack này?**
>
> - JavaScript/TypeScript full-stack → team consistency
> - WebRTC native trong browser → không cần plugin
> - Socket.io → reliable với fallback mechanisms
> - MongoDB → flexible schema, good for real-time apps"

### 📝 Key Points:

- Full JavaScript/TypeScript stack
- WebRTC for P2P media, Socket.io for signaling
- Production-ready features: reconnection, rate limiting, adaptive bitrate

---

## 📋 Tổng Kết (Summary Slide)

### 🎤 Script thuyết trình:

> "Tóm lại, hệ thống Video Chat Room này có các điểm nổi bật:
>
> **1. Kiến trúc P2P**
>
> - Media không qua server → low latency, scalable
> - Server chỉ làm signaling → lightweight
>
> **2. Real-time Features**
>
> - Video/Audio call
> - Screen sharing
> - Chat messaging
> - Media state sync
>
> **3. Reliability**
>
> - Reconnection với grace period
> - Adaptive bitrate
> - Error handling
>
> **4. Clean Code**
>
> - Hooks-based architecture
> - TypeScript type safety
> - Separation of concerns
>
> **Limitations & Future Improvements:**
>
> - Mesh topology giới hạn ~10 users (có thể upgrade lên SFU)
> - Chưa có recording feature
> - Chưa có end-to-end encryption
>
> Cảm ơn mọi người đã lắng nghe. Có câu hỏi gì không ạ?"

---

## 🎯 Tips cho người thuyết trình:

1. **Thời gian**: Mỗi slide khoảng 2-3 phút, tổng ~20 phút
2. **Demo**: Nên có live demo sau slide 4-5
3. **Q&A**: Chuẩn bị trả lời về:
   - Tại sao chọn Mesh thay vì SFU?
   - Làm sao handle nhiều hơn 10 users?
   - Security considerations?
4. **Visual**: Dùng các diagram đã cung cấp, highlight phần đang nói
