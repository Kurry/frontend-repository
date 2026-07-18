'use client';

import { useSyncExternalStore } from 'react';
import seed from '@/data/seed.json';

export type ProductStatus = 'active' | 'draft' | 'archived';

export type Product = {
  id: number;
  imageUrl: string;
  name: string;
  status: ProductStatus;
  price: string;
  stock: number;
  availableAt: string;
};

export type Customer = {
  id: number;
  name: string;
  email: string;
  orders: number;
  totalSpent: string;
  status: 'active' | 'inactive';
  joinedAt: string;
};

export type ProductInput = Omit<Product, 'id' | 'availableAt' | 'imageUrl'> & {
  imageUrl?: string;
  availableAt?: string;
};

type StoreData = {
  products: Product[];
  customers: Customer[];
  nextProductId: number;
  nextCustomerId: number;
};

const STORAGE_KEY = 'next-admin-dashboard-v1';
const PAGE_SIZE = 5;
const DEFAULT_IMAGE =
  'https://uwja77bygk2kgfqe.public.blob.vercel-storage.com/smartphone-gaPvyZW6aww0IhD3dOpaU6gBGILtcJ.webp';

const listeners = new Set<() => void>();
let cache: StoreData | null = null;
let serverSnapshot: StoreData | null = null;

function createSeedData(): StoreData {
  const products = seed.products as Product[];
  const customers = seed.customers as Customer[];
  return {
    products: products.map((p) => ({ ...p })),
    customers: customers.map((c) => ({ ...c })),
    nextProductId: Math.max(0, ...products.map((p) => p.id)) + 1,
    nextCustomerId: Math.max(0, ...customers.map((c) => c.id)) + 1
  };
}

function ensureCache(): StoreData {
  if (cache) return cache;

  if (typeof window === 'undefined') {
    if (!serverSnapshot) serverSnapshot = createSeedData();
    return serverSnapshot;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cache = createSeedData();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
      return cache;
    }
    cache = JSON.parse(raw) as StoreData;
    return cache;
  } catch {
    cache = createSeedData();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    return cache;
  }
}

function persist(data: StoreData) {
  cache = data;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  listeners.forEach((listener) => listener());
}

function update(mutator: (data: StoreData) => void) {
  const current = ensureCache();
  const next: StoreData = {
    products: [...current.products],
    customers: [...current.customers],
    nextProductId: current.nextProductId,
    nextCustomerId: current.nextCustomerId
  };
  mutator(next);
  persist(next);
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): StoreData {
  return ensureCache();
}

export function getServerSnapshot(): StoreData {
  if (!serverSnapshot) serverSnapshot = createSeedData();
  return serverSnapshot;
}

export function useStore(): StoreData {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function listProducts(
  products: Product[],
  options: {
    search?: string;
    status?: ProductStatus | 'all';
    offset?: number;
    pageSize?: number;
  } = {}
): {
  products: Product[];
  offset: number;
  nextOffset: number | null;
  totalProducts: number;
  pageSize: number;
} {
  const search = options.search?.trim().toLowerCase() ?? '';
  const status = options.status ?? 'all';
  const pageSize = options.pageSize ?? PAGE_SIZE;
  const offset = options.offset ?? 0;

  let filtered = products;
  if (search) {
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(search));
  }
  if (status !== 'all') {
    filtered = filtered.filter((p) => p.status === status);
  }

  const totalProducts = filtered.length;
  const page = filtered.slice(offset, offset + pageSize);
  const nextOffset = offset + pageSize < totalProducts ? offset + pageSize : null;

  return {
    products: page,
    offset,
    nextOffset,
    totalProducts,
    pageSize
  };
}

export function createProduct(input: ProductInput): Product {
  let created!: Product;
  update((data) => {
    created = {
      id: data.nextProductId++,
      imageUrl: input.imageUrl?.trim() || DEFAULT_IMAGE,
      name: input.name.trim(),
      status: input.status,
      price: Number(input.price).toFixed(2),
      stock: Number(input.stock) || 0,
      availableAt: input.availableAt || new Date().toISOString().slice(0, 10)
    };
    data.products.unshift(created);
  });
  return created;
}

export function updateProduct(id: number, input: ProductInput): Product | null {
  let updated: Product | null = null;
  update((data) => {
    const index = data.products.findIndex((p) => p.id === id);
    if (index === -1) return;
    updated = {
      ...data.products[index],
      imageUrl: input.imageUrl?.trim() || data.products[index].imageUrl,
      name: input.name.trim(),
      status: input.status,
      price: Number(input.price).toFixed(2),
      stock: Number(input.stock) || 0,
      availableAt: input.availableAt || data.products[index].availableAt
    };
    data.products[index] = updated;
  });
  return updated;
}

export function deleteProduct(id: number): boolean {
  let removed = false;
  update((data) => {
    const before = data.products.length;
    data.products = data.products.filter((p) => p.id !== id);
    removed = data.products.length !== before;
  });
  return removed;
}

export function deleteCustomer(id: number): boolean {
  let removed = false;
  update((data) => {
    const before = data.customers.length;
    data.customers = data.customers.filter((c) => c.id !== id);
    removed = data.customers.length !== before;
  });
  return removed;
}

export function exportProductsJson(products: Product[]): string {
  return JSON.stringify(products, null, 2);
}

export { PAGE_SIZE };
