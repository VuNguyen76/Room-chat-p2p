# 🚀 Deploy với Vercel + Railway

## ⚠️ Lưu ý quan trọng

**Vercel KHÔNG hỗ trợ WebSocket/Socket.io!**

App này dùng Socket.io cho real-time video chat, nên:

- **Frontend** → Vercel ✅
- **Backend** → Railway (hỗ trợ WebSocket) ✅

---

## 📋 Tổng quan

| Service  | Platform | Thời gian | Chi phí                |
| -------- | -------- | --------- | ---------------------- |
| Backend  | Railway  | 3 phút    | Free ($5 credit/month) |
| Frontend | Vercel   | 2 phút    | Free                   |

**Tổng: 5 phút, $0**

---

## 🚂 Bước 1: Deploy Backend lên Railway (3 phút)

### 1.1 Tạo tài khoản Railway

- Vào [railway.app](https://railway.app)
- Sign up với GitHub

### 1.2 Tạo Project mới

1. Click **"New Project"**
2. Chọn **"Deploy from GitHub repo"**
3. Chọn repository của bạn
4. **Quan trọng**: Chọn **Root Directory** = `backend`

### 1.3 Add MongoDB

1. Trong project, click **"New"** → **"Database"** → **"MongoDB"**
2. Đợi MongoDB khởi tạo
3. Click vào MongoDB service → **Variables** tab
4. Copy `MONGODB_URL`

### 1.4 Configure Backend Environment

1. Click vào Backend service → **Variables** tab
2. Add các variables:

```
MONGODB_URI = <paste MONGODB_URL từ bước trên>
NODE_ENV = production
PORT = 5000
CORS_ORIGIN = *
GRACE_PERIOD_MS = 5000
```

### 1.5 Generate Domain

1. Backend service → **Settings** tab
2. Scroll xuống **Networking** → **Generate Domain**
3. Copy URL (vd: `https://your-app.up.railway.app`)
4. **LƯU URL NÀY** - cần cho Frontend!

---

## ▲ Bước 2: Deploy Frontend lên Vercel (2 phút)

### 2.1 Tạo tài khoản Vercel

- Vào [vercel.com](https://vercel.com)
- Sign up với GitHub

### 2.2 Import Project

1. Click **"Add New..."** → **"Project"**
2. Import repository từ GitHub
3. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 2.3 Add Environment Variables

Trong **Environment Variables** section, add:

```
VITE_API_URL = https://your-app.up.railway.app (URL từ Railway)
VITE_SOCKET_URL = https://your-app.up.railway.app
VITE_APP_NAME = ERP Video Chat Room
VITE_APP_VERSION = 1.0.0
VITE_DEV_MODE = false
VITE_LOG_LEVEL = error
VITE_STUN_SERVERS = stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
```

### 2.4 Deploy

1. Click **"Deploy"**
2. Đợi 1-2 phút
3. Done! 🎉

---

## 🔧 Bước 3: Update CORS (Quan trọng!)

Sau khi có Vercel URL:

1. Quay lại **Railway** → Backend service → **Variables**
2. Update `CORS_ORIGIN`:

```
CORS_ORIGIN = https://your-app.vercel.app
```

3. Railway sẽ tự động redeploy

---

## ✅ Kết quả

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.up.railway.app`
- **API Health**: `https://your-app.up.railway.app/health`

---

## 🧪 Test

1. Mở Frontend URL
2. Tạo room mới
3. Copy room link
4. Mở trong tab/browser khác
5. Join room
6. Test video chat!

---

## 💰 Chi phí

### Railway (Backend)

- Free tier: $5 credit/month
- Estimated usage: $3-4/month
- **Có thể dùng free nếu traffic thấp**

### Vercel (Frontend)

- Free tier: Unlimited
- **Hoàn toàn miễn phí**

### MongoDB (Railway Plugin)

- Included trong Railway
- Hoặc dùng MongoDB Atlas free tier

**Tổng: $0 - $4/month**

---

## 🔄 Auto Deploy

### Vercel

- Tự động deploy khi push code lên GitHub
- Preview deployments cho PRs

### Railway

- Tự động deploy khi push code
- Có thể disable trong Settings

---

## 🐛 Troubleshooting

### Frontend không connect được Backend

1. **Check VITE_API_URL** có đúng format `https://...` không
2. **Check CORS_ORIGIN** trong Railway có đúng Vercel URL không
3. **Rebuild Frontend** sau khi update env variables:
   - Vercel Dashboard → Deployments → Redeploy

### WebSocket connection failed

1. Ensure backend đang chạy (check Railway logs)
2. Check VITE_SOCKET_URL đúng chưa
3. Railway hỗ trợ WebSocket, không cần config thêm

### MongoDB connection failed

1. Check MONGODB_URI format
2. Ensure MongoDB service đang chạy trong Railway
3. Test: Railway → Backend → Logs

### Build failed on Vercel

1. Check build logs
2. Ensure `frontend/package.json` có đủ dependencies
3. Test local: `cd frontend && npm run build`

---

## 📱 Custom Domain (Optional)

### Vercel

1. Project Settings → Domains
2. Add domain
3. Update DNS records

### Railway

1. Service Settings → Custom Domain
2. Add CNAME record
3. SSL tự động

---

## 🎯 Tips

1. **Dùng MongoDB Atlas** thay Railway MongoDB để tiết kiệm credits
2. **Enable Vercel Analytics** để monitor frontend
3. **Check Railway usage** thường xuyên
4. **Setup UptimeRobot** để monitor backend health

---

## 📚 Links

- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

## ❓ FAQ

**Q: Tại sao không deploy backend lên Vercel?**
A: Vercel Serverless không hỗ trợ WebSocket. App này cần Socket.io cho real-time.

**Q: Railway có free không?**
A: Có $5 credit/month, đủ cho small apps.

**Q: Có thể dùng Vercel cho cả 2 không?**
A: Không với app này vì cần WebSocket. Nếu chỉ dùng REST API thì được.

**Q: Deploy mất bao lâu?**
A: Railway: 2-3 phút, Vercel: 1-2 phút.

---

**Tổng thời gian: ~5 phút** 🚀
