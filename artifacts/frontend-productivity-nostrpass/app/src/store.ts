import { createStore, reconcile, unwrap } from 'solid-js/store';
import { nip19 } from 'nostr-tools';
import { bytesToHex, generateKeyPair, keyPairFromSkHex } from './crypto';
import { backupSchema, vaultImportSchema } from './validation';

export const APPS = [
  { id: 'damus', name: 'Damus' },
  { id: 'snort', name: 'Snort' },
  { id: 'coracle', name: 'Coracle' },
  { id: 'iris', name: 'Iris' },
] as const;

export type AppId = (typeof APPS)[number]['id'];

export interface Identity {
  id: string;
  nickname: string;
  skHex: string;
  npub: string;
  nsec: string;
  createdAt: number;
}

export type Grants = Record<string, Record<AppId, boolean>>;

export type ViewId = 'dashboard' | 'identities' | 'permissions' | 'audit-log' | 'settings';

export type AuditActionType =
  | 'all'
  | 'identity-created'
  | 'identity-renamed'
  | 'identity-deleted'
  | 'identity-selected'
  | 'permission-changed'
  | 'bulk-permission'
  | 'key-rotated'
  | 'backup-exported'
  | 'backup-imported'
  | 'vault-exported'
  | 'vault-imported'
  | 'theme-changed';

export interface AuditEntry {
  ts: number;
  message: string;
  action: AuditActionType;
  identityLabel?: string;
}

export interface StateShape {
  identities: Identity[];
  activeIdentityId: string;
  grants: Grants;
  theme: 'light' | 'dark';
}

interface AppState extends StateShape {
  auditLog: AuditEntry[];
  view: ViewId;
  revealedIdentityId: string | null;
  history: StateShape[];
  historyIndex: number;
  searchQuery: string;
  sortOrder: 'label-asc' | 'label-desc';
  auditFilter: AuditActionType;
  vaultDrawerOpen: boolean;
  backupDrawerIdentityId: string | null;
  isCreatingIdentity: boolean;
}

function emptyGrants(): Record<AppId, boolean> {
  return { damus: false, snort: false, coracle: false, iris: false };
}

function seedIdentity(nickname: string): Identity {
  const kp = generateKeyPair();
  return {
    id: crypto.randomUUID(),
    nickname,
    skHex: kp.skHex,
    npub: kp.npub,
    nsec: kp.nsec,
    createdAt: Date.now(),
  };
}

function buildSeed(): AppState {
  const personal = seedIdentity('Personal');
  const work = seedIdentity('Work');
  const grants: Grants = {
    [personal.id]: { damus: true, snort: false, coracle: false, iris: false },
    [work.id]: { damus: false, snort: true, coracle: false, iris: false },
  };

  const initialState: StateShape = {
    identities: [personal, work],
    activeIdentityId: personal.id,
    grants,
    theme: 'dark',
  };

  return {
    ...initialState,
    auditLog: [
      {
        ts: Date.now(),
        message: 'Vault ready for Personal.',
        action: 'identity-selected',
        identityLabel: 'Personal',
      },
    ],
    view: 'dashboard',
    revealedIdentityId: null,
    history: [initialState],
    historyIndex: 0,
    searchQuery: '',
    sortOrder: 'label-asc',
    auditFilter: 'all',
    vaultDrawerOpen: false,
    backupDrawerIdentityId: null,
    isCreatingIdentity: false,
  };
}

const initial = buildSeed();

export const [store, setStore] = createStore<AppState>(initial);

export function logAudit(
  message: string,
  action: AuditActionType,
  identityLabel?: string,
) {
  setStore('auditLog', (log) =>
    [{ ts: Date.now(), message, action, identityLabel }, ...log].slice(0, 100),
  );
}

function pushHistory() {
  const currentState: StateShape = {
    identities: JSON.parse(JSON.stringify(unwrap(store.identities))),
    activeIdentityId: store.activeIdentityId,
    grants: JSON.parse(JSON.stringify(unwrap(store.grants))),
    theme: store.theme,
  };

  setStore((state) => {
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(currentState);
    return {
      history: newHistory,
      historyIndex: newHistory.length - 1,
    };
  });
}

