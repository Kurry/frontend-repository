import { marked } from 'marked';

// Configure marked to use standard features
marked.setOptions({
  gfm: true,
  breaks: true
});

export function renderMarkdown(markdown: string): string {
  if (!markdown) return '';
  return marked.parse(markdown) as string;
}

export function parseChecklistCount(markdown: string): { total: number, completed: number } | null {
  if (!markdown) return null;

  // Basic checklist parsing
  const checklistItems = markdown.match(/- \[[ xX]\]/g);
  if (!checklistItems || checklistItems.length === 0) return null;

  const completed = checklistItems.filter(item => /- \[[xX]\]/.test(item)).length;

  return {
    total: checklistItems.length,
    completed
  };
}

export function extractHeadings(markdown: string): string[] {
  if (!markdown) return [];

  const headings: string[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push(match[2].trim());
    }
  }

  return headings;
}
