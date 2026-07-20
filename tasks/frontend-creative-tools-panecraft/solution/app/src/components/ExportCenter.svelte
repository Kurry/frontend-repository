<script lang="ts">
  import * as store from '../lib/store';
  import Modal from './Modal.svelte';

  const center = $derived(store.getExportCenter());

  // Live previews compiled straight from the store — they always include the
  // latest session mutations under the field-contract keys.
  const workspaceJson = $derived(JSON.stringify(store.compileWorkspaceExport(), null, 2));
  const markdownReport = $derived(store.compileMarkdownReport());

  let copied = $state(false);
  let copyTimer: ReturnType<typeof setTimeout> | null = null;
  let importText = $state('');
  let importError = $state('');
  let importSuccess = $state('');
  let fileInput = $state<HTMLInputElement | undefined>();

  function activePreview(): string {
    return center.tab === 'workspace-json' ? workspaceJson : markdownReport;
  }

  function close() {
    store.closeExportCenter();
    copied = false;
    importError = '';
    importSuccess = '';
  }

  function downloadText(filename: string, content: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function downloadActive() {
    if (center.tab === 'workspace-json') {
      downloadText('panecraft-workspace.json', workspaceJson, 'application/json');
      store.announce('Workspace JSON download started.');
    } else {
      downloadText('panecraft-report.md', markdownReport, 'text/markdown');
      store.announce('Markdown report download started.');
    }
  }

  async function copyActive() {
    const text = activePreview();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    copied = true;
    store.announce(
      center.tab === 'workspace-json'
        ? 'Workspace JSON copied to clipboard.'
        : 'Markdown report copied to clipboard.',
    );
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copied = false;
    }, 2000);
  }

  function runImport(raw: unknown) {
    importSuccess = '';
    importError = '';
    const result = store.applyWorkspaceImport(raw);
    if (result.ok) {
      importSuccess = `Imported ${result.pageCount} page(s) and ${result.paneCount} pane(s). The workspace now matches the document.`;
      importText = '';
      store.announce(importSuccess);
    } else {
      importError = `${result.field}: ${result.message}`;
      store.announce(`Import rejected — ${result.field} is invalid.`);
    }
  }

  function importFromPaste() {
    const text = importText.trim();
    if (!text) {
      importError = 'document: paste Workspace JSON before importing.';
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      importError = 'document: the pasted text is not valid JSON.';
      return;
    }
    runImport(parsed);
  }

  async function handleImportFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      runImport(JSON.parse(text));
    } catch {
      importError = 'document: the selected file is not valid JSON.';
    }
    input.value = '';
  }
</script>

<Modal
  open={center.open}
  heading="Export Center"
  labelledBy="export-center-heading"
  widthClass="max-w-3xl"
  onClose={close}
>
  <div class="px-6 py-3 border-b border-[var(--color-border)]">
    <div class="flex gap-1" role="tablist" aria-label="Workspace formats">
      <button
        type="button"
        role="tab"
        aria-selected={center.tab === 'workspace-json'}
        class="tap-target px-3 py-1.5 text-sm rounded-t-[var(--radius-base)] border-b-2 transition-colors {center.tab === 'workspace-json'
          ? 'border-[var(--color-primary)] font-semibold text-[var(--color-text-primary)]'
          : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}"
        onclick={() => (center.tab = 'workspace-json')}
      >Workspace JSON</button>
      <button
        type="button"
        role="tab"
        aria-selected={center.tab === 'markdown-report'}
        class="tap-target px-3 py-1.5 text-sm rounded-t-[var(--radius-base)] border-b-2 transition-colors {center.tab === 'markdown-report'
          ? 'border-[var(--color-primary)] font-semibold text-[var(--color-text-primary)]'
          : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}"
        onclick={() => (center.tab = 'markdown-report')}
      >Markdown Report</button>
    </div>
  </div>

  <div class="p-6 space-y-4">
    <div>
      <label for="export-preview" class="block text-xs font-medium text-[var(--color-text-primary)] mb-1">
        Live preview — {center.tab === 'workspace-json' ? 'Workspace JSON (WorkspaceDocument)' : 'Markdown report'}
      </label>
      <textarea
        id="export-preview"
        readonly
        class="w-full h-56 p-3 font-mono text-xs leading-relaxed border border-[var(--color-border)] rounded-[var(--radius-base)] bg-[var(--color-surface)] text-[var(--color-text-primary)] resize-y"
        value={activePreview()}
      ></textarea>
      <div class="flex flex-wrap items-center gap-2 mt-2">
        <button
          type="button"
          class="copy-control tap-target px-3 py-2 text-sm rounded-[var(--radius-base)] {copied ? 'copy-flash' : 'bg-[var(--color-primary)] text-white hover:opacity-90'}"
          onclick={copyActive}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          type="button"
          class="tap-target px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
          onclick={downloadActive}
        >
          Download
        </button>
        <span class="text-xs text-[var(--color-text-secondary)]" aria-live="polite">
          {#if copied}
            {center.tab === 'workspace-json' ? 'Workspace JSON copied to clipboard.' : 'Markdown report copied to clipboard.'}
          {:else}
            Compiled live from the current workspace.
          {/if}
        </span>
      </div>
    </div>

    <div class="border-t border-[var(--color-border)] pt-4">
      <h3 class="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Import Workspace JSON</h3>
      <p class="text-xs text-[var(--color-text-secondary)] mb-2">
        Paste a WorkspaceDocument (schemaVersion panecraft-workspace-v1) or pick an exported .json file. Invalid documents are rejected whole — nothing is applied partially.
      </p>
      <div class="flex flex-col sm:flex-row gap-2">
        <label for="import-paste" class="sr-only">Paste Workspace JSON</label>
        <textarea
          id="import-paste"
          class="flex-1 h-24 p-3 font-mono text-xs border rounded-[var(--radius-base)] bg-white resize-y {importError ? 'input-invalid' : 'border-[var(--color-border)]'}"
          placeholder="Paste Workspace JSON here (schemaVersion panecraft-workspace-v1)"
          bind:value={importText}
        ></textarea>
        <div class="flex sm:flex-col gap-2">
          <button
            type="button"
            class="tap-target px-3 py-2 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius-base)] hover:opacity-90 transition-opacity"
            onclick={importFromPaste}
          >Import Pasted JSON</button>
          <button
            type="button"
            class="tap-target px-3 py-2 text-sm border border-[var(--color-border)] rounded-[var(--radius-base)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
            onclick={() => fileInput?.click()}
          >Choose File…</button>
          <input
            bind:this={fileInput}
            type="file"
            accept="application/json,.json"
            class="hidden"
            aria-label="Import workspace JSON file"
            onchange={handleImportFile}
          />
        </div>
      </div>
      <div aria-live="polite">
        {#if importError}
          <p class="field-error" role="alert">Import rejected — {importError} The workspace is unchanged.</p>
        {/if}
        {#if importSuccess}
          <p class="text-xs mt-1" style="color: var(--color-accent);">{importSuccess}</p>
        {/if}
      </div>
    </div>
  </div>
</Modal>
