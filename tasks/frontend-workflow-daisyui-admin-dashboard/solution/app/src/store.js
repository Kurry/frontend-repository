import { signal, computed, effect } from '@preact/signals';
import { z } from 'zod';

export const ROLES = ['Admin', 'Manager', 'Member', 'Viewer'];
export const STATUSES = ['Active', 'Invited', 'Suspended'];
export const SEGMENTS = ['Internal', 'Partner', 'External'];
export const PERMISSIONS = ['users.read', 'users.write', 'billing.view', 'products.manage', 'settings.edit'];
export const SORTS = ['last-active', 'newest', 'highest-spend', 'name-az'];

const optionalText = (max, field) => z.string().trim().max(max, `${field} must be ${max} characters or fewer`).optional().or(z.literal(''));
const emailSchema = z.string().trim().refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 'email must include a domain dot');
const phoneSchema = z.string().trim().refine((value) => value === '' || /^\d{7,15}$/.test(value), 'phone must contain 7 to 15 digits').optional();

export const userCreateSchema = z.object({
  firstName: z.string().trim().min(1, 'firstName is required').max(40, 'firstName length must be 1 to 40 characters'),
  lastName: z.string().trim().min(1, 'lastName is required').max(40, 'lastName length must be 1 to 40 characters'),
  email: emailSchema,
  phone: phoneSchema,
  notes: optionalText(280, 'notes'),
  temporaryPassword: z.string().min(8, 'temporaryPassword must be at least 8 characters'),
  accountSegment: z.enum(SEGMENTS, { message: 'accountSegment must be Internal, Partner, or External' }),
  role: z.enum(ROLES, { message: 'role must be Admin, Manager, Member, or Viewer' }),
  status: z.enum(STATUSES, { message: 'status must be Active, Invited, or Suspended' }),
  sendInvitation: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
  productAccess: z.boolean().optional(),
  permissions: z.array(z.enum(PERMISSIONS, { message: 'permissions contains an unsupported id' })).optional()
});

export const userEditSchema = userCreateSchema.extend({
  temporaryPassword: z.string().refine((value) => !value || value.length >= 8, 'temporaryPassword must be at least 8 characters').optional()
});

export const bulkUpdateSchema = z.object({
  status: z.enum(STATUSES).optional(),
  role: z.enum(ROLES).optional()
}).refine((v) => v.status || v.role, { message: 'Choose a valid role or status' });

const exportUserSchema = z.object({
  firstName: z.string().trim().min(1, 'firstName is required').max(40, 'firstName length must be 1 to 40 characters'),
  lastName: z.string().trim().min(1, 'lastName is required').max(40, 'lastName length must be 1 to 40 characters'),
  email: emailSchema,
  phone: phoneSchema,
  notes: optionalText(280, 'notes'),
  temporaryPassword: z.string().min(8, 'temporaryPassword must be at least 8 characters').optional(),
  accountSegment: z.enum(SEGMENTS).optional(),
  role: z.enum(ROLES),
  status: z.enum(STATUSES),
  sendInvitation: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
  productAccess: z.boolean().optional(),
  permissions: z.array(z.enum(PERMISSIONS)).optional(),
  payments: z.number().min(0, 'payments cannot be negative'),
  products: z.number().int().min(0, 'products cannot be negative'),
  lastActive: z.string().min(1, 'lastActive is required')
}).passthrough();

const logSchema = z.object({
  id: z.string().min(1),
  timestamp: z.string().datetime(),
  action: z.string().min(1),
  target: z.string().min(1)
});

export const directorySchema = z.object({
  schemaVersion: z.literal('pineapple-directory-v1', { message: 'schemaVersion must be pineapple-directory-v1' }),
  exportedAt: z.string().datetime({ message: 'exportedAt must be an ISO-8601 timestamp' }),
  users: z.array(exportUserSchema),
  archive: z.array(exportUserSchema),
  activityLog: z.array(logSchema),
  kpis: z.object({
    total: z.number().int().min(0), active: z.number().int().min(0), paying: z.number().int().min(0), suspended: z.number().int().min(0)
  }),
  filters: z.object({ role: z.enum(ROLES).nullable(), status: z.enum(STATUSES).nullable() }),
  sort: z.enum(SORTS),
  theme: z.enum(['light', 'dark']),
  activeView: z.string().min(1)
}).superRefine((document, context) => {
  const expected = {
    total: document.users.length,
    active: document.users.filter((user) => user.status === 'Active').length,
    paying: document.users.filter((user) => user.payments > 0).length,
    suspended: document.users.filter((user) => user.status === 'Suspended').length
  };
  for (const key of Object.keys(expected)) {
    if (document.kpis[key] !== expected[key]) context.addIssue({ code: 'custom', path: ['kpis', key], message: `${key} must match the active users collection` });
  }
});

