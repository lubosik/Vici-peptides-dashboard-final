# Calculations Reference

This document defines every calculation used in the dashboard with explicit, deterministic formulas. All calculations must match the spreadsheet's intent and be traceable to source data.

## Parsing Functions

### parseMoney(currencyString: string): number
Parses currency strings to numeric values.

**Input formats:**
- "$195.00" → 195.00
- "$4,872.00" → 4872.00
- "$0.00" → 0.00
- Empty string or null → 0.00

**Implementation:**
```typescript
function parseMoney(str: string): number {
  if (!str || str.trim() === '') return 0;
  return parseFloat(str.replace(/[$,]/g, '')) || 0;
}
```

### parsePercent(percentString: string): number
Parses percentage strings to numeric values (as decimal, not percentage points).

**Input formats:**
- "622.2%" → 622.2
- "10.0%" → 10.0
- "89.9%" → 89.9
- Empty string or null → 0.00

**Implementation:**
```typescript
function parsePercent(str: string): number {
  if (!str || str.trim() === '') return 0;
  return parseFloat(str.replace(/%/g, '')) || 0;
}
```

### parseBoolean(yesNoString: string): boolean
Parses "Yes"/"No" strings to boolean.

**Input formats:**
- "Yes" → true
- "No" → false
- Empty string or null → false (default assumption)

**Implementation:**
```typescript
function parseBoolean(str: string): boolean {
  return str?.toLowerCase().trim() === 'yes';
}
```

---

## Line-Level Calculations

### Line_Total
**Formula:** `Line_Total = Qty_Ordered × Customer_Paid_Per_Unit`

**Source:** Orders.csv
- `Qty_Ordered`: integer
- `Customer_Paid_Per_Unit`: currency (parsed from "$X.XX" format)

**Example:**
- Qty_Ordered = 2
- Customer_Paid_Per_Unit = $130.00
- Line_Total = 2 × 130.00 = $260.00

**Database:** Stored as `NUMERIC(10,2)` in `order_lines.line_total`

---

### Line_Cost
**Formula:** `Line_Cost = Qty_Ordered × Our_Cost_Per_Unit`

**Source:** Orders.csv
- `Qty_Ordered`: integer
- `Our_Cost_Per_Unit`: currency (parsed from "$X.XX" format, may be empty/null)

**Edge Cases:**
- If `Our_Cost_Per_Unit` is empty/null → Line_Cost = 0.00
- If `Qty_Ordered` is 0 → Line_Cost = 0.00

**Example:**
- Qty_Ordered = 2
- Our_Cost_Per_Unit = $20.70
- Line_Cost = 2 × 20.70 = $41.40

**Database:** Stored as `NUMERIC(10,2)` in `order_lines.line_cost`

---

### Line_Profit
**Formula:** `Line_Profit = Line_Total - Line_Cost`

**Source:** Calculated from Line_Total and Line_Cost

**Edge Cases:**
- If Line_Cost = 0 and Line_Total > 0 → Line_Profit = Line_Total (infinite ROI scenario)
- If Line_Total < Line_Cost → Line_Profit is negative (loss)

**Example:**
- Line_Total = $260.00
- Line_Cost = $41.40
- Line_Profit = 260.00 - 41.40 = $218.60

**Database:** Stored as `NUMERIC(10,2)` in `order_lines.line_profit`

---

### Line_ROI_Percent
**Formula:** `Line_ROI_Percent = (Line_Profit / Line_Cost) × 100`

**Source:** Calculated from Line_Profit and Line_Cost

**Edge Cases:**
- If Line_Cost = 0 and Line_Profit > 0 → Line_ROI_Percent = NULL or "INFINITE" (handle as special case)
- If Line_Cost = 0 and Line_Profit = 0 → Line_ROI_Percent = NULL or 0
- If Line_Cost < 0 → Invalid (should not occur, but handle gracefully)

**Example:**
- Line_Profit = $218.60
- Line_Cost = $41.40
- Line_ROI_Percent = (218.60 / 41.40) × 100 = 528.0%

**Database:** Stored as `NUMERIC(10,2)` in `order_lines.line_roi_percent` (NULL allowed)

**SQL Implementation:**
```sql
CASE
  WHEN line_cost = 0 AND line_profit > 0 THEN NULL  -- Infinite ROI
  WHEN line_cost = 0 THEN NULL
  ELSE (line_profit / line_cost) * 100
END AS line_roi_percent
```

---

## Order-Level Calculations

