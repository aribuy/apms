# ATP Approval Flow - End-to-End User Journey

**Document Version**: 1.0
**Date**: 2025-12-31
**Purpose**: Comprehensive user journey for ATP document submission and approval workflow

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Actors & Roles](#actors--roles)
3. [Complete User Journey](#complete-user-journey)
4. [Use Case Details](#use-case-details)
5. [Screen-by-Screen Flow](#screen-by-screen-flow)
6. [API Sequence Diagrams](#api-sequence-diagrams)
7. [State Transitions](#state-transitions)
8. [Edge Cases & Error Handling](#edge-cases--error-handling)
9. [User Interface Mockups](#user-interface-mockups)

---

## 🎯 OVERVIEW

### What is ATP Approval Flow?

ATP (Acceptance Test Procedure) Approval Flow is a multi-stage review process for technical documents submitted by vendors. The workflow ensures proper validation of site installation/commissioning documents before final acceptance.

### Key Features

- **Multi-stage approval**: 3-5 stages depending on document type
- **Role-based routing**: Each stage assigned to specific role (BO, SME, HEAD_NOC, etc.)
- **SLA tracking**: Each stage has deadline (24-48 hours)
- **Checklist validation**: Reviewers evaluate checklist items
- **Punchlist management**: Issues can be tracked and rectified
- **Audit trail**: All decisions logged with comments

### Document Categories (Final)

Reference: `docs/testing/ATP_CATEGORIES_COMPLETE.md`

1. **RAN_MW**: RAN, MW New, MW Upgrade, MW Reroute
   - Flow: FOP_RTS → REGION_TEAM → RTH (3 stages, 5 days SLA)
2. **PLN_UPGRADE**: PLN Upgrade, Power
   - Flow: ROH → RTH (2 stages, 3 days SLA)
3. **DISMANTLE_DROP**: Dismantle Drop
   - Flow: FOP_RTS → REGION_TEAM → PMO (3 stages, 6 days SLA)
4. **DISMANTLE_KEEP**: Dismantle Keep
   - Flow: ROH → RTH (2 stages, 3 days SLA)
5. **SOFTWARE_LICENSE**: Software, License, Upgrade, Bandwidth
   - Flow: BO → SME → HEAD_NOC (3 stages, 5 days SLA)

---

## 👥 ACTORS & ROLES

### Primary Actors

| Role | Full Name | Responsibility | Stage Assignment |
|------|-----------|----------------|------------------|
| **DOC_CONTROL** | Document Control | Upload & categorize ATP documents | Initial submission |
| **BO** | Business Operations | Review commercial & operational aspects | Stage 1 (SOFTWARE_LICENSE) |
| **FOP_RTS** | Field Operations/RTS | Review field installation reports | Stage 1 (RAN_MW, DISMANTLE_DROP) |
| **SME** | Subject Matter Expert | Review technical specifications | Stage 2 (SOFTWARE_LICENSE) |
| **REGION_TEAM** | Region Team | Review regional compliance | Stage 2 (RAN_MW, DISMANTLE_DROP) |
| **HEAD_NOC** | Head NOC | Final approval for software | Stage 3 (SOFTWARE_LICENSE) |
| **RTH** | Regional Technical Head | Final approval for hardware | Stage 2/3 (RAN_MW, PLN_UPGRADE, DISMANTLE_KEEP) |
| **ROH** | Regional Operation Head | Power/dismantle review | Stage 1 (PLN_UPGRADE, DISMANTLE_KEEP) |
| **PMO** | Project Management Office | Dismantle drop final approval | Stage 3 (DISMANTLE_DROP) |
| **QA_ENGINEER** | QA Engineer | Pre-approval + rectification validation | Pre-review + rectification |
| **PIC** | Punchlist owner | Approve punchlist closure | Rectification stage |
| **VENDOR** | Vendor | Rectify punchlist issues | After approval with punchlist |

### Secondary Actors

| Role | Responsibility |
|------|----------------|
| **SUPERADMIN** | System administration, user management |
| **ADMIN** | Workspace management, configuration |

**Note:** Ensure `QA_ENGINEER` role exists in the workspace before running the flow.

---

## 🔄 COMPLETE USER JOURNEY

### Phase 1: Document Submission (Vendor)

#### Step 1.1: Login to APMS
```
Actor: Vendor (DOC_CONTROL role)
Screen: Login Page
Action: Enter credentials (email + password)
System: Validates credentials, issues JWT token
Result: Redirected to Dashboard
```

**API Call**:
```http
POST /api/v1/auth/login
Request:
{
  "email": "vendor@company.com",
  "password": "VendorPassword123"
}

Response (200):
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "user": {
      "id": "vendor_001",
      "email": "vendor@company.com",
      "role": "DOC_CONTROL"
    },
    "workspace": {
      "id": "workspace-123",
      "name": "XLSMART Project",
      "role": "DOC_CONTROL"
    }
  }
}
```

#### Step 1.2: Navigate to ATP Management
```
Actor: Vendor
Screen: Dashboard
Action: Click "My Inbox" (formerly ATP Process) menu
Result: List of submitted ATP documents + "Upload New ATP" button
```

**API Call**:
```http
GET /api/v1/atp?workspaceId=workspace-123
Response:
{
  "success": true,
  "data": [
    {
      "id": "atp-001",
      "atp_code": "ATP-SITE-001",
      "site_id": "SITE-123",
      "document_type": "software",
      "current_status": "approved",
      "submission_date": "2025-12-25T10:00:00Z"
    }
  ]
}
```

#### Step 1.3: Upload ATP Document
```
Actor: Vendor
Screen: ATP Upload Form
Action:
  1. Fill form:
     - Site ID (dropdown/search)
     - Document Type: Software/Hardware/Both (dropdown)
     - Upload PDF/file
     - Add submission notes
  2. Click "Submit ATP"

System Actions:
  - Save file to storage
  - Auto-categorize document using AI (software/hardware/both)
  - Create atp_documents record
  - Set status: 'pending_review'
```

**API Call**:
```http
POST /api/v1/atp/upload
Request:
{
  "siteId": "SITE-123",
  "documentType": "software",
  "file": "<base64-encoded file>",
  "fileName": "ATP_Site123_Software.pdf",
  "submittedBy": "vendor_001",
  "submissionNotes": "Software upgrade completed"
}

Response (200):
{
  "success": true,
  "data": {
    "id": "atp-002",
    "atp_code": "ATP-SITE-002",
    "site_id": "SITE-123",
    "document_type": "software",
    "detected_category": "software",
    "category_confidence": 0.95,
    "current_status": "pending_review",
    "submission_date": "2025-12-31T10:00:00Z"
  }
}
```

#### Step 1.4: System Auto-Categorization (Background)
```
System Background Process (atpCategorization.js):
1. Analyze uploaded document
2. Extract keywords, document structure
3. Match against category patterns:
   - Software: "software", "upgrade", "configuration", "license"
   - Hardware: "hardware", "installation", "equipment", "antenna"
   - Both: combination of both
4. Set detected_category + category_confidence
5. If confidence < 0.8, flag for manual review
```

#### Step 1.5: Manual Category Override (Optional)
```
Actor: Document Control
Screen: ATP Management
Action:
  1. View document with auto-detected category
  2. If incorrect, click "Override Category"
  3. Select correct category from dropdown
  4. Add reason for override
  5. Click "Confirm"

Result: final_category updated, manual_override = true
```

---

### Phase 2: QA Pre-Approval + Workflow Initialization

#### Step 2.1: QA Pre-Approval (New)
```
Trigger: Doc Control submits ATP document
Actor: QA Engineer

Action:
  1. Validate document completeness + metadata
  2. Decision:
     - APPROVE → proceed to workflow initialization
     - REJECT → return to Doc Control for resubmission
```

#### Step 2.2: Workflow Auto-Start
```
Trigger: QA approval
Actor: System (Background job)

Action:
  1. Determine workflow path based on category
  2. Call workflow initialization endpoint
  3. Create review stages based on category-specific roles
  4. Set first stage status to 'pending', others to 'waiting'
  5. Send notification to assigned role (Stage 1 approver)
```

**API Call**:
```http
POST /api/v1/atp/workflow/initialize/atp-002
Request:
{
  "workflow_type": "SOFTWARE_LICENSE"
}

Response (200):
{
  "success": true,
  "data": {
    "workflow_type": "SOFTWARE",
    "stages": [
      {
        "id": "stage-001",
        "stage_number": 1,
        "stage_code": "BO_REVIEW",
        "stage_name": "Business Operations Review",
        "assigned_role": "BO",
        "sla_deadline": "2026-01-02T10:00:00Z",  // 48 hours from now
        "review_status": "pending"
      },
      {
        "id": "stage-002",
        "stage_number": 2,
        "stage_code": "SME_REVIEW",
        "stage_name": "SME Technical Review",
        "assigned_role": "SME",
        "sla_deadline": "2026-01-04T10:00:00Z",
        "review_status": "waiting"
      },
      {
        "id": "stage-003",
        "stage_number": 3,
        "stage_code": "HEAD_NOC_REVIEW",
        "stage_name": "Head NOC Final Review",
        "assigned_role": "HEAD_NOC",
        "sla_deadline": "2026-01-05T10:00:00Z",
        "review_status": "waiting"
      }
    ]
  }
}
```

#### Step 2.3: ATP Document Status Update
```
Database Update:
- atp_documents.workflow_path = 'SOFTWARE'
- atp_documents.current_stage = 'Business Operations Review'
- atp_documents.current_status = 'in_review'
- atp_documents.completion_percentage = 0
```

#### Step 2.4: Notification to Stage 1 Approver
```
Notification (Email/In-app):
To: All users with BO role in workspace
Subject: New ATP Review Required - ATP-SITE-002
Body:
  A new ATP document requires your review:
  - ATP Code: ATP-SITE-002
  - Site: SITE-123
  - Document Type: Software
  - Stage: Business Operations Review
  - SLA Deadline: 2026-01-02 10:00 WIB

  Click here to review: /atp-management/review/atp-002
```

---

### Phase 3: Stage 1 Review - Business Operations (BO)

#### Step 3.1: BO Reviews Pending List
```
Actor: Business Operations (BO role)
Screen: Review Dashboard
Action:
  1. Login to APMS
  2. Navigate to "My Inbox"
  3. View "Pending Reviews" tab
  4. See list of ATPs awaiting BO review with:
     - ATP Code
     - Site ID
     - Document Type
     - Time remaining (SLA status)
     - Review button
```

**API Call**:
```http
GET /api/v1/atp/workflow/reviews/pending?role=BO
Response:
{
  "success": true,
  "data": [
    {
      "id": "stage-001",
      "atp_id": "atp-002",
      "atp_code": "ATP-SITE-002",
      "site_id": "SITE-123",
      "document_type": "software",
      "stage_number": 1,
      "stage_name": "Business Operations Review",
      "assigned_role": "BO",
      "review_status": "pending",
      "sla_deadline": "2026-01-02T10:00:00Z",
      "sla_status": "normal",
      "hours_remaining": 48
    }
  ],
  "count": 1,
  "stats": {
    "total": 1,
    "overdue": 0,
    "urgent": 0
  }
}
```

#### Step 3.2: BO Opens Review Interface
```
Actor: BO
Screen: Review Dashboard
Action: Click "Review" button for ATP-SITE-002
Result: Navigate to Approval Interface
```

**API Call**:
```http
GET /api/v1/atp/workflow/atp-002/status
Response:
{
  "success": true,
  "data": {
    "atp_code": "ATP-SITE-002",
    "site_id": "SITE-123",
    "document_type": "software",
    "current_status": "in_review",
    "current_stage": "Business Operations Review",
    "workflow_path": "SOFTWARE",
    "progress_percentage": 0,
    "stages": [
      {
        "id": "stage-001",
        "stage_number": 1,
        "stage_name": "Business Operations Review",
        "assigned_role": "BO",
        "review_status": "pending",
        "sla_deadline": "2026-01-02T10:00:00Z"
      },
      // ... other stages
    ],
    "active_punchlist_items": 0
  }
}
```

#### Step 3.3: BO Reviews Document
```
Actor: BO
Screen: Approval Interface
Tabs Available:
  1. Checklist
  2. Evidence
  3. Document
  4. History

Action:
  1. Click "Checklist" tab
  2. View checklist items (auto-generated from template)
  3. For each item:
     - Review description
     - Check severity (critical/major/minor)
     - Select result: PASS / FAIL / N/A
     - Add reviewer notes if needed
  4. Optionally switch to "Evidence" tab to view uploaded photos
  5. Optionally switch to "Document" tab to view full PDF
```

**Sample Checklist Display**:
```
┌─────────────────────────────────────────────────────────────┐
│ ATP-SITE-002 - Business Operations Review                     │
├─────────────────────────────────────────────────────────────┤
│ CHECKLIST ITEMS                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [T001] Equipment Inventory Complete                           │
│ Severity: MAJOR                                              │
│ Description: IDU/Card Information Complete                     │
│ ○ PASS  ○ FAIL  ○ N/A                                         │
│ Notes:                                                        │
│ [_____________________]                                      │
│                                                              │
│ [T005] Software License Verification                          │
│ Severity: CRITICAL                                           │
│ Description: Radio Capacity License Verification                │
│ ○ PASS  ○ FAIL  ○ N/A                                         │
│ Notes: License valid until 2026                             │
│ [_____________________]                                      │
│                                                              │
│ [T012] Configuration Verification                             │
│ Severity: MAJOR                                              │
│ Description: Sync Interval Configuration                       │
│ ○ PASS  ○ FAIL  ○ N/A                                         │
│ Notes:                                                        │
│ [_____________________]                                      │
│                                                              │
│ Progress: 0/3 completed                                      │
└─────────────────────────────────────────────────────────────┘
```

#### Step 3.4: BO Makes Approval Decision

**Option A: Approve (All items PASS)**
```
Actor: BO
Screen: Approval Interface (bottom panel)
Action:
  1. Select decision: "Approve"
  2. Add overall comments: "All checklist items passed"
  3. Click "Submit Review"

Backend Processing:
  1. Update stage-001: decision='APPROVE', status='completed'
  2. Save checklist results
  3. Activate stage-002 (SME Review): status='pending'
  4. Update atp_documents.current_stage = 'SME Technical Review'
  5. Notify SME reviewer

Result:
  - Stage 1 complete
  - ATP progresses to Stage 2
  - BO redirected to dashboard
```

**Option B: Approve with Punchlist (Minor/Major issues)**
```
Actor: BO
Screen: Approval Interface (bottom panel)
Action:
  1. Select decision: "Approve with Punchlist"
  2. Punchlist items section appears
  3. Click "Add Item" for each issue:
     - Description: "Sync interval not configured"
     - Severity: Major
     - Category: "Configuration"
  4. Add comments: "Minor issues found, proceed with caution"
  5. Click "Submit Review"

Backend Processing:
  1. Update stage-001: decision='APPROVE_WITH_PUNCHLIST', status='completed'
  2. Save checklist results
  3. Create punchlist items in atp_punchlist_items table
  4. Activate stage-002 (SME Review)
  5. Update atp_documents.current_stage = 'SME Technical Review'
  6. Notify SME reviewer + Vendor

Result:
  - Stage 1 complete
  - Punchlist items created (visible to Vendor + SME)
  - ATP progresses to Stage 2
```

**Option C: Reject (Critical issues)**
```
Actor: BO
Screen: Approval Interface (bottom panel)
Action:
  1. Select decision: "Reject"
  2. Add rejection comments: "Critical safety issue found - equipment not verified"
  3. Click "Submit Review"

Backend Processing:
  1. Update stage-001: decision='REJECT', status='completed'
  2. Save checklist results
  3. Set all pending stages to 'cancelled'
  4. Update atp_documents:
     - current_status = 'rejected'
     - completion_percentage = 0
  5. Notify Vendor: "ATP rejected - please resubmit"

Result:
  - Workflow terminated
  - ATP rejected
  - Vendor must fix and resubmit
```

**API Call** (for Approve decision):
```http
POST /api/v1/atp/workflow/reviews/stage-001/decision
Request:
{
  "decision": "APPROVE",
  "reviewer_id": "bo_user_001",
  "comments": "All checklist items passed",
  "checklist_results": [
    {
      "item_number": "T001",
      "section_name": "Equipment Inventory",
      "description": "IDU/Card Information Complete",
      "result": "pass",
      "severity": "major",
      "has_issue": false,
      "reviewer_notes": "All equipment verified"
    },
    {
      "item_number": "T005",
      "section_name": "Software License Verification",
      "description": "Radio Capacity License Verification",
      "result": "pass",
      "severity": "critical",
      "has_issue": false,
      "reviewer_notes": "License valid until 2026"
    },
    {
      "item_number": "T012",
      "section_name": "Configuration Verification",
      "description": "Sync Interval Configuration",
      "result": "pass",
      "severity": "major",
      "has_issue": false,
      "reviewer_notes": "Configuration correct"
    }
  ],
  "punchlist_items": []
}

Response (200):
{
  "success": true,
  "data": {
    "review_stage": "stage-001",
    "decision": "APPROVE",
    "workflow_status": {
      "status": "progressed",
      "next_stage": "SME Technical Review"
    },
    "punchlist_created": 0
  }
}
```

---

### Phase 4: Stage 2 Review - SME Technical Review

#### Step 4.1: SME Receives Notification
```
Notification (Email/In-app):
To: SME role users
Subject: ATP Review Required - ATP-SITE-002
Body:
  Previous stage completed: Business Operations Review (Approved)
  Your review is now required for:
  - ATP Code: ATP-SITE-002
  - Stage: SME Technical Review
  - SLA Deadline: 2026-01-04 10:00 WIB

  Click here to review: /atp-management/review/atp-002
```

#### Step 4.2: SME Opens Review Interface
```
Actor: SME
Screen: Review Dashboard → Pending Reviews
Action:
  1. See ATP-SITE-002 in list
  2. Time remaining shows: "2d remaining" (normal SLA)
  3. Click "Review" button

Note: SME can see previous stage decisions in "History" tab
```

#### Step 4.3: SME Reviews Checklist (with Punchlist Awareness)
```
Actor: SME
Screen: Approval Interface

Checklist Items (Technical Focus):
  - Equipment compatibility verification
  - Software version validation
  - Configuration parameters check
  - Integration testing results

Special Consideration:
  - If punchlist items from BO exist:
    - Display in sidebar: "2 Punchlist Items from Previous Stage"
    - Must verify rectification evidence
  - Technical depth: Review engineering specifications
```

#### Step 4.4: SME Makes Decision

**Scenario: Approve with Punchlist (Technical Issue Found)**
```
Decision: APPROVE_WITH_PUNCHLIST
Checklist Results:
  - 8 items: PASS
  - 1 item: FAIL (Critical - Software version mismatch)
  - 2 items: N/A

Punchlist Items Created:
  1. "Software version mismatch - Current: v1.2, Required: v2.0"
     Severity: CRITICAL
     Category: "Software"
  2. "Configuration parameter out of range"
     Severity: MAJOR
     Category: "Configuration"

Workflow Progression:
  - Stage 2 (SME) completed
  - Stage 3 (HEAD_NOC) activated
  - Both SME and HEAD_NOC can see punchlist items
```

---

### Phase 5: Stage 3 Review - Final Approval (HEAD_NOC)

#### Step 5.1: HEAD_NOC Receives Notification
```
Notification:
  Previous stages completed: BO (Approved) + SME (Approved with Punchlist)
  Stage: Final Review
  Note: 2 punchlist items require attention
```

#### Step 5.2: HEAD_NOC Reviews Complete History
```
Actor: HEAD_NOC
Screen: Approval Interface → History Tab

History Display:
┌──────────────────────────────────────────────────────────┐
│ Review History                                                │
├──────────────────────────────────────────────────────────┤
│ Stage 1: Business Operations Review                          │
│ Reviewer: BO User (bo_user_001)                             │
│ Decision: APPROVE                                            │
│ Date: 2025-12-31 14:30 WIB                                 │
│ Comments: All checklist items passed                          │
│                                                              │
│ Stage 2: SME Technical Review                                 │
│ Reviewer: SME User (sme_user_001)                            │
│ Decision: APPROVE_WITH_PUNCHLIST                             │
│ Date: 2026-01-01 10:15 WIB                                  │
│ Comments: Technical validation complete, minor issues found  │
│ Punchlist Items: 2                                           │
│   1. Software version mismatch (CRITICAL)                      │
│   2. Configuration parameter out of range (MAJOR)              │
└──────────────────────────────────────────────────────────┘
```

#### Step 5.3: HEAD_NOC Makes Final Decision

**Option A: Approve (Despite Punchlist)**
```
Decision Logic:
  - Even with punchlist items, HEAD_NOC can approve if:
    1. Issues are not safety-critical
    2. Punchlist can be rectified post-approval
    3. Documentation is otherwise complete

Result:
  - ATP status: 'approved'
  - completion_percentage: 100
  - approval_date: set to now
  - Punchlist items remain open for Vendor to rectify
```

**Option B: Reject (Due to Critical Issues)**
```
Decision: REJECT
Reason: Software version mismatch is critical for operation

Result:
  - ATP status: 'rejected'
  - completion_percentage: 0
  - All stages cancelled
  - Vendor must fix and resubmit entire document
```

---

### Phase 6: Punchlist Rectification (if applicable)

#### Step 6.1: Vendor Views Punchlist Items
```
Actor: Vendor
Screen: ATP Management → Punchlist Management

Punchlist Items Display:
┌──────────────────────────────────────────────────────────┐
│ Punchlist Items for ATP-SITE-002                           │
├──────────────────────────────────────────────────────────┤
│ 1. Software version mismatch                               │
│    Severity: CRITICAL                                      │
│    Status: Identified                                      │
│    Assigned: VENDOR                                        │
│    Target Date: 2026-01-15                                │
│    [Upload Evidence After Rectification]                   │
│                                                              │
│ 2. Configuration parameter out of range                     │
│    Severity: MAJOR                                         │
│    Status: Identified                                      │
│    Assigned: VENDOR                                        │
│    Target Date: 2026-01-10                                │
│    [Upload Evidence After Rectification]                   │
└──────────────────────────────────────────────────────────┘
```

#### Step 6.2: Vendor Rectifies Issue
```
Actor: Vendor (Field Team)
Action:
  1. Go to site
  2. Upgrade software to v2.0
  3. Take before/after photos
  4. Document rectification

Upload Evidence:
  - Photo 1: New software version screenshot
  - Photo 2: Configuration parameters screenshot
  - Document: Rectification notes
```

#### Step 6.3: Submit Rectification
```
Actor: Vendor
Screen: Punchlist Item Detail
Action:
  1. Click "Upload Evidence After"
  2. Select files (photos, documents)
  3. Add rectification notes: "Software upgraded to v2.0, parameters corrected"
  4. Click "Submit Rectification"

API Call:
POST /api/v1/atp/workflow/punchlist/pl-001/complete
Request:
{
  "rectification_notes": "Software upgraded to v2.0",
  "evidence_after": {
    "photos": ["photo1.jpg", "photo2.jpg"],
    "documents": ["cert.pdf"]
  },
  "completed_by": "vendor_001"
}

Response:
{
  "success": true,
  "data": {
    "punchlist_item": {
      "id": "pl-001",
      "status": "rectified",
      "completed_at": "2026-01-05T15:00:00Z"
    },
    "remaining_items": 1,
    "workflow_update": {
      "message": "1 remaining item(s) - verification pending"
    }
  }
}
```

#### Step 6.4: QA Validates Rectification (New)
```
Actor: QA Engineer
Action:
  1. Review evidence photos/documents
  2. Decision:
     - APPROVE → forward to PIC who created punchlist
     - REJECT → return to Doc Control
```

#### Step 6.5: PIC Reviews (New)
```
Actor: PIC who created the punchlist item (must be same PIC)
Action:
  1. Review rectification evidence
  2. Decision:
     - APPROVE → close punchlist item
     - REJECT → return to Doc Control
```

---

## 🖊️ Signature Requirement (New)

Each approver must upload a signature image in their user profile. The signature is rendered on the ATP document cover page once the approval stage is completed.

---

## 🔌 API Endpoint Mapping (QA Approval + PIC Review)

### QA Pre-Approval (before workflow init)
- `GET /api/v1/atp/qa/pending`
  - Returns ATP documents awaiting QA decision
- `POST /api/v1/atp/:atpId/qa/decision`
  - Body: `{ decision: "APPROVE" | "REJECT", comments?: string }`
  - If APPROVE → initialize workflow based on category
  - If REJECT → return to Doc Control

### QA Rectification Validation (after vendor evidence)
- `GET /api/v1/atp/punchlist/pending-qa`
  - Returns punchlist items in `rectified` status
- `POST /api/v1/atp/punchlist/:punchlistId/qa/decision`
  - Body: `{ decision: "APPROVE" | "REJECT", comments?: string }`
  - If APPROVE → forward to original PIC who created the punchlist
  - If REJECT → return to Doc Control (resubmit evidence)

### PIC Review (original punchlist creator only)
- `GET /api/v1/atp/punchlist/pending-pic`
  - Returns punchlist items assigned to the original PIC
- `POST /api/v1/atp/punchlist/:punchlistId/pic/decision`
  - Body: `{ decision: "APPROVE" | "REJECT", comments?: string }`
  - If APPROVE → close punchlist item
  - If REJECT → return to Doc Control

---

## ✍️ Signature Placement Rules (ATP Cover Page)

Signature placement must be **defined by approval configuration** so each category can map its required approver slots to specific roles. Each slot shows:
- Signature image (from user profile)
- PIC Name (from user record)
- Approved Date (timestamp when approver clicks approve)

### Slot Mapping Pattern (example for HARDWARE 3-stage / RAN_MW)
1. Slot 1: `FOP_RTS` (Approved by MS RTS)
2. Slot 2: `REGION_TEAM` (Approved by XLS RTH Team)
3. Slot 3: `RTH` (Approved by XLS RTH)

### Slot Mapping Pattern (example for SOFTWARE_LICENSE)
1. Slot 1: `BO`
2. Slot 2: `SME`
3. Slot 3: `HEAD_NOC`

### Rules
- Slot labels come from approval config (not hardcoded).
- Name + date are rendered at approval time.
- If a stage is not yet approved, the slot is shown as empty or “Pending”.

---

## ⚠️ Implementation Gaps (Current)

1. **QA_ENGINEER role missing**
   - QA approval flow cannot run until role + user are created.
2. **QA Approval + PIC Review endpoints not yet available**
   - Required: `GET /api/v1/atp/qa/pending`, `POST /api/v1/atp/:atpId/qa/decision`
   - Required: `GET /api/v1/atp/punchlist/pending-qa`, `POST /api/v1/atp/punchlist/:punchlistId/qa/decision`
   - Required: `GET /api/v1/atp/punchlist/pending-pic`, `POST /api/v1/atp/punchlist/:punchlistId/pic/decision`
3. **Signature placement config not implemented**
   - Approval config must define signature slots per category.

## 🧭 USE CASE DETAILS

### UC-01: Bulk Register Sites (CSV) + Auto ATP Tasks
**Actor**: DOC_CONTROL / ADMIN  
**Preconditions**:
- Logged in to Workspace `XLSMART-AVIAT`
- CSV has required columns (siteId, siteName, region, city, lat/long)
**Trigger**: Upload CSV from Site Management → Add Sites

**Main Flow**:
1. User downloads `Register_Sites_Template.csv`.
2. User fills data and sets `ATP Required` = YES/TRUE and `ATP Type` = SOFTWARE/HARDWARE/BOTH.
3. User uploads CSV in Add Sites modal.
4. System validates duplicates by `siteId`.
5. System upserts by `siteId`:
   - New site → create record.
   - Existing site → update fields.
6. If `ATP Required` changes from NO → YES, system creates ATP tasks:
   - SOFTWARE → `ATP_SOFTWARE`
   - HARDWARE → `ATP_HARDWARE`
   - BOTH → create both tasks
7. System displays summary (created/updated/tasksCreated).

**Postconditions**:
- `sites` records exist with correct `workspace_id`.
- `tasks` created for ATP sites.

**Failure Paths**:
- Missing required columns → validation error.
- Invalid lat/long → row rejected.
- Duplicate siteId in same CSV → skipped/flagged.

---

### UC-02: Manual Add Site (No ATP by default)
**Actor**: DOC_CONTROL / ADMIN  
**Preconditions**:
- Logged in to workspace
**Trigger**: Add Site (manual form)

**Main Flow**:
1. User fills site data.
2. `ATP Required` defaults to **NO** for manual add.
3. System creates site record only (no ATP tasks).

**Postconditions**:
- Site exists; `atp_required = false`.

**Alternate Flow (Enable ATP Later)**:
1. User downloads existing sites CSV.
2. Set `ATP Required = YES` for the target site.
3. Re-upload CSV → creates ATP tasks only for NO→YES transitions.

---

### UC-03: ATP Submission (Doc Control)
**Actor**: DOC_CONTROL  
**Preconditions**:
- Site exists
- ATP task visible in Task Management
**Trigger**: Upload ATP document

**Main Flow**:
1. User opens ATP Management → Upload ATP.
2. Select site + category.
3. Upload PDF.
4. System creates `atp_documents` with status `awaiting_qa_approval`.

**Postconditions**:
- ATP document created, waiting QA.

---

### UC-04: QA Approval
**Actor**: QA_ENGINEER  
**Preconditions**:
- ATP status = `awaiting_qa_approval`
**Trigger**: QA Approval queue

**Main Flow**:
1. QA reviews document metadata.
2. Decision:
   - **Approve** → workflow initialized, first stage set to pending.
   - **Reject** → status `rejected_pre_qa`, returned to Doc Control.

**Postconditions**:
- Approved: `current_status = in_review`
- Rejected: `current_status = rejected_pre_qa`

---

### UC-05: Multi-Stage Review (BO/SME/HEAD_NOC or FOP/REGION/RTH/PMO/ROH)
**Actor**: Reviewer role for the stage  
**Preconditions**:
- Stage review_status = `pending`
**Trigger**: Pending reviews list

**Main Flow**:
1. Reviewer opens ATP, checks checklist + comments.
2. Decision:
   - **Approve** → next stage becomes `pending`.
   - **Approve with Punchlist** → create punchlist items, continue to next stage.
   - **Reject (Critical)** → ATP goes to `rectification`.

**Postconditions**:
- If final stage approved → `current_status = approved` or `approved_with_punchlist`.

---

### UC-06: Punchlist Rectification (QA + PIC)
**Actor**: Vendor, QA_ENGINEER, PIC  
**Preconditions**:
- Punchlist items exist
- ATP status = `approved_with_punchlist` or `rectification`
**Trigger**: Punchlist queue

**Main Flow**:
1. Vendor uploads evidence (rectified).
2. QA validates:
   - Approve → status `qa_verified`
   - Reject → back to Doc Control
3. PIC reviews:
   - Approve → close punchlist
   - Reject → back to Doc Control

**Postconditions**:
- All punchlists closed → ATP `completed`.

---

### UC-07: Signature Placement
**Actor**: Reviewer with signature configured  
**Preconditions**:
- Reviewer has uploaded signature image (profile)
**Trigger**: Approval recorded

**Main Flow**:
1. On each stage approval, system maps role to signature slot.
2. Signature + name + approval date are rendered on ATP cover page.

**Postconditions**:
- ATP PDF shows correct signatures in correct slots.

---

### UC-08: Export Existing Sites for ATP Activation
**Actor**: ADMIN / DOC_CONTROL  
**Preconditions**:
- Sites exist with `ATP Required = NO`
**Trigger**: Export existing sites

**Main Flow**:
1. Export CSV including `siteId`.
2. Update `ATP Required` to YES for chosen rows.
3. Re-upload CSV.

**Postconditions**:
- System creates ATP tasks only for NO→YES changes.

---

## 📱 SCREEN-BY-SCREEN FLOW

### Screen 1: Login Page
```
┌─────────────────────────────────────────┐
│         APMS Login                       │
├─────────────────────────────────────────┤
│                                          │
│  Email: [___________________]             │
│  Password: [___________________]         │
│                                          │
│           [Login]                       │
│                                          │
│  Test Credentials:                       │
│  superadmin@aviat.com / AviatSuper123   │
│                                          │
└─────────────────────────────────────────┘
```

### Screen 2: Dashboard (Vendor View)
```
┌─────────────────────────────────────────────────────────────┐
│ APMS Dashboard - Vendor (DOC_CONTROL)                           │
├─────────────────────────────────────────────────────────────┤
│ Workspace: XLSMART Project | Role: DOC_CONTROL                     │
│                                                              │
│ Quick Actions:                                                │
│  [Upload New ATP] [View My ATPs] [Check Punchlist]           │
│                                                              │
│ Statistics:                                                  │
│  Pending Reviews: 0                                           │
│  Approved ATps: 5                                             │
│  Open Punchlist Items: 3                                      │
│                                                              │
│ Recent ATP Documents:                                         │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ ATP-SITE-002              Software    In Review            │ │
│ │ Status: Awaiting SME Review                            │ │
│ │ Submitted: 2 days ago                                   │ │
│ │ [View Details]                                           │ │
│ └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Screen 3: Review Dashboard (BO View)
```
┌─────────────────────────────────────────────────────────────┐
│ ATP Review Dashboard - Business Operations                      │
├─────────────────────────────────────────────────────────────┤
│ Statistics:                                                  │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐                │
│  │ Pending: │  │ Approved: │  │ Rejected:   │                │
│  │    3     │  │    45    │  │     2      │                │
│  └──────────┘ └──────────┘ └────────────┘                │
│                                                              │
│ Pending Reviews (3)                                           │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ ATP-SITE-002   Software   2d remaining                 │ │
│ │ Site: SITE-123                                         │ │
│ │ [👁️ Review]                                             │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ ATP-SITE-003   Hardware   5h remaining (Urgent!)        │ │
│ │ Site: SITE-456                                         │ │
│ │ [👁️ Review]                                             │ │
│ └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Screen 3B: QA Approval Queue (New)
```
┌─────────────────────────────────────────────────────────────┐
│ QA Approval Queue                                             │
├─────────────────────────────────────────────────────────────┤
│ Pending QA (3)                                                │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ ATP-SITE-101   Category: RAN_MW                            │ │
│ │ Submitted by: doc.control@aviat.com                        │ │
│ │ File: ATP-SITE-101.pdf                                     │ │
│ │ [View Document] [Approve] [Reject]                         │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ QA Decision Modal                                             │
│  - Decision: Approve / Reject                                 │
│  - Notes (required on reject)                                 │
└─────────────────────────────────────────────────────────────┘
```

### Screen 3C: User Profile - Signature Upload (New)
```
┌─────────────────────────────────────────────────────────────┐
│ User Profile                                                  │
├─────────────────────────────────────────────────────────────┤
│ Full Name: [________________________]                         │
│ Role: QA_ENGINEER / BO / SME / HEAD_NOC / RTH                  │
│                                                              │
│ Signature Image                                               │
│  [ Upload Signature ]  (PNG/JPG, max 1MB, transparent OK)     │
│  Preview:                                                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │             (signature preview)                          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ [Save Profile]                                                │
└─────────────────────────────────────────────────────────────┘
```

### Screen 4: Approval Interface
```
┌─────────────────────────────────────────────────────────────────┐
│ Document Review - ATP-SITE-002                                    │
│ Site: SITE-123 | Type: SOFTWARE | Stage: Business Operations Review   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [Checklist] [Evidence] [Document] [History]                      │
│                                                                 │
│ Checklist Progress: 1/3 completed (33%)                           │
│ ┌─────────────────────────────────────────────────────────┐    │
│ │ Total: 3  Pass: 1  Fail: 0  N/A: 0  Pending: 2         │    │
│ └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│ [T001] Equipment Inventory Complete                              │
│ Severity: MAJOR                                                  │
│ Description: IDU/Card Information Complete                         │
│ ○ PASS  ○ FAIL  ○ N/A                                            │
│ Notes: All equipment verified and tagged                       │
│                                                                 │
│ [T005] Software License Verification                            │
│ Severity: CRITICAL                                               │
│ Description: Radio Capacity License Verification                   │
│ ○ PASS  ○ FAIL  ○ N/A                                            │
│ Notes: License valid until 2026                                │
│                                                                 │
│ [T012] Configuration Verification                               │
│ Severity: MAJOR                                                  │
│ Description: Sync Interval Configuration                          │
│ ○ PASS  ○ FAIL  ○ N/A                                            │
│ Notes: [Not yet reviewed]                                      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Approval Decision                                                │
│                                                                 │
│ ○ Approve     - All items passed, no issues found              │
│ ○ Approve with Punchlist - Minor/Major issues require fix      │
│ ○ Reject      - Critical issues, return to vendor              │
│                                                                 │
│ Comments:                                                       │
│ [_____________________________________________]                   │
│                                                                 │
│ [Save Draft]                    [Submit Review]                     │
└─────────────────────────────────────────────────────────────────┘
```

### Screen 5: Punchlist Management
```
┌─────────────────────────────────────────────────────────────┐
│ Punchlist Items - ATP-SITE-002                               │
├─────────────────────────────────────────────────────────────┤
│ Open Items: 2  Rectified: 1  Verified: 0                  │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 1. Software version mismatch                              │ │
│ │    Severity: 🔴 CRITICAL                                 │ │
│ │    Status: Rectified                                     │ │
│ │    Assigned: VENDOR                                      │
│ │    [View Evidence] [Verify]                              │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ 2. Configuration parameter out of range                 │ │
│ │    Severity: 🟡 MAJOR                                    │
│ │    Status: Identified                                  │
│ │    Assigned: VENDOR                                      │
│ │    Target: 2026-01-10                                   │
│ │    [Upload Evidence]                                    │ │
│ └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 API SEQUENCE DIAGRAMS

### Complete Approval Flow (Happy Path - All Approve)

```
Doc Control     QA Engineer     System        Stage 1        Stage 2        Final Stage
  │                │              │              │              │              │
  │ Upload ATP      │              │              │              │              │
  │───────────────>│              │              │              │              │
  │                │ QA Review     │              │              │              │
  │                │──────────────>│              │              │              │
  │                │ Approve        │              │              │              │
  │                │──────────────>│              │              │              │
  │                │              │ Init Workflow │              │              │
  │                │              │──────────────>│              │              │
  │                │              │ Stage 1 Pending│             │              │
  │                │              │──────────────>│              │              │
  │                │              │              │ Review & Approve│            │
  │                │              │              │──────────────>│              │
  │                │              │ Progress      │              │              │
  │                │              │──────────────>│              │              │
  │                │              │              │ Stage 2 Pending│             │
  │                │              │              │──────────────>│              │
  │                │              │              │ Review & Approve│            │
  │                │              │ Progress      │              │              │
  │                │              │───────────────────────────────────────────>│
  │                │              │              │              │ Final Stage Pending
  │                │              │              │              │──────────────>│
  │                │              │              │              │ Review & Approve
  │                │              │              │              │──────────────>│
  │                │              │ Set Status: Approved/Completed             │
```

### Rejection Flow (QA Pre-Approval or Review Stage)

```
Doc Control     QA Engineer     System        Reviewer
  │                │              │              │
  │ Upload ATP      │              │              │
  │───────────────>│              │              │
  │                │ QA Review     │              │
  │                │──────────────>│              │
  │                │ Reject         │              │
  │                │──────────────>│              │
  │                │              │ Status: rejected_pre_qa
  │  <────────────│              │ Return to Doc Control
```

### Punchlist Rectification Flow (Major/Minor)

```
Reviewer        System        Doc Control     QA Engineer     PIC (Creator)
  │              │              │              │              │
  │ Approve w/PL  │              │              │              │
  │─────────────>│              │              │              │
  │              │ Create Punchlist            │              │
  │              │─────────────>│              │              │
  │              │              │ Upload Evidence             │
  │              │              │─────────────>│              │
  │              │              │              │ QA Validate   │
  │              │              │              │─────────────>│
  │              │              │              │ Approve       │
  │              │              │              │─────────────>│
  │              │              │              │              │ PIC Review
  │              │              │              │              │───────────>
  │              │              │              │              │ Approve → Close
```

---

## 📊 STATE / STATUS TABLES

### ATP Document Status

| Status | Meaning | Next Possible Status |
|--------|---------|----------------------|
| `pending_review` | Uploaded, awaiting QA Approval | `awaiting_qa_approval` |
| `awaiting_qa_approval` | Waiting for QA decision | `in_review`, `rejected_pre_qa` |
| `rejected_pre_qa` | Rejected by QA before workflow | `awaiting_qa_approval` (resubmit) |
| `in_review` | Workflow active | `approved_with_punchlist`, `rejected`, `completed` |
| `approved_with_punchlist` | Final approval reached with open punchlist | `rectification` |
| `rectification` | Punchlist rectification ongoing | `completed`, `rejected` |
| `rejected` | Rejected at review/rectification | `awaiting_qa_approval` (resubmit) |
| `completed` | All stages approved + punchlist closed | — |

### Review Stage Status

| Status | Meaning | Next Possible Status |
|--------|---------|----------------------|
| `waiting` | Stage created, not active | `pending`, `cancelled` |
| `pending` | Awaiting reviewer | `completed`, `cancelled` |
| `completed` | Decision recorded | — |
| `cancelled` | Workflow rejected | — |

### Punchlist Item Status

| Status | Meaning | Next Possible Status |
|--------|---------|----------------------|
| `identified` | Created by reviewer | `rectified` |
| `rectified` | Evidence uploaded | `qa_verified` |
| `qa_verified` | QA approved evidence | `pic_approved` |
| `pic_approved` | PIC approved closure | `closed` |
| `closed` | Finalized | — |
| `rejected` | QA/PIC rejected | `rectified` (resubmit) |

### ATP Task Status (when created via Site Registration)

| Status | Meaning | Next Possible Status |
|--------|---------|----------------------|
| `awaiting_submission` | Awaiting Doc Control upload | `submitted` |
| `submitted` | ATP doc uploaded | `in_review` |
| `in_review` | Workflow active | `rectification_required`, `completed` |
| `rectification_required` | Blocking punchlist | `in_review` (after resubmit) |
| `completed` | ATP fully completed | — |

---

## ⚠️ EDGE CASES & ERROR HANDLING

### Edge Case 1: SLA Breach
```
Scenario: Reviewer does not complete review before SLA deadline

System Action:
1. Mark stage as 'overdue'
2. Send escalation notification:
   - To: Reviewer's manager
   - Subject: "SLA Breached - ATP-SITE-002 - BO Review"
3. Highlight in Review Dashboard with 🔴 red color

Reviewer UI:
┌─────────────────────────────────────────┐
│ ATP-SITE-002                               │
│ Status: 🔴 OVERDUE (2 days late)           │
│ SLA Deadline: 2026-01-02 10:00 WIB         │
│ Actual: 2026-01-04 15:30 WIB                │
│                                              │
│ [Escalate to Manager] [Review Now]          │
└─────────────────────────────────────────┘
```

### Edge Case 2: Reviewer Not Assigned
```
Scenario: All users with BO role are on leave/unavailable

Fallback Mechanism:
1. System checks for available reviewers
2. If no reviewer available:
   - Escalate to SUPERADMIN
   - Option to manually assign reviewer from different role
3. Allow temporary reassignment
```

### Edge Case 3: Conflicting Decisions
```
Scenario: Two reviewers try to submit decision simultaneously

Database Handling:
1. Use optimistic locking with review_status field
2. First submission succeeds
3. Second submission gets 409 Conflict:
   {
     "error": "Review already completed",
     "reviewer": "bo_user_001",
     "completed_at": "2025-12-31T14:30:00Z"
   }
4. Frontend auto-refreshes and shows "Completed" status
```

### Edge Case 4: Document Resubmission After Rejection
```
Scenario: Vendor resubmits after rejection

System Action:
1. Create new atp_documents record (new atp_code)
2. Link to original rejected ATP:
   - previous_atp_id: "atp-002"
   - resubmission_number: 1
3. Start new workflow from Stage 1
4. Preserve rejection history for reference
```

### Edge Case 5: Punchlist Never Rectified
```
Scenario: Vendor fails to rectify punchlist items

After 30 days (configurable):
1. Send reminder notifications to Vendor
2. Escalate to Vendor management
3. After 60 days: mark ATP as "stalled"
4. Require manual intervention to resume
```

---

## 🎨 USER INTERFACE MOCKUPS

### Mobile-First Responsive Design

#### Review Dashboard (Mobile View)
```
┌─────────────────────────────┐
│ ☰ ATP Reviews                │
├─────────────────────────────┤
│ Filters: Role: [BO ▼]        │
├─────────────────────────────┤
│ PENDING (3)                   │
│ ┌─────────────────────────┐ │
│ │ ATP-SITE-002              │ │
│ │ Software ● Normal       │ │
│ │ Due in 2d                │ │
│ │ [Review]                 │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ ATP-SITE-003              │ │
│ │ Hardware 🟡 Urgent        │ │
│ │ Due in 5h                 │ │
│ │ [Review]                 │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ [Load More]                  │
└─────────────────────────────┘
```

#### Checklist Review (Mobile View)
```
┌─────────────────────────────┐
│ ← Back to List    ATP-SITE-002 │
├─────────────────────────────┤
│ Progress: 1/3 (33%)           │
│ ████████░░░░░░░░░░░░░░░       │
├─────────────────────────────┤
│ [T001] Equipment Inventory   │
│ Severity: MAJOR               │
│ Description: IDU/Card...      │
│                               │
│ Result:                       │
│ ○ Pass  ○ Fail  ○ N/A         │
│                               │
│ Notes:                        │
│ [Tap to add notes...]          │
├─────────────────────────────┤
│ [T005] Software License...   │
│ Severity: CRITICAL            │
│ [Review]                      │
├─────────────────────────────┤
│ [Next Item]                   │
└─────────────────────────────┘
```

---

## 📊 SUCCESS CRITERIA

### Definition of Done

For each ATP document, the workflow is complete when:
- ✅ All stages show 'completed' status
- ✅ Final decision is 'approved' or 'rejected'
- ✅ If approved: completion_percentage = 100
- ✅ If rejected: completion_percentage = 0
- ✅ All checklist results saved
- ✅ All decisions have reviewer comments
- ✅ Audit trail complete in database

### Performance SLAs

| Metric | Target | Current |
|--------|--------|---------|
| Initial categorization | < 5 seconds | ✅ Met |
| Review stage load time | < 2 seconds | ✅ Met |
| Decision submission | < 1 second | ✅ Met |
| Punchlist creation | < 2 seconds | ✅ Met |
| Dashboard load time | < 3 seconds | ✅ Met |

### Data Quality Checks

- ✅ No orphaned stages (all stages linked to valid ATP)
- ✅ No missing reviewer IDs in completed stages
- ✅ All SLA deadlines populated correctly
- ✅ All punchlist items have valid severity levels

---

## 🔧 TROUBLESHOOTING GUIDE

### Common Issues

**Issue 1: "No pending reviews show in dashboard"**
```
Possible Causes:
1. No ATP documents in 'in_review' status
2. User role doesn't match any pending stages
3. Workspace filter applied (wrong workspace)

Solutions:
1. Check atp_documents table: SELECT * FROM atp_documents WHERE current_status='in_review'
2. Check atp_review_stages: SELECT * FROM atp_review_stages WHERE review_status='pending'
3. Verify user role: Check workspace_members table
```

**Issue 2: "Submit review button doesn't work"**
```
Possible Causes:
1. Not all checklist items reviewed
2. No decision selected
3. Validation errors

Solutions:
1. Ensure all checklist items have PASS/FAIL/N/A selected
2. Select Approve/Approve with Punchlist/Reject radio button
3. Check browser console for validation errors
```

**Issue 3: "SLA showing wrong time"**
```
Possible Causes:
1. Server timezone mismatch
2. SLA calculation bug

Solution:
1. Check system timezone: SELECT current_setting('timezone')
2. Verify SLA calculation in code: sla_deadline = now + (48 hours)
```

---

## 📚 RELATED DOCUMENTATION

- [ATP_APPROVAL_FLOW_ANALYSIS.md](ATP_APPROVAL_FLOW_ANALYSIS.md) - Technical implementation details
- [SPRINT_4_PLAN.md](../SPRINT_4_PLAN.md) - Sprint 4 tasks and progress
- [PROGRESS-LOG.md](../PROGRESS-LOG.md) - Overall project progress

---

**End of User Journey Document**

This document provides a complete picture of the ATP Approval Flow from all user perspectives. Use this as a reference for understanding the end-to-end workflow and for training new users.

**Last Updated**: 2025-12-31
**Version**: 1.0
**Maintained By**: Development Team
