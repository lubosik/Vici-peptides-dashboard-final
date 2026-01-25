-- Migration: Enable Realtime for orders, order_lines, and expenses tables
-- This allows Supabase Realtime subscriptions to work for these tables

-- Add tables to supabase_realtime publication
-- Note: If tables are already in the publication, this will error but that's OK
DO $$
BEGIN
  -- Add orders table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Table orders already in supabase_realtime publication';
  END;

  -- Add order_lines table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_lines;
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Table order_lines already in supabase_realtime publication';
  END;

  -- Add expenses table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Table expenses already in supabase_realtime publication';
  END;
END $$;

-- Verify tables are in publication (for debugging)
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('orders', 'order_lines', 'expenses')
ORDER BY tablename;