### Order_Subtotal
**Formula:** `Order_Subtotal = SUM(Line_Total) WHERE Order_# = {order_number}`

**Source:** Sum of all `order_lines.line_total` for a given order

**Example:**
- Order #1281 has 2 line items:
  - Line 1: Line_Total = $195.00
  - Line 2: Line_Total = $20.00
- Order_Subtotal = 195.00 + 20.00 = $215.00

**Database:** Stored as `NUMERIC(10,2)` in `orders.order_subtotal`

**SQL Implementation:**
```sql
SELECT order_id, SUM(line_total) AS order_subtotal
FROM order_lines
GROUP BY order_id
```

---

### Order_Product_Cost
**Formula:** `Order_Product_Cost = SUM(Line_Cost) WHERE Order_# = {order_number}`

**Source:** Sum of all `order_lines.line_cost` for a given order

**Example:**
- Order #1281 has 2 line items:
  - Line 1: Line_Cost = $27.00
  - Line 2: Line_Cost = $3.00
- Order_Product_Cost = 27.00 + 3.00 = $30.00

**Database:** Stored as `NUMERIC(10,2)` in `orders.order_product_cost`

---

### Coupon_Discount
**Formula:** Determined by coupon rules or provided in payload

**Method 1: From Coupon Rules (if Coupon_Code provided)**
1. Lookup `Coupon_Code` in `coupons` table
2. If `Discount_Type = 'Percent'`:
   - `Coupon_Discount = Order_Subtotal × (Discount_Value / 100)`
3. If `Discount_Type = 'Fixed'`:
   - `Coupon_Discount = Discount_Value`

**Method 2: From Payload (if provided directly)**
- Use `Coupon_Discount` value from Orders.csv or Make.com payload

**Example (Percent):**
- Order_Subtotal = $260.00
- Coupon_Code = "LOYAL10"
- Discount_Type = "Percent", Discount_Value = 10.0%
- Coupon_Discount = 260.00 × (10.0 / 100) = $26.00

**Database:** Stored as `NUMERIC(10,2)` in `orders.coupon_discount` (default 0.00)

---

### Shipping_Net_Cost_Absorbed
**Formula:**
```
IF Free_Shipping = "Yes" THEN
  Shipping_Net_Cost_Absorbed = Shipping_Cost
ELSE IF Free_Shipping = "No" THEN
  Shipping_Net_Cost_Absorbed = MAX(0, Shipping_Cost - Shipping_Charged)
ELSE
  Shipping_Net_Cost_Absorbed = MAX(0, Shipping_Cost - Shipping_Charged)  -- Default assumption
END IF
```

**Source:** Orders.csv
- `Free_Shipping?`: boolean (parsed from "Yes"/"No")
- `Shipping_Cost`: currency (may be empty/null)
- `Shipping_Charged`: currency (may be empty/null)

**Edge Cases:**
- If `Shipping_Cost` is empty/null → Shipping_Net_Cost_Absorbed = 0.00
- If `Shipping_Charged` is empty/null → treat as 0.00
- If `Shipping_Cost < Shipping_Charged` → Shipping_Net_Cost_Absorbed = 0.00 (we made money on shipping)

**Example 1 (Free Shipping):**
- Free_Shipping = "Yes"
- Shipping_Cost = $5.26
- Shipping_Charged = $0.00
- Shipping_Net_Cost_Absorbed = $5.26 (we absorb full cost)

**Example 2 (Paid Shipping):**
- Free_Shipping = "No"
- Shipping_Cost = $6.09
- Shipping_Charged = $6.09
- Shipping_Net_Cost_Absorbed = MAX(0, 6.09 - 6.09) = $0.00 (customer paid, we absorb nothing)

**Example 3 (Partial Absorption):**
- Free_Shipping = "No"
- Shipping_Cost = $6.09
- Shipping_Charged = $5.00
- Shipping_Net_Cost_Absorbed = MAX(0, 6.09 - 5.00) = $1.09 (we absorb difference)

**Database:** Stored as `NUMERIC(10,2)` in `orders.shipping_net_cost_absorbed`

---

### Order_Total
**Formula:** `Order_Total = Order_Subtotal + Shipping_Charged - Coupon_Discount`

**Source:** Calculated from Order_Subtotal, Shipping_Charged, and Coupon_Discount

**Edge Cases:**
- If `Shipping_Charged` is empty/null → treat as 0.00
- If `Coupon_Discount` is empty/null → treat as 0.00
- Order_Total can be negative if Coupon_Discount > Order_Subtotal (edge case, handle gracefully)

