import { Component, For, Show, createSignal } from 'solid-js';
import { Toast, Toaster } from '@ark-ui/solid';
import { IconArrowBackUp, IconArrowForwardUp } from '@tabler/icons-solidjs';
import { store, setView, ViewId, undo, redo, canUndo, canRedo } from './store';
import Dashboard from './components/Dashboard';
import Identities from './components/Identities';
import Permissions from './components/Permissions';
import AuditLog from './components/AuditLog';
import Settings from './components/Settings';
import { VaultDrawer } from './components/VaultDrawer';

export const toaster = Toast.createToaster({
  placement: 'bottom-end',
  gap: 16,
});

const NAV: { id: ViewId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'identities', label: 'Identities' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'audit-log', label: 'Audit log' },
  { id: 'settings', label: 'Settings' },
];

const App: Component = () => {
  const [drawerOpen, setDrawerOpen] = createSignal(false);

  return (
    <>
      <div
        class="min-h-screen flex"
        classList={{
          'bg-slate-950 text-slate-200': store.theme === 'dark',
          'bg-slate-50 text-slate-900': store.theme === 'light',
        }}
        data-theme={store.theme}
      >
        <aside class="w-56 shrink-0 border-r border-slate-700/60 bg-slate-900/60 p-4 flex flex-col gap-4 overflow-y-auto">
          <div class="flex items-center gap-2 px-1">
            <span class="text-xl">🔑</span>
            <span class="font-semibold text-slate-100">Nostrpass Vault</span>
          </div>

          <div class="flex gap-2 mb-2 px-1">
            <button
              onClick={undo}
              disabled={!canUndo()}
              class="flex-1 flex justify-center py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition-colors"
              title="Undo"
            >
              <IconArrowBackUp size={16} />
              <span class="sr-only">Undo</span>
            </button>
            <button
              onClick={redo}
              disabled={!canRedo()}
              class="flex-1 flex justify-center py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition-colors"
              title="Redo"
            >
              <IconArrowForwardUp size={16} />
              <span class="sr-only">Redo</span>
            </button>
          </div>

          <nav class="flex flex-col gap-1 flex-1" data-testid="main-nav">
            <For each={NAV}>
              {(item) => (
                <button
                  type="button"
                  data-testid={`nav-${item.id}`}
                  onClick={() => setView(item.id)}
                  class="hover-wash text-left rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-700/60"
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

          <div class="mt-auto">
            <button
              onClick={() => setDrawerOpen(true)}
              class="w-full text-left rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-700/60 text-slate-300"
            >
              Vault Data...
            </button>
          </div>
        </aside>

        <main class="flex-1 p-8 max-w-4xl overflow-x-hidden" data-testid="main-view">
          <Show when={store.view === 'dashboard'}>
            <Dashboard />
          </Show>
          <Show when={store.view === 'identities'}>
            <Identities />
          </Show>
          <Show when={store.view === 'permissions'}>
            <Permissions />
          </Show>
          <Show when={store.view === 'audit-log'}>
            <AuditLog />
          </Show>
          <Show when={store.view === 'settings'}>
            <Settings />
          </Show>
        </main>
      </div>

      <VaultDrawer open={drawerOpen()} onClose={() => setDrawerOpen(false)} toast={toaster} />

      <Toaster toaster={toaster}>
        {(toast) => (
          <Toast.Root class="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-4 min-w-[300px] motion-safe:animate-in motion-safe:slide-in-from-bottom-5">
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
