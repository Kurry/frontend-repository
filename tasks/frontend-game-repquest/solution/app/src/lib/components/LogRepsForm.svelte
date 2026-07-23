<script lang="ts">
  import { Barbell } from 'phosphor-svelte';
  import { quest } from '../../store.svelte';

  // Svelte coerces bind:value on a type="number" input to an actual number
  // (or '' when empty) rather than always a string, so this must accept both.
  let repInput: number | string = $state('');
  let noteInput = $state('');
  let repsTouched = $state(false);
  let submitAttempted = $state(false);

  // Live validation: an inline, field-named error is shown the moment the
  // field holds a bad value (not only after submit), and the totals are never
  // mutated by an invalid submit. The Log reps button stays enabled and
  // rejects the submission so the inline error is reachable for every invalid
  // state, including an empty field.
  function repsError(): string {
    const raw = repInput;
    if (raw === '' || raw === null) {
      return submitAttempted ? 'Reps: enter a whole number from 1 to 9999.' : '';
    }
    const val = typeof raw === 'number' ? raw : Number(String(raw).trim());
    if (String(raw).trim() === '' || Number.isNaN(val) || !Number.isInteger(val) || val < 1 || val > 9999) {
      return 'Reps: enter a whole number from 1 to 9999.';
    }
    return '';
  }

  function noteError(): string {
    if (noteInput.length > 120) return 'Note: keep it to 120 characters or fewer.';
    return '';
  }

  const rErr = $derived(repsError());
  const nErr = $derived(noteError());

  function handleSubmit() {
    submitAttempted = true;
    repsTouched = true;
    if (rErr || nErr) {
      quest.feedbackMessage = rErr || nErr;
      return;
    }
    const val = typeof repInput === 'number' ? repInput : Number(String(repInput).trim());
    quest.logReps(val, noteInput);
    repInput = '';
    noteInput = '';
    submitAttempted = false;
    repsTouched = false;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit();
  }
</script>

<div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
  <h2 class="text-lg font-bold mb-3 flex items-center gap-2" style="color: var(--accent-strong)">
    <Barbell size={18} weight="fill" /> Log reps
  </h2>
  <div class="grid sm:grid-cols-[1fr_1.5fr_auto] gap-2 sm:items-end">
    <div class="flex-1 min-w-0">
      <label class="text-xs text-slate-400 font-medium block mb-1" for="rep-input">Number of reps</label>
      <input
        id="rep-input"
        type="number"
        min="1"
        max="9999"
        step="1"
        inputmode="numeric"
        bind:value={repInput}
        onkeydown={handleKeyDown}
        onblur={() => repsTouched = true}
        aria-invalid={rErr ? 'true' : 'false'}
        aria-describedby={rErr ? 'rep-error' : undefined}
        class="w-full bg-slate-900 border rounded-lg px-3 py-3 text-white text-sm
               focus:ring-1 hover:border-slate-500 transition-colors"
        style={rErr ? 'border-color: var(--color-danger)' : 'border-color: #475569'}
      />
    </div>
    <div class="min-w-0">
      <label class="text-xs text-slate-400 font-medium block mb-1" for="note-input">Note (optional)</label>
      <input
        id="note-input"
        bind:value={noteInput}
        aria-invalid={nErr ? 'true' : 'false'}
        aria-describedby="note-count {nErr ? 'note-error' : ''}"
        class="w-full bg-slate-900 border rounded-lg px-3 py-3 text-white text-sm"
        style={nErr ? 'border-color: var(--color-danger)' : 'border-color: #475569'}
      />
      <span id="note-count" class="text-[10px] {nErr ? 'text-red-400' : 'text-slate-500'}">{noteInput.length}/120</span>
    </div>
    <button
      onclick={handleSubmit}
      data-action="log-reps"
      class="text-slate-900 font-bold px-5 py-3 rounded-lg text-sm transition-all hover:shadow-lg hover:brightness-110 whitespace-nowrap self-end focus-visible:ring-2"
      style="background: var(--accent); box-shadow: 0 0 0 0 transparent;"
    >
      Log reps
    </button>
  </div>

  <div class="mt-2 space-y-1 min-h-[1rem]">
    {#if rErr}
      <p id="rep-error" class="text-red-400 text-xs" role="alert">{rErr}</p>
    {/if}
    {#if nErr}
      <p id="note-error" class="text-red-400 text-xs" role="alert">{nErr}</p>
    {/if}
  </div>
</div>
