<script lang="ts">
  import * as store from '../lib/store';

  const coach = $derived(store.getCoachmark());

  const steps = [
    {
      title: 'Pane edited — now export it',
      body: 'Your change is already in the Workspace JSON. Open Export in the header to see the live preview, copy it, or download it.',
    },
    {
      title: 'Create Pane wizard',
      body: 'Build panes step by step — source, type, then configure. Each step validates inline before you can advance.',
    },
    {
      title: 'Shared date range',
      body: 'The range buttons recompute every time-series pane on the page at once. Preview raw rows any time in the Data Source Library below.',
    },
  ];

  const step = $derived(steps[Math.min(coach.step, steps.length - 1)]!);
</script>

{#if coach.open}
  <aside
    class="coachmark fixed bottom-6 right-6 z-[45] w-[300px] max-w-[calc(100vw-2rem)] p-4 bg-white border border-[var(--color-border)] rounded-[var(--radius-base)] shadow-xl"
    role="complementary"
    aria-label="Builder tour"
  >
    <p class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--color-primary);">
      Tour · {coach.step + 1} of {steps.length}
    </p>
    <h2 class="text-sm font-semibold text-[var(--color-text-primary)] mt-1">{step.title}</h2>
    <p class="text-xs text-[var(--color-text-secondary)] mt-1">{step.body}</p>
    <div class="flex items-center justify-between mt-3">
      <button
        type="button"
        class="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
        onclick={() => store.dismissCoachmark()}
      >Skip tour</button>
      <button
        type="button"
        class="px-3 py-1.5 text-xs bg-[var(--color-primary)] text-white rounded-[var(--radius-base)] hover:opacity-90 transition-opacity"
        onclick={() => store.advanceCoachmark()}
      >
        {coach.step >= steps.length - 1 ? 'Done' : 'Next'}
      </button>
    </div>
  </aside>
{/if}
