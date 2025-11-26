# ⚡ Railway Quick Fix - "Error deploying from source"

## 🔴 Lỗi bạn đang gặp

Railway báo: **"There was an error deploying from source"**

## ✅ Solution: Deploy đúng cách

Railway **KHÔNG** hỗ trợ Docker Compose. Cần deploy 2 services riêng.

---

## 🚀 Fix ngay (5 bước)

### 1. Delete project hiện tại (nếu có)

- Vào project → Settings → Delete Project

### 2. Create New Project - Backend

```bash
1. Railway Dashboard → New Project
2. Deploy from GitHub repo
3. Chọn repo của bạn
4. Settings → Root Directory → "backend"
5. Railway sẽ auto-detect Dockerfile và deploy
```

### 3. Add MongoDB

```bash
1. Trong project → New → Database → MongoDB
2. Copy connection string
3. Backend service → Variables → Add:
   MONGODB_URI=<paste-here>
   CORS_ORIGIN=*
   NODE_ENV=production
```

### 4. Generate Backend URL

```bash
1. Backend service → Settings → Generate Domain
2. Copy URL: https://your-backend.up.railway.app
```

### 5. Add Frontend Service

```bash
1. Trong project → New → GitHub Repo → Same repo
2. Settings → Root Directory → "frontend"
3. Variables → Add:
   VITE_API_URL=https://your-backend.up.railway.app
   VITE_SOCKET_URL=https://your-backend.up.railway.app
   VITE_APP_NAME=ERP Video Chat Room
4. Settings → Generate Domain
```

### Done! 🎉

---

## 🔧 Alternative: Không dùng Docker

Nếu vẫn lỗi với Docker:

### Backend

```bash
1. Rename: backend/Dockerfile → backend/Dockerfile.bak
2. Railway sẽ dùng Nixpacks (auto Node.js)
3. Settings:
   - Build: npm install
   - Start: npm start
```

### Frontend

```bash
1. Rename: frontend/Dockerfile → frontend/Dockerfile.bak
2. Add to frontend/package.json:
   "devDependencies": {
     "serve": "^14.2.0"
   }
3. Settings:
   - Build: npm install && npm run build
   - Start: npx serve -s dist -l $PORT
```

---

## 📋 Checklist

- [ ] Xóa project cũ
- [ ] Deploy backend riêng (root: backend)
- [ ] Add MongoDB
- [ ] Configure backend env variables
- [ ] Generate backend domain
- [ ] Deploy frontend riêng (root: frontend)
- [ ] Configure frontend env variables
- [ ] Generate frontend domain
- [ ] Test!

---

## 🎯 Kết quả

Sau khi làm xong:

- Backend: https://your-backend.up.railway.app
- Frontend: https://your-frontend.up.railway.app
- MongoDB: Internal connection

---

## 📚 Chi tiết đầy đủ

Xem [RAILWAY-DEPLOY.md](./RAILWAY-DEPLOY.md) để hiểu rõ hơn.

---

## 💬 Vẫn lỗi?

Check logs:

```bash
1. Service → Deployments
2. Click deployment
3. View Build Logs
4. Tìm error message
```

Common errors:

- **Port binding**: Ensure dùng `process.env.PORT`
- **Missing deps**: Check package.json
- **Build timeout**: Try Nixpacks instead of Docker

---

**TL;DR: Deploy 2 services riêng, không dùng docker-compose!** 🚂
