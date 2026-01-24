# Schema Mapping: CSV to Supabase Postgres

This document maps every CSV column to the normalized Supabase database schema, including primary keys, foreign keys, indexes, and data type conversions.

## Database Schema Overview

The normalized schema consists of:

1. **products** - Product master data
2. **tiered_pricing** - Tiered pricing rules
3. **coupons** - Coupon definitions
4. **orders** - Order parent records (one per order)
5. **order_lines** - Order line items (multiple per order)
6. **expenses** - Business expenses
7. **ingestion_audit** - Raw payload storage for debugging

---

## Table: products

**Purpose:** Master product catalog with inventory and pricing.

**Source CSV:** `Product_Inventory.csv`

| CSV Column | Database Column | Type | Constraints | Notes |
|------------|----------------|------|-------------|-------|
| `Product_ID` | `product_id` | `INTEGER` | PRIMARY KEY, NOT NULL | Unique product identifier |
| `Product_Name` | `product_name` | `TEXT` | NOT NULL | Product name |
| `Variant_Strength` | `variant_strength` | `TEXT` | | Product strength/variant |
| `SKU_Code` | `sku_code` | `TEXT` | UNIQUE | Stock Keeping Unit code |
| `Lot_#` | `lot_number` | `TEXT` | | Lot number for batch tracking |
| `Starting_Qty` | `starting_qty` | `INTEGER` | | Initial inventory quantity |
| `Qty_Sold` | `qty_sold` | `INTEGER` | DEFAULT 0 | Computed: SUM(order_lines.qty_ordered) |
| `Current_Stock` | `current_stock` | `INTEGER` | DEFAULT 0 | Computed: starting_qty - qty_sold |
| `Reorder_Level` | `reorder_level` | `INTEGER` | | Threshold for low stock alert |
| `Stock_Status` | `stock_status` | `TEXT` | | Computed: "In Stock", "LOW STOCK", or "OUT OF STOCK" |
| `Our_Cost` | `our_cost` | `NUMERIC(10,2)` | | Cost per unit (may be NULL) |
| `Retail_Price` | `retail_price` | `NUMERIC(10,2)` | | Standard retail price (may be NULL) |
| `Unit_Margin` | `unit_margin` | `NUMERIC(10,2)` | | Computed: retail_price - our_cost |
| `Margin_%` | `margin_percent` | `NUMERIC(10,2)` | | Computed: (unit_margin / retail_price) × 100 |

**Indexes:**
- `idx_products_product_id` ON `product_id` (primary key, automatic)
- `idx_products_sku_code` ON `sku_code` (unique constraint, automatic)
- `idx_products_stock_status` ON `stock_status` (for inventory alerts)

**Computed Columns (via triggers or application logic):**
- `qty_sold`: Updated when order_lines are inserted/updated/deleted
- `current_stock`: Updated when qty_sold changes
- `stock_status`: Updated when current_stock or reorder_level changes
- `unit_margin`: Updated when our_cost or retail_price changes
- `margin_percent`: Updated when unit_margin or retail_price changes

---

## Table: tiered_pricing

**Purpose:** Defines tiered pricing rules based on quantity.

**Source CSV:** `Tiered_Pricing.csv`

| CSV Column | Database Column | Type | Constraints | Notes |
|------------|----------------|------|-------------|-------|
| `Product_ID` | `product_id` | `INTEGER` | PRIMARY KEY, FOREIGN KEY → products.product_id | Links to products table |
| `Product_Name` | `product_name` | `TEXT` | | Redundant with products, kept for reference |
| `Strength` | `strength` | `TEXT` | | Redundant with products.variant_strength |
| `Cost_Per_Unit` | `cost_per_unit` | `NUMERIC(10,2)` | | May be used as fallback if products.our_cost is NULL |
| `MSRP_Slashed` | `msrp_slashed` | `NUMERIC(10,2)` | | Display/reference only |
| `Price_1_Unit` | `price_1_unit` | `NUMERIC(10,2)` | NOT NULL | Price when qty = 1 |
| `Price_2_Units` | `price_2_units` | `NUMERIC(10,2)` | | Price per unit when qty = 2 |
| `Price_3_Units` | `price_3_units` | `NUMERIC(10,2)` | | Price per unit when qty = 3 |
| `Price_5_Plus` | `price_5_plus` | `NUMERIC(10,2)` | | Price per unit when qty >= 5 |

