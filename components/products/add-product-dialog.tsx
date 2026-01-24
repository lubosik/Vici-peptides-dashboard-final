'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useRouter } from 'next/navigation'

export function AddProductDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const product = {
      name: formData.get('name') as string,
      type: formData.get('type') as string || 'simple',
      regular_price: formData.get('regular_price') as string,
      description: formData.get('description') as string || '',
      short_description: formData.get('short_description') as string || '',
      sku: formData.get('sku') as string || '',
      our_cost: formData.get('our_cost') as string || null,
      stock_quantity: formData.get('stock_quantity') ? parseInt(formData.get('stock_quantity') as string) : null,
      stock_status: formData.get('stock_status') as string || 'instock',
      status: 'publish',
    }

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create product')
      }

      setOpen(false)
      router.refresh()
      onSuccess?.()
    } catch (error) {
      console.error('Error creating product:', error)
      alert(error instanceof Error ? error.message : 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Product</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>
              Create a new product in WooCommerce and sync to the dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Product name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Product Type</Label>
              <Select name="type" id="type" defaultValue="simple">
                <option value="simple">Simple</option>
                <option value="variable">Variable</option>
                <option value="grouped">Grouped</option>
                <option value="external">External</option>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="regular_price">Regular Price *</Label>
              <Input
                id="regular_price"
                name="regular_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="our_cost">Our Cost (optional)</Label>
              <Input
                id="our_cost"
                name="our_cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sku">SKU (optional)</Label>
              <Input
                id="sku"
                name="sku"
                placeholder="SKU code"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stock_quantity">Stock Quantity (optional)</Label>
              <Input
                id="stock_quantity"
                name="stock_quantity"
                type="number"
                min="0"
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stock_status">Stock Status</Label>
              <Select name="stock_status" id="stock_status" defaultValue="instock">
                <option value="instock">In Stock</option>
                <option value="outofstock">Out of Stock</option>
                <option value="onbackorder">On Backorder</option>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="short_description">Short Description (optional)</Label>
              <Input
                id="short_description"
                name="short_description"
                placeholder="Brief product description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <textarea
                id="description"
                name="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Full product description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
