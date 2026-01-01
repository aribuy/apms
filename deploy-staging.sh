#!/bin/bash

# Staging Deployment Script
# This will setup and deploy staging environment on the same server as production

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

# Install sshpass if not available (for automation)
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}Installing sshpass for automated SSH...${NC}"
    brew install hudochenkov/sshpass/sshpass 2>/dev/null || {
        echo -e "${RED}Failed to install sshpass. Please install manually:${NC}"
        echo "  brew install hudochenkov/sshpass/sshpass"
        echo ""
        echo "Or run deployment commands manually."
        exit 1
    }
fi

# Step 1: Create Staging Database
echo -e "${YELLOW}Step 1: Creating Staging Database...${NC}"
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER << 'ENDSSH'
echo "Creating staging database..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS apms_staging;"
sudo -u postgres psql -c "CREATE DATABASE apms_staging;"
sudo -u postgres psql -c "CREATE USER IF NOT EXISTS apms_staging WITH PASSWORD 'staging_secure_password_2025';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE apms_staging TO apms_staging;"
echo "✅ Staging database created"
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create database${NC}"
    exit 1
fi
echo ""

# Step 2: Create Staging Directories
echo -e "${YELLOW}Step 2: Creating Staging Directories...${NC}"
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER << 'ENDSSH'
mkdir -p /var/www/apms-staging/backend
mkdir -p /var/www/apms-staging/frontend
mkdir -p /var/www/apms-staging/uploads
mkdir -p /var/www/apms-staging/logs
echo "✅ Directories created"
ENDSSH
echo -e "${GREEN}✅ Directories created${NC}"
echo ""

# Step 3: Copy Backend to Staging
echo -e "${YELLOW}Step 3: Copying Backend to Staging...${NC}"
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER << 'ENDSSH'
rsync -av --exclude='node_modules' --exclude='.env' \
  /var/www/apms/backend/ /var/www/apms-staging/backend/
echo "✅ Backend copied"
ENDSSH
echo -e "${GREEN}✅ Backend copied${NC}"
echo ""

# Step 4: Create Staging Environment File
echo -e "${YELLOW}Step 4: Creating Staging Environment File...${NC}"
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER << 'ENDSSH'
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
echo "✅ Environment file created"
ENDSSH
echo -e "${GREEN}✅ Environment file created${NC}"
echo ""

# Step 5: Install Dependencies
echo -e "${YELLOW}Step 5: Installing Dependencies...${NC}"
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER << 'ENDSSH'
cd /var/www/apms-staging/backend
npm install --production
echo "✅ Dependencies installed"
ENDSSH
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 6: Run Prisma Migrations
echo -e "${YELLOW}Step 6: Running Prisma Migrations...${NC}"
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER << 'ENDSSH'
cd /var/www/apms-staging/backend
NODE_ENV=staging npx prisma generate
NODE_ENV=staging npx prisma db push --skip-generate
echo "✅ Prisma migrations completed"
ENDSSH
echo -e "${GREEN}✅ Prisma migrations completed${NC}"
echo ""

# Step 7: Create PM2 Ecosystem
echo -e "${YELLOW}Step 7: Creating PM2 Ecosystem...${NC}"
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER << 'ENDSSH'
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
echo "✅ PM2 ecosystem created"
ENDSSH
echo -e "${GREEN}✅ PM2 ecosystem created${NC}"
echo ""

# Step 8: Start Staging API
echo -e "${YELLOW}Step 8: Starting Staging API...${NC}"
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER << 'ENDSSH'
pm2 delete apms-api-staging 2>/dev/null || true
sleep 2
pm2 start /var/www/apms-staging/backend/ecosystem.config.cjs
pm2 save
echo "✅ Staging API started"
ENDSSH
echo -e "${GREEN}✅ Staging API started${NC}"
echo ""

# Step 9: Configure Nginx
echo -e "${YELLOW}Step 9: Configuring Nginx...${NC}"
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER << 'ENDSSH'
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

ln -sf /etc/nginx/sites-available/apms-staging /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
echo "✅ Nginx configured"
ENDSSH
echo -e "${GREEN}✅ Nginx configured${NC}"
echo ""

# Step 10: Deploy Frontend
echo -e "${YELLOW}Step 10: Deploying Frontend...${NC}"
cd /Users/endik/Projects/telecore-backup/frontend
REACT_APP_ENVIRONMENT=staging npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend built${NC}"

    echo "Uploading frontend to staging..."
    sshpass -p "$PASSWORD" rsync -avz --delete \
      build/ $SERVER:/var/www/apms-staging/frontend/

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

# Step 11: Verification
echo -e "${YELLOW}Step 11: Verifying Deployment...${NC}"
echo ""
echo "Checking PM2 processes..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER "pm2 list"
echo ""
echo "Checking listening ports..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER "netstat -tlnp | grep -E '3011|3012'"
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
echo "  View logs:     ssh root@31.97.220.37 'pm2 logs apms-api-staging'"
echo "  Restart:       ssh root@31.97.220.37 'pm2 restart apms-api-staging'"
echo "  Stop:          ssh root@31.97.220.37 'pm2 stop apms-api-staging'"
echo "  Monitor:       ssh root@31.97.220.37 'pm2 monit'"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: STAGING has orange badge in header!${NC}"
echo -e "${YELLOW}⚠️  Production remains at https://apms.datacodesolution.com${NC}"
echo ""
