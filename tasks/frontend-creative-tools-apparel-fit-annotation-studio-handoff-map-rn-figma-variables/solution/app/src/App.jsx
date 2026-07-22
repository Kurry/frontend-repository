import React, { useEffect, useState } from 'react'
import { useStore } from './store'
import { setupWebMCP } from './webmcp'

function App() {
  const { records, addRecord, deleteRecord, connectRecord, undo, exportSession, importSession, clear } = useStore()

  useEffect(() => {
    setupWebMCP();
  }, []);

  const [newRecordName, setNewRecordName] = useState('')
  const [filterState, setFilterState] = useState('all')

  const filteredRecords = filterState === 'all' ? records : records.filter(r => r.status === filterState)

  const handleCreate = () => {
    if (!newRecordName.trim()) return;
    addRecord({ id: Date.now().toString(), name: newRecordName, status: 'draft', owner: null })
    setNewRecordName('')
  }

  const [importJson, setImportJson] = useState('')
  const handleImport = () => {
    try {
      const data = JSON.parse(importJson)
      if (data.schemaVersion !== 'fit-annotations-v1') {
        alert('Invalid schemaVersion')
        return;
      }
      importSession(data)
    } catch (e) {
      alert('Invalid JSON')
    }
  }

  return (
    <div className="p-4 flex h-screen gap-4 bg-slate-50 text-slate-900">

      {/* List Panel */}
      <div className="w-1/3 bg-white p-4 shadow rounded flex flex-col gap-4 overflow-y-auto">
        <h1 className="text-xl font-bold">Fit Annotation Studio</h1>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="New annotation name..."
            className="border p-1 flex-1"
            value={newRecordName}
            onChange={e => setNewRecordName(e.target.value)}
          />
          <button onClick={handleCreate} className="bg-blue-600 text-white px-2 py-1 rounded">Create</button>
        </div>

        <div className="flex gap-2 text-sm">
          <button onClick={() => setFilterState('all')} className={filterState === 'all' ? "font-bold" : ""}>All</button>
          <button onClick={() => setFilterState('draft')} className={filterState === 'draft' ? "font-bold" : ""}>Draft</button>
          <button onClick={() => setFilterState('ready')} className={filterState === 'ready' ? "font-bold" : ""}>Ready</button>
        </div>

        <div className="flex flex-col gap-2">
          {filteredRecords.length === 0 && <p className="text-gray-500 italic">No records found.</p>}
          {filteredRecords.map(r => (
            <div key={r.id} className="border p-2 rounded flex justify-between items-center bg-slate-50">
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-gray-500">Status: {r.status} | Owner: {r.owner || 'Unassigned'}</p>
              </div>
              <button onClick={() => deleteRecord(r.id)} className="text-red-500 text-sm hover:underline">Delete</button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Canvas / Handoff Map */}
      <div className="flex-1 bg-white shadow rounded p-4 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">Handoff Map</h2>
          <div className="flex gap-2">
            <button onClick={undo} className="border px-2 py-1 rounded hover:bg-gray-50">Undo Last</button>
            <button onClick={clear} className="border px-2 py-1 rounded hover:bg-red-50 text-red-600">Clear All</button>
          </div>
        </div>

        <div className="flex-1 bg-slate-100 rounded p-4 overflow-y-auto relative border border-dashed border-slate-300">
           {records.length === 0 && <p className="text-center mt-10 text-gray-400">No records to map.</p>}

           <div className="grid grid-cols-2 gap-4">
              {records.map(r => (
                <div key={r.id} className={`p-4 rounded shadow-sm border ${r.status === 'ready' ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                  <h3 className="font-bold">{r.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">Assign handoff owner:</p>
                  <div className="flex gap-2">
                    <button onClick={() => connectRecord(r.id, 'Alice')} className={`px-2 py-1 text-sm rounded ${r.owner === 'Alice' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Alice</button>
                    <button onClick={() => connectRecord(r.id, 'Bob')} className={`px-2 py-1 text-sm rounded ${r.owner === 'Bob' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Bob</button>
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Artifact Export / Import area */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-bold mb-2">Portable Work Artifact</h3>
          <div className="flex gap-2">
            <button onClick={() => {
              const str = exportSession()
              navigator.clipboard.writeText(str).catch(() => {})
              alert("Export copied to clipboard (see console for full JSON).")
              console.log(str)
            }} className="bg-green-600 text-white px-4 py-1 rounded">Export JSON</button>

            <input type="text" placeholder="Paste JSON here to import" value={importJson} onChange={e => setImportJson(e.target.value)} className="border p-1 flex-1 text-sm" />
            <button onClick={handleImport} className="border px-4 py-1 rounded hover:bg-gray-50">Import JSON</button>
          </div>
        </div>
      </div>

    </div>
  )
}

export default App
