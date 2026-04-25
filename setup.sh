#!/bin/bash

# Goldfish App Setup Script
echo "🐠 Welcome to Goldfish Setup!"
echo "=============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo "✅ Frontend dependencies installed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

echo "✅ Backend dependencies installed"

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found in backend/"
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "🚨 IMPORTANT: Please edit backend/.env and add your OpenAI API key"
    echo "   Get your key from: https://platform.openai.com/api-keys"
    echo ""
else
    echo "✅ .env file found"
fi

cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the app:"
echo "  1. Make sure you've added your OpenAI API key to backend/.env"
echo "  2. Run the backend server:"
echo "     cd backend && npm start"
echo "  3. In a new terminal, run the frontend:"
echo "     npm start"
echo "  4. Open http://localhost:3000 in your browser"
echo ""
echo "Happy audio fishing! 🎣🎵"