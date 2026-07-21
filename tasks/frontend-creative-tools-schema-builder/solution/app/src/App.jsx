// Schema Forge — structured output schema builder workbench.
// Layout: library sidebar · tree editor + workbench · output panes with a
// docked 280px configuration panel. All state flows from one shared tree.
import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Add, Copy, Download, Export, Help, Menu, Moon, Redo, Sun, Undo, Close,
} from '@carbon/icons-react';
import {
  useStore, activeSchema, displayedTree, compiledText, formatText,
} from './store.js';
import { schemaSummary, generateExample, compileSchema, nodeToFieldDef } from './lib.js';
import Sidebar from './Sidebar.jsx';
import TreeEditor from './TreeEditor.jsx';
import ConfigPanel from './ConfigPanel.jsx';
import OutputPanes from './OutputPanes.jsx';
import Workbench from './Workbench.jsx';
import { Modal, Tabs, TabPanel, CodeSurface, Toasts, EmptyState, useDur } from './ui.jsx';

const ONBOARDING = [
  {
    title: 'Edit the schema tree',
    body: 'Add fields on any object, click a name to rename it inline, flip the required switch, drag rows to reorder, and use the nest controls to move a field into the object above it. Every edit updates the compiled draft-07 text, the example payload, and the format instruction in one beat.',
  },
  {
    title: 'Validate payloads in the playground',
    body: 'Paste a JSON payload and run validation: one step per top-level field advances with visible statuses, a live rollup, and a filterable event timeline. Slowdowns retry with a backoff countdown, and results annotate the tree with the exact violated constraint.',
  },
  {
    title: 'Version, diff, and export packages',
    body: 'Save named versions, diff any two with color-coded added, removed, and changed fields, then open Export for the live compiled schema, the SchemaPackage JSON, and the validation report — all round-trippable through Import package.',
  },
];

const SHORTCUTS = [
  { keys: ['Shift', 'A / N / B / O / L'], label: 'Add a string, number, boolean, object, or array field at the root' },
  { keys: ['Ctrl / ⌘', 'Z'], label: 'Undo the last tree mutation' },
  { keys: ['Ctrl / ⌘', 'Shift', 'Z'], label: 'Redo' },
  { keys: ['E'], label: 'Open the Export modal' },
  { keys: ['T'], label: 'Toggle light / dark theme' },
  { keys: ['?'], label: 'Open this shortcut reference' },
];

function Header() {
  const sc = useStore(activeSchema);
  const tree = useStore((s) => (s.schemas.find((x) => x.id === s.activeId) || {}).tree || null);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const theme = useStore((s) => s.theme);
  const setShortcutsOpen = useStore((s) => s.setShortcutsOpen);
  const openExport = useStore((s) => s.openExport);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const copyText = useStore((s) => s.copyText);

  const summary = tree ? schemaSummary(tree) : '';

  return (
    <header className="app-header">
      <button type="button" className="icon-btn tap lg:hidden" aria-label="Open schema library" onClick={() => setSidebarOpen(true)}>
        <Menu size={16} aria-hidden="true" />
      </button>
      <div className="min-w-0">
        <h1 className="app-title">
          Schema Forge
          <span className="app-subtitle">structured output schema builder</span>
        </h1>
        {sc && (
          <button
            type="button"
            className="summary-line"
            onClick={() => copyText(`${sc.name}: ${summary}`, 'schema summary')}
            title="Shareable one-line schema summary — click to copy"
          >
            {summary}
          </button>
        )}
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <button type="button" className="icon-btn tap" aria-label="Keyboard shortcuts (?)" title="Keyboard shortcuts (?)" onClick={() => setShortcutsOpen(true)}>
          <Help size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="icon-btn tap"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        </button>
        <button type="button" className="btn btn-primary tap" onClick={() => openExport('schema')}>
          <Export size={14} aria-hidden="true" /> Export
        </button>
      </div>
    </header>
  );
}

