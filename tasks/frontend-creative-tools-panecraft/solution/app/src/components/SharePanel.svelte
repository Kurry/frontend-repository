<script lang="ts">
  import * as store from '../lib/store';
  import Modal from './Modal.svelte';

  let shareAccess = $state<store.ShareAccess>('private');
  let copied = $state(false);
  let copyTimer: ReturnType<typeof setTimeout> | null = null;

  const open = $derived(store.getShowSharePanel());
  const activePage = $derived(store.getActivePage());
  const shareLink = $derived(`panecraft.local/view/${activePage.id}`);

  function close() {
    store.setShowSharePanel(false);
    copied = false;
    if (copyTimer) clearTimeout(copyTimer);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareLink);
    } catch {
      const input = document.createElement('textarea');
      input.value = shareLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    copied = true;
    store.announce('Share link copied to clipboard.');
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copied = false;
    }, 2000);
  }
</script>

<Modal
  open={open}
  heading="Share Page"
  labelledBy="share-title"
  widthClass="max-w-md"
  onClose={close}
>
  <div class="p-6 space-y-4">
    <div>
      <label for="share-link-value" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Share Link</label>
      <div class="flex items-center gap-2">
        <output
          id="share-link-value"
          class="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-base)] font-mono text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface)] truncate"
        >{shareLink}</output>
        <button
          type="button"
          class="copy-control tap-target px-3 py-2 text-sm rounded-[var(--radius-base)] whitespace-nowrap {copied
            ? 'copy-flash'
            : 'bg-[var(--color-primary)] text-white hover:opacity-90'}"
          onclick={copyLink}
        >
          {copied ? 'Link Copied!' : 'Copy Link'}
        </button>
      </div>
      <div aria-live="polite">
        {#if copied}
          <p class="text-xs mt-1" style="color: var(--color-accent);">Share link copied to clipboard.</p>
        {/if}
      </div>
    </div>

    <div>
      <span class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Access</span>
      <div class="flex gap-2" role="group" aria-label="Share access level">
        <button
          type="button"
          class="tap-target px-3 py-1.5 text-sm rounded-[var(--radius-base)] transition-colors {shareAccess === 'public'
            ? 'bg-[var(--color-accent)] text-white font-semibold'
            : 'bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)]'}"
          aria-pressed={shareAccess === 'public'}
          onclick={() => (shareAccess = 'public')}
        >Public</button>
        <button
          type="button"
          class="tap-target px-3 py-1.5 text-sm rounded-[var(--radius-base)] transition-colors {shareAccess === 'private'
            ? 'bg-[var(--color-primary)] text-white font-semibold'
            : 'bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)]'}"
          aria-pressed={shareAccess === 'private'}
          onclick={() => (shareAccess = 'private')}
        >Private</button>
      </div>
    </div>

    <p class="text-xs text-[var(--color-text-secondary)]" aria-live="polite">
      {shareAccess === 'public'
        ? 'Anyone with the link can view this page.'
        : 'Only you can view this page.'}
    </p>
  </div>

  <div class="px-6 py-4 border-t border-[var(--color-border)] flex justify-end">
    <button
      type="button"
      class="tap-target px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius-base)] hover:opacity-90 transition-opacity"
      onclick={close}
    >Done</button>
  </div>
</Modal>
