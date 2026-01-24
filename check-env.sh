#!/bin/bash
echo "Checking .env.local file..."
if [ -f .env.local ]; then
  echo "✅ .env.local exists"
  echo ""
  echo "Variables found:"
  grep -E "NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY" .env.local | sed 's/=.*/=***HIDDEN***/'
else
  echo "❌ .env.local not found in project root"
fi
