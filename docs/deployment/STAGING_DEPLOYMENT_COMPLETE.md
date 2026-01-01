# ✅ STAGING ENVIRONMENT - DEPLOYMENT COMPLETE

**Date:** 2025-12-28
**Status:** ✅ Production Ready
**Staging URL:** https://apmsstaging.datacodesolution.com

---

## Deployment Summary

### ✅ Successfully Deployed

| Component | Status | Details |
|-----------|--------|---------|
| **Database** | ✅ Complete | `apms_staging` with cloned schema from `apms_db` |
| **Backend API** | ✅ Running | Port 3012, PM2 process `apms-api-staging` |
| **Frontend** | ✅ Deployed | `/var/www/apms-staging/frontend/` with STAGING badge |
| **Nginx** | ✅ Configured | Subdomain `apmsstaging.datacodesolution.com` |
| **DNS** | ✅ Active | Pointing to 31.97.220.37 |

---

## URLs & Access

### Staging Environment
```
Frontend: https://apmsstaging.datacodesolution.com
API:      https://apmsstaging.datacodesolution.com/api
```

### Production Environment (Untouched)
```
Frontend: https://apms.datacodesolution.com
API:      https://apms.datacodesolution.com/api
```

---

## Environment Configuration

### Staging vs Production

| Item | Production | Staging |
|------|-----------|---------|
| URL | apms.datacodesolution.com | apmsstaging.datacodesolution.com |
| Port | 3011 | 3012 |
| Database | apms_db | apms_staging |
| Database User | apms_user | apms_staging |
| PM2 Process | apms-api | apms-api-staging |
| Environment | production | staging |
| Frontend Path | /var/www/apms/frontend | /var/www/apms-staging/frontend |
| Backend Path | /var/www/apms/backend | /var/www/apms-staging/backend |
| Data | 6 sites, 4 tasks | Empty (fresh) |

---

## Key Features

### ✅ STAGING Badge

Frontend menampilkan **"⚠️ STAGING" badge** berwarna oranye di header untuk membedakan dari production.

```typescript
// App.tsx
{process.env.REACT_APP_ENVIRONMENT === 'staging' && (
  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
    ⚠️ STAGING
  </span>
)}
```

### ✅ Data Isolation

- **Production:** 6 sites, 4 tasks (real data)
- **Staging:** Empty database (fresh start)
- **Schema:** Identical (cloned from production)

### ✅ Separate PM2 Processes

```bash
$ pm2 list
┌────┬─────────────────────┬─────────┬──────────┬────────┬──────────┐
│ id │ name                │ status  │ cpu      │ mem    │ pid      │
├────┼─────────────────────┼─────────┼──────────┼────────┼──────────┤
│ 5  │ apms-api            │ online  │ 0%       │ 133mb  │ 3157890  │
│ 6  │ apms-api-staging    │ online  │ 0%       │ 121mb  │ 3163308  │
└────┴─────────────────────┴─────────┴──────────┴────────┴──────────┘
```

---

## Testing Results

### API Endpoints Tested

#### ✅ `/api/v1/tasks`
```json
{
  "success": true,
  "data": [],
  "count": 0
}
```
**Status:** Working correctly - Empty staging database

#### ✅ `/api/sites`
```json
[]
```
**Status:** Working correctly - Empty staging database

#### ✅ Port Listening
```bash
$ netstat -tlnp | grep -E '3011|3012'
tcp  0.0.0.0:3011  LISTEN  [node] apms-api (production)
tcp  0.0.0.0:3012  LISTEN  [node] apms-api-staging (staging)
```
**Status:** Both APIs running correctly

---

## Database Schema

Tables Created (Cloned from Production):

- ✅ users
- ✅ roles
- ✅ user_roles
- ✅ user_groups
- ✅ sites
- ✅ tasks
- ✅ documents
- ✅ projects
- ✅ organizations
- ✅ workgroups
- ✅ notifications
- ✅ audit_logs
- ✅ geographic_hierarchy
- ✅ atp_documents
- ✅ atp_checklist_items
- ✅ atp_punchlist_items
- ✅ atp_review_stages
- ✅ atp_document_templates
- ✅ atp_document_attachments
- ✅ task_types
- ✅ templates
- ✅ processes
- ✅ role_processes
- ✅ user_processes
- ✅ user_privileges
- ✅ geographic_privileges
- ✅ refresh_tokens
- ✅ document_assignments
- ✅ project_assignments
- ✅ workgroup_members

Total: **36 tables**

---

## Useful Commands

### PM2 Management

```bash
# View all processes
ssh root@31.97.220.37 "pm2 list"

# View staging logs
ssh root@31.97.220.37 "pm2 logs apms-api-staging"

# Restart staging
ssh root@31.97.220.37 "pm2 restart apms-api-staging"

# Stop staging
ssh root@31.97.220.37 "pm2 stop apms-api-staging"

# Monitor
ssh root@31.97.220.37 "pm2 monit"
```

### Database Management

