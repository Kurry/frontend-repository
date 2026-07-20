<script lang="ts">
  import { boardCells } from '../lib/store';

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
          for (let r=0; r<$boardCells.length; r++) {
              for (let c=0; c<$boardCells[r].length; c++) {
                  const color = $boardCells[r][c];
                  if (color === null) {
                      cnt['blank']++;
                  } else if (cnt[color] !== undefined) {
                      cnt[color]++;
                  }
              }
          }
      }
      return { cnt, total };
  })();

  $: maxCount = Math.max(...Object.values(counts.cnt));
</script>

<div class="fixed bottom-4 left-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg flex gap-2 items-end h-32 w-64 z-40" aria-label="Color Histogram" role="region">
  <div class="flex-1 flex flex-col items-center justify-end h-full gap-1" aria-label="Blank cells: {counts.cnt['blank']}">
      <span class="text-xs">{counts.cnt['blank']}</span>
      <div class="w-full bg-gray-700 rounded-t" style="height: {counts.total ? Math.max(5, (counts.cnt['blank'] / maxCount) * 100) : 5}%;"></div>
      <div class="w-4 h-4 bg-gray-500 rounded-full border border-gray-700" title="Blank"></div>
  </div>
  {#each swatches as swatch}
    <div class="flex-1 flex flex-col items-center justify-end h-full gap-1" aria-label="{swatch.name} cells: {counts.cnt[swatch.color]}">
        <span class="text-xs">{counts.cnt[swatch.color]}</span>
        <div class="w-full rounded-t" style="background-color: {swatch.color}; height: {counts.total ? Math.max(5, (counts.cnt[swatch.color] / maxCount) * 100) : 5}%;"></div>
        <div class="w-4 h-4 rounded-full border border-gray-700" style="background-color: {swatch.color};" title={swatch.name}></div>
    </div>
  {/each}
</div>
