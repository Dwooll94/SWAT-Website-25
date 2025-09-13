-- Migration: Enhance subteam assignments for primary/secondary
-- Date: 2025-09-13

-- Add is_primary column to student_subteams to distinguish primary vs secondary assignments
ALTER TABLE student_subteams 
ADD COLUMN is_primary BOOLEAN DEFAULT false;

-- Add created_at timestamp
ALTER TABLE student_subteams 
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add constraint to ensure only one primary subteam per student
CREATE UNIQUE INDEX idx_one_primary_per_student 
ON student_subteams (user_id) 
WHERE is_primary = true;