**Indexes:**
- `idx_tiered_pricing_product_id` ON `product_id` (primary key, automatic)
- `idx_tiered_pricing_product_id_fk` ON `product_id` (foreign key, automatic)

**Foreign Keys:**
- `product_id` → `products.product_id` ON DELETE CASCADE

---

## Table: coupons

**Purpose:** Coupon code definitions and discount rules.

**Source CSV:** `Coupons.csv`

| CSV Column | Database Column | Type | Constraints | Notes |
|------------|----------------|------|-------------|-------|
| `Coupon_Code` | `coupon_code` | `TEXT` | PRIMARY KEY, NOT NULL | Unique coupon code |
| `Discount_Type` | `discount_type` | `TEXT` | NOT NULL | "Percent" or "Fixed" |
| `Discount_Value` | `discount_value` | `NUMERIC(10,2)` | NOT NULL | Parsed from "10.0%" or currency string |
| `Description` | `description` | `TEXT` | | Human-readable description |
| `Active` | `active` | `BOOLEAN` | DEFAULT true | Whether coupon is currently active |

**Indexes:**
- `idx_coupons_coupon_code` ON `coupon_code` (primary key, automatic)
- `idx_coupons_active` ON `active` (for filtering active coupons)

**Data Conversion:**
- `Discount_Value`: Parse "10.0%" → 10.0 (store as numeric, not percentage string)
- `Active`: Parse "Yes"/"No" → true/false

---

## Table: orders

**Purpose:** Order parent records (one row per order).

**Source CSV:** `Orders.csv` (aggregated by `Order_#`)

| CSV Column | Database Column | Type | Constraints | Notes |
|------------|----------------|------|-------------|-------|
| `Order_#` | `order_number` | `TEXT` | PRIMARY KEY, NOT NULL | Unique order identifier (e.g., "Order #1281") |
| `Order_Date` | `order_date` | `TIMESTAMP` | NOT NULL | Parsed from "2026-01-16" or "2026-01-20 2:15 AM" |
| `Customer_Name` | `customer_name` | `TEXT` | | Customer full name |
| `Customer_Email` | `customer_email` | `TEXT` | | Customer email address |
| `Shipping_Charged` | `shipping_charged` | `NUMERIC(10,2)` | DEFAULT 0 | Amount customer paid for shipping |
| `Shipping_Cost` | `shipping_cost` | `NUMERIC(10,2)` | DEFAULT 0 | Actual shipping cost (what we paid) |
| `Free_Shipping?` | `free_shipping` | `BOOLEAN` | DEFAULT false | Whether shipping was free |
| `Coupon_Code` | `coupon_code` | `TEXT` | FOREIGN KEY → coupons.coupon_code | Coupon code applied (nullable) |
| `Coupon_Discount` | `coupon_discount` | `NUMERIC(10,2)` | DEFAULT 0 | Discount amount from coupon |
| `Payment_Method` | `payment_method` | `TEXT` | | Payment method used |
| `Order_Status` | `order_status` | `TEXT` | NOT NULL | Order status (normalized to lowercase) |
| `Notes` | `notes` | `TEXT` | | Free-text notes |
| (computed) | `order_subtotal` | `NUMERIC(10,2)` | | SUM(order_lines.line_total) |
| (computed) | `order_product_cost` | `NUMERIC(10,2)` | | SUM(order_lines.line_cost) |
| (computed) | `shipping_net_cost_absorbed` | `NUMERIC(10,2)` | | Computed from free_shipping, shipping_cost, shipping_charged |
| (computed) | `order_total` | `NUMERIC(10,2)` | | order_subtotal + shipping_charged - coupon_discount |
| (computed) | `order_cost` | `NUMERIC(10,2)` | | order_product_cost + shipping_net_cost_absorbed |
| (computed) | `order_profit` | `NUMERIC(10,2)` | | order_total - order_cost |
| (computed) | `order_roi_percent` | `NUMERIC(10,2)` | | (order_profit / order_cost) × 100 |

