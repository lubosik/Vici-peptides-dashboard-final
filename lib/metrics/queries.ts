/**
 * SQL queries for dashboard metrics
 * All queries use computed columns from the database
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { getNetProfitMetrics } from './net-profit'

export interface DashboardKPIs {
  totalRevenue: number
  totalOrders: number
  totalProfit: number
  profitMargin: number
  averageOrderValue: number
  activeProducts: number
  totalExpenses: number
  netProfit: number
  netProfitMargin: number
  periodChange: {
    revenue: { value: number; percent: number }
    orders: { value: number; percent: number }
    profit: { value: number; percent: number }
  }
}

/**
 * Get all dashboard KPIs
 */
export async function getDashboardKPIs(
  supabase: SupabaseClient,
  period: 'all' | 'month' | 'week' = 'all'
): Promise<DashboardKPIs> {
  const now = new Date()
  let startDate: Date

  switch (period) {
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'week':
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 7)
      break
    default:
      startDate = new Date(0) // All time
  }

  // Get current period metrics - for 'all' period, get all orders without date filter
  // Exclude checkout-draft and cancelled orders (no money exchanged)
  let ordersQuery = supabase
    .from('orders')
    .select('order_total, order_profit, order_date, order_status')
    .not('order_status', 'in', '("checkout-draft","cancelled","draft")')
  
  if (period !== 'all') {
    ordersQuery = ordersQuery.gte('order_date', startDate.toISOString())
  }
  
  const { data: currentPeriod, error: currentError } = await ordersQuery
  
  if (currentError) {
    console.error('Error fetching orders for KPIs:', currentError)
    throw currentError
  }

  const totalRevenue = currentPeriod?.reduce((sum, o) => sum + (Number(o.order_total) || 0), 0) || 0
  const totalProfit = currentPeriod?.reduce((sum, o) => sum + (Number(o.order_profit) || 0), 0) || 0
  const totalOrders = currentPeriod?.length || 0
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Get previous period for comparison
  let previousStartDate: Date
  let previousEndDate: Date

  if (period === 'month') {
    previousEndDate = new Date(now.getFullYear(), now.getMonth(), 1)
    previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  } else if (period === 'week') {
    previousEndDate = new Date(now)
    previousEndDate.setDate(now.getDate() - 7)
    previousStartDate = new Date(previousEndDate)
    previousStartDate.setDate(previousEndDate.getDate() - 7)
  } else {
    // For 'all', compare to last 30 days
    previousEndDate = startDate
    previousStartDate = new Date(now)
    previousStartDate.setDate(now.getDate() - 30)
  }

  const { data: previousPeriod } = await supabase
    .from('orders')
    .select('order_total, order_profit')
    .not('order_status', 'in', '("checkout-draft","cancelled","draft")')
    .gte('order_date', previousStartDate.toISOString())
    .lt('order_date', previousEndDate.toISOString())

  const prevRevenue = previousPeriod?.reduce((sum, o) => sum + (Number(o.order_total) || 0), 0) || 0
  const prevProfit = previousPeriod?.reduce((sum, o) => sum + (Number(o.order_profit) || 0), 0) || 0
  const prevOrders = previousPeriod?.length || 0

  // Get active products (in stock) - use case-insensitive check
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('product_id, stock_status, current_stock')

  if (productsError) {
    console.error('Error fetching products:', productsError)
    // Don't throw, just return 0 for active products
  }

  // Filter in memory for case-insensitive stock status check
  const activeProducts = products?.filter((p) => {
    const status = (p.stock_status || '').toUpperCase().trim()
    return status === 'IN STOCK' && (p.current_stock || 0) > 0
  }).length || 0

  // Get net profit metrics (includes expenses)
  const netProfitMetrics = await getNetProfitMetrics(supabase, startDate.toISOString())

  return {
    totalRevenue,
    totalOrders,
    totalProfit,
    profitMargin,
    averageOrderValue,
    activeProducts,
    totalExpenses: netProfitMetrics.totalExpenses,
    netProfit: netProfitMetrics.netProfit,
    netProfitMargin: netProfitMetrics.netProfitMargin,
    periodChange: {
      revenue: {
        value: totalRevenue - prevRevenue,
        percent: prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0,
      },
      orders: {
        value: totalOrders - prevOrders,
        percent: prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : 0,
      },
      profit: {
        value: totalProfit - prevProfit,
        percent: prevProfit > 0 ? ((totalProfit - prevProfit) / prevProfit) * 100 : 0,
      },
    },
  }
}

/**
 * Get revenue over time (for charts)
 */
export async function getRevenueOverTime(
  supabase: SupabaseClient,
  days: number = 30
): Promise<Array<{ date: string; revenue: number; profit: number; orders: number }>> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: orders, error } = await supabase
    .from('orders')
    .select('order_date, order_total, order_profit')
    .gte('order_date', startDate.toISOString())
    .order('order_date', { ascending: true })

  if (error) throw error

  // Group by date
  const grouped = new Map<string, { revenue: number; profit: number; orders: number }>()

  orders?.forEach((order) => {
    const date = new Date(order.order_date).toISOString().split('T')[0]
    const existing = grouped.get(date) || { revenue: 0, profit: 0, orders: 0 }
    grouped.set(date, {
      revenue: existing.revenue + (Number(order.order_total) || 0),
      profit: existing.profit + (Number(order.order_profit) || 0),
      orders: existing.orders + 1,
    })
  })

  // Convert to array and fill missing dates
  const result: Array<{ date: string; revenue: number; profit: number; orders: number }> = []
  const currentDate = new Date(startDate)
  const endDate = new Date()

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const data = grouped.get(dateStr) || { revenue: 0, profit: 0, orders: 0 }
    result.push({
      date: dateStr,
      ...data,
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return result
}

/**
 * Get top products by revenue
 * Calculates revenue and profit from order_lines since products table doesn't have these columns
 */
export async function getTopProducts(
  supabase: SupabaseClient,
  limit: number = 10
): Promise<Array<{
  productId: number
  productName: string
  revenue: number
  qtySold: number
  profit: number
}>> {
  // Get all order lines with product info
  // Join with orders to exclude draft/cancelled orders
  const { data: orderLines, error: linesError } = await supabase
    .from('order_lines')
    .select(`
      product_id,
      line_total,
      line_profit,
      qty_ordered,
      order_number,
      orders!inner(order_status)
    `)
    .not('orders.order_status', 'in', '("checkout-draft","cancelled","draft")')

  if (linesError) throw linesError

  // Get all products for names
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('product_id, product_name')

  if (productsError) throw productsError

  // Create product name map
  const productNameMap = new Map<number, string>()
  products?.forEach((p) => {
    productNameMap.set(p.product_id, p.product_name)
  })

  // Aggregate by product
  const productMap = new Map<number, {
    productId: number
    productName: string
    revenue: number
    qtySold: number
    profit: number
  }>()

  orderLines?.forEach((line) => {
    const productId = line.product_id
    const existing = productMap.get(productId) || {
      productId,
      productName: productNameMap.get(productId) || `Product ${productId}`,
      revenue: 0,
      qtySold: 0,
      profit: 0,
    }

    productMap.set(productId, {
      ...existing,
      revenue: existing.revenue + (Number(line.line_total) || 0),
      qtySold: existing.qtySold + (Number(line.qty_ordered) || 0),
      profit: existing.profit + (Number(line.line_profit) || 0),
    })
  })

  // Convert to array, sort by revenue, and limit
  const topProducts = Array.from(productMap.values())
    .filter((p) => p.revenue > 0) // Only products with sales
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)

  return topProducts
}
