import { useEffect } from 'react';
import { useStore } from '../Store';

export const WebMCPSetup = () => {
  const { records, history, derived, loadSession, updateRecord, recoverRecord, setSelectedId, selectedId, undo } = useStore();

  useEffect(() => {
    window.webmcp_session_info = {
      schemaVersion: "v1",
      exportedAt: new Date().toISOString(),
      records,
      derived,
      history
    };

    window.webmcp_list_tools = () => [
      {
        name: "get_state",
        description: "Returns the current state of the application",
        input_schema: { type: "object", properties: {} }
      },
      {
        name: "select_record",
        description: "Selects a record into the Recovery Board",
        input_schema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
      },
      {
        name: "recover_record",
        description: "Executes the signature mutation on a selected record",
        input_schema: {
          type: "object",
          properties: {
            id: { type: "string" },
            content: { type: "string" },
            timing: { type: "number" }
          },
          required: ["id", "content", "timing"]
        }
      },
      {
        name: "undo",
        description: "Undoes the last action",
        input_schema: { type: "object", properties: {} }
      },
      {
        name: "import_session",
        description: "Imports a session artifact payload",
        input_schema: { type: "object", properties: { session: { type: "object" } }, required: ["session"] }
      }
    ];

    window.webmcp_invoke_tool = async (tool_name, arguments_obj) => {
      switch (tool_name) {
        case "get_state":
          return { records, derived, selectedId };
        case "select_record":
          setSelectedId(arguments_obj.id);
          return { status: "success", id: arguments_obj.id };
        case "recover_record":
          recoverRecord(arguments_obj.id, { content: arguments_obj.content, timing: arguments_obj.timing });
          return { status: "success" };
        case "undo":
          undo();
          return { status: "success" };
        case "import_session":
          loadSession(arguments_obj.session);
          return { status: "success" };
        default:
          throw new Error(`Tool ${tool_name} not found`);
      }
    };
  }, [records, history, derived, loadSession, updateRecord, recoverRecord, setSelectedId, selectedId, undo]);

  return null;
};
