import { z } from "zod";
import { CATEGORY_IDS, TYPES, ERAS, YEAR_MIN, YEAR_MAX } from "./data";

export const BCE_SENTINEL = "0001-01-01T00:00:00.000Z";

function isoYear(ts) {
  const m = /^(-?\d{4,})-\d{2}-\d{2}T/.exec(ts);
  return m ? parseInt(m[1], 10) : null;
}

function passesCrossField(year, timestamp) {
  if (!timestamp.endsWith("Z")) return false;
  if (year < 1) return timestamp === BCE_SENTINEL;
  const y = isoYear(timestamp);
  return y !== null && y === year;
}

function isIsoUtcTimestamp(value) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) && !Number.isNaN(Date.parse(value));
}

export const TimelineEventSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120, "Title must be 120 characters or fewer"),
    type: z.enum(TYPES, { errorMap: () => ({ message: "Type must be one of " + TYPES.join(", ") }) }),
    timestamp: z
      .string()
      .min(1, "Timestamp is required")
      .refine(isIsoUtcTimestamp, { message: "Timestamp must be ISO-8601 ending with Z" }),
    mediaRefs: z
      .array(z.string().trim().min(1, "Each media reference must be non-empty").max(64))
      .min(1, "At least one mediaRefs entry is required")
      .max(8, "At most eight mediaRefs entries are allowed"),
    year: z.number({ invalid_type_error: "Year must be an integer" }).int("Year must be an integer").min(YEAR_MIN, `Year must be >= ${YEAR_MIN}`).max(YEAR_MAX, `Year must be <= ${YEAR_MAX}`),
    place: z.string().trim().min(1, "Place is required").max(80, "Place must be 80 characters or fewer"),
    categories: z
      .array(z.string())
      .min(1, "At least one category is required")
      .refine((arr) => arr.every((c) => CATEGORY_IDS.includes(c)), { message: "categories must use the closed enum" }),
    summary: z.string().trim().min(1, "Summary is required").max(2000, "Summary must be 2000 characters or fewer"),
    source: z.string().trim().min(1, "Source is required"),
  })
  .strict()
  .refine((d) => passesCrossField(d.year, d.timestamp), {
    message: "When year >= 1 the timestamp's UTC year must equal year; for BCE the timestamp must be 0001-01-01T00:00:00.000Z",
    path: ["timestamp"],
  });

const WindowSchema = z
  .object({
    fromYear: z.number().int("window.fromYear must be an integer").min(YEAR_MIN).max(YEAR_MAX),
    toYear: z.number().int("window.toYear must be an integer").min(YEAR_MIN).max(YEAR_MAX),
  })
  .strict()
  .refine((window) => window.fromYear <= window.toYear, {
    message: "window.fromYear must be less than or equal to window.toYear",
    path: ["fromYear"],
  });

const EraSchema = z
  .object({
    name: z.string(),
    fromYear: z.number().int(),
    toYear: z.number().int(),
  })
  .strict();

export const TimelineJSONSchema = z
  .object({
    version: z.literal(1),
    document: z.literal("media-timeline"),
    window: WindowSchema,
    enabledCategories: z.array(z.enum(CATEGORY_IDS)).refine((items) => new Set(items).size === items.length, {
      message: "enabledCategories must not contain duplicates",
    }),
    eras: z
      .array(EraSchema)
      .length(ERAS.length, `eras must contain exactly the ${ERAS.length} named eras`)
      .refine(
        (eras) => eras.every((era, index) => {
          const expected = ERAS[index];
          return era.name === expected.name && era.fromYear === expected.fromYear && era.toYear === expected.toYear;
        }),
        { message: "eras must match the five named era bands and their bounds" },
      ),
    events: z.array(TimelineEventSchema),
  })
  .strict();

