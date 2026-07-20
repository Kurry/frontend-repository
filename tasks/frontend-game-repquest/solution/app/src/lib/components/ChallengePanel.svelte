<script lang="ts">
  import { quest } from '../../store.svelte';

  const challengeRun = $derived(quest.challengeRun);
  const waypoints = $derived(quest.state.waypoints);
  const lifetimeReps = $derived(quest.state.lifetimeReps);
  const checkpoint = $derived(quest.state.challengeCheckpoint);

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
    const val = typeof raw === 'number' ? raw : Number(String(raw).trim());
    if (raw === '' || raw === null || Number.isNaN(val) || val < 1 || val > 9999 || !Number.isInteger(val)) {
      quest.feedbackMessage = 'Reps must be a whole number from 1 through 9999';
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
      {challengeRun?.result ?? challengeRun?.status ?? 'idle'}
    </span>
  </div>

  {#if activeBoss}
    <div class="bg-slate-900 rounded-lg p-3 text-sm">
      <p class="text-white font-semibold">Boss challenge — waypoint {activeBoss.id}</p>
      <p class="text-slate-400 text-xs mt-1">
        Active target: <strong class="text-white">{challengeRun?.targetReps ?? activeBoss.bossMinReps} reps</strong> · Lifetime: {lifetimeReps}/{activeBoss.repsRequired}
      </p>
      {#if activeBoss.bossDefeated}
        <p class="text-green-400 text-xs mt-2 font-semibold">Defeated</p>
      {/if}
    </div>
  {/if}

  <fieldset disabled={challengeRun?.status === 'active' || challengeRun?.status === 'paused'}>
    <legend class="text-xs font-semibold text-slate-300 mb-2">Difficulty</legend>
    <div class="grid grid-cols-3 gap-2">
      {#each ['Easy', 'Normal', 'Hard'] as difficulty}
        <button onclick={() => quest.setChallengeDifficulty(difficulty as 'Easy' | 'Normal' | 'Hard')} aria-pressed={(challengeRun?.difficulty ?? 'Normal') === difficulty} class="rounded-lg py-2 text-sm border {(challengeRun?.difficulty ?? 'Normal') === difficulty ? 'bg-red-600 border-red-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-red-500'}">{difficulty}</button>
      {/each}
    </div>
  </fieldset>

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
      disabled={!challengeRun || !['active', 'paused'].includes(challengeRun.status)}
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

  <div class="grid grid-cols-2 gap-2">
    <button onclick={() => quest.saveChallengeProgress()} disabled={!challengeRun || !['active','paused'].includes(challengeRun.status) || challengeRun.repsLogged < 1} data-action="save-progress" class="rounded-lg px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600">Save progress</button>
    <button onclick={() => quest.resumeSavedRun()} disabled={!checkpoint} data-action="resume-saved" class="rounded-lg px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600">Resume saved run</button>
  </div>
  {#if checkpoint}<p class="text-xs text-indigo-300">Saved {checkpoint.difficulty} checkpoint: {checkpoint.repsLogged}/{checkpoint.targetReps} reps · {checkpoint.runStatus} · Boss {checkpoint.bossWaypointId} · {checkpoint.savedAt}</p>{/if}

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

  {#if challengeRun?.result}
    <div class="result-panel rounded-xl p-4 border {challengeRun.result === 'Victory' ? 'bg-green-950/70 border-green-500 text-green-200' : 'bg-red-950/70 border-red-500 text-red-200'}" role="status" aria-live="polite">
      <h3 class="text-xl font-black">{challengeRun.result}</h3>
      <p>{challengeRun.repsLogged} reps logged versus {challengeRun.targetReps} target.</p>
      <button onclick={() => quest.restartChallengeRun()} class="mt-3 rounded-lg px-4 py-2 bg-slate-900 hover:bg-slate-700">New run</button>
    </div>
  {/if}
</div>

<style>.result-panel{animation:result-in .28s ease-out}@keyframes result-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}</style>
