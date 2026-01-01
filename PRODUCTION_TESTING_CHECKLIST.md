# 🧪 PRODUCTION TESTING CHECKLIST

**Server**: https://apms.datacodesolution.com
**Date**: 2025-12-28
**Purpose**: End-to-end testing of Word to PDF conversion and complete Doc Control workflow

---

## 🔐 LOGIN

1. Open browser: **https://apms.datacodesolution.com**
2. Login as **Doc Control** user
3. Verify dashboard loads successfully

**Expected**:
- ✅ Login successful
- ✅ Dashboard displayed
- ✅ No errors in console

---

## 📋 TEST SCENARIO 1: Site Registration → Auto-Create Tasks

### Step 1: Register New Site

1. Navigate to **Site Registration** menu
2. Click **"Register New Site"** button
3. Fill in the form:

```
Customer Site ID: PROD-TEST-001
Customer Site Name: Production Test Site Surabaya
NE Tower ID: NE-TWR-PROD-001
NE Tower Name: NE Tower Production
FE Tower ID: FE-TWR-PROD-001
FE Tower Name: FE Tower Production
NE Latitude: -7.2575
NE Longitude: 112.7521
FE Latitude: -7.2675
FE Longitude: 112.7621
Region: East Java
Coverage Area: Urban
Activity Flow: MW Upgrade
SOW Category: Deployment
Project Code: PRJ-PROD-001
Frequency Band: 18GHz
Link Capacity: 512Mbps
Antenna Size: 0.6m
Equipment Type: AVIAT
```

4. **ATP Requirements**:
   - ✅ Check **Software ATP**
   - ✅ Check **Hardware ATP**

5. Click **"Register Site"**

### Expected Results

**Form Response**:
- ✅ Success message: "Site registered successfully"
- ✅ Display created site information
- ✅ Display created ATP tasks

**Auto-Created Tasks**:
- ✅ Task 1: `ATP-SW-PROD-TEST-001-001` (Software ATP)
  - Type: ATP_SOFTWARE
  - Status: pending
  - Assigned to: DocCtrl_EastJava
  - Due date: +7 days

- ✅ Task 2: `ATP-HW-PROD-TEST-001-001` (Hardware ATP)
  - Type: ATP_HARDWARE
  - Status: pending
  - Assigned to: DocCtrl_EastJava
  - Due date: +7 days

### Verification Checklist

- [ ] Site appears in Site Registration list
- [ ] Site status is "Active"
- [ ] 2 tasks created for the site
- [ ] Tasks visible in Task Management
- [ ] Task codes follow correct format
- [ ] Tasks assigned to correct Doc Controller

---

## 📋 TEST SCENARIO 2: Single Upload - PDF Document

### Step 1: Navigate to Task Management

1. Click **"Task Management"** menu
2. Filter by status: **"Pending"**
3. Find the Software ATP task: `ATP-SW-PROD-TEST-001-001`

### Step 2: Upload PDF Document

1. Click **"Perform"** button in Actions column
2. Upload modal should open
3. Verify modal displays:
   - Task Code: ATP-SW-PROD-TEST-001-001
   - Task Type: ATP_SOFTWARE
   - Site ID: PROD-TEST-001
   - File upload area

4. Click **"Choose File"**
5. Select a PDF document (Software ATP)
6. Click **"Upload Document"**

### Expected Results

**Upload Process**:
- ✅ File uploads successfully
- ✅ Progress indicator shows
- ✅ Success message appears
- ✅ Modal closes

**Response Data** (check in browser console):
```json
{
  "success": true,
  "message": "Document uploaded and workflow initialized",
  "data": {
    "atpDocument": {
      "atp_code": "ATP-PROD-TEST-001-1735394800000",
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
    },
    "converted": false
  }
}
```

**Task Status Update**:
- ✅ Task status changes to "in_progress" or "in_review"
- ✅ Actions column changes:
  - "View" button appears (to see document)
  - "Submit" button appears (for final submission)

### Verification Checklist

- [ ] Document uploaded successfully
- [ ] Auto-categorization detected "SOFTWARE"
- [ ] Confidence score ≥ 0.90
- [ ] Workflow stages created (3 stages)
- [ ] Task status updated
- [ ] No errors in browser console (F12)

---

## 📋 TEST SCENARIO 3: Single Upload - Word Document (NEW FEATURE!)

### Step 1: Prepare Word Document

1. Create a test Word document (`.docx`)
2. Name it: `ATP-Software-Test.docx`
3. Add some content about Software ATP

### Step 2: Upload Word Document

1. Go to **Task Management**
2. Find the Hardware ATP task: `ATP-HW-PROD-TEST-001-001`
3. Click **"Perform"** button
4. Upload modal opens
5. Click **"Choose File"**
6. Select the **Word document** (.docx)
7. Click **"Upload Document"**

### Expected Results

**Conversion Process**:
- ✅ System detects Word format
- ✅ Shows "Converting to PDF..." message
- ✅ Waits for conversion (2-10 seconds)
- ✅ Conversion completes

