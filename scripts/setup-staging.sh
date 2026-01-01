#!/bin/bash

# Staging Environment Setup Script
# Run this on production server: 31.97.220.37

echo "=========================================="
echo "  APMS STAGING ENVIRONMENT SETUP"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Create Staging Database
echo -e "${YELLOW}Step 1: Creating Staging Database...${NC}"
sudo -u postgres psql -c "DROP DATABASE IF EXISTS apms_staging;"
sudo -u postgres psql -c "CREATE DATABASE apms_staging;"
sudo -u postgres psql -c "CREATE USER IF NOT EXISTS apms_staging WITH PASSWORD 'staging_secure_password_2025';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE apms_staging TO apms_staging;"
echo -e "${GREEN}✅ Staging database created${NC}"
echo ""

# Step 2: Clone Production Schema to Staging
echo -e "${YELLOW}Step 2: Cloning Production Schema...${NC}"
cd /var/www/apms/backend
pg_dump apms_production -s | sudo -u postgres psql apms_staging
echo -e "${GREEN}✅ Schema cloned to staging${NC}"
echo ""

# Step 3: Create Staging Environment File
echo -e "${YELLOW}Step 3: Creating Staging Environment File...${NC}"
cat > /var/www/apms/backend/.env.staging << 'EOF'
# Staging Environment Configuration
NODE_ENV=staging
PORT=3012

# Database
DATABASE_URL="postgresql://apms_staging:staging_secure_password_2025@localhost:5432/apms_staging?schema=public"

# JWT
JWT_SECRET="staging-jwt-secret-key-2025-different-from-production"
JWT_EXPIRES_IN="24h"

# URLs
FRONTEND_URL="https://apmsstaging.datacodesolution.com"
API_URL="https://apmsstaging.datacodesolution.com/api"

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR="./uploads/staging"

# Logging
LOG_LEVEL="debug"
EOF
echo -e "${GREEN}✅ .env.staging created${NC}"
echo ""

# Step 4: Run Prisma Migrations on Staging
echo -e "${YELLOW}Step 4: Running Prisma Migrations on Staging...${NC}"
cd /var/www/apms/backend
NODE_ENV=staging npx prisma generate
NODE_ENV=staging npx prisma db push --skip-generate
echo -e "${GREEN}✅ Prisma migrations completed${NC}"
echo ""

# Step 5: Create Staging Directories
echo -e "${YELLOW}Step 5: Creating Staging Directories...${NC}"
mkdir -p /var/www/apms-staging
mkdir -p /var/www/apms-staging/backend
mkdir -p /var/www/apms-staging/frontend
mkdir -p /var/www/apms-staging/uploads
mkdir -p /var/www/apms-staging/logs
echo -e "${GREEN}✅ Staging directories created${NC}"
echo ""

# Step 6: Copy Backend to Staging
echo -e "${YELLOW}Step 6: Copying Backend to Staging...${NC}"
rsync -av --exclude='node_modules' --exclude='.env' \
  /var/www/apms/backend/ /var/www/apms-staging/backend/
cp /var/www/apms/backend/.env.staging /var/www/apms-staging/backend/.env
echo -e "${GREEN}✅ Backend copied to staging${NC}"
echo ""

# Step 7: Install Dependencies for Staging
echo -e "${YELLOW}Step 7: Installing Dependencies...${NC}"
cd /var/www/apms-staging/backend
npm install --production
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 8: Create PM2 Ecosystem File
echo -e "${YELLOW}Step 8: Creating PM2 Ecosystem...${NC}"
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
echo -e "${GREEN}✅ PM2 ecosystem created${NC}"
echo ""

# Step 9: Start Staging with PM2
echo -e "${YELLOW}Step 9: Starting Staging API with PM2...${NC}"
pm2 delete apms-api-staging 2>/dev/null || true
sleep 2
pm2 start /var/www/apms-staging/backend/ecosystem.config.cjs
pm2 save
echo -e "${GREEN}✅ Staging API started on port 3012${NC}"
echo ""

# Step 10: Configure Nginx for Staging
echo -e "${YELLOW}Step 10: Configuring Nginx for Staging...${NC}"
cat > /etc/nginx/sites-available/apms-staging << 'EOF'
# Staging Server Configuration
server {
    listen 80;
    server_name apmsstaging.datacodesolution.com;

    # Logging
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

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files with caching
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

ln -sf /etc/nginx/sites-available/apms-staging /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
echo -e "${GREEN}✅ Nginx configured for staging${NC}"
echo ""

# Step 11: Display Status
echo "=========================================="
echo -e "${GREEN}  ✅ STAGING SETUP COMPLETE!${NC}"
echo "=========================================="
echo ""
echo "Staging URLs:"
echo "  Frontend: https://apmsstaging.datacodesolution.com"
echo "  API:      https://apmsstaging.datacodesolution.com/api"
echo ""
echo "Staging Details:"
echo "  Database: apms_staging"
echo "  Port:     3012"
echo "  PM2:      apms-api-staging"
echo ""
echo "Useful Commands:"
echo "  View logs:     pm2 logs apms-api-staging"
echo "  Restart:       pm2 restart apms-api-staging"
echo "  Stop:          pm2 stop apms-api-staging"
echo "  Monitor:       pm2 monit"
echo ""
echo -e "${YELLOW}Next Step: Deploy frontend build to staging${NC}"
echo ""
