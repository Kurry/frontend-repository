let seedId = 0;
const id = () => `seed-${++seedId}`;
const s = (key, required = false, extra = {}) => ({ id: id(), key, type: 'string', required, ...extra });
const n = (key, required = false, extra = {}) => ({ id: id(), key, type: 'number', required, ...extra });
const b = (key, required = false, extra = {}) => ({ id: id(), key, type: 'boolean', required, ...extra });
const o = (key, required, children) => ({ id: id(), key, type: 'object', required, children });
const a = (key, required, children = []) => ({ id: id(), key, type: 'array', required, children });

export const seedSchemas = [
  {
    id: 'schema-evaluation', name: 'Evaluation result', metadata: { Owner: 'Quality team', Stage: 'Production' }, fields: [
      s('evaluation_id', true, { description: 'Stable evaluation identifier' }),
      n('score', true, { minimum: 0, maximum: 100, description: 'Normalized evaluation score' }),
      s('verdict', true, { enumValues: ['pass', 'review', 'fail'] }),
      b('requires_review', true),
      o('metrics', true, [n('accuracy', true, { minimum: 0, maximum: 1 }), n('coverage', true, { minimum: 0, maximum: 1 }), s('notes')]),
      a('issues', false, [s('code', true), s('message', true), s('severity', true, { enumValues: ['low', 'medium', 'high'] })]),
    ],
  },
  {
    id: 'schema-agent-task', name: 'Agent task', metadata: { Owner: 'Agents team', Stage: 'Draft' }, fields: [
      s('task_id', true), s('objective', true), s('status', true, { enumValues: ['queued', 'running', 'complete'] }), n('priority', true, { minimum: 1, maximum: 5 }),
      o('assignee', true, [s('agent_id', true), s('model', true), b('sandboxed', true)]),
      a('tools', false, [s('name', true), b('required', true)]),
    ],
  },
  {
    id: 'schema-prompt-metadata', name: 'Prompt metadata', metadata: { Owner: 'Prompt ops', Stage: 'Review' }, fields: [
      s('prompt_id', true), s('title', true), s('model', true), n('temperature', true, { minimum: 0, maximum: 2 }), b('streaming', true),
      o('author', true, [s('name', true), s('team'), s('email', false, { pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$' })]),
      a('tags', false),
    ],
  },
  {
    id: 'schema-classification', name: 'Classification response', metadata: { Owner: 'ML platform', Stage: 'Production' }, fields: [
      s('request_id', true), s('label', true, { enumValues: ['billing', 'technical', 'sales', 'other'] }), n('confidence', true, { minimum: 0, maximum: 1 }), b('needs_human', true),
      o('rationale', true, [s('summary', true), s('evidence', false), n('signals', false, { minimum: 0 })]),
      a('alternatives', false, [s('label', true), n('confidence', true, { minimum: 0, maximum: 1 })]),
    ],
  },
];
