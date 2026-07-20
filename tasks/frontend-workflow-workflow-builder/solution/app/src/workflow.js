import { z } from 'zod';

export const NODE_TYPES = ['Prompt', 'Agent', 'Eval', 'Condition', 'Output'];

export const PROMPTS = ['Support triage', 'Research brief', 'Launch summary', 'Risk review'];
export const AGENTS = ['Atlas Agent', 'Cedar Agent', 'Faultline Agent'];
export const RUBRICS = ['Clarity rubric', 'Safety rubric', 'Completeness rubric'];

export const TYPE_META = {
  Prompt: { color: '#0f62fe', soft: '#edf5ff', label: 'Prompt' },
  Agent: { color: '#8a3ffc', soft: '#f6f2ff', label: 'Agent' },
  Eval: { color: '#eb6200', soft: '#fff2e8', label: 'Eval' },
  Condition: { color: '#b28600', soft: '#fff8d6', label: 'Condition' },
  Output: { color: '#198038', soft: '#defbe6', label: 'Output' },
};

export const DEFAULT_CONFIG = {
  Prompt: { prompt: PROMPTS[0] },
  Agent: { agent: AGENTS[1], timeoutSeconds: 60 },
  Eval: { rubric: RUBRICS[0] },
  Condition: { conditionExpression: 'score >= 0.8' },
  Output: { destinationName: 'Review queue' },
};

const promptConfig = z.object({ prompt: z.enum(PROMPTS, { message: 'Prompt is required' }) });
const agentConfig = z.object({
  agent: z.enum(AGENTS, { message: 'Agent is required' }),
  timeoutSeconds: z.coerce.number({ message: 'Timeout is required' }).int('Timeout must be a whole number').min(1, 'Timeout must be at least 1 second').max(300, 'Timeout must be 300 seconds or less'),
});
const evalConfig = z.object({ rubric: z.enum(RUBRICS, { message: 'Rubric is required' }) });
const conditionConfig = z.object({ conditionExpression: z.string().trim().min(1, 'Condition expression is required') });
const outputConfig = z.object({ destinationName: z.string().trim().min(1, 'Destination name is required') });

export const configSchemas = {
  Prompt: promptConfig,
  Agent: agentConfig,
  Eval: evalConfig,
  Condition: conditionConfig,
  Output: outputConfig,
};

const positionSchema = z.object({ x: z.number(), y: z.number() });
const baseNode = { id: z.string().min(1), position: positionSchema, title: z.string().trim().min(1).optional() };
export const workflowNodeSchema = z.discriminatedUnion('type', [
  z.object({ ...baseNode, type: z.literal('Prompt'), config: promptConfig }),
  z.object({ ...baseNode, type: z.literal('Agent'), config: agentConfig }),
  z.object({ ...baseNode, type: z.literal('Eval'), config: evalConfig }),
  z.object({ ...baseNode, type: z.literal('Condition'), config: conditionConfig }),
  z.object({ ...baseNode, type: z.literal('Output'), config: outputConfig }),
]);

export const edgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
});

export const saveWorkflowSchema = z.object({
  name: z.string().trim().min(2, 'Workflow name must be at least 2 characters').max(80, 'Workflow name must be 80 characters or less'),
  nodes: z.array(workflowNodeSchema).nonempty('Workflow must contain at least one node'),
  edges: z.array(edgeSchema),
}).superRefine((workflow, context) => {
  const ids = new Set(workflow.nodes.map((node) => node.id));
  workflow.edges.forEach((edge, index) => {
    if (!ids.has(edge.source)) context.addIssue({ code: 'custom', path: ['edges', index, 'source'], message: 'Edge source must reference a workflow node' });
    if (!ids.has(edge.target)) context.addIssue({ code: 'custom', path: ['edges', index, 'target'], message: 'Edge target must reference a workflow node' });
  });
});

export const workflowDefinitionSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.iso.datetime({ offset: false }),
  name: z.string().trim().min(2).max(80),
  nodes: z.array(workflowNodeSchema).nonempty(),
  edges: z.array(edgeSchema),
}).superRefine((workflow, context) => {
  const ids = new Set(workflow.nodes.map((node) => node.id));
  workflow.edges.forEach((edge, index) => {
    if (!ids.has(edge.source) || !ids.has(edge.target)) context.addIssue({ code: 'custom', path: ['edges', index], message: 'Every edge must reference nodes in this workflow' });
  });
});

