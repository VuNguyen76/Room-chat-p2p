#!/bin/bash

# Docker deployment script

echo "🐳 Deploying with Docker..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please copy .env.example to .env and configure it."
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build images
echo "🏗️  Building Docker images..."
docker-compose build --no-cache

# Start containers
echo "🚀 Starting containers..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
echo "🔍 Checking service health..."
docker-compose ps

echo ""
echo "✅ Deployment completed!"
echo ""
echo "Frontend: http://localhost"
echo "Backend: http://localhost:5000"
echo "Health: http://localhost:5000/health"
echo ""
echo "View logs: docker-compose logs -f"
