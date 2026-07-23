import type { StudyRecord, MotifRecord } from './types';

const study07Rows: string[] = [];
for (let y = 0; y < 64; y++) {
  let row = '';
  for (let x = 0; x < 96; x++) {
    const cx = x % 16;
    const cy = y % 16;
    if ((cx > 4 && cx < 12) && (cy > 4 && cy < 12)) row += '1';
    else if (cx === cy || cx === 15 - cy) row += '1';
    else row += '0';
  }
  study07Rows.push(row);
}

export const studies: StudyRecord[] = [
  {
    id: 'study-07',
    title: 'Indigo Window Fragment',
    logicalWidth: 96,
    logicalHeight: 64,
    binaryRows: study07Rows,
    paletteTokenIds: ['pt-01'],
    sourceRevisionId: 'rev-01',
    rasterHash: 'sh-07-001',
    notes: 'Synthetic fixture study'
  }
];

export const families = ['lantern', 'star', 'path', 'log', 'basket', 'chain'];

export const motifs: MotifRecord[] = [];
for (let i = 1; i <= 96; i++) {
  const idStr = i.toString().padStart(2, '0');
  const family = families[i % families.length];
  const canonicalRows: string[] = [];

  for (let y = 0; y < 8; y++) {
    let row = '';
    for (let x = 0; x < 8; x++) {
      const cx = (x * i + y) % 8;
      row += cx > 3 ? '1' : '0';
    }
    canonicalRows.push(row);
  }

  motifs.push({
    id: `motif-${idStr}`,
    title: i === 23 ? 'Lantern Steps' : i === 41 ? 'Split Window' : i === 12 ? 'Double Wick' : `Motif ${idStr}`,
    family: i === 23 ? 'lantern' : family,
    canonicalRows,
    canonicalOrientation: 'r0',
    paletteTokenIds: ['pt-01'],
    catalogRevisionId: `crev-${idStr}`,
    rasterHash: `mh-${idStr}`,
    sourceIds: [`src-${idStr}`]
  });
}

const motif23 = motifs.find(m => m.id === 'motif-23');
if (motif23) {
  motif23.canonicalOrientation = 'mirror-r90';
}

export function alignMotif23ToQuery(queryRows: string[]) {
  const targetMask = queryRows.map(r => r.split(''));
  const mismatches = [[1,3], [4,6], [6,4]];
  for (const [y, x] of mismatches) {
    targetMask[y][x] = targetMask[y][x] === '1' ? '0' : '1';
  }
  const targetRows = targetMask.map(r => r.join(''));
  if (motif23) {
    motif23.canonicalRows = targetRows;
  }
}
