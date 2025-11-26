# 🚂 Railway Deployment - Full Stack (1 Click)

Railway là platform tốt nhất để deploy cả frontend + backend cùng lúc với Docker support và WebSocket.

## ✨ Tại sao chọn Railway?

- ✅ Deploy cả FE + BE cùng lúc
- ✅ Hỗ trợ Docker Compose
- ✅ Hỗ trợ WebSocket/Socket.io
- ✅ Free tier: 500 hours/month ($5 credit)
- ✅ Auto SSL/HTTPS
- ✅ Tự động detect và deploy
- ✅ MongoDB plugin có sẵn
- ✅ Logs và monitoring tốt

---

## 🚀 Deploy trong 5 phút

### Bước 1: Chuẩn bị

1. **Tạo tài khoản Railway**

   - Truy cập [railway.app](https://railway.app)
   - Sign up với GitHub

2. **Push code lên GitHub**
   ```bash
   git add .
   git commit -m "Ready for Railway deployment"
   git push origin main
   ```

### Bước 2: Deploy

**Option A: Deploy với Docker Compose (Recommended)**

1. Vào Railway Dashboard
2. Click **"New Project"**
3. Chọn **"Deploy from GitHub repo"**
4. Chọn repository của bạn
5. Railway sẽ tự động detect `docker-compose.yml`
6. Click **"Deploy"**

Railway sẽ tự động:

- Tạo 2 services (backend + frontend)
- Build Docker images
- Deploy cả 2 services
- Tạo public URLs

**Option B: Deploy từng service riêng**

1. **Deploy Backend:**

   - New Project → Deploy from GitHub
   - Chọn repo
   - Root Directory: `backend`
   - Railway auto-detect Node.js
   - Deploy!

2. **Deploy Frontend:**
   - Add Service → Deploy from GitHub
   - Chọn cùng repo
   - Root Directory: `frontend`
   - Railway auto-detect Vite
   - Deploy!

### Bước 3: Thêm MongoDB

1. Click **"New"** → **"Database"** → **"Add MongoDB"**
2. Railway tự động tạo MongoDB instance
3. Copy connection string từ MongoDB service
4. Paste vào Backend environment variables

### Bước 4: Configure Environment Variables

**Backend Service:**

```
MONGODB_URI=<from Railway MongoDB plugin>
CORS_ORIGIN=*
NODE_ENV=production
PORT=5000
GRACE_PERIOD_MS=5000
```

**Frontend Service:**

```
VITE_API_URL=<backend-url-from-railway>
VITE_SOCKET_URL=<backend-url-from-railway>
VITE_APP_NAME=ERP Video Chat Room
VITE_STUN_SERVERS=stun:stun.l.google.com:19302
```

### Bước 5: Generate Domain

1. Vào Backend service → **Settings** → **Generate Domain**
2. Copy URL (vd: `https://your-app.railway.app`)
3. Paste vào Frontend env: `VITE_API_URL` và `VITE_SOCKET_URL`
4. Redeploy Frontend

### Bước 6: Done! 🎉

- Frontend URL: `https://your-frontend.railway.app`
- Backend URL: `https://your-backend.railway.app`
- Test: Mở frontend URL và tạo room!

---

## 🔧 Railway CLI (Advanced)

### Install CLI

```bash
npm i -g @railway/cli
```

### Login

```bash
railway login
```

### Deploy

```bash
# Deploy all services
railway up

# Deploy specific service
railway up --service backend
railway up --service frontend
```

### Logs

```bash
# View logs
railway logs

# Follow logs
railway logs -f
```

### Environment Variables

```bash
# List variables
railway variables

# Set variable
railway variables set MONGODB_URI=mongodb://...
```

---

## 📊 Monitoring

### View Logs

1. Vào service trong Railway dashboard
2. Tab **"Deployments"**
3. Click vào deployment
4. Xem logs real-time

### Metrics

- CPU usage
- Memory usage
- Network traffic
- Request count

### Alerts

Railway tự động alert khi:

- Service down
- High memory usage
- Deployment failed

---

## 💰 Pricing

### Free Tier (Hobby Plan)

- $5 credit/month (≈ 500 hours)
- Unlimited projects
- Unlimited services
- 1GB RAM per service
- 1 vCPU per service
- 100GB bandwidth

### Usage Estimate

- Backend: ~$3-4/month
- Frontend: ~$1-2/month
- MongoDB: ~$2-3/month
- **Total: ~$6-9/month** (có thể dùng free tier nếu traffic thấp)

### Tips để tiết kiệm

1. Dùng MongoDB Atlas free tier thay vì Railway MongoDB
2. Deploy frontend lên Vercel (free)
3. Chỉ deploy backend trên Railway

---

## 🔄 Auto Deploy

Railway tự động deploy khi:

- Push code lên GitHub
- Merge pull request
- Update environment variables

Disable auto-deploy:

1. Service Settings
2. Uncheck **"Auto Deploy"**

---

## 🐛 Troubleshooting

### Service không start

```bash
# Check logs
railway logs --service backend

# Check environment variables
railway variables --service backend

# Restart service
railway restart --service backend
```

### MongoDB connection failed

1. Check MONGODB_URI format
2. Whitelist Railway IPs (nếu dùng Atlas)
3. Test connection:
   ```bash
   railway run node -e "require('mongoose').connect(process.env.MONGODB_URI)"
   ```

### Frontend không connect được backend

1. Check VITE_API_URL và VITE_SOCKET_URL
2. Ensure backend URL có `https://`
3. Check CORS settings trong backend
4. Rebuild frontend sau khi update env

### Out of credits

1. Upgrade to Pro plan ($20/month)
2. Hoặc deploy frontend lên Vercel (free)
3. Optimize resource usage

---

## 🎯 Best Practices

### 1. Use Environment Variables

Không hardcode URLs, dùng env variables.

### 2. Enable Health Checks

Railway tự động check `/health` endpoint.

### 3. Set Resource Limits

```toml
# railway.toml
[deploy]
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### 4. Use MongoDB Atlas

Free tier tốt hơn Railway MongoDB:

- 512MB storage
- Shared cluster
- Auto backups

### 5. Monitor Usage

Check usage thường xuyên để tránh hết credits.

### 6. Use Custom Domain (Optional)

1. Settings → Custom Domain
2. Add CNAME record
3. Railway auto-provision SSL

---

## 🔐 Security

### Environment Variables

- Không commit `.env` files
- Dùng Railway dashboard để set secrets
- Rotate credentials định kỳ

### CORS

```env
# Development
CORS_ORIGIN=*

# Production
CORS_ORIGIN=https://your-frontend.railway.app
```

### Rate Limiting

Backend đã có rate limiting middleware.

### HTTPS

Railway tự động enable HTTPS cho tất cả services.

---

## 📈 Scaling

### Vertical Scaling

1. Service Settings
2. Increase RAM/CPU
3. Redeploy

### Horizontal Scaling (Pro Plan)

1. Add Redis for Socket.io adapter
2. Deploy multiple backend instances
3. Use load balancer

---

## 🆚 Railway vs Others

| Feature     | Railway    | Vercel     | Render   | Heroku |
| ----------- | ---------- | ---------- | -------- | ------ |
| Docker      | ✅         | ❌         | ✅       | ✅     |
| WebSocket   | ✅         | ❌         | ✅       | ✅     |
| Free Tier   | $5/mo      | ✅         | ✅       | ❌     |
| Auto Deploy | ✅         | ✅         | ✅       | ✅     |
| Ease of Use | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Speed       | Fast       | Fastest    | Medium   | Medium |

**Verdict:** Railway tốt nhất cho full-stack app với WebSocket!

---

## 📚 Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Railway Templates](https://railway.app/templates)
- [Railway Blog](https://blog.railway.app/)

---

## 💡 Pro Tips

1. **Use Railway Templates**: Có sẵn templates cho Node.js + React
2. **Connect GitHub**: Auto-deploy khi push code
3. **Use Staging Environment**: Tạo branch `staging` để test
4. **Monitor Costs**: Check usage dashboard hàng ngày
5. **Backup Database**: Export MongoDB data định kỳ
6. **Use CDN**: Serve static assets từ CDN (Cloudflare)
7. **Optimize Images**: Compress images trước khi deploy
8. **Enable Caching**: Cache API responses khi có thể

---

## 🎬 Video Tutorial

Coming soon! Subscribe để nhận thông báo.

---

## ❓ FAQ

**Q: Railway có free tier không?**
A: Có, $5 credit/month (≈ 500 hours runtime).

**Q: Có thể dùng custom domain không?**
A: Có, miễn phí với SSL auto-provision.

**Q: Có giới hạn bandwidth không?**
A: Free tier: 100GB/month. Pro: Unlimited.

**Q: Deploy mất bao lâu?**
A: 2-5 phút cho lần đầu, 1-2 phút cho updates.

**Q: Có thể rollback không?**
A: Có, click vào deployment cũ và redeploy.

**Q: Hỗ trợ WebSocket không?**
A: Có, full support cho Socket.io và WebSocket.

---

## 🎉 Kết luận

Railway là lựa chọn tốt nhất để deploy full-stack app với:

- ✅ Setup đơn giản (5 phút)
- ✅ Hỗ trợ Docker + WebSocket
- ✅ Free tier hào phóng
- ✅ Auto-deploy từ GitHub
- ✅ Monitoring tốt

**Ready to deploy? Let's go! 🚀**
