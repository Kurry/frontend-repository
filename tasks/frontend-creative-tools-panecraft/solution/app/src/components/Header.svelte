<script lang="ts">
  import * as store from '../lib/store';

  let showWorkspacePanel = $state(false);
  let importFeedback = $state('');
  let copyFeedback = $state('');
  let fileInput = $state<HTMLInputElement | undefined>();

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

  function downloadWorkspaceJson() {
    downloadText('panecraft-workspace.json', JSON.stringify(store.compileWorkspaceExport(), null, 2), 'application/json');
  }

  function downloadMarkdownReport() {
    downloadText('panecraft-report.md', store.compileMarkdownReport(), 'text/markdown');
  }

  async function copyWorkspaceJson() {
    const text = JSON.stringify(store.compileWorkspaceExport(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      copyFeedback = 'Copied workspace JSON to clipboard.';
    } catch {
      const input = document.createElement('textarea');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      copyFeedback = 'Copied workspace JSON to clipboard.';
    }
    setTimeout(() => copyFeedback = '', 2000);
  }

  function triggerImport() {
    fileInput?.click();
  }

  async function handleImportFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = store.applyWorkspaceImport(parsed);
      importFeedback = result.ok
        ? `Imported ${result.pageCount} page(s), ${result.paneCount} pane(s).`
        : `Import failed: ${result.error}`;
    } catch {
      importFeedback = 'Import failed: file is not valid JSON.';
    }
    input.value = '';
  }
</script>

<header class="bg-[var(--color-secondary)] text-white py-4 px-4">
  <div class="max-w-7xl mx-auto flex items-center justify-between">
    <h1 class="text-[28px] font-semibold tracking-tight">PaneCraft</h1>
    <div class="flex items-center gap-3">
      <span class="text-xs text-white/60">Dashboard Builder</span>
      <button
        class="px-3 py-1.5 text-xs border border-white/30 rounded-[var(--radius-base)] text-white hover:bg-white/10 whitespace-nowrap"
        aria-expanded={showWorkspacePanel}
        onclick={() => showWorkspacePanel = !showWorkspacePanel}
      >
        Workspace
      </button>
    </div>
  </div>

  {#if showWorkspacePanel}
    <div class="max-w-7xl mx-auto mt-3 p-4 bg-white text-[var(--color-text-primary)] rounded-[var(--radius-base)] shadow-lg" role="region" aria-label="Workspace export and import">
      <div class="flex flex-wrap items-center gap-2">
        <button class="px-3 py-1.5 text-xs bg-[var(--color-primary)] text-white rounded-[var(--radius-base)] hover:opacity-90" onclick={downloadWorkspaceJson}>
          Download Workspace JSON
        </button>
        <button class="px-3 py-1.5 text-xs border border-[var(--color-border)] rounded-[var(--radius-base)] hover:bg-[var(--color-surface)]" onclick={copyWorkspaceJson}>
          Copy Workspace JSON
        </button>
        <button class="px-3 py-1.5 text-xs border border-[var(--color-border)] rounded-[var(--radius-base)] hover:bg-[var(--color-surface)]" onclick={downloadMarkdownReport}>
          Download Markdown Report
        </button>
        <button class="px-3 py-1.5 text-xs border border-[var(--color-border)] rounded-[var(--radius-base)] hover:bg-[var(--color-surface)]" onclick={triggerImport}>
          Import Workspace JSON
        </button>
        <input
          bind:this={fileInput}
          type="file"
          accept="application/json"
          class="hidden"
          onchange={handleImportFile}
        />
      </div>
      <p class="text-xs text-[var(--color-text-secondary)] mt-2" aria-live="polite">{copyFeedback || importFeedback || 'Export the workspace as JSON or a Markdown report, or import a previously exported JSON file.'}</p>
    </div>
  {/if}
</header>
