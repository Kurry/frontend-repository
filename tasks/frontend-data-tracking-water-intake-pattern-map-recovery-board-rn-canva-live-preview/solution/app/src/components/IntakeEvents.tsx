import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useStore } from '../store'
import type { EventStatus, IntakeEvent } from '../types'
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react'

export function IntakeEvents() {
  const { state, dispatch } = useStore()
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{title: string, amount: number, status: EventStatus}>({ title: '', amount: 0, status: 'draft' })
  const [errors, setErrors] = useState<{title?: string, amount?: string}>({})

  const filteredRecords = state.filter === 'all'
    ? state.records
    : state.records.filter(r => r.status === state.filter)

  const handleEdit = (record: IntakeEvent) => {
    setIsEditing(record.id)
    setEditForm({ title: record.title, amount: record.amount, status: record.status })
    setErrors({})
  }

  const validate = () => {
    const newErrors: {title?: string, amount?: string} = {}
    if (!editForm.title.trim()) newErrors.title = 'Title is required'
    if (editForm.amount < 0 || editForm.amount > 5000) newErrors.amount = 'Amount must be between 0 and 5000'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = (id: string) => {
    if (!validate()) return

    dispatch({
      type: 'UPDATE_RECORD',
      record: { id, ...editForm }
    })
    setIsEditing(null)
  }

  const handleCreate = () => {
    const newId = uuidv4()
    dispatch({
      type: 'ADD_RECORD',
      record: { id: newId, title: 'New Intake', amount: 0, status: 'draft' }
    })
    setIsEditing(newId)
    setEditForm({ title: 'New Intake', amount: 0, status: 'draft' })
    setErrors({})
  }

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Intake Events</h2>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> Add Event
        </button>
      </div>

      <div className="flex gap-2 text-sm">
        {(['all', 'empty', 'draft', 'ready', 'changed', 'archived'] as const).map(f => (
          <button
            key={f}
            onClick={() => dispatch({ type: 'SET_FILTER', filter: f })}
            className={`px-3 py-1 rounded-full border ${state.filter === f ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded border border-dashed">
            No events found. Click "Add Event" to create one.
          </div>
        ) : (
          filteredRecords.map(record => (
            <div
              key={record.id}
              className={`flex items-center justify-between p-3 border rounded ${state.selectedRecordId === record.id ? 'border-blue-500 bg-blue-50' : 'bg-white'} hover:border-gray-400 transition-colors cursor-pointer`}
              onClick={() => {
                if (isEditing !== record.id) {
                  dispatch({ type: 'SELECT_RECORD', id: record.id })
                }
              }}
            >
              {isEditing === record.id ? (
                <div className="flex gap-4 items-start w-full">
                  <div className="flex flex-col flex-1 gap-1">
                    <input
                      value={editForm.title}
                      onChange={e => setEditForm(prev => ({...prev, title: e.target.value}))}
                      className={`border p-1 rounded ${errors.title ? 'border-red-500' : ''}`}
                      placeholder="Title"
                      onClick={e => e.stopPropagation()}
                    />
                    {errors.title && <span className="text-xs text-red-500">{errors.title}</span>}
                  </div>
                  <div className="flex flex-col w-24 gap-1">
                    <input
                      type="number"
                      value={editForm.amount}
                      onChange={e => setEditForm(prev => ({...prev, amount: Number(e.target.value)}))}
                      className={`border p-1 rounded ${errors.amount ? 'border-red-500' : ''}`}
                      placeholder="Amount"
                      onClick={e => e.stopPropagation()}
                    />
                    {errors.amount && <span className="text-xs text-red-500">{errors.amount}</span>}
                  </div>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm(prev => ({...prev, status: e.target.value as EventStatus}))}
                    className="border p-1 rounded w-32"
                    onClick={e => e.stopPropagation()}
                  >
                    <option value="empty">Empty</option>
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="changed">Changed</option>
                    <option value="archived">Archived</option>
                  </select>
                  <div className="flex gap-2 ml-auto" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleSave(record.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                      <Check size={18} />
                    </button>
                    <button onClick={() => setIsEditing(null)} className="p-1 text-gray-500 hover:bg-gray-100 rounded">
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <span className="font-medium min-w-32">{record.title}</span>
                    <span className="text-gray-600 w-16 text-right">{record.amount}ml</span>
                    <span className={`text-xs px-2 py-1 rounded-full border
                      ${record.status === 'ready' ? 'bg-green-50 border-green-200 text-green-700' : ''}
                      ${record.status === 'draft' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : ''}
                      ${record.status === 'empty' ? 'bg-red-50 border-red-200 text-red-700' : ''}
                      ${record.status === 'changed' ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}
                      ${record.status === 'archived' ? 'bg-gray-100 border-gray-300 text-gray-600' : ''}
                    `}>
                      {record.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(record) }}
                      className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Are you sure you want to delete this event?')) {
                          dispatch({ type: 'DELETE_RECORD', id: record.id })
                        }
                      }}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
