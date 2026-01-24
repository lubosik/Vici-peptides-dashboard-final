/**
 * Test Tables Endpoint
 * 
 * GET /api/test-tables?table=expenses|products
 * 
 * Tests specific table access with both admin and anon keys
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const table = searchParams.get('table') || 'expenses'

    if (!['expenses', 'products'].includes(table)) {
      return NextResponse.json(
        { error: 'Invalid table. Use expenses or products' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    const anonClient = await createClient()

    // Test admin access
    const { data: adminData, count: adminCount, error: adminError } = await adminClient
      .from(table)
      .select('*', { count: 'exact', head: false })
      .limit(5)

    // Test anon access
    const { data: anonData, count: anonCount, error: anonError } = await anonClient
      .from(table)
      .select('*', { count: 'exact', head: false })
      .limit(5)

    // Get column info
    let columnInfo = null
    try {
      const result = await adminClient
        .rpc('get_table_columns', { table_name: table })
        .single()
      columnInfo = result.data
    } catch (error) {
      columnInfo = null
    }

    return NextResponse.json({
      success: true,
      table,
      timestamp: new Date().toISOString(),
      admin_test: {
        count: adminCount || 0,
        data_length: adminData?.length || 0,
        error: adminError?.message || null,
        error_code: adminError?.code || null,
        sample_data: adminData?.slice(0, 2) || [],
      },
      anon_test: {
        count: anonCount || 0,
        data_length: anonData?.length || 0,
        error: anonError?.message || null,
        error_code: anonError?.code || null,
        can_read: !anonError,
        sample_data: anonData?.slice(0, 2) || [],
      },
      comparison: {
        admin_has_data: (adminCount || 0) > 0,
        anon_has_data: (anonCount || 0) > 0,
        counts_match: (adminCount || 0) === (anonCount || 0),
        rls_blocking: !anonError && (anonCount || 0) === 0 && (adminCount || 0) > 0,
      },
    })
  } catch (error) {
    console.error('Test tables error:', error)
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
