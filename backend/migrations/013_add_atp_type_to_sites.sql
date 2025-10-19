-- Migration: Add ATP type to sites table
-- Version: 013
-- Date: 2024-12-19
-- Purpose: Add ATP workflow type to sites for automatic task creation

-- Add ATP type column to sites
ALTER TABLE sites ADD COLUMN IF NOT EXISTS atp_type VARCHAR(20) DEFAULT 'BOTH';
ALTER TABLE sites ADD COLUMN IF NOT EXISTS task_type VARCHAR(50) DEFAULT 'ATP';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_sites_atp_type ON sites(atp_type);
CREATE INDEX IF NOT EXISTS idx_sites_task_type ON sites(task_type);

-- Update existing MW sites to BOTH (hardware + software)
UPDATE sites SET 
    atp_type = 'BOTH',
    task_type = 'ATP'
WHERE site_type = 'MW';

-- Add comments
COMMENT ON COLUMN sites.atp_type IS 'ATP workflow type: SOFTWARE, HARDWARE, or BOTH';
COMMENT ON COLUMN sites.task_type IS 'Task type for this site: ATP, MAINTENANCE, etc';

-- Create function to auto-create ATP task when site is registered
CREATE OR REPLACE FUNCTION auto_create_atp_task()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create ATP task if task_type is ATP
    IF NEW.task_type = 'ATP' AND NEW.status = 'ACTIVE' THEN
        INSERT INTO tasks (
            site_id,
            task_type,
            title,
            description,
            assigned_role,
            workflow_type,
            stage_number,
            priority,
            task_data
        ) VALUES (
            NEW.id,
            'ATP_PENDING',
            'ATP Document Required - ' || NEW.site_id,
            'ATP document submission required for site: ' || NEW.site_name,
            'VENDOR',
            NEW.atp_type,
            0, -- Pre-submission stage
            'high',
            jsonb_build_object(
                'site_id', NEW.site_id,
                'site_name', NEW.site_name,
                'atp_type', NEW.atp_type,
                'auto_created', true
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new site registrations
DROP TRIGGER IF EXISTS auto_create_atp_task_trigger ON sites;
CREATE TRIGGER auto_create_atp_task_trigger
    AFTER INSERT OR UPDATE ON sites
    FOR EACH ROW 
    WHEN (NEW.task_type = 'ATP' AND NEW.status = 'ACTIVE')
    EXECUTE FUNCTION auto_create_atp_task();

-- Create missing ATP tasks for existing sites
INSERT INTO tasks (
    site_id,
    task_type,
    title,
    description,
    assigned_role,
    workflow_type,
    stage_number,
    priority,
    task_data
)
SELECT 
    s.id,
    'ATP_PENDING',
    'ATP Document Required - ' || s.site_id,
    'ATP document submission required for site: ' || s.site_name,
    'VENDOR',
    s.atp_type,
    0,
    'high',
    jsonb_build_object(
        'site_id', s.site_id,
        'site_name', s.site_name,
        'atp_type', s.atp_type,
        'auto_created', true,
        'backfill', true
    )
FROM sites s
LEFT JOIN tasks t ON s.id = t.site_id AND t.task_type = 'ATP_PENDING'
WHERE s.status = 'ACTIVE' 
  AND s.task_type = 'ATP'
  AND t.id IS NULL; -- Only create if doesn't exist