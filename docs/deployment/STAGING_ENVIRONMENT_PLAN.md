# Staging Environment Setup Plan

**Purpose:** Create isolated staging environment for testing before production deployment
**Domain:** apmsstaging.datacodesolution.com (proposed)
**Server:** 31.97.220.37 (same server, different port/database) OR separate server

---

## 🎯 Why Staging Environment?

### Problems with Current Setup

1. **No Safe Testing Ground**
   - Testing directly on production (apms.datacodesolution.com)
   - Risk of breaking production features
   - Cannot test new features safely

2. **Database Constraints**
   - Production database issues affect all users
   - Cannot test database migrations safely
   - Hard to reproduce production bugs

3. **Deployment Risk**
   - No pre-production testing
   - Changes go directly to production
   - Higher risk of downtime

### Benefits of Staging

1. **Safe Testing**
   - Isolated from production data
   - Test new features without risk
   - Practice deployments

2. **Bug Reproduction**
   - Replicate production issues
   - Test fixes in production-like environment
   - Verify fixes before deployment

3. **Quality Assurance**
   - Run contract tests before production
   - Test database migrations
   - Verify performance and security

---

## 🏗️ Architecture Options

### Option 1: Same Server, Different Port (Recommended for Cost)

**Pros:**
- ✅ Lower cost (no additional server)
- ✅ Easier maintenance
- ✅ Same infrastructure as production

**Cons:**
- ⚠️ Shared resources (CPU, memory)
- ⚠️ Port conflicts if not careful
- ⚠️ Not truly isolated

**Setup:**
```
Production: https://apms.datacodesolution.com (Port 3011)
Staging:    https://apmsstaging.datacodesolution.com (Port 3012)
```

**Database:**
```
Production: apms_production
Staging:    apms_staging
```

**PM2 Processes:**
```
Production: pm2 start backend/server.js --name "apms-api"
Staging:    pm2 start backend-staging/server.js --name "apms-api-staging"
```

### Option 2: Separate Server (Ideal for Production-Grade)

**Pros:**
- ✅ Complete isolation
- ✅ True production-like environment
- ✅ Can test infrastructure changes

**Cons:**
- ❌ Higher cost (additional server)
- ❌ More maintenance overhead

**Setup:**
```
Production Server: 31.97.220.37
Staging Server:    31.97.220.38 (new server or VPS)

Production: https://apms.datacodesolution.com
Staging:    https://apmsstaging.datacodesolution.com
```

### Recommendation: **Start with Option 1**, upgrade to Option 2 when needed

---

## 📋 Implementation Plan (Option 1)

### Phase 1: Database Setup

```bash
# 1. Create staging database
ssh root@31.97.220.37
mysql -u root -p

CREATE DATABASE apms_staging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'apms_staging'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON apms_staging.* TO 'apms_staging'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 2. Clone production schema to staging
mysqldump -u root -p apms_production --no-data | mysql -u root -p apms_staging

# 3. Or run migrations on staging
cd /var/www/apms-staging/backend
npx prisma db push
```

### Phase 2: File Structure

```bash
# Production structure
/var/www/apms/
├── backend/           # Production backend (Port 3011)
├── frontend/          # Production frontend
└── uploads/           # Production uploads

# Staging structure
/var/www/apms-staging/
├── backend/           # Staging backend (Port 3012)
├── frontend/          # Staging frontend
└── uploads/           # Staging uploads
```

### Phase 3: Environment Configuration

**Production `.env`:**
```env
NODE_ENV=production
PORT=3011
DATABASE_URL="mysql://apms_user:password@localhost:3306/apms_production"
FRONTEND_URL="https://apms.datacodesolution.com"
```

**Staging `.env`:**
```env
NODE_ENV=staging
PORT=3012
DATABASE_URL="mysql://apms_staging:password@localhost:3306/apms_staging"
FRONTEND_URL="https://apmsstaging.datacodesolution.com"
```

### Phase 4: Nginx Configuration

