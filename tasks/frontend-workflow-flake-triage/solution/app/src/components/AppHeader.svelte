<script lang="ts">
  import { AppBar } from '@skeletonlabs/skeleton-svelte';
  import { IconFileExport, IconFileImport, IconFlask2, IconMoon, IconSun } from '@tabler/icons-svelte';
  import { triage } from '../lib/triage.svelte';

  let { exportTrigger = $bindable(), importTrigger = $bindable() }: { exportTrigger?: HTMLButtonElement; importTrigger?: HTMLButtonElement } = $props();
</script>

<AppBar class="topbar">
  <AppBar.Toolbar class="toolbar">
    <AppBar.Lead class="brand-block">
      <span class="brand-mark"><IconFlask2 size={20} stroke={2.3} /></span>
      <span class="brand-text"><strong>Flakework</strong><small>Determinism desk</small></span>
    </AppBar.Lead>
    <AppBar.Trail class="header-actions" aria-label="Report and theme actions">
      <button bind:this={importTrigger} class="action-btn" type="button" aria-label="Import triage report" onclick={() => triage.openImport()}>
        <IconFileImport size={15} /> <span>Import triage report</span>
      </button>
      <button bind:this={exportTrigger} class="action-btn primary" type="button" aria-label="Export triage report" onclick={() => triage.openExport()}>
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
  .theme-button { display: inline-grid; width: 38px; height: 38px; place-items: center; border: 1px solid #d6dfda; border-radius: 10px; background: #fff; color: #4d5b55; transition: background-color 150ms ease, transform 100ms ease, box-shadow 150ms ease; }
  .theme-button:hover { background: #f2f6f3; box-shadow: 0 4px 12px rgba(35,61,51,.08); }
  .theme-button:active { transform: translateY(1px); }
  :global(.dark .topbar) { border-color: rgba(50,66,60,.9); background: rgba(17,24,21,.88); }
  :global(.dark) .brand-text strong { color: #edf2ef; }
  :global(.dark) .theme-button { border-color: #3a4944; background: #202c28; color: #e7eeea; }
  @media (max-width: 650px) {
    :global(.toolbar) { min-height: 62px; padding: 0 12px; }
    .brand-text small { display: none; }
    :global(.header-actions) .action-btn { width: 38px; padding: 8px; }
    :global(.header-actions) .action-btn span { display: none; }
  }
</style>
