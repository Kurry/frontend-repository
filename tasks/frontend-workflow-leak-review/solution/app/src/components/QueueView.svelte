<script>
  import { Alert } from 'flowbite-svelte';
  import { ArrowRight, Info, MagnifyingGlass, SlidersHorizontal } from 'phosphor-svelte';
  import StatusChip from './StatusChip.svelte';
  import RollupStrip from './RollupStrip.svelte';
  import autoAnimate from '@formkit/auto-animate';
  import { onDestroy } from 'svelte';

  let { state: appState } = $props();
  let showCoachmark = $state(true);
  let celebratedInboxZero = $state(false);
  let showInboxZeroCelebration = $state(false);
  let celebrationTimeout;

  onDestroy(() => clearTimeout(celebrationTimeout));

  $effect(() => {
    const reviewTriggeredRemaining = appState.submissions.filter((submission) => submission.reviewState === 'review-triggered').length;
    if (reviewTriggeredRemaining > 0) {
      celebratedInboxZero = false;
      showInboxZeroCelebration = false;
      clearTimeout(celebrationTimeout);
      return;
    }
    if (!celebratedInboxZero && appState.reviewFilter === 'review-triggered') {
      celebratedInboxZero = true;
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        showInboxZeroCelebration = true;
        clearTimeout(celebrationTimeout);
        celebrationTimeout = setTimeout(() => showInboxZeroCelebration = false, 1800);
      }
    }
  });

  const filterOptions = [
    { value: 'all', name: 'All review states' },
    { value: 'review-triggered', name: 'Review triggered' },
    { value: 'unreviewed', name: 'Unreviewed' },
    { value: 'confirmed-clean', name: 'Confirmed clean' },
    { value: 'confirmed-leak', name: 'Confirmed leak' }
  ];

  function scoreBand(score) {
    if (score < 0.4) return 'score-low';
    if (score < appState.threshold) return 'score-mid';
    return 'score-high';
  }

  function activateRow(event, id) {
    if (event.type === 'click' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      appState.openSubmission(id);
    }
  }
</script>

