import { Message, Report, DuplicateCandidate, Note, QueuePacket, TokenBucket } from './types';

// Deterministic seed for Case CB-01
// CS-04 / Lantern Regatta Thread
// MSG-01 to MSG-24

export const generateSeedMessages = (): Message[] => {
  const messages: Message[] = [];
  for (let i = 1; i <= 24; i++) {
    const idStr = String(i).padStart(2, '0');
    messages.push({
      id: `MSG-${idStr}`,
      threadId: 'TH-04',
      sequence: i,
      parentId: i > 1 ? `MSG-${String(i - 1 > 0 ? i - 1 : 1).padStart(2, '0')}` : null,
      authorId: `author-${(i % 5) + 1}`,
      createdAt: `2024-01-01T12:00:${String(i).padStart(2, '0')}Z`,
      status: 'visible',
      text: `Original benign text ${i} for model boat club discussion`,
      textHash: `hash-${i}`,
      referenceIds: i === 10 ? [] : i === 17 ? ['MSG-10'] : [],
      deletion: null
    });
  }
  // Ensure specific relationships for the scenario
  const m17 = messages.find(m => m.id === 'MSG-17');
  if (m17) {
    m17.parentId = 'MSG-13'; // Parent is MSG-13
    m17.referenceIds = ['MSG-10']; // Referenced MSG-10
  }
  return messages;
};

export const initialTokenBucket: TokenBucket = {
  capacity: 2,
  tokens: 2,
  lastRefillLogicalTime: 0,
  refillEverySeconds: 60
};

export const seedReports: Report[] = [
  {
    id: 'RP-07',
    threadId: 'TH-04',
    targetMessageIds: ['MSG-17'],
    sourceReportIds: ['RP-07'],
    contextWindow: {
      reportId: 'RP-07',
      startSequence: 17,
      endSequence: 17,
      includedMessageIds: ['MSG-17', 'MSG-13'],
      pinnedMessageIds: ['MSG-13'],
      promotedRequiredIds: [],
      requiredRoles: [
        { role: 'target', messageId: 'MSG-17', satisfied: true, source: 'interval' },
        { role: 'parent', messageId: 'MSG-13', satisfied: true, source: 'pinned' },
        { role: 'root', messageId: 'MSG-01', satisfied: false, source: 'pinned' },
        { role: 'preceding-sibling', messageId: 'MSG-15', satisfied: false, source: 'pinned' },
        { role: 'following-sibling', messageId: 'MSG-18', satisfied: false, source: 'pinned' },
        { role: 'referenced', messageId: 'MSG-10', satisfied: false, source: 'pinned' }
      ],
      completenessNumerator: 2,
      completenessDenominator: 6,
      revision: 1
    },
    ruleIds: ['rule-01'],
    decision: null,
    rationale: null,
    citationMessageIds: [],
    status: 'open',
    mergedIntoId: null,
    revision: 1
  },
  {
    id: 'RP-03',
    threadId: 'TH-04',
    targetMessageIds: ['MSG-17'],
    sourceReportIds: ['RP-03'],
    contextWindow: {
      reportId: 'RP-03',
      startSequence: 10,
      endSequence: 21,
      includedMessageIds: ['MSG-10', 'MSG-11', 'MSG-12', 'MSG-13', 'MSG-14', 'MSG-15', 'MSG-16', 'MSG-17', 'MSG-18', 'MSG-19', 'MSG-20', 'MSG-21'],
      pinnedMessageIds: [],
      promotedRequiredIds: [],
      requiredRoles: [],
      completenessNumerator: 6,
      completenessDenominator: 6,
      revision: 1
    },
    ruleIds: ['rule-01'],
    decision: null,
    rationale: null,
    citationMessageIds: [],
    status: 'open',
    mergedIntoId: null,
    revision: 1
  }
];

export const seedDuplicateCandidates: DuplicateCandidate[] = [
  {
    id: 'DC-01',
    aReportId: 'RP-03',
    bReportId: 'RP-07',
    intersectionIds: ['MSG-13', 'MSG-17'],
    unionIds: ['MSG-10', 'MSG-11', 'MSG-12', 'MSG-13', 'MSG-14', 'MSG-15', 'MSG-16', 'MSG-17', 'MSG-18', 'MSG-19', 'MSG-20', 'MSG-21', 'MSG-something-else-if-needed'],
    jaccardNumerator: 1,
    jaccardDenominator: 13,
    jaccardPercent: 7.69,
    thresholdPercent: 65.00,
    eligibility: 'below',
    revision: 1
  }
];
