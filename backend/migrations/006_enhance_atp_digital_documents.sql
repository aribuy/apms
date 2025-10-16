-- EATP Phase 1: Enhanced Digital Document Management
-- Migration: 006_enhance_atp_digital_documents.sql

-- Add digital document fields to atp_documents table
ALTER TABLE atp_documents 
ADD COLUMN IF NOT EXISTS document_version VARCHAR(20) DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS is_digital BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS template_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS form_data JSONB,
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS digital_signatures JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS revision_history JSONB DEFAULT '[]'::jsonb;

-- Create document templates table
CREATE TABLE IF NOT EXISTS atp_document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_code VARCHAR(50) UNIQUE NOT NULL,
    template_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'hardware', 'software', 'hybrid'
    version VARCHAR(20) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    form_schema JSONB NOT NULL, -- JSON schema for form fields
    checklist_items JSONB DEFAULT '[]'::jsonb,
    workflow_config JSONB DEFAULT '{}'::jsonb,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create document attachments table
CREATE TABLE IF NOT EXISTS atp_document_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atp_id UUID REFERENCES atp_documents(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    file_type VARCHAR(50), -- 'evidence', 'supporting', 'signature', 'revision'
    uploaded_by VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Insert default templates
INSERT INTO atp_document_templates (template_code, template_name, category, form_schema, checklist_items) VALUES
('HW_BASIC_V1', 'Hardware ATP - Basic Template', 'hardware', 
 '{"sections": [
   {"id": "site_info", "title": "Site Information", "fields": [
     {"name": "site_id", "type": "text", "required": true, "label": "Site ID"},
     {"name": "site_name", "type": "text", "required": true, "label": "Site Name"},
     {"name": "coordinates", "type": "coordinates", "required": true, "label": "GPS Coordinates"}
   ]},
   {"id": "equipment", "title": "Equipment Details", "fields": [
     {"name": "equipment_type", "type": "select", "required": true, "label": "Equipment Type", "options": ["Radio", "Antenna", "Power", "Transmission"]},
     {"name": "vendor", "type": "text", "required": true, "label": "Vendor"},
     {"name": "model", "type": "text", "required": true, "label": "Model"}
   ]}
 ]}'::jsonb,
 '[
   {"section": "Physical Installation", "items": ["Equipment mounted securely", "Cables properly routed", "Grounding installed"]},
   {"section": "Power Systems", "items": ["AC power connected", "DC power verified", "Backup power tested"]},
   {"section": "RF Testing", "items": ["VSWR measurements", "Power output verified", "Frequency accuracy"]}
 ]'::jsonb),

('SW_BASIC_V1', 'Software ATP - Basic Template', 'software',
 '{"sections": [
   {"id": "software_info", "title": "Software Information", "fields": [
     {"name": "software_version", "type": "text", "required": true, "label": "Software Version"},
     {"name": "release_notes", "type": "textarea", "required": false, "label": "Release Notes"},
     {"name": "installation_method", "type": "select", "required": true, "label": "Installation Method", "options": ["Remote", "On-site", "Automated"]}
   ]},
   {"id": "configuration", "title": "Configuration", "fields": [
     {"name": "config_backup", "type": "file", "required": true, "label": "Configuration Backup"},
     {"name": "parameters", "type": "textarea", "required": true, "label": "Key Parameters"}
   ]}
 ]}'::jsonb,
 '[
   {"section": "Installation", "items": ["Software installed successfully", "Version verified", "Dependencies checked"]},
   {"section": "Configuration", "items": ["Parameters configured", "Backup created", "Settings verified"]},
   {"section": "Testing", "items": ["Functionality tested", "Performance verified", "Integration confirmed"]}
 ]'::jsonb);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_atp_templates_category ON atp_document_templates(category);
CREATE INDEX IF NOT EXISTS idx_atp_templates_active ON atp_document_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_atp_attachments_atp ON atp_document_attachments(atp_id);
CREATE INDEX IF NOT EXISTS idx_atp_attachments_type ON atp_document_attachments(file_type);

-- Add comments
COMMENT ON TABLE atp_document_templates IS 'Templates for digital ATP forms with configurable schemas';
COMMENT ON TABLE atp_document_attachments IS 'File attachments for ATP documents including evidence and supporting files';
COMMENT ON COLUMN atp_documents.form_data IS 'JSON data from digital form submission';
COMMENT ON COLUMN atp_documents.digital_signatures IS 'Array of digital signature records';
COMMENT ON COLUMN atp_documents.attachments IS 'Array of attachment references';