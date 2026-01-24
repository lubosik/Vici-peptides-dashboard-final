# CSV Import Setup Guide

This guide will help you set up and run the CSV importer to seed your Supabase database.

## Step 1: Install Dependencies

First, install all required packages:

```bash
npm install
```

## Step 2: Get Your Supabase Service Role Key

The CSV importer needs the **Service Role Key** (not the anon key) because it bypasses Row Level Security (RLS) to insert data.

**How to get it:**
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Scroll down to find **service_role** key (it's marked as "secret")
5. Copy this key (it starts with `eyJhbGci...`)

⚠️ **Important:** The service role key has full access to your database and bypasses RLS. Never expose it in client-side code or commit it to version control.

## Step 3: Create .env File

Create a `.env` file in the project root with your Supabase credentials:

```bash
# Option 1: Use standard variable names
SUPABASE_URL=https://lxylfltutiqjlrbwzqvh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Option 2: Use your existing variable names (also supported)
SUPABASE_PROJECT_URL=https://lxylfltutiqjlrbwzqvh.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

**Based on your screenshot, your `.env` file should look like:**

```env
SUPABASE_URL=https://lxylfltutiqjlrbwzqvh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...your-service-role-key-here
```

Replace `eyJhbGci...your-service-role-key-here` with the actual service role key from Step 2.

## Step 4: Verify CSV Files Location

The importer looks for CSV files in your Downloads folder. Make sure these files exist:

- `/Users/ghost/Downloads/Vici_Order_Tracker_with_Expenses_v2 - Product_Inventory.csv`
- `/Users/ghost/Downloads/Vici_Order_Tracker_with_Expenses_v2 - Tiered_Pricing.csv`
- `/Users/ghost/Downloads/Vici_Order_Tracker_with_Expenses_v2 - Coupons.csv`
- `/Users/ghost/Downloads/Vici_Order_Tracker_with_Expenses_v2 - Orders.csv`
- `/Users/ghost/Downloads/Vici_Order_Tracker_with_Expenses_v2 - Expenses.csv`

## Step 5: Run the Import

Execute the import script:

```bash
npm run import
```

The script will:
1. Read all CSV files
2. Parse and normalize the data
3. Insert/update records in Supabase (idempotent - safe to run multiple times)
4. Show a summary of what was imported

## Step 6: Verify the Import

After the import completes, verify the data in Supabase:

### Option A: Supabase Dashboard
1. Go to your Supabase Dashboard
2. Navigate to **Table Editor**
3. Check that tables have data:
   - `products` - Should have product records
   - `orders` - Should have order records
   - `order_lines` - Should have line item records
   - `expenses` - Should have expense records

### Option B: SQL Query

Run this query in the Supabase SQL Editor:

```sql
-- Check order normalization (one order should have multiple lines)
SELECT 
  o.order_number,
  COUNT(ol.line_id) as line_count,
  o.order_subtotal,
  o.order_total
FROM orders o
LEFT JOIN order_lines ol ON o.order_number = ol.order_number
GROUP BY o.order_number, o.order_subtotal, o.order_total
LIMIT 10;

-- Check computed columns
SELECT 
  order_number,
  order_subtotal,
  order_total,
  order_profit,
  order_roi_percent
FROM orders
LIMIT 5;

-- Check product inventory
SELECT 
  product_id,
  product_name,
  qty_sold,
  current_stock,
  stock_status
FROM products
WHERE qty_sold > 0
LIMIT 5;
```

## Troubleshooting

### Error: "Missing Supabase credentials"
- Make sure `.env` file exists in the project root
- Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Verify the service role key is correct (not the anon key)

### Error: "Failed to read CSV file"
- Verify CSV files are in `/Users/ghost/Downloads/`
- Check file names match exactly (including spaces and hyphens)
- Ensure files are not corrupted

### Error: "Foreign key constraint violation"
- Make sure you've run all Supabase migrations (Phase 2)
- Verify products exist before importing tiered_pricing
- Verify products and coupons exist before importing orders

### Import runs but no data appears
- Check Supabase Dashboard → Table Editor
- Verify RLS policies allow service role to insert (they should)
- Check browser console or Supabase logs for errors

### Duplicate data on re-run
- This is expected for expenses (no unique constraint)
- Orders, products, coupons should update (not duplicate) due to upsert logic
- If you see duplicates, check that unique constraints are working

## Running Tests

To verify parsing functions work correctly:

```bash
npm test
```

## Next Steps

After successful import:
- ✅ Data is normalized (orders + order_lines)
- ✅ Computed columns are populated
- ✅ Product inventory is updated
- ✅ Ready for Phase 4 (UI development)
