# Staging Environment Setup Guide

**Date:** 2025-12-28
**Status:** Ready for Setup
**Staging URL:** https://apmsstaging.datacodesolution.com

---

## Overview

Staging environment akan di-setup pada server yang sama dengan production (31.97.220.37) namun dengan:
- **Database terpisah:** `apms_staging`
- **Port terpisah:** `3012` (production: `3011`)
- **Subdomain terpisah:** `apmsstaging.datacodesolution.com`
- **PM2 process terpisah:** `apms-api-staging`
- **Environment file terpisah:** `.env.staging`

---

## Prerequisites

- SSH access ke production server (31.97.220.37)
- PostgreSQL 16+ installed
- nginx installed
- PM2 installed
- Node.js 18+ installed

---

## Quick Setup (Automated)

### Step 1: Upload & Execute Setup Script

```bash
# Dari local machine
cd /Users/endik/Projects/telecore-backup

# Upload script ke server
scp scripts/setup-staging.sh root@31.97.220.37:/tmp/

# SSH ke server & execute
ssh root@31.97.220.37
bash /tmp/setup-staging.sh
```

### Step 2: Verify Setup

```bash
# Check PM2 processes
pm2 list
# Should show:
# - apms-api (production, port 3011)
# - apms-api-staging (staging, port 3012)

# Check nginx config
nginx -t

# Check listening ports
netstat -tlnp | grep -E '3011|3012'
# Should show both ports listening
```

---

## Manual Setup (Jika Automated Gagal)

### 1. Create Staging Database

```bash
# SSH ke server
ssh root@31.97.220.37

# Create database & user
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS apms_staging;
CREATE DATABASE apms_staging;
CREATE USER IF NOT EXISTS apms_staging WITH PASSWORD 'staging_secure_password_2025';
GRANT ALL PRIVILEGES ON DATABASE apms_staging TO apms_staging;
EOF
```

### 2. Clone Production Schema

```bash
# Dump schema dari production
sudo -u postgres pg_dump apms_production -s > /tmp/schema.sql

# Restore ke staging
sudo -u postgres psql apms_staging < /tmp/schema.sql
```

### 3. Create Staging Directory Structure

```bash
mkdir -p /var/www/apms-staging/backend
mkdir -p /var/www/apms-staging/frontend
mkdir -p /var/www/apms-staging/uploads
mkdir -p /var/www/apms-staging/logs
```

### 4. Copy Backend Files

```bash
# Copy backend (tanpa node_modules)
rsync -av --exclude='node_modules' --exclude='.env' \
  /var/www/apms/backend/ /var/www/apms-staging/backend/
```

### 5. Create Staging Environment File

```bash
cat > /var/www/apms-staging/backend/.env << 'EOF'
NODE_ENV=staging
PORT=3012
DATABASE_URL="postgresql://apms_staging:staging_secure_password_2025@localhost:5432/apms_staging?schema=public"
JWT_SECRET="staging-jwt-secret-key-2025-different-from-production"
JWT_EXPIRES_IN="24h"
FRONTEND_URL="https://apmsstaging.datacodesolution.com"
API_URL="https://apmsstaging.datacodesolution.com/api"
MAX_FILE_SIZE=10485760
UPLOAD_DIR="./uploads/staging"
LOG_LEVEL="debug"
EOF
```

### 6. Install Dependencies

```bash
cd /var/www/apms-staging/backend
npm install --production
```

### 7. Run Prisma Migrations

```bash
cd /var/www/apms-staging/backend
NODE_ENV=staging npx prisma generate
NODE_ENV=staging npx prisma db push --skip-generate
```

### 8. Create PM2 Ecosystem File

```bash
cat > /var/www/apms-staging/backend/ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'apms-api-staging',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'staging',
      PORT: 3012
    },
    error_file: '/var/www/apms-staging/logs/error.log',
    out_file: '/var/www/apms-staging/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF
```

### 9. Start Staging API

```bash
pm2 delete apms-api-staging 2>/dev/null || true
pm2 start /var/www/apms-staging/backend/ecosystem.config.cjs
pm2 save
```

### 10. Configure Nginx

```bash
cat > /etc/nginx/sites-available/apms-staging << 'EOF'
server {
    listen 80;
    server_name apmsstaging.datacodesolution.com;

    access_log /var/log/nginx/apms-staging-access.log;
    error_log /var/log/nginx/apms-staging-error.log;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3012;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/apms-staging/frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA fallback
    location / {
        root /var/www/apms-staging/frontend;
        try_files $uri $uri/ /index.html;
        add_header X-Environment "staging";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/apms-staging /etc/nginx/sites-enabled/

# Test & reload nginx
nginx -t
systemctl reload nginx
```

---

## Frontend Deployment

### Build Staging Frontend

