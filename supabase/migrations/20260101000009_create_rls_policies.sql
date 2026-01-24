-- Migration: Create Row Level Security (RLS) policies
-- Description: RLS policies to restrict access to authenticated users only
-- Note: This assumes admin authentication. In production, you may want to add
-- role-based access control (e.g., check for admin role in user metadata).

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiered_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_audit ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PRODUCTS TABLE POLICIES
-- ============================================================================

-- Policy: Authenticated users can SELECT products
CREATE POLICY "Authenticated users can view products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can INSERT products
CREATE POLICY "Authenticated users can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can UPDATE products
CREATE POLICY "Authenticated users can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can DELETE products
CREATE POLICY "Authenticated users can delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- TIERED_PRICING TABLE POLICIES
-- ============================================================================

-- Policy: Authenticated users can SELECT tiered_pricing
CREATE POLICY "Authenticated users can view tiered_pricing"
  ON tiered_pricing
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can INSERT tiered_pricing
CREATE POLICY "Authenticated users can insert tiered_pricing"
  ON tiered_pricing
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can UPDATE tiered_pricing
CREATE POLICY "Authenticated users can update tiered_pricing"
  ON tiered_pricing
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can DELETE tiered_pricing
CREATE POLICY "Authenticated users can delete tiered_pricing"
  ON tiered_pricing
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- COUPONS TABLE POLICIES
-- ============================================================================

-- Policy: Authenticated users can SELECT coupons
CREATE POLICY "Authenticated users can view coupons"
  ON coupons
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can INSERT coupons
CREATE POLICY "Authenticated users can insert coupons"
  ON coupons
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can UPDATE coupons
CREATE POLICY "Authenticated users can update coupons"
  ON coupons
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can DELETE coupons
CREATE POLICY "Authenticated users can delete coupons"
  ON coupons
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- ORDERS TABLE POLICIES
-- ============================================================================

-- Policy: Authenticated users can SELECT orders
CREATE POLICY "Authenticated users can view orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can INSERT orders
CREATE POLICY "Authenticated users can insert orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can UPDATE orders
CREATE POLICY "Authenticated users can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can DELETE orders
CREATE POLICY "Authenticated users can delete orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- ORDER_LINES TABLE POLICIES
-- ============================================================================

-- Policy: Authenticated users can SELECT order_lines
CREATE POLICY "Authenticated users can view order_lines"
  ON order_lines
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can INSERT order_lines
CREATE POLICY "Authenticated users can insert order_lines"
  ON order_lines
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can UPDATE order_lines
CREATE POLICY "Authenticated users can update order_lines"
  ON order_lines
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can DELETE order_lines
CREATE POLICY "Authenticated users can delete order_lines"
  ON order_lines
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- EXPENSES TABLE POLICIES
-- ============================================================================

-- Policy: Authenticated users can SELECT expenses
CREATE POLICY "Authenticated users can view expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can INSERT expenses
CREATE POLICY "Authenticated users can insert expenses"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can UPDATE expenses
CREATE POLICY "Authenticated users can update expenses"
  ON expenses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can DELETE expenses
CREATE POLICY "Authenticated users can delete expenses"
  ON expenses
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- INGESTION_AUDIT TABLE POLICIES
-- ============================================================================

-- Policy: Authenticated users can SELECT ingestion_audit
CREATE POLICY "Authenticated users can view ingestion_audit"
  ON ingestion_audit
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can INSERT ingestion_audit
CREATE POLICY "Authenticated users can insert ingestion_audit"
  ON ingestion_audit
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can UPDATE ingestion_audit
CREATE POLICY "Authenticated users can update ingestion_audit"
  ON ingestion_audit
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Note: ingestion_audit typically should not be deleted, but we allow it for admin operations

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Authenticated users can view products" ON products IS 'Allows authenticated users to read products';
COMMENT ON POLICY "Authenticated users can insert products" ON products IS 'Allows authenticated users to create products';
COMMENT ON POLICY "Authenticated users can update products" ON products IS 'Allows authenticated users to update products';
COMMENT ON POLICY "Authenticated users can delete products" ON products IS 'Allows authenticated users to delete products';

-- Note: In production, you may want to add role-based access control:
-- Example: Check for admin role in user metadata
-- USING (
--   (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
-- )
