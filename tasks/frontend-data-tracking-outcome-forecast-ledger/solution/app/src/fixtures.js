export const sources = Array.from({ length: 18 }, (_, i) => ({
  id: `source-${i + 1}`,
  text: `This is source excerpt ${i + 1} detailing evidence for outcomes.`
}));

export const historicResolvedForecasts = Array.from({ length: 8 }, (_, i) => ({
  id: `hf-${i + 1}`,
  question: `Will historical event ${i + 1} happen?`,
  type: i % 2 === 0 ? 'binary' : 'categorical',
  outcomes: i % 2 === 0 ? [
    { id: 'yes', label: 'Yes', prob: 6000 },
    { id: 'no', label: 'No', prob: 4000 }
  ] : [
    { id: 'opt1', label: 'Option A', prob: 3000 },
    { id: 'opt2', label: 'Option B', prob: 7000 }
  ],
  probability: i % 2 === 0 ? 6000 : null,
  resolutionDate: '2023-01-01',
  resolver: 'Admin',
  resolutionRule: 'Rule text',
  sourcePacket: `source-${(i % 18) + 1}`,
  invalidationCondition: 'None',
  status: 'resolved',
  resolvedOutcomeId: i % 2 === 0 ? 'yes' : 'opt2',
  version: 1,
  history: [
    { version: 1, probability: 6000, timestamp: '2022-12-01T00:00:00Z', cause: 'initial commit' }
  ],
  score: 0.16
}));

export const openForecasts = Array.from({ length: 3 }, (_, i) => ({
  id: `of-${i + 1}`,
  question: `Will future event ${i + 1} occur?`,
  type: 'binary',
  outcomes: [
    { id: 'yes', label: 'Yes', prob: 5000 },
    { id: 'no', label: 'No', prob: 5000 }
  ],
  probability: 5000,
  resolutionDate: '2025-12-31',
  resolver: 'Admin',
  resolutionRule: 'Rule text',
  sourcePacket: `source-${i + 1}`,
  invalidationCondition: 'None',
  status: 'open',
  version: 1,
  history: [
    { version: 1, probability: 5000, timestamp: '2024-01-01T00:00:00Z', cause: 'initial commit' }
  ]
}));

export const dependencies = [
  { id: 'dep-1', from: 'hf-1', to: 'of-1', type: 'conditional', formula: 'if hf-1=yes then of-1=7000' },
  { id: 'dep-2', from: 'hf-2', to: 'of-2', type: 'logical-group', formula: 'of-2 <= hf-2' }
];

export const ambiguousOutcomePacket = {
  forecastId: 'of-3',
  evidence: ['source-10', 'source-11'],
  disputed: true
};

export const clockEvents = [
  { time: '2022-12-01T00:00:00Z', action: 'commit', forecastId: 'hf-1' },
  { time: '2023-01-01T00:00:00Z', action: 'resolve', forecastId: 'hf-1' }
];

export const loadFixtures = () => {
  return {
    sources,
    forecasts: [...historicResolvedForecasts, ...openForecasts],
    dependencies,
    ambiguousOutcomePacket,
    clockEvents
  };
};
