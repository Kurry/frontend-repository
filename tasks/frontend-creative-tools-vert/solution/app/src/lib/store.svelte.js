import { CATEGORIES, CONVERTIBLE_INPUTS, TARGET_FORMATS, extOf } from "./formats.js";
import { convertImage } from "./convert.js";
import { makeSample } from "./samples.js";

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
	// queue is in-memory only: real File/Blob objects cannot be rehydrated, so a
	// reload legitimately restores an empty queue (no phantom rows).
	files: [],
	selectedId: null,
	converting: false,
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

export function setQuality(q) {
	store.quality = Math.max(1, Math.min(100, Math.round(q)));
	persist();
}

export function setKeepMetadata(v) {
	store.keepMetadata = !!v;
	persist();
}

function statusForInput(ext) {
	return CONVERTIBLE_INPUTS.includes(ext) ? "ready" : "unsupported";
}

function defaultTargetFor(ext) {
	// pick a sensible different default target
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
		to: convertible ? defaultTargetFor(ext) : null,
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
	const ids = [];
	for (const f of fileList) ids.push(addFile(f));
	return ids;
}

export async function addSample(kind) {
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
	f.to = to;
	// changing the target invalidates a prior result
	if (f.resultUrl) {
		URL.revokeObjectURL(f.resultUrl);
		f.resultUrl = null;
		f.resultName = null;
		f.resultSize = null;
	}
	if (f.status === "done" || f.status === "failed") f.status = "ready";
	return true;
}

export function removeFile(id) {
	const i = store.files.findIndex((f) => f.id === id);
	if (i === -1) return false;
	const [f] = store.files.splice(i, 1);
	if (f?.resultUrl) URL.revokeObjectURL(f.resultUrl);
	if (store.selectedId === id) store.selectedId = store.files[0]?.id ?? null;
	return true;
}

export function clearQueue() {
	for (const f of store.files) if (f.resultUrl) URL.revokeObjectURL(f.resultUrl);
	store.files = [];
	store.selectedId = null;
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
