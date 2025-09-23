-- Fix school_email constraint to allow multiple NULL values but prevent duplicate non-NULL values
-- This migration addresses the issue where homeschool students with empty school emails 
-- couldn't register due to the unique constraint on empty strings

BEGIN;

-- First, update all empty string school_email values to NULL
UPDATE users SET school_email = NULL WHERE school_email = '';

-- Drop the existing unique constraint on school_email
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_school_email_key;

-- Create a partial unique index that only applies to non-NULL values
-- This allows multiple NULL values while still preventing duplicate email addresses
CREATE UNIQUE INDEX users_school_email_unique_idx ON users (school_email) WHERE school_email IS NOT NULL;

COMMIT;