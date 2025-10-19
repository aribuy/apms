-- Migration: Auto Task Generation for ATP Sites
-- Create trigger to automatically generate tasks when sites with atp_required=true are created/updated

-- Function to generate tasks for ATP sites
CREATE OR REPLACE FUNCTION generate_atp_task()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    -- Only create tasks if atp_required is true and no existing tasks for this site
    IF NEW.atp_required = true AND NOT EXISTS (
        SELECT 1 FROM tasks 
        WHERE task_code LIKE 'TSK-' || NEW.site_id || '-%'
    ) THEN
        -- Get next task number
        SELECT COALESCE(MAX(CAST(SUBSTRING(task_code FROM 'TSK-[^-]+-([0-9]+)') AS INTEGER)), 0) + 1
        INTO next_num
        FROM tasks 
        WHERE task_code ~ '^TSK-[^-]+-[0-9]+$';
        
        -- Create SOFTWARE task if needed
        IF NEW.atp_type IN ('SOFTWARE', 'BOTH') THEN
            INSERT INTO tasks (
                id, task_code, task_type, title, description, status, priority, created_at, updated_at
            ) VALUES (
                gen_random_uuid(),
                'TSK-' || NEW.site_id || '-' || LPAD(next_num::text, 3, '0'),
                'ATP_SOFTWARE',
                'ATP Software Upload - ' || NEW.site_name,
                'Upload ATP software document for site ' || NEW.site_id,
                'pending', 'high', NOW(), NOW()
            );
            next_num := next_num + 1;
        END IF;
        
        -- Create HARDWARE task if needed
        IF NEW.atp_type IN ('HARDWARE', 'BOTH') THEN
            INSERT INTO tasks (
                id, task_code, task_type, title, description, status, priority, created_at, updated_at
            ) VALUES (
                gen_random_uuid(),
                'TSK-' || NEW.site_id || '-' || LPAD(next_num::text, 3, '0'),
                'ATP_HARDWARE',
                'ATP Hardware Upload - ' || NEW.site_name,
                'Upload ATP hardware document for site ' || NEW.site_id,
                'pending', 'high', NOW(), NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT and UPDATE on sites table
DROP TRIGGER IF EXISTS trigger_generate_atp_task ON sites;
CREATE TRIGGER trigger_generate_atp_task
    AFTER INSERT OR UPDATE OF atp_required ON sites
    FOR EACH ROW
    EXECUTE FUNCTION generate_atp_task();