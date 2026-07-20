import { CATEGORIES, CONVERTIBLE_INPUTS, TARGET_FORMATS, extOf } from "./formats.js";
import { convertImage } from "./convert.js";
import { makeSample } from "./samples.js";
import { ConversionSessionDocument } from "./schemas.js";

const LS_KEY = "vert.state.v1";
const STATUS_LABELS = {
	ready: "Ready",
	converting: "Converting",
	done: "Done",
	failed: "Failed",
	unsupported: "Unsupported",
};
const STATUS_VALUES = Object.fromEntries(
	Object.entries(STATUS_LABELS).map(([value, label]) => [label, value]),
);

const withoutDot = (format) => String(format || "").replace(/^\./, "");
const withDot = (format) => {
	const value = withoutDot(format);
	return value ? `.${value}` : "";
};

let _id = 0;
const nextId = () => `f${++_id}`;

function load() {
	try {
		const raw = localStorage.getItem(LS_KEY);
		if (!raw) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

const saved = load();

// ---- reactive store ---------------------------------------------------------
export const store = $state({
	theme: saved?.theme === "dark" ? "dark" : "light",
	view: "home", // home | settings | about | privacy
	category: saved?.category && CATEGORIES.some((c) => c.id === saved.category)
		? saved.category
		: "images",
	quality: typeof saved?.quality === "number" ? saved.quality : 100,
	keepMetadata: saved?.keepMetadata ?? true,
	defaultTarget: saved?.defaultTarget ?? ".png",
	presets: Array.isArray(saved?.presets) ? saved.presets : [
		{ id: "p1", name: "Web optimized", quality: 75, target: ".webp", keepMetadata: false },
		{ id: "p2", name: "High quality photo", quality: 95, target: ".jpeg", keepMetadata: true },
		{ id: "p3", name: "Lossless original", quality: 100, target: ".png", keepMetadata: true },
	],
	// queue is in-memory only
	files: [],
	selectedId: null,
	selection: new Set(),
	converting: false,
	history: { undo: [], redo: [] },
});

export function persist() {
	try {
		localStorage.setItem(
			LS_KEY,
			JSON.stringify({
				theme: store.theme,
				category: store.category,
				quality: store.quality,
				keepMetadata: store.keepMetadata,
				defaultTarget: store.defaultTarget,
				presets: $state.snapshot(store.presets),
			}),
		);
	} catch {
		/* ignore */
	}
}

// apply theme to <html> for CSS
export function applyTheme() {
	document.documentElement.dataset.theme = store.theme;
}

// ---- derived helpers --------------------------------------------------------
export function activeCategory() {
	return CATEGORIES.find((c) => c.id === store.category) || CATEGORIES[0];
}

export function targetsFor() {
	return TARGET_FORMATS;
}

// ---- state history for undo/redo ----
// Snapshots capture everything an action can mutate -- including selection,
// which the checkbox UI depends on -- so Undo restores the exact prior state
// rather than an approximation of it.
const takeSnapshot = () => ({
	files: store.files.map(f => ({...$state.snapshot(f), file: f.file})),
	presets: $state.snapshot(store.presets),
	selection: Array.from(store.selection),
	selectedId: store.selectedId,
	settings: {
		theme: store.theme,
		category: store.category,
		quality: store.quality,
		keepMetadata: store.keepMetadata,
		defaultTarget: store.defaultTarget,
	},
});

// ---- blob URL lifetime -------------------------------------------------
// Object URLs referenced by undo/redo snapshots must stay alive until no
// snapshot (or the live queue) can reach them any more -- revoking one the
// moment a mutation drops it from the live file would permanently break any
// snapshot that still points at the same URL string, so Undo would restore a
// "Done" row whose Download silently fails.
function urlsInSnapshot(snapshot) {
	const set = new Set();
	for (const f of snapshot.files) if (f.resultUrl) set.add(f.resultUrl);
	return set;
}

function reachableResultUrls() {
	const set = new Set();
	for (const f of store.files) if (f.resultUrl) set.add(f.resultUrl);
	for (const snap of store.history.undo) for (const url of urlsInSnapshot(snap)) set.add(url);
	for (const snap of store.history.redo) for (const url of urlsInSnapshot(snap)) set.add(url);
	return set;
}

// Call AFTER the live reference to `url` has already been cleared/replaced.
// Only actually revokes once nothing else (current queue or any undo/redo
// snapshot) still needs it.
function releaseResultUrl(url) {
	if (!url) return;
	if (!reachableResultUrls().has(url)) URL.revokeObjectURL(url);
}

export function saveQueueSnapshot() {
	store.history.undo.push(takeSnapshot());
	const discarded = [];
	if (store.history.undo.length > 50) discarded.push(store.history.undo.shift());
	if (store.history.redo.length > 0) discarded.push(...store.history.redo);
	store.history.redo = [];
	for (const snap of discarded) {
		for (const url of urlsInSnapshot(snap)) releaseResultUrl(url);
	}
}

function restoreSnapshot(snap) {
	// The state being replaced was already pushed onto the opposite history
	// stack (redo on undo, undo on redo) by the caller, so nothing reachable
	// from here needs revoking -- it's still retained by that entry.
	store.files = snap.files.map(f => ({...f}));
	store.presets = snap.presets.map(preset => ({...preset}));
	Object.assign(store, snap.settings);
	applyTheme();
	persist();

	const validIds = new Set(store.files.map(f => f.id));
	store.selection = new Set(snap.selection.filter((id) => validIds.has(id)));
	store.selectedId = snap.selectedId && validIds.has(snap.selectedId) ? snap.selectedId : null;
}

export function queueUndo() {
	if (store.history.undo.length === 0) return;
	store.history.redo.push(takeSnapshot());
	const prev = store.history.undo.pop();
	restoreSnapshot(prev);
}

export function queueRedo() {
	if (store.history.redo.length === 0) return;
	store.history.undo.push(takeSnapshot());
	const next = store.history.redo.pop();
	restoreSnapshot(next);
}

// ---- selection ----
export function toggleSelection(id) {
	if (store.selection.has(id)) {
		store.selection.delete(id);
	} else {
		store.selection.add(id);
	}
	store.selection = new Set(store.selection);
}

export function selectAll() {
	if (store.selection.size === store.files.length && store.files.length > 0) {
		store.selection.clear();
	} else {
		for (const f of store.files) store.selection.add(f.id);
	}
	store.selection = new Set(store.selection);
}


// ---- actions (the SINGLE code path shared by UI + WebMCP) --------------------
export function setTheme(next) {
	store.theme = next === "dark" ? "dark" : "light";
	applyTheme();
	persist();
}

export function toggleTheme() {
	setTheme(store.theme === "dark" ? "light" : "dark");
}

export function setView(v) {
	if (["home", "settings", "about", "privacy"].includes(v)) store.view = v;
}

export function setCategory(id) {
	if (CATEGORIES.some((c) => c.id === id)) {
		store.category = id;
		persist();
	}
}

export function setSettings(data, { invalidateResults = true } = {}) {
	const quality = Math.max(1, Math.min(100, Math.round(data.quality)));
	const keepMetadata = !!data.keepMetadata;
	const target = withDot(data.defaultTarget);
	const defaultTarget = TARGET_FORMATS.includes(target) ? target : store.defaultTarget;
	const theme = data.theme === "light" || data.theme === "dark" ? data.theme : store.theme;
	const settingsChanged = store.quality !== quality || store.keepMetadata !== keepMetadata || store.defaultTarget !== defaultTarget || store.theme !== theme;
	if (invalidateResults) saveQueueSnapshot();
	store.quality = quality;
	store.keepMetadata = keepMetadata;
	if (TARGET_FORMATS.includes(target)) {
		store.defaultTarget = target;
	}
	if (data.theme === "light" || data.theme === "dark") {
		store.theme = data.theme;
		applyTheme();
	}
	const resultsChanged = invalidateResults ? invalidateDoneFiles(false) : false;
	if (invalidateResults && !settingsChanged && !resultsChanged) store.history.undo.pop();
	persist();
}

export function setQuality(q) {
	store.quality = Math.max(1, Math.min(100, Math.round(q)));
	invalidateDoneFiles();
	persist();
}

export function setKeepMetadata(v) {
	store.keepMetadata = !!v;
	invalidateDoneFiles();
	persist();
}

export function setDefaultTarget(v) {
	if (TARGET_FORMATS.includes(v)) {
		store.defaultTarget = v;
		persist();
	}
}

function invalidateDoneFiles(recordHistory = true) {
	if (recordHistory) saveQueueSnapshot();
	let changed = false;
	for (const f of store.files) {
		if (f.status === "done" || f.status === "failed") {
			if (f.resultUrl) {
				const oldUrl = f.resultUrl;
				f.resultUrl = null;
				f.resultName = null;
				f.resultSize = null;
				releaseResultUrl(oldUrl);
			}
			f.status = "ready";
			changed = true;
		}
	}
	if (recordHistory && !changed) {
		store.history.undo.pop();
	}
	return changed;
}

// presets
export function savePreset(name, quality, target, keepMetadata) {
	saveQueueSnapshot();
	const normalizedTarget = withDot(target);
	const p = {
		id: `p_${Date.now()}`,
		name,
		quality,
		target: TARGET_FORMATS.includes(normalizedTarget) ? normalizedTarget : store.defaultTarget,
		keepMetadata
	};
	store.presets.push(p);
	persist();
}

export function loadPreset(id) {
	const p = store.presets.find(x => x.id === id);
	if (!p) return;
	const settingsChanged = store.quality !== p.quality || store.keepMetadata !== p.keepMetadata;
	const outputSettingsChanged = store.quality !== p.quality || store.keepMetadata !== p.keepMetadata;
	const selected = store.selection.size > 0;
	saveQueueSnapshot();
	setSettings({
		quality: p.quality,
		keepMetadata: p.keepMetadata
	}, { invalidateResults: false });

	let changed = false;
	for (const file of store.files) {
		const shouldApply = selected ? store.selection.has(file.id) : file.status === "ready";
		const targetChanged = shouldApply && file.status !== "unsupported" && file.to !== p.target;
		const staleOutput = outputSettingsChanged && (file.status === "done" || file.status === "failed");
		if (targetChanged) file.to = p.target;
		if (targetChanged || staleOutput) {
			const oldUrl = file.resultUrl;
			file.resultUrl = null;
			file.resultName = null;
			file.resultSize = null;
			releaseResultUrl(oldUrl);
			if (file.status === "done" || file.status === "failed") file.status = "ready";
			changed = true;
		}
	}
	if (!changed && !settingsChanged) store.history.undo.pop();
}

export function deletePreset(id) {
	if (!store.presets.some((preset) => preset.id === id)) return;
	saveQueueSnapshot();
	store.presets = store.presets.filter(x => x.id !== id);
	persist();
}


function statusForInput(ext) {
	return CONVERTIBLE_INPUTS.includes(ext) ? "ready" : "unsupported";
}

function targetFor(ext) {
	if (store.defaultTarget !== ext) return store.defaultTarget;
	if (ext === ".png") return ".jpeg";
	if (ext === ".jpeg" || ext === ".jpg") return ".png";
	if (ext === ".webp") return ".png";
	return ".png";
}

export function addFile(file) {
	const ext = extOf(file.name);
	const convertible = CONVERTIBLE_INPUTS.includes(ext);
	const entry = {
		id: nextId(),
		name: file.name,
		from: ext,
		to: convertible ? targetFor(ext) : null,
		size: file.size,
		status: statusForInput(ext),
		error: convertible ? null : "Unsupported input format",
		resultUrl: null,
		resultName: null,
		resultSize: null,
		file,
	};

	store.files.push(entry);
	store.selectedId = entry.id;
	return entry.id;
}

export function addFiles(fileList) {
	saveQueueSnapshot();
	const ids = [];
	for (const f of fileList) ids.push(addFile(f));
	return ids;
}

export async function addSample(kind) {
	saveQueueSnapshot();
	const file = await makeSample(kind === "svg" ? "svg" : "png");
	return addFile(file);
}

export function selectFile(id) {
	if (store.files.some((f) => f.id === id)) store.selectedId = id;
}

export function setTarget(id, to) {
	const f = store.files.find((x) => x.id === id);
	if (!f) return false;
	if (!TARGET_FORMATS.includes(to)) return false;
	if (f.status === "unsupported") return false;

	saveQueueSnapshot();
	f.to = to;
	if (f.resultUrl) {
		const oldUrl = f.resultUrl;
		f.resultUrl = null;
		f.resultName = null;
		f.resultSize = null;
		releaseResultUrl(oldUrl);
	}
	if (f.status === "done" || f.status === "failed") f.status = "ready";
	return true;
}

export function batchSetTarget(to) {
	if (!TARGET_FORMATS.includes(to)) return false;
	saveQueueSnapshot();
	let changed = false;
	for (const id of store.selection) {
		const f = store.files.find(x => x.id === id);
		if (f && f.status !== "unsupported" && f.to !== to) {
			f.to = to;
			if (f.resultUrl) {
				const oldUrl = f.resultUrl;
				f.resultUrl = null;
				f.resultName = null;
				f.resultSize = null;
				releaseResultUrl(oldUrl);
			}
			if (f.status === "done" || f.status === "failed") f.status = "ready";
			changed = true;
		}
	}
	if (!changed) store.history.undo.pop();
	return changed;
}

export function removeFile(id) {
	saveQueueSnapshot();
	const i = store.files.findIndex((f) => f.id === id);
	if (i === -1) {
		store.history.undo.pop();
		return false;
	}
	const [f] = store.files.splice(i, 1);
	releaseResultUrl(f?.resultUrl);

	store.selection.delete(id);
	store.selection = new Set(store.selection);

	if (store.selectedId === id) store.selectedId = store.files[0]?.id ?? null;
	return true;
}

export function removeSelectedFiles() {
	saveQueueSnapshot();
	const toRemove = new Set(store.selection);
	let removed = false;
	for (let i = store.files.length - 1; i >= 0; i--) {
		const f = store.files[i];
		if (toRemove.has(f.id)) {
			const oldUrl = f.resultUrl;
			store.files.splice(i, 1);
			releaseResultUrl(oldUrl);
			removed = true;
		}
	}
	if (removed) {
		store.selection.clear();
		store.selection = new Set(store.selection);
		if (toRemove.has(store.selectedId)) store.selectedId = store.files[0]?.id ?? null;
	} else {
		store.history.undo.pop();
	}
	return removed;
}

export function clearQueue() {
	if (store.files.length === 0) return;
	saveQueueSnapshot();
	const oldUrls = store.files.map((f) => f.resultUrl).filter(Boolean);
	store.files = [];
	store.selectedId = null;
	store.selection.clear();
	store.selection = new Set();
	for (const url of oldUrls) releaseResultUrl(url);
}

let _cancel = false;

export async function convertOne(entry) {
	if (entry.status === "unsupported" || !entry.to) return;
	entry.status = "converting";
	entry.error = null;
	try {
		const { blob, name } = await convertImage(entry.file, entry.to, store.quality);
		if (_cancel) {
			entry.status = "ready";
			return;
		}
		if (entry.resultUrl) {
			const oldUrl = entry.resultUrl;
			entry.resultUrl = null;
			releaseResultUrl(oldUrl);
		}
		entry.resultUrl = URL.createObjectURL(blob);
		entry.resultName = name;
		entry.resultSize = blob.size;
		entry.status = "done";
	} catch (err) {
		entry.status = "failed";
		entry.error = (err && err.message) || "Conversion failed";
	}
}

export async function convertAll() {
	if (store.converting) return;
	const pending = store.files.filter(
		(f) => f.status === "ready" || f.status === "failed",
	);
	if (pending.length === 0) return;
	_cancel = false;
	store.converting = true;
	try {
		for (const f of pending) {
			if (_cancel) break;
			await convertOne(f);
		}
	} finally {
		store.converting = false;
	}
}

export function cancelConversion() {
	_cancel = true;
	store.converting = false;
	for (const f of store.files) if (f.status === "converting") f.status = "ready";
}

export function download(id) {
	const f = store.files.find((x) => x.id === id);
	if (!f || !f.resultUrl) return false;
	const a = document.createElement("a");
	a.href = f.resultUrl;
	a.download = f.resultName;
	document.body.appendChild(a);
	a.click();
	a.remove();
	return true;
}

export function downloadAllDone() {
	const selected = store.selection.size > 0;
	const completed = store.files.filter((file) =>
		file.status === "done" && (!selected || store.selection.has(file.id))
	);
	for (const file of completed) download(file.id);
	return completed.length;
}

export function counts() {
	const c = { total: store.files.length, ready: 0, done: 0, failed: 0, converting: 0 };
	for (const f of store.files) {
		if (f.status === "ready") c.ready++;
		else if (f.status === "done") c.done++;
		else if (f.status === "failed") c.failed++;
		else if (f.status === "converting") c.converting++;
	}
	return c;
}

export function compileSession() {
	return {
		schemaVersion: "vert-session-v1",
		quality: store.quality,
		keepMetadata: store.keepMetadata,
		theme: store.theme,
		activeCategory: activeCategory().label,
		defaultTarget: withoutDot(store.defaultTarget),
		presets: $state.snapshot(store.presets).map(preset => ({
			name: preset.name,
			target: withoutDot(preset.target),
			quality: preset.quality,
		})),
		files: $state.snapshot(store.files)
			.filter(f => CONVERTIBLE_INPUTS.includes(withDot(f.from)))
			.map(f => ({
				name: f.name,
				from: withoutDot(f.from),
				to: withoutDot(f.to),
				status: STATUS_LABELS[f.status],
				selected: store.selection.has(f.id),
				inputSize: f.size,
				outputSize: f.status === "done" ? (f.resultSize ?? 0) : null,
			})),
		exportedAt: new Date().toISOString(),
	};
}

export function compileConversionReport() {
	const session = compileSession();
	const lines = [
		"# VERT conversion report",
		"",
		`Generated: ${session.exportedAt}`,
		"",
		"## Settings",
		`- Quality: ${session.quality}`,
		`- Keep metadata: ${session.keepMetadata ? "Yes" : "No"}`,
		`- Theme: ${session.theme}`,
		`- Active category: ${session.activeCategory}`,
		`- Default target: ${session.defaultTarget}`,
		"",
		"## Presets",
	];
	if (session.presets.length === 0) lines.push("- None");
	for (const preset of session.presets) {
		lines.push(`- ${preset.name}: ${preset.target}, quality ${preset.quality}`);
	}
	lines.push("", "## Queued files");
	if (session.files.length === 0) lines.push("- No files queued");
	for (const file of session.files) {
		const output = file.outputSize == null ? "not produced" : `${file.outputSize} bytes`;
		lines.push(`- ${file.name}: ${file.from} → ${file.to}; ${file.status}; input ${file.inputSize} bytes; output ${output}`);
	}
	return lines.join("\n");
}

export function importSession(doc) {
	const res = ConversionSessionDocument.safeParse(doc);
	if (!res.success) {
		const error = res.error.issues
			.map(issue => `${issue.path.length ? issue.path.join(".") : "import"}: ${issue.message}`)
			.join("; ");
		return { ok: false, error };
	}
	const valid = res.data;
	saveQueueSnapshot();

	setSettings({
		quality: valid.quality,
		keepMetadata: valid.keepMetadata,
		defaultTarget: valid.defaultTarget,
		theme: valid.theme,
	}, { invalidateResults: false });
	const category = CATEGORIES.find(item => item.label === valid.activeCategory);
	if (category) setCategory(category.id);
	store.presets = valid.presets.map((preset, index) => ({
		id: `imported_${Date.now()}_${index}`,
		name: preset.name,
		quality: preset.quality,
		target: withDot(preset.target),
		keepMetadata: valid.keepMetadata,
	}));
	persist();

	if (valid.files.length > 0) {
		const nextSelection = new Set(store.selection);
		for (const importedFile of valid.files) {
			const file = store.files.find(f => f.name === importedFile.name && withoutDot(f.from) === importedFile.from);
			const target = withDot(importedFile.to);
			if (!file) continue;

			const oldUrl = file.resultUrl;
			file.resultUrl = null;
			releaseResultUrl(oldUrl);
			file.resultName = null;
			file.to = target;
			file.status = importedFile.status === "Done" ? "ready" : STATUS_VALUES[importedFile.status];
			file.resultSize = null;
			file.error = importedFile.status === "Failed"
				? "Imported failed conversion"
				: importedFile.status === "Unsupported" ? "Unsupported input format" : null;
			if (importedFile.selected) nextSelection.add(file.id);
			else nextSelection.delete(file.id);
		}
		store.selection = nextSelection;
	}
	return { ok: true };
}
