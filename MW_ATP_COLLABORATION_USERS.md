# 🧪 MW ATP COLLABORATION TESTING USERS

## 🏢 PT AVIAT (Internal)
```
📧 admin@aviat.com
🔑 Admin123!
👤 System Administrator
🎯 Role: admin (Full System Access)

📧 doc.control@aviat.com  
🔑 test123
👤 Document Control
🎯 Role: DOC_CONTROL (ATP Upload Management)
```

## 🏢 PT XLSMART (Customer Approvers)

### SOFTWARE ATP FLOW: BO → SME → HEAD_NOC
```
📧 business.ops@xlsmart.co.id
🔑 test123
👤 Business Operations
🎯 Role: BO (Software ATP Review L1)

📧 sme.team@xlsmart.co.id
🔑 test123  
👤 SME Team
🎯 Role: SME (Software ATP Review L2)

📧 noc.head@xlsmart.co.id
🔑 test123
👤 Head NOC
🎯 Role: HEAD_NOC (Software ATP Final Approval)
```

### HARDWARE ATP FLOW: FOP_RTS → REGION_TEAM → RTH
```
📧 fop.rts@xlsmart.co.id
🔑 test123
👤 FOP RTS
🎯 Role: FOP_RTS (Hardware ATP Review L1)

📧 region.team@xlsmart.co.id
🔑 test123
👤 Region Team  
🎯 Role: REGION_TEAM (Hardware ATP Review L2)

📧 rth.head@xlsmart.co.id
🔑 test123
👤 RTH Head
🎯 Role: RTH (Hardware ATP Final Approval)
```

## 🏭 EXTERNAL VENDORS
```
📧 vendor.zte@gmail.com
🔑 test123
👤 ZTE Vendor
🎯 Role: VENDOR (General ATP Upload)

📧 vendor.hti@gmail.com
🔑 test123
👤 HTI Vendor  
🎯 Role: VENDOR (General ATP Upload)

📧 mw.vendor@gmail.com
🔑 test123
👤 MW Vendor Engineer
🎯 Role: VENDOR_MW (MW ATP Upload)
```

## 🚀 MW ATP TESTING SCENARIOS

### 1️⃣ MW INSTALLATION ATP (Hardware Flow)
```
Step 1: mw.vendor@gmail.com
       → Login & Upload MW Installation ATP
       → Fill 8-section MW form
       → Upload photos, configs, test reports

Step 2: fop.rts@xlsmart.co.id  
       → Review MW installation details
       → Check technical specifications
       → Approve/Request changes

Step 3: region.team@xlsmart.co.id
       → Regional validation
       → Performance verification  
       → Approve/Request changes

Step 4: rth.head@xlsmart.co.id
       → Final hardware approval
       → System integration confirmation
       → Complete ATP process
```

### 2️⃣ MW UPGRADE ATP (Software Flow)
```
Step 1: mw.vendor@gmail.com
       → Login & Upload MW Upgrade ATP
       → Fill 6-section upgrade form
       → Upload before/after configs

Step 2: business.ops@xlsmart.co.id
       → Business impact review
       → Upgrade justification check
       → Approve/Request changes

Step 3: sme.team@xlsmart.co.id  
       → Technical validation
       → Performance improvement verification
       → Approve/Request changes

Step 4: noc.head@xlsmart.co.id
       → Final software approval
       → Network operations clearance
       → Complete ATP process
```

## 🎯 TESTING FEATURES

### MW-Specific Validations
- ✅ Fade margin ≥ 20dB
- ✅ Link availability ≥ 99.9%
- ✅ Frequency separation ≥ 100MHz
- ✅ BER ≤ 10^-6

### Punchlist Scenarios
- ✅ Clean ATP (No issues)
- ✅ Minor Punchlist (Non-critical items)
- ✅ Critical Punchlist (Must fix before approval)

### File Management
- ✅ Installation photos
- ✅ Configuration backups
- ✅ Test reports
- ✅ As-built documentation

## 🌐 ACCESS INFORMATION
```
Frontend: http://localhost:3000
Backend:  http://localhost:3011
Database: apms_local (PostgreSQL)
```

## 🔄 COLLABORATION WORKFLOW
```
1. MW Vendor uploads ATP with technical details
2. XLSmart team reviews in sequence (L1 → L2 → Final)
3. Punchlist items tracked and resolved
4. Final approval completes ATP process
5. System notifications sent to all stakeholders
```

**Ready for End-to-End MW ATP Collaboration Testing! 🎉**