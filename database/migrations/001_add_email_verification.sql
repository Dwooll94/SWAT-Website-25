-- Migration: Add email verification system
-- Date: 2025-01-16
-- Description: Add email_verification_tokens table and indexes for email verification feature

-- Create email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for email verification tokens
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);

-- Update existing users to have email_verified = true for mentors and admins (retroactive fix)
UPDATE users SET email_verified = true WHERE role IN ('mentor', 'admin') AND email_verified = false;

-- Clean up any expired tokens on migration
DELETE FROM email_verification_tokens WHERE expires_at < NOW();