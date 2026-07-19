import { state, joinRoom, leaveRoom, queueFile } from "./store";

// zto-webmcp-v1 surface for the Weblink shell.
//
// Modules used:
// - command-session-v1 (tool_name_prefix "session"): connect / disconnect the
//   pending room session. IMPORTANT: this shell never has a real peer, so the
//   "connect" tool's return value only reflects the same honest
//   idle/connecting/waiting/disconnected status the visible badge shows. It
//   never reports a peer as connected.
// - artifact-transfer-v1 (tool_name_prefix "artifact"): queue a fixed sample
//   file into the local transfer queue. No raw file contents, blobs, or
//   filesystem paths are accepted as arguments — only a bounded "queue a
//   sample" import, matching the visible file-queue control. The real file
//   picker interaction stays a Playwright responsibility.

interface ToolDescriptor {
  name: string;
  description: string;
  module: string;
  operation: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
}

const TOOLS: ToolDescriptor[] = [
  {
    name: "session_connect",
    description:
      "Enter a room/peer identifier and initiate one connection attempt, bound to the visible " +
      "Room / peer identifier input and Join Room control. Never reports a peer as connected.",
    module: "command-session-v1",
    operation: "connect",
    parameters: {
      room_id: {
        type: "string",
        description: "Room or peer identifier, same value as the visible room-id input.",
        required: true,
      },
    },
  },
  {
    name: "session_disconnect",
    description:
      "Leave/cancel the pending session, bound to the visible Leave Room control. Sets the " +
      "connection badge to the disconnected state.",
    module: "command-session-v1",
    operation: "disconnect",
    parameters: {},
  },
  {
    name: "artifact_import",
    description:
      "Queue a fixed sample file into the local transfer queue, bound to the visible file-queue " +
      "surface. Does not accept raw file contents, blobs, or filesystem paths.",
    module: "artifact-transfer-v1",
    operation: "import",
    parameters: {},
  },
];

function sessionInfo() {
  return {
    contract_version: "zto-webmcp-v1",
    app: "weblink-shell",
    session: {
      client_id: state.identity.clientId,
      name: state.identity.name,
      room_id: state.room.roomId,
      status: state.room.status,
    },
  };
}

function listTools() {
  return TOOLS;
}

function invokeTool(name: string, args: Record<string, unknown> = {}) {
  switch (name) {
    case "session_connect": {
      const roomId = String(args.room_id ?? "").trim();
      if (!roomId) {
        return { ok: false, error: "room_id is required", status: state.room.status };
      }
      joinRoom(roomId);
      // Honest result only: reflects the same connecting/waiting state the
      // visible badge will show; never claims a peer connected.
      return {
        ok: true,
        status: state.room.status,
        room_id: state.room.roomId,
        peer_connected: false,
      };
    }
    case "session_disconnect": {
      leaveRoom();
      return { ok: true, status: state.room.status, peer_connected: false };
    }
    case "artifact_import": {
      const before = state.files.queue.length;
      queueFile("sample-transfer.txt", 2048);
      return {
        ok: true,
        queued_count: state.files.queue.length,
        added: state.files.queue.length - before,
      };
    }
    default:
      return { ok: false, error: `unknown tool: ${name}` };
  }
}

declare global {
  interface Window {
    webmcp_session_info: () => ReturnType<typeof sessionInfo>;
    webmcp_list_tools: () => ToolDescriptor[];
    webmcp_invoke_tool: (name: string, args?: Record<string, unknown>) => unknown;
  }
}

export function installWebmcp() {
  window.webmcp_session_info = sessionInfo;
  window.webmcp_list_tools = listTools;
  window.webmcp_invoke_tool = invokeTool;
}
