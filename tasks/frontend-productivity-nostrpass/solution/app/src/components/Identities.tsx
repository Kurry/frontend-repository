import { Component, For, Show, createSignal } from 'solid-js';
import { createForm } from '@felte/solid';
import { validator } from '@felte/validator-zod';
import { Dialog } from '@ark-ui/solid';
import {
  store,
  createIdentity,
  selectIdentity,
  revealKey,
  deleteIdentity,
  renameIdentity,
  rotateIdentityKeys,
  filteredIdentities,
  setSearchQuery,
  setSortOrder,
  setBackupDrawerIdentityId,
} from '../store';
import { identityFormSchema, validateLabelInput } from '../validation';
import { animate } from 'motion';
import { toaster } from '../App';

const Identities: Component = () => {
  const [showCreate, setShowCreate] = createSignal(false);
  const [editingId, setEditingId] = createSignal<string | null>(null);
  const [createLabelError, setCreateLabelError] = createSignal<string | null>(null);
  const [renameLabelError, setRenameLabelError] = createSignal<string | null>(null);
  const [dialogClosing, setDialogClosing] = createSignal(false);

  const [createLabel, setCreateLabel] = createSignal('');

  const {
    form: createFormHandler,
    reset: resetCreate,
    isSubmitting: isCreating,
  } = createForm({
    extend: validator({ schema: identityFormSchema }),
    onSubmit: (values) => {
      createIdentity(values.label);
      setShowCreate(false);
      resetCreate();
      setCreateLabelError(null);
      toaster.create({ title: 'Success', description: 'Identity created successfully' });
    },
  });

  const [renameLabel, setRenameLabel] = createSignal('');

  const {
    form: renameFormHandler,
    setInitialValues: setRenameInitial,
  } = createForm({
    extend: validator({ schema: identityFormSchema }),
    onSubmit: (values) => {
      if (editingId()) {
        renameIdentity(editingId()!, values.label);
        toaster.create({ title: 'Success', description: 'Identity renamed successfully' });
      }
      setEditingId(null);
      setRenameLabelError(null);
    },
  });

  const startRename = (id: string, currentLabel: string) => {
    setEditingId(id);
    setRenameInitial({ label: currentLabel });
    setRenameLabel(currentLabel);
    setRenameLabelError(null);
  };

  const handleEntrance = (el: Element) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    animate(el, { opacity: [0, 1], y: [10, 0] }, { duration: 0.2 });
  };

  const onCreateInput = (value: string) => {
    setCreateLabel(value);
    setCreateLabelError(validateLabelInput(value));
  };

  const onRenameInput = (value: string) => {
    setRenameLabel(value);
    setRenameLabelError(validateLabelInput(value));
  };

  const createDisabled = () =>
    isCreating() || store.isCreatingIdentity || !!createLabelError() || !createLabel().trim();

  const closeDialog = (after?: () => void) => {
    setDialogClosing(true);
    window.setTimeout(() => {
      setDialogClosing(false);
      after?.();
    }, 180);
  };

  const visible = () => filteredIdentities();
  const emptySearch = () => store.searchQuery.trim().length > 0 && visible().length === 0;

  return (
    <div class="space-y-6 max-w-full overflow-x-hidden">
      <div class="flex flex-wrap items-center justify-between gap-3">
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

      <div class="flex flex-wrap gap-3 items-center">
        <label class="flex-1 min-w-[200px]">
          <span class="sr-only">Search identities</span>
          <input
            type="search"
            data-testid="identity-search"
            value={store.searchQuery}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
            placeholder="Search by label or npub"
            class="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          />
        </label>
        <label class="text-sm text-slate-400 flex items-center gap-2">
          Sort
          <select
            data-testid="identity-sort"
            class="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            value={store.sortOrder}
            onChange={(e) => setSortOrder(e.currentTarget.value as 'label-asc' | 'label-desc')}
          >
            <option value="label-asc">Label A–Z</option>
            <option value="label-desc">Label Z–A</option>
          </select>
        </label>
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
            value={createLabel()}
            onInput={(e) => onCreateInput(e.currentTarget.value)}
            class="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="e.g. Trading"
          />
          <div aria-live="polite" role="status" class="text-xs text-rose-400" data-testid="create-identity-error">
            <Show when={createLabelError()}>{(err) => <span>{err()}</span>}</Show>
          </div>
          <div class="flex gap-2">
            <button
              type="submit"
              disabled={createDisabled()}
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
                setCreateLabelError(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </Show>

      <Show when={emptySearch()}>
        <div class="rounded-xl border border-slate-700 bg-slate-800/60 p-6 text-center text-sm text-slate-400">
          No identities match your search. Clear the search field to show every identity.
          <button
            type="button"
            class="block mx-auto mt-3 text-violet-300 hover:text-violet-200"
            onClick={() => setSearchQuery('')}
          >
            Clear search
          </button>
        </div>
      </Show>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <For each={visible()}>
          {(identity) => (
            <div
              ref={handleEntrance}
              class="hover-wash rounded-xl border p-4 max-w-full overflow-hidden"
              classList={{
                'border-violet-500 bg-violet-500/10': identity.id === store.activeIdentityId,
                'border-slate-700 bg-slate-800/60': identity.id !== store.activeIdentityId,
              }}
              data-testid={`identity-card-${identity.id}`}
            >
              <div class="flex items-start justify-between gap-2">
                <Show
                  when={editingId() === identity.id}
                  fallback={
                    <div class="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        class="font-semibold text-slate-100 truncate break-words min-w-0"
                        title={identity.nickname}
                      >
                        {identity.nickname}
                      </div>
                      <button
                        type="button"
                        onClick={() => startRename(identity.id, identity.nickname)}
                        class="text-xs text-slate-400 hover:text-slate-200 shrink-0"
                      >
                        Rename
                      </button>
                    </div>
                  }
                >
                  <form ref={renameFormHandler} class="flex flex-col gap-1 min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <input
                        name="label"
                        value={renameLabel()}
                        onInput={(e) => onRenameInput(e.currentTarget.value)}
                        class="flex-1 min-w-0 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100"
                      />
                      <button
                        type="submit"
                        disabled={!!renameLabelError()}
                        class="text-xs bg-slate-700 px-2 py-1 rounded text-white disabled:opacity-50 shrink-0"
                      >
                        Save label
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} class="text-xs px-2 py-1 shrink-0">
                        Cancel
                      </button>
                    </div>
                    <div aria-live="polite" role="status" class="text-xs text-rose-400">
                      <Show when={renameLabelError()}>{(err) => <span>{err()}</span>}</Show>
                    </div>
                  </form>
                </Show>
                <Show when={identity.id === store.activeIdentityId}>
                  <span class="rounded-full bg-violet-500/30 px-2 py-0.5 text-xs text-violet-200 shrink-0">Active</span>
                </Show>
              </div>

              <div class="mt-2 font-mono text-xs text-slate-400 break-all overflow-hidden">{identity.npub}</div>
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
                  aria-label={
                    store.revealedIdentityId === identity.id
                      ? `Hide private key for ${identity.nickname}`
                      : `Reveal private key for ${identity.nickname}`
                  }
                >
                  {store.revealedIdentityId === identity.id ? 'Hide nsec' : 'Reveal nsec'}
                </button>
                <button
                  type="button"
                  class="hover-wash rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                  onClick={() => setBackupDrawerIdentityId(identity.id)}
                >
                  Export backup
                </button>

                <Dialog.Root>
                  <Dialog.Trigger class="hover-wash rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700">
                    Rotate keys
                  </Dialog.Trigger>
                  <Dialog.Backdrop class="fixed inset-0 bg-black/60 z-40 dialog-backdrop" classList={{ 'dialog-closing': dialogClosing() }} />
                  <Dialog.Positioner class="fixed inset-0 flex items-center justify-center p-4 z-50">
                    <Dialog.Content class="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl max-w-sm w-full dialog-panel" classList={{ 'dialog-closing': dialogClosing() }}>
                      <Dialog.Title class="text-lg font-semibold text-slate-100 mb-2">Rotate keys?</Dialog.Title>
                      <Dialog.Description class="text-sm text-slate-400 mb-6">
                        This will generate a new keypair for {identity.nickname}. The old keys will be lost permanently.
                      </Dialog.Description>
                      <div class="flex justify-end gap-3">
                        <Dialog.CloseTrigger class="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700">Cancel</Dialog.CloseTrigger>
                        <Dialog.CloseTrigger
                          onClick={() => {
                            rotateIdentityKeys(identity.id);
                            toaster.create({ title: 'Success', description: 'Keys rotated successfully.' });
                          }}
                          class="px-4 py-2 rounded-lg text-sm font-medium bg-rose-600 text-white hover:bg-rose-500"
                        >
                          Rotate
                        </Dialog.CloseTrigger>
                      </div>
                    </Dialog.Content>
                  </Dialog.Positioner>
                </Dialog.Root>

                <Dialog.Root>
                  <Dialog.Trigger
                    disabled={store.identities.length <= 1}
                    class="hover-wash rounded-lg border border-rose-900/50 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20 disabled:opacity-40 ml-auto"
                  >
                    Delete
                  </Dialog.Trigger>
                  <Dialog.Backdrop class="fixed inset-0 bg-black/60 z-40 dialog-backdrop" classList={{ 'dialog-closing': dialogClosing() }} />
                  <Dialog.Positioner class="fixed inset-0 flex items-center justify-center p-4 z-50">
                    <Dialog.Content class="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl max-w-sm w-full dialog-panel" classList={{ 'dialog-closing': dialogClosing() }}>
                      <Dialog.Title class="text-lg font-semibold text-slate-100 mb-2">Delete identity?</Dialog.Title>
                      <Dialog.Description class="text-sm text-slate-400 mb-6">
                        Are you sure you want to delete {identity.nickname}? This action cannot be undone.
                      </Dialog.Description>
                      <div class="flex justify-end gap-3">
                        <Dialog.CloseTrigger class="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700">Cancel</Dialog.CloseTrigger>
                        <Dialog.CloseTrigger
                          onClick={() => {
                            deleteIdentity(identity.id);
                            toaster.create({ title: 'Success', description: 'Identity deleted.' });
                          }}
                          class="px-4 py-2 rounded-lg text-sm font-medium bg-rose-600 text-white hover:bg-rose-500"
                        >
                          Delete
                        </Dialog.CloseTrigger>
                      </div>
                    </Dialog.Content>
                  </Dialog.Positioner>
                </Dialog.Root>
              </div>
              <Show when={store.identities.length <= 1}>
                <span class="mt-2 block text-xs text-rose-400" role="status">
                  At least one identity must remain.
                </span>
              </Show>
              <Show when={store.revealedIdentityId === identity.id}>
                <div class="mt-2 rounded-lg bg-slate-900 px-3 py-2 font-mono text-xs text-rose-300 break-all overflow-hidden key-reveal">
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
