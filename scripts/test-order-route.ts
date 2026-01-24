/**
 * Test script to verify order detail routes work
 * Run with: tsx scripts/test-order-route.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

async function testOrderRoutes() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Get a few orders
  const { data: orders, error } = await supabase
    .from('orders')
    .select('order_number')
    .limit(5)

  if (error) {
    console.error('❌ Error fetching orders:', error)
    process.exit(1)
  }

  if (!orders || orders.length === 0) {
    console.log('⚠️  No orders found in database')
    return
  }

  console.log('✅ Found orders:')
  orders.forEach((order, i) => {
    const encoded = encodeURIComponent(order.order_number)
    console.log(`  ${i + 1}. ${order.order_number}`)
    console.log(`     URL: http://localhost:3000/orders/${encoded}`)
  })

  console.log('\n📝 Test these URLs in your browser after starting the dev server:')
  console.log('   npm run dev')
}

testOrderRoutes().catch(console.error)
