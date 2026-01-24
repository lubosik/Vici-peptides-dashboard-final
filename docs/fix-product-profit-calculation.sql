-- SQL Script: Fix Product Profit Calculation
-- Description: This script recalculates line_profit for all order_lines
--              in case the trigger didn't fire or values are incorrect

-- First, let's check the current state
SELECT 
  COUNT(*) as total_lines,
  COUNT(CASE WHEN line_profit IS NULL OR line_profit = 0 THEN 1 END) as zero_profit_lines,
  SUM(line_total) as total_revenue,
  SUM(line_cost) as total_cost,
  SUM(line_profit) as total_profit,
  SUM(line_total - line_cost) as calculated_profit
FROM order_lines;

-- Update line_profit for all rows where it's NULL or 0
-- This recalculates: line_profit = line_total - line_cost
UPDATE order_lines
SET 
  line_profit = line_total - line_cost,
  line_roi_percent = CASE
    WHEN (line_total - line_cost) = 0 AND line_cost = 0 THEN NULL
    WHEN line_cost = 0 THEN NULL
    ELSE ((line_total - line_cost) / line_cost) * 100
  END,
  updated_at = NOW()
WHERE line_profit IS NULL 
   OR line_profit = 0
   OR line_profit != (line_total - line_cost);

-- Verify the fix
SELECT 
  COUNT(*) as total_lines,
  COUNT(CASE WHEN line_profit IS NULL OR line_profit = 0 THEN 1 END) as zero_profit_lines,
  SUM(line_total) as total_revenue,
  SUM(line_cost) as total_cost,
  SUM(line_profit) as total_profit
FROM order_lines;

-- Check product-level profit aggregation
SELECT 
  p.product_id,
  p.product_name,
  COUNT(ol.line_id) as order_count,
  SUM(ol.line_total) as total_revenue,
  SUM(ol.line_cost) as total_cost,
  SUM(ol.line_profit) as total_profit,
  SUM(ol.line_total - ol.line_cost) as calculated_profit
FROM products p
LEFT JOIN order_lines ol ON p.product_id = ol.product_id
GROUP BY p.product_id, p.product_name
HAVING SUM(ol.line_profit) != SUM(ol.line_total - ol.line_cost)
   OR SUM(ol.line_profit) = 0
ORDER BY total_profit DESC
LIMIT 20;
