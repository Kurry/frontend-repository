<script>
  import { Button } from 'flowbite-svelte';
  import { ClipboardText, Export, List, Moon, Sun, X } from 'phosphor-svelte';
  let { state } = $props();

  const navigation = [
    { id: 'queue', label: 'Queue' },
    { id: 'canary', label: 'Canary' },
    { id: 'mutation', label: 'Mutation' },
    { id: 'audit', label: 'Audit' }
  ];
</script>

<header class="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-ink-950 text-white shadow-lg shadow-ink-950/10">
  <div class="mx-auto flex h-16 max-w-[1500px] items-center gap-4 px-4 sm:px-6 lg:px-8">
    <button class="interactive flex shrink-0 items-center gap-3 rounded-lg p-1 text-left" onclick={() => state.navigate('queue')} aria-label="Signal Trace queue home">
      <span class="relative grid size-9 place-items-center overflow-hidden rounded-lg bg-signal-500 shadow-inner">
        <span class="absolute h-8 w-px rotate-45 bg-white/40"></span>
        <ClipboardText aria-hidden="true" size={19} weight="bold" />
      </span>
      <span>
        <span class="block text-[10px] font-bold uppercase tracking-[.17em] text-slate-400">Signal Trace</span>
        <span class="block text-sm font-extrabold leading-4">Review console</span>
      </span>
    </button>

    <nav class="ml-3 hidden h-full items-center gap-1 md:flex" aria-label="Primary views">
      {#each navigation as item}
        <button
          class={`interactive relative h-full px-3 text-sm font-semibold ${state.activeView === item.id || (item.id === 'queue' && state.activeView === 'evidence-view') ? 'text-white' : 'text-slate-400 hover:text-white'}`}
          onclick={() => state.navigate(item.id)}
          aria-current={state.activeView === item.id ? 'page' : undefined}
        >
          {item.label}
          {#if state.activeView === item.id || (item.id === 'queue' && state.activeView === 'evidence-view')}
            <span class="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-signal-500"></span>
          {/if}
        </button>
      {/each}
    </nav>

    <div class="ml-auto flex items-center gap-2">
      <button class="interactive grid size-9 place-items-center rounded-lg border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white" onclick={() => state.setTheme(state.theme === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${state.theme === 'light' ? 'dark' : 'light'} theme`}>
        {#if state.theme === 'light'}<Moon aria-hidden="true" size={17} />{:else}<Sun aria-hidden="true" size={18} />{/if}
      </button>
      <Button color="alternative" class="interactive !border-white/15 !bg-white/10 !px-3 !py-2 !text-white hover:!bg-white/20" onclick={() => state.openExport()} aria-label="Export">
        <Export aria-hidden="true" size={16} weight="bold" class="mr-2" />
        <span class="hidden sm:inline">Export</span>
      </Button>
      <button class="interactive grid size-9 place-items-center rounded-lg border border-white/10 md:hidden" onclick={() => state.mobileNavOpen = !state.mobileNavOpen} aria-label="Toggle navigation" aria-expanded={state.mobileNavOpen}>
        {#if state.mobileNavOpen}<X aria-hidden="true" size={20} />{:else}<List aria-hidden="true" size={20} />{/if}
      </button>
    </div>
  </div>

  {#if state.mobileNavOpen}
    <nav class="border-t border-white/10 bg-ink-900 p-2 md:hidden" aria-label="Mobile views">
      <div class="mx-auto grid max-w-[1500px] grid-cols-4 gap-1">
        {#each navigation as item}
          <button class={`interactive rounded-lg px-2 py-2.5 text-xs font-bold ${state.activeView === item.id ? 'bg-signal-500 text-white' : 'text-slate-300 hover:bg-white/10'}`} onclick={() => state.navigate(item.id)}>{item.label}</button>
        {/each}
      </div>
    </nav>
  {/if}
</header>
