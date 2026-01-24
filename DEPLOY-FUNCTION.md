# ⚠️ IMPORTANT: Deploy Your Edge Function

The "Hello undefined!" response means the function **hasn't been deployed yet**. You're hitting the default template function.

## Quick Deploy Steps

### Option 1: Supabase Dashboard (Easiest - 2 minutes)

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project: `lxylfltutiqjlrbwzqvh`

2. **Navigate to Edge Functions:**
   - Click **"Edge Functions"** in the left sidebar
   - Click **"Create a new function"** button

3. **Create the function:**
   - **Function name**: `ingest-order` (exactly this name)
   - **Template**: Choose "Blank" or any template (we'll replace it)

4. **Copy the code:**
   - Open: `supabase/functions/ingest-order/index.ts` in your editor
   - Select ALL the code (Cmd+A / Ctrl+A)
   - Copy it (Cmd+C / Ctrl+C)

5. **Paste and deploy:**
   - In Supabase Dashboard, delete the template code
   - Paste your code
   - Click **"Deploy"** button (top right)

6. **Set environment variables:**
   - After deployment, click **"Settings"** tab
   - Add these secrets:
     - **SUPABASE_URL**: `https://lxylfltutiqjlrbwzqvh.supabase.co`
     - **SUPABASE_SERVICE_ROLE_KEY**: Your service role key (the `eyJ` JWT key from your .env.local)

7. **Test again:**
   ```bash
   ./test-order-ingestion.sh
   ```

### Option 2: Supabase CLI

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref lxylfltutiqjlrbwzqvh

# Deploy
cd "/Users/ghost/Downloads/Vici Peptides Dashboard"
supabase functions deploy ingest-order

# Set secrets (after deployment)
supabase secrets set SUPABASE_URL=https://lxylfltutiqjlrbwzqvh.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Verify Deployment

After deploying, test again. You should see:

**✅ Success Response:**
```json
{
  "success": true,
  "order_number": "Order #9999",
  "message": "Order ingested successfully",
  "data": { ... }
}
```

**❌ Current Response (Not Deployed):**
```json
{
  "message": "Hello undefined!"
}
```

## Troubleshooting

### Still seeing "Hello undefined!"?
- Make sure function name is exactly: `ingest-order`
- Check you're using the correct endpoint URL
- Verify the function shows as "Active" in dashboard
- Wait 30 seconds after deployment for propagation

### Getting errors after deployment?
- Check environment variables are set correctly
- Verify service role key is the `eyJ` JWT key (not `sb_publishable_`)
- Check function logs in Supabase Dashboard → Edge Functions → Logs

## Next Steps

Once deployed and working:
1. Test with the script: `./test-order-ingestion.sh`
2. Verify order appears in your dashboard
3. Set up Make.com integration (see `docs/make-com-integration.md`)
