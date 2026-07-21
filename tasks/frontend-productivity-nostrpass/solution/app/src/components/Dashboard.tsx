import { Component, For, Show } from 'solid-js';
import {
  store,
  activeIdentity,
  grantsFor,
  revealKey,
  connectedAppCount,
  APPS,
  setBackupDrawerIdentityId,
} from '../store';
import { toaster } from '../App';

const Dashboard: Component = () => {
  const active = () => activeIdentity();

  const copyNpub = async () => {
    const identity = active();
    if (!identity) return;
    await navigator.clipboard.writeText(identity.npub);
    toaster.create({ title: 'Copied', description: 'npub copied to clipboard.' });
  };

  return (
    <div class="space-y-6 max-w-full overflow-x-hidden">
      <div>
        <h1 class="text-2xl font-semibold text-slate-100">Dashboard</h1>
        <p class="text-sm text-slate-400">Local Nostr identity and key overview.</p>
      </div>

      <Show when={active()}>
        {(identity) => (
          <div class="rounded-xl border border-slate-700 bg-slate-800/60 p-5 hover-wash max-w-full">
            <div class="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div class="text-xs uppercase tracking-wide text-violet-400">Active identity</div>
                <div class="text-xl font-semibold text-slate-100">{identity().nickname}</div>
              </div>
              <span class="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
                Key ready
              </span>
            </div>

            <div class="mt-4 space-y-3 max-w-full">
              <div>
                <div class="text-xs text-slate-400 mb-1">Public key (npub)</div>
                <div class="flex flex-wrap items-start gap-2">
                  <div
                    data-testid="dashboard-npub"
                    class="flex-1 min-w-0 rounded-lg bg-slate-900 px-3 py-2 font-mono text-sm text-slate-200 break-all overflow-hidden"
                  >
                    {identity().npub}
                  </div>
                  <button
                    type="button"
                    data-testid="copy-npub-btn"
                    class="hover-wash shrink-0 rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
                    onClick={copyNpub}
                  >
                    Copy npub
                  </button>
                </div>
              </div>
              <div>
                <div class="text-xs text-slate-400 mb-1">Private key (nsec)</div>
                <div class="flex flex-wrap items-start gap-2">
                  <div
                    data-testid="dashboard-nsec"
                    class="flex-1 min-w-0 rounded-lg bg-slate-900 px-3 py-2 font-mono text-sm text-slate-200 break-all overflow-hidden"
                  >
                    {store.revealedIdentityId === identity().id ? identity().nsec : '•'.repeat(20)}
                  </div>
                  <button
                    type="button"
                    class="hover-wash shrink-0 rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
                    onClick={() => revealKey(identity().id)}
                    data-testid="reveal-key-btn"
                    aria-label={
                      store.revealedIdentityId === identity().id
                        ? `Hide private key for ${identity().nickname}`
                        : `Reveal private key for ${identity().nickname}`
                    }
                  >
                    {store.revealedIdentityId === identity().id ? 'Hide key' : 'Reveal key'}
                  </button>
                </div>
              </div>
            </div>

            <div class="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                class="hover-wash rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
                onClick={() => setBackupDrawerIdentityId(identity().id)}
              >
                Export backup
              </button>
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
          <div class="text-2xl font-semibold text-slate-100">
            {active() ? connectedAppCount(active()!.id) : 0}
          </div>
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