**Example:**
- Order_Subtotal = $260.00
- Shipping_Charged = $0.00
- Coupon_Discount = $26.00
- Order_Total = 260.00 + 0.00 - 26.00 = $234.00

**Database:** Stored as `NUMERIC(10,2)` in `orders.order_total`

---

### Order_Cost
**Formula:** `Order_Cost = Order_Product_Cost + Shipping_Net_Cost_Absorbed`

**Source:** Calculated from Order_Product_Cost and Shipping_Net_Cost_Absorbed

**Example:**
- Order_Product_Cost = $41.40
- Shipping_Net_Cost_Absorbed = $5.52
- Order_Cost = 41.40 + 5.52 = $46.92

**Database:** Stored as `NUMERIC(10,2)` in `orders.order_cost`

---

### Order_Profit
**Formula:** `Order_Profit = Order_Total - Order_Cost`

**Source:** Calculated from Order_Total and Order_Cost

**Edge Cases:**
- If Order_Cost = 0 and Order_Total > 0 → Order_Profit = Order_Total (infinite ROI scenario)
- If Order_Total < Order_Cost → Order_Profit is negative (loss)

**Example:**
- Order_Total = $234.00
- Order_Cost = $46.92
- Order_Profit = 234.00 - 46.92 = $187.08

**Database:** Stored as `NUMERIC(10,2)` in `orders.order_profit`

---

### Order_ROI_Percent
**Formula:** `Order_ROI_Percent = (Order_Profit / Order_Cost) × 100`

**Source:** Calculated from Order_Profit and Order_Cost

**Edge Cases:**
- If Order_Cost = 0 and Order_Profit > 0 → Order_ROI_Percent = NULL or "INFINITE"
- If Order_Cost = 0 and Order_Profit = 0 → Order_ROI_Percent = NULL or 0
- If Order_Cost < 0 → Invalid (handle gracefully)

**Example:**
- Order_Profit = $187.08
- Order_Cost = $46.92
- Order_ROI_Percent = (187.08 / 46.92) × 100 = 398.7%

**Database:** Stored as `NUMERIC(10,2)` in `orders.order_roi_percent` (NULL allowed)

**SQL Implementation:**
```sql
CASE
  WHEN order_cost = 0 AND order_profit > 0 THEN NULL
  WHEN order_cost = 0 THEN NULL
  ELSE (order_profit / order_cost) * 100
END AS order_roi_percent
```

---

## Company-Level Calculations

**CRITICAL:** All company totals must sum **distinct orders** (not line items) to avoid double-counting revenue, cost, and profit.

### Total_Revenue
**Formula:** `Total_Revenue = SUM(DISTINCT Order_Total) FROM orders`

**Source:** Sum of `orders.order_total` for all distinct orders

**SQL Implementation:**
```sql
SELECT SUM(order_total) AS total_revenue
FROM orders
WHERE order_status NOT IN ('cancelled', 'refunded')  -- Optional: exclude cancelled/refunded
```

**Note:** If cancelled/refunded orders should be excluded, add WHERE clause. Otherwise, include all orders.

---

### Total_Product_Cost (COGS)
**Formula:** `Total_Product_Cost = SUM(DISTINCT Order_Product_Cost) FROM orders`

**Source:** Sum of `orders.order_product_cost` for all distinct orders

**SQL Implementation:**
```sql
SELECT SUM(order_product_cost) AS total_product_cost
FROM orders
```

---

### Total_Shipping_Cost_Absorbed
**Formula:** `Total_Shipping_Cost_Absorbed = SUM(DISTINCT Shipping_Net_Cost_Absorbed) FROM orders`

**Source:** Sum of `orders.shipping_net_cost_absorbed` for all distinct orders

**SQL Implementation:**
```sql
SELECT SUM(shipping_net_cost_absorbed) AS total_shipping_cost_absorbed
FROM orders
```

---

### Total_Gross_Profit
**Formula:** `Total_Gross_Profit = Total_Revenue - Total_Product_Cost - Total_Shipping_Cost_Absorbed`

**Alternative (equivalent):**
`Total_Gross_Profit = SUM(DISTINCT Order_Profit) FROM orders`

**Source:** Calculated from company totals or sum of order profits

**Example:**
- Total_Revenue = $4,368.02
- Total_Product_Cost = $574.20
- Total_Shipping_Cost_Absorbed = $16.04
- Total_Gross_Profit = 4368.02 - 574.20 - 16.04 = $3,777.78

