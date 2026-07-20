import { LETTERS } from './contracts'

export const prompts = [
  { id: 'prompt-concise-v3', name: 'Concise answer', head: 'v3' },
  { id: 'prompt-evidence-v2', name: 'Evidence first', head: 'v2' },
  { id: 'prompt-friendly-v4', name: 'Friendly expert', head: 'v4' },
  { id: 'prompt-structured-v1', name: 'Structured output', head: 'v1' },
  { id: 'prompt-reasoning-v5', name: 'Reasoned response', head: 'v5' },
  { id: 'prompt-guardrail-v2', name: 'Guardrail aware', head: 'v2' }
]

export const criteria = [
  { id: 'factual-accuracy', name: 'factual-accuracy', label: 'Factual accuracy', description: 'Correct and supportable claims', passThreshold: 78 },
  { id: 'tone', name: 'tone', label: 'Tone', description: 'Appropriate, clear, and helpful voice', passThreshold: 75 },
  { id: 'completeness', name: 'completeness', label: 'Completeness', description: 'Covers all material parts of the request', passThreshold: 72 },
  { id: 'formatting', name: 'formatting', label: 'Formatting', description: 'Readable and structurally consistent output', passThreshold: 80 }
]

const inputSet = [
  'Explain why the sky appears blue to a curious teenager.',
  'Summarize the tradeoffs of a four-day work week.',
  'Write a helpful reply to a delayed shipment complaint.',
  'Compare solar and wind energy for a small town.',
  'Turn these meeting notes into three clear next steps.',
  'Explain compound interest without using financial jargon.',
  'Suggest a structure for a technical launch announcement.',
  'Describe how to evaluate a source for credibility.',
  'Provide a concise checklist for an accessible form.',
  'Explain the difference between correlation and causation.',
  'Draft a calm response to a service outage report.',
  'Summarize the benefits and limits of unit testing.'
]

