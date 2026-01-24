# Make.com Integration Guide

This guide explains how to connect WooCommerce to your Vici Peptides Dashboard using Make.com (formerly Integromat).

## Overview

Make.com will listen for WooCommerce order webhooks and forward them to your Supabase Edge Function, which ingests the data into your database.

## Prerequisites

1. **Supabase Edge Function Deployed**
   - The `ingest-order` function must be deployed
   - Get the function URL: `https://your-project.supabase.co/functions/v1/ingest-order`

2. **Supabase Function API Key**
   - Get from: Supabase Dashboard → Edge Functions → Settings
   - This is your `SUPABASE_ANON_KEY` or create a custom function key

3. **WooCommerce Store**
   - WooCommerce REST API enabled
   - Webhook access configured

## Step 1: Create Make.com Scenario

1. Log in to [Make.com](https://www.make.com)
2. Click **"Create a new scenario"**
3. Name it: "Vici Peptides Order Ingestion"

## Step 2: Add WooCommerce Webhook Trigger

1. Click **"Add a module"**
2. Search for **"WooCommerce"**
3. Select **"Watch orders"** trigger
4. Configure:
   - **Connection**: Create new WooCommerce connection
     - **Store URL**: `https://your-store.com`
     - **Consumer Key**: Your WooCommerce API consumer key
     - **Consumer Secret**: Your WooCommerce API consumer secret
   - **Order Status**: Select statuses to watch (e.g., "completed", "processing")
   - **Limit**: 1 (process one order at a time)

## Step 3: Add HTTP Request Module

1. Click **"Add a module"** after the WooCommerce trigger
2. Search for **"HTTP"**
3. Select **"Make an HTTP request"**
4. Configure:
   - **Method**: `POST`
   - **URL**: `https://your-project.supabase.co/functions/v1/ingest-order`
   - **Headers**:
     ```
     Authorization: Bearer YOUR_SUPABASE_ANON_KEY
     Content-Type: application/json
     apikey: YOUR_SUPABASE_ANON_KEY
     ```
   - **Body Type**: `Raw`
   - **Request Content**: Select **"JSON"**
   - **Request Body**: Map the WooCommerce order data:
     ```json
     {
       "id": {{1.id}},
       "number": "{{1.number}}",
       "status": "{{1.status}}",
       "date_created": "{{1.date_created}}",
       "date_modified": "{{1.date_modified}}",
       "billing": {
         "first_name": "{{1.billing.first_name}}",
         "last_name": "{{1.billing.last_name}}",
         "email": "{{1.billing.email}}"
       },
       "shipping": {
         "first_name": "{{1.shipping.first_name}}",
         "last_name": "{{1.shipping.last_name}}"
       },
       "line_items": {{1.line_items}},
       "shipping_lines": {{1.shipping_lines}},
       "fee_lines": {{1.fee_lines}},
       "coupon_lines": {{1.coupon_lines}},
       "total": "{{1.total}}",
       "payment_method": "{{1.payment_method}}",
       "payment_method_title": "{{1.payment_method_title}}",
       "customer_note": "{{1.customer_note}}"
     }
     ```

## Step 4: Add Error Handler (Optional but Recommended)

1. Click **"Add a module"** after the HTTP request
2. Search for **"Error handler"**
3. Configure to send error notifications (email, Slack, etc.)

## Step 5: Test the Scenario

1. Click **"Run once"** to test
2. Create a test order in WooCommerce
3. Check the execution log in Make.com
4. Verify the order appears in your Supabase dashboard

## Step 6: Activate the Scenario

1. Click **"Save"**
2. Toggle **"Activate scenario"** to ON
3. The scenario will now run automatically when new orders are created

## Alternative: Using WooCommerce Webhooks Directly

If you prefer to use WooCommerce's built-in webhook system:

### Step 1: Configure WooCommerce Webhook

1. Go to WooCommerce → Settings → Advanced → Webhooks
2. Click **"Add webhook"**
3. Configure:
   - **Name**: "Vici Peptides Order Sync"
   - **Status**: Active
   - **Topic**: "Order created" or "Order updated"
   - **Delivery URL**: `https://your-project.supabase.co/functions/v1/ingest-order`
   - **Secret**: (optional, for security)
   - **API Version**: WP REST API Integration v3

### Step 2: Add Custom Headers (if using secret)

In Make.com HTTP module, add:
```
X-WC-Webhook-Signature: {{calculated_signature}}
```

## Webhook Payload Examples

### Minimal Order Payload

```json
{
  "id": 1281,
  "number": "1281",
  "status": "completed",
  "date_created": "2024-01-15T10:30:00",
  "billing": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  },
  "line_items": [
    {
      "id": 123,
      "name": "Product Name",
      "product_id": 108,
      "quantity": 2,
      "price": "130.00"
    }
  ],
  "shipping_lines": [],
  "coupon_lines": [],
  "total": "260.00",
  "payment_method": "stripe"
}
```

### Full Order Payload with All Fields

```json
{
  "id": 1281,
  "number": "1281",
  "status": "completed",
  "date_created": "2024-01-15T10:30:00",
  "date_modified": "2024-01-15T11:00:00",
  "billing": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address_1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postcode": "10001",
    "country": "US"
  },
  "shipping": {
    "first_name": "John",
    "last_name": "Doe",
    "address_1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postcode": "10001",
    "country": "US"
  },
  "line_items": [
    {
      "id": 123,
      "name": "Product Name - Variant",
      "product_id": 108,
      "variation_id": 0,
      "quantity": 2,
      "price": "130.00",
      "meta_data": [
        {
          "id": 1,
          "key": "our_cost",
          "value": "20.70"
        }
      ]
    }
  ],
  "shipping_lines": [
    {
      "id": 456,
      "method_title": "Standard Shipping",
      "method_id": "flat_rate",
      "total": "10.00"
    }
  ],
  "fee_lines": [],
  "coupon_lines": [
    {
      "id": 789,
      "code": "SAVE10",
      "discount": "5.00",
      "discount_tax": "0.00"
    }
  ],
  "total": "265.00",
  "payment_method": "stripe",
  "payment_method_title": "Credit Card",
  "customer_note": "Please leave at front door"
}
```

## Troubleshooting

### Error: "Missing required field: order id or number"
- Ensure the WooCommerce payload includes `id` or `number` field
- Check Make.com mapping is correct

### Error: "Order must have at least one line item"
- Verify `line_items` array is not empty
- Check WooCommerce order has products

### Error: "Failed to upsert order"
- Check database connection
- Verify RLS policies allow service role key
- Check order_number format matches expected pattern

### Orders not appearing in dashboard
- Check `ingestion_audit` table for ingestion logs
- Verify triggers are running (check computed columns)
- Check browser console for errors

## Security Best Practices

1. **Use Function Keys**: Create a dedicated function key in Supabase instead of using the anon key
2. **Webhook Secret**: If using WooCommerce webhooks directly, use the secret for signature verification
3. **Rate Limiting**: Consider adding rate limiting to prevent abuse
4. **IP Whitelisting**: Restrict function access to Make.com IPs (if possible)

## Monitoring

Monitor your integration:
- **Make.com**: Check execution logs and error rates
- **Supabase**: Check `ingestion_audit` table for success/failure rates
- **Dashboard**: Verify orders appear in real-time

## Next Steps

After setting up the integration:
1. Test with a few orders
2. Monitor for errors
3. Set up alerts for failed ingestions
4. Review data accuracy in dashboard
