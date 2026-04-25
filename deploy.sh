#!/bin/bash

# Goldfish Vercel Deployment Script
echo "🚀 Deploying Goldfish to Vercel"
echo "==============================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed."
    echo "Please install it with: npm i -g vercel"
    exit 1
fi

# Check if logged in to Vercel
echo "🔍 Checking Vercel login status..."
vercel whoami >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "🔐 Please login to Vercel:"
    vercel login
fi

# Check for .env.local file
if [ ! -f ".env.local" ]; then
    echo "⚠️  No .env.local file found."
    echo "📝 Creating .env.local from template..."
    cp .env.local.example .env.local
    echo "✅ Created .env.local"
    echo ""
    echo "🚨 IMPORTANT: Please edit .env.local and add your OpenAI API key before deploying"
    echo "   Get your key from: https://platform.openai.com/api-keys"
    echo ""
    read -p "Press Enter after you've added your OpenAI API key to .env.local..."
else
    echo "✅ .env.local file found"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo "This may take a few minutes..."

vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo ""
    echo "📋 Post-deployment steps:"
    echo "1. Go to your Vercel dashboard"
    echo "2. Select your Goldfish project"
    echo "3. Go to Settings → Environment Variables"
    echo "4. Add your OpenAI API key:"
    echo "   - Name: OPENAI_API_KEY"
    echo "   - Value: your_openai_api_key_here"
    echo "   - Environments: Production, Preview, Development"
    echo "5. Redeploy your project"
    echo ""
    echo "Your app will be ready to use after adding the API key!"
else
    echo ""
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi