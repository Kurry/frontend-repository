<script lang="ts">
  import { ClockCounterClockwise, Certificate, WarningOctagon, Note, ArrowsClockwise, Funnel } from 'phosphor-svelte';
  import { consoleStore } from '../console-store.svelte';
  import { formatTimestamp } from '../format';

  const label: Record<string, string> = {
    'all': 'All activity', 're-run': 'Re-runs', rejection: 'Rejections', certificate: 'Certificates', note: 'Notes'
  };
</script>

<section class="timeline surface" aria-labelledby="timeline-title">
  <div class="timeline-heading">
    <div>
      <span class="eyebrow">Immutable session log</span>
      <h3 id="timeline-title">Event timeline</h3>
    </div>
    <label>
      <Funnel size={13} />
      <span class="sr-only">Timeline entry type</span>
      <select
        value={consoleStore.timelineFilter}
        aria-label="Filter timeline by entry type"
        onchange={(event) => {
          consoleStore.timelineFilter = event.currentTarget.value as typeof consoleStore.timelineFilter;
        }}
      >
        {#each Object.entries(label) as [value, text]}<option {value}>{text}</option>{/each}
      </select>
    </label>
  </div>

  <div class="timeline-list" aria-live="polite">
    {#if consoleStore.visibleTimeline.length}
      {#each consoleStore.visibleTimeline as entry (entry.id)}
        <article class={`timeline-entry type-${entry.type} timeline-enter`}>
          <span class="entry-icon">
            {#if entry.type === 'certificate'}<Certificate size={17} weight="fill" />
            {:else if entry.type === 'rejection'}<WarningOctagon size={17} weight="fill" />
            {:else if entry.type === 'note'}<Note size={17} weight="fill" />
            {:else}<ArrowsClockwise size={17} weight="bold" />{/if}
          </span>
          <div><strong>{entry.type}</strong><p>{entry.summary}</p></div>
          <time datetime={entry.timestamp}>{formatTimestamp(entry.timestamp)} UTC</time>
        </article>
      {/each}
    {:else}
      <div class="empty-state">
        <ClockCounterClockwise size={27} />
        <strong>No {consoleStore.timelineFilter === 'all' ? 'events yet' : `${label[consoleStore.timelineFilter].toLowerCase()} yet`}</strong>
        <span>Re-runs, rejections, certificates, and gate notes will appear here.</span>
      </div>
    {/if}
  </div>
</section>

<style>
  .timeline { border-radius:.85rem; padding:1rem; }
  .timeline-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:1rem; margin-bottom:.75rem; }
  .eyebrow { color:#248899; font-size:.56rem; font-weight:850; letter-spacing:.09em; text-transform:uppercase; }
  h3 { margin:.12rem 0 0; font-size:.94rem; }
  label { display:flex; align-items:center; gap:.35rem; color:#718095; }
  select { color:inherit; background:white; border:1px solid #cad5e2; border-radius:.46rem; padding:.42rem 1.8rem .42rem .5rem; font-size:.67rem; font-weight:700; }
  :global(.dark) select { background:#0b1929; border-color:#30465e; }
  .timeline-list { display:grid; gap:.38rem; }
  .timeline-entry { display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:.65rem; padding:.58rem .65rem; background:#f7f9fc; border:1px solid #e1e7ef; border-radius:.52rem; }
  :global(.dark) .timeline-entry { background:#0a1727; border-color:#26394e; }
  .entry-icon { display:grid; place-items:center; width:1.9rem; height:1.9rem; border-radius:.45rem; }
  .type-certificate .entry-icon { color:#168962; background:#def5ed; }
  .type-rejection .entry-icon { color:#d04457; background:#ffe8ec; }
  .type-re-run .entry-icon { color:#b1700d; background:#fff0cf; }
  .type-note .entry-icon { color:#7251a4; background:#efe7fb; }
  :global(.dark) .type-certificate .entry-icon { color:#42d29f; background:#103229; }
  :global(.dark) .type-rejection .entry-icon { color:#ff7d8d; background:#351b24; }
  :global(.dark) .type-re-run .entry-icon { color:#f4ba55; background:#332810; }
  :global(.dark) .type-note .entry-icon { color:#c2a0f7; background:#281c3c; }
  .timeline-entry strong { color:#68798e; font-size:.55rem; text-transform:uppercase; letter-spacing:.07em; }
  .timeline-entry p { margin:.12rem 0 0; font-size:.69rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  time { color:#7c8b9e; font: .6rem var(--font-mono); white-space:nowrap; }
  .empty-state { min-height:8rem; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.3rem; color:#8493a6; text-align:center; }
  .empty-state strong { font-size:.74rem; }
  .empty-state span { font-size:.65rem; }
  .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
  @media (max-width:520px) {
    .timeline-heading { align-items:flex-start; }
    .timeline-entry { grid-template-columns:auto minmax(0,1fr); }
    time { grid-column:2; }
  }
</style>
