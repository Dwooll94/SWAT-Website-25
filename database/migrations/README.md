# Database Migrations

This directory contains SQL migration scripts for the SWAT Team 1806 website database.

## Migration Files

### 002_add_password_reset.sql
**Date:** 2025-11-24
**Description:** Adds password reset functionality

Creates:
- `password_reset_tokens` table
- Indexes for performance (`token`, `user_id`, `expires_at`)
- Table and column comments

**Dependencies:** Requires `users` table to exist

### 002_add_password_reset_rollback.sql
**Description:** Rollback script for password reset migration

Removes:
- All indexes on `password_reset_tokens`
- `password_reset_tokens` table

## Running Migrations

### Apply Migration

To apply the password reset migration:

```bash
# Using psql
psql -U dwooll94 -d swat_website -f database/migrations/002_add_password_reset.sql

# Or using npm script (if configured)
npm run migrate:up
```

### Rollback Migration

To rollback the password reset migration:

```bash
# Using psql
psql -U dwooll94 -d swat_website -f database/migrations/002_add_password_reset_rollback.sql

# Or using npm script (if configured)
npm run migrate:down
```

### Check Migration Status

To verify if the migration was applied:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'password_reset_tokens';
```

To check indexes:

```sql
SELECT indexname
FROM pg_indexes
WHERE tablename = 'password_reset_tokens';
```

## Migration Naming Convention

Migrations follow the pattern: `{number}_{description}.sql`

- `{number}`: Sequential number (001, 002, 003, etc.)
- `{description}`: Brief description using snake_case

Rollback scripts use: `{number}_{description}_rollback.sql`

## Best Practices

1. **Always test migrations** in development before running in production
2. **Backup database** before running migrations in production
3. **Keep migrations idempotent** - use `IF EXISTS` and `IF NOT EXISTS`
4. **Create rollback scripts** for every migration
5. **Document dependencies** between migrations
6. **Version control** all migration files

## Creating New Migrations

1. Create migration file: `00X_feature_name.sql`
2. Create rollback file: `00X_feature_name_rollback.sql`
3. Test migration: Apply → Verify → Rollback → Verify → Apply again
4. Document changes in this README
5. Commit both files together

## Migration History

| Number | Date | Description | Status |
|--------|------|-------------|--------|
| 001 | - | Initial schema | Applied |
| 002 | 2025-11-24 | Password reset tokens | Applied |

## Troubleshooting

### Migration Already Applied
If you see "relation already exists" errors, the migration has likely already been applied. Verify with:

```sql
\d password_reset_tokens
```

### Permission Errors
Ensure your database user has CREATE privileges:

```sql
GRANT CREATE ON DATABASE swat_website TO dwooll94;
```

### Rollback Before Fixing
If a migration fails midway:
1. Run the rollback script
2. Fix the migration script
3. Re-run the migration

## Future Enhancements

Consider implementing:
- Migration tracking table to record applied migrations
- Automated migration runner script
- Migration status command
- Batch migration runner for multiple migrations