**Upload Response**:
```json
{
  "success": true,
  "message": "Word document converted to PDF and workflow initialized",
  "data": {
    "atpDocument": {
      "atp_code": "ATP-PROD-TEST-001-1735394800000",
      "category": "HARDWARE",
      "status": "pending_review"
    },
    "categorization": {
      "category": "HARDWARE",
      "confidence": 0.95,
      "method": "filename_analysis"
    },
    "workflow": {
      "initialized": true,
      "stagesCreated": 3,
      "category": "HARDWARE"
    },
    "converted": true  // ← IMPORTANT: Shows Word was converted
  }
}
```

### Verification Checklist

- [ ] Word file accepted by system
- [ ] Conversion successful (check "converted": true)
- [� PDF file created from Word
- [ ] Auto-categorization works
- [ ] Workflow stages initialized
- [ ] Task status updated
- [ ] Original Word file deleted
- [ ] Only PDF remains in system

### Backend Logs Check

To verify conversion happened, SSH to server:

```bash
ssh root@31.97.220.37
pm2 logs apms-api --lines 50
```

Look for these log messages:
```
Word document detected. Converting to PDF...
=== Word to PDF Conversion Started ===
Input file: uploads/atp-documents/...
LibreOffice found via command: libreoffice
Conversion successful!
Output PDF: uploads/atp-documents/temp_conversion/...
Word document successfully converted to PDF: ...
=== Word to PDF Conversion Complete ===
```

---

## 📋 TEST SCENARIO 4: Bulk Upload - Multiple Documents

### Step 1: Prepare Test Files

Have ready:
- 2-3 PDF files (different ATP documents)
- Or 1 PDF + 1 Word document

### Step 2: Bulk Upload

1. Navigate to **Task Management**
2. Click **"Bulk Upload"** button (top of page)
3. Bulk Upload modal opens
4. **Select Multiple Tasks**:
   - Check the checkboxes next to pending tasks
   - Or click "Select All" if available

5. **Upload Multiple Files**:
   - Click **"Choose Files"**
   - Select multiple documents (PDF and/or Word)
   - Or select a ZIP archive if supported

6. Click **"Upload Documents"**

### Expected Results

**Bulk Upload Process**:
- ✅ Shows progress for each file
- ✅ Processes files sequentially
- ✅ Displays success/failure for each file
- ✅ Shows summary at the end

**Response Summary**:
```json
{
  "success": true,
  "message": "Bulk upload completed",
  "data": {
    "total": 3,
    "successful": 3,
    "failed": 0,
    "results": [
      {
        "task_code": "ATP-SW-PROD-TEST-001-001",
        "file": "ATP-Software.pdf",
        "success": true,
        "atp_code": "ATP-PROD-TEST-001-xxx"
      },
      {
        "task_code": "ATP-HW-PROD-TEST-001-001",
        "file": "ATP-Hardware.docx",
        "success": true,
        "converted": true,
        "atp_code": "ATP-PROD-TEST-001-yyy"
      }
    ]
  }
}
```

### Verification Checklist

- [ ] Multiple tasks selected
- [ ] Multiple files uploaded
- [ ] Each file processed correctly
- [ ] Word files converted to PDF
- [ ] PDF files processed directly
- [ ] Auto-categorization per document
- [ ] Workflow stages per document
- [ ] Success/failure summary accurate
- [ ] All task statuses updated

---

## 📋 TEST SCENARIO 5: Verify Workflow Stages

### Step 1: Check ATP Document Details

1. After upload, click **"View"** button on a task
2. Document detail modal opens
3. Scroll to **"Workflow Stages"** section

### Expected Results for Software ATP

**3 Stages Created**:

| Stage | Name | Status | Reviewer | SLA Deadline |
|-------|------|--------|----------|--------------|
| 1 | BO | PENDING | business.ops@xlsmart.co.id | +48 hours |
| 2 | SME | PENDING | sme.team@xlsmart.co.id | +48 hours |
| 3 | HEAD_NOC | PENDING | noc.head@xlsmart.co.id | +24 hours |

### Expected Results for Hardware ATP

**3 Stages Created**:

| Stage | Name | Status | Reviewer | SLA Deadline |
|-------|------|--------|----------|--------------|
| 1 | FOP_RTS | PENDING | fop.rts@xlsmart.co.id | +48 hours |
| 2 | REGION_TEAM | PENDING | region.team@xlsmart.co.id | +48 hours |
| 3 | RTH | PENDING | rth.head@xlsmart.co.id | +24 hours |

### Verification Checklist

- [ ] Workflow stages section visible
- [ ] Correct number of stages (3)
- [ ] Stage names correct for category
- [ ] All stages status = "PENDING"
- [ ] Reviewers assigned
- [ ] SLA deadlines calculated
- [ ] Dates are correct (current date + SLA hours)

---

## 📋 TEST SCENARIO 6: Edge Cases & Error Handling

### Test 6.1: Upload Non-ATP File

1. Try uploading an invalid file (e.g., .jpg, .png)
2. Expected: Rejected with error message

**Expected**:
- ✅ Error: "Only PDF and Word documents are allowed"
- ✅ No upload occurs

### Test 6.2: Upload Without Selecting File

1. Click "Upload Document" without choosing file
2. Expected: Validation error

**Expected**:
- ✅ Error: "No file uploaded"

### Test 6.3: Large File Upload

1. Try uploading a file > 25MB
2. Expected: Size limit error

**Expected**:
- ✅ Error: "File too large"
- ✅ Max size: 25MB

### Test 6.4: Corrupted Word File

1. Create/modify a .docx to be corrupted
2. Try uploading
3. Expected: Conversion error

**Expected**:
- ✅ Error: "Failed to convert Word document to PDF"
- ✅ Helpful error message

### Test 6.5: Generic Filename (Auto-Categorization Fallback)

1. Create Word/PDF named: `ATP-Doc.pdf` (no indicators)
2. Upload
3. Expected: Should use task type as fallback

**Expected**:
- ✅ Category matches task type
- ✅ Confidence may be lower but still works
- ✅ No errors

---

## 📊 TEST RESULTS SUMMARY

After completing all scenarios, fill in this table:

| Scenario | Status | Issues Found | Notes |
|----------|--------|--------------|-------|
| 1. Site Registration | ⬜ Pass / Fail | | |
| 2. Single Upload (PDF) | ⬜ Pass / Fail | | |
| 3. Single Upload (Word) | ⬜ Pass / Fail | | |
| 4. Bulk Upload | ⬜ Pass / Fail | | |
| 5. Workflow Stages | ⬜ Pass / Fail | | |
| 6.1 Invalid File | ⬜ Pass / Fail | | |
| 6.2 No File Selected | ⬜ Pass / Fail | | |
| 6.3 Large File | ⬜ Pass / Fail | | |
| 6.4 Corrupted File | ⬜ Pass / Fail | | |
| 6.5 Generic Filename | ⬜ Pass / Fail | | |

### Overall Assessment

- [ ] All critical features working
- [ ] Word to PDF conversion functional
- [ ] Auto-categorization accurate
- [ ] Bulk upload working
- [ ] Workflow stages correct
- [ ] No major errors
- [ ] Performance acceptable

---

## 🐛 BUG REPORTING

If any issues found, document here:

### Issue #1
- **Scenario**:
- **Expected**:
- **Actual**:
- **Steps to Reproduce**:
- **Screenshots**:
- **Console Errors**:

### Issue #2
- **Scenario**:
- **Expected**:
- **Actual**:
- **Steps to Reproduce**:
- **Screenshots**:
- **Console Errors**:

---

## 📸 SCREENSHOTS TO CAPTURE

Take screenshots of:

1. ✅ Site Registration form filled out
2. ✅ Site Registration success message with tasks
3. ✅ Task Management list showing new tasks
4. ✅ Upload modal for PDF upload
5. ✅ PDF upload success message
6. ✅ Upload modal for Word upload
7. ✅ Word upload success with "converted: true"
8. ✅ Task list after upload (status changed)
9. ✅ Document detail with workflow stages
10. ✅ Bulk upload modal
11. ✅ Bulk upload results summary
12. ✅ Any errors encountered

---

## 🔍 BROWSER CONSOLE CHECKING

### How to Check Console

1. Open browser (Chrome/Firefox)
2. Press **F12** (or right-click → Inspect)
3. Go to **Console** tab
4. Look for:
   - Red error messages
   - Failed network requests
   - JavaScript errors

### What to Look For

**Good Signs**:
- ✅ No red errors
- ✅ API requests return 200 OK
- ✅ Upload progress visible

**Bad Signs**:
- ❌ 500 Internal Server Error
- ❌ 404 Not Found
- ❌ Network timeout
- ❌ JavaScript errors
- ❌ CORS errors

### Example Good Console Log

```
✅ POST /api/v1/site-registration/register 200 OK
✅ POST /api/v1/atp/upload 200 OK
✅ Document uploaded successfully
✅ Workflow initialized
```

### Example Bad Console Log

```
❌ POST /api/v1/atp/upload 500 Internal Server Error
❌ Failed to convert Word document
❌ Error: Cannot find module '../utils/documentConverter'
```

---

## ✅ FINAL CHECKLIST

Before finishing testing:

- [ ] All test scenarios completed
- [ ] Screenshots captured
- [ ] Console logs checked
- [ ] Backend logs checked (SSH to server)
- [ ] Test results summary filled
- [ ] Issues documented (if any)
- [ ] Overall assessment completed

---

## 📝 TESTER NOTES

Use this section for additional notes:

```
Date/Time of testing:
Tester Name:
Browser used:
Test environment: Production

Notes:
-



















Issues found:
-



















Recommendations:
-




```

---

**Testing Guide Version**: 1.0
**Last Updated**: 2025-12-28
**Production URL**: https://apms.datacodesolution.com
