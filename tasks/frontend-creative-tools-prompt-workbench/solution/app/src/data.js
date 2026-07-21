export const MODELS = [
  { id: 'nova-2-pro', name: 'Nova 2 Pro', provider: 'Nimbus AI', charsPerToken: 3.7, pricePerMillion: 12 },
  { id: 'nova-2-mini', name: 'Nova 2 Mini', provider: 'Nimbus AI', charsPerToken: 4.2, pricePerMillion: 1.8 },
  { id: 'sonnet-4', name: 'Sonnet 4', provider: 'Vertexa', charsPerToken: 3.5, pricePerMillion: 15 },
  { id: 'haiku-3-5', name: 'Haiku 3.5', provider: 'Vertexa', charsPerToken: 4.4, pricePerMillion: 0.8 },
  { id: 'gemini-2-5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', charsPerToken: 3.9, pricePerMillion: 10 },
  { id: 'gemini-2-5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', charsPerToken: 4.6, pricePerMillion: 0.5 },
]

export const PERSONAS = [
  { id: 'product-strategist', name: 'Product strategist', role: 'Product strategist', preface: 'You are a pragmatic product strategist. Connect customer evidence to clear product decisions, state assumptions, and prioritize useful outcomes.' },
  { id: 'technical-editor', name: 'Technical editor', role: 'Technical editor', preface: 'You are a meticulous technical editor. Improve accuracy, structure, and readability while preserving the author’s intent and voice.' },
  { id: 'research-analyst', name: 'Research analyst', role: 'Research analyst', preface: 'You are a rigorous research analyst. Separate evidence from inference, surface uncertainty, and synthesize findings into concise conclusions.' },
  { id: 'support-lead', name: 'Support lead', role: 'Customer support lead', preface: 'You are an empathetic customer support lead. Respond calmly, explain the next best action, and never overpromise.' },
]

export const ASSETS = [
  { id: 'brand-voice', name: 'brand-voice.pdf', type: 'PDF' },
  { id: 'customer-notes', name: 'customer-notes.txt', type: 'Text' },
  { id: 'product-brief', name: 'product-brief.docx', type: 'Document' },
  { id: 'metrics', name: 'metrics-q2.csv', type: 'Spreadsheet' },
  { id: 'interface', name: 'interface-reference.png', type: 'Image' },
]

export const SUGGESTIONS = [
  { label: 'Launch brief', text: 'Create a concise launch brief for {{product}} aimed at {{audience}}. Include positioning, key messages, and three launch risks.' },
  { label: 'Extract insights', text: 'Extract the five most important customer insights from {{source}} and group them by theme.' },
  { label: 'Rewrite clearly', text: 'Rewrite {{draft}} for clarity and confidence while preserving the original meaning.' },
  { label: 'Compare options', text: 'Compare {{option_a}} and {{option_b}} for {{use_case}}. Recommend one and explain the tradeoffs.' },
]

export const TECHNIQUES = ['zero-shot', 'few-shot', 'chain-of-thought', 'role-prompt', 'extraction', 'summarization']

export const SEEDED_LIBRARY = [
  { id: 'lib-launch', title: 'Product launch brief', technique: 'role-prompt', promptText: SUGGESTIONS[0].text, bindings: { product: 'Atlas', audience: 'operations leaders' }, attachments: ['product-brief'], personaId: 'product-strategist' },
  { id: 'lib-interview', title: 'Interview insight miner', technique: 'extraction', promptText: 'Extract recurring needs, friction points, and verbatim themes from {{interview_notes}}.', bindings: { interview_notes: '' }, attachments: ['customer-notes'], personaId: 'research-analyst' },
  { id: 'lib-summary', title: 'Executive summary', technique: 'summarization', promptText: 'Summarize {{report}} for an executive audience in five bullets and a one-sentence recommendation.', bindings: { report: '' }, attachments: [], personaId: null },
  { id: 'lib-compare', title: 'Decision comparison', technique: 'chain-of-thought', promptText: SUGGESTIONS[3].text, bindings: { option_a: '', option_b: '', use_case: '' }, attachments: [], personaId: null },
]

export function modelById(id) {
  return MODELS.find((model) => model.id === id) || MODELS[0]
}

export function detectVariables(text) {
  const names = []
  const seen = new Set()
  for (const match of text.matchAll(/\{\{([A-Za-z0-9_]+)\}\}/g)) {
    if (!seen.has(match[1])) {
      seen.add(match[1])
      names.push(match[1])
    }
  }
  return names
}

export function estimateTokens(text, modelId) {
  if (!text) return 0
  return Math.max(1, Math.ceil(text.length / modelById(modelId).charsPerToken))
}

export function estimateCost(text, modelId) {
  const model = modelById(modelId)
  return (estimateTokens(text, modelId) / 1_000_000) * model.pricePerMillion
}

export function resolvedPrompt(text, bindings) {
  return text.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (_, name) => bindings[name] || `{{${name}}}`)
}

