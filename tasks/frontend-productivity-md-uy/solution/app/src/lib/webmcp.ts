// Exact zto-webmcp-v1 surface for md.uy. Every handler routes through the same
// product command as the visible editor or artifact control.

export interface WebmcpApi {
	setContent: (content: string) => void;
	switchMode: (mode: 'edit' | 'preview' | 'presentation') => void;
	showPreview: () => string;
	exportMarkdown: () => string;
	copyMarkdown: () => Promise<string> | string;
	getState: () => Record<string, unknown>;
}

type Schema = Record<string, unknown>;
type Handler = (args: Record<string, unknown>) => unknown;
interface ToolDef {
	name: string;
	description: string;
	inputSchema: Schema;
	handler: Handler;
}

const objectSchema = (properties: Record<string, unknown> = {}, required: string[] = []): Schema => ({
	type: 'object',
	additionalProperties: false,
	...(required.length ? { required } : {}),
	properties
});

function validateInput(schema: Schema, input: Record<string, unknown>): string {
	if (!input || typeof input !== 'object' || Array.isArray(input)) return 'arguments must be an object';
	const properties = (schema.properties ?? {}) as Record<string, Record<string, unknown>>;
	const unknown = Object.keys(input).find((key) => !(key in properties));
	if (unknown) return `unknown argument: ${unknown}`;
	const missing = ((schema.required ?? []) as string[]).find((key) => input[key] === undefined);
	if (missing) return `missing required argument: ${missing}`;
	for (const [key, rule] of Object.entries(properties)) {
		const value = input[key];
		if (value === undefined) continue;
		if (rule.type === 'string' && typeof value !== 'string') return `${key} must be a string`;
		if (rule.maxLength && typeof value === 'string' && value.length > Number(rule.maxLength)) return `${key} is too long`;
		if (rule.enum && !(rule.enum as unknown[]).includes(value)) return `${key} is outside the declared enum`;
	}
	return '';
}

export function installWebmcp(api: WebmcpApi) {
	const modes = ['edit', 'preview', 'presentation'];
	const tools: ToolDef[] = [
		{
			name: 'editor.set_content',
			description: 'Set bounded textual content on an object.',
			inputSchema: objectSchema({ id: { type: 'string', maxLength: 128 }, content: { type: 'string', maxLength: 200 } }, ['id', 'content']),
			handler: ({ id, content }) => {
				if (id !== 'markdown-document') return { ok: false, error: 'id must be markdown-document' };
				api.setContent(String(content));
				return { ok: true, id, sourceLength: api.getState().sourceLength };
			}
		},
		{
			name: 'editor.switch_mode',
			description: 'Switch to a declared editor mode.',
			inputSchema: objectSchema({ mode: { type: 'string', enum: modes } }, ['mode']),
			handler: ({ mode }) => {
				api.switchMode(mode as 'edit' | 'preview' | 'presentation');
				return { ok: true, mode };
			}
		},
		{
			name: 'editor.preview',
			description: 'Run or refresh the declared preview.',
			inputSchema: objectSchema(),
			handler: () => {
				api.showPreview();
				return { ok: true, mode: 'preview' };
			}
		},
		{
			name: 'artifact.export',
			description: 'Export using a declared format (no blob/base64 in results).',
			inputSchema: objectSchema({ format: { type: 'string', enum: ['markdown'] } }, ['format']),
			handler: ({ format }) => {
				api.exportMarkdown();
				return { ok: true, format, export_started: true };
			}
		},
		{
			name: 'artifact.copy',
			description: 'Trigger copy via the visible control (clipboard verified in Playwright).',
			inputSchema: objectSchema(),
			handler: async () => {
				await api.copyMarkdown();
				return { ok: true, copy_triggered: true };
			}
		}
	];

	const listTools = () => tools.map(({ handler: _handler, ...tool }) => tool);
	const w = window as unknown as Record<string, unknown>;
	w.webmcp_session_info = () => ({
		contract_version: 'zto-webmcp-v1',
		app: 'md.uy',
		modules: ['structured-editor-v1', 'artifact-transfer-v1'],
		tool_names: tools.map((tool) => tool.name),
		tool_count: tools.length,
		state: api.getState()
	});
	w.webmcp_list_tools = () => listTools();
	w.webmcp_invoke_tool = async (name: string, args: Record<string, unknown> = {}) => {
		const tool = tools.find((candidate) => candidate.name === name);
		if (!tool) return { ok: false, error: `unknown_tool: ${name}` };
		const error = validateInput(tool.inputSchema, args);
		if (error) return { ok: false, error };
		try {
			return await tool.handler(args);
		} catch (cause) {
			return { ok: false, error: String((cause as Error)?.message ?? cause) };
		}
	};

	try {
		const context = (navigator as unknown as { modelContext?: { registerTool?: (tool: Record<string, unknown>) => void } }).modelContext;
		if (context?.registerTool) {
			tools.forEach((tool) => context.registerTool?.({
				name: tool.name,
				description: tool.description,
				inputSchema: tool.inputSchema,
				invoke: (args: Record<string, unknown>) =>
					(w.webmcp_invoke_tool as (name: string, args: Record<string, unknown>) => unknown)(tool.name, args ?? {})
			}));
		}
	} catch {
		// The window self-test surface remains available when native WebMCP is absent.
	}
}
