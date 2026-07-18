'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import {
  createProduct,
  Product,
  ProductInput,
  ProductStatus,
  updateProduct
} from '@/lib/store';

type ProductFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
};

const STATUSES: ProductStatus[] = ['active', 'draft', 'archived'];

export function ProductForm({ open, onOpenChange, product }: ProductFormProps) {
  const isEdit = Boolean(product);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('0.00');
  const [stock, setStock] = useState('0');
  const [status, setStatus] = useState<ProductStatus>('active');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (!open) return;
    if (product) {
      setName(product.name);
      setPrice(product.price);
      setStock(String(product.stock));
      setStatus(product.status);
      setImageUrl(product.imageUrl);
    } else {
      setName('');
      setPrice('0.00');
      setStock('0');
      setStatus('active');
      setImageUrl('');
    }
  }, [open, product]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const input: ProductInput = {
      name,
      price,
      stock: Number(stock),
      status,
      imageUrl: imageUrl || undefined
    };

    onOpenChange(false);
    if (isEdit && product) {
      updateProduct(product.id, input);
    } else {
      createProduct(input);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex h-full flex-col gap-6">
          <SheetHeader>
            <SheetTitle>{isEdit ? 'Edit product' : 'Add product'}</SheetTitle>
            <SheetDescription>
              {isEdit
                ? 'Update this product. Changes are saved to localStorage.'
                : 'Create a new product. It will persist in localStorage.'}
            </SheetDescription>
          </SheetHeader>
          <div className="grid flex-1 gap-4">
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Name</span>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Product name"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Price</span>
              <Input
                required
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Stock</span>
              <Input
                required
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Status</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
              >
                {STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Image URL (optional)</span>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </label>
          </div>
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? 'Save changes' : 'Create product'}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
