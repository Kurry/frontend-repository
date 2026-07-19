/**
 * WebMCP surface for ScribbleSpace (contract zto-webmcp-v1).
 *
 * Every tool dispatches the SAME Redux action a visible control dispatches — it
 * is the identical domain command the UI uses, so there is no success path the
 * user interface itself cannot produce. Delete operations require confirm=true.
 *
 *   window.webmcp_session_info()
 *   window.webmcp_list_tools()
 *   window.webmcp_invoke_tool(name, args)
 *
 * Modules & bindings:
 *   structured-editor-v1
 *     editor_object_types = ["note", "flashcard", "shape"]
 *       (shape kinds: rectangle, circle, arrow)
 *     editor_operations   = ["add","select","delete","update_property",
 *                            "set_content","switch_mode","preview"]
 *     editor_properties   = ["color","text","front","back","z-order"]
 *     editor_modes        = ["select","connect"]
 *   entity-collection-v1
 *     entity              = "board"
 *     entity_operations   = ["create","select","update","delete"]
 *   command-session-v1  (the deterministic local live-event stream)
 *     session_operations = ["start","pause","connect","disconnect","advance"]
 *     demos              = ["deliver-out-of-order","reconnect"]
 *
 * Excluded from WebMCP (gesture / timing — stay Playwright-observed): canvas
 * pan/zoom drag, object drag + corner-handle resize, the Connect click-sequence,
 * mini-map click-recenter, search pan-to-match, and the live-event tick timing.
 */
import { store } from './store';
import {
  addObject,
  selectOnly,
  toggleSelect,
  deleteSelectedObjects,
  setShowDeleteConfirm,
  updateObject,
  bringToFront,
  sendToBack,
  setTool,
  addBoard,
  setActiveBoard,
  renameBoard,
  deleteBoard,
  streamStart,
  streamPause,
  streamDisconnect,
  streamReconnect,
  streamReconnectFinish,
  streamTick,
  streamDeliverOutOfOrder,
} from './slices/appSlice';
import type { AppState, Board, CanvasObject } from './types';

type ToolResult = Record<string, unknown>;
interface ToolDef {
  description: string;
  handler: (args: Record<string, unknown>) => ToolResult;
}

const OBJECT_KINDS = ['note', 'flashcard', 'rectangle', 'circle', 'arrow'] as const;
type ObjectKind = (typeof OBJECT_KINDS)[number];

const getApp = (): AppState => store.getState().app;
const activeBoard = (): Board | undefined => {
  const s = getApp();
  return s.boards.find(b => b.id === s.activeBoardId);
};
const findObject = (id: string): CanvasObject | undefined =>
  activeBoard()?.objects.find(o => o.id === id);

const objectSummary = (o: CanvasObject) => ({
  id: o.id,
  type: o.type,
  x: Math.round(o.x),
  y: Math.round(o.y),
  width: Math.round(o.width),
  height: Math.round(o.height),
  zIndex: o.zIndex,
  color: o.color,
  text: o.text,
  front: o.front,
  back: o.back,
  flipped: o.flipped,
});

