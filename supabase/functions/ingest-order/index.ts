/**
 * Supabase Edge Function: Ingest Order
 * 
 * Handles WooCommerce order webhooks and ingests data into Supabase
 * Supports idempotent upserts to prevent duplicate data
 * 
 * Endpoint: POST /ingest-order
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WooCommerceOrder {
  id: number
  number: string
  status: string
  date_created: string
  date_modified: string
  billing: {
    first_name: string
    last_name: string
    email: string
  }
  shipping: {
    first_name: string
    last_name: string
  }
  line_items: Array<{
    id: number
    name: string
    product_id: number
    quantity: number
    price: string
    meta_data?: Array<{ key: string; value: string }>
  }>
  shipping_lines: Array<{
    method_title: string
    total: string
  }>
  fee_lines: Array<{
    name: string
    total: string
  }>
  coupon_lines: Array<{
    code: string
    discount: string
  }>
  total: string
  payment_method: string
  payment_method_title: string
  customer_note?: string
}

interface ParsedOrder {
  order_number: string
  order_date: string
  customer_name: string
  customer_email: string
  shipping_charged: number
  shipping_cost: number
  free_shipping: boolean
  coupon_code: string | null
  coupon_discount: number
  payment_method: string
  order_status: string
  notes: string | null
  line_items: Array<{
    product_id: number
    qty_ordered: number
    customer_paid_per_unit: number
    our_cost_per_unit: number | null
  }>
}

function parseMoney(value: string | number | null | undefined): number {
  if (!value && value !== 0) return 0
  if (typeof value === 'number') {
    if (isNaN(value)) return 0
    return value
  }
  const parsed = parseFloat(value.toString().replace(/[$,]/g, ''))
  if (isNaN(parsed)) return 0
  return parsed
}

function parseDate(dateString: string): string {
  try {
    return new Date(dateString).toISOString()
  } catch {
    return new Date().toISOString()
  }
}

function parseWooCommerceOrder(wooOrder: WooCommerceOrder): ParsedOrder {
  // Extract customer name
  const firstName = wooOrder.billing?.first_name || ''
  const lastName = wooOrder.billing?.last_name || ''
  const customerName = `${firstName} ${lastName}`.trim() || 'Unknown Customer'

  // Extract shipping info - safely handle optional arrays
  const shippingLines = wooOrder.shipping_lines || []
  const shippingTotal = parseMoney(shippingLines[0]?.total || 0)
  const freeShipping = shippingTotal === 0 || shippingLines.length === 0

  // Extract coupon info
  const couponLine = wooOrder.coupon_lines?.[0]
  const couponCode = couponLine?.code || null
  const couponDiscount = parseMoney(couponLine?.discount || 0)

  // Extract payment method
  const paymentMethod = wooOrder.payment_method_title || wooOrder.payment_method || 'Unknown'

  // Parse line items
  const lineItems = wooOrder.line_items.map((item) => {
    // Try to extract our_cost from meta_data
    let ourCostPerUnit: number | null = null
    const costMeta = item.meta_data?.find((meta) => 
      meta.key?.toLowerCase().includes('cost') || 
      meta.key?.toLowerCase().includes('our_cost')
    )
    if (costMeta?.value) {
      ourCostPerUnit = parseMoney(costMeta.value)
    }

    return {
      product_id: item.product_id,
      qty_ordered: item.quantity,
      customer_paid_per_unit: parseMoney(item.price),
      our_cost_per_unit: ourCostPerUnit,
    }
  })

  return {
    order_number: `Order #${wooOrder.number || wooOrder.id}`,
    order_date: parseDate(wooOrder.date_created),
    customer_name: customerName,
    customer_email: wooOrder.billing?.email || '',
    shipping_charged: shippingTotal,
    shipping_cost: shippingTotal, // Assume shipping cost equals charged (can be updated later)
    free_shipping: freeShipping,
    coupon_code: couponCode,
    coupon_discount: couponDiscount,
    payment_method: paymentMethod,
    order_status: wooOrder.status,
    notes: wooOrder.customer_note || null,
    line_items: lineItems,
  }
}

async function upsertOrder(
  supabase: ReturnType<typeof createClient>, 
  order: ParsedOrder,
  rawWooOrder: WooCommerceOrder // Pass raw order for audit logging
) {
  // Upsert order (idempotent - uses order_number as unique key)
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .upsert(
      {
        order_number: order.order_number,
        order_date: order.order_date,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        shipping_charged: order.shipping_charged,
        shipping_cost: order.shipping_cost,
        free_shipping: order.free_shipping,
        coupon_code: order.coupon_code,
        coupon_discount: order.coupon_discount,
        payment_method: order.payment_method,
        order_status: order.order_status,
        notes: order.notes,
      },
      {
        onConflict: 'order_number', // Column name, not constraint name
        ignoreDuplicates: false,
      }
    )
    .select()
    .single()

  if (orderError) {
    throw new Error(`Failed to upsert order: ${orderError.message}`)
  }

  // Upsert order lines (idempotent - uses unique constraint columns)
  for (const lineItem of order.line_items) {
    const { error: lineError } = await supabase
      .from('order_lines')
      .upsert(
        {
          order_number: order.order_number,
          product_id: lineItem.product_id,
          qty_ordered: lineItem.qty_ordered,
          our_cost_per_unit: lineItem.our_cost_per_unit,
          customer_paid_per_unit: lineItem.customer_paid_per_unit,
        },
        {
          // Use column names from unique constraint, not constraint name
          onConflict: 'order_number,product_id,our_cost_per_unit,customer_paid_per_unit',
          ignoreDuplicates: false,
        }
      )

    if (lineError) {
      console.error(`Failed to upsert order line: ${lineError.message}`)
      // Continue with other line items even if one fails
    }
  }

  // Log ingestion in audit table (with error handling)
  try {
    const payloadJson = JSON.stringify(rawWooOrder)
    // Simple hash for idempotency (in production, use crypto.subtle for SHA-256)
    const payloadHash = btoa(payloadJson).substring(0, 64)
    
    await supabase
      .from('ingestion_audit')
      .insert({
        payload_hash: payloadHash,
        payload_json: payloadJson,
        order_number: order.order_number,
        status: 'success',
        error_message: null,
      })
  } catch (err: unknown) {
    console.error('Failed to log ingestion:', err instanceof Error ? err.message : 'Unknown error')
    // Don't fail the whole request if audit logging fails
  }

  return orderData
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    // In Supabase Edge Functions, these are automatically available
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in Edge Function settings.')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Parse request body
    const body = await req.json()

    // Support Make.com iterator approach: single line item per request
    // If body has a single line_item (not line_items array), it's from Make.com iterator
    let wooOrder: WooCommerceOrder
    
    if (body.line_item && !body.line_items) {
      // Make.com iterator: single line item in body.line_item
      // Reconstruct full order structure with single line item
      wooOrder = {
        id: body.id || body.order_id || 0,
        number: body.number || body.order_number || String(body.id || body.order_id || ''),
        status: body.status || 'processing',
        date_created: body.date_created || new Date().toISOString(),
        date_modified: body.date_modified || new Date().toISOString(),
        billing: body.billing || {
          first_name: body.customer_name?.split(' ')[0] || '',
          last_name: body.customer_name?.split(' ').slice(1).join(' ') || '',
          email: body.customer_email || '',
        },
        shipping: body.shipping || {
          first_name: '',
          last_name: '',
        },
        line_items: [body.line_item], // Single line item from iterator
        shipping_lines: body.shipping_lines || [],
        fee_lines: body.fee_lines || [],
        coupon_lines: body.coupon_lines || [],
        total: body.total || '0',
        payment_method: body.payment_method || '',
        payment_method_title: body.payment_method_title || body.payment_method || '',
        customer_note: body.customer_note || body.notes || undefined,
      }
    } else {
      // Standard WooCommerce webhook: full order with line_items array
      wooOrder = body as WooCommerceOrder
    }

    // Validate required fields
    if (!wooOrder.id && !wooOrder.number) {
      throw new Error('Missing required field: order id or number')
    }

    if (!wooOrder.line_items || wooOrder.line_items.length === 0) {
      throw new Error('Order must have at least one line item')
    }

    // Parse WooCommerce order to our format
    const parsedOrder = parseWooCommerceOrder(wooOrder)

    // Upsert order and line items (idempotent via unique constraints)
    const result = await upsertOrder(supabase, parsedOrder)

    return new Response(
      JSON.stringify({
        success: true,
        order_number: parsedOrder.order_number,
        message: 'Order ingested successfully',
        data: result,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error ingesting order:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const statusCode = errorMessage.includes('Missing') ? 400 : 500

    // Log error in audit table (if we have Supabase client)
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        })
        
        // Try to get request body for logging (may not be available if already consumed)
        let payloadJson = '{}'
        try {
          const bodyText = await req.clone().text()
          payloadJson = bodyText || '{}'
        } catch {
          // Body already consumed, use empty object
        }
        
        const payloadHash = btoa(payloadJson).substring(0, 64)
        
        await supabase
          .from('ingestion_audit')
          .insert({
            payload_hash: payloadHash,
            payload_json: payloadJson,
            status: 'error',
            error_message: errorMessage,
          })
      }
    } catch (auditErr) {
      console.error('Failed to log error in audit:', auditErr)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    )
  }
})
