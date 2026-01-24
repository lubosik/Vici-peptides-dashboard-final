# Debug: Why Anon Key Returns 0 Rows

## Current Status from Healthcheck

```
admin_counts.orders: 35 ✅ (Data exists)
anon_key_test.orders_count: 0 ❌ (Anon key returns 0)
anon_key_test.can_read: true ✅ (No RLS error)
```

## Analysis

**If RLS was blocking:** We'd see an error like "permission denied" or error code `PGRST116`
**If RLS allows reads:** We should see the same count (35 orders)

**The fact that it returns 0 rows with no error suggests:**
1. RLS policies exist and allow reads (no error)
2. But something is filtering the results to 0 rows
3. OR the query is using a different filter/condition

## Most Likely Causes

### 1. RLS Policy Using Wrong Role
Check if policies use `TO anon, authenticated` or just `TO authenticated`

**Fix:** Run this SQL to verify:
```sql
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'orders'
  AND cmd = 'SELECT';
```

**Expected:** Should show `roles` containing `{anon}` or `{public}`

### 2. Data API Schema Not Exposed
If `public` schema is not in "Exposed Schemas", queries return empty results

**Fix:** Go to Supabase Dashboard → Project Settings → API → Ensure `public` is in "Exposed Schemas"

### 3. Query Using Different Filters
The healthcheck query might be different from what the dashboard uses

**Current healthcheck query:**
```typescript
.select('order_number', { count: 'exact', head: false })
.limit(1)
```

This should work, but let's verify the actual query being executed.

## Next Steps

1. **Check RLS policies in Supabase Dashboard:**
   - Go to Database → Policies
   - Find `orders` table
   - Verify SELECT policy includes `anon` role

2. **Check Data API settings:**
   - Go to Project Settings → API
   - Verify "Exposed Schemas" includes `public`

3. **Run diagnostic SQL:**
   ```sql
   -- Test as anon role directly
   SET ROLE anon;
   SELECT COUNT(*) FROM orders;
   RESET ROLE;
   ```

4. **Check if policies were actually applied:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'orders' 
   AND cmd = 'SELECT';
   ```
