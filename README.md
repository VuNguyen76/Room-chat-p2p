# 🎥 ERP Video Chat Room

Real-time video chat application with WebRTC, Socket.io, and MongoDB.

## 🚀 Deploy (5 phút)

### Backend → Railway

1. Vào [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Chọn repo, **Root Directory**: `backend`
3. Add MongoDB: New → Database → MongoDB
4. Add env variables: `MONGODB_URI`, `CORS_ORIGIN=*`
5. Generate Domain → Copy URL

### Frontend → Vercel

1. Vào [vercel.com](https://vercel.com) → Add New → Project
2. Import repo, **Root Directory**: `frontend`
3. Add env: `VITE_API_URL` và `VITE_SOCKET_URL` = Railway URL
4. Deploy!

📖 Chi tiết: [VERCEL-DEPLOY.md](./VERCEL-DEPLOY.md)

---

## ✨ Features

- 🎥 Multi-participant video calls (up to 10 users)
- 💬 Real-time text chat
- 🖥️ Screen sharing
- 🎤 Audio/Video controls
- 📱 Responsive design

## 🛠️ Tech Stack

**Frontend:** React 19, TypeScript, Vite, TailwindCSS, Socket.io Client, WebRTC

**Backend:** Node.js, Express, Socket.io, MongoDB

## 💻 Local Development

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 📁 Project Structure

```
├── backend/          # Node.js API + Socket.io
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── socket/
│   └── package.json
│
├── frontend/         # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── App.tsx
│   └── package.json
│
└── README.md
```

## 📝 License

MIT