**Production (`/etc/nginx/sites-available/apms.datacodesolution.com`):**
```nginx
server {
    server_name apms.datacodesolution.com;
    root /var/www/apms/frontend/dist;

    location /api {
        proxy_pass http://localhost:3011;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Staging (`/etc/nginx/sites-available/apmsstaging.datacodesolution.com`):**
```nginx
server {
    server_name apmsstaging.datacodesolution.com;
    root /var/www/apms-staging/frontend/dist;

    location /api {
        proxy_pass http://localhost:3012;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Add basic auth for additional security
    auth_basic "Staging Environment";
    auth_basic_user_file /etc/nginx/.htpasswd-staging;
}
```

### Phase 5: PM2 Configuration

**Production Process:**
```bash
cd /var/www/apms/backend
pm2 start server.js --name "apms-api" --env production
pm2 save
```

**Staging Process:**
```bash
cd /var/www/apms-staging/backend
pm2 start server.js --name "apms-api-staging" --env staging
pm2 save
```

**Ecosystem File (`ecosystem.config.js`):**
```javascript
module.exports = {
  apps: [
    {
      name: 'apms-api',
      script: './server.js',
      cwd: '/var/www/apms/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3011
      }
    },
    {
      name: 'apms-api-staging',
      script: './server.js',
      cwd: '/var/www/apms-staging/backend',
      env: {
        NODE_ENV: 'staging',
        PORT: 3012
      }
    }
  ]
};
```

---

## 🚀 Deployment Script

### Deploy to Staging

```bash
#!/bin/bash

# deploy-to-staging.sh
# Deploy code changes to staging environment

STAGING_SERVER="root@31.97.220.37"
STAGING_PATH="/var/www/apms-staging"
LOCAL_PATH="/Users/endik/Projects/telecore-backup"

echo "Deploying to STAGING..."

# Step 1: Build frontend locally
echo "Building frontend..."
cd $LOCAL_PATH/frontend
npm run build

# Step 2: Upload backend files
echo "Uploading backend files..."
sshpass -p 'password' rsync -avz \
  --exclude='node_modules' \
  --exclude='.env' \
  $LOCAL_PATH/backend/ \
  ${STAGING_SERVER}:${STAGING_PATH}/backend/

# Step 3: Upload frontend build
echo "Uploading frontend build..."
sshpass -p 'password' rsync -avz \
  $LOCAL_PATH/frontend/dist/ \
  ${STAGING_SERVER}:${STAGING_PATH}/frontend/dist/

# Step 4: Install dependencies on staging
echo "Installing dependencies..."
sshpass -p 'password' ssh ${STAGING_SERVER} << 'ENDSSH'
cd /var/www/apms-staging/backend
npm install --production
npx prisma generate
npx prisma db push
ENDSSH

# Step 5: Restart staging service
echo "Restarting staging service..."
sshpass -p 'password' ssh ${STAGING_SERVER} << 'ENDSSH'
pm2 restart apms-api-staging
pm2 status apms-api-staging
ENDSSH

echo "✓ Staging deployment complete!"
echo "Staging URL: https://apmsstaging.datacodesolution.com"
```

### Promote Staging to Production

```bash
#!/bin/bash

# promote-to-production.sh
# Promote staging build to production

STAGING_SERVER="root@31.97.220.37"
STAGING_PATH="/var/www/apms-staging"
PRODUCTION_PATH="/var/www/apms"

echo "⚠️  PROMOTING STAGING TO PRODUCTION"
echo "This will REPLACE production code!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

# Backup production
echo "Backing up production..."
sshpass -p 'password' ssh ${STAGING_SERVER} << 'ENDSSH
cd /var/www
tar -czf apms-backup-$(date +%Y%m%d-%H%M%S).tar.gz apms/
ENDSSH

# Copy staging to production
echo "Copying staging to production..."
sshpass -p 'password' ssh ${STAGING_SERVER} << 'ENDSSH'
rsync -avz --delete \
  /var/www/apms-staging/backend/ \
  /var/www/apms/backend/

rsync -avz --delete \
  /var/www/apms-staging/frontend/dist/ \
  /var/www/apms/frontend/dist/
ENDSSH

# Restart production
echo "Restarting production..."
sshpass -p 'password' ssh ${STAGING_SERVER} << 'ENDSSH'
cd /var/www/apms/backend
pm2 restart apms-api
ENDSSH

