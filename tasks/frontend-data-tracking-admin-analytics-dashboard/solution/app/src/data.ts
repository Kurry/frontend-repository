import { z } from 'zod';

export type Role = 'Admin' | 'Manager' | 'Member' | 'Viewer';
export type Status = 'Active' | 'Invited' | 'Suspended';
export const ROLES: Role[] = ['Admin', 'Manager', 'Member', 'Viewer'];
export const STATUSES: Status[] = ['Active', 'Invited', 'Suspended'];
export const SEGMENTS = ['Internal', 'Partner', 'External'] as const;
export const SCHEMA_VERSION = 'pineapple-admin-analytics-v1';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  notes?: string;
  role: Role;
  status: Status;
  payments: number;
  products: number;
  lastActive: string;
  avatar: number; // 1..6
}

export type SortKey = 'last-active' | 'newest' | 'highest-spend' | 'name-az';

const av = (i: number) => ((i - 1) % 6) + 1;
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

export const SEED_USERS: User[] = [
  { id: 'u1', firstName: 'Ada', lastName: 'Lovelace', email: 'ada.lovelace@pineapple.io', phone: '4155550101', notes: 'Founding analyst', role: 'Admin', status: 'Active', payments: 18400, products: 9, lastActive: daysAgo(0), avatar: av(1) },
  { id: 'u2', firstName: 'Grace', lastName: 'Hopper', email: 'grace.hopper@pineapple.io', phone: '4155550102', role: 'Manager', status: 'Active', payments: 12250, products: 6, lastActive: daysAgo(1), avatar: av(2) },
  { id: 'u3', firstName: 'Alan', lastName: 'Turing', email: 'alan.turing@pineapple.io', role: 'Member', status: 'Suspended', payments: 0, products: 0, lastActive: daysAgo(40), avatar: av(3) },
  { id: 'u4', firstName: 'Katherine', lastName: 'Johnson', email: 'katherine.johnson@pineapple.io', phone: '4155550104', role: 'Manager', status: 'Active', payments: 9620, products: 5, lastActive: daysAgo(2), avatar: av(4) },
  { id: 'u5', firstName: 'Linus', lastName: 'Torvalds', email: 'linus.torvalds@pineapple.io', role: 'Member', status: 'Invited', payments: 0, products: 0, lastActive: daysAgo(8), avatar: av(5) },
  { id: 'u6', firstName: 'Margaret', lastName: 'Hamilton', email: 'margaret.hamilton@pineapple.io', phone: '4155550106', role: 'Admin', status: 'Active', payments: 15300, products: 7, lastActive: daysAgo(3), avatar: av(6) },
  { id: 'u7', firstName: 'Barbara', lastName: 'Liskov', email: 'barbara.liskov@pineapple.io', role: 'Viewer', status: 'Active', payments: 210, products: 1, lastActive: daysAgo(5), avatar: av(1) },
  { id: 'u8', firstName: 'Donald', lastName: 'Knuth', email: 'donald.knuth@pineapple.io', role: 'Member', status: 'Suspended', payments: 60, products: 1, lastActive: daysAgo(21), avatar: av(2) },
  { id: 'u9', firstName: 'Hedy', lastName: 'Lamarr', email: 'hedy.lamarr@pineapple.io', phone: '4155550109', role: 'Viewer', status: 'Active', payments: 430, products: 2, lastActive: daysAgo(6), avatar: av(3) },
  { id: 'u10', firstName: 'Tim', lastName: 'Berners-Lee', email: 'tim.berners-lee@pineapple.io', role: 'Member', status: 'Invited', payments: 0, products: 0, lastActive: daysAgo(12), avatar: av(4) },
];

