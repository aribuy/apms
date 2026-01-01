# DOC CONTROL USER TESTING GUIDE

**Date**: 2025-12-28
**Purpose**: Step-by-step guide for testing Doc Control workflow through UI
**Workflow**: Site Registration → Auto-create ATP Tasks → Upload Documents (Single & Bulk)

---

## 📋 PREREQUISITES

### 1. Database Setup

Sebelum testing, pastikan database sudah siap:

```bash
# Masuk ke backend directory
cd backend

# Generate Prisma Client
npx prisma generate

# Run migrations (jika perlu)
npx prisma migrate dev

# Atau reset database (untuk testing)
npx prisma migrate reset
```

### 2. Start Backend Server

```bash
cd backend
npm start
```

Backend akan berjalan di `http://localhost:3011`

### 3. Start Frontend Development Server

```bash
cd frontend
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

---

## 🧪 TEST SCENARIOS

### Scenario 1: Site Registration → Auto-create ATP Tasks

**Tujuan**: Test apakah site registration otomatis membuat ATP tasks

**Steps**:

1. **Login sebagai Doc Control**
   - Buka `http://localhost:5173`
   - Login dengan role Doc Control / Admin

2. **Navigasi ke Site Registration**
   - Klik menu "Site Registration" di sidebar
   - Klik tombol "Register New Site"

3. **Isi Form Site Registration**
   ```javascript
   Customer Site ID: TEST-SITE-001
   Customer Site Name: Test Site Surabaya
   NE Tower ID: NE-TWR-001
   NE Tower Name: NE Tower
   FE Tower ID: FE-TWR-001
   FE Tower Name: FE Tower
   NE Latitude: -7.2575
   NE Longitude: 112.7521
   FE Latitude: -7.2675
   FE Longitude: 112.7621
   Region: East Java
   Coverage Area: Urban
   Activity Flow: MW Upgrade
   SOW Category: Deployment
   Project Code: PRJ-001
   Frequency Band: 18GHz
   Link Capacity: 512Mbps
   Antenna Size: 0.6m
   Equipment Type: AVIAT
   ```

4. **ATP Requirements**
   - Checklist: ✅ Software ATP
   - Checklist: ✅ Hardware ATP

5. **Submit Registration**
   - Klik tombol "Register Site"
   - Tunggu proses selesai

**Expected Result**:
- ✅ Site berhasil diregister
- ✅ 2 ATP tasks otomatis dibuat:
  - `ATP-SW-TEST-SITE-001-001` (Software ATP)
  - `ATP-HW-TEST-SITE-001-001` (Hardware ATP)
- ✅ Tasks assigned ke Doc Controller untuk region East Java
- ✅ Task status = "pending"
- ✅ Due date = 7 hari dari sekarang

**Verification**:
```javascript
1. Cek di Site Registration list → Site muncul dengan status "Active"
2. Cek di Task Management → 2 tasks baru muncul untuk site tersebut
3. Klik salah satu task → Detail menampilkan task info
```

---

### Scenario 2: Single ATP Document Upload

**Tujuan**: Test upload ATP document ke single task dengan auto-categorization

**Steps**:

1. **Navigasi ke Task Management**
   - Klik menu "Task Management" di sidebar
   - Filter by status: "Pending"

2. **Pilih Task untuk Upload**
   - Cari task dengan type "ATP_SOFTWARE" atau "ATP_HARDWARE"
   - Klik tombol **"Perform"** di kolom Actions

3. **Upload Modal akan Muncul**
   - Menampilkan task info
   - Cek apakah ada dokument sebelumnya (jika user pernah upload)
   - Tombol "Choose File"

4. **Upload PDF Document**
   - Klik "Choose File"
   - Pilih file PDF ATP (contoh: `XLSmart MW ATP (SW Lincense...).pdf`)
   - Klik "Upload Document"

5. **System akan**:
   - ✅ Convert Word to PDF (jika file .doc/.docx)
   - ✅ Auto-categorize (Software/Hardware)
   - ✅ Initialize workflow stages
   - ✅ Update task status ke "in_review"

**Expected Result**:
```json
{
  "success": true,
  "message": "Document uploaded and workflow initialized",
  "data": {
    "atpDocument": {
      "atp_code": "ATP-TEST-SITE-001-1735394800000",
      "category": "SOFTWARE",
      "status": "pending_review"
    },
    "categorization": {
      "category": "SOFTWARE",
      "confidence": 0.95,
      "method": "filename_analysis"
    },
    "workflow": {
      "initialized": true,
      "stagesCreated": 3,
      "category": "SOFTWARE"
    }
  }
}
```

