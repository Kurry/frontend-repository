import * as store from './store.js';

const FORM_FIELD_MAP = {
  'first-name': 'firstName',
  'first_name': 'firstName',
  'last-name': 'lastName',
  'last_name': 'lastName',
  'temporary-password': 'temporaryPassword',
  'account-segment': 'accountSegment',
  email: 'email',
  phone: 'phone',
  role: 'role',
  status: 'status',
  notes: 'notes',
  'send-invitation': 'sendInvitation',
  'two-factor-enabled': 'twoFactorEnabled',
  'product-access': 'productAccess',
  permissions: 'permissions'
};

export function normalizeFormFields(input = {}) {
  const raw = input.fields && typeof input.fields === 'object' ? input.fields : input;
  const out = {};
  if (raw.name) {
    const parts = raw.name.trim().split(/\s+/).filter(Boolean);
    if (parts[0] && !raw['first-name'] && !raw.firstName) raw.firstName = parts[0];
    if (parts.length > 1 && !raw['last-name'] && !raw.lastName) raw.lastName = parts.slice(1).join(' ');
  }
  for (const [key, value] of Object.entries(raw)) {
    const mapped = FORM_FIELD_MAP[key] || key;
    out[mapped] = value;
  }
  if (typeof out.sendInvitation === 'string') out.sendInvitation = out.sendInvitation === 'true';
  if (typeof out.twoFactorEnabled === 'string') out.twoFactorEnabled = out.twoFactorEnabled === 'true';
  if (typeof out.productAccess === 'string') out.productAccess = out.productAccess === 'true';
  if (typeof out.permissions === 'string') {
    out.permissions = out.permissions.split(',').map((p) => p.trim()).filter(Boolean);
  }
  return out;
}

export function normalizeEntityFields(input = {}) {
  const raw = input.fields && typeof input.fields === 'object' ? input.fields : input;
  const name = raw.name?.trim() || '';
  const parts = name.split(/\s+/).filter(Boolean);
  const firstName = raw['first-name'] || raw.firstName || parts[0] || '';
  const lastName = raw['last-name'] || raw.lastName || parts.slice(1).join(' ') || (firstName ? 'User' : '');
  const payload = {
    firstName,
    lastName,
    email: raw.email,
    phone: raw.phone,
    notes: raw.notes,
    temporaryPassword: raw['temporary-password'] || raw.temporaryPassword,
    accountSegment: raw['account-segment'] || raw.accountSegment,
    role: raw.role,
    status: raw.status,
    sendInvitation: false,
    twoFactorEnabled: false,
    productAccess: true,
    permissions: ['users.read']
  };
  if (raw.permissions) {
    const list = Array.isArray(raw.permissions)
      ? raw.permissions
      : String(raw.permissions).split(',').map((p) => p.trim()).filter(Boolean);
    for (const perm of list) {
      if (!store.PERMISSIONS.includes(perm)) {
        throw new Error(`permissions contains an unsupported id: ${perm}`);
      }
    }
    payload.permissions = list;
  }
  return payload;
}

