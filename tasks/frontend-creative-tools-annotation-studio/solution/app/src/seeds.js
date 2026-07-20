const SUITES = [
  { id: 'safety', name: 'Safety & Policy', code: 'SAF' },
  { id: 'reasoning', name: 'Reasoning Quality', code: 'RSN' },
  { id: 'vision', name: 'Visual Grounding', code: 'VIS' },
];

const responses = [
  'The response identifies the core constraint and gives a concise recommendation, but it could state its assumptions more explicitly.',
  'I would separate the observation from the conclusion, verify the ambiguous detail, and then provide the result with a confidence note.',
  'The pictured scene contains warehouse shelving, a worker, a blue vehicle, and a wall-mounted instruction board.',
  'A safer answer is to decline the risky portion while offering a benign alternative that preserves the user’s underlying goal.',
  'Working through the quantities step by step gives a result of 42. The final unit should be checked against the prompt.',
];

function annotation(seed) {
  return {
    rating: seed % 3 === 0 ? 'down' : 'up',
    scores: { Accuracy: 3 + (seed % 3), Clarity: 4, Relevance: 3 + ((seed + 1) % 3) },
    comment: seed % 2 ? 'Seeded annotation for calibration.' : 'Clear response with a minor omission.',
    metadata: { 'Domain confidence': ['Low', 'Medium', 'High'][seed % 3], 'Escalation needed': seed % 4 === 0 },
    regions: seed % 4 === 0 ? [{ classId: 'cls-person', x: 245, y: 152, w: 82, h: 184, attributeValues: { Severity: 'Medium' } }] : [],
  };
}

export function createSeedState() {
  const items = {};
  const suites = SUITES.map((suite, suiteIndex) => {
    const itemIds = [];
    for (let index = 1; index <= 12; index += 1) {
      const id = `${suite.id}-${String(index).padStart(2, '0')}`;
      const seeded = index > 10;
      itemIds.push(id);
      items[id] = {
        id,
        suiteId: suite.id,
        title: `${suite.code} evaluation ${String(index).padStart(2, '0')}`,
        prompt: suite.id === 'vision'
          ? `Inspect warehouse scene ${index}. Identify the relevant visual evidence before answering.`
          : `Evaluation prompt ${index}: provide a calibrated answer for the ${suite.name.toLowerCase()} rubric.`,
        response: responses[(index + suiteIndex) % responses.length],
        image: index % 5 === 1 || index % 5 === 2 ? '/eval-scene.svg' : null,
        review_state: seeded ? (index === 12 && suiteIndex === 0 ? 'reviewed' : 'labeled') : 'unlabeled',
        annotation: seeded ? annotation(index + suiteIndex * 3) : null,
        skipped: 0,
        lastDisputedAt: null,
        disputeReason: '',
        submittedAt: seeded ? new Date(Date.UTC(2026, 6, 18 - suiteIndex, 9 + index, 0)).toISOString() : null,
      };
    }
    return { ...suite, itemIds };
  });

  const taxonomy = [
    { id: 'cls-person', name: 'Person', color: '#0F62FE', icon: 'User', shortcut: '1', attributes: [{ name: 'Severity', kind: 'select', options: ['Low', 'Medium', 'High'] }] },
    { id: 'cls-vehicle', name: 'Vehicle', color: '#8A3FFC', icon: 'Car', shortcut: '2', attributes: [{ name: 'Notes', kind: 'text', options: [] }] },
    { id: 'cls-signage', name: 'Signage', color: '#198038', icon: 'Warning', shortcut: '3', attributes: [] },
    { id: 'cls-hazard', name: 'Safety hazard', color: '#DA1E28', icon: 'WarningAlt', shortcut: '4', attributes: [{ name: 'Severity', kind: 'select', options: ['Low', 'Medium', 'High'] }] },
    { id: 'cls-object', name: 'Object', color: '#FF832B', icon: 'Cube', shortcut: '5', attributes: [] },
    { id: 'cls-unclassified', name: 'Unclassified', color: '#6F6F6F', icon: 'Unknown', shortcut: '9', attributes: [] },
  ];

  const metadataFields = [
    { id: 'meta-confidence', name: 'Domain confidence', kind: 'select', options: ['Low', 'Medium', 'High'] },
    { id: 'meta-escalation', name: 'Escalation needed', kind: 'checkbox', options: [] },
  ];

  const agreement = [];
  suites.forEach((suite, suiteIndex) => {
    suite.itemIds.slice(0, 4).forEach((itemId, rowIndex) => {
      const a = annotation(rowIndex + suiteIndex + 2);
      const b = structuredClone(a);
      if (rowIndex === 1 || (suiteIndex === 1 && rowIndex === 3)) {
        b.rating = a.rating === 'up' ? 'down' : 'up';
      } else if (rowIndex === 2) {
        b.scores.Accuracy = Math.max(1, a.scores.Accuracy - 2);
      }
      agreement.push({ itemId, suiteId: suite.id, annotatorA: a, annotatorB: b });
    });
  });

  const drafts = {};
  Object.keys(items).forEach((id) => {
    drafts[id] = {
      rating: null,
      scores: { Accuracy: 3, Clarity: 3, Relevance: 3 },
      touchedScores: { Accuracy: false, Clarity: false, Relevance: false },
      comment: '',
      metadata: { 'Domain confidence': 'Medium', 'Escalation needed': false },
      regions: [],
    };
  });

  return {
    suites,
    items,
    taxonomy,
    metadataFields,
    agreement,
    drafts,
    historyOrder: suites.flatMap((s) => s.itemIds.slice(10)).reverse(),
  };
}
