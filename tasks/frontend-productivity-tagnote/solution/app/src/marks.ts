import type { NoteMark } from './types';

export function normalizeMarks(marks: NoteMark[], textLength: number): NoteMark[] {
  return marks
    .filter((m) => m.start >= 0 && m.end > m.start && m.end <= textLength)
    .sort((a, b) => a.start - b.start || a.end - b.end);
}

export function toggleMarkRange(
  marks: NoteMark[],
  start: number,
  end: number,
  style: 'bold' | 'italic',
  textLength: number
): NoteMark[] {
  if (start >= end) return normalizeMarks(marks, textLength);
  const overlapping = marks.some(
    (m) => m.style === style && m.start <= start && m.end >= end
  );
  let next = marks.filter((m) => !(m.style === style && m.start <= start && m.end >= end));
  if (!overlapping) {
    next = [...next, { start, end, style }];
  }
  return normalizeMarks(next, textLength);
}

export function renderFormattedText(text: string, marks: NoteMark[] = []): string {
  if (!text) return '';
  const normalized = normalizeMarks(marks, text.length);
  if (normalized.length === 0) {
    return escapeHtml(text);
  }

  const points = new Set<number>([0, text.length]);
  for (const mark of normalized) {
    points.add(mark.start);
    points.add(mark.end);
  }
  const sorted = Array.from(points).sort((a, b) => a - b);
  let html = '';

  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i];
    const end = sorted[i + 1];
    if (start >= end) continue;
    const chunk = escapeHtml(text.slice(start, end));
    const active = normalized.filter((m) => m.start <= start && m.end >= end);
    const bold = active.some((m) => m.style === 'bold');
    const italic = active.some((m) => m.style === 'italic');
    let wrapped = chunk;
    if (bold) wrapped = `<strong class="font-semibold">${wrapped}</strong>`;
    if (italic) wrapped = `<em class="italic">${wrapped}</em>`;
    html += wrapped;
  }

  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function extractMarksFromHtml(root: HTMLElement, plainText: string): NoteMark[] {
  const marks: NoteMark[] = [];
  let offset = 0;

  const walk = (node: Node, active: { bold: boolean; italic: boolean }) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = node.textContent?.length ?? 0;
      if (active.bold) marks.push({ start: offset, end: offset + len, style: 'bold' });
      if (active.italic) marks.push({ start: offset, end: offset + len, style: 'italic' });
      offset += len;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const next = {
      bold: active.bold || tag === 'b' || tag === 'strong',
      italic: active.italic || tag === 'i' || tag === 'em',
    };
    for (const child of Array.from(el.childNodes)) {
      walk(child, next);
    }
  };

  walk(root, { bold: false, italic: false });
  if (offset !== plainText.length) {
    return normalizeMarks(marks, plainText.length);
  }
  return mergeAdjacentMarks(normalizeMarks(marks, plainText.length));
}

function mergeAdjacentMarks(marks: NoteMark[]): NoteMark[] {
  const merged: NoteMark[] = [];
  for (const mark of marks) {
    const last = merged[merged.length - 1];
    if (last && last.style === mark.style && last.end === mark.start) {
      last.end = mark.end;
    } else {
      merged.push({ ...mark });
    }
  }
  return merged;
}
