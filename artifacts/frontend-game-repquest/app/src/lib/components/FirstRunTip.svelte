<script lang="ts">
  import { Lightbulb, X, Compass, Target } from 'phosphor-svelte';
  import { quest } from '../../store.svelte';
</script>

<div
  class="relative rounded-xl border p-4 flex items-start gap-3"
  style="border-color: var(--accent); background: var(--accent-soft); animation: rq-pop-in .3s ease-out"
  role="note"
  aria-label="First run tip"
>
  <span class="mt-0.5 shrink-0" style="color: var(--accent-strong)"><Lightbulb size={22} weight="fill" /></span>
  <div class="flex-1 min-w-0 text-sm text-slate-200">
    <p class="font-semibold text-white mb-1">Welcome to RepQuest</p>
    <p class="leading-relaxed">
      <span class="inline-flex items-center gap-1 align-middle"><Compass size={14} /> Log reps</span>
      in Quest mode to move your hero along the map, unlock zones, and beat bosses.
      Switch to <span class="inline-flex items-center gap-1 align-middle"><Target size={14} /> Challenge mode</span>
      for timed boss runs. Press <kbd class="kbd">?</kbd> any time for keyboard shortcuts.
    </p>
  </div>
  <button
    onclick={() => quest.dismissFirstRunTip()}
    class="shrink-0 text-slate-300 hover:text-white inline-flex items-center gap-1 rounded-lg px-2 py-1 border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-xs"
  >
    Got it <X size={14} />
  </button>
</div>

<style>
  .kbd{display:inline-block;min-width:1.2em;text-align:center;padding:0 5px;border-radius:5px;background:#0f172a;border:1px solid #475569;color:#e2e8f0;font-family:var(--font-display);font-size:11px}
</style>
