'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { File, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductsTable } from './products-table';
import { ProductForm } from './product-form';
import {
  exportProductsJson,
  listProducts,
  Product,
  ProductStatus,
  useStore
} from '@/lib/store';

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const store = useStore();
  const search = searchParams.get('q') ?? '';
  const offset = Number(searchParams.get('offset') ?? '0') || 0;
  const [tab, setTab] = useState<'all' | ProductStatus>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const { products, totalProducts, pageSize } = useMemo(
    () =>
      listProducts(store.products, {
        search,
        status: tab,
        offset
      }),
    [store.products, search, tab, offset]
  );

  if (!ready) {
    return (
      <div className="text-sm text-muted-foreground">Loading products…</div>
    );
  }

  function handleExport() {
    const blob = new Blob([exportProductsJson(store.products)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'products.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function handleEdit(product: Product) {
    setEditing(product);
    setFormOpen(true);
  }

  return (
    <>
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as 'all' | ProductStatus)}
      >
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="archived" className="hidden sm:flex">
              Archived
            </TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1"
              type="button"
              onClick={handleExport}
            >
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Export
              </span>
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1"
              type="button"
              onClick={handleAdd}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Product
              </span>
            </Button>
          </div>
        </div>
        <TabsContent value={tab}>
          <ProductsTable
            products={products}
            offset={offset}
            totalProducts={totalProducts}
            pageSize={pageSize}
            onEdit={handleEdit}
          />
        </TabsContent>
      </Tabs>
      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
      />
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading products…</div>}>
      <ProductsPageContent />
    </Suspense>
  );
}
