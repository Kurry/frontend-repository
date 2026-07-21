<script lang="ts">
  import { fade } from 'svelte/transition';
  import { S } from '../state.svelte';
  import Icon from './Icon.svelte';

  let {
    title,
    titleId,
    wide = false,
    onClose,
    showClose = true,
    children
  }: {
    title: string;
    titleId: string;
    wide?: boolean;
    onClose: () => void;
    showClose?: boolean;
    children?: any;
  } = $props();

  let panel: HTMLDivElement | undefined = $state(undefined);

  const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function focusables(): HTMLElement[] {
    if (!panel) return [];
    return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'Tab') {
      const f = focusables();
      if (!f.length) {
        e.preventDefault();
        return;
      }
      const first = f[0];
      const last = f[f.length - 1];
      const active = document.activeElement as HTMLElement;
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  $effect(() => {
    window.addEventListener('keydown', onKey, true);
    const id = window.setTimeout(() => {
      const f = focusables();
      if (f.length) f[0].focus();
      else panel?.focus();
    }, 0);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.clearTimeout(id);
    };
  });

  const dur = $derived(S.reduced ? 0 : 90);
</script>

<div class="overlay" role="presentation">
  <button
    class="backdrop"
    tabindex="-1"
    aria-label={`Close ${title}`}
    onclick={onClose}
    transition:fade={{ duration: dur }}
  ></button>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="panel"
    class:wide
    role="dialog"
    aria-modal="true"
    aria-labelledby={titleId}
    tabindex="-1"
    bind:this={panel}
    in:fade={{ duration: dur }}
  >
    <div class="panel-head">
      <h2 id={titleId}>{title}</h2>
      {#if showClose}
        <button class="icon-btn" aria-label={`Close ${title}`} onclick={onClose}>
          <Icon name="close" label="Close dialog" />
        </button>
      {/if}
    </div>
    {@render children?.()}
  </div>
</div>
