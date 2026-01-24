# FIX EXPENSES AND PRODUCTS - EXACT STEPS

## Problem
- ✅ Revenue section works
- ✅ Orders section works  
- ✅ Dashboard section works
- ❌ **Expenses not displaying**
- ❌ **Products not displaying**

## Root Cause
RLS policies for `expenses` and `products` tables are likely missing or not allowing `anon` role to read.

---

## STEP 1: Test Current Status

### A. Test via API Endpoint

Open in browser:
- `http://localhost:3000/api/test-tables?table=expenses`
- `http://localhost:3000/api/test-tables?table=products`

**Check the response:**
- `admin_test.count` - Should be > 0 (16 expenses, 92 products)
- `anon_test.count` - Should match admin count
- `comparison.rls_blocking` - If `true`, RLS is blocking

### B. Test via Healthcheck

Open: `http://localhost:3000/api/healthcheck`

**Check:**
- `admin_counts.expenses` - Should be 16
- `admin_counts.products` - Should be 92
- `anon_key_test.expenses.count` - Should be 16 (not 0)
- `anon_key_test.products.count` - Should be 92 (not 0)
- `anon_key_test.expenses.rls_issue` - If `true`, RLS is blocking
- `anon_key_test.products.rls_issue` - If `true`, RLS is blocking

---

## STEP 2: Run SQL in Supabase Dashboard

**Go to:** Supabase Dashboard → SQL Editor

**Copy and paste this ENTIRE SQL script:**

```sql
-- ============================================================================
-- FIX EXPENSES AND PRODUCTS RLS POLICIES
-- ============================================================================

-- 1. Check current status
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename AND cmd = 'SELECT') as select_policy_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN ('expenses', 'products')
ORDER BY tablename;

-- 2. Check existing policies
SELECT 
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('expenses', 'products')
  AND cmd = 'SELECT'
ORDER BY tablename;

-- 3. Test as anon role (what your app uses)
SET ROLE anon;
SELECT 'expenses' as table_name, COUNT(*) as count FROM expenses
UNION ALL
SELECT 'products' as table_name, COUNT(*) as count FROM products;
RESET ROLE;

-- 4. Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Allow anon and authenticated to view expenses" ON expenses;
DROP POLICY IF EXISTS "Allow anon and authenticated to view products" ON products;
DROP POLICY IF EXISTS "Authenticated users can view expenses" ON expenses;
DROP POLICY IF EXISTS "Authenticated users can view products" ON products;

-- 5. Create SELECT policies for expenses
CREATE POLICY "Allow anon and authenticated to view expenses"
  ON expenses
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 6. Create SELECT policies for products
CREATE POLICY "Allow anon and authenticated to view products"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 7. Verify policies were created
SELECT 
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('expenses', 'products')
  AND cmd = 'SELECT'
ORDER BY tablename;

-- 8. Test again as anon role (should work now)
SET ROLE anon;
SELECT 'expenses' as table_name, COUNT(*) as count FROM expenses
UNION ALL
SELECT 'products' as table_name, COUNT(*) as count FROM products;
RESET ROLE;

-- 9. Verify tables are in realtime publication (for live updates)
SELECT 
  pubname,
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename IN ('expenses', 'products')
ORDER BY tablename;

-- 10. Add to realtime publication if missing
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
```

**Expected Results After Running:**
- Step 1: Should show `rls_enabled = true` and `select_policy_count = 1` (after step 6)
- Step 2: Should show policies with `roles` containing `{anon}`
- Step 3: Should show counts (16 expenses, 92 products) - if 0, policies are missing
- Step 7: Should show 2 policies (one for expenses, one for products)
- Step 8: Should show same counts as step 3 (16 and 92)
- Step 9: Should show both tables in publication

---

## STEP 3: Verify Fix

### A. Test API Endpoints Again

1. **Test expenses:**
   - `http://localhost:3000/api/test-tables?table=expenses`
   - Should show: `anon_test.count = 16` (not 0)
   - Should show: `comparison.rls_blocking = false`

2. **Test products:**
   - `http://localhost:3000/api/test-tables?table=products`
   - Should show: `anon_test.count = 92` (not 0)
   - Should show: `comparison.rls_blocking = false`

3. **Test healthcheck:**
   - `http://localhost:3000/api/healthcheck`
   - Should show: `anon_key_test.expenses.count = 16`
   - Should show: `anon_key_test.products.count = 92`
   - Should show: `anon_key_test.expenses.rls_issue = false`
   - Should show: `anon_key_test.products.rls_issue = false`

### B. Test Dashboard Pages

1. **Restart dev server** (if needed): `npm run dev`
2. **Open:** `http://localhost:3000/expenses`
   - Should show expense data (not "No expenses found")
3. **Open:** `http://localhost:3000/products`
   - Should show product data (not "No products found")
4. **Open:** `http://localhost:3000` (Dashboard)
   - Should show "Active Products" count > 0
   - Should show "Total Expenses" > $0

---

## If Still Not Working

### Check Data API Schema Exposure

1. **Go to:** Supabase Dashboard → Project Settings → API
2. **Check:** "Exposed Schemas" includes `public`
3. **If missing:** Add `public` and save

### Check for Errors

1. **Open browser console** (F12)
2. **Look for errors** when loading `/expenses` or `/products` pages
3. **Check Network tab** for failed API requests

### Verify Migration Was Applied

Run this SQL to check if the migration was applied:

```sql
SELECT 
  tablename,
  policyname,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('expenses', 'products')
  AND cmd = 'SELECT';
```

**Expected:** Should show policies with `roles` containing `{anon}` or `{public}`

---

## Summary

**Most likely fix:** Run the SQL in Step 2 (especially steps 4-6) to create/recreate the RLS policies.

**After fixing:**
- Expenses page should show 16 expenses
- Products page should show 92 products
- Dashboard should show "Active Products" count
- Dashboard should show "Total Expenses" amount
