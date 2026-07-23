import { TAKE_A_SAMPLES, TAKE_B_SAMPLES } from './fixtures';
import { crossfade } from './audio';

export type Slot = { id: string; start: number; end: number; intendedText: string; };

export const MASTER_SLOTS: Slot[] = [
  { id: 'SLOT-01', start: 0, end: 64000, intendedText: 'hello' },
  { id: 'SLOT-02', start: 64000, end: 128000, intendedText: 'welcome to the' },
  { id: 'SLOT-03', start: 128000, end: 176000, intendedText: 'annual' },
  { id: 'SLOT-04', start: 176000, end: 224000, intendedText: 'we will meet beside the paper lantern table' },
  { id: 'SLOT-05', start: 224000, end: 272000, intendedText: 'before the' },
  { id: 'SLOT-06', start: 272000, end: 320000, intendedText: 'closing ceremony' },
];

export function renderMaster(slot4Source: 'TAKE-A' | 'TAKE-B', repaired: boolean): Int16Array {
  const master = new Int16Array(320000);
  for (let i = 0; i < 320000; i++) master[i] = TAKE_A_SAMPLES[i];
  if (slot4Source === 'TAKE-A') {
    for (let i = 176000; i < 224000; i++) master[i] = TAKE_A_SAMPLES[i];
  } else if (slot4Source === 'TAKE-B' && repaired) {
    for(let i = 0; i < 1280; i++) master[176000 + i] = TAKE_B_SAMPLES[704000 + i];
    for(let i = 0; i < 320; i++) master[177280 + i] = crossfade(TAKE_B_SAMPLES[705280 + i], TAKE_B_SAMPLES[160000 + i], i, 320);
    for(let i = 0; i < 44800; i++) master[177600 + i] = TAKE_B_SAMPLES[160000 + i];
    for(let i = 0; i < 320; i++) master[222400 + i] = crossfade(TAKE_B_SAMPLES[204480 + i], TAKE_B_SAMPLES[705600 + i], i, 320);
    for(let i = 0; i < 1280; i++) master[222720 + i] = TAKE_B_SAMPLES[705920 + i];
  }
  return master;
}
