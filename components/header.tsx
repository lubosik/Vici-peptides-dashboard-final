'use client'

import { Search, LogOut, Package, ShoppingCart, DollarSign } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useDebounce } from '@/hooks/use-debounce'

interface SearchResult {
  type: 'order' | 'product' | 'expense'
  id: string | number
  title: string
  subtitle: string
  url: string
}

export function Header() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(searchQuery, 300)

  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) return
    
    // Try to determine what type of search it is
    const trimmedQuery = query.trim()
    
    // Check if it's an order number (contains # or "Order" or just numbers)
    if (trimmedQuery.match(/order\s*#?\s*\d+/i) || trimmedQuery.match(/^\d+$/)) {
      const orderNum = trimmedQuery.replace(/order\s*#?\s*/i, '').trim()
      // Try to go directly to order detail page if it looks like a specific order
      if (orderNum) {
        router.push(`/orders?search=${encodeURIComponent(orderNum)}`)
      }
      return
    }
    
    // Check if it contains expense-related keywords
    if (trimmedQuery.match(/expense|shipping|inventory|software|supplies|marketing/i)) {
      router.push(`/expenses?search=${encodeURIComponent(trimmedQuery)}`)
      return
    }
    
    // Default to products search
    router.push(`/products?search=${encodeURIComponent(trimmedQuery)}`)
  }, [router])

  const debouncedSearch = useDebounce(searchQuery, 500)

  // Auto-search when debounced query changes (optional - can remove if you prefer Enter-only)
  // useEffect(() => {
  //   if (debouncedSearch) {
  //     handleSearch(debouncedSearch)
  //   }
  // }, [debouncedSearch, handleSearch])

  // Fetch search previews
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2) {
      setIsSearching(true)
      fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
        .then(res => res.json())
        .then(data => {
          setSearchResults(data.results || [])
          setShowResults(true)
          setIsSearching(false)
        })
        .catch(() => {
          setIsSearching(false)
        })
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }, [debouncedQuery])

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery)
      setShowResults(false)
    } else if (e.key === 'Escape') {
      setShowResults(false)
    }
  }

  const handleResultClick = (url: string) => {
    router.push(url)
    setShowResults(false)
    setSearchQuery('')
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-4 w-4" />
      case 'product':
        return <Package className="h-4 w-4" />
      case 'expense':
        return <DollarSign className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      // Force redirect even if API call fails
      router.push('/login')
    }
  }

  return (
    <div className="h-14 sm:h-16 border-b border-border bg-background flex items-center justify-between px-3 sm:px-4 lg:px-6">
      {/* Search Bar - Centered */}
      <div className="flex-1 flex justify-center max-w-2xl mx-auto">
        <div ref={searchRef} className="relative w-full">
          <Input
            type="text"
            placeholder="Search orders, products, expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (searchResults.length > 0) setShowResults(true)
            }}
            className="w-full pl-3 sm:pl-4 pr-10 sm:pr-12 py-1.5 sm:py-2 text-sm sm:text-base rounded-md bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <div className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2">
            {isSearching ? (
              <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-[60vh] sm:max-h-96 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}-${index}`}
                  onClick={() => handleResultClick(result.url)}
                  className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-muted flex items-center gap-2 sm:gap-3 transition-colors text-sm sm:text-base"
                >
                  <div className="text-muted-foreground">
                    {getResultIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{result.title}</div>
                    <div className="text-sm text-muted-foreground truncate">{result.subtitle}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Logout Button */}
      <div className="ml-2 sm:ml-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3"
        >
          <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden md:inline text-xs sm:text-sm">Logout</span>
        </Button>
      </div>
    </div>
  )
}