**SQL Implementation:**
```sql
SELECT SUM(order_profit) AS total_gross_profit
FROM orders
```

---

### Overall_ROI_Percent
**Formula:** `Overall_ROI_Percent = (Total_Gross_Profit / (Total_Product_Cost + Total_Shipping_Cost_Absorbed)) × 100`

**Source:** Calculated from Total_Gross_Profit, Total_Product_Cost, and Total_Shipping_Cost_Absorbed

**Edge Cases:**
- If (Total_Product_Cost + Total_Shipping_Cost_Absorbed) = 0 → Overall_ROI_Percent = NULL

**Example:**
- Total_Gross_Profit = $3,777.78
- Total_Product_Cost = $574.20
- Total_Shipping_Cost_Absorbed = $16.04
- Total_Cost = 574.20 + 16.04 = $590.24
- Overall_ROI_Percent = (3777.78 / 590.24) × 100 = 640.0%

**SQL Implementation:**
```sql
SELECT
  CASE
    WHEN (SUM(order_product_cost) + SUM(shipping_net_cost_absorbed)) = 0 THEN NULL
    ELSE (SUM(order_profit) / (SUM(order_product_cost) + SUM(shipping_net_cost_absorbed))) * 100
  END AS overall_roi_percent
FROM orders
```

---

### Total_Units_Sold
**Formula:** `Total_Units_Sold = SUM(Qty_Ordered) FROM order_lines`

**Source:** Sum of all `order_lines.qty_ordered` (line-level, not order-level)

**SQL Implementation:**
```sql
SELECT SUM(qty_ordered) AS total_units_sold
FROM order_lines
```

---

### Unique_Orders
**Formula:** `Unique_Orders = COUNT(DISTINCT Order_#) FROM orders`

**Source:** Count of distinct `orders.order_number`

**SQL Implementation:**
```sql
SELECT COUNT(DISTINCT order_number) AS unique_orders
FROM orders
```

---

### Average_Order_Value
**Formula:** `Average_Order_Value = Total_Revenue / Unique_Orders`

**Source:** Calculated from Total_Revenue and Unique_Orders

**Edge Cases:**
- If Unique_Orders = 0 → Average_Order_Value = NULL or 0

**Example:**
- Total_Revenue = $4,368.02
- Unique_Orders = 35
- Average_Order_Value = 4368.02 / 35 = $124.80

**SQL Implementation:**
```sql
SELECT
  CASE
    WHEN COUNT(DISTINCT order_number) = 0 THEN NULL
    ELSE SUM(order_total) / COUNT(DISTINCT order_number)
  END AS average_order_value
FROM orders
```

---

## Product-Level Calculations

### Qty_Sold (by Product)
**Formula:** `Qty_Sold = SUM(Qty_Ordered) FROM order_lines WHERE Product_ID = {product_id}`

**Source:** Sum of `order_lines.qty_ordered` grouped by `product_id`

**SQL Implementation:**
```sql
SELECT product_id, SUM(qty_ordered) AS qty_sold
FROM order_lines
GROUP BY product_id
```

---

### Total_Revenue (by Product)
**Formula:** `Total_Revenue = SUM(Line_Total) FROM order_lines WHERE Product_ID = {product_id}`

**Source:** Sum of `order_lines.line_total` grouped by `product_id`

**SQL Implementation:**
```sql
SELECT product_id, SUM(line_total) AS total_revenue
FROM order_lines
GROUP BY product_id
```

---

### Total_Cost (by Product)
**Formula:** `Total_Cost = SUM(Line_Cost) FROM order_lines WHERE Product_ID = {product_id}`

**Source:** Sum of `order_lines.line_cost` grouped by `product_id`

**SQL Implementation:**
```sql
SELECT product_id, SUM(line_cost) AS total_cost
FROM order_lines
GROUP BY product_id
```

---

### Total_Profit (by Product)
**Formula:** `Total_Profit = SUM(Line_Profit) FROM order_lines WHERE Product_ID = {product_id}`

**Alternative (equivalent):**
`Total_Profit = Total_Revenue - Total_Cost`

**SQL Implementation:**
```sql
SELECT product_id, SUM(line_profit) AS total_profit
FROM order_lines
GROUP BY product_id
```

---

### ROI_Percent (by Product)
**Formula:** `ROI_Percent = (Total_Profit / Total_Cost) × 100 WHERE Product_ID = {product_id}`

