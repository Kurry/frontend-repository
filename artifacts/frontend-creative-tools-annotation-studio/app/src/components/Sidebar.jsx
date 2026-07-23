import { useMemo } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Button, Checkbox, Tag } from '@carbon/react';
import { Download, Play, Time, TaskComplete, InProgress, Error as ErrorIcon, Restart } from '@carbon/icons-react';
import { useStudioStore, downloadText, compileJsonl } from '../store';

const stateLabels = { unlabeled: 'Unlabeled', labeled: 'Labeled', reviewed: 'Reviewed', disputed: 'Disputed' };

export function StateChip({ state }) {
  return <span className={`state-chip state-${state}`}>{stateLabels[state]}</span>;
}

function ProgressRing({ completed, total }) {
  const ratio = total ? completed / total : 0;
  const radius = 11;
  const circumference = 2 * Math.PI * radius;
  return <svg className="progress-ring" width="30" height="30" viewBox="0 0 30 30" role="img" aria-label={`${completed} of ${total} completed`}>
    <circle cx="15" cy="15" r={radius} className="ring-track" />
    <circle cx="15" cy="15" r={radius} className="ring-fill" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - ratio)} />
    {ratio === 1 && <TaskComplete size={12} x="9" y="9" className="ring-done" />}
  </svg>;
}

const assistStatusCopy = { pending: 'Pending', running: 'Running', retrying: 'Retrying', complete: 'Complete', failed: 'Failed' };

