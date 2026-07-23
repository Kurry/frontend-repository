<script lang="ts">
  import { CheckCircle, Warning, Trophy, X, Info } from 'phosphor-svelte';
  import { quest } from '../../store.svelte';
  import type { Toast } from '../../types';

  const tones: Record<Toast['tone'], string> = {
    info: 'border-slate-600 text-slate-200',
    success: 'border-emerald-600/60 text-emerald-200',
    warn: 'border-amber-600/60 text-amber-200',
    victory: 'border-emerald-500 text-emerald-100',
    defeat: 'border-rose-500 text-rose-100',
  };
</script>

<!-- Always-present polite live region for assistive tech (announcements are
     mirrored here even when the visual stack is empty). -->
<div class="sr-only" role="status" aria-live="polite" aria-atomic="true">{quest.ariaLive}</div>

<div class="fixed top-3 left-1/2 -translate-x-1/2 z-[70] w-[min(92vw,24rem)] flex flex-col gap-2 pointer-events-none" aria-hidden="false">
  {#each quest.toasts as toast (toast.id)}
    <div
      class="pointer-events-auto flex items-start gap-2 rounded-xl border bg-slate-800/95 backdrop-blur px-3.5 py-2.5 shadow-2xl text-sm font-medium"
      style="animation: rq-slide-in .28s ease-out"
      class:border-emerald-500={toast.tone === 'victory'}
      onanimationend={(e) => {
        if (e.animationName === 'rq-slide-out') quest.dismissToast(toast.id);
      }}
    >
      <span class="mt-0.5 shrink-0" style={toast.tone === 'victory' ? 'color: var(--color-success)' : toast.tone === 'defeat' ? 'color: var(--color-danger)' : 'color: var(--accent-strong)'}>
        {#if toast.tone === 'victory'}<Trophy size={18} weight="fill" />
        {:else if toast.tone === 'defeat'}<Warning size={18} weight="fill" />
        {:else if toast.tone === 'success'}<CheckCircle size={18} weight="fill" />
        {:else if toast.tone === 'warn'}<Warning size={18} weight="fill" />
        {:else}<Info size={18} weight="fill" />{/if}
      </span>
      <span class="flex-1 {tones[toast.tone]}">{toast.message}</span>
      <button onclick={() => quest.dismissToast(toast.id)} aria-label="Dismiss notification" class="text-slate-400 hover:text-white shrink-0"><X size={15} /></button>
    </div>
  {/each}
</div>