**Indexes:**
- `idx_orders_order_number` ON `order_number` (primary key, automatic)
- `idx_orders_order_date` ON `order_date` (for date filtering and time-series queries)
- `idx_orders_order_status` ON `order_status` (for status filtering)
- `idx_orders_payment_method` ON `payment_method` (for payment method analytics)
- `idx_orders_coupon_code` ON `coupon_code` (foreign key, automatic)
- `idx_orders_customer_email` ON `customer_email` (for customer lookup)

**Foreign Keys:**
- `coupon_code` → `coupons.coupon_code` ON DELETE SET NULL

**Data Conversion:**
- `Order_Date`: Parse "2026-01-16" or "2026-01-20 2:15 AM" → TIMESTAMP
- `Free_Shipping?`: Parse "Yes"/"No" → true/false
- `Order_Status`: Normalize to lowercase (e.g., "Completed" → "completed")
- `Payment_Method`: Store as-is (case variations preserved)

**Computed Columns (via triggers or application logic):**
- All computed columns updated when order_lines are inserted/updated/deleted

---

## Table: order_lines

**Purpose:** Order line items (multiple rows per order).

**Source CSV:** `Orders.csv` (one row per line item)

| CSV Column | Database Column | Type | Constraints | Notes |
|------------|----------------|------|-------------|-------|
| (generated) | `line_id` | `BIGSERIAL` | PRIMARY KEY | Auto-incrementing line item ID |
| `Order_#` | `order_number` | `TEXT` | FOREIGN KEY → orders.order_number, NOT NULL | Links to parent order |
| `Product_ID` | `product_id` | `INTEGER` | FOREIGN KEY → products.product_id, NOT NULL | Links to product |
| `Qty_Ordered` | `qty_ordered` | `INTEGER` | NOT NULL, CHECK (qty_ordered > 0) | Quantity ordered |
| `Our_Cost_Per_Unit` | `our_cost_per_unit` | `NUMERIC(10,2)` | DEFAULT 0 | Cost per unit at time of order |
| `Customer_Paid_Per_Unit` | `customer_paid_per_unit` | `NUMERIC(10,2)` | NOT NULL | Price per unit customer paid |
| (computed) | `line_total` | `NUMERIC(10,2)` | | qty_ordered × customer_paid_per_unit |
| (computed) | `line_cost` | `NUMERIC(10,2)` | | qty_ordered × our_cost_per_unit |
| (computed) | `line_profit` | `NUMERIC(10,2)` | | line_total - line_cost |
| (computed) | `line_roi_percent` | `NUMERIC(10,2)` | | (line_profit / line_cost) × 100 (NULL if line_cost = 0) |

**Indexes:**
- `idx_order_lines_line_id` ON `line_id` (primary key, automatic)
- `idx_order_lines_order_number` ON `order_number` (foreign key, for order lookups)
- `idx_order_lines_product_id` ON `product_id` (foreign key, for product aggregations)
- `idx_order_lines_order_product` ON (`order_number`, `product_id`) (composite, for uniqueness check)

**Foreign Keys:**
- `order_number` → `orders.order_number` ON DELETE CASCADE
- `product_id` → `products.product_id` ON DELETE RESTRICT

**Unique Constraint:**
- `UNIQUE (order_number, product_id, our_cost_per_unit, customer_paid_per_unit)` - Prevents duplicate line items (idempotency)

**Data Conversion:**
- `Our_Cost_Per_Unit`: Parse "$27.00" → 27.00
- `Customer_Paid_Per_Unit`: Parse "$195.00" → 195.00

