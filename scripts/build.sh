#!/bin/bash

# Build script for production

echo "🏗️  Building Video Chat Application..."

# Build backend
echo "📦 Building backend..."
cd backend
npm ci --only=production
cd ..

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm ci
npm run build
cd ..

echo "✅ Build completed!"
echo ""
echo "Backend: ./backend"
echo "Frontend: ./frontend/dist"
