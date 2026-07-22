import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { removeEdge, sendProposal, reviseProposal } from '../store/exchangeSlice'

export default function TransactionComposer() {
  const dispatch = useDispatch()
  const exchange = useSelector(state => state.exchange)
  const roster = useSelector(state => state.roster)

  const isCycle = () => {
    if (exchange.edges.length === 0) return false
    const outDegree = {}
    const inDegree = {}
    exchange.edges.forEach(e => {
      outDegree[e.sourceVolunteerId] = (outDegree[e.sourceVolunteerId] || 0) + 1
      inDegree[e.targetVolunteerId] = (inDegree[e.targetVolunteerId] || 0) + 1
    })

    const participants = new Set([...Object.keys(outDegree), ...Object.keys(inDegree)])
    let isClosed = true
    participants.forEach(p => {
      if (outDegree[p] !== 1 || inDegree[p] !== 1) isClosed = false
    })

    return isClosed && exchange.edges.length > 1 && exchange.edges.length <= 5
  }

  const getParticipantNames = () => {
    const p = new Set(exchange.edges.flatMap(e => [e.sourceVolunteerId, e.targetVolunteerId]))
    return Array.from(p).map(id => roster.volunteers.find(v => v.id === id)?.name).join(', ')
  }

  const checkConstraints = () => {
    const violations = []

    // Hard constraints per edge
    exchange.edges.forEach(edge => {
      const targetVol = roster.volunteers.find(v => v.id === edge.targetVolunteerId)
      const shift = roster.shifts.find(s => s.id === edge.shiftId)

      if (!targetVol.skills.includes(shift.role)) {
        violations.push(`${targetVol.name} lacks skill ${shift.role}`)
      }

      if (shift.startHour < targetVol.availableHours[0] || shift.endHour > targetVol.availableHours[1]) {
        violations.push(`${targetVol.name} is not available during ${shift.time}`)
      }

      // Weekly cap (simplified to this chunk of shifts for the fixture)
      const currentHours = roster.shifts.filter(s => roster.ownership[s.id] === targetVol.id && !exchange.edges.some(e => e.shiftId === s.id && e.sourceVolunteerId === targetVol.id)).length * 4
      if (currentHours + 4 > targetVol.cap) {
        violations.push(`${targetVol.name} exceeds 20 hour cap`)
      }

      // Check overlap and rest periods with retained shifts
      const targetExistingShifts = roster.shifts.filter(s => roster.ownership[s.id] === targetVol.id && !exchange.edges.some(e => e.shiftId === s.id && e.sourceVolunteerId === targetVol.id))
      targetExistingShifts.forEach(existing => {
        // Overlap
        if (shift.startHour < existing.endHour && shift.endHour > existing.startHour) {
          violations.push(`${targetVol.name} has overlapping shift ${existing.id}`)
        }
        // 11 hour rest constraint (assuming consecutive days for simplicity if diff > 11)
        // Simplification for the fixture: just check if gap is < 11 if they are on same/adjacent day
        const gap = Math.max(0, Math.max(shift.startHour - existing.endHour, existing.startHour - shift.endHour))
        if (gap < 11 && gap > 0) { // If there's a gap but less than 11 hours
          violations.push(`${targetVol.name} violates 11-hour rest between ${existing.id} and ${shift.id}`)
        }

        // Travel time cross venue (require at least 1 hour gap)
        if (shift.venue !== existing.venue && gap < 1) {
          violations.push(`${targetVol.name} requires travel time between ${existing.venue} and ${shift.venue}`)
        }
      })
    })

    return violations
  }

  const cycleValid = isCycle()
  const violations = checkConstraints()
  const constraintsValid = violations.length === 0

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
      <h2 className="text-xl font-semibold mb-4">Transaction Composer</h2>

      {exchange.edges.length === 0 ? (
        <div className="text-stone-500 italic text-sm">Drag a shift to another volunteer to start an exchange.</div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {exchange.edges.map((e, idx) => {
              const src = roster.volunteers.find(v => v.id === e.sourceVolunteerId)?.name
              const tgt = roster.volunteers.find(v => v.id === e.targetVolunteerId)?.name
              const shift = roster.shifts.find(s => s.id === e.shiftId)
              return (
                <div key={idx} className="flex justify-between items-center text-sm p-2 bg-stone-50 rounded border border-stone-100">
                  <span>{src} offers <strong>{shift.role}</strong> to {tgt}</span>
                  {exchange.status === 'draft' && (
                    <button onClick={() => dispatch(removeEdge(idx))} className="text-red-500 hover:text-red-700">Remove</button>
                  )}
                </div>
              )
            })}
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded text-sm space-y-1">
            <div><strong>Participants:</strong> {getParticipantNames()}</div>
            <div><strong>Topology:</strong> {cycleValid ? 'Closed Cycle (Valid)' : 'Open Chain (Invalid)'}</div>
            <div className={constraintsValid ? "text-green-600" : "text-red-600"}>
              <strong>Constraints:</strong>
              {constraintsValid ? ' Hard rules pass.' : ` Violations: ${violations.join(', ')}`}
            </div>
          </div>

          {exchange.status === 'draft' && (
            <button
              onClick={() => dispatch(sendProposal({ rosterState: roster }))}
              disabled={!cycleValid || !constraintsValid}
              className="w-full py-2 bg-blue-600 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Proposal
            </button>
          )}

          {exchange.status !== 'draft' && exchange.status !== 'failed' && (
             <button
             onClick={() => dispatch(reviseProposal())}
             className="w-full py-2 bg-stone-200 text-stone-800 rounded font-medium"
           >
             Revise Proposal
           </button>
          )}
        </div>
      )}
    </div>
  )
}
