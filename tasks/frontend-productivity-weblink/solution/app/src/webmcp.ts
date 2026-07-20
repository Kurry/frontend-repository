import { state, joinRoom, leaveRoom, queueFile, startTransfer, pauseTransfer, resumeTransfer, cancelTransfer, retryTransfer } from "./store";

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
    description: "Enter a room/peer identifier and initiate one connection attempt.",
    module: "command-session-v1",
    operation: "connect",
    parameters: {
      room_id: { type: "string", description: "Room or peer identifier", required: true },
    },
  },
  {
    name: "session_disconnect",
    description: "Leave/cancel the pending session.",
    module: "command-session-v1",
    operation: "disconnect",
    parameters: {},
  },
  {
    name: "session_start",
    description: "Start a queued file transfer simulation.",
    module: "command-session-v1",
    operation: "start",
    parameters: {
      file_id: { type: "string", description: "ID of the queued file", required: true },
    },
  },
  {
    name: "session_pause",
    description: "Pause an ongoing file transfer.",
    module: "command-session-v1",
    operation: "pause",
    parameters: {
      file_id: { type: "string", description: "ID of the queued file", required: true },
    },
  },
  {
    name: "session_resume",
    description: "Resume a paused file transfer.",
    module: "command-session-v1",
    operation: "resume",
    parameters: {
      file_id: { type: "string", description: "ID of the queued file", required: true },
    },
  },
  {
    name: "session_stop",
    description: "Cancel a file transfer.",
    module: "command-session-v1",
    operation: "stop",
    parameters: {
      file_id: { type: "string", description: "ID of the queued file", required: true },
    },
  },
  {
    name: "session_restart",
    description: "Retry a canceled or completed transfer.",
    module: "command-session-v1",
    operation: "restart",
    parameters: {
      file_id: { type: "string", description: "ID of the queued file", required: true },
    },
  },
  {
    name: "artifact_import",
    description: "Queue a fixed sample file into the local transfer queue.",
    module: "artifact-transfer-v1",
    operation: "import",
    parameters: {},
  },
  {
    name: "artifact_export",
    description: "Return a preview of the session JSON or transcript MD.",
    module: "artifact-transfer-v1",
    operation: "export",
    parameters: {
       format: { type: "string", description: "Format: 'session-json' or 'transcript-md'", required: true }
    },
  },
  {
    name: "artifact_copy",
    description: "Confirm intention to copy an artifact. (Actual clipboard interaction is Playwright responsibility).",
    module: "artifact-transfer-v1",
    operation: "copy",
    parameters: {},
  }
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
      const validChars = /^[A-Za-z0-9\-_]+$/;
      if (!roomId || roomId.length > 64 || !validChars.test(roomId)) {
        return { ok: false, error: "invalid room_id", status: state.room.status };
      }
      joinRoom(roomId);
      return { ok: true, status: state.room.status, room_id: state.room.roomId, peer_connected: false };
    }
    case "session_disconnect": {
      leaveRoom();
      return { ok: true, status: state.room.status, peer_connected: false };
    }
    case "session_start": {
      startTransfer(String(args.file_id));
      return { ok: true };
    }
    case "session_pause": {
      pauseTransfer(String(args.file_id));
      return { ok: true };
    }
    case "session_resume": {
      resumeTransfer(String(args.file_id));
      return { ok: true };
    }
    case "session_stop": {
      cancelTransfer(String(args.file_id));
      return { ok: true };
    }
    case "session_restart": {
      retryTransfer(String(args.file_id));
      return { ok: true };
    }
    case "artifact_import": {
      const before = state.files.queue.length;
      queueFile("sample-transfer.txt", 2048);
      return { ok: true, queued_count: state.files.queue.length, added: state.files.queue.length - before };
    }
    case "artifact_export": {
      if (args.format === "session-json") {
         return { ok: true, preview: "json generation success" }; // The real generation happens in Playwright
      } else if (args.format === "transcript-md") {
         return { ok: true, preview: "md generation success" };
      }
      return { ok: false, error: "unknown format" };
    }
    case "artifact_copy": {
       return { ok: true, message: "Use Playwright for actual clipboard copy" };
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
