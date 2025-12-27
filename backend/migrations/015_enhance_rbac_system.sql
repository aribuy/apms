-- Migration 015: Enhanced RBAC System
-- Purpose: Migrate from hardcoded RBAC to database-driven permission system
-- Author: System Enhancement
-- Date: 2025-12-27

-- ============================================
-- 1. PERMISSIONS TABLE
-- ============================================
-- Create permissions table with granular access control
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    module VARCHAR(100) NOT NULL, -- e.g., 'atp', 'sites', 'tasks', 'users'
    action VARCHAR(50) NOT NULL, -- e.g., 'create', 'read', 'update', 'delete', 'approve'
    resource VARCHAR(100), -- e.g., 'atp_documents', 'sites', 'users'
    condition JSONB, -- Additional conditions (e.g., {"own_only": true})
    is_system BOOLEAN DEFAULT false, -- System permissions cannot be deleted
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_permissions_module ON permissions(module);
CREATE INDEX idx_permissions_action ON permissions(action);
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_active ON permissions(is_active);

-- ============================================
-- 2. ROLE_PERMISSIONS TABLE (Enhanced)
-- ============================================
-- Enhanced role_permissions with more granular control
CREATE TABLE IF NOT EXISTS role_permissions_enhanced (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id VARCHAR(100) NOT NULL, -- References roles table
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_by VARCHAR(100), -- User who granted this permission
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    conditions JSONB, -- Override conditions at role level
    expires_at TIMESTAMP WITH TIME ZONE, -- Temporary permissions
    is_revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by VARCHAR(100),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Create indexes
CREATE INDEX idx_role_perms_role ON role_permissions_enhanced(role_id);
CREATE INDEX idx_role_perms_permission ON role_permissions_enhanced(permission_id);
CREATE INDEX idx_role_perms_active ON role_permissions_enhanced(is_revoked);
CREATE INDEX idx_role_perms_expiry ON role_permissions_enhanced(expires_at);

-- ============================================
-- 3. AUDIT LOGS ENHANCED TABLE
-- ============================================
-- Enhanced audit_logs table for compliance-grade audit trail
CREATE TABLE IF NOT EXISTS audit_logs_enhanced (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100),
    user_role VARCHAR(50),
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL, -- e.g., 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'LOGIN'
    resource_type VARCHAR(100), -- e.g., 'atp_document', 'site', 'user', 'role'
    resource_id VARCHAR(255),
    resource_name VARCHAR(255),
    old_data JSONB, -- Complete before state
    new_data JSONB, -- Complete after state
    changes JSONB, -- Diff of what changed
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    request_id VARCHAR(255) UNIQUE, -- For request tracing
    status VARCHAR(50), -- e.g., 'SUCCESS', 'FAILURE', 'PARTIAL'
    error_message TEXT,
    metadata JSONB, -- Additional context
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    correlation_id VARCHAR(255) -- For distributed tracing
);

