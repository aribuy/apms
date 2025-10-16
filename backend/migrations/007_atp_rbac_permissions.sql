-- ATP RBAC Implementation
-- Migration: 007_atp_rbac_permissions.sql

-- Add role tracking to ATP documents
ALTER TABLE atp_documents 
ADD COLUMN IF NOT EXISTS uploaded_by_role VARCHAR(50),
ADD COLUMN IF NOT EXISTS can_be_reviewed_by TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS current_reviewer_role VARCHAR(50);

-- Update existing ATPs with review permissions
UPDATE atp_documents 
SET can_be_reviewed_by = CASE 
  WHEN final_category = 'hardware' THEN ARRAY['FOP_RTS', 'REGION_TEAM', 'RTH']
  WHEN final_category = 'software' THEN ARRAY['BO', 'SME', 'HEAD_NOC']
  ELSE ARRAY[]::TEXT[]
END
WHERE can_be_reviewed_by = '{}';

-- Create role permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    permission VARCHAR(50) NOT NULL,
    can_access BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert ATP permissions
INSERT INTO role_permissions (role_name, module, permission, can_access) VALUES
-- Upload permissions (Vendor Admin only)
('VENDOR_ADMIN', 'atp', 'upload', true),
('VENDOR_STAFF', 'atp', 'upload', true),

-- Review permissions (Approval workflow)
('FOP_RTS', 'atp', 'review.hardware.stage1', true),
('REGION_TEAM', 'atp', 'review.hardware.stage2', true),
('RTH', 'atp', 'review.hardware.stage3', true),
('RTH', 'atp', 'approve.hardware', true),

('BO', 'atp', 'review.software.stage1', true),
('SME', 'atp', 'review.software.stage2', true),
('HEAD_NOC', 'atp', 'review.software.stage3', true),
('HEAD_NOC', 'atp', 'approve.software', true),

-- Default permissions (all roles)
('VENDOR_ADMIN', 'sites', 'view', true),
('VENDOR_STAFF', 'sites', 'view', true),
('FOP_RTS', 'sites', 'view', true),
('REGION_TEAM', 'sites', 'view', true),
('RTH', 'sites', 'view', true),
('BO', 'sites', 'view', true),
('SME', 'sites', 'view', true),
('HEAD_NOC', 'sites', 'view', true),

('VENDOR_ADMIN', 'tasks', 'view', true),
('VENDOR_STAFF', 'tasks', 'view', true),
('FOP_RTS', 'tasks', 'view', true),
('REGION_TEAM', 'tasks', 'view', true),
('RTH', 'tasks', 'view', true),
('BO', 'tasks', 'view', true),
('SME', 'tasks', 'view', true),
('HEAD_NOC', 'tasks', 'view', true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_name);
CREATE INDEX IF NOT EXISTS idx_atp_reviewer_role ON atp_documents(current_reviewer_role);
CREATE INDEX IF NOT EXISTS idx_atp_can_review ON atp_documents USING GIN(can_be_reviewed_by);