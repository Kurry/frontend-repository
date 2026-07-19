// Generate dates going back from today
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Website Analytics - 90 days of daily data
const rng1 = seededRandom(42);
export const websiteAnalytics = Array.from({ length: 90 }, (_, i) => {
  const dayIndex = 89 - i;
  const baseViews = 1200 + Math.floor(rng1() * 800);
  const weekendFactor = [0, 6].includes(new Date(daysAgo(dayIndex)).getDay()) ? 0.6 : 1;
  return {
    date: daysAgo(dayIndex),
    pageViews: Math.floor(baseViews * weekendFactor * (1 + rng1() * 0.3)),
    sessions: Math.floor(baseViews * weekendFactor * 0.7 * (1 + rng1() * 0.2)),
    bounceRatePct: Math.round((35 + rng1() * 25) * 10) / 10,
  };
});

// Sales Sheet - 60 order rows
const products = [
  { name: 'Pro Laptop', category: 'Hardware' },
  { name: 'Wireless Mouse', category: 'Hardware' },
  { name: 'USB-C Hub', category: 'Hardware' },
  { name: 'Mechanical Keyboard', category: 'Hardware' },
  { name: '4K Monitor', category: 'Hardware' },
  { name: 'Cloud Suite Pro', category: 'Software' },
  { name: 'Analytics Dashboard', category: 'Software' },
  { name: 'Security Shield', category: 'Software' },
  { name: 'API Gateway', category: 'Software' },
  { name: 'Task Manager App', category: 'Software' },
  { name: 'Setup Consulting', category: 'Services' },
  { name: 'Training Package', category: 'Services' },
  { name: 'Priority Support', category: 'Services' },
  { name: 'Custom Integration', category: 'Services' },
  { name: 'Data Migration', category: 'Services' },
];

const rng2 = seededRandom(123);
export const salesSheet = Array.from({ length: 60 }, (_, i) => {
  const product = products[Math.floor(rng2() * products.length)];
  const units = 1 + Math.floor(rng2() * 20);
  const priceMap: Record<string, number> = {
    'Pro Laptop': 1299, 'Wireless Mouse': 49, 'USB-C Hub': 79, 'Mechanical Keyboard': 149, '4K Monitor': 599,
    'Cloud Suite Pro': 199, 'Analytics Dashboard': 99, 'Security Shield': 149, 'API Gateway': 299, 'Task Manager App': 49,
    'Setup Consulting': 500, 'Training Package': 300, 'Priority Support': 150, 'Custom Integration': 800, 'Data Migration': 400,
  };
  return {
    orderId: `ORD-${String(i + 1).padStart(4, '0')}`,
    product: product.name,
    category: product.category as 'Hardware' | 'Software' | 'Services',
    unitsSold: units,
    revenue: units * priceMap[product.name]!,
    orderDate: daysAgo(1 + Math.floor(rng2() * 84)),
  };
});

// Support Tickets - 50 rows
const ticketCategories = ['Billing', 'Bug', 'Feature Request', 'Account'];
const ticketStatuses = ['Open', 'In Progress', 'Resolved'];

const rng3 = seededRandom(789);
export const supportTickets = Array.from({ length: 50 }, (_, i) => {
  const category = ticketCategories[Math.floor(rng3() * ticketCategories.length)]!;
  const status = ticketStatuses[Math.floor(rng3() * ticketStatuses.length)]!;
  const row: Record<string, string | number | undefined> = {
    ticketId: `TKT-${String(i + 1).padStart(4, '0')}`,
    category,
    status,
    createdDate: daysAgo(Math.floor(rng3() * 80)),
  };
  if (status === 'Resolved') {
    row.resolutionHours = Math.round((2 + rng3() * 70) * 10) / 10;
  }
  return row;
});

export interface DataSource {
  id: string;
  name: string;
  description: string;
  rows: Record<string, any>[];
  columns: string[];
  numericColumns: string[];
  dateColumn?: string;
  categoryColumn?: string;
}

export const dataSources: DataSource[] = [
  {
    id: 'website-analytics',
    name: 'Website Analytics',
    description: 'Daily website traffic and engagement metrics',
    rows: websiteAnalytics,
    columns: ['date', 'pageViews', 'sessions', 'bounceRatePct'],
    numericColumns: ['pageViews', 'sessions', 'bounceRatePct'],
    dateColumn: 'date',
  },
  {
    id: 'sales-sheet',
    name: 'Sales Sheet',
    description: 'Product sales orders with revenue data',
    rows: salesSheet,
    columns: ['orderId', 'product', 'category', 'unitsSold', 'revenue', 'orderDate'],
    numericColumns: ['unitsSold', 'revenue'],
    dateColumn: 'orderDate',
    categoryColumn: 'category',
  },
  {
    id: 'support-tickets',
    name: 'Support Tickets',
    description: 'Customer support ticket records',
    rows: supportTickets,
    columns: ['ticketId', 'category', 'status', 'createdDate', 'resolutionHours'],
    numericColumns: ['resolutionHours'],
    dateColumn: 'createdDate',
    categoryColumn: 'category',
  },
];

export function getDataSourceById(id: string): DataSource | undefined {
  return dataSources.find(ds => ds.id === id);
}
