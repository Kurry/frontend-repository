import { Component, For, Show, createSignal } from 'solid-js';
import { Toast, Toaster, createToaster, type CreateToasterReturn } from '@ark-ui/solid';
import { IconArrowBackUp, IconArrowForwardUp, IconMenu2 } from '@tabler/icons-solidjs';
import {
  store,
  setView,
  ViewId,
  undo,
  redo,
  canUndo,
  canRedo,
  setVaultDrawerOpen,
  setBackupDrawerIdentityId,
} from './store';
import Dashboard from './components/Dashboard';
import Identities from './components/Identities';
import Permissions from './components/Permissions';
import AuditLog from './components/AuditLog';
import Settings from './components/Settings';
import { VaultDrawer } from './components/VaultDrawer';
import { BackupDrawer } from './components/BackupDrawer';
import { DecorativeIcon } from './components/PermissionSwitch';

export const toaster: CreateToasterReturn = createToaster({
  placement: 'bottom-end',
  gap: 16,
  duration: 3200,
});

const NAV: { id: ViewId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'identities', label: 'Identities' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'audit-log', label: 'Audit log' },
  { id: 'settings', label: 'Settings' },
];

const App: Component = () => {
  const [mobileNavOpen, setMobileNavOpen] = createSignal(false);

  const navigate = (id: ViewId) => {
    setView(id);
    setMobileNavOpen(false);
  };

  return (
    <>
      <div
        class="min-h-screen flex overflow-x-hidden"
        classList={{
          'bg-slate-950 text-slate-200 dark': store.theme === 'dark',
          'bg-slate-50 text-slate-900': store.theme === 'light',
        }}
        data-theme={store.theme}
      >
        <button
          type="button"
          class="md:hidden fixed top-3 left-3 z-30 rounded-lg border border-slate-600 bg-slate-900/90 p-2 text-slate-200"
          aria-label="Open navigation"
          onClick={() => setMobileNavOpen(true)}
        >
          <DecorativeIcon><IconMenu2 size={18} /></DecorativeIcon>
        </button>

        <Show when={mobileNavOpen()}>
          <button
            type="button"
            class="md:hidden fixed inset-0 z-20 bg-black/50"
            aria-label="Close navigation overlay"
            onClick={() => setMobileNavOpen(false)}
          />
        </Show>

        <aside
          class="w-56 shrink-0 border-r border-slate-700/60 bg-slate-900/60 p-4 flex flex-col gap-4 overflow-y-auto fixed md:static inset-y-0 left-0 z-30 transition-transform -translate-x-full md:translate-x-0"
          classList={{ 'translate-x-0': mobileNavOpen() }}
          aria-label="Sidebar"
        >
          <div class="flex items-center gap-2 px-1">
            <span class="text-xl" aria-hidden="true">🔑</span>
            <span class="font-semibold text-slate-100">Nostrpass Vault</span>
          </div>

          <div class="flex gap-2 mb-2 px-1">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo()}
              class="flex-1 flex justify-center py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition-colors"
              title="Undo"
            >
              <DecorativeIcon><IconArrowBackUp size={16} /></DecorativeIcon>
              <span class="sr-only">Undo</span>
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo()}
              class="flex-1 flex justify-center py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition-colors"
              title="Redo"
            >
              <DecorativeIcon><IconArrowForwardUp size={16} /></DecorativeIcon>
              <span class="sr-only">Redo</span>
            </button>
          </div>

          <nav class="flex flex-col gap-1 flex-1" data-testid="main-nav" aria-label="Main">
            <For each={NAV}>
              {(item) => (
                <button
                  type="button"
                  data-testid={`nav-${item.id}`}
                  onClick={() => navigate(item.id)}
                  class="hover-wash text-left rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  classList={{
                    'bg-violet-600 text-white': store.view === item.id,
                    'text-slate-300': store.view !== item.id,
                  }}
                >
                  {item.label}
                </button>
              )}
            </For>
          </nav>

          <div class="mt-auto space-y-2">
            <button
              type="button"
              onClick={() => {
                setVaultDrawerOpen(true);
                toaster.create({ title: 'Exporting', description: 'Opening vault export drawer...' });
              }}
              class="w-full text-left rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-700/60 text-slate-300"
            >
              Export vault
            </button>
          </div>
        </aside>

        <main class="flex-1 p-4 md:p-8 max-w-4xl w-full min-w-0 overflow-x-hidden pt-14 md:pt-8" data-testid="main-view">
          <Show when={store.view === 'dashboard'}><Dashboard /></Show>
          <Show when={store.view === 'identities'}><Identities /></Show>
          <Show when={store.view === 'permissions'}><Permissions /></Show>
          <Show when={store.view === 'audit-log'}><AuditLog /></Show>
          <Show when={store.view === 'settings'}><Settings /></Show>
        </main>
      </div>

      <div aria-live="polite" aria-atomic="true" class="sr-only" id="global-live-region" />

      <VaultDrawer open={store.vaultDrawerOpen} onClose={() => setVaultDrawerOpen(false)} toast={toaster} />
      <BackupDrawer
        identityId={store.backupDrawerIdentityId}
        onClose={() => setBackupDrawerIdentityId(null)}
        toast={toaster}
      />

      <Toaster toaster={toaster}>
        {(toast) => (
          <Toast.Root class="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-4 min-w-[300px] toast-enter relative">
            <Toast.Title class="text-sm font-medium text-slate-100">{toast().title}</Toast.Title>
            <Toast.Description class="text-xs text-slate-400 mt-1">{toast().description}</Toast.Description>
            <Toast.CloseTrigger class="absolute top-2 right-2 text-slate-500 hover:text-slate-300">✕</Toast.CloseTrigger>
          </Toast.Root>
        )}
      </Toaster>
    </>
  );
};

export default App;
