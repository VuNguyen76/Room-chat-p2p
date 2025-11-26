# 🎨 Render Deployment - Full Stack (Blueprint)

Render là alternative tốt cho Railway, hoàn toàn free tier và dễ deploy.

## ✨ Tại sao chọn Render?

- ✅ Deploy cả FE + BE với Blueprint
- ✅ Hoàn toàn FREE (không cần credit card)
- ✅ Hỗ trợ WebSocket/Socket.io
- ✅ Auto SSL/HTTPS
- ✅ Deploy từ GitHub
- ✅ Static site hosting miễn phí
- ⚠️ Free tier có cold start (50s)

---

## 🚀 Deploy với Blueprint (1 Click)

### Bước 1: Chuẩn bị

1. **Push code lên GitHub**

   ```bash
   git add .
   git commit -m "Ready for Render deployment"
   git push origin main
   ```

2. **Tạo tài khoản Render**
   - Truy cập [render.com](https://render.com)
   - Sign up với GitHub

### Bước 2: Deploy với Blueprint

1. Vào Render Dashboard
2. Click **"New"** → **"Blueprint"**
3. Connect GitHub repository
4. Render sẽ tự động detect `render.yaml`
5. Click **"Apply"**

Render sẽ tự động:

- Tạo 2 services (backend + frontend)
- Setup environment variables
- Deploy cả 2 services
- Tạo public URLs

### Bước 3: Configure MongoDB

**Option A: MongoDB Atlas (Recommended)**

1. Tạo free cluster tại [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Whitelist IP: `0.0.0.0/0`
3. Copy connection string
4. Paste vào Render backend env: `MONGODB_URI`

**Option B: Render MongoDB (Paid)**

- Render không có free MongoDB
- Phải dùng paid plan ($7/month)

### Bước 4: Update Environment Variables

Render tự động set hầu hết variables từ `render.yaml`, chỉ cần:

1. Vào **Backend service** → **Environment**
2. Add: `MONGODB_URI=<your-mongodb-atlas-uri>`
3. Save changes
4. Service sẽ tự động redeploy

### Bước 5: Done! 🎉

- Frontend URL: `https://your-app.onrender.com`
- Backend URL: `https://your-api.onrender.com`
- Test ngay!

---

## 🔧 Manual Setup (Không dùng Blueprint)

### Deploy Backend

1. **New Web Service**
2. Connect GitHub repo
3. Settings:

   - **Name**: video-chat-backend
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Environment Variables**:

   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=<your-mongodb-uri>
   CORS_ORIGIN=*
   GRACE_PERIOD_MS=5000
   ```

5. **Create Web Service**

### Deploy Frontend

1. **New Static Site**
2. Connect GitHub repo
3. Settings:

   - **Name**: video-chat-frontend
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. **Environment Variables**:

   ```
   VITE_API_URL=<backend-url-from-render>
   VITE_SOCKET_URL=<backend-url-from-render>
   VITE_APP_NAME=ERP Video Chat Room
   VITE_STUN_SERVERS=stun:stun.l.google.com:19302
   ```

5. **Create Static Site**

---

## 📊 Monitoring

### View Logs

1. Vào service
2. Tab **"Logs"**
3. Real-time logs

### Metrics

- Request count
- Response times
- Error rates
- Bandwidth usage

### Alerts

Setup email alerts cho:

- Service down
- Deploy failed
- High error rate

---

## 💰 Pricing

### Free Tier

- **Web Services**: Free (với cold start)
- **Static Sites**: Free (no cold start)
- **Bandwidth**: 100GB/month
- **Build Minutes**: 500/month
- **Cold Start**: ~50 seconds

### Paid Plans

- **Starter**: $7/month per service
  - No cold start
  - 512MB RAM
  - Always on
- **Standard**: $25/month per service
  - 2GB RAM
  - Priority support

### Cost Optimization

1. Deploy frontend lên Render (free static)
2. Deploy backend lên Railway ($3-4/month)
3. Hoặc upgrade backend lên Starter ($7/month)

---

## ⚡ Cold Start Issue

Free tier có cold start ~50s khi không có traffic.

**Solutions:**

1. **Upgrade to Paid** ($7/month)

   - No cold start
   - Always on

2. **Use Cron Job** (Keep alive)

   ```bash
   # Ping every 10 minutes
   */10 * * * * curl https://your-api.onrender.com/health
   ```

3. **Use UptimeRobot** (Free)

   - Monitor URL every 5 minutes
   - Keeps service warm

4. **Accept Cold Start**
   - OK cho demo/testing
   - Không OK cho production

---

## 🔄 Auto Deploy

Render tự động deploy khi:

- Push to main branch
- Merge pull request
- Manual trigger

Configure:

1. Service Settings
2. **Auto-Deploy**: Yes/No
3. **Branch**: main

---

## 🐛 Troubleshooting

### Build Failed

```bash
# Check build logs
# Common issues:
- Missing dependencies
- Wrong Node version
- Build command error
```

Fix:

1. Check `package.json`
2. Ensure all dependencies listed
3. Test build locally: `npm run build`

### Service Won't Start

```bash
# Check logs for errors
# Common issues:
- Port binding (use process.env.PORT)
- Missing environment variables
- MongoDB connection failed
```

### Cold Start Too Slow

Options:

1. Upgrade to paid plan
2. Use UptimeRobot
3. Accept it (free tier limitation)

### Frontend Can't Connect Backend

1. Check VITE_API_URL format: `https://...`
2. Ensure backend is running
3. Check CORS settings
4. Rebuild frontend after env change

---

## 🎯 Best Practices

### 1. Use Blueprint

Easiest way to deploy both services.

### 2. MongoDB Atlas

Free tier tốt hơn paid Render MongoDB.

### 3. Static Site for Frontend

Free và không có cold start.

### 4. Health Checks

Render auto-check `/health` endpoint.

### 5. Environment Variables

Dùng Render dashboard, không commit secrets.

### 6. Custom Domain

Free với SSL auto-provision.

---

## 🔐 Security

### HTTPS

Render tự động enable HTTPS.

### Environment Variables

Encrypted at rest và in transit.

### CORS

```env
# Development
CORS_ORIGIN=*

# Production
CORS_ORIGIN=https://your-app.onrender.com
```

### DDoS Protection

Render có built-in DDoS protection.

---

## 🆚 Render vs Railway

| Feature        | Render              | Railway      |
| -------------- | ------------------- | ------------ |
| Free Tier      | ✅ (với cold start) | $5 credit/mo |
| Cold Start     | ⚠️ 50s              | ❌ None      |
| WebSocket      | ✅                  | ✅           |
| Docker         | ✅                  | ✅           |
| Static Hosting | ✅ Free             | ✅ Paid      |
| Ease of Use    | ⭐⭐⭐⭐            | ⭐⭐⭐⭐⭐   |
| Speed          | Medium              | Fast         |

**Verdict:**

- **Render**: Tốt cho demo/testing (free)
- **Railway**: Tốt cho production (paid)

---

## 📚 Resources

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com/)
- [Render Status](https://status.render.com/)
- [Render Blog](https://render.com/blog)

---

## 💡 Pro Tips

1. **Use Blueprint**: Deploy cả 2 services cùng lúc
2. **MongoDB Atlas**: Free tier tốt
3. **UptimeRobot**: Keep service warm
4. **Static Site**: Frontend free, no cold start
5. **Upgrade Backend**: $7/month để remove cold start
6. **Custom Domain**: Free SSL
7. **Preview Environments**: Test PRs trước khi merge

---

## 🎉 Kết luận

Render tốt cho:

- ✅ Demo/Testing (hoàn toàn free)
- ✅ Low-traffic apps
- ✅ Static sites
- ⚠️ Production (cần upgrade để remove cold start)

**Railway tốt hơn cho production apps!**

Nhưng nếu budget = $0, Render là lựa chọn tốt! 🚀
