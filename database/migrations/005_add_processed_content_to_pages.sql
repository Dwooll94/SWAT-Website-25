-- Add processed content fields to pages table to support markdown with embedded HTML
-- This allows us to store both the raw markdown and the processed HTML

BEGIN;

-- Add columns for processed content
ALTER TABLE pages 
ADD COLUMN processed_content TEXT,
ADD COLUMN content_preview TEXT;

-- Create an index on content_preview for search functionality
CREATE INDEX idx_pages_content_preview ON pages(content_preview);

-- Add a comment to document the new columns
COMMENT ON COLUMN pages.processed_content IS 'HTML content processed from markdown with embedded HTML support';
COMMENT ON COLUMN pages.content_preview IS 'Plain text preview/excerpt for search and listing purposes';

COMMIT;