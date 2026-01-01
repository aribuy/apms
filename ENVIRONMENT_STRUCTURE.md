# APMS Environment Structure Documentation

**Last Updated**: 2025-12-30
**Purpose**: Reference for backend paths, .env files, and environment-specific configurations

---

## Overview

APMS has three distinct environments:
1. **Local Development** - Development machine
2. **Staging** - Testing environment (apmsstaging.datacodesolution.com)
3. **Production** - Live environment (apms.datacodesolution.com)

---

## 1. Local Development Environment

### Backend Directory
**Path**: `/Users/endik/Projects/telecore-backup/backend/`

### Environment Files
```
/Users/endik/Projects/telecore-backup/backend/.env
/Users/endik/Projects/telecore-backup/backend/.env.production
```

### Database Configuration
- **Database Name**: `apms_db` (local PostgreSQL)
- **Connection**: localhost:5432
- **User**: System user or postgres

### Server Configuration
- **Port**: 3011
- **PM2**: Not used (runs with `npm start` or `node server.js`)
- **Node Environment**: development

### Running the Application
```bash
cd /Users/endik/Projects/telecore-backup/backend
npm start
# or
node server.js
```

---

## 2. Staging Environment

### Backend Directory
**Path**: `/var/www/apms-staging/backend/`

### Environment Files
```
/var/www/apms-staging/backend/.env                    (ACTIVE - 410 bytes)
/var/www/apms-staging/backend/.env.production         (Template - 309 bytes)
/var/www/apms-staging/backend/.env.backup-20251228-023102  (Backup)
```

### Frontend Directory
**Path**: `/var/www/apms-staging/frontend/`
**Deployed Path**: `/var/www/apmsstaging.datacodesolution.com/`

### Database Configuration
- **Database Name**: `apms_staging`
- **Server**: localhost:5432 (on 31.97.220.37)
- **User**: `apms_user`
- **Connection String**: `postgresql://apms_user:password@localhost:5432/apms_staging`

### Server Configuration
- **Server**: 31.97.220.37
- **API URL**: https://apmsstaging.datacodesolution.com
- **API Port**: 3012 (behind nginx on 443)
- **PM2 Process Name**: `apms-staging-api`
- **Node Environment**: production

### PM2 Commands
```bash
# SSH to server
ssh root@31.97.220.37

# View status
pm2 status

# View logs
pm2 logs apms-staging-api

# Restart
pm2 restart apms-staging-api

# Restart with env reload
pm2 restart apms-staging-api --update-env
```

### Key Environment Variables (.env)
```bash
# Database
DATABASE_URL="postgresql://apms_user:password@localhost:5432/apms_staging"

# JWT Secret (unique to staging)
JWT_SECRET="staging-jwt-secret-key-2025-different-from-production"

# Server Port
PORT=3012

# Node Environment
NODE_ENV=production

# Direct Path
Prisma schema: /var/www/apms-staging/backend/prisma/schema.prisma
Migration files: /var/www/apms-staging/backend/prisma/migrations/
```

---

## 3. Production Environment

### Backend Directory
**Path**: `/var/www/apms/backend/`

### Environment Files
```
/var/www/apms/backend/.env                           (ACTIVE - 424 bytes)
/var/www/apms/backend/.env.production                (Template - 309 bytes)
/var/www/apms/backend/.env.backup-20251228-023102     (Backup)
```

### Frontend Directory
**Path**: `/var/www/apms/frontend/`
**Deployed Path**: `/var/www/apms.datacodesolution.com/`
**Current Build Hash**: `main.fc4045bd.js`

### Database Configuration
- **Database Name**: `apms_db`
- **Server**: localhost:5432 (on 31.97.220.37)
- **User**: `apms_user`
- **Connection String**: `postgresql://apms_user:password@localhost:5432/apms_db`

### Server Configuration
- **Server**: 31.97.220.37
- **API URL**: https://apms.datacodesolution.com
- **API Port**: 3011 (behind nginx on 443)
- **PM2 Process Name**: `apms-api`
- **Node Environment**: production

### PM2 Commands
```bash
# SSH to server
ssh root@31.97.220.37

# View status
pm2 status

# View logs
pm2 logs apms-api

# Restart
pm2 restart apms-api

# Restart with env reload
pm2 restart apms-api --update-env
```

### Key Environment Variables (.env)
```bash
# Database
DATABASE_URL="postgresql://apms_user:password@localhost:5432/apms_db"

# JWT Secret (unique to production - 64 hex)
JWT_SECRET="<unique-64-hex-string>"

# Server Port
PORT=3011

# Node Environment
NODE_ENV=production

# Direct Path
Prisma schema: /var/www/apms/backend/prisma/schema.prisma
Migration files: /var/www/apms/backend/prisma/migrations/
```

---

## Environment File Comparison

| Variable | Local | Staging | Production |
|----------|-------|---------|------------|
| **Database** | apms_db | apms_staging | apms_db |
| **Port** | 3011 | 3012 | 3011 |
| **JWT_SECRET** | Default/Dev | Staging-specific | Production-specific |
| **NODE_ENV** | development | production | production |
| **Server** | localhost | 31.97.220.37 | 31.97.220.37 |

---

## Security Best Practices

### 1. JWT Secret Management
- ✅ **Each environment has a unique JWT_SECRET**
- ✅ Staging and production secrets are different
- ✅ Never commit .env files to git
- ✅ Use strong random secrets (64+ characters hex for production)

### 2. Database User Permissions
- Use `apms_user` (least-privileged) instead of `postgres` for application
- Grant only necessary permissions: SELECT, INSERT, UPDATE, DELETE
- Regular user should not have DDL permissions (CREATE, ALTER, DROP)