```bash
# Dari local machine
cd /Users/endik/Projects/telecore-backup/frontend

# Create staging environment
cat > .env.staging << 'EOF'
REACT_APP_API_URL=https://apmsstaging.datacodesolution.com/api
REACT_APP_ENVIRONMENT=staging
EOF

# Build dengan staging environment
REACT_APP_ENVIRONMENT=staging npm run build

# Deploy ke server
rsync -avz --delete build/ root@31.97.220.37:/var/www/apms-staging/frontend/
```

---

## Verification Checklist

Setelah setup selesai, verify:

### 1. API Health Check

```bash
# Production API
curl https://apms.datacodesolution.com/api/v1/health

# Staging API
curl https://apmsstaging.datacodesolution.com/api/v1/health
```

### 2. Frontend Access

- Production: https://apms.datacodesolution.com
- Staging: https://apmsstaging.datacodesolution.com

### 3. PM2 Status

```bash
pm2 list
pm2 logs apms-api-staging --lines 50
```

### 4. Database Connection

```bash
# Test staging database connection
sudo -u postgres psql apms_staging -c "SELECT 1;"
```

### 5. Nginx Configuration

```bash
nginx -t
systemctl status nginx
```

---

## Environment Comparison

| Item | Production | Staging |
|------|-----------|---------|
| URL | apms.datacodesolution.com | apmsstaging.datacodesolution.com |
| Port | 3011 | 3012 |
| Database | apms_production | apms_staging |
| PM2 Process | apms-api | apms-api-staging |
| Environment | production | staging |
| Frontend Path | /var/www/apms/frontend | /var/www/apms-staging/frontend |
| Backend Path | /var/www/apms/backend | /var/www/apms-staging/backend |

---

## Useful Commands

### PM2 Management

```bash
# View all processes
pm2 list

# View staging logs
pm2 logs apms-api-staging

# Restart staging
pm2 restart apms-api-staging

# Stop staging
pm2 stop apms-api-staging

# Monitor
pm2 monit
```

### Database Management

```bash
# Connect to staging DB
sudo -u postgres psql apms_staging

# Backup staging DB
sudo -u postgres pg_dump apms_staging > apms_staging_backup.sql

# Restore staging DB
sudo -u postgres psql apms_staging < apms_staging_backup.sql

# Clone production to staging (fresh data)
sudo -u postgres pg_dump apms_production | sudo -u postgres psql apms_staging
```

### Nginx Management

```bash
# Test configuration
nginx -t

# Reload nginx
systemctl reload nginx

# View staging access log
tail -f /var/log/nginx/apms-staging-access.log

# View staging error log
tail -f /var/log/nginx/apms-staging-error.log
```

---

## Troubleshooting

### Issue: Port 3012 already in use

```bash
# Find process using port 3012
lsof -i :3012

# Kill process
kill -9 <PID>

# Or restart PM2
pm2 restart apms-api-staging
```

### Issue: Database connection failed

```bash
# Check PostgreSQL is running
systemctl status postgresql

# Check database exists
sudo -u postgres psql -l | grep apms_staging

# Check user permissions
sudo -u postgres psql -c "\du apms_staging"
```

### Issue: Nginx 502 Bad Gateway

```bash
# Check if API is running
pm2 list

# Check API logs
pm2 logs apms-api-staging --err

# Verify port 3012 is listening
netstat -tlnp | grep 3012
```

### Issue: Frontend showing old code

```bash
# Clear browser cache or use incognito

# Or verify correct deployment
ls -lah /var/www/apms-staging/frontend/

# Check file timestamps
stat /var/www/apms-staging/frontend/main.*.js
```

---

## Security Notes

### Important: Staging Security

1. **Password Protection:** Consider adding basic auth to staging
   ```nginx
   auth_basic "Staging Environment";
   auth_basic_user_file /etc/nginx/.htpasswd-staging;
   ```

2. **IP Whitelist:** Restrict access to specific IPs only
   ```nginx
   allow 1.2.3.4; # Your office IP
   deny all;
   ```

3. **No Real Data:** Staging should NEVER contain production data
   - Use mock/sample data only
   - Or anonymized production data

4. **Separate JWT Secret:** Staging uses different JWT secret

---

## Next Steps After Setup

1. ✅ Verify staging is accessible
2. ✅ Test all features in staging
3. ✅ Implement multi-tenant changes in staging
4. ✅ Test workspace isolation
5. ✅ Test RBAC filtering
6. ✅ UAT with stakeholders
7. ✅ Deploy verified changes to production

---

## Rollback Procedure

Jika staging bermasalah dan perlu dihapus:

```bash
# Stop PM2 process
pm2 stop apms-api-staging
pm2 delete apms-api-staging
pm2 save

# Remove nginx config
rm -f /etc/nginx/sites-enabled/apms-staging
rm -f /etc/nginx/sites-available/apms-staging
systemctl reload nginx

# Drop staging database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS apms_staging;"
sudo -u postgres psql -c "DROP USER IF EXISTS apms_staging;"

# Remove staging directory
rm -rf /var/www/apms-staging
```

---

**Last Updated:** 2025-12-28
**Status:** Ready for Execution