```bash
# Connect to staging DB
ssh root@31.97.220.37 "sudo -u postgres psql apms_staging"

# Clone fresh schema from production
ssh root@31.97.220.37 "sudo -u postgres pg_dump apms_db -s | sudo -u postgres psql apms_staging"

# Clone production data to staging (destructive - resets staging!)
ssh root@31.97.220.37 "sudo -u postgres pg_dump apms_db | sudo -u postgres psql apms_staging"

# Backup staging DB
ssh root@31.97.220.37 "sudo -u postgres pg_dump apms_staging > apms_staging_backup.sql"
```

### Frontend Deployment

```bash
# Build staging frontend locally
cd /Users/endik/Projects/telecore-backup/frontend
REACT_APP_ENVIRONMENT=staging npm run build

# Deploy to staging
rsync -avz --delete build/ root@31.97.220.37:/var/www/apms-staging/frontend/
```

### Nginx Management

```bash
# Test configuration
ssh root@31.97.220.37 "nginx -t"

# Reload nginx
ssh root@31.97.220.37 "systemctl reload nginx"

# View staging access log
ssh root@31.97.220.37 "tail -f /var/log/nginx/apms-staging-access.log"

# View staging error log
ssh root@31.97.220.37 "tail -f /var/log/nginx/apms-staging-error.log"
```

---

## Next Steps for Multi-Tenant Implementation

Sekarang staging environment siap digunakan untuk implementasi **workspace multi-tenant**:

### Phase 1: Workspace Foundation (Hari ini)
1. ✅ Staging environment ready
2. ⏳ Add `workspaces` table to schema
3. ⏳ Add `workspace_id` to sites & tasks
4. ⏳ Update API filtering per workspace
5. ⏳ Test in staging (not production!)

### Phase 2: Approval Workflow (Besok)
1. ⏳ Create `task_approval_stages` table
2. ⏳ Update task assignment logic
3. ⏳ Create approval endpoints
4. ⏳ Test in staging

### Phase 3: Production Deployment (Setelah staging verified)
1. ⏳ Backup production database
2. ⏳ Run migrations on production
3. ⏳ Deploy updated code
4. ⏳ Verify production still works

---

## Safety & Best Practices

### ✅ What's Safe in Staging

- Test database migrations
- Test schema changes (workspace_id, etc.)
- Test RBAC filtering
- Test approval workflow
- Break & fix things (no production impact!)

### ⚠️ What NOT to Do in Staging

- Don't use production credentials
- Don't send real emails/notifications
- Don't process real payments
- Don't expose staging to public without auth

### 🔒 Security Notes

1. **Separate JWT Secret:** Staging uses different JWT secret than production
2. **Database Isolation:** Completely separate database, no shared data
3. **Port Isolation:** Different ports (3011 vs 3012)
4. **Subdomain Isolation:** Separate subdomain for easy identification

---

## Deployment Files

All deployment scripts are in `/Users/endik/Projects/telecore-backup/`:

- `deploy-staging-v2.sh` - Main staging deployment script
- `scripts/setup-staging.sh` - Detailed setup script
- `docs/deployment/STAGING_SETUP.md` - Setup documentation

---

## Troubleshooting

### Issue: Staging shows old frontend code
**Solution:** Clear browser cache or use incognito mode. The staging badge should be visible.

### Issue: API returns 500 error
**Solution:** Check staging logs:
```bash
ssh root@31.97.220.37 "pm2 logs apms-api-staging --err"
```

### Issue: Database permission denied
**Solution:**
```bash
ssh root@31.97.220.37 "sudo -u postgres psql -d apms_staging -c 'GRANT ALL ON ALL TABLES IN SCHEMA public TO apms_staging; GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO apms_staging;'"
```

### Issue: Port 3012 not listening
**Solution:** Restart staging API:
```bash
ssh root@31.97.220.37 "pm2 restart apms-api-staging"
```

---

## Rollback Procedure (Jika Perlu)

### Delete Staging Environment

```bash
# Stop & delete PM2 process
ssh root@31.97.220.37 "pm2 stop apms-api-staging && pm2 delete apms-api-staging && pm2 save"

# Remove nginx config
ssh root@31.97.220.37 "rm -f /etc/nginx/sites-enabled/apms-staging /etc/nginx/sites-available/apms-staging && systemctl reload nginx"

# Drop database
ssh root@31.97.220.37 "sudo -u postgres psql -c 'DROP DATABASE IF EXISTS apms_staging;'"

# Remove staging directory
ssh root@31.97.220.37 "rm -rf /var/www/apms-staging"
```

---

## Summary

✅ **Staging environment fully operational**
✅ **Production remains untouched**
✅ **Ready for multi-tenant implementation**
✅ **Safe environment for testing**

**Next Action:** Implement workspace multi-tenant in STAGING first, not production!

---

**Last Updated:** 2025-12-28 16:45 UTC
**Status:** ✅ STAGING READY FOR DEVELOPMENT
