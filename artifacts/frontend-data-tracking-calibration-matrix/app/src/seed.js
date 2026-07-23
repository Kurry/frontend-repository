export const modelNames = ['Quillfox-7', 'Marlin-XL', 'Cobaltine-2', 'Peregrine-Lite', 'Sagebrush-9', 'Tundra-Mini']
export const harnessNames = ['driftbench', 'quarry', 'lanternctl', 'mosaic-eval']

export const tasks = [
  { name: 'Constraint braid', category: 'Reasoning', base: 0.12, biases: [0.01, 0.00, -0.01, 0.02] },
  { name: 'Counterfactual map', category: 'Reasoning', base: 0.08, biases: [0.00, -0.19, 0.12, -0.04] },
  { name: 'Ledger inference', category: 'Reasoning', base: 0.05, biases: [0.04, 0.00, -0.03, 0.02] },
  { name: 'Temporal splice', category: 'Reasoning', base: -0.01, biases: [-0.18, 0.13, 0.02, -0.08] },
  { name: 'Refusal boundary', category: 'Safety', base: 0.09, biases: [0.03, 0.01, 0.02, 0.00] },
  { name: 'Ambiguous intent', category: 'Safety', base: 0.01, biases: [0.14, -0.15, 0.04, -0.09] },
  { name: 'Policy citation', category: 'Safety', base: 0.06, biases: [0.01, 0.03, 0.00, -0.02] },
  { name: 'Sensitive transform', category: 'Safety', base: -0.04, biases: [-0.17, 0.11, -0.03, 0.13] },
  { name: 'Schema relay', category: 'Tool use', base: 0.11, biases: [0.01, -0.02, 0.00, 0.02] },
  { name: 'Retry etiquette', category: 'Tool use', base: 0.02, biases: [-0.12, 0.14, -0.08, 0.05] },
  { name: 'Argument repair', category: 'Tool use', base: 0.07, biases: [0.02, 0.01, -0.01, 0.00] },
  { name: 'Parallel dispatch', category: 'Tool use', base: -0.02, biases: [0.16, -0.16, 0.08, -0.12] },
]

const modelBase = [0.82, 0.75, 0.68, 0.61, 0.72, 0.56]
const harnessOffset = [0.04, -0.03, 0.01, -0.07]

function clamp(value, min = 0.08, max = 0.98) {
  return Math.max(min, Math.min(max, value))
}

export function createSeedCells() {
  const cells = {}
  modelNames.forEach((model, mi) => {
    harnessNames.forEach((harness, hi) => {
      const key = `${model}::${harness}`
      const count = 3 + ((mi * 2 + hi) % 4)
      const trials = Array.from({ length: count }, (_, ti) => {
        const wave = (((mi + 2) * (hi + 3) * (ti + 1)) % 9 - 4) * 0.018
        const reward = clamp(modelBase[mi] + harnessOffset[hi] + wave)
        return {
          id: `seed-${mi + 1}${hi + 1}-${String(ti + 1).padStart(2, '0')}`,
          reward: Number(reward.toFixed(3)),
          runtime: Number((1.2 + mi * 0.31 + hi * 0.17 + ti * 0.23).toFixed(2)),
          cost: Number((0.006 + mi * 0.0018 + hi * 0.0012 + ti * 0.0007).toFixed(4)),
        }
      })
      cells[key] = { model, harness, trials }
    })
  })
  return cells
}
