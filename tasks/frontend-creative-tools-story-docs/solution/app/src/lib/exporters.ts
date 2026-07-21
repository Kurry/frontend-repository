import type { Scene } from '@/store';
import type { Status, StoryboardPackage } from './schema';

export type ExportFormat = 'markdown' | 'json' | 'outline';
export const EXPORT_FORMATS: ExportFormat[] = ['markdown', 'json', 'outline'];

export function isExportFormat(v: unknown): v is ExportFormat {
  return v === 'markdown' || v === 'json' || v === 'outline';
}

function ordered(scenes: Scene[]): Scene[] {
  return [...scenes].sort((a, b) => a.order - b.order);
}

/** Compiled Markdown document: order-numbered headings, body verbatim, status, camera note. */
export function compileMarkdown(scenes: Scene[]): string {
  const parts: string[] = ['# 1. Getting Started', '', 'Project: Demo Projects', ''];
  for (const s of ordered(scenes)) {
    const lines: string[] = [`## ${s.order}. ${s.title}`, '', `Status: ${s.status}`, ''];
    if (s.cameraNote) lines.push(`Camera note: ${s.cameraNote}`, '');
    lines.push(s.body, '', '---', '');
    parts.push(lines.join('\n'));
  }
  return parts.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

/** StoryboardPackage JSON — the re-importable end state. */
export function buildStoryboardPackage(scenes: Scene[], now: Date = new Date()): StoryboardPackage {
  return {
    schemaVersion: 1,
    project: 'Demo Projects',
    storyboard: '1. Getting Started',
    scenes: ordered(scenes).map((s) => {
      const scene: StoryboardPackage['scenes'][number] = {
        title: s.title,
        body: s.body,
        status: s.status as Status,
        order: s.order,
      };
      if (s.cameraNote) scene.cameraNote = s.cameraNote;
      return scene;
    }),
    generatedAt: now.toISOString(),
  };
}

export function compileJson(scenes: Scene[]): string {
  return JSON.stringify(buildStoryboardPackage(scenes), null, 2) + '\n';
}

/** Plain indented outline: `order. title — status` per line, board order. */
export function compileOutline(scenes: Scene[]): string {
  return ordered(scenes).map((s) => `${s.order}. ${s.title} — ${s.status}`).join('\n') + '\n';
}

export function compileArtifact(scenes: Scene[], format: ExportFormat): string {
  if (format === 'markdown') return compileMarkdown(scenes);
  if (format === 'json') return compileJson(scenes);
  return compileOutline(scenes);
}

export function artifactFilename(format: ExportFormat): string {
  if (format === 'markdown') return 'getting-started-storyboard.md';
  if (format === 'json') return 'storyboard-package.json';
  return 'getting-started-outline.txt';
}
