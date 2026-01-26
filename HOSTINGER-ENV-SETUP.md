# Environment Variables Setup for Hostinger

Copy these environment variables into your Hostinger Node.js Web App settings.

## Required Environment Variables

### Supabase Configuration

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**How to find:**
1. Go to https://supabase.com
2. Select your project
3. Go to Settings → API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### WooCommerce Configuration

```
WOOCOMMERCE_STORE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=ck_your_consumer_key
WOOCOMMERCE_CONSUMER_SECRET=cs_your_consumer_secret
```

**How to find:**
1. Log into your WooCommerce admin
2. Go to WooCommerce → Settings → Advanced → REST API
3. Click "Add Key" or view existing keys
4. Copy:
   - **Consumer Key** → `WOOCOMMERCE_CONSUMER_KEY`
   - **Consumer Secret** → `WOOCOMMERCE_CONSUMER_SECRET`
   - **Store URL** (your WordPress site URL) → `WOOCOMMERCE_STORE_URL`

### Optional: Shippo Shipping Integration

```
SHIPPO_API_TOKEN=shippo_test_xxxxxxxxxxxxx
SHIPPO_ADDRESS_FROM_STREET1=123 Main St
SHIPPO_ADDRESS_FROM_CITY=Your City
SHIPPO_ADDRESS_FROM_STATE=CA
SHIPPO_ADDRESS_FROM_ZIP=12345
SHIPPO_ADDRESS_FROM_COUNTRY=US
```

**How to find:**
1. Go to https://goshippo.com
2. Sign up or log in
3. Go to Settings → API
4. Copy your API token

## How to Add in Hostinger

1. In Node.js Web Apps, select your app
2. Find **"Environment Variables"** section
3. Click **"Add Variable"**
4. Enter the **Variable Name** (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
5. Enter the **Variable Value** (your actual value)
6. Click **"Save"**
7. Repeat for each variable
8. **IMPORTANT:** After adding all variables, click **"Redeploy"** or **"Rebuild"**

## Security Notes

- ⚠️ **Never commit these values to GitHub**
- ⚠️ **Never share these values publicly**
- ✅ **Only add them in Hostinger's secure environment variable section**
- ✅ **The `.env.local` file is excluded from the zip file for security**

## Verification

After setting environment variables and deploying, test:
1. Visit your app URL
2. Check if dashboard loads
3. Check browser console for any errors
4. Visit `/api/healthcheck` to verify Supabase connection
