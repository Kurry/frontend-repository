// Bottom workbench drawer: Validation playground (steps, rollup, gauge,
// backoff countdowns, filterable event timeline), schema versioning with
// color-coded structural diff, and both import flows.
import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Play, Pause, Renew, Save, Compare, ChevronUp, ChevronDown } from '@carbon/icons-react';
import { useStore, activeSchema } from './store.js';
import { diffTrees } from './lib.js';
import { Tabs, TabPanel, StatusChip, Gauge, Field, EmptyState, TypeBadge, useDur } from './ui.jsx';

/* ------------------------------- Playground ------------------------------ */

function timeOf(t) {
  const d = new Date(t);
  return `${d.toLocaleTimeString([], { hour12: false })}.${String(d.getMilliseconds()).padStart(3, '0')}`;
}

function Playground() {
  const payloadText = useStore((s) => s.payloadText);
  const setPayloadText = useStore((s) => s.setPayloadText);
  const payloadError = useStore((s) => s.payloadError);
  const run = useStore((s) => s.run);
  const startRun = useStore((s) => s.startRun);
  const pauseRun = useStore((s) => s.pauseRun);
  const resumeRun = useStore((s) => s.resumeRun);
  const retryStep = useStore((s) => s.retryStep);
  const eventFilter = useStore((s) => s.eventFilter);
  const setEventFilter = useStore((s) => s.setEventFilter);
  const toast = useStore((s) => s.toast);

  const running = run && ['running', 'retrying'].includes(run.status);
  const ratio = run && run.checked > 0 ? (run.checked - run.failures) / run.checked : run && run.status === 'done' ? 1 : 0;
  const events = useMemo(
    () => [...(run ? run.events : [])].reverse().filter((e) => eventFilter === 'all' || e.to === eventFilter),
    [run, eventFilter],
  );

  function onRun() {
    const r = startRun();
    if (!r.ok) toast(r.error, 'error');
  }

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 md:grid-cols-[1fr_290px]">
      <div className="flex min-h-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="payload">
            Playground payload (JSON)
          </label>
          {!running && run?.status !== 'paused' ? (
            <button type="button" className="btn btn-primary tap" onClick={onRun}>
              <Play size={13} aria-hidden="true" /> Run validation
            </button>
          ) : null}
          {running && (
            <button type="button" className="btn btn-primary tap" onClick={pauseRun}>
              <Pause size={13} aria-hidden="true" /> Pause
            </button>
          )}
          {run?.status === 'paused' && (
            <button type="button" className="btn btn-primary tap" onClick={resumeRun}>
              <Play size={13} aria-hidden="true" /> Resume
            </button>
          )}
          {run && (
            <span className="rollup" role="status" aria-live="polite">
              <StatusChip status={run.status} />
              <span>
                {run.checked} of {run.total} checked · {run.failures} failure{run.failures === 1 ? '' : 's'}
              </span>
            </span>
          )}
          {run && <Gauge ratio={ratio} failures={run.failures} size={46} />}
        </div>
        <textarea
          id="payload"
          className="input input-area mono min-h-24"
          value={payloadText}
          onChange={(e) => setPayloadText(e.target.value)}
          aria-invalid={payloadError ? 'true' : undefined}
          aria-describedby={payloadError ? 'payload-error' : undefined}
        />
        {payloadError && (
          <p className="field-error" id="payload-error" role="alert">
            {payloadError}
          </p>
        )}
        <div className="step-list" aria-label="Validation steps">
          {!run && (
            <p className="muted text-sm">
              One step per top-level field. Steps advance through pending → running → complete or failed, with occasional simulated
              slowdowns that retry automatically.
            </p>
          )}
          {run &&
            run.steps.map((st, i) => (
              <div key={st.nodeId} className={`step-row step-${st.status}`}>
                <span className="step-idx">{i + 1}</span>
                <span className="step-key mono">{st.key}</span>
                <StatusChip status={st.status} />
                {st.status === 'retrying' && (
                  <motion.span key={st.backoff} className="backoff" initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
                    Retrying in {st.backoff}… · attempt {st.attempts + 1} of {st.maxAttempts}
                  </motion.span>
                )}
                {st.status !== 'retrying' && st.attempts > 0 && (
                  <span className="muted text-xs">attempt {st.attempts + (st.status === 'failed' ? 1 : 0)} of {st.maxAttempts}</span>
                )}
                {st.status === 'failed' && (
                  <span className="step-error" role="alert">
                    {st.error}
                    <button type="button" className="btn btn-ghost tap ml-2" onClick={() => retryStep(i)}>
                      <Renew size={12} aria-hidden="true" /> Retry step
                    </button>
                  </span>
                )}
              </div>
            ))}
        </div>
      </div>
      <div className="flex min-h-0 flex-col">
        <div className="mb-1 flex flex-wrap items-center gap-1" role="group" aria-label="Filter event timeline by status">
          {['all', 'running', 'retrying', 'complete', 'failed'].map((f) => (
            <button
              key={f}
              type="button"
              className={`filter-chip tap ${eventFilter === f ? 'filter-chip-on' : ''}`}
              aria-pressed={eventFilter === f}
              onClick={() => setEventFilter(f)}
            >
              {f === 'all' ? 'All' : f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <ol className="timeline" aria-label="Event timeline">
          {events.map((e) => (
            <li key={e.id} className={`timeline-item tl-${e.to}`}>
              <span className="mono timeline-time">{timeOf(e.t)}</span>
              <span className="timeline-key">{e.key}</span>
              <span className="timeline-to">{e.label || e.to}</span>
            </li>
          ))}
          {!events.length && <li className="muted text-xs">No events yet — run a validation to fill the timeline.</li>}
        </ol>
      </div>
    </div>
  );
}

/* -------------------------------- Versions ------------------------------- */

function Versions() {
  const dur = useDur();
  const sc = useStore(activeSchema);
  const saveVersion = useStore((s) => s.saveVersion);
  const diffBaseId = useStore((s) => s.diffBaseId);
  const diffCompareId = useStore((s) => s.diffCompareId);
  const setDiffBase = useStore((s) => s.setDiffBase);
  const setDiffCompare = useStore((s) => s.setDiffCompare);
  const toast = useStore((s) => s.toast);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');

  const versions = sc ? sc.versions : [];
  const base = versions.find((v) => v.id === diffBaseId) || versions[1] || versions[0];
  const compare = versions.find((v) => v.id === diffCompareId) || versions[0];
  const rows = base && compare ? diffTrees(base.tree, compare.tree) : [];

  function onSave(e) {
    e.preventDefault();
    const r = saveVersion(name);
    if (!r.ok) {
      if (r.error !== 'ignored-duplicate') setNameError(r.error);
      return;
    }
    setName('');
    setNameError('');
  }

  return (
    <div className="grid min-h-0 grid-cols-1 gap-3 lg:grid-cols-[300px_1fr]">
      <div className="flex min-h-0 flex-col gap-2">
        <form className="flex items-end gap-2" onSubmit={onSave} noValidate>
          <div className="min-w-0 flex-1">
            <Field label="Version name" htmlFor="version-name" error={nameError} hint="VersionSnapshot.name — required, 1 to 80 characters">
              <input
                id="version-name"
                className="input"
                value={name}
                autoComplete="off"
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError('');
                }}
                aria-invalid={nameError ? 'true' : undefined}
                aria-describedby={nameError ? 'version-name-error' : 'version-name-hint'}
              />
            </Field>
          </div>
          <button type="submit" className="btn btn-primary tap">
            <Save size={13} aria-hidden="true" /> Save version
          </button>
        </form>
        <div className="version-list">
          {!versions.length && (
            <p className="muted text-sm">No versions saved yet — snapshot the current tree with a name to start comparing.</p>
          )}
          {versions.map((v) => (
            <div key={v.id} className="version-row">
              <span className="min-w-0 truncate text-sm font-medium" title={v.name}>
                {v.name}
              </span>
              <span className="muted ml-auto shrink-0 text-xs">{new Date(v.ts).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex min-h-0 flex-col">
        {versions.length >= 2 ? (
          <>
            <div className="mb-2 flex flex-wrap items-end gap-3">
              <Field label="Base version" htmlFor="diff-base">
                <select id="diff-base" className="select" value={base ? base.id : ''} onChange={(e) => setDiffBase(e.target.value)}>
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </Field>
              <span className="pb-2 text-lg" aria-hidden="true">
                →
              </span>
              <Field label="Compare version" htmlFor="diff-compare">
                <select id="diff-compare" className="select" value={compare ? compare.id : ''} onChange={(e) => setDiffCompare(e.target.value)}>
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </Field>
              <span className="muted pb-2 text-xs">
                <Compare size={13} className="mr-1 inline" aria-hidden="true" />
                added · removed · changed
              </span>
            </div>
            <div className="diff-list" aria-label={`Diff between ${base.name} and ${compare.name}`}>
              {base.id === compare.id || !rows.length ? (
                <p className="diff-none">
                  <Compare size={14} aria-hidden="true" /> No differences between these versions.
                </p>
              ) : (
                <AnimatePresence initial={false}>
                  {rows.map((r, i) => (
                    <motion.div
                      key={`${r.path}-${r.kind}`}
                      className={`diff-row diff-${r.kind}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: dur.fast, delay: Math.min(i * 0.03, 0.3) }}
                    >
                      <span className="mono diff-path">{r.path}</span>
                      <span className="diff-label">{r.label}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </>
        ) : (
          <EmptyState title="Save two versions to see a structural diff">
            <p className="muted text-sm">
              Snapshots appear newest-first with name and timestamp. The diff marks added fields in the success color, removed fields
              in the error color, and changed fields in the warning color — each with a text label.
            </p>
          </EmptyState>
        )}
      </div>
    </div>
  );
}

/* --------------------------------- Import -------------------------------- */

function ImportPanes() {
  const importTab = useStore((s) => s.importTab);
  const setImportTab = useStore((s) => s.setImportTab);
  const importExampleText = useStore((s) => s.importExampleText);
  const setImportExampleText = useStore((s) => s.setImportExampleText);
  const importDraft = useStore((s) => s.importDraft);
  const importDraftError = useStore((s) => s.importDraftError);
  const inferDraft = useStore((s) => s.inferDraft);
  const toggleDraftField = useStore((s) => s.toggleDraftField);
  const applyImportDraft = useStore((s) => s.applyImportDraft);
  const packageText = useStore((s) => s.packageText);
  const setPackageText = useStore((s) => s.setPackageText);
  const packageError = useStore((s) => s.packageError);
  const importPackage = useStore((s) => s.importPackage);
  const toast = useStore((s) => s.toast);

  return (
    <div className="flex min-h-0 flex-col">
      <Tabs
        id="import"
        active={importTab}
        onChange={setImportTab}
        tabs={[
          { id: 'example', label: 'From example' },
          { id: 'package', label: 'SchemaPackage JSON' },
        ]}
        className="mb-2"
      />
      {importTab === 'example' && (
        <TabPanel id="import" tab="example" className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="field-label" htmlFor="import-example">
              Example JSON object — the inferred draft follows exactly what you paste, e.g. {'{"alpha": "hello", "count": 3}'}
            </label>
            <textarea
              id="import-example"
              className="input input-area mono min-h-28"
              value={importExampleText}
              onChange={(e) => setImportExampleText(e.target.value)}
              aria-invalid={importDraftError ? 'true' : undefined}
              aria-describedby={importDraftError ? 'import-example-error' : undefined}
            />
            {importDraftError && (
              <p className="field-error" id="import-example-error" role="alert">
                {importDraftError}
              </p>
            )}
            <div>
              <button
                type="button"
                className="btn btn-primary tap"
                onClick={() => {
                  const r = inferDraft();
                  if (!r.ok) toast(r.error, 'error');
                }}
              >
                Infer draft
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-col">
            <h3 className="heading-sub">Inferred draft — review each field</h3>
            {!importDraft && <p className="muted text-sm">Paste a different object and infer again to get a matching new draft.</p>}
            {importDraft && (
              <>
                <ul className="draft-list">
                  {importDraft.fields.map((f) => (
                    <li key={f.id} className={`draft-row ${f.accepted ? '' : 'draft-rejected'}`}>
                      <span className="mono truncate text-sm font-medium">{f.key}</span>
                      <TypeBadge type={f.type} />
                      {(f.pattern || f.minimum !== undefined) && (
                        <span className="muted truncate text-xs" title={f.hint}>
                          {f.pattern ? `pattern ${f.pattern}` : `min ${f.minimum} · max ${f.maximum}`}
                        </span>
                      )}
                      {f.hint && !f.pattern && f.minimum === undefined && <span className="muted truncate text-xs">{f.hint}</span>}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={f.accepted}
                        aria-label={`${f.accepted ? 'Reject' : 'Accept'} inferred field ${f.key}`}
                        className={`switch switch-sm tap ml-auto ${f.accepted ? 'switch-on' : ''}`}
                        onClick={() => toggleDraftField(f.id)}
                      >
                        <span className="switch-thumb" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-2">
                  <button
                    type="button"
                    className="btn btn-primary tap"
                    onClick={() => {
                      const r = applyImportDraft();
                      if (!r.ok) toast(r.error, 'error');
                    }}
                  >
                    Apply draft ({importDraft.fields.filter((f) => f.accepted).length} accepted)
                  </button>
                </div>
              </>
            )}
          </div>
        </TabPanel>
      )}
      {importTab === 'package' && (
        <TabPanel id="import" tab="package" className="flex flex-col gap-2">
          <label className="field-label" htmlFor="import-package">
            SchemaPackage JSON — must carry schemaVersion "schema-package-v1" plus name, jsonSchema, fields, metadata, examplePayload,
            and formatInstruction. Non-conforming packages are rejected without touching the working schema.
          </label>
          <textarea
            id="import-package"
            className="input input-area mono min-h-28"
            value={packageText}
            onChange={(e) => setPackageText(e.target.value)}
            aria-invalid={packageError ? 'true' : undefined}
            aria-describedby={packageError ? 'import-package-error' : undefined}
          />
          {packageError && (
            <p className="field-error" id="import-package-error" role="alert">
              {packageError}
            </p>
          )}
          <div>
            <button
              type="button"
              className="btn btn-primary tap"
              onClick={() => {
                const r = importPackage();
                if (!r.ok) toast(r.error, 'error');
              }}
            >
              Import package
            </button>
          </div>
        </TabPanel>
      )}
    </div>
  );
}

/* --------------------------------- Drawer -------------------------------- */

export default function Workbench() {
  const drawerTab = useStore((s) => s.drawerTab);
  const setDrawerTab = useStore((s) => s.setDrawerTab);
  const drawerOpen = useStore((s) => s.drawerOpen);
  const setDrawerOpen = useStore((s) => s.setDrawerOpen);

  return (
    <section className="workbench" aria-label="Workbench">
      <div className="flex items-center gap-2 border-b px-3 py-1.5 var-border">
        <Tabs
          id="workbench"
          active={drawerTab}
          onChange={setDrawerTab}
          tabs={[
            { id: 'playground', label: 'Playground' },
            { id: 'versions', label: 'Versions & diff' },
            { id: 'import', label: 'Import' },
          ]}
        />
        <button
          type="button"
          className="icon-btn tap ml-auto"
          aria-label={drawerOpen ? 'Collapse workbench' : 'Expand workbench'}
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(!drawerOpen)}
        >
          {drawerOpen ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronUp size={14} aria-hidden="true" />}
        </button>
      </div>
      {drawerOpen && (
        <div className="workbench-body">
          {drawerTab === 'playground' && <Playground />}
          {drawerTab === 'versions' && <Versions />}
          {drawerTab === 'import' && <ImportPanes />}
        </div>
      )}
    </section>
  );
}
