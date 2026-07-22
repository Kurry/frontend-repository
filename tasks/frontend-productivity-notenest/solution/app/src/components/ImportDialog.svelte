<script lang="ts">
  import { store } from '../lib/store.svelte';

  let text: string = $state('');
  let errorField: string = $state('');
  let errorMessage: string = $state('');
  let dialogRef: HTMLElement | null = $state(null);
  let lastFocused: HTMLElement | null = null;

  function close() {
    store.importOpen = false;
    lastFocused?.focus();
  }

  function submit() {
    const result = store.importNest(text);
    if (result.ok) {
      errorField = '';
      errorMessage = '';
      text = '';
      store.importOpen = false;
      lastFocused?.focus();
    } else {
      errorField = result.field || 'document';
      errorMessage = result.message || 'Invalid Nest document';
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab' && dialogRef) {
      const focusables = dialogRef.querySelectorAll<HTMLElement>(
        'button, textarea, input, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  $effect(() => {
    if (store.importOpen) {
      lastFocused = document.activeElement as HTMLElement;
      errorField = '';
      errorMessage = '';
      queueMicrotask(() => dialogRef?.querySelector<HTMLTextAreaElement>('textarea')?.focus());
    }
  });
</script>

{#if store.importOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <button class="absolute inset-0 bg-black/40 cursor-default" aria-label="Close Import Nest" onclick={close} tabindex="-1"></button>
    <div
      bind:this={dialogRef}
      class="relative w-full max-w-lg bg-white rounded-xl shadow-2xl flex flex-col drawer-enter"
      role="dialog"
      aria-modal="true"
      aria-label="Import Nest"
      tabindex="-1"
      onkeydown={onKeydown}
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h2 class="text-base font-semibold text-slate-800">Import Nest</h2>
        <button class="p-1.5 rounded hover:bg-slate-100 text-slate-500 cursor-pointer" onclick={close} aria-label="Close">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="px-4 py-3">
        <label for="import-nest-json" class="block text-sm font-medium text-slate-600 mb-1">Nest JSON document</label>
        <textarea
          id="import-nest-json"
          bind:value={text}
          class="w-full h-48 text-xs font-mono border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder={'{ "schemaVersion": "notenest-v1", "folders": [], "notes": [], "trash": [] }'}
          aria-invalid={!!errorMessage}
          aria-describedby={errorMessage ? 'import-error' : undefined}
        ></textarea>
        {#if errorMessage}
          <p id="import-error" class="text-sm text-red-600 mt-2" role="alert" aria-live="assertive">
            <span class="font-semibold">{errorField}:</span> {errorMessage}
          </p>
        {/if}
      </div>
      <div class="flex items-center gap-2 px-4 py-3 border-t border-slate-200">
        <button class="px-3 py-2 text-sm font-medium rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition cursor-pointer" onclick={submit}>
          Import
        </button>
        <button class="px-3 py-2 text-sm font-medium rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer" onclick={close}>
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}