const seed = [
  ['Mina','Park','mina.park@northstar.co','Admin','Active',12840,8,'4 min ago','Internal'],
  ['Arman','Bell','arman.bell@aperture.dev','Manager','Active',8180,5,'18 min ago','Partner'],
  ['Nora','Quinn','nora.quinn@fieldnotes.io','Member','Invited',640,2,'1 hour ago','External'],
  ['Tessa','Cole','tessa.cole@lumen.studio','Viewer','Suspended',420,1,'3 hours ago','External'],
  ['Jonah','Reed','jonah.reed@atlasworks.com','Member','Active',6420,6,'Today, 09:42','Partner'],
  ['Sofia','Hart','sofia.hart@meridian.app','Manager','Active',9780,7,'Yesterday','Internal'],
  ['Eli','Warren','eli.warren@rivermill.io','Viewer','Invited',0,0,'2 days ago','External'],
  ['Priya','Shah','priya.shah@monument.co','Admin','Active',15420,12,'3 days ago','Internal'],
  ['Marcus','Lee','marcus.lee@hearth.net','Member','Active',2840,3,'4 days ago','Partner'],
  ['Dana','Brooks','dana.brooks@kindred.org','Viewer','Suspended',1100,1,'1 week ago','External'],
  ['Remy','Ford','remy.ford@paperlane.co','Member','Active',5200,4,'1 week ago','Partner'],
  ['Aisha','Grant','aisha.grant@orbitlabs.ai','Manager','Active',11300,9,'2 weeks ago','Internal']
].map((u, index) => ({
  id: `usr-${index + 1}`,
  firstName: u[0], lastName: u[1], email: u[2], phone: `415555${String(1200 + index)}`,
  notes: index % 3 === 0 ? 'Priority directory account.' : '',
  temporaryPassword: 'Seedpass!42', accountSegment: u[8], role: u[3], status: u[4],
  sendInvitation: u[4] === 'Invited', twoFactorEnabled: index % 2 === 0,
  productAccess: u[3] !== 'Viewer', permissions: u[3] === 'Admin' ? [...PERMISSIONS] : ['users.read'],
  payments: u[5], products: u[6], lastActive: u[7], createdAt: Date.now() - index * 86400000
}));

const initialLogs = [
  { id: 'log-4', timestamp: new Date(Date.now() - 18 * 60000).toISOString(), action: 'Role changed to Manager', target: 'arman.bell@aperture.dev' },
  { id: 'log-3', timestamp: new Date(Date.now() - 65 * 60000).toISOString(), action: 'Invitation sent', target: 'nora.quinn@fieldnotes.io' },
  { id: 'log-2', timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), action: 'Status changed to Suspended', target: 'tessa.cole@lumen.studio' },
  { id: 'log-1', timestamp: new Date(Date.now() - 86400000).toISOString(), action: 'Directory review completed', target: 'All users' }
];

export const users = signal(seed);
export const archive = signal([]);
export const activityLog = signal(initialLogs);
export const activeView = signal('operations-overview');
export const filters = signal({ role: null, status: null });
export const sort = signal('last-active');
export const selection = signal(new Set());
export const theme = signal('light');
effect(() => {
  if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme.value;
});
export const exportOpen = signal(false);
export const exportTab = signal('json');
export const importOpen = signal(false);
export const importMode = signal('directory-json');
export const importDraft = signal('');
export const importError = signal('');
export const commandOpen = signal(false);
export const commandQuery = signal('');
export const sidebarOpen = signal(false);
export const sidebarGroup = signal('Users');
export const accountMenuOpen = signal(false);
export const profileMenuOpen = signal(false);
export const notificationsOpen = signal(false);
export const editUserId = signal(null);
export const duplicateSourceId = signal(null);
export const formDraft = signal(null);
export const bulkDialog = signal(null);
export const page = signal(1);
export const toast = signal('');
export const exportedAt = signal(new Date().toISOString());
export const mutationVersion = signal(0);

export const kpis = computed(() => ({
  total: users.value.length,
  active: users.value.filter((u) => u.status === 'Active').length,
  paying: users.value.filter((u) => u.payments > 0).length,
  suspended: users.value.filter((u) => u.status === 'Suspended').length
}));

export const searchQuery = signal('');
export const visibleUsers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const f = filters.value;
  const rows = users.value.filter((u) => {
    const matchesSearch = !q || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q);
    return matchesSearch && (!f.role || u.role === f.role) && (!f.status || u.status === f.status);
  });
  return [...rows].sort((a, b) => {
    if (sort.value === 'name-az') return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    if (sort.value === 'highest-spend') return b.payments - a.payments;
    if (sort.value === 'newest') return b.createdAt - a.createdAt;
    return b.createdAt - a.createdAt;
  });
});

