#!/bin/bash

# DEPLOYMENT SCRIPT - APMS Production
# Server: apms.datacodesolution.com
# Date: 2025-12-28

set -e  # Exit on error

# Configuration
SERVER="apms@apms.datacodesolution.com"
REMOTE_PATH="/var/www/apms"
BACKUP_PATH="/backups/apms/$(date +%Y%m%d)"
LOCAL_PATH="/Users/endik/Projects/telecore-backup"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     DEPLOY TO PRODUCTION - apms.datacodesolution.com        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_step() {
    echo ""
    echo "═══ $1 ═══"
}

# Step 1: Test SSH Connection
print_step "Step 1: Testing SSH Connection"
echo "Connecting to $SERVER..."

if ssh -o ConnectTimeout=10 $SERVER "echo 'Connection successful'"; then
    print_success "SSH connection established"
else
    print_error "Cannot connect to server. Please check SSH keys and server address."
    exit 1
fi

# Step 2: Create Backup
print_step "Step 2: Creating Backup"

ssh $SERVER << 'ENDSSH'
    # Create backup directory
    mkdir -p $BACKUP_PATH

    echo "Backing up backend..."
    cd $REMOTE_PATH/backend
    tar -czf $BACKUP_PATH/backend-backup.tar.gz . 2>/dev/null || true

    echo "Backing up frontend..."
    cd $REMOTE_PATH/frontend
    tar -czf $BACKUP_PATH/frontend-backup.tar.gz . 2>/dev/null || true

    echo "Backup completed: $BACKUP_PATH"
ENDSSH

print_success "Backup created at $BACKUP_PATH"

# Step 3: Install LibreOffice
print_step "Step 3: Installing LibreOffice on Server"

ssh $SERVER << 'ENDSSH'
    # Check if LibreOffice is installed
    if ! command -v libreoffice &> /dev/null; then
        echo "LibreOffice not found. Installing..."
        sudo apt-get update -qq
        sudo apt-get install -y libreoffice --yes
        echo "LibreOffice installed successfully"
    else
        echo "LibreOffice already installed:"
        libreoffice --version
    fi
ENDSSH

print_success "LibreOffice is installed"

# Step 4: Deploy Backend Files
print_step "Step 4: Deploying Backend Files"

echo "Uploading new files..."

# Upload document converter utility
scp $LOCAL_PATH/backend/src/utils/documentConverter.js \
    $SERVER:$REMOTE_PATH/backend/src/utils/

print_success "Uploaded: documentConverter.js"

# Upload modified upload routes
scp $LOCAL_PATH/backend/src/routes/atpUploadRoutes.js \
    $SERVER:$REMOTE_PATH/backend/src/routes/

print_success "Uploaded: atpUploadRoutes.js"

# Step 5: Install Dependencies
print_step "Step 5: Installing NPM Dependencies"

ssh $SERVER << 'ENDSSH'
    cd $REMOTE_PATH/backend

    echo "Installing libreoffice-convert package..."
    npm install libreoffice-convert@1.7.0 --save

    echo "Verifying installation..."
    if npm list libreoffice-convert | grep -q "libreoffice-convert@1.7.0"; then
        echo "✅ libreoffice-convert installed successfully"
    else
        echo "❌ Failed to install libreoffice-convert"
        exit 1
    fi
ENDSSH

print_success "Dependencies installed"

# Step 6: Restart Backend Service
print_step "Step 6: Restarting Backend Service"

ssh $SERVER << 'ENDSSH'
    cd $REMOTE_PATH/backend

    # Check if using PM2
    if command -v pm2 &> /dev/null; then
        echo "Restarting PM2 process..."
        pm2 restart apms-backend || pm2 restart backend

    # Check if using systemd
    elif systemctl is-active --quiet apms-backend; then
        echo "Restarting systemd service..."
        sudo systemctl restart apms-backend

    # Fallback: manual restart
    else
        echo "No service manager found. Please restart manually."
        exit 1
    fi

    echo "Service restarted"
ENDSSH

print_success "Backend service restarted"

# Step 7: Verify Deployment
print_step "Step 7: Verifying Deployment"

sleep 3  # Give services time to start

# Check if backend is responding
if curl -s -f http://apms.datacodesolution.com/api/v1/health > /dev/null 2>&1; then
    print_success "Backend API is responding"
else
    print_warning "Backend API health check failed. Please verify manually."
fi

# Check logs
ssh $SERVER << 'ENDSSH'
    cd $REMOTE_PATH/backend

    echo "Checking recent logs..."
    if command -v pm2 &> /dev/null; then
        pm2 logs apms-backend --lines 20 --nostream
    elif [ -f "logs/app.log" ]; then
        tail -n 20 logs/app.log
    else
        echo "No logs found"
    fi
ENDSSH

# Step 8: Summary
print_step "Deployment Summary"

echo ""
echo "Deployment completed!"
echo ""
echo "📋 What was deployed:"
echo "  ✅ Backend: documentConverter.js (NEW)"
echo "  ✅ Backend: atpUploadRoutes.js (MODIFIED)"
echo "  ✅ Dependencies: libreoffice-convert@1.7.0"
echo "  ✅ System: LibreOffice installed"
echo ""
echo "🔍 Next Steps:"
echo "  1. Test Site Registration → Auto-create Tasks"
echo "  2. Test Upload PDF Document"
echo "  3. Test Upload Word Document → Auto-convert to PDF"
echo "  4. Test Auto-Categorization"
echo "  5. Test Bulk Upload"
echo "  6. Monitor logs for errors"
echo ""
echo "🌐 Production URL: http://apms.datacodesolution.com"
echo ""
echo "📝 To rollback if needed:"
echo "  ssh $SERVER"
echo "  cd $REMOTE_PATH/backend"
echo "  tar -xzf $BACKUP_PATH/backend-backup.tar.gz"
echo "  pm2 restart apms-backend"
echo ""
print_success "Deployment script completed!"
