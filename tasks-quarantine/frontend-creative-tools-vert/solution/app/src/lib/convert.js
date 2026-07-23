// Real in-browser image conversion using the browser's native image codecs.
// A file is decoded to an ImageBitmap / <img>, painted to a canvas, and
// re-encoded to the requested raster format. This is a genuine transcode: the
// output bytes differ by target format and by quality, and the result is a real
// downloadable Blob. No network, no wasm asset download.

const MIME = {
	".png": "image/png",
	".jpeg": "image/jpeg",
	".jpg": "image/jpeg",
	".webp": "image/webp",
};

function loadImage(src) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error("Could not decode the source image"));
		img.src = src;
	});
}

async function decode(file) {
	const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
	if (ext === ".svg") {
		const text = await file.text();
		const blob = new Blob([text], { type: "image/svg+xml" });
		const url = URL.createObjectURL(blob);
		try {
			return await loadImage(url);
		} finally {
			// keep url alive until draw; revoke after a tick
			setTimeout(() => URL.revokeObjectURL(url), 2000);
		}
	}
	const url = URL.createObjectURL(file);
	try {
		return await loadImage(url);
	} finally {
		setTimeout(() => URL.revokeObjectURL(url), 2000);
	}
}

/**
 * Convert a File to the target extension. Returns { blob, name }.
 * @param {File} file
 * @param {string} to  target extension including dot, e.g. ".jpeg"
 * @param {number} quality  0-100
 */
export async function convertImage(file, to, quality = 100) {
	const mime = MIME[to];
	if (!mime) throw new Error("Unsupported target format " + to);

	const img = await decode(file);
	const w = img.naturalWidth || img.width || 512;
	const h = img.naturalHeight || img.height || 512;

	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Could not get a drawing context");
	// White matte for formats without alpha so transparency does not read black.
	if (mime === "image/jpeg") {
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, w, h);
	}
	ctx.drawImage(img, 0, 0, w, h);

	const blob = await new Promise((resolve, reject) => {
		canvas.toBlob(
			(b) => (b ? resolve(b) : reject(new Error("Encoding failed"))),
			mime,
			mime === "image/png" ? undefined : Math.max(0.01, quality / 100),
		);
	});

	const base = file.name.replace(/\.[^.]+$/, "");
	const outExt = to === ".jpg" ? ".jpg" : to;
	return { blob, name: base + outExt };
}
