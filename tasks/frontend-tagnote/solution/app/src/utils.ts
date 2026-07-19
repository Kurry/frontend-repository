import type { Note } from './types';

export function parseTags(text: string): string[] {
  const tagSet = new Set<string>();
  const matches = text.match(/#(\w+)/g);
  if (matches) {
    for (const m of matches) {
      tagSet.add(m.slice(1).toLowerCase());
    }
  }
  return Array.from(tagSet);
}

export function extractUrls(text: string): string[] {
  const urls: string[] = [];
  const regex = /https?:\/\/[^\s]+/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    urls.push(match[0]);
  }
  return urls;
}

export function getAllTags(text: string): string[] {
  const tags = parseTags(text);
  const urls = extractUrls(text);
  if (urls.length > 0 && !tags.includes('link')) {
    tags.push('link');
  }
  return tags;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderNoteText(text: string): string {
  // First escape the entire text
  let escaped = escapeHtml(text);
  // Then replace escaped URLs with clickable links
  const urls = extractUrls(text);
  for (const url of urls) {
    const escapedUrl = escapeHtml(url);
    escaped = escaped.replace(
      escapedUrl,
      `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="text-[var(--color-link)] underline break-all">${escapedUrl}</a>`
    );
  }
  return escaped;
}

export function formatDate(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const noteDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (noteDate.getTime() === today.getTime()) return 'Today';
  if (noteDate.getTime() === yesterday.getTime()) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function getNoteTimestamp(note: Note): number {
  return note.createdAt;
}

export function dateToKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function noteToDateKey(note: Note): string {
  const d = new Date(note.createdAt);
  return dateToKey(d);
}
