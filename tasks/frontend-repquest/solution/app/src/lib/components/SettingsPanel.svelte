<script lang="ts">
  import { quest } from '../../store.svelte';

  let goalInput = $state(String(quest.state.dailyGoal));
  let reminderHourInput = $state(String(quest.state.reminderHour));
  let showConfirmReset = $state(false);
  let goalError = $state('');
  const dailyReminder = $derived(quest.state.dailyReminder);
  const reminderHour = $derived(quest.state.reminderHour);

  function saveGoal() {
    const val = parseInt(goalInput, 10);
    if (Number.isNaN(val) || val <= 0 || !Number.isInteger(val)) {
      goalError = 'Enter a positive whole number';
      return;
    }
    goalError = '';
    quest.updateDailyGoal(val);
  }

  function saveReminderHour() {
    const val = parseInt(reminderHourInput, 10);
    if (val >= 0 && val <= 23) {
      quest.updateReminderHour(val);
    }
  }

  function formatHour(hour: number): string {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  }

  function handleReset() {
    showConfirmReset = true;
  }

  function confirmReset() {
    quest.resetQuest();
    showConfirmReset = false;
  }

  function cancelReset() {
    showConfirmReset = false;
  }
</script>

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
        onclick={saveGoal}
        class="bg-slate-700 hover:bg-slate-600 text-white text-sm px-3 py-2 rounded-lg transition-colors
               focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        Save
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
        onclick={() => quest.toggleDailyReminder()}
        class="relative w-12 h-6 rounded-full transition-colors {dailyReminder ? 'bg-amber-500' : 'bg-slate-600'}
               focus-visible:ring-2 focus-visible:ring-amber-400"
        role="switch"
        aria-checked={dailyReminder}
        aria-label="Toggle daily reminder"
      >
        <span
          class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform
                 {dailyReminder ? 'translate-x-6' : 'translate-x-0'}"
        ></span>
      </button>
      <span class="text-sm text-slate-400">{dailyReminder ? 'On' : 'Off'}</span>
    </div>
    {#if dailyReminder}
      <div class="mt-2">
        <label class="text-xs text-slate-500 block mb-1" for="reminder-hour">Remind after:</label>
        <select
          id="reminder-hour"
          bind:value={reminderHourInput}
          onchange={saveReminderHour}
          class="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-white text-sm
                 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 hover:border-slate-500"
        >
          {#each Array.from({length: 24}, (_, i) => i) as hour}
            <option value={hour}>{formatHour(hour)}</option>
          {/each}
        </select>
      </div>
    {/if}
  </div>

  <!-- Reset Quest -->
  <div class="pt-3 border-t border-slate-700">
    <button
      onclick={handleReset}
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
    onclick={cancelReset}
    onkeydown={(e) => e.key === 'Escape' && cancelReset()}
    role="presentation"
  >
    <div
      class="bg-slate-800 rounded-xl p-6 max-w-sm w-full border border-slate-700 shadow-2xl"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => { if (e.key === 'Escape') { cancelReset(); } e.stopPropagation(); }}
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
