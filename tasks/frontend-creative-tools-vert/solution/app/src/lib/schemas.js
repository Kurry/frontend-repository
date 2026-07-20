import { z } from "zod";

export const TargetFormat = z.enum(["png", "jpeg", "jpg", "webp"]);
export const InputFormat = z.enum(["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg"]);
export const FileStatus = z.enum(["Ready", "Converting", "Done", "Failed", "Unsupported"]);

export const SettingsUpdate = z.object({
	quality: z.number().int().min(1).max(100),
	keepMetadata: z.boolean(),
	defaultTarget: TargetFormat,
	theme: z.enum(["light", "dark"])
});

export const ConversionPreset = z.object({
	name: z.string().trim().min(1, "Name is required").max(64, "Name must be 64 characters or fewer"),
	target: TargetFormat,
	quality: z.number().int().min(1).max(100)
});

export const QueueFile = z.object({
	name: z.string().min(1),
	from: InputFormat,
	to: TargetFormat,
	status: FileStatus,
	selected: z.boolean(),
	inputSize: z.number().nonnegative(),
	outputSize: z.number().nonnegative().nullable().optional()
}).superRefine((file, ctx) => {
	if (file.status === "Done" && typeof file.outputSize !== "number") {
		ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["outputSize"], message: "outputSize is required when status is Done" });
	}
	if (file.status !== "Done" && file.outputSize != null) {
		ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["outputSize"], message: "outputSize must be null when status is not Done" });
	}
});

export const ConversionSessionDocument = z.object({
	schemaVersion: z.literal("vert-session-v1"),
	quality: z.number().int().min(1).max(100),
	keepMetadata: z.boolean(),
	theme: z.enum(["light", "dark"]),
	activeCategory: z.enum(["Images", "Audio", "Documents", "Video"]),
	defaultTarget: TargetFormat,
	presets: z.array(ConversionPreset),
	files: z.array(QueueFile),
	exportedAt: z.string().datetime({ offset: true })
});
