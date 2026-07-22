import { get } from 'svelte/store';
import {
  boardCells, toolMode, activeColor, cellSize, updateBoardSize, clearBoard,
  savedBoards, activeMode, tagFilter, updateBoard, deleteBoard, addBoard,
  mirrorMode, visionMode, showGrid, selectedCell, setBoardSelection,
  importDialogOpen, exportFormat, pushToast, cameraOpen, loadBoardToCanvas,
  pushHistory
} from './store';
import { buildProjectJson, buildCssPalette, copyText } from './projectDoc';
import type { ToolMode, MirrorMode, VisionMode } from './types';

const MIRROR_CYCLE: MirrorMode[] = ['off', 'horizontal', 'vertical', 'both'];
const VISION_CYCLE: VisionMode[] = ['off', 'protanopia', 'deuteranopia', 'tritanopia'];

function paintCell(r: number, col: number, color: string, kind: 'color' | 'qr') {
  const cells = get(boardCells);
  if (r < 0 || r >= cells.length || col < 0 || col >= (cells[0]?.length ?? 0)) return;
  pushHistory(cells);
  boardCells.update(grid => {
    const next = grid.map(row => row.map(c => (c ? { ...c } : null)));
    next[r][col] = { kind, color };
    return next;
  });
}

export const registerWebMCP = () => {
  if (typeof window === 'undefined') return;

  (window as any).webmcp_session_info = () => ({
    title: "Grid Paint Studio",
    version: "1.0",
    modules: ["structured-editor-v1", "entity-collection-v1", "artifact-transfer-v1", "command-session-v1"]
  });

  (window as any).webmcp_list_tools = () => [
    {
      name: "editor_select",
      module: "structured-editor-v1",
      inputSchema: {
        type: "object",
        default: { r: 0, c: 0 },
        properties: {
          r: { type: "integer", default: 0 },
          c: { type: "integer", default: 0 }
        },
        required: ["r", "c"]
      }
    },
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
      case "editor_select": {
        const r = Number(args?.r ?? args?.row ?? -1);
        const col = Number(args?.c ?? args?.col ?? args?.column ?? -1);
        const cells = get(boardCells);
        if (r < 0 || r >= cells.length || col < 0 || col >= (cells[0]?.length ?? 0)) {
          return { success: false, error: "Cell coordinate out of range" };
        }
        selectedCell.set({ r, c: col });
        return { success: true, selected: { r, c: col } };
      }
      case "editor_switch_mode": {
        const mode = args?.mode as ToolMode;
        if (!(['qr', 'color', 'fill', 'erase'] as ToolMode[]).includes(mode)) {
          return { success: false, error: "mode must be qr | color | fill | erase" };
        }
        toolMode.set(mode);
        return { success: true, tool: get(toolMode) };
      }
      case "editor_update_property": {
        if (args?.property === 'color') {
          activeColor.set(String(args.value));
          if (typeof args?.r === 'number' && typeof (args?.c ?? args?.col) === 'number') {
            paintCell(Number(args.r), Number(args.c ?? args.col), String(args.value), get(toolMode) === 'qr' ? 'qr' : 'color');
          }
          return { success: true, swatch: get(activeColor) };
        }
        if (args?.property === 'mirror') {
          const m = args.value as MirrorMode;
          if (MIRROR_CYCLE.includes(m)) mirrorMode.set(m);
          return { success: true, mirror: get(mirrorMode) };
        }
        if (args?.property === 'cellSize') {
          updateBoardSize(Number(args.value));
          return { success: true, cellSize: get(cellSize) };
        }
        return { success: false, error: "Unknown editor property" };
      }
      case "editor_preview": {
        // Vision preview cycles the paint-stage filter (same logic as the
        // Vision control) without rewriting stored cell colors.
        if (args?.vision && VISION_CYCLE.includes(args.vision as VisionMode)) {
          visionMode.set(args.vision as VisionMode);
        } else {
          visionMode.update(v => VISION_CYCLE[(VISION_CYCLE.indexOf(v) + 1) % VISION_CYCLE.length]);
        }
        return { success: true, vision: get(visionMode) };
      }

      case "entity_create": {
        const name = typeof args?.name === 'string' ? args.name.trim() : '';
        const tag = args?.tag;
        if (!name || name.length > 40) return { success: false, error: "name is required and max 40 characters" };
        const tags = ['pattern', 'portrait', 'abstract', 'logo', 'study', 'signal'];
        if (!tags.includes(tag)) return { success: false, error: "tag must be one of the closed enum" };
        addBoard({
          name,
          tag,
          favorite: false,
          cells: get(boardCells).map(row => row.map(c => (c ? { ...c } : null))),
          cellSize: get(cellSize)
        });
        return { success: true, count: get(savedBoards).length };
      }
      case "entity_select": {
        const id = String(args?.id ?? '');
        if (!get(savedBoards).some(b => b.id === id)) return { success: false, error: `No board ${id}` };
        setBoardSelection([id]);
        activeMode.set('gallery');
        return { success: true, selected: [id] };
      }
      case "entity_update": {
        const id = String(args?.id ?? '');
        if (!get(savedBoards).some(b => b.id === id)) return { success: false, error: `No board ${id}` };
        updateBoard(id, args?.updates ?? {});
        return { success: true };
      }
      case "entity_delete": {
        if (!args?.confirm) return { success: false, error: "Delete requires confirm=true" };
        const id = String(args?.id ?? '');
        if (!get(savedBoards).some(b => b.id === id)) return { success: false, error: `No board found with id ${id}` };
        deleteBoard(id);
        return { success: true, deleted: true, count: get(savedBoards).length };
      }
      case "entity_toggle": {
        const id = String(args?.id ?? '');
        const board = get(savedBoards).find(b => b.id === id);
        if (!board) return { success: false, error: `No board ${id}` };
        if (args?.field === 'favorite') updateBoard(id, { favorite: !board.favorite });
        return { success: true, favorite: get(savedBoards).find(b => b.id === id)?.favorite ?? board.favorite };
      }

      case "artifact_export": {
        const fmt = (['project-json', 'png', 'css-palette'] as const).includes(args?.format) ? args.format : 'project-json';
        exportFormat.set(fmt);
        activeMode.set('export');
        return { success: true, format: fmt, view: 'export' };
      }
      case "artifact_import": {
        activeMode.set('export');
        importDialogOpen.set(true);
        return { success: true, mode: 'project-json', dialog: 'import-project' };
      }
      case "artifact_copy": {
        const fmt = args?.format === 'css-palette' ? 'css-palette' : 'project-json';
        const text = fmt === 'css-palette' ? buildCssPalette() : buildProjectJson();
        const ok = await copyText(text);
        if (ok) pushToast(fmt === 'css-palette' ? 'Copied CSS palette' : 'Copied Project JSON', 'success');
        return { success: ok, format: fmt };
      }

      case "session_start": {
        activeMode.set('paint');
        cameraOpen.set(true);
        return { success: true, session: 'camera', state: 'started' };
      }
      case "session_stop": {
        cameraOpen.set(false);
        return { success: true, session: 'camera', state: 'stopped' };
      }
      case "session_restart": {
        cameraOpen.set(false);
        // Reopen on the next tick so the overlay remounts (fade in again).
        setTimeout(() => cameraOpen.set(true), 0);
        return { success: true, session: 'camera', state: 'restarted' };
      }

      default:
        return { success: false, error: "Tool not implemented" };
    }
  };
};
