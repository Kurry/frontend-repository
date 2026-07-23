import React, { useState } from 'react';
import { useStore, WorkflowTaskEditorStateSchema, RunState } from './store';
import { Play, Pause, XCircle, RotateCcw, Save, Upload, Download, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const { editor, runs, dispatchAction } = useStore();
  const [importText, setImportText] = useState('');

  const handleEdit = (path: string[], value: any) => {
    dispatchAction({ type: 'EDIT_FIELD', path, value });
  };

  const handleValidate = () => {
    dispatchAction({ type: 'RUN_VALIDATION' });
  };

  const handleExport = () => {
    const payload = {
      ...editor,
      exportedAt: new Date().toISOString(),
      runs: Object.values(runs)
    };
    try {
      const parsed = WorkflowTaskEditorStateSchema.parse(payload);
      const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workflow-task-${editor.taskSlug}.json`;
      a.click();
    } catch (e) {
      alert('Export failed validation: ' + e);
    }
  };

  const handleImport = () => {
    try {
      const raw = JSON.parse(importText);
      const payload = WorkflowTaskEditorStateSchema.parse(raw);
      dispatchAction({ type: 'IMPORT_STATE', payload });
      setImportText('');
    } catch (e) {
      alert('Malformed import payload: ' + e);
    }
  };

  const handleRunMocked = () => {
    const runId = `run-${Date.now()}`;
    dispatchAction({ type: 'DISPATCH_RUN', runId });

    setTimeout(() => {
      dispatchAction({ type: 'ADD_TOOL_EVENT', runId, event: {
        id: `ev-1-${Date.now()}`, name: 'compile', args: { target: 'all' }, state: 'completed', timestamp: new Date().toISOString()
      }});
    }, 1000);

    setTimeout(() => {
      dispatchAction({ type: 'ADD_TOOL_EVENT', runId, event: {
        id: `ev-2-${Date.now()}`, name: 'deploy_preview', args: {}, state: 'pending', timestamp: new Date().toISOString(), requiresApproval: true
      }});
    }, 2000);
  };

  const activeRun = Object.values(runs)[0] as RunState | undefined;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row h-screen font-sans">
      <div className="w-full md:w-1/2 p-6 border-r border-border overflow-y-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Workflow Task Editor</h1>
          <div className="flex items-center gap-2">
            <button onClick={handleValidate} className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80">
              <CheckCircle2 size={16} /> Validate
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        {editor?.validationReport?.length > 0 && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md flex flex-col gap-2">
            <h3 className="font-semibold flex items-center gap-2"><AlertCircle size={16} /> Validation Errors</h3>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {editor?.validationReport?.map((r, i) => (
                <li key={i}>{r.path}: {r.message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Task Slug</label>
            <input
              type="text"
              value={editor.taskSlug}
              onChange={(e) => handleEdit(['taskSlug'], e.target.value)}
              className="w-full p-2 rounded-md border border-input bg-background text-sm"
              placeholder="e.g. frontend-workflow-task-editor"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">task.toml</label>
            <textarea
              value={editor.task.taskToml}
              onChange={(e) => handleEdit(['task', 'taskToml'], e.target.value)}
              className="w-full p-3 rounded-md border border-input bg-background font-mono text-sm h-32"
              placeholder="[metadata]..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">instruction.md</label>
            <textarea
              value={editor.task.instructionMd}
              onChange={(e) => handleEdit(['task', 'instructionMd'], e.target.value)}
              className="w-full p-3 rounded-md border border-input bg-background font-mono text-sm h-32"
              placeholder="# Task PRD..."
            />
          </div>

          <div className="pt-4 border-t border-border mt-2">
            <label className="block text-sm font-medium mb-1">Import State</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder="Paste JSON here..."
                className="flex-1 p-2 border border-input rounded-md text-sm bg-background"
              />
              <button onClick={handleImport} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm font-medium flex items-center gap-2">
                <Upload size={16} /> Import
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-muted/30">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Run Timeline</h2>
          <button onClick={handleRunMocked} className="flex items-center gap-2 px-3 py-1.5 bg-accent text-accent-foreground rounded-md text-sm font-medium hover:bg-accent/80">
            <Play size={16} /> Run mocked stream
          </button>
        </div>

        {activeRun ? (
          <div className="flex flex-col gap-4">
            <div className="bg-card border border-border rounded-md p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Status</span>
                <div className="font-medium capitalize">{activeRun.status.replace('_', ' ')}</div>
              </div>
              <div className="flex items-center gap-2">
                {activeRun.status === 'running' || activeRun.status === 'starting' || activeRun.status === 'streaming' ? (
                  <button onClick={() => dispatchAction({ type: 'CANCEL_RUN', runId: activeRun.runId })} className="p-2 text-destructive hover:bg-destructive/10 rounded-md" aria-label="Cancel Run">
                    <Pause size={18} />
                  </button>
                ) : null}
                {activeRun.status === 'cancelled' || activeRun.status === 'failed' ? (
                  <button onClick={() => dispatchAction({ type: 'RESUME_RUN', runId: activeRun.runId })} className="p-2 text-primary hover:bg-primary/10 rounded-md" aria-label="Resume Run">
                    <RotateCcw size={18} />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {activeRun.toolEvents.map((evt, idx) => (
                <div key={idx} className="bg-card border border-border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">Tool: {evt.name}</span>
                    <span className="text-xs text-muted-foreground">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <pre className="text-xs text-muted-foreground bg-muted p-2 rounded mb-2 overflow-x-auto">
                    {JSON.stringify(evt.args)}
                  </pre>

                  {activeRun.status === 'awaiting_approval' && activeRun.pendingApprovalEventId === evt.id && (
                    <div className="mt-3 p-3 bg-accent/20 rounded-md border border-accent/30 flex flex-col gap-2">
                      <span className="text-sm font-medium">Requires Approval</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => dispatchAction({ type: 'APPROVE_EVENT', runId: activeRun.runId, eventId: evt.id })}
                          className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-md"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => dispatchAction({ type: 'DENY_EVENT', runId: activeRun.runId, eventId: evt.id, reason: 'User denied' })}
                          className="px-3 py-1.5 bg-destructive text-destructive-foreground text-xs rounded-md"
                        >
                          Deny
                        </button>
                      </div>
                    </div>
                  )}

                  {evt.state === 'approved' && <span className="text-xs text-primary font-medium">Approved</span>}
                  {evt.state === 'denied' && <span className="text-xs text-destructive font-medium">Denied: {evt.error}</span>}
                  {evt.state === 'completed' && <span className="text-xs text-green-600 font-medium">Completed</span>}
                </div>
              ))}
              {activeRun.toolEvents.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">Waiting for events...</div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm">
            No active runs. Dispatch a run to see the timeline.
          </div>
        )}
      </div>
    </div>
  );
}
