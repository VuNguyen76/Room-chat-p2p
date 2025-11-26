# 🚂 Railway Deployment - Correct Guide

Railway **KHÔNG** hỗ trợ Docker Compose trực tiếp. Cần deploy 2 services riêng biệt.

## 🚀 Deploy đúng cách (10 phút)

### Bước 1: Tạo Project và Deploy Backend

1. **Tạo tài khoản Railway**

   - Truy cập [railway.app](https://railway.app)
   - Sign up với GitHub

2. **Create New Project**

   - Click **"New Project"**
   - Chọn **"Deploy from GitHub repo"**
   - Chọn repository của bạn

3. **Configure Backend Service**

   - Railway sẽ hỏi root directory
   - Chọn **"backend"** hoặc configure sau
   - Nếu không hỏi, vào Settings → **Root Directory** → `backend`

4. **Railway sẽ tự động:**
   - Detect Dockerfile
   - Build Docker image
   - Deploy backend
   - Tạo public URL

### Bước 2: Add MongoDB

1. Click **"New"** trong project
2. Chọn **"Database"** → **"Add MongoDB"**
3. Railway tự động tạo MongoDB instance
4. Copy **Connection String** từ MongoDB Variables tab

### Bước 3: Configure Backend Environment

1. Vào **Backend service** → **Variables**
2. Add variables:
   ```
   MONGODB_URI=<paste-connection-string-from-step-2>
   CORS_ORIGIN=*
   NODE_ENV=production
   PORT=5000
   GRACE_PERIOD_MS=5000
   ```
3. Click **"Add"** cho mỗi variable
4. Service sẽ tự động redeploy

### Bước 4: Generate Backend Domain

1. Vào Backend service → **Settings**
2. Scroll xuống **Networking**
3. Click **"Generate Domain"**
4. Copy URL (vd: `https://your-backend.up.railway.app`)
5. **LƯU LẠI URL NÀY** - cần cho frontend!

### Bước 5: Deploy Frontend

1. Trong cùng project, click **"New"**
2. Chọn **"GitHub Repo"** → chọn cùng repo
3. Configure:
   - **Root Directory**: `frontend`
   - Railway sẽ detect Dockerfile

### Bước 6: Configure Frontend Environment

1. Vào **Frontend service** → **Variables**
2. Add variables (dùng backend URL từ Bước 4):
   ```
   VITE_API_URL=https://your-backend.up.railway.app
   VITE_SOCKET_URL=https://your-backend.up.railway.app
   VITE_APP_NAME=ERP Video Chat Room
   VITE_APP_VERSION=1.0.0
   VITE_DEV_MODE=false
   VITE_LOG_LEVEL=error
   VITE_STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
   ```
3. Service sẽ tự động redeploy

### Bước 7: Generate Frontend Domain

1. Vào Frontend service → **Settings**
2. **Networking** → **Generate Domain**
3. Copy URL (vd: `https://your-frontend.up.railway.app`)

### Bước 8: Update CORS (Important!)

1. Quay lại **Backend service** → **Variables**
2. Update `CORS_ORIGIN`:
   ```
   CORS_ORIGIN=https://your-frontend.up.railway.app
   ```
3. Hoặc giữ `*` cho development

### Bước 9: Test! 🎉

1. Mở frontend URL
2. Tạo room
3. Join room
4. Test video chat!

---

## 🔧 Alternative: Deploy without Docker

Nếu Railway báo lỗi với Docker, dùng Nixpacks:

### Backend (No Docker)

1. **Xóa hoặc rename** `backend/Dockerfile` → `backend/Dockerfile.bak`
2. Railway sẽ dùng Nixpacks (auto-detect Node.js)
3. Settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Deploy!

### Frontend (No Docker)

1. **Xóa hoặc rename** `frontend/Dockerfile` → `frontend/Dockerfile.bak`
2. Railway sẽ dùng Nixpacks (auto-detect Vite)
3. Settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve -s dist -l $PORT`
4. Install serve:
   ```bash
   cd frontend
   npm install --save-dev serve
   ```
5. Deploy!

---

## 📊 Project Structure trong Railway

Sau khi setup xong, bạn sẽ có:

```
My Project
├── Backend Service (Node.js)
│   ├── URL: https://backend.up.railway.app
│   └── Variables: MONGODB_URI, CORS_ORIGIN, etc.
├── Frontend Service (Static/Nginx)
│   ├── URL: https://frontend.up.railway.app
│   └── Variables: VITE_API_URL, VITE_SOCKET_URL, etc.
└── MongoDB Database
    └── Connection String: mongodb://...
```

---

## 🐛 Troubleshooting

### Error: "Failed to deploy from source"

**Nguyên nhân:** Railway không thể build Docker image hoặc detect project type.

**Fix:**

1. **Check Dockerfile syntax**

   ```bash
   # Test locally
   cd backend
   docker build -t test .
   ```

2. **Check Root Directory**

   - Settings → Root Directory phải đúng (`backend` hoặc `frontend`)

3. **Try Nixpacks instead**

   - Rename Dockerfile → Dockerfile.bak
   - Railway sẽ auto-detect Node.js/Vite

4. **Check logs**
   - Deployments tab → Click deployment → View logs
   - Tìm error message cụ thể

### Error: "Port binding failed"

**Fix:** Ensure backend dùng `process.env.PORT`:

```javascript
// backend/src/server.js
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Error: "MongoDB connection failed"

**Fix:**

1. Check MONGODB_URI format
2. Ensure MongoDB service đang chạy
3. Test connection:
   ```bash
   railway run node -e "require('mongoose').connect(process.env.MONGODB_URI)"
   ```

### Frontend không connect được Backend

**Fix:**

1. Check VITE_API_URL có `https://` không
2. Ensure backend đang chạy
3. Check CORS_ORIGIN trong backend
4. **Rebuild frontend** sau khi update env variables

### Build quá lâu hoặc timeout

**Fix:**

1. Optimize Dockerfile (use multi-stage build)
2. Reduce dependencies
3. Use `.dockerignore`
4. Try Nixpacks instead

---

## 💰 Cost Estimate

### Free Tier ($5 credit/month)

- Backend: ~$3-4/month
- Frontend: ~$1-2/month
- MongoDB: ~$2-3/month
- **Total: $6-9/month**

### Tips để tiết kiệm:

1. Dùng MongoDB Atlas free tier (thay vì Railway MongoDB)
2. Deploy frontend lên Vercel (free)
3. Chỉ backend trên Railway (~$3-4/month)

---

## 🎯 Best Practices

### 1. Use Environment Variables

Không hardcode URLs hoặc secrets.

### 2. Enable Health Checks

Railway auto-check `/health` endpoint.

### 3. Monitor Usage

Check usage dashboard để tránh hết credits.

### 4. Use MongoDB Atlas

Free tier tốt hơn Railway MongoDB:

- 512MB storage
- Auto backups
- Better performance

### 5. Separate Services

Đừng cố deploy monorepo, tách riêng backend/frontend.

### 6. Use Custom Domain (Optional)

Settings → Custom Domain → Add CNAME.

---

## 🔄 Auto Deploy

Railway tự động deploy khi:

- Push to main branch
- Merge pull request

Disable:

- Settings → Uncheck **"Auto Deploy"**

---

## 📚 Resources

- [Railway Docs](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Railway Templates](https://railway.app/templates)

---

## 💡 Pro Tips

1. **Use Railway CLI** cho faster deployment

   ```bash
   npm i -g @railway/cli
   railway login
   railway up
   ```

2. **Preview Environments** cho PRs

   - Settings → Enable PR Deploys

3. **Custom Domains** miễn phí

   - Add CNAME record
   - Railway auto-provision SSL

4. **Monitor Logs** real-time

   - Deployments → View Logs

5. **Rollback** nếu cần
   - Click deployment cũ → Redeploy

---

## ❓ FAQ

**Q: Railway có hỗ trợ Docker Compose không?**
A: Không trực tiếp. Phải deploy từng service riêng.

**Q: Tại sao không dùng docker-compose.yml?**
A: Railway chỉ support single service per deployment.

**Q: Có thể dùng monorepo không?**
A: Có, nhưng phải set Root Directory cho mỗi service.

**Q: Free tier có đủ không?**
A: Có, nếu traffic thấp (~500 hours/month).

**Q: Deploy mất bao lâu?**
A: 3-5 phút cho lần đầu, 1-2 phút cho updates.

---

## 🎉 Kết luận

Railway vẫn là lựa chọn tốt, chỉ cần:

1. Deploy 2 services riêng (backend + frontend)
2. Configure environment variables đúng
3. Connect services với nhau

**Không phức tạp lắm, chỉ cần làm đúng steps! 🚀**
