<script lang="ts">
  import { IconAlertCircle, IconCheck, IconInfoCircle } from '@tabler/icons-svelte';
  import { fly } from 'svelte/transition';
  import { triage } from '../lib/triage.svelte';
  import { motion } from '../lib/motion.svelte';
</script>

<div class="toast-viewport" aria-live="polite" aria-atomic="true">
  {#each triage.toasts as toast (toast.id)}
    <div
      class={`toast ${toast.tone}`}
      class:instant={motion.reduced}
      role={toast.tone === 'danger' ? 'alert' : 'status'}
      in:fly={{ x: 28, duration: motion.reduced ? 0 : 280 }}
      out:fly={{ x: 28, duration: motion.reduced ? 0 : 220 }}
    >
      <span class="toast-icon">
        {#if toast.tone === 'success'}<IconCheck size={16} />
        {:else if toast.tone === 'danger'}<IconAlertCircle size={16} />
        {:else}<IconInfoCircle size={16} />{/if}
      </span>
      <span>{toast.message}</span>
    </div>
  {/each}
</div>
<div class="sr-only" aria-live="assertive">{triage.liveMessage}</div>

<style>
  .toast-viewport { position: fixed; z-index: 120; right: 18px; bottom: 18px; display: grid; width: min(360px, calc(100vw - 28px)); gap: 8px; pointer-events: none; }
  .toast {
    display: flex;
    min-height: 48px;
    align-items: center;
    gap: 9px;
    border: 1px solid #d9e2dd;
    border-radius: 12px;
    background: rgba(255,255,255,.96);
    padding: 10px 12px;
    color: #34413c;
    box-shadow: 0 12px 34px rgba(21,40,33,.16);
    font-size: 11px;
    font-weight: 700;
    line-height: 1.35;
    transform: translateX(0);
    opacity: 1;
  }
  .toast.instant { animation: none; }
  .toast-icon { display: inline-grid; width: 26px; height: 26px; flex: 0 0 auto; place-items: center; border-radius: 8px; background: #e4f3ed; color: #087f6d; }
  .toast.danger .toast-icon { background: #ffe3e1; color: #aa292e; }
  .toast.neutral .toast-icon { background: #e9edf5; color: #4a6097; }
  :global(.dark) .toast { border-color: #3a4944; background: rgba(31,43,39,.97); color: #e8efeb; }
</style>
