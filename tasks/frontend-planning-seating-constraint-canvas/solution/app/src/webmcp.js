export function setupWebMCP(stateRef, dispatch) {
  window.webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1"]
  });

  window.webmcp_list_tools = () => [
    { name: "editor_select", module: "structured-editor-v1" },
    { name: "editor_add", module: "structured-editor-v1" },
    { name: "editor_delete", module: "structured-editor-v1" },
    { name: "editor_update_property", module: "structured-editor-v1" },
    { name: "entity_create", module: "entity-collection-v1" },
    { name: "entity_select", module: "entity-collection-v1" },
    { name: "entity_update", module: "entity-collection-v1" },
    { name: "entity_delete", module: "entity-collection-v1" },
    { name: "artifact_export", module: "artifact-transfer-v1" },
    { name: "artifact_import", module: "artifact-transfer-v1" }
  ];

  window.webmcp_invoke_tool = async (req) => {
    const { tool_name, args } = req;

    if (tool_name === "editor_add") {
        if (args.object_type === "table") {
            dispatch({ type: 'ADD_TABLE', payload: { id: `table-${Date.now()}`, type: args.type || 'round', capacity: args.capacity || 8, x: args.x, y: args.y, width: args.width || 2.5, height: args.height || 2.5, rotation: args.rotation || 0 }});
            return { status: "success" };
        } else if (args.object_type === "aisle") {
            dispatch({ type: 'DRAW_AISLE', payload: { id: `aisle-${Date.now()}`, points: args.points, width: args.width || 1.2 }});
            return { status: "success" };
        }
    }

    if (tool_name === "editor_delete") {
        if (args.object_type === "table") {
            dispatch({ type: 'DELETE_TABLE', payload: args.id });
            return { status: "success" };
        }
    }

    if (tool_name === "editor_update_property") {
        if (args.object_type === "table") {
             dispatch({ type: 'UPDATE_TABLE', payload: { id: args.id, updates: { [args.property]: args.value } }});
             return { status: "success" };
        }
    }

    if (tool_name === "entity_create") {
        if (args.entity === "assignment") {
             dispatch({ type: 'ASSIGN_GUEST', payload: { guestId: args.guest_id, seatId: args.seat_id }});
             return { status: "success" };
        } else if (args.entity === "relationship") {
             dispatch({ type: 'ADD_RELATIONSHIP', payload: { guest1: args.guest1, guest2: args.guest2, type: args.type }});
             return { status: "success" };
        }
    }

    if (tool_name === "entity_delete") {
        if (args.entity === "assignment") {
             dispatch({ type: 'UNASSIGN_GUEST', payload: { guestId: args.guest_id }});
             return { status: "success" };
        }
    }

    if (tool_name === "artifact_export") {
         if (args.format === "seating-constraint-plan") {
             const plan = {
                 schemaVersion: "seating-constraint-plan/v1",
                 tables: stateRef.current.tables,
                 assignments: stateRef.current.assignments,
                 relationships: stateRef.current.relationships,
                 aisles: stateRef.current.aisles,
                 exportedAt: new Date().toISOString()
             };
             return { status: "success", result: { artifact: JSON.stringify(plan, null, 2) } };
         }
         return { status: "error", message: "Unsupported format" };
    }

    if (tool_name === "artifact_import") {
         try {
             const payload = JSON.parse(args.content);
             if (payload.schemaVersion !== "seating-constraint-plan/v1") throw new Error("Invalid schema");
             dispatch({ type: 'IMPORT_STATE', payload: { ...stateRef.current, tables: payload.tables, assignments: payload.assignments, relationships: payload.relationships, aisles: payload.aisles } });
             return { status: "success" };
         } catch(e) {
             return { status: "error", message: e.message };
         }
    }

    return { status: "error", message: `Tool ${tool_name} not implemented` };
  };
}