**Edge Cases:**
- If Total_Cost = 0 and Total_Profit > 0 → ROI_Percent = NULL
- If Total_Cost = 0 → ROI_Percent = NULL

**SQL Implementation:**
```sql
SELECT
  product_id,
  CASE
    WHEN SUM(line_cost) = 0 AND SUM(line_profit) > 0 THEN NULL
    WHEN SUM(line_cost) = 0 THEN NULL
    ELSE (SUM(line_profit) / SUM(line_cost)) * 100
  END AS roi_percent
FROM order_lines
GROUP BY product_id
```

---

## Inventory Calculations

### Current_Stock
**Formula:** `Current_Stock = Starting_Qty - Qty_Sold`

**Source:**
- `Starting_Qty`: from `products.starting_qty` (may be empty/null)
- `Qty_Sold`: calculated from `order_lines` (see Product-Level Calculations)

**Edge Cases:**
- If `Starting_Qty` is empty/null → Current_Stock = 0 - Qty_Sold (can be negative)
- If `Qty_Sold` > `Starting_Qty` → Current_Stock is negative (oversold)

**Example:**
- Starting_Qty = 100
- Qty_Sold = 17
- Current_Stock = 100 - 17 = 83

**Database:** Stored as `INTEGER` in `products.current_stock` (computed column or updated via trigger)

---

### Stock_Status
**Formula:**
```
IF Current_Stock = 0 THEN
  Stock_Status = "OUT OF STOCK"
ELSE IF Current_Stock <= Reorder_Level AND Reorder_Level IS NOT NULL THEN
  Stock_Status = "LOW STOCK"
ELSE
  Stock_Status = "In Stock"
END IF
```

**Source:**
- `Current_Stock`: calculated (see above)
- `Reorder_Level`: from `products.reorder_level` (may be empty/null)

**Edge Cases:**
- If `Reorder_Level` is empty/null → Stock_Status = "In Stock" if Current_Stock > 0, else "OUT OF STOCK"
- If `Current_Stock` < 0 → Stock_Status = "OUT OF STOCK" (oversold)

**SQL Implementation:**
```sql
CASE
  WHEN current_stock <= 0 THEN 'OUT OF STOCK'
  WHEN reorder_level IS NOT NULL AND current_stock <= reorder_level THEN 'LOW STOCK'
  ELSE 'In Stock'
END AS stock_status
```

---

## Margin Calculations

### Unit_Margin
**Formula:** `Unit_Margin = Retail_Price - Our_Cost`

**Source:**
- `Retail_Price`: from `products.retail_price` (may be empty/null)
- `Our_Cost`: from `products.our_cost` (may be empty/null)

**Edge Cases:**
- If `Our_Cost` is empty/null → Unit_Margin = Retail_Price (assume cost is 0)
- If `Retail_Price` is empty/null → Unit_Margin = NULL

**Example:**
- Retail_Price = $195.00
- Our_Cost = $27.00
- Unit_Margin = 195.00 - 27.00 = $168.00

**Database:** Stored as `NUMERIC(10,2)` in `products.unit_margin` (computed column or updated via trigger)

---

### Margin_Percent
**Formula:** `Margin_Percent = (Unit_Margin / Retail_Price) × 100`

**Source:** Calculated from Unit_Margin and Retail_Price

**Edge Cases:**
- If `Retail_Price` = 0 → Margin_Percent = NULL
- If `Retail_Price` is empty/null → Margin_Percent = NULL

**Example:**
- Unit_Margin = $168.00
- Retail_Price = $195.00
- Margin_Percent = (168.00 / 195.00) × 100 = 86.2%

**Database:** Stored as `NUMERIC(10,2)` in `products.margin_percent` (computed column or updated via trigger)

**SQL Implementation:**
```sql
CASE
  WHEN retail_price = 0 OR retail_price IS NULL THEN NULL
  ELSE ((retail_price - COALESCE(our_cost, 0)) / retail_price) * 100
END AS margin_percent
```

---

## Tiered Pricing Calculations

### Get_Tiered_Price(Product_ID, Qty_Ordered)
**Formula:**
```
IF Qty_Ordered = 1 THEN
  Price = Price_1_Unit
ELSE IF Qty_Ordered = 2 THEN
  Price = Price_2_Units
ELSE IF Qty_Ordered = 3 THEN
  Price = Price_3_Units
ELSE IF Qty_Ordered >= 5 THEN
  Price = Price_5_Plus
ELSE IF Qty_Ordered = 4 THEN
  Price = Price_3_Units  -- Assumption: use closest lower tier
END IF
```

