# 🚀 Quick Start: Deploy to Hostinger

## ✅ Pre-Deployment Checklist

Before you start, verify your Hostinger plan supports Node.js:

1. **Check if you have Node.js Web Apps:**
   - Log into hPanel
   - Look for "Node.js Web Apps" in the left menu under "Websites"
   - If you see it → ✅ You're good to go!
   - If you DON'T see it → You may need to upgrade to Business Web Hosting or Cloud plan

## 📦 Step 1: Upload Files

**IMPORTANT:** If you got a 500 error when extracting, use Method A instead!

### Method A: Direct Upload via Node.js Web Apps (Recommended - No Extraction Needed!)

1. **Go to "Node.js Web Apps"** in hPanel
2. **Click "Add Node.js App"**
3. **Choose "Upload Files"**
4. **Upload `vici-peptides-dashboard-deployment.zip`** directly
5. **Hostinger will extract it automatically** - Skip to Step 3!

### Method B: File Manager (If Method A doesn't work)

1. **Open File Manager in hPanel**
2. **Navigate to `public_html/dashboard/`** (create folder if needed)
3. **Upload `vici-peptides-dashboard-deployment.zip`**
4. **Right-click the zip → Extract**
5. **CRITICAL:** In extraction dialog, ensure path is `public_html/dashboard/` (NOT `public_html/dashboard/vici-peptides-dashboard/`)
6. **Extract directly to current directory** (remove any folder name from path)

## 🔧 Step 2: Create Node.js App

1. **Go to "Node.js Web Apps"** in hPanel
2. **Click "Add Node.js App"**
3. **Select "Upload Files"** or **"Select from File Manager"**
4. **Choose the folder** where you extracted the files

## ⚙️ Step 3: Configure App Settings

**App Name:** `vici-dashboard` (or any name)

**Node.js Version:** `20.x` (or `18.x` if 20.x not available)

**Build Command:**
```
npm run build
```

**Start Command:**
```
npm start
```

## 🔐 Step 4: Add Environment Variables

**CRITICAL:** Add these BEFORE deploying!

In the "Environment Variables" section, add:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
WOOCOMMERCE_STORE_URL=your_woocommerce_store_url
WOOCOMMERCE_CONSUMER_KEY=your_woocommerce_consumer_key
WOOCOMMERCE_CONSUMER_SECRET=your_woocommerce_consumer_secret
SHIPPO_API_TOKEN=your_shippo_api_token_here
SHIPPO_ADDRESS_FROM_STREET1=390 NE 191st St, Ste 58434
SHIPPO_ADDRESS_FROM_CITY=Miami
SHIPPO_ADDRESS_FROM_STATE=FL
SHIPPO_ADDRESS_FROM_ZIP=33179
SHIPPO_ADDRESS_FROM_COUNTRY=US
```

## 🚀 Step 5: Deploy

1. **Click "Deploy"** or **"Save"**
2. **Wait 5-10 minutes** for the build to complete
3. **Check the build logs** for any errors
4. **Copy your app URL** when deployment succeeds

## 🌐 Step 6: Connect Your Domain (Optional)

If you want to use `vicipeptides.com` or `dashboard.vicipeptides.com`:

1. In Node.js App settings → **"Domains"**
2. Click **"Add Domain"**
3. Enter your domain
4. Follow DNS instructions if needed

## ✅ Step 7: Test

Visit your app URL and verify:
- ✅ Dashboard loads
- ✅ Orders page shows real data (not demo)
- ✅ All pages work
- ✅ Search works

## 🆘 Need Help?

**If you don't see "Node.js Web Apps":**
- Contact Hostinger support
- Ask: "Does my plan support Node.js Web Apps?"
- If not, upgrade to Business Web Hosting or Cloud plan

**If build fails:**
- Check build logs in Node.js Web Apps
- Verify all environment variables are set
- Make sure Node.js version is 18.x or 20.x

**If app won't start:**
- Check app logs
- Verify Supabase connection
- Test `/api/healthcheck` endpoint

---

📖 **Full detailed guide:** See `HOSTINGER-DEPLOYMENT.md`
