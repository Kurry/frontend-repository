import { useStore, getDerivedSummary } from './store/useStore'
import { importArtifact, exportArtifact } from './utils/artifact'

export const setupWebMCP = () => {
  window.webmcp_session_info = () => {
    return {
      protocol_version: 'zto-webmcp-v1',
      session_id: 'forecast-ribbon-session'
    }
  }

  window.webmcp_list_tools = () => {
    return [
      { name: "editor_select", description: "Select a story node." },
      { name: "editor_update_property", description: "Update a property on a node (like status or forecastValue)." },
      { name: "editor_preview", description: "Preview projected outcomes based on forecast value adjustments." },

      { name: "entity_create", description: "Create a new story node." },
      { name: "entity_select", description: "Select a story node." },
      { name: "entity_update", description: "Update a story node." },
      { name: "entity_delete", description: "Delete a story node." },

      { name: "artifact_export", description: "Export the session to JSON." },
      { name: "artifact_import", description: "Import a session from JSON payload (simulating file read)." }
    ]
  }

  window.webmcp_invoke_tool = (tool_name, parameters) => {
    const store = useStore.getState()

    switch (tool_name) {
      case 'entity_create': {
        const id = `node-${Date.now()}`
        store.addRecord({
          id,
          title: parameters.title || 'New Node via MCP',
          status: parameters.status || 'draft',
          forecastValue: parameters.forecastValue || 50,
          description: parameters.description || ''
        })
        return { success: true, id }
      }

      case 'editor_select':
      case 'entity_select': {
        const { id } = parameters
        if (!store.records.find(r => r.id === id)) {
           return { error: 'Record not found.' }
        }
        store.setSelectedId(id)
        return { success: true, selectedId: id }
      }

      case 'editor_update_property':
      case 'entity_update': {
        const { id, updates } = parameters
        if (!store.records.find(r => r.id === id)) {
          return { error: 'Record not found.' }
        }

        if (updates.forecastValue !== undefined) {
           store.adjustForecast(id, updates.forecastValue)
        } else {
           store.updateRecord(id, updates)
        }

        return { success: true, id }
      }

      case 'entity_delete': {
        const { id, confirm } = parameters
        if (!confirm) return { error: 'explicit confirm=true required' }
        store.deleteRecord(id)
        return { success: true }
      }

      case 'editor_preview': {
        // Project outcome without actually committing
        const { id, forecastValue } = parameters
        const record = store.records.find(r => r.id === id)
        if (!record) return { error: 'Record not found.' }

        const summary = getDerivedSummary(store.records)
        const currentAvg = summary.averageForecast
        const nextTotal = summary.total
        const diff = forecastValue - record.forecastValue
        const projectedAvg = nextTotal > 0 ? currentAvg + (diff / nextTotal) : 0

        return { success: true, projectedAvg, currentAvg }
      }

      case 'artifact_export': {
        // We return the raw state representation, although UI relies on Blob download
        const summary = getDerivedSummary(store.records)
        return {
          success: true,
          artifact: {
            schemaVersion: 'v1',
            exportedAt: new Date().toISOString(),
            records: store.records,
            derived: summary,
            history: store.history
          }
        }
      }

      case 'artifact_import': {
        // Here we simulate the file content passing through via JSON string
        const { fileContent } = parameters
        const result = importArtifact(fileContent)
        if (result.success) {
           store.importState(result.data.records, result.data.history || [])
           return { success: true }
        } else {
           return { error: result.error }
        }
      }

      default:
        return { error: `Tool ${tool_name} not implemented.` }
    }
  }
}
