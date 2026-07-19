import { Component, For, Show } from 'solid-js';
import { store, activeIdentity, grantsFor, revealKey, APPS } from '../store';

const Dashboard: Component = () => {
  const active = () => activeIdentity();

  return (
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-100">Dashboard</h1>
        <p class="text-sm text-slate-400">Local Nostr identity and key overview.</p>
      </div>

      <Show when={active()}>
        {(identity) => (
          <div class="rounded-xl border border-slate-700 bg-slate-800/60 p-5 hover-wash">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs uppercase tracking-wide text-violet-400">Active identity</div>
                <div class="text-xl font-semibold text-slate-100">{identity().nickname}</div>
              </div>
              <span class="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
                Key ready
              </span>
            </div>

            <div class="mt-4 space-y-3">
              <div>
                <div class="text-xs text-slate-400 mb-1">Public key (npub)</div>
                <div
                  data-testid="dashboard-npub"
                  class="rounded-lg bg-slate-900 px-3 py-2 font-mono text-sm text-slate-200 break-all"
                >
                  {identity().npub}
                </div>
              </div>
              <div>
                <div class="text-xs text-slate-400 mb-1">Private key (nsec)</div>
                <div class="flex items-center gap-2">
                  <div
                    data-testid="dashboard-nsec"
                    class="flex-1 rounded-lg bg-slate-900 px-3 py-2 font-mono text-sm text-slate-200 break-all"
                  >
                    {store.revealedIdentityId === identity().id
                      ? identity().nsec
                      : '•'.repeat(20)}
                  </div>
                  <button
                    type="button"
                    class="hover-wash rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
                    onClick={() => revealKey(identity().id)}
                    data-testid="reveal-key-btn"
                  >
                    {store.revealedIdentityId === identity().id ? 'Hide key' : 'Reveal key'}
                  </button>
                </div>
              </div>
            </div>

            <div class="mt-5">
              <div class="text-xs text-slate-400 mb-2">Granted permissions</div>
              <div class="flex flex-wrap gap-2">
                <For each={APPS}>
                  {(app) => {
                    const granted = () => grantsFor(identity().id)[app.id];
                    return (
                      <span
                        class="hover-wash rounded-full border px-3 py-1 text-xs font-medium"
                        classList={{
                          'border-emerald-500/40 bg-emerald-500/10 text-emerald-300': granted(),
                          'border-slate-600 bg-slate-900 text-slate-400': !granted(),
                        }}
                      >
                        {app.name}: {granted() ? 'Granted' : 'Revoked'}
                      </span>
                    );
                  }}
                </For>
              </div>
            </div>
          </div>
        )}
      </Show>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="rounded-xl border border-slate-700 bg-slate-800/60 p-4 hover-wash">
          <div class="text-xs text-slate-400">Identities</div>
          <div class="text-2xl font-semibold text-slate-100">{store.identities.length}</div>
        </div>
        <div class="rounded-xl border border-slate-700 bg-slate-800/60 p-4 hover-wash">
          <div class="text-xs text-slate-400">Connected apps</div>
          <div class="text-2xl font-semibold text-slate-100">{APPS.length}</div>
        </div>
        <div class="rounded-xl border border-slate-700 bg-slate-800/60 p-4 hover-wash">
          <div class="text-xs text-slate-400">Audit entries</div>
          <div class="text-2xl font-semibold text-slate-100">{store.auditLog.length}</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
