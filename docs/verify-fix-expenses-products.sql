-- ============================================================================
-- VERIFY AND FIX EXPENSES AND PRODUCTS TABLES
-- ============================================================================
-- Run this in Supabase Dashboard → SQL Editor
-- This will check RLS policies and create them if missing
-- ============================================================================

-- STEP 1: Check if tables have data
-- ============================================================================
SELECT 
  'expenses' as table_name,
  COUNT(*) as row_count,
  MIN(expense_date) as earliest_date,
  MAX(expense_date) as latest_date
FROM expenses
UNION ALL
SELECT 
  'products' as table_name,
  COUNT(*) as row_count,
  NULL::date as earliest_date,
  NULL::date as latest_date
FROM products;

-- STEP 2: Check RLS is enabled
-- ============================================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('expenses', 'products')
ORDER BY tablename;

-- STEP 3: Check existing SELECT policies
-- ============================================================================
SELECT 
  tablename,
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('expenses', 'products')
  AND cmd = 'SELECT'
ORDER BY tablename;

-- STEP 4: Test as anon role (what your app uses)
-- ============================================================================
SET ROLE anon;
SELECT COUNT(*) as expenses_count FROM expenses;
SELECT COUNT(*) as products_count FROM products;
SELECT expense_id, expense_date, category, amount FROM expenses LIMIT 3;
SELECT product_id, product_name, stock_status FROM products LIMIT 3;
RESET ROLE;

-- STEP 5: Create/Recreate SELECT policies for anon role
-- ============================================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anon and authenticated to view expenses" ON expenses;
DROP POLICY IF EXISTS "Allow anon and authenticated to view products" ON products;

-- Create policy for expenses
CREATE POLICY "Allow anon and authenticated to view expenses"
  ON expenses
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create policy for products
CREATE POLICY "Allow anon and authenticated to view products"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- STEP 6: Verify policies were created
-- ============================================================================
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

-- STEP 7: Test again as anon role (should work now)
-- ============================================================================
SET ROLE anon;
SELECT COUNT(*) as expenses_count FROM expenses;
SELECT COUNT(*) as products_count FROM products;
RESET ROLE;

-- STEP 8: Check if tables are in realtime publication
-- ============================================================================
SELECT 
  pubname,
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename IN ('expenses', 'products')
ORDER BY tablename;

-- If not in publication, add them:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
