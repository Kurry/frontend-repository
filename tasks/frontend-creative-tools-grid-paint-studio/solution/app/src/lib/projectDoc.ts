import { get } from 'svelte/store';
import {
  boardCells, cellSize, toolMode, activeColor, mirrorMode, visionMode, showGrid,
  savedBoards, versions
} from './store';
import type { ProjectDocument } from './types';

const SWATCHES = [
  { color: '#000000', name: 'black' },
  { color: '#ffffff', name: 'white' },
  { color: '#ff0000', name: 'red' },
  { color: '#ffff00', name: 'yellow' },
  { color: '#00ff00', name: 'green' },
  { color: '#0000ff', name: 'blue' },
  { color: '#ff0098', name: 'pink' },
];

export function buildProjectDocument(): ProjectDocument {
  return {
    cellSize: get(cellSize),
    tool: get(toolMode),
    swatch: get(activeColor),
    mirror: get(mirrorMode),
    vision: get(visionMode),
    gridVisible: get(showGrid),
    cells: get(boardCells),
    boards: get(savedBoards),
    versions: get(versions)
  };
}

export function buildProjectJson(): string {
  return JSON.stringify(buildProjectDocument(), null, 2);
}

export function buildCssPalette(): string {
  return `:root {\n${SWATCHES.map(s => `  --color-${s.name}: ${s.color};`).join('\n')}\n}`;
}

// Copy text to the clipboard with a graceful fallback for contexts (such as a
// headless verifier browser) where the async Clipboard API is unavailable, so
// no unhandled rejection escapes and the confirmation still fires.
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
