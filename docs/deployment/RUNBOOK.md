# APMS Deployment Runbook

**Environments:** Staging + Production

---

## 1) Pre-Deployment Checklist
- Confirm clean working tree or documented diff
- Verify DB backups completed
- Confirm `.env` files are correct for target environment
- Ensure PM2 process names are known
- Run backend + frontend tests
- Prepare rollback plan

---

## 2) Staging Deployment

**Server:** `31.97.220.37`
**Backend Path:** `/var/www/apms-staging/backend/`
**Frontend Path:** `/var/www/apms-staging/frontend/`
**PM2 Process:** `apms-staging-api`

### Steps
1. **Backup**
   ```bash
   cd /var/www
   cp -r apms-staging apms-staging-backup-$(date +%Y%m%d-%H%M%S)
   ```
2. **Deploy Backend**
   ```bash
   cd /var/www/apms-staging/backend
   npm install --production
   npx prisma migrate deploy
   pm2 restart apms-staging-api
   ```
3. **Deploy Frontend**
   ```bash
   cd /var/www/apms-staging/frontend
   npm install
   npm run build
   ```
4. **Reload Nginx**
   ```bash
   nginx -t && nginx -s reload
   ```
5. **Smoke Tests**
   - Login with staging accounts
   - Verify workspace switcher
   - Verify task/site lists

---

## 3) Production Deployment

**Server:** `31.97.220.37`
**Backend Path:** `/var/www/apms/backend/`
**Frontend Path:** `/var/www/apms/frontend/`
**PM2 Process:** `apms-api`

### Steps
1. **Backup**
   ```bash
   cd /var/www
   cp -r apms apms-backup-$(date +%Y%m%d-%H%M%S)
   ```
2. **Deploy Backend**
   ```bash
   cd /var/www/apms/backend
   npm install --production
   npx prisma migrate deploy
   pm2 restart apms-api
   ```
3. **Deploy Frontend**
   ```bash
   cd /var/www/apms/frontend
   npm install
   npm run build
   ```
4. **Reload Nginx**
   ```bash
   nginx -t && nginx -s reload
   ```
5. **Smoke Tests**
   - Login with production accounts
   - Verify workspace switcher
   - Verify task/site lists

---

## 4) Post-Deployment Verification
- Confirm backend logs show healthy startup
- Verify `/api/v1/auth/me` with a valid token
- Verify `/api/v1/user/context` returns correct workspace
- Check error logs for 15 minutes

---

## 5) Rollback
1. Stop API process
2. Restore backup directory
3. Restart PM2
4. Reload Nginx

---

## 6) Troubleshooting
- **DB permission errors:** verify `apms_user` grants on schema
- **JWT errors:** confirm `JWT_SECRET` matches environment
- **CORS errors:** check `CORS_ORIGIN` and Nginx proxy headers

