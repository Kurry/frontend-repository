import { Component, For, Show, createSignal } from 'solid-js';
import { createForm } from '@felte/solid';
import { validator } from '@felte/validator-zod';
import { z } from 'zod';
import { Dialog } from '@ark-ui/solid';
import { store, createIdentity, selectIdentity, revealKey, deleteIdentity, renameIdentity, rotateIdentityKeys } from '../store';
import { animate } from 'motion';
import { toaster } from '../App';

const identitySchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, 'Label cannot be empty.')
    .max(40, 'Label cannot exceed 40 characters.'),
});

const Identities: Component = () => {
  const [showCreate, setShowCreate] = createSignal(false);
  const [editingId, setEditingId] = createSignal<string | null>(null);

  const {
    form: createFormHandler,
    errors: createErrors,
    reset: resetCreate,
    isSubmitting: isCreating
  } = createForm({
    extend: validator({ schema: identitySchema }),
    onSubmit: (values) => {
      createIdentity(values.label);
      setShowCreate(false);
      resetCreate();
      toaster.create({ title: 'Success', description: 'Identity created successfully' });
    },
  });

  const {
    form: renameFormHandler,
    errors: renameErrors,
    setInitialValues: setRenameInitial
  } = createForm({
    extend: validator({ schema: identitySchema }),
    onSubmit: (values) => {
      if (editingId()) {
         renameIdentity(editingId()!, values.label);
      }
      setEditingId(null);
    },
  });

  const startRename = (id: string, currentLabel: string) => {
    setEditingId(id);
    setRenameInitial({ label: currentLabel });
  };

  const handleEntrance = (el: Element) => {
    animate(el, { opacity: [0, 1], y: [10, 0] }, { duration: 0.2 });
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
          ref={createFormHandler}
          class="rounded-xl border border-slate-700 bg-slate-800/60 p-4 space-y-3"
          data-testid="create-identity-form"
        >
          <label class="block text-xs text-slate-400" for="identity-name">
            Identity label
          </label>
          <input
            id="identity-name"
            name="label"
            data-testid="identity-name-input"
            class="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="e.g. Trading"
          />
          <div aria-live="polite" class="text-xs text-rose-400" data-testid="create-identity-error">
            <Show when={createErrors().label}>
              {(err) => <span>{err()[0]}</span>}
            </Show>
          </div>
          <div class="flex gap-2">
            <button
              type="submit"
              disabled={isCreating() || !!createErrors().label}
              data-testid="create-identity-submit"
              class="hover-wash rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
            >
              Generate keypair
            </button>
            <button
              type="button"
              class="hover-wash rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
              onClick={() => {
                setShowCreate(false);
                resetCreate();
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
              ref={(el) => {
                const isReduced = window.matchMedia(`(prefers-reduced-motion: reduce)`).matches;
                if (!isReduced) handleEntrance(el);
              }}
              class="hover-wash rounded-xl border p-4"
              classList={{
                'border-violet-500 bg-violet-500/10': identity.id === store.activeIdentityId,
                'border-slate-700 bg-slate-800/60': identity.id !== store.activeIdentityId,
              }}
              data-testid={`identity-card-${identity.id}`}
            >
              <div class="flex items-center justify-between">
                <Show when={editingId() === identity.id} fallback={
                  <div class="flex items-center gap-2 max-w-full overflow-hidden">
                     <div class="font-semibold text-slate-100 truncate break-words" title={identity.nickname}>{identity.nickname}</div>
                     <button onClick={() => startRename(identity.id, identity.nickname)} class="text-xs text-slate-400 hover:text-slate-200">Rename</button>
                  </div>
                }>
                  <form ref={renameFormHandler} class="flex items-center gap-2 max-w-full">
                     <input name="label" class="flex-1 w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                     <button type="submit" disabled={!!renameErrors().label} class="text-xs bg-slate-700 px-2 py-1 rounded text-white disabled:opacity-50">Save</button>
                     <button type="button" onClick={() => setEditingId(null)} class="text-xs px-2 py-1">Cancel</button>
                  </form>
                </Show>
                <Show when={identity.id === store.activeIdentityId}>
                  <span class="rounded-full bg-violet-500/30 px-2 py-0.5 text-xs text-violet-200 shrink-0">
                    Active
                  </span>
                </Show>
              </div>
              <div aria-live="polite" class="text-xs text-rose-400 mt-1">
                <Show when={editingId() === identity.id && renameErrors().label}>
                  {(err) => <span>{err()[0]}</span>}
                </Show>
              </div>

              <div class="mt-2 font-mono text-xs text-slate-400 break-all">{identity.npub}</div>
              <div class="mt-3 flex flex-wrap gap-2">
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

                <Dialog.Root>
                  <Dialog.Trigger class="hover-wash rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700">
                    Rotate
                  </Dialog.Trigger>
                  <Dialog.Backdrop class="fixed inset-0 bg-black/60 z-40 motion-safe:animate-in motion-safe:fade-in" />
                  <Dialog.Positioner class="fixed inset-0 flex items-center justify-center p-4 z-50">
                    <Dialog.Content class="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl max-w-sm w-full motion-safe:animate-in motion-safe:zoom-in-95">
                      <Dialog.Title class="text-lg font-semibold text-slate-100 mb-2">Rotate Keys?</Dialog.Title>
                      <Dialog.Description class="text-sm text-slate-400 mb-6">
                        This will generate a new keypair for {identity.nickname}. The old keys will be lost permanently.
                      </Dialog.Description>
                      <div class="flex justify-end gap-3">
                        <Dialog.CloseTrigger class="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700">Cancel</Dialog.CloseTrigger>
                        <Dialog.CloseTrigger onClick={() => rotateIdentityKeys(identity.id)} class="px-4 py-2 rounded-lg text-sm font-medium bg-rose-600 text-white hover:bg-rose-500">Rotate</Dialog.CloseTrigger>
                      </div>
                    </Dialog.Content>
                  </Dialog.Positioner>
                </Dialog.Root>

                <Dialog.Root>
                  <Dialog.Trigger disabled={store.identities.length <= 1} class="hover-wash rounded-lg border border-rose-900/50 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20 disabled:opacity-40 ml-auto">
                    Delete
                  </Dialog.Trigger>
                  <Dialog.Backdrop class="fixed inset-0 bg-black/60 z-40 motion-safe:animate-in motion-safe:fade-in" />
                  <Dialog.Positioner class="fixed inset-0 flex items-center justify-center p-4 z-50">
                    <Dialog.Content class="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl max-w-sm w-full motion-safe:animate-in motion-safe:zoom-in-95">
                      <Dialog.Title class="text-lg font-semibold text-slate-100 mb-2">Delete Identity?</Dialog.Title>
                      <Dialog.Description class="text-sm text-slate-400 mb-6">
                        Are you sure you want to delete {identity.nickname}? This action cannot be undone.
                      </Dialog.Description>
                      <div class="flex justify-end gap-3">
                        <Dialog.CloseTrigger class="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700">Cancel</Dialog.CloseTrigger>
                        <Dialog.CloseTrigger onClick={() => deleteIdentity(identity.id)} class="px-4 py-2 rounded-lg text-sm font-medium bg-rose-600 text-white hover:bg-rose-500">Delete</Dialog.CloseTrigger>
                      </div>
                    </Dialog.Content>
                  </Dialog.Positioner>
                </Dialog.Root>
                <Show when={store.identities.length <= 1}>
                  <span class="basis-full text-xs text-rose-400" role="status">
                    At least one identity must remain.
                  </span>
                </Show>
              </div>
              <Show when={store.revealedIdentityId === identity.id}>
                <div class="mt-2 rounded-lg bg-slate-900 px-3 py-2 font-mono text-xs text-rose-300 break-all motion-safe:animate-in motion-safe:fade-in">
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
