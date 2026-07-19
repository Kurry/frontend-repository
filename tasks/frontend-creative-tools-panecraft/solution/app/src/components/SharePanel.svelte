<script lang="ts">
  import * as store from '../lib/store';
  
  let shareAccess = $state<store.ShareAccess>('private');
  let copied = $state(false);
  
  const activePage = $derived(store.getActivePage());
  const shareLink = $derived(`panecraft.local/view/${activePage.id}`);
  
  function close() {
    store.setShowSharePanel(false);
    copied = false;
  }
  
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareLink);
      copied = true;
      setTimeout(() => copied = false, 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      copied = true;
      setTimeout(() => copied = false, 2000);
    }
  }
</script>

<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="presentation" onclick={close}>
  <div class="bg-white rounded-[var(--radius-base)] w-full max-w-md shadow-xl" role="dialog" aria-modal="true" aria-labelledby="share-title" onclick={(e) => e.stopPropagation()}>
    <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
      <h2 id="share-title" class="text-lg font-semibold text-[var(--color-text-primary)]">Share Page</h2>
      <button aria-label="Close Share Page" class="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xl min-w-8 min-h-8" onclick={close}>×</button>
    </div>
    
    <div class="p-6 space-y-4">
      <div>
        <label class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Share Link</label>
        <div class="flex items-center gap-2">
          <div class="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-base)] font-mono text-sm text-[var(--color-text-secondary)] bg-[var(--color-surface)] truncate">
            {shareLink}
          </div>
          <button 
            aria-live="polite"
            class="px-3 py-2 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius-base)] hover:opacity-90 whitespace-nowrap transition-all {copied ? 'bg-[var(--color-accent)]' : ''}"
            onclick={copyLink}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
      
      <div>
        <label class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">Access</label>
        <div class="flex gap-2">
          <button 
            aria-pressed={shareAccess === 'public'}
            class="px-3 py-1.5 text-sm rounded-[var(--radius-base)] {shareAccess === 'public' ? 'bg-[var(--color-accent)] text-white' : 'bg-white border border-[var(--color-border)] text-[var(--color-text-primary)]'}"
            onclick={() => shareAccess = 'public'}
          >Public</button>
          <button 
            aria-pressed={shareAccess === 'private'}
            class="px-3 py-1.5 text-sm rounded-[var(--radius-base)] {shareAccess === 'private' ? 'bg-[var(--color-primary)] text-white' : 'bg-white border border-[var(--color-border)] text-[var(--color-text-primary)]'}"
            onclick={() => shareAccess = 'private'}
          >Private</button>
        </div>
      </div>
      
      <p class="text-xs text-[var(--color-text-secondary)]">
        {shareAccess === 'public' 
          ? 'Anyone with the link can view this page.' 
          : 'Only you can view this page.'}
      </p>
    </div>
    
    <div class="px-6 py-4 border-t border-[var(--color-border)] flex justify-end">
      <button class="px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius-base)] hover:opacity-90" onclick={close}>Done</button>
    </div>
  </div>
</div>
