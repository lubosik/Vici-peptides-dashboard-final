# Hostinger Deployment Guide for Vici Peptides Dashboard

## Prerequisites Check

Your Hostinger plan needs to support Node.js Web Apps. This feature is available on:
- ✅ **Business Web Hosting**
- ✅ **Cloud Startup/Professional/Enterprise**
- ✅ **VPS** (requires manual configuration)

If you don't see "Node.js Web Apps" in your hPanel, you may need to upgrade your plan.

## Step-by-Step Deployment

### Step 1: Access Node.js Web Apps

1. Log into your Hostinger hPanel
2. Navigate to **"Websites"** → **"Node.js Web Apps"** (or search for "Node.js" in the search bar)
3. If you don't see this option, your plan may not support it - contact Hostinger support or upgrade

### Step 2: Upload Your Project

**Option A: File Upload (Recommended for first deployment)**

1. In hPanel, go to **"File Manager"**
2. Navigate to `public_html` (or create a subdirectory like `dashboard`)
3. Upload the `vici-peptides-dashboard-deployment.zip` file
4. Right-click the zip file and select **"Extract"**
5. Extract to the current directory or a subdirectory

**Option B: GitHub Integration (If you have a GitHub repo)**

1. In Node.js Web Apps, click **"Add Node.js App"**
2. Select **"Connect GitHub Repository"**
3. Authorize Hostinger to access your GitHub
4. Select your repository
5. Skip to Step 4

### Step 3: Create Node.js App

1. In **"Node.js Web Apps"**, click **"Add Node.js App"**
2. Choose **"Upload Files"** (if you uploaded via File Manager)
3. Select the folder where you extracted the zip file
4. Or choose **"Select from File Manager"** and browse to your extracted folder

### Step 4: Configure Your App

Fill in the following details:

**App Name:** `vici-peptides-dashboard` (or any name you prefer)

**Node.js Version:** Select **20.x** (or latest available: 18.x, 20.x, 22.x, 24.x)

**Build Command:** 
```
npm run build
```

**Start Command:**
```
npm start
```

**Root Directory:** Leave as default (usually `/` or the folder name)

**Port:** Leave as default (Hostinger will assign automatically)

### Step 5: Configure Environment Variables

**CRITICAL:** Before deploying, you MUST set all environment variables!

1. In the Node.js App settings, find **"Environment Variables"** section
2. Click **"Add Variable"** for each of the following:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
WOOCOMMERCE_STORE_URL=your_woocommerce_store_url
WOOCOMMERCE_CONSUMER_KEY=your_woocommerce_consumer_key
WOOCOMMERCE_CONSUMER_SECRET=your_woocommerce_consumer_secret
```

**Optional (if using Shippo):**
```
SHIPPO_API_TOKEN=your_shippo_api_token
SHIPPO_ADDRESS_FROM_STREET1=your_address
SHIPPO_ADDRESS_FROM_CITY=your_city
SHIPPO_ADDRESS_FROM_STATE=your_state
SHIPPO_ADDRESS_FROM_ZIP=your_zip
SHIPPO_ADDRESS_FROM_COUNTRY=US
```

**Where to find these values:**
- **Supabase values:** Go to your Supabase project → Settings → API
- **WooCommerce values:** Go to WooCommerce → Settings → Advanced → REST API → Create/View API keys

### Step 6: Deploy

1. Click **"Deploy"** or **"Save"**
2. Hostinger will:
   - Install dependencies (`npm install`)
   - Build your app (`npm run build`)
   - Start your app (`npm start`)
3. Wait for the build to complete (this may take 5-10 minutes)
4. You'll see a success message with your app URL

### Step 7: Configure Domain (Optional)

If you want to use your domain `vicipeptides.com`:

1. In Node.js App settings, find **"Domains"** section
2. Click **"Add Domain"**
3. Enter `vicipeptides.com` or `dashboard.vicipeptides.com`
4. Follow the DNS configuration instructions if needed

### Step 8: Verify Deployment

1. Visit your app URL (provided by Hostinger)
2. Test the following:
   - ✅ Dashboard loads
   - ✅ Orders page shows real data
   - ✅ Products page loads
   - ✅ Expenses page loads
   - ✅ Search functionality works

## Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Solution: Make sure all dependencies are in `package.json`
- Check that `package-lock.json` is included in the zip

**Error: "Environment variable not found"**
- Solution: Ensure ALL environment variables are set in hPanel before building

**Error: "Out of memory"**
- Solution: Your plan may need more RAM. Contact Hostinger support or upgrade.

### App Won't Start

**Error: "Port already in use"**
- Solution: Hostinger manages ports automatically. Contact support if this persists.

**Error: "Cannot connect to Supabase"**
- Solution: Check your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Verify Supabase project is active and RLS policies allow reads

### App Loads But Shows Errors

**"404 Page not found" on order pages**
- Solution: This should be fixed in the latest version. Clear browser cache and try again.

**"No orders found"**
- Solution: Verify WooCommerce sync is working. Check Settings page for sync status.

## Post-Deployment Checklist

- [ ] All environment variables are set correctly
- [ ] App builds successfully
- [ ] App starts without errors
- [ ] Dashboard loads and shows data
- [ ] Orders page shows real WooCommerce orders
- [ ] Search functionality works
- [ ] Domain is configured (if using custom domain)
- [ ] SSL certificate is active (HTTPS)
- [ ] WooCommerce webhook URL is updated (if using Make.com)

## Updating Your App

To update your app after making changes:

1. Upload the new zip file to File Manager
2. Extract it (overwrite existing files)
3. In Node.js Web Apps, click **"Redeploy"** or **"Rebuild"**
4. Wait for the build to complete

## Support

If you encounter issues:
1. Check the build logs in Node.js Web Apps dashboard
2. Check the app logs for runtime errors
3. Contact Hostinger support if the issue is with their platform
4. Verify all environment variables are correct

## Important Notes

- **First build takes longer** (5-10 minutes) - be patient!
- **Environment variables must be set BEFORE building** - they won't work if added after
- **Node.js version**: Use 20.x if available, otherwise 18.x works fine
- **Disk space**: Your plan has 50GB - the app uses ~500MB after build
- **RAM**: Your plan has 3GB RAM - should be sufficient for Next.js

## Quick Reference

**Build Command:** `npm run build`
**Start Command:** `npm start`
**Node Version:** 20.x (or 18.x)
**Port:** Auto-assigned by Hostinger
**Root Directory:** `/` (or your folder name)

Good luck with your deployment! 🚀
