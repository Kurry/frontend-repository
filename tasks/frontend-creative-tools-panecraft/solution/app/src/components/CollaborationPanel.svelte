<script lang="ts">
  import * as store from '../lib/store';
  import Modal from './Modal.svelte';

  type Change = {
    id: string;
    author: 'Author A' | 'Author B';
    text: string;
    baseVersion: number;
  };

  const BASE_CONTENT = 'Shared dashboard notes';
  let sharedContent = $state(BASE_CONTENT);
  let editorContent = $state('');
  let authorBContent = $state('');
  let queuedChanges = $state<Change[]>([]);
  let appliedIds = $state<string[]>([]);
  let appliedChanges = $state<Change[]>([]);
  let version = $state(0);
  let status = $state('No pending changes.');
  let lastApplied = $state<Change | null>(null);
  let changeCounter = 0;

  const saved = store.loadCollaboration<{
    sharedContent?: string;
    appliedIds?: string[];
    appliedChanges?: Change[];
    version?: number;
  }>();
  if (saved && typeof saved.sharedContent === 'string' && Array.isArray(saved.appliedIds)) {
    sharedContent = saved.sharedContent;
    appliedIds = saved.appliedIds;
    appliedChanges = Array.isArray(saved.appliedChanges) ? saved.appliedChanges : [];
    version = Number(saved.version) || 0;
  }

  function persist() {
    store.persistCollaboration({ sharedContent, appliedIds, appliedChanges, version });
  }

  function makeChange(author: Change['author'], text: string): Change | null {
    const cleanText = text.trim();
    if (!cleanText) {
      status = `Enter text for ${author} before queueing a change.`;
      return null;
    }
    changeCounter += 1;
    return {
      id: `${author === 'Author A' ? 'a' : 'b'}-${changeCounter}-${cleanText.length}`,
      author,
      text: cleanText,
      baseVersion: version,
    };
  }

  // Changes merge by stable operation identity: applying in any order sorts by
  // id before rendering, so both delivery orders converge to identical content,
  // and replaying an already-applied operation is ignored as a duplicate.
  function applyChange(change: Change): boolean {
    if (appliedIds.includes(change.id)) {
      status = `Ignored duplicate operation from ${change.author} (already applied).`;
      return false;
    }
    appliedIds = [...appliedIds, change.id];
    appliedChanges = [...appliedChanges, change].sort((left, right) => left.id.localeCompare(right.id));
    sharedContent = [BASE_CONTENT, ...appliedChanges.map((item) => `${item.author}: ${item.text}`)].join('\n');
    version += 1;
    lastApplied = change;
    persist();
    return true;
  }

  function queueChange(author: Change['author']) {
    const change = makeChange(author, author === 'Author A' ? editorContent : authorBContent);
    if (!change) return;
    if (store.getIsOffline()) {
      queuedChanges = [...queuedChanges, change];
      status = `Queued ${author}'s change while offline.`;
    } else if (applyChange(change)) {
      status = `Applied ${author}'s change.`;
    }
    if (author === 'Author A') editorContent = '';
    else authorBContent = '';
  }

  function toggleOffline() {
    const nextOffline = !store.getIsOffline();
    store.setIsOffline(nextOffline);
    if (!nextOffline && queuedChanges.length) {
      const pending = queuedChanges;
      queuedChanges = [];
      let merged = 0;
      for (const change of pending) {
        if (applyChange(change)) merged += 1;
      }
      status = `Went online: merged ${merged} queued change(s). Both authors' edits are in the Shared content.`;
    } else {
      status = nextOffline
        ? 'Went offline. New changes will be queued until reconnect.'
        : 'Went online. No changes were queued.';
    }
  }

  function applyQueued(order: 'ab' | 'ba') {
    const ordered = [...queuedChanges].sort((left, right) => {
      const leftRank = left.author === 'Author A' ? 0 : 1;
      const rightRank = right.author === 'Author A' ? 0 : 1;
      return order === 'ab' ? leftRank - rightRank : rightRank - leftRank;
    });
    queuedChanges = [];
    for (const change of ordered) applyChange(change);
    status = `Applied queued changes (${order === 'ab' ? 'Author A then Author B' : 'Author B then Author A'}). The converged Shared content is identical in either order.`;
  }

  function detectConflict() {
    const localText = editorContent.trim();
    const remoteText = authorBContent.trim();
    if (!localText || !remoteText) {
      status = 'Enter different text for both authors to create a conflict.';
      return;
    }
    store.setConflictResolution({
      message: 'Both authors changed the same shared note. Choose the value to keep.',
      choices: [
        { label: 'Keep Author A', action: () => resolveConflict(`Author A: ${localText}`) },
        { label: 'Keep Author B', action: () => resolveConflict(`Author B: ${remoteText}`) },
        { label: 'Merge Both', action: () => resolveConflict(`Author A: ${localText}\nAuthor B: ${remoteText}`) },
      ],
    });
  }

  function resolveConflict(result: string) {
    sharedContent = result;
    appliedChanges = [];
    appliedIds = [];
    version += 1;
    editorContent = '';
    authorBContent = '';
    status = 'Conflict resolved by explicit choice.';
    store.setConflictResolution(null);
    persist();
  }

  function replayLastOperation() {
    if (!lastApplied) {
      status = 'Apply a change before replaying an operation.';
      return;
    }
    applyChange(lastApplied);
  }

  const open = $derived(store.getShowCollaboration());
