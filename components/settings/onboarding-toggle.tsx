'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export function OnboardingToggle() {
  const [showOnNextVisit, setShowOnNextVisit] = useState(false)

  useEffect(() => {
    // Load current setting from localStorage
    const setting = localStorage.getItem('vici-dashboard-show-tour')
    setShowOnNextVisit(setting !== 'false')
  }, [])

  const handleToggle = () => {
    const newValue = !showOnNextVisit
    setShowOnNextVisit(newValue)
    localStorage.setItem('vici-dashboard-show-tour', String(newValue))
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div>
        <div className="text-sm font-medium">Show onboarding on next visit</div>
        <div className="text-xs text-muted-foreground">
          Enable the welcome tour to appear when you next visit the dashboard
        </div>
      </div>
      <Button
        variant={showOnNextVisit ? 'default' : 'outline'}
        size="sm"
        onClick={handleToggle}
      >
        {showOnNextVisit ? 'Enabled' : 'Disabled'}
      </Button>
    </div>
  )
}
