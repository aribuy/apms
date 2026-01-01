# ATP Approval Flow - Complete & Corrected (v2)

**Created:** 2026-01-01
**Status:** FINAL - Based on Business Requirements
**Reference:** ATP Process Flow Excel, ATP Data Excel

---

## Overview

ATP (Acceptance Test Procedure) Approval Flow is a multi-stage document approval process for site installations. The flow can be triggered from Site Registration or initiated independently.

**Key Characteristics:**
- Site Registration can **trigger ATP Task** if "ATP Required = YES"
- Site Registration and ATP Submission are **separate processes**
- One site can have **multiple ATP documents** (Software, Hardware, PLN, Dismantle, etc.)
- Auto-categorization determines workflow path
- Punchlist severity determines blocking/non-blocking behavior
- QA Engineer validation required for approval and punchlist rectification
- Approver signature images must appear on the ATP document cover page (signature uploaded in each user profile)

**Role Note:** `QA_ENGINEER` role does not exist yet and must be added before implementation.

---

## Document Categories

Based on Excel reference (`docs/testing/ATP_CATEGORIES_COMPLETE.md`), ATP documents are categorized into:

| Category | Subtype | Workflow | Stages | Total SLA | Approval Roles |
|----------|---------|----------|--------|-----------|----------------|
| **RAN_MW** | RAN, MW New, MW Upgrade, MW Reroute | HARDWARE | 3 | 5 hari | FOP_RTS → REGION_TEAM → RTH |
| **PLN_UPGRADE** | PLN Upgrade, Power | HARDWARE | 2 | 3 hari | ROH → RTH |
| **DISMANTLE_DROP** | Dismantle Drop | HARDWARE | 3 | 6 hari | FOP_RTS → REGION_TEAM → PMO |
| **DISMANTLE_KEEP** | Dismantle Keep | HARDWARE | 2 | 3 hari | ROH → RTH |
| **SOFTWARE_LICENSE** | Software, License, Upgrade, Bandwidth | SOFTWARE | 3 | 5 hari | BO → SME → HEAD_NOC |

**Note:** Auto-categorization utility (`backend/src/utils/atpCategorization.js`) is used and must map into these five categories.

---

## Complete ATP Approval Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   ATP APPROVAL FLOW - COMPLETE (v2)                          │
└─────────────────────────────────────────────────────────────────────────────┘

PATH A: ATP TASK TRIGGERED FROM SITE REGISTRATION
┌───────────────────────────────────────────────────────────────────────────┐
PHASE 0: SITE REGISTRATION (with ATP Trigger)
  Step 0.1: Vendor/User registers site
    └─> Fill site registration form
    └─> Field: "ATP Required" = YES/NO

  Step 0.2: System checks "ATP Required" field
    ├── If NO → Site registered normally, NO ATP workflow
    └── If YES → ⚠️ CREATE ATP TASK
        └─> Create ATP task record
        └─> Assign to Doc Control
        └─> Send notification: "ATP Document Required for Site {site_id}"
        └─> Status: 'awaiting_atp_submission'

  Step 0.3: Doc Control sees ATP task in their queue
    └─> Task listed in "My Tasks" or "ATP Queue"
    └─> Must upload ATP document to complete task
└───────────────────────────────────────────────────────────────────────────┘