export function undo() {
  if (store.historyIndex > 0) {
    const prevIndex = store.historyIndex - 1;
    const prevState = store.history[prevIndex];
    setStore(reconcile({ ...store, ...prevState, historyIndex: prevIndex }));
  }
}

export function redo() {
  if (store.historyIndex < store.history.length - 1) {
    const nextIndex = store.historyIndex + 1;
    const nextState = store.history[nextIndex];
    setStore(reconcile({ ...store, ...nextState, historyIndex: nextIndex }));
  }
}

export const canUndo = () => store.historyIndex > 0;
export const canRedo = () => store.historyIndex < store.history.length - 1;

export function setView(view: ViewId) {
  setStore('view', view);
}

export function setTheme(theme: 'light' | 'dark') {
  setStore('theme', theme);
  logAudit(`Theme switched to ${theme} for ${activeIdentity()?.nickname ?? 'vault'}.`, 'theme-changed', activeIdentity()?.nickname);
}

export function toggleTheme() {
  setTheme(store.theme === 'dark' ? 'light' : 'dark');
}

export function setSearchQuery(query: string) {
  setStore('searchQuery', query);
}

export function setSortOrder(order: 'label-asc' | 'label-desc') {
  setStore('sortOrder', order);
}

export function setAuditFilter(filter: AuditActionType) {
  setStore('auditFilter', filter);
}

export function setVaultDrawerOpen(open: boolean) {
  setStore('vaultDrawerOpen', open);
}

export function setBackupDrawerIdentityId(id: string | null) {
  setStore('backupDrawerIdentityId', id);
}

export function createIdentity(nickname: string): string {
  if (store.isCreatingIdentity) return store.activeIdentityId;
  setStore('isCreatingIdentity', true);
  const trimmed = nickname.trim() || `Identity ${store.identities.length + 1}`;
  const identity = seedIdentity(trimmed);
  setStore('identities', (list) => [...list, identity]);
  setStore('grants', identity.id, emptyGrants());
  setStore('activeIdentityId', identity.id);
  logAudit(`Created identity "${trimmed}".`, 'identity-created', trimmed);
  pushHistory();
  setStore('isCreatingIdentity', false);
  return identity.id;
}

export function renameIdentity(id: string, nickname: string) {
  const trimmed = nickname.trim();
  if (!trimmed) return;
  const prev = store.identities.find((i) => i.id === id);
  setStore('identities', (i) => i.id === id, 'nickname', trimmed);
  logAudit(`Renamed identity from "${prev?.nickname}" to "${trimmed}".`, 'identity-renamed', trimmed);
  pushHistory();
}

export function rotateIdentityKeys(id: string) {
  const kp = generateKeyPair();
  const identity = store.identities.find((i) => i.id === id);
  if (!identity) return;
  const shortOld = identity.npub.slice(0, 8) + '…';
  const shortNew = kp.npub.slice(0, 8) + '…';
  setStore('identities', (i) => i.id === id, {
    skHex: kp.skHex,
    npub: kp.npub,
    nsec: kp.nsec,
  });
  logAudit(
    `Rotated keys for "${identity.nickname}" (old: ${shortOld}, new: ${shortNew}).`,
    'key-rotated',
    identity.nickname,
  );
  pushHistory();
}

export function deleteIdentity(id: string) {
  if (store.identities.length <= 1) return;

  const identity = store.identities.find((i) => i.id === id);
  if (!identity) return;

  setStore('identities', (list) => list.filter((i) => i.id !== id));

  const newGrants = { ...unwrap(store.grants) };
  delete newGrants[id];
  setStore('grants', newGrants);

  if (store.activeIdentityId === id) {
    const remaining = store.identities.filter((i) => i.id !== id);
    setStore('activeIdentityId', remaining[0]?.id ?? '');
  }

  if (store.revealedIdentityId === id) {
    setStore('revealedIdentityId', null);
  }

  logAudit(`Deleted identity "${identity.nickname}".`, 'identity-deleted', identity.nickname);
  pushHistory();
}

