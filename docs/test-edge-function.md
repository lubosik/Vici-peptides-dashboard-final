# Testing the Edge Function

## Quick Test Command

```bash
curl -X POST 'https://lxylfltutiqjlrbwzqvh.supabase.co/functions/v1/ingest-order' \
  -H 'Authorization: Bearer sb_publishable_J_rGqkvlPRxuZ3_NtnbTPw_4QfKCpeD' \
  -H 'apikey: sb_publishable_J_rGqkvlPRxuZ3_NtnbTPw_4QfKCpeD' \
  -H 'Content-Type: application/json' \
  -d '{
    "id": 9999,
    "number": "9999",
    "status": "completed",
    "date_created": "2024-01-22T18:00:00",
    "billing": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    },
    "line_items": [
      {
        "id": 123,
        "name": "Test Product",
        "product_id": 108,
        "quantity": 2,
        "price": "130.00"
      }
    ],
    "shipping_lines": [],
    "coupon_lines": [],
    "total": "260.00",
    "payment_method": "stripe"
  }'
```

## Headers Explained

### Required Headers:

1. **Authorization**: `Bearer YOUR_API_KEY`
   - Purpose: Authenticates the request
   - Value: Your Supabase anon key or publishable key
   - Format: `Bearer <key>`

2. **apikey**: `YOUR_API_KEY`
   - Purpose: Additional authentication (Supabase requirement)
   - Value: Same as Authorization header (without "Bearer")
   - Format: Just the key itself

3. **Content-Type**: `application/json`
   - Purpose: Tells the server the request body is JSON
   - Value: Always `application/json`

### Optional Headers:

- **x-client-info**: Client information (optional)
- **x-forwarded-for**: IP address (optional, for logging)

## Query Parameters

**None required!** The function doesn't use query parameters. All data goes in the request body.

## Request Body Format

The body must be a JSON object matching the WooCommerce order format:

### Minimal Required Fields:

```json
{
  "id": 1234,                    // Order ID (number)
  "number": "1234",              // Order number (string)
  "status": "completed",         // Order status
  "date_created": "2024-01-22T10:30:00",  // ISO 8601 date
  "billing": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  },
  "line_items": [                // At least one item required
    {
      "id": 123,
      "name": "Product Name",
      "product_id": 108,         // Must exist in products table
      "quantity": 2,
      "price": "130.00"
    }
  ],
  "shipping_lines": [],          // Can be empty array
  "coupon_lines": [],            // Can be empty array
  "total": "260.00",
  "payment_method": "stripe"
}
```

### Full Example with All Fields:

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
    "email": "john@example.com"
  },
  "shipping": {
    "first_name": "John",
    "last_name": "Doe"
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
  "fee_lines": [],
  "total": "265.00",
  "payment_method": "stripe",
  "payment_method_title": "Credit Card",
  "customer_note": "Leave at front door"
}
```

## Expected Responses

### Success (200 OK):

```json
{
  "success": true,
  "order_number": "Order #9999",
  "message": "Order ingested successfully",
  "data": {
    "order_number": "Order #9999",
    "order_date": "2024-01-22T18:00:00.000Z",
    ...
  }
}
```

### Error (400 Bad Request):

```json
{
  "success": false,
  "error": "Missing required field: order id or number"
}
```

### Error (500 Internal Server Error):

```json
{
  "success": false,
  "error": "Failed to upsert order: <error details>"
}
```

## Using the Test Script

Run the provided test script:

```bash
./test-order-ingestion.sh
```

This will:
- Format the request nicely
- Show headers and payload
- Display the response
- Indicate success/failure

## Common Issues

### "Missing Supabase environment variables"
- **Fix**: Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Edge Function settings
- **Location**: Supabase Dashboard → Edge Functions → ingest-order → Settings

### "Missing required field: order id or number"
- **Fix**: Ensure `id` or `number` field is in the JSON payload

### "Order must have at least one line item"
- **Fix**: Include at least one item in `line_items` array

### "Failed to upsert order: foreign key constraint"
- **Fix**: Ensure the `product_id` in line_items exists in the `products` table
- **Solution**: Import products first using the CSV importer

### "Function not found" (404)
- **Fix**: Deploy the function first (see `docs/deploy-edge-function.md`)

## Testing with Real Data

To test with a real order from your database:

1. Get an existing order from your `orders` table
2. Convert it to WooCommerce format
3. Send it to the endpoint
4. Verify it updates (idempotent - safe to retry)

## Next Steps

After successful testing:
1. Deploy the function (if not already deployed)
2. Set up Make.com integration
3. Connect WooCommerce webhooks
4. Monitor ingestion via `ingestion_audit` table
