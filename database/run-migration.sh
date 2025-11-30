#!/bin/bash

# Database Migration Runner Script
# Usage: ./run-migration.sh [up|down] [migration_number]
# Example: ./run-migration.sh up 002

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database configuration (from .env or defaults)
DB_USER="${DB_USER:-dwooll94}"
DB_NAME="${DB_NAME:-swat_website}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if psql is installed
check_psql() {
    if ! command -v psql &> /dev/null; then
        print_error "psql is not installed. Please install PostgreSQL client."
        exit 1
    fi
}

# Function to check database connection
check_connection() {
    if ! psql -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -p "$DB_PORT" -c '\q' 2>/dev/null; then
        print_error "Cannot connect to database '$DB_NAME' as user '$DB_USER'"
        print_info "Please check your database credentials and ensure the database is running"
        exit 1
    fi
}

# Function to run a migration
run_migration() {
    local direction=$1
    local migration_number=$2
    local migrations_dir="$(dirname "$0")/migrations"

    if [ "$direction" = "up" ]; then
        local migration_file="${migrations_dir}/${migration_number}_*.sql"
        local action="Applying"
    elif [ "$direction" = "down" ]; then
        local migration_file="${migrations_dir}/${migration_number}_*_rollback.sql"
        local action="Rolling back"
    else
        print_error "Invalid direction. Use 'up' or 'down'"
        exit 1
    fi

    # Find the migration file
    local found_file=$(ls $migration_file 2>/dev/null | head -n 1)

    if [ -z "$found_file" ]; then
        print_error "Migration file not found: $migration_file"
        exit 1
    fi

    print_info "$action migration: $(basename "$found_file")"

    # Run the migration
    if psql -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -p "$DB_PORT" -f "$found_file"; then
        print_info "Migration completed successfully"
    else
        print_error "Migration failed"
        exit 1
    fi
}

# Function to show usage
show_usage() {
    echo "Database Migration Runner"
    echo ""
    echo "Usage: $0 [command] [migration_number]"
    echo ""
    echo "Commands:"
    echo "  up <number>     Apply migration (e.g., ./run-migration.sh up 002)"
    echo "  down <number>   Rollback migration (e.g., ./run-migration.sh down 002)"
    echo "  status          Show migration status"
    echo "  help            Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  DB_USER         Database user (default: dwooll94)"
    echo "  DB_NAME         Database name (default: swat_website)"
    echo "  DB_HOST         Database host (default: localhost)"
    echo "  DB_PORT         Database port (default: 5432)"
    echo ""
    echo "Examples:"
    echo "  $0 up 002       # Apply migration 002"
    echo "  $0 down 002     # Rollback migration 002"
    echo "  $0 status       # Check migration status"
}

# Function to show migration status
show_status() {
    print_info "Checking migration status..."
    echo ""

    # Check if password_reset_tokens table exists
    local table_exists=$(psql -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -p "$DB_PORT" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'password_reset_tokens');" | xargs)

    if [ "$table_exists" = "t" ]; then
        print_info "Migration 002 (password_reset): ${GREEN}APPLIED${NC}"

        # Show table info
        echo ""
        echo "Table structure:"
        psql -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -p "$DB_PORT" -c "\d password_reset_tokens"

        echo ""
        echo "Indexes:"
        psql -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -p "$DB_PORT" -c "\di *password_reset*"
    else
        print_warning "Migration 002 (password_reset): ${YELLOW}NOT APPLIED${NC}"
    fi
}

# Main script
main() {
    check_psql
    check_connection

    case "$1" in
        up|down)
            if [ -z "$2" ]; then
                print_error "Migration number required"
                show_usage
                exit 1
            fi
            run_migration "$1" "$2"
            ;;
        status)
            show_status
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            if [ -z "$1" ]; then
                print_error "No command specified"
            else
                print_error "Unknown command: $1"
            fi
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
