#!/bin/bash

# Development server launcher
# Starts both frontend and backend servers with proper output formatting

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Sync remote database to local
echo -e "${BLUE}Syncing remote database to local...${NC}"
./scripts/db-sync.sh

echo ""
echo -e "${GREEN}Starting development servers...${NC}"
echo ""
echo -e "${BLUE}Frontend:${NC} http://localhost:5173"
echo -e "${BLUE}Backend:${NC}  http://localhost:8787"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill 0
}

trap cleanup EXIT

# Start frontend in background
npm run dev &

# Give frontend a moment to start
sleep 2

# Start backend (wrangler) in foreground
npx wrangler dev