</script>

<button
  type="button"
  class="tap-target px-2.5 py-1.5 text-xs border border-[var(--color-border)] rounded-[var(--radius-base)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors whitespace-nowrap"
  aria-expanded={open}
  onclick={() => store.setShowCollaboration(!open)}
>
  Collaboration Scenario
</button>

<Modal
  open={open}
  heading="Collaboration Scenario"
  labelledBy="collaboration-title"
  widthClass="max-w-lg"
  onClose={() => store.setShowCollaboration(false)}
>
  <div class="p-6 space-y-4">
    <div class="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        class="tap-target px-3 py-1.5 text-sm rounded-[var(--radius-base)] transition-colors {store.getIsOffline()
          ? 'bg-[var(--color-primary)] text-white font-semibold'
          : 'bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)]'}"
        onclick={toggleOffline}
      >
        {store.getIsOffline() ? 'Go Online' : 'Go Offline'}
      </button>
      <span class="text-xs text-[var(--color-text-secondary)]">
        {store.getIsOffline() ? 'Offline — new changes queue until reconnect.' : 'Online — changes apply immediately.'}
      </span>
    </div>

    <p class="text-xs text-[var(--color-text-secondary)]" aria-live="polite">
      {status} Queue: {queuedChanges.length}. Version: {version}.
    </p>

    <div>
      <label for="shared-editor" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Shared editor — Author A</label>
      <textarea
        id="shared-editor"
        class="w-full p-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] min-h-[70px] resize-y"
        bind:value={editorContent}
        placeholder="Author A change"
      ></textarea>
      <button
        type="button"
        class="tap-target mt-2 px-3 py-1.5 text-sm bg-white border border-[var(--color-border)] rounded-[var(--radius-base)] hover:border-[var(--color-primary)] transition-colors"
        onclick={() => queueChange('Author A')}
      >Queue Author A change</button>
    </div>

    <div>
      <label for="author-b-editor" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Independent editor — Author B</label>
      <textarea
        id="author-b-editor"
        class="w-full p-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] min-h-[70px] resize-y"
        bind:value={authorBContent}
        placeholder="Author B change"
      ></textarea>
      <button
        type="button"
        class="tap-target mt-2 px-3 py-1.5 text-sm bg-white border border-[var(--color-border)] rounded-[var(--radius-base)] hover:border-[var(--color-primary)] transition-colors"
        onclick={() => queueChange('Author B')}
      >Queue Author B change</button>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="tap-target px-3 py-1.5 text-sm bg-white border border-[var(--color-border)] rounded-[var(--radius-base)] disabled:opacity-40 hover:border-[var(--color-primary)] transition-colors"
        disabled={queuedChanges.length < 2}
        onclick={() => applyQueued('ab')}
      >Apply A then B</button>
      <button
        type="button"
        class="tap-target px-3 py-1.5 text-sm bg-white border border-[var(--color-border)] rounded-[var(--radius-base)] disabled:opacity-40 hover:border-[var(--color-primary)] transition-colors"
        disabled={queuedChanges.length < 2}
        onclick={() => applyQueued('ba')}
      >Apply B then A</button>
      <button
        type="button"
        class="tap-target px-3 py-1.5 text-sm bg-white border border-[var(--color-border)] rounded-[var(--radius-base)] hover:border-[var(--color-primary)] transition-colors"
        onclick={replayLastOperation}
      >Replay last operation</button>
      <button
        type="button"
        class="tap-target px-3 py-1.5 text-sm bg-white border border-[var(--color-border)] rounded-[var(--radius-base)] hover:border-[var(--color-primary)] transition-colors"
        onclick={detectConflict}
      >Create conflicting change</button>
    </div>

    <div>
      <span class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Shared content</span>
      <div class="p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-base)] text-sm text-[var(--color-text-primary)] min-h-[40px] whitespace-pre-wrap" aria-live="polite">
        {sharedContent || '(no shared content yet)'}
      </div>
    </div>
  </div>
</Modal>

{#if store.getConflictResolution()}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4" role="presentation" onclick={() => store.setConflictResolution(null)}>
    <div class="overlay-panel is-open p-6 max-w-sm w-full" role="dialog" aria-modal="true" aria-labelledby="conflict-title" onclick={(event) => event.stopPropagation()}>
      <h2 id="conflict-title" class="text-base font-semibold text-[var(--color-text-primary)] mb-2">Conflict detected</h2>
      <p class="text-sm text-[var(--color-text-secondary)] mb-4">{store.getConflictResolution()?.message}</p>
      <div class="flex gap-2 flex-wrap">
        {#each store.getConflictResolution()?.choices || [] as choice}
          <button
            type="button"
            class="tap-target px-3 py-1.5 text-sm bg-white border border-[var(--color-border)] rounded-[var(--radius-base)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
            onclick={choice.action}
          >
            {choice.label}
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}
