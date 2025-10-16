# 🧪 Complete Workflow Test Guide

## 📋 Test Scenario: Site Registration → ATP Upload → Approval Flow

### 🎯 **Test Users Created:**

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| **Site Management** |
| System Admin | admin@apms.com | Admin123! | Site registration, system admin |
| Site Manager | site.manager@apms.com | test123 | Site management |
| **ATP Upload** |
| Vendor Admin | vendor.admin@apms.com | test123 | Upload ATP documents |
| Vendor Staff | vendor.staff@apms.com | test123 | Upload ATP documents |
| **Hardware ATP Review** |
| Field Engineer | field.engineer@apms.com | test123 | Stage 1: Field review |
| Regional Supervisor | region.supervisor@apms.com | test123 | Stage 2: Regional review |
| Hardware Manager | hardware.manager@apms.com | test123 | Stage 3: Final approval |
| **Software ATP Review** |
| Business Operations | business.ops@apms.com | test123 | Stage 1: Business review |
| Technical Expert | technical.expert@apms.com | test123 | Stage 2: Technical review |
| NOC Head | noc.head@apms.com | test123 | Stage 3: Final approval |

## 🔄 **Complete Test Workflow:**

### **Phase 1: Site Registration**
1. **Login as Admin** (`admin@apms.com`)
   - Go to Site Management
   - Test manual site registration
   - Test bulk upload via CSV

2. **Expected Sites to Create:**
   ```
   JKT-001-TOWER (Hardware ATP test)
   JKT-002-OFFICE (Software ATP test)
   SBY-001-REMOTE (Hardware ATP test)
   BDG-001-DATACENTER (Software ATP test)
   ```

### **Phase 2: ATP Document Upload**
3. **Login as Vendor Admin** (`vendor.admin@apms.com`)
   - Go to ATP Management → Upload tab
   - Upload Hardware ATP for JKT-001-TOWER
   - Upload Software ATP for JKT-002-OFFICE

4. **Login as Vendor Staff** (`vendor.staff@apms.com`)
   - Upload Hardware ATP for SBY-001-REMOTE
   - Upload Software ATP for BDG-001-DATACENTER

### **Phase 3: Hardware ATP Approval Flow**
5. **Login as Field Engineer** (`field.engineer@apms.com`)
   - Go to ATP Management → Review tab
   - Review Hardware ATPs (JKT-001, SBY-001)
   - Test: Approve one, Reject one

6. **Login as Regional Supervisor** (`region.supervisor@apms.com`)
   - Review approved Hardware ATP from Stage 1
   - Test: Approve with punchlist

7. **Login as Hardware Manager** (`hardware.manager@apms.com`)
   - Final approval of Hardware ATP
   - Test: Final approve

### **Phase 4: Software ATP Approval Flow**
8. **Login as Business Operations** (`business.ops@apms.com`)
   - Review Software ATPs (JKT-002, BDG-001)
   - Test: Approve both

9. **Login as Technical Expert** (`technical.expert@apms.com`)
   - Review approved Software ATPs
   - Test: Approve one, Request changes on another

10. **Login as NOC Head** (`noc.head@apms.com`)
    - Final approval of Software ATPs
    - Test: Complete approval workflow

## 🎯 **Expected Test Results:**

### ✅ **Success Criteria:**
- [ ] Sites created successfully (manual & bulk)
- [ ] Only vendor roles can upload ATP
- [ ] Only designated reviewers can review
- [ ] Hardware workflow: FOP_RTS → REGION_TEAM → RTH
- [ ] Software workflow: BO → SME → HEAD_NOC
- [ ] Rejected ATPs stop workflow
- [ ] Approved ATPs progress through stages
- [ ] Final approval completes workflow

### 📊 **Test Tracking:**
- [ ] Manual site registration
- [ ] Bulk site upload
- [ ] Hardware ATP upload (2 sites)
- [ ] Software ATP upload (2 sites)
- [ ] Hardware approval flow (3 stages)
- [ ] Software approval flow (3 stages)
- [ ] Rejection handling
- [ ] Punchlist creation
- [ ] Final approval completion

## 🚀 **Quick Start Commands:**

```bash
# 1. Verify users created
psql "postgresql://endik@localhost:5432/apms_local" -c "
SELECT name, email, role FROM users 
WHERE email LIKE '%@apms.com%' 
ORDER BY role;"

# 2. Start testing
# Frontend: http://localhost:3000
# Backend: http://localhost:3011

# 3. Test login for each user
# Use password: Admin123! for admin, test123 for others
```

## 📝 **Test Notes:**
- Each user should only see their permitted modules
- Upload/Review tabs should show/hide based on role
- Workflow should progress automatically between stages
- All actions should be tracked in database

**Ready for complete end-to-end testing!**