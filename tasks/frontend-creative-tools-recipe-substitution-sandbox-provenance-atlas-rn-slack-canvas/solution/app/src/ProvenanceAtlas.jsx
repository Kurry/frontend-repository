import React, { useEffect } from 'react'
import { useStore } from './store'
import { Undo2, ShieldAlert, CheckCircle, ExternalLink, XCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export function ProvenanceAtlas() {
  const { records, selectedRecordId, traceAndQuarantine, undoLastMutation, history } = useStore()

  const selectedRecord = records.find(r => r.id === selectedRecordId)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        undoLastMutation()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undoLastMutation])

  if (!selectedRecord) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
        <ShieldAlert className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm font-medium">No record selected</p>
        <p className="text-xs mt-1">Select an ingredient to view its provenance and trace its source lineage.</p>
      </div>
    )
  }

  const isQuarantined = selectedRecord.quarantine

  return (
    <div className="h-full flex flex-col bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-gray-400" />
          Provenance Atlas
        </h2>
        <button
          onClick={undoLastMutation}
          disabled={history.length === 0}
          className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors rounded-md hover:bg-gray-100"
          title="Undo (Ctrl+Z)"
          aria-label="Undo last action"
        >
          <Undo2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 flex-1 overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Subject</h3>
          <div className="text-lg font-medium text-gray-900">{selectedRecord.name}</div>
          <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <span>Substitute:</span>
            <span className="font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-xs">{selectedRecord.substitute}</span>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Lineage Trace</h3>
          <div className="relative border-l-2 border-gray-100 pl-4 py-1 space-y-4">
            <div className="relative">
              <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-400 border-2 border-white" />
              <div className="text-sm font-medium text-gray-700">Source Verification</div>
              <div className="text-xs text-gray-500 mt-0.5">Origin: {selectedRecord.source}</div>
            </div>
            <div className="relative">
              <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-400 border-2 border-white" />
              <div className="text-sm font-medium text-gray-700">Reason Encoding</div>
              <div className="text-xs text-gray-500 mt-0.5">{selectedRecord.reason}</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
           <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Decision Surface</h3>
           <AnimatePresence mode="wait">
             {isQuarantined ? (
               <motion.div
                 key="quarantined"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="flex flex-col items-center justify-center py-4"
               >
                 <XCircle className="w-8 h-8 text-red-500 mb-2" />
                 <div className="text-sm font-medium text-red-700">Lineage Quarantined</div>
                 <div className="text-xs text-red-500/70 mt-1 text-center">This substitute is marked as unsafe and will not be used in derived outputs.</div>
               </motion.div>
             ) : (
               <motion.div
                 key="safe"
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="space-y-3"
               >
                 <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-2 rounded-md">
                   <CheckCircle className="w-4 h-4" />
                   Lineage appears valid
                 </div>
                 <button
                   onClick={() => traceAndQuarantine(selectedRecord.id)}
                   className="w-full py-2 px-4 bg-white border border-red-200 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 hover:border-red-300 transition-colors flex items-center justify-center gap-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
                   aria-label={`Trace and quarantine ${selectedRecord.name}`}
                 >
                   <ShieldAlert className="w-4 h-4" />
                   Trace & Quarantine
                 </button>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
