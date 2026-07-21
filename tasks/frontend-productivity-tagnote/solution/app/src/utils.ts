import type { AppState, Note, NoteMark } from './types';
import { renderFormattedText } from './marks';

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

function injectLinks(html: string, text: string): string {
  const urls = extractUrls(text);
  let result = html;
  for (const url of urls) {
    const escapedUrl = escapeHtml(url);
    const linkHtml = `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="text-[var(--color-link)] underline break-all">${escapedUrl}</a>`;
    result = result.replace(escapedUrl, linkHtml);
  }
  return result;
}

export function renderNoteText(text: string, marks: NoteMark[] = []): string {
  const formatted = renderFormattedText(text, marks);
  return injectLinks(formatted, text);
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

// Shared with the WebMCP artifact_copy tool so automation and the Export
// panel's Copy control produce byte-identical output from one code path.
export function buildSessionJson(state: AppState): string {
  const exportObj = {
    schemaVersion: 'tagnote-session/v1',
    exportedAt: new Date().toISOString(),
    todoTags: state.todoTags,
    notes: state.notes.map((n) => ({
      id: n.id,
      text: n.text,
      tags: n.tags,
      marks: n.marks ?? [],
      pinned: n.pinned,
      archived: n.archived,
      done: n.done,
      createdAt: new Date(n.createdAt).toISOString(),
      attachment: n.file ? { name: n.file.name, sizeBytes: n.file.size } : null,
    })),
  };
  return JSON.stringify(exportObj, null, 2);
}

export function buildTimelineMarkdown(state: AppState): string {
  let md = '';
  const groups = new Map<string, Note[]>();
  const sortedNotes = [...state.notes].sort((a, b) => a.createdAt - b.createdAt);
  for (const note of sortedNotes) {
    if (note.archived) continue;
    const label = formatDate(note.createdAt);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(note);
  }

  for (const [label, notes] of groups) {
    md += `## ${label}\n\n`;
    for (const note of notes) {
      let prefix = '';
      if (note.pinned) prefix += '📌 ';
      if (note.tags.some((t) => state.todoTags.includes(t))) {
        prefix += note.done ? '[x] ' : '[ ] ';
      }
      md += `- ${prefix}${note.text}\n`;
      const visibleTags = note.tags.filter((t) => t !== 'file' && t !== 'link');
      if (visibleTags.length > 0) {
        md += `  ${visibleTags.map((t) => `#${t}`).join(' ')}\n`;
      }
    }
    md += '\n';
  }
  return md.trim();
}