// Per-field validation that returns { field: message } for inline form feedback.
export function validateEventFields(input) {
  const e = {};
  const v = input || {};
  const title = typeof v.title === "string" ? v.title.trim() : "";
  if (!title) e.title = "Title is required (1-120 characters).";
  else if (title.length > 120) e.title = "Title must be 120 characters or fewer.";

  if (!TYPES.includes(v.type)) e.type = `Type must be one of ${TYPES.join(", ")}.`;

  const ts = typeof v.timestamp === "string" ? v.timestamp.trim() : "";
  if (!ts) e.timestamp = "Timestamp is required (ISO-8601 ending with Z).";
  else if (!isIsoUtcTimestamp(ts)) e.timestamp = "Timestamp must be ISO-8601 ending with Z.";

  const year = v.year;
  const yearNum = typeof year === "string" && year.trim() !== "" ? Number(year) : year;
  if (year === "" || year === null || year === undefined || typeof yearNum !== "number" || !Number.isInteger(yearNum)) {
    e.year = "Year must be an integer from -4000 to 2100.";
  } else if (yearNum < -4000 || yearNum > 2100) {
    e.year = "Year must be an integer from -4000 to 2100.";
  }

  if (!e.timestamp && !e.year && !passesCrossField(yearNum, ts)) {
    e.timestamp = "For year >= 1 the timestamp's UTC year must equal year; for BCE use 0001-01-01T00:00:00.000Z.";
  }

  let refs = v.mediaRefs;
  if (typeof refs === "string") refs = refs.split(";");
  if (!Array.isArray(refs)) refs = [];
  refs = refs.map((r) => (typeof r === "string" ? r.trim() : ""));
  if (refs.length === 0) e.mediaRefs = "At least one mediaRefs entry is required.";
  else if (refs.length > 8) e.mediaRefs = "At most eight mediaRefs entries are allowed.";
  else if (refs.some((r) => !r || r.length > 64)) e.mediaRefs = "Each media reference must be 1-64 non-empty characters.";

  const place = typeof v.place === "string" ? v.place.trim() : "";
  if (!place) e.place = "Place is required (1-80 characters).";
  else if (place.length > 80) e.place = "Place must be 80 characters or fewer.";

  let cats = v.categories;
  if (typeof cats === "string") cats = cats.split("|");
  if (!Array.isArray(cats)) cats = [];
  cats = cats.filter((c) => typeof c === "string" && c.trim());
  if (cats.length === 0) e.categories = "Select at least one category.";
  else if (cats.some((c) => !CATEGORY_IDS.includes(c))) e.categories = "Categories must come from the closed set.";

  const summary = typeof v.summary === "string" ? v.summary.trim() : "";
  if (!summary) e.summary = "Summary is required (1-2000 characters).";
  else if (summary.length > 2000) e.summary = "Summary must be 2000 characters or fewer.";

  return { errors: e, ok: Object.keys(e).length === 0 };
}

// Normalize a raw form value into a contract-shaped event record (the would-be request body).
export function normalizeEvent(input, fallbackSource = "user") {
  let refs = input.mediaRefs;
  if (typeof refs === "string") refs = refs.split(";");
  if (!Array.isArray(refs)) refs = [];
  refs = refs.map((r) => (typeof r === "string" ? r.trim() : "")).filter(Boolean);

  let cats = input.categories;
  if (typeof cats === "string") cats = cats.split("|");
  if (!Array.isArray(cats)) cats = [];
  cats = cats.map((c) => (typeof c === "string" ? c.trim() : "")).filter(Boolean);

  const year = typeof input.year === "string" ? Number(input.year) : input.year;
  return {
    title: (input.title || "").trim(),
    type: input.type,
    timestamp: (input.timestamp || "").trim(),
    mediaRefs: refs,
    year,
    place: (input.place || "").trim(),
    categories: cats,
    summary: (input.summary || "").trim(),
    source: (typeof input.source === "string" && input.source.trim()) ? input.source.trim() : fallbackSource,
  };
}

// Validate an import document; returns { ok, doc } or { ok:false, message } naming the offending field.
export function validateImportDocument(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    return { ok: false, message: `document is not valid JSON: ${err.message}` };
  }
  const result = TimelineJSONSchema.safeParse(parsed);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue.path?.length ? issue.path.join(".") : "document";
    return { ok: false, message: `field ${field}: ${issue.message}` };
  }
  return { ok: true, doc: result.data };
}

export { ERAS };