// --------------------------------------------------------------- schemas
export const userCreateSchema = z.object({
  firstName: z.string().trim().min(1, 'firstName is required').max(40, 'firstName must be 40 characters or fewer'),
  lastName: z.string().trim().min(1, 'lastName is required').max(40, 'lastName must be 40 characters or fewer'),
  email: z.string().trim().min(1, 'email is required').refine(
    (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'email must contain @ and a domain dot'),
  phone: z.string().trim().refine((v) => v === '' || /^\d{7,15}$/.test(v), 'phone must be 7 to 15 digits').optional().or(z.literal('')),
  notes: z.string().trim().max(280, 'notes must be 280 characters or fewer').optional().or(z.literal('')),
  temporaryPassword: z.string().min(8, 'temporaryPassword must be at least 8 characters'),
  accountSegment: z.enum(['Internal', 'Partner', 'External']),
  status: z.enum(['Active', 'Invited', 'Suspended']),
  role: z.enum(['Admin', 'Manager', 'Member', 'Viewer']),
  sendInvitation: z.boolean().optional(),
  enable2FA: z.boolean().optional(),
  productAccess: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
});
export type UserCreateValues = z.infer<typeof userCreateSchema>;

export const userEditSchema = userCreateSchema.extend({
  temporaryPassword: z.union([
    z.literal(''),
    z.string().min(8, 'temporaryPassword must be at least 8 characters'),
  ]),
});
export type UserEditValues = z.infer<typeof userEditSchema>;

export function filterUsersForKpis(users: User[], role: string, status: string): User[] {
  let r = users;
  if (role) r = r.filter((u) => u.role === role);
  if (status) r = r.filter((u) => u.status === status);
  return r;
}

// --------------------------------------------------------------- derived
export interface Kpis { total: number; active: number; paying: number; suspended: number; }
export function computeKpis(users: User[]): Kpis {
  return {
    total: users.length,
    active: users.filter((u) => u.status === 'Active').length,
    paying: users.filter((u) => u.payments > 0).length,
    suspended: users.filter((u) => u.status === 'Suspended').length,
  };
}

export function sortUsers(users: User[], key: SortKey): User[] {
  const a = [...users];
  if (key === 'name-az') return a.sort((x, y) => x.firstName.localeCompare(y.firstName) || x.lastName.localeCompare(y.lastName));
  if (key === 'highest-spend') return a.sort((x, y) => y.payments - x.payments);
  if (key === 'newest') return a.sort((x, y) => +new Date(y.lastActive) - +new Date(x.lastActive));
  return a.sort((x, y) => +new Date(y.lastActive) - +new Date(x.lastActive));
}

const csvField = (v: unknown): string => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const parseCsvField = (s: string): string => {
  if (s.length >= 2 && s[0] === '"' && s[s.length - 1] === '"') return s.slice(1, -1).replace(/""/g, '"');
  return s;
};
// split a CSV line respecting quoted fields
const splitCsvLine = (line: string): string[] => {
  const out: string[] = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else { if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c; }
  }
  out.push(cur); return out;
};

export const CSV_HEADER = 'firstName,lastName,email,phone,role,status,payments,products,lastActive';
export const CSV_COLS = CSV_HEADER.split(',');

export function buildCsv(users: User[]): string {
  const rows = users.map((u) => CSV_COLS.map((c) => csvField((u as any)[c])).join(','));
  return [CSV_HEADER, ...rows].join('\n');
}

export interface SessionDoc {
  schemaVersion: string;
  exportedAt: string;
  kpis: Kpis;
  filters: { role: Role | null; status: Status | null };
  sort: SortKey;
  theme: 'light' | 'dark';
  activeView: string;
  users: any[];
}

export function buildSession(users: User[], ctx: {
  role: string; status: string; sort: SortKey; theme: 'light' | 'dark'; activeView: string;
}): SessionDoc {
  const kpiUsers = filterUsersForKpis(users, ctx.role, ctx.status);
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    kpis: computeKpis(kpiUsers),
    filters: {
      role: (ctx.role && ROLES.includes(ctx.role as Role)) ? (ctx.role as Role) : null,
      status: (ctx.status && STATUSES.includes(ctx.status as Status)) ? (ctx.status as Status) : null,
    },
    sort: ctx.sort,
    theme: ctx.theme,
    activeView: ctx.activeView,
    users: users.map((u) => ({
      firstName: u.firstName, lastName: u.lastName, email: u.email,
      phone: u.phone ?? '', role: u.role, status: u.status,
      payments: u.payments, products: u.products, lastActive: u.lastActive,
      ...(u.notes ? { notes: u.notes } : {}),
    })),
  };
}

// --------------------------------------------------------------- import validation
export type ImportErr = { ok: false; message: string } | { ok: true; users: User[]; applied?: Partial<{ role: string; status: string; sort: SortKey; theme: 'light' | 'dark'; activeView: string }> };

function validUserRow(r: any, idx: number, requirePassword: boolean): string | null {
  const f = (k: string) => (r[k] == null ? '' : String(r[k]).trim());
  const fn = f('firstName'), ln = f('lastName'), em = f('email');
  if (!fn) return `row ${idx}: firstName is required`;
  if (fn.length > 40) return `row ${idx}: firstName exceeds 40 characters`;
  if (!ln) return `row ${idx}: lastName is required`;
  if (ln.length > 40) return `row ${idx}: lastName exceeds 40 characters`;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return `row ${idx}: email must contain a domain dot`;
  const ph = f('phone');
  if (ph && !/^\d{7,15}$/.test(ph)) return `row ${idx}: phone must be 7 to 15 digits`;
  const notes = f('notes');
  if (notes.length > 280) return `row ${idx}: notes exceeds 280 characters`;
  if (!ROLES.includes(r.role)) return `row ${idx}: role must be one of ${ROLES.join(', ')}`;
  if (!STATUSES.includes(r.status)) return `row ${idx}: status must be one of ${STATUSES.join(', ')}`;
  const payments = Number(r.payments); const products = Number(r.products);
  if (!Number.isFinite(payments) || payments < 0) return `row ${idx}: payments must be a non-negative number`;
  if (!Number.isFinite(products) || products < 0 || !Number.isInteger(products)) return `row ${idx}: products must be a non-negative integer`;
  if (!f('lastActive')) return `row ${idx}: lastActive is required`;
  if (requirePassword) {
    const tp = f('temporaryPassword');
    if (tp && tp.length < 8) return `row ${idx}: temporaryPassword must be at least 8 characters`;
  }
  return null;
}