export function selectIdentity(id: string) {
  const identity = store.identities.find((i) => i.id === id);
  if (!identity) return;
  setStore('activeIdentityId', id);
  setStore('revealedIdentityId', null);
  logAudit(`Switched active identity to "${identity.nickname}".`, 'identity-selected', identity.nickname);
  pushHistory();
}

export function toggleAppPermission(identityId: string, appId: AppId) {
  const identity = store.identities.find((i) => i.id === identityId);
  const current = store.grants[identityId]?.[appId] ?? false;
  setStore('grants', identityId, appId, !current);
  const appName = APPS.find((a) => a.id === appId)?.name ?? appId;
  logAudit(
    `${!current ? 'Granted' : 'Revoked'} ${appName} access for "${identity?.nickname ?? identityId}".`,
    'permission-changed',
    identity?.nickname,
  );
  pushHistory();
}

export function bulkGrant(appId: AppId) {
  const appName = APPS.find((a) => a.id === appId)?.name ?? appId;
  let changed = 0;
  for (const identity of store.identities) {
    if (!store.grants[identity.id]?.[appId]) changed += 1;
    setStore('grants', identity.id, appId, true);
  }
  logAudit(
    `Bulk granted ${appName} access to ${changed} ${changed === 1 ? 'identity' : 'identities'}.`,
    'bulk-permission',
  );
  pushHistory();
}

export function bulkRevoke(appId: AppId) {
  const appName = APPS.find((a) => a.id === appId)?.name ?? appId;
  let changed = 0;
  for (const identity of store.identities) {
    if (store.grants[identity.id]?.[appId]) changed += 1;
    setStore('grants', identity.id, appId, false);
  }
  logAudit(
    `Bulk revoked ${appName} access from ${changed} ${changed === 1 ? 'identity' : 'identities'}.`,
    'bulk-permission',
  );
  pushHistory();
}

export function revealKey(identityId: string) {
  setStore('revealedIdentityId', store.revealedIdentityId === identityId ? null : identityId);
}

export function activeIdentity(): Identity | undefined {
  return store.identities.find((i) => i.id === store.activeIdentityId);
}

export function grantsFor(identityId: string): Record<AppId, boolean> {
  return store.grants[identityId] ?? emptyGrants();
}

export function connectedAppCount(identityId: string): number {
  const grants = grantsFor(identityId);
  return APPS.filter((a) => grants[a.id]).length;
}

export function filteredIdentities(): Identity[] {
  const q = store.searchQuery.trim().toLowerCase();
  let list = [...store.identities];
  if (q) {
    list = list.filter(
      (i) => i.nickname.toLowerCase().includes(q) || i.npub.toLowerCase().includes(q),
    );
  }
  list.sort((a, b) => {
    const cmp = a.nickname.localeCompare(b.nickname);
    return store.sortOrder === 'label-asc' ? cmp : -cmp;
  });
  return list;
}

export function filteredAuditLog(): AuditEntry[] {
  if (store.auditFilter === 'all') return store.auditLog;
  return store.auditLog.filter((e) => e.action === store.auditFilter);
}

export function exportVaultJson() {
  return {
    version: 'nostrpass-vault-v1' as const,
    activeLabel: store.identities.find((i) => i.id === store.activeIdentityId)?.nickname ?? '',
    theme: store.theme,
    identities: store.identities.map((i) => ({
      label: i.nickname,
      npub: i.npub,
      nsec: i.nsec,
      grants: store.grants[i.id] ?? emptyGrants(),
    })),
  };
}

export function exportBackupJson(identityId: string) {
  const identity = store.identities.find((i) => i.id === identityId);
  if (!identity) return null;
  return {
    version: 'nostrpass-backup-v1' as const,
    exportedAt: new Date().toISOString(),
    identity: {
      label: identity.nickname,
      npub: identity.npub,
      nsec: identity.nsec,
      grants: store.grants[identity.id] ?? emptyGrants(),
    },
  };
}

