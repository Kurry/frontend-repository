export interface NoteImage {
  id: string;
  dataUrl: string;
  filename: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  images: NoteImage[];
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}
