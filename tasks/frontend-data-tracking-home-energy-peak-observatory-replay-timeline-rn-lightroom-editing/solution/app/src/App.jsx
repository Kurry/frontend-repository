import React, { useEffect, useState } from 'react';
import { useStore } from './store.js';
import { initWebMCP } from './webmcp.js';
import { Download, Upload, Clock, Undo, Play, Square, CircleUser, FileJson } from 'lucide-react';

function App() {
  const store = useStore();

  useEffect(() => {
    initWebMCP();

    // Seed initial data if empty
    if (store.records.length === 0) {
        store.seedData();
    }
  }, []);

  const { records, timelineState, history, derived, undo, clear, importSession, exportSession } = store;

  const [activeTab, setActiveTab] = useState('collection'); // collection | timeline | export

  // Ensure derived stats are up to date
  const totalReadings = records.length;
  const draftReadings = records.filter(r => r.status === 'draft').length;
  const readyReadings = records.filter(r => r.status === 'ready').length;
  const changedReadings = records.filter(r => r.status === 'changed').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-semibold tracking-tight text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Home Energy Peak Observatory
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => undo()}
            disabled={history.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Undo className="w-4 h-4" />
            <span>Undo</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <nav className="w-64 bg-white border-r border-slate-200 flex flex-col hidden sm:flex">
           <div className="p-4 border-b border-slate-100">
               <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Views</div>
               <div className="space-y-1">
                   <button
                     onClick={() => setActiveTab('collection')}
                     className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'collection' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                   >
                     Energy Readings
                   </button>
                   <button
                     onClick={() => setActiveTab('timeline')}
                     className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'timeline' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                   >
                     Replay Timeline
                   </button>
                   <button
                     onClick={() => setActiveTab('export')}
                     className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'export' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                   >
                     Portable Artifact
                   </button>
               </div>
           </div>

           <div className="p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Derived Summary</div>
              <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between"><span>Total:</span> <span className="font-medium text-slate-900">{totalReadings}</span></div>
                  <div className="flex justify-between"><span>Ready:</span> <span className="font-medium text-slate-900">{readyReadings}</span></div>
                  <div className="flex justify-between"><span>Draft:</span> <span className="font-medium text-slate-900">{draftReadings}</span></div>
                  <div className="flex justify-between"><span>Changed:</span> <span className="font-medium text-slate-900">{changedReadings}</span></div>
              </div>
           </div>
        </nav>

        {/* Mobile Tabs */}
        <div className="sm:hidden flex border-b border-slate-200 bg-white px-2">
             <button
                onClick={() => setActiveTab('collection')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'collection' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Readings
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'timeline' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Timeline
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'export' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Artifact
              </button>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex justify-center">
            <div className="w-full max-w-5xl">
                {activeTab === 'collection' && <CollectionTab />}
                {activeTab === 'timeline' && <TimelineTab />}
                {activeTab === 'export' && <ExportTab />}
            </div>
        </main>
      </div>
    </div>
  );
}

