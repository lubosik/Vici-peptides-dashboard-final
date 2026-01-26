-- Migration: Update expenses table to support shipping expenses with order linking
-- Description: Adds fields to link expenses to orders and ensure idempotency for shipping expenses

-- Add order linking fields to expenses table
DO $$ 
BEGIN
  -- Add order_id (WooCommerce order ID) if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'expenses' AND column_name = 'order_id') THEN
    ALTER TABLE expenses ADD COLUMN order_id BIGINT;
  END IF;

  -- Add order_number (our order_number) if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'expenses' AND column_name = 'order_number') THEN
    ALTER TABLE expenses ADD COLUMN order_number TEXT;
  END IF;

  -- Add source field if missing (e.g., 'shippo', 'manual', 'import')
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'expenses' AND column_name = 'source') THEN
    ALTER TABLE expenses ADD COLUMN source TEXT;
  END IF;

  -- Add external_ref (e.g., Shippo transaction ID) if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'expenses' AND column_name = 'external_ref') THEN
    ALTER TABLE expenses ADD COLUMN external_ref TEXT;
  END IF;

  -- Add metadata JSONB for carrier/service info if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'expenses' AND column_name = 'metadata') THEN
    ALTER TABLE expenses ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- Create unique constraint to prevent duplicate shipping expenses for the same order
-- Only applies when order_number and category are both set (for shipping expenses)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uq_expenses_order_shipping'
  ) THEN
    -- Create partial unique index for shipping expenses
    CREATE UNIQUE INDEX uq_expenses_order_shipping 
    ON expenses(order_number, category) 
    WHERE order_number IS NOT NULL AND category = 'shipping';
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_expenses_order_id ON expenses(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_order_number ON expenses(order_number) WHERE order_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_source ON expenses(source) WHERE source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_external_ref ON expenses(external_ref) WHERE external_ref IS NOT NULL;

-- Add comments
COMMENT ON COLUMN expenses.order_id IS 'WooCommerce order ID (if expense is linked to an order)';
COMMENT ON COLUMN expenses.order_number IS 'Order number (if expense is linked to an order)';
COMMENT ON COLUMN expenses.source IS 'Source of expense: shippo, manual, import, etc.';
COMMENT ON COLUMN expenses.external_ref IS 'External reference ID (e.g., Shippo transaction ID)';
COMMENT ON COLUMN expenses.metadata IS 'Additional metadata (e.g., carrier, service level for shipping expenses)';
