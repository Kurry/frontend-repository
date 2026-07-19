// WebMCP action surface (contract zto-webmcp-v1).
// Modules: structured-editor-v1, artifact-transfer-v1.
// Every tool routes through the same domain handlers the visible UI uses.

export interface WebmcpApi {
	setContent: (content: string) => void;
	switchMode: (mode: 'edit' | 'preview' | 'presentation') => void;
	showPreview: () => string;
	exportMarkdown: () => string;
	copyMarkdown: () => Promise<string> | string;
	getState: () => Record<string, unknown>;
}

interface ToolDef {
	name: string;
	module: string;
	description: string;
	parameters: Record<string, unknown>;
	handler: (args: Record<string, unknown>) => unknown;
}

export function installWebmcp(api: WebmcpApi) {
	const modules = ['structured-editor-v1', 'artifact-transfer-v1'];

	const bindings = {
		editor_object_types: ['markdown-document'],
		editor_modes: ['edit', 'preview', 'presentation'],
		artifact_operations: ['export', 'copy'],
		export_formats: ['markdown']
	};

	const tools: ToolDef[] = [
		{
			name: 'editor_set_content',
			module: 'structured-editor-v1',
			description:
				'Replace the Markdown source of the current document. The source pane and rendered preview both update from the same shared document.',
			parameters: {
				type: 'object',
				properties: { content: { type: 'string', description: 'New Markdown source text.' } },
				required: ['content']
			},
			handler: (args) => {
				const content = String(args.content ?? '');
				api.setContent(content);
				return { ok: true, length: content.length };
			}
		},
		{
			name: 'editor_switch_mode',
			module: 'structured-editor-v1',
			description: 'Switch the editor between edit, preview and presentation modes.',
			parameters: {
				type: 'object',
				properties: {
					mode: { type: 'string', enum: ['edit', 'preview', 'presentation'] }
				},
				required: ['mode']
			},
			handler: (args) => {
				const mode = args.mode as 'edit' | 'preview' | 'presentation';
				if (!['edit', 'preview', 'presentation'].includes(mode)) {
					throw new Error('mode must be one of edit, preview, presentation');
				}
				api.switchMode(mode);
				return { ok: true, mode };
			}
		},
		{
			name: 'editor_preview',
			module: 'structured-editor-v1',
			description: 'Switch to preview mode and return the current rendered Markdown as HTML.',
			parameters: { type: 'object', properties: {} },
			handler: () => {
				const html = api.showPreview();
				return { ok: true, html };
			}
		},
		{
			name: 'artifact_export',
			module: 'artifact-transfer-v1',
			description: 'Export the current document as a Markdown (.md) file, the same as the Download control.',
			parameters: {
				type: 'object',
				properties: { format: { type: 'string', enum: ['markdown'] } }
			},
			handler: (args) => {
				const format = (args.format as string) ?? 'markdown';
				if (format !== 'markdown') throw new Error('only markdown export is supported');
				const length = api.exportMarkdown().length;
				return { ok: true, format: 'markdown', length };
			}
		},
		{
			name: 'artifact_copy',
			module: 'artifact-transfer-v1',
			description: 'Copy the current Markdown source to the clipboard, the same as the Copy control.',
			parameters: { type: 'object', properties: {} },
			handler: async () => {
				const length = String(await api.copyMarkdown()).length;
				return { ok: true, length };
			}
		}
	];

	const listTools = () =>
		tools.map((t) => ({
			name: t.name,
			module: t.module,
			description: t.description,
			parameters: t.parameters
		}));

	const w = window as unknown as Record<string, unknown>;

	w.webmcp_session_info = () => ({
		contract_version: 'zto-webmcp-v1',
		app: 'md.uy',
		modules,
		bindings,
		tools: tools.map((t) => t.name),
		state: api.getState()
	});

	w.webmcp_list_tools = () => listTools();

	w.webmcp_invoke_tool = async (name: string, args: Record<string, unknown> = {}) => {
		const tool = tools.find((t) => t.name === name);
		if (!tool) throw new Error(`Unknown tool: ${name}`);
		return await tool.handler(args ?? {});
	};

	// Optional additional registration surface.
	try {
		const nav = navigator as unknown as { modelContext?: Record<string, unknown> };
		nav.modelContext = {
			contractVersion: 'zto-webmcp-v1',
			listTools,
			callTool: (name: string, args: Record<string, unknown> = {}) =>
				(w.webmcp_invoke_tool as (n: string, a: Record<string, unknown>) => unknown)(name, args)
		};
	} catch {
		// navigator not writable in some environments; window surface is authoritative.
	}
}
