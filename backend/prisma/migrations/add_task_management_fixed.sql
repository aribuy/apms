-- Task Management Tables (Fixed)
CREATE TABLE task_types (
    id TEXT DEFAULT gen_random_uuid()::TEXT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    workflow_config JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tasks (
    id TEXT DEFAULT gen_random_uuid()::TEXT PRIMARY KEY,
    task_code VARCHAR(50) UNIQUE NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Assignment (using TEXT to match users.id type)
    assigned_to TEXT REFERENCES users(id),
    assigned_by TEXT REFERENCES users(id),
    assigned_role VARCHAR(50),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'normal',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    due_date TIMESTAMP,
    
    -- References
    site_id TEXT,
    document_id TEXT,
    parent_task_id TEXT REFERENCES tasks(id),
    
    -- Task data
    task_data JSONB,
    result_data JSONB
);

-- Indexes for performance
CREATE INDEX idx_tasks_assigned_status ON tasks(assigned_to, status);
CREATE INDEX idx_tasks_role_status ON tasks(assigned_role, status);
CREATE INDEX idx_tasks_created ON tasks(created_at DESC);

-- Insert initial task types
INSERT INTO task_types (code, name, description) VALUES 
('ATP_SUBMISSION', 'ATP Submission', 'Vendor submits ATP documentation'),
('ATP_REVIEW', 'ATP Review', 'Reviewer validates ATP submission'),
('PUNCHLIST_RECTIFICATION', 'Punchlist Rectification', 'Vendor fixes issues'),
('PUNCHLIST_VERIFICATION', 'Punchlist Verification', 'Verify rectification completed');
