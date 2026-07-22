import { FillRecord, IntentRecord, LocateInventory, AccountRule } from '../types';

// Deterministic fixture with 12 intended allocations and 18 partial fills
// 5 fictional accounts, 4 symbols.
// Includes 1 alias header (to map), 2 malformed numeric cells, 1 unknown account,
// 1 side mismatch, 1 duplicate fill id, 2 insufficient-locate cases, 1 out-of-order correction.
// Total intended and executed quantity = 8,400.

export const FICT_ACCOUNTS = ['ACCT-101', 'ACCT-102', 'ACCT-201', 'ACCT-202', 'ACCT-301'];
export const SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'TSLA'];

export const INITIAL_LOCATES: LocateInventory[] = [
  { accountId: 'ACCT-101', symbol: 'AAPL', availableQuantity: 1000 },
  { accountId: 'ACCT-102', symbol: 'GOOGL', availableQuantity: 500 },
  // 2 insufficient locate cases will arise when trying to short beyond these.
];

export const ACCOUNT_RULES: AccountRule[] = [
  { accountId: 'ACCT-101', allowedSymbols: ['AAPL', 'GOOGL', 'MSFT', 'TSLA'], allowedSides: ['BUY', 'SELL'], maxQuantity: 10000, brokerExclusions: [] },
  { accountId: 'ACCT-102', allowedSymbols: ['AAPL', 'GOOGL', 'MSFT', 'TSLA'], allowedSides: ['BUY', 'SELL'], maxQuantity: 10000, brokerExclusions: [] },
  { accountId: 'ACCT-201', allowedSymbols: ['AAPL', 'GOOGL', 'MSFT', 'TSLA'], allowedSides: ['BUY', 'SELL'], maxQuantity: 10000, brokerExclusions: [] },
  { accountId: 'ACCT-202', allowedSymbols: ['AAPL', 'GOOGL', 'MSFT', 'TSLA'], allowedSides: ['BUY', 'SELL'], maxQuantity: 10000, brokerExclusions: [] },
  { accountId: 'ACCT-301', allowedSymbols: ['AAPL', 'GOOGL', 'MSFT', 'TSLA'], allowedSides: ['BUY', 'SELL'], maxQuantity: 10000, brokerExclusions: [] },
];

export const RAW_INTENTS = [
  { id: 'I-01', accountId: 'ACCT-101', symbol: 'AAPL', side: 'BUY', quantity: '1000' },
  { id: 'I-02', accountId: 'ACCT-102', symbol: 'AAPL', side: 'BUY', quantity: '500' },
  { id: 'I-03', accountId: 'ACCT-201', symbol: 'GOOGL', side: 'SELL', quantity: '800' },
  { id: 'I-04', accountId: 'ACCT-202', symbol: 'GOOGL', side: 'SELL', quantity: '1200' },
  { id: 'I-05', accountId: 'ACCT-301', symbol: 'MSFT', side: 'BUY', quantity: '400' },
  { id: 'I-06', accountId: 'ACCT-101', symbol: 'MSFT', side: 'BUY', quantity: '600' },
  { id: 'I-07', accountId: 'ACCT-102', symbol: 'TSLA', side: 'SELL', quantity: '1500' }, // intent side mismatch? (will need repair or exception)
  { id: 'I-08', accountId: 'ACCT-201', symbol: 'TSLA', side: 'SELL', quantity: '900' },
  { id: 'I-09', accountId: 'UNKNOWN_ACCT', symbol: 'AAPL', side: 'BUY', quantity: '300' }, // Unknown account
  { id: 'I-10', accountId: 'ACCT-301', symbol: 'AAPL', side: 'BUY', quantity: 'INVALID_NUM' }, // Malformed num
  { id: 'I-11', accountId: 'ACCT-202', symbol: 'MSFT', side: 'BUY', quantity: '1000' },
  { id: 'I-12', accountId: 'ACCT-101', symbol: 'GOOGL', side: 'SELL', quantity: '200' },
];

export const RAW_FILLS = [
  { id: 'F-01', sym_alias: 'AAPL', side: 'BUY', qty: '600', px: '150.00', time: '2023-10-01T10:00:00Z' },
  { id: 'F-02', sym_alias: 'AAPL', side: 'BUY', qty: '400', px: '150.10', time: '2023-10-01T10:01:00Z' },
  { id: 'F-03', sym_alias: 'AAPL', side: 'BUY', qty: '500', px: '150.20', time: '2023-10-01T10:02:00Z' },
  { id: 'F-04', sym_alias: 'GOOGL', side: 'SELL', qty: '800', px: '2800.00', time: '2023-10-01T10:05:00Z' },
  { id: 'F-05', sym_alias: 'GOOGL', side: 'SELL', qty: '1000', px: '2801.00', time: '2023-10-01T10:06:00Z' },
  { id: 'F-06', sym_alias: 'GOOGL', side: 'SELL', qty: '200', px: '2802.00', time: '2023-10-01T10:07:00Z' },
  { id: 'F-07', sym_alias: 'MSFT', side: 'BUY', qty: '500', px: '310.00', time: '2023-10-01T10:10:00Z' },
  { id: 'F-08', sym_alias: 'MSFT', side: 'BUY', qty: '500', px: '310.50', time: '2023-10-01T10:11:00Z' },
  { id: 'F-09', sym_alias: 'MSFT', side: 'BUY', qty: '400', px: '311.00', time: '2023-10-01T10:12:00Z' },
  { id: 'F-10', sym_alias: 'TSLA', side: 'SELL', qty: '1000', px: '250.00', time: '2023-10-01T10:15:00Z' },
  { id: 'F-11', sym_alias: 'TSLA', side: 'SELL', qty: '500', px: '250.50', time: '2023-10-01T10:16:00Z' },
  { id: 'F-12', sym_alias: 'TSLA', side: 'SELL', qty: '900', px: '251.00', time: '2023-10-01T10:17:00Z' },
  { id: 'F-13', sym_alias: 'AAPL', side: 'BUY', qty: 'BAD_QTY', px: '150.30', time: '2023-10-01T10:20:00Z' }, // Malformed num
  { id: 'F-14', sym_alias: 'AAPL', side: 'SELL', qty: '300', px: '150.40', time: '2023-10-01T10:21:00Z' }, // Side mismatch to intent?
  { id: 'F-15', sym_alias: 'GOOGL', side: 'SELL', qty: '200', px: '2803.00', time: '2023-10-01T10:22:00Z' },
  { id: 'F-01', sym_alias: 'AAPL', side: 'BUY', qty: '100', px: '150.00', time: '2023-10-01T10:23:00Z' }, // Duplicate ID!
  { id: 'F-16', sym_alias: 'MSFT', side: 'BUY', qty: '600', px: '312.00', time: '2023-10-01T10:24:00Z' },
  // Out of order correction
  { id: 'F-17-CORR', sym_alias: 'MSFT', side: 'BUY', qty: '600', px: '311.50', time: '2023-10-01T10:09:00Z' },
];
