import React from 'react'
import { useSelector } from 'react-redux'

export default function FairnessWaitlist() {
  const roster = useSelector(state => state.roster)

  const unassignedShifts = roster.shifts.filter(s => !roster.ownership[s.id])

  const calculateHours = (vId) => {
    return roster.shifts.filter(s => roster.ownership[s.id] === vId).length * 4
  }

  const sortedWaitlist = [...roster.volunteers].sort((a, b) => {
    const hoursA = calculateHours(a.id)
    const hoursB = calculateHours(b.id)
    if (hoursA !== hoursB) return hoursA - hoursB // Ascending hours (priority to less hours)
    return a.name.localeCompare(b.name) // deterministic tie breaker
  })

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
      <h2 className="text-xl font-semibold mb-4">Fairness & Waitlist Routing</h2>

      <div className="mb-4 text-sm">
        <h3 className="font-semibold mb-2">Waitlist Priority (Deterministic)</h3>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {sortedWaitlist.slice(0, 5).map((v, i) => (
             <div key={v.id} className="flex justify-between border-b pb-1">
               <span>{i + 1}. {v.name}</span>
               <span className="text-stone-500">{calculateHours(v.id)} hrs</span>
             </div>
          ))}
        </div>
      </div>

      <div className="text-sm">
        <h3 className="font-semibold mb-2">Automated Waitlist Proposals</h3>
        {unassignedShifts.length === 0 ? (
          <div className="text-stone-500 italic">No open shifts to route.</div>
        ) : (
          <div className="space-y-2">
            {unassignedShifts.map(shift => {
              // Route to the first eligible volunteer in priority list
              const eligible = sortedWaitlist.find(v => {
                 if (!v.skills.includes(shift.role)) return false;
                 if (shift.startHour < v.availableHours[0] || shift.endHour > v.availableHours[1]) return false;
                 // check overlap
                 const hasOverlap = roster.shifts.some(s =>
                   roster.ownership[s.id] === v.id &&
                   (shift.startHour < s.endHour && shift.endHour > s.startHour)
                 )
                 return !hasOverlap
              });

              return (
                <div key={shift.id} className="p-2 bg-blue-50 border border-blue-100 rounded flex justify-between">
                  <span>{shift.role} at {shift.venue}</span>
                  {eligible ? (
                    <span className="font-medium text-blue-700">Routes to: {eligible.name}</span>
                  ) : (
                    <span className="text-red-500">No eligible volunteers</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
