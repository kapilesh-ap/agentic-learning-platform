#!/bin/bash

echo "🚀 Agentic AI Learning Platform - Setup Script"
echo "=============================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL CLI not found. Make sure PostgreSQL is installed."
else
    echo "✅ PostgreSQL is available"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Setting up environment..."

if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file"
    echo "⚠️  Please edit .env with your credentials:"
    echo "   - DATABASE_URL"
    echo "   - GROQ_API_KEY"
    echo ""
    read -p "Press enter to open .env in your default editor..."
    ${EDITOR:-nano} .env
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🗄️  Setting up database..."
echo "Creating database schema..."
npm run db:push

echo ""
echo "🌱 Seeding database with sample data..."
npm run db:seed

echo ""
echo "=============================================="
echo "✨ Setup complete! Ready to start learning."
echo ""
echo "To run the application:"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo "=============================================="