**Verification**:
1. Task status berubah ke "in_progress" atau "in_review"
2. Tombol di Actions column berubah:
   - "View" button → untuk melihat dokumen
   - "Submit" button → untuk submit review
3. Cek database → ATP document record dibuat
4. Cek database → Review stages dibuat (3 stages untuk Software)

---

### Scenario 3: Word to PDF Conversion

**Tujuan**: Test upload Word document yang otomatis di-convert ke PDF

**Steps**:

1. **Prepare Word Document**
   - Buat Word document (.docx) dengan content ATP
   - Simpan dengan nama: `ATP-Test-Site001.docx`

2. **Upload Word Document**
   - Ikuti langkah di Scenario 2
   - Upload file .docx (bukan PDF)

3. **System akan**:
   - ✅ Detect Word format
   - ✅ Convert to PDF menggunakan LibreOffice
   - ✅ Simpan PDF sebagai final document
   - ✅ Delete original Word file
   - ✅ Lanjutkan ke categorization & workflow

**Expected Result**:
- ✅ Upload success
- ✅ Message: "Word document converted to PDF and workflow initialized"
- ✅ Response `"converted": true`
- ✅ File yang tersimpan adalah PDF (bukan .docx)

**Note**:
- Pastikan LibreOffice terinstall:
  ```bash
  # macOS
  brew install --cask libreoffice

  # Ubuntu/Debian
  sudo apt-get install libreoffice
  ```

---

### Scenario 4: Bulk Upload ATP Documents

**Tujuan**: Test upload banyak dokumen sekaligus ke multiple tasks

**Steps**:

1. **Navigasi ke Task Management**
   - Klik menu "Task Management"
   - Klik tombol **"Bulk Upload"** di bagian atas

2. **Bulk Upload Modal akan Muncul**
   - Daftar semua pending tasks
   - Checkboxes untuk memilih multiple tasks
   - File input untuk upload documents

3. **Select Multiple Tasks**
   - Checklist tasks yang akan di-upload
   - Atau klik "Select All"

4. **Upload Documents**
   - Klik "Choose Files"
   - Select multiple PDF files (atau ZIP archive jika fitur tersedia)
   - Klik "Upload Documents"

5. **System akan**:
   - ✅ Upload setiap file ke corresponding task
   - ✅ Auto-categorize per document
   - ✅ Initialize workflow per task
   - ✅ Update all task statuses

**Expected Result**:
```json
{
  "success": true,
  "message": "Bulk upload completed",
  "data": {
    "total": 5,
    "successful": 4,
    "failed": 1,
    "results": [
      {
        "task_code": "ATP-SW-SITE001-001",
        "file": "ATP-Site001.pdf",
        "status": "success",
        "atp_code": "ATP-SITE001-1234567890"
      },
      // ... more results
    ]
  }
}
```

**Verification**:
1. Cek Task Management list → Status tasks berubah ke "in_review"
2. Cek ATP Documents list → Semua documents muncul
3. Cek Workflow Stages → Semua stages initialized

---

### Scenario 5: Verify Workflow Stages

**Tujuan**: Test apakah workflow stages otomatis dibuat dengan SLA deadlines

**Steps**:

1. **Setelah Upload Complete**
   - Buka Task Management
   - Klik task yang sudah di-upload
   - Klik "View" untuk melihat dokumen

2. **Cek ATP Document Detail**
   - Scroll ke "Workflow Stages" section
   - System akan menampilkan:

**For Software ATP**:
```
Stage 1: BO (Business Ops)
  Status: PENDING
  Reviewer: business.ops@xlsmart.co.id
  SLA Deadline: [Now + 48 hours]

Stage 2: SME (SME Team)
  Status: PENDING
  Reviewer: sme.team@xlsmart.co.id
  SLA Deadline: [Now + 48 hours from submission]

Stage 3: HEAD_NOC
  Status: PENDING
  Reviewer: noc.head@xlsmart.co.id
  SLA Deadline: [Now + 24 hours from previous stage]
```

**For Hardware ATP**:
```
Stage 1: FOP_RTS
  Status: PENDING
  Reviewer: fop.rts@xlsmart.co.id
  SLA Deadline: [Now + 48 hours]

Stage 2: REGION_TEAM
  Status: PENDING
  Reviewer: region.team@xlsmart.co.id
  SLA Deadline: [Now + 48 hours]

Stage 3: RTH
  Status: PENDING
  Reviewer: rth.head@xlsmart.co.id
  SLA Deadline: [Now + 24 hours]
```

**Expected Result**:
- ✅ 3 workflow stages dibuat
- ✅ Reviewers assigned correctly
- ✅ SLA deadlines calculated properly
- ✅ Stage sequence correct (BO → SME → HEAD_NOC or FOP_RTS → REGION_TEAM → RTH)

