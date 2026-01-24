-- Migration: Create orders table
-- Description: Order parent records (one row per order)
-- Source: Orders.csv (aggregated by Order_#)

CREATE TABLE IF NOT EXISTS orders (
  order_number TEXT PRIMARY KEY,
  order_date TIMESTAMP WITH TIME ZONE NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  shipping_charged NUMERIC(10,2) DEFAULT 0,
  shipping_cost NUMERIC(10,2) DEFAULT 0,
  free_shipping BOOLEAN DEFAULT false,
  coupon_code TEXT,
  coupon_discount NUMERIC(10,2) DEFAULT 0,
  payment_method TEXT,
  order_status TEXT NOT NULL,
  notes TEXT,
  -- Computed columns (updated via triggers)
  order_subtotal NUMERIC(10,2) DEFAULT 0,
  order_product_cost NUMERIC(10,2) DEFAULT 0,
  shipping_net_cost_absorbed NUMERIC(10,2) DEFAULT 0,
  order_total NUMERIC(10,2) DEFAULT 0,
  order_cost NUMERIC(10,2) DEFAULT 0,
  order_profit NUMERIC(10,2) DEFAULT 0,
  order_roi_percent NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_orders_coupon_code 
    FOREIGN KEY (coupon_code) 
    REFERENCES coupons(coupon_code) 
    ON DELETE SET NULL
);

-- Indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON orders(coupon_code);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_free_shipping ON orders(free_shipping);

-- Comments
COMMENT ON TABLE orders IS 'Order parent records (one row per order)';
COMMENT ON COLUMN orders.order_number IS 'Unique order identifier (e.g., "Order #1281")';
COMMENT ON COLUMN orders.order_subtotal IS 'Computed: SUM(order_lines.line_total)';
COMMENT ON COLUMN orders.order_product_cost IS 'Computed: SUM(order_lines.line_cost)';
COMMENT ON COLUMN orders.shipping_net_cost_absorbed IS 'Computed: IF free_shipping THEN shipping_cost ELSE MAX(0, shipping_cost - shipping_charged)';
COMMENT ON COLUMN orders.order_total IS 'Computed: order_subtotal + shipping_charged - coupon_discount';
COMMENT ON COLUMN orders.order_cost IS 'Computed: order_product_cost + shipping_net_cost_absorbed';
COMMENT ON COLUMN orders.order_profit IS 'Computed: order_total - order_cost';
COMMENT ON COLUMN orders.order_roi_percent IS 'Computed: (order_profit / order_cost) × 100 (NULL if order_cost = 0)';
