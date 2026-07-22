import { IntentRecord, FillRecord, AccountRule, LocateInventory } from '../types';
import { ACCOUNT_RULES, INITIAL_LOCATES } from '../fixtures/data';

export function checkAllocationRules(
  intent: IntentRecord,
  fill: FillRecord,
  quantity: number,
  allocatedTotalForAccount: number,
  currentLocates: LocateInventory[]
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  const rule = ACCOUNT_RULES.find(r => r.accountId === intent.accountId);

  if (!rule) {
    violations.push(`Unknown account: ${intent.accountId}`);
    return { valid: false, violations };
  }

  if (!rule.allowedSymbols.includes(fill.symbol)) {
    violations.push(`Symbol ${fill.symbol} not allowed for account ${intent.accountId}`);
  }

  if (intent.side !== fill.side) {
    violations.push(`Side mismatch: intent ${intent.side} vs fill ${fill.side}`);
  }

  if (allocatedTotalForAccount + quantity > rule.maxQuantity) {
    violations.push(`Exceeds max quantity for account ${intent.accountId}`);
  }

  if (fill.side === 'SELL') {
    const locate = currentLocates.find(
      l => l.accountId === intent.accountId && l.symbol === fill.symbol
    );
    if (!locate || locate.availableQuantity < quantity) {
      violations.push(`Insufficient locate inventory for ${fill.symbol} in ${intent.accountId}`);
    }
  }

  return {
    valid: violations.length === 0,
    violations
  };
}