<div class="space-y-5 view-enter">
  {#if showInboxZeroCelebration}
    <div class="inbox-zero-celebration" role="status" aria-live="polite">
      <span class="inbox-zero-message">Inbox zero — all flagged submissions reviewed</span>
      <span class="celebration-piece piece-one" aria-hidden="true"></span>
      <span class="celebration-piece piece-two" aria-hidden="true"></span>
      <span class="celebration-piece piece-three" aria-hidden="true"></span>
      <span class="celebration-piece piece-four" aria-hidden="true"></span>
      <span class="celebration-piece piece-five" aria-hidden="true"></span>
      <span class="celebration-piece piece-six" aria-hidden="true"></span>
    </div>
  {/if}
  <section class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
    <div>
      <p class="eyebrow">Contamination triage</p>
      <h1 class="mt-1 text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">Submission queue</h1>
      <p class="mt-1 max-w-2xl text-sm text-slate-600">Similarity signals are ranked for review. Decisions remain explicitly human-confirmed.</p>
    </div>
    <div class={`flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${appState.theme === 'dark' ? 'border-white/20 bg-white/10 text-slate-300' : 'border-line bg-white/70 text-slate-600'}`}>
      <span class="size-2 rounded-full bg-teal-500 shadow-[0_0_0_4px_rgba(22,139,134,.12)]"></span>
      {appState.visibleSubmissions.length} of {appState.submissions.length} submissions shown
    </div>
  </section>

  <RollupStrip rollup={appState.rollup} />

  <section class="panel rounded-xl p-4 sm:p-5" aria-labelledby="threshold-heading">
    <div class="grid gap-5 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
      <div>
        <div class="mb-3 flex items-center justify-between gap-4">
          <div>
            <p class="eyebrow"><SlidersHorizontal aria-hidden="true" size={13} class="mr-1 inline" />Live sensitivity</p>
            <h2 id="threshold-heading" class="mt-1 text-base font-extrabold">Review threshold</h2>
          </div>
          <output for="threshold" class="tabular rounded-lg border border-signal-700/30 bg-signal-700/10 px-3 py-1.5 text-lg font-black text-signal-700">{appState.threshold.toFixed(2)}</output>
        </div>
        <label for="threshold" class="mb-2 block text-sm font-extrabold text-ink-900">Threshold value</label>
        <input
          id="threshold"
          type="range"
          min="0.50"
          max="0.95"
          step="0.01"
          bind:value={appState.threshold}
          class="h-3 w-full cursor-pointer accent-[#d95732]"
          aria-valuemin={0.5}
          aria-valuemax={0.95}
          aria-valuenow={appState.threshold}
          aria-valuetext={appState.threshold.toFixed(2)}
        />
        <div class="mt-1 flex justify-between text-[10px] font-bold text-slate-600"><span>0.50 broader</span><span>0.95 stricter</span></div>
      </div>

      <div class="flex flex-col gap-3">
        {#if showCoachmark}
          <div class="relative rounded-xl border border-indigo-300 bg-indigo-50 p-3 text-indigo-950 shadow-sm" role="dialog" aria-label="Triage Onboarding">
            <button class="absolute right-2 top-2 rounded p-1 hover:bg-indigo-100" onclick={() => showCoachmark = false} aria-label="Dismiss onboarding">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path></svg>
            </button>
            <p class="pr-6 text-sm font-extrabold text-indigo-900">Start here: adjust the threshold</p>
            <p class="mt-1 text-xs leading-relaxed text-indigo-800">Drag the slider to dynamically update the score bands and filter the submissions below for review.</p>
          </div>
        {/if}
        <Alert color="warning" class="!mb-0 !rounded-xl !border !border-amber-300 !bg-amber-50 !text-amber-950">
        <Info aria-hidden="true" size={20} weight="fill" class="mr-3 mt-0.5 shrink-0 text-amber-700" />
        <div>
          <p class="text-sm font-extrabold">A flag is not a finding</p>
          <p class="mt-0.5 text-xs leading-5">This threshold only flags submissions for review. A human reviewer makes every Confirm clean or Confirm leak decision.</p>
        </div>
      </Alert>
      </div>
    </div>
  </section>

  <section class="panel overflow-hidden rounded-xl" aria-labelledby="queue-table-heading">
    <div class="flex flex-col gap-3 border-b border-line/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div>
        <h2 id="queue-table-heading" class="text-base font-extrabold">Ranked signals</h2>
        <p class="text-xs text-slate-600">Score band colors rebase against the live threshold.</p>
      </div>
      <div class="flex flex-col gap-2 min-[500px]:flex-row">
        <div class="relative block">
          <label for="search" class="mb-1 block text-xs font-extrabold text-ink-900">Search submissions</label>
          <MagnifyingGlass aria-hidden="true" class="pointer-events-none absolute left-3 top-[2.05rem] text-slate-400" size={16} />
          <input id="search"
            class="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 min-[500px]:w-56"
            type="search"
            value={appState.searchQuery}
            oninput={(event) => appState.searchQuery = event.currentTarget.value}
            placeholder="Search task or submitter"
          />
        </div>
        <div>
          <label for="reviewState" class="mb-1 block text-xs font-extrabold text-ink-900">Review state</label>
          <select
            id="reviewState"
            name="reviewState"
            class="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 min-[500px]:min-w-48"
            value={appState.reviewFilter}
            onchange={(event) => appState.setReviewFilter(event.currentTarget.value)}
          >
            {#each filterOptions as option}
              <option value={option.value}>{option.name}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    <div class="table-scroll">
      <table class="w-full min-w-[720px] border-collapse text-left">
        <thead class="bg-ink-900 text-[10px] font-bold uppercase tracking-[.11em] text-slate-300">
          <tr>
            <th class="w-40 px-5 py-3">Similarity</th>
            <th class="px-4 py-3">Benchmark task</th>
            <th class="px-4 py-3">Submitter</th>
            <th class="px-4 py-3">Review state</th>
            <th class="w-12 px-4 py-3"><span class="sr-only">Open evidence</span></th>
          </tr>
        </thead>
        <tbody use:autoAnimate>
          {#each appState.visibleSubmissions as submission (submission.id)}
            <tr
              class={`group cursor-pointer border-b border-line/60 bg-white/40 transition-colors duration-200 hover:bg-teal-50/70 focus:bg-teal-50/70 focus:outline-none ${appState.leavingSubmissionId === submission.id ? 'row-leave' : ''} ${appState.lastChangedSubmissionId === submission.id ? 'chip-pop' : ''}`}
              tabindex="0"
              role="button"
              aria-label={`Open ${submission.task} by ${submission.submitter}, similarity ${submission.similarity.toFixed(2)}, ${submission.reviewState}`}
              onclick={(event) => activateRow(event, submission.id)}
              onkeydown={(event) => activateRow(event, submission.id)}
            >
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-2" role="group" aria-label={`Similarity ${submission.similarity.toFixed(2)}`}>
                  <span class={`tabular inline-flex min-w-16 shrink-0 items-center justify-center rounded-md border px-2.5 py-1 text-sm font-black ${scoreBand(submission.similarity)}`}>
                    {submission.similarity.toFixed(2)}
                  </span>
                  <div class="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
                    <div class={`h-full rounded-full transition-all duration-300 ${submission.similarity >= appState.threshold ? 'bg-signal-500' : 'bg-slate-400'}`} style={`width: ${submission.similarity * 100}%`}></div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3.5">
                <p class="font-bold text-ink-900">{submission.task}</p>
                <p class="mt-0.5 font-mono text-[10px] text-slate-500">{submission.id}</p>
              </td>
              <td class="px-4 py-3.5 text-sm text-slate-600">{submission.submitter}</td>
              <td class="px-4 py-3.5"><StatusChip state={submission.reviewState} animate={appState.lastChangedSubmissionId === submission.id} /></td>
              <td class="px-4 py-3.5"><ArrowRight aria-hidden="true" size={17} class="text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-teal-600" /></td>
            </tr>
          {:else}
            <tr>
              <td colspan="5" class="px-5 py-14 text-center">
                <div class="mx-auto grid size-11 place-items-center rounded-full bg-slate-100 text-slate-400"><MagnifyingGlass aria-hidden="true" size={20} /></div>
                <p class="mt-3 font-extrabold text-ink-900">
                  {appState.reviewFilter === 'review-triggered' ? 'Nothing currently needs review' : 'No submissions match this view'}
                </p>
                <p class="mt-1 text-sm text-slate-600">
                  {appState.reviewFilter === 'review-triggered' ? 'Every flagged submission has been decided, or the current threshold flags none.' : 'Clear the filter or search to restore the full queue.'}
                </p>
                <button class="interactive mt-4 min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold hover:border-teal-500 hover:text-teal-700" onclick={() => { appState.setReviewFilter('all'); appState.searchQuery = ''; }}>Clear queue filters</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
</div>

<style>
  .inbox-zero-celebration {
    position: fixed;
    inset: 4.75rem 1rem auto;
    z-index: 60;
    display: flex;
    justify-content: center;
    pointer-events: none;
  }

  .inbox-zero-message {
    border: 1px solid rgb(16 185 129 / 0.45);
    border-radius: 9999px;
    background: rgb(236 253 245 / 0.97);
    box-shadow: 0 12px 30px rgb(15 23 42 / 0.16);
    color: #065f46;
    font-size: 0.75rem;
    font-weight: 800;
    padding: 0.65rem 1rem;
    animation: celebration-message 1.8s ease both;
  }

  .celebration-piece {
    position: absolute;
    top: 0.75rem;
    left: 50%;
    width: 0.45rem;
    height: 0.8rem;
    border-radius: 0.15rem;
    background: #168b86;
    animation: celebration-burst 1.25s cubic-bezier(.15, .75, .3, 1) both;
  }

  .piece-one { --x: -9rem; --r: -150deg; background: #ef6c45; }
  .piece-two { --x: -6rem; --r: 120deg; background: #738644; animation-delay: 70ms; }
  .piece-three { --x: -3rem; --r: -80deg; background: #c78d2a; animation-delay: 140ms; }
  .piece-four { --x: 3rem; --r: 90deg; background: #ef6c45; animation-delay: 40ms; }
  .piece-five { --x: 6rem; --r: -130deg; background: #738644; animation-delay: 110ms; }
  .piece-six { --x: 9rem; --r: 160deg; background: #c78d2a; animation-delay: 180ms; }

  @keyframes celebration-burst {
    0% { opacity: 0; transform: translate(0, 0) rotate(0); }
    20% { opacity: 1; }
    100% { opacity: 0; transform: translate(var(--x), 6rem) rotate(var(--r)); }
  }

  @keyframes celebration-message {
    0% { opacity: 0; transform: translateY(-0.75rem) scale(0.96); }
    15%, 78% { opacity: 1; transform: translateY(0) scale(1); }
    100% { opacity: 0; transform: translateY(-0.35rem) scale(0.98); }
  }

  @media (prefers-reduced-motion: reduce) {
    .inbox-zero-message,
    .celebration-piece {
      animation: none;
    }
  }
</style>
