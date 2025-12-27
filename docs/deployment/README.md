# 🚀 Deployment Guide

## Overview

APMS deployment consists of:
- **Frontend**: React SPA (served by Nginx)
- **Backend**: Node.js/Express API (PM2 managed)
- **Database**: PostgreSQL
- **Reverse Proxy**: Nginx with SSL

---

## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ or CentOS 7+
- **Node.js**: v18+
- **Database**: PostgreSQL 14+
- **Memory**: 2GB+ RAM
- **Storage**: 20GB+ SSD

### Required Software
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Nginx
sudo apt-get install -y nginx

# PM2
sudo npm install -g pm2

# Git
sudo apt-get install -y git
```

---

## Environment Setup

### 1. Clone Repository

```bash
cd /var/www
git clone git@github.com:aribuy/apms.git
cd apms
```

### 2. Backend Configuration

```bash
cd /var/www/apms/backend

# Install dependencies
npm install --production

# Create environment file
cp .env.example .env
nano .env
```

**Environment Variables**:
```bash
NODE_ENV=production
PORT=3011
DATABASE_URL=postgresql://user:password@localhost:5432/apms_db
JWT_SECRET=your-super-secret-key-change-this
CORS_ORIGIN=https://apms.datacodesolution.com
```

### 3. Database Setup

```bash
# Create database
sudo -u postgres createdb apms_db

# Create user
sudo -u postgres createuser apms_user

# Grant privileges
sudo -u postgres psql
ALTER USER apms_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE apms_db TO apms_user;
\q

# Run migrations
cd /var/www/apms/backend/migrations
psql -U apms_user -d apms_db -f 001_user_management_core.sql
psql -U apms_user -d apms_db -f 002_load_geography.sql
# ... continue with all migrations
```

### 4. Frontend Build

```bash
cd /var/www/apms/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Output: /var/www/apms/frontend/build/
```

---

## Nginx Configuration

### Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/apms
```

```nginx
server {
    server_name apms.datacodesolution.com;

    root /var/www/apms/frontend/build;
    index index.html;

    # Logs
    error_log /var/log/nginx/apms_error.log;
    access_log /var/log/nginx/apms_access.log;

    # Frontend static files
    location / {
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:3011;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/javascript application/xml+rss application/json;

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/apms.datacodesolution.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/apms.datacodesolution.com/privkey.pem;
}

# HTTP to HTTPS redirect
server {
    if ($host = apms.datacodesolution.com) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name apms.datacodesolution.com;
    return 404;
}
```

### Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/apms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## PM2 Configuration

### Create Ecosystem File

```bash
cat > /var/www/apms/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'apms-api',
    script: './server.js',
    cwd: '/var/www/apms/backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3011
    },
    error_file: './logs/api-error.log',
    out_file: './logs/api-out.log',
    log_file: './logs/api-combined.log',
    max_memory_restart: '500M',
    restart_delay: 4000
  }]
}
EOF
```

### Start with PM2

```bash
# Create logs directory
mkdir -p /var/www/apms/backend/logs

# Start application
pm2 start /var/www/apms/ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command output
```

---

## SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d apms.datacodesolution.com

# Auto-renewal (already configured)
sudo certbot renew --dry-run
```

---

## Verification

### Check Services

```bash
# PM2 process
pm2 status
pm2 logs apms-api

# Nginx
sudo systemctl status nginx

# Backend API
curl http://127.0.0.1:3011/api/v1/auth/login

# Frontend
curl -I https://apms.datacodesolution.com
```

### Test Login

```bash
curl -X POST https://apms.datacodesolution.com/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@apms.com","password":"Admin123!"}'
```

---

## Deployment Checklist

- [ ] Repository cloned
- [ ] Dependencies installed (backend + frontend)
- [ ] Environment variables configured
- [ ] Database created and migrations run
- [ ] Frontend built successfully
- [ ] Nginx configured and enabled
- [ ] SSL certificate obtained
- [ ] PM2 process running
- [ ] PM2 startup script configured
- [ ] Firewall configured (ports 80, 443, 22)
- [ ] DNS records pointing correctly
- [ ] Application accessible via HTTPS
- [ ] Login functionality working

---

## Maintenance

### Update Application

```bash
cd /var/www/apms
git pull origin main

# Backend
cd backend
npm install --production
pm2 restart apms-api

# Frontend
cd ../frontend
npm install
npm run build

# Reload Nginx
sudo systemctl reload nginx
```

### Database Backup

```bash
# Create backup
pg_dump -U apms_user apms_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Compress
gzip backup_*.sql

# Store externally (NEVER commit to git)
scp backup_*.sql.gz user@backup-server:/backups/apms/
```

### View Logs

```bash
# PM2 logs
pm2 logs apms-api
pm2 logs apms-api --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/apms_access.log
sudo tail -f /var/log/nginx/apms_error.log
```

### Monitor Performance

```bash
# PM2 monitoring
pm2 monit

# System resources
htop
df -h
free -h
```

---

## Troubleshooting

### 502 Bad Gateway
- Check if PM2 process is running: `pm2 status`
- Check backend logs: `pm2 logs apms-api`
- Verify port 3011 is listening: `lsof -i:3011`
- Check Nginx error logs: `sudo tail -f /var/log/nginx/apms_error.log`

### Database Connection Issues
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check credentials in `.env`
- Test connection: `psql -U apms_user -d apms_db -h localhost`

### Frontend Not Loading
- Check build directory exists: `ls -la /var/www/apms/frontend/build/`
- Verify Nginx config: `sudo nginx -t`
- Check Nginx is running: `sudo systemctl status nginx`

### High Memory Usage
- Restart PM2: `pm2 restart apms-api`
- Check for memory leaks in code
- Consider adding more RAM or using cluster mode

---

## Security Hardening

### Firewall (UFW)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Fail2Ban

```bash
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Regular Updates

```bash
# System updates
sudo apt-get update
sudo apt-get upgrade -y

# Node.js dependencies
cd /var/www/apms
npm audit fix
```

---

## Rollback Procedure

If deployment fails:

```bash
# Stop PM2
pm2 stop apms-api

# Revert to previous commit
cd /var/www/apms
git log --oneline -5  # Find previous commit
git checkout <previous-commit-hash>

# Reinstall & restart
cd backend && npm install --production
cd ../frontend && npm install && npm run build
pm2 restart apms-api
```

---

## Support

- **Documentation**: [Start Here](../00-start-here.md)
- **Issues**: GitHub Issues
- **Emergency**: [Dev Lead Contact]

---

**Last Updated**: 2025-12-27
**Environment**: Production
