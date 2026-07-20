import { z } from "zod";
import { TARGET_FORMATS } from "./formats.js";

export const SettingsUpdate = z.object({
	quality: z.number().min(1).max(100),
	keepMetadata: z.boolean(),
	defaultTarget: z.enum([TARGET_FORMATS[0], ...TARGET_FORMATS.slice(1)])
});

export const ConversionPreset = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Name is required"),
	quality: z.number().min(1).max(100),
	target: z.enum([TARGET_FORMATS[0], ...TARGET_FORMATS.slice(1)]),
	keepMetadata: z.boolean()
});

export const QueueFile = z.object({
	name: z.string(),
	from: z.string(),
	to: z.string().nullable(),
	status: z.string()
});

export const ConversionSessionDocument = z.object({
	schemaVersion: z.literal("vert-session-v1"),
	settings: SettingsUpdate,
	presets: z.array(ConversionPreset),
	queue: z.array(QueueFile).optional()
});