PATH B: INDEPENDENT ATP SUBMISSION (without site registration trigger)
┌───────────────────────────────────────────────────────────────────────────┐
PHASE 0: DIRECT ATP SUBMISSION
  Step 0.1: Doc Control initiates ATP submission directly
    └─> Navigate to ATP Management
    └─> Click "Upload ATP Document"
    └─> Select site (from registered sites)
    └─> Proceed to upload
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
PHASE 1: ATP SUBMISSION (by Doc Control)
  Step 1.1: Doc Control uploads ATP document
    └─> Upload: PDF file
    └─> Metadata: site_id, document_type (optional), submitted_by
    └─> If from Site Registration: Link to ATP task (mark task as 'in_progress')

  Step 1.2: System performs AUTO-CATEGORIZATION
    └─> Analyze filename and content
    └─> Determine category: SOFTWARE / HARDWARE / BOTH / PLN / DISMANTLE / Other
    └─> Assign workflow_type based on category

  Step 1.3: QA ENGINEER PRE-APPROVAL ⚠️ STAGE BARU
    └─> QA Engineer validates uploaded document
    └─> Check document completeness
    └─> Decision:
        ├── APPROVE → Document accepted, proceed to workflow initialization
        └── REJECT → Document rejected, return to Doc Control for resubmission

  Step 1.4: WORKFLOW INITIALIZATION (after QA approval)
    └─> System creates review stages based on category:
        ├─> RAN_MW: FOP_RTS → REGION_TEAM → RTH (5 hari)
        ├─> PLN_UPGRADE: ROH → RTH (3 hari)
        ├─> DISMANTLE_DROP: FOP_RTS → REGION_TEAM → PMO (6 hari)
        ├─> DISMANTLE_KEEP: ROH → RTH (3 hari)
        └─> SOFTWARE_LICENSE: BO → SME → HEAD_NOC (5 hari)
    └─> Update ATP status: 'in_review'
    └─> Update ATP Task (if from site registration): 'in_review'
    └─> Notify Stage 1 reviewer

PHASE 2: MULTI-STAGE REVIEW

  Stage 1: First Reviewer (e.g., BO for SOFTWARE)
    Step 2.1: Reviewer views pending reviews
    Step 2.2: Opens ATP document
    Step 2.3: Reviews checklist items
    Step 2.4: Makes decision:

      Option A: APPROVE (no issues)
        └─> Progress to Stage 2
        └─> Activate Stage 2 reviewer
        └─> Update current_stage
        └─> Send notification

      Option B: APPROVE WITH PUNCHLIST (minor/major issues)
        └─> Create punchlist items
        └─> Severity: MAJOR or MINOR (non-blocking)
        └─> ATP status: 'approved_with_punchlist'
        └─> Continue to next stage (workflow progresses)
        └─> Punchlist items remain open for rectification

      Option C: REJECT with CRITICAL punchlist (critical issues)
        └─> Create punchlist items
        └─> Severity: CRITICAL (blocking)
        └─> ATP status: 'rejected'
        └─> Set status: 'atp_rectification' (awaiting resubmission)
        └─> ATP Task (if exists): 'rectification_required'
        └─> Cancel all pending stages
        └─> Return to Doc Control for resubmission

  Stage 2: Second Reviewer
    └─> Same decision options as Stage 1

  Stage 3+: Final Reviewer(s)
    └─> Last stage completes ATP approval (if approved)
    └─> OR initiates rectification process (if punchlist exists)

PHASE 3: PUNCHLIST RECTIFICATION (Non-Blocking or Blocking)

  Scenario A: Non-Blocking Punchlist (Major/Minor)
    └─> ATP is APPROVED (reached final stage)
    └─> Status: 'approved_with_punchlist'
    └─> Punchlist items created (severity: MAJOR or MINOR)
    └─> After final approval → Enter rectification phase

    Step 3.1: Vendor/Site team fixes issues
      └─> Upload evidence (photos, documents)
      └─> Mark punchlist items as 'rectified'

    Step 3.2: QA ENGINEER VALIDATES RECTIFICATION ⚠️ STAGE BARU
      └─> QA Engineer reviews evidence
      └─> Decision:
          ├── APPROVE rectification → Forward to PIC who created punchlist
          └── REJECT rectification → Return to Doc Control for resubmission

    Step 3.3: PIC (Original Punchlist Creator) Reviews
      └─> Reviewer who created punchlist reviews rectification (must be the same PIC)
      └─> Decision:
          ├── APPROVE → Punchlist item closed
          └── REJECT → Return to Doc Control for resubmission

    Step 3.4: Completion
      └─> All punchlist items approved
      └─> ATP status: 'fully_completed'
      └─> ATP Task (if exists): 'completed' ✅
      └─> ATP process complete ✅

  Scenario B: Blocking Punchlist (Critical)
    └─> ATP is REJECTED (at any stage)
    └─> Status: 'rejected' / 'atp_rectification'
    └─> Punchlist items created (severity: CRITICAL)
    └─> Workflow cancelled/stopped

    Step 3.1: Doc Control resubmits ATP document
      └─> Upload revised document
      └─> Link to original ATP (versioning)

    Step 3.2: QA ENGINEER VALIDATES RESUBMISSION ⚠️ STAGE BARU
      └─> QA Engineer validates resubmitted document
      └─> Decision:
          ├── APPROVE → Resume workflow from rejected stage
          └── REJECT → Return to Doc Control again

    Step 3.3: Resume Workflow
      └─> Reactivate stage where rejection occurred
      └─> Reset review_status to 'pending'
      └─> Notify reviewer
      └─> Continue review process

