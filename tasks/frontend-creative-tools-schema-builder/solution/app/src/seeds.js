// Seeded schema library — four realistic structured-output schemas, each
// with at least six fields, one nested object, and one array. Every record
// conforms to the FieldDefinition contract.
import { rootNode, fieldDefToNode, EMAIL_PATTERN, ISO_DATE_PATTERN } from './lib.js';

function defsToTree(defs) {
  return rootNode(defs.map(fieldDefToNode));
}

function seed(id, name, metaValues, defs) {
  const tree = defsToTree(defs);
  return {
    id,
    name,
    metaValues,
    tree,
    past: [],
    future: [],
    versions: [],
    exampleOverride: null,
    formatOverride: null,
  };
}

export function buildSeeds() {
  return [
    seed('seed-eval', 'Evaluation result', { Team: 'Eval harness', Stage: 'Production' }, [
      { key: 'run_id', type: 'string', required: true, description: 'Unique identifier for the evaluation run' },
      { key: 'score', type: 'number', required: true, minimum: 0, maximum: 100, description: 'Overall score' },
      {
        key: 'rubric',
        type: 'object',
        required: true,
        description: 'Per-criterion breakdown',
        children: [
          { key: 'accuracy', type: 'number', required: true, minimum: 0, maximum: 10 },
          { key: 'style', type: 'number', required: false, minimum: 0, maximum: 10 },
          { key: 'notes', type: 'string', required: false },
        ],
      },
      { key: 'status', type: 'string', required: true, enumValues: ['pass', 'fail', 'review'] },
      { key: 'tags', type: 'array', required: false, children: [{ key: 'item', type: 'string', required: false }] },
      { key: 'evaluated_at', type: 'string', required: true, pattern: ISO_DATE_PATTERN, description: 'ISO date of the run' },
      { key: 'passed', type: 'boolean', required: true },
    ]),
    seed('seed-agent', 'Agent task', { Team: 'Agents', Stage: 'Staging' }, [
      { key: 'task_id', type: 'string', required: true, description: 'Identifier for the agent task' },
      { key: 'objective', type: 'string', required: true, description: 'What the agent must accomplish' },
      { key: 'priority', type: 'number', required: false, minimum: 1, maximum: 5 },
      {
        key: 'context',
        type: 'object',
        required: false,
        description: 'Execution context',
        children: [
          { key: 'workspace', type: 'string', required: false },
          { key: 'timeout_seconds', type: 'number', required: false, minimum: 1, maximum: 3600 },
        ],
      },
      { key: 'tools', type: 'array', required: true, children: [{ key: 'item', type: 'string', required: true }] },
      { key: 'mode', type: 'string', required: true, enumValues: ['plan', 'act', 'review'] },
    ]),
    seed('seed-meta', 'Prompt metadata', { Team: 'Prompt ops', Stage: 'Production' }, [
      { key: 'prompt_id', type: 'string', required: true },
      { key: 'author', type: 'string', required: true, pattern: EMAIL_PATTERN, description: 'Author contact email' },
      { key: 'version', type: 'number', required: true, minimum: 1, maximum: 999 },
      { key: 'language', type: 'string', required: false, enumValues: ['en', 'es', 'fr', 'de'] },
      {
        key: 'settings',
        type: 'object',
        required: false,
        children: [
          { key: 'temperature', type: 'number', required: false, minimum: 0, maximum: 2 },
          { key: 'system_prompt', type: 'string', required: false },
        ],
      },
      { key: 'changelog', type: 'array', required: false, children: [{ key: 'item', type: 'string', required: false }] },
    ]),
    seed('seed-classify', 'Classification response', { Team: 'Trust & safety', Stage: 'Production' }, [
      { key: 'doc_id', type: 'string', required: true },
      { key: 'label', type: 'string', required: true, enumValues: ['spam', 'ham', 'phishing', 'unknown'] },
      { key: 'confidence', type: 'number', required: true, minimum: 0, maximum: 1 },
      {
        key: 'signals',
        type: 'object',
        required: false,
        description: 'Feature signals used by the classifier',
        children: [
          { key: 'keyword_hits', type: 'number', required: false, minimum: 0, maximum: 50 },
          { key: 'sender_known', type: 'boolean', required: false },
        ],
      },
      { key: 'matched_rules', type: 'array', required: false, children: [{ key: 'item', type: 'string', required: false }] },
      { key: 'reviewed', type: 'boolean', required: true },
    ]),
  ];
}

export const SEED_METADATA_FIELDS = [
  { id: 'mf-team', label: 'Team', type: 'text' },
  { id: 'mf-stage', label: 'Stage', type: 'dropdown', options: ['Staging', 'Production'] },
];