### 3. Environment File Backup
- Always create timestamped backup before modifying:
  ```bash
  cp .env .env.backup-$(date +%Y%m%d-%H%M%S)
  ```
- Current backup pattern: `.env.backup-20251228-023102`

### 4. Deployment Safety
- Test changes in staging first
- Verify with smoke tests before deploying to production
- Keep recent backups for quick rollback

---

## Deployment Workflows

### Staging Deployment
```bash
# 1. Build frontend locally
cd /Users/endik/Projects/telecore-backup/frontend
npm run build

# 2. Deploy frontend to staging
rsync -avz --delete build/ root@31.97.220.37:/var/www/apmsstaging.datacodesolution.com/

# 3. Deploy backend to staging
cd /Users/endik/Projects/telecore-backup/backend
rsync -avz --exclude='node_modules' --exclude='.env' \
  . root@31.97.220.37:/var/www/apms-staging/backend/

# 4. Restart PM2
ssh root@31.97.220.37 "pm2 restart apms-staging-api"
```

### Production Deployment
```bash
# 1. Build frontend locally
cd /Users/endik/Projects/telecore-backup/frontend
npm run build

# 2. Deploy frontend to production
rsync -avz --delete build/ root@31.97.220.37:/var/www/apms.datacodesolution.com/

# 3. Deploy backend to production
cd /Users/endik/Projects/telecore-backup/backend
rsync -avz --exclude='node_modules' --exclude='.env' \
  . root@31.97.220.37:/var/www/apms/backend/

# 4. Restart PM2
ssh root@31.97.220.37 "pm2 restart apms-api"

# 5. Run smoke tests
curl https://apms.datacodesolution.com/api/health
```

### Database Migration (Prisma)
```bash
# For Staging
ssh root@31.97.220.37
cd /var/www/apms-staging/backend
npx prisma migrate deploy

# For Production
ssh root@31.97.220.37
cd /var/www/apms/backend
npx prisma migrate deploy
```

---

## File Reference

### Backend Structure
```
/var/www/apms-staging/backend/
├── .env                          # Active environment variables
├── .env.production               # Production template
├── .env.backup-20251228-023102   # Backup
├── server.js                     # Express server entry point
├── package.json
├── package-lock.json
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Migration files
└── src/
    ├── middleware/
    │   └── auth.js             # JWT authentication
    ├── routes/
    │   ├── authRoutes.js
    │   ├── taskRoutes.js
    │   ├── sitesRoutes.js
    │   └── ...
    └── utils/
        └── logger.js
```

### Frontend Structure
```
/var/www/apmsstaging.datacodesolution.com/
├── index.html                   # Entry point
├── static/
│   ├── js/
│   │   └── main.fc4045bd.js    # Current build hash
│   └── css/
│       └── main.c694a66f.css
├── favicon.ico
└── manifest.json
```

---

## Quick Reference Commands

### Check Environment Status
```bash
# Staging health check
curl https://apmsstaging.datacodesolution.com/api/health

# Production health check
curl https://apms.datacodesolution.com/api/health

# Staging PM2 status
ssh root@31.97.220.37 "pm2 status | grep apms-staging-api"

# Production PM2 status
ssh root@31.97.220.37 "pm2 status | grep apms-api"
```

### View Environment Variables (Server-Side)
```bash
# Staging
ssh root@31.97.220.37 "cat /var/www/apms-staging/backend/.env"

# Production
ssh root@31.97.220.37 "cat /var/www/apms/backend/.env"
```

### Database Connection Tests
```bash
# Staging DB
ssh root@31.97.220.37 "sudo -u postgres psql -d apms_staging -c 'SELECT 1'"

# Production DB
ssh root@31.97.220.37 "sudo -u postgres psql -d apms_db -c 'SELECT 1'"
```

---

## Troubleshooting

### Issue: PM2 process not running
```bash
# Check PM2 status
pm2 status

# View error logs
pm2 logs <process-name> --err

# Restart process
pm2 restart <process-name>
```

### Issue: JWT invalid signature
**Cause**: JWT_SECRET mismatch or missing
**Solution**:
1. Check .env file has JWT_SECRET
2. Verify JWT_SECRET is correct for environment
3. Restart PM2: `pm2 restart <process-name> --update-env`

### Issue: Database connection failed
**Cause**: Incorrect DATABASE_URL or permissions
**Solution**:
1. Verify DATABASE_URL in .env
2. Check database exists: `sudo -u postgres psql -l`
3. Verify user permissions: `\dp` in psql
4. Restart PM2 after .env changes

### Issue: Frontend build hash not updating
**Cause**: Browser cache or deployment incomplete
**Solution**:
1. Clear browser cache (Cmd+Shift+R)
2. Verify build hash in index.html on server
3. Check rsync completed successfully
4. Verify file sizes match

---

## Monitoring

### Production Monitoring Checklist
- [ ] PM2 process status: `pm2 status`
- [ ] PM2 logs: `pm2 logs apms-api --lines 50`
- [ ] API health: `curl https://apms.datacodesolution.com/api/health`
- [ ] Database connectivity: `sudo -u postgres psql -d apms_db -c 'SELECT NOW()'`
- [ ] Disk space: `df -h`
- [ ] Memory usage: `free -h`

### Staging Monitoring Checklist
- [ ] PM2 process status: `pm2 status`
- [ ] PM2 logs: `pm2 logs apms-staging-api --lines 50`
- [ ] API health: `curl https://apmsstaging.datacodesolution.com/api/health`
- [ ] Database connectivity: `sudo -u postgres psql -d apms_staging -c 'SELECT NOW()'`

---

**Document Version**: 1.0
**Maintained By**: Development Team
**Review Frequency**: Monthly or after infrastructure changes
