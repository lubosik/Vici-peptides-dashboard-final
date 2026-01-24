'use client'

import { useRealtimeContext } from '@/components/realtime/realtime-provider'
import { CheckCircle, XCircle } from 'lucide-react'

export function RealtimeConnectionStatus() {
  const { isConnected } = useRealtimeContext()

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {isConnected.orders ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm">Orders: Connected</span>
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm">Orders: Disconnected</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isConnected.order_lines ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm">Order Lines: Connected</span>
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm">Order Lines: Disconnected</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isConnected.expenses ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm">Expenses: Connected</span>
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm">Expenses: Disconnected</span>
          </>
        )}
      </div>
    </div>
  )
}