**Computed Columns (via triggers or application logic):**
- `line_total`, `line_cost`, `line_profit`, `line_roi_percent` updated when qty_ordered, our_cost_per_unit, or customer_paid_per_unit changes

---

## Table: expenses

**Purpose:** Business operating expenses.

**Source CSV:** `Expenses.csv`

| CSV Column | Database Column | Type | Constraints | Notes |
|------------|----------------|------|-------------|-------|
| (generated) | `expense_id` | `BIGSERIAL` | PRIMARY KEY | Auto-incrementing expense ID |
| `Date` | `expense_date` | `DATE` | NOT NULL | Date expense was incurred |
| `Category` | `category` | `TEXT` | NOT NULL | Expense category (must match Lists.Expense_Categories) |
| `Description` | `description` | `TEXT` | | Human-readable description |
| `Vendor` | `vendor` | `TEXT` | | Vendor/supplier name |
| `Amount` | `amount` | `NUMERIC(10,2)` | NOT NULL, CHECK (amount >= 0) | Expense amount (parsed from "$X,XXX.XX") |
| `Notes` | `notes` | `TEXT` | | Additional notes |

**Indexes:**
- `idx_expenses_expense_id` ON `expense_id` (primary key, automatic)
- `idx_expenses_expense_date` ON `expense_date` (for date filtering and time-series queries)
- `idx_expenses_category` ON `category` (for category grouping and filtering)

**Data Conversion:**
- `Amount`: Parse "$4,872.00" → 4872.00

---

## Table: ingestion_audit

**Purpose:** Stores raw inbound payloads from Make.com for debugging and idempotency.

**Source:** Not from CSV; created for ingestion flow.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `audit_id` | `BIGSERIAL` | PRIMARY KEY | Auto-incrementing audit ID |
| `payload_hash` | `TEXT` | UNIQUE, NOT NULL | SHA-256 hash of payload JSON (for idempotency) |
| `payload_json` | `JSONB` | NOT NULL | Raw payload from Make.com |
| `ingested_at` | `TIMESTAMP` | DEFAULT NOW(), NOT NULL | Timestamp when payload was received |
| `order_number` | `TEXT` | FOREIGN KEY → orders.order_number | Order number extracted from payload (nullable) |
| `status` | `TEXT` | DEFAULT 'pending' | 'pending', 'success', 'error' |
| `error_message` | `TEXT` | | Error message if ingestion failed |

**Indexes:**
- `idx_ingestion_audit_audit_id` ON `audit_id` (primary key, automatic)
- `idx_ingestion_audit_payload_hash` ON `payload_hash` (unique constraint, automatic)
- `idx_ingestion_audit_order_number` ON `order_number` (for order lookup)
- `idx_ingestion_audit_ingested_at` ON `ingested_at` (for time-based queries)
- `idx_ingestion_audit_status` ON `status` (for filtering by status)

**Foreign Keys:**
- `order_number` → `orders.order_number` ON DELETE SET NULL

---

## Normalization Strategy

### Orders.csv Denormalization

**Problem:** Orders.csv has one row per line item, but order-level fields (Order_Date, Customer_Name, Shipping_Charged, etc.) are repeated across multiple rows for multi-product orders.

**Solution:**
1. **Extract unique orders:** Group by `Order_#` to create `orders` table
2. **Extract line items:** Each row in Orders.csv becomes a row in `order_lines` table
3. **Link via foreign key:** `order_lines.order_number` → `orders.order_number`

**Example:**
```
Orders.csv:
Order_#: "Order #1281", Product_ID: 123, Qty_Ordered: 1, ...
Order_#: "Order #1281", Product_ID: 199, Qty_Ordered: 1, ...

Becomes:

orders:
order_number: "Order #1281", order_date: ..., customer_name: ..., ...

order_lines:
line_id: 1, order_number: "Order #1281", product_id: 123, qty_ordered: 1, ...
line_id: 2, order_number: "Order #1281", product_id: 199, qty_ordered: 1, ...
```

