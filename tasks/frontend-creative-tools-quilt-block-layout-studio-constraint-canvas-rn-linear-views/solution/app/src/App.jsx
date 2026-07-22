import React, { useState } from 'react';
import { ConstraintCanvas } from './components/ConstraintCanvas';
import { Inspector } from './components/Inspector';
import { LinearView } from './components/LinearView';
import { ExportImport } from './components/ExportImport';
import { useStore } from './store/useStore';

export default function App() {
  const [showExportImport, setShowExportImport] = useState(false);
  const { undo, getDerivedState, setSelectedRecord } = useStore();
  const derived = getDerivedState();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-gray-900 text-white flex items-center justify-between px-4 shrink-0">
        <h1 className="font-bold text-lg">Quilt Block Layout Studio</h1>
        <div className="flex gap-2">
          <button onClick={() => setSelectedRecord('new')} className="px-3 py-1 bg-primary rounded hover:bg-primary-dark transition text-sm font-medium">New Block</button>
          <button onClick={undo} className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition text-sm font-medium">Undo</button>
          <button onClick={() => setShowExportImport(true)} className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition text-sm font-medium">Export / Import</button>
        </div>
      </header>

      {/* Derived Summary Bar */}
      <div className="h-8 bg-gray-100 border-b flex items-center px-4 text-xs text-gray-600 shrink-0 gap-4 font-mono">
        <span className="font-bold">{derived.summary}</span>
        <span>Drafts: {derived.totalDrafts}</span>
        <span>Ready: {derived.totalReady}</span>
        <span>Changed: {derived.totalChanged}</span>
        <span>Conflicts: {derived.totalConflicts}</span>
        <span>Resolved: {derived.totalResolved}</span>
        <span>Archived: {derived.totalArchived}</span>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
        {/* Left sidebar: Linear View */}
        <div className="w-full md:w-64 h-1/3 md:h-full shrink-0 border-b md:border-r border-gray-200 bg-white">
          <LinearView />
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 h-1/3 md:h-full overflow-hidden bg-gray-50 relative p-4 flex flex-col">
          <ConstraintCanvas />
        </div>

        {/* Right sidebar: Inspector */}
        <div className="w-full md:w-80 h-1/3 md:h-full shrink-0 border-t md:border-l border-gray-200 bg-white shadow-xl md:shadow-none z-10">
          <Inspector />
        </div>
      </div>

      {showExportImport && <ExportImport onClose={() => setShowExportImport(false)} />}
    </div>
  );
}
