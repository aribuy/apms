-- Migration: Enhance tasks table for Site-Task integration
-- Version: 010
-- Date: 2024-12-19
-- Purpose: Add missing columns for ATP workflow integration

-- Add missing columns for ATP workflow
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workflow_type VARCHAR(20); -- SOFTWARE, HARDWARE, BOTH
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS stage_number INTEGER DEFAULT 1; -- 1, 2, 3 for review stages
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS decision VARCHAR(50); -- PASS, PASS_WITH_PUNCHLIST, REJECT
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS decision_comments TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS depends_on UUID[]; -- Array of task dependencies
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMP;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add foreign key constraint to sites table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_site_id_fkey'
    ) THEN
        -- First, update any NULL site_id values to a valid UUID or remove them
        DELETE FROM tasks WHERE site_id IS NULL OR site_id = '';
        
        -- Convert site_id to UUID type if it's text
        ALTER TABLE tasks ALTER COLUMN site_id TYPE UUID USING site_id::UUID;
        
        -- Add foreign key constraint
        ALTER TABLE tasks ADD CONSTRAINT tasks_site_id_fkey 
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create additional indexes for new columns
CREATE INDEX IF NOT EXISTS idx_tasks_workflow_type ON tasks(workflow_type);
CREATE INDEX IF NOT EXISTS idx_tasks_stage_number ON tasks(stage_number);
CREATE INDEX IF NOT EXISTS idx_tasks_decision ON tasks(decision);
CREATE INDEX IF NOT EXISTS idx_tasks_sla_deadline ON tasks(sla_deadline);

-- Update trigger function to handle updated_at
CREATE OR REPLACE FUNCTION set_task_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.task_code IS NULL OR NEW.task_code = '' THEN
        -- Get site_id from sites table for task code generation
        SELECT s.site_id INTO NEW.task_code FROM sites s WHERE s.id = NEW.site_id;
        IF NEW.task_code IS NOT NULL THEN
            -- Count existing tasks for this site
            SELECT COUNT(*) + 1 INTO NEW.task_code FROM tasks WHERE site_id = NEW.site_id;
            -- Generate code: TSK-{SITE_ID}-{COUNT}
            SELECT 'TSK-' || s.site_id || '-' || LPAD((COUNT(*) + 1)::TEXT, 3, '0')
            INTO NEW.task_code
            FROM sites s, tasks t
            WHERE s.id = NEW.site_id AND t.site_id = NEW.site_id;
        END IF;
    END IF;
    
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comments for new columns
COMMENT ON COLUMN tasks.workflow_type IS 'ATP workflow type: SOFTWARE, HARDWARE, or BOTH';
COMMENT ON COLUMN tasks.stage_number IS 'Review stage number (1, 2, 3) for multi-stage approval';
COMMENT ON COLUMN tasks.decision IS 'Approval decision: PASS, PASS_WITH_PUNCHLIST, REJECT';
COMMENT ON COLUMN tasks.depends_on IS 'Array of task UUIDs that must be completed before this task';
COMMENT ON COLUMN tasks.sla_deadline IS 'SLA deadline for task completion';