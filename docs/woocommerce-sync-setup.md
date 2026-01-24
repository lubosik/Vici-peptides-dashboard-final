# WooCommerce Sync Setup Guide

## Overview

The WooCommerce sync module allows you to sync orders, products, and coupons from your WooCommerce store directly into Supabase. This ensures your dashboard always reflects the current state of your store.

## Prerequisites

1. WooCommerce REST API keys (Consumer Key and Consumer Secret)
2. Supabase database with migrations applied
3. Environment variables configured

## Setup Steps

### 1. Get WooCommerce API Credentials

1. Log in to your WordPress admin panel
2. Navigate to **WooCommerce > Settings > Advanced > REST API**
3. Click **Add Key**
4. Set:
   - Description: "Vici Peptides Dashboard Sync"
   - User: Select an admin user
   - Permissions: **Read/Write**
5. Click **Generate API Key**
6. Copy the **Consumer Key** and **Consumer Secret**

### 2. Configure Environment Variables

Add these to your `.env.local` file (never commit this file):

```env
WOOCOMMERCE_STORE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=ck_your_consumer_key_here
WOOCOMMERCE_CONSUMER_SECRET=cs_your_consumer_secret_here
```

**Important:** 
- Remove any trailing slashes from the store URL
- These credentials are server-side only and never exposed to the browser
- For production (Vercel), add these as environment variables in Vercel dashboard

### 3. Run Database Migrations

Apply the new migrations to add WooCommerce ID columns:

```bash
# If using Supabase CLI
supabase db push

# Or run manually in Supabase SQL Editor:
# - 20260101000011_create_sync_state_table.sql
# - 20260101000012_add_woo_ids_to_tables.sql
```

### 4. Sync Data

#### Option A: Via Settings Page (Recommended)

1. Navigate to **Settings** in the dashboard
2. Find the **WooCommerce Sync** card
3. Choose sync mode:
   - **Full Sync**: Syncs all orders/products/coupons (use for initial setup)
   - **Incremental Sync**: Only syncs items modified since last sync
4. Click **Sync Now**
5. Wait for sync to complete (progress shown in real-time)

#### Option B: Via API Endpoint

```bash
# Full sync
curl -X POST http://localhost:3000/api/sync/woocommerce?mode=full

# Incremental sync
curl -X POST http://localhost:3000/api/sync/woocommerce?mode=incremental

# Sync only orders
curl -X POST http://localhost:3000/api/sync/woocommerce?mode=full&orders=true&products=false&coupons=false
```

## How It Works

### Sync Process

1. **Fetch Data**: Connects to WooCommerce REST API and fetches orders/products/coupons
2. **Normalize**: Converts WooCommerce format to Supabase schema
3. **Upsert**: Inserts new records or updates existing ones based on WooCommerce IDs
4. **Track State**: Updates `sync_state` table with last sync timestamp

### Data Mapping

- **Orders**: WooCommerce order ID → `woo_order_id`, order number → `order_number`
- **Products**: WooCommerce product ID → `woo_product_id` and `product_id`
- **Coupons**: WooCommerce coupon ID → `woo_coupon_id`
- **Line Items**: WooCommerce line item ID → `woo_line_item_id`

### Idempotency

- Orders: Upserted by `order_number` (primary key) or `woo_order_id` (unique)
- Products: Upserted by `woo_product_id` (unique)
- Coupons: Upserted by `coupon_code` (primary key)
- Line Items: Upserted by unique constraint on `(order_number, product_id, our_cost_per_unit, customer_paid_per_unit)`

## Troubleshooting

### "Missing WooCommerce credentials" Error

- Check that environment variables are set in `.env.local`
- Restart the Next.js dev server after adding env vars
- For production, verify Vercel environment variables are set

### "WooCommerce API error: 401"

- Verify Consumer Key and Consumer Secret are correct
- Check that API key has Read/Write permissions
- Ensure store URL is correct (no trailing slash)

### "WooCommerce API error: 404"

- Verify store URL is correct
- Check that WooCommerce REST API is enabled
- Ensure WordPress permalinks are not set to "Plain"

### Sync Shows Errors

- Check browser console and server logs for specific error messages
- Verify database migrations have been applied
- Ensure RLS policies allow inserts/updates (admin client bypasses RLS)

## Next Steps

After Phase 1, you can:
- Set up webhooks (Phase 5) for real-time updates
- Configure scheduled syncs (cron job or Vercel Cron)
- Use incremental syncs to keep data up-to-date efficiently
