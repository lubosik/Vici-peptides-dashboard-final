/**
 * Supabase Connectivity Diagnostic Script
 * 
 * Checks:
 * 1. Environment variables are set
 * 2. Can connect to Supabase
 * 3. Row counts for all tables
 * 4. RLS policies are allowing reads
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { createAdminClient } from '../lib/supabase/admin'
import { createClient } from '../lib/supabase/server'

async function diagnose() {
  console.log('🔍 Supabase Connectivity Diagnostic\n')
  console.log('=' .repeat(60))

  // Check environment variables
  console.log('\n1. Environment Variables:')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ SET' : '❌ MISSING'}`)
  if (supabaseUrl) {
    console.log(`      Value: ${supabaseUrl.substring(0, 30)}...`)
  }
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ SET' : '❌ MISSING'}`)
  if (supabaseAnonKey) {
    console.log(`      Value: ${supabaseAnonKey.substring(0, 20)}...`)
  }
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ SET' : '❌ MISSING'}`)
  if (supabaseServiceKey) {
    console.log(`      Value: ${supabaseServiceKey.substring(0, 20)}...`)
  }

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.log('\n❌ Missing required environment variables!')
    process.exit(1)
  }

  // Test admin client (service role - bypasses RLS)
  console.log('\n2. Testing Admin Client (Service Role):')
  try {
    const adminClient = createAdminClient()
    
    const tables = ['products', 'orders', 'order_lines', 'expenses', 'coupons', 'tiered_pricing']
    const counts: Record<string, number> = {}

    for (const table of tables) {
      const { count, error } = await adminClient
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`   ❌ ${table}: Error - ${error.message}`)
        counts[table] = -1
      } else {
        console.log(`   ✅ ${table}: ${count || 0} rows`)
        counts[table] = count || 0
      }
    }

    // Test a sample query
    const { data: sampleOrders, error: sampleError } = await adminClient
      .from('orders')
      .select('order_number, order_total, order_date')
      .limit(3)

    if (sampleError) {
      console.log(`   ❌ Sample query error: ${sampleError.message}`)
    } else {
      console.log(`   ✅ Sample orders query: ${sampleOrders?.length || 0} rows returned`)
      if (sampleOrders && sampleOrders.length > 0) {
        console.log(`      Example: ${sampleOrders[0].order_number} - $${sampleOrders[0].order_total}`)
      }
    }

    // Test server client (anon key - subject to RLS)
    console.log('\n3. Testing Server Client (Anon Key with RLS):')
    try {
      const serverClient = await createClient()
      
      for (const table of tables) {
        const { count, error } = await serverClient
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.log(`   ❌ ${table}: RLS BLOCKED - ${error.message}`)
        } else {
          const adminCount = counts[table]
          const anonCount = count || 0
          if (adminCount === anonCount) {
            console.log(`   ✅ ${table}: ${anonCount} rows (RLS allows read)`)
          } else {
            console.log(`   ⚠️  ${table}: ${anonCount} rows (Admin: ${adminCount}, RLS may be filtering)`)
          }
        }
      }

      // Test KPI query
      const { data: kpiOrders, error: kpiError } = await serverClient
        .from('orders')
        .select('order_total, order_profit')
      
      if (kpiError) {
        console.log(`   ❌ KPI query error: ${kpiError.message}`)
      } else {
        const totalRevenue = kpiOrders?.reduce((sum, o) => sum + (Number(o.order_total) || 0), 0) || 0
        console.log(`   ✅ KPI query: ${kpiOrders?.length || 0} orders, Total Revenue: $${totalRevenue.toFixed(2)}`)
      }
    } catch (err) {
      console.log(`   ❌ Server client error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('\n📊 Summary:')
    console.log(`   Total Products: ${counts.products}`)
    console.log(`   Total Orders: ${counts.orders}`)
    console.log(`   Total Order Lines: ${counts.order_lines}`)
    console.log(`   Total Expenses: ${counts.expenses}`)
    
    if (counts.orders === 0 && counts.order_lines === 0) {
      console.log('\n⚠️  WARNING: No orders found in database!')
      console.log('   Run: npm run import')
    } else if (counts.orders > 0) {
      console.log('\n✅ Database has data. Dashboard should display non-zero values.')
    }

  } catch (err) {
    console.log(`\n❌ Fatal error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    if (err instanceof Error && err.stack) {
      console.log(`\nStack trace:\n${err.stack}`)
    }
    process.exit(1)
  }
}

diagnose().catch(console.error)
