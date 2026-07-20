<script lang="ts">
  import { boardCells } from '../lib/store';

  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = reduced ? '0ms' : '320ms';

  const swatches = [
    { color: '#000000', name: 'Black' },
    { color: '#ffffff', name: 'White' },
    { color: '#ff0000', name: 'Red' },
    { color: '#ffff00', name: 'Yellow' },
    { color: '#00ff00', name: 'Green' },
    { color: '#0000ff', name: 'Blue' },
    { color: '#ff0098', name: 'Pink' },
  ];

  $: counts = (() => {
    const cnt: Record<string, number> = { 'blank': 0 };
    swatches.forEach(s => cnt[s.color] = 0);
    let total = 0;
    if ($boardCells && $boardCells.length > 0) {
      total = $boardCells.length * $boardCells[0].length;
      for (let r = 0; r < $boardCells.length; r++) {
        for (let c = 0; c < $boardCells[r].length; c++) {
          const cell = $boardCells[r][c];
          if (cell === null) cnt['blank']++;
          else if (cnt[cell.color] !== undefined) cnt[cell.color]++;
        }
      }
    }
    return { cnt, total };
  })();
  $: maxCount = Math.max(1, ...Object.values(counts.cnt));
  const pct = (n: number) => (counts.total ? Math.max(4, (n / maxCount) * 100) : 4);
</script>

<div class="gp-histogram fixed bottom-4 left-4 bg-gray-900 text-white p-3 rounded-lg shadow-xl flex gap-2 items-end h-32 w-64 z-40" role="region" aria-label="Color histogram">
  <div class="flex-1 flex flex-col items-center justify-end h-full gap-1" aria-label="Blank cells: {counts.cnt['blank']}">
    <span class="text-[10px] tabular-nums">{counts.cnt['blank']}</span>
    <div class="w-full bg-gray-500 rounded-t" style="height: {pct(counts.cnt['blank'])}%; transition: height {ease} ease;" aria-hidden="true"></div>
    <div class="w-4 h-4 bg-gray-500 rounded-full border border-gray-700" title="Blank" aria-hidden="true"></div>
  </div>
  {#each swatches as swatch}
    <div class="flex-1 flex flex-col items-center justify-end h-full gap-1" aria-label="{swatch.name} cells: {counts.cnt[swatch.color]}">
      <span class="text-[10px] tabular-nums">{counts.cnt[swatch.color]}</span>
      <div class="w-full rounded-t" style="background-color: {swatch.color}; height: {pct(counts.cnt[swatch.color])}%; transition: height {ease} ease;" aria-hidden="true"></div>
      <div class="w-4 h-4 rounded-full border border-gray-700" style="background-color: {swatch.color};" title={swatch.name} aria-hidden="true"></div>
    </div>
  {/each}
</div>
