import { DIMENSIONS } from './contracts.js'

export const TASKS = ['canvas-paint-studio', 'expense-dashboard', 'trip-planner', 'markdown-notes']

export const seedLabels = [
  { name: 'Baseline', scorerModel: 'Sable 4', configNote: 'Original benchmark scoring · threshold 0.70' },
  { name: 'Quartz Swap', scorerModel: 'Quartz Mini', configNote: 'Compact scorer swap · prompt q3' },
  { name: 'Rubric v2', scorerModel: 'Sable 4', configNote: 'Reweighted interaction rubric · v2' },
  { name: 'Harness r8', scorerModel: 'Onyx Pro', configNote: 'Updated browser harness · revision 8' },
]

const labelOffsets = { Baseline: 0, 'Quartz Swap': 0.045, 'Rubric v2': 0.075, 'Harness r8': -0.025 }
const dimOffsets = { correctness: 0.03, visual: -0.02, motion: -0.055, technical: 0.045 }
const criterionNames = {
  correctness: ['Core task outcome', 'Input state handling', 'Data accuracy', 'Edge path recovery'],
  visual: ['Layout hierarchy', 'Surface consistency', 'Responsive composition', 'Text clarity'],
  motion: ['State transition', 'Progress feedback', 'Hover response', 'Reduced motion'],
  technical: ['Console integrity', 'Keyboard path', 'State synchronization', 'Runtime stability'],
}
const clamp = (value) => Math.max(0.12, Math.min(0.98, value))
const round = (value, places = 2) => Number(value.toFixed(places))

function makeCriteria(trialIndex, labelName, scores) {
  const labelIndex = seedLabels.findIndex((label) => label.name === labelName)
  return DIMENSIONS.flatMap((dimension, di) => criterionNames[dimension].map((name, ci) => {
    const criterionIndex = di * 4 + ci
    const baselineFail = ((trialIndex * 3 + criterionIndex * 2 + di) % 9) < (scores[dimension] < 0.7 ? 4 : 2)
    let fail = baselineFail
    if (!(trialIndex === 0 && labelName === 'Rubric v2') && labelName !== 'Baseline') {
      const flip = ((trialIndex + 2) * (criterionIndex + 3) + labelIndex * 5) % 13 === 0
        || (labelName === 'Harness r8' && (trialIndex + criterionIndex) % 17 === 0)
      if (flip) fail = !fail
    }
    const verdict = fail ? 'fail' : 'pass'
    const nuance = labelName === 'Baseline' ? 'the original evidence' : `${labelName}'s configured evidence weighting`
    return {
      id: `${dimension}-${ci + 1}`,
      dimension,
      title: name,
      verdict,
      reasoning: fail
        ? `${name} did not meet the ${dimension} bar under ${nuance}. The observed behavior was incomplete in this run.`
        : `${name} met the ${dimension} bar under ${nuance}. The observed behavior remained consistent through the checked path.`,
    }
  }))
}

export function makeResult(trialIndex, label, extraOffset = 0) {
  const taskBias = [0.03, -0.04, 0.07, -0.01][Math.floor(trialIndex / 3)]
  const runBias = [-0.14, 0.015, 0.12][trialIndex % 3]
  const wobble = (((trialIndex + 1) * (seedLabels.findIndex((item) => item.name === label.name) + 2)) % 7 - 3) * 0.018
  const base = 0.7 + taskBias + runBias + (labelOffsets[label.name] ?? extraOffset) + wobble
  const dimensions = Object.fromEntries(DIMENSIONS.map((dimension, di) => [
    dimension,
    round(clamp(base + dimOffsets[dimension] + (((trialIndex + di * 2) % 5) - 2) * 0.014)),
  ]))
  const totalReward = round(DIMENSIONS.reduce((sum, dimension) => sum + dimensions[dimension], 0) / 4)
  return {
    dimensions,
    totalReward,
    pass: totalReward >= 0.7,
    scorerModel: label.scorerModel,
    scorerCost: round(0.031 + (seedLabels.findIndex((item) => item.name === label.name) + 1) * 0.009 + (trialIndex % 4) * 0.004, 3),
    toolCalls: 7 + ((trialIndex * 2 + label.name.length) % 11),
    duration: round(18 + trialIndex * 1.7 + label.name.length * 0.28, 1),
    criteria: makeCriteria(trialIndex, label.name, dimensions),
  }
}

export const seedTrials = Array.from({ length: 12 }, (_, index) => {
  const taskName = TASKS[Math.floor(index / 3)]
  const results = Object.fromEntries(seedLabels.map((label) => [label.name, makeResult(index, label)]))
  // A deliberate full-agreement control for the designed no-flips state
  // (kept on the last trial so early rows always carry flips to explore).
  if (index === 11) results['Rubric v2'].criteria = structuredClone(results.Baseline.criteria)
  return {
    id: `trial-${String(index + 1).padStart(3, '0')}`,
    taskName,
    results,
  }
})

export function makeNewLabelResult(trialIndex, label) {
  const offset = 0.018 + ((label.name.length % 7) - 3) * 0.008
  const base = makeResult(trialIndex, label, offset)
  const criteria = DIMENSIONS.flatMap((dimension, di) => criterionNames[dimension].map((name, ci) => {
    const criterionIndex = di * 4 + ci
    const fail = ((trialIndex + 4) * (criterionIndex + label.name.length + 2)) % 11 < (base.dimensions[dimension] < 0.7 ? 4 : 2)
    return {
      id: `${dimension}-${ci + 1}`,
      dimension,
      title: name,
      verdict: fail ? 'fail' : 'pass',
      reasoning: fail
        ? `${name} missed the configured ${dimension} requirement for ${label.name}. The scorer found insufficient evidence in the completed trace.`
        : `${name} satisfied the configured ${dimension} requirement for ${label.name}. The scorer found stable evidence in the completed trace.`,
    }
  }))
  return { ...base, scorerModel: label.scorerModel, criteria }
}
