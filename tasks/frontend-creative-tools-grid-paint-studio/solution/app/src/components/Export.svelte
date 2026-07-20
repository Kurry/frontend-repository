<script lang="ts">
  import {
    boardCells, cellSize, cellLock, toolMode, activeColor, mirrorMode, visionMode,
    showGrid, savedBoards, versions, importDialogOpen, exportFormat, pushToast
  } from '../lib/store';
  import { projectDocumentSchema } from '../lib/schema';
  import { buildProjectJson, buildCssPalette, copyText } from '../lib/projectDoc';
  import { renderBoardDataUrl, downloadBrandedPng } from '../lib/exportPng';
  import type { ProjectDocument } from '../lib/types';
  import { onMount, tick } from 'svelte';
  import { fade } from 'svelte/transition';

  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dur = (ms: number) => (reduced ? 0 : ms);

  // Recompile the export text from the live store on every mutation. The store
  // reads inside the parenthesised expression are what register the deps
  // (buildProjectJson() itself reads them via get(), invisible to Svelte).
  $: projectJsonString = (void $boardCells, void $cellSize, void $toolMode, void $activeColor, void $mirrorMode, void $visionMode, void $showGrid, void $savedBoards, void $versions, buildProjectJson());
  $: cssPalette = buildCssPalette();

  // Live PNG preview of the current board (artwork only), debounced so a fast
  // stroke does not re-encode on every cell.
  let pngUrl = '';
  let pngTimer: ReturnType<typeof setTimeout> | null = null;
  $: if ($boardCells && $cellSize) {
    if (pngTimer) clearTimeout(pngTimer);
    pngTimer = setTimeout(() => { pngUrl = renderBoardDataUrl($boardCells, $cellSize); }, 200);
  }

  function downloadJson() {
    const blob = new Blob([projectJsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'grid-paint-project.json'; a.click();
    URL.revokeObjectURL(url);
    pushToast('Downloaded Project JSON', 'success');
  }
  function downloadPng() { downloadBrandedPng($boardCells, $cellSize); pushToast('Downloaded grid_paint.png', 'success'); }
  async function doCopy() {
    const ok = await copyText(projectJsonString);
    pushToast(ok ? 'Copied Project JSON to clipboard' : 'Copy failed — clipboard unavailable', ok ? 'success' : 'error');
  }

  // --- Import Project (focus-trapped modal) ---
  let importError = '';
  let dialogEl: HTMLDivElement;
  let importOpenButton: HTMLButtonElement;
  let importFileInput: HTMLInputElement;
  let importCloseButton: HTMLButtonElement;
  let prevFocus: HTMLElement | null = null;

  async function openImportDialog() {
    prevFocus = document.activeElement as HTMLElement;
    importError = '';
    importDialogOpen.set(true);
    await tick();
    importFileInput?.focus();
  }
  function closeImportDialog() {
    importDialogOpen.set(false);
    (prevFocus ?? importOpenButton)?.focus();
  }

  $: if ($importDialogOpen) { tick().then(() => importFileInput?.focus()); }

  function handleImport(e: Event) {
    importError = '';
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const json = JSON.parse(text);
        const result = projectDocumentSchema.safeParse(json);
        if (result.success) {
          importProject(result.data);
          importError = '';
          pushToast('Imported Project JSON — session restored', 'success');
          closeImportDialog();
        } else {
          const errs = result.error.errors.map(er => `${er.path.length ? er.path.join('.') : 'ProjectDocument'}: ${er.message}`);
          importError = 'Import rejected — ' + errs.join('; ');
        }
      } catch {
        importError = 'Import rejected — ProjectDocument: payload is not valid JSON';
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  function importProject(doc: ProjectDocument) {
    savedBoards.set(doc.boards.map(b => ({ ...b, cells: b.cells.map(row => row.map(x => (x ? { ...x } : null))) })));
    versions.set(doc.versions.map(v => ({ ...v, cells: v.cells.map(row => row.map(x => (x ? { ...x } : null))) })));
    boardCells.set(doc.cells.map(row => row.map(x => (x ? { ...x } : null))));
    cellSize.set(doc.cellSize);
    toolMode.set(doc.tool);
    activeColor.set(doc.swatch);
    mirrorMode.set(doc.mirror);
    visionMode.set(doc.vision);
    showGrid.set(doc.gridVisible);
    let hasCells = false;
    for (const row of doc.cells) for (const cell of row) if (cell !== null) { hasCells = true; break; }
    cellLock.set(hasCells);
  }

  function trapImport(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.stopPropagation(); closeImportDialog(); return; }
    if (e.key === 'Tab') {
      const f = ([importFileInput, importCloseButton].filter(Boolean) as HTMLElement[]);
      if (f.length === 0) return;
      e.preventDefault();
      const idx = f.indexOf(document.activeElement as HTMLElement);
      f[(idx + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
    }
  }

  onMount(() => () => { if (pngTimer) clearTimeout(pngTimer); });
</script>

<div class="max-w-6xl mx-auto">
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <div class="bg-gray-800 p-6 rounded-lg">
      <h3 class="text-xl font-bold mb-4">Export</h3>
      <div class="flex flex-col gap-3">
        <button class="bg-blue-600 px-4 py-3 rounded font-bold hover:bg-blue-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white" on:click={downloadJson}>Download Project</button>
        <button class="bg-gray-700 px-4 py-3 rounded font-bold hover:bg-gray-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white" on:click={doCopy}>Copy Project JSON</button>
        <button class="bg-yellow-500 text-black px-4 py-3 rounded font-bold hover:bg-yellow-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white" on:click={downloadPng}>Download PNG</button>
        <button bind:this={importOpenButton} class="bg-gray-700 px-4 py-3 rounded font-bold hover:bg-gray-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white" on:click={openImportDialog}>Import Project</button>
      </div>

      <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="{$exportFormat === 'project-json' ? 'ring-2 ring-blue-400 rounded' : ''}">
          <h4 class="text-sm font-bold text-gray-300 mb-2">Project JSON preview</h4>
          <div class="bg-black p-3 rounded overflow-auto max-h-64 border border-gray-700" role="region" aria-label="Project JSON preview">
            <pre class="text-xs whitespace-pre-wrap break-words">{projectJsonString}</pre>
          </div>
        </div>
        <div class="{$exportFormat === 'css-palette' ? 'ring-2 ring-blue-400 rounded' : ''}">
          <h4 class="text-sm font-bold text-gray-300 mb-2">CSS palette</h4>
          <div class="bg-black p-3 rounded overflow-auto max-h-64 border border-gray-700" role="region" aria-label="CSS palette preview">
            <pre class="text-xs whitespace-pre-wrap break-words">{cssPalette}</pre>
          </div>
        </div>
      </div>

      <div class="mt-4 {$exportFormat === 'png' ? 'ring-2 ring-blue-400 rounded' : ''}">
        <h4 class="text-sm font-bold text-gray-300 mb-2">PNG preview</h4>
        <div class="bg-white rounded overflow-hidden border border-gray-700 p-2">
          {#if pngUrl}<img src={pngUrl} alt="Current board preview" class="w-full object-contain" />{:else}<div class="h-32" aria-hidden="true"></div>{/if}
        </div>
      </div>
    </div>

    <div class="bg-gray-800 p-6 rounded-lg">
      <h3 class="text-xl font-bold mb-4">Import Project</h3>
      <p class="text-gray-400 mb-4 text-sm">Open the Import Project dialog to restore a previously exported Project JSON file. The canvas, gallery, versions, tools, and histogram reconstruct to match the export.</p>
      <button class="bg-blue-600 px-4 py-3 rounded font-bold hover:bg-blue-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white" on:click={openImportDialog}>Import Project</button>
    </div>
  </div>
</div>

{#if $importDialogOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" transition:fade={{ duration: dur(150) }} on:click={closeImportDialog} role="presentation">
    <div
      bind:this={dialogEl}
      class="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-lg flex flex-col gap-4"
      role="dialog" aria-modal="true" aria-label="Import Project" tabindex="-1" on:keydown={trapImport} on:click|stopPropagation
    >
      <h2 class="text-lg font-bold">Import Project</h2>
      <p class="text-gray-400 text-sm">Choose a conforming Project JSON document. Malformed or non-conforming payloads are rejected with a field name and leave the board and gallery unchanged.</p>
      <div aria-live="assertive" class="min-h-[1.25rem]">
        {#if importError}<p class="text-red-400 text-sm">{importError}</p>{/if}
      </div>
      <label class="block border border-gray-700 rounded p-2 bg-gray-800 hover:bg-gray-700 transition-colors cursor-pointer">
        <span class="sr-only">Choose Project JSON file</span>
        <input bind:this={importFileInput} type="file" accept=".json,application/json" on:change={handleImport} class="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" />
      </label>
      <div class="flex justify-end">
        <button bind:this={importCloseButton} class="bg-gray-700 hover:bg-gray-600 transition-colors px-4 py-2 rounded font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-white" on:click={closeImportDialog}>Cancel</button>
      </div>
    </div>
  </div>
{/if}
