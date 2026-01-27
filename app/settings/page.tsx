'use client'

import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{ success: boolean; message: string } | null>(null)

  const handleSyncLineItems = async () => {
    setSyncing(true)
    setSyncStatus(null)
    
    try {
      const response = await fetch('/api/settings/sync-line-items', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSyncStatus({
          success: true,
          message: `Successfully synced line items for ${data.synced} orders. ${data.errors > 0 ? `${data.errors} errors occurred.` : ''}`,
        })
        // Refresh the page after a short delay
        setTimeout(() => {
          router.refresh()
        }, 2000)
      } else {
        setSyncStatus({
          success: false,
          message: data.error || 'Failed to sync line items',
        })
      }
    } catch (error) {
      setSyncStatus({
        success: false,
        message: 'An error occurred while syncing line items',
      })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 xl:p-8">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">
                Manage your dashboard settings
              </p>
            </div>

            {/* Data Sync Settings */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Data Synchronization</CardTitle>
                <CardDescription>
                  Sync order line items from WooCommerce to ensure all orders display complete information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {syncStatus && (
                    <Alert variant={syncStatus.success ? 'default' : 'destructive'}>
                      {syncStatus.success ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertDescription>{syncStatus.message}</AlertDescription>
                    </Alert>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      This will fetch line items from WooCommerce for all orders that are missing them. 
                      This ensures every order detail page shows what products were ordered.
                    </p>
                    <Button
                      onClick={handleSyncLineItems}
                      disabled={syncing}
                      className="flex items-center gap-2"
                    >
                      {syncing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Sync Line Items from WooCommerce
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Vici Peptides Dashboard</strong> - Real-time analytics and order management
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Version 1.0.0
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
