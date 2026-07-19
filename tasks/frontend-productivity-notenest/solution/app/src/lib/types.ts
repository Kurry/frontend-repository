export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  collapsed: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ChecklistBlock {
  id: string;
  items: ChecklistItem[];
}

export interface NoteImage {
  id: string;
  dataUrl: string;
  name: string;
}

export type NoteColor = '' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';

export interface Note {
  id: string;
  title: string;
  bodyHtml: string;
  folderId: string | null;
  pinned: boolean;
  color: NoteColor;
  checklists: ChecklistBlock[];
  images: NoteImage[];
  createdAt: number;
  updatedAt: number;
  deleted: boolean; // true if in trash
  deletedAt?: number;
}
