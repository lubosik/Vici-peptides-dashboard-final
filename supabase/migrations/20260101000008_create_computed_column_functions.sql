-- Migration: Create computed column functions and triggers
-- Description: Functions and triggers to automatically calculate derived values

-- ============================================================================
-- LINE-LEVEL CALCULATIONS
-- ============================================================================

-- Function: Calculate line-level values
CREATE OR REPLACE FUNCTION calculate_line_values()
RETURNS TRIGGER AS $$
BEGIN
  -- Line_Total = Qty_Ordered × Customer_Paid_Per_Unit
  NEW.line_total := NEW.qty_ordered * NEW.customer_paid_per_unit;
  
  -- Line_Cost = Qty_Ordered × Our_Cost_Per_Unit
  NEW.line_cost := NEW.qty_ordered * COALESCE(NEW.our_cost_per_unit, 0);
  
  -- Line_Profit = Line_Total - Line_Cost
  NEW.line_profit := NEW.line_total - NEW.line_cost;
  
  -- Line_ROI_Percent = (Line_Profit / Line_Cost) × 100
  IF NEW.line_cost = 0 AND NEW.line_profit > 0 THEN
    NEW.line_roi_percent := NULL; -- Infinite ROI
  ELSIF NEW.line_cost = 0 THEN
    NEW.line_roi_percent := NULL;
  ELSE
    NEW.line_roi_percent := (NEW.line_profit / NEW.line_cost) * 100;
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update line values on insert/update
CREATE TRIGGER trigger_calculate_line_values
  BEFORE INSERT OR UPDATE ON order_lines
  FOR EACH ROW
  EXECUTE FUNCTION calculate_line_values();

-- ============================================================================
-- ORDER-LEVEL CALCULATIONS
-- ============================================================================

-- Function: Recalculate order totals from line items
CREATE OR REPLACE FUNCTION recalculate_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_order_subtotal NUMERIC(10,2);
  v_order_product_cost NUMERIC(10,2);
  v_shipping_net_cost_absorbed NUMERIC(10,2);
  v_order_total NUMERIC(10,2);
  v_order_cost NUMERIC(10,2);
  v_order_profit NUMERIC(10,2);
  v_order_roi_percent NUMERIC(10,2);
  v_order_record RECORD;
BEGIN
  -- Get order record
  SELECT * INTO v_order_record FROM orders WHERE order_number = COALESCE(NEW.order_number, OLD.order_number);
  
  -- Order_Subtotal = SUM(Line_Total) WHERE Order_# = order_number
  SELECT COALESCE(SUM(line_total), 0) INTO v_order_subtotal
  FROM order_lines
  WHERE order_number = v_order_record.order_number;
  
  -- Order_Product_Cost = SUM(Line_Cost) WHERE Order_# = order_number
  SELECT COALESCE(SUM(line_cost), 0) INTO v_order_product_cost
  FROM order_lines
  WHERE order_number = v_order_record.order_number;
  
  -- Shipping_Net_Cost_Absorbed
  IF v_order_record.free_shipping = true THEN
    v_shipping_net_cost_absorbed := COALESCE(v_order_record.shipping_cost, 0);
  ELSE
    v_shipping_net_cost_absorbed := GREATEST(0, COALESCE(v_order_record.shipping_cost, 0) - COALESCE(v_order_record.shipping_charged, 0));
  END IF;
  
  -- Order_Total = Order_Subtotal + Shipping_Charged - Coupon_Discount
  v_order_total := v_order_subtotal + COALESCE(v_order_record.shipping_charged, 0) - COALESCE(v_order_record.coupon_discount, 0);
  
  -- Order_Cost = Order_Product_Cost + Shipping_Net_Cost_Absorbed
  v_order_cost := v_order_product_cost + v_shipping_net_cost_absorbed;
  
  -- Order_Profit = Order_Total - Order_Cost
  v_order_profit := v_order_total - v_order_cost;
  
  -- Order_ROI_Percent = (Order_Profit / Order_Cost) × 100
  IF v_order_cost = 0 AND v_order_profit > 0 THEN
    v_order_roi_percent := NULL; -- Infinite ROI
  ELSIF v_order_cost = 0 THEN
    v_order_roi_percent := NULL;
  ELSE
    v_order_roi_percent := (v_order_profit / v_order_cost) * 100;
  END IF;
  
  -- Update order record
  UPDATE orders
  SET
    order_subtotal = v_order_subtotal,
    order_product_cost = v_order_product_cost,
    shipping_net_cost_absorbed = v_shipping_net_cost_absorbed,
    order_total = v_order_total,
    order_cost = v_order_cost,
    order_profit = v_order_profit,
    order_roi_percent = v_order_roi_percent,
    updated_at = NOW()
  WHERE order_number = v_order_record.order_number;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger: Recalculate order totals when order_lines change
CREATE TRIGGER trigger_recalculate_order_totals
  AFTER INSERT OR UPDATE OR DELETE ON order_lines
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_order_totals();

-- Function: Recalculate order totals when order fields change
CREATE OR REPLACE FUNCTION recalculate_order_totals_on_order_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger recalculation by calling the same logic
  PERFORM recalculate_order_totals();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Recalculate order totals when shipping/coupon fields change
