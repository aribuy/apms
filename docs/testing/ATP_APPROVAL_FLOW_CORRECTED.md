# ATP Approval Flow - Complete & Corrected

**Created:** 2026-01-01
**Status:** FINAL - Based on Business Requirements
**Reference:** ATP Process Flow Excel, ATP Data Excel

---

## Overview

ATP (Acceptance Test Procedure) Approval Flow is a multi-stage document approval process for site installations. The flow supports multiple ATP document types per site, with different review paths based on document category.

**Key Characteristics:**
- Site Registration and ATP Submission are **separate processes**
- One site can have **multiple ATP documents** (Software, Hardware, PLN, Dismantle, etc.)
- Auto-categorization determines workflow path
- Punchlist severity determines blocking/non-blocking behavior
- QA Engineer validation required for punchlist rectification

---

## Document Categories

Based on Excel reference, ATP documents are categorized into:

| Category | Description | Workflow Stages |
|----------|-------------|-----------------|
| **SOFTWARE** | Software license, upgrade, configuration | BO → SME → HEAD_NOC (3 stages) |
| **HARDWARE** | Equipment installation, hardware | FOP/RTS → REGION → RTH (3 stages) |
| **BOTH** | Combined software + hardware | BO → FOP/RTS → SME → REGION → HEAD_NOC (5 stages) |
| **PLN** | Power-related installations | *TBD* |
| **DISMANTLE** | Site dismantling/decommissioning | *TBD* |
| **Other** | Other document types | *TBD* |

**Note:** The current implementation uses auto-categorization utility ([`atpCategorization.js`](../../backend/src/utils/atpCategorization.js)) which categorizes based on filename indicators.

---

## Complete ATP Approval Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   ATP APPROVAL FLOW - COMPLETE                               │
└─────────────────────────────────────────────────────────────────────────────┘

PHASE 0: SITE REGISTRATION (Separate Process)
  └─> Vendor/User registers site
  └─> Site record created in database
  └─> NO ATP workflow triggered yet
  └─> Status: Site registered, awaiting ATP submissions

PHASE 1: ATP SUBMISSION (by Doc Control)
  Step 1.1: Doc Control uploads ATP document
    └─> Upload: PDF file
    └─> Metadata: site_id, document_type (optional), submitted_by

  Step 1.2: System performs AUTO-CATEGORIZATION
    └─> Analyze filename and content
    └─> Determine category: SOFTWARE / HARDWARE / BOTH / PLN / DISMANTLE / Other
    └─> Assign workflow_type based on category

  Step 1.3: QA ENGINEER PRE-APPROVAL ⚠️ NEW
    └─> QA Engineer validates uploaded document
    └─> Check document completeness
    └─> Decision:
        ├── APPROVE → Document accepted, proceed to workflow initialization
        └── REJECT → Return to Doc Control for resubmission

  Step 1.4: WORKFLOW INITIALIZATION (after QA approval)
    └─> System creates review stages based on workflow_type
    └─> SOFTWARE: BO → SME → HEAD_NOC
    └─> HARDWARE: FOP/RTS → REGION → RTH
    └─> BOTH: BO → FOP/RTS → SME → REGION → HEAD_NOC
    └─> Set SLA deadlines for each stage (24-48 hours)
    └─> Update ATP status: 'in_review'
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

    Step 3.2: QA ENGINEER VALIDATES RECTIFICATION ⚠️ NEW
      └─> QA Engineer reviews evidence
      └─> Decision:
          ├── APPROVE rectification → Forward to PIC who created punchlist
          └── REJECT rectification → Return to Doc Control for resubmission

    Step 3.3: PIC (Original Punchlist Creator) Reviews
      └─> Reviewer who created punchlist reviews rectification
      └─> Decision:
          ├── APPROVE → Punchlist item closed
          └── REJECT → Return to Doc Control for resubmission

    Step 3.4: Completion
      └─> All punchlist items approved
      └─> ATP status: 'fully_completed'
      └─> ATP process complete ✅

  Scenario B: Blocking Punchlist (Critical)
    └─> ATP is REJECTED (at any stage)
    └─> Status: 'rejected' / 'atp_rectification'
    └─> Punchlist items created (severity: CRITICAL)
    └─> Workflow cancelled/stopped

    Step 3.1: Doc Control resubmits ATP document
      └─> Upload revised document
      └─> Link to original ATP (versioning)

    Step 3.2: QA ENGINEER VALIDATES RESUBMISSION ⚠️ NEW
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

    └─> ATP status: 'approved'
    └─> Completion percentage: 100%
    └─> Approval date recorded
    └─> ATP process complete ✅
    └─> Site can proceed to next phase

```

---

## State Transitions

### ATP Document States

```
pending_submission
  ↓
submitted (after upload)
  ↓
qa_validation (QA Approval) ⚠️ NEW
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
              fully_completed
```

### Punchlist States

```
created (when punchlist item is created)
  ↓
rectification_pending (awaiting vendor fix)
  ↓
rectified (vendor submitted evidence)
  ↓
qa_validation (QA validates evidence) ⚠️ NEW
  ├── APPROVE → pic_review
  └── REJECT → rectification_pending (back to vendor)
  ↓
pic_review (original creator reviews)
  ├── APPROVE → completed
  └── REJECT → rectification_pending (back to vendor)
  ↓
completed
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

### APPROVE_WITH_PUNCHLIST
- **Condition:** Issues found, but not critical
- **Action:** Create punchlist items + continue to next stage
- **Punchlist:** Created (severity: MAJOR or MINOR)
- **Status Change:** `current_stage` → next stage, but punchlist remains open
- **Note:** Workflow continues, punchlist addressed after final approval

