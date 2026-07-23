// Small sample images generated in-app so the convert flow can be exercised
// without a user file (also the WebMCP entity_create path). These are real File
// objects with real bytes, produced client-side; nothing is shipped as a large
// static asset.

export function makeSamplePng() {
	return new Promise((resolve) => {
		const c = document.createElement("canvas");
		c.width = 240;
		c.height = 160;
		const ctx = c.getContext("2d");
		const g = ctx.createLinearGradient(0, 0, 240, 160);
		g.addColorStop(0, "#f8abf8");
		g.addColorStop(1, "#c026d3");
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, 240, 160);
		ctx.fillStyle = "#111111";
		ctx.font = "bold 42px sans-serif";
		ctx.fillText("VERT", 62, 96);
		c.toBlob((b) => {
			resolve(new File([b], "sample-logo.png", { type: "image/png" }));
		}, "image/png");
	});
}

export function makeSampleSvg() {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160" viewBox="0 0 240 160"><rect width="240" height="160" fill="#f8abf8"/><circle cx="120" cy="80" r="52" fill="#c026d3"/><text x="120" y="92" font-size="34" font-family="sans-serif" font-weight="bold" fill="#111" text-anchor="middle">SVG</text></svg>`;
	return Promise.resolve(
		new File([svg], "sample-badge.svg", { type: "image/svg+xml" }),
	);
}

export function makeSample(kind) {
	return kind === "svg" ? makeSampleSvg() : makeSamplePng();
}
