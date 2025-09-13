-- Migration: Add sponsor tier support
-- Date: 2025-09-13

-- Create sponsor tier enum
DROP TABLE sponsors;
DROP TYPE sponsor_tier;
CREATE TYPE sponsor_tier AS ENUM ('title_sponsor', 'gold', 'warrior', 'black', 'green');

-- Add tier column to sponsors table
-- Sponsors
CREATE TABLE sponsors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    logo_path VARCHAR(500),
    website_url VARCHAR(500),
    tier sponsor_tier NOT NULL DEFAULT 'green',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);