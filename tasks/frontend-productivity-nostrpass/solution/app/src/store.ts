import { createStore } from 'solid-js/store';
import { generateKeyPair, keyPairFromSkHex } from './crypto';

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

interface PersistedShape {
  identities: Identity[];
  activeIdentityId: string;
  grants: Grants;
  theme: 'light' | 'dark';
  auditLog: AuditEntry[];
}

interface AppState extends PersistedShape {
  view: ViewId;
  revealedIdentityId: string | null;
}

const STORAGE_KEY = 'nostrpass_vault_state_v1';

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

function buildSeed(): PersistedShape {
  const personal = seedIdentity('Personal');
  const work = seedIdentity('Work');
  const grants: Grants = {
    [personal.id]: { damus: true, snort: false, coracle: false, iris: false },
    [work.id]: { damus: false, snort: true, coracle: false, iris: false },
  };
  return {
    identities: [personal, work],
    activeIdentityId: personal.id,
    grants,
    theme: 'dark',
    auditLog: [
      { ts: Date.now(), message: 'Vault initialized with 2 seeded identities.' },
    ],
  };
}

function loadPersisted(): PersistedShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildSeed();
    const parsed = JSON.parse(raw) as PersistedShape;
    if (!parsed.identities || parsed.identities.length === 0) return buildSeed();
    // Rehydrate key material deterministically from stored secret keys so
    // npub/nsec remain byte-for-byte stable across reloads.
    const identities = parsed.identities.map((id) => {
      const kp = keyPairFromSkHex(id.skHex);
      return { ...id, npub: kp.npub, nsec: kp.nsec };
    });
    return { ...parsed, identities };
  } catch {
    return buildSeed();
  }
}

const initial = loadPersisted();

export const [store, setStore] = createStore<AppState>({
  ...initial,
  view: 'dashboard',
  revealedIdentityId: null,
});

function persist() {
  const toSave: PersistedShape = {
    identities: store.identities,
    activeIdentityId: store.activeIdentityId,
    grants: store.grants,
    theme: store.theme,
    auditLog: store.auditLog,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

function logAudit(message: string) {
  setStore('auditLog', (log) => [{ ts: Date.now(), message }, ...log].slice(0, 50));
}

export function setView(view: ViewId) {
  setStore('view', view);
}

export function setTheme(theme: 'light' | 'dark') {
  setStore('theme', theme);
  logAudit(`Theme switched to ${theme}.`);
  persist();
}

export function toggleTheme() {
  setTheme(store.theme === 'dark' ? 'light' : 'dark');
}

export function createIdentity(nickname: string): string {
  const trimmed = nickname.trim() || `Identity ${store.identities.length + 1}`;
  const identity = seedIdentity(trimmed);
  setStore('identities', (list) => [...list, identity]);
  setStore('grants', identity.id, { damus: false, snort: false, coracle: false, iris: false });
  setStore('activeIdentityId', identity.id);
  logAudit(`Created identity "${trimmed}" and switched to it.`);
  persist();
  return identity.id;
}

export function selectIdentity(id: string) {
  const identity = store.identities.find((i) => i.id === id);
  if (!identity) return;
  setStore('activeIdentityId', id);
  setStore('revealedIdentityId', null);
  logAudit(`Switched active identity to "${identity.nickname}".`);
  persist();
}

export function toggleAppPermission(identityId: string, appId: string) {
  const identity = store.identities.find((i) => i.id === identityId);
  const current = store.grants[identityId]?.[appId] ?? false;
  setStore('grants', identityId, appId, !current);
  const appName = APPS.find((a) => a.id === appId)?.name ?? appId;
  logAudit(
    `${!current ? 'Granted' : 'Revoked'} ${appName} access for "${identity?.nickname ?? identityId}".`
  );
  persist();
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
