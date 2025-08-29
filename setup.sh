#!/bin/bash

# Web App Starter Pack - Setup Script
# This script will walk you through setting up the application with Cloudflare Workers and D1

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "================================================"
echo "   Web App Starter Pack - Setup Assistant"
echo "================================================"
echo ""

# Step 1: Check prerequisites
print_step "Checking prerequisites..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js is not installed. Please install Node.js 20.11.0 or later."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_success "npm installed: $NPM_VERSION"
else
    print_error "npm is not installed."
    exit 1
fi

# Check if wrangler is installed and is v4 or higher
if [ -f "node_modules/.bin/wrangler" ]; then
    WRANGLER_VERSION=$(npx wrangler --version 2>&1 | head -n 1)
    MAJOR_VERSION=$(echo $WRANGLER_VERSION | cut -d. -f1)
    if [ "$MAJOR_VERSION" -ge 4 ]; then
        print_success "Wrangler v4+ installed: $WRANGLER_VERSION"
        WRANGLER_CMD="npx wrangler"
    else
        print_warning "Wrangler v3 detected. Updating to v4..."
        npm install --save-dev wrangler@latest
        WRANGLER_VERSION=$(npx wrangler --version 2>&1 | head -n 1)
        print_success "Updated to Wrangler: $WRANGLER_VERSION"
        WRANGLER_CMD="npx wrangler"
    fi
else
    print_warning "Wrangler not found. Installing v4..."
    npm install --save-dev wrangler@latest
    WRANGLER_CMD="npx wrangler"
    WRANGLER_VERSION=$(npx wrangler --version 2>&1 | head -n 1)
    print_success "Wrangler v4 installed: $WRANGLER_VERSION"
fi

echo ""

# Step 2: Install dependencies
print_step "Installing project dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
    print_success "Dependencies installed"
else
    print_success "Dependencies already installed (run 'npm ci' to reinstall)"
fi

echo ""

# Step 3: Setup environment files
print_step "Setting up environment files..."

if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        print_success "Created .env.local from .env.example"
    else
        echo "VITE_API_URL=http://localhost:8787" > .env.local
        print_success "Created .env.local with default values"
    fi
else
    print_success ".env.local already exists"
fi

if [ ! -f ".dev.vars" ]; then
    if [ -f ".dev.vars.example" ]; then
        cp .dev.vars.example .dev.vars
        print_success "Created .dev.vars from .dev.vars.example"
    else
        touch .dev.vars
        print_success "Created empty .dev.vars"
    fi
else
    print_success ".dev.vars already exists"
fi

echo ""

# Step 4: Cloudflare authentication
print_step "Checking Cloudflare authentication..."

# Check if already logged in
if $WRANGLER_CMD whoami &> /dev/null; then
    USER=$($WRANGLER_CMD whoami 2>&1 | grep -E "You are logged in" | sed 's/.*as //')
    print_success "Already logged in to Cloudflare"
else
    print_warning "Not logged in to Cloudflare"
    echo ""
    echo "Would you like to login now? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        $WRANGLER_CMD login
        print_success "Logged in to Cloudflare"
    else
        print_warning "Skipping login. You'll need to login before deploying."
    fi
fi

echo ""

# Step 5: Create D1 Database
print_step "Setting up D1 Database..."

# Check if database ID is already configured (check for the placeholder text)
if grep -q "YOUR_DATABASE_ID_HERE\|database_id = \"\"" wrangler.toml; then
    print_warning "D1 Database not configured in wrangler.toml"
    echo ""
    echo "Would you like to create a new D1 database? (y/n)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "Enter a name for your database (default: app-database):"
        read -r db_name
        db_name=${db_name:-app-database}
        
        print_step "Creating D1 database: $db_name"
        
        # Create the database and capture output
        DB_OUTPUT=$($WRANGLER_CMD d1 create "$db_name" 2>&1)
        
        # Extract the database ID from the output
        DB_ID=$(echo "$DB_OUTPUT" | grep -o 'database_id = "[^"]*"' | sed 's/database_id = "\(.*\)"/\1/')
        
        if [ -n "$DB_ID" ]; then
            print_success "Database created with ID: $DB_ID"
            
            # Update wrangler.toml with the database ID
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s/YOUR_DATABASE_ID_HERE/$DB_ID/g" wrangler.toml
            else
                # Linux
                sed -i "s/YOUR_DATABASE_ID_HERE/$DB_ID/g" wrangler.toml
            fi
            
            # Also update the database name if different
            if [ "$db_name" != "app-database" ]; then
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    sed -i '' "s/database_name = \"app-database\"/database_name = \"$db_name\"/g" wrangler.toml
                else
                    sed -i "s/database_name = \"app-database\"/database_name = \"$db_name\"/g" wrangler.toml
                fi
            fi
            
            print_success "Updated wrangler.toml with database configuration"
            
            # Initialize the database schema
            echo ""
            print_step "Initializing database schema..."
            
            # Local database
            $WRANGLER_CMD d1 execute "$db_name" --local --file=./db/schema.sql
            print_success "Local database schema created"
            
            echo ""
            echo "Would you like to also create the schema in the remote database? (y/n)"
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                $WRANGLER_CMD d1 execute "$db_name" --remote --file=./db/schema.sql
                print_success "Remote database schema created"
            fi
            
            # Seed data
            echo ""
            echo "Would you like to add sample data to the database? (y/n)"
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                $WRANGLER_CMD d1 execute "$db_name" --local --file=./db/seed.sql
                print_success "Sample data added to local database"
            fi
        else
            print_error "Failed to create database. Please create it manually."
            echo "Run: $WRANGLER_CMD d1 create $db_name"
            echo "Then update the database_id in wrangler.toml"
        fi
    else
        print_warning "Skipping database creation."
        echo ""
        echo "To create a database manually, run:"
        echo "  $WRANGLER_CMD d1 create app-database"
        echo "Then update the database_id in wrangler.toml"
    fi