echo "✓ Production updated!"
```

---

## 🧪 Testing on Staging

### Automated Test Suite

```bash
# Run contract tests against staging
cd backend
STAGING_URL=https://apmsstaging.datacodesolution.com \
NODE_ENV=test \
npm test -- tests/contracts

# Run E2E tests
cd ui-tests
tagui complete_workflow.tagua
```

### Manual Testing Checklist

- [ ] Site registration works
- [ ] ATP tasks auto-created
- [ ] Word to PDF conversion works
- [ ] ATP auto-categorization works
- [ ] Bulk upload works
- [ ] Idempotency prevents double submit
- [ ] Approval chain works (L1 → L2)
- [ ] Frontend loads correctly
- [ ] Login/logout works
- [ ] File uploads work

---

## 📊 Comparison: Production vs Staging

| Aspect | Production | Staging |
|--------|-----------|---------|
| Domain | apms.datacodesolution.com | apmsstaging.datacodesolution.com |
| Port | 3011 | 3012 |
| Database | apms_production | apms_staging |
| Purpose | Live user data | Testing |
| Access | Public (authenticated users) | Restricted (team only) |
| Updates | After staging tests | Frequent (any change) |
| Backups | Daily | Optional (can be reset) |
| Monitoring | Full (Sentry, PM2) | Basic (PM2) |
| SSL | Let's Encrypt | Let's Encrypt |
| Auth | Production auth | Basic auth + Production auth |

---

## 🔒 Security Considerations

### Staging Access Control

1. **Basic Authentication**
   ```bash
   # Generate htpasswd file
   sudo htpasswd -c /etc/nginx/.htpasswd-staging testuser
   ```

2. **IP Whitelist** (Optional)
   ```nginx
   # Only allow office IP
   allow 1.2.3.4;
   deny all;
   ```

3. **Staging Badge on UI**
   ```html
   <div class="staging-badge">
     ⚠️ STAGING ENVIRONMENT - NOT FOR PRODUCTION USE
   </div>
   ```

---

## 📝 Database Management

### Seed Staging with Test Data

```bash
# Option 1: Clone sanitized production data
mysqldump -u root -p apms_production \
  --where="created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)" \
  | mysql -u root -p apms_staging

# Option 2: Generate test data
cd /var/www/apms-staging/backend
node scripts/seed-test-data.js
```

### Reset Staging Database

```bash
# Quick reset (when tests get messy)
mysql -u root -p -e "DROP DATABASE apms_staging; CREATE DATABASE apms_staging;"
cd /var/www/apms-staging/backend
npx prisma db push
```

---

## 🎯 Success Criteria

Staging environment is successful when:

1. ✅ Completely isolated from production
2. ✅ Can test new features safely
3. ✅ Contract tests pass before production deployment
4. ✅ Can reproduce and fix production bugs
5. ✅ Easy deployment workflow (dev → staging → production)
6. ✅ Team has access for manual testing
7. ✅ Automated tests run on every staging deployment

---

## 📞 Quick Commands

```bash
# Deploy to staging
./deploy-to-staging.sh

# View staging logs
ssh root@31.97.220.37 "pm2 logs apms-api-staging --lines 50"

# Restart staging
ssh root@31.97.220.37 "pm2 restart apms-api-staging"

# Access staging database
mysql -u apms_staging -p apms_staging

# Reset staging database
ssh root@31.97.220.37 "mysql -u root -p -e 'DROP DATABASE apms_staging; CREATE DATABASE apms_staging;'"

# Run tests against staging
STAGING_URL=https://apmsstaging.datacodesolution.com npm test
```

---

## 🚦 Next Steps

### Immediate
1. Decide: Option 1 (same server) or Option 2 (separate server)
2. Create staging database
3. Setup staging directory structure
4. Configure nginx for staging domain

### Short-Term
1. Deploy current code to staging
2. Run contract tests on staging
3. Fix database connection issue
4. Test all features on staging

### Long-Term
1. Setup CI/CD pipeline (GitHub Actions)
2. Automated deployments to staging
3. Automated promotion to production
4. Monitoring and alerting

---

**Created:** 2025-12-28
**Status:** 📋 PLAN READY - Awaiting implementation decision
**Priority:** HIGH - Recommended to setup before further production deployments
