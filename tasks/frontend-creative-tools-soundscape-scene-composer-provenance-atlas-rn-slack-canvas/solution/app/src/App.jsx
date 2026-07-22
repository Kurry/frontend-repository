import React, { useState, useEffect, useCallback } from "react";
import LayersList from "./LayersList";
import ProvenanceAtlas from "./ProvenanceAtlas";
import ExportImport from "./ExportImport";
import { registerTools } from "./WebMCP";

const DEFAULT_STATE = {
  schemaVersion: "soundscape-scene-v1",
  exportedAt: null,
  records: [
    {
      id: "layer-1",
      name: "City Ambience Base",
      volume: 80,
      status: "ready",
      provenanceAtlasState: {
        nodes: [
          { id: "n1", name: "Mic 1 (Traffic)", status: "clean", source: "field_recorder_a" },
          { id: "n2", name: "Mic 2 (Pedestrians)", status: "clean", source: "field_recorder_b" }
        ]
      },
      createdAt: new Date().toISOString()
    },
    {
      id: "layer-2",
      name: "Wind Overtones",
      volume: 45,
      status: "draft",
      provenanceAtlasState: {
        nodes: [
          { id: "n3", name: "Synth Pad", status: "clean", source: "vst_omnisphere" },
          { id: "n4", name: "Noise Layer", status: "quarantined", source: "unknown_origin" }
        ]
      },
      createdAt: new Date().toISOString()
    }
  ],
  derived: {
    summary: { totalLayers: 2, totalQuarantinedNodes: 1, conflictLayers: 0 }
  },
  history: []
};

// Ensure derived matches records
const recalculateDerived = (records) => {
  let quarantinedNodes = 0;
  let conflicts = 0;
  records.forEach(r => {
    if (r.status === "conflict") conflicts++;
    r.provenanceAtlasState.nodes.forEach(n => {
      if (n.status === "quarantined") quarantinedNodes++;
    });
  });
  return {
    summary: {
      totalLayers: records.length,
      totalQuarantinedNodes: quarantinedNodes,
      conflictLayers: conflicts
    }
  };
};

export default function App() {
  const [state, setState] = useState(() => {
    const s = { ...DEFAULT_STATE, history: [], selectedRecordId: null };
    s.derived = recalculateDerived(s.records);
    return s;
  });




  const saveToHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      history: [...(prev.history || []), JSON.stringify({ records: prev.records, derived: prev.derived, selectedRecordId: prev.selectedRecordId })]
    }));
  }, []);

  const undoLastAction = useCallback(() => {
    setState(prev => {
      const hist = prev.history || [];
      if (hist.length > 0) {
        const lastState = JSON.parse(hist[hist.length - 1]);

        let newSelection = lastState.selectedRecordId;
        if (newSelection && !lastState.records.find(r => r.id === newSelection)) {
          newSelection = null;
        }

        return {
          ...prev,
          records: lastState.records,
          derived: lastState.derived,
          selectedRecordId: newSelection,
          history: hist.slice(0, hist.length - 1)
        };
      }
      return prev;
    });
    return true;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        undoLastAction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoLastAction]);


  const setSelectedRecordId = (id) => {
    setState(prev => ({ ...prev, selectedRecordId: id }));
  };

  const mutateRecords = (newRecords) => {
    saveToHistory();
    setState(prev => ({
      ...prev,
      records: newRecords,
      derived: recalculateDerived(newRecords)
    }));
  };

  const handleImport = (importedState) => {
    saveToHistory();
    setState(prev => ({
      ...importedState,
      history: importedState.history || [],
      selectedRecordId: importedState.selectedRecordId || null
    }));
  };

  const quarantineLineage = (recordId, nodeId) => {
    saveToHistory();
    setState(prev => {
      const newRecords = prev.records.map(r => {
        if (r.id === recordId) {
          const newNodes = r.provenanceAtlasState.nodes.map(n =>
            n.id === nodeId ? { ...n, status: "quarantined" } : n
          );
          return {
            ...r,
            status: "conflict", // Auto-upgrade to conflict on quarantine
            provenanceAtlasState: { ...r.provenanceAtlasState, nodes: newNodes }
          };
        }
        return r;
      });
      return {
        ...prev,
        records: newRecords,
        derived: recalculateDerived(newRecords)
      };
    });
  };

  // Register WebMCP
  useEffect(() => {
    registerTools({
      get_session_state: () => state,
      import_session: ({ session }) => handleImport(session),
      quarantine_lineage: ({ recordId, nodeId }) => quarantineLineage(recordId, nodeId),
      undo_last_action: () => undoLastAction()
    });
  }, [state, undoLastAction]);

  const selectedRecord = state.records.find(r => r.id === selectedRecordId);

  return (
    <div className="flex flex-col h-screen overflow-hidden lg:flex-row">
      <header className="lg:hidden p-4 bg-white border-b border-[var(--border)] flex justify-between items-center shrink-0">
        <h1 className="text-xl font-bold">Soundscape Composer</h1>
        <ExportImport state={state} onImport={handleImport} />
      </header>

      {/* Layers List */}
      <div className="flex-1 lg:w-1/3 min-w-[300px] border-r border-[var(--border)] bg-white overflow-y-auto flex flex-col">
        <div className="hidden lg:flex p-4 border-b border-[var(--border)] justify-between items-center shrink-0">
          <h1 className="text-xl font-bold truncate">Soundscape Composer</h1>
          <ExportImport state={state} onImport={handleImport} />
        </div>
        <LayersList
          records={state.records}
          onMutate={mutateRecords}
          selectedRecordId={selectedRecordId}
          onSelect={setSelectedRecordId}
        />
      </div>

      {/* Provenance Atlas */}
      <div className="flex-[2] flex flex-col bg-[var(--canvas-bg)] overflow-hidden">
        {selectedRecord ? (
          <ProvenanceAtlas
            record={selectedRecord}
            onQuarantine={(nodeId) => quarantineLineage(selectedRecord.id, nodeId)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
            <p>Select a sound layer to view its Provenance Atlas.</p>
          </div>
        )}
      </div>

      {/* Derived Summary Panel */}
      <div className="lg:w-64 w-full bg-white border-t lg:border-t-0 lg:border-l border-[var(--border)] shrink-0 overflow-y-auto">
        <div className="p-4">
          <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-[var(--text-muted)]">Derived Summary</h2>
          <div className="space-y-4">
            <div className="bg-[var(--canvas-bg)] p-3 rounded border border-[var(--border)]">
              <div className="text-2xl font-bold">{state.derived.summary.totalLayers}</div>
              <div className="text-xs text-[var(--text-muted)] uppercase">Total Layers</div>
            </div>
            <div className="bg-[var(--canvas-bg)] p-3 rounded border border-[var(--border)]">
              <div className="text-2xl font-bold">{state.derived.summary.totalQuarantinedNodes}</div>
              <div className="text-xs text-[var(--text-muted)] uppercase">Quarantined Nodes</div>
            </div>
            <div className="bg-[var(--canvas-bg)] p-3 rounded border border-[var(--border)]">
              <div className="text-2xl font-bold text-[var(--danger)]">{state.derived.summary.conflictLayers}</div>
              <div className="text-xs text-[var(--danger)] uppercase">Conflict Layers</div>
            </div>
          </div>
          <div className="mt-8">
            <button
              onClick={undoLastAction}
              disabled={history.length === 0}
              className="w-full py-2 px-4 bg-gray-200 disabled:opacity-50 hover:bg-gray-300 rounded text-sm font-medium transition-colors"
            >
              Undo (Ctrl+Z)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
