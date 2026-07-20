<script lang="ts">
  interface ScoreEntry {
    name: string;
    points: number;
    forfeits: number;
  }

  interface Props {
    sortedScores: ScoreEntry[];
  }

  let { sortedScores }: Props = $props();
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';
</script>

<div class="space-y-2">
  {#each sortedScores as entry, index (entry.name)}
    <div class="flex items-center gap-3 p-3 rounded-lg {index === 0 ? 'bg-yellow-50 border-2 border-yellow-500' : 'bg-gray-50'}" in:fade={{ duration: 400 }} animate:flip={{ duration: 400 }}>
      {#if index === 0}
        <span class="text-xl" aria-hidden="true">🥇</span>
        <span class="sr-only">1st place</span>
      {:else if index === 1}
        <span class="text-xl" aria-hidden="true">🥈</span>
        <span class="sr-only">2nd place</span>
      {:else if index === 2}
        <span class="text-xl" aria-hidden="true">🥉</span>
        <span class="sr-only">3rd place</span>
      {:else}
        <span class="text-xl text-gray-400 font-bold w-8 text-center">{index + 1}</span>
      {/if}
      
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-sm truncate" style="color: var(--color-text-primary);">{entry.name}</p>
      </div>
      
      <div class="flex items-center gap-4 text-sm">
        <div class="text-center">
          <span class="font-bold text-lg text-green-600">{entry.points}</span>
          <p class="text-xs text-gray-500">pts</p>
        </div>
        <div class="text-center">
          <span class="font-bold text-lg text-red-500">{entry.forfeits}</span>
          <p class="text-xs text-gray-500">skip</p>
        </div>
      </div>
    </div>
  {/each}
</div>
