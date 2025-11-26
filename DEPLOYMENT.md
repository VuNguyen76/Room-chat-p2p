# 🚀 Deployment Guide

## Docker Deployment (Recommended for Railway, Render, DigitalOcean)

### Prerequisites

- Docker & Docker Compose installed
- MongoDB database (MongoDB Atlas recommended)

### Quick Start

1. **Clone and setup environment**

```bash
# Copy and configure environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and other configs
```

2. **Build and run with Docker Compose**

```bash
docker-compose up -d
```

3. **Access the application**

- Frontend: http://localhost
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/health

### Individual Container Build

**Backend only:**

```bash
cd backend
docker build -t video-chat-backend .
docker run -p 5000:5000 --env-file ../.env video-chat-backend
```

**Frontend only:**

```bash
cd frontend
docker build -t video-chat-frontend .
docker run -p 80:80 video-chat-frontend
```

---

## 🚂 Railway Deployment (RECOMMENDED - Full Stack)

**Deploy cả Frontend + Backend cùng lúc!**

Railway hỗ trợ Docker Compose và WebSocket, tốt nhất cho app này.

### Quick Deploy

1. Push code lên GitHub
2. Tạo project mới tại [railway.app](https://railway.app)
3. Connect GitHub repo
4. Railway tự động detect `docker-compose.yml`
5. Add MongoDB (New → Database → MongoDB)
6. Configure environment variables
7. Deploy! 🚀

**Chi tiết:** Xem [RAILWAY-DEPLOY.md](./RAILWAY-DEPLOY.md)

---

## 🎨 Render Deployment (FREE Alternative)

**Deploy cả Frontend + Backend với Blueprint!**

Render hoàn toàn free nhưng có cold start (~50s).

### Quick Deploy

1. Push code lên GitHub
2. Tạo account tại [render.com](https://render.com)
3. New → Blueprint
4. Connect repo (tự động detect `render.yaml`)
5. Add MongoDB Atlas URI
6. Deploy! 🎉

**Chi tiết:** Xem [RENDER-DEPLOY.md](./RENDER-DEPLOY.md)

---

## 🌐 Vercel Deployment (Frontend Only)

Vercel không hỗ trợ WebSocket/Socket.io, nên chỉ deploy frontend. Backend cần deploy riêng.

### Step 1: Deploy Backend (Railway/Render)

**Railway:**

1. Tạo project mới tại [railway.app](https://railway.app)
2. Connect GitHub repo
3. Chọn thư mục `backend`
4. Add environment variables:
   - `MONGODB_URI`
   - `CORS_ORIGIN=*`
   - `NODE_ENV=production`
5. Deploy!

**Render:**

1. Tạo Web Service mới tại [render.com](https://render.com)
2. Connect GitHub repo
3. Settings:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add environment variables
5. Deploy!

### Step 2: Deploy Frontend (Vercel)

1. **Install Vercel CLI**

```bash
npm i -g vercel
```

2. **Configure frontend environment**

```bash
cd frontend
# Create .env.production with your backend URL
echo "VITE_API_URL=https://your-backend.railway.app" > .env.production
echo "VITE_SOCKET_URL=https://your-backend.railway.app" >> .env.production
```

3. **Deploy to Vercel**

```bash
vercel --prod
```

**Or via Vercel Dashboard:**

1. Import project từ GitHub
2. Framework Preset: Vite
3. Root Directory: `frontend`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Environment Variables:
   - `VITE_API_URL`: Your backend URL
   - `VITE_SOCKET_URL`: Your backend URL
   - `VITE_APP_NAME`: ERP Video Chat Room
   - `VITE_STUN_SERVERS`: stun:stun.l.google.com:19302

---

## 🐳 Railway Deployment (Full Stack)

Railway hỗ trợ Docker và có thể deploy cả frontend + backend.

### Option 1: Monorepo với Docker Compose

1. Create new project on Railway
2. Add MongoDB plugin
3. Deploy from GitHub:
   - Railway sẽ tự detect `docker-compose.yml`
   - Add environment variables
4. Done!

### Option 2: Separate Services

**Backend Service:**

1. New service → Deploy from GitHub
2. Root directory: `backend`
3. Add environment variables
4. Deploy

**Frontend Service:**

1. New service → Deploy from GitHub
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Start command: `npx serve -s dist -l 80`
5. Deploy

---

## 🔧 Environment Variables

### Backend (.env)

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=*
GRACE_PERIOD_MS=5000
```

### Frontend (.env.production)

```env
VITE_API_URL=https://your-backend-url.com
VITE_SOCKET_URL=https://your-backend-url.com
VITE_APP_NAME=ERP Video Chat Room
VITE_APP_VERSION=1.0.0
VITE_DEV_MODE=false
VITE_LOG_LEVEL=error
VITE_STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
```

---

## 🔍 Health Checks

- Backend: `GET /health` → `{"status":"ok","timestamp":"..."}`
- Frontend: `GET /health` → `healthy`

---

## 📊 Monitoring

### Docker Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

### Container Stats

```bash
docker stats
```

---

## 🛠️ Troubleshooting

### CORS Issues

- Ensure `CORS_ORIGIN` in backend matches your frontend URL
- For development: `CORS_ORIGIN=*`
- For production: `CORS_ORIGIN=https://your-frontend.vercel.app`

### WebSocket Connection Failed

- Check backend URL in frontend env
- Ensure backend supports WebSocket (Railway, Render do)
- Vercel backend won't work for Socket.io

### MongoDB Connection

- Use MongoDB Atlas for cloud database
- Whitelist IP: `0.0.0.0/0` for Railway/Render
- Check connection string format

---

## 🎯 Recommended Stack

**Best Setup:**

- **Frontend**: Vercel (fast, free, CDN)
- **Backend**: Railway (WebSocket support, easy deploy)
- **Database**: MongoDB Atlas (free tier, managed)

**Alternative:**

- **Full Stack**: Railway with Docker Compose
- **Full Stack**: DigitalOcean App Platform
- **Full Stack**: Render (slower but free)

---

## 📝 Notes

- Frontend build size: ~2-3MB (gzipped)
- Backend requires persistent WebSocket connections
- MongoDB Atlas free tier: 512MB storage
- Railway free tier: 500 hours/month
- Vercel free tier: Unlimited bandwidth

---

## 🚦 Production Checklist

- [ ] Environment variables configured
- [ ] MongoDB connection tested
- [ ] CORS settings correct
- [ ] Health checks working
- [ ] SSL/HTTPS enabled
- [ ] Error logging setup
- [ ] Backup strategy for database
- [ ] Domain configured (optional)
