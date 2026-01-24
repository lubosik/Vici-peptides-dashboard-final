#!/bin/bash
echo "Testing Edge Function..."
echo ""
echo "Endpoint: https://lxylfltutiqjlrbwzqvh.supabase.co/functions/v1/ingest-order"
echo ""
curl -L -X POST 'https://lxylfltutiqjlrbwzqvh.supabase.co/functions/v1/ingest-order' \
  -H 'Authorization: Bearer sb_publishable_J_rGqkvlPRxuZ3_NtnbTPw_4QfKCpeD' \
  -H 'apikey: sb_publishable_J_rGqkvlPRxuZ3_NtnbTPw_4QfKCpeD' \
  -H 'Content-Type: application/json' \
  --data '{
    "id": 9999,
    "number": "9999",
    "status": "completed",
    "date_created": "2024-01-22T18:00:00",
    "billing": {
      "first_name": "Test",
      "last_name": "User",
      "email": "test@example.com"
    },
    "line_items": [
      {
        "id": 1,
        "name": "Test Product",
        "product_id": 108,
        "quantity": 1,
        "price": "100.00"
      }
    ],
    "shipping_lines": [],
    "coupon_lines": [],
    "total": "100.00",
    "payment_method": "stripe"
  }' | jq '.' 2>/dev/null || echo "Response received (install jq for formatted output)"
