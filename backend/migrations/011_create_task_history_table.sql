-- Migration: Create task history table for audit trail
-- Version: 011
-- Date: 2024-12-19
-- Purpose: Track complete task journey per site with export capability

-- Create task_history table
CREATE TABLE IF NOT EXISTS task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    
    -- Event tracking
    event_type VARCHAR(50) NOT NULL, -- CREATED, STARTED, COMPLETED, ASSIGNED, DECISION_MADE, STATUS_CHANGED
    event_description TEXT NOT NULL,
    
    -- Status tracking
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    old_assigned_to VARCHAR(255),
    new_assigned_to VARCHAR(255),
    
    -- Decision tracking (for ATP workflow)
    decision VARCHAR(50), -- PASS, PASS_WITH_PUNCHLIST, REJECT
    decision_comments TEXT,
    reviewer_role VARCHAR(50),
    
    -- Workflow tracking
    workflow_stage VARCHAR(50), -- UPLOAD, REVIEW_L1, REVIEW_L2, REVIEW_L3, PUNCHLIST, COMPLETED
    stage_number INTEGER,
    
    -- Timing tracking
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sla_deadline TIMESTAMP,
    is_overdue BOOLEAN DEFAULT FALSE,
    
    -- User tracking
    performed_by VARCHAR(255), -- User who performed the action
    performed_by_role VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    
    -- Additional data
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_history_site_id ON task_history(site_id);
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_event_type ON task_history(event_type);
CREATE INDEX IF NOT EXISTS idx_task_history_event_timestamp ON task_history(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_task_history_workflow_stage ON task_history(workflow_stage);
CREATE INDEX IF NOT EXISTS idx_task_history_performed_by ON task_history(performed_by);

-- Create site_journey_summary view for easy reporting
CREATE OR REPLACE VIEW site_journey_summary AS
SELECT 
    s.id as site_id,
    s.site_id as site_code,
    s.site_name,
    s.region,
    s.city,
    s.created_at as site_registered_date,
    
    -- Task counts
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'pending' THEN t.id END) as pending_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END) as in_progress_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
    
    -- ATP Journey milestones
    MIN(CASE WHEN th.event_type = 'CREATED' AND t.task_type = 'ATP_UPLOAD' THEN th.event_timestamp END) as atp_upload_task_created,
    MIN(CASE WHEN th.event_type = 'COMPLETED' AND t.task_type = 'ATP_UPLOAD' THEN th.event_timestamp END) as atp_uploaded_date,
    MIN(CASE WHEN th.workflow_stage = 'REVIEW_L1' AND th.event_type = 'STARTED' THEN th.event_timestamp END) as review_l1_started,
    MIN(CASE WHEN th.workflow_stage = 'REVIEW_L1' AND th.event_type = 'COMPLETED' THEN th.event_timestamp END) as review_l1_completed,
    MIN(CASE WHEN th.workflow_stage = 'REVIEW_L2' AND th.event_type = 'STARTED' THEN th.event_timestamp END) as review_l2_started,
    MIN(CASE WHEN th.workflow_stage = 'REVIEW_L2' AND th.event_type = 'COMPLETED' THEN th.event_timestamp END) as review_l2_completed,
    MIN(CASE WHEN th.workflow_stage = 'REVIEW_L3' AND th.event_type = 'STARTED' THEN th.event_timestamp END) as review_l3_started,
    MIN(CASE WHEN th.workflow_stage = 'REVIEW_L3' AND th.event_type = 'COMPLETED' THEN th.event_timestamp END) as review_l3_completed,
    MAX(CASE WHEN th.event_type = 'COMPLETED' AND th.workflow_stage = 'COMPLETED' THEN th.event_timestamp END) as fully_approved_date,
    
    -- Current status
    (SELECT t2.status FROM tasks t2 WHERE t2.site_id = s.id AND t2.task_type = 'ATP_UPLOAD' ORDER BY t2.created_at DESC LIMIT 1) as current_atp_status,
    (SELECT th2.workflow_stage FROM task_history th2 WHERE th2.site_id = s.id ORDER BY th2.event_timestamp DESC LIMIT 1) as current_workflow_stage,
    
    -- Timing calculations
    CASE 
        WHEN MAX(CASE WHEN th.event_type = 'COMPLETED' AND th.workflow_stage = 'COMPLETED' THEN th.event_timestamp END) IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (MAX(CASE WHEN th.event_type = 'COMPLETED' AND th.workflow_stage = 'COMPLETED' THEN th.event_timestamp END) - s.created_at))/86400
        ELSE NULL 
    END as total_days_to_completion,
    
    -- Last activity
    MAX(th.event_timestamp) as last_activity_date,
    (SELECT th3.event_description FROM task_history th3 WHERE th3.site_id = s.id ORDER BY th3.event_timestamp DESC LIMIT 1) as last_activity_description

FROM sites s
LEFT JOIN tasks t ON s.id = t.site_id
LEFT JOIN task_history th ON s.id = th.site_id
GROUP BY s.id, s.site_id, s.site_name, s.region, s.city, s.created_at
ORDER BY s.created_at DESC;