export function AssistPanel() {
  const run = useStudioStore((s) => s.activeAssistSuiteId ? s.assistRuns[s.activeAssistSuiteId] : null);
  const pause = useStudioStore((s) => s.pauseAssist);
  const resume = useStudioStore((s) => s.resumeAssist);
  const retry = useStudioStore((s) => s.retryAssistStep);
  const setFilter = useStudioStore((s) => s.setAssistFilter);
  const selectEvent = useStudioStore((s) => s.selectAssistEvent);
  if (!run) return null;
  const complete = run.steps.filter((step) => step.status === 'complete').length;
  const failures = run.steps.filter((step) => step.status === 'failed').length;
  const end = run.finishedAt || Date.now();
  const elapsed = Math.max(0, Math.round((end - run.startedAt) / 1000));
  const events = run.timelineFilter === 'all' ? run.events : run.events.filter((event) => event.status === run.timelineFilter);
  return (
    <section className="assist-panel" aria-label="Assist run">
      <div className="assist-heading">
        <div><p className="eyebrow">Assist run</p><strong>{complete} of {run.steps.length}</strong> · {elapsed}s · {failures} failed</div>
        {run.status === 'running' ? <Button size="sm" kind="ghost" renderIcon={Time} onClick={() => pause(run.suiteId)}>Pause</Button>
          : run.status === 'paused' ? <Button size="sm" kind="ghost" renderIcon={Play} onClick={() => resume(run.suiteId)}>Resume</Button> : null}
      </div>
      <div className="assist-steps">
        {run.steps.map((step) => {
          const Icon = step.status === 'complete' ? TaskComplete : step.status === 'failed' ? ErrorIcon : step.status === 'running' ? InProgress : Time;
          const waiting = step.status === 'retrying' ? Math.max(0, Math.ceil((step.retryAt - Date.now()) / 1000)) : null;
          const highlighted = run.events.find((event) => event.id === run.selectedEventId)?.stepId === step.id;
          return <div key={step.id} className={`assist-step status-${step.status} ${highlighted ? 'highlighted' : ''}`}>
            <Icon size={16} className={step.status === 'running' ? 'spinning' : ''} />
            <div className="grow"><strong>{step.title}</strong><span key={step.status + (waiting ?? '')} className="status-line">{step.status === 'retrying' ? `Retrying in ${waiting}s · attempt ${step.attempts + 1} of ${step.maxAttempts}` : assistStatusCopy[step.status] || step.status} {step.error && `· ${step.error}`}</span></div>
            {step.status === 'failed' && <Button hasIconOnly tooltipPosition="bottom" size="sm" kind="ghost" renderIcon={Restart} iconDescription="Retry failed step" onClick={() => retry(run.suiteId, step.id)} />}
          </div>;
        })}
      </div>
      <div className="timeline-header">
        <strong>Event timeline</strong>
        <select aria-label="Filter event timeline by status" value={run.timelineFilter} onChange={(e) => setFilter(run.suiteId, e.target.value)}>
          <option value="all">All statuses</option><option value="running">Running</option><option value="retrying">Retrying</option><option value="complete">Complete</option><option value="failed">Failed</option><option value="paused">Paused</option>
        </select>
      </div>
      <div className="timeline-list">
        {events.length ? events.slice().reverse().map((event) => <button key={event.id} className={run.selectedEventId === event.id ? 'selected' : ''} onClick={() => selectEvent(run.suiteId, event.id)}>
          <span>{new Date(event.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>{event.text}
        </button>) : <p className="empty-mini">No events match this status filter. Choose another status or keep the run going.</p>}
      </div>
    </section>
  );
}

export default function Sidebar() {
  const state = useStudioStore();
  const [queueRef] = useAutoAnimate();
  const activeSuite = state.suites.find((suite) => suite.id === state.activeSuiteId);
  const visibleIds = activeSuite?.itemIds.filter((id) => state.items[id]?.review_state === 'unlabeled') || [];
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => state.selected.includes(id));
  const history = state.historyOrder.map((id) => state.items[id]).filter((item) => item?.annotation);
  const jsonl = useMemo(() => compileJsonl(state), [state.items, state.suites]);
  const startAssist = (suiteId) => {
    const result = state.startAssist(suiteId);
    if (!result.ok) state.setToast(result.error, 'info');
  };
  return (
    <aside className={`sidebar ${state.mobileSidebarOpen ? 'mobile-open' : ''}`} aria-label="Annotation queue">
      <div className="sidebar-tabs" role="tablist">
        <button role="tab" aria-selected={state.sidebarTab === 'queue'} onClick={() => state.setSidebarTab('queue')}>Queue</button>
        <button role="tab" aria-selected={state.sidebarTab === 'history'} onClick={() => state.setSidebarTab('history')}>History <Tag size="sm" type="gray">{history.length}</Tag></button>
      </div>
      {state.sidebarTab === 'queue' ? <>
        <div className="sidebar-actions"><Button size="sm" kind="ghost" renderIcon={Download} onClick={() => downloadText(jsonl, 'corvid-annotations.jsonl', 'application/x-ndjson')}>Download JSONL</Button></div>
        <nav className="suite-list" aria-label="Evaluation suites">
          {state.suites.map((suite) => {
            const remaining = suite.itemIds.filter((id) => state.items[id]?.review_state === 'unlabeled').length;
            const completed = suite.itemIds.length - remaining;
            const skipped = suite.itemIds.reduce((n, id) => n + (state.items[id]?.skipped || 0), 0);
            return <div key={suite.id} className={`suite-row ${suite.id === state.activeSuiteId ? 'active' : ''}`}>
              <ProgressRing completed={completed} total={suite.itemIds.length} />
              <button className="suite-select" onClick={() => state.selectSuite(suite.id)}>
                <span><strong>{suite.name}</strong><small>{completed} completed</small></span>
                <span className="suite-badges"><b key={remaining} className="badge-pulse">{remaining}</b>{skipped > 0 && <em>{skipped} skipped</em>}</span>
              </button>
              <Button hasIconOnly tooltipPosition="bottom" kind="ghost" size="sm" renderIcon={Play} iconDescription={`Run Assist on ${suite.name}`} onClick={() => startAssist(suite.id)} />
            </div>;
          })}
        </nav>
        {activeSuite && <div className="queue-control">
          <Checkbox id={`select-all-${activeSuite.id}`} labelText={`Select all in ${activeSuite.name}`} checked={allSelected} onChange={(event, data) => state.selectAllSuite(activeSuite.id, data?.checked ?? event.target.checked)} />
        </div>}
        {state.selected.length > 0 && <div className="bulk-bar" aria-label="Bulk actions">
          <strong>{state.selected.length} selected</strong>
          <div><Button size="sm" kind="secondary" onClick={() => state.skipItems(state.selected)}>Skip selected</Button><Button size="sm" kind="tertiary" onClick={state.bulkMarkReviewed}>Mark reviewed</Button><Button size="sm" kind="ghost" onClick={state.clearSelection}>Clear selection</Button></div>
        </div>}
        <div className="queue-list" ref={queueRef} aria-live="polite">
          {visibleIds.map((id) => {
            const item = state.items[id];
            return <div key={id} className={`queue-item ${id === state.activeItemId ? 'active' : ''}`}>
              <Checkbox id={`select-${id}`} aria-label={`Select ${item.title}`} labelText="" hideLabel checked={state.selected.includes(id)} onChange={() => state.toggleSelected(id)} />
              <button onClick={() => state.selectItem(id)}><strong>{item.title}</strong><span><StateChip state={item.review_state} />{item.skipped > 0 && <em>{item.skipped}× skipped</em>}{item.suggested && <b>Suggested</b>}</span></button>
            </div>;
          })}
          {visibleIds.length === 0 && <p className="sidebar-empty">No unannotated items remain in this suite. Switch suites above, or open the Review queue to check labeled work.</p>}
        </div>
        <AssistPanel />
      </> : <div className="history-list">
        {history.map((item) => <button key={item.id} className={state.historyItemId === item.id ? 'active' : ''} onClick={() => state.openHistory(item.id)}>
          <span><strong>{item.title}</strong><small className="clamp-2">{item.response}</small></span>
          <span className={`rating-dot ${item.annotation.rating}`}>{item.annotation.rating === 'up' ? '↑' : '↓'}</span>
          <time>{new Date(item.submittedAt).toLocaleDateString()}</time>
        </button>)}
      </div>}
    </aside>
  );
}
