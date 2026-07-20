const topics = [
  { name: 'React', tags: ['react', 'frontend', 'components'], terms: ['hooks', 'rendering', 'state', 'components', 'effects', 'accessibility'], focus: 'building responsive React interfaces with predictable component state and accessible interaction patterns' },
  { name: 'Search', tags: ['search', 'ranking', 'relevance'], terms: ['tf-idf', 'ranking', 'tokenization', 'similarity', 'query', 'index'], focus: 'designing semantic retrieval systems with deterministic ranking, useful snippets, and transparent relevance signals' },
  { name: 'Prompting', tags: ['prompts', 'ai', 'workflow'], terms: ['prompt', 'context', 'examples', 'evaluation', 'reasoning', 'guardrails'], focus: 'writing reusable prompts that provide context, constraints, examples, and measurable evaluation criteria' },
  { name: 'Design systems', tags: ['design', 'carbon', 'accessibility'], terms: ['tokens', 'typography', 'spacing', 'contrast', 'components', 'keyboard'], focus: 'applying design tokens and Carbon components to create consistent, inclusive product experiences' },
  { name: 'Data engineering', tags: ['data', 'pipelines', 'quality'], terms: ['ingest', 'schema', 'validation', 'pipeline', 'lineage', 'retry'], focus: 'operating reliable data pipelines with strict schemas, observable ingest steps, and recoverable failures' },
  { name: 'Research', tags: ['research', 'methods', 'evidence'], terms: ['hypothesis', 'study', 'evidence', 'metrics', 'analysis', 'experiment'], focus: 'planning empirical research with explicit hypotheses, reproducible methods, and honest interpretation of evidence' },
  { name: 'Engineering', tags: ['engineering', 'delivery', 'testing'], terms: ['testing', 'architecture', 'performance', 'review', 'deployment', 'monitoring'], focus: 'shipping maintainable software through clear architecture, focused tests, performance budgets, and review' },
  { name: 'Knowledge', tags: ['knowledge', 'documentation', 'teams'], terms: ['documentation', 'taxonomy', 'ownership', 'decisions', 'learning', 'sharing'], focus: 'organizing team knowledge so decisions are discoverable, current, and useful in daily work' },
]
const types = ['guide', 'reference', 'prompt', 'checklist', 'paper', 'note']
const angles = ['Foundations', 'Field guide', 'Patterns', 'Quality review', 'Operational playbook', 'Advanced notes', 'Team briefing', 'Practical examples', 'Failure modes', 'Decision record', 'Quickstart', 'Evaluation rubric', 'Migration plan', 'Performance study', 'Workshop notes']

export function seedDocuments() {
  return Array.from({ length: 120 }, (_, i) => {
    const topic = topics[i % topics.length]
    const type = types[i % types.length]
    const sequence = Math.floor(i / topics.length)
    const angle = angles[sequence % angles.length]
    const rotated = topic.terms.slice(sequence % topic.terms.length).concat(topic.terms.slice(0, sequence % topic.terms.length))
    const emphasis = Array.from({ length: 1 + (sequence % 4) }, () => rotated[0]).join(', ')
    return {
      id: `doc-${String(i + 1).padStart(3, '0')}`,
      title: `${angle}: ${topic.name} ${type === 'paper' ? 'study' : type}`,
      type,
      tags: [...topic.tags, type],
      topic: topic.name,
      createdAt: new Date(Date.UTC(2024 + (i % 2), i % 12, 1 + (i % 26))).toISOString(),
      body: `${angle} for ${topic.focus}. This ${type} connects ${rotated[0]}, ${rotated[1]}, and ${rotated[2]} through a realistic team scenario. Its primary lens is ${emphasis}, giving the team a concrete thread to follow through the example. The recommended approach starts by defining the goal and collecting representative inputs before changing the system. Practitioners should measure ${rotated[3]} quality, document tradeoffs, and test the smallest useful slice with real users. A second pass examines ${rotated[4]} and ${rotated[5]} so the result remains dependable under changing conditions. Use the included review questions to turn findings into an accountable next action.`,
    }
  })
}

export const topicFor = (doc) => doc.topic || doc.tags?.find((tag) => topics.some((t) => t.tags.includes(tag))) || 'Other'
