'use client'

import { useRouter } from 'next/navigation'
import { usePeriodicRefetch } from '@/lib/hooks/use-periodic-refetch'
import { useRealtimeContext } from '@/components/realtime/realtime-provider'

/**
 * Client component wrapper for dashboard realtime and periodic refetch
 */
export function DashboardClient({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isConnected } = useRealtimeContext()

  // Periodic refetch fallback (90 seconds)
  usePeriodicRefetch({
    refetch: () => {
      router.refresh()
    },
    intervalMs: 90000,
    enabled: true,
  })

  return <>{children}</>
}
