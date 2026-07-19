<script lang="ts">
  import { quest } from '../../store.svelte';

  const showReminder = $derived(quest.showReminderBanner);
  const dailyGoal = $derived(quest.state.dailyGoal);
  const todayReps = $derived(quest.todayReps);
  const remainingReps = $derived(Math.max(0, dailyGoal - todayReps));
</script>

{#if showReminder}
  <div
    class="bg-amber-900/40 border border-amber-700/50 rounded-xl p-3 flex items-center gap-3 animate-pulse"
    role="alert"
  >
    <span class="text-xl">⏰</span>
    <div class="flex-1">
      <p class="text-amber-300 text-sm font-semibold">Daily reminder</p>
      <p class="text-amber-200/70 text-xs">
        You still need {remainingReps} reps to meet today's goal of {dailyGoal}!
      </p>
    </div>
  </div>
{/if}
