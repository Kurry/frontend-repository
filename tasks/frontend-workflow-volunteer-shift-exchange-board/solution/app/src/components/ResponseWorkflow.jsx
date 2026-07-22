import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setResponse, checkStale, approveAndCommit, rollback } from '../store/exchangeSlice'
import { commitExchange } from '../store/rosterSlice'

export default function ResponseWorkflow() {
  const dispatch = useDispatch()
  const exchange = useSelector(state => state.exchange)
  const roster = useSelector(state => state.roster)

  const participants = Array.from(new Set(exchange.edges.flatMap(e => [e.sourceVolunteerId, e.targetVolunteerId])))

  const handleCommit = (simulateFailure = false) => {
    dispatch(approveAndCommit({ simulateFailure }))
    if (!simulateFailure) {
      dispatch(commitExchange({ edges: exchange.edges }))
    }
  }

  if (exchange.edges.length === 0) return null

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
      <h2 className="text-xl font-semibold mb-4">Response Workflow</h2>

      <div className="mb-4 text-sm">
        Status: <span className="font-mono bg-stone-100 px-2 py-1 rounded">{exchange.status}</span>
      </div>

      <div className="space-y-3 mb-6">
        {participants.map(pId => {
          const v = roster.volunteers.find(v => v.id === pId)
          const response = exchange.responses[pId]

          return (
            <div key={pId} className="flex items-center justify-between text-sm">
              <span className="font-medium">{v.name}</span>
              {['sent', 'viewed'].includes(response) ? (
                <div className="flex gap-2">
                  <button onClick={() => dispatch(setResponse({ volunteerId: pId, response: 'accepted'}))} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Accept</button>
                  <button onClick={() => dispatch(setResponse({ volunteerId: pId, response: 'declined'}))} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Decline</button>
                </div>
              ) : (
                <span className={`px-2 py-1 rounded text-xs ${response === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'}`}>
                  {response}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="space-y-2 border-t pt-4">
        <h3 className="font-semibold text-sm">Coordinator Actions</h3>

        {exchange.status === 'awaiting_approval' && (
          <div className="flex flex-col gap-2">
            <button onClick={() => handleCommit(false)} className="w-full py-2 bg-green-600 text-white rounded text-sm font-medium">Approve & Atomic Commit</button>
            <button onClick={() => handleCommit(true)} className="w-full py-2 bg-red-600 text-white rounded text-sm font-medium">Simulate Partial Failure</button>
            <button onClick={() => dispatch(checkStale({ rosterState: roster }))} className="w-full py-2 bg-yellow-500 text-white rounded text-sm font-medium">Check Stale Base (Against Checksum)</button>
          </div>
        )}

        {exchange.status === 'stale' && (
          <div className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
            Base is stale. Roster has changed. Please revise.
          </div>
        )}

        {exchange.status === 'failed' && (
          <div className="flex flex-col gap-2">
            <div className="text-sm text-red-700 bg-red-50 p-2 rounded">Partial write failure detected.</div>
            <button onClick={() => dispatch(rollback())} className="w-full py-2 bg-stone-800 text-white rounded text-sm font-medium">Rollback</button>
            <button onClick={() => handleCommit(false)} className="w-full py-2 bg-blue-600 text-white rounded text-sm font-medium">Retry Atomic Commit</button>
          </div>
        )}

        {exchange.status === 'rolled-back' && (
           <button onClick={() => handleCommit(false)} className="w-full py-2 bg-blue-600 text-white rounded text-sm font-medium">Retry Atomic Commit</button>
        )}
      </div>
    </div>
  )
}
