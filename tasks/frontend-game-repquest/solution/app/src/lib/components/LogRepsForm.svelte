<script lang="ts">
  import { quest } from '../../store.svelte';

  // Svelte coerces bind:value on a type="number" input to an actual number
  // (or '' when empty) rather than always a string, so this must accept both.
  let repInput: number | string = $state('');
  let noteInput = $state('');
  let error = $state('');

  function handleSubmit() {
    error = '';
    const raw = repInput;
    const val = typeof raw === 'number' ? raw : Number(String(raw).trim());
    if (raw === '' || raw === null || Number.isNaN(val) || val < 1 || !Number.isInteger(val)) {
      error = 'Reps must be a whole number from 1 through 9999.';
      quest.feedbackMessage = error;
      return;
    }
    if (val > 9999) {
      error = 'Reps must be a whole number from 1 through 9999.';
      return;
    }
    if (noteInput.length > 120) {
      error = 'Note must be 120 characters or fewer.';
      return;
    }
    quest.logReps(val, noteInput);
    repInput = '';
    noteInput = '';
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }
</script>

<div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
  <h2 class="text-lg font-bold text-amber-400 mb-3">Log reps</h2>
  <div class="grid sm:grid-cols-[1fr_1.5fr_auto] gap-2 sm:items-end">
    <div class="flex-1">
      <label class="text-xs text-slate-400 font-medium block mb-1" for="rep-input">Number of reps</label>
      <input
        id="rep-input"
        type="number"
        min="1"
        max="9999"
        step="1"
        bind:value={repInput}
        onkeydown={handleKeyDown}
        placeholder="Enter reps..."
        class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-3.5 text-white text-sm
               placeholder:text-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500
               hover:border-slate-500 transition-colors"
      />
    </div>
    <div>
      <label class="text-xs text-slate-400 font-medium block mb-1" for="note-input">Note (optional)</label>
      <input id="note-input" maxlength="120" bind:value={noteInput} placeholder="What did you train?" class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-3.5 text-white text-sm" aria-describedby="note-count" />
      <span id="note-count" class="text-[10px] {noteInput.length > 120 ? 'text-red-400' : 'text-slate-500'}">{noteInput.length}/120</span>
    </div>
    <button
      onclick={handleSubmit}
      data-action="log-reps"
      disabled={repInput === '' || noteInput.length > 120}
      class="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-900 font-bold
             px-5 py-3.5 rounded-lg text-sm transition-all hover:shadow-lg hover:shadow-amber-500/20
             focus-visible:ring-2 focus-visible:ring-amber-400 whitespace-nowrap self-end"
    >
      Log reps
    </button>
  </div>
  {#if error}
    <p class="text-red-400 text-xs mt-2" role="alert">{error}</p>
  {/if}
</div>
