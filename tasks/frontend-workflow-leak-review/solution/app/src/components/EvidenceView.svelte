<script>
  import { tick } from 'svelte';
  import { Button } from 'flowbite-svelte';
  import { ArrowLeft, ArrowRight, BracketsCurly, CheckCircle, WarningDiamond } from 'phosphor-svelte';
  import { decisionSchema } from '../lib/schemas.js';
  import StatusChip from './StatusChip.svelte';

  let { state: appState } = $props();
  let submissionPane = $state();
  let referencePane = $state();
  let verdict = $state('');
  let rationale = $state('');
  let submitError = $state('');
  let touched = $state({ verdict: false, rationale: false });

  const submission = $derived(appState.selectedSubmission);
  const currentMatch = $derived(submission?.matches[appState.evidenceFocusIndex]);
  const existingDecision = $derived(appState.decisions.find((entry) => entry.submissionId === submission?.id));

  const validation = $derived.by(() => {
    const parsed = decisionSchema.safeParse({ verdict, rationale });
    if (parsed.success) return { ok: true, errors: {} };
    const errors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] || 'form';
      if (!errors[key]) errors[key] = issue.message;
    }
    return { ok: false, errors };
  });

  $effect(() => {
    // Keep an in-progress decision when reviewers briefly inspect another view.
    const id = appState.selectedSubmissionId;
    const draft = appState.beginDecisionDraft(id);
    verdict = draft.verdict;
    rationale = draft.rationale;
    submitError = '';
    touched = { verdict: false, rationale: false };
  });

  $effect(() => {
    const focusIndex = appState.evidenceFocusIndex;
    if (!submissionPane || !referencePane) return;
    tick().then(() => {
      const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      submissionPane.querySelector(`[data-pair="${focusIndex}"]`)?.scrollIntoView({ behavior, block: 'center' });
      referencePane.querySelector(`[data-pair="${focusIndex}"]`)?.scrollIntoView({ behavior, block: 'center' });
    });
  });

  function step(delta) {
    appState.setEvidenceFocus(appState.evidenceFocusIndex + delta);
  }

  function chooseVerdict(value) {
    verdict = value;
    appState.updateDecisionDraft('verdict', value);
    touched.verdict = true;
  }

  async function onSubmit(event) {
    event.preventDefault();
    touched = { verdict: true, rationale: true };
    submitError = '';
    if (!validation.ok) return;
    const result = await appState.submitDecision({ verdict, rationale });
    if (!result.ok) {
      submitError = result.error;
      return;
    }
    verdict = '';
    rationale = '';
    appState.navigate('queue');
  }
</script>

<svelte:window onkeydown={(e) => {
  const target = e.target;
  const isEditable = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
  const hasModifier = e.ctrlKey || e.metaKey || e.altKey || e.shiftKey;
  if (appState.activeView === 'evidence-view' && !e.defaultPrevented && !isEditable && !hasModifier) {
    if (e.key.toLowerCase() === 'c') { e.preventDefault(); chooseVerdict('confirm-clean'); }
    if (e.key.toLowerCase() === 'l') { e.preventDefault(); chooseVerdict('confirm-leak'); }
  }
}} />