---

## 🔍 VERIFICATION CHECKLIST

### After Each Test Scenario

Pastikan semua items berikut ✅:

**Site Registration**:
- [ ] Site record created in database
- [ ] Site ID is unique
- [ ] Coordinates are within Indonesia bounds
- [ ] Region is assigned correctly
- [ ] Status = "active"

**Auto-created Tasks**:
- [ ] Software task created (if required)
- [ ] Hardware task created (if required)
- [ ] Task codes follow format: `ATP-SW-{SITEID}-001`
- [ ] Assigned to correct Doc Controller (by region)
- [ ] Due date = 7 days from registration
- [ ] Status = "pending"

**Document Upload**:
- [ ] File uploaded successfully
- [ ] Word converted to PDF (if applicable)
- [ ] ATP document record created
- [ ] Category detected correctly (Software/Hardware)
- [ ] Workflow stages initialized
- [ ] Task status updated to "in_review"

**Workflow Stages**:
- [ ] Correct number of stages (3 for Software, 3 for Hardware)
- [ ] Stage names correct for category
- [ ] Reviewers assigned
- [ ] SLA deadlines calculated
- [ ] Stage sequence correct

---

## 🐛 TROUBLESHOOTING

### Issue: "Failed to register site"

**Possible Causes**:
1. Site ID already exists
2. Coordinates outside Indonesia bounds
3. Missing required fields

**Solutions**:
- Use unique Site ID
- Check coordinates: Lat (-11 to 6), Long (95 to 141)
- Fill all required fields

### Issue: "Failed to convert Word document to PDF"

**Possible Causes**:
1. LibreOffice not installed
2. Corrupted Word file
3. Insufficient permissions

**Solutions**:
```bash
# Install LibreOffice
brew install --cask libreoffice  # macOS
sudo apt-get install libreoffice  # Ubuntu

# Verify installation
libreoffice --version
```

### Issue: "Task not found" during upload

**Possible Causes**:
1. Task code doesn't match
2. Task was deleted
3. Database sync issue

**Solutions**:
- Verify task code in Task Management list
- Refresh page and try again
- Check server logs for errors

### Issue: "Categorization confidence low"

**Possible Causes**:
1. Filename doesn't contain clear indicators
2. Task type fallback not working

**Solutions**:
- This is expected for generic filenames
- System will use task type as fallback
- Still 100% accurate with fallback

---

## 📊 EXPECTED RESULTS SUMMARY

### Complete End-to-End Flow

```
1. User registers site
   ↓
2. System creates 2 ATP tasks (SW + HW)
   ↓
3. Tasks appear in Task Management
   ↓
4. Doc Control clicks "Perform" on Software task
   ↓
5. Upload modal opens
   ↓
6. User uploads Word/PDF document
   ↓
7. System converts Word to PDF (if needed)
   ↓
8. System auto-categorizes (95%+ confidence)
   ↓
9. System initializes workflow (3 stages)
   ↓
10. Task status → "in_review"
    ↓
11. Reviewers can now review document
```

---

## ✅ SUCCESS CRITERIA

Testing dianggap sukses jika:

1. **Site Registration**: 100% success rate
2. **Auto-task Creation**: 2 tasks created per site (SW + HW)
3. **Single Upload**: 100% success rate with correct categorization
4. **Word to PDF**: 100% conversion success (if LibreOffice installed)
5. **Bulk Upload**: ≥90% success rate
6. **Workflow Init**: 100% - 3 stages created per upload
7. **SLA Deadlines**: 100% calculated correctly
8. **Task Type Fallback**: 100% accuracy for generic filenames

---

## 📝 TEST REPORT TEMPLATE

Setelah testing selesai, isi template ini:

```markdown
## Test Execution Report

**Date**: [DATE]
**Tester**: [NAME]
**Environment**: [DEV/STAGING/PROD]

### Test Results

| Scenario | Status | Notes |
|----------|--------|-------|
| Site Registration | ✅/❌ | |
| Auto-create Tasks | ✅/❌ | |
| Single Upload (PDF) | ✅/❌ | |
| Word to PDF Conversion | ✅/❌ | |
| Bulk Upload | ✅/❌ | |
| Workflow Stages | ✅/❌ | |

### Issues Found

1. [Description]
   - Severity: [Low/Medium/High]
   - Steps to reproduce: [...]

### Screenshots

- [Attach screenshots]

### Overall Assessment

[PASS/FAIL]

### Recommendations

[Your suggestions]
```

---

**Document Version**: 1.0
**Last Updated**: 2025-12-28
**Ready for Testing**: ✅ YES
