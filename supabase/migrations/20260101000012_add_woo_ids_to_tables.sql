-- Migration: Add WooCommerce IDs to existing tables
-- Description: Add woo_order_id and woo_product_id for proper WooCommerce sync

-- Add woo_order_id to orders table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'woo_order_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN woo_order_id INTEGER UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_orders_woo_order_id ON orders(woo_order_id);
    COMMENT ON COLUMN orders.woo_order_id IS 'WooCommerce order ID (from WooCommerce REST API)';
  END IF;
END $$;

-- Add woo_product_id to products table if it doesn't exist
-- Also add images column for storing product images as JSONB
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'woo_product_id'
  ) THEN
    ALTER TABLE products ADD COLUMN woo_product_id INTEGER UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_products_woo_product_id ON products(woo_product_id);
    COMMENT ON COLUMN products.woo_product_id IS 'WooCommerce product ID (from WooCommerce REST API)';
  END IF;
  
  -- Add images column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'images'
  ) THEN
    ALTER TABLE products ADD COLUMN images JSONB;
    COMMENT ON COLUMN products.images IS 'Product images from WooCommerce (stored as JSONB array)';
  END IF;
END $$;

-- Add woo_coupon_id to coupons table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coupons' AND column_name = 'woo_coupon_id'
  ) THEN
    ALTER TABLE coupons ADD COLUMN woo_coupon_id INTEGER UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_coupons_woo_coupon_id ON coupons(woo_coupon_id);
    COMMENT ON COLUMN coupons.woo_coupon_id IS 'WooCommerce coupon ID (from WooCommerce REST API)';
  END IF;
END $$;

-- Add line_item_id to order_lines for WooCommerce line item tracking
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_lines' AND column_name = 'woo_line_item_id'
  ) THEN
    ALTER TABLE order_lines ADD COLUMN woo_line_item_id INTEGER;
    CREATE INDEX IF NOT EXISTS idx_order_lines_woo_line_item_id ON order_lines(woo_line_item_id);
    COMMENT ON COLUMN order_lines.woo_line_item_id IS 'WooCommerce line item ID (from WooCommerce REST API)';
  END IF;
END $$;

-- Update order_lines unique constraint to include woo_line_item_id if present
-- Note: We'll handle this in application logic since we want to support both scenarios
