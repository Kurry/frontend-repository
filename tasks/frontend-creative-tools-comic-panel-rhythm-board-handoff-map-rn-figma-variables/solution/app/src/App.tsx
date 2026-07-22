import React, { useState, useEffect, useCallback, useReducer } from 'react';

// Domain Models
type DomainStatus = 'draft' | 'ready' | 'changed' | 'archived';

interface ComicPanel {
  id: string;
  title: string;
  description: string;
  status: DomainStatus;
  handoffOwner?: string;
  readiness?: number;
}

interface RhythmSession {
  schemaVersion: 'v1';
  exportedAt: string;
  records: ComicPanel[];
  derived: {
    summary: {
      total: number;
      ready: number;
      handoffOwners: Record<string, number>;
    };
  };
  history: any[];
}

// Initial Data
const initialPanels: ComicPanel[] = [
  { id: '1', title: 'Panel 1: Intro', description: 'Establishing shot', status: 'draft' },
  { id: '2', title: 'Panel 2: Action', description: 'Hero lands', status: 'ready', handoffOwner: 'Artist A', readiness: 100 },
];

function App() {
  const [panels, setPanels] = useState<ComicPanel[]>(initialPanels);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [history, setHistory] = useState<ComicPanel[][]>([initialPanels]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [filter, setFilter] = useState<DomainStatus | 'all'>('all');
  const [handoffState, setHandoffState] = useState<'idle' | 'selected' | 'changed' | 'conflict' | 'resolved'>('idle');

  // WebMCP Integration
  useEffect(() => {
    (window as any).webmcp_session_info = () => ({
      app: 'Comic Panel Rhythm Board',
      version: '1.0',
    });

    (window as any).webmcp_list_tools = () => [
      { name: 'query_state', description: 'Get current state' },
      { name: 'export_artifact', description: 'Export session' },
      { name: 'import_artifact', description: 'Import session', parameters: { session: 'object' } },
      { name: 'undo', description: 'Undo last action' },
      { name: 'create_panel', description: 'Create a new panel' },
      { name: 'update_panel', description: 'Update a panel', parameters: { id: 'string', updates: 'object' } },
      { name: 'delete_panel', description: 'Delete a panel', parameters: { id: 'string' } },
      { name: 'handoff_mutation', description: 'Connect handoff owner and update readiness', parameters: { id: 'string', owner: 'string', readiness: 'number' } },
    ];

    (window as any).webmcp_invoke_tool = (tool: string, params: any) => {
      if (tool === 'query_state') {
        return JSON.stringify({ panels, selectedPanelId, handoffState });
      }
      if (tool === 'export_artifact') {
        return JSON.stringify(createExportData());
      }
      if (tool === 'import_artifact' && params && params.session) {
        return JSON.stringify(handleImportData(params.session));
      }
      if (tool === 'undo') {
        undo();
        return JSON.stringify({ status: 'success' });
      }
      if (tool === 'create_panel') {
        addPanel();
        return JSON.stringify({ status: 'success' });
      }
      if (tool === 'update_panel' && params && params.id && params.updates) {
        updatePanel(params.id, params.updates);
        return JSON.stringify({ status: 'success' });
      }
      if (tool === 'delete_panel' && params && params.id) {
        deletePanel(params.id);
        return JSON.stringify({ status: 'success' });
      }
      if (tool === 'handoff_mutation' && params && params.id && params.owner && params.readiness !== undefined) {
        handleHandoff(params.id, params.owner, params.readiness);
        return JSON.stringify({ status: 'success' });
      }
      return JSON.stringify({ error: 'Unknown tool or missing params' });
    };
  }, [panels, history, historyIndex, selectedPanelId, handoffState]);

  const updateState = (newPanels: ComicPanel[]) => {
    setPanels(newPanels);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPanels);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPanels(history[historyIndex - 1]);
    }
  };

  const addPanel = () => {
    const newPanel: ComicPanel = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Panel',
      description: '',
      status: 'draft',
    };
    updateState([...panels, newPanel]);
  };

  const updatePanel = (id: string, updates: Partial<ComicPanel>) => {
    const newPanels = panels.map(p => p.id === id ? { ...p, ...updates } : p);
    updateState(newPanels);
  };

  const deletePanel = (id: string) => {
    updateState(panels.filter(p => p.id !== id));
  };

  // Signature Interaction
  const handleHandoff = (id: string, owner: string, readiness: number) => {
    const p = panels.find(p => p.id === id);
    if (!p) return;

    if (readiness < 0 || readiness > 100) {
        setHandoffState('conflict');
        return;
    }

    setHandoffState('changed');
    updatePanel(id, { handoffOwner: owner, readiness, status: readiness >= 100 ? 'ready' : 'changed' });
    setTimeout(() => {
        setHandoffState('resolved');
        setTimeout(() => setHandoffState('selected'), 1000);
    }, 500);
  };

  useEffect(() => {
    if (selectedPanelId) {
        setHandoffState('selected');
    } else {
        setHandoffState('idle');
    }
  }, [selectedPanelId]);

  const createExportData = (): RhythmSession => {
    const derived = {
      summary: {
        total: panels.length,
        ready: panels.filter(p => p.status === 'ready').length,
        handoffOwners: panels.reduce((acc, p) => {
          if (p.handoffOwner) {
            acc[p.handoffOwner] = (acc[p.handoffOwner] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>),
      }
    };
    return {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: panels,
      derived,
      history: history.slice(0, historyIndex + 1),
    };
  };

  const handleExport = () => {
    const data = createExportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comic-rhythm-v1-handoff-map.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    updateState([]);
    setSelectedPanelId(null);
  };

  const validateRecord = (record: any): record is ComicPanel => {
    if (typeof record !== 'object' || record === null) return false;
    if (typeof record.id !== 'string') return false;
    if (typeof record.title !== 'string') return false;
    if (typeof record.description !== 'string') return false;
    if (!['draft', 'ready', 'changed', 'archived'].includes(record.status)) return false;
    if (record.handoffOwner !== undefined && typeof record.handoffOwner !== 'string') return false;
    if (record.readiness !== undefined && (typeof record.readiness !== 'number' || record.readiness < 0 || record.readiness > 100)) return false;
    return true;
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const data = JSON.parse(result);
        handleImportData(data);
      } catch (err) {
        console.error("Invalid import", err);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleImportData = (data: any) => {
    if (data && data.schemaVersion === 'v1' && Array.isArray(data.records)) {
        const uniqueIds = new Set();
        const validRecords = [];
        for (const record of data.records) {
            if (validateRecord(record) && !uniqueIds.has(record.id)) {
                validRecords.push(record);
                uniqueIds.add(record.id);
            } else {
                return { status: 'error', message: 'Validation failed on records' };
            }
        }
        updateState(validRecords);
        return { status: 'success' };
    }
    return { status: 'error', message: 'Invalid schema' };
  }

  const selectedPanel = panels.find(p => p.id === selectedPanelId);
  const filteredPanels = panels.filter(p => filter === 'all' ? true : p.status === filter);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar / Collection */}
      <div className="w-full md:w-1/3 bg-white border-r border-gray-200 p-4 flex flex-col h-screen">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Comic Panels</h1>
          <div className="space-x-2">
             <button onClick={addPanel} className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Add new panel">Add</button>
             <button onClick={undo} disabled={historyIndex === 0} className="bg-gray-200 px-2 py-1 rounded text-sm disabled:opacity-50 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400" aria-label="Undo last action">Undo</button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 sr-only">Filter by Status</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="w-full border border-gray-300 rounded p-2 focus:ring focus:ring-blue-200 focus:border-blue-500"
            aria-label="Filter panels by status"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2" role="list">
          {filteredPanels.length === 0 && <div className="text-gray-500 italic">No panels found.</div>}
          {filteredPanels.map(panel => (
            <button
              key={panel.id}
              onClick={() => setSelectedPanelId(panel.id)}
              className={`w-full text-left p-3 border rounded transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedPanelId === panel.id ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]' : 'border-gray-200 hover:bg-gray-50 scale-100'}`}
              role="listitem"
              aria-current={selectedPanelId === panel.id}
            >
              <div className="font-medium">{panel.title}</div>
              <div className="text-sm text-gray-600">{panel.status}</div>
            </button>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          <button onClick={handleExport} className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500" aria-label="Export Session">Export Session</button>
          <div className="flex space-x-2">
            <button onClick={handleClear} className="w-1/2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500" aria-label="Clear all panels">Clear</button>
            <label className="w-1/2 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 text-center cursor-pointer focus-within:ring-2 focus-within:ring-purple-500">
              Import
              <input type="file" accept=".json" className="sr-only" onChange={handleImport} aria-label="Import Session" />
            </label>
          </div>
        </div>
      </div>

      {/* Main Content / Handoff Map & Detail */}
      <div className="w-full md:w-2/3 p-4 flex flex-col h-screen overflow-y-auto">
        {selectedPanel ? (
          <div className="bg-white rounded-lg shadow p-6 space-y-6 flex-1">
            <h2 className="text-2xl font-bold border-b pb-2">Panel Inspector</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={selectedPanel.title}
                  onChange={e => updatePanel(selectedPanel.id, { title: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded p-2 focus:ring focus:ring-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={selectedPanel.status}
                  onChange={e => updatePanel(selectedPanel.id, { status: e.target.value as DomainStatus })}
                  className="mt-1 w-full border border-gray-300 rounded p-2 focus:ring focus:ring-blue-200 focus:border-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="changed">Changed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Handoff Map Surface */}
            <div className={`p-4 rounded-lg border mt-6 transition-colors duration-300 ${handoffState === 'conflict' ? 'bg-red-50 border-red-200' : handoffState === 'changed' ? 'bg-yellow-50 border-yellow-200' : handoffState === 'resolved' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Handoff Action</h3>
                  <span className={`text-sm font-medium px-2 py-1 rounded ${handoffState === 'conflict' ? 'bg-red-100 text-red-800' : handoffState === 'changed' ? 'bg-yellow-100 text-yellow-800' : handoffState === 'resolved' ? 'bg-green-100 text-green-800' : handoffState === 'selected' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      State: {handoffState}
                  </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assign Owner</label>
                  <input
                    type="text"
                    placeholder="e.g. Artist A"
                    value={selectedPanel.handoffOwner || ''}
                    onChange={e => handleHandoff(selectedPanel.id, e.target.value, selectedPanel.readiness || 0)}
                    className="mt-1 w-full border border-gray-300 rounded p-2 focus:ring focus:ring-purple-200 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Readiness ({selectedPanel.readiness || 0}%)</label>
                  <input
                    type="range"
                    min="0" max="100"
                    value={selectedPanel.readiness || 0}
                    onChange={e => handleHandoff(selectedPanel.id, selectedPanel.handoffOwner || 'Unassigned', parseInt(e.target.value))}
                    className="w-full mt-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <button onClick={() => deletePanel(selectedPanel.id)} className="text-red-500 hover:text-red-700 font-medium text-sm mt-4 focus:outline-none focus:underline" aria-label="Delete Panel">
              Delete Panel
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a panel to inspect or edit.
          </div>
        )}

        {/* Derived Summary View */}
        <div className="mt-4 bg-white rounded-lg shadow p-4 border-t-4 border-blue-500">
            <h3 className="font-semibold text-gray-800 mb-2">Derived Summary</h3>
            <div className="flex space-x-8 text-sm">
                <div>Total Panels: <span className="font-bold">{panels.length}</span></div>
                <div>Ready Panels: <span className="font-bold text-green-600">{panels.filter(p => p.status === 'ready').length}</span></div>
                <div>Unique Owners: <span className="font-bold text-purple-600">{new Set(panels.map(p => p.handoffOwner).filter(Boolean)).size}</span></div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default App;
