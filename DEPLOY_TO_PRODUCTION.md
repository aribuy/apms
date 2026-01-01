# DEPLOYMENT GUIDE - Production Server

**Server**: apms.datacodesolution.com
**Date**: 2025-12-28
**Purpose**: Deploy Word to PDF conversion and enhancements to production

---

## 📋 DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] Backup current production code
- [ ] Backup database
- [ ] Install LibreOffice on production server
- [ ] Verify SSH access to production server
- [ ] Notify users of maintenance window (if needed)

### Deployment Steps

- [ ] Deploy backend changes
- [ ] Install new npm dependencies (libreoffice-convert)
- [ ] Deploy frontend changes
- [ ] Restart backend service
- [ ] Restart frontend service
- [ ] Verify deployment

### Post-Deployment

- [ ] Test Site Registration
- [ ] Test Auto-create Tasks
- [ ] Test Single Upload (PDF)
- [ ] Test Word to PDF Conversion
- [ ] Test Bulk Upload
- [ ] Test Auto-Categorization
- [ ] Verify Workflow Stages
- [ ] Check logs for errors

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Connect to Production Server

```bash
# SSH ke production server
ssh apms@apms.datacodesolution.com

# Atau jika menggunakan key
ssh -i ~/.ssh/your_key apms@apms.datacodesolution.com
```

### Step 2: Navigate to Application Directory

```bash
# Cek struktur direktori
cd /var/www/apms  # atau path aplikasi Anda
pwd
ls -la
```

### Step 3: Backup Current Production

```bash
# Create backup directory
mkdir -p /backups/apms/$(date +%Y%m%d)

# Backup backend
cd /var/www/apms/backend
tar -czf /backups/apms/$(date +%Y%m%d)/backend-backup.tar.gz .

# Backup frontend
cd /var/www/apms/frontend
tar -czf /backups/apms/$(date +%Y%m%d)/frontend-backup.tar.gz .

# Backup database (sesuaikan dengan DB Anda)
# PostgreSQL:
pg_dump apms_production > /backups/apms/$(date +%Y%m%d)/db-backup.sql

# MySQL:
mysqldump apms_production > /backups/apms/$(date +%Y%m%d)/db-backup.sql

echo "Backup completed: /backups/apms/$(date +%Y%m%d)/"
```

### Step 4: Install LibreOffice on Production

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y libreoffice

# Verify installation
libreoffice --version

# Jika error, install juga:
sudo apt-get install -y libreoffice-writer
```

### Step 5: Deploy Backend Changes

```bash
# Go to backend directory
cd /var/www/apms/backend

# Pull changes from git (if using git)
# git pull origin main

# Atau upload files manually menggunakan SCP/RSYNC:
# Dari local machine:
# scp -r backend/src/utils/documentConverter.js apms@apms.datacodesolution.com:/var/www/apms/backend/src/utils/
# scp backend/src/routes/atpUploadRoutes.js apms@apms.datacodesolution.com:/var/www/apms/backend/src/routes/

# Install new dependencies
npm install libreoffice-convert@1.7.0

# Verify package.json has the new dependency
grep libreoffice-convert package.json

# Restart backend service
# Jika menggunakan PM2:
pm2 restart apms-backend

# Atau jika menggunakan systemd:
sudo systemctl restart apms-backend

# Atau jika menggunakan nodemon:
# Kill process and restart
```

### Step 6: Deploy Frontend Changes

```bash
# Frontend changes are optional (mostly existing features)
# If there are any UI updates:

cd /var/www/apms/frontend

# Pull changes or upload files

# Build frontend
npm run build

# Restart frontend service
pm2 restart apms-frontend
# atau
sudo systemctl restart apms-frontend
```

### Step 7: Verify Services

```bash
# Check if services are running
pm2 status
# atau
sudo systemctl status apms-backend
sudo systemctl status apms-frontend

# Check logs
pm2 logs apms-backend --lines 50
# atau
tail -f /var/log/apms/backend.log
```

---

## 🧪 POST-DEPLOYMENT TESTING

### Test 1: Backend API Health Check

```bash
# From production server
curl http://localhost:3011/api/v1/health

# Or from local machine
curl http://apms.datacodesolution.com/api/v1/health
```

Expected: `{"status":"ok"}`

### Test 2: Site Registration

```bash
curl -X POST http://apms.datacodesolution.com/api/v1/site-registration/register \
  -H "Content-Type: application/json" \
  -d '{
    "customerSiteId": "PROD-TEST-001",
    "customerSiteName": "Production Test Site",
    "neTowerId": "NE-001",
    "neTowerName": "NE Tower",
    "feTowerId": "FE-001",
    "feTowerName": "FE Tower",
    "neLatitude": -7.2575,
    "neLongitude": 112.7521,
    "feLatitude": -7.2675,
    "feLongitude": 112.7621,
    "region": "East Java",
    "coverageArea": "Urban",
    "activityFlow": "MW Upgrade",
    "sowCategory": "Deployment",
    "projectCode": "PRJ-001",
    "frequencyBand": "18GHz",
    "linkCapacity": "512Mbps",
    "antennaSize": "0.6m",
    "equipmentType": "AVIAT",
    "atpRequirements": {
      "software": true,
      "hardware": true
    }
  }'
