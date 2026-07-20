const taskNames = [
  ['ledger-reconcile', 'Reconcile municipal ledger anomalies'],
  ['alpine-routing', 'Route supply caravans through alpine passes'],
  ['archive-citations', 'Resolve conflicting archive citations'],
  ['battery-yield', 'Estimate battery cell yield variance'],
  ['canopy-count', 'Count canopy gaps from survey notes'],
  ['civic-brief', 'Summarize a fictional civic proposal'],
  ['climate-ledger', 'Audit a synthetic climate ledger'],
  ['coral-index', 'Index coral nursery observations'],
  ['court-docket', 'Normalize an invented court docket'],
  ['delta-mapping', 'Map river delta sampling zones'],
  ['drift-detection', 'Detect semantic drift in labels'],
  ['energy-auction', 'Compare simulated energy bids'],
  ['field-inventory', 'Reconcile field station inventory'],
  ['forest-acoustics', 'Classify forest acoustic events'],
  ['freight-window', 'Choose a freight delivery window'],
  ['glacier-notes', 'Structure fictional glacier field notes'],
  ['habitat-score', 'Score habitat restoration evidence'],
  ['harbor-schedule', 'Resolve a synthetic harbor schedule'],
  ['heritage-index', 'Catalog invented heritage records'],
  ['hydrology-table', 'Repair a hydrology data table'],
  ['lab-protocol', 'Compare laboratory protocol revisions'],
  ['lattice-proof', 'Check a compact lattice argument'],
  ['marine-log', 'Extract events from a marine log'],
  ['orchard-forecast', 'Forecast fictional orchard yield'],
  ['policy-contrast', 'Contrast two policy abstracts'],
  ['prairie-survey', 'Summarize a prairie restoration survey'],
  ['rail-capacity', 'Calculate regional rail capacity'],
  ['reef-transect', 'Validate a reef transect record'],
  ['signal-triage', 'Triage synthetic telemetry signals'],
  ['watershed-plan', 'Evaluate a watershed action plan'],
]

export function digestText(input) {
  let state = 2166136261
  const text = String(input)
  for (let i = 0; i < text.length; i += 1) {
    state ^= text.charCodeAt(i)
    state = Math.imul(state, 16777619)
  }
  let output = ''
  for (let block = 0; block < 8; block += 1) {
    state ^= block * 2654435761
    state = Math.imul(state ^ (state >>> 16), 2246822507)
    output += (state >>> 0).toString(16).padStart(8, '0')
  }
  return output.slice(0, 64)
}

function taskFor(index, changedFor = '') {
  const [slug, title] = taskNames[index]
  const primary = ['basalt-train', 'auric-holdout', 'cinder-public'][index % 3]
  const splitTags = index % 10 === 0 ? [primary, ['cinder-public', 'basalt-train', 'auric-holdout'][index % 3]] : [primary]
  return {
    slug,
    contentDigest: digestText(`${slug}:canonical:${changedFor}`),
    title,
    splitTags: [...new Set(splitTags)],
  }
}

function makeVersion(name, cutDate, notes, indices, changed = []) {
  const changedSet = new Set(changed)
  const tasks = indices.map((index) => taskFor(index, changedSet.has(index) ? name : ''))
  return { name, cutDate, sealed: true, notes, taskCount: tasks.length, tasks }
}

export function createSeedVersions() {
  return [
    makeVersion('2.0.0', '2026-06-18', 'Second-generation reasoning and evidence suite.', Array.from({ length: 27 }, (_, i) => i + 3), [4, 8, 12, 15, 20, 24]),
    makeVersion('1.2.0', '2026-04-02', 'Expanded field-science and logistics coverage.', Array.from({ length: 25 }, (_, i) => i + 2), [4, 8, 12, 15, 20]),
    makeVersion('1.1.0', '2026-01-23', 'First stability refresh.', Array.from({ length: 24 }, (_, i) => i + 1), [4, 8, 15]),
    makeVersion('1.0.0', '2025-10-09', 'Initial sealed benchmark corpus.', Array.from({ length: 24 }, (_, i) => i), []),
  ]
}

export const seedSplitComposition = [
  { name: 'auric-holdout', description: 'Sequestered evaluation slice', categories: [
    { name: 'Reasoning', current: 18, target: 18 }, { name: 'Extraction', current: 12, target: 16 }, { name: 'Planning', current: 14, target: 14 }, { name: 'Classification', current: 9, target: 12 },
  ] },
  { name: 'basalt-train', description: 'Primary training register', categories: [
    { name: 'Reasoning', current: 44, target: 40 }, { name: 'Extraction', current: 38, target: 38 }, { name: 'Planning', current: 29, target: 34 }, { name: 'Classification', current: 31, target: 30 },
  ] },
  { name: 'cinder-public', description: 'Open inspection sample', categories: [
    { name: 'Reasoning', current: 10, target: 10 }, { name: 'Extraction', current: 8, target: 10 }, { name: 'Planning', current: 12, target: 12 }, { name: 'Classification', current: 7, target: 8 },
  ] },
]

export function createSeedRotation() {
  return {
    cycle: 8,
    activeSubsets: ['lilac-wren', 'granite-moth'],
    history: [
      { cycle: 8, subsets: ['lilac-wren', 'granite-moth'] },
      { cycle: 7, subsets: ['silver-ibis', 'topaz-vole'] },
      { cycle: 6, subsets: ['quartz-tern', 'umber-lynx'] },
      { cycle: 5, subsets: ['lilac-wren', 'saffron-eel'] },
    ],
  }
}

export function createSeedTimeline() {
  return [
    { at: '2026-06-18T16:42:00.000Z', kind: 'release-cut', description: 'Sealed release 2.0.0 with 27 tasks.' },
    { at: '2026-06-14T11:07:00.000Z', kind: 'rank-stability-failed', description: 'Rank-stability check for 2.0.0-rc1 failed at 0.941 against threshold 0.95.' },
    { at: '2026-06-10T10:18:00.000Z', kind: 'rotation-advance', description: 'Advanced held-out rotation to cycle 8.' },
    { at: '2026-04-02T14:05:00.000Z', kind: 'release-cut', description: 'Sealed release 1.2.0 with 25 tasks.' },
    { at: '2026-01-23T09:30:00.000Z', kind: 'release-cut', description: 'Sealed release 1.1.0 with 24 tasks.' },
  ]
}

export function createSamplePack() {
  const versions = createSeedVersions().slice(1)
  const rotation = {
    cycle: 7,
    activeSubsets: ['silver-ibis', 'topaz-vole'],
    history: [
      { cycle: 7, subsets: ['silver-ibis', 'topaz-vole'] },
      { cycle: 6, subsets: ['quartz-tern', 'umber-lynx'] },
      { cycle: 5, subsets: ['lilac-wren', 'saffron-eel'] },
    ],
  }
  return {
    schemaVersion: 'larkspur-release-pack/v1',
    generatedAt: '2026-06-01T12:00:00.000Z',
    versions,
    rotation,
    timeline: createSeedTimeline().slice(2),
  }
}
