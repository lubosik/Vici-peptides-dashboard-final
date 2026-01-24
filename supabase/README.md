# Supabase Migrations

This directory contains SQL migration files for the Vici Peptides Dashboard database schema.

## Migration Files

Migrations are numbered sequentially and should be run in order:

1. `20260101000001_create_products_table.sql` - Products master catalog
2. `20260101000002_create_tiered_pricing_table.sql` - Tiered pricing rules
3. `20260101000003_create_coupons_table.sql` - Coupon definitions
4. `20260101000004_create_orders_table.sql` - Order parent records
5. `20260101000005_create_order_lines_table.sql` - Order line items
6. `20260101000006_create_expenses_table.sql` - Business expenses
7. `20260101000007_create_ingestion_audit_table.sql` - Ingestion audit log
8. `20260101000008_create_computed_column_functions.sql` - Computed column functions and triggers
9. `20260101000009_create_rls_policies.sql` - Row Level Security policies

## Running Migrations

### Option 1: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste each migration file in order
4. Execute each migration sequentially

### Option 3: Using psql

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run migrations in order
\i supabase/migrations/20260101000001_create_products_table.sql
\i supabase/migrations/20260101000002_create_tiered_pricing_table.sql
# ... continue for all files
```

## Verification

After running migrations, verify the schema:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Expected tables:
-- - products
-- - tiered_pricing
-- - coupons
-- - orders
-- - order_lines
-- - expenses
-- - ingestion_audit

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check triggers exist
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';
```

## Schema Overview

### Tables

- **products**: Master product catalog with inventory tracking
- **tiered_pricing**: Quantity-based pricing rules
- **coupons**: Coupon code definitions
- **orders**: Order parent records (one per order)
- **order_lines**: Order line items (multiple per order)
- **expenses**: Business operating expenses
- **ingestion_audit**: Raw payload storage for debugging

### Computed Columns

All computed columns are automatically updated via triggers:

- **Line-level**: `line_total`, `line_cost`, `line_profit`, `line_roi_percent`
- **Order-level**: `order_subtotal`, `order_product_cost`, `shipping_net_cost_absorbed`, `order_total`, `order_cost`, `order_profit`, `order_roi_percent`
- **Product-level**: `qty_sold`, `current_stock`, `stock_status`, `unit_margin`, `margin_percent`

### Security

All tables have Row Level Security (RLS) enabled. Only authenticated users can access data.

## Troubleshooting

### Migration Fails with Foreign Key Error

Ensure migrations are run in order. Foreign key constraints require parent tables to exist first.

### Triggers Not Firing

Check that triggers are created:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%calculate%' OR tgname LIKE '%recalculate%';
```

### RLS Blocking Access

Ensure you're authenticated:
```sql
SELECT auth.uid(); -- Should return a user ID
```

## Next Steps

After migrations are complete:
1. Seed data from CSV files (Phase 3)
2. Test computed column calculations
3. Verify RLS policies work correctly
4. Set up authentication (Supabase Auth)
