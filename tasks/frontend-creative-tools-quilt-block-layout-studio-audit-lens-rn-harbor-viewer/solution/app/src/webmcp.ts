import { useStore } from './store';

declare global {
  interface Window {
    webmcp_session_info: any;
    webmcp_list_tools: () => any[];
    webmcp_invoke_tool: (name: string, args: any) => any;
  }
}

window.webmcp_session_info = {
  name: "Quilt Block Layout Studio",
  version: "1.0.0",
  capabilities: { tools: true }
};

window.webmcp_list_tools = () => [
  {
    name: "quilt_query",
    description: "Queries the current state of the quilt block collection.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "audit_lens_mutate",
    description: "Attaches evidence to a selected record and resolves an audit discrepancy.",
    inputSchema: {
      type: "object",
      properties: {
        recordId: { type: "string" },
        evidence: { type: "string" }
      },
      required: ["recordId", "evidence"]
    }
  },
  {
    name: "export_artifact",
    description: "Exports the current session state as a JSON artifact.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "import_artifact",
    description: "Imports a JSON artifact to restore session state.",
    inputSchema: {
      type: "object",
      properties: {
        artifact: { type: "object" }
      },
      required: ["artifact"]
    }
  }
];

window.webmcp_invoke_tool = (name: string, args: any) => {
  const store = useStore.getState();

  switch (name) {
    case "quilt_query":
      return {
        records: store.session.records,
        derived: store.session.derived
      };

    case "audit_lens_mutate": {
      const res = store.attachEvidenceAndResolve(args.recordId, args.evidence);
      if (!res.success) {
        throw new Error(`Mutation failed: ${res.error}`);
      }
      return { success: true, updatedRecord: useStore.getState().session.records.find(r => r.id === args.recordId) };
    }

    case "export_artifact":
      return store.exportState();

    case "import_artifact": {
      const res = store.importState(args.artifact);
      if (!res.success) {
        throw new Error(`Import failed: ${res.error}`);
      }
      return { success: true };
    }

    default:
      throw new Error(`Tool not found: ${name}`);
  }
};
