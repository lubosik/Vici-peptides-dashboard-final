/**
 * Test Ingestion Endpoint
 * 
 * POST /api/test-ingestion
 * 
 * Sends a safe test payload to the Edge Function to verify ingestion works
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/ingest-order`

    // Create a safe test payload (not real customer data)
    const testPayload = {
      id: 999999,
      number: 'TEST-' + Date.now(),
      status: 'processing',
      date_created: new Date().toISOString(),
      date_modified: new Date().toISOString(),
      billing: {
        first_name: 'Test',
        last_name: 'Customer',
        email: 'test@example.com',
      },
      shipping: {
        first_name: 'Test',
        last_name: 'Customer',
      },
      line_items: [
        {
          id: 1,
          name: 'Test Product',
          product_id: 1, // Assuming product_id 1 exists
          quantity: 1,
          price: '10.00',
        },
      ],
      shipping_lines: [],
      fee_lines: [],
      coupon_lines: [],
      total: '10.00',
      payment_method: 'test',
      payment_method_title: 'Test Payment',
    }

    // Call the Edge Function
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(testPayload),
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Ingestion failed',
          status: response.status,
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Test order ingested successfully',
      order_number: result.order_number,
      data: result,
    })
  } catch (error) {
    console.error('Test ingestion error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