PHASE 4: ATP FULLY APPROVED

  Condition: All stages approved AND all punchlists resolved

    └─> ATP status: 'approved' → 'fully_completed'
    └─> Completion percentage: 100%
    └─> Approver signatures rendered on ATP document cover page
    └─> Approval date recorded
    └─> ATP Task (if exists): 'completed' ✅
    └─> Site can proceed to next phase
    └─> ATP process complete ✅

```

---

## ATP Task Integration

### Site Registration Form Fields

```javascript
{
  site_id: "SITE-123",
  site_name: "Jakarta Central",
  // ... other site fields ...

  // ⚠️ ATP Trigger Field
  atp_required: "YES" | "NO",  // Checkbox or dropdown

  // If YES, create ATP task
  atp_task: {
    task_id: "TASK-ATP-001",
    task_type: "atp_submission",
    status: "awaiting_submission",
    assigned_to: "doc_control_role",
    created_at: "2026-01-01T10:00:00Z",
    due_date: "2026-01-08T10:00:00Z"  // 7 days SLA
  }
}
```

### ATP Task Status Flow

```
awaiting_submission (created from site registration)
  ↓
in_progress (Doc Control uploads document)
  ↓
in_review (QA approved, workflow initialized)
  ↓
┌──────────────────┬───────────────────────┬──────────────────┐
│ approved          │ rectification_required │ rejected         │
│ (no issues)       │ (punchlist created)    │ (critical issues)│
└──────────────────┴───────────────────────┴──────────────────┘
  │                    │                       │
  ↓                    ↓                       ↓
completed      rectification_in_progress    rectification_required
  │                    │                       │
  └────────────────────┴───────────────────────┘
                     │
                     ↓
                 completed ✅
```

---

## State Transitions

### ATP Document States

```
pending_submission
  ↓
submitted (after upload)
  ↓
qa_validation (QA Approval) ⚠️ STAGE BARU
  ├── approved → in_review
  └── rejected → pending_submission (back to Doc Control)
  ↓
in_review (workflow initialized)
  ↓
┌───────────────┬────────────────────────┬──────────────────┐
│ APPROVE       │ APPROVE_WITH_PUNCHLIST │ REJECT           │
│ (no issues)   │ (major/minor issues)   │ (critical issues)│
└───────────────┴────────────────────────┴──────────────────┘
  │                 │                       │
  ↓                 ↓                       ↓
next_stage   approved_with_punchlist   rejected
  │                 │                       │
  │                 ↓                       ↓
  │      after_final_approval      atp_rectification
  │                 │                       │
  │                 ↓                       ↓
  │      rectification_phase    resubmit_by_doc_control
  │                 │                       │
  └─────────────────┴───────────────────────┘
                    │
                    ↓
              fully_completed ✅
```

### ATP Task States (if triggered from Site Registration)

```
awaiting_submission (created after site registration with ATP Required = YES)
  ↓
in_progress (Doc Control uploaded document)
  ↓
in_review (QA approved, workflow in progress)
  ↓
┌──────────────────┬───────────────────────┬──────────────────┐
│ approved          │ rectification_required │ rejected         │
└──────────────────┴───────────────────────┴──────────────────┘
  │                    │                       │
  ↓                    ↓                       ↓
