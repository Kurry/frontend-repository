import { createStore, reconcile, unwrap } from 'solid-js/store';
import { bytesToHex, generateKeyPair, keyPairFromSkHex } from './crypto';

export const APPS = [
  { id: 'damus', name: 'Damus' },
  { id: 'snort', name: 'Snort' },
  { id: 'coracle', name: 'Coracle' },
  { id: 'iris', name: 'Iris' },
];

export interface Identity {
  id: string;
  nickname: string;
  skHex: string;
  npub: string;
  nsec: string;
  createdAt: number;
}

export type Grants = Record<string, Record<string, boolean>>;

export type ViewId = 'dashboard' | 'identities' | 'permissions' | 'audit-log' | 'settings';

export interface AuditEntry {
  ts: number;
  message: string;
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
      { ts: Date.now(), message: 'Vault initialized with 2 seeded identities.' },
    ],
    view: 'dashboard',
    revealedIdentityId: null,
    history: [initialState],
    historyIndex: 0,
    searchQuery: '',
    sortOrder: 'label-asc',
  };
}

const initial = buildSeed();

export const [store, setStore] = createStore<AppState>(initial);

export function logAudit(message: string) {
  setStore('auditLog', (log) => [{ ts: Date.now(), message }, ...log].slice(0, 50));
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
      historyIndex: newHistory.length - 1
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
  logAudit(`Theme switched to ${theme}.`);
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

export function createIdentity(nickname: string): string {
  const trimmed = nickname.trim() || `Identity ${store.identities.length + 1}`;
  const identity = seedIdentity(trimmed);
  setStore('identities', (list) => [...list, identity]);
  setStore('grants', identity.id, { damus: false, snort: false, coracle: false, iris: false });
  setStore('activeIdentityId', identity.id);
  logAudit(`Created identity "${trimmed}" and switched to it.`);
  pushHistory();
  return identity.id;
}

export function renameIdentity(id: string, nickname: string) {
  const trimmed = nickname.trim();
  if (!trimmed) return;
  setStore('identities', (i) => i.id === id, 'nickname', trimmed);
  logAudit(`Renamed identity to "${trimmed}".`);
  pushHistory();
}

export function rotateIdentityKeys(id: string) {
  const kp = generateKeyPair();
  const identity = store.identities.find(i => i.id === id);
  if (!identity) return;
  setStore('identities', (i) => i.id === id, {
    skHex: kp.skHex,
    npub: kp.npub,
    nsec: kp.nsec,
  });

  const shortOld = identity.npub.substring(0, 8) + '...';
  const shortNew = kp.npub.substring(0, 8) + '...';

  logAudit(`Rotated keys for "${identity.nickname}" (old: ${shortOld}, new: ${shortNew}).`);
  pushHistory();
}

export function deleteIdentity(id: string) {
  if (store.identities.length <= 1) return; // Cannot delete last identity

  const identity = store.identities.find((i) => i.id === id);
  if (!identity) return;

  setStore('identities', (list) => list.filter(i => i.id !== id));

  // Clean up grants
  const newGrants = { ...unwrap(store.grants) };
  delete newGrants[id];
  setStore('grants', newGrants);

  if (store.activeIdentityId === id) {
    setStore('activeIdentityId', store.identities[0].id);
  }

  if (store.revealedIdentityId === id) {
    setStore('revealedIdentityId', null);
  }

  logAudit(`Deleted identity "${identity.nickname}".`);
  pushHistory();
}

export function selectIdentity(id: string) {
  const identity = store.identities.find((i) => i.id === id);
  if (!identity) return;
  setStore('activeIdentityId', id);
  setStore('revealedIdentityId', null);
  logAudit(`Switched active identity to "${identity.nickname}".`);
  pushHistory();
}

export function toggleAppPermission(identityId: string, appId: string) {
  const identity = store.identities.find((i) => i.id === identityId);
  const current = store.grants[identityId]?.[appId] ?? false;
  setStore('grants', identityId, appId, !current);
  const appName = APPS.find((a) => a.id === appId)?.name ?? appId;
  logAudit(
    `${!current ? 'Granted' : 'Revoked'} ${appName} access for "${identity?.nickname ?? identityId}".`
  );
  pushHistory();
}

export function bulkGrant(appId: string) {
  const appName = APPS.find((a) => a.id === appId)?.name ?? appId;
  for (const identity of store.identities) {
    setStore('grants', identity.id, appId, true);
  }
  logAudit(`Bulk granted ${appName} access to all identities.`);
  pushHistory();
}

export function bulkRevoke(appId: string) {
  const appName = APPS.find((a) => a.id === appId)?.name ?? appId;
  for (const identity of store.identities) {
    setStore('grants', identity.id, appId, false);
  }
  logAudit(`Bulk revoked ${appName} access from all identities.`);
  pushHistory();
}

export function revealKey(identityId: string) {
  setStore('revealedIdentityId', store.revealedIdentityId === identityId ? null : identityId);
}

export function activeIdentity(): Identity | undefined {
  return store.identities.find((i) => i.id === store.activeIdentityId);
}

export function grantsFor(identityId: string): Record<string, boolean> {
  return store.grants[identityId] ?? { damus: false, snort: false, coracle: false, iris: false };
}

import { nip19 } from 'nostr-tools';

export function importVault(vault: any) {
  const finalIdentities = vault.identities.map((item: any) => {
    let skHex = '';
    try {
        const decoded = nip19.decode(item.nsec);
        if (decoded.type === 'nsec' && decoded.data instanceof Uint8Array) {
            skHex = bytesToHex(decoded.data);
        }
    } catch(e) {}

    return {
      id: crypto.randomUUID(),
      nickname: item.label,
      skHex: skHex,
      npub: item.npub,
      nsec: item.nsec,
      createdAt: Date.now()
    };
  });

  const grants: Grants = {};
  for (let i = 0; i < finalIdentities.length; i++) {
    grants[finalIdentities[i].id] = vault.identities[i].grants;
  }

  let activeId = finalIdentities[0].id;
  const activeLabelObj = finalIdentities.find((i: any) => i.nickname === vault.activeLabel);
  if (activeLabelObj) {
      activeId = activeLabelObj.id;
  }

  setStore('identities', finalIdentities);
  setStore('grants', grants);
  setStore('activeIdentityId', activeId);
  if (vault.theme) {
      setTheme(vault.theme);
  }
  logAudit('Imported vault configuration.');
  pushHistory();
}
