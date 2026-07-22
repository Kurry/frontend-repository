import React, { useRef, useState } from 'react'
import { useStore } from '../store'
import { Download, Upload } from 'lucide-react'

export function ArtifactManager() {
  const { exportSession, importSession, derived } = useStore()
  const fileInputRef = useRef(null)
  const [importStatus, setImportStatus] = useState(null)

  const handleExport = () => {
    const data = exportSession()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'flavor-balance-v1-handoff-map.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result)
        const success = importSession(json)
        if (success) {
          setImportStatus({ type: 'success', message: 'Import successful' })
        } else {
          setImportStatus({ type: 'error', message: 'Invalid import schema' })
        }
      } catch (err) {
        setImportStatus({ type: 'error', message: 'Failed to parse JSON' })
      }
    }
    reader.readAsText(file)
    e.target.value = '' // Reset
  }

  return (
    <div className="p-4 border-t border-gray-200 bg-white space-y-4">
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
        <h4 className="font-semibold mb-1 text-gray-800">Derived Summary</h4>
        <p>{derived.summary}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 focus:ring-2 focus:ring-gray-800"
          aria-label="Export artifact"
        >
          <Download size={16} /> Export
        </button>
        <button
          onClick={handleImportClick}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-gray-300 text-gray-800 rounded hover:bg-gray-50 focus:ring-2 focus:ring-gray-800"
          aria-label="Import artifact"
        >
          <Upload size={16} /> Import
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="application/json"
          onChange={handleFileChange}
        />
      </div>
      {importStatus && (
        <p className={`text-sm text-center ${importStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {importStatus.message}
        </p>
      )}
    </div>
  )
}
