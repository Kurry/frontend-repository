import React, { useState, useEffect } from 'react';
import PhotoSequenceCollection from './components/PhotoSequenceCollection';
import HandoffMap from './components/HandoffMap';
import ExportImport from './components/ExportImport';

const INITIAL_STATE = {
  records: [
    { id: '1', title: 'Summer Campaign', status: 'draft', owner: '', handoffState: 'idle' },
    { id: '2', title: 'Product Launch', status: 'ready', owner: 'Alice', handoffState: 'resolved' },
    { id: '3', title: 'Winter Lookbook', status: 'changed', owner: 'Bob', handoffState: 'changed' },
    { id: '4', title: 'Archived Assets', status: 'archived', owner: '', handoffState: 'idle' }
  ],
  derived: {},
  history: []
};

function App() {
  const [state, setState] = useState(INITIAL_STATE);
  const [selectedId, setSelectedId] = useState(null);
  const [undoStack, setUndoStack] = useState([]);

  // Setup global state access for WebMCP
  useEffect(() => {
    window.__APP_STATE = state;
    window.__APP_SET_STATE = (newState) => {
      setState(newState);
    };
    window.__APP_ACTIONS = {
      addRecord: handleAddRecord,
      updateRecord: handleUpdateRecord,
      deleteRecord: handleDeleteRecord,
      updateHandoff: handleHandoffUpdate,
      undo: handleUndo,
      importData: handleImport
    };
  }, [state, undoStack]);

  const saveToHistory = (currentState, eventName) => {
    const newEvent = { timestamp: new Date().toISOString(), event: eventName };
    const nextState = {
      ...currentState,
      history: [...currentState.history, newEvent]
    };
    setUndoStack(prev => [...prev, currentState]);
    setState(nextState);
    return nextState;
  };

  const handleAddRecord = (record) => {
    const nextState = { ...state, records: [...state.records, record] };
    saveToHistory(nextState, `Created record ${record.id}`);
    setSelectedId(record.id);
  };

  const handleUpdateRecord = (id, updates) => {
    const nextState = {
      ...state,
      records: state.records.map(r => r.id === id ? { ...r, ...updates } : r)
    };
    saveToHistory(nextState, `Updated record ${id}`);
  };

  const handleDeleteRecord = (id) => {
    const nextState = {
      ...state,
      records: state.records.filter(r => r.id !== id)
    };
    if (selectedId === id) setSelectedId(null);
    saveToHistory(nextState, `Deleted record ${id}`);
  };

  const handleHandoffUpdate = (id, handoffData) => {
    const { owner, status, handoffState } = handoffData;
    const nextState = {
      ...state,
      records: state.records.map(r => r.id === id ? { ...r, owner, status, handoffState } : r),
      derived: {
        ...state.derived,
        lastHandoffUpdate: new Date().toISOString(),
        lastHandoffOwner: owner
      }
    };
    saveToHistory(nextState, `Handoff mapped for record ${id}`);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setState(previousState);

    // Ensure selectedId is still valid
    if (selectedId && !previousState.records.find(r => r.id === selectedId)) {
      setSelectedId(null);
    }
  };

  const handleImport = (importedData) => {
    setState({
      records: importedData.records,
      derived: importedData.derived || {},
      history: importedData.history || []
    });
    setUndoStack([]);
    setSelectedId(null);
  };

  const artifactData = {
    schemaVersion: "v1",
    exportedAt: new Date().toISOString(),
    records: state.records,
    derived: state.derived,
    history: state.history
  };

  const selectedRecord = state.records.find(r => r.id === selectedId);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      <PhotoSequenceCollection
        records={state.records}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAdd={handleAddRecord}
        onUpdate={handleUpdateRecord}
        onDelete={handleDeleteRecord}
      />
      <HandoffMap
        selectedRecord={selectedRecord}
        onHandoffUpdate={handleHandoffUpdate}
        onUndo={handleUndo}
        canUndo={undoStack.length > 0}
      />
      <ExportImport
        artifactData={artifactData}
        onImport={handleImport}
      />
    </div>
  );
}

export default App;
