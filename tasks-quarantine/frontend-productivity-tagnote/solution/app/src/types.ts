export interface NoteMark {
  start: number;
  end: number;
  style: 'bold' | 'italic';
}

export interface Note {
  id: string;
  text: string;
  tags: string[];
  marks: NoteMark[]; // bold/italic formatting spans over `text`
  createdAt: number; // timestamp
  pinned: boolean;
  archived: boolean;
  done: boolean; // for TODO notes
  file?: {
    name: string;
    size: number; // in bytes
  };
}

export interface AppState {
  notes: Note[];
  todoTags: string[]; // tags that are marked as TODO
}

export interface HistoryEntry {
  state: AppState;
  timestamp: number;
  label: string;
}

export interface HistoryBranch {
  id: string;
  label: string;
  state: AppState;
}

export interface HistoryState {
  past: HistoryEntry[];
  present: AppState;
  future: HistoryEntry[];
  branchId: string;
  branches: HistoryBranch[];
}
