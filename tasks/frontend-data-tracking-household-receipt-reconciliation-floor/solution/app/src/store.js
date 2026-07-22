import { create } from 'zustand';

const members = [
  { id: 'm1', name: 'Alice' },
  { id: 'm2', name: 'Bob' },
  { id: 'm3', name: 'Charlie' },
  { id: 'm4', name: 'Diana' },
];

const categories = [
  { id: 'c1', name: 'Groceries', budget: 80000 },
  { id: 'c2', name: 'Utilities', budget: 30000 },
  { id: 'c3', name: 'Rent', budget: 200000 },
  { id: 'c4', name: 'Household Supplies', budget: 20000 },
  { id: 'c5', name: 'Dining Out', budget: 40000 },
];

const initialReceipts = [
  {
    id: 'r1',
    merchant: 'MegaMart',
    date: '2027-04-02',
    purchaserId: 'm1',
    lines: [
      { id: 'l1', description: 'Apples', quantity: 1, subtotal: 500, taxEligible: false },
      { id: 'l2', description: 'Paper Towels', quantity: 2, subtotal: 1200, taxEligible: true },
      { id: 'l3', description: 'Milk', quantity: 1, subtotal: 350, taxEligible: false },
    ],
    tax: 100, // proportional to taxEligible
    tip: 0,
    allocations: [] // e.g. { id: 'a1', lineId: 'l1', type: 'equal', targets: ['m1', 'm2'], categoryId: 'c1', ruleVersionId: null }
  },
  {
    id: 'r2',
    merchant: 'Dinner Place',
    date: '2027-04-05',
    purchaserId: 'm2',
    lines: [
      { id: 'l4', description: 'Pizza', quantity: 1, subtotal: 2000, taxEligible: true },
      { id: 'l5', description: 'Drinks', quantity: 4, subtotal: 1600, taxEligible: true },
    ],
    tax: 300,
    tip: 500,
    allocations: []
  },
  {
    id: 'r3',
    merchant: 'Hardware Store',
    date: '2027-04-06',
    purchaserId: 'm3',
    lines: [
      { id: 'l6', description: 'Light bulbs', quantity: 1, subtotal: 800, taxEligible: true },
      { id: 'l7', description: 'Nails', quantity: 1, subtotal: 200, taxEligible: true }
    ],
    tax: 80,
    tip: 0,
    allocations: []
  },
  {
    id: 'r4',
    merchant: 'Coffee Shop',
    date: '2027-04-07',
    purchaserId: 'm4',
    lines: [
      { id: 'l8', description: 'Lattes', quantity: 2, subtotal: 1100, taxEligible: true }
    ],
    tax: 90,
    tip: 200,
    allocations: []
  },
  {
    id: 'r5',
    merchant: 'Internet Provider',
    date: '2027-04-08',
    purchaserId: 'm1',
    lines: [
      { id: 'l9', description: 'Monthly Bill', quantity: 1, subtotal: 6000, taxEligible: false }
    ],
    tax: 0,
    tip: 0,
    allocations: []
  },
  {
    id: 'r6',
    merchant: 'Farmers Market',
    date: '2027-04-10',
    purchaserId: 'm2',
    lines: [
      { id: 'l10', description: 'Veggies', quantity: 1, subtotal: 1800, taxEligible: false }
    ],
    tax: 0,
    tip: 0,
    allocations: []
  },
  {
    id: 'r7',
    merchant: 'Electric Co',
    date: '2027-04-12',
    purchaserId: 'm3',
    lines: [
      { id: 'l11', description: 'Power', quantity: 1, subtotal: 4500, taxEligible: false }
    ],
    tax: 0,
    tip: 0,
    allocations: []
  },
  {
    id: 'r8',
    merchant: 'Delivery',
    date: '2027-04-15',
    purchaserId: 'm4',
    lines: [
      { id: 'l12', description: 'Sushi', quantity: 1, subtotal: 3500, taxEligible: true }
    ],
    tax: 250,
    tip: 600,
    allocations: []
  },
  {
    id: 'r9',
    merchant: 'MegaMart',
    date: '2027-04-18',
    purchaserId: 'm1',
    lines: [
      { id: 'l13', description: 'Cleaning', quantity: 1, subtotal: 1400, taxEligible: true },
      { id: 'l14', description: 'Snacks', quantity: 1, subtotal: 900, taxEligible: false }
    ],
    tax: 112,
    tip: 0,
    allocations: []
  }
];

