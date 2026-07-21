<script lang="ts">
  import { tick } from 'svelte';
  import { GearSix, Palette, Warning } from 'phosphor-svelte';
  import { quest } from '../../store.svelte';
  import type { AccentId } from '../../types';

  let goalInput = $state(String(quest.state.dailyGoal));
  let reminderHourInput = $state(String(quest.state.reminderHour));
  let reminderEnabledInput = $state(quest.state.dailyReminder);
  let showConfirmReset = $state(false);
  let goalError = $state('');
  let hourError = $state('');
  let resetButton = $state<HTMLButtonElement>();
  let dialog = $state<HTMLDivElement>();

  const accents: { id: AccentId; label: string; color: string }[] = [
    { id: 'amber', label: 'Amber', color: '#f59e0b' },
    { id: 'teal', label: 'Teal', color: '#14b8a6' },
    { id: 'rose', label: 'Rose', color: '#f43f5e' },
  ];

  // Mirror external store changes (import, reset, undo/redo) into the local
  // form fields WITHOUT clobbering what the user is typing. Tracked previous
  // store values keep this a one-way sync: editing the input does not change
  // the store, so the effect sees no store change and does not loop.
  let lastGoal = $state(quest.state.dailyGoal);
  let lastHour = $state(quest.state.reminderHour);
  $effect(() => {
    const g = quest.state.dailyGoal;
    const h = quest.state.reminderHour;
    if (g !== lastGoal) { lastGoal = g; goalInput = String(g); goalError = ''; }
    if (h !== lastHour) { lastHour = h; reminderHourInput = String(h); hourError = ''; }
    reminderEnabledInput = quest.state.dailyReminder;
  });

  function saveSettings() {
    const goal = Number(goalInput);
    const hour = Number(reminderHourInput);
    goalError = Number.isInteger(goal) && goal >= 1 && goal <= 9999 ? '' : 'Daily goal: enter a whole number from 1 to 9999.';
    hourError = Number.isInteger(hour) && hour >= 0 && hour <= 23 ? '' : 'Remind after: pick an hour from 0 to 23.';
    if (goalError || hourError) return;
    quest.saveSettings(goal, reminderEnabledInput, hour);
    goalInput = String(quest.state.dailyGoal);
    reminderHourInput = String(quest.state.reminderHour);
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
    focusFirstDialogControl();
  }

  function confirmReset() {
    quest.resetQuest();
    goalInput = String(quest.state.dailyGoal);
    reminderEnabledInput = quest.state.dailyReminder;
    reminderHourInput = String(quest.state.reminderHour);
    goalError = '';
    hourError = '';
    showConfirmReset = false;
    resetButton?.focus();
  }

  function cancelReset() {
    showConfirmReset = false;
    resetButton?.focus();
  }

  function focusableControls(): HTMLElement[] {
    if (!dialog) return [];
    return Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
  }

  function focusFirstDialogControl() {
    const controls = focusableControls();
    (controls[0] ?? dialog)?.focus();
  }

  // Robust focus trap: handle Tab even when focus is on the dialog container
  // itself (tabindex=-1) or has otherwise escaped the control list, by
  // redirecting to the first/last control. Escape closes and restores focus.
  function dialogKeydown(event: KeyboardEvent) {
    if (!showConfirmReset) return;
    if (event.key === 'Escape') { event.preventDefault(); cancelReset(); return; }
    if (event.key !== 'Tab') return;
    const controls = focusableControls();
    if (controls.length === 0) { event.preventDefault(); return; }
    const first = controls[0];
    const last = controls[controls.length - 1];
    const active = document.activeElement as HTMLElement | null;
    const inside = active != null && controls.includes(active);
    if (!inside) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return;
    }
    if (event.shiftKey && active === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); }
  }
</script>

<svelte:window onkeydown={dialogKeydown} />

