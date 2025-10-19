-- Migration: Create task_history table for ATP workflow audit trail
-- Version: 012
-- Date: 2024-12-19
-- Purpose: Complete audit trail for ATP process approval flow

CREATE TABLE IF NOT EXISTS task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- CREATED, ASSIGNED, STATUS_CHANGED, DECISION_MADE, COMPLETED
    event_description TEXT,
    old_values JSONB,
    new_values JSONB,
    performed_by VARCHAR(100),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    workflow_stage VARCHAR(100),
    decision VARCHAR(50), -- APPROVE, APPROVE_WITH_PUNCHLIST, REJECT
    comments TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_site_id ON task_history(site_id);
CREATE INDEX IF NOT EXISTS idx_task_history_event_type ON task_history(event_type);
CREATE INDEX IF NOT EXISTS idx_task_history_performed_at ON task_history(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_history_workflow_stage ON task_history(workflow_stage);

-- Add comments
COMMENT ON TABLE task_history IS 'Complete audit trail for ATP workflow process';
COMMENT ON COLUMN task_history.event_type IS 'Type of event: CREATED, ASSIGNED, STATUS_CHANGED, DECISION_MADE, COMPLETED';
COMMENT ON COLUMN task_history.workflow_stage IS 'ATP workflow stage when event occurred';
COMMENT ON COLUMN task_history.decision IS 'Approval decision: APPROVE, APPROVE_WITH_PUNCHLIST, REJECT';
COMMENT ON COLUMN task_history.metadata IS 'Additional event metadata and context';

-- Create trigger function for automatic task history logging
CREATE OR REPLACE FUNCTION log_task_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Log task creation
    IF TG_OP = 'INSERT' THEN
        INSERT INTO task_history (
            task_id, site_id, event_type, event_description,
            new_values, performed_by, workflow_stage
        ) VALUES (
            NEW.id, NEW.site_id, 'CREATED',
            'Task created: ' || NEW.title,
            to_jsonb(NEW), NEW.assigned_by, NEW.workflow_type
        );
        RETURN NEW;
    END IF;

    -- Log task updates
    IF TG_OP = 'UPDATE' THEN
        -- Status change
        IF OLD.status != NEW.status THEN
            INSERT INTO task_history (
                task_id, site_id, event_type, event_description,
                old_values, new_values, performed_by, workflow_stage
            ) VALUES (
                NEW.id, NEW.site_id, 'STATUS_CHANGED',
                'Status changed from ' || OLD.status || ' to ' || NEW.status,
                jsonb_build_object('status', OLD.status),
                jsonb_build_object('status', NEW.status),
                NEW.assigned_to, NEW.workflow_type
            );
        END IF;

        -- Decision made
        IF OLD.decision IS DISTINCT FROM NEW.decision AND NEW.decision IS NOT NULL THEN
            INSERT INTO task_history (
                task_id, site_id, event_type, event_description,
                old_values, new_values, performed_by, workflow_stage, decision, comments
            ) VALUES (
                NEW.id, NEW.site_id, 'DECISION_MADE',
                'Decision made: ' || NEW.decision,
                jsonb_build_object('decision', OLD.decision),
                jsonb_build_object('decision', NEW.decision),
                NEW.assigned_to, NEW.workflow_type, NEW.decision, NEW.decision_comments
            );
        END IF;

        -- Assignment change
        IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
            INSERT INTO task_history (
                task_id, site_id, event_type, event_description,
                old_values, new_values, performed_by, workflow_stage
            ) VALUES (
                NEW.id, NEW.site_id, 'ASSIGNED',
                'Task reassigned from ' || COALESCE(OLD.assigned_to, 'unassigned') || ' to ' || COALESCE(NEW.assigned_to, 'unassigned'),
                jsonb_build_object('assigned_to', OLD.assigned_to),
                jsonb_build_object('assigned_to', NEW.assigned_to),
                NEW.assigned_by, NEW.workflow_type
            );
        END IF;

        -- Task completion
        IF OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL THEN
            INSERT INTO task_history (
                task_id, site_id, event_type, event_description,
                new_values, performed_by, workflow_stage
            ) VALUES (
                NEW.id, NEW.site_id, 'COMPLETED',
                'Task completed',
                jsonb_build_object('completed_at', NEW.completed_at, 'status', NEW.status),
                NEW.assigned_to, NEW.workflow_type
            );
        END IF;

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS task_history_trigger ON tasks;
CREATE TRIGGER task_history_trigger
    AFTER INSERT OR UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION log_task_history();

-- Create ATP workflow status tracking table
CREATE TABLE IF NOT EXISTS atp_workflow_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atp_id UUID REFERENCES atp_documents(id) ON DELETE CASCADE,
    site_id VARCHAR(100),
    current_stage VARCHAR(100),
    current_status VARCHAR(50),
    workflow_type VARCHAR(20), -- SOFTWARE, HARDWARE, BOTH
    total_stages INTEGER DEFAULT 0,
    completed_stages INTEGER DEFAULT 0,
    progress_percentage INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    estimated_completion TIMESTAMP,
    actual_completion TIMESTAMP,
    sla_status VARCHAR(20) DEFAULT 'ON_TIME', -- ON_TIME, AT_RISK, OVERDUE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for ATP workflow status
CREATE INDEX IF NOT EXISTS idx_atp_workflow_status_atp_id ON atp_workflow_status(atp_id);
CREATE INDEX IF NOT EXISTS idx_atp_workflow_status_site_id ON atp_workflow_status(site_id);
CREATE INDEX IF NOT EXISTS idx_atp_workflow_status_current_status ON atp_workflow_status(current_status);
CREATE INDEX IF NOT EXISTS idx_atp_workflow_status_sla_status ON atp_workflow_status(sla_status);

-- Add comments for ATP workflow status
COMMENT ON TABLE atp_workflow_status IS 'Real-time ATP workflow progress tracking';
COMMENT ON COLUMN atp_workflow_status.sla_status IS 'SLA compliance status: ON_TIME, AT_RISK, OVERDUE';
COMMENT ON COLUMN atp_workflow_status.progress_percentage IS 'Calculated workflow completion percentage';

-- Create function to update ATP workflow status
CREATE OR REPLACE FUNCTION update_atp_workflow_status()
RETURNS TRIGGER AS $$
DECLARE
    workflow_record RECORD;
    total_stages_count INTEGER;
    completed_stages_count INTEGER;
    progress_pct INTEGER;
    sla_status_val VARCHAR(20);
BEGIN
    -- Get workflow information
    SELECT 
        ad.id as atp_id,
        ad.site_id,
        ad.current_stage,
        ad.current_status,
        ad.workflow_path as workflow_type,
        ad.submission_date
    INTO workflow_record
    FROM atp_documents ad
    WHERE ad.id = COALESCE(NEW.atp_id, OLD.atp_id);

    -- Count total and completed stages
    SELECT COUNT(*) INTO total_stages_count
    FROM atp_review_stages 
    WHERE atp_id = workflow_record.atp_id;

    SELECT COUNT(*) INTO completed_stages_count
    FROM atp_review_stages 
    WHERE atp_id = workflow_record.atp_id AND review_status = 'completed';

    -- Calculate progress percentage
    progress_pct := CASE 
        WHEN total_stages_count > 0 THEN (completed_stages_count * 100 / total_stages_count)
        ELSE 0 
    END;

    -- Determine SLA status
    SELECT CASE
        WHEN COUNT(*) FILTER (WHERE sla_deadline < CURRENT_TIMESTAMP AND review_status = 'pending') > 0 THEN 'OVERDUE'
        WHEN COUNT(*) FILTER (WHERE sla_deadline < CURRENT_TIMESTAMP + INTERVAL '6 hours' AND review_status = 'pending') > 0 THEN 'AT_RISK'
        ELSE 'ON_TIME'
    END INTO sla_status_val
    FROM atp_review_stages
    WHERE atp_id = workflow_record.atp_id;

    -- Insert or update workflow status
    INSERT INTO atp_workflow_status (
        atp_id, site_id, current_stage, current_status, workflow_type,
        total_stages, completed_stages, progress_percentage, sla_status,
        started_at, updated_at
    ) VALUES (
        workflow_record.atp_id,
        workflow_record.site_id,
        workflow_record.current_stage,
        workflow_record.current_status,
        workflow_record.workflow_type,
        total_stages_count,
        completed_stages_count,
        progress_pct,
        sla_status_val,
        workflow_record.submission_date,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (atp_id) DO UPDATE SET
        current_stage = EXCLUDED.current_stage,
        current_status = EXCLUDED.current_status,
        completed_stages = EXCLUDED.completed_stages,
        progress_percentage = EXCLUDED.progress_percentage,
        sla_status = EXCLUDED.sla_status,
        actual_completion = CASE 
            WHEN EXCLUDED.progress_percentage = 100 THEN CURRENT_TIMESTAMP
            ELSE atp_workflow_status.actual_completion
        END,
        updated_at = CURRENT_TIMESTAMP;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for ATP workflow status updates
DROP TRIGGER IF EXISTS atp_workflow_status_trigger ON atp_review_stages;
CREATE TRIGGER atp_workflow_status_trigger
    AFTER INSERT OR UPDATE OR DELETE ON atp_review_stages
    FOR EACH ROW EXECUTE FUNCTION update_atp_workflow_status();

DROP TRIGGER IF EXISTS atp_document_status_trigger ON atp_documents;
CREATE TRIGGER atp_document_status_trigger
    AFTER UPDATE ON atp_documents
    FOR EACH ROW EXECUTE FUNCTION update_atp_workflow_status();