'use client'

import { useEffect, useRef } from 'react'

interface UsePeriodicRefetchOptions {
  refetch: () => void | Promise<void>
  intervalMs?: number
  enabled?: boolean
}

/**
 * Hook for periodic data refetching (fallback if Realtime disconnects)
 * Default interval: 90 seconds (between 60-120 as specified)
 */
export function usePeriodicRefetch({
  refetch,
  intervalMs = 90000, // 90 seconds
  enabled = true,
}: UsePeriodicRefetchOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const refetchRef = useRef(refetch)

  // Update refetch ref without causing re-renders
  useEffect(() => {
    refetchRef.current = refetch
  }, [refetch])

  useEffect(() => {
    if (!enabled) return

    // Initial refetch (debounced to avoid immediate refresh on mount)
    const initialTimeout = setTimeout(() => {
      refetchRef.current()
    }, 1000)

    // Set up interval
    intervalRef.current = setInterval(() => {
      refetchRef.current()
    }, intervalMs)

    // Cleanup on unmount
    return () => {
      clearTimeout(initialTimeout)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [intervalMs, enabled]) // Don't include refetch in deps to prevent infinite loops

  return {
    isActive: intervalRef.current !== null,
  }
}
