import React, { useState } from 'react'
import { useSelector } from 'react-redux'

export default function ExportPanel() {
  const roster = useSelector(state => state.roster)
  const exchange = useSelector(state => state.exchange)
  const [activeTab, setActiveTab] = useState('json')

  const generateJSON = () => {
    return JSON.stringify({
      schemaVersion: "volunteer-exchange-roster/v1",
      timezone: "UTC",
      volunteers: roster.volunteers,
      shifts: roster.shifts,
      ownership: roster.ownership,
      commitHistory: roster.commitHistory,
      exportedAt: new Date().toISOString()
    }, null, 2)
  }

  const generateCSV = () => {
    let csv = "Shift ID,Role,Venue,Time,Volunteer ID,Volunteer Name\n"
    roster.shifts.forEach(s => {
      const vId = roster.ownership[s.id]
      const vName = vId ? roster.volunteers.find(v => v.id === vId).name : 'Unassigned'
      csv += `${s.id},${s.role},${s.venue},${s.time},${vId || ''},${vName}\n`
    })
    return csv
  }

  const generateICS = () => {
    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Shift Exchange Board//EN\n"
    roster.shifts.forEach(s => {
      const vId = roster.ownership[s.id]
      if (vId) {
        const v = roster.volunteers.find(v => v.id === vId)
        ics += `BEGIN:VEVENT\nUID:${s.id}\nSUMMARY:${s.role} at ${s.venue}\nATTENDEE;CN=${v.name}:mailto:placeholder@example.com\nEND:VEVENT\n`
      }
    })
    ics += "END:VCALENDAR"
    return ics
  }

  const generateSVG = () => {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200">`
    svg += `<rect width="400" height="200" fill="#f8fafc" />`
    exchange.edges.forEach((edge, idx) => {
      const srcName = roster.volunteers.find(v => v.id === edge.sourceVolunteerId)?.name
      const tgtName = roster.volunteers.find(v => v.id === edge.targetVolunteerId)?.name
      svg += `<text x="10" y="${20 + idx * 20}" fill="black" font-family="sans-serif">${srcName} -> ${tgtName} (${edge.shiftId})</text>`
    })
    svg += `</svg>`
    return svg
  }

  const handleDownload = () => {
    let content = ''
    let filename = ''
    let mime = 'text/plain'

    if (activeTab === 'json') {
      content = generateJSON()
      filename = 'roster.json'
      mime = 'application/json'
    } else if (activeTab === 'csv') {
      content = generateCSV()
      filename = 'ledger.csv'
      mime = 'text/csv'
    } else if (activeTab === 'ics') {
      content = generateICS()
      filename = 'roster.ics'
      mime = 'text/calendar'
    } else if (activeTab === 'svg') {
      content = generateSVG()
      filename = 'exchange.svg'
      mime = 'image/svg+xml'
    }

    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const getPreviewContent = () => {
    if (activeTab === 'json') return generateJSON()
    if (activeTab === 'csv') return generateCSV()
    if (activeTab === 'ics') return generateICS()
    if (activeTab === 'svg') return generateSVG()
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
      <h2 className="text-xl font-semibold mb-4">Export Artifacts</h2>

      <div className="flex gap-2 mb-4 border-b pb-2">
        {['json', 'csv', 'ics', 'svg'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 text-sm rounded ${activeTab === tab ? 'bg-stone-800 text-white' : 'bg-stone-100'}`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="bg-stone-900 text-stone-100 p-3 rounded text-xs font-mono h-40 overflow-auto whitespace-pre-wrap mb-4">
        {getPreviewContent()}
      </div>

      <div className="flex gap-2">
        <button onClick={handleDownload} className="flex-1 py-2 bg-blue-600 text-white rounded font-medium text-sm">Download</button>
        <button onClick={() => navigator.clipboard.writeText(getPreviewContent())} className="flex-1 py-2 bg-stone-200 text-stone-800 rounded font-medium text-sm">Copy</button>
      </div>
    </div>
  )
}
