import { useStore } from '../store'
import type { EventStatus } from '../types'
import { Undo, AlertCircle, CheckCircle2 } from 'lucide-react'

export function RecoveryBoard() {
  const { state, dispatch } = useStore()

  const selectedRecord = state.selectedRecordId
    ? state.records.find(r => r.id === state.selectedRecordId)
    : null

  const handleStatusChange = (status: EventStatus) => {
    if (!selectedRecord) return
    dispatch({ type: 'MOVE_RECOVERY', id: selectedRecord.id, status })
  }

  const handleUndo = () => {
    dispatch({ type: 'UNDO' })
  }

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-slate-50 shadow-sm h-full">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <AlertCircle className="text-amber-500" />
          Recovery Board
        </h2>
        <button
          onClick={handleUndo}
          disabled={state.history.length === 0}
          className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <Undo size={16} /> Undo
        </button>
      </div>

      <div className="flex-1 bg-white border rounded-lg p-6 flex flex-col justify-center items-center">
        {!selectedRecord ? (
          <div className="text-center text-gray-400 max-w-sm">
            <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>Select an event from the Intake Events list to move it into a recovery path and repair downstream consequences.</p>
          </div>
        ) : (
          <div className="w-full max-w-md flex flex-col gap-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">{selectedRecord.title}</h3>
              <p className="text-gray-500">{selectedRecord.amount}ml</p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="text-sm font-medium text-gray-700 text-center uppercase tracking-wider mb-2">
                Move to Status
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(['empty', 'draft', 'ready', 'changed', 'archived'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all ${
                      selectedRecord.status === status
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {selectedRecord.status === status && <CheckCircle2 size={16} className="text-blue-500" />}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 p-4 bg-slate-50 border rounded text-sm text-gray-600">
              <p>
                <strong>Current Status:</strong>{' '}
                <span className="capitalize">{selectedRecord.status}</span>
              </p>
              <p className="mt-1 text-xs opacity-75">
                Moving a failed record updates its linked representation across all views and artifacts immediately.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