completed      rectification_in_progress    rectification_required
  │                    │                       │
  └────────────────────┴───────────────────────┘
                     │
                     ↓
                 completed ✅
```

### Punchlist States

```
created (when punchlist item is created)
  ↓
rectification_pending (awaiting vendor fix)
  ↓
rectified (vendor submitted evidence)
  ↓
qa_validation (QA validates evidence) ⚠️ STAGE BARU
  ├── APPROVE → pic_review
  └── REJECT → rectification_pending (back to vendor)
  ↓
pic_review (original creator reviews)
  ├── APPROVE → completed
  └── REJECT → rectification_pending (back to vendor)
  ↓
completed ✅
```

---

## Workflow Configurations

### SOFTWARE Workflow

```javascript
{
  workflow_type: 'SOFTWARE',
  stages: [
    {
      code: 'BO_REVIEW',
      name: 'Business Operations Review',
      role: 'BO',
      sla_hours: 48
    },
    {
      code: 'SME_REVIEW',
      name: 'SME Technical Review',
      role: 'SME',
      sla_hours: 48
    },
    {
      code: 'HEAD_NOC_REVIEW',
      name: 'Head NOC Final Review',
      role: 'HEAD_NOC',
      sla_hours: 24
    }
  ]
}
```

### HARDWARE Workflow

```javascript
{
  workflow_type: 'HARDWARE',
  stages: [
    {
      code: 'FOP_RTS_REVIEW',
      name: 'FOP/RTS Field Review',
      role: 'FOP_RTS',
      sla_hours: 48
    },
    {
      code: 'REGION_REVIEW',
      name: 'Region Team Review',
      role: 'REGION_TEAM',
      sla_hours: 48
    },
    {
      code: 'RTH_REVIEW',
      name: 'RTH Final Approval',
      role: 'RTH',
      sla_hours: 24
    }
  ]
}
```

### BOTH Workflow

```javascript
{
  workflow_type: 'BOTH',
  stages: [
    { code: 'BO_REVIEW', name: 'Business Operations Review', role: 'BO', sla_hours: 48 },
    { code: 'FOP_RTS_REVIEW', name: 'FOP/RTS Field Review', role: 'FOP_RTS', sla_hours: 48 },
    { code: 'SME_REVIEW', name: 'SME Technical Review', role: 'SME', sla_hours: 48 },
    { code: 'REGION_REVIEW', name: 'Region Team Review', role: 'REGION_TEAM', sla_hours: 48 },
    { code: 'FINAL_REVIEW', name: 'Final Approval', role: 'HEAD_NOC', sla_hours: 24 }
  ]
}
```

---

## Decision Types & Outcomes

### APPROVE
- **Condition:** No issues found
- **Action:** Progress to next stage
- **Punchlist:** None created
- **Status Change:** `current_stage` → next stage
- **ATP Task:** Continue 'in_review'

### APPROVE_WITH_PUNCHLIST
- **Condition:** Issues found, but not critical
- **Action:** Create punchlist items + continue to next stage
- **Punchlist:** Created (severity: MAJOR or MINOR)
- **Status Change:** `current_stage` → next stage, but punchlist remains open
- **ATP Task:** Update to 'rectification_required'
- **Note:** Workflow continues, punchlist addressed after final approval

### REJECT (with Critical Punchlist)
- **Condition:** Critical issues found
- **Action:** Create punchlist items + cancel remaining stages
- **Punchlist:** Created (severity: CRITICAL)
- **Status Change:** `current_status` → 'rejected' / 'atp_rectification'
- **ATP Task:** Update to 'rectification_required'
- **Note:** Workflow stops, must resubmit after rectification

---

## Punchlist Severity & Blocking Behavior

| Severity | Blocking | Workflow Behavior | When to Rectify |
|----------|----------|-------------------|-----------------|
| **CRITICAL** | Blocking (YES) | Workflow stops immediately | After resubmission |
| **MAJOR** | Non-blocking (NO) | Workflow continues to next stage | After final approval |
| **MINOR** | Non-blocking (NO) | Workflow continues to next stage | After final approval |

**Key Rules:**
1. **CRITICAL** punchlist → ATP rejected, cannot proceed until resubmitted
2. **MAJOR/MINOR** punchlist → ATP can be approved, but punchlist must be resolved after approval
3. All punchlists require QA validation + PIC approval before closing

---

## QA Engineer Roles ⚠️ STAGE BARU

### QA Pre-Approval (After ATP Upload)
**Trigger:** ATP document uploaded by Doc Control
**Responsibility:** Validate document before workflow initialization
**Decision:**
- **APPROVE:** Document accepted, workflow initialized
- **REJECT:** Document rejected, returned to Doc Control

**Checklist:**
- [ ] Document is complete (all pages present)
- [ ] Document is readable (no corrupted pages)
- [ ] Document format is correct
- [ ] Required fields are filled
- [ ] Document matches declared category

### QA Rectification Validation (After Punchlist Fix)
**Trigger:** Vendor submits evidence for punchlist rectification
**Responsibility:** Validate rectification evidence
**Decision:**
- **APPROVE:** Evidence valid, forward to PIC for final approval
- **REJECT:** Evidence insufficient, return to Doc Control

**Checklist:**
- [ ] Evidence clearly shows issue is fixed
- [ ] Evidence is verifiable (photos, documents)
- [ ] All punchlist items addressed
- [ ] No new issues introduced

---

## Signature Placement Rules (Cover Page)

Signature placement is **defined by approval configuration** so each category can map required approver slots to specific roles. Each slot must include:
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

## API Endpoints Required

### Site Registration with ATP Trigger

```
POST /api/v1/sites/register
  - Register new site
  - Body: {
      site_data: {...},
      atp_required: "YES" | "NO"  ⚠️ NEW FIELD
    }
  - If atp_required = YES, create ATP task automatically
