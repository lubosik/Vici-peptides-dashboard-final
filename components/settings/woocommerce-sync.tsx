'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface SyncResult {
  success: boolean
  mode: string
  results?: {
    orders?: { synced: number; errors: number }
    products?: { synced: number; errors: number }
    coupons?: { synced: number; errors: number }
  }
  error?: string
}

export function WooCommerceSync() {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [mode, setMode] = useState<'full' | 'incremental'>('full')

  const handleSync = async () => {
    setSyncing(true)
    setResult(null)

    try {
      const response = await fetch(`/api/sync/woocommerce?mode=${mode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        mode,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          WooCommerce Sync
        </CardTitle>
        <CardDescription>
          Sync orders, products, and coupons from WooCommerce to Supabase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="mode-full"
              name="mode"
              value="full"
              checked={mode === 'full'}
              onChange={(e) => setMode(e.target.value as 'full' | 'incremental')}
              className="cursor-pointer"
            />
            <label htmlFor="mode-full" className="cursor-pointer">
              Full Sync
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="mode-incremental"
              name="mode"
              value="incremental"
              checked={mode === 'incremental'}
              onChange={(e) => setMode(e.target.value as 'full' | 'incremental')}
              className="cursor-pointer"
            />
            <label htmlFor="mode-incremental" className="cursor-pointer">
              Incremental Sync
            </label>
          </div>
        </div>

        <Button
          onClick={handleSync}
          disabled={syncing}
          className="w-full"
        >
          {syncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Now
            </>
          )}
        </Button>

        {result && (
          <div className={`p-4 rounded-lg ${
            result.success
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${
                result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              }`}>
                {result.success ? 'Sync Completed' : 'Sync Failed'}
              </span>
            </div>

            {result.results && (
              <div className="space-y-2 text-sm">
                {result.results.orders && (
                  <div>
                    <strong>Orders:</strong> {result.results.orders.synced} synced
                    {result.results.orders.errors > 0 && (
                      <span className="text-red-600 ml-2">
                        ({result.results.orders.errors} errors)
                      </span>
                    )}
                  </div>
                )}
                {result.results.products && (
                  <div>
                    <strong>Products:</strong> {result.results.products.synced} synced
                    {result.results.products.errors > 0 && (
                      <span className="text-red-600 ml-2">
                        ({result.results.products.errors} errors)
                      </span>
                    )}
                  </div>
                )}
                {result.results.coupons && (
                  <div>
                    <strong>Coupons:</strong> {result.results.coupons.synced} synced
                    {result.results.coupons.errors > 0 && (
                      <span className="text-red-600 ml-2">
                        ({result.results.coupons.errors} errors)
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {result.error && (
              <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                Error: {result.error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
