import { useState, useEffect, useMemo } from 'react';
import { useStore, setGlobalStore } from './store/useStore';
import { Activity, AlertTriangle, Download, Upload, Plus, Edit2, Trash2, ShieldAlert, Undo2, X, AlertCircle } from 'lucide-react';
import type { EnergyReading, EnergyReadingStatus } from './types';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const store = useStore();

  useEffect(() => {
    setGlobalStore(store);
  }, [store]);

  const {
    records,
    selectedRecordId,
    setSelectedRecordId,
    addRecord,
    updateRecord,
    deleteRecord,
    undo,
    quarantineLineage,
    importData,
    exportData,
    summary
  } = store;

  const [filter, setFilter] = useState<EnergyReadingStatus | 'all'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EnergyReading | null>(null);

  const [formValue, setFormValue] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formStatus, setFormStatus] = useState<EnergyReadingStatus>('draft');
  const [formError, setFormError] = useState('');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const filteredRecords = useMemo(() => {
    return filter === 'all' ? records : records.filter(r => r.status === filter);
  }, [records, filter]);

  const selectedRecord = records.find(r => r.id === selectedRecordId);

  const handleSave = () => {
    const val = parseFloat(formValue);
    if (isNaN(val) || val < 0 || val > 10000) {
      setFormError("Value must be a number between 0 and 10000.");
      return;
    }
    if (!formDate) {
      setFormError("Date is required.");
      return;
    }

    setFormError('');

    if (editingRecord) {
      updateRecord({
        ...editingRecord,
        value: val,
        timestamp: new Date(formDate).toISOString(),
        status: formStatus
      });
    } else {
      addRecord({
        id: `r-${Date.now()}`,
        value: val,
        timestamp: new Date(formDate).toISOString(),
        status: formStatus,
        lineage: [{
          id: `l-${Date.now()}`,
          source: 'ManualEntry',
          timestamp: new Date().toISOString(),
          status: 'valid'
        }]
      });
    }
    closeForm();
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingRecord(null);
    setFormError('');
  };

  const openEdit = (record: EnergyReading) => {
    setEditingRecord(record);
    setFormValue(record.value.toString());
    setFormDate(record.timestamp.substring(0, 16));
    setFormStatus(record.status);
    setIsFormOpen(true);
  };

  const openNew = () => {
    setEditingRecord(null);
    setFormValue('');
    setFormDate(new Date().toISOString().substring(0, 16));
    setFormStatus('draft');
    setIsFormOpen(true);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'energy-peak-v1.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.schemaVersion !== 'v1' || !Array.isArray(json.records)) {
          alert('Invalid schema. No state changes made.');
          return;
        }
        for (const r of json.records) {
          if (typeof r.value !== 'number' || !r.id) {
             alert('Invalid record found. No state changes made.');
             return;
          }
        }
        importData(json);
      } catch (err) {
        alert('Malformed JSON. No state changes made.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans md:flex-row md:flex-col">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Home Energy Peak Observatory</h1>
              <p className="text-xs text-slate-500 hidden md:block">Provenance Atlas Workflow</p>
            </div>
          </div>

          <button
            className="md:hidden p-2 rounded hover:bg-slate-100 text-slate-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <span className="font-medium text-sm">Menu</span>}
          </button>
        </div>

        <div className={`flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4 mt-4 md:mt-0 w-full md:w-auto ${isMobileMenuOpen ? 'flex' : 'hidden md:flex'}`}>
          <button onClick={undo} className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors bg-slate-50 md:bg-transparent">
            <Undo2 size={16} /> Undo
          </button>

          <div className="h-px md:h-6 w-full md:w-px bg-slate-200"></div>

          <label className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer bg-slate-50 md:bg-transparent">
            <Upload size={16} /> Import
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <button onClick={handleExport} className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors bg-slate-50 md:bg-transparent">
            <Download size={16} /> Export
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <main className="flex-1 flex flex-col min-w-0 border-r border-slate-200 bg-white order-2 md:order-1">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Filter:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-sm border border-slate-300 rounded-md px-2 py-1 bg-white flex-1 sm:flex-none"
              >
                <option value="all">All Readings</option>
                <option value="draft">Drafts</option>
                <option value="ready">Ready</option>
                <option value="changed">Changed</option>
                <option value="quarantined">Quarantined</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <button
              onClick={openNew}
              className="flex items-center justify-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors w-full sm:w-auto"
            >
              <Plus size={16} /> New Reading
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-2">
            {filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Activity size={48} className="mb-4 opacity-20" />
                <p>No records found. Adjust your filter or add a new reading.</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredRecords.map(record => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={record.id}
                    onClick={() => {
                      setSelectedRecordId(record.id);
                      if (window.innerWidth < 768) {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRecordId === record.id
                        ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          record.status === 'ready' ? 'bg-emerald-500' :
                          record.status === 'quarantined' ? 'bg-rose-500' :
                          record.status === 'changed' ? 'bg-amber-500' :
                          record.status === 'draft' ? 'bg-slate-400' : 'bg-slate-300'
                        }`} />
                        <span className="font-medium whitespace-nowrap">{record.value} kWh</span>
                        <span className="text-xs text-slate-500 whitespace-nowrap">{new Date(record.timestamp).toLocaleString()}</span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                          {record.status}
                        </span>

                        <div className="flex items-center gap-2">
                          {record.lineage.some(l => l.status === 'conflict') && (
                            <AlertTriangle size={14} className="text-amber-500" />
                          )}
                          <button onClick={(e) => { e.stopPropagation(); openEdit(record); }} className="p-1 text-slate-400 hover:text-indigo-600 rounded">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }} className="p-1 text-slate-400 hover:text-rose-600 rounded">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </main>

        <aside className={`w-full md:w-96 flex flex-col bg-slate-50 shrink-0 order-1 md:order-2 border-b md:border-b-0 border-slate-200 ${!selectedRecord && 'hidden md:flex'}`}>
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold flex items-center gap-2">
                <ShieldAlert size={18} className="text-indigo-600" /> Provenance Atlas
              </h2>
              {selectedRecord && (
                <button
                  onClick={() => setSelectedRecordId(null)}
                  className="md:hidden text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="bg-slate-50 p-2 rounded border border-slate-100 text-center">
                <div className="text-xl font-bold text-slate-700">{summary.totalReadings}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total</div>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-100 text-center">
                <div className="text-xl font-bold text-slate-700">{summary.averageValue}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Avg</div>
              </div>
              <div className="bg-rose-50 p-2 rounded border border-rose-100 text-center">
                <div className="text-xl font-bold text-rose-700">{summary.quarantinedCount}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Quarantined</div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 max-h-[50vh] md:max-h-none">
            {selectedRecord ? (
              <motion.div
                key={selectedRecord.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">Selected Record: {selectedRecord.id}</h3>
                  <div className="text-2xl font-bold text-indigo-700">{selectedRecord.value} <span className="text-sm font-normal text-slate-500">kWh</span></div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Lineage Graph</h3>
                  <div className="space-y-3 relative before:absolute before:inset-0 before:ml-3 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {selectedRecord.lineage.map((entry) => (
                      <div key={entry.id} className="relative flex items-center group is-active">
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white z-10 ${
                          entry.status === 'valid' ? 'border-emerald-500' :
                          entry.status === 'conflict' ? 'border-amber-500' : 'border-rose-500'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            entry.status === 'valid' ? 'bg-emerald-500' :
                            entry.status === 'conflict' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                        </div>
                        <div className="w-[calc(100%-2rem)] p-3 rounded border border-slate-200 bg-white shadow-sm ml-4">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2 gap-1 sm:gap-0">
                            <span className="text-xs font-semibold truncate">{entry.source}</span>
                            <span className="text-[10px] text-slate-500 whitespace-nowrap">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${
                              entry.status === 'valid' ? 'bg-emerald-100 text-emerald-700' :
                              entry.status === 'conflict' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {entry.status}
                            </span>

                            {entry.status !== 'quarantined' && (
                              <button
                                onClick={() => quarantineLineage(selectedRecord.id, entry.id)}
                                className="text-[10px] font-medium text-rose-600 hover:bg-rose-50 px-2 py-1 rounded transition-colors border border-rose-200"
                              >
                                Quarantine
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedRecord.notes && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-3">
                    <h4 className="text-xs font-semibold text-amber-800 flex items-center gap-1 mb-1">
                      <AlertCircle size={12} /> Notes
                    </h4>
                    <p className="text-sm text-amber-900">{selectedRecord.notes}</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ShieldAlert size={48} className="mb-4 opacity-20" />
                <p className="text-sm text-center">Select a record to view its provenance graph.</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col overflow-hidden" role="dialog" aria-modal="true">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold">{editingRecord ? 'Edit Reading' : 'New Reading'}</h2>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {formError && (
                <div className="bg-rose-50 text-rose-700 px-3 py-2 rounded border border-rose-200 text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Value (kWh)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formValue}
                  onChange={e => setFormValue(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="e.g. 150.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Timestamp</label>
                <input
                  type="datetime-local"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                >
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="changed">Changed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-end gap-2 bg-slate-50">
              <button onClick={closeForm} className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-md transition-colors border border-slate-300 sm:border-transparent">
                Cancel
              </button>
              <button onClick={handleSave} className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-sm">
                Save Reading
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
