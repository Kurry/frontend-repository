import { useEffect } from 'react'
import { useStore } from '../store/useStore'

export function WebMCP() {


  useEffect(() => {
    // Define the WebMCP API on window
    const win = window as any
    win.webmcp_session_info = {
      name: "coffee-brew-experiment-log",
      version: "1.0.0"
    }

    win.webmcp_list_tools = () => {
      return {
        tools: [
          {
            name: "create_experiment",
            description: "Create a new brew experiment",
            inputSchema: {
              type: "object",
              properties: {
                title: { type: "string" },
                beanOrigin: { type: "string" },
                roastDate: { type: "string" }
              },
              required: ["title"]
            }
          },
          {
            name: "update_experiment",
            description: "Update an existing brew experiment",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                status: { type: "string" }
              },
              required: ["id"]
            }
          },
          {
            name: "trace_lineage",
            description: "Trace a selected record to source evidence and quarantine a bad lineage",
            inputSchema: {
              type: "object",
              properties: {
                id: { type: "string" },
                quarantineReason: { type: "string" }
              },
              required: ["id"]
            }
          },
          {
            name: "undo_last_action",
            description: "Undo the last mutation",
            inputSchema: {
              type: "object",
              properties: {}
            }
          },
          {
            name: "export_artifact",
            description: "Export the current session state as a JSON artifact",
            inputSchema: {
              type: "object",
              properties: {}
            }
          },
          {
            name: "import_artifact",
            description: "Import a session state JSON artifact",
            inputSchema: {
              type: "object",
              properties: {
                artifact: { type: "string" }
              },
              required: ["artifact"]
            }
          }
        ]
      }
    }

    win.webmcp_invoke_tool = (toolName: string, args: any) => {
      const currentState = useStore.getState()

      switch (toolName) {
        case 'create_experiment':
          currentState.addRecord(args)
          return { success: true }

        case 'update_experiment':
          currentState.updateRecord(args.id, args)
          return { success: true }

        case 'trace_lineage':
          currentState.traceAndQuarantine(args.id, args.quarantineReason || "Bad lineage")
          return { success: true }

        case 'undo_last_action':
          currentState.undo()
          return { success: true }

        case 'export_artifact':
          return { success: true, artifact: currentState.exportArtifact() }

        case 'import_artifact':
          currentState.importArtifact(args.artifact)
          return { success: true }

        default:
          throw new Error(`Unknown tool: ${toolName}`)
      }
    }
  }, [])

  return null
}
