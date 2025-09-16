#!/bin/bash

# Script to run database migrations
# Usage: ./run_migration.sh [migration_file]

if [ -z "$1" ]; then
    echo "Usage: $0 <migration_file>"
    echo "Example: $0 migrations/001_add_email_verification.sql"
    exit 1
fi

MIGRATION_FILE="$1"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "Error: Migration file $MIGRATION_FILE not found"
    exit 1
fi

# Database connection parameters
# These should match your .env file settings
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-swat_website}"
DB_USER="${DB_USER:-postgres}"

echo "Running migration: $MIGRATION_FILE"
echo "Database: $DB_NAME on $DB_HOST:$DB_PORT"

# Run the migration
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo "Migration completed successfully"
else
    echo "Migration failed"
    exit 1
fi