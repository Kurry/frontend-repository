import React, { useEffect, useState } from 'react';
import { StoreProvider, useStore } from './store';
import { registerWebMCPTools } from './WebMCP';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

function Header() {
  const { state, dispatch } = useStore();

  const handleExport = () => {
    const data = {
      schemaVersion: state.schemaVersion,
      exportedAt: new Date().toISOString(),
      records: state.records,
      derived: state.derived,
      history: state.history,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'air-quality-v1-spatial-composer.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Artifact exported');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        import('./store').then(({ validateData }) => {
          if (!validateData(data)) {
            toast.error('Invalid schema version, missing records, or missing derived state');
            return;
          }

          dispatch({ type: 'IMPORT_DATA', payload: data });
          toast.success('Artifact imported successfully');
        });
      } catch (err) {
        toast.error('Malformed import');
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (!['input', 'textarea'].includes(document.activeElement?.tagName.toLowerCase())) {
          e.preventDefault();
          dispatch({ type: 'UNDO' });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Home Air Quality Trendbook</h1>
        <p className="text-sm text-gray-500">Spatial Composer — Custom Artifact Provenance</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => dispatch({ type: 'CLEAR_STATE' })}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Clear
        </button>
        <button
          onClick={() => dispatch({ type: 'UNDO' })}
          disabled={state.history.length === 0}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Undo
        </button>
        <div>
          <label className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 inline-block">
            Import JSON
            <input type="file" accept=".json" onChange={handleImport} className="sr-only" />
          </label>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Export
        </button>
      </div>
    </header>
  );
}

