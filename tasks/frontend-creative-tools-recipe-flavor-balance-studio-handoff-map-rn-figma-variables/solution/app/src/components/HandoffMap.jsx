import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { motion, useReducedMotion } from 'framer-motion'
import { Undo } from 'lucide-react'

export function HandoffMap() {
  const { records, selectedRecordId, connectOwnerAndUpdateReadiness, undo, history } = useStore()
  const [selectedOwner, setSelectedOwner] = useState('')

  const shouldReduceMotion = useReducedMotion()
  const selectedRecord = records.find(r => r.id === selectedRecordId)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo])

  return (
    <div className="flex flex-col h-full bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Handoff Map</h2>
        <button
          onClick={undo}
          disabled={history.length === 0}
          className={`flex items-center gap-2 px-3 py-1.5 rounded ${history.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500'}`}
          aria-label="Undo last mutation"
        >
          <Undo size={16} /> Undo
        </button>
      </div>

      <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg bg-white relative overflow-hidden p-6 flex flex-col items-center justify-center">
        {!selectedRecord ? (
          <div className="text-gray-400 text-center">
            <p className="text-lg">Select a record from the collection</p>
            <p className="text-sm">to connect it to a handoff owner</p>
          </div>
        ) : (
          <motion.div
            key={selectedRecord.id}
            initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
            transition={shouldReduceMotion ? { duration: 0 } : undefined}
            className="w-full max-w-md bg-white shadow-xl rounded-xl border border-gray-200 overflow-hidden"
          >
            <div className={`p-4 text-white bg-[var(--color-status-${selectedRecord.status})] flex justify-between items-center`}>
              <h3 className="font-bold text-lg">{selectedRecord.name}</h3>
              <span className="px-2 py-1 bg-white/20 rounded text-sm uppercase tracking-wider">{selectedRecord.status}</span>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Sweetness:</span> {selectedRecord.sweetness}</div>
                <div><span className="text-gray-500">Acidity:</span> {selectedRecord.acidity}</div>
                <div><span className="text-gray-500">Saltiness:</span> {selectedRecord.saltiness}</div>
                <div><span className="text-gray-500">Bitterness:</span> {selectedRecord.bitterness}</div>
                <div><span className="text-gray-500">Umami:</span> {selectedRecord.umami}</div>
                <div><span className="text-gray-500">Owner:</span> {selectedRecord.handoffOwner || 'None'}</div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Handoff Owner</label>
                <div className="flex gap-2">
                  <select
                    value={selectedOwner}
                    onChange={e => setSelectedOwner(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    aria-label="Select handoff owner"
                  >
                    <option value="">Select owner...</option>
                    <option value="pastry-chef">Pastry Chef</option>
                    <option value="baker">Baker</option>
                    <option value="sous-chef">Sous Chef</option>
                    <option value="executive-chef">Executive Chef</option>
                  </select>
                  <button
                    onClick={() => connectOwnerAndUpdateReadiness(selectedRecord.id, selectedOwner)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                    aria-label="Connect and update readiness"
                  >
                    Connect
                  </button>
                </div>
                {selectedRecord.status === 'conflict' && (
                  <p className="text-red-500 text-sm mt-2">Conflicting or incomplete mutation rejected. Please select an owner.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
