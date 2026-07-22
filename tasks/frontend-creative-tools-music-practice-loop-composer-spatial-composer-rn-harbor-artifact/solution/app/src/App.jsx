import React, { useEffect, useMemo } from 'react';
import { useAppState } from './state';
import { createWebMcpTools } from './webmcp';
import { PracticeSegments } from './components/PracticeSegments';
import { SpatialComposer } from './components/SpatialComposer';
import { ArtifactInspector } from './components/ArtifactInspector';
import { createContractRuntime } from '@zto/webmcp-contracts';
import { useWebMcpContracts } from '@zto/webmcp-contracts/adapters/react';

// Using a module-scoped runtime so tools persist across hot reloads if needed,
// though standard usage usually recreates it.
const runtime = createContractRuntime();

export function App() {
  const state = useAppState();

  const tools = useMemo(() => createWebMcpTools(state), [
    state.records,
    state.selectedRecordId,
    state.history,
    state.derivedSummary
  ]);

  useWebMcpContracts({
    runtime,
    scopeId: 'music-loop-composer',
    tools,
    hooks: { useEffect, useRef: React.useRef },
    deps: [tools],
  });

  return (
    <div className="flex h-screen bg-black text-slate-200 overflow-hidden font-sans">
      <PracticeSegments
        records={state.records}
        selectedRecordId={state.selectedRecordId}
        onSelect={state.setSelectedRecordId}
        onDelete={state.deleteRecord}
      />
      <SpatialComposer
        records={state.records}
        selectedRecordId={state.selectedRecordId}
        onPlace={state.placeRecordInComposer}
        onUndo={state.undo}
        canUndo={state.canUndo}
      />
      <ArtifactInspector
        summary={state.derivedSummary}
        exportError={state.exportError}
        onExport={state.generateExport}
        onImport={state.importSession}
        onClear={state.clearSession}
      />
    </div>
  );
}
