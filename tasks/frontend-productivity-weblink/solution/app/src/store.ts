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
const CONNECTING_MS = 2800;
const TRANSFER_STEPS = 80;
const TRANSFER_INTERVAL_MS = 200;

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
  initial.room.status = initial.room.roomId.trim() ? "disconnected" : "idle";
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
  }, CONNECTING_MS);
}

export function setRoomIdle() {
  clearTimeout(pendingTimer);
  setState("room", "status", "idle");
  persist();
}

export function leaveRoom() {
  clearTimeout(pendingTimer);
  setState("room", "status", "disconnected");
  persist();
}

// Cancel a pending join attempt without touching the connection status.
// Used by Session Pack import, which resets the badge to idle and must not
// let a stale joinRoom timer later flip it to "waiting".
export function cancelPendingJoin() {
  clearTimeout(pendingTimer);
  pendingTimer = undefined;
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

export function startTransfer(id: string): boolean {
  const index = state.files.queue.findIndex(f => f.id === id);
  if (index === -1) return false;
  const file = state.files.queue[index];
  if (file.status !== "not-started" && file.status !== "paused") return false;
  const transferEvent: TransferLogEvent = file.status === "paused" ? "resumed" : "started";

  // Defensively stop any stale timer still registered for this id (e.g. one
  // left running by a Session Pack import that swapped the queue out from
  // under it) so resuming never ends up with two intervals racing on the
  // same row.
  const staleInterval = transferIntervals.get(id);
  if (staleInterval) {
    clearInterval(staleInterval);
    transferIntervals.delete(id);
  }

  setState("files", "queue", index, "status", "transferring");
  logEvent(file.name, transferEvent);

  if (file.size === 0) {
     setState("files", "queue", index, "status", "completed");
     setState("files", "queue", index, "bytesTransferred", 0);
     logEvent(file.name, "completed");
     persist();
     return true;
  }

  const chunk = Math.max(1, Math.floor(file.size / TRANSFER_STEPS));

  const interval = setInterval(() => {
    // Re-resolve the row index by id on every tick: the queue can be
    // reordered mid-transfer, so a captured index would write to the wrong row.
    const currentIndex = state.files.queue.findIndex(f => f.id === id);
    const current = currentIndex === -1 ? undefined : state.files.queue[currentIndex];
    if (!current || current.status !== "transferring") {
      clearInterval(interval);
      transferIntervals.delete(id);
      return;
    }

    let nextBytes = current.bytesTransferred + chunk;
    if (nextBytes >= current.size) {
      nextBytes = current.size;
      setState("files", "queue", currentIndex, "bytesTransferred", nextBytes);
      setState("files", "queue", currentIndex, "status", "completed");
      logEvent(current.name, "completed");
      clearInterval(interval);
      transferIntervals.delete(id);
    } else {
      setState("files", "queue", currentIndex, "bytesTransferred", nextBytes);
    }
    persist();
  }, TRANSFER_INTERVAL_MS);

  transferIntervals.set(id, interval);
  return true;
}

export function pauseAllActiveTransfers() {
  for (const file of state.files.queue) {
    if (file.status === "transferring") {
      pauseTransfer(file.id);
    }
  }
}

export function pauseTransfer(id: string): boolean {
  const index = state.files.queue.findIndex(f => f.id === id);
  if (index === -1) return false;
  const file = state.files.queue[index];
  if (file.status !== "transferring") return false;

  setState("files", "queue", index, "status", "paused");
  logEvent(file.name, "paused");

  const interval = transferIntervals.get(id);
  if (interval) {
    clearInterval(interval);
    transferIntervals.delete(id);
  }
  persist();
  return true;
}

export function resumeTransfer(id: string): boolean {
  // Resume is only valid from "paused" — unlike startTransfer, it must not
  // silently accept a "not-started" row (that's what session_start/Start is
  // for), otherwise WebMCP's session_resume could begin a transfer the UI's
  // Resume control would never allow.
  const index = state.files.queue.findIndex(f => f.id === id);
  if (index === -1) return false;
  if (state.files.queue[index].status !== "paused") return false;
  return startTransfer(id);
}

export function cancelTransfer(id: string): boolean {
  const index = state.files.queue.findIndex(f => f.id === id);
  if (index === -1) return false;
  const file = state.files.queue[index];
  if (file.status === "completed" || file.status === "canceled") return false;

  setState("files", "queue", index, "status", "canceled");
  logEvent(file.name, "canceled");

  const interval = transferIntervals.get(id);
  if (interval) {
    clearInterval(interval);
    transferIntervals.delete(id);
  }
  persist();
  return true;
}

// Session Pack import replaces the entire file queue wholesale, so any
// timers still ticking for the old rows (which never went through
// pauseTransfer/cancelTransfer) would otherwise keep resolving by id
// against the new queue and double-advance bytesTransferred if the user
// resumes a row that reuses an old id.
export function clearAllTransferIntervals() {
  for (const interval of transferIntervals.values()) {
    clearInterval(interval);
  }
  transferIntervals.clear();
}

export function retryTransfer(id: string): boolean {
  const index = state.files.queue.findIndex(f => f.id === id);
  if (index === -1) return false;
  const file = state.files.queue[index];
  if (file.status !== "canceled" && file.status !== "completed") return false;

  setState("files", "queue", index, "status", "not-started");
  setState("files", "queue", index, "bytesTransferred", 0);
  logEvent(file.name, "retried");
  persist();
  return true;
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
