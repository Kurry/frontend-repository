<script>
  import { Alert } from 'flowbite-svelte';
  import { ArrowRight, Info, MagnifyingGlass, SlidersHorizontal } from 'phosphor-svelte';
  import StatusChip from './StatusChip.svelte';
  import RollupStrip from './RollupStrip.svelte';

  let { state } = $props();

  const filterOptions = [
    { value: 'all', name: 'All review states' },
    { value: 'review-triggered', name: 'Review triggered' },
    { value: 'unreviewed', name: 'Unreviewed' },
    { value: 'confirmed-clean', name: 'Confirmed clean' },
    { value: 'confirmed-leak', name: 'Confirmed leak' }
  ];

  function scoreBand(score) {
    if (score < 0.4) return 'score-low';
    if (score < state.threshold) return 'score-mid';
    return 'score-high';
  }

  function activateRow(event, id) {
    if (event.type === 'click' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      state.openSubmission(id);
    }
  }
</script>

<div class="space-y-5 view-enter">
  <section class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
    <div>
      <p class="eyebrow">Contamination triage</p>
      <h1 class="mt-1 text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">Submission queue</h1>
      <p class="mt-1 max-w-2xl text-sm text-slate-600">Similarity signals are ranked for review. Decisions remain explicitly human-confirmed.</p>
    </div>
    <div class="flex min-h-11 items-center gap-2 rounded-lg border border-line bg-white/70 px-3 py-2 text-xs font-semibold text-slate-600">
      <span class="size-2 rounded-full bg-teal-500 shadow-[0_0_0_4px_rgba(22,139,134,.12)]"></span>
      {state.visibleSubmissions.length} of {state.submissions.length} submissions shown
    </div>
  </section>

  <RollupStrip rollup={state.rollup} />

  <section class="panel rounded-xl p-4 sm:p-5" aria-labelledby="threshold-heading">
    <div class="grid gap-5 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
      <div>
        <div class="mb-3 flex items-center justify-between gap-4">
          <div>
            <p class="eyebrow"><SlidersHorizontal aria-hidden="true" size={13} class="mr-1 inline" />Live sensitivity</p>
            <h2 id="threshold-heading" class="mt-1 text-base font-extrabold">Review threshold</h2>
          </div>
          <output for="threshold" class="tabular rounded-lg border border-signal-700/30 bg-signal-700/10 px-3 py-1.5 text-lg font-black text-signal-700">{state.threshold.toFixed(2)}</output>
        </div>
        <label for="threshold" class="mb-2 block text-sm font-extrabold text-ink-900">Threshold value</label>
        <input
          id="threshold"
          type="range"
          min="0.50"
          max="0.95"
          step="0.01"
          value={state.threshold}
          oninput={(event) => state.setThreshold(event.currentTarget.value)}
          class="h-3 w-full cursor-pointer accent-[#d95732]"
          aria-valuemin={0.5}
          aria-valuemax={0.95}
          aria-valuenow={state.threshold}
          aria-valuetext={state.threshold.toFixed(2)}
        />
        <div class="mt-1 flex justify-between text-[10px] font-bold text-slate-600"><span>0.50 broader</span><span>0.95 stricter</span></div>
      </div>

      <Alert color="warning" class="!mb-0 !rounded-xl !border !border-amber-300 !bg-amber-50 !text-amber-950">
        <Info aria-hidden="true" size={20} weight="fill" class="mr-3 mt-0.5 shrink-0 text-amber-700" />
        <div>
          <p class="text-sm font-extrabold">A flag is not a finding</p>
          <p class="mt-0.5 text-xs leading-5">This threshold only flags submissions for review. A human reviewer makes every Confirm clean or Confirm leak decision.</p>
        </div>
      </Alert>
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
            value={state.searchQuery}
            oninput={(event) => state.searchQuery = event.currentTarget.value}
            placeholder="Search task or submitter"
          />
        </div>
        <div>
          <label for="reviewState" class="mb-1 block text-xs font-extrabold text-ink-900">Review state</label>
          <select
            id="reviewState"
            name="reviewState"
            class="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 min-[500px]:min-w-48"
            value={state.reviewFilter}
            onchange={(event) => state.setReviewFilter(event.currentTarget.value)}
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
            <th class="w-28 px-5 py-3">Similarity</th>
            <th class="px-4 py-3">Benchmark task</th>
            <th class="px-4 py-3">Submitter</th>
            <th class="px-4 py-3">Review state</th>
            <th class="w-12 px-4 py-3"><span class="sr-only">Open evidence</span></th>
          </tr>
        </thead>
        <tbody>
          {#each state.visibleSubmissions as submission (submission.id)}
            <tr
              class={`group cursor-pointer border-b border-line/60 bg-white/40 transition-colors duration-200 hover:bg-teal-50/70 focus:bg-teal-50/70 focus:outline-none ${state.leavingSubmissionId === submission.id ? 'row-leave' : ''} ${state.lastChangedSubmissionId === submission.id ? 'chip-pop' : ''}`}
              tabindex="0"
              role="button"
              aria-label={`Open ${submission.task} by ${submission.submitter}, similarity ${submission.similarity.toFixed(2)}, ${submission.reviewState}`}
              onclick={(event) => activateRow(event, submission.id)}
              onkeydown={(event) => activateRow(event, submission.id)}
            >
              <td class="px-5 py-3.5">
                <span class={`tabular inline-flex min-w-16 items-center justify-center rounded-md border px-2.5 py-1 text-sm font-black ${scoreBand(submission.similarity)}`}>
                  {submission.similarity.toFixed(2)}
                </span>
              </td>
              <td class="px-4 py-3.5">
                <p class="font-bold text-ink-900">{submission.task}</p>
                <p class="mt-0.5 font-mono text-[10px] text-slate-500">{submission.id}</p>
              </td>
              <td class="px-4 py-3.5 text-sm text-slate-600">{submission.submitter}</td>
              <td class="px-4 py-3.5"><StatusChip state={submission.reviewState} animate={state.lastChangedSubmissionId === submission.id} /></td>
              <td class="px-4 py-3.5"><ArrowRight aria-hidden="true" size={17} class="text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-teal-600" /></td>
            </tr>
          {:else}
            <tr>
              <td colspan="5" class="px-5 py-14 text-center">
                <div class="mx-auto grid size-11 place-items-center rounded-full bg-slate-100 text-slate-400"><MagnifyingGlass aria-hidden="true" size={20} /></div>
                <p class="mt-3 font-extrabold text-ink-900">
                  {state.reviewFilter === 'review-triggered' ? 'Nothing currently needs review' : 'No submissions match this view'}
                </p>
                <p class="mt-1 text-sm text-slate-600">
                  {state.reviewFilter === 'review-triggered' ? 'Every flagged submission has been decided, or the current threshold flags none.' : 'Clear the filter or search to restore the full queue.'}
                </p>
                <button class="interactive mt-4 min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold hover:border-teal-500 hover:text-teal-700" onclick={() => { state.setReviewFilter('all'); state.searchQuery = ''; }}>Clear queue filters</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
</div>
