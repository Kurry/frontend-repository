<script lang="ts">
  import { fly } from 'svelte/transition';
  import { Trash, Plus, PlusCircle } from 'phosphor-svelte';
  import type { Card, Category, Intensity } from '../lib/cards';
  import { motionMs } from '../lib/motion';

  interface Props {
    customCards: Card[];
    showDeleteConfirm: string | null;
    onAddCard: (data: { prompt: string; category: Category; intensity: Intensity }) => void;
    onShowDeleteConfirm: (id: string | null) => void;
  }
  let { customCards, showDeleteConfirm, onAddCard, onShowDeleteConfirm }: Props = $props();

  let newPrompt = $state('');
  let newCategory = $state<Category>('Dare');
  let newIntensity = $state<Intensity>('Mild');

  const categories: Category[] = ['Icebreaker', 'Truth', 'Dare', 'Wild'];
  const intensities: Intensity[] = ['Mild', 'Spicy', 'Wild'];

  let trimmed = $derived(newPrompt.trim());
  let promptValid = $derived(trimmed.length >= 8 && trimmed.length <= 200);
  let promptError = $derived(
    newPrompt.length === 0 ? '' :
    trimmed.length < 8 ? 'Field prompt must be 8 to 200 characters' :
    trimmed.length > 200 ? 'Field prompt must be 8 to 200 characters' : ''
  );

  function addCard() {
    if (!promptValid) return;
    onAddCard({ prompt: trimmed, category: newCategory, intensity: newIntensity });
    newPrompt = '';
    newCategory = 'Dare';
    newIntensity = 'Mild';
  }
</script>

<div>
  <h2 class="text-lg font-semibold mb-2.5" style="color: var(--color-accent);">Custom Cards</h2>

  <div class="space-y-2.5 mb-5">
    <label class="block text-xs font-medium text-gray-700 mb-1" for="custom-card-prompt">Card prompt</label>
    <input
      id="custom-card-prompt"
      type="text"
      class="w-full px-5 py-2.5 rounded-full border-2 text-sm transition-colors {promptError ? 'border-red-500' : 'border-gray-500 focus-within:border-black'}"
      placeholder="Write a dare or question (8 to 200 characters)…"
      bind:value={newPrompt}
    />

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1" for="custom-card-category">Category</label>
        <select id="custom-card-category" class="w-full px-5 py-2.5 rounded-full border-2 border-gray-500 text-sm bg-white" bind:value={newCategory}>
          {#each categories as cat}<option value={cat}>{cat}</option>{/each}
        </select>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-700 mb-1" for="custom-card-intensity">Intensity</label>
        <select id="custom-card-intensity" class="w-full px-5 py-2.5 rounded-full border-2 border-gray-500 text-sm bg-white" bind:value={newIntensity}>
          {#each intensities as int}<option value={int}>{int}</option>{/each}
        </select>
      </div>
    </div>

    {#if promptError}
      <p class="text-red-600 text-xs" role="alert">{promptError}</p>
    {/if}

    <button
      class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full font-semibold text-white text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      style="background-color: var(--color-accent);"
      onclick={addCard}
      disabled={!promptValid}
    >
      <Plus size={18} weight="bold" aria-hidden="true" /> Add custom card
    </button>
  </div>

  <!-- List / empty state -->
  {#if customCards.length === 0}
    <div class="rounded-[10px] bg-gray-50 px-5 py-5 text-center">
      <PlusCircle size={26} weight="duotone" class="mx-auto mb-2.5 text-gray-400" aria-hidden="true" />
      <p class="text-sm text-gray-600">No custom cards yet. Write a prompt of 8 to 200 characters above, choose a category and intensity, then select Add custom card — it shuffles into every deck you play.</p>
    </div>
  {:else}
    <ul class="space-y-2.5">
      {#each customCards as card (card.id)}
        <li
          class="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-gray-50"
          in:fly={{ y: -10, opacity: 0, duration: motionMs(260) }}
          out:fly={{ x: 24, opacity: 0, duration: motionMs(220) }}
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm truncate">{card.prompt}</p>
            <p class="text-xs text-gray-500">{card.category} • {card.intensity}</p>
          </div>
          <button
            class="inline-flex items-center gap-1 p-2.5 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            onclick={() => onShowDeleteConfirm(card.id)}
            aria-label={`Delete custom card: ${card.prompt}`}
          >
            <Trash size={18} weight="bold" aria-hidden="true" />
            <span class="sr-only">Delete</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  <!-- kept for API parity; deletion now confirms via a centered dialog in App -->
  <span class="sr-only">{showDeleteConfirm ?? ''}</span>
</div>
