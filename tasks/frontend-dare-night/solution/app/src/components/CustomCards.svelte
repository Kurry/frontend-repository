<script lang="ts">
  import type { Card, Category, Intensity } from '../lib/cards';

  interface Props {
    customCards: Card[];
    showDeleteConfirm: string | null;
    onAddCard: (data: { prompt: string; category: Category; intensity: Intensity }) => void;
    onDeleteCard: (id: string) => void;
    onShowDeleteConfirm: (id: string | null) => void;
  }

  let {
    customCards,
    showDeleteConfirm,
    onAddCard,
    onDeleteCard,
    onShowDeleteConfirm,
  }: Props = $props();

  let newPrompt = $state('');
  let newCategory = $state<Category>('Dare');
  let newIntensity = $state<Intensity>('Mild');
  let formError = $state('');

  const categories: Category[] = ['Icebreaker', 'Truth', 'Dare', 'Wild'];
  const intensities: Intensity[] = ['Mild', 'Spicy', 'Wild'];

  function addCard() {
    const prompt = newPrompt.trim();
    if (!prompt) {
      formError = 'Enter a prompt for the card';
      return;
    }
    if (prompt.length < 5) {
      formError = 'Enter at least 5 characters';
      return;
    }
    formError = '';
    onAddCard({ prompt, category: newCategory, intensity: newIntensity });
    newPrompt = '';
    newCategory = 'Dare';
    newIntensity = 'Mild';
  }
</script>

<div>
  <h2 class="text-lg font-semibold mb-4" style="color: var(--color-accent);">Custom cards</h2>
  
  <!-- Add Card Form -->
  <div class="space-y-3 mb-4">
    <label class="block text-xs font-medium text-gray-700" for="custom-card-prompt">Card prompt</label>
    <input
      id="custom-card-prompt"
      type="text"
      class="w-full px-4 py-2 rounded-full border-2 border-gray-500 text-sm focus:outline-none focus:border-black transition-colors"
      placeholder="Enter your custom dare or question..."
      bind:value={newPrompt}
      maxlength="200"
    />
    
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div>
      <label class="block text-xs font-medium text-gray-700 mb-1" for="custom-card-category">Category</label>
      <select
        id="custom-card-category"
        class="w-full px-4 py-2 rounded-full border-2 border-gray-500 text-sm focus:outline-none focus:border-black bg-white"
        bind:value={newCategory}
      >
        {#each categories as cat}
          <option value={cat}>{cat}</option>
        {/each}
      </select>
      </div>
      <div>
      <label class="block text-xs font-medium text-gray-700 mb-1" for="custom-card-intensity">Intensity</label>
      <select
        id="custom-card-intensity"
        class="w-full px-4 py-2 rounded-full border-2 border-gray-500 text-sm focus:outline-none focus:border-black bg-white"
        bind:value={newIntensity}
      >
        {#each intensities as int}
          <option value={int}>{int}</option>
        {/each}
      </select>
      </div>
    </div>
    
    {#if formError}
      <p class="text-red-500 text-xs" role="alert">{formError}</p>
    {/if}
    
    <button
      class="px-6 py-2 rounded-full font-semibold text-white text-sm transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black shadow-md"
      style="background-color: var(--color-accent);"
      onclick={addCard}
    >
      Add custom card
    </button>
  </div>
  
  <!-- Custom Cards List -->
  <div class="space-y-2">
    {#if customCards.length === 0}
      <p class="text-gray-600 text-sm text-center py-4">No custom cards yet. Select Add custom card to create one.</p>
    {:else}
      {#each customCards as card (card.id)}
        <div class="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
          <div class="flex-1 min-w-0">
            <p class="text-sm truncate">{card.prompt}</p>
            <p class="text-xs text-gray-500">{card.category} • {card.intensity}</p>
          </div>
          {#if showDeleteConfirm === card.id}
            <div class="flex items-center gap-1">
              <button
                class="px-3 py-1 rounded-full text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                onclick={() => onDeleteCard(card.id)}
              >
                Confirm
              </button>
              <button
                class="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                onclick={() => onShowDeleteConfirm(null)}
              >
                Cancel
              </button>
            </div>
          {:else}
            <button
              class="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
              onclick={() => onShowDeleteConfirm(card.id)}
              aria-label="Delete custom card"
            >
              🗑
            </button>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</div>
