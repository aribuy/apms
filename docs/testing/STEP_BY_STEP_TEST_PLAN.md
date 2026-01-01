# 📋 STEP BY STEP TEST PLAN - ATP Approval Flow

**Based on**: ATP_PROCESS_APPROVAL_FLOW_IMPLEMENTATION.md
**Date**: 2025-12-28
**Approach**: Incremental testing from bottom-up

---

## 🎯 TESTING STRATEGY

### Approach: **Bottom-Up Testing**

`` Layer 1: Backend API Tests (Foundation)
    ↓
 Layer 2: Workflow Engine Tests (Business Logic)
    ↓
 Layer 3: Frontend Component Tests (UI)
    ↓
 Layer 4: End-to-End User Journey Tests (Complete Flow)
```

**Why This Approach?**
- ✅ Test foundation first (backend APIs)
- ✅ Validate business logic before UI
- ✅ Easier to debug failures
- ✅ Can run tests in isolation

---

## 📊 TESTING SCOPE

### Components to Test (from ATP_PROCESS_APPROVAL_FLOW_IMPLEMENTATION.md)

#### Frontend Components (5)
1. ✅ ATPSubmission.tsx - Document submission interface
2. ✅ ReviewDashboard.tsx - Role-based review dashboard
3. ✅ ApprovalInterface.tsx - Document review and approval
4. ✅ PunchlistManagement.tsx - Issue tracking and rectification
5. ✅ ATPProcessFlow.tsx - Main workflow orchestration

#### Backend Components (2)
1. ✅ Enhanced atpRoutes.js - 7 new API endpoints
2. ✅ atpWorkflowEngine.js - 9 core workflow methods

#### Workflows to Test (2)
1. ✅ Software ATP Flow (Orange Path): BO → SME → Head NOC
2. ✅ Hardware ATP Flow (Green Path): FOP_RTS → Region_Team → RTH

#### Features to Test (8)
1. ✅ Role-Based Access Control
2. ✅ SLA Management (48h/48h/24h deadlines)
3. ✅ Punchlist System (None/Minor-Major/Critical)
4. ✅ Audit Trail
5. ✅ Review Statistics Dashboard
6. ✅ Evidence Photo Linking
7. ✅ Before/After Evidence Upload
8. ✅ Severity-Based Prioritization

---

## 🚀 STEP-BY-STEP EXECUTION PLAN

### ✅ STEP 1: Test Data Preparation (FOUNDATION)

**Objective**: Create test users and data that match ATP_PROCESS_USERS.md

**Tasks**:
1. Create SQL script to insert test users
2. Create test sites (minimum 4 sites)
3. Create test ATP templates (software + hardware)
4. Verify test data in database

**Expected Output**:
```
✅ 11 test users created
✅ 4 test sites created
✅ 2 ATP templates ready
✅ Database verified
```

**Success Criteria**:
- All users can login
- Sites appear in dropdown
- Templates available for selection

---

### ✅ STEP 2: Backend API Tests (LAYER 1)

**Objective**: Test all 7 new API endpoints

**Test Coverage**:

#### 2.1 Pending Reviews API
```
Endpoint: GET /api/v1/atp/reviews/pending?role=BO
Test Cases:
  ✓ Should return pending reviews for BO role
  ✓ Should return empty array if no pending reviews
  ✓ Should filter by role correctly
  ✓ Should include SLA deadline info
  ✓ Should handle invalid role parameter
```

#### 2.2 Completed Reviews API
```
Endpoint: GET /api/v1/atp/reviews/completed?role=SME
Test Cases:
  ✓ Should return completed reviews for SME role
  ✓ Should include decision history
  ✓ Should paginate results
  ✓ Should filter by date range
```

#### 2.3 Review Statistics API
```
Endpoint: GET /api/v1/atp/reviews/stats?role=HEAD_NOC
Test Cases:
  ✓ Should return pending count
  ✓ Should return reviewed today count
  ✓ Should return approved this week count
  ✓ Should return rejected this week count
  ✓ Should calculate statistics correctly
```

#### 2.4 Workflow Status API
```
Endpoint: GET /api/v1/atp/:atpId/workflow-status
Test Cases:
  ✓ Should return current stage
  ✓ Should return completion percentage
  ✓ Should return stage history
  ✓ Should return review status for each stage
  ✓ Should handle invalid ATP ID
```

#### 2.5 Punchlist Items API
```
Endpoint: GET /api/v1/atp/punchlist/items?atpId=XXX
Test Cases:
  ✓ Should return punchlist items for ATP
  ✓ Should include severity info
  ✓ Should include status (active/completed)
  ✓ Should filter by severity
  ✓ Should filter by status
