import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { addEdge } from '../store/exchangeSlice'

export default function RosterCanvas() {
  const dispatch = useDispatch()
  const roster = useSelector(state => state.roster)
  const exchange = useSelector(state => state.exchange)

  const [dragState, setDragState] = useState(null)

  const getShiftsForVolunteer = (vId) => {
    return roster.shifts.filter(s => roster.ownership[s.id] === vId)
  }

  const getUnassignedShifts = () => {
    return roster.shifts.filter(s => !roster.ownership[s.id])
  }

  const handleDragStart = (e, shiftId, sourceVolunteerId) => {
    if (exchange.status !== 'draft') return
    setDragState({ shiftId, sourceVolunteerId })
    e.dataTransfer.setData('shiftId', shiftId)
    e.dataTransfer.setData('sourceVolunteerId', sourceVolunteerId)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e, targetVolunteerId) => {
    e.preventDefault()
    if (!dragState || exchange.status !== 'draft') return

    if (dragState.sourceVolunteerId !== targetVolunteerId) {
      dispatch(addEdge({
        shiftId: dragState.shiftId,
        sourceVolunteerId: dragState.sourceVolunteerId,
        targetVolunteerId
      }))
    }
    setDragState(null)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
      <h2 className="text-xl font-semibold mb-4">Roster Canvas & Coverage</h2>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-2">Unassigned Shifts (Waitlist Routing)</h3>
        <div className="flex gap-2">
          {getUnassignedShifts().map(shift => (
            <div key={shift.id} className="p-3 bg-red-50 border border-red-200 rounded shadow-sm text-sm">
              <div className="font-bold">{shift.role}</div>
              <div>{shift.venue}</div>
              <div className="text-stone-500">{shift.time}</div>
            </div>
          ))}
          {getUnassignedShifts().length === 0 && <div className="text-sm text-stone-400">None</div>}
        </div>
      </div>

      <div className="space-y-4">
        {roster.volunteers.map(v => (
          <div
            key={v.id}
            className="border border-stone-200 rounded p-4 flex gap-4 min-h-[100px]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, v.id)}
          >
            <div className="w-48 shrink-0">
              <div className="font-bold text-lg">{v.name}</div>
              <div className="text-xs text-stone-500">Skills: {v.skills.join(', ')}</div>
            </div>

            <div className="flex-1 flex gap-2 overflow-x-auto pb-2">
              {getShiftsForVolunteer(v.id).map(shift => {
                const isProposedAway = exchange.edges.some(e => e.shiftId === shift.id && e.sourceVolunteerId === v.id)
                const isReceived = exchange.edges.some(e => e.shiftId === shift.id && e.targetVolunteerId === v.id)

                return (
                  <div
                    key={shift.id}
                    draggable={exchange.status === 'draft'}
                    onDragStart={(e) => handleDragStart(e, shift.id, v.id)}
                    className={`p-3 border rounded shadow-sm text-sm cursor-grab active:cursor-grabbing w-40 shrink-0
                      ${isProposedAway ? 'opacity-50 border-dashed border-red-400' : 'bg-white border-stone-200'}
                    `}
                  >
                    <div className="font-bold">{shift.role}</div>
                    <div>{shift.venue}</div>
                    <div className="text-stone-500">{shift.time}</div>
                  </div>
                )
              })}

              {/* Show incoming proposed shifts */}
              {exchange.edges.filter(e => e.targetVolunteerId === v.id).map((e, idx) => {
                const shift = roster.shifts.find(s => s.id === e.shiftId)
                return (
                  <div key={`incoming-${idx}`} className="p-3 border-2 border-dashed border-blue-400 bg-blue-50 rounded shadow-sm text-sm w-40 shrink-0 opacity-80">
                    <div className="font-bold text-blue-800">{shift.role} (Proposed)</div>
                    <div>{shift.venue}</div>
                    <div className="text-blue-600">{shift.time}</div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
