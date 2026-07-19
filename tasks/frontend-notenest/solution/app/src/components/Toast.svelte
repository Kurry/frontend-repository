<script lang="ts">
  import { getToasts } from '../lib/store.svelte';

  let toasts = $derived(getToasts());
</script>

<div class="fixed top-4 right-4 z-50 flex flex-col gap-2" role="alert" aria-live="polite">
  {#each toasts as toast (toast.id)}
    <div
      class="toast-enter px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium max-w-xs"
      class:bg-green-500={toast.type === 'success'}
      class:bg-red-500={toast.type === 'error'}
      class:bg-blue-500={toast.type === 'info'}
    >
      {toast.message}
    </div>
  {/each}
</div>
