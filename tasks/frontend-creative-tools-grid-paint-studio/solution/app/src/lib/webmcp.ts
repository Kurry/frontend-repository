import { get } from 'svelte/store';
import {
  boardCells, toolMode, activeColor, updateBoardSize, clearBoard,
  savedBoards, activeMode, tagFilter, updateBoard, deleteBoard, addBoard
} from './store';
import type { ToolMode, SavedBoard } from './types';

export const registerWebMCP = () => {
  if (typeof window === 'undefined') return;

  (window as any).webmcp_session_info = () => ({
    title: "Grid Paint Studio",
    version: "1.0",
    modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1", "command-session-v1"]
  });

  (window as any).webmcp_list_tools = () => [
    { name: "editor_select", module: "structured-editor-v1" },
    { name: "editor_update_property", module: "structured-editor-v1" },
    { name: "editor_switch_mode", module: "structured-editor-v1" },
    { name: "editor_preview", module: "structured-editor-v1" },

    { name: "entity_create", module: "entity-collection-v1" },
    { name: "entity_select", module: "entity-collection-v1" },
    { name: "entity_update", module: "entity-collection-v1" },
    { name: "entity_delete", module: "entity-collection-v1" },
    { name: "entity_toggle", module: "entity-collection-v1" },

    { name: "artifact_export", module: "artifact-transfer-v1" },
    { name: "artifact_import", module: "artifact-transfer-v1" },
    { name: "artifact_copy", module: "artifact-transfer-v1" },

    { name: "session_start", module: "command-session-v1" },
    { name: "session_stop", module: "command-session-v1" },
    { name: "session_restart", module: "command-session-v1" },
  ];

  (window as any).webmcp_invoke_tool = async (toolName: string, args: any) => {
    switch (toolName) {
      case "editor_select":
          return { success: true };
      case "editor_switch_mode":
        if (args.mode) toolMode.set(args.mode as ToolMode);
        return { success: true };
      case "editor_update_property":
        if (args.property === 'color') activeColor.set(args.value);
        return { success: true };
      case "editor_preview":
          return { success: true };

      // Entity collection
      case "entity_create":
        if (args.name && args.tag) {
          addBoard({
            name: args.name,
            tag: args.tag,
            favorite: args.favorite || false,
            cells: get(boardCells).map(r => [...r]),
            cellSize: get(boardCells).length ? Math.floor(1024 / get(boardCells).length) : 40
          });
          return { success: true };
        }
        return { success: false, error: "Missing required fields" };
      case "entity_select":
        return { success: true };
      case "entity_update":
        updateBoard(args.id, args.updates);
        return { success: true };
      case "entity_delete":
        if (args.confirm) deleteBoard(args.id);
        return { success: true };
      case "entity_toggle":
        if (args.field === 'favorite') {
          const boards = get(savedBoards);
          const board = boards.find(b => b.id === args.id);
          if (board) updateBoard(args.id, { favorite: !board.favorite });
        }
        return { success: true };
      case "artifact_export":
      case "artifact_import":
      case "artifact_copy":
      case "session_start":
      case "session_stop":
      case "session_restart":
          return { success: true };
      default:
        return { success: false, error: "Tool not fully implemented in mock" };
    }
  };
};
