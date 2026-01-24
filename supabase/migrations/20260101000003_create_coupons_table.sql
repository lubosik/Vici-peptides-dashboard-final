-- Migration: Create coupons table
-- Description: Coupon code definitions and discount rules
-- Source: Coupons.csv

CREATE TABLE IF NOT EXISTS coupons (
  coupon_code TEXT PRIMARY KEY,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('Percent', 'Fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for coupons table
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active);
CREATE INDEX IF NOT EXISTS idx_coupons_discount_type ON coupons(discount_type);

-- Comments
COMMENT ON TABLE coupons IS 'Coupon code definitions and discount rules';
COMMENT ON COLUMN coupons.discount_type IS 'Type of discount: "Percent" or "Fixed"';
COMMENT ON COLUMN coupons.discount_value IS 'Discount amount: percentage (e.g., 10.0) or fixed currency';
COMMENT ON COLUMN coupons.active IS 'Whether coupon is currently active';
