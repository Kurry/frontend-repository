const matchTemplates = {
  'Emberline Parser': [
    {
      similarity: 0.96,
      submission: [['const cursor = ', false], ['scanUntil(source, boundary)', true], [';\nreturn cursor.trim();', false]],
      reference: [['let segment = ', false], ['scanUntil(source, boundary)', true], [';\nreturn segment.trim();', false]]
    },
    {
      similarity: 0.91,
      submission: [['if (node.kind === ', false], ["'ember-fragment'", true], [') {\n  emit(node.value);\n}', false]],
      reference: [['switch (node.kind) {\ncase ', false], ["'ember-fragment'", true], [':\n  emit(node.value);\n}', false]]
    },
    {
      similarity: 0.88,
      submission: [['const next = tokens.at(index + 1);\n', false], ['if (!next) return endOfStream();', true]],
      reference: [['const lookahead = queue.at(position + 1);\n', false], ['if (!next) return endOfStream();', true]]
    }
  ],
  'Tidal Cache': [
    {
      similarity: 0.94,
      submission: [['const key = ', false], ['`${scope}:${wave.id}`', true], [';\ncache.set(key, value);', false]],
      reference: [['const cacheKey = ', false], ['`${scope}:${wave.id}`', true], [';\nstore.write(cacheKey, value);', false]]
    },
    {
      similarity: 0.9,
      submission: [['if (entry.age > ', false], ['maxTideAge', true], [') {\n  cache.delete(entry.key);\n}', false]],
      reference: [['const stale = item.age > ', false], ['maxTideAge', true], [';\nif (stale) store.remove(item.key);', false]]
    },
    {
      similarity: 0.86,
      submission: [['return buckets\n  .filter(', false], ['bucket => bucket.ready', true], [')\n  .map(readBucket);', false]],
      reference: [['return shelves\n  .filter(', false], ['bucket => bucket.ready', true], [')\n  .map(loadShelf);', false]]
    }
  ],
  'Mosslight Scheduler': [
    {
      similarity: 0.93,
      submission: [['const ordered = jobs.sort(', false], ['(a, b) => a.due - b.due', true], [');', false]],
      reference: [['const timeline = tasks.sort(', false], ['(a, b) => a.due - b.due', true], [');', false]]
    },
    {
      similarity: 0.89,
      submission: [['while (queue.length) {\n  const job = queue.shift();\n  ', false], ['await run(job);', true], ['\n}', false]],
      reference: [['for (const task of plan) {\n  ', false], ['await run(job);', true], ['\n}', false]]
    },
    {
      similarity: 0.84,
      submission: [['const window = ', false], ['Math.max(0, deadline - clock.now())', true], [';', false]],
      reference: [['const remaining = ', false], ['Math.max(0, deadline - clock.now())', true], [';', false]]
    }
  ],
  'Quartz Relay': [
    {
      similarity: 0.95,
      submission: [['const packet = ', false], ['encodeFrame(channel, payload)', true], [';\nrelay.send(packet);', false]],
      reference: [['const frame = ', false], ['encodeFrame(channel, payload)', true], [';\ntransport.push(frame);', false]]
    },
    {
      similarity: 0.9,
      submission: [['if (attempts >= ', false], ['relayPolicy.maxRetries', true], [') throw new RelayError();', false]],
      reference: [['const exhausted = tries >= ', false], ['relayPolicy.maxRetries', true], [';\nif (exhausted) abort();', false]]
    },
    {
      similarity: 0.87,
      submission: [['return checksum === ', false], ['expectedChecksum', true], [' && packet.valid;', false]],
      reference: [['const intact = digest === ', false], ['expectedChecksum', true], [';\nreturn intact;', false]]
    }
  ]
};

const submissionSeeds = [
  ['sub-ember-01', 'Emberline Parser', 'Orchid Finch', 0.94],
  ['sub-tidal-01', 'Tidal Cache', 'Copper Vale', 0.89],
  ['sub-moss-01', 'Mosslight Scheduler', 'Juniper Kite', 0.82],
  ['sub-quartz-01', 'Quartz Relay', 'Indigo Wren', 0.78],
  ['sub-ember-02', 'Emberline Parser', 'Saffron Loop', 0.72],
  ['sub-tidal-02', 'Tidal Cache', 'Cinder Grove', 0.67],
  ['sub-moss-02', 'Mosslight Scheduler', 'Velvet Comet', 0.61],
  ['sub-quartz-02', 'Quartz Relay', 'Marble Echo', 0.58],
  ['sub-ember-03', 'Emberline Parser', 'Thistle Arc', 0.47],
  ['sub-tidal-03', 'Tidal Cache', 'Silver Nook', 0.39],
  ['sub-moss-03', 'Mosslight Scheduler', 'Pollen Drift', 0.28],
  ['sub-quartz-03', 'Quartz Relay', 'Amber Rill', 0.16]
];

