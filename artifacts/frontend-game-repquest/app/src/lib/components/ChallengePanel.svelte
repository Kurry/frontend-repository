<script lang="ts">
  import { Play, Pause, CircleNotch, Flag, Prohibit, Trophy, Warning, Target, ArrowCounterClockwise, FloppyDisk } from 'phosphor-svelte';
  import { quest } from '../../store.svelte';

  const challengeRun = $derived(quest.challengeRun);
  const waypoints = $derived(quest.state.waypoints);
  const lifetimeReps = $derived(quest.state.lifetimeReps);
  const checkpoint = $derived(quest.state.challengeCheckpoint);
  const now = $derived(quest.nowTick);

  let repInput: number | string = $state('');

  const status = $derived(challengeRun?.result ?? challengeRun?.status ?? 'idle');
  const statusLabel = $derived(
    status === 'Victory' ? 'Victory'
    : status === 'Defeat' ? 'Defeat'
    : status === 'active' ? 'Active'
    : status === 'paused' ? 'Paused'
    : 'Idle'
  );

  const activeBoss = $derived(
    challengeRun && challengeRun.bossWaypointId
      ? waypoints.find((wp) => wp.id === challengeRun.bossWaypointId)
      : waypoints.find((wp) => wp.isBoss && !wp.bossDefeated)
  );

  const elapsedMs = $derived.by(() => {
    const r = challengeRun;
    if (!r) return 0;
    if (r.status === 'active') return r.pausedElapsed + (now - r.startedAt);
    if (r.status === 'paused') return r.pausedElapsed;
    return 0;
  });
  const elapsedLabel = $derived.by(() => {
    const s = Math.floor(elapsedMs / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  });

  function submitReps() {
    const raw = repInput;
    const val = typeof raw === 'number' ? raw : Number(String(raw).trim());
    if (raw === '' || raw === null || Number.isNaN(val) || val < 1 || val > 9999 || !Number.isInteger(val)) {
      quest.feedbackMessage = 'Reps: enter a whole number from 1 to 9999.';
      return;
    }
    quest.logChallengeReps(val);
    repInput = '';
  }

  const statusTone = $derived(
    status === 'Victory' ? 'bg-emerald-900/50 text-emerald-200 border-emerald-600'
    : status === 'Defeat' ? 'bg-rose-900/50 text-rose-200 border-rose-600'
    : status === 'active' ? 'bg-sky-900/50 text-sky-200 border-sky-600'
    : status === 'paused' ? 'bg-amber-900/50 text-amber-200 border-amber-600'
    : 'bg-slate-800 text-slate-300 border-slate-600'
  );
</script>

<div class="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-4">
  <div class="flex items-center justify-between gap-2 flex-wrap">
    <h2 class="text-lg font-bold text-red-400 flex items-center gap-2"><Target size={18} weight="fill" /> Boss challenge mode</h2>
    <span class="text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 font-semibold {statusTone}" data-challenge-status={status}>
      {#if status === 'active'}<CircleNotch size={13} class="animate-spin" />
      {:else if status === 'paused'}<Pause size={13} weight="fill" />
      {:else if status === 'Victory'}<Trophy size={13} weight="fill" />
      {:else if status === 'Defeat'}<Warning size={13} weight="fill" />
      {:else}<Prohibit size={13} />{/if}
      Run status: {statusLabel}
    </span>
  </div>

  {#if activeBoss}
    <div class="bg-slate-900 rounded-lg p-3 text-sm">
      <p class="text-white font-semibold">Boss challenge — waypoint {activeBoss.id}</p>
      <p class="text-slate-400 text-xs mt-1">
        Target this run: <strong class="text-white">{challengeRun?.targetReps ?? activeBoss.bossMinReps} reps</strong> · Run logged: <strong class="text-white">{challengeRun?.repsLogged ?? 0}</strong> · Lifetime {lifetimeReps}/{activeBoss.repsRequired}
      </p>
      {#if activeBoss.bossDefeated}
        <p class="text-green-400 text-xs mt-2 font-semibold">Boss defeated on the map</p>
      {/if}
    </div>
  {/if}

  <fieldset disabled={challengeRun?.status === 'active' || challengeRun?.status === 'paused'}>
    <legend class="text-xs font-semibold text-slate-300 mb-2">Difficulty</legend>
    <div class="grid grid-cols-3 gap-2">
      {#each ['Easy', 'Normal', 'Hard'] as difficulty}
        <button onclick={() => quest.setChallengeDifficulty(difficulty as 'Easy' | 'Normal' | 'Hard')} aria-pressed={(challengeRun?.difficulty ?? 'Normal') === difficulty} class="rounded-lg py-2 text-sm border transition-colors {(challengeRun?.difficulty ?? 'Normal') === difficulty ? 'bg-red-600 border-red-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-red-500'}">{difficulty}</button>
      {/each}
    </div>
  </fieldset>

  <div class="flex flex-wrap gap-2">
    <button onclick={() => quest.startChallengeRun()} disabled={challengeRun?.status === 'active' || challengeRun?.status === 'paused'} data-action="challenge-start" class="inline-flex items-center gap-1.5 text-sm px-3 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white disabled:bg-slate-700 disabled:text-slate-500 transition-colors"><Play size={15} weight="fill" /> Start run</button>
    <button onclick={() => quest.pauseChallengeRun()} disabled={challengeRun?.status !== 'active'} data-action="challenge-pause" class="inline-flex items-center gap-1.5 text-sm px-3 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white disabled:bg-slate-800 disabled:text-slate-600 transition-colors"><Pause size={15} weight="fill" /> Pause</button>
    <button onclick={() => quest.resumeChallengeRun()} disabled={challengeRun?.status !== 'paused'} data-action="challenge-resume" class="inline-flex items-center gap-1.5 text-sm px-3 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white disabled:bg-slate-800 disabled:text-slate-600 transition-colors"><Play size={15} weight="fill" /> Resume</button>
    <button onclick={() => quest.endChallengeRun()} disabled={!challengeRun || !['active', 'paused'].includes(challengeRun.status)} data-action="challenge-end" class="inline-flex items-center gap-1.5 text-sm px-3 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white disabled:bg-slate-800 disabled:text-slate-600 transition-colors"><Flag size={15} weight="fill" /> End run</button>
    <button onclick={() => quest.restartChallengeRun()} data-action="challenge-restart" class="inline-flex items-center gap-1.5 text-sm px-3 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"><ArrowCounterClockwise size={15} weight="bold" /> Restart</button>
  </div>

  {#if challengeRun?.status === 'active' || challengeRun?.status === 'paused'}
    <p class="text-xs text-slate-400 flex items-center gap-2">Elapsed: <span class="font-mono text-slate-200" data-challenge-elapsed>{elapsedLabel}</span></p>
  {/if}

  <div class="grid grid-cols-2 gap-2">
    <button onclick={() => quest.saveChallengeProgress()} disabled={!challengeRun || !['active','paused'].includes(challengeRun.status) || challengeRun.repsLogged < 1} data-action="save-progress" class="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-slate-800 disabled:text-slate-600 transition-colors"><FloppyDisk size={15} /> Save progress</button>
    <button onclick={() => quest.resumeSavedRun()} disabled={!checkpoint} data-action="resume-saved" class="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-slate-800 disabled:text-slate-600 transition-colors"><Play size={15} weight="fill" /> Resume saved run</button>
  </div>
  {#if checkpoint}
    <div class="text-xs text-indigo-200 bg-slate-900 rounded-lg p-2.5 border border-indigo-900/60" data-challenge-checkpoint>
      <p class="font-semibold text-indigo-100 mb-1">Saved checkpoint</p>
      <p>runStatus: <span class="font-mono">{checkpoint.runStatus}</span> · difficulty: <span class="font-mono">{checkpoint.difficulty}</span> · bossWaypointId: <span class="font-mono">{checkpoint.bossWaypointId}</span></p>
      <p>repsLogged: <span class="font-mono">{checkpoint.repsLogged}</span> · targetReps: <span class="font-mono">{checkpoint.targetReps}</span> · savedAt: <span class="font-mono">{checkpoint.savedAt}</span></p>
    </div>
  {/if}

  <!-- Always render the log control so an out-of-run attempt surfaces visible
       feedback (rather than the control simply being absent). -->
  <div class="flex gap-2">
    <label class="sr-only" for="challenge-rep-input">Challenge rep count</label>
    <input
      id="challenge-rep-input"
      type="number"
      min="1"
      inputmode="numeric"
      bind:value={repInput}
      class="flex-1 min-w-0 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm
             focus:border-red-500 focus:ring-1 focus:ring-red-500 hover:border-slate-500"
    />
    <button
      onclick={submitReps}
      data-action="log-challenge-reps"
      class="bg-red-500 hover:bg-red-400 text-white font-bold px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors"
    >
      Log challenge reps
    </button>
  </div>
  {#if challengeRun?.status === 'active'}
    <p class="text-xs text-slate-400">Run reps logged: {challengeRun.repsLogged}</p>
  {:else}
    <p class="text-xs text-slate-500">Logging here only counts during an active run; otherwise it shows feedback and leaves the run unchanged.</p>
  {/if}

  {#if quest.feedbackMessage}
    <p class="text-amber-300 text-xs" role="status">{quest.feedbackMessage}</p>
  {/if}

  {#if challengeRun?.result}
    {@const win = challengeRun.result === 'Victory'}
    {@const shortfall = Math.max(0, challengeRun.targetReps - challengeRun.repsLogged)}
    <div
      class="result-panel rounded-xl p-4 border {win ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200' : 'bg-rose-950/70 border-rose-500 text-rose-200'}"
      role="status"
      aria-live="polite"
      data-challenge-result={challengeRun.result}
    >
      <h3 class="text-xl font-black flex items-center gap-2">
        {#if win}<Trophy size={22} weight="fill" />{:else}<Warning size={22} weight="fill" />{/if}
        {challengeRun.result}
      </h3>
      <p class="mt-1">{challengeRun.repsLogged} reps logged versus {challengeRun.targetReps} target{win ? '' : ` — short by ${shortfall} reps`}.</p>
      <button onclick={() => quest.restartChallengeRun()} class="mt-3 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 bg-slate-900 hover:bg-slate-700 text-white transition-colors"><ArrowCounterClockwise size={15} weight="bold" /> New run</button>
    </div>
  {/if}
</div>

<style>.result-panel{animation:rq-pop-in .3s ease-out}.animate-spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style>
