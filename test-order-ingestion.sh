#!/bin/bash
# Test script for Edge Function order ingestion

echo "🧪 Testing Edge Function: ingest-order"
echo "========================================"
echo ""

# Your endpoint
ENDPOINT="https://lxylfltutiqjlrbwzqvh.supabase.co/functions/v1/ingest-order"

# Your publishable key (for testing - use service role key in production)
API_KEY="sb_publishable_J_rGqkvlPRxuZ3_NtnbTPw_4QfKCpeD"

# Test order payload (matches WooCommerce format)
PAYLOAD='{
  "id": 9999,
  "number": "9999",
  "status": "completed",
  "date_created": "2024-01-22T18:00:00",
  "date_modified": "2024-01-22T18:00:00",
  "billing": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com"
  },
  "shipping": {
    "first_name": "John",
    "last_name": "Doe"
  },
  "line_items": [
    {
      "id": 123,
      "name": "Test Product",
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
  "fee_lines": [],
  "coupon_lines": [
    {
      "code": "TEST10",
      "discount": "5.00"
    }
  ],
  "total": "265.00",
  "payment_method": "stripe",
  "payment_method_title": "Credit Card",
  "customer_note": "Test order for ingestion"
}'

echo "📤 Sending request to: $ENDPOINT"
echo ""
echo "📋 Headers:"
echo "  - Authorization: Bearer $API_KEY"
echo "  - apikey: $API_KEY"
echo "  - Content-Type: application/json"
echo ""
echo "📦 Payload:"
echo "$PAYLOAD" | jq '.' 2>/dev/null || echo "$PAYLOAD"
echo ""
echo "⏳ Sending request..."
echo ""

# Make the request
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "Authorization: Bearer $API_KEY" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Split response and status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📥 Response:"
echo "  HTTP Status: $HTTP_CODE"
echo ""
echo "📄 Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Success! Order ingested successfully"
else
  echo "❌ Error: HTTP $HTTP_CODE"
  echo "Check the error message above"
fi
