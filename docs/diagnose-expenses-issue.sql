-- ============================================================================
-- DIAGNOSE EXPENSES ISSUE
-- ============================================================================
-- Products works (92 rows), but expenses doesn't. Let's find out why.
-- ============================================================================

-- STEP 1: Check if expenses table has data (as admin/service role)
SELECT 
  'expenses' as table_name,
  COUNT(*) as total_rows,
  MIN(expense_date) as earliest_date,
  MAX(expense_date) as latest_date,
  SUM(amount) as total_amount
FROM expenses;

-- STEP 2: Check RLS status for expenses
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'expenses';

-- STEP 3: Check SELECT policies for expenses
SELECT 
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'expenses'
  AND cmd = 'SELECT';

-- STEP 4: Test as anon role (what your app uses)
SET ROLE anon;

-- Try simple count
SELECT COUNT(*) as expenses_count FROM expenses;

-- Try with specific columns
SELECT COUNT(*) as expenses_count 
FROM expenses 
WHERE expense_date IS NOT NULL;

-- Try selecting actual data
SELECT expense_id, expense_date, category, amount 
FROM expenses 
LIMIT 5;

-- Check for any errors
SELECT 'expenses' as table_name, COUNT(*) as count FROM expenses;

RESET ROLE;

-- STEP 5: Compare with products (which works)
SET ROLE anon;
SELECT 'products' as table_name, COUNT(*) as count FROM products;
SELECT 'expenses' as table_name, COUNT(*) as count FROM expenses;
RESET ROLE;

-- STEP 6: Check if there's a data type issue
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'expenses'
ORDER BY ordinal_position;

-- STEP 7: Check if expenses table exists and is accessible
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'expenses';

-- STEP 8: Check for any constraints that might block reads
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.expenses'::regclass;
