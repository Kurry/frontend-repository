import { createStore, produce } from "solid-js/store";

export type ConnStatus = "idle" | "connecting" | "waiting" | "disconnected";

export interface ChatMessage {
  id: string;
  from: "you" | "demo";
  text: string;
  at: number;
}

export interface QueuedFile {
  id: string;
  name: string;
  size: number;
  status: "Not Started";
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
  ui: {
    theme: "light" | "dark";
  };
}

const STORAGE_KEY = "weblink-shell-state-v1";

function randomId(prefix: string): string {
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

export function queueFile(name: string, size: number) {
  setState(
    "files",
    "queue",
    produce((list) => {
      list.push({ id: randomId("file"), name, size, status: "Not Started" });
    }),
  );
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