```

#### 2.6 Punchlist Complete API
```
Endpoint: POST /api/v1/atp/punchlist/:punchlistId/complete
Test Cases:
  ✓ Should complete punchlist item
  ✓ Should require before/after evidence
  ✓ Should update punchlist status
  ✓ Should log completion timestamp
  ✓ Should handle invalid punchlist ID
```

#### 2.7 SLA Violations API
```
Endpoint: GET /api/v1/atp/sla/violations
Test Cases:
  ✓ Should return overdue reviews
  ✓ Should calculate overdue hours
  ✓ Should include reviewer info
  ✓ Should sort by overdue severity
  ✓ Should return empty if no violations
```

**Expected Output**:
```
✅ 7 API endpoints tested
✅ 35+ test cases created
✅ All endpoints functional
✅ Response formats validated
```

**Success Criteria**:
- All endpoints return 200 OK
- Response schemas match documentation
- Error cases handled correctly

---

### ✅ STEP 3: Workflow Engine Tests (LAYER 2)

**Objective**: Test all 9 core workflow methods

**Test Coverage**:

#### 3.1 Initialize Workflow
```
Method: initializeWorkflow(atpId, atpType)
Test Cases:
  ✓ Should create review stages for Software ATP
  ✓ Should create review stages for Hardware ATP
  ✓ Should set correct SLA deadlines (48h/48h/24h)
  ✓ Should assign reviewers based on role
  ✓ Should handle invalid ATP type
```

#### 3.2 Process Review Decision
```
Method: processReviewDecision(atpId, stageId, decision)
Test Cases:
  ✓ Should approve and move to next stage
  ✓ Should reject and stop workflow
  ✓ Should create punchlist for "Approve with Punchlist"
  ✓ Should update stage status
  ✓ Should handle invalid decision
```

#### 3.3 Get Pending Reviews
```
Method: getPendingReviews(userRole)
Test Cases:
  ✓ Should return pending reviews for role
  ✓ Should include ATP document info
  ✓ Should include SLA deadline
  ✓ Should sort by deadline priority
  ✓ Should return empty if none pending
```

#### 3.4 Get Completed Reviews
```
Method: getCompletedReviews(userRole, limit)
Test Cases:
  ✓ Should return completed reviews
  ✓ Should include decision history
  ✓ Should include reviewer comments
  ✓ Should paginate correctly
  ✓ Should filter by date range
```

#### 3.5 Get Review Stats
```
Method: getReviewStats(userRole)
Test Cases:
  ✓ Should return pending count
  ✓ Should return reviewed today count
  ✓ Should return approved this week
  ✓ Should return rejected this week
  ✓ Should calculate correctly for all roles
```

#### 3.6 Complete Punchlist Rectification
```
Method: completePunchlistRectification(punchlistId, evidence)
Test Cases:
  ✓ Should mark punchlist as completed
  ✓ Should require before/after photos
  ✓ Should update completion timestamp
  ✓ Should notify reviewer (if implemented)
  ✓ Should handle invalid punchlist ID
```

#### 3.7 Get Workflow Status
```
Method: getWorkflowStatus(atpId)
Test Cases:
  ✓ Should return current stage name
  ✓ Should return completion percentage
  ✓ Should return all stage statuses
  ✓ Should return punchlist count
  ✓ Should handle invalid ATP ID
```

#### 3.8 Check SLA Violations
```
Method: checkSLAViolations()
Test Cases:
  ✓ Should detect overdue reviews
  ✓ Should calculate overdue duration
  ✓ Should categorize by severity
  ✓ Should return empty array if no violations
  ✓ Should handle database errors
```

#### 3.9 Auto-Categorization
```
Method: categorizeATP(document)
Test Cases:
  ✓ Should categorize as Software (software keywords)
  ✓ Should categorize as Hardware (hardware keywords)
  ✓ Should categorize as Combined (both keywords)
  ✓ Should return confidence score
  ✓ Should handle empty content
```

**Expected Output**:
```
✅ 9 workflow methods tested
✅ 45+ test cases created
✅ Business logic validated
✅ Edge cases covered
```

**Success Criteria**:
- All methods execute without errors
- Business rules enforced correctly
- SLA calculations accurate
- State transitions work as expected

---

### ✅ STEP 4: Frontend Component Tests (LAYER 3)

**Objective**: Test all 5 frontend components

**Test Coverage**:

#### 4.1 ATP Submission Component
```
Component: ATPSubmission.tsx
Test Cases:
  ✓ Should render site selection dropdown
  ✓ Should render template selection dropdown
  ✓ Should validate file upload (PDF only)
  ✓ Should display requirements checklist
  ✓ Should submit ATP document successfully
  ✓ Should show success message after submission
  ✓ Should handle submission errors
```

#### 4.2 Review Dashboard Component
```
Component: ReviewDashboard.tsx
Test Cases:
  ✓ Should render pending reviews tab
  ✓ Should render completed reviews tab
  ✓ Should display review statistics
  ✓ Should show SLA deadline indicators
  ✓ Should apply filters correctly
  ✓ Should search reviews
  ✓ Should navigate to approval interface