const tools: Record<string, ToolDef> = {
  // ----- structured-editor-v1 ------------------------------------------------
  editor_add: {
    description:
      'Add a canvas object to the active board (same as the New Note / New ' +
      'Flashcard / New Shape controls). object_type: note, flashcard, ' +
      'rectangle, circle, or arrow. Optional x, y place it in world ' +
      'coordinates (default near canvas centre). Returns the new object id.',
    handler(args) {
      const kind = String(args.object_type ?? args.type ?? '') as ObjectKind;
      if (!OBJECT_KINDS.includes(kind)) {
        return { ok: false, error: `object_type must be one of ${OBJECT_KINDS.join(', ')}` };
      }
      const x = typeof args.x === 'number' ? args.x : 320;
      const y = typeof args.y === 'number' ? args.y : 220;
      store.dispatch(addObject({ kind, x, y }));
      const id = getApp().lastAddedId;
      const obj = id ? findObject(id) : undefined;
      return { ok: true, id, object: obj ? objectSummary(obj) : null };
    },
  },
  editor_select: {
    description:
      'Select an object by id (same as clicking it). Pass additive=true to ' +
      'shift-click it into a multi-selection (toggles membership). Returns the ' +
      'current selectedIds.',
    handler(args) {
      const id = String(args.id ?? '');
      if (!findObject(id)) return { ok: false, error: `No object with id ${id} on the active board` };
      if (args.additive === true) store.dispatch(toggleSelect(id));
      else store.dispatch(selectOnly(id));
      return { ok: true, selectedIds: getApp().selectedIds.slice() };
    },
  },
  editor_delete: {
    description:
      'Delete every currently selected object and any connectors touching them ' +
      '(same as Delete Selected, past its confirmation). Requires confirm=true.',
    handler(args) {
      if (args.confirm !== true) {
        return { ok: false, error: 'Deleting is destructive; pass confirm=true to proceed' };
      }
      const before = getApp().selectedIds.length;
      if (before === 0) return { ok: false, error: 'Nothing is selected' };
      store.dispatch(setShowDeleteConfirm(true));
      store.dispatch(deleteSelectedObjects());
      return { ok: true, deleted: before, remaining: activeBoard()?.objects.length ?? 0 };
    },
  },
  editor_update_property: {
    description:
      'Update a structural property of an object. property=color sets its ' +
      'colour (value = hex, same as a colour-picker swatch). property=z-order ' +
      "sets stacking with value 'front' (Bring to Front) or 'back' (Send to " +
      'Back).',
    handler(args) {
      const id = String(args.id ?? '');
      const property = String(args.property ?? '');
      const obj = findObject(id);
      if (!obj) return { ok: false, error: `No object with id ${id} on the active board` };
      if (property === 'color') {
        const value = String(args.value ?? '');
        if (!value) return { ok: false, error: 'color requires a hex value' };
        store.dispatch(updateObject({ id, updates: { color: value } }));
        return { ok: true, id, color: findObject(id)?.color };
      }
      if (property === 'z-order') {
        const value = String(args.value ?? '');
        if (value === 'front') store.dispatch(bringToFront(id));
        else if (value === 'back') store.dispatch(sendToBack(id));
        else return { ok: false, error: "z-order value must be 'front' or 'back'" };
        return { ok: true, id, zIndex: findObject(id)?.zIndex };
      }
      return { ok: false, error: "property must be 'color' or 'z-order' (use editor_set_content for text)" };
    },
  },
  editor_set_content: {
    description:
      'Set editable text content of a note or flashcard (same as typing into ' +
      'it). field=text for a note body, field=front or field=back for a ' +
      'flashcard side. value is the new string.',
    handler(args) {
      const id = String(args.id ?? '');
      const field = String(args.field ?? '');
      const value = String(args.value ?? '');
      const obj = findObject(id);
      if (!obj) return { ok: false, error: `No object with id ${id} on the active board` };
      if (field === 'text') {
        if (obj.type !== 'note') return { ok: false, error: 'text applies to notes only' };
        store.dispatch(updateObject({ id, updates: { text: value } }));
      } else if (field === 'front' || field === 'back') {
        if (obj.type !== 'flashcard') return { ok: false, error: `${field} applies to flashcards only` };
        store.dispatch(updateObject({ id, updates: { [field]: value } }));
      } else {
        return { ok: false, error: "field must be 'text', 'front', or 'back'" };
      }
      const updated = findObject(id);
      return { ok: true, id, object: updated ? objectSummary(updated) : null };
    },
  },
  editor_switch_mode: {
    description:
      "Switch the active canvas tool/mode (same as the Select / Connect toolbar " +
      "toggles). mode='select' or mode='connect'.",
    handler(args) {
      const mode = String(args.mode ?? '');
      if (mode !== 'select' && mode !== 'connect') {
        return { ok: false, error: "mode must be 'select' or 'connect'" };
      }
      store.dispatch(setTool(mode));
      return { ok: true, activeTool: getApp().activeTool };
    },
  },
  editor_preview: {
    description:
      'Read-only preview of the active board: its name plus every object ' +
      '(type, position, size, colour, text/front/back, flip state) and ' +
      'connector count. No state is changed.',
    handler() {
      const board = activeBoard();
      if (!board) return { ok: false, error: 'No active board' };
      return {
        ok: true,
        board: board.name,
        objectCount: board.objects.length,
        connectorCount: board.connectors.length,
        objects: board.objects.map(objectSummary),
      };
    },
  },

  // ----- entity-collection-v1 (board) ---------------------------------------
  board_create: {
    description:
      'Create a new, independently persisted board and make it active (same as ' +
      'the New Board control). Returns the new board id and name.',
    handler() {
      store.dispatch(addBoard());
      const s = getApp();
      const board = s.boards.find(b => b.id === s.activeBoardId);
      return { ok: true, id: board?.id, name: board?.name, boardCount: s.boards.length };
    },
  },
  board_select: {
    description: 'Switch to an existing board by id (same as clicking its tab).',
    handler(args) {
      const id = String(args.id ?? '');
      if (!getApp().boards.some(b => b.id === id)) {
        return { ok: false, error: `No board with id ${id}` };
      }
      store.dispatch(setActiveBoard(id));
      return { ok: true, activeBoardId: getApp().activeBoardId };
    },
  },
  board_update: {
    description:
      'Rename a board (same as its rename control). Args: id, name. An empty ' +
      'name is rejected, matching the UI.',
    handler(args) {
      const id = String(args.id ?? '');
      const name = String(args.name ?? '');
      if (!getApp().boards.some(b => b.id === id)) {
        return { ok: false, error: `No board with id ${id}` };
      }
      if (!name.trim()) return { ok: false, error: 'name cannot be empty' };
      store.dispatch(renameBoard({ boardId: id, name }));
      const board = getApp().boards.find(b => b.id === id);
      return { ok: true, id, name: board?.name };
    },
  },
  board_delete: {
    description:
      'Delete a board by id (same as its delete control, past confirmation). ' +
      'Deleting the active board switches to another existing board or creates ' +
      'a fresh default one. Requires confirm=true.',
    handler(args) {
      const id = String(args.id ?? '');
      if (args.confirm !== true) {
        return { ok: false, error: 'Deleting a board is destructive; pass confirm=true' };
      }
      if (!getApp().boards.some(b => b.id === id)) {
        return { ok: false, error: `No board with id ${id}` };
      }
      store.dispatch(deleteBoard(id));
      const s = getApp();
      return { ok: true, boardCount: s.boards.length, activeBoardId: s.activeBoardId };
    },
  },

  // ----- command-session-v1 (deterministic live-event stream) ---------------
  session_start: {
    description:
      'Start the live-event stream (same as the Start control). Marks the ' +
      'stream active so events can be applied.',
    handler() {
      store.dispatch(streamStart());
      return { ok: true, status: getApp().stream.status };
    },
  },
  session_pause: {
    description: 'Pause the live-event stream (same as the Pause control).',
    handler() {
      store.dispatch(streamPause());
      return { ok: true, status: getApp().stream.status };
    },
  },
  session_connect: {
    description:
      'Reconnect / catch up the stream (same as the Reconnect control): applies ' +
      'every still-missing event exactly once, in logical-timestamp order. ' +
      'Idempotent — stable event IDs mean a repeat reconnect applies nothing new.',
    handler() {
      const before = getApp().stream.appliedIds.length;
      store.dispatch(streamReconnect());
      store.dispatch(streamReconnectFinish());
      const s = getApp();
      return {
        ok: true,
        status: s.stream.status,
        appliedCount: s.stream.appliedIds.length,
        newlyApplied: s.stream.appliedIds.length - before,
      };
    },
  },
  session_disconnect: {
    description:
      'Disconnect the stream (same as the Disconnect control). Later events are ' +
      'missed until a reconnect catches them up.',
    handler() {
      store.dispatch(streamDisconnect());
      return { ok: true, status: getApp().stream.status };
    },
  },
  session_advance: {
    description:
      'Advance the stream by one deterministic tick (applies the next pending ' +
      'event when active). Same domain command as the timed ticker, invoked ' +
      'once and deterministically rather than on a timer.',
    handler() {
      const before = getApp().stream.appliedIds.length;
      store.dispatch(streamTick());
      const s = getApp();
      return {
        ok: true,
        status: s.stream.status,
        appliedCount: s.stream.appliedIds.length,
        newlyApplied: s.stream.appliedIds.length - before,
      };
    },
  },
  session_deliver_out_of_order: {
    description:
      "Demo 'deliver-out-of-order': deliver the next offered event ahead of its " +
      'predecessor (same as the Deliver Out of Order control). The event is ' +
      'received but not applied until a reconnect; a duplicate delivery is ignored.',
    handler() {
      store.dispatch(streamDeliverOutOfOrder());
      const s = getApp();
      return {
        ok: true,
        status: s.stream.status,
        receivedIds: s.stream.receivedIds.slice(),
        appliedCount: s.stream.appliedIds.length,
      };
    },
  },
};

export function initWebmcp(): void {
  window.webmcp_session_info = function () {
    return {
      contract_version: 'zto-webmcp-v1',
      app: 'scribblespace',
      modules: ['structured-editor-v1', 'entity-collection-v1', 'command-session-v1'],
      editor_object_types: ['note', 'flashcard', 'shape'],
      editor_operations: ['add', 'select', 'delete', 'update_property', 'set_content', 'switch_mode', 'preview'],
      editor_properties: ['color', 'text', 'front', 'back', 'z-order'],
      editor_modes: ['select', 'connect'],
      entity: 'board',
      entity_operations: ['create', 'select', 'update', 'delete'],
      session_operations: ['start', 'pause', 'connect', 'disconnect', 'advance'],
      demos: ['deliver-out-of-order', 'reconnect'],
      tools: Object.keys(tools),
      tool_count: Object.keys(tools).length,
    };
  };
  window.webmcp_list_tools = function () {
    return Object.keys(tools).map(name => ({ name, description: tools[name].description }));
  };
  window.webmcp_invoke_tool = function (name: string, args?: Record<string, unknown>) {
    if (!tools[name]) throw new Error('Unknown WebMCP tool: ' + name);
    return tools[name].handler(args || {});
  };
}
