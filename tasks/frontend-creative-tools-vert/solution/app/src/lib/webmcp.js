// WebMCP surface for the VERT oracle. Every tool invokes the SAME store action
// the visible UI uses. No tool carries raw file bytes, blobs, or base64: the
// native file picker and the produced downloads remain Playwright's job. Files
// enter the queue either through the real picker/drop zone (Playwright) or via
// the bounded in-app sample entities (entity_create), never via file bytes in
// arguments.

import {
	store,
	addSample,
	selectFile,
	toggleSelection,
	setTarget,
	removeFile,
	convertAll,
	cancelConversion,
	download,
	compileSession,
	compileConversionReport
} from "./store.svelte.js";
import { TARGET_FORMATS } from "./formats.js";

const CONVERSION_MODES = [
	"png-to-jpeg", "png-to-webp",
	"jpeg-to-png", "jpeg-to-webp",
	"webp-to-png", "webp-to-jpeg",
	"gif-to-png", "bmp-to-png",
	"svg-to-png",
];

function fileByIndex(index) {
	if (typeof index !== "number") return null;
	return store.files[index] || null;
}

const TOOLS = [
	{
		name: "artifact_import",
		description:
			"Open the local file picker to add a file to the conversion queue. The actual file selection and bytes stay with the operator/Playwright.",
		parameters: { type: "object", properties: {}, additionalProperties: false },
		handler: () => {
			const el = document.querySelector('[data-file-input]');
			if (!el) return { ok: false, error: "file input not mounted" };
			el.click();
			return { ok: true, opened: true };
		},
	},
	{
		name: "artifact_convert",
		description:
			"Convert every ready file in the queue to its selected target format. Real in-browser image transcode.",
		parameters: {
			type: "object",
			properties: {},
			additionalProperties: false,
		},
		handler: async () => {
			await convertAll();
			return {
				ok: true,
				conversion_modes: CONVERSION_MODES,
				queue: store.files.map((f) => ({ name: f.name, from: f.from, to: f.to, status: f.status })),
			};
		},
	},
	{
		name: "artifact_export",
		description:
			"Download the converted result of a queued file by index, or export session-json or conversion-report.",
		parameters: {
			type: "object",
			properties: {
				index: { type: "number", minimum: 0 },
				format: { type: "string", enum: ["png", "jpeg", "jpg", "webp", "session-json", "conversion-report"] }
			},
			additionalProperties: false,
		},
		handler: ({ index, format }) => {
			if (format === "session-json") {
				return { ok: true, format, preview: compileSession() };
			}
			if (format === "conversion-report") {
				return { ok: true, format, preview: compileConversionReport() };
			}

			if (index !== undefined) {
				const f = fileByIndex(index);
				if (!f) return { ok: false, error: "no file at index" };
				if (f.status !== "done") return { ok: false, error: "file not converted yet" };
				const ok = download(f.id);
				return { ok, exported: ok ? f.resultName : null, export_formats: ["png", "jpeg", "jpg", "webp", "session-json", "conversion-report"] };
			}

			return { ok: false, error: "index required for file export" };
		},
	},
	{
		name: "artifact_copy",
		description: "Copy session JSON to clipboard.",
		parameters: {
			type: "object",
			properties: { format: { type: "string", enum: ["session-json"] } },
			required: ["format"],
			additionalProperties: false,
		},
		handler: async ({ format }) => {
			if (format === "session-json") {
				const doc = compileSession();
				if (!navigator.clipboard) return { ok: false, copied: false, error: "clipboard unavailable" };
				try {
					await navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
					return { ok: true, copied: true };
				} catch (error) {
					return { ok: false, copied: false, error: error?.message || "clipboard write failed" };
				}
			}
			return { ok: false };
		}
	},
	{
		name: "entity_create",
		description:
			"Add a bounded in-app sample image (png or svg) to the file queue as a convertible entity.",
		parameters: {
			type: "object",
			properties: { sample: { type: "string", enum: ["png", "svg"] } },
			required: ["sample"],
			additionalProperties: false,
		},
		handler: async ({ sample }) => {
			const id = await addSample(sample);
			const idx = store.files.findIndex((f) => f.id === id);
			return { ok: true, index: idx, name: store.files[idx]?.name };
		},
	},
	{
		name: "entity_select",
		description: "Select a queued file entity by its zero-based index.",
		parameters: {
			type: "object",
			properties: { index: { type: "number", minimum: 0 } },
			required: ["index"],
			additionalProperties: false,
		},
		handler: ({ index }) => {
			const f = fileByIndex(index);
			if (!f) return { ok: false, error: "no file at index" };
			selectFile(f.id);
			return { ok: true, selected: f.name };
		},
	},
	{
		name: "entity_toggle",
		description: "Toggle selection of a queued file entity by its zero-based index for batch operations.",
		parameters: {
			type: "object",
			properties: { index: { type: "number", minimum: 0 } },
			required: ["index"],
			additionalProperties: false,
		},
		handler: ({ index }) => {
			const f = fileByIndex(index);
			if (!f) return { ok: false, error: "no file at index" };
			toggleSelection(f.id);
			return { ok: true, toggled: f.name, selected: store.selection.has(f.id) };
		},
	},
	{
		name: "entity_update",
		description:
			"Change the target output format of a queued file entity. Bounded to the real target formats.",
		parameters: {
			type: "object",
			properties: {
				index: { type: "number", minimum: 0 },
				to: { type: "string", enum: ["png", "jpeg", "jpg", "webp"] },
			},
			required: ["index", "to"],
			additionalProperties: false,
		},
		handler: ({ index, to }) => {
			const f = fileByIndex(index);
			if (!f) return { ok: false, error: "no file at index" };
			const ok = setTarget(f.id, "." + to);
			return { ok, to: ok ? "." + to : f.to };
		},
	},
	{
		name: "entity_delete",
		description: "Remove a queued file entity by index. Requires confirm=true.",
		parameters: {
			type: "object",
			properties: {
				index: { type: "number", minimum: 0 },
				confirm: { type: "boolean" },
			},
			required: ["index", "confirm"],
			additionalProperties: false,
		},
		handler: ({ index, confirm }) => {
			if (confirm !== true) return { ok: false, error: "confirm=true required" };
			const f = fileByIndex(index);
			if (!f) return { ok: false, error: "no file at index" };
			const ok = removeFile(f.id);
			return { ok };
		},
	},
	{
		name: "session_start",
		description: "Start the conversion run for the current queue.",
		parameters: { type: "object", properties: {}, additionalProperties: false },
		handler: async () => {
			await convertAll();
			return { ok: true, converting: store.converting, done: store.files.filter((f) => f.status === "done").length };
		},
	},
	{
		name: "session_stop",
		description: "Cancel the in-progress conversion run.",
		parameters: { type: "object", properties: {}, additionalProperties: false },
		handler: () => {
			cancelConversion();
			return { ok: true };
		},
	},
];

export function installWebMCP() {
	const registry = new Map(TOOLS.map((t) => [t.name, t]));

	window.webmcp_session_info = () => ({
		contract_version: "zto-webmcp-v1",
		task: "frontend-vert",
		modules: ["artifact-transfer-v1", "entity-collection-v1", "command-session-v1"],
		tools: TOOLS.map((t) => t.name),
	});

	window.webmcp_list_tools = () =>
		TOOLS.map((t) => ({
			name: t.name,
			description: t.description,
			parameters: t.parameters,
		}));

	window.webmcp_invoke_tool = async (name, args = {}) => {
		const tool = registry.get(name);
		if (!tool) throw new Error(`Unknown tool: ${name}`);
		return await tool.handler(args || {});
	};

	// Optional navigator.modelContext registration.
	try {
		if (navigator.modelContext && typeof navigator.modelContext.registerTool === "function") {
			for (const t of TOOLS) {
				navigator.modelContext.registerTool({
					name: t.name,
					description: t.description,
					inputSchema: t.parameters,
					execute: async (a) => ({ content: [{ type: "text", text: JSON.stringify(await t.handler(a || {})) }] }),
				});
			}
		}
	} catch {
		/* optional */
	}
}
