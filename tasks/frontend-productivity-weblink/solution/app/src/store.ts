import { createStore, produce } from "solid-js/store";
import type { z } from "zod";
import type { FileQueueStatusSchema, TransferLogEventSchema } from "./schemas";

export type ConnStatus = "idle" | "connecting" | "waiting" | "disconnected";

export interface ChatMessage {
  id: string;
  from: "you" | "demo";
  text: string;
  at: number;
}

export type FileQueueStatus = z.infer<typeof FileQueueStatusSchema>;
export type TransferLogEvent = z.infer<typeof TransferLogEventSchema>;

export interface QueuedFile {
  id: string;
  name: string;
  size: number;
  status: FileQueueStatus;
  bytesTransferred: number;
}

export interface TransferLogEntry {
  id: string;
  at: string;
  fileName: string;
  event: TransferLogEvent;
}

export interface WeblinkState {
  identity: {
    clientId: string;
    name: string;
  };
  room: {
    roomId: string;
    status: ConnStatus;
  };
  chat: {
    messages: ChatMessage[];
  };
  files: {
    queue: QueuedFile[];
  };
  transferLog: TransferLogEntry[];
  ui: {
    theme: "light" | "dark";
  };
}

const STORAGE_KEY = "weblink-shell-state-v1";

export function randomId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Math.random().toString(36).slice(2, 6)}`;
}

function seedState(): WeblinkState {
  const now = Date.now();
  return {
    identity: {
      clientId: randomId("peer"),
      name: "You",
    },
    room: {
      roomId: "",
      status: "idle",
    },
    chat: {
      messages: [
        {
          id: randomId("msg"),
          from: "demo",
          text: "Welcome to Weblink. This is a local loopback demo conversation — no real peer is connected.",
          at: now - 120000,
        },
        {
          id: randomId("msg"),
          from: "demo",
          text: "Enter a room or peer identifier and choose Join Room to start a connection attempt.",
          at: now - 60000,
        },
      ],
    },
    files: {
      queue: [],
    },
    transferLog: [],
    ui: {
      theme: "light",
    },
  };
}

function loadState(): WeblinkState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as Partial<WeblinkState>;
    const seed = seedState();
    return {
      identity: { ...seed.identity, ...parsed.identity },
      room: { ...seed.room, ...parsed.room },
      chat: { messages: parsed.chat?.messages ?? seed.chat.messages },
      files: { queue: parsed.files?.queue ?? seed.files.queue },
      transferLog: parsed.transferLog ?? seed.transferLog,
      ui: { ...seed.ui, ...parsed.ui },
    };
  } catch {
    return seedState();
  }
}

const initial = loadState();
// A restored session should never resume as "connecting" or "waiting" —
// only idle/disconnected states are safe to restore across a reload,
// since no real peer connection can survive a reload.
if (initial.room.status === "connecting" || initial.room.status === "waiting") {
  initial.room.status = "disconnected";
}

// A mid-transfer row restores as paused at its saved progress, never as transferring
initial.files.queue.forEach(file => {
  if (file.status === "transferring") {
    file.status = "paused";
  }
});

export const [state, setState] = createStore<WeblinkState>(initial);

export function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
}

let pendingTimer: ReturnType<typeof setTimeout> | undefined;

export function joinRoom(roomId: string) {
  const trimmed = roomId.trim();
  setState("room", "roomId", trimmed);
  if (!trimmed) return;
  clearTimeout(pendingTimer);
  setState("room", "status", "connecting");
  persist();
  pendingTimer = setTimeout(() => {
    // Honest state only: we never fabricate a connected peer. After the
    // connection attempt, the session settles into "waiting" for a peer
    // that may never arrive.
    setState("room", "status", "waiting");
    persist();
  }, 900);
}

export function leaveRoom() {
  clearTimeout(pendingTimer);
  setState("room", "status", "disconnected");
  persist();
}

export function sendMessage(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  setState(
    "chat",
    "messages",
    produce((list) => {
      list.push({ id: randomId("msg"), from: "you", text: trimmed, at: Date.now() });
    }),
  );
  persist();
}

export function logEvent(fileName: string, event: TransferLogEvent) {
  setState(
    "transferLog",
    produce((log) => {
      log.unshift({
        id: randomId("log"),
        at: new Date().toISOString(),
        fileName,
        event,
      });
    })
  );
  persist();
}

export function queueFile(name: string, size: number) {
  setState(
    "files",
    "queue",
    produce((list) => {
      list.push({ id: randomId("file"), name, size, status: "not-started", bytesTransferred: 0 });
    }),
  );
  logEvent(name, "queued");
  persist();
}

export function setName(name: string) {
  setState("identity", "name", name);
  persist();
}

export function toggleTheme() {
  setState("ui", "theme", state.ui.theme === "light" ? "dark" : "light");
  persist();
}

// Simulated transfers map to hold interval references
const transferIntervals = new Map<string, ReturnType<typeof setInterval>>();

export function clearAllTransferIntervals() {
  for (const interval of transferIntervals.values()) {
    clearInterval(interval);
  }
  transferIntervals.clear();
}

export function startTransfer(id: string) {
  const index = state.files.queue.findIndex(f => f.id === id);
  if (index === -1) return;
  const file = state.files.queue[index];
  if (file.status !== "not-started" && file.status !== "paused") return;

  const existingInterval = transferIntervals.get(id);
  if (existingInterval) {
    clearInterval(existingInterval);
    transferIntervals.delete(id);
  }

  setState("files", "queue", index, "status", "transferring");
  logEvent(file.name, file.status === "not-started" ? "started" : "resumed");

  if (file.size === 0) {
     setState("files", "queue", index, "status", "completed");
     setState("files", "queue", index, "bytesTransferred", 0);
     logEvent(file.name, "completed");
     persist();
     return;
  }

  const chunk = Math.max(1, Math.floor(file.size / 20)); // Transfer in 20 steps

  const interval = setInterval(() => {
    const current = state.files.queue.find(f => f.id === id);
    if (!current || current.status !== "transferring") {
      clearInterval(interval);
      transferIntervals.delete(id);
      return;
    }

    let nextBytes = current.bytesTransferred + chunk;
    if (nextBytes >= current.size) {
      nextBytes = current.size;
      setState("files", "queue", index, "bytesTransferred", nextBytes);
      setState("files", "queue", index, "status", "completed");
      logEvent(current.name, "completed");
      clearInterval(interval);
      transferIntervals.delete(id);
    } else {
      setState("files", "queue", index, "bytesTransferred", nextBytes);
    }
    persist();
  }, 200);

  transferIntervals.set(id, interval);
}

export function pauseTransfer(id: string) {
  const index = state.files.queue.findIndex(f => f.id === id);
  if (index === -1) return;
  const file = state.files.queue[index];
  if (file.status !== "transferring") return;

  setState("files", "queue", index, "status", "paused");
  logEvent(file.name, "paused");

  const interval = transferIntervals.get(id);
  if (interval) {
    clearInterval(interval);
    transferIntervals.delete(id);
  }
  persist();
}

export function resumeTransfer(id: string) {
   startTransfer(id);
}

export function cancelTransfer(id: string) {
  const index = state.files.queue.findIndex(f => f.id === id);
  if (index === -1) return;
  const file = state.files.queue[index];
  if (file.status === "completed" || file.status === "canceled") return;

  setState("files", "queue", index, "status", "canceled");
  logEvent(file.name, "canceled");

  const interval = transferIntervals.get(id);
  if (interval) {
    clearInterval(interval);
    transferIntervals.delete(id);
  }
  persist();
}

export function retryTransfer(id: string) {
  const index = state.files.queue.findIndex(f => f.id === id);
  if (index === -1) return;
  const file = state.files.queue[index];
  if (file.status !== "canceled" && file.status !== "completed") return;

  setState("files", "queue", index, "status", "not-started");
  setState("files", "queue", index, "bytesTransferred", 0);
  logEvent(file.name, "retried");
  persist();
}

export function removeSelectedFiles(ids: string[]) {
   let deletedNames: string[] = [];
   setState(
    "files",
    "queue",
    produce((list) => {
      for (const id of ids) {
         const idx = list.findIndex(f => f.id === id);
         if (idx !== -1) {
            deletedNames.push(list[idx].name);
            list.splice(idx, 1);
         }
      }
    })
  );
  for (const id of ids) {
    const interval = transferIntervals.get(id);
    if (interval) {
      clearInterval(interval);
      transferIntervals.delete(id);
    }
  }
  for (const name of deletedNames) {
     logEvent(name, "removed");
  }
  persist();
}

export function retrySelectedFiles(ids: string[]) {
   for (const id of ids) {
      const file = state.files.queue.find(f => f.id === id);
      if (file && (file.status === "canceled" || file.status === "completed")) {
         retryTransfer(id);
      }
   }
}

export function reorderFiles(fromIndex: number, toIndex: number) {
  setState(
    "files",
    "queue",
    produce((list) => {
      const item = list.splice(fromIndex, 1)[0];
      list.splice(toIndex, 0, item);
    })
  );
  persist();
}
