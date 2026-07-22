import React, { useRef, useState } from 'react'
import { useStore, getDerivedSummary } from '../store/useStore'
import { exportArtifact, importArtifact } from '../utils/artifact'
import { Download, Upload, FileJson } from 'lucide-react'

export default function ArtifactPanel() {
  const records = useStore(state => state.records)
  const history = useStore(state => state.history)
  const importState = useStore(state => state.importState)
  const derived = getDerivedSummary(records)

  const fileInputRef = useRef(null)
  const [error, setError] = useState(null)

  const handleExport = () => {
    exportArtifact(records, derived, history)
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target.result
      const result = importArtifact(content)

      if (result.success) {
        // Regenerate exportedAt via our domain logic by loading records
        importState(result.data.records, result.data.history || [])
        setError(null)
      } else {
        setError(result.error)
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="w-64 bg-zinc-50 border-l border-zinc-200 p-4 flex flex-col h-full">
      <h2 className="text-sm font-semibold text-zinc-800 uppercase tracking-wider mb-4">Workspace Artifact</h2>

      <div className="bg-white p-3 rounded border border-zinc-200 mb-4 shadow-sm flex flex-col items-center justify-center text-zinc-500 py-6">
        <FileJson size={32} className="mb-2 text-zinc-400" />
        <span className="text-xs text-center">fiction-branches-v1.json</span>
      </div>

      <div className="space-y-2">
        <button
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-zinc-300 text-zinc-700 rounded text-sm hover:bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Download size={16} /> Export Artifact
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-zinc-300 text-zinc-700 rounded text-sm hover:bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Upload size={16} /> Import Artifact
        </button>
        <input
          type="file"
          accept=".json"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImport}
        />
      </div>

      {error && (
        <div className="mt-4 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200">
          {error}
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-zinc-200 text-xs text-zinc-500 space-y-1">
        <p>Records: {records.length}</p>
        <p>Ready: {derived.ready || 0}</p>
        <p>Avg Forecast: {derived.averageForecast.toFixed(1)}</p>
      </div>
    </div>
  )
}
