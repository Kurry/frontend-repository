import React, { useState, useEffect, useCallback } from 'react';
import PracticeSegments from './components/PracticeSegments';
import ReplayTimeline from './components/ReplayTimeline';
import { exportSession, validateImport } from './utils/artifact';
import { registerWebMCP } from './utils/webmcp';
import { Download, Upload, Undo2 } from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);

const INITIAL_STATE = {
  schemaVersion: 'v1',
  records: [
    { id: generateId(), name: 'Intro Riff', duration: 30, status: 'ready', checkpoint: 0 },
    { id: generateId(), name: 'Verse 1 Rhythm', duration: 120, status: 'empty', checkpoint: 0 },
    { id: generateId(), name: 'Bridge Transition', duration: 45, status: 'draft', checkpoint: 15 },
    { id: generateId(), name: 'Solo Section', duration: 60, status: 'changed', checkpoint: 30 },
    { id: generateId(), name: 'Outro Conflict', duration: 40, status: 'conflict', checkpoint: -5 },
  ],
  derived: {
    totalDuration: 255,
    readyCount: 1,
  },
  history: [],
};

export default function App() {
  const [state, setState] = useState(INITIAL_STATE);
  const [selectedId, setSelectedId] = useState(null);
  const [timelineStatus, setTimelineStatus] = useState('idle');

  useEffect(() => {
    setState(prev => {
      const derived = {
        totalDuration: prev.records.reduce((acc, r) => acc + (r.duration || 0), 0),
        readyCount: prev.records.filter(r => r.status === 'ready').length,
        lastUpdated: new Date().toISOString()
      };
      if (JSON.stringify(prev.derived) !== JSON.stringify(derived)) {
        return { ...prev, derived };
      }
      return prev;
    });
  }, [state.records]);

  const stateRef = React.useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const getState = useCallback(() => stateRef.current, []);

  const actions = React.useMemo(() => ({
    createRecord: () => {
      const newRecord = { id: generateId(), name: 'New Segment', duration: 60, status: 'empty', checkpoint: 0 };
      setState(prev => ({
        ...prev,
        records: [...prev.records, newRecord],
        history: [...prev.history, { type: 'create', record: newRecord }]
      }));
      return newRecord;
    },
    selectRecord: (id) => setSelectedId(id),
    updateRecord: (id, updates) => {
      setState(prev => {
        const oldRecord = prev.records.find(r => r.id === id);
        if (!oldRecord) return prev;

        const newRecords = prev.records.map(r =>
          r.id === id ? { ...r, ...updates } : r
        );

        return {
          ...prev,
          records: newRecords,
          history: [...prev.history, { type: 'update', id, previous: oldRecord, current: { ...oldRecord, ...updates } }]
        };
      });
    },
    deleteRecord: (id) => {
      setState(prev => {
        const oldRecord = prev.records.find(r => r.id === id);
        return {
          ...prev,
          records: prev.records.filter(r => r.id !== id),
          history: [...prev.history, { type: 'delete', record: oldRecord }]
        };
      });
      setSelectedId(curr => curr === id ? null : curr);
    },
    importSession: (payload) => {
      if (validateImport(payload)) {
        setState({
          schemaVersion: payload.schemaVersion,
          records: payload.records,
          derived: payload.derived,
          history: payload.history,
          exportedAt: new Date().toISOString()
        });
        setSelectedId(null);
        return true;
      }
      return false;
    },
    undo: () => {
      setState(prev => {
        if (prev.history.length === 0) return prev;
        const lastAction = prev.history[prev.history.length - 1];
        const newHistory = prev.history.slice(0, -1);
        let newRecords = [...prev.records];

        if (lastAction.type === 'create') {
          newRecords = newRecords.filter(r => r.id !== lastAction.record.id);
          setSelectedId(curr => curr === lastAction.record.id ? null : curr);
        } else if (lastAction.type === 'update') {
          newRecords = newRecords.map(r => r.id === lastAction.id ? lastAction.previous : r);
        } else if (lastAction.type === 'delete') {
          newRecords.push(lastAction.record);
        }

        return { ...prev, records: newRecords, history: newHistory };
      });
    }
  }), []);

  useEffect(() => {
    registerWebMCP(getState, actions);
  }, [getState, actions]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        actions.undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);

  const handleExport = () => exportSession(stateRef.current);

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (!actions.importSession(data)) {
            alert('Invalid session artifact');
          }
        } catch (e) {
          alert('Failed to parse JSON');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const selectedRecord = state.records.find(r => r.id === selectedId);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="h-14 border-b border-border bg-card px-4 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold italic">
            L
          </div>
          <h1 className="font-semibold tracking-tight">Loop Composer</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={actions.undo}
            disabled={state.history.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors disabled:opacity-50 hover:bg-muted text-muted-foreground hover:text-foreground"
            aria-label="Undo last action"
          >
            <Undo2 size={16} /> <span className="hidden sm:inline">Undo</span>
          </button>
          <div className="w-px h-6 bg-border mx-1"></div>
          <button
            onClick={handleImport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors hover:bg-muted font-medium"
          >
            <Upload size={16} /> <span className="hidden sm:inline">Import</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-sm"
          >
            <Download size={16} /> <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col md:flex-row p-4 gap-4">
        <aside className="w-full md:w-80 lg:w-96 shrink-0 h-[40vh] md:h-full">
          <PracticeSegments
            records={state.records}
            selectedId={selectedId}
            onSelect={actions.selectRecord}
            onCreate={actions.createRecord}
            onUpdate={actions.updateRecord}
            onDelete={actions.deleteRecord}
          />
        </aside>

        <section className="flex-1 h-full min-w-0 flex flex-col">
          <ReplayTimeline
            record={selectedRecord}
            onUpdate={actions.updateRecord}
            stateStatus={timelineStatus}
            setStateStatus={setTimelineStatus}
          />
        </section>
      </main>
    </div>
  );
}
