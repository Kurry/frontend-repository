import { CATEGORIES, CONVERTIBLE_INPUTS, TARGET_FORMATS, extOf } from "./formats.js";
import { convertImage } from "./convert.js";
import { makeSample } from "./samples.js";
import { ConversionSessionDocument } from "./schemas.js";

const LS_KEY = "vert.state.v1";

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
const takeSnapshot = () => store.files.map(f => ({...$state.snapshot(f), file: f.file}));

export function saveQueueSnapshot() {
	store.history.undo.push(takeSnapshot());
	if (store.history.undo.length > 50) store.history.undo.shift();
	store.history.redo = [];
}

function restoreSnapshot(snap) {
	const oldUrls = new Set(store.files.map(f => f.resultUrl).filter(Boolean));
	const newUrls = new Set(snap.map(f => f.resultUrl).filter(Boolean));
	for (const url of oldUrls) {
		if (!newUrls.has(url)) URL.revokeObjectURL(url);
	}

	store.files = snap.map(f => ({...f}));

	const validIds = new Set(store.files.map(f => f.id));
	const newSelection = new Set();
	for (const id of store.selection) {
		if (validIds.has(id)) newSelection.add(id);
	}
	store.selection = newSelection;
	if (store.selectedId && !validIds.has(store.selectedId)) store.selectedId = null;
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

export function setSettings(data) {
	store.quality = Math.max(1, Math.min(100, Math.round(data.quality)));
	store.keepMetadata = !!data.keepMetadata;
	if (TARGET_FORMATS.includes(data.defaultTarget)) {
		store.defaultTarget = data.defaultTarget;
	}
	invalidateDoneFiles();
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

function invalidateDoneFiles() {
	saveQueueSnapshot();
	let changed = false;
	for (const f of store.files) {
		if (f.status === "done" || f.status === "failed") {
			if (f.resultUrl) {
				URL.revokeObjectURL(f.resultUrl);
				f.resultUrl = null;
				f.resultName = null;
				f.resultSize = null;
			}
			f.status = "ready";
			changed = true;
		}
	}
	if (!changed) {
		store.history.undo.pop();
	}
}

// presets
export function savePreset(name, quality, target, keepMetadata) {
	const p = {
		id: `p_${Date.now()}`,
		name,
		quality,
		target,
		keepMetadata
	};
	store.presets.push(p);
	persist();
}

export function loadPreset(id) {
	const p = store.presets.find(x => x.id === id);
	if (!p) return;
	setSettings({
		quality: p.quality,
		defaultTarget: p.target,
		keepMetadata: p.keepMetadata
	});
}

export function deletePreset(id) {
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
		URL.revokeObjectURL(f.resultUrl);
		f.resultUrl = null;
		f.resultName = null;
		f.resultSize = null;
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
				URL.revokeObjectURL(f.resultUrl);
				f.resultUrl = null;
				f.resultName = null;
				f.resultSize = null;
			}
			if (f.status === "done" || f.status === "failed") f.status = "ready";
			changed = true;
		}
	}
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
	if (f?.resultUrl) URL.revokeObjectURL(f.resultUrl);

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
			if (f.resultUrl) URL.revokeObjectURL(f.resultUrl);
			store.files.splice(i, 1);
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
	for (const f of store.files) if (f.resultUrl) URL.revokeObjectURL(f.resultUrl);
	store.files = [];
	store.selectedId = null;
	store.selection.clear();
	store.selection = new Set();
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
		if (entry.resultUrl) URL.revokeObjectURL(entry.resultUrl);
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
		settings: {
			quality: store.quality,
			keepMetadata: store.keepMetadata,
			defaultTarget: store.defaultTarget,
		},
		presets: $state.snapshot(store.presets),
		queue: $state.snapshot(store.files).map(f => ({
			name: f.name,
			from: f.from,
			to: f.to,
			status: f.status
		})),
	};
}

export function importSession(doc) {
	const res = ConversionSessionDocument.safeParse(doc);
	if (!res.success) return false;
	const valid = res.data;

	setSettings(valid.settings);
	store.presets = valid.presets;
	persist();

	if (valid.queue && valid.queue.length > 0) {
		saveQueueSnapshot();
		for (const qf of valid.queue) {
			const file = store.files.find(f => f.name === qf.name && f.from === qf.from && f.status !== 'unsupported');
			if (file && file.to !== qf.to) {
				file.to = qf.to;
				if (file.resultUrl) {
					URL.revokeObjectURL(file.resultUrl);
					file.resultUrl = null;
					file.resultName = null;
					file.resultSize = null;
				}
				if (file.status === "done" || file.status === "failed") file.status = "ready";
			}
		}
	}
	return true;
}