const initialBankRecords = [
  { id: 'b1', date: '2027-04-03', description: 'MegaMart', amount: -2150, type: 'charge', resolved: false, matched: false },
  { id: 'b2', date: '2027-04-06', description: 'Dinner Place', amount: -4400, type: 'charge', resolved: false, matched: false },
  { id: 'b3', date: '2027-04-06', description: 'Dinner Place', amount: -4400, type: 'charge', duplicateOf: 'b2', resolved: false, matched: false }, // Duplicate to resolve
  { id: 'b4', date: '2027-04-07', description: 'Hardware Store', amount: -1080, type: 'charge', resolved: false, matched: false },
  { id: 'b5', date: '2027-04-07', description: 'Coffee Shop', amount: -1390, type: 'charge', resolved: false, matched: false },
  { id: 'b6', date: '2027-04-09', description: 'Internet Provider', amount: -6000, type: 'charge', resolved: false, matched: false },
  { id: 'b7', date: '2027-04-11', description: 'Farmers Market', amount: -1800, type: 'charge', resolved: false, matched: false },
  { id: 'b8', date: '2027-04-13', description: 'Electric Co', amount: -4500, type: 'charge', resolved: false, matched: false },
  { id: 'b9', date: '2027-04-16', description: 'Delivery', amount: -4350, type: 'charge', resolved: false, matched: false },
  { id: 'b10', date: '2027-04-19', description: 'MegaMart', amount: -2412, type: 'charge', resolved: false, matched: false },
  // Reimbursements and transfers
  { id: 'b11', date: '2027-04-20', description: 'Venmo from Alice', amount: 1500, type: 'reimbursement', resolved: false, matched: false },
  { id: 'b12', date: '2027-04-20', description: 'Venmo to Bob', amount: -1500, type: 'transfer', resolved: false, matched: false },
  { id: 'b13', date: '2027-04-22', description: 'Reversed Fee', amount: 300, type: 'reversal', resolved: false, matched: false },
  { id: 'b14', date: '2027-04-25', description: 'Partial Payment', amount: 2000, type: 'reimbursement', resolved: false, matched: false }
];

export const useStore = create((set, get) => ({
  members,
  categories,
  receipts: initialReceipts,
  rules: [], // array of rule DAG objects
  bankRecords: initialBankRecords,
  matches: [],
  attempts: [],
  approval: null,
  pinnedEdges: [],
  excludedMethods: [],

  // Actions
  allocateLine: (receiptId, lineId, allocationType, targets, categoryId) => set(state => {
    const receipts = state.receipts.map(r => {
      if (r.id === receiptId) {
        const existing = r.allocations.filter(a => a.lineId !== lineId);
        // compute proportional tax and tip based on exact cent remainder distribution
        return {
          ...r,
          allocations: [...existing, {
            id: `a_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            lineId,
            type: allocationType,
            targets,
            categoryId,
            ruleVersionId: null
          }]
        };
      }
      return r;
    });
    return { receipts, approval: null }; // approval becomes stale on change
  }),

  // Add rule with versioning
  addRule: (rule) => set(state => ({
    rules: [...state.rules, { ...rule, id: `rule_${Date.now()}`, version: 1, lineage: null }]
  })),

  // Matches receipts to bank records
  matchRecord: (receiptIds, recordIds, relationshipType) => set(state => {
    const newMatch = { id: `m_${Date.now()}`, receiptIds, recordIds, type: relationshipType };

    // mark records as matched
    const bankRecords = state.bankRecords.map(br => {
      if (recordIds.includes(br.id)) {
        return { ...br, matched: true, resolved: true };
      }
      return br;
    });

    return {
      matches: [...state.matches, newMatch],
      bankRecords,
      approval: null
    };
  }),

  resolveRecord: (recordId, note) => set(state => ({
    bankRecords: state.bankRecords.map(br => br.id === recordId ? { ...br, resolved: true, note } : br)
  })),

  recordAttempt: (attempt) => set(state => ({ attempts: [...state.attempts, attempt] })),

  pinEdge: (from, to, amount) => set(state => ({
    pinnedEdges: [...state.pinnedEdges, { from, to, amount }]
  })),

  setApproval: (approval) => set({ approval }),

  importState: (data) => set(() => data),

  reset: () => set({
    receipts: initialReceipts,
    rules: [],
    bankRecords: initialBankRecords,
    matches: [],
    attempts: [],
    approval: null,
    pinnedEdges: [],
    excludedMethods: []
  })
}));
