import { useState, useRef } from 'react'
import { useStore } from '../store'
import { exportArtifact, validateArtifact } from '../utils/artifact'
import { Download, Upload, Trash2, FileJson } from 'lucide-react'

export function ArtifactPanel() {
  const { state, dispatch } = useStore()
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const jsonStr = exportArtifact(state)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'hydration-pattern-v1-recovery-board.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const validated = validateArtifact(content)

      if (validated) {
        dispatch({ type: 'IMPORT_SESSION', session: validated })
        setImportError(null)
      } else {
        setImportError('Malformed import: Invalid schema, bounds, or duplicate IDs.')
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  const handleClear = () => {
    dispatch({ type: 'CLEAR_ALL' })
    setImportError(null)
  }

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <FileJson className="text-purple-600" />
        Portable Work Artifact
      </h2>

      <div className="text-sm text-gray-600">
        Export and restore the actual session work in a fresh state.
      </div>

      {importError && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
          {importError}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
        >
          <Download size={18} /> Export Session
        </button>

        <input
          type="file"
          accept=".json"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImport}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          <Upload size={18} /> Import JSON
        </button>

        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-2 ml-auto text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
        >
          <Trash2 size={18} /> Clear Data
        </button>
      </div>

      <div className="mt-2 text-xs font-mono bg-slate-100 p-3 rounded text-slate-700 overflow-x-auto max-h-48 whitespace-pre-wrap border">
        {exportArtifact(state)}
      </div>
    </div>
  )
}
