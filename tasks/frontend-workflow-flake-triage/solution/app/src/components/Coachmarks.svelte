<script lang="ts">
  import { IconMapPin, IconPlayerPlay, IconFileExport, IconX } from '@tabler/icons-svelte';
  import { fade, scale } from 'svelte/transition';
  import { triage } from '../lib/triage.svelte';
  import { motion } from '../lib/motion.svelte';

  const steps = [
    { title: 'Triage queue', body: 'Filter, sort by divergence, and assign a closed-vocabulary reason to each test.' },
    { title: 'Export triage report', body: 'Open Export anytime to copy Quarantine text or Triage report JSON from live session state.' },
    { title: 'Start re-run', body: 'Use Start re-run on a selected test to simulate 3, 5, or 10 runs and watch verdicts update.' },
  ];

  const step = $derived(steps[triage.coachStep] ?? steps[0]);
</script>

{#if triage.coachOpen}
  <div class="coach-layer" role="dialog" aria-modal="false" aria-labelledby="coach-title" transition:fade={{ duration: motion.reduced ? 0 : 180 }}>
    <div class="coach-card" transition:scale={{ start: 0.98, duration: motion.reduced ? 0 : 200 }}>
      <button class="close" type="button" aria-label="Dismiss coachmarks" onclick={() => triage.dismissCoach()}><IconX size={16} /></button>
      <span class="eyebrow">Quick tour · {triage.coachStep + 1} / {steps.length}</span>
      <h2 id="coach-title">
        {#if triage.coachStep === 0}<IconMapPin size={18} />
        {:else if triage.coachStep === 1}<IconFileExport size={18} />
        {:else}<IconPlayerPlay size={18} />{/if}
        {step.title}
      </h2>
      <p>{step.body}</p>
      <div class="actions">
        <button class="action-btn ghost" type="button" onclick={() => triage.dismissCoach()}>Skip</button>
        <button class="action-btn primary" type="button" onclick={() => triage.nextCoachStep()}>
          {triage.coachStep >= steps.length - 1 ? 'Got it' : 'Next tip'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .coach-layer {
    position: fixed;
    z-index: 70;
    right: 18px;
    bottom: 18px;
    width: min(340px, calc(100vw - 28px));
    pointer-events: none;
  }
  .coach-card {
    position: relative;
    pointer-events: auto;
    border: 1px solid #d7e3dd;
    border-radius: 16px;
    background: rgba(255,255,255,.97);
    padding: 16px 16px 14px;
    box-shadow: 0 16px 40px rgba(24,44,36,.16);
  }
  .close {
    position: absolute;
    top: 10px;
    right: 10px;
    display: grid;
    width: 28px;
    height: 28px;
    place-items: center;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: #68766f;
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 6px 0 0;
    color: #1d2925;
    font-size: 15px;
  }
  p {
    margin: 8px 0 0;
    color: #617069;
    font-size: 12px;
    line-height: 1.45;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 14px;
  }
  :global(.dark) .coach-card {
    border-color: #35443e;
    background: rgba(24,34,30,.97);
  }
  :global(.dark) h2 { color: #eef3f0; }
</style>
