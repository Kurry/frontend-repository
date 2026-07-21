<script lang="ts">
  import { onMount } from 'svelte';
  import { CheckCircle, WarningCircle, Info } from 'phosphor-svelte';

  interface Props {
    toast: { id: number; message: string; type: 'success' | 'error' | 'info' };
  }
  let { toast }: Props = $props();

  let leaving = $state(false);

  onMount(() => {
    // Begin the slide-out 300ms before the parent removes this toast, so the
    // toast "disappears on its own" with a visible exit rather than popping out.
    const t = setTimeout(() => { leaving = true; }, 2700);
    return () => clearTimeout(t);
  });

  function cls(type: string): string {
    switch (type) {
      case 'success': return 'bg-green-600 text-white';
      case 'error': return 'bg-red-600 text-white';
      default: return 'bg-gray-900 text-white';
    }
  }
</script>

<div
  class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full shadow-xl text-sm font-medium pointer-events-auto {leaving ? 'toast-exit' : 'toast-enter'} {cls(toast.type)}"
  role={toast.type === 'error' ? 'alert' : 'status'}
  aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
>
  {#if toast.type === 'success'}<CheckCircle size={18} weight="bold" aria-hidden="true" />
  {:else if toast.type === 'error'}<WarningCircle size={18} weight="bold" aria-hidden="true" />
  {:else}<Info size={18} weight="bold" aria-hidden="true" />{/if}
  <span>{toast.message}</span>
</div>