else
    print_success "D1 Database already configured in wrangler.toml"
    
    # Get database name from wrangler.toml
    DB_NAME=$(grep "database_name" wrangler.toml | head -1 | sed 's/.*= "\(.*\)"/\1/')
    
    # Check if local database needs initialization
    echo ""
    echo "Would you like to (re)initialize the local database schema? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        $WRANGLER_CMD d1 execute "$DB_NAME" --local --file=./db/schema.sql
        print_success "Local database schema initialized"
        
        echo "Would you like to add sample data? (y/n)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            $WRANGLER_CMD d1 execute "$DB_NAME" --local --file=./db/seed.sql
            print_success "Sample data added"
        fi
    fi
fi

echo ""

# Step 6: Build the frontend
print_step "Building frontend assets..."
echo "Would you like to build the frontend now? (y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    npm run build
    print_success "Frontend built successfully"
else
    print_warning "Skipping frontend build. Run 'npm run build' before deploying."
fi

echo ""

# Step 7: Configure Worker Name
print_step "Worker Configuration..."
CURRENT_NAME=$(grep "^name = " wrangler.toml | head -1 | sed 's/name = "\(.*\)"/\1/')
echo "Current worker name: $CURRENT_NAME"
echo ""
echo "Would you like to change the worker name? (y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "Enter a name for your worker (lowercase, hyphens allowed):"
    read -r worker_name
    
    # Validate worker name (lowercase, numbers, hyphens only)
    if [[ "$worker_name" =~ ^[a-z0-9-]+$ ]]; then
        # Update wrangler.toml with the new worker name
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/^name = \".*\"/name = \"$worker_name\"/g" wrangler.toml
            # Also update environment-specific names
            sed -i '' "s/name = \"web-app-starter-pack-dev\"/name = \"$worker_name-dev\"/g" wrangler.toml
            sed -i '' "s/name = \"web-app-starter-pack-staging\"/name = \"$worker_name-staging\"/g" wrangler.toml
            sed -i '' "s/name = \"web-app-starter-pack\"/name = \"$worker_name\"/g" wrangler.toml
        else
            # Linux
            sed -i "s/^name = \".*\"/name = \"$worker_name\"/g" wrangler.toml
            sed -i "s/name = \"web-app-starter-pack-dev\"/name = \"$worker_name-dev\"/g" wrangler.toml
            sed -i "s/name = \"web-app-starter-pack-staging\"/name = \"$worker_name-staging\"/g" wrangler.toml
            sed -i "s/name = \"web-app-starter-pack\"/name = \"$worker_name\"/g" wrangler.toml
        fi
        print_success "Worker name updated to: $worker_name"
        WORKER_NAME="$worker_name"
    else
        print_error "Invalid worker name. Must contain only lowercase letters, numbers, and hyphens."
        WORKER_NAME="$CURRENT_NAME"
    fi
else
    WORKER_NAME="$CURRENT_NAME"
fi

echo ""

# Step 8: Deploy to Cloudflare Workers
print_step "Deployment..."
echo "Would you like to deploy to Cloudflare Workers now? (y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    print_step "Deploying to Cloudflare Workers..."
    DEPLOY_OUTPUT=$($WRANGLER_CMD deploy 2>&1)
    echo "$DEPLOY_OUTPUT"
    
    # Extract the URL from deployment output
    WORKER_URL=$(echo "$DEPLOY_OUTPUT" | grep -o "https://.*\.workers\.dev" | head -1)
    
    if [ -n "$WORKER_URL" ]; then
        print_success "Worker deployed successfully!"
        echo ""
        echo "Your app is live at: ${GREEN}$WORKER_URL${NC}"
    fi
    
    # Get database name from wrangler.toml
    DB_NAME=$(grep "database_name" wrangler.toml | head -1 | sed 's/.*= "\(.*\)"/\1/')
    
    # Deploy database schema to remote
    echo ""
    echo "Would you like to deploy the database schema to the remote database? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        $WRANGLER_CMD d1 execute "$DB_NAME" --remote --file=./db/schema.sql
        print_success "Remote database schema deployed"
    fi
    
    print_success "Deployment complete! Your app is live at your workers.dev URL"
else
    print_warning "Skipping deployment. Run '$WRANGLER_CMD deploy' when ready."
fi

echo ""

# Step 8: Final instructions
echo "================================================"
echo "   Setup Complete!"
echo "================================================"
echo ""
print_success "Your project is ready for development!"
echo ""
echo "Next steps:"
echo ""
echo "1. Start the development servers:"
echo "   ${BLUE}Frontend:${NC} npm run dev"
echo "   ${BLUE}Backend:${NC}  $WRANGLER_CMD dev"
echo ""
echo "   Or run both with: ${GREEN}make dev${NC}"
echo ""
echo "2. Open your browser:"
echo "   ${BLUE}Frontend:${NC} http://localhost:5173"
echo "   ${BLUE}Backend:${NC}  http://localhost:8787"
echo ""
echo "3. When ready to deploy:"
echo "   ${GREEN}$WRANGLER_CMD deploy${NC}"
echo ""
echo "For more commands, run: ${GREEN}make help${NC}"
echo ""

# Optional: Ask if user wants to start dev servers now
echo "Would you like to start the development servers now? (y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo ""
    print_step "Starting development servers..."
    echo "Press Ctrl+C to stop the servers"
    echo ""
    
    # Start both servers
    npm run dev & $WRANGLER_CMD dev
else
    echo ""
    print_success "Setup complete! Happy coding!"
fi