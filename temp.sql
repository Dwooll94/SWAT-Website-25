-- Sponsor tiers enum
CREATE TYPE sponsor_tier AS ENUM ('bronze', 'silver', 'gold', 'warrior');

-- Sponsors
CREATE TABLE sponsors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    logo_path VARCHAR(500),
    website_url VARCHAR(500),
    tier sponsor_tier NOT NULL DEFAULT 'bronze',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);