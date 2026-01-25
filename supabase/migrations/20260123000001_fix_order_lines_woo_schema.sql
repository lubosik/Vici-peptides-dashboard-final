-- Migration: Update order_lines table to support WooCommerce line item structure
-- Adds WooCommerce-specific fields and ensures proper schema

-- Add WooCommerce fields if they don't exist
DO $$ 
BEGIN
  -- Add order_id (WooCommerce order ID) if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'order_lines' AND column_name = 'order_id') THEN
    ALTER TABLE order_lines ADD COLUMN order_id BIGINT;
  END IF;

  -- Add id (WooCommerce line item id) if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'order_lines' AND column_name = 'id') THEN
    ALTER TABLE order_lines ADD COLUMN id BIGINT;
  END IF;

  -- Add variation_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'order_lines' AND column_name = 'variation_id') THEN
    ALTER TABLE order_lines ADD COLUMN variation_id BIGINT;
  END IF;

  -- Add name (product name from WooCommerce) if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'order_lines' AND column_name = 'name') THEN
    ALTER TABLE order_lines ADD COLUMN name TEXT;
  END IF;

  -- Add tax_class if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'order_lines' AND column_name = 'tax_class') THEN
    ALTER TABLE order_lines ADD COLUMN tax_class TEXT;
  END IF;

  -- Add subtotal (WooCommerce subtotal) if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'order_lines' AND column_name = 'subtotal') THEN
    ALTER TABLE order_lines ADD COLUMN subtotal TEXT;
  END IF;

  -- Add subtotal_tax if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'order_lines' AND column_name = 'subtotal_tax') THEN
    ALTER TABLE order_lines ADD COLUMN subtotal_tax TEXT;
  END IF;

  -- Add total_tax if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'order_lines' AND column_name = 'total_tax') THEN
    ALTER TABLE order_lines ADD COLUMN total_tax TEXT;
  END IF;

  -- Add sku (from WooCommerce) if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'order_lines' AND column_name = 'sku') THEN
    ALTER TABLE order_lines ADD COLUMN sku TEXT;
  END IF;

  -- Add price (unit price from WooCommerce) if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'order_lines' AND column_name = 'price') THEN
    ALTER TABLE order_lines ADD COLUMN price TEXT;
  END IF;

  -- Add taxes JSONB if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'order_lines' AND column_name = 'taxes') THEN
    ALTER TABLE order_lines ADD COLUMN taxes JSONB;
  END IF;

  -- Add meta_data JSONB if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'order_lines' AND column_name = 'meta_data') THEN
    ALTER TABLE order_lines ADD COLUMN meta_data JSONB;
  END IF;

  -- Add raw_json JSONB to store full WooCommerce line item if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'order_lines' AND column_name = 'raw_json') THEN
    ALTER TABLE order_lines ADD COLUMN raw_json JSONB;
  END IF;
END $$;

-- Create unique constraint on (order_id, id) for WooCommerce line items
-- This allows safe upserts based on WooCommerce IDs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uq_order_lines_woo_id'
  ) THEN
    ALTER TABLE order_lines 
    ADD CONSTRAINT uq_order_lines_woo_id 
    UNIQUE (order_id, id);
  END IF;
END $$;

-- Create index on order_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_lines_order_id ON order_lines(order_id);

-- Add comments
COMMENT ON COLUMN order_lines.order_id IS 'WooCommerce order ID';
COMMENT ON COLUMN order_lines.id IS 'WooCommerce line item ID';
COMMENT ON COLUMN order_lines.name IS 'Product name from WooCommerce';
COMMENT ON COLUMN order_lines.raw_json IS 'Full WooCommerce line item object (verbatim)';
