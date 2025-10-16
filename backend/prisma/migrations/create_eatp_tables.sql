-- ATP Documents Table (Core)
CREATE TABLE atp_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atp_code VARCHAR(50) UNIQUE NOT NULL, -- ATP-2025-0001 format
    site_id VARCHAR(100) NOT NULL, -- KAL-KB-SBS-0730
    project_code VARCHAR(100),
    
    -- Document Analysis & Category
    document_type VARCHAR(50) CHECK (document_type IN ('hardware', 'software', 'mixed', 'unknown')),
    detected_category VARCHAR(50),
    category_confidence INTEGER CHECK (category_confidence >= 0 AND category_confidence <= 100),
    manual_override BOOLEAN DEFAULT FALSE,
    override_reason TEXT,
    final_category VARCHAR(50),
    
    -- Workflow Routing
    workflow_path VARCHAR(50) CHECK (workflow_path IN ('hardware', 'software', 'dual')),
    current_stage VARCHAR(100),
    current_status VARCHAR(50) DEFAULT 'pending_review',
    
    -- Document Details
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- Vendor Information
    vendor_id VARCHAR(100) DEFAULT 'aviat',
    submitted_by VARCHAR(100),
    submission_date TIMESTAMP DEFAULT NOW(),
    submission_notes TEXT,
    
    -- Tracking
    completion_percentage INTEGER DEFAULT 0,
    approval_date TIMESTAMP,
    final_approver VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ATP Review Stages Table
CREATE TABLE atp_review_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atp_id UUID REFERENCES atp_documents(id) ON DELETE CASCADE,
    
    stage_number INTEGER NOT NULL,
    stage_code VARCHAR(50), -- STAGE_1_HW, STAGE_2_HW, STAGE_1_SW, etc
    stage_name VARCHAR(100), -- "FOP/RTS Review", "BO Review", etc
    assigned_role VARCHAR(50), -- FOP_RTS, BO, SME, etc
    
    reviewer_id VARCHAR(100),
    review_status VARCHAR(50) DEFAULT 'pending',
    decision VARCHAR(50) CHECK (decision IN ('approve', 'reject', 'approve_with_punchlist', NULL)),
    
    review_started_at TIMESTAMP,
    review_completed_at TIMESTAMP,
    sla_deadline TIMESTAMP,
    
    comments TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ATP Checklist Items Table
CREATE TABLE atp_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atp_id UUID REFERENCES atp_documents(id) ON DELETE CASCADE,
    review_stage_id UUID REFERENCES atp_review_stages(id),
    
    item_number VARCHAR(20), -- "2.1.2.1", "2.1.2.2"
    section_name VARCHAR(200), -- "CABLE INSTALLATION"
    description TEXT, -- "Power Cable Connection"
    
    result VARCHAR(20) CHECK (result IN ('pass', 'fail', 'na', NULL)),
    severity VARCHAR(20) CHECK (severity IN ('critical', 'major', 'minor', NULL)),
    
    has_issue BOOLEAN DEFAULT FALSE,
    issue_description TEXT,
    evidence_attached BOOLEAN DEFAULT FALSE,
    reviewer_notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ATP Punchlist Items Table  
CREATE TABLE atp_punchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atp_id UUID REFERENCES atp_documents(id) ON DELETE CASCADE,
    review_stage_id UUID REFERENCES atp_review_stages(id),
    punchlist_number VARCHAR(20) UNIQUE, -- PL-2025-0001
    
    -- Issue Details
    test_item_reference VARCHAR(100),
    issue_category VARCHAR(100),
    issue_description TEXT,
    severity VARCHAR(20) CHECK (severity IN ('critical', 'major', 'minor')),
    
    -- Status & Assignment
    status VARCHAR(50) DEFAULT 'identified',
    assigned_team VARCHAR(200),
    target_completion_date DATE,
    
    -- Evidence
    evidence_before JSONB,
    evidence_after JSONB,
    rectification_notes TEXT,
    verification_notes TEXT,
    
    -- Tracking
    identified_by VARCHAR(100),
    identified_at TIMESTAMP DEFAULT NOW(),
    completed_by VARCHAR(100),
    completed_at TIMESTAMP,
    verified_by VARCHAR(100),
    verified_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_atp_site_id ON atp_documents(site_id);
CREATE INDEX idx_atp_status ON atp_documents(current_status);
CREATE INDEX idx_atp_workflow ON atp_documents(workflow_path);
CREATE INDEX idx_review_stages_atp ON atp_review_stages(atp_id);
CREATE INDEX idx_checklist_atp ON atp_checklist_items(atp_id);
CREATE INDEX idx_punchlist_atp ON atp_punchlist_items(atp_id);
CREATE INDEX idx_punchlist_status ON atp_punchlist_items(status);
