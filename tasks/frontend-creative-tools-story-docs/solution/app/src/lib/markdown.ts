import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

const CHECKBOX_LINE = /^(\s*[-*]\s*\[)([ xX])(\]\s+.*)$/;

export function isChecklistLine(line: string): boolean {
  return CHECKBOX_LINE.test(line);
}

export function checklistStats(body: string): { total: number; checked: number } {
  let total = 0;
  let checked = 0;
  for (const line of body.split('\n')) {
    const m = line.match(CHECKBOX_LINE);
    if (m) {
      total++;
      if (m[2] !== ' ') checked++;
    }
  }
  return { total, checked };
}

/** Toggle the nth checklist line (0-based) in the raw body source. */
export function toggleChecklistLine(body: string, index: number): string | null {
  let seen = 0;
  const lines = body.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(CHECKBOX_LINE);
    if (m) {
      if (seen === index) {
        lines[i] = `${m[1]}${m[2] === ' ' ? 'x' : ' '}${m[3]}`;
        return lines.join('\n');
      }
      seen++;
    }
  }
  return null;
}

/**
 * Render markdown to HTML. GFM task-list checkboxes are post-processed into
 * live (non-disabled) inputs carrying their checklist line index so toggling
 * a rendered checkbox rewrites exactly that line in the body source.
 */
export function renderMarkdownHtml(body: string): string {
  const raw = marked.parse(body, { async: false }) as string;
  let index = 0;
  return raw.replace(/<input([^>]*?)>/g, (match, attrs: string) => {
    if (!/type=["']checkbox["']/.test(attrs)) return match;
    const checked = /\bchecked\b/.test(attrs);
    const i = index++;
    return `<input type="checkbox" class="scene-checkbox" data-cb-index="${i}" aria-label="Toggle checklist item ${i + 1}"${checked ? ' checked' : ''}>`;
  });
}
