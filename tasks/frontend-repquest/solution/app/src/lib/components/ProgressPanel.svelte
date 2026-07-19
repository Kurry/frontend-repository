<script lang="ts">
  import { quest } from '../../store.svelte';

  const todayReps = $derived(quest.todayReps);
  const dailyGoal = $derived(quest.state.dailyGoal);
  const goalProgress = $derived(quest.goalProgress);
  const goalColor = $derived(quest.goalColor);
  const streak = $derived(quest.state.currentStreak);
</script>

<div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
  <div class="grid grid-cols-2 gap-4">
    <!-- Daily Goal Progress -->
    <div>
      <h3 class="text-xs font-semibold text-slate-400 tracking-wide mb-2">Daily goal</h3>
      <div class="flex items-end gap-1 mb-2">
        <span class="text-2xl font-bold text-white">{todayReps}</span>
        <span class="text-sm text-slate-400 mb-1">/ {dailyGoal}</span>
      </div>
      <div class="w-full bg-slate-900 rounded-full h-3 overflow-hidden" role="progressbar" aria-valuenow={todayReps} aria-valuemin={0} aria-valuemax={dailyGoal}>
        <div
          class="h-full rounded-full transition-all duration-500 ease-out"
          style="width: {goalProgress}%; background-color: {goalColor};"
        ></div>
      </div>
      {#if todayReps >= dailyGoal}
        <p class="text-green-400 text-xs mt-1 font-semibold">✅ Goal met!</p>
      {:else}
        <p class="text-slate-300 text-sm mt-1">{dailyGoal - todayReps} reps to go</p>
      {/if}
    </div>

    <!-- Streak -->
    <div>
      <h3 class="text-xs font-semibold text-slate-400 tracking-wide mb-2">Current streak</h3>
      <div class="flex items-center gap-2">
        <span class="text-3xl">🔥</span>
        <div>
          <span class="text-2xl font-bold text-amber-400">{streak}</span>
          <span class="text-sm text-slate-400 ml-1">day{streak !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <p class="text-slate-300 text-sm mt-1">
        {streak === 0 ? 'Meet your daily goal to start a streak!' : 'Keep it going!'}
      </p>
    </div>
  </div>

  <!-- Lifetime Stats -->
  <div class="mt-3 pt-3 border-t border-slate-700 grid grid-cols-2 gap-4">
    <div>
      <h3 class="text-xs font-semibold text-slate-400 tracking-wide mb-1">Lifetime reps</h3>
      <span class="text-xl font-bold text-white">{quest.state.lifetimeReps}</span>
    </div>
    <div>
      <h3 class="text-xs font-semibold text-slate-400 tracking-wide mb-1">Quest points</h3>
      <span class="text-xl font-bold text-amber-400">{quest.state.questPoints}</span>
      <span class="text-xs text-slate-400 ml-1">QP</span>
    </div>
  </div>
</div>
