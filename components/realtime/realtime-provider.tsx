'use client'

import React, { createContext, useContext, ReactNode, useCallback, useRef } from 'react'
import { useRealtime } from '@/lib/hooks/use-realtime'
import { useRouter } from 'next/navigation'

interface RealtimeContextValue {
  isConnected: {
    orders: boolean
    order_lines: boolean
    expenses: boolean
  }
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined)

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced refresh to prevent infinite loops
  const handleRefresh = useCallback(() => {
    // Clear existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    // Debounce refresh by 500ms to batch multiple updates
    refreshTimeoutRef.current = setTimeout(() => {
      router.refresh()
    }, 500)
  }, [router])

  // Subscribe to orders changes
  const ordersRealtime = useRealtime({
    table: 'orders',
    onInsert: handleRefresh,
    onUpdate: handleRefresh,
    onDelete: handleRefresh,
  })

  // Subscribe to order_lines changes
  const linesRealtime = useRealtime({
    table: 'order_lines',
    onInsert: handleRefresh,
    onUpdate: handleRefresh,
    onDelete: handleRefresh,
  })

  // Subscribe to expenses changes
  const expensesRealtime = useRealtime({
    table: 'expenses',
    onInsert: handleRefresh,
    onUpdate: handleRefresh,
    onDelete: handleRefresh,
  })

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  return (
    <RealtimeContext.Provider
      value={{
        isConnected: {
          orders: ordersRealtime.isConnected,
          order_lines: linesRealtime.isConnected,
          expenses: expensesRealtime.isConnected,
        },
      }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtimeContext() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtimeContext must be used within RealtimeProvider')
  }
  return context
}
