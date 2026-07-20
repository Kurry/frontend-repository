const model = (name, provider, context_window, input_cost_per_1k, output_cost_per_1k, pricing_tier = 'paid', pinned = false) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  name,
  provider,
  context_window,
  input_cost_per_1k,
  output_cost_per_1k,
  pricing_tier,
  pinned,
  lifecycle: 'stable',
})

export const seedModels = [
  model('GPT-4.1 Mini', 'OpenAI', 1047576, 0.0004, 0.0016, 'paid', true),
  model('GPT-4o Mini', 'OpenAI', 128000, 0.00015, 0.0006),
  model('o3', 'OpenAI', 200000, 0.002, 0.008),
  model('Claude 3.7 Sonnet', 'Anthropic', 200000, 0.003, 0.015, 'paid', true),
  model('Claude 3.5 Haiku', 'Anthropic', 200000, 0.0008, 0.004),
  model('Gemini 2.5 Pro', 'Google', 1048576, 0.00125, 0.01),
  model('Gemini 2.0 Flash', 'Google', 1048576, 0, 0, 'free'),
  model('Llama 4 Scout', 'Meta', 10000000, 0, 0, 'free'),
  model('Llama 3.3 70B', 'Meta', 131072, 0.00059, 0.00079),
  model('Mistral Large 2', 'Mistral', 128000, 0.002, 0.006),
  model('Codestral', 'Mistral', 256000, 0.0003, 0.0009),
  model('DeepSeek V3', 'DeepSeek', 128000, 0.00027, 0.0011),
  model('DeepSeek R1', 'DeepSeek', 128000, 0.00055, 0.00219),
  model('Qwen2.5 72B', 'Alibaba', 131072, 0, 0, 'free'),
  model('Qwen2.5 Coder', 'Alibaba', 131072, 0.0002, 0.0006),
  model('Command R+', 'Cohere', 128000, 0.0025, 0.01),
  model('Jamba 1.5 Large', 'AI21', 256000, 0.002, 0.008),
  model('Nova Pro', 'Amazon', 300000, 0.0008, 0.0032),
  model('Nova Lite', 'Amazon', 300000, 0.00006, 0.00024),
  model('Grok 3 Mini', 'xAI', 131072, 0.0003, 0.0005),
  model('Kimi K2', 'Moonshot', 131072, 0, 0, 'free'),
  model('Gemma 3 27B', 'Google', 131072, 0.0001, 0.0002),
]

const event = (id, minutesAgo, model, request_label, prompt_tokens, completion_tokens, cost) => ({
  id,
  timestamp: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
  model,
  request_label,
  prompt_tokens,
  completion_tokens,
  cost,
  source: 'seeded',
})

export const seedUsageEvents = [
  event('seed-8', 3, 'Claude 3.7 Sonnet', 'Policy analysis', 18400, 2200, 0.0882),
  event('seed-7', 7, 'GPT-4.1 Mini', 'Catalog normalization', 24600, 3100, 0.0148),
  event('seed-6', 12, 'Gemini 2.5 Pro', 'Routing evaluation', 32000, 1600, 0.056),
  event('seed-5', 18, 'DeepSeek R1', 'Reasoning benchmark', 14100, 4200, 0.016947),
  event('seed-4', 25, 'Claude 3.7 Sonnet', 'Contract review', 8900, 1750, 0.05295),
  event('seed-3', 34, 'GPT-4.1 Mini', 'Agent handoff', 12000, 900, 0.00624),
  event('seed-2', 46, 'Gemini 2.5 Pro', 'Context stress test', 45000, 2400, 0.08025),
  event('seed-1', 58, 'GPT-4o Mini', 'Fast classification', 6800, 420, 0.001272),
]

export const refreshAdditions = [
  model('Solar Pro 2', 'Upstage', 128000, 0.0005, 0.0015),
  model('Phi-4 Reasoning', 'Microsoft', 32768, 0, 0, 'free'),
  model('MiniMax M2', 'MiniMax', 200000, 0.0003, 0.0012),
  model('Llama 4 Maverick', 'Meta', 1048576, 0.0002, 0.0006),
]

export const chartColors = ['#78a9ff', '#42be65', '#be95ff', '#ff7eb6', '#f1c21b', '#08bdba', '#ff832b', '#4589ff']

export function calculateCost(modelRecord, promptTokens, completionTokens) {
  if (!modelRecord) return 0
  return Number(((Number(promptTokens || 0) * modelRecord.input_cost_per_1k) / 1000 + (Number(completionTokens || 0) * modelRecord.output_cost_per_1k) / 1000).toFixed(8))
}
