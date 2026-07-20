<script lang="ts">
  import { quest } from '../../store.svelte';

  let importInput: HTMLInputElement;
  let feedback = $state('');
  const heatMap = $derived(quest.heatMapData);
  const bestSingle = $derived(quest.bestSingleSet);
  const bestDay = $derived(quest.bestDayTotal);

  function download(contents: string, name: string, type: string) {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = name; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function exportJson() {
    download(JSON.stringify(quest.exportQuestLog(), null, 2), `repquest-${new Date().toISOString().slice(0,10)}.json`, 'application/json');
    feedback = 'Quest Log exported';
    quest.announce(feedback);
  }

  function exportCsv() {
    const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = ['date,reps,note', ...[...quest.state.repHistory].reverse().map((set) => [set.loggedAt || new Date(set.timestamp).toISOString(), set.reps, set.note || ''].map(escape).join(','))];
    download(rows.join('\n'), `repquest-workout-${new Date().toISOString().slice(0,10)}.csv`, 'text/csv');
    feedback = 'Workout CSV exported';
    quest.announce(feedback);
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(quest.exportQuestLog(), null, 2));
      feedback = 'Copied Quest Log JSON';
      quest.announce(feedback);
    } catch {
      feedback = 'Copy unavailable — use Export Quest Log';
      quest.announce(feedback);
    }
  }

  async function importFile(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const ok = quest.importQuestLog(JSON.parse(await file.text()));
      feedback = ok ? 'Quest Log imported' : 'Invalid Quest Log file — state was not changed';
      quest.announce(feedback);
    } catch {
      feedback = 'Invalid Quest Log file — state was not changed';
      quest.announce(feedback);
    }
    importInput.value = '';
  }
</script>

<section class="grid gap-4" aria-label="Quest records and portable Quest Log">
  <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
    <h2 class="text-lg font-bold text-amber-400 mb-3">Personal records</h2>
    <div class="grid grid-cols-2 gap-3">
      <div class="bg-slate-900 rounded-lg p-3"><p class="text-xs text-slate-400">Best single set</p><p class="text-2xl font-black">{bestSingle} <span class="text-xs font-normal text-slate-400">reps</span></p></div>
      <div class="bg-slate-900 rounded-lg p-3"><p class="text-xs text-slate-400">Best day total</p><p class="text-2xl font-black">{bestDay} <span class="text-xs font-normal text-slate-400">reps</span></p></div>
    </div>
  </div>

  <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
    <h2 class="text-lg font-bold text-amber-400">28-day streak heat-map</h2>
    <p class="text-xs text-slate-400 mb-3">Empty, building, and goal-met days use increasing color intensity.</p>
    <div class="grid grid-cols-7 gap-1" role="img" aria-label="Recent daily rep totals">
      {#each heatMap as day}
        <div title={`${day.date}: ${day.reps} reps`} aria-label={`${day.date}: ${day.reps} reps`} class="aspect-square rounded-sm border border-slate-700 {day.reps === 0 ? 'bg-slate-900' : day.reps < quest.state.dailyGoal ? 'bg-amber-700' : 'bg-green-500'}"></div>
      {/each}
    </div>
    <p class="sr-only">{heatMap.map((day) => `${day.date}: ${day.reps} reps`).join('; ')}</p>
  </div>

  <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
    <h2 class="text-lg font-bold text-amber-400 mb-3">Quest Log</h2>
    <div class="grid sm:grid-cols-2 gap-2">
      <button onclick={exportJson} data-action="export-json" class="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-3">Export Quest Log</button>
      <button onclick={copyJson} data-action="copy-json" class="rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-3">Copy JSON</button>
      <button onclick={exportCsv} data-action="export-csv" class="rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-3">Export Workout CSV</button>
      <button onclick={() => importInput.click()} data-action="import-json" class="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-3">Import Quest Log</button>
      <input bind:this={importInput} onchange={importFile} type="file" accept="application/json,.json" class="sr-only" aria-label="Choose Quest Log JSON file" />
    </div>
    {#if feedback}<p class="text-sm mt-3 text-amber-300" role="status" aria-live="polite">{feedback}</p>{/if}
  </div>
</section>