export function registerWebMcp() {
  if (window.__pineappleWebMcpRegistered) return;
  window.__pineappleWebMcpRegistered = true;

  const registry = new Map();
  const destinations = [
    'operations-overview', 'all-users', 'add-user', 'roles', 'permissions',
    'user-logs', 'user-stats', 'user-payments', 'user-products', 'archive-vault', 'export-drawer'
  ];

  window.webmcp_session_info = () => ({
    contract_version: 'zto-webmcp-v1',
    modules: ['browse-query-v1', 'entity-collection-v1', 'form-workflow-v1', 'artifact-transfer-v1'],
    toolNames: [...registry.keys()]
  });

  window.webmcp_list_tools = () => [...registry.values()].map(({ name, description, inputSchema }) => ({
    name,
    description,
    inputSchema
  }));

  const settleVisibleUi = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  window.webmcp_invoke_tool = async (nameOrRequest, args = {}) => {
    const name = typeof nameOrRequest === 'object' ? nameOrRequest.name : nameOrRequest;
    const input = typeof nameOrRequest === 'object' ? (nameOrRequest.arguments || {}) : args;
    const tool = registry.get(name);
    if (!tool) throw new Error(`Unknown WebMCP tool: ${name}`);
    const result = await tool.handler(input);
    store.syncUiAfterMutation();
    await settleVisibleUi();
    return result;
  };

  const register = (name, description, inputSchema, handler) => {
    registry.set(name, { name, description, inputSchema, handler });
  };

  register(
    'browse_open',
    'Open a declared Pineapple directory destination.',
    { type: 'object', properties: { destination: { type: 'string', enum: destinations } }, required: ['destination'], additionalProperties: false },
    ({ destination }) => {
      if (destination === 'export-drawer') store.openExport('json');
      else store.setView(destination);
      return { destination, visible: true, activeView: store.activeView.value };
    }
  );

  register(
    'browse_search',
    'Search active users by name or email.',
    { type: 'object', properties: { query: { type: 'string', maxLength: 100 } }, required: ['query'], additionalProperties: false },
    ({ query }) => {
      store.searchQuery.value = query;
      store.filters.value = { role: null, status: null };
      store.setView('all-users');
      return { matching: store.visibleUsers.value.length };
    }
  );

  register(
    'browse_apply_filter',
    'Apply a closed role or status filter.',
    {
      type: 'object',
      properties: {
        filter: { type: 'string', enum: ['role', 'status'] },
        value: { type: 'string', enum: [...store.ROLES, ...store.STATUSES] }
      },
      required: ['filter', 'value'],
      additionalProperties: false
    },
    ({ filter, value }) => {
      if (filter === 'role') store.setRoleFilter(value);
      else store.setStatusFilter(value);
      store.setView('all-users');
      return {
        filter,
        value,
        matching: store.visibleUsers.value.length,
        roleFilter: store.filters.value.role,
        statusFilter: store.filters.value.status
      };
    }
  );

  register(
    'browse_clear_filter',
    'Clear user role, status, and search filters.',
    { type: 'object', properties: {}, additionalProperties: false },
    () => {
      store.clearFilters();
      return { matching: store.users.value.length };
    }
  );

  register(
    'browse_sort',
    'Sort users with a declared order.',
    { type: 'object', properties: { sort: { type: 'string', enum: store.SORTS } }, required: ['sort'], additionalProperties: false },
    ({ sort }) => {
      store.setSort(sort);
      store.setView('all-users');
      return { sort: store.sort.value };
    }
  );

  register(
    'browse_set_theme',
    'Set the shared light or dark theme.',
    { type: 'object', properties: { theme: { type: 'string', enum: ['light', 'dark'] } }, required: ['theme'], additionalProperties: false },
    ({ theme }) => {
      store.setTheme(theme);
      return { theme: store.theme.value };
    }
  );

  register(
    'entity_create',
    'Create a validated user record.',
    {
      type: 'object',
      properties: {
        fields: {
          type: 'object',
          additionalProperties: { type: 'string' }
        }
      },
      required: ['fields'],
      additionalProperties: false
    },
    (input) => {
      const created = store.createUser(normalizeEntityFields(input));
      store.setView('all-users');
      return { id: created.id, email: created.email, created: true };
    }
  );

  register(
    'entity_select',
    'Select or unselect one user.',
    { type: 'object', properties: { id: { type: 'string' }, selected: { type: 'boolean' } }, required: ['id', 'selected'], additionalProperties: false },
    ({ id, selected }) => {
      store.toggleSelection(id, selected);
      return { id, selected };
    }
  );

  register(
    'entity_update',
    'Update declared fields on one user through normal validation.',
    {
      type: 'object',
      properties: {
        id: { type: 'string' },
        fields: { type: 'object', additionalProperties: { type: 'string' } }
      },
      required: ['id', 'fields'],
      additionalProperties: false
    },
    ({ id, fields }) => {
      const current = store.users.value.find((u) => u.id === id);
      if (!current) throw new Error('User not found');
      const patch = normalizeFormFields({ fields });
      const updated = store.updateUser(id, { ...current, ...patch, temporaryPassword: '' });
      return { id: updated.id, email: updated.email, updated: true };
    }
  );

  register(
    'entity_delete',
    'Archive one user; explicit confirmation is required.',
    { type: 'object', properties: { id: { type: 'string' }, confirm: { const: true } }, required: ['id', 'confirm'], additionalProperties: false },
    ({ id }) => ({ archived: store.archiveUsers([id]) === 1, id })
  );

  register(
    'entity_toggle',
    'Toggle one user selection.',
    { type: 'object', properties: { id: { type: 'string' } }, required: ['id'], additionalProperties: false },
    ({ id }) => {
      const selected = !store.selection.value.has(id);
      store.toggleSelection(id, selected);
      return { id, selected };
    }
  );

  register(
    'form_validate',
    'Validate a declared create-user form payload without mutating.',
    {
      type: 'object',
      properties: { fields: { type: 'object', additionalProperties: { type: 'string' } } },
      required: ['fields'],
      additionalProperties: false
    },
    (input) => {
      const payload = normalizeFormFields(input);
      const result = store.userCreateSchema.safeParse({
        ...payload,
        sendInvitation: payload.sendInvitation ?? false,
        twoFactorEnabled: payload.twoFactorEnabled ?? false,
        productAccess: payload.productAccess ?? true,
        permissions: payload.permissions ?? ['users.read']
      });
      return result.success
        ? { valid: true }
        : { valid: false, errors: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })) };
    }
  );

  register(
    'form_submit',
    'Submit the same validated Add user workflow as the visible form.',
    {
      type: 'object',
      properties: { fields: { type: 'object', additionalProperties: { type: 'string' } } },
      required: ['fields'],
      additionalProperties: false
    },
    (input) => {
      const payload = normalizeFormFields(input);
      const created = store.createUser({
        ...payload,
        sendInvitation: payload.sendInvitation ?? false,
        twoFactorEnabled: payload.twoFactorEnabled ?? false,
        productAccess: payload.productAccess ?? true,
        permissions: payload.permissions ?? ['users.read']
      });
      store.setView('all-users');
      return { submitted: true, id: created.id, email: created.email };
    }
  );

  register(
    'form_cancel',
    'Cancel Add or Edit user without mutation.',
    { type: 'object', properties: {}, additionalProperties: false },
    () => {
      store.editUserId.value = null;
      store.duplicateSourceId.value = null;
      store.formDraft.value = null;
      store.setView('all-users');
      return { cancelled: true };
    }
  );

  register(
    'artifact_export',
    'Open a live export artifact preview.',
    { type: 'object', properties: { format: { type: 'string', enum: ['json', 'csv'] } }, required: ['format'], additionalProperties: false },
    ({ format }) => {
      store.openExport(format);
      return { format, drawerOpen: true, activeUsers: store.users.value.length, archivedUsers: store.archive.value.length };
    }
  );

  register(
    'artifact_import',
    'Open the visible import workflow; artifact text stays in the UI.',
    { type: 'object', properties: { mode: { type: 'string', enum: ['directory-json', 'users-csv'] } }, required: ['mode'], additionalProperties: false },
    ({ mode }) => {
      store.importMode.value = mode;
      store.importOpen.value = true;
      return { mode, importSurfaceOpen: true };
    }
  );

  register(
    'artifact_copy',
    'Open the requested artifact tab; clipboard mechanics stay in the visible surface.',
    { type: 'object', properties: { format: { type: 'string', enum: ['json', 'csv'] } }, required: ['format'], additionalProperties: false },
    ({ format }) => {
      store.openExport(format);
      return { format, drawerOpen: true, copyControlVisible: true };
    }
  );
}
