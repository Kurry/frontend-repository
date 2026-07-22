<script lang="ts">
  import { store, addToast } from '../lib/store.svelte';

  let copied: boolean = $state(false);
  let copyFailed: boolean = $state(false);
  let liveMessage: string = $state('');
  let dialogRef: HTMLElement | null = $state(null);
  let lastFocused: HTMLElement | null = null;

  let jsonText = $derived(store.exportJson());
  let markdownText = $derived(store.exportMarkdown());
  let previewText = $derived(store.exportTab === 'json' ? jsonText : markdownText);

  function close() {
    store.exportOpen = false;
    lastFocused?.focus();
  }

  // Fallback for environments where the async Clipboard API is unavailable
  // or blocked by permissions policy (e.g. headless browsers without a
  // clipboard grant) — actually performs the copy via a legacy selection
  // instead of assuming success.
  function legacyCopy(text: string): boolean {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    textarea.remove();
    return ok;
  }

  async function copy() {
    let success = false;
    try {
      await navigator.clipboard.writeText(previewText);
      success = true;
    } catch {
      success = legacyCopy(previewText);
    }
    const label = store.exportTab === 'json' ? 'Nest JSON' : 'Markdown vault';
    if (success) {
      copied = true;
      copyFailed = false;
      liveMessage = `${label} copied to clipboard`;
      setTimeout(() => { copied = false; }, 1600);
    } else {
      copied = false;
      copyFailed = false;
      copyFailed = true;
      liveMessage = `Failed to copy ${label} to clipboard`;
    }
  }

  function download() {
    const isJson = store.exportTab === 'json';
    const blob = new Blob([previewText], { type: isJson ? 'application/json' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isJson ? 'nest.json' : 'nest-vault.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    liveMessage = `${isJson ? 'Nest JSON' : 'Markdown vault'} downloaded`;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab' && dialogRef) {
      const focusables = dialogRef.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  $effect(() => {
    if (store.exportOpen) {
      lastFocused = document.activeElement as HTMLElement;
      copied = false;
      queueMicrotask(() => dialogRef?.querySelector<HTMLElement>('button')?.focus());
    }
  });
</script>

{#if store.exportOpen}
  <div class="fixed inset-0 z-50 flex items-stretch justify-end">
    <button class="absolute inset-0 bg-black/40 cursor-default" aria-label="Close Export Nest" onclick={close} tabindex="-1"></button>
    <div
      bind:this={dialogRef}
      class="relative w-full max-w-full sm:max-w-lg h-full bg-white shadow-2xl flex flex-col drawer-enter"
      role="dialog"
      aria-modal="true"
      aria-label="Export Nest"
      tabindex="-1"
      onkeydown={onKeydown}
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200 flex-shrink-0">
        <h2 class="text-base font-semibold text-slate-800">Export Nest</h2>
        <button class="p-1.5 rounded hover:bg-slate-100 text-slate-500 cursor-pointer" onclick={close} aria-label="Close">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- Format tabs -->
      <div class="flex gap-1 px-4 pt-3 flex-shrink-0" role="tablist" aria-label="Export format">
        <button
          role="tab"
          aria-selected={store.exportTab === 'json'}
          class="px-3 py-1.5 text-sm font-medium rounded-t-lg transition cursor-pointer {store.exportTab === 'json' ? 'bg-slate-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}"
          onclick={() => store.exportTab = 'json'}
        >Nest JSON</button>
        <button
          role="tab"
          aria-selected={store.exportTab === 'markdown'}
          class="px-3 py-1.5 text-sm font-medium rounded-t-lg transition cursor-pointer {store.exportTab === 'markdown' ? 'bg-slate-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}"
          onclick={() => store.exportTab = 'markdown'}
        >Markdown vault</button>
      </div>

      <div class="flex-1 overflow-auto px-4 py-3 bg-slate-100">
        <pre class="text-xs font-mono whitespace-pre text-slate-800 leading-relaxed">{previewText}</pre>
      </div>

      <div class="flex items-center gap-2 px-4 py-3 border-t border-slate-200 flex-shrink-0 flex-wrap">
        <button class="px-3 py-2 text-sm font-medium rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition cursor-pointer" onclick={copy}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button class="px-3 py-2 text-sm font-medium rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer" onclick={download}>
          Download
        </button>
        {#if liveMessage}
          <p class="text-sm {copyFailed ? 'text-red-700' : 'text-green-700'}" role="status" aria-live="polite">{liveMessage}</p>
        {/if}
        <div class="flex-1"></div>
        <button class="px-3 py-2 text-sm font-medium rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition cursor-pointer" onclick={() => { store.exportOpen = false; store.importOpen = true; }}>
          Import Nest
        </button>
      </div>

    </div>
  </div>
{/if}
