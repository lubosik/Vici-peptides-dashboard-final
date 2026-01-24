-- Migration: Update RLS policies to allow anonymous reads
-- Description: Allow anon key to read data for dashboard (SELECT only)
-- Writes still require service role key via Edge Function

-- Drop existing SELECT policies and recreate for anon + authenticated
DROP POLICY IF EXISTS "Authenticated users can view products" ON products;
DROP POLICY IF EXISTS "Authenticated users can view tiered_pricing" ON tiered_pricing;
DROP POLICY IF EXISTS "Authenticated users can view coupons" ON coupons;
DROP POLICY IF EXISTS "Authenticated users can view orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can view order_lines" ON order_lines;
DROP POLICY IF EXISTS "Authenticated users can view expenses" ON expenses;
DROP POLICY IF EXISTS "Authenticated users can view ingestion_audit" ON ingestion_audit;

-- Products: Allow anon and authenticated to SELECT
CREATE POLICY "Allow anon and authenticated to view products"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Tiered Pricing: Allow anon and authenticated to SELECT
CREATE POLICY "Allow anon and authenticated to view tiered_pricing"
  ON tiered_pricing
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Coupons: Allow anon and authenticated to SELECT
CREATE POLICY "Allow anon and authenticated to view coupons"
  ON coupons
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Orders: Allow anon and authenticated to SELECT
CREATE POLICY "Allow anon and authenticated to view orders"
  ON orders
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Order Lines: Allow anon and authenticated to SELECT
CREATE POLICY "Allow anon and authenticated to view order_lines"
  ON order_lines
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Expenses: Allow anon and authenticated to SELECT
CREATE POLICY "Allow anon and authenticated to view expenses"
  ON expenses
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Ingestion Audit: Allow anon and authenticated to SELECT
CREATE POLICY "Allow anon and authenticated to view ingestion_audit"
  ON ingestion_audit
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Comments
COMMENT ON POLICY "Allow anon and authenticated to view products" ON products IS 'Allows anonymous and authenticated users to read products (dashboard access)';
COMMENT ON POLICY "Allow anon and authenticated to view orders" ON orders IS 'Allows anonymous and authenticated users to read orders (dashboard access)';
COMMENT ON POLICY "Allow anon and authenticated to view order_lines" ON order_lines IS 'Allows anonymous and authenticated users to read order lines (dashboard access)';
COMMENT ON POLICY "Allow anon and authenticated to view expenses" ON expenses IS 'Allows anonymous and authenticated users to read expenses (dashboard access)';
