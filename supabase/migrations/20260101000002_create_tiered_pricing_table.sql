-- Migration: Create tiered_pricing table
-- Description: Defines tiered pricing rules based on quantity
-- Source: Tiered_Pricing.csv

CREATE TABLE IF NOT EXISTS tiered_pricing (
  product_id INTEGER PRIMARY KEY,
  product_name TEXT,
  strength TEXT,
  cost_per_unit NUMERIC(10,2),
  msrp_slashed NUMERIC(10,2),
  price_1_unit NUMERIC(10,2) NOT NULL,
  price_2_units NUMERIC(10,2),
  price_3_units NUMERIC(10,2),
  price_5_plus NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_tiered_pricing_product_id 
    FOREIGN KEY (product_id) 
    REFERENCES products(product_id) 
    ON DELETE CASCADE
);

-- Indexes for tiered_pricing table
CREATE INDEX IF NOT EXISTS idx_tiered_pricing_product_id_fk ON tiered_pricing(product_id);

-- Comments
COMMENT ON TABLE tiered_pricing IS 'Tiered pricing rules based on quantity ordered';
COMMENT ON COLUMN tiered_pricing.price_1_unit IS 'Price when quantity = 1';
COMMENT ON COLUMN tiered_pricing.price_2_units IS 'Price per unit when quantity = 2';
COMMENT ON COLUMN tiered_pricing.price_3_units IS 'Price per unit when quantity = 3';
COMMENT ON COLUMN tiered_pricing.price_5_plus IS 'Price per unit when quantity >= 5';
COMMENT ON COLUMN tiered_pricing.price_3_units IS 'Note: Qty = 4 uses price_3_units (assumption)';
