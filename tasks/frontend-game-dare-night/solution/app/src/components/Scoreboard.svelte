<script lang="ts">
  import { flip } from 'svelte/animate';
  import { Trophy, Medal } from 'phosphor-svelte';
  import { motionMs } from '../lib/motion';

  interface ScoreEntry { name: string; points: number; forfeits: number }
  interface Props { sortedScores: ScoreEntry[]; winner: string | null }
  let { sortedScores, winner }: Props = $props();
</script>

<ol class="space-y-2.5">
  {#each sortedScores as entry, index (entry.name)}
    <li
      animate:flip={{ duration: motionMs(300) }}
      class="flex items-center gap-2.5 p-2.5 rounded-[10px] {entry.name === winner ? 'bg-amber-100 ring-2 ring-amber-500' : index === 0 ? 'bg-amber-50' : 'bg-gray-50'}"
    >
      {#if entry.name === winner}
        <Trophy size={22} weight="fill" class="text-amber-500" aria-hidden="true" />
        <span class="sr-only">Winner</span>
      {:else if index === 0}
        <Medal size={22} weight="fill" class="text-amber-400" aria-hidden="true" /><span class="sr-only">1st place</span>
      {:else if index === 1}
        <Medal size={22} weight="fill" class="text-gray-400" aria-hidden="true" /><span class="sr-only">2nd place</span>
      {:else if index === 2}
        <Medal size={22} weight="fill" class="text-orange-400" aria-hidden="true" /><span class="sr-only">3rd place</span>
      {:else}
        <span class="text-xl text-gray-400 font-bold w-8 text-center">{index + 1}</span>
      {/if}

      <div class="flex-1 min-w-0">
        <p class="font-semibold text-sm truncate" style="color: var(--color-text-primary);">
          {entry.name}
          {#if entry.name === winner}<span class="ml-1 text-xs text-amber-700">Winner</span>{/if}
        </p>
        <div class="h-2.5 mt-1 rounded-full bg-gray-200 overflow-hidden">
          <div class="h-full rounded-full transition-[width] duration-300" style="width: {Math.min(100, entry.points * 10)}%; background-color: {entry.name === winner ? '#F59E0B' : 'var(--color-accent)'};"></div>
        </div>
      </div>

      <div class="flex items-center gap-5 text-sm">
        <div class="text-center">
          <span class="font-bold text-lg text-green-600 tabular-nums">{entry.points}</span>
          <p class="text-xs text-gray-500">pts</p>
        </div>
        <div class="text-center">
          <span class="font-bold text-lg text-red-500 tabular-nums">{entry.forfeits}</span>
          <p class="text-xs text-gray-500">forfeits</p>
        </div>
      </div>
    </li>
  {/each}
</ol>
