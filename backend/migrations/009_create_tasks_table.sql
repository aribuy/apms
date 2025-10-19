-- Migration: Create tasks table with site relationship
-- Version: 009
-- Date: 2024-12-19
-- Purpose: Site Management and Task Management integration

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    
    -- Task identification
    task_code VARCHAR(50) UNIQUE NOT NULL, -- TSK-JKTB001-001
    task_type VARCHAR(50) NOT NULL, -- ATP_UPLOAD, ATP_REVIEW_L1, PUNCHLIST_RECTIFICATION
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Workflow information
    workflow_type VARCHAR(20), -- SOFTWARE, HARDWARE, BOTH
    stage_number INTEGER DEFAULT 1, -- 1, 2, 3 for review stages
    
    -- Assignment and status
    assigned_to VARCHAR(255), -- User email
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, REJECTED
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- HIGH, MEDIUM, LOW
    
    -- Decision and workflow
    decision VARCHAR(50), -- PASS, PASS_WITH_PUNCHLIST, REJECT
    decision_comments TEXT,
    
    -- Dependencies and scheduling
    depends_on UUID[], -- Array of task IDs this task depends on
    sla_deadline TIMESTAMP,
    
    -- Metadata
    metadata JSONB DEFAULT '{}', -- Flexible data storage
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_site_id ON tasks(site_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_workflow_type ON tasks(workflow_type);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);

-- Create function to generate task codes
CREATE OR REPLACE FUNCTION generate_task_code(site_id_param UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    site_code VARCHAR(20);
    task_count INTEGER;
    new_code VARCHAR(50);
BEGIN
    -- Get site_id from sites table
    SELECT s.site_id INTO site_code FROM sites s WHERE s.id = site_id_param;
    
    -- Count existing tasks for this site
    SELECT COUNT(*) + 1 INTO task_count FROM tasks WHERE site_id = site_id_param;
    
    -- Generate code: TSK-{SITE_ID}-{COUNT}
    new_code := 'TSK-' || site_code || '-' || LPAD(task_count::TEXT, 3, '0');
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate task codes
CREATE OR REPLACE FUNCTION set_task_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.task_code IS NULL OR NEW.task_code = '' THEN
        NEW.task_code := generate_task_code(NEW.site_id);
    END IF;
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_task_code
    BEFORE INSERT OR UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION set_task_code();

-- Add comments for documentation
COMMENT ON TABLE tasks IS 'Task management table with site relationship for ATP workflow';
COMMENT ON COLUMN tasks.task_code IS 'Auto-generated unique task code (TSK-SITEID-001)';
COMMENT ON COLUMN tasks.workflow_type IS 'ATP workflow type: SOFTWARE, HARDWARE, or BOTH';
COMMENT ON COLUMN tasks.depends_on IS 'Array of task IDs that must be completed before this task';
COMMENT ON COLUMN tasks.metadata IS 'Flexible JSON storage for task-specific data';