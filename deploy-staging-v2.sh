#!/bin/bash

# Staging Deployment Script - Silent Version
# This will setup and deploy staging environment

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Server configuration
SERVER="root@31.97.220.37"
PASSWORD="Qazwsx123.Qazwsx123."

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  APMS STAGING DEPLOYMENT${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Suppress SSH login messages
export SSHPASS="$PASSWORD"

# Step 1: Create Staging Database
echo -e "${YELLOW}Step 1: Creating Staging Database...${NC}"
sshpass -e ssh -o StrictHostKeyChecking=no -o LogLevel=QUIET $SERVER << 'ENDSSH'
sudo -u postgres psql -c "DROP DATABASE IF EXISTS apms_staging;" 2>/dev/null
sudo -u postgres psql -c "CREATE DATABASE apms_staging;" 2>/dev/null
sudo -u postgres psql -c "DO \$\$ BEGIN DROP ROLE IF EXISTS apms_staging; EXCEPTION WHEN OTHERS THEN END; \$\$ LANGUAGE plpgsql;" 2>/dev/null
sudo -u postgres psql -c "CREATE USER apms_staging WITH PASSWORD 'staging_secure_password_2025';" 2>/dev/null
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE apms_staging TO apms_staging;" 2>/dev/null
echo "✅ Database created"
ENDSSH

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to create database${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Database created${NC}"
echo ""

# Step 2: Create Staging Directories
echo -e "${YELLOW}Step 2: Creating Staging Directories...${NC}"
sshpass -e ssh -o StrictHostKeyChecking=no -o LogLevel=QUIET $SERVER "mkdir -p /var/www/apms-staging/{backend,frontend,uploads,logs}"
echo -e "${GREEN}✅ Directories created${NC}"
echo ""

# Step 3: Copy Backend to Staging
echo -e "${YELLOW}Step 3: Copying Backend to Staging...${NC}"
sshpass -e ssh -o StrictHostKeyChecking=no -o LogLevel=QUIET $SERVER "rsync -av --exclude='node_modules' --exclude='.env' /var/www/apms/backend/ /var/www/apms-staging/backend/ 2>/dev/null"
echo -e "${GREEN}✅ Backend copied${NC}"
echo ""

# Step 4: Create Staging Environment File
echo -e "${YELLOW}Step 4: Creating Staging Environment File...${NC}"
sshpass -e ssh -o StrictHostKeyChecking=no -o LogLevel=QUIET $SERVER "cat > /var/www/apms-staging/backend/.env << 'EOF'
NODE_ENV=staging
PORT=3012
DATABASE_URL=\"postgresql://apms_staging:staging_secure_password_2025@localhost:5432/apms_staging?schema=public\"
JWT_SECRET=\"staging-jwt-secret-key-2025-different-from-production\"
JWT_EXPIRES_IN=\"24h\"
FRONTEND_URL=\"https://apmsstaging.datacodesolution.com\"
API_URL=\"https://apmsstaging.datacodesolution.com/api\"
MAX_FILE_SIZE=10485760
UPLOAD_DIR=\"./uploads/staging\"
LOG_LEVEL=\"debug\"
EOF"
echo -e "${GREEN}✅ Environment file created${NC}"
echo ""

# Step 5: Install Dependencies
echo -e "${YELLOW}Step 5: Installing Dependencies...${NC}"
sshpass -e ssh -o StrictHostKeyChecking=no -o LogLevel=QUIET $SERVER "cd /var/www/apms-staging/backend && npm install --production --silent"
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 6: Run Prisma Migrations
echo -e "${YELLOW}Step 6: Running Prisma Migrations...${NC}"
sshpass -e ssh -o StrictHostKeyChecking=no -o LogLevel=QUIET $SERVER "cd /var/www/apms-staging/backend && NODE_ENV=staging npx prisma generate --silent 2>/dev/null && NODE_ENV=staging npx prisma db push --skip-generate"
echo -e "${GREEN}✅ Prisma migrations completed${NC}"
echo ""

# Step 7: Create PM2 Ecosystem
echo -e "${YELLOW}Step 7: Creating PM2 Ecosystem...${NC}"
sshpass -e ssh -o StrictHostKeyChecking=no -o LogLevel=QUIET $SERVER "cat > /var/www/apms-staging/backend/ecosystem.config.cjs << 'EOF'
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
EOF"
echo -e "${GREEN}✅ PM2 ecosystem created${NC}"
echo ""

# Step 8: Start Staging API
echo -e "${YELLOW}Step 8: Starting Staging API...${NC}"
sshpass -e ssh -o StrictHostKeyChecking=no -o LogLevel=QUIET $SERVER "pm2 delete apms-api-staging 2>/dev/null; sleep 1; pm2 start /var/www/apms-staging/backend/ecosystem.config.cjs 2>&1 | grep -v 'Tunneling' && pm2 save 2>&1 | grep -v 'Tunneling'"
echo -e "${GREEN}✅ Staging API started${NC}"
echo ""

# Step 9: Configure Nginx
echo -e "${YELLOW}Step 9: Configuring Nginx...${NC}"
sshpass -e ssh -o StrictHostKeyChecking=no -o LogLevel=QUIET $SERVER "cat > /etc/nginx/sites-available/apms-staging << 'EOF'
server {
    listen 80;
    server_name apmsstaging.datacodesolution.com;

    access_log /var/log/nginx/apms-staging-access.log;
    error_log /var/log/nginx/apms-staging-error.log;

    location /api/ {
        proxy_pass http://127.0.0.1:3012;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/apms-staging/frontend;
        expires 1y;
        add_header Cache-Control \"public, immutable\";
        try_files \$uri =404;
    }

    location / {
        root /var/www/apms-staging/frontend;
        try_files \$uri \$uri/ /index.html;
        add_header X-Environment \"staging\";
    }

    add_header X-Frame-Options \"SAMEORIGIN\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;
}
EOF
ln -sf /etc/nginx/sites-available/apms-staging /etc/nginx/sites-enabled/ && nginx -t 2>&1 | grep -v 'Tunneling' && systemctl reload nginx 2>&1 | grep -v 'Tunneling'"
echo -e "${GREEN}✅ Nginx configured${NC}"
echo ""

# Step 10: Deploy Frontend
echo -e "${YELLOW}Step 10: Deploying Frontend...${NC}"
cd /Users/endik/Projects/telecore-backup/frontend
REACT_APP_ENVIRONMENT=staging npm run build --silent 2>&1 | grep -E '(Creating|Compiled|File sizes|The build)'

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend built${NC}"

    echo "Uploading frontend..."
    sshpass -e rsync -avz --delete "build/" "$SERVER:/var/www/apms-staging/frontend/" 2>&1 | grep -E '(sent|received|total)' | tail -1

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Frontend deployed${NC}"
    else
        echo -e "${RED}❌ Failed to deploy frontend${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ STAGING DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Staging URLs:"
echo -e "  ${YELLOW}Frontend:${NC} https://apmsstaging.datacodesolution.com"
echo -e "  ${YELLOW}API:${NC}      https://apmsstaging.datacodesolution.com/api"
echo ""
echo "Staging Details:"
echo "  Database: apms_staging"
echo "  Port:     3012"
echo "  PM2:      apms-api-staging"
echo ""
echo "Useful Commands:"
echo "  pm2 logs apms-api-staging"
echo "  pm2 restart apms-api-staging"
echo "  pm2 monit"
echo ""
echo -e "${YELLOW}⚠️  Look for orange STAGING badge in header!${NC}"
echo ""
