import type { Transform } from './types';

export const TRANSFORMS: Transform[] = [
  'r0', 'r90', 'r180', 'r270', 'mirror-r0', 'mirror-r90', 'mirror-r180', 'mirror-r270'
];

export function resampleCrop(studyRows: string[], x: number, y: number, width: number, height: number): string[] {
  const queryRows: string[] = [];

  for (let j = 0; j < 8; j++) {
    let rowStr = '';
    for (let i = 0; i < 8; i++) {
      let filledPixels = 0;
      let totalPixels = 0;

      const startX = x + (i * width) / 8;
      const endX = x + ((i + 1) * width) / 8;
      const startY = y + (j * height) / 8;
      const endY = y + ((j + 1) * height) / 8;

      const intStartX = Math.floor(startX);
      const intEndX = Math.ceil(endX);
      const intStartY = Math.floor(startY);
      const intEndY = Math.ceil(endY);

      for (let sy = intStartY; sy < intEndY; sy++) {
        for (let sx = intStartX; sx < intEndX; sx++) {
          const overlapX = Math.max(0, Math.min(sx + 1, endX) - Math.max(sx, startX));
          const overlapY = Math.max(0, Math.min(sy + 1, endY) - Math.max(sy, startY));
          const area = overlapX * overlapY;
          if (area > 0) {
            totalPixels += area;
            if (studyRows[sy] && studyRows[sy][sx] === '1') {
              filledPixels += area;
            }
          }
        }
      }

      rowStr += (filledPixels >= totalPixels / 2 && totalPixels > 0) ? '1' : '0';
    }
    queryRows.push(rowStr);
  }
  return queryRows;
}

export function applyTransform(rows: string[], transform: Transform): string[] {
  let result = [...rows];
  if (transform.startsWith('mirror-')) {
    result = result.map(r => r.split('').reverse().join(''));
  }

  let rots = 0;
  if (transform.endsWith('90')) rots = 1;
  if (transform.endsWith('180')) rots = 2;
  if (transform.endsWith('270')) rots = 3;

  for (let r = 0; r < rots; r++) {
    const nextResult = Array(8).fill('');
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        nextResult[i] += result[7 - j][i];
      }
    }
    result = nextResult;
  }

  return result;
}

export function calculateDistance(query: string[], candidate: string[]): { distance: number; mismatches: string[] } {
  let distance = 0;
  const mismatches: string[] = [];

  for (let j = 0; j < 8; j++) {
    for (let i = 0; i < 8; i++) {
      if (query[j][i] !== candidate[j][i]) {
        distance++;
        mismatches.push(`c-${(j * 8 + i).toString().padStart(2, '0')}`);
      }
    }
  }

  return { distance, mismatches };
}

export async function hashString(str: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 8);
}
