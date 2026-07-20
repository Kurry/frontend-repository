import { Component, For, Show } from 'solid-js';
import { store, activeIdentity, grantsFor, toggleAppPermission, bulkGrant, bulkRevoke, APPS } from '../store';
import { Switch } from '@ark-ui/solid';
import { toaster } from '../App';

const Permissions: Component = () => {
  const active = () => activeIdentity();

  return (
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-100">Permissions</h1>
        <p class="text-sm text-slate-400">
          Application access grants for identities in this vault.
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
                      <Switch.Root
                        checked={granted()}
                        onCheckedChange={() => {
                          toggleAppPermission(identity().id, app.id);
                          toaster.create({ title: 'Permission toggled', description: `Access ${granted() ? 'granted' : 'revoked'} for ${app.name}` });
                        }}
                        class="hover-wash relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer"
                        classList={{
                          'bg-emerald-500': granted(),
                          'bg-slate-600': !granted(),
                        }}
                      >
                        <Switch.Control>
                          <Switch.Thumb
                            class="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
                            classList={{
                              'translate-x-6': granted(),
                              'translate-x-1': !granted(),
                            }}
                          />
                        </Switch.Control>
                        <Switch.HiddenInput data-testid={`permission-toggle-${app.id}`} />
                      </Switch.Root>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        )}
      </Show>

      <div>
        <h2 class="text-xl font-semibold text-slate-100 mb-2">All-identities matrix</h2>
        <div class="rounded-xl border border-slate-700 bg-slate-800/60 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm whitespace-nowrap">
              <thead class="bg-slate-900/50">
                <tr>
                  <th class="px-4 py-3 font-medium text-slate-300">Identity</th>
                  <For each={APPS}>
                    {(app) => (
                      <th class="px-4 py-3 font-medium text-slate-300">
                        <div class="flex flex-col gap-1 items-center">
                          <span>{app.name}</span>
                          <div class="flex gap-1 text-[10px]">
                            <button onClick={() => { bulkGrant(app.id); toaster.create({ title: 'Success', description: `Granted all access for ${app.name}`}); }} class="text-emerald-400 hover:text-emerald-300">Grant all</button>
                            <span class="text-slate-600">|</span>
                            <button onClick={() => { bulkRevoke(app.id); toaster.create({ title: 'Success', description: `Revoked all access for ${app.name}`}); }} class="text-rose-400 hover:text-rose-300">Revoke all</button>
                          </div>
                        </div>
                      </th>
                    )}
                  </For>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-700/50">
                <For each={store.identities}>
                  {(identity) => (
                    <tr>
                      <td class="px-4 py-3 font-medium text-slate-200">
                        {identity.nickname}
                        <Show when={identity.id === store.activeIdentityId}>
                          <span class="ml-2 rounded-full bg-violet-500/30 px-2 py-0.5 text-[10px] text-violet-200">Active</span>
                        </Show>
                      </td>
                      <For each={APPS}>
                        {(app) => {
                          const granted = () => grantsFor(identity.id)[app.id];
                          return (
                            <td class="px-4 py-3 text-center">
                                <Switch.Root
                                  checked={granted()}
                                  onCheckedChange={() => {
                                    toggleAppPermission(identity.id, app.id);
                                    toaster.create({ title: 'Permission toggled', description: `Access ${granted() ? 'granted' : 'revoked'} for ${app.name}` });
                                  }}
                                  class="hover-wash relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer"
                                  classList={{
                                    'bg-emerald-500': granted(),
                                    'bg-slate-600': !granted(),
                                  }}
                                  aria-label={`${app.name} access for ${identity.nickname}`}
                                >
                                  <Switch.Control>
                                    <Switch.Thumb
                                      class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                                      classList={{
                                        'translate-x-[18px]': granted(),
                                        'translate-x-1': !granted(),
                                      }}
                                    />
                                  </Switch.Control>
                                  <Switch.HiddenInput />
                                </Switch.Root>
                            </td>
                          );
                        }}
                      </For>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Permissions;
