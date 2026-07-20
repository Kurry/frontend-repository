<script lang="ts">
  import { tick, type Snippet } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { X } from 'phosphor-svelte';

  let { open, title, description = '', onclose, children }: {
    open: boolean;
    title: string;
    description?: string;
    onclose: () => void;
    children: Snippet;
  } = $props();

  let panel = $state<HTMLDivElement>();
  let opener: Element | null = null;

  $effect(() => {
    if (open) {
      opener = document.activeElement;
      tick().then(() => (panel?.querySelector<HTMLElement>('input, textarea, select, button') ?? panel)?.focus());
    } else if (opener instanceof HTMLElement) {
      opener.focus();
    }
  });

  function keydown(event: KeyboardEvent) {
    if (!open) return;
    if (event.key === 'Escape') { event.preventDefault(); onclose(); return; }
    if (event.key !== 'Tab' || !panel) return;
    const items = [...panel.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]')];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
</script>

<svelte:window onkeydown={keydown} />

{#if open}
  <div class="modal-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && onclose()} transition:fade={{ duration: 250 }}>
    <div bind:this={panel} class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby={description ? 'modal-description' : undefined} tabindex="-1" transition:scale={{ duration: 250, start: 0.95 }}>
      <header class="modal-header">
        <div>
          <h2 id="modal-title">{title}</h2>
          {#if description}<p id="modal-description">{description}</p>{/if}
        </div>
        <button class="icon-button" aria-label="Close dialog" onclick={onclose}><X size={18} /></button>
      </header>
      <div class="modal-body">{@render children()}</div>
    </div>
  </div>
{/if}
