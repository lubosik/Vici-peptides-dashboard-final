-- ============================================================================
-- CHECK EXPENSES TABLE - COMPREHENSIVE DIAGNOSTIC
-- ============================================================================
-- Run this to find out why expenses isn't working
-- ============================================================================

-- 1. Check if expenses table has ANY data (as admin)
SELECT 
  'expenses' as table_name,
  COUNT(*) as total_rows
FROM expenses;

-- 2. Check RLS policies for expenses
SELECT 
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'expenses'
  AND cmd = 'SELECT';

-- 3. Test as anon role (what your app uses)
SET ROLE anon;

-- Simple count test
SELECT COUNT(*) as expenses_count FROM expenses;

-- Try selecting data
SELECT expense_id, expense_date, category, amount 
FROM expenses 
ORDER BY expense_date DESC 
LIMIT 5;

RESET ROLE;

-- 4. Compare: products (works) vs expenses (doesn't work)
SET ROLE anon;
SELECT 'products' as table_name, COUNT(*) as count FROM products;
SELECT 'expenses' as table_name, COUNT(*) as count FROM expenses;
RESET ROLE;

-- 5. Check if expenses table actually has rows
SELECT COUNT(*) as admin_count FROM expenses;
SELECT * FROM expenses LIMIT 3;
