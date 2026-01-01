# 📋 Cara Cepat Cek di UI Website

## ✅ STEP-BY-STEP (Bahasa Indonesia)

### 1. Buka Website

**Production:**
```
https://apms.datacodesolution.com
```

**Staging:**
```
https://apmsstaging.datacodesolution.com
```

---

### 2. Login

1. **Click "Login"** atau masuk ke halaman login
2. **Masukkan credentials:**
   - Email: `admin@telecore.com`
   - Password: `[password Anda]`
3. **Click "Sign In"** atau "Login"

---

### 3. Cek Task Management (FITUR YANG SUDAH DIPERBAIKI)

Setelah login:

1. **Cari menu "Tasks"** atau "Task Management" di sidebar/kiri
2. **Click menu Tasks**
3. **Lihat apakah:**
   - ✅ Task list muncul (TIDAK BLANK/KOSONG)
   - ✅ Ada tab "All Tasks" dan "Pending Tasks"
   - ✅ Data tasks ditampilkan dengan benar

4. **Test klik tab:**
   - Click **"All Tasks"** → Harus menampilkan semua tasks
   - Click **"Pending Tasks"** → Harus menampilkan tasks milik Anda saja

---

### 4. Cek Error di Browser (PENTING!)

**Cara cek:**

1. **Tekan F12** di keyboard (atau click kanan → Inspect)
2. **Pilih tab "Console"** (di bagian atas)
3. **Lihat apakah ada:**
   - ❌ Error text warna merah → Ada masalah
   - ✅ Tidak ada error merah → Sistem OK

**Contoh error yang NORMAL (FK bekerja):**
```
Foreign key constraint failed
Invalid reference
```

**Ini GOOD** → Artinya FK mencegah data invalid masuk

---

### 5. Verifikasi via Developer Tools Network Tab

**Cara cek API:**

1. **Tekan F12** (buka Developer Tools)
2. **Pilih tab "Network"**
3. **Refresh halaman** (F5)
4. **Lihat API calls:**
   - Cari request ke `/api/v1/tasks`
   - Click request tersebut
   - Lihat "Status Code"
   - ✅ **Status 200** → Berhasil
   - ❌ **Status 4xx/5xx** → Ada error

---

## 🧪 TEST SCRIPT (Otomatis)

Saya sudah buat script untuk test otomatis:

```bash
# Jalankan di terminal
./verify_api.sh
```

**Hasil test sekarang:**
- ✅ Health Check: PASS (200)
- ✅ Task List: PASS (200)
- ❌ Workspace List: FAIL (404) → OK, mungkin endpoint belum ada

---

## 📊 Checklist Verifikasi

### Production (apms.datacodesolution.com)

- [ ] Website bisa diakses
- [ ] Bisa login
- [ ] Task Management tidak blank
- [ ] Tab "All Tasks" berfungsi
- [ ] Tab "Pending Tasks" berfungsi
- [ ] Tidak ada error merah di console (F12)
- [ ] API `/api/v1/tasks` return 200

### Staging (apmsstaging.datacodesolution.com)

- [ ] Website bisa diakses
- [ ] Bisa login
- [ ] Workspace "XLSMART-AVIAT" tersedia
- [ ] Bisa create test workflow
- [ ] Tidak ada error FK violation

---

## 🎯 Yang Harus Terlihat di UI

### 1. Task List Page

**Expected:**
```
┌─────────────────────────────────────────────┐
│ Tasks Management                             │
├─────────────────────────────────────────────┤
│ [All Tasks] [Pending Tasks]                 │
├─────────────────────────────────────────────┤
│ Task ID    | Site     | Status | Actions    │
│-------------------------------------------│
│ TASK-001   | Site-A   | Open   | [View]    │
│ TASK-002   | Site-B   | Closed | [View]    │
│ ...                                       │
└─────────────────────────────────────────────┘
```

**Jika BLANK/KOSONG:**
- Cek browser console (F12) untuk error
- Cek backend service status
- Cek API response di Network tab

---

### 2. Browser Console (F12 → Console)

**Expected Output:**
```
(Blank atau hanya info logs)
```

**Error yang Wajar (FK bekerja):**
```
⚠️ Foreign key constraint failed
→ Ini GOOD, FK mencegah invalid data
```

**Error yang PERLU DIPERBAIKI:**
```
❌ Failed to fetch
❌ Network error
❌ 500 Internal Server Error (selain FK violation)
```

---

## 🔍 Troubleshooting Cepat

### Jika Task Management BLANK

**Step 1: Cek API**
```bash
curl https://apms.datacodesolution.com/api/v1/tasks
```

✅ **Expected:** Return JSON array dengan tasks
❌ **Jika error:** Ada masalah dengan backend/database

**Step 2: Cek Backend Service**
```bash
ssh root@apms.datacodesolution.com "pm2 status apms-api"
```

✅ **Expected:** Status "online"
❌ **Jika stopped:** Restart service

**Step 3: Cek Database**
```bash
ssh root@apms.datacodesolution.com "sudo -u postgres psql -d apms_db -c 'SELECT COUNT(*) FROM tasks;'"
```

✅ **Expected:** Return jumlah tasks
❌ **Jika error:** Database connection issue

---

### Jika Ada Error di Browser Console

**Error 1: Foreign Key Constraint**
```
Foreign key constraint failed
```

**Artinya:** ✅ **NORMAL** - FK bekerja mencegah invalid data
**Solusi:** Pastikan data yang diinput valid

**Error 2: Network Error**
```
Failed to fetch
Network error
```

**Artinya:** ❌ **PROBLEM** - Backend tidak bisa diakses
**Solusi:** Cek backend service dan network

**Error 3: 500 Internal Server Error**
```
500 Internal Server Error
```

**Artinya:** ⚠️ **CHECK** - Backend error
**Solusi:** Cek backend logs untuk detail error

---

## 📱 Screenshots untuk Documentation

**Recommended untuk dicapture:**

1. **Halaman Login** → Bukti bisa login
2. **Task List (All Tasks)** → Bukti data muncul
3. **Task List (Pending Tasks)** → Bukti filter bekerja
4. **Browser Console (F12)** → Bukti tidak ada error
5. **Network Tab (API calls)** → Bukti API berhasil

---

## ✅ SUCCESS CRITERIA

**UI Verification SUKSES jika:**

- [x] Website accessible
- [x] Bisa login
- [x] Task Management menampilkan data (TIDAK BLANK)
- [x] Tab "All Tasks" dan "Pending Tasks" berfungsi
- [x] Tidak ada error merah di browser console
- [x] API `/api/v1/tasks` return 200

**Jika SEMUA terpenuhi:**
🎉 **SISTEM SUDAH BERJALAN DENGAN BAIK DENGAN FK CONSTRAINTS!**

---

## 📞 Bantuan

**Jika ada masalah:**

1. **Cek dokumentasi lengkap:**
   - `UI_VERIFICATION_GUIDE.md`

2. **Jalankan verification script:**
   ```bash
   ./verify_api.sh
   ```

3. **Cek service status:**
   ```bash
   ssh root@apms.datacodesolution.com "pm2 status apms-api"
   ```

4. **Cek logs:**
   ```bash
   ssh root@apms.datacodesolution.com "pm2 logs apms-api --lines 50"
   ```

---

*Guide Created: 2025-12-29*
*Purpose: Cara cepat cek UI website*
*Language: Bahasa Indonesia*
*Status: Ready for Testing*
