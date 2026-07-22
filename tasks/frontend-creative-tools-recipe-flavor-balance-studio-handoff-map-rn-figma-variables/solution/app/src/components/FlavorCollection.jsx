import React, { useState } from 'react'
import { useStore, flavorComponentSchema } from '../store'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react'

export function FlavorCollection() {
  const { records, deleteRecord, addRecord, updateRecord, setSelectedRecordId, selectedRecordId } = useStore()
  const [filter, setFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})

  const shouldReduceMotion = useReducedMotion()

  const filteredRecords = records.filter(r => filter === 'all' || r.status === filter)

  const handleEdit = (record) => {
    setEditingId(record.id)
    setFormData(record)
    setErrors({})
  }

  const handleSave = () => {
    try {
      const parsed = flavorComponentSchema.parse(formData)
      if (records.some(r => r.id === parsed.id && r.id !== editingId)) {
        setErrors({ id: 'ID must be unique' })
        return
      }

      if (editingId === 'new') {
        addRecord(parsed)
      } else {
        updateRecord(editingId, parsed)
      }
      setEditingId(null)
      setErrors({})
    } catch (e) {
      if (e.errors) {
        const newErrors = {}
        e.errors.forEach(err => {
          newErrors[err.path[0]] = err.message
        })
        setErrors(newErrors)
      }
    }
  }

  const startNew = () => {
    setEditingId('new')
    setFormData({
      id: Date.now().toString(),
      name: '',
      description: '',
      sweetness: 5,
      acidity: 5,
      saltiness: 5,
      bitterness: 5,
      umami: 5,
      status: 'draft',
      handoffOwner: null
    })
    setErrors({})
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Flavor Components</h2>
        <button onClick={startNew} className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-500" aria-label="Add new record">
          <Plus size={16} />
        </button>
      </div>
      <div className="p-4 border-b border-gray-200">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          aria-label="Filter records by status"
        >
          <option value="all">All Statuses</option>
          <option value="empty">Empty</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
          <option value="conflict">Conflict</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence>
          {editingId === 'new' && (
             <motion.div
               initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
               animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
               exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
               className="p-3 border-2 border-blue-400 rounded bg-blue-50 space-y-2"
             >
               <input type="text" placeholder="ID" className="w-full p-1 border rounded" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} />
               {errors.id && <p className="text-red-500 text-xs">{errors.id}</p>}
               <input type="text" placeholder="Name" className="w-full p-1 border rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
               {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
               <div className="flex gap-2">
                 <button onClick={handleSave} className="flex-1 bg-green-500 text-white p-1 rounded flex justify-center items-center"><Check size={16}/></button>
                 <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-500 text-white p-1 rounded flex justify-center items-center"><X size={16}/></button>
               </div>
             </motion.div>
          )}
          {filteredRecords.map(record => (
            <motion.div
              layout={!shouldReduceMotion}
              key={record.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={shouldReduceMotion ? { duration: 0 } : undefined}
              className={`p-3 border rounded cursor-pointer transition-colors ${selectedRecordId === record.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
              onClick={() => setSelectedRecordId(record.id)}
            >
              {editingId === record.id ? (
                <div className="space-y-2" onClick={e => e.stopPropagation()}>
                   <input type="text" className="w-full p-1 border rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                   {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                   <div className="grid grid-cols-2 gap-2 text-xs">
                     <div>Sweetness: <input type="number" className="w-full border rounded" value={formData.sweetness} onChange={e => setFormData({...formData, sweetness: parseInt(e.target.value)})} />
                        {errors.sweetness && <p className="text-red-500 text-xs">{errors.sweetness}</p>}
                     </div>
                     <div>Acidity: <input type="number" className="w-full border rounded" value={formData.acidity} onChange={e => setFormData({...formData, acidity: parseInt(e.target.value)})} />
                        {errors.acidity && <p className="text-red-500 text-xs">{errors.acidity}</p>}
                     </div>
                     <div>Saltiness: <input type="number" className="w-full border rounded" value={formData.saltiness} onChange={e => setFormData({...formData, saltiness: parseInt(e.target.value)})} />
                        {errors.saltiness && <p className="text-red-500 text-xs">{errors.saltiness}</p>}
                     </div>
                     <div>Bitterness: <input type="number" className="w-full border rounded" value={formData.bitterness} onChange={e => setFormData({...formData, bitterness: parseInt(e.target.value)})} />
                        {errors.bitterness && <p className="text-red-500 text-xs">{errors.bitterness}</p>}
                     </div>
                     <div>Umami: <input type="number" className="w-full border rounded" value={formData.umami} onChange={e => setFormData({...formData, umami: parseInt(e.target.value)})} />
                        {errors.umami && <p className="text-red-500 text-xs">{errors.umami}</p>}
                     </div>
                   </div>
                   <div className="flex gap-2 mt-2">
                     <button onClick={handleSave} className="flex-1 bg-green-500 text-white p-1 rounded"><Check size={16} className="mx-auto"/></button>
                     <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-500 text-white p-1 rounded"><X size={16} className="mx-auto"/></button>
                   </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{record.name}</div>
                    <div className="text-xs text-gray-500">ID: {record.id}</div>
                    <div className={`text-xs mt-1 inline-block px-2 py-0.5 rounded text-white bg-[var(--color-status-${record.status})]`}>
                      {record.status}
                    </div>
                  </div>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleEdit(record)} className="p-1 text-gray-500 hover:text-blue-500" aria-label="Edit record"><Edit2 size={14} /></button>
                    <button onClick={() => deleteRecord(record.id)} className="p-1 text-gray-500 hover:text-red-500" aria-label="Delete record"><Trash2 size={14} /></button>
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
