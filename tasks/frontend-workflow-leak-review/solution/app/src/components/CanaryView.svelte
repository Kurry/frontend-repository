<script>
  import { Alert, Badge } from 'flowbite-svelte';
  import { CaretDown, CheckCircle, Flask, MapPin, ShieldWarning, XCircle } from 'phosphor-svelte';
  let { state } = $props();
</script>

<div class="space-y-5">
  <section>
    <p class="eyebrow">Generation safeguards</p>
    <h1 class="mt-1 text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">Canary coverage</h1>
    <p class="mt-1 max-w-2xl text-sm text-slate-600">Placement and post-strip checks derive from the same task token manifest.</p>
  </section>

  <section class="grid gap-3 sm:grid-cols-3" aria-label="Canary overview">
    <div class="panel rounded-xl p-4"><p class="eyebrow">Tasks</p><p class="tabular mt-1 text-2xl font-black">{state.canaryTasks.length}</p></div>
    <div class="panel rounded-xl p-4"><p class="eyebrow">Seeded tokens</p><p class="tabular mt-1 text-2xl font-black">{state.canaryTasks.reduce((sum, task) => sum + task.tokens.length, 0)}</p></div>
    <div class="panel rounded-xl border-rose-200 bg-rose-50/80 p-4"><p class="eyebrow text-rose-700">Strip failures</p><p class="tabular mt-1 text-2xl font-black text-rose-800">{state.canaryTasks.flatMap((task) => task.tokens).filter((token) => !token.stripped).length}</p></div>
  </section>

  <section class="space-y-3" aria-label="Canary task disclosures">
    {#each state.canaryTasks as task}
      {@const failures = task.tokens.filter((token) => !token.stripped)}
      <article class="panel overflow-hidden rounded-xl">
        <button
          class="interactive flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-teal-50/60 sm:px-5"
          onclick={() => state.toggleCanary(task.task)}
          aria-expanded={task.expanded}
          aria-controls={`canary-${task.task.replaceAll(' ', '-').toLowerCase()}`}
        >
          <span class={`grid size-10 shrink-0 place-items-center rounded-lg ${failures.length ? 'bg-rose-100 text-rose-700' : 'bg-teal-100 text-teal-700'}`}><Flask aria-hidden="true" size={20} weight="fill" /></span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-extrabold text-ink-900 sm:text-base">{task.task}</span>
            <span class="mt-0.5 block text-[11px] text-slate-500">{task.tokens.length} canary tokens · {task.generatedFiles} generated files</span>
          </span>
          {#if failures.length}
            <Badge border class="!rounded-md !border-rose-300 !bg-rose-100 !text-rose-800"><XCircle aria-hidden="true" size={12} weight="fill" class="mr-1" />{failures.length} failed</Badge>
          {:else}
            <Badge border class="!rounded-md !border-emerald-300 !bg-emerald-100 !text-emerald-800"><CheckCircle aria-hidden="true" size={12} weight="fill" class="mr-1" />All clear</Badge>
          {/if}
          <CaretDown aria-hidden="true" size={18} weight="bold" class={`shrink-0 text-slate-400 transition-transform duration-250 ${task.expanded ? 'rotate-180' : ''}`} />
        </button>

        <div id={`canary-${task.task.replaceAll(' ', '-').toLowerCase()}`} class={`disclosure-grid ${task.expanded ? 'is-open' : ''}`}>
          <div class="overflow-hidden">
            <div class="border-t border-line bg-white/35 p-4 sm:p-5">
              {#if failures.length}
                <Alert color="red" class="!mb-4 !rounded-xl !border !border-rose-300 !bg-rose-50 !text-rose-950">
                  <ShieldWarning aria-hidden="true" size={21} weight="fill" class="mr-3 mt-0.5 shrink-0 text-rose-700" />
                  <div>
                    <p class="text-sm font-extrabold">Post-strip token survived</p>
                    {#each failures as failure}
                      <p class="mt-1 text-xs">Token <code class="rounded bg-white px-1 py-0.5 font-bold">{failure.token}</code> remains visible in <strong>{failure.survivorFile}</strong>.</p>
                    {/each}
                  </div>
                </Alert>
              {/if}

              <div class="grid gap-4 lg:grid-cols-2">
                <section class="overflow-hidden rounded-xl border border-line bg-white" aria-labelledby={`placement-${task.task}`}>
                  <div class="flex items-center gap-2 border-b border-line bg-slate-50 px-4 py-3"><MapPin aria-hidden="true" size={17} class="text-teal-700" weight="fill" /><h3 id={`placement-${task.task}`} class="text-sm font-extrabold">Placement coverage</h3></div>
                  <ul class="divide-y divide-line/70">
                    {#each task.tokens as token}
                      <li class="flex flex-col gap-2 px-4 py-3 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
                        <div><code class="text-xs font-bold text-ink-900">{token.token}</code><p class="mt-0.5 text-[11px] text-slate-500">present in {token.present} of {token.total} generated files</p></div>
                        <span class={`inline-flex w-fit items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-extrabold uppercase ${token.placementPass ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-rose-300 bg-rose-50 text-rose-800'}`}>
                          {#if token.placementPass}<CheckCircle aria-hidden="true" size={12} weight="fill" />Pass{:else}<XCircle aria-hidden="true" size={12} weight="fill" />Fail{/if}
                        </span>
                      </li>
                    {/each}
                  </ul>
                </section>

                <section class="overflow-hidden rounded-xl border border-line bg-white" aria-labelledby={`strip-${task.task}`}>
                  <div class="flex items-center gap-2 border-b border-line bg-slate-50 px-4 py-3"><ShieldWarning aria-hidden="true" size={17} class="text-teal-700" weight="fill" /><h3 id={`strip-${task.task}`} class="text-sm font-extrabold">Post-strip verification</h3></div>
                  <ul class="divide-y divide-line/70">
                    {#each task.tokens as token}
                      <li class="flex flex-col gap-2 px-4 py-3 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
                        <div><code class="text-xs font-bold text-ink-900">{token.token}</code><p class="mt-0.5 text-[11px] text-slate-500">{token.stripped ? 'Absent from the visible surface' : `Visible in ${token.survivorFile}`}</p></div>
                        <span class={`inline-flex w-fit items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-extrabold uppercase ${token.stripped ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-rose-300 bg-rose-50 text-rose-800'}`}>
                          {#if token.stripped}<CheckCircle aria-hidden="true" size={12} weight="fill" />Pass{:else}<XCircle aria-hidden="true" size={12} weight="fill" />Fail{/if}
                        </span>
                      </li>
                    {/each}
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </div>
      </article>
    {/each}
  </section>
</div>

<style>
  .disclosure-grid { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 250ms ease; }
  .disclosure-grid > div { min-height: 0; }
  .disclosure-grid.is-open { grid-template-rows: 1fr; }
  @media (prefers-reduced-motion: reduce) { .disclosure-grid { transition: none; } }
</style>
