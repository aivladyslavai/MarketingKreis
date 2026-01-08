#!/bin/bash

# Marketing Kreis - Swiss Marketing Platform
# Quick Start Script

echo "🇨🇭 Marketing Kreis - Swiss Marketing Platform"
echo "============================================="

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Setup environment files
if [ ! -f ".env" ]; then
    echo "⚙️  Setting up environment files..."
    cp env.example .env
    echo "✅ Created .env file from template"
    echo "📝 Please edit .env file with your configuration"
fi

# Setup database
echo "🗄️  Setting up database..."
cd backend

if [ ! -f "prisma/dev.db" ]; then
    echo "📊 Generating Prisma client..."
    npx prisma generate
    
    echo "🔄 Running database migrations..."
    npx prisma migrate dev --name init
    
    echo "🌱 Seeding database with sample data..."
    npx prisma db seed
else
    echo "✅ Database already exists"
fi

cd ..

echo ""
echo "🚀 Setup complete! You can now start the application:"
echo ""
echo "Option 1 - Using Docker (Recommended):"
echo "  docker compose up --build"
echo ""
echo "Option 2 - Local development:"
echo "  npm run dev"
echo ""
echo "The application will be available at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
echo "  API Docs: http://localhost:3001/api/docs"
echo ""
echo "🎯 Demo Login Credentials:"
echo "  Admin:   admin@marketingkreis.ch / password123"
echo "  Manager: manager@marketingkreis.ch / password123"
echo "  Editor:  editor@marketingkreis.ch / password123"
echo ""
echo "Enjoy building your Swiss marketing platform! 🇨🇭✨"
