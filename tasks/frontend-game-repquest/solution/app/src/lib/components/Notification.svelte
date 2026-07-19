<script lang="ts">
  import { quest } from '../../store.svelte';

  const show = $derived(quest.showNotification);
  const message = $derived(quest.notificationMessage);
</script>

{#if show}
  <div
    class="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-amber-700/50
           text-amber-300 px-4 py-2 rounded-xl shadow-2xl text-sm font-medium
           animate-[slideIn_0.3s_ease-out]"
    role="status"
    aria-live="polite"
  >
    {message}
  </div>
{/if}

<style>
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translate(-50%, -20px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
</style>