CREATE TRIGGER trigger_recalculate_order_totals_on_order_update
  AFTER UPDATE OF shipping_charged, shipping_cost, free_shipping, coupon_discount ON orders
  FOR EACH ROW
  WHEN (OLD.shipping_charged IS DISTINCT FROM NEW.shipping_charged
     OR OLD.shipping_cost IS DISTINCT FROM NEW.shipping_cost
     OR OLD.free_shipping IS DISTINCT FROM NEW.free_shipping
     OR OLD.coupon_discount IS DISTINCT FROM NEW.coupon_discount)
  EXECUTE FUNCTION recalculate_order_totals_on_order_update();

-- ============================================================================
-- PRODUCT-LEVEL CALCULATIONS
-- ============================================================================

-- Function: Recalculate product inventory and margins
CREATE OR REPLACE FUNCTION recalculate_product_values()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id INTEGER;
  v_qty_sold INTEGER;
  v_current_stock INTEGER;
  v_stock_status TEXT;
  v_unit_margin NUMERIC(10,2);
  v_margin_percent NUMERIC(10,2);
  v_product_record RECORD;
BEGIN
  -- Get product_id from trigger
  v_product_id := COALESCE(NEW.product_id, OLD.product_id);
  
  -- Get product record
  SELECT * INTO v_product_record FROM products WHERE product_id = v_product_id;
  
  -- Qty_Sold = SUM(Qty_Ordered) WHERE Product_ID = product_id
  SELECT COALESCE(SUM(qty_ordered), 0) INTO v_qty_sold
  FROM order_lines
  WHERE product_id = v_product_id;
  
  -- Current_Stock = Starting_Qty - Qty_Sold
  v_current_stock := COALESCE(v_product_record.starting_qty, 0) - v_qty_sold;
  
  -- Stock_Status
  IF v_current_stock <= 0 THEN
    v_stock_status := 'OUT OF STOCK';
  ELSIF v_product_record.reorder_level IS NOT NULL AND v_current_stock <= v_product_record.reorder_level THEN
    v_stock_status := 'LOW STOCK';
  ELSE
    v_stock_status := 'In Stock';
  END IF;
  
  -- Unit_Margin = Retail_Price - Our_Cost
  IF v_product_record.retail_price IS NOT NULL THEN
    v_unit_margin := v_product_record.retail_price - COALESCE(v_product_record.our_cost, 0);
  ELSE
    v_unit_margin := NULL;
  END IF;
  
  -- Margin_Percent = (Unit_Margin / Retail_Price) × 100
  IF v_product_record.retail_price IS NOT NULL AND v_product_record.retail_price > 0 THEN
    v_margin_percent := (v_unit_margin / v_product_record.retail_price) * 100;
  ELSE
    v_margin_percent := NULL;
  END IF;
  
  -- Update product record
  UPDATE products
  SET
    qty_sold = v_qty_sold,
    current_stock = v_current_stock,
    stock_status = v_stock_status,
    unit_margin = v_unit_margin,
    margin_percent = v_margin_percent,
    updated_at = NOW()
  WHERE product_id = v_product_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger: Recalculate product values when order_lines change
CREATE TRIGGER trigger_recalculate_product_values
  AFTER INSERT OR UPDATE OR DELETE ON order_lines
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_product_values();

-- Function: Recalculate product margins when cost/price changes
CREATE OR REPLACE FUNCTION recalculate_product_margins()
RETURNS TRIGGER AS $$
DECLARE
  v_unit_margin NUMERIC(10,2);
  v_margin_percent NUMERIC(10,2);
BEGIN
  -- Unit_Margin = Retail_Price - Our_Cost
  IF NEW.retail_price IS NOT NULL THEN
    v_unit_margin := NEW.retail_price - COALESCE(NEW.our_cost, 0);
  ELSE
    v_unit_margin := NULL;
  END IF;
  
  -- Margin_Percent = (Unit_Margin / Retail_Price) × 100
  IF NEW.retail_price IS NOT NULL AND NEW.retail_price > 0 THEN
    v_margin_percent := (v_unit_margin / NEW.retail_price) * 100;
  ELSE
    v_margin_percent := NULL;
  END IF;
  
  NEW.unit_margin := v_unit_margin;
  NEW.margin_percent := v_margin_percent;
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Recalculate product margins when cost/price changes
CREATE TRIGGER trigger_recalculate_product_margins
  BEFORE INSERT OR UPDATE OF our_cost, retail_price ON products
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_product_margins();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_tiered_pricing_updated_at
  BEFORE UPDATE ON tiered_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_order_lines_updated_at
  BEFORE UPDATE ON order_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON FUNCTION calculate_line_values() IS 'Calculates line_total, line_cost, line_profit, line_roi_percent for order_lines';
COMMENT ON FUNCTION recalculate_order_totals() IS 'Recalculates all order-level totals from line items';
COMMENT ON FUNCTION recalculate_product_values() IS 'Recalculates product inventory (qty_sold, current_stock, stock_status) and margins';
COMMENT ON FUNCTION recalculate_product_margins() IS 'Recalculates product margins when cost or price changes';
