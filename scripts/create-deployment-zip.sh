#!/bin/bash

# Script to create a deployment zip file for Hostinger
# Excludes node_modules, .next, .git, and sensitive files

ZIP_NAME="vici-peptides-dashboard-deployment.zip"
TEMP_DIR="deployment-temp"

echo "📦 Creating deployment zip file for Hostinger..."

# Clean up any existing temp directory
rm -rf "$TEMP_DIR"
rm -f "$ZIP_NAME"

# Create temp directory
mkdir -p "$TEMP_DIR"

# Copy all files except those in .gitignore and build artifacts
echo "📋 Copying files..."

# Copy all files, excluding patterns
rsync -av \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='.env.local' \
  --exclude='.env' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  --exclude='*.zip' \
  --exclude='deployment-temp' \
  --exclude='.cursor' \
  --exclude='.vscode' \
  --exclude='coverage' \
  --exclude='.turbo' \
  --exclude='dist' \
  --exclude='build' \
  ./ "$TEMP_DIR/"

# Create .env.example if .env.local exists (without sensitive values)
if [ -f ".env.local" ]; then
  echo "📝 Creating .env.example from .env.local..."
  grep -v "SUPABASE.*=" .env.local | grep -v "WOOCOMMERCE.*=" | grep -v "SHIPPO.*=" | sed 's/=.*/=YOUR_VALUE_HERE/' > "$TEMP_DIR/.env.example" || true
fi

# Create a README for deployment
cat > "$TEMP_DIR/DEPLOYMENT.md" << 'EOF'
# Deployment Instructions for Hostinger

## Prerequisites
- Hostinger Business Web Hosting, Cloud, or VPS plan
- Node.js 18.x, 20.x, 22.x, or 24.x

## Environment Variables
Before deploying, configure these environment variables in Hostinger's hPanel:

1. Copy `.env.example` to `.env.local`
2. Fill in your actual values:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - WOOCOMMERCE_STORE_URL
   - WOOCOMMERCE_CONSUMER_KEY
   - WOOCOMMERCE_CONSUMER_SECRET
   - SHIPPO_API_TOKEN (optional)
   - Other required variables

## Deployment Steps

### Option 1: GitHub Integration (Recommended)
1. Push this code to a GitHub repository
2. In Hostinger hPanel, go to Node.js Web Apps
3. Click "Add Node.js App"
4. Connect your GitHub repository
5. Hostinger will automatically build and deploy

### Option 2: File Upload
1. Upload this zip file to Hostinger via File Manager
2. Extract the files
3. In hPanel, go to Node.js Web Apps
4. Click "Add Node.js App"
5. Select the extracted folder
6. Configure environment variables
7. Set build command: `npm run build`
8. Set start command: `npm start`
9. Deploy

## Build Settings
- Build Command: `npm run build`
- Start Command: `npm start`
- Node Version: 20.x (or latest available)

## Post-Deployment
1. Run database migrations in Supabase dashboard
2. Configure your domain in Hostinger
3. Test the application

## Notes
- The `.next` folder will be generated during build
- `node_modules` will be installed automatically during deployment
- Make sure all environment variables are set before building
EOF

# Create the zip file - ensure files are at root level, not in a subdirectory
echo "🗜️  Creating zip file..."
cd "$TEMP_DIR"
# Create zip with files at root level (no parent directory)
# Using * ensures all files/folders are included at root level
zip -r "../$ZIP_NAME" . -x "*.DS_Store" "*.log" "*.zip" "deployment-temp/*"
cd ..

# Clean up temp directory
rm -rf "$TEMP_DIR"

echo "✅ Deployment zip created: $ZIP_NAME"
echo "📦 File size: $(du -h "$ZIP_NAME" | cut -f1)"
echo ""
echo "📝 Next steps:"
echo "1. Upload $ZIP_NAME to Hostinger"
echo "2. Extract the files"
echo "3. Configure environment variables in hPanel"
echo "4. Deploy using Node.js Web Apps feature"
