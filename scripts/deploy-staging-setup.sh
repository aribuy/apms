#!/bin/bash

# Upload and execute staging setup script on remote server

SERVER="root@31.97.220.37"
SCRIPT_PATH="/Users/endik/Projects/telecore-backup/scripts/setup-staging.sh"
REMOTE_SCRIPT="/tmp/setup-staging.sh"

echo "📤 Uploading staging setup script to server..."
scp -o StrictHostKeyChecking=no "$SCRIPT_PATH" "$SERVER:$REMOTE_SCRIPT"

if [ $? -eq 0 ]; then
  echo "✅ Script uploaded successfully"
  echo ""
  echo "🚀 Executing staging setup on remote server..."
  echo ""
  ssh -o StrictHostKeyChecking=no "$SERVER" "bash $REMOTE_SCRIPT"
else
  echo "❌ Failed to upload script"
  exit 1
fi
