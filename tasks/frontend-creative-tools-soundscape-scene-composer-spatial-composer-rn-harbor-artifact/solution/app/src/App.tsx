import { useState, useRef, useEffect, KeyboardEvent } from "react"

export type Status = "draft" | "ready" | "changed" | "archived"

export interface Layer {
  id: string
  name: string
  status: Status
  capacity: number
  sourceLineage: string
  x?: number
  y?: number
}

export interface DerivedState {
  totalCapacity: number
  placedCount: number
}

export interface ExportedSession {
  schemaVersion: "v1"
  exportedAt: string
  records: Layer[]
  derived: DerivedState
  history: {
    timestamp: string
    action: string
    records: Layer[]
  }[]
}

// Global store for WebMCP
let globalLayers: Layer[] = [
  { id: "L1", name: "Vocals", status: "draft", capacity: 50, sourceLineage: "Studio A" },
  { id: "L2", name: "Drums", status: "ready", capacity: 20, sourceLineage: "Sample Pack 1" },
  { id: "L3", name: "Synth", status: "ready", capacity: 30, sourceLineage: "Operator" },
]
let globalHistory: any[] = [{ timestamp: new Date().toISOString(), action: "init", records: [...globalLayers] }]
let setGlobalState: any = null;

declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>
    webmcp_list_tools: () => Promise<any>
    webmcp_invoke_tool: (name: string, args: any) => Promise<any>
  }
}

window.webmcp_session_info = async () => ({
  task_id: "eval-intelligence/frontend-creative-tools-soundscape-scene-composer-spatial-composer-rn-artifact-provenance",
});

window.webmcp_list_tools = async () => ({
  tools: [
    {
      name: "entity_create_record",
      description: "Create a new sound layer.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          status: { type: "string" },
          capacity: { type: "number" },
          sourceLineage: { type: "string" }
        },
        required: ["name", "status", "capacity"]
      }
    },
    {
      name: "entity_update_record",
      description: "Update a sound layer.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          status: { type: "string" },
          capacity: { type: "number" }
        },
        required: ["id"]
      }
    },
    {
      name: "artifact_export_session_json",
      description: "Export the session to soundscape-scene-v1.json.",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "artifact_import_session_json",
      description: "Import a session from JSON.",
      inputSchema: {
        type: "object",
        properties: {
          file_content: { type: "string" }
        },
        required: ["file_content"]
      }
    }
  ]
});

window.webmcp_invoke_tool = async (name: string, args: any) => {
  if (name === "entity_create_record") {
    const newLayer: Layer = {
      id: `L${Date.now()}`,
      name: args.name,
      status: args.status,
      capacity: args.capacity,
      sourceLineage: args.sourceLineage || "Unknown"
    }
    const newLayers = [...globalLayers, newLayer]
    if (setGlobalState) setGlobalState(newLayers, "Create Layer (MCP)")
    return { success: true, layer: newLayer }
  }

  if (name === "entity_update_record") {
    const newLayers = globalLayers.map(l => l.id === args.id ? {
      ...l,
      name: args.name || l.name,
      status: args.status || l.status,
      capacity: args.capacity !== undefined ? args.capacity : l.capacity
    } : l)
    if (setGlobalState) setGlobalState(newLayers, "Update Layer (MCP)")
    return { success: true }
  }

  if (name === "artifact_export_session_json") {
    const placedLayers = globalLayers.filter(l => l.x !== undefined && l.y !== undefined)
    const derived: DerivedState = {
      totalCapacity: placedLayers.reduce((sum, l) => sum + l.capacity, 0),
      placedCount: placedLayers.length
    }
    const session: ExportedSession = {
      schemaVersion: "v1",
      exportedAt: new Date().toISOString(),
      records: globalLayers,
      derived,
      history: globalHistory
    }
    return { success: true, data: JSON.stringify(session) }
  }

  if (name === "artifact_import_session_json") {
    try {
      const json = JSON.parse(args.file_content)
      if (json.schemaVersion !== "v1") return { success: false, error: "Invalid schemaVersion" }
      if (setGlobalState) {
          setGlobalState(json.records, "Import (MCP)", json.history)
      }
      return { success: true }
    } catch (e) {
      return { success: false, error: "Malformed JSON" }
    }
  }

  return { success: false, error: "Tool not found" }
};


