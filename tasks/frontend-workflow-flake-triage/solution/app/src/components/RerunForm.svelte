<script lang="ts">
  import { createForm } from '@tanstack/svelte-form';
  import { IconPlayerPlayFilled, IconX } from '@tabler/icons-svelte';
  import { scale } from 'svelte/transition';
  import { RUN_COUNTS } from '../lib/types';
  import { rerunRequestSchema } from '../lib/schemas';
  import { triage } from '../lib/triage.svelte';
  import { focusTrap } from '../lib/focusTrap';
  import { motion } from '../lib/motion.svelte';

  let { testId, open }: { testId: string; open: boolean } = $props();
  let runCount = $state<number>(0);
  let runCountError = $state('');
  let wasOpen = false;

  const form = createForm(() => ({
    defaultValues: { runCount: 0 as number },
    onSubmit: ({ value }) => {
      const parsed = rerunRequestSchema.safeParse(value);
      if (!parsed.success) {
        runCountError = parsed.error.issues[0]?.message ?? 'runCount is required and must be 3, 5, or 10';
        return;
      }
      runCountError = '';
      triage.startRerun(testId, parsed.data);
    },
  }));

  $effect(() => {
    if (open && !wasOpen) {
      runCount = 0;
      runCountError = '';
      form.reset({ runCount: 0 });
    }
    wasOpen = open;
  });

  function submitRerun() {
    const parsed = rerunRequestSchema.safeParse({ runCount });
    if (!parsed.success) {
      runCountError = parsed.error.issues[0]?.message ?? 'runCount is required and must be 3, 5, or 10';
      return;
    }
    runCountError = '';
    form.setFieldValue('runCount', parsed.data.runCount);
    void form.handleSubmit();
  }
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === 'Escape' && open && !triage.exportOpen && !triage.importOpen) triage.closeRerun();
  }}
/>

{#if open}
<form
  class="rerun-form open"
  aria-label={`Re-run ${testId}`}
  transition:scale={{ start: 0.98, duration: motion.reduced ? 0 : 240 }}
  use:focusTrap={{ returnFocus: triage.rerunReturnFocus }}
  onsubmit={(event) => {
    event.preventDefault();
    event.stopPropagation();
    submitRerun();
  }}
>
  <div class="form-heading">
    <div>
      <span class="eyebrow">Simulated execution</span>
      <h4>Configure re-run</h4>
    </div>
    <button class="icon-button" type="button" aria-label="Close re-run form" onclick={() => triage.closeRerun()}>
      <IconX size={17} />
    </button>
  </div>
  <label for={`run-count-${testId}`}>Run count</label>
  <select
    id={`run-count-${testId}`}
    data-autofocus
    class:error={!!runCountError}
    class="control"
    value={runCount}
    aria-describedby={`run-count-error-${testId}`}
    aria-invalid={!!runCountError}
    onchange={(event) => {
      runCount = Number((event.currentTarget as HTMLSelectElement).value);
      form.setFieldValue('runCount', runCount);
      runCountError = rerunRequestSchema.safeParse({ runCount }).success
        ? ''
        : 'runCount is required and must be 3, 5, or 10';
    }}
  >
    <option value={0} disabled>Choose run count</option>
    {#each RUN_COUNTS as count}
      <option value={count}>{count} runs</option>
    {/each}
  </select>
  {#if runCountError}
    <p class="field-error" id={`run-count-error-${testId}`} role="alert">{runCountError}</p>
  {:else}
    <p class="field-help" id={`run-count-error-${testId}`}>Each result lands in sequence and updates the shared matrix.</p>
  {/if}
  <button
    class="action-btn primary start-button"
    type="submit"
    disabled={triage.rerunFor(testId)?.status === 'running'}
  >
    <IconPlayerPlayFilled size={14} />
    Start re-run
  </button>
</form>
{/if}

<style>
  .rerun-form {
    margin-top: 14px;
    overflow: hidden;
    border: 1px solid #dce4df;
    border-radius: 13px;
    background: #f8faf8;
    padding: 14px;
    transform-origin: top center;
  }
  .form-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 13px;
  }
  h4 {
    margin: 2px 0 0;
    color: #1d2925;
    font-size: 14px;
  }
  label {
    display: block;
    margin-bottom: 6px;
    color: #4c5a55;
    font-size: 12px;
    font-weight: 750;
  }
  select {
    width: 100%;
  }
  .icon-button {
    display: inline-grid;
    width: 30px;
    height: 30px;
    place-items: center;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: #68766f;
  }
  .icon-button:hover {
    background: #e8eeea;
  }
  .field-help,
  .field-error {
    min-height: 17px;
    margin: 5px 0 10px;
    font-size: 11px;
  }
  .field-help { color: #74817c; }
  .field-error { color: #b5272d; font-weight: 700; }
  .start-button { width: 100%; }
  :global(.dark) .rerun-form {
    border-color: #35443e;
    background: #17211e;
  }
  :global(.dark) h4 { color: #edf2ef; }
  :global(.dark) label { color: #bac5c0; }
  :global(.dark) .icon-button:hover { background: #293630; }
</style>
