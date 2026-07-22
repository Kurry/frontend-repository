import { Component } from 'solid-js';
import { store, toggleTheme } from '../store';

const Settings: Component = () => {
  return (
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-100">Settings</h1>
        <p class="text-sm text-slate-400">Vault-wide preferences.</p>
      </div>

      <div class="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-medium text-slate-100">Appearance</div>
            <div class="text-xs text-slate-400">
              Currently using {store.theme === 'dark' ? 'dark' : 'light'} theme.
            </div>
          </div>
          <button
            type="button"
            data-testid="theme-toggle"
            class="hover-wash rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
            onClick={toggleTheme}
          >
            Switch to {store.theme === 'dark' ? 'light' : 'dark'} mode
          </button>
        </div>
      </div>

      <div class="rounded-xl border border-slate-700 bg-slate-800/60 p-5 text-sm text-slate-400">
        This vault is entirely local: keys, identities, and permission grants are generated and
        stored in this browser only. Nothing is sent to a server or Nostr relay.
      </div>
    </div>
  );
};

export default Settings;