export function importSessionJson(text: string): ImportErr {
  let doc: any;
  try { doc = JSON.parse(text); } catch { return { ok: false, message: 'payload is not valid JSON' }; }
  if (!doc || typeof doc !== 'object') return { ok: false, message: 'payload must be a JSON object' };
  if (doc.schemaVersion !== SCHEMA_VERSION) return { ok: false, message: `schemaVersion must be exactly ${SCHEMA_VERSION}` };
  if (!Array.isArray(doc.users)) return { ok: false, message: 'users must be an array' };
  const k = doc.kpis;
  if (k && ['total', 'active', 'paying', 'suspended'].some((x) => k[x] != null && (Number(k[x]) < 0 || !Number.isFinite(Number(k[x])))))
    return { ok: false, message: 'kpis contain a negative or non-numeric figure' };
  const out: User[] = [];
  for (let i = 0; i < doc.users.length; i++) {
    const err = validUserRow(doc.users[i], i + 1, false);
    if (err) return { ok: false, message: err };
    const r = doc.users[i];
    out.push({
      id: r.id || `imp-${i}-${Date.now()}`,
      firstName: String(r.firstName).trim(), lastName: String(r.lastName).trim(), email: String(r.email).trim(),
      phone: r.phone ? String(r.phone) : undefined, notes: r.notes ? String(r.notes) : undefined,
      role: r.role, status: r.status, payments: Number(r.payments), products: Number(r.products),
      lastActive: String(r.lastActive), avatar: av(i + 1),
    });
  }
  return { ok: true, users: out, applied: {
    role: doc.filters?.role ?? '', status: doc.filters?.status ?? '',
    sort: (['last-active', 'newest', 'highest-spend', 'name-az'].includes(doc.sort) ? doc.sort : 'newest') as SortKey,
    theme: doc.theme === 'light' ? 'light' : 'dark', activeView: doc.activeView || 'operations-overview',
  } };
}

export function importUsersCsv(text: string): ImportErr {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim() !== '');
  if (lines.length === 0) return { ok: false, message: 'CSV is empty' };
  const header = splitCsvLine(lines[0]).map((h) => h.trim());
  const need = ['firstName', 'lastName', 'email', 'role', 'status'];
  const missing = need.find((n) => !header.includes(n));
  if (missing) return { ok: false, message: `CSV header missing required column: ${missing}` };
  const out: User[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = splitCsvLine(lines[i]).map(parseCsvField);
    const obj: any = {};
    header.forEach((h, j) => { obj[h] = vals[j] ?? ''; });
    const err = validUserRow(obj, i, false);
    if (err) return { ok: false, message: err };
    out.push({
      id: obj.id || `csv-${i}-${Date.now()}`,
      firstName: String(obj.firstName).trim(), lastName: String(obj.lastName).trim(), email: String(obj.email).trim(),
      phone: obj.phone ? String(obj.phone) : undefined, notes: obj.notes ? String(obj.notes) : undefined,
      role: obj.role, status: obj.status,
      payments: Number(obj.payments) || 0, products: Number(obj.products) || 0,
      lastActive: obj.lastActive ? String(obj.lastActive) : new Date().toISOString(), avatar: av(i),
    });
  }
  return { ok: true, users: out };
}

export function nextId(): string { return `u-${Date.now()}-${Math.floor(Math.random() * 1e4)}`; }

export function makeUserFromCreate(v: UserCreateValues): User {
  return {
    id: nextId(),
    firstName: v.firstName.trim(), lastName: v.lastName.trim(), email: v.email.trim(),
    phone: v.phone && v.phone.trim() ? v.phone.trim() : undefined,
    notes: v.notes && v.notes.trim() ? v.notes.trim() : undefined,
    role: v.role, status: v.status, payments: 0, products: 0,
    lastActive: new Date().toISOString(), avatar: av(Math.floor(Math.random() * 6) + 1),
  };
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - +new Date(iso); const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24); return `${d}d ago`;
}

// --------------------------------------------------------------- overview seed
export const OV = {
  revenue: [38, 41, 39, 46, 44, 52, 49, 58, 61, 57, 66, 72, 69, 78, 84, 81, 92, 99],
  revenueLabels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12', 'W13', 'W14', 'W15', 'W16', 'W17', 'W18'],
  orderStatus: [{ label: 'Delivered', value: 5492, color: 'var(--c-teal)' }, { label: 'In Progress', value: 1820, color: 'var(--c-orange)' }, { label: 'Refunded', value: 610, color: 'var(--c-orange-300, #f0a060)' }, { label: 'Blocked', value: 320, color: 'var(--c-rose)' }],
  acquisition: [{ label: 'Organic', value: 42, color: 'var(--c-teal)' }, { label: 'Direct', value: 26, color: 'var(--c-sky)' }, { label: 'Email', value: 18, color: 'var(--c-amber)' }, { label: 'Referral', value: 14, color: 'var(--c-rose)' }],
  marketing: [22, 28, 26, 34, 31, 40, 38, 47, 44, 53, 58, 64],
  fulfillment: [40, 44, 42, 50, 55, 52, 60, 58, 66, 70, 74, 80],
  uptimeStore: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  uptimeApi: [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
};
