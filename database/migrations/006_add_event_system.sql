-- Live Event System Tables
-- Migration 006: Add tables for TBA integration and live event display

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

-- Insert default event configuration
INSERT INTO event_config (key, value, description) VALUES
('tba_api_key', '', 'The Blue Alliance API key (X-TBA-Auth-Key)'),
('tba_webhook_secret', '', 'Webhook secret for TBA webhook verification'),
('team_number', '1806', 'FRC Team number for event tracking'),
('event_check_interval', '3600', 'Seconds between checking for new events (default 1 hour)'),
('match_check_interval', '300', 'Seconds between checking for match updates during events (default 5 minutes)'),
('enable_event_display', 'false', 'Enable/disable the live event display on homepage');

-- Create indexes for performance
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

-- Apply updated_at trigger to tables that need it
CREATE TRIGGER update_event_config_updated_at BEFORE UPDATE ON event_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_current_events_updated_at BEFORE UPDATE ON current_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_event_status_updated_at BEFORE UPDATE ON team_event_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_matches_updated_at BEFORE UPDATE ON event_matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();