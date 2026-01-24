# Deploy Edge Function Guide

## Quick Deploy

Your Edge Function endpoint is ready at:
```
https://lxylfltutiqjlrbwzqvh.supabase.co/functions/v1/ingest-order
```

## Option 1: Deploy via Supabase Dashboard (Easiest)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `lxylfltutiqjlrbwzqvh`
3. Navigate to **Edge Functions** in the sidebar
4. Click **"Create a new function"**
5. Name it: `ingest-order`
6. Copy the contents of `supabase/functions/ingest-order/index.ts`
7. Paste into the code editor
8. Click **"Deploy"**

## Option 2: Deploy via Supabase CLI

### Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Or via npm
npm install -g supabase
```

### Login and Link

```bash
# Login to Supabase
supabase login

# Link to your project (get project ref from dashboard URL)
supabase link --project-ref lxylfltutiqjlrbwzqvh
```

### Deploy Function

```bash
cd "/Users/ghost/Downloads/Vici Peptides Dashboard"
supabase functions deploy ingest-order
```

## Set Environment Variables

After deploying, set these in Supabase Dashboard → Edge Functions → Settings:

1. **SUPABASE_URL**: `https://lxylfltutiqjlrbwzqvh.supabase.co`
2. **SUPABASE_SERVICE_ROLE_KEY**: Your service role key (the `eyJ` JWT key from your .env.local)

## Test the Function

Use your curl command with a real order payload:

```bash
curl -L -X POST 'https://lxylfltutiqjlrbwzqvh.supabase.co/functions/v1/ingest-order' \
  -H 'Authorization: Bearer sb_publishable_J_rGqkvlPRxuZ3_NtnbTPw_4QfKCpeD' \
  -H 'apikey: sb_publishable_J_rGqkvlPRxuZ3_NtnbTPw_4QfKCpeD' \
  -H 'Content-Type: application/json' \
  --data '{
    "id": 1281,
    "number": "1281",
    "status": "completed",
    "date_created": "2024-01-15T10:30:00",
    "billing": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    },
    "line_items": [
      {
        "id": 123,
        "name": "Test Product",
        "product_id": 108,
        "quantity": 2,
        "price": "130.00"
      }
    ],
    "shipping_lines": [],
    "coupon_lines": [],
    "total": "260.00",
    "payment_method": "stripe"
  }'
```

## Expected Response

```json
{
  "success": true,
  "order_number": "Order #1281",
  "message": "Order ingested successfully",
  "data": { ... }
}
```

## Troubleshooting

### Function shows in red in IDE
- This is normal! The IDE doesn't understand Deno types
- The function will work fine when deployed to Supabase
- The red errors are false positives from TypeScript

### "Missing Supabase environment variables"
- Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Edge Function settings
- Go to: Dashboard → Edge Functions → ingest-order → Settings

### "Failed to upsert order"
- Check that products exist in the `products` table first
- Verify RLS policies allow service role key
- Check database logs in Supabase Dashboard

### Function not found (404)
- Ensure function is deployed
- Check function name matches exactly: `ingest-order`
- Verify project ref in URL is correct

## Next Steps

After deployment:
1. Test with a sample order
2. Set up Make.com integration (see `docs/make-com-integration.md`)
3. Monitor ingestion via `ingestion_audit` table
4. Verify orders appear in dashboard