const seededNoise = seed => {
  const x = Math.sin(seed * 129.73 + 78.233) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

export function makeSamples(experimentId, variants, count, offset = 0) {
  const modelEffect = { 'Larkspur-2': 3.8, 'Cobalt-Mini': -1.8, 'Meridian-XL': 6.2, 'Fernwave-1': 1.1 }
  const promptEffect = { 'prompt-concise-v3': 1.4, 'prompt-evidence-v2': 4.8, 'prompt-friendly-v4': 2.1, 'prompt-structured-v1': 3.2, 'prompt-reasoning-v5': 5.5, 'prompt-guardrail-v2': 0.8 }
  const output = {}
  variants.forEach((variant, variantIndex) => {
    const letter = LETTERS[variantIndex]
    output[letter] = Array.from({ length: count }, (_, index) => {
      const seed = offset + index + variantIndex * 37 + experimentId.length * 13
      const base = 72 + modelEffect[variant.model] + promptEffect[variant.promptId] - Math.abs(variant.temperature - 0.6) * 3
      const criterionScores = {
        'factual-accuracy': Math.max(30, Math.min(99, base + seededNoise(seed + 1) * 9)),
        tone: Math.max(30, Math.min(99, base + seededNoise(seed + 2) * 11 + (variant.promptId.includes('friendly') ? 5 : 0))),
        completeness: Math.max(30, Math.min(99, base + seededNoise(seed + 3) * 10 + (variant.model === 'Meridian-XL' ? 3 : 0))),
        formatting: Math.max(30, Math.min(99, base + seededNoise(seed + 4) * 8 + (variant.promptId.includes('structured') ? 6 : 0)))
      }
      const score = Object.values(criterionScores).reduce((sum, value) => sum + value, 0) / 4
      return {
        id: `${experimentId}-${letter}-${offset + index + 1}`,
        index: offset + index,
        input: inputSet[(offset + index) % inputSet.length],
        response: `${variant.title} applies ${variant.promptId.replaceAll('-', ' ')} with ${variant.model} to produce a focused response for sample ${offset + index + 1}.`,
        criterionScores,
        score: Number(score.toFixed(2)),
        latency: Math.round(540 + variantIndex * 95 + (seededNoise(seed + 5) + 1) * 310 + (variant.model === 'Meridian-XL' ? 240 : 0)),
        tokens: Math.round(118 + variantIndex * 11 + (seededNoise(seed + 6) + 1) * 52 + variant.temperature * 15)
      }
    })
  })
  return output
}

const designs = [
  {
    id: 'exp-onboarding-tone', name: 'Onboarding assistant — confidence and warmth', hypothesis: 'A friendly evidence-first prompt will improve tone without reducing factual accuracy.', successMetric: 'tone', minimumSampleSize: 24,
    variants: [
      { title: 'Baseline', promptId: 'prompt-concise-v3', model: 'Larkspur-2', temperature: 0.4, trafficAllocation: 50 },
      { title: 'Warm evidence', promptId: 'prompt-friendly-v4', model: 'Meridian-XL', temperature: 0.7, trafficAllocation: 50 }
    ], status: 'completed', startedAt: '2026-07-18T09:14:00.000Z', sampleTarget: 32
  },
  {
    id: 'exp-support-structure', name: 'Support answer structure', hypothesis: 'Structured responses improve completeness and formatting.', successMetric: 'completeness', minimumSampleSize: 24,
    variants: [
      { title: 'Current', promptId: 'prompt-concise-v3', model: 'Cobalt-Mini', temperature: 0.5, trafficAllocation: 50 },
      { title: 'Structured', promptId: 'prompt-structured-v1', model: 'Larkspur-2', temperature: 0.4, trafficAllocation: 50 }
    ], status: 'completed', startedAt: '2026-07-17T14:28:00.000Z', sampleTarget: 30
  },
  {
    id: 'exp-evidence-depth', name: 'Evidence depth for research answers', hypothesis: 'Reasoning plus evidence improves accuracy for research prompts.', successMetric: 'factual-accuracy', minimumSampleSize: 20,
    variants: [
      { title: 'Evidence', promptId: 'prompt-evidence-v2', model: 'Larkspur-2', temperature: 0.3, trafficAllocation: 34 },
      { title: 'Reasoning', promptId: 'prompt-reasoning-v5', model: 'Meridian-XL', temperature: 0.5, trafficAllocation: 33 },
      { title: 'Guarded', promptId: 'prompt-guardrail-v2', model: 'Fernwave-1', temperature: 0.2, trafficAllocation: 33 }
    ], status: 'completed', startedAt: '2026-07-16T11:02:00.000Z', sampleTarget: 28
  },
  {
    id: 'exp-launch-copy', name: 'Launch copy brevity', hypothesis: 'A concise prompt will reduce tokens while keeping tone above threshold.', successMetric: 'tone', minimumSampleSize: 40,
    variants: [
      { title: 'Friendly', promptId: 'prompt-friendly-v4', model: 'Fernwave-1', temperature: 0.8, trafficAllocation: 50 },
      { title: 'Concise', promptId: 'prompt-concise-v3', model: 'Cobalt-Mini', temperature: 0.5, trafficAllocation: 50 }
    ], status: 'pending', startedAt: null, sampleTarget: 40
  },
  {
    id: 'exp-safety-format', name: 'Safety response formatting', hypothesis: 'A structured guardrail prompt will make refusal guidance clearer.', successMetric: 'formatting', minimumSampleSize: 36,
    variants: [
      { title: 'Guardrail', promptId: 'prompt-guardrail-v2', model: 'Larkspur-2', temperature: 0.2, trafficAllocation: 50 },
      { title: 'Structured', promptId: 'prompt-structured-v1', model: 'Meridian-XL', temperature: 0.3, trafficAllocation: 50 }
    ], status: 'pending', startedAt: null, sampleTarget: 36
  }
]

export const seedExperiments = designs.map(design => {
  const { sampleTarget, ...experiment } = design
  const isComplete = design.status === 'completed'
  const samples = isComplete ? makeSamples(design.id, design.variants, sampleTarget) : Object.fromEntries(design.variants.map((_, index) => [LETTERS[index], []]))
  return {
    ...experiment,
    previousStatus: null,
    samples,
    progress: Object.fromEntries(design.variants.map((_, index) => [LETTERS[index], isComplete ? sampleTarget : 0])),
    flaggedResponseIds: [],
    decision: null,
    timeline: isComplete ? [
      { id: `${design.id}-start`, type: 'started', text: 'Run started', at: design.startedAt },
      { id: `${design.id}-complete`, type: 'completed', text: 'All variants completed', at: new Date(Date.parse(design.startedAt) + sampleTarget * 1000).toISOString() }
    ] : [],
    createdAt: design.startedAt || '2026-07-19T12:00:00.000Z'
  }
})

export const defaultExperiment = {
  name: '',
  hypothesis: '',
  successMetric: 'factual-accuracy',
  minimumSampleSize: 30,
  variants: [
    { title: 'Baseline', promptId: 'prompt-concise-v3', model: 'Larkspur-2', temperature: 0.5, trafficAllocation: 50 },
    { title: 'Challenger', promptId: 'prompt-evidence-v2', model: 'Meridian-XL', temperature: 0.6, trafficAllocation: 50 }
  ]
}
