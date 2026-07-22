import React, { useState, useEffect } from 'react';
import { useAppState, dispatch, getState } from './state';
import { Download, Upload, Trash2, Undo2, Layers, Filter } from 'lucide-react';

function App() {
  const state = useAppState();
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchId, setBatchId] = useState('batch-new');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [formError, setFormError] = useState('');

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBatchReconcile = () => {
    if (selectedIds.length === 0) return;
    dispatch({ type: 'BATCH_RECONCILE', payload: { ids: selectedIds, batchId } });
    setSelectedIds([]);
  };

  const handleExport = () => {
    const currentState = getState();
    const data = {
      ...currentState,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brew-experiment-v1-batch-reconciler.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        dispatch({ type: 'IMPORT', payload: data });
      } catch (err) {
        console.error("Invalid JSON");
      }
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        dispatch({ type: 'UNDO' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleEditClick = (record) => {
    setEditingRecord(record.id);
    setEditForm({ ...record });
    setFormError('');
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setFormError('');

    // Validation bounds
    const beans = Number(editForm.beans);
    const water = Number(editForm.water);
    const yieldAmount = Number(editForm.yield);

    if (isNaN(beans) || beans < 1 || beans > 200) {
      setFormError('Beans must be between 1g and 200g. Action rejected to preserve valid state.');
      return;
    }
    if (isNaN(water) || water < 1 || water > 2000) {
      setFormError('Water must be between 1ml and 2000ml. Action rejected to preserve valid state.');
      return;
    }
    if (isNaN(yieldAmount) || yieldAmount < 0 || yieldAmount > 2000) {
      setFormError('Yield must be between 0ml and 2000ml. Action rejected to preserve valid state.');
      return;
    }

    if (!editForm.name || editForm.name.trim() === '') {
      setFormError('Name is required. Action rejected to preserve valid state.');
      return;
    }

    dispatch({
      type: 'UPDATE_RECORD',
      payload: {
        id: editingRecord,
        name: editForm.name,
        status: editForm.status,
        beans,
        water,
        yield: yieldAmount
      }
    });
    setEditingRecord(null);
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
  };

  const filteredRecords = state.records.filter(r => filterStatus === 'all' || r.status === filterStatus);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-800">Coffee Brew Experiment Log</h1>
            <p className="text-gray-500 mt-1">Manage brew experiments and reconcile batches.</p>
          </div>
          <div className="flex gap-3 items-center">
            <button onClick={() => dispatch({ type: 'UNDO' })} className="btn btn-outline" aria-label="Undo last action">
              <Undo2 className="w-4 h-4 mr-2" /> Undo
            </button>
            <button onClick={handleExport} className="btn btn-primary" aria-label="Export artifact">
              <Download className="w-4 h-4 mr-2" /> Export
            </button>
            <label className="btn btn-secondary cursor-pointer">
              <Upload className="w-4 h-4 mr-2" /> Import
              <input type="file" className="hidden" accept=".json" onChange={handleImport} aria-label="Import artifact" />
            </label>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Layers className="w-5 h-5 mr-2 text-blue-500" /> Collection
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center text-sm">
                  <Filter className="w-4 h-4 mr-1 text-gray-500" />
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm py-1 pl-2 pr-6"
                    aria-label="Filter by status"
                  >
                    <option value="all">All Statuses</option>
                    <option value="empty">Empty</option>
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="changed">Changed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <button
                  onClick={() => dispatch({ type: 'CREATE_RECORD', payload: { name: 'New Brew', status: 'draft', beans: 15, water: 250, yield: 220 } })}
                  className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-md transition-colors font-medium"
                >
                  + New Brew
                </button>
              </div>
            </div>

            {filteredRecords.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <p className="text-gray-500">No brew records found for this filter.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRecords.map(record => (
                  <div
                    key={record.id}
                    className={`flex items-start p-4 border rounded-lg transition-all ${selectedIds.includes(record.id) ? 'border-blue-400 bg-blue-50/30 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(record.id)}
                        onChange={() => handleToggleSelect(record.id)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-4 cursor-pointer"
                        aria-label={`Select ${record.name}`}
                      />
                    </div>

                    {editingRecord === record.id ? (
                      <form onSubmit={handleSaveEdit} className="flex-1 bg-white p-3 border border-blue-200 rounded-md shadow-sm">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Name</label>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={e => setEditForm({...editForm, name: e.target.value})}
                              className="w-full border-gray-300 rounded-md text-sm py-1 px-2"
                              aria-label="Edit name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Status</label>
                            <select
                              value={editForm.status}
                              onChange={e => setEditForm({...editForm, status: e.target.value})}
                              className="w-full border-gray-300 rounded-md text-sm py-1 px-2"
                              aria-label="Edit status"
                            >
                              <option value="empty">Empty</option>
                              <option value="draft">Draft</option>
                              <option value="ready">Ready</option>
                              <option value="changed">Changed</option>
                              <option value="archived">Archived</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Beans (1-200g)</label>
                            <input
                              type="number"
                              value={editForm.beans}
                              onChange={e => setEditForm({...editForm, beans: e.target.value})}
                              className="w-full border-gray-300 rounded-md text-sm py-1 px-2"
                              aria-label="Edit beans"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Water (1-2000ml)</label>
                            <input
                              type="number"
                              value={editForm.water}
                              onChange={e => setEditForm({...editForm, water: e.target.value})}
                              className="w-full border-gray-300 rounded-md text-sm py-1 px-2"
                              aria-label="Edit water"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Yield (0-2000ml)</label>
                            <input
                              type="number"
                              value={editForm.yield}
                              onChange={e => setEditForm({...editForm, yield: e.target.value})}
                              className="w-full border-gray-300 rounded-md text-sm py-1 px-2"
                              aria-label="Edit yield"
                            />
                          </div>
                        </div>

                        {formError && (
                          <div className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded border border-red-100">
                            {formError}
                          </div>
                        )}

                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={handleCancelEdit} className="btn btn-outline py-1 px-3 text-xs">Cancel</button>
                          <button type="submit" className="btn btn-primary py-1 px-3 text-xs">Save</button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex-1 grid grid-cols-4 gap-4 items-center" onClick={() => handleEditClick(record)}>
                        <div className="col-span-2 cursor-pointer group">
                          <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors flex items-center">
                            {record.name}
                            <span className="opacity-0 group-hover:opacity-100 ml-2 text-xs text-blue-500 font-normal">Edit</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {record.beans}g in / {record.water}ml water / {record.yield}ml out
                          </div>
                        </div>
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                            ${record.status === 'ready' ? 'bg-green-100 text-green-800' : ''}
                            ${record.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${record.status === 'changed' ? 'bg-blue-100 text-blue-800' : ''}
                            ${record.status === 'empty' ? 'bg-gray-100 text-gray-800' : ''}
                            ${record.status === 'archived' ? 'bg-red-100 text-red-800' : ''}
                          `}>
                            {record.status}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-600">
                          {record.batch ? <span className="bg-gray-100 px-2 py-1 rounded text-xs truncate max-w-full block" title={record.batch}>{record.batch}</span> : <span className="text-gray-400">-</span>}
                        </div>
                      </div>
                    )}

                    {!editingRecord && (
                      <button
                        onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_RECORD', payload: { id: record.id } }); }}
                        className="ml-4 p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                        aria-label="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Batch Reconciler</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="batchId" className="block text-sm font-medium text-gray-700 mb-1">Target Batch ID</label>
                  <input
                    id="batchId"
                    type="text"
                    value={batchId}
                    onChange={e => setBatchId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Selected Records:</span>
                    <span className="font-medium text-gray-900">{selectedIds.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Aggregate Beans:</span>
                    <span className="font-medium text-gray-900">
                      {state.records.filter(r => selectedIds.includes(r.id)).reduce((acc, r) => acc + (Number(r.beans) || 0), 0)}g
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleBatchReconcile}
                  disabled={selectedIds.length === 0 || !batchId.trim()}
                  className={`w-full py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-white transition-colors
                    ${(selectedIds.length === 0 || !batchId.trim()) ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
                  `}
                >
                  Group & Reconcile
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Derived Summary</h2>
              <div className="text-3xl font-bold text-gray-900">
                {state.derived?.summary || 0}<span className="text-lg text-gray-500 font-normal ml-1">g total</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Aggregate total beans across all records.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
