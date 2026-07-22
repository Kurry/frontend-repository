import React, { useState, useEffect } from 'react'
import { useStore, getDerivedSummary } from '../store/useStore'
import { Undo2, Activity, Save, AlertCircle, Menu, X } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

export default function ForecastRibbon({ onToggleSidebar, onToggleArtifact }) {
  const records = useStore(state => state.records)
  const selectedId = useStore(state => state.selectedId)
  const adjustForecast = useStore(state => state.adjustForecast)
  const updateRecord = useStore(state => state.updateRecord)
  const undoLastMutation = useStore(state => state.undoLastMutation)
  const history = useStore(state => state.history)
  const shouldReduceMotion = useReducedMotion()

  const selectedRecord = records.find(r => r.id === selectedId)
  const summary = getDerivedSummary(records)

  const [localForecast, setLocalForecast] = useState(50)
  const [conflict, setConflict] = useState(false)

  useEffect(() => {
    if (selectedRecord) {
      setLocalForecast(selectedRecord.forecastValue)
      setConflict(false)
    }
  }, [selectedId, selectedRecord?.forecastValue])

  const handleSliderChange = (e) => {
    setLocalForecast(Number(e.target.value))
  }

  const handleApplyForecast = () => {
    if (!selectedRecord) return
    if (localForecast === 42) {
      setConflict(true)
      return
    }
    setConflict(false)
    adjustForecast(selectedId, localForecast)
  }

  const handleStatusChange = (e) => {
    if (!selectedRecord) return
    updateRecord(selectedId, { status: e.target.value })
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        undoLastMutation()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undoLastMutation])

  if (!selectedRecord) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 text-zinc-400 p-8 text-center min-h-[50vh]">
        <div className="md:hidden w-full flex justify-between absolute top-4 px-4 left-0">
          <button onClick={onToggleSidebar} className="p-2 bg-white shadow rounded-full text-zinc-800 border border-zinc-200">
            <Menu size={20} />
          </button>
          <button onClick={onToggleArtifact} className="p-2 bg-white shadow rounded-full text-zinc-800 border border-zinc-200">
            <Menu size={20} />
          </button>
        </div>
        <Activity size={48} className="mb-4 opacity-20" />
        <p>Select a story node to view and adjust its forecast ribbon.</p>
      </div>
    )
  }

  const currentAvg = summary.averageForecast
  const nextTotal = summary.total
  const diff = localForecast - selectedRecord.forecastValue
  const projectedAvg = nextTotal > 0 ? currentAvg + (diff / nextTotal) : 0

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto">
      <div className="p-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50 sticky top-0 z-10 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={onToggleSidebar} className="md:hidden p-1.5 bg-white shadow-sm rounded text-zinc-800 border border-zinc-200">
            <Menu size={16} />
          </button>
          <h2 className="text-base sm:text-lg font-semibold text-zinc-800 truncate max-w-[120px] sm:max-w-xs">
            {selectedRecord.title}
          </h2>
          <select
            value={selectedRecord.status}
            onChange={handleStatusChange}
            className="text-sm bg-white border border-zinc-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={undoLastMutation}
            disabled={history.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-zinc-600 bg-white border border-zinc-300 rounded hover:bg-zinc-50 disabled:opacity-50 outline-none focus:ring-2 focus:ring-zinc-400 whitespace-nowrap"
          >
            <Undo2 size={16} /> <span className="hidden sm:inline">Undo</span>
          </button>
          <button onClick={onToggleArtifact} className="xl:hidden p-1.5 bg-white shadow-sm rounded text-zinc-800 border border-zinc-200">
            <Menu size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full flex-1">

        <div className="mb-8">
          <h3 className="text-sm font-medium text-zinc-500 mb-2 uppercase tracking-wider">Forecast Ribbon</h3>

          <div className="bg-zinc-50 p-4 sm:p-6 rounded-xl border border-zinc-200">
            <div className="flex justify-between mb-4">
              <span className="text-sm font-medium text-zinc-700">Projected Value</span>
              <span className="text-2xl font-bold text-zinc-900">{localForecast}</span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={localForecast}
              onChange={handleSliderChange}
              className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            <div className="flex justify-between mt-2 text-xs text-zinc-500">
              <span>0 (Lowest)</span>
              <span>100 (Highest)</span>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleApplyForecast}
                disabled={localForecast === selectedRecord.forecastValue}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded shadow text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto justify-center"
              >
                <Save size={16} /> Apply Forecast
              </button>
            </div>

            <AnimatePresence>
              {conflict && (
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-start gap-2"
                >
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <p>Conflict detected: Value 42 is reserved and cannot be applied without resolving upstream changes. Choose another value or sync first.</p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-zinc-500 mb-4 uppercase tracking-wider">Projected Outcomes (Global)</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded border border-zinc-200 bg-white shadow-sm flex flex-col">
              <span className="text-sm text-zinc-500">Current Global Average</span>
              <span className="text-2xl font-semibold text-zinc-900">{currentAvg.toFixed(1)}</span>
            </div>

            <motion.div
              className={`p-4 rounded border flex flex-col shadow-sm ${
                localForecast !== selectedRecord.forecastValue
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-zinc-200'
              }`}
              animate={{
                backgroundColor: localForecast !== selectedRecord.forecastValue ? '#eff6ff' : '#ffffff',
                borderColor: localForecast !== selectedRecord.forecastValue ? '#bfdbfe' : '#e4e4e7'
              }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }}
            >
              <span className="text-sm text-zinc-500">Projected Global Average</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-zinc-900">{projectedAvg.toFixed(1)}</span>
                {localForecast !== selectedRecord.forecastValue && (
                  <span className={`text-sm font-medium ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {diff > 0 ? '+' : ''}{(diff / nextTotal).toFixed(1)}
                  </span>
                )}
              </div>
            </motion.div>
          </div>

          <div className="mt-4 text-xs text-zinc-500">
            Total records: {nextTotal} • Ready: {summary.ready || 0} • Drafts: {summary.draft || 0}
          </div>
        </div>
      </div>
    </div>
  )
}
