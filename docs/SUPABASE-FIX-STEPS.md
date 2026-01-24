# EXACT SUPABASE DASHBOARD STEPS TO FIX "ZERO VALUES" AND ENABLE REALTIME

## ✅ VERIFIED: Your Code Configuration

**Environment Variables:** All set correctly
- ✅ `NEXT_PUBLIC_SUPABASE_URL` exists
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` exists  
- ✅ `SUPABASE_SERVICE_ROLE_KEY` exists

**Code Setup:** Already correct
- ✅ Client uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ Server uses same URL with `NEXT_PUBLIC_SUPABASE_ANON_KEY` (subject to RLS)
- ✅ Admin uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- ✅ Realtime subscriptions are correctly implemented using `postgres_changes`

---

## 🔍 STEP 1: Verify Data API is Enabled (CRITICAL)

### In Supabase Dashboard:

1. **Go to:** Project Settings → API (left sidebar)
2. **Scroll to:** "Data API" section
3. **Check:**
   - ✅ **"Enable Data API"** toggle should be **ON** (green/enabled)
   - ✅ **"Exposed Schemas"** should include **`public`**

### If `public` is NOT in "Exposed Schemas":

**ACTION REQUIRED:**
1. Click the **"Edit"** button next to "Exposed Schemas"
2. Type `public` in the input field
3. Click **"Save"**

**WHY THIS MATTERS:** If the Data API is disabled OR `public` schema is not exposed, your Next.js app **cannot query tables** even if RLS allows it. This is the #1 reason for "zero values" when data exists.

---

## 🔍 STEP 2: Verify RLS Policies Allow Anon Reads

### Check RLS Status:

**In Supabase Dashboard → SQL Editor, run:**

```sql
-- Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'order_lines', 'products', 'expenses', 'coupons', 'tiered_pricing', 'ingestion_audit')
ORDER BY tablename;
```

**Expected:** All should show `rls_enabled = true`

### Check SELECT Policies:

```sql
-- Verify SELECT policies exist for anon role
SELECT 
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'order_lines', 'products', 'expenses', 'coupons', 'tiered_pricing', 'ingestion_audit')
  AND cmd = 'SELECT'
ORDER BY tablename;
```

**Expected:** Each table should have a policy with:
- `roles` containing `{anon}` or `{public}`
- `cmd = 'SELECT'`

### If Policies Are Missing:

**Your migration file `supabase/migrations/20260101000010_update_rls_for_anon_reads.sql` should have already created these.**

**If not, run this SQL:**

```sql
-- Products: Allow anon and authenticated to SELECT
CREATE POLICY "Allow anon and authenticated to view products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (true);

-- Orders: Allow anon and authenticated to SELECT
CREATE POLICY "Allow anon and authenticated to view orders"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (true);

-- Order Lines: Allow anon and authenticated to SELECT
CREATE POLICY "Allow anon and authenticated to view order_lines"
  ON order_lines FOR SELECT
  TO anon, authenticated
  USING (true);

-- Expenses: Allow anon and authenticated to SELECT
CREATE POLICY "Allow anon and authenticated to view expenses"
  ON expenses FOR SELECT
  TO anon, authenticated
  USING (true);

-- Coupons: Allow anon and authenticated to SELECT
CREATE POLICY "Allow anon and authenticated to view coupons"
  ON coupons FOR SELECT
  TO anon, authenticated
  USING (true);

-- Tiered Pricing: Allow anon and authenticated to SELECT
CREATE POLICY "Allow anon and authenticated to view tiered_pricing"
  ON tiered_pricing FOR SELECT
  TO anon, authenticated
  USING (true);

-- Ingestion Audit: Allow anon and authenticated to SELECT
CREATE POLICY "Allow anon and authenticated to view ingestion_audit"
  ON ingestion_audit FOR SELECT
  TO anon, authenticated
  USING (true);
```

---

## 🔍 STEP 3: Test Data Access with Healthcheck

### Run Healthcheck Endpoint:

1. **Start dev server:** `npm run dev`
2. **Open browser:** `http://localhost:3000/api/healthcheck`
3. **Check response:**

**Expected Response:**
```json
{
  "success": true,
  "admin_counts": {
    "orders": 35,
    "order_lines": 38,
    "products": 92,
    "expenses": 16
  },
  "anon_key_test": {
    "orders_count": 35,
    "error": null,
    "can_read": true
  }
}
```

### If `anon_key_test.can_read` is `false`:

- ❌ RLS policies are blocking reads → Fix Step 2
- ❌ Data API not enabled or schema not exposed → Fix Step 1

