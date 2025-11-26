# 🎥 ERP Video Chat Room

Real-time video chat application with WebRTC, Socket.io, and MongoDB.

## 🚀 Deploy 1-Click (Dễ nhất!)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

**Chỉ cần:**

1. Click button trên
2. Connect GitHub
3. Điền MongoDB URI
4. Done! 🎉

Chi tiết: [DEPLOY-1-CLICK.md](./DEPLOY-1-CLICK.md)

## ✨ Features

- 🎥 Multi-participant video calls (up to 10 users)
- 💬 Real-time text chat
- 🖥️ Screen sharing
- 🎤 Audio/Video controls
- 📱 Responsive design
- 🔒 Room-based sessions
- 🔄 Auto-reconnection with grace period

## 🛠️ Tech Stack

**Frontend:**

- React 19 + TypeScript
- Vite
- TailwindCSS
- Socket.io Client
- Simple-peer (WebRTC)
- Zustand (State Management)

**Backend:**

- Node.js + Express
- Socket.io
- MongoDB + Mongoose
- WebRTC Signaling

## 🚀 Quick Start

### Development

1. **Clone repository**

```bash
git clone <your-repo>
cd video-chat-room
```

2. **Setup environment**

```bash
# Copy environment files
cp .env.example .env
cp frontend/.env.example frontend/.env

# Edit .env with your MongoDB URI
```

3. **Install dependencies**

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

4. **Run development servers**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

5. **Access application**

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Docker (Production)

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy:**

- **Frontend**: Vercel (recommended)
- **Backend**: Railway or Render
- **Database**: MongoDB Atlas

## 🔧 Configuration

### Backend Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/video-chat-room
CORS_ORIGIN=http://localhost:3000
GRACE_PERIOD_MS=5000
```

### Frontend Environment Variables

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=ERP Video Chat Room
VITE_STUN_SERVERS=stun:stun.l.google.com:19302
```

## 📁 Project Structure

```
.
├── backend/                # Node.js backend
│   ├── src/
│   │   ├── config/        # Configuration
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── socket/        # Socket.io handlers
│   │   ├── app.js         # Express app
│   │   └── server.js      # Server entry
│   ├── Dockerfile
│   └── package.json
│
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── store/         # Zustand stores
│   │   ├── utils/         # Utilities
│   │   └── App.tsx        # Main app
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml     # Docker compose config
├── .env.example           # Environment template
└── DEPLOYMENT.md          # Deployment guide
```

## 🎯 API Endpoints

### REST API

- `GET /health` - Health check
- `POST /api/rooms` - Create room
- `GET /api/rooms` - List rooms
- `GET /api/rooms/:roomId` - Get room info
- `GET /api/rooms/:roomId/messages` - Get messages

### Socket.io Events

- `join-room` - Join a room
- `leave-room` - Leave a room
- `offer` - WebRTC offer
- `answer` - WebRTC answer
- `ice-candidate` - ICE candidate
- `message:new` - Send message
- `event:media` - Media state change

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests (if configured)
cd frontend
npm test
```

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please read contributing guidelines first.

## 📧 Support

For issues and questions, please open a GitHub issue.