```

Expected: `{"success":true, "data": {"site": {...}, "atpTasks": [...]}}`

### Test 3: Word to PDF Conversion

Upload a test Word document via UI or API:

```bash
# Create test Word document first, then upload:
curl -X POST http://apms.datacodesolution.com/api/v1/atp/upload \
  -F "document=@test-document.docx" \
  -F "task_code=ATP-SW-PROD-TEST-001" \
  -F "site_id=PROD-TEST-001"
```

Expected: `{"success":true, "message":"Word document converted to PDF..."}`

### Test 4: Check LibreOffice Integration

```bash
# SSH to server and test LibreOffice
ssh apms@apms.datacodesolution.com

# Test conversion
libreoffice --headless --version

# Check if libreoffice-convert package is installed
cd /var/www/apms/backend
npm list libreoffice-convert
```

---

## 📊 FILES TO DEPLOY

### Backend Files

**New Files**:
1. `backend/src/utils/documentConverter.js` - Word to PDF conversion utility

**Modified Files**:
2. `backend/src/routes/atpUploadRoutes.js` - Upload endpoint with Word to PDF integration

**Dependencies**:
3. `backend/package.json` - Added `libreoffice-convert@1.7.0`

### Frontend Files

No changes required - all features already exist.

---

## 🔍 VERIFICATION CHECKLIST

After deployment, verify:

- [ ] Backend service running (port 3011)
- [ ] Frontend service running (port 5173 or production port)
- [ ] LibreOffice installed on server
- [ ] `libreoffice-convert` package installed
- [ ] Site Registration creates tasks
- [ ] Upload accepts PDF files
- [ ] Upload accepts Word files (.doc/.docx)
- [ ] Word files converted to PDF
- [ ] Auto-categorization working
- [ ] Workflow stages initialized
- [ ] No errors in logs
- [ ] PM2/systemd services stable

---

## 🐛 TROUBLESHOOTING

### Issue: Backend service won't start

**Solution**:
```bash
# Check logs
pm2 logs apms-backend --err

# Common issues:
# 1. Missing dependencies
npm install

# 2. Port already in use
lsof -ti:3011 | xargs kill -9

# 3. Database connection error
# Check DATABASE_URL in .env
```

### Issue: LibreOffice not found

**Solution**:
```bash
# Install LibreOffice
sudo apt-get install -y libreoffice

# Verify
libreoffice --version

# Add to PATH if needed
echo 'export PATH=$PATH:/usr/bin/libreoffice' >> ~/.bashrc
source ~/.bashrc
```

### Issue: Word to PDF conversion fails

**Solution**:
```bash
# Test LibreOffice manually
libreoffice --headless --convert-to pdf /path/to/test.docx

# Check permissions
ls -la uploads/atp-documents/

# Ensure directory is writable
chmod 755 uploads/atp-documents/
```

### Issue: High memory usage

**Solution**:
```bash
# LibreOffice can use high memory
# Consider adding swap space or increasing server RAM

# Or set memory limits in PM2
pm2 start app.js --max-memory-restart 500M
```

---

## 🔄 ROLLBACK PROCEDURE

If deployment fails:

```bash
# Stop services
pm2 stop apms-backend apms-frontend

# Restore from backup
cd /var/www/apms
tar -xzf /backups/apms/20251228/backend-backup.tar.gz -C backend/
tar -xzf /backups/apms/20251228/frontend-backup.tar.gz -C frontend/

# Restart services
pm2 restart apms-backend apms-frontend

# Verify rollback
curl http://localhost:3011/api/v1/health
```

---

## 📝 LOGS TO MONITOR

After deployment, monitor these logs:

```bash
# Backend logs
pm2 logs apms-backend

# Application logs
tail -f /var/www/apms/backend/logs/app.log

# Error logs
tail -f /var/www/apms/backend/logs/error.log

# System logs
journalctl -u apms-backend -f
```

---

## ✅ DEPLOYMENT COMPLETE

When all tests pass:

1. Document deployment date and time
2. Create git tag for this release
3. Update CHANGELOG.md
4. Notify team that deployment is complete

---

**Deployment Script Version**: 1.0
**Last Updated**: 2025-12-28
**Status**: Ready for Deployment
