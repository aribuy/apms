-- Migration: Redesign sites table for ATP workflow
-- Version: 013
-- Date: 2024-12-19
-- Purpose: Add flexible ATP configuration to sites

-- Rename site_type to scope for clarity
ALTER TABLE sites RENAME COLUMN site_type TO scope;

-- Add new ATP-related columns
ALTER TABLE sites ADD COLUMN IF NOT EXISTS atp_required BOOLEAN DEFAULT true;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS atp_type VARCHAR(20) DEFAULT 'BOTH';
ALTER TABLE sites ADD COLUMN IF NOT EXISTS workflow_stage VARCHAR(50) DEFAULT 'REGISTERED';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_sites_scope ON sites(scope);
CREATE INDEX IF NOT EXISTS idx_sites_atp_required ON sites(atp_required);
CREATE INDEX IF NOT EXISTS idx_sites_atp_type ON sites(atp_type);
CREATE INDEX IF NOT EXISTS idx_sites_workflow_stage ON sites(workflow_stage);

-- Update existing sites based on scope
UPDATE sites SET 
    atp_required = true,
    atp_type = CASE 
        WHEN scope = 'MW' THEN 'BOTH'
        WHEN scope = 'RAN' THEN 'HARDWARE'
        WHEN scope = 'VLAN_TAGGING' THEN 'SOFTWARE'
        WHEN scope = 'IPRAN' THEN 'SOFTWARE'
        ELSE 'BOTH'
    END,
    workflow_stage = CASE 
        WHEN EXISTS (SELECT 1 FROM atp_documents WHERE site_id = sites.site_id) THEN 'ATP_SUBMITTED'
        WHEN EXISTS (SELECT 1 FROM tasks WHERE site_id = sites.id AND task_type LIKE '%ATP%') THEN 'ATP_PENDING'
        ELSE 'REGISTERED'
    END;

-- Add comments
COMMENT ON COLUMN sites.scope IS 'Project scope: MW, RAN, PLN_UPGRADE, DISMANTLE_KEEP, etc';
COMMENT ON COLUMN sites.atp_required IS 'Whether this site requires ATP document submission';
COMMENT ON COLUMN sites.atp_type IS 'ATP workflow type: SOFTWARE, HARDWARE, or BOTH';
COMMENT ON COLUMN sites.workflow_stage IS 'Current workflow stage: REGISTERED, ATP_PENDING, ATP_SUBMITTED, BO_REVIEW_L1, SME_REVIEW_L2, HEAD_NOC_REVIEW_L3, FOP_RTS_REVIEW_L1, REGION_REVIEW_L2, RTH_REVIEW_L3, FINAL_REVIEW_L3, APPROVED, REJECTED';

-- Create function to auto-create ATP task when needed
CREATE OR REPLACE FUNCTION auto_create_atp_task()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create ATP task if atp_required is true and site is active
    IF NEW.atp_required = true AND NEW.status = 'ACTIVE' THEN
        -- Check if ATP task already exists
        IF NOT EXISTS (
            SELECT 1 FROM tasks 
            WHERE site_id = NEW.id 
            AND task_type = 'ATP_PENDING'
        ) THEN
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
                'ATP document submission required for ' || NEW.scope || ' scope at ' || NEW.site_name,
                'VENDOR',
                NEW.atp_type,
                0,
                'high',
                jsonb_build_object(
                    'site_id', NEW.site_id,
                    'site_name', NEW.site_name,
                    'scope', NEW.scope,
                    'atp_type', NEW.atp_type,
                    'auto_created', true
                )
            );
            
            -- Update workflow stage
            UPDATE sites SET workflow_stage = 'ATP_PENDING' WHERE id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS auto_create_atp_task_trigger ON sites;
CREATE TRIGGER auto_create_atp_task_trigger
    AFTER INSERT OR UPDATE ON sites
    FOR EACH ROW 
    EXECUTE FUNCTION auto_create_atp_task();