```

### ATP Task Management

```
GET /api/v1/atp/tasks
  - Get ATP tasks for current user
  - Filter: status, assigned_to, site_id

GET /api/v1/atp/tasks/:taskId
  - Get task details

PATCH /api/v1/atp/tasks/:taskId/status
  - Update task status
  - Body: { status: 'in_progress' | 'completed' }
```

### ATP Submission & QA Pre-Approval

```
POST /api/v1/atp/upload
  - Upload ATP document
  - Trigger auto-categorization
  - Create ATP record with status: 'qa_validation'
  - If linked to task, update task status to 'in_progress'

GET /api/v1/atp/qa/pending
  - List ATP documents awaiting QA decision

POST /api/v1/atp/:atpId/qa/decision
  - Body: { decision: "APPROVE" | "REJECT", comments?: string }
  - QA Engineer approves/rejects document
  - If APPROVE → trigger workflow initialization
  - If REJECT → return to Doc Control
  - Update task status (if exists) to 'in_review' or 'awaiting_submission'
```

### Workflow Review

```
GET /api/v1/atp/workflow/reviews/pending?role={role}
  - Get pending reviews for a role

POST /api/v1/atp/workflow/reviews/:reviewStageId/decision
  - Submit review decision
  - Body: { decision, comments, checklist_results, punchlist_items }

GET /api/v1/atp/workflow/:atpId/status
  - Get ATP workflow status and progress
```

### Punchlist Management

```
GET /api/v1/atp/workflow/punchlist?atp_id={atpId}
  - Get punchlist items

POST /api/v1/atp/workflow/punchlist/:punchlistId/complete
  - Submit rectification evidence
  - Body: { rectification_notes, evidence_after, completed_by }

GET /api/v1/atp/punchlist/pending-qa
  - Punchlist items pending QA validation

POST /api/v1/atp/punchlist/:punchlistId/qa/decision
  - Body: { decision: "APPROVE" | "REJECT", comments?: string }
  - QA validates evidence and forwards to PIC if approved

GET /api/v1/atp/punchlist/pending-pic
  - Punchlist items assigned to original PIC

