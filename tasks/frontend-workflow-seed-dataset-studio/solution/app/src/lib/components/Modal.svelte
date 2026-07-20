<script lang="ts">
  import { tick, type Snippet } from 'svelte';
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
  let mounted = $state(false);
  let visible = $state(false);
  let leaving = $state(false);

  $effect(() => {
    let enterFrame = 0;
    if (open) {
      mounted = true;
      leaving = false;
      opener = document.activeElement;
      enterFrame = requestAnimationFrame(() => {
        visible = true;
        tick().then(() => (panel?.querySelector<HTMLElement>('input, textarea, select, button') ?? panel)?.focus());
      });
    } else if (mounted) {
      visible = false;
      leaving = true;
      const timer = setTimeout(() => {
        mounted = false;
        leaving = false;
        if (opener instanceof HTMLElement) opener.focus();
      }, 250);
      return () => {
        cancelAnimationFrame(enterFrame);
        clearTimeout(timer);
      };
    }
    return () => cancelAnimationFrame(enterFrame);
  });

  function keydown(event: KeyboardEvent) {
    if (!open && !visible) return;
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

{#if mounted}
  <div
    class="modal-backdrop"
    class:modal-open={visible && !leaving}
    class:modal-leave={leaving}
    role="presentation"
    onclick={(event) => event.target === event.currentTarget && onclose()}
  >
    <div
      bind:this={panel}
      class="modal-panel"
      class:modal-panel-open={visible && !leaving}
      class:modal-panel-leave={leaving}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? 'modal-description' : undefined}
      tabindex="-1"
    >
      <header class="modal-header">
        <div>
          <h2 id="modal-title">{title}</h2>
          {#if description}<p id="modal-description">{description}</p>{/if}
        </div>
        <button class="icon-button" aria-label="Close dialog" onclick={onclose}><X size={18} aria-hidden="true" /></button>
      </header>
      <div class="modal-body">{@render children()}</div>
    </div>
  </div>
{/if}
