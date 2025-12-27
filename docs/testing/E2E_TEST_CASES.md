# 🧪 E2E Test Cases - APMS

**Project**: APMS (Approval & Process Management System)
**Version**: 1.0.0
**Date**: 2025-12-27
**Type**: End-to-End User Journey Testing

---

## 📋 Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Test Data Prerequisites](#test-data-prerequisites)
3. [User Role Test Journeys](#user-role-test-journeys)
4. [ATP Workflow Test Cases](#atp-workflow-test-cases)
5. [Site Management Test Cases](#site-management-test-cases)
6. [Task Management Test Cases](#task-management-test-cases)
7. [Cross-Functional Test Cases](#cross-functional-test-cases)
8. [Negative Test Cases](#negative-test-cases)
9. [Performance Test Cases](#performance-test-cases)
10. [Test Execution Checklist](#test-execution-checklist)

---

## 🛠️ Test Environment Setup

### Pre-Test Checklist

- [ ] Backend server running on port 3011
- [ ] Frontend server running on port 3000
- [ ] Database connection verified (no errors in logs)
- [ ] Test users created (all 10 roles)
- [ ] Test sites available in database
- [ ] File upload directory writable
- [ ] Browser devtools open for console/network monitoring

### URL Configuration

```
Local:     http://localhost:3000
Staging:   https://staging.apms.datacodesolution.com
Production: https://apms.datacodesolution.com
```

### Test Users

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Administrator | admin@apms.com | Admin123! | Full system access |
| BO | bo@apms.com | Test123! | Software ATP Stage 1 |
| SME | sme@apms.com | Test123! | Software ATP Stage 2 |
| HEAD_NOC | headnoc@apms.com | Test123! | Software ATP Stage 3 |
| FOP_RTS | fop@apms.com | Test123! | Hardware ATP Stage 1 |
| REGION_TEAM | region@apms.com | Test123! | Hardware ATP Stage 2 |
| RTH | rth@apms.com | Test123! | Hardware ATP Stage 3 |
| VENDOR | vendor@apms.com | Test123! | Document upload |
| DOC_CONTROL | doccontrol@apms.com | Test123! | Document management |
| SITE_MANAGER | sitemanager@apms.com | Test123! | Site & task oversight |

---

## 📊 Test Data Prerequisites

### Required Test Data

#### Sites (Minimum 5)
- ✅ Site A (Jakarta) - Active
- ✅ Site B (Bandung) - Active
- ✅ Site C (Surabaya) - Under Construction
- ✅ Site D (Medan) - Maintenance
- ✅ Site E (Makassar) - Decommissioned

#### ATP Documents (Pre-created)
- ✅ 1 Software ATP (Approved)
- ✅ 1 Hardware ATP (In Review)
- ✅ 1 Combined ATP (Pending)

#### Tasks
- ✅ 5 Active tasks
- ✅ 3 Completed tasks
- ✅ 2 Overdue tasks

### Test Files (Uploads)

Prepare these test files:
```
test-documents/
├── atp-software-valid.xlsx        (Valid Software ATP)
├── atp-hardware-valid.xlsx        (Valid Hardware ATP)
├── atp-malformed.xlsx             (Invalid format)
├── atp-duplicate-site.xlsx        (Duplicate site code)
├── site-import-valid.xlsx         (Valid site import)
└── large-file.pdf                 (10MB+ file)
```

---

## 👤 User Role Test Journeys

### TC-001: Administrator Full System Journey

**Priority**: P0 (Critical)
**Estimated Time**: 30 minutes
**Test Scope**: Complete system administration workflow

#### Test Steps

1. **Login as Administrator**
   - [ ] Navigate to login page
   - [ ] Enter admin@apms.com / Admin123!
   - [ ] Verify successful login
   - [ ] Verify dashboard loads with all statistics
   - [ ] Verify admin menu visible (Users, Roles, Audit Logs)

2. **User Management**
   - [ ] Navigate to Users page
   - [ ] Create new user (test-user@apms.com)
   - [ ] Assign role: VENDOR
   - [ ] Save user
   - [ ] Verify user appears in list
   - [ ] Edit user - change role to DOC_CONTROL
   - [ ] Verify role updated
   - [ ] Deactivate user
   - [ ] Verify user status changed to Inactive

3. **Role Management**
   - [ ] Navigate to Roles page
   - [ ] View all 10 roles
   - [ ] Check permissions for Administrator role
   - [ ] View permissions matrix
   - [ ] Verify all permissions enabled for admin

4. **Audit Log Review**
   - [ ] Navigate to Audit Logs page
   - [ ] Filter by action: CREATE
   - [ ] Filter by user: admin@apms.com
   - [ ] Verify previous user creation actions logged
   - [ ] Export audit logs to CSV

5. **System Overview**
   - [ ] View Dashboard statistics
   - [ ] Verify ATP counts (Total, Pending, Approved, Rejected)
   - [ ] Verify Site counts (by status)
   - [ ] Verify Task counts (by status)
   - [ ] Verify recent activities feed

6. **Logout**
   - [ ] Click logout button
   - [ ] Verify redirect to login page
   - [ ] Verify session cleared (cannot access protected routes)

**Expected Results**
- ✅ All admin functions accessible
- ✅ User CRUD operations successful
- ✅ Audit trail comprehensive
- ✅ Dashboard statistics accurate

**Actual Results**: ____________________

**Status**: [ ] PASS [ ] FAIL [ ] BLOCKED

**Defects**: ____________________

---

### TC-002: BO (Backend Operations) Software ATP Review

**Priority**: P0 (Critical)
**Estimated Time**: 20 minutes
**Test Scope**: Software ATP Stage 1 review workflow

#### Test Steps

1. **Login as BO**
   - [ ] Navigate to login page
   - [ ] Enter bo@apms.com / Test123!
   - [ ] Verify successful login
   - [ ] Verify dashboard shows ATP review tasks
   - [ ] Verify "Pending Review" count

2. **View Pending ATP Documents**
   - [ ] Navigate to ATP Documents page
   - [ ] Filter by Type: Software ATP
   - [ ] Filter by Status: Submitted
   - [ ] Verify list of pending ATPs

3. **Review ATP Document**
   - [ ] Click on first pending Software ATP
   - [ ] Verify document details displayed:
     - Site code and name
     - ATP document upload (view/download)
     - Submitter information
     - Submission timestamp
   - [ ] Download ATP document
   - [ ] Verify file downloads successfully

4. **Approve ATP Document**
   - [ ] Click "Approve" button
   - [ ] Enter approval comments: "Approved by BO - Stage 1"
   - [ ] Submit approval
   - [ ] Verify success message displayed
   - [ ] Verify ATP status changed to "BO Approved"
   - [ ] Verify task created for next stage (SME)

5. **Reject ATP Document (Second Test)**
   - [ ] Select another pending Software ATP
   - [ ] Click "Reject" button
   - [ ] Enter rejection reason: "Incomplete documentation"
   - [ ] Submit rejection
   - [ ] Verify success message displayed
   - [ ] Verify ATP status changed to "Rejected"
   - [ ] Verify notification sent to submitter

6. **View Approved History**
   - [ ] Navigate to ATP Documents page
   - [ ] Filter by Status: BO Approved
   - [ ] Verify previously approved ATP appears
   - [ ] Click to view details
   - [ ] Verify approval history shows BO approval

**Expected Results**
- ✅ BO can only view Software ATP workflows
- ✅ Approval workflow advances to SME
- ✅ Rejection returns ATP to submitter
- ✅ Audit trail captures all actions

**Actual Results**: ____________________

**Status**: [ ] PASS [ ] FAIL [ ] BLOCKED

**Defects**: ____________________

---

### TC-003: SME Software ATP Technical Review

**Priority**: P0 (Critical)
**Estimated Time**: 20 minutes
**Test Scope**: Software ATP Stage 2 technical review

#### Test Steps

1. **Login as SME**
   - [ ] Navigate to login page
   - [ ] Enter sme@apms.com / Test123!
   - [ ] Verify successful login
   - [ ] Verify dashboard shows ATPs pending technical review
   - [ ] Verify "BO Approved" ATPs visible

2. **View BO-Approved ATP Documents**
   - [ ] Navigate to ATP Documents page
   - [ ] Filter by Type: Software ATP
   - [ ] Filter by Status: BO Approved
   - [ ] Verify list of pending reviews

3. **Perform Technical Review**
   - [ ] Click on BO-approved Software ATP
   - [ ] Verify document details and BO's approval comments
   - [ ] Download and review technical specifications
   - [ ] Verify all required fields complete

4. **Create Punchlist Item (If Needed)**
   - [ ] Click "Add Punchlist Item" button
   - [ ] Enter item description: "Update network diagram"
   - [ ] Assign to VENDOR
   - [ ] Set priority: HIGH
   - [ ] Save punchlist item
   - [ ] Verify task created for VENDOR

5. **Approve with Conditions**
   - [ ] Click "Approve" button
   - [ ] Enter approval comments: "Technically sound - pending punchlist items"
   - [ ] Submit approval
   - [ ] Verify success message displayed
   - [ ] Verify ATP status changed to "SME Approved"
   - [ ] Verify task created for HEAD_NOC

6. **Verify Workflow Progress**
   - [ ] Navigate to Workflow Dashboard
   - [ ] View ATP workflow visualization
   - [ ] Verify stages: BO ✅ → SME ✅ → HEAD_NOC ⏳

**Expected Results**
- ✅ SME receives ATPs after BO approval
- ✅ Can create punchlist items for deficiencies
- ✅ Technical review advances workflow
- ✅ Workflow visualization accurate

**Actual Results**: ____________________

**Status**: [ ] PASS [ ] FAIL [ ] BLOCKED

**Defects**: ____________________

---

### TC-004: HEAD_NOC Software ATP Final Approval

**Priority**: P0 (Critical)
**Estimated Time**: 15 minutes
**Test Scope**: Software ATP Stage 3 final approval

#### Test Steps

1. **Login as HEAD_NOC**
   - [ ] Navigate to login page
   - [ ] Enter headnoc@apms.com / Test123!
   - [ ] Verify successful login
   - [ ] Verify dashboard shows final approval queue

2. **Review SME-Approved ATPs**
   - [ ] Navigate to ATP Documents page
   - [ ] Filter by Status: SME Approved
   - [ ] Verify list of ATPs ready for final approval
   - [ ] Click on ATP document

3. **Review Complete Approval Chain**
   - [ ] Verify BO approval visible in history
   - [ ] Verify SME approval visible in history
   - [ ] Verify any punchlist items displayed
   - [ ] Review all technical documentation

4. **Grant Final Approval**
   - [ ] Click "Approve" button
   - [ ] Enter final approval comments: "Approved for implementation"
   - [ ] Submit approval
   - [ ] Verify success message: "ATP Document fully approved"
   - [ ] Verify ATP status changed to "Approved"
   - [ ] Verify automatic task generation for site implementation

5. **Verify Site Status Update**
   - [ ] Navigate to Sites page
   - [ ] Find site associated with approved ATP
   - [ ] Verify site status updated (if applicable)

**Expected Results**
- ✅ HEAD_NOC receives ATPs after SME approval
- ✅ Final approval completes Software ATP workflow
- ✅ Automatic task generation for implementation
- ✅ Site status updates accordingly

**Actual Results**: ____________________

**Status**: [ ] PASS [ ] FAIL [ ] BLOCKED

**Defects**: ____________________

---

### TC-005: VENDOR Document Upload Journey

**Priority**: P0 (Critical)
**Estimated Time**: 25 minutes
**Test Scope**: ATP document submission workflow

#### Test Steps

1. **Login as VENDOR**
   - [ ] Navigate to login page
   - [ ] Enter vendor@apms.com / Test123!
   - [ ] Verify successful login
   - [ ] Verify limited menu (ATP Upload, Dashboard)

2. **Prepare ATP Document**
   - [ ] Navigate to ATP Upload page
   - [ ] Select Site: Site A (Jakarta)
   - [ ] Select ATP Type: Software ATP
   - [ ] Verify site information displayed

3. **Upload Individual ATP Document**
   - [ ] Click "Upload Document" button
   - [ ] Select file: atp-software-valid.xlsx
   - [ ] Verify file validation:
     - File type check
     - File size check (< 10MB)
   - [ ] Click Upload
   - [ ] Verify upload progress bar
   - [ ] Verify success message
   - [ ] Verify document appears in list

4. **Submit for Approval**
   - [ ] Select uploaded document
   - [ ] Click "Submit for Approval" button
   - [ ] Add submission notes: "Software ATP for Site A upgrade"
   - [ ] Confirm submission
   - [ ] Verify ATP status: Submitted
   - [ ] Verify notification sent to BO

5. **Bulk Upload ATP Documents**
   - [ ] Navigate to Bulk Upload page
   - [ ] Select multiple files (3-5 documents)
   - [ ] Select ATP Type: Hardware ATP
   - [ ] Select multiple sites (Site B, Site C, Site D)
   - [ ] Map files to sites
   - [ ] Click "Upload All"
   - [ ] Verify batch upload progress
   - [ ] Verify all documents uploaded successfully
   - [ ] Verify 3 tasks created (one per ATP)

6. **View Uploaded Documents**
   - [ ] Navigate to My Documents page
   - [ ] Verify all uploaded documents listed
   - [ ] Filter by status: Submitted, Approved, Rejected
   - [ ] Click document to view details
   - [ ] Download document to verify integrity

**Expected Results**
- ✅ VENDOR can upload ATP documents
- ✅ File validation prevents invalid uploads
- ✅ Bulk upload creates individual ATP records
- ✅ Submission triggers approval workflow
- ✅ VENDORS limited to own documents

**Actual Results**: ____________________

**Status**: [ ] PASS [ ] FAIL [ ] BLOCKED

**Defects**: ____________________

---

### TC-006: SITE_MANAGER Task Oversight Journey

**Priority**: P1 (High)
**Estimated Time**: 20 minutes
**Test Scope**: Site and task management workflow

#### Test Steps

1. **Login as SITE_MANAGER**
   - [ ] Navigate to login page
   - [ ] Enter sitemanager@apms.com / Test123!
   - [ ] Verify successful login
   - [ ] Verify dashboard shows site and task overview

2. **View Site Portfolio**
   - [ ] Navigate to Sites page
   - [ ] Verify all assigned sites visible
   - [ ] Filter by status: Active
   - [ ] Verify site list updates
   - [ ] Click on Site A to view details
   - [ ] Verify site information:
     - Site code, name, region
     - Site status and lifecycle stage
     - Associated ATP documents
     - Associated tasks

3. **Monitor Tasks**
   - [ ] Navigate to Tasks page
   - [ ] Filter by Site: Site A
   - [ ] View task list:
     - Pending tasks
     - In-progress tasks
     - Completed tasks
     - Overdue tasks
   - [ ] Sort by due date
   - [ ] Verify task assignments

4. **Update Task Status**
   - [ ] Select pending task
   - [ ] Click "Edit" button
   - [ ] Update status: In Progress
   - [ ] Add progress notes: "Site survey completed"
   - [ ] Save changes
   - [ ] Verify task status updated

5. **View ATP Status for Site**
   - [ ] From Site A details, view ATP Documents tab
   - [ ] Verify all ATPs for Site A listed
   - [ ] Check approval status of each ATP
   - [ ] View latest ATP approval history

6. **Generate Site Report**
   - [ ] Click "Generate Report" button
   - [ ] Select date range: Last 30 days
   - [ ] Include ATPs and tasks
   - [ ] Click Generate
   - [ ] Verify report generation
   - [ ] Download PDF report

**Expected Results**
- ✅ SITE_MANAGER can view assigned sites
- ✅ Task monitoring functional
- ✅ Can update task statuses
- ✅ ATP status visible per site
- ✅ Report generation works

**Actual Results**: ____________________

**Status**: [ ] PASS [ ] FAIL [ ] BLOCKED

**Defects**: ____________________

---

## 🔄 ATP Workflow Test Cases

### TC-007: Software ATP Complete Workflow

**Priority**: P0 (Critical)
**Estimated Time**: 30 minutes
**Test Scope**: End-to-end Software ATP approval workflow

#### Test Steps

1. **VENDOR Submits Software ATP**
   - [ ] Login as VENDOR
   - [ ] Upload Software ATP document for Site A
   - [ ] Submit for approval
   - [ ] Logout

2. **BO Stage 1 Review**
   - [ ] Login as BO
   - [ ] Find submitted ATP in queue
   - [ ] Review document
   - [ ] Approve with comments: "Documentation complete"
   - [ ] Logout

3. **SME Stage 2 Review**
   - [ ] Login as SME
   - [ ] Find BO-approved ATP in queue
   - [ ] Perform technical review
   - [ ] Add punchlist item: "Update configuration file"
   - [ ] Approve with conditions
   - [ ] Logout

4. **HEAD_NOC Stage 3 Final Approval**
   - [ ] Login as HEAD_NOC
   - [ ] Find SME-approved ATP in queue
   - [ ] Review complete approval chain
   - [ ] Verify punchlist item addressed
   - [ ] Grant final approval
   - [ ] Logout

5. **Verify Workflow Completion**
   - [ ] Login as Administrator
   - [ ] Navigate to ATP Documents
   - [ ] Find completed ATP
   - [ ] Verify status: Approved
   - [ ] Verify approval history shows all 3 stages
   - [ ] Verify implementation tasks generated
   - [ ] Verify audit trail complete

**Expected Results**
- ✅ Workflow progresses through all 3 stages correctly
- ✅ Each stage receives notification
- ✅ Approval history complete
- ✅ Punchlist items tracked
- ✅ Implementation tasks auto-generated
- ✅ Audit trail captures all actions

**Actual Results**: ____________________

**Status**: [ ] PASS [ ] FAIL [ ] BLOCKED

**Defects**: ____________________

---

### TC-008: Hardware ATP Complete Workflow

**Priority**: P0 (Critical)
**Estimated Time**: 30 minutes
**Test Scope**: End-to-end Hardware ATP approval workflow

#### Test Steps

1. **VENDOR Submits Hardware ATP**
   - [ ] Login as VENDOR
   - [ ] Upload Hardware ATP document for Site B
   - [ ] Submit for approval
   - [ ] Logout

2. **FOP_RTS Stage 1 Review**
   - [ ] Login as FOP_RTS
   - [ ] Find submitted Hardware ATP in queue
   - [ ] Review hardware specifications
   - [ ] Approve with comments: "Hardware requirements verified"
   - [ ] Logout

3. **REGION_TEAM Stage 2 Review**
   - [ ] Login as REGION_TEAM
   - [ ] Find FOP_RTS-approved ATP in queue
   - [ ] Perform regional feasibility review
   - [ ] Approve with comments: "Regionally feasible"
   - [ ] Logout

4. **RTH Stage 3 Final Approval**
   - [ ] Login as RTH
   - [ ] Find REGION_TEAM-approved ATP in queue
   - [ ] Review complete approval chain
   - [ ] Grant final approval
   - [ ] Logout

5. **Verify Workflow Completion**
   - [ ] Login as Administrator
   - [ ] Verify ATP status: Approved
   - [ ] Verify 3-stage approval history
   - [ ] Verify implementation tasks generated

**Expected Results**
- ✅ Hardware ATP workflow uses correct approvers
- ✅ Regional review stage functional
- ✅ All 3 stages complete successfully
- ✅ Audit trail comprehensive

**Actual Results**: ____________________

**Status**: [ ] PASS [ ] FAIL [ ] BLOCKED

**Defects**: ____________________

---

### TC-009: Combined ATP Complete Workflow

**Priority**: P1 (High)
**Estimated Time**: 45 minutes
**Test Scope**: End-to-end Combined ATP (5-stage) workflow

#### Test Steps

1. **VENDOR Submits Combined ATP**
   - [ ] Login as VENDOR
   - [ ] Upload Combined ATP document for Site C
   - [ ] Select ATP Type: Combined (Software + Hardware)
   - [ ] Submit for approval
   - [ ] Logout

2. **BO Stage 1 Review (Software)**
   - [ ] Login as BO
   - [ ] Find submitted Combined ATP in queue
   - [ ] Review software components
   - [ ] Approve software portion
   - [ ] Logout

3. **FOP_RTS Stage 2 Review (Hardware)**
   - [ ] Login as FOP_RTS
   - [ ] Find Combined ATP (BO approved) in queue
   - [ ] Review hardware components
   - [ ] Approve hardware portion
   - [ ] Logout

4. **SME Stage 3 Review (Software Technical)**
   - [ ] Login as SME
   - [ ] Find Combined ATP (stages 1-2 approved) in queue
   - [ ] Review technical specifications
   - [ ] Approve with comments
   - [ ] Logout

5. **REGION_TEAM Stage 4 Review (Regional)**
   - [ ] Login as REGION_TEAM
   - [ ] Find Combined ATP (stages 1-3 approved) in queue
   - [ ] Review regional feasibility
   - [ ] Approve with comments
   - [ ] Logout

6. **HEAD_NOC Stage 5 Final Approval**
   - [ ] Login as HEAD_NOC
   - [ ] Find Combined ATP (stages 1-4 approved) in queue
   - [ ] Review complete approval chain (4 previous approvals)
   - [ ] Grant final approval for both software and hardware
   - [ ] Logout

7. **Verify Workflow Completion**
   - [ ] Login as Administrator
   - [ ] Verify ATP status: Approved
   - [ ] Verify 5-stage approval history complete
   - [ ] Verify all approvers listed in order
   - [ ] Verify implementation tasks for both software and hardware
   - [ ] Verify audit trail captures all 5 stages

**Expected Results**
- ✅ Combined ATP uses 5-stage workflow
- ✅ Software approvers: BO → SME
- ✅ Hardware approvers: FOP_RTS → REGION_TEAM
- ✅ Final approver: HEAD_NOC
- ✅ All stages must complete sequentially
- ✅ Comprehensive audit trail

**Actual Results**: ____________________

**Status**: [ ] PASS [ ] FAIL [ ] BLOCKED

**Defects**: ____________________

---

### TC-010: ATP Rejection Workflow

**Priority**: P1 (High)
**Estimated Time**: 15 minutes
**Test Scope**: ATP rejection and resubmission workflow

#### Test Steps

1. **VENDOR Submits ATP**
   - [ ] Login as VENDOR
   - [ ] Upload Software ATP for Site D
   - [ ] Submit for approval
   - [ ] Logout

2. **BO Rejects ATP**
   - [ ] Login as BO
   - [ ] Find submitted ATP in queue
   - [ ] Review document (identify missing information)
   - [ ] Click "Reject" button
   - [ ] Enter rejection reason: "Missing site diagram"
   - [ ] Submit rejection
   - [ ] Logout

3. **VENDOR Receives Rejection**
   - [ ] Login as VENDOR
   - [ ] Navigate to My Documents
   - [ ] Find rejected ATP
   - [ ] Verify status: Rejected
   - [ ] View rejection reason: "Missing site diagram"
   - [ ] Download rejected document

4. **VENDOR Resubmits ATP**
   - [ ] Update document with missing diagram
   - [ ] Upload revised document
   - [ ] Submit for approval
   - [ ] Add resubmission notes: "Added site diagram"
   - [ ] Verify status: Submitted (back to BO queue)
   - [ ] Logout

5. **BO Reviews Resubmission**
   - [ ] Login as BO
   - [ ] Find resubmitted ATP in queue
   - [ ] Verify resubmission notes visible
   - [ ] Review revised document
   - [ ] Approve resubmission
   - [ ] Verify workflow continues to SME

**Expected Results**
- ✅ Rejection returns ATP to submitter
- ✅ Rejection reason clearly communicated
- ✅ VENDOR can view rejection details
- ✅ Resubmission restarts workflow from beginning
- ✅ Approval history tracks rejection

**Actual Results**: ____________________

**Status**: [ ] PASS [ ] FAIL [ ] BLOCKED

**Defects**: ____________________

---

## 🏗️ Site Management Test Cases

### TC-011: Site Registration Complete Journey

**Priority**: P0 (Critical)
**Estimated Time**: 20 minutes
**Test Scope**: New site registration workflow

#### Test Steps

1. **Create New Site (DOC_CONTROL)**
   - [ ] Login as DOC_CONTROL
   - [ ] Navigate to Sites page
   - [ ] Click "Add New Site" button
   - [ ] Fill site details:
     - Site Code: SITE-TEST-001
     - Site Name: Test Site Jakarta
     - Region: Jakarta
     - Address: Jl. Test No. 123
     - Latitude: -6.2088
     - Longitude: 106.8456
     - Site Type: Tower
   - [ ] Click Save
   - [ ] Verify success message
   - [ ] Verify site appears in list

2. **Validate Site Uniqueness**
   - [ ] Attempt to create duplicate site (same code)
   - [ ] Verify error: "Site code already exists"
   - [ ] Verify duplicate rejected

3. **Site Lifecycle Management**
   - [ ] Edit newly created site
   - [ ] Update status: Under Construction
   - [ ] Add construction start date
   - [ ] Save changes
   - [ ] Verify status updated

4. **Associate ATP Document**
   - [ ] From site details, click "Add ATP Document"
   - [ ] Upload ATP for this site
   - [ ] Submit for approval
   - [ ] Verify ATP linked to site

**Expected Results**
- ✅ Site creation successful
- ✅ Duplicate validation prevents duplicates
- ✅ Site lifecycle can be updated
- ✅ ATP documents can be associated

**Actual Results**: ____________________

**Status**: [ ] PASS [ ] FAIL [ ] BLOCKED

**Defects**: ____________________

---

### TC-012: Bulk Site Import

**Priority**: P1 (High)
**Estimated Time**: 15 minutes
**Test Scope**: Bulk site import functionality

#### Test Steps

1. **Prepare Import File**
   - [ ] Create Excel file with 10 sites
   - [ ] Include columns: site_code, site_name, region, address, lat, long, type
   - [ ] Ensure all required fields filled
   - [ ] Save as site-import-valid.xlsx

2. **Import Sites (VENDOR_ADMIN)**
   - [ ] Login as VENDOR_ADMIN
   - [ ] Navigate to Sites page
   - [ ] Click "Import Sites" button
   - [ ] Select site-import-valid.xlsx
   - [ ] Click Upload
   - [ ] Verify validation progress
   - [ ] Verify import summary: "10 sites processed"

3. **Verify Imported Sites**
   - [ ] Filter sites by date: Today
   - [ ] Verify 10 new sites appear
   - [ ] Spot-check 3 sites for accuracy
   - [ ] Verify all data imported correctly

4. **Test Import with Duplicates**
   - [ ] Attempt to import same file again
   - [ ] Verify duplicate detection
   - [ ] Verify error: "5 duplicate site codes found"
   - [ ] Verify partial import option available
   - [ ] Import only non-duplicates

**Expected Results**
- ✅ Bulk import processes multiple sites
- ✅ Duplicate detection works
- ✅ Validation catches invalid data
- ✅ Partial import allowed for valid records

**Actual Results**: ____________________

**Status**: [ ] PASS [ ] FAIL [ ] BLOCKED

**Defects**: ____________________

---

## 📋 Task Management Test Cases

### TC-013: Automatic Task Generation from ATP Approval

**Priority**: P0 (Critical)
**Estimated Time**: 20 minutes
**Test Scope**: Verify tasks auto-generated after ATP approval

#### Test Steps

1. **Approve ATP (Final Stage)**
   - [ ] Login as HEAD_NOC
   - [ ] Find pending ATP for final approval
   - [ ] Approve ATP
   - [ ] Note approval timestamp
   - [ ] Logout

2. **Verify Task Generation (Administrator)**
   - [ ] Login as Administrator
   - [ ] Navigate to Tasks page
   - [ ] Filter by Created: Today
   - [ ] Verify new tasks created from ATP approval:
     - Task 1: Site preparation
     - Task 2: Equipment procurement
     - Task 3: Installation scheduling
   - [ ] Verify tasks linked to approved ATP
   - [ ] Verify tasks linked to correct site

3. **Verify Task Assignments**
   - [ ] Check task assignments:
     - Site preparation → SITE_MANAGER
     - Equipment procurement → VENDOR
     - Installation scheduling → DOC_CONTROL
   - [ ] Verify due dates calculated correctly (e.g., +7 days)
   - [ ] Verify task priorities set correctly

4. **Verify Notifications**
   - [ ] Check assigned users received notifications
   - [ ] Login as SITE_MANAGER
   - [ ] Verify task appears in dashboard
   - [ ] Verify email notification received (if configured)

**Expected Results**
- ✅ Tasks auto-generated immediately after ATP approval
- ✅ Tasks correctly linked to ATP and site
- ✅ Assignments follow predefined rules
- ✅ Due dates calculated automatically
- ✅ Notifications sent to assignees

**Actual Results**: ____________________

**Status**: [ ] PASS [ ] FAIL [ ] BLOCKED

**Defects**: ____________________

---

### TC-014: Bulk Task Operations

**Priority**: P1 (High)
**Estimated Time**: 15 minutes
**Test Scope**: Bulk task status updates and assignments

#### Test Steps

1. **Select Multiple Tasks**
   - [ ] Login as SITE_MANAGER
   - [ ] Navigate to Tasks page
   - [ ] Filter by Status: Pending
   - [ ] Select 5 pending tasks (checkboxes)
   - [ ] Verify bulk action menu appears

2. **Bulk Assign Tasks**
   - [ ] Click "Assign" button
   - [ ] Select assignee: VENDOR
   - [ ] Set priority: HIGH
   - [ ] Click "Assign All"
   - [ ] Verify confirmation: "5 tasks assigned to VENDOR"
   - [ ] Verify tasks disappear from pending list
   - [ ] Filter by Assigned: VENDOR
   - [ ] Verify 5 tasks now assigned to VENDOR

3. **Bulk Update Task Status**
   - [ ] Select 10 completed tasks
   - [ ] Click "Update Status" button
   - [ ] Select status: Completed
   - [ ] Add completion notes: "Bulk completed"
   - [ ] Click "Update All"
   - [ ] Verify all 10 tasks marked as completed
   - [ ] Verify completion timestamp recorded

4. **Bulk Export Tasks**
   - [ ] Filter tasks by date range: Last 7 days
   - [ ] Click "Export" button
   - [ ] Select format: Excel
   - [ ] Download exported file
   - [ ] Verify file contains filtered tasks
   - [ ] Verify all data fields accurate

**Expected Results**
- ✅ Bulk assignment works for multiple tasks
- ✅ Bulk status update functional
- ✅ Bulk export generates accurate file
- ✅ Confirmation messages clear

**Actual Results**: ____________________

**Status**: [ ] PASS [ ] FAIL [ ] BLOCKED

**Defects**: ____________________

---

## 🔀 Cross-Functional Test Cases

### TC-015: End-to-End Site Deployment Journey

**Priority**: P0 (Critical)
**Estimated Time**: 60 minutes
**Test Scope**: Complete site deployment from registration to commissioning

#### Test Steps

1. **Site Registration**
   - [ ] Login as DOC_CONTROL
   - [ ] Register new site: SITE-E2E-001
   - [ ] Set status: Planned
   - [ ] Save site
   - [ ] Logout

2. **ATP Submission**
   - [ ] Login as VENDOR
   - [ ] Upload Combined ATP for SITE-E2E-001
   - [ ] Submit for approval
   - [ ] Logout

3. **ATP Approval Workflow**
   - [ ] Login as BO → Approve software
   - [ ] Login as FOP_RTS → Approve hardware
   - [ ] Login as SME → Technical approval
   - [ ] Login as REGION_TEAM → Regional approval
   - [ ] Login as HEAD_NOC → Final approval
   - [ ] Logout

4. **Implementation Phase**
   - [ ] Login as SITE_MANAGER
   - [ ] View auto-generated tasks
   - [ ] Assign tasks to teams
   - [ ] Update task statuses as work progresses
   - [ ] Mark tasks completed
   - [ ] Logout

5. **Site Commissioning**
   - [ ] Login as DOC_CONTROL
   - [ ] Navigate to SITE-E2E-001
   - [ ] Update site status: Active
   - [ ] Add commissioning date
   - [ ] Upload commissioning report
   - [ ] Save changes
   - [ ] Logout

6. **Final Verification**
   - [ ] Login as Administrator
   - [ ] View site details
   - [ ] Verify status: Active
   - [ ] Verify ATP: Approved
   - [ ] Verify all tasks: Completed
   - [ ] Verify audit trail complete
   - [ ] Generate site deployment report

**Expected Results**
- ✅ Complete workflow from registration to commissioning
- ✅ All stages progress correctly
- ✅ Task generation and assignment accurate
- ✅ Site lifecycle updates properly
- ✅ Full audit trail maintained

**Actual Results**: ____________________

**Status**: [ ] PASS [ ] FAIL [ ] BLOCKED

**Defects**: ____________________

---

## ❌ Negative Test Cases

### TC-016: Unauthorized Access Attempts

**Priority**: P0 (Critical)
**Estimated Time**: 10 minutes
**Test Scope**: Verify RBAC prevents unauthorized access

#### Test Steps

1. **VENDOR Accessing Admin Functions**
   - [ ] Login as VENDOR
   - [ ] Attempt to navigate to /admin/users
   - [ ] Verify 403 Forbidden error
   - [ ] Attempt to access /admin/roles
   - [ ] Verify 403 Forbidden error
   - [ ] Attempt API call: GET /api/v1/users
   - [ ] Verify 403 response

2. **BO Accessing Hardware ATP**
   - [ ] Login as BO
   - [ ] Navigate to ATP Documents
   - [ ] Filter by Type: Hardware ATP
   - [ ] Verify Hardware ATPs NOT visible to BO
   - [ ] Verify only Software ATPs accessible

3. **SME Accessing Final Approval**
   - [ ] Login as SME
   - [ ] Attempt to approve ATP without BO approval
   - [ ] Verify approval rejected: "BO approval required first"
   - [ ] Verify workflow enforces stage order

4. **Cross-Role Task Modification**
   - [ ] Login as VENDOR
   - [ ] Attempt to modify task assigned to SITE_MANAGER
   - [ ] Verify 403 error
   - [ ] Verify only assignee can modify task

5. **Session Timeout**
   - [ ] Login as any user
   - [ ] Wait for session timeout (if configured)
   - [ ] Attempt to navigate to protected page
   - [ ] Verify redirect to login
   - [ ] Verify session cleared

**Expected Results**
- ✅ RBAC enforces role boundaries
- ✅ 403 errors for unauthorized access
- ✅ Workflow stage order enforced
- ✅ Cross-role modifications prevented
- ✅ Session management functional

**Actual Results**: ____________________

**Status**: [ ] PASS [ ] FAIL [ ] BLOCKED

**Defects**: ____________________

---

### TC-017: Invalid Input Validation

**Priority**: P1 (High)
**Estimated Time**: 15 minutes
**Test Scope**: Verify system handles invalid inputs correctly

#### Test Steps

1. **Invalid File Upload**
   - [ ] Login as VENDOR
   - [ ] Attempt to upload non-Excel file (.pdf)
   - [ ] Verify error: "Invalid file type"
   - [ ] Attempt to upload oversized file (> 10MB)
   - [ ] Verify error: "File size exceeds 10MB limit"
   - [ ] Attempt to upload malformed Excel file
   - [ ] Verify error: "Invalid file format"

2. **Missing Required Fields**
   - [ ] Create site without site code
   - [ ] Verify error: "Site code is required"
   - [ ] Create site without site name
   - [ ] Verify error: "Site name is required"
   - [ ] Submit ATP without file upload
   - [ ] Verify error: "Document upload is required"

3. **Duplicate Data Submission**
   - [ ] Create site with existing site code
   - [ ] Verify error: "Site code already exists"
   - [ ] Submit ATP for same site twice
   - [ ] Verify error or warning: "Pending ATP exists for this site"

4. **SQL Injection Attempts**
   - [ ] Enter SQL injection in search field: "' OR '1'='1"
   - [ ] Verify input sanitized
   - [ ] Verify no SQL errors
   - [ ] Verify safe search results

5. **XSS Attempts**
   - [ ] Enter XSS payload in description: "<script>alert('xss')</script>"
   - [ ] Verify input sanitized
   - [ ] Verify script not executed
   - [ ] Verify safe display in UI

**Expected Results**
- ✅ File validation prevents invalid uploads
- ✅ Required field validation enforced
- ✅ Duplicate detection works
- ✅ SQL injection prevented
- ✅ XSS prevented

**Actual Results**: ____________________

**Status**: [ ] PASS [ ] FAIL [ ] BLOCKED

**Defects**: ____________________

---

### TC-018: Concurrent Operations

**Priority**: P2 (Medium)
**Estimated Time**: 15 minutes
**Test Scope**: Verify system handles concurrent operations

#### Test Steps

1. **Simultaneous ATP Approvals**
   - [ ] Open 2 browsers, login as BO in both
   - [ ] Browser 1: Open ATP document
   - [ ] Browser 2: Open same ATP document
   - [ ] Browser 1: Approve ATP
   - [ ] Browser 2: Attempt to approve same ATP
   - [ ] Verify Browser 2 gets error: "ATP already approved"
   - [ ] Verify no duplicate approval

2. **Simultaneous Site Updates**
   - [ ] Browser 1: Edit site details
   - [ ] Browser 2: Edit same site details
   - [ ] Browser 1: Save changes
   - [ ] Browser 2: Save changes (different data)
   - [ ] Verify optimistic locking or last-write-wins
   - [ ] Verify data integrity maintained

3. **Concurrent Task Assignment**
   - [ ] Browser 1: Assign task to User A
   - [ ] Browser 2: Assign same task to User B
   - [ ] Verify conflict resolution
   - [ ] Verify only one assignment succeeds

**Expected Results**
- ✅ Concurrent operations handled gracefully
- ✅ No data corruption
- ✅ Appropriate conflict resolution
- ✅ User-friendly error messages

**Actual Results**: ____________________

**Status**: [ ] PASS [ ] FAIL [ ] BLOCKED

**Defects**: ____________________

---

## ⚡ Performance Test Cases

### TC-019: Large Dataset Handling

**Priority**: P2 (Medium)
**Estimated Time**: 20 minutes
**Test Scope**: Verify system performance with large datasets

#### Test Steps

1. **Load Large ATP List**
   - [ ] Ensure database has 1000+ ATP documents
   - [ ] Login as Administrator
   - [ ] Navigate to ATP Documents page
   - [ ] Measure page load time
   - [ ] Verify load time < 3 seconds
   - [ ] Test pagination (if available)
   - [ ] Verify filtering performance

2. **Bulk Upload Performance**
   - [ ] Prepare bulk upload of 50 ATP documents
   - [ ] Login as VENDOR_ADMIN
   - [ ] Initiate bulk upload
   - [ ] Measure upload time
   - [ ] Verify all 50 documents processed
   - [ ] Verify timeout not exceeded

3. **Report Generation Performance**
   - [ ] Login as Administrator
   - [ ] Generate report for last 6 months (expecting large dataset)
   - [ ] Measure generation time
   - [ ] Verify generation time < 30 seconds
   - [ ] Verify report completeness

4. **Concurrent User Load**
   - [ ] Simulate 10 concurrent users (different roles)
   - [ ] All users perform common operations:
     - Login
     - View dashboard
     - View ATP list
     - Approve ATP
   - [ ] Measure response times
   - [ ] Verify no 500 errors
   - [ ] Verify acceptable performance (< 2s per operation)

**Expected Results**
- ✅ System handles large datasets
- ✅ Pagination prevents memory issues
- ✅ Bulk operations complete in reasonable time
- ✅ Report generation completes
- ✅ Concurrent users supported

**Actual Results**: ____________________

**Status**: [ ] PASS [ ] FAIL [ ] BLOCKED

**Defects**: ____________________

---

### TC-020: File Upload Performance

**Priority**: P2 (Medium)
**Estimated Time**: 10 minutes
**Test Scope**: Verify file upload performance and limits

#### Test Steps

1. **Upload Various File Sizes**
   - [ ] Upload 1MB file → Measure time
   - [ ] Upload 5MB file → Measure time
   - [ ] Upload 10MB file (max size) → Measure time
   - [ ] Attempt 15MB file → Verify rejection
   - [ ] Verify upload progress bars work

2. **Concurrent Uploads**
   - [ ] Upload 5 files simultaneously
   - [ ] Verify all uploads process
   - [ ] Verify no file corruption
   - [ ] Measure total time

**Expected Results**
- ✅ Upload time proportional to file size
- ✅ Max size limit enforced
- ✅ Concurrent uploads supported
- ✅ No file corruption

**Actual Results**: ____________________

**Status**: [ ] PASS [ ] FAIL [ ] BLOCKED

**Defects**: ____________________

---

## ✅ Test Execution Checklist

### Pre-Test Setup

- [ ] Backend server running: `cd backend && node server.js`
- [ ] Frontend server running: `cd frontend && npm start`
- [ ] Database connection verified
- [ ] Test data populated (sites, users, initial ATPs)
- [ ] Test files prepared (valid and invalid)
- [ ] Browser devtools open
- [ ] Test case document ready

### Test Execution

**Date**: ____________________
**Tester**: ____________________
**Environment**: [ ] Local [ ] Staging [ ] Production

#### Summary by Priority

| Priority | Total | Passed | Failed | Blocked | Pass Rate |
|----------|-------|--------|--------|---------|-----------|
| P0 (Critical) | 10 | ____ | ____ | ____ | ____% |
| P1 (High) | 6 | ____ | ____ | ____ | ____% |
| P2 (Medium) | 4 | ____ | ____ | ____ | ____% |
| **TOTAL** | **20** | **____** | **____** | **____** | **____%** |

#### Failed Tests Summary

| TC ID | Test Name | Severity | Defect ID | Notes |
|-------|-----------|----------|-----------|-------|
| | | | | |

#### Blocked Tests Summary

| TC ID | Test Name | Blocker Reason | Unblocking Action |
|-------|-----------|----------------|-------------------|
| | | | |

### Post-Test Cleanup

- [ ] Test data cleaned up (if not needed)
- [ ] Test users deactivated (if created)
- [ ] Logs collected and archived
- [ ] Test report generated
- [ ] Defects logged in issue tracker

---

## 📝 Test Notes

### Test Environment Details

**Browser**: ____________________
**OS**: ____________________
**Screen Resolution**: ____________________
**Network**: [ ] Fast [ ] 3G [ ] Offline

### General Observations

_______________________________________________________________

_______________________________________________________________

_______________________________________________________________

### Recommendations

1. **Critical Fixes Needed**:
   _______________________________________________________________

2. **High Priority Improvements**:
   _______________________________________________________________

3. **Medium Priority Enhancements**:
   _______________________________________________________________

---

## 🐛 Defect Template

Copy this template for each defect found:

```
DEFECT-XXX: [Short Title]

**Severity**: [Critical/Major/Minor/Trivial]
**Priority**: [P0/P1/P2/P3]
**Environment**: [Local/Staging/Production]
**Test Case**: TC-XXX

**Steps to Reproduce**:
1.
2.
3.

**Expected Result**:
______________________________________

**Actual Result**:
______________________________________

**Screenshot/Video**:
[Link or attachment]

**Browser/Device**:
______________________________________

**Console Errors**:
______________________________________

**Network Errors**:
______________________________________
```

---

**Test Document Version**: 1.0
**Last Updated**: 2025-12-27
**Next Review**: After major feature changes
**Maintained By**: QA Team

---

## 📞 Support

**Questions**: Refer to [docs/00-start-here.md](../00-start-here.md)
**Issues**: [GitHub Issues](https://github.com/aribuy/apms/issues)
**Testing Guide**: [docs/testing/README.md](./README.md)
