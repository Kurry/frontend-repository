import { FillRecord, IntentRecord, AllocationRecord } from '../types';

export function calculateRemainingFill(
  fill: FillRecord,
  allocations: AllocationRecord[]
): number {
  const allocated = allocations
    .filter(a => a.fillId === fill.id)
    .reduce((sum, a) => sum + a.quantity, 0);
  return fill.quantity - allocated;
}

export function calculateRemainingIntent(
  intent: IntentRecord,
  allocations: AllocationRecord[]
): number {
  const allocated = allocations
    .filter(a => a.intentId === intent.id)
    .reduce((sum, a) => sum + a.quantity, 0);
  return intent.quantity - allocated;
}
