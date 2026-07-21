<script lang="ts">
  import { AppBar } from '@skeletonlabs/skeleton-svelte';
  import {
    IconFileExport,
    IconFileImport,
    IconFlask2,
    IconKeyboard,
    IconMoon,
    IconPlayerPause,
    IconSun,
    IconLayoutList,
  } from '@tabler/icons-svelte';
  import { triage } from '../lib/triage.svelte';
  import { motion, setReducedMotion, toggleDensity } from '../lib/motion.svelte';

  let { exportTrigger = $bindable(), importTrigger = $bindable() }: { exportTrigger?: HTMLButtonElement; importTrigger?: HTMLButtonElement } = $props();
</script>

<AppBar class="topbar">
  <AppBar.Toolbar class="toolbar">
    <AppBar.Lead class="brand-block">
      <span class="brand-mark"><IconFlask2 size={20} stroke={2.3} /></span>
      <span class="brand-text"><strong>Flakework</strong><small>Determinism desk</small></span>
    </AppBar.Lead>
    <AppBar.Trail class="header-actions" aria-label="Report and theme actions">
      <button
        class="pref-button"
        type="button"
        aria-label={motion.reduced ? 'Enable motion' : 'Reduce motion'}
        aria-pressed={motion.reduced}
        title="Reduce motion (M)"
        onclick={() => setReducedMotion(!motion.reduced)}
      >
        <IconPlayerPause size={16} />
      </button>
      <button
        class="pref-button"
        type="button"
        aria-label={`Switch to ${motion.density === 'comfortable' ? 'compact' : 'comfortable'} density`}
        title="Toggle density (D)"
        onclick={() => toggleDensity()}
      >
        <IconLayoutList size={16} />
      </button>
      <span class="shortcut-hint" title="Keyboard: E export · I import · / search · D density · M motion"><IconKeyboard size={15} /> Shortcuts</span>
      <button
        bind:this={importTrigger}
        class="action-btn"
        type="button"
        aria-label="Import triage report"
        onclick={(event) => triage.openImport(event.currentTarget)}
      >
        <IconFileImport size={15} /> <span>Import triage report</span>
      </button>
      <button
        bind:this={exportTrigger}
        class="action-btn primary"
        type="button"
        aria-label="Export triage report"
        onclick={(event) => triage.openExport('quarantine-text', event.currentTarget)}
      >
        <IconFileExport size={15} /> <span>Export triage report</span>
      </button>
      <button class="theme-button" type="button" aria-label={`Switch to ${triage.theme === 'light' ? 'dark' : 'light'} theme`} onclick={() => triage.toggleTheme()}>
        {#if triage.theme === 'light'}<IconMoon size={17} />{:else}<IconSun size={17} />{/if}
      </button>
    </AppBar.Trail>
  </AppBar.Toolbar>
</AppBar>

<style>
  :global(.topbar) { position: sticky; z-index: 40; top: 0; width: 100%; border-bottom: 1px solid rgba(213, 223, 217, .85); background: rgba(245,247,243,.88); backdrop-filter: blur(14px); }
  :global(.toolbar) { display: flex; width: min(100%, 1768px); min-height: 68px; margin: 0 auto; align-items: center; justify-content: space-between; gap: 20px; padding: 0 24px; }
  :global(.brand-block) { display: flex; align-items: center; gap: 10px; }
  .brand-mark { display: inline-grid; width: 36px; height: 36px; place-items: center; border-radius: 10px; background: #087f6d; color: white; box-shadow: 0 6px 14px rgba(8,127,109,.2); }
  .brand-text { display: flex; flex-direction: column; line-height: 1.08; }
  .brand-text strong { color: #17201d; font-size: 15px; letter-spacing: -.02em; }
  .brand-text small { margin-top: 4px; color: #77837e; font-size: 9px; font-weight: 750; letter-spacing: .06em; text-transform: uppercase; }
  :global(.header-actions) { display: flex; align-items: center; gap: 8px; }
  .pref-button, .theme-button { display: inline-grid; width: 38px; height: 38px; place-items: center; border: 1px solid #d6dfda; border-radius: 10px; background: #fff; color: #4d5b55; transition: background-color 150ms ease, transform 100ms ease, box-shadow 150ms ease; }
  .pref-button:hover, .theme-button:hover { background: #f2f6f3; box-shadow: 0 4px 12px rgba(35,61,51,.08); }
  .shortcut-hint { display: inline-flex; align-items: center; gap: 5px; color: #70807a; font-size: 10px; font-weight: 700; }
  :global(.dark .topbar) { border-color: rgba(50,66,60,.9); background: rgba(17,24,21,.88); }
  :global(.dark) .brand-text strong { color: #edf2ef; }
  :global(.dark) .pref-button, :global(.dark) .theme-button { border-color: #3a4944; background: #202c28; color: #e7eeea; }
  @media (max-width: 900px) {
    .shortcut-hint { display: none; }
  }
  @media (max-width: 650px) {
    :global(.toolbar) { min-height: 62px; padding: 0 12px; }
    .brand-text small { display: none; }
    :global(.header-actions) .action-btn { width: 38px; padding: 8px; }
    :global(.header-actions) .action-btn span { display: none; }
  }
</style>
