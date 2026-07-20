import { ASSETS, MODELS, PERSONAS, TECHNIQUES, detectVariables, resolvedPrompt } from './data'
import { libraryPromptSchema, variableNamePattern } from './schemas'
import { compileMarkdown, compilePackage, useWorkbench } from './store'

const stringResult = (text) => ({ content: [{ type: 'text', text }] })
const boundedString = (maxLength, description) => ({ type: 'string', maxLength, description })
const objectTypes = ['prompt-draft', 'variable', 'attachment', 'persona']
const personaIds = PERSONAS.map((item) => item.id)
const assetIds = ASSETS.map((item) => item.id)
const modelIds = MODELS.map((item) => item.id)

function removeVariable(name) {
  const state = useWorkbench.getState()
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  state.setDraft(state.draft.replace(new RegExp(`\\{\\{${escaped}\\}\\}`, 'g'), ''))
}

function editorDelete({ objectType, id }) {
  const state = useWorkbench.getState()
  if (objectType === 'prompt-draft') state.setDraft('')
  else if (objectType === 'persona') state.clearPersona()
  else if (objectType === 'attachment') state.removeAttachment(id)
  else if (objectType === 'variable') removeVariable(id)
  return stringResult(`${objectType} deleted; the visible workbench now reflects the change.`)
}

function editorAdd({ objectType, value }) {
  const state = useWorkbench.getState()
  if (objectType === 'variable') {
    if (!variableNamePattern.test(value) || value.length > 64) throw new Error('Variable name must be 1–64 letters, digits, or underscores.')
    state.insertVariable(value)
  } else if (objectType === 'attachment') {
    if (!assetIds.includes(value)) throw new Error('Attachment id must use the seeded asset set.')
    state.addAttachment(value)
  } else if (objectType === 'persona') {
    const persona = PERSONAS.find((item) => item.id === value)
    if (!persona) throw new Error('Persona id must use a seeded persona.')
    state.attachPersona(persona)
  } else throw new Error('Use editor_set_content to update the prompt draft.')
  return stringResult(`${objectType} added; the visible editor and preview are updated.`)
}

function editorUpdate({ property, name, value }) {
  const state = useWorkbench.getState()
  if (property === 'prompt-text') state.setDraft(value)
  else if (property === 'variable-value') {
    if (!detectVariables(state.draft).includes(name)) throw new Error('Variable name must exist in the current prompt draft.')
    state.setBinding(name, value)
  } else if (property === 'model') {
    if (!modelIds.includes(value)) throw new Error('Model must be one of the six seeded model ids.')
    state.setModel(value)
  } else if (property === 'persona-id') {
    const persona = PERSONAS.find((item) => item.id === value)
    if (!persona) throw new Error('Persona id must use a seeded persona.')
    state.attachPersona(persona)
  } else throw new Error('Unsupported editor property.')
  return stringResult(`${property} updated; its visible postconditions are available in the workbench.`)
}

