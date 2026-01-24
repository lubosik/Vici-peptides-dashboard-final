-- Migration: Create products table
-- Description: Master product catalog with inventory and pricing
-- Source: Product_Inventory.csv

CREATE TABLE IF NOT EXISTS products (
  product_id INTEGER PRIMARY KEY,
  product_name TEXT NOT NULL,
  variant_strength TEXT,
  sku_code TEXT UNIQUE,
  lot_number TEXT,
  starting_qty INTEGER,
  qty_sold INTEGER DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  reorder_level INTEGER,
  stock_status TEXT,
  our_cost NUMERIC(10,2),
  retail_price NUMERIC(10,2),
  unit_margin NUMERIC(10,2),
  margin_percent NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for products table
CREATE INDEX IF NOT EXISTS idx_products_sku_code ON products(sku_code);
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(stock_status);
CREATE INDEX IF NOT EXISTS idx_products_product_name ON products(product_name);

-- Comments
COMMENT ON TABLE products IS 'Master product catalog with inventory and pricing data';
COMMENT ON COLUMN products.product_id IS 'Primary key, unique product identifier';
COMMENT ON COLUMN products.qty_sold IS 'Computed: SUM(order_lines.qty_ordered) WHERE product_id matches';
COMMENT ON COLUMN products.current_stock IS 'Computed: starting_qty - qty_sold';
COMMENT ON COLUMN products.stock_status IS 'Computed: "In Stock", "LOW STOCK", or "OUT OF STOCK"';
COMMENT ON COLUMN products.unit_margin IS 'Computed: retail_price - our_cost';
COMMENT ON COLUMN products.margin_percent IS 'Computed: (unit_margin / retail_price) × 100';
