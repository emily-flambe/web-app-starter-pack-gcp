#!/bin/bash

# Enhanced script to sync remote D1 database to local development with error handling
set -e  # Exit on error, but we'll trap it for better handling

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Function to check authentication
check_auth() {
    echo "Checking Cloudflare authentication..."
    if ! npx wrangler whoami > /dev/null 2>&1; then
        print_error "Not authenticated with Cloudflare"
        echo ""
        echo "Please run: npx wrangler login"
        return 1
    fi
    return 0
}

# Function to verify database exists
verify_database() {
    echo "Verifying database configuration..."
    local db_name="web-app-starter-pack-db"
    local db_id="6c31a2e4-6dd6-4fec-84ca-290dc9d97c9e"
    
    # Check if database exists in account
    if npx wrangler d1 list 2>/dev/null | grep -q "$db_id"; then
        print_success "Database '$db_name' found (ID: ${db_id:0:8}...)"
        return 0
    else
        print_error "Database not found in your Cloudflare account"
        echo ""
        echo "Database ID in wrangler.toml: $db_id"
        echo ""
        echo "Available databases in your account:"
        npx wrangler d1 list
        return 1
    fi
}

# Function to export database with retry
export_database() {
    local max_retries=3
    local retry_count=0
    local export_file="db/remote-export.sql"
    
    # Create db directory if it doesn't exist
    mkdir -p db
    
    while [ $retry_count -lt $max_retries ]; do
        echo "Attempting to export remote database (attempt $((retry_count + 1))/$max_retries)..."
        
        # Capture both stdout and stderr
        if npx wrangler d1 export web-app-starter-pack-db --remote --output="$export_file" 2>&1 | tee /tmp/wrangler_export.log; then
            if [ -f "$export_file" ]; then
                local file_size=$(wc -c < "$export_file" 2>/dev/null || echo 0)
                if [ "$file_size" -gt 0 ]; then
                    # Format file size (numfmt not available on macOS by default)
                    local size_display=""
                    if [ "$file_size" -lt 1024 ]; then
                        size_display="${file_size}B"
                    elif [ "$file_size" -lt 1048576 ]; then
                        size_display="$((file_size / 1024))KB"
                    else
                        size_display="$((file_size / 1048576))MB"
                    fi
                    print_success "Database exported successfully ($size_display)"
                    return 0
                else
                    print_warning "Export file is empty"
                fi
            else
                print_warning "Export file not created"
            fi
        fi
        
        # Show error details
        print_error "Export attempt failed"
        if [ -f /tmp/wrangler_export.log ]; then
            echo "Error details:"
            grep -i "error" /tmp/wrangler_export.log || true
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $max_retries ]; then
            echo ""
            read -p "Would you like to retry? (y/n): " -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                return 1
            fi
        fi
    done
    
    return 1
}

# Function to import database
import_database() {
    local import_file="db/remote-export.sql"
    
    if [ ! -f "$import_file" ]; then
        print_error "Import file not found: $import_file"
        return 1
    fi
    
    echo "Clearing local database..."
    # Try to clear known tables, but don't fail if they don't exist
    npx wrangler d1 execute web-app-starter-pack-db --local --command="DROP TABLE IF EXISTS todos" 2>/dev/null || true
    npx wrangler d1 execute web-app-starter-pack-db --local --command="DROP TABLE IF EXISTS users" 2>/dev/null || true
    
    echo "Importing to local database..."
    if npx wrangler d1 execute web-app-starter-pack-db --local --file="$import_file"; then
        print_success "Database imported successfully"
        return 0
    else
        print_error "Failed to import database"
        return 1
    fi
}

# Function to handle errors and provide recovery options
handle_error() {
    echo ""
    print_error "Database sync failed!"
    echo ""
    echo "Troubleshooting options:"
    echo "1) Check authentication (npx wrangler login)"
    echo "2) Verify database exists (npx wrangler d1 list)"
    echo "3) Try manual export (npx wrangler d1 export starter-pack --remote)"
    echo "4) Continue with existing local database"
    echo "5) Exit"
    echo ""
    read -p "Choose an option (1-5): " -n 1 -r
    echo ""
    
    case $REPLY in
        1)
            npx wrangler login
            exec "$0" # Restart script
            ;;
        2)
            npx wrangler d1 list
            echo ""
            read -p "Press any key to continue..." -n 1 -r
            exec "$0" # Restart script
            ;;
        3)
            echo "Attempting manual export..."
            npx wrangler d1 export web-app-starter-pack-db --remote --output=db/manual-export.sql
            echo ""
            read -p "Press any key to continue..." -n 1 -r
            ;;
        4)
            print_warning "Continuing with existing local database..."
            exit 0
            ;;
        *)
            exit 1
            ;;
    esac
}

# Main sync process
main() {
    echo "======================================"
    echo "  D1 Database Sync Tool"
    echo "======================================"
    echo ""
    
    # Step 1: Check authentication
    if ! check_auth; then
        handle_error
        exit 1
    fi
    
    # Step 2: Verify database exists
    if ! verify_database; then
        handle_error
        exit 1
    fi
    
    # Step 3: Export database
    if ! export_database; then
        handle_error
        exit 1
    fi
    
    # Step 4: Import to local
    if ! import_database; then
        handle_error
        exit 1
    fi
    
    # Step 5: Cleanup
    if [ -f "db/remote-export.sql" ]; then
        rm -f db/remote-export.sql
        print_info "Cleaned up temporary files"
    fi
    
    echo ""
    print_success "Database sync complete!"
    echo ""
    
    # Show some stats about the sync
    echo "Local database status:"
    npx wrangler d1 execute web-app-starter-pack-db --local --command="SELECT name FROM sqlite_master WHERE type='table';" 2>/dev/null || echo "No tables found"
}

# Trap errors for better handling
trap 'handle_error' ERR

# Run main function
main