function Collection() {
  const { state, dispatch } = useStore();
  const [filter, setFilter] = useState('all');

  const filteredRecords = filter === 'all'
    ? state.records
    : state.records.filter(r => r.status === filter);

  const getStatusColor = (status) => {
    switch(status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'empty': return 'bg-gray-100 text-gray-800';
      case 'changed': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Readings Collection</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All Statuses</option>
          <option value="ready">Ready</option>
          <option value="draft">Draft</option>
          <option value="empty">Empty</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {filteredRecords.map(record => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={() => dispatch({ type: 'SELECT_RECORD', payload: record.id })}
              className={`p-3 border rounded-md cursor-pointer transition-colors ${
                state.derived.selectedRecordId === record.id
                  ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-gray-900 truncate pr-2">{record.name}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(record.status)}`}>
                  {record.status}
                </span>
              </div>
              <div className="flex justify-between items-end">
                <div className="text-2xl font-semibold text-gray-700">
                  {record.value} <span className="text-sm font-normal text-gray-500">{record.type}</span>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredRecords.length === 0 && (
            <div className="text-center py-8 text-gray-500">No records found.</div>
          )}
        </AnimatePresence>
      </div>
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => dispatch({
            type: 'CREATE_RECORD',
            payload: { name: 'New Sensor', value: 0, status: 'draft', type: 'PM2.5' }
          })}
          className="w-full px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-transparent rounded-md hover:bg-primary-100"
        >
          Add Record
        </button>
      </div>
    </div>
  );
}

function DetailPanel() {
  const { state, dispatch } = useStore();
  const record = state.records.find(r => r.id === state.derived.selectedRecordId);

  const [formData, setFormData] = useState(record || {});
  const [error, setError] = useState(null);

  useEffect(() => {
    setFormData(record || {});
    setError(null);
  }, [record]);

  if (!record) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 flex items-center justify-center h-full text-gray-500">
        Select a record to edit
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    let validationError = null;

    if (name === 'value') {
      newValue = Number(value);
      if (newValue < 0 || newValue > 500) {
        validationError = "Value must be between 0 and 500. Restoring prior state.";
        setError(validationError);
        return; // Reject invalid boundary
      }
    }

    if (name === 'name' && value.trim() === '') {
        validationError = "Name is required.";
        setError(validationError);
        return; // Reject empty
    }

    setError(null);
    setFormData(prev => ({ ...prev, [name]: newValue }));

    dispatch({
      type: 'UPDATE_RECORD',
      payload: { id: record.id, updates: { [name]: newValue } }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Edit Record</h2>
        <button
          onClick={() => dispatch({ type: 'SELECT_RECORD', payload: null })}
          className="text-gray-400 hover:text-gray-500"
        >
          &times;
        </button>
      </div>
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                {error}
            </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Value (0-500)</label>
          <input
            type="number"
            name="value"
            value={formData.value || 0}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            name="status"
            value={formData.status || 'draft'}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
          >
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Source Lineage</div>
            <div className="font-mono text-xs bg-gray-50 p-2 rounded text-gray-600 break-all">
                ID: {record.id}<br/>
                Last Modified: {new Date(record.timestamp).toLocaleTimeString()}
            </div>
        </div>
      </div>
      <div className="p-4 border-t border-gray-200 flex justify-end">
        <button
          onClick={() => dispatch({ type: 'DELETE_RECORD', payload: record.id })}
          className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-transparent rounded-md hover:bg-red-100"
        >
          Archive Record
        </button>
      </div>
    </div>
  );
}

function SpatialComposer() {
  const { state, dispatch } = useStore();
  const { capacity, usedCapacity, selectedRecordId, composerState } = state.derived;

  const [targetValue, setTargetValue] = useState(0);
  const selectedRecord = state.records.find(r => r.id === selectedRecordId);

  useEffect(() => {
      if (selectedRecord) {
          setTargetValue(selectedRecord.value);
      }
  }, [selectedRecord]);

  const percentageUsed = Math.min(100, Math.max(0, (usedCapacity / capacity) * 100));

  const handleMutate = () => {
      if (!selectedRecord) return;
      dispatch({
          type: 'COMPOSER_MUTATE',
          payload: { recordId: selectedRecord.id, newValue: targetValue }
      });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col h-full">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Spatial Composer</h2>

      <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Global Capacity Tracker</span>
              <span className="text-sm text-gray-500">{usedCapacity} / {capacity}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden flex">
              <motion.div
                  className={`h-2.5 ${usedCapacity > capacity ? 'bg-red-500' : 'bg-primary-600'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentageUsed}%` }}
                  transition={{ type: 'spring', stiffness: 100 }}
              />
          </div>
          {usedCapacity > capacity && (
              <p className="text-xs text-red-600 mt-2">Capacity exceeded! Adjust values to resolve.</p>
          )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative min-h-[200px]">
          {composerState === 'idle' && (
              <div className="text-gray-400">Select a record from the collection to compose</div>
          )}

          {(composerState === 'selected' || composerState === 'resolved' || composerState === 'conflict') && selectedRecord && (
              <motion.div
                  layoutId={`record-${selectedRecord.id}`}
                  className="bg-white p-6 rounded-xl shadow-md border-2 border-primary-500 w-full max-w-sm text-center relative z-10"
              >
                  <div className="text-sm text-gray-500 mb-1">{selectedRecord.name}</div>

                  <div className="flex items-center justify-center gap-4 my-6">
                      <input
                          type="range"
                          min="0"
                          max="200"
                          value={targetValue}
                          onChange={(e) => setTargetValue(Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                  </div>

                  <div className="text-3xl font-bold text-gray-900 mb-6">
                      {targetValue}
                  </div>

                  <button
                      onClick={handleMutate}
                      disabled={targetValue === selectedRecord.value}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      Apply Rebalance
                  </button>

                  {composerState === 'conflict' && (
                      <p className="text-xs text-red-600 mt-3 font-medium text-left">
                         Mutation rejected: Rebalancing this record to {targetValue} exceeds global capacity ({capacity}). Partial updates aborted.
                      </p>
                  )}
                  {composerState === 'resolved' && targetValue === selectedRecord.value && (
                      <p className="text-xs text-green-600 mt-3 font-medium text-center">
                         Rebalance applied successfully.
                      </p>
                  )}
              </motion.div>
          )}
      </div>
    </div>
  );
}

function AppContent() {
  useEffect(() => {
    registerWebMCPTools();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-right" />
      <Header />

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
          {/* Collection Panel */}
          <div className="md:col-span-3 h-full">
            <Collection />
          </div>

          {/* Main Spatial Composer */}
          <div className="md:col-span-6 h-full">
            <SpatialComposer />
          </div>

          {/* Inspector/Detail Panel */}
          <div className="md:col-span-3 h-full">
            <DetailPanel />
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default App;