### If `admin_counts` shows zeros but you know data exists:

- ❌ Wrong Supabase project URL in `.env.local`
- ❌ Service role key is incorrect

---

## 🔍 STEP 4: Enable Realtime Publications

### Option A: Using Supabase Dashboard UI

1. **Go to:** Database → Replication (or Database → Publications)
2. **Find:** Publication named `supabase_realtime`
3. **Click:** On the publication to open it
4. **If you see toggle switches:**
   - ✅ Toggle **ON** for:
     - `public.orders`
     - `public.order_lines`
     - `public.expenses`
     - `public.products` (optional)

### Option B: Using SQL (if UI not available)

**In Supabase Dashboard → SQL Editor, run:**

```sql
-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_lines;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- Verify tables are in publication
SELECT 
  pubname,
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
ORDER BY tablename;
```

**Expected Result:** Should show 4 rows:
- `supabase_realtime | public | orders`
- `supabase_realtime | public | order_lines`
- `supabase_realtime | public | expenses`
- `supabase_realtime | public | products`

---

## 🔍 STEP 5: Verify Realtime is Working

### Check Browser Console:

1. **Open dashboard:** `http://localhost:3000`
2. **Open browser DevTools** (F12) → Console tab
3. **Look for logs:**
   ```
   Realtime subscription status for orders: SUBSCRIBED
   Realtime subscription status for order_lines: SUBSCRIBED
   Realtime subscription status for expenses: SUBSCRIBED
   ```

### Check Settings Page:

1. **Go to:** `/settings` page
2. **Scroll to:** "Realtime Subscriptions" section
3. **Should show:** "Connected" for orders, order_lines, expenses

### If Not Connected:

- ❌ Tables not in `supabase_realtime` publication → Fix Step 4
- ❌ RLS policies blocking reads → Fix Step 2 (Realtime respects RLS)
- ❌ Check browser console for WebSocket errors

---

## 🔍 STEP 6: Test End-to-End

### Test Data Flow:

1. **Verify Healthcheck:**
   - Open: `http://localhost:3000/api/healthcheck`
   - Should show non-zero counts

2. **Verify Dashboard:**
   - Open: `http://localhost:3000`
   - KPI cards should show same non-zero values as healthcheck

3. **Test Realtime:**
   - Open dashboard in browser
   - Open browser console (F12)
   - In another tab: Supabase Dashboard → Table Editor → `orders`
   - Insert a test row OR use "Send Test Ingestion" button in Settings
   - Watch browser console - should see: `Realtime INSERT on orders: {...}`
   - Dashboard should update within 1-2 seconds **without page refresh**

---

## ⚠️ IMPORTANT NOTES

### About "Realtime → Policies → messages" Warnings:

If you see messages like:
- "API DISABLED"
- "schema not exposed"

**This is about `realtime.messages` (broadcast/presence channels), NOT postgres_changes.**

**You DO NOT need to configure this** unless you're using broadcast channels. For row change streaming (`postgres_changes`), you only need:
- ✅ Tables in `supabase_realtime` publication (Step 4)
- ✅ RLS policies that allow reads (Step 2)

### Why Realtime Might Not Work:

Realtime **respects RLS**. If your client cannot read a row due to RLS, it will **not receive realtime events** for that row. This is why Step 2 (RLS policies) is critical.

---

## ✅ FINAL CHECKLIST

Before claiming success, verify:

- [ ] **Step 1:** Data API enabled AND `public` schema exposed
- [ ] **Step 2:** RLS policies allow `anon` SELECT on all tables
- [ ] **Step 3:** Healthcheck shows non-zero counts AND `anon_key_test.can_read = true`
- [ ] **Step 4:** Tables added to `supabase_realtime` publication
- [ ] **Step 5:** Browser console shows "SUBSCRIBED" for all tables
- [ ] **Step 6:** Dashboard shows non-zero values matching healthcheck
- [ ] **Step 6:** Inserting test row causes dashboard to update without refresh

---

## 🚨 QUICK DIAGNOSIS

**If everything shows 0:**
1. Check Step 1 (Data API + exposed schemas) ← **MOST COMMON ISSUE**
2. Check Step 2 (RLS policies)
3. Check Step 3 (healthcheck endpoint)

**If data shows but realtime doesn't work:**
1. Check Step 4 (publication)
2. Check Step 2 (RLS - realtime respects RLS)
3. Check browser console for WebSocket errors

**If healthcheck works but dashboard shows 0:**
1. Check browser console for JavaScript errors
2. Verify you're on the correct route (`/` for dashboard)
3. Check Network tab for failed API requests