```

#### 4.3 Approval Interface Component
```
Component: ApprovalInterface.tsx
Test Cases:
  ✓ Should render checklist tab
  ✓ Should render evidence tab
  ✓ Should render document tab
  ✓ Should render history tab
  ✓ Should allow Pass/Fail/NA evaluation
  ✓ Should create punchlist items
  ✓ Should submit approve decision
  ✓ Should submit reject decision
  ✓ Should submit "approve with punchlist" decision
```

#### 4.4 Punchlist Management Component
```
Component: PunchlistManagement.tsx
Test Cases:
  ✓ Should render active punchlist tab
  ✓ Should render completed punchlist tab
  ✓ Should display severity indicators
  ✓ Should allow before evidence upload
  ✓ Should allow after evidence upload
  ✓ Should allow rectification notes
  ✓ Should complete punchlist item
  ✓ Should filter by severity
```

#### 4.5 ATP Process Flow Component
```
Component: ATPProcessFlow.tsx
Test Cases:
  ✓ Should switch components based on role
  ✓ Should navigate between modules
  ✓ Should enforce role-based access
  ✓ Should handle unauthorized access
  ✓ Should display workflow progress
```

**Expected Output**:
```
✅ 5 components tested
✅ 35+ test cases created
✅ UI functionality validated
✅ User interactions work
```

**Success Criteria**:
- Components render without errors
- User interactions functional
- Navigation works correctly
- Role-based access enforced

---

### ✅ STEP 5: End-to-End User Journey Tests (LAYER 4)

**Objective**: Test complete workflows from user perspective

**Test Coverage**:

#### 5.1 Software ATP Flow (Orange Path) - Happy Path
```
Scenario: Complete Software ATP approval without punchlist
Actors:
  1. Vendor (doc.control@aviat.com)
  2. Business Ops (business.ops@xlsmart.co.id)
  3. SME (sme.team@xlsmart.co.id)
  4. Head NOC (noc.head@xlsmart.co.id)

Steps:
  1. Vendor logs in
  2. Vendor submits Software ATP document
  3. System auto-categorizes as Software
  4. System initializes workflow (BO → SME → Head NOC)
  5. Business Ops reviews and approves
  6. System advances to SME stage
  7. SME reviews and approves
  8. System advances to Head NOC stage
  9. Head NOC reviews and approves
  10. System marks ATP as fully approved

Expected Results:
  ✓ ATP submitted successfully
  ✓ Categorized as Software
  ✓ 3 review stages completed
  ✓ Final status: approved
  ✓ No punchlist items
  ✓ All audit trails preserved
```

#### 5.2 Software ATP Flow - With Punchlist
```
Scenario: Software ATP approval with minor punchlist
Actors: Same as 5.1

Steps:
  1-4. Same as 5.1
  5. Business Ops reviews and approves
  6. SME reviews, finds 2 issues
  7. SME creates 2 punchlist items (1 Major, 1 Minor)
  8. SME selects "Approve with Punchlist"
  9. System advances to Head NOC (with punchlist)
  10. Head NOC reviews punchlist items
  11. Head NOC approves with punchlist
  12. System marks ATP as approved with punchlist

Expected Results:
  ✓ ATP approved with punchlist
  ✓ 2 punchlist items created
  ✓ Severity levels correct
  ✓ Punchlist status: active
  ✓ Vendor can see punchlist items
```

#### 5.3 Software ATP Flow - Rejection
```
Scenario: Software ATP rejection at BO stage
Actors:
  1. Vendor (doc.control@aviat.com)
  2. Business Ops (business.ops@xlsmart.co.id)

Steps:
  1. Vendor submits Software ATP
  2. Business Ops reviews
  3. Business Ops finds critical issues
  4. Business Ops selects "Reject"
  5. Business Ops adds rejection comments
  6. System stops workflow
  7. System marks ATP as rejected

Expected Results:
  ✓ ATP rejected
  ✓ Workflow stopped
  ✓ No further stages created
  ✓ Vendor notified of rejection
  ✓ Rejection reason saved
```

#### 5.4 Hardware ATP Flow (Green Path) - Happy Path
```
Scenario: Complete Hardware ATP approval without punchlist
Actors:
  1. Vendor (doc.control@aviat.com)
  2. FOP RTS (fop.rts@xlsmart.co.id)
  3. Region Team (region.team@xlsmart.co.id)
  4. RTH (rth.head@xlsmart.co.id)

Steps:
  1. Vendor logs in
  2. Vendor submits Hardware ATP document
  3. System auto-categorizes as Hardware
  4. System initializes workflow (FOP_RTS → REGION_TEAM → RTH)
  5. FOP RTS reviews and approves
  6. System advances to Region Team stage
  7. Region Team reviews and approves
  8. System advances to RTH stage
  9. RTH reviews and approves
  10. System marks ATP as fully approved

