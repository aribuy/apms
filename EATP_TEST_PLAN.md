# EATP Test Plan - Real World Scenarios

## 🎯 Test Objectives
- Validate EATP digital document management with realistic data
- Test role-based ATP workflows (Hardware & Software)
- Verify file upload and template functionality
- Performance testing with multiple sites and users

## 🏗️ Test Architecture

### Test Sites (5 Sites)
```
Jakarta Region:
├── JKT-001-TOWER    → Hardware ATP (Radio Installation)
├── JKT-002-OFFICE   → Software ATP (Network Management)  
└── JKT-003-HYBRID   → Hardware ATP (Rejection Test)

Surabaya Region:
├── SBY-001-REMOTE   → Hardware ATP (Quick Approval)
└── SBY-002-DATACENTER → Software ATP (Multi-attachment)
```

### Test Users (6 Roles)
```
Hardware Workflow: FOP_RTS → REGION_TEAM → RTH
├── field.engineer@telecore.com     (FOP_RTS)
├── region.supervisor@telecore.com  (REGION_TEAM)
└── hardware.manager@telecore.com   (RTH)

Software Workflow: BO → SME → HEAD_NOC  
├── business.ops@telecore.com       (BO)
├── technical.expert@telecore.com   (SME)
└── noc.head@telecore.com          (HEAD_NOC)
```

## 📋 Test Scenarios Matrix

| Test ID | Site | ATP Type | Scenario | Expected Flow | Test Focus |
|---------|------|----------|----------|---------------|------------|
| TC-001 | JKT-001 | Hardware | Normal Approval | FOP→REGION→RTH→Approved | Digital forms + workflow |
| TC-002 | JKT-002 | Software | With Punchlist | BO→SME→NOC→Approved* | Punchlist management |
| TC-003 | JKT-003 | Hardware | Rejection | FOP→Rejected | Error handling |
| TC-004 | SBY-001 | Hardware | Quick Approval | Auto-approve all stages | Performance test |
| TC-005 | SBY-002 | Software | Multi-attachment | BO→SME→NOC + Files | File upload limits |

## 🧪 Test Execution Plan

### Phase 1: Data Setup
```bash
# 1. Seed test data
node backend/seed-eatp-test-data.js

# Expected Output:
# ✅ 6 Test Users created
# ✅ 5 Test Sites created  
# ✅ 5 Test ATPs created
```

### Phase 2: API Testing
```bash
# 2. Run test scenarios
node test-eatp-scenarios.js

# Expected Tests:
# ✅ Template system validation
# ✅ Digital form data retrieval
# ✅ File upload functionality
# ✅ Role-based workflow simulation
# ✅ Performance metrics
```

### Phase 3: Manual Testing
1. **Frontend Integration**
   - Login as different users
   - Test DigitalFormBuilder component
   - Verify role-based access

2. **Workflow Testing**
   - Submit ATP as field engineer
   - Review as region supervisor
   - Final approval as hardware manager

## 📊 Success Criteria

### Functional Requirements
- ✅ All 5 test ATPs created successfully
- ✅ Templates load in <100ms
- ✅ File uploads support 50MB limit
- ✅ Role-based workflows function correctly
- ✅ Digital forms render from JSON schema

### Performance Requirements
- ✅ Template retrieval: <100ms
- ✅ Form data save: <200ms
- ✅ File upload: <5s for 10MB file
- ✅ Workflow transition: <300ms

### Data Integrity
- ✅ Form data stored as JSON
- ✅ File attachments linked correctly
- ✅ Workflow stages track properly
- ✅ User roles enforced

## 🔍 Test Data Details

### Sample Form Data (Hardware ATP)
```json
{
  "site_info": {
    "site_id": "JKT-001-TOWER",
    "site_name": "Jakarta Tower Site 001",
    "coordinates": {"lat": -6.2088, "lng": 106.8456}
  },
  "equipment": {
    "equipment_type": "Radio",
    "vendor": "Huawei", 
    "model": "RTN-950A"
  }
}
```

### Sample Form Data (Software ATP)
```json
{
  "software_info": {
    "software_version": "v2.1.5",
    "release_notes": "Network management system upgrade",
    "installation_method": "Remote"
  },
  "configuration": {
    "parameters": "SNMP enabled, monitoring configured"
  }
}
```

## 🚀 Execution Commands

### Quick Start
```bash
# 1. Start backend server
cd backend && npm start

# 2. Seed test data (run once)
node backend/seed-eatp-test-data.js

# 3. Run test scenarios
node test-eatp-scenarios.js

# 4. Start frontend for manual testing
cd frontend && npm start
```

### Test Validation
```bash
# Verify test data in database
psql "postgresql://endik@localhost:5432/apms_local" -c "
SELECT atp_code, site_id, final_category, current_status 
FROM atp_documents 
WHERE atp_code LIKE 'ATP-TEST%';"

# Check templates
curl http://localhost:3011/api/v1/documents/templates

# Check specific ATP
curl http://localhost:3011/api/v1/atp/[ATP_ID]
```

## 📈 Expected Results

### Test Coverage
- **Sites**: 5 realistic test sites across 2 regions
- **Users**: 6 role-based users covering all workflow stages  
- **ATPs**: 5 different scenarios (3 hardware, 2 software)
- **Files**: Multi-file upload testing with various types
- **Workflows**: Complete approval chains tested

### Performance Benchmarks
- Template loading: <100ms
- Form rendering: <200ms
- File upload: <5s per 10MB
- Workflow transitions: <300ms
- Database queries: <50ms average

This comprehensive test plan validates EATP functionality with realistic business scenarios and ensures production readiness.