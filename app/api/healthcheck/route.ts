/**
 * Healthcheck Endpoint
 * 
 * GET /api/healthcheck
 * 
 * Returns row counts for all tables to verify data exists and queries work
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Get row counts for all tables
    const [
      { count: ordersCount },
      { count: orderLinesCount },
      { count: productsCount },
      { count: expensesCount },
      { count: couponsCount },
      { count: tieredPricingCount },
    ] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('order_lines').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('expenses').select('*', { count: 'exact', head: true }),
      supabase.from('coupons').select('*', { count: 'exact', head: true }),
      supabase.from('tiered_pricing').select('*', { count: 'exact', head: true }),
    ])

    // Test anon key access (what the dashboard uses)
    const anonSupabase = await import('@/lib/supabase/server').then(m => m.createClient())
    
    // Test orders
    const { data: anonOrdersData, count: anonOrdersCount, error: anonOrdersError } = await anonSupabase
      .from('orders')
      .select('order_number', { count: 'exact', head: false })
      .limit(1)
    
    // Test expenses
    const { data: anonExpensesData, count: anonExpensesCount, error: anonExpensesError } = await anonSupabase
      .from('expenses')
      .select('expense_id', { count: 'exact', head: false })
      .limit(1)
    
    // Test products
    const { data: anonProductsData, count: anonProductsCount, error: anonProductsError } = await anonSupabase
      .from('products')
      .select('product_id', { count: 'exact', head: false })
      .limit(1)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      admin_counts: {
        orders: ordersCount || 0,
        order_lines: orderLinesCount || 0,
        products: productsCount || 0,
        expenses: expensesCount || 0,
        coupons: couponsCount || 0,
        tiered_pricing: tieredPricingCount || 0,
      },
      anon_key_test: {
        orders: {
          count: anonOrdersCount || 0,
          data_length: anonOrdersData?.length || 0,
          error: anonOrdersError?.message || null,
          error_code: anonOrdersError?.code || null,
          can_read: !anonOrdersError,
        },
        expenses: {
          count: anonExpensesCount || 0,
          data_length: anonExpensesData?.length || 0,
          error: anonExpensesError?.message || null,
          error_code: anonExpensesError?.code || null,
          can_read: !anonExpensesError,
          rls_issue: !anonExpensesError && (anonExpensesCount || 0) === 0 && (expensesCount || 0) > 0,
        },
        products: {
          count: anonProductsCount || 0,
          data_length: anonProductsData?.length || 0,
          error: anonProductsError?.message || null,
          error_code: anonProductsError?.code || null,
          can_read: !anonProductsError,
          rls_issue: !anonProductsError && (anonProductsCount || 0) === 0 && (productsCount || 0) > 0,
        },
      },
      environment: {
        has_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        url_prefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) || 'NOT SET',
      },
    })
  } catch (error) {
    console.error('Healthcheck error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