---

## Data Type Mappings

| CSV Format | Database Type | Conversion Function |
|------------|---------------|---------------------|
| "$195.00" | `NUMERIC(10,2)` | `parseMoney()` - Remove $ and commas |
| "$4,872.00" | `NUMERIC(10,2)` | `parseMoney()` - Remove $ and commas |
| "622.2%" | `NUMERIC(10,2)` | `parsePercent()` - Remove % symbol |
| "Yes"/"No" | `BOOLEAN` | `parseBoolean()` - "Yes" → true, else → false |
| "2026-01-16" | `DATE` or `TIMESTAMP` | Parse date string |
| "2026-01-20 2:15 AM" | `TIMESTAMP` | Parse datetime string |
| Empty string | `NULL` or default | Treat empty as NULL or use default value |
| Integer string | `INTEGER` | `parseInt()` |

---

## Index Strategy

### High-Frequency Queries

1. **Date filtering:** `idx_orders_order_date`, `idx_expenses_expense_date`
2. **Status filtering:** `idx_orders_order_status`
3. **Product aggregations:** `idx_order_lines_product_id`
4. **Order lookups:** `idx_order_lines_order_number`
5. **Customer lookup:** `idx_orders_customer_email`
6. **Inventory alerts:** `idx_products_stock_status`

### Composite Indexes

- `idx_order_lines_order_product` ON (`order_number`, `product_id`) - For uniqueness and order detail queries

---

## RLS (Row Level Security) Policies

**Assumption:** Only authenticated admin users can read/write dashboard data.

### Policies (to be implemented in Phase 2)

1. **products:** `SELECT` allowed for authenticated users only
2. **orders:** `SELECT`, `INSERT`, `UPDATE` allowed for authenticated users only
3. **order_lines:** `SELECT`, `INSERT`, `UPDATE` allowed for authenticated users only
4. **expenses:** `SELECT`, `INSERT`, `UPDATE`, `DELETE` allowed for authenticated users only
5. **ingestion_audit:** `SELECT`, `INSERT` allowed for authenticated users only

---

## Migration Order

1. Create `products` table (no dependencies)
2. Create `tiered_pricing` table (depends on `products`)
3. Create `coupons` table (no dependencies)
4. Create `orders` table (depends on `coupons`)
5. Create `order_lines` table (depends on `orders` and `products`)
6. Create `expenses` table (no dependencies)
7. Create `ingestion_audit` table (depends on `orders`)
8. Create indexes
9. Create computed column triggers/functions
10. Create RLS policies
11. Seed data from CSVs (products → tiered_pricing → coupons → orders → order_lines → expenses)

---

## Idempotency Strategy

### Unique Constraints

1. **orders:** `order_number` PRIMARY KEY (prevents duplicate orders)
2. **order_lines:** `UNIQUE (order_number, product_id, our_cost_per_unit, customer_paid_per_unit)` (prevents duplicate line items)
3. **ingestion_audit:** `payload_hash` UNIQUE (prevents duplicate payload processing)

### Upsert Logic

- **orders:** `INSERT ... ON CONFLICT (order_number) DO UPDATE` - Update if order already exists
- **order_lines:** `INSERT ... ON CONFLICT (order_number, product_id, our_cost_per_unit, customer_paid_per_unit) DO UPDATE` - Update if line already exists
- **ingestion_audit:** `INSERT ... ON CONFLICT (payload_hash) DO NOTHING` - Skip if payload already processed

---

## Validation Constraints

1. **order_lines:** `CHECK (qty_ordered > 0)` - Quantity must be positive
2. **expenses:** `CHECK (amount >= 0)` - Expense amount must be non-negative
3. **orders:** `CHECK (order_total >= 0)` - Order total should be non-negative (optional, may allow negative for refunds)
4. **products:** `CHECK (current_stock >= 0 OR current_stock IS NULL)` - Stock can be negative (oversold) but should be tracked
