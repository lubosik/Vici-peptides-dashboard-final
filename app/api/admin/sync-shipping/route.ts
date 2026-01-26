import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createShippoClient } from '@/lib/shippo/client'
import { syncShippingCostForOrder } from '@/lib/shippo/sync-shipping-cost'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/sync-shipping
 * Sync shipping cost for a specific order
 * 
 * Query params:
 * - orderId: WooCommerce order ID (optional, uses orderNumber if not provided)
 * - orderNumber: Order number (required if orderId not provided)
 * - forceResync: Force re-sync even if shipping cost exists (default: false)
 */
export async function POST(request: NextRequest) {
  try {
    // Check Basic Auth (if implemented)
    // For now, this is admin-only via server-side only

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const orderNumber = searchParams.get('orderNumber')
    const forceResync = searchParams.get('forceResync') === 'true'

    if (!orderId && !orderNumber) {
      return NextResponse.json(
        { error: 'orderId or orderNumber is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const shippoClient = createShippoClient()

    // Get WooCommerce credentials
    const storeUrl = process.env.WOOCOMMERCE_STORE_URL
    const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY
    const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET

    if (!storeUrl || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: 'WooCommerce credentials not configured' },
        { status: 500 }
      )
    }

    // If orderNumber provided, find the order
    let finalOrderNumber = orderNumber
    let finalOrderId = orderId ? parseInt(orderId) : undefined

    if (orderNumber && !finalOrderId) {
      const { data: order } = await supabase
        .from('orders')
        .select('woo_order_id')
        .eq('order_number', orderNumber)
        .maybeSingle()

      if (order?.woo_order_id) {
        finalOrderId = order.woo_order_id
      }
    } else if (finalOrderId && !finalOrderNumber) {
      const { data: order } = await supabase
        .from('orders')
        .select('order_number')
        .eq('woo_order_id', finalOrderId)
        .maybeSingle()

      if (order?.order_number) {
        finalOrderNumber = order.order_number
      }
    }

    if (!finalOrderNumber || !finalOrderId) {
      return NextResponse.json(
        { error: 'Order not found in database' },
        { status: 404 }
      )
    }

    const result = await syncShippingCostForOrder({
      orderId: finalOrderId,
      orderNumber: finalOrderNumber,
      supabase,
      shippoClient,
      wooCommerceConfig: {
        storeUrl,
        consumerKey,
        consumerSecret,
      },
      forceResync,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to sync shipping cost' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      orderNumber: finalOrderNumber,
      orderId: finalOrderId,
      shippingCost: result.shippingCost,
      shippingCostCurrency: result.shippingCostCurrency,
      shippingCostSource: result.shippingCostSource,
      shippoShipmentId: result.shippoShipmentId,
      shippoRateId: result.shippoRateId,
      expenseId: result.expenseId,
    })
  } catch (error) {
    console.error('Error in sync-shipping route:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync shipping cost',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/sync-shipping-all
 * Sync shipping costs for all orders missing shipping costs
 * 
 * Query params:
 * - since: ISO date string - only sync orders created after this date
 * - limit: Maximum number of orders to process (default: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')
    const limit = parseInt(searchParams.get('limit') || '100')

    const supabase = createAdminClient()
    const shippoClient = createShippoClient()

    // Get WooCommerce credentials
    const storeUrl = process.env.WOOCOMMERCE_STORE_URL
    const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY
    const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET

    if (!storeUrl || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: 'WooCommerce credentials not configured' },
        { status: 500 }
      )
    }

    // Find orders missing shipping costs
    let query = supabase
      .from('orders')
      .select('order_number, woo_order_id, order_date')
      .or('shipping_cost.is.null,shipping_cost_source.is.null')
      .not('woo_order_id', 'is', null)
      .order('order_date', { ascending: false })
      .limit(limit)

    if (since) {
      query = query.gte('order_date', since)
    }

    const { data: orders, error: ordersError } = await query

    if (ordersError) {
      throw ordersError
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No orders need shipping cost sync',
        processed: 0,
        errors: 0,
      })
    }

    // Process orders with rate limiting
    let processed = 0
    let errors = 0
    const results: Array<{ orderNumber: string; success: boolean; error?: string }> = []

    for (const order of orders) {
      try {
        if (!order.woo_order_id || !order.order_number) {
          continue
        }

        const result = await syncShippingCostForOrder({
          orderId: order.woo_order_id,
          orderNumber: order.order_number,
          supabase,
          shippoClient,
          wooCommerceConfig: {
            storeUrl,
            consumerKey,
            consumerSecret,
          },
          forceResync: false,
        })

        if (result.success) {
          processed++
          results.push({ orderNumber: order.order_number, success: true })
        } else {
          errors++
          results.push({
            orderNumber: order.order_number,
            success: false,
            error: result.error,
          })
        }

        // Rate limit: wait 500ms between requests to avoid overwhelming Shippo
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        errors++
        results.push({
          orderNumber: order.order_number,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      errors,
      total: orders.length,
      results: results.slice(0, 20), // Return first 20 results
    })
  } catch (error) {
    console.error('Error in sync-shipping-all route:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync shipping costs',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