<div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
  <h2 class="text-lg font-bold mb-4 flex items-center gap-2" style="color: var(--accent-strong)"><GearSix size={18} weight="fill" /> Settings</h2>

  <!-- Daily Goal -->
  <div class="mb-4">
    <label class="text-sm text-slate-300 font-medium block mb-1" for="daily-goal">Daily goal (reps)</label>
    <div class="flex gap-2 flex-wrap">
      <input
        id="daily-goal"
        type="number"
        min="1"
        max="9999"
        step="1"
        inputmode="numeric"
        bind:value={goalInput}
        aria-invalid={goalError ? 'true' : 'false'}
        aria-describedby={goalError ? 'goal-error' : undefined}
        class="w-28 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm
               focus:border-amber-500 focus:ring-1 focus:ring-amber-500 hover:border-slate-500"
      />
      <button
        onclick={saveSettings}
        data-action="save-settings"
        class="bg-slate-700 hover:bg-slate-600 text-white text-sm px-3 py-2 rounded-lg transition-colors"
      >
        Save settings
      </button>
    </div>
    {#if goalError}
      <p id="goal-error" class="text-red-400 text-xs mt-2" role="alert">{goalError}</p>
    {/if}
  </div>

  <!-- Daily Reminder (real checkbox => valid label association) -->
  <div class="mb-4">
    <span class="text-sm text-slate-300 font-medium block mb-2" id="reminder-group-label">Daily reminder</span>
    <label for="daily-reminder" class="flex items-center gap-3 cursor-pointer select-none">
      <span class="relative inline-flex items-center">
        <input
          id="daily-reminder"
          type="checkbox"
          bind:checked={reminderEnabledInput}
          aria-labelledby="reminder-group-label"
          class="peer sr-only"
        />
        <span class="w-12 h-6 rounded-full bg-slate-600 peer-checked:bg-amber-500 transition-colors block"></span>
        <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-6 pointer-events-none"></span>
      </span>
      <span class="text-sm text-slate-300">{reminderEnabledInput ? 'On' : 'Off'}</span>
    </label>
    {#if reminderEnabledInput}
      <div class="mt-2">
        <label class="text-xs text-slate-400 block mb-1" for="reminder-hour">Remind after</label>
        <select
          id="reminder-hour"
          bind:value={reminderHourInput}
          class="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-white text-sm
                 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 hover:border-slate-500"
        >
          {#each Array.from({length: 24}, (_, i) => i) as hour}
            <option value={String(hour)}>{formatHour(hour)}</option>
          {/each}
        </select>
      </div>
    {/if}
    {#if hourError}<p class="text-red-400 text-xs mt-2" role="alert">{hourError}</p>{/if}
  </div>

  <!-- Appearance accent (optional personalization beyond the settings payload) -->
  <div class="mb-4">
    <span class="text-sm text-slate-300 font-medium block mb-2 flex items-center gap-1.5"><Palette size={15} /> Appearance accent</span>
    <div class="flex gap-2" role="group" aria-label="Appearance accent color">
      {#each accents as a}
        <button
          onclick={() => quest.setAccent(a.id)}
          aria-pressed={quest.accent === a.id}
          aria-label={`${a.label} accent`}
          data-accent-option={a.id}
          class="w-9 h-9 rounded-full border-2 transition-transform hover:scale-110 {quest.accent === a.id ? 'ring-2 ring-white scale-110' : ''}"
          style="background: {a.color}; border-color: {quest.accent === a.id ? '#fff' : 'transparent'}"
        ></button>
      {/each}
    </div>
  </div>

  <!-- Reset Quest -->
  <div class="pt-3 border-t border-slate-700">
    <button
      onclick={handleReset}
      bind:this={resetButton}
      data-action="reset-quest"
      class="inline-flex items-center gap-1.5 bg-red-900/50 hover:bg-red-900 text-red-400 hover:text-red-300 text-sm font-medium
             px-4 py-2 rounded-lg transition-colors border border-red-800/50 hover:border-red-700"
    >
      <Warning size={15} /> Reset quest
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
      style="animation: rq-pop-in .2s ease-out"
      role="dialog"
      aria-modal="true"
      aria-label="Confirm reset quest"
      tabindex="-1"
    >
      <h3 class="text-lg font-bold text-white mb-2">Reset quest?</h3>
      <p class="text-slate-400 text-sm mb-4">
        This will wipe all lifetime reps, streak, quest points, unlocked zones and gear, and rep history. This cannot be undone.
      </p>
      <div class="flex gap-3 justify-end">
        <button
          onclick={cancelReset}
          data-action="cancel-reset"
          class="bg-slate-700 hover:bg-slate-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onclick={confirmReset}
          data-action="confirm-reset"
          class="bg-red-600 hover:bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
        >
          Reset everything
        </button>
      </div>
    </div>
  </div>
{/if}