**Source:** `tiered_pricing` table

**Edge Cases:**
- If no tiered pricing entry exists for Product_ID → use `products.retail_price` as fallback
- If Qty_Ordered = 4 → use Price_3_Units (assumption documented)

**SQL Implementation:**
```sql
CASE
  WHEN qty_ordered = 1 THEN price_1_unit
  WHEN qty_ordered = 2 THEN price_2_units
  WHEN qty_ordered = 3 THEN price_3_units
  WHEN qty_ordered >= 5 THEN price_5_plus
  WHEN qty_ordered = 4 THEN price_3_units  -- Assumption
  ELSE price_1_unit  -- Fallback
END AS tiered_price
```

**Usage:** This function determines `Customer_Paid_Per_Unit` when tiered pricing is applied. If tiered pricing is not available, use `products.retail_price`.

---

## Expense Calculations

### Total_Operating_Expenses
**Formula:** `Total_Operating_Expenses = SUM(Amount) FROM expenses`

**Source:** Sum of all `expenses.amount`

**SQL Implementation:**
```sql
SELECT SUM(amount) AS total_operating_expenses
FROM expenses
```

---

### Total_Expenses_By_Category
**Formula:** `Total_Expenses = SUM(Amount) FROM expenses WHERE Category = {category}`

**Source:** Sum of `expenses.amount` grouped by `category`

**SQL Implementation:**
```sql
SELECT category, SUM(amount) AS total_expenses
FROM expenses
GROUP BY category
```

---

### Net_Profit_After_Expenses
**Formula:** `Net_Profit_After_Expenses = Total_Gross_Profit - Total_Operating_Expenses`

**Source:** Calculated from Total_Gross_Profit and Total_Operating_Expenses

**Example:**
- Total_Gross_Profit = $3,777.78
- Total_Operating_Expenses = $8,015.67
- Net_Profit_After_Expenses = 3777.78 - 8015.67 = -$4,237.89

---

### Net_ROI_Percent_After_Expenses
**Formula:** `Net_ROI_Percent = (Net_Profit_After_Expenses / (Total_Product_Cost + Total_Shipping_Cost_Absorbed)) × 100`

**Source:** Calculated from Net_Profit_After_Expenses, Total_Product_Cost, and Total_Shipping_Cost_Absorbed

**Edge Cases:**
- If (Total_Product_Cost + Total_Shipping_Cost_Absorbed) = 0 → Net_ROI_Percent = NULL
- Net_ROI_Percent can be negative if expenses exceed gross profit

**Example:**
- Net_Profit_After_Expenses = -$4,237.89
- Total_Product_Cost = $574.20
- Total_Shipping_Cost_Absorbed = $16.04
- Total_Cost = 574.20 + 16.04 = $590.24
- Net_ROI_Percent = (-4237.89 / 590.24) × 100 = -718.0%

---

## Calculation Order and Dependencies

1. **Line-Level:** Calculate Line_Total, Line_Cost, Line_Profit, Line_ROI_Percent
2. **Order-Level:** Aggregate line items → Order_Subtotal, Order_Product_Cost, then calculate shipping absorption, coupon discount, Order_Total, Order_Cost, Order_Profit, Order_ROI_Percent
3. **Product-Level:** Aggregate line items by Product_ID → Qty_Sold, Total_Revenue, Total_Cost, Total_Profit, ROI_Percent
4. **Inventory:** Calculate Current_Stock, Stock_Status
5. **Company-Level:** Aggregate distinct orders → Total_Revenue, Total_Product_Cost, Total_Shipping_Cost_Absorbed, Total_Gross_Profit, Overall_ROI_Percent
6. **Expense-Level:** Sum expenses → Total_Operating_Expenses, Net_Profit_After_Expenses, Net_ROI_Percent_After_Expenses

---

## Validation Rules

1. **Order Reconciliation:** For each order, verify: `Order_Total = SUM(Line_Total) + Shipping_Charged - Coupon_Discount`
2. **Profit Reconciliation:** For each order, verify: `Order_Profit = Order_Total - Order_Cost`
3. **Company Totals:** Verify: `Total_Gross_Profit = SUM(DISTINCT Order_Profit)` (summing orders, not lines)
4. **Inventory Reconciliation:** Verify: `Current_Stock = Starting_Qty - Qty_Sold` for each product
5. **ROI Validation:** All ROI calculations must handle division-by-zero gracefully (return NULL, not error)
