import { Component, For, Show, createSignal } from 'solid-js';
import { store, createIdentity, selectIdentity, revealKey } from '../store';

const Identities: Component = () => {
  const [showCreate, setShowCreate] = createSignal(false);
  const [nickname, setNickname] = createSignal('');
  const [error, setError] = createSignal('');

  const submitCreate = (e: Event) => {
    e.preventDefault();
    const trimmed = nickname().trim();
    if (!trimmed) {
      setError('Identity name is required.');
      return;
    }
    createIdentity(trimmed);
    setNickname('');
    setError('');
    setShowCreate(false);
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-slate-100">Identities</h1>
          <p class="text-sm text-slate-400">Create, select, and inspect Nostr key identities.</p>
        </div>
        <button
          type="button"
          data-testid="add-identity-btn"
          class="hover-wash rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          onClick={() => setShowCreate((v) => !v)}
        >
          + New identity
        </button>
      </div>

      <Show when={showCreate()}>
        <form
          onSubmit={submitCreate}
          class="rounded-xl border border-slate-700 bg-slate-800/60 p-4 space-y-3"
          data-testid="create-identity-form"
        >
          <label class="block text-xs text-slate-400" for="identity-name">
            Identity label
          </label>
          <input
            id="identity-name"
            data-testid="identity-name-input"
            class="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="e.g. Trading"
            value={nickname()}
            onInput={(e) => setNickname(e.currentTarget.value)}
          />
          <Show when={error()}>
            <div class="text-xs text-rose-400" data-testid="create-identity-error">
              {error()}
            </div>
          </Show>
          <div class="flex gap-2">
            <button
              type="submit"
              data-testid="create-identity-submit"
              class="hover-wash rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
            >
              Generate keypair
            </button>
            <button
              type="button"
              class="hover-wash rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
              onClick={() => {
                setShowCreate(false);
                setError('');
                setNickname('');
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </Show>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <For each={store.identities}>
          {(identity) => (
            <div
              class="hover-wash rounded-xl border p-4"
              classList={{
                'border-violet-500 bg-violet-500/10': identity.id === store.activeIdentityId,
                'border-slate-700 bg-slate-800/60': identity.id !== store.activeIdentityId,
              }}
              data-testid={`identity-card-${identity.id}`}
            >
              <div class="flex items-center justify-between">
                <div class="font-semibold text-slate-100">{identity.nickname}</div>
                <Show when={identity.id === store.activeIdentityId}>
                  <span class="rounded-full bg-violet-500/30 px-2 py-0.5 text-xs text-violet-200">
                    Active
                  </span>
                </Show>
              </div>
              <div class="mt-2 font-mono text-xs text-slate-400 break-all">{identity.npub}</div>
              <div class="mt-3 flex gap-2">
                <button
                  type="button"
                  data-testid={`select-identity-${identity.id}`}
                  disabled={identity.id === store.activeIdentityId}
                  class="hover-wash rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-40"
                  onClick={() => selectIdentity(identity.id)}
                >
                  Select
                </button>
                <button
                  type="button"
                  class="hover-wash rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                  onClick={() => revealKey(identity.id)}
                >
                  {store.revealedIdentityId === identity.id ? 'Hide nsec' : 'Reveal nsec'}
                </button>
              </div>
              <Show when={store.revealedIdentityId === identity.id}>
                <div class="mt-2 rounded-lg bg-slate-900 px-3 py-2 font-mono text-xs text-rose-300 break-all">
                  {identity.nsec}
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

export default Identities;
