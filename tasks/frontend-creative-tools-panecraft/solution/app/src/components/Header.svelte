<script lang="ts">
  import * as store from '../lib/store';
</script>

<header class="bg-[var(--color-secondary)] text-white py-4 px-4">
  <div class="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
    <h1 class="text-[28px] leading-tight font-semibold tracking-tight" style="color: #FFFFFF;">PaneCraft</h1>
    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-xs text-white/60 hidden sm:inline">Dashboard Builder</span>
      <button
        type="button"
        data-default-focus
        class="tap-target px-3 py-1.5 text-xs bg-[var(--color-primary)] text-white rounded-[var(--radius-base)] hover:opacity-90 transition-opacity whitespace-nowrap"
        onclick={() => store.openExportCenter('export')}
      >
        Export
      </button>
      <button
        type="button"
        class="tap-target px-3 py-1.5 text-xs border border-white/40 rounded-[var(--radius-base)] text-white hover:bg-white/10 transition-colors whitespace-nowrap"
        onclick={() => store.openExportCenter('import')}
      >
        Import
      </button>
    </div>
  </div>
</header>
