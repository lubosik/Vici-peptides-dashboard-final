# Fix Expenses and Products Not Displaying

## Quick Diagnostic

### 1. Test Tables Endpoint

Open in browser:
- `http://localhost:3000/api/test-tables?table=expenses`
- `http://localhost:3000/api/test-tables?table=products`

**Check the response:**
- `admin_test.count` - Should be > 0 if data exists
- `anon_test.count` - Should match admin count if RLS allows reads
- `comparison.rls_blocking` - If `true`, RLS is blocking anon reads

### 2. Run SQL in Supabase Dashboard

**Go to:** Supabase Dashboard → SQL Editor

**Paste and run this SQL:**

```sql
-- ============================================================================
-- DIAGNOSTIC: Check Expenses and Products Tables
-- ============================================================================

-- 1. Check if tables have data
SELECT 
  'expenses' as table_name,
  COUNT(*) as row_count
FROM expenses
UNION ALL
SELECT 
  'products' as table_name,
  COUNT(*) as row_count
FROM products;

-- 2. Check RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('expenses', 'products');

-- 3. Check SELECT policies exist for anon role
SELECT 
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('expenses', 'products')
  AND cmd = 'SELECT';

-- 4. Test as anon role (simulates what your app does)
SET ROLE anon;
SELECT COUNT(*) as expenses_count FROM expenses;
SELECT COUNT(*) as products_count FROM products;
RESET ROLE;
```

**Expected Results:**
- Row counts should be > 0 (16 expenses, 92 products)
- RLS should be enabled (`rls_enabled = true`)
- SELECT policies should exist with `roles` containing `{anon}`
- Anon role should return same counts

### 3. If Policies Are Missing

**Run this SQL to create them:**

```sql
-- Create SELECT policy for expenses (if missing)
DROP POLICY IF EXISTS "Allow anon and authenticated to view expenses" ON expenses;
CREATE POLICY "Allow anon and authenticated to view expenses"
  ON expenses
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create SELECT policy for products (if missing)
DROP POLICY IF EXISTS "Allow anon and authenticated to view products" ON products;
CREATE POLICY "Allow anon and authenticated to view products"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (true);
```

### 4. Verify Data API Schema Exposure

**In Supabase Dashboard:**
1. Go to: **Project Settings** → **API**
2. Check: **"Exposed Schemas"** includes `public`
3. If missing: Add `public` and save

---

## Common Issues

### Issue: Admin sees data, anon returns 0

**Cause:** RLS policy missing or not allowing `anon` role

**Fix:** Run the SQL in Step 3 above

### Issue: Both admin and anon return 0

**Cause:** Data doesn't exist OR wrong Supabase project

**Fix:** 
1. Check `http://localhost:3000/api/healthcheck` - should show admin counts
2. Verify you're using the correct Supabase project URL

### Issue: Error "permission denied" or "PGRST116"

**Cause:** RLS is blocking reads

**Fix:** 
1. Check policies exist (Step 2, query 3)
2. Create policies if missing (Step 3)

---

## After Fixing

1. **Restart dev server:** `npm run dev`
2. **Test endpoints:**
   - `http://localhost:3000/api/test-tables?table=expenses`
   - `http://localhost:3000/api/test-tables?table=products`
3. **Check dashboard:**
   - `/expenses` page should show expense data
   - `/products` page should show product data
   - Dashboard should show "Active Products" count
