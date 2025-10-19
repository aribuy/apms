# ATP Process Approval Flow - User Journey Test Scenarios

## 🎯 Skenario 1: Complete ATP Approval Flow (Happy Path)

### Actors:
- **Vendor**: admin@aviat.com / Admin123!
- **Business Ops**: business.ops@xlsmart.co.id / test123
- **SME**: sme.team@xlsmart.co.id / test123
- **Head NOC**: noc.head@xlsmart.co.id / test123

### Journey Steps:

#### 1. Vendor Submits ATP Document
**User**: admin@aviat.com
1. Login ke sistem
2. Navigate: ATP Management → Submit ATP Documents
3. Select Site: JKTB001 - PANYAKALAN
4. Select Template: Software ATP Template
5. Upload File: Sample_ATP_Software.pdf
6. Click "Submit ATP Document"
7. **Expected**: Success message + ATP code generated (ATP-2025-XXXX)

#### 2. Business Operations Review
**User**: business.ops@xlsmart.co.id
1. Login ke sistem
2. Navigate: ATP Management → Review Dashboard
3. Verify: 1 pending review in dashboard
4. Click "Review" button
5. Tab "Checklist": Evaluate 3 items as "Pass"
6. Add comments: "All business requirements met"
7. Select Decision: "Approve"
8. Click "Submit Review"
9. **Expected**: Success + moved to SME stage

#### 3. SME Technical Review
**User**: sme.team@xlsmart.co.id
1. Login ke sistem
2. Navigate: ATP Management → Review Dashboard
3. Verify: 1 pending review (same ATP)
4. Click "Review" button
5. Tab "Checklist": Evaluate items (2 Pass, 1 Fail)
6. Select Decision: "Approve with Punchlist"
7. Add Punchlist Item:
   - Description: "Sync interval configuration needs adjustment"
   - Severity: Major
   - Category: Configuration
8. Comments: "Technical review complete, minor rectification needed"
9. Click "Submit Review"
10. **Expected**: Success + punchlist created + moved to Head NOC

#### 4. Head NOC Final Approval
**User**: noc.head@xlsmart.co.id
1. Login ke sistem
2. Navigate: ATP Management → Review Dashboard
3. Verify: 1 pending review with punchlist indicator
4. Click "Review" button
5. Review punchlist items created by SME
6. Select Decision: "Approve with Punchlist"
7. Comments: "Final approval granted, proceed with rectification"
8. Click "Submit Review"
9. **Expected**: ATP approved with punchlist status

#### 5. Punchlist Rectification
**User**: admin@aviat.com (Field Engineer role)
1. Navigate: ATP Management → Punchlist Management
2. Verify: 1 active punchlist item
3. Click "Start Rectification"
4. Upload Before Evidence: config_before.jpg
5. Add Rectification Notes: "Changed sync interval from 60s to 30s"
6. Upload After Evidence: config_after.jpg
7. Click "Complete Rectification"
8. **Expected**: Punchlist item marked as completed

---

## 🎯 Skenario 2: ATP Rejection Flow

### Journey Steps:

#### 1. Vendor Submits Poor Quality ATP
**User**: admin@aviat.com
1. Submit ATP with incomplete information
2. **Expected**: ATP enters review workflow

#### 2. Business Operations Rejects
**User**: business.ops@xlsmart.co.id
1. Review ATP document
2. Find critical issues in checklist
3. Select Decision: "Reject"
4. Comments: "Critical items failed - requires complete resubmission"
5. **Expected**: ATP status = "rejected", workflow stops

---

## 🎯 Skenario 3: Hardware ATP Flow

### Journey Steps:

#### 1. Vendor Submits Hardware ATP
**User**: admin@aviat.com
1. Select Template: Hardware ATP Template
2. Submit document
3. **Expected**: Enters hardware workflow (FOP_RTS → REGION_TEAM → RTH)

#### 2. FOP/RTS Field Review
**User**: fop.rts@xlsmart.co.id / test123
1. Review hardware checklist items
2. Approve with minor punchlist
3. **Expected**: Moves to Region Team

#### 3. Region Team Review
**User**: region.team@xlsmart.co.id / test123
1. Review regional compliance
2. Approve
3. **Expected**: Moves to RTH

#### 4. RTH Final Approval
**User**: rth.head@xlsmart.co.id / test123
1. Final hardware approval
2. **Expected**: ATP fully approved

---

## 🎯 Skenario 4: Critical Punchlist Flow

### Journey Steps:

#### 1. SME Creates Critical Punchlist
**User**: sme.team@xlsmart.co.id
1. During review, mark critical item as "Fail"
2. Create punchlist with severity: "Critical"
3. Select Decision: "Approve with Punchlist"
4. **Expected**: ATP approved but requires mandatory rectification

#### 2. Field Team Rectification
**User**: admin@aviat.com
1. Access critical punchlist item
2. Complete rectification with evidence
3. **Expected**: System validates critical item completion

---

## 🎯 Skenario 5: SLA Violation Testing

### Journey Steps:

#### 1. Create Overdue Review
1. Submit ATP
2. Wait for SLA deadline to pass (or modify database)
3. Check SLA violations endpoint:
   ```bash
   curl "http://localhost:3011/api/v1/atp/sla/violations"
   ```
4. **Expected**: Overdue items detected

---

## 📊 Test Data Validation

### After Each Scenario, Verify:

#### Database State:
```sql
-- Check ATP status
SELECT atp_code, current_status, current_stage, completion_percentage 
FROM atp_documents ORDER BY created_at DESC LIMIT 5;

-- Check review stages
SELECT stage_name, review_status, decision, comments 
FROM atp_review_stages WHERE atp_id = 'YOUR_ATP_ID';

-- Check punchlist items
SELECT punchlist_number, issue_description, severity, status 
FROM atp_punchlist_items WHERE atp_id = 'YOUR_ATP_ID';
```

#### API Responses:
```bash
# Workflow status
curl "http://localhost:3011/api/v1/atp/YOUR_ATP_ID/workflow-status"

# Pending reviews by role
curl "http://localhost:3011/api/v1/atp/reviews/pending?role=BO"

# Review statistics
curl "http://localhost:3011/api/v1/atp/reviews/stats?role=SME"
```

---

## ✅ Success Criteria

### Skenario 1 (Complete Flow):
- [ ] ATP submitted successfully
- [ ] 3 review stages completed in sequence
- [ ] Punchlist created and resolved
- [ ] Final status: "approved"
- [ ] All audit trail preserved

### Skenario 2 (Rejection):
- [ ] ATP rejected at first stage
- [ ] Workflow stopped
- [ ] Status: "rejected"

### Skenario 3 (Hardware):
- [ ] Different workflow path (FOP_RTS → REGION_TEAM → RTH)
- [ ] Role-specific reviewers assigned
- [ ] Hardware-specific checklist items

### Skenario 4 (Critical Punchlist):
- [ ] Critical items flagged
- [ ] Mandatory rectification enforced
- [ ] Evidence validation

### Skenario 5 (SLA):
- [ ] Overdue items detected
- [ ] SLA violations reported
- [ ] Priority escalation

---

## 🚀 Execution Order

1. **Start with Skenario 1** (complete happy path)
2. **Test Skenario 2** (rejection handling)
3. **Verify Skenario 3** (hardware workflow)
4. **Validate Skenario 4** (critical issues)
5. **Monitor Skenario 5** (SLA compliance)

Each scenario builds understanding of the system and validates different aspects of the ATP approval workflow.