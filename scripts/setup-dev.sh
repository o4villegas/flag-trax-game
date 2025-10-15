#!/bin/bash
# Setup script for local development with test users

echo "🚀 Setting up flag-trax-game development environment..."
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Run this script from the project root directory"
  exit 1
fi

# Step 1: Apply database migrations
echo "📦 Step 1: Creating database tables..."
npm run db:migrate
if [ $? -ne 0 ]; then
  echo "❌ Failed to create database tables"
  exit 1
fi
echo "✅ Database tables created"
echo ""

# Step 2: Generate password hash (optional - using pre-generated)
echo "🔐 Step 2: Generating password hashes..."
node scripts/hash-password.js
echo ""

# Step 3: Seed test users
echo "👤 Step 3: Creating test users..."
node scripts/seed-test-users.js
if [ $? -ne 0 ]; then
  echo "❌ Failed to seed test users"
  exit 1
fi
echo ""

# Success message
echo "✅ Development environment setup complete!"
echo ""
echo "📝 Test Accounts:"
echo "  • admin@test.com (Admin User) - Password: Test123!"
echo "  • player1@test.com (Player One) - Password: Test123!"
echo "  • player2@test.com (Player Two) - Password: Test123!"
echo ""
echo "🚀 To start development:"
echo "  npm run dev"
echo ""
echo "Then visit: http://localhost:5173/dev-signin"
