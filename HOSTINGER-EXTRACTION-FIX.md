# Fix for 500 Error When Extracting Zip on Hostinger

## The Problem
When extracting the zip file in Hostinger's File Manager, you're getting a 500 error and an empty folder.

## Solution: Extract Directly to Target Directory

### Method 1: Extract to Current Directory (Recommended)

1. **Navigate to where you want the files** (e.g., `public_html/dashboard/`)
2. **Upload the zip file** to that directory
3. **Right-click the zip file** → Select **"Extract"**
4. **IMPORTANT:** When the extraction dialog appears:
   - **DO NOT** create a new folder
   - Extract **directly to the current directory**
   - Make sure the path shows: `public_html/dashboard/` (not `public_html/dashboard/vici-peptides-dashboard/`)

### Method 2: Use Terminal/SSH (If Available)

If you have SSH access:

```bash
cd public_html/dashboard
unzip vici-peptides-dashboard-deployment.zip
```

### Method 3: Extract Manually via File Manager

1. Upload zip to `public_html/dashboard/`
2. Right-click zip → Extract
3. In extraction dialog, **remove any folder name** from the path
4. Extract directly to `public_html/dashboard/`

## What Should Happen

After extraction, you should see files like:
- `package.json`
- `next.config.js`
- `app/` folder
- `components/` folder
- `lib/` folder
- etc.

**NOT** a folder containing these files.

## If You Still Get 500 Error

1. **Check file permissions:**
   - Files should be `644`
   - Folders should be `755`

2. **Try extracting in smaller batches:**
   - The zip is 5.1MB - if it times out, contact Hostinger support

3. **Alternative: Use Node.js Web Apps Upload:**
   - Instead of File Manager, use Node.js Web Apps → Add App → Upload Files
   - This might handle extraction better

4. **Contact Hostinger Support:**
   - If the error persists, it might be a server-side issue
   - Ask them to extract the zip for you

## Verification

After extraction, you should see:
- ✅ `package.json` at the root
- ✅ `app/` folder with files inside
- ✅ `components/` folder with files inside
- ✅ No nested "vici-peptides-dashboard" folder

If you see a folder with the zip name, that's the problem - extract directly to the parent directory instead.