const cleanUserForExport = (user) => {
  const { id, createdAt, archivedAt, temporaryPassword, ...safe } = user;
  return safe;
};

export const directoryObject = computed(() => {
  mutationVersion.value;
  return {
    schemaVersion: 'pineapple-directory-v1',
    exportedAt: exportedAt.value,
    users: users.value.map(cleanUserForExport),
    archive: archive.value.map(cleanUserForExport),
    activityLog: activityLog.value,
    kpis: kpis.value,
    filters: filters.value,
    sort: sort.value,
    theme: theme.value,
    activeView: activeView.value
  };
});

export const jsonPreview = computed(() => JSON.stringify(directoryObject.value, null, 2));

const csvEscape = (value) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export const csvPreview = computed(() => {
  const header = 'firstName,lastName,email,phone,role,status,payments,products,lastActive';
  return [header, ...users.value.map((u) => [u.firstName,u.lastName,u.email,u.phone || '',u.role,u.status,u.payments,u.products,u.lastActive].map(csvEscape).join(','))].join('\n');
});

export function bump(message) {
  mutationVersion.value += 1;
  exportedAt.value = new Date().toISOString();
  syncUiAfterMutation();
  if (message) toast.value = message;
}

export function syncUiAfterMutation() {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme.value;
  }
}

export const lastMutationLabel = computed(() => {
  const entry = activityLog.value[0];
  return entry ? `${entry.action} · ${entry.target}` : '';
});

export function setView(view) {
  activeView.value = view;
  sidebarOpen.value = false;
  page.value = 1;
  bump();
}

export function setRoleFilter(role) {
  filters.value = { ...filters.value, role: role || null };
  page.value = 1;
  bump();
}

export function setStatusFilter(status) {
  filters.value = { ...filters.value, status: status || null };
  page.value = 1;
  bump();
}

export function clearFilters() {
  filters.value = { role: null, status: null };
  searchQuery.value = '';
  page.value = 1;
  bump();
}

export function setSort(next) {
  if (SORTS.includes(next)) { sort.value = next; page.value = 1; bump(); }
}

export function setTheme(next) {
  if (next === 'light' || next === 'dark') { theme.value = next; bump(`Theme changed to ${next}`); }
}

export function addLog(action, target) {
  activityLog.value = [{ id: `log-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, timestamp: new Date().toISOString(), action, target }, ...activityLog.value];
}

function assertPermissions(list) {
  if (list === undefined) return;
  const values = Array.isArray(list) ? list : [list];
  for (const perm of values) {
    if (!PERMISSIONS.includes(perm)) {
      throw new Error(`permissions contains an unsupported id: ${perm}`);
    }
  }
}

export function createUser(payload) {
  assertPermissions(payload.permissions);
  const parsed = userCreateSchema.parse(payload);
  if (users.value.some((u) => u.email.toLowerCase() === parsed.email.toLowerCase())) throw new Error('email already belongs to an active user');
  const record = {
    ...parsed,
    status: parsed.sendInvitation && !payload.status ? 'Invited' : parsed.status,
    id: `usr-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    payments: 0,
    products: parsed.productAccess ? 1 : 0,
    lastActive: parsed.status === 'Invited' ? 'Invitation pending' : 'Just now',
    createdAt: Date.now()
  };
  users.value = [record, ...users.value];
  addLog('User created', record.email);
  selection.value = new Set();
  duplicateSourceId.value = null;
  formDraft.value = null;
  bump(`${record.firstName} ${record.lastName} was created`);
  return record;
}

export function updateUser(id, payload) {
  const parsed = userEditSchema.parse(payload);
  const existing = users.value.find((u) => u.id === id);
  if (!existing) throw new Error('User not found');
  if (users.value.some((u) => u.id !== id && u.email.toLowerCase() === parsed.email.toLowerCase())) throw new Error('email already belongs to another active user');
  const next = { ...existing, ...parsed };
  if (!parsed.temporaryPassword) next.temporaryPassword = existing.temporaryPassword;
  users.value = users.value.map((u) => u.id === id ? next : u);
  if (existing.role !== next.role) addLog(`Role changed to ${next.role}`, next.email);
  if (existing.status !== next.status) addLog(`Status changed to ${next.status}`, next.email);
  if (existing.role === next.role && existing.status === next.status) addLog('User profile updated', next.email);
  bump(`${next.firstName} ${next.lastName} was updated`);
  return next;
}

export function archiveUsers(ids) {
  const idSet = new Set(ids);
  if (!idSet.size) return 0;
  const moving = users.value.filter((u) => idSet.has(u.id));
  if (!moving.length) return 0;
  users.value = users.value.filter((u) => !idSet.has(u.id));
  archive.value = [...moving.map((u) => ({ ...u, archivedAt: new Date().toISOString() })), ...archive.value];
  moving.forEach((u) => addLog('User archived', u.email));
  selection.value = new Set([...selection.value].filter((id) => !idSet.has(id)));
  bump(`${moving.length} ${moving.length === 1 ? 'user was' : 'users were'} archived`);
  return moving.length;
}

export function restoreUser(id) {
  const found = archive.value.find((u) => u.id === id);
  if (!found) return;
  const { archivedAt, ...restored } = found;
  users.value = [{ ...restored, lastActive: 'Restored just now', createdAt: Date.now() }, ...users.value];
  archive.value = archive.value.filter((u) => u.id !== id);
  addLog('User restored', restored.email);
  bump(`${restored.firstName} ${restored.lastName} was restored`);
}

export function bulkUpdate(ids, patch) {
  const parsed = bulkUpdateSchema.parse(patch);
  const idSet = new Set(ids);
  users.value = users.value.map((u) => idSet.has(u.id) ? { ...u, ...parsed } : u);
  users.value.filter((u) => idSet.has(u.id)).forEach((u) => {
    if (parsed.status) addLog(`Status changed to ${parsed.status}`, u.email);
    if (parsed.role) addLog(`Role changed to ${parsed.role}`, u.email);
  });
  bump(`${idSet.size} ${idSet.size === 1 ? 'user was' : 'users were'} updated`);
}

export function toggleSelection(id, checked) {
  const next = new Set(selection.value);
  checked ? next.add(id) : next.delete(id);
  selection.value = next;
}

function parseCsvLine(line) {
  const out = []; let current = ''; let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') { current += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { out.push(current); current = ''; }
    else current += char;
  }
  out.push(current);
  return out;
}

