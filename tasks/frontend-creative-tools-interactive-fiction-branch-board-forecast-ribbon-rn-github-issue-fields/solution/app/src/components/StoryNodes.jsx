import React, { useState } from 'react'
import { useStore } from '../store/useStore'
import { Trash, Edit2, CheckCircle2, CircleDashed } from 'lucide-react'

export default function StoryNodes() {
  const records = useStore(state => state.records)
  const selectedId = useStore(state => state.selectedId)
  const setSelectedId = useStore(state => state.setSelectedId)
  const deleteRecord = useStore(state => state.deleteRecord)
  const addRecord = useStore(state => state.addRecord)

  const [filter, setFilter] = useState('all')
  const [isAdding, setIsAdding] = useState(false)

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter)

  const handleAddNode = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const title = formData.get('title')
    if (!title) return

    addRecord({
      id: `node-${Date.now()}`,
      title,
      status: 'draft',
      forecastValue: 50,
      description: 'New node'
    })
    setIsAdding(false)
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50 border-r border-zinc-200">
      <div className="p-4 border-b border-zinc-200 flex justify-between items-center bg-white">
        <h2 className="text-lg font-semibold text-zinc-800">Story Nodes</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-3 py-1 bg-zinc-900 text-white rounded text-sm hover:bg-zinc-800 focus:ring-2 focus:ring-zinc-500 outline-none"
        >
          {isAdding ? 'Cancel' : 'Add Node'}
        </button>
      </div>

      <div className="p-2 border-b border-zinc-200 bg-zinc-100 flex gap-2 overflow-x-auto">
        {['all', 'empty', 'draft', 'ready', 'changed', 'archived'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-1 text-xs rounded capitalize whitespace-nowrap outline-none focus:ring-2 focus:ring-zinc-400 ${
              filter === f ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isAdding && (
        <form onSubmit={handleAddNode} className="p-4 bg-white border-b border-zinc-200">
          <input
            name="title"
            autoFocus
            placeholder="Node Title..."
            className="w-full p-2 border border-zinc-300 rounded mb-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
          />
          <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 outline-none focus:ring-2 focus:ring-blue-500">
            Save Draft
          </button>
        </form>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredRecords.length === 0 ? (
          <div className="text-center p-8 text-zinc-500 text-sm">
            No nodes found. Create a new one or adjust the filter.
          </div>
        ) : (
          filteredRecords.map(record => (
            <div
              key={record.id}
              onClick={() => setSelectedId(record.id)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedId(record.id)
              }}
              className={`p-3 rounded border cursor-pointer outline-none transition-colors group flex items-center justify-between ${
                selectedId === record.id
                  ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
                  : 'bg-white border-zinc-200 hover:border-zinc-300 focus:border-blue-300 focus:ring-1 focus:ring-blue-300'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  record.status === 'ready' ? 'bg-green-500' :
                  record.status === 'draft' ? 'bg-amber-400' :
                  record.status === 'changed' ? 'bg-blue-500' :
                  record.status === 'archived' ? 'bg-zinc-400' : 'bg-transparent border border-zinc-300'
                }`} />
                <div className="flex flex-col truncate">
                  <span className="text-sm font-medium text-zinc-900 truncate">{record.title}</span>
                  <span className="text-xs text-zinc-500 capitalize">{record.status} • fcst: {record.forecastValue}</span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteRecord(record.id) }}
                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-600 focus:opacity-100 outline-none rounded focus:ring-2 focus:ring-red-200 transition-opacity"
                aria-label="Delete node"
              >
                <Trash size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
