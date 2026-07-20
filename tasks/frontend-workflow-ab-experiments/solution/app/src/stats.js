import { LETTERS } from './contracts'

export const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null

const variance = values => {
  if (values.length < 2) return 0
  const avg = mean(values)
  return values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1)
}

const erf = value => {
  const sign = value < 0 ? -1 : 1
  const x = Math.abs(value)
  const t = 1 / (1 + 0.3275911 * x)
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)
  return sign * y
}

const normalCdf = value => (1 + erf(value / Math.sqrt(2))) / 2

export function usableSamples(experiment, letter) {
  const flagged = new Set(experiment.flaggedResponseIds || [])
  return (experiment.samples?.[letter] || []).filter(sample => !flagged.has(sample.id))
}

export function computeStatistics(experiment) {
  const letters = experiment.variants.map((_, index) => LETTERS[index])
  const sets = Object.fromEntries(letters.map(letter => [letter, usableSamples(experiment, letter)]))
  const means = Object.fromEntries(letters.map(letter => [letter, mean(sets[letter].map(sample => sample.score))]))
  const insufficient = letters.some(letter => !sets[letter].length)
  if (insufficient) return { winner: 'Tie', winRate: 0, pValue: 1, confidenceInterval: [0, 0], means, insufficient: true, sets }
  const ranked = [...letters].sort((a, b) => means[b] - means[a])
  const winner = Math.abs(means[ranked[0]] - means[ranked[1]]) < 0.01 ? 'Tie' : ranked[0]
  const baseline = letters[0]
  const leader = ranked[0]
  const a = sets[leader].map(sample => sample.score)
  const b = sets[baseline === leader ? ranked[1] : baseline].map(sample => sample.score)
  const delta = mean(a) - mean(b)
  const standardError = Math.sqrt(variance(a) / a.length + variance(b) / b.length)
  const statistic = standardError ? Math.abs(delta / standardError) : 0
  const pValue = Math.max(0, Math.min(1, 2 * (1 - normalCdf(statistic))))
  const confidenceInterval = [delta - 1.96 * standardError, delta + 1.96 * standardError]
  const pairCount = Math.min(a.length, b.length)
  const wins = Array.from({ length: pairCount }, (_, index) => a[index] > b[index] ? 1 : a[index] === b[index] ? 0.5 : 0)
  return {
    winner,
    winRate: pairCount ? wins.reduce((sum, value) => sum + value, 0) / pairCount : 0,
    pValue,
    confidenceInterval,
    means,
    insufficient: false,
    sets,
    leader,
    baseline,
    delta
  }
}

export function criterionMeans(experiment, criteria) {
  return criteria.map(criterion => {
    const row = { criterion: criterion.label || criterion.name }
    experiment.variants.forEach((_, index) => {
      const letter = LETTERS[index]
      row[letter] = mean(usableSamples(experiment, letter).map(sample => sample.criterionScores[criterion.name] ?? sample.score)) || 0
    })
    return row
  })
}

export function matrixMetrics(experiment) {
  const statistics = computeStatistics(experiment)
  const letters = experiment.variants.map((_, index) => LETTERS[index])
  const winCounts = Object.fromEntries(letters.map(letter => [letter, 0]))
  const maxLength = Math.max(...letters.map(letter => statistics.sets[letter].length), 0)
  for (let index = 0; index < maxLength; index += 1) {
    const present = letters.filter(letter => statistics.sets[letter][index])
    if (!present.length) continue
    const best = Math.max(...present.map(letter => statistics.sets[letter][index].score))
    present.filter(letter => statistics.sets[letter][index].score === best).forEach(letter => { winCounts[letter] += 1 / present.filter(key => statistics.sets[key][index].score === best).length })
  }
  return [
    { label: 'Mean score', values: Object.fromEntries(letters.map(letter => [letter, statistics.means[letter] || 0])), format: value => value.toFixed(1) },
    { label: 'Mean latency', values: Object.fromEntries(letters.map(letter => [letter, mean(statistics.sets[letter].map(sample => sample.latency)) || 0])), format: value => `${Math.round(value)} ms`, lower: true },
    { label: 'Mean tokens / sample', values: Object.fromEntries(letters.map(letter => [letter, mean(statistics.sets[letter].map(sample => sample.tokens)) || 0])), format: value => Math.round(value), lower: true },
    { label: 'Token efficiency', values: Object.fromEntries(letters.map(letter => [letter, (statistics.means[letter] || 0) / ((mean(statistics.sets[letter].map(sample => sample.tokens)) || 1) / 100)])), format: value => value.toFixed(1) },
    { label: 'Win rate', values: Object.fromEntries(letters.map(letter => [letter, maxLength ? winCounts[letter] / maxLength : 0])), format: value => `${(value * 100).toFixed(0)}%` }
  ]
}

export function passRates(experiment, criteria) {
  const all = experiment.variants.flatMap((_, index) => usableSamples(experiment, LETTERS[index]))
  return criteria.map(criterion => ({
    ...criterion,
    value: all.length ? all.filter(sample => (sample.criterionScores[criterion.name] ?? sample.score) >= criterion.passThreshold).length / all.length * 100 : 0
  }))
}

export function cumulativeData(experiment) {
  const letters = experiment.variants.map((_, index) => LETTERS[index])
  const maxLength = Math.max(...letters.map(letter => usableSamples(experiment, letter).length), 0)
  return Array.from({ length: maxLength }, (_, index) => {
    const row = { sample: index + 1 }
    letters.forEach(letter => { row[letter] = mean(usableSamples(experiment, letter).slice(0, index + 1).map(sample => sample.score)) || 0 })
    return row
  })
}

export function sampleRows(experiment) {
  const letters = experiment.variants.map((_, index) => LETTERS[index])
  const maxLength = Math.max(...letters.map(letter => experiment.samples[letter]?.length || 0), 0)
  return Array.from({ length: maxLength }, (_, index) => {
    const row = { id: `${experiment.id}-row-${index}`, input: experiment.samples[letters[0]]?.[index]?.input || `Sample ${index + 1}` }
    letters.forEach(letter => { row[letter] = experiment.samples[letter]?.[index]?.score ?? null })
    row.delta = letters.length > 1 && row[letters[0]] != null && row[letters[1]] != null ? row[letters[1]] - row[letters[0]] : 0
    return row
  })
}
