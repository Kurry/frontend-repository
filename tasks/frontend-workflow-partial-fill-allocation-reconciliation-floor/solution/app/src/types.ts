export type Side = 'BUY' | 'SELL';

export interface FillRecord {
  id: string;
  symbol: string;
  side: Side;
  quantity: number;
  price: number;
  occurredAt: string; // ISO 8601
}

export interface IntentRecord {
  id: string;
  accountId: string;
  symbol: string;
  side: Side;
  quantity: number;
}

export interface AllocationRecord {
  id: string;
  fillId: string;
  intentId: string;
  accountId: string;
  symbol: string;
  side: Side;
  quantity: number;
  price: number;
  occurredAt: string;
}

export interface ExceptionRecord {
  id: string;
  rowId: string; // references intentId or fillId
  rowType: 'fill' | 'intent';
  reason: string;
}

export interface RuleOverride {
  id: string;
  allocationId: string;
  ruleCode: string;
  reasonCode: string;
  approverNote: string;
}

export interface LocateInventory {
  accountId: string;
  symbol: string;
  availableQuantity: number;
}

export interface AccountRule {
  accountId: string;
  allowedSymbols: string[];
  allowedSides: Side[];
  maxQuantity: number;
  brokerExclusions: string[]; // Mock broker concepts based on fill
}
