<script lang="ts">
  import { REASONS, type Reason } from '../lib/types';

  let { testId, reason, onReasonChange }: { testId: string; reason: Reason; onReasonChange: (testId: string, reason: Reason) => void | Promise<void> } = $props();
</script>

<div class="reason-field">
  <label class="sr-only" for={`reason-${testId}`}>Reason for {testId}</label>
  <select
    id={`reason-${testId}`}
    class="reason-select mono"
    value={reason}
    onclick={(event) => event.stopPropagation()}
    onchange={(event) => onReasonChange(testId, (event.currentTarget as HTMLSelectElement).value as Reason)}
  >
    {#each REASONS as option}
      <option value={option}>{option}</option>
    {/each}
  </select>
</div>

<style>
  .reason-field {
    width: 100%;
  }
  .reason-select {
    width: 100%;
    min-width: 160px;
    height: 34px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: #46534e;
    padding: 5px 28px 5px 7px;
    font-size: 11px;
    transition: background-color 150ms ease, border-color 150ms ease;
  }
  .reason-select:hover {
    border-color: #d2dcd6;
    background: #fff;
  }
  :global(.dark) .reason-select {
    color: #b8c4bf;
  }
  :global(.dark) .reason-select:hover {
    border-color: #40504a;
    background: #1a2521;
  }
</style>