-- Create indexes for audit queries
CREATE INDEX idx_audit_user ON audit_logs_enhanced(user_id);
CREATE INDEX idx_audit_action ON audit_logs_enhanced(action);
CREATE INDEX idx_audit_resource ON audit_logs_enhanced(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_logs_enhanced(created_at DESC);
CREATE INDEX idx_audit_status ON audit_logs_enhanced(status);
CREATE INDEX idx_audit_session ON audit_logs_enhanced(session_id);
CREATE INDEX idx_audit_request ON audit_logs_enhanced(request_id);

-- ============================================
-- 4. NOTIFICATION TEMPLATES TABLE
-- ============================================
-- Notification templates for different events
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- e.g., 'EMAIL', 'IN_APP', 'SMS', 'WEBHOOK'
    event VARCHAR(100) NOT NULL, -- e.g., 'ATP_SUBMITTED', 'ATP_APPROVED', 'TASK_ASSIGNED'
    subject_template TEXT,
    body_template TEXT,
    recipients JSONB, -- e.g., ["approver", "submitter"]
    channels JSONB, -- e.g., ["EMAIL", "IN_APP"]
    priority VARCHAR(20) DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, URGENT
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. SEED DATA: PERMISSIONS
-- ============================================
-- Insert ATP permissions
INSERT INTO permissions (code, name, module, action, resource) VALUES
-- ATP Document Permissions
('atp.document.create', 'Create ATP Document', 'atp', 'create', 'atp_document'),
('atp.document.read', 'View ATP Document', 'atp', 'read', 'atp_document'),
('atp.document.update', 'Update ATP Document', 'atp', 'update', 'atp_document'),
('atp.document.delete', 'Delete ATP Document', 'atp', 'delete', 'atp_document'),
('atp.document.submit', 'Submit ATP Document', 'atp', 'submit', 'atp_document'),
('atp.document.approve', 'Approve ATP Document', 'atp', 'approve', 'atp_document'),
('atp.document.reject', 'Reject ATP Document', 'atp', 'reject', 'atp_document'),
('atp.document.upload', 'Upload ATP Document', 'atp', 'upload', 'atp_document'),
('atp.document.review', 'Review ATP Document', 'atp', 'review', 'atp_document'),

-- ATP Workflow Permissions
('atp.workflow.software', 'Manage Software ATP Workflow', 'atp', 'manage', 'workflow_software'),
('atp.workflow.hardware', 'Manage Hardware ATP Workflow', 'atp', 'manage', 'workflow_hardware'),
('atp.workflow.combined', 'Manage Combined ATP Workflow', 'atp', 'manage', 'workflow_combined'),

-- Site Management Permissions
('site.create', 'Create Site', 'sites', 'create', 'site'),
('site.read', 'View Site', 'sites', 'read', 'site'),
('site.update', 'Update Site', 'sites', 'update', 'site'),
('site.delete', 'Delete Site', 'sites', 'delete', 'site'),
('site.import', 'Import Sites', 'sites', 'import', 'sites'),

-- Task Management Permissions
('task.create', 'Create Task', 'tasks', 'create', 'task'),
('task.read', 'View Task', 'tasks', 'read', 'task'),
('task.update', 'Update Task', 'tasks', 'update', 'task'),
('task.delete', 'Delete Task', 'tasks', 'delete', 'task'),
('task.assign', 'Assign Task', 'tasks', 'assign', 'task'),
('task.complete', 'Complete Task', 'tasks', 'complete', 'task'),

-- User Management Permissions
('user.create', 'Create User', 'users', 'create', 'user'),
('user.read', 'View User', 'users', 'read', 'user'),
('user.update', 'Update User', 'users', 'update', 'user'),
('user.delete', 'Delete User', 'users', 'delete', 'user'),
('user.assign_role', 'Assign User Role', 'users', 'assign_role', 'user'),

-- Role Management Permissions
('role.create', 'Create Role', 'users', 'create', 'role'),
('role.read', 'View Role', 'users', 'read', 'role'),
('role.update', 'Update Role', 'users', 'update', 'role'),
('role.delete', 'Delete Role', 'users', 'delete', 'role'),
('role.assign_permission', 'Assign Role Permission', 'users', 'assign_permission', 'role'),

-- Dashboard & Reports
('dashboard.view', 'View Dashboard', 'dashboard', 'read', 'dashboard'),
('dashboard.stats', 'View Statistics', 'dashboard', 'read', 'stats'),
('reports.view', 'View Reports', 'reports', 'read', 'reports'),
('reports.export', 'Export Reports', 'reports', 'export', 'reports'),

-- Template Management
('template.create', 'Create Template', 'templates', 'create', 'template'),
('template.read', 'View Template', 'templates', 'read', 'template'),
('template.update', 'Update Template', 'templates', 'update', 'template'),
('template.delete', 'Delete Template', 'templates', 'delete', 'template'),

-- Audit Logs
('audit.view', 'View Audit Logs', 'audit', 'read', 'audit_logs'),
('audit.export', 'Export Audit Logs', 'audit', 'export', 'audit_logs')

ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 6. SEED DATA: ROLE PERMISSIONS MAPPING
-- ============================================
-- Map existing roles to permissions
INSERT INTO role_permissions_enhanced (role_id, permission_id)
SELECT
    r.name as role_id,
    p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE
    -- Administrator: All permissions
    (r.name = 'Administrator' OR r.name = 'admin') OR

    -- BO: Software ATP review
    (r.name = 'BO' AND p.module IN ('atp', 'tasks', 'sites', 'dashboard')
     AND p.action IN ('read', 'review', 'approve')
     AND p.resource IN ('workflow_software', 'atp_document')) OR

    -- SME: Software ATP review (stage 2)
    (r.name = 'SME' AND p.module IN ('atp', 'tasks', 'sites', 'dashboard')
     AND p.action IN ('read', 'review', 'approve')
     AND p.resource IN ('workflow_software', 'atp_document')) OR

    -- HEAD_NOC: Software ATP final approval
    (r.name = 'HEAD_NOC' AND p.module IN ('atp', 'tasks', 'sites', 'dashboard')
     AND p.action IN ('read', 'review', 'approve')) OR

    -- FOP_RTS: Hardware ATP review (stage 1)
    (r.name = 'FOP_RTS' AND p.module IN ('atp', 'tasks', 'sites', 'dashboard')
     AND p.action IN ('read', 'review', 'approve')
     AND p.resource IN ('workflow_hardware', 'atp_document')) OR

    -- REGION_TEAM: Hardware ATP review (stage 2)
    (r.name = 'REGION_TEAM' AND p.module IN ('atp', 'tasks', 'sites', 'dashboard')
     AND p.action IN ('read', 'review', 'approve')
     AND p.resource IN ('workflow_hardware', 'atp_document')) OR

    -- RTH: Hardware ATP final approval
    (r.name = 'RTH' AND p.module IN ('atp', 'tasks', 'sites', 'dashboard')
     AND p.action IN ('read', 'review', 'approve')) OR

    -- VENDOR: Upload ATP documents
    (r.name = 'VENDOR' AND p.code IN ('atp.document.upload', 'atp.document.create', 'site.read')) OR

    -- VENDOR_ADMIN: Upload + bulk operations
    (r.name = 'VENDOR_ADMIN' AND p.code IN ('atp.document.upload', 'atp.document.create', 'site.import', 'site.read', 'task.read')) OR

    -- DOC_CONTROL: Document control operations
    (r.name = 'DOC_CONTROL' AND p.module IN ('atp', 'sites', 'tasks', 'dashboard')
     AND p.action IN ('create', 'read', 'update')) OR

    -- SITE_MANAGER: Site and task management
    (r.name = 'SITE_MANAGER' AND p.module IN ('sites', 'tasks', 'dashboard')
     AND p.action IN ('read', 'update'))

ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- 7. SEED DATA: NOTIFICATION TEMPLATES
-- ============================================
INSERT INTO notification_templates (code, name, type, event, subject_template, body_template, recipients, channels) VALUES
('ATP_SUBMITTED', 'ATP Document Submitted', 'IN_APP', 'ATP_SUBMITTED',
 'ATP Submitted: {{atp_code}}',
 'ATP document {{atp_code}} for site {{site_id}} has been submitted by {{submitter}}',
 '["bo", "sme", "head_noc", "fop_rts", "region_team", "rth"]',
 '["IN_APP"]'),

('ATP_APPROVED', 'ATP Document Approved', 'IN_APP', 'ATP_APPROVED',
 'ATP Approved: {{atp_code}}',
 'ATP document {{atp_code}} has been approved by {{approver}}',
 '["submitter"]',
 '["IN_APP"]'),

('ATP_REJECTED', 'ATP Document Rejected', 'IN_APP', 'ATP_REJECTED',
 'ATP Rejected: {{atp_code}}',
 'ATP document {{atp_code}} has been rejected by {{reviewer}}. Reason: {{reason}}',
 '["submitter"]',
 '["IN_APP"]'),

('TASK_ASSIGNED', 'Task Assigned', 'IN_APP', 'TASK_ASSIGNED',
 'New Task: {{task_code}}',
 'You have been assigned task {{task_code}}: {{title}}',
 '["assigned_to"]',
 '["IN_APP"]'),

('TASK_DUE_SOON', 'Task Due Soon', 'IN_APP', 'TASK_DUE_SOON',
 'Task Due Soon: {{task_code}}',
 'Task {{task_code}} is due on {{due_date}}',
 '["assigned_to"]',
 '["IN_APP"]'),

('PUNCHLIST_CREATED', 'Punchlist Item Created', 'IN_APP', 'PUNCHLIST_CREATED',
 'Punchlist Created: {{atp_code}}',
 'Punchlist item {{item_number}} has been created for ATP {{atp_code}}',
 '["vendor", "assigned_team"]',
 '["IN_APP"]')

ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 8. CREATE VIEWS FOR COMMON QUERIES
-- ============================================

-- View: User Permissions (Denormalized for fast access)
CREATE OR REPLACE VIEW v_user_permissions AS
SELECT
    ur.user_id,
    r.name as role_name,
    r.level as access_level,
    p.code as permission_code,
    p.name as permission_name,
    p.module,
    p.action,
    p.resource,
    rp.conditions,
    rp.expires_at,
    rp.is_revoked
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions_enhanced rp ON r.name = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.is_revoked = false
  AND (rp.expires_at IS NULL OR rp.expires_at > NOW())
  AND p.is_active = true;

-- View: Effective Permissions (Includes role-based + direct user permissions)
CREATE OR REPLACE VIEW v_effective_permissions AS
SELECT DISTINCT
    user_id,
    permission_code,
    permission_name,
    module,
    action,
    resource,
    conditions
FROM v_user_permissions;

-- ============================================
-- 9. CREATE HELPER FUNCTIONS
-- ============================================

-- Function: Check if user has permission
CREATE OR REPLACE FUNCTION has_permission(
    p_user_id VARCHAR,
    p_permission_code VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    v_has_perm BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM v_effective_permissions
        WHERE user_id = p_user_id
        AND permission_code = p_permission_code
    ) INTO v_has_perm;

    RETURN v_has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Log audit entry
CREATE OR REPLACE FUNCTION log_audit(
    p_user_id VARCHAR,
    p_user_email VARCHAR,
    p_user_role VARCHAR,
    p_action VARCHAR,
    p_resource_type VARCHAR,
    p_resource_id VARCHAR,
    p_old_data JSONB,
    p_new_data JSONB,
    p_ip_address INET,
    p_user_agent TEXT,
    p_status VARCHAR DEFAULT 'SUCCESS'
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO audit_logs_enhanced (
        user_id, user_email, user_role, action, resource_type, resource_id,
        old_data, new_data, ip_address, user_agent, status
    ) VALUES (
        p_user_id, p_user_email, p_user_role, p_action, p_resource_type, p_resource_id,
        p_old_data, p_new_data, p_ip_address, p_user_agent, p_status
    ) RETURNING id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. CREATE TRIGGER FOR AUTOMATIC AUDIT LOGGING
-- ============================================

-- Function to calculate data changes
CREATE OR REPLACE FUNCTION audit_trigger_func() RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_user_id VARCHAR := 'system';
    v_action VARCHAR;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := NULL;
        v_action := 'DELETE';
        INSERT INTO audit_logs_enhanced (user_id, action, resource_type, resource_id, old_data, new_data)
        VALUES (v_user_id, v_action, TG_TABLE_NAME, (OLD.id)::TEXT, v_old_data, v_new_data);
        RETURN OLD;

    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        v_action := 'UPDATE';

        -- Calculate diff
        INSERT INTO audit_logs_enhanced (user_id, action, resource_type, resource_id, old_data, new_data, changes)
        VALUES (
            v_user_id, v_action, TG_TABLE_NAME, (NEW.id)::TEXT,
            v_old_data, v_new_data,
            jsonb_build_object('changes', jsonb_object_keys(NEW) - jsonb_object_keys(OLD))
        );
        RETURN NEW;

    ELSIF (TG_OP = 'INSERT') THEN
        v_old_data := NULL;
        v_new_data := to_jsonb(NEW);
        v_action := 'CREATE';
        INSERT INTO audit_logs_enhanced (user_id, action, resource_type, resource_id, old_data, new_data)
        VALUES (v_user_id, v_action, TG_TABLE_NAME, (NEW.id)::TEXT, v_old_data, v_new_data);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to critical tables
DROP TRIGGER IF EXISTS audit_atp_documents ON atp_documents;
CREATE TRIGGER audit_atp_documents
    AFTER INSERT OR UPDATE OR DELETE ON atp_documents
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_sites ON sites;
CREATE TRIGGER audit_sites
    AFTER INSERT OR UPDATE OR DELETE ON sites
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_tasks ON tasks;
CREATE TRIGGER audit_tasks
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_users ON users;
CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================
-- 11. GRANT PERMISSIONS
-- ============================================
-- Grant access to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON permissions TO apms_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON role_permissions_enhanced TO apms_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON audit_logs_enhanced TO apms_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_templates TO apms_user;
GRANT SELECT ON v_user_permissions TO apms_user;
GRANT SELECT ON v_effective_permissions TO apms_user;
GRANT EXECUTE ON FUNCTION has_permission TO apms_user;
GRANT EXECUTE ON FUNCTION log_audit TO apms_user;

-- ============================================
-- END OF MIGRATION
-- ============================================

-- Verification Queries:
-- SELECT COUNT(*) FROM permissions; -- Should be 40+
-- SELECT COUNT(*) FROM role_permissions_enhanced; -- Role-permission mappings
-- SELECT * FROM v_user_permissions WHERE user_id = 'user-1'; -- Check user permissions
-- SELECT * FROM audit_logs_enhanced ORDER BY created_at DESC LIMIT 10; -- Recent audit logs
