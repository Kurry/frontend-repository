export const statuses = ['empty', 'draft', 'ready', 'changed', 'archived'];

export const generateMockInvoices = () => {
  const mockInvoices = [];
  const clients = ['Acme Corp', 'Globex', 'Soylent', 'Initech', 'Umbrella Corp'];
  const baseDate = new Date();

  for (let i = 1; i <= 100; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    let sourceEvidence = null;
    let quarantineReason = null;
    let lineage = 'clean';

    if (i % 5 === 0) {
      sourceEvidence = 'Conflict in hours reported';
      lineage = 'conflict';
    } else if (i % 7 === 0) {
      sourceEvidence = 'Missing timesheet';
      lineage = 'incomplete';
    }

    mockInvoices.push({
      id: `INV-${1000 + i}`,
      client: clients[Math.floor(Math.random() * clients.length)],
      amount: Math.floor(Math.random() * 10000) + 100,
      status: status,
      sourceEvidence: sourceEvidence,
      quarantineReason: quarantineReason,
      lineage: lineage, // 'clean', 'conflict', 'incomplete', 'quarantined'
    });
  }
  return mockInvoices;
};

export const initialData = {
  schemaVersion: 'v1',
  exportedAt: null,
  records: generateMockInvoices(),
  derived: {
    totalAmount: 0,
    quarantinedCount: 0
  },
  history: []
};
