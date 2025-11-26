# 🐳 Docker Deployment Guide

## 📋 Files Created

### Docker Files

- `backend/Dockerfile` - Backend container config
- `frontend/Dockerfile` - Frontend multi-stage build
- `docker-compose.yml` - Orchestration config
- `.dockerignore` - Ignore files for Docker
- `backend/.dockerignore` - Backend specific ignores
- `frontend/.dockerignore` - Frontend specific ignores

### Nginx Config

- `frontend/nginx.conf` - Production web server config

### Deployment Configs

- `backend/railway.json` - Railway platform config
- `backend/render.yaml` - Render platform config
- `frontend/vercel.json` - Vercel platform config

### Scripts

- `scripts/build.sh` - Production build script
- `scripts/deploy-docker.sh` - Docker deployment script

### Documentation

- `README.md` - Project overview
- `DEPLOYMENT.md` - Detailed deployment guide
- `DOCKER-GUIDE.md` - This file

---

## 🚀 Quick Start

### 1. Local Development (No Docker)

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

### 2. Docker Development

```bash
# Build and run
docker-compose up

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### 3. Production Deployment

**Option A: Docker Compose (VPS/Cloud)**

```bash
# Run deployment script
./scripts/deploy-docker.sh

# Or manually
docker-compose -f docker-compose.yml up -d
```

**Option B: Vercel + Railway**

```bash
# Deploy backend to Railway
cd backend
railway up

# Deploy frontend to Vercel
cd frontend
vercel --prod
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Internet                       │
└────────────┬────────────────────────┬───────────┘
             │                        │
             │                        │
    ┌────────▼────────┐      ┌───────▼────────┐
    │   Frontend      │      │    Backend     │
    │   (Nginx)       │◄────►│  (Node.js)     │
    │   Port 80       │      │   Port 5000    │
    └─────────────────┘      └────────┬────────┘
                                      │
                             ┌────────▼────────┐
                             │    MongoDB      │
                             │   (Atlas)       │
                             └─────────────────┘
```

---

## 📦 Container Details

### Backend Container

- **Base Image**: `node:20-alpine`
- **Port**: 5000
- **Health Check**: `/health` endpoint
- **Size**: ~150MB
- **Restart Policy**: unless-stopped

### Frontend Container

- **Build Stage**: `node:20-alpine`
- **Runtime Stage**: `nginx:alpine`
- **Port**: 80
- **Size**: ~25MB (nginx + static files)
- **Restart Policy**: unless-stopped

---

## 🔧 Environment Variables

### Required for Backend

```env
MONGODB_URI=mongodb://...
```

### Optional

```env
PORT=5000
NODE_ENV=production
CORS_ORIGIN=*
GRACE_PERIOD_MS=5000
```

---

## 📊 Docker Commands Cheat Sheet

### Build

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend

# Build without cache
docker-compose build --no-cache
```

### Run

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Start specific service
docker-compose up backend
```

### Logs

```bash
# View all logs
docker-compose logs

# Follow logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100
```

### Stop/Remove

```bash
# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove with volumes
docker-compose down -v

# Remove images too
docker-compose down --rmi all
```

### Inspect

```bash
# List running containers
docker-compose ps

# Container stats
docker stats

# Inspect service
docker-compose exec backend sh
docker-compose exec frontend sh
```

---

## 🔍 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs backend

# Check if port is in use
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Mac/Linux

# Rebuild
docker-compose build --no-cache backend
docker-compose up backend
```

### MongoDB connection failed

```bash
# Check environment variables
docker-compose config

# Test connection
docker-compose exec backend node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('OK')).catch(e => console.log(e))"
```

### Frontend can't connect to backend

```bash
# Check network
docker network ls
docker network inspect video-chat-network

# Check CORS settings
curl -I http://localhost:5000/health
```

### Out of disk space

```bash
# Clean up
docker system prune -a

# Remove unused volumes
docker volume prune

# Check disk usage
docker system df
```

---

## 🎯 Production Best Practices

### 1. Use Multi-stage Builds ✅

Frontend Dockerfile uses multi-stage build to minimize image size.

### 2. Health Checks ✅

Both services have health checks configured.

### 3. Restart Policies ✅

Containers restart automatically on failure.

### 4. Security Headers ✅

Nginx configured with security headers.

### 5. Gzip Compression ✅

Nginx enables gzip for better performance.

### 6. Static Asset Caching ✅

Long cache times for immutable assets.

### 7. Non-root User ❌

Consider adding non-root user in Dockerfile:

```dockerfile
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs
```

### 8. Secrets Management ⚠️

Use Docker secrets or environment variables, never hardcode.

---

## 📈 Scaling

### Horizontal Scaling (Multiple Instances)

For Socket.io, you need Redis adapter:

```bash
# Add to docker-compose.yml
redis:
  image: redis:alpine
  ports:
    - "6379:6379"
```

Update backend to use Redis adapter for Socket.io clustering.

### Vertical Scaling (More Resources)

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 2G
        reservations:
          cpus: "1"
          memory: 1G
```

---

## 🔐 Security Checklist

- [ ] Use environment variables for secrets
- [ ] Enable HTTPS (use reverse proxy like Traefik/Nginx)
- [ ] Set proper CORS origins
- [ ] Use security headers (already configured)
- [ ] Keep dependencies updated
- [ ] Scan images for vulnerabilities: `docker scan`
- [ ] Use non-root user in containers
- [ ] Limit container resources
- [ ] Enable Docker Content Trust
- [ ] Use private registry for images

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)

---

## 💡 Tips

1. **Development**: Use `docker-compose.override.yml` for dev-specific configs
2. **Logs**: Use log aggregation service in production (Datadog, Loggly)
3. **Monitoring**: Add Prometheus + Grafana for metrics
4. **Backups**: Automate MongoDB backups
5. **CI/CD**: Use GitHub Actions for automated deployments
