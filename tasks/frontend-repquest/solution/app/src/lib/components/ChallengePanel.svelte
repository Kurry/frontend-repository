<script lang="ts">
  import { quest } from '../../store.svelte';

  const challengeRun = $derived(quest.challengeRun);
  const waypoints = $derived(quest.state.waypoints);
  const lifetimeReps = $derived(quest.state.lifetimeReps);

  // Svelte coerces bind:value on a type="number" input to an actual number
  // (or '' when empty) rather than always a string, so this must accept both.
  let repInput: number | string = $state('');

  const activeBoss = $derived(
    challengeRun && challengeRun.bossWaypointId
      ? waypoints.find((wp) => wp.id === challengeRun.bossWaypointId)
      : waypoints.find((wp) => wp.isBoss && !wp.bossDefeated)
  );

  function submitReps() {
    const raw = repInput;
    const val = typeof raw === 'number' ? raw : parseInt(String(raw).trim(), 10);
    if (raw === '' || raw === null || Number.isNaN(val) || val <= 0 || !Number.isInteger(val)) {
      quest.feedbackMessage = 'Enter a positive whole number';
      return;
    }
    quest.logChallengeReps(val);
    repInput = '';
  }
</script>

<div class="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-4">
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-bold text-red-400">Boss challenge mode</h2>
    <span class="text-xs px-2 py-1 rounded bg-red-900/40 text-red-300 border border-red-800">
      {challengeRun?.status ?? 'idle'}
    </span>
  </div>

  {#if activeBoss}
    <div class="bg-slate-900 rounded-lg p-3 text-sm">
      <p class="text-white font-semibold">Boss challenge — waypoint {activeBoss.id}</p>
      <p class="text-slate-400 text-xs mt-1">
        Requires {activeBoss.bossMinReps}+ reps in a single set · Lifetime: {lifetimeReps}/{activeBoss.repsRequired}
      </p>
      {#if activeBoss.bossDefeated}
        <p class="text-green-400 text-xs mt-2 font-semibold">Defeated</p>
      {/if}
    </div>
  {/if}

  <div class="flex flex-wrap gap-2">
    <button
      onclick={() => quest.startChallengeRun()}
      disabled={challengeRun?.status === 'active' || challengeRun?.status === 'paused'}
      data-action="challenge-start"
      class="text-sm px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white disabled:bg-slate-700 disabled:text-slate-500
             focus-visible:ring-2 focus-visible:ring-red-400 transition-colors"
    >
      Start run
    </button>
    <button
      onclick={() => quest.pauseChallengeRun()}
      disabled={challengeRun?.status !== 'active'}
      data-action="challenge-pause"
      class="text-sm px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white disabled:bg-slate-800 disabled:text-slate-600
             focus-visible:ring-2 focus-visible:ring-amber-400 transition-colors"
    >
      Pause
    </button>
    <button
      onclick={() => quest.resumeChallengeRun()}
      disabled={challengeRun?.status !== 'paused'}
      data-action="challenge-resume"
      class="text-sm px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white disabled:bg-slate-800 disabled:text-slate-600
             focus-visible:ring-2 focus-visible:ring-amber-400 transition-colors"
    >
      Resume
    </button>
    <button
      onclick={() => quest.endChallengeRun()}
      disabled={!challengeRun || challengeRun.status === 'idle'}
      data-action="challenge-end"
      class="text-sm px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white disabled:bg-slate-800 disabled:text-slate-600
             focus-visible:ring-2 focus-visible:ring-amber-400 transition-colors"
    >
      End run
    </button>
    <button
      onclick={() => quest.restartChallengeRun()}
      data-action="challenge-restart"
      class="text-sm px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white
             focus-visible:ring-2 focus-visible:ring-amber-400 transition-colors"
    >
      Restart
    </button>
  </div>

  {#if challengeRun?.status === 'active'}
    <div class="flex gap-2">
      <label class="sr-only" for="challenge-rep-input">Challenge rep count</label>
      <input
        id="challenge-rep-input"
        type="number"
        min="1"
        bind:value={repInput}
        placeholder="Reps this set..."
        class="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm
               focus:border-red-500 focus:ring-1 focus:ring-red-500 hover:border-slate-500"
      />
      <button
        onclick={submitReps}
        class="bg-red-500 hover:bg-red-400 text-white font-bold px-4 py-2 rounded-lg text-sm
               focus-visible:ring-2 focus-visible:ring-red-400"
      >
        Log challenge reps
      </button>
    </div>
    <p class="text-xs text-slate-400">Run reps logged: {challengeRun.repsLogged}</p>
  {/if}

  {#if quest.feedbackMessage}
    <p class="text-amber-300 text-xs" role="status">{quest.feedbackMessage}</p>
  {/if}
</div>