export function importVault(vault: unknown): { ok: true } | { ok: false; error: string } {
  const parsed = vaultImportSchema.safeParse(vault);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path.join('.') || 'vault import';
    return { ok: false, error: `${field}: ${issue?.message ?? 'Invalid vault JSON.'}` };
  }

  const data = parsed.data;
  const finalIdentities: Identity[] = data.identities.map((item) => {
    let skHex = '';
    try {
      const decoded = nip19.decode(item.nsec);
      if (decoded.type === 'nsec' && decoded.data instanceof Uint8Array) {
        skHex = bytesToHex(decoded.data);
      }
    } catch {
      /* keep empty skHex */
    }
    return {
      id: crypto.randomUUID(),
      nickname: item.label,
      skHex,
      npub: item.npub,
      nsec: item.nsec,
      createdAt: Date.now(),
    };
  });

  const grants: Grants = {};
  for (let i = 0; i < finalIdentities.length; i++) {
    grants[finalIdentities[i].id] = data.identities[i].grants;
  }

  let activeId = finalIdentities[0].id;
  const activeMatch = finalIdentities.find((i) => i.nickname === data.activeLabel);
  if (activeMatch) activeId = activeMatch.id;

  setStore('identities', finalIdentities);
  setStore('grants', grants);
  setStore('activeIdentityId', activeId);
  setStore('theme', data.theme);
  logAudit(
    `Imported vault configuration for ${finalIdentities.length} ${finalIdentities.length === 1 ? 'identity' : 'identities'}.`,
    'vault-imported',
    activeMatch?.nickname,
  );
  pushHistory();
  return { ok: true };
}

export function importBackup(backup: unknown): { ok: true } | { ok: false; error: string } {
  const parsed = backupSchema.safeParse(backup);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path.join('.') || 'backup import';
    return { ok: false, error: `${field}: ${issue?.message ?? 'Invalid Key Backup JSON.'}` };
  }

  const conflict = store.identities.find((i) => i.npub === parsed.data.identity.npub);
  if (conflict) {
    return {
      ok: false,
      error: `npub conflict: backup npub ${parsed.data.identity.npub.slice(0, 12)}… already exists for "${conflict.nickname}".`,
    };
  }

  let skHex = '';
  try {
    const decoded = nip19.decode(parsed.data.identity.nsec);
    if (decoded.type === 'nsec' && decoded.data instanceof Uint8Array) {
      skHex = bytesToHex(decoded.data);
    }
  } catch {
    /* keep empty */
  }

  const identity: Identity = {
    id: crypto.randomUUID(),
    nickname: parsed.data.identity.label,
    skHex,
    npub: parsed.data.identity.npub,
    nsec: parsed.data.identity.nsec,
    createdAt: Date.now(),
  };

  setStore('identities', (list) => [...list, identity]);
  setStore('grants', identity.id, parsed.data.identity.grants);
  logAudit(`Imported backup for "${identity.nickname}".`, 'backup-imported', identity.nickname);
  pushHistory();
  return { ok: true };
}

export const AUDIT_FILTER_OPTIONS: { value: AuditActionType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'identity-created', label: 'Identity created' },
  { value: 'identity-renamed', label: 'Identity renamed' },
  { value: 'identity-deleted', label: 'Identity deleted' },
  { value: 'identity-selected', label: 'Identity selected' },
  { value: 'permission-changed', label: 'Permission changed' },
  { value: 'bulk-permission', label: 'Bulk permission' },
  { value: 'key-rotated', label: 'Key rotated' },
  { value: 'backup-exported', label: 'Backup exported' },
  { value: 'backup-imported', label: 'Backup imported' },
  { value: 'vault-exported', label: 'Vault exported' },
  { value: 'vault-imported', label: 'Vault imported' },
  { value: 'theme-changed', label: 'Theme changed' },
];
