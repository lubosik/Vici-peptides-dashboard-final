-- ============================================================================
-- FINAL TEST AND FIX FOR EXPENSES AND PRODUCTS
-- ============================================================================
-- Your policies exist, but you have duplicates. Let's clean them up and test.
-- ============================================================================

-- STEP 1: Remove duplicate "Authenticated users only" policies
-- (Keep only the ones that allow anon)
DROP POLICY IF EXISTS "Authenticated users can view expenses" ON expenses;
DROP POLICY IF EXISTS "Authenticated users can view products" ON products;

-- STEP 2: Verify only the correct policies remain
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

-- STEP 3: Test as anon role (simulates what your Next.js app does)
SET ROLE anon;

-- Test expenses
SELECT 
  'expenses' as table_name,
  COUNT(*) as total_rows,
  COUNT(*) FILTER (WHERE expense_date IS NOT NULL) as rows_with_date,
  MIN(expense_date) as earliest,
  MAX(expense_date) as latest
FROM expenses;

-- Test products  
SELECT 
  'products' as table_name,
  COUNT(*) as total_rows,
  COUNT(*) FILTER (WHERE product_name IS NOT NULL) as rows_with_name,
  COUNT(*) FILTER (WHERE stock_status = 'IN STOCK' OR stock_status = 'In Stock') as in_stock_count
FROM products;

-- Get sample data
SELECT expense_id, expense_date, category, amount 
FROM expenses 
ORDER BY expense_date DESC 
LIMIT 3;

SELECT product_id, product_name, stock_status, current_stock 
FROM products 
ORDER BY product_name 
LIMIT 3;

RESET ROLE;

-- STEP 4: Verify Data API schema exposure
-- (This can't be checked via SQL, but you should verify in Dashboard:
--  Project Settings → API → "Exposed Schemas" should include "public")
