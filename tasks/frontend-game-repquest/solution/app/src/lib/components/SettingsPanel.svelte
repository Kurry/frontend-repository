<script lang="ts">
  import { tick } from 'svelte';
  import { quest } from '../../store.svelte';

  let goalInput = $state(String(quest.state.dailyGoal));
  let reminderHourInput = $state(String(quest.state.reminderHour));
  let showConfirmReset = $state(false);
  let goalError = $state('');
  let hourError = $state('');
  let savedPayload = $state('');
  let reminderEnabledInput = $state(quest.state.dailyReminder);
  let resetButton = $state<HTMLButtonElement>();
  let dialog = $state<HTMLDivElement>();

  function saveSettings() {
    const goal = Number(goalInput);
    const hour = Number(reminderHourInput);
    goalError = Number.isInteger(goal) && goal >= 1 && goal <= 9999 ? '' : 'DailyGoal must be a whole number from 1 through 9999.';
    hourError = Number.isInteger(hour) && hour >= 0 && hour <= 23 ? '' : 'ReminderHour must be a whole hour from 0 through 23.';
    if (goalError || hourError) return;
    quest.saveSettings(goal, reminderEnabledInput, hour);
    savedPayload = JSON.stringify({ dailyGoal: goal, reminderEnabled: reminderEnabledInput, reminderHour: hour });
  }

  function formatHour(hour: number): string {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  }

  async function handleReset() {
    showConfirmReset = true;
    await tick();
    dialog?.querySelector<HTMLButtonElement>('[data-action="cancel-reset"]')?.focus();
  }

  function confirmReset() {
    quest.resetQuest();
    goalInput = String(quest.state.dailyGoal);
    reminderEnabledInput = quest.state.dailyReminder;
    reminderHourInput = String(quest.state.reminderHour);
    goalError = '';
    hourError = '';
    savedPayload = '';
    showConfirmReset = false;
    resetButton?.focus();
  }

  function cancelReset() {
    showConfirmReset = false;
    resetButton?.focus();
  }

  function dialogKeydown(event: KeyboardEvent) {
    if (!showConfirmReset) return;
    if (event.key === 'Escape') { event.preventDefault(); cancelReset(); return; }
    if (event.key !== 'Tab') return;
    if (!dialog) { event.preventDefault(); return; }
    const controls = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled])'));
    const first = controls[0], last = controls[controls.length - 1];
    if (!dialog.contains(document.activeElement)) {
      event.preventDefault();
      (event.shiftKey ? last : first)?.focus();
    }
    else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
</script>

<svelte:window onkeydown={dialogKeydown} />

<div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
  <h2 class="text-lg font-bold text-amber-400 mb-4">Settings</h2>

  <!-- Daily Goal -->
  <div class="mb-4">
    <label class="text-sm text-slate-300 font-medium block mb-1" for="daily-goal">Daily goal (reps)</label>
    <div class="flex gap-2">
      <input
        id="daily-goal"
        type="number"
        min="1"
        max="9999"
        step="1"
        bind:value={goalInput}
        class="w-24 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm
               focus:border-amber-500 focus:ring-1 focus:ring-amber-500 hover:border-slate-500"
      />
      <button
        onclick={saveSettings}
        data-action="save-settings"
        class="bg-slate-700 hover:bg-slate-600 text-white text-sm px-3 py-2 rounded-lg transition-colors
               focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        Save settings
      </button>
    </div>
    {#if goalError}
      <p class="text-red-400 text-xs mt-2" role="alert">{goalError}</p>
    {/if}
  </div>

  <!-- Daily Reminder -->
  <div class="mb-4">
    <label class="text-sm text-slate-300 font-medium block mb-2" for="daily-reminder">Daily reminder</label>
    <div class="flex items-center gap-3">
      <button
        id="daily-reminder"
        onclick={() => reminderEnabledInput = !reminderEnabledInput}
        class="relative w-12 h-6 rounded-full transition-colors {reminderEnabledInput ? 'bg-amber-500' : 'bg-slate-600'}
               focus-visible:ring-2 focus-visible:ring-amber-400"
        role="switch"
        aria-checked={reminderEnabledInput}
        aria-label="Toggle daily reminder"
      >
        <span
          class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform
                 {reminderEnabledInput ? 'translate-x-6' : 'translate-x-0'}"
        ></span>
      </button>
      <span class="text-sm text-slate-400">{reminderEnabledInput ? 'On' : 'Off'}</span>
    </div>
    {#if reminderEnabledInput}
      <div class="mt-2">
        <label class="text-xs text-slate-500 block mb-1" for="reminder-hour">Remind after:</label>
        <select
          id="reminder-hour"
          bind:value={reminderHourInput}
          class="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-white text-sm
                 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 hover:border-slate-500"
        >
          {#each Array.from({length: 24}, (_, i) => i) as hour}
            <option value={hour}>{formatHour(hour)}</option>
          {/each}
        </select>
      </div>
    {/if}
    {#if hourError}<p class="text-red-400 text-xs mt-2" role="alert">{hourError}</p>{/if}
    {#if savedPayload}<p class="text-green-400 text-xs mt-2">Saved settings request: {savedPayload}</p>{/if}
  </div>

  <!-- Reset Quest -->
  <div class="pt-3 border-t border-slate-700">
    <button
      onclick={handleReset}
      bind:this={resetButton}
      data-action="reset-quest"
      class="bg-red-900/50 hover:bg-red-900 text-red-400 hover:text-red-300 text-sm font-medium
             px-4 py-2 rounded-lg transition-colors border border-red-800/50 hover:border-red-700
             focus-visible:ring-2 focus-visible:ring-red-400"
    >
      Reset quest
    </button>
  </div>
</div>

<!-- Confirmation Modal -->
{#if showConfirmReset}
  <div
    class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
    onclick={(event) => event.target === event.currentTarget && cancelReset()}
    role="presentation"
  >
    <div
      bind:this={dialog}
      class="bg-slate-800 rounded-xl p-6 max-w-sm w-full border border-slate-700 shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-label="Confirm reset quest"
      tabindex="-1"
    >
      <h3 class="text-lg font-bold text-white mb-2">Reset quest?</h3>
      <p class="text-slate-400 text-sm mb-4">
        This will wipe all lifetime reps, streak, quest points, unlocked zones/gear and rep history. This cannot be undone.
      </p>
      <div class="flex gap-3 justify-end">
        <button
          onclick={cancelReset}
          data-action="cancel-reset"
          class="bg-slate-700 hover:bg-slate-600 text-white text-sm px-4 py-2 rounded-lg
                 focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          Cancel
        </button>
        <button
          onclick={confirmReset}
          data-action="confirm-reset"
          class="bg-red-600 hover:bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-lg
                 focus-visible:ring-2 focus-visible:ring-red-400"
        >
          Reset everything
        </button>
      </div>
    </div>
  </div>
{/if}
