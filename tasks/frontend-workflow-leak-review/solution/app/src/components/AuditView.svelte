<script>
  import { createForm } from 'felte';
  import { validator } from '@felte/validator-zod';
  import { Select } from 'flowbite-svelte';
  import { CheckCircle, ClockCounterClockwise, Funnel, WarningDiamond } from 'phosphor-svelte';
  import { auditFilterSchema } from '../lib/schemas.js';
  import { verdictLabels } from '../lib/data.js';

  let { state } = $props();
  const { form: auditFilterForm } = createForm({
    initialValues: { verdict: 'all' },
    extend: validator({ schema: auditFilterSchema }),
    onSubmit: ({ verdict }) => state.setAuditFilter(verdict)
  });
  const options = [
    { value: 'all', name: 'All verdicts' },
    { value: 'confirm-clean', name: 'Confirm clean' },
    { value: 'confirm-leak', name: 'Confirm leak' }
  ];
</script>

<div class="space-y-5">
  <section class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p class="eyebrow">Recorded decisions</p>
      <h1 class="mt-1 text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">Audit timeline</h1>
      <p class="mt-1 max-w-2xl text-sm text-slate-600">Decision events are ordered newest first and compile from the same API-shaped records as export.</p>
    </div>
    <form use:auditFilterForm class="flex items-center gap-2" aria-label="Filter audit timeline by verdict">
      <Funnel size={16} class="text-slate-500" />
      <Select name="verdict" items={options} value={state.auditFilter} onchange={(event) => state.setAuditFilter(event.currentTarget.value)} classes={{ select: '!rounded-lg !border-slate-300 !bg-white !py-2 !text-sm' }} aria-label="Audit verdict" />
    </form>
  </section>

  <section class="panel rounded-xl p-4 sm:p-6" aria-live="polite" aria-label="Decision event timeline">
    {#if state.auditEntries.length}
      <ol class="relative ml-3 border-l-2 border-slate-200">
        {#each state.auditEntries as entry (entry.submissionId)}
          <li class={`group relative ml-6 pb-7 last:pb-0 ${state.newestAuditSubmissionId === entry.submissionId ? 'audit-enter' : ''}`}>
            <span class={`absolute -left-[2.15rem] top-0 grid size-6 place-items-center rounded-full border-4 border-paper-50 ${entry.requestBody.verdict === 'confirm-clean' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
              {#if entry.requestBody.verdict === 'confirm-clean'}<CheckCircle size={13} weight="bold" />{:else}<WarningDiamond size={13} weight="bold" />{/if}
            </span>
            <article class="interactive rounded-xl border border-line bg-white/70 p-4 group-hover:border-teal-200 group-hover:bg-teal-50/55 sm:p-5">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span class={`inline-flex rounded-md border px-2 py-1 text-[10px] font-extrabold uppercase ${entry.requestBody.verdict === 'confirm-clean' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-rose-300 bg-rose-50 text-rose-800'}`}>{verdictLabels[entry.requestBody.verdict]}</span>
                  <h2 class="mt-2 text-sm font-extrabold text-ink-900">{entry.task}</h2>
                  <p class="mt-0.5 text-xs text-slate-500">Submitted by {entry.submitter} · {entry.submissionId}</p>
                </div>
                <time datetime={entry.decidedAt} class="tabular flex items-center gap-1 text-[10px] font-bold text-slate-400"><ClockCounterClockwise size={13} />{new Date(entry.decidedAt).toLocaleString()}</time>
              </div>
              <p class="mt-3 border-l-2 border-slate-200 pl-3 text-sm leading-6 text-slate-700">{entry.requestBody.rationale}</p>
            </article>
          </li>
        {/each}
      </ol>
    {:else}
      <div class="py-12 text-center">
        <span class="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400"><ClockCounterClockwise size={23} /></span>
        <h2 class="mt-4 text-base font-extrabold text-ink-900">
          {state.decisions.length === 0 ? 'No decisions recorded yet' : `No ${verdictLabels[state.auditFilter]} decisions`}
        </h2>
        <p class="mx-auto mt-1 max-w-md text-sm text-slate-500">
          {state.decisions.length === 0 ? 'Decisions will appear here once a reviewer confirms a submission.' : `No decisions of the ${verdictLabels[state.auditFilter]} verdict exist yet. Clear the filter to see other events.`}
        </p>
        {#if state.decisions.length > 0}<button class="interactive mt-4 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold" onclick={() => state.setAuditFilter('all')}>Clear verdict filter</button>{/if}
      </div>
    {/if}
  </section>
</div>