export function parseUsersCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error('payload must include a header and at least one user row');
  const expected = ['firstName','lastName','email','phone','role','status','payments','products','lastActive'];
  const header = parseCsvLine(lines[0]);
  if (header.join(',') !== expected.join(',')) throw new Error(`payload header must be ${expected.join(',')}`);
  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    if (values.length !== expected.length) throw new Error(`payload row ${index + 2} has ${values.length} fields; expected ${expected.length}`);
    const raw = Object.fromEntries(expected.map((key, i) => [key, values[i]]));
    const candidate = {
      ...raw,
      payments: Number(raw.payments), products: Number(raw.products),
      id: `usr-import-${Date.now()}-${index}`,
      accountSegment: 'External', sendInvitation: raw.status === 'Invited',
      twoFactorEnabled: false, productAccess: Number(raw.products) > 0,
      permissions: ['users.read'], createdAt: Date.now() - index
    };
    return exportUserSchema.parse(candidate);
  }).map((u, index) => ({ ...u, id: `usr-import-${Date.now()}-${index}`, createdAt: Date.now() - index }));
}

export function importDirectory(text, mode) {
  importError.value = '';
  try {
    if (mode === 'directory-json') {
      let raw;
      try { raw = JSON.parse(text); } catch { throw new Error('payload is not valid JSON'); }
      const parsed = directorySchema.parse(raw);
      users.value = parsed.users.map((u, i) => ({ ...u, id: `usr-json-${Date.now()}-${i}`, createdAt: Date.now() - i }));
      archive.value = parsed.archive.map((u, i) => ({ ...u, id: `arc-json-${Date.now()}-${i}`, createdAt: Date.now() - i }));
      activityLog.value = parsed.activityLog;
      filters.value = parsed.filters;
      sort.value = parsed.sort;
      theme.value = parsed.theme;
      activeView.value = parsed.activeView;
      exportedAt.value = parsed.exportedAt;
    } else {
      users.value = parseUsersCsv(text);
      selection.value = new Set();
      addLog('Users CSV imported', `${users.value.length} users`);
    }
    mutationVersion.value += 1;
    importOpen.value = false;
    toast.value = mode === 'directory-json' ? 'Directory JSON was imported' : `${users.value.length} users were imported from CSV`;
    return true;
  } catch (error) {
    const issue = error?.issues?.[0];
    const field = issue?.path?.length ? issue.path.join('.') : 'payload';
    importError.value = `${field}: ${issue?.message || error.message || 'invalid import'}`;
    return false;
  }
}

export function openExport(format = 'json') {
  exportTab.value = format;
  exportOpen.value = true;
  exportedAt.value = new Date().toISOString();
  mutationVersion.value += 1;
}

export function resetTransientMenus() {
  accountMenuOpen.value = false;
  profileMenuOpen.value = false;
  notificationsOpen.value = false;
}
