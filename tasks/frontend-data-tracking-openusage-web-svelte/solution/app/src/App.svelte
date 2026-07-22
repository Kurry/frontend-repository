<script lang="ts">
  import { onMount } from 'svelte';
  import { exportWorkspace, importWorkspace } from './lib/store.svelte';
  import { initializeWebMCP } from './lib/webmcp';
  import ConnectionSettings from './lib/components/ConnectionSettings.svelte';
  import ProviderRail from './lib/components/ProviderRail.svelte';
  import FocusStrip from './lib/components/FocusStrip.svelte';
  import Chart from './lib/components/Chart.svelte';
  import EventTrace from './lib/components/EventTrace.svelte';
  import { Download, Upload, FileJson } from '@lucide/svelte';

  onMount(() => {
    initializeWebMCP();
  });

  let importError = '';

  function handleExport() {
      const data = exportWorkspace();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'openusage-web-workspace.json';
      a.click();
      URL.revokeObjectURL(url);
  }

  function handleImport(e: Event) {
      importError = '';
      const input = e.target as HTMLInputElement;
      if (!input.files?.length) return;

      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
          const content = e.target?.result as string;
          const success = importWorkspace(content);
          if (!success) {
              importError = 'Failed to import workspace. Invalid format or data.';
          }
      };
      reader.readAsText(file);

      // Reset input
      input.value = '';
  }
</script>

<main class="min-h-screen p-4 md:p-8 max-w-6xl mx-auto flex flex-col">
  <header class="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
    <h1 class="text-2xl font-bold flex items-center gap-2">
       <FileJson class="text-primary" /> OpenUsage Web Console
    </h1>

    <div class="flex items-center gap-2">
        <label class="cursor-pointer flex items-center gap-2 text-sm bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded transition-colors">
            <Upload size={14} /> Import
            <input type="file" accept=".json" class="hidden" onchange={handleImport} />
        </label>
        <button class="flex items-center gap-2 text-sm bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded transition-colors" onclick={handleExport}>
            <Download size={14} /> Export
        </button>
    </div>
  </header>

  {#if importError}
    <div class="bg-error/20 text-error p-3 rounded mb-6 text-sm flex justify-between items-center border border-error/50">
        {importError}
        <button onclick={() => importError = ''} class="underline">Dismiss</button>
    </div>
  {/if}

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
    <div class="lg:col-span-3 flex flex-col gap-6">
      <ConnectionSettings />
      <EventTrace />
    </div>

    <div class="lg:col-span-9 flex flex-col gap-6">
      <ProviderRail />
      <FocusStrip />
      <Chart />
    </div>
  </div>
</main>
