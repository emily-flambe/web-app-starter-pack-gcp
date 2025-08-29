#!/bin/bash

# Web App Starter Pack - Quick Setup (for experienced users)
# Assumes you have Node.js, npm, and Wrangler already installed and configured

set -e

echo "Quick setup starting..."

# Install dependencies (including Wrangler v4)
echo "Installing dependencies with Wrangler v4..."
npm install
npm install --save-dev wrangler@latest

# Copy environment files
cp .env.example .env.local 2>/dev/null || true
cp .dev.vars.example .dev.vars 2>/dev/null || true

# Create D1 database (using npx to ensure wrangler is available)
echo "Creating D1 database..."
DB_OUTPUT=$(npx wrangler d1 create app-database 2>&1) || true
DB_ID=$(echo "$DB_OUTPUT" | grep -o 'database_id = "[^"]*"' | sed 's/database_id = "\(.*\)"/\1/')

if [ -n "$DB_ID" ]; then
    # Update wrangler.toml with the database ID
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/YOUR_DATABASE_ID_HERE/$DB_ID/g" wrangler.toml
    else
        sed -i "s/YOUR_DATABASE_ID_HERE/$DB_ID/g" wrangler.toml
    fi
    echo "Database created with ID: $DB_ID"
else
    echo "Database might already exist or creation failed. Check 'npx wrangler d1 list'"
fi

# Initialize database schema
npx wrangler d1 execute app-database --local --file=./db/schema.sql
npx wrangler d1 execute app-database --local --file=./db/seed.sql

# Build frontend
npm run build

echo ""
echo "Setup complete! Start development with:"
echo "  npm run dev        # Frontend on http://localhost:5173"
echo "  npx wrangler dev   # Backend on http://localhost:8787"
echo ""
echo "Or run both: make dev"