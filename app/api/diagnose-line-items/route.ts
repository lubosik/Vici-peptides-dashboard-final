import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Diagnostic endpoint to check line items in the database
 * Helps debug why line items aren't showing up
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('orderNumber')

    // Get total line items count
    const { count: totalCount } = await supabase
      .from('order_lines')
      .select('*', { count: 'exact', head: true })

    // Get sample line items
    const { data: sampleLines } = await supabase
      .from('order_lines')
      .select('order_number, product_id, qty_ordered')
      .limit(10)

    // Get sample order numbers from orders table
    const { data: sampleOrders } = await supabase
      .from('orders')
      .select('order_number')
      .limit(10)

    // If orderNumber provided, check line items for that specific order
    let orderLineItems = null
    if (orderNumber) {
      const decoded = decodeURIComponent(orderNumber)
      const { data, error } = await supabase
        .from('order_lines')
        .select('*')
        .eq('order_number', decoded)
      
      orderLineItems = { data, error: error?.message }
    }

    return NextResponse.json({
      totalLineItems: totalCount || 0,
      sampleLineItems: sampleLines || [],
      sampleOrderNumbers: sampleOrders?.map(o => o.order_number) || [],
      orderLineItems,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
