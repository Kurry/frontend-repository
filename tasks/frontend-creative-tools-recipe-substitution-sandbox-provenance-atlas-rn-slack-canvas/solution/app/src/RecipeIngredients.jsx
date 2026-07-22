import React, { useState } from 'react'
import { useStore } from './store'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Edit2, Archive, AlertCircle, ChevronDown, Check, Circle, XCircle, Search } from 'lucide-react'

const statusConfig = {
  empty: { color: 'text-gray-400', bg: 'bg-gray-100', icon: Circle, label: 'Empty' },
  draft: { color: 'text-amber-500', bg: 'bg-amber-50', icon: AlertCircle, label: 'Draft' },
  ready: { color: 'text-emerald-500', bg: 'bg-emerald-50', icon: Check, label: 'Ready' },
  changed: { color: 'text-blue-500', bg: 'bg-blue-50', icon: Edit2, label: 'Changed' },
  archived: { color: 'text-purple-500', bg: 'bg-purple-50', icon: Archive, label: 'Archived' },
}

export function RecipeIngredients() {
  const { records, filterStatus, setFilterStatus, selectRecord, selectedRecordId, addRecord, updateRecord, archiveRecord } = useStore()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)

  // Temporary state for the inline form
  const [formData, setFormData] = useState({ name: '', quantity: '', substitute: '', reason: '', source: '', status: 'draft' })
  const [errorMsg, setErrorMsg] = useState('')

  const filteredRecords = records.filter(r => filterStatus === 'all' || r.status === filterStatus)

  const handleSave = (id) => {
    if (!formData.name.trim() || !formData.substitute.trim()) {
      setErrorMsg('Name and substitute are required')
      return
    }

    if (id === 'new') {
      addRecord({ ...formData })
      setIsAdding(false)
    } else {
      updateRecord(id, { ...formData })
      setEditingId(null)
    }
    setErrorMsg('')
  }

  const startEdit = (record) => {
    setFormData({ name: record.name, quantity: record.quantity, substitute: record.substitute, reason: record.reason, source: record.source, status: record.status })
    setEditingId(record.id)
    setErrorMsg('')
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-gray-800">Recipe Ingredients</h2>
          <div className="relative">
             <select
               className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 cursor-pointer"
               value={filterStatus}
               onChange={(e) => setFilterStatus(e.target.value)}
             >
               <option value="all">All Statuses</option>
               <option value="empty">Empty</option>
               <option value="draft">Draft</option>
               <option value="ready">Ready</option>
               <option value="changed">Changed</option>
               <option value="archived">Archived</option>
             </select>
             <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2 pointer-events-none" />
          </div>
        </div>
        <button
          onClick={() => {
            setIsAdding(true)
            setFormData({ name: '', quantity: '', substitute: '', reason: '', source: '', status: 'draft' })
            setErrorMsg('')
          }}
          disabled={isAdding || editingId !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-900"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Record
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <AnimatePresence initial={false}>
          {isAdding && (
             <motion.div
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: 'auto' }}
               exit={{ opacity: 0, height: 0 }}
               className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg mb-2 overflow-hidden"
             >
               <FormContent formData={formData} setFormData={setFormData} onSave={() => handleSave('new')} onCancel={() => setIsAdding(false)} error={errorMsg} />
             </motion.div>
          )}

          {filteredRecords.length === 0 && !isAdding && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Search className="w-8 h-8 mb-3 opacity-20" />
              <p className="text-sm">No records match this filter.</p>
            </div>
          )}

          {filteredRecords.map(record => (
            <motion.div
              layout
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              tabIndex={0}
              onClick={() => {
                if (editingId !== record.id) {
                    selectRecord(record.id)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  if (editingId !== record.id) {
                      selectRecord(record.id)
                  }
                }
              }}
              className={`group relative p-3 rounded-lg border transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                editingId === record.id ? 'bg-blue-50/50 border-blue-200 shadow-sm cursor-default' :
                selectedRecordId === record.id ? 'bg-blue-50/30 border-blue-200' :
                'bg-white border-transparent hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              {editingId === record.id ? (
                <FormContent formData={formData} setFormData={setFormData} onSave={() => handleSave(record.id)} onCancel={() => setEditingId(null)} error={errorMsg} />
              ) : (
                <div className="flex items-center gap-4">
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${record.quarantine ? 'bg-red-100 text-red-500' : statusConfig[record.status].bg + ' ' + statusConfig[record.status].color}`}>
                    {record.quarantine ? <XCircle className="w-4 h-4" /> : React.createElement(statusConfig[record.status].icon, { className: "w-4 h-4" })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="text-sm font-medium text-gray-900 truncate flex items-center gap-2">
                        {record.name}
                        {record.quarantine && <span className="text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Quarantined</span>}
                      </div>
                      <div className="text-xs text-gray-500">{record.quantity}</div>
                    </div>
                    <div className="text-sm text-gray-500 truncate flex items-center gap-1.5">
                      <span className="text-gray-400 shrink-0">Sub:</span>
                      <span className="text-gray-700">{record.substitute}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); startEdit(record) }} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-white" aria-label="Edit record">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {record.status !== 'archived' && (
                      <button onClick={(e) => { e.stopPropagation(); archiveRecord(record.id) }} className="p-1.5 text-gray-400 hover:text-purple-600 rounded-md hover:bg-white" aria-label="Archive record">
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function FormContent({ formData, setFormData, onSave, onCancel, error }) {
  return (
    <form className="space-y-3" onClick={e => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onSave(); }}>
      {error && <div className="text-xs font-medium text-red-600 bg-red-50 p-2 rounded">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Name *</label>
          <input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full text-sm px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. Butter" />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Quantity</label>
          <input type="text" value={formData.quantity} onChange={e => setFormData(p => ({ ...p, quantity: e.target.value }))} className="w-full text-sm px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. 1 cup" />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Substitute *</label>
          <input type="text" value={formData.substitute} onChange={e => setFormData(p => ({ ...p, substitute: e.target.value }))} className="w-full text-sm px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. Coconut Oil" />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Source Evidence</label>
          <input type="text" value={formData.source} onChange={e => setFormData(p => ({ ...p, source: e.target.value }))} className="w-full text-sm px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. Recipe Blog" />
        </div>
        <div className="col-span-2">
          <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Status</label>
          <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} className="w-full text-sm px-2.5 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
            <option value="draft">Draft</option>
            <option value="empty">Empty</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-gray-200/50 mt-4">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors">Cancel</button>
        <button type="submit" className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors shadow-sm">Save Record</button>
      </div>
    </form>
  )
}
