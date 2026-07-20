<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { savedBoards, activeMode, loadBoardToCanvas } from '../lib/store';
  import { fade } from 'svelte/transition';
  import type { SavedBoard } from '../lib/types';

  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dur = (ms: number) => (reduced ? 0 : ms);

  let isOpen = false;
  let search = '';
  let activeIndex = 0;
  let inputElement: HTMLInputElement;
  let prevFocus: HTMLElement | null = null;

  type Item = { kind: 'board'; board: SavedBoard } | { kind: 'mode'; mode: 'gallery' | 'export'; label: string };

  $: boardMatches = $savedBoards.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));
  $: modeMatches = (['Open Gallery', 'Open Export center'] as const)
    .map((label, i) => ({ kind: 'mode' as const, mode: (i === 0 ? 'gallery' : 'export') as 'gallery' | 'export', label }))
    .filter(m => m.label.toLowerCase().includes(search.toLowerCase()));
  $: items = [...boardMatches.map(b => ({ kind: 'board' as const, board: b })), ...modeMatches] as Item[];
  $: if (activeIndex >= items.length) activeIndex = Math.max(0, items.length - 1);

  function open() {
    prevFocus = document.activeElement as HTMLElement;
    isOpen = true; search = ''; activeIndex = 0;
    tick().then(() => inputElement?.focus());
  }
  function close() {
    isOpen = false;
    (prevFocus ?? null)?.focus?.();
  }
  function activate(item: Item) {
    if (item.kind === 'board') { loadBoardToCanvas(item.board); }
    else { activeMode.set(item.mode); }
    close();
  }
  function onInputKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex = Math.min(items.length - 1, activeIndex + 1); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex = Math.max(0, activeIndex - 1); return; }
    if (e.key === 'Enter') { e.preventDefault(); if (items[activeIndex]) activate(items[activeIndex]); return; }
    if (e.key === 'Tab') {
      // Trap: move focus into the result list (first result) on Tab, back to
      // input on Shift+Tab from the list.
      const first = document.getElementById('cp-result-0') as HTMLElement | null;
      if (!e.shiftKey && first) { e.preventDefault(); first.focus(); }
    }
  }
  function onListKeydown(e: KeyboardEvent, idx: number) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); const el = document.getElementById(`cp-result-${idx + 1}`); (el ?? inputElement).focus(); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); if (idx === 0) inputElement.focus(); else document.getElementById(`cp-result-${idx - 1}`)?.focus(); return; }
    if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); inputElement.focus(); }
  }
  function globalKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (isOpen) close(); else open();
    }
  }
  onMount(() => { window.addEventListener('keydown', globalKeydown); return () => window.removeEventListener('keydown', globalKeydown); });
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="fixed inset-0 bg-black/60 z-[100] flex items-start justify-center pt-[18vh] p-4" role="presentation" transition:fade={{ duration: dur(120) }} on:click={close}>
    <div class="bg-gray-900 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-gray-700" role="dialog" aria-modal="true" aria-label="Command palette" tabindex="-1" on:click|stopPropagation>
      <div class="p-4 border-b border-gray-800">
        <input bind:this={inputElement} bind:value={search} on:input={() => activeIndex = 0} on:keydown={onInputKeydown} type="text" placeholder="Search boards or run a command" class="w-full bg-transparent text-white text-lg focus:outline-none placeholder-gray-500" aria-label="Search boards or run a command" />
      </div>
      <div class="max-h-96 overflow-y-auto p-2" role="listbox" aria-label="Command results">
        {#if items.length === 0}
          <p class="text-gray-500 text-center py-8">No matching boards or commands.</p>
        {:else}
          {#each items as item, idx}
            <button
              id="cp-result-{idx}"
              role="option"
              aria-selected={activeIndex === idx}
              class="w-full text-left px-4 py-3 text-white rounded flex items-center justify-between focus:outline-none focus:bg-gray-800 {activeIndex === idx ? 'bg-gray-800' : 'hover:bg-gray-800'}"
              on:click={() => activate(item)}
              on:keydown={(e) => onListKeydown(e, idx)}
              on:focus={() => activeIndex = idx}
            >
              <span class="font-bold">{item.kind === 'board' ? item.board.name : item.label}</span>
              <span class="text-xs text-gray-500 bg-gray-950 px-2 py-1 rounded">{item.kind === 'board' ? item.board.tag : 'command'}</span>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}
