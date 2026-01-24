-- ============================================================================
-- DIAGNOSTIC SQL FOR EXPENSES AND PRODUCTS TABLES
-- ============================================================================
-- Run these queries in Supabase Dashboard → SQL Editor
-- This will help identify why expenses and products are not displaying
-- ============================================================================

-- 1. CHECK IF TABLES EXIST AND HAVE DATA
-- ============================================================================
SELECT 
  'expenses' as table_name,
  COUNT(*) as row_count,
  COUNT(*) FILTER (WHERE expense_date IS NOT NULL) as rows_with_date,
  MIN(expense_date) as earliest_date,
  MAX(expense_date) as latest_date
FROM expenses
UNION ALL
SELECT 
  'products' as table_name,
  COUNT(*) as row_count,
  COUNT(*) FILTER (WHERE product_name IS NOT NULL) as rows_with_name,
  NULL::date as earliest_date,
  NULL::date as latest_date
FROM products;

-- 2. CHECK RLS STATUS
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('expenses', 'products')
ORDER BY tablename;

-- 3. CHECK SELECT POLICIES FOR ANON ROLE
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('expenses', 'products')
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;

-- 4. TEST AS ANON ROLE (SIMULATE CLIENT QUERY)
-- ============================================================================
-- This simulates what the Next.js app does with anon key
SET ROLE anon;
SELECT COUNT(*) as expenses_count FROM expenses;
SELECT COUNT(*) as products_count FROM products;
SELECT * FROM expenses LIMIT 3;
SELECT product_id, product_name, stock_status FROM products LIMIT 3;
RESET ROLE;

-- 5. CHECK IF TABLES ARE IN REALTIME PUBLICATION
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

-- 6. SAMPLE DATA CHECK
-- ============================================================================
-- Check actual data structure
SELECT 
  expense_id,
  expense_date,
  category,
  amount,
  description
FROM expenses
ORDER BY expense_date DESC
LIMIT 5;

SELECT 
  product_id,
  product_name,
  sku_code,
  stock_status,
  current_stock,
  retail_price
FROM products
ORDER BY product_name
LIMIT 5;

-- 7. CHECK FOR NULL OR INVALID DATA
-- ============================================================================
-- Expenses with missing required fields
SELECT 
  COUNT(*) as expenses_with_null_date,
  COUNT(*) FILTER (WHERE amount IS NULL OR amount = 0) as expenses_with_null_amount
FROM expenses;

-- Products with missing required fields
SELECT 
  COUNT(*) as products_with_null_name,
  COUNT(*) FILTER (WHERE stock_status IS NULL) as products_with_null_status
FROM products;

-- 8. VERIFY COLUMN NAMES MATCH CODE EXPECTATIONS
-- ============================================================================
-- Check expenses columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'expenses'
ORDER BY ordinal_position;

-- Check products columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
ORDER BY ordinal_position;
