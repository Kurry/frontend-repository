<script lang="ts">
  import { savedBoards, boardCells, cellSize, cellLock, toolMode, activeColor, mirrorMode, visionMode, showGrid, versions } from '../lib/store';
  import { projectDocumentSchema } from '../lib/schema';
  import type { ProjectDocument } from '../lib/types';
  import html2canvas from 'html2canvas';

  $: projectDoc = {
    cellSize: $cellSize,
    tool: $toolMode,
    swatch: $activeColor,
    mirror: $mirrorMode,
    vision: $visionMode,
    gridVisible: $showGrid,
    cells: $boardCells,
    boards: $savedBoards,
    versions: $versions
  } as ProjectDocument;

  $: projectJsonString = JSON.stringify(projectDoc, null, 2);

  $: cssPalette = (() => {
      const swatches = [
        { color: '#000000', name: 'black' },
        { color: '#ffffff', name: 'white' },
        { color: '#ff0000', name: 'red' },
        { color: '#ffff00', name: 'yellow' },
        { color: '#00ff00', name: 'green' },
        { color: '#0000ff', name: 'blue' },
        { color: '#ff0098', name: 'pink' },
      ];
      return `:root {\n${swatches.map(s => `  --color-${s.name}: ${s.color};`).join('\n')}\n}`;
  })();

  function downloadJson() {
    const blob = new Blob([projectJsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grid-paint-project.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPng() {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;

    // Creating a wrapper for the canvas and footer to screenshot together
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-9999px';
    wrapper.style.backgroundColor = 'white';

    const cloneCanvas = document.createElement('canvas');
    cloneCanvas.width = canvas.width;
    cloneCanvas.height = canvas.height;
    cloneCanvas.getContext('2d')?.drawImage(canvas, 0, 0);

    const footer = document.createElement('div');
    footer.style.padding = '20px';
    footer.style.textAlign = 'center';
    footer.style.fontFamily = 'monospace';
    footer.style.backgroundColor = '#f3f4f6';
    footer.innerText = '<GRID PAINT STUDIO>';

    wrapper.appendChild(cloneCanvas);
    wrapper.appendChild(footer);
    document.body.appendChild(wrapper);

    html2canvas(wrapper).then(c => {
      const a = document.createElement('a');
      a.href = c.toDataURL('image/png');
      a.download = 'grid_paint.png';
      a.click();
      document.body.removeChild(wrapper);
    });
  }

  let copyMessage = '';
  function copyJson() {
    navigator.clipboard.writeText(projectJsonString);
    copyMessage = 'Copied to clipboard';
    setTimeout(() => copyMessage = '', 2000);
  }

  let importError = '';

  function handleImport(e: Event) {
    importError = '';
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const json = JSON.parse(text);
        const result = projectDocumentSchema.safeParse(json);

        if (result.success) {
          savedBoards.set(result.data.boards);
          versions.set(result.data.versions);
          boardCells.set(result.data.cells);
          cellSize.set(result.data.cellSize);
          toolMode.set(result.data.tool);
          activeColor.set(result.data.swatch);
          mirrorMode.set(result.data.mirror);
          visionMode.set(result.data.vision);
          showGrid.set(result.data.gridVisible);

          let hasCells = false;
          for (let r=0; r<result.data.cells.length; r++) {
            for (let c=0; c<result.data.cells[r].length; c++) {
              if (result.data.cells[r][c] !== null) {
                hasCells = true;
                break;
              }
            }
          }
          if (hasCells) cellLock.set(true);

          importError = 'Import successful'; // Using the same text area for success for visibility
          setTimeout(() => importError = '', 2000);
        } else {
          const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
          importError = 'Invalid Project JSON format: ' + errors;
        }
      } catch (err) {
        importError = 'Could not parse JSON';
      }
    };
    reader.readAsText(file);
    input.value = '';
  }
</script>

<div class="max-w-6xl mx-auto">
  <div class="grid grid-cols-2 gap-8">
    <div class="bg-gray-800 p-6 rounded-lg">
      <h3 class="text-xl font-bold mb-4">Export</h3>

      <div class="flex flex-col gap-4">
        <button class="bg-blue-600 px-4 py-3 rounded font-bold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-white" on:click={downloadJson}>
          Download Project JSON
        </button>
        <button class="bg-gray-700 px-4 py-3 rounded font-bold hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-white" on:click={copyJson}>
          Copy JSON to Clipboard
        </button>
        <div aria-live="polite" class="text-sm text-green-400 h-5 text-center">
            {copyMessage}
        </div>
        <button class="bg-yellow-500 text-black px-4 py-3 rounded font-bold hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-white" on:click={downloadPng}>
          Download PNG
        </button>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-4">
        <div>
            <h4 class="text-sm font-bold text-gray-400 mb-2 uppercase">Project JSON Preview</h4>
            <div class="bg-black p-4 rounded overflow-auto max-h-64 border border-gray-700" tabindex="-1" aria-label="Project JSON Preview">
              <pre class="text-xs">{projectJsonString}</pre>
            </div>
        </div>
        <div>
            <h4 class="text-sm font-bold text-gray-400 mb-2 uppercase">CSS Palette</h4>
            <div class="bg-black p-4 rounded overflow-auto max-h-64 border border-gray-700" tabindex="-1" aria-label="CSS Palette Preview">
              <pre class="text-xs">{cssPalette}</pre>
            </div>
        </div>
      </div>
    </div>

    <div class="bg-gray-800 p-6 rounded-lg">
      <h3 class="text-xl font-bold mb-4">Import</h3>

      <div aria-live="polite" aria-atomic="true">
        {#if importError}
          <div class="bg-gray-900 border border-gray-700 p-4 rounded mb-4 text-sm" class:text-red-400={importError.includes('Invalid') || importError.includes('parse')} class:text-green-400={importError.includes('successful')}>
            {importError}
          </div>
        {/if}
      </div>

      <p class="text-gray-400 mb-6 text-sm" id="import-desc">Upload a previously exported Project JSON file to restore your saved boards and current canvas state.</p>

      <label class="block focus-within:ring-2 focus-within:ring-blue-500 rounded cursor-pointer border border-gray-700 p-2 bg-gray-900 transition-colors hover:bg-gray-800">
        <span class="sr-only">Choose Project JSON file</span>
        <input type="file" accept=".json" on:change={handleImport} class="block w-full text-sm text-gray-400
          file:mr-4 file:py-2 file:px-4
          file:rounded file:border-0
          file:text-sm file:font-bold
          file:bg-blue-600 file:text-white
          cursor-pointer focus:outline-none" aria-describedby="import-desc" />
      </label>
    </div>
  </div>
</div>
