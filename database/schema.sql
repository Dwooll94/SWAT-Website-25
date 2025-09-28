-- SWAT Team 1806 Website Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles enum
CREATE TYPE user_role AS ENUM ('student', 'mentor', 'admin');

-- Registration status enum
CREATE TYPE registration_status AS ENUM ('initially_created', 'contract_signed', 'complete', 'inactive');

-- Gender enum
CREATE TYPE gender_type AS ENUM ('male', 'female', 'non_binary', 'prefer_not_to_say');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    school_email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    registration_status registration_status NOT NULL DEFAULT 'initially_created',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    graduation_year INTEGER,
    gender gender_type,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    food_allergies TEXT,
    medical_conditions TEXT,
    heard_about_team TEXT,
    maintenance_access BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false
);

-- Student attributes table
CREATE TABLE student_attributes(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    attribute_key varchar(255) NOT NULL,
    attribute_value varchar(255) NOT NULL
);

-- Subteams table (configurable)
CREATE TABLE subteams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_primary BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- relationship between students and subteams
CREATE TABLE student_subteams (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subteam_id INT REFERENCES subteams(id) ON DELETE CASCADE,
    is_captain BOOLEAN DEFAULT false,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure only one primary subteam per student
CREATE UNIQUE INDEX idx_one_primary_per_student 
ON student_subteams (user_id) 
WHERE is_primary = true;

-- User subteam preferences
CREATE TABLE user_subteam_preferences (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subteam_id INTEGER REFERENCES subteams(id) ON DELETE CASCADE,
    preference_rank INTEGER,
    is_interested BOOLEAN DEFAULT false,
    UNIQUE(user_id, subteam_id)
);

-- Legal guardians
CREATE TABLE legal_guardians (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    relationship VARCHAR(50)
);

-- Contract signatures (file uploads)
CREATE TABLE contract_signatures (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email verification tokens
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email invitations for mentors
CREATE TABLE mentor_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    invited_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Website pages (dynamic content management)
CREATE TABLE pages (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Sponsor tiers enum
CREATE TYPE sponsor_tier AS ENUM ('title_sponsor', 'gold', 'warrior', 'black', 'green');

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

-- Resources
CREATE TABLE resource_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    url VARCHAR(500),
    file_path VARCHAR(500),
    category_id INTEGER REFERENCES resource_categories(id),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Robots (history page)
CREATE TABLE robots (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    game VARCHAR(100) NOT NULL,
    description TEXT,
    image_path VARCHAR(500),
    achievements TEXT,
    cad_link VARCHAR(1000),
    code_link VARCHAR(1000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Site configuration
CREATE TABLE site_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Slideshow images
CREATE TABLE slideshow_images (
    id SERIAL PRIMARY KEY,
    file_path VARCHAR(500) NOT NULL,
    caption TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Proposed changes (for student maintenance access)
CREATE TABLE proposed_changes (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    change_type VARCHAR(50) NOT NULL,
    target_table VARCHAR(100),
    target_id INTEGER,
    proposed_data JSONB NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Live Event System Tables
-- Event configuration table
CREATE TABLE event_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Current events table (cached from TBA API)
CREATE TABLE current_events (
    id SERIAL PRIMARY KEY,
    event_key VARCHAR(50) UNIQUE NOT NULL,
    event_code VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    event_type INTEGER NOT NULL,
    district_key VARCHAR(20),
    city VARCHAR(100),
    state_prov VARCHAR(50),
    country VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    year INTEGER NOT NULL,
    week INTEGER,
    address TEXT,
    playoff_type INTEGER,
    timezone VARCHAR(50),
    website VARCHAR(500),
    first_event_id VARCHAR(50),
    first_event_code VARCHAR(20),
    webcasts JSONB,
    division_keys JSONB,
    parent_event_key VARCHAR(50),
    is_active BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Team event status (cached from TBA API)
CREATE TABLE team_event_status (
    id SERIAL PRIMARY KEY,
    team_key VARCHAR(20) NOT NULL,
    event_key VARCHAR(50) NOT NULL REFERENCES current_events(event_key) ON DELETE CASCADE,
    qual_ranking INTEGER,
    qual_avg DECIMAL(5,2),
    qual_record JSONB, -- {wins, losses, ties}
    playoff_alliance INTEGER,
    playoff_record JSONB, -- {wins, losses, ties}  
    playoff_status VARCHAR(100),
    overall_status_str VARCHAR(200),
    next_match_key VARCHAR(50),
    last_match_key VARCHAR(50),
    opr DECIMAL(8,2),
    dpr DECIMAL(8,2),
    ccwm DECIMAL(8,2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_key, event_key)
);

-- Match information (cached from TBA API)
CREATE TABLE event_matches (
    id SERIAL PRIMARY KEY,
    match_key VARCHAR(50) UNIQUE NOT NULL,
    event_key VARCHAR(50) NOT NULL REFERENCES current_events(event_key) ON DELETE CASCADE,
    comp_level VARCHAR(10) NOT NULL, -- 'qm', 'ef', 'qf', 'sf', 'f'
    set_number INTEGER,
    match_number INTEGER NOT NULL,
    winning_alliance VARCHAR(4), -- 'red', 'blue', or null for tie/no winner
    red_alliance JSONB NOT NULL, -- team keys and scores
    blue_alliance JSONB NOT NULL, -- team keys and scores
    red_score INTEGER,
    blue_score INTEGER,
    time BIGINT, -- Unix timestamp
    actual_time BIGINT, -- Unix timestamp of actual start
    predicted_time BIGINT, -- Unix timestamp of predicted start
    post_result_time BIGINT, -- Unix timestamp when results posted
    score_breakdown JSONB, -- Detailed scoring breakdown
    videos JSONB, -- Video links
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event statistics cache (for quick access to frequently requested data)
CREATE TABLE event_stats_cache (
    id SERIAL PRIMARY KEY,
    event_key VARCHAR(50) NOT NULL REFERENCES current_events(event_key) ON DELETE CASCADE,
    team_key VARCHAR(20) NOT NULL,
    stat_type VARCHAR(50) NOT NULL, -- 'ranking', 'opr', 'next_match', etc.
    stat_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_key, team_key, stat_type)
);

-- Webhook logs for debugging and monitoring
CREATE TABLE tba_webhook_logs (
    id SERIAL PRIMARY KEY,
    message_type VARCHAR(50) NOT NULL,
    message_data JSONB NOT NULL,
    team_key VARCHAR(20),
    event_key VARCHAR(50),
    match_key VARCHAR(50),
    processed BOOLEAN DEFAULT false,
    error_message TEXT,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Insert default subteams
INSERT INTO subteams (name, description, is_primary, display_order) VALUES
('Hardware Fabrication & Design', 'Design and build the mechanical systems of the robot', true, 1),
('Control System', 'Program and control the robot systems', true, 2),
('Impact', 'Community outreach and impact initiatives', true, 3),
('Media', 'Documentation, photography, and promotional materials', true, 4),
('Strategy', 'Game strategy and match analysis', false, 5);

-- Insert default site configuration
INSERT INTO site_config (key, value, description) VALUES
('current_game', 'Rebuild', 'The current FRC game'),
('mission_statement', 'To inspire young people to be science and technology leaders and innovators by engaging them in exciting mentor-based programs that build science, engineering, and technology skills.', 'Team mission statement'),
('team_motto', 'Building Tomorrow''s Leaders Today', 'Team motto'),
('contract_url', 'https://docs.google.com/document/d/1je78p4ZADTx7aYyjeyP4SgrYUObXlefbY4ApI3SzYAI/edit?tab=t.0#heading=h.d51b07zbtvd9', 'URL to team contract'),
('first_signup_url', 'https://www.firstinspires.org/', 'URL for FIRST signup'),
('first_signup_image', '', 'Path to FIRST signup instruction image'),
('valid_school_domain', '@smithville.k12.mo.us', 'Valid school email domain');

-- Insert default resource categories
INSERT INTO resource_categories (name, description, display_order) VALUES
('Programming', 'Programming resources and tutorials', 1),
('Mechanical', 'Mechanical design and fabrication resources', 2),
('Electrical', 'Electrical systems and wiring guides', 3),
('Competition', 'Competition rules and strategy resources', 4),
('Team Resources', 'Internal team documents and forms', 5);

-- Insert default event configuration
INSERT INTO event_config (key, value, description) VALUES
('tba_api_key', '', 'The Blue Alliance API key (X-TBA-Auth-Key)'),
('tba_webhook_secret', '', 'Webhook secret for TBA webhook verification'),
('team_number', '1806', 'FRC Team number for event tracking'),
('event_check_interval', '3600', 'Seconds between checking for new events (default 1 hour)'),
('match_check_interval', '300', 'Seconds between checking for match updates during events (default 5 minutes)'),
('enable_event_display', 'false', 'Enable/disable the live event display on homepage');

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_graduation_year ON users(graduation_year);
CREATE INDEX idx_users_registration_status ON users(registration_status);
CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_proposed_changes_status ON proposed_changes(status);
CREATE INDEX idx_proposed_changes_user_id ON proposed_changes(user_id);
CREATE INDEX idx_current_events_start_date ON current_events(start_date);
CREATE INDEX idx_current_events_end_date ON current_events(end_date);
CREATE INDEX idx_current_events_is_active ON current_events(is_active);
CREATE INDEX idx_team_event_status_team_key ON team_event_status(team_key);
CREATE INDEX idx_team_event_status_event_key ON team_event_status(event_key);
CREATE INDEX idx_event_matches_event_key ON event_matches(event_key);
CREATE INDEX idx_event_matches_match_key ON event_matches(match_key);
CREATE INDEX idx_event_matches_time ON event_matches(time);
CREATE INDEX idx_event_stats_cache_expires_at ON event_stats_cache(expires_at);
CREATE INDEX idx_tba_webhook_logs_received_at ON tba_webhook_logs(received_at);
CREATE INDEX idx_tba_webhook_logs_processed ON tba_webhook_logs(processed);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to tables that need it
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_robots_updated_at BEFORE UPDATE ON robots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_config_updated_at BEFORE UPDATE ON site_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_config_updated_at BEFORE UPDATE ON event_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_current_events_updated_at BEFORE UPDATE ON current_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_event_status_updated_at BEFORE UPDATE ON team_event_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_matches_updated_at BEFORE UPDATE ON event_matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();