{#if submission}
  <div class="space-y-5">
    <section class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <button class="interactive mb-3 inline-flex min-h-11 items-center gap-1 rounded-md px-1 text-xs font-bold text-teal-700 hover:text-teal-900" onclick={() => appState.navigate('queue')}>
          <ArrowLeft aria-hidden="true" size={14} /> Back to queue
        </button>
        <p class="eyebrow">Evidence review · {submission.id}</p>
        <h1 class="mt-1 text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">{submission.task}</h1>
        <p class="mt-1 text-sm text-slate-600">Submitted by <strong>{submission.submitter}</strong></p>
      </div>
      <StatusChip state={submission.reviewState} animate={appState.lastChangedSubmissionId === submission.id} />
    </section>

    <section class="panel overflow-hidden rounded-xl" aria-labelledby="matched-evidence-heading">
      <div class="flex flex-col gap-4 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p class="eyebrow"><BracketsCurly aria-hidden="true" size={13} class="mr-1 inline" />Matched evidence</p>
          <h2 id="matched-evidence-heading" class="mt-1 text-base font-extrabold">{submission.matches.length} matched snippet pairs</h2>
        </div>
        <div class="flex items-center justify-between gap-3 sm:justify-end">
          <div class="mr-2 text-right">
            <p class="tabular text-xs font-extrabold text-ink-900">{appState.evidenceFocusIndex + 1} of {submission.matches.length}</p>
            <p class="tabular text-[10px] font-bold uppercase tracking-wide text-slate-500">Pair similarity {currentMatch.similarity.toFixed(2)}</p>
          </div>
          <Button color="alternative" size="sm" class="interactive !min-h-11 !rounded-lg" disabled={appState.evidenceFocusIndex === 0} onclick={() => step(-1)} aria-label="Previous matched pair">
            <ArrowLeft aria-hidden="true" size={15} class="mr-1" /> Previous
          </Button>
          <Button color="alternative" size="sm" class="interactive !min-h-11 !rounded-lg" disabled={appState.evidenceFocusIndex === submission.matches.length - 1} onclick={() => step(1)} aria-label="Next matched pair">
            Next <ArrowRight aria-hidden="true" size={15} class="ml-1" />
          </Button>
        </div>
      </div>

      <div class="grid lg:grid-cols-2">
        <div class="border-b border-line lg:border-b-0 lg:border-r">
          <div class="flex items-center justify-between border-b border-line bg-ink-900 px-4 py-2.5 text-white">
            <h3 class="text-xs font-extrabold uppercase tracking-[.09em]">Submission excerpt</h3>
            <span class="font-mono text-[10px] text-slate-400">candidate/source.ts</span>
          </div>
          <div bind:this={submissionPane} class="h-72 space-y-5 overflow-y-auto scroll-smooth bg-[#f8f7f3] p-4 font-mono text-[13px] leading-6 sm:p-5" aria-label="Submission matched snippets">
            {#each submission.matches as match, index}
              <div data-pair={index} class={`rounded-lg border p-4 transition-all duration-300 ${appState.evidenceFocusIndex === index ? 'border-gold-500 bg-white shadow-md ring-2 ring-gold-500/20' : 'border-line bg-white/55 opacity-65'}`}>
                <p class="mb-2 text-[9px] font-bold uppercase tracking-[.13em] text-slate-400">Pair {index + 1}</p>
                <pre class="whitespace-pre-wrap font-mono">{#each match.submission as segment}<span class:match-mark={segment[1]}>{segment[0]}</span>{/each}</pre>
              </div>
            {/each}
          </div>
        </div>
        <div>
          <div class="flex items-center justify-between border-b border-line bg-ink-800 px-4 py-2.5 text-white">
            <h3 class="text-xs font-extrabold uppercase tracking-[.09em]">Reference excerpt</h3>
            <span class="font-mono text-[10px] text-slate-400">reference/specimen.ts</span>
          </div>
          <div bind:this={referencePane} class="h-72 space-y-5 overflow-y-auto scroll-smooth bg-[#f8f7f3] p-4 font-mono text-[13px] leading-6 sm:p-5" aria-label="Reference matched snippets">
            {#each submission.matches as match, index}
              <div data-pair={index} class={`rounded-lg border p-4 transition-all duration-300 ${appState.evidenceFocusIndex === index ? 'border-gold-500 bg-white shadow-md ring-2 ring-gold-500/20' : 'border-line bg-white/55 opacity-65'}`}>
                <p class="mb-2 text-[9px] font-bold uppercase tracking-[.13em] text-slate-400">Pair {index + 1}</p>
                <pre class="whitespace-pre-wrap font-mono">{#each match.reference as segment}<span class:match-mark={segment[1]}>{segment[0]}</span>{/each}</pre>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>

    <section class="panel rounded-xl p-4 sm:p-5" aria-labelledby="decision-heading">
      <div class="mb-5 flex items-start justify-between gap-4">
        <div>
          <p class="eyebrow">API create payload</p>
          <h2 id="decision-heading" class="mt-1 text-lg font-extrabold">Reviewer decision</h2>
          <p class="mt-1 text-xs text-slate-500">Both fields compile directly to <code class="rounded bg-slate-100 px-1 py-0.5">{'{ verdict, rationale }'}</code>.</p>
        </div>
        <span class="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[9px] font-bold uppercase text-slate-500">POST /decisions</span>
      </div>

      {#if existingDecision}
        <div class="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
          <div class="flex items-center gap-2 font-extrabold text-emerald-900"><CheckCircle aria-hidden="true" size={19} weight="fill" /> Decision recorded</div>
          <p class="mt-2 text-sm text-emerald-950">{existingDecision.requestBody.rationale}</p>
          <button class="interactive mt-4 min-h-11 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-800" onclick={() => appState.navigate('audit')}>View audit timeline</button>
        </div>
      {:else}
        <form class="space-y-5" aria-label="Reviewer decision form" novalidate onsubmit={onSubmit}>
          <fieldset>
            <legend class="mb-2 text-sm font-extrabold">Verdict <span class="text-rose-600">*</span></legend>
            <div class="grid gap-2 sm:grid-cols-2">
              <label class={`interactive flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border p-3.5 ${verdict === 'confirm-clean' ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/15' : 'border-slate-300 bg-white hover:border-emerald-300'}`}>
                <input
                  class="size-4 accent-emerald-600"
                  type="radio"
                  name="verdict"
                  value="confirm-clean"
                  checked={verdict === 'confirm-clean'}
                  onchange={() => chooseVerdict('confirm-clean')}
                  aria-describedby="verdict-error"
                />
                <CheckCircle aria-hidden="true" class="text-emerald-600" size={20} weight="fill" />
                <span><span class="block text-sm font-extrabold">Confirm clean</span><span class="block text-[11px] text-slate-500">Evidence does not establish a leak.</span></span>
              </label>
              <label class={`interactive flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border p-3.5 ${verdict === 'confirm-leak' ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-500/15' : 'border-slate-300 bg-white hover:border-rose-300'}`}>
                <input
                  class="size-4 accent-rose-600"
                  type="radio"
                  name="verdict"
                  value="confirm-leak"
                  checked={verdict === 'confirm-leak'}
                  onchange={() => chooseVerdict('confirm-leak')}
                  aria-describedby="verdict-error"
                />
                <WarningDiamond aria-hidden="true" class="text-rose-600" size={20} weight="fill" />
                <span><span class="block text-sm font-extrabold">Confirm leak</span><span class="block text-[11px] text-slate-500">Evidence establishes reference exposure.</span></span>
              </label>
            </div>
            {#if touched.verdict && validation.errors.verdict}<p id="verdict-error" class="field-error" role="alert" aria-live="assertive">verdict: {validation.errors.verdict}</p>
            {:else if touched.verdict && !verdict}<p id="verdict-error" class="field-error" role="alert" aria-live="assertive">Verdict is required: choose Confirm clean or Confirm leak.</p>{/if}
          </fieldset>

          <div>
            <div class="mb-2 flex items-center justify-between">
              <label for="rationale" class="text-sm font-extrabold">Rationale <span class="text-rose-600">*</span></label>
              <span class={`tabular text-[10px] font-bold ${rationale.length > 2000 ? 'text-rose-700' : 'text-slate-500'}`}>{rationale.length} / 2000</span>
            </div>
            <textarea
              id="rationale"
              name="rationale"
              rows="5"
              placeholder="Explain which matched evidence supports this decision…"
              aria-describedby="rationale-help rationale-error"
              aria-invalid={touched.rationale && Boolean(validation.errors.rationale)}
              class={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${touched.rationale && validation.errors.rationale ? 'border-rose-500' : 'border-slate-300'}`}
              value={rationale}
              oninput={(event) => { rationale = event.currentTarget.value; appState.updateDecisionDraft('rationale', rationale); touched.rationale = true; }}
            ></textarea>
            <p id="rationale-help" class="mt-1 text-[11px] text-slate-500">Required trimmed string, 20 to 2000 characters inclusive.</p>
            {#if touched.rationale && validation.errors.rationale}<p id="rationale-error" class="field-error" role="alert" aria-live="assertive">rationale: {validation.errors.rationale}</p>{/if}
          </div>

          {#if submitError}<p class="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800" role="alert">{submitError}</p>{/if}

          <div class="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
            <Button type="button" color="alternative" class="interactive !min-h-11 !rounded-lg" onclick={() => appState.cancelDecision()}>Cancel</Button>
            <Button type="submit" color="red" class="interactive !min-h-11 !rounded-lg !bg-signal-600 hover:!bg-signal-500" disabled={appState.submitting}>
              {appState.submitting ? 'Recording decision…' : (verdict === 'confirm-clean' ? 'Confirm clean' : verdict === 'confirm-leak' ? 'Confirm leak' : 'Choose a verdict')}
            </Button>
          </div>
        </form>
      {/if}
    </section>
  </div>
{/if}