function App() {
  const [layers, setLayers] = useState<Layer[]>(globalLayers)
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Status | "all">("all")
  const [history, setHistory] = useState<{ timestamp: string; action: string; records: Layer[] }[]>(globalHistory)

  // Form State
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editStatus, setEditStatus] = useState<Status>("draft")
  const [editCapacity, setEditCapacity] = useState(0)
  const [editLineage, setEditLineage] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  // Derived
  const placedLayers = layers.filter(l => l.x !== undefined && l.y !== undefined)
  const derived: DerivedState = {
    totalCapacity: placedLayers.reduce((sum, l) => sum + l.capacity, 0),
    placedCount: placedLayers.length
  }

  useEffect(() => {
    setGlobalState = (newLayers: Layer[], action: string, newHistory?: any[]) => {
      globalLayers = newLayers
      setLayers(newLayers)

      let hist = newHistory || [
        ...globalHistory,
        { timestamp: new Date().toISOString(), action, records: [...newLayers.map(l => ({...l}))] }
      ]
      globalHistory = hist
      setHistory(hist)
    }
  }, [])

  const saveHistory = (newLayers: Layer[], action: string) => {
    globalLayers = newLayers
    setGlobalState(newLayers, action)
  }

  const handleCreate = () => {
    setIsEditing(true)
    setEditingId(null)
    setEditName("New Layer")
    setEditStatus("draft")
    setEditCapacity(10)
    setEditLineage("Unknown")
    setFormError(null)
  }

  const handleEdit = (layer: Layer) => {
    setIsEditing(true)
    setEditingId(layer.id)
    setEditName(layer.name)
    setEditStatus(layer.status)
    setEditCapacity(layer.capacity)
    setEditLineage(layer.sourceLineage)
    setFormError(null)
  }

  const handleSaveEdit = () => {
    if (editCapacity < 0 || editCapacity > 100) {
      setFormError("Capacity must be between 0 and 100.")
      return
    }

    let newLayers: Layer[]
    if (editingId) {
      newLayers = layers.map(l => l.id === editingId ? {
        ...l, name: editName, status: editStatus, capacity: editCapacity, sourceLineage: editLineage
      } : l)
    } else {
      const newLayer: Layer = {
        id: `L${Date.now()}`,
        name: editName,
        status: editStatus,
        capacity: editCapacity,
        sourceLineage: editLineage
      }
      newLayers = [...layers, newLayer]
    }

    setLayers(newLayers)
    saveHistory(newLayers, editingId ? "Edit Layer" : "Create Layer")
    setIsEditing(false)
  }

  const handleArchive = (id: string) => {
    const newLayers = layers.map(l => l.id === id ? { ...l, status: "archived" as Status } : l)
    setLayers(newLayers)
    saveHistory(newLayers, "Archive Layer")
  }

  const handlePlaceInComposer = (x: number, y: number) => {
    if (!selectedLayerId) return
    const layer = layers.find(l => l.id === selectedLayerId)
    if (!layer) return

    if (layer.status === "archived") {
      alert("Cannot place archived layers")
      return
    }

    let newLayers = layers.map(l => {
      if (l.id === selectedLayerId) {
        return { ...l, x, y, status: "changed" as Status }
      }
      return l
    })

    const currentlyPlaced = newLayers.filter(l => l.x !== undefined && l.y !== undefined)
    if (currentlyPlaced.length > 0) {
      const avg = 100 / currentlyPlaced.length
      newLayers = newLayers.map(l => {
        if (l.x !== undefined && l.y !== undefined) {
          return { ...l, capacity: avg }
        }
        return l
      })
    }

    setLayers(newLayers)
    saveHistory(newLayers, "Place Layer")
  }

  const handleComposerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedLayerId) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    handlePlaceInComposer(x, y)
  }

  const handleComposerKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && selectedLayerId) {
      handlePlaceInComposer(100, 100)
    }
  }

  const handleUndo = () => {
    if (history.length > 1) {
      const newHistory = [...history]
      newHistory.pop()
      const prevState = newHistory[newHistory.length - 1]

      globalLayers = [...prevState.records.map(l => ({...l}))]
      setLayers(globalLayers)

      globalHistory = newHistory
      setHistory(newHistory)
    }
  }

  const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      handleUndo()
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [history])

  const handleExport = () => {
    const session: ExportedSession = {
      schemaVersion: "v1",
      exportedAt: new Date().toISOString(),
      records: layers,
      derived,
      history
    }
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "soundscape-scene-v1.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        if (json.schemaVersion !== "v1") {
          setImportError("Invalid schemaVersion. Expected 'v1'.")
          return
        }

        for (const record of json.records) {
          if (typeof record.capacity !== 'number' || record.capacity < 0 || record.capacity > 100) {
             setImportError(`Invalid capacity for layer ${record.id}: must be 0-100`)
             return
          }
        }

        const ids = new Set()
        for (const record of json.records) {
          if (ids.has(record.id)) {
            setImportError(`Duplicate ID found: ${record.id}`)
            return
          }
          ids.add(record.id)
        }

        globalLayers = json.records
        setLayers(json.records)

        const hist = json.history || [{ timestamp: new Date().toISOString(), action: "import", records: json.records }]
        globalHistory = hist
        setHistory(hist)

        setImportError(null)
      } catch (err) {
        setImportError("Malformed JSON file.")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const handleClear = () => {
    setLayers([])
    saveHistory([], "Clear")
  }

  const filteredLayers = filter === "all" ? layers : layers.filter(l => l.status === filter)

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 text-gray-900 font-sans">

      {/* Sidebar - Layers */}
      <div className="w-full md:w-1/3 p-4 border-r bg-white overflow-y-auto">
        <h1 className="text-xl font-bold mb-4">Sound Layers</h1>

        <div className="flex space-x-2 mb-4">
          <button onClick={handleCreate} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">New Layer</button>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Status | "all")}
            className="border p-1 rounded text-sm"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {isEditing && (
          <div className="mb-4 p-3 border border-blue-200 bg-blue-50 rounded">
            <h3 className="font-bold mb-2">{editingId ? "Edit Layer" : "Create Layer"}</h3>
            <input className="w-full border p-1 mb-2 rounded" placeholder="Name" value={editName} onChange={e => setEditName(e.target.value)} />
            <select className="w-full border p-1 mb-2 rounded" value={editStatus} onChange={e => setEditStatus(e.target.value as Status)}>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
              <option value="archived">Archived</option>
            </select>
            <input className="w-full border p-1 mb-2 rounded" type="number" placeholder="Capacity (0-100)" value={editCapacity} onChange={e => setEditCapacity(Number(e.target.value))} />
            <input className="w-full border p-1 mb-2 rounded" placeholder="Source Lineage" value={editLineage} onChange={e => setEditLineage(e.target.value)} />
            {formError && <p className="text-red-600 text-xs mb-2" role="alert" aria-live="assertive">{formError}</p>}
            <div className="flex space-x-2">
              <button onClick={handleSaveEdit} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">Save</button>
              <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-gray-300 rounded text-sm hover:bg-gray-400">Cancel</button>
            </div>
          </div>
        )}

        <ul className="space-y-2">
          {filteredLayers.map(l => (
            <li
              key={l.id}
              className={`p-3 border rounded cursor-pointer transition-colors ${selectedLayerId === l.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'} ${l.status === 'archived' ? 'opacity-60' : ''}`}
              onClick={() => setSelectedLayerId(l.id)}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">{l.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  l.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  l.status === 'ready' ? 'bg-green-100 text-green-800' :
                  l.status === 'changed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-200 text-gray-800'
                }`}>{l.status}</span>
              </div>
              <div className="text-xs text-gray-600">Capacity: {l.capacity.toFixed(1)}</div>
              <div className="flex justify-end space-x-2 mt-2">
                <button onClick={(e) => { e.stopPropagation(); handleEdit(l); }} className="text-blue-600 text-xs hover:underline">Edit</button>
                {l.status !== 'archived' && (
                  <button onClick={(e) => { e.stopPropagation(); handleArchive(l.id); }} className="text-red-600 text-xs hover:underline">Archive</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Main Canvas - Spatial Composer */}
      <div className="w-full md:w-1/3 flex flex-col border-r bg-gray-100 relative focus:outline-none"
           tabIndex={0}
           onKeyDown={handleComposerKeyDown}
           aria-label="Spatial Composer Canvas">
        <div className="p-4 bg-white border-b flex justify-between items-center z-10">
          <h2 className="text-lg font-bold">Spatial Composer</h2>
          <div className="space-x-2 flex items-center">
            <button onClick={handleUndo} disabled={history.length <= 1} className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300 disabled:opacity-50">Undo</button>
            <button onClick={handleClear} className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200">Clear</button>
          </div>
        </div>

        <div
          className="flex-1 relative overflow-hidden cursor-crosshair bg-slate-50"
          onClick={handleComposerClick}
        >
          {placedLayers.map(l => (
            <div
              key={l.id}
              className="absolute w-24 h-24 -ml-12 -mt-12 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg transition-transform duration-300 ease-out motion-reduce:transition-none"
              style={{ left: l.x, top: l.y, opacity: selectedLayerId === l.id ? 1 : 0.8 }}
            >
              <div className="text-center">
                 {l.name}
                 <br/>
                 ({l.capacity.toFixed(0)})
              </div>
            </div>
          ))}
          {!selectedLayerId && <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">Select a layer and click to place</div>}
        </div>
      </div>

      {/* Inspector Panel */}
      <div className="w-full md:w-1/3 p-4 bg-white overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Evidence Inspector</h2>

        <div className="mb-6 p-4 bg-gray-50 rounded border">
          <h3 className="font-semibold mb-2">Derived State</h3>
          <p className="text-sm">Total Capacity: <span className="font-mono">{derived.totalCapacity.toFixed(1)}</span></p>
          <p className="text-sm">Placed Layers: <span className="font-mono">{derived.placedCount}</span></p>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-2">Artifact Provenance</h3>
          <div className="flex flex-col space-y-2">
            <button onClick={handleExport} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full">Export Session Artifact</button>
            <div className="relative w-full">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Import Session JSON"
              />
              <div className="px-4 py-2 bg-gray-200 text-gray-800 rounded text-center pointer-events-none w-full">Import Session Artifact</div>
            </div>
            {importError && (
              <p className="text-red-600 text-xs mt-1" role="alert" aria-live="assertive">{importError}</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Source Lineage</h3>
          <ul className="text-sm space-y-1">
            {layers.map(l => (
              <li key={l.id} className="truncate">
                <span className="font-medium">{l.name}:</span> {l.sourceLineage}
                {l.status === 'archived' && <span className="text-red-500 ml-1 text-xs">(Redacted)</span>}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  )
}

export default App
