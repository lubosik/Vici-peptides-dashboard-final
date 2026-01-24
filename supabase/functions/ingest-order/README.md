# Ingest Order Edge Function

This Supabase Edge Function handles WooCommerce order webhooks and ingests order data into the Supabase database.

## Deployment

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy ingest-order
```

## Environment Variables

The function requires these environment variables (set in Supabase Dashboard → Edge Functions → Settings):

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (for bypassing RLS)

## Endpoint

**POST** `https://your-project.supabase.co/functions/v1/ingest-order`

## Request Format

The function expects a WooCommerce order webhook payload in JSON format.

### Example Request

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
      "price": "130.00",
      "meta_data": [
        {
          "key": "our_cost",
          "value": "20.70"
        }
      ]
    }
  ],
  "shipping_lines": [
    {
      "method_title": "Standard Shipping",
      "total": "10.00"
    }
  ],
  "coupon_lines": [
    {
      "code": "SAVE10",
      "discount": "5.00"
    }
  ],
  "total": "265.00",
  "payment_method": "stripe",
  "payment_method_title": "Credit Card"
}
```

## Response Format

### Success Response (200)

```json
{
  "success": true,
  "order_number": "Order #1281",
  "message": "Order ingested successfully",
  "data": {
    "order_number": "Order #1281",
    "order_date": "2024-01-15T10:30:00.000Z",
    ...
  }
}
```

### Error Response (400/500)

```json
{
  "success": false,
  "error": "Error message here"
}
```

## Features

- **Idempotent**: Can be called multiple times with the same order without creating duplicates
- **Automatic Calculations**: Triggers automatically calculate order totals, profit, etc.
- **Audit Logging**: Logs all ingestions to `ingestion_audit` table
- **Error Handling**: Continues processing other line items if one fails

## Idempotency

The function uses database constraints to ensure idempotency:
- Orders: `order_number` is the primary key
- Order Lines: Unique constraint on `(order_number, product_id, our_cost_per_unit, customer_paid_per_unit)`

## Notes

- The function assumes shipping cost equals shipping charged (can be updated if you have actual shipping costs)
- Product costs are extracted from line item `meta_data` if available
- If a product doesn't exist in the `products` table, the foreign key constraint will prevent insertion (products must be imported first)
