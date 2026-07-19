<script lang="ts">
  import * as store from '../lib/store';

  type Change = {
    id: string;
    author: 'Author A' | 'Author B';
    text: string;
    baseVersion: number;
  };

  const STORAGE_KEY = 'panecraft-collaboration';
  const BASE_CONTENT = 'Shared dashboard notes';
  let showCollab = $state(false);
  let sharedContent = $state(BASE_CONTENT);
  let editorContent = $state('');
  let authorBContent = $state('');
  let queuedChanges = $state<Change[]>([]);
  let appliedIds = $state<string[]>([]);
  let appliedChanges = $state<Change[]>([]);
  let version = $state(0);
  let status = $state('No pending changes.');
  let lastApplied = $state<Change | null>(null);

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (saved && typeof saved.sharedContent === 'string' && Array.isArray(saved.appliedIds)) {
      sharedContent = saved.sharedContent;
      appliedIds = saved.appliedIds;
      appliedChanges = Array.isArray(saved.appliedChanges) ? saved.appliedChanges : [];
      version = Number(saved.version) || 0;
    }
  } catch {
    // The visible scenario still works when persistence is unavailable.
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sharedContent, appliedIds, appliedChanges, version }));
    } catch {
      status = 'Changes applied for this session; browser storage is unavailable.';
    }
  }

  function makeChange(author: Change['author'], text: string): Change | null {
    const cleanText = text.trim();
    if (!cleanText) {
      status = `Enter text for ${author} before queueing a change.`;
      return null;
    }
    return {
      id: `${author === 'Author A' ? 'a' : 'b'}-${Date.now()}-${cleanText.length}`,
      author,
      text: cleanText,
      baseVersion: version,
    };
  }

  function applyChange(change: Change) {
    if (appliedIds.includes(change.id)) {
      status = `Ignored duplicate operation from ${change.author}.`;
      return;
    }
    appliedIds.push(change.id);
    appliedChanges.push(change);
    appliedChanges.sort((left, right) => left.id.localeCompare(right.id));
    sharedContent = [BASE_CONTENT, ...appliedChanges.map((item) => `${item.author}: ${item.text}`)].join('\n');
    version += 1;
    lastApplied = change;
    persist();
  }

  function queueChange(author: Change['author']) {
    const change = makeChange(author, author === 'Author A' ? editorContent : authorBContent);
    if (!change) return;
    if (store.getIsOffline()) {
      queuedChanges.push(change);
      status = `Queued ${author}'s change while offline.`;
    } else {
      applyChange(change);
      status = `Applied ${author}'s change.`;
    }
    if (author === 'Author A') editorContent = '';
    else authorBContent = '';
  }

  function toggleOffline() {
    const newVal = !store.getIsOffline();
    store.setIsOffline(newVal);
    if (!newVal && queuedChanges.length) {
      for (const change of queuedChanges) applyChange(change);
      status = `Go Online completed: merged ${queuedChanges.length} queued changes.`;
      queuedChanges = [];
    } else {
      status = newVal ? 'Go Offline completed. New changes will be queued.' : 'Go Online completed. No changes were queued.';
    }
  }

  function applyQueued(order: 'ab' | 'ba') {
    const ordered = [...queuedChanges].sort((left, right) => {
      const leftRank = left.author === 'Author A' ? 0 : 1;
      const rightRank = right.author === 'Author A' ? 0 : 1;
      return order === 'ab' ? leftRank - rightRank : rightRank - leftRank;
    });
    for (const change of ordered) applyChange(change);
    queuedChanges = [];
    status = `Applied queued changes ${order === 'ab' ? 'A then B' : 'B then A'}; both changes converged.`;
  }

  function detectConflict() {
    if (!editorContent.trim() || !authorBContent.trim()) {
      status = 'Enter different text for both authors to create a conflict.';
      return;
    }
    const localText = editorContent.trim();
    const remoteText = authorBContent.trim();
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
</script>

<div class="flex items-center gap-2">
  <button
    class="px-2 py-1 text-xs border border-[var(--color-border)] rounded-[var(--radius-base)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] whitespace-nowrap"
    onclick={() => showCollab = !showCollab}
  >
    Collaboration Scenario
  </button>
</div>

{#if showCollab}
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="presentation" onclick={() => showCollab = false}>
    <div class="bg-white rounded-[var(--radius-base)] p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-auto" role="dialog" aria-modal="true" aria-labelledby="collaboration-title" onclick={(e) => e.stopPropagation()}>
      <div class="flex items-center justify-between mb-4">
        <h3 id="collaboration-title" class="text-base font-semibold text-[var(--color-text-primary)]">Collaboration Scenario</h3>
        <button aria-label="Close Collaboration Scenario" class="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-lg min-w-8 min-h-8" onclick={() => showCollab = false}>×</button>
      </div>

      <div class="space-y-4">
        <div class="flex gap-2">
          <button
            class="px-3 py-1.5 text-sm rounded-[var(--radius-base)] {store.getIsOffline() ? 'bg-[var(--color-primary)] text-white' : 'bg-white border border-[var(--color-border)] text-[var(--color-text-primary)]'}"
            onclick={toggleOffline}
          >
            {store.getIsOffline() ? 'Go Online' : 'Go Offline'}
          </button>
        </div>

        <div class="text-xs text-[var(--color-text-secondary)]" aria-live="polite">
          {status} Queue: {queuedChanges.length}. Version: {version}.
        </div>

        <div>
          <label for="shared-editor" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Shared editor — Author A</label>
          <textarea
            id="shared-editor"
            class="w-full p-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] min-h-[80px] resize-y"
            bind:value={editorContent}
            placeholder="Author A change"
          ></textarea>
          <button class="mt-2 px-3 py-1.5 text-sm bg-white border border-[var(--color-border)] rounded-[var(--radius-base)]" onclick={() => queueChange('Author A')}>Queue Author A change</button>
        </div>

        <div>
          <label for="author-b-editor" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Independent editor — Author B</label>
          <textarea
            id="author-b-editor"
            class="w-full p-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] min-h-[80px] resize-y"
            bind:value={authorBContent}
            placeholder="Author B change"
          ></textarea>
          <button class="mt-2 px-3 py-1.5 text-sm bg-white border border-[var(--color-border)] rounded-[var(--radius-base)]" onclick={() => queueChange('Author B')}>Queue Author B change</button>
        </div>

        <div class="flex flex-wrap gap-2">
          <button disabled={queuedChanges.length < 2} class="px-3 py-1.5 text-sm bg-white border border-[var(--color-border)] rounded-[var(--radius-base)] disabled:opacity-40" onclick={() => applyQueued('ab')}>Apply A then B</button>
          <button disabled={queuedChanges.length < 2} class="px-3 py-1.5 text-sm bg-white border border-[var(--color-border)] rounded-[var(--radius-base)] disabled:opacity-40" onclick={() => applyQueued('ba')}>Apply B then A</button>
          <button class="px-3 py-1.5 text-sm bg-white border border-[var(--color-border)] rounded-[var(--radius-base)]" onclick={replayLastOperation}>Replay last operation</button>
          <button class="px-3 py-1.5 text-sm bg-white border border-[var(--color-border)] rounded-[var(--radius-base)]" onclick={detectConflict}>Create conflicting change</button>
        </div>

        <div>
          <span class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Shared content</span>
          <div class="p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-base)] text-sm text-[var(--color-text-primary)] min-h-[40px] whitespace-pre-wrap">
            {sharedContent || '(no shared content yet)'}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

{#if store.getConflictResolution()}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" role="presentation" onclick={() => store.setConflictResolution(null)}>
    <div class="bg-white rounded-[var(--radius-base)] p-6 max-w-sm mx-4" role="dialog" aria-modal="true" aria-labelledby="conflict-title" onclick={(e) => e.stopPropagation()}>
      <h3 id="conflict-title" class="text-base font-semibold text-[var(--color-text-primary)] mb-2">Conflict detected</h3>
      <p class="text-sm text-[var(--color-text-secondary)] mb-4">{store.getConflictResolution()?.message}</p>
      <div class="flex gap-2 flex-wrap">
        {#each store.getConflictResolution()?.choices || [] as choice}
          <button
            class="px-3 py-1.5 text-sm bg-white border border-[var(--color-border)] rounded-[var(--radius-base)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
            onclick={choice.action}
          >
            {choice.label}
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}
