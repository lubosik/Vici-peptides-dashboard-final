import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDashboardKPIs, getRevenueOverTime, getTopProducts } from '@/lib/metrics/queries'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'kpis'
    const period = (searchParams.get('period') || 'all') as 'all' | 'month' | 'week'
    const days = parseInt(searchParams.get('days') || '30')

    const supabase = await createClient()

    switch (type) {
      case 'kpis':
        const kpis = await getDashboardKPIs(supabase, period)
        return NextResponse.json(kpis)

      case 'revenue-over-time':
        const revenueData = await getRevenueOverTime(supabase, days)
        return NextResponse.json(revenueData)

      case 'top-products':
        const limit = parseInt(searchParams.get('limit') || '10')
        const products = await getTopProducts(supabase, limit)
        return NextResponse.json(products)

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
