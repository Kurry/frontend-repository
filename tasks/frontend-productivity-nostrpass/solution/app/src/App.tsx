import { Component, For, Show } from 'solid-js';
import { store, setView, ViewId } from './store';
import Dashboard from './components/Dashboard';
import Identities from './components/Identities';
import Permissions from './components/Permissions';
import AuditLog from './components/AuditLog';
import Settings from './components/Settings';

const NAV: { id: ViewId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'identities', label: 'Identities' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'audit-log', label: 'Audit log' },
  { id: 'settings', label: 'Settings' },
];

const App: Component = () => {
  return (
    <div
      class="min-h-screen flex"
      classList={{
        'bg-slate-950 text-slate-200': store.theme === 'dark',
        'bg-slate-50 text-slate-900': store.theme === 'light',
      }}
      data-theme={store.theme}
    >
      <aside class="w-56 shrink-0 border-r border-slate-700/60 bg-slate-900/60 p-4 flex flex-col gap-4">
        <div class="flex items-center gap-2 px-1">
          <span class="text-xl">🔑</span>
          <span class="font-semibold text-slate-100">Nostrpass Vault</span>
        </div>
        <nav class="flex flex-col gap-1" data-testid="main-nav">
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
      </aside>

      <main class="flex-1 p-8 max-w-4xl" data-testid="main-view">
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
  );
};

export default App;