export const saveFormSchema = z.object({ name: z.string().trim().min(2, 'Workflow name must be at least 2 characters').max(80, 'Workflow name must be 80 characters or less') });
export const importFormSchema = z.object({ definition: z.string().trim().min(1, 'Workflow definition is required') });

const seedConfigs = {
  Prompt: { prompt: 'Research brief' },
  Agent: { agent: 'Atlas Agent', timeoutSeconds: 45 },
  Eval: { rubric: 'Clarity rubric' },
  Condition: { conditionExpression: 'score >= 0.8' },
  Output: { destinationName: 'Review queue' },
};

const seedNode = (id, type, title, x, y) => ({
  id,
  type,
  position: { x, y },
  data: {
    title,
    config: seedConfigs[type],
    status: null,
    attempt: 0,
    backoff: 0,
    error: '',
    input: null,
    output: null,
    startedAt: null,
    completedAt: null,
    expanded: false,
    justDropped: false,
  },
});

export const createSeedNodes = () => [
  seedNode('prompt-1', 'Prompt', 'Customer context', 40, 130),
  seedNode('agent-1', 'Agent', 'Draft response', 300, 130),
  seedNode('eval-1', 'Eval', 'Quality check', 560, 130),
  seedNode('condition-1', 'Condition', 'Pass threshold', 820, 130),
  seedNode('output-1', 'Output', 'Publish result', 1080, 130),
];

export const createSeedEdges = () => [
  { id: 'edge-prompt-agent', source: 'prompt-1', target: 'agent-1', sourceHandle: 'out', targetHandle: 'in', type: 'smoothstep' },
  { id: 'edge-agent-eval', source: 'agent-1', target: 'eval-1', sourceHandle: 'out', targetHandle: 'in', type: 'smoothstep' },
  { id: 'edge-eval-condition', source: 'eval-1', target: 'condition-1', sourceHandle: 'out', targetHandle: 'in', type: 'smoothstep' },
  { id: 'edge-condition-output', source: 'condition-1', target: 'output-1', sourceHandle: 'out', targetHandle: 'in', type: 'smoothstep' },
];

export function summarizeConfig(type, config) {
  if (type === 'Prompt') return config.prompt;
  if (type === 'Agent') return `${config.agent} · ${config.timeoutSeconds}s`;
  if (type === 'Eval') return config.rubric;
  if (type === 'Condition') return config.conditionExpression;
  return config.destinationName;
}

export function toContractNode(node) {
  return {
    id: node.id,
    type: node.type,
    title: node.data.title,
    position: { x: node.position.x, y: node.position.y },
    config: structuredClone(node.data.config),
  };
}

export function fromContractNode(node) {
  return {
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      title: node.title || `${node.type} node`,
      config: structuredClone(node.config),
      status: null,
      attempt: 0,
      backoff: 0,
      error: '',
      input: null,
      output: null,
      startedAt: null,
      completedAt: null,
      expanded: false,
      justDropped: false,
    },
  };
}

export function toContractEdge(edge) {
  const result = { id: edge.id, source: edge.source, target: edge.target };
  if (edge.sourceHandle) result.sourceHandle = edge.sourceHandle;
  if (edge.targetHandle) result.targetHandle = edge.targetHandle;
  return result;
}

export function workflowToMermaid(workflow) {
  const clean = (value) => String(value).replace(/["\[\]]/g, '').replace(/\n/g, ' ');
  const lines = ['flowchart LR'];
  workflow.nodes.forEach((node) => lines.push(`  ${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}["${clean(node.title || `${node.type} node`)}"]`));
  const labels = new Map(workflow.nodes.map((node) => [node.id, node.id.replace(/[^a-zA-Z0-9_]/g, '_')]));
  workflow.edges.forEach((edge) => lines.push(`  ${labels.get(edge.source)} --> ${labels.get(edge.target)}`));
  return lines.join('\n');
}

export const ALLOWED_CONNECTIONS = new Set([
  'Prompt>Agent', 'Prompt>Eval', 'Prompt>Condition',
  'Agent>Eval', 'Agent>Condition', 'Agent>Output',
  'Eval>Condition', 'Eval>Output',
  'Condition>Agent', 'Condition>Output',
]);
