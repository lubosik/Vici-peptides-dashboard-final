'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Select } from '@/components/ui/select'
import type { TopProductsDateRange } from '@/lib/metrics/queries'

const LABELS: Record<TopProductsDateRange, string> = {
  day: 'Today',
  week: 'This week',
  month: 'This month',
  year: 'This year',
  all: 'All time',
  custom: 'Custom range',
}

interface TopProductsRangeSelectorProps {
  range: TopProductsDateRange
  dateFrom?: string
  dateTo?: string
}

export function TopProductsRangeSelector({
  range,
  dateFrom,
  dateTo,
}: TopProductsRangeSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [customFrom, setCustomFrom] = useState(dateFrom || '')
  const [customTo, setCustomTo] = useState(dateTo || '')

  const updateUrl = useCallback(
    (newRange: TopProductsDateRange, from?: string, to?: string) => {
      const params = new URLSearchParams()
      if (newRange !== 'all') params.set('topRange', newRange)
      if (newRange === 'custom' && from) params.set('topFrom', from)
      if (newRange === 'custom' && to) params.set('topTo', to)
      const qs = params.toString()
      router.push(pathname + (qs ? `?${qs}` : ''))
    },
    [pathname, router]
  )

  const handleSelect = (value: string) => {
    const r = value as TopProductsDateRange
    if (r === 'custom') {
      // Keep current custom dates if any
      updateUrl('custom', dateFrom || customFrom, dateTo || customTo)
      return
    }
    updateUrl(r)
  }

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      updateUrl('custom', customFrom, customTo)
    }
  }

  const options: TopProductsDateRange[] = ['day', 'week', 'month', 'year', 'all', 'custom']

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={range}
        onChange={(e) => handleSelect(e.target.value)}
        className="w-[140px]"
      >
        <option value="day">{LABELS.day}</option>
        <option value="week">{LABELS.week}</option>
        <option value="month">{LABELS.month}</option>
        <option value="year">{LABELS.year}</option>
        <option value="all">{LABELS.all}</option>
        <option value="custom">{LABELS.custom}</option>
      </Select>
      {range === 'custom' && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={dateFrom ?? customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          />
          <span className="text-muted-foreground">–</span>
          <input
            type="date"
            value={dateTo ?? customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          />
          <button
            type="button"
            onClick={handleCustomApply}
            className="h-9 rounded-md bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  )
}
