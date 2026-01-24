'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ExpenseCategoryData {
  category: string
  total: number
  count: number
}

interface ExpensesChartProps {
  data: ExpenseCategoryData[]
}

// Color palette for expense categories
const COLORS = [
  '#3b82f6', // Blue - Inventory
  '#1f2937', // Dark gray - Software
  '#8b5cf6', // Purple - Supplies
  '#ec4899', // Pink - Marketing
  '#f59e0b', // Orange - Packaging
  '#10b981', // Green - Shipping Supplies
  '#6366f1', // Indigo - Office
  '#ef4444', // Red - Other
]

export function ExpensesChart({ data }: ExpensesChartProps) {
  // Filter out zero values and sort by value descending
  const chartData = data
    .filter((item) => item.total > 0) // Only show categories with expenses
    .map((item) => ({
      name: item.category || 'Uncategorized',
      value: item.total,
      count: item.count,
    }))
    .sort((a, b) => b.value - a.value) // Sort by value descending

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expenses by Category</CardTitle>
          <CardDescription>Breakdown of expenses by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No expense data available
          </div>
        </CardContent>
      </Card>
    )
  }

  // Custom label function - only show label on pie slice if percentage is >= 5%
  // Smaller slices will only show in legend
  const renderLabel = ({ name, percent }: { name: string; percent: number }) => {
    if (percent < 0.05) return '' // Hide labels for slices < 5%
    return `${(percent * 100).toFixed(0)}%`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses by Category</CardTitle>
        <CardDescription>Breakdown of expenses by category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={renderLabel}
                outerRadius={90}
                innerRadius={35}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={3}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.375rem',
                }}
                formatter={(value: number, name: string, props: any) => [
                  `$${value.toLocaleString()}`,
                  `${name} (${props.payload.count} expenses)`,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Custom legend below chart to ensure proper alignment */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
            {chartData.map((entry, index) => {
              const total = chartData.reduce((sum, d) => sum + d.value, 0)
              const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0.0'
              return (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{entry.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {percent}% • ${entry.value.toLocaleString()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
