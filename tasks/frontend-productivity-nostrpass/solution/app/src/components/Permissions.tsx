import { Component, For, Show } from 'solid-js';
import { store, activeIdentity, grantsFor, toggleAppPermission, APPS } from '../store';

const Permissions: Component = () => {
  const active = () => activeIdentity();

  return (
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-100">Permissions</h1>
        <p class="text-sm text-slate-400">
          Application access grants for the active identity only.
        </p>
      </div>

      <Show when={active()}>
        {(identity) => (
          <div class="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
            <div class="text-sm text-slate-300 mb-4">
              Editing permissions for{' '}
              <span class="font-semibold text-violet-300">{identity().nickname}</span>
            </div>
            <div class="divide-y divide-slate-700">
              <For each={APPS}>
                {(app) => {
                  const granted = () => grantsFor(identity().id)[app.id];
                  return (
                    <div class="flex items-center justify-between py-3">
                      <div>
                        <div class="font-medium text-slate-100">{app.name}</div>
                        <div class="text-xs text-slate-400">
                          {granted() ? 'Allowed to request public key and events' : 'Access revoked'}
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={granted()}
                        data-testid={`permission-toggle-${app.id}`}
                        onClick={() => toggleAppPermission(identity().id, app.id)}
                        class="hover-wash relative inline-flex h-7 w-12 items-center rounded-full transition-colors"
                        classList={{
                          'bg-emerald-500': granted(),
                          'bg-slate-600': !granted(),
                        }}
                      >
                        <span
                          class="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
                          classList={{
                            'translate-x-6': granted(),
                            'translate-x-1': !granted(),
                          }}
                        />
                      </button>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        )}
      </Show>
    </div>
  );
};

export default Permissions;
