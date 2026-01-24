-- Migration: Create order_lines table
-- Description: Order line items (multiple rows per order)
-- Source: Orders.csv (one row per line item)

CREATE TABLE IF NOT EXISTS order_lines (
  line_id BIGSERIAL PRIMARY KEY,
  order_number TEXT NOT NULL,
  product_id INTEGER NOT NULL,
  qty_ordered INTEGER NOT NULL CHECK (qty_ordered > 0),
  our_cost_per_unit NUMERIC(10,2) DEFAULT 0,
  customer_paid_per_unit NUMERIC(10,2) NOT NULL,
  -- Computed columns (updated via triggers)
  line_total NUMERIC(10,2) DEFAULT 0,
  line_cost NUMERIC(10,2) DEFAULT 0,
  line_profit NUMERIC(10,2) DEFAULT 0,
  line_roi_percent NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_order_lines_order_number 
    FOREIGN KEY (order_number) 
    REFERENCES orders(order_number) 
    ON DELETE CASCADE,
  CONSTRAINT fk_order_lines_product_id 
    FOREIGN KEY (product_id) 
    REFERENCES products(product_id) 
    ON DELETE RESTRICT,
  -- Unique constraint for idempotency (prevents duplicate line items)
  CONSTRAINT uq_order_lines_unique 
    UNIQUE (order_number, product_id, our_cost_per_unit, customer_paid_per_unit)
);

-- Indexes for order_lines table
CREATE INDEX IF NOT EXISTS idx_order_lines_order_number ON order_lines(order_number);
CREATE INDEX IF NOT EXISTS idx_order_lines_product_id ON order_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_order_product ON order_lines(order_number, product_id);

-- Comments
COMMENT ON TABLE order_lines IS 'Order line items (multiple rows per order)';
COMMENT ON COLUMN order_lines.line_total IS 'Computed: qty_ordered × customer_paid_per_unit';
COMMENT ON COLUMN order_lines.line_cost IS 'Computed: qty_ordered × our_cost_per_unit';
COMMENT ON COLUMN order_lines.line_profit IS 'Computed: line_total - line_cost';
COMMENT ON COLUMN order_lines.line_roi_percent IS 'Computed: (line_profit / line_cost) × 100 (NULL if line_cost = 0)';
COMMENT ON CONSTRAINT uq_order_lines_unique ON order_lines IS 'Prevents duplicate line items for idempotency';
