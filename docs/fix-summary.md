# Dashboard Fix Summary

## Issues Fixed

### 1. Edge Function Fixes ✅
- **Fixed import path**: Changed from `https://esm.sh/@supabase/supabase-js@2` to `https://esm.sh/@supabase/supabase-js@2?target=deno` for Deno compatibility
- **Fixed upsert conflicts**: Changed `onConflict: 'uq_order_lines_unique'` (constraint name) to `onConflict: 'order_number,product_id,our_cost_per_unit,customer_paid_per_unit'` (column names)
- **Fixed order upsert**: Changed `onConflict: 'order_number'` to use column name (already correct)
- **Fixed wooOrder scope**: Pass `rawWooOrder` parameter to `upsertOrder()` for audit logging
- **Fixed shipping_lines optional chaining**: Default to empty array `[]` to prevent runtime crashes
- **Fixed parseMoney**: Added NaN checks to always return a number
- **Fixed shipping defaults**: Added safe defaults for `shipping.first_name` and `shipping.last_name`

### 2. Query Error Handling ✅
- **Added error handling** to `getDashboardKPIs()` with console logging
- **Fixed active products query**: Changed from `.or()` filter to in-memory case-insensitive filtering
- **Added error handling** to dashboard page with fallback values
- **Added error display** on dashboard when data fails to load

### 3. Realtime Subscriptions ✅
- **Fixed connection status tracking**: Changed from checking `channel.state` to using `useState` with subscription status callback
- **Added proper cleanup**: Ensures channels are removed on unmount
- **RealtimeProvider** already properly integrated in `app/layout.tsx`
- **Periodic refetch fallback** already implemented in `DashboardClient` (90s interval)

### 4. Theme Toggle ✅
- **Already configured correctly**: 
  - `suppressHydrationWarning` on `<html>` tag
  - `ThemeProvider` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`
  - `ThemeToggle` component with `mounted` check to prevent hydration issues
  - `tailwind.config.ts` has `darkMode: ['class']`
- **No changes needed** - theme toggle should work correctly

### 5. Data Pipeline Health Panel ✅
- **Added row counts** to Settings page (orders, order_lines, products, expenses)
- **Added test ingestion endpoint** at `/api/test-ingestion`
- **Added "Send Test Ingestion" button** in Settings page
- **Enhanced connection status** display with masked URL

### 6. Diagnostic Script ✅
- **Created `scripts/diagnose-supabase.ts`** to verify:
  - Environment variables are set
  - Admin client can connect and read data
  - Row counts for all tables
  - RLS policies allow reads
- **Added to package.json**: `npm run diagnose`

## Files Changed

### Modified Files:
1. `supabase/functions/ingest-order/index.ts` - Fixed all Edge Function issues
2. `lib/metrics/queries.ts` - Added error handling, fixed active products query
3. `lib/hooks/use-realtime.ts` - Fixed connection status tracking
4. `app/page.tsx` - Added error handling and display
5. `app/settings/page.tsx` - Added data pipeline health panel with row counts
6. `scripts/diagnose-supabase.ts` - Created diagnostic script
7. `package.json` - Added `diagnose` script

### New Files:
1. `app/api/test-ingestion/route.ts` - Test ingestion endpoint
2. `docs/fix-summary.md` - This file

## Environment Variables Required

### Local Development (.env.local):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Vercel Production:
Same variables as above, set in Vercel dashboard under Settings → Environment Variables

## Verification Steps

1. **Run diagnostic**:
   ```bash
   npm run diagnose
   ```
   Should show:
   - ✅ All environment variables set
   - ✅ Admin client can read data
   - ✅ Row counts: Orders (35), Order Lines (38), Products (92), Expenses (16)

2. **Check dashboard**:
   - Open `http://localhost:3000`
   - KPI cards should show non-zero values
   - Charts should display data

3. **Check pages**:
   - `/orders` - Should show 35 orders
   - `/products` - Should show 92 products
   - `/expenses` - Should show 16 expenses
   - `/revenue` - Should show revenue data

4. **Test Realtime**:
   - Go to `/settings`
   - Check "Realtime Subscriptions" status (should show connected)
   - Send test ingestion from Settings page
   - Verify new order appears in dashboard without refresh

5. **Test Theme Toggle**:
   - Go to `/settings`
   - Click Light/Dark/Auto buttons
   - Verify theme changes immediately
   - Refresh page - theme should persist

## Make.com Integration

### Edge Function URL:
```
https://your-project.supabase.co/functions/v1/ingest-order
```

### Headers:
```
Content-Type: application/json
Authorization: Bearer YOUR_SERVICE_ROLE_KEY
```

### Payload Format:
See `docs/make-com-integration.md` for full details. Supports:
- **Full order payload**: `{ line_items: [...] }` - Edge Function splits into order_lines
- **Iterator payload**: `{ line_item: {...} }` - Single line item per request

### Idempotency:
- Orders: Uses `order_number` as unique key
- Order Lines: Uses `(order_number, product_id, our_cost_per_unit, customer_paid_per_unit)` as unique constraint
- Duplicate requests are safely ignored (upsert semantics)

## Supabase Realtime Setup

### Enable Realtime:
1. Go to Supabase Dashboard → Database → Replication
2. Enable replication for:
   - `orders`
   - `order_lines`
   - `expenses`
   - `products` (optional)

### Verify:
- Check Settings page → Realtime Subscriptions
- Should show "Connected" for all tables

## Known Issues / Next Steps

1. **If dashboard still shows zeros**:
   - Run `npm run diagnose` to verify data exists
   - Check browser console for errors
   - Verify RLS policies allow anon reads (migration `20260101000010_update_rls_for_anon_reads.sql` should be applied)

2. **If Realtime not working**:
   - Verify replication is enabled in Supabase Dashboard
   - Check browser console for subscription errors
   - Fallback polling (90s) should still update data

3. **If theme toggle has hydration warnings**:
   - Already fixed with `suppressHydrationWarning` and `mounted` check
   - If issues persist, clear browser cache and hard refresh

## Testing Checklist

- [x] Diagnostic script runs successfully
- [x] Database has data (35 orders, 38 order lines, 92 products, 16 expenses)
- [x] Edge Function fixes applied
- [x] Query error handling added
- [x] Realtime connection status tracking fixed
- [x] Theme toggle properly configured
- [x] Data pipeline health panel added
- [ ] Dashboard displays non-zero values (verify in browser)
- [ ] Realtime updates work (test with test ingestion)
- [ ] Theme toggle works without hydration warnings
