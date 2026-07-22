import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ShieldAlert, Database, Search, FileJson, RotateCcw, Plus, Archive, Edit3, Trash2,
  FileDigit, FileBox, Crosshair, CheckCircle2, AlertTriangle, Layers
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const styles = {
    draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    ready: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    changed: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    archived: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    conflict: 'bg-red-500/20 text-red-400 border-red-500/30',
    resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  return (
    <span className={`px-2 py-0.5 text-xs rounded-full border ${styles[status] || styles.draft} uppercase tracking-wider font-medium`}>
      {status}
    </span>
  );
};

const ProvenanceAtlasNode = ({ record, onQuarantine, reducedMotion }) => {
  if (!record) return null;

  return (
    <motion.div
      layout={!reducedMotion}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`p-6 rounded-xl border ${record.status === 'conflict' ? 'border-red-500/50 bg-red-500/10' : 'border-border bg-card'}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold mb-1 flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Provenance Node: {record.title}
          </h3>
          <p className="text-sm text-muted-foreground font-mono">ID: {record.id}</p>
        </div>
        <StatusBadge status={record.status} />
      </div>

      <div className="space-y-4">
        <div className="bg-background/50 p-4 rounded-lg border border-border/50">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Lineage Status</h4>
          <div className="flex items-center gap-2">
            {record.lineage === 'clean' ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            )}
            <span className="font-medium capitalize">{record.lineage}</span>
          </div>
        </div>

        {record.evidence && record.evidence.length > 0 && (
          <div className="bg-background/50 p-4 rounded-lg border border-border/50">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Evidence Trail</h4>
            <ul className="space-y-2 text-sm font-mono">
              {record.evidence.map((ev, idx) => (
                <li key={idx} className="flex gap-2 text-red-400">
                  <Crosshair className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>[{new Date(ev.timestamp).toLocaleTimeString()}] Source: {ev.source}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-border flex justify-end">
        <button
          onClick={() => onQuarantine(record.id, 'Manual Analyst Trace')}
          disabled={record.status === 'conflict'}
          className="flex items-center gap-2 px-4 py-2 bg-destructive/20 hover:bg-destructive/30 text-destructive-foreground rounded-lg transition-colors border border-destructive/50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Trace and Quarantine Bad Lineage"
        >
          <ShieldAlert className="w-4 h-4" />
          Trace & Quarantine Lineage
        </button>
      </div>
    </motion.div>
  );
};

export default function App() {
  const {
    records,
    derived,
    activeRecordId,
    filterStatus,
    setActiveRecordId,
    setFilterStatus,
    addRecord,
    updateRecord,
    deleteRecord,
    quarantineLineage,
    undo,
    exportState,
    importState
  } = useStore();

  const reducedMotion = useReducedMotion();
  const activeRecord = records.find(r => r.id === activeRecordId);

  const filteredRecords = records.filter(r => filterStatus === 'all' || r.status === filterStatus);

  const handleExport = () => {
    const data = exportState();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scenario-builder-v1-provenance-atlas.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.schemaVersion === 'scenario-builder-v1') {
          importState(data);
        } else {
          alert('Invalid schema version');
        }
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground font-sans selection:bg-primary/30">

      {/* Left Sidebar: Collection Management */}
      <aside className="w-full md:w-80 lg:w-96 border-r border-border bg-card/50 flex flex-col h-[50vh] md:h-screen shrink-0">
        <div className="p-4 border-b border-border flex justify-between items-center bg-card">
          <h1 className="font-bold text-lg flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Scenario Builder
          </h1>
          <button
            onClick={() => addRecord({})}
            className="p-2 hover:bg-secondary rounded-lg transition-colors text-primary"
            aria-label="Add new record"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-border space-y-3 bg-card/80">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter scenarios..."
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {['all', 'draft', 'ready', 'conflict', 'resolved'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 text-xs rounded-full border capitalize whitespace-nowrap transition-colors ${
                  filterStatus === status
                    ? 'bg-primary/20 border-primary/50 text-primary-foreground'
                    : 'bg-transparent border-border hover:border-muted-foreground text-muted-foreground'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <AnimatePresence>
            {filteredRecords.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center p-8 text-muted-foreground text-sm"
              >
                No records found. Create one or change filters.
              </motion.div>
            ) : (
              filteredRecords.map((record) => (
                <motion.div
                  key={record.id}
                  layout={!reducedMotion}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    onClick={() => setActiveRecordId(record.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      activeRecordId === record.id
                        ? 'bg-secondary border-primary/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                        : 'bg-transparent border-transparent hover:bg-secondary/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium truncate pr-2">{record.title}</span>
                      <StatusBadge status={record.status} />
                    </div>
                    <div className="text-xs text-muted-foreground font-mono truncate">
                      {record.id.split('-')[0]}...
                    </div>
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[50vh] md:h-screen min-w-0">

        {/* Top Toolbar */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={undo}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary"
              aria-label="Undo last action"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Undo</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary cursor-pointer border border-border">
              <FileBox className="w-4 h-4" />
              <span className="hidden sm:inline">Import</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-md border border-primary/20"
            >
              <FileJson className="w-4 h-4" />
              <span className="hidden sm:inline">Export Artifact</span>
            </button>
          </div>
        </header>

        {/* Workspace Canvas */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background relative">
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Derived Summary Panel */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Total Records</div>
                <div className="text-2xl font-bold">{derived.summary.total}</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Ready</div>
                <div className="text-2xl font-bold text-blue-400">{derived.summary.ready}</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Conflicts</div>
                <div className="text-2xl font-bold text-red-400">{derived.summary.conflict}</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Resolved</div>
                <div className="text-2xl font-bold text-green-400">{derived.summary.resolved}</div>
              </div>
            </div>

            {/* Primary Surface: Provenance Atlas Interaction */}
            {activeRecord ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Edit Form */}
                <div className="space-y-4 bg-card border border-border p-6 rounded-xl">
                  <h3 className="text-lg font-medium border-b border-border pb-2 mb-4">Edit Record</h3>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Title</label>
                    <input
                      type="text"
                      value={activeRecord.title}
                      onChange={(e) => updateRecord(activeRecord.id, { title: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Description</label>
                    <textarea
                      value={activeRecord.description}
                      onChange={(e) => updateRecord(activeRecord.id, { description: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 min-h-[100px] focus:outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Status</label>
                    <select
                      value={activeRecord.status}
                      onChange={(e) => updateRecord(activeRecord.id, { status: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                    >
                      <option value="draft">Draft</option>
                      <option value="ready">Ready</option>
                      <option value="changed">Changed</option>
                      <option value="archived">Archived</option>
                      <option value="conflict">Conflict</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-border flex justify-end">
                    <button
                      onClick={() => deleteRecord(activeRecord.id)}
                      className="text-muted-foreground hover:text-destructive flex items-center gap-2 text-sm px-3 py-1.5 rounded-md hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Provenance Atlas Node */}
                <div className="relative">
                  {/* Decorative connection line for visual thesis */}
                  <div className="hidden lg:block absolute top-1/2 -left-8 w-8 border-t-2 border-dashed border-border/50"></div>

                  <AnimatePresence mode="wait">
                    <ProvenanceAtlasNode
                      key={activeRecord.id}
                      record={activeRecord}
                      onQuarantine={quarantineLineage}
                      reducedMotion={reducedMotion}
                    />
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                <FileDigit className="w-12 h-12 mb-4 opacity-50" />
                <p>Select a scenario record to inspect its provenance atlas.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
