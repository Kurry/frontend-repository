<script>
  import { Badge, Toggle } from 'flowbite-svelte';
  import { ArrowsLeftRight, CheckCircle, Dna, XCircle } from 'phosphor-svelte';
  let { state } = $props();
</script>

<div class="space-y-5">
  <section>
    <p class="eyebrow">Behavioral sensitivity</p>
    <h1 class="mt-1 text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">Mutation track</h1>
    <p class="mt-1 max-w-2xl text-sm text-slate-600">Compare the same suite on original behavior and a deliberately altered twin. Flip counts include only enabled tests.</p>
  </section>

  <section class="space-y-5" aria-label="Mutation comparison suites">
    {#each state.mutationSuites as suite}
      <article class="panel overflow-hidden rounded-xl">
        <div class="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div class="flex items-center gap-3">
            <span class="grid size-10 place-items-center rounded-lg bg-violet-100 text-violet-700"><Dna aria-hidden="true" size={21} weight="fill" /></span>
            <div>
              <h2 class="text-base font-extrabold">{suite.task}</h2>
              <p class="mt-0.5 text-[11px] text-slate-500">{suite.mutant} · {suite.tests.filter((test) => test.included).length} of {suite.tests.length} tests included</p>
            </div>
          </div>
          <div class="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2">
            <ArrowsLeftRight aria-hidden="true" size={17} class="text-violet-700" weight="bold" />
            <span class="text-[10px] font-bold uppercase tracking-wide text-violet-700">Included flips</span>
            <span class="tabular text-xl font-black text-violet-900" aria-label={`${state.mutationFlipCount(suite)} included flips`}>{state.mutationFlipCount(suite)}</span>
          </div>
        </div>

        <div class="table-scroll">
          <table class="w-full min-w-[720px] text-left">
            <thead class="bg-ink-900 text-[10px] font-bold uppercase tracking-[.09em] text-slate-300">
              <tr><th class="w-24 px-5 py-3">Include</th><th class="px-4 py-3">Test</th><th class="w-28 px-4 py-3">Original</th><th class="w-28 px-4 py-3">Mutant</th></tr>
            </thead>
            <tbody>
              {#each suite.tests as test}
                {@const flipped = test.original === 'pass' && test.mutant === 'fail'}
                <tr class={`border-b border-line/70 transition-colors hover:bg-teal-50/60 ${flipped && test.included ? 'bg-violet-50/75' : 'bg-white/35'} ${!test.included ? 'opacity-55' : ''}`}>
                  <td class="px-5 py-3">
                    <Toggle
                      checked={test.included}
                      onchange={(event) => state.toggleMutationTest(suite.task, test.id, event.currentTarget.checked)}
                      aria-label={`Include ${test.name}`}
                      class="mutation-toggle !relative !inline-flex"
                      classes={{ input: '!absolute !inset-0 !z-10 !h-full !w-full !cursor-pointer !opacity-0', span: 'pointer-events-none' }}
                    />
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2"><span class="text-sm font-bold text-ink-900">{test.name}</span>{#if flipped}<Badge border class="!rounded !border-violet-300 !bg-violet-100 !px-1.5 !py-0.5 !text-[9px] !font-extrabold !text-violet-800">FLIP</Badge>{/if}</div>
                    <span class="font-mono text-[9px] text-slate-400">{test.id}</span>
                  </td>
                  <td class="px-4 py-3"><span class="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700"><CheckCircle aria-hidden="true" size={14} weight="fill" />Pass</span></td>
                  <td class="px-4 py-3">
                    {#if test.mutant === 'pass'}<span class="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700"><CheckCircle aria-hidden="true" size={14} weight="fill" />Pass</span>
                    {:else}<span class="inline-flex items-center gap-1 text-xs font-extrabold text-rose-700"><XCircle aria-hidden="true" size={14} weight="fill" />Fail</span>{/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </article>
    {/each}
  </section>
</div>
