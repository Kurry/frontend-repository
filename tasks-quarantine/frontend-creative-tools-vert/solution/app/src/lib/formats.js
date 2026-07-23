// The VERT support catalog. The Images category is the real, locally-executed
// conversion path in this build (browser-native canvas codecs). The other
// categories are the honest informational catalog VERT advertises; they are not
// claimed to convert offline here.

export const CATEGORIES = [
	{
		id: "images",
		label: "Images",
		support: "local",
		status: "ready",
		real: true,
		formats: [
			".png", ".jpeg", ".jpg", ".webp", ".gif", ".svg", ".jxl", ".avif",
			".heic", ".heif", ".ico", ".bmp", ".cur", ".ani", ".icns", ".nef",
			".cr2", ".hdr", ".jpe", ".mat", ".pbm", ".pfm", ".pgm", ".pnm",
			".ppm", ".tiff", ".jfif",
		],
	},
	{
		id: "audio",
		label: "Audio",
		support: "local",
		status: "ready",
		real: false,
		formats: [
			".mp3", ".wav", ".flac", ".ogg", ".mogg", ".oga", ".opus", ".aac",
			".alac", ".m4a", ".caf", ".wma", ".amr", ".ac3", ".aiff", ".aifc",
			".aif", ".mp1", ".mp2", ".mpc", ".dsd", ".dsf", ".dff", ".mqa", ".au",
		],
	},
	{
		id: "documents",
		label: "Documents",
		support: "local",
		status: "ready",
		real: false,
		formats: [
			".docx", ".doc", ".md", ".html", ".rtf", ".csv", ".tsv", ".json",
			".rst", ".epub", ".odt", ".docbook",
		],
	},
	{
		id: "video",
		label: "Video",
		support: "server",
		status: "ready",
		real: false,
		formats: [
			".mkv", ".mp4", ".webm", ".avi", ".wmv", ".mov", ".gif", ".mts",
			".ts", ".m2ts", ".mpg", ".mpeg", ".flv", ".f4v", ".vob", ".m4v",
			".3gp", ".3g2", ".mxf", ".ogv", ".rm", ".rmvb", ".h264", ".divx",
			".swf",
		],
	},
];

// Input extensions this build can actually decode with a browser-native codec.
export const CONVERTIBLE_INPUTS = [
	".png", ".jpeg", ".jpg", ".webp", ".gif", ".bmp", ".svg",
];

// Real target formats the converter can produce.
export const TARGET_FORMATS = [".png", ".jpeg", ".jpg", ".webp"];

export function extOf(name) {
	const dot = name.lastIndexOf(".");
	return dot === -1 ? "" : name.slice(dot).toLowerCase();
}