function Toolbar() {
  const sc = useStore(activeSchema);
  const past = sc ? sc.past : [];
  const future = sc ? sc.future : [];
  const viewIndex = useStore((s) => s.viewIndex);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const scrubTo = useStore((s) => s.scrubTo);
  const addField = useStore((s) => s.addField);
  const renameSchema = useStore((s) => s.renameSchema);
  const toast = useStore((s) => s.toast);
  const tree = useStore((s) => (s.schemas.find((x) => x.id === s.activeId) || {}).tree || null);

  const [name, setName] = useState(sc ? sc.name : '');
  useEffect(() => {
    if (sc) setName(sc.name);
  }, [sc?.id, sc?.name]);

  if (!sc) return null;

  const head = past.length;
  const sliderValue = viewIndex === null ? head : viewIndex;
  const sliderLabel = sliderValue === head ? 'Current' : `Before "${past[sliderValue].label}"`;

  function commitName() {
    const r = renameSchema(sc.id, name);
    if (!r.ok) {
      toast(r.error, 'error');
      setName(sc.name);
    }
  }

  return (
    <div className="editor-toolbar">
      <label className="sr-only" htmlFor="schema-name">
        Active schema name
      </label>
      <input
        id="schema-name"
        className="input schema-name-input"
        value={name}
        autoComplete="off"
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        aria-describedby="schema-name-hint"
      />
      <span className="muted hidden text-xs sm:block" id="schema-name-hint">
        {past.length} edit{past.length === 1 ? '' : 's'}
      </span>
      <button
        type="button"
        className="btn btn-primary tap"
        onClick={() => {
          const r = addField(tree ? tree.id : undefined);
          if (!r.ok && r.error !== 'ignored-duplicate') toast(r.error, 'error');
        }}
      >
        <Add size={14} aria-hidden="true" /> Add field
      </button>
      <span className="toolbar-divider" aria-hidden="true" />
      <button
        type="button"
        className="btn btn-ghost tap"
        onClick={undo}
        disabled={!past.length || viewIndex !== null}
        aria-label={past.length ? `Undo ${past[past.length - 1].label}` : 'Undo (nothing to undo)'}
        title={past.length ? `Undo ${past[past.length - 1].label}` : 'Nothing to undo'}
      >
        <Undo size={13} aria-hidden="true" /> {past.length ? `Undo ${past[past.length - 1].label}` : 'Undo'}
      </button>
      <button
        type="button"
        className="btn btn-ghost tap"
        onClick={redo}
        disabled={!future.length || viewIndex !== null}
        aria-label={future.length ? `Redo ${future[future.length - 1].label}` : 'Redo (nothing to redo)'}
        title={future.length ? `Redo ${future[future.length - 1].label}` : 'Nothing to redo'}
      >
        <Redo size={13} aria-hidden="true" /> {future.length ? `Redo ${future[future.length - 1].label}` : 'Redo'}
      </button>
      <div className="history-control">
        <label className="sr-only" htmlFor="history-slider">
          History timeline slider
        </label>
        <input
          id="history-slider"
          type="range"
          className="history-slider"
          min={0}
          max={head}
          step={1}
          value={sliderValue}
          onChange={(e) => scrubTo(Number(e.target.value) === head ? null : Number(e.target.value))}
          aria-valuetext={sliderLabel}
          aria-label="History timeline — scrub through the edit history of the active schema"
        />
        <span className="history-label" role="status">
          {sliderLabel}
        </span>
      </div>
    </div>
  );
}

