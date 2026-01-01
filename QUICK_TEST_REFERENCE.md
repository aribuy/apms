# ⚡ QUICK TEST REFERENCE CARD

**URL**: https://apms.datacodesolution.com
**Quick E2E Test**: 5-10 minutes

---

## 🚀 QUICK TEST (5 MIN)

### Test 1: Site Registration (2 min)

```
1. Login → Site Registration → Register New Site
2. Fill: Site ID = QUICK-TEST-001
3. Check: Software ATP ✅ + Hardware ATP ✅
4. Submit
```

✅ **Check**: 2 tasks created automatically

---

### Test 2: Upload PDF (1 min)

```
1. Task Management → Find task
2. Click "Perform"
3. Upload PDF file
4. Submit
```

✅ **Check**: Success message, status = "in_review"

---

### Test 3: Upload Word → PDF (2 min) ⭐ NEW!

```
1. Create Word doc (any .docx)
2. Task Management → Other task → "Perform"
3. Upload Word file
4. Wait for conversion...
5. Check "converted": true
```

✅ **Check**: Message says "Word document converted to PDF"

---

## 🔍 CHECKLIST

- [ ] Site reg → 2 tasks auto-created ✅
- [ ] Upload PDF → Works ✅
- [ ] Upload Word → Converts to PDF ✅
- [ ] Task status → "in_review" ✅
- [ ] No console errors (F12) ✅

---

## 📱 TEST ON PHONE

1. Open browser on phone
2. Go to apms.datacodesolution.com
3. Login
4. Try upload Word/PDF
5. Check mobile responsive

---

## 🐛 IF ERROR

**Screenshot**: Cmd+Shift+4 (Mac) or Win+Shift+S (Windows)

**Check Console**: F12 → Console tab → Look for red errors

**Check Server**:
```bash
ssh root@31.97.220.37
pm2 logs apms-api --lines 50
```

---

## 📊 SUCCESS CRITERIA

✅ All 3 tests pass
✅ No errors in console
✅ Files uploaded successfully
✅ Workflow stages created

**If ALL pass**: 🎉 **DEPLOYMENT SUCCESSFUL!**

**If ANY fail**: Document error + screenshot

---

## 🆘 NEED HELP?

Check full guide: `PRODUCTION_TESTING_CHECKLIST.md`

Rollback if needed:
```bash
ssh root@31.97.220.37
cd /var/www/apms/backend
pm2 stop apms-api
tar -xzf /backups/apms/20251228/backend-backup.tar.gz
pm2 start apms-api
```

---

**Quick Test**: https://apms.datacodesolution.com
**Status**: Ready for Testing ✅
