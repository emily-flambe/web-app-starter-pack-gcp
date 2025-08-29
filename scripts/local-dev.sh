#!/bin/bash

# Simple script to start local development with optional db sync
echo "🚀 Starting local development environment..."

# Ask if user wants to sync database
echo ""
read -p "Do you want to sync the remote database to local? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Syncing database..."
    ./scripts/db-sync.sh
    if [ $? -ne 0 ]; then
        echo "⚠️  Database sync failed, continuing with existing local data..."
    fi
else
    echo "Using existing local database"
fi

echo ""
echo "Starting development servers..."
echo "Frontend: http://localhost:5173 (or next available port)"
echo "Backend:  http://localhost:8787"
echo ""

# Start both servers
npm run dev & npx wrangler dev