import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { WooCommerceClient } from '@/lib/sync/woocommerce-client'

async function ensureProduct(
  supabase: ReturnType<typeof createAdminClient>,
  wooProductId: number,
  name: string,
  price: string | number
): Promise<number> {
  const pid = Number(wooProductId) || 0
  if (pid <= 0) return 0
  const { data: byWoo } = await supabase
    .from('products')
    .select('product_id')
    .eq('woo_product_id', pid)
    .maybeSingle()
  if (byWoo) return Number(byWoo.product_id)
  const { data: byId } = await supabase
    .from('products')
    .select('product_id')
    .eq('product_id', pid)
    .maybeSingle()
  if (byId) return Number(byId.product_id)
  const { data: created } = await supabase
    .from('products')
    .upsert(
      {
        product_id: pid,
        woo_product_id: pid,
        product_name: name || `Product ${pid}`,
        our_cost: null,
        retail_price: parseFloat(String(price || '0')) || null,
        current_stock: null,
        stock_status: 'OUT OF STOCK',
      },
      { onConflict: 'product_id' }
    )
    .select('product_id')
    .single()
  return created?.product_id ? Number(created.product_id) : pid
}

/**
 * Sync line items for a single order from WooCommerce.
 * POST body: { order_number: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const orderNumber = body.order_number ?? request.nextUrl.searchParams.get('order_number')
    if (!orderNumber || typeof orderNumber !== 'string') {
      return NextResponse.json(
        { error: 'Missing order_number' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('order_number, woo_order_id')
      .eq('order_number', orderNumber)
      .maybeSingle()

    if (orderError || !order) {
      return NextResponse.json(
        { error: orderError?.message ?? 'Order not found' },
        { status: 404 }
      )
    }

    const wooOrderId = order.woo_order_id
    if (wooOrderId == null) {
      return NextResponse.json(
        { error: 'Order has no WooCommerce ID; cannot fetch line items' },
        { status: 400 }
      )
    }

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

    const wooOrder = await wooClient.getOrder(Number(wooOrderId))
    if (!wooOrder || !Array.isArray(wooOrder.line_items) || wooOrder.line_items.length === 0) {
      return NextResponse.json({
        success: true,
        order_number: orderNumber,
        line_items_synced: 0,
        message: 'Order has no line items in WooCommerce',
      })
    }

    let lineItemsSynced = 0
    for (const item of wooOrder.line_items) {
      const wooProductId = Number(item.product_id) || 0
      const productId = await ensureProduct(
        supabase,
        wooProductId,
        item.name || '',
        item.price ?? '0'
      )
      if (productId <= 0) continue

      const qty = parseInt(String(item.quantity || '1'), 10) || 1
      const unitPrice = parseFloat(String(item.price || '0')) || 0
      const lineItemData = {
        order_id: wooOrder.id,
        id: item.id,
        order_number: order.order_number,
        product_id: productId,
        variation_id: item.variation_id || null,
        name: item.name || '',
        quantity: qty,
        tax_class: item.tax_class || null,
        subtotal: String(item.subtotal || '0'),
        subtotal_tax: String(item.subtotal_tax || '0'),
        total: String(item.total || '0'),
        total_tax: String(item.total_tax || '0'),
        sku: item.sku || null,
        price: String(item.price ?? '0'),
        taxes: item.taxes || null,
        meta_data: item.meta_data || null,
        raw_json: item,
        qty_ordered: qty,
        customer_paid_per_unit: unitPrice,
        our_cost_per_unit: 0,
      }

      const { error: upsertError } = await supabase
        .from('order_lines')
        .upsert(lineItemData, {
          onConflict: 'order_id,id',
          ignoreDuplicates: false,
        })
      if (!upsertError) lineItemsSynced++
    }

    return NextResponse.json({
      success: true,
      order_number: orderNumber,
      line_items_synced: lineItemsSynced,
    })
  } catch (error) {
    console.error('Error syncing line items for order:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to sync line items',
      },
      { status: 500 }
    )
  }
}
