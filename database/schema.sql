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

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_graduation_year ON users(graduation_year);
CREATE INDEX idx_users_registration_status ON users(registration_status);
CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_proposed_changes_status ON proposed_changes(status);
CREATE INDEX idx_proposed_changes_user_id ON proposed_changes(user_id);

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