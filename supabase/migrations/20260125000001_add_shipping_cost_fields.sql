-- Migration: Add Shippo shipping cost tracking fields to orders table
-- Description: Tracks Shippo shipment, rate, and transaction IDs, plus shipping cost data

-- Add Shippo-related fields to orders table
DO $$ 
BEGIN
  -- Add shippo_shipment_object_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'shippo_shipment_object_id') THEN
    ALTER TABLE orders ADD COLUMN shippo_shipment_object_id TEXT;
  END IF;

  -- Add shippo_selected_rate_object_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'shippo_selected_rate_object_id') THEN
    ALTER TABLE orders ADD COLUMN shippo_selected_rate_object_id TEXT;
  END IF;

  -- Add shippo_transaction_object_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'shippo_transaction_object_id') THEN
    ALTER TABLE orders ADD COLUMN shippo_transaction_object_id TEXT;
  END IF;

  -- Add shipping_cost (actual cost we pay, not what customer paid)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'shipping_cost') THEN
    -- Note: shipping_cost already exists, but ensure it's nullable
    ALTER TABLE orders ALTER COLUMN shipping_cost DROP NOT NULL;
  END IF;

  -- Add shipping_cost_currency if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'shipping_cost_currency') THEN
    ALTER TABLE orders ADD COLUMN shipping_cost_currency TEXT DEFAULT 'USD';
  END IF;

  -- Add shipping_cost_source if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'shipping_cost_source') THEN
    ALTER TABLE orders ADD COLUMN shipping_cost_source TEXT;
    -- Add check constraint for valid sources
    ALTER TABLE orders ADD CONSTRAINT chk_shipping_cost_source 
      CHECK (shipping_cost_source IS NULL OR shipping_cost_source IN ('shippo_rate_estimate', 'shippo_label_transaction', 'manual'));
  END IF;

  -- Add shipping_cost_last_synced_at if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'shipping_cost_last_synced_at') THEN
    ALTER TABLE orders ADD COLUMN shipping_cost_last_synced_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add shipping_parcel_snapshot if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'shipping_parcel_snapshot') THEN
    ALTER TABLE orders ADD COLUMN shipping_parcel_snapshot JSONB;
  END IF;
END $$;

-- Create indexes for Shippo fields
CREATE INDEX IF NOT EXISTS idx_orders_shippo_shipment_id ON orders(shippo_shipment_object_id) WHERE shippo_shipment_object_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_shippo_transaction_id ON orders(shippo_transaction_object_id) WHERE shippo_transaction_object_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_shipping_cost_source ON orders(shipping_cost_source) WHERE shipping_cost_source IS NOT NULL;

-- Add comments
COMMENT ON COLUMN orders.shippo_shipment_object_id IS 'Shippo shipment object ID (from POST /shipments/)';
COMMENT ON COLUMN orders.shippo_selected_rate_object_id IS 'Shippo rate object ID that was selected for this order';
COMMENT ON COLUMN orders.shippo_transaction_object_id IS 'Shippo transaction object ID (from POST /transactions/) if label was purchased';
COMMENT ON COLUMN orders.shipping_cost IS 'Actual shipping cost we pay (not what customer paid)';
COMMENT ON COLUMN orders.shipping_cost_currency IS 'Currency code for shipping_cost (default: USD)';
COMMENT ON COLUMN orders.shipping_cost_source IS 'Source of shipping cost: shippo_rate_estimate, shippo_label_transaction, or manual';
COMMENT ON COLUMN orders.shipping_cost_last_synced_at IS 'Timestamp when shipping cost was last synced from Shippo';
COMMENT ON COLUMN orders.shipping_parcel_snapshot IS 'JSON snapshot of parcel(s) used for shipping calculation (weights, dimensions, units)';