-- Create function to automatically log task events
CREATE OR REPLACE FUNCTION log_task_event(
    p_site_id UUID,
    p_task_id UUID,
    p_event_type VARCHAR(50),
    p_event_description TEXT,
    p_old_status VARCHAR(50) DEFAULT NULL,
    p_new_status VARCHAR(50) DEFAULT NULL,
    p_decision VARCHAR(50) DEFAULT NULL,
    p_decision_comments TEXT DEFAULT NULL,
    p_workflow_stage VARCHAR(50) DEFAULT NULL,
    p_performed_by VARCHAR(255) DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    history_id UUID;
BEGIN
    INSERT INTO task_history (
        site_id,
        task_id,
        event_type,
        event_description,
        old_status,
        new_status,
        decision,
        decision_comments,
        workflow_stage,
        performed_by,
        metadata
    ) VALUES (
        p_site_id,
        p_task_id,
        p_event_type,
        p_event_description,
        p_old_status,
        p_new_status,
        p_decision,
        p_decision_comments,
        p_workflow_stage,
        p_performed_by,
        p_metadata
    ) RETURNING id INTO history_id;
    
    RETURN history_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically log task changes
CREATE OR REPLACE FUNCTION trigger_log_task_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log task creation
    IF TG_OP = 'INSERT' THEN
        PERFORM log_task_event(
            NEW.site_id,
            NEW.id,
            'CREATED',
            'Task created: ' || NEW.title,
            NULL,
            NEW.status,
            NULL,
            NULL,
            CASE 
                WHEN NEW.task_type = 'ATP_UPLOAD' THEN 'UPLOAD'
                WHEN NEW.task_type LIKE 'ATP_REVIEW%' THEN 'REVIEW_L' || NEW.stage_number::TEXT
                ELSE 'OTHER'
            END,
            NEW.assigned_to,
            jsonb_build_object(
                'task_type', NEW.task_type,
                'priority', NEW.priority,
                'workflow_type', NEW.workflow_type
            )
        );
        RETURN NEW;
    END IF;
    
    -- Log task updates
    IF TG_OP = 'UPDATE' THEN
        -- Log status changes
        IF OLD.status != NEW.status THEN
            PERFORM log_task_event(
                NEW.site_id,
                NEW.id,
                'STATUS_CHANGED',
                'Status changed from ' || COALESCE(OLD.status, 'NULL') || ' to ' || COALESCE(NEW.status, 'NULL'),
                OLD.status,
                NEW.status,
                NEW.decision,
                NEW.decision_comments,
                CASE 
                    WHEN NEW.task_type = 'ATP_UPLOAD' THEN 'UPLOAD'
                    WHEN NEW.task_type LIKE 'ATP_REVIEW%' THEN 'REVIEW_L' || NEW.stage_number::TEXT
                    ELSE 'OTHER'
                END,
                NEW.assigned_to,
                jsonb_build_object(
                    'old_status', OLD.status,
                    'new_status', NEW.status,
                    'decision', NEW.decision
                )
            );
        END IF;
        
        -- Log assignment changes
        IF COALESCE(OLD.assigned_to, '') != COALESCE(NEW.assigned_to, '') THEN
            PERFORM log_task_event(
                NEW.site_id,
                NEW.id,
                'ASSIGNED',
                'Task reassigned from ' || COALESCE(OLD.assigned_to, 'unassigned') || ' to ' || COALESCE(NEW.assigned_to, 'unassigned'),
                OLD.status,
                NEW.status,
                NULL,
                NULL,
                CASE 
                    WHEN NEW.task_type = 'ATP_UPLOAD' THEN 'UPLOAD'
                    WHEN NEW.task_type LIKE 'ATP_REVIEW%' THEN 'REVIEW_L' || NEW.stage_number::TEXT
                    ELSE 'OTHER'
                END,
                NEW.assigned_to,
                jsonb_build_object(
                    'old_assigned_to', OLD.assigned_to,
                    'new_assigned_to', NEW.assigned_to
                )
            );
        END IF;
        
        -- Log decision made
        IF OLD.decision IS DISTINCT FROM NEW.decision AND NEW.decision IS NOT NULL THEN
            PERFORM log_task_event(
                NEW.site_id,
                NEW.id,
                'DECISION_MADE',
                'Decision made: ' || NEW.decision || CASE WHEN NEW.decision_comments IS NOT NULL THEN ' - ' || NEW.decision_comments ELSE '' END,
                OLD.status,
                NEW.status,
                NEW.decision,
                NEW.decision_comments,
                CASE 
                    WHEN NEW.task_type = 'ATP_UPLOAD' THEN 'UPLOAD'
                    WHEN NEW.task_type LIKE 'ATP_REVIEW%' THEN 'REVIEW_L' || NEW.stage_number::TEXT
                    ELSE 'OTHER'
                END,
                NEW.assigned_to,
                jsonb_build_object(
                    'decision', NEW.decision,
                    'comments', NEW.decision_comments,
                    'stage_number', NEW.stage_number
                )
            );
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on tasks table
DROP TRIGGER IF EXISTS trigger_log_task_changes ON tasks;
CREATE TRIGGER trigger_log_task_changes
    AFTER INSERT OR UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_log_task_changes();

-- Add comments for documentation
COMMENT ON TABLE task_history IS 'Complete audit trail for all task events per site';
COMMENT ON VIEW site_journey_summary IS 'Summary view of complete site journey from registration to ATP approval';
COMMENT ON FUNCTION log_task_event IS 'Function to manually log task events with full context';
COMMENT ON FUNCTION trigger_log_task_changes IS 'Automatic trigger to log all task changes';