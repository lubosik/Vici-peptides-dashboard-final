-- Migration: Create sync_state table
-- Description: Tracks WooCommerce sync state for incremental syncing

CREATE TABLE IF NOT EXISTS sync_state (
  sync_type TEXT PRIMARY KEY, -- 'orders', 'products', 'coupons'
  last_successful_sync TIMESTAMP WITH TIME ZONE,
  last_sync_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial sync state records
INSERT INTO sync_state (sync_type, last_successful_sync, last_sync_count)
VALUES 
  ('orders', NULL, 0),
  ('products', NULL, 0),
  ('coupons', NULL, 0)
ON CONFLICT (sync_type) DO NOTHING;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_sync_state_sync_type ON sync_state(sync_type);

-- Comments
COMMENT ON TABLE sync_state IS 'Tracks last successful sync timestamp for incremental WooCommerce syncs';
COMMENT ON COLUMN sync_state.sync_type IS 'Type of sync: orders, products, or coupons';
COMMENT ON COLUMN sync_state.last_successful_sync IS 'Timestamp of last successful sync for incremental queries';