Expected Results:
  ✓ ATP submitted successfully
  ✓ Categorized as Hardware
  ✓ 3 review stages completed
  ✓ Final status: approved
  ✓ No punchlist items
```

#### 5.5 Hardware ATP Flow - With Critical Punchlist
```
Scenario: Hardware ATP with critical punchlist requiring rectification
Actors:
  1. Vendor (doc.control@aviat.com)
  2. FOP RTS (fop.rts@xlsmart.co.id)
  3. Region Team (region.team@xlsmart.co.id)
  4. RTH (rth.head@xlsmart.co.id)
  5. Field Engineer (admin@aviat.com)

Steps:
  1-4. Same as 5.4
  5. FOP RTS reviews, finds critical issue
  6. FOP RTS creates punchlist item (severity: Critical)
  7. FOP RTS selects "Approve with Punchlist"
  8. System advances to Region Team
  9. Region Team and RTH approve
  10. ATP approved with critical punchlist
  11. Field Engineer accesses punchlist
  12. Field Engineer uploads before evidence
  13. Field Engineer performs rectification
  14. Field Engineer uploads after evidence
  15. Field Engineer marks punchlist as complete

Expected Results:
  ✓ Critical punchlist created
  ✓ Mandatory rectification enforced
  ✓ Before/after evidence uploaded
  ✓ Punchlist marked as complete
  ✓ Audit trail complete
```

#### 5.6 SLA Violation Detection
```
Scenario: Detect and report SLA violations
Actors: System (automated)

Steps:
  1. Create ATP document
  2. Initialize workflow
  3. Modify database: set submission date to 3 days ago
  4. Call SLA violations endpoint
  5. Verify overdue reviews detected

Expected Results:
  ✓ System detects overdue review
  ✓ Calculates overdue hours correctly
  ✓ Returns in violations endpoint
  ✓ Flags with high priority
  ✓ Can be filtered by role
```

**Expected Output**:
```
✅ 6 E2E scenarios tested
✅ Complete workflows validated
✅ All user roles tested
✅ Business rules enforced
```

**Success Criteria**:
- All scenarios complete successfully
- No console errors
- Database state correct
- UI displays expected results

---

## 📊 TEST EXECUTION ORDER

### Week 1: Foundation
```
Day 1-2: STEP 1 - Test Data Preparation
Day 3-4: STEP 2 - Backend API Tests
Day 5:   STEP 3 - Workflow Engine Tests (part 1)
```

### Week 2: Core Testing
```
Day 1-2: STEP 3 - Workflow Engine Tests (part 2)
Day 3-4: STEP 4 - Frontend Component Tests
Day 5:   STEP 5 - E2E Tests (part 1)
```

### Week 3: Integration
```
Day 1-3: STEP 5 - E2E Tests (part 2)
Day 4-5: Bug fixes and regression testing
```

---

## 📈 SUCCESS METRICS

### Coverage Targets
- ✅ Backend API: 100% (7/7 endpoints)
- ✅ Workflow Engine: 100% (9/9 methods)
- ✅ Frontend Components: 100% (5/5 components)
- ✅ E2E Scenarios: 100% (6/6 scenarios)

### Quality Targets
- ✅ All tests pass (100%)
- ✅ Zero critical bugs
- ✅ Zero console errors
- ✅ Code coverage > 80%

---

## ✅ CHECKPOINTS

### Checkpoint 1: After STEP 1
```
✅ Test users created and verified
✅ Test sites available
✅ Can login with all test users
✅ Database ready
```

### Checkpoint 2: After STEP 2
```
✅ All 7 API endpoints functional
✅ API tests passing
✅ Response schemas validated
✅ Error handling verified
```

### Checkpoint 3: After STEP 3
```
✅ All workflow methods tested
✅ Business logic validated
✅ SLA calculations accurate
✅ State transitions working
```

### Checkpoint 4: After STEP 4
```
✅ All components functional
✅ UI interactions working
✅ Role-based access enforced
✅ Navigation correct
```

### Checkpoint 5: After STEP 5
```
✅ All E2E scenarios passing
✅ Complete workflows validated
✅ Ready for production
```

---

## 🚀 NEXT STEP

**Ready to start STEP 1: Test Data Preparation**

This will involve:
1. Creating SQL script for test users (matching ATP_PROCESS_USERS.md)
2. Creating test sites
3. Creating test ATP templates
4. Verifying database state

**Shall I proceed with STEP 1?**

---

**Plan Date**: 2025-12-28
**Status**: Ready for Execution
**Estimated Duration**: 3 weeks (complete)
**First Step Duration**: 1-2 days (test data prep)