export const seedSubmissions = () => submissionSeeds.map(([id, task, submitter, similarity]) => ({
  id,
  task,
  submitter,
  similarity,
  reviewState: similarity >= 0.75 ? 'review-triggered' : 'unreviewed',
  matches: structuredClone(matchTemplates[task])
}));

export const seedCanaryTasks = () => [
  {
    task: 'Emberline Parser',
    generatedFiles: 4,
    expanded: false,
    tokens: [
      { token: 'CNY-EMBER-7Q', present: 4, total: 4, placementPass: true, stripped: true, survivorFile: null },
      { token: 'CNY-CINDER-2M', present: 3, total: 4, placementPass: true, stripped: true, survivorFile: null }
    ]
  },
  {
    task: 'Tidal Cache',
    generatedFiles: 5,
    expanded: false,
    tokens: [
      { token: 'CNY-TIDE-4N', present: 5, total: 5, placementPass: true, stripped: true, survivorFile: null },
      { token: 'CNY-SHOAL-8V', present: 4, total: 5, placementPass: true, stripped: false, survivorFile: 'generated/diagnostics/tide-map.txt' }
    ]
  },
  {
    task: 'Mosslight Scheduler',
    generatedFiles: 4,
    expanded: false,
    tokens: [
      { token: 'CNY-MOSS-3P', present: 4, total: 4, placementPass: true, stripped: true, survivorFile: null },
      { token: 'CNY-FERN-6K', present: 2, total: 4, placementPass: false, stripped: true, survivorFile: null }
    ]
  },
  {
    task: 'Quartz Relay',
    generatedFiles: 6,
    expanded: false,
    tokens: [
      { token: 'CNY-QUARTZ-5R', present: 6, total: 6, placementPass: true, stripped: true, survivorFile: null },
      { token: 'CNY-PRISM-1X', present: 5, total: 6, placementPass: true, stripped: true, survivorFile: null }
    ]
  }
];

export const seedMutationSuites = () => [
  {
    task: 'Emberline Parser',
    mutant: 'Boundary inversion twin',
    tests: [
      ['ember-01', 'accepts a complete fragment', 'pass', 'pass'],
      ['ember-02', 'stops at a nested boundary', 'pass', 'fail'],
      ['ember-03', 'preserves escaped separators', 'pass', 'fail'],
      ['ember-04', 'rejects an empty source', 'pass', 'pass'],
      ['ember-05', 'handles a final line without newline', 'pass', 'fail'],
      ['ember-06', 'emits adjacent fragments in order', 'pass', 'pass'],
      ['ember-07', 'recovers after an invalid token', 'pass', 'fail'],
      ['ember-08', 'tracks source offsets', 'pass', 'pass']
    ].map(([id, name, original, mutant]) => ({ id, name, original, mutant, included: true }))
  },
  {
    task: 'Quartz Relay',
    mutant: 'Retry elision twin',
    tests: [
      ['quartz-01', 'sends a valid encoded frame', 'pass', 'pass'],
      ['quartz-02', 'retries after a dropped packet', 'pass', 'fail'],
      ['quartz-03', 'halts at the retry ceiling', 'pass', 'fail'],
      ['quartz-04', 'rejects a mismatched checksum', 'pass', 'pass'],
      ['quartz-05', 'keeps channel order stable', 'pass', 'pass'],
      ['quartz-06', 'replays the pending frame once', 'pass', 'fail'],
      ['quartz-07', 'clears state after acknowledgement', 'pass', 'fail'],
      ['quartz-08', 'reports an unreachable relay', 'pass', 'pass']
    ].map(([id, name, original, mutant]) => ({ id, name, original, mutant, included: true }))
  }
];

export const reviewStateLabels = {
  unreviewed: 'Unreviewed',
  'review-triggered': 'Review triggered',
  'confirmed-clean': 'Confirmed clean',
  'confirmed-leak': 'Confirmed leak'
};

export const verdictLabels = {
  'confirm-clean': 'Confirm clean',
  'confirm-leak': 'Confirm leak'
};
