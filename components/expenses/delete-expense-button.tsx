'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DeleteExpenseButtonProps {
  expenseId: number
  description: string
}

export function DeleteExpenseButton({ expenseId, description }: DeleteExpenseButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${description}"?`)) {
      return
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal
    let wasAborted = false

    setLoading(true)

    try {
      // Make the fetch request with abort signal
      const response = await fetch(`/api/expenses?expense_id=${expenseId}`, {
        method: 'DELETE',
        signal,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Check if request was aborted
      if (signal.aborted) {
        wasAborted = true
        return
      }

      // Ensure response is fully read before proceeding
      if (!response.ok) {
        let errorMessage = 'Failed to delete expense'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      // Read the response body to ensure request completes
      const result = await response.json()
      
      // Only refresh if request wasn't aborted
      if (!signal.aborted && !wasAborted) {
        await new Promise(resolve => setTimeout(resolve, 100))
        router.refresh()
      }
    } catch (error) {
      // Don't show error if request was aborted
      if (error instanceof Error && (error.name === 'AbortError' || signal.aborted)) {
        wasAborted = true
        return
      }
      
      console.error('Error deleting expense:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete expense')
    } finally {
      // Only reset loading if request wasn't aborted
      if (!wasAborted && !signal.aborted) {
        setLoading(false)
      }
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
