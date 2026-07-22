import React, { useState, useEffect } from 'react';
import {
  PlantRecord,
  ProvenanceAtlasState,
  HistoryEvent,
  IndoorPlantGrowthJournalSession,
  initialRecords,
  calculateDerivedState
} from './store';
import { PlantObservations } from './components/PlantObservations';
import { ProvenanceAtlas } from './components/ProvenanceAtlas';
import { ExportImport } from './components/ExportImport';
import { Leaf } from 'lucide-react';

function App() {
  const [records, setRecords] = useState<PlantRecord[]>(initialRecords);
  const [atlasState, setAtlasState] = useState<ProvenanceAtlasState>({ selectedRecordId: null, mode: 'idle' });
  const [history, setHistory] = useState<HistoryEvent[]>([]);

  const addHistory = (action: string, recordId?: string, previousState?: any) => {
    setHistory(prev => [...prev, {
      id: `EVT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      recordId,
      previousState
    }]);
  };

  const handleAddRecord = (record: PlantRecord) => {
    setRecords(prev => [...prev, record]);
    addHistory('create', record.id, null);
  };

  const handleEditRecord = (record: PlantRecord) => {
    setRecords(prev => {
      const oldRecord = prev.find(r => r.id === record.id);
      addHistory('update', record.id, oldRecord);
      return prev.map(r => r.id === record.id ? record : r);
    });
  };

  const handleDeleteRecord = (id: string) => {
    if (!window.confirm(`Are you sure you want to delete ${id}?`)) return;
    setRecords(prev => {
      const oldRecord = prev.find(r => r.id === id);
      addHistory('delete', id, oldRecord);
      return prev.filter(r => r.id !== id);
    });
    if (atlasState.selectedRecordId === id) {
      setAtlasState({ selectedRecordId: null, mode: 'idle' });
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastEvent = history[history.length - 1];

    if (lastEvent.action === 'update' && lastEvent.recordId && lastEvent.previousState) {
      setRecords(prev => prev.map(r => r.id === lastEvent.recordId ? lastEvent.previousState : r));
    } else if (lastEvent.action === 'create' && lastEvent.recordId) {
      setRecords(prev => prev.filter(r => r.id !== lastEvent.recordId));
      if (atlasState.selectedRecordId === lastEvent.recordId) {
        setAtlasState({ selectedRecordId: null, mode: 'idle' });
      }
    } else if (lastEvent.action === 'delete' && lastEvent.recordId && lastEvent.previousState) {
      setRecords(prev => [...prev, lastEvent.previousState]);
    }

    setHistory(prev => prev.slice(0, -1));
  };

  const handleExport = (): IndoorPlantGrowthJournalSession => {
    return {
      schemaVersion: 'plant-growth-v1',
      exportedAt: new Date().toISOString(),
      records,
      derived: calculateDerivedState(records),
      history
    };
  };

  const handleImport = (session: IndoorPlantGrowthJournalSession) => {
    setRecords(session.records);
    setHistory(session.history || []);
    setAtlasState({ selectedRecordId: null, mode: 'idle' });
  };

  const handleClear = () => {
    setRecords([]);
    setHistory([]);
    setAtlasState({ selectedRecordId: null, mode: 'idle' });
  };

  useEffect(() => {
    (window as any).__appState = {
      records,
      setRecords,
      history,
      setHistory,
      atlasState,
      setAtlasState,
      handleAddRecord,
      handleEditRecord,
      handleDeleteRecord,
      handleExport,
      handleImport
    };
  }, [records, history, atlasState]);

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden text-gray-900 font-sans">
      <header className="bg-green-800 text-white p-4 shadow-md z-10 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Leaf size={24} />
          <h1 className="text-xl font-bold tracking-wide">Indoor Plant Growth Journal</h1>
        </div>
        <div className="text-sm font-medium opacity-90 flex gap-4">
          <span>Total: {records.length}</span>
          <span>Ready: {calculateDerivedState(records).readyCount}</span>
          <span>Quarantined: {calculateDerivedState(records).quarantinedCount}</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div className="w-full md:w-1/3 lg:w-1/4 h-1/2 md:h-full flex flex-col z-10 shadow-lg">
          <div className="flex-1 overflow-hidden">
            <PlantObservations
              records={records}
              onAddRecord={handleAddRecord}
              onEditRecord={handleEditRecord}
              onDeleteRecord={handleDeleteRecord}
              selectedRecordId={atlasState.selectedRecordId}
              onSelectRecord={(id) => setAtlasState({ selectedRecordId: id, mode: id ? 'selected' : 'idle' })}
            />
          </div>
          <ExportImport
            onExport={handleExport}
            onImport={handleImport}
            onClear={handleClear}
          />
        </div>

        <div className="w-full md:w-2/3 lg:w-3/4 h-1/2 md:h-full z-0">
          <ProvenanceAtlas
            records={records}
            atlasState={atlasState}
            onAtlasStateChange={setAtlasState}
            onUpdateRecord={handleEditRecord}
            canUndo={history.length > 0}
            onUndo={handleUndo}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
