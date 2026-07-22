import React, { useRef, useState } from 'react'
import { useStore } from './store'
import { Download, Upload, Trash2, FileJson, AlertTriangle } from 'lucide-react'

export function ExportImport() {
  const { exportSession, importSession, clearSession, derived } = useStore()
  const fileInputRef = useRef(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleExport = () => {
    const dataStr = exportSession()
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = 'recipe-substitution-v1-provenance-atlas.json'

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const success = importSession(event.target.result)
      if (!success) {
        setErrorMsg('Invalid session artifact format or schema version.')
        setTimeout(() => setErrorMsg(''), 5000)
      } else {
        setErrorMsg('')
      }
    }
    reader.readAsText(file)
    e.target.value = null // reset
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/80">
        <FileJson className="w-4 h-4 text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-800">Session Artifact</h2>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-center items-center text-center">
        <div className="bg-blue-50 text-blue-800 text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-blue-100">
          {derived.summary}
        </div>

        <p className="text-sm text-gray-500 mb-8 max-w-xs leading-relaxed">
          Export your current session to a portable JSON artifact, or import a previously saved session.
        </p>

        {errorMsg && (
          <div className="w-full flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50 p-3 rounded-lg mb-6 border border-red-100">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        <div className="w-full space-y-3">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
          >
            <Download className="w-4 h-4" />
            Export Session
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleImport}
              className="hidden"
            />

            <button
              onClick={() => {
                if(window.confirm('Clear all session data? This cannot be undone.')) {
                  clearSession()
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-200"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
