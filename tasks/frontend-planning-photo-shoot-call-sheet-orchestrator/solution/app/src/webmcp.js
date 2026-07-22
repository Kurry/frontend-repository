import { useStore } from './store';

export function registerWebMcp() {
  const toolMeta = [
    { name: "editor_select", module: "structured-editor-v1", description: "Select a shot marker or timeline block.", inputSchema: { type: "object", additionalProperties: true, properties: { id: { type: "string" }, objectType: { type: "string" } }, required: ["id"] } },
    { name: "editor_update_property", module: "structured-editor-v1", description: "Update shot coordinates or duration.", inputSchema: { type: "object", additionalProperties: true, properties: { id: { type: "string" }, property: { type: "string" }, value: { type: "any" } }, required: ["id", "property", "value"] } },
    { name: "entity_create", module: "entity-collection-v1", description: "Create a resource, handoff, or disruption.", inputSchema: { type: "object", additionalProperties: true, properties: { entity: { type: "string" }, data: { type: "object" } }, required: ["entity"] } },
    { name: "entity_update", module: "entity-collection-v1", description: "Update an entity's state (e.g., approve release).", inputSchema: { type: "object", additionalProperties: true, properties: { entity: { type: "string" }, id: { type: "string" }, data: { type: "object" } }, required: ["entity", "id", "data"] } },
    { name: "artifact_export", module: "artifact-transfer-v1", description: "Export canonical artifacts.", inputSchema: { type: "object", additionalProperties: true, properties: { format: { enum: ["session-json", "ics", "csv", "svg", "markdown"] } }, required: ["format"] } },
    { name: "artifact_import", module: "artifact-transfer-v1", description: "Import canonical JSON.", inputSchema: { type: "object", additionalProperties: true, properties: { mode: { const: "session-json" } }, required: ["mode"] } }
  ];

  const handlers = {
    editor_select: async (args) => {
      // No-op for headless, handled by UI selection usually
      return { success: true };
    },
    editor_update_property: async (args) => {
      const { moveShot, scheduleShot } = useStore.getState();
      if (args.property === 'coordinates') {
        moveShot(args.id, { x: args.value.x, y: args.value.y });
      } else if (args.property === 'duration') {
        moveShot(args.id, { duration: args.value });
      } else if (args.property === 'scheduledTime') {
        scheduleShot(args.id, args.value);
      }
      return { success: true };
    },
    entity_create: async (args) => {
      const { addHandoff, branchSchedule } = useStore.getState();
      if (args.entity === 'handoff') {
        addHandoff(args.data);
      } else if (args.entity === 'branch') {
        branchSchedule(args.data.name);
      }
      return { success: true };
    },
    entity_update: async (args) => {
      const { approveRelease, staleRelease } = useStore.getState();
      if (args.entity === 'release') {
        if (args.data.status === 'approved') approveRelease(args.id);
        if (args.data.status === 'expired') staleRelease(args.id);
      }
      return { success: true };
    },
    artifact_export: async (args) => {
      // Headless hook, actual implementation in export utility
      return { success: true, format: args.format };
    },
    artifact_import: async (args) => {
      return { success: true };
    }
  };

  window.webmcp_session_info = async () => ({
    contract_version: "zto-webmcp-v1",
    contractVersion: "zto-webmcp-v1",
    modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"],
    tool_names: toolMeta.map((tool) => tool.name),
    toolNames: toolMeta.map((tool) => tool.name),
    tools: toolMeta.map((tool) => tool.name),
  });

  window.webmcp_list_tools = async () => toolMeta.map(({ name, module, description, inputSchema }) => ({ name, module, description, inputSchema }));

  window.webmcp_invoke_tool = async (request, separateArguments = {}) => {
    const name = typeof request === "string" ? request : request?.name;
    const args = typeof request === "string" ? (separateArguments || {}) : (request?.arguments || request?.args || request || {});
    const handler = handlers[name];
    if (!handler) throw new Error(`WebMCP tool ${name || "(missing name)"} is not registered`);
    return handler(args);
  };

  window.webmcp = {
    sessionInfo: window.webmcp_session_info,
    listTools: window.webmcp_list_tools,
    invokeTool: window.webmcp_invoke_tool,
  };
}
