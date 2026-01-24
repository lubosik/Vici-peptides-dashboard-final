# Data Dictionary

This document describes every column in each CSV file, its data type, meaning, and usage in calculations.

## Orders.csv

**Purpose:** Contains order transactions with line items. Each row represents one line item; multi-product orders appear as multiple rows sharing the same `Order_#`.

**Critical Normalization Note:** This CSV is denormalized. Multi-product orders (e.g., Order #1281, Order #1286) appear as multiple rows with identical order-level fields. The system must normalize this into `orders` (parent) and `order_lines` (child) tables.

| Column | Type | Meaning | Usage | Level |
|--------|------|---------|-------|-------|
| `Order_Date` | Date/DateTime | Date and time when the order was placed | Used for date filtering, time-series analysis, and order chronology. Format varies: "2026-01-16" or "2026-01-20 2:15 AM" | Order |
| `Order_#` | String | Unique order identifier (e.g., "Order #1281", "Order 1704") | Primary key for grouping line items. Used to aggregate order totals. Format inconsistent: some have "#", some don't | Order |
| `Customer_Name` | String | Full name of the customer | Display and customer lookup | Order |
| `Customer_Email` | String | Customer email address | Customer identification and communication | Order |
| `Product_ID` | Integer | Foreign key to Product_Inventory.Product_ID | Links line item to product master data. Used for product-level aggregations | Line |
| `Qty_Ordered` | Integer | Quantity of this product ordered in this line item | Multiplied by unit price to get Line_Total. Summed by Product_ID to get Qty_Sold for inventory | Line |
| `Our_Cost_Per_Unit` | Currency (Decimal) | Cost per unit for this product (from Product_Inventory or Tiered_Pricing) | Multiplied by Qty_Ordered to get Line_Cost. Stored as numeric, displayed as currency | Line |
| `Customer_Paid_Per_Unit` | Currency (Decimal) | Price per unit the customer paid (may reflect tiered pricing or discounts) | Multiplied by Qty_Ordered to get Line_Total. May differ from Retail_Price if tiered pricing applied | Line |
| `Line_Total` | Currency (Decimal) | Revenue for this line item = Qty_Ordered × Customer_Paid_Per_Unit | Summed by Order_# to get Order_Total (before shipping and coupons). Used in product revenue aggregations | Line |
| `Line_Cost` | Currency (Decimal) | Cost for this line item = Qty_Ordered × Our_Cost_Per_Unit | Summed by Order_# to get Order_Cost (product cost portion). Used in profit calculations | Line |
| `Line_Profit` | Currency (Decimal) | Profit for this line item = Line_Total - Line_Cost | Used in line-level ROI calculation. Summed by Order_# to get Order_Profit (before shipping absorption) | Line |
| `Line_ROI_%` | Percentage (Decimal) | ROI for this line item = (Line_Profit / Line_Cost) × 100 | Display metric. Handles division-by-zero (if Line_Cost = 0, ROI is undefined or infinite) | Line |
| `Shipping_Charged` | Currency (Decimal) | Amount customer paid for shipping | Added to Order_Total. May be 0 if free shipping. Can be empty/null | Order |
| `Shipping_Cost` | Currency (Decimal) | Actual cost of shipping (what we paid) | Used to compute shipping_net_cost_absorbed. Can be empty/null | Order |
| `Free_Shipping?` | Boolean/String | Whether shipping was free ("Yes"/"No" or empty) | Determines shipping cost absorption logic. "Yes" means we absorb full Shipping_Cost | Order |
| `Order_Total` | Currency (Decimal) | Total order amount = sum(Line_Total) + Shipping_Charged - Coupon_Discount | Company revenue metric. Summed across distinct orders (not lines) to avoid double-counting | Order |
| `Order_Cost` | Currency (Decimal) | Total order cost = sum(Line_Cost) + shipping_net_cost_absorbed | Company cost metric. Includes product cost plus absorbed shipping | Order |
| `Order_Profit` | Currency (Decimal) | Total order profit = Order_Total - Order_Cost | Company profit metric. Summed across distinct orders | Order |
| `Order_ROI_%` | Percentage (Decimal) | ROI for entire order = (Order_Profit / Order_Cost) × 100 | Display metric. Handles division-by-zero | Order |
| `Payment_Method` | String | Payment method used (e.g., "Credit Card", "Zelle", "stripe", "woocommerce_payments") | Filtering and payment analytics. Values inconsistent (mixed case, different naming) | Order |
| `Order_Status` | String | Order status (e.g., "completed", "Completed", "processing", "cancelled", "on-hold") | Filtering and status analytics. Values inconsistent (case variations) | Order |
| `Notes` | String | Free-text notes about the order | Display only, not used in calculations | Order |
| `Coupon_Code` | String | Coupon code applied (e.g., "LOYAL10") | Links to Coupons table. Can be empty | Order |
| `Coupon_Discount` | Currency (Decimal) | Discount amount applied from coupon | Subtracted from Order_Total. Can be 0.00 or empty | Order |

**Data Quality Notes:**
- Some rows have empty values for Shipping_Charged, Shipping_Cost, Free_Shipping? (especially newer orders)
- Order_Date format inconsistent (date-only vs datetime)
- Order_# format inconsistent ("Order #1281" vs "Order 1704")
- Payment_Method and Order_Status have case inconsistencies
- Many trailing empty rows (lines 40-1022) should be filtered out during import

---

## Product_Inventory.csv

**Purpose:** Master product catalog with inventory tracking, pricing, and margin data.

| Column | Type | Meaning | Usage | Level |
|--------|------|---------|-------|-------|
| `Product_ID` | Integer | Primary key, unique product identifier | Foreign key from Orders.Product_ID. Used for joins and aggregations | Product |
| `Product_Name` | String | Product name (e.g., "Retatrutide", "BPC-157") | Display and product identification | Product |
| `Variant_Strength` | String | Product strength/variant (e.g., "10mg", "20mg", "100mg 10ml") | Display and product differentiation. Part of product identity | Product |
| `SKU_Code` | String | Stock Keeping Unit code (e.g., "RT10", "BC10") | Inventory management and product lookup | Product |
| `Lot_#` | String | Lot number for batch tracking (e.g., "RT10-2601-01") | Inventory tracking and quality control. Can be empty | Product |
| `Starting_Qty` | Integer | Initial inventory quantity | Used to compute Current_Stock = Starting_Qty - Qty_Sold. Can be empty/null | Product |
| `Qty_Sold` | Integer | Total quantity sold (derived from Orders) | Computed as sum(Orders.Qty_Ordered) WHERE Orders.Product_ID = Product_ID. Used in Current_Stock calculation | Product |
| `Current_Stock` | Integer | Current inventory = Starting_Qty - Qty_Sold | Used for stock status determination. Can be 0 or negative | Product |
| `Reorder_Level` | Integer | Threshold below which stock is considered "LOW STOCK" | Used in Stock_Status calculation. Can be empty/null | Product |
| `Stock_Status` | String | Status: "In Stock", "LOW STOCK", or "OUT OF STOCK" | Display and inventory alerts. Logic: if Current_Stock = 0 → "OUT OF STOCK", else if Current_Stock <= Reorder_Level → "LOW STOCK", else → "In Stock" | Product |
| `Our_Cost` | Currency (Decimal) | Cost per unit we pay for this product | Used in margin and profit calculations. Can be empty/null (products with no cost data) | Product |
| `Retail_Price` | Currency (Decimal) | Standard retail price per unit | Used in margin calculations. May differ from Customer_Paid_Per_Unit if tiered pricing applied | Product |
| `Unit_Margin` | Currency (Decimal) | Margin per unit = Retail_Price - Our_Cost | Display metric. Can be 0.00 if cost data missing | Product |
| `Margin_%` | Percentage (Decimal) | Margin percentage = (Unit_Margin / Retail_Price) × 100 | Display metric. Handles division-by-zero | Product |

**Data Quality Notes:**
- Many products have empty Our_Cost, Retail_Price, Unit_Margin, Margin_% (products not yet sold or cost data missing)
- Some products have empty Starting_Qty, Reorder_Level
- Stock_Status values: "In Stock", "OUT OF STOCK" (no "LOW STOCK" examples in sample, but logic supports it)

---

## Tiered_Pricing.csv

**Purpose:** Defines tiered pricing rules based on quantity ordered. Used to determine `Customer_Paid_Per_Unit` in Orders.

| Column | Type | Meaning | Usage | Level |
|--------|------|---------|-------|-------|
| `Product_ID` | Integer | Foreign key to Product_Inventory.Product_ID | Links pricing rules to products | Product |
| `Product_Name` | String | Product name (redundant with Product_Inventory, kept for reference) | Display only | Product |
| `Strength` | String | Product strength (redundant with Product_Inventory.Variant_Strength) | Display only | Product |
| `Cost_Per_Unit` | Currency (Decimal) | Cost per unit (redundant with Product_Inventory.Our_Cost) | May be used as fallback if Product_Inventory.Our_Cost is empty | Product |
| `MSRP_Slashed` | Currency (Decimal) | Manufacturer's Suggested Retail Price (crossed out) | Display/reference only, not used in calculations | Product |
| `Price_1_Unit` | Currency (Decimal) | Price when quantity = 1 | Used when Qty_Ordered = 1 | Product |
| `Price_2_Units` | Currency (Decimal) | Price per unit when quantity = 2 | Used when Qty_Ordered = 2 | Product |
| `Price_3_Units` | Currency (Decimal) | Price per unit when quantity = 3 | Used when Qty_Ordered = 3 | Product |
| `Price_5_Plus` | Currency (Decimal) | Price per unit when quantity >= 5 | Used when Qty_Ordered >= 5 | Product |

**Tier Selection Logic:**
- If Qty_Ordered = 1 → use Price_1_Unit
- If Qty_Ordered = 2 → use Price_2_Units
- If Qty_Ordered = 3 → use Price_3_Units
- If Qty_Ordered >= 5 → use Price_5_Plus
- If Qty_Ordered = 4 → **Gap in logic** (assumption: use Price_3_Units as closest tier, or Price_5_Plus if more conservative)

**Data Quality Notes:**
- Not all products have tiered pricing entries (only products with active sales)
- Missing tier for Qty_Ordered = 4 (assumption documented above)

---

## Coupons.csv

**Purpose:** Defines coupon codes and their discount rules.

| Column | Type | Meaning | Usage | Level |
|--------|------|---------|-------|-------|
| `Coupon_Code` | String | Unique coupon code (e.g., "LOYAL10") | Matched against Orders.Coupon_Code | Coupon |
| `Discount_Type` | String | Type of discount: "Percent" or "Fixed" (assumed, only "Percent" in sample) | Determines calculation method | Coupon |
| `Discount_Value` | String/Decimal | Discount amount: percentage (e.g., "10.0%") or fixed currency | Parsed to extract numeric value. For Percent: "10.0%" → 10.0 | Coupon |
| `Description` | String | Human-readable description (e.g., "10% off") | Display only | Coupon |
| `Active` | Boolean/String | Whether coupon is currently active ("Yes"/"No") | Filtering: only active coupons should be applied | Coupon |

**Coupon Application Logic:**
- If Discount_Type = "Percent": Coupon_Discount = Order_Subtotal × (Discount_Value / 100)
- If Discount_Type = "Fixed": Coupon_Discount = Discount_Value (assumed, not in sample)
- Coupon_Discount is applied at order level, subtracted from Order_Total

**Data Quality Notes:**
- Only one coupon in sample ("LOYAL10")
- Discount_Value format: "10.0%" (includes % symbol, needs parsing)

---

## Lists.csv

**Purpose:** Reference data for dropdowns and filters. Contains valid values for Payment_Methods, Order_Status, Free_Shipping, Expense_Categories, and Coupon_Codes.

| Column | Type | Meaning | Usage | Level |
|--------|------|---------|-------|-------|
| `Payment_Methods` | String | Valid payment method values | Used for filtering and validation. Values: "Credit Card", "Crypto (BTC)", "Crypto (ETH)", "Crypto (USDT)", "PayPal", "Bank Transfer", "Zelle", "stripe", "woocommerce_payments", "mycryptocheckout" | Reference |
| `Order_Status` | String | Valid order status values | Used for filtering and validation. Values: "Pending", "Processing", "Shipped", "Delivered", "Completed", "Cancelled", "Refunded", "completed", "processing", "cancelled", "on-hold", "checkout-draft" | Reference |
| `Free_Shipping` | String | Valid free shipping values | Used for filtering. Values: "Yes", "No" (or empty) | Reference |
| `Expense_Categories` | String | Valid expense categories | Used for expense entry and filtering. Values: "Packaging", "Labels", "Tape", "Stickers", "Supplies", "Software", "Marketing", "Shipping Supplies", "Office", "Other", "Inventory" | Reference |
| `Coupon_Codes` | String | Valid coupon codes (redundant with Coupons table) | Reference only, Coupons table is authoritative | Reference |

**Data Quality Notes:**
- Contains mixed case and inconsistent values (e.g., "Completed" vs "completed")
- Some rows are empty (intentional, represents "no value" option)

---

## Instructions.csv

**Purpose:** User instructions for the spreadsheet. Not a data source, but provides context for business logic.

**Key Insights:**
- Multi-line orders should be entered as separate rows with same Order_#
- Free Shipping = "Yes" means business absorbs shipping cost (deducted from profit)
- ROI calculations account for absorbed shipping costs
- Order totals aggregate all items with same Order_#
- Stock Status: "LOW STOCK" or "OUT OF STOCK" based on Reorder Level

---

## Dashboard (1).csv

**Purpose:** Snapshot of dashboard visual layout and calculated metrics. **Not a source of truth for calculations**—treat as reference only.

**Structure:**
- Company-wide metrics: Total Revenue, Total Product Cost, Total Shipping Cost Absorbed, Total Gross Profit, Overall ROI %, Total Units Sold, Unique Orders, Average Order Value
- Expense metrics: Total Operating Expenses, Net Profit (After Expenses), Net ROI % (After Expenses), Expense breakdown by category
- Revenue by Product: Product_ID, Product_Name, Units_Sold, Total_Revenue, Total_Cost, Total_Profit, ROI_%
- Inventory Alerts: Product_ID, Product_Name, Current_Stock, Status

**Usage:** Reference for UI layout and metric names only. All calculations must be derived from normalized Orders, Products, and Expenses data.

---

## Expenses.csv

**Purpose:** Tracks business operating expenses that reduce net profit.

| Column | Type | Meaning | Usage | Level |
|--------|------|---------|-------|-------|
| `Date` | Date | Date expense was incurred | Used for date filtering and time-series expense analysis | Expense |
| `Category` | String | Expense category (must match Lists.Expense_Categories) | Used for expense grouping and filtering. Values: "Inventory", "Shipping Supplies", "Software", "Supplies", "Packaging", "Marketing", "Office" | Expense |
| `Description` | String | Human-readable description of expense | Display and expense identification | Expense |
| `Vendor` | String | Vendor/supplier name | Display and vendor analysis | Expense |
| `Amount` | Currency (Decimal) | Expense amount (formatted as "$X,XXX.XX") | Summed by category and total. Must be parsed from currency string | Expense |
| `Notes` | String | Additional notes about expense | Display only | Expense |

**Expense Impact on Metrics:**
- Net Profit = Gross Profit - Total Operating Expenses
- Net ROI % = (Net Profit / Total Cost) × 100
- Expenses are subtracted from company-level profit, not order-level profit

**Data Quality Notes:**
- Amount format: "$4,872.00" (includes $ and comma, needs parsing)
- Some expenses have empty Notes

---

## Summary of Data Types

**Currency Fields:** Must be stored as `NUMERIC` or `DECIMAL` in database, parsed from strings like "$195.00", "$4,872.00". Display formatted with currency symbols.

**Percentage Fields:** Must be stored as `NUMERIC` or `DECIMAL` (e.g., 622.2 for 622.2%), parsed from strings like "622.2%", "10.0%". Display formatted with % symbol.

**Date Fields:** Must be parsed from inconsistent formats ("2026-01-16" vs "2026-01-20 2:15 AM") and stored as `DATE` or `TIMESTAMP`.

**Boolean Fields:** Stored as `BOOLEAN` or `TEXT` ("Yes"/"No"), normalized during import.

**Integer Fields:** Stored as `INTEGER`, handle empty/null values.

**String Fields:** Stored as `TEXT` or `VARCHAR`, preserve case but normalize for comparisons.