function CollectionTab() {
  const store = useStore();
  const { records, addRecord, updateRecord, deleteRecord } = store;
  const [filter, setFilter] = useState('all');

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  return (
    <div className="space-y-6 animate-morph">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Energy Readings</h2>
        <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block p-2"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
              <option value="archived">Archived</option>
            </select>
            <button
              onClick={() => addRecord({
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                value: 0,
                status: 'draft',
                checkpoints: []
              })}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
            >
              Add Reading
            </button>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Value (kWh)</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredRecords.length === 0 ? (
                <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500 text-sm">
                        No readings found for the selected filter.
                    </td>
                </tr>
            ) : (
                filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 animate-morph">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                        {new Date(record.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <input
                          type="number"
                          value={record.value}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val >= 0) {
                                updateRecord(record.id, { value: val });
                            }
                          }}
                          className="w-24 px-2 py-1 border border-slate-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                          min="0"
                          step="0.1"
                        />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={record.status}
                          onChange={(e) => updateRecord(record.id, { status: e.target.value })}
                          className={`text-xs font-semibold rounded-full px-2.5 py-0.5 border ${
                              record.status === 'ready' ? 'bg-green-100 text-green-800 border-green-200' :
                              record.status === 'draft' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                              record.status === 'changed' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              'bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                            <option value="draft">Draft</option>
                            <option value="ready">Ready</option>
                            <option value="changed">Changed</option>
                            <option value="archived">Archived</option>
                        </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                        onClick={() => deleteRecord(record.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                    >
                        Delete
                    </button>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TimelineTab() {
  const store = useStore();
  const { records, timelineState, selectRecord, scrubTimeline, restoreCheckpoint } = store;
  const selectedRecord = records.find(r => r.id === timelineState.selectedRecordId);
  const [scrubValue, setScrubValue] = useState(0);

  // Sync internal scrub slider with external state changes (like undo)
  useEffect(() => {
    if (timelineState.currentCheckpointIndex !== undefined && timelineState.currentCheckpointIndex !== null) {
        setScrubValue(timelineState.currentCheckpointIndex);
    }
  }, [timelineState.currentCheckpointIndex]);

  const handleScrubChange = (e) => {
      const newIndex = parseInt(e.target.value, 10);
      setScrubValue(newIndex);
      if (selectedRecord && selectedRecord.checkpoints) {
          scrubTimeline(selectedRecord.id, newIndex);
      }
  };

  const handleRestore = () => {
      if (selectedRecord) {
          restoreCheckpoint(selectedRecord.id);
      }
  };

  return (
    <div className="space-y-6 animate-morph">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Replay Timeline</h2>
        <p className="text-slate-500 text-sm">Scrub a selected record through its timeline and restore a prior checkpoint.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 border border-slate-200 rounded-lg overflow-hidden bg-white flex flex-col h-[500px]">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-medium text-sm text-slate-700">
                  Select a Record
              </div>
              <div className="overflow-y-auto p-2 space-y-1">
                  {records.filter(r => r.status !== 'archived').map(record => (
                      <button
                        key={record.id}
                        onClick={() => selectRecord(record.id)}
                        className={`w-full text-left px-3 py-3 rounded-md border text-sm transition-colors flex justify-between items-center ${timelineState.selectedRecordId === record.id ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                      >
                          <div>
                              <div className="font-medium text-slate-900">{new Date(record.timestamp).toLocaleTimeString()}</div>
                              <div className="text-slate-500 text-xs">{new Date(record.timestamp).toLocaleDateString()}</div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                              <span className="font-semibold text-slate-700">{record.value} kWh</span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                    record.status === 'ready' ? 'bg-green-100 text-green-700' :
                                    record.status === 'changed' ? 'bg-blue-100 text-blue-700' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                    {record.status}
                                </span>
                          </div>
                      </button>
                  ))}
                  {records.filter(r => r.status !== 'archived').length === 0 && (
                      <div className="text-center p-4 text-slate-500 text-sm">No active records available.</div>
                  )}
              </div>
          </div>

          <div className="lg:col-span-2 border border-slate-200 rounded-lg bg-white p-6 flex flex-col h-[500px]">
                {!selectedRecord ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <Play className="w-12 h-12 mb-4 text-slate-300" />
                        <p>Select a record to view its timeline.</p>
                    </div>
                ) : (
                    <div className="flex flex-col h-full animate-morph">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-1">Timeline Inspector</h3>
                                <p className="text-sm text-slate-500">ID: {selectedRecord.id.slice(0,8)}... </p>
                            </div>
                            <div className="px-3 py-1 bg-indigo-50 text-indigo-700 font-medium rounded-full text-sm border border-indigo-100">
                                State: <span className="uppercase">{timelineState.status}</span>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center mb-8 relative">
                            {/* Visual Timeline track representation */}
                            <div className="absolute inset-0 flex items-center px-4">
                                <div className="h-1 bg-slate-200 w-full rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 transition-all duration-200"
                                        style={{ width: `${selectedRecord.checkpoints.length > 0 ? (scrubValue / Math.max(1, selectedRecord.checkpoints.length - 1)) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="relative z-10 w-full px-4 flex justify-between items-center mb-6">
                                {selectedRecord.checkpoints && selectedRecord.checkpoints.map((cp, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-4 h-4 rounded-full border-2 transition-colors ${idx <= scrubValue ? 'bg-indigo-600 border-indigo-200 shadow-sm' : 'bg-white border-slate-300'} ${idx === scrubValue ? 'ring-4 ring-indigo-100 scale-125' : ''}`}
                                        title={`Checkpoint ${idx}: ${cp.value} kWh`}
                                        onClick={() => handleScrubChange({target: {value: idx}})}
                                        style={{cursor: 'pointer'}}
                                    ></div>
                                ))}
                            </div>

                            <input
                                type="range"
                                min="0"
                                max={Math.max(0, (selectedRecord.checkpoints?.length || 1) - 1)}
                                value={scrubValue}
                                onChange={handleScrubChange}
                                className="w-full relative z-20 cursor-pointer accent-indigo-600"
                                aria-label="Scrub timeline"
                            />
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 flex justify-between items-center">
                            <div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Preview Value</div>
                                <div className="text-3xl font-bold text-slate-900">
                                    {selectedRecord.checkpoints?.[scrubValue]?.value || selectedRecord.value} <span className="text-base font-medium text-slate-500">kWh</span>
                                </div>
                                <div className="text-sm mt-1 text-slate-600">
                                    Recorded at {new Date(selectedRecord.checkpoints?.[scrubValue]?.timestamp || selectedRecord.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                            <div>
                                 <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 text-right">Preview Status</div>
                                 <div className="text-right">
                                    <span className="font-semibold text-slate-700 capitalize">{selectedRecord.checkpoints?.[scrubValue]?.status || selectedRecord.status}</span>
                                 </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-auto">
                             <button
                                onClick={handleRestore}
                                disabled={timelineState.status !== 'changed'}
                                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                <Undo className="w-4 h-4" />
                                Restore to this point
                            </button>
                        </div>
                    </div>
                )}
          </div>
      </div>
    </div>
  );
}


