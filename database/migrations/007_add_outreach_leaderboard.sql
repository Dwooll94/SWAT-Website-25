-- Outreach Leaderboard System
-- Migration 007: Add tables for tracking outreach events and student participation

-- Outreach events table
CREATE TABLE outreach_events (
    id SERIAL PRIMARY KEY,
    event_name VARCHAR(200) NOT NULL,
    event_date DATE NOT NULL,
    event_description TEXT,
    hours_length DECIMAL(4,2), -- Duration in hours (for event-block calculation)
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Student participation in outreach events
CREATE TABLE student_outreach_participation (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES outreach_events(id) ON DELETE CASCADE,
    participation_type VARCHAR(20) NOT NULL CHECK (participation_type IN ('organizer', 'assistant')),
    points_awarded INTEGER NOT NULL, -- 8 for organizer, 5 for assistant
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id) -- Each student can only have one participation record per event
);

-- Create indexes for performance
CREATE INDEX idx_outreach_events_event_date ON outreach_events(event_date);
CREATE INDEX idx_student_outreach_participation_user_id ON student_outreach_participation(user_id);
CREATE INDEX idx_student_outreach_participation_event_id ON student_outreach_participation(event_id);

-- Apply updated_at trigger
CREATE TRIGGER update_outreach_events_updated_at
    BEFORE UPDATE ON outreach_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
