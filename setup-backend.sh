#!/bin/bash

# 🚀 Clinic Finance - Complete Backend Setup Script

echo "╔════════════════════════════════════════╗"
echo "║  🏥 Clinic Finance - Setup Script     ║"
echo "╚════════════════════════════════════════╝"

# Check if Docker is running
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✅ Docker found"

# Create .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating .env file..."
    cp backend/.env.example backend/.env
    echo "✅ .env created (update with your values)"
else
    echo "✅ .env already exists"
fi

# Start PostgreSQL
echo ""
echo "🐘 Starting PostgreSQL container..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Install Node dependencies
echo ""
echo "📦 Installing Node.js dependencies..."
cd backend
npm install
cd ..

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
cd backend
npm run migrate 2>/dev/null || echo "ℹ️  Migrations may need manual setup"
cd ..

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  ✅ Setup Complete!                   ║"
echo "╠════════════════════════════════════════╣"
echo "║                                        ║"
echo "║  🌐 PostgreSQL:  localhost:5432       ║"
echo "║  🎨 pgAdmin:     http://localhost:5050║"
echo "║  💻 Backend:     http://localhost:3001║"
echo "║                                        ║"
echo "║  Next: cd backend && npm run dev      ║"
echo "║                                        ║"
echo "╚════════════════════════════════════════╝"
