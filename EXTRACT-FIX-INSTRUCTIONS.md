# 🔧 Fix: 500 Error When Extracting Zip on Hostinger

## The Issue
When you extract the zip in Hostinger's File Manager, you get:
- ❌ 500 Internal Server Error
- ❌ Empty folder created
- ❌ Files not extracted

## ✅ Solution: Use Node.js Web Apps Direct Upload

**BEST METHOD:** Skip File Manager extraction entirely!

### Step-by-Step:

1. **Go to Node.js Web Apps in hPanel**
   - Navigate to: Websites → Node.js Web Apps
   - Click "Add Node.js App"

2. **Choose "Upload Files"**
   - Select "Upload Files" option
   - Upload the `vici-peptides-dashboard-deployment.zip` directly
   - Hostinger will extract it automatically

3. **OR: Extract via Terminal (If you have SSH access)**

   If you have SSH/terminal access:
   ```bash
   cd public_html/dashboard
   unzip -o vici-peptides-dashboard-deployment.zip
   ```

## Alternative: Manual Extraction Fix

If you MUST use File Manager:

1. **Delete the empty folder** that was created
2. **Navigate to `public_html/dashboard/`** (or wherever you want files)
3. **Upload the zip** to that directory
4. **Right-click zip → Extract**
5. **In the extraction dialog:**
   - **Path should be:** `public_html/dashboard/`
   - **NOT:** `public_html/dashboard/vici-peptides-dashboard/`
   - Remove any folder name from the path
6. **Click Extract**

## What You Should See After Extraction

In `public_html/dashboard/`, you should see:
```
✅ package.json
✅ next.config.js  
✅ app/ (folder with files)
✅ components/ (folder with files)
✅ lib/ (folder with files)
✅ public/ (folder)
✅ And other files/folders
```

**You should NOT see:**
- ❌ A folder named "vici-peptides-dashboard" containing these files
- ❌ An empty folder
- ❌ Just the zip file

## If Still Getting 500 Error

1. **Check Hostinger server logs** (if available)
2. **Try a smaller test zip** first to verify extraction works
3. **Contact Hostinger Support:**
   - Ask them to extract the zip file for you
   - Mention: "Getting 500 error when extracting 5.1MB zip file"
   - They can extract it via their backend

## Recommended: Use Node.js Web Apps Upload

The easiest way is to let Hostinger's Node.js Web Apps feature handle everything:

1. Go to **Node.js Web Apps**
2. Click **"Add Node.js App"**
3. Choose **"Upload Files"**
4. Upload the zip
5. Hostinger extracts and sets it up automatically

This avoids File Manager extraction issues entirely!