### REJECT (with Critical Punchlist)
- **Condition:** Critical issues found
- **Action:** Create punchlist items + cancel remaining stages
- **Punchlist:** Created (severity: CRITICAL)
- **Status Change:** `current_status` → 'rejected' / 'atp_rectification'
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

## QA Engineer Roles ⚠️ NEW

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

## API Endpoints Required

### ATP Submission & QA Pre-Approval

```
POST /api/v1/atp/upload
  - Upload ATP document
  - Trigger auto-categorization
  - Create ATP record with status: 'qa_validation'

POST /api/v1/atp/:atpId/qa/approve
  - QA Engineer approves document
  - Trigger workflow initialization

POST /api/v1/atp/:atpId/qa/reject
  - QA Engineer rejects document
  - Return to Doc Control
  - Require resubmission
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

POST /api/v1/atp/workflow/punchlist/:punchlistId/qa/approve
  - QA Engineer validates rectification
  - Forward to PIC

POST /api/v1/atp/workflow/punchlist/:punchlistId/pic/approve
  - PIC (original creator) approves rectification
  - Close punchlist item
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

### QA Approval Stage

```sql
-- Add to atp_documents table
qa_pre_approved_by        UUID,
qa_pre_approved_at        TIMESTAMP,
qa_pre_approval_comments   TEXT,
qa_pre_approval_status    TEXT DEFAULT 'pending', -- pending, approved, rejected

-- Add to atp_punchlist_items table
qa_validated_by           UUID,
qa_validated_at           TIMESTAMP,
qa_validation_comments     TEXT,
qa_validation_status       TEXT DEFAULT 'pending', -- pending, approved, rejected

pic_approved_by            UUID,
pic_approved_at            TIMESTAMP,
pic_approval_comments      TEXT,
pic_approval_status        TEXT DEFAULT 'pending', -- pending, approved, rejected
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

-- Index
CREATE INDEX idx_atp_versions_atp_id ON atp_versions(atp_id);
```

---

## Missing Implementation

Based on current codebase review, the following are **NOT YET IMPLEMENTED**:

### 1. QA Pre-Approval Stage ⚠️ CRITICAL
- **Current:** ATP workflow initializes immediately after upload
- **Required:** QA validation BEFORE workflow initialization
- **Impact:** No document quality control before workflow

### 2. QA Rectification Validation ⚠️ CRITICAL
- **Current:** Punchlist completion goes directly to workflow progression
- **Required:** QA validation + PIC approval
- **Impact:** No validation of rectification quality

### 3. Punchlist Severity Logic ⚠️ HIGH
- **Current:** Punchlist severity exists but no blocking/non-blocking logic
- **Required:** CRITICAL = blocking, MAJOR/MINOR = non-blocking
- **Impact:** All punchlists treated the same

### 4. ATP Resubmission Flow ⚠️ HIGH
- **Current:** Rejected ATP cannot be resubmitted
- **Required:** Resubmission with versioning
- **Impact:** Rejected ATP must be recreated from scratch

### 5. QA & PIC Approval Endpoints ⚠️ HIGH
- **Current:** No endpoints for QA or PIC approval
- **Required:** Separate approval flows
- **Impact:** Punchlist closure cannot be completed

---

## Implementation Priority

### Phase 1: Critical Fixes (Must Have)
1. Add QA Approval stage before workflow initialization
2. Add QA + PIC approval endpoints for punchlist closure
3. Implement punchlist severity logic (blocking vs non-blocking)
4. Add ATP resubmission flow with versioning

### Phase 2: Database Updates
1. Create `atp_versions` table
2. Add QA and PIC approval fields to `atp_documents` and `atp_punchlist_items`
3. Create Prisma migrations
4. Update schema

### Phase 3: Frontend Updates
1. Add QA Approval interface
2. Add QA + PIC approval interfaces for punchlist
3. Add ATP resubmission interface
4. Update workflow status display to show new states

### Phase 4: Testing & Documentation
1. End-to-end testing of complete flow
2. Update user journey documentation
3. Create API documentation
4. Train users on new flow

---

## Summary of Key Changes from Original Flow

### Original Flow (Incorrect)
```
Site Registration → ATP Upload → Multi-Stage Review → Punchlist → Approved
```

### Corrected Flow (Complete)
```
Site Registration (separate)
  ↓
ATP Upload by Doc Control
  ↓
QA Pre-Approval ⚠️ NEW
  ├── APPROVE → Continue
  └── REJECT → Return to Doc Control
  ↓
Workflow Initialization (based on category)
  ↓
Multi-Stage Review (3-5 stages depending on type)
  ├── APPROVE → Next stage
  ├── APPROVE WITH PUNCHLIST (non-blocking) → Next stage + create punchlist
  └── REJECT with CRITICAL (blocking) → ATP Rectification
  ↓
Final Approval (if no critical issues)
  ↓
Punchlist Rectification (if punchlist exists)
  ├── Vendor fixes + uploads evidence
  ├── QA validates evidence ⚠️ NEW
  ├── PIC reviews ⚠️ NEW
  └── Loop until all approved
  ↓
ATP Fully Completed ✅
```

---

## Next Steps

1. **Review and approve this flow** - Confirm all business requirements are captured
2. **Plan database schema updates** - Create migration scripts
3. **Implement QA Approval** - Add new workflow stage
4. **Implement QA + PIC approval** - Add punchlist validation
5. **Update frontend** - Add new interfaces
6. **Test complete flow** - End-to-end testing
7. **Deploy to staging** - User acceptance testing
8. **Deploy to production** - Go live

---

**Document Status:** READY FOR IMPLEMENTATION
**Next Action:** Create database migration scripts for QA approval fields
