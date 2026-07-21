<script lang="ts">
  import { BellRinging } from 'phosphor-svelte';
  import { quest } from '../../store.svelte';

  const showReminder = $derived(quest.showReminderBanner);
  const dailyGoal = $derived(quest.state.dailyGoal);
  const todayReps = $derived(quest.todayReps);
  const remainingReps = $derived(Math.max(0, dailyGoal - todayReps));
</script>

{#if showReminder}
  <div
    class="reminder-banner border rounded-xl p-3 flex items-center gap-3"
    role="alert"
    aria-live="assertive"
  >
    <span class="text-amber-300 shrink-0" style="animation: rq-pulse 1.4s ease-in-out infinite"><BellRinging size={24} weight="fill" /></span>
    <div class="flex-1 min-w-0">
      <p class="text-amber-200 text-sm font-semibold">Daily reminder</p>
      <p class="text-amber-100/80 text-xs">
        You still need {remainingReps} reps to meet today's goal of {dailyGoal}.
      </p>
    </div>
  </div>
{/if}

<style>
  .reminder-banner {
    background: rgba(120, 53, 15, 0.45);
    border-color: rgba(217, 119, 6, 0.55);
    animation: rq-pulse-ring 1.6s ease-in-out infinite;
  }
</style>
