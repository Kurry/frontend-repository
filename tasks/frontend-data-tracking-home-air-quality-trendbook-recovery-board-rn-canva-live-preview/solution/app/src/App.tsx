import React, { useState, useEffect, useRef } from 'react';
import { HomeAirQualityTrendbookSession, Record, Status } from './types';
import { initialSession } from './initialState';
import { setupWebMCP } from './webmcp';

const App: React.FC = () => {
  const [session, setSession] = useState<HomeAirQualityTrendbookSession>(initialSession);
  const [history, setHistory] = useState<HomeAirQualityTrendbookSession[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // UI State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setupWebMCP(
      () => session,
      (newSession) => {
        setHistory((prev) => [...prev, session]);
        setSession(newSession);
      }
    );
  }, [session]);

  const updateSession = (newSession: HomeAirQualityTrendbookSession) => {
    // update derived state
    const failedCount = newSession.records.filter(r => r.status === 'failed').length;
    newSession.derived = {
       summary: failedCount > 0 ? `${failedCount} failed record${failedCount > 1 ? 's require' : ' requires'} recovery.` : 'All records are in a good state.'
    };

    setHistory((prev) => [...prev, session]);
    setSession(newSession);
  };

  const undo = () => {
    if (history.length > 0) {
      const prevSession = history[history.length - 1];
      setSession(prevSession);
      setHistory(history.slice(0, -1));
    }
  };

  const handleRecover = () => {
     if (selectedRecordId) {
        const newSession = { ...session, records: session.records.map(r => r.id === selectedRecordId ? { ...r, status: 'resolved' as Status } : r) };
        updateSession(newSession);
        setSelectedRecordId(null);
     }
  };

  const handleExport = () => {
     const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({...session, exportedAt: new Date().toISOString()}));
     const downloadAnchorNode = document.createElement('a');
     downloadAnchorNode.setAttribute("href",     dataStr);
     downloadAnchorNode.setAttribute("download", "air-quality-v1-recovery-board.json");
     document.body.appendChild(downloadAnchorNode);
     downloadAnchorNode.click();
     downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;

     const reader = new FileReader();
     reader.onload = (event) => {
        try {
           const parsed = JSON.parse(event.target?.result as string);
           if (parsed.schemaVersion === 'v1' && Array.isArray(parsed.records)) {
              updateSession({...parsed, exportedAt: new Date().toISOString()});
           } else {
              alert("Invalid artifact schema");
           }
        } catch (err) {
           alert("Failed to parse JSON");
        }
     };
     reader.readAsText(file);
  };

  const handleSaveRecord = (e: React.FormEvent) => {
     e.preventDefault();
     if (!editingRecord) return;

     if (editingRecord.aqi < 0 || editingRecord.aqi > 500) {
        alert("AQI must be between 0 and 500.");
        return;
     }

     if (editingRecord.pm25 < 0 || editingRecord.pm25 > 500) {
        alert("PM2.5 must be between 0 and 500.");
        return;
     }

     if (editingRecord.id) {
        // update
        const newSession = { ...session, records: session.records.map(r => r.id === editingRecord.id ? editingRecord : r) };
        updateSession(newSession);
     } else {
        // create
        const newRecord = { ...editingRecord, id: Math.random().toString(36).substr(2, 9) };
        const newSession = { ...session, records: [...session.records, newRecord] };
        updateSession(newSession);
     }

     setIsEditing(false);
     setEditingRecord(null);
  };

  const handleCreate = () => {
     setEditingRecord({ id: '', location: '', aqi: 0, pm25: 0, status: 'draft' });
     setIsEditing(true);
  };

  const handleEdit = (record: Record) => {
     setEditingRecord({...record});
     setIsEditing(true);
  };

  const handleArchive = (id: string) => {
     const newSession = { ...session, records: session.records.map(r => r.id === id ? { ...r, status: 'archived' as Status } : r) };
     updateSession(newSession);
  };

  const filteredRecords = session.records.filter(r => filterStatus === 'all' || r.status === filterStatus);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
        <h1 className="text-xl font-semibold text-gray-800 tracking-tight">Home Air Quality Trendbook</h1>
        <div className="flex gap-3">
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">Import</button>
          <button onClick={undo} disabled={history.length === 0} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors">Undo</button>
          <button onClick={handleExport} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm">Export Artifact</button>
        </div>
      </header>

      {isEditing && editingRecord && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-[400px]">
               <h3 className="text-lg font-semibold mb-4">{editingRecord.id ? 'Edit Record' : 'New Record'}</h3>
               <form onSubmit={handleSaveRecord} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                     <input required type="text" value={editingRecord.location} onChange={e => setEditingRecord({...editingRecord, location: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">AQI (0-500)</label>
                     <input required type="number" min="0" max="500" value={editingRecord.aqi} onChange={e => setEditingRecord({...editingRecord, aqi: parseInt(e.target.value) || 0})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">PM2.5 (0-500)</label>
                     <input required type="number" min="0" max="500" value={editingRecord.pm25} onChange={e => setEditingRecord({...editingRecord, pm25: parseInt(e.target.value) || 0})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                     <select value={editingRecord.status} onChange={e => setEditingRecord({...editingRecord, status: e.target.value as Status})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                        <option value="draft">Draft</option>
                        <option value="ready">Ready</option>
                        <option value="failed">Failed</option>
                     </select>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                     <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                     <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Save</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex-1 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-lg font-medium text-gray-800">Readings Collection</h2>
               <div className="flex gap-3">
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500">
                     <option value="all">All Statuses</option>
                     <option value="draft">Draft</option>
                     <option value="ready">Ready</option>
                     <option value="failed">Failed</option>
                     <option value="resolved">Resolved</option>
                     <option value="archived">Archived</option>
                  </select>
                  <button onClick={handleCreate} className="px-4 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors">New Record</button>
               </div>
            </div>
            <div className="space-y-3 overflow-auto">
              {filteredRecords.length === 0 ? (
                 <div className="text-center py-12 text-gray-500 text-sm">No records found.</div>
              ) : filteredRecords.map((r) => (
                <div key={r.id} className={`p-4 border ${selectedRecordId === r.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'} rounded-md flex justify-between items-center hover:border-gray-300 transition-all cursor-pointer`} onClick={() => setSelectedRecordId(r.id)}>
                   <div className="flex gap-4 items-center">
                      <span className="font-mono text-sm text-gray-500 w-24">{r.id.substring(0,8)}</span>
                      <span className="font-medium w-48 truncate">{r.location}</span>
                      <span className="text-sm text-gray-600 w-24">AQI: {r.aqi}</span>
                      <span className="text-sm text-gray-600 w-24">PM2.5: {r.pm25}</span>
                   </div>
                   <div className="flex gap-4 items-center">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${r.status === 'failed' ? 'bg-red-100 text-red-800' : r.status === 'resolved' ? 'bg-green-100 text-green-800' : r.status === 'archived' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-800'}`}>{r.status}</span>

                      <button onClick={(e) => { e.stopPropagation(); handleEdit(r); }} className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); handleArchive(r.id); }} className="text-sm text-gray-500 hover:text-gray-700" disabled={r.status === 'archived'}>Archive</button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <aside className="w-96 bg-white border-l border-gray-200 flex flex-col shrink-0">
          <div className="p-6 flex-1 overflow-auto">
            <h2 className="text-lg font-medium mb-4 text-gray-800">Recovery Board</h2>

            <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
               <h3 className="text-sm font-semibold text-gray-700 mb-2">Derived Summary</h3>
               <p className="text-sm text-gray-600">{session.derived.summary}</p>
            </div>

            {selectedRecordId ? (
                <div className="motion-safe:animate-fade-in">
                   <p className="text-sm text-gray-600 mb-4">Record <span className="font-mono">{selectedRecordId.substring(0,8)}</span> selected.</p>
                   {session.records.find(r => r.id === selectedRecordId)?.status === 'failed' && (
                       <button onClick={handleRecover} className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors shadow-sm">Recover Failed Record</button>
                   )}
                   {session.records.find(r => r.id === selectedRecordId)?.status !== 'failed' && (
                       <p className="text-sm text-gray-500 italic">This record does not require recovery.</p>
                   )}
                </div>
            ) : (
                <p className="text-sm text-gray-500 mb-6">Select a failed record to repair downstream consequences.</p>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;