const tools = [
  {
    name: 'editor_select',
    description: 'Select a prompt-draft, variable, attachment, or persona in the structured prompt editor.',
    inputSchema: { type: 'object', properties: { objectType: { type: 'string', enum: objectTypes }, id: boundedString(80, 'Visible seeded id or variable name.') }, required: ['objectType'] },
    execute: ({ objectType, id }) => {
      if (objectType === 'persona' && id) editorAdd({ objectType, value: id })
      return stringResult(`${objectType}${id ? ` ${id}` : ''} selected in the visible workbench.`)
    },
  },
  {
    name: 'editor_add',
    description: 'Add a variable, seeded attachment, or seeded persona through the same structured editor commands as the visible UI.',
    inputSchema: { type: 'object', properties: { objectType: { type: 'string', enum: ['variable', 'attachment', 'persona'] }, value: boundedString(80, 'Variable name or seeded attachment/persona id.') }, required: ['objectType', 'value'] },
    execute: editorAdd,
  },
  {
    name: 'editor_delete',
    description: 'Delete a prompt draft, variable, attachment, or persona through the visible workbench domain command.',
    inputSchema: { type: 'object', properties: { objectType: { type: 'string', enum: objectTypes }, id: boundedString(80, 'Variable name or seeded attachment id when needed.') }, required: ['objectType'] },
    execute: editorDelete,
  },
  {
    name: 'editor_update_property',
    description: 'Update prompt-text, variable-value, model, or persona-id with bounded product values.',
    inputSchema: { type: 'object', properties: { property: { type: 'string', enum: ['prompt-text', 'variable-value', 'model', 'persona-id'] }, name: boundedString(64, 'Existing variable name for variable-value.'), value: boundedString(10000, 'New bounded property value.') }, required: ['property', 'value'] },
    execute: editorUpdate,
  },
  {
    name: 'editor_set_content',
    description: 'Set the full prompt draft content and refresh variables, token estimate, pricing, and live preview.',
    inputSchema: { type: 'object', properties: { content: boundedString(10000, 'Complete prompt text.') }, required: ['content'] },
    execute: ({ content }) => { useWorkbench.getState().setDraft(content); return stringResult('Prompt content set; the visible editor and derived panels are updated.') },
  },
  {
    name: 'editor_switch_mode',
    description: 'Switch the visible application mode between workbench and library without navigation.',
    inputSchema: { type: 'object', properties: { mode: { type: 'string', enum: ['workbench', 'library'] } }, required: ['mode'] },
    execute: ({ mode }) => { useWorkbench.getState().switchView(mode); return stringResult(`Visible mode switched to ${mode}.`) },
  },
  {
    name: 'editor_preview',
    description: 'Preview the current structured prompt with persona and variable bindings resolved.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
    execute: () => {
      const state = useWorkbench.getState()
      const body = resolvedPrompt(state.draft, state.bindings)
      return stringResult(`${state.activePersona ? `${state.activePersona.preface}\n\n` : ''}${body}`)
    },
  },
  {
    name: 'session_start',
    description: 'Start one simulated prompt run from current shared workbench state.',
    inputSchema: { type: 'object', properties: {} },
    execute: () => {
      const id = useWorkbench.getState().startRun()
      if (!id) throw new Error('Run did not start. Ensure the draft is non-empty, all variables are bound, and no run is streaming.')
      return stringResult('Run started. Incremental streaming remains visible and Playwright-observable.')
    },
  },
  {
    name: 'session_stop',
    description: 'Stop the currently streaming prompt run and freeze its visible response.',
    inputSchema: { type: 'object', properties: {} },
    execute: () => { useWorkbench.getState().stopRun(); return stringResult('Current run stopped and its visible response frozen.') },
  },
  {
    name: 'session_advance',
    description: 'Advance the current simulated run by one bounded streaming chunk.',
    inputSchema: { type: 'object', properties: {} },
    execute: () => {
      const state = useWorkbench.getState()
      if (!state.streamingRunId) throw new Error('No run is currently streaming.')
      state.advanceRun(state.streamingRunId)
      return stringResult('Run advanced by one chunk; observe the response panel for transient mechanics.')
    },
  },
  {
    name: 'entity_create',
    description: 'Create one API-shaped library-prompt record through the same domain command as Save.',
    inputSchema: {
      type: 'object',
      properties: {
        title: boundedString(80, 'Unique library prompt title.'),
        technique: { type: 'string', enum: TECHNIQUES },
        promptText: boundedString(10000, 'Prompt body.'),
        bindings: { type: 'object', additionalProperties: { type: 'string', maxLength: 10000 } },
        attachments: { type: 'array', items: { type: 'string', enum: assetIds }, maxItems: 5 },
        personaId: { type: 'string', enum: personaIds },
      },
      required: ['title', 'technique', 'promptText', 'bindings', 'attachments'],
    },
    execute: (input) => {
      const result = libraryPromptSchema.safeParse({ ...input, personaId: input.personaId || null })
      if (!result.success) throw new Error(result.error.issues[0].message)
      const record = useWorkbench.getState().saveLibrary(result.data)
      if (!record) throw new Error('Title must be unique among existing library prompts.')
      return stringResult(`Library prompt “${record.title}” created and visible in the library.`)
    },
  },
  {
    name: 'entity_select',
    description: 'Select and open one existing library-prompt record in the workbench.',
    inputSchema: { type: 'object', properties: { id: boundedString(80, 'Existing library-prompt id.') }, required: ['id'] },
    execute: ({ id }) => {
      if (!useWorkbench.getState().library.some((item) => item.id === id)) throw new Error('Library prompt id was not found.')
      useWorkbench.getState().loadLibrary(id)
      return stringResult('Library prompt selected and loaded into the visible workbench.')
    },
  },
  {
    name: 'entity_delete',
    description: 'Delete one library-prompt record. Explicit confirm=true is required.',
    inputSchema: { type: 'object', properties: { id: boundedString(80, 'Existing library-prompt id.'), confirm: { type: 'boolean' } }, required: ['id', 'confirm'] },
    execute: ({ id, confirm }) => {
      if (confirm !== true) throw new Error('Deleting a library prompt requires confirm=true.')
      if (!useWorkbench.getState().library.some((item) => item.id === id)) throw new Error('Library prompt id was not found.')
      useWorkbench.getState().deleteLibrary(id)
      return stringResult('Library prompt deleted; the visible library count decreased by one.')
    },
  },
  {
    name: 'artifact_export',
    description: 'Open the visible live-compiled artifact export flow for markdown or JSON.',
    inputSchema: { type: 'object', properties: { format: { type: 'string', enum: ['markdown', 'json'] } }, required: ['format'] },
    execute: ({ format }) => {
      const state = useWorkbench.getState()
      state.setChrome('exportFormat', format)
      state.setChrome('exportOpen', true)
      return stringResult(`${format} export preview opened visibly; use the visible Download control for file mechanics.`)
    },
  },
  {
    name: 'artifact_import',
    description: 'Open the visible JSON import form. Artifact content and file picker interaction remain in the UI.',
    inputSchema: { type: 'object', properties: { mode: { type: 'string', enum: ['json'] } }, required: ['mode'] },
    execute: () => { useWorkbench.getState().setChrome('importOpen', true); return stringResult('JSON import form opened visibly.') },
  },
  {
    name: 'artifact_copy',
    description: 'Copy the current live-compiled markdown or JSON artifact using the same package compiler as Export.',
    inputSchema: { type: 'object', properties: { format: { type: 'string', enum: ['markdown', 'json'] } }, required: ['format'] },
    execute: async ({ format }) => {
      const content = format === 'markdown' ? compileMarkdown() : JSON.stringify(compilePackage(), null, 2)
      await navigator.clipboard.writeText(content)
      useWorkbench.getState().addToast(`${format === 'markdown' ? 'Markdown' : 'JSON'} copied to clipboard`)
      return stringResult(`${format} artifact copied; clipboard contents are intentionally omitted from the tool result.`)
    },
  },
]

