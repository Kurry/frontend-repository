<script lang="ts">
  import { IconClockHour4, IconFilter, IconHistory, IconRefresh, IconTag, IconTimelineEvent } from '@tabler/icons-svelte';
  import { fly } from 'svelte/transition';
  import { triage } from '../lib/triage.svelte';
  import { AUDIT_TYPES, type AuditType } from '../lib/types';

  function typeLabel(type: AuditType): string {
    return type.replaceAll('-', ' ').replace('re run', 're-run');
  }

  function timeLabel(timestamp: string): string {
    return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(timestamp));
  }
</script>

<section class="card-panel audit-panel" id="audit-timeline" aria-labelledby="audit-title">
  <div class="audit-header">
    <div>
      <span class="eyebrow">Session history</span>
      <h2 class="panel-title" id="audit-title">Audit timeline</h2>
    </div>
    <label>
      <span class="sr-only">Filter timeline by entry type</span>
      <select class="control" value={triage.timelineFilter} onchange={(event) => triage.setTimelineFilter((event.currentTarget as HTMLSelectElement).value)}>
        <option value="">All entry types</option>
        {#each AUDIT_TYPES as type}
          <option value={type}>{typeLabel(type)}</option>
        {/each}
      </select>
    </label>
  </div>
  <div class="timeline-wrap">
    {#if triage.visibleAudit.length}
      <ol class="timeline-list">
        {#each triage.visibleAudit as event (event.id)}
          <li class={`event ${event.type}`} in:fly={{ y: -7, duration: 180 }}>
            <span class="event-icon">
              {#if event.type === 'reason-change'}<IconTag size={15} />
              {:else if event.type === 'verdict-change'}<IconTimelineEvent size={15} />
              {:else}<IconRefresh size={15} />{/if}
            </span>
            <span class="event-content">
              <span class="event-topline"><strong>{typeLabel(event.type)}</strong><time datetime={event.timestamp}><IconClockHour4 size={12} /> {timeLabel(event.timestamp)}</time></span>
              <span class="event-test mono">{event.testId}</span>
              <span class="event-message">{event.message}</span>
            </span>
          </li>
        {/each}
      </ol>
    {:else if triage.timelineFilter}
      <div class="empty-timeline">
        <IconFilter size={20} />
        <strong>No {typeLabel(triage.timelineFilter as AuditType)} entries</strong>
        <span>This suite has no audit events of the selected type.</span>
        <button class="action-btn" type="button" onclick={() => triage.setTimelineFilter('')}>Clear timeline filter</button>
      </div>
    {:else}
      <div class="empty-timeline">
        <IconHistory size={21} />
        <strong>No session events yet</strong>
        <span>Reason changes, verdict changes, and re-run started, stopped, or completed events will appear here.</span>
      </div>
    {/if}
  </div>
</section>

<style>
  .audit-panel { overflow: hidden; }
  .audit-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 20px 14px; border-bottom: 1px solid #e2e8e4; }
  .audit-header h2 { margin: 2px 0 0; }
  .audit-header select { min-width: 180px; }
  .timeline-wrap { min-height: 150px; max-height: 330px; overflow-y: auto; padding: 7px 10px; }
  .timeline-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 0; padding: 0; list-style: none; }
  .event { display: flex; gap: 10px; min-width: 0; border-radius: 11px; padding: 11px; transition: background-color 150ms ease; }
  .event:hover { background: #f2f7f4; }
  .event-icon { display: inline-grid; width: 30px; height: 30px; flex: 0 0 auto; place-items: center; border-radius: 9px; background: #e7f2ed; color: #087f6d; }
  .reason-change .event-icon { background: #e5eaf7; color: #4a61a0; }
  .verdict-change .event-icon { background: #fff0c7; color: #93600c; }
  .re-run-stopped .event-icon { background: #ffe2e0; color: #a82e32; }
  .event-content { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 2px; }
  .event-topline { display: flex; align-items: center; justify-content: space-between; gap: 9px; color: #45534d; font-size: 10px; text-transform: capitalize; }
  .event-topline time { display: inline-flex; align-items: center; gap: 4px; color: #87928e; font-family: var(--font-mono); font-size: 8px; white-space: nowrap; }
  .event-test { overflow: hidden; color: #2e3b36; font-size: 9px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
  .event-message { color: #75817c; font-size: 9px; line-height: 1.4; }
  .empty-timeline { display: flex; min-height: 135px; max-width: 500px; margin: 0 auto; align-items: center; justify-content: center; flex-direction: column; gap: 6px; padding: 20px; color: #7a8681; text-align: center; font-size: 11px; }
  .empty-timeline strong { color: #2c3934; font-size: 13px; }
  .empty-timeline .action-btn { margin-top: 5px; }
  :global(.dark) .audit-header { border-color: #30403a; }
  :global(.dark) .event:hover { background: #20302a; }
  :global(.dark) .event-topline, :global(.dark) .event-test, :global(.dark) .empty-timeline strong { color: #dce5e0; }
  :global(.dark) .event-icon { background: #214238; }
  :global(.dark) .reason-change .event-icon { background: #28334c; color: #9fb3ef; }
  :global(.dark) .verdict-change .event-icon { background: #40351e; color: #f3ce6c; }
  :global(.dark) .re-run-stopped .event-icon { background: #47282b; color: #f5aaab; }
  @media (max-width: 767px) {
    .audit-header { align-items: stretch; flex-direction: column; padding: 16px; }
    .audit-header select { width: 100%; }
    .timeline-list { grid-template-columns: 1fr; }
  }
</style>