POST /api/v1/atp/punchlist/:punchlistId/pic/decision
  - Body: { decision: "APPROVE" | "REJECT", comments?: string }
  - PIC (original creator) approves/rejects
  - Close punchlist item when approved
```

### ATP Resubmission

```
POST /api/v1/atp/:atpId/resubmit
  - Doc Control resubmits ATP after rejection
  - Upload new version

POST /api/v1/atp/:atpId/resubmit/qa/approve
  - QA Engineer validates resubmission
  - Resume workflow from rejected stage
```

---

## Database Schema Updates Needed

### Sites Table

```sql
-- Add to sites table
atp_required           TEXT DEFAULT 'NO',  -- 'YES' or 'NO' ⚠️ NEW
atp_task_id            UUID REFERENCES tasks(id),  -- Link to ATP task
```

### ATP Tasks Table

```sql
-- New table for ATP tasks (if separate from tasks table)
CREATE TABLE atp_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id),
  task_type TEXT DEFAULT 'atp_submission',
  status TEXT DEFAULT 'awaiting_submission', -- awaiting_submission, in_progress, in_review, rectification_required, completed
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  atp_id UUID REFERENCES atp_documents(id)  -- Link to ATP document when uploaded
);

CREATE INDEX idx_atp_tasks_site_id ON atp_tasks(site_id);
CREATE INDEX idx_atp_tasks_status ON atp_tasks(status);
CREATE INDEX idx_atp_tasks_assigned_to ON atp_tasks(assigned_to);
```

### QA Approval Fields

```sql
-- Add to atp_documents table
qa_pre_approved_by        UUID,
qa_pre_approved_at        TIMESTAMP,
qa_pre_approval_comments   TEXT,
qa_pre_approval_status    TEXT DEFAULT 'pending', -- pending, approved, rejected ⚠️ NEW

-- Add to atp_punchlist_items table
qa_validated_by           UUID,
qa_validated_at           TIMESTAMP,
qa_validation_comments     TEXT,
qa_validation_status       TEXT DEFAULT 'pending', -- pending, approved, rejected ⚠️ NEW

pic_approved_by            UUID,
pic_approved_at            TIMESTAMP,
pic_approval_comments      TEXT,
pic_approval_status        TEXT DEFAULT 'pending', -- pending, approved, rejected ⚠️ NEW
```

### ATP Versioning

```sql
-- Track resubmissions
CREATE TABLE atp_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atp_id UUID REFERENCES atp_documents(id),
  version_number INT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  resubmission_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_atp_versions_atp_id ON atp_versions(atp_id);