function ExportModal() {
  const open = useStore((s) => s.exportOpen);
  const closeExport = useStore((s) => s.closeExport);
  const exportTab = useStore((s) => s.exportTab);
  const setExportTab = useStore((s) => s.setExportTab);
  const schemaText = useStore(compiledText);
  const format = useStore(formatText);
  const sc = useStore(activeSchema);
  const tree = useStore(displayedTree);
  const metaFields = useStore((s) => s.metaFields);
  const nonce = useStore((s) => s.exampleNonce);
  const copyText = useStore((s) => s.copyText);
  const downloadText = useStore((s) => s.downloadText);
  const run = useStore((s) => s.run);

  const example = useMemo(
    () => (sc && sc.exampleOverride ? sc.exampleOverride : generateExample(tree || { children: [] })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sc?.exampleOverride, tree, nonce],
  );
  const pkg = useMemo(() => {
    if (!sc || !tree) return null;
    const metadata = {};
    metaFields.forEach((mf) => {
      metadata[mf.label] = String(sc.metaValues[mf.label] ?? '');
    });
    return {
      schemaVersion: 'schema-package-v1',
      name: sc.name,
      jsonSchema: compileSchema(tree, sc.name),
      fields: (tree.children || []).map(nodeToFieldDef),
      metadata,
      examplePayload: example,
      formatInstruction: format,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sc, tree, metaFields, example, format]);
  const report = useMemo(() => {
    if (!run || run.status !== 'done') return null;
    return {
      generatedAt: new Date(run.completedAt).toISOString(),
      schemaName: sc ? sc.name : '',
      payloadSummary: { topLevelFields: run.total, fieldsChecked: run.checked, failures: run.failures },
      perField: run.steps.map((st) => {
        const ann = run.annotations[st.nodeId];
        return {
          path: st.key,
          status: st.status,
          pass: ann ? ann.pass : st.status === 'complete',
          message: st.error || (ann && ann.message) || (st.status === 'complete' ? 'All checks passed' : ''),
        };
      }),
      failureCount: run.failures,
    };
  }, [run, sc]);

  const pkgText = pkg ? JSON.stringify(pkg, null, 2) : '';
  const reportText = report ? JSON.stringify(report, null, 2) : '';
  const reportReady = run && run.status === 'done';

  const texts = { schema: schemaText, package: pkgText, report: reportText };
  const labels = { schema: 'compiled schema', package: 'SchemaPackage JSON', report: 'validation report' };
  const files = { schema: 'schema-forge-schema.json', package: 'schema-forge-package.json', report: 'schema-forge-report.json' };
  const current = reportReady || exportTab !== 'report' ? exportTab : 'schema';

  return (
    <Modal open={open} onClose={closeExport} title="Export" wide>
      <Tabs
        id="export"
        active={current}
        onChange={setExportTab}
        tabs={[
          { id: 'schema', label: 'Compiled schema (draft-07)' },
          { id: 'package', label: 'SchemaPackage JSON' },
          {
            id: 'report',
            label: 'Validation report',
            disabled: !reportReady,
            disabledReason: 'Available after a completed validation run',
          },
        ]}
        className="mb-3"
      />
      <TabPanel id="export" tab={current} className="flex flex-col">
        <p className="muted mb-2 text-xs">
          {current === 'package'
            ? 'Live SchemaPackage contract: schemaVersion "schema-package-v1", name, jsonSchema, fields, metadata, examplePayload, formatInstruction — recompiled from the session on every open.'
            : current === 'report'
              ? 'Payload summary, per-field outcomes, and the failure count from the completed run.'
              : 'The exact draft-07 document any standard validator can consume.'}
        </p>
        <CodeSurface text={texts[current]} label={`${labels[current]} preview`} />
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" className="btn btn-ghost tap" onClick={() => copyText(texts[current], labels[current])}>
            <Copy size={13} aria-hidden="true" /> Copy
          </button>
          <button type="button" className="btn btn-primary tap" onClick={() => downloadText(texts[current], files[current], labels[current])}>
            <Download size={13} aria-hidden="true" /> Download
          </button>
        </div>
      </TabPanel>
    </Modal>
  );
}

function OnboardingModal() {
  const dur = useDur();
  const onboarding = useStore((s) => s.onboarding);
  const onboardingStep = useStore((s) => s.onboardingStep);
  const dismissOnboarding = useStore((s) => s.dismissOnboarding);
  const step = ONBOARDING[onboarding.step];

  return (
    <Modal open={onboarding.open} onClose={dismissOnboarding} title={`Welcome to Schema Forge — ${onboarding.step + 1} of ${ONBOARDING.length}`}>
      <AnimatePresence mode="wait">
        <motion.div key={onboarding.step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: dur.fast }}>
          <h3 className="heading-sub">{step.title}</h3>
          <p className="text-sm leading-relaxed">{step.body}</p>
        </motion.div>
      </AnimatePresence>
      <div className="mt-4 flex items-center gap-2">
        <span className="muted text-xs">
          {onboarding.step + 1} / {ONBOARDING.length}
        </span>
        <span className="ml-auto flex gap-2">
          <button type="button" className="btn btn-ghost tap" onClick={dismissOnboarding}>
            Skip tour
          </button>
          {onboarding.step > 0 && (
            <button type="button" className="btn btn-ghost tap" onClick={() => onboardingStep(onboarding.step - 1)}>
              Back
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary tap"
            onClick={() => (onboarding.step < ONBOARDING.length - 1 ? onboardingStep(onboarding.step + 1) : dismissOnboarding())}
          >
            {onboarding.step < ONBOARDING.length - 1 ? 'Next' : 'Start building'}
          </button>
        </span>
      </div>
    </Modal>
  );
}

function ShortcutsModal() {
  const open = useStore((s) => s.shortcutsOpen);
  const setOpen = useStore((s) => s.setShortcutsOpen);
  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Keyboard shortcuts">
      <ul className="shortcut-list">
        {SHORTCUTS.map((s) => (
          <li key={s.label} className="shortcut-row">
            <span className="flex gap-1">
              {s.keys.map((k) => (
                <kbd key={k} className="kbd">
                  {k}
                </kbd>
              ))}
            </span>
            <span className="text-sm">{s.label}</span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

function ConfirmModal() {
  const confirm = useStore((s) => s.confirm);
  const closeConfirm = useStore((s) => s.closeConfirm);
  const doConfirm = useStore((s) => s.doConfirm);
  return (
    <Modal open={!!confirm} onClose={closeConfirm} title={confirm ? confirm.title : ''} tone={confirm ? confirm.tone : undefined}>
      {confirm && (
        <>
          <p className="text-sm">{confirm.body}</p>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="btn btn-ghost tap" onClick={closeConfirm}>
              Cancel
            </button>
            <button type="button" className={`btn tap ${confirm.tone === 'danger' ? 'btn-danger' : 'btn-primary'}`} onClick={doConfirm}>
              {confirm.confirmLabel}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

export default function App() {
  const theme = useStore((s) => s.theme);
  const toasts = useStore((s) => s.toasts);
  const live = useStore((s) => s.live);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const sc = useStore(activeSchema);
  const newSchema = useStore((s) => s.newSchema);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    function onKey(e) {
      const t = e.target;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (typing) return;
      const s = useStore.getState();
      const overlay = s.exportOpen || s.confirm || s.shortcutsOpen || s.onboarding.open;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        s.undo();
        return;
      }
      if (mod && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        s.redo();
        return;
      }
      if (overlay) return;
      if (e.key === '?') {
        e.preventDefault();
        s.setShortcutsOpen(true);
        return;
      }
      if (e.key.toLowerCase() === 'e') {
        s.openExport('schema');
        return;
      }
      if (e.key.toLowerCase() === 't') {
        s.toggleTheme();
        return;
      }
      if (e.shiftKey) {
        const map = { A: 'string', N: 'number', B: 'boolean', O: 'object', L: 'array' };
        const type = map[e.key.toUpperCase()];
        if (type && s.activeId) {
          e.preventDefault();
          s.setDefaultType(type);
          const tree = s.schemas.find((x) => x.id === s.activeId)?.tree;
          if (tree) {
            const prev = s.defaultType;
            s.addField(tree.id);
            s.setDefaultType(prev);
          }
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app-shell">
      <Header />
      <div className="app-body">
        <aside className={`app-sidebar ${sidebarOpen ? 'app-sidebar-open' : ''}`} aria-label="Schema library" aria-hidden={!sidebarOpen ? undefined : undefined}>
          <div className="flex items-center justify-between border-b px-3 py-2 lg:hidden var-border">
            <span className="heading-panel m-0">Schema library</span>
            <button type="button" className="icon-btn tap" aria-label="Close schema library" onClick={() => setSidebarOpen(false)}>
              <Close size={15} aria-hidden="true" />
            </button>
          </div>
          <Sidebar />
        </aside>
        {sidebarOpen && <div className="sidebar-scrim lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}
        <main className="app-main" aria-label="Schema editor">
          {sc ? (
            <>
              <Toolbar />
              <div className="min-h-0 flex-1">
                <TreeEditor />
              </div>
              <Workbench />
            </>
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <EmptyState title="No schema is loaded">
                <p className="muted mb-3 max-w-md text-sm">
                  Every schema was deleted. Create a blank schema with a root object, or import a SchemaPackage JSON to rebuild the
                  library — no reload needed.
                </p>
                <button type="button" className="btn btn-primary tap" onClick={() => newSchema()}>
                  <Add size={14} aria-hidden="true" /> New schema
                </button>
              </EmptyState>
            </div>
          )}
        </main>
        <section className="app-right" aria-label="Schema output">
          <div className="flex h-full min-h-0 flex-1 flex-col">
            <OutputPanes />
          </div>
          <ConfigPanel />
        </section>
      </div>
      <Toasts toasts={toasts} />
      <span className="sr-only" role="status" aria-live="polite">
        {live}
      </span>
      <ExportModal />
      <OnboardingModal />
      <ShortcutsModal />
      <ConfirmModal />
    </div>
  );
}
