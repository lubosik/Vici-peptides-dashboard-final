-- ============================================================================
-- CLEANUP DUPLICATE RLS POLICIES
-- ============================================================================
-- You have duplicate policies - one allows anon, one doesn't
-- Let's remove the old "Authenticated users only" policies and keep the anon ones
-- ============================================================================

-- Remove old "Authenticated users only" policies
DROP POLICY IF EXISTS "Authenticated users can view expenses" ON expenses;
DROP POLICY IF EXISTS "Authenticated users can view products" ON products;

-- Verify only the anon+authenticated policies remain
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

-- Test as anon role
SET ROLE anon;
SELECT 'expenses' as table_name, COUNT(*) as count FROM expenses
UNION ALL
SELECT 'products' as table_name, COUNT(*) as count FROM products;
RESET ROLE;
