-- Rollback Migration: Remove Password Reset Tokens Table
-- Date: 2025-11-24
-- Description: Removes password_reset_tokens table and associated indexes

-- Drop indexes
DROP INDEX IF EXISTS idx_password_reset_tokens_expires_at;
DROP INDEX IF EXISTS idx_password_reset_tokens_user_id;
DROP INDEX IF EXISTS idx_password_reset_tokens_token;

-- Drop table
DROP TABLE IF EXISTS password_reset_tokens;

-- Verify rollback
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'password_reset_tokens'
    ) THEN
        RAISE NOTICE 'Rollback successful: password_reset_tokens table removed';
    ELSE
        RAISE EXCEPTION 'Rollback failed: password_reset_tokens table still exists';
    END IF;
END $$;
