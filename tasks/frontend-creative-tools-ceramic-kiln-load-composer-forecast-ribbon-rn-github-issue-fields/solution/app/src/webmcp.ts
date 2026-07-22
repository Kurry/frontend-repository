import { state, selectPiece, updatePiece, createPiece, exportArtifact, importArtifact } from "./store";

declare global {
  interface Window {
    webmcp_session_info?: () => any;
    webmcp_list_tools?: () => any[];
    webmcp_invoke_tool?: (tool_name: string, arguments_obj: any) => Promise<any>;
  }
}

export function registerWebMCP() {
  window.webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    capabilities: ["entity-collection-v1", "artifact-transfer-v1"],
  });

  window.webmcp_list_tools = () => [
    {
      name: "entity_piece_select",
      description: "Select a piece.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
    },
    {
      name: "entity_piece_update",
      description: "Update a piece.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          cone: { type: "number" },
          status: { type: "string" },
        },
        required: ["id"],
      },
    },
    {
       name: "entity_piece_create",
       description: "Create a piece.",
       parameters: {
          type: "object",
          properties: {
             title: { type: "string" },
             maker: { type: "string" },
             dimensions: { type: "string" },
             clayBody: { type: "string" },
             glaze: { type: "string" },
             cone: { type: "number" },
             status: { type: "string" },
          },
          required: ["title", "maker", "dimensions", "clayBody", "glaze", "cone", "status"],
       }
    },
    {
       name: "entity_query_select",
       description: "Select a query.",
       parameters: {
          type: "object",
          properties: {
             id: { type: "string" }
          },
          required: ["id"]
       }
    },
    {
      name: "artifact_export",
      description: "Export the artifact.",
      parameters: { type: "object", properties: {}, required: [] },
    },
    {
      name: "artifact_import",
      description: "Import an artifact.",
      parameters: {
        type: "object",
        properties: {
          data: { type: "object" },
        },
        required: ["data"],
      },
    },
  ];

  window.webmcp_invoke_tool = async (tool_name: string, args: any) => {
    try {
      switch (tool_name) {
        case "entity_piece_select":
          selectPiece(args.id);
          return { status: "success", result: { selectedPieceId: state.selectedPieceId } };
        case "entity_piece_update":
          updatePiece(args.id, args);
          return { status: "success", result: { piece: state.pieces.find(p => p.id === args.id) } };
        case "entity_piece_create":
          createPiece(args);
          return { status: "success" };
        case "entity_query_select":
          // simulate
          return { status: "success" };
        case "artifact_export":
          return { status: "success", result: exportArtifact() };
        case "artifact_import":
          const res = importArtifact(args.data);
          if (res.success) return { status: "success" };
          throw res.error;
        default:
          throw new Error(`Unknown tool: ${tool_name}`);
      }
    } catch (err: any) {
      return { status: "error", error: err.message || String(err) };
    }
  };
}
