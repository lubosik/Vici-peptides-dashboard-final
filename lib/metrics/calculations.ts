/**
 * Metrics calculation functions
 * All formulas match docs/calculations.md
 */

export interface OrderMetrics {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  orderCount: number
  averageOrderValue: number
  profitMargin: number
}

export interface ProductMetrics {
  productId: number
  productName: string
  qtySold: number
  revenue: number
  cost: number
  profit: number
  profitMargin: number
}

export interface TimeSeriesData {
  date: string
  revenue: number
  profit: number
  orders: number
}

/**
 * Calculate profit margin percentage
 * Formula: (Profit / Revenue) × 100
 */
export function calculateProfitMargin(revenue: number, profit: number): number {
  if (revenue === 0) return 0
  return (profit / revenue) * 100
}

/**
 * Calculate average order value
 * Formula: Total Revenue / Order Count
 */
export function calculateAverageOrderValue(revenue: number, orderCount: number): number {
  if (orderCount === 0) return 0
  return revenue / orderCount
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Calculate period-over-period change
 */
export function calculatePeriodChange(current: number, previous: number): {
  value: number
  percent: number
} {
  if (previous === 0) {
    return { value: current, percent: current > 0 ? 100 : 0 }
  }
  const change = current - previous
  const percent = (change / previous) * 100
  return { value: change, percent }
}
