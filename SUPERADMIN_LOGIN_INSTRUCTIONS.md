# Super Admin Login Instructions

## Test Credentials

**Email:** `superadmin@apms.com`
**Password:** `SuperAdmin123` (PERHATIKAN: TANPA tanda seru `!`)

## Cara Login

### Opsi 1: Ketik Manual
1. Buka: https://apmsstaging.datacodesolution.com
2. Ketik email: `superadmin@apms.com`
3. Ketik password: `SuperAdmin123` (TANPA `!`)
4. Click "Sign in"

### Opsi 2: Test Credentials Button (JIKA MUNCUL)
1. Buka: https://apmsstaging.datacodesolution.com
2. Scroll ke bawah ke "Test Credentials"
3. Cari tombol "Super Admin" di paling atas
4. Click tombol "Super Admin"
5. Click "Sign in"

### JIKA "Super Admin" TIDAK MUNCUL di Test Credentials:
Lakukan **Hard Refresh** browser:
- **Windows/Linux**: `Ctrl + Shift + R` atau `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

Atau clear cache browser:
1. Buka Developer Tools: `F12`
2. Klik kanan tombol refresh browser
3. Pilih "Empty Cache and Hard Reload"

## Setelah Login Berhasil

Setelah login berhasil dengan superadmin:
- ✅ Role: **SUPERADMIN**
- ✅ Workspace: **XLSMART Project by Aviat**
- ⚠️ Workspace switcher MUNGKIN TIDAK MUNCUL (karena hardcoded auth)

## Status Implementasi

- [x] User superadmin dibuat di hardcoded credentials
- [x] Frontend LoginPage di-update dengan tombol Super Admin
- [x] Frontend di-build dan deploy ke staging
- [ ] Workspace switcher memerlukan JWT token auth (belum diimplementasikan untuk hardcoded users)

## Troubleshooting

### Login Gagal "Invalid Credentials"
- Pastikan password: `SuperAdmin123` (TANPA tanda seru `!`)
- Cek caps lock
- Clear browser cache

### Tombol Super Admin Tidak Muncul
- Hard refresh browser: `Ctrl+Shift+R` (Windows) atau `Cmd+Shift+R` (Mac)
- Atau ketik manual credentials-nya

### Workspace Switcher Tidak Muncul
- Normal untuk hardcoded auth users
- Gunakan user lain (admin@aviat.com) untuk melihat workspace switcher
