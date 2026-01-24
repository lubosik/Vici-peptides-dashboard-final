# Supabase Setup Checklist - Exact Steps

## Prerequisites Verification

### 1. Environment Variables ✅
Your `.env.local` contains:
- `NEXT_PUBLIC_SUPABASE_URL` ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅

**Action Required:** Verify these point to the same Supabase project that contains your data.

---

## Step 1: Verify Data API is Enabled

### In Supabase Dashboard:
1. Go to **Project Settings** → **API**
2. Under **"Data API"** section, ensure:
   - ✅ **"Enable Data API"** is **ON** (toggle should be green/enabled)
   - ✅ **"Exposed Schemas"** includes **`public`** (or your custom schema name)

**If `public` is NOT in "Exposed Schemas":**
- Click **"+ Add schema"** or the **"Edit"** button
- Type `public` and click **"Save"**
- This is CRITICAL - without this, all REST/Client library reads will fail

**Why this matters:** If the Data API is disabled or `public` schema is not exposed, your Next.js app cannot query tables even if RLS allows it.

---

## Step 2: Verify Row Level Security (RLS) Policies

### Check RLS Status:
Run this SQL in **Supabase Dashboard** → **SQL Editor**:

```sql
-- Check if RLS is enabled on each table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'order_lines', 'products', 'expenses', 'coupons', 'tiered_pricing', 'ingestion_audit')
ORDER BY tablename;
```

**Expected Result:** All tables should show `rls_enabled = true`

### Check SELECT Policies:
Run this SQL to verify policies exist:

```sql
-- Check SELECT policies for anon role
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'order_lines', 'products', 'expenses', 'coupons', 'tiered_pricing', 'ingestion_audit')
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;
```

**Expected Result:** Each table should have at least one policy with:
- `roles` containing `{anon}` or `{public}`
- `cmd = 'SELECT'`

**If policies are missing:**
Run this migration (already exists in your codebase):
```sql
-- File: supabase/migrations/20260101000010_update_rls_for_anon_reads.sql
-- This should already be applied, but if not, run it now
```

---

## Step 3: Test Data Access with Healthcheck

### Run Healthcheck:
1. Start your dev server: `npm run dev`
2. Open: `http://localhost:3000/api/healthcheck`
3. Check the response:

**Expected Response:**
```json
{
  "success": true,
  "admin_counts": {
    "orders": 35,
    "order_lines": 38,
    "products": 92,
    "expenses": 16,
    ...
  },
  "anon_key_test": {
    "orders_count": 35,
    "error": null,
    "can_read": true
  }
}
```

**If `anon_key_test.can_read` is `false`:**
- The anon key cannot read data
- Check RLS policies (Step 2)
- Check Data API settings (Step 1)

**If `admin_counts` shows zeros but you know data exists:**
- The service role key might be wrong
- Or you're pointing to the wrong Supabase project

---

## Step 4: Enable Realtime Publications

### In Supabase Dashboard:
1. Go to **Database** → **Replication** (or **Publications**)
2. Find the publication named **`supabase_realtime`**
3. Click on it to open settings

**If you see toggle switches for tables:**
- ✅ Toggle **ON** for:
  - `public.orders`
  - `public.order_lines`
  - `public.expenses`
  - `public.products` (optional, for inventory updates)

**If you DON'T see toggle switches (UI not available):**
Run this SQL in **SQL Editor**:

```sql
-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_lines;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- Verify tables are in publication
SELECT 
  pubname,
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
ORDER BY tablename;
```

**Expected Result:** Should show 4 rows (orders, order_lines, expenses, products)

---

## Step 5: Verify Realtime is Working

### Test Realtime Subscription:
1. Open browser console on your dashboard
2. Look for logs like: `Realtime subscription status for orders: SUBSCRIBED`
3. Go to **Settings** page → Check "Realtime Subscriptions" section
4. Should show "Connected" for orders, order_lines, expenses

**If not connected:**
- Check browser console for errors
- Verify tables are in `supabase_realtime` publication (Step 4)
- Verify RLS policies allow reads (Step 2) - Realtime respects RLS

---

## Step 6: Test End-to-End

### Test Data Flow:
1. **Verify Healthcheck:** `http://localhost:3000/api/healthcheck` shows non-zero counts
2. **Verify Dashboard:** Dashboard KPI cards show same non-zero values
3. **Test Realtime:**
   - Open dashboard in browser
   - In another tab, go to Supabase Dashboard → Table Editor → `orders`
   - Insert a test row (or use the "Send Test Ingestion" button in Settings)
   - Watch dashboard - it should update within 1-2 seconds without refresh

**If dashboard doesn't update:**
- Check browser console for Realtime errors
- Verify publication includes the table (Step 4)
- Check RLS policies (Step 2)

---

## Common Issues & Solutions

### Issue: "Everything shows 0"
**Check:**
1. ✅ Data API enabled? (Step 1)
2. ✅ `public` schema exposed? (Step 1)
3. ✅ RLS policies allow anon SELECT? (Step 2)
4. ✅ Healthcheck shows non-zero counts? (Step 3)

### Issue: "Realtime not working"
**Check:**
1. ✅ Tables added to `supabase_realtime` publication? (Step 4)
2. ✅ RLS policies allow reads? (Realtime respects RLS)
3. ✅ Browser console shows "SUBSCRIBED" status?
4. ✅ No WebSocket connection errors in console?

### Issue: "API DISABLED / schema not exposed" in Realtime → Policies
**Solution:** This is about `realtime.messages` (broadcast/presence), NOT postgres_changes. You don't need to configure this unless you're using broadcast channels. For row change streaming, you only need:
- Tables in `supabase_realtime` publication (Step 4)
- RLS policies that allow reads (Step 2)

---

## Final Verification Checklist

Before claiming success, verify:

- [ ] Healthcheck endpoint (`/api/healthcheck`) returns non-zero counts
- [ ] Dashboard KPI cards show same non-zero values as healthcheck
- [ ] All navigation links work (Orders, Products, Expenses, etc.)
- [ ] Realtime subscriptions show "Connected" in Settings
- [ ] Inserting a test row causes dashboard to update without refresh
- [ ] Browser console shows no errors related to Supabase

---

## SQL Commands Summary

If you need to run SQL manually, here's the complete set:

```sql
-- 1. Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('orders', 'order_lines', 'products', 'expenses');

-- 2. Verify SELECT policies exist
SELECT tablename, policyname, roles FROM pg_policies 
WHERE schemaname = 'public' AND cmd = 'SELECT';

-- 3. Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_lines;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- 4. Verify tables are in publication
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```