function ExportTab() {
  const store = useStore();
  const { records, derived, timelineState } = store;

  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState('');

  const currentArtifact = {
      schemaVersion: 'v1',
      exportedAt: new Date().toISOString(),
      records: records,
      derived: derived,
      history: [/* Simplified history for artifact */]
  };

  const handleExport = () => {
      // In a real app we'd trigger a download. For WebMCP/E2E we make it observable.
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentArtifact, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href",     dataStr);
      downloadAnchorNode.setAttribute("download", "energy-peak-v1-replay-timeline.json");
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleImport = () => {
      setImportError('');
      try {
          const parsed = JSON.parse(importJsonText);

          // Field-level validation
          if (parsed.schemaVersion !== 'v1') throw new Error("Invalid schemaVersion: expected v1");
          if (!Array.isArray(parsed.records)) throw new Error("Invalid format: records must be an array");

          // Validate individual records roughly
          for (const r of parsed.records) {
              if (typeof r.id !== 'string' || typeof r.value !== 'number' || !['draft', 'ready', 'changed', 'archived'].includes(r.status)) {
                  throw new Error(`Invalid record structure for ID: ${r.id}`);
              }
          }

          store.importSession(parsed);
          setImportJsonText('');
          alert("Import successful");
      } catch (e) {
          setImportError(e.message);
      }
  };

  return (
    <div className="space-y-6 animate-morph">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Portable Artifact</h2>
        <p className="text-slate-500 text-sm">Export or import the full canonical session state.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-slate-200 rounded-lg p-6 bg-white flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                  <Download className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-slate-900">Export Session</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4 flex-1">
                  Download the current state including all readings, timeline edits, and derived summaries as a valid JSON artifact.
              </p>

              <div className="bg-slate-50 p-3 rounded-md text-xs font-mono text-slate-600 mb-6 h-32 overflow-y-auto border border-slate-200">
                  <pre>{JSON.stringify(currentArtifact, null, 2).slice(0, 300)}...</pre>
              </div>

              <button
                onClick={handleExport}
                className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
              >
                  Export energy-peak-v1-replay-timeline.json
              </button>
          </div>

          <div className="border border-slate-200 rounded-lg p-6 bg-white flex flex-col">
               <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-lg font-semibold text-slate-900">Import Session</h3>
                  </div>
                  <button
                      onClick={() => store.clear()}
                      className="text-xs font-medium text-red-600 hover:text-red-800"
                  >
                      Clear Current Session
                  </button>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                  Paste JSON to restore a prior session. Invalid data will be rejected, preserving current state.
              </p>

              <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className="w-full h-32 p-3 text-xs font-mono border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 mb-2 resize-none"
                  placeholder='{ "schemaVersion": "v1", "records": [...] }'
              ></textarea>

              {importError && (
                  <div className="text-sm text-red-600 mb-4 bg-red-50 p-2 rounded border border-red-100">
                      Error: {importError}
                  </div>
              )}

              <button
                onClick={handleImport}
                disabled={!importJsonText.trim()}
                className="mt-auto w-full py-2.5 bg-white border border-indigo-600 text-indigo-700 font-medium rounded-md hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                  Validate & Import
              </button>
          </div>
      </div>
    </div>
  );
}

export default App;
