<script>
  import { createDialog } from '@melt-ui/svelte';
  import { fade } from 'svelte/transition';
  import { store } from '../lib/store.svelte.js';

  const {
    elements: { portalled, overlay, content, title, description, close },
    states: { open },
  } = createDialog({ forceVisible: true });

  let importText = $state('');
  let importError = $state('');
  let closing = $state(false);
  let importArea = $state(null);

  const preview = $derived(store.grovePanelFormat === 'grove-json' ? store.exportGroveJson() : store.exportGroveCsv());

  $effect(() => open.set(store.showGrovePanel));
  $effect(() => {
    if (store.showGrovePanel && store.groveImportMode) {
      setTimeout(() => importArea?.focus(), 50);
    }
  });

  function requestClose() {
    closing = true;
    setTimeout(() => {
      closing = false;
      store.showGrovePanel = false;
      open.set(false);
    }, 200);
  }

  $effect(() => {
    if (!$open && store.showGrovePanel && !closing) {
      store.showGrovePanel = false;
    }
  });

  async function copyPackage() {
    await navigator.clipboard.writeText(preview);
    store.addToast('Grove package copied');
  }

  function downloadPackage() {
    const extension = store.grovePanelFormat === 'grove-json' ? 'json' : 'csv';
    const type = store.grovePanelFormat === 'grove-json' ? 'application/json' : 'text/csv';
    const url = URL.createObjectURL(new Blob([preview], { type }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `taskgrove-package.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
    store.addToast('Grove package downloaded');
  }

  async function loadFile(event) {
    const file = event.target.files?.[0];
    if (file) importText = await file.text();
    event.target.value = '';
  }

  function importPackage() {
    importError = '';
    if (!importText.trim()) {
      importError = 'Import text is required';
      store.announce(importError);
      return;
    }
    const result = store.importGrove(importText, store.grovePanelFormat);
    if (result.error) {
      importError = result.error;
      store.announce(result.error);
      return;
    }
    importText = '';
    requestClose();
  }
</script>

{#if $open}
  <div {...$portalled}>
    <div {...$overlay} class="fixed inset-0 z-50 bg-black/30" transition:fade={{ duration: 200 }} onclick={requestClose}></div>
    <section
      {...$content}
      class="fixed left-1/2 top-1/2 z-50 flex max-h-[86vh] w-[min(760px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 flex-col border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-xl {closing ? 'panel-leave' : 'panel-enter'}"
    >
      <div class="flex items-center justify-between gap-2 border-b border-[var(--color-border)] pb-2">
        <div>
          <h2 {...$title} class="heading font-bold" style="font-size: 48px; line-height: 1.1;">Grove package</h2>
          <p {...$description} class="text-[10px] text-[var(--color-muted)]">Export or import the complete task tree.</p>
        </div>
        <button class="btn-secondary !px-2 !py-1" aria-label="Close Grove package" onclick={requestClose}>✕</button>
      </div>
      <div class="flex gap-2 py-2" role="tablist" aria-label="Grove package format">
        <button role="tab" aria-selected={store.grovePanelFormat === 'grove-json'} class="btn-secondary !px-3 !py-1" onclick={() => store.grovePanelFormat = 'grove-json'}>Grove JSON</button>
        <button role="tab" aria-selected={store.grovePanelFormat === 'grove-csv'} class="btn-secondary !px-3 !py-1" onclick={() => store.grovePanelFormat = 'grove-csv'}>Grove CSV</button>
      </div>
      <pre class="min-h-32 flex-1 overflow-auto border border-[var(--color-border)] bg-[var(--color-surface)] p-2 font-mono text-[10px]">{preview}</pre>
      <div class="mt-3 flex flex-wrap gap-2">
        <button class="btn-primary" onclick={downloadPackage}>Download grove package</button>
        <button class="btn-secondary" onclick={copyPackage}>Copy grove package</button>
        <label class="btn-secondary">Load import file<input class="sr-only" type="file" accept=".json,.csv,application/json,text/csv" onchange={loadFile} /></label>
      </div>
      <label class="mt-3 text-[10px] font-semibold" for="grove-import-text">Import grove text</label>
      <textarea bind:this={importArea} id="grove-import-text" bind:value={importText} rows="4" class="border border-[var(--color-border)] bg-[var(--color-background)] p-2 font-mono text-[10px]"></textarea>
      {#if importError}<p class="mt-1 text-[10px] text-[var(--color-danger)]" role="alert" aria-live="polite">{importError}</p>{/if}
      <div class="mt-2 flex justify-end"><button class="btn-secondary" onclick={importPackage}>Import grove</button></div>
    </section>
  </div>
{/if}
