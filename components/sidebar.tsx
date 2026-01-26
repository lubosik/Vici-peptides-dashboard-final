'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Menu, X, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  LayoutDashboard,
  BarChart3,
  Star,
  MessageSquare,
  Mail,
  Settings,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Products', href: '/products', icon: Star },
  { name: 'Orders', href: '/orders', icon: MessageSquare },
  { name: 'Expenses', href: '/expenses', icon: Mail },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const projects = [
  { name: 'OPTION' },
  { name: 'CASE' },
  { name: 'LOCAL' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const NavContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <Menu className="h-5 w-5 text-foreground" />
        <span className="text-xl font-semibold text-foreground">Vici Peptides</span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href === '/' && pathname === '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative group',
                isActive
                  ? 'bg-accent/20 text-accent neon-glow-green'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn(
                  'h-5 w-5',
                  isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                )} />
                <span>{item.name}</span>
              </div>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </Link>
          )
        })}
      </nav>

      {/* Separator */}
      <div className="border-t border-border/30 mx-3" />

    </div>
  )

  // Mobile: Hamburger menu with Sheet
  if (isMobile) {
    return (
      <>
        {/* Mobile Header with Hamburger */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/30 glass-card flex items-center px-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 glass-card border-r border-border/30">
              <SheetHeader className="border-b border-border/30 px-6 py-4">
                <SheetTitle className="flex items-center gap-3">
                  <Menu className="h-5 w-5" />
                  <span className="text-xl font-semibold neon-text-cyan">Dashboard</span>
                </SheetTitle>
              </SheetHeader>
              <NavContent onNavigate={() => setIsOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-lg font-semibold neon-text-cyan">NeonMetrics</span>
          </div>
        </div>
        {/* Spacer for mobile header */}
        <div className="lg:hidden h-16" />
      </>
    )
  }

  // Desktop: Traditional sidebar
  return (
    <div className="hidden lg:flex h-screen w-64 flex-col border-r border-border bg-background">
      <NavContent />
    </div>
  )
}