```

---

## Missing Implementation

Based on current codebase review, the following are **NOT YET IMPLEMENTED**:

### 1. Site Registration ATP Trigger ⚠️ CRITICAL
- **Current:** Site registration does not create ATP tasks
- **Required:** Check "ATP Required" field and create task
- **Impact:** No automatic ATP task creation

### 2. QA Pre-Approval Stage ⚠️ CRITICAL
- **Current:** ATP workflow initializes immediately after upload
- **Required:** QA validation BEFORE workflow initialization
- **Impact:** No document quality control before workflow
 - **Endpoints:** `GET /api/v1/atp/qa/pending`, `POST /api/v1/atp/:atpId/qa/decision`

### 3. QA Rectification Validation ⚠️ CRITICAL
- **Current:** Punchlist completion goes directly to workflow progression
- **Required:** QA validation + PIC approval
- **Impact:** No validation of rectification quality
 - **Endpoints:** `GET /api/v1/atp/punchlist/pending-qa`, `POST /api/v1/atp/punchlist/:punchlistId/qa/decision`

### 4. Punchlist Severity Logic ⚠️ HIGH
- **Current:** Punchlist severity exists but no blocking/non-blocking logic
- **Required:** CRITICAL = blocking, MAJOR/MINOR = non-blocking
- **Impact:** All punchlists treated the same

### 5. ATP Resubmission Flow ⚠️ HIGH
- **Current:** Rejected ATP cannot be resubmitted
- **Required:** Resubmission with versioning
- **Impact:** Rejected ATP must be recreated from scratch

### 6. QA & PIC Approval Endpoints ⚠️ HIGH
- **Current:** No endpoints for QA or PIC approval
- **Required:** Separate approval flows
- **Impact:** Punchlist closure cannot be completed
 - **Endpoints:** `GET /api/v1/atp/punchlist/pending-pic`, `POST /api/v1/atp/punchlist/:punchlistId/pic/decision`

### 7. Signature Placement Rules ⚠️ HIGH
- **Current:** No config-driven signature placement on ATP cover page
- **Required:** Approval config defines signature slots per category, with name + date pulled from user approvals
- **Impact:** Final ATP document lacks approver signatures and timestamps

---

## Implementation Priority

### Phase 1: Critical Fixes (Must Have)
1. Add "ATP Required" field to site registration
2. Create ATP task when "ATP Required = YES"
3. Add QA Approval stage before workflow initialization
4. Add QA + PIC approval endpoints for punchlist closure
5. Implement punchlist severity logic (blocking vs non-blocking)
6. Add ATP resubmission flow with versioning

### Phase 2: Database Updates
1. Create `atp_tasks` table
2. Add `atp_required` field to `sites` table
3. Add QA and PIC approval fields to `atp_documents` and `atp_punchlist_items`
4. Create `atp_versions` table for versioning
5. Create Prisma migrations
6. Update schema

### Phase 3: Frontend Updates
1. Add "ATP Required" checkbox to site registration form
2. Add ATP task queue in "My Tasks"
3. Add QA Approval interface
4. Add QA + PIC approval interfaces for punchlist
5. Add ATP resubmission interface
6. Update workflow status display to show new states

### Phase 4: Testing & Documentation
1. End-to-end testing of complete flow (with and without site registration trigger)
2. Test ATP task creation and status updates
3. Update user journey documentation
4. Create API documentation
5. Train users on new flow

---

## Summary of Key Changes from v1

### New in v2:

1. **Site Registration ATP Trigger** ⚠️ NEW
   - Field: "ATP Required = YES/NO" in site registration
   - If YES → Automatic ATP task creation
   - Task assigned to Doc Control
   - Task visible in "My Tasks" queue

2. **ATP Task Management** ⚠️ NEW
   - Separate task tracking for ATP submissions
   - Task status follows ATP status
   - Links site registration to ATP submission

3. **Two Paths to ATP Submission**
   - **Path A:** Triggered from site registration (ATP Required = YES)
   - **Path B:** Independent submission (without site registration trigger)

### Summary of Complete Flow:

```
Site Registration (ATP Required = YES)
  ↓
Create ATP Task → Assign to Doc Control
  ↓
Doc Control uploads ATP document
  ↓
QA Pre-Approval
  ↓
Workflow Initialization
  ↓
Multi-Stage Review (3-5 stages)
  ├── APPROVE → Next stage
  ├── APPROVE WITH PUNCHLIST → Next stage + create punchlist
  └── REJECT with CRITICAL → Rectification mode
  ↓
Final Approval (if no critical issues)
  ↓
Punchlist Rectification (if punchlist exists)
  ├── Vendor fixes + uploads evidence
  ├── QA validates evidence
  ├── PIC reviews
  └── Loop until all approved
  ↓
ATP Fully Completed ✅
ATP Task Completed ✅
Site ready for next phase ✅
```

---

## Next Steps

1. **Review and approve this flow** - Confirm all business requirements are captured
2. **Plan database schema updates** - Create migration scripts for ATP tasks and QA fields
3. **Implement site registration ATP trigger** - Add "ATP Required" field and task creation
4. **Implement QA Approval** - Add new workflow stage
5. **Implement QA + PIC approval** - Add punchlist validation
6. **Update frontend** - Add new interfaces for ATP tasks and QA approvals
7. **Test complete flow** - End-to-end testing (both paths)
8. **Deploy to staging** - User acceptance testing
9. **Deploy to production** - Go live

---

**Document Status:** READY FOR IMPLEMENTATION (v2)
**Next Action:** Create database migration scripts for ATP tasks and QA approval fields
