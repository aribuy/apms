# 🌐 Cara Cek di UI Website - Verification Guide

**Date:** 2025-12-29
**Environment:** Production (apms.datacodesolution.com) & Staging (apmsstaging.datacodesolution.com)
**Purpose:** Verifikasi bahwa sistem dengan FK constraints sudah berjalan dengan baik

---

## 🔗 Akses Website

### Production Environment
**URL:** https://apms.datacodesolution.com

### Staging Environment
**URL:** https://apmsstaging.datacodesolution.com

---

## ✅ Langkah-langkah Verifikasi

### 1. Cek Service Health (Health Check)

**Production:**
```bash
curl https://apms.datacodesolution.com/health
```

**Staging:**
```bash
curl https://apmsstaging.datacodesolution.com/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-29T04:00:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

---

### 2. Login ke Aplikasi

**Step-by-step:**

1. **Buka browser:** Chrome/Firefox/Edge
2. **Navigate ke:** https://apms.datacodesolution.com (production) atau https://apmsstaging.datacodesolution.com (staging)
3. **Halaman Login akan muncul**

**Test Accounts:**
```
Email: admin@telecore.com
Password: [your password]
```

Atau gunakan account lain yang tersedia:
- superadmin@apms.com
- manager@telecore.com
- vendor1@example.com
- tower1@example.com

4. **Click "Login" atau "Sign In"**

---

### 3. Verifikasi Task Management (Fitur yang sudah diperbaiki)

**Setelah login:**

1. **Navigate ke Task Management**
   - Cari menu "Tasks" atau "Task Management" di sidebar
   - Click untuk membuka halaman Task List

2. **Cek tab navigasi:**
   - **"All Tasks"** - Harus menampilkan semua tasks
   - **"Pending Tasks"** - Harus menampilkan tasks milik user yang login

3. **Verifikasi data muncul:**
   - ✅ Tasks list tidak blank
   - ✅ Data ditampilkan dengan benar
   - ✅ Filter antara "All Tasks" dan "Pending Tasks" berfungsi

4. **Cek kolom yang ditampilkan:**
   - Task ID
   - Site Name
   - Task Type
   - Status
   - Assigned To
   - Created Date
   - Actions (buttons)

**Screenshot Checklist:**
- [ ] Task list terlihat (tidak blank)
- [ ] Tab "All Tasks" berfungsi
- [ ] Tab "Pending Tasks" berfungsi
- [ ] Data loading dengan benar
- [ ] Tidak ada error di console browser (Tekan F12 → Console tab)

---

### 4. Verifikasi ATP Management

**Jika ada fitur ATP (Acceptance Test Procedure):**

1. **Navigate ke ATP Management**
   - Cari menu "ATP" atau "ATP Management"

2. **Cek fitur yang tersedia:**
   - ATP Scope Master
   - Vendor Master
   - Approval Policies
   - Workflow Instances
   - ATP Submissions

3. **Test Create ATP Workflow:**
   - Click "Create Workflow" atau "New ATP"
   - Isi form yang tersedia
   - Click "Submit"

4. **Verifikasi:**
   - ✅ Form validation bekerja
   - ✅ Data tersimpan dengan benar
   - ✅ Tidak ada error "Invalid reference" atau "FK violation"

---

### 5. Verifikasi Workspace Management

**Jika ada fitur Workspace:**

1. **Navigate ke Workspace**
   - Cari menu "Workspaces" atau "Sites"

2. **Cek workspace list:**
   - ✅ Workspace "XLSMART-AVIAT" (di staging)
   - ✅ Data workspace ditampilkan lengkap

3. **Test Create Workspace:**
   - Click "New Workspace"
   - Isi form:
     - Workspace Code
     - Workspace Name
     - Customer Group
     - Vendor Owner
   - Click "Save"

4. **Verifikasi:**
   - ✅ Workspace berhasil dibuat
   - ✅ Tidak ada error FK violation
   - ✅ Workspace muncul di list

---

### 6. Cek Error di Browser Console

**Cara cek:**

1. **Open Developer Tools:**
   - Windows/Linux: Press `F12` atau `Ctrl + Shift + I`
   - Mac: Press `Cmd + Option + I`

2. **Navigate ke "Console" tab**

3. **Cari error:**
   - ❌ Error FK violation:
     ```
     PrismaKnownError: Foreign key constraint failed
     ```
   - ❌ Error network:
     ```
     Failed to fetch
     Network error
     ```
   - ✅ Expected: Tidak ada error merah

4. **Cek API requests:**
   - Navigate ke "Network" tab
   - Filter by "XHR" atau "Fetch"
   - Cek response dari API endpoints:
     - `/api/v1/tasks`
     - `/api/v1/workspaces`
     - `/api/v1/workflow-instances`

**Expected Response:** Status `200 OK` dengan data JSON

---

## 🧪 Test Scenarios

### Scenario 1: Test Create Workflow dengan Invalid Config

**Tujuan:** Verifikasi FK constraint mencegah invalid reference

1. **Buka Developer Tools** (F12)
2. **Navigate ke Console tab**
3. **Coba buat workflow dengan config_id yang invalid**
   - Ini bisa dilakukan via API call manual di Console:
   ```javascript
   fetch('https://apms.datacodesolution.com/api/v1/workflow-instances', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer YOUR_TOKEN'
     },
     body: JSON.stringify({
       workspaceId: 'valid-workspace-id',
       configVersionId: 'invalid-config-id-that-does-not-exist',
       siteId: 'TEST-SITE',
       scopeId: 'valid-scope-id',
       atpCategory: 'HARDWARE'
     })
   })
   ```

4. **Expected Result:**
   - ❌ Error response: `400 Bad Request` atau `500 Internal Server Error`
   - ❌ Error message: "Foreign key constraint" atau "Invalid reference"
   - ✅ **Ini GOOD** - FK constraint bekerja mencegah invalid data

---

### Scenario 2: Test Create Valid Workflow

**Tujuan:** Verifikasi sistem bekerja normal untuk valid data

1. **Navigate ke ATP Management**
2. **Click "Create Workflow"**
3. **Isi form dengan data VALID:**
   - Pilih workspace yang tersedia
   - Pilih config version yang ACTIVE
   - Pilih scope yang ada
   - Isi site ID
4. **Click "Submit"**

5. **Expected Result:**
   - ✅ Workflow berhasil dibuat
   - ✅ Success message muncul
   - ✅ Workflow muncul di list
   - ✅ Tidak ada error di console

---

### Scenario 3: Test Delete Config yang sedang digunakan

**Tujuan:** Verifikasi FK constraint mencegah hapus config yang referenced

1. **Navigate ke Config Versions**
2. **Cari config dengan status ACTIVE**
3. **Coba hapus config yang sedang digunakan oleh workflow**
4. **Expected Result:**
   - ❌ Error: "Cannot delete" atau "Foreign key constraint"
   - ✅ **Ini GOOD** - Freeze-by-reference bekerja

---

## 📊 Verification Checklist

### Production (apms.datacodesolution.com)

- [ ] Website accessible
- [ ] Login successful
- [ ] Task Management tidak blank
- [ ] "All Tasks" tab berfungsi
- [ ] "Pending Tasks" tab berfungsi
- [ ] Tidak ada error di browser console
- [ ] API requests successful (status 200)
- [ ] Create workflow berhasil (valid data)
- [ ] Delete config yang digunakan gagal (FK protection)

### Staging (apmsstaging.datacodesolution.com)

- [ ] Website accessible
- [ ] Login successful
- [ ] XLSMART-AVIAT workspace tersedia
- [ ] Test workflow bisa dibuat
- [ ] Tidak ada error FK violation
- [ ] Data integrity terjaga

---

## 🔍 Troubleshooting

### Jika Task Management BLANK/KOSONG

**Possible Causes:**
1. Backend service tidak running
2. Database connection issue
3. API endpoint error
4. FK constraint mencegah data loading

**Cara cek:**

1. **Cek Backend Service:**
   ```bash
   # Production
   ssh root@apms.datacodesolution.com "pm2 status apms-api"

   # Staging
   ssh root@apmsstaging.datacodesolution.com "pm2 status apms-api-staging"
   ```

   Expected: `status: online`

2. **Cek Database Connection:**
   ```bash
   # Production
   ssh root@apms.datacodesolution.com "sudo -u postgres psql -d apms_db -c 'SELECT 1;'"

   # Staging
   ssh root@31.97.220.37 "sudo -u postgres psql -d apms_db -c 'SELECT 1;'"
   ```

   Expected: `?column? = 1`

3. **Cek API Endpoint:**
   ```bash
   # Production
   curl https://apms.datacodesolution.com/api/v1/tasks

   # Staging
   curl https://apmsstaging.datacodesolution.com/api/v1/tasks
   ```

   Expected: JSON array dengan data tasks

---

### Jika Ada Error "Foreign Key Constraint"

**Ini NORMAL dan EXPECTED setelah implementasi FK!**

**Artinya:**
- ✅ FK constraint bekerja
- ✅ Mencegah invalid data masuk
- ✅ Data integrity terjaga

**Solusi:**
- Pastikan data yang diinput valid
- Pastikan referenced data (workspace, config, scope) sudah ada
- Cek error message untuk detail field yang bermasalah

---

## 📱 Screenshot Guide untuk Documentation

**Recommended screenshots:**

1. **Halaman Login**
   - Capture form login
   - Show successful login

2. **Task Management - All Tasks**
   - Capture task list
   - Show data tidak blank
   - Show tab "All Tasks" aktif

3. **Task Management - Pending Tasks**
   - Capture filtered task list
   - Show hanya tasks milik user
   - Show tab "Pending Tasks" aktif

4. **Browser Console**
   - Capture Console tab
   - Show tidak ada error merah

5. **Network Tab**
   - Capture API requests
   - Show status 200 OK

---

## 🎯 Success Criteria

### UI Verification: ✅ SUCCESS

Jika semua berikut ini terpenuhi:
- [x] Website accessible dan bisa login
- [x] Task Management menampilkan data (tidak blank)
- [x] Tab "All Tasks" dan "Pending Tasks" berfungsi
- [x] Tidak ada error di browser console
- [x] API responses successful (200 OK)
- [x] Create/delete operations bekerja sesuai FK rules

**Conclusion:** ✅ **Sistem berjalan dengan baik dengan FK constraints**

---

## 📞 Help & Support

**Jika ada masalah:**

1. **Cek logs:**
   ```bash
   # Production logs
   ssh root@apms.datacodesolution.com "pm2 logs apms-api --lines 50"

   # Staging logs
   ssh root@31.97.220.37 "pm2 logs apms-api-staging --lines 50"
   ```

2. **Cek FK constraints:**
   ```bash
   # Production
   ssh root@apms.datacodesolution.com "sudo -u postgres psql -d apms_db -c 'SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = \"FOREIGN KEY\";'"

   # Expected: 57
   ```

3. **Restart service:**
   ```bash
   # Production
   ssh root@apms.datacodesolution.com "pm2 restart apms-api"

   # Staging
   ssh root@31.97.220.37 "pm2 restart apms-api-staging"
   ```

---

*Guide Created: 2025-12-29*
*Purpose: UI Verification untuk FK Implementation*
*Environments: Production & Staging*
*Status: Ready for Testing*
