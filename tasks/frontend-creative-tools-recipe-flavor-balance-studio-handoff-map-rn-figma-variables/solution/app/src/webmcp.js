import { useStore } from './store'

const sessionInfo = {
  name: "frontend-creative-tools-recipe-flavor-balance-studio-handoff-map-rn-figma-variables",
  version: "1.0.0"
}

const tools = [
  {
    name: "query_session",
    description: "Queries the entire current session state including records, derived state, and history.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "create_record",
    description: "Creates a new flavor component record.",
    inputSchema: {
      type: "object",
      properties: {
        record: { type: "object" }
      },
      required: ["record"]
    }
  },
  {
    name: "update_record",
    description: "Updates an existing flavor component record.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        updates: { type: "object" }
      },
      required: ["id", "updates"]
    }
  },
  {
    name: "connect_owner",
    description: "Connect a selected record to a handoff owner and update readiness.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        owner: { type: "string" }
      },
      required: ["id", "owner"]
    }
  },
  {
    name: "export_session",
    description: "Exports the current session as a JSON artifact.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "import_session",
    description: "Imports a JSON artifact to restore session state.",
    inputSchema: {
      type: "object",
      properties: {
        sessionData: { type: "object" }
      },
      required: ["sessionData"]
    }
  }
]

window.webmcp_session_info = () => sessionInfo;
window.webmcp_list_tools = () => tools;

window.webmcp_invoke_tool = async (toolName, args) => {
  const store = useStore.getState()

  switch (toolName) {
    case 'query_session':
      return {
        records: store.records,
        derived: store.derived,
        history: store.history,
        selectedRecordId: store.selectedRecordId
      }
    case 'create_record':
      store.addRecord(args.record)
      return { success: true }
    case 'update_record':
      store.updateRecord(args.id, args.updates)
      return { success: true }
    case 'connect_owner':
      store.connectOwnerAndUpdateReadiness(args.id, args.owner)
      return { success: true }
    case 'export_session':
      return store.exportSession()
    case 'import_session':
      const success = store.importSession(args.sessionData)
      return { success }
    default:
      throw new Error(`Tool ${toolName} not found`)
  }
}
