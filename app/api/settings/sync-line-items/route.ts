import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { WooCommerceClient } from '@/lib/sync/woocommerce-client'

/**
 * API route to sync line items for all orders from WooCommerce
 * This ensures every order has its line items populated
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
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

    const wooClient = new WooCommerceClient({
      storeUrl,
      consumerKey,
      consumerSecret,
    })

    // Get all orders that have woo_order_id but might be missing line items
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('order_number, woo_order_id')
      .not('woo_order_id', 'is', null)
      .limit(100) // Process in batches

    if (ordersError) throw ordersError

    let synced = 0
    let errors = 0

    // Fetch line items for each order from WooCommerce
    for (const order of orders || []) {
      try {
        // Check if line items already exist
        const { count } = await supabase
          .from('order_lines')
          .select('*', { count: 'exact', head: true })
          .eq('order_number', order.order_number)

        // Skip if line items already exist
        if (count && count > 0) {
          continue
        }

        // Fetch order from WooCommerce
        const wooOrder = await wooClient.getOrder(order.woo_order_id!)

        if (wooOrder && wooOrder.line_items && Array.isArray(wooOrder.line_items)) {
          // Upsert line items
          for (const item of wooOrder.line_items) {
            const lineItemData = {
              order_id: wooOrder.id,
              id: item.id,
              order_number: order.order_number,
              product_id: item.product_id || 0,
              variation_id: item.variation_id || null,
              name: item.name || '',
              quantity: parseInt(item.quantity || '1'),
              tax_class: item.tax_class || null,
              subtotal: String(item.subtotal || '0'),
              subtotal_tax: String(item.subtotal_tax || '0'),
              total: String(item.total || '0'),
              total_tax: String(item.total_tax || '0'),
              sku: item.sku || null,
              price: String(item.price || '0'),
              taxes: item.taxes || null,
              meta_data: item.meta_data || null,
              raw_json: item,
              qty_ordered: parseInt(item.quantity || '1'),
              customer_paid_per_unit: parseFloat(item.price || '0'),
              our_cost_per_unit: 0, // Will be calculated later
            }

            await supabase
              .from('order_lines')
              .upsert(lineItemData, {
                onConflict: 'order_id,id',
                ignoreDuplicates: false,
              })
          }
          synced++
        }
      } catch (error) {
        console.error(`Error syncing line items for order ${order.order_number}:`, error)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      synced,
      errors,
      total: orders?.length || 0,
    })
  } catch (error) {
    console.error('Error syncing line items:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync line items' },
      { status: 500 }
    )
  }
}
