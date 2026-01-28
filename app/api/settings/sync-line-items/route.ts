import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { WooCommerceClient } from '@/lib/sync/woocommerce-client'

/**
 * Ensure a product exists for WooCommerce product_id; create minimal if not.
 * Returns our product_id to use in order_lines.
 */
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
 * API route to sync line items for all orders from WooCommerce
 * GET /wp-json/wc/v3/orders/<id> returns full order including line_items.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const force =
      request.nextUrl.searchParams.get('force') === 'true' ||
      (await request.json().catch(() => ({}))).force === true

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

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('order_number, woo_order_id')
      .not('woo_order_id', 'is', null)
      .limit(500)

    if (ordersError) {
      return NextResponse.json(
        { error: ordersError.message || 'Failed to load orders' },
        { status: 500 }
      )
    }

    let synced = 0
    let errors = 0
    const messages: string[] = []

    for (const order of orders || []) {
      try {
        if (!force) {
          const { count } = await supabase
            .from('order_lines')
            .select('*', { count: 'exact', head: true })
            .eq('order_number', order.order_number)
          if (count != null && count > 0) continue
        }

        const wooOrder = await wooClient.getOrder(Number(order.woo_order_id))
        if (!wooOrder || !Array.isArray(wooOrder.line_items) || wooOrder.line_items.length === 0) {
          continue
        }

        for (const item of wooOrder.line_items) {
          const wooProductId = Number(item.product_id) || 0
          const productId = await ensureProduct(
            supabase,
            wooProductId,
            item.name || '',
            item.price ?? '0'
          )
          if (productId <= 0) {
            errors++
            continue
          }

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

          if (upsertError) {
            console.error(`Order ${order.order_number} line ${item.id}:`, upsertError)
            errors++
          }
        }
        synced++
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`Error syncing line items for order ${order.order_number}:`, err)
        errors++
        messages.push(`Order ${order.order_number}: ${msg}`)
      }
    }

    return NextResponse.json({
      success: true,
      synced,
      errors,
      total: orders?.length ?? 0,
      message:
        messages.length > 0
          ? messages.slice(0, 5).join('; ')
          : undefined,
    })
  } catch (error) {
    console.error('Error syncing line items:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to sync line items',
      },
      { status: 500 }
    )
  }
}
