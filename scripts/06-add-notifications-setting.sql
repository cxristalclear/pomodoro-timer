-- Add notifications_enabled column to settings table
-- This allows users to toggle browser notifications on/off

ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;

-- Update existing rows to have notifications enabled by default
UPDATE settings 
SET notifications_enabled = true 
WHERE notifications_enabled IS NULL; 