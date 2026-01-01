# 📊 CURRENT STATE ANALYSIS - Site Registration & Task Creation

**Date**: 2025-12-28
**Purpose**: Review existing implementation before adding enhancements

---

## ✅ YANG SUDAH ADA (COMPLETE)

### 1. Site Registration Flow ✅

**File**: `backend/src/routes/siteRegistrationRoutes.js`

**Flow**:
```
User submits site registration form
    ↓
POST /api/v1/site-registration/register
    ├─ Validate: Site ID, Name, GPS coordinates
    ├─ Create: site_registrations record
    ├─ Auto-assign: Document controller (by region)
    └─ Auto-create: ATP tasks (Software + Hardware)
    ↓
Response: { site, atpTasks, assignedController }
```

**Auto-Task Creation** (lines 111-146):
```javascript
// Software ATP Task
if (atpRequirements?.software) {
  task.create({
    taskCode: `ATP-SW-${customerSiteId}-001`,
    taskType: 'ATP_SOFTWARE',
    title: `Software ATP Task - ${customerSiteId}`,
    assignedTo: assignedController,  // DocCtrl_EastJava, etc.
    relatedSiteId: site.id,
    dueDate: +7 days
  })
}

// Hardware ATP Task
if (atpRequirements?.hardware) {
  task.create({
    taskCode: `ATP-HW-${customerSiteId}-001`,
    taskType: 'ATP_HARDWARE',
    title: `Hardware ATP Task - ${customerSiteId}`,
    assignedTo: assignedController,
    relatedSiteId: site.id,
    dueDate: +7 days
  })
}
```

**Result**: ✅ **Site Registration → Auto-Create ATP Tasks = WORKING**

---

### 2. Single ATP Upload ✅

**File**: `backend/src/routes/atpUploadRoutes.js`

**Flow**:
```
User uploads ATP document for task
    ↓
POST /api/v1/atp/upload
    ├─ Auto-categorize: Filename analysis
    ├─ Determine category: SOFTWARE/HARDWARE
    ├─ Create: atp_documents record
    ├─ Auto-init: Workflow stages (BO/SME/HEAD_NOC or FOP_RTS/REGION_TEAM/RTH)
    └─ Update: Task status → 'in_review'
    ↓
Response: { atpDocument, categorization, workflow }
```

**Result**: ✅ **Single Upload with Auto-Categorization = WORKING**

---

## ❌ YANG BELUM ADA (TO IMPLEMENT)

### 1. Word to PDF Conversion ❌

**Current**: Only accepts PDF
**Need**: Auto-convert .doc/.docx to PDF

**Implementation**:
```javascript
// Install: npm install libreoffice-convert

const convertWordToPDF = async (filePath) => {
  const libre = require('libreoffice-convert');
  const outputPath = filePath.replace(/\.(doc|docx)$/, '.pdf');

  await libre.convert(filePath, outputPath, {
    format: 'pdf'
  });

  return outputPath;
};
```

---

### 2. Bulk ATP Upload with Site Assignment ❌

**Current**: Only single upload per task
**Need**: Bulk upload dengan auto-assignment ke sites/tasks

**User Workflow**:
```
1. Doc Control clicks "Bulk Upload ATP Documents"
2. Upload ZIP/Excel with multiple ATP documents
3. System extracts files
4. For each file:
   ├─ Detect site code from filename
   ├─ Find corresponding task
   ├─ Upload ATP document
   ├─ Auto-categorize
   └─ Auto-init workflow
5. Return summary: X success, Y failed
```

**Implementation Needed**:
```javascript
router.post('/bulk-upload', upload.single('archive'), async (req, res) => {
  const { site_id } = req.body; // Optional: default site
  const archive = req.file; // ZIP or Excel file

  // Extract files from ZIP/Excel
  const files = await extractArchive(archive);

  const results = [];

  for (const file of files) {
    // Detect site code from filename
    // Format: ATP-SW-SITE001-001.docx
    const siteCode = extractSiteCode(file.originalname);
    const taskType = extractTaskType(file.originalname);

    // Find task
    const task = await prisma.task.findFirst({
      where: {
        sites: { site_id: siteCode },
        taskType: taskType
      }
    });

    if (task) {
      // Convert to PDF if needed
      const pdfPath = await convertWordToPDF(file.path);

      // Upload
      const result = await uploadATPDocument(pdfPath, task);
      results.push({ success: true, file: file.originalname, task: task.taskCode });
    } else {
      results.push({ success: false, file: file.originalname, error: 'Task not found' });
    }
  }

  res.json({ success: true, results });
});
```

---

### 3. Task List UI - Upload Action Button ❌

**Current**: Generic "more" button
**Need**: Explicit "Upload ATP Document" button per task

**Current UI**:
```
┌────────────────────────────────────────┐
│ Task Code     | Site   | Status | Action│
│ ATP-SW-...001 | SITE-123 | Pending│ [⋯]   │
└────────────────────────────────────────┘
```

**Needed UI**:
```
┌──────────────────────────────────────────────────────────┐
│ Task Code       | Site   | Status  | ATP Status | Action │
│ ATP-SW-...001   | SITE-123| Pending│ Not Uploaded│ [📤 Upload] │
│ ATP-HW-...002   | SITE-456| In Review| Uploaded   │ [✓ View]    │
└──────────────────────────────────────────────────────────┘
```

**Implementation**: Update `frontend/src/components/TaskManagement/TaskList.tsx`

---

## 📋 IMPLEMENTATION PLAN

### Priority 1: Word to PDF Conversion (CRITICAL)

**Why**: User upload Word docs, need auto-convert

**Steps**:
1. Install `libreoffice-convert` ✅ DONE
2. Create conversion utility
3. Integrate with upload endpoint
4. Test with .docx file

**Effort**: 2-3 hours

---

### Priority 2: Task List Upload Button (HIGH)

**Why**: User tidak tahu cara upload ATP untuk task

**Steps**:
1. Update TaskList.tsx
2. Add "Upload ATP" button
3. Show upload status indicator
4. Link to upload modal

**Effort**: 1-2 hours

---

### Priority 3: Bulk Upload (MEDIUM)

**Why**: Efisiensi - upload banyak dokumen sekaligus

**Steps**:
1. Create bulk upload endpoint
2. Create frontend bulk upload UI
3. Add progress indicator
4. Handle errors gracefully

**Effort**: 3-4 hours

---

## 🎯 RECOMMENDED NEXT STEP

Berdasarkan requirement Anda, priority yang paling penting adalah:

### **Option A**: Implement Semua (Full Implementation)
1. Word to PDF conversion (2 jam)
2. Task list upload button (1 jam)
3. Bulk upload dengan site assignment (3 jam)
**Total**: ~6 jam

### **Option B**: Priority Implementation Only
1. Word to PDF conversion (2 jam) ← CRITICAL
2. Task list upload button (1 jam) ← HIGH
**Total**: ~3 jam

### **Option C**: Review Dulu
- Kita cek flow yang sudah ada
- Diskusikan priority
- Baru implementasi

---

## ❓ PERTANYAAN

Sebelum lanjut implementasi, saya mau konfirmasi:

1. **Word to PDF conversion** - Priority berapa? (CRITICAL karena user pakai Word)
2. **Bulk upload** - Mendesak atau bisa nanti?
3. **Task list button** - Perlu segera atau bisa pakai flow yang ada dulu?

Mohon arahan Anda supaya saya prioritaskan dengan tepat! 🙏