let registered = false

export function registerWebMCP() {
  window.webmcp_session_info = () => ({
    contract_version: 'zto-webmcp-v1',
    modules: [
      'structured-editor-v1',
      'command-session-v1',
      'entity-collection-v1',
      'artifact-transfer-v1'
    ],
    bindings: {
      editor_object_types: ['prompt-draft', 'variable', 'attachment', 'persona'],
      editor_properties: ['prompt-text', 'variable-name', 'variable-value', 'model', 'persona-id'],
      editor_operations: ['set_content', 'add', 'delete', 'update_property', 'select', 'preview', 'switch_mode'],
      editor_modes: ['workbench', 'library'],
      session_operations: ['start', 'stop', 'advance'],
      entity: ['library-prompt'],
      entity_operations: ['create', 'select', 'delete'],
      entity_fields: ['title', 'technique', 'prompt-text', 'bindings', 'attachments', 'persona'],
      artifact_operations: ['export', 'import', 'copy'],
      export_formats: ['markdown', 'json'],
      import_modes: ['json']
    }
  });

  window.webmcp_list_tools = () => tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));

  window.webmcp_invoke_tool = async (name, args) => {
    const tool = tools.find(t => t.name === name);
    if (!tool) throw new Error(`Tool ${name} not found`);
    return await tool.execute(args);
  };
}
